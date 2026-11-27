// Meeple Meadows — art, part 6: plants that really grow.
// Every crop is drawn from a single growth value (0 = just sown, 1 = ready to pick), so a plant can be shown
// at any moment of its life: the seed, the crook of the first shoot, seed leaves, true leaves one after
// another, buds, open flowers, fruit setting, swelling and colouring. Orchard saplings and the cottage too.
'use strict';

const GROW_N = 14;                       // pictures of a plant between sowing and ripe (ripe is one more)
const TAU6 = Math.PI * 2;
const gPh = (v, a, b) => v <= a ? 0 : v >= b ? 1 : (v - a) / (b - a);
const gSm = x => x * x * (3 - 2 * x);
const gFol = v => gSm(gPh(v, 0.1, 0.62));                                           // how much of the foliage is there
const gFan = (i, n, spread) => -Math.PI / 2 + (n > 1 ? (i / (n - 1) - 0.5) * 2 * spread : 0);
const gK = (v, k, n) => v - (n > 1 ? (k / (n - 1) - 0.5) * 0.09 : 0);              // flowers on one plant open a little apart
const gMix3 = (a, b, c, t) => t < 0.5 ? mix(a, b, t * 2) : mix(b, c, t * 2 - 1);
// where a plant picks up again after a harvest that leaves it standing
const REGROW_FROM = { rice: 0.3, hops: 0.24, lettuce: 0.42, kale: 0.45, tea: 0.5, grapes: 0.46, lavender: 0.42 };

// ---------------------------------------------------------------- pieces
function gFlower(g, x, y, r, petal, mid, open, n = 5) {
  const rr = r * (0.42 + 0.58 * open);
  for (let k = 0; k < n; k++) { const a = k / n * TAU6 - 1.57; ell(g, x + Math.cos(a) * rr * 0.55, y + Math.sin(a) * rr * 0.55, rr * 0.5, rr * 0.5, petal, rgba(INK, 0.35), 0.25); }
  ell(g, x, y, rr * 0.32, rr * 0.32, mid);
}
function gFruit(g, x, y, r, col, shine) {
  blob(g, x, y, r, col, 0.4, -0.3); g.beginPath(); g.arc(x, y, r, 0, TAU6); stroke(g, rgba(INK, 0.8), 0.4);
  if (shine && r > 1.3) ell(g, x - r * 0.35, y - r * 0.4, r * 0.28, r * 0.2, 'rgba(255,255,255,0.6)');
}
// One flower that turns into one fruit.
// o: p petal, m middle, n petals, fs flower size, bud colour, r ripe radius, g unripe colour, mid half-ripe colour, c ripe colour, draw(g, x, y, r, col, rp)
function gSet(g, x, y, v, ripe, o) {
  const fr = ripe ? 1 : gPh(v, 0.72, 0.95);
  if (fr > 0) {
    const rp = ripe ? 1 : gSm(gPh(v, 0.86, 1.02)), r = o.r * (0.28 + 0.72 * gSm(fr)), col = o.mid ? gMix3(o.g, o.mid, o.c, rp) : mix(o.g, o.c, rp);
    if (fr < 0.3 && o.p) ell(g, x + 0.3, y + r + 0.5, 1, 0.7, shade(o.p, -0.3));          // the spent flower still hanging on
    if (o.draw) o.draw(g, x, y, r, col, rp); else gFruit(g, x, y, r, col, rp > 0.5);
    return;
  }
  const bud = gPh(v, 0.46, 0.56); if (bud <= 0) return;
  const open = gPh(v, 0.55, 0.64), fs = o.fs || 2.2;
  if (open <= 0) ell(g, x, y, fs * 0.3 * (0.5 + bud * 0.5), fs * 0.42 * (0.5 + bud * 0.5), o.bud || '#8cc060', rgba(INK, 0.5), 0.3);
  else gFlower(g, x, y, fs, o.p, o.m || '#f2d23a', open, o.n || 5);
}
// a feathery leaf: a rib with pairs of leaflets
function gFrond(g, x, y, ang, len, col, pairs, wide = 1) {
  g.save(); g.translate(x, y); g.rotate(ang);
  g.beginPath(); g.moveTo(0, 0); g.lineTo(len, 0); stroke(g, shade(col, -0.3), 0.7);
  for (let k = 1; k <= pairs; k++) {
    const d = len * k / (pairs + 0.6), w = (len * 0.24 * (1 - k / (pairs + 2)) + 1.2) * wide;
    leaf(g, d, 0, -0.95, w, 0.8 + w * 0.26 * wide, col, false); leaf(g, d, 0, 0.95, w, 0.8 + w * 0.26 * wide, col, false);
  }
  leaf(g, len * 0.78, 0, 0, len * 0.3 + 1, 1 * wide, col, false);
  g.restore();
}
// the top of a root or bulb showing at the soil line
function gCrown(g, x, y, r, col, ripe) {
  g.beginPath(); g.ellipse(x, y, r, r * 0.85, 0, Math.PI, TAU6); g.closePath();
  g.fillStyle = rgrad(g, x, y, r, [shade(col, 0.3), col, shade(col, -0.3)], x - r * 0.3, y - r * 0.5); g.fill(); stroke(g, INK, 0.55);
  if (ripe) { g.beginPath(); g.moveTo(x - r - 2.2, y + 0.9); g.lineTo(x - r - 0.5, y + 0.1); g.moveTo(x + r + 2.4, y + 1); g.lineTo(x + r + 0.6, y + 0.2); stroke(g, rgba('#3a2414', 0.75), 0.5); }
}
// grasses: tillers, stalks, ears that come out green, fill, turn gold and nod
function gCereal(g, v, ripe, o) {
  const n = 1 + Math.round(gPh(v, 0.16, 0.46) * (o.n - 1)), h = 5 + (o.h - 5) * gSm(gPh(v, 0.16, 0.66)), ear = gPh(v, 0.58, 0.8);
  const gold = ripe ? 1 : gSm(gPh(v, 0.8, 1.02)), stalk = mix(o.green, o.gold, gold * 0.9), ec = mix(o.eg, o.ec, gold), nod = (ripe ? 1 : gPh(v, 0.8, 1)) * o.nod;
  for (let i = 0; i < n; i++) {
    const rel = n > 1 ? i / (n - 1) - 0.5 : 0, bx = rel * 3, hh = h * (1 - Math.abs(rel) * 0.14), tx = rel * (4 + hh * 0.3);
    leaf(g, bx, 0, -Math.PI / 2 + rel * 1.2 + (i % 2 ? 0.55 : -0.55), hh * 0.5, 1.1, mix(o.green, o.gold, gold * 0.6), false);
    const dir = rel >= 0 ? 1 : -1, ex = tx + nod * dir * 3.2, ey = -hh + nod * 2.4, cx = tx * 0.8, cy = -hh * 0.6;
    g.beginPath(); g.moveTo(bx, 0); g.quadraticCurveTo(cx, cy, ex, ey); stroke(g, stalk, 0.9);
    if (ear <= 0) { leaf(g, ex, ey, Math.atan2(ey - cy, ex - cx), 3.5, 0.8, o.green, false); continue; }
    g.save(); g.translate(ex, ey); g.rotate(Math.atan2(ey - cy, ex - cx) + nod * dir * 0.5);
    const K = Math.max(1, Math.round((o.el || 6) * ear / 1.5));
    if (o.awn) for (let k = 0; k < K; k++) { g.beginPath(); g.moveTo(k * 1.5, 0); g.lineTo(k * 1.5 + o.awn * ear, (k % 2 ? 1 : -1) * o.awn * 0.42 * ear); stroke(g, rgba(ec, 0.95), 0.35); }
    for (let k = 0; k < K; k++) ell(g, 0.6 + k * 1.5, k % 2 ? 0.65 : -0.65, 1.05 + gold * 0.2, 0.8 + gold * 0.15, ec, shade(ec, -0.42), 0.35);
    g.restore();
  }
}
// a small tree: a whip first, then a crown one clump at a time. Returns its size.
function gTreelet(g, v, leafCol, crown, bark) {
  const s = gFol(v), th = 3 + 9.5 * s, tw = 0.9 + 1.9 * s;
  g.beginPath(); g.moveTo(-tw / 2 - 0.4, 0); g.lineTo(-tw / 2 + 0.2, -th); g.lineTo(tw / 2 - 0.2, -th); g.lineTo(tw / 2 + 0.4, 0); g.closePath(); g.fillStyle = bark || '#7a5232'; g.fill(); stroke(g, INK, 0.5);
  if (s < 0.22) {
    leaf(g, 0, -th, -2.3, 3 + 7 * s, 1.5 + 2.4 * s, leafCol); leaf(g, 0, -th, -0.85, 3 + 7 * s, 1.5 + 2.4 * s, shade(leafCol, 0.12));
    if (s > 0.1) leaf(g, 0, -th * 0.6, -2.7, 4, 1.6, leafCol);
    return s;
  }
  const P = [[0, -17], [-5, -15], [5, -16], [0, -21.5], [-2.5, -13.5], [3, -13]], n = Math.min(P.length, 1 + Math.floor((s - 0.22) / 0.78 * 5.99));
  for (let i = 0; i < n; i++) blob(g, P[i][0] * s, P[i][1] * s, (crown || 7) * s * (i < n - 1 || s >= 0.98 ? 1 : 0.72), i % 2 ? leafCol : shade(leafCol, 0.07), 0.3, -0.3);
  return s;
}
const TREELET_SPOTS = [[-6, -14], [5, -18], [1, -12], [-1, -22], [6, -12]];
function gPost(g, x, h, w = 2) { g.fillStyle = '#8a6a42'; g.fillRect(x - w / 2, -h, w, h); g.strokeStyle = INK; g.lineWidth = 0.5; g.strokeRect(x - w / 2, -h, w, h); }
// a runner creeping out along the ground both ways from the root; returns a function giving points along it
function gVine(g, v, leafCol) {
  const s = gFol(v), L = 4 + 24 * s;
  const P = t => { const u = 1 - t; return [u * u * u * -14 + 3 * u * u * t * -6 + 3 * u * t * t * 2 + t * t * t * 14, u * u * u * 2 + 3 * u * u * t * -4 + 3 * u * t * t * 4 + t * t * t * -2]; };
  const t0 = 0.5 - L / 56, t1 = 0.5 + L / 56;
  g.beginPath(); for (let i = 0; i <= 12; i++) { const q = P(t0 + (t1 - t0) * i / 12); if (i) g.lineTo(q[0], q[1]); else g.moveTo(q[0], q[1]); } stroke(g, '#5a8a2a', 1.3);
  const n = 1 + Math.round(s * 4);
  for (let i = 0; i < n; i++) { const q = P(n > 1 ? t0 + (t1 - t0) * i / (n - 1) : 0.5); blob(g, q[0], q[1] - 3 - (i % 2) * 2, 2 + 2.6 * s, i % 2 ? leafCol : shade(leafCol, 0.08), 0.3, -0.25); }
  if (s > 0.45) { const q = P(t1); g.beginPath(); g.arc(q[0] + 1.2, q[1] - 1.4, 1.3, 0.5, 5); stroke(g, '#7aa83a', 0.5); }
  return P;
}
function gKaleLeaf(g, ang, p, col) {
  g.save(); g.rotate(ang);
  g.beginPath(); g.moveTo(0, 0);
  for (let k = 0; k <= 6; k++) g.lineTo(-(Math.sin(k / 6 * Math.PI) * 4 + 0.6 + (k % 2) * 1.2) * p, -k * 2.4 * p);
  for (let k = 6; k >= 0; k--) g.lineTo((Math.sin(k / 6 * Math.PI) * 4 + 0.6 + (k % 2) * 1.2) * p, -k * 2.4 * p);
  g.closePath(); g.fillStyle = col; g.fill(); stroke(g, shade('#3f7a4a', -0.5), 0.5);
  g.beginPath(); g.moveTo(0, -1); g.lineTo(0, -13 * p); stroke(g, rgba('#d8ecc8', 0.7), 0.5);
  g.restore();
}
// the first days are much the same for everything: a seed, a crook pushing up, two seed leaves
function gSeedling(g, v, crop, grass) {
  ell(g, 0, 0.6, 3.6, 1.7, '#6a4528');
  if (v < 0.05) { ell(g, -1, 0, 0.75, 0.55, '#e8d8a0'); ell(g, 1.2, 0.6, 0.7, 0.5, '#d8c890'); return; }
  const u = gPh(v, 0.05, 0.2), h = 1.5 + 4.5 * u;
  if (grass) { leaf(g, 0, 0, -Math.PI / 2 - 0.12, h + 2.5, 0.9, crop.leaf, false); if (u > 0.5) leaf(g, 0.4, 0, -Math.PI / 2 + 0.42, h, 0.8, shade(crop.leaf, 0.12), false); return; }
  if (u < 0.35) {
    g.beginPath(); g.moveTo(0, 0.3); g.quadraticCurveTo(-0.5, -h - 1, 1.7, -h + 0.6); stroke(g, '#b8d880', 1.1);
    ell(g, 1.9, -h + 1, 1, 0.75, '#d8c890', rgba(INK, 0.5), 0.3);
    return;
  }
  g.beginPath(); g.moveTo(0, 0.3); g.lineTo(0, -h); stroke(g, '#9aca60', 0.9);
  const op = gPh(u, 0.35, 1);
  leaf(g, 0, -h, -Math.PI / 2 - 0.25 - op * 0.95, 2 + 2.8 * op, 1 + 0.9 * op, crop.leaf);
  leaf(g, 0, -h, -Math.PI / 2 + 0.25 + op * 0.95, 2 + 2.8 * op, 1 + 0.9 * op, shade(crop.leaf, 0.15));
}
const GRASSY = { wheat: 1, barley: 1, rice: 1, flax: 1, garlic: 1, corn: 1 };

