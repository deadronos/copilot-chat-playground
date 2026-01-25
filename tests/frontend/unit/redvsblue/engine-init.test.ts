import { describe, it, expect } from 'vitest'
import { createEngine } from '@/redvsblue/engine'

describe('redvsblue/engine init and spawn', () => {
  it('applies shipMaxHealth from config to spawned ships', () => {
    const engine = createEngine()
    const config = {
      canvasWidth: 400,
      canvasHeight: 300,
      shipSpeed: 1,
      bulletSpeed: 2,
      bulletDamage: 3,
      shipMaxHealth: 999,
      enableTelemetry: false,
    }
    engine.init(config as any)
    engine.reset()
    const state = engine.getState()
    expect(state.ships.length).toBeGreaterThan(0)
    for (const s of state.ships) {
      expect(s.maxHealth).toBe(999)
    }
  })
})
