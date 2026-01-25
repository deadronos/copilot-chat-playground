import type { Engine, EngineConfig, GameState, Team } from "@/redvsblue/types";
import type { EngineWorkerToMainMessage, EngineWorkerToWorkerMessage } from "./engineWorkerHost";

type WorkerFactory = () => Worker;

export type EngineWorkerWrapperOptions = {
  tickHz?: number;
  snapshotHz?: number;
  workerFactory?: WorkerFactory;
};

type Listener = (data: unknown) => void;

export class EngineWorkerWrapper implements Engine {
  private worker: Worker;
  private listeners = new Map<string, Set<Listener>>();
  private lastSnapshot: GameState = {
    ships: [],
    bullets: [],
    particles: [],
    stars: [],
    timestamp: 0,
  };

  private tickHz: number | undefined;
  private snapshotHz: number | undefined;

  constructor(options: EngineWorkerWrapperOptions = {}) {
    this.tickHz = options.tickHz;
    this.snapshotHz = options.snapshotHz;

    const workerFactory =
      options.workerFactory ??
      (() => new Worker(new URL("./engine.worker.ts", import.meta.url), { type: "module" }));

    this.worker = workerFactory();
    this.worker.onmessage = (ev: MessageEvent<EngineWorkerToMainMessage>) => {
      this.handleWorkerMessage(ev.data);
    };
    this.worker.onerror = (ev) => {
      this.emitLocal("error", ev);
    };
  }

  setCanvas(canvas: OffscreenCanvas, width: number, height: number): void {
    // Transfer the OffscreenCanvas into the worker
    this.worker.postMessage(
      { type: "setCanvas", canvas, width, height } as EngineWorkerToWorkerMessage,
      [canvas as unknown as Transferable]
    );
  }

  resizeCanvas(width: number, height: number): void {
    this.post({ type: "resizeCanvas", width, height } as EngineWorkerToWorkerMessage);
  }

  start(): void {
    this.post({ type: "start" });
  }

  stop(): void {
    this.post({ type: "stop" });
  }

  step(dtMs?: number, steps?: number): void {
    this.post({ type: "step", dtMs, steps });
  }

  init(config: EngineConfig): void {
    this.post({
      type: "init",
      config,
      tickHz: this.tickHz,
      snapshotHz: this.snapshotHz,
    });
  }

  update(deltaTime: number): void {
    void deltaTime;
    // In worker-loop mode, update() isn't used by the app.
    // It remains for API compatibility and step-driven tests.
    this.step(deltaTime, 1);
  }

  getState(): GameState {
    return this.lastSnapshot;
  }

  destroy(): void {
    try {
      this.post({ type: "destroy" });
    } finally {
      this.worker.terminate();
      this.listeners.clear();
    }
  }

  on(event: string, handler: (data: unknown) => void): void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(handler);
  }

  off(event: string, handler: (data: unknown) => void): void {
    const set = this.listeners.get(event);
    if (!set) return;
    set.delete(handler);
    if (set.size === 0) this.listeners.delete(event);
  }

  emit(event: string, data: unknown): void {
    // Forward into worker engine (rarely used; mostly for tests/tools).
    this.post({ type: "emit", event, data });
  }

  spawnShip(team: Team): void {
    this.post({ type: "spawn", team });
  }

  reset(): void {
    this.post({ type: "reset" });
  }

  private post(msg: EngineWorkerToWorkerMessage): void {
    this.worker.postMessage(msg);
  }

  private handleWorkerMessage(msg: EngineWorkerToMainMessage): void {
    if (msg.type === "snapshot") {
      this.lastSnapshot = msg.snapshot;
      this.emitLocal("snapshot", msg.snapshot);
      return;
    }
    if (msg.type === "telemetry") {
      this.emitLocal("telemetry", msg.event);
      return;
    }
    if (msg.type === "error") {
      this.emitLocal("error", msg.message);
      return;
    }
  }

  private emitLocal(event: string, data: unknown): void {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const h of set) h(data);
  }
}
