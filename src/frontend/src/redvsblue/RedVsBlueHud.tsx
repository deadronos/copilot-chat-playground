import React from "react"

type RedVsBlueHudProps = {
  redCount: number
  blueCount: number
}

const RedVsBlueHud: React.FC<RedVsBlueHudProps> = ({ redCount, blueCount }) => (
  <div className="top-bar">
    <div className="red-text">
      RED SHIPS: <span>{redCount}</span>
    </div>
    <div className="blue-text">
      BLUE SHIPS: <span>{blueCount}</span>
    </div>
  </div>
)

export default RedVsBlueHud
