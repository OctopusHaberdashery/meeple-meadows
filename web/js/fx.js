// Meeple Meadows — v1.7 "feel": buildings raised pixel by pixel, squash and stretch, anticipation,
// long evening shadows, grass that parts, birds, pond ripples, the travelling visitor, confetti and a
// camera that eases toward the big moments. Everything here is drawing only; nothing is saved.
'use strict';

const FX = {
  pops: {}, cheer: {}, hop: {}, born: {}, ripples: [], birds: {}, conf: [], flashA: 0,
  camJob: null, vel: null, punch: null, _dv: null, vpos: null, vposT: 0,
};
const EASE = {
  out: x => 1 - Math.pow(1 - x, 3),
  inOut: x => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2,
  back: x => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
};

// ---------------------------------------------------------------- squash, stretch and wobble
FX.pop = function (key, kind, dur, amp) { FX.pops[key] = { t0: R.time, kind, dur: dur || 0.5, amp: amp == null ? 0.16 : amp }; };
// -> [scaleX, scaleY, rotation] for something that was just poked, or null
function popOf(key) {
  const p = FX.pops[key]; if (!p) return null;
  const f = (R.time - p.t0) / p.dur;
  if (f >= 1 || f < 0) { delete FX.pops[key]; return null; }
  switch (p.kind) {
    case 'in': { const s = Math.max(0.02, EASE.back(f)); return [s, s, 0]; }
    case 'bounce': { const sy = 1 - p.amp * Math.cos(f * Math.PI * 3.5) * Math.pow(1 - f, 1.4); return [1 - (sy - 1) * 0.6, sy, 0]; }
    case 'spring': { const sy = 1 + p.amp * 1.5 * Math.sin(f * Math.PI * 4) * (1 - f); return [1 - (sy - 1) * 0.5, sy, 0]; }
    case 'wobble': return [1, 1, Math.sin(f * Math.PI * 5) * (1 - f) * p.amp];
  }
  return null;
}
const _db6 = drawBuilding;
drawBuilding = function (ctx, b, t, dt) {
  if (b.of) { drawSite(ctx, b, t, dt); return; }
  const d = BUILDINGS[b.type], bx = (b.x + d.w / 2) * T, by = (b.y + d.h) * T;
  let sx = 1, sy = 1, dx = 0;
  const p = popOf('b' + b.id); if (p) { sx = p[0]; sy = p[1]; }
  // a working building breathes, and rattles in the last moment before it finishes
  if (b.phase === 'work' && b.recipe && RECIPE[b.recipe]) {
    const left = (RECIPE[b.recipe].t - b.t) / (craftMult() * workMult(b));
    sy *= 1 + Math.sin(t * 5 + b.id) * 0.008;
    if (left < 1.3) { const k = 1 - left / 1.3; dx = Math.sin(t * 55) * 1.5 * k; sy *= 1 + Math.sin(t * 30) * 0.02 * k; }
  }
  // the Creator shudders harder and harder until a Meeple pops out
  if (b.type === 'creator' && b.queue && b.queue.length && b.t > 16.5) {
    const k = Math.min(1, (b.t - 16.5) / 3.5); dx = Math.sin(t * 60) * 2 * k; sy *= 1 + Math.sin(t * 26) * 0.035 * k; sx *= 1 - Math.sin(t * 26) * 0.02 * k;
    if (Math.random() < 0.3 * k * R.q.parts) addPart({ type: 'spark', x: bx + (Math.random() - 0.5) * 50, y: by - 30 - Math.random() * 60, vy: -20, max: 0.7, size: 4 });
  }
  if (sx === 1 && sy === 1 && !dx) { _db6(ctx, b, t, dt); return; }
  ctx.save(); ctx.translate(bx + dx, by); ctx.scale(sx, sy); ctx.translate(-bx, -by); _db6(ctx, b, t, dt); ctx.restore();
};
const _dp6 = drawPlot;
drawPlot = function (ctx, i, t, wind, sway) {
  const p = popOf('p' + i), pl = S.plots[i], x = (i % MW) * T + T / 2, y = ((i / MW) | 0) * T + T / 2;
  // a mastered crop grows in a soft golden glow
  if (pl && pl.st >= 1 && S.mast && S.mast[pl.crop] >= 3) { ctx.globalAlpha = 0.2 + 0.1 * Math.sin(t * 2 + i); ell(ctx, x, y + 12, 17, 6.5, '#ffd84a'); ctx.globalAlpha = 1; }
  if (!p) _dp6(ctx, i, t, wind, sway);
  else { ctx.save(); ctx.translate(x, y + 18); ctx.rotate(p[2]); ctx.scale(p[0], p[1]); ctx.translate(-x, -(y + 18)); _dp6(ctx, i, t, wind, sway); ctx.restore(); }
  if (pl && pl.st >= 2 && S.mast && S.mast[pl.crop] >= 3) {
    const ph = (t * 0.7 + hash2(i, 3, 9) * 4) % 1;
    ctx.globalAlpha = Math.sin(ph * Math.PI); drawSprite(ctx, ART.icons.ui_star, x - 16 + hash2(i, Math.floor(t * 0.7 + hash2(i, 3, 9) * 4), 2) * 22, y - 28 + ph * 6, 0.2); ctx.globalAlpha = 1;
  }
};
const _dc6 = drawCover;
drawCover = function (ctx, i, t, wind, sway) {
  const p = popOf('c' + i); if (!p) { _dc6(ctx, i, t, wind, sway); return; }
  const q = coverPos(i);
  ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(p[2]); ctx.scale(p[0], p[1]); ctx.translate(-q.x, -q.y); _dc6(ctx, i, t, wind, sway); ctx.restore();
};

// ---------------------------------------------------------------- wind
// a slow breeze everywhere, plus a gust front that crosses the meadow so crops ripple in a wave
function windAt(x, y, t) {
  const base = Math.sin(t * 0.6 + x * 0.004) * 0.35 + Math.sin(t * 1.7 + y * 0.006) * 0.15;
  const span = (MW * T + 900) * 0.8, gx = ((t * 150) % span) - 450, d = (x + y * 0.25 - gx) / 190;
  return base + (d > -1.8 && d < 1.8 ? Math.exp(-d * d) * (0.95 + 0.3 * Math.sin(t * 9 + x * 0.05)) : 0);
}

