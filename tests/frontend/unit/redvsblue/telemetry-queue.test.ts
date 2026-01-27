import { describe, it, expect } from "vitest"
import { useTelemetryStore } from "@/redvsblue/stores/telemetry"
import { TelemetryQueue } from "@/redvsblue/telemetry/queue"

describe("TelemetryQueue", () => {
  it("drains and requeues at head preserving order", () => {
    useTelemetryStore.getState().clearTelemetry()

    useTelemetryStore.getState().pushTelemetry({ type: "a" } as any)
    useTelemetryStore.getState().pushTelemetry({ type: "b" } as any)
    useTelemetryStore.getState().pushTelemetry({ type: "c" } as any)

    const drained = TelemetryQueue.drain(2)
    expect(drained.map((d) => d.type)).toEqual(["a", "b"])

    // requeue the drained batch at head
    TelemetryQueue.requeueAtHead(drained)

    // Now buffer should contain [a,b,c] again
    const all = TelemetryQueue.peek()
    expect(all.map((d) => d.type)).toEqual(["a", "b", "c"])
  })
})
