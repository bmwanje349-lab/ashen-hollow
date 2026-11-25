'use strict';
/* ===== ASHEN HOLLOW - art: palettes, backgrounds, tiles, characters ===== */
let TM = 0;
const ZONES = [
  { bg0: '#070b12', bg1: '#1b2740', far: '#0f1726', mid: '#0a101c', tile: '#04070c', edge: '#4a5c7e', glow: '#9ab8ff', fog: '86,110,160', type: 'ruin', moss: '#27405a' },
  { bg0: '#041014', bg1: '#0c2c33', far: '#0a2128', mid: '#071a20', tile: '#020809', edge: '#3a8088', glow: '#6ef0dc', fog: '60,170,170', type: 'cave', moss: '#1d5a5a' },
  { bg0: '#140808', bg1: '#44201a', far: '#2a110e', mid: '#1c0b09', tile: '#070303', edge: '#9a4a32', glow: '#ffb070', fog: '190,90,60', type: 'spire', moss: '#6a2a1c' },
  { bg0: '#0a0816', bg1: '#2c2350', far: '#181232', mid: '#110c26', tile: '#040308', edge: '#7d6cc4', glow: '#efe0ff', fog: '140,110,210', type: 'throne', moss: '#3c2f78' },
];
const hash2 = (x, y) => ((((x * 73856093) ^ (y * 19349663)) >>> 0) % 1000) / 1000;
function glow(x, y, r, col, a) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a; ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
}
function roundRect(x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function txt(s, x, y, size, col, align, font) {
  ctx.font = (font || 'bold') + ' ' + size + 'px Georgia,"Times New Roman",serif';
  ctx.fillStyle = col || '#e8eefc'; ctx.textAlign = align || 'left'; ctx.textBaseline = 'middle'; ctx.fillText(s, x, y);
}

/* ---------- parallax background ---------- */
function genBG(rm) {
  let s = rm.seed >>> 0 || 1;
  const r = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  const a = [];
  for (let layer = 0; layer < 2; layer++) {
    const arr = []; const span = rm.w * T * (layer ? 0.6 : 0.35) + W + 200; let x = -60;
    while (x < span) { const w = 50 + r() * 110; arr.push({ x, w, h: 80 + r() * (layer ? 300 : 220), k: r(), k2: r() }); x += w * (0.55 + r() * 0.6); }
    a.push(arr);
  }
  return a;
}
function drawBG(rm, cx, cy) {
  const z = ZONES[rm.zone], gr = ctx.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, z.bg0); gr.addColorStop(1, z.bg1); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
  if (!rm._bg) rm._bg = genBG(rm);
  glow(W * 0.7 - cx * 0.05, 120, 260, z.glow, 0.10);
  const layers = [{ arr: rm._bg[0], f: 0.18, col: z.far, base: H - 60 }, { arr: rm._bg[1], f: 0.4, col: z.mid, base: H - 10 }];
  layers.forEach((L, li) => {
    ctx.fillStyle = L.col;
    const ox = cx * L.f, oy = cy * L.f * 0.3;
    for (const b of L.arr) {
      const x = b.x - ox; if (x > W + 40 || x + b.w < -40) continue;
      const by = L.base + oy;
      if (z.type === 'ruin' || z.type === 'throne') {
        const h = b.h * (z.type === 'throne' ? 1.3 : 1);
        ctx.fillRect(x, by - h, b.w * 0.55, h);
        if (b.k > 0.5) { ctx.beginPath(); ctx.arc(x + b.w * 0.55 + 20, by - h * 0.55, 40 + b.k * 30, Math.PI, 0); ctx.lineTo(x + b.w * 0.55 + 100, by); ctx.lineTo(x + b.w * 0.55 + 20, by); ctx.fill(); }
        if (z.type === 'throne') ctx.fillRect(x - 6, by - h, b.w * 0.55 + 12, 14);
      } else if (z.type === 'cave') {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + b.w, 0); ctx.lineTo(x + b.w * 0.5, b.h * 0.9 * (0.4 + b.k * 0.6) - oy); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x, by + 4); ctx.lineTo(x + b.w * 0.5, by - b.h * 0.5 * b.k2 - 20); ctx.lineTo(x + b.w, by + 4); ctx.fill();
      } else {
        ctx.beginPath(); ctx.moveTo(x, by + 4); ctx.lineTo(x + b.w * 0.35, by - b.h * 1.2 * (0.5 + b.k * 0.5)); ctx.lineTo(x + b.w * 0.7, by + 4); ctx.fill();
        if (b.k2 > 0.6) glow(x + b.w * 0.35, by - b.h * 0.7, 40, z.glow, 0.12);
      }
    }
  });
  /* fog bands */
  for (let i = 0; i < 3; i++) {
    const y = 260 + i * 90 + Math.sin(TM * 0.2 + i) * 14, g = ctx.createLinearGradient(0, y - 70, 0, y + 70);
    g.addColorStop(0, 'rgba(' + z.fog + ',0)'); g.addColorStop(0.5, 'rgba(' + z.fog + ',' + (0.07 + i * 0.02) + ')'); g.addColorStop(1, 'rgba(' + z.fog + ',0)');
    ctx.fillStyle = g; ctx.fillRect(0, y - 70, W, 140);
  }
}

