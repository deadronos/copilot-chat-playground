import React from "react"
import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"

import RedVsBlue from "@/redvsblue/RedVsBlue"

vi.mock("@/redvsblue/useGame", () => ({
  useGame: () => ({
    spawnShip: vi.fn(),
    reset: vi.fn(),
  }),
}))

vi.mock("@/redvsblue/useToast", () => ({
  useToast: () => ({
    toast: "Match ready",
    showToast: vi.fn(),
  }),
}))

vi.mock("@/redvsblue/useAiDirector", () => ({
  useAiDirector: () => ({
    applyValidatedDecision: vi.fn(),
    aiOverrideMessage: "AI applied: shipSpeed=2",
  }),
}))

vi.mock("@/redvsblue/useMatchSession", () => ({
  useMatchSession: () => ({
    autoDecisionsEnabled: false,
    handleAutoDecisionsToggle: vi.fn(),
    handleAskCopilot: vi.fn(),
  }),
}))

vi.mock("@/redvsblue/TelemetryConnector", () => ({
  TelemetryConnectorReact: () => null,
}))

vi.mock("@/redvsblue/RedVsBlueCanvas", () => ({
  default: () => <div data-testid="rvb-canvas" />,
}))

vi.mock("@/redvsblue/RedVsBlueControls", () => ({
  default: () => <div data-testid="rvb-controls" />,
}))

vi.mock("@/redvsblue/RedVsBlueStyles", () => ({
  default: () => null,
}))

vi.mock("@/redvsblue/RedVsBlueHud", () => ({
  default: ({ aiOverrideMessage }: { aiOverrideMessage?: string | null }) => (
    <div data-testid="rvb-hud">{aiOverrideMessage ?? ""}</div>
  ),
}))

describe("RedVsBlue", () => {
  it("renders toast and AI override messaging", () => {
    render(<RedVsBlue />)

    expect(screen.getByText("Match ready")).toBeTruthy()
    expect(screen.getByTestId("rvb-hud").textContent).toContain("AI applied: shipSpeed=2")
    expect(screen.getByTestId("rvb-controls")).toBeTruthy()
    expect(screen.getByTestId("rvb-canvas")).toBeTruthy()
  })
})
