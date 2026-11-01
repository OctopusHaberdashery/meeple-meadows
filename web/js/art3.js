// Meeple Meadows — art, part 3: fish, fish dishes, the dock, smokehouse and sushi counter.
'use strict';

// One drawer for every fish, shaped by its look: body length, colours, stripes, spots, whiskers...
function drawFish(g, o, sc = 1) {
  const L = 12 * (o.len || 1), H = o.round ? 7.5 : 5.6 - (o.len > 1.2 ? 0.8 : 0);
  g.save(); g.scale(sc, sc);
  // tail
  g.beginPath(); g.moveTo(L - 2, 0); g.lineTo(L + 6, -5.5); g.quadraticCurveTo(L + 3.5, 0, L + 6, 5.5); g.closePath();
  g.fillStyle = shade(o.c, -0.15); g.fill(); stroke(g, INK, 0.8);
  // fins
  g.beginPath(); g.moveTo(-L * 0.2, -H + 0.5); g.quadraticCurveTo(L * 0.15, -H - 4.5, L * 0.5, -H + 1.5); g.closePath(); g.fillStyle = shade(o.c, -0.1); g.fill(); stroke(g, INK, 0.6);
  g.beginPath(); g.moveTo(0, H - 1); g.quadraticCurveTo(L * 0.25, H + 3, L * 0.45, H - 1); g.closePath(); g.fillStyle = shade(o.c, -0.1); g.fill(); stroke(g, INK, 0.5);
  // body
  g.beginPath(); g.moveTo(-L, 0); g.bezierCurveTo(-L * 0.7, -H * 1.25, L * 0.6, -H * 1.1, L, 0); g.bezierCurveTo(L * 0.6, H * 1.1, -L * 0.7, H * 1.25, -L, 0); g.closePath();
  g.fillStyle = lgrad(g, 0, -H, 0, H, [shade(o.c, 0.25), o.c, o.b]); g.fill();
  g.save(); g.clip();
  if (o.bars) { g.fillStyle = rgba(o.bars, 0.55); for (let i = -2; i <= 2; i++) g.fillRect(i * L * 0.32 - 1.2, -H, 2.4, H * 1.2); }
  if (o.stripe) { g.fillStyle = rgba(o.stripe, 0.75); g.fillRect(-L, -0.8, L * 2, 2); }
  if (o.spots) { const r = mulberry(L * 10); g.fillStyle = rgba(shade(o.c, -0.5), 0.7); for (let i = 0; i < 9; i++) ell(g, (r() - 0.4) * L * 1.6, (r() - 0.7) * H, 0.7, 0.7, rgba(shade(o.c, -0.5), 0.7)); }
  if (o.scales) { g.strokeStyle = rgba(shade(o.c, -0.4), 0.5); g.lineWidth = 0.5; for (let x = -L * 0.5; x < L * 0.8; x += 3) for (let y = -H; y < H; y += 3) { g.beginPath(); g.arc(x, y, 1.6, -1, 1); g.stroke(); } }
  if (o.patches) { ell(g, -L * 0.2, -H * 0.3, L * 0.3, H * 0.6, '#fff6e8'); ell(g, L * 0.4, H * 0.1, L * 0.22, H * 0.5, '#e84a1a'); }
  if (o.ridge) { g.fillStyle = rgba('#e8e8f0', 0.8); for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(i * L * 0.22 - 1.2, -H * 0.55); g.lineTo(i * L * 0.22, -H * 0.85); g.lineTo(i * L * 0.22 + 1.2, -H * 0.55); g.fill(); } }
  g.restore();
  g.beginPath(); g.moveTo(-L, 0); g.bezierCurveTo(-L * 0.7, -H * 1.25, L * 0.6, -H * 1.1, L, 0); g.bezierCurveTo(L * 0.6, H * 1.1, -L * 0.7, H * 1.25, -L, 0); stroke(g, INK, 0.9);
  // gill, eye, mouth
  g.beginPath(); g.arc(-L * 0.55, 0, H * 0.75, -0.9, 0.9); stroke(g, rgba(INK, 0.5), 0.6);
  ell(g, -L * 0.72, -H * 0.25, 1.5, 1.5, '#fff', INK, 0.5); ell(g, -L * 0.74, -H * 0.25, 0.75, 0.75, '#1a1410');
  if (o.whiskers) { g.beginPath(); g.moveTo(-L, 0.5); g.quadraticCurveTo(-L - 4, 2, -L - 6, 6); g.moveTo(-L, 0.5); g.quadraticCurveTo(-L - 5, -1, -L - 7, -3); stroke(g, INK, 0.6); }
  if (o.shine) { g.globalAlpha = 0.8; for (let i = 0; i < 3; i++) { const x = -L * 0.3 + i * L * 0.4, y = -H * 1.4 - (i % 2) * 2; g.beginPath(); for (let k = 0; k < 8; k++) { const rr = k % 2 ? 0.6 : 2.2, a = k / 8 * Math.PI * 2; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); g.fillStyle = '#fff6b0'; g.fill(); } g.globalAlpha = 1; }
  g.restore();
}
FISH.forEach(f => { ICON_DRAW[f.id] = g => { g.translate(15, 17); g.rotate(-0.25); drawFish(g, f.look, f.look.len > 1.3 ? 0.78 : 0.92); }; });

