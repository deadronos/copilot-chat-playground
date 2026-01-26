import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { spawn } from "node:child_process";
import { probeCliModels, getCachedModels, clearModelsCache } from "../../../src/copilot/src/cli-models-probe.js";
import { getMetric, resetMetrics } from "../../../src/copilot/src/metrics.js";
import { createEventBus } from "../../../src/shared/src/index.js";

// Mock child_process spawn
vi.mock("node:child_process", () => {
  return {
    spawn: vi.fn(),
  };
});

describe("CLI Models Probe", () => {
  const originalEnv = process.env;
  const eventBus = createEventBus();

  beforeEach(() => {
    // Reset env and metrics before each test
    process.env = { ...originalEnv };
    resetMetrics();
    clearModelsCache();
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore original env
    process.env = originalEnv;
  });

  describe("probeCliModels", () => {
    it("should parse models from JSON output when available", async () => {
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

      const result = await probeCliModels();
      
      expect(result.source).toBe("cli");
      expect(result.models).toContain("gpt-4");
      expect(result.models).toContain("gpt-3-5-turbo");
      expect(result.models.length).toBe(2);
      expect(result.error).toBeUndefined();
    });

    it("should parse models from allowed choices error message", async () => {
      // Mock spawn to return error with allowed choices
      const mockSpawn = vi.mocked(spawn);
      const mockChild = {
        stdout: {
          on: vi.fn(),
        },
        stderr: {
          on: vi.fn((event, callback) => {
            if (event === "data") {
              callback(Buffer.from("Error: Invalid model. Allowed choices are: gpt-4, gpt-3-5-turbo, claude-3-opus"));
            }
          }),
        },
        on: vi.fn((event, callback) => {
          if (event === "close") {
            callback(1);
          }
        }),
      };
      
      mockSpawn.mockReturnValue(mockChild as any);

      const result = await probeCliModels();
      
      expect(result.source).toBe("cli");
      expect(result.models).toContain("gpt-4");
      expect(result.models).toContain("gpt-3-5-turbo");
      expect(result.models).toContain("claude-3-opus");
      expect(result.models.length).toBe(3);
    });

    it("should return fallback models when CLI is not available", async () => {
      // Mock spawn to throw ENOENT error
      const mockSpawn = vi.mocked(spawn);
      mockSpawn.mockImplementation(() => {
        const error = new Error("spawn ENOENT");
        (error as any).code = "ENOENT";
        throw error;
      });

      const result = await probeCliModels();
      
      expect(result.source).toBe("fallback");
      expect(result.models.length).toBeGreaterThan(0);
      expect(result.models).toContain("gpt-4");
      expect(result.models).toContain("claude-3-opus");
    });

    it("should handle timeout gracefully", async () => {
      // Mock spawn to throw timeout error
      const mockSpawn = vi.mocked(spawn);
      mockSpawn.mockImplementation(() => {
        const error = new Error("Command timed out");
        (error as any).code = "ETIMEDOUT";
        throw error;
      });

      const result = await probeCliModels();
      
      // Should fall back to fallback models
      expect(result.source).toBe("fallback");
      expect(result.models.length).toBeGreaterThan(0);
    });

    it("should increment metrics on probe attempt", async () => {
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

      // Reset metrics before test
      resetMetrics();

      await probeCliModels();
      
      // Check that metrics were incremented
      const probeCount = getMetric("model_probe_count");
      expect(probeCount).toBe(1);
    });

    it("should emit logs when eventBus is provided", async () => {
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

      // Spy on eventBus emitLog
      const emitLogSpy = vi.spyOn(eventBus, "emitLog");

      await probeCliModels(eventBus);
      
      expect(emitLogSpy).toHaveBeenCalledWith(expect.objectContaining({
        event_type: "cli.models.probe.start",
      }));
      expect(emitLogSpy).toHaveBeenCalledWith(expect.objectContaining({
        event_type: "cli.models.probe.parsed",
      }));
    });
  });

  describe("getCachedModels", () => {
    it("should return cached result when cache is valid", async () => {
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

      // First call - should probe
      const firstResult = await getCachedModels();
      expect(firstResult.cached).toBe(false);
      expect(firstResult.models).toContain("gpt-4");

      // Second call - should use cache
      const secondResult = await getCachedModels();
      expect(secondResult.cached).toBe(true);
      expect(secondResult.models).toContain("gpt-4");
    });

    it("should respect refresh flag and force re-probe", async () => {
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

      // First call
      const firstResult = await getCachedModels();
      expect(firstResult.cached).toBe(false);
      expect(firstResult.models.length).toBe(1);

      // Second call with refresh=true - should re-probe
      const secondResult = await getCachedModels(undefined, true);
      expect(secondResult.cached).toBe(false);
      expect(secondResult.models.length).toBe(2);
    });

    it("should respect COPILOT_MODELS_TTL_SECONDS environment variable", async () => {
      // Set custom TTL
      process.env.COPILOT_MODELS_TTL_SECONDS = "1"; // 1 second

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

      // First call
      const firstResult = await getCachedModels();
      expect(firstResult.cached).toBe(false);

      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Second call - should re-probe due to expired cache
      const secondResult = await getCachedModels();
      expect(secondResult.cached).toBe(false);
    });

    it("should include ttlExpiresAt in response", async () => {
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

      const result = await getCachedModels();
      
      expect(result.ttlExpiresAt).toBeDefined();
      expect(new Date(result.ttlExpiresAt).getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe("normalization and deduplication", () => {
    it("should normalize and deduplicate model IDs", async () => {
      // Mock spawn to return messy data
      const mockSpawn = vi.mocked(spawn);
      const mockChild = {
        stdout: {
          on: vi.fn((event, callback) => {
            if (event === "data") {
              callback(Buffer.from('{"models": ["  gpt-4  ", "gpt-4", "(gpt-3-5-turbo)"]}'));
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

      const result = await probeCliModels();
      
      // Check that models are normalized and deduplicated
      expect(result.models).toContain("gpt-4");
      expect(result.models).toContain("gpt-3-5-turbo");
      expect(result.models.length).toBe(2); // Should be deduplicated
    });
  });
});
