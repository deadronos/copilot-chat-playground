import type { ShipAIConfig } from "./entities"

type AiConfigTuning = Pick<
  ShipAIConfig,
  | "turnSpeed"
  | "shipThrust"
  | "visionDist"
  | "aimTurnThreshold"
  | "fireAimCloseThreshold"
  | "fireAngleThreshold"
  | "idleAngleIncrement"
  | "idleDamping"
>

type ShipThrustOverrideCarrier = {
  shipThrustOverride?: number
}

export function buildAiConfig(ship: ShipThrustOverrideCarrier | null | undefined, tuning: AiConfigTuning): ShipAIConfig {
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
