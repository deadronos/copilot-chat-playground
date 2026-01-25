import type { Response as ExpressResponse } from "express";

export type ChatMode = "explain-only" | "project-helper";

export type CopilotError = {
  error?: string;
  errorType?: string;
};

export type CopilotCallResult = {
  success: boolean;
  output?: string;
  error?: string;
  errorType?: string;
};

export type CopilotStreamResult = {
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
export async function callCopilotService(
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
export async function callCopilotServiceStream(
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

export function sendPlainTextError(
  res: ExpressResponse,
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
