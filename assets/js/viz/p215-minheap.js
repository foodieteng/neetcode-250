/* ============================================================
   P215 · Kth Largest Element in an Array — 大小為 k 的最小堆 · viz
     priority_queue<int, vector<int>, greater<int>> pq;   // 最小堆
     for (int x : nums) { pq.push(x); if (pq.size() > k) pq.pop(); }
     return pq.top();
   動畫要傳達的一件事:priority_queue 不會去重 —— 重複值各佔一個名次。
   例 nums = [3,2,3,1,2,4,5,5,6], k = 4 → 4
     排名(由大到小):6 5 5 4 | 3 3 2 2 1 → 第 4 名是 4(若去重 6,5,4,3 才會是 3)
     底層陣列取自 libstdc++ push_heap / pop_heap 實測(元素帶下標 i,只比值):
       push 3 [3] → push 2 [2,3] → push 3 [2,3,3] → push 1 [1,2,3,3]
       push 2 [1,2,3,3,2] → pop 1(i=3)  [2,2,3,3]
       push 4 [2,2,3,3,4] → pop 2(i=1)  [2,3,3,4]
       push 5 [2,3,3,4,5] → pop 2(i=4)  [3,3,5,4]
       push 5 [3,3,5,4,5] → pop 3(i=2)  [3,4,5,5]
       push 6 [3,4,5,5,6] → pop 3(i=0)  [4,5,5,6]   top = 4(i=5)
     BAND 1  nums 原始順序(紅 = 目前、藍底 = 在堆裡、灰 = 已 pop、深紅 = 剛 pop)
     BAND 2  堆:左邊二元樹,右邊底層陣列 index 0..4
     BAND 3  全部排名 1..9,前 k 名 | 淘汰 的分界線
   前綴 v215- 。
   ============================================================ */
