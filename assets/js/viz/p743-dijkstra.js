/* ============================================================
   P743 Network Delay Time — Dijkstra（min-heap + 惰性刪除）
   從 src=1 出發，每次彈出「目前最近的未定點」定案，鬆弛其出邊。
   答案 = 所有點最短距離的 max（有點不可達 ⇒ −1）。
   教學重點：
     · 節點按 dist 遞增「定案（settle）」，定案後不再更新。
     · min-heap 裡會殘留舊的 (d,node)；彈出時若 d > dist[node] 就跳過
       —— 這就是「惰性刪除 lazy deletion」。
   Sample: n=5, src=1, 有向邊
     1→2:2 · 1→3:5 · 2→3:1 · 2→4:7 · 3→4:2 · 4→5:1 · 3→5:6
   ⇒ dist = [_,0,2,3,5,6]，答案 = max = 6。
   Style: white paper, solid fills, three tidy bands:
     BAND 1  圖（綠=已定案 · 紅=本步彈出 · tan=起點 · 紅邊=本步鬆弛）
     BAND 2  dist[] 陣列（剛更新 紅 · 已定案綠 · ∞ 灰）
     BAND 3  min-heap 內容（top→，灰=惰性刪除的過期項）+ 動作/答案
   ============================================================ */

(function () {
  const canvas = document.getElementById('viz-canvas');
  if (!canvas) return;

  const ctx      = canvas.getContext('2d');
  const stepEl   = document.getElementById('viz-step');
  const labelEl  = document.getElementById('viz-label');
  const btnPrev  = document.getElementById('viz-prev');
  const btnNext  = document.getElementById('viz-next');
  const btnPlay  = document.getElementById('viz-play');
  const btnReset = document.getElementById('viz-reset');

  const COLOR = {
    paper:  '#ffffff',
    grid:   '#cfcfcf',
    node:   '#e3edf5',
    nodeSt: '#8fb3d4',
    src:    '#f6ead8',
    srcSt:  '#d4a868',
    settled:'#d9e8c7',
    settSt: '#5fa866',
    cur:    '#f6d2c4',
    curSt:  '#cf3535',
    edge:   '#b9c4cf',
    edgeLb: '#6a7480',
    active: '#cf3535',
    infBg:  '#ededed',
    infSt:  '#bdbdbd',
    ink:    '#1a1a1a',
    text:   '#1f3550',
    dim:    '#9a9a9a',
    green:  '#5fa866',
    stale:  '#c2c2c2',
  };

  const INF = Infinity;
  const N = 5;               // nodes 1..5
  const SRC = 1;
  // 有向邊 index: [u,v,w]
  const edges = [
    { u: 1, v: 2, w: 2 },  // 0
    { u: 1, v: 3, w: 5 },  // 1
    { u: 2, v: 3, w: 1 },  // 2
    { u: 2, v: 4, w: 7 },  // 3
    { u: 3, v: 4, w: 2 },  // 4
    { u: 4, v: 5, w: 1 },  // 5
    { u: 3, v: 5, w: 6 },  // 6
  ];

  const F = (v) => (v >= INF ? '∞' : String(v));
  // dist arrays are 1-indexed (idx0 unused)
  const D = (a) => a.slice(1); // -> length 5 for display

  // 手工列出 Dijkstra 每一步
  const steps = [
    {
      dist: [null, 0, INF, INF, INF, INF],
      settled: [], cur: null, stale: false, relaxed: [], updated: [],
      pq: [{ d: 0, v: 1 }],
      phase: 'INIT',
      text: '<strong>初始化</strong> · dist[src=1]=0，其餘 ∞。min-heap 放入起點 (0, 1)。'
    },
    {
      dist: [null, 0, 2, 5, INF, INF],
      settled: [1], cur: 1, stale: false, relaxed: [0, 1], updated: [2, 3],
      pq: [{ d: 2, v: 2 }, { d: 5, v: 3 }],
      phase: 'POP (0,1)',
      text: '<strong>彈出 (0,1)</strong> · 定案節點 1。鬆弛出邊：1→2 ⇒ dist[2]=2；1→3 ⇒ dist[3]=5。兩者入堆。'
    },
    {
      dist: [null, 0, 2, 3, 9, INF],
      settled: [1, 2], cur: 2, stale: false, relaxed: [2, 3], updated: [3, 4],
      pq: [{ d: 3, v: 3 }, { d: 5, v: 3, stale: true }, { d: 9, v: 4 }],
      phase: 'POP (2,2)',
      text: '<strong>彈出 (2,2)</strong> · 定案節點 2。2→3 把 dist[3] 從 5 壓到 <strong>3</strong>（新 (3,3) 入堆，舊 (5,3) 變過期）；2→4 ⇒ dist[4]=9。'
    },
    {
      dist: [null, 0, 2, 3, 5, 9],
      settled: [1, 2, 3], cur: 3, stale: false, relaxed: [4, 6], updated: [4, 5],
      pq: [{ d: 5, v: 3, stale: true }, { d: 5, v: 4 }, { d: 9, v: 4, stale: true }, { d: 9, v: 5 }],
      phase: 'POP (3,3)',
      text: '<strong>彈出 (3,3)</strong> · 定案節點 3。3→4 把 dist[4] 從 9 壓到 <strong>5</strong>；3→5 ⇒ dist[5]=9。堆裡開始堆積過期項。'
    },
    {
      dist: [null, 0, 2, 3, 5, 9],
      settled: [1, 2, 3], cur: 3, stale: true, relaxed: [], updated: [],
      pq: [{ d: 5, v: 4 }, { d: 9, v: 4, stale: true }, { d: 9, v: 5 }],
      phase: 'POP (5,3) · 過期',
      text: '<strong>彈出 (5,3)</strong> · 但 d=5 &gt; dist[3]=3 ⇒ 這是<strong>過期項，直接跳過</strong>（惰性刪除 lazy deletion）。節點 3 早已定案，不再處理。'
    },
    {
      dist: [null, 0, 2, 3, 5, 6],
      settled: [1, 2, 3, 4], cur: 4, stale: false, relaxed: [5], updated: [5],
      pq: [{ d: 6, v: 5 }, { d: 9, v: 4, stale: true }, { d: 9, v: 5, stale: true }],
      phase: 'POP (5,4)',
      text: '<strong>彈出 (5,4)</strong> · 定案節點 4。4→5 把 dist[5] 從 9 壓到 <strong>6</strong>。剩下的 (9,*) 全是過期項。'
    },
    {
      dist: [null, 0, 2, 3, 5, 6],
      settled: [1, 2, 3, 4, 5], cur: 5, stale: false, relaxed: [], updated: [],
      pq: [{ d: 9, v: 4, stale: true }, { d: 9, v: 5, stale: true }],
      phase: 'POP (6,5)',
      text: '<strong>彈出 (6,5)</strong> · 定案節點 5（無出邊）。全部 5 點都定案，之後彈出的都是過期項、略過。'
    },
    {
      dist: [null, 0, 2, 3, 5, 6],
      settled: [1, 2, 3, 4, 5], cur: null, stale: false, relaxed: [], updated: [],
      pq: [],
      phase: 'DONE',
      answer: 6,
      text: '<strong>完成</strong> · dist = [0, 2, 3, 5, 6]。訊號抵達所有點的時間 = <strong>max = 6</strong>（節點 5 最晚收到）。若有 ∞ 就回傳 −1。'
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

  function arrow(x1, y1, x2, y2, color, width) {
    const R = 20;
    const ang = Math.atan2(y2 - y1, x2 - x1);
    const sx = x1 + Math.cos(ang) * R, sy = y1 + Math.sin(ang) * R;
    const ex = x2 - Math.cos(ang) * R, ey = y2 - Math.sin(ang) * R;
    ctx.save();
    ctx.strokeStyle = color; ctx.lineWidth = width;
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
    const ah = 8.5;
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

    // ───────────── BAND 1 · 圖 ─────────────
    ctx.fillStyle = COLOR.dim;
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('BAND 1 · 圖（tan=src 起點 · 綠=已定案 · 紅=本步彈出的點 · 紅邊=本步鬆弛）', PAD, 24);

    const innerW = w - PAD * 2;
    const gTop = 44, gBot = 214, midY = (gTop + gBot) / 2;
    const pos = {
      1: { x: PAD + innerW * 0.07, y: midY },
      2: { x: PAD + innerW * 0.34, y: gTop + 18 },
      3: { x: PAD + innerW * 0.34, y: gBot - 18 },
      4: { x: PAD + innerW * 0.63, y: midY },
      5: { x: PAD + innerW * 0.93, y: midY },
    };

    for (let e = 0; e < edges.length; e++) {
      const { u, v, w: wt } = edges[e];
      const on = s.relaxed.includes(e);
      const col = on ? COLOR.active : COLOR.edge;
      const m = arrow(pos[u].x, pos[u].y, pos[v].x, pos[v].y, col, on ? 3.2 : 2);
      const off = 13;
      const nx = m.mx + Math.cos(m.ang - Math.PI / 2) * off;
      const ny = m.my + Math.sin(m.ang - Math.PI / 2) * off;
      const lbl = String(wt);
      ctx.font = '700 12px "JetBrains Mono", monospace';
      const tw = ctx.measureText(lbl).width;
      rr(nx - tw / 2 - 5, ny - 9, tw + 10, 18, 4);
      ctx.fillStyle = '#ffffff'; ctx.fill();
      ctx.lineWidth = 1.1; ctx.strokeStyle = on ? COLOR.active : COLOR.grid; ctx.stroke();
      ctx.fillStyle = on ? COLOR.active : COLOR.edgeLb;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(lbl, nx, ny + 1);
    }

    for (let i = 1; i <= N; i++) {
      let bg = COLOR.node, st = COLOR.nodeSt;
      if (s.settled.includes(i)) { bg = COLOR.settled; st = COLOR.settSt; }
      if (i === SRC && !s.settled.includes(i)) { bg = COLOR.src; st = COLOR.srcSt; }
      if (s.cur === i) { bg = COLOR.cur; st = COLOR.curSt; }
      ctx.beginPath();
      ctx.arc(pos[i].x, pos[i].y, 20, 0, Math.PI * 2);
      ctx.fillStyle = bg; ctx.fill();
      ctx.lineWidth = s.cur === i ? 3 : 2.3; ctx.strokeStyle = st; ctx.stroke();
      ctx.fillStyle = COLOR.ink;
      ctx.font = '700 17px "JetBrains Mono", monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(i), pos[i].x, pos[i].y + 1);
      // dist tag under node
      const dv = s.dist[i];
      ctx.fillStyle = dv >= INF ? COLOR.dim : COLOR.text;
      ctx.font = '700 11px "JetBrains Mono", monospace';
      ctx.textBaseline = 'top';
      ctx.fillText('d=' + F(dv), pos[i].x, pos[i].y + 24);
    }

    // ───────────── BAND 2 · dist 陣列 ─────────────
    const b2y = 250;
    ctx.fillStyle = COLOR.dim;
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('BAND 2 · dist[]（紅=本步更新 · 綠=已定案 · 灰=∞）', PAD, b2y);

    const cols = N;
    const labW = 48;
    const cell = Math.min(62, (w - PAD * 2 - labW) / cols);
    const gx0 = PAD + labW;
    const rowY = b2y + 20;

    ctx.font = '600 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let j = 0; j < cols; j++) {
      ctx.fillStyle = COLOR.dim;
      ctx.fillText('點 ' + (j + 1), gx0 + j * cell + cell / 2, rowY - 9);
    }
    ctx.fillStyle = COLOR.text;
    ctx.font = '700 13px "JetBrains Mono", monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('dist', PAD, rowY + cell / 2);
    for (let j = 0; j < cols; j++) {
      const node = j + 1;
      const x = gx0 + j * cell;
      const val = s.dist[node];
      const isInf = val >= INF;
      let bg = '#ffffff', st = COLOR.grid, bold = false;
      if (isInf) { bg = COLOR.infBg; st = COLOR.infSt; }
      else if (s.updated.includes(node)) { bg = COLOR.cur; st = COLOR.curSt; bold = true; }
      else if (s.settled.includes(node)) { bg = COLOR.settled; st = COLOR.settSt; }
      rr(x + 3, rowY + 3, cell - 6, cell - 6, 5);
      ctx.fillStyle = bg; ctx.fill();
      ctx.lineWidth = bold ? 2.6 : 1.4; ctx.strokeStyle = st; ctx.stroke();
      ctx.fillStyle = isInf ? COLOR.infSt : COLOR.ink;
      ctx.font = (bold ? '700 ' : '600 ') + '17px "JetBrains Mono", monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(F(val), x + cell / 2, rowY + cell / 2 + 1);
    }

    // ───────────── BAND 3 · min-heap + 動作 ─────────────
    const b3y = 350;
    ctx.fillStyle = COLOR.dim;
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('BAND 3 · min-heap 內容（top→，灰色=過期項，彈出即惰性刪除）', PAD, b3y);

    const chY = b3y + 12;
    const chH = 30, chGap = 9;
    let cx = PAD;
    ctx.font = '700 12px "JetBrains Mono", monospace';
    if (s.pq.length === 0) {
      ctx.fillStyle = COLOR.dim;
      ctx.font = '500 13px "Noto Sans TC", sans-serif';
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText('（空）所有點已定案', PAD, chY + chH / 2);
    } else {
      for (let i = 0; i < s.pq.length; i++) {
        const p = s.pq[i];
        const lbl = '(' + p.d + ',' + p.v + ')';
        ctx.font = '700 12px "JetBrains Mono", monospace';
        const tw = ctx.measureText(lbl).width;
        const cw = tw + 18;
        if (cx + cw > w - PAD) break;
        rr(cx, chY, cw, chH, 4);
        ctx.fillStyle = p.stale ? '#f2f2f2' : '#eef4ec';
        ctx.fill();
        ctx.lineWidth = (i === 0 && !p.stale) ? 2.4 : 1.3;
        ctx.strokeStyle = p.stale ? COLOR.stale : (i === 0 ? COLOR.settSt : COLOR.grid);
        ctx.stroke();
        ctx.fillStyle = p.stale ? COLOR.stale : COLOR.ink;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(lbl, cx + cw / 2, chY + chH / 2 + 1);
        if (p.stale) {
          // strike-through
          ctx.strokeStyle = COLOR.stale; ctx.lineWidth = 1.4;
          ctx.beginPath(); ctx.moveTo(cx + 4, chY + chH / 2); ctx.lineTo(cx + cw - 4, chY + chH / 2); ctx.stroke();
        }
        cx += cw + chGap;
      }
    }

    // 動作 chip + 答案
    const b4y = 424;
    rr(PAD, b4y, 150, 26, 4);
    ctx.fillStyle = COLOR.ink; ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(s.phase, PAD + 75, b4y + 13);

    if (s.answer != null) {
      const aw = 176, ax = w - PAD - aw;
      rr(ax, b4y, aw, 26, 4);
      ctx.fillStyle = COLOR.green; ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 13px "JetBrains Mono", monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('ANSWER · max dist = ' + s.answer, ax + aw / 2, b4y + 13);
    } else {
      ctx.fillStyle = COLOR.dim;
      ctx.font = '500 12px "JetBrains Mono", monospace';
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ctx.fillText('src = ' + SRC + ' · 定案 ' + s.settled.length + ' / ' + N + ' 點', w - PAD, b4y + 13);
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
