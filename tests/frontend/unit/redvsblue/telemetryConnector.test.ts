import { describe, it, expect, vi } from "vitest"
import { TelemetryConnectorCore } from "@/redvsblue/TelemetryConnector"
import { useTelemetryStore } from "@/redvsblue/stores/telemetry"

describe("TelemetryConnectorCore", () => {
  it("sends batched events on open and clears buffer", async () => {
    useTelemetryStore.getState().clearTelemetry()
    useTelemetryStore.getState().pushTelemetry({ type: "a" } as any)
    useTelemetryStore.getState().pushTelemetry({ type: "b" } as any)

    class MockWS {
      sent: string[] = []
      readyState = 1
      onopen: (() => void) | null = null
      onclose: (() => void) | null = null
      onerror: (() => void) | null = null
      constructor(url: string) {
        // call onopen asynchronously to simulate real socket
        setTimeout(() => this.onopen && this.onopen(), 0)
      }
      send(v: string) {
        this.sent.push(v)
      }
      close() {
        this.readyState = 3
        this.onclose && this.onclose()
      }
    }

    const connector = new TelemetryConnectorCore({ WebSocketCtor: MockWS as any, batchSize: 10, drainIntervalMs: 10 })
    connector.start()

    await new Promise((r) => setTimeout(r, 50))

    // Check that the mock sent one message containing the two events
    // @ts-ignore access internal ws for test introspection
    const ws = (connector as any).ws as MockWS
    expect(ws.sent.length).toBe(1)
    const payload = JSON.parse(ws.sent[0])
    expect(payload.length).toBe(2)
    expect(useTelemetryStore.getState().getBufferLength()).toBe(0)

    connector.stop()
  })

  it("requeues events on send failure", async () => {
    useTelemetryStore.getState().clearTelemetry()
    useTelemetryStore.getState().pushTelemetry({ type: "x" } as any)

    class FailingWS {
      readyState = 1
      onopen: (() => void) | null = null
      onclose: (() => void) | null = null
      onerror: (() => void) | null = null
      constructor(url: string) {
        setTimeout(() => this.onopen && this.onopen(), 0)
      }
      send() {
        throw new Error("send failed")
      }
      close() {
        this.readyState = 3
        this.onclose && this.onclose()
      }
    }

    const connector = new TelemetryConnectorCore({ WebSocketCtor: FailingWS as any, batchSize: 10, drainIntervalMs: 10 })
    connector.start()

    await new Promise((r) => setTimeout(r, 50))

    // Since send threw, buffer should be restored
    expect(useTelemetryStore.getState().getBufferLength()).toBe(1)

    connector.stop()
  })

  it("reconnects on failure and drains after reconnect", async () => {
    useTelemetryStore.getState().clearTelemetry()
    useTelemetryStore.getState().pushTelemetry({ type: "m" } as any)

    // First instance: immediately close
    // Second instance: succeed
    let inst = 0
    class FlakyWS {
      sent: string[] = []
      readyState = 1
      onopen: (() => void) | null = null
      onclose: (() => void) | null = null
      constructor(url: string) {
        inst++
        setTimeout(() => {
          if (inst === 1) {
            // simulate premature close
            this.readyState = 3
            this.onclose && this.onclose()
          } else {
            this.onopen && this.onopen()
          }
        }, 0)
      }
      send(v: string) { this.sent.push(v) }
      close() { this.readyState = 3; this.onclose && this.onclose() }
    }

    const connector = new TelemetryConnectorCore({ WebSocketCtor: FlakyWS as any, batchSize: 10, drainIntervalMs: 10, backoffBaseMs: 10, backoffMaxMs: 20 })
    connector.start()

    // Wait long enough for reconnect to happen
    await new Promise((r) => setTimeout(r, 200))

    // @ts-ignore
    const ws = (connector as any).ws as FlakyWS
    expect(ws.sent.length).toBeGreaterThanOrEqual(1)
    expect(useTelemetryStore.getState().getBufferLength()).toBe(0)

    connector.stop()
  })

  it("uses navigator.sendBeacon on beforeunload and clears buffer", async () => {
    useTelemetryStore.getState().clearTelemetry()
    useTelemetryStore.getState().pushTelemetry({ type: "u1" } as any)
    useTelemetryStore.getState().pushTelemetry({ type: "u2" } as any)

    const sendBeacon = vi.fn(() => true)
    ;(navigator as any).sendBeacon = sendBeacon

    const connector = new TelemetryConnectorCore({ url: "https://example/tele", batchSize: 10, drainIntervalMs: 10 })
    connector.start()

    // simulate page unload
    window.dispatchEvent(new Event("beforeunload"))

    expect(sendBeacon).toHaveBeenCalledTimes(1)
    const calledWith = sendBeacon.mock.calls[0]
    expect(calledWith[0]).toBe("https://example/tele")
    const payload = JSON.parse(calledWith[1])
    expect(payload.length).toBe(2)
    expect(useTelemetryStore.getState().getBufferLength()).toBe(0)

    // cleanup
    delete (navigator as any).sendBeacon
    connector.stop()
  })

  it("requeues buffer if sendBeacon absent or returns false", async () => {
    useTelemetryStore.getState().clearTelemetry()
    useTelemetryStore.getState().pushTelemetry({ type: "v1" } as any)

    const sendBeacon = vi.fn(() => false)
    ;(navigator as any).sendBeacon = sendBeacon

    const connector = new TelemetryConnectorCore({ url: "https://example/tele", batchSize: 10, drainIntervalMs: 10 })
    connector.start()

    window.dispatchEvent(new Event("beforeunload"))

    expect(sendBeacon).toHaveBeenCalledTimes(1)
    // since sendBeacon returned false, buffer should be restored
    expect(useTelemetryStore.getState().getBufferLength()).toBe(1)

    delete (navigator as any).sendBeacon
    connector.stop()
  })
})