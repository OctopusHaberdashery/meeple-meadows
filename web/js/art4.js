// Meeple Meadows — art, part 4: faceless running Meeples, hats, emote bubbles, soil textures,
// barnyard animals and buildings, compost, the orders board, found decorations and relics.
'use strict';

// ---------------------------------------------------------------- Meeples
// No faces: just a little body with stubby legs. frame -1 stands; 0..5 is the run cycle.
const MEEPLE_RUN_FRAMES = 6;
function meepleTorsoPath(g) {
  g.beginPath();
  g.arc(0, -17.6, 4.6, 0, Math.PI * 2);
  g.moveTo(0, -13.2);
  g.quadraticCurveTo(4.5, -13.6, 9, -12.6);
  g.quadraticCurveTo(11.8, -11.6, 10.6, -9);
  g.quadraticCurveTo(9.6, -7.8, 5.6, -8.4);
  g.quadraticCurveTo(5.2, -7.4, 5.0, -6.6);
  g.quadraticCurveTo(0, -5.2, -5.0, -6.6);
  g.quadraticCurveTo(-5.2, -7.4, -5.6, -8.4);
  g.quadraticCurveTo(-9.6, -7.8, -10.6, -9);
  g.quadraticCurveTo(-11.8, -11.6, -9, -12.6);
  g.quadraticCurveTo(-4.5, -13.6, 0, -13.2);
  g.closePath();
}
function meepleLeg(g, hx, ang, len, col, line) {
  g.save(); g.translate(hx, -7.6); g.rotate(ang);
  rrect(g, -2.4, -1.5, 4.8, 1.5 + len, 2.3);
  g.fillStyle = lgrad(g, -2.4, 0, 2.4, 0, [shade(col, 0.2), col, shade(col, -0.3)]); g.fill();
  stroke(g, line, 0.8);
  g.restore();
}
meepleSprite = function (col, S, frame = -1) {
  return makeSprite(26, 26, 13, 24, g => {
    const line = shade(col, -0.65);
    if (frame < 0) {
      meepleLeg(g, -2.5, 0.22, 7.3, shade(col, -0.08), line);
      meepleLeg(g, 2.5, -0.22, 7.3, shade(col, -0.08), line);
    } else {
      const ph = frame / MEEPLE_RUN_FRAMES * Math.PI * 2, s = Math.sin(ph), c = Math.cos(ph);
      // the leg swinging back is drawn first, a shade darker, so it reads as behind
      const a = { hx: 1.8, ang: -0.85 * s, len: 7.2 - 2.4 * Math.max(0, c) };
      const b = { hx: -1.8, ang: 0.85 * s, len: 7.2 - 2.4 * Math.max(0, -c) };
      const [back, front] = s > 0 ? [b, a] : [a, b];
      meepleLeg(g, back.hx, back.ang, back.len, shade(col, -0.28), line);
      meepleLeg(g, front.hx, front.ang, front.len, shade(col, -0.06), line);
    }
    g.save();
    meepleTorsoPath(g);
    g.fillStyle = lgrad(g, -10, -22, 10, 0, [shade(col, 0.35), col, shade(col, -0.35)]);
    g.fill('nonzero');
    g.clip('nonzero');
    g.fillStyle = rgba(shade(col, -0.6), 0.25); g.fillRect(3, -24, 10, 26);
    g.fillStyle = rgba('#ffffff', 0.2); g.beginPath(); g.ellipse(-4, -12, 3, 1.4, -0.3, 0, 6.28); g.fill();
    g.fillStyle = rgba('#ffffff', 0.3); g.beginPath(); g.ellipse(-1.6, -20.2, 1.8, 1, -0.3, 0, 6.28); g.fill();
    g.restore();
    meepleTorsoPath(g); stroke(g, line, 0.8);
  }, { edge: 1.1, S: S || Math.max(2, ART.S) });
};

