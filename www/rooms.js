'use strict';
/* ===== ASHEN HOLLOW - world map (pure data, no DOM) ===== */
const T = 32;
const ROOMS = {};
function mkRoom(id, name, zone, gx, gy, w, h, fn) {
  const g = [];
  for (let y = 0; y < h; y++) g.push(new Array(w).fill('#'));
  let seed = 7; for (const c of id) seed = (seed * 31 + c.charCodeAt(0)) | 0;
  const r = { id, name, zone, gx, gy, w, h, exits: [], ents: [], picks: [], benches: [], npcs: [], signs: [], lockTiles: [], boss: null, reward: null, seed };
  const fill = (x, y, ww, hh, c) => { for (let j = y; j < y + hh; j++) for (let i = x; i < x + ww; i++) if (g[j] && g[j][i] !== undefined) g[j][i] = c; };
  const o = {
    air: (x, y, ww, hh) => fill(x, y, ww, hh, '.'),
    solid: (x, y, ww, hh) => fill(x, y, ww, hh, '#'),
    plat: (x, y, ww) => fill(x, y, ww, 1, '='),
    spikes: (x, y, ww) => fill(x, y, ww, 1, '^'),
    wall: (x, y, ww, hh) => fill(x, y, ww, hh, 'W'),
    exit: (x, y, ww, hh, to, tx, ty) => r.exits.push({ x, y, w: ww, h: hh, to, tx, ty }),
    ent: (t, x, y) => r.ents.push({ t, x, y }),
    pick: (t, x, y, pid) => r.picks.push({ t, x, y, id: pid }),
    bench: (x, y) => r.benches.push({ x, y }),
    npc: (id, x, y) => r.npcs.push({ id, x, y }),
    sign: (x, y, text) => r.signs.push({ x, y, text }),
    lock: (x, y, ww, hh) => { for (let j = y; j < y + hh; j++) for (let i = x; i < x + ww; i++) r.lockTiles.push([i, j]); },
    boss: (bid, x, floorRow, ceilRow, trig) => { r.boss = { id: bid, x, floorRow, ceilRow, trig }; },
    reward: (t, x, y, pid) => { r.reward = { t, x, y, id: pid }; },
  };
  fn(o, r);
  r.g = g.map(row => row.join(''));
  ROOMS[id] = r;
}
const START = { room: 'r1', tx: 4, ty: 13 };

