// Meeple Meadows — procedural art. Everything is drawn in code at load time into
// sprite canvases with a "papercraft sticker" finish: cream cut-paper edge, paper grain.
'use strict';

const T = 48; // world units per tile

const ART = {
  S: 2,            // sprite pixels per world unit (set by quality)
  sprites: {},     // cache
  icons: {},       // item id -> sprite
  iconURL: {},     // item id -> dataURL for DOM
};

// ---------------------------------------------------------------- utils
function newCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h));
  return c;
}
function hexRgb(h) {
  h = h.replace('#', '');
  if (h.length === 3) h = h.split('').map(x => x + x).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbHex(r, g, b) {
  const c = v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return '#' + c(r) + c(g) + c(b);
}
// f > 0 lightens toward white, f < 0 darkens toward a warm black
function shade(hex, f) {
  const [r, g, b] = hexRgb(hex);
  if (f >= 0) return rgbHex(r + (255 - r) * f, g + (255 - g) * f, b + (255 - b) * f);
  const k = 1 + f;
  return rgbHex(r * k + 30 * -f * 0.4, g * k + 18 * -f * 0.4, b * k + 25 * -f * 0.4);
}
function mix(a, b, t) {
  const A = hexRgb(a), B = hexRgb(b);
  return rgbHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
}
function rgba(hex, a) { const [r, g, b] = hexRgb(hex); return `rgba(${r},${g},${b},${a})`; }

// seeded RNG
function mulberry(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function hash2(x, y, s) {
  let h = (x * 374761393 + y * 668265263 + (s | 0) * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function vnoise(x, y, s) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi, s), b = hash2(xi + 1, yi, s), c = hash2(xi, yi + 1, s), d = hash2(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, s, oct = 4) {
  let v = 0, amp = 0.5, f = 1;
  for (let i = 0; i < oct; i++) { v += vnoise(x * f, y * f, s + i * 17) * amp; f *= 2; amp *= 0.5; }
  return v;
}

// paper grain pattern
let GRAIN = null;
function grainPattern(g) {
  if (!GRAIN) {
    GRAIN = newCanvas(128, 128);
    const x = GRAIN.getContext('2d');
    const id = x.createImageData(128, 128);
    const r = mulberry(99);
    for (let i = 0; i < id.data.length; i += 4) {
      const v = 128 + (r() - 0.5) * 140;
      id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255;
    }
    x.putImageData(id, 0, 0);
    // a few fibres
    x.globalAlpha = 0.25; x.strokeStyle = '#fff'; x.lineWidth = 0.7;
    for (let i = 0; i < 40; i++) {
      const a = r() * 128, b = r() * 128, ang = r() * 6.28;
      x.beginPath(); x.moveTo(a, b); x.quadraticCurveTo(a + Math.cos(ang) * 6, b + Math.sin(ang) * 6 + 3, a + Math.cos(ang) * 12, b + Math.sin(ang) * 12); x.stroke();
    }
  }
  return g.createPattern(GRAIN, 'repeat');
}

// Turn a drawn canvas into a sticker: dark hairline + cream paper edge behind it.
function stickerize(c, edgePx, col = '#fbf3df') {
  const o = newCanvas(c.width, c.height), g = o.getContext('2d');
  const sil = (r, colr, alpha) => {
    const t = newCanvas(c.width, c.height), tg = t.getContext('2d');
    const n = 14;
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; tg.drawImage(c, Math.cos(a) * r, Math.sin(a) * r); }
    tg.globalCompositeOperation = 'source-in'; tg.fillStyle = colr; tg.fillRect(0, 0, t.width, t.height);
    g.globalAlpha = alpha; g.drawImage(t, 0, 0); g.globalAlpha = 1;
  };
  sil(edgePx + Math.max(1, edgePx * 0.45), '#3d2a1f', 0.5);
  sil(edgePx, col, 1);
  g.drawImage(c, 0, 0);
  return o;
}

// Build a sprite. w,h,ax,ay are world units; draw(g) works in world units with origin at anchor.
function makeSprite(w, h, ax, ay, draw, opt = {}) {
  const S = opt.S || ART.S;
  const pad = opt.sticker === false ? 1 : 4;
  const c = newCanvas((w + pad * 2) * S, (h + pad * 2) * S);
  const g = c.getContext('2d');
  g.scale(S, S); g.translate(ax + pad, ay + pad);
  g.lineJoin = 'round'; g.lineCap = 'round';
  draw(g);
  if (opt.grain !== false) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalCompositeOperation = 'source-atop';
    g.globalAlpha = 0.09; g.fillStyle = grainPattern(g); g.fillRect(0, 0, c.width, c.height);
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }
  const out = opt.sticker === false ? c : stickerize(c, (opt.edge || 1.6) * S);
  return { c: out, w: w + pad * 2, h: h + pad * 2, ax: ax + pad, ay: ay + pad };
}
function drawSprite(ctx, s, x, y, scale = 1) {
  ctx.drawImage(s.c, x - s.ax * scale, y - s.ay * scale, s.w * scale, s.h * scale);
}

// ---------------------------------------------------------------- shape helpers
const INK = '#3d2a1f';
function ell(g, x, y, rx, ry, fill, stroke, lw = 1) {
  g.beginPath(); g.ellipse(x, y, Math.abs(rx), Math.abs(ry), 0, 0, Math.PI * 2);
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); }
}
function rrect(g, x, y, w, h, r) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
function lgrad(g, x0, y0, x1, y1, stops) {
  const gr = g.createLinearGradient(x0, y0, x1, y1);
  stops.forEach((c, i) => gr.addColorStop(i / (stops.length - 1), c));
  return gr;
}
function rgrad(g, x, y, r, stops, fx, fy) {
  const gr = g.createRadialGradient(fx != null ? fx : x, fy != null ? fy : y, 0, x, y, r);
  stops.forEach((c, i) => gr.addColorStop(i / (stops.length - 1), c));
  return gr;
}
// pointed leaf with midrib
function leaf(g, x, y, ang, len, wid, col, rib = true) {
  g.save(); g.translate(x, y); g.rotate(ang);
  g.beginPath(); g.moveTo(0, 0);
  g.quadraticCurveTo(len * 0.35, -wid, len, 0);
  g.quadraticCurveTo(len * 0.35, wid, 0, 0);
  g.fillStyle = lgrad(g, 0, -wid, 0, wid, [shade(col, 0.22), col, shade(col, -0.25)]); g.fill();
  g.strokeStyle = shade(col, -0.45); g.lineWidth = 0.6; g.stroke();
  if (rib) { g.beginPath(); g.moveTo(len * 0.05, 0); g.lineTo(len * 0.85, 0); g.strokeStyle = rgba(shade(col, 0.5), 0.7); g.lineWidth = 0.5; g.stroke(); }
  g.restore();
}
function blob(g, x, y, r, col, hi = 0.25, lo = -0.3) {
  g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2);
  g.fillStyle = rgrad(g, x, y, r, [shade(col, hi), col, shade(col, lo)], x - r * 0.4, y - r * 0.45); g.fill();
}
function stroke(g, col, lw) { g.strokeStyle = col; g.lineWidth = lw; g.stroke(); }