// ---------------------------------------------------------------- hats (drawn around the head centre)
const HAT_DRAW = {
  straw(g) {
    ell(g, 0, -3.6, 7.6, 2.1, '#e2b85a', INK, 0.7);
    g.beginPath(); g.ellipse(0, -4.2, 4.2, 3.6, 0, Math.PI, 0); g.closePath(); g.fillStyle = lgrad(g, -4, -8, 4, -4, ['#f4d488', '#d8a848']); g.fill(); stroke(g, INK, 0.7);
    g.fillStyle = '#d8463a'; g.fillRect(-4.1, -5.4, 8.2, 1.3);
    g.strokeStyle = rgba('#a87828', 0.6); g.lineWidth = 0.4; for (let i = -6; i <= 6; i += 2) { g.beginPath(); g.moveTo(i, -4.4); g.lineTo(i * 1.15, -2.6); g.stroke(); }
  },
  flower(g) {
    const fl = [[-4.4, -2.6, '#f29ac0'], [-2.2, -4, '#ffffff'], [0.4, -4.5, '#f2d23a'], [3, -4, '#f29ac0'], [4.8, -2.6, '#a87ae8']];
    g.beginPath(); g.ellipse(0, -2.6, 5, 1.6, 0, Math.PI, 0); stroke(g, '#4f9a3a', 1.1);
    for (const [x, y, c] of fl) { leaf(g, x, y + 0.6, -0.6, 3, 1.2, '#5aa335', false); for (let k = 0; k < 5; k++) { const a = k / 5 * 6.28; ell(g, x + Math.cos(a) * 1.1, y + Math.sin(a) * 1.1, 0.95, 0.95, c, rgba(INK, 0.5), 0.3); } ell(g, x, y, 0.6, 0.6, '#f2a23a'); }
  },
  acorn(g) {
    g.beginPath(); g.ellipse(0, -1.8, 5.4, 4.6, 0, Math.PI, 0); g.closePath(); g.fillStyle = lgrad(g, -5, -6, 5, -2, ['#c8945a', '#8a5a2e']); g.fill(); stroke(g, INK, 0.7);
    g.save(); g.clip(); g.strokeStyle = rgba('#5a3a1a', 0.6); g.lineWidth = 0.4;
    for (let i = -8; i < 8; i += 1.8) { g.beginPath(); g.moveTo(i, -7); g.lineTo(i + 5, -1); g.moveTo(i + 5, -7); g.lineTo(i, -1); g.stroke(); }
    g.restore();
    g.beginPath(); g.moveTo(0, -6.3); g.quadraticCurveTo(0.5, -8.2, 1.8, -8.6); stroke(g, '#5a3a1a', 1.1);
  },
  beanie(g) {
    g.beginPath(); g.ellipse(0, -1.4, 5.2, 5.4, 0, Math.PI, 0); g.closePath(); g.fillStyle = lgrad(g, -5, -6, 5, -1, ['#f07060', '#c8382a']); g.fill(); stroke(g, INK, 0.7);
    rrect(g, -5.4, -2.6, 10.8, 2.4, 1); g.fillStyle = '#e8584a'; g.fill(); stroke(g, INK, 0.6);
    g.strokeStyle = rgba('#8a2018', 0.6); g.lineWidth = 0.4; for (let i = -4.5; i <= 4.5; i += 1.5) { g.beginPath(); g.moveTo(i, -2.4); g.lineTo(i, -0.4); g.stroke(); }
    ell(g, 0, -7.4, 1.9, 1.9, '#fbf3df', INK, 0.6);
  },
  bucket(g) {
    g.beginPath(); g.moveTo(-7, -1.2); g.quadraticCurveTo(0, -3.4, 7, -1.2); g.lineTo(5.4, -3.2); g.quadraticCurveTo(0, -4.6, -5.4, -3.2); g.closePath(); g.fillStyle = '#8a9a5a'; g.fill(); stroke(g, INK, 0.6);
    g.beginPath(); g.moveTo(-4.4, -3.4); g.lineTo(-3.6, -7.4); g.quadraticCurveTo(0, -8.4, 3.6, -7.4); g.lineTo(4.4, -3.4); g.quadraticCurveTo(0, -4.4, -4.4, -3.4); g.fillStyle = lgrad(g, -4, -8, 4, -3, ['#b0be7a', '#7a8a4a']); g.fill(); stroke(g, INK, 0.7);
    g.fillStyle = '#5a6a3a'; g.fillRect(-4.2, -4.6, 8.4, 1); leaf(g, 2.6, -5, -1, 3.2, 1.2, '#e8902a', false);
  },
  chef(g) {
    rrect(g, -4, -4.6, 8, 3.2, 0.8); g.fillStyle = '#f4f0e6'; g.fill(); stroke(g, INK, 0.6);
    [[-3, -6.8, 2.6], [0, -8, 3], [3, -6.8, 2.6]].forEach(([x, y, r]) => ell(g, x, y, r, r, '#fbfaf4', INK, 0.6));
    g.fillStyle = '#fbfaf4'; g.fillRect(-4.2, -7, 8.4, 2.4);
  },
  tophat(g) {
    ell(g, 0, -3.4, 7, 1.8, '#2a2430', INK, 0.7);
    g.beginPath(); g.moveTo(-4, -3.8); g.lineTo(-4.4, -11); g.quadraticCurveTo(0, -12, 4.4, -11); g.lineTo(4, -3.8); g.closePath(); g.fillStyle = lgrad(g, -4, 0, 4, 0, ['#4a4250', '#1e1a24']); g.fill(); stroke(g, INK, 0.7);
    ell(g, 0, -11, 4.4, 1.1, '#3a3440', INK, 0.5);
    g.fillStyle = '#8a3a4a'; g.fillRect(-4.1, -6, 8.2, 1.5);
  },
  crown(g) {
    g.beginPath(); g.moveTo(-5, -2.6); g.lineTo(-5.4, -8); g.lineTo(-2.7, -5.6); g.lineTo(0, -9.4); g.lineTo(2.7, -5.6); g.lineTo(5.4, -8); g.lineTo(5, -2.6); g.closePath();
    g.fillStyle = lgrad(g, 0, -9, 0, -2, ['#fff2a0', '#f2c23a', '#c88a10']); g.fill(); stroke(g, INK, 0.7);
    ell(g, 0, -4, 1, 1, '#d8463a', INK, 0.3); ell(g, -3.2, -3.8, 0.8, 0.8, '#3a8ad8', INK, 0.3); ell(g, 3.2, -3.8, 0.8, 0.8, '#4f9a3a', INK, 0.3);
    [[-5.4, -8], [0, -9.4], [5.4, -8]].forEach(([x, y]) => ell(g, x, y, 0.8, 0.8, '#fff6c0', INK, 0.3));
  },
};
function hatSprite(id) {
  const key = 'hat_' + id;
  if (!ART.sprites[key]) ART.sprites[key] = makeSprite(18, 16, 9, 13, g => HAT_DRAW[id](g), { edge: 0.9, S: Math.max(2, ART.S) });
  return ART.sprites[key];
}
HATS.forEach(h => {
  UI_ICON['hat_' + h.id] = g => {
    g.translate(16, 22); g.scale(2.2, 2.2);
    ell(g, 0, 0, 4.6, 4.6, '#d8c0a0', INK, 0.6);
    HAT_DRAW[h.id](g);
  };
});

// ---------------------------------------------------------------- emote bubbles
function drawEmote(ctx, x, y, k, a) {
  ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y);
  rrect(ctx, -7.5, -15, 15, 12.5, 5); ctx.fillStyle = '#fffaf0'; ctx.fill();
  ctx.beginPath(); ctx.moveTo(-2.5, -2.7); ctx.lineTo(0, 1.2); ctx.lineTo(2.5, -2.7); ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 0.8; rrect(ctx, -7.5, -15, 15, 12.5, 5); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-2.5, -2.5); ctx.lineTo(0, 1.2); ctx.lineTo(2.5, -2.5); ctx.stroke();
  ctx.lineCap = 'round';
  if (k === 'heart') {
    ctx.beginPath(); ctx.moveTo(0, -5); ctx.bezierCurveTo(-5.5, -8.5, -3.2, -13.4, 0, -10.6); ctx.bezierCurveTo(3.2, -13.4, 5.5, -8.5, 0, -5); ctx.fillStyle = '#e8463a'; ctx.fill();
  } else if (k === 'note') {
    ctx.fillStyle = INK; ctx.strokeStyle = INK; ctx.lineWidth = 1;
    ell(ctx, -1.6, -6.4, 1.6, 1.2, INK); ell(ctx, 2.6, -7.4, 1.6, 1.2, INK);
    ctx.beginPath(); ctx.moveTo(-0.2, -6.4); ctx.lineTo(-0.2, -12.2); ctx.lineTo(4, -13.2); ctx.lineTo(4, -7.4); ctx.stroke();
  } else if (k === 'zzz') {
    ctx.fillStyle = '#5a6aa8'; ctx.font = 'bold 6px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('z', -2.6, -6.6); ctx.font = 'bold 7.5px sans-serif'; ctx.fillText('z', 2.2, -9.8);
  } else if (k === 'wow') {
    ctx.fillStyle = '#e8a020';
    ctx.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 2 : 4.8, an = i / 10 * Math.PI * 2 - Math.PI / 2; ctx.lineTo(Math.cos(an) * r, -8.6 + Math.sin(an) * r); } ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

