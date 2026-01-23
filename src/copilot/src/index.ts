import express from "express";
import { z } from "zod";
import { callCopilotCLI, validateToken } from "./copilot-cli.js";

const app = express();
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  // Include token validation status in health check
  const tokenCheck = validateToken();
  res.json({
    ok: true,
    service: "copilot",
    tokenConfigured: tokenCheck.valid,
  });
});

const ChatRequestSchema = z.object({
  prompt: z.string().min(1).max(20_000),
});

app.post("/chat", async (req, res) => {
  const parsed = ChatRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", issues: parsed.error.issues });
    return;
  }

  const { prompt } = parsed.data;

  // Call Copilot CLI and return buffered response
  const result = await callCopilotCLI(prompt);

  if (!result.success) {
    // Map error types to appropriate HTTP status codes
    let statusCode = 500;
    if (result.errorType === "token_missing") {
      statusCode = 503; // Service Unavailable
    } else if (result.errorType === "auth") {
      statusCode = 401; // Unauthorized
    } else if (result.errorType === "spawn") {
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
app.listen(port, () => {
  console.log(`[copilot] listening on http://localhost:${port}`);

  // Check token on startup
  const tokenCheck = validateToken();
  if (!tokenCheck.valid) {
    console.warn(`[copilot] WARNING: ${tokenCheck.error}`);
  } else {
    console.log(`[copilot] GH_TOKEN configured`);
  }
});