// ---------------------------------------------------------------- produce icons (32x32 box, centre 16,16)
const ICON_DRAW = {
  carrot(g) {
    g.translate(16, 16); g.rotate(-0.55);
    for (let i = -1; i <= 1; i++) leaf(g, i * 1.5, -9, -Math.PI / 2 + i * 0.45, 9, 2.2, '#5aa335');
    g.beginPath(); g.moveTo(-4.8, -8.5); g.quadraticCurveTo(-4.5, 3, 0, 13); g.quadraticCurveTo(4.5, 3, 4.8, -8.5);
    g.quadraticCurveTo(0, -10.5, -4.8, -8.5);
    g.fillStyle = lgrad(g, -5, 0, 5, 0, ['#ffb15a', '#f07a2a', '#c0501a']); g.fill(); stroke(g, INK, 0.9);
    g.strokeStyle = rgba('#8a3a10', 0.6); g.lineWidth = 0.7;
    [[-3, -4, -0.5], [1, -1, 3.2], [-2.5, 3, -0.2], [0.5, 6, 2]].forEach(([a, b, c]) => { g.beginPath(); g.moveTo(a, b); g.lineTo(c, b + 0.6); g.stroke(); });
  },
  wheat(g) {
    g.translate(16, 18);
    for (let s = -1; s <= 1; s++) {
      g.save(); g.rotate(s * 0.28);
      g.beginPath(); g.moveTo(0, 12); g.lineTo(0, -4); stroke(g, '#b8963a', 1.2);
      for (let k = 0; k < 5; k++) for (let side = -1; side <= 1; side += 2) {
        g.save(); g.translate(0, -5 - k * 2.4); g.rotate(side * 0.5);
        ell(g, side * 1.4, 0, 1.3, 2.2, '#e9c25a', shade('#e9c25a', -0.45), 0.5); g.restore();
      }
      ell(g, 0, -17, 1.1, 2, '#f0d27a', shade('#e9c25a', -0.45), 0.5);
      g.restore();
    }
    g.fillStyle = '#a0522d'; g.fillRect(-4, 4, 8, 2.2); g.strokeStyle = INK; g.lineWidth = 0.6; g.strokeRect(-4, 4, 8, 2.2);
  },
  potato(g) {
    g.translate(16, 17);
    g.beginPath(); g.moveTo(-11, 0);
    g.bezierCurveTo(-12, -8, -2, -10, 4, -8); g.bezierCurveTo(12, -6, 13, 4, 8, 7); g.bezierCurveTo(2, 10, -10, 9, -11, 0);
    g.fillStyle = rgrad(g, 0, 0, 13, ['#e8c590', '#c69a62', '#8f6a3e'], -4, -4); g.fill(); stroke(g, INK, 0.9);
    [[-5, -2], [2, -4], [5, 3], [-2, 4]].forEach(([x, y]) => { ell(g, x, y, 1, 0.6, '#7a5530'); });
  },
  cabbage(g) {
    g.translate(16, 17);
    for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; leaf(g, 0, 2, a, 12, 6, '#7cbf5a', false); }
    blob(g, 0, 0, 8.5, '#b5e08f', 0.3, -0.15); stroke(g, shade('#7cbf5a', -0.4), 0.7);
    g.strokeStyle = rgba('#e8f7d0', 0.9); g.lineWidth = 0.6;
    for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(-1, 1, 3 + i * 1.2, -2.6 + i * 0.3, -0.6 + i * 0.2); g.stroke(); }
  },
  sugarbeet(g) {
    g.translate(16, 17);
    leaf(g, -1, -6, -2.0, 11, 3.5, '#4a9a3c'); leaf(g, 1, -6, -1.1, 11, 3.5, '#4a9a3c'); leaf(g, 0, -6, -1.55, 12, 3.5, '#5aaa48');
    g.beginPath(); g.moveTo(-7, -4); g.bezierCurveTo(-9, 4, -2, 8, 0, 14); g.bezierCurveTo(2, 8, 9, 4, 7, -4); g.quadraticCurveTo(0, -8, -7, -4);
    g.fillStyle = rgrad(g, 0, 0, 10, ['#f06aa0', '#c2306a', '#7a1a40'], -3, -2); g.fill(); stroke(g, INK, 0.9);
  },
  strawberry(g) {
    g.translate(16, 16);
    g.beginPath(); g.moveTo(0, 12); g.bezierCurveTo(-12, 2, -10, -9, 0, -7); g.bezierCurveTo(10, -9, 12, 2, 0, 12);
    g.fillStyle = rgrad(g, 0, 0, 13, ['#ff7a80', '#e8344a', '#9a1528'], -4, -4); g.fill(); stroke(g, INK, 0.9);
    for (let i = 0; i < 14; i++) { const x = (hash2(i, 1, 3) - 0.5) * 13, y = -4 + hash2(i, 2, 3) * 12; if (Math.abs(x) < 8 - y * 0.5) ell(g, x, y, 0.5, 0.8, '#ffe28a'); }
    for (let i = 0; i < 5; i++) leaf(g, 0, -7, -Math.PI / 2 + (i - 2) * 0.7, 6, 2, '#3f9a3e', false);
  },
  garlic(g) {
    g.translate(16, 18);
    g.beginPath(); g.moveTo(0, -14); g.quadraticCurveTo(1, -9, 6, -6); g.bezierCurveTo(13, -2, 10, 9, 0, 9); g.bezierCurveTo(-10, 9, -13, -2, -6, -6); g.quadraticCurveTo(-1, -9, 0, -14);
    g.fillStyle = rgrad(g, 0, 0, 12, ['#ffffff', '#efe6d2', '#bfae90'], -3, -4); g.fill(); stroke(g, INK, 0.9);
    g.strokeStyle = rgba('#a89070', 0.8); g.lineWidth = 0.6;
    [[-4, -5, -6, 7], [0, -9, 0, 9], [4, -5, 6, 7]].forEach(([a, b, c, d]) => { g.beginPath(); g.moveTo(a, b); g.quadraticCurveTo((a + c) / 2 * 1.6, 2, c, d); g.stroke(); });
    g.strokeStyle = '#a89070'; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(i, 9); g.lineTo(i * 1.6, 12); g.stroke(); }
  },
  chili(g) {
    g.translate(16, 16); g.rotate(0.5);
    g.beginPath(); g.moveTo(-3, -9); g.bezierCurveTo(4, -9, 5, 0, 3, 6); g.quadraticCurveTo(1, 12, -4, 13); g.quadraticCurveTo(-1, 8, -2, 3); g.quadraticCurveTo(-5, -4, -3, -9);
    g.fillStyle = lgrad(g, -5, 0, 5, 0, ['#ff6a50', '#d8241c', '#8a0f0a']); g.fill(); stroke(g, INK, 0.9);
    g.beginPath(); g.moveTo(1.5, -6); g.quadraticCurveTo(3, -1, 1.8, 4); g.strokeStyle = rgba('#ffffff', 0.5); g.lineWidth = 1; g.stroke();
    g.beginPath(); g.moveTo(-1, -9); g.quadraticCurveTo(-1, -13, 2, -14); stroke(g, '#3e8a33', 2);
    ell(g, -0.5, -9, 3.5, 1.4, '#4e9a3a', INK, 0.6);
  },
  barley(g) {
    g.translate(16, 18);
    for (let s = -1; s <= 1; s += 2) {
      g.save(); g.rotate(s * 0.2);
      g.beginPath(); g.moveTo(0, 12); g.quadraticCurveTo(s * 2, 0, s * 4, -4); stroke(g, '#a99550', 1.1);
      g.translate(s * 4, -4); g.rotate(s * 0.35);
      for (let k = 0; k < 6; k++) {
        ell(g, 0, -k * 2, 1.4, 1.6, '#e2cb88', shade('#d7bf7c', -0.4), 0.5);
        g.beginPath(); g.moveTo(0, -k * 2); g.lineTo(-4 - k * 0.3, -k * 2 - 6); g.moveTo(0, -k * 2); g.lineTo(4 + k * 0.3, -k * 2 - 6);
        g.strokeStyle = rgba('#c9b070', 0.9); g.lineWidth = 0.4; g.stroke();
      }
      g.restore();
    }
  },
  hops(g) {
    g.translate(16, 17);
    leaf(g, 2, -9, -0.6, 8, 3.5, '#4f9a3a');
    g.beginPath(); g.moveTo(0, -12); g.lineTo(0, -8); stroke(g, '#5a7a2a', 1);
    for (let row = 0; row < 5; row++) {
      const n = row < 4 ? 3 : 2, w = [5, 7, 7, 6, 4][row];
      for (let i = 0; i < n; i++) {
        const x = (i - (n - 1) / 2) * w * 0.65, y = -7 + row * 3.6;
        g.beginPath(); g.moveTo(x - 3, y); g.quadraticCurveTo(x, y - 3.5, x + 3, y); g.quadraticCurveTo(x, y + 4.5, x - 3, y);
        g.fillStyle = lgrad(g, x, y - 3, x, y + 4, ['#d5f08a', '#a9d455', '#6f9a2a']); g.fill(); stroke(g, shade('#a9d455', -0.5), 0.5);
      }
    }
  },
  apple(g) {
    g.translate(16, 17);
    g.beginPath(); g.moveTo(0, -7); g.bezierCurveTo(6, -11, 13, -5, 11, 3); g.bezierCurveTo(9, 11, 3, 12, 0, 10); g.bezierCurveTo(-3, 12, -9, 11, -11, 3); g.bezierCurveTo(-13, -5, -6, -11, 0, -7);
    g.fillStyle = rgrad(g, 0, 0, 13, ['#ff8a70', '#d8392b', '#8a1a12'], -4, -4); g.fill(); stroke(g, INK, 0.9);
    ell(g, -5, -3, 2, 3, rgba('#ffffff', 0.45));
    g.beginPath(); g.moveTo(0, -6); g.quadraticCurveTo(0, -11, 2, -13); stroke(g, '#6a4020', 1.4);
    leaf(g, 1.5, -10, -0.5, 7, 2.6, '#4b9a3c');
  },
  blueberry(g) {
    g.translate(16, 17);
    [[-5, 3, 5.5], [5, 4, 5.5], [0, -4, 5.8]].forEach(([x, y, r]) => {
      blob(g, x, y, r, '#4c5fb8', 0.3, -0.35); stroke(g, INK, 0.8);
      ell(g, x - r * 0.35, y - r * 0.4, r * 0.25, r * 0.18, rgba('#ffffff', 0.5));
      g.beginPath(); for (let i = 0; i < 5; i++) { const a = i / 5 * 6.28; g.moveTo(x, y + r * 0.1); g.lineTo(x + Math.cos(a) * 1.3, y + r * 0.1 + Math.sin(a) * 1.3); } stroke(g, '#2a2f5a', 0.6);
    });
    leaf(g, 2, -9, -0.4, 7, 2.5, '#3f8a46');
  },
  corn(g) {
    g.translate(16, 16); g.rotate(0.35);
    g.beginPath(); g.ellipse(0, 0, 5.5, 12, 0, 0, Math.PI * 2); g.fillStyle = lgrad(g, -5, 0, 5, 0, ['#fff08a', '#f2cf3a', '#b88a10']); g.fill(); stroke(g, INK, 0.8);
    g.strokeStyle = rgba('#a07a10', 0.7); g.lineWidth = 0.5;
    for (let y = -10; y <= 10; y += 2.2) { g.beginPath(); g.moveTo(-5, y); g.lineTo(5, y); g.stroke(); }
    for (let x = -3; x <= 3; x += 2) { g.beginPath(); g.moveTo(x, -11); g.lineTo(x, 11); g.stroke(); }
    leaf(g, -1, 13, -1.85, 18, 3.6, '#6fb04a', true); leaf(g, 1, 13, -1.3, 17, 3.4, '#5aa03a', true);
    g.beginPath(); g.moveTo(0, -12); g.quadraticCurveTo(2, -16, 0, -17); g.moveTo(0, -12); g.quadraticCurveTo(-2, -15, -3, -16); stroke(g, '#c08a40', 0.8);
  },
  grapes(g) {
    g.translate(16, 16);
    leaf(g, 0, -10, -0.3, 9, 4, '#5a9a3a');
    g.beginPath(); g.moveTo(0, -12); g.lineTo(0, -7); stroke(g, '#6a4a2a', 1.2);
    const pts = [[-6, -5], [0, -5], [6, -5], [-3, 0], [3, 0], [-6, 0], [6, 0], [0, 5], [-3, 5], [3, 5], [0, 10]];
    pts.forEach(([x, y]) => { blob(g, x, y, 3.3, '#7b3f9e', 0.35, -0.35); stroke(g, INK, 0.6); ell(g, x - 1, y - 1.2, 0.8, 0.6, rgba('#ffffff', 0.5)); });
  },
  pumpkin(g) {
    g.translate(16, 18);
    for (let i = -2; i <= 2; i++) {
      g.beginPath(); g.ellipse(i * 3.4, 0, 5.2 - Math.abs(i) * 0.6, 9, 0, 0, Math.PI * 2);
      g.fillStyle = lgrad(g, i * 3.4 - 5, -8, i * 3.4 + 5, 8, [shade('#f08a1c', 0.35), '#f08a1c', shade('#f08a1c', -0.35)]); g.fill(); stroke(g, shade('#f08a1c', -0.55), 0.6);
    }
    g.beginPath(); g.ellipse(0, 0, 12.5, 9.2, 0, 0, Math.PI * 2); stroke(g, INK, 0.9);
    g.beginPath(); g.moveTo(-1, -8); g.quadraticCurveTo(0, -13, 3, -14); stroke(g, '#5a7a2a', 2.4);
    leaf(g, 2, -9, -0.2, 7, 2.6, '#4f9438');
  },
  juniper(g) {
    g.translate(16, 17);
    g.beginPath(); g.moveTo(-8, 12); g.quadraticCurveTo(0, 0, 8, -12); stroke(g, '#6a4a2a', 1.4);
    for (let i = 0; i < 12; i++) { const t = i / 11, x = -8 + t * 16, y = 12 - t * 24 + Math.sin(t * 3) * 1.5; leaf(g, x, y, -2.4 + (i % 2) * 1.5, 6, 1, '#3c6e52', false); }
    [[-2, 2], [3, -3], [0, -6], [-5, 6], [5, -8], [-1, 8]].forEach(([x, y]) => { blob(g, x, y, 2.4, '#5a74a8', 0.4, -0.3); stroke(g, INK, 0.5); });
  },
};