/* ---------- tiles ---------- */
function drawTiles(rm, Wd, cx, cy) {
  const z = ZONES[rm.zone], x0 = Math.max(0, Math.floor(cx / T) - 1), x1 = Math.min(rm.w - 1, Math.floor((cx + W) / T) + 1);
  const y0 = Math.max(0, Math.floor(cy / T) - 1), y1 = Math.min(rm.h - 1, Math.floor((cy + H) / T) + 1);
  const sol = (x, y) => { const c = Wd.t(x, y); return c === '#' || c === 'W' || c === 'L'; };
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    const c = Wd.t(tx, ty), px = tx * T, py = ty * T;
    if (c === '#' || c === 'W') {
      ctx.fillStyle = z.tile; ctx.fillRect(px, py, T + 0.5, T + 0.5);
      const h = hash2(tx, ty);
      if (h > 0.72) { ctx.fillStyle = 'rgba(' + z.fog + ',0.06)'; ctx.fillRect(px + h * 18, py + ((h * 91) % 1) * 20, 8, 5); }
      ctx.fillStyle = z.edge;
      if (!sol(tx, ty - 1)) { ctx.globalAlpha = 0.9; ctx.fillRect(px, py, T, 3); ctx.fillStyle = z.moss; ctx.fillRect(px, py + 3, T, 3 + h * 4); ctx.globalAlpha = 1; }
      if (!sol(tx - 1, ty)) { ctx.globalAlpha = 0.45; ctx.fillRect(px, py, 2, T); ctx.globalAlpha = 1; }
      if (!sol(tx + 1, ty)) { ctx.globalAlpha = 0.45; ctx.fillRect(px + T - 2, py, 2, T); ctx.globalAlpha = 1; }
      if (!sol(tx, ty + 1)) { ctx.globalAlpha = 0.3; ctx.fillRect(px, py + T - 2, T, 2); ctx.globalAlpha = 1; }
      if (c === 'W') {
        ctx.strokeStyle = 'rgba(' + z.fog + ',0.55)'; ctx.lineWidth = 2; ctx.beginPath();
        ctx.moveTo(px + 6, py + 2); ctx.lineTo(px + 16, py + 14); ctx.lineTo(px + 10, py + 24); ctx.lineTo(px + 22, py + 31);
        ctx.moveTo(px + 16, py + 14); ctx.lineTo(px + 27, py + 10); ctx.stroke();
      }
    } else if (c === 'L') {
      const a = 0.45 + 0.25 * Math.sin(TM * 6 + ty);
      ctx.fillStyle = z.tile; ctx.fillRect(px, py, T, T);
      ctx.fillStyle = z.glow; ctx.globalAlpha = a; ctx.fillRect(px + 4, py, 4, T); ctx.fillRect(px + 14, py, 4, T); ctx.fillRect(px + 24, py, 4, T); ctx.globalAlpha = 1;
    } else if (c === '=') {
      ctx.fillStyle = z.tile; ctx.fillRect(px, py, T, 8);
      ctx.fillStyle = z.edge; ctx.fillRect(px, py, T, 3); ctx.fillStyle = z.moss; ctx.fillRect(px, py + 3, T, 2);
    } else if (c === '^') {
      ctx.fillStyle = '#c4cbe0'; ctx.strokeStyle = '#05070c'; ctx.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) { const sx = px + i * 10.6; ctx.beginPath(); ctx.moveTo(sx, py + T); ctx.lineTo(sx + 5.3, py + 12); ctx.lineTo(sx + 10.6, py + T); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    }
  }
}