// ---------------------------------------------------------------- Meeples: cheering, hopping, sitting, being born
const _gp6 = gaitPose;
gaitPose = function (m) {
  const P = _gp6(m), ch = FX.cheer[m.id], hp = FX.hop[m.id];
  if (ch) {
    if (R.time > ch) delete FX.cheer[m.id];
    else if (!m.moving) { const h = Math.abs(Math.sin((ch - R.time) * 8 + m.id)); P.fr = -1; P.bob = h * 10; P.lift = 0; P.sq = h < 0.15 ? 0.84 : 1.07; P.tilt = Math.sin(R.time * 16 + m.id) * 0.08; P.sx = 1; P.shadow = 1; }
  }
  if (hp != null) { const f = (R.time - hp) / 0.32; if (f >= 1 || f < 0) delete FX.hop[m.id]; else P.bob += Math.sin(f * Math.PI) * 6; }
  if (m.task && m.task.type === 'rest' && m.task.kind === 'sit' && !m.path.length) { P.fr = -1; P.bob = Math.sin(m.bob * 1.5) * 0.4; P.tilt = 0; P.lift = 7; P.sq = 1; P.sx = 1; P.shadow = 0.5; }
  return P;
};
const _dm6 = drawMeeple;
drawMeeple = function (ctx, m, t) {
  const born = FX.born[m.id];
  let sc = 1, jump = 0;
  if (born != null) {
    const f = (R.time - born) / 0.9;
    if (f >= 1 || f < 0) delete FX.born[m.id]; else { sc = Math.max(0.05, EASE.back(Math.min(1, f * 1.7))); jump = Math.sin(f * Math.PI) * 26; }
  }
  if (sc !== 1 || jump) { ctx.save(); ctx.translate(m.x, m.y - jump); ctx.scale(sc, sc); ctx.translate(-m.x, -m.y); _dm6(ctx, m, t); ctx.restore(); }
  else _dm6(ctx, m, t);
  const tk = m.task;
  if (!tk || tk.type !== 'construct') return;
  const P = _gp6(m), bob = P.bob + P.lift, site = BMAP[tk.b];
  if (m.path.length) {
    // off to the site with a plank over one shoulder
    ctx.save(); ctx.translate(m.x, m.y - 25 - bob); ctx.rotate(-0.22 * m.face);
    rrect(ctx, -10, -1.6, 20, 3.2, 1); ctx.fillStyle = '#c89858'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 0.7; ctx.stroke();
    ctx.restore();
    return;
  }
  const dig = site && site.con && site.con.p < site.con.need * BUILD_FOUND;
  ctx.save(); ctx.translate(m.x + m.face * 7, m.y - 13 - bob); ctx.scale(m.face, 1); ctx.rotate(-0.95 + Math.abs(Math.sin(m.act * 6.5)) * 1.35);
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -10); ctx.strokeStyle = INK; ctx.lineWidth = 2.4; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -10); ctx.strokeStyle = '#b8884a'; ctx.lineWidth = 1.3; ctx.stroke();
  if (dig) { ctx.beginPath(); ctx.moveTo(-3, -10); ctx.lineTo(3, -10); ctx.lineTo(2.4, -15); ctx.quadraticCurveTo(0, -17, -2.4, -15); ctx.closePath(); ctx.fillStyle = '#9aa2aa'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 0.7; ctx.stroke(); }
  else { rrect(ctx, -3.6, -13.4, 8, 4.2, 1); ctx.fillStyle = '#8a929a'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 0.7; ctx.stroke(); }
  ctx.restore();
};

