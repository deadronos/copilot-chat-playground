import * as React from "react";
import { SparklesIcon, ShieldCheckIcon, WrenchIcon } from "lucide-react";

import { estimateTokenCount } from "@copilot-playground/shared";
import { useApiProbe } from "@/hooks/useApiProbe";
import { useStreamingChat, type ChatMode, type StreamStatus } from "@/hooks/useStreamingChat";
import { useOutputActions } from "@/hooks/useOutputActions";
import { PromptPanel, type ModeMeta } from "@/components/chat-playground/PromptPanel";
import { SafetyFeatures } from "@/components/chat-playground/SafetyFeatures";
import { StatusBadge, type StatusBadgeMeta } from "@/components/chat-playground/StatusBadge";
import { StreamOutputPanel } from "@/components/chat-playground/StreamOutputPanel";
import { RedVsBluePanel } from "@/components/chat-playground/RedVsBluePanel";

// Runtime configuration: prefer VITE_API_URL if provided; otherwise fall back to proxy
const VITE_API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? undefined;
const VITE_BACKEND_URL = (import.meta.env.VITE_BACKEND_URL as string | undefined) ?? undefined;
const DEFAULT_PROXY_API_BASE = "/api"; // proxied by Vite dev server

// Default API URL used before probing completes
const DEFAULT_API_URL = VITE_API_URL
  ? `${VITE_API_URL.replace(/\/$/, "")}/chat`
  : `${DEFAULT_PROXY_API_BASE}/chat`;

const MODE_META: Record<ChatMode, ModeMeta> = {
  "explain-only": {
    label: "Explain-only",
    description: "Safe mode. Explains concepts without executing code or making changes.",
    icon: ShieldCheckIcon,
  },
  "project-helper": {
    label: "Project Helper",
    description: "Full access. Can execute commands and interact with project files.",
    icon: WrenchIcon,
  },
};

const STATUS_META: Record<StreamStatus, StatusBadgeMeta> = {
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
  const [mode, setMode] = React.useState<ChatMode>("explain-only");
  const [isRedVsBlueOpen, setIsRedVsBlueOpen] = React.useState(false);

  const { apiUrl, backendProbeInfo } = useApiProbe({
    defaultApiUrl: DEFAULT_API_URL,
    apiUrlOverride: VITE_API_URL,
    backendUrlOverride: VITE_BACKEND_URL,
  });
  const { output, status, error, isBusy, submit, clear } = useStreamingChat();
  const { copied, onCopy, onExport, onClear } = useOutputActions({ output, onClear: clear });

  const statusMeta = STATUS_META[status];
  const outputPlaceholder = output.length ? "" : outputPlaceholderByStatus[status];

  // Estimate token count (rough approximation: 1 token ≈ 4 characters)
  const estimatedTokens = estimateTokenCount(output);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await submit({ prompt, apiUrl, mode });
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
              Milestone D • Safety & UX
            </div>
            <div className="space-y-3">
              <h1 className="font-display text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
                Copilot Streamforge
              </h1>
              <p className="max-w-xl text-sm text-slate-600 sm:text-base">
                Enhanced with safety toggles and UX polish. Choose your mode, watch
                streaming output, and interact with responses through copy, export, and
                clear actions.
              </p>
            </div>
          </div>
          <StatusBadge status={status} meta={statusMeta} />
        </header>

        <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <PromptPanel
              mode={mode}
              modeMeta={MODE_META}
              modeOptions={Object.entries(MODE_META) as Array<[ChatMode, ModeMeta]>}
              prompt={prompt}
              backendProbeInfo={backendProbeInfo}
              isBusy={isBusy}
              status={status}
              statusHelper={statusMeta.helper}
              onModeChange={setMode}
              onPromptChange={setPrompt}
              onSubmit={handleSubmit}
            />
            <SafetyFeatures />
          </div>

          <StreamOutputPanel
            output={output}
            outputPlaceholder={outputPlaceholder}
            estimatedTokens={estimatedTokens}
            status={status}
            error={error}
            copied={copied}
            onCopy={onCopy}
            onExport={onExport}
            onClear={onClear}
          />
        </section>

        <RedVsBluePanel isOpen={isRedVsBlueOpen} onOpenChange={setIsRedVsBlueOpen} />
      </main>
    </div>
  );
}