/* ---------- decor ---------- */
function drawDecor(rm, Wd) {
  const z = ZONES[rm.zone];
  for (const b of rm.benches) {
    const x = b.x * T + 16, y = (b.y + 1) * T;
    glow(x, y - 30, 80, '#fff0c0', 0.25 + 0.05 * Math.sin(TM * 3));
    ctx.fillStyle = '#05070c'; ctx.strokeStyle = '#8a97b8'; ctx.lineWidth = 2;
    ctx.fillRect(x - 24, y - 14, 48, 8); ctx.strokeRect(x - 24, y - 14, 48, 8);
    ctx.beginPath(); ctx.moveTo(x - 22, y - 14); ctx.quadraticCurveTo(x - 24, y - 44, x, y - 40); ctx.quadraticCurveTo(x + 24, y - 44, x + 22, y - 14); ctx.stroke();
    ctx.fillRect(x - 20, y - 6, 5, 6); ctx.fillRect(x + 15, y - 6, 5, 6);
    ctx.fillStyle = '#fff0c0'; ctx.beginPath(); ctx.arc(x, y - 46, 4, 0, 7); ctx.fill();
  }
  for (const s of rm.signs) {
    const x = s.x * T + 16, y = (s.y + 1) * T;
    ctx.fillStyle = '#05070c'; ctx.strokeStyle = z.edge; ctx.lineWidth = 2;
    ctx.fillRect(x - 2, y - 36, 4, 36); ctx.fillRect(x - 14, y - 44, 28, 16); ctx.strokeRect(x - 14, y - 44, 28, 16);
    ctx.fillStyle = z.edge; ctx.fillRect(x - 8, y - 39, 16, 2); ctx.fillRect(x - 8, y - 34, 12, 2);
  }
  const items = rm.picks.slice();
  if (rm.reward && rm.boss && save.bosses[rm.boss.id]) items.push(rm.reward);
  for (const it of items) {
    if (save.picks[it.id]) continue;
    const x = it.x * T + 16, y = (it.y + 1) * T - 26 + Math.sin(TM * 2.4) * 4;
    glow(x, y, 70, '#fff0c0', 0.45);
    ctx.save(); ctx.translate(x, y); ctx.fillStyle = '#fff6d8'; ctx.strokeStyle = '#ffe9a8'; ctx.lineWidth = 2;
    if (it.t === 'H') { ctx.beginPath(); ctx.moveTo(0, 12); ctx.bezierCurveTo(-18, -2, -12, -16, 0, -6); ctx.bezierCurveTo(12, -16, 18, -2, 0, 12); ctx.fill(); }
    else if (it.t === 'D') { ctx.beginPath(); ctx.moveTo(-14, 10); ctx.lineTo(10, -2); ctx.lineTo(-14, -10); ctx.lineTo(-6, 0); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(14, 10); ctx.lineTo(18, 0); ctx.lineTo(14, -10); ctx.stroke(); }
    else if (it.t === 'J') { ctx.beginPath(); ctx.moveTo(0, 12); ctx.quadraticCurveTo(-24, 0, -16, -14); ctx.quadraticCurveTo(-8, -4, 0, -2); ctx.quadraticCurveTo(8, -4, 16, -14); ctx.quadraticCurveTo(24, 0, 0, 12); ctx.fill(); }
    else { ctx.rotate(-0.8); ctx.fillRect(-2, -18, 4, 30); ctx.fillRect(-9, 8, 18, 3); ctx.fillRect(-2, 11, 4, 8); }
    ctx.restore();
  }
}

