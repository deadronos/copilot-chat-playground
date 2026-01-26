import type { EngineConfig, GameState, Team } from "@/redvsblue/types"
import type { Engine as EngineAPI } from "@/redvsblue/types"

import { createEngine } from "@/redvsblue/engine"
import { EngineWorkerWrapper, type EngineWorkerWrapperOptions } from "@/redvsblue/worker/engineWorkerWrapper"

export type WorkerCanvasControls = {
  start: () => void
  stop: () => void
  setCanvas: (canvas: OffscreenCanvas, width: number, height: number) => void
  resizeCanvas: (width: number, height: number) => void
}

export type EngineWithWorkerControls = EngineAPI & Partial<WorkerCanvasControls>

export type EngineRef = {
  current: EngineWithWorkerControls | null
}

export type EngineManagerOptions = {
  engineRef: EngineRef
  worker: boolean
  workerTickHz?: number
  workerSnapshotHz?: number
  engineFactory?: () => EngineAPI
  workerFactory?: (options: EngineWorkerWrapperOptions) => EngineWorkerWrapper
}

export type EngineManager = {
  getEngine: () => EngineWithWorkerControls | null
  ensureEngine: () => EngineWithWorkerControls
  initEngine: (config: EngineConfig) => void
  updateEngine: (dtMs: number, onSnapshot?: (snapshot: GameState) => void) => void
  resetEngine: (onSnapshot?: (snapshot: GameState) => void) => void
  spawnShip: (team: Team, overrides?: Partial<{ shipSpeed: number; bulletSpeed: number; bulletDamage: number; shipMaxHealth: number }>, onSnapshot?: (snapshot: GameState) => void) => void
  startIfWorker: () => void
  stopIfWorker: () => void
  onWorkerSnapshot: (handler: (snapshot: GameState) => void) => () => void
  destroyEngine: () => void
}

type Startable = { start: () => void }
type Stoppable = { stop: () => void }

const hasStart = (engine: EngineWithWorkerControls | null): engine is EngineWithWorkerControls & Startable => {
  return !!engine && typeof (engine as Startable).start === "function"
}

const hasStop = (engine: EngineWithWorkerControls | null): engine is EngineWithWorkerControls & Stoppable => {
  return !!engine && typeof (engine as Stoppable).stop === "function"
}

export function createEngineManager(options: EngineManagerOptions): EngineManager {
  const {
    engineRef,
    worker,
    workerTickHz,
    workerSnapshotHz,
    engineFactory = createEngine,
    workerFactory = (opts) => new EngineWorkerWrapper(opts),
  } = options

  const getEngine = (): EngineWithWorkerControls | null => engineRef.current

  const ensureEngine = (): EngineWithWorkerControls => {
    if (engineRef.current) return engineRef.current
    const engine = worker
      ? workerFactory({ tickHz: workerTickHz, snapshotHz: workerSnapshotHz })
      : engineFactory()
    engineRef.current = engine as EngineWithWorkerControls
    return engineRef.current
  }

  const initEngine = (config: EngineConfig): void => {
    const engine = ensureEngine()
    engine.init(config)
  }

  const updateEngine = (dtMs: number, onSnapshot?: (snapshot: GameState) => void): void => {
    if (worker) return
    const engine = engineRef.current
    if (!engine) return
    engine.update(dtMs)
    if (onSnapshot) onSnapshot(engine.getState())
  }

  const resetEngine = (onSnapshot?: (snapshot: GameState) => void): void => {
    const engine = engineRef.current
    if (!engine) return
    engine.reset()
    if (!worker && onSnapshot) onSnapshot(engine.getState())
  }

  const spawnShip = (
    team: Team,
    overrides?: Partial<{ shipSpeed: number; bulletSpeed: number; bulletDamage: number; shipMaxHealth: number }>,
    onSnapshot?: (snapshot: GameState) => void
  ): void => {
    const engine = engineRef.current
    if (!engine) return
    engine.spawnShip(team, overrides)
    if (!worker && onSnapshot) onSnapshot(engine.getState())
  }

  const startIfWorker = (): void => {
    if (!worker) return
    if (hasStart(engineRef.current)) engineRef.current.start()
  }

  const stopIfWorker = (): void => {
    if (!worker) return
    if (hasStop(engineRef.current)) engineRef.current.stop()
  }

  const onWorkerSnapshot = (handler: (snapshot: GameState) => void): (() => void) => {
    if (!worker) return () => {}
    const engine = ensureEngine()
    const wrapped = (data: unknown) => {
      handler(data as GameState)
    }
    engine.on("snapshot", wrapped)
    return () => engine.off("snapshot", wrapped)
  }

  const destroyEngine = (): void => {
    const engine = engineRef.current
    if (!engine) return
    engine.destroy()
    engineRef.current = null
  }

  return {
    getEngine,
    ensureEngine,
    initEngine,
    updateEngine,
    resetEngine,
    spawnShip,
    startIfWorker,
    stopIfWorker,
    onWorkerSnapshot,
    destroyEngine,
  }
}