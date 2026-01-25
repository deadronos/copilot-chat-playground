import React from "react"

type RedVsBlueControlsProps = {
  onSpawnRed: () => void
  onSpawnBlue: () => void
  onReset: () => void
  onAskCopilot: () => void
  autoDecisionsEnabled: boolean
  onToggleAutoDecisions: (enabled: boolean) => void
  allowAIOverrides: boolean
  onToggleAllowAIOverrides: (enabled: boolean) => void
}

const RedVsBlueControls: React.FC<RedVsBlueControlsProps> = ({
  onSpawnRed,
  onSpawnBlue,
  onReset,
  onAskCopilot,
  autoDecisionsEnabled,
  onToggleAutoDecisions,
  allowAIOverrides,
  onToggleAllowAIOverrides,
}) => (
  <div className="controls">
    <div className="controls-inner">
      <div className="control-buttons">
        <button className="btn-red" onClick={onSpawnRed} aria-label="Spawn red ship">
          +1 RED
        </button>
        <button className="btn-blue" onClick={onSpawnBlue} aria-label="Spawn blue ship">
          +1 BLUE
        </button>
        <button className="btn-reset" onClick={onReset} aria-label="Reset simulation">
          RESET
        </button>
        <button className="btn-copilot" onClick={onAskCopilot} aria-label="Ask Copilot">
          Ask Copilot
        </button>
      </div>

      <div className="control-toggles">
        <label className="auto-decisions-toggle">
          <input
            type="checkbox"
            checked={autoDecisionsEnabled}
            onChange={(event) => onToggleAutoDecisions(event.target.checked)}
          />
          Auto-decisions
        </label>

        <label className="allow-overrides-toggle">
          <input
            type="checkbox"
            checked={allowAIOverrides}
            onChange={(event) => onToggleAllowAIOverrides(event.target.checked)}
          />
          Allow AI overrides
        </label>
      </div>
    </div>
  </div>
)

export default RedVsBlueControls
