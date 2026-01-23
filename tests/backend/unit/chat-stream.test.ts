// @ts-nocheck

import { afterEach, describe, expect, it } from "vitest";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { createApp } from "../../../src/backend/src/app.js";

type ServerHandles = {
  copilotServer: Server;
  backendServer: Server;
  previousCopilotUrl: string | undefined;
};

let activeServers: ServerHandles | undefined;

function getServerUrl(server: Server): string {
  const address = server.address() as AddressInfo;
  return `http://127.0.0.1:${address.port}`;
}

async function setupServers(options: {
  streamAvailable: boolean;
  bufferedOutput?: string;
  streamDelayMs?: number;
}): Promise<ServerHandles> {
  const previousCopilotUrl = process.env.COPILOT_SERVICE_URL;
  const bufferedOutput = options.bufferedOutput ?? "Buffered response";
  const streamDelayMs = options.streamDelayMs ?? 5;

  const copilotServer = createServer((req: IncomingMessage, res: ServerResponse) => {
    if (req.method === "POST" && req.url === "/chat/stream") {
      if (!options.streamAvailable) {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Not found");
        return;
      }

      res.writeHead(200, {
        "Content-Type": "text/plain; charset=utf-8",
      });
      res.write("Hello ");
      setTimeout(() => res.end("world"), streamDelayMs);
      return;
    }

    if (req.method === "POST" && req.url === "/chat") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ output: bufferedOutput }));
      return;
    }

    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  });

  await new Promise<void>((resolve) => {
    copilotServer.listen(0, resolve);
  });

  process.env.COPILOT_SERVICE_URL = getServerUrl(copilotServer);

  const app = createApp();
  const backendServer = app.listen(0);

  return { copilotServer, backendServer, previousCopilotUrl };
}

async function teardownServers(): Promise<void> {
  if (!activeServers) {
    return;
  }

  process.env.COPILOT_SERVICE_URL = activeServers.previousCopilotUrl;

  await new Promise<void>((resolve) =>
    activeServers?.backendServer.close(() => resolve())
  );
  await new Promise<void>((resolve) =>
    activeServers?.copilotServer.close(() => resolve())
  );

  activeServers = undefined;
}

function replaceCopilotHandler(
  handler: (req: import("node:http").IncomingMessage, res: import("node:http").ServerResponse) => void
): void {
  if (!activeServers) {
    throw new Error("Servers not initialized");
  }

  activeServers.copilotServer.removeAllListeners("request");
  activeServers.copilotServer.on("request", handler);
}

afterEach(async () => {
  await teardownServers();
});

describe("Backend /api/chat streaming", () => {
  it("streams text from the copilot streaming endpoint", async () => {
    activeServers = await setupServers({ streamAvailable: true });

    const response = await fetch(`${getServerUrl(activeServers.backendServer)}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "Hello", mode: "explain-only" }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Unexpected status ${response.status}: ${text}`);
    }
    expect(response.headers.get("content-type")).toContain("text/plain");
    expect(response.body).toBeTruthy();

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("Missing response body stream");
    }

    const decoder = new TextDecoder();
    let output = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      }
      output += decoder.decode(value, { stream: true });
    }

    output += decoder.decode();

    expect(output).toBe("Hello world");
  });

  it("falls back to buffered response when streaming is unavailable", async () => {
    activeServers = await setupServers({
      streamAvailable: false,
      bufferedOutput: "Fallback response",
    });

    const response = await fetch(`${getServerUrl(activeServers.backendServer)}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "Hello", mode: "explain-only" }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Unexpected status ${response.status}: ${text}`);
    }
    const text = await response.text();
    expect(text).toBe("Fallback response");
  });

  it("aborts the upstream stream when the client disconnects", async () => {
    let upstreamClosed = false;

    activeServers = await setupServers({ streamAvailable: true, streamDelayMs: 50 });

    replaceCopilotHandler((req, res) => {
      if (req.method === "POST" && req.url === "/chat/stream") {
        res.writeHead(200, {
          "Content-Type": "text/plain; charset=utf-8",
        });
        res.write("Hello ");
        res.on("close", () => {
          upstreamClosed = true;
        });
        setTimeout(() => res.end("world"), 200);
        return;
      }

      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
    });

    const controller = new AbortController();
    const response = await fetch(`${getServerUrl(activeServers.backendServer)}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "Hello", mode: "explain-only" }),
      signal: controller.signal,
    });

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("Missing response body stream");
    }

    await reader.read();
    controller.abort();

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(upstreamClosed).toBe(true);
  });

  it("returns auth error when streaming endpoint rejects the request", async () => {
    activeServers = await setupServers({ streamAvailable: true });

    replaceCopilotHandler((_req, res) => {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        error: "Auth failed",
        errorType: "auth",
      }));
    });

    const response = await fetch(`${getServerUrl(activeServers.backendServer)}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "Hello", mode: "explain-only" }),
    });

    const text = await response.text();
    expect(response.status).toBe(401);
    expect(text).toContain("GitHub Copilot authentication failed");
  });

  it("returns token missing error when streaming endpoint reports missing token", async () => {
    activeServers = await setupServers({ streamAvailable: true });

    replaceCopilotHandler((_req, res) => {
      res.writeHead(503, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        error: "Missing token",
        errorType: "token_missing",
      }));
    });

    const response = await fetch(`${getServerUrl(activeServers.backendServer)}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "Hello", mode: "explain-only" }),
    });

    const text = await response.text();
    expect(response.status).toBe(503);
    expect(text).toContain("GitHub Copilot is not configured");
  });

  it("returns connection error when copilot service is unreachable", async () => {
    activeServers = await setupServers({ streamAvailable: true });

    const badUrl = "http://127.0.0.1:1";
    const previousUrl = process.env.COPILOT_SERVICE_URL;
    process.env.COPILOT_SERVICE_URL = badUrl;

    const response = await fetch(`${getServerUrl(activeServers.backendServer)}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "Hello", mode: "explain-only" }),
    });

    const text = await response.text();
    expect(response.status).toBe(503);
    expect(text).toContain("Could not connect to Copilot service");

    process.env.COPILOT_SERVICE_URL = previousUrl;
  });

  it("falls back to buffered response when streaming endpoint is empty", async () => {
    activeServers = await setupServers({ streamAvailable: true });

    replaceCopilotHandler((req, res) => {
      if (req.method === "POST" && req.url === "/chat/stream") {
        res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
        res.end();
        return;
      }

      if (req.method === "POST" && req.url === "/chat") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ output: "Buffered fallback" }));
        return;
      }

      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
    });

    const response = await fetch(`${getServerUrl(activeServers.backendServer)}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "Hello", mode: "explain-only" }),
    });

    const text = await response.text();
    expect(response.status).toBe(200);
    expect(text).toBe("Buffered fallback");
  });
});
