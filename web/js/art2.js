// Meeple Meadows — art, part 2: newer crops, goods, buildings, bushes and seasonal trees.
'use strict';

// ---------------------------------------------------------------- new crop icons
Object.assign(ICON_DRAW, {
  parsnip(g) {
    g.translate(16, 16); g.rotate(-0.5);
    for (let i = -1; i <= 1; i++) leaf(g, i * 2, -9, -Math.PI / 2 + i * 0.5, 9, 3, '#6aa84a');
    g.beginPath(); g.moveTo(-6, -8.5); g.quadraticCurveTo(-5, 3, 0, 14); g.quadraticCurveTo(5, 3, 6, -8.5); g.quadraticCurveTo(0, -11, -6, -8.5);
    g.fillStyle = lgrad(g, -6, 0, 6, 0, ['#fff8e0', '#efe0b0', '#c8b07a']); g.fill(); stroke(g, INK, 0.9);
    g.strokeStyle = rgba('#a08a5a', 0.7); g.lineWidth = 0.6;
    [[-4, -4, 1], [0, 0, 4], [-3, 4, 0], [0, 8, 2]].forEach(([a, b, c]) => { g.beginPath(); g.moveTo(a, b); g.lineTo(c, b + 0.5); g.stroke(); });
  },
  lettuce(g) {
    g.translate(16, 18);
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * Math.PI * 2;
      g.save(); g.rotate(a); g.beginPath(); g.moveTo(0, 0);
      g.bezierCurveTo(-7, -4, -6, -13, 0, -13); g.bezierCurveTo(6, -13, 7, -4, 0, 0);
      g.fillStyle = lgrad(g, 0, 0, 0, -13, ['#7cc04a', '#b8e070', '#e0f4a8']); g.fill(); stroke(g, shade('#7cc04a', -0.45), 0.6);
      g.beginPath(); g.moveTo(0, -1); g.lineTo(0, -11); stroke(g, rgba('#f4ffd8', 0.8), 0.5); g.restore();
    }
    blob(g, 0, -1, 5, '#d8f094', 0.3, -0.1); stroke(g, shade('#7cc04a', -0.4), 0.6);
  },
  tomato(g) {
    g.translate(16, 17);
    g.beginPath(); g.ellipse(0, 0, 12, 10.5, 0, 0, Math.PI * 2);
    g.fillStyle = rgrad(g, 0, 0, 13, ['#ff8a70', '#e23a2a', '#8a1a10'], -4, -4); g.fill(); stroke(g, INK, 0.9);
    g.beginPath(); g.moveTo(-4, -9); g.quadraticCurveTo(-6, 0, -3, 8); stroke(g, rgba('#7a1008', 0.4), 0.8);
    g.beginPath(); g.moveTo(4, -9); g.quadraticCurveTo(6, 0, 3, 8); stroke(g, rgba('#7a1008', 0.4), 0.8);
    ell(g, -5, -4, 2.4, 1.6, rgba('#ffffff', 0.5));
    for (let i = 0; i < 5; i++) leaf(g, 0, -9, -Math.PI / 2 + (i - 2) * 0.9, 5.5, 1.8, '#4a9a3a', false);
    g.beginPath(); g.moveTo(0, -9); g.lineTo(0.5, -13); stroke(g, '#3a7a2a', 1.4);
  },
  cucumber(g) {
    g.translate(16, 16); g.rotate(-0.6);
    rrect(g, -5, -13, 10, 26, 5); g.fillStyle = lgrad(g, -5, 0, 5, 0, ['#8ac860', '#4a9a30', '#2a6a1a']); g.fill(); stroke(g, INK, 0.9);
    g.strokeStyle = rgba('#c8f0a0', 0.6); g.lineWidth = 0.8; g.beginPath(); g.moveTo(-2, -10); g.lineTo(-2, 10); g.stroke();
    for (let i = 0; i < 9; i++) ell(g, (i % 3 - 1) * 2.6, -10 + i * 2.5, 0.6, 0.6, '#e8f8c8');
    ell(g, 0, -13, 2, 1.2, '#6a8a3a', INK, 0.5);
  },
  sunflower(g) {
    g.translate(16, 16);
    for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; g.save(); g.rotate(a); g.beginPath(); g.ellipse(0, -9.5, 2.4, 5.2, 0, 0, Math.PI * 2); g.fillStyle = i % 2 ? '#f6c81a' : '#ffd84a'; g.fill(); stroke(g, shade('#f6c81a', -0.5), 0.5); g.restore(); }
    blob(g, 0, 0, 6.5, '#6a3a1a', 0.3, -0.3); stroke(g, INK, 0.8);
    for (let i = 0; i < 14; i++) { const a = i * 2.4, r = Math.sqrt(i) * 1.5; ell(g, Math.cos(a) * r, Math.sin(a) * r, 0.6, 0.6, '#b8803a'); }
  },
  kale(g) {
    g.translate(16, 20);
    for (let i = -2; i <= 2; i++) {
      g.save(); g.rotate(i * 0.38);
      g.beginPath(); g.moveTo(0, 2);
      for (let k = 0; k <= 8; k++) { const y = -k * 2, w = Math.sin(k / 8 * Math.PI) * 5.5 + 1; g.lineTo(-w - (k % 2) * 1.6, y); }
      for (let k = 8; k >= 0; k--) { const y = -k * 2, w = Math.sin(k / 8 * Math.PI) * 5.5 + 1; g.lineTo(w + (k % 2) * 1.6, y); }
      g.closePath(); g.fillStyle = lgrad(g, -6, 0, 6, 0, ['#5a9a6a', '#3f7a4a', '#2a5a35']); g.fill(); stroke(g, shade('#3f7a4a', -0.5), 0.6);
      g.beginPath(); g.moveTo(0, 2); g.lineTo(0, -15); stroke(g, '#8ac0a0', 0.7);
      g.restore();
    }
  },
  cotton(g) {
    g.translate(16, 17);
    for (let i = 0; i < 4; i++) leaf(g, 0, 6, Math.PI / 2 + (i - 1.5) * 0.7, 7, 2.6, '#7a5a30', false);
    [[-5, -1, 6], [5, -1, 6], [0, -6, 6.5], [0, 2, 5.5]].forEach(([x, y, r]) => { blob(g, x, y, r, '#fbf8f0', 0.2, -0.12); stroke(g, rgba(INK, 0.55), 0.6); });
    g.beginPath(); g.moveTo(-3, -3); g.quadraticCurveTo(0, -1, 3, -3); stroke(g, rgba('#c8c0b0', 0.8), 0.6);
  },
  tea(g) {
    g.translate(16, 18);
    g.beginPath(); g.moveTo(0, 12); g.quadraticCurveTo(1, 0, 0, -12); stroke(g, '#6a5a2a', 1.3);
    [[-1, 6, -2.5], [1, 3, -0.6], [-1, -1, -2.6], [1, -4, -0.5], [0, -9, -1.57]].forEach(([x, y, a], i) => leaf(g, x, y, a, i === 4 ? 6 : 10, i === 4 ? 2 : 3.6, i === 4 ? '#9ad86a' : '#3f8a3a'));
  },
  flax(g) {
    g.translate(16, 18);
    [[-5, -2], [0, -9], [5, -4]].forEach(([x, y], i) => {
      g.beginPath(); g.moveTo(i - 1, 13); g.quadraticCurveTo(x * 0.5, 4, x, y); stroke(g, '#7aa04a', 1);
      for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2 - 0.3; g.beginPath(); g.ellipse(x + Math.cos(a) * 2.6, y + Math.sin(a) * 2.6, 2.4, 1.6, a, 0, Math.PI * 2); g.fillStyle = '#6a8ad8'; g.fill(); stroke(g, shade('#6a8ad8', -0.5), 0.4); }
      ell(g, x, y, 1, 1, '#f2e06a');
    });
  },
  cranberry(g) {
    g.translate(16, 17);
    leaf(g, 0, -8, -0.4, 7, 2.2, '#5a7a3a'); leaf(g, 0, -8, -2.6, 7, 2.2, '#5a7a3a');
    [[-6, 2], [0, -2], [6, 2], [-3, 7], [3, 7], [0, 3], [-7, -3], [7, -3]].forEach(([x, y]) => { blob(g, x, y, 3.5, '#c8203a', 0.4, -0.35); stroke(g, INK, 0.6); ell(g, x - 1, y - 1.2, 0.9, 0.6, rgba('#ffffff', 0.55)); });
  },
  rice(g) {
    g.translate(16, 18);
    g.beginPath(); g.moveTo(-2, 13); g.quadraticCurveTo(-2, -6, 6, -12); stroke(g, '#9a9a40', 1.2);
    for (let k = 0; k < 9; k++) {
      const t = k / 8, x = -2 + t * 8 + Math.sin(t * 3) * 1.5, y = -4 - t * 8;
      ell(g, x + 2.4, y + 2.5, 1.3, 2.2, '#efe3a8', shade('#e8dca0', -0.45), 0.5);
      ell(g, x - 1, y + 3, 1.3, 2.2, '#e8d890', shade('#e8dca0', -0.45), 0.5);
    }
    leaf(g, -2, 8, -2.4, 10, 1.8, '#6aaa4a');
  },
  olive(g) {
    g.translate(16, 16);
    g.beginPath(); g.moveTo(-12, 8); g.quadraticCurveTo(0, 2, 12, -10); stroke(g, '#7a5a3a', 1.4);
    for (let i = 0; i < 6; i++) { const t = i / 5, x = -10 + t * 20, y = 7 - t * 16; leaf(g, x, y, (i % 2 ? -1.9 : 0.6) - t * 0.4, 8, 1.8, '#8aa080'); }
    [[-3, 6, '#6a7a2a'], [3, 1, '#7a8a3a'], [-1, -4, '#4a3a4a']].forEach(([x, y, c]) => { g.beginPath(); g.ellipse(x, y, 2.8, 3.8, 0.4, 0, Math.PI * 2); g.fillStyle = rgrad(g, x, y, 4, [shade(c, 0.4), c, shade(c, -0.3)], x - 1, y - 1.5); g.fill(); stroke(g, INK, 0.6); });
  },
  lavender(g) {
    g.translate(16, 18);
    [[-5, -0.25], [0, 0], [5, 0.25]].forEach(([x, a]) => {
      g.save(); g.translate(x * 0.4, 12); g.rotate(a);
      g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -16); stroke(g, '#7a9a7a', 1);
      for (let k = 0; k < 7; k++) { ell(g, -1.4, -14 - k * 1.8 + 6, 1.4, 1.3, '#9a7ad8'); ell(g, 1.4, -14.8 - k * 1.8 + 6, 1.4, 1.3, '#b096e4'); }
      ell(g, 0, -22, 1.2, 1.4, '#7a5ab8');
      g.restore();
    });
    leaf(g, 0, 11, -2.6, 7, 1.4, '#8aa88a', false); leaf(g, 0, 11, -0.5, 7, 1.4, '#8aa88a', false);
  },
  melon(g) {
    g.translate(16, 17);
    g.beginPath(); g.ellipse(0, 0, 12.5, 10.5, 0, 0, Math.PI * 2);
    g.fillStyle = rgrad(g, 0, 0, 13, ['#b8e890', '#6ab04a', '#2a6a2a'], -4, -4); g.fill();
    g.save(); g.clip(); g.strokeStyle = '#2f6a2a'; g.lineWidth = 2;
    for (let i = -3; i <= 3; i++) { g.beginPath(); g.ellipse(i * 3.4, 0, 1.2 + Math.abs(i) * 0.4, 11, 0, 0, Math.PI * 2); g.stroke(); }
    g.restore();
    g.beginPath(); g.ellipse(0, 0, 12.5, 10.5, 0, 0, Math.PI * 2); stroke(g, INK, 0.9);
    ell(g, -5, -4, 2.6, 1.6, rgba('#ffffff', 0.4));
    g.beginPath(); g.moveTo(0, -10); g.quadraticCurveTo(2, -14, 5, -13); stroke(g, '#5a7a2a', 1.4);
  },
  peach(g) {
    g.translate(16, 17);
    g.beginPath(); g.moveTo(0, -9); g.bezierCurveTo(9, -12, 13, 0, 9, 6); g.bezierCurveTo(6, 11, -6, 11, -9, 6); g.bezierCurveTo(-13, 0, -9, -12, 0, -9);
    g.fillStyle = rgrad(g, 2, 2, 14, ['#ffd8a8', '#f8a070', '#d84a3a'], -3, -2); g.fill(); stroke(g, INK, 0.9);
    g.beginPath(); g.moveTo(0, -8); g.quadraticCurveTo(-3, 1, 0, 10); stroke(g, rgba('#b84a2a', 0.5), 0.9);
    ell(g, -5, -3, 2, 2.6, rgba('#ffffff', 0.35));
    leaf(g, 0, -9, -0.6, 8, 3, '#4b9a3c');
  },
  cocoa(g) {
    g.translate(16, 16); g.rotate(0.45);
    g.beginPath(); g.moveTo(0, -14); g.bezierCurveTo(8, -10, 8, 9, 0, 14); g.bezierCurveTo(-8, 9, -8, -10, 0, -14);
    g.fillStyle = lgrad(g, -7, 0, 7, 0, ['#e8a050', '#b8602a', '#6a2a12']); g.fill(); stroke(g, INK, 0.9);
    g.strokeStyle = rgba('#5a2010', 0.6); g.lineWidth = 0.8;
    for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(i * 2.2, -12 + Math.abs(i)); g.quadraticCurveTo(i * 3.6, 0, i * 2.2, 12 - Math.abs(i)); g.stroke(); }
    g.beginPath(); g.moveTo(0, -14); g.lineTo(0, -17); stroke(g, '#5a4a2a', 1.6);
  },
});

