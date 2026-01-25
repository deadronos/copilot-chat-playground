import { DEFAULT_ENGINE_TUNING } from "@/redvsblue/config/index";
import type { RNG } from "../rng";

export class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  id: string;

  constructor(id: string, x: number, y: number, color: string, rng: RNG) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.vx = (rng() - 0.5) * DEFAULT_ENGINE_TUNING.particleVelocityMul;
    this.vy = (rng() - 0.5) * DEFAULT_ENGINE_TUNING.particleVelocityMul;
    this.life = 1.0;
    this.color = color;
  }

  update(): void {
    this.x += this.vx;
    this.y += this.vy;
    this.life -= DEFAULT_ENGINE_TUNING.particleLifeDecay;
  }
}
