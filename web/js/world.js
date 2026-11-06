// Meeple Meadows — world state, map generation, simulation, saving.
'use strict';

const MW = 64, MH = 48;            // map size in tiles
const CX = 32, CY = 24;            // homestead centre
const DAY_LEN = 960;               // seconds per visual day
const COVER = { NONE: 0, BRUSH: 1, TREE: 2, BIG: 3, ROCK: 4, WATER: 5 };
const FLOOR = { GRASS: 0, PATH: 1, PLOT: 2 };
const COVER_COST = [0, 4, 15, 45, 70, 0];
const COVER_NAME = ['', 'Brambles', 'Tree', 'Old Tree', 'Boulder', 'Pond'];

let S = null;            // current game state
let OCC = null;          // Int32Array tile -> building id (runtime)
let BMAP = {};           // building id -> building
let GHMAP = null;        // Int32Array tile -> greenhouse id (runtime)
const EV = [];           // events for renderer/ui: {t:'pop', ...}
function emit(e) { EV.push(e); }

const idx = (x, y) => y * MW + x;
const inMap = (x, y) => x >= 0 && y >= 0 && x < MW && y < MH;

// ---------------------------------------------------------------- new game
function newGame(slot) {
  const seed = (Math.random() * 1e9) | 0;
  S = {
    v: 2, slot, seed, created: Date.now(), playTime: 0, day: 0.32, lastSeason: 1, weather: { rain: 0, next: 300 }, fishXP: 0,
    coins: 20, level: 0, won: false, fairSeen: false,
    lifetime: {}, inv: {}, auto: {}, upg: {},
    cover: new Uint8Array(MW * MH), floor: new Uint8Array(MW * MH),
    plots: {}, buildings: [], meeples: [], nextId: 1,
    stats: { sold: 0, earned: 0, cleared: 0, made: 0, crafted: 0 },
    built: {}, // type -> count ever bought (for cost scaling)
    tutorial: 0,
  };
  genMap(seed);
  // starting layout
  for (let y = CY - 1; y <= CY + 1; y++) for (let x = CX - 4; x <= CX - 2; x++) makePlot(idx(x, y), 'carrot', true);
  addBuilding('storehouse', CX + 1, CY - 3, true);
  addBuilding('market', CX + 1, CY + 1, true);
  for (let y = CY - 2; y <= CY + 2; y++) S.floor[idx(CX, y)] = FLOOR.PATH;
  S.floor[idx(CX - 1, CY)] = FLOOR.PATH;
  rebuildOcc();
  const m = makeMeeple('founder', CX * T + T / 2, CY * T + T / 2);
  m.name = 'Pip';
  S.meeples.push(m);
  initExtras(S); recalcJB();
  return S;
}

function genMap(seed) {
  const rnd = mulberry(seed);
  const ponds = [];
  ponds.push([CX - 9 + rnd() * 2, CY + 5 + rnd() * 2, 2.1 + rnd() * 0.6]);
  for (let i = 0; i < 5; i++) {
    const a = rnd() * Math.PI * 2, d = 12 + rnd() * 14;
    ponds.push([CX + Math.cos(a) * d * 1.3, CY + Math.sin(a) * d * 0.9, 1.4 + rnd() * 2]);
  }
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const i = idx(x, y), dx = x - CX + 0.5, dy = y - CY;
    const warp = (fbm(x * 0.18, y * 0.18, seed) - 0.5) * 3.2;
    const d = Math.sqrt((dx / 1.25) ** 2 + dy * dy) + warp;
    let c = COVER.NONE;
    if (d < 5.6) c = COVER.NONE;
    else if (d < 8.2) c = hash2(x, y, seed + 1) < 0.78 ? COVER.BRUSH : (hash2(x, y, seed + 2) < 0.5 ? COVER.TREE : COVER.NONE);
    else {
      const rockN = fbm(x * 0.22 + 50, y * 0.22, seed + 9);
      const bigP = Math.min(0.55, (d - 8) / 40);
      const h = hash2(x, y, seed + 3);
      if (rockN > 0.66 && h < 0.6) c = COVER.ROCK;
      else if (h < 0.12) c = COVER.BRUSH;
      else if (h < 0.12 + bigP) c = COVER.BIG;
      else c = COVER.TREE;
    }
    for (const [px, py, pr] of ponds) {
      const pd = Math.hypot((x + 0.5 - px) / 1.2, y + 0.5 - py) + (fbm(x * 0.5, y * 0.5, seed + 4) - 0.5) * 1.2;
      if (pd < pr && Math.hypot(x - CX, y - CY) > 4.5) c = COVER.WATER;
    }
    S.cover[i] = c;
  }
}

// ---------------------------------------------------------------- entities
function makePlot(i, crop, planted, gh) {
  S.floor[i] = FLOOR.PLOT;
  S.plots[i] = { crop, t: 0, st: planted ? 1 : 0, gen: 0, claim: 0, wclaim: 0, wet: false, bonus: 1, plan: {} };
  if (gh) S.plots[i].gh = gh;
}

