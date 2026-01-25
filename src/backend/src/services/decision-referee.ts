import { z } from "zod";

import type {
  DecisionAuditRecord,
  DecisionProposal,
  DecisionState,
  TraceContext,
  ValidatedDecision,
} from "./redvsblue-types.js";

export const DECISION_LIMITS = {
  maxSpawnPerDecision: 5,
  maxSpawnPerMinute: 15,
  cooldownMs: 5_000,
};

const DecisionProposalSchema = z.object({
  requestId: z.string().min(1),
  type: z.literal("spawnShips"),
  params: z.object({
    team: z.enum(["red", "blue"]),
    count: z.number().int().min(1).max(50),
  }),
  confidence: z.number().min(0).max(1).optional(),
  reason: z.string().min(1).max(500).optional(),
});

export function parseDecisionProposal(
  output: string
): { proposal?: DecisionProposal; error?: string } {
  let raw: unknown;
  try {
    raw = JSON.parse(output);
  } catch (error) {
    return {
      error:
        error instanceof Error ? `Invalid JSON: ${error.message}` : "Invalid JSON response.",
    };
  }
  const parsed = DecisionProposalSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.message };
  }
  return { proposal: parsed.data };
}

export function validateDecision(
  decisionState: DecisionState,
  proposal: DecisionProposal,
  now: number
): { validatedDecision?: ValidatedDecision; rejectionReason?: string } {
  if (decisionState.appliedDecisionIds.has(proposal.requestId)) {
    return { rejectionReason: "Duplicate decision requestId" };
  }

  if (
    decisionState.lastDecisionAt &&
    now - decisionState.lastDecisionAt < DECISION_LIMITS.cooldownMs
  ) {
    return { rejectionReason: "Decision cooldown active" };
  }

  const recentSpawns = decisionState.recentSpawns.filter(
    (entry) => now - entry.timestamp < 60_000
  );
  const usedSpawnCount = recentSpawns.reduce((sum, entry) => sum + entry.count, 0);
  let nextCount = proposal.params.count;
  const warnings: string[] = [];

  if (nextCount > DECISION_LIMITS.maxSpawnPerDecision) {
    warnings.push(
      `Clamped spawn count to ${DECISION_LIMITS.maxSpawnPerDecision} (max per decision)`
    );
    nextCount = DECISION_LIMITS.maxSpawnPerDecision;
  }

  const remainingAllowance = Math.max(0, DECISION_LIMITS.maxSpawnPerMinute - usedSpawnCount);
  if (remainingAllowance <= 0) {
    return { rejectionReason: "Per-minute spawn budget exhausted" };
  }
  if (nextCount > remainingAllowance) {
    warnings.push(`Clamped spawn count to ${remainingAllowance} (per-minute limit)`);
    nextCount = remainingAllowance;
  }

  if (nextCount <= 0) {
    return { rejectionReason: "No spawn allowance available" };
  }

  const validatedDecision: ValidatedDecision = {
    requestId: proposal.requestId,
    type: "spawnShips",
    params: {
      team: proposal.params.team,
      count: nextCount,
    },
    warnings,
  };

  decisionState.recentSpawns = recentSpawns;
  decisionState.lastDecisionAt = now;
  decisionState.recentSpawns.push({ timestamp: now, count: nextCount });
  decisionState.appliedDecisionIds.add(proposal.requestId);

  return { validatedDecision };
}

export function logStructuredEvent(
  level: "info" | "warn" | "error",
  event: string,
  context: TraceContext,
  payload: Record<string, unknown> = {}
): void {
  console[level](`[redvsblue] ${event}`, {
    ...context,
    ...payload,
  });
}

export function logDecisionAudit(record: DecisionAuditRecord, context: TraceContext): void {
  if (record.status === "accepted") {
    logStructuredEvent("info", "decision accepted", context, record);
  } else if (record.status === "invalid") {
    logStructuredEvent("warn", "decision invalid", context, record);
  } else {
    logStructuredEvent("warn", "decision rejected", context, record);
  }
}