// ---------------------------------------------------------------- building sites
// The finished sprite is cut into little squares ("pixels"), ordered from the ground up with a ragged
// front, and each one is carried in and set down as the work goes on.
const SITEFX = {};
function siteCells(s, cs) {
  if (s._cells && s._cs === cs) return s._cells;
  const c = s.c, W = c.width, H = c.height, k = W / s.w, data = c.getContext('2d').getImageData(0, 0, W, H).data;
  const nx = Math.ceil(s.w / cs), ny = Math.ceil(s.h / cs), cells = [];
  for (let cy = 0; cy < ny; cy++) for (let cx = 0; cx < nx; cx++) {
    const px0 = Math.floor(cx * cs * k), py0 = Math.floor(cy * cs * k), pw = Math.ceil(cs * k);
    let hit = 0, r = 0, g = 0, bl = 0;
    for (let sy = 0; sy < 3; sy++) for (let sx = 0; sx < 3; sx++) {
      const x = Math.min(W - 1, px0 + Math.floor((sx + 0.5) * pw / 3)), y = Math.min(H - 1, py0 + Math.floor((sy + 0.5) * pw / 3)), o = (y * W + x) * 4;
      if (data[o + 3] > 60) { hit++; r += data[o]; g += data[o + 1]; bl += data[o + 2]; }
    }
    if (!hit) continue;
    const row = ny - 1 - cy;
    cells.push({ cx, cy, row, key: row + hash2(cx, cy, 5) * 2.6 + ((row & 1) ? cx : -cx) * 0.012, col: `rgb(${(r / hit) | 0},${(g / hit) | 0},${(bl / hit) | 0})` });
  }
  cells.sort((a, b) => a.key - b.key);
  s._cells = cells; s._cs = cs;
  return cells;
}
function stampCell(F, c, cs, k) {
  const px = Math.floor(c.cx * cs * k), py = Math.floor(c.cy * cs * k), pw = Math.ceil((c.cx + 1) * cs * k) - px, ph = Math.ceil((c.cy + 1) * cs * k) - py;
  F.g.drawImage(F.s.c, px, py, pw, ph, px, py, pw, ph);
}
function woodBeam(ctx, x0, y0, x1, y1, w, col) {
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.strokeStyle = INK; ctx.lineWidth = w + 1.2; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.strokeStyle = col || '#c0905a'; ctx.lineWidth = w; ctx.stroke();
}
function drawSite(ctx, b, t, dt) {
  const type = b.of, d = BUILDINGS[type], W = d.w * T, Hh = d.h * T, bx = (b.x + d.w / 2) * T, by = (b.y + d.h) * T;
  const s = type === 'greenhouse' ? greenhouseSprite(false) : buildingSprite(type);
  const cs = d.w >= 4 ? 3 : 2, cells = siteCells(s, cs), k = s.c.width / s.w;
  let F = SITEFX[b.id];
  if (!F || F.s !== s) F = SITEFX[b.id] = { s, cv: newCanvas(s.c.width, s.c.height), n: 0, fl: [], flash: [], from: [], top: 0 };
  if (!F.g) F.g = F.cv.getContext('2d');
  const f = Math.min(1, b.con.p / b.con.need), fa = Math.min(1, f / BUILD_FOUND), ff = Math.max(0, (f - BUILD_FOUND) / (1 - BUILD_FOUND));
  const want = Math.min(cells.length, Math.floor(ff * cells.length));
  const ox = bx - s.ax, oy = by - s.ay;   // world position of the sprite's top-left corner

  // staked-out plot: pegs and string, then freshly dug earth
  ctx.globalAlpha = 0.3 + 0.6 * fa; rrect(ctx, b.x * T + 4, b.y * T + 7, W - 8, Hh - 11, 7); ctx.fillStyle = '#a98a5c'; ctx.fill();
  ctx.globalAlpha = 0.5 * fa; ctx.strokeStyle = '#7a5c36'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.globalAlpha = 1;
  ctx.setLineDash([3, 3]); ctx.strokeStyle = 'rgba(255,250,235,0.9)'; ctx.lineWidth = 0.9; ctx.strokeRect(b.x * T + 4, b.y * T + 7, W - 8, Hh - 11); ctx.setLineDash([]);
  for (const [px, py] of [[b.x * T + 4, b.y * T + 7], [b.x * T + W - 4, b.y * T + 7], [b.x * T + 4, by - 4], [b.x * T + W - 4, by - 4]]) { ctx.fillStyle = INK; ctx.fillRect(px - 1.6, py - 6.6, 3.2, 8.2); ctx.fillStyle = '#d8b070'; ctx.fillRect(px - 1, py - 6, 2, 7); }
  if (fa < 1 || f < 0.3) { const a = fa < 1 ? fa : 1 - (f - BUILD_FOUND) / (0.3 - BUILD_FOUND); ell(ctx, bx - W * 0.22, by - 9, 9 * a + 2, 4 * a + 1, '#8a6a3c', INK, 0.6); ell(ctx, bx + W * 0.2, by - 13, 7 * a + 2, 3.4 * a + 1, '#96744a', INK, 0.6); }

  // the plan: a faint ghost of what it will become
  ctx.globalAlpha = 0.13 + 0.03 * Math.sin(t * 2.2); drawSprite(ctx, s, bx, by); ctx.globalAlpha = 1;

  // how high the work has reached (world units above the ground line)
  const row = want > 0 ? cells[want - 1].row : 0, hgt = Math.max(0, row * cs - (s.h - s.ay));
  F.top += (hgt - F.top) * Math.min(1, dt * 4);
  const top = F.top, xL = bx - W / 2 - 2, xR = bx + W / 2 + 2, yTop = by - Math.max(20, top + 16);
  // scaffolding behind the walls: poles, ledgers and cross braces rising with the work
  if (ff > 0 || fa >= 1) {
    woodBeam(ctx, xL, by - 2, xL, yTop, 2.4); woodBeam(ctx, xR, by - 2, xR, yTop, 2.4);
    let lv = 0;
    for (let y = by - 22; y > yTop + 4; y -= 22, lv++) {
      woodBeam(ctx, xL, y, xR, y, 1.8, '#b0844e');
      if (lv % 2 === 0) woodBeam(ctx, xL, y + 20, xL + W * 0.3, y, 1.2, '#a67a48'); else woodBeam(ctx, xR, y + 20, xR - W * 0.3, y, 1.2, '#a67a48');
    }
  }

  // set down the pixels that are due: a few fly in from the builders, the rest drop straight into place
  if (want < F.n) { F.g.clearRect(0, 0, F.cv.width, F.cv.height); F.n = 0; F.fl.length = 0; }
  const now = R.time; while (F.from.length && now - F.from[0].t > 1.2) F.from.shift();
  let budget = 5;
  while (F.n < want) {
    const c = cells[F.n++];
    if (budget > 0 && F.from.length && F.fl.length < 48 && want - F.n < 400) { budget--; const o = F.from[(Math.random() * F.from.length) | 0]; F.fl.push({ c, x0: o.x + o.face * 6, y0: o.y - 22, t: 0, d: 0.24 + Math.random() * 0.2 }); }
    else stampCell(F, c, cs, k);
  }
  ctx.drawImage(F.cv, ox, oy, s.w, s.h);
  for (let i = F.fl.length - 1; i >= 0; i--) {
    const q = F.fl[i]; q.t += dt;
    const tx = ox + (q.c.cx + 0.5) * cs, ty = oy + (q.c.cy + 0.5) * cs;
    if (q.t >= q.d) { stampCell(F, q.c, cs, k); F.flash.push({ x: tx, y: ty, t: 0 }); F.fl.splice(i, 1); continue; }
    const p = q.t / q.d, x = q.x0 + (tx - q.x0) * p, y = q.y0 + (ty - q.y0) * p - Math.sin(p * Math.PI) * 16;
    ctx.fillStyle = INK; ctx.fillRect(x - cs / 2 - 0.4, y - cs / 2 - 0.4, cs + 0.8, cs + 0.8);
    ctx.fillStyle = q.c.col; ctx.fillRect(x - cs / 2, y - cs / 2, cs, cs);
  }
  // a glint where each one has just been set
  for (let i = F.flash.length - 1; i >= 0; i--) {
    const q = F.flash[i]; q.t += dt; if (q.t > 0.28) { F.flash.splice(i, 1); continue; }
    ctx.globalAlpha = 0.85 * (1 - q.t / 0.28); ctx.fillStyle = '#fffbe0'; ctx.fillRect(q.x - cs / 2 - 0.5, q.y - cs / 2 - 0.5, cs + 1, cs + 1);
  }
  ctx.globalAlpha = 1;

  if (ff > 0 || fa >= 1) {
    // the working platform just under the newest row, a ladder up to it, and a hoist hauling a bucket
    const py = by - Math.max(9, top - 5);
    woodBeam(ctx, xL - 3, py, xR + 3, py, 2.6, '#d0a468');
    if (top > 14) {
      const lx = xL + 7; woodBeam(ctx, lx - 3, by - 1, lx - 3, py, 1.1, '#a67a48'); woodBeam(ctx, lx + 3, by - 1, lx + 3, py, 1.1, '#a67a48');
      ctx.strokeStyle = '#8a6238'; ctx.lineWidth = 1; ctx.beginPath(); for (let y = by - 6; y > py + 2; y -= 6) { ctx.moveTo(lx - 3, y); ctx.lineTo(lx + 3, y); } ctx.stroke();
    }
    woodBeam(ctx, xR, yTop + 1, xR - 15, yTop + 1, 2, '#a67a48');
    const ph = (t * 0.42 + b.id * 0.37) % 1, tri = ph < 0.5 ? ph * 2 : 2 - ph * 2, hy = by - 8 + (yTop + 12 - (by - 8)) * EASE.inOut(tri), hx = xR - 13;
    ctx.beginPath(); ctx.moveTo(hx, yTop + 2); ctx.lineTo(hx, hy - 5); ctx.strokeStyle = '#6a5038'; ctx.lineWidth = 0.7; ctx.stroke();
    rrect(ctx, hx - 4, hy - 5, 8, 6.5, 1.4); ctx.fillStyle = '#b8884a'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 0.7; ctx.stroke();
    if (ph < 0.5) { ctx.fillStyle = cells.length ? cells[Math.min(cells.length - 1, want)].col : '#c8a060'; ctx.fillRect(hx - 2.6, hy - 7.6, 2.4, 2.6); ctx.fillRect(hx + 0.4, hy - 7.2, 2.2, 2.2); }
  }
  // the materials that are left: a stack of planks and a few bricks
  const left = Math.ceil((1 - f) * 5);
  for (let i = 0; i < left; i++) { rrect(ctx, bx - W / 2 - 1 + (i % 2) * 2, by + 5 - i * 3.1, 19, 3, 1); ctx.fillStyle = i % 2 ? '#c89858' : '#b8884a'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 0.6; ctx.stroke(); }
  for (let i = 0; i < Math.ceil((1 - f) * 4); i++) { rrect(ctx, bx - W / 2 + 21 + (i % 2) * 6, by + 5 - ((i / 2) | 0) * 3.4, 5.4, 3, 0.8); ctx.fillStyle = '#c0604a'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 0.6; ctx.stroke(); }
  // a little sign with how far along it is
  const sx = bx + W / 2 - 9, sy = by + 3;
  ctx.fillStyle = INK; ctx.fillRect(sx - 1.2, sy - 9, 2.4, 11);
  rrect(ctx, sx - 10, sy - 20, 20, 12, 2.5); ctx.fillStyle = '#fff6dc'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = '#4a3020'; ctx.font = 'bold 7.5px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(Math.floor(f * 100) + '%', sx, sy - 13.6);
}

