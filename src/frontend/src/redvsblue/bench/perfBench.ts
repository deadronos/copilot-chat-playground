import { createEngine } from "@/redvsblue/engine";
import type { EngineConfig, Team } from "@/redvsblue/types";
import { EngineWorkerWrapper } from "@/redvsblue/worker/engineWorkerWrapper";

export type PerfBenchMode = "main" | "worker";

export type PerfBenchOptions = {
  mode: PerfBenchMode;
  durationMs?: number;
  tickHz?: number;
  snapshotHz?: number;
  seed?: number;
  spawnRed?: number;
  spawnBlue?: number;
  config?: Partial<Omit<EngineConfig, "canvasWidth" | "canvasHeight">>;
  canvasWidth?: number;
  canvasHeight?: number;
};

export type PerfBenchResult = {
  mode: PerfBenchMode;
  durationMs: number;
  tickHz: number;
  snapshotHz: number;
  updates: number;
  snapshots: number;
  avgUpdateMs: number;
  approxSnapshotFps: number;
};

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function clampHz(value: number | undefined, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(1, Math.floor(value as number));
}

export async function runPerfBench(opts: PerfBenchOptions): Promise<PerfBenchResult> {
  const durationMs = Math.max(250, Math.floor(opts.durationMs ?? 5000));
  const tickHz = clampHz(opts.tickHz, 60);
  const snapshotHz = clampHz(opts.snapshotHz, 30);
  const canvasWidth = Math.max(1, Math.floor(opts.canvasWidth ?? 800));
  const canvasHeight = Math.max(1, Math.floor(opts.canvasHeight ?? 600));

  const config: EngineConfig = {
    canvasWidth,
    canvasHeight,
    shipSpeed: 5,
    bulletSpeed: 8,
    bulletDamage: 10,
    shipMaxHealth: 30,
    enableTelemetry: false,
    seed: opts.seed ?? 123,
    ...(opts.config ?? {}),
  };

  const spawn = (engine: { spawnShip: (t: Team) => void }) => {
    const r = Math.max(0, Math.floor(opts.spawnRed ?? 100));
    const b = Math.max(0, Math.floor(opts.spawnBlue ?? 100));
    for (let i = 0; i < r; i++) engine.spawnShip("red");
    for (let i = 0; i < b; i++) engine.spawnShip("blue");
  };

  let updates = 0;
  let snapshots = 0;
  let totalUpdateMs = 0;

  if (opts.mode === "worker") {
    const engine = new EngineWorkerWrapper({ tickHz, snapshotHz });
    const snapshotHandler = () => {
      snapshots++;
    };
    engine.on("snapshot", snapshotHandler);
    engine.init(config);
    spawn(engine);
    engine.start();

    // In worker-loop mode, we can't time worker update() directly.
    // We report snapshots as a proxy for frame rate.
    const start = performance.now();
    await sleep(durationMs);
    const end = performance.now();
    engine.stop();
    engine.off("snapshot", snapshotHandler);
    engine.destroy();

    const elapsed = Math.max(1, end - start);
    return {
      mode: "worker",
      durationMs: Math.round(elapsed),
      tickHz,
      snapshotHz,
      updates: 0,
      snapshots,
      avgUpdateMs: 0,
      approxSnapshotFps: (snapshots * 1000) / elapsed,
    };
  }

  // main-thread mode
  const engine = createEngine();
  engine.init(config);
  engine.reset();
  spawn(engine);

  const dtMs = 1000 / tickHz;
  const start = performance.now();
  const endAt = start + durationMs;

  while (performance.now() < endAt) {
    const t0 = performance.now();
    engine.update(dtMs);
    const t1 = performance.now();
    totalUpdateMs += t1 - t0;
    updates++;
    snapshots++;
    // yield to keep UI responsive in dev
    await sleep(0);
  }

  engine.destroy();

  const end = performance.now();
  const elapsed = Math.max(1, end - start);

  return {
    mode: "main",
    durationMs: Math.round(elapsed),
    tickHz,
    snapshotHz,
    updates,
    snapshots,
    avgUpdateMs: updates > 0 ? totalUpdateMs / updates : 0,
    approxSnapshotFps: (snapshots * 1000) / elapsed,
  };
}
