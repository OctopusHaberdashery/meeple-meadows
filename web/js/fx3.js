// Meeple Meadows — feel, part 3: plants that visibly grow, orchard trees with something to show for the season,
// acorns falling and lying about, children underfoot, and hearts.
'use strict';

const onView = (x, y, m) => { const p = R.worldToScreen(x, y), k = m == null ? 40 : m; return p.x > -k && p.y > -k && p.x < R.cv.clientWidth + k && p.y < R.cv.clientHeight + k; };

// ---------------------------------------------------------------- crops: a little shiver each time a plant moves on a stage
const _gk8 = new Int8Array(MW * MH).fill(-1);
const _dp8 = drawPlot;
drawPlot = function (ctx, i, t, wind, sway) {
  const p = S.plots[i];
  if (p && p.st >= 1) {
    const k = plantFrame(p), was = _gk8[i];
    if (was !== k) { _gk8[i] = k; if (was >= 0 && k === was + 1 && !FX.pops['p' + i]) FX.pop('p' + i, 'spring', 0.42, 0.055); }
  } else _gk8[i] = -1;
  _dp8(ctx, i, t, wind, sway);
};

// ---------------------------------------------------------------- orchard trees
const CANOPY = {      // where the leaves are on the grown tree, measured from the foot of the trunk: [centre height, half width, half height]
  oak: [60, 17, 12], birch: [62, 12, 15], maple: [64, 18, 13], willow: [58, 17, 10], pine: [52, 10, 22],
};
const SPOTS8 = [[-0.8, -0.3], [-0.42, 0.5], [0.12, -0.75], [0.52, 0.32], [0.86, -0.36], [-0.12, 0.12], [0.35, -0.2], [-0.55, -0.7]];
function canopySpot(kind, bx, by, k) { const c = CANOPY[kind], s = SPOTS8[k % 8]; return [bx + s[0] * c[1], by - c[0] + s[1] * c[2]]; }
function drawPail(ctx, bx, ty, sap, fill, t, id) {
  ctx.fillStyle = '#7a8288'; ctx.fillRect(bx + 3, ty - 12, 5, 1.6);
  rrect(ctx, bx + 4, ty - 10, 7, 8, 1.5); ctx.fillStyle = '#a8b0b8'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 0.7; ctx.stroke();
  if (fill > 0.04) { ctx.fillStyle = sap; ctx.fillRect(bx + 4.8, ty - 2.8 - 6 * fill, 5.4, 6 * fill); }          // filling up
  if (fill < 1) { const ph = (t * (0.5 + fill * 0.9) + id) % 1; ell(ctx, bx + 7.4, ty - 10 + ph * 3, 0.8, 1.1, rgba(sap, 1 - ph)); }
  else ell(ctx, bx + 7.5, ty - 9.4, 3.2, 1, sap, INK, 0.4);                                                         // brim-full
}
const _sapk = {};
drawOrchardTree = function (ctx, b, bx, by, t) {
  const tr = TREE_OF[b.type], a = Math.min(1, (b.age || 0) / TREE_GROW);
  if (a < SAP_UNTIL) {
    const u = a / SAP_UNTIL, k = Math.min(SAP_N - 1, Math.floor(u * SAP_N));
    if (_sapk[b.id] !== k) { if (_sapk[b.id] === k - 1) FX.pop('b' + b.id, 'spring', 0.5, 0.09); _sapk[b.id] = k; }
    ell(ctx, bx + 2, by - 7, 6 + 10 * u, 2.4 + 3 * u, 'rgba(20,40,15,0.22)');
    drawSprite(ctx, saplingSprite(tr.kind, k), bx, by - 6);
    return;
  }
  const sc = a < 1 ? 0.5 + 0.5 * gSm((a - SAP_UNTIL) / (1 - SAP_UNTIL)) : 1;
  ell(ctx, bx + 3, by - 8, 18 * sc + 4, 6 * sc + 2, 'rgba(20,40,15,0.26)');
  drawSprite(ctx, orchardSprite(b.type), bx, by - 6, sc);
  if (a < 1) return;
  const r = b.recipe && RECIPE[b.recipe], pr = !r ? 0 : b.phase === 'work' ? Math.min(1, b.t / r.t) : b.phase === 'done' ? 1 : 0, ty = by - 12, kind = tr.kind;
  if (kind === 'oak') {
    // catkins first, then acorns swelling green and turning brown
    if (pr < 0.16) { ctx.globalAlpha = Math.min(1, pr / 0.04) * (1 - pr / 0.16); for (let k = 0; k < 5; k++) { const [x, y] = canopySpot(kind, bx, by, k), sw = Math.sin(t * 2 + k + b.id) * 1; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + sw, y + 5.5); ctx.strokeStyle = '#c8cc5a'; ctx.lineWidth = 1.3; ctx.stroke(); } ctx.globalAlpha = 1; }
    for (let k = 0; k < 7; k++) {
      const q = gPh(pr, 0.14 + k * 0.05, 0.74 + k * 0.035); if (q <= 0) continue;
      const [x, y0] = canopySpot(kind, bx, by, k), y = y0 + Math.sin(t * 1.7 + k * 2 + b.id) * 0.5, rr = 0.9 + 1.5 * q, brown = gSm(gPh(pr, 0.55 + k * 0.03, 0.93));
      ell(ctx, x, y + rr * 0.55, rr * 0.8, rr, mix('#8cc050', '#b07838', brown), INK, 0.4);
      ctx.beginPath(); ctx.ellipse(x, y - rr * 0.1, rr * 0.98, rr * 0.6, 0, Math.PI, Math.PI * 2); ctx.closePath(); ctx.fillStyle = mix('#6a9a3a', '#6a4a2a', brown); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 0.35; ctx.stroke();
    }
  } else if (kind === 'birch' || kind === 'maple') {
    drawPail(ctx, bx, ty, tr.prod === 'maplesap' ? '#e8b870' : '#e8f4ff', pr, t, b.id);
    if (kind === 'birch') {      // catkins lengthen and yellow
      for (let k = 0; k < 5; k++) { const [x, y] = canopySpot(kind, bx, by, k), L = 2 + 5 * gPh(pr, k * 0.08, 0.5 + k * 0.08), sw = Math.sin(t * 1.8 + k + b.id) * 0.9; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + sw, y + L); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke(); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + sw, y + L); ctx.strokeStyle = mix('#9ab85a', '#d8b848', pr); ctx.lineWidth = 1.2; ctx.stroke(); }
    } else {                     // winged seeds in pairs, green then rosy
      for (let k = 0; k < 6; k++) { const q = gPh(pr, 0.1 + k * 0.07, 0.6 + k * 0.06); if (q <= 0) continue; const [x, y] = canopySpot(kind, bx, by, k), col = mix('#a8cc60', '#e89a70', gPh(pr, 0.5, 1));
        for (const sd of [-1, 1]) { ctx.save(); ctx.translate(x, y); ctx.rotate(sd * (0.75 + Math.sin(t * 1.5 + k) * 0.06)); ctx.beginPath(); ctx.ellipse(0, 2.2 * q, 1 * q, 2.8 * q, 0, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 0.35; ctx.stroke(); ctx.restore(); }
        ell(ctx, x, y, 0.9 * q, 0.9 * q, shade(col, -0.2), INK, 0.3); }
    }
  } else if (kind === 'pine') {
    // cones fatten up the tree while the resin beads on the trunk
    for (let k = 0; k < 5; k++) { const q = gPh(pr, k * 0.08, 0.6 + k * 0.08); if (q <= 0) continue; const [x, y] = canopySpot(kind, bx, by, k + 1), col = mix('#7aa85a', '#8a5a32', gPh(pr, 0.45, 0.95));
      ctx.beginPath(); ctx.ellipse(x * 0.6 + bx * 0.4, y, 1 + 0.9 * q, 1.4 + 1.7 * q, 0, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 0.4; ctx.stroke();
      if (q > 0.6) { ctx.beginPath(); ctx.moveTo(x * 0.6 + bx * 0.4 - 1.5, y - 0.6); ctx.lineTo(x * 0.6 + bx * 0.4 + 1.5, y - 0.6); ctx.moveTo(x * 0.6 + bx * 0.4 - 1.4, y + 1); ctx.lineTo(x * 0.6 + bx * 0.4 + 1.4, y + 1); ctx.strokeStyle = shade(col, -0.35); ctx.lineWidth = 0.35; ctx.stroke(); } }
    const rr = 0.7 + 1.9 * pr; ctx.fillStyle = 'rgba(242,168,40,0.75)'; ctx.fillRect(bx + 3, ty - 8 - 6 * pr, 1, 6 * pr); ell(ctx, bx + 3.5, ty - 8, rr * 0.7, rr, '#f2a828', INK, 0.4); ell(ctx, bx + 3.1, ty - 8.6, rr * 0.22, rr * 0.3, 'rgba(255,255,255,0.7)');
  } else if (kind === 'willow') {
    // pussy-willow catkins, and a bundle of cut withies growing at its foot
    for (let k = 0; k < 6; k++) { const q = gPh(pr, k * 0.06, 0.4 + k * 0.06); if (q <= 0) continue; const [x, y] = canopySpot(kind, bx, by, k); ell(ctx, x + Math.sin(t * 1.4 + k) * 0.6, y + 8, 1 + 0.5 * q, 1.3 + 0.9 * q, mix('#e8ecec', '#e8dc7a', gPh(pr, 0.4, 0.9)), INK, 0.35); }
    const n = Math.ceil(pr * 5); ctx.save(); ctx.translate(bx + 12, by - 8); ctx.rotate(-0.4); for (let k = 0; k < n; k++) { ctx.fillStyle = k % 2 ? '#9a7a4a' : '#b8945a'; ctx.fillRect(-7, -k * 1.4, 14, 1.2); } if (n >= 3) { ctx.fillStyle = '#d8463a'; ctx.fillRect(-1.2, -n * 1.4 + 0.6, 2, n * 1.4 + 0.8); } ctx.restore();
  }
};

