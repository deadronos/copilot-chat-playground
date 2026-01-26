import { describe, expect, it } from "vitest";
import {
  DEFAULT_REDVSBLUE_CONFIG,
  DEFAULT_REDVSBLUE_DECISION_LIMITS,
  DEFAULT_REDVSBLUE_RULE_RANGES,
  loadRedVsBlueConfig,
} from "@copilot-playground/shared";

describe("redvsblue shared config", () => {
  it("returns defaults with no overrides", () => {
    const { config, appliedOverrides } = loadRedVsBlueConfig({ env: {} });

    expect(appliedOverrides).toEqual([]);
    expect(config).toEqual(DEFAULT_REDVSBLUE_CONFIG);
  });

  it("applies JSON overrides", () => {
    const { config, appliedOverrides } = loadRedVsBlueConfig({
      env: {
        REDVSBLUE_CONFIG: JSON.stringify({
          decisionLimits: { maxSpawnPerDecision: 3 },
        }),
      },
    });

    expect(appliedOverrides).toEqual(["REDVSBLUE_CONFIG"]);
    expect(config.decisionLimits.maxSpawnPerDecision).toBe(3);
    expect(config.decisionLimits.maxSpawnPerMinute).toBe(
      DEFAULT_REDVSBLUE_DECISION_LIMITS.maxSpawnPerMinute
    );
  });

  it("applies scalar overrides", () => {
    const { config, appliedOverrides } = loadRedVsBlueConfig({
      env: {
        REDVSBLUE_SHIP_SPEED_DEFAULT: "7",
        REDVSBLUE_MAX_SPAWN_PER_MINUTE: "20",
      },
    });

    expect(appliedOverrides).toEqual([
      "REDVSBLUE_SHIP_SPEED_DEFAULT",
      "REDVSBLUE_MAX_SPAWN_PER_MINUTE",
    ]);
    expect(config.ruleRanges.shipSpeed.default).toBe(7);
    expect(config.decisionLimits.maxSpawnPerMinute).toBe(20);
  });

  it("rejects invalid ranges with clear errors", () => {
    expect(() =>
      loadRedVsBlueConfig({
        env: {
          REDVSBLUE_SHIP_SPEED_MIN: "20",
          REDVSBLUE_SHIP_SPEED_MAX: "2",
        },
      })
    ).toThrow(/ruleRanges\.shipSpeed/i);
  });

  it("rejects invalid numeric overrides", () => {
    expect(() =>
      loadRedVsBlueConfig({
        env: {
          REDVSBLUE_MAX_SPAWN_PER_DECISION: "oops",
        },
      })
    ).toThrow(/REDVSBLUE_MAX_SPAWN_PER_DECISION/);
  });

  it("rejects defaults outside the range", () => {
    const min = DEFAULT_REDVSBLUE_RULE_RANGES.shipSpeed.min;
    const max = DEFAULT_REDVSBLUE_RULE_RANGES.shipSpeed.max;
    expect(() =>
      loadRedVsBlueConfig({
        env: {
          REDVSBLUE_SHIP_SPEED_DEFAULT: String(max + min + 1),
        },
      })
    ).toThrow(/ruleRanges\.shipSpeed/i);
  });
});
