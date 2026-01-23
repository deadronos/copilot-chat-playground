import cors from "cors";
import express from "express";
import { z } from "zod";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "backend" });
});

const ChatRequestSchema = z.object({
  prompt: z.string().min(1).max(20_000),
});

/**
 * Calls the copilot service and returns the response
 * For Milestone B: buffered response (no streaming yet)
 */
async function callCopilotService(
  prompt: string
): Promise<{ success: boolean; output?: string; error?: string; errorType?: string }> {
  const copilotUrl = process.env.COPILOT_SERVICE_URL || "http://localhost:3210";

  try {
    const response = await fetch(`${copilotUrl}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const errorData = (await response.json()) as { error?: string; errorType?: string };
      return {
        success: false,
        error: errorData.error || "Copilot service returned an error",
        errorType: errorData.errorType,
      };
    }

    const data = (await response.json()) as { output?: string };
    return {
      success: true,
      output: data.output,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? `Failed to connect to copilot service: ${error.message}`
          : "Failed to connect to copilot service",
      errorType: "connection",
    };
  }
}

app.post("/api/chat", async (req, res) => {
  const parsed = ChatRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", issues: parsed.error.issues });
    return;
  }

  const { prompt } = parsed.data;

  // Call copilot service
  const result = await callCopilotService(prompt);

  if (!result.success) {
    // Map error types to user-friendly messages
    let userMessage = result.error || "An error occurred";
    let statusCode = 500;

    if (result.errorType === "token_missing") {
      userMessage =
        "GitHub Copilot is not configured. Please set GH_TOKEN environment variable on the server.";
      statusCode = 503;
    } else if (result.errorType === "auth") {
      userMessage =
        "GitHub Copilot authentication failed. Please check your token permissions.";
      statusCode = 401;
    } else if (result.errorType === "connection") {
      userMessage = "Could not connect to Copilot service. Please check if the service is running.";
      statusCode = 503;
    }

    // Return error as plain text for easier frontend handling
    res.status(statusCode);
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.send(`Error: ${userMessage}`);
    return;
  }

  // Return successful response as plain text (buffered, not streaming for Milestone B)
  res.status(200);
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.send(result.output || "");
});

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  console.log(`[backend] listening on http://localhost:${port}`);
});
