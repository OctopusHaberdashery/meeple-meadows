// Meeple Meadows — v1.8 drawing and feel: landmark and Wonder art, passers-by, rainbows, shooting stars,
// a lost duckling, morning mist, puddles and thunder, paths worn by many feet, body language, a camera
// that can follow a Meeple, close-up sound, and extra weight on rare moments.
'use strict';

// ---------------------------------------------------------------- art: landmarks (2x2) and Wonders (3x3)
function ivy(g, pts, col) { for (const [x, y, a] of pts) leaf(g, x, y, a, 5, 2.6, col || (((x + y) | 0) % 2 ? '#4f9a3a' : '#6ab04a')); }
Object.assign(BUILD_DRAW, {
  lm_cottage(g) {
    const wall = () => { g.beginPath(); g.moveTo(-38, -4); g.lineTo(-38, -44); g.lineTo(-27, -54); g.lineTo(-16, -41); g.lineTo(-4, -50); g.lineTo(7, -35); g.lineTo(20, -40); g.lineTo(20, -4); g.closePath(); };
    g.save(); wall(); g.clip(); stoneWall(g, -38, -58, 60, 56, '#b0a898'); g.restore(); wall(); stroke(g, INK, 1);
    stoneWall(g, 20, -84, 17, 80, '#a39a8a'); g.fillStyle = '#8a8274'; g.fillRect(17, -88, 23, 5); g.strokeStyle = INK; g.lineWidth = 0.9; g.strokeRect(17, -88, 23, 5);
    rrect(g, -24, -30, 13, 26, 5); g.fillStyle = '#3a2e26'; g.fill(); stroke(g, INK, 0.9);
    g.fillStyle = '#3a2e26'; g.fillRect(-3, -33, 11, 10); g.strokeRect(-3, -33, 11, 10); g.fillStyle = '#b0a898'; g.fillRect(1.8, -33, 1.4, 10);
    [[-34, -50, 6, -24], [-20, -46, 22, -30]].forEach(([a, b, c, d]) => { g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); stroke(g, INK, 4.4); g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); stroke(g, '#8a6238', 3); });
    ivy(g, [[-38, -40, -1.2], [-36, -30, -0.6], [-39, -22, -1.4], [-33, -14, -0.4], [22, -70, 0.6], [26, -58, 1.1], [21, -46, 0.3], [30, -36, 1.3], [24, -24, 0.7], [8, -36, 0.9], [-12, -44, -0.9]]);
    [[-44, -2, 5, 3.4], [-30, 1, 4, 2.6], [10, 0, 5.5, 3.6], [42, -1, 4.4, 3]].forEach(([x, y, a, b]) => ell(g, x, y, a, b, '#a39a8a', INK, 0.7));
    ell(g, 28, -90, 1.6, 1.6, '#f6f0e0'); blob(g, -8, -2, 3, '#d8463a', 0.4, -0.3);
  },
  lm_stones(g) {
    ell(g, 0, -4, 46, 13, '#7cc25a'); ell(g, 0, -4, 30, 8, '#8ad06a');
    [[-30, -8, 13, 46, -0.08], [-9, -14, 14, 62, 0.04], [14, -11, 12, 52, -0.03], [33, -5, 12, 38, 0.1]].forEach(([x, y, w, h, tilt], k) => {
      g.save(); g.translate(x, y); g.rotate(tilt);
      rrect(g, -w / 2, -h, w, h, 5); g.fillStyle = lgrad(g, -w / 2, -h, w / 2, 0, ['#c2bcb0', '#9a9488', '#7e786e']); g.fill(); stroke(g, INK, 1);
      g.beginPath(); g.ellipse(0, -h + 3, w / 2 - 0.6, 4.4, 0, Math.PI, 0); g.fillStyle = '#6aa84a'; g.fill();
      g.strokeStyle = '#7ad8e0'; g.lineWidth = 1.1; g.beginPath();
      if (k % 2) { g.arc(0, -h * 0.55, 2.8, 0, Math.PI * 2); g.moveTo(0, -h * 0.55 - 5); g.lineTo(0, -h * 0.55 + 6); } else { g.moveTo(-2.6, -h * 0.66); g.lineTo(2.6, -h * 0.56); g.lineTo(-2.6, -h * 0.46); g.lineTo(2.6, -h * 0.36); }
      g.stroke(); g.restore();
    });
    [[-20, 2], [4, 4], [24, 3]].forEach(([x, y]) => ell(g, x, y, 4, 2.6, '#9a9488', INK, 0.6));
    [[-42, -2], [44, 0], [-2, 6]].forEach(([x, y]) => { ell(g, x, y - 3, 2.2, 2.2, '#f6f0e0', INK, 0.4); ell(g, x, y - 3, 0.9, 0.9, '#f2c23a'); });
  },
  lm_boat(g) {
    for (let k = 0; k < 7; k++) { const x = -44 + k * 5 + (k > 3 ? 62 : 0); g.beginPath(); g.moveTo(x, 2); g.quadraticCurveTo(x + 2, -16, x + (k % 2 ? 4 : -3), -30 - (k % 3) * 5); stroke(g, '#5a9a3a', 1.6); ell(g, x + (k % 2 ? 4 : -3), -31 - (k % 3) * 5, 1.5, 4, '#7a5a32', INK, 0.4); }
    g.save(); g.rotate(-0.1);
    g.beginPath(); g.moveTo(-40, -22); g.quadraticCurveTo(-34, 2, -8, 4); g.lineTo(22, 4); g.quadraticCurveTo(40, 0, 46, -24); g.closePath();
    g.fillStyle = lgrad(g, 0, -24, 0, 4, ['#c89858', '#9a6a3a']); g.fill(); stroke(g, INK, 1.1);
    g.strokeStyle = rgba('#5a3a1c', 0.6); g.lineWidth = 0.7; for (const y of [-15, -8, -1]) { g.beginPath(); g.moveTo(-36 - y * 0.25, y); g.quadraticCurveTo(0, y + 5, 43 + y * 0.2, y); g.stroke(); }
    g.beginPath(); g.moveTo(-40, -22); g.lineTo(46, -24); stroke(g, INK, 4); g.beginPath(); g.moveTo(-40, -22); g.lineTo(46, -24); stroke(g, '#e2b878', 2.4);
    g.fillStyle = '#8a5a30'; g.fillRect(-12, -22, 22, 3.4); g.strokeStyle = INK; g.lineWidth = 0.7; g.strokeRect(-12, -22, 22, 3.4);
    g.beginPath(); g.moveTo(16, -22); g.lineTo(14, -52); stroke(g, INK, 3.4); g.beginPath(); g.moveTo(16, -22); g.lineTo(14, -52); stroke(g, '#b8884a', 2);
    g.beginPath(); g.moveTo(14, -50); g.lineTo(34, -38); g.lineTo(15, -32); g.closePath(); g.fillStyle = '#e8dcc0'; g.fill(); stroke(g, INK, 0.8);
    ivy(g, [[-30, -8, -0.5], [-22, 0, 0.2], [30, -6, 0.9]], '#6aa84a'); g.restore();
    g.beginPath(); g.moveTo(-46, 4); g.lineTo(-10, -6); stroke(g, INK, 3); g.beginPath(); g.moveTo(-46, 4); g.lineTo(-10, -6); stroke(g, '#b8884a', 1.8); ell(g, -46, 4, 5, 2.4, '#b8884a', INK, 0.7);
  },
  lm_tree(g) {
    blob(g, -24, -92, 26, '#3f8a3a'); blob(g, 22, -96, 28, '#4a9a40'); blob(g, 0, -112, 28, '#57a848'); blob(g, -34, -70, 18, '#4a9a40'); blob(g, 36, -72, 19, '#3f8a3a');
    g.beginPath(); g.moveTo(-34, 2); g.quadraticCurveTo(-20, -14, -22, -50); g.quadraticCurveTo(-24, -74, -34, -84); g.lineTo(-12, -78); g.lineTo(0, -92); g.lineTo(12, -78); g.lineTo(34, -86);
    g.quadraticCurveTo(22, -72, 22, -50); g.quadraticCurveTo(20, -14, 36, 2); g.quadraticCurveTo(14, -4, 0, 2); g.quadraticCurveTo(-16, -4, -34, 2); g.closePath();
    g.fillStyle = lgrad(g, -30, 0, 30, 0, ['#8a5e34', '#a87644', '#7a5230']); g.fill(); stroke(g, INK, 1.1);
    g.strokeStyle = rgba('#4a2e14', 0.5); g.lineWidth = 0.8; for (const x of [-14, -5, 6, 15]) { g.beginPath(); g.moveTo(x, -6); g.quadraticCurveTo(x + 2, -40, x - 1, -70); g.stroke(); }
    g.beginPath(); g.moveTo(-8, 0); g.lineTo(-8, -18); g.quadraticCurveTo(0, -30, 8, -18); g.lineTo(8, 0); g.closePath(); g.fillStyle = '#c0504a'; g.fill(); stroke(g, INK, 0.9); ell(g, 4.6, -10, 1.1, 1.1, '#f2c23a', INK, 0.3);
    ell(g, 0, -46, 5.4, 5.4, '#ffe9a0', INK, 0.9); g.fillStyle = INK; g.fillRect(-0.5, -51, 1, 10); g.fillRect(-5, -46.5, 10, 1);
    [[-28, 0, '#d8463a'], [-22, 2, '#f6f0e0'], [26, 1, '#d8463a']].forEach(([x, y, c]) => { g.fillStyle = '#f6f0e0'; g.fillRect(x - 0.8, y - 4, 1.6, 4); g.beginPath(); g.ellipse(x, y - 4, 3.4, 2.4, 0, Math.PI, 0); g.fillStyle = c; g.fill(); stroke(g, INK, 0.5); });
    blob(g, -10, -104, 14, '#6ab852', 0.3, -0.2); blob(g, 14, -84, 12, '#57a848', 0.3, -0.2);
  },
  lm_shrine(g) {
    stoneWall(g, -30, -8, 60, 10, '#a8a094'); stoneWall(g, -22, -16, 44, 9, '#b0a89c');
    stoneWall(g, -11, -52, 22, 37, '#b8b0a2');
    g.beginPath(); g.moveTo(-22, -52); g.lineTo(0, -76); g.lineTo(22, -52); g.closePath(); g.fillStyle = lgrad(g, 0, -76, 0, -52, ['#8a9aa8', '#66747e']); g.fill(); stroke(g, INK, 1);
    g.beginPath(); g.moveTo(-6, -17); g.lineTo(-6, -36); g.quadraticCurveTo(0, -44, 6, -36); g.lineTo(6, -17); g.closePath(); g.fillStyle = '#3a2e26'; g.fill(); stroke(g, INK, 0.8);
    g.fillStyle = '#f6f0e0'; g.fillRect(-1.2, -24, 2.4, 7); g.strokeStyle = INK; g.lineWidth = 0.4; g.strokeRect(-1.2, -24, 2.4, 7);
    g.beginPath(); g.ellipse(-16, -18, 5, 2.4, 0, 0, Math.PI); g.fillStyle = '#c8a040'; g.fill(); stroke(g, INK, 0.7);
    g.beginPath(); g.moveTo(15, -30); g.lineTo(15, -18); stroke(g, INK, 0.8); g.beginPath(); g.moveTo(11, -18); g.quadraticCurveTo(15, -30, 19, -18); g.closePath(); g.fillStyle = '#e8b83a'; g.fill(); stroke(g, INK, 0.7);
    ivy(g, [[-24, -52, -0.8], [-18, -60, -0.3], [20, -54, 0.8], [-12, -40, -1.2], [12, -30, 1.1], [-28, -8, -0.5], [26, -10, 0.6]]);
    ell(g, 0, -77, 2.4, 2.4, '#c8a040', INK, 0.6);
    [[-38, 0], [36, 1], [-6, 4]].forEach(([x, y]) => { ell(g, x, y - 3, 2.2, 2.2, '#e8a0c0', INK, 0.4); ell(g, x, y - 3, 0.9, 0.9, '#f2c23a'); });
  },
  w_clock(g) {
    stoneWall(g, -34, -46, 68, 46, '#b0a898');
    planks(g, -24, -150, 48, 104, '#c08a52');
    g.fillStyle = '#fbf3df'; g.fillRect(-27, -150, 4, 104); g.fillRect(23, -150, 4, 104); g.fillRect(-27, -98, 54, 4); g.strokeStyle = INK; g.lineWidth = 0.8; g.strokeRect(-27, -150, 54, 104);
    g.beginPath(); g.moveTo(-34, -150); g.lineTo(0, -200); g.lineTo(34, -150); g.closePath(); g.fillStyle = lgrad(g, -30, -200, 30, -150, ['#6a86a8', '#48607e']); g.fill(); stroke(g, INK, 1.1);
    g.strokeStyle = rgba('#24344a', 0.5); g.lineWidth = 0.7; for (let y = -160; y > -196; y -= 9) { const w = (y + 200) * 0.68; g.beginPath(); g.moveTo(-w, y); g.lineTo(w, y); g.stroke(); }
    g.beginPath(); g.moveTo(0, -200); g.lineTo(0, -214); stroke(g, INK, 1.4); g.beginPath(); g.moveTo(-6, -210); g.lineTo(7, -210); g.lineTo(3, -214); stroke(g, '#c8a040', 1.6);
    ell(g, 0, -124, 18, 18, '#fff8e4', INK, 1.6); ell(g, 0, -124, 15, 15, '#fffdf2', '#c8a040', 1.2);
    g.fillStyle = INK; for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; g.fillRect(Math.sin(a) * 12.4 - 0.6, -124 - Math.cos(a) * 12.4 - 0.6, k % 3 ? 1.2 : 1.8, k % 3 ? 1.2 : 1.8); }
    rrect(g, -9, -30, 18, 30, 8); g.fillStyle = '#7a4a2a'; g.fill(); stroke(g, INK, 1); ell(g, 5, -14, 1.3, 1.3, '#f2c23a', INK, 0.3);
    [[-14, -84], [14, -84], [0, -66]].forEach(([x, y]) => { rrect(g, x - 4, y - 7, 8, 12, 4); g.fillStyle = '#ffe9a0'; g.fill(); stroke(g, INK, 0.8); });
    crate(g, -46, 0, 12, '#b8844a'); ell(g, 44, -3, 7, 5, '#a8a094', INK, 0.8);
  },
  w_hall(g) {
    stoneWall(g, -68, -12, 136, 12, '#a8a094');
    planks(g, -62, -64, 124, 52, '#c8945a');
    g.beginPath(); g.moveTo(-74, -60); g.lineTo(-46, -128); g.lineTo(46, -128); g.lineTo(74, -60); g.closePath(); g.fillStyle = lgrad(g, 0, -128, 0, -60, ['#c85a48', '#9a3a2e']); g.fill(); stroke(g, INK, 1.1);
    g.strokeStyle = rgba('#5a1e14', 0.45); g.lineWidth = 0.8; for (let y = -70; y > -124; y -= 10) { const w = 74 - (-60 - y) * 0.41; g.beginPath(); g.moveTo(-w, y); g.lineTo(w, y); g.stroke(); }
    g.beginPath(); g.moveTo(-24, -128); g.lineTo(0, -156); g.lineTo(24, -128); g.closePath(); g.fillStyle = '#b04a3a'; g.fill(); stroke(g, INK, 1); ell(g, 0, -138, 6, 6, '#ffe9a0', INK, 0.9);
    g.fillStyle = '#fbf3df'; g.fillRect(-20, -52, 40, 40); g.strokeStyle = INK; g.lineWidth = 0.9; g.strokeRect(-20, -52, 40, 40);
    planks(g, -18, -50, 17, 38, '#8a4a30'); planks(g, 1, -50, 17, 38, '#8a4a30'); ell(g, -3, -30, 1.5, 1.5, '#f2c23a', INK, 0.3); ell(g, 3, -30, 1.5, 1.5, '#f2c23a', INK, 0.3);
    [-46, -32, 32, 46].forEach(x => { rrect(g, x - 5, -48, 10, 18, 5); g.fillStyle = '#ffe9a0'; g.fill(); stroke(g, INK, 0.8); g.fillStyle = INK; g.fillRect(x - 0.4, -48, 0.8, 18); });
    [-66, 66].forEach(x => { g.beginPath(); g.moveTo(x, -12); g.lineTo(x, -170); stroke(g, INK, 3); g.beginPath(); g.moveTo(x, -12); g.lineTo(x, -170); stroke(g, '#b8884a', 1.7); ell(g, x, -171, 2.4, 2.4, '#f2c23a', INK, 0.6); });
    crate(g, -56, 0, 13, '#b8844a', '#f07a2a'); crate(g, 56, 0, 13, '#a87440', '#9fd27a'); ell(g, -38, -3, 9, 6, '#e9c25a', INK, 0.8);
  },
  w_dome(g) {
    stoneWall(g, -40, -12, 80, 12, '#a39a8a');
    g.save(); g.beginPath(); g.moveTo(-32, -12); g.lineTo(-28, -132); g.lineTo(28, -132); g.lineTo(32, -12); g.closePath(); g.clip(); stoneWall(g, -34, -134, 68, 124, '#b8b0a2'); g.restore();
    g.beginPath(); g.moveTo(-32, -12); g.lineTo(-28, -132); g.lineTo(28, -132); g.lineTo(32, -12); g.closePath(); stroke(g, INK, 1.1);
    g.fillStyle = '#8a8274'; g.fillRect(-33, -138, 66, 7); g.strokeStyle = INK; g.lineWidth = 0.9; g.strokeRect(-33, -138, 66, 7);
    g.beginPath(); g.ellipse(0, -138, 31, 40, 0, Math.PI, 0); g.closePath(); g.fillStyle = lgrad(g, -30, -178, 30, -138, ['#8ad0b8', '#4f9a86', '#3a7a6a']); g.fill(); stroke(g, INK, 1.1);
    g.strokeStyle = rgba('#1e4a40', 0.5); g.lineWidth = 0.8; for (const x of [-18, -6, 20]) { g.beginPath(); g.moveTo(x, -138); g.quadraticCurveTo(x * 0.9, -164, x * 0.3, -177); g.stroke(); }
    g.beginPath(); g.moveTo(4, -138); g.quadraticCurveTo(6, -166, 10, -175); g.lineTo(18, -170); g.quadraticCurveTo(15, -158, 14, -138); g.closePath(); g.fillStyle = '#1e2a3a'; g.fill(); stroke(g, INK, 0.8);
    g.save(); g.translate(11, -160); g.rotate(-0.75); rrect(g, 0, -3.4, 34, 6.8, 2); g.fillStyle = lgrad(g, 0, -3, 0, 3, ['#f2d27a', '#b8903a']); g.fill(); stroke(g, INK, 0.9); rrect(g, 30, -4.6, 7, 9.2, 2); g.fillStyle = '#d8b04a'; g.fill(); stroke(g, INK, 0.9); g.restore();
    rrect(g, -9, -40, 18, 28, 9); g.fillStyle = '#6a4a8a'; g.fill(); stroke(g, INK, 1); ell(g, 5, -24, 1.3, 1.3, '#f2c23a', INK, 0.3);
    [[-14, -70], [12, -92], [-10, -114]].forEach(([x, y]) => { ell(g, x, y, 5, 6.5, '#ffe9a0', INK, 0.9); g.fillStyle = INK; g.fillRect(x - 0.4, y - 6.5, 0.8, 13); });
    for (let k = 0; k < 4; k++) { g.fillStyle = '#a39a8a'; g.fillRect(34 + k * 5, -4 - k * 4, 8, 4 + k * 4); g.strokeStyle = INK; g.lineWidth = 0.6; g.strokeRect(34 + k * 5, -4 - k * 4, 8, 4 + k * 4); }
    ell(g, -46, -3, 6, 4, '#a39a8a', INK, 0.7);
  },
});

