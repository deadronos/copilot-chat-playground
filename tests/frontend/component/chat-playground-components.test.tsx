import * as React from "react"
import { render, screen } from "@testing-library/react"
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
        meta={{ label: "Streaming", helper: "Receiving live chunks.", dot: "bg-emerald-500", ring: "ring-emerald-200" }}
      />
    )

    expect(screen.getByText("Streaming")).toBeInTheDocument()
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
      />
    )

    expect(screen.getByText("Safety Mode")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /send prompt/i })).toBeDisabled()
  })

  it("renders StreamOutputPanel actions when output is present", () => {
    render(
      <StreamOutputPanel
        output="Hello world"
        outputPlaceholder=""
        estimatedTokens={3}
        status="done"
        error={null}
        copied={false}
        onCopy={vi.fn()}
        onExport={vi.fn()}
        onClear={vi.fn()}
      />
    )

    expect(screen.getByRole("button", { name: /copy/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /export/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /clear/i })).toBeInTheDocument()
  })
})
