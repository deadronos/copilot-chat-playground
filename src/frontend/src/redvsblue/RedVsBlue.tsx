import React, { useRef } from "react";

import { selectBlueCount, selectRedCount, useGameState } from "@/redvsblue/stores/gameState";
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

const RedVsBlue: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const selectedRenderer = useUIStore((s) => s.selectedRenderer);
  const workerMode = initialWorkerMode;

  const redCount = useGameState(selectRedCount);
  const blueCount = useGameState(selectBlueCount);

  const { spawnShip, reset } = useGame({ canvasRef, containerRef, worker: workerMode });

  if (import.meta.env.DEV) {
    ;(globalThis as any).__rvbBench = { runPerfBench }
  }

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
        />
      </div>
    </div>
  );
};

export default RedVsBlue;
