/* ============================================================
   P355 · Design Twitter — getNewsFeed · 大小 10 的最小堆(依時間) · viz
     postTweet(u, id)   : tweets[u].push_back({++ts, id});
     follow / unfollow  : followG[a].insert / erase(b)(a == b 時忽略)
     getNewsFeed(u)     : cmp(p1, p2) = p1.first > p2.first → 最小堆,top = 最舊
       for (auto& p : tweets[u]) { pq.push(p); if (pq.size() > 10) pq.pop(); }
       for (int f : followG[u]) for (auto& p : tweets[f]) { 同上 }
       while (!pq.empty()) { ans.push_back(pq.top().second); pq.pop(); }   // 舊 → 新
       reverse(ans.begin(), ans.end());                                   // 新 → 舊
   動畫要傳達的一件事:三條各自有序的時間軸被倒進同一個「只留 10 格」的最小堆,
   超過 10 格就踢掉最舊的 —— 堆裡永遠是「目前看過的最新 10 則」;
   最後倒出來是舊→新,所以要 reverse。
   例 follow(1,2), follow(1,3);
      u2:t1 #21, u1:t2 #11, u3:t3 #31, u2:t4 #22, u1:t5 #12, u3:t6 #32,
      u2:t7 #23, u1:t8 #13, u3:t9 #33, u2:t10 #24, u1:t11 #14, u3:t12 #34
   以下取自 libstdc++(g++ -std=c++17)實測,priority_queue 子類別印出 protected c:
     followG[1] 走訪順序:3, 2
     push u1 : t2 t5 t8 t11                  c = [2,5,8,11]
     push u3 : t3 t6 t9 t12                  c = [2,3,6,11,5,8,9,12]
     push u2 : t1  → size 9                  c = [1,2,6,3,5,8,9,12,11]
               t4  → size 10                 c = [1,2,6,3,4,8,9,12,11,5]
               t7  → size 11                 c = [1,2,6,3,4,8,9,12,11,5,7]
       pop t1 #21                            c = [2,3,6,7,4,8,9,12,11,5]
               t10 → size 11                 c = [2,3,6,7,4,8,9,12,11,5,10]
       pop t2 #11                            c = [3,4,6,7,5,8,9,12,11,10]
     drain → [31,22,12,32,23,13,33,24,14,34]
     reverse → [34,14,24,33,13,23,32,12,22,31]
     BAND 1  三條時間軸(依 t 對齊),藍底 = 已 push、紅框 = 這一批、灰斜線 = 被踢掉、深紅 = 剛踢掉
     BAND 2  堆內容(依時間排序顯示,左 = top = 最舊)+ 底層 vector + 動作 chip
     BAND 3  ans:drain 後(舊→新)與 reverse 後(新→舊)
   前綴 v355- 。
   ============================================================ */
