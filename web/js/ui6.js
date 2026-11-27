// Meeple Meadows — interface, part 6: sweethearts on the Meeple card, the "build them a home" prompt, the cottage
// and its family, children you can tap, and acorns you can pick up yourself.
'use strict';

const mName = id => { const m = meepleById(id); return m ? esc(m.name) : 'someone'; };
const mPic = (m, w) => `<img src="${meepleURL(m.col, m.crop, m.hat)}" style="width:${w}rem;height:${(w * 1.13).toFixed(2)}rem">`;
const heartBar = v => `<div class="statbar" style="flex:1"><i style="width:${Math.max(0, Math.min(100, v)).toFixed(0)}%;background:#e8463a"></i></div>`;

// ---------------------------------------------------------------- "they've fallen in love": build them a home
function lovePrompt(P) {
  P = P || homelessPairs()[0];
  if (!P || !UI.inGame) return;
  const a = meepleById(P.a), b = meepleById(P.b); if (!a || !b) return;
  const cost = bCost('cottage'), can = S.coins >= cost, need = cottageWanted() > 0;
  modal(`<div class="row" style="justify-content:center;gap:.2rem">${mPic(a, 4)}<span style="font-size:2.2rem" class="burst">💞</span>${mPic(b, 4)}</div>
    <h2>${esc(a.name)} and ${esc(b.name)} are in love!</h2>
    <p class="p">${need ? `Build them a <b>Cottage</b> and they'll move in together. Before long there'll be a child, who grows up to be a new Meeple for the farm, with no trip to the Creator.` : `Their Cottage is already on the way. They'll move in the moment it's finished.`}</p>
    ${need ? `<div class="row" style="justify-content:center;gap:.5rem"><img class="bimg" style="width:4.2rem;height:4.2rem" src="${buildingURL('cottage')}">${costHtml(cost)}</div>${can ? '' : `<p class="s">You need ${fmt(cost - S.coins)} more coins. The <b>♥ Home</b> button will wait at the side of the screen until you're ready.</p>`}` : ''}
    <div class="btns">${need ? `<button class="btn green ${can ? '' : 'dis'}" data-a="build">${iconImg('hammer')} Build a Cottage</button>` : ''}<button class="btn" data-a="later">${need ? 'Later' : 'Lovely'}</button></div>`,
    act => { if (act === 'build' && S.coins < bCost('cottage')) return; closeModal(); if (act === 'build') { setMode('place', 'cottage'); toast('Tap on cleared land to place their Cottage', false, 'hammer'); } });
}
// a cottage needs a couple waiting for it
const _owt6 = onWorldTap;
onWorldTap = function (sx, sy) {
  if (UI.mode === 'place' && UI.placeType === 'cottage' && cottageWanted() <= 0) { toast('A Cottage is for two Meeples in love. Nobody is waiting for one just now', true); setMode(null); return; }
  _owt6(sx, sy);
};

// ---------------------------------------------------------------- alerts
const _xa6 = extraAlerts;
extraAlerts = function (items) {
  _xa6(items);
  if (homeNag()) items.push(`<button class="pill alert good" data-a="lovehome"><span style="font-size:1.2rem;padding-left:.3rem">💞</span><span>Home</span></button>`);
};
const _xac6 = extraAlertClick;
extraAlertClick = function (a) { if (a === 'lovehome') lovePrompt(); else _xac6(a); };

