import React from "react"

type RedVsBlueControlsProps = {
  onSpawnRed: () => void
  onSpawnBlue: () => void
  onReset: () => void
  onAskCopilot: () => void
}

const RedVsBlueControls: React.FC<RedVsBlueControlsProps> = ({
  onSpawnRed,
  onSpawnBlue,
  onReset,
  onAskCopilot,
}) => (
  <div className="controls">
    <button className="btn-red" onClick={onSpawnRed}>
      +1 RED
    </button>
    <button className="btn-blue" onClick={onSpawnBlue}>
      +1 BLUE
    </button>
    <button className="btn-reset" onClick={onReset}>
      RESET
    </button>
    <button className="btn-copilot" onClick={onAskCopilot}>
      Ask Copilot
    </button>
  </div>
)

export default RedVsBlueControls
