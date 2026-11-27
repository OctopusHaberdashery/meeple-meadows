// Meeple Meadows — v1.8 game logic: landmarks hidden in the woods, Wonders built in stages, Charm and
// passers-by, Meeple wishes, little surprises (rainbows, shooting stars, a lost duckling, a travelling
// band), paths worn by many feet, and Meeples sheltering from the rain.
'use strict';

// ---------------------------------------------------------------- landmarks and Wonders (data)
const LANDMARKS = [
  { id: 'lm_cottage', name: 'Ruined Cottage', bonus: { craft: 0.08 }, perk: '+8% crafting speed', gift: ['coins', 3],
    story: 'Ivy has swallowed the walls, but the hearth is still standing. Tucked behind a loose stone is a recipe book in a careful hand: whoever lived here knew a thing or two about a kitchen.' },
  { id: 'lm_stones', name: 'Standing Stones', bonus: { grow: 0.06 }, perk: '+6% crop growth', gift: ['fertilizer', 12],
    story: 'Four mossy stones in a ring, older than the meadow itself. The grass inside the circle is greener than anywhere else, and on a still night the carvings seem to hum.' },
  { id: 'lm_boat', name: 'Beached Rowboat', bonus: { fish: 0.15 }, perk: '+15% faster bites', gift: ['xp', 200], water: 1,
    story: 'A little rowboat, hauled up among the reeds long ago and forgotten. Under the seat is a tin of hand-tied lures and a note: "They bite best at dusk."' },
  { id: 'lm_tree', name: 'Hollow Oak', bonus: { walk: 0.06 }, perk: '+6% Meeple speed', gift: ['seeds', 2],
    story: 'An oak so wide that six Meeples couldn\'t link arms around it. Someone carved a tiny door into the trunk. Inside: acorns stacked like firewood, and a map of every shortcut through these woods.' },
  { id: 'lm_shrine', name: 'Wayside Shrine', bonus: { sell: 0.06 }, perk: '+6% sell prices', gift: ['decor', 'statue'],
    story: 'A small stone shrine where travellers once left a coin for luck on the road to market. The bowl is empty now, but the luck, it turns out, is still here.' },
];
const WONDERS = [
  { id: 'w_clock', name: 'Clock Tower', lvl: 7, cost: 15000, tier: 1, bonus: { walk: 0.08 }, perk: '+8% Meeple speed',
    desc: 'A tall timber clock that chimes at every dawn. Built in four stages; once finished, every Meeple keeps better time.' },
  { id: 'w_hall', name: 'Harvest Hall', lvl: 15, cost: 120000, tier: 2, bonus: { sell: 0.1 }, perk: '+10% sell prices',
    desc: 'A great feasting hall with banners flying. Built in four stages; once finished, buyers come from every valley.' },
  { id: 'w_dome', name: 'Observatory', lvl: 23, cost: 500000, tier: 3, bonus: { grow: 0.08, craft: 0.08 }, perk: '+8% crop growth and crafting speed',
    desc: 'A stone tower with a copper dome and a brass telescope. Built in four stages; once finished, the almanac is never wrong.' },
];
const LANDMARK = {}, WONDER = {}, BONUS5 = {};
LANDMARKS.forEach(L => { LANDMARK[L.id] = L; BONUS5[L.id] = L.bonus; BUILDINGS[L.id] = { name: L.name, w: 2, h: 2, cost: 0, grow: 1, lvl: 0, cat: 'landmark', fixed: 1, charm: 5, desc: 'A landmark you uncovered in the woods. ' + L.perk + '.' }; });
WONDERS.forEach(W => { WONDER[W.id] = W; BONUS5[W.id] = W.bonus; BUILDINGS[W.id] = { name: W.name, w: 3, h: 3, cost: W.cost, grow: 1, lvl: W.lvl, cat: 'wonder', max: 1, fixed: 1, wonder: 1, charm: 10, desc: W.desc }; });
Object.keys(BUILDINGS).forEach(t => { const d = BUILDINGS[t], k = siteType(d); if (!BUILDINGS[k]) BUILDINGS[k] = { name: 'Building site', w: d.w, h: d.h, cost: 0, grow: 1, lvl: 0, cat: 'site', walk: d.walk ? 1 : 0, site: 1, desc: '' }; });
// their bonuses join the Journal's
const _rj5 = recalcJB;
recalcJB = function () { _rj5(); if (S) for (const b of S.buildings) { const d = BONUS5[b.type]; if (d) for (const k in d) JB[k] = (JB[k] || 0) + d[k]; } };
const _fs5 = finishSite;
finishSite = function (b) { _fs5(b); recalcJB(); };
const _dem5 = demolish;
demolish = function (b) { return BUILDINGS[b.type].fixed ? false : _dem5(b); };
const _mv5 = moveBuilding;
moveBuilding = function (b, x, y) { return BUILDINGS[b.type].cat === 'landmark' ? false : _mv5(b, x, y); };
const surpriseCoins = () => { const c = LEVELS.slice(0, S.level + 1).map(l => l.crop).filter(Boolean); return Math.max(40, Math.round(sellPrice(c[c.length - 1]) * Math.max(9, farmPlots()) * 1.5)); };

