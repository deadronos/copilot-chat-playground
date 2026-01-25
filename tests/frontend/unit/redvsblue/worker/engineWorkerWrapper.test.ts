import { describe, it, expect } from "vitest";

import { EngineWorkerWrapper } from "@/redvsblue/worker/engineWorkerWrapper";
import { createEngineWorkerHost } from "@/redvsblue/worker/engineWorkerHost";
import type { EngineConfig, GameState } from "@/redvsblue/types";
import type { EngineWorkerToMainMessage, EngineWorkerToWorkerMessage } from "@/redvsblue/worker/engineWorkerHost";

class FakeWorker {
  onmessage: ((ev: MessageEvent<EngineWorkerToMainMessage>) => void) | null = null;
  onerror: ((ev: any) => void) | null = null;

  private host = createEngineWorkerHost({
    postMessage: (msg) => {
      this.onmessage?.({ data: msg } as MessageEvent<EngineWorkerToMainMessage>);
    },
  });

  postMessage(msg: EngineWorkerToWorkerMessage): void {
    this.host.handleMessage(msg);
  }

  terminate(): void {
    this.host.handleMessage({ type: "destroy" });
  }
}

function normalizeSnapshot(snapshot: GameState): Omit<GameState, "timestamp"> & { timestamp: number } {
  const cloned = JSON.parse(JSON.stringify(snapshot)) as GameState;
  cloned.timestamp = 0;
  return cloned;
}

describe("redvsblue/worker wrapper", () => {
  it("forwards snapshots and telemetry", () => {
    const wrapper = new EngineWorkerWrapper({ workerFactory: () => new FakeWorker() as unknown as Worker, snapshotHz: 60, tickHz: 60 });

    const config: EngineConfig = {
      canvasWidth: 800,
      canvasHeight: 600,
      shipSpeed: 5,
      bulletSpeed: 8,
      bulletDamage: 10,
      shipMaxHealth: 30,
      enableTelemetry: true,
      seed: 999,
    };

    let lastSnapshot: GameState | null = null;
    let telemetrySeen = false;

    wrapper.on("snapshot", (s) => {
      lastSnapshot = s as GameState;
    });
    wrapper.on("telemetry", (e) => {
      const evt = e as any;
      if (evt && typeof evt === "object" && "type" in evt) telemetrySeen = true;
    });

    wrapper.init(config);
    wrapper.spawnShip("red");
    wrapper.step(16, 10);

    expect(lastSnapshot).not.toBeNull();
    expect(normalizeSnapshot(wrapper.getState())).toEqual(normalizeSnapshot(lastSnapshot!));
    expect(telemetrySeen).toBe(true);

    wrapper.destroy();
  });
});
