'use strict';
/* ===== ASHEN HOLLOW - player, rooms, game flow, UI state, events ===== */
let state = 'title', G = null, buttons = [], toastT = 0, toastMsg = '';

function toast(m) { toastMsg = m; toastT = 2.4; }
function newPlayer() {
  const p = newBody(save.ab);
  Object.assign(p, { hp: save.maxhp, maxhp: save.maxhp, soul: 0, inv: 0, atkT: 0, atkDur: 0.3, atkAge: 0, atkDir: 'f', atkFace: 1, hitSet: new Set(), healT: 0,
    dead: false, safe: { x: 0, y: 0 }, anim: 0, wasGround: true, fall: 0, noCtl: false });
  return p;
}
function startGame() {
  G = { p: newPlayer(), room: null, W: null, enemies: [], proj: [], parts: [], texts: [], boss: null, bossDeath: null, bossArmed: false, cam: { x: 0, y: 0 },
    shake: 0, hitstop: 0, t: 0, trans: null, banner: null, deadT: 0, sign: null, endT: 0, rest: 0 };
  loadRoom(save.room, save.bx, save.by);
  G.p.hp = G.p.maxhp; G.p.soul = 0;
  pressed = {};
  go('play');
}
function loadRoom(id, tx, ty) {
  const rm = ROOMS[id], p = G.p;
  G.room = rm; G.W = new World(rm, save.broken);
  G.enemies = []; G.proj = []; G.parts = []; G.texts = []; G.boss = null; G.bossDeath = null;
  if (tx !== undefined) { p.x = tx * T + T / 2; p.y = (ty + 1) * T; p.vx = 0; p.vy = 0; p.dashT = 0; }
  p.safe = { x: p.x, y: p.y };
  if (!save.explored[id]) save.explored[id] = 1;
  rm.ents.forEach(e => spawnEnemy(e.t, e.x, e.y));
  G.bossArmed = !!(rm.boss && !save.bosses[rm.boss.id]);
  G.banner = { text: rm.name, t: 3.0 };
  G.cam.x = clamp(p.x - W / 2, 0, Math.max(0, rm.w * T - W));
  G.cam.y = clamp(p.y - H * 0.6, 0, Math.max(0, rm.h * T - H));
  G.trailT = 0;
}
function startTrans(fn) { if (!G.trans) G.trans = { t: 0, phase: 0, fn }; }

/* ---------- damage ---------- */
function hurtPlayer(dmg, srcX) {
  const p = G.p;
  if (p.inv > 0 || p.dead) return;
  if (save.equipped.includes('ward') && Math.random() < 0.25) { p.inv = 0.28; sfx('clink'); spawnParts(p.x, p.y - 24, 8, '#f4d39a', 180, 0.45); toast('ASHEN WARD'); return; }
  p.hp -= dmg; p.inv = 1.4; p.hurtT = 0.28; p.healT = 0; p.dashT = 0;
  p.vx = sg(p.x - srcX) * 330; p.vy = -340; p.ground = false;
  G.hitstop = Math.max(G.hitstop, 0.1); G.shake = Math.max(G.shake, 12);
  sfx('hurt'); spawnParts(p.x, p.y - 22, 14, '#e8eeff', 300, 0.6);
  if (p.hp <= 0) { p.hp = 0; die(); }
}
function die() {
  const p = G.p;
  p.dead = true; G.deadT = 2.0; save.deaths++; sfx('die'); p.vx = 0; p.vy = -200;
  spawnParts(p.x, p.y - 22, 40, '#ffffff', 420, 1.2);
}
function respawn() {
  const p = G.p;
  p.dead = false; p.hp = p.maxhp; p.soul = 0; p.inv = 1; p.hurtT = 0; p.healT = 0;
  loadRoom(save.room, save.bx, save.by);
  persist();
}

