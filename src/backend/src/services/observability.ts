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
  events.push(e);
  if (events.length > MAX_EVENTS) {
    events.splice(0, events.length - MAX_EVENTS);
  }
}

export function getEvents(opts?: {
  event?: string;
  sinceMs?: number;
  limit?: number;
  level?: ObservabilityEvent["level"];
}): ObservabilityEvent[] {
  const since = opts?.sinceMs ? Date.now() - opts.sinceMs : 0;
  const filtered = events
    .slice()
    .reverse()
    .filter((e) => e.timestamp >= since)
    .filter((e) => (opts?.event ? e.event === opts.event : true))
    .filter((e) => (opts?.level ? e.level === opts.level : true));
  if (opts?.limit) return filtered.slice(0, opts.limit);
  return filtered;
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
}
