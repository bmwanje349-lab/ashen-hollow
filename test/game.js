// Headless game test: boots the real game, renders every room, fights every boss, checks flows.
const fs = require('fs'), path = require('path'), vm = require('vm');
const noop = () => {};
const grad = () => ({ addColorStop: noop });
const ctxStub = new Proxy({}, { get: (t, k) => (k in t ? t[k] : (k === 'createLinearGradient' || k === 'createRadialGradient' ? grad : noop)), set: (t, k, v) => { t[k] = v; return true; } });
const el = () => ({ style: {}, classList: { add: noop, remove: noop, toggle: noop }, addEventListener: noop, getContext: () => ctxStub, getBoundingClientRect: () => ({ left: 0, top: 0, width: 960, height: 540 }), dataset: {}, width: 0, height: 0 });
global.window = global; global.innerWidth = 960; global.innerHeight = 540; global.devicePixelRatio = 1; global.addEventListener = noop;
global.document = { getElementById: () => el(), querySelectorAll: () => [], documentElement: {}, addEventListener: noop, hidden: false, createElement: el };
const store = {};
global.localStorage = { getItem: k => store[k] || null, setItem: (k, v) => { store[k] = v; } };
global.requestAnimationFrame = noop;
try { delete global.navigator; } catch (e) {}
const dir = path.join(__dirname, '..', 'www');
const src = ['rooms.js', 'phys.js', 'data.js', 'ent.js', 'art.js', 'play.js', 'render.js'].map(f => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');
vm.runInThisContext(src, { filename: 'bundle.js' });
const A = window.__AH;
let problems = 0;
const fail = m => { problems++; console.log('PROBLEM:', m); };
const ok = (c, m) => { if (!c) fail(m); };

function newGame(ab) {
  A.save = A.defaultSave(); Object.assign(A.save.ab, ab || {}); A.save.started = true; A.startGame();
}
function waitTrans() { let f = 0; while (A.G.trans && f++ < 200) A.step(1 / 60); }

// ---- 1. every screen renders ----
A.go('title'); A.render(); A.go('pause'); A.render(); A.go('map'); A.render(); A.go('journal'); A.render(); ok(A.state==='journal','journal screen did not open'); A.go('pause'); A.go('title');
newGame({ dash: true, dj: true });
for (const id of Object.keys(A.ROOMS)) {
  A.loadRoom(id, A.ROOMS[id].exits[0].tx, A.ROOMS[id].exits[0].ty);
  for (let f = 0; f < 120; f++) {
    const p = A.G.p;
    A.setK('right', f % 80 < 40 ? 1 : 0); A.setK('left', f % 80 >= 40 ? 1 : 0); A.setK('jump', f % 30 === 0 ? 1 : 0); A.setK('atk', f % 20 === 0 ? 1 : 0); A.setK('dash', f % 45 === 0 ? 1 : 0);
    p.hp = p.maxhp;
    A.step(1 / 60); if (f % 10 === 0) A.render();
    if (!isFinite(p.x) || !isFinite(p.y)) { fail('NaN player in ' + id); break; }
  }
  for (const k in A.inp) A.setK(k, 0);
  if (A.state !== 'play') A.go('play');
}
console.log('rooms render + wander ok:', Object.keys(A.ROOMS).length);

// ---- 2. room transitions land where they should ----
for (const id of Object.keys(A.ROOMS)) for (const e of A.ROOMS[id].exits) {
  newGame({ dash: true, dj: true });
  A.loadRoom(id, e.x === 0 ? 1 : e.x, e.y);
  const p = A.G.p, rm = A.ROOMS[id];
  p.x = (e.x + e.w / 2) * T; p.y = (e.y + e.h) * T; p.vx = 0; p.vy = 0;
  if (e.x === 0) p.x = 4;
  if (e.x + e.w === rm.w) p.x = rm.w * T - 4;
  if (e.y === 0) p.y = 20;
  A.step(1 / 60); waitTrans();
  ok(A.G.room.id === e.to, id + ' exit -> ' + e.to + ' went to ' + A.G.room.id);
}
console.log('exit transitions checked');

// ---- 3. combat basics ----
newGame({});
A.loadRoom('r1', 4, 13);
{
  const G = A.G, p = G.p; const e0 = G.enemies.find(e => e.t === 'c'); e0.x = p.x + 60; e0.y = p.y; e0.dir = -1; p.face = 1;
  let hits = 0, f = 0; const hp0 = e0.hp;
  while (G.enemies.includes(e0) && f++ < 600) { A.setK('atk', 1); e0.x = p.x + 60; e0.vx = 0; A.step(1 / 60); }
  ok(!G.enemies.includes(e0), 'sword never killed a crawler');
  ok(p.soul > 0, 'no soul gained from hits');
  A.setK('atk', 0);
  // heal
  p.hp = 2; p.soul = 60; for (let i = 0; i < 80; i++) { A.setK('heal', 1); G.enemies.length = 0; A.step(1 / 60); } A.setK('heal', 0);
  ok(p.hp === 3 && p.soul === 27, 'heal failed hp=' + p.hp + ' soul=' + p.soul);
  // damage + invulnerability
  p.hp = 5; p.inv = 0; A.hurtPlayer(1, p.x - 20); A.hurtPlayer(1, p.x - 20); ok(p.hp === 4, 'invuln frames broken');
}
// pogo
newGame({}); A.loadRoom('r1', 4, 13);
{
  const G = A.G, p = G.p; G.enemies.length = 0; spawn: { const x = p.x; }
  p.x = 700; p.y = 14 * T - 80; p.vy = 0; p.ground = false; p.djAvail = false;
  const e = { t: 'c' };
  A.G.enemies.push(Object.assign(newBody({}), { t: 'c', x: p.x, y: p.y + 40, w: 28, h: 20, hp: 99, maxhp: 99, soul: 5, dir: 1, st: 'idle', stT: 9, flash: 0, stun: 0, home: { x: p.x, y: p.y }, anim: 0, dead: false }));
  const en = A.G.enemies[0]; let pog = false;
  for (let f = 0; f < 40; f++) { A.setK('down', 1); A.setK('atk', 1); en.x = p.x; en.y = p.y + 44; en.vy = 0; en.vx = 0; en.stun = 1; const v0 = p.vy; A.step(1 / 60); if (p.vy < -500) pog = true; }
  A.setK('down', 0); A.setK('atk', 0);
  ok(pog, 'downward strike pogo did not bounce');
}
// breakable wall
newGame({}); A.loadRoom('r4', 6, 13);
{
  const G = A.G, p = G.p; G.enemies.length = 0; p.x = 4 * T + 40; p.y = 14 * T; p.face = -1;
  p.x = 5 * T + 4; p.y = 14 * T; 
  ok(G.W.t(4, 12) === 'W' && G.W.t(4, 13) === 'W', 'r4 wall missing');
  for (let f = 0; f < 60; f++) { A.setK('atk', 1); p.face = -1; p.x = 5 * T + 6; A.step(1 / 60); } A.setK('atk', 0);
  ok(G.W.t(4, 12) === '.' && G.W.t(4, 13) === '.', 'sword did not break the cracked wall');
  ok(A.save.broken.length >= 2, 'broken walls not saved');
}
// bench + save/load + death/respawn
newGame({}); A.loadRoom('r1', 4, 13);
{
  const G = A.G, p = G.p; G.enemies.length = 0; p.x = 5 * T + 16; p.y = 14 * T; p.hp = 2; p.ground = true;
  A.setK('up', 1); A.step(1 / 60); A.setK('up', 0);
  ok(p.hp === p.maxhp, 'bench did not heal');
  const raw = store['ashenhollow_save_v1']; ok(raw && JSON.parse(raw).room === 'r1', 'bench did not persist save');
  A.loadRoom('r2', 1, 13); p.hp = 1; p.inv = 0; A.hurtPlayer(1, p.x - 10);
  ok(p.dead, 'player did not die'); let f = 0; while (p.dead && f++ < 400) A.step(1 / 60);
  ok(!p.dead && A.G.room.id === 'r1' && p.hp === p.maxhp, 'respawn failed: room ' + A.G.room.id);
}
// spikes: damage + safe respawn
newGame({}); A.loadRoom('r1', 4, 13);
{
  const G = A.G, p = G.p; G.enemies.length = 0; p.x = 20 * T + 16; p.y = 14 * T; for (let i = 0; i < 20; i++) A.step(1 / 60);
  p.x = 23 * T; p.y = 15 * T; p.vy = 0; p.inv = 0; const hp0 = p.hp; A.step(1 / 60); waitTrans(); for (let i = 0; i < 30; i++) A.step(1 / 60);
  ok(p.hp === hp0 - 1, 'spikes did not hurt'); ok(p.x < 22 * T + 5 || p.x > 26 * T, 'spike respawn point is still in the pit x=' + p.x.toFixed(0));
}
console.log('combat / bench / death / spikes checked');
// relics and waystones
newGame({}); A.loadRoom('r2',1,13); { const p=A.G.p; p.x=6*T+16; p.y=14*T; A.step(1/60); ok(A.save.charms.includes('soul'),'Soul Lantern pickup failed'); A.save.equipped=['soul']; const foe=A.G.enemies[0]; if(foe){const before=p.soul; hurtEnemy(foe,1,1); ok(p.soul>before,'Soul Lantern bonus not applied');} A.go('pause'); A.go('journal'); A.render(); ok(A.state==='journal','journal menu did not open'); A.go('charms'); A.render(); ok(A.state==='charms','charm menu failed'); }
newGame({}); A.loadRoom('r1',4,13); { const p=A.G.p; p.x=5*T+16; p.y=14*T; p.ground=true; A.setK('up',1); A.step(1/60); A.setK('up',0); ok(A.save.stations.r1===true,'bench did not awaken waystone'); A.go('pause'); A.go('waystones'); A.render(); ok(A.state==='waystones','waystone menu failed'); }

// Soul Lance unlock, Soul cost and enemy hit
newGame({}); A.save.bosses.weaver=true; A.loadRoom('r10',1,13); { const G=A.G,p=G.p; p.x=10*T+16; p.y=14*T; A.step(1/60); ok(A.save.ab.lance && A.save.picks.lance,'Shade Lance reward did not unlock'); p.soul=66; p.face=1; p.hurtT=0; p.noCtl=false; p.dashT=0; p.lanceT=0; p.inv=1.5; G.enemies.length=0; const foe=Object.assign(newBody({}),{t:'c',x:p.x+150,y:p.y,w:28,h:20,hp:5,maxhp:5,soul:5,dir:-1,st:'idle',stT:4,flash:0,stun:0,home:{x:p.x+150,y:p.y},anim:0,dead:false}); G.enemies.push(foe); A.setK('skill',1); A.step(1/60); A.setK('skill',0); ok(p.soul===33,'Shade Lance did not spend 33 Soul before impact: '+p.soul); for(let i=0;i<30;i++) A.step(1/60); ok(foe.hp<5,'Shade Lance did not damage enemy'); }

// NPC dialogue persists between visits
newGame({}); A.loadRoom('r2',1,13); { const p=A.G.p; p.x=26*T+16; p.y=14*T; p.ground=true; A.setK('up',1); A.step(1/60); A.setK('up',0); ok(A.save.dialogues.mara===1,'Mara dialogue did not advance'); ok(A.G.msg && A.G.msg.a==='Mara, the Cartographer','Mara dialogue panel did not appear'); }

// ---- 4. pickups ----
newGame({}); A.loadRoom('r3', 1, 13);
{
  const G = A.G, p = G.p; A.save.bosses.warden = true; A.loadRoom('r3', 1, 13);
  p.x = 15 * T + 16; p.y = 14 * T; A.step(1 / 60);
  ok(A.save.ab.dash === true && A.save.picks.dash, 'dash pickup failed');
  A.loadRoom('r4', 6, 13); const hp0 = A.G.p.maxhp; A.G.p.x = 2 * T + 16; A.G.p.y = 14 * T; A.step(1 / 60);
  ok(A.save.maxhp === hp0 + 1, 'heart core did not add health');
}

// Enemy deaths use the full one-shot animation duration before removal.
newGame({}); A.loadRoom('r1',4,13); { const G=A.G; G.enemies.length=0; const e=Object.assign(newBody({}),{t:'c',x:500,y:14*T,w:28,h:20,hp:1,maxhp:1,soul:5,dir:1,st:'idle',stT:3,flash:0,stun:0,hurtAnimT:-1,attackAnimT:-1,deathAnimT:0,dying:false,home:{x:500,y:14*T},anim:0,dead:false}); G.enemies.push(e); hurtEnemy(e,1,1); ok(e.dying&&!e.dead,'enemy skipped its death animation'); A.step(1/60); ok(G.enemies.includes(e),'enemy was removed before the death animation finished'); for(let i=0;i<180&&G.enemies.includes(e);i++) A.step(1/60); ok(!G.enemies.includes(e),'enemy death animation never finished'); }

// ---- 5. each boss: moves all run, boss can hurt you, boss can be killed ----
const roomOf = { warden: 'r3', weaver: 'r8', duelist: 'r12', sovereign: 'r11' };
const MVS = { warden: ['lunge', 'slam', 'sweep', 'combo'], weaver: ['webs', 'pounce', 'skitter', 'rain'], duelist: ['dashslash', 'combo', 'dive', 'blades', 'retreat'], sovereign: ['stomp', 'orbs', 'rift', 'beam', 'sweep'] };
for (const id of Object.keys(roomOf)) {
  // (a) a motionless player must get hurt; keep move selection repeatable.
  const savedRandom = Math.random;
  Math.random = () => 0.42;
  newGame({ dash: true, dj: true }); A.loadRoom(roomOf[id], 1, 13);
  let G = A.G, p = G.p, hurt = 0, f = 0; const moves = new Set();
  p.x = 18 * T; p.y = (A.ROOMS[roomOf[id]].boss.floorRow) * T;
  while (f++ < 60 * 60 && !p.dead) {
    const before = p.hp; A.step(1 / 60);
    if (G.boss && G.boss.mvName && G.boss.st === 'act') moves.add(G.boss.mvName);
    if (p.hp < before) { hurt++; p.hp = p.maxhp; }
    if (hurt >= 6) break;
  }
  ok(hurt >= 3, id + ' boss almost never hits a stationary player (hurt ' + hurt + ')');
  Math.random = savedRandom;
  // (b) tank bot kills it, covering all moves
  newGame({ dash: true, dj: true }); A.loadRoom(roomOf[id], 1, 13); G = A.G; p = G.p; p.x = 9 * T; p.y = A.ROOMS[roomOf[id]].boss.floorRow * T;
  const used = new Set(); f = 0; let t0 = 0;
  while (f++ < 60 * 400) {
    p.hp = p.maxhp; p.inv = 5;
    const b = G.boss;
    if (b && !b.dead) {
      if (b.st === 'act' && b.mvName) used.add(b.mvName);
      const d = b.x - p.x; A.setK('right', d > 70 ? 1 : 0); A.setK('left', d < -70 ? 1 : 0); A.setK('atk', Math.abs(d) < 100 && b.y - p.y > -90 ? 1 : 0); p.face = d > 0 ? 1 : -1;
      if (f % 55 === 0) A.setK('jump', 1); else A.setK('jump', 0);
    }
    A.step(1 / 60); A.render();
    if (!isFinite(G.p.x) || (b && (!isFinite(b.x) || !isFinite(b.y)))) { fail(id + ' NaN'); break; }
    if (A.save.bosses[id]) break;
  }
  for (const k in A.inp) A.setK(k, 0);
  ok(A.save.bosses[id], id + ' could not be killed in 4 minutes');
  
  console.log('boss', id.padEnd(9), 'killed in', (f / 60).toFixed(0) + 's', 'moves used:', [...used].join(','), '| hits on idle player:', hurt);
}
// ---- 5b. move coverage across phases (boss made unkillable, hp swept through every phase) ----
for (const id of Object.keys(roomOf)) {
  newGame({ dash: true, dj: true }); A.loadRoom(roomOf[id], 1, 13);
  const G = A.G, p = G.p; p.x = 9 * T; p.y = A.ROOMS[roomOf[id]].boss.floorRow * T;
  const used = new Set(); let f = 0;
  while (f++ < 60 * 160) {
    p.hp = p.maxhp; p.inv = 5; const b = G.boss;
    if (b) { b.maxhp = 1e6; const ph = Math.floor(f / (60 * 50)); b.hp = b.maxhp * (ph === 0 ? 1 : ph === 1 ? 0.55 : 0.2);
      if (b.st === 'act' && b.mvName) used.add(b.mvName + ':' + b.phase);
      const d = b.x - p.x; A.setK('right', d > 70 ? 1 : 0); A.setK('left', d < -70 ? 1 : 0); A.setK('atk', 0); }
    A.step(1 / 60); if (f % 20 === 0) A.render();
  }
  const names = new Set([...used].map(u => u.split(':')[0]));
  const miss = MVS[id].filter(m => !names.has(m)); ok(!miss.length, id + ' moves never ran across phases: ' + miss.join(','));
  console.log('coverage', id.padEnd(9), [...used].sort().join(' '));
}
// ---- 6. ending flow ----
newGame({ dash: true, dj: true }); A.loadRoom('r11', 1, 13); A.save.bosses.sovereign = false;
{
  const G = A.G; A.G.p.x = 8 * T; A.G.p.y = 14 * T; for (let i = 0; i < 30; i++) A.step(1 / 60);
  ok(G.boss, 'sovereign did not spawn when entering throne room');
  ok(G.W.t(0, 10) === 'L', 'boss door did not lock');
  G.boss.st = 'idle'; G.boss.hp = 1; G.boss.x = G.p.x + 50;
  let f = 0; while (A.state === 'play' && f++ < 60 * 12) { G.p.hp = G.p.maxhp; A.setK('atk', 1); G.p.face = 1; if (G.boss) { G.boss.x = G.p.x + 50; } A.step(1 / 60); }
  A.setK('atk', 0);
  ok(A.state === 'ending', 'ending screen not reached (state=' + A.state + ')'); A.render();
  ok(A.save.ended, 'save.ended not set');
}
console.log(problems === 0 ? 'GAME OK' : problems + ' PROBLEM(S)');
process.exit(problems ? 1 : 0);
