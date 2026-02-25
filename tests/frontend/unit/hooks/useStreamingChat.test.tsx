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

  it("cancels an in-flight request", async () => {
    const onChange = vi.fn()

    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init?: RequestInit) => {
        await new Promise((_, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("The operation was aborted.", "AbortError"))
          })
        })
        throw new Error("unreachable")
      }) as unknown as typeof fetch
    )

    render(<Harness onChange={onChange} />)
    const latest = () => onChange.mock.calls.at(-1)?.[0]

    let submitPromise: Promise<void> | undefined

    await act(async () => {
      submitPromise = latest()?.submit({
        prompt: "Cancel me",
        apiUrl: "/api/chat",
        mode: "explain-only",
      })
    })

    await act(async () => {
      latest()?.cancel()
      await submitPromise
    })

    expect(latest()?.status).toBe("done")
    expect(latest()?.error).toBeNull()
  })

  it("retries the last request", async () => {
    const onChange = vi.fn()
    const encoder = new TextEncoder()
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        body: new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode("first"))
            controller.close()
          },
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        body: new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode("second"))
            controller.close()
          },
        }),
      } as Response)

    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch)

    render(<Harness onChange={onChange} />)
    const latest = () => onChange.mock.calls.at(-1)?.[0]

    await act(async () => {
      await latest()?.submit({
        prompt: "Hello",
        apiUrl: "/api/chat",
        mode: "project-helper",
      })
    })

    await act(async () => {
      await latest()?.retry()
    })

    expect(fetchMock).toHaveBeenCalledTimes(2)
    const secondCall = fetchMock.mock.calls[1]
    expect(secondCall[0]).toBe("/api/chat")
    expect(secondCall[1]?.body).toBe(
      JSON.stringify({ prompt: "Hello", mode: "project-helper" })
    )
    expect(latest()?.output).toBe("second")
  })
})