// ---------------------------------------------------------------- Build → Homestead: the cottage
const _buildBody6 = PANELS.build.body, _buildSig6 = PANELS.build.sig;
PANELS.build.sig = p => _buildSig6(p) + ':' + cottageWanted() + ':' + (S.pairs || []).length;
PANELS.build.body = p => {
  let h = _buildBody6(p);
  if (p.tab !== 'core') return h;
  const want = cottageWanted(), cost = bCost('cottage'), n = bCount('cottage'), wait = homelessPairs()[0];
  h += `<div class="card ${want > 0 ? '' : 'locked'}"><div class="row"><img class="bimg" src="${buildingURL('cottage')}"><div class="grow"><div class="t">Cottage</div><div class="s">${BUILDINGS.cottage.desc}</div>
    <div class="row" style="margin-top:.3rem">${want > 0 ? `${costHtml(cost)}<span class="s">for ${mName(wait.a)} and ${mName(wait.b)}${popRoom() ? '' : ' (no room for more children just now)'}</span><span class="grow"></span><button class="btn sm green ${S.coins < cost ? 'dis' : ''}" data-a="build" data-v="cottage">Place</button>`
      : `<span class="s">💞 ${n ? n + ' built. ' : ''}Waits for two Meeples to fall in love. Fondness grows when sweethearts are near each other; see the ♥ on any Meeple's card.</span>`}</div></div></div></div>`;
  return h;
};

