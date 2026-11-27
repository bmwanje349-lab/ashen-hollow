'use strict';
/* ===== ASHEN HOLLOW - bosses art, world render, HUD, screens, main loop ===== */
function bossPose(b) {
  if (b.st === 'tele') return { k: 'tele', q: 1 - Math.max(0, b.stT) / Math.max(0.05, b.mv ? b.mv.tele : 0.5) };
  if (b.st === 'act') return { k: 'act', q: Math.min(1, b.t / Math.max(0.05, b.mv ? b.mv.dur : 0.5)) };
  return { k: 'idle', q: 0 };
}
function drawBoss(b) {
  if (b.dead) return;
  const pz = bossPose(b), fl = b.flash > 0, body = fl ? '#ffffff' : '#07090f', rim = fl ? '#ffffff' : BOSS_DEF[b.id].col;
  ctx.save(); ctx.translate(b.x, b.y); ctx.globalAlpha = Math.max(0.05, b.vis);
  if (b.st === 'tele') { glow(0, -b.h / 2, b.h * 1.1, '#ffffff', 0.25 + 0.2 * Math.sin(TM * 40)); }
  ctx.scale(b.face, 1); ctx.fillStyle = body; ctx.strokeStyle = rim; ctx.lineWidth = 2.4; ctx.lineJoin = 'round';
  const eye = (x, y, c, r) => { glow(x, y, r * 6, c, 0.6); ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.fillStyle = body; };
  const air = !b.ground, raise = pz.k === 'tele' ? pz.q : 0, swing = pz.k === 'act' ? pz.q : 0;
  if (b.id === 'warden') {
    const lean = pz.k === 'act' && b.mvName === 'lunge' ? 8 : 0;
    ctx.beginPath(); ctx.moveTo(-26, 0); ctx.lineTo(-30 + lean, -50); ctx.lineTo(-18, -70); ctx.lineTo(18, -70); ctx.lineTo(30 + lean, -50); ctx.lineTo(24, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-12, -68); ctx.lineTo(-14, -90); ctx.lineTo(0, -98); ctx.lineTo(14, -90); ctx.lineTo(12, -68); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillRect(-20, -72, 40, 6); ctx.beginPath(); ctx.moveTo(-14, -90); ctx.lineTo(-22, -108); ctx.lineTo(-6, -94); ctx.moveTo(14, -90); ctx.lineTo(22, -108); ctx.lineTo(6, -94); ctx.fill();
    eye(6, -82, b.warn ? '#ff7a5a' : '#ffd8a0', 3);
    let ang = -0.5; if (pz.k === 'tele') ang = -0.5 - 1.7 * raise; else if (pz.k === 'act') ang = b.mvName === 'sweep' ? -2.2 + swing * 3.2 : b.mvName === 'slam' ? -2.2 + swing * 2.6 : 0.1;
    ctx.save(); ctx.translate(22, -52); ctx.rotate(ang); ctx.fillStyle = '#d8e0f4'; ctx.fillRect(0, -3, 74, 6); ctx.beginPath(); ctx.moveTo(74, -5); ctx.lineTo(96, 0); ctx.lineTo(74, 5); ctx.fill(); ctx.fillStyle = body; ctx.fillRect(-4, -9, 6, 18); ctx.restore();
  } else if (b.id === 'weaver') {
    const t = TM * 10, tuck = air ? 0.5 : 1;
    ctx.strokeStyle = fl ? '#fff' : '#2d2a44'; ctx.lineWidth = 5;
    for (let i = 0; i < 4; i++) for (const s of [-1, 1]) {
      const bx = s * (8 + i * 6), sw = Math.sin(t + i * 1.3) * (b.st === 'act' ? 6 : 2);
      ctx.beginPath(); ctx.moveTo(bx * 0.6, -18); ctx.lineTo(bx + s * 18 * tuck, -34 + sw - i * 3); ctx.lineTo(bx + s * 30 * tuck, 0); ctx.stroke();
    }
    ctx.fillStyle = body; ctx.strokeStyle = rim; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.ellipse(-12, -22, 24, 18, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(18, -24, 15, 13, 0, 0, 7); ctx.fill(); ctx.stroke();
    eye(22, -28, '#ff7ad0', 2.6); eye(26, -24, '#ff7ad0', 2); eye(18, -30, '#ff7ad0', 1.8);
    if (b.mvName === 'rain' && b.st !== 'idle') glow(0, -30, 80, '#cbb8e8', 0.4);
  } else if (b.id === 'duelist') {
    const run = Math.abs(b.vx) > 100;
    ctx.beginPath(); ctx.moveTo(-9, -26); ctx.lineTo(9, -26); ctx.lineTo(13, -2); ctx.lineTo(-13, -2); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillRect(-7, -6, 5, 6 + (run ? Math.sin(TM * 30) * 3 : 0)); ctx.fillRect(2, -6, 5, 6);
    ctx.beginPath(); ctx.ellipse(0, -36, 8, 9, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-6, -43); ctx.lineTo(-12, -58); ctx.lineTo(-2, -45); ctx.moveTo(6, -43); ctx.lineTo(12, -58); ctx.lineTo(2, -45); ctx.fill();
    ctx.strokeStyle = '#e8503a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-6, -30); ctx.quadraticCurveTo(-22, -28 + Math.sin(TM * 9) * 4, -36, -22 + Math.sin(TM * 7) * 6); ctx.stroke();
    eye(3, -37, b.warn ? '#ff5a3a' : '#ffd0b8', 2.4);
    let ang = 0.15; if (pz.k === 'tele') ang = 0.15 - 0.5 * raise; else if (pz.k === 'act') ang = -0.1;
    ctx.strokeStyle = '#f0e4dc'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.save(); ctx.translate(8, -22); ctx.rotate(ang); ctx.moveTo(0, 0); ctx.lineTo(52, 0); ctx.restore(); ctx.stroke();
  } else {
    const fl2 = Math.sin(TM * 2) * 4;
    glow(0, -b.h * 0.6, 170, '#efe0ff', 0.22);
    ctx.beginPath(); ctx.moveTo(-30, 0); ctx.quadraticCurveTo(-44, -60, -22, -92); ctx.lineTo(22, -92); ctx.quadraticCurveTo(44, -60, 30, 0); ctx.quadraticCurveTo(0, 10 + fl2, -30, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, -104 + fl2 * 0.4, 15, 17, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-14, -116); ctx.lineTo(-18, -140); ctx.lineTo(-6, -122); ctx.lineTo(0, -148); ctx.lineTo(6, -122); ctx.lineTo(18, -140); ctx.lineTo(14, -116); ctx.closePath(); ctx.fill(); ctx.stroke();
    eye(-5, -104, b.warn ? '#ff7a5a' : '#fff0c0', 2.8); eye(6, -104, b.warn ? '#ff7a5a' : '#fff0c0', 2.8);
    glow(0, -66, 50, '#efe0ff', 0.5 + 0.2 * Math.sin(TM * 4)); ctx.fillStyle = '#efe0ff'; ctx.beginPath(); ctx.arc(0, -66, 6, 0, 7); ctx.fill();
    const up = pz.k === 'tele' ? raise : pz.k === 'act' && (b.mvName === 'orbs' || b.mvName === 'beam') ? 1 : 0;
    ctx.strokeStyle = rim; ctx.lineWidth = 4;
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 30, -80); ctx.lineTo(s * (44 + up * 6), -80 - up * 56); ctx.stroke(); ctx.fillStyle = '#efe0ff'; ctx.beginPath(); ctx.arc(s * (44 + up * 6), -80 - up * 56, 6, 0, 7); ctx.fill(); }
  }
  ctx.restore();
  if (b.st === 'tele') { ctx.globalAlpha = 0.6 + 0.4 * Math.sin(TM * 40); txt('!', b.x, b.y - b.h - 26, 30, '#ff7a5a', 'center'); ctx.globalAlpha = 1; }
  for (const r of b.hbs) { ctx.save(); ctx.globalAlpha = 0.28; ctx.fillStyle = '#ffffff'; roundRect(r.x, r.y, r.w, r.h, Math.min(14, r.h / 2)); ctx.fill(); ctx.restore(); }
  if (b.cols && b.cols.length) for (const c of b.cols) {
    ctx.save();
    if (b.beamWarn) { ctx.globalAlpha = 0.25 + 0.2 * Math.sin(TM * 30); ctx.fillStyle = '#ffe9a8'; ctx.fillRect(c - 3, b.ceilY, 6, b.floorY - b.ceilY); }
    else if (b.t > 0.6 && b.t < 1.0) { glow(c, (b.ceilY + b.floorY) / 2, 150, '#fff6d8', 0.5); ctx.fillStyle = '#ffffff'; ctx.fillRect(c - 20, b.ceilY, 40, b.floorY - b.ceilY); }
    ctx.restore();
  }
}