/* ---------- sword ---------- */
function slashRect(p) {
  const reach = 80 + (save.sword ? 22 : 0) + (save.equipped.includes('reach') ? 30 : 0);
  if (p.atkDir === 'u') return { x: p.x - 32, y: p.y - 46 - 72, w: 64, h: 72 + 20 };
  if (p.atkDir === 'd') return { x: p.x - 32, y: p.y - 6, w: 64, h: 66 };
  return { x: p.atkFace > 0 ? p.x + 4 : p.x - 4 - reach, y: p.y - 56, w: reach, h: 54 };
}
function breakWalls(sx, sy) {
  const g = G.W.g, q = [[sx, sy]];
  while (q.length) {
    const [x, y] = q.pop();
    if (!g[y] || g[y][x] !== 'W') continue;
    g[y][x] = '.'; save.broken.push(G.room.id + ':' + x + ':' + y);
    spawnParts(x * T + 16, y * T + 16, 8, '#8a8f9e', 260, 0.7);
    q.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  sfx('brk'); G.shake = Math.max(G.shake, 6); persist();
}
function doSlash(p) {
  const r = slashRect(p), dmg = 1 + (save.sword ? 1 : 0);
  let hit = false, pogo = false;
  for (const e of G.enemies) {
    if (e.dead || p.hitSet.has(e)) continue;
    if (rectOv(r.x, r.y, r.w, r.h, e.x - e.w / 2, e.y - e.h, e.w, e.h)) { p.hitSet.add(e); hurtEnemy(e, dmg, p.atkDir === 'f' ? p.atkFace : sg(e.x - p.x)); hit = true; if (p.atkDir === 'd') pogo = true; }
  }
  const b = G.boss;
  if (b && !b.dead && !p.hitSet.has(b) && rectOv(r.x, r.y, r.w, r.h, b.x - b.w / 2, b.y - b.h, b.w, b.h)) {
    if (hurtBoss(b, dmg, p.atkFace)) { p.hitSet.add(b); hit = true; if (p.atkDir === 'd') pogo = true; }
  }
  const x0 = Math.floor(r.x / T), x1 = Math.floor((r.x + r.w) / T), y0 = Math.floor(r.y / T), y1 = Math.floor((r.y + r.h) / T);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    const c = G.W.t(tx, ty);
    if (c === 'W') { breakWalls(tx, ty); hit = true; }
    else if (c === '^' && p.atkDir === 'd' && !p.hitSet.has('sp')) { p.hitSet.add('sp'); pogo = true; hit = true; sfx('clink'); }
    else if ((c === '#' || c === 'L') && !p.hitSet.has('wl') && p.atkDir !== 'd') { p.hitSet.add('wl'); sfx('clink'); spawnParts(clamp(p.x + p.atkFace * 40, r.x, r.x + r.w), p.y - 30, 3, '#cfd6ea', 160, 0.3); }
  }
  if (hit && p.atkDir === 'f' && !pogo) p.vx = -p.atkFace * 150;
  if (pogo) { p.vy = -640; p.djAvail = true; p.airDash = true; p.jumping = false; p.ground = false; }
}

