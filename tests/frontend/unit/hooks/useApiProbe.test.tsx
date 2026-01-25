import * as React from "react"
import { render, act } from "@testing-library/react"
import { describe, it, expect, vi, afterEach } from "vitest"
import { useApiProbe, type ApiProbeResult } from "@/hooks/useApiProbe"

type HarnessProps = {
  onChange: (result: ApiProbeResult) => void
  options: Parameters<typeof useApiProbe>[0]
}

function Harness({ onChange, options }: HarnessProps) {
  const result = useApiProbe(options)
  React.useEffect(() => {
    onChange(result)
  }, [result, onChange])
  return null
}

async function flush(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

describe("useApiProbe", () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it("skips probing when apiUrlOverride is provided", async () => {
    const onChange = vi.fn()
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)

    render(
      <Harness
        onChange={onChange}
        options={{
          defaultApiUrl: "https://example.com/api/chat",
          apiUrlOverride: "https://example.com",
        }}
      />
    )

    await act(async () => {
      await flush()
    })

    const lastCall = onChange.mock.calls.at(-1)?.[0]
    expect(fetchMock).not.toHaveBeenCalled()
    expect(lastCall?.apiUrl).toBe("https://example.com/api/chat")
    expect(lastCall?.backendProbeInfo).toBe("Using API URL from VITE_API_URL")
  })

  it("sets apiUrl when a candidate responds", async () => {
    const onChange = vi.fn()
    const fetchMock = vi.fn(async () => ({ ok: true }))
    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch)

    render(
      <Harness
        onChange={onChange}
        options={{
          defaultApiUrl: "/api/chat",
          probeCandidates: ["http://localhost:3000"],
        }}
      />
    )

    await act(async () => {
      await flush()
    })

    const lastCall = onChange.mock.calls.at(-1)?.[0]
    expect(lastCall?.apiUrl).toBe("http://localhost:3000/api/chat")
    expect(lastCall?.backendProbeInfo).toBe("Backend reachable at http://localhost:3000")
  })
})
