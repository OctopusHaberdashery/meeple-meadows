// Meeple Meadows — critters and growing things: field mice and squirrels raiding the beds, the owls,
// dogs and cats that stop them, bees and their flowers, orchard trees, ducks, walking styles, more hats.
'use strict';

let PESTS = [], PEST_ID = 1, MEND_ANY = false;
const GUARD = {};                                   // building id -> live state of its owl, dog or cat
const PEST_EVERY = { mouse: [150, 300], squirrel: [200, 380] };   // seconds between arrivals
const _pestT = { mouse: 90, squirrel: 160 };
const PEST_SPEED = { mouse: 2.6, squirrel: 3.4 };   // tiles per second
// a mouse bites a plant after a few seconds, then hops on to the next plant (up to MOUSE_PLANTS) unless it's
// shooed, caught or scared off
const MOUSE_BITE = 5, MOUSE_STAY = 12, MOUSE_PLANTS = 4, SQUIRREL_GRAB = 5;
const HUNTERS = {
  owlbox:   { kind: 'owl', r: 9, prey: ['mouse'], speed: 8 },
  doghouse: { kind: 'dog', r: 8, prey: ['squirrel'], speed: 6 },
  cattree:  { kind: 'cat', r: 6, prey: ['mouse', 'squirrel'], speed: 4.5 },
};

function initCritters(d) {
  d.pestSeen = d.pestSeen || {};
  d.stats.caught = d.stats.caught || 0;
  for (const m of d.meeples) if (!m.gait) m.gait = randGait();
  for (const k in d.plots) { d.plots[k].pest = 0; d.plots[k].dmg = d.plots[k].dmg | 0; }
  for (const b of d.buildings) if (BUILDINGS[b.type].tree && b.age == null) b.age = TREE_GROW;
  PESTS = []; for (const k in GUARD) delete GUARD[k];
}
const randGait = () => GAITS[(Math.random() * GAITS.length) | 0].id;
const gaitName = m => (GAITS.find(g => g.id === m.gait) || GAITS[0]).name;
const pestById = id => PESTS.find(p => p.id === id);

// ---------------------------------------------------------------- moving things
function moveTo(o, tx, ty, step) {
  const dx = tx - o.x, dy = ty - o.y, d = Math.hypot(dx, dy);
  if (Math.abs(dx) > 0.5) o.face = dx > 0 ? 1 : -1;
  if (d <= step) { o.x = tx; o.y = ty; return true; }
  o.x += dx / d * step; o.y += dy / d * step; return false;
}

