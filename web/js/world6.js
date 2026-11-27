// Meeple Meadows — world, part 6: acorns that fall and are picked up one by one; sweethearts, cottages and children.
'use strict';

BUILDINGS.cottage = { name: 'Cottage', w: 2, h: 2, cost: 600, grow: 1.5, lvl: 0, cat: 'homes', charm: 2, home: 1,
  desc: 'A snug home for two Meeples in love. Once they move in they can raise a child, who grows up to work the farm.' };

function ensure6() {
  if (!S.acorns) S.acorns = [];
  if (!S.pairs) S.pairs = [];
  if (!S.kids) S.kids = [];
  if (S.stats.born == null) S.stats.born = 0;
}

// ---------------------------------------------------------------- acorns
// An oak doesn't hand over a tidy batch any more: its acorns drop around it, and each one is walked to and picked up.
const ACORN_MAX = 90, ACORN_PER_TREE = 8, ACORN_WILD_MAX = 5, ACORN_FALL = 0.95, ACORN_LAND = 0.35;
let ACORN_TILE = {}, ACORN_FREE = 0, _acSkip = 0, _wildT = 30;
function acornSpot(cx, cy, rmin, rmax) {
  for (let k = 0; k < 16; k++) {
    const a = Math.random() * Math.PI * 2, d = rmin + Math.random() * (rmax - rmin), x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * 0.8;
    const tx = Math.floor(x / T), ty = Math.floor(y / T);
    if (!inMap(tx, ty)) continue;
    const i = idx(tx, ty);
    if (!walkable(i) || S.floor[i] === FLOOR.PLOT || (GHMAP && GHMAP[i])) continue;
    return { x: Math.max(tx * T + 5, Math.min(tx * T + T - 5, x)), y: Math.max(ty * T + 6, Math.min(ty * T + T - 4, y)) };
  }
  return null;
}
function dropAcorn(x, y, src, fx, fh, delay) {
  const a = { id: S.nextId++, x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, src: src || 0, t: S.playTime, fall: ACORN_FALL + (delay || 0), fx: Math.round(fx), fh: Math.round(fh) };
  S.acorns.push(a);
  return a;
}
// called when an oak's acorns are ready. If the ground around it is already covered it holds on to them.
function shedAcorns(b) {
  ensure6();
  const r = RECIPE[b.recipe];
  let near = 0; for (const a of S.acorns) if (a.src === b.id) near++;
  if (near >= ACORN_PER_TREE || S.acorns.length >= ACORN_MAX) { b.t = r.t; return false; }
  const n = r.out[1] + batchDone(b), cx = (b.x + 0.5) * T, cy = (b.y + 0.5) * T;
  let made = 0;
  for (let k = 0; k < n; k++) {
    const p = acornSpot(cx, cy + 8, T * 0.55, T * 1.75); if (!p) break;
    dropAcorn(p.x, p.y, b.id, cx + (Math.random() - 0.5) * 30, 42 + Math.random() * 22, k * 0.3); made++;
  }
  if (!made) { b.t = r.t; return false; }
  S.stats.crafted += made; b.t = 0;
  emit({ t: 'shed', b: b.id, n: made });
  return true;
}
const oakLaden = b => b.type === 'oaktree' && b.phase === 'work' && !!b.recipe && b.t >= RECIPE[b.recipe].t;
// woodland oaks at the edge of the clearing let the odd acorn fall where a Meeple is about to pass
function wildAcorn() {
  if (S.level < BUILDINGS.oaktree.lvl || !S.meeples.length || !window.treeKind) return;
  let wild = 0; for (const a of S.acorns) if (!a.src) wild++;
  if (wild >= ACORN_WILD_MAX || S.acorns.length >= ACORN_MAX) return;
  const m = S.meeples[(Math.random() * S.meeples.length) | 0], mx = Math.floor(m.x / T), my = Math.floor(m.y / T);
  let pick = null, seen = 0;
  for (let y = my - 7; y <= my + 7; y++) for (let x = mx - 7; x <= mx + 7; x++) {
    if (!inMap(x, y)) continue;
    const i = idx(x, y), c = S.cover[i];
    if (c !== COVER.TREE && c !== COVER.BIG) continue;
    const k = treeKind(i)[0]; if (k !== 'oak' && k !== 'bigoak') continue;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      if (!inMap(x + dx, y + dy)) continue;
      const n = idx(x + dx, y + dy);
      if (!walkable(n) || S.floor[n] !== FLOOR.GRASS || (GHMAP && GHMAP[n])) continue;
      if (Math.random() * ++seen < 1) pick = [x, y, dx, dy];
    }
  }
  if (!pick) return;
  const [x, y, dx, dy] = pick, cx = (x + 0.5) * T, cy = (y + 0.5) * T;
  const ax = cx + dx * T * (0.62 + Math.random() * 0.3) + (dx ? 0 : (Math.random() - 0.5) * 30), ay = cy + dy * T * (0.62 + Math.random() * 0.3) + (dy ? 0 : (Math.random() - 0.5) * 26) + 6;
  const a = dropAcorn(ax, ay, 0, cx + dx * 10, 46 + Math.random() * 18, 0);
  if (!walkable(tileOf(a))) S.acorns.pop();
}
function tickAcorns(dt) {
  const A = S.acorns, busy = {};
  ACORN_TILE = {}; ACORN_FREE = 0;
  for (const m of S.meeples) if (m.task && m.task.type === 'gather') busy[m.task.a] = 1;
  for (const k of S.kids) if (k.goal) busy[k.goal] = 1;
  for (let j = A.length - 1; j >= 0; j--) {
    const a = A[j];
    if (a.fall > 0) {
      const was = a.fall; a.fall -= dt;
      if (was > ACORN_FALL && a.fall <= ACORN_FALL) emit({ t: 'acornfall', x: a.fx, y: a.y, h: a.fh, src: a.src });
      if (was > ACORN_LAND && a.fall <= ACORN_LAND) emit({ t: 'acornland', x: a.x, y: a.y });
      if (a.fall > 0) continue;
      a.fall = 0;
    }
    const i = tileOf(a);
    if (!walkable(i)) { A.splice(j, 1); if (a.src) invAdd('acorns', 1); continue; }               // something was built on top of it
    if (!busy[a.id] && S.playTime - a.t > (a.src ? 420 : 200)) {                                    // nobody could get to it
      A.splice(j, 1); if (a.src) invAdd('acorns', 1); else emit({ t: 'acorngone', x: a.x, y: a.y });
      continue;
    }
    if (!busy[a.id]) { (ACORN_TILE[i] || (ACORN_TILE[i] = [])).push(a); ACORN_FREE++; }
  }
  if ((_wildT -= dt) <= 0) { _wildT = 24 + Math.random() * 22; wildAcorn(); }
}
// head for the nearest acorn nobody else is after
function pickAcorn(m, s, near) {
  if (!ACORN_FREE || (!near && S.playTime < _acSkip)) return false;
  const r = bfs(s, i => ACORN_TILE[i] !== undefined, near || 14);
  if (!r) { if (!near) _acSkip = S.playTime + 4; return false; }
  const list = ACORN_TILE[r.goal], a = list.pop();
  if (!list.length) delete ACORN_TILE[r.goal];
  ACORN_FREE--;
  m.path = r.path;
  if (m.kid) m.goal = a.id; else m.task = { type: 'gather', a: a.id };
  return true;
}
// the last few steps off the middle of the tile, to stand beside the thing on the ground. True once there.
function stepBeside(o, tx, ty, sp) {
  const i = tileOf({ x: tx, y: ty }), x0 = (i % MW) * T + 4, y0 = ((i / MW) | 0) * T + 4;
  const gx = Math.max(x0, Math.min(x0 + T - 8, tx + (o.x >= tx ? 6 : -6))), gy = Math.max(y0, Math.min(y0 + T - 8, ty - 1));
  const dx = gx - o.x, dy = gy - o.y, d = Math.hypot(dx, dy);
  if (d < 1.2) { o.face = tx >= o.x ? 1 : -1; return true; }
  const st = Math.min(d, sp);
  o.x += dx / d * st; o.y += dy / d * st; o.moving = true;
  if (Math.abs(dx) > 0.5) o.face = dx > 0 ? 1 : -1;
  lookOf(o).a = Math.atan2(dy, dx); treadOn(o, st);
  return false;
}
const acornById = id => { for (const a of S.acorns) if (a.id === id) return a; return null; };
function takeAcorn(a) { const j = S.acorns.indexOf(a); if (j >= 0) S.acorns.splice(j, 1); }