// ---------------------------------------------------------------- new goods icons
function iconBar(g, o) {
  g.translate(16, 16); g.rotate(-0.25);
  rrect(g, -9, -12, 18, 24, 2); g.fillStyle = lgrad(g, -9, 0, 9, 0, [shade(o.c, 0.25), o.c, shade(o.c, -0.3)]); g.fill(); stroke(g, INK, 0.9);
  g.strokeStyle = rgba(shade(o.c, -0.5), 0.8); g.lineWidth = 0.8;
  for (let x = -3; x <= 3; x += 6) { g.beginPath(); g.moveTo(x, -12); g.lineTo(x, 2); g.stroke(); }
  for (let y = -7; y <= 2; y += 4.5) { g.beginPath(); g.moveTo(-9, y); g.lineTo(9, y); g.stroke(); }
  g.beginPath(); g.moveTo(-9, 2); g.lineTo(9, 0); g.lineTo(9, 12); g.lineTo(-9, 12); g.closePath(); g.fillStyle = '#c8302a'; g.fill(); stroke(g, INK, 0.8);
  g.fillStyle = '#f2c23a'; g.fillRect(-9, 6, 18, 1.6);
}
function iconLoaf(g) {
  g.translate(16, 18);
  g.beginPath(); g.moveTo(-13, 6); g.bezierCurveTo(-14, -10, 14, -10, 13, 6); g.closePath();
  g.fillStyle = rgrad(g, 0, -2, 14, ['#f6d494', '#d9963a', '#8a4a1a'], -3, -6); g.fill(); stroke(g, INK, 0.9);
  for (let i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(i * 6 - 3, -4); g.quadraticCurveTo(i * 6, -6, i * 6 + 3, -2); stroke(g, '#fff0c8', 1.6); }
  ell(g, 0, 6, 13, 2.5, '#b87a3a', INK, 0.6);
}
function iconPizza(g) {
  g.translate(16, 16);
  blob(g, 0, 0, 13, '#e8b060', 0.3, -0.25); stroke(g, INK, 0.9);
  ell(g, 0, 0, 10.5, 10.5, '#c8301a');
  for (let i = 0; i < 9; i++) { const a = i * 2.1, r = 3 + (i % 3) * 2.4; ell(g, Math.cos(a) * r, Math.sin(a) * r, 2.6, 2, '#fff2b8'); }
  for (let i = 0; i < 5; i++) { const a = i * 1.3 + 0.4, r = 5.5; ell(g, Math.cos(a) * r, Math.sin(a) * r, 1.3, 1.3, '#4a8a3a'); }
  g.strokeStyle = rgba('#7a3a10', 0.6); g.lineWidth = 0.8;
  for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * 13, Math.sin(a) * 13); g.stroke(); }
}
function iconCake(g, o) {
  g.translate(16, 18);
  g.beginPath(); g.ellipse(0, 6, 12, 4, 0, 0, Math.PI * 2); g.fillStyle = '#ffffff'; g.fill(); stroke(g, INK, 0.7);
  g.beginPath(); g.moveTo(-10, -4); g.lineTo(-10, 5); g.ellipse(0, 5, 10, 3.4, 0, Math.PI, 0, true); g.lineTo(10, -4); g.closePath();
  g.fillStyle = lgrad(g, -10, 0, 10, 0, [shade(o.c, 0.3), o.c, shade(o.c, -0.3)]); g.fill(); stroke(g, INK, 0.9);
  g.fillStyle = '#f4e4c8'; g.fillRect(-10, 0, 20, 1.6);
  g.beginPath(); g.ellipse(0, -4, 10, 3.4, 0, 0, Math.PI * 2); g.fillStyle = shade(o.c, 0.15); g.fill(); stroke(g, INK, 0.8);
  for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(i * 3, -3); g.quadraticCurveTo(i * 3 + 0.5, 1, i * 3, 2 + (i % 2) * 1.5); stroke(g, shade(o.c, 0.2), 1.6); }
  blob(g, 0, -8, 2.6, '#e8243a', 0.5, -0.3); stroke(g, INK, 0.5);
  g.beginPath(); g.moveTo(0, -10); g.quadraticCurveTo(1, -13, 3, -13); stroke(g, '#4a7a2a', 0.8);
}
function iconDried(g, o) {
  g.translate(16, 18);
  g.beginPath(); g.moveTo(-12, -1); g.quadraticCurveTo(-11, 9, 0, 10); g.quadraticCurveTo(11, 9, 12, -1); g.closePath();
  g.fillStyle = lgrad(g, -12, 0, 12, 0, ['#d8b070', '#b88a4a', '#7a5a2a']); g.fill(); stroke(g, INK, 0.9);
  g.strokeStyle = rgba('#6a4a20', 0.6); g.lineWidth = 0.6;
  for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(-11 + i, 2 + i * 2.5); g.quadraticCurveTo(0, 5 + i * 2.5, 11 - i, 2 + i * 2.5); g.stroke(); }
  const r = mulberry(o.c.length * 13 + (o.fine ? 3 : 0));
  const n = o.fine ? 30 : 9;
  for (let i = 0; i < n; i++) {
    const x = (r() - 0.5) * 20, y = -2 - r() * 7 + Math.abs(x) * 0.25;
    if (o.fine) ell(g, x, y, 1, 0.8, shade(o.c, (r() - 0.5) * 0.4));
    else if (o.ring) { ell(g, x, y, 3.4, 2.4, shade(o.c, (r() - 0.5) * 0.3), INK, 0.4); ell(g, x, y, 1.2, 0.8, shade(o.c, -0.2)); }
    else if (o.leafy) leaf(g, x, y, r() * 6.28, 5, 1.8, shade(o.c, (r() - 0.5) * 0.3), false);
    else { blob(g, x, y, 2.8, shade(o.c, (r() - 0.5) * 0.3), 0.2, -0.3); stroke(g, rgba(INK, 0.6), 0.4); }
  }
}
function iconBundle(g, o) {
  g.translate(16, 16); g.rotate(0.3);
  for (let i = -3; i <= 3; i++) {
    g.beginPath(); g.moveTo(i * 0.6, 13); g.lineTo(i * 1.8, -4); stroke(g, '#7a9a6a', 1);
    for (let k = 0; k < 5; k++) ell(g, i * 1.8 + (k % 2 - 0.5), -5 - k * 1.8, 1.2, 1.1, k % 2 ? o.c : shade(o.c, 0.2));
  }
  g.fillStyle = '#c8a878'; g.fillRect(-3.5, 4, 7, 2.6); g.strokeStyle = INK; g.lineWidth = 0.6; g.strokeRect(-3.5, 4, 7, 2.6);
}
function iconGlass(g, o) {
  g.translate(16, 16);
  g.beginPath(); g.moveTo(-7, -11); g.lineTo(7, -11); g.lineTo(5.5, 13); g.lineTo(-5.5, 13); g.closePath();
  g.fillStyle = rgba('#e8f4f8', 0.8); g.fill();
  g.beginPath(); g.moveTo(-6.6, -6); g.lineTo(6.6, -6); g.lineTo(5.5, 13); g.lineTo(-5.5, 13); g.closePath();
  g.fillStyle = lgrad(g, -7, 0, 7, 0, [shade(o.c, 0.3), o.c, shade(o.c, -0.3)]); g.fill();
  g.beginPath(); g.moveTo(-7, -11); g.lineTo(7, -11); g.lineTo(5.5, 13); g.lineTo(-5.5, 13); g.closePath(); stroke(g, INK, 0.9);
  g.fillStyle = rgba('#ffffff', 0.45); g.fillRect(-5, -9, 1.6, 20);
  g.beginPath(); g.moveTo(2, -6); g.lineTo(6, -16); stroke(g, INK, 2.2); g.beginPath(); g.moveTo(2, -6); g.lineTo(6, -16); stroke(g, '#f25a7a', 1.2);
  g.beginPath(); g.arc(-6, -11, 4, Math.PI * 0.9, Math.PI * 1.9); g.closePath(); g.fillStyle = shade(o.c, 0.2); g.fill(); stroke(g, INK, 0.6);
}
function iconCloth(g, o) {
  g.translate(16, 17);
  for (let k = 0; k < 3; k++) {
    const y = 6 - k * 6;
    rrect(g, -12 + k, y - 5, 24 - k * 2, 7, 2); g.fillStyle = lgrad(g, 0, y - 5, 0, y + 2, [shade(o.c, 0.2), o.c, shade(o.c, -0.2)]); g.fill(); stroke(g, INK, 0.8);
    g.strokeStyle = o.s; g.lineWidth = 1; for (let x = -9 + k; x < 11 - k; x += 4) { g.beginPath(); g.moveTo(x, y - 4); g.lineTo(x, y + 1); g.stroke(); }
  }
}
function iconQuilt(g) {
  g.translate(16, 16); g.rotate(-0.15);
  const cols = ['#d8463a', '#f2c23a', '#5a8ad8', '#5aa335', '#f4efe4', '#c06ad8'];
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { g.fillStyle = cols[(x + y * 2) % cols.length]; g.fillRect(-11 + x * 5.5, -11 + y * 5.5, 5.5, 5.5); }
  g.strokeStyle = rgba('#fbf3df', 0.9); g.lineWidth = 0.6; g.setLineDash([1, 1]);
  for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(-11 + i * 5.5, -11); g.lineTo(-11 + i * 5.5, 11); g.moveTo(-11, -11 + i * 5.5); g.lineTo(11, -11 + i * 5.5); g.stroke(); }
  g.setLineDash([]); rrect(g, -11, -11, 22, 22, 2); stroke(g, INK, 1);
}
function iconSachet(g, o) {
  g.translate(16, 18);
  g.beginPath(); g.moveTo(-5, -6); g.quadraticCurveTo(-11, 0, -9, 9); g.quadraticCurveTo(0, 12, 9, 9); g.quadraticCurveTo(11, 0, 5, -6); g.closePath();
  g.fillStyle = rgrad(g, 0, 2, 11, [shade(o.c, 0.3), o.c, shade(o.c, -0.25)], -3, -2); g.fill(); stroke(g, INK, 0.9);
  g.beginPath(); g.moveTo(-5, -6); g.quadraticCurveTo(-7, -11, -3, -10); g.lineTo(3, -10); g.quadraticCurveTo(7, -11, 5, -6); g.fillStyle = shade(o.c, 0.1); g.fill(); stroke(g, INK, 0.7);
  g.beginPath(); g.moveTo(-6, -6); g.lineTo(6, -6); stroke(g, '#9a5ad8', 1.8);
  for (let k = 0; k < 4; k++) ell(g, 1 + k * 1.2, -11 - k * 1.6, 1.1, 1, o.f);
  for (let i = 0; i < 6; i++) ell(g, -4 + (i % 3) * 4, 2 + Math.floor(i / 3) * 3.5, 0.9, 0.9, o.f);
}
function iconCup(g, o) {
  g.translate(16, 18);
  ell(g, 0, 8, 13, 3.6, '#f4efe4', INK, 0.8);
  g.beginPath(); g.arc(9, -1, 3.6, -1.3, 1.4); stroke(g, INK, 2.6); g.beginPath(); g.arc(9, -1, 3.6, -1.3, 1.4); stroke(g, '#fbf8f0', 1.4);
  g.beginPath(); g.moveTo(-9, -5); g.quadraticCurveTo(-9, 7, 0, 7); g.quadraticCurveTo(9, 7, 9, -5); g.closePath();
  g.fillStyle = lgrad(g, -9, 0, 9, 0, ['#ffffff', '#f0ebe0', '#c8c0b0']); g.fill(); stroke(g, INK, 0.9);
  g.fillStyle = '#5a8ad8'; g.fillRect(-8.5, 0, 17, 1.4);
  g.beginPath(); g.ellipse(0, -5, 9, 2.6, 0, 0, Math.PI * 2); g.fillStyle = o.c; g.fill(); stroke(g, INK, 0.7);
  if (o.foam) { ell(g, -2, -5.4, 3, 1.2, '#fff6e8'); ell(g, 3, -5, 2.4, 1, '#fff6e8'); }
  g.strokeStyle = rgba('#ffffff', 0.85); g.lineWidth = 1;
  [-3, 2].forEach(x => { g.beginPath(); g.moveTo(x, -8); g.bezierCurveTo(x - 2, -11, x + 2, -13, x, -16); g.stroke(); });
}
ICON_DRAW_GOODS = { bar: iconBar, loaf: iconLoaf, pizza: iconPizza, cake: iconCake, dried: iconDried, bundle: iconBundle, glass: iconGlass, cloth: iconCloth, quilt: iconQuilt, sachet: iconSachet, cup: iconCup };