// ---------------------------------------------------------------- mice and squirrels
const plotCount = () => { let n = 0; for (const k in S.plots) if (!S.plots[k].gh) n++; return n; };
const pestOn = (kind, n) => kind === 'mouse' ? S.level >= 2 && n >= 10 : S.level >= 4 && n >= 14;
function spawnPest(kind) {
  const cand = [];
  for (const k in S.plots) { const p = S.plots[k]; if (!p.gh && !CROP[p.crop].flower && (p.st === 1 || p.st === 2) && !p.pest && !p.dmg) cand.push(+k); }
  if (!cand.length) return;
  // squirrels go for whatever is ripe
  const ripe = cand.filter(i => S.plots[i].st === 2);
  const pool = kind === 'squirrel' && ripe.length && Math.random() < 0.75 ? ripe : cand;
  const tgt = pool[(Math.random() * pool.length) | 0], tx = tgt % MW, ty = (tgt / MW) | 0;
  // they come out of the nearest bit of woodland
  let edge = [];
  for (let r = 2; r <= 16 && !edge.length; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    if (Math.max(Math.abs(dx), Math.abs(dy)) !== r || !inMap(tx + dx, ty + dy)) continue;
    const i = idx(tx + dx, ty + dy); if (canClear(i)) edge.push(i);
  }
  if (!edge.length) return;
  const home = edge[(Math.random() * edge.length) | 0], c = tileC(home);
  PESTS.push({ id: PEST_ID++, kind, x: c.x, y: c.y, home, plot: tgt, st: 'in', t: 0, face: 1 });
  if (!S.pestSeen[kind]) { S.pestSeen[kind] = 1; emit({ t: 'pestfirst', kind }); }
}
// the nearest unchewed growing plant within 2 tiles, for a mouse that's still hungry
function nextPlant(from) {
  const fx = from % MW, fy = (from / MW) | 0; let best = null, bd = 99;
  for (let y = fy - 2; y <= fy + 2; y++) for (let x = fx - 2; x <= fx + 2; x++) {
    if (!inMap(x, y)) continue; const i = idx(x, y), pl = S.plots[i];
    if (i === from || !pl || pl.gh || CROP[pl.crop].flower || pl.dmg || pl.pest || (pl.st !== 1 && pl.st !== 2)) continue;
    const d = Math.abs(x - fx) + Math.abs(y - fy); if (d < bd) { bd = d; best = i; }
  }
  return best;
}
function leavePlot(p) {
  const pl = S.plots[p.plot];
  if (pl && pl.pest === p.id) pl.pest = 0;
  if (p.st !== 'carried') p.st = 'flee';
}
function tickPests(dt) {
  const n = plotCount();
  for (const kind of ['mouse', 'squirrel']) {
    if (!pestOn(kind, n)) continue;
    if ((_pestT[kind] -= dt) > 0) continue;
    const [a, b] = PEST_EVERY[kind]; _pestT[kind] = a + Math.random() * (b - a);
    if (PESTS.filter(p => p.kind === kind).length < Math.min(4, 1 + Math.floor(n / 40))) spawnPest(kind);
  }
  for (const p of PESTS) {
    p.t += dt;
    const pl = S.plots[p.plot], sp = PEST_SPEED[p.kind] * T * dt;
    if (p.st === 'in') {
      if (!pl || (pl.pest && pl.pest !== p.id)) { p.st = 'flee'; continue; }
      const c = tileC(p.plot);
      if (moveTo(p, c.x + (p.kind === 'mouse' ? -6 : 6), c.y + 6, sp)) { p.st = 'eat'; p.t = 0; pl.pest = p.id; }
    } else if (p.st === 'eat') {
      if (!pl) { p.st = 'flee'; continue; }
      if (p.kind === 'mouse') {
        if (p.t > MOUSE_BITE && !p.bit) {
          // the nibbled plant stops growing until a Meeple tends it, and loses some of its progress
          p.bit = 1; pl.dmg = 1;
          if (pl.st === 2) { pl.st = 1; pl.t = growTarget(pl) * 0.3; } else pl.t *= 0.5;
          emit({ t: 'nibble', i: p.plot });
        }
        if (p.t > MOUSE_STAY) {
          leavePlot(p);
          const next = (p.ate = (p.ate || 1) + 1) <= MOUSE_PLANTS && nextPlant(p.plot);
          if (next != null && next !== false) { p.plot = next; p.st = 'in'; p.t = 0; p.bit = 0; }
        }
      } else if (p.t > SQUIRREL_GRAB) {
        if (pl.st === 2) { p.carry = pl.crop; pl.st = 1; pl.t = 0; emit({ t: 'stolen', i: p.plot, crop: pl.crop }); }
        else pl.t *= 0.6;
        leavePlot(p);
      }
    } else if (p.st === 'flee') {
      const c = tileC(p.home);
      if (moveTo(p, c.x, c.y, sp * (p.scared ? 1.8 : 1.3))) p.gone = 1;
    }
  }
  PESTS = PESTS.filter(p => !p.gone);
  MEND_ANY = false;
  for (const k in S.plots) { const pl = S.plots[k]; if (pl.dmg || (pl.pest && (pestById(pl.pest) || {}).kind === 'mouse')) { MEND_ANY = true; break; } }
}
// a plot needing a Meeple: chewed, or a mouse sitting in it
const needsMend = pl => pl && !pl.claim && (pl.dmg || (pl.pest && (pestById(pl.pest) || {}).kind === 'mouse'));
function shoo(p, scared) {
  if (!p || p.st === 'carried') return;
  leavePlot(p); p.scared = scared ? 1 : 0;
  if (p.carry) { invAdd(p.carry, 1); emit({ t: 'dropped', x: p.x, y: p.y, crop: p.carry }); p.carry = null; }
}