// ---------------------------------------------------------------- extra emotes
const _de7 = drawEmote;
drawEmote = function (ctx, x, y, k, a) {
  if (k !== 'sweat' && k !== 'wave' && k !== 'sun') { _de7(ctx, x, y, k, a); return; }
  _de7(ctx, x, y, '', a);
  ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y - 8.6);
  if (k === 'sweat') { ctx.beginPath(); ctx.moveTo(0, -4.4); ctx.quadraticCurveTo(4, 1, 0, 3.2); ctx.quadraticCurveTo(-4, 1, 0, -4.4); ctx.fillStyle = '#5ab0e8'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 0.5; ctx.stroke(); }
  else if (k === 'sun') { ctx.strokeStyle = '#e8a020'; ctx.lineWidth = 1; ctx.beginPath(); for (let i = 0; i < 8; i++) { const an = i / 8 * Math.PI * 2; ctx.moveTo(Math.cos(an) * 3.2, Math.sin(an) * 3.2); ctx.lineTo(Math.cos(an) * 4.8, Math.sin(an) * 4.8); } ctx.stroke(); ell(ctx, 0, 0, 2.6, 2.6, '#f6c81a', INK, 0.4); }
  else { ctx.rotate(Math.sin(R.time * 12) * 0.3); ell(ctx, 0, 0.6, 2.8, 3, '#f2d2a0', INK, 0.5); ctx.strokeStyle = '#f2d2a0'; ctx.lineCap = 'round'; ctx.lineWidth = 1.5; ctx.beginPath(); for (const dx of [-2, 0, 2]) { ctx.moveTo(dx, -1.4); ctx.lineTo(dx * 1.3, -4.6); } ctx.stroke(); }
  ctx.restore();
};

