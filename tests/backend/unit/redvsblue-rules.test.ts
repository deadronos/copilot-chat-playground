import { describe, it, expect } from "vitest"
import { loadRedVsBlueConfig } from "@copilot-playground/shared"
import { buildEffectiveConfig, buildEffectiveRules } from "../../../src/backend/src/services/redvsblue/rules.js"
import type { RuleWarning } from "../../../src/backend/src/services/redvsblue-types.js"

describe("redvsblue rules helpers", () => {
  it("clamps rules and returns warnings for out-of-range values", () => {
    const { config } = loadRedVsBlueConfig()
    const { ruleRanges } = config

    const { effectiveRules, warnings } = buildEffectiveRules({
      shipSpeed: ruleRanges.shipSpeed.max + 50,
      bulletSpeed: ruleRanges.bulletSpeed.min - 10,
      bulletDamage: ruleRanges.bulletDamage.max + 20,
      shipMaxHealth: ruleRanges.shipMaxHealth.min - 20,
    })

    expect(effectiveRules.shipSpeed).toBe(ruleRanges.shipSpeed.max)
    expect(effectiveRules.bulletSpeed).toBe(ruleRanges.bulletSpeed.min)
    expect(effectiveRules.bulletDamage).toBe(ruleRanges.bulletDamage.max)
    expect(effectiveRules.shipMaxHealth).toBe(ruleRanges.shipMaxHealth.min)
    expect(warnings.map((warning) => warning.field)).toEqual(
      expect.arrayContaining(["shipSpeed", "bulletSpeed", "bulletDamage", "shipMaxHealth"])
    )
  })

  it("clamps config inputs and appends warnings", () => {
    const { config } = loadRedVsBlueConfig()
    const { configRanges } = config
    const warnings: RuleWarning[] = []

    const effectiveConfig = buildEffectiveConfig(
      { snapshotIntervalMs: configRanges.snapshotIntervalMs.max + 5000 },
      warnings
    )

    expect(effectiveConfig.snapshotIntervalMs).toBe(configRanges.snapshotIntervalMs.max)
    expect(warnings.some((warning) => warning.field === "snapshotIntervalMs")).toBe(true)
  })
})