// ---------------------------------------------------------------- landmarks
let LM_TILE = {}, LM_S = null, LM_KEY = '';
function syncLm() {
  const key = S.landmarks ? S.landmarks.map(l => l.found ? 1 : 0).join('') : '';
  if (LM_S === S && LM_KEY === key) return;
  LM_S = S; LM_KEY = key; LM_TILE = {};
  (S.landmarks || []).forEach((l, k) => { if (!l.found) for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) LM_TILE[idx(l.x + dx, l.y + dy)] = k; });
}
const lmAt = i => { syncLm(); const k = LM_TILE[i]; return k == null ? null : S.landmarks[k]; };
const _cc5 = canClear;
canClear = function (i) { return S.landmarks && lmAt(i) ? false : _cc5(i); };
function genLandmarks() {
  const rnd = mulberry((S.seed || 1) + 4242), out = [];
  const wooded = (x, y) => { for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) { if (!inMap(x + dx, y + dy)) return false; const c = S.cover[idx(x + dx, y + dy)]; if (!c || c === COVER.WATER) return false; } return x > 2 && y > 3 && x < MW - 4 && y < MH - 4; };
  const hidden = (x, y) => { for (let dy = -2; dy <= 3; dy++) for (let dx = -2; dx <= 3; dx++) if (inMap(x + dx, y + dy) && S.cover[idx(x + dx, y + dy)] === COVER.NONE) return false; return true; };
  const byWater = (x, y) => { for (let dy = -1; dy <= 2; dy++) for (let dx = -1; dx <= 2; dx++) if (inMap(x + dx, y + dy) && S.cover[idx(x + dx, y + dy)] === COVER.WATER) return true; return false; };
  const clear = (x, y) => !out.some(o => Math.abs(o.x - x) < 5 && Math.abs(o.y - y) < 5);
  LANDMARKS.forEach((L, k) => {
    if (L.water) {
      const c = [];
      for (let y = 4; y < MH - 5; y++) for (let x = 3; x < MW - 5; x++) if (wooded(x, y) && byWater(x, y) && hidden(x, y) && clear(x, y)) c.push([x, y]);
      if (c.length) { const p = c[(rnd() * c.length) | 0]; out.push({ id: L.id, x: p[0], y: p[1], found: false }); return; }
    }
    for (let tries = 0; tries < 500; tries++) {
      const ang = (k / LANDMARKS.length + rnd() * 0.18) * Math.PI * 2, r = 6 + rnd() * 8 + tries * 0.03;
      const x = Math.round(CX + Math.cos(ang) * r * 1.3), y = Math.round(CY + Math.sin(ang) * r);
      if (wooded(x, y) && hidden(x, y) && clear(x, y)) { out.push({ id: L.id, x, y, found: false }); return; }
    }
  });
  return out;
}
// a landmark can be explored once open land touches it
function lmReachable(l) {
  for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const x = l.x + dx + ax, y = l.y + dy + ay;
    if (inMap(x, y) && S.cover[idx(x, y)] === COVER.NONE) return true;
  }
  return false;
}
function discoverLandmark(l) {
  if (!l || l.found || !lmReachable(l)) return false;
  const L = LANDMARK[l.id];
  for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) { const i = idx(l.x + dx, l.y + dy); S.cover[i] = COVER.NONE; S.floor[i] = FLOOR.GRASS; }
  l.found = true;
  addBuilding(l.id, l.x, l.y, true);
  rebuildOcc(); recalcJB();
  const g = L.gift, e = { t: 'landmark', id: l.id, x: l.x, y: l.y };
  if (g[0] === 'coins') { e.coins = surpriseCoins() * g[1]; S.coins += e.coins; S.stats.earned += e.coins; }
  else if (g[0] === 'fertilizer') { invAdd('fertilizer', g[1], false); e.gift = g[1] + ' fertilizer'; }
  else if (g[0] === 'xp') { addFishXP(g[1]); e.gift = g[1] + ' fishing XP'; }
  else if (g[0] === 'seeds') { const s = TREES[0].seed; invAdd(s, g[1], false); e.gift = g[1] + ' ' + ITEM[s].name.toLowerCase() + 's'; }
  else if (g[0] === 'decor') { S.found[g[1]] = (S.found[g[1]] || 0) + 1; e.gift = 'a ' + BUILDINGS[g[1]].name; }
  S.stats.landmarks = (S.stats.landmarks || 0) + 1;
  emit(e);
  return true;
}

