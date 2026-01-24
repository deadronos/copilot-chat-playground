import type { TelemetryEvent } from './types'

/**
 * Ensure a TelemetryEvent has required runtime fields (id, timestamp).
 * Intended to be used at the boundary before sending events to a connector.
 */
export function ensureTelemetryEvent(partial: Partial<TelemetryEvent>): TelemetryEvent {
  const id = partial.id ?? (typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? (crypto as any).randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`)
  const timestamp = partial.timestamp ?? Date.now()

  const event: TelemetryEvent = {
    id,
    type: partial.type ?? 'unknown',
    timestamp,
    data: partial.data ?? undefined,
    sessionId: partial.sessionId,
    seq: partial.seq,
    version: partial.version,
  }

  return event
}
