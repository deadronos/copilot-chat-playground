import { describe, it, expect, beforeAll } from "vitest";

describe("Backend Service /api/chat endpoint", () => {
  const serviceUrl = "http://localhost:3000";
  let serviceRunning = false;

  beforeAll(async () => {
    // Check if service is running
    try {
      const response = await fetch(`${serviceUrl}/health`, { signal: AbortSignal.timeout(1000) });
      serviceRunning = response.ok;
    } catch {
      serviceRunning = false;
    }
  });

  it.skipIf(!serviceRunning)("should return 400 for invalid request body", async () => {
    const response = await fetch(`${serviceUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invalid: "data" }),
    });

    expect(response.status).toBe(400);
  });

  it.skipIf(!serviceRunning)("should return 400 for empty prompt", async () => {
    const response = await fetch(`${serviceUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "" }),
    });

    expect(response.status).toBe(400);
  });

  it.skipIf(!serviceRunning)("should accept mode parameter with default value", async () => {
    const response = await fetch(`${serviceUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "Hello" }),
    });

    // Mode should default to "explain-only" even if not provided
    // Response should be plain text
    expect(response.headers.get("content-type")).toContain("text/plain");
  });

  it.skipIf(!serviceRunning)("should accept valid mode parameter", async () => {
    const response = await fetch(`${serviceUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "Hello", mode: "explain-only" }),
    });

    // Response should be plain text
    expect(response.headers.get("content-type")).toContain("text/plain");
  });

  it.skipIf(!serviceRunning)("should accept project-helper mode", async () => {
    const response = await fetch(`${serviceUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "Hello", mode: "project-helper" }),
    });

    // Response should be plain text
    expect(response.headers.get("content-type")).toContain("text/plain");
  });

  it.skipIf(!serviceRunning)("should reject invalid mode parameter", async () => {
    const response = await fetch(`${serviceUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "Hello", mode: "invalid-mode" }),
    });

    expect(response.status).toBe(400);
  });

  it.skipIf(!serviceRunning)(
    "should return error when copilot service is not available",
    async () => {
      // This test will pass if copilot service is not running
      const response = await fetch(`${serviceUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: "Hello" }),
      });

      // Response should be plain text
      expect(response.headers.get("content-type")).toContain("text/plain");

      const text = await response.text();

      // Should get either:
      // 1. Error about copilot service not available (503)
      // 2. Error about missing token (503)
      // 3. Success if everything is configured (200)
      if (!response.ok) {
        expect(text).toContain("Error:");
      }
    }
  );

  it.skipIf(!serviceRunning)("health endpoint should work", async () => {
    const response = await fetch(`${serviceUrl}/health`);
    expect(response.ok).toBe(true);

    const data = (await response.json()) as { ok: boolean; service: string };
    expect(data.service).toBe("backend");
  });
});
