'use strict';
/* ===== ASHEN HOLLOW - tile physics + player movement (pure, shared with tests) ===== */
const GRAV = 2100, MAXFALL = 950, RUN = 270, JUMPV = 740, DJV = 620, DASHV = 720, DASHT = 0.18, DASHCD = 0.45;
const approach = (v, t, d) => (v < t ? Math.min(v + d, t) : Math.max(v - d, t));
const sgn = v => (v < 0 ? -1 : 1);
const rectOv = (ax, ay, aw, ah, bx, by, bw, bh) => ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;

class World {
  constructor(room, broken) {
    this.room = room; this.w = room.w; this.h = room.h;
    this.g = room.g.map(r => r.split(''));
    this.locked = false;
    if (broken) for (const k of broken) { const p = k.split(':'); if (p[0] === room.id) this.g[+p[2]][+p[1]] = '.'; }
  }
  t(tx, ty) { if (tx < 0 || tx >= this.w || ty >= this.h) return '#'; if (ty < 0) return '.'; return this.g[ty][tx]; }
  solid(tx, ty) { const c = this.t(tx, ty); return c === '#' || c === 'W' || c === 'L'; }
  setLock(on) { for (const [x, y] of this.room.lockTiles) this.g[y][x] = on ? 'L' : '.'; this.locked = on; }
}

function newBody(ab) {
  return { x: 0, y: 0, vx: 0, vy: 0, w: 18, h: 42, face: 1, ground: false, coyote: 0, jbuf: 0, jumping: false, djAvail: true, airDash: true,
    dashT: 0, dashCd: 0, dashDir: 1, hurtT: 0, dropT: 0, hitWall: 0, ab: ab || { dash: false, dj: false }, slow: 1 };
}

function moveBox(b, dt, W) {
  const hw = b.w / 2;
  b.hitWall = 0;
  b.x += b.vx * dt;
  const top = Math.floor((b.y - b.h + 1) / T), bot = Math.floor((b.y - 1) / T);
  if (b.vx > 0) {
    const tx = Math.floor((b.x + hw) / T);
    for (let ty = top; ty <= bot; ty++) if (W.solid(tx, ty)) { b.x = tx * T - hw - 0.01; b.vx = 0; b.hitWall = 1; break; }
  } else if (b.vx < 0) {
    const tx = Math.floor((b.x - hw) / T);
    for (let ty = top; ty <= bot; ty++) if (W.solid(tx, ty)) { b.x = (tx + 1) * T + hw + 0.01; b.vx = 0; b.hitWall = -1; break; }
  }
  const prevY = b.y;
  b.y += b.vy * dt;
  b.ground = false;
  const l = Math.floor((b.x - hw + 0.5) / T), r = Math.floor((b.x + hw - 0.5) / T);
  if (b.vy >= 0) {
    const ty = Math.floor(b.y / T);
    for (let tx = l; tx <= r; tx++) {
      const c = W.t(tx, ty);
      const sol = c === '#' || c === 'W' || c === 'L';
      const ow = c === '=' && !(b.dropT > 0) && prevY <= ty * T + 1;
      if (sol || ow) { b.y = ty * T; b.vy = 0; b.ground = true; break; }
    }
  } else {
    const ty = Math.floor((b.y - b.h) / T);
    for (let tx = l; tx <= r; tx++) if (W.solid(tx, ty)) { b.y = (ty + 1) * T + b.h + 0.01; b.vy = 0; break; }
  }
  if (b.ground) { b.djAvail = true; b.airDash = true; b.jumping = false; }
}

/* inp: {left,right,down,jumpP,jumpH,dashP} */
function stepBody(b, inp, dt, W) {
  b.dashT -= dt; b.dashCd -= dt; b.coyote -= dt; b.jbuf -= dt; b.dropT -= dt; b.hurtT -= dt;
  if (b.ground) b.coyote = 0.1;
  if (inp.jumpP) b.jbuf = 0.12;
  const mx = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
  const ctl = b.hurtT <= 0 && !b.noCtl;
  b.dashStarted = false;
  if (ctl && inp.dashP && b.ab.dash && b.dashT <= 0 && b.dashCd <= 0 && (b.ground || b.airDash)) {
    b.dashT = DASHT; b.dashCd = DASHCD; b.dashDir = mx || b.face; b.face = b.dashDir; b.dashStarted = true;
    if (!b.ground) b.airDash = false;
  }
  b.jumped = false; b.djumped = false;
  if (b.dashT > 0) { b.vx = b.dashDir * DASHV; b.vy = 0; }
  else {
    if (ctl) {
      b.vx = approach(b.vx, mx * RUN * b.slow, (b.ground ? 5200 : 3400) * dt);
      if (mx) b.face = mx;
      if (inp.down && inp.jumpP && b.ground && W.t(Math.floor(b.x / T), Math.floor(b.y / T)) === '=') { b.dropT = 0.25; b.jbuf = 0; }
      if (b.jbuf > 0) {
        if (b.coyote > 0) { b.vy = -JUMPV; b.ground = false; b.coyote = 0; b.jbuf = 0; b.jumping = true; b.jumped = true; }
        else if (b.ab.dj && b.djAvail && !b.ground) { b.vy = -DJV; b.djAvail = false; b.jbuf = 0; b.jumping = true; b.djumped = true; }
      }
      if (!inp.jumpH && b.vy < 0 && b.jumping) { b.vy *= 0.5; b.jumping = false; }
    } else b.vx = approach(b.vx, 0, 700 * dt);
    b.vy = Math.min(MAXFALL, b.vy + GRAV * dt);
  }
  moveBox(b, dt, W);
}

function exitAt(room, b) {
  const bx = b.x - b.w / 2, by = b.y - b.h;
  for (const e of room.exits) {
    let x = e.x * T, y = e.y * T, w = e.w * T, h = e.h * T;
    if (e.x === 0) { x -= 9999; w += 9999; }
    if (e.x + e.w === room.w) w += 9999;
    if (e.y === 0) { y -= 9999; h += 9999; }
    if (e.y + e.h === room.h) h += 9999;
    if (rectOv(bx, by, b.w, b.h, x, y, w, h)) return e;
  }
  return null;
}
function spikeHit(W, b) {
  const x0 = Math.floor((b.x - b.w / 2) / T), x1 = Math.floor((b.x + b.w / 2) / T);
  const y0 = Math.floor((b.y - b.h) / T), y1 = Math.floor((b.y - 1) / T);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    if (W.t(tx, ty) === '^' && rectOv(b.x - b.w / 2 + 2, b.y - b.h, b.w - 4, b.h, tx * T + 4, ty * T + 14, T - 8, 18)) return true;
  }
  return false;
}
