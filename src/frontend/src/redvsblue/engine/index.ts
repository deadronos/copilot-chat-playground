/**
 * Red vs Blue Game Engine Module
 * 
 * This module provides the public API for the game engine.
 * It re-exports all types from the types module and provides a factory function
 * to create engine instances.
 * 
 * STUB/SCAFFOLD: This is an intentionally incomplete implementation.
 * Future PRs will add the following functionality:
 * - Full game loop implementation with physics simulation
 * - Collision detection and response
 * - AI logic for bot-controlled ships
 * - Backend/Copilot server integration for game orchestration
 * - Real-time telemetry event emission
 * - Entity spawning and destruction
 * - Particle system for visual effects
 */

// Re-export all types from the types module to provide a unified public API
export type {
  Team,
  Vector2D,
  Ship,
  Bullet,
  Particle,
  Star,
  GameState,
  EngineConfig,
  TelemetryEvent,
  Engine,
} from "@/redvsblue/types";

import type { Engine as EngineInterface, EngineConfig } from "@/redvsblue/types";
import { Engine } from "./engine";

/**
 * Factory function to create a new game engine instance.
 * 
 * @param config - Optional engine configuration.
 * @returns Engine instance with full game simulation
 * 
 * @example
 * ```typescript
 * const engine = createEngine({
 *   canvasWidth: 800,
 *   canvasHeight: 600,
 *   shipSpeed: 5,
 *   bulletSpeed: 10,
 *   bulletDamage: 10,
 *   shipMaxHealth: 100,
 *   enableTelemetry: true,
 * });
 * 
 * engine.init(config);
 * engine.on("telemetry", (event) => {
 *   console.log("Telemetry event:", event);
 * });
 * 
 * // Game loop
 * function gameLoop(deltaTime: number) {
 *   engine.update(deltaTime);
 *   const state = engine.getState();
 *   // Render state...
 * }
 * ```
 */
export function createEngine(config?: EngineConfig): EngineInterface {
  const engine = new Engine();
  if (config) {
    engine.init(config);
  }
  return engine;
}