(function () {
  const canvas = document.getElementById('v355-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('v355-step'), labelEl = document.getElementById('v355-label');
  const bPrev = document.getElementById('v355-prev'), bNext = document.getElementById('v355-next'),
        bPlay = document.getElementById('v355-play'), bReset = document.getElementById('v355-reset');

  const C = { paper:'#ffffff', ink:'#1f1f1f', dim:'#5a5a5a', off:'#cfcfcf',
    up:'#e3edf5', low:'#f6ead8',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424',
    good:'#d9e8c7', bad:'#f0d4d4', deep:'#a31d1d' };

  const MONO = '"JetBrains Mono", monospace', SANS = '"Noto Sans TC", sans-serif';

  const K = 10, T = 12;
  /* tweet 以時間 t(1..12)當 key:owner / id */
  const OWN = [0, 2,1,3, 2,1,3, 2,1,3, 2,1,3];
  const TID = [0, 21,11,31, 22,12,32, 23,13,33, 24,14,34];
  const ROWS = [1, 3, 2];                          // 走訪順序:自己 → followG[1] 實測 3, 2
  const ROWTAG = { 1:'自己 · 第 1 批', 3:'followee · 第 2 批', 2:'followee · 第 3 批' };
  const DRAIN = [3,4,5,6,7,8,9,10,11,12];          // drain 出來的時間順序(舊→新)

  /* pushed: 已 push 的 t;blk: 這一步 push 的 t;gone: 已被 pop 的 t;pop: 剛 pop 的 t;
     arr: 底層 vector(存 t);phase;ansA / ansB: 是否顯示 */
  const S = (pushed, blk, gone, pop, arr, phase, text) => ({ pushed, blk, gone, pop, arr, phase, text });
  const U1 = [2,5,8,11], U3 = [3,6,9,12];

  const steps = [
    S([], [], [], null, [], 'intro',
      '<strong>INITIAL</strong> · <code>follow(1,2)</code>、<code>follow(1,3)</code>,三人交錯發了 12 則,<code>ts</code> 從 1 遞增到 12。每個人的 <code>tweets[u]</code> <b>各自按時間排好</b>(上面三條時間軸)。<code>getNewsFeed(1)</code> 要從這三條裡挑出<strong>最新的 10 則</strong>。'),

    S(U1, U1, [], null, [2,5,8,11], 'push',
      '<strong>push 自己的 4 則</strong> · 先走 <code>tweets[1]</code>:<code>t=2,5,8,11</code>。最小堆的 <code>top</code> 是<b>時間最小 = 最舊</b>的 <code>t=2 #11</code>。<code>size = 4 ≤ 10</code>,不用 pop。'),
    S(U1.concat(U3), U3, [], null, [2,3,6,11,5,8,9,12], 'push',
      '<strong>push 用戶 3 的 4 則</strong> · <code>followG[1]</code> 是 <code>unordered_set</code>,實測走訪順序是 <b>3 先、2 後</b>。<code>t=3,6,9,12</code> 進堆,跟用戶 1 的交錯在一起。<code>size = 8</code>。'),
    S(U1.concat(U3, [1,4]), [1,4], [], null, [1,2,6,3,4,8,9,12,11,5], 'push',
      '<strong>push 用戶 2 的 t=1、t=4</strong> · <code>t=1 #21</code> 是全部裡最舊的,上浮成新的 <code>top</code>。<code>size = 10</code>,<b>剛好滿</b>,還沒超過。'),
    S(U1.concat(U3, [1,4,7]), [7], [], null, [1,2,6,3,4,8,9,12,11,5,7], 'push',
      '<strong>push t=7 #23</strong> · 第 11 則進來。<strong><code>size = 11 &gt; 10</code></strong> → 要 pop 一個。pop 的一定是 <code>top</code> = 堆裡<b>最舊</b>的那則。'),
    S(U1.concat(U3, [1,4,7]), [], [1], 1, [2,3,6,7,4,8,9,12,11,5], 'pop',
      '<strong>pop t=1 #21</strong> · 最舊的被踢掉 —— 它比堆裡其他 10 則都舊,<b>不可能出現在最新 10 則</b>。堆回到 10 則,新 <code>top</code> = <code>t=2 #11</code>。'),
    S(U1.concat(U3, [1,4,7,10]), [10], [1], null, [2,3,6,7,4,8,9,12,11,5,10], 'push',
      '<strong>push t=10 #24</strong> · 用戶 2 的最後一則。<strong><code>size = 11 &gt; 10</code></strong>,再 pop 一次。'),
    S(U1.concat(U3, [1,4,7,10]), [], [1,2], 2, [3,4,6,7,5,8,9,12,11,10], 'pop',
      '<strong>pop t=2 #11</strong> · 這次被踢的是<b>用戶 1 自己</b>最早那則 —— 堆只看時間,不管是誰發的。12 則全走完,堆裡剩 <code>t=3..12</code>:<strong>正好是最新的 10 則</strong>。'),

    S(U1.concat(U3, [1,4,7,10]), [], [1,2], null, [], 'drain',
      '<strong>drain</strong> · <code>while (!pq.empty())</code> 逐一取 <code>top().second</code> 再 pop。最小堆每次給<b>最舊</b>的,所以 <code>ans</code> 是<strong>舊 → 新</strong>:<code>[31,22,12,32,23,13,33,24,14,34]</code>。'),
    S(U1.concat(U3, [1,4,7,10]), [], [1,2], null, [], 'reverse',
      '<strong>reverse</strong> · 題目要<b>最新的在前面</b>,把 <code>ans</code> 整個翻過來:第 0 格 ⇄ 第 9 格、第 1 格 ⇄ 第 8 格…… 變成<strong>新 → 舊</strong>。'),
    S(U1.concat(U3, [1,4,7,10]), [], [1,2], null, [], 'done',
      '<strong>完成</strong> · <code>getNewsFeed(1) = [34,14,24,33,13,23,32,12,22,31]</code>。堆最多 11 則,每次 push / pop <code>O(log 10)</code>:時間 <code>O(N)</code>(N = 自己 + followee 的 tweet 總數),額外空間 <code>O(10)</code>。'),
  ];

  let step = 0, timer = null;

  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||562; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function box(x,y,w,h,fill,stroke,lw,dash){ rr(x,y,w,h,5); ctx.fillStyle=fill; ctx.fill(); ctx.lineWidth=lw||1.4; if(dash) ctx.setLineDash(dash); ctx.strokeStyle=stroke; ctx.stroke(); ctx.setLineDash([]); }
  function txt(s,x,y,color,font,align,base){ ctx.fillStyle=color; ctx.font=font; ctx.textAlign=align||'center'; ctx.textBaseline=base||'middle'; ctx.fillText(s,x,y); }
  function head(s,x,y,color,align){ txt(s,x,y,color||C.dim,'600 12px '+MONO+', '+SANS,align||'left','alphabetic'); }
  function slash(x,y,w,h,color,lw){ ctx.strokeStyle=color; ctx.lineWidth=lw; ctx.beginPath(); ctx.moveTo(x+6,y+h-5); ctx.lineTo(x+w-6,y+5); ctx.stroke(); }
  function line(x1,y1,x2,y2,color,lw,dash){ ctx.strokeStyle=color; ctx.lineWidth=lw; if(dash) ctx.setLineDash(dash); ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); ctx.setLineDash([]); }
  /* 兩行 tweet 格子:上 #id(粗),下 小字 */
  function tcell(x,y,w,h,top,bot,fill,st,tc,lw,dash){
    box(x,y,w,h,fill,st,lw,dash);
    txt(top, x+w/2, y+h/2-7, tc, '700 12.5px '+MONO);
    txt(bot, x+w/2, y+h/2+9, tc === C.ink ? C.dim : tc, '600 10px '+MONO);
  }

  const B1 = 18, B2 = 240, B3 = 400;   // band 標題基線

  function draw(){
    fit();
    const s = steps[step], w = canvas.clientWidth, H = canvas.clientHeight, PAD = 24;
    const ph = s.phase, isPop = ph === 'pop', late = ph === 'drain' || ph === 'reverse' || ph === 'done';
    ctx.fillStyle = C.paper; ctx.fillRect(0,0,w,H); ctx.setLineDash([]);
    const innerW = w - 2*PAD;
    const pushed = new Set(s.pushed), blk = new Set(s.blk), gone = new Set(s.gone);
    const inHeap = new Set(s.arr);

    function stateOf(t){
      if (t === s.pop) return 'popped';
      if (gone.has(t)) return 'out';
      if (blk.has(t)) return 'cur';
      if (late && pushed.has(t)) return 'ans';
      if (pushed.has(t)) return 'heap';
      return 'pending';
    }
    function look(st){
      if (st === 'cur')    return { f:C.cur,  s:C.curS, t:C.curT, lw:2.4, d:null };
      if (st === 'popped') return { f:C.bad,  s:C.deep, t:C.deep, lw:2.4, d:null };
      if (st === 'out')    return { f:C.off,  s:C.dim,  t:C.dim,  lw:1.2, d:null };
      if (st === 'ans')    return { f:C.good, s:C.ink,  t:C.ink,  lw:1.4, d:null };
      if (st === 'heap')   return { f:C.up,   s:C.ink,  t:C.ink,  lw:1.4, d:null };
      return { f:C.paper, s:C.off, t:C.off, lw:1.2, d:[3,3] };
    }

    /* ---------- BAND 1 · 三條時間軸 ---------- */
    head('BAND 1 · tweets[u] 三條時間軸(依 ts 對齊)', PAD, B1);
    txt('藍底 = 已 push　紅 = 這一批　灰 = 被踢　深紅 = 剛踢', PAD, B1 + 22, C.dim, '600 11px '+MONO+', '+SANS, 'left', 'middle');
    // follow chip
    const fcT = 'follow: 1→2, 1→3';
    ctx.font = '700 11.5px ' + MONO; const fcW = ctx.measureText(fcT).width + 20;
    box(w - PAD - fcW, B1 + 11, fcW, 22, C.low, C.ink, 1.2);
    txt(fcT, w - PAD - fcW/2, B1 + 22.5, C.ink, '700 11.5px ' + MONO);

    const LW = 104, gx0 = PAD + LW, cw = (innerW - LW) / T, cellW = Math.min(cw - 6, 58), rowH = 36, rowGap = 12;
    const tickY = B1 + 50;
    for (let t = 1; t <= T; t++) txt('t=' + t, gx0 + (t - 0.5)*cw, tickY, C.dim, '600 10.5px '+MONO, 'center', 'alphabetic');
    txt('ts', PAD, tickY, C.dim, '600 10.5px '+MONO, 'left', 'alphabetic');
    const row0 = tickY + 12;
    ROWS.forEach((u, r) => {
      const y = row0 + r*(rowH + rowGap), cy = y + rowH/2;
      const active = s.blk.length && OWN[s.blk[0]] === u;
      txt('user ' + u, PAD, cy - 7, active ? C.curT : C.ink, '700 13px '+MONO, 'left', 'middle');
      txt(ROWTAG[u], PAD, cy + 10, active ? C.curT : C.dim, '600 10.5px '+SANS, 'left', 'middle');
      line(gx0, cy, w - PAD, cy, C.off, 1.2, [2,4]);
      for (let t = 1; t <= T; t++) {
        if (OWN[t] !== u) continue;
        const x = gx0 + (t - 0.5)*cw - cellW/2, st = stateOf(t), L = look(st);
        tcell(x, y, cellW, rowH, '#' + TID[t], 't=' + t, L.f, L.s, L.t, L.lw, L.d);
        if (st === 'out') slash(x, y, cellW, rowH, C.dim, 1.4);
        if (st === 'popped') slash(x, y, cellW, rowH, C.deep, 2);
      }
    });

    /* ---------- BAND 2 · 最小堆 ---------- */
    head('BAND 2 · 最小堆 pq · 堆內容(依時間排序顯示)', PAD, B2);
    const sz = s.arr.length;
    let heapShow = s.arr.slice().sort((a,b) => a - b);
    if (isPop) heapShow = [s.pop].concat(heapShow);                 // 剛 pop 的畫在最左(它原本就是最舊的)
    const showN = heapShow.length;
    txt('size = ' + (isPop ? '11 → 10' : sz) + ' · 上限 k = ' + K, w - PAD, B2, (sz > K) ? C.curT : C.ink, '700 12px '+MONO, 'right', 'alphabetic');
    const sg = 8, capGap = 22;
    const chipW = Math.min(58, (innerW - 10*sg - capGap) / 11), chipH = 40, cy0 = B2 + 14;
    const chipX = i => PAD + i*(chipW + sg) + (i >= K ? capGap - sg + sg : 0);
    // 容量線(第 10 格之後)
    const capX = PAD + K*(chipW + sg) - sg + capGap/2;
    line(capX, cy0 - 4, capX, cy0 + chipH + 4, (sz > K || isPop) ? C.curS : C.dim, 1.6, [4,3]);
    for (let i = 0; i < 11; i++) {
      const x = chipX(i), t = heapShow[i];
      if (t === undefined) { box(x, cy0, chipW, chipH, C.paper, C.off, 1.2, [3,3]); if (i === 10) txt('第11', x + chipW/2, cy0 + chipH/2 + 1, C.off, '600 10.5px '+SANS); continue; }
      let L;
      if (isPop && i === 0) L = look('popped');
      else if (blk.has(t)) L = look('cur');
      else if (i === 0 && !isPop || (isPop && i === 1)) L = { f:C.low, s:C.ink, t:C.ink, lw:2.2, d:null };
      else L = look('heap');
      tcell(x, cy0, chipW, chipH, '#' + TID[t], 't' + t + '·u' + OWN[t], L.f, L.s, L.t, L.lw, L.d);
      if (isPop && i === 0) slash(x, cy0, chipW, chipH, C.deep, 2);
    }
    // 下方標籤
    const tagY = cy0 + chipH + 14;
    if (showN) {
      const topIdx = isPop ? 1 : 0;
      if (isPop) txt('↑ pop', chipX(0) + chipW/2, tagY, C.deep, '700 11px '+MONO+', '+SANS);
      txt('↑ top = 最舊', chipX(topIdx), tagY, C.ink, '700 11px '+MONO+', '+SANS, 'left', 'middle');
      const lastI = showN - 1;
      txt('最新 ↑', chipX(lastI) + chipW, tagY, C.dim, '600 11px '+MONO+', '+SANS, 'right', 'middle');
    } else {
      txt(late ? '堆已倒空 → 全進 ans' : '空堆', PAD, tagY, C.dim, '600 11px '+MONO+', '+SANS, 'left', 'middle');
    }
    // 底層 vector
    const arrY = tagY + 20;
    const arrT = s.arr.length ? '底層 vector c(存 t):[' + s.arr.join(', ') + ']' : '底層 vector c:[]';
    txt(arrT, PAD, arrY, C.dim, '600 11px '+MONO+', '+SANS, 'left', 'middle');
    // 動作 chip
    const ay = arrY + 14, ah = 30;
    let aTxt, aF = C.paper, aS = C.ink, aT = C.ink, aLw = 1.4, aD = null;
    if (ph === 'intro') { aTxt = '規則:依序 push;size > 10 就 pop top(最舊的)'; aS = C.off; aT = C.dim; aD = [3,3]; aLw = 1.2; }
    else if (ph === 'push' && sz > K) { aTxt = 'push t=' + s.blk[0] + ' #' + TID[s.blk[0]] + ' · size 11 > 10 → pop 最舊'; aF = C.cur; aS = C.curS; aT = C.curT; aLw = 2; }
    else if (ph === 'push') { aTxt = 'push ' + s.blk.map(t => 't' + t).join(', ') + ' · size ' + sz + (sz === K ? ' = 10,剛好滿' : ' ≤ 10,不用 pop'); }
    else if (isPop) { aTxt = 'pop top = t=' + s.pop + ' #' + TID[s.pop] + '(最舊)· size 回到 10'; aF = C.bad; aS = C.deep; aT = C.deep; aLw = 2; }
    else if (ph === 'drain') { aTxt = 'drain:top 一個個進 ans → 舊 → 新'; aF = C.good; aLw = 2; }
    else if (ph === 'reverse') { aTxt = 'reverse(ans) → 新 → 舊'; aF = C.good; aLw = 2; }
    else { aTxt = '完成:getNewsFeed(1) = [34,14,24,33,13,23,32,12,22,31]'; aF = C.good; aLw = 2; }
    box(PAD, ay, innerW, ah, aF, aS, aLw, aD);
    txt(aTxt, PAD + innerW/2, ay + ah/2 + 1, aT, '700 12px '+MONO+', '+SANS);

    /* ---------- BAND 3 · ans ---------- */
    head('BAND 3 · ans', PAD, B3);
    const AL = 104, ax0 = PAD + AL, ag = 8, aw = Math.min(58, (innerW - AL - 9*ag) / 10), ahh = 36;
    const r1 = B3 + 14, r2 = r1 + ahh + 40;
    const showA = late, showB = ph === 'reverse' || ph === 'done';
    const labA = ph === 'drain' ? C.ink : (showA ? C.dim : C.off), labB = showB ? C.ink : C.off;
    txt('drain 後', PAD, r1 + ahh/2 - 7, labA, '700 12px '+MONO+', '+SANS, 'left', 'middle');
    txt('舊 → 新', PAD, r1 + ahh/2 + 10, labA, '600 10.5px '+SANS, 'left', 'middle');
    txt('reverse 後', PAD, r2 + ahh/2 - 7, labB, '700 12px '+MONO+', '+SANS, 'left', 'middle');
    txt('新 → 舊', PAD, r2 + ahh/2 + 10, labB, '600 10.5px '+SANS, 'left', 'middle');
    const ansX = i => ax0 + i*(aw + ag);
    if (ph === 'reverse') {
      for (let i = 0; i < 10; i++) {
        const j = 9 - i;
        line(ansX(i) + aw/2, r1 + ahh + 3, ansX(j) + aw/2, r2 - 3, (i === 0 || i === 9) ? C.curS : C.off, (i === 0 || i === 9) ? 1.6 : 1.1);
      }
    }
    for (let i = 0; i < 10; i++) {
      const x = ansX(i);
      if (showA) {
        const t = DRAIN[i], dimA = ph !== 'drain';
        tcell(x, r1, aw, ahh, '#' + TID[t], 't=' + t, dimA ? C.up : C.good, C.ink, C.ink, dimA ? 1.2 : 1.6);
      } else { box(x, r1, aw, ahh, C.paper, C.off, 1.2, [3,3]); txt(String(i), x + aw/2, r1 + ahh/2 + 1, C.off, '600 11px '+MONO); }
      if (showB) {
        const t = DRAIN[9 - i], fin = ph === 'done';
        tcell(x, r2, aw, ahh, '#' + TID[t], 't=' + t, C.good, C.ink, C.ink, fin ? 2.4 : 1.6);
      } else { box(x, r2, aw, ahh, C.paper, C.off, 1.2, [3,3]); txt(String(i), x + aw/2, r2 + ahh/2 + 1, C.off, '600 11px '+MONO); }
    }
    if (ph === 'done') {
      const endX = ansX(9) + aw;
      txt('← 回傳這一列(最新在前)', Math.min(endX, w - PAD), r2 + ahh + 16, C.ink, '700 11px '+SANS, 'right', 'middle');
    }
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
