'use strict';
/* ===== ASHEN HOLLOW - art: palettes, backgrounds, tiles, characters ===== */
let TM = 0;
/* Generated artwork atlas: painted biomes, stone material and animated knight frames. */
const GAME_ART = { worlds: null, knight: null, tilePattern: null };
const NPC_ART = {};
const ENEMY_ART = {};
const BOSS_ART = {};
try {
  if (typeof Image !== 'undefined') {
    GAME_ART.worlds = new Image(); GAME_ART.worlds.src = 'assets/worlds.webp';
    GAME_ART.knight = new Image(); GAME_ART.knight.src = 'assets/knight.png';
    for (const id of ['mara','oren','pilgrim']) { NPC_ART[id] = new Image(); NPC_ART[id].src = 'assets/npc-' + id + '.svg'; }
    for (const id of ['c','f','h','s','l']) { ENEMY_ART[id] = new Image(); ENEMY_ART[id].src = 'assets/enemy-' + id + '.svg'; }
    for (const id of ['warden','weaver','duelist','sovereign']) { BOSS_ART[id] = new Image(); BOSS_ART[id].src = 'assets/boss-' + id + '.svg'; }
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
const MOSS_KNIGHT = {};
const MOSS_ANIMATION_NAMES = ['idle','walk','attack','roll','jump','hurt','death'];
async function loadMossKnightAnimations() {
  const loaded = await Promise.all(MOSS_ANIMATION_NAMES.map(async name => {
    const base = 'assets/moss-knight/moss-knight-' + name;
    try {
      const response = await fetch(base + '.json', { cache: 'force-cache' });
      if (!response.ok) throw new Error('Atlas HTTP ' + response.status);
      const atlas = await response.json();
      const image = new Image();
      image.src = base + '.png';
      await new Promise(resolve => {
        if (image.complete) return resolve();
        image.onload = resolve; image.onerror = resolve;
      });
      if (!image.naturalWidth || !atlas.frames) return null;
      const frames = Object.entries(atlas.frames).map(([key, value]) => ({
        key, frame: value.frame || value, pivot: value.pivot || null,
        source: value.sourceSize || atlas.meta.cell || { w: 256, h: 256 },
        trim: value.spriteSourceSize || { x: 0, y: 0, w: 256, h: 256 },
        duration: value.duration || 1000 / (atlas.meta.fps || 8)
      })).sort((a,b) => a.key.localeCompare(b.key, undefined, { numeric: true }));
      return [name, { image, frames, meta: atlas.meta || {}, duration: frames.reduce((n,f) => n + f.duration, 0), loop: atlas.meta && atlas.meta.loop !== false }];
    } catch (err) {
      return null;
    }
  }));
  for (const item of loaded) if (item) MOSS_KNIGHT[item[0]] = item[1];
}
if (typeof fetch === 'function' && typeof Image !== 'undefined') loadMossKnightAnimations();

const MONSTER_ART = {};
const MONSTER_CREATURES = ['slime','mushroom','goblin','golem'];
const MONSTER_ANIMATION_NAMES = ['idle','walk','attack','hurt','death'];
const MONSTER_FOR_ENEMY = { c:'slime', s:'mushroom', h:'goblin', l:'golem' };

async function loadAtlasAnimations(root, prefix, names) {
  const loaded = await Promise.all(names.map(async name => {
    const base = root + '/' + prefix + '-' + name;
    try {
      const response = await fetch(base + '.json', { cache:'force-cache' });
      if (!response.ok) return null;
      const atlas = await response.json();
      const image = new Image(); image.src = base + '.png';
      await new Promise(resolve => { if(image.complete)return resolve();image.onload=resolve;image.onerror=resolve; });
      if (!image.naturalWidth || !atlas.frames || !atlas.meta) return null;
      const frames=Object.entries(atlas.frames).map(([key,value])=>({
        key,frame:value.frame||value,pivot:value.pivot||null,
        source:value.sourceSize||atlas.meta.cell||{w:256,h:256},
        trim:value.spriteSourceSize||{x:0,y:0,w:256,h:256},
        duration:value.duration||1000/(atlas.meta.fps||8)
      })).sort((a,b)=>a.key.localeCompare(b.key,undefined,{numeric:true}));
      return [name,{image,frames,meta:atlas.meta,duration:frames.reduce((n,f)=>n+f.duration,0),loop:atlas.meta.loop!==false}];
    } catch(err) { return null; }
  }));
  return Object.fromEntries(loaded.filter(Boolean));
}
async function loadMossKnightAnimations(){Object.assign(MOSS_KNIGHT,await loadAtlasAnimations('assets/moss-knight','moss-knight',MOSS_ANIMATION_NAMES));}
async function loadMonsterAnimations(){
  await Promise.all(MONSTER_CREATURES.map(async creature=>{MONSTER_ART[creature]=await loadAtlasAnimations('assets/monsters/'+creature,creature,MONSTER_ANIMATION_NAMES);}));
}
if(typeof fetch==='function'&&typeof Image!=='undefined'){loadMossKnightAnimations();loadMonsterAnimations();}

function drawAtlasFrame(animation,elapsed,x,y,w,h,face,alpha,loop){
  if(!animation||!animation.image||!animation.image.naturalWidth||!animation.frames.length)return false;
  let time=Math.max(0,elapsed||0)*1000;
  if(loop===undefined?animation.loop:loop)time%=animation.duration;
  else time=Math.min(time,Math.max(0,animation.duration-1));
  let frame=animation.frames[animation.frames.length-1];
  for(const candidate of animation.frames){if(time<candidate.duration){frame=candidate;break;}time-=candidate.duration;}
  const f=frame.frame,src=frame.source,trim=frame.trim;
  const pivot=frame.pivot||{x:(animation.meta.pivot_px&&animation.meta.pivot_px[0]/src.w)||.5,y:(animation.meta.pivot_px&&animation.meta.pivot_px[1]/src.h)||.875};
  const sx=w/src.w,sy=h/src.h;
  ctx.save();ctx.globalAlpha*=alpha===undefined?1:alpha;ctx.translate(x,y);ctx.scale(face===-1?-1:1,1);ctx.imageSmoothingEnabled=true;
  ctx.drawImage(animation.image,f.x,f.y,f.w,f.h,-pivot.x*w+trim.x*sx,-pivot.y*h+trim.y*sy,trim.w*sx,trim.h*sy);ctx.restore();return true;
}
function drawMossKnightFrame(name,elapsed,x,y,w,h,face,alpha,loop){return drawAtlasFrame(MOSS_KNIGHT[name],elapsed,x,y,w,h,face,alpha,loop);}
function drawMonsterFrame(creature,name,elapsed,x,y,w,h,face,alpha,loop){const set=MONSTER_ART[creature];return drawAtlasFrame(set&&set[name],elapsed,x,y,w,h,face,alpha,loop);}
function monsterAnimationDuration(creature,name){const set=MONSTER_ART[creature],anim=set&&set[name];return anim?anim.duration/1000:.5;}
function mossAnimationDuration(name) { return MOSS_KNIGHT[name] ? MOSS_KNIGHT[name].duration / 1000 : 0.5; }

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
function drawDepthLayers(rm, cx, cy, z) {
  const zone = rm.zone, seed = rm.seed >>> 0;
  const farX = cx * 0.12, midX = cx * 0.28, nearX = cx * 0.48;
  ctx.save();
  /* Far silhouettes: monumental shapes that drift slower than the room. */
  ctx.fillStyle = zone === 1 ? '#07171b' : zone === 2 ? '#1c0b09' : zone === 3 ? '#100d22' : '#0b1220';
  for (let i = -2; i < 9; i++) {
    const h = 170 + hash2(i + seed % 31, zone + 4) * 190;
    const x = i * 210 - farX + hash2(i + 8, seed % 17) * 90;
    const y = H - 22 + cy * 0.045;
    ctx.globalAlpha = 0.72;
    if (zone === 1) {
      ctx.beginPath(); ctx.moveTo(x - 55, y); ctx.lineTo(x - 22, y - h * 0.72); ctx.quadraticCurveTo(x, y - h * 1.12, x + 20, y - h * 0.7); ctx.lineTo(x + 62, y); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(83,151,145,.14)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x, y - h * .7); ctx.lineTo(x + 4, y - h * .25); ctx.stroke();
    } else if (zone === 2) {
      ctx.beginPath(); ctx.moveTo(x - 65, y); ctx.lineTo(x - 35, y - h * .68); ctx.lineTo(x - 9, y - h); ctx.lineTo(x + 5, y - h * .62); ctx.lineTo(x + 35, y - h * .82); ctx.lineTo(x + 66, y); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,143,83,.12)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 8, y - h * .65); ctx.lineTo(x + 3, y - h * .22); ctx.stroke();
    } else if (zone === 3) {
      ctx.beginPath(); ctx.moveTo(x - 78, y); ctx.lineTo(x - 72, y - h * .76); ctx.quadraticCurveTo(x, y - h * 1.12, x + 72, y - h * .76); ctx.lineTo(x + 78, y); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#05050d'; ctx.beginPath(); ctx.arc(x, y - h * .76, 45 + h * .08, Math.PI, 0); ctx.lineTo(x + 40, y); ctx.lineTo(x - 40, y); ctx.closePath(); ctx.fill();
    } else {
      ctx.beginPath(); ctx.moveTo(x - 62, y); ctx.lineTo(x - 45, y - h * .82); ctx.lineTo(x - 16, y - h); ctx.lineTo(x + 18, y - h * .82); ctx.lineTo(x + 58, y); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(143,170,214,.12)'; ctx.fillRect(x - 2, y - h * .68, 4, h * .48);
    }
  }
  /* Middle layer: broken pillars, hanging roots, and suspended stonework. */
  for (let i = -1; i < 12; i++) {
    const x = i * 154 - midX + hash2(i + 31, seed % 23) * 80;
    const top = 90 + hash2(i + 12, zone + 21) * 150;
    const base = H + cy * .12;
    ctx.globalAlpha = .32;
    ctx.fillStyle = zone === 1 ? '#16343a' : zone === 2 ? '#54251b' : zone === 3 ? '#30274d' : '#263653';
    if (zone === 1) {
      ctx.beginPath(); ctx.moveTo(x - 22, 0); ctx.quadraticCurveTo(x - 5, top * .55, x + 2, top); ctx.quadraticCurveTo(x + 14, top * .7, x + 28, 0); ctx.fill();
      ctx.strokeStyle = 'rgba(92,177,158,.26)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 2, top * .4); ctx.quadraticCurveTo(x - 16, top * .7, x - 8, top); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.moveTo(x - 28, base); ctx.lineTo(x - 20, base - top); ctx.lineTo(x - 7, base - top - 18); ctx.lineTo(x + 8, base - top + 6); ctx.lineTo(x + 24, base); ctx.closePath(); ctx.fill();
      if (zone === 3) { ctx.strokeStyle = 'rgba(190,169,255,.2)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, base - top); ctx.lineTo(x, base - 12); ctx.stroke(); }
    }
  }
  /* Near foreground framing, kept translucent so the player and platforms stay readable. */
  ctx.globalAlpha = .18; ctx.strokeStyle = zone === 1 ? '#6eb4a6' : zone === 2 ? '#e17850' : zone === 3 ? '#8e7bd0' : '#8398bf'; ctx.lineWidth = 3;
  for (let i = -1; i < 8; i++) {
    const x = i * 240 - nearX + hash2(i + 91, seed % 41) * 70;
    const h = 45 + hash2(i + 71, zone + 6) * 90;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.bezierCurveTo(x - 20, h, x + 26, h * 1.4, x + 6, h * 2); ctx.stroke();
  }
  ctx.globalAlpha = 1; ctx.restore();
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
    drawDepthLayers(rm, cx, cy, z);
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
  drawDepthLayers(rm, cx, cy, z);
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
    else if (it.t === 'A') { ctx.rotate(TM * 0.5); ctx.strokeStyle = '#bceeff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0,-18); ctx.lineTo(0,18); ctx.moveTo(-10,-10); ctx.lineTo(10,10); ctx.moveTo(10,-10); ctx.lineTo(-10,10); ctx.stroke(); ctx.beginPath(); ctx.arc(0,0,15,0,7); ctx.stroke(); glow(0,0,24,'#bceeff',0.45); }
    else if (it.t === 'C') { ctx.rotate(TM * 0.35); ctx.strokeStyle = '#d8d4ff'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(0,-17); ctx.lineTo(0,17); ctx.moveTo(-12,-9); ctx.lineTo(12,9); ctx.moveTo(12,-9); ctx.lineTo(-12,9); ctx.stroke(); ctx.beginPath(); ctx.arc(0,0,13,0,7); ctx.stroke(); }
    else if (it.t === 'J') { ctx.beginPath(); ctx.moveTo(0, 12); ctx.quadraticCurveTo(-24, 0, -16, -14); ctx.quadraticCurveTo(-8, -4, 0, -2); ctx.quadraticCurveTo(8, -4, 16, -14); ctx.quadraticCurveTo(24, 0, 0, 12); ctx.fill(); }
    else { ctx.rotate(-0.8); ctx.fillRect(-2, -18, 4, 30); ctx.fillRect(-9, 8, 18, 3); ctx.fillRect(-2, 11, 4, 8); }
    ctx.restore();
  }
}

