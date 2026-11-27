// Meeple Meadows — v1.7 game logic: building sites that Meeples raise piece by piece, Pip's requests,
// each Meeple's own record and badges, crop mastery, benches and lantern gatherings, and the daily visitor.
'use strict';

// ---------------------------------------------------------------- building sites
// A building under construction sits in S.buildings as a "site" of the same footprint (b.of = what it
// will become). None of the working-building code knows the site types, so a half-built mill grinds nothing.
const siteType = d => 'site' + d.w + 'x' + d.h + (d.walk ? 'w' : '');
Object.keys(BUILDINGS).forEach(t => {
  const d = BUILDINGS[t], k = siteType(d);
  if (!BUILDINGS[k]) BUILDINGS[k] = { name: 'Building site', w: d.w, h: d.h, cost: 0, grow: 1, lvl: 0, cat: 'site', walk: d.walk ? 1 : 0, site: 1, desc: '' };
});
let SITES_OPEN = 0;
const SITE_N = {};            // site id -> Meeples heading to it or working on it
const BUILD_FOUND = 0.07;     // the first slice of the work is digging the foundation
// work-seconds to finish: dearer and bigger buildings take longer (the first Creator is about a minute for Pip alone)
function buildNeed(type) {
  const d = BUILDINGS[type], a = d.w * d.h;
  return Math.round((22 + 16 * Math.log10(1 + d.cost)) * (a === 1 ? 0.45 : a <= 4 ? 1 : 2));
}
// a Wonder waits between stages until its next delivery arrives
const siteWaiting = b => !!(b.con && b.con.req) && b.con.p >= b.con.need * b.con.stage / 4 - 1e-6;
const siteCap = b => { const d = BUILDINGS[b.type]; return Math.min(16, 2 * (d.w + d.h)); };
function startSite(type, x, y, cost) {
  const d = BUILDINGS[type];
  if (d.tree) return addBuilding(type, x, y);   // seedlings are planted, not built
  const b = { id: S.nextId++, type: siteType(d), of: type, x, y, con: { p: 0, need: buildNeed(type), paid: cost || 0, idle: 0 } };
  S.buildings.push(b); BMAP[b.id] = b;
  S.built[type] = (S.built[type] || 0) + 1;
  SITES_OPEN++;
  return b;
}
function releaseBuilders(b, cheer) {
  const who = [];
  for (const m of S.meeples) if (m.task && m.task.type === 'construct' && m.task.b === b.id) {
    if (!m.path.length) who.push(m.id);
    m.task = null; m.path = []; m.act = 0; m.wait = cheer ? 1.1 + Math.random() * 0.5 : 0;
    if (cheer) emote(m, 'heart', 0.8);
  }
  return who;
}
function finishSite(b) {
  const type = b.of, d = BUILDINGS[type];
  const who = releaseBuilders(b, true);
  delete b.of; delete b.con; b.type = type;
  if (d.proc) Object.assign(b, { recipe: null, repeat: true, phase: 'idle', got: {}, transit: {}, t: 0, out: 0, claim: 0 });
  if (type === 'creator') Object.assign(b, { queue: [], t: 0 });
  if (type === 'coop' || type === 'barn' || type === 'hive' || type === 'duckhouse') { const r = RECIPES.find(x => x.at === type && recipeUnlocked(x)); if (r) setRecipe(b, r.id); }
  if (type === 'greenhouse') {
    for (let yy = 0; yy < d.h; yy++) for (let xx = 0; xx < d.w; xx++) {
      const t = idx(b.x + xx, b.y + yy);
      if (yy < d.h - 1) makePlot(t, lastPlotCrop(), false, b.id); else S.floor[t] = FLOOR.PATH;
    }
  }
  rebuildOcc();
  S.stats.built = (S.stats.built || 0) + 1;
  emit({ t: 'built', b: b.id, type, who });
}
function cancelSite(b) {
  const type = b.of;
  releaseBuilders(b, false);
  S.buildings = S.buildings.filter(o => o !== b);
  if (BUILDINGS[type].found) S.found[type] = (S.found[type] || 0) + 1; else S.coins += b.con.paid || 0;
  if (S.built[type]) S.built[type]--;
  rebuildOcc();
  return true;
}
function tickSites(dt) {
  for (const k in SITE_N) delete SITE_N[k];
  const at = {};
  for (const m of S.meeples) if (m.task && m.task.type === 'construct') { SITE_N[m.task.b] = (SITE_N[m.task.b] || 0) + 1; if (!m.path.length) at[m.task.b] = 1; }
  let n = 0;
  for (const b of S.buildings) if (b.of) {
    if (siteWaiting(b)) continue;
    n++;
    // nobody can get to it (walled in, or everyone is fishing): it slowly finishes itself
    if (at[b.id]) b.con.idle = 0;
    else if ((b.con.idle = (b.con.idle || 0) + dt) > 25) { b.con.p += dt * 0.6; if (b.con.p >= b.con.need) { finishSite(b); break; } }
  }
  SITES_OPEN = n;
}
function pickBuild(m) {
  let best = null, bd = 1e9;
  for (const b of S.buildings) if (b.of && !siteWaiting(b) && (SITE_N[b.id] || 0) < siteCap(b)) {
    const d = Math.abs(b.x * T - m.x) + Math.abs(b.y * T - m.y); if (d < bd) { bd = d; best = b; }
  }
  if (!best) return false;
  const acc = accessTiles(best).filter(walkable); if (!acc.length) return false;
  // spread out around the site: take the least crowded side
  const cnt = {};
  for (const o of S.meeples) if (o.task && o.task.type === 'construct' && o.task.b === best.id) cnt[o.task.spot] = (cnt[o.task.spot] || 0) + 1;
  const dist = i => Math.abs((i % MW) * T - m.x) + Math.abs(((i / MW) | 0) * T - m.y);
  acc.sort((a, c) => (cnt[a] || 0) - (cnt[c] || 0) || dist(a) - dist(c));
  for (const spot of acc.slice(0, 3)) {
    if (goTo(m, new Set([spot]))) {
      m.task = { type: 'construct', b: best.id, spot, sw: Math.random() * 0.4, ox: (Math.random() - 0.5) * 22, oy: (Math.random() - 0.5) * 14 };
      SITE_N[best.id] = (SITE_N[best.id] || 0) + 1;
      return true;
    }
  }
  return false;
}

