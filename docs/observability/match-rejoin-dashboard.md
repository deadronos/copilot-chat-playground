# Observability: match.start.rejoin dashboard

This document describes how to create a simple dashboard (Kibana/Grafana) to monitor `match.start.rejoin` (auto-rejoin) events and their frequency.

## Dataset

- `match.start.rejoin` is emitted when the backend receives a match start request with `X-Action: refresh_match`.
- The backend also exposes an in-process endpoint for ad-hoc queries:
  - GET /api/observability/events?event=match.start.rejoin&sinceMs=3600000 -> recent events (last hour)
  - GET /api/observability/metrics?event=match.start.rejoin&sinceMs=86400000&bucketMs=60000 -> per-minute buckets for the last day
  - GET /api/observability/summary -> counts for all observed events

## Kibana (Elasticsearch) approach

If you already ship logs to Elasticsearch (Filebeat/Fluentd/Logstash), use this KQL to filter events:

KQL: `event: "match.start.rejoin"`

Panels to create:

- Time series (Area): Count of events over time (use a suitable interval like 1m)

- Metric: Total rejoin count (time range selector)

- Table / Discover: recent events with `traceId`, `requestId`, `matchId` and `timestamp` as columns

If your logs are JSON and include `event` and `traceId`, these panels are straightforward to create in Kibana Lens.

## Grafana using backend endpoint

Grafana can call the backend endpoint directly (if network accessible). Example data source: "JSON API" or a simple proxy. Query example for a time-series panel (bucketMs=60000):

GET /api/observability/metrics?event=match.start.rejoin&sinceMs=3600000&bucketMs=60000

The response format is:

{
  ok: true,
  event: "match.start.rejoin",
  buckets: [{ ts: 167XYZ..., count: 3 }, ...]
}

Transform the `buckets` array into timeseries points (timestamp -> count) and plot as a timeseries.

## Notes & Next steps

- This backend in-memory endpoint is intended for lightweight dashboards and troubleshooting in development. For production-grade observability, ship structured logs to Elasticsearch/Logstash or metrics to Prometheus/Grafana.
- Consider adding a Prometheus counter for `match.start.rejoin` and an alert when rate exceeds a threshold.

---

Need help creating a saved-object export for Kibana or a Grafana panel JSON? I can draft the JSON or script the Grafana panel if you tell me which system you're using (Kibana or Grafana) and how testable the backend endpoint will be for your dashboards.
