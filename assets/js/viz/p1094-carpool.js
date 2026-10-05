/* ============================================================
   P1094 · Car Pooling — 依 from 排序 + 最小堆(依 to)· viz
     sort(trips by from);
     for (num, from, to):
       while (!pq.empty() && pq.top().first <= from) { passenger -= pq.top().second; pq.pop(); }
       passenger += num; if (passenger > capacity) return false;
       pq.emplace(to, num);
     return true;
   例 trips [[2,1,5],[3,3,7],[1,5,8],[2,7,9]], capacity 5 → true(g++ 實跑 trace)
     (2,1→5):heap 空,上車 p=2,push (5,2)
     (3,3→7):top to 5 > 3 不下車,上車 p=5(= cap ok),push (7,3)
     (1,5→8):(5,2) 下車 5 ≤ 5 → p=3,上車 p=4,push (8,1)
     (2,7→9):(7,3) 下車 7 ≤ 7 → p=1,上車 p=3,push (9,2)
     若寫成 `<`:from=5 沒人下車,p = 5 + 1 = 6 > 5 → false
   BAND 1  數線 0..10,每趟一條 [from, to),紅豎線 = 目前上車點 from
   BAND 2  最小堆(依 to 排),右邊 = 這一步下車的
   BAND 3  乘客量表 vs capacity 5 + 這一步做了什麼
   前綴 v1094- 。
   ============================================================ */
