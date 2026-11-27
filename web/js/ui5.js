// Meeple Meadows — v1.8 UI: landmarks, Wonders, Charm, Meeple wishes, surprises, the welcome-back note,
// postcards, following a Meeple, double-tap zoom and clearing combos.
'use strict';

// ---------------------------------------------------------------- landmarks
function openLandmark(l, sx, sy) {
  const L = LANDMARK[l.id];
  if (!lmReachable(l)) { showPop(sx, sy, `<div class="t">Something in the trees…</div><div class="s">There's an old shape hidden in the woods here. Clear a way to it and you can take a proper look.</div>`, () => { }); return; }
  modal(`<div class="burst" style="font-size:3rem">🔎</div><h2>What's this?</h2><p class="p">The brambles part, and there it is: something old, half swallowed by the woods.</p>
    <div class="btns"><button class="btn" data-a="no">Not now</button><button class="btn green" data-a="go">Explore it</button></div>`, a => { closeModal(); if (a === 'go') discoverLandmark(l); });
}
function landmarkStory(id, e) {
  const L = LANDMARK[id];
  modal(`<img src="${buildingURL(id)}" style="width:9rem;height:9rem;object-fit:contain" class="burst"><h2>${L.name}</h2><p class="p">${L.story}</p>
    <div class="row wrap" style="justify-content:center;gap:.4rem"><span class="chip ok">${L.perk}, for good</span>${e && e.coins ? `<span class="chip">${iconImg('coin', 'sm')}+${fmt(e.coins)}</span>` : ''}${e && e.gift ? `<span class="chip">🎁 ${e.gift}</span>` : ''}</div>
    <p class="s" style="margin-top:.6rem">${S.landmarks.filter(x => x.found).length} of ${S.landmarks.length} landmarks found. The others are still out there in the trees.</p>
    <div class="btns"><button class="btn green" data-a="ok">Wonderful</button></div>`, () => closeModal());
}

