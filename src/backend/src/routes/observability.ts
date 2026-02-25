import express from "express";
import { getEvents, getCounts, getSummary, type ObservabilityEvent } from "../services/observability.js";

export function createObservabilityRouter(): express.Router {
  const router = express.Router();

  router.get("/api/observability/events", (req, res) => {
    const { event, sinceMs, limit, level } = req.query;
    const parsedLevel: ObservabilityEvent["level"] | undefined =
      level === "info" || level === "warn" || level === "error" ? level : undefined;
    const parsed = {
      event: typeof event === "string" ? event : undefined,
      sinceMs: typeof sinceMs === "string" ? Number(sinceMs) : undefined,
      limit: typeof limit === "string" ? Number(limit) : undefined,
      level: parsedLevel,
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
