import { z } from "zod";

export type RuleRange = {
  min: number;
  max: number;
  default: number;
};

export type RedVsBlueRuleValues = {
  shipSpeed: number;
  bulletSpeed: number;
  bulletDamage: number;
  shipMaxHealth: number;
};

export type RedVsBlueConfigValues = {
  snapshotIntervalMs: number;
  defaultAskRequestDecision: boolean;
};

export type RuleRanges = {
  shipSpeed: RuleRange;
  bulletSpeed: RuleRange;
  bulletDamage: RuleRange;
  shipMaxHealth: RuleRange;
};

export type ConfigRanges = {
  snapshotIntervalMs: RuleRange;
};

export type DecisionLimits = {
  maxSpawnPerDecision: number;
  maxSpawnPerMinute: number;
  cooldownMs: number;
};

export const RuleRangeSchema = z
  .object({
    min: z.number().finite(),
    max: z.number().finite(),
    default: z.number().finite(),
  })
  .superRefine((value, context) => {
    if (value.min > value.max) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "min must be <= max",
        path: ["min"],
      });
    }
    if (value.default < value.min || value.default > value.max) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "default must be within [min, max]",
        path: ["default"],
      });
    }
  });

export const RedVsBlueConfigSchema = z.object({
  ruleRanges: z.object({
    shipSpeed: RuleRangeSchema,
    bulletSpeed: RuleRangeSchema,
    bulletDamage: RuleRangeSchema,
    shipMaxHealth: RuleRangeSchema,
  }),
  configRanges: z.object({
    snapshotIntervalMs: RuleRangeSchema,
  }),
  decisionLimits: z.object({
    maxSpawnPerDecision: z.number().int().positive(),
    maxSpawnPerMinute: z.number().int().positive(),
    cooldownMs: z.number().int().positive(),
  }),
});

export type RedVsBlueConfig = z.infer<typeof RedVsBlueConfigSchema>;

export type RedVsBlueConfigLoadResult = {
  config: RedVsBlueConfig;
  appliedOverrides: string[];
};

export const DEFAULT_REDVSBLUE_RULE_RANGES: RuleRanges = {
  shipSpeed: { min: 1, max: 10, default: 5 },
  bulletSpeed: { min: 2, max: 20, default: 8 },
  bulletDamage: { min: 1, max: 50, default: 10 },
  shipMaxHealth: { min: 10, max: 100, default: 30 },
};

export const DEFAULT_REDVSBLUE_CONFIG_RANGES: ConfigRanges = {
  snapshotIntervalMs: { min: 5_000, max: 60_000, default: 10_000 },
};

export const DEFAULT_REDVSBLUE_DECISION_LIMITS: DecisionLimits = {
  maxSpawnPerDecision: 25,
  maxSpawnPerMinute: 100,
  cooldownMs: 2_000,
};

export const DEFAULT_REDVSBLUE_CONFIG: RedVsBlueConfig = {
  ruleRanges: DEFAULT_REDVSBLUE_RULE_RANGES,
  configRanges: DEFAULT_REDVSBLUE_CONFIG_RANGES,
  decisionLimits: DEFAULT_REDVSBLUE_DECISION_LIMITS,
};

export const DEFAULT_REDVSBLUE_RULES: RedVsBlueRuleValues = {
  shipSpeed: DEFAULT_REDVSBLUE_RULE_RANGES.shipSpeed.default,
  bulletSpeed: DEFAULT_REDVSBLUE_RULE_RANGES.bulletSpeed.default,
  bulletDamage: DEFAULT_REDVSBLUE_RULE_RANGES.bulletDamage.default,
  shipMaxHealth: DEFAULT_REDVSBLUE_RULE_RANGES.shipMaxHealth.default,
};

export const DEFAULT_REDVSBLUE_CONFIG_VALUES: RedVsBlueConfigValues = {
  snapshotIntervalMs: DEFAULT_REDVSBLUE_CONFIG_RANGES.snapshotIntervalMs.default,
  defaultAskRequestDecision: true,
};

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

type EnvSource = Record<string, string | undefined>;

