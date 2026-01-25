import { randomUUID } from "node:crypto";
import cors from "cors";
import express from "express";
import { z } from "zod";

// Mode types for safety toggles
export type ChatMode = "explain-only" | "project-helper";

const ChatRequestSchema = z.object({
  prompt: z.string().min(1).max(20_000),
  mode: z.enum(["explain-only", "project-helper"]).default("explain-only"),
});

type CopilotError = {
  error?: string;
  errorType?: string;
};

type CopilotCallResult = {
  success: boolean;
  output?: string;
  error?: string;
  errorType?: string;
};

type CopilotStreamResult = {
  success: boolean;
  response?: Response;
  error?: string;
  errorType?: string;
  status?: number;
};

type MatchRules = {
  shipSpeed: number;
  bulletSpeed: number;
  bulletDamage: number;
  shipMaxHealth: number;
};

type MatchConfig = {
  snapshotIntervalMs: number;
};

type RuleWarning = {
  field: string;
  message: string;
  requested: number;
  applied: number;
};

type MatchSession = {
  matchId: string;
  sessionId: string;
  rulesVersion: string;
  effectiveRules: MatchRules;
  effectiveConfig: MatchConfig;
  warnings: RuleWarning[];
  snapshots: SnapshotPayload[];
  decisionState: DecisionState;
  decisionHistory: DecisionAuditRecord[];
  createdAt: number;
  updatedAt: number;
};

type Team = "red" | "blue";

type DecisionProposal = {
  requestId: string;
  type: "spawnShips";
  params: {
    team: Team;
    count: number;
  };
  confidence?: number;
  reason?: string;
};

type ValidatedDecision = {
  requestId: string;
  type: "spawnShips";
  params: {
    team: Team;
    count: number;
  };
  warnings: string[];
};

type DecisionAuditRecord = {
  requestId: string;
  matchId: string;
  sessionId: string;
  status: "accepted" | "rejected" | "invalid";
  proposedDecision?: DecisionProposal;
  validatedDecision?: ValidatedDecision;
  reason?: string;
  warnings?: string[];
  timestamp: number;
};

type DecisionState = {
  lastDecisionAt: number | null;
  recentSpawns: Array<{ timestamp: number; count: number }>;
  appliedDecisionIds: Set<string>;
};