// ---------------------------------------------------------------- seasons
// Seasons were removed in v1.4 (waiting for a season to unlock a crop took too long).
// The helpers stay so older code paths keep working: it's always summer and every crop is in season.
const seasonIdx = () => 1;
const seasonYear = () => Math.floor(S.playTime / (SEASON_LEN * 4)) + 1;
const seasonLeft = () => SEASON_LEN - (S.playTime % SEASON_LEN);
const cropInSeason = () => true;
const plotInSeason = p => !!p.gh || cropInSeason(p.crop);
// first growth uses the full grow time; regrowth on a living plant is quicker
const growTarget = p => (p.gen | 0) > 0 ? CROP[p.crop].regrow : CROP[p.crop].grow;
const harvestsLeft = p => { const h = CROP[p.crop].harvests; return h === 0 ? Infinity : Math.max(0, h - (p.gen | 0)); };
function applySeasonPlans() {
  const sea = seasonIdx();
  for (const k in S.plots) { const p = S.plots[k]; if (!p.gh && p.plan && p.plan[sea] && p.plan[sea] !== p.crop) setPlotCrop(+k, p.plan[sea], true); }
}
function addBuilding(type, x, y, free) {
  const b = { id: S.nextId++, type, x, y };
  if (BUILDINGS[type].proc) Object.assign(b, { recipe: null, repeat: true, phase: 'idle', got: {}, transit: {}, t: 0, out: 0, claim: 0 });
  if (type === 'creator') Object.assign(b, { queue: [], t: 0 });
  S.buildings.push(b);
  BMAP[b.id] = b;
  if (type === 'coop' || type === 'barn' || type === 'hive' || type === 'duckhouse' || BUILDINGS[type].tree) { const r = RECIPES.find(x => x.at === type && recipeUnlocked(x)); if (r) setRecipe(b, r.id); }
  if (BUILDINGS[type].tree) b.age = 0;
  if (!free) S.built[type] = (S.built[type] || 0) + 1;
  return b;
}
function rebuildOcc() {
  OCC = new Int32Array(MW * MH);
  GHMAP = new Int32Array(MW * MH);
  BMAP = {};
  for (const b of S.buildings) {
    BMAP[b.id] = b;
    const d = BUILDINGS[b.type];
    for (let yy = 0; yy < d.h; yy++) for (let xx = 0; xx < d.w; xx++) (d.walk ? GHMAP : OCC)[idx(b.x + xx, b.y + yy)] = b.id;
  }
  computePlotBonus();
  if (window.R && R.ready) R.groundDirtyAll();
}
function computePlotBonus() {
  const crows = S.buildings.filter(b => b.type === 'scarecrow'), hives = S.buildings.filter(b => b.type === 'hive');
  for (const k in S.plots) {
    const i = +k, x = i % MW, y = (i / MW) | 0;
    let m = 1;
    if (crows.some(w => Math.max(Math.abs(x - w.x), Math.abs(y - w.y)) <= 2)) m *= 1.1;
    if (hives.some(w => Math.max(Math.abs(x - w.x), Math.abs(y - w.y)) <= 3)) m *= 1.15;
    S.plots[k].bonus = m;
  }
}

function makeMeeple(crop, x, y) {
  let st;
  if (crop === 'founder') st = { speed: 2.0, carry: 2, work: 1.0, col: '#e8b070', trait: 'Founder' };
  else st = CROP[crop].meeple;
  const v = () => 0.92 + Math.random() * 0.16;
  const used = new Set(S.meeples.map(m => m.name));
  const free = MEEPLE_NAMES.filter(n => !used.has(n));
  const col = crop === 'founder' ? st.col : shade(st.col, (Math.random() - 0.5) * 0.25);
  return {
    id: S.nextId++, crop, name: free.length ? free[(Math.random() * free.length) | 0] : 'Meeple ' + S.nextId,
    col, trait: st.trait,
    speed: +(st.speed * v()).toFixed(2), carry: st.carry, work: +(st.work * v()).toFixed(2),
    x, y, path: [], task: null, hand: [], can: 0, farm: true, haul: true, water: true, wait: 0, bob: Math.random() * 6, face: 1, act: 0,
    gait: randGait(),
  };
}

// ---------------------------------------------------------------- derived stats
const upg = id => S.upg[id] || 0;
const mSpeed = m => m.speed * (1 + 0.1 * upg('boots') + JB.walk);
const mCarry = m => m.carry + upg('basket');
const mWork = m => m.work * (1 + 0.15 * upg('hands'));
const growMult = p => (1 + 0.12 * upg('soil') + JB.grow) * legacyMult() * p.bonus * (p.gh ? 1.5 * 1.6 : (p.wet ? 1.6 : 1));
const canCap = m => 4 + 3 * upg('cans') + Math.floor(m.carry / 2);
const hasWell = () => S.buildings.some(b => b.type === 'well');
const craftMult = () => 1 + 0.12 * upg('copper') + JB.craft;
const sellPrice = id => Math.max(1, Math.round(ITEM[id].price * (1 + 0.1 * upg('haggle') + JB.sell) * legacyMult()));
const cropUnlocked = id => CROP[id] && CROP[id].flower ? S.level >= CROP[id].lvl : LEVELS.findIndex(l => l.crop === id) <= S.level;
const bUnlocked = t => BUILDINGS[t].lvl <= S.level;
const recipeUnlocked = r => r.lvl <= S.level;
function bCount(type) { return S.buildings.filter(b => b.type === type).length; }
function bCost(type) {
  const d = BUILDINGS[type];
  if (type === 'plot') { let n = 0; for (const k in S.plots) if (!S.plots[k].gh) n++; return Math.round(d.cost * Math.pow(d.grow, Math.max(0, n - 9))); }
  if (d.found) return 0;
  return Math.round(d.cost * Math.pow(d.grow, S.built[type] || 0));
}
function upgCost(u) { return Math.round(u.base * Math.pow(u.mul, upg(u.id))); }
function meepleCost(crop) {
  const n = Math.max(0, S.meeples.length - 1);
  const base = crop === 'founder' ? 8 : CROP[crop].mc;
  return Math.ceil(base * Math.pow(1.24, n));
}
function clearCost(i) {
  const c = S.cover[i]; if (!c || c === COVER.WATER) return 0;
  const x = i % MW, y = (i / MW) | 0;
  const d = Math.max(0, Math.hypot((x - CX) / 1.25, y - CY) - 6);
  return Math.round(COVER_COST[c] * Math.pow(1 + d / 5, 1.75));
}
function canClear(i) {
  const c = S.cover[i]; if (!c || c === COVER.WATER) return false;
  const x = i % MW, y = (i / MW) | 0;
  return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => inMap(x + dx, y + dy) && S.cover[idx(x + dx, y + dy)] === COVER.NONE);
}

// ---------------------------------------------------------------- inventory
function invAdd(id, n, bank = true) {
  S.inv[id] = (S.inv[id] || 0) + n;
  if (bank) S.lifetime[id] = (S.lifetime[id] || 0) + n;
}
function invTake(id, n) {
  const have = S.inv[id] || 0, t = Math.min(have, n);
  S.inv[id] = have - t;
  return t;
}
function sell(id, n) {
  n = Math.min(n, S.inv[id] || 0); if (n <= 0) return 0;
  S.inv[id] -= n;
  const v = sellPrice(id) * n;
  S.coins += v; S.stats.sold += n; S.stats.earned += v;
  S.soldBy[id] = (S.soldBy[id] || 0) + v;
  return v;
}

