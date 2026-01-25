import { describe, it, expect } from "vitest";
import type {
  Team,
  Vector2D,
  Ship,
  Bullet,
  Particle,
  Star,
  GameState,
  EngineConfig,
  TelemetryEvent,
  Engine,
} from "@/redvsblue/types";

describe("RedVsBlue Types", () => {
  describe("should export all required types", () => {
    it("should export Team type", () => {
      const redTeam: Team = "red";
      const blueTeam: Team = "blue";
      expect(redTeam).toBe("red");
      expect(blueTeam).toBe("blue");
    });

    it("should export Vector2D interface", () => {
      const vector: Vector2D = { x: 10, y: 20 };
      expect(vector.x).toBe(10);
      expect(vector.y).toBe(20);
    });

    it("should export Ship interface", () => {
      const ship: Ship = {
        id: "ship-1",
        team: "red",
        position: { x: 100, y: 100 },
        velocity: { x: 0, y: 0 },
        angle: 0,
        health: 100,
        maxHealth: 100,
        isThrusting: false,
        isFiring: false,
      };
      expect(ship.id).toBe("ship-1");
      expect(ship.team).toBe("red");
      expect(ship.health).toBe(100);
    });

    it("should export Bullet interface", () => {
      const bullet: Bullet = {
        id: "bullet-1",
        team: "blue",
        position: { x: 50, y: 50 },
        velocity: { x: 5, y: 0 },
        angle: 0,
        damage: 10,
        ownerId: "ship-1",
      };
      expect(bullet.id).toBe("bullet-1");
      expect(bullet.team).toBe("blue");
      expect(bullet.damage).toBe(10);
    });

    it("should export Particle interface", () => {
      const particle: Particle = {
        id: "particle-1",
        position: { x: 200, y: 200 },
        velocity: { x: 1, y: 1 },
        color: "#ff0000",
        size: 2,
        lifetime: 1000,
        age: 0,
      };
      expect(particle.id).toBe("particle-1");
      expect(particle.color).toBe("#ff0000");
    });

    it("should export Star interface", () => {
      const star: Star = {
        id: "star-1",
        position: { x: 300, y: 300 },
        brightness: 0.8,
        size: 1,
      };
      expect(star.id).toBe("star-1");
      expect(star.brightness).toBe(0.8);
    });

    it("should export GameState interface", () => {
      const gameState: GameState = {
        ships: [],
        bullets: [],
        particles: [],
        stars: [],
        timestamp: Date.now(),
      };
      expect(gameState.ships).toEqual([]);
      expect(gameState.bullets).toEqual([]);
      expect(gameState.particles).toEqual([]);
      expect(gameState.stars).toEqual([]);
      expect(typeof gameState.timestamp).toBe("number");
    });

    it("should export EngineConfig interface", () => {
      const config: EngineConfig = {
        canvasWidth: 800,
        canvasHeight: 600,
        shipSpeed: 5,
        bulletSpeed: 10,
        bulletDamage: 10,
        shipMaxHealth: 100,
        enableTelemetry: true,
      };
      expect(config.canvasWidth).toBe(800);
      expect(config.enableTelemetry).toBe(true);
    });

    it("should export TelemetryEvent interface", () => {
      const event: TelemetryEvent = {
        type: "ship_destroyed",
        timestamp: Date.now(),
        data: {
          shipId: "ship-1",
          team: "red",
        },
      };
      expect(event.type).toBe("ship_destroyed");
      expect(typeof event.timestamp).toBe("number");
      expect(event.data).toBeDefined();
    });

    it("should export Engine interface", () => {
      const mockEngine: Engine = {
        init: (config: EngineConfig) => {
          expect(config).toBeDefined();
        },
        update: (deltaTime: number) => {
          expect(typeof deltaTime).toBe("number");
        },
        getState: () => {
          return {
            ships: [],
            bullets: [],
            particles: [],
            stars: [],
            timestamp: Date.now(),
          };
        },
        destroy: () => {
          // cleanup
        },
        on: (event: string, handler: (data: unknown) => void) => {
          expect(typeof event).toBe("string");
          expect(typeof handler).toBe("function");
        },
        off: (event: string, handler: (data: unknown) => void) => {
          expect(typeof event).toBe("string");
          expect(typeof handler).toBe("function");
        },
        emit: (event: string, data: unknown) => {
          expect(typeof event).toBe("string");
        },
      };

      expect(typeof mockEngine.init).toBe("function");
      expect(typeof mockEngine.update).toBe("function");
      expect(typeof mockEngine.getState).toBe("function");
      expect(typeof mockEngine.destroy).toBe("function");
      expect(typeof mockEngine.on).toBe("function");
      expect(typeof mockEngine.off).toBe("function");
      expect(typeof mockEngine.emit).toBe("function");
    });
  });

  describe("should define Team as string union type", () => {
    it("should accept 'red' as valid Team value", () => {
      const team: Team = "red";
      expect(team).toBe("red");
    });

    it("should accept 'blue' as valid Team value", () => {
      const team: Team = "blue";
      expect(team).toBe("blue");
    });

    it("should type-check Team assignment", () => {
      const teams: Team[] = ["red", "blue"];
      expect(teams).toHaveLength(2);
      expect(teams[0]).toBe("red");
      expect(teams[1]).toBe("blue");
    });
  });

  describe("should define Vector2D interface with x and y properties", () => {
    it("should have x property as number", () => {
      const vec: Vector2D = { x: 42, y: 0 };
      expect(typeof vec.x).toBe("number");
      expect(vec.x).toBe(42);
    });

    it("should have y property as number", () => {
      const vec: Vector2D = { x: 0, y: 84 };
      expect(typeof vec.y).toBe("number");
      expect(vec.y).toBe(84);
    });

    it("should allow negative coordinates", () => {
      const vec: Vector2D = { x: -10, y: -20 };
      expect(vec.x).toBe(-10);
      expect(vec.y).toBe(-20);
    });

    it("should allow decimal coordinates", () => {
      const vec: Vector2D = { x: 3.14, y: 2.71 };
      expect(vec.x).toBeCloseTo(3.14);
      expect(vec.y).toBeCloseTo(2.71);
    });
  });

  describe("should define Engine interface with telemetry hooks", () => {
    it("should have init method", () => {
      const engine: Pick<Engine, "init"> = {
        init: (config: EngineConfig) => {
          expect(config).toBeDefined();
        },
      };
      const config: EngineConfig = {
        canvasWidth: 800,
        canvasHeight: 600,
        shipSpeed: 5,
        bulletSpeed: 10,
        bulletDamage: 10,
        shipMaxHealth: 100,
        enableTelemetry: false,
      };
      engine.init(config);
    });

    it("should have update method accepting deltaTime", () => {
      const engine: Pick<Engine, "update"> = {
        update: (deltaTime: number) => {
          expect(typeof deltaTime).toBe("number");
        },
      };
      engine.update(16.67);
    });

    it("should have getState method returning GameState", () => {
      const engine: Pick<Engine, "getState"> = {
        getState: () => {
          return {
            ships: [],
            bullets: [],
            particles: [],
            stars: [],
            timestamp: Date.now(),
          };
        },
      };
      const state = engine.getState();
      expect(state).toBeDefined();
      expect(state.ships).toEqual([]);
    });

    it("should have destroy method for cleanup", () => {
      const engine: Pick<Engine, "destroy"> = {
        destroy: () => {
          // cleanup logic
        },
      };
      expect(typeof engine.destroy).toBe("function");
      engine.destroy();
    });

    it("should have event emitter 'on' method for telemetry", () => {
      const mockHandler = (data: unknown) => {
        const telemetryData = data as TelemetryEvent;
        expect(telemetryData.type).toBeDefined();
      };
      const engine: Pick<Engine, "on"> = {
        on: (event: string, handler: (data: unknown) => void) => {
          expect(event).toBe("telemetry");
          handler({ type: "test", timestamp: Date.now(), data: {} });
        },
      };
      engine.on("telemetry", mockHandler);
    });

    it("should have event emitter 'off' method for telemetry", () => {
      const mockHandler = (data: unknown) => {
        expect(data).toBeDefined();
      };
      const engine: Pick<Engine, "off"> = {
        off: (event: string, handler: (data: unknown) => void) => {
          expect(event).toBe("telemetry");
          expect(typeof handler).toBe("function");
        },
      };
      engine.off("telemetry", mockHandler);
    });

    it("should have event emitter 'emit' method for telemetry", () => {
      const engine: Pick<Engine, "emit"> = {
        emit: (event: string, data: unknown) => {
          expect(event).toBe("telemetry");
          const telemetryData = data as TelemetryEvent;
          expect(telemetryData.type).toBeDefined();
        },
      };
      const telemetryEvent: TelemetryEvent = {
        type: "ship_spawned",
        timestamp: Date.now(),
        data: { shipId: "ship-1" },
      };
      engine.emit("telemetry", telemetryEvent);
    });
  });
});