// ---------------------------------------------------------------- things added to the scene: hidden landmarks, passers-by, the duckling
function hiddenLmDrawer(l) {
  return function (ctx, t) {
    const s = buildingSprite(l.id), bx = (l.x + 1) * T, by = (l.y + 2) * T, near = lmReachable(l);
    ctx.globalAlpha = near ? 0.95 : 0.8; drawSprite(ctx, s, bx, by - 4); ctx.globalAlpha = 1;
    // undergrowth crowding its feet
    for (let k = 0; k < 3; k++) drawSprite(ctx, treeSprite('bush', (k + l.x) % 2, R.season), bx - 36 + k * 36, by + 6 - (k === 1 ? 3 : 0), 0.95);
    if (near) {
      const y = by - 112 + Math.sin(t * 4) * 2.5;
      ctx.beginPath(); ctx.arc(bx, y, 9, 0, Math.PI * 2); ctx.fillStyle = '#5aa335'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.1; ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('?', bx, y + 0.6);
    } else if (Math.random() < 0.02 * R.q.parts) addPart({ type: 'spark', x: bx + (Math.random() - 0.5) * 60, y: by - 30 - Math.random() * 60, max: 1, size: 4 });
  };
}
function drawDuckling(ctx, t) {
  const d = SURP.duck; if (!d) return;
  ell(ctx, d.x, d.y + 1, 5, 2, 'rgba(20,30,10,0.25)');
  ctx.save(); ctx.translate(d.x, d.y + (d.st === 'home' ? -Math.abs(Math.sin(d.bob * 10)) * 2 : 0)); ctx.scale(0.55, 0.55); drawDuck(ctx, 0, 0, d.face, t * (d.st === 'home' ? 2 : 0.6), false); ctx.restore();
  if (d.st === 'lost') { const y = d.y - 20 + Math.sin(t * 5) * 1.5; ctx.beginPath(); ctx.arc(d.x, y, 6.5, 0, Math.PI * 2); ctx.fillStyle = '#fffaf0'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 0.9; ctx.stroke(); ctx.fillStyle = '#e8463a'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('?', d.x, y + 0.5); }
}
const _col7 = FX.collect;
FX.collect = function (list, x0, y0, x1, y1) {
  _col7(list, x0, y0, x1, y1);
  const vis = (x, y, m) => x > x0 - m && x < x1 + m && y > y0 - m && y < y1 + m * 1.6;
  for (const l of S.landmarks || []) if (!l.found && vis((l.x + 1) * T, (l.y + 1) * T, 120)) list.push({ y: (l.y + 2) * T - 2, k: 6, f: hiddenLmDrawer(l) });
  for (const w of WALKERS) if (w.t >= 0 && vis(w.x, w.y, 60)) list.push({ y: w.y + 6, k: 3, m: w });
  const d = SURP.duck; if (d && vis(d.x, d.y, 40)) list.push({ y: d.y + 3, k: 6, f: drawDuckling });
};

