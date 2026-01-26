import { clampNumber, loadRedVsBlueConfig } from "@copilot-playground/shared";

import type { MatchConfig, MatchRules, RuleWarning } from "../redvsblue-types.js";

type ProposedRules = Partial<MatchRules>;
type ClientConfigInput = {
  snapshotIntervalMs?: number;
};

const { config: redVsBlueConfig } = loadRedVsBlueConfig();
const RULE_RANGES = redVsBlueConfig.ruleRanges;
const CONFIG_RANGES = redVsBlueConfig.configRanges;

export function buildEffectiveRules(proposedRules: ProposedRules): {
  effectiveRules: MatchRules;
  warnings: RuleWarning[];
} {
  const warnings: RuleWarning[] = [];
  const effectiveRules: MatchRules = {
    shipSpeed: clampNumber(proposedRules.shipSpeed, RULE_RANGES.shipSpeed, warnings, "shipSpeed"),
    bulletSpeed: clampNumber(
      proposedRules.bulletSpeed,
      RULE_RANGES.bulletSpeed,
      warnings,
      "bulletSpeed"
    ),
    bulletDamage: clampNumber(
      proposedRules.bulletDamage,
      RULE_RANGES.bulletDamage,
      warnings,
      "bulletDamage"
    ),
    shipMaxHealth: clampNumber(
      proposedRules.shipMaxHealth,
      RULE_RANGES.shipMaxHealth,
      warnings,
      "shipMaxHealth"
    ),
  };
  return { effectiveRules, warnings };
}

export function buildEffectiveConfig(
  clientConfig: ClientConfigInput,
  warnings: RuleWarning[]
): MatchConfig {
  return {
    snapshotIntervalMs: clampNumber(
      clientConfig.snapshotIntervalMs,
      CONFIG_RANGES.snapshotIntervalMs,
      warnings,
      "snapshotIntervalMs"
    ),
  };
}

export type { ClientConfigInput, ProposedRules };
