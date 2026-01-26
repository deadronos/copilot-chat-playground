import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execCommand } from "./lib/exec.js";

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

  // Detect common misconfiguration: dotenvx encrypted values (e.g. "encrypted:...")
  // These are not usable by the Copilot API — the token must be the plaintext PAT.
  if (token.startsWith("encrypted:")) {
    return {
      valid: false,
      error:
        "GH_TOKEN appears to be an encrypted dotenvx value (starts with \"encrypted:\").\nProvide a plaintext token at runtime (Docker secret or plaintext .env) or mount the decrypted value into the container.",
    };
  }

  return { valid: true };
}

/**
 * Returns candidate filesystem paths for a local copilot binary to assist diagnostics
 */
export function getCopilotCandidatePaths(): string[] {
  const ext = process.platform === "win32" ? ".cmd" : "";
  const bin = `copilot${ext}`;

  // Roots to probe (cwd, package root relative to this file, and common monorepo patterns)
  const fileDir = path.dirname(fileURLToPath(import.meta.url));
  const packageRoot = path.resolve(fileDir, "..", "..");

  const roots = new Set<string>([
    process.cwd(),
    packageRoot,
    path.resolve(process.cwd(), "src", "copilot"),
    path.resolve(process.cwd(), ".."),
  ]);

  const candidates = new Set<string>();
  candidates.add("copilot");

  for (const r of roots) {
    candidates.add(path.join(r, "node_modules", ".bin", bin));
    candidates.add(path.join(r, ".bin", bin));
  }

  // Normalize and dedupe
  return Array.from(candidates).map((p) => path.normalize(p));
}

/**
 * Calls the Copilot CLI with a prompt and returns buffered output
 * Attempts 'copilot' first, then falls back to 'pnpm exec -- copilot ...'
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

  const attempts = [
    { cmd: "copilot", args: ["-p", prompt, "--silent"] },
    { cmd: "pnpm", args: ["exec", "--", "copilot", "-p", prompt, "--silent"] },
  ];

  const tried: string[] = [];

  for (const attempt of attempts) {
    tried.push(`${attempt.cmd} ${attempt.args.join(" ")}`);

    const result = await execCommand(attempt.cmd, attempt.args, { maxOutputSize: Number.POSITIVE_INFINITY });

    if (result.success) {
      return { success: true, output: result.stdout.trim() };
    }

    // If we got an error indicating executable not found, try candidate binaries on disk
    if (result.error && ("code" in result.error)) {
      const errCode = (result.error as Error & { code?: string }).code;
      if (errCode === "ENOENT") {
        const candidates = getCopilotCandidatePaths().map((p) => ({ path: p, exists: fs.existsSync(p) }));
        const available = candidates.filter((c) => c.exists).map((c) => c.path);
        console.warn(
          `[copilot] copilot binary not found when running '${attempt.cmd}'. Trying fallback. Candidates: ${candidates
            .map((c) => `${c.path} (exists=${c.exists})`)
            .join(", ")}. Found on disk: ${available.join(", ") || "none"}`
        );

        // Try spawning the first candidate that exists on disk directly (absolute path)
          for (const c of available) {
            tried.push(c);
            const directResult = await execCommand(c, ["-p", prompt, "--silent"], {
              maxOutputSize: Number.POSITIVE_INFINITY,
            });
          if (directResult.success) {
            return { success: true, output: directResult.stdout.trim() };
          }

          // If direct spawn failed due to ENOENT, try next
          if (directResult.error && ("code" in directResult.error)) {
            const drErrCode = (directResult.error as Error & { code?: string }).code;
            if (drErrCode === "ENOENT") continue;
          }

          // If stderr indicates auth issues, return that
          const stderrLower = directResult.stderr.toLowerCase();
          if (stderrLower.includes("auth") || stderrLower.includes("unauthorized") || stderrLower.includes("invalid token") || stderrLower.includes("403")) {
            return {
              success: false,
              error: directResult.stderr.trim() || "Authentication error from Copilot CLI",
              errorType: "auth",
            };
          }
        }

        // If none of the direct candidates worked, continue to next attempt (e.g., move from copilot->pnpm or finish)
        continue; // try next attempt
      }
    }

    // If stderr indicates auth issues, return that
    const stderrLower = result.stderr.toLowerCase();
    if (stderrLower.includes("auth") || stderrLower.includes("unauthorized") || stderrLower.includes("invalid token") || stderrLower.includes("403")) {
      return {
        success: false,
        error: result.stderr.trim() || "Authentication error from Copilot CLI",
        errorType: "auth",
      };
    }

    // Otherwise continue to next attempt
  }

  return {
    success: false,
    error: `Failed to spawn copilot CLI via tried commands: ${tried.join(" | ")}. Is @github/copilot installed? Checked candidates: ${getCopilotCandidatePaths().join(", ")}`,
    errorType: "spawn",
  };
}
