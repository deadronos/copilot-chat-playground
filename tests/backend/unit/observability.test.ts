import { describe, it, expect, beforeEach, vi } from "vitest";
import { recordEvent, getEvents, getCounts, getSummary, clearEvents } from "../../../src/backend/src/services/observability.js";

describe("observability service", () => {
  beforeEach(() => {
    clearEvents();
  });

  it("records and retrieves events", () => {
    const context = { traceId: "1", spanId: "1" } as any;
    recordEvent("info", "test-event", context, { foo: "bar" });

    const events = getEvents();
    expect(events).toHaveLength(1);
    expect(events[0].event).toBe("test-event");
    expect(events[0].level).toBe("info");
    expect(events[0].payload).toEqual({ foo: "bar" });
  });

  it("retrieves events in newest-to-oldest order", () => {
    const context = { traceId: "1", spanId: "1" } as any;
    recordEvent("info", "event-1", context);
    recordEvent("info", "event-2", context);
    recordEvent("info", "event-3", context);

    const events = getEvents();
    expect(events).toHaveLength(3);
    expect(events[0].event).toBe("event-3");
    expect(events[1].event).toBe("event-2");
    expect(events[2].event).toBe("event-1");
  });

  it("wraps around at MAX_EVENTS", () => {
    const context = { traceId: "1", spanId: "1" } as any;
    // MAX_EVENTS is 10,000.
    for (let i = 0; i < 10005; i++) {
      recordEvent("info", `event-${i}`, context);
    }

    const events = getEvents();
    expect(events).toHaveLength(10000);
    expect(events[0].event).toBe("event-10004"); // Newest
    expect(events[9999].event).toBe("event-5");   // Oldest
  });

  it("filters by event name", () => {
    const context = { traceId: "1", spanId: "1" } as any;
    recordEvent("info", "event-a", context);
    recordEvent("info", "event-b", context);

    expect(getEvents({ event: "event-a" })).toHaveLength(1);
    expect(getEvents({ event: "event-a" })[0].event).toBe("event-a");
  });

  it("filters by level", () => {
    const context = { traceId: "1", spanId: "1" } as any;
    recordEvent("info", "event-1", context);
    recordEvent("error", "event-2", context);

    expect(getEvents({ level: "error" })).toHaveLength(1);
    expect(getEvents({ level: "error" })[0].level).toBe("error");
  });

  it("respects limit", () => {
    const context = { traceId: "1", spanId: "1" } as any;
    recordEvent("info", "event-1", context);
    recordEvent("info", "event-2", context);
    recordEvent("info", "event-3", context);

    expect(getEvents({ limit: 2 })).toHaveLength(2);
    expect(getEvents({ limit: 2 })[0].event).toBe("event-3");
    expect(getEvents({ limit: 2 })[1].event).toBe("event-2");
  });

  it("ignores non-positive limits", () => {
    const context = { traceId: "1", spanId: "1" } as any;
    recordEvent("info", "event-1", context);
    recordEvent("info", "event-2", context);
    recordEvent("info", "event-3", context);

    expect(getEvents({ limit: -1 })).toHaveLength(3);
  });

  it("filters by sinceMs", () => {
    const context = { traceId: "1", spanId: "1" } as any;
    const now = Date.now();

    vi.useFakeTimers();

    vi.setSystemTime(now - 2000);
    recordEvent("info", "old-event", context);

    vi.setSystemTime(now);
    recordEvent("info", "new-event", context);

    expect(getEvents({ sinceMs: 1000 })).toHaveLength(1);
    expect(getEvents({ sinceMs: 1000 })[0].event).toBe("new-event");

    vi.useRealTimers();
  });

  it("getCounts returns buckets", () => {
    const context = { traceId: "1", spanId: "1" } as any;
    recordEvent("info", "event-1", context);

    const counts = getCounts({ event: "event-1" });
    expect(counts.length).toBeGreaterThan(0);
    expect(counts[0].count).toBe(1);
  });

  it("getCounts falls back when bucketMs is invalid", () => {
    const context = { traceId: "1", spanId: "1" } as any;
    recordEvent("info", "event-1", context);

    const counts = getCounts({ event: "event-1", bucketMs: Number.NaN });
    expect(counts.length).toBeGreaterThan(0);
    expect(Number.isFinite(counts[0].ts)).toBe(true);
    expect(counts[0].count).toBe(1);
  });

  it("getSummary returns summary", () => {
    const context = { traceId: "1", spanId: "1" } as any;
    recordEvent("info", "event-a", context);
    recordEvent("info", "event-a", context);
    recordEvent("info", "event-b", context);

    const summary = getSummary();
    expect(summary["event-a"]).toBe(2);
    expect(summary["event-b"]).toBe(1);
  });
});
