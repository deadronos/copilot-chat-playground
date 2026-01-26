import { useCallback, useEffect, useRef, useState } from "react"

import { DEFAULT_ENGINE_CONFIG, DEFAULT_UI_CONFIG } from "@/redvsblue/config"
import { selectSnapshot, useGameState } from "@/redvsblue/stores/gameState"
import { useTelemetryStore } from "@/redvsblue/stores/telemetry"
import { useUIStore } from "@/redvsblue/stores/uiStore"
import type { GameState, TelemetryEvent, Team } from "@/redvsblue/types"
import type { SpawnShipsDecision } from "@/redvsblue/useAiDirector"
import { DEFAULT_REDVSBLUE_CONFIG_VALUES } from "@copilot-playground/shared"

export type MatchSnapshotPayload = {
  timestamp: number
  snapshotId: string
  gameSummary: {
    redCount: number
    blueCount: number
    totalShips: number
  }
  counts: {
    red: number
    blue: number
  }
  recentMajorEvents: Array<{
    type: string
    timestamp: number
    team?: Team
    summary?: string
  }>
  requestDecision: boolean
  requestOverrides: boolean
}

export type AskCopilotPayload = {
  question: string
  snapshot?: MatchSnapshotPayload
}

export type MatchStartResponse = {
  sessionId: string
  effectiveConfig?: {
    snapshotIntervalMs?: number
  }
}

export type MatchSnapshotResponse = {
  notificationText?: string
  validatedDecision?: SpawnShipsDecision
  decisionRejectedReason?: string
}

export type UseMatchSessionOptions = {
  redCount: number
  blueCount: number
  onToast: (message: string) => void
  applyValidatedDecision: (decision: SpawnShipsDecision) => void
  autoDecisionsInitial?: boolean
  snapshotIntervalMs?: number
  fetchFn?: typeof fetch
  matchId?: string
  createId?: () => string
  autoStart?: boolean
}

export type UseMatchSessionResult = {
  sessionId: string | null
  snapshotIntervalMs: number
  autoDecisionsEnabled: boolean
  handleAutoDecisionsToggle: (enabled: boolean) => void
  handleAskCopilot: () => Promise<void>
}

const createId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const DEFAULT_SNAPSHOT_INTERVAL_MS = DEFAULT_UI_CONFIG.snapshotIntervalMs

const buildSummary = (redCount: number, blueCount: number) => ({
  redCount,
  blueCount,
  totalShips: redCount + blueCount,
})

const majorTelemetryTypes = new Set(["ship_destroyed", "ship_spawned", "explosion", "bullet_hit"])

const normalizeMajorEvent = (event: TelemetryEvent) => {
  const data = event.data && typeof event.data === "object" ? event.data : undefined
  const typed = data as { team?: unknown; summary?: unknown } | undefined
  const team: Team | undefined =
    typed?.team === "red" || typed?.team === "blue" ? typed.team : undefined
  const summary = typeof typed?.summary === "string" ? typed.summary : undefined
  return {
    type: event.type,
    timestamp: event.timestamp,
    team,
    summary,
  }
}