// ---------------------------------------------------------------- owls, dogs and cats
function guardHome(b) {
  const x = (b.x + 0.5) * T, by = (b.y + 1) * T, k = HUNTERS[b.type].kind;
  return k === 'owl' ? { x, y: by - 110 } : k === 'cat' ? { x: x - 2, y: by - 64 } : { x: x + 2, y: by - 3 };
}
function tickGuards(dt) {
  for (const b of S.buildings) {
    const H = HUNTERS[b.type]; if (!H) continue;
    const home = guardHome(b);
    const g = GUARD[b.id] || (GUARD[b.id] = { x: home.x, y: home.y, st: 'home', tgt: 0, face: 1, t: 0 });
    g.t += dt; if (g.bark > 0) g.bark -= dt;
    const step = H.speed * T * dt;
    if (g.st === 'home') {
      g.x = home.x; g.y = home.y;
      let best = null, bd = H.r * T;
      for (const p of PESTS) {
        if (!H.prey.includes(p.kind) || p.hunted || p.st === 'carried' || (p.st === 'flee' && !p.carry)) continue;
        const d = Math.hypot(p.x - (b.x + 0.5) * T, p.y - (b.y + 0.5) * T); if (d < bd) { bd = d; best = p; }
      }
      if (best) { g.st = 'chase'; g.tgt = best.id; best.hunted = b.id; g.bark = 1.2; emit({ t: 'hunt', kind: H.kind, b: b.id }); }
    } else if (g.st === 'chase') {
      const p = pestById(g.tgt);
      if (!p || p.gone || p.st === 'carried') { g.st = 'return'; continue; }
      // give up on anything that's fled well outside the patch
      if (Math.hypot(p.x - (b.x + 0.5) * T, p.y - (b.y + 0.5) * T) > H.r * T * 1.7) { p.hunted = 0; g.st = 'return'; continue; }
      if (moveTo(g, p.x, p.y - (H.kind === 'owl' ? 2 : 0), step)) {
        if (H.kind === 'dog' || (H.kind === 'cat' && p.kind === 'squirrel')) { shoo(p, true); g.st = 'return'; g.bark = 1.4; emit({ t: 'scare', b: b.id, x: p.x, y: p.y }); }
        else { leavePlot(p); p.st = 'carried'; g.st = 'carry'; g.prey = p.id; emit({ t: 'pounce', b: b.id, x: p.x, y: p.y }); }
      }
    } else if (g.st === 'carry') {
      const p = pestById(g.prey);
      if (p) { p.x = g.x; p.y = g.y + (H.kind === 'owl' ? 7 : 0); p.face = g.face; }
      if (moveTo(g, home.x, home.y, step * 0.75)) { if (p) p.gone = 1; g.st = 'home'; S.stats.caught++; emit({ t: 'caught', b: b.id }); }
    } else if (g.st === 'return') {
      if (moveTo(g, home.x, home.y, step * 0.6)) g.st = 'home';
    }
  }
  for (const k in GUARD) if (!BMAP[k]) delete GUARD[k];
}