// ---------------------------------------------------------------- the crops
const GROW = {
  carrot(g, v, ripe) {
    const s = gFol(v), n = 2 + Math.round(s * 4), sh = ripe ? 1 : gPh(v, 0.5, 0.97), r = 1 + 3 * sh, cy = 1.2 - sh * 0.8, top = sh > 0 ? cy - r * 0.6 : 0;
    for (let i = 0; i < n; i++) gFrond(g, 0, top, gFan(i, n, 0.22 + 0.42 * s), (5 + 12 * s) * (1 - 0.14 * Math.abs(i - (n - 1) / 2)), i % 2 ? '#5aa335' : '#6cbf45', 1 + Math.round(s * 2), 0.8);
    if (sh > 0) gCrown(g, 0, cy, r, mix('#f8d2a4', '#f07a2a', gSm(sh)), ripe);
  },
  parsnip(g, v, ripe) {
    const s = gFol(v), n = 2 + Math.round(s * 3), sh = ripe ? 1 : gPh(v, 0.5, 0.97), r = 1 + 3.2 * sh, cy = 1.2 - sh * 0.8, top = sh > 0 ? cy - r * 0.6 : 0;
    for (let i = 0; i < n; i++) gFrond(g, 0, top, gFan(i, n, 0.25 + 0.5 * s), (4 + 10 * s) * (1 - 0.14 * Math.abs(i - (n - 1) / 2)), i % 2 ? '#6aa84a' : '#78b656', 1 + Math.round(s * 1.4), 1.35);
    if (sh > 0) gCrown(g, 0, cy, r, mix('#f8f0d8', '#efe0b0', gSm(sh)), ripe);
  },
  sugarbeet(g, v, ripe) {
    const s = gFol(v), n = 2 + Math.round(s * 4), sh = ripe ? 1 : gPh(v, 0.48, 0.97), cy = 0.8 - sh * 1.5, r = 1 + 3.4 * sh, top = sh > 0 ? cy - r * 0.45 : 0;
    if (sh > 0) gCrown(g, 0, cy, r, mix('#e8a8c0', '#c2306a', gSm(sh)), ripe);
    for (let i = 0; i < n; i++) {
      const a = gFan(i, n, 0.3 + 0.6 * s), L = 4 + 12 * s;
      g.beginPath(); g.moveTo(0, top); g.lineTo(Math.cos(a) * L * 0.5, top + Math.sin(a) * L * 0.5); stroke(g, '#c2306a', 0.9);
      leaf(g, Math.cos(a) * L * 0.3, top + Math.sin(a) * L * 0.3, a, L * 0.75, 1.2 + 3.4 * s, i % 2 ? '#4a9a3c' : '#5aaa48');
    }
  },
  garlic(g, v, ripe) {
    const s = gFol(v), n = 2 + Math.round(s * 3), sh = ripe ? 1 : gPh(v, 0.55, 0.97), old = ripe ? 1 : gPh(v, 0.84, 1.02), sc = gPh(v, 0.6, 0.78), top = -sh * 2.4;
    for (let i = 0; i < n; i++) {
      const rel = n > 1 ? i / (n - 1) - 0.5 : 0, L = (5 + 13 * s) * (1 - Math.abs(rel) * 0.3);
      leaf(g, rel * 1.6, top, -Math.PI / 2 + rel * 1.25, L, 1.3, mix('#7fae4c', '#c8b060', old * Math.abs(rel) * 1.7), false);
    }
    if (sc > 0) {      // the scape curls over before the bulb is ready
      const H = (9 + 6 * s) * sc; g.beginPath(); g.moveTo(0.3, top); g.quadraticCurveTo(0.6, top - H, 3.2 * sc, top - H - 1.5); g.arc(3.2 * sc + 1.6, top - H - 0.4, 1.9, Math.PI + 0.5, Math.PI * 2.6 * sc + 0.3); stroke(g, '#8fc05a', 0.8);
      if (sc >= 1) ell(g, 3.2 + 3.1, top - H + 1.3, 1, 1.5, '#e8f0c8', rgba(INK, 0.5), 0.3);
    }
    if (sh > 0) {
      const r = 1 + 3.3 * sh, cy = 0.9 - sh * 0.6; gCrown(g, 0, cy, r, '#efe6d2', ripe);
      if (sh > 0.5) { g.beginPath(); g.moveTo(-r * 0.4, cy - 0.3); g.quadraticCurveTo(-r * 0.3, cy - r * 0.6, 0, cy - r * 0.8); g.moveTo(r * 0.45, cy - 0.3); g.quadraticCurveTo(r * 0.3, cy - r * 0.6, 0, cy - r * 0.8); stroke(g, rgba('#a86a9a', 0.7), 0.45); }
    }
  },
  potato(g, v, ripe) {
    const s = gFol(v), n = 3 + Math.round(s * 5), hill = gPh(v, 0.3, 0.7), old = ripe ? 1 : gPh(v, 0.88, 1.02), tb = ripe ? 1 : gPh(v, 0.8, 1);
    ell(g, 0, 1, 4 + 5 * hill, 1.4 + 1.7 * hill, '#7a5232');                       // earthed up as it grows
    for (let i = 0; i < n; i++) leaf(g, 0, -1 - hill, gFan(i, n, 0.5 + 0.75 * s), 3 + 8 * s, 1.4 + 2.8 * s, mix(i % 2 ? '#4f8f3a' : '#5fa046', '#b0aa48', old * 0.55));
    [[-5, -10], [3, -12], [6, -7]].forEach(([x, y], k) => {
      const vk = gK(v, k, 3), open = gPh(vk, 0.5, 0.6), gone = ripe ? 1 : gPh(vk, 0.76, 0.86);
      if (open > 0 && gone < 1) gFlower(g, x * s, y * s, 2.5, '#f4f0ff', '#f2d23a', open * (1 - gone));
    });
    if (tb > 0) [[-6, 1.3, 2.7], [5.6, 1.7, 2.3], [0.5, 2.5, 2]].forEach(([x, y, r], k) => {
      if (tb < k * 0.3) return;
      const q = ripe ? 1 : 0.7; ell(g, x, y, r * q, r * 0.72 * q, '#c69a62', INK, 0.5); ell(g, x - 0.6, y - 0.4, 0.35, 0.3, '#8a6238');
    });
  },
  cabbage(g, v, ripe) {
    const s = gFol(v), n = 3 + Math.round(s * 5), hd = ripe ? 1 : gPh(v, 0.45, 0.95);
    for (let i = 0; i < n; i++) leaf(g, 0, -1, gFan(i, n, 0.7 + 0.78 * s), 3.5 + 7.5 * s, 1.8 + 3.6 * s, i % 2 ? '#6fb352' : '#62a548', false);
    if (hd <= 0) return;
    const r = 1.5 + 5.2 * gSm(hd), cy = -2 - r * 0.6;
    blob(g, 0, cy, r, mix('#8fcf6a', '#c2e8a0', hd), 0.3, -0.22); g.beginPath(); g.arc(0, cy, r, 0, TAU6); stroke(g, shade('#6fb352', -0.4), 0.55);
    if (hd > 0.4) { g.beginPath(); g.arc(-r * 0.15, cy + r * 0.1, r * 0.6, -2.7, -0.5); stroke(g, rgba('#eef8dc', 0.9), 0.5); g.beginPath(); g.arc(r * 0.25, cy - r * 0.1, r * 0.55, 0.5, 2.2); stroke(g, rgba('#5a9a42', 0.6), 0.45); }
    if (hd > 0.6) { leaf(g, -r * 0.95, -1.2, -1.05, r * 1.5, r * 0.5, '#6fb352', false); leaf(g, r * 0.95, -1.2, -2.09, r * 1.5, r * 0.5, '#62a548', false); }
  },
  lettuce(g, v, ripe) {
    const s = gFol(v), n = 3 + Math.round(s * 6), hd = ripe ? 1 : gPh(v, 0.5, 0.96);
    for (let i = 0; i < n; i++) {
      const a = gFan(i, n, 0.75 + 0.7 * s), L = 3 + 7 * s, col = i % 2 ? '#8acc5a' : '#a8dc6a';
      leaf(g, 0, -2, a, L, 1.8 + 3.4 * s, col, false);
      if (s > 0.45) { const tx = Math.cos(a) * L * 0.92, ty = -2 + Math.sin(a) * L * 0.92; g.beginPath(); g.arc(tx, ty, 1.5 * s, a - 1.7, a + 1.7); stroke(g, shade(col, 0.3), 0.7); }      // frilled edge
    }
    if (hd > 0) { const r = 1.2 + 3.6 * gSm(hd); blob(g, 0, -3 - r * 0.2, r, mix('#b8e070', '#dcf29a', hd), 0.3, -0.15); g.beginPath(); g.arc(0, -3 - r * 0.2, r, 0, TAU6); stroke(g, shade('#7cc04a', -0.4), 0.5);
      for (let k = 0; k < 3; k++) { g.beginPath(); g.arc((k - 1) * r * 0.45, -3 - r * 0.3, r * 0.5, -2.4, -0.7); stroke(g, rgba('#f2fbd0', 0.85), 0.45); } }
  },
  kale(g, v, ripe) {
    const s = gFol(v), n = 1 + Math.round(s * 4), st = 3.5 * gPh(v, 0.4, 1), col = mix('#6aaa62', '#3f7a4a', ripe ? 1 : gPh(v, 0.5, 1));
    if (st > 0.3) { g.beginPath(); g.moveTo(0, 0.5); g.lineTo(0, -st); stroke(g, INK, 2.4); g.beginPath(); g.moveTo(0, 0.5); g.lineTo(0, -st); stroke(g, '#8ab06a', 1.5); }
    g.save(); g.translate(0, -st);
    for (let i = 0; i < n; i++) { const rel = n > 1 ? i / (n - 1) - 0.5 : 0; gKaleLeaf(g, rel * (0.5 + 1.0 * s), (0.3 + 0.7 * s) * (1 - Math.abs(rel) * 0.25), i % 2 ? col : shade(col, 0.1)); }
    if (ripe || v > 0.8) gKaleLeaf(g, 0, 0.45, shade(col, 0.28));                    // a young leaf at the heart
    g.restore();
  },
  strawberry(g, v, ripe) {
    const s = gFol(v), n = 2 + Math.round(s * 4);
    if (s > 0.6) { const L = 9 * gPh(s, 0.6, 1); g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(L * 0.5, -3, L, 1.2); stroke(g, '#c86a5a', 0.6); if (L > 6) { leaf(g, L, 1.2, -2.2, 2.6, 1.2, '#4aa848', false); leaf(g, L, 1.2, -0.9, 2.6, 1.2, '#4aa848', false); } }    // a runner with a daughter plant
    for (let i = 0; i < n; i++) {
      const a = gFan(i, n, 0.6 + 0.75 * s), L = 2.5 + 6 * s, x = Math.cos(a) * L, y = -1 + Math.sin(a) * L;
      g.beginPath(); g.moveTo(0, -1); g.lineTo(x, y); stroke(g, '#5a9a3a', 0.6);
      for (let k = -1; k <= 1; k++) leaf(g, x, y, a + k * 0.85, 1.6 + 2.8 * s, 1 + 1.6 * s, k ? '#3f9a3e' : '#4aa848', false);       // three leaflets
    }
    const o = { p: '#ffffff', m: '#f2d23a', fs: 2.3, r: 2.7, g: '#e8ecc0', mid: '#f0a090', c: '#e8344a', draw(g2, x, y, r, col, rp) {
      g2.beginPath(); g2.moveTo(x, y + r * 1.25); g2.bezierCurveTo(x - r * 1.3, y, x - r * 0.9, y - r * 1.1, x, y - r * 0.8); g2.bezierCurveTo(x + r * 0.9, y - r * 1.1, x + r * 1.3, y, x, y + r * 1.25); g2.fillStyle = col; g2.fill(); stroke(g2, INK, 0.5);
      leaf(g2, x, y - r * 0.8, -2.5, r * 0.9, r * 0.35, '#3f9a3e', false); leaf(g2, x, y - r * 0.8, -0.64, r * 0.9, r * 0.35, '#3f9a3e', false);
      if (rp > 0.6) for (let k = 0; k < 4; k++) ell(g2, x + (k % 2 - 0.5) * r * 0.7, y - r * 0.2 + (k >> 1) * r * 0.55, 0.22, 0.3, '#ffe9a0');
    } };
    [[-4.6, -0.5], [4.4, 0.6], [0, -1.5]].forEach(([x, y], k) => gSet(g, x, y - (ripe || v > 0.72 ? 0 : 5 * s), gK(v, k, 3), ripe, o));
  },
  tomato(g, v, ripe) {
    const s = gFol(v), h = 4 + 24 * s;
    gPost(g, -1.6, 29, 1.6);
    g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(1.6, -h * 0.5, 0, -h); stroke(g, INK, 2); g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(1.6, -h * 0.5, 0, -h); stroke(g, '#4a8a2a', 1.2);
    for (let k = 0; k < Math.floor(h / 4); k++) { const sd = k % 2 ? 1 : -1, y = -2.5 - k * 4; leaf(g, sd * 0.6, y, sd > 0 ? -0.42 : Math.PI + 0.42, 3 + 4 * Math.min(1, (h + y) / 9 + 0.25), 2.6, k % 3 ? '#4a9a3a' : '#57a846'); }
    if (h > 12) { g.beginPath(); g.moveTo(-2.4, -h * 0.55); g.lineTo(1.4, -h * 0.55 - 0.6); stroke(g, '#e8dcc0', 0.7); }              // tied to the stake
    const o = { p: '#f2d23a', m: '#e8a020', fs: 2.1, r: 2.7, g: '#8cba40', mid: '#f0a030', c: '#e23a2a' };
    [[4.6, -7], [-4.8, -10.5], [4.4, -15], [-4.2, -20], [3.6, -24]].forEach(([x, y], k) => { if (-y < h + 1) gSet(g, x, y, gK(v, k, 5), ripe, o); });
  },
  chili(g, v, ripe) {
    const s = gFol(v), h = 2 + 9 * s;
    g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -h); if (s > 0.4) { g.moveTo(0, -h * 0.6); g.lineTo(-4 * s, -h * 1.05); g.moveTo(0, -h * 0.7); g.lineTo(4.5 * s, -h * 1.1); } stroke(g, '#4a7a2a', 1.3);
    const n = 3 + Math.round(s * 6);
    for (let i = 0; i < n; i++) leaf(g, 0, -h * 0.65 - (i % 3) * 2 * s, gFan(i, n, 0.5 + 1.0 * s), 3 + 5.5 * s, 1.3 + 1.9 * s, i % 2 ? '#3e8a33' : '#4a9a3e');
    const o = { p: '#ffffff', m: '#c8d8a0', fs: 1.9, r: 1, g: '#5aa030', mid: '#c89a20', c: '#d8241c', draw(g2, x, y, r, col) {
      g2.save(); g2.translate(x, y); g2.scale(r, r); g2.beginPath(); g2.moveTo(-1.2, -2); g2.quadraticCurveTo(1.6, -2, 1, 2); g2.quadraticCurveTo(0, 5, -1, 5.5); g2.quadraticCurveTo(-1.6, 1, -1.2, -2); g2.fillStyle = col; g2.fill(); g2.restore();
      g2.save(); g2.translate(x, y); g2.scale(r, r); g2.beginPath(); g2.moveTo(-1.2, -2); g2.quadraticCurveTo(1.6, -2, 1, 2); g2.quadraticCurveTo(0, 5, -1, 5.5); g2.quadraticCurveTo(-1.6, 1, -1.2, -2); g2.restore(); stroke(g2, INK, 0.5);
      ell(g2, x - 0.1 * r, y - 2.1 * r, 0.9 * r, 0.5 * r, '#4a8a2a');
    } };
    [[-5, -6], [4, -8], [-1, -3.5], [6, -3.5]].forEach(([x, y], k) => gSet(g, x * (0.6 + 0.4 * s), y * (0.6 + 0.4 * s), gK(v, k, 4), ripe, o));
  },
  cucumber(g, v, ripe) {
    const s = gFol(v);
    [-9, 9].forEach(x => gPost(g, x, 26, 1.8));
    g.strokeStyle = '#8a6a42'; g.lineWidth = 0.8; for (let y = -24; y < 0; y += 6) { g.beginPath(); g.moveTo(-9, y); g.lineTo(9, y + 4); g.moveTo(9, y); g.lineTo(-9, y + 4); g.stroke(); }
    const h = 3 + 22 * s;
    g.beginPath(); g.moveTo(-8, 0); for (let y = 0; y <= h; y += 2) g.lineTo(Math.sin(y * 0.36 - 1.4) * 8, -y); stroke(g, '#5a9a3a', 1);
    const n = Math.round(9 * s);
    for (let k = 0; k < n; k++) leaf(g, -8 + (k % 3) * 8, -4 - Math.floor(k / 3) * 7, k % 2 ? -0.6 : -2.5, 6, 3.2, k % 2 ? '#4f9a3a' : '#5aa846', false);
    if (s > 0.5) { g.beginPath(); g.arc(Math.sin(h * 0.36 - 1.4) * 8 + 1.5, -h - 1, 1.4, 1, 5.6); stroke(g, '#8cc05a', 0.5); }                   // a tendril feeling for the next rung
    const o = { p: '#f6d028', m: '#e8a020', fs: 2.2, r: 1, g: '#8cc050', c: '#4a9a30', draw(g2, x, y, r, col, rp) {
      rrect(g2, x - 1.7 * Math.sqrt(r), y - 4 * r, 3.4 * Math.sqrt(r), 8 * r, 1.6 * Math.sqrt(r)); g2.fillStyle = col; g2.fill(); stroke(g2, INK, 0.45);
      if (r > 0.7) for (let k = 0; k < 3; k++) ell(g2, x - 0.5 + (k % 2), y - 2.4 * r + k * 2.2 * r, 0.25, 0.25, shade(col, 0.4));
      if (rp < 0.5) ell(g2, x, y + 4 * r + 0.5, 0.9, 0.7, '#f6d028');                // the flower still on its tip
    } };
    [[-5, -12], [5, -18], [1, -7]].forEach(([x, y], k) => { if (-y < h + 2) gSet(g, x, y, gK(v, k, 3), ripe, o); });
  },
  wheat(g, v, ripe) { gCereal(g, v, ripe, { n: 5, h: 21, green: '#6a9a3a', gold: '#c8a040', eg: '#8fbf4a', ec: '#e9c25a', nod: 0.5, el: 7, awn: 2.2 }); },
  barley(g, v, ripe) { gCereal(g, v, ripe, { n: 5, h: 20, green: '#7aa040', gold: '#b8a060', eg: '#a7c25a', ec: '#d7bf7c', nod: 0.7, el: 6.5, awn: 4.5 }); },
  rice(g, v, ripe) {
    ell(g, 0, 1, 9, 3, rgba('#6aa8d0', 0.55)); ell(g, -3, 0.4, 2.6, 0.6, 'rgba(255,255,255,0.35)');
    gCereal(g, v, ripe, { n: 7, h: 19, green: '#6aaa4a', gold: '#c8b860', eg: '#a8c868', ec: '#efe3a8', nod: 1.05, el: 6, awn: 0 });
  },
  flax(g, v, ripe) {
    const n = 2 + Math.round(gPh(v, 0.16, 0.5) * 5), h = 5 + 15 * gSm(gPh(v, 0.16, 0.66)), gold = ripe ? 1 : gPh(v, 0.86, 1.02);
    for (let i = 0; i < n; i++) {
      const rel = n > 1 ? i / (n - 1) - 0.5 : 0, x = rel * 6, tx = rel * 14.5, hh = h * (1 - Math.abs(rel) * 0.1);
      g.beginPath(); g.moveTo(x, 0); g.quadraticCurveTo(x + rel * 3, -hh * 0.5, tx, -hh); stroke(g, mix('#7aa04a', '#c8b060', gold * 0.8), 0.9);
      for (let k = 1; k < hh / 4; k++) leaf(g, x + (tx - x) * (k * 4 / hh) * 0.8, -k * 4, k % 2 ? -0.5 : Math.PI + 0.5, 2.6, 0.7, '#7aa04a', false);
      const vk = gK(v, i, n), open = gPh(vk, 0.55, 0.64), boll = ripe ? (i % 3 ? 1 : 0) : gPh(vk, 0.78, 0.9) * (i % 3 ? 1 : 0.4);
      if (boll > 0.5) ell(g, tx, -hh, 1.3, 1.3, mix('#9ab850', '#d8b860', gold), rgba(INK, 0.6), 0.35);
      else if (open > 0) gFlower(g, tx, -hh, 2.6, '#6a8ad8', '#f6f0c0', open);
      else if (vk > 0.46) ell(g, tx, -hh, 0.8, 1.1, '#8aa8d8', rgba(INK, 0.5), 0.3);
    }
  },
  sunflower(g, v, ripe) {
    const s = gFol(v), h = 5 + 29 * gSm(gPh(v, 0.14, 0.7)), bud = gPh(v, 0.48, 0.6), open = gPh(v, 0.6, 0.82), seed = ripe ? 1 : gPh(v, 0.84, 1);
    const hx = seed * 2.4, hy = -h + seed * 2.6;
    g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(2.2, -h / 2, hx * 0.5, hy); stroke(g, INK, 2.9); g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(2.2, -h / 2, hx * 0.5, hy); stroke(g, '#4a8a2a', 1.9);
    for (let k = 0; k < Math.floor(h / 6.5); k++) leaf(g, 0.9, -4 - k * 6.5, k % 2 ? -0.35 : Math.PI + 0.35, 4 + 5.5 * s, 2 + 2.2 * s, k % 2 ? '#5a9a3a' : '#64a842');
    if (bud <= 0) { leaf(g, 0, -h, -2.2, 3.5, 1.5, '#64a842'); leaf(g, 0, -h, -0.94, 3.5, 1.5, '#5a9a3a'); return; }
    g.save(); g.translate(hx, hy);
    if (open <= 0) { for (let k = 0; k < 5; k++) leaf(g, 0, 0, -Math.PI / 2 + (k - 2) * 0.55, 2.5 + 2 * bud, 1.2, '#7aa83a', false); blob(g, 0, 0, 1.4 + 1.6 * bud, '#8ab040'); g.beginPath(); g.arc(0, 0, 1.4 + 1.6 * bud, 0, TAU6); stroke(g, INK, 0.4); g.restore(); return; }
    const pl = (1.2 + 4.8 * open) * (1 - seed * 0.18), pc = mix('#f6c81a', '#e0a818', seed), cr = 2.2 + 1.8 * open + seed * 0.7;
    for (let i = 0; i < 12; i++) { g.save(); g.rotate(i / 12 * TAU6); g.beginPath(); g.ellipse(0, -cr - pl * 0.45, 1.8, pl * 0.62, 0, 0, TAU6); g.fillStyle = pc; g.fill(); stroke(g, shade('#f6c81a', -0.5), 0.4); g.restore(); }
    blob(g, 0, 0, cr, mix('#9ab040', '#6a3a1a', gPh(v, 0.66, 0.86)), 0.3, -0.3); g.beginPath(); g.arc(0, 0, cr, 0, TAU6); stroke(g, INK, 0.4);
    if (seed > 0.3) { g.beginPath(); g.arc(0, 0, cr * 0.62, 0, TAU6); stroke(g, rgba('#2a1608', 0.6), 0.5); ell(g, 0, 0, cr * 0.3, cr * 0.3, '#3a2010'); }
    g.restore();
  },
  hops(g, v, ripe) {
    const s = gFol(v), h = 3 + 27 * s;
    gPost(g, 0, 31, 2);
    g.beginPath(); g.moveTo(0, 0); for (let y = 0; y <= h; y += 1.2) g.lineTo(Math.sin(y * 0.75) * 2.3, -y); stroke(g, '#4a8a2a', 1.1);        // the bine winds up clockwise
    for (let k = 0; k < Math.floor(h / 3.4); k++) { const sd = k % 2 ? 1 : -1; leaf(g, sd, -2 - k * 3.4, sd > 0 ? -0.3 : Math.PI + 0.3, 6.5, 2.8, k % 2 ? '#4f9a3a' : '#5aa846'); }
    const o = { p: '#e4f0b0', m: '#c8e080', n: 6, fs: 2, r: 1, g: '#8cc050', c: '#c4e870', draw(g2, x, y, r, col) {
      g2.beginPath(); g2.ellipse(x, y, 1.9 * r, 2.8 * r, 0, 0, TAU6); g2.fillStyle = col; g2.fill(); stroke(g2, shade('#a9d455', -0.5), 0.5);
      if (r > 0.6) { g2.beginPath(); g2.arc(x, y - 1.6 * r, 1.5 * r, 0.3, 2.84); g2.moveTo(x + 1.6 * r, y - 0.2 * r); g2.arc(x, y - 0.2 * r, 1.6 * r, 0.2, 2.94); stroke(g2, shade(col, -0.3), 0.35); }
    } };
    for (let k = 0; k < 5; k++) { const y = -6 - k * 4.6; if (-y < h) gSet(g, k % 2 ? 4.2 : -4.2, y, gK(v, k, 5), ripe, o); }
  },
  cotton(g, v, ripe) {
    const s = gFol(v), p = 0.25 + 0.75 * s;
    g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -14 * p); if (s > 0.35) { g.moveTo(0, -6 * p); g.lineTo(-6 * p, -12 * p); g.moveTo(0, -8 * p); g.lineTo(6 * p, -14 * p); } stroke(g, '#7a5a30', 1.2);
    const n = 2 + Math.round(s * 4);
    for (let i = 0; i < n; i++) leaf(g, (i % 3 - 1) * 4 * p, -6 * p - (i % 2) * 4 * p, -1.57 + (i - (n - 1) / 2) * 0.5, 6 * p, 2.6 * p, i % 2 ? '#6a8a3a' : '#78983e');
    [[-6, -13], [6, -15], [0, -16], [-2, -9], [4, -9]].forEach(([x, y], k) => {
      const vk = gK(v, k, 5), bud = gPh(vk, 0.46, 0.55), open = gPh(vk, 0.55, 0.62), blush = gPh(vk, 0.62, 0.7), boll = ripe ? 1 : gPh(vk, 0.7, 0.86), burst = ripe ? 1 : gPh(vk, 0.88, 1.0);
      if (burst > 0) { const r = 1.6 + 1.2 * burst; for (let q = 0; q < 3; q++) leaf(g, x, y + r * 0.5, -Math.PI / 2 + (q - 1) * 1.5, r * 1.2, r * 0.4, '#8a6a3a', false); blob(g, x, y, r, '#fbf8f0', 0.2, -0.12); g.beginPath(); g.arc(x, y, r, 0, TAU6); stroke(g, rgba(INK, 0.5), 0.4); if (burst > 0.6) { g.beginPath(); g.moveTo(x, y - r); g.lineTo(x, y + r * 0.6); g.moveTo(x - r * 0.8, y + r * 0.2); g.lineTo(x, y); g.lineTo(x + r * 0.8, y + r * 0.2); stroke(g, rgba('#c8c0b0', 0.9), 0.4); } }
      else if (boll > 0) { const r = 1 + 1.3 * boll; g.beginPath(); g.moveTo(x, y - r * 1.25); g.quadraticCurveTo(x + r * 1.2, y - r * 0.2, x, y + r); g.quadraticCurveTo(x - r * 1.2, y - r * 0.2, x, y - r * 1.25); g.fillStyle = '#7aa848'; g.fill(); stroke(g, INK, 0.45); }
      else if (open > 0) gFlower(g, x, y, 2.6, mix('#fdf6d8', '#f0a0b8', blush), '#a83a5a', open);      // cream the first day, pink the next
      else if (bud > 0) ell(g, x, y, 0.8, 1.1 + bud * 0.3, '#9ab860', rgba(INK, 0.5), 0.3);
    });
  },
  blueberry(g, v, ripe) {
    const s = gFol(v), P = [[0, -5], [-5, -5], [5, -5], [0, -9], [-2, -2], [3, -1]], n = Math.max(1, Math.ceil(s * P.length));
    g.beginPath(); g.moveTo(0, 0.5); g.lineTo(0, -4 * s); stroke(g, '#6a4a2a', 1.1);
    for (let i = 0; i < n; i++) blob(g, P[i][0] * s, P[i][1] * s, 2 + 3.2 * s, i % 2 ? '#3f8a46' : '#48954e', 0.3, -0.3);
    for (let i = 0; i < Math.round(10 * s); i++) leaf(g, (hash2(i, 1, 9) - 0.5) * 14 * s, -2 - hash2(i, 2, 9) * 10 * s, hash2(i, 3, 9) * 6.28, 3.5 * s, 1.5 * s, '#57a35a', false);
    const o = { p: '#fdf2f4', m: '#f2c8d0', fs: 1.7, r: 1.55, g: '#b8d890', mid: '#c890b8', c: '#4c5fb8' };
    for (let i = 0; i < 9; i++) gSet(g, (hash2(i, 4, 9) - 0.5) * 12, -2 - hash2(i, 5, 9) * 9, gK(v, i, 9), ripe, o);
  },
  tea(g, v, ripe) {
    const s = gFol(v), P = [[0, -4], [-5, -5], [5, -5], [0, -9], [-2, -3], [3, -2]], n = Math.max(1, Math.ceil(s * P.length)), flush = ripe ? 1 : gPh(v, 0.66, 1.0);
    for (let i = 0; i < n; i++) blob(g, P[i][0] * s, P[i][1] * s, 2 + 3.5 * s, i % 2 ? '#3f7a3a' : '#468242', 0.25, -0.3);
    for (let i = 0; i < Math.round(12 * s); i++) {
      const x = (hash2(i, 1, 21) - 0.5) * 16 * s, y = -2 - hash2(i, 2, 21) * 10 * s, top = hash2(i, 2, 21) > 0.35, f = top ? flush : 0;
      leaf(g, x, y, top && f > 0 ? -Math.PI / 2 + (hash2(i, 3, 21) - 0.5) * 1.2 : hash2(i, 3, 21) * 6.28, (3.6 + f * 1.6) * s, 1.6 * s, mix('#4f8a42', '#a8e070', f), false);
    }
    if (!ripe && v > 0.5 && v < 0.74) [[-4, -3], [4, -6]].forEach(([x, y], k) => gFlower(g, x, y, 1.9, '#ffffff', '#f2d23a', gPh(gK(v, k, 2), 0.5, 0.6)));
  },
  corn(g, v, ripe) {
    const h = 4 + 27 * gSm(gPh(v, 0.14, 0.68)), tas = gPh(v, 0.56, 0.7), ear = ripe ? 1 : gPh(v, 0.66, 0.94), dry = ripe ? 1 : gPh(v, 0.88, 1.02);
    for (let i = -1; i <= 1; i += 2) {
      const x = i * 4, tx = x + i * 0.5;
      g.beginPath(); g.moveTo(x, 0); g.lineTo(tx, -h); stroke(g, INK, 2.6); g.beginPath(); g.moveTo(x, 0); g.lineTo(tx, -h); stroke(g, '#5a9a3a', 1.7);
      for (let k = 0; k < Math.floor(h / 5.5); k++) leaf(g, x, -3 - k * 5.5, (k + (i > 0 ? 1 : 0)) % 2 ? -0.55 : Math.PI + 0.55, Math.min(10, 4 + (h - k * 5.5) * 0.45), 1.9, k % 2 ? '#6fb04a' : '#62a542');
      if (tas > 0) for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(tx, -h); g.lineTo(tx + k * 1.5 * tas, -h - (4.6 - Math.abs(k) * 0.9) * tas); stroke(g, '#d8b450', 0.7); }
      if (ear > 0 && h > 18) {
        const el = 1.6 + 3.2 * gSm(ear);
        g.save(); g.translate(x + i * 2, -15.5); g.rotate(i * 0.38);
        g.beginPath(); g.ellipse(0, 0, 1 + el * 0.24, el, 0, 0, TAU6); g.fillStyle = '#8fc06a'; g.fill(); stroke(g, INK, 0.5);
        if (dry > 0.5) { g.beginPath(); g.ellipse(0, -el * 0.2, 0.8 + el * 0.16, el * 0.66, 0, 0, TAU6); g.fillStyle = '#f2cf3a'; g.fill(); stroke(g, shade('#f2cf3a', -0.45), 0.35); for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(-1.2, -el * 0.55 + k * el * 0.33); g.lineTo(1.2, -el * 0.55 + k * el * 0.33); stroke(g, rgba('#b8901a', 0.7), 0.3); } }
        for (let k = -1; k <= 1; k++) { g.beginPath(); g.moveTo(0, -el); g.quadraticCurveTo(k * 1.6, -el - 2.2, k * 2.3, -el - 0.6 + Math.abs(k)); stroke(g, mix('#eef0a8', '#8a5a2a', dry), 0.5); }
        g.restore();
      }
    }
  },
  grapes(g, v, ripe) {
    const s = gFol(v);
    gPost(g, -11, 22); gPost(g, 11, 22); g.fillStyle = '#8a6a42'; g.fillRect(-12, -22, 24, 1.6);
    // the cane climbs the left post, then is trained along the wire
    const up = Math.min(1, s / 0.45), along = gPh(s, 0.45, 1);
    g.beginPath(); g.moveTo(-9.5, 0); g.quadraticCurveTo(-7.5, -10 * up, -9 + 1.5 * up, -20.5 * up); if (along > 0) g.quadraticCurveTo(-4, -22.5, -9 + 19 * along, -20.6); stroke(g, '#6a4a2a', 1 + 0.5 * s);
    for (let k = 0; k < Math.round(4 * up); k++) leaf(g, -8.6, -4 - k * 4.4, k % 2 ? -0.5 : Math.PI + 0.5, 4.5, 2.6, '#5a9a3a', false);
    const nl = Math.round(7 * along);
    for (let i = 0; i < nl; i++) leaf(g, -9 + i * 3, -19 + (i % 2) * 2, Math.PI / 2 + (i % 2 ? 0.6 : -0.6), 6, 3, i % 2 ? '#5a9a3a' : '#64a842', false);
    if (along > 0.5) { g.beginPath(); g.arc(-9 + 19 * along + 1, -22, 1.3, 2.4, 7); stroke(g, '#8cc05a', 0.5); }
    if (along < 0.75) return;
    [[-5.5, -15], [5, -14]].forEach(([x, y], c) => {
      const vk = gK(v, c, 2), bud = gPh(vk, 0.5, 0.62), fr = ripe ? 1 : gPh(vk, 0.66, 0.92), rp = ripe ? 1 : gPh(vk, 0.84, 1.02);
      if (bud <= 0) return;
      g.beginPath(); g.moveTo(x, -19); g.lineTo(x, y - 1); stroke(g, '#6a8a3a', 0.6);
      [[0, 0], [2, 0], [-2, 0], [1, 2], [-1, 2], [0, 4]].forEach(([a, b], k) => {
        const r = fr > 0 ? 0.6 + 0.95 * gSm(fr) : 0.45, col = fr > 0 ? mix('#9acc60', '#7b3f9e', gSm(gPh(rp, k * 0.08, 0.6 + k * 0.08))) : '#d8e8a0';       // colouring from the shoulder down
        blob(g, x + a * 1.1 * (0.5 + 0.5 * fr), y + b * 1.1 * (0.5 + 0.5 * fr), r, col, 0.4, -0.3);
      });
    });
  },
  cranberry(g, v, ripe) {
    const s = gFol(v), n = 3 + Math.round(11 * s);
    for (let i = 0; i < n; i++) leaf(g, (hash2(i, 1, 31) - 0.5) * 18 * (0.35 + 0.65 * s), -1 - hash2(i, 2, 31) * 6 * s, hash2(i, 3, 31) * 6.28, 1.5 + 2.5 * s, 0.8 + 0.8 * s, i % 3 ? '#5a7a3a' : '#6a8a44', false);
    const o = { p: '#f8c8d8', m: '#c8405a', fs: 1.8, r: 1.6, g: '#e8ecd0', mid: '#f0a0a8', c: '#c8203a' };
    for (let i = 0; i < 9; i++) gSet(g, (hash2(i, 4, 31) - 0.5) * 16, -1 - hash2(i, 5, 31) * 6, gK(v, i, 9), ripe, o);
  },
  pumpkin(g, v, ripe) {
    gVine(g, v, '#4f9438');
    const o = { p: '#f8b020', m: '#e88a10', fs: 3.6, r: 1, g: '#5a9a3a', mid: '#b8b040', c: '#f08a1c', draw(g2, x, y, r, col) {
      const w = 0.25 + 0.75 * r;
      for (let i = -1; i <= 1; i++) { g2.beginPath(); g2.ellipse(x + i * 3 * w, y, 4 * w, 5.4 * w, 0, 0, TAU6); g2.fillStyle = lgrad(g2, x + i * 3 * w - 4 * w, 0, x + i * 3 * w + 4 * w, 0, [shade(col, 0.3), col, shade(col, -0.35)]); g2.fill(); stroke(g2, shade(col, -0.55), 0.5); }
      g2.beginPath(); g2.moveTo(x, y - 5 * w); g2.lineTo(x + 1, y - 5 * w - 2.2); stroke(g2, '#5a7a2a', 1.5);
    } };
    gSet(g, 1, -3, v, ripe, o);
    const f2 = gPh(v, 0.5, 0.6) * (1 - gPh(v, 0.68, 0.78)); if (f2 > 0 && !ripe) gFlower(g, -8, -5, 3, '#f8b020', '#e88a10', f2);                 // the other flower sets no fruit
  },
  melon(g, v, ripe) {
    gVine(g, v, '#4f9438');
    const o = { p: '#f6dc48', m: '#e8a020', fs: 2.6, r: 1, g: '#b8dc90', c: '#6ab04a', draw(g2, x, y, r, col, rp) {
      const w = 0.22 + 0.78 * r;
      g2.beginPath(); g2.ellipse(x, y, 8 * w, 6 * w, 0, 0, TAU6); g2.fillStyle = rgrad(g2, x, y, 8 * w, [shade(col, 0.3), col, shade(col, -0.25)], x - 2.5 * w, y - 2.5 * w); g2.fill();
      if (rp > 0.15) { g2.save(); g2.clip(); g2.strokeStyle = rgba('#2f6a2a', rp); g2.lineWidth = 1.4 * w; for (let i = -2; i <= 2; i++) { g2.beginPath(); g2.ellipse(x + i * 3 * w, y, 1 * w, 7 * w, 0, 0, TAU6); g2.stroke(); } g2.restore(); }
      g2.beginPath(); g2.ellipse(x, y, 8 * w, 6 * w, 0, 0, TAU6); stroke(g2, INK, 0.6);
    } };
    gSet(g, 1, -3, v, ripe, o);
    const f2 = gPh(v, 0.5, 0.6) * (1 - gPh(v, 0.68, 0.78)); if (f2 > 0 && !ripe) gFlower(g, -9, -5, 2.4, '#f6dc48', '#e8a020', f2);
  },
  lavender(g, v, ripe) {
    const s = gFol(v), up = gSm(gPh(v, 0.42, 0.68)), col = ripe ? 1 : gPh(v, 0.62, 1.0);
    blob(g, 0, -3 * s, 2.5 + 5.5 * s, '#8aa88a', 0.25, -0.3);
    for (let i = 0; i < Math.round(6 * s); i++) leaf(g, (i - 2.5) * 1.6 * s, -3 * s, -Math.PI / 2 + (i - 2.5) * 0.38, 4 + 3 * s, 0.9, '#9ab89a', false);
    if (up <= 0) return;
    for (let i = -3; i <= 3; i++) {
      const x = i * 2.4 * s, top = (-10 - (3 - Math.abs(i)) * 2.4) * up - 3 * (1 - up);
      g.beginPath(); g.moveTo(x * 0.5, -3); g.lineTo(x, top); stroke(g, '#7a9a7a', 0.7);
      for (let k = 0; k < 4; k++) { const lit = gPh(col, k * 0.2, k * 0.2 + 0.35); ell(g, x, top - k * 1.6 * up, 0.7 + 0.4 * lit, 0.7 + 0.3 * lit, mix('#8fae8a', k % 2 ? '#9a7ad8' : '#b096e4', lit)); }     // colouring from the bottom of the spike up
    }
  },
  juniper(g, v, ripe) {
    const s = 0.2 + 0.8 * gFol(v), tiers = 1 + Math.floor(gFol(v) * 3.99);
    for (let k = 0; k < tiers; k++) {
      const y = -4 - k * 5 * s, w = (11 - k * 2.4) * s;
      g.beginPath(); g.moveTo(-w, y); g.lineTo(0, y - 9 * s); g.lineTo(w, y); g.quadraticCurveTo(0, y + 3, -w, y);
      g.fillStyle = lgrad(g, 0, y - 9 * s, 0, y, ['#5a9a7a', '#3c6e52']); g.fill(); stroke(g, shade('#3c6e52', -0.4), 0.5);
    }
    if (tiers < 4) return;
    const o = { fs: 1.4, p: '#e8e8a0', m: '#c8c060', r: 1.35, g: '#8ab890', c: '#6a84bb' };
    for (let i = 0; i < 8; i++) gSet(g, (hash2(i, 1, 5) - 0.5) * 14 * (1 - hash2(i, 2, 5) * 0.6), -3 - hash2(i, 2, 5) * 14, gK(v, i, 8), ripe, o);
  },
  apple(g, v, ripe) {
    const s = gTreelet(g, v, '#4b9a3c', 6.5);
    if (s < 0.75) return;
    const o = { p: '#ffe4ec', m: '#f2d23a', fs: 2.6, r: 2.3, g: '#9acc50', mid: '#d8c040', c: '#d8392b' };
    TREELET_SPOTS.forEach(([x, y], k) => gSet(g, x * s, y * s, gK(v, k, 5), ripe, o));
  },
  peach(g, v, ripe) {
    const s = gTreelet(g, v, '#4b9a3c', 7);
    if (s < 0.75) return;
    const o = { p: '#ffb8d0', m: '#e8507a', fs: 2.8, r: 2.4, g: '#a8c860', mid: '#f8d078', c: '#f8a070', draw(g2, x, y, r, col, rp) {
      gFruit(g2, x, y, r, col, rp > 0.5); if (rp > 0.4) { ell(g2, x + r * 0.3, y + r * 0.2, r * 0.5, r * 0.45, rgba('#e8503a', 0.45 * rp)); g2.beginPath(); g2.moveTo(x, y - r); g2.quadraticCurveTo(x - r * 0.3, y, x, y + r * 0.8); stroke(g2, rgba('#c86a3a', 0.6), 0.35); }
    } };
    TREELET_SPOTS.forEach(([x, y], k) => gSet(g, x * s, y * s, gK(v, k, 5), ripe, o));
    if (!ripe && v > 0.55 && v < 0.72) for (let i = 0; i < 5; i++) gFlower(g, (hash2(i, 1, 41) - 0.5) * 16 * s, (-12 - hash2(i, 2, 41) * 10) * s, 2.2, '#ffc8dc', '#e8507a', gPh(v, 0.55, 0.62));      // a cloud of blossom
  },
  olive(g, v, ripe) {
    const s = gTreelet(g, v, '#8aa080', 6.5, '#8a7a62');
    if (s < 0.75) return;
    TREELET_SPOTS.forEach(([x, y], k) => {
      const o = { p: '#fbf6d8', m: '#e8d870', fs: 1.8, r: 1.9, g: '#a8c060', c: k % 2 ? '#4a3a4a' : '#6a7a2a', draw(g2, x2, y2, r, col) { g2.beginPath(); g2.ellipse(x2, y2, r * 0.78, r * 1.05, 0.3, 0, TAU6); g2.fillStyle = col; g2.fill(); stroke(g2, INK, 0.35); ell(g2, x2 - r * 0.25, y2 - r * 0.35, r * 0.22, r * 0.18, 'rgba(255,255,255,0.45)'); } };
      gSet(g, x * s, y * s, gK(v, k, 5), ripe, o);
    });
  },
  cocoa(g, v, ripe) {
    const s = 0.25 + 0.75 * gFol(v), n = 2 + Math.round(gFol(v) * 4);
    g.fillStyle = '#6a4a2a'; g.fillRect(-1.8 * s, -16 * s, 3.6 * s, 16 * s); g.strokeStyle = INK; g.lineWidth = 0.5; g.strokeRect(-1.8 * s, -16 * s, 3.6 * s, 16 * s);
    for (let i = 0; i < n; i++) leaf(g, 0, -14 * s - (i % 2) * 3, gFan(i, n, 0.3 + 1.1 * gFol(v)), 11 * s, 3.6 * s, i === n - 1 && v < 0.6 ? '#c8704a' : (i % 2 ? '#3f7a3a' : '#48843e'));      // new leaves come out red
    if (s < 0.9) return;
    const o = { p: '#fde8ec', m: '#e890a8', fs: 1.5, r: 1, g: '#7aa848', mid: '#e8c040', c: '#d88a3a', draw(g2, x, y, r, col) {
      g2.beginPath(); g2.ellipse(x, y, 1.9 * r, 3.5 * r, 0, 0, TAU6); g2.fillStyle = col; g2.fill(); stroke(g2, INK, 0.4);
      if (r > 0.6) { g2.beginPath(); g2.moveTo(x, y - 3.2 * r); g2.lineTo(x, y + 3.2 * r); g2.moveTo(x - 1 * r, y - 2.6 * r); g2.quadraticCurveTo(x - 1.5 * r, y, x - 1 * r, y + 2.6 * r); stroke(g2, shade(col, -0.3), 0.3); }
    } };
    [[-3.2, -7], [3.2, -10.5], [-2.8, -12.5]].forEach(([x, y], k) => gSet(g, x, y, gK(v, k, 3), ripe, o));           // flowers and pods straight from the trunk
  },
};
// flowers for the bees: stems, leaves, a green bud, colour showing through, then open (the bloom itself is the "ripe" picture)
FLOWERS.forEach(f => {
  GROW[f.id] = (g, v, ripe) => {
    const s = gFol(v), n = 1 + Math.round(gPh(v, 0.2, 0.5) * 2), bud = gPh(v, 0.5, 0.72), show = gPh(v, 0.72, 0.9), L = FLOWER_LOOK[f.id];
    for (let j = 0; j < n; j++) {
      const i = n === 1 ? 0 : n === 2 ? j * 2 - 1 : j - 1, h = (3 + 10 * s) * (i ? 1 : 1.12), x = i * 3.6 * s;
      g.beginPath(); g.moveTo(i * 1.5, 0); g.quadraticCurveTo(i * 2.6, -h * 0.55, x, -h); stroke(g, '#4f8a30', 0.9);
      leaf(g, i * 1.8, -h * 0.3, -Math.PI / 2 + (i || 0.4) * 0.9, 2 + 3 * s, 0.9 + 1.3 * s, f.leaf, false);
      if (s > 0.6) leaf(g, i * 2.2, -h * 0.55, -Math.PI / 2 - (i || 0.4) * 0.9, 2 + 2 * s, 1.6, shade(f.leaf, 0.1), false);
      if (ripe) drawBloom(g, f.id, x, -h - (i ? 0 : 1), 3.4);
      else if (bud > 0) {
        const r = 0.9 + 1.2 * bud;
        ell(g, x, -h, r * 0.75, r, shade(f.leaf, 0.2), INK, 0.4);
        if (show > 0) { g.beginPath(); g.ellipse(x, -h - r * 0.3, r * 0.6 * show, r * 0.75, 0, Math.PI, TAU6); g.fillStyle = L.petal; g.fill(); stroke(g, rgba(INK, 0.5), 0.3); }
        if (show >= 1 && i === 0) drawBloom(g, f.id, x, -h - 1, 2.3);                   // the middle one opens first
      }
    }
  };
});

