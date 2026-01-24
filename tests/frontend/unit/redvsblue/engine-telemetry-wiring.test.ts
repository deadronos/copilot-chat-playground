import { describe, it, expect } from "vitest"

import { createEngine } from "@/redvsblue/engine"
import { useTelemetryStore } from "@/redvsblue/stores/telemetry"

describe("engine -> telemetry store wiring", () => {
  it("engine emits telemetry and listener pushes to telemetry store", () => {
    useTelemetryStore.getState().clearTelemetry()
    const engine = createEngine()
    const handler = (data: unknown) => {
      useTelemetryStore.getState().pushTelemetry(data as any)
    }
    engine.on("telemetry", handler)

    engine.emit("telemetry", { type: "unit_test_event" })

    const buf = useTelemetryStore.getState().telemetryBuffer
    expect(buf.length).toBe(1)
    expect(buf[0].type).toBe("unit_test_event")

    engine.off("telemetry", handler)
    engine.destroy()
  })
})