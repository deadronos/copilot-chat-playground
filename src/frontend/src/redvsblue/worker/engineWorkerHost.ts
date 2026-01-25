import { createEngine } from "@/redvsblue/engine";
import type { EngineConfig, GameState, Team, TelemetryEvent } from "@/redvsblue/types";
import { OffscreenCanvasRenderer } from "@/redvsblue/renderer/OffscreenCanvasRenderer";

export type EngineWorkerInit = {
  type: "init";
  config: EngineConfig;
  tickHz?: number;
  snapshotHz?: number;
};

export type EngineWorkerStart = { type: "start" };
export type EngineWorkerStop = { type: "stop" };

export type EngineWorkerStep = {
  type: "step";
  dtMs?: number;
  steps?: number;
};

export type EngineWorkerSpawn = {
  type: "spawn";
  team: Team;
};

export type EngineWorkerReset = { type: "reset" };

export type EngineWorkerSetCanvas = {
  type: "setCanvas";
  canvas: OffscreenCanvas;
  width: number;
  height: number;
};

export type EngineWorkerResizeCanvas = {
  type: "resizeCanvas";
  width: number;
  height: number;
};

export type EngineWorkerEmit = {
  type: "emit";
  event: string;
  data: unknown;
};

export type EngineWorkerDestroy = { type: "destroy" };

export type EngineWorkerToWorkerMessage =
  | EngineWorkerInit
  | EngineWorkerStart
  | EngineWorkerStop
  | EngineWorkerStep
  | EngineWorkerSpawn
  | EngineWorkerReset
  | EngineWorkerSetCanvas
  | EngineWorkerResizeCanvas
  | EngineWorkerEmit
  | EngineWorkerDestroy;

export type EngineWorkerSnapshot = { type: "snapshot"; snapshot: GameState };
export type EngineWorkerTelemetry = { type: "telemetry"; event: TelemetryEvent };
export type EngineWorkerError = { type: "error"; message: string };

export type EngineWorkerToMainMessage = EngineWorkerSnapshot | EngineWorkerTelemetry | EngineWorkerError;

export type EngineWorkerHostOptions = {
  postMessage: (msg: EngineWorkerToMainMessage) => void;
  setIntervalFn?: (fn: () => void, ms: number) => unknown;
  clearIntervalFn?: (id: unknown) => void;
};

export type EngineWorkerHost = {
  handleMessage: (msg: EngineWorkerToWorkerMessage) => void;
};

function clampHz(value: number | undefined, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(1, Math.floor(value as number));
}

export function createEngineWorkerHost(options: EngineWorkerHostOptions): EngineWorkerHost {
  const postMessage = options.postMessage;
  const setIntervalFn = options.setIntervalFn ?? ((fn, ms) => setInterval(fn, ms));
  const clearIntervalFn = options.clearIntervalFn ?? ((id) => clearInterval(id as any));

  let engine: ReturnType<typeof createEngine> | null = null;
  let telemetryHandler: ((data: unknown) => void) | null = null;

  let tickHz = 60;
  let snapshotHz = 30;
  let broadcastEvery = 2;
  let tickCount = 0;

  let intervalId: unknown | null = null;

  let offscreenRenderer: OffscreenCanvasRenderer | null = null;

  const stopLoop = () => {
    if (intervalId !== null) {
      clearIntervalFn(intervalId);
      intervalId = null;
    }
  };

  const publishSnapshot = () => {
    if (!engine) return;
    const snapshot = engine.getState();
    if (offscreenRenderer) {
      offscreenRenderer.render(snapshot);
    }
    postMessage({ type: "snapshot", snapshot });
  };

  const computeRates = () => {
    broadcastEvery = Math.max(1, Math.round(tickHz / Math.max(1, snapshotHz)));
  };

  const startLoop = () => {
    if (!engine) return;
    if (intervalId !== null) return;

    const dtMs = 1000 / tickHz;
    intervalId = setIntervalFn(() => {
      if (!engine) return;
      engine.update(dtMs);
      tickCount++;
      if (tickCount % broadcastEvery === 0) {
        publishSnapshot();
      }
    }, dtMs);
  };

  const teardownEngine = () => {
    stopLoop();
    if (engine && telemetryHandler) {
      engine.off("telemetry", telemetryHandler);
    }
    telemetryHandler = null;
    engine?.destroy();
    engine = null;
    tickCount = 0;
  };

  const teardownRenderer = () => {
    offscreenRenderer?.destroy();
    offscreenRenderer = null;
  };

  const handleMessage = (msg: EngineWorkerToWorkerMessage) => {
    try {
      switch (msg.type) {
        case "init": {
          teardownEngine();
          engine = createEngine();
          tickHz = clampHz(msg.tickHz, 60);
          snapshotHz = clampHz(msg.snapshotHz, 30);
          computeRates();

          telemetryHandler = (data: unknown) => {
            postMessage({ type: "telemetry", event: data as TelemetryEvent });
          };
          engine.on("telemetry", telemetryHandler);

          engine.init(msg.config);
          engine.reset();
          publishSnapshot();
          return;
        }
        case "setCanvas": {
          teardownRenderer();
          offscreenRenderer = new OffscreenCanvasRenderer();
          offscreenRenderer.init(msg.canvas);
          offscreenRenderer.resize(msg.width, msg.height);
          // Render latest snapshot if we already have an engine.
          if (engine) {
            offscreenRenderer.render(engine.getState());
          }
          return;
        }
        case "resizeCanvas": {
          if (!offscreenRenderer) return;
          offscreenRenderer.resize(msg.width, msg.height);
          return;
        }
        case "start": {
          startLoop();
          return;
        }
        case "stop": {
          stopLoop();
          return;
        }
        case "step": {
          if (!engine) return;
          const dtMs = msg.dtMs ?? 1000 / tickHz;
          const steps = Math.max(1, Math.floor(msg.steps ?? 1));
          for (let i = 0; i < steps; i++) {
            engine.update(dtMs);
            tickCount++;
          }
          publishSnapshot();
          return;
        }
        case "spawn": {
          if (!engine) return;
          engine.spawnShip(msg.team);
          publishSnapshot();
          return;
        }
        case "reset": {
          if (!engine) return;
          engine.reset();
          publishSnapshot();
          return;
        }
        case "emit": {
          if (!engine) return;
          engine.emit(msg.event, msg.data);
          return;
        }
        case "destroy": {
          teardownEngine();
          teardownRenderer();
          return;
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      postMessage({ type: "error", message });
    }
  };

  return { handleMessage };
}
