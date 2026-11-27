'use strict';
/* ===== ASHEN HOLLOW - enemies, projectiles, bosses ===== */
const E_DEF = {
  c: { hp: 3, w: 28, h: 20, spd: 52, soul: 11, name: 'Crawler' },
  f: { hp: 2, w: 24, h: 22, spd: 90, soul: 9, name: 'Wisp' },
  h: { hp: 9, w: 34, h: 46, spd: 60, soul: 18, name: 'Husk Guard' },
  s: { hp: 4, w: 26, h: 34, spd: 0, soul: 12, name: 'Spitter' },
  l: { hp: 4, w: 26, h: 32, spd: 0, soul: 12, name: 'Leaper' },
};
const sg = v => (v < 0 ? -1 : 1);
function spawnParts(x, y, n, col, spd, life) {
  for (let i = 0; i < n; i++) {
    const a = rnd(0, 6.283), s = rnd(30, spd || 220);
    G.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40, life: rnd(0.25, life || 0.6), max: life || 0.6, col, sz: rnd(2, 5), g: 380 });
  }
}
function shoot(x, y, vx, vy, o) {
  G.proj.push(Object.assign({ x, y, vx, vy, g: 0, r: 8, life: 4, col: '#e8f0ff', dmg: 1, kind: 'orb', hitW: true }, o || {}));
}
function addText(x, y, s, col) { G.texts.push({ x, y, s: String(s), col: col || '#fff', life: 1.0 }); }

