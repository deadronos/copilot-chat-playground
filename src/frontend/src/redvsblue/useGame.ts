import { useCallback, useEffect, useMemo, useRef } from "react"
import type { RefObject } from "react"

import { createEngine } from "@/redvsblue/engine"
import type { EngineConfig, Team } from "@/redvsblue/types"
import { CanvasRenderer } from "@/redvsblue/renderer"
import { selectSnapshot, useGameState } from "@/redvsblue/stores/gameState"
import { useUIStore } from "@/redvsblue/stores/uiStore"
import { useTelemetryStore } from "@/redvsblue/stores/telemetry"

export type UseGameOptions = {
  canvasRef: RefObject<HTMLCanvasElement | null>
  containerRef?: RefObject<Element | null>
  autoStart?: boolean
  config?: Partial<Omit<EngineConfig, "canvasWidth" | "canvasHeight">>
}

type Controls = {
  start: () => void
  stop: () => void
  spawnShip: (team: Team) => void
  reset: () => void
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
  const { canvasRef, containerRef, autoStart = true, config } = options

  const engineRef = useRef<ReturnType<typeof createEngine> | null>(null)
  const rendererRef = useRef<CanvasRenderer | null>(null)
  const rafIdRef = useRef<number | null>(null)
  const lastNowRef = useRef<number>(0)

  const fpsFramesRef = useRef<number>(0)
  const fpsWindowStartRef = useRef<number>(0)
  const fpsLastPublishRef = useRef<number>(0)

  const defaultConfig = useMemo<Omit<EngineConfig, "canvasWidth" | "canvasHeight">>(
    () => ({
      shipSpeed: 5,
      bulletSpeed: 8,
      bulletDamage: 10,
      shipMaxHealth: 30,
      enableTelemetry: true,
      ...config,
    }),
    [config]
  )

  const stop = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }
    useUIStore.getState().setRunning(false)
    useUIStore.getState().setFps(null)
  }, [])

  const tick = useCallback((now: number) => {
    const engine = engineRef.current
    if (!engine) return

    const running = useUIStore.getState().running
    if (!running) return

    const lastNow = lastNowRef.current || now
    const dtMs = Math.max(0, now - lastNow)
    lastNowRef.current = now

    engine.update(dtMs)
    useGameState.getState().setSnapshot(engine.getState())

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

    rafIdRef.current = requestAnimationFrame(tick)
  }, [])

  const start = useCallback(() => {
    if (useUIStore.getState().running) return
    if (!engineRef.current) return
    useUIStore.getState().setRunning(true)
    lastNowRef.current = performance.now()
    fpsWindowStartRef.current = 0
    fpsFramesRef.current = 0
    rafIdRef.current = requestAnimationFrame(tick)
  }, [tick])

  const spawnShip = useCallback((team: Team) => {
    const engine = engineRef.current
    if (!engine) return
    engine.spawnShip(team)
    useGameState.getState().setSnapshot(engine.getState())
  }, [])

  const reset = useCallback(() => {
    const engine = engineRef.current
    if (!engine) return
    engine.reset()
    useGameState.getState().setSnapshot(engine.getState())
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const container = containerRef?.current ?? null

    const engine = createEngine()
    engineRef.current = engine

    const renderer = new CanvasRenderer()
    renderer.init(canvas)
    rendererRef.current = renderer

    // telemetry handler reference so we can unregister on cleanup
    let telemetryHandler: ((data: unknown) => void) | null = null

    const configureEngine = () => {
      const { width, height } = getCanvasSize(canvas, container)
      applyCanvasSize(canvas, width, height)
      lastNowRef.current = performance.now()
      fpsWindowStartRef.current = 0
      fpsFramesRef.current = 0
      engine.init({
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        ...defaultConfig,
      })
      engine.reset()
      useGameState.getState().setSnapshot(engine.getState())

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
          // eslint-disable-next-line no-console
          console.error("telemetry handler error", err)
        }
      }

      engine.on("telemetry", telemetryHandler)
    }

    configureEngine()

    const unsubscribe = useGameState.subscribe(selectSnapshot, (snapshot) => {
      renderer.render(snapshot)
    })

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
      renderer.destroy()
      if (telemetryHandler) engine.off("telemetry", telemetryHandler)
      engine.destroy()
      rendererRef.current = null
      engineRef.current = null
      useGameState.getState().clear()
    }
  }, [autoStart, canvasRef, containerRef, defaultConfig, start, stop])

  return { start, stop, spawnShip, reset }
}
