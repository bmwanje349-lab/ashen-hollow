// Reachability test: brute-forces movement macros through the REAL physics to prove ability gating.
const fs = require('fs'), path = require('path'), vm = require('vm');
const dir = path.join(__dirname, '..', 'www');
vm.runInThisContext(['rooms.js', 'phys.js'].map(f => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n'), { filename: 'pure.js' });

let problems = 0;
const fail = m => { problems++; console.log('PROBLEM:', m); };
const DT = 1 / 60;

// ---- static checks ----
for (const id in ROOMS) {
  const r = ROOMS[id];
  if (r.g.length !== r.h) fail(id + ' height mismatch');
  r.g.forEach((row, i) => { if (row.length !== r.w) fail(id + ' row ' + i + ' width ' + row.length + '!=' + r.w); });
  for (const e of r.exits) {
    const to = ROOMS[e.to];
    if (!to) { fail(id + ' exit to missing room ' + e.to); continue; }
    if (!to.exits.some(x => x.to === id)) fail(id + ' -> ' + e.to + ' has no return exit');
    // arrival body must be free of solids and settle on ground without spikes
    const W = new World(to, []);
    const b = newBody({ dash: false, dj: false });
    b.x = e.tx * T + T / 2; b.y = (e.ty + 1) * T;
    let ok = true;
    for (let f = 0; f < 90; f++) { stepBody(b, {}, DT, W); if (spikeHit(W, b)) { ok = false; break; } }
    if (!ok) fail('arrival ' + id + '->' + e.to + ' lands on spikes');
    if (!b.ground) fail('arrival ' + id + '->' + e.to + ' does not land (x=' + b.x.toFixed(0) + ',y=' + b.y.toFixed(0) + ')');
    if (exitAt(to, Object.assign({}, b, { x: e.tx * T + T / 2, y: (e.ty + 1) * T }))) fail('arrival ' + id + '->' + e.to + ' re-triggers an exit immediately');
  }
  if (r.boss) {
    const bx = r.boss.x, fr = r.boss.floorRow;
    if (r.g[fr][bx] !== '#' && r.g[fr][bx] !== '=') fail(id + ' boss start not above floor');
  }
}

// ---- reachability ----
function brokenOf(room) { const a = []; room.g.forEach((row, y) => [...row].forEach((c, x) => { if (c === 'W') a.push(room.id + ':' + x + ':' + y); })); return a; }
const worlds = {};
const getW = id => worlds[id] || (worlds[id] = new World(ROOMS[id], brokenOf(ROOMS[id])));

function macros(ab) {
  const list = [{ run: -1 }, { run: 1 }];
  for (const d of [-1, 0, 1]) for (const hold of [10, 40]) {
    for (const djAt of (ab.dj ? [-1, 16, 30] : [-1])) for (const dashAt of (ab.dash ? [-1, 3, 10, 20, 32] : [-1])) {
      list.push({ d, hold, jumpAt: 0, djAt, dashAt });
      if (dashAt === -1 && ab.dash && d !== 0) list.push({ d, hold, jumpAt: 8, djAt, dashAt: 0 });
    }
  }
  return list;
}
function runMacro(room, st, m, ab, out) {
  const W = getW(room.id), b = newBody(ab);
  b.x = st.x; b.y = st.y; b.ground = true; b.face = m.run || m.d || 1;
  let air = false;
  const frames = m.run ? 260 : 150;
  for (let f = 0; f < frames; f++) {
    let inp;
    if (m.run) inp = { left: m.run < 0, right: m.run > 0 };
    else inp = { left: m.d < 0, right: m.d > 0, jumpP: f === m.jumpAt || f === m.djAt, jumpH: (f >= m.jumpAt && f < m.jumpAt + m.hold) || (m.djAt >= 0 && f >= m.djAt && f < m.djAt + 30), dashP: f === m.dashAt };
    stepBody(b, inp, DT, W);
    if (spikeHit(W, b)) return;
    if (b.y > room.h * T + 200) return;
    const ex = exitAt(room, b);
    if (ex) { out.exits.set(ex.to + ':' + ex.tx + ':' + ex.ty, ex); return; }
    const all = room.picks.concat(room.reward ? [room.reward] : []);
    for (const p of all) if (rectOv(b.x - 9, b.y - 42, 18, 42, p.x * T + 4, (p.y + 1) * T - 40, 24, 36)) out.picks.add(p.id);
    if (!b.ground) air = true;
    const settled = b.ground && (air || m.run);
    if (b.ground && (f % 6 === 0 || air) && f > 0) out.nodes.push({ x: b.x, y: b.y });
    if (b.ground && air) return;
    if (m.run && b.hitWall) { out.nodes.push({ x: b.x, y: b.y }); return; }
  }
}
function explore(startRoom, sx, sy, ab) {
  const seen = new Set(), rooms = new Set(), picks = new Set(), queue = [{ room: startRoom, x: sx, y: sy }];
  const keyOf = (r, x, y) => r + '|' + Math.floor(x / 20) + '|' + Math.round(y);
  seen.add(keyOf(startRoom, sx, sy));
  const ml = macros(ab);
  let steps = 0;
  while (queue.length) {
    const n = queue.shift(); rooms.add(n.room);
    const room = ROOMS[n.room];
    const out = { exits: new Map(), picks, nodes: [] };
    for (const m of ml) runMacro(room, n, m, ab, out);
    for (const nd of out.nodes) { const k = keyOf(n.room, nd.x, nd.y); if (!seen.has(k)) { seen.add(k); queue.push({ room: n.room, x: nd.x, y: nd.y }); } }
    for (const e of out.exits.values()) {
      const x = e.tx * T + T / 2, y = (e.ty + 1) * T, k = keyOf(e.to, x, y);
      if (!seen.has(k)) { seen.add(k); queue.push({ room: e.to, x, y }); }
    }
    steps++;
  }
  return { rooms, picks, nodes: seen.size };
}
const S = ROOMS[START.room];
const sets = [{ n: 'no abilities', ab: { dash: false, dj: false } }, { n: 'dash', ab: { dash: true, dj: false } }, { n: 'dash + double jump', ab: { dash: true, dj: true } }];
const res = [];
for (const s of sets) {
  const t0 = Date.now();
  const r = explore(START.room, START.tx * T + T / 2, (START.ty + 1) * T, s.ab);
  res.push(r);
  console.log('[' + s.n + '] rooms:', [...r.rooms].sort((a, b) => a.length - b.length || a.localeCompare(b)).join(' '), '| pickups:', [...r.picks].join(',') || '-', '| nodes', r.nodes, '|', ((Date.now() - t0) / 1000).toFixed(1) + 's');
}
const has = (r, ...ids) => ids.every(i => r.rooms.has(i));
const hasP = (r, ...ids) => ids.every(i => r.picks.has(i));
// expectations: the gates
if (!has(res[0], 'r1', 'r2', 'r3', 'r4', 'r5')) fail('start zone not fully reachable without abilities');
if (['r6', 'r7', 'r8', 'r9', 'r10', 'r11', 'r12'].some(i => res[0].rooms.has(i))) fail('dash gate leaks: later rooms reachable without dash');
if (!hasP(res[0], 'dash', 'core_r4')) fail('dash reward / hidden core not reachable in zone 0');
if (!has(res[1], 'r6', 'r7', 'r8')) fail('caverns not reachable with dash');
if (['r9', 'r10', 'r11', 'r12'].some(i => res[1].rooms.has(i))) fail('double-jump gate leaks: spires reachable without double jump');
if (!hasP(res[1], 'dj')) fail('double jump reward unreachable with dash');
if (res[1].picks.has('core_r7')) fail('core_r7 should require double jump');
if (!has(res[2], 'r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7', 'r8', 'r9', 'r10', 'r11', 'r12')) fail('not every room reachable with all abilities');
if (!hasP(res[2], 'dash', 'dj', 'edge', 'core_r4', 'core_r7', 'core_r9')) fail('some pickups unreachable with all abilities: ' + [...res[2].picks].join(','));

// ---- return trips (no one-way traps) ----
const back = [
  ['r4', 11, 2, 'r2', { dash: false, dj: false }], ['r5', 1, 13, 'r4', { dash: false, dj: false }],
  ['r6', 1, 13, 'r5', { dash: true, dj: false }], ['r8', 1, 13, 'r7', { dash: true, dj: false }],
  ['r7', 1, 13, 'r6', { dash: true, dj: false }], ['r9', 2, 8, 'r2', { dash: true, dj: true }],
  ['r10', 1, 13, 'r9', { dash: true, dj: true }], ['r12', 1, 10, 'r10', { dash: true, dj: true }], ['r11', 1, 13, 'r10', { dash: true, dj: true }],
  ['r2', 20, 13, 'r1', { dash: false, dj: false }], ['r3', 1, 13, 'r2', { dash: false, dj: false }],
];
for (const [rid, tx, ty, target, ab] of back) {
  const r = explore(rid, tx * T + T / 2, (ty + 1) * T, ab);
  if (!r.rooms.has(target)) fail('cannot return from ' + rid + ' to ' + target);
}
console.log(problems === 0 ? 'REACH OK' : problems + ' PROBLEM(S)');
process.exit(problems ? 1 : 0);
