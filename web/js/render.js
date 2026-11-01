// Meeple Meadows — renderer: camera, cached ground + deep-forest chunks, depth-sorted sprites,
// seasons, weather and lighting. Tuned for 10" Android tablets.
'use strict';

const CHUNK = 8;
const FMX = 48, FMT = 110;   // forest-cache margins (canopies overhang their tile)
const R = window.R = {
  ready: false, cv: null, ctx: null, W: 0, H: 0, pr: 1,
  cam: { x: CX * T, y: CY * T, z: 1.1 },
  chunks: {},
  parts: [], amb: [], wx: [], time: 0,
  ghost: null,      // {type, x, y, ok}
  clearMode: false,
  sel: null,        // {kind:'b'|'plot'|'m', id}
  q: { gs: 1, sway: true, lights: true, clouds: true, parts: 1, fireflies: true },
  dayNight: true, vg: null, season: 0,
};

const QUALITY = {
  low:    { gs: 0.7, fs: 0.7, pr: 1,   sway: false, lights: false, clouds: false, parts: 0.35, fireflies: false, art: 1.25, budget: 2 },
  medium: { gs: 1.0, fs: 1.0, pr: 1.5, sway: true,  lights: true,  clouds: false, parts: 0.7,  fireflies: true,  art: 1.6,  budget: 2 },
  high:   { gs: 1.4, fs: 1.25, pr: 2,  sway: true,  lights: true,  clouds: true,  parts: 1,    fireflies: true,  art: 2.0,  budget: 3 },
};

R.init = function (cv) {
  R.cv = cv; R.ctx = cv.getContext('2d', { alpha: false });
  R.resize();
  R.ready = true;
};
R.setQuality = function (name) {
  const q = QUALITY[name] || QUALITY.medium;
  R.q = q;
  ART.S = q.art;
  buildArt();
  R.groundDirtyAll();
  R.meepleSprites = {};
  R.resize();
};
R.resize = function () {
  const dpr = window.devicePixelRatio || 1;
  R.pr = Math.min(dpr, R.q.pr || 1.5);
  R.W = window.innerWidth; R.H = window.innerHeight;
  R.cv.width = Math.round(R.W * R.pr); R.cv.height = Math.round(R.H * R.pr);
  R.cv.style.width = R.W + 'px'; R.cv.style.height = R.H + 'px';
  // vignette is static: bake it once per size
  const v = R.vg = newCanvas(R.cv.width, R.cv.height), g = v.getContext('2d');
  const gr = g.createRadialGradient(v.width / 2, v.height / 2, Math.min(v.width, v.height) * 0.45, v.width / 2, v.height / 2, Math.max(v.width, v.height) * 0.75);
  gr.addColorStop(0, 'rgba(30,20,10,0)'); gr.addColorStop(1, 'rgba(30,20,10,0.28)');
  g.fillStyle = gr; g.fillRect(0, 0, v.width, v.height);
};
function markStale(cx, cy) { const c = R.chunks[cx + ',' + cy]; if (c) c.stale = true; }
R.groundDirty = function (i) {
  const x = i % MW, y = (i / MW) | 0;
  // blending reaches neighbours; a cleared tile can also turn trees below it into "edge" trees
  const seen = new Set();
  for (let dy = -1; dy <= 3; dy++) for (let dx = -1; dx <= 1; dx++) {
    const k = Math.floor((x + dx) / CHUNK) + ',' + Math.floor((y + dy) / CHUNK);
    if (!seen.has(k)) { seen.add(k); const [a, b] = k.split(','); markStale(+a, +b); }
  }
};
R.groundDirtyAll = function () { R.chunks = {}; };
R.restyleAll = function () { for (const k in R.chunks) R.chunks[k].stale = true; };

R.screenToWorld = function (sx, sy) {
  const z = R.cam.z;
  return { x: (sx - R.W / 2) / z + R.cam.x, y: (sy - R.H / 2) / z + R.cam.y };
};
R.worldToScreen = function (wx, wy) {
  const z = R.cam.z;
  return { x: (wx - R.cam.x) * z + R.W / 2, y: (wy - R.cam.y) * z + R.H / 2 };
};
R.clampCam = function () {
  const c = R.cam;
  c.z = Math.max(0.45, Math.min(2.6, c.z));
  c.x = Math.max(T * 2, Math.min(MW * T - T * 2, c.x));
  c.y = Math.max(T * 2, Math.min(MH * T - T * 2, c.y));
};

// ---------------------------------------------------------------- tile look helpers
function treeKind(i) {
  const x = i % MW, y = (i / MW) | 0, c = S.cover[i];
  const v = Math.floor(hash2(x, y, S.seed + 5) * 4);
  if (c === COVER.BRUSH) return ['bush', v];
  if (c === COVER.ROCK) return ['rock', v];
  const n = fbm(x * 0.12, y * 0.12, S.seed + 20);
  const fruitOk = hash2(x, y, S.seed + 8) < 0.45;
  const vv = v === 1 && !fruitOk ? (hash2(x, y, S.seed + 9) < 0.5 ? 0 : 2) : v;
  if (n > 0.52) return ['pine', vv];
  if (c === COVER.BIG) return ['bigoak', vv];
  if (hash2(x, y, S.seed + 7) < 0.24) return ['birch', vv];
  return ['oak', vv];
}
function jitter(i, k) { return (hash2(i, k, S.seed + 11) - 0.5); }
const isCov = (x, y) => !inMap(x, y) || S.cover[idx(x, y)] !== COVER.NONE;
// deep trees can never have anything dynamic behind them, so they live in the chunk cache
function isDeep(x, y) {
  for (let dy = 1; dy <= 3; dy++) for (let dx = -1; dx <= 1; dx++) if (!isCov(x + dx, y - dy)) return false;
  return isCov(x - 1, y) && isCov(x + 1, y);
}
function coverPos(i) {
  const [kind, v] = treeKind(i);
  return { kind, v, x: (i % MW) * T + T / 2 + jitter(i, 1) * 8, y: ((i / MW) | 0) * T + T * 0.82 + jitter(i, 2) * 5, big: kind === 'pine' && S.cover[i] === COVER.BIG ? 1.3 : 1 };
}

// ---------------------------------------------------------------- seasonal palettes
const GPAL = [
  { A: '#94d06c', B: '#72b850', C: '#bce47e', F: '#4a7a3a', flowers: ['#ffc8dc', '#ffffff', '#f29ac0', '#f2d23a'], fp: 0.4, tuft: ['#68a84a', '#b8e07a'], litter: ['#f6b8d0', '#fff4f8', '#68b04c'] },
  { A: '#8cc063', B: '#6fae4f', C: '#a6cf6e', F: '#3f6e3a', flowers: ['#ffffff', '#f2d23a', '#e87aa0', '#a87ae8'], fp: 0.22, tuft: ['#5f9a45', '#a8d070'], litter: ['#c8702a', '#8a6a2a', '#d8a040', '#4a7a3a'] },
  { A: '#b6b65c', B: '#8f9842', C: '#d4bc60', F: '#5a5228', flowers: ['#e8902a', '#f2c23a'], fp: 0.08, tuft: ['#9a9a40', '#d8c070'], litter: ['#e8902a', '#d8602a', '#f2b23a', '#b8302a'] },
  { A: '#e8eff4', B: '#cfdce6', C: '#ffffff', F: '#b4c2cc', flowers: [], fp: 0, tuft: ['#a89870', '#c8b890'], litter: ['#ffffff', '#dfe8ef'] },
];
const WATER_PAL = [['#4f9fc4', '#2f6f9a'], ['#4f9fc4', '#2f6f9a'], ['#4a8fb4', '#2a5f88'], ['#a8d4e6', '#7aaed0']];
const SAND = hexRgb('#cdbb86');

