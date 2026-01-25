import React from "react"

type RedVsBlueHudProps = {
  redCount: number
  blueCount: number
  aiOverrideMessage?: string | null
}

const RedVsBlueHud: React.FC<RedVsBlueHudProps> = ({ redCount, blueCount, aiOverrideMessage }) => (
  <div className="top-bar">
    <div className="stat">
      <div className="stat-label">Red Ships</div>
      <div className="stat-value red" aria-live="polite">{redCount}</div>
    </div>

    <div className="stat">
      <div className="stat-label">Blue Ships</div>
      <div className="stat-value blue" aria-live="polite">{blueCount}</div>
    </div>

    {aiOverrideMessage && (
      <div className="ai-override-hud" role="status" aria-live="polite">{aiOverrideMessage}</div>
    )}
  </div>
)

export default RedVsBlueHud
