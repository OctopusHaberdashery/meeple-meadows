// Meeple Meadows — art, part 5: produce-headed Meeples, more hats, pests and their hunters,
// ducks, bee flowers, candles, orchard trees and their sap, seeds and woodland goods.
'use strict';

// ---------------------------------------------------------------- Meeples with produce for heads
// The body sprite can leave the head off; the crop's own icon is drawn there instead.
const _meepleSprite4 = meepleSprite;
meepleSprite = function (col, S, frame = -1, headless = false) {
  if (!headless) return _meepleSprite4(col, S, frame);
  const _tp = meepleTorsoPath;
  meepleTorsoPath = g => { _tp(g, true); };
  try { return _meepleSprite4(col, S, frame); } finally { meepleTorsoPath = _tp; }
};
const _torso4 = meepleTorsoPath;
meepleTorsoPath = function (g, noHead) {
  if (!noHead) return _torso4(g);
  // the same body, with a short neck stub instead of the round head
  g.beginPath();
  g.moveTo(-2.2, -13.4); g.lineTo(-2, -15.2); g.lineTo(2, -15.2); g.lineTo(2.2, -13.4); g.closePath();
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
};
const HEAD_K = 0.46;     // produce icon scale for a head
// draw a crop icon as a Meeple's head, centred where the round head used to be
function drawProduceHead(ctx, crop, k = HEAD_K) {
  const ic = ART.icons[crop]; if (!ic) return;
  ctx.drawImage(ic.c, -(ic.ax + 16) * k, -17.6 - (ic.ay + 16) * k, ic.w * k, ic.h * k);
}