const MatchStartSchema = z.object({
  matchId: z.string().min(1),
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

const SnapshotSchema = z.object({
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
});

const AskSchema = z.object({
  question: z.string().min(1).max(500).optional(),
});

type SnapshotPayload = z.infer<typeof SnapshotSchema>;

const RULE_RANGES = {
  shipSpeed: { min: 1, max: 10, default: 5 },
  bulletSpeed: { min: 2, max: 20, default: 8 },
  bulletDamage: { min: 1, max: 50, default: 10 },
  shipMaxHealth: { min: 10, max: 100, default: 30 },
};

const CONFIG_RANGES = {
  snapshotIntervalMs: { min: 250, max: 10_000, default: 2_000 },
};

const MAX_SNAPSHOT_BUFFER = 120;
const DECISION_LIMITS = {
  maxSpawnPerDecision: 5,
  maxSpawnPerMinute: 15,
  cooldownMs: 5_000,
};

const DecisionProposalSchema = z.object({
  requestId: z.string().min(1),
  type: z.literal("spawnShips"),
  params: z.object({
    team: z.enum(["red", "blue"]),
    count: z.number().int().min(1).max(50),
  }),
  confidence: z.number().min(0).max(1).optional(),
  reason: z.string().min(1).max(500).optional(),
});

const matchStore = new Map<string, MatchSession>();

function clampNumber(
  value: number | undefined,
  range: { min: number; max: number; default: number },
  warnings: RuleWarning[],
  field: string
): number {
  const requested = value ?? range.default;
  let applied = requested;
  if (requested < range.min) {
    applied = range.min;
  }
  if (requested > range.max) {
    applied = range.max;
  }
  if (applied !== requested) {
    warnings.push({
      field,
      requested,
      applied,
      message: `${field} clamped to ${applied}`,
    });
  }
  return applied;
}

function buildEffectiveRules(proposedRules: z.infer<typeof MatchStartSchema>["proposedRules"]): {
  effectiveRules: MatchRules;
  warnings: RuleWarning[];
} {
  const warnings: RuleWarning[] = [];
  const effectiveRules: MatchRules = {
    shipSpeed: clampNumber(proposedRules.shipSpeed, RULE_RANGES.shipSpeed, warnings, "shipSpeed"),
    bulletSpeed: clampNumber(
      proposedRules.bulletSpeed,
      RULE_RANGES.bulletSpeed,
      warnings,
      "bulletSpeed"
    ),
    bulletDamage: clampNumber(
      proposedRules.bulletDamage,
      RULE_RANGES.bulletDamage,
      warnings,
      "bulletDamage"
    ),
    shipMaxHealth: clampNumber(
      proposedRules.shipMaxHealth,
      RULE_RANGES.shipMaxHealth,
      warnings,
      "shipMaxHealth"
    ),
  };
  return { effectiveRules, warnings };
}

function buildEffectiveConfig(
  clientConfig: z.infer<typeof MatchStartSchema>["clientConfig"],
  warnings: RuleWarning[]
): MatchConfig {
  return {
    snapshotIntervalMs: clampNumber(
      clientConfig.snapshotIntervalMs,
      CONFIG_RANGES.snapshotIntervalMs,
      warnings,
      "snapshotIntervalMs"
    ),
  };
}

function generateCommentary(session: MatchSession): string {
  const lastSnapshot = session.snapshots.at(-1);
  if (!lastSnapshot) {
    return "The battle is underway. Spawn a few ships to get the action going.";
  }
  const { red, blue } = lastSnapshot.counts;
  if (red === blue) {
    return `It's dead even: ${red} red ships vs ${blue} blue ships.`;
  }
  const leader = red > blue ? "Red" : "Blue";
  const trailing = red > blue ? "Blue" : "Red";
  const lead = Math.abs(red - blue);
  return `${leader} team leads by ${lead} ships. ${trailing} team needs a counter-attack.`;
}

function buildDecisionPrompt(session: MatchSession, snapshot: SnapshotPayload, decisionRequestId: string): string {
  const red = snapshot.counts.red;
  const blue = snapshot.counts.blue;
  const leader = red === blue ? "even" : red > blue ? "red" : "blue";
  const imbalance = Math.abs(red - blue);
  return [
    "You are the Red vs Blue AI Director.",
    "Return ONLY valid JSON that matches the schema below.",
    "Schema:",
    '{ "requestId": "<string>", "type": "spawnShips", "params": { "team": "red|blue", "count": <1-5> }, "confidence": <0-1 optional>, "reason": "<short text optional>" }',
    `requestId must equal: ${decisionRequestId}`,
    `Snapshot summary: red=${red}, blue=${blue}, total=${snapshot.gameSummary.totalShips}.`,
    `Balance status: leader=${leader}, imbalance=${imbalance}.`,
    "Choose a team that needs help and spawn 1-5 ships.",
  ].join("\n");
}

function parseDecisionProposal(output: string): { proposal?: DecisionProposal; error?: string } {
  let raw: unknown;
  try {
    raw = JSON.parse(output);
  } catch (error) {
    return {
      error:
        error instanceof Error ? `Invalid JSON: ${error.message}` : "Invalid JSON response.",
    };
  }
  const parsed = DecisionProposalSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.message };
  }
  return { proposal: parsed.data };
}

function logDecisionAudit(record: DecisionAuditRecord): void {
  if (record.status === "accepted") {
    console.info("[redvsblue] decision accepted", record);
  } else if (record.status === "invalid") {
    console.warn("[redvsblue] decision invalid", record);
  } else {
    console.warn("[redvsblue] decision rejected", record);
  }
}