// ---------------------------------------------------------------- Wonders (building-site panel, Build tab) and fixed buildings
PANELS.build.tabs.splice(4, 0, ['wonder', 'Wonders']);
const reqChips = req => Object.keys(req).map(k => `<span class="chip ${(S.inv[k] || 0) >= req[k] ? 'ok' : 'bad'}">${iconImg(k, 'sm')}${fmt(Math.min(S.inv[k] || 0, req[k]))}/${fmt(req[k])} ${ITEM[k].name}</span>`).join('');
const _siteBody5 = PANELS.site.body, _siteSig5 = PANELS.site.sig, _siteAct5 = PANELS.site.act, _sitep5 = LIVE_X.sitep, _sites5 = LIVE_X.sites;
LIVE_X.sitep = id => { const b = BMAP[id]; return b && b.con && b.con.req ? (siteWaiting(b) ? 'Waiting for a delivery' : 'Building stage ' + b.con.stage + ' of 4') + ' · ' + Math.floor(b.con.p / b.con.need * 100) + '%' : _sitep5(id); };
LIVE_X.sites = id => { const b = BMAP[id]; return b && b.con && b.con.req && siteWaiting(b) ? 'The Meeples have downed tools until the next delivery arrives.' : _sites5(id); };
PANELS.site.sig = p => { const b = BMAP[p.id]; return _siteSig5(p) + (b.con.req ? ':' + b.con.stage + siteWaiting(b) + (b.con.stage < 4 ? Object.keys(b.con.req[b.con.stage]).map(k => Math.min(S.inv[k] || 0, b.con.req[b.con.stage][k])).join('.') : '') : ''); };
PANELS.site.body = p => {
  const b = BMAP[p.id], h = _siteBody5(p);
  if (!b.con.req) return h;
  const st = b.con.stage, wait = siteWaiting(b) && st < 4;
  const card = `<div class="card ${wait && wonderCanDeliver(b) ? 'sel' : ''}"><div class="t">${wait ? 'Delivery ' + (st + 1) + ' of 4' : 'Stage ' + st + ' of 4 is going up'}</div>` +
    (wait ? `<div class="row wrap" style="margin:.3rem 0">${reqChips(b.con.req[st])}</div><div class="row"><span class="s grow">Taken straight from storage. Building carries on as soon as it arrives.</span><button class="btn sm green ${wonderCanDeliver(b) ? '' : 'dis'}" data-a="wdeliver">Deliver</button></div>`
      : `<div class="s">${st < 4 ? 'Next delivery: ' + Object.keys(b.con.req[st]).map(k => fmt(b.con.req[st][k]) + ' ' + ITEM[k].name.toLowerCase()).join(' and ') + '.' : 'Everything has been delivered. This is the last stretch!'}</div>`) + `</div>
    <p class="s">When it's finished: <b>${WONDER[b.of].perk}</b>, for good.</p>`;
  return h.replace('<p class="p">', card + '<p class="p">').replace(/ and refund [\d.,kMB]+ coins/, m => m + ' (deliveries are not returned)');
};
PANELS.site.act = (a, v, P) => { if (a === 'wdeliver') { const b = BMAP[P.id]; if (b && deliverWonder(b)) AUDIO.sfx('buy'); return; } return _siteAct5(a, v, P); };
const _bldgBody5 = PANELS.bldg.body;
PANELS.bldg.body = p => {
  const b = BMAP[p.id], d = BUILDINGS[b.type];
  if (!d.fixed) return _bldgBody5(p);
  const L = LANDMARK[b.type], W = WONDER[b.type];
  return `<p class="p">${L ? L.story : d.desc}</p><div class="row wrap"><span class="chip ok">${(L || W).perk}</span><span class="chip">♥ ${d.charm} Charm</span></div>` +
    (W ? `<div class="sec">Building</div><div class="row"><button class="btn sm" data-a="move">${iconImg('move', 'sm')} Move</button></div>` : '');
};
// Charm on the Decor tab
const _buildBody5 = PANELS.build.body, _buildSig5 = PANELS.build.sig;
PANELS.build.sig = p => _buildSig5(p) + ':' + CHARM;
PANELS.build.body = p => {
  let h = _buildBody5(p);
  if (p.tab === 'decor') { const ev = passerEvery(); h = `<div class="card"><div class="t">♥ Charm ${CHARM}</div><div class="s">${ev ? 'A passer-by strolls in to admire the farm and spend at your stall about every ' + fmtTime(ev) + '. More decorations bring them more often, and they spend more.' : 'Decorations make the farm charming. At 3 Charm, passers-by start strolling in to spend coins at your stall.'}</div></div>` + h; }
  if (p.tab === 'wonder') h = `<p class="s">Wonders are great works built in four stages. Each stage needs a delivery from storage, then every free Meeple builds. Each one gives the whole farm a lasting bonus.</p>` + h;
  return h;
};

