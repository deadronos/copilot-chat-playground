import type { GameState } from "@/redvsblue/types"

export interface Renderer {
  init: (canvas: HTMLCanvasElement) => void
  render: (snapshot: GameState | null) => void
  destroy: () => void
}

