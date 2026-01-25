import * as React from "react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ChatMode, StreamStatus } from "@/hooks/useStreamingChat";

export type ModeMeta = {
  label: string;
  description: string;
  icon: LucideIcon;
};

type PromptPanelProps = {
  mode: ChatMode;
  modeMeta: Record<ChatMode, ModeMeta>;
  modeOptions: Array<[ChatMode, ModeMeta]>;
  prompt: string;
  backendProbeInfo: string | null;
  isBusy: boolean;
  status: StreamStatus;
  statusHelper: string;
  onModeChange: (mode: ChatMode) => void;
  onPromptChange: (next: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

export function PromptPanel({
  mode,
  modeMeta,
  modeOptions,
  prompt,
  backendProbeInfo,
  isBusy,
  status,
  statusHelper,
  onModeChange,
  onPromptChange,
  onSubmit,
}: PromptPanelProps) {
  return (
    <div className="rounded-3xl border border-slate-900/10 bg-white/80 p-6 shadow-[0_25px_70px_-50px_rgba(15,23,42,0.8)] backdrop-blur-sm">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h2 className="font-display text-2xl text-slate-900">Prompt Studio</h2>
          <p className="mt-2 text-sm text-slate-500">
            Choose a safety mode and send your prompt. The backend will respect your
            mode selection and stream the response.
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

      <form className="mt-6 space-y-5" onSubmit={onSubmit}>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Safety Mode
            </label>
            <Select
              value={mode}
              onValueChange={(value) => onModeChange(value as ChatMode)}
              disabled={isBusy}
            >
              <SelectTrigger className="h-11 w-full rounded-2xl border border-slate-900/15 bg-white/90 px-4 text-left shadow-[inset_0_0_0_1px_rgba(255,255,255,0.6)] hover:bg-white/95">
                <SelectValue>
                  {(() => {
                    const modeInfo = modeMeta[mode];
                    const Icon = modeInfo.icon;
                    return (
                      <div className="flex items-center gap-2">
                        <Icon className="size-4" />
                        <span>{modeInfo.label}</span>
                      </div>
                    );
                  })()}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="rounded-2xl border border-slate-900/15 bg-white shadow-[0_10px_40px_-20px_rgba(15,23,42,0.6)]">
                {modeOptions.map(([modeKey, info]) => {
                  const Icon = info.icon;
                  return (
                    <SelectItem key={modeKey} value={modeKey} className="cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Icon className="size-4" />
                        <span>{info.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <p className="mt-2 text-xs text-slate-500">{modeMeta[mode].description}</p>
          </div>
          <Input
            value={prompt}
            onChange={(event) => onPromptChange(event.target.value)}
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
          <div className="text-xs text-slate-500">{statusHelper}</div>
        </div>
      </form>
    </div>
  );
}
