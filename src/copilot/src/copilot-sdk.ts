import { CopilotClient } from "@github/copilot-sdk";
import type { SystemMessageConfig } from "@github/copilot-sdk";
import { getDefaultModel } from "./defaults.js";
import { incrementMetric } from "./metrics.js";
import type { EventBus } from "@copilot-playground/shared";
import { validateToken } from "./copilot-cli.js";

export interface CopilotSDKResponse {
  success: boolean;
  output?: string;
  error?: string;
  errorType?: "auth" | "token_missing" | "sdk" | "unknown";
}

/**
 * SDK-based Copilot service implementation.
 * Replaces CLI spawning with structured SDK streaming.
 */
export class CopilotSDKService {
  private client: CopilotClient | null = null;
  private eventBus: EventBus | null = null;

  constructor(eventBus?: EventBus) {
    this.eventBus = eventBus ?? null;
  }

  /**
   * Initialize the Copilot SDK client
   */
  async initialize(): Promise<void> {
    if (this.client) {
      return; // Already initialized
    }

    const tokenCheck = validateToken();
    if (!tokenCheck.valid) {
      throw new Error(tokenCheck.error);
    }

    // Create client - SDK will use GH_TOKEN from environment via CLI
    // Auto-start enabled, but auto-restart disabled for more predictable error handling
    this.client = new CopilotClient({
      autoStart: true,
      autoRestart: false,
    });

    await this.client.start();

    this.emitLog("info", "sdk.initialized", "Copilot SDK client initialized");
  }

  /**
   * Send a prompt to Copilot and return the buffered response
   */
  async chat(
    prompt: string,
    requestId?: string,
    systemPrompt?: string,
    systemMode?: 'append' | 'replace'
  ): Promise<CopilotSDKResponse> {
    // Validate token first
    const tokenCheck = validateToken();
    if (!tokenCheck.valid) {
      return {
        success: false,
        error: tokenCheck.error,
        errorType: "token_missing",
      };
    }

    try {
      // Initialize client if needed
      if (!this.client) {
        await this.initialize();
      }

      if (!this.client) {
        return {
          success: false,
          error: "Failed to initialize Copilot SDK client",
          errorType: "sdk",
        };
      }

      this.emitLog("info", "sdk.session.creating", "Creating Copilot session", { requestId });

      // Create a new session with streaming enabled
      const systemMessage = systemPrompt ? ({ content: systemPrompt, mode: systemMode ?? 'append' } as SystemMessageConfig) : undefined;

      // Determine the effective model using a centralized accessor
      const model = getDefaultModel();
      this.emitLog("info", "sdk.session.model", "Using Copilot model", { requestId, model });

      const session = await this.client.createSession({
        model,
        streaming: true,
        ...(systemMessage && { systemMessage }),
      });

      this.emitLog("info", "sdk.session.created", "Copilot session created", {
        requestId,
        sessionId: session.sessionId,
        model,
      });

      // Buffer to collect the full response
      let fullResponse = "";

      // Set up event handlers
      session.on((event) => {
        this.emitLog("debug", "sdk.event", `SDK event: ${event.type}`, {
          requestId,
          sessionId: session.sessionId,
          eventType: event.type,
          meta: event,
        });

        // Handle different event types
        if (event.type === "assistant.message_delta") {
          // Log streaming deltas for observability
          const messageId = event.data.messageId || "default";
          const deltaLength = event.data.deltaContent?.length || 0;

          this.emitLog("debug", "sdk.message.delta", "Message delta received", {
            requestId,
            sessionId: session.sessionId,
            messageId,
            deltaLength,
          });
        } else if (event.type === "assistant.message") {
          // Final message content - this is canonical
          const messageId = event.data.messageId || "default";
          const content = event.data.content || "";

          // Use final message as the authoritative content
          fullResponse = content;

          this.emitLog("info", "sdk.message.complete", "Message complete", {
            requestId,
            sessionId: session.sessionId,
            messageId,
            contentLength: content.length,
          });

        // Detect the provider-reported model and warn if it differs from requested model
        } else if (event.type === "assistant.usage") {
          const actualModel = event.data?.model as string | undefined;
          if (actualModel) {
            if (actualModel !== model) {
              // Emit a warning with relevant metadata to aid debugging and telemetry
              // Increment runtime metric for model mismatches (useful for health/telemetry)
              incrementMetric("model_mismatch_count");

              this.emitLog("warn", "sdk.model.mismatch", `Requested model '${model}' differs from actual model '${actualModel}'`, {
                requestId,
                sessionId: session.sessionId,
                requestedModel: model,
                actualModel,
                providerCallId: event.data?.providerCallId,
                usage: event.data,
                metrics: { model_mismatch_count: true },
              });
            } else {
              // Optional: note explicit match for observability
              this.emitLog("debug", "sdk.model.match", "Requested model matches actual model", {
                requestId,
                sessionId: session.sessionId,
                model: actualModel,
              });
            }
          }
        } else if (event.type === "session.idle") {
          this.emitLog("info", "sdk.session.idle", "Session idle (turn complete)", {
            requestId,
            sessionId: session.sessionId,
          });
        } else if (event.type === "session.error") {
          this.emitLog("error", "sdk.session.error", `Session error: ${event.data.message}`, {
            requestId,
            sessionId: session.sessionId,
            error: event.data.message,
          });
        }
      });

      // Send the prompt and wait for completion
      this.emitLog("info", "sdk.sending", "Sending prompt to Copilot", {
        requestId,
        sessionId: session.sessionId,
        promptLength: prompt.length,
      });

      await session.sendAndWait({
        prompt,
      });

      this.emitLog("info", "sdk.complete", "Prompt completed", {
        requestId,
        sessionId: session.sessionId,
        responseLength: fullResponse.length,
      });

      // Clean up session
      await session.destroy();

      return {
        success: true,
        output: fullResponse.trim(),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.emitLog("error", "sdk.error", `SDK error: ${errorMessage}`, {
        requestId,
        error: errorMessage,
      });

      // Check if it's an auth error
      const errorLower = errorMessage.toLowerCase();
      if (
        errorLower.includes("auth") ||
        errorLower.includes("unauthorized") ||
        errorLower.includes("token")
      ) {
        return {
          success: false,
          error: errorMessage,
          errorType: "auth",
        };
      }

      return {
        success: false,
        error: errorMessage,
        errorType: "sdk",
      };
    }
  }

  /**
   * Stop the SDK client
   */
  async stop(): Promise<void> {
    if (this.client) {
      await this.client.stop();
      this.client = null;
      this.emitLog("info", "sdk.stopped", "Copilot SDK client stopped");
    }
  }

  /**
   * Helper to emit structured log events
   */
  private emitLog(
    level: "debug" | "info" | "warn" | "error",
    eventType: string,
    message: string,
    meta?: Record<string, unknown>
  ): void {
    if (!this.eventBus) {
      return;
    }

    this.eventBus.emitLog({
      timestamp: new Date().toISOString(),
      level,
      component: "copilot",
      event_type: eventType,
      message,
      request_id: meta?.requestId as string | undefined,
      session_id: meta?.sessionId as string | undefined,
      meta,
    });
  }
}

/**
 * Create a new SDK service instance
 */
export function createCopilotSDKService(eventBus?: EventBus): CopilotSDKService {
  return new CopilotSDKService(eventBus);
}
