import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as CopilotModule from "../../../src/copilot/src/copilot-cli.js";
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
    const pathMod = await import("node:path");
    const candidatePath = pathMod.default.normalize("D:/some/path/node_modules/.bin/copilot.cmd");

    // Make getCopilotCandidatePaths return our candidate
    vi.spyOn(CopilotModule, "getCopilotCandidatePaths").mockReturnValue([candidatePath]);

    // fs.existsSync should report it exists (normalize incoming path for comparison)
    vi.spyOn(require("node:fs"), "existsSync").mockImplementation((p: string) => pathMod.default.normalize(p) === candidatePath);

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

      if (cmd === candidatePath || (typeof cmd === "string" && cmd.endsWith("copilot.cmd"))) {
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
    const { callCopilotCLI } = await import("../../../src/copilot/src/copilot-cli.js");
    const res = await callCopilotCLI("hello world");

    // Ensure we attempted to spawn a candidate binary
    const calledWithCandidate = (spawn as any).mock.calls.some((c: any) => typeof c[0] === "string" && c[0].endsWith("copilot.cmd"));
    expect(calledWithCandidate).toBe(true);

    // Accept either a successful candidate run or a clear failure (so test is deterministic across environments)
    if (!res.success) {
      // Provide a helpful assertion message with the result
      throw new Error(`Direct candidate attempt was made but callCopilotCLI failed: ${JSON.stringify(res)}`);
    }

    expect(res.success).toBe(true);
    expect(res.output).toContain("OK-via-candidate");
  });
});