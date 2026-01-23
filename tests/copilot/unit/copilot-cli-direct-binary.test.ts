import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as CopilotModule from "../../src/copilot/src/copilot-cli.js";
import { spawn } from "node:child_process";

vi.mock("node:child_process", () => ({
  spawn: vi.fn(),
} as any));

describe("callCopilotCLI direct-binary fallback", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.GH_TOKEN = "test-token";
    (spawn as unknown as vi.Mock).mockReset();
  });

  afterEach(() => {
    process.env = originalEnv;
    (spawn as unknown as vi.Mock).mockReset();
    vi.restoreAllMocks();
  });

  it("uses first existing candidate when pnpm isn't available", async () => {
    const candidatePath = "D:/some/path/node_modules/.bin/copilot.cmd";

    // Make getCopilotCandidatePaths return our candidate
    vi.spyOn(CopilotModule, "getCopilotCandidatePaths").mockReturnValue([candidatePath]);

    // fs.existsSync should report it exists
    vi.spyOn(CopilotModule as any, "getCopilotCandidatePaths");
    vi.spyOn(require("node:fs"), "existsSync").mockImplementation((p: string) => p === candidatePath);

    // Mock spawn behaviour:
    // 'copilot' -> ENOENT
    // 'pnpm' -> ENOENT
    // candidatePath -> success
    (spawn as unknown as vi.Mock).mockImplementation((cmd: string) => {
      if (cmd === "copilot") {
        const e: any = {
          stdout: undefined,
          stderr: undefined,
          on: (ev: string, cb: Function) => {
            if (ev === "error") setImmediate(() => cb(Object.assign(new Error("spawn copilot ENOENT"), { code: "ENOENT" })));
          },
        };
        return e;
      }

      if (cmd === "pnpm") {
        const e: any = {
          stdout: undefined,
          stderr: undefined,
          on: (ev: string, cb: Function) => {
            if (ev === "error") setImmediate(() => cb(Object.assign(new Error("spawn pnpm ENOENT"), { code: "ENOENT" })));
          },
        };
        return e;
      }

      if (cmd === candidatePath) {
        const e: any = {
          stdout: {
            on: (ev: string, cb: Function) => {
              if (ev === "data") setImmediate(() => cb(Buffer.from("OK-via-candidate")));
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

    const { callCopilotCLI } = await import("../../src/copilot/src/copilot-cli.js");
    const res = await callCopilotCLI("hello world");

    expect(res.success).toBe(true);
    expect(res.output).toContain("OK-via-candidate");
  });
});