/* ---------- player update ---------- */
function updPlayer(dt) {
  const p = G.p, W_ = G.W;
  p.inv -= dt; p.atkT -= dt;
  if (p.dead) { p.vy = Math.min(MAXFALL, p.vy + GRAV * dt); p.vx *= 0.9; moveBox(p, dt, W_); return; }
  /* heal */
  if (inp.heal && p.soul >= 33 && p.ground && p.hp < p.maxhp && p.hurtT <= 0 && p.dashT <= 0 && p.atkT <= 0) {
    p.healT += dt; p.noCtl = true;
    if (p.healT >= 0.85) { p.hp++; p.soul -= 33; p.healT = 0; sfx('heal'); spawnParts(p.x, p.y - 24, 16, '#fff6c8', 220, 0.8); }
  } else { p.healT = 0; p.noCtl = false; }
  /* attack */
  if (pressed.skill && save.ab.lance && p.soul >= 33 && !p.noCtl && p.hurtT <= 0 && p.dashT <= 0) {
    p.soul -= 33; G.proj.push({ x: p.x + p.face * 22, y: p.y - 27, vx: p.face * 650, vy: 0, g: 0, r: 11, life: 1.45, col: '#bceeff', dmg: 2, kind: 'orb', hitW: true, fromPlayer: true });
    sfx('lance'); G.shake = Math.max(G.shake, 2); spawnParts(p.x + p.face * 18, p.y - 27, 7, '#bceeff', 170, 0.35);
  }
  if ((pressed.atk || inp.atk) && p.atkT <= 0 && !p.noCtl && p.hurtT <= 0) {
    p.atkDir = inp.up ? 'u' : (inp.down && !p.ground) ? 'd' : 'f';
    p.atkDur = save.sword ? 0.26 : 0.32; p.atkT = p.atkDur; p.atkAge = 0; p.atkFace = p.face; p.hitSet = new Set(); sfx('swing');
  }
  if (p.atkT > 0) { p.atkAge += dt; if (p.atkAge > 0.04 && p.atkAge < 0.18) doSlash(p); }
  const wasG = p.ground, vyBefore = p.vy;
  stepBody(p, { left: inp.left, right: inp.right, down: inp.down, jumpP: pressed.jump, jumpH: inp.jump, dashP: pressed.dash }, dt, W_);
  if (p.jumped) sfx('jump'); if (p.djumped) { sfx('djump'); spawnParts(p.x, p.y, 8, '#cfe0ff', 180, 0.4); }
  if (p.dashStarted) { sfx('dash'); G.trailT = 0.2; }
  if (p.ground && !wasG && vyBefore > 400) { sfx('land'); spawnParts(p.x, p.y, 5, '#9aa4c0', 120, 0.3); }
  p.anim += dt * Math.abs(p.vx) / 40;
  if (p.dashT > 0 && Math.random() < 0.7) G.parts.push({ x: p.x - p.dashDir * 10, y: p.y - rnd(8, 36), vx: 0, vy: 0, life: 0.3, max: 0.3, col: '#cfe0ff', sz: rnd(3, 6), g: 0 });
  /* safe spot */
  if (p.ground) {
    const c = W_.t(Math.floor(p.x / T), Math.floor(p.y / T)), cl = W_.t(Math.floor((p.x - 14) / T), Math.floor(p.y / T)), cr = W_.t(Math.floor((p.x + 14) / T), Math.floor(p.y / T));
    const ok = ch => ch === '#' || ch === 'W' || ch === '=';
    if (ok(c) && ok(cl) && ok(cr) && W_.t(Math.floor(p.x / T), Math.floor(p.y / T) - 1) !== '^') p.safe = { x: p.x, y: p.y };
  }
  /* spikes */
  if (p.inv <= 0 && spikeHit(W_, p)) {
    hurtPlayer(1, p.x);
    if (!p.dead) { startTrans(() => { p.x = p.safe.x; p.y = p.safe.y; p.vx = 0; p.vy = 0; p.inv = 1.2; p.hurtT = 0; }); }
  }
  p.x = clamp(p.x, 0, W_.w * T);
  /* bench, sign, pickups */
  G.sign = null;
  for (const s of G.room.signs) if (Math.abs(p.x - (s.x * T + 16)) < 52 && Math.abs(p.y - (s.y + 1) * T) < 60) G.sign = s.text;
  if (pressed.up && p.ground && !G.boss) for (const b of G.room.benches) {
    if (Math.abs(p.x - (b.x * T + 16)) < 44 && Math.abs(p.y - (b.y + 1) * T) < 12) {
      p.hp = p.maxhp; save.room = G.room.id; save.bx = b.x; save.by = b.y; save.started = true; save.stations[G.room.id] = true; persist(); sfx('bench');
      G.enemies = []; G.proj = []; G.room.ents.forEach(e => spawnEnemy(e.t, e.x, e.y)); G.rest = 1.6; spawnParts(p.x, p.y - 30, 24, '#fff6c8', 200, 1.0); toast('Rested. Progress saved.');
    }
  }
  const items = G.room.picks.slice();
  if (G.room.reward && G.room.boss && save.bosses[G.room.boss.id]) items.push(G.room.reward);
  for (const it of items) {
    if (save.picks[it.id] || (it.id === 'lance' && !save.bosses.weaver)) continue;
    if (Math.abs(p.x - (it.x * T + 16)) < 34 && Math.abs((p.y - 22) - ((it.y + 1) * T - 22)) < 40) collect(it);
  }
  /* boss trigger */
  if (G.bossArmed && p.x > G.room.boss.trig * T + 16) {
    G.bossArmed = false; G.W.setLock(true); spawnBoss(G.room); sfx('door'); G.shake = 8;
  }
  /* room exit */
  const ex = exitAt(G.room, p);
  if (ex && !G.trans) { sfx('door'); startTrans(() => { loadRoom(ex.to, ex.tx, ex.ty); }); }
}
function collect(it) {
  save.picks[it.id] = true;
  if (it.id.startsWith('charm_')) { const key = it.id.slice(6); if (CHARM_DEF[key] && !save.charms.includes(key)) save.charms.push(key); G.msg = { t: 5, a: CHARM_DEF[key].name.toUpperCase(), b: CHARM_DEF[key].lore }; }
  else if (it.id === 'dash') { save.ab.dash = true; G.msg = { t: 5, a: 'SHADE DASH', b: 'Press C / DASH to burst forward. Cross the chasms.' }; }
  else if (it.id === 'dj') { save.ab.dj = true; G.msg = { t: 5, a: 'WISP WINGS', b: 'Jump again in mid-air. The high ledges are open.' }; }
  else if (it.id === 'edge') { save.sword = 1; G.msg = { t: 5, a: 'EDGE OF NIGHT', b: 'Your sword reaches farther, strikes harder and swings faster.' }; }
  else if (it.id === 'lance') { save.ab.lance = true; G.msg = { t: 5, a: 'SHADE LANCE', b: 'Press F / LANCE to spend 33 Soul and fire a piercing bolt.' }; }
  else if (it.t === 'H') { save.maxhp++; G.p.maxhp = save.maxhp; G.p.hp = G.p.maxhp; G.msg = { t: 4, a: 'HEART CORE', b: 'Maximum health increased.' }; }
  G.p.soul = Math.min(99, G.p.soul + 0);
  sfx('pick'); G.shake = 4; spawnParts(it.x * T + 16, (it.y + 1) * T - 24, 30, '#fff6c8', 300, 1.2); persist();
}