// ---------------------------------------------------------------- quiet moments: benches, lanterns, fountains
let WORK_WAITING = false;
const isNight = () => Math.sin((S.day - 0.25) * Math.PI * 2) < -0.05;
function idleMoment(m, s) {
  if (Math.random() < 0.4) return false;
  const night = isNight();
  let best = null, bd = 7 * T, kind = '';
  for (const b of S.buildings) {
    const k = b.type === 'bench' ? 'sit' : b.type === 'lantern' && night ? 'lamp' : (b.type === 'fountain' || b.type === 'birdbath') && !night ? 'gaze' : '';
    if (!k) continue;
    const d = Math.abs((b.x + 0.5) * T - m.x) + Math.abs((b.y + 0.5) * T - m.y);
    if (d >= bd) continue;
    const there = S.meeples.filter(o => o.task && o.task.type === 'rest' && o.task.b === b.id).length;
    if (there >= (k === 'sit' ? 1 : 4)) continue;
    bd = d; best = b; kind = k;
  }
  if (!best || !goTo(m, accessOfB(best))) return false;
  const t = 5 + Math.random() * 6;
  m.task = { type: 'rest', b: best.id, kind, t, max: t };
  return true;
}
function arrive4(m, t, dt) {
  const b = BMAP[t.b];
  if (t.type === 'construct') {
    if (!b || !b.of || siteWaiting(b)) { m.task = null; m.act = 0; return; }
    const d = BUILDINGS[b.type], w = mWork(m);
    m.face = (b.x + d.w / 2) * T >= m.x ? 1 : -1;
    // shuffle to their own spot on the tile so a crowd of builders doesn't stand in one pile
    const tx = (t.spot % MW) * T + T / 2 + t.ox, ty = ((t.spot / MW) | 0) * T + T / 2 + t.oy;
    m.x += (tx - m.x) * Math.min(1, dt * 5); m.y += (ty - m.y) * Math.min(1, dt * 5);
    m.act += dt * w; b.con.p += dt * w; b.con.idle = 0;
    if (b.con.req) b.con.p = Math.min(b.con.p, b.con.need * b.con.stage / 4);
    mRec(m, 'b', dt);
    if ((t.sw -= dt * w) <= 0) { t.sw = 0.46 + Math.random() * 0.1; emit({ t: 'hammer', b: b.id, x: m.x, y: m.y, face: m.face, dig: b.con.p < b.con.need * BUILD_FOUND }); }
    if (b.con.p >= b.con.need) finishSite(b);
    return;
  }
  // resting
  t.t -= dt;
  if (!b || t.t <= 0 || (WORK_WAITING && t.max - t.t > 2.5)) { m.task = null; m.act = 0; m.wait = 0.3; return; }
  if (t.kind === 'sit') { const k = Math.min(1, dt * 4); m.x += ((b.x + 0.5) * T - m.x) * k; m.y += (b.y * T + 44 - m.y) * k; }
  else m.face = (b.x + 0.5) * T >= m.x ? 1 : -1;
  if (Math.random() < dt * 0.22) emote(m, t.kind === 'lamp' ? (Math.random() < 0.5 ? 'note' : 'zzz') : Math.random() < 0.5 ? 'heart' : 'note');
}

