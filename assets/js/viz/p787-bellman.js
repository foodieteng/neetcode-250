/* ============================================================
   P787 Cheapest Flights Within K Stops — 寫法 A · Bellman-Ford（temp 快照）
   跑 k+1 輪；每輪開頭把 dist 凍結成 temp，本輪所有鬆弛都讀 temp。
   ⇒ 一輪最多多用「1 條邊」，剛好對應「多 1 次中轉」。
   Sample: n=4, edges [0→1:100,1→2:100,2→0:100,1→3:600,2→3:200],
           src=0, dst=3, k=1  ⇒  答案 700。
   核心教學點：第 1 輪算 dist[3] 時，2→3 想用 temp[2]，但 temp[2]=∞
   （本輪凍結），所以 dist[3]=700 而非 300 —— 這正是 temp 的作用。
   Canvas prefix: va-
   ============================================================ */

(function () {
  const canvas = document.getElementById('va-canvas');
  if (!canvas) return;

  const ctx      = canvas.getContext('2d');
  const stepEl   = document.getElementById('va-step');
  const labelEl  = document.getElementById('va-label');
  const btnPrev  = document.getElementById('va-prev');
  const btnNext  = document.getElementById('va-next');
  const btnPlay  = document.getElementById('va-play');
  const btnReset = document.getElementById('va-reset');

  const COLOR = {
    paper:  '#ffffff',
    grid:   '#cfcfcf',
    node:   '#e3edf5',
    nodeSt: '#8fb3d4',
    src:    '#d9e8c7',
    srcSt:  '#5fa866',
    dst:    '#f6ead8',
    dstSt:  '#d4a868',
    edge:   '#b9c4cf',
    edgeLb: '#6a7480',
    active: '#cf3535',
    activeBg:'#f6d2c4',
    tempBg: '#f6ead8',
    tempSt: '#d4a868',
    blocked:'#c2c2c2',
    infBg:  '#ededed',
    infSt:  '#bdbdbd',
    ink:    '#1a1a1a',
    text:   '#1f3550',
    dim:    '#9a9a9a',
    green:  '#5fa866',
  };

  const INF = Infinity;
  const N = 4;
  const edges = [
    { u: 0, v: 1, w: 100 },
    { u: 1, v: 2, w: 100 },
    { u: 2, v: 0, w: 100 },
    { u: 1, v: 3, w: 600 },
    { u: 2, v: 3, w: 200 },
  ];
  const SRC = 0, DST = 3, K = 1;

  const F = (v) => (v >= INF ? '∞' : String(v));

  const steps = [
    {
      dist: [0, INF, INF, INF], temp: null,
      active: [], tempSrc: null, updated: [], blocked: [],
      phase: 'INIT',
      text: '<strong>初始化</strong> · dist[src=0] = 0，其餘皆 ∞。目標：src 0 → dst 3，最多 k = 1 次中轉 ⇒ 跑 k+1 = 2 輪。'
    },
    {
      dist: [0, INF, INF, INF], temp: [0, INF, INF, INF],
      active: [], tempSrc: null, updated: [], blocked: [],
      phase: 'R0 · 凍結',
      text: '<strong>第 0 輪開始</strong> · 把 dist 複製成 <strong>temp</strong>（本輪的凍結快照）。本輪所有鬆弛都只讀 temp，不讀剛被改過的 dist。'
    },
    {
      dist: [0, 100, INF, INF], temp: [0, INF, INF, INF],
      active: [0], tempSrc: 0, updated: [1], blocked: [],
      phase: 'R0 · 鬆弛',
      text: '<strong>第 0 輪鬆弛</strong> · 只有邊 <code>0→1</code> 的來源 temp[0]=0 有限 ⇒ dist[1] = min(∞, 0+100) = <strong>100</strong>。其他邊來源都是 ∞，無效。'
    },
    {
      dist: [0, 100, INF, INF], temp: null,
      active: [], tempSrc: null, updated: [], blocked: [],
      phase: 'R0 · 完成',
      text: '<strong>第 0 輪完成</strong> · dist = [0, 100, ∞, ∞]，代表「<strong>用 ≤ 1 條邊</strong>（0 次中轉）能到的最低票價」。3 還到不了。'
    },
    {
      dist: [0, 100, INF, INF], temp: [0, 100, INF, INF],
      active: [], tempSrc: null, updated: [], blocked: [],
      phase: 'R1 · 凍結',
      text: '<strong>第 1 輪開始</strong> · 再次凍結：temp = [0, 100, ∞, ∞]。注意 <strong>temp[2] 仍是 ∞</strong> —— 這一格是等下的關鍵。'
    },
    {
      dist: [0, 100, 200, 700], temp: [0, 100, INF, INF],
      active: [1, 3], tempSrc: 1, updated: [2, 3], blocked: [4],
      phase: 'R1 · 鬆弛',
      text: '<strong>第 1 輪鬆弛</strong> · 用 temp[1]=100：<code>1→2</code> ⇒ dist[2]=200；<code>1→3</code> ⇒ dist[3]=<strong>700</strong>。' +
            '　<span style="color:#c1440e">關鍵</span>：<code>2→3</code> 想用 temp[2]，但 temp[2]=∞（本輪凍結）⇒ 這步無效，dist[3] 保持 <strong>700</strong> 而非 300。'
    },
    {
      dist: [0, 100, 200, 700], temp: null,
      active: [], tempSrc: null, updated: [], blocked: [],
      phase: 'DONE',
      answer: 700,
      text: '<strong>兩輪跑完</strong> · dist[dst=3] = <strong>700</strong>（路徑 0→1→3，恰用 1 次中轉）。若不凍結、串到 0→1→2→3 = 300 就會偷用 2 次中轉、違規。答案 = <strong>700</strong>。'
    },
  ];

  let step = 0;
  let timer = null;

  function fitCanvas() {
    const dpr = Math.min(Math.max(window.devicePixelRatio || 1, 2), 3);
    const rect = canvas.getBoundingClientRect();
    const w = rect.width || canvas.clientWidth;
    const h = rect.height || canvas.clientHeight || 470;
    const bw = Math.round(w * dpr), bh = Math.round(h * dpr);
    if (canvas.width !== bw || canvas.height !== bh) { canvas.width = bw; canvas.height = bh; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function rr(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function arrow(x1, y1, x2, y2, color, width, dashed) {
    const R = 22;
    const ang = Math.atan2(y2 - y1, x2 - x1);
    const sx = x1 + Math.cos(ang) * R, sy = y1 + Math.sin(ang) * R;
    const ex = x2 - Math.cos(ang) * R, ey = y2 - Math.sin(ang) * R;
    ctx.save();
    ctx.strokeStyle = color; ctx.lineWidth = width;
    if (dashed) ctx.setLineDash([6, 5]);
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
    ctx.setLineDash([]);
    const ah = 9;
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(ex - ah * Math.cos(ang - 0.42), ey - ah * Math.sin(ang - 0.42));
    ctx.lineTo(ex - ah * Math.cos(ang + 0.42), ey - ah * Math.sin(ang + 0.42));
    ctx.closePath();
    ctx.fillStyle = color; ctx.fill();
    ctx.restore();
    return { mx: (sx + ex) / 2, my: (sy + ey) / 2, ang };
  }

  function draw() {
    fitCanvas();
    const s = steps[step];
    const w = canvas.clientWidth;
    const PAD = 28;

    ctx.fillStyle = COLOR.paper;
    ctx.fillRect(0, 0, w, canvas.clientHeight);

    ctx.fillStyle = COLOR.dim;
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('BAND 1 · 航線圖（綠=src 起點 · tan=dst 終點 · coral=本步鬆弛的邊 · 灰虛線=被 temp 凍結擋掉）', PAD, 24);

    const gTop = 46, gBot = 214;
    const midY = (gTop + gBot) / 2;
    const pos = [
      { x: PAD + 42,            y: midY },
      { x: PAD + (w - PAD * 2) * 0.42, y: gTop + 26 },
      { x: PAD + (w - PAD * 2) * 0.42, y: gBot - 26 },
      { x: w - PAD - 42,        y: midY },
    ];

    for (let e = 0; e < edges.length; e++) {
      const { u, v, w: wt } = edges[e];
      const isActive = s.active.includes(e);
      const isBlocked = s.blocked.includes(e);
      let col = COLOR.edge, lw = 2, dash = false;
      if (isActive) { col = COLOR.active; lw = 3.4; }
      else if (isBlocked) { col = COLOR.blocked; lw = 2.4; dash = true; }
      const m = arrow(pos[u].x, pos[u].y, pos[v].x, pos[v].y, col, lw, dash);
      const off = 14;
      const nx = m.mx + Math.cos(m.ang - Math.PI / 2) * off;
      const ny = m.my + Math.sin(m.ang - Math.PI / 2) * off;
      const lbl = String(wt);
      ctx.font = '700 12px "JetBrains Mono", monospace';
      const tw = ctx.measureText(lbl).width;
      rr(nx - tw / 2 - 5, ny - 9, tw + 10, 18, 4);
      ctx.fillStyle = '#ffffff'; ctx.fill();
      ctx.lineWidth = 1.1;
      ctx.strokeStyle = isActive ? COLOR.active : (isBlocked ? COLOR.blocked : COLOR.grid);
      ctx.stroke();
      ctx.fillStyle = isActive ? COLOR.active : (isBlocked ? '#8a8a8a' : COLOR.edgeLb);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(lbl, nx, ny + 1);
    }

    for (let i = 0; i < N; i++) {
      let bg = COLOR.node, st = COLOR.nodeSt;
      if (i === SRC) { bg = COLOR.src; st = COLOR.srcSt; }
      else if (i === DST) { bg = COLOR.dst; st = COLOR.dstSt; }
      ctx.beginPath();
      ctx.arc(pos[i].x, pos[i].y, 22, 0, Math.PI * 2);
      ctx.fillStyle = bg; ctx.fill();
      ctx.lineWidth = 2.4; ctx.strokeStyle = st; ctx.stroke();
      ctx.fillStyle = COLOR.ink;
      ctx.font = '700 18px "JetBrains Mono", monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(i), pos[i].x, pos[i].y + 1);
      if (i === SRC || i === DST) {
        ctx.fillStyle = i === SRC ? COLOR.green : COLOR.dstSt;
        ctx.font = '700 10px "JetBrains Mono", monospace';
        ctx.textBaseline = 'top';
        ctx.fillText(i === SRC ? 'SRC' : 'DST', pos[i].x, pos[i].y + 26);
      }
    }

    const b2y = 252;
    ctx.fillStyle = COLOR.dim;
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('BAND 2 · dist[]（正在更新）與 temp[]（本輪凍結快照）· tan=被讀的來源 · coral=剛更新 · 灰=∞', PAD, b2y);

    const cols = N;
    const labW = 58;
    const cell = Math.min(64, (w - PAD * 2 - labW) / cols);
    const gx0 = PAD + labW;
    const rowY = [b2y + 22, b2y + 22 + cell + 14];

    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let j = 0; j < cols; j++) {
      ctx.fillStyle = COLOR.dim;
      ctx.fillText('城 ' + j, gx0 + j * cell + cell / 2, rowY[0] - 9);
    }

    function drawRow(y, arr, name, kind) {
      ctx.fillStyle = COLOR.text;
      ctx.font = '700 14px "JetBrains Mono", monospace';
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(name, PAD, y + cell / 2);
      for (let j = 0; j < cols; j++) {
        const x = gx0 + j * cell;
        const val = arr[j];
        const isInf = val >= INF;
        let bg = '#ffffff', st = COLOR.grid, bold = false;
        if (isInf) { bg = COLOR.infBg; st = COLOR.infSt; }
        if (kind === 'dist' && s.updated.includes(j)) { bg = COLOR.activeBg; st = COLOR.active; bold = true; }
        if (kind === 'temp' && s.tempSrc === j)        { bg = COLOR.tempBg;  st = COLOR.tempSt; bold = true; }
        rr(x + 3, y + 3, cell - 6, cell - 6, 5);
        ctx.fillStyle = bg; ctx.fill();
        ctx.lineWidth = bold ? 2.6 : 1.4;
        ctx.strokeStyle = st; ctx.stroke();
        ctx.fillStyle = isInf ? COLOR.infSt : COLOR.ink;
        ctx.font = (bold ? '700 ' : '600 ') + '17px "JetBrains Mono", monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(F(val), x + cell / 2, y + cell / 2 + 1);
      }
    }

    drawRow(rowY[0], s.dist, 'dist', 'dist');
    if (s.temp) {
      drawRow(rowY[1], s.temp, 'temp', 'temp');
    } else {
      ctx.fillStyle = COLOR.dim;
      ctx.font = '500 13px "Noto Sans TC", sans-serif';
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText('temp（本輪尚未凍結 / 已完成）', PAD, rowY[1] + cell / 2);
    }

    const b3y = 424;
    rr(PAD, b3y, 132, 26, 4);
    ctx.fillStyle = COLOR.ink; ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(s.phase, PAD + 66, b3y + 13);

    if (s.answer != null) {
      const aw = 168, ax = w - PAD - aw;
      rr(ax, b3y, aw, 26, 4);
      ctx.fillStyle = COLOR.green; ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 13px "JetBrains Mono", monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('ANSWER · dist[3] = ' + s.answer, ax + aw / 2, b3y + 13);
    } else {
      ctx.fillStyle = COLOR.dim;
      ctx.font = '500 12px "JetBrains Mono", monospace';
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ctx.fillText('src ' + SRC + ' → dst ' + DST + ' · k = ' + K + ' 中轉', w - PAD, b3y + 13);
    }
  }

  function update() {
    const s = steps[step];
    if (stepEl) {
      stepEl.textContent = String(step).padStart(2, '0') + ' / ' +
        String(steps.length - 1).padStart(2, '0');
    }
    if (labelEl) labelEl.innerHTML = s.text;
    draw();
  }

  function next()  { if (step < steps.length - 1) { step++; update(); } else stop(); }
  function prev()  { if (step > 0) { step--; update(); } }
  function reset() { stop(); step = 0; update(); }
  function play()  {
    if (timer) { stop(); return; }
    btnPlay.textContent = 'Pause';
    timer = setInterval(() => {
      if (step >= steps.length - 1) { stop(); return; }
      next();
    }, 1600);
  }
  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    if (btnPlay) btnPlay.textContent = 'Play';
  }

  btnPrev  && btnPrev .addEventListener('click', prev);
  btnNext  && btnNext .addEventListener('click', next);
  btnPlay  && btnPlay .addEventListener('click', play);
  btnReset && btnReset.addEventListener('click', reset);

  window.addEventListener('resize', () => { fitCanvas(); draw(); });
  if (window.ResizeObserver) {
    const ro = new ResizeObserver(() => { fitCanvas(); draw(); });
    ro.observe(canvas);
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
  fitCanvas();
  update();
})();
