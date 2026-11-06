// Meeple Meadows — homestead extras: forest discoveries, compost & fertilizer, the orders board,
// the collection journal, hats, Meeple emotes, farm stats, Blue Ribbon goals and legacy bonuses.
'use strict';

// fill in anything a new game or an older save is missing
function initExtras(d) {
  d.found = d.found || {};            // decoration tokens waiting to be placed
  d.relics = d.relics || {};          // relic id -> true
  d.hats = d.hats || ['straw'];
  d.orders = d.orders || [];
  d.orderNext = d.orderNext != null ? d.orderNext : 15;
  d.compost = d.compost || { mat: 0, t: 0 };
  d.useFert = d.useFert !== false;
  d.fishRec = d.fishRec || {};        // fish id -> biggest catch in cm
  d.hist = d.hist || [];              // [playTime, coins earned, level, meeples] every 5 minutes
  d.soldBy = d.soldBy || {};          // item id -> coins earned selling it
  d.journal = d.journal || [];        // claimed JOURNAL milestone indices
  d.ribbons = d.ribbons || 0;
  d.ribbon = d.ribbon || null;
  d.legacy = d.legacy || 0;
  d.stats.orders = d.stats.orders || 0;
  d.stats.finds = d.stats.finds || 0;
  for (const m of d.meeples) if (m.hat === undefined) m.hat = m.crop === 'founder' ? 'straw' : null;
  for (const k in d.plots) d.plots[k].fert = d.plots[k].fert | 0;
  initCritters(d);
}

// ---------------------------------------------------------------- journal
let JB = { grow: 0, sell: 0, craft: 0, walk: 0, fish: 0 };   // bonuses from claimed milestones
function recalcJB() {
  JB = { grow: 0, sell: 0, craft: 0, walk: 0, fish: 0 };
  for (const i of S.journal) { const r = JOURNAL[i].r; for (const k in JB) if (r[k]) JB[k] += r[k]; }
}
const legacyMult = () => 1 + 0.1 * (S.legacy || 0);
const JPAGES = {
  crops: () => CROPS.map(c => c.id),
  goods: () => FARM_GOODS.filter(a => a.id !== 'fertilizer').map(a => a.id).concat(GOODS.map(g => g.id)),
  fish: () => FISH.map(f => f.id),
  relics: () => RELICS.map(r => r.id),
};
const jHave = (page, id) => page === 'relics' ? !!S.relics[id] : (S.lifetime[id] || 0) > 0;
const jCount = page => JPAGES[page]().filter(id => jHave(page, id)).length;
const jNeed = j => j.n || JPAGES[j.page]().length;
function checkJournal() {
  JOURNAL.forEach((j, i) => {
    if (S.journal.includes(i) || jCount(j.page) < jNeed(j)) return;
    S.journal.push(i);
    if (j.r.decor) S.found[j.r.decor] = (S.found[j.r.decor] || 0) + (j.r.k || 1);
    recalcJB();
    emit({ t: 'journal', i });
  });
}
function rewardText(r) {
  if (r.grow) return '+' + Math.round(r.grow * 100) + '% crop growth';
  if (r.sell) return '+' + Math.round(r.sell * 100) + '% sell prices';
  if (r.craft) return '+' + Math.round(r.craft * 100) + '% crafting speed';
  if (r.walk) return '+' + Math.round(r.walk * 100) + '% Meeple speed';
  if (r.fish) return '+' + Math.round(r.fish * 100) + '% faster bites';
  if (r.decor) return (r.k > 1 ? r.k + '× ' : '') + BUILDINGS[r.decor].name;
  return '';
}

// ---------------------------------------------------------------- hats
const HAT_RULES = {
  acorn: () => S.stats.cleared >= 150,
  beanie: () => S.stats.orders >= 5,
  bucket: () => fishLevel() >= 5,
  chef: () => S.stats.crafted >= 200,
  tophat: () => S.stats.orders >= 20,
  crown: () => S.won,
};
function unlockHat(id) {
  if (S.hats.includes(id)) return false;
  S.hats.push(id); emit({ t: 'hat', id });
  return true;
}
function checkHats() { for (const id in HAT_RULES) if (!S.hats.includes(id) && HAT_RULES[id]()) unlockHat(id); }

// ---------------------------------------------------------------- emotes (little speech bubbles)
function emote(m, k, chance = 1) { if (m && Math.random() < chance && !(m.emo && m.emo.t > 0.6)) m.emo = { k, t: 2.4 }; }

