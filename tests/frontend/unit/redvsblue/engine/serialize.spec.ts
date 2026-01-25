import { describe, it, expect, beforeEach } from "vitest";
import { Engine } from "@/redvsblue/engine/engine";
import { serialize, cloneGameState } from "@/redvsblue/engine/serialize";
import type { GameState, EngineConfig } from "@/redvsblue/types";

describe("GameState Serialization", () => {
  let engine: Engine;
  let config: EngineConfig;

  beforeEach(() => {
    engine = new Engine();
    config = {
      canvasWidth: 800,
      canvasHeight: 600,
      shipSpeed: 2,
      bulletSpeed: 10,
      bulletDamage: 10,
      shipMaxHealth: 100,
      enableTelemetry: false,
    };
    engine.init(config);
    engine.reset();
  });

  describe("serialize() function", () => {
    it("should accept a valid GameState snapshot", () => {
      const snapshot = engine.getState();
      const serialized = serialize(snapshot);
      expect(serialized).toBeDefined();
      expect(serialized).toBe(snapshot); // Returns the snapshot as-is if valid
    });

    it("should validate that snapshot contains no functions", () => {
      const snapshot = engine.getState();
      // Ensure the snapshot doesn't accidentally contain any functions
      for (const ship of snapshot.ships) {
        expect(typeof ship.id).toBe("string");
        expect(typeof ship.team).toBe("string");
        expect(typeof ship.position.x).toBe("number");
        expect(typeof ship.position.y).toBe("number");
        expect(typeof ship.angle).toBe("number");
        expect(typeof ship.health).toBe("number");
      }
    });

    it("should throw error if snapshot contains functions", () => {
      const badSnapshot: GameState = {
        ships: [],
        bullets: [],
        particles: [],
        stars: [],
        timestamp: Date.now(),
        // @ts-ignore - intentionally adding a function for testing
        badFunction: () => {},
      };
      expect(() => serialize(badSnapshot)).toThrow();
    });

    it("should throw error if snapshot contains class instances", () => {
      class CustomClass {
        value = 42;
      }
      const badSnapshot: GameState = {
        ships: [],
        bullets: [],
        particles: [],
        stars: [],
        timestamp: Date.now(),
        // @ts-ignore - intentionally adding a class instance for testing
        badInstance: new CustomClass(),
      };
      expect(() => serialize(badSnapshot)).toThrow();
    });

    it("should throw error if snapshot contains circular references", () => {
      const badSnapshot: any = {
        ships: [],
        bullets: [],
        particles: [],
        stars: [],
        timestamp: Date.now(),
      };
      // Create a circular reference
      badSnapshot.self = badSnapshot;
      expect(() => serialize(badSnapshot)).toThrow();
    });

    it("should throw error if snapshot contains DOM nodes", () => {
      const badSnapshot: any = {
        ships: [],
        bullets: [],
        particles: [],
        stars: [],
        timestamp: Date.now(),
        domElement: document.createElement("div"),
      };
      expect(() => serialize(badSnapshot)).toThrow();
    });

    it("should throw error if snapshot contains Maps", () => {
      const badSnapshot: GameState = {
        ships: [],
        bullets: [],
        particles: [],
        stars: [],
        timestamp: Date.now(),
        // @ts-ignore - intentionally adding a Map for testing
        badMap: new Map(),
      };
      expect(() => serialize(badSnapshot)).toThrow();
    });

    it("should throw error if snapshot contains Sets", () => {
      const badSnapshot: GameState = {
        ships: [],
        bullets: [],
        particles: [],
        stars: [],
        timestamp: Date.now(),
        // @ts-ignore - intentionally adding a Set for testing
        badSet: new Set(),
      };
      expect(() => serialize(badSnapshot)).toThrow();
    });
  });

  describe("cloneGameState() function", () => {
    it("should deep-clone a GameState snapshot", () => {
      const snapshot = engine.getState();
      const cloned = cloneGameState(snapshot);

      expect(cloned).not.toBe(snapshot); // Different object reference
      expect(cloned).toEqual(snapshot); // But equal content
    });

    it("should create independent copies of nested arrays", () => {
      const snapshot = engine.getState();
      const cloned = cloneGameState(snapshot);

      expect(cloned.ships).not.toBe(snapshot.ships);
      expect(cloned.bullets).not.toBe(snapshot.bullets);
      expect(cloned.particles).not.toBe(snapshot.particles);
      expect(cloned.stars).not.toBe(snapshot.stars);
    });

    it("should create independent copies of nested objects", () => {
      const snapshot = engine.getState();
      const cloned = cloneGameState(snapshot);

      if (snapshot.ships.length > 0 && cloned.ships.length > 0) {
        expect(cloned.ships[0]).not.toBe(snapshot.ships[0]);
        expect(cloned.ships[0].position).not.toBe(snapshot.ships[0].position);
        expect(cloned.ships[0].velocity).not.toBe(snapshot.ships[0].velocity);
      }
    });

    it("should work with empty GameState", () => {
      const emptySnapshot: GameState = {
        ships: [],
        bullets: [],
        particles: [],
        stars: [],
        timestamp: Date.now(),
      };
      const cloned = cloneGameState(emptySnapshot);
      expect(cloned).toEqual(emptySnapshot);
    });
  });

  describe("structuredClone compatibility", () => {
    it("should allow native structuredClone on engine snapshot", () => {
      const snapshot = engine.getState();
      const serialized = serialize(snapshot);
      // This should not throw
      const cloned = structuredClone(serialized);
      expect(cloned).toEqual(snapshot);
    });

    it("should preserve all ship data through structuredClone", () => {
      // Spawn and update to generate varied state
      engine.update(1000);

      const snapshot = engine.getState();
      const serialized = serialize(snapshot);
      const cloned = structuredClone(serialized);

      expect(cloned.ships).toHaveLength(snapshot.ships.length);
      cloned.ships.forEach((ship, i) => {
        expect(ship.id).toBe(snapshot.ships[i].id);
        expect(ship.team).toBe(snapshot.ships[i].team);
        expect(ship.position.x).toBe(snapshot.ships[i].position.x);
        expect(ship.position.y).toBe(snapshot.ships[i].position.y);
        expect(ship.velocity.x).toBe(snapshot.ships[i].velocity.x);
        expect(ship.velocity.y).toBe(snapshot.ships[i].velocity.y);
        expect(ship.angle).toBe(snapshot.ships[i].angle);
        expect(ship.health).toBe(snapshot.ships[i].health);
        expect(ship.maxHealth).toBe(snapshot.ships[i].maxHealth);
      });
    });

    it("should preserve all bullet data through structuredClone", () => {
      // Update several times to generate bullets
      for (let i = 0; i < 100; i++) {
        engine.update(16);
      }

      const snapshot = engine.getState();
      const serialized = serialize(snapshot);
      const cloned = structuredClone(serialized);

      expect(cloned.bullets).toHaveLength(snapshot.bullets.length);
      cloned.bullets.forEach((bullet, i) => {
        expect(bullet.id).toBe(snapshot.bullets[i].id);
        expect(bullet.team).toBe(snapshot.bullets[i].team);
        expect(bullet.position.x).toBe(snapshot.bullets[i].position.x);
        expect(bullet.damage).toBe(snapshot.bullets[i].damage);
        expect(bullet.ownerId).toBe(snapshot.bullets[i].ownerId);
      });
    });

    it("should preserve all particle data through structuredClone", () => {
      // Update several times to generate particles
      for (let i = 0; i < 100; i++) {
        engine.update(16);
      }

      const snapshot = engine.getState();
      const serialized = serialize(snapshot);
      const cloned = structuredClone(serialized);

      expect(cloned.particles).toHaveLength(snapshot.particles.length);
      cloned.particles.forEach((particle, i) => {
        expect(particle.id).toBe(snapshot.particles[i].id);
        expect(particle.position).toEqual(snapshot.particles[i].position);
        expect(particle.color).toBe(snapshot.particles[i].color);
      });
    });

    it("should preserve all star data through structuredClone", () => {
      const snapshot = engine.getState();
      const serialized = serialize(snapshot);
      const cloned = structuredClone(serialized);

      expect(cloned.stars).toHaveLength(snapshot.stars.length);
      cloned.stars.forEach((star, i) => {
        expect(star.id).toBe(snapshot.stars[i].id);
        expect(star.position).toEqual(snapshot.stars[i].position);
        expect(star.brightness).toBe(snapshot.stars[i].brightness);
        expect(star.size).toBe(snapshot.stars[i].size);
      });
    });

    it("should preserve timestamp through structuredClone", () => {
      const snapshot = engine.getState();
      const serialized = serialize(snapshot);
      const cloned = structuredClone(serialized);

      expect(cloned.timestamp).toBe(snapshot.timestamp);
      expect(typeof cloned.timestamp).toBe("number");
    });
  });

  describe("serialization safety across game updates", () => {
    it("should remain serializable after multiple updates", () => {
      for (let i = 0; i < 50; i++) {
        engine.update(16);
        const snapshot = engine.getState();
        expect(() => serialize(snapshot)).not.toThrow();
        expect(() => structuredClone(snapshot)).not.toThrow();
      }
    });

    it("should remain serializable after spawning ships", () => {
      for (let i = 0; i < 10; i++) {
        engine.spawnShip(i % 2 === 0 ? "red" : "blue");
        const snapshot = engine.getState();
        expect(() => serialize(snapshot)).not.toThrow();
      }
    });

    it("should remain serializable throughout combat", () => {
      // Run many updates to simulate combat with bullets and particles
      for (let i = 0; i < 200; i++) {
        engine.update(16);
        const snapshot = engine.getState();
        expect(() => serialize(snapshot)).not.toThrow();
        expect(() => structuredClone(snapshot)).not.toThrow();
      }
    });
  });
});
