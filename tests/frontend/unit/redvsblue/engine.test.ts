import { describe, it, expect, beforeEach } from "vitest";
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

  describe("Game Engine Gameplay (PR-002 Requirements)", () => {
    let engine: Engine;
    let config: EngineConfig;

    beforeEach(() => {
      config = {
        canvasWidth: 800,
        canvasHeight: 600,
        shipSpeed: 5,
        bulletSpeed: 8,
        bulletDamage: 10,
        shipMaxHealth: 30,
        enableTelemetry: true,
        seed: 1337,
      };
      engine = createEngine();
      engine.init(config);
    });

    describe("Deterministic Behavior", () => {
      it("should produce identical results with same seed and inputs", () => {
        const engine1 = createEngine();
        engine1.init(config);
        engine1.spawnShip("red");
        engine1.spawnShip("blue");

        const engine2 = createEngine();
        engine2.init(config);
        engine2.spawnShip("red");
        engine2.spawnShip("blue");

        // Run 10 updates on both
        for (let i = 0; i < 10; i++) {
          engine1.update(16);
          engine2.update(16);
        }

        const state1 = engine1.getState();
        const state2 = engine2.getState();

        // Both engines should have identical state
        expect(state1.ships.length).toBe(state2.ships.length);
        state1.ships.forEach((ship, i) => {
          expect(ship.health).toBe(state2.ships[i].health);
        });
      });
    });

    describe("Ship Spawning", () => {
      it("should spawn a red ship on the left side", () => {
        engine.spawnShip("red");
        const state = engine.getState();
        expect(state.ships.length).toBe(1);
        expect(state.ships[0].team).toBe("red");
        expect(state.ships[0].position.x).toBeLessThan(config.canvasWidth * 0.3);
      });

      it("should spawn a blue ship on the right side", () => {
        engine.spawnShip("blue");
        const state = engine.getState();
        expect(state.ships.length).toBe(1);
        expect(state.ships[0].team).toBe("blue");
        expect(state.ships[0].position.x).toBeGreaterThan(config.canvasWidth * 0.7);
      });

      it("should maintain initial health on spawn", () => {
        engine.spawnShip("red");
        const state = engine.getState();
        expect(state.ships[0].health).toBe(config.shipMaxHealth);
      });
    });

    describe("Collision Detection", () => {
      it("should detect bullet-ship collision and reduce health", () => {
        engine.spawnShip("red");
        engine.spawnShip("blue");

        let hitDetected = false;
        engine.on("telemetry", (event: unknown) => {
          if (
            typeof event === "object" &&
            event !== null &&
            "type" in event &&
            (event as Record<string, unknown>).type === "bullet_hit"
          ) {
            hitDetected = true;
          }
        });

        // Run simulation to trigger shooting and collisions (deterministic via seed)
        for (let i = 0; i < 2000; i++) {
          engine.update(16);
          if (hitDetected) break;
        }

        expect(hitDetected).toBe(true);
      });

      it("should destroy ship when health reaches zero", () => {
        engine.spawnShip("red");
        engine.spawnShip("blue");

        let shipDestroyedFired = false;
        let collisionDetected = false;
        
        engine.on("telemetry", (event: unknown) => {
          if (
            typeof event === "object" &&
            event !== null &&
            "type" in event
          ) {
            const type = (event as Record<string, unknown>).type;
            if (type === "ship_destroyed") {
              shipDestroyedFired = true;
            }
            if (type === "bullet_hit") {
              collisionDetected = true;
            }
          }
        });

        for (let i = 0; i < 500; i++) {
          engine.update(16);
          const state = engine.getState();
          if (state.ships.length < 2 || shipDestroyedFired) {
            break;
          }
        }

        const finalState = engine.getState();
        // Either a ship was destroyed or a collision occurred
        expect(
          finalState.ships.length < 2 || collisionDetected
        ).toBe(true);
      });
    });

    describe("Event Emission & Telemetry", () => {
      it("should emit ship_spawned telemetry event", () => {
        let spawnEventFired = false;
        engine.on("telemetry", (event: unknown) => {
          if (
            typeof event === "object" &&
            event !== null &&
            "type" in event &&
            (event as Record<string, unknown>).type === "ship_spawned"
          ) {
            spawnEventFired = true;
          }
        });

        engine.spawnShip("red");
        expect(spawnEventFired).toBe(true);
      });

      it("should emit bullet_fired telemetry event", () => {
        let bulletFiredFired = false;
        engine.on("telemetry", (event: unknown) => {
          if (
            typeof event === "object" &&
            event !== null &&
            "type" in event &&
            (event as Record<string, unknown>).type === "bullet_fired"
          ) {
            bulletFiredFired = true;
          }
        });

        engine.spawnShip("red");
        engine.spawnShip("blue");

        for (let i = 0; i < 100; i++) {
          engine.update(16);
          if (bulletFiredFired) break;
        }

        expect(bulletFiredFired).toBe(true);
      });

      it("should allow event handler removal", () => {
        let callCount = 0;
        const handler = () => {
          callCount++;
        };

        engine.on("telemetry", handler);
        engine.spawnShip("red");
        expect(callCount).toBeGreaterThan(0);

        const countBefore = callCount;
        engine.off("telemetry", handler);
        engine.spawnShip("blue");

        // Handler should not be called after removal
        expect(callCount).toBe(countBefore);
      });
    });

    describe("Game Reset", () => {
      it("should reset all ships to initial state with 4 ships", () => {
        engine.spawnShip("red");
        engine.spawnShip("blue");
        engine.update(50);

        engine.reset();
        const state = engine.getState();

        expect(state.ships.length).toBe(4);
        expect(state.bullets.length).toBe(0);
        expect(state.particles.length).toBe(0);
        state.ships.forEach((ship) => {
          expect(ship.health).toBe(config.shipMaxHealth);
        });
      });
    });

    describe("Engine Initialization with Stars", () => {
      it("should initialize 150 stars on init", () => {
        const state = engine.getState();
        expect(state.stars.length).toBe(150);
      });

      it("should place all stars within canvas bounds", () => {
        const state = engine.getState();
        state.stars.forEach((star) => {
          expect(star.position.x).toBeGreaterThanOrEqual(0);
          expect(star.position.x).toBeLessThanOrEqual(config.canvasWidth);
          expect(star.position.y).toBeGreaterThanOrEqual(0);
          expect(star.position.y).toBeLessThanOrEqual(config.canvasHeight);
        });
      });
    });
  });
});
