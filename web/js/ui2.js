// Meeple Meadows — UI for the homestead extras: alerts, orders board, compost bin, journal & farm
// stats, hats, found decorations, "show me what's missing", Blue Ribbons and legacy meadows.
'use strict';

const LIVE_X = {
  ot: id => { const o = S.orders.find(x => x.id == id); return o ? fmtTime(o.t) + ' left' : ''; },
  cmp: () => compostCap() ? S.compost.mat / compostCap() : 0,
  cmpt: () => Math.floor(S.compost.mat) + ' / ' + compostCap() + ' scraps',
  fert: () => fmt(S.inv.fertilizer || 0),
  st: k => k === 'rate' ? fmt(earnRate(3600)) : k === 'avg' ? fmt(S.playTime > 60 ? S.stats.earned / S.playTime * 3600 : 0) : k === 'time' ? fmtTime(S.playTime) : '',
};

// ---------------------------------------------------------------- HUD alerts (orders, stuck buildings, decorations)
let _stuckIdx = 0;
function updateAlerts() {
  const el = $('hAlerts'); if (!el) return;
  const items = [];
  if (hasBoard()) {
    const ready = S.orders.filter(canFill).length;
    items.push(`<button class="pill alert ${ready ? 'good' : ''}" data-a="orders">${iconImg('orders')}<span>${ready ? ready + ' ready' : S.orders.length + ' order' + (S.orders.length === 1 ? '' : 's')}</span></button>`);
  }
  const stuck = stuckList().length;
  if (stuck) items.push(`<button class="pill alert bad" data-a="stuck">${iconImg('alert')}<span>${stuck} stuck</span></button>`);
  let found = 0; for (const k in S.found) found += S.found[k] || 0;
  if (found) items.push(`<button class="pill alert" data-a="found">${iconImg('star')}<span>${found} to place</span></button>`);
  const h = items.join('');
  if (el.dataset.h !== h) { el.innerHTML = h; el.dataset.h = h; }
}
$('hAlerts') && ($('hAlerts').onclick = e => {
  const el = e.target.closest('[data-a]'); if (!el) return;
  AUDIO.sfx('click');
  const a = el.dataset.a;
  if (a === 'orders') { const b = S.buildings.find(x => x.type === 'noticeboard'); if (b) openPanel('orders', b.id); }
  else if (a === 'found') openPanel('build', null, 'decor');
  else if (a === 'stuck') {
    // each tap jumps to the next stuck building
    const list = stuckList(); if (!list.length) return;
    const b = list[_stuckIdx++ % list.length], d = BUILDINGS[b.type];
    R.cam.x = (b.x + d.w / 2) * T; R.cam.y = (b.y + d.h / 2) * T; R.clampCam();
    openPanel('proc', b.id);
  }
});