// ---------------------------------------------------------------- actions (player)
function doClear(i) {
  if (!canClear(i)) return false;
  const c = clearCost(i); if (S.coins < c) return false;
  S.coins -= c;
  const kind = S.cover[i];
  S.cover[i] = COVER.NONE; S.stats.cleared++;
  emit({ t: 'clear', i, kind });
  if (window.R && R.ready) R.groundDirty(i);
  rollFind(i, kind, c);
  treeSeedDrop(i, kind);
  return true;
}
function tileFree(i, allowPath) {
  return S.cover[i] === COVER.NONE && !OCC[i] && (S.floor[i] === FLOOR.GRASS || (allowPath && S.floor[i] === FLOOR.PATH));
}
function canPlace(type, x, y, moving) {
  const d = BUILDINGS[type];
  for (let yy = 0; yy < d.h; yy++) for (let xx = 0; xx < d.w; xx++) {
    const tx = x + xx, ty = y + yy;
    if (!inMap(tx, ty)) return false;
    const i = idx(tx, ty);
    if (moving && OCC[i] === moving.id) { if (S.cover[i] === COVER.NONE) continue; }
    if (type === 'plot' || type === 'path') { if (!tileFree(i, false)) return false; }
    else if (!tileFree(i, true)) return false;
  }
  if (type === 'plot' || type === 'path') return true;
  if ((type === 'dock' || type === 'duckhouse') && dockWater({ x, y }) < 0) return false;
  if (BUILDINGS[type].walk) {
    for (let yy = 0; yy < d.h; yy++) for (let xx = 0; xx < d.w; xx++) if (GHMAP[idx(x + xx, y + yy)] || S.floor[idx(x + xx, y + yy)] === FLOOR.PLOT) return false;
    return true;
  }
  // must not cut off any building from the storehouse network
  return !wouldBlock(type, x, y, moving);
}
function wouldBlock(type, x, y, moving) {
  const d = BUILDINGS[type];
  const block = new Uint8Array(MW * MH);
  for (let yy = 0; yy < d.h; yy++) for (let xx = 0; xx < d.w; xx++) block[idx(x + xx, y + yy)] = 1;
  const walk = i => S.cover[i] === COVER.NONE && !block[i] && (!OCC[i] || (moving && OCC[i] === moving.id));
  // flood from the largest cleared region adjacent to buildings
  const seen = new Uint8Array(MW * MH);
  const fakeB = { id: -1, type, x, y };
  const needsAccess = t => t === 'storehouse' || t === 'well' || t === 'dock' || t === 'market' || t === 'creator' || BUILDINGS[t].proc;
  const all = S.buildings.filter(b => (!moving || b.id !== moving.id) && needsAccess(b.type));
  if (needsAccess(type)) all.push(fakeB);
  const accessOf = b => accessTiles(b).filter(walk);
  if (!all.length) return false;
  const starts = accessOf(all[0]);
  if (!starts.length) return true;
  const q = [starts[0]]; seen[starts[0]] = 1;
  while (q.length) {
    const c = q.pop(), cx = c % MW, cy = (c / MW) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cx + dx, ny = cy + dy; if (!inMap(nx, ny)) continue;
      const n = idx(nx, ny); if (seen[n] || !walk(n)) continue; seen[n] = 1; q.push(n);
    }
  }
  for (const b of all) { const a = accessOf(b); if (!a.length || !a.some(t => seen[t])) return true; }
  // nor wall any Meeple or garden plot off from the rest of the homestead
  const seen0 = new Uint8Array(MW * MH), walk0 = i => S.cover[i] === COVER.NONE && (!OCC[i] || (moving && OCC[i] === moving.id));
  const q0 = [starts[0]]; seen0[starts[0]] = 1;
  while (q0.length) {
    const c = q0.pop(), cx = c % MW, cy = (c / MW) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cx + dx, ny = cy + dy; if (!inMap(nx, ny)) continue;
      const n = idx(nx, ny); if (seen0[n] || !walk0(n)) continue; seen0[n] = 1; q0.push(n);
    }
  }
  for (const m of S.meeples) { const t = tileOf(m); if (seen0[t] && !seen[t] && !block[t]) return true; }
  for (const k in S.plots) if (!S.plots[k].gh && seen0[k] && !seen[k]) return true;
  return false;
}
function place(type, x, y) {
  if (!bUnlocked(type) || !canPlace(type, x, y)) return false;
  const d = BUILDINGS[type];
  if (d.max && bCount(type) >= d.max) return false;
  if (d.found && !(S.found[type] > 0)) return false;
  if (d.tree && !(S.inv[TREE_OF[type].seed] > 0)) return false;
  const cost = bCost(type);
  if (S.coins < cost) return false;
  S.coins -= cost;
  if (d.found) S.found[type]--;
  if (d.tree) invTake(TREE_OF[type].seed, 1);
  const i = idx(x, y);
  if (type === 'plot') { makePlot(i, lastPlotCrop(), false); S.built.plot = (S.built.plot || 0) + 1; computePlotBonus(); }
  else if (type === 'path') { S.floor[i] = FLOOR.PATH; }
  else {
    for (let yy = 0; yy < d.h; yy++) for (let xx = 0; xx < d.w; xx++) S.floor[idx(x + xx, y + yy)] = FLOOR.GRASS;
    const b = addBuilding(type, x, y);
    if (type === 'greenhouse') {
      for (let yy = 0; yy < d.h; yy++) for (let xx = 0; xx < d.w; xx++) {
        const t = idx(x + xx, y + yy);
        if (yy < d.h - 1) makePlot(t, lastPlotCrop(), false, b.id); else S.floor[t] = FLOOR.PATH;
      }
    }
    rebuildOcc();
    if (window.R && R.ready) for (let yy = 0; yy < d.h; yy++) for (let xx = 0; xx < d.w; xx++) R.groundDirty(idx(x + xx, y + yy));
  }
  emit({ t: 'build', x: x + d.w / 2, y: y + d.h / 2, type });
  if (window.R && R.ready) R.groundDirty(i);
  return true;
}
let _lastCrop = 'carrot';
function lastPlotCrop() { return cropUnlocked(_lastCrop) ? _lastCrop : 'carrot'; }
function ghOf(i) { return GHMAP && GHMAP[i] ? BMAP[GHMAP[i]] : null; }
function moveBuilding(b, x, y) {
  if (BUILDINGS[b.type].walk || !canPlace(b.type, x, y, b)) return false;
  const d = BUILDINGS[b.type];
  b.x = x; b.y = y;
  for (let yy = 0; yy < d.h; yy++) for (let xx = 0; xx < d.w; xx++) S.floor[idx(x + xx, y + yy)] = FLOOR.GRASS;
  rebuildOcc();
  for (const m of S.meeples) { m.path = []; }
  emit({ t: 'build', x: x + d.w / 2, y: y + d.h / 2, type: b.type });
  return true;
}
function demolish(b) {
  if (b.type === 'market' || b.type === 'creator') return false;
  if (b.type === 'storehouse' && bCount('storehouse') <= 1) return false;
  if (b.recipe) cancelRecipe(b);
  if (b.type === 'greenhouse') {
    const d = BUILDINGS[b.type];
    for (let yy = 0; yy < d.h; yy++) for (let xx = 0; xx < d.w; xx++) {
      const t = idx(b.x + xx, b.y + yy);
      if (S.plots[t]) { for (const m of S.meeples) if (m.task && m.task.plot === t) dropTask(m); delete S.plots[t]; }
      S.floor[t] = FLOOR.GRASS; if (window.R && R.ready) R.groundDirty(t);
    }
  }
  S.buildings = S.buildings.filter(o => o !== b);
  if (BUILDINGS[b.type].found) S.found[b.type] = (S.found[b.type] || 0) + 1;
  else S.coins += Math.round(bCost(b.type) / BUILDINGS[b.type].grow * 0.3);
  if (S.built[b.type]) S.built[b.type]--;
  rebuildOcc();
  for (const m of S.meeples) if (m.task && m.task.b === b.id) dropTask(m);
  return true;
}
function removeFloor(i) {
  if (S.plots[i] && S.plots[i].gh) return;
  if (S.floor[i] === FLOOR.PLOT) {
    const p = S.plots[i];
    for (const m of S.meeples) if (m.task && m.task.plot === i) dropTask(m);
    delete S.plots[i];
    S.built.plot = Math.max(0, (S.built.plot || 0) - 1);
  }
  S.floor[i] = FLOOR.GRASS;
  if (window.R && R.ready) R.groundDirty(i);
}
// planSeason: which season's plan to set (defaults to now). fromPlan: applied automatically at a season change.
function setPlotCrop(i, crop, fromPlan, planSeason) {
  const p = S.plots[i]; if (!p || !cropUnlocked(crop)) return;
  if (!fromPlan) {
    _lastCrop = crop;
    if (!p.gh) { p.plan = p.plan || {}; p.plan[planSeason != null ? planSeason : seasonIdx()] = crop; }
    if (planSeason != null && planSeason !== seasonIdx() && !p.gh) return;
  }
  if (p.crop === crop) return;
  p.crop = crop; p.t = 0; p.st = 0; p.gen = 0;
  for (const m of S.meeples) if (m.task && m.task.plot === i) dropTask(m);
  p.claim = 0;
}
function setRecipe(b, rid) {
  if (b.recipe === rid && b.phase !== 'idle') return;
  cancelRecipe(b);
  b.recipe = rid; b.phase = rid ? 'gather' : 'idle'; b.got = {}; b.transit = {}; b.t = 0;
}
function cancelRecipe(b) {
  // give back anything already delivered
  if (b.phase === 'gather' || b.phase === 'work') for (const k in b.got) invAdd(k, b.got[k], false);
  if (b.phase === 'done' && b.out > 0) invAdd(RECIPE[b.recipe].out[0], b.out);
  b.got = {}; b.out = 0; b.phase = 'idle'; b.t = 0; b.transit = {};
  for (const m of S.meeples) if (m.task && m.task.b === b.id) dropTask(m);
}
function buyUpgrade(u) {
  if (upg(u.id) >= u.max) return false;
  const c = upgCost(u); if (S.coins < c) return false;
  S.coins -= c; S.upg[u.id] = upg(u.id) + 1;
  return true;
}
function queueMeeple(crop) {
  const cr = S.buildings.find(b => b.type === 'creator'); if (!cr) return false;
  if (S.meeples.length + cr.queue.length >= MEEPLE_MAX) return false;
  if (cr.queue.length >= 5) return false;
  const c = meepleCost(crop);
  if ((S.inv[crop] || 0) < c) return false;
  invTake(crop, c);
  cr.queue.push(crop);
  return true;
}

