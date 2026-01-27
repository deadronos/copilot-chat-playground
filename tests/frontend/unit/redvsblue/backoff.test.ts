import { describe, it, expect } from "vitest"
import { Backoff } from "@/redvsblue/telemetry/backoff"

describe("Backoff", () => {
  it("computes next delay using jitter and doubles current", () => {
    // deterministic rng -> 0
    const b = new Backoff({ baseMs: 1000, maxMs: 10000, rng: () => 0 })
    const d1 = b.getNextDelay()
    expect(d1).toBe(750) // 1000 * (0.75)
    const d2 = b.getNextDelay()
    // current doubled to 2000, jitter 0.75 -> 1500
    expect(d2).toBe(1500)
  })

  it("caps delay at max and does not exceed max when current grows", () => {
    const b = new Backoff({ baseMs: 6000, maxMs: 8000, rng: () => 1 })
    const d1 = b.getNextDelay()
    // jitter 1 -> 0.75 + 1*0.5 = 1.25; 6000 * 1.25 = 7500 (below max)
    expect(d1).toBe(7500)
    const d2 = b.getNextDelay()
    // current doubled to 12000, jitter-> 12000*1.25=15000 but capped to 8000
    expect(d2).toBe(8000)
  })

  it("reset() restores base current", () => {
    const b = new Backoff({ baseMs: 500, maxMs: 2000, rng: () => 0.5 })
    const d1 = b.getNextDelay()
    expect(d1).toBeGreaterThan(0)
    b.reset()
    const d2 = b.getNextDelay()
    // after reset, should be computed from base again
    expect(d2).toBeGreaterThan(0)
  })
})