// ---------------------------------------------------------------- buildings: crates by the storehouse, wares on the stall, living Wonders
let _stock = 0, _stockT = -9, _wares = [];
function lanternOn(b, night) {
  const thr = 0.08 + hash2(b.id, 7, 3) * 0.42, on = night > thr, L = FX.lamps || (FX.lamps = {});
  if (on && L[b.id] === false) { AUDIO.sfx('lamp'); const d = BUILDINGS[b.type]; addPart({ type: 'spark', x: (b.x + d.w / 2) * T + 8, y: (b.y + d.h) * T - 41, max: 0.6, size: 6 }); }
  L[b.id] = on;
  return Math.max(0, Math.min(1, (night - thr) / 0.1)) * night;
}
const _db7 = drawBuilding;
drawBuilding = function (ctx, b, t, dt) {
  _db7(ctx, b, t, dt);
  if (b.of) return;
  const d = BUILDINGS[b.type], bx = (b.x + d.w / 2) * T, by = (b.y + d.h) * T, night = sunInfo().night;
  switch (b.type) {
    case 'storehouse': {
      if (R.time - _stockT > 2) { _stockT = R.time; _stock = 0; for (const k in S.inv) _stock += S.inv[k] || 0; _wares = Object.keys(S.soldBy || {}).filter(k => ITEM[k] && ART.icons[k]).sort((a, c) => S.soldBy[c] - S.soldBy[a]).slice(0, 3); }
      const n = Math.max(0, Math.min(7, Math.floor(Math.log2(Math.max(1, _stock / 25)))));
      for (let k = 0; k < n; k++) {
        const col = k % 3, row = (k / 3) | 0, x = bx - 44 - col * 11 + row * 5, y = by + 3 - row * 10 - (col === 1 ? 1 : 0), s = 10;
        ctx.fillStyle = k % 2 ? '#b8844a' : '#a87440'; ctx.fillRect(x - s / 2, y - s, s, s); ctx.strokeStyle = INK; ctx.lineWidth = 0.8; ctx.strokeRect(x - s / 2, y - s, s, s);
        ctx.beginPath(); ctx.moveTo(x - s / 2, y - s); ctx.lineTo(x + s / 2, y); ctx.strokeStyle = 'rgba(61,42,31,0.5)'; ctx.lineWidth = 0.6; ctx.stroke();
      }
      break;
    }
    case 'market':
      // the three things that have earned the most sit out on the counter
      _wares.forEach((id, k) => drawSprite(ctx, ART.icons[id], bx - 29 + k * 21 + 1, by - 34 + Math.sin(t * 2 + k) * 0.6, 0.5));
      break;
    case 'w_clock': {
      const a1 = S.day * Math.PI * 4, a2 = S.day * Math.PI * 48, cy = by - 124;
      ctx.lineCap = 'round'; ctx.strokeStyle = INK;
      ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(bx, cy); ctx.lineTo(bx + Math.sin(a1) * 7.5, cy - Math.cos(a1) * 7.5); ctx.stroke();
      ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(bx, cy); ctx.lineTo(bx + Math.sin(a2) * 11.5, cy - Math.cos(a2) * 11.5); ctx.stroke();
      ell(ctx, bx, cy, 1.5, 1.5, '#c8a040', INK, 0.4);
      break;
    }
    case 'w_hall':
      for (const sx of [-66, 66]) {
        const w = windAt(bx + sx, by, t), dir = w >= 0 ? 1 : -1, len = 22 + Math.min(8, Math.abs(w) * 8);
        ctx.beginPath(); ctx.moveTo(bx + sx, by - 168);
        ctx.quadraticCurveTo(bx + sx + dir * len * 0.5, by - 172 + Math.sin(t * 6 + sx) * 3, bx + sx + dir * len, by - 163 + Math.sin(t * 6 + sx + 1) * 2.5);
        ctx.lineTo(bx + sx + dir * len * 0.7, by - 157 + Math.sin(t * 6 + sx + 2) * 2); ctx.lineTo(bx + sx, by - 152); ctx.closePath();
        ctx.fillStyle = sx < 0 ? '#d8463a' : '#f2c23a'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 0.9; ctx.stroke();
      }
      break;
    case 'w_dome':
      if (night > 0.3) for (let k = 0; k < 3; k++) { const ph = (t * 0.5 + k * 0.37) % 1; ctx.globalAlpha = Math.sin(ph * Math.PI) * night; drawSprite(ctx, ART.icons.ui_star, bx + 26 + k * 12 - 8, by - 190 - k * 9, 0.2 + k * 0.03); } ctx.globalAlpha = 1;
      break;
    case 'lm_stones':
      if (night > 0.1) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(bx, by - 30, 2, bx, by - 30, 52); g.addColorStop(0, `rgba(110,220,230,${(0.28 * night * (0.7 + 0.3 * Math.sin(t * 1.6))).toFixed(3)})`); g.addColorStop(1, 'rgba(110,220,230,0)'); ctx.fillStyle = g; ctx.fillRect(bx - 56, by - 84, 112, 100); ctx.restore(); }
      break;
    case 'lm_shrine': flame(ctx, bx, by - 24, t, 0.34); break;
    case 'lm_cottage': if (Math.random() < 0.012 * R.q.parts) addPart({ type: 'leaf', x: bx - 30 + Math.random() * 60, y: by - 60, vy: 12, max: 3, col: '#6ab04a', size: Math.random() * 6 }); break;
  }
};

