// Meeple Meadows — v1.7 UI: Pip's requests, coins that fly to the purse, level-up banners, building
// sites, Meeple stories and badges, crop mastery, the daily visitor, and taps the world answers.
'use strict';

// ---------------------------------------------------------------- small motion helpers
function bump(el) { if (!el) return; el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
function shakeEl(el) { if (!el) return; el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }
let _ptr = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
document.addEventListener('pointerdown', e => {
  _ptr = { x: e.clientX, y: e.clientY };
  // a greyed-out button shakes its head when tapped
  for (const el of document.querySelectorAll('#panel .btn.dis, #modal .btn.dis, #pop .btn.dis')) {
    const r = el.getBoundingClientRect();
    if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) { shakeEl(el); AUDIO.sfx('error'); return; }
  }
  const lk = e.target && e.target.closest && e.target.closest('.card.locked, .cell.locked');
  if (lk) { shakeEl(lk); AUDIO.sfx('error'); }
}, true);
// panels slide away instead of vanishing
const _cp4 = closePanel;
closePanel = function () {
  const el = $('panel');
  if (UI.panel && !el.classList.contains('hidden') && el.animate) {
    const r = el.getBoundingClientRect(), g = el.cloneNode(true);
    g.removeAttribute('id'); g.className = 'panelghost';
    Object.assign(g.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
    document.body.appendChild(g);
    const a = g.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateX(1.8rem) scale(.97)', opacity: 0 }], { duration: 150, easing: 'ease-in', fill: 'forwards' });
    a.onfinish = () => g.remove(); setTimeout(() => g.remove(), 500);
  }
  _cp4();
};

// ---------------------------------------------------------------- the purse: a rolling number and flying coins
function coinShown() {
  const target = Math.max(0, S.coins - (UI.coinHold || 0));
  if (UI.coinDisp == null || Math.abs(target - UI.coinDisp) < 1) UI.coinDisp = target;
  else UI.coinDisp += (target - UI.coinDisp) * 0.2;
  return Math.round(UI.coinDisp);
}
function pursePos() { const r = $('hCoins').getBoundingClientRect(); return { x: r.left + r.height / 2 + 2, y: r.top + r.height / 2 }; }
// from: a DOM element, a screen point {x, y}, or nothing (where the player last touched)
function coinFly(from, amount) {
  if (!UI.inGame || !(amount > 0)) return;
  const layer = $('fxl'), to = pursePos();
  let p = _ptr;
  if (from && from.getBoundingClientRect) { const r = from.getBoundingClientRect(); p = { x: r.left + r.width / 2, y: r.top + r.height / 2 }; } else if (from) p = from;
  const n = Math.max(1, Math.min(10, 1 + Math.floor(Math.log10(amount + 1) * 2.4))), each = amount / n;
  UI.coinHold = (UI.coinHold || 0) + amount;
  const gen = UI.coinGen | 0;
  for (let k = 0; k < n; k++) {
    const el = document.createElement('img'); el.className = 'fcoin'; el.src = ART.iconURL.ui_coin; el.alt = '';
    layer.appendChild(el);
    const sx = p.x + (Math.random() - 0.5) * 28, sy = p.y + (Math.random() - 0.5) * 18;
    const mx = (sx + to.x) / 2 + (Math.random() - 0.5) * 110, my = Math.max(18, (sy + to.y) / 2 - 50 - Math.random() * 70);
    const dur = 520 + Math.random() * 180, delay = k * 55;
    let done = false;
    const land = () => {
      if (done) return; done = true; el.remove();
      if (gen !== (UI.coinGen | 0)) return;
      UI.coinHold = Math.max(0, (UI.coinHold || 0) - each); AUDIO.sfx('plink'); bump($('hCoins'));
    };
    if (el.animate) {
      const a = el.animate([
        { transform: `translate(${sx}px,${sy}px) scale(.2)`, opacity: 0 },
        { transform: `translate(${sx}px,${sy - 16}px) scale(1.2)`, opacity: 1, offset: 0.16 },
        { transform: `translate(${mx}px,${my}px) scale(1)`, opacity: 1, offset: 0.56 },
        { transform: `translate(${to.x}px,${to.y}px) scale(.55)`, opacity: 1 },
      ], { duration: dur, delay, easing: 'cubic-bezier(.45,0,.55,1)', fill: 'both' });
      a.onfinish = land;
    }
    setTimeout(land, delay + dur + 400);
  }
  const g = document.createElement('div'); g.className = 'gain'; g.textContent = '+' + fmt(amount);
  const r = $('hCoins').getBoundingClientRect(); g.style.left = (r.left + r.width * 0.45) + 'px'; g.style.top = (r.bottom - 4) + 'px';
  layer.appendChild(g); setTimeout(() => g.remove(), 1150);
}
function worldPoint(wx, wy) {
  const p = R.worldToScreen(wx, wy);
  return { x: Math.max(24, Math.min(window.innerWidth - 24, p.x)), y: Math.max(70, Math.min(window.innerHeight - 110, p.y)) };
}
function marketPoint() { const mk = S.buildings.find(b => b.type === 'market'); return mk ? worldPoint((mk.x + 1) * T, (mk.y + 1) * T - 30) : null; }
const _bh4 = buildHud;
buildHud = function () { _bh4(); UI.coinDisp = null; UI.coinHold = 0; UI.coinGen = (UI.coinGen | 0) + 1; UI.questMin = false; UI.soldAcc = 0; $('hint').dataset.h = ''; };

// ---------------------------------------------------------------- banners and the level-up moment
// big: the world hushes for half a second, then a banner sweeps in with confetti and every Meeple jumps;
// `then` (the details window) follows once the banner has had its moment.
function showBanner(o) {
  const now = performance.now(), at = Math.max(now, UI.bannerFree || 0), len = o.big ? 2300 : 2000;
  UI.bannerFree = at + (o.big ? len : 1300);
  setTimeout(() => {
    if (!UI.inGame) return;
    const el = document.createElement('div'); el.className = 'banner' + (o.big ? ' big' : '');
    el.innerHTML = `${o.icon ? iconImg(o.icon, 'xl') : o.emoji ? `<span style="font-size:2.2rem">${o.emoji}</span>` : ''}<div><b>${o.title}</b>${o.sub ? `<span>${o.sub}</span>` : ''}</div>`;
    $('fxl').appendChild(el); setTimeout(() => el.remove(), len);
    AUDIO.sfx('whoosh');
    if (o.onShow) o.onShow();
  }, at - now);
}
function celebrate(o, then) {
  if (!o.big) {
    showBanner(Object.assign({}, o, { onShow: () => { AUDIO.sfx(o.sfx || 'ding'); FX.confetti(o.conf == null ? 40 : o.conf); if (o.cheer !== false) FX.cheerAll(1.1); } }));
    if (then) then();
    return;
  }
  UI.hush = 0.55; AUDIO.sfx('hush'); AUDIO.duck(0.55); FX.flash(0.3);
  setTimeout(() => {
    AUDIO.sfx('level');
    FX.confetti(150); if (o.fair) { setTimeout(() => FX.confetti(140, true), 500); setTimeout(() => FX.confetti(140, true), 1100); }
    FX.cheerAll(2.3); FX.zoomPunch(0.05);
    for (const m of S.meeples) emote(m, Math.random() < 0.5 ? 'heart' : 'wow', 0.6);
    showBanner(o);
    if (then) setTimeout(() => { if (UI.inGame) then(); }, 1750);
  }, 500);
}

// ---------------------------------------------------------------- Pip's requests (replaces the old tip box)
function questProgressText(q) {
  if (q.k === 'level') return q.n === 1 ? Math.min(25, S.lifetime.carrot || 0) + '/25' : 'Level ' + Math.min(q.n + 1, S.level + 1) + '/' + (q.n + 1);
  if (q.k === 'build') {
    if (bReady(q.a) >= q.n) return 'Built!';
    const site = S.buildings.find(b => b.of === q.a);
    return site ? 'Building… ' + Math.floor(site.con.p / site.con.need * 100) + '%' : S.coins < bCost(q.a) ? 'Needs ' + fmt(bCost(q.a)) + ' coins' : 'Ready to place';
  }
  return fmt(questHave(q)) + '/' + fmt(q.n);
}
function questBarFrac(q) {
  if (q.k === 'build' && bReady(q.a) < q.n) { const site = S.buildings.find(b => b.of === q.a); return site ? site.con.p / site.con.need : 0; }
  return questFrac(q);
}
updateHint = function () {
  const el = $('hint'), Q = S.quest;
  if (!SET.hints || !Q || !Q.q || UI.panel) { el.classList.add('hidden'); setQuestTool(null); return; }
  const q = Q.q, done = questDone(q), ptxt = questProgressText(q), mini = !!UI.questMin;
  const key = [Q.i, done, mini, ptxt].join('|');
  if (el.dataset.h !== key) {
    el.dataset.h = key;
    const pip = meepleURL('#e8b070', 'founder', 'straw');
    if (mini) el.innerHTML = `<img class="who" src="${pip}">${done ? '<span class="dot">!</span>' : ''}`;
    else el.innerHTML = `<img class="who" src="${pip}"><span class="x" data-a="x">–</span><div>${done ? '<b>All done!</b> ' : ''}${questText(Q)}</div>
      <div class="qrow"><div class="bar big ${done ? '' : 'gold'}"><i style="width:${(Math.min(1, questBarFrac(q)) * 100).toFixed(1)}%"></i></div><span class="qn">${ptxt}</span></div>` +
      (done ? `<button class="btn sm green claim" data-a="claim">Claim ${rewardLabel(q.r, q.ri)}</button>` : `<div class="s" style="margin-top:.2rem">Reward: ${rewardLabel(q.r, q.ri)}</div>`);
    el.classList.toggle('mini', mini);
    el.classList.toggle('ready', done);
  }
  el.classList.remove('hidden');
  setQuestTool(!done && !mini ? q.tool : null);
};
// the toolbar button a request points at gets a soft pulsing ring
function setQuestTool(tool) {
  if (UI.questTool === tool) return;
  const find = k => k === 'coins' ? $('hCoins') : k ? $('toolbar').querySelector(`[data-a="${k}"]`) : null;
  const old = find(UI.questTool); if (old) old.classList.remove('nudge');
  const nu = find(tool); if (nu) nu.classList.add('nudge');
  UI.questTool = tool;
}
$('hint').onclick = e => {
  if (e.target.closest('[data-a="x"]')) { UI.questMin = true; AUDIO.sfx('close'); return; }
  if (e.target.closest('[data-a="claim"]')) {
    const r = $('hint').getBoundingClientRect(); UI.claimAt = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    if (claimQuest()) { AUDIO.sfx('buy'); bump($('hint')); }
    return;
  }
  if (UI.questMin) { UI.questMin = false; AUDIO.sfx('open'); }
};

// ---------------------------------------------------------------- building sites
LIVE_X.sitep = id => { const b = BMAP[id]; return b && b.con ? (b.con.p < b.con.need * BUILD_FOUND ? 'Digging the foundation' : 'Raising the walls') + ' · ' + Math.floor(b.con.p / b.con.need * 100) + '%' : ''; };
LIVE_X.siteb = id => { const b = BMAP[id]; return b && b.con ? b.con.p / b.con.need : 1; };
LIVE_X.sites = id => {
  const b = BMAP[id]; if (!b || !b.con) return '';
  const at = S.meeples.filter(m => m.task && m.task.type === 'construct' && m.task.b === b.id), here = at.filter(m => !m.path.length);
  if (!at.length) return 'Waiting for a free Meeple';
  if (!here.length) return at.length + ' Meeple' + (at.length > 1 ? 's are' : ' is') + ' on the way';
  const rate = here.reduce((a, m) => a + mWork(m), 0);
  return here.length + ' Meeple' + (here.length > 1 ? 's' : '') + ' building · about ' + fmtTime((b.con.need - b.con.p) / rate) + ' left';
};
PANELS.site = {
  valid: p => !!BMAP[p.id] && !!BMAP[p.id].of,
  head: p => { const b = BMAP[p.id]; return `<img class="bimg" style="width:2.8rem;height:2.8rem" src="${buildingURL(b.of)}"><h2>${BUILDINGS[b.of].name}<small>Under construction</small></h2>`; },
  sig: p => '',
  body: p => {
    const b = BMAP[p.id], d = BUILDINGS[b.of];
    return `<div class="card"><div class="t" data-live="sitep:${b.id}"></div><div class="bar big" style="margin:.35rem 0"><i data-bar="siteb:${b.id}"></i></div><div class="s" data-live="sites:${b.id}"></div></div>
      <p class="p">${d.desc}</p>
      <p class="s">Your Meeples build it themselves, piece by piece from the ground up. Every free pair of hands pitches in, so more Meeples means faster building.</p>
      <div class="sec">Site</div><button class="btn sm red" data-a="sitecancel">${iconImg('trash', 'sm')} Cancel${d.found ? '' : ' and refund ' + fmt(b.con.paid || 0) + ' coins'}</button>`;
  },
  act: (a, v, P) => {
    if (a !== 'sitecancel') return;
    const b = BMAP[P.id]; if (!b || !b.of) return 'stop';
    const name = BUILDINGS[b.of].name; cancelSite(b); closePanel(); toast(name + ' cancelled', false, 'hammer');
    return 'stop';
  },
};

// ---------------------------------------------------------------- Meeple stories and badges
function meepleStory(m) {
  const r = m.rec || { h: 0, f: 0, b: 0 }, fav = favCrop(m), tiles = Math.floor((m.walked || 0) / T);
  const next = BADGES.find(b => recOf(m, b.k) < b.n && (b.k !== 'f' || m.fish || r.f > 0));
  return `<div class="sec">Story</div><div class="card"><div class="s">${m.born != null ? 'Joined the farm ' + fmtTime(Math.max(0, S.playTime - m.born)) + ' of play ago' : 'One of the old hands'}${fav ? ` · Favourite crop: ${iconImg(fav, 'sm')} <b>${CROP[fav].name}</b>` : ''}</div>
    <div class="row wrap" style="margin-top:.3rem;gap:.25rem"><span class="chip">🌾 ${fmt(r.h)} harvested</span><span class="chip">🥾 ${fmt(tiles)} tiles walked</span>${r.b >= 1 ? `<span class="chip">🔨 ${fmtTime(r.b)} building</span>` : ''}${r.f ? `<span class="chip">🎣 ${fmt(r.f)} caught</span>` : ''}</div>
    <div style="margin-top:.35rem">${BADGES.map(b => `<span class="badge ${recOf(m, b.k) >= b.n ? '' : 'off'}">${b.icon} ${b.name}</span>`).join('')}</div>
    ${next ? `<div class="s" style="margin-top:.3rem">Next badge: <b>${next.name}</b> (${next.how.toLowerCase()})</div>` : ''}</div>`;
}
const storySig = m => ':' + Math.floor(((m.rec && m.rec.h) || 0) / 5) + ':' + badgesOf(m).length + ':' + Math.floor((m.walked || 0) / T / 40) + ':' + Math.floor(((m.rec && m.rec.b) || 0) / 10);

// ---------------------------------------------------------------- crop mastery
function masteryStarsHtml(id) {
  const st = masteryStars(id), cls = ['b', 'v', 'g'];
  return '<span class="mstar">' + [0, 1, 2].map(k => k < st ? `<span class="${cls[k]}">★</span>` : '<span class="o">☆</span>').join('') + '</span>';
}
function masteryLine(id) {
  const c = CROP[id]; if (!c || c.flower) return '';
  const st = masteryStars(id), n = S.lifetime[id] || 0;
  return `<div class="card" style="padding:.35rem .6rem"><div class="s">${masteryStarsHtml(id)} ${st ? `<b>${MASTERY_NAME[st]} mastery</b>: grows ${Math.round(st * MASTERY_GROW * 100)}% faster, sells for ${Math.round(st * MASTERY_SELL * 100)}% more` : 'No mastery yet'}${st < 3 ? ` · ${fmt(n)} / ${fmt(MASTERY[st])} banked for ${MASTERY_NAME[st + 1]}` : ''}</div></div>`;
}
const _plotBody4 = PANELS.plot.body, _plotSig4 = PANELS.plot.sig;
PANELS.plot.body = p => _plotBody4(p).replace('<div class="sec">Choose a crop</div>', masteryLine(S.plots[p.id].crop) + '<div class="sec">Choose a crop</div>');
PANELS.plot.sig = p => _plotSig4(p) + ':' + masteryStars(S.plots[p.id].crop) + ':' + Math.floor((S.lifetime[S.plots[p.id].crop] || 0) / 10);

// ---------------------------------------------------------------- the daily visitor
function openVisitor() {
  if (!visitorHere()) return;
  const V = S.visitor, k = Object.keys(V.req)[0], have = Math.min(S.inv[k] || 0, V.req[k]), ok = visitorCanFill();
  modal(`<h2>${VISITORS[V.who]}</h2><p class="p">“${V.got && V.done ? 'Much obliged! I\'ll be back this way tomorrow.' : 'Lovely meadow you have here. I brought you a little something, and I\'m after a favour if you can manage it.'}”</p>
    <div class="card" style="text-align:left"><div class="row"><span style="font-size:2rem">🎁</span><div class="grow"><div class="t">Today's gift</div><div class="s">${giftText(V.gift)}</div></div>
      ${V.got ? '<b class="s">✓ Taken</b>' : '<button class="btn sm gold" data-a="gift">Take it</button>'}</div></div>
    <div class="card ${ok ? 'sel' : ''}" style="text-align:left"><div class="row">${iconImg(k, 'lg')}<div class="grow"><div class="t">Today's request</div>
      <div class="s">${V.done ? 'Delivered. Thank you!' : `<span class="chip ${have >= V.req[k] ? 'ok' : 'bad'}">${iconImg(k, 'sm')}${fmt(have)}/${fmt(V.req[k])} ${ITEM[k].name}</span> for ${iconImg('coin', 'sm')}<b>${fmt(V.reward)}</b>`}</div></div>
      ${V.done ? '<b class="s">✓ Done</b>' : `<button class="btn sm green ${ok ? '' : 'dis'}" data-a="deliver">Deliver</button>`}</div></div>
    <p class="s">A traveller stops by once a day. There's no rush, and nothing is lost if you miss one.</p>
    <div class="btns"><button class="btn" data-a="close">Close</button></div>`, a => {
    if (a === 'gift') { takeGift(); openVisitor(); }
    else if (a === 'deliver') { if (fillVisitor()) openVisitor(); }
    else closeModal();
  });
}

// ---------------------------------------------------------------- taps the world answers
function tapFeel(w, t, sx, sy) {
  // the visitor and their cart
  if (FX.vpos && visitorHere() && Math.abs(w.x - (FX.vpos.x - 6)) < 36 && w.y > FX.vpos.y - 44 && w.y < FX.vpos.y + 18) { AUDIO.sfx('chirp'); openVisitor(); return true; }
  // a tap shoos a mouse or squirrel
  for (const p of PESTS) if (p.st !== 'carried' && p.st !== 'flee' && Math.hypot(p.x - w.x, p.y - 6 - w.y) < 20) {
    shoo(p, true); AUDIO.sfx('squeak');
    for (let k = 0; k < 5; k++) addPart({ type: 'poof', x: p.x + (Math.random() - 0.5) * 14, y: p.y - 4, max: 0.5, size: 6 });
    return true;
  }
  FX.scare(w.x, w.y, 46);
  for (const b of S.buildings) {
    const H = HUNTERS[b.type]; if (!H) continue;
    const g = GUARD[b.id], h = g && g.st !== 'home' ? g : guardHome(b);
    if (Math.hypot(h.x - w.x, h.y - 6 - w.y) < 17) { AUDIO.sfx(H.kind === 'owl' ? 'hoot' : H.kind === 'dog' ? 'bark' : 'meow'); addPart({ type: 'spark', x: h.x, y: h.y - 16, vy: -18, max: 0.8, size: 5 }); break; }
  }
  // a Meeple hops and chirps (its panel still opens)
  let best = null, bd = 22;
  for (const m of S.meeples) { const d = Math.hypot(m.x - w.x, m.y - 12 - w.y); if (d < bd) { bd = d; best = m; } }
  if (best) { FX.hop[best.id] = R.time; AUDIO.sfx('chirp'); m_emote(best); return false; }
  const bid = OCC[t.i] || GHMAP[t.i];
  if (bid && BMAP[bid]) {
    const b = BMAP[bid], ty = b.of ? 'site' : b.type;
    if (!b.of) FX.pop('b' + b.id, 'bounce', 0.42, 0.07);
    const snd = { coop: 'cluck', barn: 'moo', duckhouse: 'quack', doghouse: 'bark', cattree: 'meow', owlbox: 'hoot', well: 'plop', fountain: 'plop', birdbath: 'plop', dock: 'plop', site: 'tap', hive: 'rustle', flowers: 'rustle', topiary: 'rustle', gnome: 'tink', statue: 'tink', lantern: 'tink' }[ty];
    AUDIO.sfx(snd || 'knock');
    return false;
  }
  if (S.plots[t.i]) { FX.pop('p' + t.i, 'wobble', 0.55, 0.13); AUDIO.sfx('rustle'); return false; }
  const c = S.cover[t.i];
  if (c === COVER.WATER) { FX.ripple(w.x, w.y, true); AUDIO.sfx(Math.random() < 0.18 ? 'ribbit' : 'plop'); return false; }
  if (c === COVER.ROCK) { FX.pop('c' + t.i, 'bounce', 0.35, 0.06); AUDIO.sfx('tink'); for (let k = 0; k < 4; k++) addPart({ type: 'chip', x: w.x, y: w.y, vx: (Math.random() - 0.5) * 70, vy: -40 - Math.random() * 40, g: 300, max: 0.5, col: '#b8b0a2', size: 1.8, vr: 8 }); return false; }
  if (c) {
    // trees and brambles shake, and a leaf or two comes loose
    FX.pop('c' + t.i, 'wobble', 0.7, 0.1); AUDIO.sfx('rustle');
    const tx = (t.i % MW) * T + T / 2, ty = ((t.i / MW) | 0) * T;
    for (let k = 0; k < (c === COVER.BRUSH ? 2 : 3); k++) addPart({ type: 'leaf', x: tx + (Math.random() - 0.5) * 30, y: ty - (c === COVER.BRUSH ? 4 : 36) - Math.random() * 16, vy: 16, max: 2.6, col: ['#7cc25a', '#5aa84a', '#8ad060'][k % 3], size: Math.random() * 6 });
    return false;
  }
  // open grass: a little puff
  addPart({ type: 'poof', x: w.x, y: w.y, max: 0.4, size: 5 });
  return false;
}
function m_emote(m) { m.emo = { k: ['heart', 'note', 'wow'][(Math.random() * 3) | 0], t: 2.4 }; }

// ---------------------------------------------------------------- events
const _extraEvent4 = onExtraEvent;
onExtraEvent = function (e) {
  switch (e.t) {
    case 'sold': {
      // auto-sales in the same moment arrive as one little stream of coins from the Market
      UI.soldAcc = (UI.soldAcc || 0) + e.v;
      if (!UI.soldTimer) UI.soldTimer = setTimeout(() => { UI.soldTimer = 0; const v = UI.soldAcc; UI.soldAcc = 0; if (UI.inGame && v > 0) coinFly(marketPoint(), v); }, 150);
      return true;
    }
    case 'built': {
      const d = BUILDINGS[e.type];
      toast(`The <b>${d.name}</b> is finished!`, false, 'hammer');
      if (e.type === 'creator' && S.stats.made === 0) { const b = BMAP[e.b]; if (b) FX.focus((b.x + 1) * T, (b.y + 1) * T, { go: 0.6, hold: 1.2, back: true }); }
      if (UI.panel && UI.panel.type === 'site' && UI.panel.id === e.b) closePanel();
      return true;
    }
    case 'meeple': {
      const m = e.m, first = S.stats.made <= 2;
      celebrate({ title: 'Welcome, ' + esc(m.name) + '!', sub: (m.crop === 'founder' ? 'A new' : 'A ' + m.trait.toLowerCase() + ' ' + CROP[m.crop].name) + ' Meeple has joined the farm', icon: m.crop === 'founder' ? 'meeple' : m.crop, conf: first ? 70 : 24, cheer: false, sfx: 'meeple' });
      if (first && !UI.panel) FX.focus(m.x, m.y - 10, { z: Math.max(R.cam.z, 1.5), go: 0.6, hold: 1.5, back: true });
      return true;
    }
    case 'quest':
      if (e.r) coinFly(UI.claimAt || null, e.r);
      if (e.ri) toast('Pip hands over ' + rewardLabel(0, e.ri), false, e.ri[0] === '_decor' ? 'star' : e.ri[0]);
      FX.confetti(18);
      return true;
    case 'questready': AUDIO.sfx('ding'); if (UI.questMin) bump($('hint')); return true;
    case 'badge': {
      const m = S.meeples.find(x => x.id === e.m), b = BADGES.find(x => x.id === e.id); if (!m || !b) return true;
      FX.cheer[m.id] = R.time + 1.6; m_emote(m);
      celebrate({ title: esc(m.name) + ' earned a badge', sub: b.icon + ' ' + b.name + ': ' + b.how.toLowerCase(), emoji: '🏅', conf: 20, cheer: false });
      return true;
    }
    case 'mastery':
      celebrate({ title: CROP[e.id].name + ': ' + MASTERY_NAME[e.stars] + ' mastery', sub: 'Grows ' + Math.round(e.stars * MASTERY_GROW * 100) + '% faster and sells for ' + Math.round(e.stars * MASTERY_SELL * 100) + '% more', icon: e.id, conf: 50 });
      return true;
    case 'visitor': AUDIO.sfx('ding'); toast(`🎁 <b>${VISITORS[S.visitor.who]}</b> has stopped by the Market with a gift`, false); return true;
    case 'gift': if (e.g.k === 'coins') coinFly(null, e.g.n); AUDIO.sfx('buy'); toast('You got ' + giftText(e.g) + '!', false, e.g.k === 'coins' ? 'coin' : e.g.k === 'fert' ? 'fertilizer' : e.g.k === 'seed' ? e.g.id : e.g.k === 'hat' ? 'hat_' + e.g.id : 'star'); return true;
    case 'visitdone': coinFly(null, e.reward); toast(`Request delivered! +${fmt(e.reward)} coins`, false, 'orders'); return true;
    case 'orderdone': coinFly(null, e.o.reward + (e.o.bonus && e.o.bonus.k === 'coins' ? e.o.bonus.n : 0)); toast(`Order delivered! +${fmt(e.o.reward)} coins${e.o.bonus ? ' and ' + bonusText(e.o.bonus) : ''}`, false, 'orders'); return true;
    case 'find': if (e.what === 'coins' || e.what === 'relic') { const x = (e.i % MW) * T + T / 2, y = ((e.i / MW) | 0) * T; coinFly(worldPoint(x, y), e.n); } break;
    case 'ribbon': coinFly({ x: window.innerWidth / 2, y: window.innerHeight * 0.3 }, e.reward); celebrate({ title: 'Blue Ribbon #' + e.n + '!', sub: '+' + fmt(e.reward) + ' coins' + (e.decor ? ' and a ' + BUILDINGS[e.decor].name : ''), icon: 'ribbon', sfx: 'level', conf: 90 }); saveGame(); return true;
    case 'journal': celebrate({ title: 'Journal milestone!', sub: rewardText(JOURNAL[e.i].r), icon: 'journal', sfx: 'level', conf: 60 }); return true;
    case 'hammer': return true;
  }
  return _extraEvent4(e);
};
;(window.__stage = window.__stage || []).push('ui4.js loaded');