// ---------------------------------------------------------------- what's missing, and where it comes from
function sourceInfo(k) {
  if (CROP[k]) {
    if (!cropUnlocked(k)) return { text: 'A crop you haven\'t unlocked yet', btn: null };
    const n = Object.values(S.plots).filter(p => p.crop === k).length;
    return { text: n ? `Growing in ${n} plot${n > 1 ? 's' : ''}; plant more to keep up` : 'Grown in garden plots, but none are planted', btn: 'Plant it' };
  }
  if (FISHMAP[k]) return { text: S.buildings.some(b => b.type === 'dock') ? 'Caught by a Meeple on fishing duty at a dock' : 'Caught at a Fishing Dock (none built yet)', btn: 'Show me' };
  const r = RECIPES.find(x => x.out[0] === k);
  if (!r) return { text: '', btn: null };
  const where = BUILDINGS[r.at].name, have = S.buildings.filter(b => b.type === r.at);
  if (!have.length) return { text: `Made at a ${where} (not built yet)`, btn: bUnlocked(r.at) ? 'Build one' : null };
  const making = have.some(b => b.recipe === r.id && b.phase !== 'idle');
  return { text: making ? `A ${where} is making it now` : `Made at the ${where}; none are set to make it`, btn: making ? 'Show me' : 'Set it up' };
}
function missingHtml(b) {
  const miss = missingOf(b); if (!miss.length) return '';
  return `<div class="warnbox"><div class="t">${iconImg('alert', 'sm')} Waiting for ingredients</div>` + miss.map(k => {
    const s = sourceInfo(k);
    return `<div class="row" style="margin-top:.35rem">${iconImg(k)}<div class="grow"><b>${ITEM[k].name}</b><div class="s">${s.text}</div></div>${s.btn ? `<button class="btn sm gold" data-a="source" data-v="${k}">${s.btn}</button>` : ''}</div>`;
  }).join('') + '</div>';
}
function focusB(b) { const d = BUILDINGS[b.type]; R.cam.x = (b.x + d.w / 2) * T; R.cam.y = (b.y + d.h / 2) * T; R.clampCam(); }
function findSource(k) {
  if (CROP[k]) { setMode('paint', k); toast('Tap or drag across plots to plant ' + CROP[k].name, false, k); return; }
  if (FISHMAP[k]) {
    const d = S.buildings.find(b => b.type === 'dock');
    if (d) { focusB(d); openPanel('dock', d.id); } else openPanel('build', null, 'water');
    return;
  }
  const r = RECIPES.find(x => x.out[0] === k); if (!r) return;
  const have = S.buildings.filter(b => b.type === r.at);
  if (!have.length) { openPanel('build', null, BUILDINGS[r.at].cat); toast('Build a ' + BUILDINGS[r.at].name + ' to make ' + ITEM[k].name, false, 'hammer'); return; }
  const b = have.find(x => x.recipe === r.id && x.phase !== 'idle') || have.find(x => !x.recipe || x.phase === 'idle') || have[0];
  focusB(b); openPanel('proc', b.id);
  if (b.recipe !== r.id) toast('Tap Make on ' + ITEM[k].name + ' to start it here', false, k);
}
PANELS.proc.act = (a, v) => { if (a === 'source') { findSource(v); return 'stop'; } };

// ---------------------------------------------------------------- found decorations in the Build menu
function foundCard(t) {
  const d = BUILDINGS[t], have = S.found[t] || 0, placed = bCount(t);
  if (!have && !placed) return `<div class="card locked"><div class="row"><div style="font-size:1.6rem;width:2.8rem;text-align:center">❔</div><div class="grow"><div class="t">???</div><div class="s">${FOUND_DECOR.includes(t) ? 'Turns up while clearing the woods, or as an order prize' : 'A Journal reward'}</div></div></div></div>`;
  return `<div class="card"><div class="row"><img class="bimg" src="${buildingURL(t)}"><div class="grow"><div class="t">${d.name}</div><div class="s">${d.desc}</div>
    <div class="row" style="margin-top:.3rem"><span class="chip ${have ? 'ok' : ''}">🎁 ${have} to place</span><span class="s">${placed ? placed + ' placed' : ''}</span><span class="grow"></span>
    <button class="btn sm green ${have ? '' : 'dis'}" data-a="build" data-v="${t}">Place</button></div></div></div></div>`;
}

// ---------------------------------------------------------------- hats & names
function hatPicker(m) {
  const cell = (id, name, on, locked, how) => `<div class="cell ${on ? 'sel' : ''} ${locked ? 'locked' : ''}" ${locked ? '' : `data-a="mhat" data-v="${id}"`}>${locked ? '<div style="font-size:1.5rem;height:2.3rem">🔒</div>' : id === 'none' ? '<div style="font-size:1.5rem;height:2.3rem">🚫</div>' : iconImg('hat_' + id)}${name}${locked ? `<div class="s">${how}</div>` : ''}</div>`;
  return `<div class="sec">Hat</div><div class="grid">` + cell('none', 'No hat', !m.hat) +
    HATS.map(h => cell(h.id, h.name, m.hat === h.id, !S.hats.includes(h.id), h.how)).join('') + '</div>';
}
function renameMeeple(m) {
  if (!m) return;
  modal(`<h2>Rename ${esc(m.name)}</h2><input id="rnIn" class="txt" maxlength="16" value="${esc(m.name)}" autocomplete="off">
    <div class="btns"><button class="btn" data-a="no">Cancel</button><button class="btn green" data-a="yes">Save</button></div>`, a => {
    if (a === 'yes') { const n = $('rnIn').value.trim(); if (n) { m.name = n.slice(0, 16); emote(m, 'heart'); } }
    closeModal(); if (UI.panel) renderPanel(true);
  });
  const inp = $('rnIn'); inp.focus(); inp.select();
  inp.onkeydown = e => { if (e.key === 'Enter') $('modal').querySelector('[data-a="yes"]').click(); };
}

