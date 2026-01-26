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
export {
  DEFAULT_REDVSBLUE_CONFIG,
  DEFAULT_REDVSBLUE_CONFIG_RANGES,
  DEFAULT_REDVSBLUE_CONFIG_VALUES,
  DEFAULT_REDVSBLUE_DECISION_LIMITS,
  DEFAULT_REDVSBLUE_RULE_RANGES,
  DEFAULT_REDVSBLUE_RULES,
  RedVsBlueConfigSchema,
  RuleRangeSchema,
  loadRedVsBlueConfig,
} from "./config/redvsblue-config.js";
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
export type {
  ConfigRanges,
  DecisionLimits,
  RedVsBlueConfig,
  RedVsBlueConfigLoadResult,
  RedVsBlueConfigValues,
  RedVsBlueRuleValues,
  RuleRange,
  RuleRanges,
} from "./config/redvsblue-config.js";
