import { describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";

vi.mock("../../../src/backend/src/services/copilot.js", () => ({
  callCopilotService: vi.fn(),
  callCopilotServiceStream: vi.fn(),
  sendPlainTextError: vi.fn(),
}));

import { handleChat } from "../../../src/backend/src/controllers/chatController.js";
import {
  callCopilotService,
  callCopilotServiceStream,
} from "../../../src/backend/src/services/copilot.js";

function createRequest(body: unknown): Request {
  return {
    body,
    on: vi.fn(),
    off: vi.fn(),
  } as unknown as Request;
}

function createResponse(): Response {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    setHeader: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    end: vi.fn().mockReturnThis(),
    write: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
    off: vi.fn().mockReturnThis(),
    flushHeaders: vi.fn(),
    writableEnded: false,
  } as unknown as Response;
}

describe("chatController", () => {
  it("returns 400 for invalid payload", async () => {
    const req = createRequest({ invalid: true });
    const res = createResponse();

    await handleChat(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalled();
  });

  it("falls back to buffered response when streaming is unavailable", async () => {
    const req = createRequest({ prompt: "Hello", mode: "explain-only" });
    const res = createResponse();

    vi.mocked(callCopilotServiceStream).mockResolvedValue({
      success: false,
      errorType: "stream_unavailable",
      error: "no stream",
    });
    vi.mocked(callCopilotService).mockResolvedValue({
      success: true,
      output: "Buffered",
    });

    await handleChat(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith("Buffered");
  });
});