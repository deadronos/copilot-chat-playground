import React, { useEffect, useRef } from "react";

import { selectBlueCount, selectRedCount, useGameState } from "@/redvsblue/stores/gameState";
import { useGame } from "@/redvsblue/useGame";
import { TelemetryConnectorReact } from "@/redvsblue/TelemetryConnector";
import { runPerfBench } from "@/redvsblue/bench/perfBench";
import { useUIStore } from "@/redvsblue/stores/uiStore";
import { useAiDirector } from "@/redvsblue/useAiDirector";
import { useMatchSession } from "@/redvsblue/useMatchSession";
import { useToast } from "@/redvsblue/useToast";
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

const RedVsBlue: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const selectedRenderer = useUIStore((s) => s.selectedRenderer);
  const workerMode = initialWorkerMode;

  const redCount = useGameState(selectRedCount);
  const blueCount = useGameState(selectBlueCount);

  const { spawnShip, reset } = useGame({ canvasRef, containerRef, worker: workerMode });
  const { toast, showToast } = useToast();
  const { applyValidatedDecision, aiOverrideMessage } = useAiDirector({ spawnShip, onToast: showToast });
  const { autoDecisionsEnabled, handleAutoDecisionsToggle, handleAskCopilot } = useMatchSession({
    redCount,
    blueCount,
    onToast: showToast,
    applyValidatedDecision,
  });

  useEffect(() => {
    if (!import.meta.env.DEV) return;

    const g = globalThis as { __rvbBench?: unknown };
    g.__rvbBench = { runPerfBench };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}
    >
      <RedVsBlueStyles />

      <RedVsBlueCanvas canvasRef={canvasRef} rendererKey={selectedRenderer} />

      <TelemetryConnectorReact />

      <div id="ui-layer">
        <RedVsBlueHud redCount={redCount} blueCount={blueCount} aiOverrideMessage={aiOverrideMessage} />
        <RedVsBlueControls
          onSpawnRed={() => spawnShip("red")}
          onSpawnBlue={() => spawnShip("blue")}
          onReset={reset}
          onAskCopilot={handleAskCopilot}
          autoDecisionsEnabled={autoDecisionsEnabled}
          onToggleAutoDecisions={handleAutoDecisionsToggle}
          allowAIOverrides={useUIStore((s) => s.allowAIOverrides)}
          onToggleAllowAIOverrides={(enabled: boolean) => useUIStore.getState().setAllowAIOverrides(enabled)}
        />
      </div>
      {toast && (
        <div className="rvb-toast" role="status" aria-live="polite">
          <strong>AI Director</strong>
          <div>{toast}</div>
        </div>
      )}
    </div>
  );
};

export default RedVsBlue;