// ---------------------------------------------------------------- pathfinding
function walkable(i) { return S.cover[i] === COVER.NONE && !OCC[i]; }
function accessTiles(b) {
  const d = BUILDINGS[b.type], out = [];
  for (let xx = 0; xx < d.w; xx++) { out.push([b.x + xx, b.y + d.h]); out.push([b.x + xx, b.y - 1]); }
  for (let yy = 0; yy < d.h; yy++) { out.push([b.x - 1, b.y + yy]); out.push([b.x + d.w, b.y + yy]); }
  return out.filter(([x, y]) => inMap(x, y)).map(([x, y]) => idx(x, y));
}
const _prev = new Int32Array(MW * MH), _mark = new Int32Array(MW * MH);
let _gen = 1;
// BFS from tile s until pred(tile) is true. Returns {path:[tiles excluding start], goal} or null.
function bfs(s, pred, maxDist = 9999) {
  _gen++;
  const q = [s]; _mark[s] = _gen; _prev[s] = -1;
  const dist = new Map([[s, 0]]);
  let head = 0;
  while (head < q.length) {
    const c = q[head++];
    if (pred(c)) {
      const path = []; let k = c;
      while (k !== s) { path.push(k); k = _prev[k]; }
      path.reverse();
      return { path, goal: c };
    }
    const dc = dist.get(c); if (dc >= maxDist) continue;
    const cx = c % MW, cy = (c / MW) | 0;
    for (let d = 0; d < 4; d++) {
      const nx = cx + (d === 0 ? 1 : d === 1 ? -1 : 0), ny = cy + (d === 2 ? 1 : d === 3 ? -1 : 0);
      if (nx < 0 || ny < 0 || nx >= MW || ny >= MH) continue;
      const n = ny * MW + nx;
      if (_mark[n] === _gen) continue;
      _mark[n] = _gen;
      if (!walkable(n) && !pred(n)) continue;
      _prev[n] = c; dist.set(n, dc + 1); q.push(n);
    }
  }
  return null;
}
function tileOf(m) { return idx(Math.max(0, Math.min(MW - 1, Math.floor(m.x / T))), Math.max(0, Math.min(MH - 1, Math.floor(m.y / T)))); }
function accessSet(types) {
  const set = new Set();
  for (const b of S.buildings) if (types.includes(b.type)) for (const t of accessTiles(b)) if (walkable(t)) set.add(t);
  return set;
}
function accessOfB(b) { return new Set(accessTiles(b).filter(walkable)); }

