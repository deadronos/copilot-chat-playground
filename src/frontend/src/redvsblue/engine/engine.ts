import type {
  Team,
  Star as StarType,
  GameState,
  EngineConfig,
  TelemetryEvent,
} from "@/redvsblue/types";

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

  constructor(id: string, x: number, y: number, color: string) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 5;
    this.vy = (Math.random() - 0.5) * 5;
    this.life = 1.0;
    this.color = color;
  }

  update(): void {
    this.x += this.vx;
    this.y += this.vy;
    this.life -= 0.03;
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
    bulletLife: number
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
    this.radius = 3;
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
    maxHealth: number
  ) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.team = team;
    this.vx = Math.random() - 0.5;
    this.vy = Math.random() - 0.5;
    this.angle = Math.random() * Math.PI * 2;
    this.color = team === "red" ? "#ff4d4d" : "#4d4dff";
    this.health = maxHealth;
    this.maxHealth = maxHealth;
    this.cooldown = Math.random() * 20;
    this.radius = 12;
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
    config: { turnSpeed: number; shipThrust: number; visionDist: number }
  ): void {
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
      if (diff > 0.05) this.angle += config.turnSpeed;
      else if (diff < -0.05) this.angle -= config.turnSpeed;

      // Thrust when mostly aimed
      if (Math.abs(diff) < 1.0) {
        this.vx += Math.cos(this.angle) * config.shipThrust;
        this.vy += Math.sin(this.angle) * config.shipThrust;
        if (Math.random() > 0.5) {
          const px = this.x - Math.cos(this.angle) * 15;
          const py = this.y - Math.sin(this.angle) * 15;
          particles.push(new Particle(this.id + "-thrust-" + Date.now(), px, py, "orange"));
        }
      }

      // Fire when aimed at close enemy
      if (Math.abs(diff) < 0.2 && this.cooldown <= 0 && dist < 400) {
        // Firing is handled by the engine
      }
    } else {
      // No enemy, idle rotation
      this.angle += 0.01;
      this.vx *= 0.95;
      this.vy *= 0.95;
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

  init(config: EngineConfig): void {
    this.config = config;
    this.tick = 0;
    this.entityIdCounter = 0;
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
    this.stars = [];
    for (let i = 0; i < 150; i++) {
      this.stars.push({
        id: `star-${i}`,
        position: {
          x: Math.random() * this.config.canvasWidth,
          y: Math.random() * this.config.canvasHeight,
        },
        brightness: Math.random(),
        size: Math.random() * 1.5,
      });
    }
  }

  update(deltaTime: number): void {
    if (!this.config) return;
    void deltaTime;

    this.tick++;

    // Update ships
    for (const ship of this.ships) {
      ship.updateAI(this.ships, this.particles, this.config.canvasWidth, this.config.canvasHeight, {
        turnSpeed: 0.08,
        shipThrust: 0.2,
        visionDist: 800,
      });
      ship.update(this.config.canvasWidth, this.config.canvasHeight, 0.98);

      // Check if ship should shoot
      const { enemy, dist } = ship.getNearestEnemy(
        this.ships,
        this.config.canvasWidth,
        this.config.canvasHeight,
        800
      );
      if (
        enemy &&
        Math.abs(Math.atan2(enemy.y - ship.y, enemy.x - ship.x) - ship.angle) < 0.2 &&
        ship.cooldown <= 0 &&
        dist < 400
      ) {
        const bulletPos = ship.shoot();
        const bullet = new Bullet(
          `bullet-${this.entityIdCounter++}`,
          bulletPos.x,
          bulletPos.y,
          bulletPos.angle,
          ship.team,
          ship.id,
          this.config.bulletSpeed,
          this.config.bulletDamage,
          50
        );
        this.bullets.push(bullet);
        ship.cooldown = 20 + Math.random() * 10;

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
          for (let k = 0; k < 5; k++) {
            this.particles.push(
              new Particle(
                `particle-${this.entityIdCounter++}`,
                bullet.x,
                bullet.y,
                ship.color
              )
            );
          }

          // Check if ship dies
          if (ship.health <= 0) {
            for (let k = 0; k < 15; k++) {
              this.particles.push(
                new Particle(
                  `particle-${this.entityIdCounter++}`,
                  ship.x,
                  ship.y,
                  "white"
                )
              );
              this.particles.push(
                new Particle(
                  `particle-${this.entityIdCounter++}`,
                  ship.x,
                  ship.y,
                  ship.color
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
    const y = Math.random() * this.config.canvasHeight;

    if (team === "red") {
      x = Math.random() * (this.config.canvasWidth * 0.3);
    } else {
      x = this.config.canvasWidth - Math.random() * (this.config.canvasWidth * 0.3);
    }

    const ship = new Ship(
      `ship-${this.entityIdCounter++}`,
      x,
      y,
      team,
      this.config.shipMaxHealth
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
    return {
      ships: this.ships.map((s) => ({
        id: s.id,
        team: s.team,
        position: { x: s.x, y: s.y },
        velocity: { x: s.vx, y: s.vy },
        angle: s.angle,
        health: s.health,
        maxHealth: s.maxHealth,
        isThrusting: Math.abs(s.vx) > 0.1 || Math.abs(s.vy) > 0.1,
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
      particles: this.particles.map((p) => ({
        id: p.id,
        position: { x: p.x, y: p.y },
        velocity: { x: p.vx, y: p.vy },
        color: p.color,
        size: 2,
        lifetime: 33.33,
        age: (1 - p.life) * 33.33,
      })),
      stars: this.stars,
      timestamp: Date.now(),
    };
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