UI_ICON.can = function (g) {
  g.translate(15, 18);
  g.beginPath(); g.moveTo(-9, -8); g.lineTo(5, -8); g.lineTo(6, 9); g.lineTo(-10, 9); g.closePath();
  g.fillStyle = lgrad(g, -10, 0, 6, 0, ['#9ad0f0', '#4a8ac8', '#2a5a8a']); g.fill(); stroke(g, INK, 0.9);
  g.beginPath(); g.moveTo(5, 2); g.lineTo(14, -9); stroke(g, INK, 3.6); g.beginPath(); g.moveTo(5, 2); g.lineTo(14, -9); stroke(g, '#4a8ac8', 2.2);
  ell(g, 14.5, -9.5, 2.2, 1.6, '#4a8ac8', INK, 0.7);
  g.beginPath(); g.arc(-2, -8, 6, Math.PI, 0); stroke(g, INK, 2.6); g.beginPath(); g.arc(-2, -8, 6, Math.PI, 0); stroke(g, '#4a8ac8', 1.4);
  [[16, -5], [18, -2], [15, -1]].forEach(([x, y]) => ell(g, x, y, 0.9, 1.3, '#9ad8ff'));
};
UI_ICON.drop = function (g) {
  g.translate(16, 17);
  g.beginPath(); g.moveTo(0, -13); g.bezierCurveTo(4, -6, 10, -1, 10, 4); g.arc(0, 4, 10, 0, Math.PI); g.bezierCurveTo(-10, -1, -4, -6, 0, -13);
  g.fillStyle = rgrad(g, -3, 2, 12, ['#d0f0ff', '#5aaee8', '#2a6aa8'], -4, -1); g.fill(); stroke(g, INK, 0.9);
  ell(g, -4, 3, 2, 3, rgba('#ffffff', 0.6));
};
UI_ICON.glasshouse = function (g) {
  g.translate(16, 18);
  g.beginPath(); g.moveTo(-12, 10); g.lineTo(-12, -2); g.lineTo(0, -12); g.lineTo(12, -2); g.lineTo(12, 10); g.closePath();
  g.fillStyle = rgba('#bfe8f4', 0.9); g.fill(); stroke(g, INK, 1);
  g.strokeStyle = '#fbf8f0'; g.lineWidth = 1.2;
  g.beginPath(); g.moveTo(0, -12); g.lineTo(0, 10); g.moveTo(-12, 2); g.lineTo(12, 2); g.moveTo(-6, -7); g.lineTo(-6, 10); g.moveTo(6, -7); g.lineTo(6, 10); g.stroke();
  for (let i = -1; i <= 1; i += 2) leaf(g, i * 3, 9, -1.57 + i * 0.4, 7, 2.4, '#5aa335');
};