// ---------------------------------------------------------------- bees, flowers and hives
// blooming flowers within 4 tiles of a hive (Flower Beds count as clover)
function hiveFlowers(b) {
  if (b._flT > S.playTime) return b._fl;
  let n = 0, speed = 0;
  for (let y = b.y - 4; y <= b.y + 4; y++) for (let x = b.x - 4; x <= b.x + 4; x++) {
    if (!inMap(x, y)) continue;
    const p = S.plots[idx(x, y)];
    if (p && CROP[p.crop].flower && p.st === 3) { n++; speed += CROP[p.crop].bee; }
    const o = OCC[idx(x, y)]; if (o && BMAP[o] && BMAP[o].type === 'flowers') { n++; speed += 0.12; }
  }
  Object.defineProperty(b, '_fl', { value: { n, speed: Math.min(1.5, speed), extra: Math.min(3, Math.floor(n / 3)) }, writable: true, configurable: true, enumerable: false });
  Object.defineProperty(b, '_flT', { value: S.playTime + 3, writable: true, configurable: true, enumerable: false });
  return b._fl;
}
// speed multiplier for a building's current batch
const workMult = b => b.type === 'hive' ? 1 + hiveFlowers(b).speed : 1;
// extra output and by-products when a batch finishes; returns extra units of the main output
function batchDone(b) {
  if (b.type === 'hive') { if (Math.random() < 0.5) invAdd('beeswax', 1); return hiveFlowers(b).extra; }
  if (b.type === 'duckhouse' && Math.random() < 0.6) invAdd('feathers', Math.random() < 0.3 ? 2 : 1);
  return 0;
}

// ---------------------------------------------------------------- trees
const TREE_OF = Object.fromEntries(TREES.map(t => [t.id, t]));
const treeGrown = b => !BUILDINGS[b.type].tree || (b.age || 0) >= TREE_GROW;
function tickTrees(dt) {
  for (const b of S.buildings) if (BUILDINGS[b.type].tree && (b.age || 0) < TREE_GROW) {
    b.age = (b.age || 0) + dt;
    if (b.age >= TREE_GROW) emit({ t: 'treegrown', b: b.id });
  }
}
// clearing a woodland tree sometimes leaves a seedling you can replant
function treeSeedDrop(i, kind) {
  if (S.level < BUILDINGS.oaktree.lvl || (kind !== COVER.TREE && kind !== COVER.BIG) || Math.random() > 0.2) return;
  const x = i % MW, y = (i / MW) | 0;
  const wet = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => inMap(x + dx, y + dy) && S.cover[idx(x + dx, y + dy)] === COVER.WATER);
  const tk = window.treeKind ? treeKind(i)[0] : 'oak';
  const seed = wet ? 'seed_willow' : tk === 'bigoak' ? 'seed_maple' : tk === 'birch' ? 'seed_birch' : tk === 'pine' ? 'seed_pine' : 'seed_oak';
  invAdd(seed, 1, false);
  emit({ t: 'find', i, what: 'seed', id: seed, n: 1 });
}

// ---------------------------------------------------------------- hats
Object.assign(HAT_RULES, {
  beret: () => S.level >= 10, halo: () => S.level >= 20, cowboy: () => S.meeples.length >= 10, party: () => S.stats.orders >= 10,
  propeller: () => S.stats.cleared >= 400, pirate: () => FISH.reduce((a, f) => a + (S.lifetime[f.id] || 0), 0) >= 50,
  frog: () => (S.lifetime.koi || 0) > 0, viking: () => (S.lifetime.beer || 0) >= 50, wizard: () => Object.keys(S.relics).length >= 5,
  bow: () => S.stats.finds >= 25, bunny: () => S.stats.earned >= 1e5, fez: () => S.stats.earned >= 1e6, hardhat: () => S.buildings.length >= 30,
  grad: () => S.journal.length >= 6, bonnet: () => (S.lifetime.eggs || 0) >= 100, antenna: () => (S.lifetime.honey || 0) >= 50,
  duckling: () => S.buildings.some(b => b.type === 'duckhouse'), visor: () => CROPS.reduce((a, c) => a + (S.lifetime[c.id] || 0), 0) >= 5000,
  wreath: () => S.ribbons >= 1, nightcap: () => S.playTime >= 86400,
});

function updateCritters(dt) {
  tickPests(dt);
  tickGuards(dt);
  tickTrees(dt);
}
;(window.__stage = window.__stage || []).push('world3.js loaded');
