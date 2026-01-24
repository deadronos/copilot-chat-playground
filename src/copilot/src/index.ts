import "dotenv/config"; // loads .env for local development. TODO: revisit .env handling for Docker builds (inject envs into container at runtime)
import crypto from "node:crypto";
import express from "express";
import { z } from "zod";
import fs from "node:fs";
import { callCopilotCLI, validateToken, getCopilotCandidatePaths } from "./copilot-cli.js";
import { createCopilotSDKService } from "./copilot-sdk.js";
import { createEventBus, type LogEvent } from "@copilot-playground/shared";
import { checkWorkspaceMount } from "./workspace-guard.js";

// Create EventBus for structured logging
const eventBus = createEventBus();

// Optional: Log events to console for debugging
eventBus.onLog((event: LogEvent) => {
  console.log(`[${event.level}] [${event.component}] ${event.message}`, event.meta || "");
});

// Use SDK by default, can be disabled via environment variable
const USE_SDK = process.env.USE_COPILOT_SDK !== "false";
const sdkService = USE_SDK ? createCopilotSDKService(eventBus) : null;

const app = express();
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  // Include token validation status and binary candidates in health check
  const tokenCheck = validateToken();
  const candidatePaths = getCopilotCandidatePaths();
  const candidates = candidatePaths.map((p) => ({ path: p, exists: fs.existsSync(p) }));
  const binaryAvailable = candidates.some((c) => c.exists);

  res.json({
    ok: true,
    service: "copilot",
    mode: USE_SDK ? "sdk" : "cli",
    tokenConfigured: tokenCheck.valid,
    binaryAvailable,
    candidates,
  });
});

const ChatRequestSchema = z.object({
  prompt: z.string().min(1).max(20_000),
  mode: z.enum(["explain-only", "project-helper"]).default("explain-only"),
});

app.post("/chat", async (req, res) => {
  const parsed = ChatRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", issues: parsed.error.issues });
    return;
  }

  const { prompt, mode } = parsed.data;
  const requestId = crypto.randomUUID();

  // Apply mode-specific system messages or constraints
  let systemPrompt = "";
  if (mode === "explain-only") {
    systemPrompt =
      "You are in explain-only mode. Focus on explaining concepts and answering questions. Do not execute commands or make changes to files.";
  } else if (mode === "project-helper") {
    systemPrompt =
      "You are in project-helper mode. You can help with code, execute commands, and interact with the project files.";
  }

  // Use SDK if enabled, otherwise fall back to CLI
  let result;
  if (USE_SDK && sdkService) {
    result = await sdkService.chat(prompt, requestId, systemPrompt);
  } else {
    result = await callCopilotCLI(prompt);
  }

  if (!result.success) {
    // Map error types to appropriate HTTP status codes
    let statusCode = 500;
    if (result.errorType === "token_missing") {
      statusCode = 503; // Service Unavailable
    } else if (result.errorType === "auth") {
      statusCode = 401; // Unauthorized
    } else if (result.errorType === "spawn" || result.errorType === "sdk") {
      statusCode = 500; // Internal Server Error
    }

    res.status(statusCode).json({
      error: result.error,
      errorType: result.errorType,
    });
    return;
  }

  // Return successful response
  res.status(200).json({
    output: result.output,
  });
});

const port = Number(process.env.PORT ?? 3210);
app.listen(port, async () => {
  console.log(`[copilot] listening on http://localhost:${port}`);
  console.log(`[copilot] mode: ${USE_SDK ? "SDK" : "CLI"}`);

  // Check token on startup
  const tokenCheck = validateToken();
  if (!tokenCheck.valid) {
    console.warn(`[copilot] WARNING: ${tokenCheck.error}`);

    // If the raw env looks like an encrypted dotenvx value, add an extra hint
    const rawToken = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || "";
    if (rawToken.startsWith("encrypted:")) {
      console.warn(
        `[copilot] WARNING: GH_TOKEN looks like a dotenvx-encrypted value. Use a runtime secret or decrypted token instead (see docs/library/dotenvx/README.md).`
      );
    }
  } else {
    console.log(`[copilot] GH_TOKEN configured`);
  }

  // Check workspace mount and log visibility
  try {
    // run but don't fail startup on problems; logs surface issues
    await checkWorkspaceMount("/workspace", eventBus);
  } catch (err) {
    console.warn(`[copilot] Workspace mount check failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  // Initialize SDK client if enabled
  if (USE_SDK && sdkService) {
    try {
      await sdkService.initialize();
      console.log(`[copilot] SDK initialized successfully`);
    } catch (error) {
      console.error(
        `[copilot] Failed to initialize SDK: ${error instanceof Error ? error.message : String(error)}`
      );
      console.warn(`[copilot] SDK initialization failed, will attempt to initialize on first request`);
    }
  }
});

// Clean up on shutdown
process.on("SIGINT", async () => {
  console.log(`[copilot] Shutting down...`);
  if (sdkService) {
    await sdkService.stop();
  }
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log(`[copilot] Shutting down...`);
  if (sdkService) {
    await sdkService.stop();
  }
  process.exit(0);
});