// ---------------------------------------------------------------- more hats
Object.assign(HAT_DRAW, {
  mushroom(g) {
    g.beginPath(); g.ellipse(0, -2.6, 6.6, 5.2, 0, Math.PI, 0); g.closePath(); g.fillStyle = lgrad(g, -6, -7, 6, -2, ['#f0584a', '#c8302a']); g.fill(); stroke(g, INK, 0.7);
    [[-3.4, -4.4, 1.2], [1, -6.2, 1.4], [4, -3.8, 1], [-0.8, -3.4, 0.8]].forEach(([x, y, r]) => ell(g, x, y, r, r * 0.85, '#fbf6ec'));
  },
  leaf(g) {
    g.save(); g.rotate(-0.35); leaf(g, -6.5, -4, 0.1, 13, 5, '#5aa335'); g.restore();
    g.beginPath(); g.moveTo(-5.4, -2); g.quadraticCurveTo(-8, -1, -7.6, 1.4); stroke(g, '#3a7a2a', 0.9);
  },
  beret(g) {
    g.save(); g.rotate(-0.2); ell(g, 0, -4.2, 6.6, 2.6, '#a8283a', INK, 0.7); ell(g, -1, -4.8, 4.4, 1.4, rgba('#ffffff', 0.15));
    g.beginPath(); g.moveTo(0, -6.6); g.lineTo(0.4, -8.2); stroke(g, '#701828', 1.2); g.restore();
  },
  halo(g) {
    g.save(); g.globalAlpha = 0.35; ell(g, 0, -9, 7.4, 2.6, '#fff6a0'); g.restore();
    g.beginPath(); g.ellipse(0, -9, 5.4, 1.8, 0, 0, Math.PI * 2); g.strokeStyle = INK; g.lineWidth = 2.2; g.stroke(); g.strokeStyle = '#f8d850'; g.lineWidth = 1.3; g.stroke();
  },
  cowboy(g) {
    g.beginPath(); g.moveTo(-8.4, -5.2); g.quadraticCurveTo(-7, -2.4, 0, -2.6); g.quadraticCurveTo(7, -2.4, 8.4, -5.2); g.quadraticCurveTo(6, -3.6, 0, -3.8); g.quadraticCurveTo(-6, -3.6, -8.4, -5.2); g.fillStyle = '#9a6a3a'; g.fill(); stroke(g, INK, 0.7);
    g.beginPath(); g.moveTo(-4, -3.6); g.quadraticCurveTo(-4.6, -9, -2, -8.6); g.quadraticCurveTo(0, -7.4, 2, -8.6); g.quadraticCurveTo(4.6, -9, 4, -3.6); g.closePath(); g.fillStyle = lgrad(g, -4, -9, 4, -3, ['#b8844a', '#8a5a2e']); g.fill(); stroke(g, INK, 0.7);
    g.fillStyle = '#4a2e16'; g.fillRect(-4, -5, 8, 1.1);
  },
  party(g) {
    g.save(); g.rotate(0.15);
    g.beginPath(); g.moveTo(-3.8, -3.4); g.lineTo(0, -12.6); g.lineTo(3.8, -3.4); g.closePath(); g.fillStyle = '#4a9ad8'; g.fill();
    g.save(); g.clip(); g.fillStyle = '#f2d23a'; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(-6, -4 - i * 2.6); g.lineTo(6, -6.4 - i * 2.6); g.lineTo(6, -5.2 - i * 2.6); g.lineTo(-6, -2.8 - i * 2.6); g.fill(); } g.restore();
    g.beginPath(); g.moveTo(-3.8, -3.4); g.lineTo(0, -12.6); g.lineTo(3.8, -3.4); g.closePath(); stroke(g, INK, 0.7);
    ell(g, 0, -12.8, 1.5, 1.5, '#e8463a', INK, 0.5); g.restore();
  },
  propeller(g) {
    g.beginPath(); g.ellipse(0, -1.6, 5.2, 5, 0, Math.PI, 0); g.closePath(); g.save(); g.clip();
    ['#e8463a', '#f2d23a', '#4a9ad8', '#5aa335'].forEach((c, i) => { g.fillStyle = c; g.beginPath(); g.moveTo(0, -1.6); g.arc(0, -1.6, 6, Math.PI + i * Math.PI / 4, Math.PI + (i + 1) * Math.PI / 4); g.fill(); });
    g.restore(); g.beginPath(); g.ellipse(0, -1.6, 5.2, 5, 0, Math.PI, 0); g.closePath(); stroke(g, INK, 0.7);
    g.beginPath(); g.moveTo(0, -6.6); g.lineTo(0, -8); stroke(g, INK, 0.9);
    ell(g, -3, -8.3, 3, 0.9, '#d8d8e0', INK, 0.5); ell(g, 3, -8.3, 3, 0.9, '#d8d8e0', INK, 0.5); ell(g, 0, -8.2, 0.8, 0.8, '#e8463a');
  },
  pirate(g) {
    g.beginPath(); g.moveTo(-7.6, -3.4); g.quadraticCurveTo(-5, -9, 0, -8.6); g.quadraticCurveTo(5, -9, 7.6, -3.4); g.quadraticCurveTo(0, -5.6, -7.6, -3.4); g.fillStyle = '#2a2430'; g.fill(); stroke(g, INK, 0.7);
    g.strokeStyle = '#c8a040'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(-7, -3.6); g.quadraticCurveTo(0, -5.8, 7, -3.6); g.stroke();
    ell(g, 0, -6.4, 1.3, 1.2, '#fbf8f0'); g.fillStyle = '#fbf8f0'; g.fillRect(-0.8, -5.4, 1.6, 0.8);
  },
  frog(g) {
    g.beginPath(); g.ellipse(0, -2, 5.8, 4.6, 0, Math.PI, 0); g.closePath(); g.fillStyle = lgrad(g, -5, -6, 5, -2, ['#7cc24a', '#4f9a30']); g.fill(); stroke(g, INK, 0.7);
    [-2.8, 2.8].forEach(x => { ell(g, x, -6.2, 2, 2, '#7cc24a', INK, 0.6); ell(g, x, -6.4, 1.3, 1.3, '#fbf8f0'); ell(g, x + 0.2, -6.3, 0.6, 0.7, '#1a1410'); });
    g.beginPath(); g.moveTo(-2.4, -3); g.quadraticCurveTo(0, -1.8, 2.4, -3); stroke(g, '#2a5a1a', 0.6);
  },
  viking(g) {
    g.beginPath(); g.ellipse(0, -2, 5.4, 5, 0, Math.PI, 0); g.closePath(); g.fillStyle = lgrad(g, -5, -6, 5, -2, ['#c8ccd0', '#8a9096']); g.fill(); stroke(g, INK, 0.7);
    g.fillStyle = '#a87838'; g.fillRect(-5.4, -2.8, 10.8, 1.4); g.fillRect(-0.7, -7, 1.4, 4.4);
    [-1, 1].forEach(sx => { g.beginPath(); g.moveTo(sx * 4.6, -3.6); g.quadraticCurveTo(sx * 9.6, -4.6, sx * 8.6, -10); g.quadraticCurveTo(sx * 7.6, -6.4, sx * 4.4, -5.6); g.closePath(); g.fillStyle = '#f4ecd8'; g.fill(); stroke(g, INK, 0.6); });
  },
  wizard(g) {
    ell(g, 0, -3.2, 7.4, 2, '#3a4aa8', INK, 0.7);
    g.beginPath(); g.moveTo(-4.4, -3.6); g.quadraticCurveTo(-1, -9, 0.6, -13.4); g.quadraticCurveTo(4, -13, 5.6, -11.6); g.quadraticCurveTo(2.6, -10.6, 2.2, -9); g.lineTo(4.4, -3.6); g.closePath();
    g.fillStyle = lgrad(g, -4, -12, 4, -3, ['#5a6ad8', '#2a3a98']); g.fill(); stroke(g, INK, 0.7);
    [[-1.4, -5.6], [1.4, -8.4], [2.6, -5]].forEach(([x, y]) => { g.beginPath(); for (let k = 0; k < 10; k++) { const r = k % 2 ? 0.45 : 1.1, a = k / 10 * Math.PI * 2 - Math.PI / 2; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.closePath(); g.fillStyle = '#f8d850'; g.fill(); });
  },
  bow(g) {
    [-1, 1].forEach(sx => { g.beginPath(); g.moveTo(0, -5.6); g.quadraticCurveTo(sx * 5, -10.4, sx * 6.6, -6.6); g.quadraticCurveTo(sx * 5.4, -3.2, 0, -5.6); g.fillStyle = '#f272a8'; g.fill(); stroke(g, INK, 0.7); });
    ell(g, 0, -5.6, 1.6, 1.6, '#e8508a', INK, 0.6);
  },
  bunny(g) {
    [-1, 1].forEach(sx => { g.save(); g.translate(sx * 2.2, -4); g.rotate(sx * 0.2); ell(g, 0, -5, 1.8, 5, '#fbf8f0', INK, 0.7); ell(g, 0, -5, 0.9, 3.8, '#f2b8c8'); g.restore(); });
    g.beginPath(); g.ellipse(0, -3.4, 4.8, 1.2, 0, Math.PI, 0); stroke(g, '#c8b8a8', 1.2);
  },
  fez(g) {
    g.beginPath(); g.moveTo(-3.8, -3.2); g.lineTo(-3, -9.6); g.lineTo(3, -9.6); g.lineTo(3.8, -3.2); g.closePath(); g.fillStyle = lgrad(g, -4, 0, 4, 0, ['#e8463a', '#a81c18']); g.fill(); stroke(g, INK, 0.7);
    ell(g, 0, -9.6, 3, 0.8, '#c82820', INK, 0.5);
    g.beginPath(); g.moveTo(0, -9.8); g.quadraticCurveTo(3, -9.4, 3.6, -5.4); stroke(g, '#1a1410', 0.8); ell(g, 3.6, -5, 0.8, 1.2, '#f2c23a');
  },
  hardhat(g) {
    ell(g, 0, -3, 6.8, 1.6, '#e8b020', INK, 0.7);
    g.beginPath(); g.ellipse(0, -3.4, 5, 4.4, 0, Math.PI, 0); g.closePath(); g.fillStyle = lgrad(g, -5, -7, 5, -3, ['#ffd860', '#e8a820']); g.fill(); stroke(g, INK, 0.7);
    g.fillStyle = '#f8c840'; g.fillRect(-0.9, -7.6, 1.8, 4.2);
  },
  grad(g) {
    rrect(g, -3.6, -5.2, 7.2, 2.6, 0.8); g.fillStyle = '#2a2430'; g.fill(); stroke(g, INK, 0.6);
    g.beginPath(); g.moveTo(0, -9.4); g.lineTo(7.4, -6.6); g.lineTo(0, -4.4); g.lineTo(-7.4, -6.6); g.closePath(); g.fillStyle = '#3a3440'; g.fill(); stroke(g, INK, 0.7);
    g.beginPath(); g.moveTo(0, -6.8); g.lineTo(5, -5.8); g.lineTo(5.2, -2.6); stroke(g, '#f2c23a', 0.7); ell(g, 5.2, -2.4, 0.7, 1, '#f2c23a');
  },
  bonnet(g) {
    g.beginPath(); g.ellipse(0, -1.4, 6.6, 5.8, 0, Math.PI * 1.05, Math.PI * 1.95); g.lineTo(5.2, -0.4); g.quadraticCurveTo(0, -4.4, -5.2, -0.4); g.closePath(); g.fillStyle = lgrad(g, -6, -7, 6, -1, ['#fbe0e8', '#f2b8c8']); g.fill(); stroke(g, INK, 0.7);
    g.beginPath(); g.ellipse(0, -1.8, 5, 3.6, 0, Math.PI * 1.1, Math.PI * 1.9); stroke(g, '#e88aa8', 1);
    ell(g, -4.8, 0.6, 1.1, 1.1, '#f272a8', INK, 0.4); ell(g, 4.8, 0.6, 1.1, 1.1, '#f272a8', INK, 0.4);
  },
  antenna(g) {
    g.beginPath(); g.ellipse(0, -2.6, 4.8, 2.8, 0, Math.PI, 0); stroke(g, '#2a2430', 1.2);
    [-1, 1].forEach(sx => { g.beginPath(); g.moveTo(sx * 2, -5); g.quadraticCurveTo(sx * 3, -9, sx * 4.6, -10); stroke(g, INK, 0.8); ell(g, sx * 4.8, -10.2, 1.5, 1.5, '#f2c23a', INK, 0.5); });
  },
  duckling(g) {
    ell(g, 0, -6, 4.4, 3.2, '#f8d850', INK, 0.7);
    ell(g, 2.4, -9.2, 2.6, 2.4, '#f8d850', INK, 0.7);
    g.beginPath(); g.moveTo(4.6, -9.4); g.lineTo(6.6, -8.8); g.lineTo(4.6, -8.2); g.closePath(); g.fillStyle = '#f2902a'; g.fill(); stroke(g, INK, 0.4);
    ell(g, 3, -9.8, 0.5, 0.5, '#1a1410'); ell(g, -1.4, -6.2, 2, 1.2, '#f0c030');
  },
  visor(g) {
    g.beginPath(); g.ellipse(0, -2.4, 4.8, 1.4, 0, Math.PI, 0); stroke(g, '#2a8a5a', 1.3);
    g.beginPath(); g.moveTo(1, -3.4); g.quadraticCurveTo(8, -3.6, 8.6, -1.6); g.quadraticCurveTo(5, -1, 1, -2); g.closePath(); g.fillStyle = rgba('#3aa86a', 0.9); g.fill(); stroke(g, INK, 0.6);
  },
  wreath(g) {
    for (let i = 0; i < 9; i++) { const a = Math.PI + i / 8 * Math.PI; leaf(g, Math.cos(a) * 5, -2.6 + Math.sin(a) * 2.6, a + 1.6, 3.4, 1.6, i % 2 ? '#2e7a3a' : '#3f8a44', false); }
    [[-2, -4.8], [0.4, -5.4], [2.6, -4.6]].forEach(([x, y]) => ell(g, x, y, 0.9, 0.9, '#d8282a', INK, 0.3));
  },
  nightcap(g) {
    g.beginPath(); g.moveTo(-5, -2.6); g.quadraticCurveTo(-4, -9, 2, -9.6); g.quadraticCurveTo(8, -9.6, 9, -3.4); g.quadraticCurveTo(6, -7, 3, -6.2); g.quadraticCurveTo(4, -4.4, 5, -2.6); g.closePath();
    g.fillStyle = '#6a8ad8'; g.fill(); g.save(); g.clip(); g.fillStyle = '#fbf8f0'; for (let i = -6; i < 10; i += 3) g.fillRect(i, -11, 1.3, 10); g.restore(); stroke(g, INK, 0.7);
    rrect(g, -5.4, -3.6, 10.8, 2, 1); g.fillStyle = '#fbf8f0'; g.fill(); stroke(g, INK, 0.5);
    ell(g, 9, -2.8, 1.6, 1.6, '#fbf8f0', INK, 0.5);
  },
});
HATS.forEach(h => { if (!UI_ICON['hat_' + h.id]) UI_ICON['hat_' + h.id] = g => { g.translate(16, 22); g.scale(2.2, 2.2); ell(g, 0, 0, 4.6, 4.6, '#d8c0a0', INK, 0.6); HAT_DRAW[h.id](g); }; });

