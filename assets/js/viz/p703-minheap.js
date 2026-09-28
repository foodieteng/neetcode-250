/* ============================================================
   P703 · Kth Largest Element in a Stream — 大小為 k 的最小堆 · viz
     KthLargest(k, nums): size = k; for num: pq.push(num); if (pq.size() > k) pq.pop();
     add(val): pq.push(val); if (pq.size() > size) pq.pop(); return pq.top();
     pq = priority_queue<int, vector<int>, greater<int>>(最小堆)
   動畫要傳達的一件事:堆裡永遠只留「目前最大的 k 個」,
   其中最小的那個(堆頂)就是第 k 大;多出來的第 k+1 個一定是最小的,直接 pop 掉。
   例 k=3, nums=[4,5,8,2], add 3,5,10,9,4 → [null,4,5,5,8,8]
     底層陣列取自 libstdc++ push_heap / pop_heap 實測:
       ctor: [4] → [4,5] → [4,5,8] → push 2 [2,4,8,5] → pop 2 [4,5,8]
       add(3):  [3,4,8,5]  → pop 3 → [4,5,8]   top 4
       add(5):  [4,5,8,5]  → pop 4 → [5,5,8]   top 5
       add(10): [5,5,8,10] → pop 5 → [5,10,8]  top 5
       add(9):  [5,9,8,10] → pop 5 → [8,9,10]  top 8
       add(4):  [4,8,10,9] → pop 4 → [8,9,10]  top 8
     BAND 1  資料流(紅 = 目前、藍底 = 在堆裡、灰 = 已丟掉、深紅 = 剛被 pop)
     BAND 2  堆:左邊畫成二元樹,右邊是底層陣列 index 0..3
     BAND 3  輸出 + 「第 k 大 = top」
   前綴 v703- 。
   ============================================================ */
