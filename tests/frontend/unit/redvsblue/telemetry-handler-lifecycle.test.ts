import { describe, it, expect } from "vitest"
import { createEngine } from "@/redvsblue/engine"
import { useTelemetryStore } from "@/redvsblue/stores/telemetry"

describe("telemetry handler lifecycle", () => {
  it("registering twice replaces previous handler (no duplicates)", () => {
    useTelemetryStore.getState().clearTelemetry()
    const engine = createEngine()

    let telemetryHandler: ((data: unknown) => void) | null = null

    const register = (tag: string) => {
      if (telemetryHandler) engine.off("telemetry", telemetryHandler)
      telemetryHandler = (data: unknown) => {
        useTelemetryStore.getState().pushTelemetry({ type: (data as any).type, data: { tag } } as any)
      }
      engine.on("telemetry", telemetryHandler)
    }

    register("first")
    register("second")

    engine.emit("telemetry", { type: "lifecycle_test" })

    const buf = useTelemetryStore.getState().telemetryBuffer
    expect(buf.length).toBe(1)
    expect((buf[0].data as any).tag).toBe("second")

    engine.destroy()
  })

  it("unregister removes handler and stops receiving events", () => {
    useTelemetryStore.getState().clearTelemetry()
    const engine = createEngine()

    const handler = (data: unknown) => {
      useTelemetryStore.getState().pushTelemetry(data as any)
    }
    engine.on("telemetry", handler)
    engine.emit("telemetry", { type: "x" })
    expect(useTelemetryStore.getState().getBufferLength()).toBe(1)

    engine.off("telemetry", handler)
    engine.emit("telemetry", { type: "y" })
    expect(useTelemetryStore.getState().getBufferLength()).toBe(1)

    engine.destroy()
  })
})