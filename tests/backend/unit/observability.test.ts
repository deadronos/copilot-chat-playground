import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { recordEvent, getEvents, clearEvents } from '../../../src/backend/src/services/observability.js';

describe('observability service', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 1, 0, 0, 0));
    clearEvents();
  });

  afterEach(() => {
    vi.useRealTimers();
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
    // Use fake timers to make the time window deterministic.
    recordEvent('info', 'old', { traceId: 'old' });
    vi.advanceTimersByTime(1000);
    recordEvent('info', 'new', { traceId: 'new' });

    const events = getEvents({ sinceMs: 500 });
    expect(events.map((e) => e.event)).toEqual(['new']);

    const noEvents = getEvents({ sinceMs: -1000 });
    expect(noEvents).toHaveLength(0);
  });
});
