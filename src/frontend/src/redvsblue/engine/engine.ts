import type {
  Team,
  Star as StarType,
  GameState,
  EngineConfig,
  TelemetryEvent,
} from "@/redvsblue/types";
import { DEFAULT_ENGINE_TUNING, DEFAULT_UI_CONFIG } from "@/redvsblue/config/index";
import { serialize } from "./serialize";
import { createRng, type RNG } from "./rng";

// ============================================================================
// INTERNAL ENTITY CLASSES (not exposed; converted to typed objects via getState)
// ============================================================================

class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  id: string;

  constructor(id: string, x: number, y: number, color: string, rng: RNG) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.vx = (rng() - 0.5) * DEFAULT_ENGINE_TUNING.particleVelocityMul;
    this.vy = (rng() - 0.5) * DEFAULT_ENGINE_TUNING.particleVelocityMul;
    this.life = 1.0;
    this.color = color;
  }

  update(): void {
    this.x += this.vx;
    this.y += this.vy;
    this.life -= DEFAULT_ENGINE_TUNING.particleLifeDecay;
  }
}

class Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  team: Team;
  color: string;
  radius: number;
  active: boolean;
  id: string;
  ownerId: string;
  angle: number;
  damage: number;

  constructor(
    id: string,
    x: number,
    y: number,
    angle: number,
    team: Team,
    ownerId: string,
    bulletSpeed: number,
    bulletDamage: number,
    bulletLife: number,
    bulletRadius: number
  ) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.vx = Math.cos(angle) * bulletSpeed;
    this.vy = Math.sin(angle) * bulletSpeed;
    this.life = bulletLife;
    this.team = team;
    this.color = team === "red" ? "#ffcccc" : "#ccccff";
    this.radius = bulletRadius;
    this.active = true;
    this.ownerId = ownerId;
    this.damage = bulletDamage;
  }

  update(width: number, height: number): void {
    this.x += this.vx;
    this.y += this.vy;
    this.life--;

    // Wrap around world boundaries
    if (this.x < 0) this.x = width;
    if (this.x > width) this.x = 0;
    if (this.y < 0) this.y = height;
    if (this.y > height) this.y = 0;

    if (this.life <= 0) this.active = false;
  }
}

class Ship {
  x: number;
  y: number;
  team: Team;
  vx: number;
  vy: number;
  angle: number;
  color: string;
  health: number;
  maxHealth: number;
  cooldown: number;
  radius: number;
  id: string;

