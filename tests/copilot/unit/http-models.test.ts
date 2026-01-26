import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { spawn } from "node:child_process";
import { createApp } from "../../../src/copilot/src/index.js";
import { resetMetrics } from "../../../src/copilot/src/metrics.js";
import type { AddressInfo } from "node:net";

// Mock child_process spawn
vi.mock("node:child_process", () => {
  return {
    spawn: vi.fn(),
  };
});

describe("/models endpoint", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset env and metrics before each test
    process.env = { ...originalEnv };
    resetMetrics();
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore original env
    process.env = originalEnv;
  });

  it("should return models from probe with cache info", async () => {
    // Mock spawn to return JSON output
    const mockSpawn = vi.mocked(spawn);
    const mockChild = {
      stdout: {
        on: vi.fn((event, callback) => {
          if (event === "data") {
            callback(Buffer.from('{"models": ["gpt-4", "gpt-3-5-turbo"]}'));
          }
        }),
      },
      stderr: {
        on: vi.fn(),
      },
      on: vi.fn((event, callback) => {
        if (event === "close") {
          callback(0);
        }
      }),
    };
    
    mockSpawn.mockReturnValue(mockChild as any);

    const app = createApp();
    const server = app.listen(0);

    const address = server.address() as AddressInfo;
    const url = `http://127.0.0.1:${address.port}`;

    const res = await fetch(`${url}/models`);
    const json = await res.json();

    server.close();

    expect(res.ok).toBe(true);
    expect(json.source).toBe("cli");
    expect(json.models).toContain("gpt-4");
    expect(json.models).toContain("gpt-3-5-turbo");
    expect(json.cached).toBe(false);
    expect(json.ttlExpiresAt).toBeDefined();
    expect(json.error).toBeUndefined();
  });

  it("should return cached result on second call", async () => {
    // Mock spawn to return JSON output
    const mockSpawn = vi.mocked(spawn);
    const mockChild = {
      stdout: {
        on: vi.fn((event, callback) => {
          if (event === "data") {
            callback(Buffer.from('{"models": ["gpt-4"]}'));
          }
        }),
      },
      stderr: {
        on: vi.fn(),
      },
      on: vi.fn((event, callback) => {
        if (event === "close") {
          callback(0);
        }
      }),
    };
    
    mockSpawn.mockReturnValue(mockChild as any);

    const app = createApp();
    const server = app.listen(0);

    const address = server.address() as AddressInfo;
    const url = `http://127.0.0.1:${address.port}`;

    // First call
    const res1 = await fetch(`${url}/models`);
    const json1 = await res1.json();

    // Second call - should be cached
    const res2 = await fetch(`${url}/models`);
    const json2 = await res2.json();

    server.close();

    expect(json1.cached).toBe(false);
    expect(json2.cached).toBe(true);
  });

  it("should respect refresh=true query parameter", async () => {
    // Mock spawn to return different results
    const mockSpawn = vi.mocked(spawn);
    let callCount = 0;
    
    const mockChild = {
      stdout: {
        on: vi.fn((event, callback) => {
          if (event === "data") {
            if (callCount === 0) {
              callback(Buffer.from('{"models": ["gpt-4"]}'));
            } else {
              callback(Buffer.from('{"models": ["gpt-4", "gpt-3.5-turbo"]}'));
            }
            callCount++;
          }
        }),
      },
      stderr: {
        on: vi.fn(),
      },
      on: vi.fn((event, callback) => {
        if (event === "close") {
          callback(0);
        }
      }),
    };
    
    mockSpawn.mockReturnValue(mockChild as any);

    const app = createApp();
    const server = app.listen(0);

    const address = server.address() as AddressInfo;
    const url = `http://127.0.0.1:${address.port}`;

    // First call
    const res1 = await fetch(`${url}/models`);
    const json1 = await res1.json();

    // Second call with refresh=true
    const res2 = await fetch(`${url}/models?refresh=true`);
    const json2 = await res2.json();

    server.close();

    expect(json1.cached).toBe(false);
    expect(json1.models.length).toBe(1);
    expect(json2.cached).toBe(false);
    expect(json2.models.length).toBe(2);
  });

  it("should return fallback models when CLI probe fails", async () => {
    // Mock spawn to throw error
    const mockSpawn = vi.mocked(spawn);
    mockSpawn.mockImplementation(() => {
      const error = new Error("spawn ENOENT");
      (error as any).code = "ENOENT";
      throw error;
    });

    const app = createApp();
    const server = app.listen(0);

    const address = server.address() as AddressInfo;
    const url = `http://127.0.0.1:${address.port}`;

    const res = await fetch(`${url}/models`);
    const json = await res.json();

    server.close();

    expect(res.ok).toBe(true);
    expect(json.source).toBe("fallback");
    expect(json.models.length).toBeGreaterThan(0);
    expect(json.cached).toBe(false);
  });

  it("should return 500 and error details when probe throws exception", async () => {
    // Mock spawn to throw unexpected error
    const mockSpawn = vi.mocked(spawn);
    mockSpawn.mockImplementation(() => {
      throw new Error("Unexpected error");
    });

    const app = createApp();
    const server = app.listen(0);

    const address = server.address() as AddressInfo;
    const url = `http://127.0.0.1:${address.port}`;

    const res = await fetch(`${url}/models`);
    const json = await res.json();

    server.close();

    expect(res.status).toBe(500);
    expect(json.source).toBe("error");
    expect(json.models.length).toBe(0);
    expect(json.error).toContain("Unexpected error");
  });

  it("should include model probe metrics in /metrics endpoint", async () => {
    // Mock spawn to return JSON output
    const mockSpawn = vi.mocked(spawn);
    const mockChild = {
      stdout: {
        on: vi.fn((event, callback) => {
          if (event === "data") {
            callback(Buffer.from('{"models": ["gpt-4"]}'));
          }
        }),
      },
      stderr: {
        on: vi.fn(),
      },
      on: vi.fn((event, callback) => {
          if (event === "close") {
            callback(0);
          }
        }),
      };
    
    mockSpawn.mockReturnValue(mockChild as any);

    const app = createApp();
    const server = app.listen(0);

    const address = server.address() as AddressInfo;
    const url = `http://127.0.0.1:${address.port}`;

    // Call /models to trigger probe
    await fetch(`${url}/models`);

    // Check /metrics
    const res = await fetch(`${url}/metrics`);
    const text = await res.text();

    server.close();

    expect(text).toMatch(/# HELP copilot_model_probe_total/);
    expect(text).toMatch(/copilot_model_probe_total \d+/); // Check that it's a number
  });
});
