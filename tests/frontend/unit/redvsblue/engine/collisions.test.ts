import { describe, it, expect, vi } from "vitest"
import { checkCollisions } from "@/redvsblue/engine/collisions"
import type { EngineCoreState, EngineCoreContext } from "@/redvsblue/engine/core"

import { DEFAULT_ENGINE_TUNING } from "@/redvsblue/config/index"

class DummyShip {
  id: string
  team: string
  x: number
  y: number
  radius: number
  health: number
  color: string
  constructor(id: string, team: string, x: number, y: number, radius = 10, health = 10) {
    this.id = id
    this.team = team
    this.x = x
    this.y = y
    this.radius = radius
    this.health = health
    this.color = team === "red" ? "red" : "blue"
  }
}

class DummyBullet {
  id: string
  team: string
  x: number
  y: number
  radius: number
  damage: number
  ownerId: string
  active = true
  constructor(id: string, team: string, x: number, y: number, damage = 5, radius = 3, ownerId = "s1") {
    this.id = id
    this.team = team
    this.x = x
    this.y = y
    this.radius = radius
    this.damage = damage
    this.ownerId = ownerId
  }
}

describe("checkCollisions", () => {
  it("detects hit, emits telemetry, and creates particles", () => {
    const state: EngineCoreState = {
      ships: [new (DummyShip as any)("s1", "red", 50, 50, 10, 5)],
      bullets: [new (DummyBullet as any)("b1", "blue", 52, 50, 5)],
      particles: [],
      tick: 0,
    }

    const emitted: any[] = []
    const ctx: EngineCoreContext = {
      config: {} as any,
      rng: () => 0.5,
      nextEntityId: (prefix: string) => `${prefix}-1`,
      emit: (event: string, data: unknown) => emitted.push({ event, data }),
    }

    checkCollisions(state, ctx, DEFAULT_ENGINE_TUNING)

    // bullet should be marked inactive (removed from array only by engine loop; we expect active=false)
    expect(state.bullets[0].active).toBe(false)

    // ship might be destroyed or have reduced health depending on damage
    if (state.ships.length > 0) {
      expect(state.ships[0].health).toBeLessThanOrEqual(5)
    } else {
      // ship removed indicates destruction; ensure destruction telemetry emitted
      expect(emitted.some((e) => e.event === "telemetry" && (e.data as any).type === "ship_destroyed") || emitted.some((e) => e.event === "telemetry" && (e.data as any).type === "bullet_hit")).toBe(true)
    }

    // telemetry events should include bullet_hit
    expect(emitted.some((e) => e.event === "telemetry" && (e.data as any).type === "bullet_hit")).toBe(true)

    // particles created for hit
    expect(state.particles.length).toBeGreaterThanOrEqual(1)
  })

  it("destroys ship and emits ship_destroyed events", () => {
    const state: EngineCoreState = {
      ships: [new (DummyShip as any)("s2", "red", 50, 50, 10, 1)],
      bullets: [new (DummyBullet as any)("b2", "blue", 50, 50, 5)],
      particles: [],
      tick: 0,
    }

    const emitted: any[] = []
    const ctx: EngineCoreContext = {
      config: {} as any,
      rng: () => 0.5,
      nextEntityId: (prefix: string) => `${prefix}-1`,
      emit: (event: string, data: unknown) => emitted.push({ event, data }),
    }

    checkCollisions(state, ctx, DEFAULT_ENGINE_TUNING)

    // ship should be removed (destroyed)
    expect(state.ships.length).toBe(0)

    // ship_destroyed emitted
    expect(emitted.some((e) => e.event === "telemetry" && (e.data as any).type === "ship_destroyed")).toBe(true)

    // death particles created
    expect(state.particles.length).toBeGreaterThanOrEqual(2)
  })
})
