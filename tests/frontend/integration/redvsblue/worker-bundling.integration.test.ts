import { describe, it, expect } from "vitest";

import { EngineWorkerWrapper } from "@/redvsblue/worker/engineWorkerWrapper";
import type { EngineConfig } from "@/redvsblue/types";

describe("redvsblue worker bundling (smoke)", () => {
  const itWorker = typeof Worker === "undefined" ? it.skip : it;

  itWorker("can instantiate a real module Worker when available", () => {

    const wrapper = new EngineWorkerWrapper({ tickHz: 60, snapshotHz: 60 });
    const config: EngineConfig = {
      canvasWidth: 200,
      canvasHeight: 100,
      shipSpeed: 5,
      bulletSpeed: 8,
      bulletDamage: 10,
      shipMaxHealth: 30,
      enableTelemetry: false,
      seed: 1,
    };

    wrapper.init(config);
    wrapper.step(16, 2);
    const snapshot = wrapper.getState();
    expect(snapshot).toBeDefined();

    wrapper.destroy();
  });
});
