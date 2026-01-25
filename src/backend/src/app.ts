import { randomUUID } from "node:crypto";
import cors from "cors";
import express from "express";
import { z } from "zod";
import { buildDecisionPrompt } from "@copilot-playground/shared";

import {
  callCopilotService,
  callCopilotServiceStream,
  sendPlainTextError,
  type ChatMode,
} from "./services/copilot.js";
import {
  createMatchSession,
  deleteMatchSession,
  generateCommentary,
  getMatchSession,
  loadPersistedSessions,
  persistMatchSession,
  recordSnapshot,
  removePersistedSession,
  setMatchSession,
  REHYDRATION_DECISION_TAIL,
} from "./services/match-store.js";
import {
  logDecisionAudit,
  logStructuredEvent,
  parseDecisionProposal,
  validateDecision,
} from "./services/decision-referee.js";
import type {
  DecisionAuditRecord,
  TraceContext,
  ValidatedDecision,
} from "./services/redvsblue-types.js";

const ChatRequestSchema = z.object({
  prompt: z.string().min(1).max(20_000),
  mode: z.enum(["explain-only", "project-helper"]).default("explain-only"),
});

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

function logValidationFailure(
  context: TraceContext,
  issues: unknown,
  req?: express.Request
): void {
  logStructuredEvent("warn", "validation failure", context, {
    issues,
    method: req?.method,
    path: req?.path,
  });
}

function logMatchFailure(
  context: TraceContext,
  message: string,
  req?: express.Request
): void {
  logStructuredEvent("warn", "request rejected", context, {
    message,
    method: req?.method,
    path: req?.path,
  });
}

