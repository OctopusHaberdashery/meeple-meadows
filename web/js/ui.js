// Meeple Meadows — HUD, panels, menus, input handling.
'use strict';

const $ = id => document.getElementById(id);
function fmt(n) {
  n = Math.floor(n);
  if (n < 10000) return n.toLocaleString('en-US');
  if (n < 1e6) return (n / 1000).toFixed(n < 1e5 ? 1 : 0) + 'k';
  if (n < 1e9) return (n / 1e6).toFixed(2) + 'M';
  return (n / 1e9).toFixed(2) + 'B';
}
function fmtTime(s) {
  s = Math.max(0, Math.round(s));
  if (s < 60) return s + 's';
  if (s < 3600) return Math.floor(s / 60) + 'm' + (s % 60 ? ' ' + (s % 60) + 's' : '');
  return Math.floor(s / 3600) + 'h ' + Math.floor((s % 3600) / 60) + 'm';
}
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---------------------------------------------------------------- settings
const SETTINGS_KEY = 'meeple_meadows_settings';
const SET_DEFAULT = { master: 0.8, music: 0.5, sfx: 0.7, amb: 0.5, quality: 'medium', fps: 60, dayNight: true, showFps: false, uiScale: 1, autosave: 60, keepAwake: true, hints: true, lastSlot: null, costLabels: true };
let SET = Object.assign({}, SET_DEFAULT);
function loadSettings() { try { Object.assign(SET, JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')); } catch (e) { } }
function saveSettings() { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(SET)); } catch (e) { } }
function applySettings() {
  AUDIO.vol = { master: SET.master, music: SET.music, sfx: SET.sfx, amb: SET.amb }; AUDIO.applyVolume();
  document.documentElement.style.fontSize = (16 * SET.uiScale) + 'px';
  R.dayNight = SET.dayNight;
  $('fps').classList.toggle('hidden', !SET.showFps);
  if (window.AndroidBridge && AndroidBridge.keepScreenOn) AndroidBridge.keepScreenOn(!!SET.keepAwake);
}

// ---------------------------------------------------------------- state
const UI = { panel: null, mode: null, placeType: null, moving: null, sig: '', paused: false, inGame: false, lastHud: {}, toastN: 0 };
const bURL = {}, mURL = {};
function buildingURL(type) {
  if (!bURL[type]) { const s = buildingSprite(type); bURL[type] = s.c.toDataURL(); }
  return bURL[type];
}
function meepleURL(col, crop) {
  const k = col + crop;
  if (!mURL[k]) {
    const s = meepleSprite(col), c = newCanvas(64, 72), g = c.getContext('2d');
    const sc = 64 / s.w * 0.9;
    g.drawImage(s.c, 32 - s.ax * sc, 70 - s.ay * sc, s.w * sc, s.h * sc);
    if (crop !== 'founder' && ART.icons[crop]) { const ic = ART.icons[crop]; g.drawImage(ic.c, 22, 0, 20, 20); }
    mURL[k] = c.toDataURL();
  }
  return mURL[k];
}

// ---------------------------------------------------------------- toasts, popups, modals
function toast(html, bad, icon) {
  const t = document.createElement('div');
  t.className = 'toast' + (bad ? ' bad' : '');
  t.innerHTML = (icon ? iconImg(icon) : '') + '<span>' + html + '</span>';
  const box = $('toasts'); box.appendChild(t);
  while (box.children.length > 4) box.firstChild.remove();
  setTimeout(() => { t.style.transition = 'opacity .4s'; t.style.opacity = 0; setTimeout(() => t.remove(), 400); }, bad ? 1800 : 2600);
  if (bad) AUDIO.sfx('error');
}
function modal(html, onclick) {
  const m = $('modal');
  m.innerHTML = '<div class="mbox">' + html + '</div>';
  m.classList.remove('hidden');
  m.onclick = e => {
    const el = e.target.closest('[data-a]');
    if (el) { AUDIO.sfx('click'); onclick && onclick(el.dataset.a, el.dataset.v, el); }
  };
  m.oninput = null; m.onchange = null;
  return m;
}
function closeModal() { $('modal').classList.add('hidden'); $('modal').innerHTML = ''; }
function modalOpen() { return !$('modal').classList.contains('hidden'); }
function hidePop() { $('pop').classList.add('hidden'); }
function showPop(sx, sy, html, onclick) {
  const p = $('pop'); p.innerHTML = html; p.classList.remove('hidden');
  p.style.left = Math.max(100, Math.min(window.innerWidth - 100, sx)) + 'px'; p.style.top = Math.max(110, sy - 10) + 'px';
  p.onclick = e => { const el = e.target.closest('[data-a]'); if (el) onclick(el.dataset.a, el.dataset.v); };
}

// ---------------------------------------------------------------- HUD
function buildHud() {
  $('hMenu').innerHTML = iconImg('gear');
  $('hMenu').onclick = () => { AUDIO.sfx('click'); openPause(); };
  const tools = [
    ['build', 'hammer', 'Build'], ['clear', 'axe', 'Clear'], ['market', 'stall', 'Market'],
    ['storage', 'barn', 'Storage'], ['meeples', 'meeple', 'Meeples'], ['recipes', 'book', 'Recipes'],
  ];
  $('toolbar').innerHTML = tools.map(([a, ic, l]) => `<button class="btn tool" data-a="${a}">${iconImg(ic)}<span>${l}</span></button>`).join('');
  $('toolbar').onclick = e => {
    const el = e.target.closest('[data-a]'); if (!el) return;
    AUDIO.sfx('click');
    const a = el.dataset.a;
    if (a === 'clear') { setMode(UI.mode === 'clear' ? null : 'clear'); return; }
    setMode(null);
    if (UI.panel && UI.panel.type === a) closePanel(); else openPanel(a);
  };
  $('hGoal').onclick = () => { AUDIO.sfx('click'); openPanel('goals'); };
  $('hCoins').onclick = () => { AUDIO.sfx('click'); openPanel('market'); };
  $('hMeeples').onclick = () => { AUDIO.sfx('click'); openPanel('meeples'); };
  $('hSeason').onclick = () => { AUDIO.sfx('click'); openPanel('almanac'); };
}
function updateHud() {
  const L = UI.lastHud;
  const c = fmt(S.coins);
  if (L.c !== c) { $('hCoins').innerHTML = iconImg('coin') + '<span class="n">' + c + '</span>'; L.c = c; }
  const mq = S.meeples.length;
  if (L.m !== mq) { $('hMeeples').innerHTML = iconImg('meeple') + '<span class="n">' + mq + '</span>'; L.m = mq; }
  const sea = seasonIdx(), rain = S.weather && S.weather.rain > 0;
  const ss = sea + ':' + Math.ceil(seasonLeft() / 60) + ':' + rain;
  if (L.s !== ss) {
    L.s = ss;
    const SE = SEASONS[sea];
    $('hSeason').innerHTML = `<span class="semoji">${SE.icon}</span><span><b>${SE.name}</b> <small>Y${seasonYear()}</small><br><small>${rain ? '🌧 Rain · ' : ''}${fmtTime(Math.ceil(seasonLeft() / 60) * 60)} left</small></span>`;
    $('hSeason').style.background = `linear-gradient(90deg, ${SE.col}55, var(--paper) 60%)`;
  }
  const nx = S.level + 1, pr = levelProgress(nx);
  const gsig = S.level + ':' + (pr ? pr.parts.map(p => p.have).join(',') : 'x');
  if (L.g !== gsig) {
    L.g = gsig;
    let h;
    if (!pr) h = `<div class="gt">${iconImg('star')} Grand Harvest Fair complete! The meadow is yours.</div>`;
    else {
      const lv = LEVELS[nx];
      const what = lv.fair ? `${iconImg('star')} Next: <span>Grand Harvest Fair</span>` : `${iconImg(lv.crop)} Next crop: <span>${CROP[lv.crop].name}</span>`;
      h = `<div class="gt">${what}<span style="margin-left:auto" class="s">Lv ${S.level + 1}</span></div><div class="reqs">` +
        pr.parts.map(p => `<div class="req">${iconImg(p.id, 'sm')}<div class="bar ${p.have >= p.need ? '' : 'gold'}"><i style="width:${(p.have / p.need * 100).toFixed(1)}%"></i></div><span>${fmt(p.have)}/${fmt(p.need)}</span></div>`).join('') + '</div>';
    }
    $('hGoal').innerHTML = h;
  }
  // badge on build when something new is affordable-ish? keep it simple: show creator hint badge
  const mb = $('modebar');
  if (UI.mode) {
    let h = '';
    if (UI.mode === 'clear') h = `${iconImg('axe')} Tap brambles, trees or boulders beside open land`;
    else if (UI.mode === 'place') { const d = BUILDINGS[UI.placeType], cost = bCost(UI.placeType); h = `${iconImg('hammer')} Placing <b>${d.name}</b> <span class="cost ${S.coins < cost ? 'no' : ''}">${iconImg('coin', 'sm')}${fmt(cost)}</span>`; }
    else if (UI.mode === 'move') h = `${iconImg('move')} Tap where the <b>${BUILDINGS[UI.moving.type].name}</b> should go`;
    else if (UI.mode === 'remove') h = `${iconImg('trash')} Tap plots or paths to remove them`;
    h += ` <button class="btn sm green" data-a="done">Done</button>`;
    if (mb.dataset.h !== h) { mb.innerHTML = h; mb.dataset.h = h; }
    mb.classList.remove('hidden');
  } else mb.classList.add('hidden');
  updateHint();
}
$('modebar') && ($('modebar').onclick = e => { if (e.target.closest('[data-a="done"]')) { AUDIO.sfx('click'); setMode(null); } });

function setMode(m, extra) {
  UI.mode = m; R.clearMode = m === 'clear'; R.ghost = null;
  if (m === 'place') { UI.placeType = extra; closePanel(); }
  if (m === 'move') { UI.moving = extra; closePanel(); }
  if (m !== 'place') UI.placeType = null;
  if (m !== 'move') UI.moving = null;
  hidePop();
  const tb = $('toolbar').querySelector('[data-a="clear"]'); if (tb) tb.classList.toggle('on', m === 'clear');
}

// ---------------------------------------------------------------- tutorial hints
const HINTS = [
  { done: () => (S.lifetime.carrot || 0) >= 6, text: () => `Hi! I'm <b>Pip</b>. I'll plant and harvest these carrots and carry them to the storehouse. Watch them grow!` },
  { done: () => S.buildings.some(b => b.type === 'creator'), text: () => `Sell carrots at the <b>Market</b> (tap the coins) and save up <b>${fmt(BUILDINGS.creator.cost)}</b> coins to build a <b>Meeple Creator</b> from the Build menu.` },
  { done: () => S.meeples.length >= 2, text: () => `Tap the <b>Meeple Creator</b> and turn carrots into a brand-new Meeple. Each crop makes a different kind!` },
  { done: () => S.level >= 1, text: () => `Bank <b>25 carrots</b> to unlock Wheat. Use <b>Clear</b> to cut back the brambles and <b>Build</b> more garden plots.` },
  { done: () => S.buildings.some(b => b.type === 'mill'), text: () => `Wheat unlocked! Plant it in a plot (tap a plot to change its crop), then build a <b>Windmill</b> to grind flour.` },
  { done: () => S.buildings.some(b => b.type === 'well'), text: () => `Tip: build a <b>Stone Well</b> from the Build menu. Meeples will fill watering cans there, and watered crops grow 60% faster.` },
  { done: () => S.playTime > SEASON_LEN * 0.5 || S.level >= 4, text: () => `Crops only grow in their seasons. Tap a plot to plan what it grows each season — it switches over by itself. Tap the season badge for the almanac.` },
];
function updateHint() {
  const el = $('hint');
  if (!SET.hints || S.tutorial >= HINTS.length || UI.panel) { el.classList.add('hidden'); return; }
  while (S.tutorial < HINTS.length && HINTS[S.tutorial].done()) S.tutorial++;
  if (S.tutorial >= HINTS.length) { el.classList.add('hidden'); return; }
  const h = `<img class="who" src="${meepleURL('#e8b070', 'founder')}"><span class="x" data-a="x">✕</span>` + HINTS[S.tutorial].text();
  if (el.dataset.h !== h) { el.innerHTML = h; el.dataset.h = h; }
  el.classList.remove('hidden');
}
$('hint') && ($('hint').onclick = e => { if (e.target.closest('[data-a="x"]')) { S.tutorial++; } });

// ---------------------------------------------------------------- panels
const PANELS = {};
function openPanel(type, id, tab) {
  hidePop();
  UI.panel = { type, id, tab: tab || (PANELS[type].tabs ? PANELS[type].tabs[0][0] : null) };
  R.sel = type === 'plot' ? { kind: 'plot', id } : (type === 'proc' || type === 'creator' || type === 'bldg' || type === 'greenhouse') ? { kind: 'b', id } : type === 'meeple' ? { kind: 'm', id } : null;
  UI.sig = ''; $('panel').classList.remove('hidden');
  AUDIO.sfx('open');
  renderPanel(true);
}
function closePanel() {
  if (!UI.panel) return;
  UI.panel = null; R.sel = null;
  $('panel').classList.add('hidden'); $('panel').innerHTML = '';
}
function renderPanel(force) {
  if (!UI.panel) return;
  const P = PANELS[UI.panel.type];
  if (P.valid && !P.valid(UI.panel)) { closePanel(); return; }
  const sig = UI.panel.type + '|' + UI.panel.tab + '|' + (P.sig ? P.sig(UI.panel) : '');
  if (force || sig !== UI.sig) {
    UI.sig = sig;
    const el = $('panel'), sc = el.querySelector('.pb') ? el.querySelector('.pb').scrollTop : 0;
    const head = P.head(UI.panel);
    let tabs = '';
    if (P.tabs) tabs = '<div class="tabs">' + P.tabs.filter(t => !t[2] || t[2]()).map(([k, l]) => `<button class="btn sm tab ${UI.panel.tab === k ? 'on' : ''}" data-a="tab" data-v="${k}">${l}</button>`).join('') + '</div>';
    el.innerHTML = `<div class="ph">${head}<button class="btn close" data-a="close">✕</button></div>${tabs}<div class="pb">${P.body(UI.panel)}</div>`;
    if (!force) el.querySelector('.pb').scrollTop = sc;
  }
  liveUpdate();
}
function liveUpdate() {
  const el = $('panel');
  el.querySelectorAll('[data-live]').forEach(n => { const v = liveVal(n.dataset.live); if (n.textContent !== v) n.textContent = v; });
  el.querySelectorAll('[data-bar]').forEach(n => { n.style.width = (Math.max(0, Math.min(1, liveVal(n.dataset.bar))) * 100).toFixed(1) + '%'; });
}
function liveVal(k) {
  const [a, b] = k.split(':');
  switch (a) {
    case 'coins': return fmt(S.coins);
    case 'inv': return fmt(S.inv[b] || 0);
    case 'life': return fmt(S.lifetime[b] || 0);
    case 'plot': { const p = S.plots[b]; return p ? (p.st === 2 ? 1 : p.st === 0 ? 0 : p.t / CROP[p.crop].grow) : 0; }
    case 'plott': { const p = S.plots[b]; if (!p) return ''; if (p.st === 2) return 'Ripe! Waiting for a Meeple'; if (!plotInSeason(p)) return 'Dormant — ' + CROP[p.crop].name + ' grows in ' + CROP[p.crop].sea.map(x => SEASONS[x].name).join(', '); if (p.st === 0) return 'Waiting to be planted'; return (p.wet ? '💧 Moist for ' + (p.wet | 0) + ' harvest' + ((p.wet | 0) > 1 ? 's' : '') + ' · ' : (hasWell() ? 'Thirsty · ' : '')) + 'Ready in ' + fmtTime((CROP[p.crop].grow - p.t) / growMult(p)); }
    case 'bp': { const x = BMAP[b]; if (!x || !x.recipe) return 0; const r = RECIPE[x.recipe]; if (x.phase === 'work') return x.t / r.t; if (x.phase === 'done') return 1; let h = 0, n = 0; for (const q in r.in) { n += r.in[q]; h += Math.min(r.in[q], x.got[q] || 0); } return x.phase === 'gather' ? h / n : 0; }
    case 'bs': return procStatus(BMAP[b]);
    case 'got': { const [bid, item] = b.split('/'); const x = BMAP[bid]; return x ? String(x.got[item] || 0) : '0'; }
    case 'cq': { const x = BMAP[b]; return x && x.queue.length ? x.t / 20 : 0; }
    case 'mt': return meepleTask(S.meeples.find(m => m.id == b));
    case 'upc': return '';
  }
  return '';
}
function procStatus(b) {
  if (!b) return '';
  if (!b.recipe || b.phase === 'idle') return b.recipe ? 'Stopped — tap Start to run again' : 'Idle — choose a recipe below';
  const r = RECIPE[b.recipe];
  if (b.phase === 'gather') {
    const miss = Object.keys(r.in).filter(k => (b.got[k] || 0) < r.in[k] && !((S.inv[k] || 0) > 0) && !((b.transit[k] || 0) > 0));
    if (miss.length) return 'Waiting for ' + miss.map(k => ITEM[k].name).join(', ') + ' in storage';
    if (!S.meeples.some(m => m.haul)) return 'No Meeples are set to haul!';
    return 'Meeples are bringing ingredients…';
  }
  if (b.phase === 'work') return 'Working… ' + fmtTime((r.t - b.t) / craftMult()) + ' left';
  if (b.phase === 'done') return 'Finished! Waiting for pickup';
  return '';
}
function meepleTask(m) {
  if (!m) return '';
  const t = m.task;
  if (!t) return m.hand.length ? 'Heading to storage' : 'Taking a breather';
  switch (t.type) {
    case 'harvest': return 'Harvesting ' + (S.plots[t.plot] ? CROP[S.plots[t.plot].crop].name.toLowerCase() : '');
    case 'plant': return 'Planting ' + (S.plots[t.plot] ? CROP[S.plots[t.plot].crop].name.toLowerCase() : '');
    case 'deliver': return 'Carrying ' + m.hand.length + ' to storage';
    case 'collect': return 'Collecting from ' + (BMAP[t.b] ? BUILDINGS[BMAP[t.b].type].name : '');
    case 'supply': return (t.step === 'tob' ? 'Bringing ' : 'Fetching ') + t.n + ' ' + ITEM[t.item].name.toLowerCase() + ' for ' + (BMAP[t.b] ? BUILDINGS[BMAP[t.b].type].name : '');
    case 'wander': return 'Wandering';
    case 'fill': return 'Filling a watering can at the well';
    case 'water': return 'Watering crops (' + m.can + ' left in can)';
  }
  return '';
}
const costHtml = c => `<span class="cost ${S.coins < c ? 'no' : ''}">${iconImg('coin', 'sm')}${fmt(c)}</span>`;
const lvName = L => LEVELS[L].crop ? CROP[LEVELS[L].crop].name : 'the Fair';

// --- build
PANELS.build = {
  tabs: [['farm', 'Farm'], ['craft', 'Crafting'], ['core', 'Homestead'], ['decor', 'Decor']],
  head: () => `${iconImg('hammer', 'lg')}<h2>Build<small>Place new things on cleared land</small></h2>`,
  sig: p => S.level + ':' + Object.keys(BUILDINGS).map(t => (S.coins >= bCost(t) ? 1 : 0) + '' + bCount(t)).join(''),
  body: p => {
    let h = '';
    for (const t in BUILDINGS) {
      const d = BUILDINGS[t]; if (d.cat !== p.tab || t === 'market') continue;
      const locked = !bUnlocked(t), cost = bCost(t), cnt = t === 'plot' ? Object.keys(S.plots).length : bCount(t), full = d.max && cnt >= d.max;
      const img = (t === 'plot' || t === 'path') ? iconImg(t === 'plot' ? 'soil' : 'move', 'xl') : `<img class="bimg" src="${buildingURL(t)}">`;
      h += `<div class="card ${locked ? 'locked' : ''}"><div class="row">${img}<div class="grow"><div class="t">${d.name}</div><div class="s">${d.desc}</div>
        <div class="row" style="margin-top:.3rem">${locked ? `<span class="s">🔒 Unlocks with ${lvName(d.lvl)} (level ${d.lvl + 1})</span>` :
          `${costHtml(cost)}<span class="s">${d.max ? `${cnt}/${d.max} built` : (cnt ? cnt + ' built' : '')}</span><span class="grow"></span>
          <button class="btn sm green ${full || S.coins < cost ? 'dis' : ''}" data-a="build" data-v="${t}">${full ? 'Max' : 'Place'}</button>`}</div></div></div></div>`;
    }
    if (p.tab === 'farm') h += `<button class="btn wide" data-a="remove">${iconImg('trash')} Remove plots or paths</button>`;
    return h;
  },
};
// --- plot
const seaDots = c => '<span class="sdots">' + SEASONS.map((S2, i) => `<i style="background:${CROP[c].sea.includes(i) ? S2.col : 'transparent'}"></i>`).join('') + '</span>';
PANELS.plot = {
  valid: p => !!S.plots[p.id],
  head: p => { const pl = S.plots[p.id]; return `${iconImg(pl.crop, 'lg')}<h2>${pl.gh ? 'Greenhouse Plot' : 'Garden Plot'}<small>Growing ${CROP[pl.crop].name}</small></h2>`; },
  sig: p => { const pl = S.plots[p.id]; return pl.crop + pl.st + S.level + JSON.stringify(pl.plan) + (p.sea ?? '') + seasonIdx(); },
  body: p => {
    const pl = S.plots[p.id], cr = CROP[pl.crop], now = seasonIdx();
    if (p.sea == null) p.sea = now;
    let h = `<div class="card"><div class="row">${iconImg(pl.crop, 'xl')}<div class="grow"><div class="t">${cr.name} ${seaDots(pl.crop)}</div><div class="s" data-live="plott:${p.id}"></div>
      <div class="bar big" style="margin-top:.3rem"><i data-bar="plot:${p.id}"></i></div>${pl.bonus > 1 ? `<div class="s">+${Math.round((pl.bonus - 1) * 100)}% growth from nearby scarecrows</div>` : ''}</div></div></div>`;
    if (!pl.gh) {
      h += `<div class="sec">Plan by season</div><div class="seatabs">` + SEASONS.map((S2, i) => `<button class="btn sm ${p.sea === i ? 'on' : ''}" data-a="ptab" data-v="${i}">${S2.icon} ${S2.name}${i === now ? ' <small>(now)</small>' : ''}<span class="ptab-ic">${(pl.plan && pl.plan[i]) || (i === now ? pl.crop : null) ? iconImg((pl.plan && pl.plan[i]) || pl.crop, 'sm') : '—'}</span></button>`).join('') + `</div>`;
    } else h += `<div class="sec">Choose a crop — any season works under glass</div>`;
    const selected = pl.gh ? pl.crop : (pl.plan && pl.plan[p.sea]) || (p.sea === now ? pl.crop : null);
    h += `<div class="grid">`;
    for (let L = 0; L < LEVELS.length; L++) {
      const c = LEVELS[L].crop; if (!c) continue;
      const lock = L > S.level, off = !pl.gh && !CROP[c].sea.includes(p.sea);
      h += `<div class="cell ${selected === c ? 'sel' : ''} ${lock ? 'locked' : ''} ${off && !lock ? 'off' : ''}" ${lock ? '' : `data-a="crop" data-v="${c}"`}>${lock ? '<div style="font-size:1.6rem;height:2.3rem">🔒</div>' : iconImg(c)}${lock ? 'Lv ' + (L + 1) : CROP[c].name}<div class="s">${lock ? '' : fmtTime(CROP[c].grow)}</div>${lock ? '' : seaDots(c)}</div>`;
    }
    h += `</div><div class="sec">Quick actions</div><div class="row wrap">`;
    if (pl.gh) h += `<button class="btn sm" data-a="ghall">${iconImg(pl.crop, 'sm')} Plant ${cr.name} in this whole greenhouse</button>`;
    else h += `<button class="btn sm" data-a="cropall">${iconImg('scroll', 'sm')} Copy this plot's plan to ALL plots</button>
      <button class="btn sm" data-a="cropempty">${iconImg('scroll', 'sm')} …to connected plots</button>
      <button class="btn sm red" data-a="rmplot">${iconImg('trash', 'sm')} Remove plot</button>`;
    h += `</div><p class="s">Sells for ${iconImg('coin', 'sm')}${sellPrice(pl.crop)} each · Changing the current crop restarts the plot. Faded crops won't grow in the chosen season.</p>`;
    return h;
  },
};
// --- greenhouse
PANELS.greenhouse = {
  valid: p => !!BMAP[p.id],
  head: () => `${iconImg('glasshouse', 'lg')}<h2>Greenhouse<small>Grows anything, any season</small></h2>`,
  sig: p => S.level,
  body: p => {
    let h = `<p class="p">The roof is lifted — tap any plot inside to choose its crop, or plant one crop everywhere:</p><div class="grid">`;
    for (let L = 0; L <= S.level && L < LEVELS.length; L++) { const c = LEVELS[L].crop; if (c) h += `<div class="cell" data-a="ghcrop" data-v="${c}">${iconImg(c)}${CROP[c].name}<div class="s">${fmtTime(CROP[c].grow)}</div></div>`; }
    h += `</div><div class="sec">Building</div><button class="btn sm red" data-a="demolish">${iconImg('trash', 'sm')} Demolish</button><p class="s">Greenhouse plots aren't watered by rain, so a nearby well helps.</p>`;
    return h;
  },
};
// --- almanac
PANELS.almanac = {
  head: () => `<span style="font-size:2rem">${SEASONS[seasonIdx()].icon}</span><h2>Almanac<small>Year ${seasonYear()} · ${SEASONS[seasonIdx()].name} · ${fmtTime(seasonLeft())} left</small></h2>`,
  sig: () => S.level + ':' + seasonIdx(),
  body: () => {
    let h = `<p class="s">Each season lasts 2 hours of play. Out-of-season crops rest (they don't die) and wake up when their season returns. Greenhouses ignore seasons.</p>`;
    SEASONS.forEach((S2, i) => {
      const cs = CROPS.filter(c => c.sea.includes(i));
      h += `<div class="card ${i === seasonIdx() ? 'sel' : ''}"><div class="t">${S2.icon} ${S2.name}${i === seasonIdx() ? ' — now' : ''}</div><div class="row wrap" style="margin-top:.2rem">` +
        cs.map(c => cropUnlocked(c.id) ? `<span class="chip">${iconImg(c.id, 'sm')}${c.name}</span>` : `<span class="chip" style="opacity:.45">🔒</span>`).join('') + `</div></div>`;
    });
    return h;
  },
};
// --- processors
PANELS.proc = {
  valid: p => !!BMAP[p.id],
  head: p => { const b = BMAP[p.id]; return `<img class="bimg" style="width:2.8rem;height:2.8rem" src="${buildingURL(b.type)}"><h2>${BUILDINGS[b.type].name}<small>${BUILDINGS[b.type].desc}</small></h2>`; },
  sig: p => {
    const b = BMAP[p.id];
    const rs = RECIPES.filter(r => r.at === b.type && recipeUnlocked(r));
    return [b.recipe, b.phase, b.repeat, S.level, rs.map(r => Object.keys(r.in).map(k => (S.inv[k] || 0) >= r.in[k] ? 1 : 0).join('')).join('')].join('/');
  },
  body: p => {
    const b = BMAP[p.id];
    let h = '';
    if (b.recipe) {
      const r = RECIPE[b.recipe];
      h += `<div class="card sel"><div class="row">${iconImg(r.out[0], 'xl')}<div class="grow"><div class="t">${ITEM[r.out[0]].name}${r.out[1] > 1 ? ' ×' + r.out[1] : ''}</div>
        <div class="s" data-live="bs:${b.id}"></div><div class="bar big" style="margin-top:.3rem"><i data-bar="bp:${b.id}"></i></div>
        <div style="margin-top:.3rem">${Object.keys(r.in).map(k => `<span class="chip">${iconImg(k, 'sm')}<span data-live="got:${b.id}/${k}"></span>/${r.in[k]}</span>`).join('')}</div></div></div>
        <div class="row" style="margin-top:.45rem;gap:.4rem">
          <div class="toggle"><button class="${b.repeat ? 'on' : ''}" data-a="repeat" data-v="1">Repeat</button><button class="${!b.repeat ? 'on' : ''}" data-a="repeat" data-v="0">Once</button></div>
          <span class="grow"></span>${b.phase === 'idle' ? `<button class="btn sm green" data-a="recipe" data-v="${b.recipe}">Start</button>` : `<button class="btn sm red" data-a="stop">Stop</button>`}</div></div>`;
    }
    h += `<div class="sec">Recipes</div>`;
    const rs = RECIPES.filter(r => r.at === b.type);
    for (const r of rs) {
      const lock = !recipeUnlocked(r);
      if (lock) { h += `<div class="card locked"><div class="row"><div style="font-size:1.6rem">🔒</div><div class="grow"><div class="t">???</div><div class="s">Discovered at level ${r.lvl + 1} (${lvName(r.lvl)})</div></div></div></div>`; continue; }
      const val = sellPrice(r.out[0]) * r.out[1], inVal = Object.keys(r.in).reduce((a, k) => a + sellPrice(k) * r.in[k], 0);
      h += `<div class="card ${b.recipe === r.id ? 'sel' : ''}"><div class="row wrap">${Object.keys(r.in).map(k => `<span class="chip ${(S.inv[k] || 0) >= r.in[k] ? 'ok' : 'bad'}">${iconImg(k, 'sm')}${r.in[k]}</span>`).join('')}
        <span class="arrow">➜</span>${iconImg(r.out[0])}<b>${ITEM[r.out[0]].name}${r.out[1] > 1 ? ' ×' + r.out[1] : ''}</b></div>
        <div class="row" style="margin-top:.25rem"><span class="s">⏱ ${fmtTime(r.t / craftMult())} · worth ${iconImg('coin', 'sm')}${fmt(val)} <span style="opacity:.7">(ingredients ${fmt(inVal)})</span></span><span class="grow"></span>
        ${b.recipe === r.id ? '<span class="s"><b>Selected</b></span>' : `<button class="btn sm green" data-a="recipe" data-v="${r.id}">Make</button>`}</div></div>`;
    }
    h += `<div class="sec">Building</div><div class="row"><button class="btn sm" data-a="move">${iconImg('move', 'sm')} Move</button><button class="btn sm red" data-a="demolish">${iconImg('trash', 'sm')} Demolish</button></div>`;
    return h;
  },
};
// --- creator
PANELS.creator = {
  valid: p => !!BMAP[p.id],
  head: () => `<img class="bimg" style="width:2.8rem;height:2.8rem" src="${buildingURL('creator')}"><h2>Meeple Creator<small>Turn produce into helpers</small></h2>`,
  sig: p => { const b = BMAP[p.id]; return S.level + ':' + b.queue.join(',') + ':' + S.meeples.length + ':' + CROPS.map(c => (S.inv[c.id] || 0) >= meepleCost(c.id) ? 1 : 0).join(''); },
  body: p => {
    const b = BMAP[p.id];
    let h = `<div class="card"><div class="row"><div class="grow"><div class="t">Meeples: ${S.meeples.length} / ${MEEPLE_MAX}</div>`;
    if (b.queue.length) h += `<div class="s">Creating a ${CROP[b.queue[0]].name} Meeple…</div><div class="bar big" style="margin-top:.3rem"><i data-bar="cq:${b.id}"></i></div><div style="margin-top:.3rem">${b.queue.map(c => iconImg(c)).join('')}</div>`;
    else h += `<div class="s">Pick a crop below. Meeples take 20 seconds to come to life.</div>`;
    h += `</div></div></div><div class="sec">Recipes for Meeples</div>`;
    for (let L = 0; L < LEVELS.length; L++) {
      const c = LEVELS[L].crop; if (!c) continue;
      const cr = CROP[c], ms = cr.meeple, lock = L > S.level, cost = meepleCost(c), have = S.inv[c] || 0;
      if (lock) { h += `<div class="card locked"><div class="row"><div style="font-size:1.6rem">🔒</div><div class="grow"><div class="t">??? Meeple</div><div class="s">Unlocks at level ${L + 1}</div></div></div></div>`; continue; }
      const sb = (lbl, v, mx) => `<div class="stat"><b>${lbl}</b><div class="statbar"><i style="width:${Math.min(100, v / mx * 100)}%"></i></div><span>${v}</span></div>`;
      h += `<div class="card"><div class="row"><img src="${meepleURL(ms.col, c)}" style="width:3.4rem;height:3.8rem"><div class="grow"><div class="t">${cr.name} Meeple <span class="s">· ${ms.trait}</span></div>
        ${sb('Speed', ms.speed, 3.6)}${sb('Carry', ms.carry, 12)}${sb('Hands', ms.work, 1.8)}
        <div class="row" style="margin-top:.25rem"><span class="chip ${have >= cost ? 'ok' : 'bad'}">${iconImg(c, 'sm')}${fmt(have)} / ${cost}</span><span class="grow"></span>
        <button class="btn sm green ${have < cost || b.queue.length >= 5 || S.meeples.length + b.queue.length >= MEEPLE_MAX ? 'dis' : ''}" data-a="mk" data-v="${c}">Create</button></div></div></div></div>`;
    }
    h += `<p class="s">Each new Meeple costs a bit more produce than the last.</p>`;
    return h;
  },
};
// --- generic building (storehouse, well, decor)
PANELS.bldg = {
  valid: p => !!BMAP[p.id],
  head: p => { const b = BMAP[p.id]; return `<img class="bimg" style="width:2.8rem;height:2.8rem" src="${buildingURL(b.type)}"><h2>${BUILDINGS[b.type].name}</h2>`; },
  sig: p => '',
  body: p => {
    const b = BMAP[p.id], d = BUILDINGS[b.type];
    let h = `<p class="p">${d.desc}</p>`;
    if (b.type === 'storehouse') h += `<button class="btn" data-a="open" data-v="storage">${iconImg('barn')} View storage</button> `;
    if (b.type === 'market') h += `<button class="btn" data-a="open" data-v="market">${iconImg('stall')} Open market</button> `;
    h += `<div class="sec">Building</div><div class="row"><button class="btn sm" data-a="move">${iconImg('move', 'sm')} Move</button>${b.type !== 'market' ? `<button class="btn sm red" data-a="demolish">${iconImg('trash', 'sm')} Demolish</button>` : ''}</div>`;
    return h;
  },
};
// --- market
const AUTO_STEPS = [null, 0, 10, 25, 50, 100, 250];
PANELS.market = {
  tabs: [['sell', 'Sell'], ['upg', 'Upgrades']],
  head: () => `${iconImg('stall', 'lg')}<h2>Market<small>${iconImg('coin', 'sm')}<span data-live="coins"></span> coins</small></h2>`,
  sig: p => p.tab === 'sell' ? Object.keys(S.inv).filter(k => S.inv[k] > 0 || S.auto[k] != null).join(',') + JSON.stringify(S.auto) + upg('haggle')
    : UPGRADES.map(u => upg(u.id) + (S.coins >= upgCost(u) ? 'y' : 'n')).join('') + S.level,
  body: p => {
    let h = '';
    if (p.tab === 'sell') {
      const ids = Object.keys(ITEM).filter(k => (S.inv[k] || 0) > 0 || S.auto[k] != null);
      if (!ids.length) return `<p class="p">Nothing to sell yet. Your Meeples will fill the storehouse soon!</p>`;
      h += `<p class="s">Auto-sell keeps a reserve and sells the rest every few seconds — handy while you're busy. Crafting buildings take from storage too, so keep enough for recipes.</p>`;
      for (const k of ids) {
        const a = S.auto[k];
        h += `<div class="card"><div class="row">${iconImg(k, 'lg')}<div class="grow"><div class="t">${ITEM[k].name}</div><div class="s">${iconImg('coin', 'sm')}${fmt(sellPrice(k))} each · have <b data-live="inv:${k}"></b></div></div>
          <button class="btn sm" data-a="sell" data-v="${k}:1">1</button><button class="btn sm" data-a="sell" data-v="${k}:10">10</button><button class="btn sm gold" data-a="sell" data-v="${k}:all">All</button></div>
          <div class="row" style="margin-top:.3rem"><span class="s">Auto-sell:</span><button class="btn sm ${a != null ? 'on' : ''}" data-a="auto" data-v="${k}">${a == null ? 'Off' : 'Keep ' + a}</button></div></div>`;
      }
    } else {
      for (const u of UPGRADES) {
        if (u.lvl && S.level < u.lvl) continue;
        const lv = upg(u.id), max = lv >= u.max, c = upgCost(u);
        h += `<div class="card"><div class="row">${iconImg('ui_' + u.icon, 'lg')}<div class="grow"><div class="t">${u.name} <span class="s">${'●'.repeat(lv)}${'○'.repeat(u.max - lv)}</span></div><div class="s">${u.desc}</div></div>
          ${max ? '<b class="s">MAX</b>' : `<button class="btn sm green ${S.coins < c ? 'dis' : ''}" data-a="upg" data-v="${u.id}">${iconImg('coin', 'sm')}${fmt(c)}</button>`}</div></div>`;
      }
    }
    return h;
  },
};
// --- storage
PANELS.storage = {
  head: () => `${iconImg('barn', 'lg')}<h2>Storage<small>Everything your Meeples have banked</small></h2>`,
  sig: () => Object.keys(S.inv).filter(k => S.inv[k] > 0).join(','),
  body: () => {
    const ids = Object.keys(ITEM).filter(k => (S.inv[k] || 0) > 0);
    let h = ids.length ? '<div class="grid">' + ids.map(k => `<div class="cell" data-a="open" data-v="market">${iconImg(k)}<span class="q" data-live="inv:${k}"></span>${ITEM[k].name}</div>`).join('') + '</div>' : '<p class="p">Storage is empty.</p>';
    const life = Object.keys(ITEM).filter(k => S.lifetime[k]);
    if (life.length) h += `<div class="sec">Lifetime banked</div><div class="row wrap">` + life.map(k => `<span class="chip">${iconImg(k, 'sm')}<span data-live="life:${k}"></span></span>`).join('') + '</div>';
    h += `<div class="sec">Homestead</div><p class="s">Played ${fmtTime(S.playTime)} · Earned ${fmt(S.stats.earned)} coins · Cleared ${S.stats.cleared} tiles · Crafted ${fmt(S.stats.crafted)} goods</p>`;
    return h;
  },
};
// --- meeples list
PANELS.meeples = {
  head: () => `${iconImg('meeple', 'lg')}<h2>Meeples<small>${S.meeples.length} of ${MEEPLE_MAX}</small></h2>`,
  sig: () => S.meeples.map(m => m.id + (m.farm ? 'f' : '') + (m.haul ? 'h' : '') + (m.water !== false ? 'w' : '') + m.name).join(',') + upg('boots') + upg('basket'),
  body: () => {
    const cr = S.buildings.find(b => b.type === 'creator');
    let h = cr ? `<button class="btn wide green" data-a="opencreator" style="margin-bottom:.6rem">${iconImg('meeple')} Create a Meeple</button>` : `<p class="s">Build a <b>Meeple Creator</b> to make more Meeples.</p>`;
    h += `<p class="s"><b>Farm</b> = plant & harvest. <b>Water</b> = fill cans at a well and water crops. <b>Haul</b> = carry ingredients to and from crafting buildings.</p>`;
    for (const m of S.meeples) {
      h += `<div class="card"><div class="row"><img src="${meepleURL(m.col, m.crop)}" style="width:2.8rem;height:3.1rem"><div class="grow"><div class="t">${esc(m.name)} <span class="s">· ${m.trait}</span></div>
        <div class="s">🏃 ${mSpeed(m).toFixed(1)} · 🧺 ${mCarry(m)} · ✋ ${mWork(m).toFixed(1)}</div><div class="s" data-live="mt:${m.id}"></div></div>
        <div style="display:flex;flex-direction:column;gap:.25rem;align-items:flex-end"><div class="toggle"><button class="${m.farm ? 'on' : ''}" data-a="mfarm" data-v="${m.id}">Farm</button><button class="${m.water !== false ? 'on' : ''}" data-a="mwater" data-v="${m.id}">Water</button><button class="${m.haul ? 'on' : ''}" data-a="mhaul" data-v="${m.id}">Haul</button></div>
        <button class="btn sm" data-a="mfind" data-v="${m.id}">Find</button></div></div></div>`;
    }
    return h;
  },
};
// --- single meeple
PANELS.meeple = {
  valid: p => S.meeples.some(m => m.id === p.id),
  head: p => { const m = S.meeples.find(x => x.id === p.id); return `<img src="${meepleURL(m.col, m.crop)}" style="width:2.6rem;height:2.9rem"><h2>${esc(m.name)}<small>${m.crop === 'founder' ? 'The founding Meeple' : CROP[m.crop].name + ' Meeple'} · ${m.trait}</small></h2>`; },
  sig: p => { const m = S.meeples.find(x => x.id === p.id); return m.name + m.farm + m.haul + m.water + upg('boots') + upg('basket') + upg('hands'); },
  body: p => {
    const m = S.meeples.find(x => x.id === p.id);
    const sb = (lbl, v, mx) => `<div class="stat"><b>${lbl}</b><div class="statbar"><i style="width:${Math.min(100, v / mx * 100)}%"></i></div><span>${v}</span></div>`;
    return `<div class="card"><div class="row"><img src="${meepleURL(m.col, m.crop)}" style="width:4.6rem;height:5.2rem"><div class="grow">
      ${sb('Speed', +mSpeed(m).toFixed(2), 5)}${sb('Carry', mCarry(m), 18)}${sb('Hands', +mWork(m).toFixed(2), 3)}
      <div class="s" style="margin-top:.3rem">Now: <b data-live="mt:${m.id}"></b></div></div></div></div>
      <div class="sec">Jobs</div><div class="row"><div class="toggle"><button class="${m.farm ? 'on' : ''}" data-a="mfarm" data-v="${m.id}">Farm</button><button class="${m.water !== false ? 'on' : ''}" data-a="mwater" data-v="${m.id}">Water</button><button class="${m.haul ? 'on' : ''}" data-a="mhaul" data-v="${m.id}">Haul</button></div>
      <span class="grow"></span><button class="btn sm" data-a="mrename" data-v="${m.id}">Rename</button></div>
      <p class="s">Stats come from the crop a Meeple was made from, with a little natural variety.</p>`;
  },
};
// --- recipes & chains
const CHAINS = [
  { name: 'Garlic Bread', steps: [['wheat'], ['flour', 'mill'], ['garlicbread', 'pot', ['garlic']]] },
  { name: 'Jams & Jellies', steps: [['sugarbeet'], ['sugar', 'mill'], ['jam', 'kettle', ['strawberry']]] },
  { name: 'Kimchi', steps: [['cabbage'], ['kimchi', 'crock', ['chili', 'garlic']]] },
  { name: 'Beer', steps: [['barley'], ['malt', 'mill'], ['wort', 'pot', ['hops']], ['beer', 'barrel']] },
  { name: 'Whiskey', steps: [['corn'], ['cornmeal', 'mill'], ['grainmash', 'pot', ['malt']], ['whitedog', 'still'], ['whiskey', 'barrel']] },
  { name: 'Vodka & Gin', steps: [['potato'], ['mash', 'pot'], ['vodka', 'still'], ['gin', 'still', ['juniper']]] },
  { name: 'Brandy', steps: [['grapes'], ['wine', 'barrel'], ['brandy', 'still']] },
  { name: 'Applejack', steps: [['apple'], ['cider', 'barrel'], ['applejack', 'still']] },
  { name: 'Pizza', steps: [['tomato'], ['tomatosauce', 'pot', ['garlic']], ['pizza', 'oven', ['flour']]] },
  { name: 'Patchwork Quilt', steps: [['cotton'], ['cloth', 'loom'], ['quilt', 'loom', ['linen']]] },
  { name: 'Lavender Oil', steps: [['lavender'], ['driedlavender', 'dryer'], ['lavenderoil', 'press', ['sunoil']]] },
  { name: 'Rice Soju', steps: [['rice'], ['sake', 'barrel'], ['soju', 'still']] },
  { name: 'Peach Schnapps', steps: [['peach'], ['peachnectar', 'juicer', ['sugar']], ['schnapps', 'still']] },
  { name: 'Chocolate Cake', steps: [['cocoa'], ['cocoanibs', 'dryer'], ['chocolate', 'pot', ['sugar']], ['cake', 'oven', ['flour']]] },
];
PANELS.recipes = {
  tabs: [['chains', 'Chains'], ['mill', 'Mill'], ['pot', 'Big Pot'], ['crock', 'Crock'], ['oven', 'Oven'], ['kettle', 'Kettle'], ['dryer', 'Dryer'], ['juicer', 'Juicer'], ['barrel', 'Barrel'], ['press', 'Oil Press'], ['loom', 'Loom'], ['teahouse', 'Tea House'], ['still', 'Still']],
  head: () => `${iconImg('book', 'lg')}<h2>Recipe Book<small>How ingredients become treasures</small></h2>`,
  sig: () => S.level,
  body: p => {
    const known = id => { const r = RECIPES.find(x => x.out[0] === id); return CROP[id] ? cropUnlocked(id) : (r ? recipeUnlocked(r) : false); };
    if (p.tab === 'chains') {
      return `<p class="s">Long chains turn cheap crops into very valuable goods. ??? marks things you haven't discovered yet.</p>` + CHAINS.map(ch => `<div class="card"><div class="t">${ch.name}</div><div class="chain">` +
        ch.steps.map(([id, via, extra], i) => (i ? `<span class="via"><span>➜</span>${BUILDINGS[via].name}${extra ? '<span>+ ' + extra.map(e => known(e) ? iconImg(e, 'sm') : '?').join('') + '</span>' : ''}</span>` : '') +
          `<span class="st">${known(id) ? iconImg(id) : '<span style="font-size:1.3rem">❔</span>'}<span>${known(id) ? ITEM[id].name : '???'}</span></span>`).join('') + '</div></div>').join('');
    }
    let h = `<p class="s">${BUILDINGS[p.tab].desc}${bUnlocked(p.tab) ? '' : ` <b>Unlocks at level ${BUILDINGS[p.tab].lvl + 1}.</b>`}</p>`;
    for (const r of RECIPES.filter(x => x.at === p.tab)) {
      if (!recipeUnlocked(r)) { h += `<div class="card locked"><div class="t">??? <span class="s">— level ${r.lvl + 1}</span></div></div>`; continue; }
      h += `<div class="card"><div class="row wrap">${Object.keys(r.in).map(k => `<span class="chip">${iconImg(k, 'sm')}${r.in[k]}</span>`).join('')}<span class="arrow">➜</span>${iconImg(r.out[0])}<b>${ITEM[r.out[0]].name}${r.out[1] > 1 ? ' ×' + r.out[1] : ''}</b></div>
        <div class="s">⏱ ${fmtTime(r.t / craftMult())} · sells for ${iconImg('coin', 'sm')}${fmt(sellPrice(r.out[0]))} each</div></div>`;
    }
    return h;
  },
};
// --- goals
PANELS.goals = {
  head: () => `${iconImg('scroll', 'lg')}<h2>Homestead Goals<small>Bank produce to unlock new crops</small></h2>`,
  sig: () => S.level + ':' + (levelProgress(S.level + 1) || { parts: [] }).parts.map(p => p.have).join(','),
  body: () => {
    let h = `<p class="s">Everything your Meeples carry into storage — harvested or crafted — counts toward goals. Selling doesn't take it back!</p>`;
    for (let L = 1; L < LEVELS.length; L++) {
      const lv = LEVELS[L], done = L <= S.level, cur = L === S.level + 1, pr = levelProgress(L);
      const title = lv.fair ? 'Grand Harvest Fair' : CROP[lv.crop].name;
      const newB = Object.keys(BUILDINGS).filter(t => BUILDINGS[t].lvl === L).map(t => BUILDINGS[t].name);
      h += `<div class="card ${done ? 'sel' : ''} ${!done && !cur ? 'locked' : ''}"><div class="row">${lv.fair ? iconImg('star', 'lg') : iconImg(lv.crop, 'lg')}<div class="grow"><div class="t">Level ${L + 1}: ${title} ${done ? '✓' : ''}</div>
        ${newB.length ? `<div class="s">Also unlocks: ${newB.join(', ')}</div>` : ''}</div></div>` +
        (done ? '' : '<div style="margin-top:.3rem">' + pr.parts.map(p => `<div class="req" style="margin:.15rem 0">${iconImg(p.id, 'sm')}<span style="width:6.5rem">${ITEM[p.id].name}</span><div class="bar ${p.have >= p.need ? '' : 'gold'}"><i style="width:${(p.have / p.need * 100).toFixed(1)}%"></i></div><span style="width:5.5rem;text-align:right">${fmt(p.have)}/${fmt(p.need)}</span></div>`).join('') + '</div>') + '</div>';
    }
    return h;
  },
};

// panel actions
$('panel').addEventListener('click', e => {
  const el = e.target.closest('[data-a]'); if (!el || !UI.panel) return;
  if (el.classList.contains('dis')) { AUDIO.sfx('error'); return; }
  const a = el.dataset.a, v = el.dataset.v, P = UI.panel;
  AUDIO.sfx('click');
  switch (a) {
    case 'close': closePanel(); AUDIO.sfx('close'); return;
    case 'tab': P.tab = v; renderPanel(true); return;
    case 'open': openPanel(v); return;
    case 'opencreator': { const cr = S.buildings.find(b => b.type === 'creator'); if (cr) openPanel('creator', cr.id); return; }
    case 'build': setMode('place', v); toast(`Tap on cleared land to place your ${BUILDINGS[v].name}`, false, 'hammer'); return;
    case 'remove': setMode('remove'); closePanel(); return;
    case 'ptab': P.sea = +v; break;
    case 'crop': setPlotCrop(P.id, v, false, S.plots[P.id].gh ? undefined : P.sea); break;
    case 'ghall': case 'ghcrop': {
      const gid = a === 'ghcrop' ? P.id : S.plots[P.id].gh, c = a === 'ghcrop' ? v : S.plots[P.id].crop;
      for (const k in S.plots) if (S.plots[k].gh === gid) setPlotCrop(+k, c);
      toast('Greenhouse now grows ' + CROP[c].name, false, c); break;
    }
    case 'cropall': {
      const src = S.plots[P.id], plan = Object.assign({}, src.plan, { [seasonIdx()]: src.crop });
      for (const k in S.plots) { const q = S.plots[k]; if (q.gh) continue; for (const sk in plan) setPlotCrop(+k, plan[sk], false, +sk); }
      toast("Every outdoor plot now follows this plot's seasonal plan", false, 'scroll'); break;
    }
    case 'cropempty': {
      const src = S.plots[P.id], plan = Object.assign({}, src.plan, { [seasonIdx()]: src.crop });
      // flood through connected plots
      const seen = new Set([P.id]), q = [P.id];
      while (q.length) { const i = q.pop(), x = i % MW, y = (i / MW) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const n = idx(x + dx, y + dy); if (inMap(x + dx, y + dy) && S.plots[n] && !S.plots[n].gh && !seen.has(n)) { seen.add(n); q.push(n); } } }
      seen.forEach(i => { for (const sk in plan) setPlotCrop(i, plan[sk], false, +sk); }); toast(seen.size + ' connected plots now follow this plan', false, 'scroll'); break;
    }
    case 'rmplot': removeFloor(P.id); closePanel(); return;
    case 'recipe': setRecipe(BMAP[P.id], v); AUDIO.sfx('buy'); break;
    case 'stop': cancelRecipe(BMAP[P.id]); break;
    case 'repeat': BMAP[P.id].repeat = v === '1'; break;
    case 'move': setMode('move', BMAP[P.id]); return;
    case 'demolish': {
      const b = BMAP[P.id];
      modal(`<h2>Demolish ${BUILDINGS[b.type].name}?</h2><p class="p">You'll get a little salvage back. Anything inside is returned to storage.</p><div class="btns"><button class="btn" data-a="no">Keep it</button><button class="btn red" data-a="yes">Demolish</button></div>`,
        act => { closeModal(); if (act === 'yes') { if (demolish(b)) { closePanel(); toast('Demolished'); } else toast("Can't demolish your last storehouse", true); } });
      return;
    }
    case 'mk': if (queueMeeple(v)) { toast('A ' + CROP[v].name + ' Meeple is on the way!', false, v); AUDIO.sfx('buy'); } else toast('Not enough ' + CROP[v].name, true); break;
    case 'sell': { const [id, n] = v.split(':'); const got = sell(id, n === 'all' ? 1e12 : +n); if (got) { AUDIO.sfx('coin'); } break; }
    case 'auto': { const cur = S.auto[v] ?? null, i = AUTO_STEPS.indexOf(cur), nx = AUTO_STEPS[(i + 1) % AUTO_STEPS.length]; if (nx == null) delete S.auto[v]; else S.auto[v] = nx; break; }
    case 'upg': { const u = UPGRADES.find(x => x.id === v); if (buyUpgrade(u)) { toast(u.name + ' upgraded!', false, 'ui_' + u.icon); AUDIO.sfx('buy'); } break; }
    case 'mfarm': case 'mhaul': case 'mwater': {
      const m = S.meeples.find(x => x.id == v), key = { mfarm: 'farm', mhaul: 'haul', mwater: 'water' }[a];
      m[key] = m[key] === false ? true : !m[key];
      if (!m.farm && !m.haul && m.water === false) m.farm = true;
      dropTask(m); break;
    }
    case 'mfind': { const m = S.meeples.find(x => x.id == v); R.cam.x = m.x; R.cam.y = m.y; openPanel('meeple', m.id); return; }
    case 'mrename': { const m = S.meeples.find(x => x.id == v); const n = prompt('Name your Meeple', m.name); if (n && n.trim()) m.name = n.trim().slice(0, 16); break; }
  }
  renderPanel(true);
});

