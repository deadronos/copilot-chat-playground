import request from "supertest";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { createApp } from "../app";
import * as observability from "../services/observability";

describe("observability endpoints", () => {
  beforeEach(() => {
    observability.clearEvents();
  });

  test("records events when match start is called and exposes events endpoint", async () => {
    const app = await createApp();
    // Start a match to generate structured events
    const startRes = await request(app)
      .post("/api/redvsblue/match/start")
      .send({ matchId: "obs-match-1", rulesVersion: "v1", proposedRules: {}, clientConfig: {} });
    expect(startRes.status).toBe(200);

    const eventsRes = await request(app).get("/api/observability/events?event=match.start.success");
    expect(eventsRes.status).toBe(200);
    expect(eventsRes.body.ok).toBeTruthy();
    expect(Array.isArray(eventsRes.body.events)).toBe(true);
    expect(eventsRes.body.events.length).toBeGreaterThanOrEqual(1);
    expect(eventsRes.body.events[0].event).toBe("match.start.success");
  });

  test("match.start.rejoin emitted when X-Action header set and metrics count works", async () => {
    const app = await createApp();

    const spy = vi.spyOn(observability, "recordEvent");

    const res = await request(app)
      .post("/api/redvsblue/match/start")
      .set("X-Action", "refresh_match")
      .send({ matchId: "obs-match-2", rulesVersion: "v1", proposedRules: {}, clientConfig: {} });
    expect(res.status).toBe(200);

    const eventsRes = await request(app).get("/api/observability/events?event=match.start.rejoin");
    expect(eventsRes.status).toBe(200);
    // Should have at least one rejoin record
    expect(Array.isArray(eventsRes.body.events)).toBe(true);
    expect(eventsRes.body.events.length).toBeGreaterThanOrEqual(1);

    const metricsRes = await request(app).get("/api/observability/metrics?event=match.start.rejoin&bucketMs=60000");
    expect(metricsRes.status).toBe(200);
    expect(metricsRes.body.ok).toBe(true);
    expect(Array.isArray(metricsRes.body.buckets)).toBe(true);

    spy.mockRestore();
  });

  test("summary endpoint returns counts", async () => {
    const app = await createApp();

    // create a couple events
    await request(app)
      .post("/api/redvsblue/match/start")
      .send({ matchId: "obs-match-3", rulesVersion: "v1", proposedRules: {}, clientConfig: {} });
    await request(app)
      .post("/api/redvsblue/match/start")
      .set("X-Action", "refresh_match")
      .send({ matchId: "obs-match-3", rulesVersion: "v1", proposedRules: {}, clientConfig: {} });

    const res = await request(app).get("/api/observability/summary");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(typeof res.body.summary).toBe("object");
    expect(res.body.summary["match.start.success"]).toBeGreaterThanOrEqual(1);
  });

  test("delete events endpoint clears stored observability events", async () => {
    const app = await createApp();

    await request(app)
      .post("/api/redvsblue/match/start")
      .send({ matchId: "obs-match-4", rulesVersion: "v1", proposedRules: {}, clientConfig: {} });

    const clearRes = await request(app).delete("/api/observability/events");
    expect(clearRes.status).toBe(200);
    expect(clearRes.body.ok).toBe(true);

    const summaryRes = await request(app).get("/api/observability/summary");
    expect(summaryRes.status).toBe(200);
    expect(summaryRes.body.summary).toEqual({});
  });
});