// ---------------------------------------------------------------- soil
// Seamless soil textures, 96 world units square (it divides the 384-unit ground chunk, so beds
// line up across chunks). Dry earth is the default; wet earth is painted over watered plots.
const SOIL_TILE = 96;
const SOIL_CV = {};
function soilCanvas(wet) {
  const res = 2, c = newCanvas(SOIL_TILE * res, SOIL_TILE * res), g = c.getContext('2d'), N = SOIL_TILE;
  g.scale(res, res);
  const r = mulberry(wet ? 7771 : 3331);
  const P = wet
    ? { base: '#4a2e1a', lo: '#382213', hi: '#5e3c24', clod: '#583820', clodHi: '#80603f', clodLo: '#26160b', peb: '#7e786c' }
    : { base: '#8e6a44', lo: '#785636', hi: '#a68058', clod: '#977248', clodHi: '#c09a6c', clodLo: '#5a3e26', peb: '#c8bca8' };
  g.fillStyle = P.base; g.fillRect(0, 0, N, N);
  // draw at (x,y) and at the wrapped copies so the tile repeats without seams
  const wrap = (x, y, rad, fn) => {
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
      const X = x + dx * N, Y = y + dy * N;
      if (X + rad < 0 || Y + rad < 0 || X - rad > N || Y - rad > N) continue;
      fn(X, Y);
    }
  };
  for (let k = 0; k < 28; k++) {
    const x = r() * N, y = r() * N, rad = 8 + r() * 16, col = r() < 0.5 ? P.lo : P.hi;
    wrap(x, y, rad, (X, Y) => { const gr = g.createRadialGradient(X, Y, 0, X, Y, rad); gr.addColorStop(0, rgba(col, 0.6)); gr.addColorStop(1, rgba(col, 0)); g.fillStyle = gr; g.fillRect(X - rad, Y - rad, rad * 2, rad * 2); });
  }
  for (let k = 0; k < 1100; k++) { g.fillStyle = rgba(r() < 0.5 ? P.clodLo : P.clodHi, 0.3 + r() * 0.35); g.fillRect(r() * N, r() * N, 0.5 + r() * 0.7, 0.5 + r() * 0.5); }
  // crumbly clods, lit from the top left
  for (let k = 0; k < 85; k++) {
    const x = r() * N, y = r() * N, w = 1.2 + r() * 2.6, h = w * (0.55 + r() * 0.3), rot = (r() - 0.5) * 0.8;
    wrap(x, y, w + 2, (X, Y) => {
      g.save(); g.translate(X, Y); g.rotate(rot);
      ell(g, 0.45, 0.8, w, h, rgba(P.clodLo, 0.75)); ell(g, 0, 0, w, h, P.clod); ell(g, -w * 0.25, -h * 0.3, w * 0.55, h * 0.45, rgba(P.clodHi, wet ? 0.55 : 0.85));
      g.restore();
    });
  }
  for (let k = 0; k < 10; k++) {
    const x = r() * N, y = r() * N, w = 0.9 + r() * 1.4;
    wrap(x, y, w + 2, (X, Y) => { ell(g, X + 0.4, Y + 0.6, w, w * 0.7, 'rgba(0,0,0,0.25)'); ell(g, X, Y, w, w * 0.7, P.peb); ell(g, X - w * 0.3, Y - w * 0.25, w * 0.4, w * 0.3, 'rgba(255,255,255,0.5)'); });
  }
  if (!wet) {
    // hairline cracks in the dry crust
    g.strokeStyle = rgba('#4a3018', 0.5); g.lineWidth = 0.5;
    for (let k = 0; k < 8; k++) {
      const pts = []; let x = r() * N, y = r() * N, a = r() * 6.28;
      for (let j = 0; j < 5; j++) { pts.push([x, y]); a += (r() - 0.5) * 1.6; x += Math.cos(a) * (2 + r() * 3); y += Math.sin(a) * (2 + r() * 3); }
      wrap(pts[0][0], pts[0][1], 20, (X, Y) => { const ox = X - pts[0][0], oy = Y - pts[0][1]; g.beginPath(); pts.forEach(([px, py], j) => j ? g.lineTo(px + ox, py + oy) : g.moveTo(px + ox, py + oy)); g.stroke(); });
    }
  } else {
    // little puddles catching the sky, and glossy wet specks
    for (let k = 0; k < 5; k++) {
      const x = r() * N, y = r() * N, w = 2.5 + r() * 3.5, h = w * 0.45;
      wrap(x, y, w + 2, (X, Y) => {
        ell(g, X, Y, w, h, 'rgba(30,18,10,0.75)');
        g.beginPath(); g.ellipse(X, Y, w, h, 0, Math.PI * 1.1, Math.PI * 1.9); g.strokeStyle = 'rgba(170,205,225,0.45)'; g.lineWidth = 0.6; g.stroke();
        ell(g, X - w * 0.35, Y - h * 0.2, w * 0.25, h * 0.25, 'rgba(220,240,255,0.35)');
      });
    }
    for (let k = 0; k < 180; k++) { g.fillStyle = 'rgba(255,255,255,' + (0.18 + r() * 0.3).toFixed(2) + ')'; g.fillRect(r() * N, r() * N, 0.5, 0.5); }
  }
  return c;
}
function soilPattern(g, wet) {
  const k = wet ? 'w' : 'd';
  if (!SOIL_CV[k]) SOIL_CV[k] = soilCanvas(wet);
  const pat = g.createPattern(SOIL_CV[k], 'repeat');
  try { if (pat.setTransform && window.DOMMatrix) pat.setTransform(new DOMMatrix().scale(0.5)); } catch (e) { }
  return pat;
}

// ---------------------------------------------------------------- barnyard critters (drawn live)
function drawHen(ctx, x, y, face, peck, col = '#fbf6ec') {
  ctx.save(); ctx.translate(x, y); ctx.scale(face, 1);
  ell(ctx, 0, 0.8, 4, 1.4, 'rgba(20,30,10,0.25)');
  ctx.strokeStyle = '#e8902a'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(-1, -1.5); ctx.lineTo(-1.2, 0.5); ctx.moveTo(1, -1.5); ctx.lineTo(1.2, 0.5); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-5, -5); ctx.quadraticCurveTo(-6.5, -8.5, -4, -8); ctx.lineTo(-3, -5); ctx.closePath(); ctx.fillStyle = shade(col, -0.12); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 0.6; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0, -4, 4.6, 3.2, 0, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill(); ctx.stroke();
  const hy = peck ? -2.6 : -7, hx = peck ? 4.8 : 3.6;
  ctx.beginPath(); ctx.arc(hx, hy, 2, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(hx - 0.8, hy - 1.8); ctx.quadraticCurveTo(hx, hy - 3.4, hx + 0.9, hy - 1.8); ctx.fillStyle = '#e8463a'; ctx.fill();
  ctx.beginPath(); ctx.moveTo(hx + 1.8, hy - 0.4); ctx.lineTo(hx + 3.3, hy + 0.2); ctx.lineTo(hx + 1.8, hy + 0.8); ctx.fillStyle = '#f2a23a'; ctx.fill();
  ctx.beginPath(); ctx.ellipse(-0.6, -3.8, 2.4, 1.5, 0.3, 0, Math.PI * 2); ctx.strokeStyle = rgba(INK, 0.4); ctx.lineWidth = 0.5; ctx.stroke();
  ctx.restore();
}
function drawCow(ctx, x, y, face, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(face, 1);
  ell(ctx, 0, 1, 12, 2.6, 'rgba(20,30,10,0.25)');
  ctx.fillStyle = '#e8e2d6'; ctx.strokeStyle = INK; ctx.lineWidth = 0.7;
  [[-7, 0], [-4, 0.4], [5, 0.4], [8, 0]].forEach(([lx, o]) => { ctx.fillRect(lx - 1.1, -6 + o, 2.2, 6.4 - o); ctx.strokeRect(lx - 1.1, -6 + o, 2.2, 6.4 - o); });
  const sw = Math.sin(t * 2) * 1.2;
  ctx.beginPath(); ctx.moveTo(-10, -11); ctx.quadraticCurveTo(-13 + sw, -7, -12 + sw, -3); ctx.stroke();
  rrect(ctx, -11, -15, 21, 10, 4.5); ctx.fillStyle = '#fbf8f0'; ctx.fill(); ctx.stroke();
  ctx.save(); rrect(ctx, -11, -15, 21, 10, 4.5); ctx.clip();
  ell(ctx, -5, -12, 4, 3, '#3a2e2a'); ell(ctx, 4, -8, 3.4, 2.6, '#3a2e2a'); ctx.restore();
  ell(ctx, 1, -5, 2.2, 1.3, '#f2a8b0', INK, 0.5);
  const hb = Math.sin(t * 0.8) > 0.3 ? 4 : 0;   // head dips down to graze now and then
  rrect(ctx, 8, -16 + hb, 7, 8, 3); ctx.fillStyle = '#fbf8f0'; ctx.fill(); ctx.stroke();
  rrect(ctx, 10.6, -11 + hb, 5.4, 4, 2); ctx.fillStyle = '#f2b8b8'; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(9, -15 + hb); ctx.lineTo(7, -17.5 + hb); ctx.moveTo(13, -15.6 + hb); ctx.lineTo(14.6, -18 + hb); ctx.strokeStyle = '#c8b890'; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.restore();
}
function drawBee(ctx, x, y, t) {
  const w = Math.abs(Math.sin(t * 40)) * 1.6 + 0.4;
  ell(ctx, x - 0.6, y - 1.6, w, 1.2, 'rgba(255,255,255,0.8)'); ell(ctx, x + 0.6, y - 1.6, w, 1.2, 'rgba(255,255,255,0.8)');
  ell(ctx, x, y, 1.8, 1.3, '#f2c23a', INK, 0.4); ctx.fillStyle = INK; ctx.fillRect(x - 0.3, y - 1.2, 0.7, 2.4);
}