/* ---------- player ---------- */
function drawPlayer(p) {
  if (p.dead) return;
  const blink = p.inv > 0 && ((TM * 18) | 0) % 2 === 0;
  ctx.save(); ctx.translate(p.x, p.y); if (blink) ctx.globalAlpha = 0.4;
  if (p.healT > 0) glow(0, -26, 60 + p.healT * 40, '#fff6c8', 0.6);
  if (p.dashT > 0) { ctx.globalAlpha = 0.25; for (let i = 1; i < 4; i++) { ctx.fillStyle = '#9ab8ff'; ctx.fillRect(-p.dashDir * i * 18 - 9, -40, 18, 38); } ctx.globalAlpha = blink ? 0.4 : 1; }
  ctx.scale(p.face, 1);
  const run = p.ground && Math.abs(p.vx) > 30, ph = run ? Math.sin(p.anim * 3) : 0, air = !p.ground;
  const sway = air ? Math.min(8, Math.max(-10, p.vy * -0.01)) : 0;
  ctx.fillStyle = '#080a10'; ctx.strokeStyle = '#5b6b8c'; ctx.lineWidth = 1.6;
  ctx.fillRect(-5 + ph * 5, -7, 4, 7); ctx.fillRect(2 - ph * 5, -7, 4, 7);
  ctx.beginPath(); ctx.moveTo(-7, -30); ctx.quadraticCurveTo(0, -34, 7, -30); ctx.lineTo(11 + sway * 0.3, -6); ctx.quadraticCurveTo(0, -3 + (run ? Math.abs(ph) * 2 : 0), -11 + sway * 0.3, -6); ctx.closePath(); ctx.fill(); ctx.stroke();
  const bob = run ? Math.abs(ph) * 1.5 : Math.sin(TM * 2) * 0.6;
  ctx.fillStyle = '#eef2fb'; ctx.beginPath(); ctx.ellipse(0, -38 - bob, 9, 10, 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-4, -30 - bob); ctx.lineTo(0, -26 - bob); ctx.lineTo(4, -30 - bob); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-5, -46 - bob); ctx.quadraticCurveTo(-12, -54, -8, -62 - bob); ctx.quadraticCurveTo(-6, -54, -2, -47 - bob); ctx.fill();
  ctx.beginPath(); ctx.moveTo(5, -46 - bob); ctx.quadraticCurveTo(12, -54, 8, -62 - bob); ctx.quadraticCurveTo(6, -54, 2, -47 - bob); ctx.fill();
  ctx.fillStyle = '#0a0c12'; ctx.beginPath(); ctx.ellipse(-3.4, -38 - bob, 2, 3.2, 0.2, 0, 7); ctx.ellipse(3.4, -38 - bob, 2, 3.2, -0.2, 0, 7); ctx.fill();
  ctx.strokeStyle = '#e8eefc'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-5, -26); ctx.lineTo(-18, -40); ctx.stroke();
  ctx.restore();
  if (p.atkT > 0 && p.atkAge < 0.24) {
    const q = Math.min(1, p.atkAge / 0.16), a = 1 - Math.max(0, (p.atkAge - 0.1) / 0.14), r = 78 + (save.sword ? 22 : 0), cxs = p.x, cys = p.y - 30;
    ctx.save(); ctx.lineCap = 'round';
    const arc = (s, e, ac, rad, w, col) => { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.arc(cxs, cys, rad, s, e, ac); ctx.stroke(); };
    let s0, s1, acc = false;
    if (p.atkDir === 'f') { if (p.atkFace > 0) { s0 = -1.15; s1 = -1.15 + 2.1 * q; } else { s0 = Math.PI + 1.15; s1 = s0 - 2.1 * q; acc = true; } }
    else if (p.atkDir === 'u') { s0 = -2.5; s1 = -2.5 + 1.9 * q; }
    else { s0 = 0.65; s1 = 0.65 + 1.9 * q; }
    const rad = p.atkDir === 'f' ? r - 10 : 66;
    ctx.globalAlpha = a * 0.35; arc(s0, s1, acc, rad, 22, '#9ab8ff');
    ctx.globalAlpha = a; arc(s0, s1, acc, rad, 8, '#ffffff');
    ctx.restore();
  }
}

