import React from "react"
import { render, screen, act } from "@testing-library/react"
import { describe, it, expect, vi, afterEach } from "vitest"

import type { ShipOverrides } from "@/redvsblue/useAiDirector"
import type { Team } from "@/redvsblue/types"
import { useAiDirector } from "@/redvsblue/useAiDirector"

type HarnessApi = {
  applyValidatedDecision: ReturnType<typeof useAiDirector>["applyValidatedDecision"]
}

const AiDirectorHarness = ({
  onReady,
  spawnShip,
  onToast,
  overrideTimeoutMs = 500,
}: {
  onReady: (api: HarnessApi) => void
  spawnShip: (team: Team, overrides?: ShipOverrides) => void
  onToast: (message: string) => void
  overrideTimeoutMs?: number
}) => {
  const { applyValidatedDecision, aiOverrideMessage } = useAiDirector({
    spawnShip,
    onToast,
    overrideTimeoutMs,
  })

  React.useEffect(() => {
    onReady({ applyValidatedDecision })
  }, [applyValidatedDecision, onReady])

  return <div data-testid="override">{aiOverrideMessage ?? ""}</div>
}

describe("useAiDirector", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it("spawns ships and emits warnings", () => {
    const spawnShip = vi.fn()
    const onToast = vi.fn()
    let api: HarnessApi | null = null

    render(
      <AiDirectorHarness
        onReady={(value) => { api = value }}
        spawnShip={spawnShip}
        onToast={onToast}
        overrideTimeoutMs={1000}
      />
    )

    act(() => {
      api!.applyValidatedDecision({
        requestId: "req-1",
        type: "spawnShips",
        params: {
          team: "red",
          count: 2,
          overrides: { shipSpeed: 4 },
        },
        warnings: ["capped speed"],
      })
    })

    expect(spawnShip).toHaveBeenCalledTimes(2)
    expect(spawnShip).toHaveBeenCalledWith("red", { shipSpeed: 4 })
    expect(onToast).toHaveBeenCalledWith("AI Director warning: capped speed")
    expect(screen.getByTestId("override").textContent).toContain("AI applied: shipSpeed=4")
  })

  it("clears override message after timeout", () => {
    vi.useFakeTimers()
    const spawnShip = vi.fn()
    const onToast = vi.fn()
    let api: HarnessApi | null = null

    render(
      <AiDirectorHarness
        onReady={(value) => { api = value }}
        spawnShip={spawnShip}
        onToast={onToast}
        overrideTimeoutMs={200}
      />
    )

    act(() => {
      api!.applyValidatedDecision({
        requestId: "req-2",
        type: "spawnShips",
        params: {
          team: "blue",
          count: 1,
          overrides: { bulletDamage: 3 },
        },
      })
    })

    expect(screen.getByTestId("override").textContent).toContain("AI applied: bulletDamage=3")

    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(screen.getByTestId("override").textContent).toBe("")
  })
})
