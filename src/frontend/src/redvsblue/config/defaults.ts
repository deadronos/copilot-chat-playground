import { DEFAULT_REDVSBLUE_RULES } from "@copilot-playground/shared"
import type { EngineConfig } from "@/redvsblue/types"

export const DEFAULT_ENGINE_CONFIG: Omit<EngineConfig, "canvasWidth" | "canvasHeight"> = {
  shipSpeed: DEFAULT_REDVSBLUE_RULES.shipSpeed,
  bulletSpeed: DEFAULT_REDVSBLUE_RULES.bulletSpeed,
  bulletDamage: DEFAULT_REDVSBLUE_RULES.bulletDamage,
  shipMaxHealth: DEFAULT_REDVSBLUE_RULES.shipMaxHealth,
  enableTelemetry: true,
  seed: undefined,
}

export default DEFAULT_ENGINE_CONFIG