/* ---------- step ---------- */
function step(rdt) {
  if (!G) return;
  G.t += rdt;
  if (G.trans) {
    const tr = G.trans; tr.t += rdt;
    if (tr.phase === 0 && tr.t >= 0.22) { tr.phase = 1; tr.t = 0; tr.fn(); }
    else if (tr.phase === 1 && tr.t >= 0.22) G.trans = null;
    pressed = {}; return;
  }
  let dt = Math.min(rdt, 0.033);
  if (G.hitstop > 0) { G.hitstop -= rdt; dt *= 0.08; }
  if (G.banner) { G.banner.t -= rdt; if (G.banner.t <= 0) G.banner = null; }
  if (G.msg) { G.msg.t -= rdt; if (G.msg.t <= 0) G.msg = null; }
  if (G.rest > 0) G.rest -= rdt;
  G.trailT -= dt;
  const p = G.p;
  updPlayer(dt);
  if (!p.dead) {
    for (const e of G.enemies) updEnemy(e, dt);
    G.enemies = G.enemies.filter(e => !e.dead);
    if (G.boss) updBoss(G.boss, dt);
    updProj(dt);
  } else {
    G.deadT -= rdt;
    if (G.deadT <= 0 && !G.trans) startTrans(respawn);
  }
  if (G.bossDeath) {
    G.bossDeath.t += rdt;
    if (G.bossDeath.t > 0.1 && Math.random() < 0.5) spawnParts(G.bossDeath.x + rnd(-30, 30), G.bossDeath.y + rnd(-40, 40), 3, '#ffffff', 200, 0.8);
    if (G.bossDeath.t > 3.5 && G.bossDeath.id === 'sovereign' && !save.ended) { save.ended = true; persist(); sfx('win'); go('ending'); return; }
  }
  for (let i = G.parts.length - 1; i >= 0; i--) { const q = G.parts[i]; q.life -= dt; q.vy += q.g * dt; q.x += q.vx * dt; q.y += q.vy * dt; if (q.life <= 0) G.parts.splice(i, 1); }
  for (let i = G.texts.length - 1; i >= 0; i--) { const q = G.texts[i]; q.life -= dt; q.y -= 30 * dt; if (q.life <= 0) G.texts.splice(i, 1); }
  if (G.parts.length > 350) G.parts.splice(0, G.parts.length - 350);
  G.shake = Math.max(0, G.shake - rdt * 40);
  const rm = G.room, tx = clamp(p.x - W / 2 + p.face * 40, 0, Math.max(0, rm.w * T - W)), ty = clamp(p.y - H * 0.62, 0, Math.max(0, rm.h * T - H));
  G.cam.x += (tx - G.cam.x) * Math.min(1, dt * 7); G.cam.y += (ty - G.cam.y) * Math.min(1, dt * 5);
  save.time += rdt;
  music(rdt, !!G.boss && G.boss.st !== 'intro');
  pressed = {};
}