// ---------------------------------------------------------------- Wonders: four deliveries, four stretches of building
function wonderReqs(type) {
  const W = WONDER[type], crops = LEVELS.slice(0, S.level + 1).map(l => l.crop).filter(Boolean).slice(-5);
  // only goods a plain farm can make: crops through the crafting buildings, nothing that needs animals, trees or fish
  const seen = {}, goods = [], plain = {};
  const isPlain = id => { if (plain[id] != null) return plain[id]; plain[id] = false; if (CROP[id]) return plain[id] = !CROP[id].flower && cropUnlocked(id); const r = RECIPES.find(x => x.out[0] === id); return plain[id] = !!r && recipeUnlocked(r) && bUnlocked(r.at) && BUILDINGS[r.at].cat === 'craft' && r.at !== 'chandlery' && Object.keys(r.in).every(isPlain); };
  for (const r of RECIPES) { const id = r.out[0]; if (seen[id] || CROP[id] || !isPlain(id)) continue; seen[id] = 1; goods.push(r); }
  const late = goods.slice(-8), h = type.length, out = [];
  for (let s = 0; s < 4; s++) {
    const req = {}, c = crops[(s + h) % crops.length];
    req[c] = Math.round(120 * (s + 1) * W.tier * Math.max(0.5, 60 / CROP[c].grow));
    if (late.length) { const r = late[(s * 3 + h) % late.length]; req[r.out[0]] = Math.max(4, Math.round(10 * (s + 1) * W.tier * Math.min(2, 60 / r.t) * r.out[1])); }
    else { const c2 = crops[(s + h + 1) % crops.length]; if (c2 !== c) req[c2] = Math.round(80 * (s + 1) * W.tier); }
    out.push(req);
  }
  return out;
}
const _ss5 = startSite;
startSite = function (type, x, y, cost) {
  const b = _ss5(type, x, y, cost);
  if (BUILDINGS[type].wonder && b.con) { b.con.need = 900 + 500 * WONDER[type].tier; b.con.stage = 0; b.con.req = wonderReqs(type); }
  return b;
};
const wonderCanDeliver = b => !!(b.con && b.con.req && b.con.stage < 4 && siteWaiting(b) && Object.keys(b.con.req[b.con.stage]).every(k => (S.inv[k] || 0) >= b.con.req[b.con.stage][k]));
function deliverWonder(b) {
  if (!wonderCanDeliver(b)) return false;
  const req = b.con.req[b.con.stage];
  for (const k in req) invTake(k, req[k]);
  b.con.stage++; b.con.idle = 0;
  emit({ t: 'wstage', b: b.id, stage: b.con.stage });
  return true;
}