// ---------------------------------------------------------------- the Meeple card: who they're sweet on
LIVE_X.love = id => { const m = meepleById(+id), P = m && pairOf(m); return P ? Math.floor(P.love) + '%' : ''; };
LIVE_X.loveb = id => { const m = meepleById(+id), P = m && pairOf(m); return P ? P.love / 100 : 0; };
LIVE_X.nest = id => { const b = BMAP[id], P = b && (S.pairs || []).find(x => x.home === b.id), st = nestState(P); return st.k === 'nesting' || st.k === 'raising' ? fmtTime(st.left) : ''; };
LIVE_X.nestb = id => { const b = BMAP[id], P = b && (S.pairs || []).find(x => x.home === b.id), st = nestState(P); return st.frac || 0; };
LIVE_X.kidt = id => { const k = (S.kids || []).find(x => x.id == id); return k ? fmtTime(KID_T - k.t) : ''; };
LIVE_X.kidb = id => { const k = (S.kids || []).find(x => x.id == id); return k ? k.t / KID_T : 1; };
function loveCard(m) {
  const P = pairOf(m), o = partnerOf(m);
  const kin = (m.kin || []).map(meepleById).filter(Boolean), kids = S.meeples.filter(x => (x.kin || []).includes(m.id)).concat((S.kids || []).filter(k => k.pa === m.id || k.pb === m.id));
  let fam = '';
  if (m.homeborn) fam += `<div class="s" style="margin-top:.25rem">🏡 Born and raised here${kin.length ? ', child of <b>' + kin.map(x => esc(x.name)).join('</b> and <b>') + '</b>' : ''}.</div>`;
  if (kids.length) fam += `<div class="s" style="margin-top:.25rem">👪 Parent of <b>${kids.map(x => esc(x.name)).join('</b>, <b>')}</b>.</div>`;
  if (!P || !o) return `<div class="card"><div class="row">${iconImg('love', 'lg')}<div class="grow"><div class="t">Heart: free <span class="s">· ${romName(m)}</span></div><div class="s">${S.meeples.length < 2 ? 'There\'s nobody else here yet.' : 'Nobody has caught their eye yet. It happens when two free hearts keep crossing paths.'}</div>${fam}</div></div></div>`;
  if (P.st === 'sweet') return `<div class="card"><div class="row">${iconImg('love', 'lg')}<div class="grow"><div class="t">Sweet on ${esc(o.name)} <span class="s">· ${romName(m)}</span></div>
    <div class="row" style="gap:.4rem;margin:.2rem 0"><div class="bar" style="flex:1"><i data-bar="loveb:${m.id}" style="background:#e8463a"></i></div><b class="s" data-live="love:${m.id}"></b></div>
    <div class="s">Grows whenever the two are near each other, faster on a charming farm and when they're feeling wonderful. At 100% they'll want a home of their own.</div>${fam}</div>${mPic(o, 2.6)}</div>
    <div class="row" style="margin-top:.3rem"><span class="grow"></span><button class="btn sm" data-a="mlove" data-v="${o.id}">Find ${esc(o.name)}</button></div></div>`;
  const home = homeOf(P), st = nestState(P);
  const line = !home ? (cottageWanted() > 0 ? 'They\'re hoping for a <b>Cottage</b> of their own.' + (popRoom() ? '' : ` ${famCap() >= FAMILY_MAX ? `The farm has raised all the children it can (${FAMILY_MAX}).` : `The farm has all the children it can look after for now. There'll be room for another at level ${famNextLevel() + 1}.`}`) : 'Their Cottage is being built.')
    : st.k === 'nesting' ? `At home in their Cottage. A little one is on the way: <b data-live="nest:${home.id}"></b>.`
    : st.k === 'raising' ? `Raising <b>${esc(st.kid.name)}</b>, who'll be grown in <b data-live="nest:${home.id}"></b>.`
    : st.k === 'full' ? `At home in their Cottage. ${famCap() >= FAMILY_MAX ? `The farm has raised all the children it can (${FAMILY_MAX}).` : `The farm has all the children it can look after for now. There'll be room for another at level ${famNextLevel() + 1}.`}` : 'At home in their Cottage, with a family all grown up.';
  return `<div class="card" style="background:#fff0f0"><div class="row">${iconImg('love', 'lg')}<div class="grow"><div class="t">In love with ${esc(o.name)}</div><div class="s">${line}</div>${fam}</div>${mPic(o, 2.6)}</div>
    <div class="row" style="margin-top:.3rem"><span class="grow"></span>${!home && cottageWanted() > 0 ? `<button class="btn sm green" data-a="mhome">Build a Cottage</button>` : ''}${home ? `<button class="btn sm" data-a="mcot" data-v="${home.id}">Cottage</button>` : ''}<button class="btn sm" data-a="mlove" data-v="${o.id}">Find ${esc(o.name)}</button></div></div>`;
}
const _meepleBody6 = PANELS.meeple.body, _meepleSig6 = PANELS.meeple.sig, _meepleAct6 = PANELS.meeple.act;
PANELS.meeple.sig = p => { const m = meepleById(p.id), P = m && pairOf(m), st = P ? nestState(P) : null; return _meepleSig6(p) + ':' + (P ? P.st + P.a + P.b + Math.floor(P.love / 4) + P.home + st.k + (P.kids | 0) : 'free') + cottageWanted() + S.meeples.length + (S.kids || []).length; };
PANELS.meeple.body = p => { const m = meepleById(p.id), h = _meepleBody6(p), cut = h.indexOf('<div class="sec">Jobs</div>'); return cut < 0 ? h + loveCard(m) : h.slice(0, cut) + loveCard(m) + h.slice(cut); };
PANELS.meeple.act = (a, v) => {
  if (a === 'mlove') { const o = meepleById(+v); if (o) { FX.focus(o.x, o.y); openPanel('meeple', o.id); } return 'stop'; }
  if (a === 'mhome') { const m = meepleById(UI.panel ? UI.panel.id : 0), P = m && pairOf(m); closePanel(); lovePrompt(P || null); return 'stop'; }
  if (a === 'mcot') { const b = BMAP[+v]; if (b) { focusB(b); openPanel('bldg', b.id); } return 'stop'; }
  return _meepleAct6 ? _meepleAct6(a, v) : undefined;
};
// a heart beside sweethearts in the Meeples list
const _meeplesBody6 = PANELS.meeples.body, _meeplesSig6 = PANELS.meeples.sig;
PANELS.meeples.sig = () => _meeplesSig6() + ':' + (S.pairs || []).map(P => P.st[0] + P.a).join('') + (S.kids || []).length;
PANELS.meeples.body = () => {
  let h = _meeplesBody6();
  for (const m of S.meeples) { const P = pairOf(m), o = partnerOf(m); if (P && o) h = h.replace(`<div class="s" data-live="mt:${m.id}"></div>`, `<div class="s" data-live="mt:${m.id}"></div><div class="s">${P.st === 'sweet' ? '♡ sweet on ' : '♥ in love with '}${esc(o.name)}</div>`); }
  if ((S.kids || []).length) h += `<div class="sec">Children</div>` + S.kids.map(k => `<div class="card"><div class="row"><img src="${meepleURL(k.col, k.crop, null)}" style="width:2rem;height:2.25rem"><div class="grow"><div class="t">${esc(k.name)} <span class="s">· child of ${mName(k.pa)} and ${mName(k.pb)}</span></div><div class="s">Grown up in <span data-live="kidt:${k.id}"></span></div></div><button class="btn sm" data-a="kfind" data-v="${k.id}">Find</button></div></div>`).join('');
  return h;
};
const _meeplesAct6 = PANELS.meeples.act;
PANELS.meeples.act = (a, v, P, el) => {
  if (a === 'kfind') { const k = (S.kids || []).find(x => x.id === +v); if (k) { FX.focus(k.x, k.y); openKid(k); } return 'stop'; }
  return _meeplesAct6 ? _meeplesAct6(a, v, P, el) : undefined;
};

// ---------------------------------------------------------------- the cottage card
const _bldgBody6 = PANELS.bldg.body, _bldgSig6 = PANELS.bldg.sig, _bldgAct6 = PANELS.bldg.act;
PANELS.bldg.sig = p => { const b = BMAP[p.id]; if (!b || b.type !== 'cottage') return _bldgSig6(p); const P = (S.pairs || []).find(x => x.home === b.id); return 'cot' + (P ? P.a + ':' + P.b + nestState(P).k + (P.kids | 0) + P.kid : 'empty') + cottageWanted(); };
PANELS.bldg.body = p => {
  const b = BMAP[p.id];
  if (b.type !== 'cottage') return _bldgBody6(p);
  const P = (S.pairs || []).find(x => x.home === b.id), tail = `<div class="sec">Building</div><div class="row"><button class="btn sm" data-a="move">${iconImg('move', 'sm')} Move</button><button class="btn sm red" data-a="demolish">${iconImg('trash', 'sm')} Demolish</button></div>`;
  if (!P) return `<p class="p">Nobody lives here yet. The next two Meeples to fall in love will move straight in.</p>` + tail;
  const a = meepleById(P.a), c = meepleById(P.b), st = nestState(P), grown = S.meeples.filter(m => (m.kin || []).includes(P.a) && (m.kin || []).includes(P.b));
  let h = `<div class="card" style="background:#fff0f0"><div class="row">${mPic(a, 3.2)}<span style="font-size:1.6rem">💞</span>${mPic(c, 3.2)}<div class="grow"><div class="t">${esc(a.name)} and ${esc(c.name)}</div><div class="s">Home sweet home.</div></div></div>
    <div class="row" style="margin-top:.3rem"><span class="grow"></span><button class="btn sm" data-a="cfind" data-v="${a.id}">Find ${esc(a.name)}</button><button class="btn sm" data-a="cfind" data-v="${c.id}">Find ${esc(c.name)}</button></div></div>`;
  if (st.k === 'nesting') h += `<div class="card"><div class="t">🍼 A little one is on the way</div><div class="bar" style="margin:.3rem 0"><i data-bar="nestb:${b.id}"></i></div><div class="s">Arriving in <b data-live="nest:${b.id}"></b>.</div></div>`;
  else if (st.k === 'raising') h += `<div class="card"><div class="row"><img src="${meepleURL(st.kid.col, st.kid.crop, null)}" style="width:2.2rem;height:2.5rem"><div class="grow"><div class="t">Raising ${esc(st.kid.name)}</div><div class="bar" style="margin:.3rem 0"><i data-bar="nestb:${b.id}"></i></div><div class="s">All grown up in <b data-live="nest:${b.id}"></b>, and then a Meeple like any other.</div></div><button class="btn sm" data-a="kfind" data-v="${st.kid.id}">Find</button></div></div>`;
  else if (st.k === 'full') h += `<div class="card"><div class="s">${famCap() >= FAMILY_MAX ? `The farm has raised all the children it can (${FAMILY_MAX}).` : `The farm has all the children it can look after for now. There'll be room for another at level ${famNextLevel() + 1}.`}</div></div>`;
  else if (st.k === 'done') h += `<div class="card"><div class="s">Their family is complete: ${KID_LIMIT} children, all grown.</div></div>`;
  if (grown.length) h += `<div class="s" style="margin:.3rem 0">👪 Raised here: <b>${grown.map(m => esc(m.name)).join('</b>, <b>')}</b>${st.k === 'nesting' || st.k === 'raising' ? '' : '.'}</div>`;
  return h + tail;
};
PANELS.bldg.act = (a, v, P, el) => {
  if (a === 'cfind') { const m = meepleById(+v); if (m) { FX.focus(m.x, m.y); openPanel('meeple', m.id); } return 'stop'; }
  if (a === 'kfind') { const k = (S.kids || []).find(x => x.id === +v); if (k) { FX.focus(k.x, k.y); openKid(k); } return 'stop'; }
  return _bldgAct6 ? _bldgAct6(a, v, P, el) : undefined;
};

// ---------------------------------------------------------------- children
PANELS.kid = {
  valid: p => (S.kids || []).some(k => k.id === p.id),
  head: p => { const k = S.kids.find(x => x.id === p.id); return `<img src="${meepleURL(k.col, k.crop, null)}" style="width:2.1rem;height:2.4rem"><h2>${esc(k.name)}<small>Child of ${mName(k.pa)} and ${mName(k.pb)}</small></h2>`; },
  sig: p => { const k = S.kids.find(x => x.id === p.id); return k.name + (k.in ? 'in' : '') + (k.t > KID_T * 0.3 ? 'a' : ''); },
  body: p => {
    const k = S.kids.find(x => x.id === p.id), pa = meepleById(k.pa), pb = meepleById(k.pb);
    return `<div class="card"><div class="row"><img src="${meepleURL(k.col, k.crop, null)}" style="width:3.4rem;height:3.85rem"><div class="grow"><div class="t">Growing up</div><div class="bar" style="margin:.3rem 0"><i data-bar="kidb:${k.id}"></i></div>
      <div class="s">A grown Meeple in <b data-live="kidt:${k.id}"></b>. ${k.in ? 'Fast asleep indoors just now.' : k.t > KID_T * 0.3 ? 'Old enough to gather acorns for the family.' : 'Too little to help yet, but very good at getting underfoot.'}</div></div></div></div>
      <p class="s">Takes after ${k.crop === 'founder' ? 'the founder' : 'the ' + CROP[k.crop].name.toLowerCase() + ' side of the family'}. Speed, strength and quick hands come from both parents.</p>
      <div class="row">${pa ? `<button class="btn sm" data-a="cfind" data-v="${pa.id}">Find ${esc(pa.name)}</button>` : ''}${pb ? `<button class="btn sm" data-a="cfind" data-v="${pb.id}">Find ${esc(pb.name)}</button>` : ''}</div>`;
  },
  act: (a, v) => { if (a === 'cfind') { const m = meepleById(+v); if (m) { FX.focus(m.x, m.y); openPanel('meeple', m.id); } return 'stop'; } },
};
function openKid(k) { openPanel('kid', k.id); R.sel = { kind: 'm', id: k.id }; }

// ---------------------------------------------------------------- taps: children, and acorns you pick up yourself
const _tf6 = tapFeel;
tapFeel = function (w, t, sx, sy) {
  for (const k of S.kids || []) if (!k.in && Math.hypot(k.x - w.x, k.y - 9 - w.y) < 16) { k.hop = 0.5; k.emo = { k: 'heart', t: 1.6 }; AUDIO.sfx('peep'); openKid(k); return true; }
  let best = null, bd = 13;
  for (const a of S.acorns || []) { if (a.fall > 0) continue; const d = Math.hypot(a.x - w.x, a.y - 3 - w.y); if (d < bd) { bd = d; best = a; } }
  if (best) { takeAcorn(best); invAdd('acorns', 1); addPart({ type: 'float', x: best.x, y: best.y - 16, vy: -24, max: 0.9, icon: 'acorns', text: '+1' }); AUDIO.sfx('pop'); return true; }
  return _tf6(w, t, sx, sy);
};

// ---------------------------------------------------------------- what everyone is doing
const _mt6 = meepleTask;
meepleTask = function (m) {
  const t = m && m.task;
  if (t && t.type === 'gather') return 'Picking up acorns';
  if (t && t.type === 'court') { const o = meepleById(t.o); return 'Spending a moment with ' + (o ? o.name : 'a sweetheart'); }
  return _mt6(m);
};
const _ps6 = procStatus;
procStatus = function (b) {
  if (b && b.type === 'oaktree' && treeGrown(b) && b.recipe && b.phase === 'work') {
    if (oakLaden(b)) return 'Heavy with acorns. They\'ll fall once the ones underneath are picked up';
    const r = RECIPE[b.recipe], f = b.t / r.t;
    return (f < 0.15 ? 'In catkin' : f < 0.6 ? 'Acorns swelling' : 'Acorns browning') + '… they drop in ' + fmtTime((r.t - b.t) / craftMult());
  }
  return _ps6(b);
};

// ---------------------------------------------------------------- moments
let _sparkToasts = 0;
const _extraEvent6 = onExtraEvent;
onExtraEvent = function (e) {
  switch (e.t) {
    case 'spark':
      if (_sparkToasts++ < 3 || Math.random() < 0.4) toast(`💕 <b>${mName(e.a)}</b> and <b>${mName(e.b)}</b> have taken a shine to each other.`, false);
      AUDIO.sfx('twinkle');
      return true;
    case 'inlove': {
      const a = meepleById(e.a), b = meepleById(e.b), P = a && pairOf(a);
      if (!a || !b) return true;
      // once the farm has all the homes it can use, later couples are happy news rather than a job to do
      if (!homeNag()) { toast(`💞 <b>${esc(a.name)}</b> and <b>${esc(b.name)}</b> have fallen in love.`, false); AUDIO.sfx('wish'); return true; }
      FX.focus((a.x + b.x) / 2, (a.y + b.y) / 2 - 10, { z: Math.max(R.cam.z, 1.3), go: 0.6, hold: 1.4, back: true });
      celebrate({ title: `${esc(a.name)} ♥ ${esc(b.name)}`, sub: "They've fallen in love!", emoji: '💞', sfx: 'wish', conf: 30 }, () => setTimeout(() => {
        if (!UI.inGame || !homeNag()) return;
        // the first couple waiting gets the full prompt; after that a reminder is enough (the Home button stays at the side)
        if (cottageWanted() === 1 && !modalOpen() && !UI.mode && !UI.photo) lovePrompt(P);
        else toast(`💞 <b>${esc(a.name)}</b> and <b>${esc(b.name)}</b> would love a <b>Cottage</b> of their own (Build → Homestead).`, false);
      }, 2300));
      saveGame();
      return true;
    }
    case 'movedin': toast(`🏡 <b>${mName(e.a)}</b> and <b>${mName(e.b)}</b> have moved into their Cottage.`, false); AUDIO.sfx('built'); return true;
    case 'baby': {
      const k = (S.kids || []).find(x => x.id === e.k); if (!k) return true;
      FX.focus(k.x, k.y - 20, { z: Math.max(R.cam.z, 1.4), go: 0.6, hold: 1.8, back: true });
      celebrate({ title: 'A little one!', sub: `${esc(k.name)}, child of ${mName(k.pa)} and ${mName(k.pb)}`, emoji: '🍼', sfx: 'meeple', conf: 50 });
      saveGame();
      return true;
    }
    case 'grownup': {
      const m = meepleById(e.m); if (!m) return true;
      celebrate({ title: `${esc(m.name)} is all grown up`, sub: 'A new Meeple for the farm, raised right here', icon: 'meeple', sfx: 'meeple', conf: 60 });
      saveGame();
      return true;
    }
  }
  return _extraEvent6(e);
};
;(window.__stage = window.__stage || []).push('ui6.js loaded');