function validateDecision(
  session: MatchSession,
  proposal: DecisionProposal,
  now: number
): { validatedDecision?: ValidatedDecision; rejectionReason?: string } {
  const state = session.decisionState;
  if (state.appliedDecisionIds.has(proposal.requestId)) {
    return { rejectionReason: "Duplicate decision requestId" };
  }

  if (state.lastDecisionAt && now - state.lastDecisionAt < DECISION_LIMITS.cooldownMs) {
    return { rejectionReason: "Decision cooldown active" };
  }

  const recentSpawns = state.recentSpawns.filter(
    (entry) => now - entry.timestamp < 60_000
  );
  const usedSpawnCount = recentSpawns.reduce((sum, entry) => sum + entry.count, 0);
  let nextCount = proposal.params.count;
  const warnings: string[] = [];

  if (nextCount > DECISION_LIMITS.maxSpawnPerDecision) {
    warnings.push(
      `Clamped spawn count to ${DECISION_LIMITS.maxSpawnPerDecision} (max per decision)`
    );
    nextCount = DECISION_LIMITS.maxSpawnPerDecision;
  }

  const remainingAllowance = Math.max(
    0,
    DECISION_LIMITS.maxSpawnPerMinute - usedSpawnCount
  );
  if (remainingAllowance <= 0) {
    return { rejectionReason: "Per-minute spawn budget exhausted" };
  }
  if (nextCount > remainingAllowance) {
    warnings.push(`Clamped spawn count to ${remainingAllowance} (per-minute limit)`);
    nextCount = remainingAllowance;
  }

  if (nextCount <= 0) {
    return { rejectionReason: "No spawn allowance available" };
  }

  const validatedDecision: ValidatedDecision = {
    requestId: proposal.requestId,
    type: "spawnShips",
    params: {
      team: proposal.params.team,
      count: nextCount,
    },
    warnings,
  };

  session.decisionState.recentSpawns = recentSpawns;
  session.decisionState.lastDecisionAt = now;
  session.decisionState.recentSpawns.push({ timestamp: now, count: nextCount });
  session.decisionState.appliedDecisionIds.add(proposal.requestId);

  return { validatedDecision };
}

function logValidationFailure(context: { requestId: string; matchId?: string; sessionId?: string }, issues: unknown): void {
  console.warn("[redvsblue] validation failure", {
    requestId: context.requestId,
    matchId: context.matchId,
    sessionId: context.sessionId,
    issues,
  });
}

function logMatchFailure(context: { requestId: string; matchId?: string; sessionId?: string }, message: string): void {
  console.warn("[redvsblue] request rejected", {
    requestId: context.requestId,
    matchId: context.matchId,
    sessionId: context.sessionId,
    message,
  });
}

function getCopilotServiceUrl(): string {
  return process.env.COPILOT_SERVICE_URL || "http://localhost:3210";
}

/**
 * Calls the copilot service and returns the response (buffered)
 * Fallback for non-streaming mode.
 */
