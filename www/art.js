'use strict';
/* ===== ASHEN HOLLOW - art: palettes, backgrounds, tiles, characters ===== */
let TM = 0;
/* Generated artwork atlas: painted biomes, stone material and animated knight frames. */
const GAME_ART = { worlds: null, knight: null, tilePattern: null };
try {
  if (typeof Image !== 'undefined') {
    GAME_ART.worlds = new Image(); GAME_ART.worlds.src = 'assets/worlds.webp';
    GAME_ART.knight = new Image(); GAME_ART.knight.src = 'assets/knight.png';
  }
} catch (e) {}
function drawKnightFrame(row, col, x, y, w, h, face, alpha) {
  const im = GAME_ART.knight;
  if (!im || !im.complete || !im.naturalWidth) return false;
  ctx.save(); ctx.globalAlpha *= alpha === undefined ? 1 : alpha;
  ctx.translate(x, y); ctx.scale(face === -1 ? -1 : 1, 1);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(im, col * 56, row * 56, 56, 56, -w / 2, -h, w, h);
  ctx.restore(); return true;
}
function tilePattern() {
  if (GAME_ART.tilePattern) return GAME_ART.tilePattern;
  const im = GAME_ART.worlds;
  if (!im || !im.complete || !im.naturalWidth || !document.createElement) return null;
  const tile = document.createElement('canvas'); tile.width = 320; tile.height = 90;
  const c = tile.getContext('2d'); if (!c) return null;
  c.drawImage(im, 0, 270, 480, 135, 0, 0, 320, 90);
  GAME_ART.tilePattern = ctx.createPattern(tile, 'repeat'); return GAME_ART.tilePattern;
}
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
  const z = ZONES[rm.zone], im = GAME_ART.worlds;
  if (im && im.complete && im.naturalWidth) {
    const sx = (rm.zone % 2) * 240, sy = Math.floor(rm.zone / 2) * 135;
    ctx.drawImage(im, sx, sy, 240, 135, -cx * 0.105, -cy * 0.07, W + 120, H + 68);
    const shade = ctx.createLinearGradient(0, 0, 0, H);
    shade.addColorStop(0, 'rgba(3,5,12,0.06)'); shade.addColorStop(0.55, 'rgba(3,5,12,0.05)');
    shade.addColorStop(1, 'rgba(2,4,10,0.58)');
    ctx.fillStyle = shade; ctx.fillRect(0, 0, W, H);
    glow(W * 0.68 - cx * 0.035, 145 - cy * 0.025, 250, z.glow, 0.13);
    for (let i = 0; i < 3; i++) {
      const y = 270 + i * 92 + Math.sin(TM * 0.18 + i) * 12;
      const fog = ctx.createLinearGradient(0, y - 65, 0, y + 65);
      fog.addColorStop(0, 'rgba(' + z.fog + ',0)');
      fog.addColorStop(0.5, 'rgba(' + z.fog + ',' + (0.075 + i * 0.018) + ')');
      fog.addColorStop(1, 'rgba(' + z.fog + ',0)');
      ctx.fillStyle = fog; ctx.fillRect(0, y - 65, W, 130);
    }
    return;
  }
  const gr = ctx.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, z.bg0); gr.addColorStop(1, z.bg1); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
  if (!rm._bg) rm._bg = genBG(rm);
  glow(W * 0.7 - cx * 0.05, 120, 260, z.glow, 0.10);
  const layers = [{ arr: rm._bg[0], f: 0.18, col: z.far, base: H - 60 }, { arr: rm._bg[1], f: 0.4, col: z.mid, base: H - 10 }];
  layers.forEach(L => {
    ctx.fillStyle = L.col; const ox = cx * L.f, oy = cy * L.f * 0.3;
    for (const b of L.arr) {
      const x = b.x - ox; if (x > W + 40 || x + b.w < -40) continue;
      const by = L.base + oy; ctx.fillRect(x, by - b.h, b.w * 0.55, b.h);
    }
  });
}