/* ---------- world ---------- */
function drawWorld() {
  const p = G.p, rm = G.room, z = ZONES[rm.zone], cx = Math.round(G.cam.x), cy = Math.round(G.cam.y);
  ctx.save();
  if (G.shake > 0) ctx.translate(rnd(-1, 1) * G.shake * 0.6, rnd(-1, 1) * G.shake * 0.6);
  drawBG(rm, cx, cy);
  ctx.translate(-cx, -cy);
  drawTiles(rm, G.W, cx, cy);
  drawDecor(rm, G.W);
  for (const e of G.enemies) drawEnemy(e);
  if (G.boss) drawBoss(G.boss);
  drawPlayer(p);
  for (const q of G.proj) drawProj(q);
  for (const q of G.parts) { ctx.globalAlpha = Math.max(0, q.life / q.max); ctx.fillStyle = q.col; ctx.fillRect(q.x, q.y, q.sz, q.sz); }
  ctx.globalAlpha = 1;
  if (!p.dead) glow(p.x, p.y - 28, 150, z.glow, 0.10);
  /* ash motes */
  ctx.fillStyle = 'rgba(' + z.fog + ',0.55)';
  for (let i = 0; i < 26; i++) {
    const sx = (i * 197.3 + TM * (6 + (i % 5) * 4)) % (W + 40), sy = (i * 83.7 + TM * (12 + (i % 3) * 6) + Math.sin(TM + i) * 20) % (H + 20);
    ctx.fillRect(cx + sx - 20, cy + sy - 10, 2, 2);
  }
  if (G.bossDeath && G.bossDeath.t < 1.2) glow(G.bossDeath.x, G.bossDeath.y, 400 * (1 - G.bossDeath.t / 1.2) + 60, '#ffffff', 0.7);
  ctx.restore();
  const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.95);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.72)'); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
}

