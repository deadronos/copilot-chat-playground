import { cn } from "@/lib/utils";
import type { StreamStatus } from "@/hooks/useStreamingChat";

export type StatusBadgeMeta = {
  label: string;
  helper: string;
  dot: string;
  ring: string;
};

type StatusBadgeProps = {
  status: StreamStatus;
  meta: StatusBadgeMeta;
};

export function StatusBadge({ status, meta }: StatusBadgeProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border bg-white/80 px-4 py-3 text-xs uppercase tracking-[0.2em] shadow-[0_18px_40px_-24px_rgba(15,23,42,0.7)]",
        meta.ring
      )}
    >
      <span
        className={cn(
          "relative flex size-3 items-center justify-center",
          status === "streaming" && "animate-pulse"
        )}
      >
        <span className={cn("size-2 rounded-full", meta.dot)} />
        <span
          className={cn("absolute inset-0 rounded-full opacity-40 blur-[1px]", meta.dot)}
        />
      </span>
      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] text-slate-500">Status</span>
        <span className="font-semibold text-slate-900">{meta.label}</span>
      </div>
    </div>
  );
}