// ---------------------------------------------------------------- icons
ICON_DRAW.eggs = function (g) {
  g.translate(16, 18);
  g.beginPath(); g.moveTo(-12, -2); g.lineTo(12, -2); g.lineTo(9, 9); g.lineTo(-9, 9); g.closePath(); g.fillStyle = '#d8a860'; g.fill(); stroke(g, INK, 0.9);
  [[-5, -5, '#fbf6ec'], [1, -7, '#e8c8a0'], [6, -4, '#fbf6ec'], [-1, -3, '#f2dcc0']].forEach(([x, y, c]) => { g.beginPath(); g.ellipse(x, y, 3.4, 4.4, 0, 0, Math.PI * 2); g.fillStyle = rgrad(g, x, y, 4.4, ['#ffffff', c, shade(c, -0.15)], x - 1.2, y - 1.6); g.fill(); stroke(g, INK, 0.7); });
  g.strokeStyle = '#a87838'; g.lineWidth = 0.8; for (let y = 1; y < 9; y += 3) { g.beginPath(); g.moveTo(-11, y); g.lineTo(11, y); g.stroke(); }
};
ICON_DRAW.milk = function (g) {
  g.translate(16, 17);
  g.beginPath(); g.moveTo(-4, -13); g.lineTo(4, -13); g.lineTo(4, -9); g.quadraticCurveTo(9, -6, 9, 0); g.lineTo(9, 11); g.lineTo(-9, 11); g.lineTo(-9, 0); g.quadraticCurveTo(-9, -6, -4, -9); g.closePath();
  g.fillStyle = lgrad(g, -9, 0, 9, 0, ['#ffffff', '#f4f2ea', '#d8d4c8']); g.fill(); stroke(g, INK, 0.9);
  g.fillStyle = '#5a8ad8'; g.fillRect(-9, 1, 18, 5); g.strokeStyle = INK; g.lineWidth = 0.6; g.strokeRect(-9, 1, 18, 5);
  rrect(g, -4.6, -15, 9.2, 3, 1); g.fillStyle = '#5a8ad8'; g.fill(); stroke(g, INK, 0.7);
  ell(g, -4.5, -3, 1.4, 4, 'rgba(255,255,255,0.8)');
};
ICON_DRAW.honey = function (g) {
  g.translate(16, 18);
  rrect(g, -9, -9, 18, 19, 4); g.fillStyle = lgrad(g, -9, 0, 9, 0, ['#ffd860', '#f2a820', '#c87a10']); g.fill(); stroke(g, INK, 0.9);
  rrect(g, -10, -13, 20, 5, 2); g.fillStyle = '#c8945a'; g.fill(); stroke(g, INK, 0.8);
  g.beginPath(); g.moveTo(-7, -8); g.quadraticCurveTo(-6, -3, -4, -4); g.quadraticCurveTo(-3, -1, -1, -3); g.quadraticCurveTo(1, 0, 3, -4); g.quadraticCurveTo(5, -2, 7, -8); g.fillStyle = '#ffd860'; g.fill();
  rrect(g, -5, 0, 10, 6, 1.5); g.fillStyle = '#fbf3df'; g.fill(); stroke(g, INK, 0.6);
  g.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; g.lineTo(Math.cos(a) * 2, 3 + Math.sin(a) * 2); } g.closePath(); g.fillStyle = '#f2b830'; g.fill(); stroke(g, INK, 0.4);
  g.save(); g.translate(9, -12); g.rotate(0.6); g.fillStyle = '#a87440'; g.fillRect(-1, -6, 2, 12); ell(g, 0, 7, 2.4, 2.8, '#c8945a', INK, 0.6); g.restore();
};
ICON_DRAW.fertilizer = function (g) {
  g.translate(16, 17);
  g.beginPath(); g.moveTo(-8, -10); g.quadraticCurveTo(-13, 0, -10, 10); g.quadraticCurveTo(0, 13, 10, 10); g.quadraticCurveTo(13, 0, 8, -10); g.closePath();
  g.fillStyle = rgrad(g, 0, 0, 13, ['#c8a878', '#a8865a', '#806240'], -3, -4); g.fill(); stroke(g, INK, 0.9);
  ell(g, 0, -10, 8, 2.4, '#4a3020', INK, 0.7);
  for (let i = 0; i < 6; i++) ell(g, -5 + i * 2, -11 + (i % 2), 1.2, 1, '#6a4a30');
  leaf(g, -1, 2, -1.4, 8, 3.4, '#5aa335'); leaf(g, 1, 2, -1.9, 7, 3, '#7cc24a');
  g.beginPath(); g.moveTo(-6, 6); g.lineTo(6, 6); stroke(g, '#5a3a1a', 0.8);
};
ICON_DRAW_GOODS.pan = function (g, o) {
  g.translate(15, 17);
  g.save(); g.translate(10, 2); g.rotate(-0.3); g.fillStyle = '#3a3030'; g.fillRect(0, -1.5, 9, 3); g.restore();
  ell(g, 0, 2, 12, 6, '#4a4040', INK, 0.9); ell(g, 0, 1, 10.5, 4.8, '#2a2424');
  ell(g, 0, 0.5, 9.5, 4.2, rgrad(g, 0, 0, 9, ['#fff0a0', o.c, '#d89a2a'], -2, -1));
  [[-4, 0, '#e23a2a'], [3, -1, '#5aa335'], [0, 2, '#c69a62'], [5, 2, '#e23a2a'], [-6, 2, '#5aa335']].forEach(([x, y, c]) => ell(g, x, y, 1.6, 1, c));
};
ICON_DRAW_GOODS.cheese = function (g, o) {
  g.translate(16, 18);
  g.beginPath(); g.moveTo(-12, 2); g.lineTo(8, -9); g.lineTo(12, 2); g.closePath(); g.fillStyle = shade(o.c, 0.25); g.fill(); stroke(g, INK, 0.8);
  g.beginPath(); g.moveTo(-12, 2); g.lineTo(12, 2); g.lineTo(12, 10); g.lineTo(-12, 10); g.closePath(); g.fillStyle = lgrad(g, -12, 0, 12, 0, [shade(o.c, 0.1), o.c, shade(o.c, -0.2)]); g.fill(); stroke(g, INK, 0.9);
  [[-6, 6, 1.8], [2, 5, 1.3], [7, 7.5, 1.6], [-1, 8.5, 0.9], [4, -2, 1.1], [-3, 0.4, 0.8]].forEach(([x, y, r]) => ell(g, x, y, r, r * 0.8, shade(o.c, -0.3)));
};
const RELIC_DRAW = {
  horseshoe(g) { g.translate(16, 16); g.beginPath(); g.arc(0, -1, 9, Math.PI * 0.85, Math.PI * 2.15); g.strokeStyle = INK; g.lineWidth = 6; g.stroke(); g.strokeStyle = '#a8603a'; g.lineWidth = 4.2; g.stroke(); for (let i = 0; i < 6; i++) { const a = Math.PI * (0.95 + i * 0.22); ell(g, Math.cos(a) * 9, -1 + Math.sin(a) * 9, 0.8, 0.8, '#3a2010'); } },
  oldcoin(g) { g.translate(16, 16); blob(g, 0, 0, 11, '#c8ccd0', 0.5, -0.3); stroke(g, INK, 1); g.beginPath(); g.arc(0, 0, 8, 0, 6.28); stroke(g, '#8a9096', 0.8); g.save(); g.translate(0, 6); g.scale(0.5, 0.5); meeplePath(g); g.restore(); g.fillStyle = '#9aa0a6'; g.fill(); },
  arrowhead(g) { g.translate(16, 16); g.beginPath(); g.moveTo(0, -12); g.lineTo(8, 6); g.lineTo(3, 4); g.lineTo(0, 11); g.lineTo(-3, 4); g.lineTo(-8, 6); g.closePath(); g.fillStyle = lgrad(g, -8, -10, 8, 10, ['#9aa0b0', '#5a6070']); g.fill(); stroke(g, INK, 0.9); g.strokeStyle = rgba('#ffffff', 0.4); g.lineWidth = 0.6; for (let i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(i * 2, -6 + Math.abs(i) * 3); g.lineTo(i * 4, 2); g.stroke(); } },
  fossil(g) { g.translate(16, 16); blob(g, 0, 0, 11, '#d8ccb0', 0.4, -0.25); stroke(g, INK, 0.9); g.beginPath(); for (let a = 0; a < Math.PI * 5; a += 0.2) { const r = 0.6 * a; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } stroke(g, '#8a7a5a', 1.2); },
  watch(g) { g.translate(16, 17); g.beginPath(); g.arc(0, -11, 2.4, 0, 6.28); stroke(g, '#c8a040', 1.4); blob(g, 0, 0, 10, '#e8c050', 0.5, -0.3); stroke(g, INK, 0.9); ell(g, 0, 0, 7.5, 7.5, '#fbf8ee', INK, 0.6); for (let i = 0; i < 12; i++) { const a = i / 12 * 6.28; ell(g, Math.cos(a) * 6, Math.sin(a) * 6, 0.4, 0.4, INK); } g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -4.5); g.moveTo(0, 0); g.lineTo(3, 1.5); stroke(g, INK, 0.8); },
  bottle(g) { g.translate(16, 17); g.beginPath(); g.moveTo(-2.5, -13); g.lineTo(2.5, -13); g.lineTo(2.5, -7); g.quadraticCurveTo(8, -5, 8, 2); g.lineTo(8, 10); g.lineTo(-8, 10); g.lineTo(-8, 2); g.quadraticCurveTo(-8, -5, -2.5, -7); g.closePath(); g.fillStyle = rgba('#4a8ad8', 0.85); g.fill(); stroke(g, INK, 0.9); rrect(g, -3, -15, 6, 3, 1); g.fillStyle = '#a8784a'; g.fill(); stroke(g, INK, 0.6); g.save(); g.translate(0, 3); g.rotate(0.3); rrect(g, -2, -5, 4, 10, 1.5); g.fillStyle = '#f4e8c8'; g.fill(); stroke(g, INK, 0.5); g.restore(); ell(g, -5, -1, 1.2, 4, 'rgba(255,255,255,0.6)'); },
  key(g) { g.translate(16, 16); g.rotate(-0.6); g.beginPath(); g.arc(-7, 0, 5, 0, 6.28); g.moveTo(-2, 0); g.lineTo(11, 0); g.moveTo(8, 0); g.lineTo(8, 4); g.moveTo(11, 0); g.lineTo(11, 3.5); g.strokeStyle = INK; g.lineWidth = 4; g.stroke(); g.strokeStyle = '#d8a83a'; g.lineWidth = 2.4; g.stroke(); },
  teacup(g) { g.translate(15, 17); ell(g, 0, 8, 12, 3, '#fbf8f0', INK, 0.8); g.beginPath(); g.moveTo(-9, -5); g.quadraticCurveTo(-9, 8, 0, 8); g.quadraticCurveTo(9, 8, 9, -5); g.closePath(); g.fillStyle = '#fbf8f0'; g.fill(); stroke(g, INK, 0.9); g.beginPath(); g.arc(11, 0, 3.4, -1.2, 1.4); stroke(g, INK, 1.6); ell(g, 0, -5, 9, 2.4, '#e8d8c0', INK, 0.7); [[-4, 1], [3, 3]].forEach(([x, y]) => { ell(g, x, y, 1.6, 1.6, '#e87aa0'); leaf(g, x + 1.4, y + 0.6, 0.4, 3, 1.2, '#5aa335', false); }); g.beginPath(); g.moveTo(6, -3); g.lineTo(4, 1); g.lineTo(6, 3); stroke(g, INK, 0.5); },
  marble(g) { g.translate(16, 16); blob(g, 0, 0, 9, '#7ac86a', 0.6, -0.35); stroke(g, INK, 0.9); g.beginPath(); g.moveTo(-6, 3); g.bezierCurveTo(-2, -6, 3, 6, 6, -3); stroke(g, '#2a7a5a', 1.6); ell(g, -3, -4, 2.4, 1.6, 'rgba(255,255,255,0.7)'); },
  figurine(g) { g.translate(16, 28); g.scale(1.1, 1.1); meeplePath(g); g.fillStyle = lgrad(g, -10, -22, 10, 0, ['#d8a86a', '#a8743e', '#7a4e28']); g.fill(); stroke(g, INK, 0.9); g.strokeStyle = rgba('#5a3a1a', 0.5); g.lineWidth = 0.5; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(-8 + i * 4, -11); g.quadraticCurveTo(-7 + i * 4, -6, -6 + i * 4, -2); g.stroke(); } },
};
RELICS.forEach(r => { UI_ICON['relic_' + r.id] = RELIC_DRAW[r.id]; });
Object.assign(UI_ICON, {
  orders(g) {
    g.translate(16, 16);
    rrect(g, -10, -12, 20, 24, 2); g.fillStyle = '#f4e8c8'; g.fill(); stroke(g, INK, 0.9);
    g.strokeStyle = rgba('#8a6a4a', 0.7); g.lineWidth = 1; for (let y = -5; y < 10; y += 4) { g.beginPath(); g.moveTo(-6, y); g.lineTo(6, y); g.stroke(); }
    ell(g, 0, -11, 2.4, 2.4, '#e8463a', INK, 0.7);
    g.beginPath(); g.moveTo(-6, -7); g.lineTo(-3, -7); stroke(g, '#5aa335', 1.6);
  },
  alert(g) {
    g.translate(16, 17);
    g.beginPath(); g.moveTo(0, -12); g.lineTo(12, 10); g.lineTo(-12, 10); g.closePath(); g.fillStyle = '#f2c23a'; g.fill(); stroke(g, INK, 1.1);
    g.fillStyle = INK; rrect(g, -1.4, -5, 2.8, 9, 1.2); g.fill(); ell(g, 0, 7, 1.6, 1.6, INK);
  },
  ribbon(g) {
    g.translate(16, 13);
    [[-4, 0.3], [4, -0.3]].forEach(([x, a]) => { g.save(); g.translate(x * 0.5, 4); g.rotate(a); g.beginPath(); g.moveTo(-3, 0); g.lineTo(3, 0); g.lineTo(3.5, 14); g.lineTo(0, 11); g.lineTo(-3.5, 14); g.closePath(); g.fillStyle = '#3a6ad8'; g.fill(); stroke(g, INK, 0.7); g.restore(); });
    for (let i = 0; i < 14; i++) { const a = i / 14 * 6.28; ell(g, Math.cos(a) * 8, Math.sin(a) * 8, 3, 3, '#4a7ae8', INK, 0.5); }
    ell(g, 0, 0, 7, 7, '#5a8af0', INK, 0.8); ell(g, 0, 0, 4.4, 4.4, '#f2c23a', INK, 0.6);
  },
  chart(g) {
    g.translate(16, 16);
    rrect(g, -12, -11, 24, 22, 3); g.fillStyle = '#fbf8f0'; g.fill(); stroke(g, INK, 0.9);
    [[-7, 6], [-2, 2], [3, -1], [8, -6]].forEach(([x, h], i) => { g.fillStyle = ['#9ad870', '#6ab850', '#4f9a30', '#3a7a28'][i]; g.fillRect(x - 2, Math.min(7, h), 4, 7 - Math.min(7, h)); });
    g.beginPath(); g.moveTo(-9, 2); g.lineTo(-3, -2); g.lineTo(2, -1); g.lineTo(9, -8); stroke(g, '#e8a020', 1.4);
  },
  journal(g) {
    g.translate(16, 16);
    rrect(g, -11, -12, 22, 24, 2.5); g.fillStyle = lgrad(g, -11, 0, 11, 0, ['#5a8a4a', '#3f6e3a']); g.fill(); stroke(g, INK, 1);
    g.fillStyle = '#fbf3df'; g.fillRect(8, -11, 2, 22);
    rrect(g, -6, -7, 12, 9, 1.5); g.fillStyle = '#f4e8c8'; g.fill(); stroke(g, INK, 0.6);
    leaf(g, -2, 0, -1.2, 6, 2.4, '#5aa335'); leaf(g, 1, 0, -2, 5, 2, '#7cc24a');
    g.fillStyle = '#d8463a'; g.fillRect(2, -12, 3, 8); g.beginPath(); g.moveTo(2, -4); g.lineTo(3.5, -6); g.lineTo(5, -4); g.fill();
  },
});