async function callCopilotService(
  prompt: string,
  mode: ChatMode = "explain-only"
): Promise<CopilotCallResult> {
  try {
    const response = await fetch(`${getCopilotServiceUrl()}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt, mode }),
    });

    if (!response.ok) {
      const errorData = (await response.json()) as CopilotError;
      return {
        success: false,
        error: errorData.error || "Copilot service returned an error",
        errorType: errorData.errorType,
      };
    }

    const data = (await response.json()) as { output?: string };
    return {
      success: true,
      output: data.output,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? `Failed to connect to copilot service: ${error.message}`
          : "Failed to connect to copilot service",
      errorType: "connection",
    };
  }
}

/**
 * Calls the copilot streaming endpoint and returns the response.
 */
async function callCopilotServiceStream(
  prompt: string,
  mode: ChatMode,
  signal: AbortSignal
): Promise<CopilotStreamResult> {
  try {
    const response = await fetch(`${getCopilotServiceUrl()}/chat/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/plain",
      },
      body: JSON.stringify({ prompt, mode }),
      signal,
    });

    if (response.status === 404) {
      return {
        success: false,
        error: "Streaming endpoint not available",
        errorType: "stream_unavailable",
        status: response.status,
      };
    }

    if (!response.ok) {
      let errorMessage = "Copilot service returned an error";
      let errorType: string | undefined;

      try {
        const errorData = (await response.json()) as CopilotError;
        errorMessage = errorData.error || errorMessage;
        errorType = errorData.errorType;
      } catch {
        // Ignore JSON parsing errors for non-JSON responses
      }

      return {
        success: false,
        error: errorMessage,
        errorType,
        status: response.status,
      };
    }

    if (!response.body) {
      return {
        success: false,
        error: "Copilot stream was empty",
        errorType: "stream_empty",
        status: response.status,
      };
    }

    return {
      success: true,
      response,
    };
  } catch (error) {
    if (signal.aborted) {
      return {
        success: false,
        error: "Request aborted",
        errorType: "aborted",
      };
    }

    return {
      success: false,
      error:
        error instanceof Error
          ? `Failed to connect to copilot service: ${error.message}`
          : "Failed to connect to copilot service",
      errorType: "connection",
    };
  }
}

function sendPlainTextError(
  res: express.Response,
  errorType: string | undefined,
  errorMessage: string
): void {
  let userMessage = errorMessage;
  let statusCode = 500;

  if (errorType === "token_missing") {
    userMessage =
      "GitHub Copilot is not configured. Please set GH_TOKEN environment variable on the server.";
    statusCode = 503;
  } else if (errorType === "auth") {
    userMessage =
      "GitHub Copilot authentication failed. Please check your token permissions.";
    statusCode = 401;
  } else if (errorType === "connection") {
    userMessage = "Could not connect to Copilot service. Please check if the service is running.";
    statusCode = 503;
  }

  res.status(statusCode);
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.send(`Error: ${userMessage}`);
}

