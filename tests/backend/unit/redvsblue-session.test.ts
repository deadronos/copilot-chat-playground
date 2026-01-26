import { describe, it, expect, vi } from "vitest"
import { createMatchSession, recordSnapshot } from "../../../src/backend/src/services/redvsblue/session.js"
import type { SnapshotPayload } from "../../../src/backend/src/services/redvsblue-types.js"

function createSnapshot(id: number): SnapshotPayload {
  return {
    timestamp: Date.now() + id,
    snapshotId: `snap-${id}`,
    gameSummary: {
      redCount: id,
      blueCount: id + 1,
      totalShips: id * 2 + 1,
    },
    counts: {
      red: id,
      blue: id + 1,
    },
    recentMajorEvents: [],
  }
}

describe("redvsblue session helpers", () => {
  it("caps snapshot buffer and updates timestamps when recording", () => {
    const session = createMatchSession({
      matchId: "match-1",
      sessionId: "session-1",
      rulesVersion: "v1",
      proposedRules: {},
      clientConfig: {},
      now: 100,
    })

    session.snapshots = Array.from({ length: 120 }, (_, index) => createSnapshot(index))

    const nowSpy = vi.spyOn(Date, "now").mockReturnValue(2000)
    recordSnapshot(session, createSnapshot(121))
    nowSpy.mockRestore()

    expect(session.snapshots.length).toBeLessThanOrEqual(120)
    expect(session.updatedAt).toBe(2000)
  })
})