// ---------------------------------------------------------------- meeple AI
function dropTask(m) {
  const t = m.task; if (!t) return;
  if (t.plot != null && S.plots[t.plot] && S.plots[t.plot].claim === m.id) S.plots[t.plot].claim = 0;
  if (t.plot != null && S.plots[t.plot] && S.plots[t.plot].wclaim === m.id) S.plots[t.plot].wclaim = 0;
  if (t.b != null && BMAP[t.b]) {
    const b = BMAP[t.b];
    if (b.claim === m.id) b.claim = 0;
    if (t.type === 'supply' && t.item && t.step === 'tob') b.transit[t.item] = Math.max(0, (b.transit[t.item] || 0) - t.n);
    if (t.type === 'supply' && t.step === 'tostore') b.transit[t.item] = Math.max(0, (b.transit[t.item] || 0) - t.n);
  }
  m.task = null; m.path = []; m.act = 0;
}
function goTo(m, set) {
  const s = tileOf(m);
  if (set.has(s)) { m.path = []; return true; }
  const r = bfs(s, i => set.has(i));
  if (!r) return false;
  m.path = r.path; return true;
}
function needOf(b) {
  const r = RECIPE[b.recipe], need = {};
  for (const k in r.in) { const n = r.in[k] - (b.got[k] || 0) - (b.transit[k] || 0); if (n > 0) need[k] = n; }
  return need;
}
function pickTask(m) {
  const s = tileOf(m);
  if (m.fish) { fisherTask(m); return; }
  if (m.hand.length) { m.task = { type: 'deliver' }; if (!goTo(m, accessSet(['storehouse']))) { m.task = null; m.wait = 1; } return; }
  // 1. collect finished goods
  if (m.haul) {
    let best = null, bd = 1e9;
    for (const b of S.buildings) if (BUILDINGS[b.type].proc && b.phase === 'done' && !b.claim) {
      const d = Math.abs(b.x * T - m.x) + Math.abs(b.y * T - m.y); if (d < bd) { bd = d; best = b; }
    }
    if (best && goTo(m, accessOfB(best))) { best.claim = m.id; m.task = { type: 'collect', b: best.id }; return; }
  }
  // chewed plants, and mice sitting in the beds
  if (m.farm && MEND_ANY) {
    const r = bfs(s, i => needsMend(S.plots[i]));
    if (r) { S.plots[r.goal].claim = m.id; m.task = { type: 'mend', plot: r.goal }; m.path = r.path; return; }
  }
  // watering is mixed in with harvesting so busy farms still get watered
  if (m.water !== false && hasWell() && Math.random() < (m.farm ? 0.35 : 1) && waterTask(m, s)) return;
  // 2. harvest
  if (m.farm) {
    const r = bfs(s, i => { const p = S.plots[i]; return p && p.st === 2 && !p.claim; });
    if (r) { S.plots[r.goal].claim = m.id; m.task = { type: 'harvest', plot: r.goal }; m.path = r.path; return; }
  }
  // 3. supply processors
  if (m.haul) {
    const cap = mCarry(m);
    for (const b of S.buildings) {
      if (!BUILDINGS[b.type].proc || b.phase !== 'gather') continue;
      const need = needOf(b);
      for (const k in need) {
        const have = S.inv[k] || 0; if (have <= 0) continue;
        const n = Math.min(need[k], have, cap);
        if (goTo(m, accessSet(['storehouse']))) {
          b.transit[k] = (b.transit[k] || 0) + n;
          m.task = { type: 'supply', b: b.id, item: k, n, step: 'tostore' };
          return;
        }
      }
    }
  }
  // 4. plant
  if (m.farm) {
    const r = bfs(s, i => { const p = S.plots[i]; return p && p.st === 0 && !p.claim && plotInSeason(p); });
    if (r) { S.plots[r.goal].claim = m.id; m.task = { type: 'plant', plot: r.goal }; m.path = r.path; return; }
  }
  // 5. water
  if (m.water !== false && hasWell() && waterTask(m, s)) return;
  // idle wander
  m.wait = 1.2 + Math.random() * 1.5;
  if (Math.random() < 0.5) {
    const r = bfs(s, i => i !== s && hash2(i, (S.playTime * 10) | 0, 7) < 0.04, 4);
    if (r) { m.path = r.path.slice(0, 3); m.task = { type: 'wander' }; }
    if (S.buildings.some(b => (b.type === 'flowers' || b.type === 'fountain' || b.type === 'bench') && Math.abs(b.x * T - m.x) < T * 3 && Math.abs(b.y * T - m.y) < T * 3)) emote(m, 'heart', 0.25);
  }
}
// ---------------------------------------------------------------- fishing
// water tile next to a dock (the fishing spot), or -1
function dockWater(b) {
  for (const [dx, dy] of [[0, 1], [-1, 0], [1, 0], [0, -1]]) {
    const x = b.x + dx, y = b.y + dy;
    if (inMap(x, y) && S.cover[idx(x, y)] === COVER.WATER) return idx(x, y);
  }
  return -1;
}
function fishLevel() { let l = 0; while (l < FISH_LV_MAX && (S.fishXP || 0) >= fishXpFor(l + 1)) l++; return l; }
// catch weights at a fishing level: common fish fade a little, rarer fish grow much likelier
function fishWeights(lv = fishLevel()) {
  return FISH.map(f => lv < f.minLv ? 0 : Math.max(f.base * 0.3, f.base * (1 + lv * RARITY[f.rar].g)));
}
function fishChances(lv = fishLevel()) { const w = fishWeights(lv), tot = w.reduce((a, b) => a + b, 0); return w.map(x => x / tot); }
function rollFish(lv = fishLevel()) {
  const w = fishWeights(lv); let r = Math.random() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < FISH.length; i++) { r -= w[i]; if (r <= 0) return FISH[i].id; }
  return FISH[0].id;
}
// seconds until the next bite; experienced anglers get bites sooner
const biteTime = () => (16 + Math.random() * 22) / (1 + 0.04 * fishLevel() + JB.fish);
function addFishXP(n) {
  const before = fishLevel();
  S.fishXP = (S.fishXP || 0) + n;
  const after = fishLevel();
  if (after > before) emit({ t: 'fishlevel', lv: after });
}
function fisherTask(m) {
  if (m.hand.length >= mCarry(m)) { m.task = { type: 'deliver' }; if (!goTo(m, accessSet(['storehouse']))) { m.task = null; m.wait = 1; } return; }
  const docks = S.buildings.filter(b => b.type === 'dock');
  const dock = docks.find(b => b.claim === m.id) || docks.find(b => !b.claim);
  if (dock && goTo(m, accessOfB(dock))) { dock.claim = m.id; m.task = { type: 'fish', b: dock.id, t: 0, bite: 0 }; return; }
  if (m.hand.length) { m.task = { type: 'deliver' }; if (!goTo(m, accessSet(['storehouse']))) { m.task = null; m.wait = 1; } return; }
  m.wait = 2; // no free dock: wait for one
}
const needsWater = p => p && !p.gh && p.st === 1 && !p.wet && !p.wclaim && plotInSeason(p);
function waterTask(m, s) {
  if (m.can <= 0) {
    let any = false; for (const k in S.plots) if (needsWater(S.plots[k])) { any = true; break; }
    if (!any) return false;
    if (goTo(m, accessSet(['well']))) { m.task = { type: 'fill' }; return true; }
    return false;
  }
  const r = bfs(s, i => needsWater(S.plots[i]));
  if (!r) return false;
  S.plots[r.goal].wclaim = m.id; m.task = { type: 'water', plot: r.goal }; m.path = r.path;
  return true;
}
function arrive(m, dt) {
  const t = m.task;
  switch (t.type) {
    case 'wander': m.task = null; break;
    case 'deliver': {
      for (const it of m.hand) invAdd(it, 1);
      if (m.hand.length) emit({ t: 'deposit', x: m.x, y: m.y, items: m.hand.slice() });
      m.hand = []; m.task = null; break;
    }
    case 'harvest': case 'plant': {
      const p = S.plots[t.plot];
      if (!p || (t.type === 'harvest' && p.st !== 2) || (t.type === 'plant' && p.st !== 0)) { if (p && p.claim === m.id) p.claim = 0; m.task = null; break; }
      m.act += dt * mWork(m);
      if (m.act < (t.type === 'harvest' ? 0.9 : 0.6)) return;
      m.act = 0; p.claim = 0;
      if (t.type === 'harvest') {
        let n = 1; if (Math.random() < 0.08 * upg('yield')) n = 2;
        if (p.fert > 0) { if (Math.random() < FERT_DOUBLE) n++; p.fert--; }
        for (let k = 0; k < n; k++) m.hand.push(p.crop);
        emit({ t: 'harvest', i: t.plot, crop: p.crop, n });
        if (n > 1) emote(m, 'wow', 0.5);
        p.gen = (p.gen | 0) + 1; p.t = 0; p.wet = Math.max(0, (p.wet | 0) - 1);
        if (CROP[p.crop].harvests && p.gen >= CROP[p.crop].harvests) { p.st = 0; p.gen = 0; addCompost(1); emit({ t: 'spent', i: t.plot }); }
        else { p.st = 1; if (tryFertilize(p)) emit({ t: 'fert', i: t.plot }); }
        if (m.hand.length < mCarry(m)) {
          const r = bfs(tileOf(m), i => { const q = S.plots[i]; return q && q.st === 2 && !q.claim; }, 7);
          if (r) { S.plots[r.goal].claim = m.id; m.task = { type: 'harvest', plot: r.goal }; m.path = r.path; return; }
        }
        m.task = null;
      } else {
        p.st = 1; p.t = 0; p.gen = 0; emit({ t: 'plant', i: t.plot });
        if (tryFertilize(p)) emit({ t: 'fert', i: t.plot });
        m.task = null;
      }
      break;
    }
    case 'fish': {
      const b = BMAP[t.b];
      if (!b || !m.fish) { if (b && b.claim === m.id) b.claim = 0; m.task = null; break; }
      if (!t.bite) t.bite = biteTime();
      const fw = dockWater(b); if (fw >= 0) m.face = (fw % MW) * T + T / 2 >= m.x ? 1 : -1;
      t.t = (t.t || 0) + dt;
      if (t.t < t.bite) return;
      const f = rollFish(), sz = recordCatch(f);
      m.hand.push(f); emit({ t: 'catch', m, fish: f, b: b.id, cm: sz.cm, rec: sz.rec });
      if (FISHMAP[f].rar !== 'common') emote(m, 'wow', FISHMAP[f].rar === 'uncommon' ? 0.3 : 1);
      addFishXP(FISHMAP[f].xp);
      t.t = 0; t.bite = biteTime();
      if (m.hand.length >= mCarry(m)) { b.claim = 0; m.task = null; }
      return;
    }
    case 'mend': {
      const p = S.plots[t.plot];
      if (!p) { m.task = null; break; }
      m.act += dt * mWork(m); if (m.act < 1.4) return; m.act = 0;
      if (p.pest) shoo(pestById(p.pest), true);
      p.dmg = 0; p.claim = 0; emote(m, 'heart', 0.6); emit({ t: 'mend', i: t.plot });
      m.task = null; break;
    }
    case 'fill': {
      m.act += dt; if (m.act < 1.0) return; m.act = 0;
      m.can = canCap(m); emit({ t: 'fill', x: m.x, y: m.y });
      m.task = null; waterTask(m, tileOf(m)); break;
    }
    case 'water': {
      const p = S.plots[t.plot];
      if (!p || p.wet || p.st !== 1) { if (p && p.wclaim === m.id) p.wclaim = 0; m.task = null; break; }
      m.act += dt * mWork(m); if (m.act < 0.5) return; m.act = 0;
      p.wet = 3; p.wclaim = 0; m.can--; emit({ t: 'water', i: t.plot });
      m.task = null;
      if (m.can > 0) { const r = bfs(tileOf(m), i => needsWater(S.plots[i]), 6); if (r) { S.plots[r.goal].wclaim = m.id; m.task = { type: 'water', plot: r.goal }; m.path = r.path; } }
      break;
    }
    case 'collect': {
      const b = BMAP[t.b];
      if (!b || b.phase !== 'done') { if (b && b.claim === m.id) b.claim = 0; m.task = null; break; }
      m.act += dt; if (m.act < 0.5) return; m.act = 0;
      const out = RECIPE[b.recipe].out[0], n = Math.min(b.out, mCarry(m));
      for (let k = 0; k < n; k++) m.hand.push(out);
      b.out -= n; b.claim = 0;
      if (b.out <= 0) { b.out = 0; if (b.repeat) { b.phase = 'gather'; b.got = {}; b.transit = {}; } else b.phase = 'idle'; }
      m.task = null; break;
    }
    case 'supply': {
      const b = BMAP[t.b];
      if (t.step === 'tostore') {
        m.act += dt; if (m.act < 0.35) return; m.act = 0;
        const got = invTake(t.item, t.n);
        if (b) b.transit[t.item] = Math.max(0, (b.transit[t.item] || 0) - (t.n - got));
        t.n = got;
        if (!got || !b) { m.task = null; break; }
        for (let k = 0; k < got; k++) m.hand.push(t.item);
        t.step = 'tob';
        if (!goTo(m, accessOfB(b))) { b.transit[t.item] = Math.max(0, (b.transit[t.item] || 0) - got); m.task = null; }
        return;
      }
      // at building
      m.act += dt; if (m.act < 0.35) return; m.act = 0;
      if (b) b.transit[t.item] = Math.max(0, (b.transit[t.item] || 0) - t.n);
      if (b && b.phase === 'gather' && b.recipe) {
        const r = RECIPE[b.recipe], want = Math.max(0, (r.in[t.item] || 0) - (b.got[t.item] || 0));
        let give = Math.min(want, t.n);
        b.got[t.item] = (b.got[t.item] || 0) + give;
        for (let k = 0; k < give; k++) { const j = m.hand.indexOf(t.item); if (j >= 0) m.hand.splice(j, 1); }
        if (give) emit({ t: 'supply', b: b.id, item: t.item });
      }
      m.task = null; // leftovers in hand get delivered back
      break;
    }
  }
}
function updateMeeple(m, dt) {
  m.bob += dt;
  if (!m.task) {
    if (m.wait > 0) { m.wait -= dt; return; }
    pickTask(m);
    if (!m.task) return;
  }
  if (m.path.length) {
    const n = m.path[0], tx = (n % MW) * T + T / 2, ty = ((n / MW) | 0) * T + T / 2;
    if (!walkable(n) && !(m.task && (m.task.plot === n))) { m.path = []; dropTask(m); return; }
    const onPath = S.floor[tileOf(m)] === FLOOR.PATH;
    const sp = mSpeed(m) * T * (onPath ? 1.4 : 1) * dt;
    const dx = tx - m.x, dy = ty - m.y, d = Math.hypot(dx, dy);
    if (Math.abs(dx) > 0.5) m.face = dx > 0 ? 1 : -1;
    if (d <= sp) { m.x = tx; m.y = ty; m.path.shift(); }
    else { m.x += dx / d * sp; m.y += dy / d * sp; }
    m.moving = true;
    return;
  }
  m.moving = false;
  arrive(m, dt);
}

