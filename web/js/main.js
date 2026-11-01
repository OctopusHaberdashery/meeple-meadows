// Meeple Meadows — boot, main loop, game lifecycle.
'use strict';

const DEV = /[?&]dev=(\d+)/.exec(location.search);
const DEV_SPEED = DEV ? +DEV[1] : 1;
let lastFrame = 0, acc = 0, autosaveT = 0, running = true, fpsT = 0, fpsN = 0, titleT = 0;

function startGame(slot, fresh) {
  closeModal(); closePanel(); setMode(null);
  if (fresh || !loadGame(slot)) newGame(slot);
  SET.lastSlot = slot; saveSettings();
  UI.inGame = true; UI.paused = false; UI.lastHud = {};
  R.parts = []; R.amb = []; R.groundDirtyAll();
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

async function boot() {
  const bar = p => { const el = $('loading'); if (el) el.firstChild.textContent = 'Planting seeds… ' + Math.round(p * 100) + '%'; };
  loadSettings();
  ART.S = (QUALITY[SET.quality] || QUALITY.medium).art;
  R.q = QUALITY[SET.quality] || QUALITY.medium;
  await buildArtAsync(p => bar(p * 0.9));
  bar(0.95); await new Promise(r => setTimeout(r, 0));
  R.init($('game'));
  setupInput();
  applySettings();
  toTitle();
  $('loading').remove();
  window.__booted = true;
  $('title').classList.remove('hidden');
  lastFrame = performance.now();
  requestAnimationFrame(frame);
}
window.addEventListener('load', () => setTimeout(() => boot().catch(e => window.__bootError && window.__bootError(e)), 30));
