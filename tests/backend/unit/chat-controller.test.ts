import { beforeEach, describe, expect, it, vi } from "vitest";
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
  beforeEach(() => {
    vi.clearAllMocks();
  });

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

  it("passes session history context to Copilot calls", async () => {
    const req = createRequest({
      prompt: "What changed?",
      mode: "project-helper",
      model: "gpt-5",
      sessionId: "session-123",
      messages: [
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi there" },
      ],
    });
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

    const streamPrompt = vi.mocked(callCopilotServiceStream).mock.calls[0]?.[0];
    expect(streamPrompt).toContain("Session ID: session-123");
    expect(streamPrompt).toContain("User: Hello");
    expect(streamPrompt).toContain("Assistant: Hi there");
    expect(streamPrompt).toContain("User (latest): What changed?");
    expect(vi.mocked(callCopilotServiceStream).mock.calls[0]?.[3]).toBe("gpt-5");
    expect(vi.mocked(callCopilotService).mock.calls[0]?.[0]).toBe(streamPrompt);
    expect(vi.mocked(callCopilotService).mock.calls[0]?.[2]).toBe("gpt-5");
  });
});