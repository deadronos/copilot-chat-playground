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
import { Bullet, Particle, Ship } from "./entities";
import { updateEngineCore } from "./core";

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

    const state = {
      ships: this.ships,
      bullets: this.bullets,
      particles: this.particles,
      tick: this.tick,
    };

    updateEngineCore(
      state,
      {
        config: this.config,
        rng: this.rng,
        nextEntityId: this.nextEntityId.bind(this),
        emit: this.emit.bind(this),
      },
      deltaTime
    );

    this.tick = state.tick;
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

    // Spawn initial ships; honor UI config's per-team initial ships if present
    const uiInitial = (this.config?.ui?.initialShipsPerTeam ?? DEFAULT_UI_CONFIG.initialShipsPerTeam) as number;
    const perTeam = Number.isFinite(uiInitial) && uiInitial > 0 ? Math.max(0, Math.floor(uiInitial)) : DEFAULT_UI_CONFIG.initialShipsPerTeam;
    for (let i = 0; i < perTeam; i++) {
      this.spawnShip("red");
    }
    for (let i = 0; i < perTeam; i++) {
      this.spawnShip("blue");
    }
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
        isThrusting:
          Math.abs(s.vx) >
            (this.config?.tuning?.isThrustingThreshold ??
              DEFAULT_ENGINE_TUNING.isThrustingThreshold) ||
          Math.abs(s.vy) >
            (this.config?.tuning?.isThrustingThreshold ??
              DEFAULT_ENGINE_TUNING.isThrustingThreshold),
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
        };
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
