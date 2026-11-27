'use strict';
/* ===== ASHEN HOLLOW - canvas, audio, save, input ===== */
const W = 960, H = 540;
const cv = document.getElementById('game');
const ctx = cv.getContext('2d');
let K = 1;
function fit() {
  const s = Math.min(innerWidth / W, innerHeight / H);
  cv.style.width = Math.floor(W * s) + 'px';
  cv.style.height = Math.floor(H * s) + 'px';
  K = Math.max(1, Math.min(1.6, s * (window.devicePixelRatio || 1)));
  cv.width = Math.round(W * K);
  cv.height = Math.round(H * K);
}
addEventListener('resize', fit);
fit();
const rnd = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const isTouch = ('ontouchstart' in window) || (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0);

/* ---------- audio (synthesized) ---------- */
let AC = null, NB = null, muted = false;
function audioInit() {
  try {
    if (!AC) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return;
      AC = new C();
      const len = AC.sampleRate >> 1;
      NB = AC.createBuffer(1, len, AC.sampleRate);
      const d = NB.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    if (AC.state === 'suspended') AC.resume();
  } catch (e) {}
}
function tone(f, d, type, vol, slide) {
  if (!AC || muted) return;
  try {
    const t = AC.currentTime, o = AC.createOscillator(), g = AC.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + d);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.05, t + Math.min(0.03, d / 3));
    g.gain.exponentialRampToValueAtTime(0.0005, t + d);
    o.connect(g); g.connect(AC.destination);
    o.start(t); o.stop(t + d + 0.03);
  } catch (e) {}
}
function noise(d, vol, fq, hp) {
  if (!AC || muted || !NB) return;
  try {
    const t = AC.currentTime, s = AC.createBufferSource(), g = AC.createGain(), f = AC.createBiquadFilter();
    s.buffer = NB; f.type = hp ? 'highpass' : 'lowpass'; f.frequency.value = fq || 2000;
    g.gain.setValueAtTime(vol || 0.1, t);
    g.gain.exponentialRampToValueAtTime(0.0005, t + d);
    s.connect(f); f.connect(g); g.connect(AC.destination);
    s.start(t); s.stop(t + d + 0.03);
  } catch (e) {}
}
const SFX = {
  swing: () => { noise(0.12, 0.07, 3000, true); tone(420, 0.1, 'triangle', 0.025, -200); },
  hit: () => { noise(0.1, 0.12, 1800); tone(180, 0.1, 'square', 0.04, -90); },
  clink: () => { tone(1400, 0.15, 'triangle', 0.05, -400); noise(0.06, 0.08, 4000, true); },
  jump: () => { tone(260, 0.12, 'sine', 0.04, 220); },
  djump: () => { tone(420, 0.16, 'sine', 0.045, 380); noise(0.1, 0.03, 5000, true); },
  dash: () => { noise(0.2, 0.09, 1500, true); tone(300, 0.18, 'sawtooth', 0.025, -200); },
  land: () => { noise(0.08, 0.05, 500); },
  hurt: () => { tone(120, 0.3, 'sawtooth', 0.08, -60); noise(0.2, 0.12, 900); },
  heal: () => { tone(520, 0.4, 'sine', 0.05, 300); tone(780, 0.5, 'sine', 0.03, 300); },
  pick: () => { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.7, 'sine', 0.05), i * 140)); },
  boss: () => { tone(55, 1.4, 'sawtooth', 0.12, -20); noise(1.0, 0.12, 300); },
  bosshit: () => { noise(0.14, 0.14, 1200); tone(110, 0.14, 'square', 0.05, -50); },
  boom: () => { noise(0.5, 0.2, 600); tone(60, 0.4, 'sawtooth', 0.1, -25); },
  die: () => { tone(160, 1.2, 'sawtooth', 0.07, -110); },
  bench: () => { tone(330, 1.2, 'sine', 0.04); tone(495, 1.4, 'sine', 0.03); },
  brk: () => { noise(0.3, 0.16, 900); },
  click: () => { tone(500, 0.05, 'triangle', 0.03); },
  door: () => { noise(0.4, 0.08, 400); tone(70, 0.4, 'sawtooth', 0.06, -20); },
  win: () => { [262, 330, 392, 523, 659].forEach((f, i) => setTimeout(() => tone(f, 1.2, 'sine', 0.05), i * 220)); },
};
function sfx(n) { try { SFX[n](); } catch (e) {} }
let mT = 0, mStep = 0, mBar = 0;
const MUSIC_MODES = [
  { root: 110, notes: [0,3,5,7,10,7,5,3], bass: [0,-5, -2,-7], wave: 'sine' },
  { root: 98, notes: [0,2,5,7,9,7,5,2], bass: [0,-3,-5,-2], wave: 'triangle' },
  { root: 82.4, notes: [0,3,4,7,8,7,4,3], bass: [0,-5,-3,-7], wave: 'sawtooth' },
  { root: 73.4, notes: [0,2,5,6,9,6,5,2], bass: [0,-2,-5,-7], wave: 'triangle' }
];
function music(dt, boss) {
  mT -= dt; if (mT > 0) return;
  const zone = G && G.room ? G.room.zone : 0, mode = MUSIC_MODES[zone] || MUSIC_MODES[0];
  mT = boss ? 0.24 : 0.48;
  if (!AC || muted) { mStep++; return; }
  const beat = mStep % 16, octave = boss ? 0.5 : 1;
  if (beat % 4 === 0) {
    const bass = mode.root * Math.pow(2, mode.bass[(beat >> 2) % 4] / 12) * octave;
    tone(bass, boss ? 0.42 : 0.78, boss ? 'sawtooth' : 'sine', boss ? 0.055 : 0.035, -4);
    if (beat === 0 || beat === 8) tone(bass * 2, 0.24, 'triangle', boss ? 0.025 : 0.012);
  }
  const step = mode.notes[(beat >> 1) % mode.notes.length];
  if (beat % 2 === 0) {
    const lead = mode.root * Math.pow(2, step / 12) * (boss ? 2 : 3.0);
    tone(lead, boss ? 0.18 : 0.42, boss ? 'square' : 'triangle', boss ? 0.026 : 0.014, beat % 8 === 6 ? -lead * 0.08 : 0);
  }
  if (!boss && (beat === 3 || beat === 11)) {
    const shimmer = mode.root * Math.pow(2, mode.notes[(beat + 3) % 8] / 12) * 6;
    tone(shimmer, 1.1, 'sine', 0.009);
  }
  if (boss && (beat % 4 === 2)) noise(0.09, 0.022, 420, true);
  if (beat === 15) { mBar++; if (!boss && mBar % 2 === 0) noise(0.16, 0.012, 700, true); }
  mStep++;
}