  constructor(
    id: string,
    x: number,
    y: number,
    team: Team,
    maxHealth: number,
    rng: RNG,
    shipRadius: number
  ) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.team = team;
    this.vx = rng() - 0.5;
    this.vy = rng() - 0.5;
    this.angle = rng() * Math.PI * 2;
    this.color = team === "red" ? "#ff4d4d" : "#4d4dff";
    this.health = maxHealth;
    this.maxHealth = maxHealth;
    this.cooldown = rng() * DEFAULT_ENGINE_TUNING.cooldownRandom;
    this.radius = shipRadius;
  }

  getNearestEnemy(
    ships: Ship[],
    width: number,
    height: number,
    visionDist: number
  ): { enemy: Ship | null; dist: number } {
    let nearest: Ship | null = null;
    let minDist = Infinity;

    for (const other of ships) {
      if (other.team !== this.team) {
        let dx = Math.abs(this.x - other.x);
        let dy = Math.abs(this.y - other.y);
        if (dx > width / 2) dx = width - dx;
        if (dy > height / 2) dy = height - dy;
        const dist = Math.hypot(dx, dy);
        if (dist < minDist && dist < visionDist) {
          minDist = dist;
          nearest = other;
        }
      }
    }

    return { enemy: nearest, dist: minDist };
  }

  updateAI(
    ships: Ship[],
    particles: Particle[],
    width: number,
    height: number,
    config: {
      turnSpeed: number;
      shipThrust: number;
      visionDist: number;
      aimTurnThreshold?: number;
      fireAimCloseThreshold?: number;
      fireAngleThreshold?: number;
      idleAngleIncrement?: number;
      idleDamping?: number;
    },
    rng: RNG,
    createParticleId: () => string
  ): void {
    const aimTurnThreshold = config.aimTurnThreshold ?? 0.05;
    const fireAimCloseThreshold = config.fireAimCloseThreshold ?? 1.0;
    const fireAngleThreshold = config.fireAngleThreshold ?? 0.2;
    const idleAngleIncrement = config.idleAngleIncrement ?? 0.01;
    const idleDamping = config.idleDamping ?? 0.95;

    const { enemy, dist } = this.getNearestEnemy(
      ships,
      width,
      height,
      config.visionDist
    );

    if (enemy) {
      let dx = enemy.x - this.x;
      let dy = enemy.y - this.y;

      // Account for wrapping
      if (dx > width / 2) dx -= width;
      if (dx < -width / 2) dx += width;
      if (dy > height / 2) dy -= height;
      if (dy < -height / 2) dy += height;

      const targetAngle = Math.atan2(dy, dx);
      let diff = targetAngle - this.angle;

      // Normalize angle difference
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;

      // Turn towards enemy
      if (diff > aimTurnThreshold) this.angle += config.turnSpeed;
      else if (diff < -aimTurnThreshold) this.angle -= config.turnSpeed;

      // Thrust when mostly aimed
      if (Math.abs(diff) < fireAimCloseThreshold) {
        this.vx += Math.cos(this.angle) * config.shipThrust;
        this.vy += Math.sin(this.angle) * config.shipThrust;
        if (rng() > 0.5) {
          const px = this.x - Math.cos(this.angle) * 15;
          const py = this.y - Math.sin(this.angle) * 15;
          particles.push(new Particle(createParticleId(), px, py, "orange", rng));
        }
      }

      // Fire when aimed at close enemy
      if (Math.abs(diff) < fireAngleThreshold && this.cooldown <= 0 && dist < config.visionDist) {
        // Firing is handled by the engine
      }
    } else {
      // No enemy, idle rotation
      this.angle += idleAngleIncrement;
      this.vx *= idleDamping;
      this.vy *= idleDamping;
    }
  }

  update(
    width: number,
    height: number,
    friction: number
  ): void {
    this.vx *= friction;
    this.vy *= friction;
    this.x += this.vx;
    this.y += this.vy;

    // Wrap around world boundaries
    if (this.x < 0) this.x = width;
    if (this.x > width) this.x = 0;
    if (this.y < 0) this.y = height;
    if (this.y > height) this.y = 0;

    if (this.cooldown > 0) this.cooldown--;
  }

  shoot(): { x: number; y: number; angle: number } {
    const bx = this.x + Math.cos(this.angle) * 15;
    const by = this.y + Math.sin(this.angle) * 15;
    return { x: bx, y: by, angle: this.angle };
  }
}

// ============================================================================
// ENGINE CLASS
// ============================================================================

export class Engine {
  private ships: Ship[] = [];
  private bullets: Bullet[] = [];
  private particles: Particle[] = [];
  private stars: StarType[] = [];
  private tick: number = 0;
  private config: EngineConfig | null = null;
  private eventHandlers = new Map<string, Set<(data: unknown) => void>>();
  private entityIdCounter: number = 0;
  private rng: RNG = Math.random;

  private nextEntityId(prefix: string): string {
    return `${prefix}-${this.entityIdCounter++}`;
  }

  init(config: EngineConfig): void {
    this.config = config;
    this.tick = 0;
    this.entityIdCounter = 0;
    this.rng = Number.isFinite(config.seed) ? createRng(config.seed as number) : Math.random;
    this.ships = [];
    this.bullets = [];
    this.particles = [];
    this.stars = [];
    this.initStars();
    this.emit("telemetry", {
      type: "roundStart",
      timestamp: Date.now(),
      data: { config },
    } as TelemetryEvent);
  }