// ---------------------------------------------------------------- pests and their hunters (drawn live)
function drawMouse(ctx, x, y, face, t, moving, eating) {
  ctx.save(); ctx.translate(x, y); ctx.scale(face, 1);
  ell(ctx, 0, 0.6, 4.6, 1.2, 'rgba(20,30,10,0.25)');
  const step = moving ? Math.sin(t * 30) * 1 : 0, nib = eating ? Math.abs(Math.sin(t * 12)) * 0.8 : 0;
  ctx.beginPath(); ctx.moveTo(-4, -1.6); ctx.quadraticCurveTo(-9, -1, -9, -4 + Math.sin(t * 6) * 1); ctx.strokeStyle = '#d8a0a0'; ctx.lineWidth = 0.7; ctx.stroke();
  ctx.fillStyle = '#d8a0a0'; ctx.fillRect(-2.6 + step, -0.8, 1, 1.2); ctx.fillRect(1.6 - step, -0.8, 1, 1.2);
  ctx.beginPath(); ctx.ellipse(0, -2.4, 4.4, 2.6, 0, 0, Math.PI * 2); ctx.fillStyle = '#a89c94'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 0.6; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(4.2, -2.8 + nib, 2.4, 1.8, 0.2, 0, Math.PI * 2); ctx.fillStyle = '#b0a49c'; ctx.fill(); ctx.stroke();
  ell(ctx, 3.4, -4.6 + nib, 1.4, 1.4, '#e8b8b8', INK, 0.5); ell(ctx, 6.4, -2.4 + nib, 0.6, 0.6, '#d87a8a'); ell(ctx, 4.8, -3.2 + nib, 0.4, 0.4, '#1a1410');
  ctx.restore();
}
function drawSquirrel(ctx, x, y, face, t, moving) {
  ctx.save(); ctx.translate(x, y); ctx.scale(face, 1);
  ell(ctx, 0, 0.6, 5, 1.4, 'rgba(20,30,10,0.25)');
  const hop = moving ? Math.abs(Math.sin(t * 14)) * 2.4 : 0, fl = Math.sin(t * 5) * 0.15;
  ctx.translate(0, -hop);
  ctx.save(); ctx.translate(-3, -3); ctx.rotate(fl);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-8, 0, -10, -10, -4, -12); ctx.bezierCurveTo(1, -13, 0, -7, -3, -6); ctx.bezierCurveTo(-5, -4, -2, -1, 1, -1); ctx.closePath();
  ctx.fillStyle = '#c8783a'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 0.6; ctx.stroke(); ctx.restore();
  ctx.beginPath(); ctx.ellipse(0.4, -3, 3.6, 2.8, -0.3, 0, Math.PI * 2); ctx.fillStyle = '#b8683a'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 0.6; ctx.stroke();
  ell(ctx, 1.4, -2.4, 1.6, 1.4, '#f2d8b0');
  ctx.beginPath(); ctx.ellipse(3.6, -5.6, 2.2, 1.8, 0, 0, Math.PI * 2); ctx.fillStyle = '#b8683a'; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(2.6, -7); ctx.lineTo(2.8, -9); ctx.lineTo(3.8, -7.2); ctx.fillStyle = '#a8582a'; ctx.fill();
  ell(ctx, 4.4, -6, 0.45, 0.45, '#1a1410'); ell(ctx, 5.7, -5.4, 0.45, 0.4, '#3a2010');
  ctx.restore();
}
function drawOwl(ctx, x, y, t, flying, face = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(face, 1);
  if (flying) {
    const f = Math.sin(t * 16);
    [-1, 1].forEach(s => { ctx.save(); ctx.rotate(s * (0.2 + f * 0.5)); ctx.beginPath(); ctx.ellipse(s * 7, -1, 7.5, 2.6, 0, 0, Math.PI * 2); ctx.fillStyle = '#c8a070'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 0.6; ctx.stroke(); ctx.restore(); });
  }
  ctx.beginPath(); ctx.ellipse(0, -3, 4.6, 6, 0, 0, Math.PI * 2); ctx.fillStyle = lgrad(ctx, 0, -9, 0, 3, ['#d8b080', '#c89a64']); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 0.7; ctx.stroke();
  ell(ctx, 0, -1, 3, 3.6, '#f4ecd8');
  if (!flying) [-1, 1].forEach(s => { ctx.beginPath(); ctx.ellipse(s * 4.2, -2, 1.8, 4.2, s * 0.2, 0, Math.PI * 2); ctx.fillStyle = '#b8905a'; ctx.fill(); ctx.stroke(); });
  ctx.beginPath(); ctx.moveTo(0, -4.4); ctx.bezierCurveTo(-5, -10.6, -5.6, -3, 0, -3.2); ctx.bezierCurveTo(5.6, -3, 5, -10.6, 0, -4.4); ctx.fillStyle = '#fbf8f0'; ctx.fill(); ctx.strokeStyle = rgba(INK, 0.7); ctx.lineWidth = 0.5; ctx.stroke();
  ell(ctx, -1.6, -6.4, 0.9, 0.9, '#1a1410'); ell(ctx, 1.6, -6.4, 0.9, 0.9, '#1a1410');
  ctx.beginPath(); ctx.moveTo(-0.6, -5.2); ctx.lineTo(0, -3.8); ctx.lineTo(0.6, -5.2); ctx.fillStyle = '#e8a040'; ctx.fill();
  ctx.restore();
}
function drawDog(ctx, x, y, face, t, mode) {
  ctx.save(); ctx.translate(x, y); ctx.scale(face, 1);
  ell(ctx, 0, 0.8, 8, 1.8, 'rgba(20,30,10,0.25)');
  const run = mode === 'run', lie = mode === 'lie', st = run ? Math.sin(t * 22) : 0, wag = Math.sin(t * (run ? 20 : 9)) * 0.5;
  ctx.strokeStyle = INK; ctx.lineWidth = 0.6;
  if (!lie) [[-5, st], [-3, -st], [3, st], [5, -st]].forEach(([lx, s]) => { ctx.fillStyle = '#b8844a'; ctx.save(); ctx.translate(lx, -4); ctx.rotate(s * 0.5); ctx.fillRect(-0.9, 0, 1.8, 4.6); ctx.strokeRect(-0.9, 0, 1.8, 4.6); ctx.restore(); });
  ctx.save(); ctx.translate(-6.5, lie ? -3 : -6.5); ctx.rotate(-0.8 + wag); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-2, -3, -1, -6); ctx.lineWidth = 1.8; ctx.strokeStyle = INK; ctx.stroke(); ctx.lineWidth = 1; ctx.strokeStyle = '#c8945a'; ctx.stroke(); ctx.restore();
  ctx.beginPath(); ctx.ellipse(0, lie ? -2.6 : -6, 7, lie ? 2.8 : 3.4, 0, 0, Math.PI * 2); ctx.fillStyle = '#c8945a'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 0.7; ctx.stroke();
  ell(ctx, 2.6, lie ? -2 : -5, 2.6, lie ? 1.6 : 2.2, '#fbf3df');
  const hy = lie ? -3.6 : -10;
  ctx.beginPath(); ctx.ellipse(6.6, hy, 3.4, 3, 0, 0, Math.PI * 2); ctx.fillStyle = '#c8945a'; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(9.4, hy + 1, 2, 1.5, 0, 0, Math.PI * 2); ctx.fillStyle = '#e8c898'; ctx.fill(); ctx.stroke();
  ell(ctx, 10.9, hy + 0.4, 0.8, 0.7, '#1a1410'); ell(ctx, 7.6, hy - 0.8, 0.5, 0.5, '#1a1410');
  ctx.save(); ctx.translate(5.4, hy - 1.6); ctx.rotate(run ? -0.6 : 0.3); ctx.beginPath(); ctx.ellipse(0, 2, 1.4, 3, 0, 0, Math.PI * 2); ctx.fillStyle = '#7a4e28'; ctx.fill(); ctx.stroke(); ctx.restore();
  ctx.restore();
}
function drawCat(ctx, x, y, face, t, mode) {
  ctx.save(); ctx.translate(x, y); ctx.scale(face, 1);
  ell(ctx, 0, 0.8, 6.4, 1.5, 'rgba(20,30,10,0.25)');
  const run = mode === 'run', sit = mode === 'sit', st = run ? Math.sin(t * 24) : 0;
  ctx.strokeStyle = INK; ctx.lineWidth = 0.6;
  if (!sit) [[-4, st], [-2.4, -st], [2.6, st], [4, -st]].forEach(([lx, s]) => { ctx.fillStyle = '#d8802a'; ctx.save(); ctx.translate(lx, -3.6); ctx.rotate(s * 0.5); ctx.fillRect(-0.7, 0, 1.4, 4); ctx.strokeRect(-0.7, 0, 1.4, 4); ctx.restore(); });
  ctx.beginPath(); ctx.moveTo(-5, sit ? -3 : -5.6); ctx.quadraticCurveTo(-10, -8 + Math.sin(t * 3) * 1.5, -7.6, -12); ctx.lineWidth = 2; ctx.strokeStyle = INK; ctx.stroke(); ctx.lineWidth = 1.2; ctx.strokeStyle = '#e8903a'; ctx.stroke();
  ctx.beginPath(); if (sit) ctx.ellipse(0, -4.6, 4, 4.6, 0, 0, Math.PI * 2); else ctx.ellipse(0, -5.4, 5.6, 2.8, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#e8903a'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 0.6; ctx.stroke();
  ctx.strokeStyle = rgba('#a8501a', 0.8); ctx.lineWidth = 0.7; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(i * 2, sit ? -8.4 : -7.8); ctx.lineTo(i * 2 - 0.6, sit ? -5.8 : -6.4); ctx.stroke(); }
  const hx = sit ? 1.6 : 5.4, hy = sit ? -10 : -8;
  ctx.beginPath(); ctx.arc(hx, hy, 2.8, 0, Math.PI * 2); ctx.fillStyle = '#e8903a'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 0.6; ctx.stroke();
  [[-1.8, -1], [1.4, 1]].forEach(([ox]) => { ctx.beginPath(); ctx.moveTo(hx + ox - 1, hy - 1.8); ctx.lineTo(hx + ox, hy - 4.4); ctx.lineTo(hx + ox + 1.2, hy - 2); ctx.closePath(); ctx.fillStyle = '#e8903a'; ctx.fill(); ctx.stroke(); });
  ell(ctx, hx + 1.2, hy - 0.4, 0.5, 0.6, '#3a5a1a'); ell(ctx, hx - 0.6, hy - 0.4, 0.5, 0.6, '#3a5a1a'); ell(ctx, hx + 0.4, hy + 0.8, 0.4, 0.3, '#e87a8a');
  ctx.restore();
}
function drawDuck(ctx, x, y, face, t, swim) {
  ctx.save(); ctx.translate(x, y); ctx.scale(face, 1);
  if (swim) { ctx.beginPath(); ctx.ellipse(0, 0, 7 + Math.sin(t * 2) * 0.6, 2, 0, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(230,250,255,0.6)'; ctx.lineWidth = 0.8; ctx.stroke(); }
  else { ell(ctx, 0, 0.6, 5, 1.2, 'rgba(20,30,10,0.25)'); const st = Math.sin(t * 10); ctx.fillStyle = '#f2902a'; ctx.fillRect(-1.4 + st, -2, 1.1, 2.4); ctx.fillRect(0.8 - st, -2, 1.1, 2.4); }
  const by = swim ? -1.6 : -4.4, bob = swim ? Math.sin(t * 2.4) * 0.5 : Math.sin(t * 10) * 0.4;
  ctx.beginPath(); ctx.moveTo(-6, by - 1 + bob); ctx.quadraticCurveTo(-7, by - 4 + bob, -4.4, by - 3 + bob); ctx.quadraticCurveTo(0, by - 4.6 + bob, 4, by - 2.6 + bob); ctx.quadraticCurveTo(5, by + 2 + bob, 0, by + 2 + bob); ctx.quadraticCurveTo(-5, by + 2 + bob, -6, by - 1 + bob);
  ctx.fillStyle = '#fbf8f0'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 0.6; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(-0.6, by - 1 + bob, 2.6, 1.2, 0.2, 0, Math.PI * 2); ctx.strokeStyle = rgba(INK, 0.4); ctx.lineWidth = 0.5; ctx.stroke();
  ctx.beginPath(); ctx.arc(3.6, by - 4.8 + bob, 2.1, 0, Math.PI * 2); ctx.fillStyle = '#fbf8f0'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 0.6; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(5.4, by - 5.2 + bob); ctx.quadraticCurveTo(7.8, by - 5 + bob, 7.4, by - 4 + bob); ctx.lineTo(5.4, by - 4 + bob); ctx.closePath(); ctx.fillStyle = '#f2902a'; ctx.fill(); ctx.stroke();
  ell(ctx, 4.2, by - 5.4 + bob, 0.45, 0.45, '#1a1410');
  ctx.restore();
}
function drawPollenBee(ctx, x, y, t, pollen) {
  drawBee(ctx, x, y, t);
  if (pollen) { ell(ctx, x - 1.2, y + 1.1, 0.8, 0.8, '#f8c020'); ell(ctx, x + 1.2, y + 1.1, 0.8, 0.8, '#f8c020'); }
}

// ---------------------------------------------------------------- flowers for bees
const FLOWER_LOOK = {
  clover: { petal: '#fbf6f8', mid: '#f2e0e8', tuft: true },
  marigold: { petal: '#f29a1a', mid: '#c8601a', ruffle: true },
  borage: { petal: '#5a7ae8', mid: '#2a2a4a', star: true },
  poppy: { petal: '#e8402a', mid: '#2a1a1a', cup: true },
};
function drawBloom(g, f, x, y, r) {
  const L = FLOWER_LOOK[f];
  if (L.tuft) { for (let i = 0; i < 10; i++) { const a = i / 10 * 6.28; ell(g, x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, r * 0.42, r * 0.42, i % 2 ? L.petal : L.mid, rgba(INK, 0.4), 0.3); } ell(g, x, y, r * 0.4, r * 0.4, L.petal); return; }
  if (L.star) { g.beginPath(); for (let i = 0; i < 10; i++) { const rr = i % 2 ? r * 0.35 : r, a = i / 10 * Math.PI * 2 - Math.PI / 2; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); g.fillStyle = L.petal; g.fill(); stroke(g, INK, 0.4); ell(g, x, y, r * 0.3, r * 0.3, L.mid); return; }
  const n = L.cup ? 4 : 8;
  for (let i = 0; i < n; i++) { const a = i / n * 6.28 + 0.4; ell(g, x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.5, r * (L.cup ? 0.62 : 0.48), r * (L.cup ? 0.55 : 0.4), shade(L.petal, (i % 2) * -0.12), rgba(INK, 0.45), 0.35); }
  ell(g, x, y, r * 0.3, r * 0.3, L.mid);
}
FLOWERS.forEach(f => {
  PLANT[f.id] = (g, p, ripe) => {
    for (let i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(i * 1.5, 0); g.quadraticCurveTo(i * 2.6, -7 * p, i * 3.6, -13 * p); stroke(g, '#4f8a30', 0.9); leaf(g, i * 1.8, -4 * p, -Math.PI / 2 + i * 0.9, 5 * p, 2.2 * p, f.leaf, false); }
    for (let i = -1; i <= 1; i++) { if (ripe) drawBloom(g, f.id, i * 3.6, -13 * p - (i ? 0 : 2), 3.4); else if (p > 0.5) ell(g, i * 3.6, -13 * p, 1.4, 1.9, shade(f.leaf, 0.2), INK, 0.4); }
  };
  ICON_DRAW[f.id] = g => {
    g.translate(16, 26);
    for (let i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(i * 2, 0); g.quadraticCurveTo(i * 3, -9, i * 6, -15); stroke(g, '#4f8a30', 1.3); leaf(g, i * 2.4, -5, -Math.PI / 2 + i * 1.1, 7, 3, f.leaf, false); }
    [[-6, -15, 5], [6, -15, 5], [0, -19, 6]].forEach(([x, y, r]) => drawBloom(g, f.id, x, y, r));
  };
});

// ---------------------------------------------------------------- icons: woodland and barnyard goods
const iconPail = (g, sap) => {
  g.beginPath(); g.moveTo(-9, -6); g.lineTo(-7, 10); g.lineTo(7, 10); g.lineTo(9, -6); g.closePath(); g.fillStyle = lgrad(g, -9, 0, 9, 0, ['#d8dce0', '#a8b0b8', '#7a8288']); g.fill(); stroke(g, INK, 0.9);
  ell(g, 0, -6, 9, 2.6, sap, INK, 0.7); ell(g, -3, -6.6, 3, 0.8, 'rgba(255,255,255,0.5)');
  g.beginPath(); g.arc(0, -6, 10, Math.PI * 1.1, Math.PI * 1.9); stroke(g, '#5a6068', 1);
};
Object.assign(ICON_DRAW, {
  beeswax(g) {
    g.translate(16, 18);
    g.beginPath(); g.moveTo(-11, -2); g.lineTo(-4, -9); g.lineTo(11, -9); g.lineTo(11, 3); g.lineTo(4, 10); g.lineTo(-11, 10); g.closePath(); g.fillStyle = '#e8c050'; g.fill(); stroke(g, INK, 0.9);
    g.beginPath(); g.moveTo(-11, -2); g.lineTo(4, -2); g.lineTo(11, -9); g.moveTo(4, -2); g.lineTo(4, 10); stroke(g, rgba(INK, 0.6), 0.7);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { const cx = -7 + i * 4.4 + (j % 2) * 2.2, cy = 1.6 + j * 3.8; g.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * 6.28; g.lineTo(cx + Math.cos(a) * 2, cy + Math.sin(a) * 2); } g.closePath(); g.fillStyle = '#f2d470'; g.fill(); stroke(g, '#b8902a', 0.5); }
  },
  duckeggs(g) {
    g.translate(16, 18);
    g.beginPath(); g.moveTo(-12, -2); g.lineTo(12, -2); g.lineTo(9, 9); g.lineTo(-9, 9); g.closePath(); g.fillStyle = '#c8a878'; g.fill(); stroke(g, INK, 0.9);
    [[-5, -5, '#d8eef0'], [1, -7, '#c8e4e8'], [6, -4, '#e4f2f2'], [-1, -3, '#bcdce0']].forEach(([x, y, c]) => { g.beginPath(); g.ellipse(x, y, 3.6, 4.6, 0, 0, Math.PI * 2); g.fillStyle = rgrad(g, x, y, 4.6, ['#ffffff', c, shade(c, -0.15)], x - 1.2, y - 1.6); g.fill(); stroke(g, INK, 0.7); });
    g.strokeStyle = '#8a6a3a'; g.lineWidth = 0.8; for (let y = 1; y < 9; y += 3) { g.beginPath(); g.moveTo(-11, y); g.lineTo(11, y); g.stroke(); }
  },
  feathers(g) {
    g.translate(16, 16);
    [[-3, 0.5, '#fbf8f0'], [3, -0.4, '#f0ece4'], [0, 0, '#ffffff']].forEach(([x, a, c]) => { g.save(); g.translate(x, 2); g.rotate(a); g.beginPath(); g.moveTo(0, 12); g.quadraticCurveTo(-5, 0, 0, -12); g.quadraticCurveTo(5, 0, 0, 12); g.fillStyle = c; g.fill(); stroke(g, INK, 0.7); g.beginPath(); g.moveTo(0, 13); g.lineTo(0, -11); stroke(g, '#c8b8a0', 0.6); g.restore(); });
  },
  acorns(g) {
    g.translate(16, 17);
    [[-5, 2, -0.3], [5, 3, 0.3], [0, -3, 0]].forEach(([x, y, a]) => { g.save(); g.translate(x, y); g.rotate(a); g.beginPath(); g.ellipse(0, 2, 4.4, 5.6, 0, 0, Math.PI * 2); g.fillStyle = rgrad(g, 0, 2, 6, ['#d8a060', '#b07838', '#8a5a28'], -1.4, 0); g.fill(); stroke(g, INK, 0.7); g.beginPath(); g.ellipse(0, -2, 5, 3, 0, Math.PI, 0); g.closePath(); g.fillStyle = '#7a5a32'; g.fill(); stroke(g, INK, 0.7); g.beginPath(); g.moveTo(0, -5); g.lineTo(0.6, -7); stroke(g, '#5a3a1a', 1.2); g.restore(); });
  },
  maplesap(g) { g.translate(16, 18); iconPail(g, '#e8b870'); leaf(g, 7, -12, -0.6, 7, 3.4, '#e8502a'); },
  birchsap(g) { g.translate(16, 18); iconPail(g, '#e8eef0'); g.fillStyle = '#ece6da'; g.fillRect(8, -16, 3, 12); g.fillStyle = '#2a2420'; g.fillRect(8, -12, 3, 1); },
  withies(g) {
    g.translate(16, 16);
    for (let i = 0; i < 7; i++) { g.beginPath(); g.moveTo(-12 + i, 11 - i * 0.4); g.quadraticCurveTo(0, -2 + i, 12 - i * 0.6, -11 + i); stroke(g, i % 2 ? '#9a7a4a' : '#b8945a', 1.6); }
    rrect(g, -3, -2, 5, 5, 1); g.fillStyle = '#d8463a'; g.fill(); stroke(g, INK, 0.6);
  },
  resin(g) {
    g.translate(16, 17);
    g.beginPath(); g.moveTo(-6, -10); g.quadraticCurveTo(-11, 4, -4, 10); g.quadraticCurveTo(4, 13, 9, 5); g.quadraticCurveTo(11, -4, 3, -6); g.quadraticCurveTo(0, -12, -6, -10);
    g.fillStyle = rgrad(g, -2, -2, 12, ['#ffe080', '#e8a020', '#b8681a'], -4, -5); g.fill(); stroke(g, INK, 0.9);
    ell(g, -3, -4, 2, 3, 'rgba(255,255,255,0.55)'); ell(g, 3, 3, 1.2, 0.9, '#6a3a10');
  },
});
TREES.forEach(t => {
  ICON_DRAW[t.seed] = g => {
    g.translate(16, 18);
    g.beginPath(); g.moveTo(-8, 1); g.lineTo(8, 1); g.lineTo(6, 11); g.lineTo(-6, 11); g.closePath(); g.fillStyle = lgrad(g, -8, 0, 8, 0, ['#d8784a', '#a84a2a']); g.fill(); stroke(g, INK, 0.9);
    ell(g, 0, 1, 8, 2.2, '#6a4528', INK, 0.6);
    g.beginPath(); g.moveTo(0, 1); g.lineTo(0, -8); stroke(g, '#6a4a2a', 1.4);
    const lc = { oak: '#5aa335', birch: '#8ccc5a', pine: '#2c6e4e', willow: '#9ad86a', maple: '#e8602a' }[t.kind];
    if (t.kind === 'pine') { for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(-5 + k, -2 - k * 4); g.lineTo(0, -8 - k * 4); g.lineTo(5 - k, -2 - k * 4); g.closePath(); g.fillStyle = lc; g.fill(); stroke(g, INK, 0.5); } }
    else { leaf(g, 0, -6, -2.4, 8, 3.6, lc); leaf(g, 0, -6, -0.7, 8, 3.6, shade(lc, 0.15)); if (t.kind === 'willow') leaf(g, 0, -8, -1.57, 7, 2.2, lc); }
  };
});
Object.assign(ICON_DRAW_GOODS, {
  pillow(g, o) {
    g.translate(16, 17);
    g.beginPath(); g.moveTo(-12, -8); g.quadraticCurveTo(0, -11, 12, -8); g.quadraticCurveTo(14, 0, 12, 8); g.quadraticCurveTo(0, 11, -12, 8); g.quadraticCurveTo(-14, 0, -12, -8);
    g.fillStyle = lgrad(g, -12, -8, 12, 8, ['#ffffff', o.c, '#d8d0c4']); g.fill(); stroke(g, INK, 0.9);
    g.strokeStyle = rgba('#8aa0c8', 0.7); g.lineWidth = 0.8; for (let i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(-10, i * 4); g.lineTo(10, i * 4); g.stroke(); }
    g.save(); g.translate(8, -9); g.rotate(0.6); g.beginPath(); g.moveTo(0, 6); g.quadraticCurveTo(-3, 0, 0, -6); g.quadraticCurveTo(3, 0, 0, 6); g.fillStyle = '#fbf8f0'; g.fill(); stroke(g, INK, 0.6); g.restore();
  },
  candle(g, o) {
    g.translate(16, 18);
    if (o.jar) {
      rrect(g, -8, -6, 16, 16, 3); g.fillStyle = rgba('#d8ecf4', 0.7); g.fill(); stroke(g, INK, 0.9);
      g.fillStyle = o.c; g.fillRect(-6.6, -1, 13.2, 9.6); ell(g, 0, -1, 6.6, 1.6, shade(o.c, 0.25));
      g.beginPath(); g.moveTo(0, -1); g.lineTo(0, -4); stroke(g, INK, 0.8);
      g.beginPath(); g.moveTo(0, -12); g.quadraticCurveTo(-2.4, -7, 0, -4.6); g.quadraticCurveTo(2.4, -7, 0, -12); g.fillStyle = '#ffb02a'; g.fill(); ell(g, 0, -6.4, 0.9, 1.4, '#fff2a0');
      ell(g, -5.4, 1, 0.9, 4, 'rgba(255,255,255,0.6)');
      return;
    }
    [[-5, 2, 18], [5, 4, 15]].forEach(([x, y, h]) => {
      rrect(g, x - 3, y - h + 8, 6, h, 1.4); g.fillStyle = lgrad(g, x - 3, 0, x + 3, 0, [shade(o.c, 0.3), o.c, shade(o.c, -0.2)]); g.fill(); stroke(g, INK, 0.8);
      g.beginPath(); g.moveTo(x, y - h + 8); g.lineTo(x, y - h + 5.6); stroke(g, INK, 0.7);
      g.beginPath(); g.moveTo(x, y - h); g.quadraticCurveTo(x - 2.2, y - h + 4, x, y - h + 6); g.quadraticCurveTo(x + 2.2, y - h + 4, x, y - h); g.fillStyle = '#ffb02a'; g.fill(); ell(g, x, y - h + 4, 0.8, 1.2, '#fff2a0');
    });
    ell(g, 0, 12, 12, 2.4, '#c8a878', INK, 0.7);
  },
  candy(g, o) {
    g.translate(16, 17);
    [[-6, -4, 0.3], [5, -5, -0.2], [0, 4, 0]].forEach(([x, y, a]) => { g.save(); g.translate(x, y); g.rotate(a); leaf(g, -6, 0, 0, 12, 7, o.c); g.restore(); });
    g.strokeStyle = rgba('#ffffff', 0.6); g.lineWidth = 0.8; g.beginPath(); g.moveTo(-9, -4); g.lineTo(-3, -4.5); g.stroke();
  },
  wbasket(g) {
    g.translate(16, 18);
    g.beginPath(); g.arc(0, -3, 10, Math.PI, 0); stroke(g, '#8a6a3a', 2.2);
    g.beginPath(); g.moveTo(-12, -3); g.lineTo(12, -3); g.lineTo(9, 10); g.lineTo(-9, 10); g.closePath(); g.fillStyle = '#c8a060'; g.fill(); stroke(g, INK, 0.9);
    g.strokeStyle = '#8a6a3a'; g.lineWidth = 0.9;
    for (let y = 0; y < 10; y += 2.6) { g.beginPath(); g.moveTo(-11.4 + y * 0.2, y); g.lineTo(11.4 - y * 0.2, y); g.stroke(); }
    for (let x = -9; x <= 9; x += 3) { g.beginPath(); g.moveTo(x, -3); g.lineTo(x * 0.8, 10); g.stroke(); }
  },
  aloaf(g) {
    g.translate(16, 18);
    g.beginPath(); g.ellipse(0, 0, 12, 8, 0, 0, Math.PI * 2); g.fillStyle = rgrad(g, 0, -2, 13, ['#c8905a', '#8a5a2e', '#5a3a1a'], -3, -4); g.fill(); stroke(g, INK, 0.9);
    g.strokeStyle = rgba('#f4e0c0', 0.8); g.lineWidth = 1; for (let i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(i * 5 - 2, -5); g.lineTo(i * 5 + 2, 3); g.stroke(); }
    g.save(); g.translate(8, -7); g.scale(0.5, 0.5); ICON_DRAW.acorns(g); g.restore();
  },
});
GOOD.acornbread.icon = { t: 'aloaf' };
const _bowl5 = iconBowl;
iconBowl = function (g, o) {
  _bowl5(g, o);
  if (o.noodle) { g.strokeStyle = '#f8e4a0'; g.lineWidth = 1.2; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(-8 + i * 4, -1); g.bezierCurveTo(-6 + i * 4, -4, -4 + i * 4, 1, -2 + i * 4, -2.5); g.stroke(); } }
};

