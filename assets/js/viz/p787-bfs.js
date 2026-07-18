/* ============================================================
   P787 Cheapest Flights Within K Stops — 寫法 B · 分層 BFS
   用 queue 一層一層走；每層開頭 sz = q.size() 凍結「本層節點數」，
   只處理本層 ⇒ 一層 = 多允許一次中轉。跑 k+1 層。
   Sample: n=4, edges [0→1:100,1→2:100,2→0:100,1→3:600,2→3:200],
           src=0, dst=3, k=1  ⇒  答案 700。
   核心教學點：(2,200)、(3,700) 是第 1 層才 push 進去的，屬於「第 2 層」；
   因為 stops 已達 k+1 而停，2→3（會給 300）永遠不會被處理。
   Canvas prefix: vb-
   ============================================================ */

(function () {
  const canvas = document.getElementById('vb-canvas');
  if (!canvas) return;

  const ctx      = canvas.getContext('2d');
  const stepEl   = document.getElementById('vb-step');
  const labelEl  = document.getElementById('vb-label');
  const btnPrev  = document.getElementById('vb-prev');
  const btnNext  = document.getElementById('vb-next');
  const btnPlay  = document.getElementById('vb-play');
  const btnReset = document.getElementById('vb-reset');

  const COLOR = {
    paper:  '#ffffff',
    node:   '#e3edf5', nodeSt: '#8fb3d4',
    src:    '#d9e8c7', srcSt:  '#5fa866',
    dst:    '#f6ead8', dstSt:  '#d4a868',
    grid:   '#cfcfcf',
    edge:   '#b9c4cf', edgeLb: '#6a7480',
    active: '#cf3535', activeBg:'#f6d2c4',
    curBg:  '#f6d2c4', curSt: '#cf3535',   // 本層 frontier
    nextBg: '#eef4ec', nextSt: '#5fa866',  // 剛 push、下一層
    blkBg:  '#f2f2f2', blkSt:  '#c2c2c2',  // 超過 k、不處理
    blocked:'#c2c2c2',
    infBg:  '#ededed', infSt:  '#bdbdbd',
    ink:    '#1a1a1a', text: '#1f3550', dim: '#9a9a9a', green: '#5fa866',
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

  // queue 項的 state: 'cur'=本層 frontier, 'next'=剛 push 下一層, 'blk'=超過 k 不處理
  const steps = [
    {
      dist: [0, INF, INF, INF], active: [], updated: [], blocked: [], cur: null,
      q: [{ n: 0, c: 0, s: 'cur' }], stops: 0,
      phase: 'INIT',
      text: '<strong>初始化</strong> · dist[0]=0，queue = { (node 0, cost 0) }。目標 0→3、最多 k=1 中轉 ⇒ 跑 k+1 = 2 層。'
    },
    {
      dist: [0, INF, INF, INF], active: [], updated: [], blocked: [], cur: null,
      q: [{ n: 0, c: 0, s: 'cur' }], stops: 0,
      phase: 'L0 · 凍結 sz',
      text: '<strong>第 0 層開始</strong>（stops=0 ≤ k）· <code>sz = q.size() = 1</code>，凍結「本層只處理這 1 個節點」。'
    },
    {
      dist: [0, 100, INF, INF], active: [0], updated: [1], blocked: [], cur: 0,
      q: [{ n: 1, c: 100, s: 'next' }], stops: 0,
      phase: 'L0 · 處理 (0,0)',
      text: '<strong>處理 (node 0, cost 0)</strong> · 鬆弛 <code>0→1</code>：100 &lt; ∞ ⇒ dist[1]=100，push (1,100)。這是<strong>下一層</strong>的節點。'
    },
    {
      dist: [0, 100, INF, INF], active: [], updated: [], blocked: [], cur: null,
      q: [{ n: 1, c: 100, s: 'cur' }], stops: 1,
      phase: 'L0 · 完成 → stops=1',
      text: '<strong>第 0 層完成</strong> · stops++ = 1。queue 裡的 (1,100) 成為第 1 層的 frontier。dist=[0,100,∞,∞]。'
    },
    {
      dist: [0, 100, INF, INF], active: [], updated: [], blocked: [], cur: null,
      q: [{ n: 1, c: 100, s: 'cur' }], stops: 1,
      phase: 'L1 · 凍結 sz',
      text: '<strong>第 1 層開始</strong>（stops=1 ≤ k）· <code>sz = q.size() = 1</code>，本層只處理 (1,100) 這一個。'
    },
    {
      dist: [0, 100, 200, 700], active: [1, 3], updated: [2, 3], blocked: [4], cur: 1,
      q: [{ n: 2, c: 200, s: 'next' }, { n: 3, c: 700, s: 'next' }], stops: 1,
      phase: 'L1 · 處理 (1,100)',
      text: '<strong>處理 (1,100)</strong> · <code>1→2</code> ⇒ dist[2]=200，push (2,200)；<code>1→3</code> ⇒ dist[3]=<strong>700</strong>，push (3,700)。' +
            '　這兩個都是<strong>第 2 層</strong>的節點。'
    },
    {
      dist: [0, 100, 200, 700], active: [], updated: [], blocked: [4], cur: null,
      q: [{ n: 2, c: 200, s: 'blk' }, { n: 3, c: 700, s: 'blk' }], stops: 2,
      phase: 'L1 · 完成 → stops=2 > k',
      text: '<strong>第 1 層完成</strong> · stops++ = 2 &gt; k=1 ⇒ <strong>迴圈停止</strong>。queue 裡的 (2,200)、(3,700) 屬第 2 層，<strong>不再處理</strong>。' +
            '　所以 <code>2→3</code>（會給 300、需 2 中轉）永遠不會發生。'
    },
    {
      dist: [0, 100, 200, 700], active: [], updated: [], blocked: [], cur: null,
      q: [], stops: 2,
      phase: 'DONE',
      answer: 700,
      text: '<strong>結束</strong> · dist[dst=3] = <strong>700</strong>（0→1→3，1 次中轉）。<code>sz=q.size()</code> 凍結本層 = Bellman-Ford 的 temp 快照，效果一樣。'
    },
  ];

  let step = 0, timer = null;

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

    // BAND 1 graph
    ctx.fillStyle = COLOR.dim;
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('BAND 1 · 航線圖（綠=src · tan=dst · coral=本步鬆弛的邊 · 灰虛線=需 2 中轉、被層數擋掉）', PAD, 24);

    const gTop = 46, gBot = 214, midY = (gTop + gBot) / 2;
    const pos = [
      { x: PAD + 42, y: midY },
      { x: PAD + (w - PAD * 2) * 0.42, y: gTop + 26 },
      { x: PAD + (w - PAD * 2) * 0.42, y: gBot - 26 },
      { x: w - PAD - 42, y: midY },
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
      if (s.cur === i) { bg = COLOR.curBg; st = COLOR.curSt; }
      ctx.beginPath();
      ctx.arc(pos[i].x, pos[i].y, 22, 0, Math.PI * 2);
      ctx.fillStyle = bg; ctx.fill();
      ctx.lineWidth = s.cur === i ? 3 : 2.4; ctx.strokeStyle = st; ctx.stroke();
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

    // BAND 2 dist
    const b2y = 252;
    ctx.fillStyle = COLOR.dim;
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('BAND 2 · dist[]（coral=本步更新 · 灰=∞）', PAD, b2y);
    const cols = N, labW = 58;
    const cell = Math.min(64, (w - PAD * 2 - labW) / cols);
    const gx0 = PAD + labW;
    const rowY = b2y + 22;
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let j = 0; j < cols; j++) {
      ctx.fillStyle = COLOR.dim;
      ctx.fillText('城 ' + j, gx0 + j * cell + cell / 2, rowY - 9);
    }
    ctx.fillStyle = COLOR.text;
    ctx.font = '700 14px "JetBrains Mono", monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('dist', PAD, rowY + cell / 2);
    for (let j = 0; j < cols; j++) {
      const x = gx0 + j * cell;
      const val = s.dist[j];
      const isInf = val >= INF;
      let bg = '#ffffff', st = COLOR.grid, bold = false;
      if (isInf) { bg = COLOR.infBg; st = COLOR.infSt; }
      if (s.updated.includes(j)) { bg = COLOR.activeBg; st = COLOR.active; bold = true; }
      rr(x + 3, rowY + 3, cell - 6, cell - 6, 5);
      ctx.fillStyle = bg; ctx.fill();
      ctx.lineWidth = bold ? 2.6 : 1.4; ctx.strokeStyle = st; ctx.stroke();
      ctx.fillStyle = isInf ? COLOR.infSt : COLOR.ink;
      ctx.font = (bold ? '700 ' : '600 ') + '17px "JetBrains Mono", monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(F(val), x + cell / 2, rowY + cell / 2 + 1);
    }

    // BAND 3 queue
    const b3y = 350;
    ctx.fillStyle = COLOR.dim;
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('BAND 3 · queue（coral=本層 frontier · 綠=剛 push 下一層 · 灰=超過 k 不處理）', PAD, b3y);
    const chY = b3y + 12, chH = 32, chGap = 10;
    let cx = PAD;
    if (s.q.length === 0) {
      ctx.fillStyle = COLOR.dim;
      ctx.font = '500 13px "Noto Sans TC", sans-serif';
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText('（queue 已空 / 迴圈結束）', PAD, chY + chH / 2);
    } else {
      for (let i = 0; i < s.q.length; i++) {
        const p = s.q[i];
        const lbl = '(node ' + p.n + ', ' + p.c + ')';
        ctx.font = '700 12px "JetBrains Mono", monospace';
        const tw = ctx.measureText(lbl).width;
        const cw = tw + 20;
        if (cx + cw > w - PAD) break;
        let bg = COLOR.nextBg, st = COLOR.nextSt;
        if (p.s === 'cur') { bg = COLOR.curBg; st = COLOR.curSt; }
        else if (p.s === 'blk') { bg = COLOR.blkBg; st = COLOR.blkSt; }
        rr(cx, chY, cw, chH, 5);
        ctx.fillStyle = bg; ctx.fill();
        ctx.lineWidth = p.s === 'cur' ? 2.6 : 1.5; ctx.strokeStyle = st; ctx.stroke();
        ctx.fillStyle = p.s === 'blk' ? COLOR.blkSt : COLOR.ink;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(lbl, cx + cw / 2, chY + chH / 2 + 1);
        cx += cw + chGap;
      }
    }

    // BAND 4 phase + stops + answer
    const b4y = 424;
    rr(PAD, b4y, 176, 26, 4);
    ctx.fillStyle = COLOR.ink; ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(s.phase, PAD + 88, b4y + 13);

    if (s.answer != null) {
      const aw = 168, ax = w - PAD - aw;
      rr(ax, b4y, aw, 26, 4);
      ctx.fillStyle = COLOR.green; ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 13px "JetBrains Mono", monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('ANSWER · dist[3] = ' + s.answer, ax + aw / 2, b4y + 13);
    } else {
      ctx.fillStyle = COLOR.dim;
      ctx.font = '500 12px "JetBrains Mono", monospace';
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ctx.fillText('stops = ' + s.stops + ' · 上限 k+1 = ' + (K + 1) + ' 層', w - PAD, b4y + 13);
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
    timer = setInterval(() => { if (step >= steps.length - 1) { stop(); return; } next(); }, 1600);
  }
  function stop() { if (timer) { clearInterval(timer); timer = null; } if (btnPlay) btnPlay.textContent = 'Play'; }

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
