import { describe, expect, it, vi } from "vitest"

import { createEngineManager, type EngineRef, type EngineWithWorkerControls } from "@/redvsblue/engineManager"
import type { EngineConfig, GameState } from "@/redvsblue/types"

const baseConfig: EngineConfig = {
  canvasWidth: 320,
  canvasHeight: 200,
  shipSpeed: 4,
  bulletSpeed: 7,
  bulletDamage: 2,
  shipMaxHealth: 12,
  enableTelemetry: false,
}

const snapshot: GameState = {
  ships: [],
  bullets: [],
  particles: [],
  stars: [],
  timestamp: 0,
}

const createEngineStub = () => {
  const listeners = new Map<string, Set<(data: unknown) => void>>()

  const engine: EngineWithWorkerControls = {
    init: vi.fn(),
    update: vi.fn(),
    getState: vi.fn(() => snapshot),
    destroy: vi.fn(),
    on: vi.fn((event: string, handler: (data: unknown) => void) => {
      if (!listeners.has(event)) listeners.set(event, new Set())
      listeners.get(event)!.add(handler)
    }),
    off: vi.fn((event: string, handler: (data: unknown) => void) => {
      listeners.get(event)?.delete(handler)
    }),
    emit: vi.fn((event: string, data: unknown) => {
      listeners.get(event)?.forEach((h) => h(data))
    }),
    spawnShip: vi.fn(),
    reset: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  }

  return engine
}

describe("engineManager", () => {
  it("uses engineFactory for main-thread engine and updates snapshots", () => {
    const engine = createEngineStub()
    const engineFactory = vi.fn(() => engine)
    const engineRef: EngineRef = { current: null }

    const manager = createEngineManager({ engineRef, worker: false, engineFactory })

    manager.ensureEngine()
    expect(engineFactory).toHaveBeenCalledTimes(1)

    const onSnapshot = vi.fn()
    manager.updateEngine(16, onSnapshot)

    expect(engine.update).toHaveBeenCalledWith(16)
    expect(onSnapshot).toHaveBeenCalledWith(snapshot)

    manager.startIfWorker()
    manager.stopIfWorker()
    expect(engine.start).not.toHaveBeenCalled()
    expect(engine.stop).not.toHaveBeenCalled()
  })

  it("uses workerFactory in worker mode and calls start/stop", () => {
    const engine = createEngineStub()
    const workerFactory = vi.fn(() => engine)
    const engineRef: EngineRef = { current: null }

    const manager = createEngineManager({
      engineRef,
      worker: true,
      workerTickHz: 20,
      workerSnapshotHz: 10,
      workerFactory,
    })

    manager.ensureEngine()
    expect(workerFactory).toHaveBeenCalledWith({ tickHz: 20, snapshotHz: 10 })

    manager.startIfWorker()
    manager.stopIfWorker()

    expect(engine.start).toHaveBeenCalledTimes(1)
    expect(engine.stop).toHaveBeenCalledTimes(1)
  })

  it("attaches and removes worker snapshot handler", () => {
    const engine = createEngineStub()
    const engineRef: EngineRef = { current: engine }
    const manager = createEngineManager({ engineRef, worker: true })

    const handler = vi.fn()
    const unsubscribe = manager.onWorkerSnapshot(handler)

    engine.emit("snapshot", snapshot)
    expect(handler).toHaveBeenCalledWith(snapshot)

    unsubscribe()
    engine.emit("snapshot", { ...snapshot, timestamp: 1 })
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it("resets engine and snapshots when not in worker mode", () => {
    const engine = createEngineStub()
    const engineRef: EngineRef = { current: engine }
    const manager = createEngineManager({ engineRef, worker: false })

    const onSnapshot = vi.fn()
    manager.resetEngine(onSnapshot)

    expect(engine.reset).toHaveBeenCalledTimes(1)
    expect(onSnapshot).toHaveBeenCalledWith(snapshot)
  })

  it("initializes engine with provided config", () => {
    const engine = createEngineStub()
    const engineRef: EngineRef = { current: engine }
    const manager = createEngineManager({ engineRef, worker: false })

    manager.initEngine(baseConfig)
    expect(engine.init).toHaveBeenCalledWith(baseConfig)
  })
})