// goods icons (more types live in art2.js)
let ICON_DRAW_GOODS = {};
function iconSack(g, o) {
  g.translate(16, 17);
  g.beginPath(); g.moveTo(-6, -9); g.quadraticCurveTo(-12, 0, -10, 9); g.quadraticCurveTo(0, 13, 10, 9); g.quadraticCurveTo(12, 0, 6, -9); g.closePath();
  g.fillStyle = rgrad(g, 0, 0, 13, [shade(o.c, 0.3), o.c, shade(o.c, -0.25)], -3, -4); g.fill(); stroke(g, INK, 0.9);
  g.beginPath(); g.moveTo(-6, -9); g.quadraticCurveTo(0, -14, 6, -9); g.lineTo(4, -12); g.lineTo(-4, -12); g.closePath(); g.fillStyle = shade(o.c, -0.1); g.fill(); stroke(g, INK, 0.7);
  g.beginPath(); g.moveTo(-6, -8); g.lineTo(6, -8); stroke(g, '#8a6a3a', 1.6);
  ell(g, 0, 2, 4.5, 4.5, o.l, INK, 0.6);
}
function iconBowl(g, o) {
  g.translate(16, 16);
  ell(g, 0, -1, 12, 4.5, shade(o.c, -0.1));
  ell(g, 0, -1.5, 11, 3.8, rgrad(g, 0, -1.5, 11, [shade(o.c, 0.35), o.c]));
  for (let i = 0; i < 5; i++) ell(g, -6 + i * 3, -1.5 + (i % 2), 1.2, 0.8, shade(o.c, 0.45));
  if (o.salad) for (let i = 0; i < 7; i++) leaf(g, -8 + i * 2.6, -2, -1.57 + (i - 3) * 0.35, 6, 2.4, i % 2 ? '#5aa335' : (o.b === '#3a5a7a' ? '#8aa080' : '#e23a2a'), false);
  g.beginPath(); g.moveTo(-12, -1); g.quadraticCurveTo(-11, 10, 0, 10); g.quadraticCurveTo(11, 10, 12, -1); g.quadraticCurveTo(0, 4, -12, -1);
  g.fillStyle = lgrad(g, -12, 0, 12, 0, [shade(o.b, 0.3), o.b, shade(o.b, -0.35)]); g.fill(); stroke(g, INK, 0.9);
  g.beginPath(); g.ellipse(0, -1, 12, 4.5, 0, 0, Math.PI * 2); stroke(g, INK, 0.8);
  // steam
  g.strokeStyle = rgba('#ffffff', 0.8); g.lineWidth = 1;
  [-4, 1, 5].forEach(x => { g.beginPath(); g.moveTo(x, -5); g.bezierCurveTo(x - 2, -8, x + 2, -10, x, -13); g.stroke(); });
}
function iconCrock(g, o) {
  g.translate(16, 17);
  g.beginPath(); g.moveTo(-7, -9); g.quadraticCurveTo(-12, 0, -8, 10); g.lineTo(8, 10); g.quadraticCurveTo(12, 0, 7, -9); g.closePath();
  g.fillStyle = lgrad(g, -10, 0, 10, 0, [shade(o.b, 0.3), o.b, shade(o.b, -0.4)]); g.fill(); stroke(g, INK, 0.9);
  g.fillStyle = rgba('#fbf3df', 0.8); g.fillRect(-9.5, -1, 19, 3);
  ell(g, 0, -9, 7, 2.5, o.c, INK, 0.8);
  for (let i = 0; i < 6; i++) ell(g, -4 + i * 1.6, -9.5 + (i % 2), 1.2, 0.7, shade(o.c, -0.2));
}
function iconJar(g, o) {
  g.translate(16, 17);
  const h = o.tall ? 1.15 : 1;
  rrect(g, -8, -7 * h, 16, 17 * h, 4); g.fillStyle = lgrad(g, -8, 0, 8, 0, [shade(o.c, 0.25), o.c, shade(o.c, -0.4)]); g.fill(); stroke(g, INK, 0.9);
  if (o.tall) { for (let i = 0; i < 4; i++) { g.fillStyle = o.s || '#ffad60'; g.fillRect(-6 + i * 3.2, -5, 2, 13); } }
  g.fillStyle = rgba('#ffffff', 0.35); g.fillRect(-6, -5 * h, 2.2, 12 * h);
  rrect(g, -9, -11 * h, 18, 5, 1.5); g.fillStyle = '#c94a3a'; g.fill(); stroke(g, INK, 0.8);
  g.fillStyle = '#fbf3df'; for (let i = 0; i < 6; i++) { g.fillRect(-8.5 + i * 3, -11 * h, 1.5, 5); }
  rrect(g, -5, -1, 10, 6, 1); g.fillStyle = o.l; g.fill(); stroke(g, INK, 0.5);
}
function iconBottle(g, o) {
  g.translate(16, 16);
  const c = o.c, glass = lgrad(g, -8, 0, 8, 0, [shade(c, 0.4), c, shade(c, -0.35)]);
  g.beginPath();
  switch (o.shape) {
    case 'wine': g.moveTo(-2, -14); g.lineTo(2, -14); g.lineTo(2, -6); g.quadraticCurveTo(6, -4, 6, 0); g.lineTo(6, 13); g.lineTo(-6, 13); g.lineTo(-6, 0); g.quadraticCurveTo(-6, -4, -2, -6); break;
    case 'whiskey': g.moveTo(-2, -14); g.lineTo(2, -14); g.lineTo(2, -9); g.lineTo(7, -6); g.lineTo(7, 13); g.lineTo(-7, 13); g.lineTo(-7, -6); g.lineTo(-2, -9); break;
    case 'tall': g.moveTo(-1.8, -15); g.lineTo(1.8, -15); g.lineTo(2, -7); g.quadraticCurveTo(5, -5, 5, -1); g.lineTo(5, 13); g.lineTo(-5, 13); g.lineTo(-5, -1); g.quadraticCurveTo(-5, -5, -2, -7); break;
    case 'round': g.moveTo(-2, -14); g.lineTo(2, -14); g.lineTo(2, -5); g.bezierCurveTo(11, -4, 11, 13, 0, 13); g.bezierCurveTo(-11, 13, -11, -4, -2, -5); break;
    case 'square': g.moveTo(-2, -14); g.lineTo(2, -14); g.lineTo(2, -9); g.lineTo(8, -7); g.lineTo(8, 13); g.lineTo(-8, 13); g.lineTo(-8, -7); g.lineTo(-2, -9); break;
    case 'jug': g.moveTo(-2.5, -13); g.lineTo(2.5, -13); g.lineTo(3, -8); g.bezierCurveTo(10, -6, 10, 13, 0, 13); g.bezierCurveTo(-10, 13, -10, -6, -3, -8); break;
    case 'oil': g.moveTo(-1.6, -15); g.lineTo(1.6, -15); g.lineTo(1.8, -4); g.quadraticCurveTo(6, -1, 6, 5); g.quadraticCurveTo(6, 13, 0, 13); g.quadraticCurveTo(-6, 13, -6, 5); g.quadraticCurveTo(-6, -1, -1.8, -4); break;
    case 'vial': g.moveTo(-2, -9); g.lineTo(2, -9); g.lineTo(2, -2); g.arc(0, 6, 7.5, -1.3, Math.PI + 1.3); g.lineTo(-2, -9); break;
    case 'flask': g.moveTo(-2, -13); g.lineTo(2, -13); g.lineTo(2, -6); g.lineTo(9, 10); g.quadraticCurveTo(9, 13, 6, 13); g.lineTo(-6, 13); g.quadraticCurveTo(-9, 13, -9, 10); g.lineTo(-2, -6); break;
    default: g.moveTo(-1.5, -14); g.lineTo(1.5, -14); g.lineTo(1.8, -6); g.quadraticCurveTo(5, -3, 5, 2); g.lineTo(5, 13); g.lineTo(-5, 13); g.lineTo(-5, 2); g.quadraticCurveTo(-5, -3, -1.8, -6); break;
  }
  g.closePath(); g.fillStyle = glass; g.fill(); stroke(g, INK, 0.9);
  if (o.shape === 'jug') { g.beginPath(); g.arc(6, -3, 3.5, -1.2, 1.4); stroke(g, INK, 1.4); }
  g.fillStyle = rgba('#ffffff', 0.4); g.fillRect(-4, -3, 1.6, 12);
  g.fillStyle = '#7a4a2a'; g.fillRect(-2.2, -16, 4.4, 3); g.strokeStyle = INK; g.lineWidth = 0.6; g.strokeRect(-2.2, -16, 4.4, 3);
  rrect(g, -4.5, 2, 9, 6.5, 1); g.fillStyle = '#fbf3df'; g.fill(); stroke(g, INK, 0.5);
  g.fillStyle = shade(c === '#e8f2f4' || c === '#eef6fa' || c === '#dff0f4' ? '#5a7a9a' : c, -0.2); g.fillRect(-3, 4, 6, 1); g.fillRect(-2, 6, 4, 0.8);
}
function iconMug(g, o) {
  g.translate(15, 17);
  g.beginPath(); g.arc(8, 1, 5, -1.3, 1.3); stroke(g, INK, 3.2); g.beginPath(); g.arc(8, 1, 5, -1.3, 1.3); stroke(g, '#c9a070', 1.8);
  rrect(g, -8, -7, 16, 18, 2); g.fillStyle = lgrad(g, -8, 0, 8, 0, [shade(o.c, 0.3), o.c, shade(o.c, -0.35)]); g.fill(); stroke(g, INK, 0.9);
  g.fillStyle = rgba('#ffffff', 0.3); g.fillRect(-6, -5, 2, 14);
  g.beginPath(); g.moveTo(-9, -6); for (let i = 0; i <= 6; i++) { g.arc(-7.5 + i * 2.5, -8, 2.4, Math.PI, 0); } g.lineTo(9, -5); g.closePath();
  g.fillStyle = '#fffaf0'; g.fill(); stroke(g, INK, 0.7);
}
function iconPie(g, o) {
  g.translate(16, 18);
  ell(g, 0, 2, 13, 6, '#c9905a', INK, 0.9);
  ell(g, 0, 0, 12, 5.2, '#e8b878');
  ell(g, 0, -0.5, 9.5, 3.8, o.c);
  g.strokeStyle = '#f0c890'; g.lineWidth = o.open ? 0 : 1.6;
  if (!o.open) for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(i * 3.5 - 2, -3.5); g.lineTo(i * 3.5 + 2, 3); g.stroke(); g.beginPath(); g.moveTo(i * 3.5 + 2, -3.5); g.lineTo(i * 3.5 - 2, 3); g.stroke(); }
  g.beginPath(); g.ellipse(0, 0, 12, 5.2, 0, 0, Math.PI * 2); stroke(g, INK, 0.7);
}
function iconBread(g) {
  g.translate(16, 17); g.rotate(-0.2);
  g.beginPath(); g.ellipse(0, 0, 13, 6.5, 0, 0, Math.PI * 2);
  g.fillStyle = rgrad(g, 0, 0, 13, ['#f6d494', '#d99a4a', '#9a5a20'], -3, -3); g.fill(); stroke(g, INK, 0.9);
  for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(i * 4.5 - 1.5, -4.5); g.lineTo(i * 4.5 + 1.5, 3); stroke(g, '#fff2c8', 1.6); }
  for (let i = 0; i < 9; i++) ell(g, (hash2(i, 4, 1) - 0.5) * 20, (hash2(i, 5, 1) - 0.5) * 6, 0.9, 0.5, '#5a9a3a');
}

function drawIcon(g, id) {
  if (ICON_DRAW[id]) return ICON_DRAW[id](g);
  const gd = GOOD[id]; if (!gd) return;
  const o = gd.icon;
  const fn = ({ sack: iconSack, bowl: iconBowl, crock: iconCrock, jar: iconJar, bottle: iconBottle, mug: iconMug, pie: iconPie, bread: iconBread })[o.t] || ICON_DRAW_GOODS[o.t];
  fn(g, o);
}

