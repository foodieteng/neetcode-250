/* ============================================================
   P973 · K Closest Points to Origin — 大小為 k 的最大堆 · viz
     cmp(p1, p2) = d(p1) < d(p2),d = x² + y²(不開根號)→ 最大堆,堆頂 = 最遠
     for p in points: pq.push(p); if (pq.size() > k) pq.pop();   // 踢掉最遠的
     while (!pq.empty()) { ans.push_back(pq.top()); pq.pop(); }  // 最遠的先出
   動畫要傳達的一件事:堆裡永遠留「目前最近的 k 個」,堆頂 = 其中最遠的,
   以原點為圓心、半徑 √(top.d) 的圓就是「錄取邊界」—— 圈外的新點一進來就被踢,
   圈內的新點會把堆頂擠出去,圓跟著縮小。
   例 points = [[1,3],[-2,2],[3,-2],[0,1],[-3,-3],[2,0]], k = 3
      d = 10, 8, 13, 1, 18, 4 → 答案 {[0,1],[2,0],[-2,2]}
     底層陣列取自 libstdc++ 實測(priority_queue 子類別印出 protected c):
       push [1,3]   : [[1,3]10]
       push [-2,2]  : [[1,3]10, [-2,2]8]
       push [3,-2]  : [[3,-2]13, [-2,2]8, [1,3]10]
       push [0,1]   : [[3,-2]13, [-2,2]8, [1,3]10, [0,1]1]
       pop  [3,-2]  : [[1,3]10, [-2,2]8, [0,1]1]
       push [-3,-3] : [[-3,-3]18, [1,3]10, [0,1]1, [-2,2]8]
       pop  [-3,-3] : [[1,3]10, [-2,2]8, [0,1]1]
       push [2,0]   : [[1,3]10, [-2,2]8, [0,1]1, [2,0]4]
       pop  [1,3]   : [[-2,2]8, [2,0]4, [0,1]1]
       drain [-2,2] : [[2,0]4, [0,1]1]
       drain [2,0]  : [[0,1]1]
       drain [0,1]  : []
       ans = [[-2,2],[2,0],[0,1]]
     BAND 1  左:座標平面 + 錄取邊界圓;右:最大堆(樹 ⇄ 底層陣列)
     BAND 2  點的資料流(紅 = 目前、藍底 = 在堆裡、灰 = 踢掉、深紅 = 剛踢掉、綠 = 進 ans)
     BAND 3  動作 chip + ans 逐步填入
   前綴 v973- 。
   ============================================================ */
