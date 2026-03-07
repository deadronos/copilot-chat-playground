import * as React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import type { LucideIcon } from "lucide-react"

import { StatusBadge } from "@/components/chat-playground/StatusBadge"
import { PromptPanel } from "@/components/chat-playground/PromptPanel"
import { StreamOutputPanel } from "@/components/chat-playground/StreamOutputPanel"

describe("ChatPlayground presentational components", () => {
  if (!globalThis.ResizeObserver) {
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  }

  const DummyIcon: LucideIcon = (props) => <svg {...props} />

  it("renders StatusBadge label", () => {
    render(
      <StatusBadge
        status="streaming"
        meta={{
          label: "Streaming",
          helper: "Receiving live chunks.",
          dot: "bg-emerald-500",
          ring: "ring-emerald-200",
        }}
      />
    )

    expect(screen.getByText("Streaming")).toBeTruthy()
  })

  it("renders PromptPanel with disabled submit when prompt is empty", () => {
    render(
      <PromptPanel
        mode="explain-only"
        modeMeta={{
          "explain-only": {
            label: "Explain-only",
            description: "Safe mode.",
            icon: DummyIcon,
          },
          "project-helper": {
            label: "Project Helper",
            description: "Full access.",
            icon: DummyIcon,
          },
        }}
        modeOptions={[
          ["explain-only", { label: "Explain-only", description: "Safe mode.", icon: DummyIcon }],
          ["project-helper", { label: "Project Helper", description: "Full access.", icon: DummyIcon }],
        ]}
        prompt=""
        backendProbeInfo={null}
        isBusy={false}
        status="empty"
        statusHelper="Ready for a new prompt."
        onModeChange={vi.fn()}
        onPromptChange={vi.fn()}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    expect(screen.getByText("Safety Mode")).toBeTruthy()
    const submitButton = screen.getByRole("button", { name: /send prompt/i })
    expect(submitButton.hasAttribute("disabled")).toBe(true)
  })

  it("renders cancel button when prompt panel is busy", () => {
    const onCancel = vi.fn()

    render(
      <PromptPanel
        mode="explain-only"
        modeMeta={{
          "explain-only": {
            label: "Explain-only",
            description: "Safe mode.",
            icon: DummyIcon,
          },
          "project-helper": {
            label: "Project Helper",
            description: "Full access.",
            icon: DummyIcon,
          },
        }}
        modeOptions={[
          ["explain-only", { label: "Explain-only", description: "Safe mode.", icon: DummyIcon }],
          ["project-helper", { label: "Project Helper", description: "Full access.", icon: DummyIcon }],
        ]}
        prompt="Run"
        backendProbeInfo={null}
        isBusy={true}
        status="streaming"
        statusHelper="Receiving live chunks."
        onModeChange={vi.fn()}
        onPromptChange={vi.fn()}
        onSubmit={vi.fn()}
        onCancel={onCancel}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it("renders StreamOutputPanel timeline and actions", () => {
    render(
      <StreamOutputPanel
        output="Hello world"
        outputPlaceholder=""
        estimatedTokens={3}
        timeline={[
          { id: "1", role: "user", content: "Hi" },
          { id: "2", role: "assistant", content: "Hello world" },
        ]}
        status="done"
        error={null}
        copied={false}
        isBusy={false}
        canRetry={true}
        hasSavedSession
        onRetry={vi.fn()}
        onCopy={vi.fn()}
        onExport={vi.fn()}
        onClear={vi.fn()}
        onNewChat={vi.fn()}
        onResumeLastChat={vi.fn()}
      />
    )

    expect(screen.getByText("Conversation timeline")).toBeTruthy()
    expect(screen.getByText("Hi")).toBeTruthy()
    expect(screen.getByRole("button", { name: /retry/i })).toBeTruthy()
    expect(screen.getByRole("button", { name: /copy/i })).toBeTruthy()
    expect(screen.getByRole("button", { name: /export/i })).toBeTruthy()
    expect(screen.getByRole("button", { name: /clear/i })).toBeTruthy()
    expect(screen.getByRole("button", { name: /new chat/i })).toBeTruthy()
    expect(screen.getByRole("button", { name: /resume last chat/i })).toBeTruthy()
  })
})