// ---------------------------------------------------------------- long shadows at sunrise and sunset
FX.shadows = function (ctx, list) {
  if (!R.dayNight || !R.q.lights) return;
  const a = (S.day - 0.25) * Math.PI * 2, el = Math.sin(a); if (el <= 0.02) return;
  const len = Math.min(3.4, Math.abs(Math.cos(a)) / Math.max(0.16, el)); if (len < 0.4) return;
  const dir = Math.cos(a) > 0 ? -1 : 1, alpha = Math.min(0.2, 0.075 * len) * Math.min(1, el / 0.12);
  ctx.fillStyle = `rgba(34,26,44,${alpha.toFixed(3)})`;
  ctx.beginPath();
  for (const o of list) {
    let x, y, h, w;
    if (o.k === 0) { const p = coverPos(o.i), low = p.kind === 'bush' || p.kind === 'rock'; x = p.x; y = p.y - 3; h = (low ? 13 : 36) * p.big; w = (low ? 6 : 9) * p.big; }
    else if (o.k === 2) {
      const d = BUILDINGS[o.b.type]; if (d.walk || BUILDINGS[o.b.of || o.b.type].tree && !treeGrown(o.b)) continue;
      x = (o.b.x + d.w / 2) * T; y = (o.b.y + d.h) * T - d.h * T * 0.32; w = d.h * T * 0.26; h = d.w === 1 ? 26 : 46;
      if (o.b.con) h *= 0.25 + 0.75 * Math.min(1, o.b.con.p / o.b.con.need);
    }
    else if (o.k === 3) { x = o.m.x; y = o.m.y + 2; h = 13; w = 3.2; }
    else continue;
    const L = h * len;
    // a tapering sliver of shade stretching away from the sun
    ctx.moveTo(x, y - w); ctx.quadraticCurveTo(x + dir * L * 0.6, y - w * 1.1 - L * 0.04, x + dir * L, y - L * 0.07);
    ctx.quadraticCurveTo(x + dir * L * 0.6, y + w * 0.8, x, y + w); ctx.closePath();
  }
  ctx.fill();
};
// warm light pouring in from the side the sun is on
FX.duskGlow = function (ctx, sun) {
  if (!R.q.lights || !(sun.dusk > 0.05)) return;
  const W = R.cv.width, east = Math.cos((S.day - 0.25) * Math.PI * 2) > 0;
  const g = ctx.createLinearGradient(east ? W : 0, 0, east ? 0 : W, 0);
  g.addColorStop(0, `rgba(255,190,90,${(0.2 * sun.dusk).toFixed(3)})`); g.addColorStop(0.7, 'rgba(255,170,90,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, R.cv.height);
};

// ---------------------------------------------------------------- the ground: pond ripples and grass that parts
FX.ripple = function (x, y, big) { if (FX.ripples.length < 40) FX.ripples.push({ x, y, t: 0, max: big ? 1.5 : 1.1, r: big ? 20 : 11 }); };
FX.ground = function (ctx, t, dt, tx0, ty0, tx1, ty1, z) {
  // rings on the water: fish rising, raindrops
  const raining = S.weather && S.weather.rain > 0;
  if (Math.random() < dt * (raining ? 16 : 2.4)) {
    const x = tx0 + ((Math.random() * (tx1 - tx0 + 1)) | 0), y = ty0 + ((Math.random() * (ty1 - ty0 + 1)) | 0);
    if (inMap(x, y) && S.cover[idx(x, y)] === COVER.WATER) FX.ripple(x * T + 8 + Math.random() * 32, y * T + 10 + Math.random() * 28, !raining && Math.random() < 0.3);
  }
  ctx.lineWidth = 1.1;
  for (let i = FX.ripples.length - 1; i >= 0; i--) {
    const r = FX.ripples[i]; r.t += dt; const f = r.t / r.max;
    if (f >= 1) { FX.ripples.splice(i, 1); continue; }
    for (let k = 0; k < 2; k++) {
      const g = f - k * 0.22; if (g <= 0) continue;
      ctx.beginPath(); ctx.ellipse(r.x, r.y, 2 + r.r * g, (2 + r.r * g) * 0.42, 0, 0, Math.PI * 2); ctx.strokeStyle = `rgba(236,252,255,${(0.55 * (1 - g)).toFixed(3)})`; ctx.stroke();
    }
  }
  if (!R.q.sway || z < 0.75) return;
  // tufts of grass lean with the wind and part around running Meeples
  const occ = FX._occ || (FX._occ = new Map()); occ.clear();
  for (const m of S.meeples) if (m.moving) { const k = tileOf(m); let a = occ.get(k); if (!a) occ.set(k, a = []); a.push(m); }
  ctx.lineCap = 'round'; ctx.lineWidth = 1.25; ctx.strokeStyle = 'rgba(62,128,52,0.8)';
  ctx.beginPath();
  for (let y = ty0; y <= ty1; y++) for (let x = tx0; x <= tx1; x++) {
    const i = idx(x, y);
    if (S.cover[i] !== COVER.NONE || S.floor[i] !== FLOOR.GRASS || OCC[i] || GHMAP[i]) continue;
    const h = hash2(x, y, 41); if (h > 0.42) continue;
    const ms = occ.get(i);
    for (let n = h < 0.14 ? 2 : 1; n > 0; n--) {
      const gx = x * T + 6 + hash2(x, y, 42 + n) * 36, gy = y * T + 12 + hash2(x, y, 44 + n) * 30;
      let bend = windAt(gx, gy, t) * 3.4;
      if (ms) for (const m of ms) { const dx = gx - m.x, dy = gy - (m.y + 2), dd = dx * dx + dy * dy; if (dd < 300) bend += (dx >= 0 ? 1 : -1) * (1 - dd / 300) * 7.5; }
      for (let bl = -1; bl <= 1; bl++) { ctx.moveTo(gx + bl * 2, gy); ctx.quadraticCurveTo(gx + bl * 2.5 + bend * 0.4, gy - 4, gx + bl * 3.3 + bend, gy - 6.2 - (bl === 0 ? 2.2 : 0)); }
    }
  }
  ctx.stroke();
};

// ---------------------------------------------------------------- birds on scarecrows, birdbaths and the barn roof
const PERCH = { scarecrow: [12, -45], birdbath: [0, -30], storehouse: [0, -86], statue: [0, -52], well: [0, -60] };
const BIRD_COL = ['#c8563a', '#5a86c8', '#e2b23a', '#7a6a58', '#4a9a7a'];
function drawBird(ctx, x, y, face, flap, col, peck) {
  ctx.save(); ctx.translate(x, y); ctx.scale(face, 1); if (peck) ctx.rotate(0.5);
  ctx.beginPath(); ctx.moveTo(-3, -1); ctx.lineTo(-7, -2.2); ctx.lineTo(-6.4, 0.6); ctx.closePath(); ctx.fillStyle = shade(col, -0.25); ctx.fill();
  ell(ctx, 0, -2, 3.6, 2.8, col, INK, 0.6);
  ell(ctx, 2.9, -4.3, 2, 1.9, col, INK, 0.6);
  ctx.beginPath(); ctx.moveTo(4.6, -4.4); ctx.lineTo(6.8, -3.8); ctx.lineTo(4.6, -3.2); ctx.closePath(); ctx.fillStyle = '#f2b23a'; ctx.fill();
  if (flap != null) { const w = Math.sin(flap) * 4.2; ctx.beginPath(); ctx.moveTo(-1.6, -2.6); ctx.quadraticCurveTo(-0.6, -3.2 - w, 2.6 - Math.abs(w) * 0.2, -2.4 - w * 1.5); ctx.quadraticCurveTo(1, -1.6, -1.6, -2.6); ctx.fillStyle = shade(col, -0.18); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 0.5; ctx.stroke(); }
  else { ell(ctx, -0.4, -1.8, 2.2, 1.5, shade(col, -0.18)); }
  ctx.restore();
}
FX.scare = function (x, y, r) { for (const id in FX.birds) { const B = FX.birds[id]; if (B.st === 'perch' && Math.hypot(B.px - x, B.py - y) < r) { B.st = 'out'; B.t = 0; B.dir = B.px >= x ? 1 : -1; AUDIO.sfx('flap'); } } };
FX.air = function (ctx, t, dt, x0, y0, x1, y1) {
  const seen = {};
  for (const b of S.buildings) {
    const pc = PERCH[b.type]; if (!pc) continue;
    seen[b.id] = 1;
    const d = BUILDINGS[b.type], px = (b.x + d.w / 2) * T + pc[0], py = (b.y + d.h) * T + pc[1];
    let B = FX.birds[b.id];
    if (!B) B = FX.birds[b.id] = { st: 'away', t: 0, wait: 2 + hash2(b.id, 1, 3) * 18, col: BIRD_COL[b.id % BIRD_COL.length], dir: b.id % 2 ? 1 : -1, stay: 0 };
    B.px = px; B.py = py; B.t += dt;
    const vis = px > x0 - 200 && px < x1 + 200 && py > y0 - 200 && py < y1 + 200;
    if (B.st === 'away') { if (B.t > B.wait && !isNight()) { B.st = 'in'; B.t = 0; B.dir = Math.random() < 0.5 ? 1 : -1; } continue; }
    if (B.st === 'in') {
      const f = Math.min(1, B.t / 1.7), e = EASE.out(f);
      if (vis) drawBird(ctx, px - B.dir * 170 * (1 - e), py - 120 * (1 - e) - Math.sin(f * Math.PI) * 14, B.dir, t * 26, B.col);
      if (f >= 1) { B.st = 'perch'; B.t = 0; B.stay = 14 + Math.random() * 26; }
      continue;
    }
    if (B.st === 'perch') {
      // anyone hurrying past sends it off
      let near = B.t > B.stay || isNight();
      if (!near) for (const m of S.meeples) if (m.moving && Math.abs(m.x - px) < 44 && Math.abs(m.y - (py - pc[1])) < 50) { near = true; B.dir = px >= m.x ? 1 : -1; break; }
      if (near) { B.st = 'out'; B.t = 0; if (vis) AUDIO.sfx('flap'); continue; }
      const ph = (t * 0.6 + b.id) % 4, hopY = ph > 3.7 ? -Math.sin((ph - 3.7) / 0.3 * Math.PI) * 2.5 : 0;
      if (vis) drawBird(ctx, px, py + hopY, Math.sin(t * 0.37 + b.id) > 0 ? 1 : -1, null, B.col, ph > 1.6 && ph < 1.9);
      continue;
    }
    // flying off
    const f = Math.min(1, B.t / 1.5), e = f * f;
    if (vis) drawBird(ctx, px + B.dir * 190 * e, py - 150 * e - Math.sin(f * Math.PI) * 10, B.dir, t * 30, B.col);
    if (f >= 1) { B.st = 'away'; B.t = 0; B.wait = 7 + Math.random() * 16; }
  }
  for (const id in FX.birds) if (!seen[id]) delete FX.birds[id];
  for (const id in SITEFX) if (!BMAP[id] || !BMAP[id].of) delete SITEFX[id];
};

// ---------------------------------------------------------------- the day's visitor: a traveller and a cart beside the market
const VISIT_HAT = ['straw', 'cowboy', 'beret', 'tophat', 'wizard', 'bucket'];
function drawVisitor(ctx, t) {
  const p = FX.vpos; if (!p) return;
  const x = p.x, y = p.y + 8, V = S.visitor;
  ell(ctx, x - 12, y + 2, 22, 5, 'rgba(20,30,10,0.26)');
  // the cart
  const cx = x - 22;
  [-9, 9].forEach(dx => { ell(ctx, cx + dx, y - 3, 5, 5, '#6a4a30', INK, 0.9); ell(ctx, cx + dx, y - 3, 1.5, 1.5, '#d8b070'); for (let k = 0; k < 4; k++) { const a = k * Math.PI / 4; ctx.beginPath(); ctx.moveTo(cx + dx - Math.cos(a) * 4.4, y - 3 - Math.sin(a) * 4.4); ctx.lineTo(cx + dx + Math.cos(a) * 4.4, y - 3 + Math.sin(a) * 4.4); ctx.strokeStyle = '#3d2a1f'; ctx.lineWidth = 0.5; ctx.stroke(); } });
  rrect(ctx, cx - 15, y - 17, 30, 12, 2); ctx.fillStyle = '#b8844a'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 0.9; ctx.stroke();
  ctx.strokeStyle = 'rgba(61,42,31,0.35)'; ctx.lineWidth = 0.6; ctx.beginPath(); for (let k = -10; k <= 10; k += 5) { ctx.moveTo(cx + k, y - 16); ctx.lineTo(cx + k, y - 6); } ctx.stroke();
  ell(ctx, cx - 7, y - 19, 4, 3, '#e8463a', INK, 0.6); ell(ctx, cx + 1, y - 20, 4.4, 3.4, '#f2c23a', INK, 0.6); ell(ctx, cx + 8, y - 19, 3.6, 2.8, '#7ab85a', INK, 0.6);
  woodBeam(ctx, cx - 14, y - 17, cx - 14, y - 38, 1.2, '#8a6238'); woodBeam(ctx, cx + 14, y - 17, cx + 14, y - 38, 1.2, '#8a6238');
  for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.moveTo(cx - 17 + k * 5.7, y - 38); ctx.lineTo(cx - 17 + (k + 1) * 5.7, y - 38); ctx.lineTo(cx - 17 + (k + 1) * 5.7, y - 32); ctx.quadraticCurveTo(cx - 17 + (k + 0.5) * 5.7, y - 29.5, cx - 17 + k * 5.7, y - 32); ctx.closePath(); ctx.fillStyle = k % 2 ? '#fff6dc' : '#d8463a'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 0.6; ctx.stroke(); }
  // the traveller: a wandering Meeple with a pack and a hat
  const col = ['#8a6ab0', '#4f8ab0', '#b0704f', '#5a9a6a', '#b05a7a', '#7a7ab8'][V.who % 6], bob = Math.sin(t * 2 + 1) * 0.7, key = 'visit' + col;
  let spr = R.meepleSprites[key]; if (!spr) spr = R.meepleSprites[key] = meepleSprite(col, null, -1, false);
  ell(ctx, x + 10, y + 2, 9, 3.5, 'rgba(20,30,10,0.3)');
  rrect(ctx, x + 2, y - 21 - bob, 8, 11, 2.5); ctx.fillStyle = '#9a7248'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 0.8; ctx.stroke();
  drawSprite(ctx, spr, x + 11, y + 2 - bob);
  const hat = VISIT_HAT[V.who % VISIT_HAT.length]; if (HAT_DRAW[hat]) drawSprite(ctx, hatSprite(hat), x + 11, y + 2 - bob - 17.6);
  if (visitorBusy()) {
    const by = y - 46 + Math.sin(t * 4) * 2;
    ctx.beginPath(); ctx.arc(x + 11, by, 8, 0, Math.PI * 2); ctx.fillStyle = visitorCanFill() || !V.got ? '#5aa335' : '#e8a02a'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(!V.got ? '🎁' : '!', x + 11, by + 0.5);
  }
}
FX.collect = function (list, x0, y0, x1, y1) {
  if (!UI.inGame || !visitorHere()) { FX.vpos = null; return; }
  if (!FX.vpos || R.time - FX.vposT > 1.5) { FX.vpos = visitorSpot(); FX.vposT = R.time; }
  const p = FX.vpos; if (p && p.x > x0 - 80 && p.x < x1 + 80 && p.y > y0 - 80 && p.y < y1 + 80) list.push({ y: p.y + 10, k: 6, f: drawVisitor });
};