(function () {
  const canvas = document.getElementById('v973-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('v973-step'), labelEl = document.getElementById('v973-label');
  const bPrev = document.getElementById('v973-prev'), bNext = document.getElementById('v973-next'),
        bPlay = document.getElementById('v973-play'), bReset = document.getElementById('v973-reset');

  const C = { paper:'#ffffff', ink:'#1f1f1f', dim:'#5a5a5a', off:'#cfcfcf',
    up:'#e3edf5', low:'#f6ead8',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424',
    good:'#d9e8c7', bad:'#f0d4d4', deep:'#a31d1d' };

  const MONO = '"JetBrains Mono", monospace', SANS = '"Noto Sans TC", sans-serif';

  const K = 3;
  const P = [[1,3],[-2,2],[3,-2],[0,1],[-3,-3],[2,0]];
  const D = P.map(p => p[0]*p[0] + p[1]*p[1]);           // 10, 8, 13, 1, 18, 4
  const NM = P.map(p => '[' + p[0] + ',' + p[1] + ']');
  /* 平面上的標籤位置(相對點的 px 偏移, 對齊) */
  const LBL = [[10,-9,'left'],[0,-13,'center'],[0,18,'center'],[-10,-9,'right'],[10,-10,'left'],[0,-13,'center']];

  /* heap: 底層陣列(存點 id);cur: 剛 push;pop: 剛被踢掉(k+1 → 最遠);take: drain 剛取出;
     seen: 讀到第幾個;ans: 已進 ans 的 id(依序) */
  const S = (heap, cur, pop, take, seen, ans, phase, text) => ({ heap, cur, pop, take, seen, ans, phase, text });

  const steps = [
    S([], null, null, null, 0, [], 'intro',
      '<strong>INITIAL</strong> · <code>points = [[1,3],[-2,2],[3,-2],[0,1],[-3,-3],[2,0]]</code>,<code>k = 3</code>。比較用 <code>d = x²+y²</code>(不用開根號,大小順序一樣)。想法:<b>用最大堆只留「目前最近的 3 個」</b>,堆頂 = 入選者裡<strong>最遠的</strong>,多出第 4 個時直接 pop 掉最遠的。'),

    S([0], 0, null, null, 1, [], 'push',
      '<strong>push [1,3] · d = 10</strong> · 堆是空的,直接放 <code>index 0</code>,它就是堆頂。<code>size = 1 ≤ k</code>,不用 pop。'),
    S([0,1], 1, null, null, 2, [], 'push',
      '<strong>push [-2,2] · d = 8</strong> · 放在 <code>index 1</code>。<code>8 &lt; 10</code>,最大堆裡不用上浮:<code>[[1,3],[-2,2]]</code>。<code>size = 2 ≤ k</code>。'),
    S([2,1,0], 2, null, null, 3, [], 'push',
      '<strong>push [3,-2] · d = 13</strong> · 放在 <code>index 2</code>,<code>13 &gt; 10</code> → 上浮到堆頂。<code>size = 3 = k</code>,堆剛好滿了。<b>虛線圓出現了</b>:半徑 <code>√13</code> = 目前入選者裡最遠的距離,這就是「錄取邊界」。'),
    S([2,1,0,3], 3, null, null, 4, [], 'push',
      '<strong>push [0,1] · d = 1</strong> · 放在 <code>index 3</code>,<code>1 &lt; 8</code>,不用上浮:<code>[[3,-2],[-2,2],[1,3],[0,1]]</code>。它在圓<b>裡面</b>,比堆頂近。<strong><code>size = 4 &gt; k = 3</code></strong>,要 pop。'),
    S([0,1,3], null, 2, null, 4, [], 'pop',
      '<strong>pop [3,-2] · d = 13</strong> · 最大堆 pop 的是<strong>堆頂 = 4 個裡最遠的</strong> —— 它不可能是最近的 3 個之一,踢掉。最後一個 <code>[0,1]</code> 補到根再下沉:<code>[[1,3],[-2,2],[0,1]]</code>。<b>圓縮成 √10。</b>'),

    S([4,0,3,1], 4, null, null, 5, [], 'push',
      '<strong>push [-3,-3] · d = 18</strong> · 放在 <code>index 3</code>,<code>18 &gt; 8</code> 上浮、<code>18 &gt; 10</code> 再上浮到堆頂:<code>[[-3,-3],[1,3],[0,1],[-2,2]]</code>。它在<b>圓外</b>(比 √10 遠)。<strong><code>size = 4 &gt; k</code></strong>。'),
    S([0,1,3], null, 4, null, 5, [], 'pop',
      '<strong>pop [-3,-3] · d = 18</strong> · 剛進來就是最遠的 → <b>自己被踢掉</b>。堆回到 <code>[[1,3],[-2,2],[0,1]]</code>,圓還是 <code>√10</code>:<b>圓外的新點永遠進不來</b>。'),

    S([0,1,3,5], 5, null, null, 6, [], 'push',
      '<strong>push [2,0] · d = 4</strong> · 放在 <code>index 3</code>,<code>4 &lt; 8</code>,不用上浮:<code>[[1,3],[-2,2],[0,1],[2,0]]</code>。它在<b>圓內</b>。<strong><code>size = 4 &gt; k</code></strong>。'),
    S([1,5,3], null, 0, null, 6, [], 'pop',
      '<strong>pop [1,3] · d = 10</strong> · 這次被擠出去的是<strong>舊的堆頂</strong> —— 新點 <code>[2,0]</code> 擠進了前 3 近。<code>[2,0]</code> 補到根、下沉,<code>[-2,2]</code> 升上堆頂:<code>[[-2,2],[2,0],[0,1]]</code>。<b>圓縮成 √8。</b>'),

    S([5,3], null, null, 1, 6, [1], 'drain',
      '<strong>drain · ans.push(top) = [-2,2]</strong> · 所有點都讀完了,堆裡就是最近的 3 個。逐一取堆頂放進 <code>ans</code> 再 pop —— <b>最遠的先出來</b>:<code>[-2,2]</code>(d = 8)。堆剩 <code>[[2,0],[0,1]]</code>。'),
    S([3], null, null, 5, 6, [1,5], 'drain',
      '<strong>drain · ans.push(top) = [2,0]</strong> · 新堆頂 <code>[2,0]</code>(d = 4)放進 <code>ans</code>,堆剩 <code>[[0,1]]</code>。'),
    S([], null, null, 3, 6, [1,5,3], 'drain',
      '<strong>drain · ans.push(top) = [0,1]</strong> · 最後一個 <code>[0,1]</code>(d = 1)放進 <code>ans</code>,堆空了。'),

    S([], null, null, null, 6, [1,5,3], 'done',
      '<strong>完成</strong> · <code>ans = [[-2,2],[2,0],[0,1]]</code> —— 都在半徑 <code>√8</code> 的圓內。題目說<b>任意順序皆可</b>,所以最遠→最近也沒關係。堆大小最多 <code>k+1</code>,每次 push / pop <code>O(log k)</code>:時間 <code>O(n log k)</code>,空間 <code>O(k)</code>。'),
  ];

  let step = 0, timer = null;

  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||484; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function box(x,y,w,h,fill,stroke,lw,dash){ rr(x,y,w,h,5); ctx.fillStyle=fill; ctx.fill(); ctx.lineWidth=lw||1.4; if(dash) ctx.setLineDash(dash); ctx.strokeStyle=stroke; ctx.stroke(); ctx.setLineDash([]); }
  function txt(s,x,y,color,font,align,base){ ctx.fillStyle=color; ctx.font=font; ctx.textAlign=align||'center'; ctx.textBaseline=base||'middle'; ctx.fillText(s,x,y); }
  function head(s,x,y,color,align){ txt(s,x,y,color||C.dim,'600 12px '+MONO+', '+SANS,align||'left','alphabetic'); }
  function circ(x,y,r,fill,stroke,lw,dash){ ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); if(fill){ctx.fillStyle=fill; ctx.fill();} ctx.lineWidth=lw; if(dash) ctx.setLineDash(dash); ctx.strokeStyle=stroke; ctx.stroke(); ctx.setLineDash([]); }
  function cross(x,y,r,color,lw){ ctx.strokeStyle=color; ctx.lineWidth=lw; ctx.beginPath(); ctx.moveTo(x-r,y-r); ctx.lineTo(x+r,y+r); ctx.moveTo(x+r,y-r); ctx.lineTo(x-r,y+r); ctx.stroke(); }
  /* 兩行的點格子:上 [x,y],下 d=.. */
  function pcell(x,y,w,h,id,fill,st,tc,lw,dash){
    box(x,y,w,h,fill,st,lw,dash);
    txt(NM[id], x+w/2, y+h/2-7, tc, '700 12px '+MONO);
    txt('d=' + D[id], x+w/2, y+h/2+8, tc === C.ink ? C.dim : tc, '600 10.5px '+MONO);
  }

  const B1 = 18, B2 = 282, B3 = 386;   // band 標題基線
  const PY = 36, U = 23, PS = 8 * U;   // 座標平面:上緣、單位、邊長(−4..4)
  const NW = 66, NH = 34;              // 堆節點大小
  const LV = [60, 110, 160];           // 樹三層的中心 y

  function draw(){
    fit();
    const s = steps[step], w = canvas.clientWidth, H = canvas.clientHeight, PAD = 24;
    const done = s.phase === 'done', isPop = s.phase === 'pop', isDrain = s.phase === 'drain';
    const over = s.heap.length > K;
    ctx.fillStyle = C.paper; ctx.fillRect(0,0,w,H); ctx.setLineDash([]);
    const inHeap = new Set(s.heap), inAns = new Set(s.ans);
    const topId = s.heap.length ? s.heap[0] : null;
    const innerW = w - 2*PAD;

    /* 點的狀態 */
    function stateOf(i){
      if (i >= s.seen) return 'pending';
      if (i === s.pop) return 'popped';
      if (i === s.cur) return 'cur';
      if (i === s.take) return 'take';
      if (inAns.has(i)) return 'ans';
      if (inHeap.has(i)) return 'heap';
      return 'out';
    }

    /* ---------- BAND 1 · 左:座標平面 ---------- */
    head('BAND 1 · 座標平面 −4..4', PAD, B1);
    const ox = PAD + PS/2, oy = PY + PS/2;
    const X = v => ox + v*U, Y = v => oy - v*U;
    // 錄取邊界圓:堆 ≥ k 個(或完成)時,半徑 √(top.d)
    let ringId = null, ringCol = C.ink;
    if (!isDrain && !done && s.heap.length >= K) { ringId = over ? steps[step-1].heap[0] : topId; }   // 超過 k:畫 push 之前的邊界
    if (done) { ringId = 1; ringCol = C.ink; }
    const ringPath = () => { ctx.beginPath(); ctx.arc(ox, oy, Math.sqrt(D[ringId]) * U, 0, Math.PI*2); };
    ctx.save(); ctx.beginPath(); ctx.rect(PAD, PY, PS, PS); ctx.clip();
    if (ringId !== null) { ringPath(); ctx.fillStyle = done ? C.good : C.low; ctx.fill(); }
    // 格線
    ctx.lineWidth = 1; ctx.strokeStyle = C.off;
    for (let g = -4; g <= 4; g++) {
      ctx.beginPath(); ctx.moveTo(X(g), PY); ctx.lineTo(X(g), PY + PS); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(PAD, Y(g)); ctx.lineTo(PAD + PS, Y(g)); ctx.stroke();
    }
    // 座標軸
    ctx.strokeStyle = C.dim; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(PAD, oy); ctx.lineTo(PAD + PS, oy); ctx.moveTo(ox, PY); ctx.lineTo(ox, PY + PS); ctx.stroke();
    if (ringId !== null) { ringPath(); ctx.setLineDash([6,4]); ctx.lineWidth = 2; ctx.strokeStyle = ringCol; ctx.stroke(); ctx.setLineDash([]); }
    ctx.restore();
    txt('x', PAD + PS - 6, oy + 10, C.dim, 'italic 600 11px '+MONO);
    txt('y', ox + 10, PY + 7, C.dim, 'italic 600 11px '+MONO);
    ctx.strokeStyle = C.ink; ctx.lineWidth = 1.2; ctx.strokeRect(PAD, PY, PS, PS);
    // 目前點:原點 → 點 的虛線
    const hot = s.cur !== null ? s.cur : (s.pop !== null ? s.pop : null);
    if (hot !== null) {
      ctx.strokeStyle = s.cur !== null ? C.curS : C.deep; ctx.lineWidth = 1.6; ctx.setLineDash([3,3]);
      ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(X(P[hot][0]), Y(P[hot][1])); ctx.stroke(); ctx.setLineDash([]);
    }
    // 原點
    circ(ox, oy, 3.2, C.ink, C.ink, 1);
    txt('O', ox - 8, oy + 10, C.ink, '700 11px '+MONO);
    // 點
    for (let i = 0; i < P.length; i++) {
      const x = X(P[i][0]), y = Y(P[i][1]), st = stateOf(i);
      let fill = C.paper, sk = C.off, lw = 1.4, tc = C.off, r = 6.5, dash = [2,2];
      if (st === 'cur')         { fill = C.cur;  sk = C.curS; lw = 2.6; tc = C.curT; r = 8; dash = null; }
      else if (st === 'popped') { fill = C.bad;  sk = C.deep; lw = 2.6; tc = C.deep; r = 8; dash = null; }
      else if (st === 'take')   { fill = C.good; sk = C.ink;  lw = 2.6; tc = C.ink;  r = 8; dash = null; }
      else if (st === 'ans')    { fill = C.good; sk = C.ink;  lw = 1.6; tc = C.ink;  dash = null; }
      else if (st === 'heap')   { fill = C.up;   sk = C.ink;  lw = 1.6; tc = C.ink;  dash = null; }
      else if (st === 'out')    { fill = C.off;  sk = C.dim;  lw = 1.2; tc = C.dim;  dash = null; }
      circ(x, y, r, fill, sk, lw, dash);
      if (st === 'out') cross(x, y, 3.5, C.dim, 1.4);
      if (st === 'popped') cross(x, y, 4, C.deep, 1.8);
      const L = LBL[i];
      ctx.font = (st === 'pending' ? '600 ' : '700 ') + '10.5px '+MONO; ctx.textAlign = L[2]; ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round'; ctx.lineWidth = 3.5; ctx.strokeStyle = C.paper; ctx.strokeText(NM[i], x + L[0], y + L[1]);
      txt(NM[i], x + L[0], y + L[1], tc, (st === 'pending' ? '600 ' : '700 ') + '10.5px '+MONO, L[2], 'middle');
    }
    // 平面說明
    let cap = '虛線圓 = 錄取邊界(堆滿 k 個才有)', capC = C.dim;
    if (ringId !== null && !done) { cap = '邊界 r = √' + D[ringId] + '(堆頂 ' + NM[ringId] + ')'; capC = C.ink; }
    if (over) { const inside = D[s.cur] < D[ringId]; cap = '邊界 √' + D[ringId] + ' · 新點在圈' + (inside ? '內 → 擠掉堆頂' : '外 → 自己出局'); capC = C.curT; }
    if (isDrain) { cap = 'drain:綠點 = 已進 ans'; capC = C.ink; }
    if (done) { cap = '答案全在 r = √8 圓內'; capC = C.ink; }
    txt(cap, PAD, PY + PS + 16, capC, '700 11px '+MONO+', '+SANS, 'left', 'middle');

    /* ---------- BAND 1 · 右:最大堆 ---------- */
    const rx0 = PAD + PS + 32, rW = w - PAD - rx0;
    head('最大堆 · 樹 ⇄ 底層 vector · top = 最遠', w - PAD, B1, C.dim, 'right');
    const cw = Math.min(84, (rW - 3*10) / 4), cg = 10, arrW = 4*cw + 3*cg;
    const treeW = arrW, tx0 = rx0;
    const pos = i => {
      const lvl = i === 0 ? 0 : (i <= 2 ? 1 : 2);
      const idxIn = i - ((1 << lvl) - 1), n = 1 << lvl;
      return { x: tx0 + treeW * (idxIn + 0.5) / n, y: LV[lvl] };
    };
    for (let i = 1; i < s.heap.length; i++) {
      const p = pos((i - 1) >> 1), c = pos(i);
      ctx.strokeStyle = C.ink; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(p.x, p.y + NH/2); ctx.lineTo(c.x, c.y - NH/2); ctx.stroke();
    }
    if (!s.heap.length) {
      const p = pos(0);
      box(p.x - NW/2, p.y - NH/2, NW, NH, C.paper, C.off, 1.2, [3,3]);
      txt('空堆', p.x, p.y + 1, C.dim, '600 11px '+SANS);
      const nw2 = Math.min(treeW, 300), ny2 = LV[1] + 8;
      if (done) {
        box(tx0 + (treeW - nw2)/2, ny2, nw2, 32, C.good, C.ink, 1.4);
        txt('堆已清空 · ans 收齊 k = 3 個最近點', tx0 + treeW/2, ny2 + 17, C.ink, '700 12px '+MONO+', '+SANS);
      } else if (s.phase === 'intro') {
        box(tx0 + (treeW - nw2)/2, ny2, nw2, 32, C.paper, C.off, 1.2, [3,3]);
        txt('cmp: d(p1) < d(p2) → 最大堆', tx0 + treeW/2, ny2 + 17, C.dim, '700 12px '+MONO+', '+SANS);
      }
    }
    if (s.heap.length === 1 || (isDrain && !s.heap.length)) {   // 樹下方空白處補一句狀態
      const nw2 = Math.min(treeW, 300), ny2 = LV[1] + 8;
      const t = isDrain ? '堆剩 ' + s.heap.length + ' 個 · 每次取 top(最遠)→ ans' : 'size 1 ≤ k = 3,先收著';
      box(tx0 + (treeW - nw2)/2, ny2, nw2, 32, C.paper, C.off, 1.2, [3,3]);
      txt(t, tx0 + treeW/2, ny2 + 17, C.dim, '700 12px '+MONO+', '+SANS);
    }
    s.heap.forEach((id, i) => {
      const p = pos(i);
      let fill = C.up, st = C.ink, tc = C.ink, lw = 1.5;
      if (id === s.cur)  { fill = C.cur; st = C.curS; tc = C.curT; lw = 2.6; }
      else if (i === 0)  { fill = C.low; lw = 2.4; }
      pcell(p.x - NW/2, p.y - NH/2, NW, NH, id, fill, st, tc, lw);
      const ty = p.y - NH/2 - 5;
      if (i === 0) txt(id === s.cur ? 'top · 新' : 'top', p.x, ty, id === s.cur ? C.curT : C.ink, '700 11px '+MONO+', '+SANS, 'center', 'alphabetic');
      else if (id === s.cur) txt('新', p.x + NW/2 + 6, p.y + 1, C.curT, '700 11px '+SANS, 'left', 'middle');
    });
    // 被 pop / 被取出的點:畫在根的右邊
    const outId = s.pop !== null ? s.pop : s.take;
    if (outId !== null) {
      const r0 = pos(0), px = Math.min(r0.x + treeW * 0.34, w - PAD - NW/2), py = r0.y;
      const col = s.pop !== null ? C.deep : C.ink;
      ctx.strokeStyle = col; ctx.lineWidth = 1.6; ctx.setLineDash([4,3]);
      ctx.beginPath(); ctx.moveTo(r0.x + NW/2 + 6, py); ctx.lineTo(px - NW/2 - 8, py); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(px - NW/2 - 2, py); ctx.lineTo(px - NW/2 - 10, py - 5); ctx.lineTo(px - NW/2 - 10, py + 5); ctx.closePath(); ctx.fill();
      if (s.pop !== null) pcell(px - NW/2, py - NH/2, NW, NH, outId, C.bad, C.deep, C.deep, 2.4);
      else pcell(px - NW/2, py - NH/2, NW, NH, outId, C.good, C.ink, C.ink, 2.4);
      txt(s.pop !== null ? 'pop · 最遠' : 'top → ans', px, py - NH/2 - 5, col, '700 11px '+MONO+', '+SANS, 'center', 'alphabetic');
    }
    // 底層陣列
    const idxY = 204, cellTop = 218, ch = 36;
    for (let i = 0; i < 4; i++) {
      const x = tx0 + i*(cw + cg);
      txt(String(i), x + cw/2, idxY, (i === 3 && over) ? C.curT : C.dim, '600 11px '+MONO, 'center', 'alphabetic');
      const id = s.heap[i];
      if (id === undefined) { box(x, cellTop, cw, ch, C.paper, C.off, 1.2, [3,3]); continue; }
      let fill = C.up, st = C.ink, tc = C.ink, lw = 1.4;
      if (id === s.cur)  { fill = C.cur; st = C.curS; tc = C.curT; lw = 2.4; }
      else if (i === 0)  { fill = C.low; lw = 2.2; }
      pcell(x, cellTop, cw, ch, id, fill, st, tc, lw);
    }

    /* ---------- BAND 2 · 資料流 ---------- */
    head('BAND 2 · points 依序讀入   紅 = 目前　藍底 = 在堆裡　灰 = 踢掉　深紅 = 剛踢掉　綠 = 進 ans', PAD, B2);
    const sy = B2 + 12, sh = 40, sg = 10;
    const sw = Math.min(96, (innerW - 5*sg) / 6);
    const TAG = { pending:'待讀', cur:'剛 push', popped:'剛踢掉', take:'→ ans', ans:'在 ans', heap:'在堆裡', out:'已踢掉' };
    for (let i = 0; i < P.length; i++) {
      const x = PAD + i*(sw + sg), st = stateOf(i);
      let fill = C.paper, sk = C.off, tc = C.off, lw = 1.2, dash = [3,3];
      if (st === 'cur')         { fill = C.cur;  sk = C.curS; tc = C.curT; lw = 2.4; dash = null; }
      else if (st === 'popped') { fill = C.bad;  sk = C.deep; tc = C.deep; lw = 2.4; dash = null; }
      else if (st === 'take')   { fill = C.good; sk = C.ink;  tc = C.ink;  lw = 2.4; dash = null; }
      else if (st === 'ans')    { fill = C.good; sk = C.ink;  tc = C.ink;  lw = 1.4; dash = null; }
      else if (st === 'heap')   { fill = C.up;   sk = C.ink;  tc = C.ink;  lw = 1.4; dash = null; }
      else if (st === 'out')    { fill = C.paper; sk = C.off; tc = C.off;  lw = 1.4; dash = null; }
      box(x, sy, sw, sh, fill, sk, lw, dash);
      txt(NM[i], x + sw/2, sy + sh/2 - 7, tc, '700 12.5px '+MONO);
      txt('d=' + D[i], x + sw/2, sy + sh/2 + 9, tc === C.ink ? C.dim : tc, '600 11px '+MONO);
      if (st === 'out') { ctx.strokeStyle = C.off; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x + 10, sy + sh - 6); ctx.lineTo(x + sw - 10, sy + 6); ctx.stroke(); }
      const tagC = st === 'cur' ? C.curT : st === 'popped' ? C.deep : st === 'pending' || st === 'out' ? C.off : C.ink;
      txt(TAG[st], x + sw/2, sy + sh + 14, tagC, '600 10.5px '+SANS, 'center', 'middle');
    }

    /* ---------- BAND 3 · 動作 + ans ---------- */
    head('BAND 3 · 動作 / ans', PAD, B3);
    const ay = B3 + 12, ah = 32;
    let aTxt, aF = C.paper, aS = C.ink, aT = C.ink, aLw = 1.4, aD = null;
    if (s.phase === 'intro') { aTxt = '規則:每個點 push;size > k 就 pop 堆頂(最遠的)'; aS = C.off; aT = C.dim; aD = [3,3]; aLw = 1.2; }
    else if (s.phase === 'push' && over) { aTxt = 'push ' + NM[s.cur] + ' d=' + D[s.cur] + ' · ⚠ size ' + s.heap.length + ' > k=' + K + ' → 下一步 pop'; aF = C.cur; aS = C.curS; aT = C.curT; aLw = 2; }
    else if (s.phase === 'push') { aTxt = 'push ' + NM[s.cur] + ' d=' + D[s.cur] + ' · size ' + s.heap.length + (s.heap.length === K ? ' = k' : ' ≤ k=' + K) + ',不用 pop'; }
    else if (isPop) { aTxt = 'size 4 > k=' + K + ' → pop 最遠的 ' + NM[s.pop] + ' d=' + D[s.pop]; aF = C.bad; aS = C.deep; aT = C.deep; aLw = 2; }
    else if (isDrain) { aTxt = 'drain:ans.push_back(top = ' + NM[s.take] + ' d=' + D[s.take] + ');pop'; aF = C.good; aLw = 2; }
    else { aTxt = '完成:ans = [[-2,2],[2,0],[0,1]]'; aF = C.good; aLw = 2; }
    box(PAD, ay, innerW, ah, aF, aS, aLw, aD);
    txt(aTxt, PAD + innerW/2, ay + ah/2 + 1, aT, '700 12.5px '+MONO+', '+SANS);

    const ny = ay + ah + 14, nh = 34;
    txt('ans', PAD, ny + nh/2 + 1, C.ink, '700 13px '+MONO, 'left', 'middle');
    const nx0 = PAD + 40, nw = Math.min(90, (innerW - 40 - 2*10 - 180) / 3);
    for (let i = 0; i < K; i++) {
      const x = nx0 + i*(nw + 10), id = s.ans[i];
      if (id === undefined) { box(x, ny, nw, nh, C.paper, C.off, 1.2, [3,3]); txt(String(i), x + nw/2, ny + nh/2 + 1, C.off, '600 11px '+MONO); continue; }
      const newest = isDrain && i === s.ans.length - 1;
      pcell(x, ny, nw, nh, id, C.good, C.ink, C.ink, newest ? 2.6 : 1.4);
    }
    const noteX = nx0 + 3*(nw + 10) + 6;
    txt('← 最遠的先出;任意順序皆可', noteX, ny + nh/2 + 1, s.ans.length ? C.ink : C.off, '600 11.5px '+SANS, 'left', 'middle');
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