// ---------------------------------------------------------------- one picture per moment of a plot's life
const PLANT_USED = {};
let _plantSweep = 0, _plantBudget = 6;
function plantFrame(p) {
  if (p.st >= 2) return GROW_N;
  const f = Math.max(0, Math.min(0.9999, p.t / growTarget(p)));
  if ((p.gen | 0) > 0) { const r = REGROW_FROM[p.crop] == null ? 0.5 : REGROW_FROM[p.crop]; return Math.min(GROW_N - 1, Math.floor((r + (1 - r) * f) * GROW_N)); }
  return Math.min(GROW_N - 1, Math.floor(f * GROW_N));
}
// plants in one bed never grow quite in step
const BED = [[-10, -3, -0.03, 1], [10, -3, 0.012, -1], [-10, 11, 0.022, -1], [10, 11, -0.014, 1]];
plantSprite = function (cropId, k) {
  const key = 'plant_' + cropId + '_' + k, now = window.R && R.time || 0;
  PLANT_USED[key] = now;
  if (ART.sprites[key]) return ART.sprites[key];
  // only a few new pictures are painted per frame; until its turn comes a plant borrows the nearest stage already painted
  if (_plantBudget <= 0) for (let d = 1; d <= GROW_N; d++) { const lo = ART.sprites['plant_' + cropId + '_' + (k - d)], hi = ART.sprites['plant_' + cropId + '_' + (k + d)]; if (lo || hi) return lo || hi; }
  _plantBudget--;
  const crop = CROP[cropId], ripe = k >= GROW_N, v0 = ripe ? 1 : k / GROW_N, single = !!SINGLE_PLANT[cropId];
  const s = makeSprite(T, T + 30, T / 2, T / 2 + 30, g => {
    (single ? [[0, 6, 0, 1]] : BED).forEach(([x, y, dv, flip]) => {
      const v = ripe ? 1 : Math.max(0, Math.min(0.999, v0 + (v0 > 0.08 ? dv : 0)));
      g.save(); g.translate(x, y);
      if (v < 0.2 && !ripe) gSeedling(g, v, crop, GRASSY[cropId]);
      else { const sc = single ? 1.15 : 0.62; g.scale(sc * flip, sc); (GROW[cropId] || PLANT[cropId])(g, v, ripe); }
      g.restore();
    });
  }, { edge: 0.9 });
  ART.sprites[key] = s;
  return s;
};
// pictures nobody has looked at for a while are let go, so a big farm doesn't hold every stage of every crop
function sweepPlantSprites(now) {
  _plantBudget = 3;
  if (now - _plantSweep < 12) return;
  _plantSweep = now;
  for (const key in PLANT_USED) {
    if (now - PLANT_USED[key] < 50 && now >= PLANT_USED[key]) continue;
    const s = ART.sprites[key]; if (s && s.c) { s.c.width = 0; s.c.height = 0; }
    delete ART.sprites[key]; delete PLANT_USED[key];
  }
}

