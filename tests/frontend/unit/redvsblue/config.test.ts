import { describe, it, expect } from 'vitest'
import { DEFAULT_ENGINE_CONFIG } from '@/redvsblue/config'

describe('redvsblue/config defaults', () => {
  it('has expected default gameplay values', () => {
    expect(DEFAULT_ENGINE_CONFIG.shipSpeed).toBe(5)
    expect(DEFAULT_ENGINE_CONFIG.bulletSpeed).toBe(8)
    expect(DEFAULT_ENGINE_CONFIG.bulletDamage).toBe(5)
    expect(DEFAULT_ENGINE_CONFIG.shipMaxHealth).toBe(60)
  })
})
