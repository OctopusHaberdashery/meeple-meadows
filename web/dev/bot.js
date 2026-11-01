// Dev-only autoplayer for pacing tests. Not shipped in the APK.
'use strict';
window.BOT = (function () {
  const RBY = {}; RECIPES.forEach(r => RBY[r.out[0]] = r);
  function needs() {
    const L = S.level + 1; if (L >= LEVELS.length) return {};
    const req = LEVELS[L].req, out = {};
    for (const k in req) { const d = req[k] - (S.lifetime[k] || 0); if (d > 0) out[k] = d; }
    return out;
  }
  // expand goods into raw crop demand
  function cropDemand(nd) {
    const dem = {};
    const add = (id, n, direct) => {
      if (CROP[id]) { dem[id] = (dem[id] || 0) + n; return; }
      const r = RBY[id]; if (!r) return;
      const batches = Math.ceil(Math.max(0, n - (direct ? 0 : (S.inv[id] || 0))) / r.out[1]);
      for (const k in r.in) add(k, r.in[k] * batches);
    };
    for (const k in nd) add(k, nd[k], true);
    return dem;
  }
  function goodsChain(nd) {
    const goods = {};
    const add = (id, n) => { if (CROP[id]) return; const r = RBY[id]; if (!r) return; goods[id] = (goods[id] || 0) + n; for (const k in r.in) add(k, r.in[k] * Math.ceil(n / r.out[1])); };
    for (const k in nd) add(k, nd[k]);
    return goods;
  }
  function findSpot(type) {
    const d = BUILDINGS[type];
    for (let r = 1; r < 30; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
      const x = CX + dx, y = CY + dy;
      if (canPlace(type, x, y)) return [x, y];
    }
    return null;
  }
  function cheapestClear() {
    let best = null, bc = 1e18;
    for (let i = 0; i < MW * MH; i++) if (canClear(i)) { const c = clearCost(i); if (c < bc) { bc = c; best = i; } }
    return best == null ? null : [best, bc];
  }
  function bestCashCrop() {
    let best = 'carrot', bv = 0;
    for (const c of CROPS) if (cropUnlocked(c.id) && cropInSeason(c.id)) { const v = c.price / c.grow; if (v > bv) { bv = v; best = c.id; } }
    return best;
  }
  function think() {
    const nd = needs(), dem = cropDemand(nd), goods = goodsChain(nd);
    // plots
    const plots = Object.keys(S.plots).map(Number).filter(i => !S.plots[i].gh);
    const ghPlots = Object.keys(S.plots).map(Number).filter(i => S.plots[i].gh);
    if (ghPlots.length) { const offC = Object.keys(dem).filter(c => cropUnlocked(c) && !cropInSeason(c)); const pick = offC.sort((a, b) => dem[b] * CROP[b].grow - dem[a] * CROP[a].grow)[0] || Object.keys(dem).filter(cropUnlocked)[0]; if (pick) ghPlots.forEach(i => setPlotCrop(i, pick)); }
    const sea = seasonIdx();
    const crops = Object.keys(dem).filter(c => cropUnlocked(c) && cropInSeason(c));
    const offCrops = Object.keys(dem).filter(c => cropUnlocked(c) && !cropInSeason(c));
    const weights = crops.map(c => dem[c] * CROP[c].grow);
    const tot = weights.reduce((a, b) => a + b, 0);
    if (tot > 0) {
      const want = {}; let assigned = 0;
      crops.forEach((c, i) => { want[c] = Math.max(1, Math.round(weights[i] / tot * plots.length)); assigned += want[c]; });
      // keep current assignments where possible
      const cnt = {}; plots.forEach(i => cnt[S.plots[i].crop] = (cnt[S.plots[i].crop] || 0) + 1);
      for (const i of plots) {
        const c = S.plots[i].crop;
        if ((want[c] || 0) < (cnt[c] || 0)) {
          const under = crops.find(x => (cnt[x] || 0) < want[x]);
          if (under) { cnt[c]--; cnt[under] = (cnt[under] || 0) + 1; setPlotCrop(i, under); }
        }
      }
    } else { const cc = bestCashCrop(); plots.forEach(i => setPlotCrop(i, cc)); }
    // processors
    for (const g in goods) {
      const r = RBY[g]; if (!recipeUnlocked(r)) continue;
      let procs = S.buildings.filter(b => b.type === r.at);
      const busyWithNeeded = procs.filter(b => b.recipe && goods[RECIPE[b.recipe].out[0]] && b.phase !== 'idle');
      const already = procs.some(b => b.recipe === r.id && b.phase !== 'idle');
      if (already) continue;
      let free = procs.find(b => !b.recipe || b.phase === 'idle' || !goods[RECIPE[b.recipe].out[0]]);
      if (!free && bUnlocked(r.at) && (!BUILDINGS[r.at].max || procs.length < BUILDINGS[r.at].max) && S.coins >= bCost(r.at)) {
        let sp = findSpot(r.at);
        for (let k = 0; !sp && k < 12; k++) { const cl = cheapestClear(); if (!cl || cl[1] > S.coins * 0.2) break; doClear(cl[0]); sp = findSpot(r.at); }
        if (sp && place(r.at, sp[0], sp[1])) free = S.buildings[S.buildings.length - 1];
      }
      if (free) setRecipe(free, r.id);
    }
    // creator
    if (!S.buildings.some(b => b.type === 'creator')) { if (S.coins >= bCost('creator')) { const sp = findSpot('creator'); if (sp) place('creator', sp[0], sp[1]); } }
    // more processors of crowded types
    for (const t of ['crock', 'barrel']) {
      if (!bUnlocked(t)) continue;
      const want = Object.keys(goods).filter(g => RBY[g].at === t && recipeUnlocked(RBY[g])).length * 2;
      if (bCount(t) < want && S.coins > bCost(t) * 1.5) { const sp = findSpot(t); if (sp) place(t, sp[0], sp[1]); }
    }
    // meeples
    const cr = S.buildings.find(b => b.type === 'creator');
    if (cr && S.meeples.length + cr.queue.length < Math.min(MEEPLE_MAX, 3 + plots.length / 3)) {
      let best = null, bs = 0;
      for (const c of CROPS) if (cropUnlocked(c.id) && (S.inv[c.id] || 0) >= meepleCost(c.id)) { const sc = c.meeple.speed * c.meeple.carry; if (sc > bs) { bs = sc; best = c.id; } }
      if (best) queueMeeple(best);
    }
    // upgrades
    for (const u of UPGRADES) if ((!u.lvl || S.level >= u.lvl) && upg(u.id) < u.max && upgCost(u) < S.coins * 0.3) buyUpgrade(u);
    // plots / clearing
    for (let k = 0; k < 6; k++) {
      const pc = bCost('plot');
      if (pc < S.coins * 0.25) {
        const sp = findSpot('plot');
        if (sp) { place('plot', sp[0], sp[1]); continue; }
        const cl = cheapestClear(); if (cl && cl[1] < S.coins * 0.3) doClear(cl[0]); else break;
      } else break;
    }
    if (bCount('well') < 3 && S.coins > bCost('well') * 3) { const sp = findSpot('well'); if (sp) place('well', sp[0], sp[1]); }
    if (bUnlocked('greenhouse') && bCount('greenhouse') < 2 && S.coins > bCost('greenhouse') * 1.2) {
      let sp = findSpot('greenhouse');
      for (let k = 0; !sp && k < 30; k++) { const cl = cheapestClear(); if (!cl || cl[1] > S.coins * 0.05) break; doClear(cl[0]); sp = findSpot('greenhouse'); }
      if (sp) place('greenhouse', sp[0], sp[1]);
    }
    // selling: keep what's needed, sell the rest
    const keep = {};
    for (const c in dem) keep[c] = 1e9;
    for (const g in goods) { keep[g] = 1e9; const r = RBY[g]; for (const k in r.in) keep[k] = 1e9; }
    for (const id in S.inv) if (!keep[id] && S.inv[id] > 0) sell(id, S.inv[id]);
    // sell excess crops that are needed but heavily stocked
    for (const id in S.inv) if (keep[id] && S.inv[id] > 400) sell(id, S.inv[id] - 400);
  }
  function run(hours, dt = 0.25) {
    const end = S.playTime + hours * 3600, marks = [];
    let lv = S.level, tThink = 0;
    const t0 = performance.now();
    while (S.playTime < end) {
      update(dt); EV.length = 0; tThink += dt;
      if (tThink > 10) { tThink = 0; think(); }
      if (S.level !== lv) { lv = S.level; marks.push([lv, (S.playTime / 3600).toFixed(2) + 'h', S.meeples.length, Object.keys(S.plots).length, fmt(S.coins)]); }
      if (S.won) break;
    }
    return { marks, ms: Math.round(performance.now() - t0), at: (S.playTime / 3600).toFixed(2) };
  }
  return { run, think, needs };
})();
