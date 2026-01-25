import { DEFAULT_ENGINE_TUNING } from "@/redvsblue/config/index";
import type { EngineConfig, TelemetryEvent } from "@/redvsblue/types";
import type { RNG } from "./rng";
import { Bullet, Particle, Ship, type ShipAIConfig } from "./entities";

export type EngineCoreState = {
  ships: Ship[];
  bullets: Bullet[];
  particles: Particle[];
  tick: number;
};

export type EngineCoreContext = {
  config: EngineConfig;
  rng: RNG;
  nextEntityId: (prefix: string) => string;
  emit: (event: string, data: TelemetryEvent) => void;
};

export function updateEngineCore(
  state: EngineCoreState,
  context: EngineCoreContext,
  deltaTime: number
): void {
  void deltaTime;

  const { config, rng, nextEntityId, emit } = context;
  const tuning = { ...DEFAULT_ENGINE_TUNING, ...(config?.tuning ?? {}) };

  state.tick++;

  // Update ships
  for (const ship of state.ships) {
    const aiConfig: ShipAIConfig = {
      turnSpeed: tuning.turnSpeed,
      shipThrust: tuning.shipThrust,
      visionDist: tuning.visionDist,
      aimTurnThreshold: tuning.aimTurnThreshold,
      fireAimCloseThreshold: tuning.fireAimCloseThreshold,
      fireAngleThreshold: tuning.fireAngleThreshold,
      idleAngleIncrement: tuning.idleAngleIncrement,
      idleDamping: tuning.idleDamping,
    };

    // Apply ship-specific thrust override if present
    if ((ship as any).shipThrustOverride && typeof (ship as any).shipThrustOverride === "number") {
      aiConfig.shipThrust = (ship as any).shipThrustOverride as number;
    }

    ship.updateAI(
      state.ships,
      state.particles,
      config.canvasWidth,
      config.canvasHeight,
      aiConfig,
      rng,
      () => nextEntityId("particle")
    );
    ship.update(config.canvasWidth, config.canvasHeight, tuning.friction);

    // Check if ship should shoot
    const { enemy, dist } = ship.getNearestEnemy(
      state.ships,
      config.canvasWidth,
      config.canvasHeight,
      tuning.visionDist
    );
    if (
      enemy &&
      Math.abs(Math.atan2(enemy.y - ship.y, enemy.x - ship.x) - ship.angle) <
        tuning.fireAngleThreshold &&
      ship.cooldown <= 0 &&
      dist < tuning.fireDist
    ) {
      const bulletPos = ship.shoot();
      const bulletSpeed = (ship as any).bulletSpeedOverride ?? config.bulletSpeed;
      const bulletDamage = (ship as any).bulletDamageOverride ?? config.bulletDamage;
      const bullet = new Bullet(
        nextEntityId("bullet"),
        bulletPos.x,
        bulletPos.y,
        bulletPos.angle,
        ship.team,
        ship.id,
        bulletSpeed,
        bulletDamage,
        tuning.bulletLife,
        tuning.bulletRadius
      );
      state.bullets.push(bullet);
      ship.cooldown = tuning.cooldownBase + rng() * tuning.cooldownRandom;

      emit("telemetry", {
        type: "bullet_fired",
        timestamp: Date.now(),
        data: { shipId: ship.id, team: ship.team },
      } as TelemetryEvent);
    }
  }

  // Update bullets
  for (let i = state.bullets.length - 1; i >= 0; i--) {
    const bullet = state.bullets[i];
    bullet.update(config.canvasWidth, config.canvasHeight);
    if (!bullet.active) {
      state.bullets.splice(i, 1);
    }
  }

  // Update particles
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const particle = state.particles[i];
    particle.update();
    if (particle.life <= 0) {
      state.particles.splice(i, 1);
    }
  }

  checkCollisions(state, context, tuning);
}

function checkCollisions(
  state: EngineCoreState,
  context: EngineCoreContext,
  tuning: typeof DEFAULT_ENGINE_TUNING
): void {
  const { emit, rng, nextEntityId } = context;

  for (let i = state.bullets.length - 1; i >= 0; i--) {
    const bullet = state.bullets[i];
    if (!bullet.active) continue;

    for (let j = state.ships.length - 1; j >= 0; j--) {
      const ship = state.ships[j];
      if (bullet.team === ship.team) continue;

      const dist = Math.hypot(bullet.x - ship.x, bullet.y - ship.y);
      if (dist < ship.radius + bullet.radius) {
        ship.health -= bullet.damage;
        bullet.active = false;

        // Emit hit event
        emit("telemetry", {
          type: "bullet_hit",
          timestamp: Date.now(),
          data: { shipId: ship.id, bulletOwnerId: bullet.ownerId },
        } as TelemetryEvent);

        // Create particles
        for (let k = 0; k < tuning.hitParticles; k++) {
          state.particles.push(
            new Particle(nextEntityId("particle"), bullet.x, bullet.y, ship.color, rng)
          );
        }

        // Check if ship dies
        if (ship.health <= 0) {
          for (let k = 0; k < tuning.deathParticles; k++) {
            state.particles.push(
              new Particle(nextEntityId("particle"), ship.x, ship.y, "white", rng)
            );
            state.particles.push(
              new Particle(nextEntityId("particle"), ship.x, ship.y, ship.color, rng)
            );
          }

          // Emit death event
          emit("telemetry", {
            type: "ship_destroyed",
            timestamp: Date.now(),
            data: { shipId: ship.id, team: ship.team },
          } as TelemetryEvent);

          state.ships.splice(j, 1);
        }

        break;
      }
    }
  }
}
