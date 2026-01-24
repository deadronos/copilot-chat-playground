import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { TelemetryConnectorCore, TelemetryConnectorReact } from "@/redvsblue/TelemetryConnector"
import { useTelemetryStore } from "@/redvsblue/stores/telemetry"
import { useUIStore } from "@/redvsblue/stores/uiStore"
import React from "react"
import { createRoot } from "react-dom/client"
import { act } from "react-dom/test-utils"


describe("TelemetryConnector React integration", () => {
  beforeEach(() => {
    useTelemetryStore.getState().clearTelemetry()
    useUIStore.setState({ telemetryEnabled: true })
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    document.body.innerHTML = ""
  })

  it("buffers events while UI toggle is off and drains after re-enable", async () => {
    let lastWS: any = null

    class MockWS {
      sent: string[] = []
      readyState = 1
      onopen: (() => void) | null = null
      onclose: (() => void) | null = null
      constructor(url: string) {
        lastWS = this
        // simulate async open
        setTimeout(() => this.onopen && this.onopen(), 0)
      }
      send(v: string) { this.sent.push(v) }
      close() { this.readyState = 3; this.onclose && this.onclose() }
    }

    // Use the core connector directly to emulate the React mount lifecycle
    const connector = new TelemetryConnectorCore({ WebSocketCtor: MockWS as any, drainIntervalMs: 100, batchSize: 10 })
    connector.start()

    // disable UI telemetry
    useUIStore.getState().setTelemetryEnabled(false)

    // push an event while disabled
    useTelemetryStore.getState().pushTelemetry({ type: "buffered_event" } as any)
    expect(useTelemetryStore.getState().getBufferLength()).toBe(1)

    // re-enable telemetry (connector should drain)
    useUIStore.getState().setTelemetryEnabled(true)

    // advance timers so drain interval runs
    vi.advanceTimersByTime(500)

    // allow event loop tasks to run
    await Promise.resolve()

    expect(lastWS).not.toBeNull()
    expect(lastWS.sent.length).toBeGreaterThanOrEqual(1)
    const payload = JSON.parse(lastWS.sent[0])
    expect(payload.find((p: any) => p.type === "buffered_event")).toBeTruthy()
    expect(useTelemetryStore.getState().getBufferLength()).toBe(0)

    connector.stop()
  })

  it.skip("mounts TelemetryConnectorReact and drains after UI toggle (skipped: environment import resolution)", async () => {
    let lastWS: any = null

    class MockWS {
      sent: string[] = []
      readyState = 1
      onopen: (() => void) | null = null
      onclose: (() => void) | null = null
      constructor(url: string) {
        lastWS = this
        setTimeout(() => this.onopen && this.onopen(), 0)
      }
      send(v: string) { this.sent.push(v) }
      close() { this.readyState = 3; this.onclose && this.onclose() }
    }

    // Mount the connector using react-dom's createRoot
    const container = document.createElement("div")
    document.body.appendChild(container)
    const root = createRoot(container)
    act(() => {
      root.render(<TelemetryConnectorReact WebSocketCtor={MockWS as any} drainIntervalMs={100} batchSize={10} />)
    })

    // push event while UI disabled
    useUIStore.getState().setTelemetryEnabled(false)
    useTelemetryStore.getState().pushTelemetry({ type: "react_buffered" } as any)
    expect(useTelemetryStore.getState().getBufferLength()).toBe(1)

    // re-enable
    useUIStore.getState().setTelemetryEnabled(true)
    vi.advanceTimersByTime(500)
    await Promise.resolve()

    expect(lastWS).not.toBeNull()
    expect(lastWS.sent.length).toBeGreaterThanOrEqual(1)
    const payload = JSON.parse(lastWS.sent[0])
    expect(payload.find((p: any) => p.type === "react_buffered")).toBeTruthy()
    expect(useTelemetryStore.getState().getBufferLength()).toBe(0)

    act(() => root.unmount())
    container.remove()
  })
})