(function () {
  const canvas = document.getElementById('v1094-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('v1094-step'), labelEl = document.getElementById('v1094-label');
  const bPrev = document.getElementById('v1094-prev'), bNext = document.getElementById('v1094-next'),
        bPlay = document.getElementById('v1094-play'), bReset = document.getElementById('v1094-reset');

  const C = { paper:'#ffffff', ink:'#1f1f1f', dim:'#5a5a5a', off:'#cfcfcf',
    up:'#e3edf5', low:'#f6ead8',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424',
    good:'#d9e8c7', bad:'#f0d4d4', deep:'#a31d1d' };
  const MONO = '"JetBrains Mono", monospace', SANS = '"Noto Sans TC", sans-serif';

  const TR = [[2,1,5],[3,3,7],[1,5,8],[2,7,9]];
  const CAP = 5, XMAX = 10, GMAX = 6;

  /* lanes:每趟狀態 w=還沒輪到 c=目前 o=在車上 L=這一步下車 x=已下車 s=該下沒下(變體)
     from:紅線位置;heap:[[to,num]] 依 to 排;nw:剛 push 的 to;leave:這一步下車的 [to,num]
     cmp:[文字, kind];p:乘客數;board:目前這趟已上車;chk:[文字, kind] */
  const S = (lanes, from, board, heap, nw, leave, cmp, p, act, chk, text) =>
    ({ lanes, from, board, heap, nw, leave, cmp, p, act, chk, text });

  const STEPS = [
    S('wwww', null, false, [], null, null, ['heap 空', 'none'], 0, '先依 from 排序(這組已排好)', ['', 'none'],
      '<strong>INITIAL</strong> · 依 <code>from</code> 由小到大處理每一趟。<b>最小堆依 <code>to</code> 排</b>,堆頂 = 最早下車的那批。每趟分兩步:<strong>① 先讓 to ≤ from 的全部下車 ② 再上車、檢查 &gt; capacity</strong>。'),

    S('cwww', 1, false, [], null, null, ['heap 空 → 沒人下車', 'note'], 0, 'while:pq 空,跳過', ['', 'none'],
      '<strong>trip (2, 1→5) · ① 下車</strong> · 紅線在 <code>from = 1</code>。堆是空的,<code>while</code> 一次都不跑。'),
    S('cwww', 1, true, [[5,2]], 5, null, ['push (5, 2)', 'note'], 2, 'passenger += 2 → 2;push (5, 2)', ['2 ≤ 5', 'ok'],
      '<strong>trip (2, 1→5) · ② 上車</strong> · <code>passenger = 2</code>,沒超過 5。把 <code>(to 5, 2 人)</code> 放進堆,<b>到 5 時他們要下車</b>。'),

    S('ocww', 3, false, [[5,2]], null, null, ['top.to 5 > from 3 → 停', 'note'], 2, 'while:5 ≤ 3 不成立,不下車', ['', 'none'],
      '<strong>trip (3, 3→7) · ① 下車</strong> · 堆頂 <code>to = 5</code>,還沒到(<code>5 &gt; 3</code>)→ 沒人下車。<b>堆頂都沒到,後面的更不可能到</b>。'),
    S('ocww', 3, true, [[5,2],[7,3]], 7, null, ['push (7, 3)', 'note'], 5, 'passenger += 3 → 5;push (7, 3)', ['5 ≤ 5 剛好滿', 'ok'],
      '<strong>trip (3, 3→7) · ② 上車</strong> · <code>passenger = 5</code>,<b>剛好等於 capacity,條件是 <code>&gt;</code> 才失敗</b> → ok。堆裡兩批:to 5、to 7。'),

    S('Locw', 5, false, [[7,3]], null, [5,2], ['top.to 5 ≤ from 5 → 下車', 'bad'], 3, 'passenger −= 2 → 3;pop (5, 2)', ['', 'none'],
      '<strong>trip (1, 5→8) · ① 下車</strong> · 堆頂 <code>to = 5</code>,<strong><code>5 ≤ 5</code> 成立 → 先下車</strong>,<code>passenger 5 → 3</code>。<b>同一點先下後上:[from, to) 不含 to,在 5 這一點他們已經不佔座位</b>。下一個堆頂 7 &gt; 5 → 停。'),
    S('xocw', 5, true, [[7,3],[8,1]], 8, null, ['push (8, 1)', 'note'], 4, 'passenger += 1 → 4;push (8, 1)', ['4 ≤ 5', 'ok'],
      '<strong>trip (1, 5→8) · ② 上車</strong> · 先騰出 2 個位子,<code>passenger = 4</code> → ok。'),

    S('xLoc', 7, false, [[8,1]], null, [7,3], ['top.to 7 ≤ from 7 → 下車', 'bad'], 1, 'passenger −= 3 → 1;pop (7, 3)', ['', 'none'],
      '<strong>trip (2, 7→9) · ① 下車</strong> · 堆頂 <code>7 ≤ 7</code> → 3 人下車,<code>passenger = 1</code>。下一個堆頂 <code>8 &gt; 7</code> → <code>while</code> 停。'),
    S('xxoc', 7, true, [[8,1],[9,2]], 9, null, ['push (9, 2)', 'note'], 3, 'passenger += 2 → 3;push (9, 2)', ['3 ≤ 5', 'ok'],
      '<strong>trip (2, 7→9) · ② 上車</strong> · <code>passenger = 3</code> → ok。四趟都處理完。'),

    S('socw', 5, true, [[5,2],[7,3]], null, null, ['top.to 5 < from 5 不成立 → 不下車', 'bad'], 6, '對照:若寫 pq.top().first < from', ['6 > 5 → false', 'bad'],
      '<strong>對照 · 若條件寫成 <code>&lt;</code></strong> · 回到 <code>from = 5</code>:<code>5 &lt; 5</code> 不成立,(5, 2) <b>沒下車</b>,再上 1 人 → <code>passenger = 6 &gt; 5</code> → <strong>錯誤回傳 false</strong>。所以一定要 <code>&lt;=</code>。'),

    S('xxoo', null, false, [[8,1],[9,2]], null, null, ['剩下的不用 pop', 'note'], 3, 'return true', ['全程 ≤ 5 → true', 'ok'],
      '<strong>完成 · true</strong> · 每次上車後檢查,乘客數最多 5,從沒超過 capacity。排序 <code>O(n log n)</code> + 每趟 push / pop 各一次 <code>O(n log n)</code>,堆 <code>O(n)</code>。'),
  ];

  let step = 0, timer = null;

  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function box(x,y,w,h,fill,stroke,lw,dash){ rr(x,y,w,h,4); ctx.fillStyle=fill; ctx.fill(); ctx.lineWidth=lw||1.4; if(dash) ctx.setLineDash(dash); ctx.strokeStyle=stroke; ctx.stroke(); ctx.setLineDash([]); }
  function txt(s,x,y,color,font,align,base){ ctx.fillStyle=color; ctx.font=font; ctx.textAlign=align||'center'; ctx.textBaseline=base||'middle'; ctx.fillText(s,x,y); }
  function head(s,x,y){ txt(s,x,y,C.dim,'600 12px '+MONO+', '+SANS,'left','alphabetic'); }
  function line(x1,y1,x2,y2,color,lw,dash){ ctx.strokeStyle=color; ctx.lineWidth=lw||1; if(dash) ctx.setLineDash(dash); ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); ctx.setLineDash([]); }
  function arrow(x1,x2,y,color){ line(x1,y,x2,y,color,2); const d = x2 > x1 ? 1 : -1; ctx.fillStyle=color; ctx.beginPath(); ctx.moveTo(x2,y); ctx.lineTo(x2-d*9,y-5); ctx.lineTo(x2-d*9,y+5); ctx.closePath(); ctx.fill(); }

  const B1 = 18, B2 = 232, B3 = 330;

  function draw(){
    fit();
    const s = STEPS[step], w = canvas.clientWidth, H = canvas.clientHeight, PAD = 22, inner = w - 2*PAD;
    ctx.fillStyle = C.paper; ctx.fillRect(0,0,w,H); ctx.setLineDash([]);

    /* ---------- BAND 1 · 數線 ---------- */
    head('BAND 1 · 每趟 [from, to)   紅 = 目前　藍 = 在車上　深紅 = 下車　灰 = 已下車', PAD, B1);
    const ax0 = PAD + 14, ax1 = w - PAD - 14, ux = (ax1 - ax0) / XMAX;
    const X = v => ax0 + v*ux;
    const laneTop = B1 + 18, lh = 24, lg = 8;
    const axY = laneTop + 4*(lh + lg) + 6;
    // 淡格線
    for (let v = 0; v <= XMAX; v++) line(X(v), laneTop - 2, X(v), axY, '#eeeeee', 1);
    // 紅豎線(在 bar 下面)
    if (s.from !== null) line(X(s.from), laneTop - 4, X(s.from), axY + 2, C.curS, 2.4);
    for (let i = 0; i < TR.length; i++) {
      const [num, f, t] = TR[i], st = s.lanes[i];
      const y = laneTop + i*(lh + lg), x = X(f), bw = X(t) - X(f);
      let fill = C.paper, sk = C.off, tc = C.off, lw = 1.2, dash = [3,3];
      if (st === 'c') { dash = null; lw = 2.4; sk = C.curS; tc = C.curT; fill = s.board ? C.cur : C.paper; }
      else if (st === 'o') { dash = null; fill = C.up; sk = C.ink; tc = C.ink; lw = 1.4; }
      else if (st === 'L' || st === 's') { dash = st === 's' ? null : [5,3]; fill = C.bad; sk = C.deep; tc = C.deep; lw = 2.2; }
      else if (st === 'x') { dash = null; fill = '#f3f3f3'; sk = C.off; tc = '#9a9a9a'; lw = 1.1; }
      box(x, y, bw, lh, fill, sk, lw, dash);
      let lab = num + ' 人';
      if (st === 'L') lab += ' · 下車';
      else if (st === 's') lab += ' · 沒下車';
      else if (st === 'c' && !s.board) lab += ' · 等上車';
      txt(lab, x + bw/2, y + lh/2 + 1, tc, '700 11.5px '+MONO+', '+SANS);
      // 右端開區間:小空心圈
      ctx.beginPath(); ctx.arc(X(t), y + lh/2, 3.2, 0, Math.PI*2); ctx.fillStyle = C.paper; ctx.fill();
      ctx.lineWidth = 1.4; ctx.strokeStyle = st === 'w' ? C.off : sk; ctx.stroke();
    }
    // 軸
    line(ax0, axY, ax1, axY, C.ink, 1.4);
    for (let v = 0; v <= XMAX; v++) {
      line(X(v), axY - 4, X(v), axY + 4, C.ink, 1.2);
      const hit = s.from === v;
      txt(String(v), X(v), axY + 16, hit ? C.curT : C.dim, (hit ? '800 13px ' : '600 11.5px ') + MONO);
    }
    if (s.from !== null) {
      const lx = X(s.from);
      txt('▲ from = ' + s.from, lx, axY + 34, C.curT, '700 11.5px '+MONO, lx > w - 90 ? 'right' : 'center');
    }

    /* ---------- BAND 2 · 最小堆 ---------- */
    head('BAND 2 · 最小堆 pq(依 to 排,左 = top)', PAD, B2);
    const cellTop = B2 + 16, ch = 36, cg = 10;
    const leftW = Math.round(inner * 0.56);
    const cw = Math.min(118, (leftW - 2*cg) / 3);
    const capY = cellTop + ch + 16;
    for (let j = 0; j < 3; j++) {
      const x = PAD + j*(cw + cg);
      if (j >= s.heap.length) { box(x, cellTop, cw, ch, C.paper, C.off, 1.1, [3,3]); continue; }
      const [to, num] = s.heap[j];
      const isNew = s.nw === to, stay = s.lanes === 'socw' && j === 0;
      let fill = C.low, sk = C.ink, tc = C.ink, lw = j === 0 ? 2.2 : 1.4;
      if (stay) { fill = C.bad; sk = C.deep; tc = C.deep; lw = 2.4; }
      else if (isNew) { fill = C.cur; sk = C.curS; tc = C.curT; lw = 2.4; }
      box(x, cellTop, cw, ch, fill, sk, lw);
      txt('to ' + to + ' · ' + num + ' 人', x + cw/2, cellTop + ch/2 + 1, tc, '700 13px '+MONO+', '+SANS);
      if (j === 0) txt('▲ top', x + cw/2, capY, stay ? C.deep : C.ink, '700 11px '+MONO, 'center', 'middle');
    }
    // 比較文字
    const ck = s.cmp[1];
    const heapEnd = PAD + 3*cw + 2*cg;
    const cmpX = PAD + cw + 14;
    txt(s.cmp[0], s.heap.length ? cmpX : PAD, capY, ck === 'bad' ? C.deep : (ck === 'none' ? C.dim : C.ink), '700 11.5px '+MONO+', '+SANS, 'left', 'middle');
    // 分隔線 + 下車區
    const dx = heapEnd + 16;
    line(dx, cellTop - 4, dx, cellTop + ch + 4, C.off, 1.2, [3,3]);
    const lzx = dx + 44, lzw = w - PAD - lzx;
    txt('這一步下車', w - PAD, B2, C.dim, '600 12px '+MONO+', '+SANS, 'right', 'alphabetic');
    if (s.leave) {
      arrow(dx + 6, lzx - 6, cellTop + ch/2, C.deep);
      box(lzx, cellTop, lzw, ch, C.bad, C.deep, 2.2, [5,3]);
      txt('to ' + s.leave[0] + ' · ' + s.leave[1] + ' 人  pop', lzx + lzw/2, cellTop + ch/2 + 1, C.deep, '700 13px '+MONO+', '+SANS);
      txt('passenger −' + s.leave[1], lzx + lzw/2, capY, C.deep, '700 11px '+MONO, 'center', 'middle');
    } else {
      box(lzx, cellTop, lzw, ch, C.paper, C.off, 1.1, [3,3]);
      txt('—', lzx + lzw/2, cellTop + ch/2 + 1, C.off, '700 13px '+MONO);
    }

    /* ---------- BAND 3 · 乘客 vs capacity ---------- */
    head('BAND 3 · passenger vs capacity ' + CAP, PAD, B3);
    const gy = B3 + 16, gh = 30;
    const gx0 = PAD, gw = Math.round(inner * 0.60), uw = gw / GMAX;
    const over = s.p > CAP;
    for (let u = 0; u < GMAX; u++) {
      const x = gx0 + u*uw;
      const filled = u < s.p;
      let fill = C.paper, sk = C.off, dash = [3,3], lw = 1.1;
      if (filled) { dash = null; lw = 1.4; sk = C.ink; fill = over ? C.bad : C.good; if (u >= CAP) { sk = C.deep; lw = 2.2; } }
      box(x + 2, gy, uw - 4, gh, fill, sk, lw, dash);
      txt(String(u + 1), x + uw/2, gy + gh/2 + 1, filled ? (over ? C.deep : C.ink) : C.off, '700 12px '+MONO);
    }
    // cap 標記(畫在格與格之間)
    const cx = gx0 + CAP*uw;
    line(cx, gy - 6, cx, gy + gh + 6, C.curS, 2.6);
    txt('cap ' + CAP, cx, gy + gh + 18, C.curT, '700 11px '+MONO, 'center', 'middle');
    // 右邊:數字 + 檢查
    const rx = gx0 + gw + 14, rw = w - PAD - rx;
    const kind = s.chk[1];
    if (kind === 'none' || !s.chk[0]) box(rx, gy, rw, gh, C.paper, C.off, 1.2, [3,3]);
    else box(rx, gy, rw, gh, kind === 'bad' ? C.bad : C.good, kind === 'bad' ? C.deep : C.ink, kind === 'bad' ? 2.2 : 1.4);
    const pt = 'p = ' + s.p + (kind !== 'none' && s.chk[0] ? '   ' + (kind === 'bad' ? '× ' : '● ') + s.chk[0] : '');
    txt(pt, rx + 10, gy + gh/2 + 1, kind === 'bad' ? C.deep : C.ink, '700 12px '+MONO+', '+SANS, 'left', 'middle');
    // 這一步
    const ay = gy + gh + 32, ah = 30;
    box(PAD, ay, inner, ah, s.lanes === 'socw' ? C.bad : C.paper, s.lanes === 'socw' ? C.deep : C.ink, 1.4);
    txt('這一步 · ' + s.act, PAD + 12, ay + ah/2 + 1, s.lanes === 'socw' ? C.deep : C.ink, '700 12px '+MONO+', '+SANS, 'left', 'middle');
  }

  function update(){ if(stepEl) stepEl.textContent=String(step).padStart(2,'0')+' / '+String(STEPS.length-1).padStart(2,'0'); if(labelEl) labelEl.innerHTML=STEPS[step].text; draw(); }
  function next(){ if(step<STEPS.length-1){step++;update();}else stop(); }
  function prev(){ if(step>0){step--;update();} }
  function reset(){ stop(); step=0; update(); }
  function play(){ if(timer){stop();return;} bPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=STEPS.length-1){stop();return;} next(); },2200); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} if(bPlay) bPlay.textContent='Play'; }
  bPrev&&bPrev.addEventListener('click',prev); bNext&&bNext.addEventListener('click',next); bPlay&&bPlay.addEventListener('click',play); bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();}); if(window.ResizeObserver){ new ResizeObserver(()=>{fit();draw();}).observe(canvas); }
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw); fit(); update();
})();
