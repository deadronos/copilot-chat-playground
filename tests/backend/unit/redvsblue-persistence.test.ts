import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import type { MatchSession, PersistedMatchSession } from "../../../src/backend/src/services/redvsblue-types.js"

const fsMocks = vi.hoisted(() => ({
  promises: {
    writeFile: vi.fn(),
    unlink: vi.fn(),
  },
  readdirSync: vi.fn(),
  readFileSync: vi.fn(),
  mkdirSync: vi.fn(),
}))

vi.mock("node:fs", () => ({
  default: fsMocks,
  promises: fsMocks.promises,
  readdirSync: fsMocks.readdirSync,
  readFileSync: fsMocks.readFileSync,
  mkdirSync: fsMocks.mkdirSync,
}))

import {
  loadPersistedSessions,
  persistMatchSession,
  removePersistedSession,
} from "../../../src/backend/src/services/redvsblue/persistence.js"

function createSession(overrides: Partial<MatchSession> = {}): MatchSession {
  return {
    matchId: "match-1",
    sessionId: "session-1",
    rulesVersion: "v1",
    effectiveRules: {
      shipSpeed: 5,
      bulletSpeed: 8,
      bulletDamage: 10,
      shipMaxHealth: 30,
    },
    effectiveConfig: {
      snapshotIntervalMs: 10_000,
    },
    warnings: [],
    snapshots: [],
    decisionState: {
      lastDecisionAt: null,
      recentSpawns: [],
      appliedDecisionIds: new Set(),
    },
    decisionHistory: [],
    strategicSummary: null,
    summaryUpdatedAt: null,
    lastCompactionAt: null,
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  }
}

describe("redvsblue persistence helpers", () => {
  const originalDir = process.env.REDVSBLUE_PERSIST_DIR

  beforeEach(() => {
    process.env.REDVSBLUE_PERSIST_DIR = "/tmp/redvsblue-tests"
    fsMocks.promises.writeFile.mockReset()
    fsMocks.promises.unlink.mockReset()
    fsMocks.readdirSync.mockReset()
    fsMocks.readFileSync.mockReset()
    fsMocks.mkdirSync.mockReset()
  })

  afterEach(() => {
    if (originalDir === undefined) {
      delete process.env.REDVSBLUE_PERSIST_DIR
    } else {
      process.env.REDVSBLUE_PERSIST_DIR = originalDir
    }
  })

  it("persists sessions as JSON", async () => {
    fsMocks.promises.writeFile.mockResolvedValue(undefined)
    const session = createSession()

    await persistMatchSession(session)

    expect(fsMocks.mkdirSync).toHaveBeenCalledWith("/tmp/redvsblue-tests", { recursive: true })
    expect(fsMocks.promises.writeFile).toHaveBeenCalled()
    const [, payload] = fsMocks.promises.writeFile.mock.calls[0]
    const parsed = JSON.parse(payload) as PersistedMatchSession
    expect(parsed.matchId).toBe(session.matchId)
    expect(parsed.decisionState.appliedDecisionIds).toEqual([])
  })

  it("loads persisted sessions and deserializes decision state", () => {
    const persisted: PersistedMatchSession = {
      ...createSession(),
      decisionState: { lastDecisionAt: null, recentSpawns: [], appliedDecisionIds: ["a"] },
    }

    fsMocks.readdirSync.mockReturnValue([
      { name: "match-1.json", isFile: () => true },
      { name: "ignore.txt", isFile: () => true },
    ])
    fsMocks.readFileSync.mockReturnValue(JSON.stringify(persisted))

    const sessions = loadPersistedSessions()

    expect(sessions).toHaveLength(1)
    expect(sessions[0].decisionState.appliedDecisionIds.has("a")).toBe(true)
  })

  it("ignores ENOENT when removing persisted sessions", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
    fsMocks.promises.unlink.mockRejectedValue({ code: "ENOENT" })

    await removePersistedSession("match-1")

    expect(warnSpy).not.toHaveBeenCalled()
    warnSpy.mockRestore()
  })
})
