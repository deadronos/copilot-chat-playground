import { DEFAULT_ENGINE_TUNING } from "@/redvsblue/config/index";
import type { Particle as ParticleState } from "@/redvsblue/types";
import type { RNG } from "../rng";

export class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  id: string;
  private _state: ParticleState;

  constructor(id: string, x: number, y: number, color: string, rng: RNG) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.vx = (rng() - 0.5) * DEFAULT_ENGINE_TUNING.particleVelocityMul;
    this.vy = (rng() - 0.5) * DEFAULT_ENGINE_TUNING.particleVelocityMul;
    this.life = 1.0;
    this.color = color;

    this._state = {
      id: this.id,
      position: { x: this.x, y: this.y },
      velocity: { x: this.vx, y: this.vy },
      color: this.color,
      size: 0,
      lifetime: 0,
      age: 0,
    };
  }

  get state(): ParticleState {
    return this._state;
  }

  syncState(size: number, lifetime: number): ParticleState {
    this._state.position.x = this.x;
    this._state.position.y = this.y;
    this._state.velocity.x = this.vx;
    this._state.velocity.y = this.vy;
    this._state.size = size;
    this._state.lifetime = lifetime;
    this._state.age = (1 - this.life) * lifetime;
    return this._state;
  }

  update(): void {
    this.x += this.vx;
    this.y += this.vy;
    this.life -= DEFAULT_ENGINE_TUNING.particleLifeDecay;
  }
}