// ---------------------------------------------------------------- each Meeple's own record
const BADGES = [
  { id: 'h1', k: 'h', n: 100,   name: 'Green Thumb',     icon: '🌱', how: 'Harvest 100 crops' },
  { id: 'h2', k: 'h', n: 1000,  name: 'Master Gardener', icon: '🌿', how: 'Harvest 1,000 crops' },
  { id: 'h3', k: 'h', n: 10000, name: 'Harvest Legend',  icon: '🏆', how: 'Harvest 10,000 crops' },
  { id: 'w1', k: 'w', n: 5000,  name: 'Wanderer',        icon: '🥾', how: 'Walk 5,000 tiles' },
  { id: 'w2', k: 'w', n: 100000, name: 'Trailblazer',    icon: '🧭', how: 'Walk 100,000 tiles' },
  { id: 'b1', k: 'b', n: 60,    name: 'Handy',           icon: '🔨', how: 'Spend a minute building' },
  { id: 'b2', k: 'b', n: 900,   name: 'Master Builder',  icon: '🏗', how: 'Spend 15 minutes building' },
  { id: 'f1', k: 'f', n: 25,    name: 'Angler',          icon: '🎣', how: 'Catch 25 fish' },
  { id: 'f2', k: 'f', n: 300,   name: 'Old Salt',        icon: '⚓', how: 'Catch 300 fish' },
];
const recOf = (m, k) => k === 'w' ? Math.floor((m.walked || 0) / T) : (m.rec && m.rec[k]) || 0;
const badgesOf = m => BADGES.filter(b => recOf(m, b.k) >= b.n);
function mRec(m, k, n, crop) {
  const r = m.rec || (m.rec = { h: 0, f: 0, b: 0 });
  const before = r[k] || 0; r[k] = before + n;
  if (crop) { const by = m.by || (m.by = {}); by[crop] = (by[crop] || 0) + n; }
  for (const bd of BADGES) if (bd.k === k && before < bd.n && r[k] >= bd.n) emit({ t: 'badge', m: m.id, id: bd.id });
}
function favCrop(m) {
  let best = null, bn = 0;
  for (const k in m.by || {}) if (m.by[k] > bn) { bn = m.by[k]; best = k; }
  return best;
}
const _mk4 = makeMeeple;
makeMeeple = function (crop, x, y) { const m = _mk4(crop, x, y); m.born = S ? S.playTime : 0; m.rec = { h: 0, f: 0, b: 0 }; return m; };
Object.assign(HAT_RULES, { laurel: () => S.meeples.some(m => m.rec && m.rec.h >= 1000) });

