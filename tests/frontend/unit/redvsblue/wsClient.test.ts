import { describe, it, expect, vi } from "vitest"
import { WSClient } from "@/redvsblue/telemetry/wsClient"

describe("WSClient", () => {
  it("connects and forwards events", () => {
    let openCalled = false
    let closeCalled = false

    class MockWS {
      readyState = 1
      onopen: (() => void) | null = null
      onclose: (() => void) | null = null
      onerror: (() => void) | null = null
      sent: string[] = []
      constructor(url: string) {
        setTimeout(() => this.onopen && this.onopen(), 0)
      }
      send(v: string) { this.sent.push(v) }
      close() { this.readyState = 3; this.onclose && this.onclose() }
    }

    const client = new WSClient({ WebSocketCtor: MockWS as any, url: "wss://example/tele" })
    client.onopen = () => { openCalled = true }
    client.onclose = () => { closeCalled = true }

    client.connect()

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        client.send("hello")
        // @ts-ignore access internal mock for assertions
        const ws = (client as any).ws as MockWS
        expect(ws.sent).toEqual(["hello"])

        client.close()
        expect(closeCalled).toBe(true)
        expect(openCalled).toBe(true)
        resolve()
      }, 20)
    })
  })

  it("throws when sending while not open", () => {
    class MockWSUnavailable {
      readyState = 3
      constructor(url: string) {}
    }

    const client = new WSClient({ WebSocketCtor: MockWSUnavailable as any, url: "wss://x" })
    client.connect()

    expect(() => client.send("x")).toThrow()
  })
})
