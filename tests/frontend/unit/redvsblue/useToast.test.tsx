import React from "react"
import { render, screen, act } from "@testing-library/react"
import { describe, it, expect, vi, afterEach } from "vitest"

import { useToast } from "@/redvsblue/useToast"

type HarnessApi = {
  showToast: (message: string) => void
  clearToast: () => void
}

const ToastHarness = ({
  onReady,
  timeoutMs = 100,
}: {
  onReady: (api: HarnessApi) => void
  timeoutMs?: number
}) => {
  const { toast, showToast, clearToast } = useToast({ timeoutMs })

  React.useEffect(() => {
    onReady({ showToast, clearToast })
  }, [clearToast, onReady, showToast])

  return <div data-testid="toast">{toast ?? ""}</div>
}

describe("useToast", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it("shows and auto-clears toast messages", () => {
    vi.useFakeTimers()
    let api: HarnessApi | null = null

    render(<ToastHarness onReady={(value) => { api = value }} timeoutMs={200} />)

    act(() => {
      api!.showToast("Hello commander")
    })

    expect(screen.getByTestId("toast").textContent).toBe("Hello commander")

    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(screen.getByTestId("toast").textContent).toBe("")
  })

  it("clears toast immediately when requested", () => {
    vi.useFakeTimers()
    let api: HarnessApi | null = null

    render(<ToastHarness onReady={(value) => { api = value }} timeoutMs={500} />)

    act(() => {
      api!.showToast("Temporary toast")
    })

    expect(screen.getByTestId("toast").textContent).toBe("Temporary toast")

    act(() => {
      api!.clearToast()
    })

    expect(screen.getByTestId("toast").textContent).toBe("")
  })
})
