import { describe, it, expect } from "vitest"
import { buildAiConfig } from "@/redvsblue/engine/aiConfig"
import { DEFAULT_ENGINE_TUNING } from "@/redvsblue/config/index"

describe("buildAiConfig", () => {
  it("merges tuning and ship-specific overrides", () => {
    const ship: any = { shipThrustOverride: 42 }
    const ai = buildAiConfig(ship, DEFAULT_ENGINE_TUNING)
    expect(ai.shipThrust).toBe(42)
    expect(ai.turnSpeed).toBe(DEFAULT_ENGINE_TUNING.turnSpeed)
  })

  it("uses defaults when no overrides", () => {
    const ship: any = {}
    const ai = buildAiConfig(ship, DEFAULT_ENGINE_TUNING)
    expect(ai.shipThrust).toBe(DEFAULT_ENGINE_TUNING.shipThrust)
  })
})
