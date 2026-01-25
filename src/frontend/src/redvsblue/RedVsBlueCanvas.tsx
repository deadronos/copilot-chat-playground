import React, { useState } from "react"
import type { RefObject } from "react"

type RedVsBlueCanvasProps = {
  canvasRef: RefObject<HTMLCanvasElement | null>
  rendererKey: string
}

const RedVsBlueCanvas: React.FC<RedVsBlueCanvasProps> = ({ canvasRef, rendererKey }) => {
  // Ensures a fresh <canvas> element per mount (important for OffscreenCanvas + React StrictMode).
  const [canvasInstanceKey] = useState(() => `${Date.now()}-${Math.random().toString(36).slice(2)}`)

  return <canvas key={`${rendererKey}-${canvasInstanceKey}`} ref={canvasRef} id="gameCanvas" />
}

export default RedVsBlueCanvas
