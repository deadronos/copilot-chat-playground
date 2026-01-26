import { describe, it, expect } from "vitest"
import { buildSnapshotPayload } from "@/redvsblue/snapshot/builder"

import type { TelemetryEvent, GameState } from "@/redvsblue/types"

describe("buildSnapshotPayload", () => {
  it("normalizes major telemetry events and includes flags", () => {
    const gameState: GameState = {
      ships: [],
      bullets: [],
      particles: [],
      stars: [],
      timestamp: 12345,
    }

    const telemetry: TelemetryEvent[] = [
      { type: "ship_destroyed", timestamp: 1, data: { team: "red", summary: "boom" } },
      { type: "heartbeat", timestamp: 2 },
      { type: "bullet_hit", timestamp: 3, data: { team: "blue", summary: "hit" } }
    ]

    const payload = buildSnapshotPayload({
      snapshot: gameState,
      snapshotId: "snap-1",
      redCount: 2,
      blueCount: 3,
      telemetryEvents: telemetry,
      requestDecision: true,
      requestOverrides: false,
    })

    expect(payload.gameSummary).toEqual({ redCount: 2, blueCount: 3, totalShips: 5 })
    expect(payload.counts).toEqual({ red: 2, blue: 3 })
    expect(payload.requestDecision).toBe(true)
    expect(payload.requestOverrides).toBe(false)

    expect(payload.recentMajorEvents.length).toBe(2)
    expect(payload.recentMajorEvents[0]).toEqual({ type: "ship_destroyed", timestamp: 1, team: "red", summary: "boom" })
    expect(payload.recentMajorEvents[1]).toEqual({ type: "bullet_hit", timestamp: 3, team: "blue", summary: "hit" })
  })
})
