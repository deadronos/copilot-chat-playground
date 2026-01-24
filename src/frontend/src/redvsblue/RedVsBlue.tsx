import React, { useRef, useState } from "react";

import { selectBlueCount, selectRedCount, useGameState } from "@/redvsblue/stores/gameState";
import { useGame } from "@/redvsblue/useGame";
import { TelemetryConnectorReact } from "@/redvsblue/TelemetryConnector";
import { runPerfBench } from "@/redvsblue/bench/perfBench";
import { useUIStore } from "@/redvsblue/stores/uiStore";

const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
const initialWorkerMode = params?.get("rvbWorker") === "1";
const initialRendererParam = params?.get("rvbRenderer");

if (initialRendererParam === "offscreen") {
  useUIStore.getState().setSelectedRenderer("offscreen");
}

const RedVsBlue: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  // Ensures a fresh <canvas> element per mount (important for OffscreenCanvas + React StrictMode).
  const [canvasInstanceKey] = useState(() => String(Date.now()) + "-" + Math.random().toString(36).slice(2));

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
      <style>{`
        body { margin: 0; background-color: #050510; color: white; font-family: 'Courier New', Courier, monospace; }
        canvas { display: block; }
        #ui-layer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; display: flex; flex-direction: column; justify-content: space-between; }
        .top-bar { background: rgba(0, 0, 0, 0.5); padding: 10px; display: flex; justify-content: center; gap: 40px; font-size: 24px; font-weight: bold; text-shadow: 0 0 5px black; }
        .red-text { color: #ff4d4d; }
        .blue-text { color: #4d4dff; }
        .controls { pointer-events: auto; background: rgba(0,0,0,0.8); padding: 15px; display: flex; justify-content: center; gap: 15px; border-top: 1px solid #333; }
        button { background: #333; color: white; border: 1px solid #555; padding: 10px 20px; font-family: inherit; font-size: 16px; cursor: pointer; transition: 0.2s; }
        button:hover { background: #555; } button:active { transform: translateY(1px); }
        .btn-red { border-bottom: 3px solid #ff4d4d; } .btn-blue { border-bottom: 3px solid #4d4dff; } .btn-reset { border-bottom: 3px solid white; }
      `}</style>

      <canvas key={`${selectedRenderer}-${canvasInstanceKey}`} ref={canvasRef} id="gameCanvas" />

      <TelemetryConnectorReact />

      <div id="ui-layer">
        <div className="top-bar">
          <div className="red-text">
            RED SHIPS: <span>{redCount}</span>
          </div>
          <div className="blue-text">
            BLUE SHIPS: <span>{blueCount}</span>
          </div>
        </div>

        <div className="controls">
          <button className="btn-red" onClick={() => spawnShip("red")}>
            +1 RED
          </button>
          <button className="btn-blue" onClick={() => spawnShip("blue")}>
            +1 BLUE
          </button>
          <button className="btn-reset" onClick={reset}>
            RESET
          </button>
        </div>
      </div>
    </div>
  );
};

export default RedVsBlue;