/* ---------- ordinary enemies ---------- */
function spawnEnemy(t, tx, ty) {
  const d = E_DEF[t];
  const e = Object.assign(newBody({ dash: false, dj: false }), { t, x: tx * T + T / 2, y: (ty + 1) * T, w: d.w, h: d.h, hp: d.hp, maxhp: d.hp, soul: d.soul,
    dir: Math.random() < 0.5 ? -1 : 1, st: 'idle', stT: rnd(0.3, 1.2), flash: 0, stun: 0, home: { x: tx * T + T / 2, y: (ty + 1) * T }, anim: rnd(0, 6), dead: false });
  if (t === 'f') { e.y = ty * T + 40; e.home.y = e.y; }
  G.enemies.push(e);
}
function groundAhead(e, dir) {
  const tx = Math.floor((e.x + dir * (e.w / 2 + 6)) / T), ty = Math.floor((e.y + 4) / T);
  const c = G.W.t(tx, ty);
  return c === '#' || c === 'W' || c === 'L' || c === '=';
}
function updEnemy(e, dt) {
  const p = G.p, dx = p.x - e.x, dy = (p.y - 20) - (e.y - e.h / 2), adx = Math.abs(dx);
  e.flash = Math.max(0, e.flash - dt); e.stun -= dt; e.stT -= dt; e.anim += dt;
  const flying = e.t === 'f';
  if (e.stun > 0) {
    e.vx *= Math.pow(0.02, dt);
    if (!flying) e.vy = Math.min(MAXFALL, e.vy + GRAV * dt); else e.vy *= Math.pow(0.05, dt);
    moveBox(e, dt, G.W); return;
  }
  if (e.t === 'c') {
    if (!groundAhead(e, e.dir) || e.hitWall) e.dir = -e.dir;
    e.vx = e.dir * E_DEF.c.spd;
  } else if (e.t === 'h') {
    if (e.st === 'idle') {
      if (!groundAhead(e, e.dir) || e.hitWall) e.dir = -e.dir;
      e.vx = e.dir * E_DEF.h.spd;
      if (adx < 240 && Math.abs(dy) < 70 && e.stT <= 0) { e.st = 'wind'; e.stT = 0.55; e.dir = sg(dx); e.vx = 0; }
    } else if (e.st === 'wind') { e.vx = 0; if (e.stT <= 0) { e.st = 'charge'; e.stT = 0.6; } }
    else if (e.st === 'charge') {
      e.vx = e.dir * 330;
      if (e.stT <= 0 || e.hitWall || !groundAhead(e, e.dir)) { e.st = 'rest'; e.stT = 0.8; e.vx = 0; }
    } else if (e.st === 'rest') { e.vx = 0; if (e.stT <= 0) { e.st = 'idle'; e.stT = 1.2; } }
  } else if (e.t === 's') {
    e.dir = sg(dx); e.vx = 0;
    if (e.stT <= 0 && adx < 460 && Math.abs(dy) < 240) {
      e.stT = 2.3;
      shoot(e.x + e.dir * 14, e.y - 24, clamp(dx * 0.9, -330, 330), -300, { g: 700, r: 7, col: '#9fe0a0', life: 3 });
    }
  } else if (e.t === 'l') {
    if (e.ground) e.vx *= 0.6;
    e.dir = sg(dx);
    if (e.ground && e.stT <= 0 && adx < 380) { e.vy = -600; e.vx = e.dir * clamp(adx * 1.3, 120, 260); e.stT = rnd(1.1, 1.8); e.ground = false; }
  } else if (flying) {
    if (e.st === 'idle') {
      e.vx = Math.sin(e.anim * 1.7) * 40; e.vy = Math.cos(e.anim * 2.3) * 30 + (e.home.y - e.y) * 1.5;
      if (adx < 300 && Math.abs(dy) < 260 && e.stT <= 0) { e.st = 'wind'; e.stT = 0.5; }
    } else if (e.st === 'wind') {
      e.vx *= 0.8; e.vy = -30;
      if (e.stT <= 0) { const L = Math.max(1, Math.hypot(dx, dy)); e.vx = dx / L * 400; e.vy = dy / L * 400; e.st = 'swoop'; e.stT = 0.75; }
    } else if (e.st === 'swoop') { if (e.stT <= 0 || e.hitWall || e.ground) { e.st = 'back'; e.stT = 1.2; } }
    else if (e.st === 'back') {
      const hx = e.home.x - e.x, hy = e.home.y - e.y, L = Math.max(1, Math.hypot(hx, hy));
      e.vx = hx / L * 150; e.vy = hy / L * 150;
      if (L < 20 || e.stT <= 0) { e.st = 'idle'; e.stT = 1.5; }
    }
  }
  if (!flying) e.vy = Math.min(MAXFALL, e.vy + GRAV * dt);
  moveBox(e, dt, G.W);
  if (e.t === 'l' && e.ground && e.vy === 0) e.vx *= 0.7;
  if (touchBody(e)) hurtPlayer(1, e.x);
}
function touchBody(e) {
  const p = G.p;
  return rectOv(p.x - 9, p.y - 42, 18, 42, e.x - e.w / 2 + 3, e.y - e.h + 3, e.w - 6, e.h - 4);
}
function hurtEnemy(e, dmg, dir) {
  e.hp -= dmg; e.flash = 0.12; e.stun = 0.18; e.vx += dir * (e.t === 'h' ? 120 : 260); if (e.t === 'f') e.vy -= 80;
  if (e.st === 'wind' && e.t === 'h') e.stT = Math.max(e.stT, 0.2);
  spawnParts(e.x, e.y - e.h / 2, 6, '#dfe8ff', 220, 0.4);
  G.p.soul = Math.min(99, G.p.soul + (save.equipped.includes('soul') ? 16.5 : 11));
  if (e.hp <= 0) {
    e.dead = true; spawnParts(e.x, e.y - e.h / 2, 18, '#bfc9e8', 300, 0.8);
    sfx('hit'); G.hitstop = Math.max(G.hitstop, 0.07);
  } else sfx('hit');
}

