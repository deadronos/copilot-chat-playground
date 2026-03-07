import * as React from "react";

import { Button } from "@/components/ui/button";

type CopilotHealth = {
  mode?: "sdk" | "cli" | string;
  tokenConfigured?: boolean;
  binaryAvailable?: boolean;
  defaultModel?: string;
};

type CopilotModels = {
  source?: string;
  models?: string[];
  cached?: boolean;
  ttlExpiresAt?: string;
};

type BackendSummaryResponse = {
  summary?: Record<string, number>;
};

type ObservabilityModelPanelProps = {
  copilotBaseUrl?: string;
  backendBaseUrl?: string;
};

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/$/, "");
}

function parseMetricCounters(metrics: string): Record<string, number> {
  const counters: Record<string, number> = {};

  for (const rawLine of metrics.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const match = line.match(
      /^([a-zA-Z_:][a-zA-Z0-9_:]*)\s+([+-]?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)$/,
    );
    if (!match) continue;

    const [, name, valueText] = match;
    const value = Number(valueText);
    if (Number.isFinite(value)) {
      counters[name] = value;
    }
  }

  return counters;
}

async function fetchJson<T>(url: string, label: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Failed to load ${label}: ${response.status} ${body}`.trim(),
    );
  }
  return (await response.json()) as T;
}

async function fetchText(url: string, label: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Failed to load ${label}: ${response.status} ${body}`.trim(),
    );
  }
  return response.text();
}

export function ObservabilityModelPanel({
  copilotBaseUrl = "/copilot",
  backendBaseUrl = "",
}: ObservabilityModelPanelProps) {
  const [health, setHealth] = React.useState<CopilotHealth | null>(null);
  const [models, setModels] = React.useState<CopilotModels | null>(null);
  const [metrics, setMetrics] = React.useState<Record<string, number>>({});
  const [summary, setSummary] = React.useState<Record<string, number>>({});
  const [errors, setErrors] = React.useState<string[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = React.useState<number | null>(null);

  const refreshDiagnostics = React.useCallback(async () => {
    const copilotBase = normalizeBaseUrl(copilotBaseUrl);
    const backendBase = normalizeBaseUrl(backendBaseUrl);

    setIsLoading(true);
    setErrors([]);

    const nextErrors: string[] = [];

    const [healthResult, modelsResult, metricsResult, summaryResult] =
      await Promise.allSettled([
        fetchJson<CopilotHealth>(`${copilotBase}/health`, "Copilot /health"),
        fetchJson<CopilotModels>(`${copilotBase}/models`, "Copilot /models"),
        fetchText(`${copilotBase}/metrics`, "Copilot /metrics"),
        fetchJson<BackendSummaryResponse>(
          `${backendBase}/api/observability/summary`,
          "Backend /api/observability/summary",
        ),
      ]);

    if (healthResult.status === "fulfilled") {
      setHealth(healthResult.value);
    } else {
      nextErrors.push(
        healthResult.reason instanceof Error
          ? healthResult.reason.message
          : String(healthResult.reason),
      );
    }

    if (modelsResult.status === "fulfilled") {
      setModels(modelsResult.value);
    } else {
      nextErrors.push(
        modelsResult.reason instanceof Error
          ? modelsResult.reason.message
          : String(modelsResult.reason),
      );
    }

    if (metricsResult.status === "fulfilled") {
      setMetrics(parseMetricCounters(metricsResult.value));
    } else {
      nextErrors.push(
        metricsResult.reason instanceof Error
          ? metricsResult.reason.message
          : String(metricsResult.reason),
      );
    }

    if (summaryResult.status === "fulfilled") {
      setSummary(summaryResult.value.summary ?? {});
    } else {
      nextErrors.push(
        summaryResult.reason instanceof Error
          ? summaryResult.reason.message
          : String(summaryResult.reason),
      );
    }

    setErrors(nextErrors);
    setLastUpdatedAt(Date.now());
    setIsLoading(false);
  }, [backendBaseUrl, copilotBaseUrl]);

  React.useEffect(() => {
    void refreshDiagnostics();
  }, [refreshDiagnostics]);

  const topSummaryEntries = Object.entries(summary)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const keyMetricEntries = Object.entries(metrics)
    .filter(([key]) => key.startsWith("copilot_model_"))
    .sort(([left], [right]) => left.localeCompare(right));

  return (
    <section className="rounded-3xl border border-slate-900/10 bg-white/80 p-6 shadow-[0_25px_70px_-50px_rgba(15,23,42,0.8)] backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-slate-900">
            Observability &amp; Model Diagnostics
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Monitor Copilot mode, model source/cache, and runtime counters.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => void refreshDiagnostics()}
          disabled={isLoading}
        >
          {isLoading ? "Refreshing…" : "Refresh"}
        </Button>
      </div>

      {isLoading && (
        <p className="mt-4 text-sm text-slate-600">Loading diagnostics…</p>
      )}

      {errors.length > 0 && (
        <div className="mt-4 rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700">
          {errors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      )}

      <div className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-900/10 bg-white p-4">
          <h3 className="font-medium text-slate-900">Copilot /health</h3>
          <p className="mt-2 text-slate-600">
            Mode: {(health?.mode ?? "unknown").toString().toUpperCase()}
          </p>
          <p className="text-slate-600">
            Token: {health?.tokenConfigured ? "configured" : "missing"}
          </p>
          <p className="text-slate-600">
            Binary: {health?.binaryAvailable ? "available" : "missing"}
          </p>
          <p className="text-slate-600">
            Default model: {health?.defaultModel ?? "n/a"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-900/10 bg-white p-4">
          <h3 className="font-medium text-slate-900">Copilot /models</h3>
          <p className="mt-2 text-slate-600">
            Source: {models?.source ?? "n/a"}
          </p>
          <p className="text-slate-600">
            Cache: {models?.cached ? "warm" : "cold"}
          </p>
          <p className="text-slate-600">
            Models: {models?.models?.length ? models.models.join(", ") : "none"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-900/10 bg-white p-4">
          <h3 className="font-medium text-slate-900">Copilot /metrics</h3>
          <div className="mt-2 space-y-1 text-slate-600">
            {keyMetricEntries.length === 0 ? (
              <p>No model counters reported.</p>
            ) : (
              keyMetricEntries.map(([key, value]) => (
                <p key={key}>{`${key}: ${value}`}</p>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-900/10 bg-white p-4">
          <h3 className="font-medium text-slate-900">
            Backend /api/observability/summary
          </h3>
          <div className="mt-2 space-y-1 text-slate-600">
            {topSummaryEntries.length === 0 ? (
              <p>No events recorded yet.</p>
            ) : (
              topSummaryEntries.map(([event, count]) => (
                <p key={event}>{`${event}: ${count}`}</p>
              ))
            )}
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs text-slate-500">
        Last updated:{" "}
        {lastUpdatedAt
          ? new Date(lastUpdatedAt).toLocaleTimeString()
          : "not yet"}
      </p>
    </section>
  );
}