// ---------------------------------------------------------------- Meeple wishes, happiness, and following
LIVE_X.happy = id => { const m = S.meeples.find(x => x.id == id); return m && m.happy > S.playTime ? fmtTime(m.happy - S.playTime) : ''; };
const _meepleBody5 = PANELS.meeple.body, _meepleSig5 = PANELS.meeple.sig;
PANELS.meeple.sig = p => { const m = S.meeples.find(x => x.id === p.id), w = S.wish; return _meepleSig5(p) + ':' + (w && w.m === p.id ? w.k + w.a + wishHave(w) : '') + (m.happy > S.playTime ? 'h' : ''); };
PANELS.meeple.body = p => {
  const m = S.meeples.find(x => x.id === p.id), w = S.wish;
  let top = '';
  if (w && w.m === m.id) top += `<div class="card sel"><div class="row"><span style="font-size:1.8rem">💭</span><div class="grow"><div class="t">A wish</div><div class="s">${wishText(w)} Grant it and they'll work 15% faster for 10 minutes.</div></div></div></div>`;
  if (m.happy > S.playTime) top += `<div class="card" style="background:#fff0f0"><div class="s">♥ <b>Feeling wonderful</b>: 15% faster for another <span data-live="happy:${m.id}"></span>.</div></div>`;
  return top + _meepleBody5(p).replace(`<button class="btn sm" data-a="mrename"`, `<button class="btn sm" data-a="mfollow" data-v="${m.id}">Follow</button><button class="btn sm" data-a="mrename"`);
};
PANELS.meeple.act = (a, v) => { if (a === 'mfollow') { startFollow(+v); return 'stop'; } };
function startFollow(id) {
  const m = S.meeples.find(x => x.id === id); if (!m) return;
  closePanel(); FX.camJob = null; FX.follow = id; AUDIO.sfx('open');
}
const followPill = document.createElement('div');
followPill.className = 'modebar hidden'; followPill.id = 'followPill';
$('hud').appendChild(followPill);
followPill.onclick = () => { FX.follow = null; AUDIO.sfx('close'); };
// press and hold a Meeple to ride along with it; double-tap open ground to zoom
let _holdT = 0, _lastTap = null;
function setupFeelInput() {
  const cv = R.cv;
  cv.addEventListener('pointerdown', e => {
    clearTimeout(_holdT);
    if (!UI.inGame || UI.paused || UI.mode || UI.photo || PTR.size !== 1) return;
    const sx = e.clientX, sy = e.clientY;
    _holdT = setTimeout(() => {
      if (PTR.size !== 1 || dragMoved) return;
      const w = R.screenToWorld(sx, sy); let best = null, bd = 26;
      for (const m of S.meeples) { const d = Math.hypot(m.x - w.x, m.y - 12 - w.y); if (d < bd) { bd = d; best = m; } }
      if (best) { dragMoved = true; hidePop(); startFollow(best.id); FX.hop[best.id] = R.time; }
    }, 480);
  });
  cv.addEventListener('pointermove', () => { if (dragMoved) clearTimeout(_holdT); });
  const up = e => {
    clearTimeout(_holdT);
    if (!UI.inGame || UI.paused || PTR.size) return;
    const now = performance.now(), p = { x: e.clientX, y: e.clientY, t: now, clean: !dragMoved && !UI.panel && !UI.mode && !modalOpen() && $('pop').classList.contains('hidden') };
    if (p.clean && _lastTap && _lastTap.clean && now - _lastTap.t < 330 && Math.hypot(p.x - _lastTap.x, p.y - _lastTap.y) < 40) {
      const w = R.screenToWorld(p.x, p.y), z = R.cam.z < 1.7 ? Math.min(2.4, R.cam.z * 1.7) : 1.05;
      FX.follow = null; FX.focus(w.x, w.y, { z, go: 0.34 }); _lastTap = null; return;
    }
    _lastTap = p;
  };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', () => clearTimeout(_holdT));
}
const _si5 = setupInput;
setupInput = function () { _si5(); setupFeelInput(); };

// ---------------------------------------------------------------- alerts
function extraAlerts(items) {
  const w = S.wish, m = w && S.meeples.find(x => x.id === w.m);
  if (m) items.push(`<button class="pill alert" data-a="wish"><span style="font-size:1.2rem;padding-left:.3rem">💭</span><span>${esc(m.name)}</span></button>`);
  if ((S.landmarks || []).some(l => !l.found && lmReachable(l))) items.push(`<button class="pill alert good" data-a="explore"><span style="font-size:1.2rem;padding-left:.3rem">🔎</span><span>Explore</span></button>`);
  const wd = S.buildings.find(b => b.of && b.con.req && siteWaiting(b) && b.con.stage < 4);
  if (wd) items.push(`<button class="pill alert ${wonderCanDeliver(wd) ? 'good' : ''}" data-a="wonder"><span style="font-size:1.2rem;padding-left:.3rem">🏛</span><span>${wonderCanDeliver(wd) ? 'Deliver' : 'Wonder'}</span></button>`);
}
function extraAlertClick(a) {
  if (a === 'wish' && S.wish) { const m = S.meeples.find(x => x.id === S.wish.m); if (m) { FX.focus(m.x, m.y); openPanel('meeple', m.id); } }
  else if (a === 'explore') { const l = S.landmarks.find(x => !x.found && lmReachable(x)); if (l) { FX.focus((l.x + 1) * T, (l.y + 1) * T); openLandmark(l); } }
  else if (a === 'wonder') { const b = S.buildings.find(x => x.of && x.con.req && siteWaiting(x)); if (b) { focusB(b); openPanel('site', b.id); } }
}
const _uh5 = updateHud;
updateHud = function () {
  _uh5();
  if (UI.photo && UI.photo.gold) S.day = 0.705;
  const m = FX.follow != null ? S.meeples.find(x => x.id === FX.follow) : null;
  const h = m ? `${iconImg('meeple')} Following <b>${esc(m.name)}</b> <button class="btn sm green">Stop</button>` : '';
  if (followPill.dataset.h !== h) { followPill.innerHTML = h; followPill.dataset.h = h; }
  followPill.classList.toggle('hidden', !m || !!UI.mode || !!UI.photo);
};