// ---------------------------------------------------------------- the ground: worn paths, footprints and puddles
FX.prints = []; FX.puddle = 0;
const _gr7 = FX.ground;
FX.ground = function (ctx, t, dt, tx0, ty0, tx1, ty1, z) {
  _gr7(ctx, t, dt, tx0, ty0, tx1, ty1, z);
  // where Meeples walk most, the grass wears down to earth
  const tr = S.tread;
  if (tr) for (const k in tr) {
    const v = tr[k]; if (v < 7) continue;
    const i = +k, x = i % MW, y = (i / MW) | 0;
    if (x < tx0 || x > tx1 || y < ty0 || y > ty1 || S.floor[i] !== FLOOR.GRASS || OCC[i] || S.cover[i]) continue;
    ctx.globalAlpha = Math.min(0.62, (v - 7) / 45);
    ctx.beginPath(); ctx.ellipse(x * T + T / 2 + (hash2(x, y, 61) - 0.5) * 6, y * T + T / 2 + (hash2(x, y, 62) - 0.5) * 6, 27, 21, 0, 0, Math.PI * 2); ctx.fillStyle = '#b89a68'; ctx.fill();
  }
  ctx.globalAlpha = 1;
  // puddles gather while it rains and dry up afterwards
  const raining = S.weather && S.weather.rain > 0;
  FX.puddle = Math.max(0, Math.min(1, FX.puddle + (raining ? dt / 25 : -dt / 70)));
  if (FX.puddle > 0.02 && z > 0.6) for (let y = ty0; y <= ty1; y++) for (let x = tx0; x <= tx1; x++) {
    const i = idx(x, y); if (hash2(x, y, 77) > 0.075 || S.cover[i] || OCC[i] || S.floor[i] === FLOOR.PLOT) continue;
    const px = x * T + 12 + hash2(x, y, 78) * 22, py = y * T + 20 + hash2(x, y, 79) * 16, a = FX.puddle;
    ctx.globalAlpha = 0.55 * a; ctx.beginPath(); ctx.ellipse(px, py, 13 * (0.5 + a * 0.5), 6 * (0.5 + a * 0.5), 0, 0, Math.PI * 2); ctx.fillStyle = '#6f9cba'; ctx.fill();
    ctx.globalAlpha = 0.5 * a; ctx.beginPath(); ctx.ellipse(px - 3, py - 1.5, 6 * a, 1.6 * a, 0, 0, Math.PI * 2); ctx.fillStyle = '#d8ecf6'; ctx.fill();
    if (raining && Math.random() < dt * 1.5) FX.ripple(px + (Math.random() - 0.5) * 14, py + (Math.random() - 0.5) * 5, false);
  }
  ctx.globalAlpha = 1;
  // footprints across damp soil and puddles splashing underfoot
  for (const m of S.meeples) {
    if (!m.moving) continue;
    const i = tileOf(m), p = S.plots[i];
    if (p && (p.wet || p.gh) && Math.random() < dt * 5 && FX.prints.length < 140) FX.prints.push({ x: m.x + (Math.random() - 0.5) * 6, y: m.y + 3, t: 0 });
    if (FX.puddle > 0.3 && !p) { const x = i % MW, y = (i / MW) | 0; if (hash2(x, y, 77) <= 0.075 && Math.abs(m.x - (x * T + 12 + hash2(x, y, 78) * 22)) < 11 && Math.abs(m.y - (y * T + 20 + hash2(x, y, 79) * 16)) < 7 && Math.random() < dt * 9) { for (let k = 0; k < 4; k++) addPart({ type: 'drop', x: m.x + (Math.random() - 0.5) * 8, y: m.y, vx: (Math.random() - 0.5) * 60, vy: -40 - Math.random() * 40, g: 260, max: 0.45, size: 1.4 }); AUDIO.sfx('plop'); } }
  }
  for (let k = FX.prints.length - 1; k >= 0; k--) {
    const q = FX.prints[k]; q.t += dt; if (q.t > 16) { FX.prints.splice(k, 1); continue; }
    ctx.globalAlpha = 0.32 * (1 - q.t / 16); ctx.beginPath(); ctx.ellipse(q.x, q.y, 1.9, 1.2, 0, 0, Math.PI * 2); ctx.fillStyle = '#2a1a0e'; ctx.fill();
  }
  ctx.globalAlpha = 1;
};

