import { afterEach, describe, expect, it } from "vitest";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { createApp } from "../../../src/backend/src/app.js";

let server: Server | undefined;

function getServerUrl(serverInstance: Server): string {
  const address = serverInstance.address() as AddressInfo;
  return `http://127.0.0.1:${address.port}`;
}

async function startServer(): Promise<Server> {
  const app = createApp();
  return new Promise((resolve) => {
    const created = createServer(app);
    created.listen(0, () => resolve(created));
  });
}

afterEach(async () => {
  if (!server) return;
  await new Promise<void>((resolve) => server?.close(() => resolve()));
  server = undefined;
});

describe("RedVsBlue Phase 1 API", () => {
  it("clamps out-of-range rules and returns warnings", async () => {
    server = await startServer();
    const response = await fetch(`${getServerUrl(server)}/api/redvsblue/match/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matchId: "match-1",
        rulesVersion: "v1",
        proposedRules: {
          shipSpeed: 999,
          bulletSpeed: -5,
          bulletDamage: 200,
          shipMaxHealth: 5,
        },
        clientConfig: {
          snapshotIntervalMs: 99999,
        },
      }),
    });

    expect(response.ok).toBe(true);
    const body = await response.json();
    expect(body.effectiveRules.shipSpeed).toBeLessThan(999);
    expect(body.effectiveRules.bulletSpeed).toBeGreaterThan(0);
    expect(body.warnings.length).toBeGreaterThan(0);
    expect(body.effectiveConfig.snapshotIntervalMs).toBeLessThan(99999);
  });

  it("rejects oversized snapshots with structured errors", async () => {
    server = await startServer();
    const baseUrl = getServerUrl(server);

    const start = await fetch(`${baseUrl}/api/redvsblue/match/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId: "match-2", rulesVersion: "v1" }),
    });

    expect(start.ok).toBe(true);

    const oversizedEvents = Array.from({ length: 51 }, (_, index) => ({
      type: "event",
      timestamp: Date.now() + index,
    }));

    const snapshotResponse = await fetch(`${baseUrl}/api/redvsblue/match/match-2/snapshot`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        timestamp: Date.now(),
        snapshotId: "snap-1",
        gameSummary: { redCount: 1, blueCount: 1, totalShips: 2 },
        counts: { red: 1, blue: 1 },
        recentMajorEvents: oversizedEvents,
      }),
    });

    expect(snapshotResponse.status).toBe(400);
    const payload = await snapshotResponse.json();
    expect(payload.error).toBe("Invalid request");
    expect(payload.matchId).toBe("match-2");
    expect(payload.requestId).toBeTruthy();
  });

  it("returns commentary for ask endpoint", async () => {
    server = await startServer();
    const baseUrl = getServerUrl(server);

    await fetch(`${baseUrl}/api/redvsblue/match/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId: "match-3", rulesVersion: "v1" }),
    });

    const response = await fetch(`${baseUrl}/api/redvsblue/match/match-3/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: "Status?" }),
    });

    expect(response.ok).toBe(true);
    const payload = await response.json();
    expect(payload.commentary).toBeTruthy();
  });

  it("uses provided snapshot in ask request to generate commentary reflecting counts", async () => {    server = await startServer();
    const baseUrl = getServerUrl(server);

    await fetch(`${baseUrl}/api/redvsblue/match/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId: "match-4", rulesVersion: "v1" }),
    });

    const snapshot = {
      timestamp: Date.now(),
      snapshotId: "snap-ask-1",
      gameSummary: { redCount: 3, blueCount: 1, totalShips: 4 },
      counts: { red: 3, blue: 1 },
      recentMajorEvents: [],
    };

    const response = await fetch(`${baseUrl}/api/redvsblue/match/match-4/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: "Status?", snapshot }),
    });

    expect(response.ok).toBe(true);
    const body = await response.json();
    expect(body.commentary).toContain("ahead by 2");
  });

  it("ask with snapshot.requestDecision true triggers decision flow and returns validatedDecision", async () => {
    server = await startServer();
    const baseUrl = getServerUrl(server);

    await fetch(`${baseUrl}/api/redvsblue/match/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId: "match-5", rulesVersion: "v1" }),
    });

    const copilot = await import("../../../src/backend/src/services/copilot.js");
    const spy = vi.spyOn(copilot, "callCopilotService").mockResolvedValue({
      success: true,
      output: JSON.stringify({ requestId: "r1", type: "spawnShips", params: { team: "red", count: 2 } }),
    });

    const snapshot = {
      timestamp: Date.now(),
      snapshotId: "snap-ask-2",
      gameSummary: { redCount: 1, blueCount: 1, totalShips: 2 },
      counts: { red: 1, blue: 1 },
      recentMajorEvents: [],
      requestDecision: true,
    };

    const response = await fetch(`${baseUrl}/api/redvsblue/match/match-5/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: "Make a move", snapshot }),
    });

    expect(response.ok).toBe(true);
    const body = await response.json();
    expect(body.validatedDecision).toBeTruthy();
    expect(body.validatedDecision.type).toBe("spawnShips");

    spy.mockRestore();
  });
});
