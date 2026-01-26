import React from "react"
import { render, act } from "@testing-library/react"
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest"

import { useMatchSession, type UseMatchSessionResult } from "@/redvsblue/useMatchSession"
import { useGameState } from "@/redvsblue/stores/gameState"
import { useTelemetryStore } from "@/redvsblue/stores/telemetry"
import { useUIStore } from "@/redvsblue/stores/uiStore"
import type { GameState } from "@/redvsblue/types"

const baseSnapshot: GameState = {
  ships: [],
  bullets: [],
  particles: [],
  stars: [],
  timestamp: 1000,
}

type HarnessProps = {
  onChange: (result: UseMatchSessionResult) => void
  options: Parameters<typeof useMatchSession>[0]
}

const MatchHarness = ({ onChange, options }: HarnessProps) => {
  const result = useMatchSession(options)
  React.useEffect(() => {
    onChange(result)
  }, [onChange, result])
  return null
}

const mockResponse = (body: unknown, ok = true) =>
  ({
    ok,
    json: async () => body,
    text: async () => (typeof body === "string" ? body : JSON.stringify(body)),
  }) as Response

async function flush(): Promise<void> {
  await Promise.resolve()
}

describe("useMatchSession", () => {
  beforeEach(() => {
    useGameState.getState().clear()
    useTelemetryStore.getState().clearTelemetry()
    useUIStore.setState({ allowAIOverrides: true })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it("starts a match and applies effective snapshot interval", async () => {
    const onToast = vi.fn()
    const applyValidatedDecision = vi.fn()

    const fetchMock = vi.fn(async (input: RequestInfo) => {
      const url = String(input)
      if (url.endsWith("/start")) {
        return mockResponse({ sessionId: "session-1", effectiveConfig: { snapshotIntervalMs: 250 } })
      }
      return mockResponse({})
    })

    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch)

    let lastResult: UseMatchSessionResult | null = null
    render(
      <MatchHarness
        onChange={(result) => { lastResult = result }}
        options={{
          redCount: 2,
          blueCount: 3,
          onToast,
          applyValidatedDecision,
          matchId: "match-1",
          createId: () => "snapshot-1",
        }}
      />
    )

    await act(async () => {
      await flush()
    })

    expect(fetchMock).toHaveBeenCalled()
    const startCall = fetchMock.mock.calls.find((call) => String(call[0]).endsWith("/start"))
    expect(startCall).toBeTruthy()
    const startPayload = JSON.parse((startCall?.[1] as RequestInit)?.body as string)
    expect(startPayload.matchId).toBe("match-1")

    expect(lastResult?.sessionId).toBe("session-1")
    expect(lastResult?.snapshotIntervalMs).toBe(250)
  })

  it("posts snapshots and applies validated decisions", async () => {
    vi.useFakeTimers()
    const onToast = vi.fn()
    const applyValidatedDecision = vi.fn()

    const fetchMock = vi.fn(async (input: RequestInfo) => {
      const url = String(input)
      if (url.endsWith("/start")) {
        return mockResponse({ sessionId: "session-2", effectiveConfig: { snapshotIntervalMs: 100 } })
      }
      if (url.includes("/snapshot")) {
        return mockResponse({
          validatedDecision: {
            requestId: "req-1",
            type: "spawnShips",
            params: { team: "red", count: 1 },
          },
        })
      }
      return mockResponse({})
    })

    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch)

    let lastResult: UseMatchSessionResult | null = null
    render(
      <MatchHarness
        onChange={(result) => { lastResult = result }}
        options={{
          redCount: 1,
          blueCount: 1,
          onToast,
          applyValidatedDecision,
          matchId: "match-2",
          createId: () => "snapshot-2",
        }}
      />
    )

    await act(async () => {
      await flush()
    })

    useGameState.getState().setSnapshot(baseSnapshot)

    await act(async () => {
      vi.advanceTimersByTime(100)
      await flush()
    })

    expect(lastResult?.sessionId).toBe("session-2")
    expect(applyValidatedDecision).toHaveBeenCalledWith({
      requestId: "req-1",
      type: "spawnShips",
      params: { team: "red", count: 1 },
    })

    const snapshotCall = fetchMock.mock.calls.find((call) => String(call[0]).includes("/snapshot"))
    expect(snapshotCall).toBeTruthy()
    const snapshotPayload = JSON.parse((snapshotCall?.[1] as RequestInit)?.body as string)
    expect(snapshotPayload.snapshotId).toBe("snapshot-2")
  })

  it("asks Copilot with filtered telemetry events", async () => {
    const onToast = vi.fn()
    const applyValidatedDecision = vi.fn()

    const fetchMock = vi.fn(async (input: RequestInfo) => {
      const url = String(input)
      if (url.endsWith("/start")) {
        return mockResponse({ sessionId: "session-3" })
      }
      if (url.includes("/ask")) {
        return mockResponse({ commentary: "Status: steady" })
      }
      return mockResponse({})
    })

    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch)

    let lastResult: UseMatchSessionResult | null = null
    render(
      <MatchHarness
        onChange={(result) => { lastResult = result }}
        options={{
          redCount: 4,
          blueCount: 5,
          onToast,
          applyValidatedDecision,
          matchId: "match-3",
          createId: () => "snapshot-3",
        }}
      />
    )

    await act(async () => {
      await flush()
    })

    useGameState.getState().setSnapshot(baseSnapshot)
    useTelemetryStore.getState().pushTelemetry({
      type: "ship_spawned",
      timestamp: 123,
      data: { team: "red", summary: "spawned" },
    })
    useTelemetryStore.getState().pushTelemetry({
      type: "minor_event",
      timestamp: 124,
    })

    await act(async () => {
      await lastResult!.handleAskCopilot()
    })

    const askCall = fetchMock.mock.calls.find((call) => String(call[0]).includes("/ask"))
    expect(askCall).toBeTruthy()
    const askPayload = JSON.parse((askCall?.[1] as RequestInit)?.body as string)
    expect(askPayload.snapshot.snapshotId).toBe("snapshot-3")
    expect(askPayload.snapshot.recentMajorEvents).toHaveLength(1)
    expect(askPayload.snapshot.recentMajorEvents[0].team).toBe("red")
    expect(onToast).toHaveBeenCalledWith("Status: steady")
  })
})
