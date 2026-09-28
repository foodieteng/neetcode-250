/* ============================================================
   P1046 · Last Stone Weight — 最大堆 · 每輪拿最重的兩顆互撞 · viz
     priority_queue<int> pq(stones.begin(), stones.end());
     while (pq.size() > 1) { x = top; pop; y = top; pop; if (x != y) pq.push(x - y); }
     return pq.size() ? pq.top() : 0;
   動畫要傳達的一件事:最大堆讓「最重的兩顆」永遠在最上面,
   每輪 pop 兩次拿到 x ≥ y,撞完只剩 x−y(或兩顆都消失),再丟回堆裡。
   例 stones = [2,7,4,1,8,1] → 1
     底層陣列取自 libstdc++ 實測(range ctor = make_heap;元素帶 id 追蹤哪一顆):
       init  [8,7,4,1,2,1]
       it1   x=8 [0], y=7 [1] → push 1(落在 [4]) → [4,2,1,1,1]
       it2   x=4 [0], y=2 [1] → push 2(上浮到 [0]) → [2,1,1,1]
       it3   x=2 [0], y=1 [2] → push 1(落在 [2]) → [1,1,1]
       it4   x=1 [0], y=1 [1] → 同歸於盡 → [1]
       size 1 → return 1
     BAND 1  最大堆:左邊畫成二元樹,右邊是底層陣列 index 0..5
     BAND 2  互撞:x − y = d(或 x == y → 兩顆都消失)
     BAND 3  每輪紀錄 + 「剩 n 顆」
   前綴 v1046- 。
   ============================================================ */
