import { z } from "zod";

export const MatchStartSchema = z.object({
  // matchId is later used as part of the persisted session filename. Restrict it to a
  // filename-safe token (UUIDs and our browser fallback IDs are both compatible).
  matchId: z
    .string()
    .min(1)
    .max(128)
    .regex(/^[A-Za-z0-9_-]+$/, "matchId must be a URL/filename-safe id"),
  rulesVersion: z.string().min(1).default("v1"),
  proposedRules: z
    .object({
      shipSpeed: z.number().finite().optional(),
      bulletSpeed: z.number().finite().optional(),
      bulletDamage: z.number().finite().optional(),
      shipMaxHealth: z.number().finite().optional(),
    })
    .default({}),
  clientConfig: z
    .object({
      snapshotIntervalMs: z.number().int().positive().finite().optional(),
    })
    .default({}),
});

export const SnapshotSchema = z.object({
  timestamp: z.number().finite(),
  snapshotId: z.string().min(1),
  gameSummary: z.object({
    redCount: z.number().int().min(0),
    blueCount: z.number().int().min(0),
    totalShips: z.number().int().min(0),
  }),
  counts: z.object({
    red: z.number().int().min(0),
    blue: z.number().int().min(0),
  }),
  recentMajorEvents: z
    .array(
      z.object({
        type: z.string().min(1),
        timestamp: z.number().finite(),
        team: z.enum(["red", "blue"]).optional(),
        summary: z.string().optional(),
      })
    )
    .max(50),
  requestDecision: z.boolean().optional(),
  requestOverrides: z.boolean().optional(),
});

export const AskSchema = z.object({
  question: z.string().min(1).max(500).optional(),
  snapshot: SnapshotSchema.optional(),
});

export type MatchStartRequest = z.infer<typeof MatchStartSchema>;
export type SnapshotRequest = z.infer<typeof SnapshotSchema>;
export type AskRequest = z.infer<typeof AskSchema>;