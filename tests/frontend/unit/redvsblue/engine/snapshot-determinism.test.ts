import { describe, it, expect } from "vitest";

import { createEngine } from "@/redvsblue/engine";
import type { EngineConfig, GameState } from "@/redvsblue/types";

function normalizeSnapshot(state: GameState) {
  return {
    ...state,
    timestamp: 0,
  };
}

describe("RedVsBlue Engine snapshot determinism", () => {
  it("produces identical snapshots with the same seed and inputs", () => {
    const config: EngineConfig = {
      canvasWidth: 640,
      canvasHeight: 360,
      shipSpeed: 5,
      bulletSpeed: 8,
      bulletDamage: 10,
      shipMaxHealth: 30,
      enableTelemetry: true,
      seed: 4242,
      ui: { starsCount: 6 },
    };

    const engineA = createEngine();
    engineA.init(config);
    engineA.spawnShip("red");
    engineA.spawnShip("blue");

    const engineB = createEngine();
    engineB.init(config);
    engineB.spawnShip("red");
    engineB.spawnShip("blue");

    for (let i = 0; i < 12; i++) {
      engineA.update(16);
      engineB.update(16);
    }

    const snapshotA = normalizeSnapshot(engineA.getState());
    const snapshotB = normalizeSnapshot(engineB.getState());

    expect(snapshotA).toEqual(snapshotB);
  });
});
