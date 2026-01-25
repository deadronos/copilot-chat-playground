import { WavesIcon } from "lucide-react";

export function SafetyFeatures() {
  return (
    <div className="rounded-3xl border border-slate-900/10 bg-white/70 p-6 text-sm text-slate-600 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.6)] backdrop-blur-sm">
      <div className="flex items-center gap-3 text-xs uppercase tracking-[0.26em] text-slate-500">
        <WavesIcon className="size-4 text-slate-500" />
        Safety Features
      </div>
      <ul className="mt-4 space-y-2 text-sm">
        <li>
          <strong>Explain-only mode:</strong> Safe default mode for explanations without
          code execution.
        </li>
        <li>
          <strong>Project helper:</strong> Advanced mode with full project capabilities
          (coming soon).
        </li>
        <li>
          <strong>Copy/Export:</strong> Easily save and share responses.
        </li>
      </ul>
    </div>
  );
}