/* ---------------- ZONE 0: Hollow Gate ---------------- */
mkRoom('r1', 'The Hollow Gate', 0, 0, 2, 44, 17, (o) => {
  o.air(1, 2, 42, 12); o.air(43, 10, 1, 4);
  o.exit(43, 10, 1, 4, 'r2', 1, 13);
  o.air(22, 14, 4, 2); o.spikes(22, 15, 4);
  o.plat(9, 11, 5); o.plat(16, 8, 4); o.plat(28, 11, 4);
  o.bench(5, 13);
  o.sign(2, 13, 'Arrows / A D move.   Z jump.   X sword.');
  o.sign(12, 13, 'Hold UP and strike to slash upward. In the air, hold DOWN and strike to bounce off foes.');
  o.sign(36, 13, 'Striking foes gathers Soul. Hold V with Soul to mend your wounds. Rest at benches with UP.');
  o.ent('c', 16, 13); o.ent('c', 32, 13); o.ent('f', 30, 6); o.ent('c', 40, 13);
});
mkRoom('r2', 'Forgotten Crossroads', 0, 1, 2, 52, 17, (o) => {
  o.air(1, 2, 50, 12);
  o.air(0, 10, 1, 4); o.exit(0, 10, 1, 4, 'r1', 42, 13);
  o.air(51, 10, 1, 4); o.exit(51, 10, 1, 4, 'r3', 1, 13);
  o.air(22, 14, 4, 3); o.exit(22, 16, 4, 1, 'r4', 11, 2);
  o.solid(45, 9, 7, 1); o.air(51, 6, 1, 3); o.exit(51, 6, 1, 3, 'r9', 2, 8);
  o.plat(8, 11, 4); o.plat(14, 11, 4); o.plat(11, 8, 3);
  o.bench(18, 13);
  o.pick('C', 6, 13, 'charm_soul');
  o.npc('mara', 26, 13);
  o.sign(40, 13, 'A ledge too high to reach. A gift of flight would carry you there.');
  o.sign(48, 13, 'Ahead: the Warden\'s Hall. Below: Mosswell.');
  o.ent('c', 10, 13); o.ent('f', 30, 5); o.ent('c', 32, 13); o.ent('c', 38, 13);
});
mkRoom('r3', "The Warden's Hall", 0, 2, 2, 30, 17, (o) => {
  o.air(1, 2, 28, 12); o.air(0, 10, 1, 4);
  o.exit(0, 10, 1, 4, 'r2', 50, 13); o.lock(0, 10, 1, 4);
  o.plat(4, 11, 4); o.plat(10, 8, 4); o.plat(18, 8, 4); o.plat(22, 11, 4);
  o.boss('warden', 24, 14, 2, 7);
  o.reward('D', 15, 13, 'dash');
});
mkRoom('r4', 'Mosswell', 0, 1, 3, 36, 17, (o) => {
  o.air(5, 2, 30, 12); o.air(10, 0, 4, 2);
  o.exit(10, 0, 4, 1, 'r2', 20, 13);
  o.air(1, 12, 3, 2); o.wall(4, 12, 1, 2); o.pick('H', 2, 13, 'core_r4');
  o.air(35, 10, 1, 4); o.exit(35, 10, 1, 4, 'r5', 1, 13);
  o.plat(6, 11, 4); o.plat(11, 8, 4); o.plat(7, 5, 4); o.plat(11, 3, 3);
  o.bench(30, 13);
  o.sign(6, 13, 'Some walls are cracked. Strike them.');
  o.ent('h', 22, 13); o.ent('c', 27, 13); o.ent('c', 17, 13);
});
mkRoom('r5', 'The Sundered Chasm', 0, 2, 3, 48, 17, (o) => {
  o.air(1, 2, 46, 12);
  o.air(0, 10, 1, 4); o.exit(0, 10, 1, 4, 'r4', 34, 13);
  o.air(47, 10, 1, 4); o.exit(47, 10, 1, 4, 'r6', 1, 13);
  o.air(11, 14, 10, 2); o.spikes(11, 15, 10);
  o.bench(4, 13);
  o.sign(8, 13, 'The path is severed. A burst of speed might carry you across.');
  o.ent('c', 6, 13); o.ent('c', 25, 13); o.ent('s', 32, 13); o.ent('h', 38, 13); o.ent('f', 41, 5);
});

/* ---------------- ZONE 1: Weeping Caverns ---------------- */
mkRoom('r6', 'Weeping Caverns', 1, 3, 3, 44, 17, (o) => {
  o.air(1, 2, 42, 12);
  o.air(0, 10, 1, 4); o.exit(0, 10, 1, 4, 'r5', 46, 13);
  o.air(43, 10, 1, 4); o.exit(43, 10, 1, 4, 'r7', 1, 13);
  o.plat(12, 11, 4); o.plat(18, 8, 4); o.plat(26, 11, 4); o.plat(32, 8, 4);
  o.bench(5, 13);
  o.pick('C', 20, 13, 'charm_reach');
  o.npc('oren', 8, 13);
  o.ent('f', 15, 6); o.ent('f', 30, 5); o.ent('s', 21, 13); o.ent('s', 35, 13); o.ent('c', 25, 13); o.ent('l', 39, 13);
});
mkRoom('r7', 'The Drip Hall', 1, 4, 3, 56, 17, (o) => {
  o.air(1, 2, 54, 12);
  o.air(0, 10, 1, 4); o.exit(0, 10, 1, 4, 'r6', 42, 13);
  o.air(55, 10, 1, 4); o.exit(55, 10, 1, 4, 'r8', 1, 13);
  o.air(12, 14, 8, 2); o.spikes(12, 15, 8);
  o.air(30, 14, 8, 2); o.spikes(30, 15, 8);
  o.solid(44, 9, 3, 1); o.pick('H', 45, 8, 'core_r7');
  o.bench(52, 13);
  o.sign(48, 13, 'The Weaver\'s lair lies ahead. Rest first.');
  o.ent('l', 8, 13); o.ent('l', 24, 13); o.ent('f', 26, 5); o.ent('c', 41, 13); o.ent('s', 50, 13);
});
mkRoom('r8', "The Weaver's Lair", 1, 5, 3, 30, 17, (o) => {
  o.air(1, 2, 28, 12); o.air(0, 10, 1, 4);
  o.exit(0, 10, 1, 4, 'r7', 54, 13); o.lock(0, 10, 1, 4);
  o.plat(4, 11, 4); o.plat(10, 8, 4); o.plat(18, 8, 4); o.plat(22, 11, 4);
  o.boss('weaver', 22, 14, 2, 7);
  o.reward('J', 15, 13, 'dj');
});

