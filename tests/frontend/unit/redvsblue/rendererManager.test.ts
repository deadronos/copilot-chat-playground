import { afterEach, describe, expect, it, vi } from "vitest"

import { createRendererManager } from "@/redvsblue/rendererManager"
import type { EngineWithWorkerControls } from "@/redvsblue/engineManager"

const createEngineStub = (): EngineWithWorkerControls => ({
  init: vi.fn(),
  update: vi.fn(),
  getState: vi.fn(),
  destroy: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  spawnShip: vi.fn(),
  reset: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
  setCanvas: vi.fn(),
  resizeCanvas: vi.fn(),
})

const setContainerSize = (container: HTMLElement, width: number, height: number): void => {
  Object.defineProperty(container, "clientWidth", { value: width, configurable: true })
  Object.defineProperty(container, "clientHeight", { value: height, configurable: true })
}

afterEach(() => {
  delete (globalThis as unknown as { OffscreenCanvas?: unknown }).OffscreenCanvas
})

describe("rendererManager", () => {
  it("transfers offscreen canvas and resizes on subsequent configure", () => {
    ;(globalThis as unknown as { OffscreenCanvas?: unknown }).OffscreenCanvas = class {}

    const engine = createEngineStub()
    const container = document.createElement("div")
    setContainerSize(container, 800, 600)

    const canvas = document.createElement("canvas") as HTMLCanvasElement & {
      transferControlToOffscreen?: () => OffscreenCanvas
    }
    const offscreen = { width: 0, height: 0 } as OffscreenCanvas
    canvas.transferControlToOffscreen = vi.fn(() => offscreen)

    const manager = createRendererManager({
      canvas,
      container,
      engine,
      worker: true,
      selectedRenderer: "offscreen",
    })

    const size = manager.configureCanvas()

    expect(size).toEqual({ width: 800, height: 600 })
    expect(engine.setCanvas).toHaveBeenCalledWith(offscreen, 800, 600)

    setContainerSize(container, 1024, 768)
    manager.configureCanvas()

    expect(engine.resizeCanvas).toHaveBeenCalledWith(1024, 768)
  })

  it("falls back when offscreen transfer fails", () => {
    ;(globalThis as unknown as { OffscreenCanvas?: unknown }).OffscreenCanvas = class {}

    const engine = createEngineStub()
    const container = document.createElement("div")
    setContainerSize(container, 400, 300)

    const canvas = document.createElement("canvas") as HTMLCanvasElement & {
      transferControlToOffscreen?: () => OffscreenCanvas
    }
    canvas.transferControlToOffscreen = vi.fn(() => {
      throw new Error("transfer failed")
    })

    const onFallback = vi.fn()
    const manager = createRendererManager({
      canvas,
      container,
      engine,
      worker: true,
      selectedRenderer: "offscreen",
      onFallbackToCanvas: onFallback,
    })

    const size = manager.configureCanvas()

    expect(size).toBeNull()
    expect(onFallback).toHaveBeenCalledTimes(1)
  })
})