import cors from "cors";
import express from "express";
import { z } from "zod";

// Mode types for safety toggles
export type ChatMode = "explain-only" | "project-helper";

const ChatRequestSchema = z.object({
  prompt: z.string().min(1).max(20_000),
  mode: z.enum(["explain-only", "project-helper"]).default("explain-only"),
});

type CopilotError = {
  error?: string;
  errorType?: string;
};

type CopilotCallResult = {
  success: boolean;
  output?: string;
  error?: string;
  errorType?: string;
};

type CopilotStreamResult = {
  success: boolean;
  response?: Response;
  error?: string;
  errorType?: string;
  status?: number;
};

function getCopilotServiceUrl(): string {
  return process.env.COPILOT_SERVICE_URL || "http://localhost:3210";
}

/**
 * Calls the copilot service and returns the response (buffered)
 * Fallback for non-streaming mode.
 */
async function callCopilotService(
  prompt: string,
  mode: ChatMode = "explain-only"
): Promise<CopilotCallResult> {
  try {
    const response = await fetch(`${getCopilotServiceUrl()}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt, mode }),
    });

    if (!response.ok) {
      const errorData = (await response.json()) as CopilotError;
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

/**
 * Calls the copilot streaming endpoint and returns the response.
 */
async function callCopilotServiceStream(
  prompt: string,
  mode: ChatMode,
  signal: AbortSignal
): Promise<CopilotStreamResult> {
  try {
    const response = await fetch(`${getCopilotServiceUrl()}/chat/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/plain",
      },
      body: JSON.stringify({ prompt, mode }),
      signal,
    });

    if (response.status === 404) {
      return {
        success: false,
        error: "Streaming endpoint not available",
        errorType: "stream_unavailable",
        status: response.status,
      };
    }

    if (!response.ok) {
      let errorMessage = "Copilot service returned an error";
      let errorType: string | undefined;

      try {
        const errorData = (await response.json()) as CopilotError;
        errorMessage = errorData.error || errorMessage;
        errorType = errorData.errorType;
      } catch {
        // Ignore JSON parsing errors for non-JSON responses
      }

      return {
        success: false,
        error: errorMessage,
        errorType,
        status: response.status,
      };
    }

    if (!response.body) {
      return {
        success: false,
        error: "Copilot stream was empty",
        errorType: "stream_empty",
        status: response.status,
      };
    }

    return {
      success: true,
      response,
    };
  } catch (error) {
    if (signal.aborted) {
      return {
        success: false,
        error: "Request aborted",
        errorType: "aborted",
      };
    }

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

function sendPlainTextError(
  res: express.Response,
  errorType: string | undefined,
  errorMessage: string
): void {
  let userMessage = errorMessage;
  let statusCode = 500;

  if (errorType === "token_missing") {
    userMessage =
      "GitHub Copilot is not configured. Please set GH_TOKEN environment variable on the server.";
    statusCode = 503;
  } else if (errorType === "auth") {
    userMessage =
      "GitHub Copilot authentication failed. Please check your token permissions.";
    statusCode = 401;
  } else if (errorType === "connection") {
    userMessage = "Could not connect to Copilot service. Please check if the service is running.";
    statusCode = 503;
  }

  res.status(statusCode);
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.send(`Error: ${userMessage}`);
}

export function createApp(): express.Express {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "backend" });
  });

  app.post("/api/chat", async (req, res) => {
    const parsed = ChatRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request", issues: parsed.error.issues });
      return;
    }

    const { prompt, mode } = parsed.data;

    if (mode === "explain-only") {
      console.log(`[backend] Mode: ${mode} - applying explain-only guardrails`);
    }

    const abortController = new AbortController();
    const handleAbort = () => abortController.abort();
    const handleClose = () => {
      if (!res.writableEnded) {
        abortController.abort();
      }
    };

    req.on("aborted", handleAbort);
    res.on("close", handleClose);

    const streamResult = await callCopilotServiceStream(
      prompt,
      mode,
      abortController.signal
    );

    if (streamResult.success && streamResult.response) {
      const body = streamResult.response.body;
      if (!body) {
        sendPlainTextError(res, "stream_empty", "Copilot stream was empty");
        req.off("aborted", handleAbort);
        res.off("close", handleClose);
        return;
      }

      const reader = body.getReader();
      const firstChunk = await reader.read();

      if (firstChunk.done) {
        req.off("aborted", handleAbort);
        res.off("close", handleClose);

        const fallbackResult = await callCopilotService(prompt, mode);
        if (!fallbackResult.success) {
          sendPlainTextError(
            res,
            fallbackResult.errorType,
            fallbackResult.error || "An error occurred"
          );
          return;
        }

        res.status(200);
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.send(fallbackResult.output || "");
        return;
      }

      res.status(200);
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache, no-transform");

      if (typeof res.flushHeaders === "function") {
        res.flushHeaders();
      }

      if (firstChunk.value) {
        res.write(Buffer.from(firstChunk.value));
      }

      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done || abortController.signal.aborted) {
            break;
          }
          if (value) {
            res.write(Buffer.from(value));
          }
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.warn("[backend] Streaming error", error);
        }
      } finally {
        res.end();
      }

      req.off("aborted", handleAbort);
      res.off("close", handleClose);
      return;
    }

    if (streamResult.errorType !== "stream_unavailable") {
      sendPlainTextError(res, streamResult.errorType, streamResult.error || "Streaming failed");
      req.off("aborted", handleAbort);
      res.off("close", handleClose);
      return;
    }

    const result = await callCopilotService(prompt, mode);

    if (!result.success) {
      sendPlainTextError(res, result.errorType, result.error || "An error occurred");
      req.off("aborted", handleAbort);
      res.off("close", handleClose);
      return;
    }

    res.status(200);
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.send(result.output || "");
    req.off("aborted", handleAbort);
    res.off("close", handleClose);
  });

  return app;
}