(function () {
  const canvas = document.getElementById('v703-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('v703-step'), labelEl = document.getElementById('v703-label');
  const bPrev = document.getElementById('v703-prev'), bNext = document.getElementById('v703-next'),
        bPlay = document.getElementById('v703-play'), bReset = document.getElementById('v703-reset');

  const C = { paper:'#ffffff', ink:'#1f1f1f', dim:'#5a5a5a', off:'#cfcfcf',
    up:'#e3edf5', low:'#f6ead8',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424',
    good:'#d9e8c7', bad:'#f0d4d4', deep:'#a31d1d' };

  const MONO = '"JetBrains Mono", monospace', SANS = '"Noto Sans TC", sans-serif';

  const K = 3;
  /* 資料流:id 0..3 = nums,4..8 = add 的參數 */
  const SV = [4, 5, 8, 2, 3, 5, 10, 9, 4];
  const NNUM = 4;
  const OUT = ['null', '4', '5', '5', '8', '8'];
  const OUTL = ['ctor', 'add(3)', 'add(5)', 'add(10)', 'add(9)', 'add(4)'];

  /* heap: 底層陣列(存 stream id);cur: 剛 push 的 id;pop: 剛被 pop 的 id;seen: 已讀到第幾個;out: 已輸出幾個 */
  const S = (heap, cur, pop, seen, out, phase, text) => ({ heap, cur, pop, seen, out, phase, text });

  const steps = [
    S([], null, null, 0, 0, 'intro',
      '<strong>INITIAL</strong> · <code>k = 3</code>,<code>nums = [4,5,8,2]</code>,之後依序 <code>add(3), add(5), add(10), add(9), add(4)</code>。想法:<b>只留「目前最大的 3 個數」</b>,放進<strong>最小堆</strong> —— 這 3 個裡最小的(堆頂)<strong>就是第 3 大</strong>。'),

    S([0], 0, null, 1, 0, 'push',
      '<strong>建構子 · push 4</strong> · 堆是空的,<code>4</code> 直接放在 <code>index 0</code>,它就是堆頂。<code>size = 1 ≤ k</code>,不用 pop。'),
    S([0,1], 1, null, 2, 0, 'push',
      '<strong>push 5</strong> · 放在 <code>index 1</code>(4 的左小孩)。<code>5 ≥ 4</code>,不用往上浮。<code>size = 2 ≤ k</code>。'),
    S([0,1,2], 2, null, 3, 0, 'push',
      '<strong>push 8</strong> · 放在 <code>index 2</code>(4 的右小孩)。<code>size = 3 = k</code>,堆剛好滿了。'),
    S([3,0,2,1], 3, null, 4, 0, 'push',
      '<strong>push 2 · 超過 k 了</strong> · <code>2</code> 先放在 <code>index 3</code>,比父節點 <code>5</code> 小 → 上浮,再比 <code>4</code> 小 → 上浮到堆頂。陣列變成 <code>[2,4,8,5]</code>,<strong><code>size = 4 &gt; k = 3</code></strong>。'),
    S([0,1,2], null, 3, 4, 1, 'pop',
      '<strong>pop 2</strong> · 多出來的那一個,<b>一定是 4 個裡最小的</b> —— 它不可能是第 3 大,丟掉。堆剩 <code>[4,5,8]</code> = 目前最大的 3 個。建構子沒有回傳值 → 輸出 <code>null</code>。'),

    S([4,0,2,1], 4, null, 5, 1, 'push',
      '<strong>add(3) · push 3</strong> · <code>3</code> 從 <code>index 3</code> 一路上浮到堆頂:<code>[3,4,8,5]</code>。<strong><code>size = 4 &gt; k</code></strong>,要 pop。'),
    S([0,1,2], null, 4, 5, 2, 'pop',
      '<strong>pop 3 → return 4</strong> · 剛加進來的 <code>3</code> 比堆裡每個都小,<b>自己就被踢掉了</b>。堆沒變 <code>[4,5,8]</code>,<code>top = 4</code> —— 第 3 大還是 <code>4</code>。'),

    S([0,1,2,5], 5, null, 6, 2, 'push',
      '<strong>add(5) · push 5</strong> · 放在 <code>index 3</code>,父節點 <code>5</code> 不比它大,不用上浮:<code>[4,5,8,5]</code>。<strong><code>size = 4 &gt; k</code></strong>。'),
    S([1,5,2], null, 0, 6, 3, 'pop',
      '<strong>pop 4 → return 5</strong> · 這次被踢掉的是<strong>舊的堆頂 <code>4</code></strong> —— 新的 <code>5</code> 擠進了前 3 名。最後一個元素補到根、往下沉:<code>[5,5,8]</code>。<b>第 3 大從 4 變成 5。</b>'),

    S([1,5,2,6], 6, null, 7, 3, 'push',
      '<strong>add(10) · push 10</strong> · 放在 <code>index 3</code>,父節點 <code>5 &lt; 10</code>,不用上浮:<code>[5,5,8,10]</code>。<strong><code>size = 4 &gt; k</code></strong>。'),
    S([5,6,2], null, 1, 7, 4, 'pop',
      '<strong>pop 5 → return 5</strong> · 丟掉一個 <code>5</code>,另一個 <code>5</code> 補上堆頂:<code>[5,10,8]</code>。前 3 名是 <code>{10,8,5}</code>,<code>top = 5</code> —— <b>值沒變,但堆頂換了人</b>。'),

    S([5,7,2,6], 7, null, 8, 4, 'push',
      '<strong>add(9) · push 9</strong> · 放在 <code>index 3</code>,比父節點 <code>10</code> 小 → 上浮到 <code>index 1</code>;比 <code>5</code> 大,停。<code>[5,9,8,10]</code>,<strong><code>size = 4 &gt; k</code></strong>。'),
    S([2,7,6], null, 5, 8, 5, 'pop',
      '<strong>pop 5 → return 8</strong> · 最後的 <code>5</code> 被擠出前 3 名。<code>10</code> 補到根、下沉,<code>8</code> 升上堆頂:<code>[8,9,10]</code>。<b>第 3 大從 5 變成 8。</b>'),

    S([8,2,6,7], 8, null, 9, 5, 'push',
      '<strong>add(4) · push 4</strong> · <code>4</code> 比 <code>9</code>、<code>8</code> 都小,一路上浮到堆頂:<code>[4,8,10,9]</code>。<strong><code>size = 4 &gt; k</code></strong>。'),
    S([2,7,6], null, 8, 9, 6, 'pop',
      '<strong>pop 4 → return 8</strong> · <code>4</code> 太小,剛進來就被踢掉。堆回到 <code>[8,9,10]</code>,<code>top = 8</code>。'),

    S([2,7,6], null, null, 9, 6, 'done',
      '<strong>完成</strong> · 輸出 <code>[null,4,5,5,8,8]</code>。5 次 add 只有 2 次改變答案(<code>4→5</code>、<code>5→8</code>)。堆大小最多 <code>k+1</code>,每次 push / pop 是 <code>O(log k)</code>:建構子 <code>O(n log k)</code>、每次 add <code>O(log k)</code>,空間 <code>O(k)</code>。'),
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

  const B1 = 18, B2 = 110, B3 = 330;   // band 標題基線
  const R = 18;

  function draw(){
    fit();
    const s = steps[step], w = canvas.clientWidth, H = canvas.clientHeight, PAD = 24;
    const done = s.phase === 'done', isPop = s.phase === 'pop';
    const over = s.heap.length > K;
    ctx.fillStyle = C.paper; ctx.fillRect(0,0,w,H); ctx.setLineDash([]);
    const inHeap = new Set(s.heap);
    const topId = s.heap.length ? s.heap[0] : null;

    /* ---------- BAND 1 · 資料流 ---------- */
    head('BAND 1 · 資料流   紅 = 目前　藍底 = 在堆裡　灰 = 已丟掉　深紅 = 剛 pop', PAD, B1);
    const sy = B1 + 12, sh = 30, sgap = 8, sepW = 28;
    const sw = Math.min(56, (w - 2*PAD - 8*sgap - sepW) / 9);
    const sx = i => PAD + i*(sw + sgap) + (i >= NNUM ? sepW : 0);
    const lastSeen = s.seen - 1;
    for (let i = 0; i < SV.length; i++) {
      const x = sx(i);
      let fill = C.paper, st = C.off, tc = C.off, lw = 1.2, dash = [3,3];
      if (i < s.seen) {
        dash = null;
        if (i === s.pop)            { fill = C.bad;  st = C.deep; tc = C.deep; lw = 2.4; }
        else if (i === s.cur)       { fill = C.cur;  st = C.curS; tc = C.curT; lw = 2.4; }
        else if (inHeap.has(i))     { fill = C.up;   st = C.ink;  tc = C.ink;  lw = 1.4; }
        else                        { fill = C.paper; st = C.off; tc = C.off;  lw = 1.4; }
      }
      box(x, sy, sw, sh, fill, st, lw, dash);
      txt(String(SV[i]), x + sw/2, sy + sh/2 + 1, tc, '700 13px '+MONO);
      if (i < s.seen && !inHeap.has(i) && i !== s.pop) {   // 已丟掉:斜線
        ctx.strokeStyle = C.off; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(x + 8, sy + sh - 7); ctx.lineTo(x + sw - 8, sy + 7); ctx.stroke();
      }
    }
    // 分隔線
    const sepX = sx(NNUM - 1) + sw + sgap/2 + sepW/2;
    ctx.strokeStyle = C.dim; ctx.lineWidth = 1.4; ctx.setLineDash([4,3]);
    ctx.beginPath(); ctx.moveTo(sepX, sy - 4); ctx.lineTo(sepX, sy + sh + 4); ctx.stroke(); ctx.setLineDash([]);
    const capY = sy + sh + 16;
    txt('nums(建構子)', sx(0), capY, C.dim, '600 11px '+SANS, 'left', 'middle');
    txt('add(val) 逐一呼叫', sx(NNUM), capY, C.dim, '600 11px '+SANS, 'left', 'middle');
    // 右上:k
    const kx = sx(8) + sw + 16;
    if (kx + 70 < w - PAD + 1) {
      box(kx, sy, w - PAD - kx, sh, C.low, C.ink, 1.4);
      txt('k = ' + K, kx + (w - PAD - kx)/2, sy + sh/2 + 1, C.ink, '700 13px '+MONO);
    } else {
      txt('k = ' + K, w - PAD, capY, C.ink, '700 12px '+MONO, 'right', 'middle');
    }

    /* ---------- BAND 2 · 堆 ---------- */
    head('BAND 2 · 最小堆(樹 ⇄ 陣列,堆頂 = [0])', PAD, B2);
    const innerW = w - 2*PAD;
    const treeW = Math.min(innerW * 0.5, 360);
    const tx0 = PAD;
    const LV = [B2 + 44, B2 + 100, B2 + 156];
    const pos = i => {
      const lvl = i === 0 ? 0 : (i <= 2 ? 1 : 2);
      const idxIn = i - ((1 << lvl) - 1), n = 1 << lvl;
      return { x: tx0 + treeW * (idxIn + 0.5) / n, y: LV[lvl] };
    };
    // 邊
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
    // 節點
    s.heap.forEach((id, i) => {
      const p = pos(i);
      let fill = C.up, st = C.ink, tc = C.ink, lw = 1.5;
      if (id === s.cur)            { fill = C.cur; st = C.curS; tc = C.curT; lw = 2.6; }
      else if (i === 0)            { fill = (isPop || done) ? C.good : C.low; lw = 2.4; }
      circ(p.x, p.y, R, fill, st, lw);
      txt(String(SV[id]), p.x, p.y + 1, tc, '700 14px '+MONO);
      txt('[' + i + ']', p.x, p.y + R + 11, C.dim, '600 10px '+MONO, 'center', 'middle');
      if (i === 0) txt(id === s.cur ? 'top · 新' : 'top', p.x, p.y - R - 6, id === s.cur ? C.curT : C.ink, '700 11px '+MONO+', '+SANS, 'center', 'alphabetic');
      else if (id === s.cur) txt('新', p.x, p.y - R - 6, C.curT, '700 11px '+SANS, 'center', 'alphabetic');
    });
    // 被 pop 的節點:畫在根的右邊
    if (s.pop !== null) {
      const r0 = pos(0), px = r0.x + Math.min(treeW * 0.34, 120), py = r0.y;
      ctx.strokeStyle = C.deep; ctx.lineWidth = 1.6; ctx.setLineDash([4,3]);
      ctx.beginPath(); ctx.moveTo(r0.x + R + 4, py); ctx.lineTo(px - R - 8, py); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = C.deep; ctx.beginPath(); ctx.moveTo(px - R - 2, py); ctx.lineTo(px - R - 10, py - 5); ctx.lineTo(px - R - 10, py + 5); ctx.closePath(); ctx.fill();
      circ(px, py, R, C.bad, C.deep, 2.4);
      txt(String(SV[s.pop]), px, py + 1, C.deep, '700 14px '+MONO);
      txt('pop', px, py - R - 6, C.deep, '700 11px '+MONO, 'center', 'alphabetic');
    }

    // 陣列
    const ax = PAD + treeW + 28, aw = w - PAD - ax;
    const cw = Math.min(56, (aw - 3*10) / 4), cg = 10, ch = 36;
    const idxY = B2 + 26, cellTop = B2 + 40, arrW = 4*cw + 3*cg;
    txt('底層 vector', ax + arrW, B2,  C.dim, '600 11px '+MONO+', '+SANS, 'right', 'alphabetic');
    for (let i = 0; i < 4; i++) {
      const x = ax + i*(cw + cg);
      txt(String(i), x + cw/2, idxY, (i === 3 && over) ? C.curT : C.dim, '600 11px '+MONO, 'center', 'alphabetic');
      const id = s.heap[i];
      if (id === undefined) { box(x, cellTop, cw, ch, C.paper, C.off, 1.2, [3,3]); continue; }
      let fill = C.paper, st = C.ink, tc = C.ink, lw = 1.4;
      if (id === s.cur)        { fill = C.cur; st = C.curS; tc = C.curT; lw = 2.4; }
      else if (i === 0)        { fill = (isPop || done) ? C.good : C.low; lw = 2.2; }
      else                     { fill = C.up; }
      box(x, cellTop, cw, ch, fill, st, lw);
      txt(String(SV[id]), x + cw/2, cellTop + ch/2 + 1, tc, '700 14px '+MONO);
    }
    // 說明 chips
    const c1 = cellTop + ch + 16, chH = 30;
    const sizeTxt = 'size = ' + s.heap.length + (over ? ' > k = ' + K : (s.heap.length === K ? ' = k' : ' ≤ k = ' + K));
    if (over) box(ax, c1, arrW, chH, C.cur, C.curS, 2);
    else box(ax, c1, arrW, chH, C.paper, C.ink, 1.2);
    txt((over ? '⚠ ' : '') + sizeTxt, ax + arrW/2, c1 + chH/2 + 1, over ? C.curT : C.ink, '700 12.5px '+MONO);
    const c2 = c1 + chH + 12;
    if (over) {
      box(ax, c2, arrW, chH, C.paper, C.curS, 1.4, [4,3]);
      txt('下一步:pop 掉堆頂 ' + SV[s.heap[0]], ax + arrW/2, c2 + chH/2 + 1, C.curT, '700 12px '+MONO+', '+SANS);
    } else if (s.pop !== null) {
      box(ax, c2, arrW, chH, C.bad, C.deep, 2);
      txt('pop ' + SV[s.pop] + ' → 丟掉(最小的)', ax + arrW/2, c2 + chH/2 + 1, C.deep, '700 12px '+MONO+', '+SANS);
    } else if (done) {
      box(ax, c2, arrW, chH, C.good, C.ink, 1.4);
      txt('堆 = 最大的 3 個 {8,9,10}', ax + arrW/2, c2 + chH/2 + 1, C.ink, '700 12px '+MONO+', '+SANS);
    } else if (s.heap.length) {
      box(ax, c2, arrW, chH, C.paper, C.off, 1.2, [3,3]);
      txt('未超過 k,不用 pop', ax + arrW/2, c2 + chH/2 + 1, C.dim, '600 12px '+SANS);
    } else {
      box(ax, c2, arrW, chH, C.paper, C.off, 1.2, [3,3]);
      txt('規則:size > k 就 pop', ax + arrW/2, c2 + chH/2 + 1, C.dim, '600 12px '+SANS);
    }

    /* ---------- BAND 3 · 輸出 ---------- */
    head('BAND 3 · 輸出', PAD, B3);
    const oy = B3 + 12, oh = 32, og = 10;
    const chipW = Math.min(230, Math.max(170, innerW * 0.32));
    const ow = Math.min(64, (innerW - chipW - 20 - 5*og) / 6);
    for (let i = 0; i < 6; i++) {
      const x = PAD + i*(ow + og);
      if (i >= s.out) { box(x, oy, ow, oh, C.paper, C.off, 1.2, [3,3]); }
      else {
        const newest = i === s.out - 1 && isPop;
        const changed = (i === 2 || i === 4);
        box(x, oy, ow, oh, i === 0 ? C.paper : (changed ? C.good : C.up), newest ? C.curS : C.ink, newest ? 2.4 : 1.4);
        txt(OUT[i], x + ow/2, oy + oh/2 + 1, newest ? C.curT : C.ink, '700 13px '+MONO);
      }
      txt(OUTL[i], x + ow/2, oy + oh + 14, i < s.out ? C.dim : C.off, '600 10.5px '+MONO, 'center', 'middle');
    }
    const cx = w - PAD - chipW;
    if (topId !== null && (isPop || done)) {
      box(cx, oy, chipW, oh, C.good, C.ink, 2);
      txt('第 k 大 = top = ' + SV[topId], cx + chipW/2, oy + oh/2 + 1, C.ink, '700 13px '+MONO+', '+SANS);
    } else if (topId !== null) {
      box(cx, oy, chipW, oh, C.low, C.ink, 1.4);
      txt('top = ' + SV[topId] + '(還沒 pop)', cx + chipW/2, oy + oh/2 + 1, C.ink, '700 12.5px '+MONO+', '+SANS);
    } else {
      box(cx, oy, chipW, oh, C.paper, C.off, 1.2, [3,3]);
      txt('第 k 大 = top', cx + chipW/2, oy + oh/2 + 1, C.dim, '700 12.5px '+MONO+', '+SANS);
    }
    txt('只有 add(5)、add(9) 改變答案(綠)', cx + chipW, oy + oh + 14, done ? C.ink : C.off, '600 10.5px '+SANS, 'right', 'middle');
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
