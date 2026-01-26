import { useCallback, useEffect, useMemo, useRef } from "react"
import type { RefObject } from "react"

import { DEFAULT_ENGINE_CONFIG } from "@/redvsblue/config/index"
import type { EngineConfig, GameState, Team } from "@/redvsblue/types"
import { selectSnapshot, useGameState } from "@/redvsblue/stores/gameState"
import { useUIStore } from "@/redvsblue/stores/uiStore"
import { useTelemetryStore } from "@/redvsblue/stores/telemetry"
import { createEngineManager, type EngineWithWorkerControls } from "@/redvsblue/engineManager"
import { createRendererManager, type RendererManager } from "@/redvsblue/rendererManager"
import { attachTelemetryForwarder } from "@/redvsblue/telemetryForwarder"
import { useFps } from "@/redvsblue/useFps"

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
  spawnShip: (team: Team, overrides?: Partial<{ shipSpeed: number; bulletSpeed: number; bulletDamage: number; shipMaxHealth: number }>) => void
  reset: () => void
}

type SetupKey = {
  selectedRenderer: string
  worker: boolean
  workerTickHz?: number
  workerSnapshotHz?: number
  config: Omit<EngineConfig, "canvasWidth" | "canvasHeight">
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

  const engineRef = useRef<EngineWithWorkerControls | null>(null)
  const rendererManagerRef = useRef<RendererManager | null>(null)
  const setupRef = useRef<SetupKey | null>(null)
  const isUnmountingRef = useRef(false)
  const rafIdRef = useRef<number | null>(null)
  const lastNowRef = useRef<number>(0)

  const engineManager = useMemo(
    () => createEngineManager({ engineRef, worker, workerTickHz, workerSnapshotHz }),
    [worker, workerSnapshotHz, workerTickHz]
  )

  const { reset: resetFps, recordFrame } = useFps()

  const defaultConfig = useMemo<Omit<EngineConfig, "canvasWidth" | "canvasHeight">>(
    () => ({
      ...DEFAULT_ENGINE_CONFIG,
      ...config,
    }),
    [config]
  )

  const stop = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }

    engineManager.stopIfWorker()

    useUIStore.getState().setRunning(false)
    useUIStore.getState().setFps(null)
  }, [engineManager])

  const hardReset = useCallback(() => {
    engineManager.destroyEngine()
    rendererManagerRef.current?.reset()
    rendererManagerRef.current = null
    useGameState.getState().clear()
  }, [engineManager])

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
      engineManager.updateEngine(dtMs, (snapshot) => {
        useGameState.getState().setSnapshot(snapshot)
      })
      const fps = recordFrame(now)
      if (fps !== null) {
        useUIStore.getState().setFps(fps)
      }
      rafIdRef.current = requestAnimationFrame(tickHandler)
    }
  }, [engineManager, recordFrame, worker])

  const start = useCallback(() => {
    if (useUIStore.getState().running) return
    if (!engineRef.current) return
    useUIStore.getState().setRunning(true)
    lastNowRef.current = performance.now()
    resetFps()
    if (worker) {
      engineManager.startIfWorker()
      return
    }
    rafIdRef.current = requestAnimationFrame(tick)
  }, [engineManager, resetFps, tick, worker])

  const spawnShip = useCallback(
    (team: Team, overrides?: Partial<{ shipSpeed: number; bulletSpeed: number; bulletDamage: number; shipMaxHealth: number }>) => {
      engineManager.spawnShip(team, overrides, (snapshot) => {
        useGameState.getState().setSnapshot(snapshot)
      })
    },
    [engineManager]
  )

  const reset = useCallback(() => {
    engineManager.resetEngine((snapshot) => {
      useGameState.getState().setSnapshot(snapshot)
    })
  }, [engineManager])

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
    const engine = engineManager.ensureEngine()
    const container = containerRef?.current ?? null

    const rendererManager =
      rendererManagerRef.current ??
      createRendererManager({
        canvas,
        container,
        engine,
        worker,
        selectedRenderer,
        onFallbackToCanvas: () => {
          useUIStore.getState().setSelectedRenderer("canvas")
        },
      })

    rendererManagerRef.current = rendererManager
    rendererManager.initRenderer()

    let telemetryCleanup: (() => void) | null = null
    let workerSnapshotCleanup: (() => void) | null = null

    const configureEngine = () => {
      const size = rendererManager.configureCanvas()
      lastNowRef.current = performance.now()
      resetFps()

      if (!size) return

      if (worker && useUIStore.getState().running) {
        engineManager.stopIfWorker()
      }

      engineManager.initEngine({
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        ...defaultConfig,
      })

      if (!worker) {
        engineManager.resetEngine((snapshot) => {
          useGameState.getState().setSnapshot(snapshot)
        })
      }

      telemetryCleanup?.()
      telemetryCleanup = attachTelemetryForwarder({
        engine,
        config: defaultConfig,
        getUiEnabled: () => useUIStore.getState().telemetryEnabled ?? true,
        onTelemetry: (evt) => {
          useTelemetryStore.getState().pushTelemetry(evt)
        },
      })

      if (worker) {
        workerSnapshotCleanup?.()
        workerSnapshotCleanup = engineManager.onWorkerSnapshot((snapshot) => {
          useGameState.getState().setSnapshot(snapshot)
          const fps = recordFrame(performance.now())
          if (fps !== null) {
            useUIStore.getState().setFps(fps)
          }
        })

        if (useUIStore.getState().running) {
          engineManager.startIfWorker()
        }
      }
    }

    configureEngine()

    const unsubscribe = rendererManager.subscribeToSnapshots(useGameState.subscribe, selectSnapshot)
    const disconnectResize = rendererManager.observeResize(() => {
      // Re-init engine so world bounds match the canvas size (resets simulation).
      configureEngine()
    })

    if (autoStart) start()

    return () => {
      disconnectResize()
      unsubscribe()
      stop()
      rendererManager.destroyRenderer()
      telemetryCleanup?.()
      workerSnapshotCleanup?.()
      if (isUnmountingRef.current) {
        hardReset()
      }
    }
  }, [
    autoStart,
    canvasRef,
    containerRef,
    defaultConfig,
    engineManager,
    hardReset,
    recordFrame,
    resetFps,
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
