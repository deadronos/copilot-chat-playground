import { create } from "zustand"

export type RendererId = "canvas"

export type UIStore = {
  running: boolean
  selectedRenderer: RendererId
  fps: number | null
  setRunning: (running: boolean) => void
  setSelectedRenderer: (renderer: RendererId) => void
  setFps: (fps: number | null) => void
}

export const useUIStore = create<UIStore>((set) => ({
  running: false,
  selectedRenderer: "canvas",
  fps: null,
  setRunning: (running) => set({ running }),
  setSelectedRenderer: (selectedRenderer) => set({ selectedRenderer }),
  setFps: (fps) => set({ fps }),
}))