function renderGround(cx, cy) {
  const gs = R.q.gs, size = CHUNK * T, sea = R.season, P = GPAL[sea];
  const GA = hexRgb(P.A), GB = hexRgb(P.B), GC = hexRgb(P.C), FO = hexRgb(P.F);
  const WA = hexRgb(WATER_PAL[sea][0]), WD = hexRgb(WATER_PAL[sea][1]);
  const c = newCanvas(size * gs, size * gs), g = c.getContext('2d');
  const step = 4, n = size / step + 2;
  const lo = newCanvas(n, n), lg = lo.getContext('2d'), id = lg.createImageData(n, n);
  const ox = cx * size - step, oy = cy * size - step;
  // per-tile values sampled once, then blended per pixel
  const tw = CHUNK + 4, base = { x: cx * CHUNK - 2, y: cy * CHUNK - 2 };
  const tf = new Float32Array(tw * tw), tw2 = new Float32Array(tw * tw), ts = new Float32Array(tw * tw);
  for (let y = 0; y < tw; y++) for (let x = 0; x < tw; x++) {
    const X = base.x + x, Y = base.y + y, k = y * tw + x;
    if (!inMap(X, Y)) { tf[k] = 1; continue; }
    const i = idx(X, Y), cv = S.cover[i];
    tf[k] = cv && cv !== COVER.WATER ? 1 : 0; tw2[k] = cv === COVER.WATER ? 1 : 0; ts[k] = S.floor[i] ? 1 : 0;
  }
  const field = (tx, ty, arr) => {
    const fx = tx - 0.5 - base.x, fy = ty - 0.5 - base.y, x0 = Math.floor(fx), y0 = Math.floor(fy), ax = fx - x0, ay = fy - y0;
    const s = (x, y) => arr[Math.max(0, Math.min(tw - 1, y)) * tw + Math.max(0, Math.min(tw - 1, x))];
    return (s(x0, y0) * (1 - ax) + s(x0 + 1, y0) * ax) * (1 - ay) + (s(x0, y0 + 1) * (1 - ax) + s(x0 + 1, y0 + 1) * ax) * ay;
  };
  for (let py = 0; py < n; py++) for (let px = 0; px < n; px++) {
    const tx = (ox + px * step + step / 2) / T, ty = (oy + py * step + step / 2) / T;
    const nz = fbm(tx * 0.35, ty * 0.35, S.seed + 30, 3), nz2 = vnoise(tx * 1.7, ty * 1.7, S.seed + 31);
    let r = GA[0] + (GB[0] - GA[0]) * nz, gg = GA[1] + (GB[1] - GA[1]) * nz, b = GA[2] + (GB[2] - GA[2]) * nz;
    const hl = Math.max(0, nz2 - 0.62) * 1.6;
    r += (GC[0] - r) * hl; gg += (GC[1] - gg) * hl; b += (GC[2] - b) * hl;
    const fe = Math.min(1, Math.max(0, (field(tx, ty, tf) - 0.15) * 1.4)) * 0.85;
    r += (FO[0] - r) * fe; gg += (FO[1] - gg) * fe; b += (FO[2] - b) * fe;
    const so = field(tx, ty, ts) * 0.14;
    r += (150 - r) * so; gg += (120 - gg) * so; b += (70 - b) * so;
    const w = field(tx, ty, tw2);
    if (w > 0.25) {
      const sh = Math.min(1, (w - 0.25) * 4);
      if (w < 0.42) { const sd = sea === 3 ? [236, 242, 246] : SAND; r += (sd[0] - r) * sh; gg += (sd[1] - gg) * sh; b += (sd[2] - b) * sh; }
      else { const dp = Math.min(1, (w - 0.42) * 2.2); r = WA[0] + (WD[0] - WA[0]) * dp; gg = WA[1] + (WD[1] - WA[1]) * dp; b = WA[2] + (WD[2] - WA[2]) * dp; }
    }
    const grain = (hash2(px + cx * 999, py + cy * 777, 3) - 0.5) * 8;
    const k = (py * n + px) * 4;
    id.data[k] = r + grain; id.data[k + 1] = gg + grain; id.data[k + 2] = b + grain; id.data[k + 3] = 255;
  }
  lg.putImageData(id, 0, 0);
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  g.drawImage(lo, 1, 1, n - 2, n - 2, 0, 0, c.width, c.height);
  g.scale(gs, gs);
  g.lineCap = 'round'; g.lineJoin = 'round';
  for (let ty = 0; ty < CHUNK; ty++) for (let tx = 0; tx < CHUNK; tx++) {
    const X = cx * CHUNK + tx, Y = cy * CHUNK + ty; if (!inMap(X, Y)) continue;
    const i = idx(X, Y), x0 = tx * T, y0 = ty * T;
    const r = mulberry(i * 31 + S.seed);
    const cov = S.cover[i], fl = S.floor[i];
    if (cov === COVER.WATER) {
      if (sea === 3) { if (r() < 0.4) { g.strokeStyle = rgba('#ffffff', 0.7); g.lineWidth = 0.8; const lx = x0 + r() * T, ly = y0 + r() * T; g.beginPath(); g.moveTo(lx, ly); g.lineTo(lx + 8, ly + 3); g.lineTo(lx + 12, ly - 2); g.stroke(); } continue; }
      if (r() < 0.25) { const lx = x0 + 10 + r() * 28, ly = y0 + 10 + r() * 28; g.beginPath(); g.arc(lx, ly, 5, 0.4, Math.PI * 2 - 0.1); g.lineTo(lx, ly); g.closePath(); g.fillStyle = sea === 2 ? '#8a9a3a' : '#5aa84a'; g.fill(); g.strokeStyle = rgba('#2a5a2a', 0.7); g.lineWidth = 0.6; g.stroke(); if (sea < 2 && r() < 0.4) { for (let k = 0; k < 5; k++) { const a = k / 5 * 6.28; ell(g, lx + 1 + Math.cos(a) * 1.4, ly - 1 + Math.sin(a) * 1.4, 1.2, 1.2, '#ffd0e0'); } ell(g, lx + 1, ly - 1, 0.8, 0.8, '#f2c23a'); } }
      continue;
    }
    if (fl === FLOOR.PATH) { drawPathTile(g, X, Y, x0, y0, r, sea); continue; }
    if (fl === FLOOR.PLOT) { drawPlotTile(g, X, Y, x0, y0, r, sea); continue; }
    if (cov) {
      for (let k = 0; k < 6; k++) ell(g, x0 + r() * T, y0 + r() * T, 2.2, 1.2, rgba(P.litter[k % P.litter.length], 0.55));
      continue;
    }
    const tufts = (sea === 3 ? 1 : 3) + Math.floor(r() * 4);
    for (let k = 0; k < tufts; k++) {
      const gx = x0 + r() * T, gy = y0 + r() * T, col = P.tuft[r() < 0.5 ? 0 : 1];
      g.strokeStyle = rgba(col, 0.8); g.lineWidth = 1;
      for (let b = -1; b <= 1; b++) { g.beginPath(); g.moveTo(gx + b * 1.5, gy); g.quadraticCurveTo(gx + b * 2, gy - 3, gx + b * 3.2, gy - 5 - r() * 2); g.stroke(); }
    }
    if (r() < P.fp) { const fx = x0 + 6 + r() * 36, fy = y0 + 6 + r() * 36, col = P.flowers[Math.floor(r() * P.flowers.length)]; for (let k = 0; k < 5; k++) { const a = k / 5 * 6.28; ell(g, fx + Math.cos(a) * 1.5, fy + Math.sin(a) * 1.5, 1.2, 1.2, col); } ell(g, fx, fy, 0.8, 0.8, '#f2a23a'); }
    if (sea === 2 && r() < 0.5) for (let k = 0; k < 3; k++) ell(g, x0 + r() * T, y0 + r() * T, 2, 1.1, rgba(P.litter[k % 4], 0.7));
    if (r() < 0.12) ell(g, x0 + r() * T, y0 + r() * T, 2.2, 1.5, sea === 3 ? '#c8d0d8' : '#b8b0a2', rgba(INK, 0.4), 0.5);
    if (sea !== 3 && r() < 0.08) { const cx2 = x0 + 10 + r() * 28, cy2 = y0 + 10 + r() * 28; for (let k = 0; k < 3; k++) { const a = k / 3 * 6.28 + 0.5; ell(g, cx2 + Math.cos(a) * 1.8, cy2 + Math.sin(a) * 1.8, 1.7, 1.7, '#4f9a3a'); } }
  }
  return c;
}
function drawPathTile(g, X, Y, x0, y0, r, sea) {
  const isP = (x, y) => inMap(x, y) && S.floor[idx(x, y)] === FLOOR.PATH;
  const e = 6;
  const L = isP(X - 1, Y) ? 0 : e, Rr = isP(X + 1, Y) ? 0 : e, U = isP(X, Y - 1) ? 0 : e, D = isP(X, Y + 1) ? 0 : e;
  rrect(g, x0 + L - (L ? 0 : 1), y0 + U - (U ? 0 : 1), T - L - Rr + (L ? 0 : 1) + (Rr ? 0 : 1), T - U - D + (U ? 0 : 1) + (D ? 0 : 1), 6);
  g.fillStyle = sea === 3 ? '#d8dde0' : '#c9b48a'; g.fill();
  for (let k = 0; k < 9; k++) {
    const sx = x0 + L + 4 + ((k % 3) + r() * 0.4) * (T - L - Rr - 8) / 3, sy = y0 + U + 4 + (Math.floor(k / 3) + r() * 0.4) * (T - U - D - 8) / 3;
    const w = 7 + r() * 5, h = 5 + r() * 4;
    rrect(g, sx, sy, w, h, 2.5); g.fillStyle = shade('#b8b0a2', (r() - 0.5) * 0.3); g.fill(); g.strokeStyle = rgba(INK, 0.45); g.lineWidth = 0.6; g.stroke();
    g.fillStyle = rgba('#ffffff', sea === 3 ? 0.7 : 0.25); g.fillRect(sx + 1.5, sy + 1, w * 0.5, sea === 3 ? 1.8 : 1);
  }
}
function drawPlotTile(g, X, Y, x0, y0, r, sea) {
  rrect(g, x0 + 2, y0 + 3, T - 4, T - 4, 5); g.fillStyle = rgba('#2a1a0a', 0.25); g.fill();
  rrect(g, x0 + 2, y0 + 2, T - 4, T - 4, 5); g.fillStyle = '#9a6a3a'; g.fill(); g.strokeStyle = INK; g.lineWidth = 0.9; g.stroke();
  rrect(g, x0 + 5, y0 + 5, T - 10, T - 10, 3);
  g.fillStyle = lgrad(g, x0, y0, x0, y0 + T, ['#7a5232', '#6a4426', '#5a3820']); g.fill();
  g.strokeStyle = rgba('#3a2412', 0.55); g.lineWidth = 1.2;
  for (let k = 0; k < 4; k++) { const yy = y0 + 10 + k * 9; g.beginPath(); g.moveTo(x0 + 8, yy); g.quadraticCurveTo(x0 + T / 2, yy + 1.5, x0 + T - 8, yy); g.stroke(); }
  g.strokeStyle = rgba('#a87a4a', 0.5); g.lineWidth = 0.8;
  for (let k = 0; k < 4; k++) { const yy = y0 + 8 + k * 9; g.beginPath(); g.moveTo(x0 + 8, yy); g.quadraticCurveTo(x0 + T / 2, yy + 1.5, x0 + T - 8, yy); g.stroke(); }
  for (let k = 0; k < 5; k++) ell(g, x0 + 8 + r() * 32, y0 + 8 + r() * 32, 0.9, 0.7, '#b8a080');
  if (sea === 3 && !(S.plots[idx(X, Y)] && S.plots[idx(X, Y)].gh)) { g.fillStyle = rgba('#ffffff', 0.85); for (let k = 0; k < 7; k++) { rrect(g, x0 + 2 + r() * (T - 10), y0 + 1 + (k % 2) * (T - 5), 6 + r() * 6, 3, 1.5); g.fill(); } }
}
function renderForest(cx, cy) {
  const fs = R.q.fs, size = CHUNK * T;
  let c = null, g = null;
  for (let ty = 0; ty < CHUNK; ty++) for (let tx = 0; tx < CHUNK; tx++) {
    const X = cx * CHUNK + tx, Y = cy * CHUNK + ty; if (!inMap(X, Y)) continue;
    const i = idx(X, Y), cov = S.cover[i];
    if (!cov || cov === COVER.WATER || !isDeep(X, Y)) continue;
    if (!c) { c = newCanvas((size + FMX * 2) * fs, (size + FMT) * fs); g = c.getContext('2d'); g.scale(fs, fs); g.translate(FMX - cx * size, FMT - cy * size); }
    const p = coverPos(i);
    ell(g, p.x + 4, p.y - 2, (p.kind === 'bush' || p.kind === 'rock' ? 20 : 24) * p.big, 8 * p.big, 'rgba(20,40,15,0.28)');
    drawSprite(g, treeSprite(p.kind, p.v, R.season), p.x, p.y, p.big);
  }
  return c;
}
function chunkAt(cx, cy, canRender) {
  const k = cx + ',' + cy;
  let c = R.chunks[k];
  if ((!c || c.stale) && canRender) { c = R.chunks[k] = { g: renderGround(cx, cy), f: renderForest(cx, cy), stale: false }; R._budget--; }
  return c;
}