// ---------------------------------------------------------------- buildings
Object.assign(BUILD_DRAW, {
  compost(g) {
    // slatted wooden bin heaped with dark compost
    g.beginPath(); g.ellipse(0, -30, 16, 10, 0, Math.PI, 0); g.fillStyle = rgrad(g, -4, -36, 18, ['#6a4a30', '#4a3020', '#2e1e12']); g.fill(); stroke(g, INK, 0.9);
    [[-8, -34, '#e8902a'], [5, -36, '#9fd27a'], [-2, -38, '#f2d23a'], [9, -31, '#c2306a']].forEach(([x, y, c]) => { g.save(); g.translate(x, y); g.rotate(x * 0.1); ell(g, 0, 0, 2.6, 1.2, c, INK, 0.4); g.restore(); });
    for (let i = 0; i < 4; i++) { planks(g, -18, -30 + i * 6, 36, 4.5, i % 2 ? '#a8743e' : '#9a6a38', true); }
    g.fillStyle = '#6a4228'; [-19, 16].forEach(x => { g.fillRect(x, -34, 3, 30); g.strokeStyle = INK; g.lineWidth = 0.7; g.strokeRect(x, -34, 3, 30); });
    g.save(); g.translate(14, -8); g.rotate(-0.15); g.fillStyle = '#8a8a8a'; g.fillRect(-1, -26, 2, 22); g.beginPath(); g.moveTo(-4, -4); g.lineTo(4, -4); g.lineTo(3, 2); g.lineTo(-3, 2); g.closePath(); g.fillStyle = '#9aa0a6'; g.fill(); stroke(g, INK, 0.6); g.restore();
  },
  noticeboard(g) {
    g.fillStyle = '#6a4228'; [-16, 13].forEach(x => { g.fillRect(x, -60, 3.5, 56); g.strokeStyle = INK; g.lineWidth = 0.8; g.strokeRect(x, -60, 3.5, 56); });
    planks(g, -19, -58, 38, 30, '#b07a42', false);
    rrect(g, -16, -55, 32, 24, 1.5); g.fillStyle = '#c89a62'; g.fill(); stroke(g, INK, 0.7);
    [[-13, -53, 10, 12, -0.08], [-1, -54, 10, 9, 0.06], [3, -43, 10, 11, -0.04]].forEach(([x, y, w, h, a]) => { g.save(); g.translate(x + w / 2, y + h / 2); g.rotate(a); g.fillStyle = '#fbf3df'; g.fillRect(-w / 2, -h / 2, w, h); g.strokeStyle = INK; g.lineWidth = 0.5; g.strokeRect(-w / 2, -h / 2, w, h); g.strokeStyle = rgba('#8a6a4a', 0.6); for (let yy = -h / 2 + 3; yy < h / 2 - 1; yy += 2) { g.beginPath(); g.moveTo(-w / 2 + 1.5, yy); g.lineTo(w / 2 - 1.5, yy); g.stroke(); } ell(g, 0, -h / 2 + 0.5, 1, 1, '#e8463a', INK, 0.3); g.restore(); });
    g.beginPath(); g.moveTo(-19, -58); g.lineTo(0, -68); g.lineTo(19, -58); g.closePath(); g.fillStyle = '#9a6a3a'; g.fill();
    g.beginPath(); g.moveTo(-23, -58); g.lineTo(0, -70); g.lineTo(23, -58); g.lineTo(20, -56); g.lineTo(0, -66.5); g.lineTo(-20, -56); g.closePath(); g.fillStyle = '#7a4e2e'; g.fill(); stroke(g, INK, 0.9);
  },
  coop(g) {
    // little henhouse on stilts with a ramp and a fenced run
    g.fillStyle = '#6a4228'; [-30, -8, 18].forEach(x => { g.fillRect(x, -30, 4, 24); g.strokeStyle = INK; g.lineWidth = 0.7; g.strokeRect(x, -30, 4, 24); });
    planks(g, -32, -66, 54, 36, '#d8b07a');
    g.save(); g.beginPath(); g.moveTo(-32, -65); g.lineTo(-5, -86); g.lineTo(22, -65); g.closePath(); g.clip(); planks(g, -32, -88, 54, 24, '#c8a06a'); g.restore();
    g.beginPath(); g.moveTo(-38, -64); g.lineTo(-5, -90); g.lineTo(28, -64); g.lineTo(24, -60); g.lineTo(-5, -84); g.lineTo(-34, -60); g.closePath(); g.fillStyle = '#b8483a'; g.fill(); stroke(g, INK, 1);
    g.strokeStyle = rgba('#6a2018', 0.5); g.lineWidth = 0.6; for (let i = 1; i < 5; i++) { g.beginPath(); g.moveTo(-36 + i * 6.5, -64 + i * -0.5); g.lineTo(-5, -88); g.stroke(); }
    g.beginPath(); g.arc(-12, -40, 6, Math.PI, 0); g.lineTo(-6, -32); g.lineTo(-18, -32); g.closePath(); g.fillStyle = '#3a2a1a'; g.fill(); stroke(g, INK, 0.8);
    rrect(g, 4, -58, 12, 10, 1.5); g.fillStyle = '#fbf3df'; g.fill(); stroke(g, INK, 0.7);
    g.fillStyle = '#e9c25a'; for (let i = 0; i < 5; i++) g.fillRect(5 + i * 2.2, -52 - (i % 2), 1.6, 3);
    ell(g, 10, -53, 2, 1.6, '#fbf6ec', INK, 0.4);
    g.save(); g.translate(-12, -32); g.rotate(0.62); planks(g, -4, 0, 8, 26, '#a8743e', false); g.restore();
    // fence posts and wire
    for (let x = 26; x <= 46; x += 10) { g.fillStyle = '#8a5a32'; g.fillRect(x, -26, 3, 22); g.strokeStyle = INK; g.lineWidth = 0.6; g.strokeRect(x, -26, 3, 22); }
    g.strokeStyle = rgba('#5a4a3a', 0.8); g.lineWidth = 0.6; for (let y = -22; y <= -8; y += 5) { g.beginPath(); g.moveTo(22, y); g.lineTo(48, y); g.stroke(); }
    ell(g, -40, -8, 7, 3.6, '#e9c25a', INK, 0.6);
  },
  hive(g) {
    // straw skep on a little wooden stand
    g.fillStyle = '#6a4228'; [-12, 9].forEach(x => { g.fillRect(x, -16, 3, 14); g.strokeStyle = INK; g.lineWidth = 0.7; g.strokeRect(x, -16, 3, 14); });
    planks(g, -15, -19, 30, 4, '#a8743e', true);
    g.beginPath(); g.moveTo(-13, -19); g.bezierCurveTo(-15, -40, -8, -52, 0, -52); g.bezierCurveTo(8, -52, 15, -40, 13, -19); g.closePath();
    g.fillStyle = lgrad(g, -13, -50, 13, -19, ['#f2d488', '#d8a848', '#a8782a']); g.fill(); stroke(g, INK, 1);
    g.save(); g.clip(); g.strokeStyle = rgba('#8a5a1a', 0.7); g.lineWidth = 0.9;
    for (let y = -48; y < -19; y += 4.2) { g.beginPath(); g.ellipse(0, y, 16, 2.2, 0, 0, Math.PI); g.stroke(); }
    g.restore();
    g.beginPath(); g.ellipse(0, -22.5, 4, 2.4, 0, Math.PI, 0); g.closePath(); g.fillStyle = '#2a1a0e'; g.fill(); stroke(g, INK, 0.6);
    ell(g, 7, -36, 1.6, 1.2, '#f2c23a', INK, 0.4); ell(g, -5, -42, 1.6, 1.2, '#f2c23a', INK, 0.4);
  },
  barn(g) {
    // sage-green dairy barn with a hay loft, milk churns and a bale
    stoneWall(g, -40, -22, 80, 12, '#a8a294');
    g.beginPath(); g.moveTo(-40, -22); g.lineTo(-40, -64); g.lineTo(-24, -84); g.lineTo(24, -84); g.lineTo(40, -64); g.lineTo(40, -22); g.closePath();
    g.save(); g.clip(); planks(g, -40, -86, 80, 66, '#7aa08a'); g.restore();
    g.beginPath(); g.moveTo(-40, -22); g.lineTo(-40, -64); g.lineTo(-24, -84); g.lineTo(24, -84); g.lineTo(40, -64); g.lineTo(40, -22); stroke(g, INK, 1);
    g.beginPath(); g.moveTo(-46, -60); g.lineTo(-26, -88); g.lineTo(26, -88); g.lineTo(46, -60); stroke(g, INK, 6.5);
    g.beginPath(); g.moveTo(-46, -60); g.lineTo(-26, -88); g.lineTo(26, -88); g.lineTo(46, -60); stroke(g, '#6a6a72', 4.5);
    g.fillStyle = '#fbf3df'; g.fillRect(-16, -50, 32, 28); g.strokeStyle = INK; g.lineWidth = 0.9; g.strokeRect(-16, -50, 32, 28);
    planks(g, -14, -48, 13, 26, '#5a8a72'); planks(g, 1, -48, 13, 26, '#5a8a72');
    g.strokeStyle = '#fbf3df'; g.lineWidth = 2; [[-14, 1], [1, 14]].forEach(([a, b]) => { g.beginPath(); g.moveTo(a, -48); g.lineTo(b - 1, -22); g.moveTo(b - 1, -48); g.lineTo(a, -22); g.stroke(); });
    g.fillStyle = '#fbf3df'; g.fillRect(-9, -74, 18, 14); g.fillStyle = '#3a2a1a'; g.fillRect(-7, -72, 14, 10);
    g.fillStyle = '#e9c25a'; for (let i = 0; i < 7; i++) g.fillRect(-7 + i * 2, -66 - (i % 3), 1.6, 4 + (i % 3));
    rrect(g, -50, -18, 18, 13, 2); g.fillStyle = '#e9c25a'; g.fill(); stroke(g, INK, 0.8); g.strokeStyle = '#b8902a'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(-50, -12); g.lineTo(-32, -12); g.stroke();
    [[38, -2], [46, 2]].forEach(([x, y]) => { rrect(g, x - 4, y - 14, 8, 14, 2); g.fillStyle = lgrad(g, x - 4, 0, x + 4, 0, ['#e8eef0', '#a8b0b8']); g.fill(); stroke(g, INK, 0.7); rrect(g, x - 2.5, y - 17, 5, 3, 1); g.fill(); stroke(g, INK, 0.6); });
  },
  gnome(g) {
    ell(g, 0, -6, 7, 3, '#9a948a', INK, 0.6);
    g.beginPath(); g.moveTo(-6, -8); g.quadraticCurveTo(-7, -20, 0, -22); g.quadraticCurveTo(7, -20, 6, -8); g.closePath(); g.fillStyle = '#4a7ad8'; g.fill(); stroke(g, INK, 0.8);
    g.beginPath(); g.moveTo(-5, -20); g.quadraticCurveTo(0, -12, 5, -20); g.quadraticCurveTo(4, -27, 0, -27); g.quadraticCurveTo(-4, -27, -5, -20); g.fillStyle = '#fbf8f0'; g.fill(); stroke(g, INK, 0.7);
    ell(g, 0, -27, 4, 3, '#f2c0a0', INK, 0.6);
    g.beginPath(); g.moveTo(-5, -28); g.quadraticCurveTo(-3, -40, 4, -44); g.quadraticCurveTo(2, -36, 5, -28); g.closePath(); g.fillStyle = '#d8463a'; g.fill(); stroke(g, INK, 0.8);
  },
  wheel(g) {
    ell(g, 6, -6, 8, 4, '#9a948a', INK, 0.6);
    g.save(); g.translate(-2, -20); g.scale(0.85, 1);
    g.beginPath(); g.arc(0, 0, 15, 0, 6.28); g.strokeStyle = INK; g.lineWidth = 5; g.stroke(); g.strokeStyle = '#a8743e'; g.lineWidth = 3.2; g.stroke();
    for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * 13, Math.sin(a) * 13); stroke(g, '#8a5a32', 1.6); }
    ell(g, 0, 0, 3.4, 3.4, '#6a4228', INK, 0.7); g.restore();
  },
  stump(g) {
    g.beginPath(); g.moveTo(-14, -6); g.lineTo(-12, -24); g.lineTo(12, -24); g.lineTo(14, -6); g.quadraticCurveTo(0, -2, -14, -6); g.fillStyle = lgrad(g, -14, 0, 14, 0, ['#9a6a40', '#7a4e2e', '#5a3a22']); g.fill(); stroke(g, INK, 0.9);
    ell(g, 0, -24, 12, 4.4, '#d8b07a', INK, 0.8);
    [3, 6, 9].forEach(r => { g.beginPath(); g.ellipse(0, -24, r, r * 0.37, 0, 0, 6.28); stroke(g, rgba('#8a5a32', 0.7), 0.5); });
    [[-10, -12, 4], [-6, -8, 2.6], [11, -10, 3.4]].forEach(([x, y, r]) => { g.fillStyle = '#f2e8d8'; g.fillRect(x - r * 0.3, y - r * 0.2, r * 0.6, r * 1.1); g.beginPath(); g.ellipse(x, y - r * 0.2, r, r * 0.7, 0, Math.PI, 0); g.closePath(); g.fillStyle = '#d8392b'; g.fill(); stroke(g, INK, 0.6); ell(g, x - r * 0.3, y - r * 0.6, r * 0.18, r * 0.15, '#fff'); ell(g, x + r * 0.35, y - r * 0.45, r * 0.15, r * 0.12, '#fff'); });
  },
  birdbath(g) {
    ell(g, 0, -6, 9, 3.4, '#a8a294', INK, 0.7);
    g.fillStyle = lgrad(g, -4, 0, 4, 0, ['#d8d2c4', '#a8a294']); g.fillRect(-3.5, -26, 7, 20); g.strokeStyle = INK; g.lineWidth = 0.8; g.strokeRect(-3.5, -26, 7, 20);
    g.beginPath(); g.ellipse(0, -28, 15, 5, 0, 0, Math.PI); g.lineTo(-15, -28); g.fillStyle = '#c8c2b4'; g.fill(); stroke(g, INK, 0.8);
    ell(g, 0, -28, 15, 4.4, '#d8d2c4', INK, 0.8); ell(g, 0, -28, 12, 3.2, '#7ab8d8'); ell(g, -4, -29, 4, 1, 'rgba(255,255,255,0.6)');
    g.save(); g.translate(9, -33); ell(g, 0, 0, 3.6, 2.4, '#8a6a4a', INK, 0.5); ell(g, 2.6, -2, 1.8, 1.8, '#8a6a4a', INK, 0.5); g.beginPath(); g.moveTo(4, -2); g.lineTo(5.8, -1.6); g.lineTo(4, -1); g.fillStyle = '#f2a23a'; g.fill(); ell(g, 0, 0.6, 2.4, 1.2, '#e87a4a'); g.restore();
  },
  statue(g) {
    stoneWall(g, -12, -16, 24, 12, '#a8a294');
    g.save(); g.translate(0, -16); g.scale(1.3, 1.3); meeplePath(g); g.restore();
    g.fillStyle = lgrad(g, -14, -46, 14, -16, ['#d0ccc0', '#a8a49a', '#7a766e']); g.fill(); stroke(g, INK, 0.9);
    [[-8, -26, 4], [5, -38, 3], [9, -24, 3.4], [-2, -46, 2.4]].forEach(([x, y, r]) => { blob(g, x, y, r, '#6a9a4a', 0.3, -0.3); });
  },
  topiary(g) {
    g.beginPath(); g.moveTo(-10, -14); g.lineTo(10, -14); g.lineTo(8, -4); g.lineTo(-8, -4); g.closePath(); g.fillStyle = lgrad(g, -10, 0, 10, 0, ['#d8784a', '#a84a2a']); g.fill(); stroke(g, INK, 0.9);
    rrect(g, -11, -17, 22, 4, 1.5); g.fillStyle = '#c8603a'; g.fill(); stroke(g, INK, 0.7);
    g.save(); g.translate(0, -16); g.scale(1.25, 1.25); meeplePath(g); g.restore();
    g.fillStyle = lgrad(g, -14, -44, 14, -16, ['#7cc25a', '#4f9a3a', '#3a7a2e']); g.fill(); stroke(g, INK, 0.9);
    const r = mulberry(5); for (let i = 0; i < 26; i++) { const x = (r() - 0.5) * 22, y = -18 - r() * 26; if (Math.abs(x) < 6 || y > -32) ell(g, x * (y > -32 ? 1 : 0.4), y, 1.6, 1.2, rgba(r() < 0.5 ? '#9ad870' : '#2e6a24', 0.7)); }
  },
  fountain(g) {
    g.beginPath(); g.ellipse(0, -30, 40, 16, 0, 0, Math.PI); g.lineTo(-40, -30); g.lineTo(-40, -22); g.ellipse(0, -22, 40, 16, 0, Math.PI, 0, true); g.closePath();
    g.fillStyle = '#b8b2a4'; g.fill(); stroke(g, INK, 0.9);
    ell(g, 0, -30, 40, 15, '#d0cabc', INK, 0.9); ell(g, 0, -30, 34, 11.5, '#5aa0c8');
    ell(g, -10, -32, 12, 3, 'rgba(255,255,255,0.35)');
    g.fillStyle = lgrad(g, -5, 0, 5, 0, ['#d8d2c4', '#a8a294']); g.fillRect(-5, -64, 10, 34); g.strokeStyle = INK; g.lineWidth = 0.9; g.strokeRect(-5, -64, 10, 34);
    ell(g, 0, -64, 14, 5, '#c8c2b4', INK, 0.9); ell(g, 0, -64, 11, 3.4, '#6ab0d8');
    [[-30, -24], [26, -20], [-14, -18]].forEach(([x, y]) => blob(g, x, y, 4, '#6a9a4a', 0.3, -0.3));
  },
});
;(window.__stage = window.__stage || []).push('art4.js loaded');