export function useMatchSession(options: UseMatchSessionOptions): UseMatchSessionResult {
  const {
    redCount,
    blueCount,
    onToast,
    applyValidatedDecision,
    autoDecisionsInitial = false,
    snapshotIntervalMs: initialSnapshotIntervalMs,
    fetchFn,
    matchId,
    createId: createIdOverride,
    autoStart = true,
  } = options

  const fetcher = fetchFn ?? fetch
  const idFactory = createIdOverride ?? createId

  const matchIdRef = useRef<string>(matchId ?? idFactory())
  const latestSnapshotRef = useRef<GameState | null>(null)

  const [sessionId, setSessionId] = useState<string | null>(null)
  const [snapshotIntervalMs, setSnapshotIntervalMs] = useState(
    initialSnapshotIntervalMs ?? DEFAULT_SNAPSHOT_INTERVAL_MS
  )
  const [autoDecisionsEnabled, setAutoDecisionsEnabled] = useState(autoDecisionsInitial)

  const handleAutoDecisionsToggle = useCallback(
    (enabled: boolean) => {
      setAutoDecisionsEnabled(enabled)
      onToast(enabled ? "Auto-decisions enabled." : "Auto-decisions disabled.")
    },
    [onToast]
  )

  useEffect(() => {
    const unsubscribe = useGameState.subscribe(selectSnapshot, (snapshot) => {
      if (snapshot) {
        latestSnapshotRef.current = snapshot
      }
    })

    return () => {
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!autoStart) return
    const currentMatchId = matchIdRef.current
    let active = true

    const startMatch = async () => {
      try {
        const response = await fetcher("/api/redvsblue/match/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            matchId: currentMatchId,
            rulesVersion: "v1",
            proposedRules: {
              shipSpeed: DEFAULT_ENGINE_CONFIG.shipSpeed,
              bulletSpeed: DEFAULT_ENGINE_CONFIG.bulletSpeed,
              bulletDamage: DEFAULT_ENGINE_CONFIG.bulletDamage,
              shipMaxHealth: DEFAULT_ENGINE_CONFIG.shipMaxHealth,
            },
            clientConfig: {
              snapshotIntervalMs: DEFAULT_UI_CONFIG.snapshotIntervalMs,
            },
          }),
        })

        if (!response.ok) {
          const text = await response.text()
          throw new Error(text || "Failed to start match")
        }

        const data = (await response.json()) as MatchStartResponse
        if (!active) return
        setSessionId(data.sessionId)
        if (data.effectiveConfig?.snapshotIntervalMs) {
          setSnapshotIntervalMs(data.effectiveConfig.snapshotIntervalMs)
        }
      } catch (error) {
        if (!active) return
        const message = error instanceof Error ? error.message : "Failed to start match. Try reloading."
        onToast(message)
      }
    }

    void startMatch()

    return () => {
      active = false
      void fetcher(`/api/redvsblue/match/${currentMatchId}/end`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }).catch(() => undefined)
    }
  }, [autoStart, fetcher, onToast])

  useEffect(() => {
    if (!sessionId) return
    const currentMatchId = matchIdRef.current
    const intervalId = window.setInterval(() => {
      const snapshot = latestSnapshotRef.current
      if (!snapshot) return

      const payload: MatchSnapshotPayload = {
        timestamp: snapshot.timestamp,
        snapshotId: idFactory(),
        gameSummary: buildSummary(redCount, blueCount),
        counts: { red: redCount, blue: blueCount },
        recentMajorEvents: [],
        requestDecision: autoDecisionsEnabled,
        requestOverrides: useUIStore.getState().allowAIOverrides,
      }

      void (async () => {
        try {
          const response = await fetcher(`/api/redvsblue/match/${currentMatchId}/snapshot`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })

          if (!response.ok) return

          const data = (await response.json()) as MatchSnapshotResponse
          if (data.notificationText) {
            onToast(data.notificationText)
          }
          if (data.validatedDecision) {
            applyValidatedDecision(data.validatedDecision)
          } else if (data.decisionRejectedReason) {
            onToast(`AI Director rejected decision: ${data.decisionRejectedReason}`)
          }
        } catch {
          // ignore snapshot errors
        }
      })()
    }, snapshotIntervalMs)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [applyValidatedDecision, autoDecisionsEnabled, blueCount, fetcher, idFactory, onToast, redCount, sessionId, snapshotIntervalMs])

  const handleAskCopilot = useCallback(async () => {
    if (!sessionId) {
      onToast("Copilot director is not ready yet.")
      return
    }

    const currentMatchId = matchIdRef.current
    const snapshot = latestSnapshotRef.current
    const body: AskCopilotPayload = { question: "Status update" }

    if (snapshot) {
      const majorEvents = useTelemetryStore
        .getState()
        .peek()
        .filter((event) => majorTelemetryTypes.has(event.type))
        .slice(-20)
        .map((event) => normalizeMajorEvent(event))

      body.snapshot = {
        timestamp: snapshot.timestamp,
        snapshotId: idFactory(),
        gameSummary: buildSummary(redCount, blueCount),
        counts: { red: redCount, blue: blueCount },
        recentMajorEvents: majorEvents,
        requestDecision: DEFAULT_REDVSBLUE_CONFIG_VALUES.defaultAskRequestDecision,
        requestOverrides: useUIStore.getState().allowAIOverrides,
      }
    }

    try {
      const response = await fetcher(`/api/redvsblue/match/${currentMatchId}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || "Failed to fetch commentary")
      }

      const data = (await response.json()) as { commentary?: string }
      onToast(data.commentary ?? "Copilot is thinking about the match.")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to reach Copilot director."
      onToast(message)
    }
  }, [blueCount, fetcher, idFactory, onToast, redCount, sessionId])

  return {
    sessionId,
    snapshotIntervalMs,
    autoDecisionsEnabled,
    handleAutoDecisionsToggle,
    handleAskCopilot,
  }
}