// ---------------------------------------------------------------- fish dish icons
ICON_DRAW_GOODS.smoked = function (g, o) {
  g.translate(16, 17);
  g.fillStyle = '#8a5a32'; g.fillRect(-14, -12, 28, 2.4); g.strokeStyle = INK; g.lineWidth = 0.6; g.strokeRect(-14, -12, 28, 2.4);
  g.beginPath(); g.moveTo(0, -10); g.lineTo(0, -7); stroke(g, '#c8a878', 0.8);
  g.save(); g.translate(0, 2); g.rotate(Math.PI / 2); drawFish(g, { c: o.c, b: shade(o.c, 0.35), stripe: shade(o.c, -0.35) }, 0.75); g.restore();
  g.strokeStyle = rgba('#5a3a1a', 0.5); g.lineWidth = 0.7; for (let i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(-4, i * 4 + 2); g.lineTo(4, i * 4 + 4); g.stroke(); }
};
ICON_DRAW_GOODS.sushi = function (g, o) {
  g.translate(16, 18);
  rrect(g, -14, 4, 28, 6, 2); g.fillStyle = '#8a5a32'; g.fill(); stroke(g, INK, 0.8);
  const piece = (x, y) => {
    if (o.roll) {
      ell(g, x, y, 5, 5, '#1a2a1a', INK, 0.7); ell(g, x, y, 3.8, 3.8, '#fbf8f0'); ell(g, x, y, 1.6, 1.6, o.c); ell(g, x + 0.8, y + 0.8, 0.9, 0.9, '#5aa335');
    } else {
      rrect(g, x - 5.5, y - 1, 11, 4.5, 2); g.fillStyle = '#fbf8f0'; g.fill(); stroke(g, INK, 0.6);
      g.beginPath(); g.moveTo(x - 6.5, y); g.quadraticCurveTo(x, y - 5, x + 6.5, y - 0.5); g.quadraticCurveTo(x, y + 1.5, x - 6.5, y); g.fillStyle = o.c; g.fill(); stroke(g, INK, 0.6);
      g.strokeStyle = rgba('#ffffff', 0.7); g.lineWidth = 0.6; for (let k = -1; k <= 1; k++) { g.beginPath(); g.moveTo(x + k * 3 - 1, y - 2); g.lineTo(x + k * 3 + 1, y); g.stroke(); }
    }
  };
  piece(-6, 0); piece(6, 0);
  if (o.deluxe) { piece(0, -6); ell(g, 10, -7, 3, 2, '#22222e', INK, 0.5); leaf(g, -12, -4, -0.8, 6, 2, '#5aa335'); }
};
ICON_DRAW_GOODS.fishchips = function (g) {
  g.translate(16, 17);
  for (let i = 0; i < 6; i++) { g.save(); g.translate(-6 + i * 2.2, -6); g.rotate((i - 2.5) * 0.12); g.fillStyle = '#f2c84a'; g.fillRect(-1, -6, 2, 10); g.strokeStyle = rgba(INK, 0.6); g.lineWidth = 0.4; g.strokeRect(-1, -6, 2, 10); g.restore(); }
  g.save(); g.translate(6, -4); g.rotate(-0.5); g.beginPath(); g.ellipse(0, 0, 7, 4, 0, 0, Math.PI * 2); g.fillStyle = rgrad(g, 0, 0, 7, ['#f6d494', '#d9963a']); g.fill(); stroke(g, INK, 0.7); g.restore();
  g.beginPath(); g.moveTo(-10, -2); g.lineTo(10, -2); g.lineTo(5, 13); g.lineTo(-5, 13); g.closePath();
  g.fillStyle = '#fbf3df'; g.fill(); stroke(g, INK, 0.9);
  g.strokeStyle = '#5a8ad8'; g.lineWidth = 1; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(-8 + i * 1.5, 1 + i * 4); g.lineTo(8 - i * 1.5, 1 + i * 4); g.stroke(); }
};
// little fish chunks floating in fish soups
const _bowl = iconBowl;
iconBowl = function (g, o) {
  _bowl(g, o);
  if (o.fish) for (let i = 0; i < 3; i++) { g.beginPath(); g.ellipse(-5 + i * 5, -1.5, 2.2, 1.2, 0.3, 0, Math.PI * 2); g.fillStyle = '#fbe8d8'; g.fill(); stroke(g, rgba(INK, 0.5), 0.4); }
};