(function () {
  const canvas = document.getElementById('v215-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('v215-step'), labelEl = document.getElementById('v215-label');
  const bPrev = document.getElementById('v215-prev'), bNext = document.getElementById('v215-next'),
        bPlay = document.getElementById('v215-play'), bReset = document.getElementById('v215-reset');

  const C = { paper:'#ffffff', ink:'#1f1f1f', dim:'#5a5a5a', off:'#cfcfcf',
    up:'#e3edf5', low:'#f6ead8',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424',
    good:'#d9e8c7', bad:'#f0d4d4', deep:'#a31d1d' };

  const MONO = '"JetBrains Mono", monospace', SANS = '"Noto Sans TC", sans-serif';

  const K = 4;
  const NV = [3, 2, 3, 1, 2, 4, 5, 5, 6];          // id = 下標 i
  const RANK = [8, 6, 7, 5, 0, 2, 1, 4, 3];         // 由大到小(同值依下標)
  const N = NV.length;

  /* heap: 底層陣列(存下標 id);cur: 剛 push 的 id;pop: 剛被 pop 的 id;seen: 已讀到第幾個 */
  const S = (heap, cur, pop, seen, phase, text) => ({ heap, cur, pop, seen, phase, text });

  const steps = [
    S([], null, null, 0, 'intro',
      '<strong>INITIAL</strong> · <code>nums = [3,2,3,1,2,4,5,5,6]</code>,<code>k = 4</code>。最下面是<b>全部 9 個數由大到小的排名</b>(先當參考):<code>6 5 5 4 | 3 3 2 2 1</code> —— <strong>兩個 5 是兩個不同的元素,各佔一名</strong>,所以第 4 名是 <code>4</code>。接下來用大小為 k 的最小堆把它找出來。'),

    S([0], 0, null, 1, 'push',
      '<strong>push 3 (i=0)</strong> · 堆是空的,<code>3</code> 放在 <code>index 0</code>。<code>size = 1 ≤ k</code>,不用 pop。'),
    S([1,0], 1, null, 2, 'push',
      '<strong>push 2 (i=1)</strong> · 放在 <code>index 1</code>,比父節點 <code>3</code> 小 → 上浮到堆頂:<code>[2,3]</code>。'),
    S([1,0,2], 2, null, 3, 'push',
      '<strong>push 3 (i=2)</strong> · 又一個 <code>3</code>!<b>priority_queue 不去重</b>,它是新的元素,放在 <code>index 2</code>:<code>[2,3,3]</code>。堆裡現在有<strong>兩個 3</strong>。'),
    S([3,1,2,0], 3, null, 4, 'push',
      '<strong>push 1 (i=3)</strong> · 從 <code>index 3</code> 上浮兩層到堆頂:<code>[1,2,3,3]</code>。<code>size = 4 = k</code>,堆剛好滿。'),
    S([3,1,2,0,4], 4, null, 5, 'push',
      '<strong>push 2 (i=4)</strong> · 第二個 <code>2</code> 放在 <code>index 4</code>,父節點 <code>2</code> 不比它大,停:<code>[1,2,3,3,2]</code>。<strong><code>size = 5 &gt; k = 4</code></strong>,要 pop。'),
    S([1,4,2,0], null, 3, 5, 'pop',
      '<strong>pop 1 (i=3)</strong> · 5 個裡最小的 <code>1</code> 不可能是前 4 名,丟掉。看最下面:它是<b>第 9 名</b>,在分界線右邊。堆剩 <code>[2,2,3,3]</code>。'),

    S([1,4,2,0,5], 5, null, 6, 'push',
      '<strong>push 4 (i=5)</strong> · 放在 <code>index 4</code>,比父節點 <code>2</code> 大,不動:<code>[2,2,3,3,4]</code>。<strong><code>size = 5 &gt; k</code></strong>。'),
    S([4,0,2,5], null, 1, 6, 'pop',
      '<strong>pop 2 (i=1)</strong> · 堆頂是<b>第一個 2</b>(i=1),丟掉。另一個 <code>2</code>(i=4)還留著 —— <strong>同值的兩個元素是分開算的</strong>。堆 <code>[2,3,3,4]</code>。'),

    S([4,0,2,5,6], 6, null, 7, 'push',
      '<strong>push 5 (i=6)</strong> · 放在 <code>index 4</code>,父節點 <code>3</code> 比它小,不動:<code>[2,3,3,4,5]</code>。<strong><code>size = 5 &gt; k</code></strong>。'),
    S([2,0,6,5], null, 4, 7, 'pop',
      '<strong>pop 2 (i=4)</strong> · 現在才輪到<b>第二個 2</b> 被丟掉 —— 兩個 2 被 pop 了<strong>兩次</strong>,各是第 7、8 名。堆 <code>[3,3,5,4]</code>。'),

    S([2,0,6,5,7], 7, null, 8, 'push',
      '<strong>push 5 (i=7)</strong> · 第二個 <code>5</code> 進來,放在 <code>index 4</code>:<code>[3,3,5,4,5]</code>。<b>兩個 5 同時在堆裡</b>,不會合併。<strong><code>size = 5 &gt; k</code></strong>。'),
    S([0,5,6,7], null, 2, 8, 'pop',
      '<strong>pop 3 (i=2)</strong> · 堆頂的 <code>3</code> 是 <b>i=2 那個</b>(堆不保證同值的先後),丟掉。最後的 <code>5</code> 補到根、下沉:<code>[3,4,5,5]</code>。另一個 <code>3</code>(i=0)還在堆頂。'),

    S([0,5,6,7,8], 8, null, 9, 'push',
      '<strong>push 6 (i=8)</strong> · 最後一個數,放在 <code>index 4</code>:<code>[3,4,5,5,6]</code>。<strong><code>size = 5 &gt; k</code></strong>。'),
    S([5,7,6,8], null, 0, 9, 'pop',
      '<strong>pop 3 (i=0)</strong> · 最後一個 <code>3</code>(第 5 名)也被丟掉。<code>4</code> 升上堆頂:<code>[4,5,5,6]</code>。被 pop 的 5 個全都在分界線右邊。'),

    S([5,7,6,8], null, null, 9, 'done',
      '<strong>完成 · return 4</strong> · 堆裡留下<b>前 4 名 {6, 5, 5, 4}</b>,<code>top = 4</code>。<strong>兩個 5 各佔第 2、3 名</strong>,所以第 4 大是 <code>4</code>,不是 <code>3</code>(只有「去重後第 4 大」才是 3,但題目要的是排序後的第 k 個)。時間 <code>O(n log k)</code>,空間 <code>O(k)</code>。'),
  ];

  let step = 0, timer = null;

  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||420; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function box(x,y,w,h,fill,stroke,lw,dash){ rr(x,y,w,h,5); ctx.fillStyle=fill; ctx.fill(); ctx.lineWidth=lw||1.4; if(dash) ctx.setLineDash(dash); ctx.strokeStyle=stroke; ctx.stroke(); ctx.setLineDash([]); }
  function txt(s,x,y,color,font,align,base){ ctx.fillStyle=color; ctx.font=font; ctx.textAlign=align||'center'; ctx.textBaseline=base||'middle'; ctx.fillText(s,x,y); }
  function head(s,x,y,color){ txt(s,x,y,color||C.dim,'600 12px '+MONO+', '+SANS,'left','alphabetic'); }
  function circ(x,y,r,fill,stroke,lw,dash){ ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fillStyle=fill; ctx.fill(); ctx.lineWidth=lw; if(dash) ctx.setLineDash(dash); ctx.strokeStyle=stroke; ctx.stroke(); ctx.setLineDash([]); }
  function slash(x,y,w,h){ ctx.strokeStyle = C.off; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x + 8, y + h - 7); ctx.lineTo(x + w - 8, y + 7); ctx.stroke(); }

  const B1 = 18, B2 = 112, B3 = 334;   // band 標題基線
  const R = 19;

  /* 一個元素(id)在 BAND 1 / BAND 3 的樣式 */
  function style(s, id, inHeap, topId){
    const done = s.phase === 'done';
    if (id >= s.seen) return { fill:C.paper, st:C.off, tc: s.phase === 'intro' ? C.dim : C.off, lw:1.2, dash:[3,3], gone:false };
    if (id === s.pop) return { fill:C.bad, st:C.deep, tc:C.deep, lw:2.4 };
    if (id === s.cur) return { fill:C.cur, st:C.curS, tc:C.curT, lw:2.4 };
    if (inHeap.has(id)) {
      if (done && id === topId) return { fill:C.cur, st:C.curS, tc:C.curT, lw:2.8 };
      if (done) return { fill:C.good, st:C.ink, tc:C.ink, lw:1.6 };
      if (id === topId) return { fill: s.phase === 'pop' ? C.good : C.low, st:C.ink, tc:C.ink, lw:2.2 };
      return { fill:C.up, st:C.ink, tc:C.ink, lw:1.4 };
    }
    return { fill:C.paper, st:C.off, tc:C.off, lw:1.4, gone:true };
  }

  function draw(){
    fit();
    const s = steps[step], w = canvas.clientWidth, H = canvas.clientHeight, PAD = 24;
    const done = s.phase === 'done', isPop = s.phase === 'pop';
    const over = s.heap.length > K;
    ctx.fillStyle = C.paper; ctx.fillRect(0,0,w,H); ctx.setLineDash([]);
    const inHeap = new Set(s.heap);
    const topId = s.heap.length ? s.heap[0] : null;
    const innerW = w - 2*PAD;

    /* ---------- BAND 1 · nums ---------- */
    head('BAND 1 · nums   紅 = 目前　藍底 = 在堆裡　灰 = 已 pop　深紅 = 剛 pop', PAD, B1);
    txt('k = ' + K, w - PAD, B1, C.ink, '700 12px '+MONO, 'right', 'alphabetic');
    const sy = B1 + 12, sh = 30, sgap = 10;
    const sw = Math.min(56, (innerW - 8*sgap) / 9);
    const sx = i => PAD + i*(sw + sgap);
    for (let i = 0; i < N; i++) {
      const x = sx(i), st = style(s, i, inHeap, topId);
      box(x, sy, sw, sh, st.fill, st.st, st.lw, st.dash);
      txt(String(NV[i]), x + sw/2, sy + sh/2 + 1, st.tc, '700 13px '+MONO);
      if (st.gone) slash(x, sy, sw, sh);
      txt('i=' + i, x + sw/2, sy + sh + 13, i < s.seen ? C.dim : C.off, '600 10.5px '+MONO);
    }

    /* ---------- BAND 2 · 堆 ---------- */
    head('BAND 2 · 最小堆(樹 ⇄ 陣列,堆頂 = [0])', PAD, B2);
    const treeW = Math.min(innerW * 0.5, 330);
    const tx0 = PAD;
    const LV = [B2 + 44, B2 + 102, B2 + 160];
    const pos = i => {
      const lvl = i === 0 ? 0 : (i <= 2 ? 1 : 2);
      const idxIn = i - ((1 << lvl) - 1), n = 1 << lvl;
      return { x: tx0 + treeW * (idxIn + 0.5) / n, y: LV[lvl] };
    };
    for (let i = 1; i < s.heap.length; i++) {
      const p = pos((i - 1) >> 1), c = pos(i);
      const dx = c.x - p.x, dy = c.y - p.y, L = Math.hypot(dx, dy), ux = dx/L, uy = dy/L;
      ctx.strokeStyle = C.ink; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(p.x + ux*R, p.y + uy*R); ctx.lineTo(c.x - ux*R, c.y - uy*R); ctx.stroke();
    }
    if (!s.heap.length) {
      const p = pos(0);
      circ(p.x, p.y, R, C.paper, C.off, 1.2, [3,3]);
      txt('空堆', p.x, p.y + R + 14, C.dim, '600 11px '+SANS);
    }
    const nodeTxt = (id, x, y, tc) => {
      txt(String(NV[id]), x, y - 3, tc, '700 14px '+MONO);
      txt('i=' + id, x, y + 10, tc === C.ink ? C.dim : tc, '600 9px '+MONO);
    };
    s.heap.forEach((id, i) => {
      const p = pos(i);
      let fill = C.up, st = C.ink, tc = C.ink, lw = 1.5;
      if (id === s.cur)            { fill = C.cur; st = C.curS; tc = C.curT; lw = 2.6; }
      else if (i === 0)            { fill = done ? C.cur : (isPop ? C.good : C.low); lw = 2.4; if (done) { st = C.curS; tc = C.curT; } }
      circ(p.x, p.y, R, fill, st, lw);
      nodeTxt(id, p.x, p.y, tc);
      txt('[' + i + ']', p.x, p.y + R + 11, C.dim, '600 10px '+MONO, 'center', 'middle');
      if (i === 0) txt(id === s.cur ? 'top · 新' : 'top', p.x, p.y - R - 6, id === s.cur || done ? C.curT : C.ink, '700 11px '+MONO+', '+SANS, 'center', 'alphabetic');
      else if (id === s.cur) txt('新', p.x, p.y - R - 6, C.curT, '700 11px '+SANS, 'center', 'alphabetic');
    });
    if (s.pop !== null) {
      const r0 = pos(0), px = r0.x + Math.min(treeW * 0.36, 120), py = r0.y;
      ctx.strokeStyle = C.deep; ctx.lineWidth = 1.6; ctx.setLineDash([4,3]);
      ctx.beginPath(); ctx.moveTo(r0.x + R + 4, py); ctx.lineTo(px - R - 8, py); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = C.deep; ctx.beginPath(); ctx.moveTo(px - R - 2, py); ctx.lineTo(px - R - 10, py - 5); ctx.lineTo(px - R - 10, py + 5); ctx.closePath(); ctx.fill();
      circ(px, py, R, C.bad, C.deep, 2.4);
      nodeTxt(s.pop, px, py, C.deep);
      txt('pop', px, py - R - 6, C.deep, '700 11px '+MONO, 'center', 'alphabetic');
    }

    // 陣列
    const ax = PAD + treeW + 28, aw = w - PAD - ax;
    const cg = 8, cw = Math.min(52, (aw - 4*cg) / 5), ch = 38;
    const idxY = B2 + 22, cellTop = B2 + 34, arrW = 5*cw + 4*cg;
    txt('底層 vector', ax + arrW, B2, C.dim, '600 11px '+MONO+', '+SANS, 'right', 'alphabetic');
    for (let i = 0; i < 5; i++) {
      const x = ax + i*(cw + cg);
      txt(String(i), x + cw/2, idxY, (i === 4 && over) ? C.curT : C.dim, '600 11px '+MONO, 'center', 'alphabetic');
      const id = s.heap[i];
      if (id === undefined) { box(x, cellTop, cw, ch, C.paper, C.off, 1.2, [3,3]); continue; }
      let fill = C.up, st = C.ink, tc = C.ink, lw = 1.4;
      if (id === s.cur)        { fill = C.cur; st = C.curS; tc = C.curT; lw = 2.4; }
      else if (i === 0)        { fill = done ? C.cur : (isPop ? C.good : C.low); lw = 2.2; if (done) { st = C.curS; tc = C.curT; } }
      box(x, cellTop, cw, ch, fill, st, lw);
      txt(String(NV[id]), x + cw/2, cellTop + 14, tc, '700 14px '+MONO);
      txt('i=' + id, x + cw/2, cellTop + 29, tc === C.ink ? C.dim : tc, '600 9.5px '+MONO);
    }
    const c1 = cellTop + ch + 14, chH = 30;
    const sizeTxt = 'size = ' + s.heap.length + (over ? ' > k = ' + K : (s.heap.length === K ? ' = k' : ' ≤ k = ' + K));
    if (over) box(ax, c1, arrW, chH, C.cur, C.curS, 2);
    else box(ax, c1, arrW, chH, C.paper, C.ink, 1.2);
    txt((over ? '⚠ ' : '') + sizeTxt, ax + arrW/2, c1 + chH/2 + 1, over ? C.curT : C.ink, '700 12.5px '+MONO);
    const c2 = c1 + chH + 12;
    if (over) {
      box(ax, c2, arrW, chH, C.paper, C.curS, 1.4, [4,3]);
      txt('下一步:pop 堆頂 ' + NV[s.heap[0]] + ' (i=' + s.heap[0] + ')', ax + arrW/2, c2 + chH/2 + 1, C.curT, '700 12px '+MONO+', '+SANS);
    } else if (s.pop !== null) {
      box(ax, c2, arrW, chH, C.bad, C.deep, 2);
      txt('pop ' + NV[s.pop] + ' (i=' + s.pop + ') → 第 ' + (RANK.indexOf(s.pop) + 1) + ' 名,淘汰', ax + arrW/2, c2 + chH/2 + 1, C.deep, '700 12px '+MONO+', '+SANS);
    } else if (done) {
      box(ax, c2, arrW, chH, C.cur, C.curS, 2);
      txt('return top = 4', ax + arrW/2, c2 + chH/2 + 1, C.curT, '700 12.5px '+MONO+', '+SANS);
    } else if (s.heap.length) {
      box(ax, c2, arrW, chH, C.paper, C.off, 1.2, [3,3]);
      txt('未超過 k,不用 pop', ax + arrW/2, c2 + chH/2 + 1, C.dim, '600 12px '+SANS);
    } else {
      box(ax, c2, arrW, chH, C.paper, C.off, 1.2, [3,3]);
      txt('規則:size > k 就 pop', ax + arrW/2, c2 + chH/2 + 1, C.dim, '600 12px '+SANS);
    }

    /* ---------- BAND 3 · 全部排名 ---------- */
    head('BAND 3 · 全部排名(由大到小)— 重複值各佔一名', PAD, B3);
    const gapDiv = 30;
    const rw = Math.min(56, (innerW - 8*10 - (gapDiv - 10)) / 9), rg = 10;
    const rx = r => PAD + r*(rw + rg) + (r >= K ? gapDiv - rg : 0);
    const grpY = B3 + 22, rnY = B3 + 48, ry = B3 + 56, rh = 34;
    const leftEnd = rx(K - 1) + rw, rightStart = rx(K), rightEnd = rx(N - 1) + rw;
    const divX = (leftEnd + rightStart) / 2;
    // 分組標籤(括號)
    const bracket = (x0, x1, label, color) => {
      ctx.strokeStyle = color; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(x0, grpY + 6); ctx.lineTo(x0, grpY + 1); ctx.lineTo(x1, grpY + 1); ctx.lineTo(x1, grpY + 6); ctx.stroke();
      ctx.font = '700 11.5px '+MONO+', '+SANS; const lw = ctx.measureText(label).width + 12;
      ctx.fillStyle = C.paper; ctx.fillRect((x0 + x1)/2 - lw/2, grpY - 8, lw, 16);
      txt(label, (x0 + x1)/2, grpY + 1, color, '700 11.5px '+MONO+', '+SANS);
    };
    bracket(PAD, leftEnd, '前 k=4 名 → 留在堆裡', C.ink);
    bracket(rightStart, rightEnd, '淘汰(遲早被 pop)', C.dim);
    ctx.strokeStyle = C.curS; ctx.lineWidth = 1.8; ctx.setLineDash([5,3]);
    ctx.beginPath(); ctx.moveTo(divX, grpY - 8); ctx.lineTo(divX, ry + rh + 20); ctx.stroke(); ctx.setLineDash([]);
    for (let r = 0; r < N; r++) {
      const id = RANK[r], x = rx(r), st = style(s, id, inHeap, topId);
      const isAns = done && r === K - 1;
      txt('第' + (r + 1) + '名', x + rw/2, rnY, isAns ? C.curT : (r < K ? C.ink : C.dim), (isAns ? '700' : '600') + ' 10.5px '+SANS, 'center', 'alphabetic');
      box(x, ry, rw, rh, st.fill, st.st, st.lw, st.dash);
      txt(String(NV[id]), x + rw/2, ry + rh/2 + 1, st.tc, '700 14px '+MONO);
      if (st.gone) slash(x, ry, rw, rh);
      txt('i=' + id, x + rw/2, ry + rh + 13, id < s.seen ? C.dim : C.off, '600 10.5px '+MONO);
      if (isAns) { ctx.strokeStyle = C.curS; ctx.lineWidth = 1.4; rr(x - 4, ry - 4, rw + 8, rh + 8, 7); ctx.stroke(); }
    }
    // 說明 chip
    const ny = ry + rh + 30, nh = 30;
    const note = '重複值不去重:兩個 5 各佔一名 → 第 4 名是 4(去重才會變 3)';
    ctx.font = '700 12px '+MONO+', '+SANS;
    const nw = Math.min(innerW, ctx.measureText(note).width + 28);
    const hot = s.phase === 'intro' || done || (s.seen >= 8 && (s.cur === 7 || s.cur === 6));
    box(PAD, ny, nw, nh, hot ? C.cur : C.low, hot ? C.curS : C.ink, hot ? 2 : 1.2);
    txt(note, PAD + 14, ny + nh/2 + 1, hot ? C.curT : C.ink, '700 12px '+MONO+', '+SANS, 'left', 'middle');
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