  private initStars(): void {
    if (!this.config) return;
    const ui = { ...DEFAULT_UI_CONFIG, ...(this.config.ui ?? {}) };
    this.stars = [];
    for (let i = 0; i < ui.starsCount; i++) {
      this.stars.push({
        id: `star-${i}`,
        position: {
          x: this.rng() * this.config.canvasWidth,
          y: this.rng() * this.config.canvasHeight,
        },
        brightness: this.rng(),
        size: this.rng() * 1.5,
      });
    }
  }

  update(deltaTime: number): void {
    if (!this.config) return;
    void deltaTime;

    const tuning = { ...DEFAULT_ENGINE_TUNING, ...(this.config?.tuning ?? {}) };

    this.tick++;

    // Update ships
    for (const ship of this.ships) {

      ship.updateAI(
        this.ships,
        this.particles,
        this.config.canvasWidth,
        this.config.canvasHeight,
        {
          turnSpeed: tuning.turnSpeed,
          shipThrust: tuning.shipThrust,
          visionDist: tuning.visionDist,
        },
        this.rng,
        () => this.nextEntityId("particle")
      );
      ship.update(this.config.canvasWidth, this.config.canvasHeight, tuning.friction);

      // Check if ship should shoot
      const { enemy, dist } = ship.getNearestEnemy(
        this.ships,
        this.config.canvasWidth,
        this.config.canvasHeight,
        tuning.visionDist
      );
      if (
        enemy &&
        Math.abs(Math.atan2(enemy.y - ship.y, enemy.x - ship.x) - ship.angle) < tuning.fireAngleThreshold &&
        ship.cooldown <= 0 &&
        dist < tuning.fireDist
      ) {
        const bulletPos = ship.shoot();
        const bullet = new Bullet(
          this.nextEntityId("bullet"),
          bulletPos.x,
          bulletPos.y,
          bulletPos.angle,
          ship.team,
          ship.id,
          this.config.bulletSpeed,
          this.config.bulletDamage,
          tuning.bulletLife,
          tuning.bulletRadius
        );
        this.bullets.push(bullet);
        ship.cooldown = tuning.cooldownBase + this.rng() * tuning.cooldownRandom;

        this.emit("telemetry", {
          type: "bullet_fired",
          timestamp: Date.now(),
          data: { shipId: ship.id, team: ship.team },
        } as TelemetryEvent);
      }
    }

    // Update bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      bullet.update(this.config.canvasWidth, this.config.canvasHeight);
      if (!bullet.active) {
        this.bullets.splice(i, 1);
      }
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      particle.update();
      if (particle.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Check collisions
    this.checkCollisions();
  }

  private checkCollisions(): void {
    if (!this.config) return;
    const tuning = { ...DEFAULT_ENGINE_TUNING, ...(this.config?.tuning ?? {}) };

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      if (!bullet.active) continue;

      for (let j = this.ships.length - 1; j >= 0; j--) {
        const ship = this.ships[j];
        if (bullet.team === ship.team) continue;

        const dist = Math.hypot(bullet.x - ship.x, bullet.y - ship.y);
        if (dist < ship.radius + bullet.radius) {
          ship.health -= bullet.damage;
          bullet.active = false;

          // Emit hit event
          this.emit("telemetry", {
            type: "bullet_hit",
            timestamp: Date.now(),
            data: { shipId: ship.id, bulletOwnerId: bullet.ownerId },
          } as TelemetryEvent);

          // Create particles
          for (let k = 0; k < tuning.hitParticles; k++) {
            this.particles.push(
              new Particle(
                this.nextEntityId("particle"),
                bullet.x,
                bullet.y,
                ship.color,
                this.rng
              )
            );
          }

          // Check if ship dies
          if (ship.health <= 0) {
            for (let k = 0; k < tuning.deathParticles; k++) {
              this.particles.push(
                new Particle(
                  this.nextEntityId("particle"),
                  ship.x,
                  ship.y,
                  "white",
                  this.rng
                )
              );
              this.particles.push(
                new Particle(
                  this.nextEntityId("particle"),
                  ship.x,
                  ship.y,
                  ship.color,
                  this.rng
                )
              );
            }

            // Emit death event
            this.emit("telemetry", {
              type: "ship_destroyed",
              timestamp: Date.now(),
              data: { shipId: ship.id, team: ship.team },
            } as TelemetryEvent);

            this.ships.splice(j, 1);
          }

          break;
        }
      }
    }
  }

