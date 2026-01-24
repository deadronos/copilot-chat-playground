import { describe, it, expect } from "vitest";
import {
  createEngine,
  type Team,
  type Vector2D,
  type Ship,
  type Bullet,
  type Particle,
  type Star,
  type GameState,
  type EngineConfig,
  type TelemetryEvent,
  type Engine,
} from "@/redvsblue/engine";

describe("RedVsBlue Engine Module", () => {
  describe("should export createEngine function", () => {
    it("should export createEngine as a function", () => {
      expect(typeof createEngine).toBe("function");
    });

    it("should return an object when called", () => {
      const engine = createEngine();
      expect(engine).toBeDefined();
      expect(typeof engine).toBe("object");
    });
  });

  describe("should re-export all types from types.ts", () => {
    it("should re-export Team type", () => {
      const redTeam: Team = "red";
      const blueTeam: Team = "blue";
      expect(redTeam).toBe("red");
      expect(blueTeam).toBe("blue");
    });

    it("should re-export Vector2D interface", () => {
      const vector: Vector2D = { x: 10, y: 20 };
      expect(vector.x).toBe(10);
      expect(vector.y).toBe(20);
    });

    it("should re-export Ship interface", () => {
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
    });

    it("should re-export Bullet interface", () => {
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
    });

    it("should re-export Particle interface", () => {
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

    it("should re-export Star interface", () => {
      const star: Star = {
        id: "star-1",
        position: { x: 300, y: 300 },
        brightness: 0.8,
        size: 1,
      };
      expect(star.id).toBe("star-1");
      expect(star.brightness).toBe(0.8);
    });

    it("should re-export GameState interface", () => {
      const gameState: GameState = {
        ships: [],
        bullets: [],
        particles: [],
        stars: [],
        timestamp: Date.now(),
      };
      expect(gameState.ships).toEqual([]);
      expect(gameState.bullets).toEqual([]);
    });

    it("should re-export EngineConfig interface", () => {
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

    it("should re-export TelemetryEvent interface", () => {
      const event: TelemetryEvent = {
        type: "ship_destroyed",
        timestamp: Date.now(),
        data: { shipId: "ship-1", team: "red" },
      };
      expect(event.type).toBe("ship_destroyed");
      expect(typeof event.timestamp).toBe("number");
    });

    it("should re-export Engine interface", () => {
      const mockEngine: Engine = {
        init: () => {},
        update: () => {},
        getState: () => ({
          ships: [],
          bullets: [],
          particles: [],
          stars: [],
          timestamp: Date.now(),
        }),
        destroy: () => {},
        on: () => {},
        off: () => {},
        emit: () => {},
      };
      expect(typeof mockEngine.init).toBe("function");
      expect(typeof mockEngine.update).toBe("function");
    });
  });

  describe("should return Engine stub with all required methods", () => {
    it("should return an object implementing Engine interface", () => {
      const engine = createEngine();
      expect(typeof engine.init).toBe("function");
      expect(typeof engine.update).toBe("function");
      expect(typeof engine.getState).toBe("function");
      expect(typeof engine.destroy).toBe("function");
      expect(typeof engine.on).toBe("function");
      expect(typeof engine.off).toBe("function");
      expect(typeof engine.emit).toBe("function");
    });

    it("should have init method that accepts EngineConfig", () => {
      const engine = createEngine();
      const config: EngineConfig = {
        canvasWidth: 800,
        canvasHeight: 600,
        shipSpeed: 5,
        bulletSpeed: 10,
        bulletDamage: 10,
        shipMaxHealth: 100,
        enableTelemetry: false,
      };
      // Should not throw
      expect(() => engine.init(config)).not.toThrow();
    });

    it("should have update method that accepts deltaTime", () => {
      const engine = createEngine();
      // Should not throw
      expect(() => engine.update(16.67)).not.toThrow();
    });

    it("should have getState method that returns GameState", () => {
      const engine = createEngine();
      const state = engine.getState();
      expect(state).toBeDefined();
      expect(Array.isArray(state.ships)).toBe(true);
      expect(Array.isArray(state.bullets)).toBe(true);
      expect(Array.isArray(state.particles)).toBe(true);
      expect(Array.isArray(state.stars)).toBe(true);
      expect(typeof state.timestamp).toBe("number");
    });

    it("should have destroy method", () => {
      const engine = createEngine();
      // Should not throw
      expect(() => engine.destroy()).not.toThrow();
    });

    it("should have on method for event subscription", () => {
      const engine = createEngine();
      const mockHandler = () => {};
      // Should not throw
      expect(() => engine.on("telemetry", mockHandler)).not.toThrow();
    });

    it("should have off method for event unsubscription", () => {
      const engine = createEngine();
      const mockHandler = () => {};
      // Should not throw
      expect(() => engine.off("telemetry", mockHandler)).not.toThrow();
    });

    it("should have emit method for event emission", () => {
      const engine = createEngine();
      const telemetryEvent: TelemetryEvent = {
        type: "ship_spawned",
        timestamp: Date.now(),
        data: { shipId: "ship-1" },
      };
      // Should not throw
      expect(() => engine.emit("telemetry", telemetryEvent)).not.toThrow();
    });

    it("should return empty arrays for entity collections by default", () => {
      const engine = createEngine();
      const state = engine.getState();
      expect(state.ships).toEqual([]);
      expect(state.bullets).toEqual([]);
      expect(state.particles).toEqual([]);
      expect(state.stars).toEqual([]);
    });
  });

  describe("should accept optional EngineConfig parameter", () => {
    it("should accept config parameter in createEngine", () => {
      const config: EngineConfig = {
        canvasWidth: 1024,
        canvasHeight: 768,
        shipSpeed: 10,
        bulletSpeed: 15,
        bulletDamage: 25,
        shipMaxHealth: 150,
        enableTelemetry: true,
      };
      // Should not throw
      expect(() => createEngine(config)).not.toThrow();
    });

    it("should work without config parameter", () => {
      // Should not throw
      expect(() => createEngine()).not.toThrow();
    });

    it("should return Engine instance with or without config", () => {
      const config: EngineConfig = {
        canvasWidth: 800,
        canvasHeight: 600,
        shipSpeed: 5,
        bulletSpeed: 10,
        bulletDamage: 10,
        shipMaxHealth: 100,
        enableTelemetry: false,
      };
      const engineWithConfig = createEngine(config);
      const engineWithoutConfig = createEngine();

      expect(typeof engineWithConfig.init).toBe("function");
      expect(typeof engineWithoutConfig.init).toBe("function");
      expect(typeof engineWithConfig.getState).toBe("function");
      expect(typeof engineWithoutConfig.getState).toBe("function");
    });
  });
});
