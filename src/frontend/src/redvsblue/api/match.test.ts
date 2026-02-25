import { describe, expect, test } from "vitest"
import { sendSnapshot } from "./match"

describe("Match API - sendSnapshot error parsing", () => {
  test("parses JSON error body and includes status and body", async () => {
    const fakeFetch = async () => {
      return {
        ok: false,
        status: 404,
        headers: { get: (name: string) => "application/json" },
        json: async () => ({ error: "Unknown matchId", errorCode: "MATCH_NOT_FOUND", actions: ["refresh_match"] }),
        text: async () => JSON.stringify({ error: "Unknown matchId" }),
      }
    }

    const res = await sendSnapshot("some-match", {}, fakeFetch as any)

    expect(res.ok).toBe(false)
    // @ts-ignore - status is optional on failure type
    expect(res.status).toBe(404)
    // @ts-ignore
    expect(res.body).toHaveProperty("errorCode", "MATCH_NOT_FOUND")
    // @ts-ignore
    expect(res.body.actions).toContain("refresh_match")
  })
})