// ---------------------------------------------------------------- orders board
PANELS.orders = {
  valid: p => !!BMAP[p.id],
  head: () => `${iconImg('orders', 'lg')}<h2>Orders Board<small>${S.stats.orders} filled so far</small></h2>`,
  sig: () => S.orders.map(o => o.id + (canFill(o) ? 'y' : 'n') + Object.keys(o.req).map(k => Math.min(S.inv[k] || 0, o.req[k])).join('.')).join(',') + ':' + Math.ceil(S.orderNext / 15),
  body: () => {
    let h = `<p class="s">Neighbours pin up requests here. Deliver straight from storage before the time runs out; they pay far more than the market.</p>`;
    for (const o of S.orders) {
      const ok = canFill(o);
      h += `<div class="card ${ok ? 'sel' : ''}"><div class="t">${NEIGHBOURS[o.who]} would like:</div><div class="row wrap" style="margin:.3rem 0">` +
        Object.keys(o.req).map(k => `<span class="chip ${(S.inv[k] || 0) >= o.req[k] ? 'ok' : 'bad'}">${iconImg(k, 'sm')}${fmt(Math.min(S.inv[k] || 0, o.req[k]))}/${fmt(o.req[k])} ${ITEM[k].name}</span>`).join('') +
        `</div><div class="s">Reward ${iconImg('coin', 'sm')}<b>${fmt(o.reward)}</b>${o.bonus ? ' + ' + bonusText(o.bonus) : ''} · ⏳ <span data-live="ot:${o.id}"></span></div>
        <div class="row" style="margin-top:.3rem"><span class="grow"></span><button class="btn sm" data-a="oskip" data-v="${o.id}">Skip</button><button class="btn sm green ${ok ? '' : 'dis'}" data-a="ofill" data-v="${o.id}">Deliver</button></div></div>`;
    }
    if (S.orders.length < ORDER_SLOTS) h += `<div class="card locked"><div class="s">📌 Another order should be pinned up in about ${fmtTime(Math.max(5, S.orderNext))}.</div></div>`;
    h += `<p class="s">Delivering never takes back goal progress: goals count everything your Meeples have banked.</p>`;
    h += `<div class="sec">Building</div><div class="row"><button class="btn sm" data-a="move">${iconImg('move', 'sm')} Move</button><button class="btn sm red" data-a="demolish">${iconImg('trash', 'sm')} Demolish</button></div>`;
    return h;
  },
  act: (a, v) => {
    const o = S.orders.find(x => x.id == v); if (!o) return;
    if (a === 'ofill') fillOrder(o);
    else if (a === 'oskip') skipOrder(o);
  },
};

// ---------------------------------------------------------------- compost bin
PANELS.compost = {
  valid: p => !!BMAP[p.id],
  head: () => `<img class="bimg" style="width:2.8rem;height:2.8rem" src="${buildingURL('compost')}"><h2>Compost<small>${bCount('compost')} bin${bCount('compost') > 1 ? 's' : ''} working together</small></h2>`,
  sig: () => [S.useFert, bCount('compost'), Object.keys(S.inv).filter(k => CROP[k] && S.inv[k] >= 1).join()].join('/'),
  body: () => {
    let h = `<div class="card"><div class="t">The heap</div><div class="bar big" style="margin:.3rem 0"><i data-bar="cmp:"></i></div><div class="s" data-live="cmpt:"></div>
      <div class="s">Every ${COMPOST_PER} scraps rot into 1 fertilizer (about ${COMPOST_T}s per bin). Spent plants go in on their own.</div>
      <div class="row" style="margin-top:.4rem">${iconImg('fertilizer', 'lg')}<div class="grow"><b data-live="fert:"></b> fertilizer in storage</div></div></div>
      <div class="row" style="margin:.3rem 0 .6rem"><span class="s grow">Meeples work fertilizer into plots when they plant or harvest. It lasts ${FERT_HARVESTS} harvests, each with a ${Math.round(FERT_DOUBLE * 100)}% chance of a double crop.</span>
      <div class="toggle"><button class="${S.useFert ? 'on' : ''}" data-a="usefert" data-v="1">Use</button><button class="${!S.useFert ? 'on' : ''}" data-a="usefert" data-v="0">Save</button></div></div>`;
    const crops = CROPS.filter(c => (S.inv[c.id] || 0) >= 1);
    h += `<div class="sec">Toss in spare produce</div>`;
    h += crops.length ? `<p class="s">Tap a crop to toss up to 10 into the heap.</p><div class="grid">` + crops.map(c => `<div class="cell" data-a="toss" data-v="${c.id}">${iconImg(c.id)}<span class="q" data-live="inv:${c.id}"></span>${c.name}</div>`).join('') + '</div>' : `<p class="s">Nothing in storage to toss right now.</p>`;
    h += `<div class="sec">Building</div><div class="row"><button class="btn sm" data-a="move">${iconImg('move', 'sm')} Move</button><button class="btn sm red" data-a="demolish">${iconImg('trash', 'sm')} Demolish</button></div>`;
    return h;
  },
  act: (a, v) => {
    if (a === 'usefert') S.useFert = v === '1';
    else if (a === 'toss') {
      const n = Math.min(10, S.inv[v] || 0, compostCap() - S.compost.mat);
      if (n <= 0) { toast('The heap is full. Build another bin or wait for it to rot down.', true); return; }
      invTake(v, n); addCompost(n); AUDIO.sfx('drop');
    }
  },
};