// a grown tree shows how far along it is in its own branches, so it needs no bubble until there's something to fetch
const _ds8 = drawStatus;
drawStatus = function (ctx, b, t) { if (BUILDINGS[b.type].tree && treeGrown(b) && b.phase === 'work') return; _ds8(ctx, b, t); };

// ---------------------------------------------------------------- things lying about and little people: acorns, children
function drawAcornItem(ctx) {
  const a = this.a, s = acornSprite();
  if (a.fall > ACORN_FALL) return;                                      // still up in the leaves
  let x = a.x, h = 0, rot = 0;
  if (a.fall > 0) {
    const u = ACORN_FALL - a.fall, F = ACORN_FALL - ACORN_LAND;
    if (u < F) { const f = u / F; x = a.fx + (a.x - a.fx) * f; h = a.fh * (1 - f * f); rot = f * 5; }
    else { const f = (u - F) / ACORN_LAND; h = Math.sin(f * Math.PI) * 6 * (1 - f * 0.5); rot = 5 + f * 1.3; }
  }
  ell(ctx, x, a.y + 0.5, 3.2 - Math.min(1.8, h * 0.035), 1.3, 'rgba(20,30,10,0.26)');
  if (rot) { ctx.save(); ctx.translate(x, a.y - h - 3.5); ctx.rotate(rot); drawSprite(ctx, s, 0, 3.5); ctx.restore(); } else drawSprite(ctx, s, x, a.y);
}
function drawKidItem(ctx, t) {
  const k = this.kid, sc = kidSize(k);
  ctx.save(); ctx.translate(k.x, k.y + 2); ctx.scale(sc, sc); ctx.translate(-k.x, -(k.y + 2));
  drawMeeple(ctx, k, t);
  ctx.restore();
}
const _col8 = FX.collect;
FX.collect = function (list, x0, y0, x1, y1) {
  _col8(list, x0, y0, x1, y1);
  sweepPlantSprites(R.time);
  for (const a of S.acorns || []) if (a.x > x0 - 60 && a.x < x1 + 60 && a.y > y0 - 30 && a.y < y1 + 110) list.push({ y: a.y + 1, k: 6, f: drawAcornItem, a });
  for (const k of S.kids || []) if (!k.in && k.x > x0 - 40 && k.x < x1 + 40 && k.y > y0 - 40 && k.y < y1 + 60) list.push({ y: k.y + 6, k: 6, f: drawKidItem, kid: k });
};
// bending down for an acorn; a child's skip
const _gp8 = gaitPose;
gaitPose = function (m) {
  const P = _gp8(m);
  if (!m.moving && m.act > 0 && ((m.task && m.task.type === 'gather') || m.goal)) { const k = Math.sin(Math.min(1, m.act / 0.5) * Math.PI); P.tilt = 0.5 * m.face * k; P.sq = 1 - 0.12 * k; P.bob = -2 * k; P.fr = -1; }
  if (m.hop > 0) P.bob += Math.abs(Math.sin(m.hop * 12.5)) * 5;
  return P;
};