// ---------------------------------------------------------------- fishing buildings
Object.assign(BUILD_DRAW, {
  dock(g) {
    // a short pier on posts; the part over the water is drawn live toward the pond
    [-16, 14].forEach(x => { g.fillStyle = '#5a3a22'; g.fillRect(x, -16, 4, 14); g.strokeStyle = INK; g.lineWidth = 0.7; g.strokeRect(x, -16, 4, 14); });
    for (let i = 0; i < 5; i++) planks(g, -20, -38 + i * 5, 40, 5, i % 2 ? '#b07a42' : '#a8703a', true);
    // rope coil, bucket and a spare rod
    g.beginPath(); for (let k = 0; k < 3; k++) g.ellipse(-12, -30, 4.5 - k * 1.2, 2.4 - k * 0.6, 0, 0, Math.PI * 2); stroke(g, '#c8a878', 1.2);
    g.beginPath(); g.moveTo(8, -36); g.lineTo(12, -24); g.lineTo(18, -24); g.lineTo(20, -36); g.closePath(); g.fillStyle = '#7a9ab0'; g.fill(); stroke(g, INK, 0.8);
    ell(g, 14, -36, 6, 2, '#4a7a9a', INK, 0.6);
    g.save(); g.translate(14, -38); g.scale(0.4, 0.4); g.translate(-15, -17); drawFish(g, FISH[1].look, 0.9); g.restore();
    g.beginPath(); g.moveTo(-18, -14); g.lineTo(6, -56); stroke(g, INK, 2.2); g.beginPath(); g.moveTo(-18, -14); g.lineTo(6, -56); stroke(g, '#c8945a', 1.2);
    g.beginPath(); g.moveTo(6, -56); g.quadraticCurveTo(12, -40, 10, -30); stroke(g, rgba('#ffffff', 0.8), 0.5);
  },
  smokehouse(g) {
    // log shack with a stone chimney and fish hanging under the eave
    planks(g, -34, -54, 60, 46, '#8a5a32');
    g.strokeStyle = rgba('#3a2010', 0.5); g.lineWidth = 1; for (let y = -50; y < -8; y += 6) { g.beginPath(); g.moveTo(-34, y); g.lineTo(26, y); g.stroke(); }
    g.beginPath(); g.moveTo(-42, -52); g.lineTo(-4, -80); g.lineTo(34, -52); g.lineTo(30, -48); g.lineTo(-4, -74); g.lineTo(-38, -48); g.closePath(); g.fillStyle = '#5a4a3a'; g.fill(); stroke(g, INK, 1);
    g.strokeStyle = rgba('#2a1a10', 0.5); g.lineWidth = 0.6; for (let i = 1; i < 6; i++) { g.beginPath(); g.moveTo(-40 + i * 6, -52 + i * -0.4); g.lineTo(-4, -78); g.stroke(); }
    stoneWall(g, 24, -96, 14, 60, '#9a948a');
    g.fillStyle = '#3a2a1a'; g.fillRect(-10, -36, 14, 28); g.strokeStyle = INK; g.lineWidth = 0.8; g.strokeRect(-10, -36, 14, 28);
    g.fillStyle = 'rgba(255,150,60,0.35)'; g.fillRect(-8, -16, 10, 8);
    // drying rack of fish
    g.beginPath(); g.moveTo(-38, -46); g.lineTo(-14, -46); stroke(g, '#5a3a22', 1.4);
    [-34, -27, -20].forEach((x, i) => { g.beginPath(); g.moveTo(x, -46); g.lineTo(x, -43); stroke(g, '#c8a878', 0.6); g.save(); g.translate(x, -36); g.rotate(Math.PI / 2); drawFish(g, { c: ['#c89040', '#c8784a', '#e0704a'][i], b: '#f0d0a0' }, 0.42); g.restore(); });
    for (let i = 0; i < 3; i++) { rrect(g, 28 - i * 2, -6 - i * 4, 16, 4, 2); g.fillStyle = '#7a5232'; g.fill(); stroke(g, INK, 0.6); ell(g, 44 - i * 2, -4 - i * 4, 1.8, 2, '#d8b080'); }
  },
  sushi(g) {
    // wooden counter under a noren curtain
    g.fillStyle = '#6a4228'; [-40, 36].forEach(x => { g.fillRect(x, -84, 5, 76); g.strokeStyle = INK; g.lineWidth = 0.8; g.strokeRect(x, -84, 5, 76); });
    planks(g, -46, -90, 92, 8, '#5a3a22', false);
    for (let i = 0; i < 5; i++) {
      const x = -38 + i * 15.2;
      rrect(g, x, -82, 14, 26, 1); g.fillStyle = '#2a3a6a'; g.fill(); stroke(g, INK, 0.7);
      if (i === 2) { g.save(); g.translate(x + 7, -70); g.scale(0.38, 0.38); g.translate(-15, -17); drawFish(g, { c: '#fbf8f0', b: '#fbf8f0' }, 0.9); g.restore(); }
    }
    planks(g, -42, -40, 84, 30, '#c8945a', false);
    planks(g, -46, -44, 92, 5, '#e8c890', false);
    // rice tub, cutting board, plated sushi
    ell(g, -28, -48, 9, 4, '#8a5a32', INK, 0.8); ell(g, -28, -49, 7, 2.6, '#fbf8f0');
    rrect(g, -10, -50, 22, 6, 1.5); g.fillStyle = '#e8c890'; g.fill(); stroke(g, INK, 0.7);
    g.save(); g.translate(1, -54); g.scale(0.45, 0.45); g.translate(-16, -18); ICON_DRAW_GOODS.sushi(g, { c: '#f08a5a' }); g.restore();
    g.save(); g.translate(28, -54); g.scale(0.4, 0.4); g.translate(-16, -18); ICON_DRAW_GOODS.sushi(g, { c: '#e8987a', roll: 1 }); g.restore();
    [-44, 44].forEach(x => { g.beginPath(); g.moveTo(x, -84); g.lineTo(x, -78); stroke(g, INK, 0.7); ell(g, x, -72, 3.6, 5.5, '#e8463a', INK, 0.7); });
  },
});