// ---------------------------------------------------------------- confetti and a flash (screen space)
const CONF_COL = ['#f2c23a', '#e8463a', '#5aa335', '#4f8ad8', '#f08ab0', '#fff6dc', '#f08a3a'];
FX.confetti = function (n, fromTop) {
  const W = R.cv.width, H = R.cv.height, pr = R.pr;
  for (let k = 0; k < n && FX.conf.length < 260; k++) {
    const side = k % 2 ? 1 : -1;
    FX.conf.push(fromTop ? { x: Math.random() * W, y: -20 * pr, vx: (Math.random() - 0.5) * 120 * pr, vy: (80 + Math.random() * 160) * pr, r: Math.random() * 6, vr: (Math.random() - 0.5) * 12, c: CONF_COL[k % CONF_COL.length], s: (4 + Math.random() * 5) * pr, life: 0, max: 2.6 + Math.random() * 1.4 }
      : { x: W / 2 + side * W * 0.42, y: H * 0.7, vx: -side * (160 + Math.random() * 520) * pr, vy: -(380 + Math.random() * 520) * pr, r: Math.random() * 6, vr: (Math.random() - 0.5) * 14, c: CONF_COL[k % CONF_COL.length], s: (4 + Math.random() * 5) * pr, life: 0, max: 2.2 + Math.random() * 1.4 });
  }
};
FX.flash = function (a) { FX.flashA = Math.max(FX.flashA, a == null ? 0.5 : a); };
FX.screen = function (ctx, dt) {
  if (FX.flashA > 0.004) { ctx.fillStyle = `rgba(255,250,225,${FX.flashA.toFixed(3)})`; ctx.fillRect(0, 0, R.cv.width, R.cv.height); FX.flashA *= Math.pow(0.02, dt); }
  const C = FX.conf, pr = R.pr;
  for (let i = C.length - 1; i >= 0; i--) {
    const p = C[i]; p.life += dt;
    if (p.life > p.max || p.y > R.cv.height + 40) { C[i] = C[C.length - 1]; C.pop(); continue; }
    p.vy += 620 * pr * dt; p.vx *= 1 - dt * 1.2; if (p.vy > 240 * pr) p.vy = 240 * pr;
    p.x += p.vx * dt + Math.sin(p.life * 5 + p.r) * 30 * pr * dt; p.y += p.vy * dt; p.r += p.vr * dt;
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.globalAlpha = Math.min(1, (p.max - p.life) * 2);
    ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s * 0.3 * Math.abs(Math.cos(p.life * 7 + p.r)) - 0.5, p.s, p.s * 0.6 * Math.abs(Math.cos(p.life * 7 + p.r)) + 1); ctx.restore();
  }
  ctx.globalAlpha = 1;
};

