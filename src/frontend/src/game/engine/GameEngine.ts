import { useGameStore } from '../stores/gameStore';

/**
 * GameEngine manages the game logic and state updates.
 * It runs the game loop and updates entity positions, handles collisions, etc.
 */
export class GameEngine {
  private animationFrameId: number | null = null;
  private lastTime: number = 0;
  private readonly width: number;
  private readonly height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  /**
   * Start the game loop
   */
  start(): void {
    const state = useGameStore.getState();
    state.setRunning(true);
    state.setPaused(false);
    this.lastTime = performance.now();
    this.loop();
  }

  /**
   * Pause the game loop
   */
  pause(): void {
    const state = useGameStore.getState();
    state.setPaused(true);
  }

  /**
   * Resume the game loop
   */
  resume(): void {
    const state = useGameStore.getState();
    state.setPaused(false);
    this.lastTime = performance.now();
    if (!this.animationFrameId) {
      this.loop();
    }
  }

  /**
   * Stop the game loop
   */
  stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    const state = useGameStore.getState();
    state.setRunning(false);
  }

  /**
   * Reset the game state
   */
  reset(): void {
    this.stop();
    const state = useGameStore.getState();
    state.reset();
  }

  /**
   * Spawn a new entity
   */
  spawnEntity(team: 'red' | 'blue'): void {
    const state = useGameStore.getState();
    const x = team === 'red' ? 50 : this.width - 50;
    const y = Math.random() * this.height;
    const speed = 50 + Math.random() * 50; // pixels per second
    const angle = team === 'red' ? 0 : Math.PI; // right or left
    
    state.addEntity({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: (Math.random() - 0.5) * 50,
      team,
    });
  }

  /**
   * Main game loop
   */
  private loop = (): void => {
    const state = useGameStore.getState();
    
    if (!state.isRunning) {
      return;
    }

    if (!state.isPaused) {
      const currentTime = performance.now();
      const deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
      this.lastTime = currentTime;

      this.update(deltaTime);
    }

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  /**
   * Update game state
   */
  private update(deltaTime: number): void {
    const state = useGameStore.getState();
    const entities = state.entities;

    // Update entity positions
    entities.forEach((entity) => {
      const newX = entity.x + entity.vx * deltaTime;
      const newY = entity.y + entity.vy * deltaTime;

      // Bounce off top and bottom walls
      let newVy = entity.vy;
      if (newY < 0 || newY > this.height) {
        newVy = -entity.vy;
      }

      // Check if entity reached the opposite side
      if ((entity.team === 'red' && newX > this.width) || 
          (entity.team === 'blue' && newX < 0)) {
        state.updateScore(entity.team, 1);
        state.removeEntity(entity.id);
      } else {
        state.updateEntity(entity.id, {
          x: newX,
          y: Math.max(0, Math.min(this.height, newY)),
          vy: newVy,
        });
      }
    });

    // Check for collisions between entities
    this.checkCollisions(entities);
  }

  /**
   * Check for collisions between entities
   */
  private checkCollisions(entities: typeof useGameStore.prototype.entities): void {
    const state = useGameStore.getState();
    const collisionRadius = 15;

    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const e1 = entities[i];
        const e2 = entities[j];

        if (e1.team === e2.team) continue;

        const dx = e1.x - e2.x;
        const dy = e1.y - e2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < collisionRadius * 2) {
          // Simple collision: both entities are removed
          state.removeEntity(e1.id);
          state.removeEntity(e2.id);
        }
      }
    }
  }
}
