import { create } from "zustand"

export type RendererId = "canvas" | "offscreen"

export type UIStore = {
  running: boolean
  selectedRenderer: RendererId
  fps: number | null
  telemetryEnabled: boolean
  setRunning: (running: boolean) => void
  setSelectedRenderer: (renderer: RendererId) => void
  setFps: (fps: number | null) => void
  setTelemetryEnabled: (enabled: boolean) => void
}

export const useUIStore = create<UIStore>((set) => ({
  running: false,
  selectedRenderer: "canvas",
  fps: null,
  telemetryEnabled: true,
  setRunning: (running) => set({ running }),
  setSelectedRenderer: (selectedRenderer) => set({ selectedRenderer }),
  setFps: (fps) => set({ fps }),
  setTelemetryEnabled: (enabled) => set({ telemetryEnabled: enabled }),
}))
