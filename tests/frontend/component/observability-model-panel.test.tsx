import * as React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ObservabilityModelPanel } from "@/components/chat-playground/ObservabilityModelPanel";

describe("ObservabilityModelPanel", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("fetches and renders diagnostics from copilot and backend endpoints", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.endsWith("/health")) {
        return new Response(
          JSON.stringify({
            ok: true,
            mode: "sdk",
            tokenConfigured: true,
            binaryAvailable: true,
            defaultModel: "gpt-5-mini",
          }),
          { status: 200 },
        );
      }

      if (url.endsWith("/models")) {
        return new Response(
          JSON.stringify({
            source: "cli",
            models: ["gpt-5-mini", "gpt-5"],
            cached: true,
            ttlExpiresAt: "2026-01-01T00:00:00.000Z",
          }),
          { status: 200 },
        );
      }

      if (url.endsWith("/metrics")) {
        return new Response(
          [
            "# TYPE copilot_model_mismatch_total counter",
            "copilot_model_mismatch_total 2",
            "copilot_model_probe_total 4",
            "copilot_model_probe_failure_total 1",
            "",
          ].join("\n"),
          { status: 200, headers: { "Content-Type": "text/plain" } },
        );
      }

      if (url.endsWith("/api/observability/summary")) {
        return new Response(
          JSON.stringify({
            ok: true,
            summary: {
              "match.start": 3,
              "match.end": 2,
            },
          }),
          { status: 200 },
        );
      }

      return new Response("not found", { status: 404 });
    });

    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);

    render(
      <ObservabilityModelPanel
        copilotBaseUrl="http://copilot.local"
        backendBaseUrl="http://backend.local"
      />,
    );

    expect(screen.getByText("Loading diagnostics…")).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByText("Mode: SDK")).toBeTruthy();
    });

    expect(screen.getByText("Token: configured")).toBeTruthy();
    expect(screen.getByText("Binary: available")).toBeTruthy();
    expect(screen.getByText("Source: cli")).toBeTruthy();
    expect(screen.getByText("Cache: warm")).toBeTruthy();
    expect(screen.getByText(/Models:\s*gpt-5-mini, gpt-5/)).toBeTruthy();
    expect(screen.getByText("copilot_model_probe_total: 4")).toBeTruthy();
    expect(screen.getByText("match.start: 3")).toBeTruthy();

    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("supports manual refresh and renders endpoint errors", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.endsWith("/models")) {
        return new Response(JSON.stringify({ error: "probe unavailable" }), {
          status: 500,
        });
      }

      if (url.endsWith("/metrics")) {
        return new Response("copilot_model_probe_total 0\n", { status: 200 });
      }

      if (url.endsWith("/health")) {
        return new Response(
          JSON.stringify({
            mode: "cli",
            tokenConfigured: false,
            binaryAvailable: false,
          }),
          {
            status: 200,
          },
        );
      }

      if (url.endsWith("/api/observability/summary")) {
        return new Response(JSON.stringify({ ok: true, summary: {} }), {
          status: 200,
        });
      }

      return new Response("not found", { status: 404 });
    });

    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);

    render(
      <ObservabilityModelPanel
        copilotBaseUrl="http://copilot.local"
        backendBaseUrl="http://backend.local"
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(/Failed to load Copilot \/models/)).toBeTruthy();
    });

    const refreshButton = screen.getByRole("button", { name: /refresh/i });
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(8);
    });
  });
});
