import { bench, describe } from "vitest";
import { Ship } from "./engine/entities";
import { updateEngineCore } from "./engine/core";
import type { EngineCoreState, EngineCoreContext } from "./engine/core";
import { DEFAULT_ENGINE_CONFIG } from "./config";

describe("Engine Core Performance", () => {
  const shipCount = 100;
  const state: EngineCoreState = {
    ships: [],
    bullets: [],
    particles: [],
    tick: 0,
  };

  const context: EngineCoreContext = {
    config: {
        ...DEFAULT_ENGINE_CONFIG,
        canvasWidth: 800,
        canvasHeight: 600,
        enableTelemetry: false,
    },
    rng: () => Math.random(),
    nextEntityId: (prefix) => `${prefix}-${Math.random()}`,
    emit: () => {},
  };

  // Initialize ships
  for (let i = 0; i < shipCount; i++) {
    const team = i % 2 === 0 ? "red" : "blue";
    state.ships.push(new Ship(`ship-${i}`, Math.random() * 800, Math.random() * 600, team, 100, Math.random, 10));
  }

  bench("updateEngineCore", () => {
    updateEngineCore(state, context, 16);
  });
});
