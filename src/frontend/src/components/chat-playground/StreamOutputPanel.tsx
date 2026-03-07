import { CheckIcon, CopyIcon, DownloadIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { StreamStatus } from "@/hooks/useStreamingChat";
import type { ChatTimelineMessage } from "@/lib/chatSessionStorage";

type StreamOutputPanelProps = {
  output: string;
  outputPlaceholder: string;
  estimatedTokens: number;
  timeline: ChatTimelineMessage[];
  status: StreamStatus;
  error: string | null;
  copied: boolean;
  isBusy: boolean;
  canRetry: boolean;
  hasSavedSession: boolean;
  onRetry: () => void;
  onCopy: () => void;
  onExport: () => void;
  onClear: () => void;
  onNewChat: () => void;
  onResumeLastChat: () => void;
};

export function StreamOutputPanel({
  output,
  outputPlaceholder,
  estimatedTokens,
  timeline = [],
  status,
  error,
  copied,
  isBusy,
  canRetry,
  hasSavedSession = false,
  onRetry,
  onCopy,
  onExport,
  onClear,
  onNewChat,
  onResumeLastChat,
}: StreamOutputPanelProps) {
  return (
    <div className="rounded-3xl border border-slate-900/10 bg-white/85 p-6 shadow-[0_30px_80px_-60px_rgba(15,23,42,0.8)] backdrop-blur-sm">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h2 className="font-display text-2xl text-slate-900">Stream Output</h2>
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

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onNewChat}
          className="rounded-xl border-slate-900/15 bg-white/90 hover:bg-white"
        >
          New chat
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!hasSavedSession}
          onClick={onResumeLastChat}
          className="rounded-xl border-slate-900/15 bg-white/90 hover:bg-white"
        >
          Resume last chat
        </Button>
      </div>

      <div className="mt-6 space-y-4">
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-700">Conversation timeline</h3>
          <div className="max-h-52 space-y-2 overflow-y-auto rounded-2xl border border-slate-900/10 bg-white/80 p-3">
            {timeline.length === 0 ? (
              <p className="text-xs text-slate-500">No messages yet.</p>
            ) : (
              timeline.map((message) => (
                <div key={message.id} className="rounded-xl border border-slate-900/10 bg-white px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                    {message.role === "user" ? "User" : "Assistant"}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{message.content || "…"}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <Textarea
          value={output}
          placeholder={outputPlaceholder}
          readOnly
          className="min-h-[320px] rounded-2xl border-slate-900/15 bg-white/90 font-mono text-sm leading-relaxed shadow-[inset_0_0_0_1px_rgba(255,255,255,0.6)]"
        />

        {(output.length > 0 || canRetry) && (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onRetry}
              disabled={isBusy || !canRetry}
              className="rounded-xl border-slate-900/15 bg-white/90 hover:bg-white"
            >
              Retry
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onCopy}
              disabled={!output.length}
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
              onClick={onExport}
              disabled={!output.length}
              className="rounded-xl border-slate-900/15 bg-white/90 hover:bg-white"
            >
              <DownloadIcon className="mr-2 size-4" />
              Export
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onClear}
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
                <>
                  Server is missing GitHub token. For local dev, set{" "}
                  <code>GH_TOKEN</code> in a repo-root <code>.env</code> or use Docker
                  secrets (see docs/library/dotenvx/README.md).
                </>
              ) : error.includes("authentication") ? (
                <>Authentication failed. Verify token permissions (Copilot Requests) and check server logs.</>
              ) : (
                <>
                  Please check your connection and try again. If the problem persists,
                  verify that the backend service is running and check server logs.
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
