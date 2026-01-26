import { describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";

import { startMatch } from "../../../src/backend/src/controllers/matchController.js";

function createRequest(body: unknown): Request {
  return {
    body,
    method: "POST",
    path: "/api/redvsblue/match/start",
  } as unknown as Request;
}

function createResponse(): Response {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
}

describe("matchController", () => {
  it("returns 400 when match start payload is invalid", async () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const req = createRequest({});
    const res = createResponse();

    await startMatch(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalled();

    infoSpy.mockRestore();
    warnSpy.mockRestore();
  });
});