export function createApp(): express.Express {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  loadPersistedSessions();

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "backend" });
  });

  app.post("/api/redvsblue/match/start", async (req, res) => {
    const traceId = randomUUID();
    const requestId = randomUUID();
    const parsed = MatchStartSchema.safeParse(req.body);
    if (!parsed.success) {
      logValidationFailure({ traceId, requestId }, parsed.error.issues, req);
      res.status(400).json({
        error: "Invalid request",
        issues: parsed.error.issues,
        requestId,
        traceId,
      });
      return;
    }

    const { matchId, rulesVersion, proposedRules, clientConfig } = parsed.data;
    const sessionId = randomUUID();

    const now = Date.now();
    const session = createMatchSession({
      matchId,
      sessionId,
      rulesVersion,
      proposedRules,
      clientConfig,
      now,
    });

    setMatchSession(matchId, session);
    await persistMatchSession(session);

    res.status(200).json({
      matchId,
      sessionId,
      rulesVersion,
      effectiveRules: session.effectiveRules,
      effectiveConfig: session.effectiveConfig,
      warnings: session.warnings,
      requestId,
      traceId,
    });
  });

  app.post("/api/redvsblue/match/:matchId/snapshot", async (req, res) => {
    const traceId = randomUUID();
    const requestId = randomUUID();
    const matchId = req.params.matchId;
    const session = getMatchSession(matchId);

    if (!session) {
      logMatchFailure({ traceId, requestId, matchId }, "Unknown matchId", req);
      res.status(404).json({ error: "Unknown matchId", requestId, matchId, traceId });
      return;
    }

    const parsed = SnapshotSchema.safeParse(req.body);
    if (!parsed.success) {
      logValidationFailure(
        { traceId, requestId, matchId, sessionId: session.sessionId },
        parsed.error.issues,
        req
      );
      res.status(400).json({
        error: "Invalid request",
        issues: parsed.error.issues,
        requestId,
        matchId,
        sessionId: session.sessionId,
        traceId,
      });
      return;
    }

    const snapshotPayload = parsed.data;
    recordSnapshot(session, snapshotPayload);

    let notificationText: string | undefined;
    let validatedDecision: ValidatedDecision | undefined;
    let decisionRejectedReason: string | undefined;

    const baseCommentary = generateCommentary(session);
    notificationText = baseCommentary;
    if (!notificationText || notificationText.trim().length === 0) {
      notificationText =
        "Match update: Red and Blue are still trading shots. Stay tuned for the next swing.";
    }

    if (snapshotPayload.requestDecision) {
      const decisionRequestId = randomUUID();
      const prompt = buildDecisionPrompt(session, snapshotPayload, decisionRequestId, {
        decisionTail: REHYDRATION_DECISION_TAIL,
      });
      const decisionResult = await callCopilotService(prompt, "project-helper");
      const timestamp = Date.now();

      if (!decisionResult.success || !decisionResult.output) {
        const reason = decisionResult.error ?? "Decision request failed.";
        const record: DecisionAuditRecord = {
          requestId: decisionRequestId,
          matchId,
          sessionId: session.sessionId,
          traceId,
          status: "rejected",
          reason,
          timestamp,
        };
        session.decisionHistory.push(record);
        logDecisionAudit(record, { traceId, requestId: decisionRequestId, matchId, sessionId: session.sessionId });
        logStructuredEvent(
          "warn",
          "decision error",
          {
            traceId,
            requestId: decisionRequestId,
            matchId,
            sessionId: session.sessionId,
          },
          {
            error: reason,
            errorType: decisionResult.errorType ?? "unknown",
          }
        );
        decisionRejectedReason = reason;
      } else {
        const parsedDecision = parseDecisionProposal(decisionResult.output);
        if (!parsedDecision.proposal) {
          const reason = parsedDecision.error ?? "Invalid decision payload";
          const record: DecisionAuditRecord = {
            requestId: decisionRequestId,
            matchId,
            sessionId: session.sessionId,
            traceId,
            status: "invalid",
            reason,
            timestamp,
          };
          session.decisionHistory.push(record);
          logDecisionAudit(record, { traceId, requestId: decisionRequestId, matchId, sessionId: session.sessionId });
          logStructuredEvent(
            "warn",
            "decision parse error",
            {
              traceId,
              requestId: decisionRequestId,
              matchId,
              sessionId: session.sessionId,
            },
            { error: reason }
          );
          decisionRejectedReason = reason;
        } else if (parsedDecision.proposal.requestId !== decisionRequestId) {
          const reason = "Decision requestId mismatch";
          const record: DecisionAuditRecord = {
            requestId: decisionRequestId,
            matchId,
            sessionId: session.sessionId,
            traceId,
            status: "invalid",
            proposedDecision: parsedDecision.proposal,
            reason,
            timestamp,
          };
          session.decisionHistory.push(record);
          logDecisionAudit(record, { traceId, requestId: decisionRequestId, matchId, sessionId: session.sessionId });
          logStructuredEvent(
            "warn",
            "decision requestId mismatch",
            {
              traceId,
              requestId: decisionRequestId,
              matchId,
              sessionId: session.sessionId,
            },
            { error: reason }
          );
          decisionRejectedReason = reason;
        } else {
          const { validatedDecision: validated, rejectionReason } = validateDecision(
            session.decisionState,
            parsedDecision.proposal,
            timestamp
          );
          if (!validated) {
            const record: DecisionAuditRecord = {
              requestId: decisionRequestId,
              matchId,
              sessionId: session.sessionId,
              traceId,
              status: "rejected",
              proposedDecision: parsedDecision.proposal,
              reason: rejectionReason ?? "Decision rejected by referee",
              timestamp,
            };
            session.decisionHistory.push(record);
            logDecisionAudit(record, { traceId, requestId: decisionRequestId, matchId, sessionId: session.sessionId });
            decisionRejectedReason = record.reason;
          } else {
            validatedDecision = validated;
            const decisionNote =
              parsedDecision.proposal.reason ??
              `AI Director suggests spawning ${validated.params.count} ${validated.params.team} ships.`;
            notificationText = `${notificationText} ${decisionNote}`.trim();
            const record: DecisionAuditRecord = {
              requestId: decisionRequestId,
              matchId,
              sessionId: session.sessionId,
              traceId,
              status: "accepted",
              proposedDecision: parsedDecision.proposal,
              validatedDecision: validated,
              warnings: validated.warnings,
              timestamp,
            };
            session.decisionHistory.push(record);
            logDecisionAudit(record, { traceId, requestId: decisionRequestId, matchId, sessionId: session.sessionId });
          }
        }
      }
    }

    await persistMatchSession(session);

    res.status(200).json({
      ok: true,
      matchId,
      sessionId: session.sessionId,
      storedSnapshots: session.snapshots.length,
      requestId,
      traceId,
      notificationText,
      validatedDecision,
      decisionRejectedReason,
    });
  });

  app.post("/api/redvsblue/match/:matchId/ask", (req, res) => {
    const traceId = randomUUID();
    const requestId = randomUUID();
    const matchId = req.params.matchId;
    const session = getMatchSession(matchId);

    if (!session) {
      logMatchFailure({ traceId, requestId, matchId }, "Unknown matchId", req);
      res.status(404).json({ error: "Unknown matchId", requestId, matchId, traceId });
      return;
    }

    const parsed = AskSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      logValidationFailure(
        { traceId, requestId, matchId, sessionId: session.sessionId },
        parsed.error.issues,
        req
      );
      res.status(400).json({
        error: "Invalid request",
        issues: parsed.error.issues,
        requestId,
        matchId,
        sessionId: session.sessionId,
        traceId,
      });
      return;
    }

    let commentary = generateCommentary(session);
    if (!commentary || commentary.trim().length === 0) {
      commentary =
        "Match update: Red and Blue are still trading shots. Stay tuned for the next swing.";
    }

    res.status(200).json({
      matchId,
      sessionId: session.sessionId,
      commentary,
      requestId,
      traceId,
    });
  });

  app.post("/api/redvsblue/match/:matchId/end", async (req, res) => {
    const traceId = randomUUID();
    const requestId = randomUUID();
    const matchId = req.params.matchId;
    const session = getMatchSession(matchId);
    const sessionId = session?.sessionId;
    if (!session) {
      logMatchFailure({ traceId, requestId, matchId }, "Unknown matchId", req);
      res.status(404).json({ error: "Unknown matchId", requestId, matchId, traceId });
      return;
    }

    deleteMatchSession(matchId);
    await removePersistedSession(matchId);
    res.status(200).json({ ok: true, matchId, sessionId, requestId, traceId });
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
      mode as ChatMode,
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

        const fallbackResult = await callCopilotService(prompt, mode as ChatMode);
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

    const result = await callCopilotService(prompt, mode as ChatMode);

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