// ---------------------------------------------------------------- Charm, passers-by and the travelling band
let CHARM = 0, WALKERS = [], _wid = -1;
function calcCharm() {
  let c = 0;
  for (const b of S.buildings) { const d = BUILDINGS[b.type]; c += d.charm || (d.cat === 'decor' ? (b.type === 'fountain' ? 3 : d.found ? 2 : 1) : 0); }
  return c;
}
const passerEvery = () => CHARM < 3 ? 0 : Math.max(70, 320 - CHARM * 7);
function edgeTile() {
  for (let k = 0; k < 300; k++) {
    const x = 2 + ((Math.random() * (MW - 4)) | 0), y = 2 + ((Math.random() * (MH - 4)) | 0), i = idx(x, y);
    if (!walkable(i) || S.plots[i]) continue;
    if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const c = S.cover[idx(x + dx, y + dy)]; return c && c !== COVER.WATER; })) return i;
  }
  return -1;
}
const WALK_COL = ['#8a6ab0', '#4f8ab0', '#b0704f', '#5a9a6a', '#b05a7a', '#7a7ab8', '#c8a040', '#6ab0a8'];
function makeWalker(start, path, band, delay) {
  const hats = Object.keys(HAT_DRAW);
  return { id: _wid--, x: (start % MW) * T + T / 2, y: ((start / MW) | 0) * T + T / 2, path: path.slice(), back: [start].concat(path).reverse().slice(1), st: 'in', t: -(delay || 0), band: !!band,
    col: WALK_COL[(Math.random() * WALK_COL.length) | 0], crop: 'founder', hat: Math.random() < 0.75 ? hats[(Math.random() * hats.length) | 0] : null, hand: [], moving: false, bob: Math.random() * 6, face: 1, gait: band ? 'march' : 'walk', task: null, emo: null, act: 0, can: 0, looked: false, walker: true };
}
function spawnWalkers(band) {
  const mk = S.buildings.find(b => b.type === 'market'); if (!mk) return false;
  const goal = new Set(accessTiles(mk).filter(walkable)); if (!goal.size) return false;
  for (let tries = 0; tries < 6; tries++) {
    const start = edgeTile(); if (start < 0) return false;
    const r = bfs(start, i => goal.has(i)); if (!r || r.path.length < 4) continue;
    if (band) for (let k = 0; k < 3; k++) WALKERS.push(makeWalker(start, r.path, true, k * 0.9));
    else WALKERS.push(makeWalker(start, r.path, false, 0));
    return true;
  }
  return false;
}
function tickWalkers(dt) {
  for (let k = WALKERS.length - 1; k >= 0; k--) {
    const w = WALKERS[k]; w.bob += dt; w.t += dt;
    if (w.emo && (w.emo.t -= dt) <= 0) w.emo = null;
    if (w.t < 0) { w.moving = false; continue; }
    if (w.st === 'look' || w.st === 'shop' || w.st === 'play') {
      w.moving = false;
      if (w.st === 'play' && Math.random() < dt * 0.9) w.emo = { k: 'note', t: 1.2 };
      if (w.t < w.wait) continue;
      if (w.st === 'shop') { const v = Math.round(surpriseCoins() * (0.5 + CHARM * 0.04)); S.coins += v; S.stats.earned += v; S.stats.tips = (S.stats.tips || 0) + v; emit({ t: 'tip', v, x: w.x, y: w.y }); w.st = 'out'; w.path = w.back; }
      else if (w.st === 'play') { w.st = 'out'; w.path = w.back; }
      else w.st = w.was;
      continue;
    }
    if (!w.path.length) {
      if (w.st === 'in') { w.st = w.band ? 'play' : 'shop'; w.t = 0; w.wait = w.band ? 26 : 3; if (w.band && !WALKERS.some(o => o.band && o !== w && o.st === 'play')) { for (const m of S.meeples) m.happy = Math.max(m.happy || 0, S.playTime + 150); emit({ t: 'band' }); } }
      else WALKERS.splice(k, 1);
      continue;
    }
    if (!walkable(w.path[0])) { WALKERS.splice(k, 1); continue; }       // the way has been built over: they wander off
    lookAhead(w, dt);
    const wx = w.x, wy = w.y, wf = tileOf(w), moved = stepAlong(w, 1.7 * T * dt), wn = tileOf(w);
    if (wn !== wf && !walkable(wn)) { w.x = wx; w.y = wy; WALKERS.splice(k, 1); continue; }
    treadOn(w, moved);
    w.moving = true;
    // stop to admire something pretty on the way in
    if (!w.band && !w.looked && w.st === 'in') for (const b of S.buildings) {
      const dd = BUILDINGS[b.type]; if (!(dd.charm || dd.cat === 'decor')) continue;
      if (Math.abs((b.x + dd.w / 2) * T - w.x) < T * 1.8 && Math.abs((b.y + dd.h / 2) * T - w.y) < T * 1.8) { w.looked = true; w.was = 'in'; w.st = 'look'; w.t = 0; w.wait = 2.4; w.face = (b.x + dd.w / 2) * T >= w.x ? 1 : -1; w.emo = { k: 'heart', t: 2.2 }; break; }
    }
  }
}

