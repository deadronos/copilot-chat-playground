import { describe, it, expect } from "vitest"
import { DEFAULT_REDVSBLUE_DECISION_LIMITS } from "@copilot-playground/shared"
import { validateDecision } from "../../../src/backend/src/services/decision-referee.js"
import type { DecisionState } from "../../../src/backend/src/services/redvsblue-types.js"

type Proposal = Parameters<typeof validateDecision>[1]

function createDecisionState(): DecisionState {
  return {
    lastDecisionAt: null,
    recentSpawns: [],
    appliedDecisionIds: new Set(),
  }
}

describe("validateDecision", () => {
  it("rejects duplicate decision ids", () => {
    const now = Date.now()
    const decisionState = createDecisionState()
    decisionState.appliedDecisionIds.add("dup")

    const proposal: Proposal = {
      requestId: "dup",
      type: "spawnShips",
      params: { team: "red", count: 2 },
    }

    const result = validateDecision(decisionState, proposal, now)
    expect(result.validatedDecision).toBeUndefined()
    expect(result.rejectionReason).toBe("Duplicate decision requestId")
  })

  it("clamps count per decision and returns warnings", () => {
    const now = Date.now()
    const decisionState = createDecisionState()
    const proposal: Proposal = {
      requestId: "new",
      type: "spawnShips",
      params: { team: "blue", count: 10 },
    }

    const result = validateDecision(decisionState, proposal, now)
    expect(result.validatedDecision?.params.count).toBe(
      DEFAULT_REDVSBLUE_DECISION_LIMITS.maxSpawnPerDecision
    )
    expect(result.validatedDecision?.warnings.length).toBe(1)
  })

  it("rejects decisions during cooldown", () => {
    const now = Date.now()
    const decisionState = createDecisionState()
    decisionState.lastDecisionAt = now - 1000

    const proposal: Proposal = {
      requestId: "cooldown",
      type: "spawnShips",
      params: { team: "red", count: 1 },
    }

    const result = validateDecision(decisionState, proposal, now)
    expect(result.validatedDecision).toBeUndefined()
    expect(result.rejectionReason).toBe("Decision cooldown active")
  })

  it("rejects when per-minute spawn budget is exhausted", () => {
    const now = Date.now()
    const decisionState = createDecisionState()
    decisionState.recentSpawns = [
      { timestamp: now - 1000, count: 10 },
      { timestamp: now - 2000, count: 5 },
    ]

    const proposal: Proposal = {
      requestId: "budget",
      type: "spawnShips",
      params: { team: "red", count: 1 },
    }

    const result = validateDecision(decisionState, proposal, now)
    expect(result.validatedDecision).toBeUndefined()
    expect(result.rejectionReason).toBe("Per-minute spawn budget exhausted")
  })

  it("accepts numeric overrides and clamps them to rule ranges", () => {
    const now = Date.now()
    const decisionState = createDecisionState()

    const proposal: Proposal = {
      requestId: "override-1",
      type: "spawnShips",
      params: {
        team: "red",
        count: 1,
        overrides: {
          shipSpeed: 999,
          bulletSpeed: 999,
          bulletDamage: 999,
          shipMaxHealth: 999,
        },
      },
    }

    const result = validateDecision(decisionState, proposal, now)
    expect(result.validatedDecision).toBeDefined()
    const applied = result.validatedDecision?.params.overrides
    // Values should be clamped to configured maxima
    expect(applied?.bulletDamage).toBeGreaterThanOrEqual(1)
    expect(applied?.bulletDamage).toBeLessThanOrEqual(50)
    expect(applied?.bulletSpeed).toBeGreaterThanOrEqual(2)
    expect(applied?.bulletSpeed).toBeLessThanOrEqual(20)
    expect(applied?.shipSpeed).toBeGreaterThanOrEqual(1)
    expect(applied?.shipSpeed).toBeLessThanOrEqual(10)
    expect(applied?.shipMaxHealth).toBeGreaterThanOrEqual(10)
    expect(applied?.shipMaxHealth).toBeLessThanOrEqual(100)
    expect(result.validatedDecision?.warnings.length).toBeGreaterThan(0)
  })
})
