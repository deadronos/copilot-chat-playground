import React from "react"

type RedVsBlueControlsProps = {
  onSpawnRed: () => void
  onSpawnBlue: () => void
  onReset: () => void
}

const RedVsBlueControls: React.FC<RedVsBlueControlsProps> = ({
  onSpawnRed,
  onSpawnBlue,
  onReset,
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
  </div>
)

export default RedVsBlueControls
