import type { ShipAIConfig } from "./entities"
import type { EngineTuning } from "@/redvsblue/config"

type ShipWithOverrides = { shipThrustOverride?: number }
type AiTuning = Pick<
  EngineTuning,
  | "turnSpeed"
  | "shipThrust"
  | "visionDist"
  | "aimTurnThreshold"
  | "fireAimCloseThreshold"
  | "fireAngleThreshold"
  | "idleAngleIncrement"
  | "idleDamping"
>

export function buildAiConfig(ship: ShipWithOverrides, tuning: AiTuning): ShipAIConfig {
  const aiConfig: ShipAIConfig = {
    turnSpeed: tuning.turnSpeed,
    shipThrust: tuning.shipThrust,
    visionDist: tuning.visionDist,
    aimTurnThreshold: tuning.aimTurnThreshold,
    fireAimCloseThreshold: tuning.fireAimCloseThreshold,
    fireAngleThreshold: tuning.fireAngleThreshold,
    idleAngleIncrement: tuning.idleAngleIncrement,
    idleDamping: tuning.idleDamping,
  }

  if (typeof ship?.shipThrustOverride === "number") {
    aiConfig.shipThrust = ship.shipThrustOverride
  }

  return aiConfig
}
