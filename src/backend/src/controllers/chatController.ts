import type { Request, Response } from "express";

import { ChatRequestSchema } from "../schemas/chat.js";
import {
  callCopilotService,
  callCopilotServiceStream,
  sendPlainTextError,
  type ChatMode,
} from "../services/copilot.js";

export async function handleChat(req: Request, res: Response): Promise<void> {
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
}