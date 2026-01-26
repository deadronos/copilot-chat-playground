import { describe, expect, it, vi } from "vitest"

import { attachTelemetryForwarder } from "@/redvsblue/telemetryForwarder"
import type { EngineWithWorkerControls } from "@/redvsblue/engineManager"
import type { EngineConfig, TelemetryEvent } from "@/redvsblue/types"

const createEngineStub = () => {
  const listeners = new Map<string, Set<(data: unknown) => void>>()

  const engine: EngineWithWorkerControls = {
    init: vi.fn(),
    update: vi.fn(),
    getState: vi.fn(),
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

const baseConfig: Omit<EngineConfig, "canvasWidth" | "canvasHeight"> = {
  shipSpeed: 4,
  bulletSpeed: 7,
  bulletDamage: 2,
  shipMaxHealth: 12,
  enableTelemetry: true,
}

describe("telemetryForwarder", () => {
  it("forwards telemetry when enabled", () => {
    const engine = createEngineStub()
    const onTelemetry = vi.fn()
    const getUiEnabled = vi.fn(() => true)

    const cleanup = attachTelemetryForwarder({
      engine,
      config: baseConfig,
      onTelemetry,
      getUiEnabled,
    })

    const evt: TelemetryEvent = { type: "unit", timestamp: 1, data: {} }
    engine.emit("telemetry", evt)

    expect(onTelemetry).toHaveBeenCalledWith(evt)
    cleanup()
  })

  it("gates telemetry when UI toggle disabled", () => {
    const engine = createEngineStub()
    const onTelemetry = vi.fn()
    const getUiEnabled = vi.fn(() => false)

    attachTelemetryForwarder({
      engine,
      config: baseConfig,
      onTelemetry,
      getUiEnabled,
    })

    engine.emit("telemetry", { type: "unit", timestamp: 1, data: {} })
    expect(onTelemetry).not.toHaveBeenCalled()
  })

  it("gates telemetry when engine config disabled", () => {
    const engine = createEngineStub()
    const onTelemetry = vi.fn()
    const getUiEnabled = vi.fn(() => true)

    attachTelemetryForwarder({
      engine,
      config: { ...baseConfig, enableTelemetry: false },
      onTelemetry,
      getUiEnabled,
    })

    engine.emit("telemetry", { type: "unit", timestamp: 1, data: {} })
    expect(onTelemetry).not.toHaveBeenCalled()
  })

  it("removes handler on cleanup", () => {
    const engine = createEngineStub()
    const onTelemetry = vi.fn()

    const cleanup = attachTelemetryForwarder({
      engine,
      config: baseConfig,
      onTelemetry,
      getUiEnabled: () => true,
    })

    cleanup()
    engine.emit("telemetry", { type: "unit", timestamp: 1, data: {} })
    expect(onTelemetry).not.toHaveBeenCalled()
  })

  it("calls onError when handler throws", () => {
    const engine = createEngineStub()
    const onError = vi.fn()

    attachTelemetryForwarder({
      engine,
      config: baseConfig,
      onTelemetry: () => {
        throw new Error("boom")
      },
      getUiEnabled: () => true,
      onError,
    })

    engine.emit("telemetry", { type: "unit", timestamp: 1, data: {} })
    expect(onError).toHaveBeenCalledTimes(1)
  })
})