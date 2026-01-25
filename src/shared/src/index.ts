export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogComponent =
  | "frontend"
  | "backend"
  | "backend.stream"
  | "backend.process"
  | "copilot";

export type LogEvent = {
  timestamp: string; // ISO
  level: LogLevel;
  component: LogComponent;
  request_id?: string;
  session_id?: string;
  event_type: string;
  message: string;
  meta?: Record<string, unknown>;
};

export function toNdjsonLine(event: LogEvent): string {
  return `${JSON.stringify(event)}\n`;
}

export { EventBus, createEventBus } from "./event-bus.js";
export { applyCanvasSize } from "./lib/canvas.js";
export type { CanvasSizeTarget } from "./lib/canvas.js";
export { buildDecisionPrompt } from "./lib/decision-prompt.js";
export type {
  DecisionPromptOptions,
  DecisionPromptRecord,
  DecisionPromptSession,
  DecisionPromptSnapshot,
} from "./lib/decision-prompt.js";
export { clampNumber } from "./lib/numbers.js";
export type { ClampRange, ClampWarning } from "./lib/numbers.js";
export { estimateTokenCount } from "./lib/text.js";