/* ---------- HUD ---------- */
function drawMask(x, y, full) {
  ctx.save(); ctx.translate(x, y);
  if (full) { glow(0, 0, 22, '#ffffff', 0.3); ctx.fillStyle = '#f2f5ff'; } else { ctx.fillStyle = 'rgba(20,24,36,0.85)'; }
  ctx.strokeStyle = full ? '#ffffff' : '#56627f'; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.ellipse(0, 0, 10, 12, 0, 0, 7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = full ? '#0a0c12' : '#2a3350'; ctx.beginPath(); ctx.ellipse(-3.6, -1, 2, 3.4, 0.2, 0, 7); ctx.ellipse(3.6, -1, 2, 3.4, -0.2, 0, 7); ctx.fill();
  ctx.restore();
}
function drawHUD() {
  const p = G.p;
  ctx.save(); ctx.translate(46, 46);
  glow(0, 0, 50, '#bcd0ff', 0.2 + (p.soul >= 33 ? 0.15 : 0));
  ctx.fillStyle = 'rgba(8,10,18,0.85)'; ctx.strokeStyle = '#9fb0d8'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(0, 0, 26, 0, 7); ctx.fill(); ctx.stroke();
  ctx.save(); ctx.beginPath(); ctx.arc(0, 0, 23, 0, 7); ctx.clip();
  const fh = (p.soul / 99) * 46, wob = Math.sin(TM * 3) * 1.5;
  ctx.fillStyle = p.soul >= 33 ? '#f2f6ff' : '#7f90bd'; ctx.fillRect(-24, 23 - fh + wob, 48, fh + 2);
  ctx.restore(); ctx.restore();
  for (let i = 0; i < p.maxhp; i++) drawMask(96 + i * 30, 38, i < p.hp);
  if (G.boss && G.boss.st !== 'intro') {
    const b = G.boss, bw = 440, bx = W / 2 - bw / 2, by = H - 56;
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(bx - 3, by - 3, bw + 6, 12);
    ctx.fillStyle = '#e8eefc'; ctx.fillRect(bx, by, bw * Math.max(0, b.hp / b.maxhp), 6);
    txt(b.name, W / 2, by - 18, 18, '#f2f5ff', 'center');
  }
  if (G.boss && G.boss.st === 'intro') { ctx.globalAlpha = Math.min(1, G.boss.stT); txt(G.boss.name, W / 2, H / 2 - 80, 38, '#ffffff', 'center'); ctx.globalAlpha = 1; }
  if (G.banner) { ctx.globalAlpha = Math.min(1, G.banner.t, (3 - G.banner.t) * 2); txt(G.room.name, W / 2, 96, 34, '#e8eefc', 'center'); ctx.fillStyle = '#9fb0d8'; ctx.fillRect(W / 2 - 110, 120, 220, 1.5); ctx.globalAlpha = 1; }
  if (G.sign && state === 'play') {
    ctx.fillStyle = 'rgba(4,6,12,0.8)'; roundRect(W / 2 - 330, H - 128, 660, 54, 10); ctx.fill(); ctx.strokeStyle = '#6b7ba3'; ctx.lineWidth = 1.5; ctx.stroke();
    txt(G.sign, W / 2, H - 101, 17, '#dfe7ff', 'center', 'italic');
  }
  if (G.msg) {
    ctx.globalAlpha = Math.min(1, G.msg.t); ctx.fillStyle = 'rgba(0,0,0,0.65)'; ctx.fillRect(0, H / 2 - 70, W, 120);
    txt(G.msg.a, W / 2, H / 2 - 28, 40, '#fff6d8', 'center'); txt(G.msg.b, W / 2, H / 2 + 20, 18, '#cfd8f0', 'center'); ctx.globalAlpha = 1;
  }
  for (const b of G.room.benches) if (Math.abs(G.p.x - (b.x * T + 16)) < 44 && Math.abs(G.p.y - (b.y + 1) * T) < 12 && !G.boss) { txt('UP  -  REST', b.x * T + 16 - Math.round(G.cam.x) , (b.y + 1) * T - 74 - Math.round(G.cam.y), 16, '#fff0c0', 'center'); }
  if (G.rest > 0) { ctx.globalAlpha = Math.min(0.4, G.rest * 0.4); ctx.fillStyle = '#fff6d8'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  if (p.dead) { ctx.globalAlpha = Math.min(0.85, (2 - G.deadT) * 0.6); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
}

/* ---------- map ---------- */
function drawMap() {
  ctx.fillStyle = '#05070c'; ctx.fillRect(0, 0, W, H);
  txt('MAP', W / 2, 38, 32, '#e8eefc', 'center');
  const cw = 132, ch = 62, ox = 60, oy = 86;
  const ids = Object.keys(ROOMS), seen = {};
  for (const id of ids) if (save.explored[id]) { seen[id] = 2; for (const e of ROOMS[id].exits) if (!seen[e.to]) seen[e.to] = 1; }
  ctx.lineWidth = 2;
  for (const id of ids) {
    const r = ROOMS[id], s = seen[id]; if (!s) continue;
    const x = ox + r.gx * cw, y = oy + r.gy * ch, z = ZONES[r.zone];
    ctx.fillStyle = s === 2 ? 'rgba(' + z.fog + ',0.28)' : 'rgba(40,46,64,0.4)'; ctx.strokeStyle = s === 2 ? z.glow : '#3c4764';
    roundRect(x, y, cw - 10, ch - 10, 6); ctx.fill(); ctx.stroke();
    if (s === 2) {
      for (const b of r.benches) { ctx.fillStyle = '#fff0c0'; ctx.beginPath(); ctx.arc(x + 8 + (b.x / r.w) * (cw - 26), y + 8 + (b.y / r.h) * (ch - 26), 3, 0, 7); ctx.fill(); }
      if (r.boss && !save.bosses[r.boss.id]) txt('✦', x + (cw - 10) / 2, y + (ch - 10) / 2, 18, '#ff8a6a', 'center');
    } else txt('?', x + (cw - 10) / 2, y + (ch - 10) / 2, 20, '#56627f', 'center');
  }
  for (const id of Object.keys(save.stations || {})) if (save.stations[id] && ROOMS[id]) { const r=ROOMS[id], x=ox+r.gx*cw+cw/2-5, y=oy+r.gy*ch+ch/2-5; ctx.fillStyle='#fff0c0'; glow(x,y,13,'#fff0c0',0.5); ctx.beginPath(); ctx.moveTo(x,y-5); ctx.lineTo(x+5,y); ctx.lineTo(x,y+5); ctx.lineTo(x-5,y); ctx.closePath(); ctx.fill(); }
  if (G) { const r = G.room, x = ox + r.gx * cw + 8 + (G.p.x / (r.w * T)) * (cw - 26), y = oy + r.gy * ch + 8 + (G.p.y / (r.h * T)) * (ch - 26); ctx.fillStyle = '#ffffff'; glow(x, y, 16, '#ffffff', 0.7); ctx.beginPath(); ctx.arc(x, y, 4.5, 0, 7); ctx.fill(); }
  txt('white dot: you     yellow: bench     red star: unfought boss', W / 2, H - 78, 14, '#8896b8', 'center');
  drawButtons();
}

/* ---------- screens ---------- */
function drawCharms() {
  ctx.fillStyle='rgba(2,4,10,0.94)'; ctx.fillRect(0,0,W,H); glow(W/2,100,280,'#8f9ecb',0.14);
  txt('RELICS OF THE HOLLOW',W/2,58,32,'#f2f0ff','center'); txt('Bind two charms to shape your journey',W/2,98,16,'#9da9c8','center','italic');
  for(let i=0;i<2;i++){const key=save.equipped[i],x=W/2-150+i*300;ctx.fillStyle='rgba(20,24,39,.8)';ctx.strokeStyle='#7f8cad';ctx.lineWidth=2;roundRect(x-92,126,184,48,10);ctx.fill();ctx.stroke();txt(key?CHARM_DEF[key].name:'EMPTY SLOT',x,150,14,key?CHARM_DEF[key].tint:'#67738e','center');}
  if(!save.charms.length) txt('No relics found yet. Search the forgotten paths.',W/2,280,20,'#c5cce0','center');
  save.charms.forEach((key,i)=>{const y=208+i*68,c=CHARM_DEF[key],active=save.equipped.includes(key);ctx.fillStyle=active?'rgba(73,83,119,.36)':'rgba(14,18,31,.8)';ctx.strokeStyle=active?c.tint:'#414c69';ctx.lineWidth=1.5;roundRect(190,y-24,580,52,9);ctx.fill();ctx.stroke();txt(c.mark,222,y+1,26,c.tint,'center');txt(c.name,254,y-8,18,'#f1f3ff');txt(c.lore,254,y+13,13,'#aeb8d0');txt(active?'BOUND':'AVAILABLE',730,y+1,12,active?c.tint:'#8794b3','right');});drawButtons();
}
function drawWaystones() { ctx.fillStyle='rgba(2,4,10,.94)';ctx.fillRect(0,0,W,H);glow(W/2,90,300,'#e6d3a3',.12);txt('WAYSTONES',W/2,58,34,'#f4e8c9','center');txt('Rest at a stone bench to awaken its station',W/2,96,16,'#b8b1a1','center','italic');if(!Object.keys(save.stations||{}).some(id=>save.stations[id]))txt('No stations awakened yet.',W/2,250,20,'#c5cce0','center');drawButtons(); }
function drawButtons() {
  for (const b of buttons) {
    roundRect(b.x, b.y, b.w, b.h, 8);
    ctx.fillStyle = b.hud ? 'rgba(0,0,0,0.45)' : 'rgba(10,14,24,0.88)'; ctx.fill();
    ctx.lineWidth = 1.8; ctx.strokeStyle = b.hud ? 'rgba(200,215,255,0.5)' : '#7b8bb4'; ctx.stroke();
    txt(b.label, b.x + b.w / 2, b.y + b.h / 2, b.fs || 22, '#e8eefc', 'center');
  }
}
function drawTitle() {
  const im = GAME_ART.worlds;
  if (im && im.complete && im.naturalWidth) ctx.drawImage(im, 0, 0, 240, 135, 0, 0, W, H);
  else {
    const z = ZONES[0], g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#04060b'); g.addColorStop(1, '#16213a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  ctx.fillStyle = 'rgba(3,5,13,0.48)'; ctx.fillRect(0, 0, W, H);
  const veil = ctx.createLinearGradient(0, 0, 0, H);
  veil.addColorStop(0, 'rgba(4,5,14,0.20)');
  veil.addColorStop(0.58, 'rgba(4,5,14,0.08)');
  veil.addColorStop(1, 'rgba(2,3,9,0.72)');
  ctx.fillStyle = veil; ctx.fillRect(0, 0, W, H);
  glow(W / 2, 180, 250, '#aebdff', 0.18);
  drawKnightFrame(0, 1, W / 2, 214, 126, 126, 1, 1);
  txt('ASHEN HOLLOW', W / 2, 264, 50, '#f2f5ff', 'center');
  ctx.fillStyle = 'rgba(220,228,255,0.7)'; ctx.fillRect(W / 2 - 170, 291, 340, 1.2);
  txt('A kingdom buried beneath the falling ash', W / 2, 312, 17, '#c0c9df', 'center', 'italic');
  drawButtons();
}
function drawEnding() {
  ctx.fillStyle = '#05070c'; ctx.fillRect(0, 0, W, H); glow(W / 2, 200, 420, '#efe0ff', 0.18);
  txt('THE HOLLOW IS QUIET', W / 2, 110, 46, '#f6f1ff', 'center');
  txt('The Sovereign falls, and ash drifts up into a sky that has forgotten the sun.', W / 2, 180, 20, '#cfd8f0', 'center', 'italic');
  const m = Math.floor(save.time / 60);
  txt('Time  ' + m + ' min      Deaths  ' + save.deaths + '      Heart Cores  ' + (save.maxhp - 5) + ' / 3', W / 2, 250, 20, '#e8eefc', 'center');
  txt('Thank you for playing', W / 2, 310, 24, '#fff6d8', 'center');
  drawButtons();
}

function render() {
  ctx.setTransform(K, 0, 0, K, 0, 0); ctx.clearRect(0, 0, W, H);
  if (state === 'title') drawTitle();
  else if (state === 'map') drawMap();
  else if (state === 'ending') drawEnding();
  else if (state === 'charms') drawCharms();
  else if (state === 'waystones') drawWaystones();
  else if (G) {
    drawWorld(); drawHUD();
    if (state === 'play') drawButtons();
    else if (state === 'pause') { ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, W, H); txt('PAUSED', W / 2, 130, 44, '#f2f5ff', 'center'); drawButtons(); }
    if (G.trans) { const q = Math.min(1, G.trans.t / 0.22); ctx.globalAlpha = G.trans.phase === 0 ? q : 1 - q; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  }
  if (toastT > 0) { ctx.globalAlpha = Math.min(1, toastT); roundRect(W / 2 - 220, 150, 440, 36, 8); ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fill(); txt(toastMsg, W / 2, 168, 16, '#fff', 'center'); ctx.globalAlpha = 1; }
}

/* ---------- loop ---------- */
let lastTs = 0;
function frame(ts) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (ts - lastTs) / 1000 || 0.016); lastTs = ts; TM += dt;
  if (toastT > 0) toastT -= dt;
  if (state === 'play') step(dt);
  render();
}
loadSave();
go('title');
window.__AH = { setK, step, render, go, startGame, inp, get save() { return save; }, set save(v) { save = v; }, get G() { return G; }, get state() { return state; }, get buttons() { return buttons; }, loadRoom, hurtPlayer, spawnBoss, defaultSave, ROOMS, BOSS_DEF };
requestAnimationFrame(frame);
