import { describe, it, expect } from "vitest"
import {
  mergeStrategicSummary,
  STRATEGIC_SUMMARY_MAX_CHARS,
  trimSummary,
} from "../../../src/backend/src/services/redvsblue/summary.js"

describe("redvsblue summary helpers", () => {
  it("trims summaries from the front to enforce a max length", () => {
    const summary = "x".repeat(STRATEGIC_SUMMARY_MAX_CHARS + 10)
    const trimmed = trimSummary(summary, STRATEGIC_SUMMARY_MAX_CHARS)
    expect(trimmed?.length).toBe(STRATEGIC_SUMMARY_MAX_CHARS)
    expect(trimmed).toBe(summary.slice(10))
  })

  it("merges summaries and keeps within the strategic max size", () => {
    const previous = "a".repeat(STRATEGIC_SUMMARY_MAX_CHARS - 5)
    const next = "b".repeat(20)
    const merged = mergeStrategicSummary(previous, next)
    expect(merged.length).toBeLessThanOrEqual(STRATEGIC_SUMMARY_MAX_CHARS)
  })
})