/* ---------- ui ---------- */
function btn(x, y, w, h, label, fn, o) { buttons.push(Object.assign({ x, y, w, h, label, fn }, o || {})); }
function go(s) {
  state = s; buttons = [];
  const touch = document.getElementById('touch');
  if (touch) touch.classList.toggle('hide', s !== 'play');
  for (const k in inp) inp[k] = 0;
  document.querySelectorAll('#touch button').forEach(b => b.classList.remove('on'));
  const cx = W / 2 - 120;
  if (s === 'title') {
    let y = 300;
    if (hasSave()) { btn(cx, y, 240, 52, 'CONTINUE', () => { tryFullscreen(); startGame(); }); y += 62; }
    btn(cx, y, 240, 52, hasSave() ? 'NEW GAME' : 'BEGIN', () => { if (hasSave() && !go.confirm) { go.confirm = true; toast('Tap NEW GAME again to erase your save'); return; } go.confirm = false; tryFullscreen(); save = defaultSave(); save.started = true; muted = false; persist(); startGame(); });
    y += 62;
    btn(W - 130, H - 54, 114, 38, muted ? 'SOUND OFF' : 'SOUND ON', () => { muted = !muted; save.muted = muted; persist(); go('title'); }, { fs: 14 });
  } else if (s === 'play') {
    btn(W - 56, 10, 46, 38, 'II', () => togglePause(), { fs: 18, hud: true });
    btn(W - 112, 10, 52, 38, 'MAP', () => go('map'), { fs: 13, hud: true });
  } else if (s === 'pause') {
    btn(cx, 190, 240, 52, 'RESUME', () => go('play'));
    btn(cx, 244, 240, 46, 'MAP', () => go('map'));
    btn(cx, 296, 240, 46, 'CHARMS', () => go('charms'));
    btn(cx, 348, 240, 46, 'WAYSTONES', () => go('waystones'));
    btn(cx, 400, 240, 46, muted ? 'SOUND: OFF' : 'SOUND: ON', () => { muted = !muted; save.muted = muted; persist(); go('pause'); });
    btn(cx, 452, 240, 42, 'SAVE & QUIT', () => { persist(); G = null; go('title'); });
  } else if (s === 'map') {
    btn(W / 2 - 80, H - 58, 160, 42, 'CLOSE', () => go(G ? 'play' : 'title'), { fs: 18 });
  } else if (s === 'charms') {
    save.charms.forEach((key, i) => { const on = save.equipped.includes(key); btn(W/2-205, 204+i*68, 410, 52, (on?'◆  ':'◇  ')+CHARM_DEF[key].name+(on?'  • BOUND':'  • EQUIP'), () => { if(save.equipped.includes(key)) save.equipped=save.equipped.filter(v=>v!==key); else if(save.equipped.length<2) save.equipped.push(key); else toast('Two charm slots. Unequip one first.'); persist(); go('charms'); }, { fs:16 }); });
    btn(W/2-100, 454, 200, 44, 'BACK', () => go('pause'));
  } else if (s === 'waystones') {
    const ids = Object.keys(save.stations).filter(id => save.stations[id] && ROOMS[id]);
    ids.forEach((id,i) => { const col=i%2, row=Math.floor(i/2); btn(W/2-310+col*320, 150+row*64, 300, 52, STATION_NAMES[id] || ROOMS[id].name, () => travelTo(id), { fs:15 }); });
    btn(W/2-100, 464, 200, 42, 'BACK', () => go('pause'));
  } else if (s === 'ending') {
    btn(cx, H - 90, 240, 50, 'KEEP EXPLORING', () => { go('play'); G.bossDeath = null; });
  }
}
function travelTo(id) { const rm=ROOMS[id], b=rm && rm.benches[0]; if(!b || !save.stations[id]) return; save.room=id; save.bx=b.x; save.by=b.y; persist(); loadRoom(id,b.x,b.y); G.p.hp=G.p.maxhp; G.p.soul=0; go('play'); toast('Waystone: '+(STATION_NAMES[id]||rm.name)); sfx('door'); }
function togglePause() { if (state === 'play') go('pause'); else if (state === 'pause' || state === 'map' || state === 'charms' || state === 'waystones') go('play'); }
function tryFullscreen() { try { const el = document.documentElement; if (!document.fullscreenElement && el.requestFullscreen) { const r = el.requestFullscreen(); if (r && r.catch) r.catch(() => {}); } } catch (e) {} }

