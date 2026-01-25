import * as React from "react";
import {
  SparklesIcon,
  WavesIcon,
  CopyIcon,
  DownloadIcon,
  ShieldCheckIcon,
  WrenchIcon,
  CheckIcon,
  ChevronDownIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import RedVsBlue from "@/redvsblue/RedVsBlue";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { estimateTokenCount } from "@copilot-playground/shared";
import { useApiProbe } from "@/hooks/useApiProbe";
import { useStreamingChat, type ChatMode, type StreamStatus } from "@/hooks/useStreamingChat";

// Runtime configuration: prefer VITE_API_URL if provided; otherwise fall back to proxy
const VITE_API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? undefined;
const VITE_BACKEND_URL = (import.meta.env.VITE_BACKEND_URL as string | undefined) ?? undefined;
const DEFAULT_PROXY_API_BASE = "/api"; // proxied by Vite dev server

// Default API URL used before probing completes
const DEFAULT_API_URL = VITE_API_URL
  ? `${VITE_API_URL.replace(/\/$/, "")}/chat`
  : `${DEFAULT_PROXY_API_BASE}/chat`; 

const MODE_META: Record<
  ChatMode,
  { label: string; description: string; icon: typeof ShieldCheckIcon }
> = {
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
  const [mode, setMode] = React.useState<ChatMode>("explain-only");
  const [copied, setCopied] = React.useState(false);
  const [isRedVsBlueOpen, setIsRedVsBlueOpen] = React.useState(false);

  // Runtime backend detection: prefer VITE_API_URL; otherwise probe VITE_BACKEND_URL or localhost:3000
  const { apiUrl, backendProbeInfo } = useApiProbe({
    defaultApiUrl: DEFAULT_API_URL,
    apiUrlOverride: VITE_API_URL,
    backendUrlOverride: VITE_BACKEND_URL,
  });
  const { output, status, error, isBusy, submit, clear } = useStreamingChat();
  const statusMeta = STATUS_META[status];
  const outputPlaceholder = output.length
    ? ""
    : outputPlaceholderByStatus[status];

  // Estimate token count (rough approximation: 1 token ≈ 4 characters)
  const estimatedTokens = estimateTokenCount(output);

  const handleCopy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  const handleExport = () => {
    if (!output) return;
    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `copilot-output-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    clear();
  };

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
                Enhanced with safety toggles and UX polish. Choose your mode,
                watch streaming output, and interact with responses through copy,
                export, and clear actions.
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
                    Choose a safety mode and send your prompt. The backend will
                    respect your mode selection and stream the response.
                  </p>
                </div>
                <div className="rounded-full border border-slate-900/10 bg-[#f8f1e7] px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-slate-500">
                  {backendProbeInfo ? (
                    <span className="text-[10px] normal-case">{backendProbeInfo}</span>
                  ) : (
                    "Local-only"
                  )}
                </div>
              </div>

              <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Safety Mode
                    </label>
                    <Select
                      value={mode}
                      onValueChange={(value) => setMode(value as ChatMode)}
                      disabled={isBusy}
                    >
                      <SelectTrigger className="h-11 w-full rounded-2xl border border-slate-900/15 bg-white/90 px-4 text-left shadow-[inset_0_0_0_1px_rgba(255,255,255,0.6)] hover:bg-white/95">
                        <SelectValue>
                          {(() => {
                            const modeMeta = MODE_META[mode];
                            const Icon = modeMeta.icon;
                            return (
                              <div className="flex items-center gap-2">
                                <Icon className="size-4" />
                                <span>{modeMeta.label}</span>
                              </div>
                            );
                          })()}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border border-slate-900/15 bg-white shadow-[0_10px_40px_-20px_rgba(15,23,42,0.6)]">
                        {(Object.entries(MODE_META) as [ChatMode, typeof MODE_META[ChatMode]][]).map(
                          ([modeKey, modeMeta]) => {
                            const Icon = modeMeta.icon;
                            return (
                              <SelectItem
                                key={modeKey}
                                value={modeKey}
                                className="cursor-pointer"
                              >
                                <div className="flex items-center gap-2">
                                  <Icon className="size-4" />
                                  <span>{modeMeta.label}</span>
                                </div>
                              </SelectItem>
                            );
                          }
                        )}
                      </SelectContent>
                    </Select>
                    <p className="mt-2 text-xs text-slate-500">
                      {MODE_META[mode].description}
                    </p>
                  </div>
                  <Input
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    placeholder="Describe the response you want to simulate..."
                    disabled={isBusy}
                    className="h-11 rounded-2xl border-slate-900/15 bg-white/90 text-base shadow-[inset_0_0_0_1px_rgba(255,255,255,0.6)]"
                  />
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Button
                    type="submit"
                    size="lg"
                    disabled={!prompt.trim() || isBusy}
                    className="rounded-2xl bg-slate-900 text-white shadow-[0_16px_32px_-18px_rgba(15,23,42,0.7)] hover:bg-slate-800"
                  >
                    {isBusy && status === "waiting" && "Connecting..."}
                    {isBusy && status === "streaming" && "Streaming..."}
                    {!isBusy && "Send prompt"}
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
                Safety Features
              </div>
              <ul className="mt-4 space-y-2 text-sm">
                <li>
                  <strong>Explain-only mode:</strong> Safe default mode for
                  explanations without code execution.
                </li>
                <li>
                  <strong>Project helper:</strong> Advanced mode with full
                  project capabilities (coming soon).
                </li>
                <li>
                  <strong>Copy/Export:</strong> Easily save and share responses.
                </li>
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
              <div className="flex items-center gap-2">
                <div className="rounded-full border border-slate-900/10 bg-[#f8f1e7] px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-slate-500">
                  {output.length} chars
                </div>
                {output.length > 0 && (
                  <div className="rounded-full border border-slate-900/10 bg-[#f8f1e7] px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-slate-500">
                    ~{estimatedTokens} tokens
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <Textarea
                value={output}
                placeholder={outputPlaceholder}
                readOnly
                className="min-h-[320px] rounded-2xl border-slate-900/15 bg-white/90 font-mono text-sm leading-relaxed shadow-[inset_0_0_0_1px_rgba(255,255,255,0.6)]"
              />
              
              {output.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleCopy}
                    className="rounded-xl border-slate-900/15 bg-white/90 hover:bg-white"
                  >
                    {copied ? (
                      <>
                        <CheckIcon className="mr-2 size-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <CopyIcon className="mr-2 size-4" />
                        Copy
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleExport}
                    className="rounded-xl border-slate-900/15 bg-white/90 hover:bg-white"
                  >
                    <DownloadIcon className="mr-2 size-4" />
                    Export
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleClear}
                    className="rounded-xl border-slate-900/15 bg-white/90 hover:bg-white"
                  >
                    Clear
                  </Button>
                </div>
              )}

              {status === "error" && error && (
                <div
                  role="alert"
                  className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
                >
                  <div className="font-semibold">Error</div>
                  <div className="mt-1">{error}</div>
                  <div className="mt-2 text-xs text-rose-600">
                    {error.includes("Copilot service is not configured") ? (
                      <>Server is missing GitHub token. For local dev, set <code>GH_TOKEN</code> in a repo-root <code>.env</code> or use Docker secrets (see docs/library/dotenvx/README.md).</>
                    ) : error.includes("authentication") ? (
                      <>Authentication failed. Verify token permissions (Copilot Requests) and check server logs.</>
                    ) : (
                      <>Please check your connection and try again. If the problem persists, verify that the backend service is running and check server logs.</>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* RedVsBlue Simulation Section */}
        <Collapsible open={isRedVsBlueOpen} onOpenChange={setIsRedVsBlueOpen}>
          <div className="rounded-3xl border border-slate-900/10 bg-white/85 p-6 shadow-[0_30px_80px_-60px_rgba(15,23,42,0.8)] backdrop-blur-sm">
            <CollapsibleTrigger asChild>
              <button className="flex w-full items-center justify-between gap-4 hover:opacity-80 transition-opacity">
                <div className="flex-1 text-left">
                  <h2 className="font-display text-2xl text-slate-900">
                    RedVsBlue Simulation
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    {isRedVsBlueOpen 
                      ? "Watch an interactive battle simulation between red and blue teams." 
                      : "Load an interactive battle simulation."}
                  </p>
                </div>
                <ChevronDownIcon 
                  className={cn(
                    "size-5 text-slate-500 transition-transform duration-200",
                    isRedVsBlueOpen && "rotate-180"
                  )}
                />
              </button>
            </CollapsibleTrigger>

            <CollapsibleContent className="mt-6">
              {isRedVsBlueOpen ? (
                <div className="rounded-2xl border border-slate-900/10 bg-slate-900 overflow-hidden aspect-video">
                  <ErrorBoundary name="RedVsBlue">
                    <RedVsBlue />
                  </ErrorBoundary>
                </div>
              ) : (
                <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/50 px-6 py-12 text-center">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-slate-600 mb-2">No simulation loaded</p>
                      <p className="text-xs text-slate-500">Click "Load RedVsBlue simulation" to start the battle.</p>
                    </div>
                    <Button
                      onClick={() => setIsRedVsBlueOpen(true)}
                      className="rounded-2xl bg-slate-900 text-white shadow-[0_16px_32px_-18px_rgba(15,23,42,0.7)] hover:bg-slate-800"
                    >
                      Load RedVsBlue simulation
                    </Button>
                  </div>
                </div>
              )}
            </CollapsibleContent>
          </div>
        </Collapsible>
      </main>
    </div>
  );
}
