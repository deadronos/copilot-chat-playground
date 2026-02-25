import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import { buildDecisionPrompt } from "@copilot-playground/shared";

import { logDecisionAudit, logMatchFailure, logStructuredEvent, logValidationFailure } from "../lib/logging.js";
import {
  callCopilotService,
} from "../services/copilot.js";
import {
  createMatchSession,
  deleteMatchSession,
  generateCommentary,
  getMatchSession,
  persistMatchSession,
  recordSnapshot,
  removePersistedSession,
  setMatchSession,
  REHYDRATION_DECISION_TAIL,
} from "../services/redvsblue/session.js";
import {
  parseDecisionProposal,
  validateDecision,
} from "../services/decision-referee.js";
import type {
  DecisionAuditRecord,
  SnapshotPayload,
  ValidatedDecision,
} from "../services/redvsblue-types.js";
import { AskSchema, MatchStartSchema, SnapshotSchema } from "../schemas/match.js";

// matchId is used as a key in the in-memory match store and (indirectly) as a persisted-session
// identifier. Keep it constrained to a filename-safe token.
const MATCH_ID_PARAM_RE = /^[A-Za-z0-9_-]{1,128}$/;

function parseMatchIdParam(matchId: string | string[] | undefined): string | null {
  const value = Array.isArray(matchId) ? matchId[0] : matchId;
  if (!value || !MATCH_ID_PARAM_RE.test(value)) {
    return null;
  }
  return value;
}

function resolveCommentary(baseCommentary: string | undefined): string {
  if (!baseCommentary || baseCommentary.trim().length === 0) {
    return "Match update: Red and Blue are still trading shots. Stay tuned for the next swing.";
  }

  return baseCommentary;
}

export async function startMatch(req: Request, res: Response): Promise<void> {
  const traceId = randomUUID();
  const requestId = randomUUID();
  const action = (req.get && (req.get("x-action") || req.get("X-Action"))) ?? undefined;
  logStructuredEvent("info", "match.start.received", { traceId, requestId }, {
    method: req.method,
    path: req.path,
    action,
  });
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

  if (action === "refresh_match") {
    logStructuredEvent("info", "match.start.rejoin", { traceId, requestId, matchId, sessionId }, {
      action,
    });
  }

  logStructuredEvent(
    "info",
    "match.start.success",
    { traceId, requestId, matchId, sessionId },
    {
      rulesVersion,
      effectiveRules: session.effectiveRules,
      effectiveConfig: session.effectiveConfig,
      warnings: session.warnings,
      action,
    }
  );

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
}

export async function submitSnapshot(req: Request, res: Response): Promise<void> {
  const traceId = randomUUID();
  const requestId = randomUUID();
  const matchId = parseMatchIdParam(req.params.matchId);
  if (!matchId) {
    logValidationFailure({ traceId, requestId }, [{ path: ["params", "matchId"], message: "Invalid matchId" }], req);
    res.status(400).json({ error: "Invalid matchId", requestId, traceId });
    return;
  }
  logStructuredEvent("info", "match.snapshot.received", { traceId, requestId, matchId }, {
    method: req.method,
    path: req.path,
  });
  const session = getMatchSession(matchId);

  if (!session) {
    logMatchFailure({ traceId, requestId, matchId }, "Unknown matchId", req);
    // Structured error so clients can take an action (eg. refresh/restart a match)
    res.status(404).json({
      error: "Unknown matchId",
      errorCode: "MATCH_NOT_FOUND",
      message: "Match not found",
      matchId,
      requestId,
      traceId,
      actions: ["refresh_match"],
    });
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
  logStructuredEvent(
    "info",
    "match.snapshot.recorded",
    {
      traceId,
      requestId,
      matchId,
      sessionId: session.sessionId,
    },
    {
      storedSnapshots: session.snapshots.length,
      requestDecision: snapshotPayload.requestDecision ?? false,
    }
  );

  let notificationText = resolveCommentary(generateCommentary(session));
  let validatedDecision: ValidatedDecision | undefined;
  let decisionRejectedReason: string | undefined;

  if (snapshotPayload.requestDecision) {
    const decisionRequestId = randomUUID();
    logStructuredEvent("info", "match.decision.requested", {
      traceId,
      requestId: decisionRequestId,
      matchId,
      sessionId: session.sessionId,
    });
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
      logDecisionAudit(record, {
        traceId,
        requestId: decisionRequestId,
        matchId,
        sessionId: session.sessionId,
      });
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
      logStructuredEvent("warn", "match.decision.rejected", {
        traceId,
        requestId: decisionRequestId,
        matchId,
        sessionId: session.sessionId,
      }, { reason });
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
        logDecisionAudit(record, {
          traceId,
          requestId: decisionRequestId,
          matchId,
          sessionId: session.sessionId,
        });
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
        logStructuredEvent("warn", "match.decision.invalid", {
          traceId,
          requestId: decisionRequestId,
          matchId,
          sessionId: session.sessionId,
        }, { reason });
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
        logDecisionAudit(record, {
          traceId,
          requestId: decisionRequestId,
          matchId,
          sessionId: session.sessionId,
        });
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
        logStructuredEvent("warn", "match.decision.invalid", {
          traceId,
          requestId: decisionRequestId,
          matchId,
          sessionId: session.sessionId,
        }, { reason });
      } else {
        const { validatedDecision: validated, rejectionReason } = validateDecision(
          session.decisionState,
          parsedDecision.proposal,
          timestamp,
          Boolean(snapshotPayload?.requestOverrides)
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
          logDecisionAudit(record, {
            traceId,
            requestId: decisionRequestId,
            matchId,
            sessionId: session.sessionId,
          });
          decisionRejectedReason = record.reason;
          logStructuredEvent("warn", "match.decision.rejected", {
            traceId,
            requestId: decisionRequestId,
            matchId,
            sessionId: session.sessionId,
          }, { reason: record.reason });
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
          logDecisionAudit(record, {
            traceId,
            requestId: decisionRequestId,
            matchId,
            sessionId: session.sessionId,
          });
          logStructuredEvent("info", "match.decision.accepted", {
            traceId,
            requestId: decisionRequestId,
            matchId,
            sessionId: session.sessionId,
          }, {
            team: validated.params.team,
            count: validated.params.count,
            warnings: validated.warnings,
          });
        }
      }
    }
  }

  await persistMatchSession(session);
  logStructuredEvent("info", "match.snapshot.response", {
    traceId,
    requestId,
    matchId,
    sessionId: session.sessionId,
  }, {
    notificationText,
    decisionRejectedReason,
    hasValidatedDecision: Boolean(validatedDecision),
  });

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
}