// ---------------------------------------------------------------- camera: eased moves, a zoom "punch", and momentum after a flick
// focus(x, y, {z, go, hold, back}): glide there; with back, glide home again afterwards. Any touch cancels it.
FX.focus = function (x, y, o) {
  o = o || {}; const c = R.cam;
  FX.vel = null;
  FX.camJob = { x0: c.x, y0: c.y, z0: c.z, x1: x, y1: y, z1: o.z || c.z, go: o.go || 0.55, hold: o.hold || 0, back: !!o.back, t: 0 };
};
FX.zoomPunch = function (amt) { if (!FX.punch && !FX.camJob) FX.punch = { t: 0, z0: R.cam.z, a: amt || 0.045 }; };
FX.cancelCam = function () { FX.camJob = null; FX.vel = null; if (FX.punch) { R.cam.z = FX.punch.z0; FX.punch = null; } };
FX.drag = function (dx, dy) {
  const now = performance.now(), v = FX._dv, dtm = v ? Math.max(4, now - v.at) : 16;
  const vx = dx / dtm * 1000, vy = dy / dtm * 1000;
  FX._dv = { vx: v && now - v.at < 90 ? v.vx * 0.5 + vx * 0.5 : vx, vy: v && now - v.at < 90 ? v.vy * 0.5 + vy * 0.5 : vy, at: now };
};
FX.fling = function () {
  const v = FX._dv; FX._dv = null;
  if (v && performance.now() - v.at < 70 && Math.hypot(v.vx, v.vy) > 90) { const k = Math.min(1, 2400 / Math.hypot(v.vx, v.vy)); FX.vel = { vx: v.vx * k, vy: v.vy * k }; }
};
FX.cam = function (dt) {
  const c = R.cam, J = FX.camJob;
  if (J) {
    J.t += dt;
    const total = J.go + J.hold + (J.back ? J.go : 0);
    let f;
    if (J.t < J.go) f = EASE.inOut(J.t / J.go);
    else if (J.t < J.go + J.hold || !J.back) f = 1;
    else f = 1 - EASE.inOut(Math.min(1, (J.t - J.go - J.hold) / J.go));
    c.x = J.x0 + (J.x1 - J.x0) * f; c.y = J.y0 + (J.y1 - J.y0) * f; c.z = J.z0 + (J.z1 - J.z0) * f;
    if (J.t >= total) FX.camJob = null;
    R.clampCam();
  } else if (FX.vel) {
    c.x += FX.vel.vx * dt; c.y += FX.vel.vy * dt; R.clampCam();
    const k = Math.exp(-dt * 4.5); FX.vel.vx *= k; FX.vel.vy *= k;
    if (Math.hypot(FX.vel.vx, FX.vel.vy) < 12) FX.vel = null;
  }
  const P = FX.punch;
  if (P) { P.t += dt; const f = P.t / 0.55; if (f >= 1) { c.z = P.z0; FX.punch = null; } else c.z = P.z0 * (1 + P.a * Math.sin(f * Math.PI) * (1 - f * 0.3)); }
  // the music grows with the farm
  AUDIO.rich = !UI.inGame ? 2 : S.level >= 20 ? 4 : S.level >= 12 ? 3 : S.level >= 6 ? 2 : S.level >= 2 ? 1 : 0;
};

