import * as React from "react";
import { SparklesIcon, WavesIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type StreamStatus = "empty" | "waiting" | "streaming" | "done" | "error";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/chat";

const STATUS_META: Record<
  StreamStatus,
  { label: string; helper: string; dot: string; ring: string }
> = {
  empty: {
    label: "Idle",
    helper: "Ready for a new prompt.",
    dot: "bg-slate-400",
    ring: "ring-slate-200",
  },
  waiting: {
    label: "Waiting",
    helper: "Handshake with backend.",
    dot: "bg-amber-500",
    ring: "ring-amber-200",
  },
  streaming: {
    label: "Streaming",
    helper: "Receiving live chunks.",
    dot: "bg-emerald-500",
    ring: "ring-emerald-200",
  },
  done: {
    label: "Complete",
    helper: "Stream finished.",
    dot: "bg-sky-600",
    ring: "ring-sky-200",
  },
  error: {
    label: "Error",
    helper: "Check backend status.",
    dot: "bg-rose-500",
    ring: "ring-rose-200",
  },
};

const outputPlaceholderByStatus: Record<StreamStatus, string> = {
  empty: "Type a prompt...",
  waiting: "Waiting...",
  streaming: "Streaming...",
  done: "Stream finished. Send another prompt to continue.",
  error: "Something went wrong while streaming.",
};

export function ChatPlayground() {
  const [prompt, setPrompt] = React.useState("");
  const [output, setOutput] = React.useState("");
  const [status, setStatus] = React.useState<StreamStatus>("empty");
  const [error, setError] = React.useState<string | null>(null);

  const isBusy = status === "waiting" || status === "streaming";
  const statusMeta = STATUS_META[status];
  const outputPlaceholder = output.length
    ? ""
    : outputPlaceholderByStatus[status];

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = prompt.trim();
    if (!trimmed || isBusy) {
      return;
    }

    setError(null);
    setOutput("");
    setStatus("waiting");

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: trimmed }),
      });

      if (!response.ok || !response.body) {
        const message = response.ok
          ? "Streaming response was empty."
          : `Request failed with status ${response.status}.`;
        throw new Error(message);
      }

      setStatus("streaming");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }
        const chunk = decoder.decode(value, { stream: true });
        if (chunk) {
          setOutput((prev) => prev + chunk);
        }
      }

      const finalChunk = decoder.decode();
      if (finalChunk) {
        setOutput((prev) => prev + finalChunk);
      }

      setStatus("done");
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "Streaming failed.";
      setError(message);
      setStatus("error");
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f8f1e7] text-slate-900">
      <div className="pointer-events-none absolute -left-28 top-10 h-72 w-72 rounded-full bg-[#f4b97b]/40 blur-3xl animate-[float_18s_ease-in-out_infinite]" />
      <div className="pointer-events-none absolute right-[-6rem] top-32 h-80 w-80 rounded-full bg-[#74c6c9]/35 blur-3xl animate-[float_16s_ease-in-out_infinite] [animation-delay:2s]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.08),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-40 bg-[linear-gradient(90deg,rgba(15,23,42,0.08)_1px,transparent_1px),linear-gradient(rgba(15,23,42,0.08)_1px,transparent_1px)] bg-[size:56px_56px]" />

      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12 sm:px-8 lg:py-16">
        <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-900/15 bg-white/70 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-slate-600 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.6)]">
              <SparklesIcon className="size-3" />
              Milestone A • Local Stream
            </div>
            <div className="space-y-3">
              <h1 className="font-display text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
                Copilot Streamforge
              </h1>
              <p className="max-w-xl text-sm text-slate-600 sm:text-base">
                A handcrafted simulation of the Copilot streaming experience.
                Shape the prompt, watch the output arrive in rhythmic bursts,
                and refine the flow before wiring up the real engine.
              </p>
            </div>
          </div>
          <div
            className={cn(
              "flex items-center gap-3 rounded-2xl border bg-white/80 px-4 py-3 text-xs uppercase tracking-[0.2em] shadow-[0_18px_40px_-24px_rgba(15,23,42,0.7)]",
              statusMeta.ring
            )}
          >
            <span
              className={cn(
                "relative flex size-3 items-center justify-center",
                status === "streaming" && "animate-pulse"
              )}
            >
              <span className={cn("size-2 rounded-full", statusMeta.dot)} />
              <span
                className={cn(
                  "absolute inset-0 rounded-full opacity-40 blur-[1px]",
                  statusMeta.dot
                )}
              />
            </span>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-slate-500">Status</span>
              <span className="font-semibold text-slate-900">
                {statusMeta.label}
              </span>
            </div>
          </div>
        </header>

        <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-900/10 bg-white/80 p-6 shadow-[0_25px_70px_-50px_rgba(15,23,42,0.8)] backdrop-blur-sm">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <h2 className="font-display text-2xl text-slate-900">
                    Prompt Studio
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Craft a prompt and hit send. The backend simulates a chunked
                    response so you can tune the UX.
                  </p>
                </div>
                <div className="rounded-full border border-slate-900/10 bg-[#f8f1e7] px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-slate-500">
                  Local-only
                </div>
              </div>

              <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
                <Input
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder="Describe the response you want to simulate..."
                  disabled={isBusy}
                  className="h-11 rounded-2xl border-slate-900/15 bg-white/90 text-base shadow-[inset_0_0_0_1px_rgba(255,255,255,0.6)]"
                />
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Button
                    type="submit"
                    size="lg"
                    disabled={!prompt.trim() || isBusy}
                    className="rounded-2xl bg-slate-900 text-white shadow-[0_16px_32px_-18px_rgba(15,23,42,0.7)] hover:bg-slate-800"
                  >
                    Send prompt
                  </Button>
                  <div className="text-xs text-slate-500">
                    {statusMeta.helper}
                  </div>
                </div>
              </form>
            </div>

            <div className="rounded-3xl border border-slate-900/10 bg-white/70 p-6 text-sm text-slate-600 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.6)] backdrop-blur-sm">
              <div className="flex items-center gap-3 text-xs uppercase tracking-[0.26em] text-slate-500">
                <WavesIcon className="size-4 text-slate-500" />
                Stream Notes
              </div>
              <ul className="mt-4 space-y-2 text-sm">
                <li>Chunk cadence: ~100ms for this milestone.</li>
                <li>Output is plain text for simple UI testing.</li>
                <li>Next: wire Copilot responses and log events.</li>
              </ul>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-900/10 bg-white/85 p-6 shadow-[0_30px_80px_-60px_rgba(15,23,42,0.8)] backdrop-blur-sm">
            <div className="flex items-start justify-between gap-6">
              <div>
                <h2 className="font-display text-2xl text-slate-900">
                  Stream Output
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Streaming text arrives here as it is emitted from the backend.
                </p>
              </div>
              <div className="rounded-full border border-slate-900/10 bg-[#f8f1e7] px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-slate-500">
                {output.length} chars
              </div>
            </div>

            <div className="mt-6">
              <Textarea
                value={output}
                placeholder={outputPlaceholder}
                readOnly
                className="min-h-[320px] rounded-2xl border-slate-900/15 bg-white/90 font-mono text-sm leading-relaxed shadow-[inset_0_0_0_1px_rgba(255,255,255,0.6)]"
              />
              {status === "error" && error && (
                <div
                  role="alert"
                  className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
                >
                  {error}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
