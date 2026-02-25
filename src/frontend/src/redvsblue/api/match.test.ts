import { describe, expect, test } from "vitest"
import { sendSnapshot } from "./match"

describe("Match API - sendSnapshot error parsing", () => {
  test("parses JSON error body and includes status and body", async () => {
    const fakeFetch: typeof fetch = async () => {
      const response = {
        ok: false,
        status: 404,
        headers: { get: () => "application/json" },
        json: async () => ({ error: "Unknown matchId", errorCode: "MATCH_NOT_FOUND", actions: ["refresh_match"] }),
        text: async () => JSON.stringify({ error: "Unknown matchId" }),
      }
      return response as unknown as Response
    }

    const res = await sendSnapshot("some-match", {}, fakeFetch)

    expect(res.ok).toBe(false)
    if (res.ok) {
      throw new Error("Expected sendSnapshot failure result")
    }
    expect(res.status).toBe(404)
    const body = res.body as { errorCode?: string; actions?: string[] } | undefined
    expect(body).toHaveProperty("errorCode", "MATCH_NOT_FOUND")
    expect(body?.actions).toContain("refresh_match")
  })
})
