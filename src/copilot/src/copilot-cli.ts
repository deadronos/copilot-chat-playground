import { spawn } from "node:child_process";

export interface CopilotResponse {
  success: boolean;
  output?: string;
  error?: string;
  errorType?: "auth" | "token_missing" | "spawn" | "unknown";
}

/**
 * Validates that GH_TOKEN is present in the environment
 */
export function validateToken(): { valid: boolean; error?: string } {
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  if (!token || token.trim() === "") {
    return {
      valid: false,
      error:
        "Missing GitHub token. Set GH_TOKEN or GITHUB_TOKEN environment variable with a PAT that has 'Copilot Requests' permission.",
    };
  }
  return { valid: true };
}

/**
 * Calls the Copilot CLI with a prompt and returns buffered output
 * This is a non-streaming implementation for Milestone B
 */
export async function callCopilotCLI(prompt: string): Promise<CopilotResponse> {
  // Validate token first
  const tokenCheck = validateToken();
  if (!tokenCheck.valid) {
    return {
      success: false,
      error: tokenCheck.error,
      errorType: "token_missing",
    };
  }

  return new Promise((resolve) => {
    let stdout = "";
    let stderr = "";

    // Spawn copilot CLI with the prompt
    const child = spawn("copilot", ["-p", prompt, "--silent"], {
      env: {
        ...process.env,
        // Ensure GH_TOKEN is set (prefer GH_TOKEN over GITHUB_TOKEN)
        GH_TOKEN: process.env.GH_TOKEN || process.env.GITHUB_TOKEN,
      },
    });

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      resolve({
        success: false,
        error: `Failed to spawn copilot CLI: ${error.message}. Is @github/copilot installed?`,
        errorType: "spawn",
      });
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve({
          success: true,
          output: stdout.trim(),
        });
      } else {
        // Determine error type from stderr content
        let errorType: CopilotResponse["errorType"] = "unknown";
        const stderrLower = stderr.toLowerCase();

        if (
          stderrLower.includes("auth") ||
          stderrLower.includes("unauthorized") ||
          stderrLower.includes("invalid token") ||
          stderrLower.includes("403")
        ) {
          errorType = "auth";
        }

        resolve({
          success: false,
          error: stderr.trim() || `Copilot CLI exited with code ${code}`,
          errorType,
        });
      }
    });
  });
}
