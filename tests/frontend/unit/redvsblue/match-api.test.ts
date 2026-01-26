import { describe, it, expect } from "vitest"
import * as MatchApi from "@/redvsblue/api/match"

describe("Match API client", () => {
  it("startMatch returns data on success", async () => {
    const fakeFetch = async () => ({ ok: true, json: async () => ({ sessionId: "sess-1" }) } as any)
    const res = await MatchApi.startMatch({ matchId: "m1" }, fakeFetch as any)
    expect(res.ok).toBe(true)
    expect(res.data?.sessionId).toBe("sess-1")
  })

  it("startMatch returns error on non-ok response", async () => {
    const fakeFetch = async () => ({ ok: false, text: async () => "oops" } as any)
    const res = await MatchApi.startMatch({ matchId: "m1" }, fakeFetch as any)
    expect(res.ok).toBe(false)
    expect(res.error).toContain("oops")
  })

  it("sendSnapshot returns parsed payload", async () => {
    const fakeRes = { notificationText: "hi", validatedDecision: { requestId: 'r1', type: 'spawnShips', params: { team: 'red', count: 1 } } }
    const fakeFetch = async () => ({ ok: true, json: async () => fakeRes } as any)
    const res = await MatchApi.sendSnapshot("m1", {}, fakeFetch as any)
    expect(res.ok).toBe(true)
    expect(res.data?.notificationText).toBe("hi")
  })
})
