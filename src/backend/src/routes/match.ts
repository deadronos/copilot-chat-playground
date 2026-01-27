import { Router } from "express";

import { askMatch, endMatch, startMatch, submitSnapshot } from "../controllers/matchController.js";

export function createMatchRouter(): Router {
  const router = Router();

  router.post("/api/redvsblue/match/start", startMatch);
  router.post("/api/redvsblue/match/:matchId/snapshot", submitSnapshot);
  router.post("/api/redvsblue/match/:matchId/ask", askMatch);
  router.post("/api/redvsblue/match/:matchId/end", endMatch);

  return router;
}