// ---------------------------------------------------------------- the air: gusts of leaves, thunder, high-fives
FX.thunderT = 30; FX.fiveT = 0; FX.waved = {}; FX.stretch = {};
const _air7 = FX.air;
FX.air = function (ctx, t, dt, x0, y0, x1, y1) {
  _air7(ctx, t, dt, x0, y0, x1, y1);
  // the gust front drags a scatter of leaves along with it
  const span = (MW * T + 900) * 0.8, gx = ((t * 150) % span) - 450;
  if (gx > x0 - 60 && gx < x1 + 60 && Math.random() < dt * 7 * R.q.parts) addPart({ type: 'gleaf', x: gx - 30 + Math.random() * 60, y: y0 + Math.random() * (y1 - y0), vx: 150 + Math.random() * 50, vy: 6 + Math.random() * 14, max: 1.8 + Math.random(), col: ['#7cc25a', '#5aa84a', '#c8b04a', '#e8902a'][(Math.random() * 4) | 0], size: Math.random() * 6 });
  if (S.weather && S.weather.rain > 0 && UI.inGame && (FX.thunderT -= dt) <= 0) {
    FX.thunderT = 28 + Math.random() * 50; FX.flash(0.16);
    setTimeout(() => AUDIO.sfx('thunder'), 500 + Math.random() * 700);
    for (const m of S.meeples) if (Math.random() < 0.25) m.emo = { k: 'wow', t: 1.6 };
  }
  if ((FX.fiveT -= dt) > 0) return;
  FX.fiveT = 0.3;
  // two Meeples passing each other slap hands; anyone passing the visitor gives a wave
  const ms = S.meeples;
  if (R.time - (FX.lastFive || 0) > 7) for (let a = 0; a < ms.length; a++) {
    const m = ms[a]; if (!m.moving || m.x < x0 || m.x > x1 || m.y < y0 || m.y > y1) continue;
    for (let b = a + 1; b < ms.length; b++) {
      const o = ms[b]; if (!o.moving || o.face === m.face || Math.abs(o.x - m.x) > 13 || Math.abs(o.y - m.y) > 7) continue;
      FX.lastFive = R.time; FX.hop[m.id] = R.time; FX.hop[o.id] = R.time; AUDIO.sfx('clap');
      for (let k = 0; k < 4; k++) addPart({ type: 'spark', x: (m.x + o.x) / 2 + (Math.random() - 0.5) * 8, y: m.y - 22 - Math.random() * 6, max: 0.5, size: 4 });
      a = ms.length; break;
    }
  }
  const v = FX.vpos;
  if (v) for (const m of ms) if (m.moving && Math.abs(m.x - v.x) < 60 && Math.abs(m.y - v.y) < 50 && R.time - (FX.waved[m.id] || -99) > 50) { FX.waved[m.id] = R.time; m.emo = { k: 'wave', t: 1.8 }; }
};

// ---------------------------------------------------------------- body language
const _gp7 = gaitPose;
gaitPose = function (m) {
  const P = _gp7(m);
  // a full load is heavy going
  if (m.moving && m.hand.length >= Math.max(4, mCarry(m) * 0.75) && m.gait !== 'float') { P.tilt += 0.13 * m.face; P.bob *= 0.6; }
  const st = FX.stretch[m.id];
  if (st != null) { const f = (R.time - st) / 1.3; if (f >= 1 || f < 0) delete FX.stretch[m.id]; else if (!m.moving) { const k = Math.sin(f * Math.PI); P.sq = 1 + k * 0.14; P.tilt = Math.sin(f * Math.PI * 2) * 0.1; P.fr = -1; } }
  return P;
};
// a Meeple with a wish carries it around in a thought bubble
const _dm7 = drawMeeple;
drawMeeple = function (ctx, m, t) {
  _dm7(ctx, m, t);
  const w = S.wish; if (!w || w.m !== m.id || m.emo) return;
  const P = _gp7(m), x = m.x + 12, y = m.y - 44 - P.bob - P.lift + Math.sin(t * 2) * 1.2;
  ell(ctx, m.x + 5, m.y - 31 - P.bob, 1.4, 1.4, '#fffaf0', INK, 0.5); ell(ctx, m.x + 8, m.y - 35 - P.bob, 2.1, 2.1, '#fffaf0', INK, 0.5);
  ctx.beginPath(); for (const [dx, dy, r] of [[-5, 1, 6], [0, -3, 7.5], [6, 0, 6], [1, 3, 6.5]]) { ctx.moveTo(x + dx + r, y + dy); ctx.arc(x + dx, y + dy, r, 0, Math.PI * 2); }
  ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.stroke(); ctx.fillStyle = '#fffaf0'; ctx.fill();
  const ic = w.k === 'hat' ? ART.icons['ui_hat_' + w.a] : w.k === 'crop' ? ART.icons[w.a] : null;
  if (ic) drawSprite(ctx, ic, x - 8, y - 9, 0.5); else drawSprite(ctx, buildingSprite(w.a), x + 0.5, y + 9, 0.3);
};

