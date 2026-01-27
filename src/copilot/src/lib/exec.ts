import { spawn } from "node:child_process";

export interface ExecOptions {
  timeoutMs?: number;
  maxOutputSize?: number;
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  signal?: AbortSignal;
}

export interface ExecResult {
  success: boolean;
  stdout: string;
  stderr: string;
  code: number | null;
  error?: Error | null;
  timedOut?: boolean;
}

const DEFAULT_MAX_OUTPUT_SIZE = 1024 * 1024; // 1 MB

function mergeEnv(env?: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  return {
    ...process.env,
    GH_TOKEN: process.env.GH_TOKEN || process.env.GITHUB_TOKEN,
    ...env,
  };
}

export async function execCommand(cmd: string, args: string[], options: ExecOptions = {}): Promise<ExecResult> {
  const { timeoutMs, maxOutputSize, cwd, env, signal } = options;
  const limit = typeof maxOutputSize === "number" && maxOutputSize > 0 ? maxOutputSize : DEFAULT_MAX_OUTPUT_SIZE;
  return new Promise((resolve) => {
    let stdout = "";
    let stderr = "";
    let finished = false;
    let timedOut = false;

    const child = spawn(cmd, args, {
      env: mergeEnv(env),
      cwd,
      signal,
    });

    const timeout = timeoutMs
      ? setTimeout(() => {
          timedOut = true;
          child.kill();
        }, timeoutMs)
      : null;

    const cleanup = () => {
      if (!finished) {
        finished = true;
        if (timeout) {
          clearTimeout(timeout);
        }
      }
    };

    const appendChunk = (target: "stdout" | "stderr", chunk: Buffer) => {
      const chunkStr = chunk.toString();
      const current = target === "stdout" ? stdout : stderr;
      if (limit !== undefined && current.length >= limit) {
        return;
      }
      const remaining = limit - current.length;
      const truncated = remaining > 0 ? chunkStr.slice(0, remaining) : "";
      if (target === "stdout") {
        stdout += truncated;
      } else {
        stderr += truncated;
      }
    };

    if (child.stdout) {
      child.stdout.on("data", (chunk: Buffer) => appendChunk("stdout", chunk));
    }

    if (child.stderr) {
      child.stderr.on("data", (chunk: Buffer) => appendChunk("stderr", chunk));
    }

    child.on("error", (error: Error & { code?: string }) => {
      cleanup();
      resolve({
        success: false,
        stdout,
        stderr,
        code: null,
        error,
        timedOut,
      });
    });

    child.on("close", (code: number | null) => {
      cleanup();
      if (timedOut) {
        resolve({
          success: false,
          stdout,
          stderr: stderr || "Command timed out",
          code,
          error: new Error(`Command timed out after ${timeoutMs}ms`),
          timedOut: true,
        });
        return;
      }

      resolve({
        success: code === 0,
        stdout,
        stderr,
        code,
        error: code === 0 ? null : new Error(`Process exited with code ${code}`),
      });
    });
  });
}