// ---------------------------------------------------------------- love
// Two Meeples with free hearts who keep crossing paths take a shine to each other. Fondness grows whenever they
// are near one another (and slowly even when they aren't), faster on a charming farm and when they're happy.
// At 100 they are in love, and want a cottage; in the cottage they raise a child, who grows up into a Meeple.
const LOVE_BASE = 100 / 3000, LOVE_NEAR = 0.06, LOVE_NEAR_R = 3.5 * T;
const NEST_T = 300, NEST_REST = 1500, KID_T = 900, KID_LIMIT = 3;
const FAMILY_MAX = 12;      // children the whole farm can ever raise; they come on top of the Creator's 40
// a bigger farm can bring up more of them: 2 to begin with, one more every third level
const famCap = () => Math.min(FAMILY_MAX, 2 + Math.floor(S.level / 3));
const famNextLevel = () => famCap() >= FAMILY_MAX ? -1 : (famCap() - 1) * 3;
let PAIR_OF = {}, _pairT = 0, _sparkT = 40;
const pairOf = m => PAIR_OF[m.id] || null;
const meepleById = id => { for (const m of S.meeples) if (m.id === id) return m; return null; };
const partnerOf = m => { const P = PAIR_OF[m.id]; return P ? meepleById(P.a === m.id ? P.b : P.a) : null; };
const romName = m => (m.rom || 1) < 0.9 ? 'Shy' : (m.rom || 1) < 1.1 ? 'Warm-hearted' : 'A romantic';
function isKin(a, b) {
  const ka = a.kin || [], kb = b.kin || [];
  return ka.includes(b.id) || kb.includes(a.id) || ka.some(x => kb.includes(x));
}
const homeOf = P => P && P.home && BMAP[P.home] && BMAP[P.home].type === 'cottage' ? BMAP[P.home] : null;
const homelessPairs = () => (S.pairs || []).filter(P => P.st === 'love');
// is there a couple still waiting for a cottage that isn't already being built?
function cottageWanted() {
  const taken = {}; for (const P of S.pairs || []) if (P.home) taken[P.home] = 1;
  let spare = 0; for (const b of S.buildings) if ((b.type === 'cottage' && !taken[b.id]) || b.of === 'cottage') spare++;
  return homelessPairs().length - spare;
}
const raisedCount = () => S.meeples.length - madeCount() + (S.kids || []).length;
const popRoom = () => raisedCount() < famCap();
// is it worth nudging the player towards another cottage? Only while more homes would mean more children
const HOMES_WANTED = Math.ceil(FAMILY_MAX / KID_LIMIT);
function homeNag() {
  if (cottageWanted() <= 0 || !popRoom()) return false;
  let busy = 0;
  for (const P of S.pairs) if (P.st === 'home' && (P.kids | 0) < KID_LIMIT) busy++;
  for (const b of S.buildings) if (b.of === 'cottage') busy++;
  return busy < HOMES_WANTED;
}
const nestNeed = P => NEST_T + NEST_REST * (P.kids | 0);
function doorOf(b) {
  const acc = accessTiles(b).filter(walkable), want = idx(b.x, b.y + 2);
  const i = acc.includes(want) ? want : acc.length ? acc[0] : want;
  return { i, x: (i % MW) * T + T / 2, y: ((i / MW) | 0) * T + T / 2 };
}
function trySpark() {
  const free = S.meeples.filter(m => !PAIR_OF[m.id]);
  if (free.length < 2) return;
  const a = free[(Math.random() * free.length) | 0];
  let best = null, bd = 4.5 * T;
  for (const b of free) { if (b === a || isKin(a, b)) continue; const d = Math.hypot(a.x - b.x, a.y - b.y); if (d < bd) { bd = d; best = b; } }
  if (!best) return;
  const P = { a: a.id, b: best.id, love: 0, st: 'sweet', home: 0, t: 0, kids: 0, kid: 0, at: S.playTime };
  S.pairs.push(P); PAIR_OF[a.id] = P; PAIR_OF[best.id] = P;
  a.emo = { k: 'heart', t: 2.4 }; best.emo = { k: 'heart', t: 2.4 };
  emit({ t: 'spark', a: a.id, b: best.id });
}
function haveBaby(P, home) {
  const a = meepleById(P.a), b = meepleById(P.b), d = doorOf(home), from = Math.random() < 0.5 ? a : b;
  const used = new Set(S.meeples.map(m => m.name).concat(S.kids.map(k => k.name))), names = MEEPLE_NAMES.filter(n => !used.has(n));
  const k = { id: S.nextId++, kid: 1, name: names.length ? names[(Math.random() * names.length) | 0] : 'Sprout ' + S.nextId, crop: from.crop, col: mix(a.col, b.col, 0.35 + Math.random() * 0.3),
    pa: a.id, pb: b.id, home: home.id, x: d.x, y: d.y, t: 0, path: [], wait: 1.5, face: 1, bob: Math.random() * 6, gait: randGait(), hand: [], carry: 1, act: 0, task: null, hat: null, goal: 0, moving: false };
  S.kids.push(k); P.kid = k.id; P.t = 0;
  S.stats.born++;
  a.emo = { k: 'heart', t: 2.4 }; b.emo = { k: 'heart', t: 2.4 };
  emit({ t: 'baby', k: k.id });
}
function growUp(k) {
  S.kids = S.kids.filter(x => x !== k);
  const pa = meepleById(k.pa), pb = meepleById(k.pb), m = makeMeeple(k.crop, k.x, k.y), v = () => 0.97 + Math.random() * 0.08;
  m.name = k.name; m.col = k.col; m.gait = k.gait; m.kin = [k.pa, k.pb]; m.homeborn = 1;
  if (pa && pb) {     // takes after both of them
    m.speed = +((pa.speed + pb.speed) / 2 * v()).toFixed(2); m.work = +((pa.work + pb.work) / 2 * v()).toFixed(2); m.carry = Math.round((pa.carry + pb.carry) / 2);
    if (k.crop === 'founder') m.trait = 'Homegrown';
  }
  m.rom = +(0.75 + Math.random() * 0.5).toFixed(2);
  S.meeples.push(m); S.stats.made++;
  for (const P of S.pairs) if (P.kid === k.id) { P.kid = 0; P.kids = (P.kids | 0) + 1; P.t = 0; }
  emit({ t: 'grownup', m: m.id });
}
function tickLove(dt) {
  PAIR_OF = {};
  const alive = {}; for (const m of S.meeples) alive[m.id] = m;
  S.pairs = S.pairs.filter(P => alive[P.a] && alive[P.b]);
  const taken = {};
  for (const P of S.pairs) { PAIR_OF[P.a] = P; PAIR_OF[P.b] = P; if (P.home && !homeOf(P)) { P.home = 0; if (P.st === 'home') P.st = 'love'; } if (P.home) taken[P.home] = 1; }
  for (const m of S.meeples) if (m.rom == null) m.rom = +(0.75 + Math.random() * 0.5).toFixed(2);
  if ((_sparkT -= dt) <= 0) { _sparkT = 40 + Math.random() * 35; trySpark(); }
  const charm = 1 + Math.min(0.5, CHARM * 0.02);
  for (const P of S.pairs) {
    const a = alive[P.a], b = alive[P.b], near = Math.hypot(a.x - b.x, a.y - b.y) < LOVE_NEAR_R;
    if (P.st === 'sweet') {
      const happy = a.happy > S.playTime || b.happy > S.playTime ? 1.5 : 1;
      P.love += dt * (LOVE_BASE + (near ? LOVE_NEAR : 0)) * charm * happy * (a.rom + b.rom) / 2;
      if (near && Math.random() < dt * 0.03) emote(Math.random() < 0.5 ? a : b, 'heart');
      if (P.love >= 100) { P.love = 100; P.st = 'love'; P.at = S.playTime; a.emo = { k: 'heart', t: 2.4 }; b.emo = { k: 'heart', t: 2.4 }; emit({ t: 'inlove', a: a.id, b: b.id }); }
      continue;
    }
    if (near && Math.random() < dt * 0.02) emote(Math.random() < 0.5 ? a : b, 'heart');
    if (P.st === 'love') {     // an empty cottage? move in
      const home = S.buildings.find(h => h.type === 'cottage' && !taken[h.id]);
      if (home) { P.home = home.id; P.st = 'home'; P.t = 0; taken[home.id] = 1; emit({ t: 'movedin', a: a.id, b: b.id, home: home.id }); }
      continue;
    }
    const home = homeOf(P);
    if (home && P.kid) { const k = S.kids.find(x => x.id === P.kid); if (k && k.home !== home.id) k.home = home.id; }      // the family moved house
    if (home && !P.kid && (P.kids | 0) < KID_LIMIT && popRoom()) { P.t += dt; if (P.t >= nestNeed(P)) haveBaby(P, home); }
  }
}
// what a couple's nest is up to, for the cottage window and its card
function nestState(P) {
  if (!P || P.st !== 'home') return { k: 'none' };
  if (P.kid) { const k = S.kids.find(x => x.id === P.kid); return k ? { k: 'raising', kid: k, left: KID_T - k.t, frac: k.t / KID_T } : { k: 'none' }; }
  if ((P.kids | 0) >= KID_LIMIT) return { k: 'done' };
  if (!popRoom()) return { k: 'full' };
  return { k: 'nesting', left: nestNeed(P) - P.t, frac: P.t / nestNeed(P) };
}

