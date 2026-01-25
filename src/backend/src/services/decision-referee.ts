import { z } from "zod";
import { loadRedVsBlueConfig } from "@copilot-playground/shared";

import type {
  DecisionAuditRecord,
  DecisionProposal,
  DecisionState,
  TraceContext,
  ValidatedDecision,
} from "./redvsblue-types.js";

const { config: redVsBlueConfig } = loadRedVsBlueConfig();
export const DECISION_LIMITS = redVsBlueConfig.decisionLimits;

const DecisionProposalSchema = z.object({
  requestId: z.string().min(1),
  type: z.literal("spawnShips"),
  params: z.object({
    team: z.enum(["red", "blue"]),
    count: z.number().int().min(1).max(50),
    overrides: z
      .object({
        shipSpeed: z.number().finite().optional(),
        bulletSpeed: z.number().finite().optional(),
        bulletDamage: z.number().finite().optional(),
        shipMaxHealth: z.number().finite().optional(),
      })
      .optional(),
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
  now: number,
  allowOverrides: boolean = true
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

  // Process optional overrides: if allowed by client, clamp to rule ranges and emit warnings when clamped
  let appliedOverrides: NonNullable<ValidatedDecision["params"]["overrides"]> | undefined = undefined;
  if (allowOverrides && proposal.params.overrides) {
    appliedOverrides = {};
    const ranges = loadRedVsBlueConfig().config.ruleRanges;
    const clamp = (key: string, value: number, min: number, max: number) => {
      if (value < min) return { applied: min, warned: true };
      if (value > max) return { applied: max, warned: true };
      return { applied: value, warned: false };
    };

    const { shipSpeed, bulletSpeed, bulletDamage, shipMaxHealth } = proposal.params.overrides;
    if (typeof shipSpeed === "number") {
      const cl = clamp("shipSpeed", shipSpeed, ranges.shipSpeed.min, ranges.shipSpeed.max);
      appliedOverrides.shipSpeed = cl.applied;
      if (cl.warned) warnings.push(`Clamped shipSpeed to ${cl.applied}`);
    }
    if (typeof bulletSpeed === "number") {
      const cl = clamp("bulletSpeed", bulletSpeed, ranges.bulletSpeed.min, ranges.bulletSpeed.max);
      appliedOverrides.bulletSpeed = cl.applied;
      if (cl.warned) warnings.push(`Clamped bulletSpeed to ${cl.applied}`);
    }
    if (typeof bulletDamage === "number") {
      const cl = clamp("bulletDamage", bulletDamage, ranges.bulletDamage.min, ranges.bulletDamage.max);
      appliedOverrides.bulletDamage = cl.applied;
      if (cl.warned) warnings.push(`Clamped bulletDamage to ${cl.applied}`);
    }
    if (typeof shipMaxHealth === "number") {
      const cl = clamp("shipMaxHealth", shipMaxHealth, ranges.shipMaxHealth.min, ranges.shipMaxHealth.max);
      appliedOverrides.shipMaxHealth = cl.applied;
      if (cl.warned) warnings.push(`Clamped shipMaxHealth to ${cl.applied}`);
    }

    if (Object.keys(appliedOverrides).length === 0) {
      appliedOverrides = undefined;
    }
  } else if (!allowOverrides && proposal.params.overrides) {
    // Overrides were proposed but client requested overrides be ignored
    warnings.push("AI override proposal ignored (client disabled overrides).");
  }

  const validatedDecision: ValidatedDecision = {
    requestId: proposal.requestId,
    type: "spawnShips",
    params: {
      team: proposal.params.team,
      count: nextCount,
      overrides: appliedOverrides,
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
