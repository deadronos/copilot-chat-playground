import { useEffect, useRef, useCallback } from 'react';
import { GameEngine } from '../engine/GameEngine';
import { CanvasRenderer } from '../renderer/CanvasRenderer';
import { useGameStore } from '../stores/gameStore';

export interface UseGameOptions {
  width: number;
  height: number;
  autoStart?: boolean;
}

export interface UseGameReturn {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  start: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  reset: () => void;
  spawnRed: () => void;
  spawnBlue: () => void;
  isRunning: boolean;
  isPaused: boolean;
  redScore: number;
  blueScore: number;
}

/**
 * useGame hook orchestrates the GameEngine and CanvasRenderer.
 * It provides a clean API for UI controls to interact with the game.
 */
export function useGame({ width, height, autoStart = false }: UseGameOptions): UseGameReturn {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);

  // Subscribe to game state for UI updates
  const isRunning = useGameStore((state) => state.isRunning);
  const isPaused = useGameStore((state) => state.isPaused);
  const redScore = useGameStore((state) => state.redScore);
  const blueScore = useGameStore((state) => state.blueScore);

  // Initialize engine and renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Create engine and renderer
    const engine = new GameEngine(width, height);
    const renderer = new CanvasRenderer(canvas);

    engineRef.current = engine;
    rendererRef.current = renderer;

    // Start renderer
    renderer.start();

    // Auto-start if requested
    if (autoStart) {
      engine.start();
    }

    // Cleanup on unmount
    return () => {
      engine.stop();
      renderer.stop();
    };
  }, [width, height, autoStart]);

  // Game control methods
  const start = useCallback(() => {
    engineRef.current?.start();
  }, []);

  const pause = useCallback(() => {
    engineRef.current?.pause();
  }, []);

  const resume = useCallback(() => {
    engineRef.current?.resume();
  }, []);

  const stop = useCallback(() => {
    engineRef.current?.stop();
  }, []);

  const reset = useCallback(() => {
    engineRef.current?.reset();
  }, []);

  const spawnRed = useCallback(() => {
    engineRef.current?.spawnEntity('red');
  }, []);

  const spawnBlue = useCallback(() => {
    engineRef.current?.spawnEntity('blue');
  }, []);

  return {
    canvasRef,
    start,
    pause,
    resume,
    stop,
    reset,
    spawnRed,
    spawnBlue,
    isRunning,
    isPaused,
    redScore,
    blueScore,
  };
}