(function () {
  const canvas = document.getElementById('v1046-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('v1046-step'), labelEl = document.getElementById('v1046-label');
  const bPrev = document.getElementById('v1046-prev'), bNext = document.getElementById('v1046-next'),
        bPlay = document.getElementById('v1046-play'), bReset = document.getElementById('v1046-reset');

  const C = { paper:'#ffffff', ink:'#1f1f1f', dim:'#5a5a5a', off:'#cfcfcf',
    up:'#e3edf5', low:'#f6ead8',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424',
    good:'#d9e8c7', bad:'#f0d4d4', deep:'#a31d1d' };

  const MONO = '"JetBrains Mono", monospace', SANS = '"Noto Sans TC", sans-serif';

  const ROUNDS = [
    { x: 8, y: 7, d: 1 },
    { x: 4, y: 2, d: 2 },
    { x: 2, y: 1, d: 1 },
    { x: 1, y: 1, d: 0 },
  ];

  /* arr: 底層陣列;xi/yi: 本輪 x、y 在陣列的位置;ni: 剛 push 的新石頭位置;
     r: 第幾輪(0-based);done: 已完成幾輪;phase: input | heap | pick | smash | end */
  const S = (arr, phase, r, done, xi, yi, ni, text) => ({ arr, phase, r, done, xi, yi, ni, text });

  const steps = [
    S([2,7,4,1,8,1], 'input', -1, 0, -1, -1, -1,
      '<strong>INITIAL</strong> · <code>stones = [2,7,4,1,8,1]</code>。規則:每輪拿<b>最重的兩顆</b> <code>x ≥ y</code> 互撞 —— 一樣重就兩顆都碎掉,不一樣重就剩一顆 <code>x − y</code>。要一直「拿最大的」→ 用<strong>最大堆</strong>。現在只是原始陣列,還不是堆(灰)。'),
    S([8,7,4,1,2,1], 'heap', -1, 0, -1, -1, -1,
      '<strong>建堆</strong> · <code>priority_queue&lt;int&gt; pq(stones.begin(), stones.end())</code> 等於做一次 <code>make_heap</code>,<code>O(n)</code>。陣列變成 <code>[8,7,4,1,2,1]</code>:每個父節點 ≥ 小孩,<b>最重的 <code>8</code> 在堆頂 <code>[0]</code></b>。'),

    S([8,7,4,1,2,1], 'pick', 0, 0, 0, 1, -1,
      '<strong>第 1 輪 · 取出 x, y</strong> · <code>x = top = 8</code>,pop;這時新的堆頂是 <code>8</code> 的較大小孩 <code>7</code> → <code>y = 7</code>,再 pop。<b>第二重的一定是根的某個小孩</b>,所以兩次 pop 就拿到前兩名。'),
    S([4,2,1,1,1], 'smash', 0, 1, -1, -1, 4,
      '<strong>第 1 輪 · 撞 → push 1</strong> · <code>8 ≠ 7</code>,剩 <code>8 − 7 = 1</code> 丟回堆裡(放在 <code>[4]</code>,父節點 <code>2 ≥ 1</code>,不用上浮)。陣列 <code>[4,2,1,1,1]</code>,<b>6 顆 → 5 顆</b>。'),

    S([4,2,1,1,1], 'pick', 1, 1, 0, 1, -1,
      '<strong>第 2 輪 · 取出 x, y</strong> · <code>x = 4</code>(堆頂),pop 之後堆頂換成 <code>2</code> → <code>y = 2</code>。'),
    S([2,1,1,1], 'smash', 1, 2, -1, -1, 0,
      '<strong>第 2 輪 · 撞 → push 2</strong> · 剩 <code>4 − 2 = 2</code>。push 時放在尾端 <code>[3]</code>,比父節點 <code>1</code> 大 → 上浮,再比 <code>1</code> 大 → <b>一路浮到堆頂 <code>[0]</code></b>。陣列 <code>[2,1,1,1]</code>,剩 4 顆。'),

    S([2,1,1,1], 'pick', 2, 2, 0, 2, -1,
      '<strong>第 3 輪 · 取出 x, y</strong> · <code>x = 2</code> —— 就是上一輪撞出來的碎石,<b>碎石照樣可以再被拿出來撞</b>。pop 之後堆頂是 <code>1</code> → <code>y = 1</code>(三顆 1 一樣重,拿哪顆結果都一樣)。'),
    S([1,1,1], 'smash', 2, 3, -1, -1, 2,
      '<strong>第 3 輪 · 撞 → push 1</strong> · 剩 <code>2 − 1 = 1</code>,丟回堆(落在 <code>[2]</code>)。陣列 <code>[1,1,1]</code>,剩 3 顆。'),

    S([1,1,1], 'pick', 3, 3, 0, 1, -1,
      '<strong>第 4 輪 · 取出 x, y</strong> · <code>x = 1</code>、<code>y = 1</code>。<strong>一樣重!</strong>'),
    S([1], 'smash', 3, 4, -1, -1, -1,
      '<strong>第 4 輪 · 同歸於盡</strong> · <code>x == y</code> → <b>兩顆都消失,什麼都不 push</b>。陣列只剩 <code>[1]</code>。每輪至少少 1 顆,這輪一次少 2 顆。'),

    S([1], 'end', -1, 4, -1, -1, -1,
      '<strong>完成 · return 1</strong> · <code>pq.size() == 1</code>,不再進 while → 回傳 <code>pq.top() = 1</code>(若剛好撞到 0 顆則回傳 <code>0</code>)。最多 <code>n − 1</code> 輪,每輪 pop / push 都是 <code>O(log n)</code> → 時間 <code>O(n log n)</code>,空間 <code>O(n)</code>。'),
  ];

  let step = 0, timer = null;

  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||404; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function box(x,y,w,h,fill,stroke,lw,dash){ rr(x,y,w,h,5); ctx.fillStyle=fill; ctx.fill(); ctx.lineWidth=lw||1.4; if(dash) ctx.setLineDash(dash); ctx.strokeStyle=stroke; ctx.stroke(); ctx.setLineDash([]); }
  function txt(s,x,y,color,font,align,base){ ctx.fillStyle=color; ctx.font=font; ctx.textAlign=align||'center'; ctx.textBaseline=base||'middle'; ctx.fillText(s,x,y); }
  function head(s,x,y,color){ txt(s,x,y,color||C.dim,'600 12px '+MONO+', '+SANS,'left','alphabetic'); }
  function circ(x,y,r,fill,stroke,lw,dash){ ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fillStyle=fill; ctx.fill(); ctx.lineWidth=lw; if(dash) ctx.setLineDash(dash); ctx.strokeStyle=stroke; ctx.stroke(); ctx.setLineDash([]); }

  const B1 = 18, B2 = 234, B3 = 334;   // band 標題基線
  const R = 18, NMAX = 6;

  /* 某一格的樣式:x 紅、y 深紅、新 push 綠、堆頂 米色、其它 淺藍;input 階段一律灰 */
  function styleOf(s, i){
    if (s.phase === 'input') return { fill: C.paper, st: C.off, tc: C.dim, lw: 1.4 };
    if (i === s.xi) return { fill: C.cur, st: C.curS, tc: C.curT, lw: 2.6 };
    if (i === s.yi) return { fill: C.bad, st: C.deep, tc: C.deep, lw: 2.6 };
    if (i === s.ni) return { fill: C.good, st: C.ink, tc: C.ink, lw: 2.6 };
    if (i === 0)    return { fill: s.phase === 'end' ? C.good : C.low, st: C.ink, tc: C.ink, lw: 2.2 };
    return { fill: C.up, st: C.ink, tc: C.ink, lw: 1.5 };
  }

  function draw(){
    fit();
    const s = steps[step], w = canvas.clientWidth, H = canvas.clientHeight, PAD = 24;
    const innerW = w - 2*PAD;
    ctx.fillStyle = C.paper; ctx.fillRect(0,0,w,H); ctx.setLineDash([]);
    const rd = s.r >= 0 ? ROUNDS[s.r] : null;

    /* ---------- BAND 1 · 最大堆 ---------- */
    head(s.phase === 'input'
      ? 'BAND 1 · 原始 stones(還不是堆)'
      : 'BAND 1 · 最大堆   紅 = x(最重)　深紅 = y(第二重)　綠 = 剛 push', PAD, B1);
    const treeW = Math.min(innerW * 0.5, 340);
    const LV = [B1 + 46, B1 + 102, B1 + 158];
    const pos = i => {
      const lvl = i === 0 ? 0 : (i <= 2 ? 1 : 2);
      const idxIn = i - ((1 << lvl) - 1), n = 1 << lvl;
      return { x: PAD + treeW * (idxIn + 0.5) / n, y: LV[lvl] };
    };
    for (let i = 1; i < s.arr.length; i++) {
      const p = pos((i - 1) >> 1), c = pos(i);
      const dx = c.x - p.x, dy = c.y - p.y, L = Math.hypot(dx, dy), ux = dx/L, uy = dy/L;
      ctx.strokeStyle = s.phase === 'input' ? C.off : C.ink; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(p.x + ux*R, p.y + uy*R); ctx.lineTo(c.x - ux*R, c.y - uy*R); ctx.stroke();
    }
    s.arr.forEach((v, i) => {
      const p = pos(i), st = styleOf(s, i);
      circ(p.x, p.y, R, st.fill, st.st, st.lw);
      txt(String(v), p.x, p.y + 1, st.tc, '700 14px '+MONO);
      txt('[' + i + ']', p.x, p.y + R + 11, C.dim, '600 10px '+MONO, 'center', 'middle');
      let tag = null, tc = C.ink;
      if (i === s.xi) { tag = 'x'; tc = C.curT; }
      else if (i === s.yi) { tag = 'y'; tc = C.deep; }
      else if (i === s.ni) { tag = i === 0 ? 'top · 新' : '新'; }
      else if (i === 0 && s.phase !== 'input') tag = 'top';
      if (tag) txt(tag, p.x, p.y - R - 6, tc, '700 11px '+MONO+', '+SANS, 'center', 'alphabetic');
    });
    if (s.arr.length === 1) {   // 只剩一顆:樹區下半部放說明,避免空白
      const p = pos(0);
      txt('只剩一顆', p.x + R + 12, p.y + 1, C.ink, '700 12px '+SANS, 'left', 'middle');
      const nw = Math.min(treeW - 16, 300), nx = PAD + (treeW - nw)/2, ny = LV[1] - 8, nh = 56;
      const tie = s.phase === 'smash';
      box(nx, ny, nw, nh, tie ? C.bad : C.good, tie ? C.deep : C.ink, 1.4, tie ? [4,3] : null);
      txt(tie ? 'x = 1、y = 1 都 pop 掉' : 'while (pq.size() > 1) 不成立', nx + nw/2, ny + 19, tie ? C.deep : C.ink, '700 12px '+MONO+', '+SANS);
      txt(tie ? '一樣重 → 沒有石頭 push 回來' : '剩下這顆就是答案', nx + nw/2, ny + 38, tie ? C.deep : C.ink, '600 11px '+SANS);
    }

    // 陣列
    const ax = PAD + treeW + 28, aw = w - PAD - ax, cg = 8;
    const cw = Math.min(48, (aw - (NMAX-1)*cg) / NMAX), ch = 36, arrW = NMAX*cw + (NMAX-1)*cg;
    const idxY = B1 + 22, cellTop = B1 + 34;
    txt(s.phase === 'input' ? 'stones' : '底層 vector', ax + arrW, B1, C.dim, '600 11px '+MONO+', '+SANS, 'right', 'alphabetic');
    for (let i = 0; i < NMAX; i++) {
      const x = ax + i*(cw + cg);
      txt(String(i), x + cw/2, idxY, i < s.arr.length ? C.dim : C.off, '600 11px '+MONO, 'center', 'alphabetic');
      if (i >= s.arr.length) { box(x, cellTop, cw, ch, C.paper, C.off, 1.2, [3,3]); continue; }
      const st = styleOf(s, i);
      box(x, cellTop, cw, ch, st.fill === C.up ? C.paper : st.fill, st.st, st.lw);
      txt(String(s.arr[i]), x + cw/2, cellTop + ch/2 + 1, st.tc, '700 14px '+MONO);
    }
    // chips
    const c1 = cellTop + ch + 16, chH = 30;
    box(ax, c1, arrW, chH, s.arr.length === 1 ? C.good : C.paper, C.ink, s.arr.length === 1 ? 2 : 1.2);
    txt(s.phase === 'input' ? 'stones.size() = 6 顆' : 'pq.size() = ' + s.arr.length + (s.arr.length > 1 ? ' > 1 → 繼續撞' : ' → 停'),
        ax + arrW/2, c1 + chH/2 + 1, C.ink, '700 12px '+MONO+', '+SANS);
    const c2 = c1 + chH + 12;
    if (s.phase === 'input') {
      box(ax, c2, arrW, chH, C.paper, C.off, 1.2, [3,3]);
      txt('下一步:建成最大堆', ax + arrW/2, c2 + chH/2 + 1, C.dim, '600 12px '+SANS);
    } else if (s.phase === 'heap') {
      box(ax, c2, arrW, chH, C.low, C.ink, 1.4);
      txt('make_heap · 堆頂 = 最大 = 8', ax + arrW/2, c2 + chH/2 + 1, C.ink, '700 12px '+MONO+', '+SANS);
    } else if (s.phase === 'pick') {
      box(ax, c2, arrW, chH, C.cur, C.curS, 2);
      txt('pop ×2 → x = ' + rd.x + ',y = ' + rd.y, ax + arrW/2, c2 + chH/2 + 1, C.curT, '700 12px '+MONO+', '+SANS);
    } else if (s.phase === 'smash') {
      const r = ROUNDS[s.done - 1];
      if (r.d > 0) { box(ax, c2, arrW, chH, C.good, C.ink, 1.6);
        txt('push ' + r.d + ' → 落在 [' + s.ni + ']', ax + arrW/2, c2 + chH/2 + 1, C.ink, '700 12px '+MONO+', '+SANS); }
      else { box(ax, c2, arrW, chH, C.bad, C.deep, 2);
        txt('x == y → 不 push', ax + arrW/2, c2 + chH/2 + 1, C.deep, '700 12px '+MONO+', '+SANS); }
    } else {
      box(ax, c2, arrW, chH, C.good, C.ink, 2);
      txt('return pq.top() = 1', ax + arrW/2, c2 + chH/2 + 1, C.ink, '700 12.5px '+MONO);
    }

    /* ---------- BAND 2 · 互撞 ---------- */
    head('BAND 2 · 互撞   x − y = d', PAD, B2);
    const by = B2 + 14, bh = 44, bw = 64, sg = 30;
    const bx = [PAD, PAD + bw + sg, PAD + 2*(bw + sg)];
    const smashR = s.phase === 'smash' ? ROUNDS[s.done - 1] : null;
    const shown = rd || smashR;        // pick:rd;smash:剛撞完那輪
    const capY = by + bh + 14;
    // x
    if (shown) { box(bx[0], by, bw, bh, C.cur, C.curS, 2.4); txt(String(shown.x), bx[0] + bw/2, by + bh/2 + 1, C.curT, '700 18px '+MONO); }
    else { box(bx[0], by, bw, bh, C.paper, C.off, 1.2, [3,3]); txt('x', bx[0] + bw/2, by + bh/2 + 1, C.off, '700 16px '+MONO); }
    txt('x 最重', bx[0] + bw/2, capY, shown ? C.curT : C.off, '600 11px '+SANS);
    txt('−', bx[0] + bw + sg/2, by + bh/2, shown ? C.ink : C.off, '700 18px '+MONO);
    // y
    if (shown) { box(bx[1], by, bw, bh, C.bad, C.deep, 2.4); txt(String(shown.y), bx[1] + bw/2, by + bh/2 + 1, C.deep, '700 18px '+MONO); }
    else { box(bx[1], by, bw, bh, C.paper, C.off, 1.2, [3,3]); txt('y', bx[1] + bw/2, by + bh/2 + 1, C.off, '700 16px '+MONO); }
    txt('y 第二重', bx[1] + bw/2, capY, shown ? C.deep : C.off, '600 11px '+SANS);
    txt('=', bx[1] + bw + sg/2, by + bh/2, shown ? C.ink : C.off, '700 18px '+MONO);
    // d
    if (smashR && smashR.d > 0) {
      box(bx[2], by, bw, bh, C.good, C.ink, 2.4); txt(String(smashR.d), bx[2] + bw/2, by + bh/2 + 1, C.ink, '700 18px '+MONO);
      txt('push 回堆', bx[2] + bw/2, capY, C.ink, '600 11px '+SANS);
    } else if (smashR) {
      box(bx[2], by, bw, bh, C.bad, C.deep, 2.4); txt('0', bx[2] + bw/2, by + bh/2 + 1, C.deep, '700 18px '+MONO);
      ctx.strokeStyle = C.deep; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(bx[2] + 10, by + bh - 8); ctx.lineTo(bx[2] + bw - 10, by + 8); ctx.stroke();
      txt('消失', bx[2] + bw/2, capY, C.deep, '700 11px '+SANS);
    } else if (rd) {
      box(bx[2], by, bw, bh, C.paper, C.curS, 1.6, [4,3]); txt('?', bx[2] + bw/2, by + bh/2 + 1, C.curT, '700 18px '+MONO);
      txt('下一步', bx[2] + bw/2, capY, C.curT, '600 11px '+SANS);
    } else {
      box(bx[2], by, bw, bh, C.paper, C.off, 1.2, [3,3]); txt('d', bx[2] + bw/2, by + bh/2 + 1, C.off, '700 16px '+MONO);
      txt('d', bx[2] + bw/2, capY, C.off, '600 11px '+SANS);
    }
    // 右側規則 chip
    const rx = bx[2] + bw + 28, rw = w - PAD - rx;
    let rFill = C.paper, rSt = C.off, rLw = 1.2, rDash = [3,3], rTc = C.dim, l1, l2;
    if (s.phase === 'end') {
      rFill = C.good; rSt = C.ink; rLw = 2; rDash = null; rTc = C.ink;
      l1 = 'size = 1 → 跳出 while'; l2 = 'return pq.size() ? pq.top() : 0 → 1';
    } else if (smashR && smashR.d > 0) {
      rFill = C.good; rSt = C.ink; rLw = 1.6; rDash = null; rTc = C.ink;
      l1 = smashR.x + ' ≠ ' + smashR.y + ' → 剩一顆 ' + smashR.d; l2 = '兩顆出、一顆回:少 1 顆';
    } else if (smashR) {
      rFill = C.bad; rSt = C.deep; rLw = 2; rDash = null; rTc = C.deep;
      l1 = 'x == y → 兩顆都消失'; l2 = '兩顆出、零顆回:少 2 顆';
    } else if (rd) {
      rFill = C.cur; rSt = C.curS; rLw = 1.6; rDash = null; rTc = C.curT;
      l1 = '第 ' + (s.r + 1) + ' 輪:x = ' + rd.x + ',y = ' + rd.y; l2 = rd.x === rd.y ? '一樣重 → ?' : 'x > y → 會剩 x − y';
    } else {
      l1 = 'x ≠ y → push(x − y)'; l2 = 'x == y → 兩顆都消失';
    }
    box(rx, by, rw, bh, rFill, rSt, rLw, rDash);
    txt(l1, rx + 14, by + 15, rTc, '700 12px '+MONO+', '+SANS, 'left', 'middle');
    txt(l2, rx + 14, by + 31, rTc, '600 11px '+MONO+', '+SANS, 'left', 'middle');

    /* ---------- BAND 3 · 每輪紀錄 ---------- */
    head('BAND 3 · 每輪紀錄', PAD, B3);
    const oy = B3 + 12, oh = 32, og = 10;
    const cntW = Math.min(150, Math.max(110, innerW * 0.2));
    const ow = (innerW - cntW - 24 - 3*og) / 4;
    for (let i = 0; i < 4; i++) {
      const x = PAD + i*(ow + og), r = ROUNDS[i];
      const doneR = i < s.done, curR = i === s.r;
      const justDone = s.phase === 'smash' && i === s.done - 1;
      if (doneR) {
        const tie = r.d === 0;
        box(x, oy, ow, oh, tie ? C.bad : C.up, justDone ? (tie ? C.deep : C.curS) : C.ink, justDone ? 2.4 : 1.4);
        txt(r.x + '−' + r.y + '=' + r.d + (tie ? ' 消失' : ''), x + ow/2, oy + oh/2 + 1,
            tie ? C.deep : (justDone ? C.curT : C.ink), '700 12.5px '+MONO+', '+SANS);
      } else if (curR) {
        box(x, oy, ow, oh, C.paper, C.curS, 1.8, [4,3]);
        txt(r.x + '−' + r.y + '=?', x + ow/2, oy + oh/2 + 1, C.curT, '700 12.5px '+MONO);
      } else {
        box(x, oy, ow, oh, C.paper, C.off, 1.2, [3,3]);
      }
      txt('第 ' + (i + 1) + ' 輪', x + ow/2, oy + oh + 14, (doneR || curR) ? C.dim : C.off, '600 10.5px '+SANS, 'center', 'middle');
    }
    const kx = w - PAD - cntW, n = s.arr.length;
    box(kx, oy, cntW, oh, n === 1 ? C.good : C.low, C.ink, n === 1 ? 2.2 : 1.4);
    txt('剩 ' + n + ' 顆', kx + cntW/2, oy + oh/2 + 1, C.ink, '700 13px '+SANS);
    txt(s.phase === 'end' ? '答案 = 1' : '6 → 5 → 4 → 3 → 1', kx + cntW/2, oy + oh + 14, C.dim, '600 10.5px '+MONO+', '+SANS, 'center', 'middle');
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
