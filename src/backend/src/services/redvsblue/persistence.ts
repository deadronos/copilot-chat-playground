import fs from "node:fs";
import path from "node:path";

import type { MatchSession, PersistedMatchSession } from "../redvsblue-types.js";
import { deserializeMatchSession, serializeMatchSession } from "./serialization.js";

const MATCH_ID_FILENAME_RE = /^[A-Za-z0-9_-]{1,128}$/;

function getPersistDir(): string {
  return process.env.REDVSBLUE_PERSIST_DIR || "/tmp/redvsblue-sessions";
}

function ensurePersistDir(): void {
  fs.mkdirSync(getPersistDir(), { recursive: true });
}

function resolvePersistedSessionPath(matchId: string): string | null {
  if (!MATCH_ID_FILENAME_RE.test(matchId)) {
    return null;
  }

  const persistDir = path.resolve(getPersistDir());
  const fileName = `${matchId}.json`;
  const resolved = path.resolve(persistDir, fileName);
  const base = persistDir.endsWith(path.sep) ? persistDir : `${persistDir}${path.sep}`;

  // Defense-in-depth: ensure the final resolved path remains within persistDir.
  if (!resolved.startsWith(base)) {
    return null;
  }

  return resolved;
}

export function loadPersistedSessions(): MatchSession[] {
  ensurePersistDir();
  const sessions: MatchSession[] = [];
  const persistDir = path.resolve(getPersistDir());
  const entries = fs.readdirSync(persistDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".json")) {
      continue;
    }

    const filePath = path.resolve(persistDir, entry.name);
    const base = persistDir.endsWith(path.sep) ? persistDir : `${persistDir}${path.sep}`;
    if (!filePath.startsWith(base)) {
      // Should not happen with readdirSync, but guard against surprises like odd path handling.
      continue;
    }
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
  const filePath = resolvePersistedSessionPath(session.matchId);
  if (!filePath) {
    console.warn("[redvsblue] refusing to persist session with unsafe matchId", {
      matchId: session.matchId,
      sessionId: session.sessionId,
    });
    return;
  }

  ensurePersistDir();
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
  const filePath = resolvePersistedSessionPath(matchId);
  if (!filePath) {
    console.warn("[redvsblue] refusing to remove persisted session with unsafe matchId", {
      matchId,
    });
    return;
  }

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
