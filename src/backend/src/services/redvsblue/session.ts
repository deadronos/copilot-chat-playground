import type { MatchSession, SnapshotPayload } from "../redvsblue-types.js";
import type { ClientConfigInput, ProposedRules } from "./rules.js";

import { loadPersistedSessions as loadSessionsFromDisk, persistMatchSession as persistSessionToDisk, removePersistedSession as removeSessionFromDisk } from "./persistence.js";
import { buildEffectiveConfig, buildEffectiveRules } from "./rules.js";
import { compactSessionSnapshots } from "./summary.js";
import { enforceTokenBudget } from "./tokenBudget.js";

const MAX_SNAPSHOT_BUFFER = 120;

const matchStore = new Map<string, MatchSession>();

export function getMatchSession(matchId: string): MatchSession | undefined {
  return matchStore.get(matchId);
}

export function setMatchSession(matchId: string, session: MatchSession): void {
  matchStore.set(matchId, session);
}

export function deleteMatchSession(matchId: string): void {
  matchStore.delete(matchId);
}

export function loadPersistedSessions(): void {
  const sessions = loadSessionsFromDisk();
  for (const session of sessions) {
    matchStore.set(session.matchId, session);
  }
}

export async function persistMatchSession(session: MatchSession): Promise<void> {
  await persistSessionToDisk(session);
}

export async function removePersistedSession(matchId: string): Promise<void> {
  await removeSessionFromDisk(matchId);
}

export function generateCommentary(session: MatchSession): string {
  const lastSnapshot = session.snapshots.at(-1);
  if (!lastSnapshot) {
    return "Red and Blue are warming up their engines—this battle is about to pop off!";
  }
  const { red, blue } = lastSnapshot.counts;
  if (red === blue) {
    return `Red and Blue are dead even at ${red} each — sparks flying, lasers blazing!`;
  }
  const leader = red > blue ? "Red" : "Blue";
  const trailing = red > blue ? "Blue" : "Red";
  const lead = Math.abs(red - blue);
  return `${leader} team is ahead by ${lead} ships, but ${trailing} is revving up for a comeback. Red and Blue are both bringing the heat!`;
}

export function createMatchSession(options: {
  matchId: string;
  sessionId: string;
  rulesVersion: string;
  proposedRules: ProposedRules;
  clientConfig: ClientConfigInput;
  now: number;
}): MatchSession {
  const { matchId, sessionId, rulesVersion, proposedRules, clientConfig, now } = options;
  const { effectiveRules, warnings } = buildEffectiveRules(proposedRules);
  const effectiveConfig = buildEffectiveConfig(clientConfig, warnings);

  return {
    matchId,
    sessionId,
    rulesVersion,
    effectiveRules,
    effectiveConfig,
    warnings,
    snapshots: [],
    decisionState: {
      lastDecisionAt: null,
      recentSpawns: [],
      appliedDecisionIds: new Set(),
    },
    decisionHistory: [],
    strategicSummary: null,
    summaryUpdatedAt: null,
    lastCompactionAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function recordSnapshot(session: MatchSession, snapshotPayload: SnapshotPayload): void {
  recordSnapshots(session, [snapshotPayload]);
}

export function recordSnapshots(session: MatchSession, snapshotPayloads: SnapshotPayload[]): void {
  if (snapshotPayloads.length === 0) {
    return;
  }

  session.snapshots.push(...snapshotPayloads);

  if (session.snapshots.length > MAX_SNAPSHOT_BUFFER) {
    session.snapshots.splice(0, session.snapshots.length - MAX_SNAPSHOT_BUFFER);
  }

  compactSessionSnapshots(session);
  enforceTokenBudget(session, snapshotPayloads[snapshotPayloads.length - 1]);
  session.updatedAt = Date.now();
}

export { matchStore };
export { REHYDRATION_DECISION_TAIL } from "./constants.js";