// ---------------------------------------------------------------- world taps
function tileAt(wx, wy) { const x = Math.floor(wx / T), y = Math.floor(wy / T); return inMap(x, y) ? { x, y, i: idx(x, y) } : null; }
function onWorldTap(sx, sy) {
  hidePop();
  const w = R.screenToWorld(sx, sy), t = tileAt(w.x, w.y);
  if (!t) return;
  if (UI.mode === 'place') {
    const type = UI.placeType, d = BUILDINGS[type];
    const x = t.x - Math.floor((d.w - 1) / 2), y = t.y - Math.floor((d.h - 1) / 2);
    if (S.coins < bCost(type)) { toast('Not enough coins', true); return; }
    if (d.max && bCount(type) >= d.max) { toast('You have the maximum number of these', true); setMode(null); return; }
    if (!canPlace(type, x, y)) { toast(type === 'plot' || type === 'path' ? 'That spot needs clear, empty ground' : 'Needs clear ground — and must not block paths', true); return; }
    place(type, x, y);
    const again = (type === 'plot' || type === 'path' || d.cat === 'decor' || type === 'barrel' || type === 'crock') && S.coins >= bCost(type) && !(d.max && bCount(type) >= d.max);
    if (!again) setMode(null);
    return;
  }
  if (UI.mode === 'move') {
    const b = UI.moving, d = BUILDINGS[b.type];
    const x = t.x - Math.floor((d.w - 1) / 2), y = t.y - Math.floor((d.h - 1) / 2);
    if (moveBuilding(b, x, y)) setMode(null); else toast('Needs clear ground — and must not block paths', true);
    return;
  }
  if (UI.mode === 'remove') { if (S.floor[t.i] && !OCC[t.i] && !ghOf(t.i)) { removeFloor(t.i); AUDIO.sfx('drop'); } return; }
  if (UI.mode === 'clear') {
    if (canClear(t.i)) { if (!doClear(t.i)) toast('Need ' + fmt(clearCost(t.i)) + ' coins', true, 'coin'); }
    else if (S.cover[t.i] && S.cover[t.i] !== COVER.WATER) toast('Clear the land next to it first', true);
    return;
  }
  // meeple?
  let best = null, bd = 22;
  for (const m of S.meeples) { const d = Math.hypot(m.x - w.x, m.y - 12 - w.y); if (d < bd) { bd = d; best = m; } }
  if (best) { openPanel('meeple', best.id); return; }
  // greenhouse: first tap lifts the roof, then plots inside can be tapped
  const gh = ghOf(t.i);
  if (gh) {
    const open = R.sel && ((R.sel.kind === 'b' && R.sel.id === gh.id) || (R.sel.kind === 'plot' && S.plots[R.sel.id] && S.plots[R.sel.id].gh === gh.id));
    if (open && S.plots[t.i]) openPanel('plot', t.i); else openPanel('greenhouse', gh.id);
    return;
  }
  // building? (also allow tapping the tall part just above the footprint)
  let bid = OCC[t.i];
  if (!bid) { const above = tileAt(w.x, w.y + T); if (above && OCC[above.i] && BUILDINGS[BMAP[OCC[above.i]].type].w > 1) bid = OCC[above.i]; }
  if (bid) {
    const b = BMAP[bid];
    if (b.type === 'creator') openPanel('creator', b.id);
    else if (b.type === 'market') openPanel('market');
    else if (BUILDINGS[b.type].proc) openPanel('proc', b.id);
    else openPanel('bldg', b.id);
    return;
  }
  if (S.plots[t.i]) { openPanel('plot', t.i); return; }
  const c = S.cover[t.i];
  if (c && c !== COVER.WATER) {
    closePanel();
    if (!canClear(t.i)) { showPop(sx, sy, `<div class="t">${COVER_NAME[c]}</div><div class="s">Clear the land next to it first.</div>`, () => { }); return; }
    const cost = clearCost(t.i);
    showPop(sx, sy, `<div class="row"><div class="grow"><div class="t">${COVER_NAME[c]}</div>${costHtml(cost)}</div><button class="btn sm green ${S.coins < cost ? 'dis' : ''}" data-a="clr">${iconImg('axe', 'sm')} Clear</button></div>`,
      a => { if (a === 'clr') { if (doClear(t.i)) hidePop(); else toast('Not enough coins', true); } });
    return;
  }
  if (c === COVER.WATER) { showPop(sx, sy, `<div class="t">Lily Pond</div><div class="s">Frogs live here. Leave it be.</div>`, () => { }); return; }
  closePanel();
}
function onWorldHover(sx, sy) {
  if (UI.mode !== 'place' && UI.mode !== 'move') { R.ghost = null; return; }
  const w = R.screenToWorld(sx, sy), t = tileAt(w.x, w.y); if (!t) return;
  const type = UI.mode === 'place' ? UI.placeType : UI.moving.type, d = BUILDINGS[type];
  const x = t.x - Math.floor((d.w - 1) / 2), y = t.y - Math.floor((d.h - 1) / 2);
  if (!R.ghost || R.ghost.x !== x || R.ghost.y !== y || R.ghost.type !== type) R.ghost = { type, x, y, ok: canPlace(type, x, y, UI.moving) };
}

