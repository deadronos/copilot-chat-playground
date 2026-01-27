import { useCallback, useEffect, useRef, useState } from "react"

import type { Team } from "@/redvsblue/types"

export type ShipOverrides = Partial<{
  shipSpeed: number
  bulletSpeed: number
  bulletDamage: number
  shipMaxHealth: number
}>

export type SpawnShipsDecision = {
  requestId: string
  type: "spawnShips"
  params: {
    team: Team
    count: number
    overrides?: ShipOverrides
  }
  warnings?: string[]
}

export type UseAiDirectorOptions = {
  spawnShip: (team: Team, overrides?: ShipOverrides) => void
  onToast: (message: string) => void
  overrideTimeoutMs?: number
}

export type UseAiDirectorResult = {
  applyValidatedDecision: (decision: SpawnShipsDecision) => void
  aiOverrideMessage: string | null
}

export function useAiDirector(options: UseAiDirectorOptions): UseAiDirectorResult {
  const { spawnShip, onToast, overrideTimeoutMs = 6000 } = options

  const [aiOverrideMessage, setAiOverrideMessage] = useState<string | null>(null)
  const timeoutRef = useRef<number | null>(null)

  const applyValidatedDecision = useCallback(
    (decision: SpawnShipsDecision) => {
      if (decision.type !== "spawnShips") return

      for (let i = 0; i < decision.params.count; i += 1) {
        spawnShip(decision.params.team, decision.params.overrides)
      }

      if (decision.warnings && decision.warnings.length > 0) {
        onToast(`AI Director warning: ${decision.warnings.join("; ")}`)
      }

      const overrides = decision.params.overrides
      if (overrides && Object.keys(overrides).length > 0) {
        const parts: string[] = []
        for (const [key, value] of Object.entries(overrides)) {
          if (value !== undefined && value !== null) {
            parts.push(`${key}=${value}`)
          }
        }
        const message = `AI applied: ${parts.join(", ")}`
        setAiOverrideMessage(message)
        if (timeoutRef.current) {
          window.clearTimeout(timeoutRef.current)
        }
        timeoutRef.current = window.setTimeout(() => {
          setAiOverrideMessage(null)
          timeoutRef.current = null
        }, overrideTimeoutMs)
      }
    },
    [onToast, overrideTimeoutMs, spawnShip]
  )

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return { applyValidatedDecision, aiOverrideMessage }
}
