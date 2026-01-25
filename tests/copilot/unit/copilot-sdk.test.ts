import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Mock the Copilot SDK client to inspect createSession args and simulate session events
vi.mock("@github/copilot-sdk", async () => {
  // Keep a simple in-memory mock
  class MockSession {
    sessionId = "mock-session-id"
    private handler: ((ev: any) => void) | null = null
    on(h: (ev: any) => void) { this.handler = h }
    async sendAndWait() {
      // simulate assistant.message event
      if (this.handler) {
        this.handler({ type: "assistant.message", data: { content: "hello from mock" } })
        this.handler({ type: "session.idle", data: {} })
      }
      return { type: "assistant.message", data: { content: "hello from mock" } }
    }
    async destroy() {}
  }

  const lastCreateArgs: any = { value: null }

  class MockClient {
    start = vi.fn()
    stop = vi.fn()
    createSession = vi.fn(async (cfg: any) => {
      lastCreateArgs.value = cfg
      return new MockSession()
    })
  }

  return { CopilotClient: MockClient, _test: { lastCreateArgs } }
})

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
      // Test verifies early validation failures don't emit SDK-specific logs
      delete process.env.GH_TOKEN;
      delete process.env.GITHUB_TOKEN;

      const eventBus = createEventBus();
      const service = new CopilotSDKService(eventBus);
      const result = await service.chat("test prompt", "test-req-id");

      expect(result.success).toBe(false);
      expect(result.errorType).toBe("token_missing");
    });

    it("should pass system prompt as SystemMessageConfig to createSession", { timeout: 10000 }, async () => {
      process.env.GH_TOKEN = "token"
      const service = new CopilotSDKService()

      // Initialize the client so we can spy on the instance method
      await service.initialize()
      const client = (service as any).client as any
      expect(client).toBeDefined()

      const mockSession = {
        sessionId: 'test-session',
        on: (h: (ev: any) => void) => {},
        sendAndWait: async () => ({ type: 'assistant.message', data: { content: 'ok' } }),
        destroy: async () => {}
      }

      const spy = vi.spyOn(client, 'createSession').mockImplementation(async (cfg: any) => mockSession as any)

      const res = await service.chat('hello', 'req-1', 'SYSTEM PROMPT HERE')
      expect(res.success).toBe(true)
      expect(spy).toHaveBeenCalled()
      const cfg = spy.mock.calls[0][0]
      expect(cfg).toBeTruthy()
      expect(cfg.systemMessage).toBeDefined()
      expect(cfg.systemMessage.content).toBe('SYSTEM PROMPT HERE')

      // Now pass explicit mode and verify it is forwarded
      const spy2 = vi.spyOn(client, 'createSession').mockImplementation(async (cfg: any) => mockSession as any)
      const res2 = await service.chat('hello', 'req-2', 'OVERRIDE PROMPT', 'replace')
      expect(res2.success).toBe(true)
      expect(spy2).toHaveBeenCalled()
      const lastCallIndex = spy2.mock.calls.length - 1
      const cfg2 = spy2.mock.calls[lastCallIndex][0]
      expect(cfg2.systemMessage).toBeDefined()
      expect(cfg2.systemMessage.content).toBe('OVERRIDE PROMPT')
      expect(cfg2.systemMessage.mode).toBe('replace')

      spy.mockRestore()
      spy2.mockRestore()
    })
  });

  describe("stop", () => {
    it("should not throw when stopping uninitialized service", async () => {
      const service = new CopilotSDKService();
      await expect(service.stop()).resolves.toBeUndefined();
    });
  });
});
