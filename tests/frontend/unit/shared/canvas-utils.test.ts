import { describe, it, expect } from "vitest"
import { applyCanvasSize } from "@copilot-playground/shared"

describe("applyCanvasSize", () => {
  it("floors and clamps canvas dimensions", () => {
    const canvas = document.createElement("canvas")
    canvas.width = 10
    canvas.height = 10

    applyCanvasSize(canvas, 0.4, 7.9)

    expect(canvas.width).toBe(1)
    expect(canvas.height).toBe(7)
  })
})