// ---------------------------------------------------------------- forest discoveries
const FIND_CHANCE = [0, 0.08, 0.12, 0.2, 0.18, 0];   // by cover type
function pickW(opts) {
  let tot = 0; for (const o of opts) tot += o[1];
  let r = Math.random() * tot;
  for (const o of opts) { r -= o[1]; if (r <= 0) return o[0]; }
  return opts[0][0];
}
function rollFind(i, kind, cost) {
  if (Math.random() >= (FIND_CHANCE[kind] || 0)) return;
  const unfound = RELICS.filter(r => !S.relics[r.id]);
  const what = pickW([['coins', 40], ['produce', 24], ['relic', unfound.length ? 14 : 0], ['decor', 12],
    ['lure', S.buildings.some(b => b.type === 'dock') ? 8 : 0], ['hat', FIND_HATS.some(h => !S.hats.includes(h)) ? 3 : 0]]);
  const e = { t: 'find', i, what };
  if (what === 'coins') { e.n = Math.max(12, Math.round(cost * (1.5 + Math.random() * 2.5))); S.coins += e.n; }
  else if (what === 'produce') {
    const open = CROPS.filter(c => cropUnlocked(c.id));
    e.id = open[Math.max(0, open.length - 1 - Math.floor(Math.random() * Math.min(5, open.length)))].id;
    e.n = Math.round(6 + S.level * 0.8 + Math.random() * 6); invAdd(e.id, e.n, false);
  } else if (what === 'relic') {
    e.id = unfound[(Math.random() * unfound.length) | 0].id; S.relics[e.id] = true;
    e.n = Math.max(20, cost * 2); S.coins += e.n;
  } else if (what === 'decor') { e.id = FOUND_DECOR[(Math.random() * FOUND_DECOR.length) | 0]; S.found[e.id] = (S.found[e.id] || 0) + 1; }
  else if (what === 'lure') { e.n = 30 + fishLevel() * 15; addFishXP(e.n); }
  else if (what === 'hat') { const lk = FIND_HATS.filter(h => !S.hats.includes(h)); e.id = lk[(Math.random() * lk.length) | 0]; unlockHat(e.id); }
  S.stats.finds++;
  emit(e);
}

// ---------------------------------------------------------------- compost & fertilizer
const COMPOST_CAP = 24, COMPOST_PER = 4, COMPOST_T = 45, FERT_HARVESTS = 3, FERT_DOUBLE = 0.3;
const compostCap = () => COMPOST_CAP * bCount('compost');
function addCompost(n) {
  const room = compostCap() - S.compost.mat; if (room <= 0) return 0;
  const a = Math.min(n, room); S.compost.mat += a; return a;
}
function tickCompost(dt) {
  const bins = bCount('compost'), C = S.compost;
  if (!bins || C.mat < COMPOST_PER) { C.t = 0; return; }
  C.t += dt * bins;
  while (C.t >= COMPOST_T && C.mat >= COMPOST_PER) { C.t -= COMPOST_T; C.mat -= COMPOST_PER; invAdd('fertilizer', 1, false); }
}
// Meeples work fertilizer into the soil when they plant or harvest, if there's any in storage
function tryFertilize(p) {
  if (p.fert > 0 || !S.useFert || p.gh || !((S.inv.fertilizer || 0) > 0)) return false;
  invTake('fertilizer', 1); p.fert = FERT_HARVESTS; return true;
}

// ---------------------------------------------------------------- fish sizes
function rollSize(f) { const r = Math.random(); return Math.max(1, Math.round(FISHMAP[f].cm * (0.6 + r * 0.55 + Math.pow(Math.random(), 4) * 0.55))); }
function recordCatch(f) {
  const cm = rollSize(f), rec = cm > (S.fishRec[f] || 0);
  if (rec) S.fishRec[f] = cm;
  return { cm, rec };
}