// misc UI icons
const UI_ICON = {
  coin(g) { g.translate(16, 16); blob(g, 0, 0, 11, '#f2c23a', 0.5, -0.3); stroke(g, INK, 1); g.beginPath(); g.arc(0, 0, 7.5, 0, 6.28); stroke(g, '#b8860b', 1); g.font = 'bold 11px sans-serif'; g.fillStyle = '#9a6a08'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('M', 0, 0.5); },
  meeple(g) { g.translate(16, 28); g.scale(1.15, 1.15); meeplePath(g); g.fillStyle = lgrad(g, -10, -22, 10, 0, ['#ffd08a', '#e8a04a', '#b8702a']); g.fill(); stroke(g, INK, 1); },
  soil(g) { g.translate(16, 18); ell(g, 0, 2, 12, 7, '#7a5232', INK, 0.9); ell(g, 0, 0, 10, 5, '#9a6a42'); for (let i = 0; i < 4; i++) leaf(g, -3 + i * 2, -1, -1.2 - i * 0.25, 9, 2.6, '#5aa335'); },
  boots(g) { g.translate(16, 16); g.beginPath(); g.moveTo(-7, -11); g.lineTo(1, -11); g.lineTo(2, 3); g.quadraticCurveTo(11, 3, 11, 9); g.lineTo(-8, 9); g.closePath(); g.fillStyle = lgrad(g, -8, 0, 11, 0, ['#c98a5a', '#9a5a32']); g.fill(); stroke(g, INK, 0.9); leaf(g, -2, -9, -2.6, 7, 2.5, '#9be0ff'); leaf(g, -4, -6, -2.8, 7, 2.5, '#d6f4ff'); },
  basket(g) { g.translate(16, 18); g.beginPath(); g.arc(0, -2, 9, Math.PI, 0); stroke(g, '#8a5a2a', 2); g.beginPath(); g.moveTo(-12, -2); g.lineTo(12, -2); g.lineTo(9, 10); g.lineTo(-9, 10); g.closePath(); g.fillStyle = '#d8a860'; g.fill(); stroke(g, INK, 0.9); g.strokeStyle = '#a87838'; g.lineWidth = 0.8; for (let y = 1; y < 10; y += 3) { g.beginPath(); g.moveTo(-11, y); g.lineTo(11, y); g.stroke(); } blob(g, -4, -4, 3, '#d8392b'); blob(g, 2, -5, 3, '#f07a2a'); },
  hands(g) { g.translate(16, 16); blob(g, 0, 2, 9, '#f2c49a', 0.3, -0.2); stroke(g, INK, 0.9); for (let i = 0; i < 3; i++) leaf(g, -2 + i * 2, -5, -1.2 - i * 0.4, 9, 3, '#5aa335'); },
  haggle(g) { g.translate(16, 16); for (let i = 0; i < 3; i++) { blob(g, -4 + i * 4, 6 - i * 5, 7, '#f2c23a', 0.5, -0.3); stroke(g, INK, 0.8); } },
  copper(g) { g.translate(16, 16); g.strokeStyle = INK; g.lineWidth = 4.2; for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(0, -9 + i * 5.5, 9, 3, 0, 0, 6.28); g.stroke(); } g.strokeStyle = '#d98a4a'; g.lineWidth = 2.4; for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(0, -9 + i * 5.5, 9, 3, 0, 0, 6.28); g.stroke(); } },
  clover(g) { g.translate(16, 15); for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.78; blob(g, Math.cos(a) * 5, Math.sin(a) * 5, 5.5, '#4caf50', 0.35, -0.3); stroke(g, INK, 0.7); } g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(2, 8, 5, 13); stroke(g, '#2e7d32', 1.6); },
  axe(g) { g.translate(16, 16); g.rotate(0.6); g.fillStyle = '#9a6a3a'; g.fillRect(-1.6, -12, 3.2, 26); g.strokeStyle = INK; g.lineWidth = 0.8; g.strokeRect(-1.6, -12, 3.2, 26); g.beginPath(); g.moveTo(1, -12); g.quadraticCurveTo(12, -12, 11, -2); g.lineTo(1, -4); g.closePath(); g.fillStyle = lgrad(g, 0, -12, 12, -2, ['#e8eef2', '#9aa8b2']); g.fill(); stroke(g, INK, 0.9); },
  hammer(g) { g.translate(16, 16); g.rotate(-0.6); g.fillStyle = '#b07a42'; g.fillRect(-1.6, -6, 3.2, 20); g.strokeStyle = INK; g.lineWidth = 0.8; g.strokeRect(-1.6, -6, 3.2, 20); rrect(g, -9, -13, 18, 7, 1.5); g.fillStyle = lgrad(g, 0, -13, 0, -6, ['#c8d0d8', '#6a7680']); g.fill(); stroke(g, INK, 0.9); },
  book(g) { g.translate(16, 16); rrect(g, -11, -12, 22, 24, 2); g.fillStyle = '#8a3a2a'; g.fill(); stroke(g, INK, 0.9); g.fillStyle = '#fbf3df'; g.fillRect(-9, -10, 2, 20); rrect(g, -4, -6, 12, 7, 1); g.fillStyle = '#f2c23a'; g.fill(); leaf(g, 2, 6, -0.4, 7, 2.4, '#5aa335'); },
  barn(g) { g.translate(16, 18); g.beginPath(); g.moveTo(-11, 10); g.lineTo(-11, -3); g.lineTo(0, -13); g.lineTo(11, -3); g.lineTo(11, 10); g.closePath(); g.fillStyle = '#c4473a'; g.fill(); stroke(g, INK, 1); g.fillStyle = '#fbf3df'; g.fillRect(-4, 1, 8, 9); g.strokeStyle = '#c4473a'; g.lineWidth = 1; g.beginPath(); g.moveTo(-4, 1); g.lineTo(4, 10); g.moveTo(4, 1); g.lineTo(-4, 10); g.stroke(); },
  stall(g) { g.translate(16, 17); g.fillStyle = '#b07a42'; g.fillRect(-11, -2, 22, 12); g.strokeStyle = INK; g.lineWidth = 0.9; g.strokeRect(-11, -2, 22, 12); for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(-12 + i * 4.8, -12); g.lineTo(-7.2 + i * 4.8, -12); g.lineTo(-7.2 + i * 4.8, -5); g.arc(-9.6 + i * 4.8, -5, 2.4, 0, Math.PI); g.closePath(); g.fillStyle = i % 2 ? '#fbf3df' : '#d8463a'; g.fill(); stroke(g, INK, 0.6); } blob(g, -5, -3, 2.6, '#d8392b'); blob(g, 0, -3, 2.6, '#f2cf3a'); blob(g, 5, -3, 2.6, '#7b3f9e'); },
  gear(g) { g.translate(16, 16); g.beginPath(); for (let i = 0; i < 16; i++) { const r = i % 2 ? 9 : 12.5, a = i / 16 * 6.28; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fillStyle = lgrad(g, -12, -12, 12, 12, ['#e0e6ea', '#8a96a0']); g.fill(); stroke(g, INK, 1); ell(g, 0, 0, 4, 4, '#5a4a3a', INK, 0.8); },
  star(g) { g.translate(16, 17); g.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 5.5 : 13, a = -Math.PI / 2 + i / 10 * 6.28; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fillStyle = rgrad(g, 0, 0, 13, ['#fff3a0', '#f2c23a', '#c9901a']); g.fill(); stroke(g, INK, 1); },
  scroll(g) { g.translate(16, 16); rrect(g, -9, -12, 18, 24, 2); g.fillStyle = '#f4e4bc'; g.fill(); stroke(g, INK, 0.9); g.strokeStyle = '#a08060'; g.lineWidth = 1; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(-5, -7 + i * 4); g.lineTo(5 - (i % 2) * 3, -7 + i * 4); g.stroke(); } ell(g, 0, -12, 10, 2.5, '#d8c090', INK, 0.8); ell(g, 0, 12, 10, 2.5, '#d8c090', INK, 0.8); },
  move(g) { g.translate(16, 16); g.strokeStyle = INK; g.lineWidth = 4; const arr = () => { g.beginPath(); g.moveTo(0, -12); g.lineTo(0, 12); g.moveTo(-12, 0); g.lineTo(12, 0); g.stroke(); }; arr(); g.strokeStyle = '#fbf3df'; g.lineWidth = 2; arr(); g.fillStyle = '#fbf3df'; for (let i = 0; i < 4; i++) { g.save(); g.rotate(i * Math.PI / 2); g.beginPath(); g.moveTo(0, -14); g.lineTo(-4, -9); g.lineTo(4, -9); g.closePath(); g.fill(); stroke(g, INK, 0.8); g.restore(); } },
  trash(g) { g.translate(16, 16); rrect(g, -8, -7, 16, 19, 2); g.fillStyle = '#9aa8b2'; g.fill(); stroke(g, INK, 0.9); rrect(g, -10, -11, 20, 4, 1); g.fill(); stroke(g, INK, 0.9); g.strokeStyle = '#5a6670'; for (let i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(i * 4, -3); g.lineTo(i * 4, 9); g.stroke(); } },
};

// ---------------------------------------------------------------- meeple
function meeplePath(g) {
  // classic meeple silhouette; feet at y=0, ~22 tall, ~22 wide
  g.beginPath();
  g.arc(0, -17.6, 4.6, 0, Math.PI * 2);
  g.moveTo(0, -13.2);
  const half = s => {
    g.quadraticCurveTo(s * 4.5, -13.6, s * 9, -12.6);
    g.quadraticCurveTo(s * 11.8, -11.6, s * 10.6, -9);
    g.quadraticCurveTo(s * 9.6, -7.8, s * 5.6, -8.4);
    g.quadraticCurveTo(s * 5, -4.6, s * 8.6, -1.2);
    g.quadraticCurveTo(s * 9.4, 0.4, s * 7, 0.4);
    g.lineTo(s * 3, 0.4);
    g.quadraticCurveTo(s * 1.4, -3.8, 0, -4.4);
  };
  half(1); g.moveTo(0, -13.2); half(-1);
}
function meepleSprite(col, S) {
  return makeSprite(26, 26, 13, 24, g => {
    // body silhouette filled as a single shape (head circle + body)
    g.save();
    meeplePath(g);
    g.fillStyle = lgrad(g, -10, -22, 10, 0, [shade(col, 0.35), col, shade(col, -0.35)]);
    g.fill('nonzero');
    // soft side shading
    g.clip('nonzero');
    g.fillStyle = rgba(shade(col, -0.6), 0.25); g.fillRect(3, -24, 10, 26);
    g.fillStyle = rgba('#ffffff', 0.18); g.beginPath(); g.ellipse(-4, -12, 3, 1.4, -0.3, 0, 6.28); g.fill();
    g.restore();
    meeplePath(g); stroke(g, shade(col, -0.65), 0.8);
    // face
    ell(g, -1.7, -18, 0.75, 1.05, '#2a1d14'); ell(g, 1.7, -18, 0.75, 1.05, '#2a1d14');
    ell(g, -1.9, -18.4, 0.25, 0.3, '#fff'); ell(g, 1.5, -18.4, 0.25, 0.3, '#fff');
    ell(g, -3, -16.4, 1, 0.55, rgba('#ff7a8a', 0.55)); ell(g, 3, -16.4, 1, 0.55, rgba('#ff7a8a', 0.55));
    g.beginPath(); g.arc(0, -16.6, 0.9, 0.2, Math.PI - 0.2); stroke(g, '#2a1d14', 0.45);
    ell(g, -1.6, -20.6, 1.6, 0.9, rgba('#ffffff', 0.35));
  }, { edge: 1.1, S: S || Math.max(2, ART.S) });
}

