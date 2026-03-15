import { describe, it, expect, beforeEach } from 'vitest';
import { recordEvent, getEvents, clearEvents } from '../../../src/backend/src/services/observability.js';

describe('observability service', () => {
  beforeEach(() => {
    clearEvents();
  });

  it('should record and retrieve events', () => {
    recordEvent('info', 'test-event', { traceId: '1' }, { foo: 'bar' });
    const events = getEvents();
    expect(events).toHaveLength(1);
    expect(events[0].event).toBe('test-event');
    expect(events[0].level).toBe('info');
    expect(events[0].payload).toEqual({ foo: 'bar' });
  });

  it('should return events in reverse chronological order', () => {
    recordEvent('info', 'event-1', { traceId: '1' });
    recordEvent('info', 'event-2', { traceId: '2' });
    const events = getEvents();
    expect(events).toHaveLength(2);
    expect(events[0].event).toBe('event-2');
    expect(events[1].event).toBe('event-1');
  });

  it('should filter by event name', () => {
    recordEvent('info', 'event-1', { traceId: '1' });
    recordEvent('info', 'event-2', { traceId: '2' });
    const events = getEvents({ event: 'event-1' });
    expect(events).toHaveLength(1);
    expect(events[0].event).toBe('event-1');
  });

  it('should filter by level', () => {
    recordEvent('info', 'event-1', { traceId: '1' });
    recordEvent('error', 'event-2', { traceId: '2' });
    const events = getEvents({ level: 'error' });
    expect(events).toHaveLength(1);
    expect(events[0].level).toBe('error');
  });

  it('should apply limit', () => {
    recordEvent('info', 'event-1', { traceId: '1' });
    recordEvent('info', 'event-2', { traceId: '2' });
    recordEvent('info', 'event-3', { traceId: '3' });
    const events = getEvents({ limit: 2 });
    expect(events).toHaveLength(2);
    expect(events[0].event).toBe('event-3');
    expect(events[1].event).toBe('event-2');
  });

  it('should filter by sinceMs', () => {
    const now = Date.now();
    // This is a bit tricky since recordEvent uses Date.now()
    // We can't easily mock Date.now() in the service without more work
    // But we can record one, wait a bit, and check.
    recordEvent('info', 'old', { traceId: 'old' });

    // To avoid flaky tests with small time differences, we can just check it works
    const events = getEvents({ sinceMs: 10000 }); // within last 10s
    expect(events.map(e => e.event)).toContain('old');

    const noEvents = getEvents({ sinceMs: -10000 }); // "since 10s in the future" - effectively should be empty if it's strictly >
    // Wait, sinceMs: -10000 means since = Date.now() - (-10000) = Date.now() + 10000.
    // e.timestamp >= Date.now() + 10000 should be false.
    expect(noEvents).toHaveLength(0);
  });
});