// ---------------------------------------------------------------- orders board
const ORDER_SLOTS = 3;
const hasBoard = () => S.buildings.some(b => b.type === 'noticeboard');
const jitter01 = () => 0.7 + Math.random() * 0.6;
const clampN = (v, lo, hi) => Math.max(lo, Math.min(hi, Math.round(v)));
// what one building of a recipe can turn out in about 2.5 minutes
function recipeQty(r, mult) {
  const n = bCount(r.at); if (!n) return 0;
  return n * r.out[1] / (r.t / craftMult()) * 150 * mult;
}
function orderPool() {
  const pool = [], P = Math.max(9, Object.keys(S.plots).length), fishing = S.meeples.some(m => m.fish) && S.buildings.some(b => b.type === 'dock');
  const recent = L => (L >= S.level - 5 ? 3 : 1);
  LEVELS.forEach((l, L) => { if (l.crop && L <= S.level) pool.push({ id: l.crop, w: recent(L), q: clampN(75 * P / CROP[l.crop].grow * jitter01(), 5, 80) }); });
  const seen = {};
  for (const r of RECIPES) {
    if (!recipeUnlocked(r) || seen[r.out[0]]) continue;
    if (Object.keys(r.in).some(k => FISHMAP[k]) && !fishing) continue;
    const q = recipeQty(r, jitter01()); if (q <= 0) continue;
    seen[r.out[0]] = 1;
    pool.push({ id: r.out[0], w: recent(r.lvl) * (ITEM[r.out[0]].farm ? 1.5 : 1), q: clampN(q, ITEM[r.out[0]].farm ? 3 : 1, ITEM[r.out[0]].farm ? 30 : 20) });
  }
  if (fishing) {
    const lv = fishLevel(), rq = { common: [4, 8], uncommon: [2, 4], rare: [1, 2], epic: [1, 1], legendary: [1, 1] };
    for (const f of FISH) if (lv >= f.minLv && f.rar !== 'legendary') { const [a, b] = rq[f.rar]; pool.push({ id: f.id, w: f.rar === 'epic' ? 0.4 : 1, q: a + Math.floor(Math.random() * (b - a + 1)) }); }
  }
  return pool;
}
function newOrder() {
  const pool = orderPool(); if (!pool.length) return null;
  const lines = 1 + (Math.random() < 0.55 ? 1 : 0) + (Math.random() < 0.3 && S.level > 4 ? 1 : 0), req = {};
  for (let k = 0; k < lines && pool.length; k++) {
    const id = pickW(pool.map(p => [p, p.w]));
    req[id.id] = id.q; pool.splice(pool.indexOf(id), 1);
  }
  let value = 0; for (const k in req) value += sellPrice(k) * req[k];
  const o = { id: S.nextId++, req, reward: Math.max(20, Math.round(value * (2 + Math.random()))), t: 1500 + Math.random() * 900, who: (Math.random() * NEIGHBOURS.length) | 0 };
  if (Math.random() < 0.35) {
    o.bonus = pickW([[{ k: 'fert', n: 6 + ((Math.random() * 6) | 0) }, bUnlocked('compost') ? 3 : 0], [{ k: 'decor', id: FOUND_DECOR[(Math.random() * FOUND_DECOR.length) | 0] }, 2],
      [{ k: 'xp', n: 60 + fishLevel() * 25 }, S.buildings.some(b => b.type === 'dock') ? 2 : 0], [{ k: 'coins', n: Math.round(o.reward * 0.5) }, 1]]);
  }
  return o;
}
const NEIGHBOURS = ['Old Bramblewick', 'the Miller twins', 'Auntie Fern', 'the village baker', 'Captain Reed', 'the schoolteacher', 'Farmer Oakes', 'the innkeeper', 'Granny Thistle', 'the tinker'];
const canFill = o => Object.keys(o.req).every(k => (S.inv[k] || 0) >= o.req[k]);
function fillOrder(o) {
  if (!canFill(o)) return false;
  for (const k in o.req) invTake(k, o.req[k]);
  S.coins += o.reward; S.stats.earned += o.reward; S.stats.orders++;
  S.soldBy._orders = (S.soldBy._orders || 0) + o.reward;
  const b = o.bonus;
  if (b) {
    if (b.k === 'fert') invAdd('fertilizer', b.n, false);
    else if (b.k === 'decor') S.found[b.id] = (S.found[b.id] || 0) + 1;
    else if (b.k === 'xp') addFishXP(b.n);
    else if (b.k === 'coins') { S.coins += b.n; S.stats.earned += b.n; }
  }
  S.orders = S.orders.filter(x => x !== o);
  S.orderNext = Math.min(S.orderNext, 90);
  emit({ t: 'orderdone', o });
  return true;
}
function skipOrder(o) { S.orders = S.orders.filter(x => x !== o); S.orderNext = Math.max(S.orderNext, 120); }
function bonusText(b) {
  if (!b) return '';
  if (b.k === 'fert') return b.n + ' fertilizer';
  if (b.k === 'decor') return 'a ' + BUILDINGS[b.id].name;
  if (b.k === 'xp') return b.n + ' fishing XP';
  if (b.k === 'coins') return fmt(b.n) + ' bonus coins';
  return '';
}
function tickOrders(dt) {
  for (const o of S.orders) o.t -= dt;
  const gone = S.orders.filter(o => o.t <= 0);
  if (gone.length) { S.orders = S.orders.filter(o => o.t > 0); emit({ t: 'orderexpired', n: gone.length }); }
  if (!hasBoard() || S.orders.length >= ORDER_SLOTS) return;
  if ((S.orderNext -= dt) <= 0) {
    const o = newOrder();
    S.orderNext = 150 + Math.random() * 210;
    if (o) { S.orders.push(o); emit({ t: 'order', o }); }
  }
}