// ---------------------------------------------------------------- particles & events
function addPart(p) { if (R.parts.length < 400 * R.q.parts + 40) R.parts.push(Object.assign({ life: 0, vx: 0, vy: 0, rot: 0, vr: 0, g: 0 }, p)); }
const tileC = i => ({ x: (i % MW) * T + T / 2, y: ((i / MW) | 0) * T + T / 2 });
R.onEvent = function (e) {
  const pq = R.q.parts;
  switch (e.t) {
    case 'clear': {
      const { x, y } = tileC(e.i);
      const cols = e.kind === COVER.ROCK ? ['#9aa0a6', '#c8c0b0', '#6a9a4a'] : ['#5aa84a', '#3e8a3a', '#a87a4a', '#e8902a'];
      for (let k = 0; k < 26 * pq + 6; k++) addPart({ type: 'chip', x: x + (Math.random() - 0.5) * 20, y: y - 10 - Math.random() * 30, vx: (Math.random() - 0.5) * 140, vy: -60 - Math.random() * 120, g: 320, max: 0.9 + Math.random() * 0.5, col: cols[k % cols.length], size: 2 + Math.random() * 3, vr: (Math.random() - 0.5) * 12 });
      for (let k = 0; k < 6; k++) addPart({ type: 'poof', x: x + (Math.random() - 0.5) * 30, y: y - Math.random() * 20, max: 0.7, size: 10 + Math.random() * 10 });
      AUDIO.sfx(e.kind === COVER.ROCK ? 'rock' : 'chop');
      break;
    }
    case 'build': for (let k = 0; k < 10; k++) addPart({ type: 'poof', x: e.x * T + (Math.random() - 0.5) * 50, y: e.y * T + (Math.random() - 0.5) * 30, max: 0.8, size: 12 + Math.random() * 12 }); AUDIO.sfx('build'); break;
    case 'harvest': {
      const { x, y } = tileC(e.i);
      addPart({ type: 'float', x, y: y - 20, vy: -28, max: 1.2, icon: e.crop, text: '+' + e.n });
      for (let k = 0; k < 8 * pq; k++) addPart({ type: 'chip', x, y: y - 6, vx: (Math.random() - 0.5) * 80, vy: -50 - Math.random() * 60, g: 260, max: 0.6, col: CROP[e.crop].leaf, size: 2, vr: 8 });
      AUDIO.sfx('pop'); break;
    }
    case 'plant': { const { x, y } = tileC(e.i); for (let k = 0; k < 5 * pq; k++) addPart({ type: 'chip', x, y, vx: (Math.random() - 0.5) * 50, vy: -30 - Math.random() * 30, g: 200, max: 0.5, col: '#7a5232', size: 1.8 }); break; }
    case 'water': { const { x, y } = tileC(e.i); for (let k = 0; k < 12 * pq + 3; k++) addPart({ type: 'drop', x: x + (Math.random() - 0.5) * 30, y: y - 18 - Math.random() * 6, vx: (Math.random() - 0.5) * 30, vy: 10 + Math.random() * 20, g: 300, max: 0.45, size: 1.4 }); AUDIO.sfx('water'); break; }
    case 'fill': for (let k = 0; k < 8 * pq + 2; k++) addPart({ type: 'drop', x: e.x + (Math.random() - 0.5) * 10, y: e.y - 20, vx: (Math.random() - 0.5) * 60, vy: -60 - Math.random() * 40, g: 300, max: 0.6, size: 1.6 }); AUDIO.sfx('splash'); break;
    case 'ripe': { const { x, y } = tileC(e.i); if (Math.random() < pq) addPart({ type: 'spark', x: x + (Math.random() - 0.5) * 20, y: y - 14, max: 0.8, size: 5 }); break; }
    case 'deposit': AUDIO.sfx('drop'); break;
    case 'crafted': { const b = BMAP[e.b]; if (b) { const d = BUILDINGS[b.type]; for (let k = 0; k < 10; k++) addPart({ type: 'spark', x: (b.x + d.w / 2) * T + (Math.random() - 0.5) * 40, y: b.y * T - Math.random() * 40, max: 1, size: 5 }); } AUDIO.sfx('ding'); break; }
    case 'meeple': { const m = e.m; for (let k = 0; k < 18; k++) addPart({ type: 'spark', x: m.x + (Math.random() - 0.5) * 40, y: m.y - 10 - Math.random() * 30, max: 1.2, size: 6 }); for (let k = 0; k < 6; k++) addPart({ type: 'poof', x: m.x, y: m.y - 8, max: 0.7, size: 14 }); AUDIO.sfx('meeple'); break; }
    case 'sold': AUDIO.sfx('coin'); break;
    case 'season': R.season = e.sea; R.restyleAll(); break;
  }
};

