import * as React from "react"
import { render, act } from "@testing-library/react"
import { describe, it, expect, vi, afterEach } from "vitest"

import { useOutputActions } from "@/hooks/useOutputActions"

type HarnessProps = {
  output: string
  onClear: () => void
  onChange: (state: ReturnType<typeof useOutputActions>) => void
}

function Harness({ output, onClear, onChange }: HarnessProps) {
  const state = useOutputActions({ output, onClear })
  React.useEffect(() => {
    onChange(state)
  }, [state, onChange])
  return null
}

describe("useOutputActions", () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it("sets copied state after a successful copy", async () => {
    const onChange = vi.fn()
    const onClear = vi.fn()
    const writeText = vi.fn().mockResolvedValue(undefined)

    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    })

    render(<Harness output="Hello" onClear={onClear} onChange={onChange} />)
    const latest = () => onChange.mock.calls.at(-1)?.[0]

    await act(async () => {
      await latest()?.onCopy()
    })

    expect(writeText).toHaveBeenCalledWith("Hello")
    expect(latest()?.copied).toBe(true)
  })

  it("delegates clear to the provided callback", async () => {
    const onChange = vi.fn()
    const onClear = vi.fn()

    render(<Harness output="Hello" onClear={onClear} onChange={onChange} />)
    const latest = () => onChange.mock.calls.at(-1)?.[0]

    await act(async () => {
      latest()?.onClear()
    })

    expect(onClear).toHaveBeenCalled()
  })

  it("exports output using blob urls", async () => {
    const onChange = vi.fn()
    const onClear = vi.fn()

    if (!("createObjectURL" in URL)) {
      Object.defineProperty(URL, "createObjectURL", {
        value: () => "",
        configurable: true,
      })
    }
    if (!("revokeObjectURL" in URL)) {
      Object.defineProperty(URL, "revokeObjectURL", {
        value: () => {},
        configurable: true,
      })
    }

    const createUrl = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock")
    const revokeUrl = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {})

    render(<Harness output="Hello" onClear={onClear} onChange={onChange} />)
    const latest = () => onChange.mock.calls.at(-1)?.[0]

    await act(async () => {
      latest()?.onExport()
    })

    expect(createUrl).toHaveBeenCalled()
    expect(revokeUrl).toHaveBeenCalledWith("blob:mock")
  })
})