// ---------------------------------------------------------------- plants on plots
// p: growth 0..1 ; ripe flag draws fruit. drawn around (0,0) = tile centre bottom area.
const PLANT = {
  carrot(g, p, ripe) {
    for (let i = -1; i <= 1; i++) leaf(g, i * 0.8, 0, -Math.PI / 2 + i * 0.5, 12 * p, 2.5 * p, '#5aa335');
    leaf(g, 0, 0, -Math.PI / 2 + 0.15, 14 * p, 2.2 * p, '#6cbf45');
    if (ripe) { g.beginPath(); g.moveTo(-3, 0); g.quadraticCurveTo(0, -3, 3, 0); g.quadraticCurveTo(0, 3, -3, 0); g.fillStyle = '#f07a2a'; g.fill(); stroke(g, INK, 0.6); }
  },
  wheat(g, p, ripe) {
    const col = ripe ? '#e9c25a' : '#8fbf4a';
    for (let i = -2; i <= 2; i++) {
      g.beginPath(); g.moveTo(i * 1.2, 0); g.quadraticCurveTo(i * 2, -10 * p, i * 2.6, -20 * p); stroke(g, ripe ? '#c8a040' : '#6a9a3a', 0.9);
      if (p > 0.6) for (let k = 0; k < 4; k++) ell(g, i * 2.6 + (k % 2 - 0.5) * 1.4, -20 * p - k * 1.8, 1, 1.6, col, shade(col, -0.4), 0.4);
    }
  },
  potato(g, p, ripe) {
    for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.45; leaf(g, 0, -2, a, 10 * p, 4 * p, i % 2 ? '#4f8f3a' : '#5fa046'); }
    if (ripe) { [[-5, -10], [3, -12], [6, -7]].forEach(([x, y]) => { for (let k = 0; k < 5; k++) { const a = k / 5 * 6.28; ell(g, x + Math.cos(a) * 1.4, y + Math.sin(a) * 1.4, 1.1, 1.1, '#f4f0ff'); } ell(g, x, y, 0.8, 0.8, '#f2d23a'); }); ell(g, -6, 1, 3, 2, '#c69a62', INK, 0.5); }
  },
  cabbage(g, p, ripe) {
    for (let i = 0; i < 6; i++) { const a = -Math.PI + i / 5 * Math.PI; leaf(g, 0, -3, a, 10 * p, 5 * p, '#6fb352', false); }
    if (p > 0.55) { blob(g, 0, -5, 6.5 * p, ripe ? '#b5e08f' : '#8fcf6a', 0.3, -0.2); stroke(g, shade('#6fb352', -0.4), 0.6); g.beginPath(); g.arc(-1, -4, 3 * p, -2.6, -0.4); stroke(g, rgba('#e8f7d0', 0.9), 0.5); }
  },
  sugarbeet(g, p, ripe) {
    for (let i = 0; i < 5; i++) leaf(g, 0, -1, -Math.PI / 2 + (i - 2) * 0.42, 15 * p, 4.5 * p, i % 2 ? '#4a9a3c' : '#5aaa48');
    g.strokeStyle = rgba('#c2306a', 0.7); g.lineWidth = 0.6;
    for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i - 2) * 0.42; g.beginPath(); g.moveTo(0, -1); g.lineTo(Math.cos(a) * 11 * p, -1 + Math.sin(a) * 11 * p); g.stroke(); }
    if (ripe) { ell(g, 0, 0, 4.5, 3, '#c2306a', INK, 0.6); }
  },
  strawberry(g, p, ripe) {
    for (let i = 0; i < 6; i++) { const a = -Math.PI + 0.3 + i / 5 * (Math.PI - 0.6); leaf(g, 0, -1, a, 9 * p, 4 * p, '#3f9a3e'); }
    if (p > 0.6) [[-6, -2], [5, -3]].forEach(([x, y]) => { for (let k = 0; k < 5; k++) { const a = k / 5 * 6.28; ell(g, x + Math.cos(a) * 1.3, y - 6 + Math.sin(a) * 1.3, 1, 1, '#fff'); } ell(g, x, y - 6, 0.7, 0.7, '#f2d23a'); });
    if (ripe) [[-4, 0], [4, 1], [0, -1]].forEach(([x, y]) => { g.beginPath(); g.moveTo(x, y + 3.5); g.bezierCurveTo(x - 3.5, y, x - 2.5, y - 3, x, y - 2.2); g.bezierCurveTo(x + 2.5, y - 3, x + 3.5, y, x, y + 3.5); g.fillStyle = '#e8344a'; g.fill(); stroke(g, INK, 0.5); });
  },
  garlic(g, p, ripe) {
    for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(i * 0.6, 0); g.quadraticCurveTo(i * 2.5, -9 * p, i * 4, -17 * p - Math.abs(i)); stroke(g, '#7fae4c', 1.5); }
    if (ripe) { g.beginPath(); g.moveTo(0, -5); g.bezierCurveTo(5, -4, 5, 2, 0, 2); g.bezierCurveTo(-5, 2, -5, -4, 0, -5); g.fillStyle = '#efe6d2'; g.fill(); stroke(g, INK, 0.6); }
  },
  chili(g, p, ripe) {
    g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -10 * p); stroke(g, '#4a7a2a', 1.4);
    for (let i = 0; i < 8; i++) { const a = -Math.PI / 2 + (i - 3.5) * 0.42; leaf(g, 0, -6 * p - (i % 3) * 2 * p, a, 8 * p, 3 * p, '#3e8a33'); }
    if (ripe) [[-5, -6], [4, -8], [-1, -3], [6, -3]].forEach(([x, y], i) => { g.save(); g.translate(x, y); g.rotate(0.2 * (i - 1.5)); g.beginPath(); g.moveTo(-1.2, -2); g.quadraticCurveTo(1.6, -2, 1, 2); g.quadraticCurveTo(0, 5, -1, 5.5); g.quadraticCurveTo(-1.6, 1, -1.2, -2); g.fillStyle = '#d8241c'; g.fill(); stroke(g, INK, 0.5); g.restore(); });
  },
  barley(g, p, ripe) {
    const col = ripe ? '#d7bf7c' : '#a7c25a';
    for (let i = -2; i <= 2; i++) {
      g.beginPath(); g.moveTo(i, 0); g.quadraticCurveTo(i * 2, -10 * p, i * 3 + 2, -19 * p); stroke(g, ripe ? '#b8a060' : '#7aa040', 0.9);
      if (p > 0.6) { g.save(); g.translate(i * 3 + 2, -19 * p); g.rotate(0.6); for (let k = 0; k < 4; k++) { ell(g, 0, k * 1.6, 1, 1.2, col); g.beginPath(); g.moveTo(0, k * 1.6); g.lineTo(-3, k * 1.6 - 4); stroke(g, rgba(col, 0.9), 0.35); } g.restore(); }
    }
  },
  hops(g, p, ripe) {
    g.fillStyle = '#8a6a42'; g.fillRect(-1, -30 * Math.max(p, 0.5), 2, 30 * Math.max(p, 0.5)); g.strokeStyle = INK; g.lineWidth = 0.5; g.strokeRect(-1, -30 * Math.max(p, 0.5), 2, 30 * Math.max(p, 0.5));
    for (let k = 0; k < 8 * p; k++) { const y = -2 - k * 3.4, s = k % 2 ? 1 : -1; leaf(g, s * 1, y, s > 0 ? -0.3 : Math.PI + 0.3, 6.5, 2.8, '#4f9a3a'); }
    if (ripe) for (let k = 0; k < 5; k++) { const x = (k % 2 ? 4 : -4), y = -6 - k * 4.5; g.beginPath(); g.ellipse(x, y, 1.8, 2.6, 0, 0, 6.28); g.fillStyle = '#c4e870'; g.fill(); stroke(g, shade('#a9d455', -0.5), 0.5); }
  },
  apple(g, p, ripe) {
    const s = Math.max(p, 0.4);
    g.fillStyle = '#7a5232'; g.fillRect(-1.4, -12 * s, 2.8, 12 * s);
    g.strokeStyle = INK; g.lineWidth = 0.5; g.strokeRect(-1.4, -12 * s, 2.8, 12 * s);
    [[-5, -16], [5, -16], [0, -21], [-2, -14], [3, -13]].forEach(([x, y]) => blob(g, x * s, y * s, 6.5 * s, '#4b9a3c', 0.3, -0.3));
    if (ripe) [[-6, -14], [5, -18], [1, -12], [-1, -22], [6, -12]].forEach(([x, y]) => { blob(g, x, y, 2.2, '#d8392b', 0.4, -0.3); stroke(g, INK, 0.4); });
  },
  blueberry(g, p, ripe) {
    [[-5, -5], [5, -5], [0, -9], [-2, -2], [3, -1]].forEach(([x, y]) => blob(g, x * p, y * p, 5.2 * p, '#3f8a46', 0.3, -0.3));
    for (let i = 0; i < 10; i++) leaf(g, (hash2(i, 1, 9) - 0.5) * 14 * p, -2 - hash2(i, 2, 9) * 10 * p, hash2(i, 3, 9) * 6.28, 3.5 * p, 1.5 * p, '#57a35a', false);
    if (ripe) for (let i = 0; i < 9; i++) { const x = (hash2(i, 4, 9) - 0.5) * 12, y = -2 - hash2(i, 5, 9) * 9; blob(g, x, y, 1.5, '#4c5fb8', 0.4, -0.3); }
  },
  corn(g, p, ripe) {
    for (let i = -1; i <= 1; i += 2) {
      const x = i * 4;
      g.beginPath(); g.moveTo(x, 0); g.lineTo(x, -30 * p); stroke(g, '#5a9a3a', 1.8);
      for (let k = 0; k < 4; k++) leaf(g, x, -5 - k * 6 * p, (k % 2 ? -0.5 : Math.PI + 0.5), 10 * p, 2.2 * p, '#6fb04a');
      if (ripe) { g.save(); g.translate(x + 2, -17); g.rotate(0.35); ell(g, 0, 0, 1.9, 4.5, '#f2cf3a', INK, 0.5); leaf(g, 0, 4, -1.7, 7, 1.8, '#8fc06a'); g.restore(); }
      if (p > 0.7) { g.beginPath(); g.moveTo(x, -30 * p); g.lineTo(x - 2, -34 * p); g.moveTo(x, -30 * p); g.lineTo(x + 2, -34 * p); stroke(g, '#c8a040', 0.8); }
    }
  },
  grapes(g, p, ripe) {
    g.fillStyle = '#8a6a42';
    g.fillRect(-12, -22, 2, 22); g.fillRect(10, -22, 2, 22); g.fillRect(-12, -22, 24, 1.6);
    g.strokeStyle = INK; g.lineWidth = 0.5; g.strokeRect(-12, -22, 2, 22); g.strokeRect(10, -22, 2, 22);
    g.beginPath(); g.moveTo(-11, -1); g.bezierCurveTo(-6, -14 * p, 6, -8 * p, 0, -20 * p); stroke(g, '#6a4a2a', 1.2);
    for (let i = 0; i < 7 * p; i++) leaf(g, -9 + i * 3, -19 + (i % 2) * 2, Math.PI / 2 + (i % 2 ? 0.6 : -0.6), 6, 3, '#5a9a3a', false);
    if (ripe) [[-6, -15], [5, -14]].forEach(([x, y]) => { [[0, 0], [2, 0], [-2, 0], [1, 2], [-1, 2], [0, 4]].forEach(([a, b]) => blob(g, x + a * 1.1, y + b * 1.1, 1.5, '#7b3f9e', 0.4, -0.3)); });
  },
  pumpkin(g, p, ripe) {
    g.beginPath(); g.moveTo(-14, 2); g.bezierCurveTo(-6, -4, 2, 4, 14, -2); stroke(g, '#5a8a2a', 1.3);
    for (let i = 0; i < 5; i++) { const x = -12 + i * 6; blob(g, x, -3 - (i % 2) * 2, 4.5 * p, '#4f9438', 0.3, -0.25); }
    if (ripe) { g.save(); g.translate(1, -3); for (let i = -1; i <= 1; i++) { g.beginPath(); g.ellipse(i * 3, 0, 4, 5.4, 0, 0, 6.28); g.fillStyle = lgrad(g, i * 3 - 4, 0, i * 3 + 4, 0, ['#ffb050', '#f08a1c', '#b8600a']); g.fill(); stroke(g, shade('#f08a1c', -0.55), 0.5); } g.beginPath(); g.moveTo(0, -5); g.lineTo(1, -7.5); stroke(g, '#5a7a2a', 1.6); g.restore(); }
    else if (p > 0.6) { blob(g, 2, -2, 2.6, '#b8d060'); }
  },
  juniper(g, p, ripe) {
    const s = Math.max(p, 0.35);
    for (let k = 0; k < 4; k++) {
      const y = -4 - k * 5 * s, w = (11 - k * 2.4) * s;
      g.beginPath(); g.moveTo(-w, y); g.lineTo(0, y - 9 * s); g.lineTo(w, y); g.quadraticCurveTo(0, y + 3, -w, y);
      g.fillStyle = lgrad(g, 0, y - 9 * s, 0, y, ['#5a9a7a', '#3c6e52']); g.fill(); stroke(g, shade('#3c6e52', -0.4), 0.5);
    }
    if (ripe) for (let i = 0; i < 8; i++) blob(g, (hash2(i, 1, 5) - 0.5) * 14, -3 - hash2(i, 2, 5) * 14, 1.3, '#6a84bb', 0.4, -0.3);
  },
};

function plantSprite(cropId, stage) {
  const key = 'plant_' + cropId + '_' + stage;
  if (ART.sprites[key]) return ART.sprites[key];
  const crop = CROP[cropId];
  const layout = SINGLE_PLANT[cropId] ? [[0, 6]] : [[-10, -3], [10, -3], [-10, 11], [10, 11]];
  const s = makeSprite(T, T + 30, T / 2, T / 2 + 30, g => {
    layout.forEach(([x, y], i) => {
      g.save(); g.translate(x, y);
      if (stage === 0) { ell(g, 0, 0, 3.5, 1.8, '#6a4528'); ell(g, -1, -0.5, 0.7, 0.5, '#e8d8a0'); ell(g, 1.2, 0.2, 0.7, 0.5, '#e8d8a0'); }
      else if (stage === 1) { ell(g, 0, 0.5, 3, 1.4, '#6a4528'); leaf(g, 0, 0, -2.2, 5, 2, crop.leaf); leaf(g, 0, 0, -0.9, 5, 2, shade(crop.leaf, 0.15)); }
      else { const sc = layout.length === 1 ? 1.15 : 0.62; g.scale(sc, sc); PLANT[cropId](g, stage === 2 ? 0.6 : 1, stage === 3); }
      g.restore();
    });
  }, { edge: 0.9 });
  ART.sprites[key] = s;
  return s;
}