// ---------------------------------------------------------------- journal
const JTABS = [['crops', 'Crops'], ['goods', 'Kitchen'], ['fish', 'Fish'], ['relics', 'Relics'], ['hats', 'Hats'], ['stats', 'Stats']];
function milestonesHtml(page) {
  const ms = JOURNAL.map((j, i) => [j, i]).filter(([j]) => j.page === page); if (!ms.length) return '';
  const have = jCount(page);
  return `<div class="card"><div class="t">${have} / ${JPAGES[page]().length} discovered</div>` + ms.map(([j, i]) => {
    const done = S.journal.includes(i), need = jNeed(j);
    return `<div class="req" style="margin:.2rem 0"><span style="width:2.2rem;font-weight:900">${need}</span><div class="bar ${done ? '' : 'gold'}"><i style="width:${Math.min(100, have / need * 100).toFixed(1)}%"></i></div><span style="width:11rem;text-align:right">${done ? '✓ ' : ''}${rewardText(j.r)}</span></div>`;
  }).join('') + '</div>';
}
PANELS.journal = {
  tabs: JTABS,
  head: () => `${iconImg('journal', 'lg')}<h2>Journal<small>Your collection, records and farm stats</small></h2>`,
  sig: p => p.tab === 'stats' ? S.hist.length + ':' + Object.keys(S.soldBy).length
    : p.tab === 'hats' ? S.hats.join() : jCount(p.tab) + ':' + S.journal.length + ':' + (p.tab === 'fish' ? JSON.stringify(S.fishRec) : ''),
  body: p => {
    if (p.tab === 'stats') return statsHtml();
    if (p.tab === 'hats') return `<p class="s">Hats are just for fun. Pick one for a Meeple from their own panel.</p><div class="grid">` + HATS.map(h => {
      const on = S.hats.includes(h.id);
      return `<div class="cell ${on ? '' : 'locked'}">${on ? iconImg('hat_' + h.id) : '<div style="font-size:1.5rem;height:2.3rem">🔒</div>'}${h.name}<div class="s">${h.how}</div></div>`;
    }).join('') + '</div>';
    let h = milestonesHtml(p.tab) + '<div class="grid">';
    if (p.tab === 'relics') h += RELICS.map(r => S.relics[r.id] ? `<div class="cell">${iconImg('relic_' + r.id)}${r.name}<div class="s">${r.desc}</div></div>` : `<div class="cell locked"><div style="font-size:1.5rem;height:2.3rem">❔</div>???<div class="s">Still buried somewhere</div></div>`).join('');
    else h += JPAGES[p.tab]().map(id => {
      if (!jHave(p.tab, id)) return `<div class="cell locked"><div style="font-size:1.5rem;height:2.3rem">❔</div>???</div>`;
      const sub = p.tab === 'fish' ? (S.fishRec[id] ? 'Biggest: ' + S.fishRec[id] + ' cm' : fmt(S.lifetime[id]) + ' caught') : fmt(S.lifetime[id]) + (p.tab === 'crops' ? ' grown' : ' made');
      return `<div class="cell">${iconImg(id)}${ITEM[id].name}<div class="s">${sub}</div></div>`;
    }).join('');
    h += '</div>';
    if (p.tab === 'relics') h += `<p class="s">Relics turn up now and then when you clear brambles, trees and boulders.</p>`;
    if (p.tab === 'fish') h += `<p class="s">Every catch has a size. Your biggest of each kind is kept here.</p>`;
    return h;
  },
  after: (el, p) => { if (p.tab === 'stats') setupStatsChart(); },
};
function statsHtml() {
  const tile = (label, live, sub) => `<div class="tile"><div class="s">${label}</div><b data-live="${live}"></b>${sub ? `<div class="s">${sub}</div>` : ''}</div>`;
  let h = `<div class="tiles">${tile('Coins per hour', 'st:rate', 'over the last hour')}${tile('Lifetime average', 'st:avg', 'coins per hour')}${tile('Time played', 'st:time', '')}</div>`;
  h += `<div class="row wrap" style="gap:.35rem;margin:.4rem 0"><span class="chip">${iconImg('coin', 'sm')}${fmt(S.stats.earned)} earned</span><span class="chip">${iconImg('orders', 'sm')}${S.stats.orders} order${S.stats.orders === 1 ? "" : "s"}</span><span class="chip">${iconImg('axe', 'sm')}${S.stats.cleared} cleared</span><span class="chip">${iconImg('star', 'sm')}${S.stats.finds} finds</span><span class="chip">${iconImg('book', 'sm')}${fmt(S.stats.crafted)} crafted</span>${S.legacy ? `<span class="chip">${iconImg('ribbon', 'sm')}Legacy ×${S.legacy}</span>` : ''}${S.ribbons ? `<span class="chip">${iconImg('ribbon', 'sm')}${S.ribbons} ribbons</span>` : ''}</div>`;
  h += `<div class="sec">Coins earned per hour</div><div class="chartbox"><canvas id="stChart"></canvas><div class="s" id="stEmpty"></div></div>`;
  const top = Object.keys(S.soldBy).sort((a, b) => S.soldBy[b] - S.soldBy[a]).slice(0, 8);
  h += `<div class="sec">Best sellers</div>`;
  if (!top.length) return h + `<p class="s">Nothing sold yet.</p>`;
  const max = S.soldBy[top[0]];
  h += top.map(k => `<div class="hbar">${k === '_orders' ? iconImg('orders', 'sm') : iconImg(k, 'sm')}<span class="nm">${k === '_orders' ? 'Orders' : ITEM[k].name}</span><div class="trk"><i style="width:${(S.soldBy[k] / max * 100).toFixed(1)}%"></i></div><span class="v">${fmt(S.soldBy[k])}</span></div>`).join('');
  return h;
}
// a single-series line chart of earning rate over play time, with level-ups marked on the axis
function setupStatsChart() {
  const cv = $('stChart'); if (!cv) return;
  const pts = [], h = S.hist.concat([[S.playTime, S.stats.earned, S.level, S.meeples.length]]);
  for (let i = 1; i < h.length; i++) { const dt = h[i][0] - h[i - 1][0]; if (dt > 30) pts.push({ t: (h[i][0] + h[i - 1][0]) / 2, v: (h[i][1] - h[i - 1][1]) / dt * 3600, lv: h[i][2] }); }
  // light smoothing so one big sale doesn't spike the whole chart
  const sm = pts.map((p, i) => { const a = pts.slice(Math.max(0, i - 1), i + 2); return { ...p, v: a.reduce((s, q) => s + q.v, 0) / a.length }; });
  if (sm.length < 2) { cv.style.display = 'none'; $('stEmpty').textContent = 'Play a little longer and your earnings chart will appear here (it updates every 5 minutes).'; return; }
  const dpr = window.devicePixelRatio || 1, W = cv.clientWidth, H = cv.clientHeight;
  cv.width = W * dpr; cv.height = H * dpr;
  const g = cv.getContext('2d'), L = 46, Rm = 10, Tp = 10, B = 24;
  const t0 = h[0][0], t1 = h[h.length - 1][0], vmax = Math.max(1, ...sm.map(p => p.v));
  const step = niceStep(vmax / 3), top = Math.ceil(vmax / step) * step;
  const X = t => L + (t - t0) / Math.max(1, t1 - t0) * (W - L - Rm), Y = v => Tp + (1 - v / top) * (H - Tp - B);
  const draw = hover => {
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    g.font = '700 10px sans-serif'; g.textBaseline = 'middle';
    // recessive grid
    for (let v = 0; v <= top + 1e-9; v += step) {
      g.strokeStyle = v === 0 ? 'rgba(61,42,31,0.45)' : 'rgba(61,42,31,0.12)'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(L, Math.round(Y(v)) + 0.5); g.lineTo(W - Rm, Math.round(Y(v)) + 0.5); g.stroke();
      g.fillStyle = '#7a6450'; g.textAlign = 'right'; g.fillText(fmt(v), L - 6, Y(v));
    }
    // x axis: hours played
    g.textAlign = 'center'; g.textBaseline = 'top'; g.fillStyle = '#7a6450';
    const hs = Math.max(1, Math.ceil((t1 - t0) / 3600 / 5));
    for (let hr = Math.ceil(t0 / 3600); hr * 3600 <= t1; hr += hs) g.fillText(hr + 'h', X(hr * 3600), H - B + 12);
    // level-ups as small ticks under the line, labels only where there's room
    let lastLx = -99;
    for (let i = 1; i < h.length; i++) if (h[i][2] > h[i - 1][2]) {
      const x = X(h[i][0]); g.fillStyle = '#e8a020'; g.beginPath(); g.arc(x, H - B, 3, 0, Math.PI * 2); g.fill();
      if (x - lastLx > 34) { g.fillStyle = '#9a6a10'; g.fillText('Lv' + (h[i][2] + 1), x, H - B + 2); lastLx = x; }
    }
    // the line, with a soft fill beneath
    g.beginPath(); sm.forEach((p, i) => i ? g.lineTo(X(p.t), Y(p.v)) : g.moveTo(X(p.t), Y(p.v)));
    g.lineTo(X(sm[sm.length - 1].t), Y(0)); g.lineTo(X(sm[0].t), Y(0)); g.closePath(); g.fillStyle = 'rgba(79,154,48,0.14)'; g.fill();
    g.beginPath(); sm.forEach((p, i) => i ? g.lineTo(X(p.t), Y(p.v)) : g.moveTo(X(p.t), Y(p.v)));
    g.strokeStyle = '#4f9a30'; g.lineWidth = 2; g.lineJoin = 'round'; g.stroke();
    if (hover != null) {
      const p = sm[hover], x = X(p.t), y = Y(p.v);
      g.strokeStyle = 'rgba(61,42,31,0.35)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x + 0.5, Tp); g.lineTo(x + 0.5, H - B); g.stroke();
      g.beginPath(); g.arc(x, y, 4.5, 0, Math.PI * 2); g.fillStyle = '#4f9a30'; g.fill(); g.strokeStyle = '#fbf3df'; g.lineWidth = 2; g.stroke();
      const txt = fmt(p.v) + ' / hour', sub = fmtTime(p.t) + ' · Level ' + (p.lv + 1);
      g.font = '800 11px sans-serif'; const w = Math.max(g.measureText(txt).width, g.measureText(sub).width) + 14;
      const bx = Math.min(W - Rm - w, Math.max(L, x - w / 2)), by = Math.max(2, y - 46);
      rrect(g, bx, by, w, 36, 6); g.fillStyle = '#fffaf0'; g.fill(); g.strokeStyle = INK; g.lineWidth = 1; g.stroke();
      g.textAlign = 'left'; g.textBaseline = 'top'; g.fillStyle = '#3d2a1f'; g.fillText(txt, bx + 7, by + 5);
      g.font = '700 10px sans-serif'; g.fillStyle = '#7a6450'; g.fillText(sub, bx + 7, by + 20);
    }
  };
  draw(null);
  const pick = e => { const r = cv.getBoundingClientRect(), mx = e.clientX - r.left; let best = 0, bd = 1e9; sm.forEach((p, i) => { const d = Math.abs(X(p.t) - mx); if (d < bd) { bd = d; best = i; } }); draw(best); };
  cv.onpointermove = pick; cv.onpointerdown = pick; cv.onpointerleave = () => draw(null);
}
function niceStep(x) { const p = Math.pow(10, Math.floor(Math.log10(Math.max(1e-9, x)))), f = x / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p; }

