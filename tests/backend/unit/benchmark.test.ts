
import { randomUUID } from "node:crypto";
import { describe, test } from "vitest";
import { createMatchSession, recordSnapshot, recordSnapshots } from "../../../src/backend/src/services/redvsblue/session.js";
import { SnapshotPayload } from "../../../src/backend/src/services/redvsblue-types.js";

describe("Performance Benchmark", () => {
  const count = 1000;
  const snapshotPayload: SnapshotPayload = {
    timestamp: Date.now(),
    snapshotId: randomUUID(),
    gameSummary: { redCount: 0, blueCount: 0, totalShips: 0 },
    counts: { red: 0, blue: 0 },
    recentMajorEvents: [
      { type: "ship_destroyed", team: "red", timestamp: Date.now() },
      { type: "ship_spawned", team: "blue", timestamp: Date.now() },
    ],
  };

  test("Recording snapshots individually", () => {
    const session = createMatchSession({
      matchId: "test-match-individual",
      sessionId: "test-session-individual",
      rulesVersion: "v1",
      proposedRules: {},
      clientConfig: {},
      now: Date.now(),
    });

    console.time(`Recording ${count} snapshots individually`);
    for (let i = 0; i < count; i++) {
      const fakeSnapshot = { ...snapshotPayload, snapshotId: randomUUID() };
      recordSnapshot(session, fakeSnapshot);
    }
    console.timeEnd(`Recording ${count} snapshots individually`);
  });

  test("Recording snapshots in batch", () => {
    const session = createMatchSession({
      matchId: "test-match-batch",
      sessionId: "test-session-batch",
      rulesVersion: "v1",
      proposedRules: {},
      clientConfig: {},
      now: Date.now(),
    });

    const fakeSnapshots: SnapshotPayload[] = [];
    for (let i = 0; i < count; i++) {
      fakeSnapshots.push({ ...snapshotPayload, snapshotId: randomUUID() });
    }

    console.time(`Recording ${count} snapshots in batch`);
    recordSnapshots(session, fakeSnapshots);
    console.timeEnd(`Recording ${count} snapshots in batch`);
  });
});
