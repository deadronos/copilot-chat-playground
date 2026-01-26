import { describe, it, expect } from "vitest"
import {
  buildDecisionPrompt,
  clampNumber,
  estimateTokenCount,
  type ClampWarning,
  type DecisionPromptSession,
  type DecisionPromptSnapshot,
} from "@copilot-playground/shared"

describe("shared helpers", () => {
  it("clamps values and records warnings", () => {
    const warnings: ClampWarning[] = []
    const value = clampNumber(0, { min: 1, max: 5, default: 3 }, warnings, "shipSpeed")

    expect(value).toBe(1)
    expect(warnings).toHaveLength(1)
    expect(warnings[0]?.field).toBe("shipSpeed")
    expect(warnings[0]?.requested).toBe(0)
    expect(warnings[0]?.applied).toBe(1)
  })

  it("estimates token count from text length", () => {
    expect(estimateTokenCount("")).toBe(0)
    expect(estimateTokenCount("hello")).toBe(2)
  })

  it("builds decision prompt with a trimmed decision tail", () => {
    const session: DecisionPromptSession = {
      effectiveRules: { shipSpeed: 5 },
      effectiveConfig: { snapshotIntervalMs: 30000 },
      strategicSummary: "summary",
      decisionHistory: [
        {
          status: "accepted",
          requestId: "a",
          validatedDecision: { params: { team: "red", count: 1 } },
        },
        {
          status: "accepted",
          requestId: "b",
          validatedDecision: { params: { team: "red", count: 2 } },
        },
        {
          status: "accepted",
          requestId: "c",
          validatedDecision: { params: { team: "blue", count: 3 } },
        },
      ],
    }
    const snapshot: DecisionPromptSnapshot = {
      counts: { red: 1, blue: 2 },
      gameSummary: { totalShips: 3 },
    }

    const prompt = buildDecisionPrompt(session, snapshot, "req-1", { decisionTail: 2 })

    expect(prompt).toContain("requestId must equal: req-1")
    expect(prompt).toContain("accepted b (red:2)")
    expect(prompt).toContain("accepted c (blue:3)")
    expect(prompt).not.toContain("accepted a (red:1)")
  })
})