// ---------------------------------------------------------------- buildings
// origin: footprint bottom-centre. Footprint spans x∈[-w*T/2, w*T/2], y∈[-h*T, 0].
function bShadow() { /* shadows are drawn at runtime so the sticker edge doesn't wrap them */ }
function planks(g, x, y, w, h, col, vertical = true) {
  g.fillStyle = lgrad(g, x, y, x + w, y + h, [shade(col, 0.15), col, shade(col, -0.2)]); g.fillRect(x, y, w, h);
  g.strokeStyle = rgba(shade(col, -0.5), 0.6); g.lineWidth = 0.6;
  if (vertical) for (let i = x + 5; i < x + w; i += 5) { g.beginPath(); g.moveTo(i, y); g.lineTo(i, y + h); g.stroke(); }
  else for (let i = y + 4; i < y + h; i += 4) { g.beginPath(); g.moveTo(x, i); g.lineTo(x + w, i); g.stroke(); }
  g.strokeStyle = INK; g.lineWidth = 0.9; g.strokeRect(x, y, w, h);
}
function crate(g, x, y, s, col = '#b8844a', fruit) {
  if (fruit) for (let i = 0; i < 4; i++) blob(g, x - s * 0.3 + (i % 2) * s * 0.6, y - s - 1 - Math.floor(i / 2) * 2, s * 0.24, fruit, 0.4, -0.3);
  planks(g, x - s / 2, y - s, s, s, col, false);
  g.beginPath(); g.moveTo(x - s / 2, y - s); g.lineTo(x + s / 2, y); stroke(g, rgba(shade(col, -0.5), 0.7), 0.8);
}
function stoneWall(g, x, y, w, h, col = '#b8b0a2') {
  g.fillStyle = col; g.fillRect(x, y, w, h);
  const r = mulberry(Math.round(x * 13 + y * 7));
  for (let yy = y; yy < y + h; yy += 5) for (let xx = x + ((yy - y) / 5 % 2) * 4 - 4; xx < x + w; xx += 8) {
    const ww = Math.min(7, x + w - xx), xs = Math.max(xx, x);
    rrect(g, xs + 0.4, yy + 0.4, Math.max(1, ww - 0.8 - (xs - xx)), 4.2, 1.2); g.fillStyle = shade(col, (r() - 0.5) * 0.3); g.fill(); stroke(g, rgba(shade(col, -0.5), 0.6), 0.5);
  }
  g.strokeStyle = INK; g.lineWidth = 0.9; g.strokeRect(x, y, w, h);
}

