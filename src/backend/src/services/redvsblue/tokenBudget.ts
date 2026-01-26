import { buildDecisionPrompt, estimateTokenCount } from "@copilot-playground/shared";

import type { MatchSession, SnapshotPayload } from "../redvsblue-types.js";
import { REHYDRATION_DECISION_TAIL } from "./constants.js";
import {
  buildStrategicSummary,
  mergeStrategicSummary,
  STRATEGIC_SUMMARY_MAX_CHARS,
  trimSummary,
} from "./summary.js";

const TOKEN_SAFETY_FACTOR = 0.7;
const DEFAULT_TOKEN_BUDGET = 4000;
const TOKEN_BUDGET_SNAPSHOT_LIMIT = 10;

function getTokenBudget(): number {
  const raw = process.env.REDVSBLUE_TOKEN_BUDGET;
  if (!raw) {
    return DEFAULT_TOKEN_BUDGET;
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TOKEN_BUDGET;
}

export function enforceTokenBudget(session: MatchSession, snapshot: SnapshotPayload): void {
  const tokenBudget = Math.floor(getTokenBudget() * TOKEN_SAFETY_FACTOR);
  const previewPrompt = buildDecisionPrompt(session, snapshot, "budget-check", {
    decisionTail: REHYDRATION_DECISION_TAIL,
  });
  if (estimateTokenCount(previewPrompt) <= tokenBudget) {
    return;
  }

  const overflow = session.snapshots.length - TOKEN_BUDGET_SNAPSHOT_LIMIT;
  if (overflow > 0) {
    const summarized = session.snapshots.slice(0, overflow);
    const newSummary = buildStrategicSummary(summarized);
    session.strategicSummary = mergeStrategicSummary(session.strategicSummary, newSummary);
    session.snapshots = session.snapshots.slice(overflow);
  }

  session.strategicSummary = trimSummary(
    session.strategicSummary,
    Math.floor(STRATEGIC_SUMMARY_MAX_CHARS / 2)
  );
  session.summaryUpdatedAt = Date.now();
}

export { DEFAULT_TOKEN_BUDGET, TOKEN_BUDGET_SNAPSHOT_LIMIT, TOKEN_SAFETY_FACTOR };