// ---------------------------------------------------------------- stuck buildings
// ingredients a crafting building is waiting for that aren't in storage or on the way
function missingOf(b) {
  if (!b.recipe || b.phase !== 'gather') return [];
  const r = RECIPE[b.recipe];
  return Object.keys(r.in).filter(k => (b.got[k] || 0) + (b.transit[k] || 0) < r.in[k] && !((S.inv[k] || 0) > 0));
}
const STUCK_AFTER = 15;
function tickStuck(dt) { for (const b of S.buildings) if (BUILDINGS[b.type].proc) b.stuckT = missingOf(b).length ? (b.stuckT || 0) + dt : 0; }
const stuckList = () => S.buildings.filter(b => (b.stuckT || 0) > STUCK_AFTER);

// ---------------------------------------------------------------- farm stats
const HIST_STEP = 300;
function tickHistory() {
  const last = S.hist[S.hist.length - 1];
  if (last && S.playTime - last[0] < HIST_STEP) return;
  S.hist.push([Math.round(S.playTime), Math.round(S.stats.earned), S.level, S.meeples.length]);
  // keep the log small: thin out the older half once it gets long
  if (S.hist.length > 480) S.hist = S.hist.filter((h, i) => i >= 240 || i % 2 === 0);
}
// coins earned over the last `secs` seconds of play, per hour
function earnRate(secs = 3600) {
  const h = S.hist; if (!h.length) return 0;
  const now = [S.playTime, S.stats.earned];
  let ref = h[0];
  for (let i = h.length - 1; i >= 0; i--) if (S.playTime - h[i][0] >= secs) { ref = h[i]; break; }
  const dt = now[0] - ref[0]; return dt > 60 ? (now[1] - ref[1]) / dt * 3600 : 0;
}

// ---------------------------------------------------------------- Blue Ribbons (after the Fair)
function newRibbon() {
  const seen = {}, pool = [];
  for (const r of RECIPES) {
    const id = r.out[0];
    if (seen[id] || !recipeUnlocked(r) || Object.keys(r.in).some(k => FISHMAP[k] || ITEM[k].farm) || ITEM[id].farm) continue;
    seen[id] = 1; pool.push(r);
  }
  // stick to goods from buildings you already have, when there are enough of them
  const built = pool.filter(r => bCount(r.at) > 0);
  if (built.length >= 4) pool.splice(0, pool.length, ...built);
  const req = {}, base = {}, n = 3 + (Math.random() < 0.4 ? 1 : 0), tier = 1 + S.ribbons * 0.15;
  for (let k = 0; k < n && pool.length; k++) {
    const r = pool.splice((Math.random() * pool.length) | 0, 1)[0], id = r.out[0];
    req[id] = clampN(Math.max(recipeQty(r, 1), 1) * 6 * tier * jitter01(), 5, 200);
    base[id] = S.lifetime[id] || 0;
  }
  return { n: S.ribbons + 1, req, base };
}
function ribbonProgress() {
  const rb = S.ribbon; if (!rb) return null;
  const parts = Object.keys(rb.req).map(k => ({ id: k, have: Math.min(rb.req[k], (S.lifetime[k] || 0) - (rb.base[k] || 0)), need: rb.req[k] }));
  return { parts, done: parts.every(p => p.have >= p.need), frac: parts.reduce((a, p) => a + p.have / p.need, 0) / parts.length };
}
function checkRibbon() {
  if (!S.won) return;
  if (!S.ribbon) { S.ribbon = newRibbon(); return; }
  const pr = ribbonProgress();
  if (!pr || !pr.done) return;
  let value = 0; for (const k in S.ribbon.req) value += sellPrice(k) * S.ribbon.req[k];
  const reward = Math.round(value * 1.5);
  S.ribbons++; S.coins += reward; S.stats.earned += reward;
  let decor = null;
  if (S.ribbons % 3 === 0) { decor = FOUND_DECOR[(Math.random() * FOUND_DECOR.length) | 0]; S.found[decor] = (S.found[decor] || 0) + 1; }
  emit({ t: 'ribbon', n: S.ribbons, reward, decor });
  S.ribbon = newRibbon();
}

// ---------------------------------------------------------------- tick
let _xT = 0;
function updateExtras(dt) {
  tickCompost(dt);
  tickOrders(dt);
  tickStuck(dt);
  for (const m of S.meeples) if (m.emo && (m.emo.t -= dt) <= 0) m.emo = null;
  if ((_xT += dt) > 2) {
    _xT = 0;
    tickHistory(); checkJournal(); checkHats(); checkRibbon();
    // a few idle Meeples hum a tune or doze off at night
    const night = Math.sin((S.day - 0.25) * Math.PI * 2) < -0.1;
    for (const m of S.meeples) if (!m.task && !m.hand.length) emote(m, night ? 'zzz' : 'note', 0.06);
  }
}
;(window.__stage = window.__stage || []).push('world2.js loaded');