// ---------------------------------------------------------------- new plants
function stakeVine(g, h, col) {
  g.fillStyle = '#9a7a4a'; g.fillRect(-1, -h, 2, h); g.strokeStyle = INK; g.lineWidth = 0.5; g.strokeRect(-1, -h, 2, h);
  for (let k = 0; k < h / 4; k++) { const s = k % 2 ? 1 : -1; leaf(g, s, -3 - k * 4, s > 0 ? -0.4 : Math.PI + 0.4, 6.5, 2.8, col); }
}
function treeling(g, s, leafCol, crown = 7) {
  g.fillStyle = '#7a5232'; g.fillRect(-1.4, -12 * s, 2.8, 12 * s); g.strokeStyle = INK; g.lineWidth = 0.5; g.strokeRect(-1.4, -12 * s, 2.8, 12 * s);
  [[-5, -16], [5, -16], [0, -21], [-2, -14], [3, -13]].forEach(([x, y]) => blob(g, x * s, y * s, crown * s, leafCol, 0.3, -0.3));
}
Object.assign(PLANT, {
  parsnip(g, p, ripe) {
    for (let i = -1; i <= 1; i++) leaf(g, i * 0.8, 0, -Math.PI / 2 + i * 0.55, 11 * p, 3.2 * p, '#6aa84a');
    if (ripe) { ell(g, 0, 0, 3.6, 2.4, '#efe0b0', INK, 0.6); }
  },
  lettuce(g, p, ripe) {
    for (let i = 0; i < 7; i++) { const a = -Math.PI + 0.2 + i / 6 * (Math.PI - 0.4); leaf(g, 0, -2, a, 9 * p, 5 * p, i % 2 ? '#8acc5a' : '#a8dc6a', false); }
    if (p > 0.55) { blob(g, 0, -3, 4.5 * p, ripe ? '#d8f094' : '#b8e070', 0.3, -0.15); stroke(g, shade('#7cc04a', -0.4), 0.5); }
  },
  tomato(g, p, ripe) {
    stakeVine(g, 28 * Math.max(p, 0.5), '#4a9a3a');
    if (ripe) [[-5, -10], [4, -15], [-4, -20], [5, -7]].forEach(([x, y]) => { blob(g, x, y, 2.6, '#e23a2a', 0.45, -0.3); stroke(g, INK, 0.45); });
    else if (p > 0.6) [[-5, -10], [4, -15]].forEach(([x, y]) => blob(g, x, y, 2, '#9ac040'));
  },
  cucumber(g, p, ripe) {
    g.fillStyle = '#8a6a42'; [-9, 9].forEach(x => g.fillRect(x - 1, -26, 2, 26));
    g.strokeStyle = '#8a6a42'; g.lineWidth = 0.8; for (let y = -24; y < 0; y += 6) { g.beginPath(); g.moveTo(-9, y); g.lineTo(9, y + 4); g.moveTo(9, y); g.lineTo(-9, y + 4); g.stroke(); }
    for (let k = 0; k < 9 * p; k++) leaf(g, -8 + (k % 3) * 8, -4 - Math.floor(k / 3) * 7, k % 2 ? -0.6 : -2.5, 6, 3.2, '#4f9a3a', false);
    if (ripe) [[-5, -12], [5, -18], [1, -7]].forEach(([x, y]) => { rrect(g, x - 1.6, y - 4, 3.2, 8, 1.6); g.fillStyle = '#4a9a30'; g.fill(); stroke(g, INK, 0.45); });
  },
  sunflower(g, p, ripe) {
    const h = 34 * Math.max(p, 0.4);
    g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(2, -h / 2, 0, -h); stroke(g, '#4a8a2a', 2);
    for (let k = 0; k < 3; k++) leaf(g, 0, -6 - k * h / 4, k % 2 ? -0.3 : Math.PI + 0.3, 9 * p, 4 * p, '#5a9a3a');
    if (ripe) {
      g.save(); g.translate(0, -h);
      for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; g.save(); g.rotate(a); g.beginPath(); g.ellipse(0, -6, 1.8, 3.6, 0, 0, Math.PI * 2); g.fillStyle = '#f6c81a'; g.fill(); stroke(g, shade('#f6c81a', -0.5), 0.4); g.restore(); }
      blob(g, 0, 0, 4, '#6a3a1a', 0.3, -0.3); g.restore();
    } else if (p > 0.55) { blob(g, 0, -h, 3, '#8ab040'); stroke(g, INK, 0.4); }
  },
  kale(g, p, ripe) {
    for (let i = -2; i <= 2; i++) {
      g.save(); g.rotate(i * 0.35);
      g.beginPath(); g.moveTo(0, 0);
      for (let k = 0; k <= 6; k++) g.lineTo(-(Math.sin(k / 6 * Math.PI) * 4 + 0.6 + (k % 2) * 1.2) * p, -k * 2.4 * p);
      for (let k = 6; k >= 0; k--) g.lineTo((Math.sin(k / 6 * Math.PI) * 4 + 0.6 + (k % 2) * 1.2) * p, -k * 2.4 * p);
      g.closePath(); g.fillStyle = ripe ? '#3f7a4a' : '#5a9a5a'; g.fill(); stroke(g, shade('#3f7a4a', -0.5), 0.5);
      g.restore();
    }
  },
  cotton(g, p, ripe) {
    g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -14 * p); g.moveTo(0, -6 * p); g.lineTo(-6 * p, -12 * p); g.moveTo(0, -8 * p); g.lineTo(6 * p, -14 * p); stroke(g, '#7a5a30', 1.2);
    for (let i = 0; i < 6; i++) leaf(g, (i % 3 - 1) * 4 * p, -6 * p - (i % 2) * 4 * p, -1.57 + (i - 2.5) * 0.5, 6 * p, 2.6 * p, '#6a8a3a');
    if (ripe) [[-6, -13], [6, -15], [0, -16], [-2, -9], [4, -9]].forEach(([x, y]) => { blob(g, x, y, 2.6, '#fbf8f0', 0.2, -0.12); stroke(g, rgba(INK, 0.5), 0.4); });
  },
  tea(g, p, ripe) {
    [[-5, -5], [5, -5], [0, -9], [-2, -3], [3, -2]].forEach(([x, y]) => blob(g, x * p, y * p, 5.5 * p, '#3f7a3a', 0.25, -0.3));
    for (let i = 0; i < 12; i++) leaf(g, (hash2(i, 1, 21) - 0.5) * 16 * p, -2 - hash2(i, 2, 21) * 10 * p, hash2(i, 3, 21) * 6.28, 3.6 * p, 1.6 * p, ripe ? '#9ad86a' : '#4f8a42', false);
  },
  flax(g, p, ripe) {
    for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(i, 0); g.quadraticCurveTo(i * 1.6, -9 * p, i * 2.4, -19 * p); stroke(g, '#7aa04a', 0.9); if (ripe) { for (let k = 0; k < 5; k++) { const a = k / 5 * 6.28; ell(g, i * 2.4 + Math.cos(a) * 1.3, -19 * p + Math.sin(a) * 1.3, 1.1, 1.1, '#6a8ad8'); } } }
  },
  cranberry(g, p, ripe) {
    for (let i = 0; i < 14; i++) leaf(g, (hash2(i, 1, 31) - 0.5) * 18, -1 - hash2(i, 2, 31) * 6 * p, hash2(i, 3, 31) * 6.28, 4 * p, 1.6 * p, '#5a7a3a', false);
    if (ripe) for (let i = 0; i < 9; i++) { blob(g, (hash2(i, 4, 31) - 0.5) * 16, -1 - hash2(i, 5, 31) * 6, 1.6, '#c8203a', 0.45, -0.3); }
  },
  rice(g, p, ripe) {
    ell(g, 0, 1, 9, 3, rgba('#6aa8d0', 0.55));
    for (let i = -3; i <= 3; i++) {
      leaf(g, i * 0.8, 0, -Math.PI / 2 + i * 0.22, 18 * p, 1.4, '#6aaa4a', false);
      if (ripe && i % 2 === 0) { const x = i * 3.6, y = -16; g.beginPath(); g.moveTo(i * 0.8, -6); g.quadraticCurveTo(x, y - 4, x + 4, y + 3); stroke(g, '#c8b860', 0.8); for (let k = 0; k < 4; k++) ell(g, x + k * 1.1, y - 2 + k * 1.4, 0.9, 1.4, '#efe3a8'); }
    }
  },
  olive(g, p, ripe) {
    treeling(g, Math.max(p, 0.4), '#8aa080', 6.5);
    if (ripe) [[-6, -14], [5, -18], [1, -12], [-1, -21], [6, -12]].forEach(([x, y], i) => { g.beginPath(); g.ellipse(x, y, 1.5, 2, 0.3, 0, Math.PI * 2); g.fillStyle = i % 2 ? '#4a3a4a' : '#6a7a2a'; g.fill(); stroke(g, INK, 0.35); });
  },
  lavender(g, p, ripe) {
    blob(g, 0, -3, 8 * p, '#8aa88a', 0.25, -0.3);
    for (let i = -3; i <= 3; i++) {
      const x = i * 2.4 * p, top = -10 - (3 - Math.abs(i)) * 2.4;
      g.beginPath(); g.moveTo(x * 0.5, -3); g.lineTo(x, top * p); stroke(g, '#7a9a7a', 0.7);
      if (ripe) for (let k = 0; k < 4; k++) ell(g, x, top - k * 1.6, 1.1, 1, k % 2 ? '#9a7ad8' : '#b096e4');
    }
  },
  melon(g, p, ripe) {
    g.beginPath(); g.moveTo(-14, 2); g.bezierCurveTo(-6, -4, 2, 4, 14, -2); stroke(g, '#5a8a2a', 1.3);
    for (let i = 0; i < 5; i++) blob(g, -12 + i * 6, -3 - (i % 2) * 2, 4.5 * p, '#4f9438', 0.3, -0.25);
    if (ripe) { g.save(); g.translate(1, -3); g.beginPath(); g.ellipse(0, 0, 8, 6, 0, 0, Math.PI * 2); g.fillStyle = '#6ab04a'; g.fill(); g.save(); g.clip(); g.strokeStyle = '#2f6a2a'; g.lineWidth = 1.4; for (let i = -2; i <= 2; i++) { g.beginPath(); g.ellipse(i * 3, 0, 1, 7, 0, 0, Math.PI * 2); g.stroke(); } g.restore(); g.beginPath(); g.ellipse(0, 0, 8, 6, 0, 0, Math.PI * 2); stroke(g, INK, 0.6); g.restore(); }
  },
  peach(g, p, ripe) {
    treeling(g, Math.max(p, 0.4), '#4b9a3c');
    if (!ripe && p > 0.55) for (let i = 0; i < 6; i++) { const x = (hash2(i, 1, 41) - 0.5) * 16, y = -12 - hash2(i, 2, 41) * 10; for (let k = 0; k < 5; k++) { const a = k / 5 * 6.28; ell(g, x + Math.cos(a), y + Math.sin(a), 0.9, 0.9, '#ffd0e0'); } }
    if (ripe) [[-6, -14], [5, -18], [1, -12], [-1, -22], [6, -12]].forEach(([x, y]) => { blob(g, x, y, 2.3, '#f8a070', 0.45, -0.3); stroke(g, INK, 0.4); });
  },
  cocoa(g, p, ripe) {
    const s = Math.max(p, 0.4);
    g.fillStyle = '#6a4a2a'; g.fillRect(-1.8, -16 * s, 3.6, 16 * s); g.strokeStyle = INK; g.lineWidth = 0.5; g.strokeRect(-1.8, -16 * s, 3.6, 16 * s);
    for (let i = 0; i < 6; i++) leaf(g, 0, -14 * s - (i % 2) * 3, -1.57 + (i - 2.5) * 0.55, 11 * s, 3.6 * s, '#3f7a3a');
    if (ripe) [[-3, -8, 0.4], [3, -11, -0.4], [-2, -13, 0.3]].forEach(([x, y, a]) => { g.save(); g.translate(x, y); g.rotate(a); g.beginPath(); g.ellipse(0, 0, 1.8, 3.4, 0, 0, Math.PI * 2); g.fillStyle = '#d88a3a'; g.fill(); stroke(g, INK, 0.4); g.restore(); });
  },
});
const SINGLE_PLANT = { apple: 1, hops: 1, grapes: 1, pumpkin: 1, corn: 1, juniper: 1, sunflower: 1, olive: 1, peach: 1, cocoa: 1, melon: 1, tomato: 1, cucumber: 1 };

