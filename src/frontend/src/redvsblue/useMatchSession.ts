import { useCallback, useEffect, useRef, useState } from "react"

import { DEFAULT_ENGINE_CONFIG, DEFAULT_UI_CONFIG } from "@/redvsblue/config"
import { selectSnapshot, useGameState } from "@/redvsblue/stores/gameState"
import { useTelemetryStore } from "@/redvsblue/stores/telemetry"
import { useUIStore } from "@/redvsblue/stores/uiStore"
import * as MatchApi from "@/redvsblue/api/match"
import { buildSnapshotPayload } from "@/redvsblue/snapshot/builder"
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


const readMatchRefreshBody = (value: unknown): { errorCode?: string; actions?: string[]; shouldRefresh?: boolean } => {
  if (!value || typeof value !== "object") return {}
  const record = value as Record<string, unknown>
  return {
    errorCode: typeof record.errorCode === "string" ? record.errorCode : undefined,
    actions: Array.isArray(record.actions) ? record.actions.filter((item): item is string => typeof item === "string") : undefined,
    shouldRefresh: typeof record.shouldRefresh === "boolean" ? record.shouldRefresh : undefined,
  }
}

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

  const restartAttemptsRef = useRef(0)
  const MAX_RESTARTS = 3

  const startMatchInternal = useCallback(async (opts?: { action?: string }): Promise<boolean> => {
    const currentMatchId = matchIdRef.current
    try {
      const res = await MatchApi.startMatch(
        {
          matchId: currentMatchId,
          rulesVersion: "v1",
          proposedRules: {
            shipSpeed: DEFAULT_ENGINE_CONFIG.shipSpeed,
            bulletSpeed: DEFAULT_ENGINE_CONFIG.bulletSpeed,
            bulletDamage: DEFAULT_ENGINE_CONFIG.bulletDamage,
            shipMaxHealth: DEFAULT_ENGINE_CONFIG.shipMaxHealth,
          },
          clientConfig: { snapshotIntervalMs: DEFAULT_UI_CONFIG.snapshotIntervalMs },
        },
        fetcher,
        opts?.action ? { headers: { "X-Action": opts.action } } : undefined
      )

      if (!res.ok) {
        throw new Error(res.error || "Failed to start match")
      }

      const data = res.data
      setSessionId(data.sessionId)
      if (data.effectiveConfig?.snapshotIntervalMs) {
        setSnapshotIntervalMs(data.effectiveConfig.snapshotIntervalMs)
      }
      // successful start -> reset attempts
      restartAttemptsRef.current = 0
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to start match. Try reloading."
      onToast(message)
      restartAttemptsRef.current += 1
      return false
    }
  }, [fetcher, onToast])

  useEffect(() => {
    if (!autoStart) return
    let active = true
    const currentMatchId = matchIdRef.current
    void (async () => {
      if (!active) return
      await startMatchInternal()
    })()

    return () => {
      active = false
      void fetcher(`/api/redvsblue/match/${currentMatchId}/end`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }).catch(() => undefined)
    }
  }, [autoStart, fetcher, onToast, startMatchInternal])

  useEffect(() => {
    if (!sessionId) return
    const currentMatchId = matchIdRef.current
    const intervalId = window.setInterval(() => {
      const snapshot = latestSnapshotRef.current
      if (!snapshot) return

      const telemetryEvents = useTelemetryStore.getState().peek().slice(-20)
      const payload = buildSnapshotPayload({
        snapshot,
        snapshotId: idFactory(),
        redCount,
        blueCount,
        telemetryEvents,
        requestDecision: autoDecisionsEnabled,
        requestOverrides: useUIStore.getState().allowAIOverrides,
      })

      void (async () => {
        try {
          const res = await MatchApi.sendSnapshot(currentMatchId, payload, fetcher)
          if (!res.ok) {
            // Detect server instructions for a match refresh
            const body = readMatchRefreshBody(res.body)
            const isMatchNotFound = res.status === 404 && (body.errorCode === "MATCH_NOT_FOUND" || body.actions?.includes("refresh_match") || body.shouldRefresh)
            if (isMatchNotFound) {
              onToast("Match session lost. Attempting to rejoin...")
              setSessionId(null)
              if (restartAttemptsRef.current >= MAX_RESTARTS) {
                onToast("Failed to rejoin match automatically. Please reload the page.")
                return
              }
              const ok = await startMatchInternal({ action: "refresh_match" })
              if (!ok) {
                // schedule a retry with modest backoff
                setTimeout(() => {
                  void startMatchInternal({ action: "refresh_match" })
                }, 1000 * Math.min(5, restartAttemptsRef.current))
              }
            }
            return
          }
          const data = res.data as MatchSnapshotResponse
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
  }, [applyValidatedDecision, autoDecisionsEnabled, blueCount, fetcher, idFactory, onToast, redCount, sessionId, snapshotIntervalMs, startMatchInternal])

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
      const res = await MatchApi.ask(currentMatchId, body, fetcher)
      if (!res.ok) {
        throw new Error(res.error || "Failed to fetch commentary")
      }
      const data = res.data as { commentary?: string }
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
