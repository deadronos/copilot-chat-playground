import { useGameStore } from '../stores/gameStore';
import { useUIStore } from '../stores/uiStore';

/**
 * CanvasRenderer renders the game to a canvas element.
 * It subscribes directly to Zustand stores without causing React re-renders.
 */
export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationFrameId: number | null = null;
  private unsubscribe: (() => void) | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context from canvas');
    }
    this.ctx = ctx;
  }

  /**
   * Start rendering loop
   */
  start(): void {
    // Subscribe to store changes (without causing React re-renders)
    // This is done directly on the store instance
    this.unsubscribe = useGameStore.subscribe(() => {
      // Store changed, but we'll render on next frame anyway
    });

    this.render();
  }

  /**
   * Stop rendering loop
   */
  stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  /**
   * Main render loop
   */
  private render = (): void => {
    // Read directly from store without subscribing in React
    const gameState = useGameStore.getState();
    const uiState = useUIStore.getState();

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw background
    this.drawBackground();

    // Draw entities
    gameState.entities.forEach((entity) => {
      this.drawEntity(entity);
    });

    // Draw scores
    this.drawScores(gameState.redScore, gameState.blueScore);

    // Draw debug info if enabled
    if (uiState.showDebug) {
      this.drawDebugInfo(gameState);
    }

    // Continue rendering
    this.animationFrameId = requestAnimationFrame(this.render);
  };

  /**
   * Draw the background
   */
  private drawBackground(): void {
    const { width, height } = this.canvas;

    // Draw red zone (left side)
    this.ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
    this.ctx.fillRect(0, 0, width / 2, height);

    // Draw blue zone (right side)
    this.ctx.fillStyle = 'rgba(0, 0, 255, 0.1)';
    this.ctx.fillRect(width / 2, 0, width / 2, height);

    // Draw center line
    this.ctx.strokeStyle = 'rgba(128, 128, 128, 0.5)';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);
    this.ctx.beginPath();
    this.ctx.moveTo(width / 2, 0);
    this.ctx.lineTo(width / 2, height);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }

  /**
   * Draw an entity
   */
  private drawEntity(entity: { x: number; y: number; team: 'red' | 'blue' }): void {
    const radius = 10;
    this.ctx.fillStyle = entity.team === 'red' ? '#ef4444' : '#3b82f6';
    
    this.ctx.beginPath();
    this.ctx.arc(entity.x, entity.y, radius, 0, Math.PI * 2);
    this.ctx.fill();

    // Draw team indicator (border)
    this.ctx.strokeStyle = entity.team === 'red' ? '#dc2626' : '#2563eb';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
  }

  /**
   * Draw scores
   */
  private drawScores(redScore: number, blueScore: number): void {
    const { width } = this.canvas;
    this.ctx.font = 'bold 32px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';

    // Red score (left side)
    this.ctx.fillStyle = '#ef4444';
    this.ctx.fillText(redScore.toString(), width / 4, 20);

    // Blue score (right side)
    this.ctx.fillStyle = '#3b82f6';
    this.ctx.fillText(blueScore.toString(), (width * 3) / 4, 20);
  }

  /**
   * Draw debug information
   */
  private drawDebugInfo(gameState: { entities: unknown[] }): void {
    this.ctx.font = '14px monospace';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 3;

    const text = `Entities: ${gameState.entities.length}`;
    const x = 10;
    const y = this.canvas.height - 30;

    // Draw text with stroke for visibility
    this.ctx.strokeText(text, x, y);
    this.ctx.fillText(text, x, y);
  }
}
