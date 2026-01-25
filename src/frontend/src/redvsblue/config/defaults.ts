import type { EngineConfig } from "@/redvsblue/types"

export const DEFAULT_ENGINE_CONFIG: Omit<EngineConfig, "canvasWidth" | "canvasHeight"> = {
  shipSpeed: 5,
  bulletSpeed: 8,
  bulletDamage: 5,
  shipMaxHealth: 60,
  enableTelemetry: true,
  seed: undefined,
}

export default DEFAULT_ENGINE_CONFIG