// ---------------------------------------------------------------- input (pan / pinch / tap)
const PTR = new Map();
let pinch = null, dragMoved = false, downAt = null;
function setupInput() {
  const cv = R.cv;
  cv.addEventListener('pointerdown', e => {
    AUDIO.unlock();
    cv.setPointerCapture(e.pointerId);
    PTR.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY });
    if (PTR.size === 1) { dragMoved = false; downAt = { x: e.clientX, y: e.clientY, t: performance.now() }; onWorldHover(e.clientX, e.clientY); }
    if (PTR.size === 2) { const [a, b] = [...PTR.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: R.cam.z, cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 }; dragMoved = true; }
  });
  cv.addEventListener('pointermove', e => {
    const p = PTR.get(e.pointerId);
    if (!p) { onWorldHover(e.clientX, e.clientY); return; }
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;
    if (PTR.size === 1) {
      if (Math.hypot(p.x - p.sx, p.y - p.sy) > 9) dragMoved = true;
      if (dragMoved) { R.cam.x -= dx / R.cam.z; R.cam.y -= dy / R.cam.z; R.clampCam(); hidePop(); }
    } else if (PTR.size === 2 && pinch) {
      const [a, b] = [...PTR.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y), cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
      const before = R.screenToWorld(cx, cy);
      R.cam.z = pinch.z * d / pinch.d; R.clampCam();
      const after = R.screenToWorld(cx, cy);
      R.cam.x += before.x - after.x; R.cam.y += before.y - after.y;
      // pan with the pinch centre
      R.cam.x -= (cx - pinch.cx) / R.cam.z; R.cam.y -= (cy - pinch.cy) / R.cam.z; pinch.cx = cx; pinch.cy = cy;
      R.clampCam();
    }
  });
  const up = e => {
    const p = PTR.get(e.pointerId); if (!p) return;
    PTR.delete(e.pointerId);
    if (PTR.size < 2) pinch = null;
    if (PTR.size === 0 && !dragMoved && downAt && performance.now() - downAt.t < 600 && UI.inGame && !UI.paused) onWorldTap(e.clientX, e.clientY);
    if (PTR.size === 0) downAt = null;
  };
  cv.addEventListener('pointerup', up);
  cv.addEventListener('pointercancel', e => { PTR.delete(e.pointerId); pinch = null; downAt = null; });
  cv.addEventListener('wheel', e => {
    e.preventDefault();
    const before = R.screenToWorld(e.clientX, e.clientY);
    R.cam.z *= Math.pow(1.0015, -e.deltaY); R.clampCam();
    const after = R.screenToWorld(e.clientX, e.clientY);
    R.cam.x += before.x - after.x; R.cam.y += before.y - after.y; R.clampCam();
  }, { passive: false });
  document.addEventListener('pointerdown', () => AUDIO.unlock(), { capture: true });
  window.addEventListener('keydown', e => { if (e.key === 'Escape') handleBack(); });
}

