/* ============================================================
   P621 · Task Scheduler — 最大堆 + 每輪 n+1 格 · viz
     int freq[26]; for (char c : tasks) freq[c-'A']++;
     priority_queue<int> pq; for (f : freq) if (f) pq.push(f);
     int cycle = n + 1, time = 0; vector<int> buff;
     while (!pq.empty()) {
       buff.clear();
       for (int i = 0; i < cycle; i++) {
         if (pq.empty() && buff.empty()) break;
         if (!pq.empty()) { int cnt = pq.top(); pq.pop(); if (--cnt > 0) buff.push_back(cnt); }
         time++;                       // pq 空也要 ++ → idle
       }
       for (int c : buff) pq.push(c);
     }
     return time;
   動畫要傳達的一件事:把時間切成一輪 n+1 格,每輪從最大堆拿「不同的」任務各做一次;
   pq 拿空了但 buff 還有人在冷卻 → 補 idle;pq 空且 buff 也空 → 全做完,直接 break、不補 idle。
   例 tasks = [A,A,A,B,B,B], n = 2 → 8
     C++ 實測(counts 版與 pair<int,char> 追字母版 time 皆 = 8;平手時 pair 大字元先出 → B 先):
       cycle 1  pq=[3,3]  t1 pop B(3)→2 buff  t2 pop A(3)→2 buff  t3 idle      buff=[B2,A2] → 推回  time=3
       cycle 2  pq=[2,2]  t4 pop B(2)→1 buff  t5 pop A(2)→1 buff  t6 idle      buff=[B1,A1] → 推回  time=6
       cycle 3  pq=[1,1]  t7 pop B(1)→0       t8 pop A(1)→0       i=2 break    buff=[]              time=8
       seq = B A idle | B A idle | B A
     BAND 1  時間軸:3 輪 × 3 格,紅框 = 目前這格,idle 灰虛線,break 深紅
     BAND 2  pq(最大堆)| buff(冷卻中)| time
     BAND 3  這一步做了什麼 + 迴圈變數 + 公式檢查
   前綴 v621- 。
   ============================================================ */