/* ---------- tiles ---------- */
function drawTiles(rm, Wd, cx, cy) {
  const z = ZONES[rm.zone], x0 = Math.max(0, Math.floor(cx / T) - 1), x1 = Math.min(rm.w - 1, Math.floor((cx + W) / T) + 1);
  const y0 = Math.max(0, Math.floor(cy / T) - 1), y1 = Math.min(rm.h - 1, Math.floor((cy + H) / T) + 1);
  const sol = (x, y) => { const c = Wd.t(x, y); return c === '#' || c === 'W' || c === 'L'; };
  const pattern = tilePattern();
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    const c = Wd.t(tx, ty), px = tx * T, py = ty * T;
    if (c === '#' || c === 'W') {
      if (pattern) {
        ctx.fillStyle = pattern; ctx.fillRect(px, py, T + 0.5, T + 0.5);
        ctx.fillStyle = 'rgba(2,5,12,0.64)'; ctx.fillRect(px, py, T + 0.5, T + 0.5);
      } else { ctx.fillStyle = z.tile; ctx.fillRect(px, py, T + 0.5, T + 0.5); }
      const h = hash2(tx, ty);
      if (!sol(tx, ty - 1)) {
        ctx.fillStyle = z.edge; ctx.globalAlpha = 0.86; ctx.fillRect(px, py, T, 2.5);
        ctx.fillStyle = z.moss; ctx.fillRect(px, py + 3, T, 2 + h * 3); ctx.globalAlpha = 1;
      }
      if (!sol(tx - 1, ty)) { ctx.fillStyle = z.edge; ctx.globalAlpha = 0.30; ctx.fillRect(px, py, 1.5, T); ctx.globalAlpha = 1; }
      if (!sol(tx + 1, ty)) { ctx.fillStyle = z.edge; ctx.globalAlpha = 0.24; ctx.fillRect(px + T - 1.5, py, 1.5, T); ctx.globalAlpha = 1; }
      if (c === 'W') {
        ctx.strokeStyle = 'rgba(' + z.fog + ',0.78)'; ctx.lineWidth = 1.8; ctx.beginPath();
        ctx.moveTo(px + 5, py + 2); ctx.lineTo(px + 15, py + 13); ctx.lineTo(px + 10, py + 24); ctx.lineTo(px + 23, py + 31);
        ctx.moveTo(px + 15, py + 13); ctx.lineTo(px + 27, py + 9); ctx.stroke();
      }
    } else if (c === 'L') {
      const a = 0.45 + 0.25 * Math.sin(TM * 6 + ty);
      ctx.fillStyle = z.tile; ctx.fillRect(px, py, T, T);
      ctx.fillStyle = z.glow; ctx.globalAlpha = a;
      ctx.fillRect(px + 4, py, 3, T); ctx.fillRect(px + 14, py, 3, T); ctx.fillRect(px + 24, py, 3, T);
      ctx.globalAlpha = 1;
    } else if (c === '=') {
      if (pattern) {
        ctx.fillStyle = pattern; ctx.fillRect(px, py, T, 8);
        ctx.fillStyle = 'rgba(3,6,13,0.28)'; ctx.fillRect(px, py, T, 8);
      } else { ctx.fillStyle = z.tile; ctx.fillRect(px, py, T, 8); }
      ctx.fillStyle = z.edge; ctx.fillRect(px, py, T, 2.5);
      ctx.fillStyle = z.moss; ctx.fillRect(px, py + 3, T, 2);
    } else if (c === '^') {
      ctx.fillStyle = '#c4cbe0'; ctx.strokeStyle = '#05070c'; ctx.lineWidth = 1.4;
      for (let i = 0; i < 3; i++) {
        const sx = px + i * 10.6; ctx.beginPath();
        ctx.moveTo(sx, py + T); ctx.lineTo(sx + 5.3, py + 12); ctx.lineTo(sx + 10.6, py + T);
        ctx.closePath(); ctx.fill(); ctx.stroke();
      }
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
    else if (it.t === 'C') { ctx.rotate(TM * 0.35); ctx.strokeStyle = '#d8d4ff'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(0,-17); ctx.lineTo(0,17); ctx.moveTo(-12,-9); ctx.lineTo(12,9); ctx.moveTo(12,-9); ctx.lineTo(-12,9); ctx.stroke(); ctx.beginPath(); ctx.arc(0,0,13,0,7); ctx.stroke(); }
    else if (it.t === 'J') { ctx.beginPath(); ctx.moveTo(0, 12); ctx.quadraticCurveTo(-24, 0, -16, -14); ctx.quadraticCurveTo(-8, -4, 0, -2); ctx.quadraticCurveTo(8, -4, 16, -14); ctx.quadraticCurveTo(24, 0, 0, 12); ctx.fill(); }
    else { ctx.rotate(-0.8); ctx.fillRect(-2, -18, 4, 30); ctx.fillRect(-9, 8, 18, 3); ctx.fillRect(-2, 11, 4, 8); }
    ctx.restore();
  }
}

/* ---------- player ---------- */
function drawPlayer(p) {
  if (p.dead) return;
  const blink = p.inv > 0 && ((TM * 18) | 0) % 2 === 0;
  const moving = p.ground && Math.abs(p.vx) > 38;
  let row = 0, col = Math.floor(TM * 1.5) % 4;
  if (p.dashT > 0) { row = 3; col = 3; }
  else if (p.atkT > 0 && p.atkAge < 0.24) {
    row = 3; col = p.atkDir === 'u' ? 0 : p.atkDir === 'd' ? 2 : 1;
  } else if (!p.ground) { row = 2; col = p.vy < -90 ? 1 : 0; }
  else if (moving) { row = 1; col = Math.floor(p.anim * 1.4) % 4; }
  const alpha = blink ? 0.42 : 1;
  if (p.dashT > 0) {
    for (let i = 3; i >= 1; i--) {
      drawKnightFrame(3, 3, p.x - p.dashDir * i * 19, p.y + 1, 82, 82, p.dashDir, 0.10 + (4 - i) * 0.055);
    }
  }
  if (p.healT > 0) glow(p.x, p.y - 34, 66 + p.healT * 26, '#fff6c8', 0.52);
  if (p.inv > 0 && !blink) glow(p.x, p.y - 38, 48, '#b9d5ff', 0.20);
  if (!drawKnightFrame(row, col, p.x, p.y + 1, 84, 84, p.face, alpha)) {
    // Safe fallback for offline browsers if the art assets are unavailable.
    ctx.save(); ctx.translate(p.x, p.y); ctx.scale(p.face, 1);
    ctx.fillStyle = '#080a10'; ctx.strokeStyle = '#aab8d8'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-9, -7); ctx.lineTo(-11, -32); ctx.quadraticCurveTo(0, -43, 11, -32);
    ctx.lineTo(9, -7); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#eef2fb'; ctx.beginPath(); ctx.ellipse(0, -39, 9, 10, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-5, -47); ctx.lineTo(-9, -62); ctx.lineTo(-1, -49);
    ctx.moveTo(5, -47); ctx.lineTo(9, -62); ctx.lineTo(1, -49); ctx.fill();
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