// ---------------------------------------------------------------- drawing
function sunInfo() {
  if (!R.dayNight) return { night: 0, dusk: 0 };
  const sun = Math.sin((S.day - 0.25) * Math.PI * 2);
  return { night: Math.min(1, Math.max(0, (0.12 - sun) / 0.5)), dusk: Math.exp(-Math.pow(sun / 0.22, 2)), sun };
}
const ghOpen = b => !!R.sel && ((R.sel.kind === 'b' && R.sel.id === b.id) || (R.sel.kind === 'plot' && S.plots[R.sel.id] && S.plots[R.sel.id].gh === b.id));

R.draw = function (dt) {
  const ctx = R.ctx, cam = R.cam, z = cam.z, pr = R.pr;
  R.time += dt;
  const t = R.time;
  if (R.season !== seasonIdx()) { R.season = seasonIdx(); R.restyleAll(); }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = R.season === 3 ? '#6a7a80' : '#284a2a'; ctx.fillRect(0, 0, R.cv.width, R.cv.height);
  const k = z * pr;
  ctx.setTransform(k, 0, 0, k, (R.W / 2 - cam.x * z) * pr, (R.H / 2 - cam.y * z) * pr);
  const vw = R.W / z, vh = R.H / z;
  const x0 = cam.x - vw / 2, y0 = cam.y - vh / 2, x1 = x0 + vw, y1 = y0 + vh;

  // ground + cached deep forest. Missing chunks render a few per frame (smooth season changes).
  R._budget = R.q.budget;
  const size = CHUNK * T, ncx = Math.ceil(MW / CHUNK) - 1, ncy = Math.ceil(MH / CHUNK) - 1;
  const cy0 = Math.max(0, Math.floor(y0 / size)), cy1 = Math.min(ncy, Math.floor((y1 + FMT) / size));
  const cx0 = Math.max(0, Math.floor((x0 - FMX) / size)), cx1 = Math.min(ncx, Math.floor((x1 + FMX) / size));
  const vis = [];
  for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) {
    const c = chunkAt(cx, cy, R._budget > 0 || !R.chunks[cx + ',' + cy] && R._budget > -6);
    vis.push([cx, cy, c]);
    if (c) ctx.drawImage(c.g, cx * size, cy * size, size + 0.5, size + 0.5);
    else { ctx.fillStyle = GPAL[R.season].B; ctx.fillRect(cx * size, cy * size, size, size); }
  }

  const tx0 = Math.max(0, Math.floor(x0 / T) - 2), ty0 = Math.max(0, Math.floor(y0 / T) - 1);
  const tx1 = Math.min(MW - 1, Math.ceil(x1 / T) + 2), ty1 = Math.min(MH - 1, Math.ceil(y1 / T) + 3);

  // water shimmer
  if (R.season !== 3) {
    ctx.lineCap = 'round'; ctx.lineWidth = 1.4;
    for (let y = ty0; y <= ty1; y++) for (let x = tx0; x <= tx1; x++) {
      if (S.cover[idx(x, y)] !== COVER.WATER) continue;
      const a = (Math.sin(t * 0.8 + hash2(x, y, 1) * 6) + 1) / 2;
      ctx.strokeStyle = rgba('#e8fbff', 0.35 * a);
      const wx = x * T + 10 + hash2(x, y, 2) * 24, wy = y * T + 12 + hash2(x, y, 3) * 24;
      ctx.beginPath(); ctx.moveTo(wx - 6 - a * 3, wy); ctx.quadraticCurveTo(wx, wy - 2, wx + 6 + a * 3, wy); ctx.stroke();
    }
  }
  // wet soil
  ctx.fillStyle = 'rgba(40,24,10,0.32)';
  for (const key in S.plots) {
    const p = S.plots[key]; if (!p.wet) continue;
    const i = +key, px = (i % MW) * T, py = ((i / MW) | 0) * T;
    if (px < x0 - T || px > x1 || py < y0 - T || py > y1) continue;
    rrect(ctx, px + 5, py + 5, T - 10, T - 10, 3); ctx.fill();
  }

  if (R.clearMode) drawClearHints(ctx, tx0, ty0, tx1, ty1);
  if (R.sel && R.sel.kind === 'plot') { const px = (R.sel.id % MW) * T, py = ((R.sel.id / MW) | 0) * T; selRing(ctx, px + T / 2, py + T / 2, T * 0.62, T * 0.5); }
  if (R.sel && R.sel.kind === 'b' && BMAP[R.sel.id]) { const b = BMAP[R.sel.id], d = BUILDINGS[b.type]; selRing(ctx, (b.x + d.w / 2) * T, (b.y + d.h / 2) * T, d.w * T * 0.62, d.h * T * 0.5); }

  // deep forest layer
  for (const [cx, cy, c] of vis) if (c && c.f) ctx.drawImage(c.f, cx * size - FMX, cy * size - FMT, size + FMX * 2, size + FMT);

  // dynamic drawables, depth sorted
  const list = [];
  for (let y = ty0; y <= ty1; y++) for (let x = tx0; x <= tx1; x++) {
    const i = idx(x, y), c = S.cover[i];
    if (c && c !== COVER.WATER) { if (!isDeep(x, y)) list.push({ y: y * T + T * 0.8, k: 0, i }); }
    else if (S.floor[i] === FLOOR.PLOT) list.push({ y: y * T + T * 0.55, k: 1, i });
  }
  for (const b of S.buildings) {
    const d = BUILDINGS[b.type];
    if ((b.x + d.w) * T < x0 - T || b.x * T > x1 + T || (b.y + d.h) * T < y0 - T || b.y * T > y1 + 160) continue;
    list.push({ y: (b.y + d.h) * T - 2, k: 2, b });
  }
  for (const m of S.meeples) if (m.x > x0 - T && m.x < x1 + T && m.y > y0 - T && m.y < y1 + T * 2) list.push({ y: m.y + 6, k: 3, m });
  list.sort((a, b) => a.y - b.y);

  const wind = Math.sin(t * 0.6) * 0.5 + Math.sin(t * 1.7) * 0.2;
  const sway = R.q.sway && z > 0.7;
  for (const o of list) {
    if (o.k === 0) drawCover(ctx, o.i, t, wind, sway);
    else if (o.k === 1) drawPlot(ctx, o.i, t, wind, sway);
    else if (o.k === 2) drawBuilding(ctx, o.b, t, dt);
    else drawMeeple(ctx, o.m, t);
  }

  drawParticles(ctx, dt);
  drawAmbient(ctx, dt, x0, y0, x1, y1);
  for (const b of S.buildings) if (BUILDINGS[b.type].proc || b.type === 'creator') drawStatus(ctx, b, t);
  if (R.ghost) drawGhost(ctx);

  // lighting & weather (screen space)
  const sun = sunInfo();
  if (R.q.clouds) drawClouds(ctx, x0, y0, x1, y1, t, sun);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const raining = S.weather && S.weather.rain > 0;
  if (raining) { ctx.fillStyle = 'rgba(40,60,90,0.16)'; ctx.fillRect(0, 0, R.cv.width, R.cv.height); }
  if (sun.dusk > 0.02) { ctx.fillStyle = `rgba(255,140,70,${0.13 * sun.dusk})`; ctx.fillRect(0, 0, R.cv.width, R.cv.height); }
  if (sun.night > 0.01) {
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = mix('#ffffff', '#3a4a8f', sun.night * 0.72);
    ctx.fillRect(0, 0, R.cv.width, R.cv.height);
    ctx.globalCompositeOperation = 'source-over';
    if (R.q.lights) drawLights(ctx, sun.night, t);
  }
  drawWeather(ctx, dt, raining);
  ctx.drawImage(R.vg, 0, 0);
};