// ---------------------------------------------------------------- events from the sim
function onGameEvent(e) {
  if (e.t === 'level') {
    const L = e.level, cr = CROP[e.crop];
    const newB = Object.keys(BUILDINGS).filter(t => BUILDINGS[t].lvl === L);
    const newR = RECIPES.filter(r => r.lvl === L);
    AUDIO.sfx('level');
    modal(`<div class="burst">${iconImg(e.crop, 'xl')}</div><h2>Level ${L + 1}!</h2><p class="p">New crop unlocked: <b>${cr.name}</b>.<br>A ${cr.name} Meeple is ${cr.meeple.trait.toLowerCase()} — speed ${cr.meeple.speed}, carries ${cr.meeple.carry}.</p>` +
      (newB.length ? `<div class="sec">New buildings</div><div class="row wrap" style="justify-content:center">${newB.map(t => `<span class="chip"><img class="ico" src="${buildingURL(t)}">${BUILDINGS[t].name}</span>`).join('')}</div>` : '') +
      (newR.length ? `<div class="sec">New recipes</div><div class="row wrap" style="justify-content:center">${newR.map(r => `<span class="chip">${iconImg(r.out[0], 'sm')}${ITEM[r.out[0]].name}</span>`).join('')}</div>` : '') +
      `<div class="btns"><button class="btn green" data-a="ok">Wonderful!</button></div>`, () => closeModal());
    saveGame();
  } else if (e.t === 'fair') {
    AUDIO.sfx('level');
    modal(`<div class="burst">${iconImg('star', 'xl')}</div><h2>The Grand Harvest Fair!</h2><p class="p">Folk came from every valley to taste your kimchi, jams, beers and spirits. Your little meadow is the talk of the land.<br><br>
      Played for <b>${fmtTime(S.playTime)}</b> with <b>${S.meeples.length}</b> Meeples and <b>${fmt(S.stats.earned)}</b> coins earned.<br><br>The meadow is yours to keep growing.</p><div class="btns"><button class="btn green" data-a="ok">Keep farming</button></div>`, () => closeModal());
    saveGame();
  } else if (e.t === 'season') {
    const SE = SEASONS[e.sea], cs = CROPS.filter(c => c.sea.includes(e.sea) && cropUnlocked(c.id));
    AUDIO.sfx('level');
    modal(`<div class="burst" style="font-size:3.4rem">${SE.icon}</div><h2>${SE.name} has arrived!</h2><p class="p">Year ${seasonYear()}. Plots with a ${SE.name.toLowerCase()} plan switched over on their own; out-of-season crops are resting.</p>
      <div class="sec">In season now</div><div class="row wrap" style="justify-content:center">${cs.map(c => `<span class="chip">${iconImg(c.id, 'sm')}${c.name}</span>`).join('')}</div>
      <div class="btns"><button class="btn green" data-a="ok">Lovely</button></div>`, () => closeModal());
    saveGame();
  } else if (e.t === 'rain') {
    toast('🌧 Rain is watering the fields', false);
  } else if (e.t === 'meeple') {
    toast(`${esc(e.m.name)} the ${e.m.crop === 'founder' ? '' : CROP[e.m.crop].name + ' '}Meeple has joined!`, false, e.m.crop);
  }
}

