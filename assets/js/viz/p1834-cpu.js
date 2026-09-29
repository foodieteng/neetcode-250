/* ============================================================
   P1834 · Single-Threaded CPU — 正確版 · 時間只往前跳 + 最小堆(proc, idx) · viz
     vector<int> arr(n); iota; sort(arr, by enqueue);
     priority_queue<pair<int,int>, vector<...>, greater<...>> pq;   // (proc, idx)
     long long t = 0; int i = 0;
     while (i < n || !pq.empty()) {
       if (pq.empty()) t = max(t, (long long)tasks[arr[i]][0]);   // 只往前跳
       while (i < n && tasks[arr[i]][0] <= t) { pq.push({tasks[arr[i]][1], arr[i]}); i++; }
       auto [p, idx] = pq.top(); pq.pop();
       t += p; ans.push_back(idx);
     }
   動畫要傳達的一件事:t 是「CPU 的時鐘」,只會往前走;CPU 空下來時,
   從「已經到達」的任務裡挑 proc 最小(平手 idx 小)的跑。
   例 tasks = [[1,2],[2,4],[3,2],[4,1]]  arr = [0,1,2,3]
     it1  t 0 → 跳到 1   push 0        heap (2,0)        pop 0  t → 3
     it2  t 3            push 1,2      heap (2,2)(4,1)   pop 2  t → 5
     it3  t 5            push 3        heap (1,3)(4,1)   pop 3  t → 6
     it4  t 6            push —        heap (4,1)        pop 1  t → 10
     output [0,2,3,1]
     BAND 1  時間軸 0..10:到達旗、CPU 執行區間、紅線 = 目前 t
     BAND 2  arr(依 enqueue)+ 指標 i | 最小堆 chips (proc, idx)
     BAND 3  output + 這一步
   前綴 v1834- 。
   ============================================================ */
