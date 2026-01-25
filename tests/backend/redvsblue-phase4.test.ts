import {
  buildStrategicSummary,
  compactSessionSnapshots,
  deserializeMatchSession,
  enforceTokenBudget,
  serializeMatchSession,
} from "../../src/backend/src/app"

type Session = Parameters<typeof compactSessionSnapshots>[0]
type Snapshot = Parameters<typeof buildStrategicSummary>[0][number]

const baseSnapshot = (id: number): Snapshot => ({
  timestamp: Date.now() + id,
  snapshotId: `snap-${id}`,
  gameSummary: { redCount: id, blueCount: id + 1, totalShips: id * 2 + 1 },
  counts: { red: id, blue: id + 1 },
  recentMajorEvents: [{ type: "explosion", timestamp: Date.now() + id }],
})

const baseSession = (snapshots: Snapshot[]): Session => ({
  matchId: "match-1",
  sessionId: "session-1",
  rulesVersion: "v1",
  effectiveRules: {
    shipSpeed: 5,
    bulletSpeed: 8,
    bulletDamage: 10,
    shipMaxHealth: 30,
  },
  effectiveConfig: {
    snapshotIntervalMs: 30000,
  },
  warnings: [],
  snapshots,
  decisionState: {
    lastDecisionAt: null,
    recentSpawns: [],
    appliedDecisionIds: new Set(),
  },
  decisionHistory: [],
  strategicSummary: null,
  summaryUpdatedAt: null,
  lastCompactionAt: null,
  createdAt: Date.now(),
  updatedAt: Date.now(),
})

describe("RedVsBlue Phase 4 helpers", () => {
  it("builds a strategic summary with counts and events", () => {
    const summary = buildStrategicSummary([baseSnapshot(1), baseSnapshot(2)])
    expect(summary).toContain("Summary over 2 snapshots.")
    expect(summary).toContain("Events: explosion:2.")
  })

  it("compacts snapshots into a summary when over limit", () => {
    const snapshots = Array.from({ length: 30 }, (_, index) => baseSnapshot(index))
    const session = baseSession(snapshots)

    compactSessionSnapshots(session)

    expect(session.snapshots.length).toBeLessThanOrEqual(25)
    expect(session.strategicSummary).toBeTruthy()
    expect(session.summaryUpdatedAt).not.toBeNull()
  })

  it("serializes and deserializes persisted sessions", () => {
    const session = baseSession([baseSnapshot(1)])
    session.decisionState.appliedDecisionIds.add("decision-1")
    session.strategicSummary = "Initial summary"

    const persisted = serializeMatchSession(session)
    const restored = deserializeMatchSession(persisted)

    expect(restored.decisionState.appliedDecisionIds.has("decision-1")).toBe(true)
    expect(restored.strategicSummary).toBe("Initial summary")
  })

  it("enforces token budget by trimming snapshots and summary", () => {
    const originalBudget = process.env.REDVSBLUE_TOKEN_BUDGET
    process.env.REDVSBLUE_TOKEN_BUDGET = "50"

    const snapshots = Array.from({ length: 20 }, (_, index) => baseSnapshot(index))
    const session = baseSession(snapshots)
    session.strategicSummary = "x".repeat(2000)

    enforceTokenBudget(session, session.snapshots[session.snapshots.length - 1])

    expect(session.snapshots.length).toBeLessThanOrEqual(10)
    expect(session.strategicSummary?.length ?? 0).toBeLessThan(2000)

    if (originalBudget === undefined) {
      delete process.env.REDVSBLUE_TOKEN_BUDGET
    } else {
      process.env.REDVSBLUE_TOKEN_BUDGET = originalBudget
    }
  })
})
