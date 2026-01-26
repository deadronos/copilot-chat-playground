import fs from "node:fs";
import path from "node:path";

import type { MatchSession, PersistedMatchSession } from "../redvsblue-types.js";
import { deserializeMatchSession, serializeMatchSession } from "./serialization.js";

function getPersistDir(): string {
  return process.env.REDVSBLUE_PERSIST_DIR || "/tmp/redvsblue-sessions";
}

function ensurePersistDir(): void {
  fs.mkdirSync(getPersistDir(), { recursive: true });
}

export function loadPersistedSessions(): MatchSession[] {
  ensurePersistDir();
  const sessions: MatchSession[] = [];
  const entries = fs.readdirSync(getPersistDir(), { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".json")) {
      continue;
    }
    const filePath = path.join(getPersistDir(), entry.name);
    try {
      const contents = fs.readFileSync(filePath, "utf8");
      const parsed = JSON.parse(contents) as PersistedMatchSession;
      if (!parsed?.matchId || !parsed.sessionId) {
        continue;
      }
      sessions.push(deserializeMatchSession(parsed));
    } catch (error) {
      console.warn("[redvsblue] failed to load persisted session", {
        filePath,
        error: error instanceof Error ? error.message : "unknown error",
      });
    }
  }
  return sessions;
}

export async function persistMatchSession(session: MatchSession): Promise<void> {
  ensurePersistDir();
  const filePath = path.join(getPersistDir(), `${session.matchId}.json`);
  const payload = JSON.stringify(serializeMatchSession(session), null, 2);
  try {
    await fs.promises.writeFile(filePath, payload, "utf8");
  } catch (error) {
    console.warn("[redvsblue] failed to persist session", {
      matchId: session.matchId,
      sessionId: session.sessionId,
      error: error instanceof Error ? error.message : "unknown error",
    });
  }
}

export async function removePersistedSession(matchId: string): Promise<void> {
  const filePath = path.join(getPersistDir(), `${matchId}.json`);
  try {
    await fs.promises.unlink(filePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      console.warn("[redvsblue] failed to remove persisted session", {
        matchId,
        error: error instanceof Error ? error.message : "unknown error",
      });
    }
  }
}
