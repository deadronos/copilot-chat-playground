import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { callCopilotCLI } from "../../../src/copilot/src/copilot-cli.js";

// Mock child_process.spawn
vi.mock("node:child_process", () => {
  return {
    spawn: vi.fn(),
  } as any;
});

import { spawn } from "node:child_process";

describe("callCopilotCLI fallback behavior", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.GH_TOKEN = "test-token";
    (spawn as unknown as vi.Mock).mockReset();
  });

  afterEach(() => {
    process.env = originalEnv;
    (spawn as unknown as vi.Mock).mockReset();
  });

  it("falls back to pnpm exec when copilot binary is not found", async () => {
    // First call: copilot -> emit error ENOENT
    // Second call: pnpm -> emit stdout 'OK output' and close 0

    // Ensure no candidate binaries are detected on disk so we exercise pnpm fallback
    vi.spyOn(require("node:fs"), "existsSync").mockReturnValue(false);

    (spawn as unknown as vi.Mock).mockImplementation((cmd: string) => {
      if (cmd === "copilot") {
        const e: any = {
          stdout: undefined,
          stderr: undefined,
          on: (ev: string, cb: Function) => {
            if (ev === "error") {
              setImmediate(() => cb(Object.assign(new Error("spawn copilot ENOENT"), { code: "ENOENT" })));
            }
          },
        };
        return e;
      }

      if (cmd === "pnpm") {
        const e: any = {
          stdout: {
            on: (ev: string, cb: Function) => {
              if (ev === "data") setImmediate(() => cb(Buffer.from("OK output")));
            },
          },
          stderr: {
            on: (ev: string, cb: Function) => {},
          },
          on: (ev: string, cb: Function) => {
            if (ev === "close") setImmediate(() => cb(0));
          },
        };
        return e;
      }

      throw new Error("unexpected spawn call");
    });

    const res = await callCopilotCLI("hello world");

    expect(res.success).toBe(true);
    expect(res.output).toContain("OK output");
  });

  it("returns spawn error when both attempts fail", async () => {
    (spawn as unknown as vi.Mock).mockImplementation((cmd: string) => {
      const e: any = {
        stdout: undefined,
        stderr: undefined,
        on: (ev: string, cb: Function) => {
          if (ev === "error") setImmediate(() => cb(Object.assign(new Error("spawn ENOENT"), { code: "ENOENT" })));
          if (ev === "close") setImmediate(() => cb(1));
        },
      };
      return e;
    });

    const res = await callCopilotCLI("hello again");

    expect(res.success).toBe(false);
    expect(res.error).toContain("Failed to spawn copilot CLI");
    expect(res.errorType).toBe("spawn");
  });
});