// ---------------------------------------------------------------- crop mastery
// stars at 100 / 1,000 / 10,000 banked; each star makes that crop grow a little faster and sell for a little more
const MASTERY = [100, 1000, 10000], MASTERY_SELL = 0.05, MASTERY_GROW = 0.04, MASTERY_NAME = ['', 'Bronze', 'Silver', 'Gold'];
function masteryStars(id) {
  const c = CROP[id]; if (!c || c.flower || !S) return 0;
  const n = S.lifetime[id] || 0;
  return n >= MASTERY[2] ? 3 : n >= MASTERY[1] ? 2 : n >= MASTERY[0] ? 1 : 0;
}
function checkMastery() {
  for (const c of CROPS) {
    const st = masteryStars(c.id);
    if (st > (S.mast[c.id] || 0)) { S.mast[c.id] = st; emit({ t: 'mastery', id: c.id, stars: st }); }
  }
}

// ---------------------------------------------------------------- Pip's requests
// A scripted run of small jobs that walks a new player through the first hour, then endless little wishes.
const QUEST_LINE = [
  { k: 'bank', a: 'carrot', n: 3, r: 80, tx: `Hi, I'm <b>Pip</b>! Watch me pull up these carrots and carry them to the storehouse.` },
  { k: 'sell', n: 5, r: 170, tool: 'coins', tx: `Tap the <b>coins</b> up top and sell 5 carrots at the Market.` },
  { k: 'build', a: 'creator', n: 1, ri: ['carrot', 8], tool: 'build', tx: `Open <b>Build → Homestead</b> and place a <b>Meeple Creator</b>. I'll build it myself, piece by piece!` },
  { k: 'made', n: 1, r: 60, tx: `Tap the <b>Meeple Creator</b> and turn 8 carrots into a brand-new Meeple!` },
  { k: 'plots', n: 12, r: 60, tool: 'build', tx: `More hands, more carrots! <b>Build → Farm</b>: add 3 more Garden Plots.` },
  { k: 'clear', n: 3, r: 60, tool: 'clear', tx: `Tap <b>Clear</b> and cut back 3 brambles or trees to make room.` },
  { k: 'level', n: 1, r: 80, tx: `Bank 25 carrots and we'll unlock <b>Wheat</b>.` },
  { k: 'plant', a: 'wheat', n: 4, r: 60, tool: 'crops', tx: `Tap <b>Crops</b>, pick Wheat, then tap 4 plots to plant it.` },
  { k: 'build', a: 'mill', n: 1, r: 120, tool: 'build', tx: `Build a <b>Windmill</b> (Build → Crafting) to grind wheat into flour.` },
  { k: 'bank', a: 'flour', n: 5, r: 120, tx: `Tap the Windmill, choose <b>Flour</b>, and bank 5 bags.` },
  { k: 'meeples', n: 4, r: 150, tx: `Let's be a team of 4! Make more Meeples at the Creator.` },
  { k: 'build', a: 'well', n: 1, r: 100, tool: 'build', tx: `Build a <b>Stone Well</b> (Build → Farm). Watered crops grow 60% faster.` },
  { k: 'build', a: 'noticeboard', n: 1, r: 100, tool: 'build', tx: `Build an <b>Orders Board</b> (Build → Homestead) so the neighbours can ask for things.` },
  { k: 'orders', n: 1, r: 200, tx: `Deliver an order from the <b>Orders Board</b>. They pay far more than the market.` },
  { k: 'build', a: 'compost', n: 1, r: 120, tool: 'build', tx: `A <b>Compost Bin</b> (Build → Farm) turns spent plants into fertilizer.` },
  { k: 'level', n: 3, r: 250, tx: `Keep banking what the goal bar asks for until we reach <b>level 4</b>.` },
];
const fishTotal = () => FISH.reduce((a, f) => a + (S.lifetime[f.id] || 0), 0);
const farmPlots = () => { let n = 0; for (const k in S.plots) if (!S.plots[k].gh) n++; return n; };
function questRaw(q) {
  switch (q.k) {
    case 'bank': return S.lifetime[q.a] || 0;
    case 'sell': return S.stats.sold;
    case 'clear': return S.stats.cleared;
    case 'orders': return S.stats.orders;
    case 'craft': return S.stats.crafted;
    case 'fish': return fishTotal();
    case 'made': return S.stats.made;
    case 'plots': return farmPlots();
    case 'meeples': return S.meeples.length;
    case 'build': return bReady(q.a);
    case 'plant': { let n = 0; for (const k in S.plots) if (S.plots[k].crop === q.a) n++; return n; }
    case 'level': return S.level;
  }
  return 0;
}
const QUEST_REL = { bank: 1, sell: 1, clear: 1, orders: 1, craft: 1, fish: 1, made: 1 };
const questHave = q => Math.max(0, Math.min(q.n, questRaw(q) - (q.base || 0)));
const questFrac = q => q.k === 'level' && q.n === 1 ? (S.level >= 1 ? 1 : Math.min(0.99, (S.lifetime.carrot || 0) / 25)) : questHave(q) / q.n;
const questDone = q => q.k === 'level' ? S.level >= q.n : questRaw(q) - (q.base || 0) >= q.n;
function questText(Q) {
  if (Q.i < QUEST_LINE.length) return QUEST_LINE[Q.i].tx;
  const q = Q.q, nm = q.a && ITEM[q.a] ? ITEM[q.a].name.toLowerCase() : '';
  switch (q.k) {
    case 'bank': return `Could we bank <b>${q.n} ${nm}</b>? I've got plans for it.`;
    case 'sell': return `The market's busy today. Let's sell <b>${q.n} things</b>.`;
    case 'clear': return `I'd love more room. Clear <b>${q.n} more tiles</b> of woodland.`;
    case 'orders': return `Somebody's waiting on us. Deliver <b>${q.n > 1 ? q.n + ' orders' : 'an order'}</b> from the board.`;
    case 'craft': return `Keep the workshops humming: craft <b>${q.n} goods</b>.`;
    case 'fish': return `Fancy fish for supper? Catch <b>${q.n} fish</b>.`;
    case 'made': return `We could use another pair of hands. Make <b>a new Meeple</b>.`;
    case 'plots': return `Let's grow the garden to <b>${q.n} plots</b>.`;
  }
  return '';
}
function nextQuest() {
  const Q = S.quest; Q.i++; Q.ready = false;
  const def = Q.i < QUEST_LINE.length ? QUEST_LINE[Q.i] : newWish();
  const q = { k: def.k, n: def.n }; if (def.a) q.a = def.a; if (def.r) q.r = def.r; if (def.ri) q.ri = def.ri; if (def.tool) q.tool = def.tool;
  if (QUEST_REL[q.k] && Q.i >= QUEST_LINE.length) q.base = questRaw(q);   // the scripted line counts from the very start
  Q.q = q; Q.lastK = q.k;
}
function newWish() {
  const P = Math.max(9, farmPlots()), crops = LEVELS.slice(0, S.level + 1).map(l => l.crop).filter(Boolean).slice(-3);
  const W = Math.max(60, Math.round(sellPrice(crops[crops.length - 1]) * P * 1.5));
  const opts = [];
  for (const c of crops) opts.push([{ k: 'bank', a: c, n: clampN(P * 140 / CROP[c].grow, 5, 150), r: W }, 2]);
  let cheap = 0; for (let i = 0; i < MW * MH; i++) if (canClear(i)) { const c = clearCost(i); if (!cheap || c < cheap) cheap = c; }
  if (cheap) opts.push([{ k: 'clear', n: 3 + ((Math.random() * 3) | 0), r: Math.max(W, Math.round(cheap * 3)) }, 2]);
  if (hasBoard()) opts.push([{ k: 'orders', n: 1, r: W * 2 }, 2]);
  if (S.buildings.some(b => BUILDINGS[b.type].proc && b.recipe)) opts.push([{ k: 'craft', n: 4 + ((Math.random() * 6) | 0), r: Math.round(W * 1.5) }, 3]);
  if (S.meeples.some(m => m.fish) && bReady('dock')) opts.push([{ k: 'fish', n: 3 + ((Math.random() * 4) | 0), r: W }, 1.5]);
  if (S.meeples.length < MEEPLE_MAX && bReady('creator')) opts.push([{ k: 'made', n: 1, r: Math.round(W * 1.5) }, 1.5]);
  opts.push([{ k: 'plots', n: farmPlots() + 2, r: Math.max(W, bCost('plot') * 3) }, 1.5]);
  opts.push([{ k: 'sell', n: clampN(P * 2, 10, 200), r: W }, 1]);
  const fresh = opts.filter(o => o[0].k !== S.quest.lastK);
  const q = pickW(fresh.length ? fresh : opts);
  if (Math.random() < 0.2) q.ri = bUnlocked('compost') && Math.random() < 0.6 ? ['fertilizer', 4 + ((Math.random() * 5) | 0)] : ['_decor', FOUND_DECOR[(Math.random() * FOUND_DECOR.length) | 0]];
  return q;
}
function giveReward(r, ri) {
  if (r) { S.coins += r; S.stats.earned += r; }
  if (ri) { if (ri[0] === '_decor') S.found[ri[1]] = (S.found[ri[1]] || 0) + 1; else invAdd(ri[0], ri[1], false); }
}
function rewardLabel(r, ri) {
  const parts = [];
  if (r) parts.push(fmt(r) + ' coins');
  if (ri) parts.push(ri[0] === '_decor' ? 'a ' + BUILDINGS[ri[1]].name : ri[1] + ' ' + ITEM[ri[0]].name.toLowerCase() + (ri[1] > 1 && !/s$/.test(ITEM[ri[0]].name) ? 's' : ''));
  return parts.join(' + ');
}
function claimQuest() {
  const Q = S.quest; if (!Q || !Q.q || !questDone(Q.q)) return false;
  const q = Q.q;
  giveReward(q.r, q.ri);
  S.stats.quests = (S.stats.quests || 0) + 1;
  emit({ t: 'quest', r: q.r || 0, ri: q.ri || null });
  nextQuest();
  return true;
}