const BUILD_DRAW = {
  storehouse(g) {
    bShadow(g, 96, 96);
    // walls
    g.beginPath(); g.moveTo(-36, -10); g.lineTo(-36, -54); g.lineTo(0, -80); g.lineTo(36, -54); g.lineTo(36, -10); g.closePath();
    g.save(); g.clip(); planks(g, -36, -82, 72, 72, '#c4473a'); g.restore();
    g.beginPath(); g.moveTo(-36, -10); g.lineTo(-36, -54); g.lineTo(0, -80); g.lineTo(36, -54); g.lineTo(36, -10); g.closePath(); stroke(g, INK, 1);
    // roof trim
    g.beginPath(); g.moveTo(-42, -50); g.lineTo(0, -84); g.lineTo(42, -50); stroke(g, INK, 6.5); g.beginPath(); g.moveTo(-42, -50); g.lineTo(0, -84); g.lineTo(42, -50); stroke(g, '#5a3a2a', 4.5);
    g.beginPath(); g.moveTo(-40, -51); g.lineTo(0, -82.5); g.lineTo(40, -51); stroke(g, '#7a4a32', 1.2);
    // doors
    g.fillStyle = '#fbf3df'; g.fillRect(-16, -42, 32, 32); g.strokeStyle = INK; g.lineWidth = 0.9; g.strokeRect(-16, -42, 32, 32);
    planks(g, -14, -40, 13, 30, '#a83a30'); planks(g, 1, -40, 13, 30, '#a83a30');
    g.strokeStyle = '#fbf3df'; g.lineWidth = 2; [[-14, 1], [1, 14]].forEach(([a, b]) => { g.beginPath(); g.moveTo(a, -40); g.lineTo(b - 1, -10); g.moveTo(b - 1, -40); g.lineTo(a, -10); g.stroke(); });
    // loft window
    g.fillStyle = '#fbf3df'; g.fillRect(-8, -66, 16, 12); g.fillStyle = '#3a2a1a'; g.fillRect(-6, -64, 12, 8);
    g.fillStyle = '#e9c25a'; for (let i = 0; i < 6; i++) g.fillRect(-6 + i * 2, -59 - (i % 3), 1.6, 3 + (i % 3));
    // corners trim
    g.fillStyle = '#fbf3df'; g.fillRect(-37, -54, 3, 44); g.fillRect(34, -54, 3, 44);
    // hay + sacks
    ell(g, -36, -6, 10, 6, '#e9c25a', INK, 0.8); for (let i = 0; i < 8; i++) { g.beginPath(); g.moveTo(-44 + i * 2, -6); g.lineTo(-43 + i * 2.2, -11); stroke(g, '#c8a040', 0.6); }
    crate(g, 34, -2, 12, '#b8844a', '#f07a2a'); crate(g, 42, 4, 10, '#a87440');
  },
  shed(g) { BUILD_DRAW.storehouse(g); },
  market(g) {
    bShadow(g, 96, 96);
    // posts
    g.fillStyle = '#8a5a32'; [-38, 34].forEach(x => { g.fillRect(x, -72, 4, 62); g.strokeStyle = INK; g.lineWidth = 0.8; g.strokeRect(x, -72, 4, 62); });
    // counter
    planks(g, -42, -34, 84, 22, '#b07a42', false);
    g.fillStyle = '#8a5a32'; g.fillRect(-44, -37, 88, 4); g.strokeStyle = INK; g.strokeRect(-44, -37, 88, 4);
    // produce on counter
    crate(g, -26, -37, 16, '#c8945a', '#d8392b'); crate(g, -6, -37, 16, '#c8945a', '#f2cf3a'); crate(g, 14, -37, 16, '#c8945a', '#7b3f9e');
    [[30, -40, '#f08a1c']].forEach(([x, y, c]) => { blob(g, x, y, 5, c, 0.4, -0.3); stroke(g, INK, 0.6); });
    // awning
    for (let i = 0; i < 8; i++) {
      const x = -46 + i * 11.5;
      g.beginPath(); g.moveTo(x, -88); g.lineTo(x + 11.5, -88); g.lineTo(x + 12.5, -68); g.arc(x + 6.5, -68, 6, 0, Math.PI); g.closePath();
      g.fillStyle = i % 2 ? '#fbf3df' : '#d8463a'; g.fill(); stroke(g, INK, 0.8);
    }
    g.fillStyle = rgba('#000', 0.1); g.fillRect(-46, -88, 92, 6);
    // sign
    rrect(g, -16, -104, 32, 14, 3); g.fillStyle = '#f4e4bc'; g.fill(); stroke(g, INK, 0.9);
    g.beginPath(); g.moveTo(-10, -104); g.lineTo(-10, -88); g.moveTo(10, -104); g.lineTo(10, -88); stroke(g, '#6a4a2a', 1);
    blob(g, -11, -97, 3.2, '#f2c23a', 0.5, -0.3); stroke(g, INK, 0.6);
    g.fillStyle = '#6a3a1a'; g.font = 'bold 6px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('MARKET', 3.5, -96.5);
    crate(g, -40, 2, 12, '#a87440', '#9fd27a'); crate(g, 42, 2, 12, '#a87440', '#c69a62');
  },
  creator(g) {
    bShadow(g, 96, 96);
    // round stone base
    g.beginPath(); g.moveTo(-34, -12); g.lineTo(-34, -56); g.bezierCurveTo(-34, -64, 34, -64, 34, -56); g.lineTo(34, -12); g.bezierCurveTo(34, -2, -34, -2, -34, -12);
    g.save(); g.clip(); stoneWall(g, -36, -66, 72, 66, '#c8bfae'); g.fillStyle = lgrad(g, -34, 0, 34, 0, [rgba('#ffffff', 0.15), rgba('#000', 0), rgba('#000', 0.25)]); g.fillRect(-36, -66, 72, 66); g.restore();
    g.beginPath(); g.moveTo(-34, -12); g.lineTo(-34, -56); g.moveTo(34, -56); g.lineTo(34, -12); g.bezierCurveTo(34, -2, -34, -2, -34, -12); stroke(g, INK, 1);
    // conical roof
    g.beginPath(); g.moveTo(-42, -54); g.quadraticCurveTo(0, -46, 42, -54); g.lineTo(4, -104); g.quadraticCurveTo(0, -108, -4, -104); g.closePath();
    g.fillStyle = lgrad(g, -42, 0, 42, 0, ['#9a6ad0', '#7a4ab0', '#4a2a7a']); g.fill(); stroke(g, INK, 1);
    g.strokeStyle = rgba('#2a1a4a', 0.5); g.lineWidth = 0.7; for (let i = 1; i < 6; i++) { g.beginPath(); g.moveTo(-42 + i * 2, -54 + i * -8.3 + i * 0); g.quadraticCurveTo(0, -46 - i * 9, 42 - i * 2, -54 - i * 8.3); g.stroke(); }
    // star dots on roof
    for (let i = 0; i < 6; i++) ell(g, -20 + i * 8, -66 - (i % 3) * 7, 1, 1, '#ffe88a');
    // brass funnel
    g.beginPath(); g.moveTo(14, -80); g.lineTo(26, -112); g.lineTo(34, -112); g.lineTo(22, -76); g.closePath(); g.fillStyle = lgrad(g, 14, 0, 34, 0, ['#f2d27a', '#c9962a', '#8a6010']); g.fill(); stroke(g, INK, 0.9);
    ell(g, 30, -112, 6, 2.4, '#5a3a10', INK, 0.8);
    // meeple-shaped door, glowing
    g.save(); g.translate(0, -12); g.scale(1.25, 1.25); meeplePath(g); g.restore();
    g.fillStyle = rgrad(g, 0, -26, 26, ['#fff6c0', '#f8c84a', '#d8902a']); g.fill(); stroke(g, INK, 1);
    // gear sign
    g.save(); g.translate(-22, -44); g.scale(0.5, 0.5); g.translate(-16, -16); UI_ICON.gear(g); g.restore();
    // little windows
    ell(g, 22, -40, 4.5, 5.5, '#ffe9a0', INK, 0.9); g.beginPath(); g.moveTo(22, -45.5); g.lineTo(22, -34.5); g.moveTo(17.5, -40); g.lineTo(26.5, -40); stroke(g, '#6a4a2a', 0.8);
    // produce piles
    crate(g, -40, 2, 12, '#a87440', '#f07a2a');
  },
  mill(g) {
    bShadow(g, 96, 96);
    g.beginPath(); g.moveTo(-26, -8); g.lineTo(-18, -80); g.lineTo(18, -80); g.lineTo(26, -8); g.closePath();
    g.save(); g.clip(); stoneWall(g, -28, -82, 56, 76, '#e6dccb'); g.fillStyle = lgrad(g, -26, 0, 26, 0, [rgba('#fff', 0.15), rgba('#000', 0), rgba('#000', 0.28)]); g.fillRect(-28, -82, 56, 76); g.restore();
    g.beginPath(); g.moveTo(-26, -8); g.lineTo(-18, -80); g.lineTo(18, -80); g.lineTo(26, -8); g.closePath(); stroke(g, INK, 1);
    // cap roof
    g.beginPath(); g.moveTo(-24, -78); g.quadraticCurveTo(-22, -104, 0, -108); g.quadraticCurveTo(22, -104, 24, -78); g.closePath();
    g.fillStyle = lgrad(g, -24, 0, 24, 0, ['#9a5a3a', '#7a3a2a', '#4a2218']); g.fill(); stroke(g, INK, 1);
    g.strokeStyle = rgba('#2a1008', 0.5); g.lineWidth = 0.6; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(-22 + i * 2, -82 - i * 5); g.quadraticCurveTo(0, -86 - i * 5.5, 22 - i * 2, -82 - i * 5); g.stroke(); }
    // door + window
    g.beginPath(); g.moveTo(-8, -8); g.lineTo(-8, -26); g.arc(0, -26, 8, Math.PI, 0); g.lineTo(8, -8); g.closePath(); g.fillStyle = '#6a4228'; g.fill(); stroke(g, INK, 1);
    g.strokeStyle = rgba('#3a2010', 0.7); g.lineWidth = 0.6; for (let i = -5; i <= 5; i += 3.3) { g.beginPath(); g.moveTo(i, -9); g.lineTo(i, -32); g.stroke(); }
    ell(g, 0, -56, 5, 6, '#3a2a1a', INK, 0.9);
    // flour sacks
    for (let i = 0; i < 3; i++) { g.save(); g.translate(-34 + i * 9 + (i === 2 ? -4 : 0), i === 2 ? -6 : 2); g.scale(0.55, 0.55); g.translate(-16, -28); iconSack(g, { c: '#f4ecd8', l: '#e2c26a' }); g.restore(); }
    // hub (sails drawn live)
    ell(g, 0, -86, 4.5, 4.5, '#5a3a22', INK, 1);
  },
  pot(g) {
    bShadow(g, 96, 96);
    // stone hearth ring
    ell(g, 0, -26, 40, 18, '#8a8278', INK, 1);
    for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; blob(g, Math.cos(a) * 36, -26 + Math.sin(a) * 15, 6, i % 2 ? '#a8a092' : '#968e82', 0.3, -0.3); stroke(g, rgba(INK, 0.6), 0.6); }
    ell(g, 0, -26, 30, 12, '#3a2a20');
    // logs
    g.save(); g.translate(0, -22); [-0.4, 0.4, 0].forEach(a => { g.save(); g.rotate(a); rrect(g, -18, -3, 36, 6, 3); g.fillStyle = '#7a5232'; g.fill(); stroke(g, INK, 0.8); ell(g, 18, 0, 2.6, 3, '#d8b080', INK, 0.6); g.restore(); }); g.restore();
    // tripod
    g.strokeStyle = INK; g.lineWidth = 3.4; g.beginPath(); g.moveTo(-34, -8); g.lineTo(0, -92); g.lineTo(34, -8); g.moveTo(0, -92); g.lineTo(6, -20); g.stroke();
    g.strokeStyle = '#6a4a2a'; g.lineWidth = 2; g.beginPath(); g.moveTo(-34, -8); g.lineTo(0, -92); g.lineTo(34, -8); g.moveTo(0, -92); g.lineTo(6, -20); g.stroke();
    g.beginPath(); g.moveTo(0, -90); g.lineTo(0, -66); stroke(g, '#3a3a3a', 1.2);
    // cauldron
    g.beginPath(); g.moveTo(-28, -60); g.bezierCurveTo(-32, -24, 32, -24, 28, -60); g.closePath();
    g.fillStyle = rgrad(g, -8, -50, 34, ['#5a5a62', '#2e2e34', '#16161a'], -12, -52); g.fill(); stroke(g, INK, 1.2);
    g.beginPath(); g.ellipse(0, -60, 29, 8, 0, 0, Math.PI * 2); g.fillStyle = '#3a3a42'; g.fill(); stroke(g, INK, 1.2);
    g.beginPath(); g.ellipse(-8, -46, 6, 9, 0.3, 0, Math.PI * 2); g.fillStyle = rgba('#ffffff', 0.12); g.fill();
    // feet
    [-16, 16].forEach(x => { g.fillStyle = '#222'; g.fillRect(x - 2, -32, 4, 6); });
    // spoon
    g.save(); g.translate(14, -66); g.rotate(0.5); g.fillStyle = '#c8945a'; g.fillRect(-1.5, -26, 3, 30); g.strokeStyle = INK; g.lineWidth = 0.7; g.strokeRect(-1.5, -26, 3, 30); g.restore();
    // ingredient basket
    g.save(); g.translate(-40, 0); g.scale(0.55, 0.55); g.translate(-16, -28); UI_ICON.basket(g); g.restore();
  },
  crock(g) {
    // stand
    planks(g, -18, -12, 36, 6, '#8a6a42', false);
    g.beginPath(); g.moveTo(-15, -12); g.bezierCurveTo(-22, -34, -18, -50, -12, -54); g.lineTo(12, -54); g.bezierCurveTo(18, -50, 22, -34, 15, -12); g.closePath();
    g.fillStyle = lgrad(g, -20, 0, 20, 0, ['#d8a878', '#a8693f', '#6a3a1f']); g.fill(); stroke(g, INK, 1);
    g.fillStyle = '#efe0c0'; g.beginPath(); g.moveTo(-18.5, -34); g.lineTo(18.5, -34); g.lineTo(18, -28); g.lineTo(-18, -28); g.closePath(); g.fill(); stroke(g, INK, 0.6);
    g.fillStyle = '#5a7ab0'; for (let i = -2; i <= 2; i++) ell(g, i * 6.5, -31, 1.6, 1.6, '#5a7ab0');
    // cloth top
    g.beginPath(); g.moveTo(-14, -52); g.quadraticCurveTo(-18, -58, -10, -62); g.quadraticCurveTo(0, -66, 10, -62); g.quadraticCurveTo(18, -58, 14, -52); g.quadraticCurveTo(0, -48, -14, -52);
    g.fillStyle = '#e8dcc0'; g.fill(); stroke(g, INK, 0.8);
    g.beginPath(); g.moveTo(-13, -53); g.quadraticCurveTo(0, -50, 13, -53); stroke(g, '#b03a2a', 1.6);
    g.beginPath(); g.moveTo(-14, -52); g.lineTo(-16, -46); g.lineTo(-12, -48); stroke(g, '#e8dcc0', 1.4);
  },
  kettle(g) {
    bShadow(g, 96, 96);
    // brick stove
    g.save(); rrect(g, -30, -44, 44, 36, 2); g.clip();
    g.fillStyle = '#b8583a'; g.fillRect(-30, -44, 44, 36);
    g.strokeStyle = rgba('#5a2a18', 0.6); g.lineWidth = 0.6;
    for (let y = -44; y < -8; y += 5) { g.beginPath(); g.moveTo(-30, y); g.lineTo(14, y); g.stroke(); for (let x = -30 + ((y + 44) / 5 % 2) * 4; x < 14; x += 8) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 5); g.stroke(); } }
    g.restore(); rrect(g, -30, -44, 44, 36, 2); stroke(g, INK, 1);
    // fire mouth
    g.beginPath(); g.moveTo(-18, -8); g.lineTo(-18, -20); g.arc(-8, -20, 10, Math.PI, 0); g.lineTo(2, -8); g.closePath(); g.fillStyle = '#2a1a12'; g.fill(); stroke(g, INK, 0.9);
    // chimney
    stoneWall(g, 4, -92, 10, 48, '#a84a32');
    // copper kettle
    g.beginPath(); g.moveTo(-26, -46); g.bezierCurveTo(-30, -78, 10, -78, 6, -46); g.closePath();
    g.fillStyle = rgrad(g, -14, -60, 24, ['#ffc890', '#d8783a', '#8a3a12'], -18, -66); g.fill(); stroke(g, INK, 1.1);
    g.beginPath(); g.ellipse(-10, -70, 13, 4, 0, 0, Math.PI * 2); g.fillStyle = '#b8602a'; g.fill(); stroke(g, INK, 0.9);
    g.beginPath(); g.arc(-10, -72, 12, Math.PI * 1.1, Math.PI * 1.9); stroke(g, INK, 2.6); g.beginPath(); g.arc(-10, -72, 12, Math.PI * 1.1, Math.PI * 1.9); stroke(g, '#c87a3a', 1.4);
    // shelf with jars
    planks(g, 18, -64, 26, 4, '#8a5a32', false); planks(g, 18, -38, 26, 4, '#8a5a32', false);
    g.fillStyle = '#6a4228'; g.fillRect(19, -64, 2, 56); g.fillRect(41, -64, 2, 56);
    [['#d8223e', -64], ['#3c3f8f', -64], ['#e9b84a', -38], ['#5a1f6e', -38]].forEach(([c, y], i) => { g.save(); g.translate(24 + (i % 2) * 10, y - 1); g.scale(0.32, 0.32); g.translate(-16, -28); iconJar(g, { c, l: '#fbf3df' }); g.restore(); });
    crate(g, 30, 2, 12, '#a87440', '#e8344a');
  },
  barrel(g) {
    // cradle
    g.fillStyle = '#6a4228'; g.beginPath(); g.moveTo(-20, -6); g.lineTo(-14, -18); g.lineTo(-10, -18); g.lineTo(-14, -6); g.closePath(); g.fill(); stroke(g, INK, 0.7);
    g.beginPath(); g.moveTo(20, -6); g.lineTo(14, -18); g.lineTo(10, -18); g.lineTo(14, -6); g.closePath(); g.fill(); stroke(g, INK, 0.7);
    // barrel on side (front view of lid)
    g.beginPath(); g.ellipse(0, -30, 19, 22, 0, 0, Math.PI * 2);
    g.fillStyle = rgrad(g, 0, -30, 22, ['#d8a060', '#a8703a', '#6a4220'], -5, -36); g.fill(); stroke(g, INK, 1.1);
    g.strokeStyle = rgba('#4a2a12', 0.6); g.lineWidth = 0.7;
    for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(i * 5, -51); g.lineTo(i * 5, -9); g.stroke(); }
    g.beginPath(); g.ellipse(0, -30, 19, 22, 0, 0, Math.PI * 2); stroke(g, '#3a3a3e', 2.6);
    g.beginPath(); g.ellipse(0, -30, 15.5, 18, 0, 0, Math.PI * 2); stroke(g, rgba('#3a3a3e', 0.7), 1.2);
    // spigot
    g.fillStyle = '#c8a040'; g.fillRect(-2, -18, 4, 7); g.strokeStyle = INK; g.lineWidth = 0.7; g.strokeRect(-2, -18, 4, 7);
    g.fillStyle = '#c8a040'; g.fillRect(-4, -20, 8, 3); g.strokeRect(-4, -20, 8, 3);
    // stamp
    g.strokeStyle = rgba('#3a1a08', 0.55); g.lineWidth = 1; g.beginPath(); g.arc(0, -34, 6, 0, 6.28); g.stroke();
    g.save(); g.translate(0, -29); g.scale(0.35, 0.35); meeplePath(g); g.restore(); g.fillStyle = rgba('#3a1a08', 0.55); g.fill();
  },
  still(g) {
    bShadow(g, 96, 96);
    // brick firebox
    g.save(); rrect(g, -38, -30, 40, 22, 2); g.clip(); g.fillStyle = '#a84a32'; g.fillRect(-38, -30, 40, 22);
    g.strokeStyle = rgba('#5a2a18', 0.6); g.lineWidth = 0.6; for (let y = -30; y < -8; y += 5) { g.beginPath(); g.moveTo(-38, y); g.lineTo(2, y); g.stroke(); for (let x = -38 + ((y + 30) / 5 % 2) * 4; x < 2; x += 8) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 5); g.stroke(); } }
    g.restore(); rrect(g, -38, -30, 40, 22, 2); stroke(g, INK, 1);
    g.beginPath(); g.moveTo(-26, -8); g.lineTo(-26, -16); g.arc(-18, -16, 8, Math.PI, 0); g.lineTo(-10, -8); g.closePath(); g.fillStyle = '#2a1a12'; g.fill(); stroke(g, INK, 0.8);
    // onion pot
    g.beginPath(); g.moveTo(-34, -30); g.bezierCurveTo(-44, -54, -30, -76, -18, -78); g.bezierCurveTo(-6, -76, 8, -54, -2, -30); g.closePath();
    g.fillStyle = rgrad(g, -18, -54, 28, ['#ffd0a0', '#e08a4a', '#9a4a1a'], -26, -64); g.fill(); stroke(g, INK, 1.1);
    g.strokeStyle = rgba('#7a3a12', 0.6); g.lineWidth = 0.8; [-62, -46].forEach(y => { g.beginPath(); g.moveTo(-38 + (y + 62) * -0.2 + 2, y); g.quadraticCurveTo(-18, y + 4, 2 - (y + 62) * -0.2 - 4, y); g.stroke(); });
    for (let i = 0; i < 8; i++) ell(g, -32 + i * 4, -38, 0.7, 0.7, '#7a3a12');
    // swan neck
    g.beginPath(); g.moveTo(-18, -78); g.quadraticCurveTo(-16, -96, 4, -92); g.lineTo(26, -68); stroke(g, INK, 6); g.beginPath(); g.moveTo(-18, -78); g.quadraticCurveTo(-16, -96, 4, -92); g.lineTo(26, -68); stroke(g, '#d8783a', 4);
    g.beginPath(); g.moveTo(-17, -80); g.quadraticCurveTo(-15, -94, 4, -90.5); stroke(g, rgba('#ffd0a0', 0.8), 1);
    // condenser tub
    g.beginPath(); g.moveTo(16, -64); g.lineTo(18, -16); g.lineTo(40, -16); g.lineTo(42, -64); g.closePath();
    g.save(); g.clip(); planks(g, 14, -66, 30, 52, '#8a5a32'); g.restore(); g.beginPath(); g.moveTo(16, -64); g.lineTo(18, -16); g.lineTo(40, -16); g.lineTo(42, -64); g.closePath(); stroke(g, INK, 1);
    [-58, -26].forEach(y => { g.beginPath(); g.moveTo(16.5, y); g.lineTo(41.5, y); stroke(g, '#3a3a3e', 2); });
    ell(g, 29, -64, 13, 3.5, '#4a7a9a', INK, 0.9);
    // spout + jug
    g.beginPath(); g.moveTo(40, -22); g.lineTo(46, -20); stroke(g, '#d8783a', 2.4);
    g.save(); g.translate(46, -2); g.scale(0.4, 0.4); g.translate(-16, -28); iconBottle(g, { c: '#e5b545', shape: 'jug' }); g.restore();
    // firewood stack
    for (let i = 0; i < 3; i++) { rrect(g, -42 + i * 2, -6 - i * 4, 18, 4, 2); g.fillStyle = '#7a5232'; g.fill(); stroke(g, INK, 0.6); ell(g, -24 + i * 2, -4 - i * 4, 1.8, 2, '#d8b080'); }
  },
  well(g) {
    bShadow(g, 96, 96);
    // stone cylinder
    g.beginPath(); g.moveTo(-24, -40); g.lineTo(-24, -14); g.bezierCurveTo(-24, -4, 24, -4, 24, -14); g.lineTo(24, -40); g.closePath();
    g.save(); g.clip(); stoneWall(g, -26, -50, 52, 48, '#b0a898'); g.fillStyle = lgrad(g, -24, 0, 24, 0, [rgba('#fff', 0.15), rgba('#000', 0), rgba('#000', 0.3)]); g.fillRect(-26, -50, 52, 48); g.restore();
    g.beginPath(); g.moveTo(-24, -40); g.lineTo(-24, -14); g.bezierCurveTo(-24, -4, 24, -4, 24, -14); g.lineTo(24, -40); stroke(g, INK, 1);
    ell(g, 0, -40, 24, 8, '#c8c0b0', INK, 1); ell(g, 0, -40, 18, 5.5, '#2a4a5a'); ell(g, -4, -41, 6, 1.5, rgba('#9ad0e8', 0.6));
    // posts + roof
    g.fillStyle = '#7a5232'; [-22, 18].forEach(x => { g.fillRect(x, -82, 4, 42); g.strokeStyle = INK; g.lineWidth = 0.8; g.strokeRect(x, -82, 4, 42); });
    g.beginPath(); g.moveTo(-32, -76); g.lineTo(0, -98); g.lineTo(32, -76); g.lineTo(26, -74); g.lineTo(0, -92); g.lineTo(-26, -74); g.closePath(); g.fillStyle = '#8a3a2a'; g.fill(); stroke(g, INK, 1);
    g.beginPath(); g.moveTo(-28, -76); g.lineTo(0, -95); g.lineTo(28, -76); stroke(g, '#b85a3a', 1.6);
    // crank + rope + bucket
    g.fillStyle = '#5a3a22'; g.fillRect(-20, -70, 40, 3);
    g.beginPath(); g.moveTo(4, -68); g.lineTo(4, -54); stroke(g, '#c8a878', 0.9);
    g.beginPath(); g.moveTo(-1, -54); g.lineTo(9, -54); g.lineTo(8, -46); g.lineTo(0, -46); g.closePath(); g.fillStyle = '#9a6a3a'; g.fill(); stroke(g, INK, 0.8);
    blob(g, -30, -4, 5, '#5aa84a'); blob(g, 30, -6, 6, '#4f9a42');
  },
  scarecrow(g) {
    g.fillStyle = '#7a5232'; g.fillRect(-1.6, -50, 3.2, 48); g.fillRect(-18, -38, 36, 3);
    g.strokeStyle = INK; g.lineWidth = 0.8; g.strokeRect(-1.6, -50, 3.2, 48); g.strokeRect(-18, -38, 36, 3);
    // shirt
    g.beginPath(); g.moveTo(-14, -39); g.lineTo(14, -39); g.lineTo(9, -18); g.lineTo(-9, -18); g.closePath(); g.fillStyle = '#5a7ab0'; g.fill(); stroke(g, INK, 0.9);
    g.strokeStyle = rgba('#2a3a6a', 0.6); g.lineWidth = 0.6; for (let i = -12; i < 14; i += 4) { g.beginPath(); g.moveTo(i, -39); g.lineTo(i * 0.7, -18); g.stroke(); }
    rrect(g, -4, -32, 7, 6, 1); g.fillStyle = '#d8463a'; g.fill(); stroke(g, INK, 0.5);
    // straw hands
    [-1, 1].forEach(s => { for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(s * 17, -37); g.lineTo(s * (20 + i), -40 + i * 2); stroke(g, '#e9c25a', 0.9); } });
    // head
    blob(g, 0, -47, 7, '#e8d4a8', 0.3, -0.2); stroke(g, INK, 0.9);
    ell(g, -2.5, -48, 1, 1, INK); ell(g, 2.5, -48, 1, 1, INK);
    g.beginPath(); g.moveTo(-3, -44); for (let i = 0; i < 4; i++) g.lineTo(-3 + i * 2 + 1, -44 + (i % 2 ? 1 : -0.6)); stroke(g, INK, 0.6);
    // hat
    ell(g, 0, -52, 12, 3, '#c8a040', INK, 0.9);
    g.beginPath(); g.moveTo(-6, -52); g.quadraticCurveTo(-5, -62, 0, -62); g.quadraticCurveTo(5, -62, 6, -52); g.closePath(); g.fillStyle = '#d8b050'; g.fill(); stroke(g, INK, 0.9);
    g.fillStyle = '#b03a2a'; g.fillRect(-6, -55, 12, 2.4);
    // crow
    g.save(); g.translate(14, -42); ell(g, 0, 0, 4, 2.6, '#2a2a32', INK, 0.5); ell(g, 3.6, -1.6, 2, 2, '#2a2a32'); g.beginPath(); g.moveTo(5.4, -1.8); g.lineTo(7.6, -1.2); g.lineTo(5.4, -0.8); g.fillStyle = '#f2c23a'; g.fill(); g.restore();
  },
  lantern(g) {
    g.fillStyle = '#3a3a42'; g.fillRect(-1.6, -50, 3.2, 46); g.strokeStyle = INK; g.lineWidth = 0.7; g.strokeRect(-1.6, -50, 3.2, 46);
    g.fillRect(-5, -6, 10, 3);
    g.beginPath(); g.moveTo(0, -50); g.quadraticCurveTo(8, -52, 8, -46); stroke(g, '#3a3a42', 1.6);
    g.beginPath(); g.moveTo(5, -46); g.lineTo(11, -46); g.lineTo(10, -36); g.lineTo(6, -36); g.closePath(); g.fillStyle = '#ffe088'; g.fill(); stroke(g, INK, 0.8);
    g.beginPath(); g.moveTo(4, -46); g.lineTo(8, -50); g.lineTo(12, -46); g.closePath(); g.fillStyle = '#3a3a42'; g.fill(); stroke(g, INK, 0.6);
  },
  flowers(g) {
    planks(g, -20, -16, 40, 10, '#9a6a3a', false);
    ell(g, 0, -16, 19, 4, '#5a3a22');
    const r = mulberry(5), cols = ['#e8344a', '#f2c23a', '#ffffff', '#c06ad8', '#f08a3a', '#6a9ae8'];
    for (let i = 0; i < 12; i++) {
      const x = -16 + i * 2.9, h = 8 + r() * 10;
      g.beginPath(); g.moveTo(x, -16); g.lineTo(x + (r() - 0.5) * 3, -16 - h); stroke(g, '#4a8a3a', 0.8);
      if (i % 3 === 0) leaf(g, x, -18, -0.6 - r(), 5, 1.8, '#5aa84a', false);
      const c = cols[i % cols.length], fx = x + (r() - 0.5) * 3, fy = -16 - h;
      for (let k = 0; k < 5; k++) { const a = k / 5 * 6.28; ell(g, fx + Math.cos(a) * 1.8, fy + Math.sin(a) * 1.8, 1.4, 1.4, c); }
      ell(g, fx, fy, 0.9, 0.9, '#f2c23a');
    }
  },
  bench(g) {
    g.fillStyle = '#5a3a22'; [-16, 13].forEach(x => { g.fillRect(x, -22, 3, 14); });
    planks(g, -20, -24, 40, 5, '#b07a42', false);
    planks(g, -20, -38, 40, 9, '#b07a42', false);
    g.fillStyle = '#5a3a22'; [-16, 13].forEach(x => { g.fillRect(x, -38, 3, 15); });
  },
};

