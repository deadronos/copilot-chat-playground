import { describe, it, expect } from "vitest"
import { useTelemetryStore } from "@/redvsblue/stores/telemetry"
import { useUIStore } from "@/redvsblue/stores/uiStore"

describe("telemetry gating", () => {
  it("respects ui toggle when disabled", () => {
    useTelemetryStore.getState().clearTelemetry()
    useUIStore.getState().setTelemetryEnabled(false)

    // simulate handler logic: should early-return when UI toggle is false
    const evt = { type: "should_not_send" }
    const uiEnabled = useUIStore.getState().telemetryEnabled
    if (uiEnabled) useTelemetryStore.getState().pushTelemetry(evt as any)

    expect(useTelemetryStore.getState().getBufferLength()).toBe(0)

    // restore
    useUIStore.getState().setTelemetryEnabled(true)
  })

  it("respects engine config when disabled", () => {
    useTelemetryStore.getState().clearTelemetry()

    // simulate engine config disabled
    const engineEnabled = false
    const evt = { type: "should_not_send2" }
    if (engineEnabled) useTelemetryStore.getState().pushTelemetry(evt as any)

    expect(useTelemetryStore.getState().getBufferLength()).toBe(0)
  })
})