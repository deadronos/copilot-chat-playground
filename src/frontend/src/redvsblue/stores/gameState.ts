import { create } from "zustand"
import { subscribeWithSelector } from "zustand/middleware"

import type { GameState, Team } from "@/redvsblue/types"

export type GameStateStore = {
  snapshot: GameState | null
  redCount: number
  blueCount: number
  setSnapshot: (snapshot: GameState) => void
  clear: () => void
}

function countShips(snapshot: GameState): { redCount: number; blueCount: number } {
  let redCount = 0
  let blueCount = 0

  for (const ship of snapshot.ships) {
    const team: Team = ship.team
    if (team === "red") redCount++
    else blueCount++
  }

  return { redCount, blueCount }
}

export const useGameState = create<GameStateStore>()(
  subscribeWithSelector((set) => ({
    snapshot: null,
    redCount: 0,
    blueCount: 0,
    setSnapshot: (snapshot) => {
      const { redCount, blueCount } = countShips(snapshot)
      set({ snapshot, redCount, blueCount })
    },
    clear: () => set({ snapshot: null, redCount: 0, blueCount: 0 }),
  }))
)

export const selectSnapshot = (state: GameStateStore) => state.snapshot
export const selectRedCount = (state: GameStateStore) => state.redCount
export const selectBlueCount = (state: GameStateStore) => state.blueCount

