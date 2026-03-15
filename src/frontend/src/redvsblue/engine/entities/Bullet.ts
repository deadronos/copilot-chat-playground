import type { Team, Bullet as BulletState } from "@/redvsblue/types";

export class Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  team: Team;
  color: string;
  radius: number;
  active: boolean;
  id: string;
  ownerId: string;
  angle: number;
  damage: number;
  private _state: BulletState;

  constructor(
    id: string,
    x: number,
    y: number,
    angle: number,
    team: Team,
    ownerId: string,
    bulletSpeed: number,
    bulletDamage: number,
    bulletLife: number,
    bulletRadius: number
  ) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.vx = Math.cos(angle) * bulletSpeed;
    this.vy = Math.sin(angle) * bulletSpeed;
    this.life = bulletLife;
    this.team = team;
    this.color = team === "red" ? "#ffcccc" : "#ccccff";
    this.radius = bulletRadius;
    this.active = true;
    this.ownerId = ownerId;
    this.damage = bulletDamage;

    this._state = {
      id: this.id,
      team: this.team,
      position: { x: this.x, y: this.y },
      velocity: { x: this.vx, y: this.vy },
      angle: this.angle,
      damage: this.damage,
      ownerId: this.ownerId,
    };
  }

  get state(): BulletState {
    return this._state;
  }

  syncState(): BulletState {
    this._state.position.x = this.x;
    this._state.position.y = this.y;
    this._state.velocity.x = this.vx;
    this._state.velocity.y = this.vy;
    this._state.angle = this.angle;
    return this._state;
  }

  update(width: number, height: number): void {
    this.x += this.vx;
    this.y += this.vy;
    this.life--;

    // Wrap around world boundaries
    if (this.x < 0) this.x = width;
    if (this.x > width) this.x = 0;
    if (this.y < 0) this.y = height;
    if (this.y > height) this.y = 0;

    if (this.life <= 0) this.active = false;
  }
}
