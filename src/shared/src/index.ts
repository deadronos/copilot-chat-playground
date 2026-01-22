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