/* ---------- projectiles ---------- */
function updProj(dt) {
  const p = G.p;
  for (let i = G.proj.length - 1; i >= 0; i--) {
    const q = G.proj[i];
    q.life -= dt; q.vy += q.g * dt; q.x += q.vx * dt; q.y += q.vy * dt;
    let kill = q.life <= 0 || q.x < -50 || q.x > G.W.w * T + 50 || q.y > G.W.h * T + 50;
    if (!kill && q.hitW && G.W.solid(Math.floor(q.x / T), Math.floor(q.y / T))) kill = true;
    if (!kill && q.fromPlayer) {
      for (const e of G.enemies) if (!e.dead && rectOv(q.x-q.r,q.y-q.r,q.r*2,q.r*2,e.x-e.w/2,e.y-e.h,e.w,e.h)) { hurtEnemy(e,q.dmg,Math.sign(q.vx)||1); kill=true; break; }
      if (!kill && G.boss && !G.boss.dead && rectOv(q.x-q.r,q.y-q.r,q.r*2,q.r*2,G.boss.x-G.boss.w/2,G.boss.y-G.boss.h,G.boss.w,G.boss.h)) { hurtBoss(G.boss,q.dmg,Math.sign(q.vx)||1); kill=true; }
    } else if (!kill) {
      let hit;
      if (q.kind === 'wave') hit = rectOv(p.x - 9, p.y - 42, 18, 42, q.x - q.r, q.y - q.h, q.r * 2, q.h);
      else hit = rectOv(p.x - 9, p.y - 42, 18, 42, q.x - q.r, q.y - q.r, q.r * 2, q.r * 2);
      if (hit) { hurtPlayer(q.dmg, q.x); if (q.kind !== 'wave') kill = true; }
    }
    if (kill) { if (q.kind !== 'wave') spawnParts(q.x, q.y, 4, q.col, 120, 0.3); G.proj.splice(i, 1); }
  }
}

