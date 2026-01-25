import type { Team } from "@/redvsblue/types";

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