// ---------------------------------------------------------------- orchard saplings
const SAP_N = 8, SAP_UNTIL = 0.55;      // the first part of a tree's growing is drawn stage by stage; after that it fills out
const SAP_LOOK = {
  oak:    { bark: ['#9a6a42', '#7a5232', '#4f3420'], leaf: ['#4f9a42', '#3e8a3a', '#68b04c'] },
  birch:  { bark: ['#f8f4ea', '#e6dece', '#b8b0a0'], leaf: ['#8ccc5a', '#7abc4c', '#a2dc6c'], ticks: 1, tall: 1 },
  pine:   { bark: ['#8a5a3a', '#6a4228', '#4a2c18'], leaf: ['#3a8260', '#2c6e4e', '#245c42'], cone: 1 },
  willow: { bark: ['#8a7a52', '#6a5a3a', '#4a3e26'], leaf: ['#9ad86a', '#86c858', '#b0e480'], weep: 1 },
  maple:  { bark: ['#8a6a52', '#6a4a36', '#4a3022'], leaf: ['#5a9a3a', '#4a8a30', '#d8602a'] },
};
function gSapling(g, kind, u) {
  const L = SAP_LOOK[kind], H = 7 + 34 * u, tw = 0.9 + 3 * u * u, top = -H * 0.62;
  ell(g, 0, 0.5, 5 + 3 * u, 1.8 + 0.8 * u, '#6a4528');                                // the dug-over ring it was planted in
  if (u < 0.78) {                                                                       // staked until it can stand up to the wind
    g.fillStyle = '#c8a878'; g.fillRect(-6.4, -15, 1.8, 15.5); g.strokeStyle = INK; g.lineWidth = 0.5; g.strokeRect(-6.4, -15, 1.8, 15.5);
    if (H > 12) { g.beginPath(); g.moveTo(-4.6, -10.5); g.quadraticCurveTo(-2.5, -9.4, -0.2, -10.5); stroke(g, '#f0e4c8', 0.9); }
  }
  g.beginPath(); g.moveTo(-tw / 2 - 0.5, 0); g.quadraticCurveTo(-tw / 2, -H * 0.3, -tw * 0.3 - 0.2, top); g.lineTo(tw * 0.3 + 0.2, top); g.quadraticCurveTo(tw / 2, -H * 0.3, tw / 2 + 0.6, 0); g.closePath();
  g.fillStyle = lgrad(g, -tw, 0, tw, 0, L.bark); g.fill(); stroke(g, INK, 0.6);
  if (L.ticks) for (let i = 0; i < H * 0.55 / 4; i++) { g.fillStyle = '#4a4038'; g.fillRect(-tw * 0.3 + (i % 2) * tw * 0.2, -3 - i * 4, Math.max(0.8, tw * 0.45), 0.7); }
  if (L.cone) {
    const tiers = 1 + Math.floor(u * 3.99);
    for (let k = 0; k < tiers; k++) {
      const y = -H * 0.22 - k * H * 0.2, w = (5 + 9 * u) * (1 - k * 0.2), hh = H * 0.36;
      g.beginPath(); g.moveTo(-w, y); g.lineTo(0, y - hh); g.lineTo(w, y); g.quadraticCurveTo(0, y + 3, -w, y); g.fillStyle = lgrad(g, 0, y - hh, 0, y, [L.leaf[0], L.leaf[2]]); g.fill(); stroke(g, shade(L.leaf[2], -0.4), 0.6);
    }
    return;
  }
  if (u < 0.3) {                                                                        // a whip: one stem and a few leaves
    const n = 2 + Math.round(u / 0.3 * 4);
    g.beginPath(); g.moveTo(0, top); g.lineTo(0.4, -H); stroke(g, L.bark[1], 0.9);
    for (let i = 0; i < n; i++) { const y = -H * (0.4 + 0.6 * (i + 1) / n), sd = i % 2 ? 1 : -1; leaf(g, 0.2, y, sd > 0 ? -0.5 : Math.PI + 0.5, 3.5 + 6 * u, 1.5 + 2 * u, L.leaf[i % 3]); }
    leaf(g, 0.4, -H, -Math.PI / 2, 4 + 6 * u, 1.6 + 2 * u, L.leaf[2]);
    return;
  }
  const c = (u - 0.3) / 0.7, n = 2 + Math.round(c * 7), R = 4 + 7.5 * c, cy = -H * (L.tall ? 0.76 : 0.72), r = mulberry(kind.length * 31 + 5);
  g.beginPath(); g.moveTo(0, top); g.lineTo(-R * 0.5, cy + 1); g.moveTo(0, top); g.lineTo(R * 0.45, cy - 1); stroke(g, L.bark[1], 0.8 + c);
  const puffs = [];
  for (let i = 0; i < n; i++) { const a = r() * TAU6, d = r() * R * 0.9; puffs.push([Math.cos(a) * d * (L.tall ? 0.85 : 1.2), cy + Math.sin(a) * d * (L.tall ? 1.15 : 0.82), 3.4 + 4.6 * c + r() * 2]); }
  puffs.sort((a, b) => a[1] - b[1]);
  puffs.forEach(([x, y, rr]) => blob(g, x + 0.7, y + 2, rr, shade(L.leaf[1], -0.3), 0, -0.2));
  if (L.weep) for (let i = 0; i < 4 + Math.round(c * 5); i++) {                        // willow fronds hang lower every season
    const x = (i / (3 + c * 5) - 0.5) * R * 2.3, len = 5 + 13 * c * (0.7 + 0.3 * r());
    g.beginPath(); g.moveTo(x, cy); g.quadraticCurveTo(x + (x > 0 ? 2 : -2), cy + len * 0.5, x + (x > 0 ? 1 : -1), cy + len); stroke(g, L.leaf[i % 3], 1.5);
  }
  puffs.forEach(([x, y, rr], i) => blob(g, x, y, rr, L.leaf[i % 3], 0.28, -0.32));
}
function saplingSprite(kind, k) {
  const key = 'sap_' + kind + '_' + k;
  if (!ART.sprites[key]) ART.sprites[key] = makeSprite(60, 64, 30, 60, g => gSapling(g, kind, (k + 0.5) / SAP_N), { edge: 1.2 });
  return ART.sprites[key];
}
// an acorn lying on the ground
function acornSprite() {
  if (!ART.sprites.acorn1) ART.sprites.acorn1 = makeSprite(8, 9, 4, 8, g => {
    g.save(); g.rotate(0.35);
    g.beginPath(); g.ellipse(0, -2.6, 2.2, 2.9, 0, 0, TAU6); g.fillStyle = rgrad(g, 0, -2.6, 3, ['#d8a060', '#b07838', '#7a4e20'], -0.8, -3.6); g.fill(); stroke(g, INK, 0.5);
    g.beginPath(); g.ellipse(0, -4.6, 2.5, 1.5, 0, Math.PI, TAU6); g.closePath(); g.fillStyle = '#6a4a2a'; g.fill(); stroke(g, INK, 0.5);
    g.beginPath(); g.moveTo(0, -6); g.lineTo(0.4, -7.2); stroke(g, '#4a3420', 0.7);
    g.restore();
  }, { edge: 0.6, S: Math.max(2, ART.S) });
  return ART.sprites.acorn1;
}

