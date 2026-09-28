/* ============================================================
   P427 · Construct Quad Tree — 分治 · viz
     build(grid, len, r, c):
       if (isSame(grid, len, r, c)) return new Node(grid[r][c], true);      // 葉
       root = new Node(grid[r][c], false);                                  // 內
       root->topLeft     = build(len/2, r,       c);
       root->topRight    = build(len/2, r,       c+len/2);
       root->bottomLeft  = build(len/2, r+len/2, c);
       root->bottomRight = build(len/2, r+len/2, c+len/2);
     isSame:由左上逐列掃描,遇到第一個不同的格子就 return false。
   動畫要傳達的一件事:整塊同色就收成葉子,否則切四塊各自遞迴。
   例 2(8×8),實測 trace:
     1 build(8,0,0) 讀 5 格,第一個不同 (0,4) → 內
     2   build(4,0,0) 讀 16 → 葉 1            [TL]
     3   build(4,0,4) 讀 9,第一個不同 (2,4) → 內 [TR]
     4     build(2,0,4) 讀 4 → 葉 0
     5     build(2,0,6) 讀 4 → 葉 0
     6     build(2,2,4) 讀 4 → 葉 1
     7     build(2,2,6) 讀 4 → 葉 1
     8   build(4,4,0) 讀 16 → 葉 1            [BL]
     9   build(4,4,4) 讀 16 → 葉 0            [BR]
     共讀 78 格;9 個節點(7 葉 + 2 內),深度 3。
     BAND 1  左:8×8 格子(紅框 = 目前區域、米色 = 已讀、深紅 = 第一個不同、粗框 = 已收成葉子)
             右:四元樹(紅 = 目前節點、虛線 = 待建)
     BAND 2  目前這次 build 的 isSame 結果
     BAND 3  累計讀格數 + 節點數
   前綴 v427- 。
   ============================================================ */