// ---------------------------------------------------------------- taps: the sky, the duckling, hidden landmarks, passers-by
const _tf5 = tapFeel;
tapFeel = function (w, t, sx, sy) {
  const st = SURP.star;
  if (st && !st.got && FX.star && Math.hypot(sx - FX.star.x, sy - FX.star.y) < 74) { catchStar(); return true; }
  const d = SURP.duck;
  if (d && d.st === 'lost' && Math.hypot(d.x - w.x, d.y - 6 - w.y) < 24) { guideDuck(); AUDIO.sfx('peep'); return true; }
  for (const l of S.landmarks || []) if (!l.found && w.x > l.x * T - 8 && w.x < (l.x + 2) * T + 8 && w.y > (l.y + 2) * T - 112 && w.y < (l.y + 2) * T + 8) { AUDIO.sfx('rustle'); openLandmark(l, sx, sy); return true; }
  const rb = SURP.rainbow, g = FX.rb;
  if (rb && !rb.got && g) { const r = Math.hypot(sx - g.cx, sy - g.cy); if (r > g.r0 - 12 && r < g.r1 + 12 && sy < window.innerHeight * 0.8) { catchRainbow(); return true; } }
  for (const o of WALKERS) if (o.t >= 0 && Math.hypot(o.x - w.x, o.y - 12 - w.y) < 20) { o.emo = { k: 'wave', t: 1.8 }; AUDIO.sfx('chirp'); return true; }
  return _tf5(w, t, sx, sy);
};
const _owt5 = onWorldTap;
onWorldTap = function (sx, sy) { if (UI.photo) return; _owt5(sx, sy); };