// returns sprite + meta for a building type
function buildingSprite(type) {
  const key = 'b_' + type;
  if (ART.sprites[key]) return ART.sprites[key];
  const def = BUILDINGS[type];
  if (type === 'greenhouse') return greenhouseSprite(false);
  const W = def.w * T, Hh = Math.max(124, def.h * T + 64);
  const s = makeSprite(W + 20, Hh, (W + 20) / 2, Hh - 6, g => BUILD_DRAW[type](g), { edge: 1.6 });
  ART.sprites[key] = s;
  return s;
}

// ---------------------------------------------------------------- init
function buildArt() {
  ART.sprites = {}; ART.icons = {};
  const ids = [...CROPS.map(c => c.id), ...GOODS.map(g => g.id)];
  ids.forEach(id => {
    ART.icons[id] = makeSprite(32, 32, 0, 0, g => drawIcon(g, id), { S: 3, edge: 1.3 });
  });
  Object.keys(UI_ICON).forEach(id => { ART.icons['ui_' + id] = makeSprite(32, 32, 0, 0, g => UI_ICON[id](g), { S: 3, edge: 1.3 }); });
  if (!Object.keys(ART.iconURL).length) {
    for (const k in ART.icons) ART.iconURL[k] = ART.icons[k].c.toDataURL();
  }
}
// Same as buildArt, but yields to the browser so a loading bar can update on slow tablets.
// Yield to the browser without timers (timers can be throttled in a WebView that isn't "visible" yet).
function yieldNow() {
  return new Promise(res => {
    let done = false; const fin = () => { if (!done) { done = true; res(); } };
    try { const ch = new MessageChannel(); ch.port1.onmessage = fin; ch.port2.postMessage(0); } catch (e) { }
    setTimeout(fin, 50);
  });
}
async function buildArtAsync(onProgress) {
  ART.sprites = {}; ART.icons = {};
  const jobs = [];
  [...CROPS.map(c => c.id), ...GOODS.map(g => g.id)].forEach(id => jobs.push(() => { ART.icons[id] = makeSprite(32, 32, 0, 0, g => drawIcon(g, id), { S: 3, edge: 1.3 }); }));
  Object.keys(UI_ICON).forEach(id => jobs.push(() => { ART.icons['ui_' + id] = makeSprite(32, 32, 0, 0, g => UI_ICON[id](g), { S: 3, edge: 1.3 }); }));
  for (let i = 0; i < jobs.length; i++) {
    jobs[i]();
    if (i % 8 === 7) { onProgress(i / jobs.length); await yieldNow(); }
  }
  for (const k in ART.icons) ART.iconURL[k] = ART.icons[k].c.toDataURL();
}
function iconImg(id, cls = '') {
  const u = ART.iconURL[id] || ART.iconURL['ui_' + id];
  return u ? `<img class="ico ${cls}" src="${u}" alt="">` : '';
}
;(window.__stage = window.__stage || []).push('art.js loaded');