// ---------------------------------------------------------------- a cottage for two (and soon three)
BUILD_DRAW.cottage = function (g) {
  stoneWall(g, -34, -17, 68, 9); g.strokeStyle = INK; g.lineWidth = 0.9; g.strokeRect(-34, -17, 68, 9);
  g.beginPath(); g.rect(-32, -51, 64, 35); g.fillStyle = lgrad(g, -32, 0, 32, 0, ['#fff6e2', '#f6e8c8', '#e2cfa8']); g.fill(); stroke(g, INK, 1);
  g.fillStyle = '#7a5232'; [[-32, -51, 3, 35], [29, -51, 3, 35], [-11.5, -51, 2.4, 35], [9.1, -51, 2.4, 35], [-32, -34, 20.5, 2], [11.5, -34, 20.5, 2]].forEach(([x, y, w, h]) => g.fillRect(x, y, w, h));
  // chimney, then the thatch over it
  stoneWall(g, 15, -96, 11, 34, '#b0a898'); g.strokeStyle = INK; g.lineWidth = 0.9; g.strokeRect(15, -96, 11, 34);
  g.fillStyle = '#8a8276'; g.fillRect(13.5, -98.5, 14, 3.6); g.strokeRect(13.5, -98.5, 14, 3.6);
  g.beginPath(); g.moveTo(-42, -46); g.quadraticCurveTo(-31, -79, 0, -87); g.quadraticCurveTo(31, -79, 42, -46); g.quadraticCurveTo(0, -55, -42, -46); g.closePath();
  g.fillStyle = lgrad(g, 0, -87, 0, -46, ['#ecca80', '#d0a050', '#a87a34']); g.fill(); stroke(g, INK, 1.1);
  g.strokeStyle = rgba('#7a5a24', 0.5); g.lineWidth = 0.6;
  for (let i = -9; i <= 9; i++) { g.beginPath(); g.moveTo(i * 3.3, -84.5 + Math.abs(i) * 2.7); g.lineTo(i * 4.3, -49.5 - (1 - Math.abs(i) / 9) * 4.5); g.stroke(); }
  g.beginPath(); g.moveTo(-15, -82.5); g.quadraticCurveTo(0, -90, 15, -82.5); stroke(g, INK, 4.4); g.beginPath(); g.moveTo(-15, -82.5); g.quadraticCurveTo(0, -90, 15, -82.5); stroke(g, '#9a7230', 2.8);
  // the door, with a heart cut into it
  g.beginPath(); g.moveTo(-7, -16); g.lineTo(-7, -35); g.arc(0, -35, 7, Math.PI, 0); g.lineTo(7, -16); g.closePath();
  g.fillStyle = lgrad(g, -7, 0, 7, 0, ['#e07a68', '#c4473a', '#9a3028']); g.fill(); stroke(g, INK, 0.9);
  g.beginPath(); g.moveTo(0, -31.5); g.bezierCurveTo(-4.2, -34.4, -2.5, -38.6, 0, -36.2); g.bezierCurveTo(2.5, -38.6, 4.2, -34.4, 0, -31.5); g.fillStyle = '#fff3d8'; g.fill(); stroke(g, rgba(INK, 0.7), 0.4);
  ell(g, 4.4, -25, 0.9, 0.9, '#f2c23a', INK, 0.4);
  rrect(g, -9.5, -17.5, 19, 3.6, 1); g.fillStyle = '#c8c0b0'; g.fill(); stroke(g, INK, 0.7);
  // windows with flower boxes
  [-21.5, 20.5].forEach((x, k) => {
    g.fillStyle = '#fff6e2'; g.fillRect(x - 6.5, -47.5, 13, 12.5); g.strokeStyle = INK; g.lineWidth = 0.8; g.strokeRect(x - 6.5, -47.5, 13, 12.5);
    g.fillStyle = lgrad(g, x - 5, -46, x + 5, -36, ['#d6eefa', '#a8d0e8']); g.fillRect(x - 5, -46, 10, 9.5);
    g.beginPath(); g.moveTo(x, -46); g.lineTo(x, -36.5); g.moveTo(x - 5, -41.3); g.lineTo(x + 5, -41.3); stroke(g, '#fff6e2', 1.2);
    g.fillStyle = '#8a5a32'; g.fillRect(x - 7, -34.4, 14, 3.4); g.strokeRect(x - 7, -34.4, 14, 3.4);
    for (let i = 0; i < 4; i++) { leaf(g, x - 5 + i * 3.4, -34.6, -Math.PI / 2 + (i - 1.5) * 0.3, 3.2, 1.2, '#5aa335', false); ell(g, x - 5 + i * 3.4, -37.8, 1.3, 1.3, (i + k) % 2 ? '#e8463a' : '#f2c23a', rgba(INK, 0.5), 0.3); }
  });
};
// icons
UI_ICON.love = function (g) {
  g.translate(16, 17);
  g.beginPath(); g.moveTo(0, 10); g.bezierCurveTo(-17, -1, -10, -15, 0, -6.5); g.bezierCurveTo(10, -15, 17, -1, 0, 10);
  g.fillStyle = rgrad(g, 0, -1, 14, ['#ff9a9a', '#e8463a', '#b82a2a'], -4, -6); g.fill(); stroke(g, INK, 1);
  ell(g, -5, -5, 2.6, 1.6, 'rgba(255,255,255,0.6)');
};
;(window.__stage = window.__stage || []).push('art6.js loaded');