// ---------------------------------------------------------------- bushes (redesigned) and seasonal trees
const BUSH_COLS = [
  ['#4f9a42', '#5aa84a', '#4a8a3a', '#d8a030'], // berry shrub: spring, summer, fall, winter-ish
];
function shrubDome(g, r, rx, ry, col) {
  // a single rounded dome with a leafy edge: reads as a shrub, not a row of blobs
  g.beginPath(); g.ellipse(0, -ry, rx, ry, 0, Math.PI, 0); g.quadraticCurveTo(rx * 0.8, 1, 0, 1); g.quadraticCurveTo(-rx * 0.8, 1, -rx, -ry); g.closePath();
  g.fillStyle = rgrad(g, -rx * 0.3, -ry * 1.5, rx * 1.4, [shade(col, 0.25), col, shade(col, -0.35)], -rx * 0.4, -ry * 1.6); g.fill();
  // leaves around the rim, pointing outward
  for (let i = 0; i < 22; i++) {
    const a = Math.PI + (i / 21) * Math.PI, x = Math.cos(a) * rx * 0.96, y = -ry + Math.sin(a) * ry * 0.96;
    leaf(g, x, y, a + (r() - 0.5) * 0.6, 4.5 + r() * 2, 2.2, shade(col, (r() - 0.4) * 0.35), false);
  }
  // interior leaf texture, lit from the upper left
  for (let i = 0; i < 26; i++) {
    const a = r() * Math.PI * 2, d = Math.sqrt(r()), x = Math.cos(a) * rx * 0.75 * d, y = -ry + Math.sin(a) * ry * 0.7 * d;
    leaf(g, x, y, r() * 6.28, 3.5, 1.6, shade(col, 0.12 - (y + ry) / ry * 0.3 + (r() - 0.5) * 0.2), false);
  }
  g.beginPath(); g.ellipse(-rx * 0.3, -ry * 1.45, rx * 0.35, ry * 0.18, -0.3, 0, Math.PI * 2); g.fillStyle = rgba('#ffffff', 0.18); g.fill();
}
function snowCap(g, rx, y, r) {
  g.beginPath(); g.moveTo(-rx, y + 2);
  for (let i = 0; i <= 8; i++) { const x = -rx + i * rx / 4; g.quadraticCurveTo(x - rx / 8, y - 4 - r() * 2, x, y + (i % 2 ? 3 : 1)); }
  g.lineTo(rx * 0.7, y - 3); g.quadraticCurveTo(0, y - 9, -rx * 0.7, y - 3); g.closePath();
  g.fillStyle = lgrad(g, 0, y - 9, 0, y + 3, ['#ffffff', '#e8f0f8']); g.fill(); stroke(g, rgba('#7a90a8', 0.7), 0.6);
}
function bushSprite(v, season) {
  const r = mulberry(v * 101 + season * 7 + 5);
  return makeSprite(52, 44, 26, 38, g => {
    if (v === 0 || v === 1) {
      const col = season === 2 ? (v ? '#c86a2a' : '#b8502a') : season === 3 ? '#5a7a5a' : season === 0 ? '#62b04c' : '#4f9a42';
      shrubDome(g, r, 19, 15, col);
      if (season === 3) snowCap(g, 16, -26, r);
      else if (v === 0 && season !== 0) for (let i = 0; i < 9; i++) { const a = r() * 6.28, d = Math.sqrt(r()); blob(g, Math.cos(a) * 13 * d, -15 + Math.sin(a) * 10 * d, 1.7, season === 2 ? '#3a2a5a' : '#d8344a', 0.5, -0.25); }
      else if (season !== 2) for (let i = 0; i < 8; i++) { const a = r() * 6.28, d = Math.sqrt(r()), x = Math.cos(a) * 13 * d, y = -15 + Math.sin(a) * 10 * d; for (let k = 0; k < 5; k++) { const q = k / 5 * 6.28; ell(g, x + Math.cos(q) * 1.3, y + Math.sin(q) * 1.3, 1, 1, season === 0 ? '#ffc8dc' : '#fff6f0'); } ell(g, x, y, 0.6, 0.6, '#f2c23a'); }
    } else if (v === 2) { // fern
      const col = season === 2 ? '#b8902a' : season === 3 ? '#8a7a5a' : '#3f9a3a';
      for (let i = 0; i < 7; i++) {
        const a = -Math.PI / 2 + (i - 3) * 0.4, len = 20 + (3 - Math.abs(i - 3)) * 2;
        g.save(); g.rotate(a + Math.PI / 2);
        g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(2, -len * 0.6, 0, -len); stroke(g, shade(col, -0.3), 0.9);
        for (let k = 1; k < 7; k++) { const y = -k * len / 7, w = (1 - k / 7) * 6 + 2; leaf(g, 0.3, y, -0.6, w, 2.4, k % 2 ? col : shade(col, -0.1), false); leaf(g, -0.3, y, Math.PI + 0.6, w, 2.4, k % 2 ? shade(col, -0.1) : col, false); }
        g.restore();
      }
      if (season === 3) for (let i = 0; i < 6; i++) ell(g, (r() - 0.5) * 30, -6 - r() * 12, 3, 1.6, '#ffffff');
    } else { // tall grass + wildflowers
      const col = season === 2 ? '#c8b050' : season === 3 ? '#a89870' : '#6ab04a';
      for (let i = 0; i < 16; i++) { const x = (i - 7.5) * 2.2 + (r() - 0.5) * 2; leaf(g, x * 0.4, 0, -Math.PI / 2 + x * 0.05 + (r() - 0.5) * 0.4, 14 + r() * 10, 1.6, shade(col, (r() - 0.5) * 0.3), false); }
      if (season !== 3) {
        const fc = season === 2 ? ['#e8902a', '#f2c23a'] : season === 0 ? ['#ffc8dc', '#ffffff', '#c8a8f0'] : ['#ffffff', '#f2c23a', '#9a7ad8'];
        for (let i = 0; i < 6; i++) { const x = (r() - 0.5) * 26, y = -12 - r() * 12; g.beginPath(); g.moveTo(x * 0.6, 0); g.lineTo(x, y); stroke(g, '#4a8a3a', 0.7); const c = fc[i % fc.length]; for (let k = 0; k < 5; k++) { const q = k / 5 * 6.28; ell(g, x + Math.cos(q) * 1.6, y + Math.sin(q) * 1.6, 1.3, 1.3, c); } ell(g, x, y, 0.8, 0.8, '#f2a23a'); }
      } else snowCap(g, 13, -10, r);
    }
  }, { edge: 1.2 });
}
function bareTree(g, r, sc, bark) {
  const br = (x, y, a, len, w, d) => {
    const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); stroke(g, INK, w + 1); g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); stroke(g, bark, w);
    if (d > 0) { br(x2, y2, a - 0.35 - r() * 0.35, len * 0.72, w * 0.62, d - 1); br(x2, y2, a + 0.35 + r() * 0.35, len * 0.72, w * 0.62, d - 1); }
    else { g.beginPath(); g.moveTo(x2 - 1.5, y2 - 1.2); g.lineTo(x2 + 1.5, y2 - 1.2); stroke(g, '#ffffff', 1.6); }
    if (d >= 1 && Math.cos(a) * 0 + Math.abs(Math.cos(a)) > 0.3) { g.beginPath(); g.moveTo(x, y - w * 0.7); g.lineTo(x2, y2 - w * 0.7); stroke(g, rgba('#ffffff', 0.9), Math.max(1, w * 0.45)); }
  };
  br(0, 0, -Math.PI / 2, 26 * sc, 6 * sc, 0);
  br(0, -26 * sc, -Math.PI / 2 - 0.5, 18 * sc, 4 * sc, 3);
  br(0, -26 * sc, -Math.PI / 2 + 0.5, 18 * sc, 4 * sc, 3);
  br(0, -26 * sc, -Math.PI / 2, 16 * sc, 3.6 * sc, 2);
}
function treeSprite(kind, v, season = 1) {
  const key = 'tree_' + kind + '_' + v + '_' + season;
  if (ART.sprites[key]) return ART.sprites[key];
  const r = mulberry(kind.length * 1000 + v * 77 + 3);
  let s;
  if (kind === 'bush') s = bushSprite(v, season);
  else if (kind === 'oak' || kind === 'bigoak') {
    const big = kind === 'bigoak', sc = big ? 1.35 : 1;
    const PAL = [
      [['#7cc25a', '#68b04c', '#9ad86a'], ['#f6b8d0', '#f29ac0', '#ffd6e6'], ['#86c860', '#6ab04a', '#a6dc78'], ['#7cc25a', '#68b04c', '#9ad86a']],
      [['#4f9a42', '#3e8a3a', '#68b04c'], ['#4f9a42', '#3e8a3a', '#68b04c'], ['#5fae4a', '#4a9a3c', '#7cc25a'], ['#56a046', '#43903c', '#6ab84e']],
      [['#e8902a', '#d8602a', '#f2b23a'], ['#d84a2a', '#b8302a', '#e8703a'], ['#f2c23a', '#e8a82a', '#ffd860'], ['#a8a040', '#8a8a30', '#c8b850']],
    ];
    s = makeSprite(76 * sc, 96 * sc, 38 * sc, 92 * sc, g => {
      g.scale(sc, sc);
      if (season === 3) { bareTree(g, r, 1, '#6a4a32'); return; }
      g.beginPath(); g.moveTo(-5, 0); g.quadraticCurveTo(-3, -18, -4, -34); g.lineTo(4, -34); g.quadraticCurveTo(3, -18, 6, 0); g.closePath();
      g.fillStyle = lgrad(g, -5, 0, 6, 0, ['#9a6a42', '#7a5232', '#4f3420']); g.fill(); stroke(g, INK, 0.9);
      g.beginPath(); g.moveTo(0, -24); g.quadraticCurveTo(-8, -30, -12, -38); stroke(g, '#6a4a2a', 2.4);
      const greens = PAL[season][v];
      const puffs = [];
      for (let i = 0; i < 11; i++) { const a = r() * Math.PI * 2, d = r() * 15; puffs.push([Math.cos(a) * d * 1.25, -54 + Math.sin(a) * d * 0.9, 12 + r() * 7]); }
      puffs.sort((a, b) => a[1] - b[1]);
      puffs.forEach(([x, y, rr]) => blob(g, x + 1, y + 3, rr, shade(greens[1], -0.3), 0, -0.2));
      puffs.forEach(([x, y, rr], i) => blob(g, x, y, rr, greens[i % 3], 0.28, -0.32));
      for (let i = 0; i < 40; i++) { const a = r() * 6.28, d = r() * 24; ell(g, Math.cos(a) * d * 1.2, -56 + Math.sin(a) * d * 0.85, 1.8, 1.1, rgba(shade(greens[2], 0.35), 0.6)); }
      for (let i = 0; i < 14; i++) { const a = r() * 6.28, d = 10 + r() * 14; ell(g, Math.cos(a) * d * 1.2, -45 + Math.sin(a) * d * 0.9, 1.6, 1, rgba(shade(greens[1], -0.45), 0.5)); }
      if (season === 0 && v !== 1) for (let i = 0; i < 12; i++) { const a = r() * 6.28, d = r() * 20; ell(g, Math.cos(a) * d * 1.2, -54 + Math.sin(a) * d * 0.8, 1.4, 1.4, '#fff4f8'); }
      if (season === 1 && v === 1) for (let i = 0; i < 7; i++) { const a = r() * 6.28, d = r() * 18; blob(g, Math.cos(a) * d, -54 + Math.sin(a) * d * 0.8, 1.9, '#e83a3a', 0.5, -0.2); }
    }, { edge: 1.5 });
  } else if (kind === 'pine') {
    const c1 = v === 2 ? '#2f7a5a' : '#2c6e4e', c2 = v === 2 ? '#4a9a72' : '#3f8a62';
    s = makeSprite(60, 100, 30, 96, g => {
      g.fillStyle = '#6a4228'; g.fillRect(-3, -14, 6, 14); g.strokeStyle = INK; g.lineWidth = 0.8; g.strokeRect(-3, -14, 6, 14);
      for (let k = 0; k < 5; k++) {
        const y = -10 - k * 15, w = 26 - k * 4.6, h = 26;
        g.beginPath(); g.moveTo(-w, y);
        for (let i = 0; i <= 6; i++) { const x = -w + i * (w * 2 / 6); g.lineTo(x, y + (i % 2 ? 3 : 0)); }
        g.lineTo(0, y - h); g.closePath();
        g.fillStyle = lgrad(g, -w, y - h / 2, w, y, [c2, c1, shade(c1, -0.35)]); g.fill(); stroke(g, shade(c1, -0.55), 0.8);
        if (season === 3) {
          g.beginPath(); g.moveTo(-w * 0.75, y - 4); g.lineTo(0, y - h + 1); g.lineTo(w * 0.55, y - 6);
          for (let i = 0; i < 4; i++) g.lineTo(w * 0.55 - i * w * 0.35, y - 6 + (i % 2 ? 4 : -1));
          g.closePath(); g.fillStyle = '#f4f8fc'; g.fill(); stroke(g, rgba('#7a90a8', 0.6), 0.5);
        } else {
          g.strokeStyle = rgba(shade(c2, 0.4), 0.55); g.lineWidth = 0.7;
          for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(-w * 0.2 * i, y - h * 0.8 + i * 4); g.lineTo(-w * 0.2 * i - 4, y - h * 0.8 + i * 4 + 5); g.stroke(); }
        }
      }
      if (season === 0 && v === 3) for (let i = 0; i < 9; i++) ell(g, (r() - 0.5) * 30, -20 - r() * 60, 1.2, 1.6, '#fbf3df');
    }, { edge: 1.5 });
  } else if (kind === 'birch') {
    const cc = [['#a8dc78', '#8ccc5a', '#c8ec98'], ['#9ccc5a', '#82b84a', '#b8dc78'], ['#f2c23a', '#e8a82a', '#ffd860']][Math.min(season, 2)];
    s = makeSprite(56, 96, 28, 92, g => {
      if (season === 3) { bareTree(g, r, 0.85, '#ece6da'); return; }
      g.beginPath(); g.moveTo(-3, 0); g.lineTo(-2, -50); g.lineTo(2, -50); g.lineTo(3, 0); g.closePath();
      g.fillStyle = lgrad(g, -3, 0, 3, 0, ['#ffffff', '#ece6da', '#c8c0b0']); g.fill(); stroke(g, INK, 0.8);
      for (let i = 0; i < 7; i++) { g.fillStyle = '#2a2420'; g.fillRect(-2.5 + r() * 2, -6 - i * 6.5, 2 + r() * 2, 1); }
      for (let i = 0; i < 9; i++) { const x = (r() - 0.5) * 22, y = -48 - r() * 26; blob(g, x, y, 9 + r() * 4, cc[i % 3], 0.3, -0.3); }
      for (let i = 0; i < 26; i++) leaf(g, (r() - 0.5) * 34, -40 - r() * 36, r() * 6.28, 4, 2, shade(cc[2], 0.15), false);
    }, { edge: 1.5 });
  } else if (kind === 'rock') {
    const rc = ['#9aa0a6', '#8a9096', '#a8a49c', '#94988e'][v];
    s = makeSprite(52, 40, 26, 32, g => {
      g.beginPath(); g.moveTo(-20, 0); g.lineTo(-22, -10); g.lineTo(-12, -24); g.lineTo(4, -27); g.lineTo(18, -18); g.lineTo(21, -4); g.lineTo(14, 2); g.closePath();
      g.fillStyle = lgrad(g, -20, -26, 20, 2, [shade(rc, 0.35), rc, shade(rc, -0.35)]); g.fill(); stroke(g, INK, 1);
      g.beginPath(); g.moveTo(-12, -24); g.lineTo(-4, -12); g.lineTo(4, -27); g.moveTo(-4, -12); g.lineTo(18, -18); g.moveTo(-4, -12); g.lineTo(-6, 1); stroke(g, rgba(shade(rc, -0.5), 0.6), 0.7);
      g.beginPath(); g.moveTo(-12, -24); g.lineTo(4, -27); g.lineTo(-4, -12); g.closePath(); g.fillStyle = rgba('#ffffff', 0.2); g.fill();
      if (season === 3) { g.beginPath(); g.moveTo(-18, -12); g.lineTo(-12, -25); g.lineTo(4, -28); g.lineTo(18, -19); g.lineTo(16, -14); g.quadraticCurveTo(0, -20, -18, -12); g.fillStyle = '#f4f8fc'; g.fill(); stroke(g, rgba('#7a90a8', 0.6), 0.5); }
      else for (let i = 0; i < 6; i++) blob(g, -10 + r() * 20, -24 + r() * 5, 2.8 + r() * 2, season === 2 ? '#a8a040' : '#6a9a4a', 0.3, -0.3);
    }, { edge: 1.3 });
  }
  ART.sprites[key] = s;
  return s;
}

