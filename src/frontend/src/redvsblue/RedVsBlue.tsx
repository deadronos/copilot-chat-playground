import React, { useCallback, useEffect, useRef, useState } from "react";

import type { GameState } from "@/redvsblue/types";
import { selectBlueCount, selectRedCount, selectSnapshot, useGameState } from "@/redvsblue/stores/gameState";
import { useGame } from "@/redvsblue/useGame";
import { TelemetryConnectorReact } from "@/redvsblue/TelemetryConnector";
import { runPerfBench } from "@/redvsblue/bench/perfBench";
import { DEFAULT_ENGINE_CONFIG } from "@/redvsblue/config/index";
import { useUIStore } from "@/redvsblue/stores/uiStore";
import RedVsBlueCanvas from "@/redvsblue/RedVsBlueCanvas";
import RedVsBlueControls from "@/redvsblue/RedVsBlueControls";
import RedVsBlueHud from "@/redvsblue/RedVsBlueHud";
import RedVsBlueStyles from "@/redvsblue/RedVsBlueStyles";

const params: URLSearchParams | null = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
const initialWorkerMode = params?.get("rvbWorker") === "1";
const initialRendererParam = params?.get("rvbRenderer");

if (initialRendererParam === "offscreen") {
  useUIStore.getState().setSelectedRenderer("offscreen");
}

import { DEFAULT_UI_CONFIG } from "@/redvsblue/config/index"

const DEFAULT_SNAPSHOT_INTERVAL_MS = DEFAULT_UI_CONFIG.snapshotIntervalMs;

const createId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const RedVsBlue: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const matchIdRef = useRef<string>(createId());
  const latestSnapshotRef = useRef<GameState | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const selectedRenderer = useUIStore((s) => s.selectedRenderer);
  const workerMode = initialWorkerMode;

  const redCount = useGameState(selectRedCount);
  const blueCount = useGameState(selectBlueCount);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [commentary, setCommentary] = useState<string | null>(null);
  const [snapshotIntervalMs, setSnapshotIntervalMs] = useState(DEFAULT_SNAPSHOT_INTERVAL_MS);

  const { spawnShip, reset } = useGame({ canvasRef, containerRef, worker: workerMode });

  if (import.meta.env.DEV) {
    const g = globalThis as unknown as { __rvbBench?: unknown }
    g.__rvbBench = { runPerfBench }
  }

  const showToast = useCallback((message: string) => {
    setCommentary(message);
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = window.setTimeout(() => {
      setCommentary(null);
    }, DEFAULT_UI_CONFIG.toastTimeoutMs);
  }, []);

  const applyValidatedDecision = useCallback(
    (decision: {
      requestId: string;
      type: "spawnShips";
      params: { team: "red" | "blue"; count: number };
      warnings?: string[];
    }) => {
      if (decision.type !== "spawnShips") return;
      for (let i = 0; i < decision.params.count; i += 1) {
        spawnShip(decision.params.team);
      }
      if (decision.warnings && decision.warnings.length > 0) {
        showToast(`AI Director warning: ${decision.warnings.join("; ")}`);
      }
    },
    [showToast, spawnShip]
  );

  useEffect(() => {
    const unsubscribe = useGameState.subscribe(selectSnapshot, (snapshot) => {
      if (snapshot) {
        latestSnapshotRef.current = snapshot;
      }
    });
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const matchId = matchIdRef.current;
    const startMatch = async () => {
      try {
        const response = await fetch("/api/redvsblue/match/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            matchId,
            rulesVersion: "v1",
            proposedRules: {
              shipSpeed: DEFAULT_ENGINE_CONFIG.shipSpeed,
              bulletSpeed: DEFAULT_ENGINE_CONFIG.bulletSpeed,
              bulletDamage: DEFAULT_ENGINE_CONFIG.bulletDamage,
              shipMaxHealth: DEFAULT_ENGINE_CONFIG.shipMaxHealth,
            },
            clientConfig: {
              snapshotIntervalMs: DEFAULT_UI_CONFIG.snapshotIntervalMs,
            },
          }),
        });
        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || "Failed to start match");
        }
        const data = (await response.json()) as {
          sessionId: string;
          effectiveConfig?: { snapshotIntervalMs?: number };
        };
        setSessionId(data.sessionId);
        if (data.effectiveConfig?.snapshotIntervalMs) {
          setSnapshotIntervalMs(data.effectiveConfig.snapshotIntervalMs);
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to start match. Try reloading.";
        showToast(message);
      }
    };

    void startMatch();

    return () => {
      void fetch(`/api/redvsblue/match/${matchId}/end`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }).catch(() => undefined);
    };
  }, [showToast]);

  useEffect(() => {
    if (!sessionId) return;
    const matchId = matchIdRef.current;
    const intervalId = window.setInterval(() => {
      const snapshot = latestSnapshotRef.current;
      if (!snapshot) return;
      const summary = {
        redCount,
        blueCount,
        totalShips: redCount + blueCount,
      };
      const payload = {
        timestamp: snapshot.timestamp,
        snapshotId: createId(),
        gameSummary: summary,
        counts: { red: redCount, blue: blueCount },
        recentMajorEvents: [],
        requestDecision: true,
      };
      void (async () => {
        try {
          const response = await fetch(`/api/redvsblue/match/${matchId}/snapshot`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (!response.ok) return;
          const data = (await response.json()) as {
            notificationText?: string;
            validatedDecision?: {
              requestId: string;
              type: "spawnShips";
              params: { team: "red" | "blue"; count: number };
              warnings?: string[];
            };
            decisionRejectedReason?: string;
          };
          if (data.notificationText) {
            showToast(data.notificationText);
          }
          if (data.validatedDecision) {
            applyValidatedDecision(data.validatedDecision);
          } else if (data.decisionRejectedReason) {
            showToast(`AI Director rejected decision: ${data.decisionRejectedReason}`);
          }
        } catch {
          // ignore snapshot errors
        }
      })();
    }, snapshotIntervalMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [applyValidatedDecision, blueCount, redCount, sessionId, showToast, snapshotIntervalMs]);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        window.clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const handleAskCopilot = async () => {
    if (!sessionId) {
      showToast("Copilot director is not ready yet.");
      return;
    }
    const matchId = matchIdRef.current;
    try {
      const response = await fetch(`/api/redvsblue/match/${matchId}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: "Status update" }),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to fetch commentary");
      }
      const data = (await response.json()) as { commentary?: string };
      showToast(data.commentary ?? "Copilot is thinking about the match.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to reach Copilot director.";
      showToast(message);
    }
  };

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}
    >
      <RedVsBlueStyles />

      <RedVsBlueCanvas canvasRef={canvasRef} rendererKey={selectedRenderer} />

      <TelemetryConnectorReact />

      <div id="ui-layer">
        <RedVsBlueHud redCount={redCount} blueCount={blueCount} />
        <RedVsBlueControls
          onSpawnRed={() => spawnShip("red")}
          onSpawnBlue={() => spawnShip("blue")}
          onReset={reset}
          onAskCopilot={handleAskCopilot}
        />
      </div>
      {commentary && (
        <div className="rvb-toast" role="status" aria-live="polite">
          <strong>AI Director</strong>
          <div>{commentary}</div>
        </div>
      )}
    </div>
  );
};

export default RedVsBlue;
