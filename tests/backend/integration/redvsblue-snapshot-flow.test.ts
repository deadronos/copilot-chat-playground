import { describe, it, expect, afterEach } from "vitest"
import { createServer, type Server } from "node:http"
import type { AddressInfo } from "node:net"
import { createApp } from "../../../src/backend/src/app.js"

let server: Server | undefined

function getServerUrl(serverInstance: Server): string {
  const address = serverInstance.address() as AddressInfo
  return `http://127.0.0.1:${address.port}`
}

async function startServer(): Promise<Server> {
  const app = createApp()
  return new Promise((resolve) => {
    const created = createServer(app)
    created.listen(0, () => resolve(created))
  })
}

afterEach(async () => {
  if (!server) return
  await new Promise<void>((resolve) => server?.close(() => resolve()))
  server = undefined
})

describe("RedVsBlue snapshot flow", () => {
  it("accepts match start and snapshot submissions", async () => {
    server = await startServer()
    const baseUrl = getServerUrl(server)

    const startResponse = await fetch(`${baseUrl}/api/redvsblue/match/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId: "match-flow-1", rulesVersion: "v1" }),
    })

    expect(startResponse.ok).toBe(true)

    const snapshotResponse = await fetch(
      `${baseUrl}/api/redvsblue/match/match-flow-1/snapshot`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timestamp: Date.now(),
          snapshotId: "snap-1",
          gameSummary: { redCount: 1, blueCount: 1, totalShips: 2 },
          counts: { red: 1, blue: 1 },
          recentMajorEvents: [],
          requestDecision: false,
        }),
      }
    )

    expect(snapshotResponse.ok).toBe(true)
    const payload = await snapshotResponse.json()
    expect(payload.ok).toBe(true)
    expect(payload.storedSnapshots).toBe(1)
  })
})
