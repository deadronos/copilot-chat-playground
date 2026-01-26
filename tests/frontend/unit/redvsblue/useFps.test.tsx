import React, { useLayoutEffect } from "react"
import { describe, expect, it } from "vitest"
import { render } from "@testing-library/react"

import { useFps, type UseFpsResult } from "@/redvsblue/useFps"

const FpsHarness = ({ onReady }: { onReady: (api: UseFpsResult) => void }) => {
  const api = useFps({ windowMs: 500, publishIntervalMs: 250 })

  useLayoutEffect(() => {
    onReady(api)
  }, [api, onReady])

  return null
}

describe("useFps", () => {
  it("publishes fps once thresholds are met", () => {
    let api: UseFpsResult | null = null

    render(<FpsHarness onReady={(value) => { api = value }} />)

    expect(api).not.toBeNull()
    api!.reset()

    expect(api!.recordFrame(1000)).toBeNull()
    expect(api!.recordFrame(1100)).toBeNull()
    expect(api!.recordFrame(1200)).toBeNull()
    expect(api!.recordFrame(1300)).toBeNull()

    const fps = api!.recordFrame(1500)
    expect(fps).toBe(10)
  })

  it("resets window with explicit timestamp", () => {
    let api: UseFpsResult | null = null

    render(<FpsHarness onReady={(value) => { api = value }} />)

    expect(api).not.toBeNull()
    api!.reset(2000)

    expect(api!.recordFrame(2000)).toBeNull()
    const fps = api!.recordFrame(2500)
    expect(fps).toBe(4)
  })
})