// ---------------------------------------------------------------- the welcome-back note
function showWelcome() {
  if (!UI.inGame || modalOpen() || UI.photo) return;
  const away = Date.now() - (S.savedAt || Date.now()), items = [];
  const ready = hasBoard() ? S.orders.filter(canFill).length : 0;
  if (ready) items.push(`${iconImg('orders', 'sm')} <b>${ready} order${ready > 1 ? 's' : ''}</b> ${ready > 1 ? 'are' : 'is'} ready to deliver`);
  if (visitorBusy()) items.push(`🎁 <b>${VISITORS[S.visitor.who]}</b> is waiting by the Market`);
  const Q = S.quest; if (Q && Q.q) items.push(`${iconImg('scroll', 'sm')} ${questDone(Q.q) ? '<b>A reward is waiting</b> for the job I asked about' : 'I\'m still hoping for this: ' + questText(Q).replace(/<\/?b>/g, '')}`);
  const stuck = stuckList().length; if (stuck) items.push(`${iconImg('alert', 'sm')} <b>${stuck} workshop${stuck > 1 ? 's are' : ' is'}</b> waiting on an ingredient`);
  const wd = S.buildings.find(b => b.of && b.con.req && siteWaiting(b) && b.con.stage < 4); if (wd) items.push(`🏛 The <b>${BUILDINGS[wd.of].name}</b> needs its next delivery`);
  if (S.wish) { const m = S.meeples.find(x => x.id === S.wish.m); if (m) items.push(`💭 <b>${esc(m.name)}</b> has a wish`); }
  if ((S.landmarks || []).some(l => !l.found && lmReachable(l))) items.push(`🔎 There's <b>something in the trees</b> we can reach now`);
  const pr = levelProgress(S.level + 1);
  if (pr) { const lv = LEVELS[S.level + 1], left = pr.parts.filter(q => q.have < q.need).sort((a, b) => a.have / a.need - b.have / b.need)[0]; items.push(`${iconImg(lv.fair ? 'star' : lv.crop, 'sm')} <b>${Math.floor(pr.frac * 100)}%</b> of the way to ${lv.fair ? 'the Grand Harvest Fair' : CROP[lv.crop].name}${left ? ' (' + fmt(left.need - left.have) + ' more ' + ITEM[left.id].name.toLowerCase() + ' to go)' : ''}`); }
  const hrs = away / 3600000, gone = hrs >= 48 ? Math.round(hrs / 24) + ' days' : hrs >= 1.5 ? Math.round(hrs) + ' hours' : Math.max(1, Math.round(away / 60000)) + ' minutes';
  modal(`<img src="${meepleURL('#e8b070', 'founder', 'straw')}" style="width:4.4rem;height:5rem" class="burst"><h2>Welcome back!</h2>
    <p class="p">You've been away ${gone}. We put our feet up while you were gone (nothing grows without you), so everything is just as you left it.</p>
    <div style="text-align:left">${items.slice(0, 6).map(x => `<div class="card" style="padding:.35rem .6rem;margin-bottom:.35rem"><div class="s" style="font-size:.86rem">${x}</div></div>`).join('')}</div>
    <div class="btns"><button class="btn green" data-a="ok">Let's go</button></div>`, () => closeModal());
}
const _bh5 = buildHud;
buildHud = function () {
  _bh5(); FX.follow = null; _lastTap = null;
  if (UI.photo) endPhoto();
  if (S.playTime > 300 && S.savedAt && Date.now() - S.savedAt > 600000) setTimeout(showWelcome, 700);
};