// ---------------------------------------------------------------- tick
let _autoT = 0, _lvlT = 0;
function update(dt) {
  S.playTime += dt;
  S.day = (S.day + dt / DAY_LEN) % 1;
  // seasons & weather
  const sea = seasonIdx();
  if (sea !== S.lastSeason) { S.lastSeason = sea; applySeasonPlans(); emit({ t: 'season', sea }); }
  const W = S.weather || (S.weather = { rain: 0, next: 300 });
  if (W.rain > 0) W.rain -= dt;
  else if ((W.next -= dt) <= 0) {
    W.next = 240 + Math.random() * 360;
    if (Math.random() < [0.35, 0.18, 0.3, 0][sea]) { W.rain = 120 + Math.random() * 180; emit({ t: 'rain' }); }
  }
  const raining = W.rain > 0;
  // plots
  for (const k in S.plots) {
    const p = S.plots[k];
    if (p.st === 1 && plotInSeason(p)) {
      if (raining && !p.gh && (p.wet | 0) < 3) p.wet = 3;
      if (p.dmg || p.pest) continue;
      p.t += dt * growMult(p);
      if (p.t >= growTarget(p)) { if (CROP[p.crop].flower) p.st = 3; else { p.st = 2; emit({ t: 'ripe', i: +k }); } }
    }
  }
  // processors
  for (const b of S.buildings) {
    if (BUILDINGS[b.type].proc && b.recipe && treeGrown(b)) {
      const r = RECIPE[b.recipe];
      if (b.phase === 'gather') {
        let ok = true; for (const k in r.in) if ((b.got[k] || 0) < r.in[k]) { ok = false; break; }
        if (ok) { b.phase = 'work'; b.t = 0; b.got = {}; }
      } else if (b.phase === 'work') {
        b.t += dt * craftMult() * workMult(b);
        if (b.t >= r.t) { b.phase = 'done'; b.out = r.out[1] + batchDone(b); S.stats.crafted += b.out; emit({ t: 'crafted', b: b.id }); }
      }
    }
    if (b.type === 'creator' && b.queue.length) {
      b.t += dt;
      if (b.t >= 20) {
        b.t = 0;
        const crop = b.queue.shift();
        const acc0 = accessTiles(b).filter(walkable)[0], acc = acc0 != null ? acc0 : idx(b.x, b.y + 2);
        const m = makeMeeple(crop, (acc % MW) * T + T / 2, ((acc / MW) | 0) * T + T / 2);
        S.meeples.push(m); S.stats.made++;
        emit({ t: 'meeple', m });
      }
    }
  }
  for (const m of S.meeples) updateMeeple(m, dt);
  updateExtras(dt);
  updateCritters(dt);
  // auto-sell
  _autoT += dt;
  if (_autoT > 2) {
    _autoT = 0;
    for (const id in S.auto) {
      const keep = S.auto[id]; if (keep == null) continue;
      const extra = (S.inv[id] || 0) - keep;
      if (extra > 0) { const v = sell(id, extra); if (v) emit({ t: 'sold', v }); }
    }
  }
  // levels
  _lvlT += dt;
  if (_lvlT > 1) { _lvlT = 0; checkLevel(); }
}
function levelProgress(L) {
  const lv = LEVELS[L]; if (!lv || !lv.req) return null;
  const parts = Object.keys(lv.req).map(k => ({ id: k, have: Math.min(lv.req[k], S.lifetime[k] || 0), need: lv.req[k] }));
  const frac = parts.reduce((a, p) => a + p.have / p.need, 0) / parts.length;
  return { parts, frac, done: parts.every(p => p.have >= p.need) };
}
function checkLevel() {
  const nx = S.level + 1;
  if (nx >= LEVELS.length) return;
  const pr = levelProgress(nx);
  if (pr && pr.done) {
    S.level = nx;
    const lv = LEVELS[nx];
    if (lv.fair) { S.won = true; emit({ t: 'fair' }); }
    else emit({ t: 'level', crop: lv.crop, level: nx });
    for (const m of S.meeples) emote(m, 'heart', 0.8);
  }
}

