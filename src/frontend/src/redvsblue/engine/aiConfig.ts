import type { ShipAIConfig } from "./entities"

type ShipWithAiOverrides = {
  shipThrustOverride?: number
}

type AiTuningConfig = {
  turnSpeed: number
  shipThrust: number
  visionDist: number
  aimTurnThreshold: number
  fireAimCloseThreshold: number
  fireAngleThreshold: number
  idleAngleIncrement: number
  idleDamping: number
}

export function buildAiConfig(ship: ShipWithAiOverrides, tuning: AiTuningConfig): ShipAIConfig {
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
