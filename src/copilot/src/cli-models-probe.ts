import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getCopilotCandidatePaths } from "./copilot-cli.js";
import { incrementMetric } from "./metrics.js";
import type { EventBus } from "@copilot-playground/shared";
import { execCommand } from "./lib/exec.js";

/**
 * Result of probing the Copilot CLI for available models
 */
export interface ProbeResult {
  source: "cli" | "fallback" | "error";
  models: string[];
  error?: string;
}

/**
 * Cache entry for models probe results
 */
interface CacheEntry {
  result: ProbeResult;
  expiresAt: number;
}

// In-memory cache for probe results
let cache: CacheEntry | null = null;

/**
 * Get the TTL for cache in seconds from environment variable
 */
function getCacheTTL(): number {
  const ttlEnv = process.env.COPILOT_MODELS_TTL_SECONDS;
  if (ttlEnv) {
    const ttl = parseInt(ttlEnv, 10);
    if (!isNaN(ttl) && ttl > 0) {
      return ttl;
    }
  }
  return 60; // default 60 seconds
}

/**
 * Normalize and deduplicate model IDs
 */
function normalizeModels(models: string[]): string[] {
  return Array.from(new Set(
    models
      .map((m) => m.trim())
      .filter((m) => m.length > 0)
      .map((m) => m.replace(/[(),]/g, "").trim())
  )).sort();
}

/**
 * Parse models from "Allowed choices are ..." error message
 */
function parseAllowedChoices(stderr: string): string[] {
  const regex = /Allowed choices are\s*:?\s*(.*)/i;
  const match = stderr.match(regex);
  
  if (match && match[1]) {
    // Split by comma and clean up
    return normalizeModels(match[1].split(","));
  }
  
  return [];
}

/**
 * Try to parse JSON output from copilot --model list --json
 */
function parseJsonOutput(stdout: string): string[] {
  try {
    const parsed = JSON.parse(stdout);
    
    // Handle different JSON structures
    if (Array.isArray(parsed)) {
      return normalizeModels(parsed);
    } else if (parsed.models && Array.isArray(parsed.models)) {
      return normalizeModels(parsed.models);
    } else if (parsed.list && Array.isArray(parsed.list)) {
      return normalizeModels(parsed.list);
    }
  } catch {
    // Not valid JSON, will fall back to other methods
  }
  
  return [];
}

/**
 * Try to extract models from copilot --help output
 */
function parseHelpOutput(output: string): string[] {
  // Look for lines that might contain model lists
  const lines = output.split("\n");
  const modelLines = lines.filter((line) => 
    line.includes("model") || 
    line.includes("gpt") || 
    line.includes("claude") ||
    line.includes("anthropic")
  );
  
  // Try to extract model names using common patterns
  const modelPattern = /(?:gpt|claude|anthropic)-[a-z0-9][a-z0-9.-]*/gi;
  const matches: string[] = [];
  
  for (const line of modelLines) {
    const lineMatches = line.match(modelPattern);
    if (lineMatches) {
      matches.push(...lineMatches);
    }
  }
  
  return normalizeModels(matches);
}

/**
 * Get fallback models from package.json or return a curated list
 */
function getFallbackModels(): string[] {
  // Try to read from the installed @github/copilot package (best-effort).
  try {
    const fileDir = path.dirname(fileURLToPath(import.meta.url));
    const packageRoot = path.resolve(fileDir, "..", ".."); // src/copilot
    const copilotPkgRoot = path.join(packageRoot, "node_modules", "@github", "copilot");
    const packageJsonPath = path.join(copilotPkgRoot, "package.json");
    const readmePath = path.join(copilotPkgRoot, "README.md");
    
    const haystacks: string[] = [];

    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8")) as { description?: string };
      if (packageJson.description) haystacks.push(packageJson.description);
    }

    if (fs.existsSync(readmePath)) {
      haystacks.push(fs.readFileSync(readmePath, "utf-8"));
    }

    const modelPattern = /(?:gpt|claude|anthropic)-[a-z0-9][a-z0-9.-]*/gi;
    const matches = haystacks.flatMap((t) => t.match(modelPattern) ?? []);
    if (matches.length > 0) return normalizeModels(matches);
  } catch {
    // Fall through to curated list
  }
  
  // Curated fallback list of common models
  return normalizeModels([
    "gpt-4o",
    "gpt-4",
    "gpt-3.5-turbo",
    "claude-3-opus",
    "claude-3-sonnet",
    "claude-3-haiku",
  ]);
}

/**
 * Spawn a command with timeout and output limits
 */

/**
 * Probe the Copilot CLI for available models
 */