/* ---------- player ---------- */
function drawNPCs(rm) {
  for (const n of (rm.npcs || [])) {
    const im = NPC_ART[n.id], x = n.x * T + 16, foot = (n.y + 1) * T, bob = Math.sin(TM * 1.55 + n.x) * 1.8;
    if (im && im.complete && im.naturalWidth) {
      const breathe = Math.sin(TM * 1.8 + n.x * 0.7) * 0.012;
      const sway = Math.sin(TM * 0.72 + n.x) * 0.018;
      ctx.save(); ctx.globalAlpha = 0.98; ctx.translate(x, foot + bob); ctx.rotate(sway);
      ctx.translate(0, -47); ctx.scale(1 - breathe * 0.4, 1 + breathe); ctx.translate(0, 47);
      ctx.imageSmoothingEnabled = true; ctx.drawImage(im, -38, -94, 76, 94); ctx.restore();
    }
    const def = NPC_DEF[n.id]; if (def) glow(x + 20, foot - 45 + bob, 34, def.glow, 0.34);
    if (G && G.p && Math.abs(G.p.x - x) < 54 && Math.abs(G.p.y - foot) < 62) { ctx.fillStyle='rgba(3,7,13,.82)'; roundRect(x-48,foot-112+bob,96,22,7); ctx.fill(); txt('UP  ·  SPEAK',x,foot-101+bob,11,'#f3e7c8','center'); }
  }
}
function drawPlayer(p) {
  const blink = p.inv > 0 && ((TM * 18) | 0) % 2 === 0;
  const moving = p.ground && Math.abs(p.vx) > 38;
  const alpha = blink ? 0.42 : 1;
  let animation = 'idle', elapsed = TM, loop = true;
  if (p.dead) { animation = 'death'; elapsed = Math.max(0, 2 - (G ? G.deadT : 2)); loop = false; }
  else if ((p.hurtAnimT || 0) >= 0.0 && (p.hurtAnimT || 0) < 1) { animation = 'hurt'; elapsed = p.hurtAnimT || 0; loop = false; }
  else if (p.dashT > 0) { animation = 'roll'; elapsed = ((0.18 - p.dashT) / 0.18) * mossAnimationDuration('roll'); loop = false; }
  else if (p.atkT > 0 && p.atkAge < p.atkDur) { animation = 'attack'; elapsed = (p.atkAge / Math.max(0.01, p.atkDur)) * mossAnimationDuration('attack'); loop = false; }
  else if (!p.ground) { animation = 'jump'; elapsed = p.airAnimT || 0; loop = false; }
  else if (moving) { animation = 'walk'; elapsed = TM; loop = true; }
  const drawX = p.x, drawY = p.y + 1, drawW = 104, drawH = 112;
  if (p.dashT > 0 && !p.dead) {
    for (let i = 3; i >= 1; i--) {
      drawMossKnightFrame('roll', Math.max(0, elapsed - i * 0.035), p.x - p.dashDir * i * 19, drawY, drawW, drawH, p.dashDir, 0.09 + (4-i) * 0.05, false);
    }
  }
  if (p.healT > 0) glow(p.x, p.y - 34, 66 + p.healT * 26, '#fff6c8', 0.52);
  if (p.inv > 0 && !blink) glow(p.x, p.y - 38, 48, '#b9d5ff', 0.20);
  if (drawMossKnightFrame(animation, elapsed, drawX, drawY, drawW, drawH, p.face, alpha, loop)) return;
  if (p.dead) return;
  let row = 0, col = Math.floor(TM * 1.5) % 4;
  if (p.dashT > 0) { row = 3; col = 3; }
  else if (p.atkT > 0 && p.atkAge < 0.24) { row = 3; col = p.atkDir === 'u' ? 0 : p.atkDir === 'd' ? 2 : 1; }
  else if (!p.ground) { row = 2; col = p.vy < -90 ? 1 : 0; }
  else if (moving) { row = 1; col = Math.floor(p.anim * 1.4) % 4; }
  if (!drawKnightFrame(row, col, p.x, p.y + 1, 84, 84, p.face, alpha)) {
    ctx.save(); ctx.translate(p.x, p.y); ctx.scale(p.face, 1);
    ctx.fillStyle = '#080a10'; ctx.strokeStyle = '#aab8d8'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-9, -7); ctx.lineTo(-11, -32); ctx.quadraticCurveTo(0, -43, 11, -32);
    ctx.lineTo(9, -7); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#eef2fb'; ctx.beginPath(); ctx.ellipse(0, -39, 9, 10, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-5, -47); ctx.lineTo(-9, -62); ctx.lineTo(-1, -49);
    ctx.moveTo(5, -47); ctx.lineTo(9, -62); ctx.lineTo(1, -49); ctx.fill(); ctx.restore();
  }
}

