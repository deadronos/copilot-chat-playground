import { describe, expect, it } from "vitest";

import { ChatRequestSchema } from "../../../src/backend/src/schemas/chat.js";
import { AskSchema, MatchStartSchema, SnapshotSchema } from "../../../src/backend/src/schemas/match.js";

describe("backend request schemas", () => {
  it("validates chat requests and defaults the mode", () => {
    const parsed = ChatRequestSchema.safeParse({ prompt: "Hello" });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.mode).toBe("explain-only");
    }
  });

  it("rejects empty chat prompts", () => {
    const parsed = ChatRequestSchema.safeParse({ prompt: "" });
    expect(parsed.success).toBe(false);
  });

  it("accepts match start payloads with defaults", () => {
    const parsed = MatchStartSchema.safeParse({ matchId: "match-1" });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.rulesVersion).toBe("v1");
      expect(parsed.data.proposedRules).toEqual({});
    }
  });

  it("rejects match start payloads with unsafe match ids", () => {
    const parsed = MatchStartSchema.safeParse({ matchId: "../escape" });
    expect(parsed.success).toBe(false);
  });

  it("validates snapshot payloads", () => {
    const parsed = SnapshotSchema.safeParse({
      timestamp: Date.now(),
      snapshotId: "snap-1",
      gameSummary: { redCount: 1, blueCount: 1, totalShips: 2 },
      counts: { red: 1, blue: 1 },
      recentMajorEvents: [],
    });
    expect(parsed.success).toBe(true);
  });

  it("accepts ask payloads with optional snapshot", () => {
    const parsed = AskSchema.safeParse({ question: "Status?" });
    expect(parsed.success).toBe(true);
  });
});