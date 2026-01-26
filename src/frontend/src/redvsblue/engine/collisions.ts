import type { EngineCoreState, EngineCoreContext } from "@/redvsblue/engine/core"
import type { EngineTuning } from "@/redvsblue/config"
import type { TelemetryEvent } from "@/redvsblue/types"
import { Particle } from "@/redvsblue/engine/entities"

export function checkCollisions(
  state: EngineCoreState,
  context: EngineCoreContext,
  tuning: EngineTuning
): void {
  const { emit, rng, nextEntityId } = context

  for (let i = state.bullets.length - 1; i >= 0; i--) {
    const bullet = state.bullets[i]
    if (!bullet.active) continue

    for (let j = state.ships.length - 1; j >= 0; j--) {
      const ship = state.ships[j]
      if (bullet.team === ship.team) continue

      const dist = Math.hypot(bullet.x - ship.x, bullet.y - ship.y)
      if (dist < ship.radius + bullet.radius) {
        ship.health -= bullet.damage
        bullet.active = false

        // Emit hit event
        emit("telemetry", {
          type: "bullet_hit",
          timestamp: Date.now(),
          data: { shipId: ship.id, bulletOwnerId: bullet.ownerId },
        } as TelemetryEvent)

        // Create particles
        for (let k = 0; k < tuning.hitParticles; k++) {
          state.particles.push(new Particle(nextEntityId("particle"), bullet.x, bullet.y, ship.color, rng))
        }

        // Check if ship dies
        if (ship.health <= 0) {
          for (let k = 0; k < tuning.deathParticles; k++) {
            state.particles.push(new Particle(nextEntityId("particle"), ship.x, ship.y, "white", rng))
            state.particles.push(new Particle(nextEntityId("particle"), ship.x, ship.y, ship.color, rng))
          }

          // Emit death event
          emit("telemetry", {
            type: "ship_destroyed",
            timestamp: Date.now(),
            data: { shipId: ship.id, team: ship.team },
          } as TelemetryEvent)

          state.ships.splice(j, 1)
        }

        break
      }
    }
  }
}