/* ---------------- ZONE 2: Ashen Spires ---------------- */
mkRoom('r9', 'Spire Ascent', 2, 1, 1, 34, 17, (o) => {
  o.air(1, 2, 32, 12);
  o.air(0, 6, 1, 3); o.exit(0, 6, 1, 3, 'r2', 50, 8);
  o.solid(1, 9, 3, 1);
  o.spikes(4, 13, 26);
  o.plat(7, 9, 3); o.plat(12, 8, 3); o.plat(17, 9, 3); o.plat(22, 8, 3); o.plat(27, 10, 3);
  o.plat(14, 5, 3); o.pick('H', 15, 4, 'core_r9');
  o.air(33, 10, 1, 4); o.exit(33, 10, 1, 4, 'r10', 1, 13);
  o.sign(2, 8, 'Embers rise. The spires await.');
  o.ent('f', 15, 6); o.ent('f', 25, 6);
});
mkRoom('r10', 'Ember Hall', 2, 2, 1, 48, 17, (o) => {
  o.air(1, 2, 46, 12);
  o.air(0, 10, 1, 4); o.exit(0, 10, 1, 4, 'r9', 32, 13);
  o.air(47, 10, 1, 4); o.exit(47, 10, 1, 4, 'r11', 1, 13);
  o.solid(41, 9, 7, 1); o.air(47, 6, 1, 3); o.exit(47, 6, 1, 3, 'r12', 1, 10);
  o.plat(10, 11, 4); o.plat(16, 8, 4); o.plat(24, 11, 4);
  o.bench(6, 13); o.bench(37, 13);
  o.pick('C', 8, 13, 'charm_ward');
  o.pick('A', 10, 13, 'lance');
  o.npc('pilgrim', 40, 13);
  o.sign(34, 13, 'North: a duelist waits in a high chamber. East: the Hollow Throne.');
  o.ent('h', 14, 13); o.ent('l', 20, 13); o.ent('l', 28, 13); o.ent('f', 22, 5); o.ent('f', 31, 5); o.ent('s', 32, 13);
});
mkRoom('r11', 'The Hollow Throne', 3, 3, 1, 30, 17, (o) => {
  o.air(1, 1, 28, 13); o.air(0, 10, 1, 4);
  o.exit(0, 10, 1, 4, 'r10', 46, 13); o.lock(0, 10, 1, 4);
  o.plat(4, 11, 4); o.plat(22, 11, 4); o.plat(13, 8, 4);
  o.boss('sovereign', 22, 14, 1, 7);
});
mkRoom('r12', "The Duelist's Rest", 2, 2, 0, 30, 17, (o) => {
  o.air(1, 2, 28, 9); o.air(0, 8, 1, 3);
  o.exit(0, 8, 1, 3, 'r10', 46, 8); o.lock(0, 8, 1, 3);
  o.boss('duelist', 22, 11, 2, 6);
  o.reward('E', 15, 10, 'edge');
});