// ---------------------------------------------------------------- Meeple wishes
const happyMult = m => m.happy > S.playTime ? 1.15 : 1;
const boostMult = () => S.boostUntil > S.playTime ? 1.25 : 1;
function wishHave(w) {
  if (w.k === 'hat') { const m = S.meeples.find(x => x.id === w.m); return m && m.hat === w.a ? 1 : 0; }
  if (w.k === 'crop') { let n = 0; for (const k in S.plots) if (S.plots[k].crop === w.a) n++; return n; }
  return bReady(w.a);
}
function wishText(w) {
  const m = S.meeples.find(x => x.id === w.m), nm = m ? m.name : 'A Meeple';
  if (w.k === 'hat') return `${nm} would love to wear the <b>${HATS.find(h => h.id === w.a).name}</b>.`;
  if (w.k === 'crop') return `${nm} wishes there were <b>${w.n} plots of ${CROP[w.a].name.toLowerCase()}</b> (${Math.min(w.n, wishHave(w))}/${w.n}).`;
  return `${nm} dreams of a new <b>${BUILDINGS[w.a].name}</b> on the farm.`;
}
function newMeepleWish() {
  const m = S.meeples[(Math.random() * S.meeples.length) | 0], opts = [];
  const hats = S.hats.filter(h => h !== m.hat && HAT_DRAW[h]);
  if (hats.length) opts.push([{ k: 'hat', a: hats[(Math.random() * hats.length) | 0], n: 1 }, 3]);
  const crop = m.crop !== 'founder' && cropUnlocked(m.crop) ? m.crop : LEVELS[Math.max(0, S.level - ((Math.random() * 3) | 0))].crop || 'carrot';
  let have = 0; for (const k in S.plots) if (S.plots[k].crop === crop) have++;
  opts.push([{ k: 'crop', a: crop, n: Math.max(3, have + 2) }, 3]);
  for (const d of ['bench', 'lantern', 'flowers']) if (bUnlocked(d)) opts.push([{ k: 'decor', a: d, n: bReady(d) + 1 }, 1]);
  const w = pickW(opts); w.m = m.id; w.until = S.playTime + 600;
  return w;
}
function tickWish() {
  const w = S.wish;
  if (w) {
    const m = S.meeples.find(x => x.id === w.m);
    if (m && wishHave(w) >= w.n) { m.happy = S.playTime + 600; S.wish = null; S.wishNext = S.playTime + 360 + Math.random() * 300; S.stats.wishes = (S.stats.wishes || 0) + 1; emit({ t: 'wishdone', m: m.id }); }
    else if (!m || S.playTime > w.until) { S.wish = null; S.wishNext = S.playTime + 240 + Math.random() * 240; }
  } else if (S.meeples.length >= 2 && S.playTime > (S.wishNext || 0)) { S.wish = newMeepleWish(); emit({ t: 'wish' }); }
}

