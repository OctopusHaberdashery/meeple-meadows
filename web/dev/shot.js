// Dev-only: composite the game canvas + DOM UI into one PNG and POST it to the dev server.
window.uiShot = async function (name) {
  const W = innerWidth, H = innerHeight;
  const css = [...document.querySelectorAll('style')].map(s => s.textContent).join('\n').replace(/:root\{/g, ':root,.shotroot{') + ' *{animation:none!important}';
  const clone = document.body.cloneNode(true);
  clone.querySelectorAll('canvas,script').forEach(n => n.remove());
  const html = new XMLSerializer().serializeToString(clone);
  const fs = getComputedStyle(document.documentElement).fontSize;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><foreignObject width="100%" height="100%">
    <div class="shotroot" xmlns="http://www.w3.org/1999/xhtml" style="width:${W}px;height:${H}px;position:relative;font-size:${fs}"><style><![CDATA[${css} html,body{background:transparent!important} body{margin:0}]]></style>${html.replace(/^<body[^>]*>|<\/body>$/g, '')}</div></foreignObject></svg>`;
  const img = new Image();
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  await img.decode();
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.drawImage(R.cv, 0, 0, W, H);
  g.drawImage(img, 0, 0);
  await fetch('/' + name, { method: 'POST', body: c.toDataURL() });
  return 'ok';
};
