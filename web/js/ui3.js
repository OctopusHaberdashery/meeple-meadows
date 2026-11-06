// Meeple Meadows — UI for critters and growing things: pest status, bee flowers, the seed shop,
// orchard trees, hive and duck details, and their messages.
'use strict';

// ---------------------------------------------------------------- plots
function plotStatusX(p) {
  const pest = p.pest && pestById(p.pest);
  if (pest && pest.kind === 'mouse') return '🐭 A field mouse is nibbling! A Meeple will shoo it (an owl or cat would catch it)';
  if (pest && pest.kind === 'squirrel') return '🐿 A squirrel is after the harvest!';
  if (p.dmg) return '🐭 Chewed by a mouse: it won\'t grow until a Meeple tends it';
  if (CROP[p.crop].flower) return p.st === 3 ? '🌼 In bloom. Bees from a hive within 4 tiles love it' : p.st === 0 ? 'Waiting to be planted' : 'Budding… blooms in ' + fmtTime((growTarget(p) - p.t) / growMult(p));
  return null;
}
const flowerCell = (f, sel, act) => {
  if (!cropUnlocked(f.id)) return `<div class="cell locked"><div style="font-size:1.6rem;height:2.3rem">🔒</div>Lv ${f.lvl + 1}</div>`;
  return `<div class="cell ${sel ? 'sel' : ''}" data-a="${act}" data-v="${f.id}">${iconImg(f.id)}${f.name}<div class="s">+${Math.round(f.bee * 100)}% honey speed</div></div>`;
};
const flowersHtml = (sel, act) => bUnlocked('hive') ? `<div class="sec">Flowers for bees</div><div class="grid">${FLOWERS.map(f => flowerCell(f, sel === f.id, act)).join('')}</div>
  <p class="s">Flowers bloom and stay in bloom; they're never harvested. Each one within 4 tiles of a beehive makes honey faster, and every 3 add an extra honey per batch.</p>` : '';
const _plotBody = PANELS.plot.body;
PANELS.plot.body = p => {
  const pl = S.plots[p.id];
  let h = _plotBody(p).replace('</div><div class="sec">Quick actions</div>', '</div>' + flowersHtml(pl.crop, 'crop') + '<div class="sec">Quick actions</div>');
  if (CROP[pl.crop].flower) h = h.replace(/<p class="s">Sells for[\s\S]*?<\/p>/, '<p class="s">Flowers are for the bees: nothing to harvest. Changing the crop restarts the plot.</p>');
  return h;
};
const _plotHead = PANELS.plot.head;
PANELS.plot.head = p => CROP[S.plots[p.id].crop].flower ? _plotHead(p).replace(/Growing /, 'Blooming ') : _plotHead(p);
const _cropsBody = PANELS.crops.body;
PANELS.crops.body = p => _cropsBody(p) + flowersHtml(UI.paintCrop, 'paint');

// ---------------------------------------------------------------- crafting-building extras
function procExtraHtml(b) {
  if (b.type === 'hive') {
    const f = hiveFlowers(b);
    return `<div class="card" style="margin-top:.5rem"><div class="t">🌼 ${f.n} blooming flower${f.n === 1 ? '' : 's'} nearby</div>
      <div class="s">${f.n ? `Honey comes ${Math.round(f.speed * 100)}% faster${f.extra ? ` and each batch gives ${f.extra} extra` : ''}.` : 'Plant flowers within 4 tiles (Crops → Flowers for bees) for faster honey.'} Bees also leave beeswax for the Chandlery about every other batch.</div></div>`;
  }
  if (b.type === 'duckhouse') return `<p class="s" style="margin-top:.4rem">The ducks drop feathers into storage as they go, handy for feather pillows at the Weaving Loom.</p>`;
  if (BUILDINGS[b.type].tree) {
    const tr = TREE_OF[b.type];
    return `<div class="card" style="margin-top:.5rem"><div class="row">${iconImg(tr.prod, 'lg')}<div class="grow"><div class="t">${treeGrown(b) ? 'Fully grown' : 'Growing up'}</div>
      <div class="s">${treeGrown(b) ? `Gives ${ITEM[tr.prod].name.toLowerCase()} on its own; haulers carry it to storage.` : `A young ${tr.name.toLowerCase()} takes about ${fmtTime(TREE_GROW)} of play to grow.`}</div></div></div></div>`;
  }
  return '';
}

