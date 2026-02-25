import express from "express";
import { getEvents, getCounts, getSummary, type ObservabilityEvent } from "../services/observability.js";

export function createObservabilityRouter(): express.Router {
  const router = express.Router();

  router.get("/api/observability/events", (req, res) => {
    const { event, sinceMs, limit, level } = req.query;
    const parsedSince = typeof sinceMs === "string" ? Number(sinceMs) : undefined;
    if (parsedSince !== undefined && (!Number.isFinite(parsedSince) || parsedSince < 0)) {
      res.status(400).json({ error: "sinceMs must be a non-negative number" });
      return;
    }
    const parsedLimit = typeof limit === "string" ? Number(limit) : undefined;
    if (parsedLimit !== undefined && (!Number.isFinite(parsedLimit) || parsedLimit <= 0)) {
      res.status(400).json({ error: "limit must be a positive number" });
      return;
    }
    const parsedLevel: ObservabilityEvent["level"] | undefined =
      level === "info" || level === "warn" || level === "error" ? level : undefined;
    const parsed = {
      event: typeof event === "string" ? event : undefined,
      sinceMs: parsedSince,
      limit: parsedLimit,
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
    if (since !== undefined && (!Number.isFinite(since) || since < 0)) {
      res.status(400).json({ error: "sinceMs must be a non-negative number" });
      return;
    }
    const bucket = typeof bucketMs === "string" ? Number(bucketMs) : undefined;
    if (bucket !== undefined && (!Number.isFinite(bucket) || bucket <= 0)) {
      res.status(400).json({ error: "bucketMs must be a positive number" });
      return;
    }
    const buckets = getCounts({ event, sinceMs: since, bucketMs: bucket });
    res.json({ ok: true, event, buckets });
  });

  router.get("/api/observability/summary", (_req, res) => {
    const summary = getSummary();
    res.json({ ok: true, summary });
  });

  return router;
}
