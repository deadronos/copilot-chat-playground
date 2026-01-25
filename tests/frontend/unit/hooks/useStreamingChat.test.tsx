import * as React from "react"
import { render, act } from "@testing-library/react"
import { describe, it, expect, vi, afterEach } from "vitest"
import { useStreamingChat } from "@/hooks/useStreamingChat"

type HarnessProps = {
  onChange: (state: ReturnType<typeof useStreamingChat>) => void
}

function Harness({ onChange }: HarnessProps) {
  const state = useStreamingChat()
  React.useEffect(() => {
    onChange(state)
  }, [state, onChange])
  return null
}

describe("useStreamingChat", () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it("streams output and completes", async () => {
    const onChange = vi.fn()
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode("Hello "))
        controller.enqueue(encoder.encode("world"))
        controller.close()
      },
    })

    const response = {
      ok: true,
      status: 200,
      headers: new Headers(),
      body: stream,
    } as Response

    vi.stubGlobal("fetch", vi.fn(async () => response) as unknown as typeof fetch)

    render(<Harness onChange={onChange} />)

    const latest = () => onChange.mock.calls.at(-1)?.[0]

    await act(async () => {
      await latest()?.submit({
        prompt: "Hello",
        apiUrl: "/api/chat",
        mode: "explain-only",
      })
    })

    expect(latest()?.output).toBe("Hello world")
    expect(latest()?.status).toBe("done")
    expect(latest()?.error).toBeNull()
  })

  it("surfaces token missing errors from JSON payloads", async () => {
    const onChange = vi.fn()
    const response = {
      ok: false,
      status: 503,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({ errorType: "token_missing" }),
    } as Response

    vi.stubGlobal("fetch", vi.fn(async () => response) as unknown as typeof fetch)

    render(<Harness onChange={onChange} />)
    const latest = () => onChange.mock.calls.at(-1)?.[0]

    await act(async () => {
      await latest()?.submit({
        prompt: "Hello",
        apiUrl: "/api/chat",
        mode: "explain-only",
      })
    })

    expect(latest()?.status).toBe("error")
    expect(latest()?.error).toContain("Copilot service is not configured")
  })
})
