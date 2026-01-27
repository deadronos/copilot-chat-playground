import cors from "cors";
import express from "express";
import { createChatRouter } from "./routes/chat.js";
import { createMatchRouter } from "./routes/match.js";
import { createObservabilityRouter } from "./routes/observability.js";
import { loadPersistedSessions } from "./services/redvsblue/session.js";

export function createApp(): express.Express {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  loadPersistedSessions();

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "backend" });
  });

  app.use(createChatRouter());
  app.use(createMatchRouter());
  app.use(createObservabilityRouter());

  return app;
}