  spawnShip(team: Team): void {
    if (!this.config) return;

    let x: number;
    const y = this.rng() * this.config.canvasHeight;

    if (team === "red") {
      x = this.rng() * (this.config.canvasWidth * 0.3);
    } else {
      x = this.config.canvasWidth - this.rng() * (this.config.canvasWidth * 0.3);
    }

    const tuning = { ...DEFAULT_ENGINE_TUNING, ...(this.config?.tuning ?? {}) };
    const ship = new Ship(
      this.nextEntityId("ship"),
      x,
      y,
      team,
      this.config.shipMaxHealth,
      this.rng,
      tuning.shipRadius
    );
    this.ships.push(ship);

    this.emit("telemetry", {
      type: "ship_spawned",
      timestamp: Date.now(),
      data: { shipId: ship.id, team },
    } as TelemetryEvent);
  }

  reset(): void {
    this.ships = [];
    this.bullets = [];
    this.particles = [];
    this.tick = 0;

    // Spawn initial ships
    this.spawnShip("red");
    this.spawnShip("red");
    this.spawnShip("blue");
    this.spawnShip("blue");
  }

  getState(): GameState {
    const snapshot: GameState = {
      ships: this.ships.map((s) => ({
        id: s.id,
        team: s.team,
        position: { x: s.x, y: s.y },
        velocity: { x: s.vx, y: s.vy },
        angle: s.angle,
        health: s.health,
        maxHealth: s.maxHealth,
        isThrusting: Math.abs(s.vx) > (this.config?.tuning?.isThrustingThreshold ?? DEFAULT_ENGINE_TUNING.isThrustingThreshold) || Math.abs(s.vy) > (this.config?.tuning?.isThrustingThreshold ?? DEFAULT_ENGINE_TUNING.isThrustingThreshold),
        isFiring: s.cooldown === 0,
      })),
      bullets: this.bullets.map((b) => ({
        id: b.id,
        team: b.team,
        position: { x: b.x, y: b.y },
        velocity: { x: b.vx, y: b.vy },
        angle: b.angle,
        damage: b.damage,
        ownerId: b.ownerId,
      })),
      particles: this.particles.map((p) => {
        const ui = { ...DEFAULT_UI_CONFIG, ...(this.config?.ui ?? {}) };
        return {
          id: p.id,
          position: { x: p.x, y: p.y },
          velocity: { x: p.vx, y: p.vy },
          color: p.color,
          size: ui.particleRenderSize,
          lifetime: ui.particleLifetimeMs,
          age: (1 - p.life) * ui.particleLifetimeMs,
        }
      }),
      stars: this.stars,
      timestamp: Date.now(),
    };
    // Ensure snapshot is serializable for Web Worker migration
    return serialize(snapshot);
  }

  destroy(): void {
    this.ships = [];
    this.bullets = [];
    this.particles = [];
    this.stars = [];
    this.eventHandlers.clear();
    this.tick = 0;
    this.config = null;
  }

  on(event: string, handler: (data: unknown) => void): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  off(event: string, handler: (data: unknown) => void): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.eventHandlers.delete(event);
      }
    }
  }

  emit(event: string, data: unknown): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((h) => h(data));
    }
  }

  getShipCount(team: Team): number {
    return this.ships.filter((s) => s.team === team).length;
  }

  getTick(): number {
    return this.tick;
  }
}
