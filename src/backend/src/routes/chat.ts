import { Router } from "express";

import { handleChat } from "../controllers/chatController.js";

export function createChatRouter(): Router {
  const router = Router();

  router.post("/api/chat", handleChat);

  return router;
}