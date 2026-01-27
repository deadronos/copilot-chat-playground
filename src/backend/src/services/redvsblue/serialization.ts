import type {
  MatchSession,
  PersistedDecisionState,
  PersistedMatchSession,
} from "../redvsblue-types.js";

export function serializeMatchSession(session: MatchSession): PersistedMatchSession {
  return {
    ...session,
    decisionState: {
      lastDecisionAt: session.decisionState.lastDecisionAt,
      recentSpawns: session.decisionState.recentSpawns,
      appliedDecisionIds: Array.from(session.decisionState.appliedDecisionIds),
    },
  };
}

export function rebuildDecisionState(
  decisionState: PersistedDecisionState | undefined,
  decisionHistory: MatchSession["decisionHistory"]
): MatchSession["decisionState"] {
  if (decisionState) {
    return {
      lastDecisionAt: decisionState.lastDecisionAt ?? null,
      recentSpawns: decisionState.recentSpawns ?? [],
      appliedDecisionIds: new Set(decisionState.appliedDecisionIds ?? []),
    };
  }

  const appliedDecisionIds = new Set<string>();
  const recentSpawns: Array<{ timestamp: number; count: number }> = [];
  let lastDecisionAt: number | null = null;

  for (const record of decisionHistory) {
    if (record.status !== "accepted" || !record.validatedDecision) {
      continue;
    }
    appliedDecisionIds.add(record.requestId);
    lastDecisionAt = Math.max(lastDecisionAt ?? 0, record.timestamp);
    recentSpawns.push({
      timestamp: record.timestamp,
      count: record.validatedDecision.params.count,
    });
  }

  return { lastDecisionAt, recentSpawns, appliedDecisionIds };
}

export function deserializeMatchSession(raw: PersistedMatchSession): MatchSession {
  return {
    ...raw,
    decisionState: rebuildDecisionState(raw.decisionState, raw.decisionHistory ?? []),
    strategicSummary: raw.strategicSummary ?? null,
    summaryUpdatedAt: raw.summaryUpdatedAt ?? null,
    lastCompactionAt: raw.lastCompactionAt ?? null,
  };
}
