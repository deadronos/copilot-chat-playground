import { useCallback, useEffect, useMemo, useRef } from "react"
import type { RefObject } from "react"

import { createEngine } from "@/redvsblue/engine"
import { DEFAULT_ENGINE_CONFIG } from "@/redvsblue/config/index"
import type { EngineConfig, GameState, Team } from "@/redvsblue/types"
import { CanvasRenderer } from "@/redvsblue/renderer"
import { selectSnapshot, useGameState } from "@/redvsblue/stores/gameState"
import { useUIStore } from "@/redvsblue/stores/uiStore"
import { useTelemetryStore } from "@/redvsblue/stores/telemetry"
import { EngineWorkerWrapper } from "@/redvsblue/worker/engineWorkerWrapper"
import type { Engine as EngineAPI } from "@/redvsblue/types"

export type UseGameOptions = {
  canvasRef: RefObject<HTMLCanvasElement | null>
  containerRef?: RefObject<Element | null>
  autoStart?: boolean
  config?: Partial<Omit<EngineConfig, "canvasWidth" | "canvasHeight">>
  worker?: boolean
  workerTickHz?: number
  workerSnapshotHz?: number
}

type Controls = {
  start: () => void
  stop: () => void
  spawnShip: (team: Team) => void
  reset: () => void
}

type SetupKey = {
  selectedRenderer: string
  worker: boolean
  workerTickHz?: number
  workerSnapshotHz?: number
  config: Omit<EngineConfig, "canvasWidth" | "canvasHeight">
}

function getCanvasSize(
  canvas: HTMLCanvasElement,
  container?: Element | null
): { width: number; height: number } {
  const el = container ?? canvas.parentElement
  const width = el instanceof HTMLElement ? el.clientWidth : canvas.clientWidth ?? 0
  const height = el instanceof HTMLElement ? el.clientHeight : canvas.clientHeight ?? 0
  return { width, height }
}

function applyCanvasSize(canvas: HTMLCanvasElement, width: number, height: number): void {
  const nextWidth = Math.max(1, Math.floor(width))
  const nextHeight = Math.max(1, Math.floor(height))
  if (canvas.width !== nextWidth) canvas.width = nextWidth
  if (canvas.height !== nextHeight) canvas.height = nextHeight
}

