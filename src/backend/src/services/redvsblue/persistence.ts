import fs from "node:fs";
import path from "node:path";

import type { MatchSession, PersistedMatchSession } from "../redvsblue-types.js";
import { deserializeMatchSession, serializeMatchSession } from "./serialization.js";

const MATCH_ID_FILENAME_RE = /^[A-Za-z0-9_-]{1,128}$/;

function getPersistDir(): string {
  return process.env.REDVSBLUE_PERSIST_DIR || "/tmp/redvsblue-sessions";
}

async function ensurePersistDir(): Promise<void> {
  await fs.promises.mkdir(getPersistDir(), { recursive: true });
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

export async function loadPersistedSessions(): Promise<MatchSession[]> {
  await ensurePersistDir();
  const persistDir = path.resolve(getPersistDir());
  const entries = await fs.promises.readdir(persistDir, { withFileTypes: true });

  const results: (MatchSession | null)[] = [];
  const CONCURRENCY_LIMIT = 50;

  for (let i = 0; i < entries.length; i += CONCURRENCY_LIMIT) {
    const chunk = entries.slice(i, i + CONCURRENCY_LIMIT);
    
    const chunkPromises = chunk.map(async (entry) => {
      if (!entry.isFile() || !entry.name.endsWith(".json")) {
        return null;
      }

      const filePath = path.resolve(persistDir, entry.name);
      const base = persistDir.endsWith(path.sep) ? persistDir : `${persistDir}${path.sep}`;
      if (!filePath.startsWith(base)) {
        // Should not happen with readdir, but guard against surprises like odd path handling.
        return null;
      }

      try {
        const contents = await fs.promises.readFile(filePath, "utf8");
        const parsed = JSON.parse(contents) as PersistedMatchSession;
        if (!parsed?.matchId || !parsed.sessionId) {
          return null;
        }
        return deserializeMatchSession(parsed);
      } catch (error) {
        console.warn("[redvsblue] failed to load persisted session", {
          filePath,
          error: error instanceof Error ? error.message : "unknown error",
        });
        return null;
      }
    });

    const chunkResults = await Promise.all(chunkPromises);
    results.push(...chunkResults);
  }

  return results.filter((session): session is MatchSession => session !== null);
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

  await ensurePersistDir();
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