(function () {
  const P = 'v1834';
  const canvas = document.getElementById(P + '-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById(P + '-step'), labelEl = document.getElementById(P + '-label');
  const bPrev = document.getElementById(P + '-prev'), bNext = document.getElementById(P + '-next'),
        bPlay = document.getElementById(P + '-play'), bReset = document.getElementById(P + '-reset');

  const C = { paper:'#ffffff', ink:'#1f1f1f', dim:'#5a5a5a', off:'#cfcfcf',
    up:'#e3edf5', low:'#f6ead8',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424',
    good:'#d9e8c7', bad:'#f0d4d4', deep:'#a31d1d' };

  const MONO = '"JetBrains Mono", monospace', SANS = '"Noto Sans TC", sans-serif';

  const BUG = false;
  const ENQ = [1, 2, 3, 4], PROC = [2, 4, 2, 1];
  const ARR = [0, 1, 2, 3];
  const EXPECT = [0, 2, 3, 1];
  const ROW = { 0:0, 1:0, 2:0, 3:0 };      // CPU lane 子列(正確版全在同一列)
  const NROW = 1;

  /* t / tp: 這一步之後 / 之前的 t;mv: 'jump' | 'run' | 'back' | null;i: 已 push 幾個;
     pn: 這一步 push 的 idx;heap: [[proc, idx]] 已排序(左 = top);pop: 這一步 pop 的 idx;
     blk: [[idx, s, e]] 已執行;out: 輸出;miss: 其實已到卻沒進堆的 idx;phase;act;note;text */
  const S = o => o;
  const steps = [
    S({ t:0, tp:null, mv:null, i:0, pn:[], heap:[], pop:null, blk:[], out:[], miss:[], phase:'init',
      act:'arr = [0,1,2,3](依 enqueue 排)· i = 0 · t = 0 · 堆空',
      note:'規則:CPU 空下來 → 從「已到達」的任務挑 proc 最小(平手 idx 小)',
      text:'<strong>INITIAL</strong> · <code>tasks = [[1,2],[2,4],[3,2],[4,1]]</code>,每個是 <code>[enqueue, proc]</code>。先把 index 依 enqueue 排成 <code>arr = [0,1,2,3]</code>,指標 <code>i = 0</code>;最小堆依 <code>(處理時間, index)</code> 排;<code>t = 0</code>(<code>long long</code>)。CPU 一空下來,就從<b>已經到達</b>的任務裡挑處理時間最短的。' }),

    S({ t:1, tp:0, mv:'jump', i:1, pn:[0], heap:[[2,0]], pop:null, blk:[], out:[], miss:[], phase:'push',
      act:'堆空 → t = max(t, enq[arr[0]]) = max(0, 1) = 1 · push (2,0)',
      note:'堆空、CPU 沒事做 → t 往前跳到下一個到達時刻 1',
      text:'<strong>第 1 輪 · 堆空 → 往前跳</strong> · 堆是空的,CPU 閒著 → <code>t = max(t, 1) = 1</code>,<b>時間直接往前跳</b>到下一個任務到達的時刻。<code>enqueue ≤ 1</code> 的只有 <code>#0</code> → push <code>(2,0)</code>,<code>i = 1</code>。' }),
    S({ t:3, tp:1, mv:'run', i:1, pn:[], heap:[[2,0]], pop:0, blk:[[0,1,3]], out:[0], miss:[], phase:'pop',
      act:'pop (2,0) → 執行 #0 · t = 1 + 2 = 3 · output 加 0',
      note:'#0 從 t=1 跑到 t=3,這段時間 CPU 被佔住',
      text:'<strong>第 1 輪 · pop</strong> · 堆頂 <code>(2,0)</code> → 執行 <code>#0</code>,<code>t += 2 → 3</code>。CPU 在 <code>[1, 3)</code> 被佔住;期間 <code>#1</code>(t=2)、<code>#2</code>(t=3)陸續到達,但要等下一輪才進堆。' }),

    S({ t:3, tp:null, mv:null, i:3, pn:[1,2], heap:[[2,2],[4,1]], pop:null, blk:[[0,1,3]], out:[0], miss:[], phase:'push',
      act:'堆空 → t = max(3, enq[1] = 2) = 3(不倒退)· push (4,1)、(2,2)',
      note:'t = max(3, 2) = 3:時間不倒退 → #1、#2 都已到,一起進堆比',
      text:'<strong>第 2 輪 · push</strong> · 堆空,但 <code>t = max(3, 2) = 3</code> —— <b>下一個到達時刻 2 比現在早,t 不動</b>。<code>enqueue ≤ 3</code> 的 <code>#1</code>(2)和 <code>#2</code>(3)<b>都到了</b> → 兩個都 push,<code>i = 3</code>。堆頂是 <code>(2,2)</code>。' }),
    S({ t:5, tp:3, mv:'run', i:3, pn:[], heap:[[2,2],[4,1]], pop:2, blk:[[0,1,3],[2,3,5]], out:[0,2], miss:[], phase:'pop',
      act:'pop (2,2) → 執行 #2(proc 2 < 4)· t = 3 + 2 = 5 · output 加 2',
      note:'#2 雖然比 #1 晚到,但 proc 2 < 4 → 先跑 #2',
      text:'<strong>第 2 輪 · pop</strong> · <code>(2,2) &lt; (4,1)</code> → 先跑 <code>#2</code>,<code>t = 5</code>。<b>晚到但比較短的 #2 贏了</b> —— 前提是 <code>t</code> 是真正的 3,讓兩個任務都能進堆比較。' }),

    S({ t:5, tp:null, mv:null, i:4, pn:[3], heap:[[1,3],[4,1]], pop:null, blk:[[0,1,3],[2,3,5]], out:[0,2], miss:[], phase:'push',
      act:'堆不空 → t 不動 = 5 · push (1,3)(enq 4 ≤ 5)',
      note:'#3 在 t=4 到達,現在 t=5 → 進堆,成為新的 top',
      text:'<strong>第 3 輪 · push</strong> · 堆裡還有 <code>(4,1)</code>,不用跳。<code>#3</code> 的 <code>enqueue = 4 ≤ 5</code> → push <code>(1,3)</code>,<code>i = 4 = n</code>,全部到齊。' }),
    S({ t:6, tp:5, mv:'run', i:4, pn:[], heap:[[1,3],[4,1]], pop:3, blk:[[0,1,3],[2,3,5],[3,5,6]], out:[0,2,3], miss:[], phase:'pop',
      act:'pop (1,3) → 執行 #3 · t = 5 + 1 = 6 · output 加 3',
      note:'#1 最早到(t=2)卻一直被更短的任務插隊',
      text:'<strong>第 3 輪 · pop</strong> · <code>(1,3)</code> 最短 → 執行 <code>#3</code>,<code>t = 6</code>。<code>#1</code> 雖然最早到,但 proc 4 最長,一直排在後面。' }),

    S({ t:6, tp:null, mv:null, i:4, pn:[], heap:[[4,1]], pop:null, blk:[[0,1,3],[2,3,5],[3,5,6]], out:[0,2,3], miss:[], phase:'push',
      act:'i = n,沒有可 push · 堆剩 (4,1)',
      note:'i = 4 = n:沒有新到達;堆不空 → 直接 pop',
      text:'<strong>第 4 輪 · push</strong> · <code>i = n</code>,沒有新任務;堆剩 <code>(4,1)</code>,不空 → <code>t</code> 不動。' }),
    S({ t:10, tp:6, mv:'run', i:4, pn:[], heap:[[4,1]], pop:1, blk:[[0,1,3],[2,3,5],[3,5,6],[1,6,10]], out:[0,2,3,1], miss:[], phase:'pop',
      act:'pop (4,1) → 執行 #1 · t = 6 + 4 = 10 · output 加 1',
      note:'CPU 區間首尾相接:[1,3) [3,5) [5,6) [6,10) —— 沒有重疊',
      text:'<strong>第 4 輪 · pop</strong> · 執行 <code>#1</code>,<code>t = 10</code>。看 CPU 那一列:四段<b>首尾相接、沒有重疊</b> —— 單執行緒 CPU 本來就該這樣。' }),

    S({ t:10, tp:null, mv:null, i:4, pn:[], heap:[], pop:null, blk:[[0,1,3],[2,3,5],[3,5,6],[1,6,10]], out:[0,2,3,1], miss:[], phase:'end',
      act:'i == n 且堆空 → 結束 · return [0,2,3,1]',
      note:'t 全程 0 → 1 → 3 → 5 → 6 → 10,只往前走',
      text:'<strong>完成 · return [0,2,3,1]</strong> · <code>t</code> 全程 <code>0→1→3→5→6→10</code>,<b>只往前走</b>。關鍵就在 <code>t = max(t, enqueue)</code>:堆空時才跳,而且只跳向未來。時間 <code>O(n log n)</code>,空間 <code>O(n)</code>;<code>t</code> 用 <code>long long</code>(enqueue、proc 可到 1e9,累加會超過 int)。' }),
  ];

  let step = 0, timer = null;

  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||472; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function box(x,y,w,h,fill,stroke,lw,dash){ rr(x,y,w,h,5); ctx.fillStyle=fill; ctx.fill(); ctx.lineWidth=lw||1.4; if(dash) ctx.setLineDash(dash); ctx.strokeStyle=stroke; ctx.stroke(); ctx.setLineDash([]); }
  function txt(s,x,y,color,font,align,base){ ctx.fillStyle=color; ctx.font=font; ctx.textAlign=align||'center'; ctx.textBaseline=base||'middle'; ctx.fillText(s,x,y); }
  function head(s,x,y,color){ txt(s,x,y,color||C.dim,'600 12px '+MONO+', '+SANS,'left','alphabetic'); }
  function line(x1,y1,x2,y2,color,lw,dash){ ctx.strokeStyle=color; ctx.lineWidth=lw; if(dash) ctx.setLineDash(dash); ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); ctx.setLineDash([]); }
  function arrowH(x1,x2,y,color,lw){ line(x1,y,x2,y,color,lw); const d = x2 > x1 ? 1 : -1;
    ctx.fillStyle=color; ctx.beginPath(); ctx.moveTo(x2,y); ctx.lineTo(x2-d*8,y-5); ctx.lineTo(x2-d*8,y+5); ctx.closePath(); ctx.fill(); }
  function hatch(x,y,w,h,color){ ctx.save(); ctx.beginPath(); ctx.rect(x,y,w,h); ctx.clip();
    ctx.fillStyle=C.bad; ctx.fillRect(x,y,w,h); ctx.strokeStyle=color; ctx.lineWidth=1.3;
    for (let k = -h; k < w; k += 7) { ctx.beginPath(); ctx.moveTo(x+k, y+h); ctx.lineTo(x+k+h, y); ctx.stroke(); }
    ctx.restore(); }

  /* 版面(縱向) */
  const B1 = 18;
  const FA = B1 + 14, FB = B1 + 38, FH = 18;          // 兩列到達旗
  const AX = B1 + 74;                                  // 時間軸
  const TK = AX + 14;                                  // 刻度文字
  const LT = AX + 34, SUBH = 26, SUBG = 6;             // CPU lane
  const LH = NROW*SUBH + (NROW-1)*SUBG + 10, LB = LT + LH;
  const AR = LB + 20, NT = LB + 46;                    // t 箭頭列 / 說明列
  const B2 = LB + 76, B3 = B2 + 132;

  function draw(){
    fit();
    const s = steps[step], w = canvas.clientWidth, H = canvas.clientHeight, PAD = 24;
    const innerW = w - 2*PAD;
    ctx.fillStyle = C.paper; ctx.fillRect(0,0,w,H); ctx.setLineDash([]);

    /* ---------- BAND 1 · 時間軸 ---------- */
    head(BUG ? 'BAND 1 · 時間軸(程式以為的)   旗 = 到達　方塊 = 執行區間　紅線 = t　深紅斜線 = 重疊'
             : 'BAND 1 · 時間軸   旗 = 到達時間　方塊 = CPU 執行區間　紅線 = 目前 t', PAD, B1);
    const x0 = PAD + 50, x1 = PAD + innerW - 14, U = (x1 - x0) / 10;
    const X = v => x0 + v*U;
    const pushed = new Set(ARR.slice(0, s.i));

    // 刻度格線(lane 內)
    for (let v = 0; v <= 10; v++) line(X(v), LT, X(v), LB, '#e3edf5', 1);
    // lane
    txt('CPU', PAD, LT + LH/2, C.ink, '700 13px '+MONO, 'left', 'middle');
    ctx.strokeStyle = C.off; ctx.lineWidth = 1.2; ctx.strokeRect(x0, LT, x1 - x0, LH);

    // 軸
    line(x0, AX, x1, AX, C.ink, 1.6);
    for (let v = 0; v <= 10; v++) {
      const isT = v === s.t;
      line(X(v), AX, X(v), AX + 5, C.ink, 1.2);
      txt(String(v), X(v), TK, isT ? (s.mv === 'back' ? C.deep : C.curT) : C.dim, (isT ? '700 12px ' : '600 11px ') + MONO, 'center', 'middle');
    }

    // 到達旗
    for (let k = 0; k < 4; k++) {
      const top = (k % 2 === 0) ? FA : FB, cx = X(ENQ[k]);
      const lbl = '#' + k + ' 到達 t=' + ENQ[k];
      ctx.font = '700 11px '+MONO+', '+SANS; const fw = ctx.measureText(lbl).width + 14;
      const isNew = s.pn.indexOf(k) >= 0, isMiss = s.miss.indexOf(k) >= 0, isIn = pushed.has(k);
      let fill = C.paper, st = C.off, tc = C.dim, lw = 1.2, dash = [3,3];
      if (isIn) { fill = C.up; st = C.ink; tc = C.ink; dash = null; }
      if (isNew) { fill = C.up; st = C.curS; tc = C.curT; lw = 2.2; dash = null; }
      if (isMiss) { fill = C.bad; st = C.deep; tc = C.deep; lw = 2.2; dash = null; }
      line(cx, top + FH, cx, AX, isMiss ? C.deep : (isIn || isNew ? C.ink : C.off), isMiss || isNew ? 1.6 : 1.1);
      box(cx - fw/2, top, fw, FH, fill, st, lw, dash);
      txt(lbl, cx, top + FH/2 + 1, tc, '700 11px '+MONO+', '+SANS);
      ctx.fillStyle = isMiss ? C.deep : (isIn || isNew ? C.ink : C.off); ctx.beginPath(); ctx.arc(cx, AX, 3.2, 0, 7); ctx.fill();
    }

    // 執行區間(文字等 t 游標畫完再補上,避免被紅線切過)
    const labels = [];
    s.blk.forEach((b, n) => {
      const [idx, a, e] = b, r = ROW[idx];
      const by = LT + 5 + r*(SUBH + SUBG), bx = X(a), bw = X(e) - X(a);
      const isCur = s.pop === idx;
      box(bx + 1, by, bw - 2, SUBH, isCur ? C.cur : C.low, isCur ? C.curS : C.ink, isCur ? 2.6 : 1.3);
      // 與先前區間重疊的部分 → 深紅斜線
      let ov = null;
      for (let m = 0; m < n; m++) {
        const [, a2, e2] = s.blk[m], lo = Math.max(a, a2), hi = Math.min(e, e2);
        if (hi > lo) ov = ov ? [Math.min(ov[0], lo), Math.max(ov[1], hi)] : [lo, hi];
      }
      if (ov) {
        hatch(X(ov[0]) + 2, by + 2, X(ov[1]) - X(ov[0]) - 4, SUBH - 4, C.deep);
        ctx.setLineDash([]); rr(X(ov[0]) + 1, by, X(ov[1]) - X(ov[0]) - 2, SUBH, 4); ctx.strokeStyle = C.deep; ctx.lineWidth = 2; ctx.stroke();
      }
      const lbl = bw > 80 ? '#' + idx + '  ' + a + '–' + e : '#' + idx;
      ctx.font = '700 12px '+MONO; const lw2 = ctx.measureText(lbl).width + 10;
      let lx = bx + bw/2;
      if (ov) { const freeA = X(a), freeB = X(ov[0]) > X(a) + 4 ? X(ov[0]) : X(e);   // 優先放在沒重疊的部分
        if (X(ov[0]) - X(a) >= lw2 + 4) lx = (freeA + freeB)/2; else if (X(e) - X(ov[1]) >= lw2 + 4) lx = (X(ov[1]) + X(e))/2; }
      labels.push([lbl, lx, by, lw2, !!ov, isCur]);
    });

    // t 游標
    const cx = X(s.t), back = s.mv === 'back';
    if (back) line(X(s.tp), AX - 4, X(s.tp), LB + 4, C.dim, 1.4, [4,3]);
    line(cx, AX - 8, cx, LB + 6, back ? C.deep : C.curS, 2.4);
    ctx.fillStyle = back ? C.deep : C.curS; ctx.beginPath(); ctx.arc(cx, AX, 4.5, 0, 7); ctx.fill();
    labels.forEach(([lbl, lx, by, lw2, ov, isCur]) => {
      if (ov || Math.abs(lx - cx) < lw2/2 + 3) { rr(lx - lw2/2, by + 4, lw2, SUBH - 8, 4); ctx.fillStyle = C.paper; ctx.fill(); }
      txt(lbl, lx, by + SUBH/2 + 1, isCur ? C.curT : C.ink, '700 12px '+MONO);
    });
    ctx.font = '700 12px '+MONO; const tw = ctx.measureText(String(s.t)).width + 8;
    ctx.fillStyle = C.paper; ctx.fillRect(cx - tw/2, TK - 8, tw, 16);
    txt(String(s.t), cx, TK, back ? C.deep : C.curT, '700 12px '+MONO, 'center', 'middle');

    // t 移動箭頭 + 文字
    if (s.tp !== null && s.tp !== s.t) {
      const col = back ? C.deep : (s.mv === 'jump' ? C.curS : C.dim), tcol = back ? C.deep : (s.mv === 'jump' ? C.curT : C.ink);
      arrowH(X(s.tp), cx, AR, col, back ? 2.6 : 2);
      const lbl = back ? 't: ' + s.tp + ' → ' + s.t + ' 倒退!'
                : s.mv === 'jump' ? 't: ' + s.tp + ' → ' + s.t + '(堆空,往前跳)'
                : 't: ' + s.tp + ' → ' + s.t + '(+proc ' + (s.t - s.tp) + ')';
      ctx.font = '700 12px '+MONO+', '+SANS; const lw3 = ctx.measureText(lbl).width;
      const hi = Math.max(X(s.tp), cx), lo = Math.min(X(s.tp), cx);
      if (hi + 10 + lw3 <= w - PAD) txt(lbl, hi + 10, AR, tcol, '700 12px '+MONO+', '+SANS, 'left', 'middle');
      else txt(lbl, lo - 10, AR, tcol, '700 12px '+MONO+', '+SANS, 'right', 'middle');
    } else {
      const lbl = 't = ' + s.t + (s.phase === 'push' ? '(不動)' : '');
      txt(lbl, cx + (cx > x0 + innerW/2 ? -10 : 10), AR, C.curT, '700 12px '+MONO+', '+SANS, cx > x0 + innerW/2 ? 'right' : 'left', 'middle');
    }
    const ncol = back || s.phase === 'bugend' ? C.deep : (s.phase === 'end' ? C.ink : C.dim);
    txt(s.note, PAD + innerW/2, NT, ncol, '700 12px '+SANS, 'center', 'middle');

    /* ---------- BAND 2 · arr + i | 最小堆 ---------- */
    head('BAND 2 · 狀態   arr(依 enqueue 排,格內 = enq, proc)　min-heap(左 = top)', PAD, B2);
    const by = B2 + 12, bh = 92, bg = 14;
    const aw = Math.min(300, Math.max(272, innerW*0.5)), hx = PAD + aw + bg, hw = innerW - aw - bg;
    // arr
    box(PAD, by, aw, bh, C.paper, C.ink, 1.4);
    txt('arr', PAD + 12, by + 15, C.ink, '700 12px '+MONO, 'left', 'middle');
    txt('i = ' + s.i + (s.i === 4 ? ' = n' : ''), PAD + aw - 12, by + 15, C.curT, '700 12px '+MONO, 'right', 'middle');
    const cw = (aw - 24 - 3*8) / 4, ch = 36, cy = by + 28;
    for (let k = 0; k < 4; k++) {
      const idx = ARR[k], x = PAD + 12 + k*(cw + 8);
      const isNew = s.pn.indexOf(idx) >= 0, isMiss = s.miss.indexOf(idx) >= 0, isIn = k < s.i;
      let fill = C.paper, st = C.off, tc = C.dim, lw = 1.2;
      if (isIn) { fill = C.up; st = C.ink; tc = C.ink; lw = 1.4; }
      if (isNew) { st = C.curS; tc = C.curT; lw = 2.4; }
      if (isMiss) { fill = C.bad; st = C.deep; tc = C.deep; lw = 2.2; }
      box(x, cy, cw, ch, fill, st, lw);
      txt('#' + idx, x + cw/2, cy + 11, tc, '700 12px '+MONO);
      txt(ENQ[idx] + ', ' + PROC[idx], x + cw/2, cy + 26, tc === C.ink ? C.dim : tc, '600 10.5px '+MONO);
    }
    if (s.i < 4) {
      const px = PAD + 12 + s.i*(cw + 8) + cw/2, py = cy + ch + 4;
      ctx.fillStyle = C.curS; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - 6, py + 8); ctx.lineTo(px + 6, py + 8); ctx.closePath(); ctx.fill();
      txt('i', px + 12, py + 9, C.curT, '700 12px '+MONO, 'left', 'middle');
    } else {
      txt('i = n:全部都 push 過了', PAD + aw/2, cy + ch + 13, C.dim, '600 11px '+SANS, 'center', 'middle');
    }
    // heap
    const hAct = s.pop !== null || s.pn.length > 0;
    box(hx, by, hw, bh, C.paper, C.ink, 1.4);
    txt('min-heap (proc, idx)', hx + 12, by + 15, C.ink, '700 12px '+MONO, 'left', 'middle');
    txt('size = ' + s.heap.length, hx + hw - 12, by + 15, C.dim, '600 11px '+MONO, 'right', 'middle');
    const kw = Math.min(70, (hw - 24 - 3*8) / 4);
    if (s.heap.length === 0) {
      box(hx + 12, cy, hw - 24, ch, C.paper, C.off, 1.2, [3,3]);
      txt('空', hx + hw/2, cy + ch/2 + 1, C.dim, '600 12px '+SANS);
    } else {
      s.heap.forEach((e, k) => {
        const x = hx + 12 + k*(kw + 8), isPop = s.pop === e[1], isNew = s.pn.indexOf(e[1]) >= 0;
        let fill = C.up, st = C.ink, lw = 1.4, tc = C.ink;
        if (isNew) { st = C.curS; lw = 2.4; tc = C.curT; }
        if (isPop) { fill = C.cur; st = C.curS; lw = 2.8; tc = C.curT; }
        box(x, cy, kw, ch, fill, st, lw);
        txt('(' + e[0] + ',' + e[1] + ')', x + kw/2, cy + ch/2 + 1, tc, '700 13px '+MONO);
        if (k === 0) txt('top', x + kw/2, cy + ch + 12, C.dim, '600 10.5px '+MONO, 'center', 'middle');
      });
    }
    let hn = '', hc = C.dim;
    if (s.pop !== null) { hn = 'pop → 執行 #' + s.pop; hc = C.curT; }
    else if (s.pn.length) { hn = 'push ' + s.pn.map(k => '#' + k).join('、'); hc = C.curT; }
    if (hn) txt(hn, hx + hw - 12, cy + ch + 12, hc, '700 11.5px '+MONO+', '+SANS, 'right', 'middle');

    /* ---------- BAND 3 · output + 這一步 ---------- */
    head('BAND 3 · output' + (BUG ? '(預期 vs 你的)' : ''), PAD, B3);
    const OL = 70, ow = 46, oh = 32, og = 8, ox = PAD + OL;
    const rows = BUG ? [['預期', EXPECT, true], ['你的', s.out, false]] : [['output', s.out, false]];
    let firstBad = -1;
    for (let k = 0; k < s.out.length; k++) if (s.out[k] !== EXPECT[k]) { firstBad = k; break; }
    rows.forEach((row, r) => {
      const ry = B3 + 12 + r*(oh + 12), [nm, arr, isExp] = row;
      txt(nm, PAD, ry + oh/2 + 1, C.ink, '700 12px '+MONO+', '+SANS, 'left', 'middle');
      for (let k = 0; k < 4; k++) {
        const x = ox + k*(ow + og);
        if (k >= arr.length) { box(x, ry, ow, oh, C.paper, C.off, 1.2, [3,3]); txt('[' + k + ']', x + ow/2, ry + oh/2 + 1, C.off, '600 10.5px '+MONO); continue; }
        let fill = C.low, st = C.ink, lw = 1.4, tc = C.ink;
        if (isExp) { fill = C.paper; st = C.dim; tc = C.dim; lw = 1.2; if (s.phase === 'bugend' && k === firstBad) { st = C.ink; tc = C.ink; lw = 2; } }
        else {
          const bad = arr[k] !== EXPECT[k];
          if (bad) { fill = C.bad; st = k === firstBad ? C.curS : C.deep; lw = k === firstBad ? 2.8 : 1.6; tc = k === firstBad ? C.curT : C.deep; }
          else if (s.phase === 'end' || s.phase === 'bugend') { fill = C.good; }
          if (k === arr.length - 1 && s.phase === 'pop' && !bad) { st = C.curS; lw = 2.4; tc = C.curT; }
        }
        box(x, ry, ow, oh, fill, st, lw);
        txt(String(arr[k]), x + ow/2, ry + oh/2 + 1, tc, '700 15px '+MONO);
      }
      const rx = ox + 4*(ow + og) + 6;
      if (!BUG && s.phase === 'end') txt('= 預期 [0,2,3,1] ✓', rx, ry + oh/2 + 1, C.ink, '700 12px '+MONO+', '+SANS, 'left', 'middle');
      if (!BUG && s.phase !== 'end') txt('預期 [0,2,3,1]', rx, ry + oh/2 + 1, C.off, '600 11.5px '+MONO+', '+SANS, 'left', 'middle');
      if (BUG && !isExp && firstBad >= 0) txt('← 第 ' + firstBad + ' 格起不同:該是 #' + EXPECT[firstBad] + ',卻跑了 #' + s.out[firstBad], rx, ry + oh/2 + 1, C.curT, '700 12px '+MONO+', '+SANS, 'left', 'middle');
      if (BUG && isExp && firstBad >= 0) {   // 第一個不同位置:上下連線
        const fx = ox + firstBad*(ow + og) + ow/2; line(fx, ry + oh + 2, fx, ry + oh + 10, C.curS, 2);
      }
    });
    const ay = B3 + 12 + rows.length*(oh + 12), ah = 32;
    let aF = C.paper, aS = C.ink, aT = C.ink, aLw = 1.4, aD = null;
    if (s.phase === 'init') { aS = C.off; aT = C.dim; aD = [3,3]; aLw = 1.2; }
    else if (s.phase === 'pop') { aF = C.cur; aS = C.curS; aT = C.curT; aLw = 2; }
    else if (s.mv === 'back') { aF = C.bad; aS = C.deep; aT = C.deep; aLw = 2.4; }
    else if (s.phase === 'end') { aF = C.good; aLw = 2.2; }
    else if (s.phase === 'bugend') { aF = C.bad; aS = C.deep; aT = C.deep; aLw = 2.4; }
    else { aF = C.up; }
    box(PAD, ay, innerW, ah, aF, aS, aLw, aD);
    txt(s.act, PAD + innerW/2, ay + ah/2 + 1, aT, '700 12.5px '+MONO+', '+SANS);
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
