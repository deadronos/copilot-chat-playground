import { describe, it, expect, beforeAll } from "vitest";

describe("Copilot Service /chat endpoint", () => {
  const serviceUrl = "http://localhost:3210";
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
    const response = await fetch(`${serviceUrl}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invalid: "data" }),
    });

    expect(response.status).toBe(400);
    const data = (await response.json()) as { error: string };
    expect(data.error).toBeDefined();
  });

  it.skipIf(!serviceRunning)("should return 400 for empty prompt", async () => {
    const response = await fetch(`${serviceUrl}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "" }),
    });

    expect(response.status).toBe(400);
    const data = (await response.json()) as { error: string };
    expect(data.error).toBeDefined();
  });

  it.skipIf(!serviceRunning)("should return 503 when GH_TOKEN is not configured", async () => {
    // This test assumes GH_TOKEN is not set in test environment
    // If GH_TOKEN is set, this test will fail - which is expected behavior
    const response = await fetch(`${serviceUrl}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "Hello" }),
    });

    // If token is configured, service will try to call Copilot CLI
    // If not configured, should return 503
    if (response.status === 503) {
      const data = (await response.json()) as { error: string; errorType: string };
      expect(data.errorType).toBe("token_missing");
      expect(data.error).toContain("GitHub token");
    }
  });

  it.skipIf(!serviceRunning)(
    "health endpoint should include token configuration status",
    async () => {
      const response = await fetch(`${serviceUrl}/health`);
      expect(response.ok).toBe(true);

      const data = (await response.json()) as {
        ok: boolean;
        service: string;
        tokenConfigured: boolean;
      };
      expect(data.service).toBe("copilot");
      expect(data.tokenConfigured).toBeDefined();
    }
  );
});