// ---------------------------------------------------------------- little surprises (never saved; noticing them is the point)
const SURP = { rainbow: null, star: null, duck: null, starT: 70, duckT: 500, wasRain: false, lastDay: 0.3 };
function catchRainbow() { const r = SURP.rainbow; if (!r || r.got) return false; r.got = true; r.max = Math.min(r.max, r.t + 6); const v = surpriseCoins(); S.coins += v; S.stats.earned += v; emit({ t: 'surprise', k: 'rainbow', v }); return true; }
function catchStar() {
  const s = SURP.star; if (!s || s.got) return false; s.got = true;
  const e = { t: 'surprise', k: 'star' }, pick = pickW([['coins', 3], ['fert', bUnlocked('compost') ? 2 : 0], ['boost', 3]]);
  if (pick === 'coins') { e.v = surpriseCoins() * 2; S.coins += e.v; S.stats.earned += e.v; }
  else if (pick === 'fert') { invAdd('fertilizer', 6, false); e.gift = '6 fertilizer'; }
  else { S.boostUntil = S.playTime + 180; e.gift = 'stardust: crops grow 25% faster for 3 minutes'; }
  emit(e); return true;
}
function guideDuck() {
  const d = SURP.duck; if (!d || d.st !== 'lost') return false;
  const wet = i => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => inMap((i % MW) + dx, ((i / MW) | 0) + dy) && S.cover[idx((i % MW) + dx, ((i / MW) | 0) + dy)] === COVER.WATER);
  const r = bfs(idx(Math.floor(d.x / T), Math.floor(d.y / T)), i => walkable(i) && wet(i));
  d.st = 'home'; d.path = r ? r.path : []; d.t = 0;
  return true;
}
function tickSurprises(dt) {
  const raining = S.weather && S.weather.rain > 0, night = isNight();
  if (SURP.wasRain && !raining && !night) { SURP.rainbow = { t: 0, max: 75, got: false }; emit({ t: 'rainbow' }); }
  SURP.wasRain = raining;
  const rb = SURP.rainbow; if (rb && (rb.t += dt) > rb.max) SURP.rainbow = null;
  const st = SURP.star;
  if (st) { if ((st.t += dt) > st.max) SURP.star = null; }
  else if (night && !raining && (SURP.starT -= dt) <= 0) {
    SURP.starT = 70 + Math.random() * 120;
    const l = Math.random() < 0.5; SURP.star = { t: 0, max: 5.5, fly: 1.7, x0: l ? 0.05 + Math.random() * 0.3 : 0.95 - Math.random() * 0.3, y0: 0.06 + Math.random() * 0.12, dx: (l ? 1 : -1) * (0.35 + Math.random() * 0.2), dy: 0.2 + Math.random() * 0.15, got: false };
    emit({ t: 'star' });
  }
  const d = SURP.duck;
  if (d) {
    d.t += dt; d.bob = (d.bob || 0) + dt;
    if (d.st === 'lost') { if (d.t > 260) SURP.duck = null; }
    else if (d.path.length) {
      lookAhead(d, dt); stepAlong(d, 1.5 * T * dt);
    } else { const v = surpriseCoins(); S.coins += v; S.stats.earned += v; emit({ t: 'surprise', k: 'duck', v, x: d.x, y: d.y }); SURP.duck = null; }
  } else if ((SURP.duckT -= dt) <= 0) {
    SURP.duckT = 600 + Math.random() * 700;
    let hasWater = false; for (let i = 0; i < MW * MH && !hasWater; i++) hasWater = S.cover[i] === COVER.WATER;
    const i = hasWater ? edgeTile() : -1;
    if (i >= 0) { SURP.duck = { x: (i % MW) * T + T / 2, y: ((i / MW) | 0) * T + T / 2, st: 'lost', t: 0, face: 1, path: [] }; emit({ t: 'duckling' }); }
  }
}

