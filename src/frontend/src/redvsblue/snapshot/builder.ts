import type { TelemetryEvent, GameState, Team } from "@/redvsblue/types"

const majorTelemetryTypes = new Set(["ship_destroyed", "ship_spawned", "explosion", "bullet_hit"])

const normalizeMajorEvent = (event: TelemetryEvent) => {
  const data = event.data && typeof event.data === "object" ? event.data : undefined
  const typed = data as { team?: unknown; summary?: unknown } | undefined
  const team: Team | undefined = typed?.team === "red" || typed?.team === "blue" ? (typed.team as Team) : undefined
  const summary = typeof typed?.summary === "string" ? typed.summary : undefined
  return {
    type: event.type,
    timestamp: event.timestamp,
    team,
    summary,
  }
}

export type BuildSnapshotArgs = {
  snapshot: GameState | null | undefined
  snapshotId: string
  redCount: number
  blueCount: number
  telemetryEvents: TelemetryEvent[]
  requestDecision: boolean
  requestOverrides: boolean
}

export function buildSnapshotPayload(args: BuildSnapshotArgs) {
  const { snapshotId, redCount, blueCount, telemetryEvents, requestDecision, requestOverrides } = args
  const majorEvents = (telemetryEvents ?? []).filter((e) => majorTelemetryTypes.has(e.type)).map(normalizeMajorEvent)

  return {
    timestamp: snapshotId ? Date.now() : Date.now(),
    snapshotId,
    gameSummary: {
      redCount,
      blueCount,
      totalShips: redCount + blueCount,
    },
    counts: { red: redCount, blue: blueCount },
    recentMajorEvents: majorEvents,
    requestDecision,
    requestOverrides,
  }
}
