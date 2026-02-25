import { DEFAULT_ENGINE_TUNING } from "@/redvsblue/config/index";
import type { EngineConfig, TelemetryEvent } from "@/redvsblue/types";
import type { RNG } from "./rng";
import { Bullet, Particle, Ship, type ShipAIConfig } from "./entities";
import { checkCollisions } from "./collisions";
import { buildAiConfig } from "./aiConfig";

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
    const aiConfig = buildAiConfig(ship as any, tuning as any);
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
      const bulletSpeed = ship.bulletSpeedOverride ?? config.bulletSpeed;
      const bulletDamage = ship.bulletDamageOverride ?? config.bulletDamage;
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