// ---------------------------------------------------------------- the sky (screen space): rainbow, shooting star, morning mist
const RB_COL = ['#e8463a', '#f08a3a', '#f2c23a', '#5aa335', '#4f8ad8', '#8a6ab0'];
const _scr7 = FX.screen;
FX.screen = function (ctx, dt) {
  const W = R.cv.width, H = R.cv.height, pr = R.pr;
  if (UI.inGame) {
    // mist lying over the meadow around dawn
    const dm = R.dayNight ? Math.max(0, 1 - Math.abs(S.day - 0.27) / 0.07) : 0;
    if (dm > 0.02 && R.q.lights) for (let k = 0; k < 3; k++) {
      const cx = ((R.time * (9 + k * 5) * pr + k * W * 0.4) % (W * 1.6)) - W * 0.3, cy = H * (0.3 + k * 0.24), g = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.55);
      g.addColorStop(0, `rgba(255,255,255,${(0.2 * dm).toFixed(3)})`); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.save(); ctx.translate(0, cy); ctx.scale(1, 0.28); ctx.translate(0, -cy); ctx.fillStyle = g; ctx.fillRect(cx - W * 0.55, cy - W * 0.55, W * 1.1, W * 1.1); ctx.restore();
    }
    const rb = SURP.rainbow;
    if (rb) {
      const a = Math.min(1, rb.t / 3, (rb.max - rb.t) / 4) * (rb.got ? 0.75 : 0.5), cx = W * 0.5, cy = H * 1.08, r0 = H * 0.92, bw = 7 * pr;
      FX.rb = { cx: cx / pr, cy: cy / pr, r0: (r0 - bw * 7) / pr, r1: (r0 + bw) / pr };
      ctx.lineWidth = bw + 0.6;
      RB_COL.forEach((c, k) => { ctx.beginPath(); ctx.arc(cx, cy, r0 - k * bw, Math.PI * 1.08, Math.PI * 1.92); ctx.strokeStyle = rgba(c, a); ctx.stroke(); });
      if (!rb.got && Math.random() < dt * 3) { const an = Math.PI * (1.15 + Math.random() * 0.7), p = R.screenToWorld((cx + Math.cos(an) * (r0 - 3 * bw)) / pr, (cy + Math.sin(an) * (r0 - 3 * bw)) / pr); addPart({ type: 'spark', x: p.x, y: p.y, max: 0.9, size: 5 }); }
    } else FX.rb = null;
    const st = SURP.star;
    if (st) {
      const f = Math.min(1, st.t / st.fly), e = 1 - Math.pow(1 - f, 2), x = (st.x0 + st.dx * e) * W, y = (st.y0 + st.dy * e) * H, fade = Math.min(1, (st.max - st.t) / 1.5);
      FX.star = { x: x / pr, y: y / pr };
      if (f < 1) { const g = ctx.createLinearGradient(x, y, x - st.dx * W * 0.22, y - st.dy * H * 0.22); g.addColorStop(0, 'rgba(255,250,210,0.95)'); g.addColorStop(1, 'rgba(255,250,210,0)'); ctx.strokeStyle = g; ctx.lineWidth = 3 * pr; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - st.dx * W * 0.22, y - st.dy * H * 0.22); ctx.stroke(); }
      if (!st.got) {
        const tw = 0.7 + 0.3 * Math.sin(R.time * 14), r = (f < 1 ? 7 : 11) * pr * tw;
        ctx.globalAlpha = fade; ctx.fillStyle = '#fffbe0'; ctx.beginPath();
        for (let i = 0; i < 8; i++) { const rr = i % 2 ? r * 0.32 : r, an = i / 8 * Math.PI * 2 + R.time; ctx.lineTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr); }
        ctx.closePath(); ctx.fill();
        const g = ctx.createRadialGradient(x, y, 0, x, y, r * 3.2); g.addColorStop(0, 'rgba(255,245,180,0.5)'); g.addColorStop(1, 'rgba(255,245,180,0)'); ctx.fillStyle = g; ctx.fillRect(x - r * 3.2, y - r * 3.2, r * 6.4, r * 6.4); ctx.globalAlpha = 1;
      }
    } else FX.star = null;
  }
  _scr7(ctx, dt);
};

// ---------------------------------------------------------------- camera: follow a Meeple, springy zoom limits, and what you hear up close
FX.follow = null; FX.mixT = 0;
const _drag7 = FX.drag;
FX.drag = function (dx, dy) { FX.follow = null; _drag7(dx, dy); };
const _cam7 = FX.cam;
FX.cam = function (dt) {
  _cam7(dt);
  const c = R.cam;
  if (FX.follow != null) {
    const m = UI.inGame ? S.meeples.find(x => x.id === FX.follow) : null;
    if (!m) FX.follow = null; else if (!FX.camJob) { const k = Math.min(1, dt * 4.5); c.x += (m.x - c.x) * k; c.y += (m.y - 14 - c.y) * k; R.clampCam(); }
  }
  // the zoom gives a little past its limits and springs back when you let go
  if (PTR.size < 2 && !FX.punch && !FX.camJob) {
    if (c.z < 0.45) c.z = 0.45 - c.z < 0.002 ? 0.45 : c.z + (0.45 - c.z) * Math.min(1, dt * 9);
    else if (c.z > 2.6) c.z = c.z - 2.6 < 0.004 ? 2.6 : c.z + (2.6 - c.z) * Math.min(1, dt * 9);
  }
  if ((FX.mixT -= dt) > 0) return;
  FX.mixT = 0.25;
  const raining = S.weather && S.weather.rain > 0;
  AUDIO.rain = Math.max(0, Math.min(1, (AUDIO.rain || 0) + (raining && UI.inGame ? 0.08 : -0.06)));
  const zf = UI.inGame ? Math.max(0, Math.min(1, (c.z - 1.25) / 0.9)) : 0;
  AUDIO.setZoom(zf);
  if (zf < 0.03) { AUDIO.closeMix = null; return; }
  const M = { mill: 0, bubble: 0, fire: 0, hens: 0, cow: 0, bees: 0, water: 0, steps: 0, hammer: 0 }, rad = T * 5.5 / c.z + T;
  const near = (x, y) => Math.max(0, 1 - Math.hypot(x - c.x, y - c.y) / rad) * zf, add = (k, v) => { if (v > M[k]) M[k] = v; };
  for (const b of S.buildings) {
    const d = BUILDINGS[b.type], w = near((b.x + d.w / 2) * T, (b.y + d.h / 2) * T); if (w <= 0.03) continue;
    const work = b.phase === 'work';
    if (b.of) { if (SITE_N[b.id]) add('hammer', w); continue; }
    switch (b.type) {
      case 'mill': add('mill', w * (work ? 1 : 0.35)); break;
      case 'pot': case 'kettle': case 'still': case 'teahouse': if (work) add('bubble', w); add('fire', w * (work ? 1 : 0.4)); break;
      case 'oven': case 'smokehouse': case 'chandlery': add('fire', w * (work ? 1 : 0.4)); break;
      case 'coop': add('hens', w); break;
      case 'barn': add('cow', w); break;
      case 'hive': add('bees', w); break;
      case 'fountain': case 'well': case 'dock': case 'duckhouse': case 'birdbath': add('water', w); break;
    }
  }
  let steps = 0; for (const m of S.meeples) if (m.moving) steps += near(m.x, m.y) * 0.4;
  M.steps = Math.min(1, steps);
  AUDIO.closeMix = M;
};