function selRing(ctx, x, y, rx, ry) {
  ctx.save();
  ctx.setLineDash([6, 5]); ctx.lineDashOffset = -R.time * 20;
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,248,220,0.95)'; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.restore();
}
function drawClearHints(ctx, tx0, ty0, tx1, ty1) {
  ctx.save();
  for (let y = ty0; y <= ty1; y++) for (let x = tx0; x <= tx1; x++) {
    const i = idx(x, y); if (!canClear(i)) continue;
    const ok = S.coins >= clearCost(i), px = x * T + T / 2, py = y * T + T / 2;
    ctx.beginPath(); ctx.ellipse(px, py + 6, 20, 13, 0, 0, Math.PI * 2);
    ctx.fillStyle = ok ? 'rgba(255,240,170,0.35)' : 'rgba(200,60,40,0.25)'; ctx.fill();
    ctx.setLineDash([4, 3]); ctx.strokeStyle = ok ? 'rgba(255,250,220,0.9)' : 'rgba(255,180,160,0.7)'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.setLineDash([]);
  }
  ctx.restore();
}
function drawCoverLabels(ctx, tx0, ty0, tx1, ty1) {
  ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (let y = ty0; y <= ty1; y++) for (let x = tx0; x <= tx1; x++) {
    const i = idx(x, y); if (!canClear(i)) continue;
    const c = clearCost(i), ok = S.coins >= c, px = x * T + T / 2, py = y * T + T * 0.8;
    const s = fmt(c), w = ctx.measureText(s).width + 16;
    rrect(ctx, px - w / 2, py - 8, w, 16, 8); ctx.fillStyle = ok ? 'rgba(255,248,225,0.95)' : 'rgba(80,40,30,0.85)'; ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.stroke();
    drawSprite(ctx, ART.icons.ui_coin, px - w / 2 + 2, py - 6, 0.38);
    ctx.fillStyle = ok ? '#4a3020' : '#ffd0c0'; ctx.fillText(s, px + 4, py + 0.5);
  }
}
function drawCover(ctx, i, t, wind, sway) {
  const p = coverPos(i), s = treeSprite(p.kind, p.v, R.season);
  ell(ctx, p.x + 4, p.y - 2, (p.kind === 'bush' || p.kind === 'rock' ? 20 : 24) * p.big, 8 * p.big, 'rgba(20,40,15,0.28)');
  if (sway && p.kind !== 'rock') {
    const sw = (wind + Math.sin(t * 1.3 + i * 0.7) * 0.25) * (p.kind === 'bush' ? 0.03 : 0.045);
    ctx.save(); ctx.translate(p.x, p.y); ctx.transform(1, 0, sw, 1, 0, 0); drawSprite(ctx, s, 0, 0, p.big); ctx.restore();
  } else drawSprite(ctx, s, p.x, p.y, p.big);
}
function drawPlot(ctx, i, t, wind, sway) {
  const p = S.plots[i]; if (!p) return;
  const x = (i % MW) * T + T / 2, y = ((i / MW) | 0) * T + T / 2;
  const live = plotInSeason(p);
  if (p.st === 0) { ctx.globalAlpha = live ? 0.75 : 0.35; drawSprite(ctx, ART.icons[p.crop], x - 8, y - 8, 0.5); ctx.globalAlpha = 1; return; }
  const f = p.t / CROP[p.crop].grow;
  const stage = p.st === 2 ? 3 : (f < 0.15 ? 0 : f < 0.35 ? 1 : 2);
  const s = plantSprite(p.crop, stage);
  if (!live) ctx.globalAlpha = 0.55;
  if (sway && live && stage >= 2) {
    const sw = (wind * 0.06 + Math.sin(t * 2 + i) * 0.02);
    ctx.save(); ctx.translate(x, y + 18); ctx.transform(1, 0, sw, 1, 0, 0); drawSprite(ctx, s, 0, -18); ctx.restore();
  } else drawSprite(ctx, s, x, y);
  ctx.globalAlpha = 1;
  if (!live) { // dormant until its season comes back
    ctx.beginPath(); ctx.arc(x + 13, y - 13, 7, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,250,235,0.92)'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 0.8; ctx.stroke();
    ctx.fillStyle = '#6a4a32'; ctx.fillRect(x + 10, y - 16.5, 2, 7); ctx.fillRect(x + 14, y - 16.5, 2, 7);
  } else if (p.st === 2) {
    ctx.globalAlpha = 0.6 * (0.5 + 0.5 * Math.sin(t * 4 + i)); drawSprite(ctx, ART.icons.ui_star, x + 10, y - 26, 0.28); ctx.globalAlpha = 1;
  }
}
function drawBuilding(ctx, b, t, dt) {
  const d = BUILDINGS[b.type];
  const bx = (b.x + d.w / 2) * T, by = (b.y + d.h) * T;
  if (b.type === 'greenhouse') { drawSprite(ctx, greenhouseSprite(ghOpen(b)), bx, by); return; }
  const s = buildingSprite(b.type);
  const working = b.phase === 'work' || (b.type === 'creator' && b.queue.length);
  ell(ctx, bx + 3, by - d.h * T * 0.4, d.w * T * 0.5, d.h * T * 0.3, 'rgba(20,40,15,0.24)');
  drawSprite(ctx, s, bx, by);
  const pq = R.q.parts;
  switch (b.type) {
    case 'mill': b._rot = (b._rot || 0) + (working ? 2.6 : 0.35) * dt; drawSails(ctx, bx, by - 86, b._rot); break;
    case 'pot':
      flame(ctx, bx, by - 30, t, working ? 1.2 : 0.55);
      if (working) {
        const col = (GOOD[RECIPE[b.recipe].out[0]].icon.c) || '#c8a050';
        ctx.beginPath(); ctx.ellipse(bx, by - 60, 25, 6, 0, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill();
        for (let k = 0; k < 4; k++) { const ph = (t * 1.5 + k * 0.6) % 1; ell(ctx, bx - 14 + k * 9, by - 60, 2 + ph * 2.5, 1 + ph, rgba(shade(col, 0.4), 1 - ph)); }
        if (Math.random() < 0.08 * pq) addPart({ type: 'steam', x: bx + (Math.random() - 0.5) * 30, y: by - 66, vy: -18, vx: (Math.random() - 0.5) * 6, max: 2, size: 6 });
      }
      break;
    case 'kettle':
      flame(ctx, bx - 8, by - 12, t, working ? 0.8 : 0.3);
      if (Math.random() < 0.03 * pq) addPart({ type: 'smoke', x: bx + 9, y: by - 94, vy: -16, vx: 5, max: 3, size: 6 });
      if (working && Math.random() < 0.08 * pq) addPart({ type: 'steam', x: bx - 10 + (Math.random() - 0.5) * 16, y: by - 74, vy: -16, max: 1.6, size: 5 });
      break;
    case 'oven':
      flame(ctx, bx - 5, by - 12, t, working ? 0.9 : 0.35);
      if (Math.random() < (working ? 0.06 : 0.02) * pq) addPart({ type: 'smoke', x: bx + 12, y: by - 88, vy: -16, vx: 4, max: 3, size: 6 });
      break;
    case 'teahouse':
      if (working && Math.random() < 0.06 * pq) addPart({ type: 'steam', x: bx + (Math.random() - 0.5) * 8, y: by - 112, vy: -14, max: 1.6, size: 4 });
      break;
    case 'still':
      flame(ctx, bx - 18, by - 12, t, working ? 0.8 : 0.25);
      if (working) {
        if (Math.random() < 0.06 * pq) addPart({ type: 'steam', x: bx + 29 + (Math.random() - 0.5) * 16, y: by - 66, vy: -14, max: 1.8, size: 5 });
        const ph = (t * 1.3) % 1; ell(ctx, bx + 46, by - 20 + ph * 6, 1.1, 1.6, rgba('#d8f0ff', 1 - ph));
      }
      break;
    case 'juicer': case 'press':
      if (working) { const ph = (t * 1.6) % 1; ell(ctx, bx + (b.type === 'juicer' ? 22 : -4), by - (b.type === 'juicer' ? 20 : 26) + ph * 6, 1.2, 1.7, rgba(b.type === 'press' ? '#f2d24a' : '#f8a040', 1 - ph)); }
      break;
    case 'loom':
      if (working) { const sx = Math.sin(t * 4) * 18; rrect(ctx, bx + sx - 4, by - 44, 8, 3, 1.5); ctx.fillStyle = '#c8945a'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 0.6; ctx.stroke(); }
      break;
    case 'barrel': case 'crock': case 'dryer':
      if (working) { const ph = (t * 0.7 + b.id) % 1; ell(ctx, bx + 8, by - (b.type === 'barrel' ? 52 : 62) - ph * 10, 1.8, 1.8, rgba('#fffaf0', 0.8 * (1 - ph))); }
      break;
    case 'creator':
      if (working) {
        const a = 0.5 + 0.5 * Math.sin(t * 5);
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const gr = ctx.createRadialGradient(bx, by - 26, 2, bx, by - 26, 34); gr.addColorStop(0, `rgba(255,220,120,${0.55 * a})`); gr.addColorStop(1, 'rgba(255,200,80,0)');
        ctx.fillStyle = gr; ctx.fillRect(bx - 40, by - 70, 80, 80); ctx.restore();
        if (Math.random() < 0.15 * pq) addPart({ type: 'spark', x: bx + 30 + (Math.random() - 0.5) * 8, y: by - 112, vy: -30, max: 1, size: 4 });
      }
      break;
  }
}
function drawSails(ctx, x, y, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  for (let k = 0; k < 4; k++) {
    ctx.save(); ctx.rotate(k * Math.PI / 2);
    ctx.fillStyle = '#6a4228'; ctx.fillRect(-1.6, -50, 3.2, 50);
    ctx.beginPath(); ctx.rect(2, -48, 13, 38); ctx.fillStyle = 'rgba(250,240,215,0.95)'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.stroke();
    ctx.strokeStyle = 'rgba(106,66,40,0.8)'; ctx.lineWidth = 0.8;
    for (let yy = -44; yy < -10; yy += 6.5) { ctx.beginPath(); ctx.moveTo(2, yy); ctx.lineTo(15, yy); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(8.5, -48); ctx.lineTo(8.5, -10); ctx.stroke();
    ctx.restore();
  }
  ell(ctx, 0, 0, 4.5, 4.5, '#5a3a22', INK, 1);
  ctx.restore();
}
function flame(ctx, x, y, t, s) {
  if (s <= 0) return;
  for (let k = 0; k < 3; k++) {
    const f = Math.sin(t * 13 + k * 2) * 0.15 + 0.85, h = (14 - k * 4) * s * f, w = (7 - k * 2) * s;
    ctx.beginPath(); ctx.moveTo(x - w, y); ctx.quadraticCurveTo(x - w, y - h * 0.6, x + Math.sin(t * 9 + k) * 2, y - h); ctx.quadraticCurveTo(x + w, y - h * 0.6, x + w, y); ctx.closePath();
    ctx.fillStyle = ['#ff7a1a', '#ffb02a', '#fff2a0'][k]; ctx.fill();
  }
}
function drawMeeple(ctx, m, t) {
  let spr = R.meepleSprites[m.col];
  if (!spr) spr = R.meepleSprites[m.col] = meepleSprite(m.col);
  const moving = m.moving;
  const bob = moving ? Math.abs(Math.sin(m.bob * 11)) * 3.2 : (m.act > 0 ? Math.abs(Math.sin(m.bob * 14)) * 2 : Math.sin(m.bob * 2) * 0.6);
  const tilt = moving ? Math.sin(m.bob * 11) * 0.09 : 0;
  ell(ctx, m.x, m.y + 2, 9 - bob * 0.5, 3.5, 'rgba(20,30,10,0.3)');
  ctx.save(); ctx.translate(m.x, m.y + 2 - bob); ctx.rotate(tilt);
  const sq = moving ? 1 + Math.sin(m.bob * 22) * 0.03 : 1;
  ctx.scale(m.face / sq, sq);
  drawSprite(ctx, spr, 0, 0);
  ctx.scale(m.face, 1);
  if (m.crop !== 'founder') drawSprite(ctx, ART.icons[m.crop], -6, -33, 0.38);
  else { ctx.beginPath(); ctx.ellipse(0, -22.5, 6, 1.6, 0, 0, Math.PI * 2); ctx.fillStyle = '#c8a040'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 0.6; ctx.stroke(); ctx.beginPath(); ctx.ellipse(0, -24, 3.6, 2.6, 0, Math.PI, 0); ctx.fill(); ctx.stroke(); }
  // watering can in hand while on watering duty
  if (m.task && (m.task.type === 'water' || m.task.type === 'fill')) {
    ctx.save(); ctx.translate(9, -10); if (m.task.type === 'water' && m.act > 0) ctx.rotate(0.6);
    drawSprite(ctx, ART.icons.ui_can, -6, -6, 0.4); ctx.restore();
  }
  ctx.restore();
  if (m.hand.length) {
    const n = Math.min(m.hand.length, 4);
    for (let k = 0; k < n; k++) drawSprite(ctx, ART.icons[m.hand[k]], m.x - 9 + (k % 2) * 4, m.y - 40 - bob - k * 5, 0.42);
    if (m.hand.length > 4) { ctx.font = 'bold 8px sans-serif'; ctx.fillStyle = '#fffaf0'; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.strokeText('×' + m.hand.length, m.x + 10, m.y - 44 - bob); ctx.fillText('×' + m.hand.length, m.x + 10, m.y - 44 - bob); }
  }
  if (R.sel && R.sel.kind === 'm' && R.sel.id === m.id) {
    selRing(ctx, m.x, m.y + 2, 14, 6);
    ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
    ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.strokeText(m.name, m.x, m.y - 50 - bob); ctx.fillStyle = '#fffaf0'; ctx.fillText(m.name, m.x, m.y - 50 - bob);
  }
}
function drawStatus(ctx, b, t) {
  const d = BUILDINGS[b.type];
  const x = (b.x + d.w / 2) * T, top = (b.y + d.h) * T - (d.w === 1 ? 74 : 124);
  let icon = null, frac = 0, mode = '';
  if (b.type === 'creator') { if (!b.queue.length) return; icon = b.queue[0]; frac = b.t / 20; mode = 'work'; }
  else if (!b.recipe) mode = 'idle';
  else {
    const r = RECIPE[b.recipe]; icon = r.out[0];
    if (b.phase === 'work') { frac = b.t / r.t; mode = 'work'; }
    else if (b.phase === 'done') mode = 'done';
    else if (b.phase === 'gather') { mode = 'gather'; let have = 0, need = 0; for (const k in r.in) { need += r.in[k]; have += Math.min(r.in[k], b.got[k] || 0); } frac = have / need; }
    else mode = 'paused';
  }
  const y = top + (mode === 'done' ? Math.sin(t * 5) * 3 : 0);
  if (mode === 'idle') {
    ctx.globalAlpha = 0.55 + 0.25 * Math.sin(t * 3);
    rrect(ctx, x - 10, y - 10, 20, 20, 10); ctx.fillStyle = '#fffaf0'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = '#6a4a2a'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('Z', x, y + 1);
    ctx.globalAlpha = 1; return;
  }
  ctx.beginPath(); ctx.arc(x, y, 14, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,250,235,0.95)'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.stroke();
  if (mode === 'work' || mode === 'gather') {
    ctx.beginPath(); ctx.arc(x, y, 14, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac);
    ctx.strokeStyle = mode === 'work' ? '#5aa335' : '#e8a02a'; ctx.lineWidth = 3.5; ctx.stroke();
  }
  if (mode === 'done') { ctx.beginPath(); ctx.arc(x, y, 14, 0, Math.PI * 2); ctx.strokeStyle = '#5aa335'; ctx.lineWidth = 3.5; ctx.stroke(); }
  if (icon) { ctx.globalAlpha = mode === 'gather' || mode === 'paused' ? 0.55 : 1; drawSprite(ctx, ART.icons[icon], x - 10, y - 10, 0.62); ctx.globalAlpha = 1; }
  if (mode === 'gather') {
    const r = RECIPE[b.recipe];
    for (const k in r.in) if ((b.got[k] || 0) + (b.transit[k] || 0) < r.in[k] && !(S.inv[k] > 0)) {
      ctx.beginPath(); ctx.arc(x + 13, y - 10, 7, 0, Math.PI * 2); ctx.fillStyle = '#e8463a'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('!', x + 13, y - 9.5);
      break;
    }
  }
}
function drawGhost(ctx) {
  const gh = R.ghost, d = BUILDINGS[gh.type];
  ctx.fillStyle = gh.ok ? 'rgba(120,230,120,0.35)' : 'rgba(240,80,60,0.35)';
  ctx.strokeStyle = gh.ok ? 'rgba(230,255,230,0.95)' : 'rgba(255,200,190,0.95)';
  ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
  rrect(ctx, gh.x * T + 2, gh.y * T + 2, d.w * T - 4, d.h * T - 4, 6); ctx.fill(); ctx.stroke(); ctx.setLineDash([]);
  if (gh.type !== 'plot' && gh.type !== 'path') {
    ctx.globalAlpha = 0.75;
    drawSprite(ctx, gh.type === 'greenhouse' ? greenhouseSprite(false) : buildingSprite(gh.type), (gh.x + d.w / 2) * T, (gh.y + d.h) * T);
    ctx.globalAlpha = 1;
  }
}
function drawParticles(ctx, dt) {
  const ps = R.parts;
  for (let k = ps.length - 1; k >= 0; k--) {
    const p = ps[k];
    p.life += dt; if (p.life >= p.max) { ps[k] = ps[ps.length - 1]; ps.pop(); continue; }
    p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
    const f = p.life / p.max;
    switch (p.type) {
      case 'chip': ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.globalAlpha = 1 - f * f; ctx.fillStyle = p.col; ctx.fillRect(-p.size, -p.size / 2, p.size * 2, p.size); ctx.restore(); break;
      case 'drop': ctx.globalAlpha = 1 - f; ell(ctx, p.x, p.y, p.size * 0.8, p.size * 1.3, '#8ad0f8'); break;
      case 'poof': ctx.globalAlpha = (1 - f) * 0.7; ell(ctx, p.x, p.y - f * 10, p.size * (0.6 + f), p.size * (0.5 + f * 0.8), '#fbf3df'); break;
      case 'spark': {
        ctx.globalAlpha = 1 - f; const s = p.size * (1 - Math.abs(f - 0.3));
        ctx.fillStyle = '#fff6b0'; ctx.beginPath();
        for (let i = 0; i < 8; i++) { const r = i % 2 ? s * 0.3 : s, a = i / 8 * Math.PI * 2 + p.life * 3; ctx.lineTo(p.x + Math.cos(a) * r, p.y + Math.sin(a) * r); }
        ctx.closePath(); ctx.fill(); break;
      }
      case 'float': {
        ctx.globalAlpha = f < 0.7 ? 1 : (1 - f) / 0.3;
        drawSprite(ctx, ART.icons[p.icon], p.x - 2, p.y - 8, 0.5);
        ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
        ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.strokeText(p.text, p.x - 2, p.y); ctx.fillStyle = '#fffaf0'; ctx.fillText(p.text, p.x - 2, p.y);
        p.vy *= 0.97; break;
      }
      case 'steam': ctx.globalAlpha = (1 - f) * 0.5; ell(ctx, p.x + Math.sin(p.life * 3) * 3, p.y, p.size * (0.6 + f), p.size * (0.6 + f), '#ffffff'); break;
      case 'smoke': ctx.globalAlpha = (1 - f) * 0.45; ell(ctx, p.x + Math.sin(p.life * 2) * 4, p.y, p.size * (0.6 + f * 1.4), p.size * (0.6 + f * 1.4), '#c8c0b8'); break;
      case 'leaf': {
        p.vx = Math.sin(p.life * 2.5 + p.size) * 18;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.sin(p.life * 3) * 1.2); ctx.globalAlpha = f > 0.8 ? (1 - f) * 5 : 1;
        ctx.beginPath(); ctx.ellipse(0, 0, 3, 1.6, 0, 0, Math.PI * 2); ctx.fillStyle = p.col; ctx.fill(); ctx.restore(); break;
      }
    }
    ctx.globalAlpha = 1;
  }
}
// butterflies by day, fireflies at night, seasonal falling leaves and petals
function drawAmbient(ctx, dt, x0, y0, x1, y1) {
  const sun = sunInfo(), A = R.amb, sea = R.season;
  const wantB = sea === 3 ? 0 : Math.round(8 * R.q.parts * (1 - sun.night)), wantF = R.q.fireflies && sea === 1 || sea === 0 && R.q.fireflies ? Math.round(30 * sun.night) : 0;
  let nb = 0, nf = 0; for (const a of A) a.k === 'b' ? nb++ : nf++;
  const rx = () => x0 + Math.random() * (x1 - x0), ry = () => y0 + Math.random() * (y1 - y0);
  if (nb < wantB) A.push({ k: 'b', x: rx(), y: ry(), a: Math.random() * 6, col: ['#f2c23a', '#ffffff', '#e87aa0', '#7ab8e8', '#f08a3a'][(Math.random() * 5) | 0], life: 0, max: 20 + Math.random() * 20 });
  if (nf < wantF) A.push({ k: 'f', x: rx(), y: ry(), a: Math.random() * 6, life: 0, max: 8 + Math.random() * 10 });
  if (sea !== 3 && Math.random() < (sea === 2 ? 0.6 : sea === 0 ? 0.35 : 0.12) * R.q.parts * dt * 10) {
    const tx = Math.floor(rx() / T), ty = Math.floor(ry() / T);
    if (inMap(tx, ty) && (S.cover[idx(tx, ty)] === COVER.TREE || S.cover[idx(tx, ty)] === COVER.BIG)) {
      const cols = sea === 0 ? ['#f6b8d0', '#fff4f8', '#f29ac0'] : sea === 2 ? ['#e8902a', '#d8602a', '#f2b23a', '#b8302a'] : ['#7cc25a', '#5aa84a'];
      addPart({ type: 'leaf', x: tx * T + T / 2 + (Math.random() - 0.5) * 30, y: ty * T - 30, vy: 14, max: 3.5, col: cols[(Math.random() * cols.length) | 0], size: Math.random() * 6 });
    }
  }
  for (let k = A.length - 1; k >= 0; k--) {
    const a = A[k]; a.life += dt;
    if (a.life > a.max || (a.k === 'b' && (sun.night > 0.6 || sea === 3)) || (a.k === 'f' && sun.night < 0.3)) { A.splice(k, 1); continue; }
    a.a += (Math.random() - 0.5) * dt * 4;
    const sp = a.k === 'b' ? 26 : 10;
    a.x += Math.cos(a.a) * sp * dt; a.y += Math.sin(a.a) * sp * dt;
    const fade = Math.min(1, a.life, a.max - a.life);
    if (a.k === 'b') {
      const flap = Math.abs(Math.sin(a.life * 16));
      ctx.globalAlpha = fade;
      ctx.save(); ctx.translate(a.x, a.y - 18);
      ctx.fillStyle = a.col; ctx.strokeStyle = INK; ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.ellipse(-2.4 * flap, 0, 2.6 * flap + 0.4, 3.2, -0.3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(2.4 * flap, 0, 2.6 * flap + 0.4, 3.2, 0.3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = INK; ctx.fillRect(-0.4, -2, 0.8, 4);
      ctx.restore();
      ctx.globalAlpha = 1;
    } else a.glow = fade * (0.5 + 0.5 * Math.sin(a.life * 4 + a.a));
  }
}
// rain streaks and snowflakes, in screen space
function drawWeather(ctx, dt, raining) {
  const W = R.cv.width, H = R.cv.height, P = R.wx, sc = R.pr;
  const snow = R.season === 3;
  const want = raining ? Math.round(160 * R.q.parts + 30) : snow ? Math.round(90 * R.q.parts + 15) : 0;
  while (P.length < want) P.push({ x: Math.random() * W, y: Math.random() * H, v: 0.6 + Math.random() * 0.6, ph: Math.random() * 6 });
  if (P.length > want) P.length = want;
  if (!P.length) return;
  if (raining) {
    ctx.strokeStyle = 'rgba(200,225,255,0.55)'; ctx.lineWidth = 1.2 * sc; ctx.beginPath();
    for (const p of P) {
      p.y += 900 * p.v * dt * sc; p.x -= 120 * p.v * dt * sc;
      if (p.y > H) { p.y = -20; p.x = Math.random() * (W + 100); }
      ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + 4 * sc, p.y - 16 * sc * p.v);
    }
    ctx.stroke();
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    for (const p of P) {
      p.ph += dt; p.y += 40 * p.v * dt * sc; p.x += Math.sin(p.ph) * 14 * dt * sc;
      if (p.y > H) { p.y = -6; p.x = Math.random() * W; }
      ctx.beginPath(); ctx.arc(p.x, p.y, (1 + p.v * 1.4) * sc, 0, Math.PI * 2); ctx.fill();
    }
  }
}
function drawClouds(ctx, x0, y0, x1, y1, t, sun) {
  ctx.save();
  ctx.globalAlpha = 0.22 * (1 - sun.night);
  for (let k = 0; k < 6; k++) {
    const span = MW * T + 800;
    const cx = ((k * 977 + t * 14) % span) - 400, cy = (k * 613) % (MH * T);
    if (cx < x0 - 300 || cx > x1 + 300 || cy < y0 - 300 || cy > y1 + 300) continue;
    for (let j = 0; j < 5; j++) {
      const px = cx + j * 60 - 120, py = cy + Math.sin(j * 2 + k) * 30, g = ctx.createRadialGradient(px, py, 0, px, py, 120);
      g.addColorStop(0, 'rgba(20,35,50,0.5)'); g.addColorStop(1, 'rgba(20,35,50,0)');
      ctx.fillStyle = g; ctx.fillRect(px - 120, py - 120, 240, 240);
    }
  }
  ctx.restore();
}
function drawLights(ctx, night, t) {
  ctx.globalCompositeOperation = 'lighter';
  const L = (wx, wy, r, col, a) => {
    const p = R.worldToScreen(wx, wy), rr = r * R.cam.z * R.pr, px = p.x * R.pr, py = p.y * R.pr;
    if (px < -rr || py < -rr || px > R.cv.width + rr || py > R.cv.height + rr) return;
    const g = ctx.createRadialGradient(px, py, 0, px, py, rr);
    g.addColorStop(0, rgba(col, a * night)); g.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = g; ctx.fillRect(px - rr, py - rr, rr * 2, rr * 2);
  };
  for (const b of S.buildings) {
    const d = BUILDINGS[b.type], bx = (b.x + d.w / 2) * T, by = (b.y + d.h) * T;
    const fl = 0.9 + Math.sin(t * 9 + b.id) * 0.1;
    switch (b.type) {
      case 'lantern': L(bx + 8, by - 41, 90, '#ffc860', 0.55 * fl); break;
      case 'storehouse': L(bx, by - 60, 60, '#ffc860', 0.3); break;
      case 'creator': L(bx, by - 26, 80, '#ffd070', 0.45 * fl); break;
      case 'market': L(bx, by - 40, 70, '#ffb860', 0.3); break;
      case 'pot': L(bx, by - 30, 110, '#ff9a40', (b.phase === 'work' ? 0.6 : 0.35) * fl); break;
      case 'kettle': L(bx - 8, by - 14, 80, '#ff9a40', 0.4 * fl); break;
      case 'oven': L(bx - 5, by - 20, 90, '#ff9a40', 0.45 * fl); break;
      case 'still': L(bx - 18, by - 14, 80, '#ff9a40', 0.4 * fl); break;
      case 'teahouse': L(bx - 40, by - 45, 50, '#ff7a60', 0.4 * fl); L(bx + 40, by - 45, 50, '#ff7a60', 0.4 * fl); break;
      case 'mill': L(bx, by - 56, 50, '#ffc860', 0.3); break;
      case 'greenhouse': L(bx, by - 100, 140, '#c8ffb0', 0.2); break;
    }
  }
  for (const a of R.amb) if (a.k === 'f' && a.glow) L(a.x, a.y - 14, 16, '#d8ff70', a.glow);
  ctx.globalCompositeOperation = 'source-over';
}
R.drawCoverLabels = drawCoverLabels;
R.meepleSprites = {};
;(window.__stage = window.__stage || []).push('render.js loaded');
