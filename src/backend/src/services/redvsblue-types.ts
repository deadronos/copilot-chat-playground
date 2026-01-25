export type Team = "red" | "blue";

export type MatchRules = {
  shipSpeed: number;
  bulletSpeed: number;
  bulletDamage: number;
  shipMaxHealth: number;
};

export type MatchConfig = {
  snapshotIntervalMs: number;
};

export type RuleWarning = {
  field: string;
  message: string;
  requested: number;
  applied: number;
};

export type SnapshotPayload = {
  timestamp: number;
  snapshotId: string;
  gameSummary: {
    redCount: number;
    blueCount: number;
    totalShips: number;
  };
  counts: {
    red: number;
    blue: number;
  };
  recentMajorEvents: Array<{
    type: string;
    timestamp: number;
    team?: Team;
    summary?: string;
  }>;
  requestDecision?: boolean;
  requestOverrides?: boolean;
};

export type DecisionProposal = {
  requestId: string;
  type: "spawnShips";
  params: {
    team: Team;
    count: number;
    overrides?: {
      shipSpeed?: number;
      bulletSpeed?: number;
      bulletDamage?: number;
      shipMaxHealth?: number;
    };
  };
  confidence?: number;
  reason?: string;
};

export type ValidatedDecision = {
  requestId: string;
  type: "spawnShips";
  params: {
    team: Team;
    count: number;
    overrides?: {
      shipSpeed?: number;
      bulletSpeed?: number;
      bulletDamage?: number;
      shipMaxHealth?: number;
    };
  };
  warnings: string[];
};

export type DecisionAuditRecord = {
  requestId: string;
  matchId: string;
  sessionId: string;
  traceId?: string;
  status: "accepted" | "rejected" | "invalid";
  proposedDecision?: DecisionProposal;
  validatedDecision?: ValidatedDecision;
  reason?: string;
  warnings?: string[];
  timestamp: number;
};

export type DecisionState = {
  lastDecisionAt: number | null;
  recentSpawns: Array<{ timestamp: number; count: number }>;
  appliedDecisionIds: Set<string>;
};

export type PersistedDecisionState = {
  lastDecisionAt: number | null;
  recentSpawns: Array<{ timestamp: number; count: number }>;
  appliedDecisionIds: string[];
};

export type MatchSession = {
  matchId: string;
  sessionId: string;
  rulesVersion: string;
  effectiveRules: MatchRules;
  effectiveConfig: MatchConfig;
  warnings: RuleWarning[];
  snapshots: SnapshotPayload[];
  decisionState: DecisionState;
  decisionHistory: DecisionAuditRecord[];
  strategicSummary: string | null;
  summaryUpdatedAt: number | null;
  lastCompactionAt: number | null;
  createdAt: number;
  updatedAt: number;
};

export type PersistedMatchSession = Omit<MatchSession, "decisionState"> & {
  decisionState: PersistedDecisionState;
};

export type TraceContext = {
  traceId: string;
  requestId: string;
  matchId?: string;
  sessionId?: string;
};
