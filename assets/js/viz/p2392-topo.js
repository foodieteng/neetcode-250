/* ============================================================
   P2392 Build a Matrix With Conditions — two topological sorts
   核心洞察：rowConditions 是「誰在誰上面」的 DAG → 拓樸排序得到
   每個數字的「列索引」；colConditions 同理得到「行索引」。把數字 v
   放到 (rowIdx[v], colIdx[v]) 的交叉格即可。任一 DAG 有環 → 回傳空。

   本檔匯出一個可重複實例化的工廠 initTopoViz(prefix, cfg)，頁面用它
   建兩段動畫：
     · BASE case    (prefix 'vb')  最小非平凡例 k=2, row=[[1,2]], col=[[2,1]]
     · GENERAL case (prefix 'vg')  k=3, row=[[1,2],[3,2]], col=[[2,1],[3,2]]
   每段三條水平帶：
     BAND 1  row DAG → Kahn 拓樸 → rowOrder（列索引）
     BAND 2  col DAG → Kahn 拓樸 → colOrder（行索引）
     BAND 3  k×k grid：把每個數字放到 (row, col) 交叉格
   Style: white paper background, solid-color fills.
   ============================================================ */

(function () {

  const COLOR = {
    paper:'#ffffff', ink:'#1a1a1a', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf',
    pend:'#eef0f2', pendS:'#cfcfcf',
    act:'#f6ddd3',  actS:'#d96e4e',
    done:'#d9e8c7', doneS:'#5fa866',
    edge:'#8fb3d4',
    chip:'#e3edf5', chipS:'#6f9fc4',
    coral:'#d96e4e',
    cellFill:'#f6ddd3', cellS:'#d96e4e',
  };

  function initTopoViz(prefix, cfg) {
    const canvas = document.getElementById(prefix + '-canvas');
    if (!canvas) return;

    const ctx      = canvas.getContext('2d');
    const stepEl   = document.getElementById(prefix + '-step');
    const labelEl  = document.getElementById(prefix + '-label');
    const btnPrev  = document.getElementById(prefix + '-prev');
    const btnNext  = document.getElementById(prefix + '-next');
    const btnPlay  = document.getElementById(prefix + '-play');
    const btnReset = document.getElementById(prefix + '-reset');

    const K = cfg.K;

    // ── Kahn topological sort with per-pop snapshots ──
    function kahn(nodes, edges) {
      const g = {}, indeg = {};
      for (const n of Object.keys(nodes)) { g[n] = []; indeg[n] = 0; }
      for (const [u, v] of edges) { g[u].push(v); indeg[v]++; }
      const q = [];
      for (let i = 1; i <= K; i++) if (indeg[i] === 0) q.push(i);
      const snaps = []; const order = [];
      snaps.push({ pop: null, order: [...order], queue: [...q], indeg: { ...indeg } });
      while (q.length) {
        const u = q.shift(); order.push(u);
        const newly = [];
        for (const v of g[u]) { indeg[v]--; if (indeg[v] === 0) { q.push(v); newly.push(v); } }
        snaps.push({ pop: u, order: [...order], queue: [...q], indeg: { ...indeg }, newly });
      }
      return { order, snaps };
    }
    const R = kahn(cfg.rowNodes, cfg.rowEdges);
    const C = kahn(cfg.colNodes, cfg.colEdges);
    const rowIdx = {}; R.order.forEach((v, i) => rowIdx[v] = i);
    const colIdx = {}; C.order.forEach((v, i) => colIdx[v] = i);
    const placeSeq = []; for (let v = 1; v <= K; v++) placeSeq.push(v);

    // ── assemble master steps ──
    const steps = [];
    const snap = (o) => steps.push(o);
    const fmt = (a) => '[' + a.join(',') + ']';

    snap({ phase: 'init', rSnap: 0, cSnap: 0, placed: 0,
      text: '<strong>INITIAL</strong> · rowConditions 是「誰在上面」的 DAG，colConditions 是「誰在左邊」的 DAG。'
          + '各做一次<strong>拓樸排序</strong>,決定每個數字的列 / 行索引。' });

    for (let i = 1; i < R.snaps.length; i++) {
      const s = R.snaps[i];
      snap({ phase: 'row', rSnap: i, cSnap: 0, placed: 0,
        text: `<strong>Row 拓樸</strong>:取出 indegree=0 的 <code>${s.pop}</code> → rowOrder=${fmt(s.order)},`
            + `即數字 <code>${s.pop}</code> 放到<strong>第 ${s.order.length - 1} 列</strong>。`
            + (s.newly && s.newly.length ? `(<code>${s.newly.join(',')}</code> 入度歸零入隊)` : '') });
    }
    for (let i = 1; i < C.snaps.length; i++) {
      const s = C.snaps[i];
      snap({ phase: 'col', rSnap: R.snaps.length - 1, cSnap: i, placed: 0,
        text: `<strong>Col 拓樸</strong>:取出 <code>${s.pop}</code> → colOrder=${fmt(s.order)},`
            + `即數字 <code>${s.pop}</code> 放到<strong>第 ${s.order.length - 1} 行</strong>。`
            + (s.newly && s.newly.length ? `(<code>${s.newly.join(',')}</code> 入隊)` : '') });
    }
    for (let i = 0; i < placeSeq.length; i++) {
      const v = placeSeq[i];
      snap({ phase: 'place', rSnap: R.snaps.length - 1, cSnap: C.snaps.length - 1, placed: i + 1,
        text: `放置 <code>${v}</code>:row=${rowIdx[v]}、col=${colIdx[v]} → grid[${rowIdx[v]}][${colIdx[v]}] = ${v}。` });
    }
    snap({ phase: 'done', rSnap: R.snaps.length - 1, cSnap: C.snaps.length - 1, placed: placeSeq.length,
      text: cfg.doneText });

    let step = 0, timer = null;

    function fitCanvas() {
      const dpr = Math.min(Math.max(window.devicePixelRatio || 1, 2), 3);
      const rect = canvas.getBoundingClientRect();
      const w = rect.width || canvas.clientWidth;
      const h = rect.height || canvas.clientHeight || cfg.height;
      const bw = Math.round(w * dpr), bh = Math.round(h * dpr);
      if (canvas.width !== bw || canvas.height !== bh) { canvas.width = bw; canvas.height = bh; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function rr(x, y, w, h, r) {
      ctx.beginPath(); ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
    }
    function arrow(x1, y1, x2, y2, r1, r2) {
      const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
      const sx = x1 + ux * r1, sy = y1 + uy * r1, ex = x2 - ux * r2, ey = y2 - uy * r2;
      ctx.strokeStyle = COLOR.edge; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
      const ah = 7, aa = Math.atan2(dy, dx);
      ctx.fillStyle = COLOR.edge; ctx.beginPath(); ctx.moveTo(ex, ey);
      ctx.lineTo(ex - ah * Math.cos(aa - 0.4), ey - ah * Math.sin(aa - 0.4));
      ctx.lineTo(ex - ah * Math.cos(aa + 0.4), ey - ah * Math.sin(aa + 0.4));
      ctx.closePath(); ctx.fill();
    }
    const chipsEndX = 26 + 8 + 240 + K * (40 + 10);   // right edge of order chips

    function drawDAG(originX, originY, nodes, edges, snapObj, order, kind, active) {
      const nodeR = 19;
      for (const [u, v] of edges) {
        const a = nodes[u], b = nodes[v];
        arrow(originX + a.x, originY + a.y, originX + b.x, originY + b.y, nodeR, nodeR);
      }
      for (const n of Object.keys(nodes)) {
        const nd = nodes[n], cx = originX + nd.x, cy = originY + nd.y;
        const inOrder = order.indexOf(+n) >= 0;
        const isPop = active && snapObj.pop === +n && order[order.length - 1] === +n;
        ctx.beginPath(); ctx.arc(cx, cy, nodeR, 0, Math.PI * 2);
        ctx.fillStyle = isPop ? COLOR.act : (inOrder ? COLOR.done : COLOR.pend);
        ctx.fill();
        ctx.lineWidth = isPop ? 2.5 : 2;
        ctx.strokeStyle = isPop ? COLOR.actS : (inOrder ? COLOR.doneS : COLOR.pendS);
        ctx.stroke();
        ctx.fillStyle = COLOR.ink; ctx.font = '700 16px "JetBrains Mono", monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(n, cx, cy);
        if (!inOrder) {
          ctx.fillStyle = COLOR.coral; ctx.font = '700 9px "JetBrains Mono", monospace';
          ctx.textBaseline = 'bottom'; ctx.textAlign = 'center';
          ctx.fillText('in:' + snapObj.indeg[n], cx, cy - nodeR - 2);
        }
      }
      // order chips
      const chipX = originX + 240, chipY = originY - 4, cw = 40, ch = 34, gap = 10;
      ctx.fillStyle = COLOR.dim; ctx.font = '600 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
      ctx.fillText(kind === 'row' ? 'rowOrder →' : 'colOrder →', chipX, chipY - 2);
      for (let i = 0; i < K; i++) {
        const x = chipX + i * (cw + gap), y = chipY + 8;
        rr(x, y, cw, ch, 4);
        const filled = i < order.length;
        ctx.fillStyle = filled ? COLOR.chip : '#f7f7f7'; ctx.fill();
        ctx.lineWidth = 1.5; ctx.strokeStyle = filled ? COLOR.chipS : COLOR.grid; ctx.stroke();
        ctx.fillStyle = COLOR.dim; ctx.font = '600 9px "JetBrains Mono", monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.fillText((kind === 'row' ? 'r' : 'c') + i, x + cw / 2, y + 3);
        if (filled) {
          ctx.fillStyle = COLOR.ink; ctx.font = '700 17px "JetBrains Mono", monospace';
          ctx.textBaseline = 'bottom'; ctx.fillText(String(order[i]), x + cw / 2, y + ch - 4);
        }
      }
    }

    function bandNote(w, y, line1, line2, hot) {
      const PAD = 26, boxW = 270, x = w - PAD - boxW;
      if (x < chipsEndX + 18) return;   // no room on narrow canvases → skip
      rr(x, y, boxW, 50, 4);
      ctx.fillStyle = hot ? '#fbeee8' : '#fafaf6'; ctx.fill();
      ctx.lineWidth = 1.5; ctx.strokeStyle = hot ? COLOR.actS : COLOR.grid; ctx.stroke();
      ctx.fillStyle = hot ? COLOR.coral : COLOR.text;
      ctx.font = '600 12.5px "Noto Sans TC", sans-serif';
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(line1, x + 14, y + 17);
      ctx.fillStyle = COLOR.ink; ctx.fillText(line2, x + 14, y + 35);
    }

    function draw() {
      fitCanvas();
      const s = steps[step];
      const w = canvas.clientWidth, h = canvas.clientHeight;
      const PAD = 26;
      ctx.fillStyle = COLOR.paper; ctx.fillRect(0, 0, w, h);

      const rSnap = R.snaps[s.rSnap], cSnap = C.snaps[s.cSnap];
      const rOrder = rSnap.order, cOrder = cSnap.order;

      // fixed vertical rhythm — enough room for the general case V-shaped row DAG
      const b1Title = 26,  b1DagY = 74;
      const b2Title = 190, b2DagY = 230;
      const b3Title = 312, gy = 328;
      const cell = cfg.cell;

      // BAND 1 · row DAG
      ctx.fillStyle = s.phase === 'row' ? COLOR.coral : COLOR.dim;
      ctx.font = '600 12px "JetBrains Mono", monospace'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      ctx.fillText('BAND 1 · rowConditions DAG → 拓樸 → 列索引', PAD, b1Title);
      drawDAG(PAD + 8, b1DagY, cfg.rowNodes, cfg.rowEdges, rSnap, rOrder, 'row', s.phase === 'row');
      bandNote(w, b1DagY - 12, 'rowOrder 的第 i 個數字', '→ 放到矩陣的第 i「列」', s.phase === 'row');

      // BAND 2 · col DAG
      ctx.fillStyle = s.phase === 'col' ? COLOR.coral : COLOR.dim;
      ctx.font = '600 12px "JetBrains Mono", monospace'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      ctx.fillText('BAND 2 · colConditions DAG → 拓樸 → 行索引', PAD, b2Title);
      drawDAG(PAD + 8, b2DagY, cfg.colNodes, cfg.colEdges, cSnap, cOrder, 'col', s.phase === 'col');
      bandNote(w, b2DagY - 12, 'colOrder 的第 i 個數字', '→ 放到矩陣的第 i「行」', s.phase === 'col');

      // BAND 3 · grid placement
      ctx.fillStyle = (s.phase === 'place' || s.phase === 'done') ? COLOR.coral : COLOR.dim;
      ctx.font = '600 12px "JetBrains Mono", monospace'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      ctx.fillText('BAND 3 · 放到 (row, col) 交叉格', PAD, b3Title);

      const gx = PAD + 40;
      ctx.font = '600 10px "JetBrains Mono", monospace'; ctx.fillStyle = COLOR.dim;
      for (let c = 0; c < K; c++) { ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillText('c' + c, gx + c * cell + cell / 2, gy - 4); }
      for (let r = 0; r < K; r++) { ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText('r' + r, gx - 6, gy + r * cell + cell / 2); }

      const placedVals = placeSeq.slice(0, s.placed);
      const fillAt = {}; placedVals.forEach(v => { fillAt[rowIdx[v] + ',' + colIdx[v]] = v; });
      const lastV = s.placed > 0 ? placeSeq[s.placed - 1] : null;
      for (let r = 0; r < K; r++) for (let c = 0; c < K; c++) {
        const x = gx + c * cell, y = gy + r * cell;
        rr(x, y, cell - 3, cell - 3, 3);
        const v = fillAt[r + ',' + c];
        const isLast = v != null && v === lastV;
        ctx.fillStyle = v != null ? (isLast ? COLOR.act : COLOR.cellFill) : '#fafaf6';
        ctx.fill();
        ctx.lineWidth = isLast ? 2.5 : 1; ctx.strokeStyle = v != null ? COLOR.cellS : COLOR.grid; ctx.stroke();
        ctx.fillStyle = COLOR.ink; ctx.font = '700 20px "JetBrains Mono", monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(v != null ? String(v) : (s.phase === 'done' ? '0' : ''), x + (cell - 3) / 2, y + (cell - 3) / 2);
      }

      // pos mapping panel (right of grid)
      const px = gx + K * cell + 40, py = gy - 6;
      if (px < w - 120) {
        ctx.fillStyle = COLOR.dim; ctx.font = '600 11px "JetBrains Mono", monospace';
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.fillText('pos[v] = (row, col)', px, py);
        for (let i = 0; i < placeSeq.length; i++) {
          const v = placeSeq[i], y = py + 22 + i * 26;
          ctx.fillStyle = i < s.placed ? COLOR.text : COLOR.grid;
          ctx.font = '600 13px "JetBrains Mono", monospace'; ctx.textBaseline = 'middle';
          ctx.fillText(`${v} → ( ${rowIdx[v]} , ${colIdx[v]} )`, px, y);
        }
      }

      // done banner — positioned to always sit inside the canvas
      if (s.phase === 'done') {
        const bh = 32;
        let by = gy + K * cell + 14;
        by = Math.min(by, h - bh - 8);          // clamp so it never clips the bottom
        rr(PAD, by, w - PAD * 2, bh, 4);
        ctx.fillStyle = COLOR.done; ctx.fill();
        ctx.strokeStyle = COLOR.doneS; ctx.lineWidth = 1.8; ctx.stroke();
        ctx.fillStyle = '#2f6a3a'; ctx.font = '700 14px "JetBrains Mono", monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(cfg.bannerText, w / 2, by + bh / 2);
      }
    }

    function update() {
      const s = steps[step];
      if (stepEl) stepEl.textContent = String(step).padStart(2, '0') + ' / ' + String(steps.length - 1).padStart(2, '0');
      if (labelEl) labelEl.innerHTML = s.text;
      draw();
    }
    function next() { if (step < steps.length - 1) { step++; update(); } else stop(); }
    function prev() { if (step > 0) { step--; update(); } }
    function reset() { stop(); step = 0; update(); }
    function play() { if (timer) { stop(); return; } btnPlay.textContent = 'Pause'; timer = setInterval(() => { if (step >= steps.length - 1) { stop(); return; } next(); }, 1250); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } if (btnPlay) btnPlay.textContent = 'Play'; }

    btnPrev  && btnPrev .addEventListener('click', prev);
    btnNext  && btnNext .addEventListener('click', next);
    btnPlay  && btnPlay .addEventListener('click', play);
    btnReset && btnReset.addEventListener('click', reset);

    window.addEventListener('resize', () => { fitCanvas(); draw(); });
    if (window.ResizeObserver) { const ro = new ResizeObserver(() => { fitCanvas(); draw(); }); ro.observe(canvas); }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
    fitCanvas(); update();
  }

  // ── BASE case · k=2, row=[[1,2]], col=[[2,1]]  → matrix [[0,1],[2,0]] ──
  initTopoViz('vb', {
    K: 2, cell: 46, height: 500,
    rowNodes: { 1: { x: 42, y: 40 }, 2: { x: 172, y: 40 } }, rowEdges: [[1, 2]],
    colNodes: { 2: { x: 42, y: 40 }, 1: { x: 172, y: 40 } }, colEdges: [[2, 1]],
    doneText: '<strong>完成</strong> · matrix = <code>[[0,1],[2,0]]</code>。'
            + '驗算:row[1,2] → 列 0 &lt; 1 ✓;col[2,1] → 行 0 &lt; 1 ✓。',
    bannerText: '2 個數字放進 2 個相異格 → 有解',
  });

  // ── GENERAL case · k=3, row=[[1,2],[3,2]], col=[[2,1],[3,2]] → [[0,0,1],[3,0,0],[0,2,0]] ──
  initTopoViz('vg', {
    K: 3, cell: 44, height: 560,
    rowNodes: { 1: { x: 36, y: 12 }, 3: { x: 150, y: 12 }, 2: { x: 93, y: 74 } }, rowEdges: [[1, 2], [3, 2]],
    colNodes: { 3: { x: 30, y: 44 }, 2: { x: 110, y: 44 }, 1: { x: 190, y: 44 } }, colEdges: [[2, 1], [3, 2]],
    doneText: '<strong>完成</strong>:其餘格子填 0。若任一 DAG 有<strong>環</strong>(拓樸長度 ≠ k),無解 → 回傳<strong>空矩陣</strong>。',
    bannerText: '兩次拓樸都成功 → 有解;任一有環 → 回傳 {}',
  });

})();