// ---------------------------------------------------------------- new buildings
Object.assign(BUILD_DRAW, {
  oven(g) {
    // brick dome oven
    g.beginPath(); g.moveTo(-36, -10); g.bezierCurveTo(-40, -70, 30, -74, 26, -10); g.closePath();
    g.save(); g.clip(); g.fillStyle = '#c8683a'; g.fillRect(-42, -80, 72, 72);
    g.strokeStyle = rgba('#6a2a12', 0.55); g.lineWidth = 0.7;
    for (let y = -10; y > -70; y -= 6) { g.beginPath(); g.ellipse(-5, -10, 32 - (-10 - y) * 0.05, -y - 10 + 2, 0, Math.PI, 0); g.stroke(); }
    for (let i = 0; i < 9; i++) { const a = Math.PI + i / 8 * Math.PI; g.beginPath(); g.moveTo(-5 + Math.cos(a) * 10, -10 + Math.sin(a) * 10); g.lineTo(-5 + Math.cos(a) * 34, -10 + Math.sin(a) * 55); g.stroke(); }
    g.fillStyle = lgrad(g, -36, 0, 26, 0, [rgba('#fff', 0.15), rgba('#000', 0), rgba('#000', 0.25)]); g.fillRect(-42, -80, 72, 72);
    g.restore();
    g.beginPath(); g.moveTo(-36, -10); g.bezierCurveTo(-40, -70, 30, -74, 26, -10); stroke(g, INK, 1.1);
    // mouth
    g.beginPath(); g.moveTo(-18, -10); g.lineTo(-18, -24); g.arc(-5, -24, 13, Math.PI, 0); g.lineTo(8, -10); g.closePath(); g.fillStyle = '#2a1a12'; g.fill(); stroke(g, INK, 1);
    g.beginPath(); g.arc(-5, -24, 15, Math.PI, 0); stroke(g, '#e8b080', 2.4);
    // chimney
    stoneWall(g, 8, -86, 9, 30, '#a84a32');
    // base slab
    planks(g, -40, -12, 72, 6, '#9a8a7a', false);
    // peel and loaves table
    g.save(); g.translate(30, -10); g.rotate(-0.25); g.fillStyle = '#c8945a'; g.fillRect(-1.5, -48, 3, 40); ell(g, 0, -50, 6, 8, '#d8a86a', INK, 0.8); g.restore();
    planks(g, 30, -26, 16, 3, '#8a5a32', false); g.fillStyle = '#6a4228'; g.fillRect(31, -23, 2, 14); g.fillRect(43, -23, 2, 14);
    [[34, -28], [41, -28]].forEach(([x, y]) => { g.save(); g.translate(x, y); g.scale(0.3, 0.3); g.translate(-16, -24); iconLoaf(g); g.restore(); });
    for (let i = 0; i < 3; i++) { rrect(g, -44 + i * 2, -6 - i * 4, 16, 4, 2); g.fillStyle = '#7a5232'; g.fill(); stroke(g, INK, 0.6); ell(g, -28 + i * 2, -4 - i * 4, 1.8, 2, '#d8b080'); }
  },
  dryer(g) {
    // A-frame rack with trays and hanging bundles
    g.strokeStyle = INK; g.lineWidth = 3.4; g.beginPath(); g.moveTo(-18, -6); g.lineTo(-10, -56); g.moveTo(18, -6); g.lineTo(10, -56); g.stroke();
    g.strokeStyle = '#9a6a3a'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(-18, -6); g.lineTo(-10, -56); g.moveTo(18, -6); g.lineTo(10, -56); g.stroke();
    planks(g, -14, -58, 28, 3, '#8a5a32', false);
    [[-16, -14, 32], [-14, -28, 28], [-12, -42, 24]].forEach(([x, y, w], i) => {
      planks(g, x, y, w, 3, '#c8a070', true);
      const cols = [['#a8281a', '#c8401a'], ['#e8c890', '#f0a060'], ['#4a7a3a', '#5a2a12']][i];
      for (let k = 0; k < w / 4; k++) ell(g, x + 2 + k * 4, y - 1, 1.6, 1.1, cols[k % 2]);
    });
    [-7, 0, 7].forEach((x, i) => { g.beginPath(); g.moveTo(x, -58); g.lineTo(x, -52); stroke(g, '#c8a878', 0.7); g.save(); g.translate(x, -46); g.scale(0.28, 0.28); g.translate(-16, -16); iconBundle(g, { c: ['#9a7ad8', '#d8401a', '#7aa04a'][i] }); g.restore(); });
  },
  juicer(g) {
    // small tub on legs with screw + crank wheel, pouring into a jug
    g.fillStyle = '#6a4228'; [-14, 10].forEach(x => { g.fillRect(x, -22, 4, 18); g.strokeStyle = INK; g.lineWidth = 0.7; g.strokeRect(x, -22, 4, 18); });
    g.beginPath(); g.moveTo(-18, -44); g.lineTo(-15, -20); g.lineTo(15, -20); g.lineTo(18, -44); g.closePath();
    g.save(); g.clip(); planks(g, -20, -46, 40, 28, '#b07a42'); g.restore(); g.beginPath(); g.moveTo(-18, -44); g.lineTo(-15, -20); g.lineTo(15, -20); g.lineTo(18, -44); g.closePath(); stroke(g, INK, 1);
    [-38, -26].forEach(y => { g.beginPath(); g.moveTo(-17.5, y); g.lineTo(17.5, y); stroke(g, '#3a3a3e', 1.8); });
    ell(g, 0, -44, 18, 4, '#d88a3a', INK, 0.9);
    g.fillStyle = '#8a8a90'; g.fillRect(-1.6, -66, 3.2, 22); g.strokeStyle = INK; g.lineWidth = 0.7; g.strokeRect(-1.6, -66, 3.2, 22);
    g.beginPath(); g.ellipse(0, -66, 10, 3, 0, 0, Math.PI * 2); stroke(g, INK, 2.6); g.beginPath(); g.ellipse(0, -66, 10, 3, 0, 0, Math.PI * 2); stroke(g, '#9a6a3a', 1.6);
    g.beginPath(); g.moveTo(15, -26); g.lineTo(22, -22); stroke(g, '#8a5a32', 2.4);
    g.save(); g.translate(22, -2); g.scale(0.4, 0.4); g.translate(-16, -28); iconBottle(g, { c: '#f2c85a', shape: 'jug' }); g.restore();
    blob(g, -20, -4, 3, '#d8392b'); blob(g, -15, -2, 3, '#f8a070');
  },
  press(g) {
    // great screw press: frame, screw, basin, lever
    ell(g, -4, -16, 30, 9, '#a8a092', INK, 1);
    ell(g, -4, -19, 26, 7, '#8a8278'); ell(g, -4, -20, 20, 5, '#c8a040');
    g.fillStyle = '#6a4228'; [-30, 18].forEach(x => { g.fillRect(x, -88, 7, 74); g.strokeStyle = INK; g.lineWidth = 0.9; g.strokeRect(x, -88, 7, 74); });
    planks(g, -34, -92, 60, 9, '#7a5232', false);
    // screw
    g.fillStyle = '#9a6a3a'; g.fillRect(-7, -83, 6, 44); g.strokeStyle = INK; g.lineWidth = 0.8; g.strokeRect(-7, -83, 6, 44);
    g.strokeStyle = rgba('#4a2a12', 0.8); g.lineWidth = 1; for (let y = -82; y < -40; y += 4) { g.beginPath(); g.moveTo(-7, y); g.lineTo(-1, y + 3); g.stroke(); }
    planks(g, -22, -40, 36, 6, '#8a5a32', false);
    // lever
    g.save(); g.translate(-4, -62); g.rotate(0.12); g.fillStyle = '#b07a42'; g.fillRect(-36, -2, 72, 4); g.strokeStyle = INK; g.lineWidth = 0.8; g.strokeRect(-36, -2, 72, 4); g.restore();
    // oil jars
    [[30, -4, '#f2c81a'], [40, 2, '#9aa040']].forEach(([x, y, c]) => { g.save(); g.translate(x, y); g.scale(0.42, 0.42); g.translate(-16, -28); iconBottle(g, { c, shape: 'oil' }); g.restore(); });
    blob(g, -38, -2, 4, '#f6c81a'); blob(g, -32, 0, 4, '#7a8a3a');
  },
  loom(g) {
    // wooden loom under a little shingle canopy
    g.fillStyle = '#7a5232'; [-38, 32].forEach(x => { g.fillRect(x, -84, 5, 76); g.strokeStyle = INK; g.lineWidth = 0.8; g.strokeRect(x, -84, 5, 76); });
    g.beginPath(); g.moveTo(-44, -82); g.lineTo(0, -102); g.lineTo(42, -82); g.lineTo(38, -78); g.lineTo(0, -96); g.lineTo(-40, -78); g.closePath(); g.fillStyle = '#5a7a9a'; g.fill(); stroke(g, INK, 1);
    // frame
    g.fillStyle = '#9a6a3a'; [-26, 20].forEach(x => { g.fillRect(x, -66, 5, 56); g.strokeStyle = INK; g.lineWidth = 0.8; g.strokeRect(x, -66, 5, 56); });
    planks(g, -28, -68, 54, 5, '#8a5a32', false); planks(g, -28, -22, 54, 5, '#8a5a32', false);
    // warp threads
    const cols = ['#d8463a', '#f2c23a', '#5a8ad8', '#fbf3df'];
    for (let i = 0; i < 18; i++) { g.beginPath(); g.moveTo(-21 + i * 2.4, -63); g.lineTo(-21 + i * 2.4, -40); stroke(g, cols[i % 4], 0.8); }
    // woven cloth
    for (let y = 0; y < 5; y++) { g.fillStyle = cols[y % 4]; g.fillRect(-21, -40 + y * 3.6, 42, 3.6); }
    g.strokeStyle = INK; g.lineWidth = 0.7; g.strokeRect(-21, -40, 42, 18);
    g.strokeStyle = rgba('#3a2a1a', 0.3); g.lineWidth = 0.5; for (let i = 0; i < 18; i++) { g.beginPath(); g.moveTo(-21 + i * 2.4, -40); g.lineTo(-21 + i * 2.4, -22); g.stroke(); }
    // stool and bolts
    planks(g, -10, -10, 20, 4, '#b07a42', false);
    g.save(); g.translate(38, -2); g.scale(0.45, 0.45); g.translate(-16, -24); iconCloth(g, { c: '#f4efe4', s: '#c8d8f0' }); g.restore();
    g.save(); g.translate(-40, -2); g.scale(0.45, 0.45); g.translate(-16, -24); iconCloth(g, { c: '#d8c8a0', s: '#b8a880' }); g.restore();
  },
  teahouse(g) {
    planks(g, -42, -14, 84, 8, '#8a5a32', false);
    // walls with paper lattice
    planks(g, -36, -58, 72, 44, '#b07a42');
    [[-30, -52], [8, -52]].forEach(([x, y]) => { g.fillStyle = '#fbf3df'; g.fillRect(x, y, 22, 26); g.strokeStyle = '#7a5232'; g.lineWidth = 1; for (let i = 1; i < 3; i++) { g.beginPath(); g.moveTo(x + i * 22 / 3, y); g.lineTo(x + i * 22 / 3, y + 26); g.stroke(); } for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(x, y + i * 26 / 4); g.lineTo(x + 22, y + i * 26 / 4); g.stroke(); } g.strokeStyle = INK; g.strokeRect(x, y, 22, 26); });
    g.fillStyle = '#6a3a22'; g.fillRect(-6, -40, 12, 26); g.strokeStyle = INK; g.lineWidth = 0.8; g.strokeRect(-6, -40, 12, 26);
    // curved roof with upturned eaves
    g.beginPath(); g.moveTo(-50, -54); g.quadraticCurveTo(-40, -58, -34, -66); g.lineTo(-20, -86); g.lineTo(20, -86); g.lineTo(34, -66); g.quadraticCurveTo(40, -58, 50, -54); g.quadraticCurveTo(0, -62, -50, -54);
    g.fillStyle = lgrad(g, 0, -86, 0, -54, ['#d8503a', '#a8302a']); g.fill(); stroke(g, INK, 1.1);
    g.strokeStyle = rgba('#5a1a12', 0.5); g.lineWidth = 0.7; for (let i = -4; i <= 4; i++) { g.beginPath(); g.moveTo(i * 4.5, -86); g.lineTo(i * 9.5, -58); g.stroke(); }
    planks(g, -22, -90, 44, 5, '#5a3a22', false);
    // teapot sign + lanterns
    g.save(); g.translate(0, -104); g.scale(0.45, 0.45); g.translate(-16, -20); iconCup(g, { c: '#9ac060' }); g.restore();
    [-40, 40].forEach(x => { g.beginPath(); g.moveTo(x, -55); g.lineTo(x, -50); stroke(g, INK, 0.7); ell(g, x, -45, 3.4, 5, '#e8463a', INK, 0.7); });
    blob(g, -42, -6, 5, '#3f7a3a'); blob(g, 44, -6, 5, '#5a9a4a');
  },
});

