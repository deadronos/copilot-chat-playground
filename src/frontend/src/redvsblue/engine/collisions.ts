import type { EngineCoreState, EngineCoreContext } from "@/redvsblue/engine/core"
import type { EngineTuning } from "@/redvsblue/config"
import type { TelemetryEvent } from "@/redvsblue/types"
import { createParticles, createDeathParticles } from "@/redvsblue/engine/particles"

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

      const dx = bullet.x - ship.x
      const dy = bullet.y - ship.y
      const distSq = dx * dx + dy * dy
      const radiusSum = ship.radius + bullet.radius
      if (distSq < radiusSum * radiusSum) {
        ship.health -= bullet.damage
        bullet.active = false

        // Emit hit event
        emit("telemetry", {
          type: "bullet_hit",
          timestamp: Date.now(),
          data: { shipId: ship.id, bulletOwnerId: bullet.ownerId },
        } as TelemetryEvent)

        // Create particles using centralized factory
        state.particles.push(...createParticles(tuning.hitParticles, bullet.x, bullet.y, ship.color, nextEntityId, rng))

        // Check if ship dies
        if (ship.health <= 0) {
          // Create death particles (white + ship color pairs)
          state.particles.push(...createDeathParticles(tuning.deathParticles, ship.x, ship.y, ship.color, nextEntityId, rng))

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
