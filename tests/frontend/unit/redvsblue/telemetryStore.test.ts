import { beforeEach, describe, expect, it, vi } from "vitest"

import { useTelemetryStore } from "@/redvsblue/stores/telemetry"

describe("redvsblue/telemetry store", () => {
  beforeEach(() => {
    useTelemetryStore.setState({
      telemetryBuffer: [],
      maxBufferSize: 100,
      pushTelemetry: useTelemetryStore.getState().pushTelemetry,
      drainTelemetry: useTelemetryStore.getState().drainTelemetry,
      peek: useTelemetryStore.getState().peek,
      clearTelemetry: useTelemetryStore.getState().clearTelemetry,
      getBufferLength: useTelemetryStore.getState().getBufferLength,
    })
  })

  it("pushTelemetry assigns id and timestamp when missing", () => {
    vi.setSystemTime(1_700_000_000_000)
    useTelemetryStore.getState().pushTelemetry({ type: "ship_spawned" })
    const buffer = useTelemetryStore.getState().telemetryBuffer
    expect(buffer.length).toBe(1)
    expect(buffer[0].id).toBeDefined()
    expect(buffer[0].timestamp).toBe(1_700_000_000_000)
    expect(buffer[0].type).toBe("ship_spawned")
  })

  it("drainTelemetry returns FIFO slice and removes them", () => {
    useTelemetryStore.getState().pushTelemetry({ type: "a" })
    useTelemetryStore.getState().pushTelemetry({ type: "b" })
    useTelemetryStore.getState().pushTelemetry({ type: "c" })

    const drained = useTelemetryStore.getState().drainTelemetry(2)
    expect(drained.map((e) => e.type)).toEqual(["a", "b"])
    expect(useTelemetryStore.getState().getBufferLength()).toBe(1)
    expect(useTelemetryStore.getState().telemetryBuffer[0].type).toBe("c")
  })

  it("peek returns copy without removing", () => {
    useTelemetryStore.getState().pushTelemetry({ type: "x" })
    useTelemetryStore.getState().pushTelemetry({ type: "y" })
    const peeked = useTelemetryStore.getState().peek(1)
    expect(peeked.map((e) => e.type)).toEqual(["x"])
    expect(useTelemetryStore.getState().getBufferLength()).toBe(2)
  })

  it("clearTelemetry empties buffer", () => {
    useTelemetryStore.getState().pushTelemetry({ type: "x" })
    useTelemetryStore.getState().clearTelemetry()
    expect(useTelemetryStore.getState().getBufferLength()).toBe(0)
  })

  it("respects maxBufferSize by dropping oldest", () => {
    useTelemetryStore.setState({ maxBufferSize: 3 })
    useTelemetryStore.getState().pushTelemetry({ type: "1" })
    useTelemetryStore.getState().pushTelemetry({ type: "2" })
    useTelemetryStore.getState().pushTelemetry({ type: "3" })
    useTelemetryStore.getState().pushTelemetry({ type: "4" })
    expect(useTelemetryStore.getState().getBufferLength()).toBe(3)
    expect(useTelemetryStore.getState().telemetryBuffer.map((e) => e.type)).toEqual(["2", "3", "4"])
  })
})
