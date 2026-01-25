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
  snapshotIntervalMs: 2_000,
  toastTimeoutMs: 4_500,
  starsCount: 150,
  particleLifetimeMs: 33.33,
  particleRenderSize: 2,
  defaultCanvasWidth: 800,
  defaultCanvasHeight: 600,
  initialShipsPerTeam: 2,
}

export default DEFAULT_UI_CONFIG
