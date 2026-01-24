import { beforeEach, describe, expect, it } from "vitest"

import { useUIStore } from "@/redvsblue/stores/uiStore"

describe("redvsblue/uiStore store", () => {
  beforeEach(() => {
    useUIStore.setState({
      running: false,
      selectedRenderer: "canvas",
      fps: null,
      setRunning: useUIStore.getState().setRunning,
      setSelectedRenderer: useUIStore.getState().setSelectedRenderer,
      setFps: useUIStore.getState().setFps,
    })
  })

  it("has expected defaults", () => {
    const state = useUIStore.getState()
    expect(state.running).toBe(false)
    expect(state.selectedRenderer).toBe("canvas")
    expect(state.fps).toBeNull()
  })

  it("updates running", () => {
    useUIStore.getState().setRunning(true)
    expect(useUIStore.getState().running).toBe(true)
  })

  it("updates fps", () => {
    useUIStore.getState().setFps(60)
    expect(useUIStore.getState().fps).toBe(60)
    useUIStore.getState().setFps(null)
    expect(useUIStore.getState().fps).toBeNull()
  })
})

