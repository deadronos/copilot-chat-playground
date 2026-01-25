import { DEFAULT_ENGINE_TUNING } from "@/redvsblue/config/index";
import type { Team } from "@/redvsblue/types";
import type { RNG } from "../rng";
import { Particle } from "./Particle";

export type ShipAIConfig = {
  turnSpeed: number;
  shipThrust: number;
  visionDist: number;
  aimTurnThreshold?: number;
  fireAimCloseThreshold?: number;
  fireAngleThreshold?: number;
  idleAngleIncrement?: number;
  idleDamping?: number;
};

export class Ship {
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
    config: ShipAIConfig,
    rng: RNG,
    createParticleId: () => string
  ): void {
    const aimTurnThreshold = config.aimTurnThreshold ?? 0.05;
    const fireAimCloseThreshold = config.fireAimCloseThreshold ?? 1.0;
    const fireAngleThreshold = config.fireAngleThreshold ?? 0.2;
    const idleAngleIncrement = config.idleAngleIncrement ?? 0.01;
    const idleDamping = config.idleDamping ?? 0.95;

    const { enemy, dist } = this.getNearestEnemy(ships, width, height, config.visionDist);

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

  update(width: number, height: number, friction: number): void {
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