// ---------------------------------------------------------------- events from the extras
function onExtraEvent(e) {
  switch (e.t) {
    case 'find': {
      const msg = {
        coins: () => `Dug up a buried pouch of <b>${fmt(e.n)}</b> coins!`,
        produce: () => `Found a basket of <b>${e.n} wild ${ITEM[e.id].name.toLowerCase()}</b>!`,
        relic: () => `Found a relic: <b>${RELICS.find(r => r.id === e.id).name}</b>! It's in your Journal (+${fmt(e.n)} coins).`,
        decor: () => `Found a <b>${BUILDINGS[e.id].name}</b>! Place it from Build → Decor.`,
        lure: () => `Found an old fishing lure (+${e.n} fishing XP).`,
        hat: () => `Found a <b>${HATS.find(h => h.id === e.id).name}</b>! Dress up a Meeple from their panel.`,
        seed: () => `Found a <b>${ITEM[e.id].name}</b>! Plant it from Build → Trees.`,
      }[e.what];
      toast(msg(), false, e.what === 'coins' ? 'coin' : e.what === 'produce' ? e.id : e.what === 'relic' ? 'relic_' + e.id : e.what === 'hat' ? 'hat_' + e.id : e.what === 'seed' ? e.id : e.what === 'lure' ? 'minnow' : 'star');
      return true;
    }
    case 'journal': AUDIO.sfx('level'); toast(`📖 Journal milestone! <b>${rewardText(JOURNAL[e.i].r)}</b>`, false, 'journal'); return true;
    case 'hat': if (e.id !== 'crown') toast(`New hat: <b>${HATS.find(h => h.id === e.id).name}</b>! Tap a Meeple to try it on.`, false, 'hat_' + e.id); return true;
    case 'order': toast(`${NEIGHBOURS[e.o.who]} pinned up a new order`, false, 'orders'); return true;
    case 'orderdone': AUDIO.sfx('coin'); toast(`Order delivered! +${fmt(e.o.reward)} coins${e.o.bonus ? ' and ' + bonusText(e.o.bonus) : ''}`, false, 'orders'); return true;
    case 'orderexpired': toast(e.n > 1 ? e.n + ' orders expired' : 'An order expired', false, 'orders'); return true;
    case 'ribbon': AUDIO.sfx('level'); toast(`🎀 Blue Ribbon #${e.n}! +${fmt(e.reward)} coins${e.decor ? ' and a ' + BUILDINGS[e.decor].name : ''}`, false, 'ribbon'); saveGame(); return true;
  }
  return false;
}

