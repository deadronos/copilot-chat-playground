import { describe, it, expect, afterEach } from "vitest"
import { createServer, type Server, type IncomingMessage, type ServerResponse } from "node:http"
import type { AddressInfo } from "node:net"
import { createApp } from "../../../src/backend/src/app.js"

type ServerHandles = {
  copilotServer: Server
  backendServer: Server
  previousCopilotUrl: string | undefined
}

let activeServers: ServerHandles | undefined

function getServerUrl(server: Server): string {
  const address = server.address() as AddressInfo
  return `http://127.0.0.1:${address.port}`
}

async function setupServers(): Promise<ServerHandles> {
  const previousCopilotUrl = process.env.COPILOT_SERVICE_URL

  const copilotServer = createServer((req: IncomingMessage, res: ServerResponse) => {
    if (req.method === "POST" && req.url === "/chat/stream") {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" })
      res.end("Not found")
      return
    }

    if (req.method === "POST" && req.url === "/chat") {
      res.writeHead(200, { "Content-Type": "application/json" })
      res.end(JSON.stringify({ output: "Buffered fallback" }))
      return
    }

    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" })
    res.end("Not found")
  })

  await new Promise<void>((resolve) => {
    copilotServer.listen(0, resolve)
  })

  process.env.COPILOT_SERVICE_URL = getServerUrl(copilotServer)

  const app = createApp()
  const backendServer = app.listen(0)

  return { copilotServer, backendServer, previousCopilotUrl }
}

async function teardownServers(): Promise<void> {
  if (!activeServers) return
  process.env.COPILOT_SERVICE_URL = activeServers.previousCopilotUrl
  await new Promise<void>((resolve) =>
    activeServers?.backendServer.close(() => resolve())
  )
  await new Promise<void>((resolve) =>
    activeServers?.copilotServer.close(() => resolve())
  )
  activeServers = undefined
}

afterEach(async () => {
  await teardownServers()
})

describe("Backend /api/chat fallback", () => {
  it("returns buffered response when streaming endpoint is unavailable", async () => {
    activeServers = await setupServers()
    const response = await fetch(`${getServerUrl(activeServers.backendServer)}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "Hello", mode: "explain-only" }),
    })

    expect(response.ok).toBe(true)
    const text = await response.text()
    expect(text).toBe("Buffered fallback")
  })
})
