import { describe, it, expect } from "vitest";
import { createApp } from "../../../src/copilot/src/index.js";
import { incrementMetric, resetMetrics } from "../../../src/copilot/src/metrics.js";
import type { AddressInfo } from "node:net";

describe("/metrics endpoint", () => {
  it("should return Prometheus-style metrics including model_mismatch_count", async () => {
    resetMetrics();

    // increment the mismatch counter to simulate an event
    incrementMetric("model_mismatch_count", 3);

    const app = createApp();
    const server = app.listen(0);

    const address = server.address() as AddressInfo;
    const url = `http://127.0.0.1:${address.port}`;

    const res = await fetch(`${url}/metrics`);
    const text = await res.text();

    server.close();

    expect(res.ok).toBe(true);
    expect(text).toMatch(/# HELP copilot_model_mismatch_total/);
    expect(text).toMatch(/copilot_model_mismatch_total 3/);
  });
});