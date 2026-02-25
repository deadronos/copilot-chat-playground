import { describe, expect, test } from "vitest"
import { sendSnapshot } from "./match"

describe("Match API - sendSnapshot error parsing", () => {
  test("parses JSON error body and includes status and body", async () => {
    const fakeFetch = (async () => {
      return {
        ok: false,
        status: 404,
        headers: { get: () => "application/json" },
        json: async () => ({ error: "Unknown matchId", errorCode: "MATCH_NOT_FOUND", actions: ["refresh_match"] }),
        text: async () => JSON.stringify({ error: "Unknown matchId" }),
      } as unknown as Response
    }) as typeof fetch

    const res = await sendSnapshot("some-match", {}, fakeFetch)

    expect(res.ok).toBe(false)
    if (res.ok) {
      throw new Error("Expected sendSnapshot to fail")
    }

    expect(res.status).toBe(404)
    expect(res.body).toEqual(
      expect.objectContaining({
        errorCode: "MATCH_NOT_FOUND",
        actions: expect.arrayContaining(["refresh_match"]),
      })
    )
  })
})