// ---------------------------------------------------------------- hearts
FX.hearts = [];
FX.heart = function (x, y, n, spread) {
  for (let k = 0; k < (n || 1); k++) if (FX.hearts.length < 60) FX.hearts.push({ x: x + (Math.random() - 0.5) * (spread || 0), y: y + (Math.random() - 0.5) * (spread || 0) * 0.5, t: -k * 0.09, max: 1.5 + Math.random() * 0.6, ph: Math.random() * 6, s: 3 + Math.random() * 1.6 });
};
function heartShape(ctx, x, y, s) {
  ctx.beginPath(); ctx.moveTo(x, y + s * 0.9); ctx.bezierCurveTo(x - s * 1.5, y - s * 0.1, x - s * 0.85, y - s * 1.3, x, y - s * 0.55); ctx.bezierCurveTo(x + s * 0.85, y - s * 1.3, x + s * 1.5, y - s * 0.1, x, y + s * 0.9);
}
const _air8 = FX.air;
FX.air = function (ctx, t, dt, x0, y0, x1, y1) {
  _air8(ctx, t, dt, x0, y0, x1, y1);
  // sweethearts who happen to be side by side
  for (const P of S.pairs || []) {
    if (Math.random() > dt * (P.st === 'sweet' ? 0.14 : 0.2)) continue;
    const a = meepleById(P.a), b = meepleById(P.b);
    if (a && b && Math.hypot(a.x - b.x, a.y - b.y) < T * 1.7 && a.x > x0 && a.x < x1 && a.y > y0 && a.y < y1) FX.heart((a.x + b.x) / 2, (a.y + b.y) / 2 - 36, 1, 6);
  }
  for (let i = FX.hearts.length - 1; i >= 0; i--) {
    const h = FX.hearts[i]; h.t += dt;
    if (h.t < 0) continue;
    if (h.t >= h.max) { FX.hearts.splice(i, 1); continue; }
    const f = h.t / h.max, x = h.x + Math.sin(h.t * 3 + h.ph) * 4, y = h.y - f * 28, s = h.s * Math.min(1, 0.4 + f * 4);
    ctx.globalAlpha = f < 0.7 ? 1 : (1 - f) / 0.3;
    heartShape(ctx, x, y, s); ctx.fillStyle = '#e8463a'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 0.7; ctx.stroke();
    ell(ctx, x - s * 0.45, y - s * 0.45, s * 0.22, s * 0.16, 'rgba(255,255,255,0.7)');
  }
  ctx.globalAlpha = 1;
};

