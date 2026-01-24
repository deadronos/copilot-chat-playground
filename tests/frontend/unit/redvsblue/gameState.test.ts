import { beforeEach, describe, expect, it } from "vitest"

import type { GameState } from "@/redvsblue/types"
import { selectBlueCount, selectRedCount, selectSnapshot, useGameState } from "@/redvsblue/stores/gameState"

describe("redvsblue/gameState store", () => {
  beforeEach(() => {
    useGameState.getState().clear()
  })

  it("starts with null snapshot and 0 counts", () => {
    const state = useGameState.getState()
    expect(selectSnapshot(state)).toBeNull()
    expect(selectRedCount(state)).toBe(0)
    expect(selectBlueCount(state)).toBe(0)
  })

  it("setSnapshot sets snapshot and counts", () => {
    const snapshot: GameState = {
      ships: [
        {
          id: "ship-1",
          team: "red",
          position: { x: 0, y: 0 },
          velocity: { x: 0, y: 0 },
          angle: 0,
          health: 10,
          maxHealth: 10,
          isThrusting: false,
          isFiring: false,
        },
        {
          id: "ship-2",
          team: "blue",
          position: { x: 0, y: 0 },
          velocity: { x: 0, y: 0 },
          angle: 0,
          health: 10,
          maxHealth: 10,
          isThrusting: false,
          isFiring: false,
        },
        {
          id: "ship-3",
          team: "red",
          position: { x: 0, y: 0 },
          velocity: { x: 0, y: 0 },
          angle: 0,
          health: 10,
          maxHealth: 10,
          isThrusting: false,
          isFiring: false,
        },
      ],
      bullets: [],
      particles: [],
      stars: [],
      timestamp: 0,
    }

    useGameState.getState().setSnapshot(snapshot)

    const state = useGameState.getState()
    expect(selectSnapshot(state)).toBe(snapshot)
    expect(selectRedCount(state)).toBe(2)
    expect(selectBlueCount(state)).toBe(1)
  })

  it("clear resets snapshot and counts", () => {
    const snapshot: GameState = {
      ships: [],
      bullets: [],
      particles: [],
      stars: [],
      timestamp: 0,
    }

    useGameState.getState().setSnapshot(snapshot)
    useGameState.getState().clear()

    const state = useGameState.getState()
    expect(selectSnapshot(state)).toBeNull()
    expect(selectRedCount(state)).toBe(0)
    expect(selectBlueCount(state)).toBe(0)
  })
})

