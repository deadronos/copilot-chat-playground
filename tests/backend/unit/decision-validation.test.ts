import { describe, it, expect } from "vitest"
import { validateDecision } from "../../../src/backend/src/app.js"

type Session = Parameters<typeof validateDecision>[0]
type Proposal = Parameters<typeof validateDecision>[1]

function createSession(now: number): Session {
  return {
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
  }
}

describe("validateDecision", () => {
  it("rejects duplicate decision ids", () => {
    const now = Date.now()
    const session = createSession(now)
    session.decisionState.appliedDecisionIds.add("dup")

    const proposal: Proposal = {
      requestId: "dup",
      type: "spawnShips",
      params: { team: "red", count: 2 },
    }

    const result = validateDecision(session, proposal, now)
    expect(result.validatedDecision).toBeUndefined()
    expect(result.rejectionReason).toBe("Duplicate decision requestId")
  })

  it("clamps count per decision and returns warnings", () => {
    const now = Date.now()
    const session = createSession(now)
    const proposal: Proposal = {
      requestId: "new",
      type: "spawnShips",
      params: { team: "blue", count: 10 },
    }

    const result = validateDecision(session, proposal, now)
    expect(result.validatedDecision?.params.count).toBe(5)
    expect(result.validatedDecision?.warnings.length).toBe(1)
  })

  it("rejects decisions during cooldown", () => {
    const now = Date.now()
    const session = createSession(now)
    session.decisionState.lastDecisionAt = now - 1000

    const proposal: Proposal = {
      requestId: "cooldown",
      type: "spawnShips",
      params: { team: "red", count: 1 },
    }

    const result = validateDecision(session, proposal, now)
    expect(result.validatedDecision).toBeUndefined()
    expect(result.rejectionReason).toBe("Decision cooldown active")
  })

  it("rejects when per-minute spawn budget is exhausted", () => {
    const now = Date.now()
    const session = createSession(now)
    session.decisionState.recentSpawns = [
      { timestamp: now - 1000, count: 10 },
      { timestamp: now - 2000, count: 5 },
    ]

    const proposal: Proposal = {
      requestId: "budget",
      type: "spawnShips",
      params: { team: "red", count: 1 },
    }

    const result = validateDecision(session, proposal, now)
    expect(result.validatedDecision).toBeUndefined()
    expect(result.rejectionReason).toBe("Per-minute spawn budget exhausted")
  })
})