/* ---------- relics & waystones ---------- */
const CHARM_DEF = {
  soul: { name: 'Soul Lantern', mark: '✧', lore: 'Striking foes gathers 50% more Soul.', tint: '#9fe8e0' },
  reach: { name: 'Grave Needle', mark: '†', lore: 'Your nail reaches farther into the dark.', tint: '#d8d4ff' },
  ward: { name: 'Ashen Ward', mark: '◇', lore: 'A 1-in-4 chance to turn a hit aside.', tint: '#f4d39a' },
};
const STATION_NAMES = { r1:'Hollow Gate', r2:'Forgotten Crossroads', r4:'Mosswell', r5:'Sundered Chasm', r6:'Weeping Caverns', r8:'Drowned Chapel', r9:'Spire Ascent', r10:'Ember Hall', r11:'Hollow Throne', r12:"Duelist's Rest" };
/* ---------- save ---------- */
const SAVE_KEY = 'ashenhollow_save_v1';
function defaultSave() {
  return { started: false, room: START.room, bx: START.tx, by: START.ty, ab: { dash: false, dj: false, edge: false }, cores: 0, maxhp: 5, sword: 0,
    picks: {}, bosses: {}, broken: [], explored: { r1: 1 }, charms: [], equipped: [], stations: {}, deaths: 0, time: 0, muted: false, ended: false };
}
let save = defaultSave();
function loadSave() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (s && typeof s === 'object' && s.room && ROOMS[s.room]) { save = Object.assign(defaultSave(), s); save.ab = Object.assign({ dash: false, dj: false, edge: false }, s.ab || {}); save.charms = Array.isArray(s.charms) ? s.charms.filter(k => CHARM_DEF[k]) : []; save.equipped = Array.isArray(s.equipped) ? s.equipped.filter(k => save.charms.includes(k)).slice(0, 2) : []; save.stations = s.stations && typeof s.stations === 'object' ? s.stations : {}; }
  } catch (e) {}
  muted = !!save.muted;
}
function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) {} }
function hasSave() { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); return !!(s && s.started); } catch (e) { return false; } }

/* ---------- input ---------- */
const inp = { left: 0, right: 0, up: 0, down: 0, jump: 0, atk: 0, dash: 0, heal: 0 };
let pressed = {};
function setK(k, v) { if (v && !inp[k]) pressed[k] = true; inp[k] = v ? 1 : 0; }
const KM = {
  ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right',
  ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down',
  z: 'jump', Z: 'jump', ' ': 'jump', k: 'jump', K: 'jump',
  x: 'atk', X: 'atk', j: 'atk', J: 'atk',
  c: 'dash', C: 'dash', Shift: 'dash', l: 'dash', L: 'dash',
  v: 'heal', V: 'heal', h: 'heal', H: 'heal',
};
