import { describe, it, expect } from "vitest";

import { createEngine } from "@/redvsblue/engine";
import { createEngineWorkerHost } from "@/redvsblue/worker/engineWorkerHost";
import type { EngineConfig, GameState } from "@/redvsblue/types";

function normalizeSnapshot(snapshot: GameState): Omit<GameState, "timestamp"> & { timestamp: number } {
  const cloned = JSON.parse(JSON.stringify(snapshot)) as GameState;
  cloned.timestamp = 0;
  return cloned;
}

describe("redvsblue/worker engine host", () => {
  it("steps match in-process engine snapshots (seeded)", () => {
    const messages: any[] = [];
    const host = createEngineWorkerHost({ postMessage: (m) => messages.push(m) });

    const config: EngineConfig = {
      canvasWidth: 800,
      canvasHeight: 600,
      shipSpeed: 5,
      bulletSpeed: 8,
      bulletDamage: 10,
      shipMaxHealth: 30,
      enableTelemetry: false,
      seed: 1234,
    };

    // init emits a snapshot after reset
    host.handleMessage({ type: "init", config, tickHz: 60, snapshotHz: 60 });

    const engine = createEngine();
    engine.init(config);
    engine.reset();

    // Drain initial snapshot
    messages.length = 0;

    for (let i = 0; i < 50; i++) {
      host.handleMessage({ type: "step", dtMs: 16, steps: 1 });
      engine.update(16);

      const last = messages[messages.length - 1];
      expect(last?.type).toBe("snapshot");
      expect(normalizeSnapshot(last.snapshot)).toEqual(normalizeSnapshot(engine.getState()));

      messages.length = 0;
    }

    engine.destroy();
    host.handleMessage({ type: "destroy" });
  });
});