export async function askMatch(req: Request, res: Response): Promise<void> {
  const traceId = randomUUID();
  const requestId = randomUUID();
  const matchId = parseMatchIdParam(req.params.matchId);
  if (!matchId) {
    logValidationFailure({ traceId, requestId }, [{ path: ["params", "matchId"], message: "Invalid matchId" }], req);
    res.status(400).json({ error: "Invalid matchId", requestId, traceId });
    return;
  }
  logStructuredEvent("info", "match.ask.received", { traceId, requestId, matchId }, {
    method: req.method,
    path: req.path,
  });
  const session = getMatchSession(matchId);

  if (!session) {
    logMatchFailure({ traceId, requestId, matchId }, "Unknown matchId", req);
    // Structured error so clients can take an action (eg. refresh/restart a match)
    res.status(404).json({
      error: "Unknown matchId",
      errorCode: "MATCH_NOT_FOUND",
      message: "Match not found",
      matchId,
      requestId,
      traceId,
      actions: ["refresh_match"],
    });
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

  const data = parsed.data as { question?: string; snapshot?: unknown };
  if (data.snapshot) {
    try {
      const validated = SnapshotSchema.parse(data.snapshot);
      recordSnapshot(session, validated);
      await persistMatchSession(session);
    } catch (err) {
      logStructuredEvent(
        "warn",
        "ask.snapshot.record_failed",
        { traceId, requestId, matchId, sessionId: session.sessionId },
        {
          error: err instanceof Error ? err.message : String(err),
        }
      );
    }
  }

  let validatedDecision: {
    requestId: string;
    type: "spawnShips";
    params: { team: "red" | "blue"; count: number };
    warnings?: string[];
  } | undefined;
  let decisionRejectedReason: string | undefined;
  let didDecisionMutateSession = false;

  try {
    if (data.snapshot) {
      const snapshotPayload = SnapshotSchema.parse(data.snapshot);
      if (snapshotPayload.requestDecision) {
        const decisionRequestId = randomUUID();
        logStructuredEvent("info", "match.decision.requested", {
          traceId,
          requestId: decisionRequestId,
          matchId,
          sessionId: session.sessionId,
        });

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
          didDecisionMutateSession = true;
          logDecisionAudit(record, {
            traceId,
            requestId: decisionRequestId,
            matchId,
            sessionId: session.sessionId,
          });
          logStructuredEvent("warn", "decision error", {
            traceId,
            requestId: decisionRequestId,
            matchId,
            sessionId: session.sessionId,
          }, {
            error: reason,
            errorType: decisionResult.errorType ?? "unknown",
          });
          decisionRejectedReason = reason;
        } else {
          const { proposal, error: parseError } = parseDecisionProposal(decisionResult.output);
          if (!proposal || parseError) {
            const reason = parseError ?? "Invalid decision response";
            const record: DecisionAuditRecord = {
              requestId: decisionRequestId,
              matchId,
              sessionId: session.sessionId,
              traceId,
              status: "invalid",
              reason,
              timestamp,
              ...(proposal ? { proposedDecision: proposal } : {}),
            };
            session.decisionHistory.push(record);
            didDecisionMutateSession = true;
            logDecisionAudit(record, {
              traceId,
              requestId: decisionRequestId,
              matchId,
              sessionId: session.sessionId,
            });
            decisionRejectedReason = reason;
          } else {
            const { validatedDecision: validated, rejectionReason } = validateDecision(
              session.decisionState,
              proposal,
              Date.now(),
              Boolean(snapshotPayload.requestOverrides)
            );
            if (validated) {
              validatedDecision = validated;
              const record: DecisionAuditRecord = {
                requestId: decisionRequestId,
                matchId,
                sessionId: session.sessionId,
                traceId,
                status: "accepted",
                timestamp,
                validatedDecision: validated,
                warnings: validated.warnings,
              };
              session.decisionHistory.push(record);
              didDecisionMutateSession = true;
              logDecisionAudit(record, {
                traceId,
                requestId: decisionRequestId,
                matchId,
                sessionId: session.sessionId,
              });

              if (validated.type === "spawnShips") {
                for (let i = 0; i < validated.params.count; i += 1) {
                  const fakeSnapshot: SnapshotPayload = {
                    timestamp: Date.now(),
                    snapshotId: randomUUID(),
                    gameSummary: {
                      redCount:
                        validated.params.team === "red"
                          ? (snapshotPayload?.counts?.red ?? 0) + validated.params.count
                          : (snapshotPayload?.counts?.red ?? 0),
                      blueCount:
                        validated.params.team === "blue"
                          ? (snapshotPayload?.counts?.blue ?? 0) + validated.params.count
                          : (snapshotPayload?.counts?.blue ?? 0),
                      totalShips:
                        (snapshotPayload?.counts?.red ?? 0) +
                        (snapshotPayload?.counts?.blue ?? 0) +
                        validated.params.count,
                    },
                    counts: {
                      red:
                        validated.params.team === "red"
                          ? (snapshotPayload?.counts?.red ?? 0) + validated.params.count
                          : (snapshotPayload?.counts?.red ?? 0),
                      blue:
                        validated.params.team === "blue"
                          ? (snapshotPayload?.counts?.blue ?? 0) + validated.params.count
                          : (snapshotPayload?.counts?.blue ?? 0),
                    },
                    recentMajorEvents: [],
                  };
                  recordSnapshot(session, fakeSnapshot);
                  didDecisionMutateSession = true;
                }
              }
            } else {
              decisionRejectedReason = rejectionReason;
            }
          }
        }
      }
    }
  } catch (err) {
    logStructuredEvent(
      "warn",
      "ask.decision.failed",
      { traceId, requestId, matchId, sessionId: session.sessionId },
      {
        error: err instanceof Error ? err.message : String(err),
      }
    );
  }

  if (didDecisionMutateSession) {
    await persistMatchSession(session);
  }

  const commentary = resolveCommentary(generateCommentary(session));

  logStructuredEvent("info", "match.ask.response", {
    traceId,
    requestId,
    matchId,
    sessionId: session.sessionId,
  }, {
    commentaryLength: commentary.length,
    hasValidatedDecision: Boolean(validatedDecision),
  });

  res.status(200).json({
    matchId,
    sessionId: session.sessionId,
    commentary,
    validatedDecision,
    decisionRejectedReason,
    requestId,
    traceId,
  });
}

export async function endMatch(req: Request, res: Response): Promise<void> {
  const traceId = randomUUID();
  const requestId = randomUUID();
  const matchId = parseMatchIdParam(req.params.matchId);
  if (!matchId) {
    logValidationFailure({ traceId, requestId }, [{ path: ["params", "matchId"], message: "Invalid matchId" }], req);
    res.status(400).json({ error: "Invalid matchId", requestId, traceId });
    return;
  }
  logStructuredEvent("info", "match.end.received", { traceId, requestId, matchId }, {
    method: req.method,
    path: req.path,
  });
  const session = getMatchSession(matchId);
  const sessionId = session?.sessionId;
  if (!session) {
    logStructuredEvent("info", "match.end.noop", { traceId, requestId, matchId }, {
      reason: "Unknown matchId",
    });
    res.status(204).send();
    return;
  }

  deleteMatchSession(matchId);
  await removePersistedSession(matchId);
  logStructuredEvent("info", "match.end.success", { traceId, requestId, matchId, sessionId });
  res.status(200).json({ ok: true, matchId, sessionId, requestId, traceId });
}