/* ---------- enemies ---------- */
function drawEnemy(e) {
  if(e.dead)return;
  const fl=e.flash>0,flying=e.t==='f',dir=flying?(e.vx < -5?-1:1):(e.dir||1);
  const creature=MONSTER_FOR_ENEMY[e.t],set=creature&&MONSTER_ART[creature];
  if(set){
    let action='idle',elapsed=e.anim,loop=true;
    if(e.dying){action='death';elapsed=e.deathAnimT||0;loop=false;}
    else if(e.hurtAnimT>=0){action='hurt';elapsed=e.hurtAnimT;loop=false;}
    else if(e.attackAnimT>=0||(e.t==='h'&&e.st==='charge')||(e.t==='l'&&!e.ground)){action='attack';elapsed=e.attackAnimT>=0?e.attackAnimT:e.anim;loop=false;}
    else if(Math.abs(e.vx)>28){action='walk';elapsed=e.anim;loop=true;}
    const animation=set[action]||set.idle,cell=(animation&&animation.meta&&animation.meta.cell)||{w:256,h:256};
    const h=Math.max(58,e.h*1.75),w=h*(cell.w/cell.h),face=dir>0?-1:1;
    const bob=e.t==='c'?Math.sin(e.anim*5):Math.sin(e.anim*4)*.8;
    ctx.save();ctx.translate(e.x,e.y+bob);
    const aura={c:'#a9e5a2',s:'#a1d9a0',h:'#ff9b79',l:'#e8c78d'}[e.t]||'#a9e5a2';
    if(e.t==='h'&&e.st==='wind')glow(0,-h*.56,58,'#ff6b48',.3);else glow(0,-h*.58,e.t==='l'?48:32,aura,e.dying?.10:.17);
    if(action==='attack'&&!e.dying){ctx.save();ctx.globalAlpha=.2;ctx.strokeStyle=e.t==='h'?'#ff9b79':'#e7edc7';ctx.lineWidth=3;ctx.beginPath();ctx.arc(face*16,-h*.48,h*.48,-1.5,.9,face<0);ctx.stroke();ctx.restore();}
    if(fl&&!e.dying){ctx.save();ctx.globalCompositeOperation='source-atop';ctx.fillStyle='rgba(255,255,255,.24)';ctx.fillRect(-w/2,-h,w,h);ctx.restore();}
    if(drawMonsterFrame(creature,action,elapsed,0,0,w,h,face,1,loop)){ctx.restore();return;}
    ctx.restore();
  }
  ctx.save();ctx.translate(e.x,e.y);
  const dirFallback=flying?(e.vx < -5?-1:1):(e.dir||1),im=ENEMY_ART[e.t];
  if(im&&im.complete&&im.naturalWidth){
    ctx.scale(dirFallback,1);
    const bob=flying?Math.sin(e.anim*6)*3:Math.sin(e.anim*5)*1.3,w=Math.max(48,e.w*1.95),h=Math.max(54,e.h*1.9);
    let sx=1,sy=1,tilt=0;
    if(e.t==='c'){const pulse=Math.sin(e.anim*9);sx=1+pulse*.055;sy=1-pulse*.045;}
    else if(flying){tilt=e.st==='swoop'?clamp(e.vy/1500,-.34,.34):Math.sin(e.anim*2)*.035;sx=e.st==='wind'?.9:1.04;}
    else if(e.t==='h'){if(e.st==='wind'){sx=1.04;sy=.84+Math.sin(e.anim*24)*.035;}else if(e.st==='charge'){sx=1.13;sy=.92;tilt=-e.dir*.07;}else if(e.st==='rest')sy=.94;}
    else if(e.t==='s'){const recoil=e.stT>2.05?1:0;sx=1+recoil*.07;sy=1-recoil*.06;}
    else if(e.t==='l'&&!e.ground){sx=1.08;sy=.9;tilt=e.dir*.06;}
    ctx.translate(0,bob);ctx.translate(0,-h);ctx.rotate(tilt);ctx.scale(sx,sy);ctx.translate(0,h);
    const aura={c:'#ffb25a',f:'#7fe8ff',h:'#ff654c',s:'#9fe08a',l:'#ffd25a'}[e.t];
    glow(0,-h*.58,flying?38:27,aura,e.st==='wind'||e.st==='charge'?.38:.18);
    ctx.imageSmoothingEnabled=true;ctx.drawImage(im,-w/2,-h,w,h);
    if(fl){ctx.globalCompositeOperation='source-atop';ctx.fillStyle='rgba(255,255,255,.65)';ctx.fillRect(-w/2,-h,w,h);ctx.globalCompositeOperation='source-over';}
    ctx.restore();return;
  }
  const body = fl ? '#ffffff' : '#090b12', rim = fl ? '#ffffff' : '#46557a';
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
