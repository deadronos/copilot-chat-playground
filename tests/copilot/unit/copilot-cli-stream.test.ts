import { describe, it, expect, vi, beforeEach } from "vitest";
import { callCopilotCLIStream } from "../../../src/copilot/src/copilot-cli.js";
import * as exec from "../../../src/copilot/src/lib/exec.js";

vi.mock("../../../src/copilot/src/lib/exec.js");

describe("callCopilotCLIStream", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.GH_TOKEN = "ghp_valid_token";
  });

  it("should stream output using onStdout callback", async () => {
    const mockExec = vi.mocked(exec.execCommand);

    mockExec.mockImplementation(async (cmd, args, options) => {
      if (options?.onStdout) {
        options.onStdout("Hello ");
        options.onStdout("world!");
      }
      return {
        success: true,
        stdout: "Hello world!",
        stderr: "",
        code: 0,
      };
    });

    const chunks: string[] = [];
    const onChunk = (chunk: string) => chunks.push(chunk);

    const result = await callCopilotCLIStream("test prompt", onChunk);

    expect(result.success).toBe(true);
    expect(result.output).toBe("Hello world!");
    expect(chunks).toEqual(["Hello ", "world!"]);
    expect(mockExec).toHaveBeenCalledWith(
      expect.stringContaining("copilot"),
      expect.arrayContaining(["-p", "test prompt"]),
      expect.objectContaining({
        onStdout: expect.any(Function),
      })
    );
  });

  it("should stop trying further attempts if signal is aborted", async () => {
    const mockExec = vi.mocked(exec.execCommand);
    const controller = new AbortController();

    mockExec.mockImplementation(async () => {
      controller.abort();
      return {
        success: false,
        stdout: "",
        stderr: "Command failed",
        code: 1,
      };
    });

    const onChunk = vi.fn();
    const result = await callCopilotCLIStream("test prompt", onChunk, controller.signal);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Request aborted");
    // Should stop after the first attempt in the loop
    expect(mockExec).toHaveBeenCalledTimes(1);
  });
});