addEventListener('keydown', e => {
  audioInit();
  if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') { togglePause(); return; }
  if (e.key === 'm' || e.key === 'M') { if (state === 'play') go('map'); else if (state === 'map') go('play'); return; }
  if (e.key === 'i' || e.key === 'I') { if (state === 'play' || state === 'pause') go('charms'); else if (state === 'charms') go('play'); return; }
  if (e.key === 't' || e.key === 'T') { if (state === 'play' || state === 'pause') go('waystones'); else if (state === 'waystones') go('play'); return; }
  if (e.key === 'Enter' && state === 'title' && buttons[0]) { buttons[0].fn(); return; }
  const k = KM[e.key];
  if (k) { setK(k, 1); e.preventDefault(); }
});
addEventListener('keyup', e => { const k = KM[e.key]; if (k) setK(k, 0); });
document.querySelectorAll('#touch button').forEach(b => {
  const k = b.dataset.k;
  const dn = e => { e.preventDefault(); audioInit(); setK(k, 1); b.classList.add('on'); };
  const up = e => { e.preventDefault(); setK(k, 0); b.classList.remove('on'); };
  b.addEventListener('pointerdown', dn); b.addEventListener('pointerup', up);
  b.addEventListener('pointercancel', up); b.addEventListener('pointerleave', up);
  b.addEventListener('contextmenu', e => e.preventDefault());
});
cv.addEventListener('pointerdown', e => {
  audioInit();
  const r = cv.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width * W, y = (e.clientY - r.top) / r.height * H;
  for (const b of buttons) if (!b.off && x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) { sfx('click'); b.fn(); break; }
});
addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('visibilitychange', () => { if (document.hidden) { persist(); if (state === 'play') go('pause'); } });
addEventListener('pagehide', persist);