(function () {
  const canvas = document.getElementById('v427-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('v427-step'), labelEl = document.getElementById('v427-label');
  const bPrev = document.getElementById('v427-prev'), bNext = document.getElementById('v427-next'),
        bPlay = document.getElementById('v427-play'), bReset = document.getElementById('v427-reset');

  const C = { paper:'#ffffff', ink:'#1f1f1f', dim:'#5a5a5a', off:'#cfcfcf',
    up:'#e3edf5', low:'#f6ead8',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424',
    good:'#d9e8c7', bad:'#f0d4d4', deep:'#a31d1d' };

  const MONO = '"JetBrains Mono", monospace', SANS = '"Noto Sans TC", sans-serif';

  const G = [
    [1,1,1,1,0,0,0,0],
    [1,1,1,1,0,0,0,0],
    [1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1],
    [1,1,1,1,0,0,0,0],
    [1,1,1,1,0,0,0,0],
    [1,1,1,1,0,0,0,0],
    [1,1,1,1,0,0,0,0] ];

  /* 呼叫順序即節點順序。lv/col:樹上位置(col 以 4 欄為單位);par:父節點;q:象限標籤
     reads:isSame 讀了幾格;mis:第一個不同的格子(null = 全同) */
  const CALLS = [
    { L:8, r:0, c:0, lv:0, col:1.5, par:-1, q:'',   reads:5,  mis:[0,4] },
    { L:4, r:0, c:0, lv:1, col:0,   par:0,  q:'TL', reads:16, mis:null },
    { L:4, r:0, c:4, lv:1, col:1,   par:0,  q:'TR', reads:9,  mis:[2,4] },
    { L:2, r:0, c:4, lv:2, col:0,   par:2,  q:'TL', reads:4,  mis:null },
    { L:2, r:0, c:6, lv:2, col:1,   par:2,  q:'TR', reads:4,  mis:null },
    { L:2, r:2, c:4, lv:2, col:2,   par:2,  q:'BL', reads:4,  mis:null },
    { L:2, r:2, c:6, lv:2, col:3,   par:2,  q:'BR', reads:4,  mis:null },
    { L:4, r:4, c:0, lv:1, col:2,   par:0,  q:'BL', reads:16, mis:null },
    { L:4, r:4, c:4, lv:1, col:3,   par:0,  q:'BR', reads:16, mis:null } ];
  const CUM = [5,21,30,34,38,42,46,62,78];
  CALLS.forEach(n => { n.leaf = !n.mis; n.v = G[n.r][n.c]; });

  /* k = 目前呼叫(-1 = 尚未開始 / 9 = 完成);ph = 'intro' | 'scan' | 'split' | 'leaf' | 'done' */
  const S = (k, ph, text) => ({ k, ph, text });
  const args = n => 'build(' + n.L + ',' + n.r + ',' + n.c + ')';

  const steps = [
    S(-1, 'intro',
      '<strong>INITIAL</strong> · 8×8 的 <code>grid</code>(藍底 = 1、白底 = 0)。<code>build(8,0,0)</code> 先問一句:<b>這整塊是不是同一個數字?</b>是 → 直接收成<strong>一片葉子</strong>;不是 → 建一個<strong>內部節點</strong>,把區域切成 <code>TL / TR / BL / BR</code> 四塊,各自遞迴。'),
    S(0, 'scan',
      '<strong>build(8,0,0) · 掃描</strong> · <code>isSame</code> 從 <code>(0,0)</code> 逐列往右讀,前 4 格都是 1,<strong>第 5 格 <code>(0,4)</code> 是 0</strong> → 立刻 <code>return false</code>。<b>只讀了 5 格就知道不是整塊同色</b>,不必把 64 格讀完。'),
    S(0, 'split',
      '<strong>build(8,0,0) · 切四塊</strong> · 不同色 → <code>new Node(grid[0][0]=1, false)</code> 當<strong>內部節點</strong>(內部節點的 val 題目不在乎)。長度減半成 4,依序呼叫 <code>TL(0,0)</code>、<code>TR(0,4)</code>、<code>BL(4,0)</code>、<code>BR(4,4)</code>。'),
    S(1, 'leaf',
      '<strong>build(4,0,0) · TL</strong> · 16 格全是 1,<code>isSame</code> 讀完 16 格都沒遇到不同 → <strong>收成葉子 <code>葉 1</code></strong>。<b>這一整塊之後不會再被碰到。</b>累計讀了 <code>5 + 16 = 21</code> 格。'),
    S(2, 'scan',
      '<strong>build(4,0,4) · TR · 掃描</strong> · 第 0、1 列全是 0(8 格),<strong>第 9 格 <code>(2,4)</code> 是 1</strong> → <code>return false</code>。<b>右上這塊上半是 0、下半是 1,不能收成一片。</b>累計 <code>30</code> 格。'),
    S(2, 'split',
      '<strong>build(4,0,4) · 切四塊</strong> · 建<strong>第二個內部節點</strong>,長度再減半成 2,往下呼叫四個 2×2:<code>(0,4)</code>、<code>(0,6)</code>、<code>(2,4)</code>、<code>(2,6)</code>。<b>遞迴深度來到第 3 層。</b>'),
    S(3, 'leaf',
      '<strong>build(2,0,4) · TR 的 TL</strong> · 4 格全是 0 → <strong><code>葉 0</code></strong>。累計 <code>34</code> 格。'),
    S(4, 'leaf',
      '<strong>build(2,0,6) · TR 的 TR</strong> · 4 格全是 0 → <strong><code>葉 0</code></strong>。<b>注意:它和左邊那塊值一樣,但分屬不同象限,仍是兩片葉子</b>(不會合併)。累計 <code>38</code> 格。'),
    S(5, 'leaf',
      '<strong>build(2,2,4) · TR 的 BL</strong> · 4 格全是 1 → <strong><code>葉 1</code></strong>。累計 <code>42</code> 格。'),
    S(6, 'leaf',
      '<strong>build(2,2,6) · TR 的 BR</strong> · 4 格全是 1 → <strong><code>葉 1</code></strong>。TR 的四個小孩都回來了,<b>TR 這棵子樹完成</b>,回到根繼續呼叫 BL。累計 <code>46</code> 格。'),
    S(7, 'leaf',
      '<strong>build(4,4,0) · BL</strong> · 16 格全是 1 → <strong><code>葉 1</code></strong>。累計 <code>62</code> 格。'),
    S(8, 'leaf',
      '<strong>build(4,4,4) · BR</strong> · 16 格全是 0 → <strong><code>葉 0</code></strong>。根的四個小孩全部回來,遞迴結束。累計 <code>78</code> 格。'),
    S(9, 'done',
      '<strong>完成</strong> · <code>9</code> 個節點 = <code>7</code> 葉 + <code>2</code> 內,深度 <code>3</code>,共讀 <code>78</code> 格。<b>每一層所有區域加起來最多 n² 格,共 log n 層</b> → 時間 <code>O(n² log n)</code>,遞迴堆疊 <code>O(log n)</code>。'),
  ];

  let step = 0, timer = null;

  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||420; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function box(x,y,w,h,fill,stroke,lw,dash){ rr(x,y,w,h,5); ctx.fillStyle=fill; ctx.fill(); ctx.lineWidth=lw||1.4; if(dash) ctx.setLineDash(dash); ctx.strokeStyle=stroke; ctx.stroke(); ctx.setLineDash([]); }
  function txt(s,x,y,color,font,align,base){ ctx.fillStyle=color; ctx.font=font; ctx.textAlign=align||'center'; ctx.textBaseline=base||'middle'; ctx.fillText(s,x,y); }
  function head(s,x,y,color){ txt(s,x,y,color||C.dim,'600 12px '+MONO+', '+SANS,'left','alphabetic'); }

  const PAD = 28, CELL = 28, GX = PAD + 16, GY = 52;           // 格子左上
  const TREE_TOP = 50, LV_H = 78, NW = 58, NH = 28;           // 樹
  const B2 = 304, B3 = 376, CH = 32;                          // band 標題基線;方塊在基線 +12

  function draw(){
    fit();
    const s = steps[step], w = canvas.clientWidth, H = canvas.clientHeight;
    const done = s.ph === 'done', k = s.k;
    ctx.fillStyle = C.paper; ctx.fillRect(0,0,w,H); ctx.setLineDash([]);

    // 哪些節點已決定(葉/內),哪些是待建的空位
    const decided = i => i < k || (i === k && s.ph !== 'scan');
    const shown = i => i === 0 || decided(CALLS[i].par);
    const cur = (k >= 0 && k < CALLS.length) ? CALLS[k] : null;

    head('BAND 1 · 紅框 = 目前區域　米色 = 已讀　深紅 = 第一個不同　粗框 = 葉', PAD, 18);

    /* ---------- 左:格子 ---------- */
    const GW = CELL * 8;
    // 讀過的格子(目前這次呼叫)
    const scanned = new Set(); let misKey = null;
    if (cur) {
      let n = 0;
      outer: for (let i = 0; i < cur.L; i++) for (let j = 0; j < cur.L; j++) {
        if (n >= cur.reads) break outer;
        scanned.add((cur.r+i)*8 + (cur.c+j)); n++;
      }
      if (cur.mis) misKey = cur.mis[0]*8 + cur.mis[1];
    }
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const x = GX + c*CELL, y = GY + r*CELL, key = r*8 + c, v = G[r][c];
      let bg = v ? C.up : C.paper, tc = C.ink;
      if (key === misKey) { bg = C.cur; tc = C.curT; }
      else if (scanned.has(key)) bg = cur.leaf ? C.good : C.low;
      ctx.fillStyle = bg; ctx.fillRect(x, y, CELL, CELL);
      ctx.strokeStyle = C.off; ctx.lineWidth = 1; ctx.strokeRect(x+0.5, y+0.5, CELL-1, CELL-1);
      txt(String(v), x + CELL/2, y + CELL/2 + 1, tc, (key === misKey ? '700 ' : '500 ') + '13px '+MONO);
    }
    // 行列索引
    for (let i = 0; i < 8; i++) {
      txt(String(i), GX + i*CELL + CELL/2, GY - 12, C.dim, '600 11px '+MONO, 'center', 'alphabetic');
      txt(String(i), GX - 12, GY + i*CELL + CELL/2 + 1, C.dim, '600 11px '+MONO, 'right', 'middle');
    }
    ctx.strokeStyle = C.ink; ctx.lineWidth = 1.4; ctx.strokeRect(GX, GY, GW, GW);
    // 已收成的葉子:粗框
    CALLS.forEach((n, i) => {
      if (!n.leaf || !decided(i) || n === cur) return;
      ctx.strokeStyle = C.ink; ctx.lineWidth = 2.6;
      ctx.strokeRect(GX + n.c*CELL + 1.3, GY + n.r*CELL + 1.3, n.L*CELL - 2.6, n.L*CELL - 2.6);
    });
    // 目前區域
    if (cur) {
      const x = GX + cur.c*CELL, y = GY + cur.r*CELL, L = cur.L*CELL;
      if (s.ph === 'split') {
        ctx.strokeStyle = C.curS; ctx.lineWidth = 2; ctx.setLineDash([5,4]);
        ctx.beginPath(); ctx.moveTo(x + L/2, y); ctx.lineTo(x + L/2, y + L); ctx.moveTo(x, y + L/2); ctx.lineTo(x + L, y + L/2); ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.strokeStyle = C.curS; ctx.lineWidth = 3;
      ctx.strokeRect(x + 1.5, y + 1.5, L - 3, L - 3);
      if (misKey !== null) {
        const mx = GX + cur.mis[1]*CELL, my = GY + cur.mis[0]*CELL;
        ctx.strokeStyle = C.deep; ctx.lineWidth = 2.4; ctx.strokeRect(mx + 3, my + 3, CELL - 6, CELL - 6);
      }
    }

    /* ---------- 右:四元樹 ---------- */
    const TX0 = GX + GW + 40, TX1 = w - PAD, colW = (TX1 - TX0) / 4;
    const nx = n => TX0 + (n.col + 0.5) * colW, ny = n => TREE_TOP + n.lv * LV_H;
    // 邊
    CALLS.forEach((n, i) => {
      if (n.par < 0 || !shown(i)) return;
      const p = CALLS[n.par];
      const x1 = nx(p), y1 = ny(p) + NH + 18, x2 = nx(n), y2 = ny(n);
      const live = n === cur;
      ctx.strokeStyle = decided(i) ? C.ink : (live ? C.curS : C.off);
      ctx.lineWidth = live ? 2.4 : (decided(i) ? 1.6 : 1.2);
      if (!decided(i) && !live) ctx.setLineDash([4,4]);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.setLineDash([]);
      // 象限標籤:貼在連線靠近小孩那一端,白底挖空
      const tx = x1 + (x2 - x1) * 0.62, ty = y1 + (y2 - y1) * 0.62;
      ctx.fillStyle = C.paper; ctx.fillRect(tx - 11, ty - 7, 22, 14);
      txt(n.q, tx, ty + 1, live ? C.curT : (decided(i) ? C.ink : C.dim), '700 10.5px '+MONO);
    });
    // 節點
    CALLS.forEach((n, i) => {
      if (!shown(i)) return;
      const x = nx(n) - NW/2, y = ny(n), isCur = n === cur, dec = decided(i);
      let bg = C.paper, bd = C.off, tc = C.dim, lw = 1.2, dash = [3,3], lab = '?';
      if (dec) { lab = n.leaf ? '葉 ' + n.v : '內'; bg = n.leaf ? (n.v ? C.up : C.paper) : C.low; bd = C.ink; tc = C.ink; lw = n.leaf && done ? 2.2 : 1.5; dash = null; }
      if (isCur) { bd = C.curS; lw = 2.6; dash = null; if (!dec) { bg = C.cur; tc = C.curT; } }
      box(x, y, NW, NH, bg, bd, lw, dash);
      txt(lab, x + NW/2, y + NH/2 + 1, tc, '700 13px '+MONO+', '+SANS);
      // 象限標籤(節點左上方)與參數(節點下方)
      txt('(' + n.L + ',' + n.r + ',' + n.c + ')', x + NW/2, y + NH + 12, isCur ? C.curT : (dec ? C.dim : C.off), '600 10.5px '+MONO, 'center', 'alphabetic');
    });
    if (!decided(0)) {   // 根還沒決定:樹區先放說明,避免大片空白
      const mx = (TX0 + TX1) / 2, my = TREE_TOP + LV_H + NH/2;
      txt('每個節點 = 一塊正方形區域', mx, my, C.dim, '600 12px '+SANS);
      txt('葉:整塊同值　內:恰有 TL/TR/BL/BR 四個小孩', mx, my + 22, C.dim, '600 12px '+SANS);
    }
    if (done) txt('深度 3', TX1, ny(CALLS[3]) + NH + 36, C.ink, '700 12px '+SANS, 'right', 'alphabetic');

    /* ---------- BAND 2 ---------- */
    head('BAND 2 · 這次 build 的 isSame 結果', PAD, B2);
    const gap = 12, cy = B2 + 12, cw = (w - 2*PAD - 3*gap) / 4;
    if (cur) {
      const cx = i => PAD + i*(cw + gap);
      box(cx(0), cy, cw, CH, C.cur, C.curS, 2);
      txt(args(cur), cx(0) + cw/2, cy + CH/2 + 1, C.curT, '700 12.5px '+MONO);
      box(cx(1), cy, cw, CH, C.low, C.ink, 1.4);
      txt('讀了 ' + cur.reads + ' 格', cx(1) + cw/2, cy + CH/2 + 1, C.ink, '700 12.5px '+MONO+', '+SANS);
      if (cur.mis) { box(cx(2), cy, cw, CH, C.cur, C.deep, 2); txt('第一個不同 (' + cur.mis.join(',') + ')', cx(2) + cw/2, cy + CH/2 + 1, C.curT, '700 12.5px '+MONO+', '+SANS); }
      else { box(cx(2), cy, cw, CH, C.good, C.ink, 1.4); txt('全同 ✓', cx(2) + cw/2, cy + CH/2 + 1, C.ink, '700 12.5px '+MONO+', '+SANS); }
      let rf = C.bad, rs = C.deep, rt = C.deep, rl = 'isSame = false';
      if (s.ph === 'split') { rf = C.low; rs = C.ink; rt = C.ink; rl = '內 → 切四塊'; }
      else if (s.ph === 'leaf') { rf = C.good; rs = C.ink; rt = C.ink; rl = '收成 葉 ' + cur.v; }
      box(cx(3), cy, cw, CH, rf, rs, 2);
      txt(rl, cx(3) + cw/2, cy + CH/2 + 1, rt, '700 12.5px '+MONO+', '+SANS);
    } else {
      box(PAD, cy, w - 2*PAD, CH, done ? C.good : C.paper, done ? C.ink : C.off, 1.4);
      txt(done ? '9 個節點 = 7 葉 + 2 內　深度 3　共讀 78 格'
               : 'isSame 全同 → 葉子;遇到第一個不同 → 內部節點 + 切四塊',
          w/2, cy + CH/2 + 1, C.ink, '700 12.5px '+MONO+', '+SANS);
    }

    /* ---------- BAND 3 ---------- */
    head('BAND 3 · 累計讀格數(每次 build 之後)', PAD, B3);
    const ly = B3 + 12, lh = 30, nodeW = 116;
    const nRead = k < 0 ? 0 : Math.min(k + 1, 9);
    const nNodes = CALLS.filter((n, i) => decided(i)).length;
    const sw = (w - 2*PAD - nodeW - 9*gap) / 9;
    for (let i = 0; i < 9; i++) {
      const x = PAD + i*(sw + gap);
      if (i >= nRead) { box(x, ly, sw, lh, C.paper, C.off, 1.2, [3,3]); continue; }
      const newest = i === k && !done;
      box(x, ly, sw, lh, newest ? C.cur : (done && i === 8 ? C.good : C.up), newest ? C.curS : C.ink, newest ? 2.4 : 1.4);
      txt(String(CUM[i]), x + sw/2, ly + lh/2 + 1, newest ? C.curT : C.ink, '700 12.5px '+MONO);
    }
    const nx0 = w - PAD - nodeW;
    box(nx0, ly, nodeW, lh, done ? C.good : C.paper, C.ink, done ? 2 : 1.4);
    txt('節點 ' + nNodes + ' / 9', nx0 + nodeW/2, ly + lh/2 + 1, C.ink, '700 12.5px '+MONO+', '+SANS);
  }

  function update(){ if(stepEl) stepEl.textContent=String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0'); if(labelEl) labelEl.innerHTML=steps[step].text; draw(); }
  function next(){ if(step<steps.length-1){step++;update();}else stop(); }
  function prev(){ if(step>0){step--;update();} }
  function reset(){ stop(); step=0; update(); }
  function play(){ if(timer){stop();return;} bPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){stop();return;} next(); },2200); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} if(bPlay) bPlay.textContent='Play'; }
  bPrev&&bPrev.addEventListener('click',prev); bNext&&bNext.addEventListener('click',next); bPlay&&bPlay.addEventListener('click',play); bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();}); if(window.ResizeObserver){ new ResizeObserver(()=>{fit();draw();}).observe(canvas); }
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw); fit(); update();
})();