/* ---------- bosses ---------- */
const BOSS_DEF = {
  warden: { name: 'THE HOLLOW WARDEN', hp: 42, w: 46, h: 78, col: '#c9d3e8' },
  weaver: { name: 'THE WEEPING WEAVER', hp: 54, w: 54, h: 42, col: '#b9a3d6' },
  duelist: { name: 'THE ASHEN DUELIST', hp: 62, w: 26, h: 58, col: '#e8b4a0' },
  sovereign: { name: 'THE HOLLOW SOVEREIGN', hp: 130, w: 62, h: 104, col: '#f2e8c8' },
};
function spawnBoss(rm) {
  const d = BOSS_DEF[rm.boss.id], fy = rm.boss.floorRow * T;
  const b = Object.assign(newBody({ dash: false, dj: false }), { id: rm.boss.id, x: rm.boss.x * T + T / 2, y: fy, w: d.w, h: d.h, hp: d.hp, maxhp: d.hp, name: d.name,
    st: 'intro', stT: 1.8, t: 0, mv: null, last: '', hbs: [], flash: 0, face: -1, phase: 1, dead: false, vis: 1, warn: 0,
    ax0: T * 1.5, ax1: (rm.w - 1.5) * T, floorY: fy, ceilY: rm.boss.ceilRow * T, cols: [], stack: 0 });
  G.boss = b; sfx('boss');
}
function faceP(b) { b.face = sg(G.p.x - b.x); }
function hb(b, x, y, w, h) { b.hbs.push({ x, y, w, h }); }
function front(b, reach, hh, oy) { const x0 = b.face > 0 ? b.x : b.x - reach; hb(b, x0, b.y - (oy === undefined ? hh + 6 : oy), reach + b.w / 2 * 0 + 0, hh); }
function wave(b, dir, h, spd, col) { shoot(b.x + dir * 30, b.y, dir * spd, 0, { kind: 'wave', r: 16, h: h, hitW: false, life: 3.2, col: col || '#dfe6ff' }); }
function land(b, big) {
  G.shake = Math.max(G.shake, big ? 14 : 9); sfx('boom'); spawnParts(b.x, b.y, 14, '#9aa4c0', 320, 0.6);
}
const MV = {};
/* each move: { tele, dur, rec, start(b), tick(b,dt,t), end(b) } */
MV.warden = {
  lunge: { tele: 0.55, dur: 0.5, rec: 0.75, start(b) { b.vx = 0; }, tick(b, dt, t) { if (t < 0.4) { b.vx = b.face * (b.phase > 1 ? 640 : 520); front(b, 70, 48); } else b.vx = 0; }, end(b) { b.vx = 0; } },
  slam: { tele: 0.6, dur: 1.7, rec: 0.9,
    start(b) { b.vy = -820; b.ground = false; b.vx = clamp((G.p.x - b.x) * 1.2, -340, 340); b.landed = false; },
    tick(b, dt, t) { if (!b.landed && t > 0.25 && b.ground) { b.landed = true; b.vx = 0; land(b, true); wave(b, -1, 34, 310); wave(b, 1, 34, 310); if (b.phase > 1) { shoot(b.x, b.ceilY + 20, 0, 0, { g: 1100, r: 12, col: '#cfd6ea' }); } b.t = 99; } else if (!b.landed) hb(b, b.x - 30, b.y - b.h, 60, b.h); },
    end(b) { b.vx = 0; } },
  sweep: { tele: 0.5, dur: 0.55, rec: 0.7, start(b) { b.vx = 0; }, tick(b, dt, t) { if (t > 0.08 && t < 0.3) front(b, 120, 60); else if (t > 0.3 && t < 0.48) { hb(b, b.x - 100, b.y - 66, 200, 60); } }, end(b) { b.vx = 0; } },
  combo: { tele: 0.4, dur: 1.3, rec: 0.9, start(b) { b.n = 0; b.nt = 0; },
    tick(b, dt, t) { b.nt -= dt; if (b.n < 2 && b.nt <= 0) { faceP(b); b.n++; b.nt = 0.55; b.lt = 0.3; } if (b.lt > 0) { b.lt -= dt; b.vx = b.face * 620; front(b, 70, 48); } else b.vx = 0; },
    end(b) { b.vx = 0; } },
};
MV.weaver = {
  webs: { tele: 0.5, dur: 0.6, rec: 0.7, start(b) { b.fired = false; faceP(b); },
    tick(b, dt, t) { if (!b.fired && t > 0.1) { b.fired = true; const n = b.phase > 1 ? 5 : 3, a0 = Math.atan2(G.p.y - 24 - (b.y - 20), G.p.x - b.x); for (let i = 0; i < n; i++) { const a = a0 + (i - (n - 1) / 2) * 0.24; shoot(b.x, b.y - 22, Math.cos(a) * 340, Math.sin(a) * 340, { col: '#e0d2ff', r: 8 }); } sfx('swing'); } }, end() {} },
  pounce: { tele: 0.45, dur: 1.6, rec: 0.8,
    start(b) { faceP(b); b.vy = -740; b.ground = false; b.vx = clamp((G.p.x - b.x) * 1.5, -500, 500); b.landed = false; },
    tick(b, dt, t) { if (!b.landed && t > 0.25 && b.ground) { b.landed = true; b.vx = 0; land(b, false); if (b.phase > 1) { shoot(b.x - 20, b.y - 10, -280, -10, { col: '#e0d2ff' }); shoot(b.x + 20, b.y - 10, 280, -10, { col: '#e0d2ff' }); } b.t = 99; } else if (!b.landed) hb(b, b.x - 26, b.y - b.h, 52, b.h); },
    end(b) { b.vx = 0; } },
  skitter: { tele: 0.35, dur: 0.9, rec: 0.35,
    start(b) { b.dirk = (b.x > (b.ax0 + b.ax1) / 2) ? -1 : 1; b.face = b.dirk; },
    tick(b, dt, t) { b.vx = b.dirk * 520; hb(b, b.x - 26, b.y - b.h, 52, b.h); if (b.hitWall || b.x < b.ax0 + 30 || b.x > b.ax1 - 30) b.t = 99; }, end(b) { b.vx = 0; } },
  rain: { tele: 0.7, dur: 1.9, rec: 0.8, start(b) { b.rt = 0; b.vx = 0; },
    tick(b, dt, t) { b.rt -= dt; if (b.rt <= 0 && t < 1.5) { b.rt = b.phase > 1 ? 0.2 : 0.3; const x = clamp(G.p.x + rnd(-90, 90), b.ax0, b.ax1); shoot(x, b.ceilY + 18, 0, 40, { g: 1300, r: 10, col: '#cbb8e8', life: 3 }); } }, end() {} },
};
MV.duelist = {
  dashslash: { tele: 0.35, dur: 0.4, rec: 0.45, start(b) { faceP(b); },
    tick(b, dt, t) { if (t < 0.3) { b.vx = b.face * (b.phase > 1 ? 900 : 780); front(b, 76, 44); } else b.vx = 0; }, end(b) { b.vx = 0; } },
  combo: { tele: 0.4, dur: 1.5, rec: 0.7, start(b) { b.n = 0; b.nt = 0; b.lt = 0; },
    tick(b, dt, t) { b.nt -= dt; const max = b.phase > 1 ? 4 : 3; if (b.n < max && b.nt <= 0) { faceP(b); b.n++; b.nt = 0.38; b.lt = 0.24; } if (b.lt > 0) { b.lt -= dt; b.vx = b.face * 600; front(b, 72, 44); } else b.vx *= 0.8; }, end(b) { b.vx = 0; } },
  dive: { tele: 0.4, dur: 1.8, rec: 0.9,
    start(b) { b.vy = -980; b.ground = false; b.vx = 0; b.st2 = 0; b.landed = false; },
    tick(b, dt, t) {
      if (b.st2 === 0 && t > 0.55) { b.st2 = 1; b.vx = clamp((G.p.x - b.x) * 1.4, -420, 420); b.vy = 950; }
      if (b.st2 === 1) { hb(b, b.x - 22, b.y - b.h, 44, b.h + 10); if (b.ground) { b.st2 = 2; b.vx = 0; land(b, false); wave(b, -1, 26, 360, '#f0b8a0'); wave(b, 1, 26, 360, '#f0b8a0'); b.t = 99; } }
    }, end(b) { b.vx = 0; } },
  blades: { tele: 0.4, dur: 0.9, rec: 0.7, start(b) { faceP(b); b.k = 0; b.kt = 0; },
    tick(b, dt, t) { b.kt -= dt; if (b.k < 3 && b.kt <= 0) { const ys = [b.y - 12, b.y - 40, b.y - 90]; shoot(b.x + b.face * 24, ys[b.k], b.face * 440, 0, { kind: 'orb', r: 9, col: '#ffd0b8' }); b.k++; b.kt = 0.2; sfx('swing'); } }, end() {} },
  retreat: { tele: 0.2, dur: 0.7, rec: 0.25, start(b) { b.vy = -420; b.ground = false; b.vx = -b.face * 520; }, tick(b, dt, t) { if (b.ground && t > 0.2) { b.vx = 0; b.t = 99; } }, end(b) { b.vx = 0; } },
};
MV.sovereign = {
  stomp: { tele: 0.7, dur: 1.9, rec: 1.0,
    start(b) { b.vy = -1000; b.ground = false; b.vx = clamp((G.p.x - b.x) * 1.1, -380, 380); b.landed = false; },
    tick(b, dt, t) { if (!b.landed && t > 0.3 && b.ground) { b.landed = true; b.vx = 0; land(b, true); wave(b, -1, 46, 330, '#f6ecc4'); wave(b, 1, 46, 330, '#f6ecc4'); for (let i = 0; i < 2 + b.phase; i++) shoot(clamp(G.p.x + rnd(-200, 200), b.ax0, b.ax1), b.ceilY + 16, 0, 0, { g: 1000, r: 12, col: '#f6ecc4', life: 3 }); b.t = 99; } else if (!b.landed) hb(b, b.x - 34, b.y - b.h, 68, b.h); },
    end(b) { b.vx = 0; } },
  orbs: { tele: 0.6, dur: 1.5, rec: 0.9, start(b) { b.bursts = 0; b.bt = 0; b.vx = 0; },
    tick(b, dt, t) { b.bt -= dt; const max = b.phase > 2 ? 3 : b.phase > 1 ? 2 : 1; if (b.bursts < max && b.bt <= 0) { b.bt = 0.55; const n = b.phase > 1 ? 12 : 8, off = b.bursts * 0.3; for (let i = 0; i < n; i++) { const a = off + i / n * 6.283; shoot(b.x, b.y - 60, Math.cos(a) * 250, Math.sin(a) * 250, { r: 9, col: '#f6ecc4', life: 3.5 }); } b.bursts++; sfx('boom'); } }, end() {} },
  rift: { tele: 0.5, dur: 1.1, rec: 0.7,
    start(b) { b.vx = 0; b.rf = 0; b.vis = 1; },
    tick(b, dt, t) {
      if (b.rf === 0) { b.vis = Math.max(0, 1 - t / 0.35); if (t > 0.45) { b.rf = 1; const side = Math.random() < 0.5 ? -1 : 1; b.x = clamp(G.p.x + side * 100, b.ax0 + 40, b.ax1 - 40); b.y = b.floorY; b.vy = 0; faceP(b); b.vis = 1; b.rt = 0; } }
      else { b.rt += dt; if (b.rt < 0.18) b.vis = 0.5; else if (b.rt < 0.4) { hb(b, b.face > 0 ? b.x : b.x - 120, b.y - 80, 120, 70); b.vx = b.face * 160; } else b.vx = 0; if (b.rt > 0.5) b.t = 99; }
    }, end(b) { b.vis = 1; b.vx = 0; } },
  beam: { tele: 0.9, dur: 1.5, rec: 1.0,
    start(b) { b.vx = 0; const n = b.phase > 2 ? 5 : 3, px = G.p.x; b.cols = []; for (let i = 0; i < n; i++) b.cols.push(clamp(px + (i - (n - 1) / 2) * (b.phase > 2 ? 120 : 170), b.ax0, b.ax1)); },
    tick(b, dt, t) { if (t > 0.6 && t < 1.0) for (const c of b.cols) hb(b, c - 20, b.ceilY, 40, b.floorY - b.ceilY); b.beamWarn = t < 0.6; },
    end(b) { b.cols = []; b.beamWarn = false; } },
  sweep: { tele: 0.6, dur: 0.7, rec: 0.8, start(b) { b.vx = 0; faceP(b); }, tick(b, dt, t) { if (t > 0.1 && t < 0.45) hb(b, b.x - 150, b.y - 70, 300, 70); }, end() {} },
};
const BOSS_PICK = {
  warden: p => (p > 1 ? ['lunge', 'slam', 'sweep', 'combo', 'slam'] : ['lunge', 'slam', 'sweep']),
  weaver: p => (p > 1 ? ['webs', 'pounce', 'rain', 'skitter', 'pounce', 'webs'] : ['webs', 'pounce', 'rain', 'skitter']),
  duelist: p => (p > 1 ? ['dashslash', 'combo', 'dive', 'blades', 'retreat', 'combo'] : ['dashslash', 'combo', 'dive', 'blades', 'retreat']),
  sovereign: p => (p > 2 ? ['stomp', 'orbs', 'rift', 'beam', 'sweep', 'rift', 'beam'] : p > 1 ? ['stomp', 'orbs', 'rift', 'beam', 'sweep'] : ['stomp', 'orbs', 'rift', 'sweep']),
};
function hurtBoss(b, dmg, dir) {
  if (b.st === 'intro' || b.dead) return false;
  b.hp -= dmg; b.flash = 0.1; b.stack++;
  spawnParts(b.x, b.y - b.h / 2, 7, '#ffffff', 260, 0.45); sfx('bosshit');
  G.p.soul = Math.min(99, G.p.soul + (save.equipped.includes('soul') ? 16.5 : 11));
  if (b.hp <= 0) { b.hp = 0; killBoss(b); }
  return true;
}
function updBoss(b, dt) {
  if (b.dead) return;
  b.flash = Math.max(0, b.flash - dt); b.hbs.length = 0;
  const frac = b.hp / b.maxhp;
  b.phase = b.id === 'sovereign' ? (frac > 0.66 ? 1 : frac > 0.33 ? 2 : 3) : (frac > 0.5 ? 1 : 2);
  const spd = b.phase > 1 ? 0.75 : 1;
  b.stT -= dt;
  if (b.st === 'intro') { faceP(b); b.vx = 0; if (b.stT <= 0) { b.st = 'idle'; b.stT = 0.5; } }
  else if (b.st === 'idle') {
    faceP(b);
    const far = Math.abs(G.p.x - b.x) > 260 && (b.id === 'warden' || b.id === 'duelist');
    b.vx = far ? b.face * 130 : 0;
    if (b.stT <= 0) {
      const opts = BOSS_PICK[b.id](b.phase).filter(n => n !== b.last);
      const name = opts[(Math.random() * opts.length) | 0];
      b.last = name; b.mv = MV[b.id][name]; b.mvName = name; b.st = 'tele'; b.stT = b.mv.tele * spd; b.vx = 0;
      if (b.id === 'warden' && name === 'lunge' || b.id === 'duelist' && name === 'dashslash') faceP(b);
    }
  } else if (b.st === 'tele') {
    b.vx = 0; b.warn = 1; if (b.mvName !== 'rift') faceP(b);
    if (b.stT <= 0) { b.st = 'act'; b.t = 0; b.warn = 0; b.mv.start(b); }
  } else if (b.st === 'act') {
    b.t += dt; b.mv.tick(b, dt, b.t);
    if (b.t >= b.mv.dur) { b.mv.end(b); b.st = 'rec'; b.stT = b.mv.rec * spd; b.vx = 0; }
  } else if (b.st === 'rec') {
    b.vx *= Math.pow(0.001, dt); if (b.stT <= 0) { b.st = 'idle'; b.stT = (b.phase > 2 ? 0.25 : b.phase > 1 ? 0.4 : 0.6); }
  }
  const airMoves = b.st === 'act' && (b.mvName === 'slam' || b.mvName === 'pounce' || b.mvName === 'dive' || b.mvName === 'stomp' || b.mvName === 'retreat');
  if (!(b.id === 'sovereign' && b.mvName === 'rift' && b.st === 'act' && b.rf === 0)) b.vy = Math.min(MAXFALL + 500, b.vy + GRAV * dt);
  moveBox(b, dt, G.W);
  b.x = clamp(b.x, b.ax0, b.ax1);
  const p = G.p;
  if (b.st !== 'intro') {
    if (rectOv(p.x - 9, p.y - 42, 18, 42, b.x - b.w / 2 + 6, b.y - b.h + 6, b.w - 12, b.h - 8) && b.vis > 0.6) hurtPlayer(1, b.x);
    for (const r of b.hbs) if (rectOv(p.x - 9, p.y - 42, 18, 42, r.x, r.y, r.w, r.h)) { hurtPlayer(1, b.x); break; }
  }
}
function killBoss(b) {
  b.dead = true; G.boss = null; G.proj.length = 0; G.hitstop = 0.5; G.shake = 20; sfx('boom');
  spawnParts(b.x, b.y - b.h / 2, 60, '#ffffff', 520, 1.4);
  save.bosses[b.id] = true; G.bossDeath = { x: b.x, y: b.y - b.h / 2, t: 0, id: b.id };
  G.W.setLock(false); persist();
}