// ---------------------------------------------------------------- desire paths: the ground remembers every footstep
// Wear is kept on a grid three times finer than the tiles, one count per cell plus the way people were
// heading when they crossed it. Each stride adds a little; grass slowly grows back. The renderer turns
// the counts into trampled grass, footprints and, where enough feet have passed, a bare earth trail.
const WN = 3, WC = T / WN, WW = MW * WN, WH = MH * WN, WCH = 8 * WN, WCX = Math.ceil(MW / 8), WCY = Math.ceil(MH / 8);
const WEAR = { w: new Uint8Array(WW * WH), d: new Uint8Array(WW * WH), dirty: new Uint8Array(WCX * WCY), of: null };
function wearTouch(x, y) {      // the picture of this cell (and of a chunk it leans into) needs redrawing
  for (let dy = -1; dy <= 1; dy += 2) for (let dx = -1; dx <= 1; dx += 2) {
    const cx = Math.floor((x + dx) / WCH), cy = Math.floor((y + dy) / WCH);
    if (cx >= 0 && cy >= 0 && cx < WCX && cy < WCY) WEAR.dirty[cy * WCX + cx] = 1;
  }
}
function wearSync() {           // a new or loaded farm brings its own trails
  if (WEAR.of === S) return;
  WEAR.of = S; WEAR.w.fill(0); WEAR.d.fill(0); WEAR.dirty.fill(1);
  const a = S.wear;
  if (Array.isArray(a)) {
    let i = 0;
    for (let k = 0; k + 1 < a.length; k += 2) { i += a[k]; if (i >= 0 && i < WW * WH) { WEAR.w[i] = Math.min(63, a[k + 1] >> 3); WEAR.d[i] = a[k + 1] & 7; } }
  } else if (S.tread) {         // v1.8 kept one number per tile: turn it into trails along the old rows and columns
    for (const k in S.tread) {
      const v = Math.min(63, Math.round(S.tread[k])), x = (+k) % MW, y = ((+k) / MW) | 0; if (v < 3 || !inMap(x, y)) continue;
      const c = (y * WN + 1) * WW + x * WN + 1, side = (n, d) => { const q = S.tread[idx(x + (d ? 0 : n), y + (d ? n : 0))]; return q >= 3; };
      WEAR.w[c] = v; WEAR.d[c] = side(1, 0) || side(-1, 0) ? 0 : 4;
      if (inMap(x - 1, y) && side(-1, 0)) { WEAR.w[c - 1] = v; WEAR.d[c - 1] = 0; }
      if (inMap(x + 1, y) && side(1, 0)) { WEAR.w[c + 1] = v; WEAR.d[c + 1] = 0; }
      if (inMap(x, y - 1) && side(-1, 1)) { WEAR.w[c - WW] = v; WEAR.d[c - WW] = 4; }
      if (inMap(x, y + 1) && side(1, 1)) { WEAR.w[c + WW] = v; WEAR.d[c + WW] = 4; }
    }
  }
  delete S.tread;
}
function wearPack() {           // [gap, wear * 8 + heading, gap, ...]; the faintest marks aren't worth keeping
  const out = []; let last = 0;
  for (let i = 0; i < WW * WH; i++) { const w = WEAR.w[i]; if (w < 3) continue; out.push(i - last, w * 8 + WEAR.d[i]); last = i; }
  return out;
}
const _ser5 = serialize;
serialize = function () { if (S && WEAR.of === S) S.wear = wearPack(); return _ser5(); };
function wearFade() {           // grass grows back: about 6% of the wear goes each time
  const A = WEAR.w;
  for (let i = 0; i < A.length; i++) { const w = A[i]; if (!w) continue; const f = w * 0.94; A[i] = (f | 0) + (Math.random() < f - (f | 0) ? 1 : 0); }
  WEAR.dirty.fill(1);
}
// o has just walked `moved` world units; every stride presses the ground underfoot a little more
function treadOn(o, moved) {
  const L = lookOf(o);
  if ((L.s += moved) < 8) return;
  L.s %= 8;
  wearSync();
  const x = o.x + (Math.random() - 0.5) * 7, y = o.y + 2 + (Math.random() - 0.5) * 5, tx = Math.floor(x / T), ty = Math.floor(y / T);
  if (!inMap(tx, ty) || S.floor[ty * MW + tx] !== FLOOR.GRASS) return;
  const cx = Math.floor(x / WC), cy = Math.floor(y / WC), i = cy * WW + cx, w = WEAR.w[i];
  if (w < 4 || Math.random() < 0.12) WEAR.d[i] = ((Math.round(L.a / (Math.PI / 8)) % 8) + 8) % 8;     // which way the trail runs here (eight headings; either way along it)
  if (w >= 63) return;
  WEAR.w[i] = w + 1;
  if (w < 4 || (w & 1)) wearTouch(cx, cy);
}