// ---------------------------------------------------------------- rare moments land harder
FX.rare = function (x, y) {
  if (R.time - (FX.rareT || -99) < 10) return;
  const s = R.worldToScreen(x, y); if (s.x < 0 || s.y < 0 || s.x > R.W || s.y > R.H) return;
  FX.rareT = R.time; if (UI.inGame) UI.hush = 0.11;
  FX.zoomPunch(0.03); AUDIO.sfx('rare');
  addPart({ type: 'ring', x, y: y - 12, max: 0.6, size: 30 }); addPart({ type: 'ring', x, y: y - 12, max: 0.9, size: 46, col: '#ffe48a' });
  for (let k = 0; k < 14; k++) { const a = k / 14 * Math.PI * 2; addPart({ type: 'spark', x: x + Math.cos(a) * 6, y: y - 14 + Math.sin(a) * 4, vx: Math.cos(a) * 60, vy: Math.sin(a) * 36 - 10, max: 0.8, size: 5 }); }
};
const _oe7 = R.onEvent;
R.onEvent = function (e) {
  switch (e.t) {
    case 'harvest': { const x = (e.i % MW) * T + T / 2, y = ((e.i / MW) | 0) * T + T / 2; if (e.n >= 3) FX.rare(x, y); else if (e.n === 2) addPart({ type: 'ring', x, y: y - 8, max: 0.45, size: 18 }); break; }
    case 'catch': if (e.m && FISHMAP[e.fish] && ['rare', 'epic', 'legendary'].includes(FISHMAP[e.fish].rar)) FX.rare(e.m.x, e.m.y); break;
    case 'find': if (e.what === 'relic' || e.what === 'hat') FX.rare((e.i % MW) * T + T / 2, ((e.i / MW) | 0) * T + T / 2); break;
    case 'deposit': if (e.items && e.items.length >= 5) { let best = null, bd = 30; for (const m of S.meeples) { const d = Math.hypot(m.x - e.x, m.y - e.y); if (d < bd) { bd = d; best = m; } } if (best && Math.random() < 0.5) best.emo = { k: 'sweat', t: 1.6 }; } break;
    case 'dawn': {
      AUDIO.sfx('rooster');
      for (const m of S.meeples) { FX.stretch[m.id] = R.time + Math.random() * 0.8; if (Math.random() < 0.3) m.emo = { k: 'sun', t: 2 }; }
      const ck = S.buildings.find(b => b.type === 'w_clock');
      if (ck) setTimeout(() => { AUDIO.sfx('chime'); for (let k = 0; k < 8; k++) addPart({ type: 'spark', x: (ck.x + 1.5) * T + (Math.random() - 0.5) * 40, y: (ck.y + 3) * T - 110 - Math.random() * 40, max: 1.2, size: 5 }); }, 1500);
      break;
    }
    case 'landmark': {
      const bx = (e.x + 1) * T, by = (e.y + 2) * T, b = S.buildings.find(o => o.type === e.id);
      if (b) FX.pop('b' + b.id, 'bounce', 0.9, 0.2);
      dustRing(bx, by, 110, 16);
      for (let k = 0; k < 22; k++) addPart({ type: 'spark', x: bx + (Math.random() - 0.5) * 100, y: by - 10 - Math.random() * 90, max: 1.2 + Math.random() * 0.5, size: 5 + Math.random() * 3 });
      for (let k = 0; k < 10; k++) addPart({ type: 'leaf', x: bx + (Math.random() - 0.5) * 90, y: by - 30 - Math.random() * 50, vy: 16, max: 2.6, col: ['#7cc25a', '#5aa84a'][k % 2], size: Math.random() * 6 });
      AUDIO.sfx('rare'); AUDIO.sfx('thud'); R.groundDirtyAll();
      break;
    }
    case 'wstage': { const b = BMAP[e.b]; if (b) { const d = BUILDINGS[b.type], bx = (b.x + d.w / 2) * T, by = (b.y + d.h) * T; for (let k = 0; k < 14; k++) addPart({ type: 'spark', x: bx + (Math.random() - 0.5) * d.w * T, y: by - 10 - Math.random() * 70, max: 1, size: 5 }); AUDIO.sfx('buy'); } break; }
    case 'tip': addPart({ type: 'float', x: e.x + 8, y: e.y - 30, vy: -24, max: 1.6, icon: 'ui_coin', text: '+' + fmt(e.v) }); break;
    case 'band': FX.cheerAll(24); if (AUDIO.ctx) AUDIO.band = AUDIO.ctx.currentTime + 26; break;
    case 'wishdone': { const m = S.meeples.find(x => x.id === e.m); if (m) { FX.cheer[m.id] = R.time + 2.2; m.emo = { k: 'heart', t: 2.4 }; for (let k = 0; k < 8; k++) addPart({ type: 'spark', x: m.x + (Math.random() - 0.5) * 24, y: m.y - 16 - Math.random() * 24, max: 1, size: 5 }); } AUDIO.sfx('wish'); break; }
    case 'wish': AUDIO.sfx('wish'); break;
    case 'star': AUDIO.sfx('twinkle'); break;
    case 'duckling': AUDIO.sfx('peep'); break;
    case 'surprise': if (e.x != null) { FX.ripple(e.x, e.y + 14, true); for (let k = 0; k < 8; k++) addPart({ type: 'drop', x: e.x + (Math.random() - 0.5) * 10, y: e.y + 8, vx: (Math.random() - 0.5) * 70, vy: -50 - Math.random() * 40, g: 260, max: 0.6, size: 1.5 }); AUDIO.sfx('splash'); } AUDIO.sfx('rare'); break;
  }
  _oe7(e);
};
;(window.__stage = window.__stage || []).push('fx2.js loaded');
