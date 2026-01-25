import { afterEach, describe, expect, it } from "vitest";
import { createServer, type Server, type IncomingMessage, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { createApp } from "../../../src/backend/src/app.js";

type ServerHandles = {
  copilotServer: Server;
  backendServer: Server;
  previousCopilotUrl: string | undefined;
  setStreamAvailable: (available: boolean) => void;
};

let activeServers: ServerHandles | undefined;

function getServerUrl(server: Server): string {
  const address = server.address() as AddressInfo;
  return `http://127.0.0.1:${address.port}`;
}

async function setupServers(streamPayload: string): Promise<ServerHandles> {
  const previousCopilotUrl = process.env.COPILOT_SERVICE_URL;
  let streamAvailable = true;

  const copilotServer = createServer((req: IncomingMessage, res: ServerResponse) => {
    if (req.method === "POST" && req.url === "/chat/stream") {
      if (!streamAvailable) {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Not found");
        return;
      }

      res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
      res.write(streamPayload.slice(0, 5));
      res.end(streamPayload.slice(5));
      return;
    }

    if (req.method === "POST" && req.url === "/chat") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ output: streamPayload }));
      return;
    }

    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  });

  await new Promise<void>((resolve) => copilotServer.listen(0, resolve));

  process.env.COPILOT_SERVICE_URL = getServerUrl(copilotServer);
  const app = createApp();
  const backendServer = app.listen(0);

  return {
    copilotServer,
    backendServer,
    previousCopilotUrl,
    setStreamAvailable: (available: boolean) => {
      streamAvailable = available;
    },
  };
}

async function teardownServers(): Promise<void> {
  if (!activeServers) return;
  process.env.COPILOT_SERVICE_URL = activeServers.previousCopilotUrl;
  await new Promise<void>((resolve) => activeServers?.backendServer.close(() => resolve()));
  await new Promise<void>((resolve) => activeServers?.copilotServer.close(() => resolve()));
  activeServers = undefined;
}

afterEach(async () => {
  await teardownServers();
});

describe("Backend /api/chat streaming parity", () => {
  it("returns the same output for streaming and buffered fallback", async () => {
    activeServers = await setupServers("Hello parity");
    const backendUrl = getServerUrl(activeServers.backendServer);

    const streamResponse = await fetch(`${backendUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "Hello", mode: "explain-only" }),
    });
    const streamText = await streamResponse.text();

    activeServers.setStreamAvailable(false);

    const fallbackResponse = await fetch(`${backendUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "Hello", mode: "explain-only" }),
    });
    const fallbackText = await fallbackResponse.text();

    expect(streamText).toBe("Hello parity");
    expect(fallbackText).toBe("Hello parity");
  });
});
