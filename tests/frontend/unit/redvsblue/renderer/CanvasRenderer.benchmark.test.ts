import { describe, it } from "vitest"
import { CanvasRenderer } from "../../../../../src/frontend/src/redvsblue/renderer/CanvasRenderer"
import { Bullet } from "../../../../../src/frontend/src/redvsblue/types"

describe("CanvasRenderer Benchmark", () => {
  // Skipping by default because a mocked context doesn't measure real canvas API performance
  // and will only spam CI logs. Run locally to measure pure JS overhead.
  it.skip("measures drawBullets performance", () => {
    const renderer = new CanvasRenderer()

    const mockCtx = {
      beginPath: () => {},
      arc: () => {},
      fill: () => {},
      fillRect: () => {},
      stroke: () => {},
      moveTo: () => {},
      lineTo: () => {},
      closePath: () => {},
      save: () => {},
      restore: () => {},
      translate: () => {},
      rotate: () => {},
      clearRect: () => {},
      fillStyle: "",
      strokeStyle: "",
      globalAlpha: 1,
      lineWidth: 1,
    }

    const canvas = {
      getContext: () => mockCtx,
      width: 800,
      height: 600,
    } as unknown as HTMLCanvasElement

    renderer.init(canvas)
    const ctx = mockCtx as unknown as CanvasRenderingContext2D

    const bullets: Bullet[] = []
    for (let i = 0; i < 1000; i++) {
      bullets.push({
        id: `b${i}`,
        team: i % 2 === 0 ? "red" : "blue",
        position: { x: Math.random() * 800, y: Math.random() * 600 },
        velocity: { x: 0, y: 0 },
        angle: 0,
        damage: 10,
        ownerId: "s1",
      })
    }

    // Warm up
    for (let i = 0; i < 10; i++) {
      // @ts-ignore
      renderer.drawBullets(ctx, bullets)
    }

    const start = performance.now()
    const iterations = 1000
    for (let i = 0; i < iterations; i++) {
      // @ts-ignore
      renderer.drawBullets(ctx, bullets)
    }
    const end = performance.now()
    console.log(`drawBullets took ${(end - start).toFixed(4)}ms for ${iterations} calls with ${bullets.length} bullets each`)
  })
})
