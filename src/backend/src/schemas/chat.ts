import { z } from "zod";

export const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(20_000),
});

export const ChatRequestSchema = z.object({
  prompt: z.string().trim().min(1).max(20_000),
  mode: z.enum(["explain-only", "project-helper"]).default("explain-only"),
  sessionId: z.string().trim().min(1).max(200).optional(),
  messages: z.array(ChatMessageSchema).max(200).optional(),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type ChatRequest = z.infer<typeof ChatRequestSchema>;