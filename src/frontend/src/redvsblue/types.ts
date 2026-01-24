/**
 * Red vs Blue Game Engine Types
 * 
 * Core type definitions for the Red vs Blue space shooter game.
 * These types define game entities, state management, and telemetry hooks
 * for communication with the backend/Copilot server.
 */

/**
 * Team identifier for ships and bullets.
 * Each entity belongs to either the red or blue team.
 */
export type Team = 'red' | 'blue';

/**
 * 2D vector representing position or velocity in game space.
 * Used throughout the engine for spatial calculations.
 */
export interface Vector2D {
  /** X-coordinate (horizontal position) */
  x: number;
  /** Y-coordinate (vertical position) */
  y: number;
}

/**
 * Player-controlled spaceship entity.
 * Represents the main game object that players control.
 */
export interface Ship {
  /** Unique identifier for this ship */
  id: string;
  /** Team this ship belongs to */
  team: Team;
  /** Current position in game space */
  position: Vector2D;
  /** Current velocity vector (direction and speed of movement) */
  velocity: Vector2D;
  /** Rotation angle in radians (0 = facing right, increases counter-clockwise) */
  angle: number;
  /** Current health points */
  health: number;
  /** Maximum health points */
  maxHealth: number;
  /** Whether the ship is currently thrusting (for rendering engine trail) */
  isThrusting: boolean;
  /** Whether the ship is currently firing (for rendering muzzle flash) */
  isFiring: boolean;
}

/**
 * Projectile fired by ships.
 * Travels in a straight line and damages ships on collision.
 */
export interface Bullet {
  /** Unique identifier for this bullet */
  id: string;
  /** Team this bullet belongs to (determines which ships it can hit) */
  team: Team;
  /** Current position in game space */
  position: Vector2D;
  /** Velocity vector (direction and speed of travel) */
  velocity: Vector2D;
  /** Rotation angle in radians (typically matches velocity direction) */
  angle: number;
  /** Damage dealt to ships on collision */
  damage: number;
  /** ID of the ship that fired this bullet (for scoring/telemetry) */
  ownerId: string;
}

/**
 * Visual effect particle for explosions, engine trails, etc.
 * Particles are temporary visual elements that don't affect gameplay.
 */
export interface Particle {
  /** Unique identifier for this particle */
  id: string;
  /** Current position in game space */
  position: Vector2D;
  /** Velocity vector (direction and speed of movement) */
  velocity: Vector2D;
  /** Color of the particle (CSS color string, e.g., "#ff0000" or "rgba(255,0,0,0.5)") */
  color: string;
  /** Size/radius of the particle in pixels */
  size: number;
  /** Total lifetime in milliseconds */
  lifetime: number;
  /** Current age in milliseconds (when age >= lifetime, particle is removed) */
  age: number;
}

/**
 * Background star for parallax effect.
 * Stars create visual depth and don't affect gameplay.
 */
export interface Star {
  /** Unique identifier for this star */
  id: string;
  /** Position in game space */
  position: Vector2D;
  /** Brightness level (0.0 to 1.0, affects opacity/alpha) */
  brightness: number;
  /** Size/radius of the star in pixels */
  size: number;
}

/**
 * Complete game state snapshot.
 * Contains all active entities at a specific point in time.
 * Used by the renderer to draw the current frame.
 */
export interface GameState {
  /** All active ships in the game */
  ships: Ship[];
  /** All active bullets in the game */
  bullets: Bullet[];
  /** All active particles (visual effects) */
  particles: Particle[];
  /** All background stars */
  stars: Star[];
  /** Timestamp when this state was captured (milliseconds since epoch) */
  timestamp: number;
}

/**
 * Configuration options for the game engine.
 * Passed to engine.init() to set up game parameters.
 */
export interface EngineConfig {
  /** Canvas width in pixels */
  canvasWidth: number;
  /** Canvas height in pixels */
  canvasHeight: number;
  /** Ship movement speed (pixels per second) */
  shipSpeed: number;
  /** Bullet travel speed (pixels per second) */
  bulletSpeed: number;
  /** Damage dealt by bullets on hit */
  bulletDamage: number;
  /** Maximum health points for ships */
  shipMaxHealth: number;
  /** Whether to emit telemetry events to backend/Copilot server */
  enableTelemetry: boolean;
}

/**
 * Telemetry event sent to backend/Copilot server.
 * Used for AI analysis, gameplay statistics, and Copilot integration.
 * 
 * Event types include:
 * - "ship_spawned": New ship entered the game
 * - "ship_destroyed": Ship was destroyed
 * - "bullet_fired": Ship fired a bullet
 * - "bullet_hit": Bullet hit a ship
 * - "game_started": Game session started
 * - "game_ended": Game session ended
 */
export interface TelemetryEvent {
  /** Type of event (e.g., "ship_destroyed", "bullet_fired") */
  type: string;
  /** Timestamp when the event occurred (milliseconds since epoch) */
  timestamp: number;
  /** Event-specific data payload (structure varies by event type) */
  data: Record<string, unknown>;
}

/**
 * Main game engine interface.
 * Manages game state, physics simulation, and telemetry emission.
 * 
 * Event Emitter Pattern:
 * The engine uses an event emitter pattern for telemetry hooks.
 * - `on(event, handler)`: Subscribe to events
 * - `off(event, handler)`: Unsubscribe from events
 * - `emit(event, data)`: Emit events (called internally by engine)
 * 
 * Telemetry Events:
 * When enableTelemetry is true in config, the engine emits "telemetry" events
 * that can be forwarded to the backend/Copilot server for analysis.
 * 
 * Example usage:
 * ```typescript
 * const engine = new GameEngine();
 * engine.on("telemetry", (event: TelemetryEvent) => {
 *   // Forward to backend
 *   fetch("/api/telemetry", { method: "POST", body: JSON.stringify(event) });
 * });
 * engine.init(config);
 * // ... game loop calls engine.update(deltaTime)
 * ```
 */
export interface Engine {
  /**
   * Initialize the game engine with configuration.
   * Must be called before update() or getState().
   * @param config - Engine configuration options
   */
  init(config: EngineConfig): void;

  /**
   * Update game state by one time step.
   * Should be called once per frame in the game loop.
   * @param deltaTime - Time elapsed since last update in milliseconds
   */
  update(deltaTime: number): void;

  /**
   * Get the current game state.
   * Returns a snapshot of all entities at the current time.
   * @returns Current game state for rendering
   */
  getState(): GameState;

  /**
   * Clean up resources and stop the engine.
   * Should be called when the game is unmounted or reset.
   */
  destroy(): void;

  /**
   * Subscribe to engine events (event emitter pattern).
   * Used primarily for telemetry event hooks.
   * @param event - Event name to listen for (e.g., "telemetry")
   * @param handler - Callback function to handle the event
   */
  on(event: string, handler: (data: unknown) => void): void;

  /**
   * Unsubscribe from engine events.
   * Removes a previously registered event handler.
   * @param event - Event name to stop listening to
   * @param handler - The handler function to remove
   */
  off(event: string, handler: (data: unknown) => void): void;

  /**
   * Emit an engine event (called internally by engine).
   * Used to notify subscribers of telemetry events.
   * @param event - Event name to emit (e.g., "telemetry")
   * @param data - Event data payload
   */
  emit(event: string, data: unknown): void;
}