// ---------------------------------------------------------------- postcards
const photoBar = document.createElement('div');
photoBar.id = 'photoBar'; photoBar.className = 'modebar hidden';
document.body.appendChild(photoBar);
function startPhoto() {
  closePanel(); setMode(null); hidePop(); FX.follow = null;
  UI.photo = { day: S.day, gold: false }; R.sel = null;
  $('hud').classList.add('hidden'); $('toasts').classList.add('hidden');
  photoBar.innerHTML = `<span class="s">Drag and pinch to frame your shot</span><button class="btn sm" data-a="gold">🌅 Golden hour</button><button class="btn sm gold" data-a="snap">📷 Take postcard</button><button class="btn sm green" data-a="done">Done</button>`;
  photoBar.classList.remove('hidden');
}
function endPhoto() {
  if (!UI.photo) return;
  if (UI.photo.gold) S.day = UI.photo.day;
  UI.photo = null; photoBar.classList.add('hidden');
  if (UI.inGame) $('hud').classList.remove('hidden');
  $('toasts').classList.remove('hidden');
}
function snapPostcard() {
  const src = R.cv, m = Math.round(src.width * 0.035), cap = Math.round(src.width * 0.075), c = newCanvas(src.width + m * 2, src.height + m * 2 + cap), g = c.getContext('2d');
  g.fillStyle = '#fbf3df'; g.fillRect(0, 0, c.width, c.height);
  g.drawImage(src, m, m);
  g.strokeStyle = '#3d2a1f'; g.lineWidth = Math.max(2, m * 0.08); g.strokeRect(m, m, src.width, src.height);
  g.strokeStyle = 'rgba(106,74,50,0.5)'; g.setLineDash([m * 0.3, m * 0.25]); g.lineWidth = Math.max(1, m * 0.05); g.strokeRect(m * 0.4, m * 0.4, c.width - m * 0.8, c.height - m * 0.8); g.setLineDash([]);
  g.fillStyle = '#3d2a1f'; g.textBaseline = 'middle'; g.textAlign = 'left'; g.font = `900 ${Math.round(cap * 0.46)}px "Trebuchet MS", sans-serif`;
  g.fillText('Greetings from Meeple Meadows', m, src.height + m + cap * 0.55);
  g.textAlign = 'right'; g.font = `700 ${Math.round(cap * 0.3)}px "Trebuchet MS", sans-serif`; g.fillStyle = '#6a4a32';
  g.fillText(`Level ${S.level + 1} · ${S.meeples.length} Meeples · ${fmtTime(S.playTime)} played`, c.width - m, src.height + m + cap * 0.58);
  AUDIO.sfx('shutter'); FX.flash(0.6);
  const name = 'MeepleMeadows-' + new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-') + '.png';
  const say = (msg, bad) => { $('toasts').classList.remove('hidden'); toast(msg, bad, bad ? null : 'star'); };
  try {
    if (window.AndroidBridge && AndroidBridge.savePicture) { const ok = AndroidBridge.savePicture(c.toDataURL('image/png').split(',')[1], name); say(ok ? 'Postcard saved to your Pictures, in the MeepleMeadows album' : 'Couldn\'t save the postcard on this tablet', !ok); return; }
    c.toBlob(blob => {
      if (!blob) { say('Couldn\'t make the postcard', true); return; }
      const file = typeof File === 'function' ? new File([blob], name, { type: 'image/png' }) : null;
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) { navigator.share({ files: [file], title: 'Meeple Meadows' }).catch(() => { }); return; }
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      say('Postcard saved to your downloads');
    }, 'image/png');
  } catch (err) { say('Couldn\'t make the postcard', true); }
}
photoBar.onclick = e => {
  const el = e.target.closest('[data-a]'); if (!el || !UI.photo) return;
  AUDIO.sfx('click');
  if (el.dataset.a === 'done') endPhoto();
  else if (el.dataset.a === 'gold') { UI.photo.gold = !UI.photo.gold; if (UI.photo.gold) UI.photo.day = S.day; else S.day = UI.photo.day; el.classList.toggle('on', UI.photo.gold); }
  else if (el.dataset.a === 'snap') { photoBar.classList.add('hidden'); setTimeout(() => { snapPostcard(); if (UI.photo) photoBar.classList.remove('hidden'); }, 60); }
};
const _hb5 = handleBack;
handleBack = function () { if (UI.photo) { endPhoto(); return true; } if (FX.follow != null && !modalOpen() && !UI.panel && !UI.mode) { FX.follow = null; return true; } return _hb5(); };
window.onBackPressed = handleBack;

// ---------------------------------------------------------------- the journal's Stats page: what you've discovered
const _jBody5 = PANELS.journal.body, _jSig5 = PANELS.journal.sig;
PANELS.journal.sig = p => _jSig5(p) + (p.tab === 'stats' ? ':' + CHARM + (S.landmarks || []).filter(l => l.found).length + bReady('w_clock') + bReady('w_hall') + bReady('w_dome') : '');
PANELS.journal.body = p => {
  const h = _jBody5(p); if (p.tab !== 'stats') return h;
  const lm = S.landmarks || [];
  return h + `<div class="sec">Discoveries</div><div class="row wrap" style="gap:.3rem">` +
    lm.map(l => l.found ? `<span class="chip ok">🗺 ${LANDMARK[l.id].name}</span>` : `<span class="chip" style="opacity:.55">❔ Still hidden</span>`).join('') +
    WONDERS.map(W => bReady(W.id) ? `<span class="chip ok">🏛 ${W.name}</span>` : `<span class="chip" style="opacity:.55">🏛 ${S.level >= W.lvl ? W.name + ' (not built)' : '???'}</span>`).join('') +
    `</div><div class="row wrap" style="gap:.3rem;margin-top:.3rem"><span class="chip">♥ ${CHARM} Charm</span><span class="chip">${iconImg('coin', 'sm')}${fmt(S.stats.tips || 0)} from passers-by</span><span class="chip">💭 ${S.stats.wishes || 0} wishes granted</span><span class="chip">✨ ${S.stats.surprises || 0} surprises caught</span></div>`;
};