// ---------------------------------------------------------------- save / load
const SAVE_KEY = s => 'meeple_meadows_slot_' + s;
function serialize() {
  return JSON.stringify({
    ...S,
    cover: Array.from(S.cover).join(''),
    floor: Array.from(S.floor).join(''),
    meeples: S.meeples.map(m => ({ ...m, path: [], task: null, act: 0, emo: null })),
    buildings: S.buildings,
    savedAt: Date.now(),
  });
}
function saveGame() {
  if (!S) return false;
  let json;
  try {
    // items in transit go back to storage for the snapshot
    const snap = JSON.parse(serialize());
    for (const m of snap.meeples) { for (const it of m.hand) snap.inv[it] = (snap.inv[it] || 0) + 1; m.hand = []; }
    for (const b of snap.buildings) if (b.transit) b.transit = {}, b.claim = 0;
    for (const k in snap.plots) snap.plots[k].claim = 0, snap.plots[k].wclaim = 0, snap.plots[k].pest = 0;
    json = JSON.stringify(snap);
  } catch (e) { console.error(e); return false; }
  // two independent copies: the app's own file (Android) and browser storage; either one is enough
  let ok = false;
  try { if (window.AndroidBridge && AndroidBridge.backup) { AndroidBridge.backup(S.slot, json); ok = true; } } catch (e) { console.error(e); }
  try { localStorage.setItem(SAVE_KEY(S.slot), json); ok = true; } catch (e) { console.error(e); }
  return ok;
}
function readSlot(slot) {
  // read both copies and use whichever was saved most recently
  const parse = raw => { try { return raw ? JSON.parse(raw) : null; } catch (e) { return null; } };
  let a = null, b = null;
  try { a = parse(localStorage.getItem(SAVE_KEY(slot))); } catch (e) { }
  try { if (window.AndroidBridge && AndroidBridge.restore) b = parse(AndroidBridge.restore(slot)); } catch (e) { }
  if (a && b) return (b.savedAt || 0) > (a.savedAt || 0) ? b : a;
  return a || b;
}
function loadGame(slot) {
  const d = readSlot(slot); if (!d) return false;
  d.cover = Uint8Array.from(d.cover.split('').map(Number));
  d.floor = Uint8Array.from(d.floor.split('').map(Number));
  d.slot = slot;
  migrate(d);
  for (const m of d.meeples) { m.path = []; m.task = null; m.act = 0; m.wait = 0; m.hand = m.hand || []; m.can = m.can || 0; }
  for (const k in d.plots) { const p = d.plots[k]; p.claim = 0; p.wclaim = 0; p.plan = p.plan || {}; p.gen = p.gen | 0; }
  for (const b of d.buildings) if (BUILDINGS[b.type].proc) { b.transit = {}; b.claim = 0; } else b.claim = 0;
  S = d;
  recalcJB();
  rebuildOcc();
  return true;
}
function migrate(d) {
  if ((d.v || 1) < 2) {
    // v1 had 16 crops; keep the player's place by unlocking up to the same crop in the new list
    const crop = V1_LEVEL_CROPS[Math.min(d.level, V1_LEVEL_CROPS.length - 1)];
    d.level = Math.max(0, LEVELS.findIndex(l => l.crop === crop));
    d.won = false;
    for (const b of d.buildings) if (b.recipe && (!RECIPE[b.recipe] || RECIPE[b.recipe].at !== b.type)) {
      for (const k in b.got || {}) d.inv[k] = (d.inv[k] || 0) + b.got[k];
      b.recipe = null; b.phase = 'idle'; b.got = {}; b.out = 0;
    }
    for (const k in d.plots) { d.plots[k].wet = false; d.plots[k].bonus = d.plots[k].bonus || 1; }
    d.weather = { rain: 0, next: 300 };
    d.v = 2;
  }
  d.lastSeason = 1; // seasons are gone; never trigger a season change on load
  d.fishXP = d.fishXP || 0;
  initExtras(d);
}
function deleteSlot(slot) {
  try { localStorage.removeItem(SAVE_KEY(slot)); } catch (e) { }
  try { if (window.AndroidBridge && AndroidBridge.backup) AndroidBridge.backup(slot, ''); } catch (e) { }
}
;(window.__stage = window.__stage || []).push('world.js loaded');