export function useGame(options: UseGameOptions): Controls {
  const {
    canvasRef,
    containerRef,
    autoStart = true,
    config,
    worker = false,
    workerTickHz,
    workerSnapshotHz,
  } = options

  const selectedRenderer = useUIStore((s) => s.selectedRenderer)

  const engineRef = useRef<(EngineAPI & Partial<Pick<EngineWorkerWrapper, "start" | "stop">>) | null>(null)
  const rendererRef = useRef<CanvasRenderer | null>(null)
  const offscreenCanvasRef = useRef<OffscreenCanvas | null>(null)
  const setupRef = useRef<SetupKey | null>(null)
  const isUnmountingRef = useRef(false)
  const rafIdRef = useRef<number | null>(null)
  const lastNowRef = useRef<number>(0)

  const fpsFramesRef = useRef<number>(0)
  const fpsWindowStartRef = useRef<number>(0)
  const fpsLastPublishRef = useRef<number>(0)

  const defaultConfig = useMemo<Omit<EngineConfig, "canvasWidth" | "canvasHeight">>(
    () => ({
      ...DEFAULT_ENGINE_CONFIG,
      ...config,
    }),
    [config]
  )

  function hasStop(e: unknown): e is { stop: () => void } {
    return !!e && typeof e === 'object' && 'stop' in e && typeof (e as { stop?: unknown }).stop === 'function'
  }

  const stop = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }

    const engine = engineRef.current
    if (engine && worker && hasStop(engine)) {
      engine.stop()
    }

    useUIStore.getState().setRunning(false)
    useUIStore.getState().setFps(null)
  }, [worker])

  const hardReset = useCallback(() => {
    const engine = engineRef.current
    if (engine) {
      engine.destroy()
    }
    rendererRef.current?.destroy()
    rendererRef.current = null
    engineRef.current = null
    offscreenCanvasRef.current = null
    useGameState.getState().clear()
  }, [])

  const isSameSetup = (a: SetupKey | null, b: SetupKey): boolean => {
    if (!a) return false
    return (
      a.selectedRenderer === b.selectedRenderer &&
      a.worker === b.worker &&
      a.workerTickHz === b.workerTickHz &&
      a.workerSnapshotHz === b.workerSnapshotHz &&
      a.config === b.config
    )
  }

  const tick = useCallback(function tickHandler(now: number) {
    const engine = engineRef.current
    if (!engine) return

    const running = useUIStore.getState().running
    if (!running) return

    const lastNow = lastNowRef.current || now
    const dtMs = Math.max(0, now - lastNow)
    lastNowRef.current = now

    // In worker mode, the worker runs the loop and publishes snapshots.
    // In non-worker mode, we run the simulation on the main thread.
    if (!worker) {
      engine.update(dtMs)
      useGameState.getState().setSnapshot(engine.getState())
    }

    // FPS (publish at most 4x/sec)
    if (fpsWindowStartRef.current === 0) {
      fpsWindowStartRef.current = now
      fpsLastPublishRef.current = now
      fpsFramesRef.current = 0
    }

    fpsFramesRef.current++
    const windowElapsed = now - fpsWindowStartRef.current
    const publishElapsed = now - fpsLastPublishRef.current
    if (windowElapsed >= 500 && publishElapsed >= 250) {
      const fps = (fpsFramesRef.current * 1000) / windowElapsed
      useUIStore.getState().setFps(Math.round(fps))
      fpsWindowStartRef.current = now
      fpsFramesRef.current = 0
      fpsLastPublishRef.current = now
    }

    if (!worker) {
      rafIdRef.current = requestAnimationFrame(tickHandler)
    }
  }, [worker])

  const start = useCallback(() => {
    if (useUIStore.getState().running) return
    if (!engineRef.current) return
    useUIStore.getState().setRunning(true)
    lastNowRef.current = performance.now()
    fpsWindowStartRef.current = 0
    fpsFramesRef.current = 0
    if (worker) {
      const engine = engineRef.current
      function hasStart(e: unknown): e is { start: () => void } {
        return !!e && typeof e === 'object' && 'start' in e && typeof (e as { start?: unknown }).start === 'function'
      }
      if (engine && hasStart(engine)) {
        engine.start()
      }
      return
    }
    rafIdRef.current = requestAnimationFrame(tick)
  }, [tick, worker])

  const spawnShip = useCallback(
    (team: Team) => {
    const engine = engineRef.current
    if (!engine) return
    engine.spawnShip(team)
    if (!worker) {
      useGameState.getState().setSnapshot(engine.getState())
    }
    },
    [worker]
  )

  const reset = useCallback(
    () => {
    const engine = engineRef.current
    if (!engine) return
    engine.reset()
    if (!worker) {
      useGameState.getState().setSnapshot(engine.getState())
    }
    },
    [worker]
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const nextSetup: SetupKey = {
      selectedRenderer,
      worker,
      workerTickHz,
      workerSnapshotHz,
      config: defaultConfig,
    }

    if (!isSameSetup(setupRef.current, nextSetup)) {
      hardReset()
    }
    setupRef.current = nextSetup

    const wantOffscreen = worker && selectedRenderer === "offscreen"
    const offscreenSupported =
      wantOffscreen &&
      typeof (canvas as unknown as { transferControlToOffscreen?: unknown }).transferControlToOffscreen === "function" &&
      typeof OffscreenCanvas !== "undefined"

    const useOffscreen = Boolean(offscreenSupported)

    const container = containerRef?.current ?? null

    const engine =
      engineRef.current ??
      (worker
        ? new EngineWorkerWrapper({ tickHz: workerTickHz, snapshotHz: workerSnapshotHz })
        : createEngine())

    engineRef.current = engine as unknown as EngineAPI & Partial<Pick<EngineWorkerWrapper, "start" | "stop">>

    const renderer = useOffscreen ? null : rendererRef.current ?? new CanvasRenderer()
    if (renderer) {
      renderer.init(canvas)
      rendererRef.current = renderer
    }

    // telemetry handler reference so we can unregister on cleanup
    let telemetryHandler: ((data: unknown) => void) | null = null

    // worker snapshot handler reference for cleanup
    let workerSnapshotHandler: ((data: unknown) => void) | null = null

    const configureEngine = () => {
      const { width, height } = getCanvasSize(canvas, container)
      applyCanvasSize(canvas, width, height)
      lastNowRef.current = performance.now()
      fpsWindowStartRef.current = 0
      fpsFramesRef.current = 0

      if (useOffscreen) {
        // Transfer canvas control once and let the worker render.
        if (!offscreenCanvasRef.current) {
          try {
            const canvasWithTransfer = canvas as unknown as { transferControlToOffscreen?: () => OffscreenCanvas }
            const offscreen = canvasWithTransfer.transferControlToOffscreen!()
            offscreenCanvasRef.current = offscreen
            if (typeof (engine as unknown as { setCanvas?: unknown }).setCanvas === "function") {
              ;(engine as unknown as { setCanvas: (c: OffscreenCanvas, w: number, h: number) => void }).setCanvas(offscreen, canvas.width, canvas.height)
            }
          } catch (err) {
            // Canvas already has a rendering context (cannot transfer). Fallback to main-thread renderer.
            console.warn("OffscreenCanvas transfer failed; falling back to canvas renderer", err)
            useUIStore.getState().setSelectedRenderer("canvas")
            return
          }
        } else if (typeof (engine as unknown as { resizeCanvas?: unknown }).resizeCanvas === "function") {
          ;(engine as unknown as { resizeCanvas: (w: number, h: number) => void }).resizeCanvas(canvas.width, canvas.height)
        }
      }

      // If we are currently running, stop worker loop before re-init
      if (worker && useUIStore.getState().running && hasStop(engine)) {
        engine.stop()
      }

      engine.init({
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        ...defaultConfig,
      })

      if (!worker) {
        engine.reset()
        useGameState.getState().setSnapshot(engine.getState())
      }

      // Telemetry: forward engine telemetry events to telemetry store
      // Respect both engine config (enableTelemetry) and UI toggle (telemetryEnabled)
      // remove any previously-registered handler before adding a new one (prevent duplicate handlers)
      if (telemetryHandler) engine.off("telemetry", telemetryHandler)

      telemetryHandler = (data: unknown) => {
        try {
          const evt = data as import("./types").TelemetryEvent
          const engineEnabled = defaultConfig.enableTelemetry ?? true
          const uiEnabled = useUIStore.getState().telemetryEnabled ?? true
          if (!engineEnabled || !uiEnabled) return
          // push into telemetry store (stores handle id/timestamp enrichment)
          useTelemetryStore.getState().pushTelemetry(evt)
        } catch (err) {
          // Defensive: ensure telemetry handler errors don't break engine loop
           
          console.error("telemetry handler error", err)
        }
      }

      engine.on("telemetry", telemetryHandler)

      if (worker) {
        // Subscribe to snapshots from the worker wrapper
        if (workerSnapshotHandler) engine.off("snapshot", workerSnapshotHandler)
        workerSnapshotHandler = (data: unknown) => {
          const snapshot = data as GameState
          useGameState.getState().setSnapshot(snapshot)

          // FPS based on snapshot arrival (publish at most 4x/sec)
          const now = performance.now()
          if (fpsWindowStartRef.current === 0) {
            fpsWindowStartRef.current = now
            fpsLastPublishRef.current = now
            fpsFramesRef.current = 0
          }

          fpsFramesRef.current++
          const windowElapsed = now - fpsWindowStartRef.current
          const publishElapsed = now - fpsLastPublishRef.current
          if (windowElapsed >= 500 && publishElapsed >= 250) {
            const fps = (fpsFramesRef.current * 1000) / windowElapsed
            useUIStore.getState().setFps(Math.round(fps))
            fpsWindowStartRef.current = now
            fpsFramesRef.current = 0
            fpsLastPublishRef.current = now
          }
        }

        engine.on("snapshot", workerSnapshotHandler)

        // Resume if we were running
        function hasStart(e: unknown): e is { start: () => void } {
          return !!e && typeof e === 'object' && 'start' in e && typeof (e as { start?: unknown }).start === 'function'
        }
        if (useUIStore.getState().running && hasStart(engine)) {
          engine.start()
        }
      }
    }

    configureEngine()

    const unsubscribe = renderer
      ? useGameState.subscribe(selectSnapshot, (snapshot) => {
          renderer.render(snapshot)
        })
      : () => {}

    const resizeObserver = new ResizeObserver(() => {
      // Re-init engine so world bounds match the canvas size (resets simulation).
      configureEngine()
    })

    if (container) resizeObserver.observe(container)

    if (autoStart) start()

    return () => {
      resizeObserver.disconnect()
      unsubscribe()
      stop()
      renderer?.destroy()
      if (telemetryHandler) engine.off("telemetry", telemetryHandler)
      if (workerSnapshotHandler) engine.off("snapshot", workerSnapshotHandler)
      if (isUnmountingRef.current) {
        hardReset()
      }
    }
  }, [
    autoStart,
    canvasRef,
    containerRef,
    defaultConfig,
    hardReset,
    selectedRenderer,
    start,
    stop,
    worker,
    workerSnapshotHz,
    workerTickHz,
  ])

  useEffect(() => {
    return () => {
      isUnmountingRef.current = true
    }
  }, [])

  return { start, stop, spawnShip, reset }
}
