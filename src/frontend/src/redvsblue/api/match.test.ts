import { describe, expect, test } from "vitest"
import { sendSnapshot } from "./match"

describe("Match API - sendSnapshot error parsing", () => {
  test("parses JSON error body and includes status and body", async () => {
    const fakeFetch: typeof fetch = async (input, init) => {
      void input
      void init
      return {
        ok: false,
        status: 404,
        headers: { get: (name: string) => { void name; return "application/json" } },
        json: async () => ({ error: "Unknown matchId", errorCode: "MATCH_NOT_FOUND", actions: ["refresh_match"] }),
        text: async () => JSON.stringify({ error: "Unknown matchId" }),
      } as unknown as Response
    }

    const res = await sendSnapshot("some-match", {}, fakeFetch)

    expect(res.ok).toBe(false)
    if (res.ok) {
      throw new Error("Expected request to fail")
    }

    expect(res.status).toBe(404)
    expect(res.body).toHaveProperty("errorCode", "MATCH_NOT_FOUND")
    expect(res.body).toHaveProperty("actions")

    const body = res.body as { actions?: string[] } | undefined
    expect(body?.actions).toContain("refresh_match")
  })
})
