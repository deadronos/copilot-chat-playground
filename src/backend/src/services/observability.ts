import type { TraceContext } from "./redvsblue-types.js";

export type ObservabilityEvent = {
  timestamp: number;
  level: "info" | "warn" | "error";
  event: string;
  context: TraceContext;
  payload: Record<string, unknown>;
};

const MAX_EVENTS = 10_000;

const events: ObservabilityEvent[] = [];
let nextIndex = 0;

export function recordEvent(
  level: ObservabilityEvent["level"],
  event: string,
  context: TraceContext,
  payload: Record<string, unknown> = {}
): void {
  const e: ObservabilityEvent = {
    timestamp: Date.now(),
    level,
    event,
    context,
    payload,
  };

  if (events.length < MAX_EVENTS) {
    events.push(e);
  } else {
    events[nextIndex] = e;
    nextIndex = (nextIndex + 1) % MAX_EVENTS;
  }
}

function* getEventsReverse(): Generator<ObservabilityEvent> {
  if (events.length < MAX_EVENTS) {
    for (let i = events.length - 1; i >= 0; i--) {
      yield events[i];
    }
  } else {
    for (let i = 0; i < MAX_EVENTS; i++) {
      const idx = (nextIndex - 1 - i + MAX_EVENTS) % MAX_EVENTS;
      yield events[idx];
    }
  }
}

export function getEvents(opts?: {
  event?: string;
  sinceMs?: number;
  limit?: number;
  level?: ObservabilityEvent["level"];
}): ObservabilityEvent[] {
  const since = opts?.sinceMs ? Date.now() - opts.sinceMs : 0;
  const result: ObservabilityEvent[] = [];

  for (const e of getEventsReverse()) {
    if (e.timestamp < since) break;
    if (opts?.event && e.event !== opts.event) continue;
    if (opts?.level && e.level !== opts.level) continue;

    result.push(e);
    if (opts?.limit && result.length >= opts.limit) break;
  }

  return result;
}

export function getCounts(opts: { event: string; sinceMs?: number; bucketMs?: number }): Array<{ ts: number; count: number }> {
  const since = opts?.sinceMs ? Date.now() - opts.sinceMs : Date.now() - 60_000 * 60; // default last hour
  const bucketMs = opts.bucketMs ?? 60_000;
  const buckets = new Map<number, number>();
  for (const e of events) {
    if (e.event !== opts.event) continue;
    if (e.timestamp < since) continue;
    const bucket = Math.floor(e.timestamp / bucketMs) * bucketMs;
    buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1);
  }
  const res = Array.from(buckets.entries())
    .map(([ts, count]) => ({ ts, count }))
    .sort((a, b) => a.ts - b.ts);
  return res;
}

export function getSummary(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const e of events) {
    counts[e.event] = (counts[e.event] || 0) + 1;
  }
  return counts;
}

export function clearEvents(): void {
  events.length = 0;
  nextIndex = 0;
}
