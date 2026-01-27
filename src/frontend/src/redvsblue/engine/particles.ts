import { Particle } from "./entities"
import type { RNG } from "./rng"

/**
 * Create N particles centered at (x,y) with given color using provided id generator and RNG.
 */
export function createParticles(
  count: number,
  x: number,
  y: number,
  color: string,
  nextEntityId: (prefix: string) => string,
  rng: RNG
): Particle[] {
  const out: Particle[] = []
  for (let i = 0; i < count; i++) {
    out.push(new Particle(nextEntityId("particle"), x, y, color, rng))
  }
  return out
}

/**
 * Create death particles (two per `deathCount`): white and ship color for each iteration.
 */
export function createDeathParticles(
  deathCount: number,
  x: number,
  y: number,
  shipColor: string,
  nextEntityId: (prefix: string) => string,
  rng: RNG
): Particle[] {
  const out: Particle[] = []
  for (let i = 0; i < deathCount; i++) {
    out.push(new Particle(nextEntityId("particle"), x, y, "white", rng))
    out.push(new Particle(nextEntityId("particle"), x, y, shipColor, rng))
  }
  return out
}
