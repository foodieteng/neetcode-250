/* ============================================================
   P2709 最大公因數走訪 — prime-factor Union-Find
   核心洞察：把每個「質數」當作 DSU 節點；一個數字把它自己的
   所有質因數連成同一組。全部數字互相可達 ⇔ 出現過的質數
   全部落在同一個連通分量。
   Walks the sample nums = [2, 3, 6]  →  true.
   Three tidy horizontal bands, never overlapping:
     BAND 1  input array cells (current one coral)
     BAND 2  current number → 質因數分解 → union 動作
     BAND 3  質數 DSU：節點著色 + 合併邊 + 分量數
   Style: white paper background, solid-color fills.
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
    paper:   '#ffffff',
    grid:    '#cfcfcf',
    ink:     '#1a1a1a',
    dim:     '#9a9a9a',
    text:    '#1f3550',
    // array cells
    cellBg:  '#fafaf6',
    cellSt:  '#c9c2b4',
    curBg:   '#f6ddd3',
    curSt:   '#cf3535',
    done:    '#cfe3cf',
    // prime groups
    grey:    '#eef0f2',   greyS: '#cfcfcf',
    gA:      '#e3edf5',   gAS:   '#6f9fc4',   // group A (blue)
    gB:      '#f6ead8',   gBS:   '#d4a868',   // group B (tan)
    merged:  '#d9e8c7',   mergS: '#5fa866',   // connected (green)
    coral:   '#cf3535',
  };

  // ── sample ──
  const NUMS   = [2, 3, 6];
  const PRIMES = [2, 3];                 // primes that appear
  const FACT   = { 2: [2], 3: [3], 6: [2, 3] };

  // ── build steps ──
  // primeGroup: prime -> 'grey' | 'a' | 'b' | 'm'  (visual group)
  const steps = [];
  const snap = (o) => steps.push(o);

  snap({
    phase: 'init', cur: -1, done: [],
    primeGroup: { 2: 'grey', 3: 'grey' }, edges: [],
    factors: null, anchor: null, comps: 0,
    text: '<strong>INITIAL</strong> · 把每個<strong>質數</strong>當 DSU 節點。' +
          '出現過的質數 = <code>{2, 3}</code>，一開始各自獨立、都還沒被碰到。'
  });

  snap({
    phase: 'proc', cur: 0, done: [],
    primeGroup: { 2: 'a', 3: 'grey' }, edges: [],
    factors: [2], anchor: 2, comps: 1,
    text: '處理 <code>nums[0] = 2</code>：質因數 <code>{2}</code>。只有一個質數、' +
          '無需 union。設 <strong>anchor = 2</strong>。目前分量：<strong>{2}</strong>。'
  });

  snap({
    phase: 'proc', cur: 1, done: [0],
    primeGroup: { 2: 'a', 3: 'b' }, edges: [],
    factors: [3], anchor: 2, comps: 2,
    text: '處理 <code>nums[1] = 3</code>：質因數 <code>{3}</code>。3 自成一組，' +
          '與 2 <strong>尚未相連</strong> → 現在有 <strong>兩個</strong>分量 {2}、{3}。'
  });

  snap({
    phase: 'union', cur: 2, done: [0, 1],
    primeGroup: { 2: 'm', 3: 'm' }, edges: [[2, 3]],
    factors: [2, 3], anchor: 2, comps: 1,
    text: '處理 <code>nums[2] = 6</code>：質因數 <code>{2, 3}</code>。同一個數字把它的' +
          '質因數連起來 → <strong>Union(2, 3)</strong>，兩組合併成一個分量！'
  });

  snap({
    phase: 'check', cur: -1, done: [0, 1, 2],
    primeGroup: { 2: 'm', 3: 'm' }, edges: [[2, 3]],
    factors: null, anchor: 2, comps: 1,
    text: '最後驗證：每個數字的最小質因數是否與 anchor(=2) 同組？' +
          ' <code>2→2 ✓</code>、<code>3→2 ✓</code>、<code>6→spf=2 ✓</code>。'
  });

  snap({
    phase: 'done', cur: -1, done: [0, 1, 2],
    primeGroup: { 2: 'm', 3: 'm' }, edges: [[2, 3]],
    factors: null, anchor: 2, comps: 1, result: true,
    text: '<strong>只剩一個分量 → return true</strong>。反例 <code>[3,9,5]</code>：' +
          '質數 {3} 與 {5} 永遠不相連，兩個分量 → <strong>false</strong>。'
  });

  let step = 0;
  let timer = null;

  function fitCanvas() {
    const dpr = Math.min(Math.max(window.devicePixelRatio || 1, 2), 3);
    const rect = canvas.getBoundingClientRect();
    const w = rect.width || canvas.clientWidth;
    const h = rect.height || canvas.clientHeight || 460;
    const bw = Math.round(w * dpr);
    const bh = Math.round(h * dpr);
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width  = bw;
      canvas.height = bh;
    }
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

  const groupFill = { grey: COLOR.grey, a: COLOR.gA, b: COLOR.gB, m: COLOR.merged };
  const groupStrk = { grey: COLOR.greyS, a: COLOR.gAS, b: COLOR.gBS, m: COLOR.mergS };

  function draw() {
    fitCanvas();
    const s = steps[step];
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const PAD = 26;

    ctx.fillStyle = COLOR.paper;
    ctx.fillRect(0, 0, w, h);

    const band1Y = 34;
    const band2Y = 150;
    const band3Y = 286;

    // ───────────── BAND 1 · input array ─────────────
    ctx.fillStyle = COLOR.dim;
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('BAND 1 · nums（紅色 = 正在處理，綠 = 已處理）', PAD, band1Y);

    const cellW = 62, cellH = 50, cellGap = 22;
    const totalW = NUMS.length * cellW + (NUMS.length - 1) * cellGap;
    const startX = (w - totalW) / 2;
    const cellY = band1Y + 22;
    for (let i = 0; i < NUMS.length; i++) {
      const x = startX + i * (cellW + cellGap);
      const isCur  = i === s.cur;
      const isDone = s.done.includes(i) && !isCur;
      rr(x, cellY, cellW, cellH, 4);
      ctx.fillStyle = isCur ? COLOR.curBg : (isDone ? COLOR.done : COLOR.cellBg);
      ctx.fill();
      ctx.lineWidth = isCur ? 2.5 : 1.5;
      ctx.strokeStyle = isCur ? COLOR.curSt : (isDone ? COLOR.mergS : COLOR.cellSt);
      ctx.stroke();
      ctx.fillStyle = COLOR.ink;
      ctx.font = '700 22px "JetBrains Mono", monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(NUMS[i]), x + cellW / 2, cellY + cellH / 2);
      // index caption
      ctx.fillStyle = COLOR.dim;
      ctx.font = '500 10px "JetBrains Mono", monospace';
      ctx.textBaseline = 'top';
      ctx.fillText('[' + i + ']', x + cellW / 2, cellY + cellH + 5);
    }

    // ───────────── BAND 2 · factorization → union ─────────────
    ctx.fillStyle = COLOR.dim;
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('BAND 2 · 當前數字 → 質因數分解 → union', PAD, band2Y);

    if (s.factors) {
      const v = NUMS[s.cur];
      const rowY = band2Y + 20;
      const rowMid = rowY + 25;
      // "v ="
      ctx.fillStyle = COLOR.ink;
      ctx.font = '700 20px "JetBrains Mono", monospace';
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      let bx = PAD + 10;
      ctx.fillText(v + '  =', bx, rowMid);
      bx += ctx.measureText(v + '  =').width + 18;
      // prime chips
      const chipW = 50, chipH = 44, chipGap = 22;
      for (let i = 0; i < s.factors.length; i++) {
        const pr = s.factors[i];
        const g = s.primeGroup[pr];
        rr(bx, rowMid - chipH / 2, chipW, chipH, 4);
        ctx.fillStyle = groupFill[g] || COLOR.gA;
        ctx.fill();
        ctx.lineWidth = 1.8;
        ctx.strokeStyle = groupStrk[g] || COLOR.gAS;
        ctx.stroke();
        ctx.fillStyle = COLOR.text;
        ctx.font = '700 20px "JetBrains Mono", monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(String(pr), bx + chipW / 2, rowMid);
        bx += chipW;
        if (i < s.factors.length - 1) {
          ctx.fillStyle = COLOR.dim;
          ctx.font = '700 18px "JetBrains Mono", monospace';
          ctx.fillText('×', bx + chipGap / 2, rowMid);
          bx += chipGap;
        }
      }
      // union call-out
      bx += 24;
      if (s.phase === 'union') {
        rr(bx, rowMid - 18, 176, 36, 4);
        ctx.fillStyle = COLOR.merged;
        ctx.fill();
        ctx.strokeStyle = COLOR.mergS; ctx.lineWidth = 1.8; ctx.stroke();
        ctx.fillStyle = '#2f6a3a';
        ctx.font = '700 15px "JetBrains Mono", monospace';
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText('Union(' + s.factors[0] + ', ' + s.factors[1] + ') ✓', bx + 14, rowMid);
      } else {
        ctx.fillStyle = COLOR.dim;
        ctx.font = '500 13px "Noto Sans TC", sans-serif';
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText('單一質因數，無需 union', bx, rowMid);
      }
    } else if (s.phase === 'check' || s.phase === 'done') {
      ctx.fillStyle = COLOR.text;
      ctx.font = '600 14px "Noto Sans TC", sans-serif';
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText('所有數字處理完畢 → 檢查每個 spf 是否與 anchor 同一分量',
        PAD + 10, band2Y + 44);
    } else {
      ctx.fillStyle = COLOR.dim;
      ctx.font = '500 14px "Noto Sans TC", sans-serif';
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText('點 Next / Play 開始逐一處理陣列中的數字',
        PAD + 10, band2Y + 44);
    }

    // ───────────── BAND 3 · prime DSU ─────────────
    ctx.fillStyle = COLOR.dim;
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('BAND 3 · 質數 DSU（同色 = 同一分量）', PAD, band3Y);

    const nodeR = 30;
    const nodeY = band3Y + 40 + nodeR;
    const nodeGap = 150;
    const nodesW = (PRIMES.length - 1) * nodeGap;
    const nodeStartX = w / 2 - nodesW / 2 - 40;
    const nodePos = {};
    PRIMES.forEach((pr, i) => { nodePos[pr] = { x: nodeStartX + i * nodeGap, y: nodeY }; });

    // edges first (under nodes)
    ctx.strokeStyle = COLOR.mergS;
    ctx.lineWidth = 4;
    s.edges.forEach(([a, b]) => {
      ctx.beginPath();
      ctx.moveTo(nodePos[a].x, nodePos[a].y);
      ctx.lineTo(nodePos[b].x, nodePos[b].y);
      ctx.stroke();
    });

    // nodes
    PRIMES.forEach((pr) => {
      const g = s.primeGroup[pr];
      const { x, y } = nodePos[pr];
      ctx.beginPath();
      ctx.arc(x, y, nodeR, 0, Math.PI * 2);
      ctx.fillStyle = groupFill[g];
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = groupStrk[g];
      ctx.stroke();
      ctx.fillStyle = COLOR.ink;
      ctx.font = '700 24px "JetBrains Mono", monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(pr), x, y);
      // anchor tag
      if (s.anchor === pr) {
        ctx.fillStyle = COLOR.coral;
        ctx.font = '700 10px "JetBrains Mono", monospace';
        ctx.textBaseline = 'top';
        ctx.fillText('anchor', x, y + nodeR + 6);
      }
    });

    // components read-out + verdict, right side
    const boxX = nodeStartX + nodesW + nodeGap * 0.6;
    const boxW = w - PAD - boxX;
    if (boxW > 130) {
      const boxY = band3Y + 36, boxH = 70;
      rr(boxX, boxY, boxW, boxH, 4);
      const ok = s.comps === 1 && (s.phase === 'done' || s.phase === 'check');
      ctx.fillStyle = COLOR.ink;
      ctx.fill();
      ctx.fillStyle = '#ffd9c9';
      ctx.font = '600 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText('COMPONENTS', boxX + boxW / 2, boxY + 9);
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 26px "JetBrains Mono", monospace';
      ctx.textBaseline = 'middle';
      ctx.fillText(s.phase === 'init' ? '·' : String(s.comps), boxX + boxW / 2, boxY + 44);
    }

    // verdict banner (done)
    if (s.phase === 'done') {
      const vy = nodeY + nodeR + 26;
      rr(PAD, vy, w - PAD * 2, 34, 4);
      ctx.fillStyle = COLOR.merged;
      ctx.fill();
      ctx.strokeStyle = COLOR.mergS; ctx.lineWidth = 1.8; ctx.stroke();
      ctx.fillStyle = '#2f6a3a';
      ctx.font = '700 15px "JetBrains Mono", monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('1 個分量 · 全部連通 → return true', w / 2, vy + 17);
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
    }, 1300);
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
