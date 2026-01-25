import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { TelemetryEvent } from '@/redvsblue/types'
import { ensureTelemetryEvent } from '@/redvsblue/telemetry'

describe('redvsblue/telemetry helper', () => {
  beforeEach(() => {
    // freeze time for deterministic timestamp checks
    vi.setSystemTime(new Date('2025-01-01T00:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('assigns timestamp and id when missing', () => {
    const partial = { type: 'game_started' } as Partial<TelemetryEvent>
    const filled = ensureTelemetryEvent(partial)

    expect(typeof filled.id).toBe('string')
    expect(filled.id!.length).toBeGreaterThan(0)
    expect(filled.timestamp).toBe(Date.now())
    expect(filled.type).toBe('game_started')
  })
})
