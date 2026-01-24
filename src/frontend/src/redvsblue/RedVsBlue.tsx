import React, { useEffect, useRef, useState } from 'react';

const RedVsBlue: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const spawnShipRef = useRef<(team: 'red' | 'blue') => void>(() => {});
  const resetSimulationRef = useRef<() => void>(() => {});
  const rafRef = useRef<number | null>(null);
  const [redCount, setRedCount] = useState<number>(0);
  const [blueCount, setBlueCount] = useState<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    // Game state
    let ships: any[] = [];
    let bullets: any[] = [];
    let particles: any[] = [];
    let stars: any[] = [];

    // Configuration
    const FRICTION = 0.98;
    const SHIP_THRUST = 0.2;
    const TURN_SPEED = 0.08;
    const BULLET_SPEED = 8;
    const BULLET_LIFE = 50;
    const FIRE_RATE = 20;
    const AI_VISION_DIST = 800;

    // --- CLASSES ---
    class Particle {
      x: number; y: number; vx: number; vy: number; life: number; color: string;
      constructor(x: number, y: number, color: string) {
        this.x = x; this.y = y; this.vx = (Math.random() - 0.5) * 5; this.vy = (Math.random() - 0.5) * 5;
        this.life = 1.0; this.color = color;
      }
      update() { this.x += this.vx; this.y += this.vy; this.life -= 0.03; }
      draw() { ctx.globalAlpha = this.life; ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(this.x, this.y, 2, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1.0; }
    }

    class Bullet {
      x: number; y: number; vx: number; vy: number; life: number; team: string; color: string; radius: number; active: boolean;
      constructor(x: number, y: number, angle: number, team: string) {
        this.x = x; this.y = y; this.vx = Math.cos(angle) * BULLET_SPEED; this.vy = Math.sin(angle) * BULLET_SPEED;
        this.life = BULLET_LIFE; this.team = team; this.color = (team === 'red') ? '#ffcccc' : '#ccccff'; this.radius = 3; this.active = true;
      }
      update() {
        this.x += this.vx; this.y += this.vy; this.life--;
        if (this.x < 0) this.x = width; if (this.x > width) this.x = 0; if (this.y < 0) this.y = height; if (this.y > height) this.y = 0;
        if (this.life <= 0) this.active = false;
      }
      draw() { ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill(); }
    }

    class Ship {
      x: number; y: number; team: string; vx: number; vy: number; angle: number; color: string; health: number; cooldown: number; radius: number;
      constructor(x: number, y: number, team: string) {
        this.x = x; this.y = y; this.team = team; this.vx = Math.random() - 0.5; this.vy = Math.random() - 0.5; this.angle = Math.random() * Math.PI * 2;
        this.color = (team === 'red') ? '#ff4d4d' : '#4d4dff'; this.health = 30; this.cooldown = Math.random() * 20; this.radius = 12;
      }

      getNearestEnemy() {
        let nearest: any = null; let minDist = Infinity;
        ships.forEach(other => {
          if (other.team !== this.team) {
            let dx = Math.abs(this.x - other.x);
            let dy = Math.abs(this.y - other.y);
            if (dx > width / 2) dx = width - dx;
            if (dy > height / 2) dy = height - dy;
            let dist = Math.hypot(dx, dy);
            if (dist < minDist && dist < AI_VISION_DIST) { minDist = dist; nearest = other; }
          }
        });
        return { enemy: nearest, dist: minDist };
      }

      updateAI() {
        const { enemy, dist } = this.getNearestEnemy();
        if (enemy) {
          let dx = enemy.x - this.x; let dy = enemy.y - this.y;
          if (dx > width/2) dx -= width; if (dx < -width/2) dx += width; if (dy > height/2) dy -= height; if (dy < -height/2) dy += height;
          const targetAngle = Math.atan2(dy, dx); let diff = targetAngle - this.angle;
          while (diff < -Math.PI) diff += Math.PI * 2; while (diff > Math.PI) diff -= Math.PI * 2;
          if (diff > 0.05) this.angle += TURN_SPEED; else if (diff < -0.05) this.angle -= TURN_SPEED;
          if (Math.abs(diff) < 1.0) {
            this.vx += Math.cos(this.angle) * SHIP_THRUST; this.vy += Math.sin(this.angle) * SHIP_THRUST;
            if (Math.random() > 0.5) { let px = this.x - Math.cos(this.angle) * 15; let py = this.y - Math.sin(this.angle) * 15; particles.push(new Particle(px, py, 'orange')); }
          }
          if (Math.abs(diff) < 0.2 && this.cooldown <= 0 && dist < 400) { this.shoot(); }
        } else {
          this.angle += 0.01; this.vx *= 0.95; this.vy *= 0.95;
        }
      }

      update() {
        this.updateAI(); this.vx *= FRICTION; this.vy *= FRICTION; this.x += this.vx; this.y += this.vy;
        if (this.x < 0) this.x = width; if (this.x > width) this.x = 0; if (this.y < 0) this.y = height; if (this.y > height) this.y = 0;
        if (this.cooldown > 0) this.cooldown--;
      }

      shoot() { const bx = this.x + Math.cos(this.angle) * 15; const by = this.y + Math.sin(this.angle) * 15; bullets.push(new Bullet(bx, by, this.angle, this.team)); this.cooldown = FIRE_RATE + Math.random() * 10; }

      draw() {
        ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.angle);
        ctx.fillStyle = this.color; ctx.beginPath(); ctx.moveTo(15, 0); ctx.lineTo(-10, 10); ctx.lineTo(-5, 0); ctx.lineTo(-10, -10); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = this.color; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI*2); ctx.stroke(); ctx.restore();
      }
    }

    // --- GAME LOGIC ---
    function initStars() { stars = []; for(let i=0;i<150;i++){ stars.push({ x: Math.random() * width, y: Math.random() * height, size: Math.random() * 1.5, alpha: Math.random() }); } }

    function updateCounts() { const r = ships.filter(s => s.team === 'red').length; const b = ships.filter(s => s.team === 'blue').length; setRedCount(r); setBlueCount(b); }

    function spawnShip(team: 'red'|'blue') {
      let x: number, y: number;
      if (team === 'red') { x = Math.random() * (width * 0.3); } else { x = width - (Math.random() * (width * 0.3)); }
      y = Math.random() * height; ships.push(new Ship(x, y, team)); updateCounts();
    }

    function resetSimulation() { ships = []; bullets = []; particles = []; spawnShip('red'); spawnShip('red'); spawnShip('blue'); spawnShip('blue'); updateCounts(); }

    function checkCollisions() {
      for (let i = bullets.length - 1; i >= 0; i--) {
        let b = bullets[i]; if (!b.active) continue;
        for (let j = ships.length - 1; j >= 0; j--) {
          let s = ships[j]; if (b.team === s.team) continue;
          const dist = Math.hypot(b.x - s.x, b.y - s.y);
          if (dist < s.radius + b.radius) {
            s.health -= 10; b.active = false;
            for(let k=0;k<5;k++){ particles.push(new Particle(b.x, b.y, s.color)); }
            if (s.health <= 0) {
              for(let k=0;k<15;k++){ particles.push(new Particle(s.x, s.y, 'white')); particles.push(new Particle(s.x, s.y, s.color)); }
              ships.splice(j, 1); updateCounts();
            }
            break;
          }
        }
      }
    }

    function drawBackground() { ctx.fillStyle = '#050510'; ctx.fillRect(0,0,width,height); ctx.fillStyle = 'white'; stars.forEach(star => { ctx.globalAlpha = star.alpha; ctx.beginPath(); ctx.arc(star.x, star.y, star.size, 0, Math.PI*2); ctx.fill(); }); ctx.globalAlpha = 1.0; }

    function loop() {
      drawBackground();
      ships.forEach(s => { s.update(); s.draw(); });
      for (let i = bullets.length - 1; i >= 0; i--) { let b = bullets[i]; b.update(); b.draw(); if (!b.active) bullets.splice(i, 1); }
      for (let i = particles.length - 1; i >= 0; i--) { let p = particles[i]; p.update(); p.draw(); if (p.life <= 0) particles.splice(i, 1); }
      checkCollisions(); rafRef.current = requestAnimationFrame(loop);
    }

    function handleResize() { width = window.innerWidth; height = window.innerHeight; canvas.width = width; canvas.height = height; initStars(); }

    window.addEventListener('resize', handleResize);

    initStars(); resetSimulation(); loop();

    spawnShipRef.current = spawnShip; resetSimulationRef.current = resetSimulation;

    return () => { window.removeEventListener('resize', handleResize); if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  const handleSpawn = (team: 'red'|'blue') => { spawnShipRef.current(team); };
  const handleReset = () => { resetSimulationRef.current(); };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <style>{
        body { margin: 0; background-color: #050510; color: white; font-family: 'Courier New', Courier, monospace; }
        canvas { display: block; }
        #ui-layer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; display: flex; flex-direction: column; justify-content: space-between; }
        .top-bar { background: rgba(0, 0, 0, 0.5); padding: 10px; display: flex; justify-content: center; gap: 40px; font-size: 24px; font-weight: bold; text-shadow: 0 0 5px black; }
        .red-text { color: #ff4d4d; }
        .blue-text { color: #4d4dff; }
        .controls { pointer-events: auto; background: rgba(0,0,0,0.8); padding: 15px; display: flex; justify-content: center; gap: 15px; border-top: 1px solid #333; }
        button { background: #333; color: white; border: 1px solid #555; padding: 10px 20px; font-family: inherit; font-size: 16px; cursor: pointer; transition: 0.2s; }
        button:hover { background: #555; } button:active { transform: translateY(1px); }
        .btn-red { border-bottom: 3px solid #ff4d4d; } .btn-blue { border-bottom: 3px solid #4d4dff; } .btn-reset { border-bottom: 3px solid white; }
      }</style>

      <canvas ref={canvasRef} id="gameCanvas" />

      <div id="ui-layer">
        <div className="top-bar">
          <div className="red-text">RED SHIPS: <span>{redCount}</span></div>
          <div className="blue-text">BLUE SHIPS: <span>{blueCount}</span></div>
        </div>

        <div className="controls">
          <button className="btn-red" onClick={() => handleSpawn('red')}>+1 RED</button>
          <button className="btn-blue" onClick={() => handleSpawn('blue')}>+1 BLUE</button>
          <button className="btn-reset" onClick={handleReset}>RESET</button>
        </div>
      </div>
    </div>
  );
};

export default RedVsBlue;