const SCALAR_OVERRIDES: Array<{ envKey: string; path: readonly string[] }> = [
  { envKey: "REDVSBLUE_SHIP_SPEED_MIN", path: ["ruleRanges", "shipSpeed", "min"] },
  { envKey: "REDVSBLUE_SHIP_SPEED_MAX", path: ["ruleRanges", "shipSpeed", "max"] },
  { envKey: "REDVSBLUE_SHIP_SPEED_DEFAULT", path: ["ruleRanges", "shipSpeed", "default"] },
  { envKey: "REDVSBLUE_BULLET_SPEED_MIN", path: ["ruleRanges", "bulletSpeed", "min"] },
  { envKey: "REDVSBLUE_BULLET_SPEED_MAX", path: ["ruleRanges", "bulletSpeed", "max"] },
  { envKey: "REDVSBLUE_BULLET_SPEED_DEFAULT", path: ["ruleRanges", "bulletSpeed", "default"] },
  { envKey: "REDVSBLUE_BULLET_DAMAGE_MIN", path: ["ruleRanges", "bulletDamage", "min"] },
  { envKey: "REDVSBLUE_BULLET_DAMAGE_MAX", path: ["ruleRanges", "bulletDamage", "max"] },
  { envKey: "REDVSBLUE_BULLET_DAMAGE_DEFAULT", path: ["ruleRanges", "bulletDamage", "default"] },
  { envKey: "REDVSBLUE_SHIP_MAX_HEALTH_MIN", path: ["ruleRanges", "shipMaxHealth", "min"] },
  { envKey: "REDVSBLUE_SHIP_MAX_HEALTH_MAX", path: ["ruleRanges", "shipMaxHealth", "max"] },
  { envKey: "REDVSBLUE_SHIP_MAX_HEALTH_DEFAULT", path: ["ruleRanges", "shipMaxHealth", "default"] },
  {
    envKey: "REDVSBLUE_SNAPSHOT_INTERVAL_MS_MIN",
    path: ["configRanges", "snapshotIntervalMs", "min"],
  },
  {
    envKey: "REDVSBLUE_SNAPSHOT_INTERVAL_MS_MAX",
    path: ["configRanges", "snapshotIntervalMs", "max"],
  },
  {
    envKey: "REDVSBLUE_SNAPSHOT_INTERVAL_MS_DEFAULT",
    path: ["configRanges", "snapshotIntervalMs", "default"],
  },
  { envKey: "REDVSBLUE_MAX_SPAWN_PER_DECISION", path: ["decisionLimits", "maxSpawnPerDecision"] },
  { envKey: "REDVSBLUE_MAX_SPAWN_PER_MINUTE", path: ["decisionLimits", "maxSpawnPerMinute"] },
  { envKey: "REDVSBLUE_DECISION_COOLDOWN_MS", path: ["decisionLimits", "cooldownMs"] },
];

function getEnvSource(envOverride?: EnvSource): EnvSource {
  if (envOverride) {
    return envOverride;
  }
  if (typeof process !== "undefined" && process.env) {
    return process.env as EnvSource;
  }
  return {};
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function mergeConfig<T>(base: T, overrides?: DeepPartial<T>): T {
  if (!overrides) {
    return base;
  }
  if (!isPlainObject(base) || !isPlainObject(overrides)) {
    return overrides as T;
  }
  const result: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) continue;
    const baseValue = (base as Record<string, unknown>)[key];
    if (isPlainObject(baseValue) && isPlainObject(value)) {
      result[key] = mergeConfig(baseValue, value);
    } else {
      result[key] = value;
    }
  }
  return result as T;
}

function setOverride(target: Record<string, unknown>, path: readonly string[], value: number): void {
  let cursor: Record<string, unknown> = target;
  for (let index = 0; index < path.length - 1; index += 1) {
    const key = path[index];
    const nextValue = cursor[key];
    if (!isPlainObject(nextValue)) {
      cursor[key] = {};
    }
    cursor = cursor[key] as Record<string, unknown>;
  }
  cursor[path[path.length - 1]] = value;
}

function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.join(".");
      return path ? `${path}: ${issue.message}` : issue.message;
    })
    .join("; ");
}

export function loadRedVsBlueConfig(
  options: { env?: EnvSource } = {}
): RedVsBlueConfigLoadResult {
  const env = getEnvSource(options.env);
  let overrides: DeepPartial<RedVsBlueConfig> | undefined;
  const appliedOverrides: string[] = [];

  if (env.REDVSBLUE_CONFIG) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(env.REDVSBLUE_CONFIG);
    } catch (error) {
      const message = error instanceof Error ? error.message : "invalid JSON";
      throw new Error(`Invalid REDVSBLUE_CONFIG JSON: ${message}`);
    }
    if (!isPlainObject(parsed)) {
      throw new Error("Invalid REDVSBLUE_CONFIG JSON: expected object");
    }
    overrides = parsed as DeepPartial<RedVsBlueConfig>;
    appliedOverrides.push("REDVSBLUE_CONFIG");
  }

  for (const { envKey, path } of SCALAR_OVERRIDES) {
    const value = env[envKey];
    if (value === undefined) continue;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      throw new Error(`Invalid ${envKey}: expected number`);
    }
    if (!overrides) {
      overrides = {};
    }
    setOverride(overrides as Record<string, unknown>, path, parsed);
    appliedOverrides.push(envKey);
  }

  const merged = mergeConfig(DEFAULT_REDVSBLUE_CONFIG, overrides);
  const validated = RedVsBlueConfigSchema.safeParse(merged);
  if (!validated.success) {
    throw new Error(`Invalid RedVsBlue config: ${formatZodError(validated.error)}`);
  }

  return { config: validated.data, appliedOverrides };
}
