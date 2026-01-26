import type express from "express";

import { logDecisionAudit, logStructuredEvent } from "../services/decision-referee.js";
import type { TraceContext } from "../services/redvsblue-types.js";

export function logValidationFailure(
  context: TraceContext,
  issues: unknown,
  req?: express.Request
): void {
  logStructuredEvent("warn", "validation failure", context, {
    issues,
    method: req?.method,
    path: req?.path,
  });
}

export function logMatchFailure(
  context: TraceContext,
  message: string,
  req?: express.Request
): void {
  logStructuredEvent("warn", "request rejected", context, {
    message,
    method: req?.method,
    path: req?.path,
  });
}

export { logDecisionAudit, logStructuredEvent };