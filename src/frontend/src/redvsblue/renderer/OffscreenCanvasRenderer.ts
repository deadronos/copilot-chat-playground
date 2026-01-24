import type { Bullet, GameState, Particle, Ship, Star } from "@/redvsblue/types";

type Offscreen2DContext = OffscreenCanvasRenderingContext2D;

export class OffscreenCanvasRenderer {
  private canvas: OffscreenCanvas | null = null;
  private ctx: Offscreen2DContext | null = null;

  init(canvas: OffscreenCanvas): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d") as Offscreen2DContext | null;
  }

  resize(width: number, height: number): void {
    if (!this.canvas) return;
    const w = Math.max(1, Math.floor(width));
    const h = Math.max(1, Math.floor(height));
    if (this.canvas.width !== w) this.canvas.width = w;
    if (this.canvas.height !== h) this.canvas.height = h;
  }

  render(snapshot: GameState | null): void {
    const ctx = this.ctx;
    const canvas = this.canvas;
    if (!ctx || !canvas) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.globalAlpha = 1;
    ctx.fillStyle = "#050510";
    ctx.fillRect(0, 0, width, height);

    if (!snapshot) return;

    this.drawStars(ctx, snapshot.stars);
    this.drawShips(ctx, snapshot.ships);
    this.drawBullets(ctx, snapshot.bullets);
    this.drawParticles(ctx, snapshot.particles);
    ctx.globalAlpha = 1;
  }

  destroy(): void {
    this.ctx = null;
    this.canvas = null;
  }

  private drawStars(ctx: Offscreen2DContext, stars: Star[]): void {
    ctx.fillStyle = "white";
    for (const star of stars) {
      ctx.globalAlpha = star.brightness;
      ctx.beginPath();
      ctx.arc(star.position.x, star.position.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  private drawShips(ctx: Offscreen2DContext, ships: Ship[]): void {
    for (const ship of ships) {
      const color = ship.team === "red" ? "#ff4d4d" : "#4d4dff";

      ctx.save();
      ctx.translate(ship.position.x, ship.position.y);
      ctx.rotate(ship.angle);

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(15, 0);
      ctx.lineTo(-10, 10);
      ctx.lineTo(-5, 0);
      ctx.lineTo(-10, -10);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    }
  }

  private drawBullets(ctx: Offscreen2DContext, bullets: Bullet[]): void {
    for (const bullet of bullets) {
      ctx.fillStyle = bullet.team === "red" ? "#ffcccc" : "#ccccff";
      ctx.beginPath();
      ctx.arc(bullet.position.x, bullet.position.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawParticles(ctx: Offscreen2DContext, particles: Particle[]): void {
    for (const particle of particles) {
      const progress = particle.lifetime <= 0 ? 1 : particle.age / particle.lifetime;
      const alpha = Math.max(0, 1 - progress);
      if (alpha <= 0) continue;

      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.position.x, particle.position.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}
