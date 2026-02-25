import express from "express";
import { getEvents, getCounts, getSummary } from "../services/observability.js";
import type { ObservabilityEvent } from "../services/observability.js";

function parseLevel(value: unknown): ObservabilityEvent["level"] | undefined {
  if (value === "info" || value === "warn" || value === "error") return value;
  return undefined;
}

export function createObservabilityRouter(): express.Router {
  const router = express.Router();

  router.get("/api/observability/events", (req, res) => {
    const { event, sinceMs, limit, level } = req.query;
    const parsed = {
      event: typeof event === "string" ? event : undefined,
      sinceMs: typeof sinceMs === "string" ? Number(sinceMs) : undefined,
      limit: typeof limit === "string" ? Number(limit) : undefined,
      level: parseLevel(level),
    };
    const events = getEvents(parsed);
    res.json({ ok: true, events });
  });

  router.get("/api/observability/metrics", (req, res) => {
    const { event, sinceMs, bucketMs } = req.query;
    if (!event || typeof event !== "string") {
      res.status(400).json({ error: "event query param is required" });
      return;
    }
    const since = typeof sinceMs === "string" ? Number(sinceMs) : undefined;
    const bucket = typeof bucketMs === "string" ? Number(bucketMs) : undefined;
    const buckets = getCounts({ event, sinceMs: since, bucketMs: bucket });
    res.json({ ok: true, event, buckets });
  });

  router.get("/api/observability/summary", (_req, res) => {
    const summary = getSummary();
    res.json({ ok: true, summary });
  });

  return router;
}
