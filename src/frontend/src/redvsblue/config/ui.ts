import { DEFAULT_REDVSBLUE_CONFIG_VALUES } from "@copilot-playground/shared"

export type UIConfig = {
  snapshotIntervalMs: number
  toastTimeoutMs: number
  starsCount: number
  particleLifetimeMs: number
  particleRenderSize: number
  defaultCanvasWidth: number
  defaultCanvasHeight: number
  initialShipsPerTeam: number
}

export const DEFAULT_UI_CONFIG: UIConfig = {
  snapshotIntervalMs: DEFAULT_REDVSBLUE_CONFIG_VALUES.snapshotIntervalMs,
  toastTimeoutMs: 4_500,
  starsCount: 150,
  particleLifetimeMs: 33.33,
  particleRenderSize: 2,
  defaultCanvasWidth: 800,
  defaultCanvasHeight: 600,
  initialShipsPerTeam: 25,
}

export default DEFAULT_UI_CONFIG
