// Meeple Meadows — boot, main loop, game lifecycle.
'use strict';

const DEV = /[?&]dev=(\d+)/.exec(location.search);
const DEV_SPEED = DEV ? +DEV[1] : 1;
let lastFrame = 0, acc = 0, autosaveT = 0, running = true, fpsT = 0, fpsN = 0, titleT = 0;

function startGame(slot, fresh, opts) {
  closeModal(); closePanel(); setMode(null);
  if (fresh || !loadGame(slot)) newGame(slot);
  // a legacy meadow: a permanent bonus for each Fair won, and the hats come along
  if (fresh && opts && opts.legacy) { S.legacy = opts.legacy; S.hats = Array.from(new Set(S.hats.concat(opts.hats || []))); }
  SET.lastSlot = slot; saveSettings();
  UI.inGame = true; UI.paused = false; UI.lastHud = {};
  R.parts = []; R.amb = []; R.wetA = {}; R.groundDirtyAll();
  // centre camera on homestead
  R.cam.x = (CX - 0.5) * T; R.cam.y = CY * T; R.cam.z = Math.min(1.5, Math.max(0.9, Math.min(R.W, R.H) / (T * 9)));
  $('title').classList.add('hidden'); $('hud').classList.remove('hidden');
  document.querySelector('.ver').classList.add('hidden');
  buildHud();
  saveGame();
}
function toTitle() {
  UI.inGame = false; closePanel(); setMode(null);
  $('hud').classList.add('hidden'); $('title').classList.remove('hidden');
  document.querySelector('.ver').classList.remove('hidden');
  demoWorld();
  buildTitleMenu();
}
function demoWorld() {
  newGame(-1);
  // give the demo some life: a few extra plots, meeples, a creator and a mill
  for (let k = 0; k < 6; k++) makePlot(idx(CX - 4 + k % 3, CY + 2 + Math.floor(k / 3)), k < 3 ? 'wheat' : 'strawberry', true);
  addBuilding('creator', CX - 4, CY - 4, true);
  addBuilding('mill', CX + 4, CY - 1, true);
  addBuilding('lantern', CX - 1, CY - 3, true);
  rebuildOcc();
  for (const c of ['wheat', 'strawberry', 'potato']) { const m = makeMeeple(c, CX * T, (CY + 1) * T); S.meeples.push(m); }
  for (const k in S.plots) { S.plots[k].t = Math.random() * 30; }
  R.cam.x = (CX - 0.5) * T; R.cam.y = (CY + 0.5) * T; R.cam.z = Math.max(1.0, Math.min(R.W, R.H) / (T * 8));
  R.groundDirtyAll();
}

function frame(now) {
  requestAnimationFrame(frame);
  if (!running) { lastFrame = now; return; }
  const cap = SET.fps ? 1000 / SET.fps : 0;
  if (cap && now - lastFrame < cap - 2) return;
  let dt = Math.min(0.25, (now - lastFrame) / 1000);
  lastFrame = now;
  if (!S) return;
  const simulate = !(UI.inGame && UI.paused);
  if (simulate) {
    acc += dt * (UI.inGame ? DEV_SPEED : 1);
    let steps = 0;
    while (acc > 0 && steps < 400) { const s = Math.min(0.05, acc); update(s); acc -= s; steps++; }
    acc = Math.max(0, acc);
  }
  while (EV.length) { const e = EV.shift(); if (R.ready) R.onEvent(e); if (UI.inGame) onGameEvent(e); }
  if (!UI.inGame) { titleT += dt; R.cam.x = (CX - 0.5) * T + Math.sin(titleT * 0.05) * T * 3; }
  R._dt = dt;
  R.draw(dt);
  if (UI.inGame) {
    if (R.clearMode && SET.costLabels && R.cam.z > 0.55) {
      // cost labels drawn on top, in world space
      const ctx = R.ctx, z = R.cam.z, k = z * R.pr;
      ctx.setTransform(k, 0, 0, k, (R.W / 2 - R.cam.x * z) * R.pr, (R.H / 2 - R.cam.y * z) * R.pr);
      const vw = R.W / z, vh = R.H / z, x0 = R.cam.x - vw / 2, y0 = R.cam.y - vh / 2;
      R.drawCoverLabels(ctx, Math.max(0, Math.floor(x0 / T)), Math.max(0, Math.floor(y0 / T)), Math.min(MW - 1, Math.ceil((x0 + vw) / T)), Math.min(MH - 1, Math.ceil((y0 + vh) / T)));
    }
    updateHud();
    autosaveT += dt;
    if (autosaveT > SET.autosave) { autosaveT = 0; saveGame(); }
  }
  const sun = R.dayNight ? Math.sin((S.day - 0.25) * Math.PI * 2) : 1;
  AUDIO.tick(sun < -0.05);
  fpsT += dt; fpsN++;
  if (fpsT > 0.5) { if (SET.showFps) $('fps').textContent = Math.round(fpsN / fpsT) + ' fps · ' + S.meeples.length + ' meeples'; fpsT = 0; fpsN = 0; }
}
setInterval(() => { if (UI.inGame && UI.panel) renderPanel(false); }, 250);

// lifecycle: pause everything when the app is hidden — no offline progress
function appPause() { if (UI.inGame) saveGame(); running = false; AUDIO.suspend(); }
function appResume() { running = true; lastFrame = performance.now(); acc = 0; AUDIO.resume(); }
document.addEventListener('visibilitychange', () => { if (document.hidden) appPause(); else appResume(); });
window.addEventListener('pagehide', appPause);
window.onAppPause = appPause;
window.onAppResume = appResume;
window.addEventListener('resize', () => { if (R.ready) R.resize(); });

const stage = s => window.__stage.push(s);
async function boot() {
  const bar = p => { const el = $('loading'); if (el && el.firstChild) el.firstChild.textContent = 'Planting seeds… ' + Math.round(p * 100) + '%'; window.__artPct = Math.round(p * 100); };
  stage('boot start');
  loadSettings(); stage('settings');
  ART.S = (QUALITY[SET.quality] || QUALITY.medium).art;
  R.q = QUALITY[SET.quality] || QUALITY.medium;
  await buildArtAsync(p => bar(p * 0.9)); stage('art built');
  bar(0.95); await yieldNow();
  R.init($('game')); stage('renderer ' + R.W + 'x' + R.H);
  setupInput(); stage('input');
  applySettings(); stage('settings applied');
  toTitle(); stage('title');
  $('loading').remove();
  window.__booted = true;
  $('title').classList.remove('hidden');
  lastFrame = performance.now();
  requestAnimationFrame(frame);
}
// Start as soon as the scripts are in (they sit at the end of <body>), not on window 'load',
// which some Android WebViews never deliver for local files.
let _bootStarted = false;
function startBoot(why) {
  if (_bootStarted) return; _bootStarted = true; stage('start via ' + why);
  boot().catch(e => window.__bootError && window.__bootError(e));
}
if (document.readyState !== 'loading') setTimeout(() => startBoot('ready'), 0);
document.addEventListener('DOMContentLoaded', () => startBoot('domcontentloaded'));
window.addEventListener('load', () => startBoot('load'));
setTimeout(() => startBoot('fallback'), 300);
;(window.__stage = window.__stage || []).push('main.js loaded');