// ---------------------------------------------------------------- sheltering from the rain
const _im5 = idleMoment;
idleMoment = function (m, s) {
  if (S.weather && S.weather.rain > 0 && Math.random() < 0.7) {
    const tree = i => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const x = (i % MW) + dx, y = ((i / MW) | 0) + dy; if (!inMap(x, y)) return false; const c = S.cover[idx(x, y)]; return c === COVER.TREE || c === COVER.BIG; });
    const r = bfs(s, i => walkable(i) && tree(i), 9);
    if (r) { const t = 6 + Math.random() * 6; m.path = r.path; m.task = { type: 'rest', kind: 'shelter', b: 0, t, max: t }; return true; }
  }
  return _im5(m, s);
};
const _ar5 = arrive4;
arrive4 = function (m, t, dt) {
  if (t.type === 'rest' && t.kind === 'shelter') {
    t.t -= dt;
    if (t.t <= 0 || !(S.weather && S.weather.rain > 0) || (WORK_WAITING && t.max - t.t > 2.5)) { m.task = null; m.wait = 0.3; }
    return;
  }
  _ar5(m, t, dt);
};

// ---------------------------------------------------------------- tick
let _t5 = 0, _passT = 60;
function tick5(dt) {
  wearSync();
  if (!S.landmarks) S.landmarks = genLandmarks();
  if (S.wishNext == null) S.wishNext = S.playTime + 240;
  if (S.bandNext == null) S.bandNext = S.playTime + 1200 + Math.random() * 900;
  tickWalkers(dt);
  tickSurprises(dt);
  // dawn and dusk
  if (SURP.lastDay < 0.25 && S.day >= 0.25) emit({ t: 'dawn' });
  SURP.lastDay = S.day;
  if ((_t5 += dt) < 2) return;
  _t5 = 0;
  CHARM = calcCharm();
  tickWish();
  const every = passerEvery();
  if (every && S.slot !== -1 && (_passT -= 2) <= 0) { _passT = every * (0.7 + Math.random() * 0.6); if (WALKERS.length < 3) spawnWalkers(false); }
  if (S.slot !== -1 && S.level >= 3 && S.playTime > S.bandNext && !isNight()) { S.bandNext = S.playTime + 1500 + Math.random() * 1500; spawnWalkers(true); }
  // old trails slowly grow over
  if (Math.random() < 0.05) wearFade();
  // a reachable landmark is worth a nudge, once
  for (const l of S.landmarks) if (!l.found && !l.seen && lmReachable(l)) { l.seen = true; emit({ t: 'lmnear', id: l.id }); }
}
const _ux5 = updateExtras;
updateExtras = function (dt) { _ux5(dt); tick5(dt); };
;(window.__stage = window.__stage || []).push('world5.js loaded');
