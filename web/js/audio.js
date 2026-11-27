// Meeple Meadows — synthesized audio: generative music, ambience and sound effects.
// The farm's own sounds (harvest pops, coins, hammer taps) are tuned to the chord the music is on
// and land on its beat, so a busy farm plays along with the tune.
'use strict';

const AUDIO = {
  ctx: null, master: null, music: null, sfxBus: null, amb: null,
  vol: { master: 0.8, music: 0.5, sfx: 0.7, amb: 0.5 },
  started: false, nextBeat: 0, step: 0, chord: 0, lastSfx: {},
  rich: 0,          // 0..4: how many instruments the music has, set from how far the farm has come
  combo: 0, comboT: 0,
};

// Called from every finished tap, click and key press. Tablets and phones only let sound start from inside
// one of those, and can stop it again at any time (a call, the app switcher, the lock screen), so this
// keeps checking instead of running once.
AUDIO.unlock = function () {
  if (AUDIO.paused) return;
  // iPad and iPhone: play as media rather than as a ring sound, which the silent switch would mute
  try { const s = navigator.audioSession; if (s && s.type !== 'playback') s.type = 'playback'; } catch (e) { }
  try {
    if (!AUDIO.ctx && (AUDIO.fails || 0) < 3) AUDIO.create();
    const c = AUDIO.ctx; if (!c) return;
    // 'suspended' or, on iOS, 'interrupted'
    if (c.state !== 'running') { const p = c.resume(); if (p && p.catch) p.catch(() => { }); }
    // older iOS stays silent until something has been played from inside a tap
    if (!AUDIO.primed) {
      const s = c.createBufferSource(); s.buffer = c.createBuffer(1, 1, c.sampleRate); s.connect(c.destination); s.start(0);
      AUDIO.primed = c.state === 'running';
    }
  } catch (e) { AUDIO.err = String((e && e.message) || e); }
};
AUDIO.create = function () {
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  let c = null;
  try { c = AUDIO.ctx = new AC(); AUDIO.build(c); AUDIO.err = null; }
  catch (e) {
    AUDIO.ctx = null; AUDIO.started = false;
    AUDIO.fails = (AUDIO.fails || 0) + 1; AUDIO.err = String((e && e.message) || e);
    try { if (c) c.close(); } catch (e2) { }
  }
};
AUDIO.build = function (c) {
  AUDIO.master = c.createGain(); AUDIO.master.connect(c.destination);
  AUDIO.music = c.createGain(); AUDIO.music.connect(AUDIO.master);
  AUDIO.sfxBus = c.createGain(); AUDIO.sfxBus.connect(AUDIO.master);
  AUDIO.amb = c.createGain(); AUDIO.amb.connect(AUDIO.master);
  // gentle reverb for music
  const conv = c.createConvolver(), len = c.sampleRate * 2.2, buf = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) { const d = buf.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
  conv.buffer = buf;
  AUDIO.verb = c.createGain(); AUDIO.verb.gain.value = 0.35; AUDIO.verb.connect(conv); conv.connect(AUDIO.music);
  AUDIO.applyVolume();
  AUDIO.nextBeat = c.currentTime + 0.3;
  AUDIO.started = true;
};
// A plain sentence on what the sound engine is doing, for the sound check in Settings.
AUDIO.status = function () {
  if (!(window.AudioContext || window.webkitAudioContext)) return 'This browser has no sound engine.';
  if (!AUDIO.ctx) return AUDIO.err ? 'Sound could not start: ' + AUDIO.err : 'Sound has not started yet. Tap the button.';
  const c = AUDIO.ctx, ses = navigator.audioSession ? ', ' + navigator.audioSession.type : '';
  const tech = ` (${c.state}, ${c.sampleRate} Hz${ses})`;
  if (c.state !== 'running') return 'The device is holding the sound back' + tech + '. Tap the button again.';
  if (AUDIO.vol.master < 0.05) return 'Sound is running, but Master is turned all the way down' + tech + '.';
  return 'Sound is running' + tech + '. If you hear nothing, turn the volume up with the side buttons while the game is open.';
};
// Four rising notes straight to the master volume (so they sound even with Effects turned down).
AUDIO.test = function () {
  if (!AUDIO.started || AUDIO.ctx.state !== 'running') return;
  const t = AUDIO.ctx.currentTime;
  [392, 494, 587, 784].forEach((f, i) => tone(AUDIO.master, 'triangle', f, f * 1.01, t + i * 0.1, 0.35, 0.2));
};
AUDIO.applyVolume = function () {
  if (!AUDIO.ctx) return;
  const v = AUDIO.vol, t = AUDIO.ctx.currentTime;
  AUDIO.master.gain.value = v.master;
  AUDIO.music.gain.cancelScheduledValues(t); AUDIO.music.gain.value = v.music * 0.55 * (1 - 0.4 * (AUDIO.zf || 0));
  AUDIO.sfxBus.gain.value = v.sfx;
  AUDIO.amb.gain.value = v.amb * 0.6;
};
AUDIO.suspend = function () { AUDIO.paused = true; if (AUDIO.ctx && AUDIO.ctx.state === 'running') AUDIO.ctx.suspend(); };
// Coming back to the game: this may be refused outside a tap (iOS), in which case the next tap does it.
AUDIO.resume = function () {
  AUDIO.paused = false;
  try { if (AUDIO.ctx && AUDIO.ctx.state !== 'running') { const p = AUDIO.ctx.resume(); if (p && p.catch) p.catch(() => { }); } } catch (e) { }
};
// the music holds its breath for a moment (before a level-up fanfare), then swells back
AUDIO.duck = function (sec) {
  if (!AUDIO.started) return;
  const g = AUDIO.music.gain, t = AUDIO.ctx.currentTime, v = AUDIO.vol.music * 0.55 * (1 - 0.4 * (AUDIO.zf || 0));
  AUDIO.duckUntil = t + sec + 0.8;
  g.cancelScheduledValues(t); g.setValueAtTime(g.value, t);
  g.linearRampToValueAtTime(v * 0.12, t + 0.08); g.setValueAtTime(v * 0.12, t + sec); g.linearRampToValueAtTime(v, t + sec + 0.7);
};