// ---------------------------------------------------------------- children
const kidSize = k => 0.5 + 0.38 * Math.min(1, k.t / KID_T);
function tickKids(dt) {
  const night = isNight();
  for (const k of S.kids.slice()) {
    k.bob += dt; k.t += dt; k.moving = false;
    if (k.emo && (k.emo.t -= dt) <= 0) k.emo = null;
    if (k.hop > 0) k.hop -= dt;
    if (k.t >= KID_T) { growUp(k); continue; }
    const home = BMAP[k.home] && BMAP[k.home].type === 'cottage' ? BMAP[k.home] : null;
    if (k.in) { if (!night || !home) { k.in = 0; k.wait = 0.5; } continue; }
    if (k.path.length) {
      const ox = k.x, oy = k.y, from = tileOf(k), goal = k.path[k.path.length - 1];
      lookAhead(k, dt);
      const moved = stepAlong(k, (1.3 + 0.9 * k.t / KID_T) * T * dt), now = tileOf(k);
      if (now !== from && now !== goal && !walkable(now)) { k.x = ox; k.y = oy; k.path = []; k.goal = 0; k.wait = 0.5; continue; }
      treadOn(k, moved * 0.5); k.moving = true;
      continue;
    }
    if (k.goal) {                                    // an acorn for the family pot
      const a = acornById(k.goal);
      if (!a) { k.goal = 0; k.act = 0; continue; }
      if (!stepBeside(k, a.x, a.y, 1.6 * T * dt)) continue;
      if ((k.act += dt) < 0.7) continue;
      k.act = 0; k.goal = 0; takeAcorn(a); invAdd('acorns', 1);
      k.hop = 0.5; k.emo = { k: Math.random() < 0.5 ? 'note' : 'heart', t: 1.8 }; k.wait = 0.8;
      emit({ t: 'pickup', x: a.x, y: a.y, kid: 1 });
      continue;
    }
    if (k.goHome) { k.goHome = 0; if (home && night) { k.in = 1; continue; } }
    if ((k.wait -= dt) > 0) continue;
    k.wait = 0.8 + Math.random() * 2.6;
    const s = tileOf(k), anchor = home ? doorOf(home) : (meepleById(k.pa) || k), far = Math.hypot(anchor.x - k.x, anchor.y - k.y) > 7 * T;
    if (home && (night || far)) { const di = doorOf(home).i, r = bfs(s, i => i === di, 40); if (r) { k.path = r.path; k.goHome = 1; if (!r.path.length && night) { k.goHome = 0; k.in = 1; } continue; } }
    const roll = Math.random();
    if (roll < 0.28) {                               // tag along behind a parent for a bit
      const p = meepleById(Math.random() < 0.5 ? k.pa : k.pb);
      if (p && Math.hypot(p.x - k.x, p.y - k.y) < 9 * T) { const pt = tileOf(p), r = bfs(s, i => i === pt, 14); if (r && r.path.length > 1) { k.path = r.path.slice(0, -1); continue; } }
    } else if (roll < 0.5 && k.t > KID_T * 0.3 && ACORN_FREE) { if (pickAcorn(k, s, 6)) continue; }
    else if (roll < 0.62) { k.hop = 0.5; if (Math.random() < 0.5) k.emo = { k: 'note', t: 1.6 }; continue; }
    const r = bfs(s, i => i !== s && walkable(i) && hash2(i, (S.playTime * 7) | 0, 11) < 0.07, 4);
    if (r) k.path = r.path.slice(0, 4);
  }
}

