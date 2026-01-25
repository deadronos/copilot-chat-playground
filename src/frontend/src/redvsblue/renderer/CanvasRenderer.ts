import type { Bullet, GameState, Particle, Ship, Star } from "@/redvsblue/types"
import type { Renderer } from "./types"

export class CanvasRenderer implements Renderer {
  private canvas: HTMLCanvasElement | null = null
  private ctx: CanvasRenderingContext2D | null = null

  init(canvas: HTMLCanvasElement): void {
    this.canvas = canvas
    this.ctx = canvas.getContext("2d")
  }

  render(snapshot: GameState | null): void {
    const ctx = this.ctx
    const canvas = this.canvas
    if (!ctx || !canvas) return

    const width = canvas.width
    const height = canvas.height

    // Background
    ctx.globalAlpha = 1
    ctx.fillStyle = "#050510"
    ctx.fillRect(0, 0, width, height)

    if (!snapshot) return

    this.drawStars(ctx, snapshot.stars)
    this.drawShips(ctx, snapshot.ships)
    this.drawBullets(ctx, snapshot.bullets)
    this.drawParticles(ctx, snapshot.particles)
    ctx.globalAlpha = 1
  }

  destroy(): void {
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    }
    this.ctx = null
    this.canvas = null
  }

  private drawStars(ctx: CanvasRenderingContext2D, stars: Star[]): void {
    ctx.fillStyle = "white"
    for (const star of stars) {
      ctx.globalAlpha = star.brightness
      ctx.beginPath()
      ctx.arc(star.position.x, star.position.y, star.size, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }

  private drawShips(ctx: CanvasRenderingContext2D, ships: Ship[]): void {
    for (const ship of ships) {
      const color = ship.team === "red" ? "#ff4d4d" : "#4d4dff"

      ctx.save()
      ctx.translate(ship.position.x, ship.position.y)
      ctx.rotate(ship.angle)

      ctx.fillStyle = color
      ctx.beginPath()
      ctx.moveTo(15, 0)
      ctx.lineTo(-10, 10)
      ctx.lineTo(-5, 0)
      ctx.lineTo(-10, -10)
      ctx.closePath()
      ctx.fill()

      ctx.strokeStyle = color
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(0, 0, 18, 0, Math.PI * 2)
      ctx.stroke()

      ctx.restore()
    }
  }

  private drawBullets(ctx: CanvasRenderingContext2D, bullets: Bullet[]): void {
    for (const bullet of bullets) {
      ctx.fillStyle = bullet.team === "red" ? "#ffcccc" : "#ccccff"
      ctx.beginPath()
      ctx.arc(bullet.position.x, bullet.position.y, 3, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  private drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]): void {
    for (const particle of particles) {
      const progress = particle.lifetime <= 0 ? 1 : particle.age / particle.lifetime
      const alpha = Math.max(0, 1 - progress)
      if (alpha <= 0) continue

      ctx.globalAlpha = alpha
      ctx.fillStyle = particle.color
      ctx.beginPath()
      ctx.arc(particle.position.x, particle.position.y, particle.size, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }
}

