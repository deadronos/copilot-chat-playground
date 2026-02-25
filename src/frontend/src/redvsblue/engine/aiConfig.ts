import type { ShipAIConfig } from "./entities"

export function buildAiConfig(ship: any, tuning: any): ShipAIConfig {
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
