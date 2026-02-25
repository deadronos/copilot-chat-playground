import type { GameState } from "@/redvsblue/types"

import { CanvasRenderer } from "@/redvsblue/renderer"
import { applyCanvasSize } from "@copilot-playground/shared"
import type { EngineWithWorkerControls } from "@/redvsblue/engineManager"

export type SnapshotSelector<TState> = (state: TState) => GameState | null
export type SnapshotSubscriber<TState> = (
  selector: SnapshotSelector<TState>,
  listener: (snapshot: GameState | null) => void
) => () => void

export type RendererManagerOptions = {
  canvas: HTMLCanvasElement
  container?: Element | null
  engine: EngineWithWorkerControls
  worker: boolean
  selectedRenderer: string
  onFallbackToCanvas?: () => void
  rendererFactory?: () => CanvasRenderer
}

export type RendererManager = {
  configureCanvas: () => { width: number; height: number } | null
  initRenderer: () => CanvasRenderer | null
  subscribeToSnapshots: <TState>(subscribe: SnapshotSubscriber<TState>, selector: SnapshotSelector<TState>) => () => void
  observeResize: (onResize: () => void) => () => void
  destroyRenderer: () => void
  reset: () => void
}

type CanvasTransfer = { transferControlToOffscreen?: () => OffscreenCanvas }
type CanvasResizer = { resizeCanvas: (width: number, height: number) => void }
type CanvasSetter = { setCanvas: (canvas: OffscreenCanvas, width: number, height: number) => void }

const hasResizeCanvas = (engine: EngineWithWorkerControls): engine is EngineWithWorkerControls & CanvasResizer => {
  return typeof (engine as CanvasResizer).resizeCanvas === "function"
}

const hasSetCanvas = (engine: EngineWithWorkerControls): engine is EngineWithWorkerControls & CanvasSetter => {
  return typeof (engine as CanvasSetter).setCanvas === "function"
}

export function getCanvasSize(
  canvas: HTMLCanvasElement,
  container?: Element | null
): { width: number; height: number } {
  const el = container ?? canvas.parentElement
  const width = el instanceof HTMLElement ? el.clientWidth : canvas.clientWidth ?? 0
  const height = el instanceof HTMLElement ? el.clientHeight : canvas.clientHeight ?? 0
  return { width, height }
}

export function createRendererManager(options: RendererManagerOptions): RendererManager {
  const {
    canvas,
    container,
    engine,
    worker,
    selectedRenderer,
    onFallbackToCanvas,
    rendererFactory = () => new CanvasRenderer(),
  } = options

  const wantOffscreen = worker && selectedRenderer === "offscreen"
  const offscreenSupported =
    wantOffscreen &&
    typeof (canvas as CanvasTransfer).transferControlToOffscreen === "function" &&
    typeof OffscreenCanvas !== "undefined"

  const useOffscreen = Boolean(offscreenSupported)
  let renderer: CanvasRenderer | null = null
  let offscreenCanvas: OffscreenCanvas | null = null

  const initRenderer = (): CanvasRenderer | null => {
    if (useOffscreen) return null
    if (!renderer) {
      renderer = rendererFactory()
    }
    renderer.init(canvas)
    return renderer
  }

  const configureCanvas = (): { width: number; height: number } | null => {
    const { width, height } = getCanvasSize(canvas, container)
    applyCanvasSize(canvas, width, height)

    if (useOffscreen) {
      if (!offscreenCanvas) {
        try {
          const offscreen = (canvas as CanvasTransfer).transferControlToOffscreen!()
          offscreenCanvas = offscreen
          if (hasSetCanvas(engine)) {
            engine.setCanvas(offscreen, canvas.width, canvas.height)
          }
        } catch {
          onFallbackToCanvas?.()
          return null
        }
      } else if (hasResizeCanvas(engine)) {
        engine.resizeCanvas(canvas.width, canvas.height)
      }
    }

    return { width: canvas.width, height: canvas.height }
  }

  const subscribeToSnapshots = <TState>(
    subscribe: SnapshotSubscriber<TState>,
    selector: SnapshotSelector<TState>
  ): (() => void) => {
    if (!renderer) return () => {}
    return subscribe(selector, (snapshot) => {
      renderer?.render(snapshot)
    })
  }

  const observeResize = (onResize: () => void): (() => void) => {
    const resizeObserver = new ResizeObserver(() => {
      onResize()
    })

    if (container) resizeObserver.observe(container)

    return () => resizeObserver.disconnect()
  }

  const destroyRenderer = (): void => {
    renderer?.destroy()
    renderer = null
  }

  const reset = (): void => {
    destroyRenderer()
    offscreenCanvas = null
  }

  return {
    configureCanvas,
    initRenderer,
    subscribeToSnapshots,
    observeResize,
    destroyRenderer,
    reset,
  }
}