// Greenhouse: glass panels drawn without a sticker edge so the roof can be see-through.
function greenhouseSprite(open) {
  const key = 'gh_' + (open ? 1 : 0);
  if (ART.sprites[key]) return ART.sprites[key];
  const W = 4 * T, H = 4 * T, roofLift = 34;
  const s = makeSprite(W + 16, H + roofLift + 16, W / 2 + 8, H + 8, g => {
    const x0 = -W / 2, x1 = W / 2, top = -H - roofLift, eave = -46;
    const glass = open ? 0.06 : 0.5;
    // back wall + side walls (glass)
    g.fillStyle = rgba('#cdeef6', glass * 0.8);
    g.fillRect(x0, top, W, H + roofLift - 46);
    // roof panes: two slopes meeting at a ridge, seen from above-front
    const ridgeY = top + (eave - top) * 0.42;
    g.beginPath(); g.moveTo(x0, top); g.lineTo(x1, top); g.lineTo(x1, ridgeY); g.lineTo(x0, ridgeY); g.closePath(); g.fillStyle = rgba('#d8f4fa', glass * 0.9); g.fill();
    g.beginPath(); g.moveTo(x0, ridgeY); g.lineTo(x1, ridgeY); g.lineTo(x1, eave); g.lineTo(x0, eave); g.closePath(); g.fillStyle = rgba('#bfe8f4', glass); g.fill();
    // front glass wall
    g.fillStyle = rgba('#c8eef8', glass * 0.9); g.fillRect(x0, eave, W, 40);
    // reflections
    if (!open) { g.strokeStyle = rgba('#ffffff', 0.55); g.lineWidth = 5; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(x0 + 20 + i * 48, eave - 6); g.lineTo(x0 + 50 + i * 48, top + 14); g.stroke(); } }
    // frame
    const fr = (a, b, c, d, w) => { g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); stroke(g, INK, w + 1.4); g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); stroke(g, '#fbf8f0', w); };
    const fw = open ? 1.6 : 2.6;
    if (!open) {
      for (let i = 0; i <= 8; i++) fr(x0 + i * W / 8, top, x0 + i * W / 8, eave, i % 4 === 0 ? 3.2 : 1.6);
      fr(x0, ridgeY, x1, ridgeY, 3.4);
      for (let k = 1; k < 4; k++) fr(x0, top + (eave - top) * k / 4, x1, top + (eave - top) * k / 4, 1.2);
    }
    fr(x0, top, x1, top, fw); fr(x0, top, x0, -6, fw + 0.6); fr(x1, top, x1, -6, fw + 0.6); fr(x0, eave, x1, eave, fw + 0.4);
    for (let i = 1; i < 8; i++) if (!open || i % 2 === 0) fr(x0 + i * W / 8, eave, x0 + i * W / 8, -6, open ? 1 : 1.6);
    // brick footing along the front
    g.fillStyle = '#b8583a'; g.fillRect(x0, -8, W, 8); g.strokeStyle = INK; g.lineWidth = 1; g.strokeRect(x0, -8, W, 8);
    g.strokeStyle = rgba('#5a2a18', 0.6); g.lineWidth = 0.6; for (let x = x0 + 8; x < x1; x += 8) { g.beginPath(); g.moveTo(x, -8); g.lineTo(x, 0); g.stroke(); }
    // door
    g.fillStyle = rgba('#fbf8f0', open ? 0.5 : 0.9); g.fillRect(-12, eave + 2, 24, 36); g.strokeStyle = INK; g.lineWidth = 1.2; g.strokeRect(-12, eave + 2, 24, 36);
    g.fillStyle = rgba('#bfe8f4', 0.8); g.fillRect(-9, eave + 5, 18, 14);
    // vent on the ridge
    if (!open) { rrect(g, -18, ridgeY - 6, 36, 8, 2); g.fillStyle = '#fbf8f0'; g.fill(); stroke(g, INK, 1); }
  }, { sticker: false, grain: false });
  ART.sprites[key] = s;
  return s;
}