// ---------------------------------------------------------------- the cottage: smoke when somebody lives there, a lit window at night
const _db8 = drawBuilding;
drawBuilding = function (ctx, b, t, dt) {
  _db8(ctx, b, t, dt);
  if (b.type !== 'cottage') return;
  const bx = (b.x + 1) * T, by = (b.y + 2) * T, P = (S.pairs || []).find(p => p.home === b.id);
  if (!P) {      // nobody has moved in yet
    ctx.fillStyle = '#8a6a42'; ctx.fillRect(bx - 30, by - 22, 1.6, 12); rrect(ctx, bx - 36, by - 30, 13, 9, 1.5); ctx.fillStyle = '#fff6e2'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 0.7; ctx.stroke();
    heartShape(ctx, bx - 29.5, by - 25.3, 2.3); ctx.strokeStyle = '#e8463a'; ctx.lineWidth = 0.9; ctx.stroke();
    return;
  }
  const night = sunInfo().night, st = nestState(P);
  if (Math.random() < 0.035 * R.q.parts) addPart({ type: 'smoke', x: bx + 20.5, y: by - 100, vy: -14, vx: 4, max: 3, size: 5 });
  if (night > 0.05) { ctx.globalAlpha = night * 0.9; ctx.fillStyle = '#ffd870'; ctx.fillRect(bx - 26.5, by - 46, 10, 9.5); ctx.fillRect(bx + 15.5, by - 46, 10, 9.5); ctx.strokeStyle = '#fff6e2'; ctx.lineWidth = 1.2; ctx.beginPath(); for (const x of [-21.5, 20.5]) { ctx.moveTo(bx + x, by - 46); ctx.lineTo(bx + x, by - 36.5); ctx.moveTo(bx + x - 5, by - 41.3); ctx.lineTo(bx + x + 5, by - 41.3); } ctx.stroke(); ctx.globalAlpha = 1; }
  if (st.k === 'nesting') {       // a heart over the roof that fills as the day comes nearer
    const y = by - 104 + Math.sin(t * 2.2 + b.id) * 1.6, s = 5.2;
    heartShape(ctx, bx - 4, y, s); ctx.fillStyle = '#fff6e2'; ctx.fill();
    ctx.save(); heartShape(ctx, bx - 4, y, s); ctx.clip(); ctx.fillStyle = '#e8463a'; ctx.fillRect(bx - 14, y + s * 0.9 - st.frac * s * 2.1, 20, s * 2.2); ctx.restore();
    heartShape(ctx, bx - 4, y, s); ctx.strokeStyle = INK; ctx.lineWidth = 0.9; ctx.stroke();
  }
  if (night > 0.5 && (S.kids || []).some(k => k.in && k.home === b.id)) drawEmote(ctx, bx + 2, by - 92 + Math.sin(t * 1.5) * 1.5, 'zzz', 0.9);
};