// ---------------------------------------------------------------- menus
function handleBack() {
  if (modalOpen()) { closeModal(); return true; }
  if (!$('pop').classList.contains('hidden')) { hidePop(); return true; }
  if (UI.mode) { setMode(null); return true; }
  if (UI.panel) { closePanel(); return true; }
  if (UI.inGame) { openPause(); return true; }
  return false;
}
window.onBackPressed = handleBack;

function slotInfo(s) {
  const d = readSlot(s);
  if (!d) return null;
  const lv = LEVELS[Math.min(d.level, LEVELS.length - 1)];
  return { d, crop: lv.crop || 'pumpkin', text: `Level ${d.level + 1} · ${d.meeples.length} Meeples · ${fmt(d.coins)} coins`, sub: `Played ${fmtTime(d.playTime)} · saved ${new Date(d.savedAt || d.created).toLocaleString()}` };
}
function openSlots(mode) {
  const rows = [1, 2, 3].map(s => {
    const inf = slotInfo(s);
    return `<div class="card slot">${inf ? iconImg(inf.crop, 'xl') : iconImg('soil', 'xl')}<div class="grow"><div class="t">Homestead ${s}</div><div class="s">${inf ? inf.text + '<br>' + inf.sub : 'Empty meadow'}</div></div>
      <div style="display:flex;flex-direction:column;gap:.3rem">${inf ? `<button class="btn sm green" data-a="load" data-v="${s}">Play</button>` : `<button class="btn sm green" data-a="new" data-v="${s}">New</button>`}
      ${inf ? `<button class="btn sm red" data-a="del" data-v="${s}">Delete</button>` : ''}</div></div>`;
  }).join('');
  modal(`<h2>${mode === 'new' ? 'Choose a meadow' : 'Your homesteads'}</h2>${rows}<div class="btns"><button class="btn" data-a="back">Back</button></div>`, (a, v) => {
    if (a === 'back') closeModal();
    else if (a === 'load') { closeModal(); startGame(+v, false); }
    else if (a === 'new') { closeModal(); startGame(+v, true); }
    else if (a === 'del') {
      modal(`<h2>Delete Homestead ${v}?</h2><p class="p">This can't be undone.</p><div class="btns"><button class="btn" data-a="no">Cancel</button><button class="btn red" data-a="yes">Delete</button></div>`,
        b => { if (b === 'yes') { deleteSlot(+v); if (SET.lastSlot == v) { SET.lastSlot = null; saveSettings(); } } openSlots(mode); buildTitleMenu(); });
    }
  });
}
function buildTitleMenu() {
  const last = SET.lastSlot && readSlot(SET.lastSlot) ? SET.lastSlot : null;
  const items = [];
  if (last) items.push(`<button class="btn green" data-a="continue">▶ Continue</button>`);
  items.push(`<button class="btn ${last ? '' : 'green'}" data-a="newgame">New Homestead</button>`);
  if ([1, 2, 3].some(s => readSlot(s))) items.push(`<button class="btn" data-a="load">Load</button>`);
  items.push(`<button class="btn" data-a="settings">${iconImg('gear', 'sm')} Settings</button>`);
  items.push(`<button class="btn" data-a="help">How to Play</button>`);
  if (window.AndroidBridge && AndroidBridge.exitApp) items.push(`<button class="btn" data-a="quit">Quit</button>`);
  $('mainMenu').innerHTML = items.join('');
  $('mainMenu').onclick = e => {
    const el = e.target.closest('[data-a]'); if (!el) return;
    AUDIO.unlock(); AUDIO.sfx('click');
    const a = el.dataset.a;
    if (a === 'continue') startGame(last, false);
    else if (a === 'newgame') { const free = [1, 2, 3].find(s => !readSlot(s)); if (free && !last) startGame(free, true); else openSlots('new'); }
    else if (a === 'load') openSlots('load');
    else if (a === 'settings') openSettings();
    else if (a === 'help') openHelp();
    else if (a === 'quit') AndroidBridge.exitApp();
  };
  $('logoMeeples').innerHTML = ['carrot', 'wheat', 'strawberry', 'blueberry', 'pumpkin'].map(c => `<img src="${meepleURL(CROP[c].meeple.col, c)}">`).join('');
}
function openPause() {
  UI.paused = true;
  modal(`<h2>Paused</h2><div class="menu" style="margin:0 auto">
    <button class="btn green" data-a="resume">▶ Resume</button>
    <button class="btn" data-a="save">Save Game</button>
    <button class="btn" data-a="settings">${iconImg('gear', 'sm')} Settings</button>
    <button class="btn" data-a="help">How to Play</button>
    <button class="btn" data-a="title">Save & Return to Title</button></div>`, a => {
    if (a === 'resume') { closeModal(); UI.paused = false; }
    else if (a === 'save') { const ok = saveGame(); toast(ok ? 'Game saved' : 'Save failed!', !ok, 'scroll'); }
    else if (a === 'settings') openSettings(true);
    else if (a === 'help') openHelp(true);
    else if (a === 'title') { saveGame(); closeModal(); UI.paused = false; toTitle(); }
  });
}
function openSettings(fromPause) {
  const sl = (k, l) => `<div class="setrow"><span>${l}</span><input type="range" min="0" max="1" step="0.05" value="${SET[k]}" data-k="${k}"></div>`;
  const tg = (k, l, opts) => `<div class="setrow"><span>${l}</span><div class="toggle">${opts.map(([v, t]) => `<button class="${SET[k] === v ? 'on' : ''}" data-a="set" data-v="${k}|${esc(JSON.stringify(v))}">${t}</button>`).join('')}</div></div>`;
  const m = modal(`<h2>${iconImg('gear')} Settings</h2><div style="text-align:left">
    <div class="sec">Audio</div>${sl('master', 'Master')}${sl('music', 'Music')}${sl('sfx', 'Effects')}${sl('amb', 'Ambience')}
    <div class="sec">Graphics</div>
    ${tg('quality', 'Quality', [['low', 'Low'], ['medium', 'Medium'], ['high', 'High']])}
    ${tg('fps', 'Frame rate', [[30, '30'], [60, '60'], [0, 'Max']])}
    ${tg('dayNight', 'Day & night', [[true, 'On'], [false, 'Off']])}
    ${tg('showFps', 'Show FPS', [[true, 'On'], [false, 'Off']])}
    <div class="sec">Interface</div>
    ${tg('uiScale', 'UI size', [[0.85, 'Small'], [1, 'Medium'], [1.15, 'Large'], [1.3, 'Huge']])}
    ${tg('costLabels', 'Clear costs', [[true, 'Show'], [false, 'Hide']])}
    ${tg('hints', 'Tips', [[true, 'On'], [false, 'Off']])}
    <div class="sec">System</div>
    ${tg('autosave', 'Autosave', [[30, '30s'], [60, '1 min'], [180, '3 min'], [300, '5 min']])}
    ${tg('keepAwake', 'Keep screen on', [[true, 'On'], [false, 'Off']])}
    <p class="s">Meeple Meadows only grows while it's open on screen — there's no offline progress.</p>
    </div><div class="btns"><button class="btn" data-a="reset">Reset defaults</button><button class="btn green" data-a="done">Done</button></div>`, (a, v) => {
    if (a === 'set') {
      const [k, raw] = v.split('|'); const val = JSON.parse(raw);
      const oldQ = SET.quality; SET[k] = val; saveSettings(); applySettings();
      if (k === 'quality' && val !== oldQ) { R.setQuality(val); for (const kk in bURL) delete bURL[kk]; for (const kk in mURL) delete mURL[kk]; }
      openSettings(fromPause);
    } else if (a === 'reset') {
      const ls = SET.lastSlot; SET = Object.assign({}, SET_DEFAULT, { lastSlot: ls }); saveSettings(); applySettings(); R.setQuality(SET.quality); openSettings(fromPause);
    } else if (a === 'done') { if (fromPause) openPause(); else closeModal(); }
  });
  m.oninput = e => { const k = e.target.dataset.k; if (k) { SET[k] = +e.target.value; applySettings(); } };
  m.onchange = e => { if (e.target.dataset.k) { saveSettings(); AUDIO.sfx('pop'); } };
}
function openHelp(fromPause) {
  modal(`<h2>How to Play</h2><div style="text-align:left" class="p">
    <p>${iconImg('meeple', 'sm')} <b>Meeples</b> do the work: they plant, harvest and haul everything to the <b>storehouse</b> on their own.</p>
    <p>${iconImg('soil', 'sm')} <b>Tap a plot</b> to choose its crop for each season. Build more plots from <b>Build</b>.</p>
    <p>🌸 <b>Seasons</b> last 2 hours each. Crops only grow in their seasons and rest the rest of the year. The <b>Greenhouse</b> (late game) grows anything, any time.</p>
    <p>${iconImg('can', 'sm')} Build a <b>Stone Well</b> and Meeples will fill watering cans there. Watered crops grow 60% faster; rain waters them for free.</p>
    <p>${iconImg('axe', 'sm')} The meadow is overgrown. Use <b>Clear</b> (or tap a tree) to pay for clearing land next to open ground. Further out costs more.</p>
    <p>${iconImg('coin', 'sm')} Sell at the <b>Market</b>, or set <b>Auto-sell</b> to keep a reserve and sell the extra.</p>
    <p>${iconImg('scroll', 'sm')} Everything banked counts toward the <b>goal</b> at the top. Reach it to unlock new crops, buildings and recipes.</p>
    <p>${iconImg('meeple', 'sm')} The <b>Meeple Creator</b> turns produce into new Meeples. Strawberry Meeples are fast; Potato and Pumpkin Meeples carry loads.</p>
    <p>${iconImg('book', 'sm')} Crafting buildings run <b>recipes</b>: pick one and haulers bring the ingredients. Chain them: Barley ➜ Malt ➜ Wort ➜ Beer, or Corn ➜ Cornmeal ➜ Grain Mash ➜ White Dog ➜ Whiskey!</p>
    <p>👆 Drag to look around, pinch to zoom. The game only progresses while it's open.</p></div>
    <div class="btns"><button class="btn green" data-a="ok">Got it</button></div>`, () => { if (fromPause) openPause(); else closeModal(); });
}