export async function probeCliModels(eventBus?: EventBus): Promise<ProbeResult> {
  incrementMetric("model_probe_count");
  
  if (eventBus) {
    eventBus.emitLog({
      timestamp: new Date().toISOString(),
      level: "debug",
      component: "copilot",
      event_type: "cli.models.probe.start",
      message: "Starting Copilot CLI model probe",
    });
  }
  
  // Try different strategies in order
  const strategies = [
    { name: "json", cmd: "copilot", args: ["--model", "list", "--json"] },
    { name: "invalid", cmd: "copilot", args: ["--model", "INVALID_PROBE"] },
    { name: "help", cmd: "copilot", args: ["--help"] },
  ];

  let lastErrorMessage: string | undefined;
  
  for (const strategy of strategies) {
    // Try candidate paths first
    const candidatePaths = getCopilotCandidatePaths();
    const candidatesToTry = [strategy.cmd, ...candidatePaths.filter(p => p !== strategy.cmd)];
    
    for (const cmdToTry of candidatesToTry) {
      try {
        const result = await execCommand(cmdToTry, strategy.args, { timeoutMs: 5000 });
        
        if (result.success) {
          // JSON strategy succeeded
          if (strategy.name === "json") {
            const models = parseJsonOutput(result.stdout);
            if (models.length > 0) {
              const probeResult: ProbeResult = {
                source: "cli",
                models,
              };
              
              if (eventBus) {
                eventBus.emitLog({
                  timestamp: new Date().toISOString(),
                  level: "debug",
                  component: "copilot",
                  event_type: "cli.models.probe.parsed",
                  message: "Parsed models from JSON output",
                  meta: { models, count: models.length },
                });
              }

              if (eventBus) {
                eventBus.emitLog({
                  timestamp: new Date().toISOString(),
                  level: "info",
                  component: "copilot",
                  event_type: "cli.models.probe.success",
                  message: "Copilot CLI model probe succeeded (json)",
                  meta: { count: models.length },
                });
              }
              
              return probeResult;
            }
          } else if (strategy.name === "help") {
            // Help strategy - try to extract models
            const models = parseHelpOutput(result.stdout);
            if (models.length > 0) {
              const probeResult: ProbeResult = {
                source: "cli",
                models,
              };
              
              if (eventBus) {
                eventBus.emitLog({
                  timestamp: new Date().toISOString(),
                  level: "debug",
                  component: "copilot",
                  event_type: "cli.models.probe.parsed",
                  message: "Parsed models from help output",
                  meta: { models, count: models.length },
                });
              }

              if (eventBus) {
                eventBus.emitLog({
                  timestamp: new Date().toISOString(),
                  level: "info",
                  component: "copilot",
                  event_type: "cli.models.probe.success",
                  message: "Copilot CLI model probe succeeded (help)",
                  meta: { count: models.length },
                });
              }
              
              return probeResult;
            }
          }
        } else {
          if (result.error) {
            lastErrorMessage = result.error.message;
          } else if (result.stderr.trim().length > 0) {
            lastErrorMessage = result.stderr.trim().slice(0, 200);
          }

          // Invalid model strategy - parse error message
          if (strategy.name === "invalid") {
            const models = parseAllowedChoices(result.stderr);
            if (models.length > 0) {
              const probeResult: ProbeResult = {
                source: "cli",
                models,
              };
              
              if (eventBus) {
                eventBus.emitLog({
                  timestamp: new Date().toISOString(),
                  level: "debug",
                  component: "copilot",
                  event_type: "cli.models.probe.parsed",
                  message: "Parsed models from allowed choices error",
                  meta: { models, count: models.length },
                });
              }

              if (eventBus) {
                eventBus.emitLog({
                  timestamp: new Date().toISOString(),
                  level: "info",
                  component: "copilot",
                  event_type: "cli.models.probe.success",
                  message: "Copilot CLI model probe succeeded (allowed choices)",
                  meta: { count: models.length },
                });
              }
              
              return probeResult;
            }
          }
        }
      } catch (error) {
        const err = error as (Error & { code?: string }) | unknown;
        const errCode = typeof err === "object" && err && "code" in err ? (err as { code?: string }).code : undefined;
        const errMessage = err instanceof Error ? err.message : String(err);

        lastErrorMessage = errMessage;

        // Expected operational errors: continue and fall back if needed.
        if (errCode === "ENOENT" || errCode === "ETIMEDOUT") {
          continue;
        }

        // Unexpected internal errors should surface to the caller.
        throw error;
      }
    }
  }
  
  // If we get here, all strategies failed - return fallback
  incrementMetric("model_probe_failure_count");
  const fallbackModels = getFallbackModels();
  
  if (eventBus) {
    eventBus.emitLog({
      timestamp: new Date().toISOString(),
      level: "warn",
      component: "copilot",
      event_type: "cli.models.probe.error",
      message: "Copilot CLI model probe failed; using fallback model list",
      meta: { count: fallbackModels.length, error: lastErrorMessage },
    });
  }
  
  return {
    source: "fallback",
    models: fallbackModels,
    error: lastErrorMessage,
  };
}

/**
 * Get cached models or probe if cache is expired
 */
export async function getCachedModels(eventBus?: EventBus, refresh: boolean = false): Promise<ProbeResult & { cached: boolean; ttlExpiresAt?: string }> {
  const now = Date.now();
  const ttlSeconds = getCacheTTL();
  const ttlMs = ttlSeconds * 1000;
  
  // Force refresh if requested
  if (refresh) {
    const result = await probeCliModels(eventBus);
    cache = {
      result,
      expiresAt: now + ttlMs,
    };
    
    return {
      ...result,
      cached: false,
      ttlExpiresAt: new Date(cache.expiresAt).toISOString(),
    };
  }
  
  // Use cache if available and not expired
  if (cache && now < cache.expiresAt) {
    return {
      ...cache.result,
      cached: true,
      ttlExpiresAt: new Date(cache.expiresAt).toISOString(),
    };
  }
  
  // Probe and cache the result
  const result = await probeCliModels(eventBus);
  cache = {
    result,
    expiresAt: now + ttlMs,
  };
  
  return {
    ...result,
    cached: false,
    ttlExpiresAt: new Date(cache.expiresAt).toISOString(),
  };
}

/**
 * Clear the models cache (useful for testing)
 */
export function clearModelsCache(): void {
  cache = null;
}