// ---------------------------------------------------------------- trees in the Build menu
function treeCard(t) {
  const d = BUILDINGS[t], tr = TREE_OF[t], have = S.inv[tr.seed] || 0, n = bCount(t), locked = !bUnlocked(t);
  return `<div class="card ${locked ? 'locked' : ''}"><div class="row"><img class="bimg" src="${buildingURL(t)}"><div class="grow"><div class="t">${d.name}</div><div class="s">${d.desc}</div>
    <div class="row" style="margin-top:.3rem">${locked ? `<span class="s">🔒 Unlocks at level ${d.lvl + 1}</span>` : `<span class="chip ${have ? 'ok' : ''}">${iconImg(tr.seed, 'sm')}${have} seedling${have === 1 ? '' : 's'}</span><span class="s">${n ? n + ' planted' : ''}</span><span class="grow"></span>
    ${have ? '' : `<button class="btn sm" data-a="open" data-v="market" data-tab="seeds">Buy</button>`}<button class="btn sm green ${have && n < d.max ? '' : 'dis'}" data-a="build" data-v="${t}">Plant</button>`}</div></div></div></div>`;
}

// ---------------------------------------------------------------- the seed shop
const seedPrice = tr => Math.round(tr.buy * Math.pow(1.15, S.buildings.filter(b => b.type === tr.id).length));
PANELS.market.tabs.push(['seeds', 'Seeds', () => bUnlocked('oaktree')]);
const _mktBody = PANELS.market.body, _mktSig = PANELS.market.sig;
PANELS.market.body = p => {
  if (p.tab !== 'seeds') return _mktBody(p);
  let h = `<p class="s">Seedlings to plant from Build → Trees. Each grows up in about ${fmtTime(TREE_GROW)} of play, then gives sap, nuts or withies forever. Clearing woodland trees sometimes leaves a seedling too.</p>`;
  for (const tr of TREES) {
    const c = seedPrice(tr), have = S.inv[tr.seed] || 0;
    h += `<div class="card"><div class="row">${iconImg(tr.seed, 'lg')}<div class="grow"><div class="t">${tr.seedName}</div><div class="s">Grows into ${/^[aeiou]/i.test(tr.name) ? 'an' : 'a'} ${tr.name.toLowerCase()} that gives ${ITEM[tr.prod].name.toLowerCase()} · you have ${have}</div></div>
      <button class="btn sm green ${S.coins < c ? 'dis' : ''}" data-a="buyseed" data-v="${tr.id}">${iconImg('coin', 'sm')}${fmt(c)}</button></div></div>`;
  }
  return h;
};
PANELS.market.sig = p => p.tab === 'seeds' ? TREES.map(tr => (S.inv[tr.seed] || 0) + (S.coins >= seedPrice(tr) ? 'y' : 'n')).join() : _mktSig(p);
PANELS.market.act = (a, v) => {
  if (a !== 'buyseed') return;
  const tr = TREE_OF[v], c = seedPrice(tr);
  if (S.coins < c) { toast('Not enough coins', true); return; }
  S.coins -= c; invAdd(tr.seed, 1, false); AUDIO.sfx('buy');
  toast(`Bought a ${tr.seedName.toLowerCase()}. Plant it from Build → Trees`, false, tr.seed);
};
// "Buy" on a tree card opens the market straight on the Seeds tab
$('panel').addEventListener('click', e => {
  const el = e.target.closest('[data-tab]'); if (!el) return;
  e.stopImmediatePropagation(); AUDIO.sfx('click'); openPanel(el.dataset.v, null, el.dataset.tab);
}, true);

// ---------------------------------------------------------------- messages
const _extraEvent3 = onExtraEvent;
onExtraEvent = function (e) {
  switch (e.t) {
    case 'pestfirst':
      AUDIO.sfx('error');
      toast(e.kind === 'mouse' ? 'Field mice are nibbling your crops! Meeples will shoo them, but a <b>Barn Owl Box</b> or <b>Cat Tree</b> (Build → Farm) stops them for good.'
        : 'Squirrels are stealing ripe crops! A <b>Dog House</b> or <b>Cat Tree</b> (Build → Farm) will chase them off.', true, e.kind === 'mouse' ? 'wheat' : 'acorns');
      return true;
    case 'treegrown': { const b = BMAP[e.b]; if (b) toast(`Your ${BUILDINGS[b.type].name.toLowerCase()} is fully grown!`, false, TREE_OF[b.type].prod); return true; }
    case 'nibble': case 'stolen': case 'dropped': case 'scare': case 'pounce': case 'caught': case 'mend': case 'hunt': return true;
  }
  return _extraEvent3(e);
};
;(window.__stage = window.__stage || []).push('ui3.js loaded');