// ---------------------------------------------------------------- what the world does when things happen
function dustRing(x, y, w, n) {
  for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2; addPart({ type: 'poof', x: x + Math.cos(a) * w * 0.45, y: y - 5 + Math.sin(a) * 7, vx: Math.cos(a) * 46, vy: Math.sin(a) * 9, max: 0.75 + Math.random() * 0.3, size: 9 + Math.random() * 6 }); }
}
FX.cheerAll = function (sec, x, y, r) {
  for (const m of S.meeples) if (x == null || Math.hypot(m.x - x, m.y - y) < r) FX.cheer[m.id] = R.time + sec * (0.8 + Math.random() * 0.4);
};
const _oe6 = R.onEvent;
R.onEvent = function (e) {
  switch (e.t) {
    case 'plant': FX.pop('p' + e.i, 'in', 0.42); AUDIO.sfx('plant'); break;
    case 'ripe': FX.pop('p' + e.i, 'wobble', 0.7, 0.2); break;
    case 'water': FX.pop('p' + e.i, 'wobble', 0.45, 0.1); break;
    case 'mend': FX.pop('p' + e.i, 'spring', 0.45, 0.1); break;
    case 'harvest': FX.pop('p' + e.i, 'spring', 0.5, 0.17); if (e.m) FX.hop[e.m] = R.time; break;
    case 'crafted': FX.pop('b' + e.b, 'bounce', 0.6, 0.14); break;
    case 'supply': FX.pop('b' + e.b, 'bounce', 0.3, 0.05); break;
    case 'deposit': { for (const b of S.buildings) if (b.type === 'storehouse' && Math.abs((b.x + 1) * T - e.x) < T * 2.2 && Math.abs((b.y + 1) * T - e.y) < T * 2.2) { FX.pop('b' + b.id, 'bounce', 0.28, 0.045); break; } break; }
    case 'build': if (e.type === 'plot' || e.type === 'path') { const i = idx(Math.floor(e.x), Math.floor(e.y)); FX.pop('p' + i, 'in', 0.4); } break;
    case 'clear': { const x = e.i % MW, y = (e.i / MW) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (inMap(x + dx, y + dy)) FX.pop('c' + idx(x + dx, y + dy), 'wobble', 0.55, 0.07); break; }
    case 'hammer': {
      const F = SITEFX[e.b]; if (F) F.from.push({ x: e.x, y: e.y, face: e.face || 1, t: R.time });
      const col = e.dig ? ['#8a6a3c', '#a98a5c'] : ['#d8b070', '#c89858', '#fff0c8'];
      for (let k = 0; k < (e.dig ? 4 : 2) * R.q.parts + 1; k++) addPart({ type: 'chip', x: e.x + (e.face || 1) * 10, y: e.y - 12, vx: (e.face || 1) * (10 + Math.random() * 40) + (Math.random() - 0.5) * 30, vy: -40 - Math.random() * 50, g: 300, max: 0.5, col: col[(Math.random() * col.length) | 0], size: 1.6, vr: 10 });
      AUDIO.sfx(e.dig ? 'dig' : 'tap');
      break;
    }
    case 'built': {
      const b = BMAP[e.b]; delete SITEFX[e.b]; if (!b) break;
      const d = BUILDINGS[b.type], bx = (b.x + d.w / 2) * T, by = (b.y + d.h) * T, W = d.w * T;
      FX.pop('b' + b.id, 'bounce', 0.9, 0.2);
      dustRing(bx, by, W + 20, 14);
      // the scaffolding comes clattering down
      for (let k = 0; k < 12; k++) addPart({ type: 'chip', x: bx + (k % 2 ? 1 : -1) * (W / 2 + 2), y: by - 10 - Math.random() * 70, vx: (k % 2 ? 1 : -1) * (20 + Math.random() * 50), vy: -30 - Math.random() * 60, g: 420, max: 0.9, col: k % 3 ? '#c0905a' : '#a67a48', size: 5, vr: (Math.random() - 0.5) * 16 });
      for (let k = 0; k < 16; k++) addPart({ type: 'spark', x: bx + (Math.random() - 0.5) * W * 1.1, y: by - 10 - Math.random() * 80, max: 1.1 + Math.random() * 0.4, size: 5 + Math.random() * 3 });
      AUDIO.sfx('thud'); AUDIO.sfx('built');
      for (const id of e.who || []) FX.cheer[id] = R.time + 1.5;
      break;
    }
    case 'meeple': {
      FX.born[e.m.id] = R.time;
      const cr = S.buildings.find(b => b.type === 'creator'); if (cr) FX.pop('b' + cr.id, 'bounce', 0.7, 0.18);
      FX.cheerAll(1.3, e.m.x, e.m.y, T * 6); delete FX.cheer[e.m.id];
      break;
    }
    case 'sold': return;   // coins fly to the purse instead (see ui4.js)
  }
  _oe6(e);
};

// ---------------------------------------------------------------- a laurel wreath for a Meeple with 1,000 harvests
HAT_DRAW.laurel = function (g) {
  for (const side of [-1, 1]) for (let k = 0; k < 4; k++) {
    const a = 0.25 + k * 0.38, x = side * Math.cos(a) * 6.6, y = -4.4 - Math.sin(a) * 4.6;
    leaf(g, x, y, side > 0 ? Math.PI - a - 0.5 : a + 0.5 - Math.PI * 0, 4.2, 1.9, k % 2 ? '#e8c84a' : '#d0a830');
  }
  ell(g, 0, -9.3, 1.3, 1.3, '#f6de7a', INK, 0.4);
};
;(window.__stage = window.__stage || []).push('fx.js loaded');