// ---------------------------------------------------------------- buildings
Object.assign(BUILD_DRAW, {
  owlbox(g) {
    g.fillStyle = lgrad(g, -2.5, 0, 2.5, 0, ['#9a6a40', '#5a3a22']); g.fillRect(-2.5, -78, 5, 72); g.strokeStyle = INK; g.lineWidth = 0.8; g.strokeRect(-2.5, -78, 5, 72);
    planks(g, -12, -100, 24, 24, '#b07a42');
    g.beginPath(); g.moveTo(-15, -98); g.lineTo(0, -110); g.lineTo(15, -98); g.lineTo(13, -96); g.lineTo(0, -106); g.lineTo(-13, -96); g.closePath(); g.fillStyle = '#6a6a72'; g.fill(); stroke(g, INK, 0.9);
    g.beginPath(); g.moveTo(-12, -99); g.lineTo(0, -108); g.lineTo(12, -99); g.closePath(); g.fillStyle = '#a8703a'; g.fill();
    g.beginPath(); g.arc(0, -88, 4.6, 0, Math.PI * 2); g.fillStyle = '#1e140c'; g.fill(); stroke(g, INK, 0.7);
    g.fillStyle = '#7a4e28'; g.fillRect(-1, -81, 2, 3); g.fillRect(-6, -80, 12, 1.6);
    g.beginPath(); g.moveTo(-6, -10); g.lineTo(-2.5, -18); g.moveTo(6, -10); g.lineTo(2.5, -18); stroke(g, '#5a3a22', 1.4);
  },
  doghouse(g) {
    planks(g, -18, -34, 36, 26, '#c8603a');
    g.beginPath(); g.moveTo(-18, -34); g.lineTo(0, -48); g.lineTo(18, -34); g.closePath(); g.save(); g.clip(); planks(g, -18, -50, 36, 18, '#b8502e'); g.restore();
    g.beginPath(); g.moveTo(-23, -32); g.lineTo(0, -52); g.lineTo(23, -32); g.lineTo(20, -30); g.lineTo(0, -47); g.lineTo(-20, -30); g.closePath(); g.fillStyle = '#4a5a7a'; g.fill(); stroke(g, INK, 1);
    g.beginPath(); g.moveTo(-8, -8); g.lineTo(-8, -22); g.arc(0, -22, 8, Math.PI, 0); g.lineTo(8, -8); g.closePath(); g.fillStyle = '#2a1a10'; g.fill(); stroke(g, INK, 0.8);
    rrect(g, -7, -42, 14, 5, 1.5); g.fillStyle = '#f4e8c8'; g.fill(); stroke(g, INK, 0.6);
    g.fillStyle = '#6a3a1a'; g.font = 'bold 4px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('WOOF', 0, -39.4);
    ell(g, 22, -6, 5, 2, '#5a8ad8', INK, 0.6); ell(g, 22, -7, 3.6, 1, '#c8945a');
    g.save(); g.translate(-20, -4); g.rotate(-0.3); g.fillStyle = '#fbf8f0'; g.fillRect(-4, -1, 8, 2); [[-4, 0], [4, 0]].forEach(([x]) => { ell(g, x, -1.4, 1.6, 1.6, '#fbf8f0', INK, 0.4); ell(g, x, 1.4, 1.6, 1.6, '#fbf8f0', INK, 0.4); }); g.strokeStyle = INK; g.lineWidth = 0.4; g.strokeRect(-4, -1, 8, 2); g.restore();
  },
  cattree(g) {
    ell(g, 0, -6, 14, 4, '#c8b08a', INK, 0.8);
    [[-2, -60, 4, 54], [8, -36, 3.4, 30]].forEach(([x, y, w, h]) => { g.fillStyle = '#d8c090'; g.fillRect(x - w / 2, y, w, h); g.strokeStyle = rgba('#8a6a3a', 0.7); g.lineWidth = 0.5; for (let yy = y + 1; yy < y + h; yy += 1.6) { g.beginPath(); g.moveTo(x - w / 2, yy); g.lineTo(x + w / 2, yy + 0.8); g.stroke(); } g.strokeStyle = INK; g.lineWidth = 0.7; g.strokeRect(x - w / 2, y, w, h); });
    rrect(g, -1, -40, 18, 5, 2); g.fillStyle = '#a8703a'; g.fill(); stroke(g, INK, 0.8);
    g.beginPath(); g.ellipse(-2, -62, 13, 5, 0, 0, Math.PI * 2); g.fillStyle = '#a8703a'; g.fill(); stroke(g, INK, 0.8);
    g.beginPath(); g.ellipse(-2, -64, 10.6, 3.6, 0, 0, Math.PI * 2); g.fillStyle = '#d86a8a'; g.fill(); stroke(g, INK, 0.6);
    g.beginPath(); g.moveTo(14, -36); g.lineTo(14, -26); stroke(g, '#5a3a22', 0.6); ell(g, 14, -24, 2.4, 2.4, '#e8463a', INK, 0.5);
  },
  duckhouse(g) {
    g.fillStyle = '#6a4228'; [-14, 11].forEach(x => { g.fillRect(x, -16, 3, 12); g.strokeStyle = INK; g.lineWidth = 0.7; g.strokeRect(x, -16, 3, 12); });
    planks(g, -18, -18, 36, 4, '#a8743e', true);
    g.beginPath(); g.moveTo(-16, -18); g.lineTo(0, -46); g.lineTo(16, -18); g.closePath(); g.save(); g.clip(); planks(g, -16, -48, 32, 32, '#8ab8d0'); g.restore();
    g.beginPath(); g.moveTo(-20, -16); g.lineTo(0, -50); g.lineTo(20, -16); g.lineTo(16, -16); g.lineTo(0, -44); g.lineTo(-16, -16); g.closePath(); g.fillStyle = '#e8c070'; g.fill(); stroke(g, INK, 0.9);
    g.beginPath(); g.arc(0, -24, 5, Math.PI, 0); g.lineTo(5, -18); g.lineTo(-5, -18); g.closePath(); g.fillStyle = '#2a1a10'; g.fill(); stroke(g, INK, 0.7);
    g.save(); g.translate(14, -16); g.rotate(-0.7); planks(g, 0, -3, 22, 5, '#a8743e', true); g.restore();
    g.beginPath(); g.arc(0, -34, 2.6, 0, Math.PI * 2); g.fillStyle = '#fbf8f0'; g.fill(); stroke(g, INK, 0.5);
  },
  chandlery(g) {
    stoneWall(g, -40, -22, 80, 12, '#a8a294');
    g.fillStyle = '#f2e6cc'; g.fillRect(-38, -70, 76, 48); g.strokeStyle = INK; g.lineWidth = 1; g.strokeRect(-38, -70, 76, 48);
    g.strokeStyle = '#6a4228'; g.lineWidth = 2.4; [[-38, -46, 38, -46], [-14, -70, -14, -22], [14, -70, 14, -22], [-38, -70, -14, -46], [38, -70, 14, -46]].forEach(([a, b, c, d]) => { g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.stroke(); });
    g.beginPath(); g.moveTo(-46, -66); g.lineTo(0, -98); g.lineTo(46, -66); g.lineTo(40, -64); g.lineTo(0, -92); g.lineTo(-40, -64); g.closePath(); g.fillStyle = '#8a4a3a'; g.fill(); stroke(g, INK, 1);
    g.beginPath(); g.moveTo(-40, -66); g.lineTo(0, -92); g.lineTo(40, -66); g.closePath(); g.fillStyle = '#e8d8b8'; g.fill(); stroke(g, INK, 0.7);
    g.fillStyle = '#3a2a1a'; g.fillRect(-9, -44, 18, 22); g.strokeStyle = INK; g.lineWidth = 0.8; g.strokeRect(-9, -44, 18, 22);
    rrect(g, -34, -42, 16, 14, 1.5); g.fillStyle = '#3a2e2a'; g.fill(); stroke(g, INK, 0.8);
    [-30, -26, -22].forEach((x, i) => { g.fillStyle = ['#f4e0a0', '#c8a8e8', '#a8c890'][i]; g.fillRect(x - 1.2, -36, 2.4, 8); ell(g, x, -37.6, 0.9, 1.4, '#ffb02a'); });
    // candles hanging to dry from a rack
    g.beginPath(); g.moveTo(20, -42); g.lineTo(36, -42); stroke(g, '#6a4228', 1.6);
    [23, 27, 31, 35].forEach((x, i) => { g.beginPath(); g.moveTo(x, -42); g.lineTo(x, -39); stroke(g, INK, 0.5); g.fillStyle = i % 2 ? '#f4e0a0' : '#f8ecc0'; g.fillRect(x - 1, -39, 2, 12); });
    rrect(g, -10, -86, 20, 10, 2); g.fillStyle = '#f4e8c8'; g.fill(); stroke(g, INK, 0.8);
    g.fillStyle = '#f4e0a0'; g.fillRect(-1.4, -84, 2.8, 6); ell(g, 0, -85, 1, 1.4, '#ffb02a');
    g.save(); g.translate(-40, -2); g.scale(0.5, 0.5); g.translate(-16, -18); ICON_DRAW.beeswax(g); g.restore();
  },
});
// orchard trees: oak, birch and pine reuse the woodland trees; maple and willow are drawn here
function orchardSprite(type) {
  const key = 'orch_' + type;
  if (ART.sprites[key]) return ART.sprites[key];
  const kind = TREES.find(t => t.id === type).kind;
  let s;
  if (kind === 'oak' || kind === 'birch' || kind === 'pine') s = treeSprite(kind, 0, 1);
  else if (kind === 'maple') {
    const r = mulberry(4401);
    s = makeSprite(80, 98, 40, 94, g => {
      g.beginPath(); g.moveTo(-5, 0); g.quadraticCurveTo(-3, -18, -4, -36); g.lineTo(4, -36); g.quadraticCurveTo(3, -18, 6, 0); g.closePath();
      g.fillStyle = lgrad(g, -5, 0, 6, 0, ['#8a6a52', '#6a4a36', '#4a3022']); g.fill(); stroke(g, INK, 0.9);
      const cols = ['#5a9a3a', '#4a8a30', '#6aaa42', '#d8602a', '#e8902a'];
      const puffs = []; for (let i = 0; i < 12; i++) { const a = r() * 6.28, d = r() * 16; puffs.push([Math.cos(a) * d * 1.3, -58 + Math.sin(a) * d * 0.85, 12 + r() * 6]); }
      puffs.sort((a, b) => a[1] - b[1]);
      puffs.forEach(([x, y, rr]) => blob(g, x + 1, y + 3, rr, '#2e5a22', 0, -0.2));
      puffs.forEach(([x, y, rr], i) => blob(g, x, y, rr, cols[i % 3], 0.28, -0.32));
      // little five-pointed maple leaves, a few of them already turning red
      for (let i = 0; i < 26; i++) {
        const a = r() * 6.28, d = r() * 24, x = Math.cos(a) * d * 1.25, y = -58 + Math.sin(a) * d * 0.8, c = i % 5 === 0 ? cols[3 + (i % 2)] : shade(cols[i % 3], 0.2);
        g.save(); g.translate(x, y); g.rotate(r() * 6.28); g.beginPath();
        for (let k = 0; k < 10; k++) { const rr = k % 2 ? 1.2 : 3, an = k / 10 * Math.PI * 2; g.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); }
        g.closePath(); g.fillStyle = c; g.fill(); g.restore();
      }
    }, { edge: 1.5 });
  } else {
    const r = mulberry(5501);
    s = makeSprite(86, 98, 43, 94, g => {
      g.beginPath(); g.moveTo(-6, 0); g.quadraticCurveTo(-2, -22, -6, -44); g.lineTo(5, -44); g.quadraticCurveTo(2, -22, 7, 0); g.closePath();
      g.fillStyle = lgrad(g, -6, 0, 7, 0, ['#8a7a5a', '#6a5a3e', '#4a3e2a']); g.fill(); stroke(g, INK, 0.9);
      blob(g, 0, -62, 22, '#7ab84a', 0.3, -0.3); blob(g, -12, -56, 14, '#6aa83e', 0.3, -0.3); blob(g, 12, -56, 14, '#6aa83e', 0.3, -0.3);
      // long drooping fronds
      for (let i = 0; i < 34; i++) {
        const x = -30 + r() * 60, y0 = -70 + r() * 20, len = 26 + r() * 22, sw = (r() - 0.5) * 6;
        g.beginPath(); g.moveTo(x * 0.8, y0); g.quadraticCurveTo(x + sw, y0 + len * 0.5, x + sw * 1.5, y0 + len);
        g.strokeStyle = i % 3 ? '#8ccc5a' : '#5a9a3a'; g.lineWidth = 2.4; g.stroke();
        for (let k = 1; k < 5; k++) ell(g, x + sw * (k / 4) * 1.2, y0 + len * k / 5, 1.2, 2.2, i % 2 ? '#a8dc6a' : '#7cbc4a');
      }
    }, { edge: 1.5 });
  }
  ART.sprites[key] = s;
  return s;
}
const _bSprite5 = buildingSprite;
buildingSprite = function (type) { return BUILDINGS[type] && BUILDINGS[type].tree ? orchardSprite(type) : _bSprite5(type); };
;(window.__stage = window.__stage || []).push('art5.js loaded');