AUDIO.setZoom = function (zf) {
  if (!AUDIO.started || Math.abs(zf - (AUDIO.zf || 0)) < 0.04) return;
  AUDIO.zf = zf;
  const t = AUDIO.ctx.currentTime; if (t < (AUDIO.duckUntil || 0)) return;
  AUDIO.music.gain.setTargetAtTime(AUDIO.vol.music * 0.55 * (1 - 0.4 * zf), t, 0.3);
};
function tone(dest, type, f0, f1, t, dur, peak, attack = 0.005, filter) {
  const c = AUDIO.ctx, o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t);
  if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  let n = o;
  if (filter) { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = filter; o.connect(f); n = f; }
  n.connect(g); g.connect(dest);
  o.start(t); o.stop(t + dur + 0.05);
  return g;
}
function noise(dest, t, dur, peak, freq, q = 1, type = 'bandpass') {
  const c = AUDIO.ctx, len = Math.ceil(c.sampleRate * dur), b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const s = c.createBufferSource(); s.buffer = b;
  const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
  const g = c.createGain(); g.gain.setValueAtTime(peak, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(dest); s.start(t); s.stop(t + dur);
}

// ------------------------------------------------- the tune everything shares
// D major pentatonic-ish lullaby over a four-chord loop, ~76 bpm in eighths.
const CHORDS = [[50, 57, 62, 66], [47, 54, 59, 62], [43, 50, 55, 59], [45, 52, 57, 61]];
const SCALE = [62, 64, 66, 69, 71, 74, 76, 78, 81];
const BEAT = 60 / 76 / 2;
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
const chordNow = () => CHORDS[Math.floor(AUDIO.step / 16) % 4];
// a note of the current chord, `oct` octaves up (random note unless i is given)
const chordTone = (oct, i) => { const ch = chordNow(); return mtof(ch[(i == null ? (Math.random() * ch.length) | 0 : i) % ch.length] + 12 * oct); };
const scaleTone = k => mtof(SCALE[Math.max(0, Math.min(SCALE.length - 1, k))]);
// the next sixteenth-note on the music's grid, so farm sounds fall in time
AUDIO.grid = function (t) {
  const sub = BEAT / 2; if (!(AUDIO.nextBeat > 0)) return t;
  const g = AUDIO.nextBeat + Math.ceil((t - AUDIO.nextBeat) / sub - 1e-6) * sub;
  return g - t > sub * 1.01 ? t : g;
};
const ON_GRID = { pop: 1, drop: 1, coin: 1, ding: 1, tap: 1, dig: 1, plant: 1 };

AUDIO.sfx = function (name, arg) {
  if (!AUDIO.started || AUDIO.ctx.state !== 'running') return;
  const c = AUDIO.ctx, now = c.currentTime, d = AUDIO.sfxBus;
  // rate-limit repeats so a busy farm doesn't become a wall of noise
  const lim = { pop: 0.07, drop: 0.12, coin: 0.15, chop: 0.05, ding: 0.2, water: 0.35, splash: 0.25, tap: 0.085, dig: 0.11, plink: 0.02, rustle: 0.12, plant: 0.08 }[name] || 0.03;
  if (AUDIO.lastSfx[name] && now - AUDIO.lastSfx[name] < lim) return;
  AUDIO.lastSfx[name] = now;
  const t = ON_GRID[name] ? AUDIO.grid(now) : now;
  switch (name) {
    case 'click': tone(d, 'sine', 880, 660, t, 0.06, 0.15); break;
    case 'open': tone(d, 'triangle', chordTone(1, 0), chordTone(1, 2), t, 0.12, 0.12); break;
    case 'close': tone(d, 'triangle', chordTone(1, 2), chordTone(1, 0), t, 0.1, 0.1); break;
    // a harvest: a soft bloop that lands on a note of the chord
    case 'pop': { const f = chordTone(2); tone(d, 'sine', f * 0.5, f, t, 0.1, 0.17); tone(d, 'triangle', f * 2, f * 2, t, 0.05, 0.03); break; }
    case 'plant': { const f = chordTone(1); tone(d, 'sine', f, f * 0.6, t, 0.08, 0.1); break; }
    case 'drop': { const f = chordTone(0, 0); tone(d, 'triangle', f * 2, f, t, 0.13, 0.14, 0.005, 1200); noise(d, t, 0.08, 0.05, 900); break; }
    case 'coin': { const a = chordTone(3, 1), b = chordTone(3, 3); tone(d, 'square', a, a, t, 0.08, 0.045, 0.003, 3200); tone(d, 'square', b, b, t + 0.07, 0.22, 0.045, 0.003, 3200); break; }
    // one coin landing in the purse: each one in a run climbs the scale
    case 'plink': {
      if (now - AUDIO.comboT > 1.3) AUDIO.combo = 0;
      AUDIO.comboT = now;
      const f = scaleTone(AUDIO.combo++ % SCALE.length) * 2;
      tone(d, 'sine', f, f, t, 0.16, 0.09); tone(d, 'triangle', f * 2, f * 2, t, 0.07, 0.03);
      break;
    }
    case 'chop': noise(d, t, 0.12, 0.35, 1400, 2); tone(d, 'triangle', 220, 90, t, 0.12, 0.25); noise(d, t + 0.1, 0.25, 0.12, 600, 0.7); break;
    case 'rock': noise(d, t, 0.25, 0.35, 500, 1.2); tone(d, 'sine', 120, 60, t, 0.25, 0.35); break;
    case 'build': [0, 0.09, 0.18].forEach((o, i) => { noise(d, t + o, 0.07, 0.25, 1800 - i * 300, 3); tone(d, 'triangle', 300 - i * 30, 200, t + o, 0.08, 0.15); }); break;
    // a hammer on wood, pitched like a woodblock in the tune
    case 'tap': { const f = chordTone(1, Math.random() < 0.5 ? 0 : 2); noise(d, t, 0.035, 0.16, 2200, 4); tone(d, 'triangle', f, f * 0.96, t, 0.07, 0.12, 0.002, 2600); break; }
    case 'dig': noise(d, t, 0.12, 0.13, 700, 1.4); tone(d, 'sine', 140, 80, t, 0.1, 0.12); break;
    case 'ding': { const a = chordTone(3, 0), b = chordTone(3, 2); tone(d, 'sine', a, a, t, 0.5, 0.11); tone(d, 'sine', b, b, t + 0.04, 0.4, 0.06); break; }
    case 'meeple': chordNow().forEach((n, i) => tone(d, 'triangle', mtof(n + 12), mtof(n + 12) * 1.01, t + i * 0.08, 0.3, 0.12)); tone(d, 'sine', chordTone(3, 0), 0, t + 0.34, 0.5, 0.08); break;
    // the last plank goes on: three taps, then the chord rings out
    case 'built': {
      [0, 0.1, 0.2].forEach(o => { noise(d, t + o, 0.035, 0.18, 2200, 4); tone(d, 'triangle', chordTone(1, 0), 0, t + o, 0.06, 0.12); });
      chordNow().forEach((n, i) => tone(d, 'triangle', mtof(n + 12), 0, t + 0.34 + i * 0.07, 0.6, 0.11));
      tone(d, 'sine', chordTone(3, 0), 0, t + 0.62, 0.9, 0.09);
      break;
    }
    // a level-up: the chord climbs two octaves and holds
    case 'level': {
      const ch = chordNow(), run = [ch[0], ch[1], ch[2], ch[3], ch[0] + 12, ch[1] + 12, ch[2] + 12, ch[0] + 24];
      run.forEach((n, i) => { tone(d, 'triangle', mtof(n + 12), 0, t + i * 0.085, 0.5, 0.13); tone(d, 'sine', mtof(n), 0, t + i * 0.085, 0.6, 0.07); });
      ch.forEach(n => tone(d, 'sine', mtof(n + 12), 0, t + 0.72, 1.6, 0.06, 0.05));
      noise(d, t + 0.68, 0.9, 0.05, 6000, 0.6, 'highpass');
      break;
    }
    case 'hush': tone(d, 'sine', chordTone(2, 0), chordTone(0, 0), t, 0.45, 0.06); noise(d, t, 0.45, 0.04, 1200, 0.5, 'lowpass'); break;
    case 'whoosh': noise(d, t, 0.35, 0.09, 1800, 0.6); break;
    case 'thud': tone(d, 'sine', 110, 50, t, 0.22, 0.3); noise(d, t, 0.12, 0.12, 300, 0.8, 'lowpass'); break;
    case 'water': {
      // soft drips: short sine "plinks" that rise in pitch, like drops landing in a puddle
      const n = 2 + (Math.random() * 2 | 0);
      for (let k = 0; k < n; k++) {
        const at = t + k * (0.09 + Math.random() * 0.12), f = 700 + Math.random() * 500;
        tone(d, 'sine', f, f * 1.9, at, 0.07, 0.07, 0.004, 3000);
        tone(d, 'sine', f * 0.5, f * 0.8, at + 0.01, 0.12, 0.025, 0.01, 1200);
      }
      break;
    }
    case 'splash': noise(d, t, 0.35, 0.07, 900, 0.7, 'lowpass'); tone(d, 'sine', 420, 900, t, 0.09, 0.05, 0.005, 2000); tone(d, 'sine', 600, 1300, t + 0.12, 0.08, 0.035, 0.005, 2000); break;
    case 'plop': tone(d, 'sine', 380, 820, t, 0.08, 0.08, 0.004, 2400); tone(d, 'sine', 240, 420, t + 0.05, 0.1, 0.04); break;
    case 'error': tone(d, 'square', 220, 180, t, 0.15, 0.06, 0.005, 1000); break;
    case 'buy': tone(d, 'triangle', chordTone(1, 0), chordTone(1, 2), t, 0.15, 0.15); tone(d, 'sine', chordTone(2, 2), 0, t + 0.08, 0.25, 0.08); break;
    // ---- things that answer when you tap them
    // ---- v1.8: strokes, combos, rare moments and the sounds of a day
    case 'stroke': {
      if (now - (AUDIO.strokeT || 0) > 0.9) AUDIO.strokeN = 0;
      AUDIO.strokeT = now; const n = AUDIO.strokeN = (AUDIO.strokeN || 0) + 1;
      const f = mtof(SCALE[(n - 1) % SCALE.length] + (Math.floor((n - 1) / SCALE.length) % 2) * 12);
      tone(d, 'sine', f * 0.5, f, t, 0.09, 0.15); tone(d, 'triangle', f * 2, f * 2, t, 0.05, 0.03);
      break;
    }
    case 'combo': { const n = Math.max(1, arg | 0), f = mtof(SCALE[(n - 1) % SCALE.length] + 12 + (n > SCALE.length ? 12 : 0)); tone(d, 'triangle', f, f, t, 0.18, 0.1); tone(d, 'sine', f * 1.5, f * 1.5, t + 0.05, 0.16, 0.06); break; }
    case 'rare': {
      const ch = chordNow();
      [0, 1, 2, 3, 0, 1, 2].forEach((k, i) => tone(d, 'sine', mtof(ch[k] + 24 + (i > 3 ? 12 : 0)), 0, t + i * 0.055, 0.5, 0.07));
      noise(d, t, 0.6, 0.035, 7000, 0.7, 'highpass'); tone(d, 'triangle', mtof(ch[0] + 12), 0, t, 0.7, 0.08);
      break;
    }
    case 'chime': { const a = chordTone(2, 0), b = chordTone(2, 2); [0, 0.55, 1.1].forEach((o, i) => { tone(d, 'sine', i % 2 ? b : a, 0, t + o, 1.4, 0.09); tone(d, 'sine', (i % 2 ? b : a) * 2.76, 0, t + o, 0.5, 0.02); }); break; }
    case 'rooster': [[520, 760, 0, 0.16], [760, 820, 0.17, 0.12], [820, 700, 0.3, 0.3], [700, 430, 0.6, 0.45]].forEach(([a, b, o, len]) => tone(AUDIO.amb, 'sawtooth', a, b, t + o, len, 0.09, 0.02, 2200)); break;
    case 'thunder': noise(AUDIO.amb, t, 2.4, 0.5, 90, 0.6, 'lowpass'); noise(AUDIO.amb, t + 0.3, 1.6, 0.22, 220, 0.5, 'lowpass'); tone(AUDIO.amb, 'sine', 55, 38, t, 1.8, 0.18, 0.1); break;
    case 'twinkle': tone(d, 'sine', 3200, 1500, t, 0.9, 0.05, 0.02); tone(d, 'sine', 4200, 2100, t + 0.08, 0.8, 0.03, 0.02); break;
    case 'peep': [0, 0.14, 0.28].forEach(o => tone(d, 'sine', 2500, 3200, t + o, 0.07, 0.07)); break;
    case 'clap': noise(d, t, 0.035, 0.14, 1600, 2); noise(d, t + 0.012, 0.03, 0.08, 2600, 2); break;
    case 'shutter': noise(d, t, 0.03, 0.2, 3000, 2); noise(d, t + 0.09, 0.05, 0.16, 1800, 2); break;
    case 'lamp': tone(AUDIO.amb, 'sine', 1900, 2300, t, 0.05, 0.05); break;
    case 'wish': { const a = chordTone(2, 1), b = chordTone(2, 3); tone(d, 'sine', a, a, t, 0.25, 0.08); tone(d, 'sine', b, b, t + 0.12, 0.35, 0.08); break; }
    case 'chirp': { const k = 3 + ((Math.random() * 5) | 0); tone(d, 'sine', scaleTone(k), scaleTone(k) * 1.5, t, 0.07, 0.1); tone(d, 'sine', scaleTone(k + 2), scaleTone(k + 2) * 1.4, t + 0.09, 0.09, 0.1); break; }
    case 'cluck': [0, 0.09].forEach(o => { tone(d, 'square', 620, 380, t + o, 0.05, 0.06, 0.003, 1800); }); tone(d, 'square', 780, 520, t + 0.2, 0.09, 0.07, 0.003, 2000); break;
    case 'moo': tone(d, 'sawtooth', 150, 118, t, 0.7, 0.09, 0.08, 600); tone(d, 'sine', 300, 236, t, 0.7, 0.04, 0.08); break;
    case 'quack': [0, 0.14].forEach(o => tone(d, 'sawtooth', 520, 340, t + o, 0.1, 0.07, 0.004, 1500)); break;
    case 'bark': [0, 0.16].forEach(o => { tone(d, 'sawtooth', 320, 170, t + o, 0.09, 0.1, 0.004, 1100); noise(d, t + o, 0.07, 0.06, 800); }); break;
    case 'meow': tone(d, 'triangle', 620, 980, t, 0.16, 0.08, 0.03, 2600); tone(d, 'triangle', 980, 560, t + 0.16, 0.26, 0.08, 0.01, 2600); break;
    case 'hoot': tone(d, 'sine', 392, 370, t, 0.22, 0.1, 0.04); tone(d, 'sine', 392, 340, t + 0.32, 0.4, 0.1, 0.04); break;
    case 'squeak': tone(d, 'sine', 2200, 3100, t, 0.06, 0.07); tone(d, 'sine', 2600, 3400, t + 0.08, 0.05, 0.06); break;
    case 'ribbit': [0, 0.13].forEach(o => tone(d, 'square', 180, 260, t + o, 0.09, 0.05, 0.004, 900)); break;
    case 'rustle': noise(d, t, 0.22, 0.09, 3800, 0.7); noise(d, t + 0.06, 0.16, 0.05, 2600, 0.9); break;
    case 'tink': tone(d, 'triangle', 1900, 1700, t, 0.07, 0.1); noise(d, t, 0.04, 0.08, 3000, 3); break;
    case 'knock': [0, 0.11].forEach(o => { tone(d, 'triangle', 190, 150, t + o, 0.06, 0.16); noise(d, t + o, 0.03, 0.08, 1200, 3); }); break;
    case 'flap': [0, 0.07, 0.14].forEach(o => noise(d, t + o, 0.05, 0.05, 1500, 1.5)); break;
  }
};

// ------------------------------------------------- generative music
let melIdx = 4;
AUDIO.tick = function (night) {
  if (!AUDIO.started || AUDIO.ctx.state !== 'running') return;
  const c = AUDIO.ctx, beat = BEAT, rich = AUDIO.rich;
  while (AUDIO.nextBeat < c.currentTime + 0.25) {
    const t = AUDIO.nextBeat, s = AUDIO.step;
    if (AUDIO.vol.music > 0.001) {
      const ch = CHORDS[Math.floor(s / 16) % 4];
      if (s % 16 === 0) {
        ch.forEach((n, i) => { const g = tone(AUDIO.music, 'sine', mtof(n), 0, t, beat * 16, 0.035, 0.6); g.connect(AUDIO.verb); });
        tone(AUDIO.music, 'triangle', mtof(ch[0] - 12), 0, t, beat * 6, 0.09, 0.02, 600);
        // a full orchestra of a farm: bells ring in each new chord
        if (rich >= 4) [ch[2] + 24, ch[3] + 24].forEach((n, i) => tone(AUDIO.music, 'sine', mtof(n), 0, t + i * 0.06, beat * 5, 0.022).connect(AUDIO.verb));
      }
      if (s % 16 === 8) tone(AUDIO.music, 'triangle', mtof(ch[1] - 12), 0, t, beat * 6, 0.07, 0.02, 600);
      // a growing farm adds a plucked arpeggio between the beats...
      if (rich >= 1 && !night && s % 2 === 1 && (rich >= 3 || s % 4 === 1)) tone(AUDIO.music, 'triangle', mtof(ch[(s >> 1) % 4] + 12), 0, t, beat * 1.6, 0.026, 0.004, 1800).connect(AUDIO.verb);
      // ...then a soft shaker and a heartbeat...
      if (rich >= 2) {
        if (s % 4 === 2) noise(AUDIO.music, t, 0.06, 0.02, 6500, 0.8, 'highpass');
        if (s % 8 === 0) tone(AUDIO.music, 'sine', 82, 48, t, 0.2, 0.09);
      }
      // ...and a slow second voice a third above the bass
      if (rich >= 3 && (s % 16 === 4 || s % 16 === 12)) tone(AUDIO.music, 'sine', mtof(ch[s % 16 === 4 ? 2 : 3] + 12), 0, t, beat * 7, 0.03, 0.5).connect(AUDIO.verb);
      // melody: a wandering walk, sparser at night
      const density = (night ? 0.28 : 0.5) + (rich >= 4 ? 0.12 : 0);
      if (Math.random() < density && s % 2 === 0 || s % 8 === 0) {
        melIdx = Math.max(0, Math.min(SCALE.length - 1, melIdx + [-2, -1, -1, 0, 1, 1, 2][(Math.random() * 7) | 0]));
        let n = SCALE[melIdx];
        if (s % 8 === 0) { const ct = ch.map(x => x + 12).concat(ch.map(x => x + 24)); n = ct.reduce((a, b) => Math.abs(b - n) < Math.abs(a - n) ? b : a); }
        if (night && Math.random() < 0.6) n -= 12;      // the night version of the tune sits lower and softer
        if (AUDIO.band > c.currentTime) tone(AUDIO.music, 'square', mtof(n + 12), 0, t, beat * 1.2, 0.022, 0.005, 2600);   // the travelling band joins in
        const g = tone(AUDIO.music, 'triangle', mtof(n), 0, t, beat * 3, 0.06, 0.01, 2400);
        g.connect(AUDIO.verb);
        // music-box sparkle an octave up
        if (Math.random() < 0.2) tone(AUDIO.music, 'sine', mtof(n + 12), 0, t, beat * 2, 0.02).connect(AUDIO.verb);
      }
    }
    // ambience
    if (AUDIO.vol.amb > 0.001) {
      // steady rain
      if (AUDIO.rain > 0.02) noise(AUDIO.amb, t, beat * 1.7, 0.035 * AUDIO.rain, 5200, 0.4, 'highpass');
      // zoomed in close, you hear what you're looking at
      const M = AUDIO.closeMix;
      if (M) {
        const A = AUDIO.amb;
        if (M.mill > 0.05 && s % 4 === 0) { tone(A, 'sawtooth', 96, 72, t, 0.55, 0.07 * M.mill, 0.12, 320); noise(A, t + 0.1, 0.3, 0.03 * M.mill, 700, 1.5); }
        if (M.bubble > 0.05 && Math.random() < 0.55) { const f = 260 + Math.random() * 260; tone(A, 'sine', f, f * 1.9, t + Math.random() * 0.2, 0.07, 0.08 * M.bubble); }
        if (M.fire > 0.05 && Math.random() < 0.6) noise(A, t + Math.random() * 0.2, 0.03, 0.09 * M.fire, 2600 + Math.random() * 2000, 3);
        if (M.hens > 0.05 && Math.random() < 0.14) [0, 0.09].forEach(o => tone(A, 'square', 620, 380, t + o, 0.05, 0.05 * M.hens, 0.003, 1800));
        if (M.cow > 0.05 && Math.random() < 0.03) tone(A, 'sawtooth', 150, 118, t, 0.7, 0.07 * M.cow, 0.08, 600);
        if (M.bees > 0.05 && s % 2 === 0) tone(A, 'sawtooth', 185 + Math.random() * 20, 195, t, 0.36, 0.03 * M.bees, 0.08, 1100);
        if (M.water > 0.05 && Math.random() < 0.3) { const f = 420 + Math.random() * 300; tone(A, 'sine', f, f * 1.8, t + Math.random() * 0.2, 0.06, 0.05 * M.water, 0.004, 2400); }
        if (M.steps > 0.05) for (let k = 0; k < Math.min(3, Math.ceil(M.steps * 3)); k++) noise(A, t + k * 0.13 + Math.random() * 0.05, 0.035, 0.07 * Math.min(1, M.steps), 380, 1.2, 'lowpass');
        if (M.hammer > 0.05 && s % 2 === 0) noise(A, t, 0.03, 0.06 * M.hammer, 2200, 4);
      }
      if (!night && Math.random() < 0.06) { const f = 2400 + Math.random() * 1600; for (let k = 0; k < 2 + (Math.random() * 3 | 0); k++) tone(AUDIO.amb, 'sine', f, f * (1.3 + Math.random() * 0.4), t + k * 0.09, 0.07, 0.03); }
      if (night && s % 2 === 0) { for (let k = 0; k < 3; k++) tone(AUDIO.amb, 'sine', 4200, 4300, t + k * 0.035, 0.025, 0.008); }
      if (Math.random() < 0.015) noise(AUDIO.amb, t, 2.5, 0.025, 500, 0.5, 'lowpass');
    }
    AUDIO.nextBeat += beat; AUDIO.step++;
  }
};
;(window.__stage = window.__stage || []).push('audio.js loaded');
