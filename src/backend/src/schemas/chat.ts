import { z } from "zod";

export const ChatRequestSchema = z.object({
  prompt: z.string().min(1).max(20_000),
  mode: z.enum(["explain-only", "project-helper"]).default("explain-only"),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;