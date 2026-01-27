import { describe, it, expect } from "vitest"
import { createParticles, createDeathParticles } from "@/redvsblue/engine/particles"

describe("particles factory", () => {
  it("createParticles returns requested count with ids and colors", () => {
    let idx = 0
    const idGen = (prefix: string) => `${prefix}-${idx++}`
    const rng = () => 0.5
    const parts = createParticles(3, 10, 20, "blue", idGen, rng as any)
    expect(parts.length).toBe(3)
    expect(parts[0].id).toBe("particle-0")
    expect(parts[1].id).toBe("particle-1")
    expect(parts[2].id).toBe("particle-2")
    for (const p of parts) {
      expect(p.color).toBe("blue")
      expect(p.life).toBe(1)
    }
  })

  it("createDeathParticles returns pairs of white and ship color", () => {
    let idx = 0
    const idGen = (prefix: string) => `${prefix}-${idx++}`
    const rng = () => 0.9
    const parts = createDeathParticles(2, 5, 5, "#abc123", idGen, rng as any)
    // deathCount=2 -> returns 4 particles (white, color, white, color)
    expect(parts.length).toBe(4)
    expect(parts[0].color).toBe("white")
    expect(parts[1].color).toBe("#abc123")
    expect(parts[2].color).toBe("white")
    expect(parts[3].color).toBe("#abc123")
    expect(parts[0].id).toBe("particle-0")
    expect(parts[1].id).toBe("particle-1")
    expect(parts[2].id).toBe("particle-2")
    expect(parts[3].id).toBe("particle-3")
  })
})
