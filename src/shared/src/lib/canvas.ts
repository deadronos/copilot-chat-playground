export type CanvasSizeTarget = {
  width: number
  height: number
}

export function applyCanvasSize(
  canvas: CanvasSizeTarget,
  width: number,
  height: number
): void {
  const nextWidth = Math.max(1, Math.floor(width))
  const nextHeight = Math.max(1, Math.floor(height))
  if (canvas.width !== nextWidth) canvas.width = nextWidth
  if (canvas.height !== nextHeight) canvas.height = nextHeight
}