/* ---------- enemies ---------- */
function drawEnemy(e) {
  ctx.save(); ctx.translate(e.x, e.y);
  const fl = e.flash > 0, body = fl ? '#ffffff' : '#090b12', rim = fl ? '#ffffff' : '#46557a';
  const dir = e.t === 'f' ? (e.vx < -5 ? -1 : 1) : (e.dir || 1);
  ctx.scale(dir, 1); ctx.lineWidth = 1.6; ctx.fillStyle = body; ctx.strokeStyle = rim;
  const eye = (x, y, c, r) => { glow(x, y, 16, c, 0.5); ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r || 2.4, 0, 7); ctx.fill(); ctx.fillStyle = body; };
  if (e.t === 'c') {
    const w = Math.sin(e.anim * 9) * 3;
    ctx.beginPath(); ctx.ellipse(0, -10, 15, 10, 0, Math.PI, 0); ctx.lineTo(15, -2); ctx.lineTo(-15, -2); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = body; ctx.lineWidth = 3; ctx.beginPath(); for (let i = -1; i <= 1; i++) { ctx.moveTo(i * 8, -3); ctx.lineTo(i * 8 + (i % 2 ? w : -w), 2); } ctx.stroke();
    eye(8, -8, '#ffb25a', 2.6);
  } else if (e.t === 'f') {
    const bob = Math.sin(e.anim * 6) * 2;
    glow(0, -11 + bob, 34, '#7fe8ff', e.st === 'wind' ? 0.6 : 0.25);
    ctx.beginPath(); ctx.ellipse(0, -11 + bob, 11, 10, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-10, -8 + bob); ctx.quadraticCurveTo(-26, -2 + bob, -22, 6 + bob); ctx.quadraticCurveTo(-14, 0 + bob, -8, -2 + bob); ctx.fill();
    eye(4, -12 + bob, '#7fe8ff', 3);
  } else if (e.t === 'h') {
    const wind = e.st === 'wind' ? Math.sin(e.anim * 40) * 1.5 : 0;
    ctx.beginPath(); ctx.moveTo(-14, -2); ctx.lineTo(-17 + wind, -34); ctx.quadraticCurveTo(0, -52, 17, -34); ctx.lineTo(14, -2); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-8, -40); ctx.lineTo(-14, -52); ctx.lineTo(-2, -44); ctx.moveTo(8, -40); ctx.lineTo(14, -52); ctx.lineTo(2, -44); ctx.fill();
    ctx.fillRect(10, -30, 10, 24); ctx.strokeRect(10, -30, 10, 24);
    eye(6, -38, e.st === 'wind' || e.st === 'charge' ? '#ff5a3a' : '#ff9a6a', 3);
    if (e.st === 'wind') glow(0, -26, 50, '#ff5a3a', 0.4);
  } else if (e.t === 's') {
    const pu = e.stT < 0.4 ? 1 + (0.4 - e.stT) * 0.5 : 1 + Math.sin(e.anim * 3) * 0.04;
    ctx.beginPath(); ctx.moveTo(-5, 0); ctx.quadraticCurveTo(-8, -18, -3, -22); ctx.lineTo(3, -22); ctx.quadraticCurveTo(8, -18, 5, 0); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(4, -28, 12 * pu, 10 * pu, 0, 0, 7); ctx.fill(); ctx.stroke();
    eye(8, -29, '#9fe08a', 3.2);
  } else {
    const cr = e.ground ? 0.8 + (e.stT < 0.3 ? 0.15 : 0) : 1.15;
    ctx.scale(1, cr);
    ctx.beginPath(); ctx.moveTo(-12, -2); ctx.quadraticCurveTo(-14, -26, 0, -30); ctx.quadraticCurveTo(14, -26, 12, -2); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-6, -28); ctx.lineTo(-12, -38); ctx.lineTo(-2, -30); ctx.moveTo(6, -28); ctx.lineTo(12, -38); ctx.lineTo(2, -30); ctx.fill();
    eye(5, -22, '#ffd25a', 2.8);
  }
  ctx.restore();
}

/* ---------- projectiles ---------- */
function drawProj(q) {
  if (q.kind === 'wave') {
    ctx.save(); ctx.translate(q.x, q.y); ctx.scale(Math.sign(q.vx) || 1, 1);
    ctx.fillStyle = q.col; ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.moveTo(-26, 0); ctx.quadraticCurveTo(-4, -q.h * 0.7, 14, -q.h); ctx.quadraticCurveTo(8, -q.h * 0.4, 18, 0); ctx.closePath(); ctx.fill();
    ctx.restore(); glow(q.x, q.y - q.h * 0.4, 40, q.col, 0.3); return;
  }
  glow(q.x, q.y, q.r * 3.2, q.col, 0.6);
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(q.x, q.y, q.r * 0.62, 0, 7); ctx.fill();
  ctx.strokeStyle = q.col; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, 7); ctx.stroke();
}