// ---------------------------------------------------------------- legacy: a new meadow after the Fair
function openLegacy() {
  saveGame();
  const legacy = (S.legacy || 0) + 1, hats = S.hats.slice(), cur = S.slot;
  const rows = [1, 2, 3].map(s => {
    const inf = slotInfo(s), mine = s === cur;
    return `<div class="card slot">${inf ? iconImg(inf.crop, 'xl') : iconImg('soil', 'xl')}<div class="grow"><div class="t">Homestead ${s}${mine ? ' (this one)' : ''}</div><div class="s">${inf ? inf.text : 'Empty meadow'}</div></div>
      ${mine ? '' : `<button class="btn sm ${inf ? 'red' : 'green'}" data-a="pick" data-v="${s}">${inf ? 'Replace' : 'Start here'}</button>`}</div>`;
  }).join('');
  modal(`<h2>New meadow with Legacy ${legacy}</h2><p class="p">Your new homestead starts fresh with <b>+${legacy * 10}%</b> crop growth and sell prices, and all your hats. Pick an empty slot (this homestead stays saved).</p>${rows}
    <div class="btns"><button class="btn" data-a="back">Not yet</button></div>`, (a, v) => {
    if (a === 'back') { closeModal(); return; }
    if (a !== 'pick') return;
    const go = () => { closeModal(); startGame(+v, true, { legacy, hats }); toast(`A new meadow! Legacy ${legacy}: +${legacy * 10}% growth and prices`, false, 'ribbon'); };
    if (readSlot(+v)) modal(`<h2>Replace Homestead ${v}?</h2><p class="p">That save will be lost.</p><div class="btns"><button class="btn" data-a="no">Cancel</button><button class="btn red" data-a="yes">Replace</button></div>`, b => { if (b === 'yes') go(); else openLegacy(); });
    else go();
  });
}
;(window.__stage = window.__stage || []).push('ui2.js loaded');
