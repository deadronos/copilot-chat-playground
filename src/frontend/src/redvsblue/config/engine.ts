export type EngineTuning = {
  // AI tuning
  turnSpeed: number
  shipThrust: number
  visionDist: number
  fireDist: number
  aimTurnThreshold: number
  fireAngleThreshold: number
  fireAimCloseThreshold: number
  idleAngleIncrement: number

  // Bullet
  bulletLife: number
  bulletRadius: number

  // Ship
  shipRadius: number
  cooldownBase: number
  cooldownRandom: number
  isThrustingThreshold: number

  // Particle effects
  hitParticles: number
  deathParticles: number
  particleVelocityMul: number
  particleLifeDecay: number

  // Physics
  friction: number
  idleDamping: number
}

export const DEFAULT_ENGINE_TUNING: EngineTuning = {
  turnSpeed: 0.08,
  shipThrust: 0.2,
  visionDist: 800,
  fireDist: 400,
  aimTurnThreshold: 0.05,
  fireAngleThreshold: 0.2,
  fireAimCloseThreshold: 1.0,
  idleAngleIncrement: 0.01,

  bulletLife: 50,
  bulletRadius: 3,

  shipRadius: 12,
  cooldownBase: 20,
  cooldownRandom: 10,
  isThrustingThreshold: 0.1,

  hitParticles: 5,
  deathParticles: 15,
  particleVelocityMul: 5,
  particleLifeDecay: 0.03,

  friction: 0.98,
  idleDamping: 0.95,
}
