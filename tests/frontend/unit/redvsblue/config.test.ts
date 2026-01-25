import { describe, it, expect } from 'vitest'
import { DEFAULT_ENGINE_CONFIG } from '@/redvsblue/config'
import { DEFAULT_REDVSBLUE_RULES } from '@copilot-playground/shared'

describe('redvsblue/config defaults', () => {
  it('has expected default gameplay values', () => {
    expect(DEFAULT_ENGINE_CONFIG.shipSpeed).toBe(DEFAULT_REDVSBLUE_RULES.shipSpeed)
    expect(DEFAULT_ENGINE_CONFIG.bulletSpeed).toBe(DEFAULT_REDVSBLUE_RULES.bulletSpeed)
    expect(DEFAULT_ENGINE_CONFIG.bulletDamage).toBe(DEFAULT_REDVSBLUE_RULES.bulletDamage)
    expect(DEFAULT_ENGINE_CONFIG.shipMaxHealth).toBe(DEFAULT_REDVSBLUE_RULES.shipMaxHealth)
  })
})
