import { describe, it, expect } from "vitest"
import { rebuildDecisionState } from "../../../src/backend/src/services/redvsblue/serialization.js"
import type { DecisionAuditRecord } from "../../../src/backend/src/services/redvsblue-types.js"

describe("redvsblue serialization helpers", () => {
  it("rebuilds decision state from accepted decision history", () => {
    const now = Date.now()
    const decisionHistory: DecisionAuditRecord[] = [
      {
        requestId: "accepted-1",
        matchId: "match-1",
        sessionId: "session-1",
        status: "accepted",
        timestamp: now - 1000,
        validatedDecision: {
          requestId: "accepted-1",
          type: "spawnShips",
          params: { team: "red", count: 2 },
          warnings: [],
        },
      },
      {
        requestId: "rejected-1",
        matchId: "match-1",
        sessionId: "session-1",
        status: "rejected",
        reason: "nope",
        timestamp: now - 500,
      },
    ]

    const rebuilt = rebuildDecisionState(undefined, decisionHistory)

    expect(rebuilt.appliedDecisionIds.has("accepted-1")).toBe(true)
    expect(rebuilt.appliedDecisionIds.has("rejected-1")).toBe(false)
    expect(rebuilt.lastDecisionAt).toBe(now - 1000)
    expect(rebuilt.recentSpawns).toEqual([{ timestamp: now - 1000, count: 2 }])
  })
})