// ---------------------------------------------------------------- events
let _combo = 0, _comboT = -9;
const _extraEvent5 = onExtraEvent;
onExtraEvent = function (e) {
  switch (e.t) {
    case 'clear': {
      // clearing one after another builds a combo
      const now = performance.now(); _combo = now - _comboT < 2600 ? _combo + 1 : 1; _comboT = now;
      if (_combo >= 2) {
        const x = (e.i % MW) * T + T / 2, y = ((e.i / MW) | 0) * T;
        addPart({ type: 'text', x, y: y - 26, vy: -26, max: 0.9, text: '×' + _combo, size: 11 + Math.min(8, _combo), col: _combo >= 5 ? '#ffe48a' : '#fffaf0' });
        AUDIO.sfx('combo', _combo);
        if (_combo % 5 === 0) { const v = Math.round(surpriseCoins() * 0.25); S.coins += v; S.stats.earned += v; coinFly(worldPoint(x, y), v); FX.confetti(16); }
      }
      return false;
    }
    case 'landmark': {
      const L = LANDMARK[e.id];
      if (e.coins) coinFly(worldPoint((e.x + 1) * T, (e.y + 1) * T), e.coins);
      FX.focus((e.x + 1) * T, (e.y + 1) * T - 20, { z: Math.max(R.cam.z, 1.4), go: 0.6, hold: 1.6, back: true });
      celebrate({ title: L.name, sub: 'A landmark uncovered: ' + L.perk, emoji: '🗺', big: true }, () => landmarkStory(e.id, e));
      saveGame();
      return true;
    }
    case 'lmnear': toast(`🔎 There's <b>something old</b> poking out of the trees. Tap it to take a look.`, false); AUDIO.sfx('ding'); return true;
    case 'wstage': { const b = BMAP[e.b]; if (b) toast(`Delivery ${e.stage} of 4 for the <b>${BUILDINGS[b.of || b.type].name}</b>. The Meeples are back at it!`, false, 'hammer'); return true; }
    case 'built':
      if (BUILDINGS[e.type].wonder) {
        const W = WONDER[e.type], b = BMAP[e.b];
        if (b) FX.focus((b.x + 1.5) * T, (b.y + 1.5) * T - 40, { z: Math.max(R.cam.z, 1.2), go: 0.7, hold: 2.2, back: true });
        if (UI.panel && UI.panel.type === 'site' && UI.panel.id === e.b) closePanel();
        celebrate({ title: 'The ' + W.name + ' stands!', sub: W.perk + ', for good', emoji: '🏛', big: true, fair: true });
        saveGame();
        return true;
      }
      break;
    case 'tip': coinFly(worldPoint(e.x, e.y - 20), e.v); return true;
    case 'surprise': {
      S.stats.surprises = (S.stats.surprises || 0) + 1;
      const what = e.k === 'rainbow' ? 'You caught the rainbow!' : e.k === 'star' ? 'You wished on a shooting star!' : 'The duckling is home with its family!';
      if (e.v) coinFly(e.x != null ? worldPoint(e.x, e.y) : null, e.v);
      toast(`✨ ${what} ${e.v ? '+' + fmt(e.v) + ' coins' : 'You got ' + e.gift}`, false);
      FX.confetti(30);
      return true;
    }
    case 'wish': { const m = S.wish && S.meeples.find(x => x.id === S.wish.m); if (m) toast(`💭 <b>${esc(m.name)}</b> has a wish. Tap them to see it.`, false); return true; }
    case 'wishdone': { const m = S.meeples.find(x => x.id === e.m); if (m) toast(`♥ <b>${esc(m.name)}</b> is delighted! They'll work 15% faster for 10 minutes.`, false); return true; }
    case 'band': toast('🎵 A travelling band is playing at the Market! Everyone has a spring in their step.', false); return true;
    case 'rainbow': case 'star': case 'duckling': case 'dawn': return true;
  }
  return _extraEvent5(e);
};
;(window.__stage = window.__stage || []).push('ui5.js loaded');