export function createApp(): express.Express {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "backend" });
  });

  app.post("/api/redvsblue/match/start", (req, res) => {
    const requestId = randomUUID();
    const parsed = MatchStartSchema.safeParse(req.body);
    if (!parsed.success) {
      logValidationFailure({ requestId }, parsed.error.issues);
      res.status(400).json({ error: "Invalid request", issues: parsed.error.issues, requestId });
      return;
    }

    const { matchId, rulesVersion, proposedRules, clientConfig } = parsed.data;
    const { effectiveRules, warnings } = buildEffectiveRules(proposedRules);
    const effectiveConfig = buildEffectiveConfig(clientConfig, warnings);
    const sessionId = randomUUID();

    const now = Date.now();
    const session: MatchSession = {
      matchId,
      sessionId,
      rulesVersion,
      effectiveRules,
      effectiveConfig,
      warnings,
      snapshots: [],
      decisionState: {
        lastDecisionAt: null,
        recentSpawns: [],
        appliedDecisionIds: new Set(),
      },
      decisionHistory: [],
      createdAt: now,
      updatedAt: now,
    };

    matchStore.set(matchId, session);

    res.status(200).json({
      matchId,
      sessionId,
      rulesVersion,
      effectiveRules,
      effectiveConfig,
      warnings,
      requestId,
    });
  });

  app.post("/api/redvsblue/match/:matchId/snapshot", async (req, res) => {
    const requestId = randomUUID();
    const matchId = req.params.matchId;
    const session = matchStore.get(matchId);

    if (!session) {
      logMatchFailure({ requestId, matchId }, "Unknown matchId");
      res.status(404).json({ error: "Unknown matchId", requestId, matchId });
      return;
    }

    const parsed = SnapshotSchema.safeParse(req.body);
    if (!parsed.success) {
      logValidationFailure({ requestId, matchId, sessionId: session.sessionId }, parsed.error.issues);
      res.status(400).json({
        error: "Invalid request",
        issues: parsed.error.issues,
        requestId,
        matchId,
        sessionId: session.sessionId,
      });
      return;
    }

    const snapshotPayload = parsed.data;
    session.snapshots.push(snapshotPayload);
    if (session.snapshots.length > MAX_SNAPSHOT_BUFFER) {
      session.snapshots.splice(0, session.snapshots.length - MAX_SNAPSHOT_BUFFER);
    }
    session.updatedAt = Date.now();

    let notificationText: string | undefined;
    let validatedDecision: ValidatedDecision | undefined;
    let decisionRejectedReason: string | undefined;

    if (snapshotPayload.requestDecision) {
      const decisionRequestId = randomUUID();
      const prompt = buildDecisionPrompt(session, snapshotPayload, decisionRequestId);
      const decisionResult = await callCopilotService(prompt, "project-helper");
      const timestamp = Date.now();

      if (!decisionResult.success || !decisionResult.output) {
        const reason = decisionResult.error ?? "Decision request failed.";
        const record: DecisionAuditRecord = {
          requestId: decisionRequestId,
          matchId,
          sessionId: session.sessionId,
          status: "rejected",
          reason,
          timestamp,
        };
        session.decisionHistory.push(record);
        logDecisionAudit(record);
        decisionRejectedReason = reason;
      } else {
        const parsedDecision = parseDecisionProposal(decisionResult.output);
        if (!parsedDecision.proposal) {
          const reason = parsedDecision.error ?? "Invalid decision payload";
          const record: DecisionAuditRecord = {
            requestId: decisionRequestId,
            matchId,
            sessionId: session.sessionId,
            status: "invalid",
            reason,
            timestamp,
          };
          session.decisionHistory.push(record);
          logDecisionAudit(record);
          decisionRejectedReason = reason;
        } else if (parsedDecision.proposal.requestId !== decisionRequestId) {
          const reason = "Decision requestId mismatch";
          const record: DecisionAuditRecord = {
            requestId: decisionRequestId,
            matchId,
            sessionId: session.sessionId,
            status: "invalid",
            proposedDecision: parsedDecision.proposal,
            reason,
            timestamp,
          };
          session.decisionHistory.push(record);
          logDecisionAudit(record);
          decisionRejectedReason = reason;
        } else {
          const { validatedDecision: validated, rejectionReason } = validateDecision(
            session,
            parsedDecision.proposal,
            timestamp
          );
          if (!validated) {
            const record: DecisionAuditRecord = {
              requestId: decisionRequestId,
              matchId,
              sessionId: session.sessionId,
              status: "rejected",
              proposedDecision: parsedDecision.proposal,
              reason: rejectionReason ?? "Decision rejected by referee",
              timestamp,
            };
            session.decisionHistory.push(record);
            logDecisionAudit(record);
            decisionRejectedReason = record.reason;
          } else {
            validatedDecision = validated;
            notificationText =
              parsedDecision.proposal.reason ??
              `AI Director suggests spawning ${validated.params.count} ${validated.params.team} ships.`;
            const record: DecisionAuditRecord = {
              requestId: decisionRequestId,
              matchId,
              sessionId: session.sessionId,
              status: "accepted",
              proposedDecision: parsedDecision.proposal,
              validatedDecision: validated,
              warnings: validated.warnings,
              timestamp,
            };
            session.decisionHistory.push(record);
            logDecisionAudit(record);
          }
        }
      }
    }

    res.status(200).json({
      ok: true,
      matchId,
      sessionId: session.sessionId,
      storedSnapshots: session.snapshots.length,
      requestId,
      notificationText,
      validatedDecision,
      decisionRejectedReason,
    });
  });

  app.post("/api/redvsblue/match/:matchId/ask", (req, res) => {
    const requestId = randomUUID();
    const matchId = req.params.matchId;
    const session = matchStore.get(matchId);

    if (!session) {
      logMatchFailure({ requestId, matchId }, "Unknown matchId");
      res.status(404).json({ error: "Unknown matchId", requestId, matchId });
      return;
    }

    const parsed = AskSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      logValidationFailure({ requestId, matchId, sessionId: session.sessionId }, parsed.error.issues);
      res.status(400).json({
        error: "Invalid request",
        issues: parsed.error.issues,
        requestId,
        matchId,
        sessionId: session.sessionId,
      });
      return;
    }

    const commentary = generateCommentary(session);

    res.status(200).json({
      matchId,
      sessionId: session.sessionId,
      commentary,
      requestId,
    });
  });

  app.post("/api/redvsblue/match/:matchId/end", (req, res) => {
    const requestId = randomUUID();
    const matchId = req.params.matchId;
    const session = matchStore.get(matchId);
    const sessionId = session?.sessionId;
    if (!session) {
      logMatchFailure({ requestId, matchId }, "Unknown matchId");
      res.status(404).json({ error: "Unknown matchId", requestId, matchId });
      return;
    }

    matchStore.delete(matchId);
    res.status(200).json({ ok: true, matchId, sessionId, requestId });
  });

  app.post("/api/chat", async (req, res) => {
    const parsed = ChatRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request", issues: parsed.error.issues });
      return;
    }

    const { prompt, mode } = parsed.data;

    if (mode === "explain-only") {
      console.log(`[backend] Mode: ${mode} - applying explain-only guardrails`);
    }

    const abortController = new AbortController();
    const handleAbort = () => abortController.abort();
    const handleClose = () => {
      if (!res.writableEnded) {
        abortController.abort();
      }
    };

    req.on("aborted", handleAbort);
    res.on("close", handleClose);

    const streamResult = await callCopilotServiceStream(
      prompt,
      mode,
      abortController.signal
    );

    if (streamResult.success && streamResult.response) {
      const body = streamResult.response.body;
      if (!body) {
        sendPlainTextError(res, "stream_empty", "Copilot stream was empty");
        req.off("aborted", handleAbort);
        res.off("close", handleClose);
        return;
      }

      const reader = body.getReader();
      const firstChunk = await reader.read();

      if (firstChunk.done) {
        req.off("aborted", handleAbort);
        res.off("close", handleClose);

        const fallbackResult = await callCopilotService(prompt, mode);
        if (!fallbackResult.success) {
          sendPlainTextError(
            res,
            fallbackResult.errorType,
            fallbackResult.error || "An error occurred"
          );
          return;
        }

        res.status(200);
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.send(fallbackResult.output || "");
        return;
      }

      res.status(200);
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache, no-transform");

      if (typeof res.flushHeaders === "function") {
        res.flushHeaders();
      }

      if (firstChunk.value) {
        res.write(Buffer.from(firstChunk.value));
      }

      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done || abortController.signal.aborted) {
            break;
          }
          if (value) {
            res.write(Buffer.from(value));
          }
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.warn("[backend] Streaming error", error);
        }
      } finally {
        res.end();
      }

      req.off("aborted", handleAbort);
      res.off("close", handleClose);
      return;
    }

    if (streamResult.errorType !== "stream_unavailable") {
      sendPlainTextError(res, streamResult.errorType, streamResult.error || "Streaming failed");
      req.off("aborted", handleAbort);
      res.off("close", handleClose);
      return;
    }

    const result = await callCopilotService(prompt, mode);

    if (!result.success) {
      sendPlainTextError(res, result.errorType, result.error || "An error occurred");
      req.off("aborted", handleAbort);
      res.off("close", handleClose);
      return;
    }

    res.status(200);
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.send(result.output || "");
    req.off("aborted", handleAbort);
    res.off("close", handleClose);
  });

  return app;
}