// ---------------------------------------------------------------- Meeples: gathering, courting
function arrive6(m, t, dt) {
  if (t.type === 'gather') {
    const a = acornById(t.a);
    if (!a) { m.task = null; m.act = 0; return; }
    if (!stepBeside(m, a.x, a.y, mSpeed(m) * T * dt)) return;
    m.act += dt * mWork(m);
    if (m.act < 0.55) return;
    m.act = 0; takeAcorn(a); m.hand.push('acorns');
    emit({ t: 'pickup', x: a.x, y: a.y, m: m.id });
    m.task = null;
    if (m.hand.length < mCarry(m)) pickAcorn(m, tileOf(m), 6);        // and the next one, if it's close
    return;
  }
  if (t.type === 'court') {
    const o = meepleById(t.o), P = PAIR_OF[m.id];
    t.t -= dt;
    if (!o || !P || t.t <= 0 || (WORK_WAITING && t.max - t.t > 2.5) || Math.hypot(o.x - m.x, o.y - m.y) > 2.6 * T) { m.task = null; m.act = 0; m.wait = 0.3; return; }
    m.face = o.x >= m.x ? 1 : -1;
    if (P.st === 'sweet') P.love = Math.min(100, P.love + dt * 0.2);
    if (Math.random() < dt * 0.45) emote(Math.random() < 0.6 ? m : o, 'heart');
    return;
  }
  m.task = null;
}
// with nothing pressing, sweethearts go and find each other
const _im6 = idleMoment;
idleMoment = function (m, s) {
  const P = PAIR_OF[m.id];
  if (P && Math.random() < 0.5) {
    const o = partnerOf(m);
    if (o && !o.fish && Math.hypot(o.x - m.x, o.y - m.y) < 12 * T) {
      const ot = tileOf(o), r = bfs(s, i => i === ot, 16);
      if (r) { const t = 4 + Math.random() * 4; m.path = r.path.slice(0, -1); m.task = { type: 'court', o: o.id, t, max: t }; return true; }
    }
  }
  return _im6(m, s);
};
// a cottage can only go up for a couple who need one
const _pl6 = place;
place = function (type, x, y) { if (type === 'cottage' && cottageWanted() <= 0) return false; return _pl6(type, x, y); };

// ---------------------------------------------------------------- tick
function tick6(dt) {
  ensure6();
  tickAcorns(dt);
  tickKids(dt);
  if ((_pairT += dt) >= 1) { tickLove(_pairT); _pairT = 0; }
}
const _ux6 = updateExtras;
updateExtras = function (dt) { _ux6(dt); tick6(dt); };
;(window.__stage = window.__stage || []).push('world6.js loaded');
