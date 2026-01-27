import { describe, it, expect } from "vitest"
import { trySendBeacon } from "@/redvsblue/telemetry/sendBeacon"

describe("trySendBeacon", () => {
  it("returns true when navigator.sendBeacon exists and returns true", () => {
    ;(navigator as any).sendBeacon = () => true
    const ok = trySendBeacon("https://x", JSON.stringify([{ type: "a" }]))
    expect(ok).toBe(true)
    delete (navigator as any).sendBeacon
  })

  it("returns false when sendBeacon returns false", () => {
    ;(navigator as any).sendBeacon = () => false
    const ok = trySendBeacon("https://x", "data")
    expect(ok).toBe(false)
    delete (navigator as any).sendBeacon
  })

  it("returns false when sendBeacon is absent", () => {
    delete (navigator as any).sendBeacon
    const ok = trySendBeacon("https://x", "data")
    expect(ok).toBe(false)
  })
})
