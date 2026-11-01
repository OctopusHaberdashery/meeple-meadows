// Meeple Meadows — synthesized audio: generative music, ambience and sound effects.
'use strict';

const AUDIO = {
  ctx: null, master: null, music: null, sfxBus: null, amb: null,
  vol: { master: 0.8, music: 0.5, sfx: 0.7, amb: 0.5 },
  started: false, nextBeat: 0, step: 0, chord: 0, lastSfx: {},
};

AUDIO.unlock = function () {
  if (AUDIO.ctx) { if (AUDIO.ctx.state === 'suspended') AUDIO.ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  const c = AUDIO.ctx = new AC();
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
AUDIO.applyVolume = function () {
  if (!AUDIO.ctx) return;
  const v = AUDIO.vol;
  AUDIO.master.gain.value = v.master;
  AUDIO.music.gain.value = v.music * 0.55;
  AUDIO.sfxBus.gain.value = v.sfx;
  AUDIO.amb.gain.value = v.amb * 0.6;
};
AUDIO.suspend = function () { if (AUDIO.ctx && AUDIO.ctx.state === 'running') AUDIO.ctx.suspend(); };
AUDIO.resume = function () { if (AUDIO.ctx && AUDIO.ctx.state === 'suspended') AUDIO.ctx.resume(); };

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

AUDIO.sfx = function (name) {
  if (!AUDIO.started || AUDIO.ctx.state !== 'running') return;
  const c = AUDIO.ctx, t = c.currentTime, d = AUDIO.sfxBus;
  // rate-limit repeats so a busy farm doesn't become a wall of noise
  const lim = { pop: 0.07, drop: 0.12, coin: 0.15, chop: 0.05, ding: 0.2 }[name] || 0.03;
  if (AUDIO.lastSfx[name] && t - AUDIO.lastSfx[name] < lim) return;
  AUDIO.lastSfx[name] = t;
  switch (name) {
    case 'click': tone(d, 'sine', 880, 660, t, 0.06, 0.15); break;
    case 'open': tone(d, 'triangle', 520, 780, t, 0.12, 0.12); break;
    case 'close': tone(d, 'triangle', 700, 440, t, 0.1, 0.1); break;
    case 'pop': tone(d, 'sine', 500 + Math.random() * 200, 1100, t, 0.09, 0.18); break;
    case 'drop': tone(d, 'triangle', 300, 180, t, 0.12, 0.12, 0.005, 1200); noise(d, t, 0.08, 0.05, 900); break;
    case 'coin': tone(d, 'square', 988, 988, t, 0.08, 0.05, 0.003, 3000); tone(d, 'square', 1319, 1319, t + 0.07, 0.22, 0.05, 0.003, 3000); break;
    case 'chop': noise(d, t, 0.12, 0.35, 1400, 2); tone(d, 'triangle', 220, 90, t, 0.12, 0.25); noise(d, t + 0.1, 0.25, 0.12, 600, 0.7); break;
    case 'rock': noise(d, t, 0.25, 0.35, 500, 1.2); tone(d, 'sine', 120, 60, t, 0.25, 0.35); break;
    case 'build': [0, 0.09, 0.18].forEach((o, i) => { noise(d, t + o, 0.07, 0.25, 1800 - i * 300, 3); tone(d, 'triangle', 300 - i * 30, 200, t + o, 0.08, 0.15); }); break;
    case 'ding': tone(d, 'sine', 1568, 1568, t, 0.5, 0.12); tone(d, 'sine', 2093, 2093, t + 0.04, 0.4, 0.06); break;
    case 'meeple': [523, 659, 784, 1047].forEach((f, i) => tone(d, 'triangle', f, f * 1.01, t + i * 0.08, 0.3, 0.12)); break;
    case 'level': [523, 659, 784, 1047, 1319].forEach((f, i) => { tone(d, 'triangle', f, f, t + i * 0.11, 0.5, 0.14); tone(d, 'sine', f / 2, f / 2, t + i * 0.11, 0.6, 0.08); }); break;
    case 'water': noise(d, t, 0.25, 0.08, 2600, 0.8, 'highpass'); break;
    case 'splash': noise(d, t, 0.3, 0.14, 1200, 0.9); tone(d, 'sine', 600, 300, t, 0.15, 0.06); break;
    case 'error': tone(d, 'square', 220, 180, t, 0.15, 0.06, 0.005, 1000); break;
    case 'buy': tone(d, 'triangle', 660, 990, t, 0.15, 0.15); tone(d, 'sine', 1320, 1320, t + 0.08, 0.25, 0.08); break;
  }
};

// ------------------------------------------------- generative music
// D major pentatonic-ish lullaby over a four-chord loop, ~76 bpm in eighths.
const CHORDS = [[50, 57, 62, 66], [47, 54, 59, 62], [43, 50, 55, 59], [45, 52, 57, 61]];
const SCALE = [62, 64, 66, 69, 71, 74, 76, 78, 81];
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
let melIdx = 4;
AUDIO.tick = function (night) {
  if (!AUDIO.started || AUDIO.ctx.state !== 'running') return;
  const c = AUDIO.ctx, beat = 60 / 76 / 2;
  while (AUDIO.nextBeat < c.currentTime + 0.25) {
    const t = AUDIO.nextBeat, s = AUDIO.step;
    if (AUDIO.vol.music > 0.001) {
      const ch = CHORDS[Math.floor(s / 16) % 4];
      if (s % 16 === 0) {
        ch.forEach((n, i) => { const g = tone(AUDIO.music, 'sine', mtof(n), 0, t, beat * 16, 0.035, 0.6); g.connect(AUDIO.verb); });
        tone(AUDIO.music, 'triangle', mtof(ch[0] - 12), 0, t, beat * 6, 0.09, 0.02, 600);
      }
      if (s % 16 === 8) tone(AUDIO.music, 'triangle', mtof(ch[1] - 12), 0, t, beat * 6, 0.07, 0.02, 600);
      // melody: a wandering walk, sparser at night
      const density = night ? 0.28 : 0.5;
      if (Math.random() < density && s % 2 === 0 || s % 8 === 0) {
        melIdx = Math.max(0, Math.min(SCALE.length - 1, melIdx + [-2, -1, -1, 0, 1, 1, 2][(Math.random() * 7) | 0]));
        let n = SCALE[melIdx];
        if (s % 8 === 0) { const ct = ch.map(x => x + 12).concat(ch.map(x => x + 24)); n = ct.reduce((a, b) => Math.abs(b - n) < Math.abs(a - n) ? b : a); }
        const g = tone(AUDIO.music, 'triangle', mtof(n), 0, t, beat * 3, 0.06, 0.01, 2400);
        g.connect(AUDIO.verb);
        // music-box sparkle an octave up
        if (Math.random() < 0.2) tone(AUDIO.music, 'sine', mtof(n + 12), 0, t, beat * 2, 0.02).connect(AUDIO.verb);
      }
    }
    // ambience
    if (AUDIO.vol.amb > 0.001) {
      if (!night && Math.random() < 0.06) { const f = 2400 + Math.random() * 1600; for (let k = 0; k < 2 + (Math.random() * 3 | 0); k++) tone(AUDIO.amb, 'sine', f, f * (1.3 + Math.random() * 0.4), t + k * 0.09, 0.07, 0.03); }
      if (night && s % 2 === 0) { for (let k = 0; k < 3; k++) tone(AUDIO.amb, 'sine', 4200, 4300, t + k * 0.035, 0.025, 0.008); }
      if (Math.random() < 0.015) noise(AUDIO.amb, t, 2.5, 0.025, 500, 0.5, 'lowpass');
    }
    AUDIO.nextBeat += beat; AUDIO.step++;
  }
};
;(window.__stage = window.__stage || []).push('audio.js loaded');
