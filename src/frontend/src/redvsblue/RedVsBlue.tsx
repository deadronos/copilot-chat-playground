import React, { useCallback, useEffect, useRef, useState } from "react";

import type { GameState } from "@/redvsblue/types";
import { selectBlueCount, selectRedCount, selectSnapshot, useGameState } from "@/redvsblue/stores/gameState";
import { useGame } from "@/redvsblue/useGame";
import { TelemetryConnectorReact } from "@/redvsblue/TelemetryConnector";
import { runPerfBench } from "@/redvsblue/bench/perfBench";
import { useUIStore } from "@/redvsblue/stores/uiStore";
import RedVsBlueCanvas from "@/redvsblue/RedVsBlueCanvas";
import RedVsBlueControls from "@/redvsblue/RedVsBlueControls";
import RedVsBlueHud from "@/redvsblue/RedVsBlueHud";
import RedVsBlueStyles from "@/redvsblue/RedVsBlueStyles";

const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
const initialWorkerMode = params?.get("rvbWorker") === "1";
const initialRendererParam = params?.get("rvbRenderer");

if (initialRendererParam === "offscreen") {
  useUIStore.getState().setSelectedRenderer("offscreen");
}

const DEFAULT_SNAPSHOT_INTERVAL_MS = 2_000;

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
    ;(globalThis as any).__rvbBench = { runPerfBench }
  }

  const showToast = useCallback((message: string) => {
    setCommentary(message);
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = window.setTimeout(() => {
      setCommentary(null);
    }, 4_500);
  }, []);

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
              shipSpeed: 5,
              bulletSpeed: 8,
              bulletDamage: 10,
              shipMaxHealth: 30,
            },
            clientConfig: {
              snapshotIntervalMs: DEFAULT_SNAPSHOT_INTERVAL_MS,
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
      };
      void fetch(`/api/redvsblue/match/${matchId}/snapshot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }, snapshotIntervalMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [blueCount, redCount, sessionId, snapshotIntervalMs]);

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