(function () {
  const canvas = document.getElementById('v621-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('v621-step'), labelEl = document.getElementById('v621-label');
  const bPrev = document.getElementById('v621-prev'), bNext = document.getElementById('v621-next'),
        bPlay = document.getElementById('v621-play'), bReset = document.getElementById('v621-reset');

  const C = { paper:'#ffffff', ink:'#1f1f1f', dim:'#5a5a5a', off:'#cfcfcf',
    up:'#e3edf5', low:'#f6ead8',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424',
    good:'#d9e8c7', bad:'#f0d4d4', deep:'#a31d1d' };

  const MONO = '"JetBrains Mono", monospace', SANS = '"Noto Sans TC", sans-serif';
  const N = 2, CYC = N + 1;
  const TINT = { A: C.up, B: C.low };

  /* 時間軸 9 個位置(3 輪 × 3 格);第 9 格是第 3 輪 break 掉、不存在的那格 */
  const SLOTS = [
    { L:'B', a:3, b:2 }, { L:'A', a:3, b:2 }, { L:null },
    { L:'B', a:2, b:1 }, { L:'A', a:2, b:1 }, { L:null },
    { L:'B', a:1, b:0 }, { L:'A', a:1, b:0 },
  ];

  /* filled: 已填幾格;cur: 目前格(0-based,-1 無);pq / buff: [[字母, 次數]];nb: buff 裡剛放進的位置;
     phase: init | pop | idle | back | brk | end;cy: 第幾輪(1-based);i: for 迴圈的 i;act: BAND 3 動作 */
  const S = (filled, cur, pq, buff, nb, phase, cy, i, act, text) => ({ filled, cur, pq, buff, nb, phase, cy, i, act, text });

  const steps = [
    S(0, -1, [['B',3],['A',3]], [], -1, 'init', 0, -1,
      'freq:A = 3、B = 3 → 兩個非 0 次數 push 進最大堆',
      '<strong>INITIAL</strong> · <code>tasks = [A,A,A,B,B,B]</code>,<code>n = 2</code>:同一種任務之間至少隔 <code>2</code> 格。先數次數 <code>A=3, B=3</code>,把 <b>次數</b> 丟進<strong>最大堆</strong>。把時間切成一輪 <code>cycle = n + 1 = 3</code> 格:<b>一輪裡每種任務最多出現一次</b>,下一輪同一個任務一定已經冷卻完。'),

    S(1, 0, [['A',3]], [['B',2]], 0, 'pop', 1, 0,
      'pop B(3) → 放第 1 格,剩 2 進 buff',
      '<strong>第 1 輪 · i = 0 · t = 1</strong> · <code>cnt = pq.top() = 3</code>,pop;做一次後 <code>--cnt = 2 &gt; 0</code> → 放進 <code>buff</code> 等這輪結束再推回(兩個 3 平手,追字母版用 <code>pair</code> 時是 <code>B</code> 先出,只看次數結果一樣)。<b>B 這一輪不能再出現</b> —— 它不在 pq 裡,自然不會被拿到。'),
    S(2, 1, [], [['B',2],['A',2]], 1, 'pop', 1, 1,
      'pop A(3) → 放第 2 格,剩 2 進 buff',
      '<strong>第 1 輪 · i = 1 · t = 2</strong> · 堆頂換成 <code>A(3)</code>,pop → 剩 <code>2</code> 進 buff。現在 <strong>pq 空了</strong>,但這一輪還有 1 格。'),
    S(3, 2, [], [['B',2],['A',2]], -1, 'idle', 1, 2,
      'pq 空、buff 非空 → idle',
      '<strong>第 1 輪 · i = 2 · t = 3 · idle</strong> · <code>pq.empty()</code> 但 <code>buff</code> 不空 → 不 break。沒有任務可以拿,<b>但 <code>time++</code> 照樣執行</b> —— 這格就是 <strong>idle</strong>:A、B 都還在冷卻。'),
    S(3, -1, [['B',2],['A',2]], [['B',2],['A',2]], -1, 'back', 1, 3,
      '本輪結束 → buff 推回 pq',
      '<strong>第 1 輪結束 · time = 3</strong> · <code>i = 3 = cycle</code>,for 結束。<code>buff</code> 裡的 <code>[2,2]</code> 全部推回 pq。到下一輪開頭,<b>B 已經離上次隔了 2 格</b>(t=1 → 最早 t=4),可以再做。'),

    S(4, 3, [['A',2]], [['B',1]], 0, 'pop', 2, 0,
      'pop B(2) → 放第 4 格,剩 1 進 buff',
      '<strong>第 2 輪 · i = 0 · t = 4</strong> · <code>buff.clear()</code>,pop <code>B(2)</code> → 剩 <code>1</code> 進 buff。t=1 做過 B,現在 t=4,中間隔 2 格,<b>剛好合法</b>。'),
    S(5, 4, [], [['B',1],['A',1]], 1, 'pop', 2, 1,
      'pop A(2) → 放第 5 格,剩 1 進 buff',
      '<strong>第 2 輪 · i = 1 · t = 5</strong> · pop <code>A(2)</code> → 剩 <code>1</code> 進 buff。pq 又空了。'),
    S(6, 5, [], [['B',1],['A',1]], -1, 'idle', 2, 2,
      'pq 空、buff 非空 → idle',
      '<strong>第 2 輪 · i = 2 · t = 6 · idle</strong> · 跟第 1 輪一樣:<code>pq</code> 空、<code>buff = [1,1]</code> 不空 → 補一格 idle。<b>只有兩種任務卻要隔 2 格,每輪一定空一格。</b>'),
    S(6, -1, [['B',1],['A',1]], [['B',1],['A',1]], -1, 'back', 2, 3,
      '本輪結束 → buff 推回 pq',
      '<strong>第 2 輪結束 · time = 6</strong> · <code>buff = [1,1]</code> 推回 pq,各剩最後一次。'),

    S(7, 6, [['A',1]], [], -1, 'pop', 3, 0,
      'pop B(1) → 放第 7 格,剩 0 → 做完,不進 buff',
      '<strong>第 3 輪 · i = 0 · t = 7</strong> · pop <code>B(1)</code>,<code>--cnt = 0</code> → <b>B 全部做完,不進 buff</b>,以後也不必冷卻。'),
    S(8, 7, [], [], -1, 'pop', 3, 1,
      'pop A(1) → 放第 8 格,剩 0 → 做完,不進 buff',
      '<strong>第 3 輪 · i = 1 · t = 8</strong> · pop <code>A(1)</code>,也做完了。現在 <strong>pq 空、buff 也空</strong>。'),
    S(8, 8, [], [], -1, 'brk', 3, 2,
      'pq 空且 buff 空 → break,不補 idle',
      '<strong>第 3 輪 · i = 2 · break</strong> · <code>pq.empty() &amp;&amp; buff.empty()</code> → 直接 <code>break</code>,<b><code>time</code> 不加</b>。這就是和 idle 的差別:<b>後面沒有任務要等,就不用把這輪補滿</b>。buff 空,推回也沒東西;while 條件 <code>!pq.empty()</code> 不成立,結束。'),

    S(8, -1, [], [], -1, 'end', 3, -1,
      '完成 · return time = 8',
      '<strong>完成 · return 8</strong> · 排程 <code>B A idle | B A idle | B A</code>。公式檢查:<code>maxFreq = 3</code>,出現 3 次的有 <code>countMax = 2</code> 種 → <code>(3−1)·(n+1) + 2 = 2·3 + 2 = 8</code>,答案 <code>max(tasks.size() = 6, 8) = 8</code>,一致。時間 <code>O(T · log 26)</code> ≈ <code>O(T)</code>,空間 <code>O(26)</code>。'),
  ];

  let step = 0, timer = null;

  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||404; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function box(x,y,w,h,fill,stroke,lw,dash){ rr(x,y,w,h,5); ctx.fillStyle=fill; ctx.fill(); ctx.lineWidth=lw||1.4; if(dash) ctx.setLineDash(dash); ctx.strokeStyle=stroke; ctx.stroke(); ctx.setLineDash([]); }
  function txt(s,x,y,color,font,align,base){ ctx.fillStyle=color; ctx.font=font; ctx.textAlign=align||'center'; ctx.textBaseline=base||'middle'; ctx.fillText(s,x,y); }
  function head(s,x,y,color){ txt(s,x,y,color||C.dim,'600 12px '+MONO+', '+SANS,'left','alphabetic'); }
  function line(x1,y1,x2,y2,color,lw,dash){ ctx.strokeStyle=color; ctx.lineWidth=lw; if(dash) ctx.setLineDash(dash); ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); ctx.setLineDash([]); }

  const B1 = 18, B2 = 206, B3 = 316;   // band 標題基線

  /* 一個任務 chip:字母 + 次數 */
  function chip(x, y, cw, ch, L, cnt, mode){
    let fill = TINT[L], st = C.ink, lw = 1.4, tc = C.ink, dash = null;
    if (mode === 'new')  { st = C.curS; lw = 2.4; }
    if (mode === 'back') { fill = C.good; lw = 2; }
    if (mode === 'ghost'){ fill = C.paper; st = C.off; tc = C.off; dash = [3,3]; lw = 1.2; }
    box(x, y, cw, ch, fill, st, lw, dash);
    txt(L, x + 16, y + ch/2 + 1, tc, '700 15px '+MONO);
    line(x + 30, y + 7, x + 30, y + ch - 7, mode === 'ghost' ? C.off : C.dim, 1);
    txt('×' + cnt, x + 30 + (cw - 30)/2, y + ch/2 + 1, tc, '700 13px '+MONO);
  }

  function draw(){
    fit();
    const s = steps[step], w = canvas.clientWidth, H = canvas.clientHeight, PAD = 24;
    const innerW = w - 2*PAD;
    ctx.fillStyle = C.paper; ctx.fillRect(0,0,w,H); ctx.setLineDash([]);

    /* ---------- BAND 1 · 時間軸 ---------- */
    head('BAND 1 · 時間軸   紅框 = 目前這格　灰虛線 = idle　深紅 = break(不補格)', PAD, B1);
    const cg = 6, CG = 20;
    const cw = Math.min(58, (innerW - 6*cg - 2*CG) / 9), ch = 46;
    const tot = 9*cw + 6*cg + 2*CG, x0 = PAD + (innerW - tot)/2;
    const px = p => x0 + p*(cw + cg) + Math.floor(p/3)*(CG - cg);
    const brLbl = B1 + 26, brY = B1 + 36, tHead = B1 + 58, cTop = B1 + 72, cBot = cTop + ch;

    for (let c = 0; c < 3; c++) {
      const xa = px(3*c), xb = px(3*c + 2) + cw;
      const active = s.cy === c + 1 && s.phase !== 'end';
      const reached = s.phase !== 'init' && (s.cy > c || (s.cy === c + 1));
      const col = active ? C.curT : (reached ? C.ink : C.off);
      txt('第 ' + (c + 1) + ' 輪 (n+1 = 3 格)', (xa + xb)/2, brLbl, col, (active ? '700' : '600') + ' 11.5px '+SANS, 'center', 'alphabetic');
      ctx.strokeStyle = active ? C.curS : (reached ? C.dim : C.off); ctx.lineWidth = active ? 2 : 1.4;
      ctx.beginPath(); ctx.moveTo(xa, brY + 6); ctx.lineTo(xa, brY); ctx.lineTo(xb, brY); ctx.lineTo(xb, brY + 6); ctx.stroke();
    }

    for (let p = 0; p < 9; p++) {
      const x = px(p), isCur = p === s.cur;
      const exists = p < 8;
      txt(exists ? 't=' + (p + 1) : '(t=9)', x + cw/2, tHead, isCur ? C.curT : (p < s.filled ? C.dim : (!exists && (s.phase === 'brk' || s.phase === 'end') ? C.deep : C.off)),
          (isCur ? '700' : '600') + ' 11px '+MONO, 'center', 'alphabetic');
      if (!exists) {   // 第 3 輪的第 3 格:break 掉
        if (s.phase === 'brk') {
          box(x, cTop, cw, ch, C.bad, C.deep, 2.6);
          txt('break', x + cw/2, cTop + 18, C.deep, '700 12px '+MONO);
          txt('不補', x + cw/2, cTop + 34, C.deep, '700 10.5px '+SANS);
        } else if (s.phase === 'end') {
          box(x, cTop, cw, ch, C.paper, C.deep, 1.4, [4,3]);
          line(x + 12, cBot - 10, x + cw - 12, cTop + 10, C.deep, 1.8);
          line(x + 12, cTop + 10, x + cw - 12, cBot - 10, C.deep, 1.8);
        } else box(x, cTop, cw, ch, C.paper, C.off, 1.1, [3,3]);
        continue;
      }
      if (p >= s.filled) { box(x, cTop, cw, ch, C.paper, C.off, 1.1, [3,3]); continue; }
      const sl = SLOTS[p];
      if (sl.L) {
        box(x, cTop, cw, ch, TINT[sl.L], isCur ? C.curS : C.ink, isCur ? 2.8 : 1.4);
        txt(sl.L, x + cw/2, cTop + 18, isCur ? C.curT : C.ink, '700 17px '+MONO);
        txt(sl.a + '→' + sl.b, x + cw/2, cTop + 35, isCur ? C.curT : C.dim, '600 10.5px '+MONO);
      } else {
        box(x, cTop, cw, ch, C.paper, isCur ? C.curS : C.off, isCur ? 2.8 : 1.8, isCur ? null : [4,3]);
        ctx.save(); rr(x + 2, cTop + 2, cw - 4, ch - 4, 4); ctx.clip();
        ctx.strokeStyle = C.off; ctx.lineWidth = 1;
        for (let k = -ch; k < cw; k += 9) { ctx.beginPath(); ctx.moveTo(x + k, cBot); ctx.lineTo(x + k + ch, cTop); ctx.stroke(); }
        ctx.restore();
        rr(x + cw/2 - 17, cTop + ch/2 - 9, 34, 18, 4); ctx.fillStyle = C.paper; ctx.fill();
        txt('idle', x + cw/2, cTop + ch/2 + 1, isCur ? C.curT : C.dim, '700 12px '+MONO);
      }
    }

    // 冷卻提示(時間軸下方)
    const nY = cBot + 16;
    if (s.phase === 'pop' && s.cur >= 0) {
      const sl = SLOTS[s.cur], a = px(s.cur) + cw/2;
      if (sl.b > 0) {
        const tgt = s.cur + CYC, b = px(tgt) + cw/2;
        ctx.strokeStyle = C.curS; ctx.lineWidth = 1.8; ctx.setLineDash([4,3]);
        ctx.beginPath(); ctx.moveTo(a, cBot + 4); ctx.lineTo(a, nY); ctx.lineTo(b, nY); ctx.lineTo(b, cBot + 4); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = C.curS; ctx.beginPath(); ctx.moveTo(b, cBot + 3); ctx.lineTo(b - 5, cBot + 10); ctx.lineTo(b + 5, cBot + 10); ctx.closePath(); ctx.fill();
        txt(sl.L + ' 在 t=' + (s.cur + 1) + ' 做過 → 冷卻 n = 2 格 → 最早 t=' + (tgt + 1), (a + b)/2, nY + 16, C.curT, '700 11.5px '+MONO+', '+SANS);
      } else {
        txt(sl.L + ' 剩 0 次 → 做完,不用再冷卻', a, nY + 8, C.ink, '700 11.5px '+SANS, sl.L === 'A' ? 'right' : 'left', 'middle');
      }
    } else if (s.phase === 'idle') {
      const a = px(s.cur);
      line(a + cw/2, cBot + 4, a + cw/2, nY + 1, C.curS, 1.6);
      const lft = s.cur < 4;
      txt('pq 空:A、B 都在 buff 冷卻 → 只能 idle,time 照樣 +1', a + cw/2 + (lft ? 8 : -8), nY + 8, C.curT, '700 11.5px '+SANS, lft ? 'left' : 'right', 'middle');
    } else if (s.phase === 'brk') {
      const a = px(8) + cw;
      txt('pq 空且 buff 空 → 沒人要等,這格不存在', a, nY + 8, C.deep, '700 11.5px '+SANS, 'right', 'middle');
    } else if (s.phase === 'back') {
      const a = px(3*s.cy) + cw/2;
      txt('第 ' + (s.cy + 1) + ' 輪從 t=' + (3*s.cy + 1) + ' 開始:上一輪的任務都已隔滿 2 格', a, nY + 8, C.ink, '700 11.5px '+SANS, 'center', 'middle');
    } else if (s.phase === 'init') {
      txt('規則:同一任務兩次之間 ≥ n = 2 格 → 每輪 3 格裡,每種任務最多一次', PAD + innerW/2, nY + 8, C.dim, '600 11.5px '+SANS, 'center', 'middle');
    } else {
      txt('排程:B A idle | B A idle | B A  →  共 8 格', PAD + innerW/2, nY + 8, C.ink, '700 12px '+MONO+', '+SANS, 'center', 'middle');
    }

    /* ---------- BAND 2 · pq | buff | time ---------- */
    head('BAND 2 · 狀態   pq = 最大堆(次數大的先)　buff = 這輪做過、冷卻中', PAD, B2);
    const by = B2 + 12, bh = 72, bg = 14;
    const timeW = Math.min(130, innerW * 0.22);
    const pw = (innerW - timeW - 2*bg) / 2;
    const pX = PAD, fX = PAD + pw + bg, tX = fX + pw + bg;
    const chW = Math.min(84, (pw - 36) / 2), chH = 32, chY = by + 30;

    // pq
    box(pX, by, pw, bh, C.paper, C.ink, 1.4);
    txt('pq  (size = ' + s.pq.length + ')', pX + 12, by + 16, C.ink, '700 12px '+MONO, 'left', 'middle');
    if (s.pq.length) txt('← top', pX + pw - 12, by + 16, C.dim, '600 10.5px '+MONO, 'right', 'middle');
    if (s.pq.length === 0) {
      box(pX + 12, chY, pw - 24, chH, C.paper, C.off, 1.2, [3,3]);
      txt(s.phase === 'end' || s.phase === 'brk' ? '空 · 全部做完' : '空', pX + pw/2, chY + chH/2 + 1, C.dim, '600 12px '+SANS);
    } else {
      s.pq.forEach((e, k) => chip(pX + 12 + k*(chW + 12), chY, chW, chH, e[0], e[1], s.phase === 'back' ? 'back' : ''));
    }
    // buff
    const coolAct = s.buff.length > 0 && s.phase !== 'back';
    box(fX, by, pw, bh, C.paper, coolAct ? C.curS : C.ink, coolAct ? 1.8 : 1.4);
    txt('buff', fX + 12, by + 16, C.ink, '700 12px '+MONO, 'left', 'middle');
    txt(s.phase === 'back' ? '→ 全部推回 pq' : (s.buff.length ? '冷卻中' : (s.phase === 'init' ? '(還沒開始)' : '(這輪沒有要推回的)')), fX + pw - 12, by + 16,
        s.phase === 'back' ? C.ink : (s.buff.length ? C.curT : C.dim), '700 11px '+SANS, 'right', 'middle');
    if (s.buff.length === 0) {
      box(fX + 12, chY, pw - 24, chH, C.paper, C.off, 1.2, [3,3]);
      txt(s.phase === 'init' ? '每輪開頭 clear()' : '空', fX + pw/2, chY + chH/2 + 1, C.dim, '600 12px '+SANS);
    } else {
      s.buff.forEach((e, k) => chip(fX + 12 + k*(chW + 12), chY, chW, chH, e[0], e[1],
        s.phase === 'back' ? 'ghost' : (k === s.nb ? 'new' : '')));
    }
    // time
    const tval = s.filled;
    const tFin = s.phase === 'end';
    box(tX, by, timeW, bh, tFin ? C.good : C.low, C.ink, tFin ? 2.2 : 1.4);
    txt('time', tX + timeW/2, by + 18, C.dim, '600 11px '+MONO, 'center', 'middle');
    txt(String(tval), tX + timeW/2, by + 47, C.ink, '700 24px '+MONO, 'center', 'middle');

    /* ---------- BAND 3 · 這一步 ---------- */
    head('BAND 3 · 這一步', PAD, B3);
    const ay = B3 + 12, ah = 34;
    let aF = C.cur, aS = C.curS, aT = C.curT, aLw = 2;
    if (s.phase === 'init' || s.phase === 'back') { aF = C.good; aS = C.ink; aT = C.ink; aLw = 1.6; }
    if (s.phase === 'idle') { aF = C.paper; aS = C.dim; aT = C.ink; aLw = 1.6; }
    if (s.phase === 'brk')  { aF = C.bad; aS = C.deep; aT = C.deep; aLw = 2.4; }
    if (s.phase === 'end')  { aF = C.good; aS = C.ink; aT = C.ink; aLw = 2.2; }
    box(PAD, ay, innerW, ah, aF, aS, aLw, s.phase === 'idle' ? [5,3] : null);
    txt(s.act, PAD + innerW/2, ay + ah/2 + 1, aT, '700 13px '+MONO+', '+SANS);

    const ry = ay + ah + 12, rh = 32, lw2 = Math.min(200, innerW * 0.34);
    // 迴圈變數
    let lv;
    if (s.phase === 'init') lv = 'cycle = n + 1 = 3';
    else if (s.phase === 'end') lv = 'while (!pq.empty()) 不成立';
    else if (s.phase === 'back') lv = '輪 ' + s.cy + ' · i = 3 = cycle → 結束';
    else lv = '輪 ' + s.cy + ' · i = ' + s.i + ' / cycle = 3';
    box(PAD, ry, lw2, rh, C.paper, C.ink, 1.2);
    txt(lv, PAD + lw2/2, ry + rh/2 + 1, C.ink, '700 11.5px '+MONO+', '+SANS);
    // 公式檢查
    const fx = PAD + lw2 + 12, fw = innerW - lw2 - 12;
    if (s.phase === 'end') {
      box(fx, ry, fw, rh, C.good, C.ink, 2);
      txt('(3−1)·3 + 2 = 8 · max(len = 6, 8) = 8 ✓', fx + fw/2, ry + rh/2 + 1, C.ink, '700 12px '+MONO+', '+SANS);
    } else {
      box(fx, ry, fw, rh, C.paper, C.off, 1.2, [3,3]);
      txt('公式:(maxFreq − 1)·(n + 1) + countMax,最後一步驗算', fx + fw/2, ry + rh/2 + 1, C.dim, '600 11.5px '+MONO+', '+SANS);
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
