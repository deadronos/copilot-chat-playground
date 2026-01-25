import React from "react"

type RedVsBlueHudProps = {
  redCount: number
  blueCount: number
  aiOverrideMessage?: string | null
}

const RedVsBlueHud: React.FC<RedVsBlueHudProps> = ({ redCount, blueCount, aiOverrideMessage }) => (
  <div className="top-bar">
    <div className="red-text">
      RED SHIPS: <span>{redCount}</span>
    </div>
    <div className="blue-text">
      BLUE SHIPS: <span>{blueCount}</span>
    </div>
    {aiOverrideMessage && (
      <div className="ai-override-hud" role="status" aria-live="polite">{aiOverrideMessage}</div>
    )}
  </div>
)

export default RedVsBlueHud
