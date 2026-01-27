import request from "supertest";
import { describe, expect, test } from "vitest";
import { createApp } from "../app";

describe("matchController - unknown match", () => {
  test("POST /api/redvsblue/match/:id/snapshot returns structured 404", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/api/redvsblue/match/unknown123/snapshot")
      .send({
        timestamp: Date.now(),
        snapshotId: "s",
        gameSummary: { redCount: 0, blueCount: 0, totalShips: 0 },
        counts: { red: 0, blue: 0 },
        recentMajorEvents: [],
        requestDecision: false,
        requestOverrides: false,
      })
      .set("Content-Type", "application/json");

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("errorCode", "MATCH_NOT_FOUND");
    expect(res.body).toHaveProperty("actions");
    expect(Array.isArray(res.body.actions)).toBe(true);
    expect(res.body.actions).toContain("refresh_match");
  });

  test("POST /api/redvsblue/match/:id/ask returns structured 404", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/api/redvsblue/match/unknown123/ask")
      .send({ question: "status" })
      .set("Content-Type", "application/json");

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("errorCode", "MATCH_NOT_FOUND");
    expect(res.body).toHaveProperty("actions");
    expect(Array.isArray(res.body.actions)).toBe(true);
    expect(res.body.actions).toContain("refresh_match");
  });
});