// ---------------------------------------------------------------- moments
const _oe8 = R.onEvent;
R.onEvent = function (e) {
  switch (e.t) {
    case 'shed': FX.pop('b' + e.b, 'wobble', 0.7, 0.05); break;
    case 'acornfall':
      if (!onView(e.x, e.y - e.h)) break;
      for (let k = 0; k < 2; k++) addPart({ type: 'leaf', x: e.x + (Math.random() - 0.5) * 16, y: e.y - e.h + 4, vy: 15, max: 1.7, col: ['#68b04c', '#4f9a42'][k], size: 2 + Math.random() * 3 });
      AUDIO.sfx('rustle');
      break;
    case 'acornland': if (onView(e.x, e.y)) { addPart({ type: 'poof', x: e.x, y: e.y, max: 0.35, size: 3 }); AUDIO.sfx('knock'); } break;
    case 'acorngone': if (onView(e.x, e.y)) addPart({ type: 'poof', x: e.x, y: e.y - 2, max: 0.5, size: 4 }); break;
    case 'pickup':
      if (e.m) FX.hop[e.m] = R.time;
      if (onView(e.x, e.y)) { addPart({ type: 'float', x: e.x, y: e.y - 16, vy: -24, max: 0.9, icon: 'acorns', text: '+1' }); AUDIO.sfx('pop'); }
      break;
    case 'spark': { const a = meepleById(e.a), b = meepleById(e.b); if (a && b) { FX.heart(a.x, a.y - 40, 2, 8); FX.heart(b.x, b.y - 40, 2, 8); } break; }
    case 'inlove': { const a = meepleById(e.a), b = meepleById(e.b); if (a && b) { FX.heart((a.x + b.x) / 2, (a.y + b.y) / 2 - 34, 12, 46); FX.cheer[a.id] = R.time + 2.6; FX.cheer[b.id] = R.time + 2.6; } break; }
    case 'movedin': { const h = BMAP[e.home]; if (h) { FX.pop('b' + h.id, 'bounce', 0.8, 0.14); FX.heart((h.x + 1) * T, (h.y + 2) * T - 70, 8, 60); } break; }
    case 'baby': { const k = (S.kids || []).find(x => x.id === e.k); if (k) { FX.born[k.id] = R.time; FX.heart(k.x, k.y - 30, 10, 50); const h = BMAP[k.home]; if (h) FX.pop('b' + h.id, 'bounce', 0.8, 0.16); } break; }
    case 'grownup': { const m = meepleById(e.m); if (m) { FX.born[m.id] = R.time; FX.cheer[m.id] = R.time + 2.4; for (let k = 0; k < 10; k++) addPart({ type: 'spark', x: m.x + (Math.random() - 0.5) * 30, y: m.y - 10 - Math.random() * 34, max: 1 + Math.random() * 0.5, size: 4 + Math.random() * 3 }); } break; }
  }
  _oe8(e);
};
;(window.__stage = window.__stage || []).push('fx3.js loaded');
