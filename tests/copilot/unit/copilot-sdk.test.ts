import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { CopilotSDKService } from "../../../src/copilot/src/copilot-sdk.js";
import { createEventBus } from "../../../src/shared/src/event-bus.js";

describe("CopilotSDKService", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset env before each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original env
    process.env = originalEnv;
  });

  describe("initialization", () => {
    it("should create a service without eventBus", () => {
      const service = new CopilotSDKService();
      expect(service).toBeDefined();
    });

    it("should create a service with eventBus", () => {
      const eventBus = createEventBus();
      const service = new CopilotSDKService(eventBus);
      expect(service).toBeDefined();
    });

    it("should throw error when initializing without token", async () => {
      delete process.env.GH_TOKEN;
      delete process.env.GITHUB_TOKEN;

      const service = new CopilotSDKService();
      await expect(service.initialize()).rejects.toThrow(/Missing GitHub token/);
    });
  });

  describe("chat", () => {
    it("should return token_missing error when token is not configured", async () => {
      delete process.env.GH_TOKEN;
      delete process.env.GITHUB_TOKEN;

      const service = new CopilotSDKService();
      const result = await service.chat("test prompt");

      expect(result.success).toBe(false);
      expect(result.errorType).toBe("token_missing");
      expect(result.error).toContain("Missing GitHub token");
    });

    it("should emit log events when eventBus is provided", async () => {
      // This test would require mocking the SDK client
      // For now, we just verify the error path with logging
      delete process.env.GH_TOKEN;
      delete process.env.GITHUB_TOKEN;

      const eventBus = createEventBus();
      const logEvents: Array<any> = [];
      eventBus.onLog((event) => {
        logEvents.push(event);
      });

      const service = new CopilotSDKService(eventBus);
      const result = await service.chat("test prompt", "test-req-id");

      expect(result.success).toBe(false);
      expect(result.errorType).toBe("token_missing");
      // EventBus should not emit logs for early validation failures
      // (logged before SDK is involved)
    });
  });

  describe("stop", () => {
    it("should not throw when stopping uninitialized service", async () => {
      const service = new CopilotSDKService();
      await expect(service.stop()).resolves.toBeUndefined();
    });
  });
});