// ---------------------------------------------------------------- the daily visitor
// Once per real day a traveller stops by with a gift and one special request. Missing a day costs nothing.
const VISITORS = ['Marigold the peddler', 'Old Tobias and his cart', 'Wren the tinker', 'Hazel the seed-seller', 'Barnaby the wanderer', 'Juniper the trader'];
function dayKey() { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
function newVisitor() {
  const crops = LEVELS.slice(0, S.level + 1).map(l => l.crop).filter(Boolean);
  // worth a few minutes of the farm's income (capped, so early request rewards don't inflate it)
  const base = sellPrice(crops[crops.length - 1]) * Math.max(9, farmPlots());
  const W = Math.max(80, base * 2, Math.min(base * 8, Math.round(earnRate(1800) / 8)));
  const hats = FIND_HATS.filter(h => !S.hats.includes(h));
  const gift = pickW([[{ k: 'coins', n: W }, 4], [{ k: 'fert', n: 8 }, bUnlocked('compost') ? 2 : 0], [{ k: 'decor', id: FOUND_DECOR[(Math.random() * FOUND_DECOR.length) | 0] }, 2],
    [{ k: 'seed', id: TREES[(Math.random() * TREES.length) | 0].seed }, bUnlocked('oaktree') ? 2 : 0], [{ k: 'hat', id: hats[(Math.random() * hats.length) | 0] }, hats.length ? 1 : 0]]);
  const pool = orderPool(), pick = pool.length ? pickW(pool.map(p => [p, p.w])) : { id: 'carrot', q: 10 };
  const n = Math.max(2, Math.round(pick.q * 1.6));
  return { day: dayKey(), who: (Math.random() * VISITORS.length) | 0, gift, got: false, req: { [pick.id]: n }, reward: Math.max(W, Math.round(sellPrice(pick.id) * n * 4)), done: false };
}
const visitorHere = () => !!S.visitor && S.visitor.day === dayKey();
const visitorBusy = () => visitorHere() && (!S.visitor.got || !S.visitor.done);
function giftText(g) {
  if (g.k === 'coins') return fmt(g.n) + ' coins';
  if (g.k === 'fert') return g.n + ' fertilizer';
  if (g.k === 'decor') return 'a ' + BUILDINGS[g.id].name;
  if (g.k === 'seed') return 'a ' + ITEM[g.id].name.toLowerCase();
  if (g.k === 'hat') return 'a ' + HATS.find(h => h.id === g.id).name;
  return '';
}
function takeGift() {
  const V = S.visitor; if (!visitorHere() || V.got) return false;
  const g = V.gift; V.got = true;
  if (g.k === 'coins') { S.coins += g.n; S.stats.earned += g.n; }
  else if (g.k === 'fert') invAdd('fertilizer', g.n, false);
  else if (g.k === 'decor') S.found[g.id] = (S.found[g.id] || 0) + 1;
  else if (g.k === 'seed') invAdd(g.id, 1, false);
  else if (g.k === 'hat') unlockHat(g.id);
  S.stats.visits = (S.stats.visits || 0) + 1;
  emit({ t: 'gift', g });
  return true;
}
const visitorCanFill = () => visitorHere() && !S.visitor.done && Object.keys(S.visitor.req).every(k => (S.inv[k] || 0) >= S.visitor.req[k]);
function fillVisitor() {
  if (!visitorCanFill()) return false;
  const V = S.visitor;
  for (const k in V.req) invTake(k, V.req[k]);
  S.coins += V.reward; S.stats.earned += V.reward; V.done = true;
  S.soldBy._orders = (S.soldBy._orders || 0) + V.reward;
  emit({ t: 'visitdone', reward: V.reward });
  return true;
}
// where the visitor stands: on open ground beside the market
function visitorSpot() {
  const mk = S.buildings.find(b => b.type === 'market'); if (!mk) return null;
  const d = BUILDINGS.market, opts = accessTiles(mk).filter(i => walkable(i) && !S.plots[i]);
  if (!opts.length) return null;
  const below = opts.filter(i => ((i / MW) | 0) === mk.y + d.h);
  const i = (below.length ? below : opts)[0];
  return { x: (i % MW) * T + T / 2, y: ((i / MW) | 0) * T + T / 2 };
}

// ---------------------------------------------------------------- setup & tick
function ensure4() {
  if (!S.quest) {
    S.quest = { i: -1, q: null };
    nextQuest();
    // an older homestead skips the lessons it has already learned
    if (S.playTime > 300) {
      if (S.level >= 2) { S.quest.i = QUEST_LINE.length - 1; nextQuest(); }   // a veteran goes straight to Pip's everyday wishes
      else { let guard = 0; while (S.quest.i < QUEST_LINE.length && questDone(S.quest.q) && guard++ < 40) nextQuest(); }
    }
  }
  if (!S.mast) { S.mast = {}; for (const c of CROPS) S.mast[c.id] = masteryStars(c.id); }
  if (S.fresh4 == null) S.fresh4 = S.playTime < 5 ? 1 : 0;
}
const _ng4 = newGame;
newGame = function (slot) {
  const s = _ng4(slot);
  // the first carrots are nearly ready, so there's a harvest within seconds of starting
  let k = 0; for (const key in S.plots) { S.plots[key].t = Math.max(0, 27 - k * 2.6); k++; }
  return s;
};
let _t4 = 0;
function tick4(dt) {
  ensure4();
  tickSites(dt);
  if ((_t4 += dt) < 1) return;
  _t4 = 0;
  checkMastery();
  for (const m of S.meeples) {
    const w = Math.floor((m.walked || 0) / T), had = m.wb | 0;
    let n = 0; for (const b of BADGES) if (b.k === 'w' && w >= b.n) n++;
    if (n > had) { m.wb = n; emit({ t: 'badge', m: m.id, id: 'w' + n }); }
  }
  WORK_WAITING = SITES_OPEN > 0;
  if (!WORK_WAITING) for (const k in S.plots) { const p = S.plots[k]; if (p.st === 2 && !p.claim) { WORK_WAITING = true; break; } }
  if (!WORK_WAITING) WORK_WAITING = S.buildings.some(b => b.phase === 'done' && !b.claim);
  const Q = S.quest;
  if (Q.q && !Q.ready && questDone(Q.q)) { Q.ready = true; emit({ t: 'questready' }); }
  // the day's visitor turns up once a new homestead has found its feet
  if ((!S.visitor || S.visitor.day !== dayKey()) && (!S.fresh4 || S.playTime > 480)) { S.visitor = newVisitor(); emit({ t: 'visitor' }); }
}
const _ux4 = updateExtras;
updateExtras = function (dt) { _ux4(dt); tick4(dt); };
;(window.__stage = window.__stage || []).push('world4.js loaded');
