import fs from "node:fs";
import path from "node:path";
import {
  buildDecisionPrompt,
  clampNumber,
  estimateTokenCount,
  loadRedVsBlueConfig,
} from "@copilot-playground/shared";

import type {
  MatchConfig,
  MatchRules,
  MatchSession,
  PersistedDecisionState,
  PersistedMatchSession,
  RuleWarning,
  SnapshotPayload,
} from "./redvsblue-types.js";

type ProposedRules = Partial<MatchRules>;
type ClientConfigInput = {
  snapshotIntervalMs?: number;
};

const { config: redVsBlueConfig } = loadRedVsBlueConfig();
const RULE_RANGES = redVsBlueConfig.ruleRanges;
const CONFIG_RANGES = redVsBlueConfig.configRanges;

const MAX_SNAPSHOT_BUFFER = 120;
const REHYDRATION_SNAPSHOT_LIMIT = 25;
export const REHYDRATION_DECISION_TAIL = 5;
const TOKEN_SAFETY_FACTOR = 0.7;
const DEFAULT_TOKEN_BUDGET = 4000;
const STRATEGIC_SUMMARY_MAX_CHARS = 1200;
const TOKEN_BUDGET_SNAPSHOT_LIMIT = 10;

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

function getPersistDir(): string {
  return process.env.REDVSBLUE_PERSIST_DIR || "/tmp/redvsblue-sessions";
}

function ensurePersistDir(): void {
  fs.mkdirSync(getPersistDir(), { recursive: true });
}

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

function rebuildDecisionState(
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

export function loadPersistedSessions(): void {
  ensurePersistDir();
  const entries = fs.readdirSync(getPersistDir(), { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".json")) {
      continue;
    }
    const filePath = path.join(getPersistDir(), entry.name);
    try {
      const contents = fs.readFileSync(filePath, "utf8");
      const parsed = JSON.parse(contents) as PersistedMatchSession;
      if (!parsed?.matchId || !parsed.sessionId) {
        continue;
      }
      const session = deserializeMatchSession(parsed);
      matchStore.set(session.matchId, session);
    } catch (error) {
      console.warn("[redvsblue] failed to load persisted session", {
        filePath,
        error: error instanceof Error ? error.message : "unknown error",
      });
    }
  }
}

export async function persistMatchSession(session: MatchSession): Promise<void> {
  ensurePersistDir();
  const filePath = path.join(getPersistDir(), `${session.matchId}.json`);
  const payload = JSON.stringify(serializeMatchSession(session), null, 2);
  try {
    await fs.promises.writeFile(filePath, payload, "utf8");
  } catch (error) {
    console.warn("[redvsblue] failed to persist session", {
      matchId: session.matchId,
      sessionId: session.sessionId,
      error: error instanceof Error ? error.message : "unknown error",
    });
  }
}

export async function removePersistedSession(matchId: string): Promise<void> {
  const filePath = path.join(getPersistDir(), `${matchId}.json`);
  try {
    await fs.promises.unlink(filePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      console.warn("[redvsblue] failed to remove persisted session", {
        matchId,
        error: error instanceof Error ? error.message : "unknown error",
      });
    }
  }
}

function buildEffectiveRules(proposedRules: ProposedRules): {
  effectiveRules: MatchRules;
  warnings: RuleWarning[];
} {
  const warnings: RuleWarning[] = [];
  const effectiveRules: MatchRules = {
    shipSpeed: clampNumber(proposedRules.shipSpeed, RULE_RANGES.shipSpeed, warnings, "shipSpeed"),
    bulletSpeed: clampNumber(
      proposedRules.bulletSpeed,
      RULE_RANGES.bulletSpeed,
      warnings,
      "bulletSpeed"
    ),
    bulletDamage: clampNumber(
      proposedRules.bulletDamage,
      RULE_RANGES.bulletDamage,
      warnings,
      "bulletDamage"
    ),
    shipMaxHealth: clampNumber(
      proposedRules.shipMaxHealth,
      RULE_RANGES.shipMaxHealth,
      warnings,
      "shipMaxHealth"
    ),
  };
  return { effectiveRules, warnings };
}

function buildEffectiveConfig(clientConfig: ClientConfigInput, warnings: RuleWarning[]): MatchConfig {
  return {
    snapshotIntervalMs: clampNumber(
      clientConfig.snapshotIntervalMs,
      CONFIG_RANGES.snapshotIntervalMs,
      warnings,
      "snapshotIntervalMs"
    ),
  };
}

function trimSummary(summary: string | null, maxChars: number): string | null {
  if (!summary) {
    return null;
  }
  if (summary.length <= maxChars) {
    return summary;
  }
  return summary.slice(summary.length - maxChars);
}

export function buildStrategicSummary(snapshots: SnapshotPayload[]): string {
  if (snapshots.length === 0) {
    return "";
  }
  const first = snapshots[0];
  const last = snapshots.at(-1) ?? first;
  const deltaRed = last.counts.red - first.counts.red;
  const deltaBlue = last.counts.blue - first.counts.blue;

  const eventCounts = new Map<string, number>();
  for (const snapshot of snapshots) {
    for (const event of snapshot.recentMajorEvents) {
      const key = event.type;
      eventCounts.set(key, (eventCounts.get(key) ?? 0) + 1);
    }
  }
  const eventSummary = Array.from(eventCounts.entries())
    .map(([type, count]) => `${type}:${count}`)
    .join(", ");

  return [
    `Summary over ${snapshots.length} snapshots.`,
    `Red ${first.counts.red}→${last.counts.red} (Δ${deltaRed}).`,
    `Blue ${first.counts.blue}→${last.counts.blue} (Δ${deltaBlue}).`,
    eventSummary ? `Events: ${eventSummary}.` : "No major events recorded.",
  ].join(" ");
}

function mergeStrategicSummary(previous: string | null, next: string): string {
  const combined = [previous, next].filter(Boolean).join(" ");
  return trimSummary(combined, STRATEGIC_SUMMARY_MAX_CHARS) ?? "";
}

export function compactSessionSnapshots(session: MatchSession): void {
  const overflow = session.snapshots.length - REHYDRATION_SNAPSHOT_LIMIT;
  if (overflow <= 0) {
    return;
  }
  const summarized = session.snapshots.slice(0, overflow);
  const newSummary = buildStrategicSummary(summarized);
  session.strategicSummary = mergeStrategicSummary(session.strategicSummary, newSummary);
  session.snapshots = session.snapshots.slice(overflow);
  session.summaryUpdatedAt = Date.now();
  session.lastCompactionAt = Date.now();
}

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
  session.snapshots.push(snapshotPayload);
  if (session.snapshots.length > MAX_SNAPSHOT_BUFFER) {
    session.snapshots.splice(0, session.snapshots.length - MAX_SNAPSHOT_BUFFER);
  }
  compactSessionSnapshots(session);
  enforceTokenBudget(session, snapshotPayload);
  session.updatedAt = Date.now();
}
