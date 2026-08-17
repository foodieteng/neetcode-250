/* ============================================================
   P981 · Time Based Key-Value Store — upper_bound 後退一格 · viz
   要的是「最後一個 timestamp <= 查詢值」。把它翻成反面條件「timestamp > 查詢值」,
   TF 帶就成 F F T,通用模板收斂到「第一個 T」= upper_bound,
   而答案是「最後一個 F」= l - 1。
     ① pred 必須用嚴格 >(用 >= 會變 lower_bound,精確命中時退錯一格)
     ② l == 0 必須擋(否則讀 v[-1])
   例 key="foo" 有 (1,"bar") (4,"bar2") (7,"bar3"),查 timestamp=5 → "bar2"(2 輪)。
     BAND 1  該 key 的 vector(上排 timestamp / value,下排 > 5 ? 的 TF)
     BAND 2  本輪判斷
     BAND 3  這一步做了什麼決定
   ============================================================ */
(function () {
  const canvas = document.getElementById('viz-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('viz-step'), labelEl = document.getElementById('viz-label');
  const bPrev = document.getElementById('viz-prev'), bNext = document.getElementById('viz-next'),
        bPlay = document.getElementById('viz-play'), bReset = document.getElementById('viz-reset');

  const C = { paper:'#ffffff', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf',
    win:'#e3edf5', winS:'#4478c0', winT:'#2f5f9e',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424',
    grn:'#d9e8c7', grnS:'#5fa866', grnT:'#3f7a3a',
    no:'#f0d4d4', noS:'#b06a6a', noT:'#8a4444',
    off:'#f0f0ec', offS:'#cfcfcf', offT:'#a3a099', coral:'#cf3535' };

  const TS  = [1, 4, 7];
  const VAL = ['bar', 'bar2', 'bar3'];
  const QUERY = 5;
  const N = TS.length;

  // known = 已經被 pred 測過的索引(才顯示 F/T,避免一開始就攤牌)
  // ans   = 最終答案的索引;stepBack = 這步要畫「退一格」的箭頭
  const steps = [
    { L:0, R:3, mid:-1, known:[], ans:-1, stepBack:false, act:'intro',
      eq:'left = 0 · right = n = 3 → 候選 [0, 3)',
      note:'要「最後一個 ts ≤ 5」→ 先找「第一個 ts > 5」,再退一格',
      text:'<strong>INITIAL</strong> · 這個 key 存了三筆,timestamp 遞增所以 vector 天生有序。目標是<strong>最後一個 timestamp ≤ 5</strong> —— 直接想收縮條件容易錯,先把它<strong>翻成反面</strong>:找第一個 <code>timestamp &gt; 5</code>。' },

    { L:0, R:3, mid:1, known:[1], ans:-1, stepBack:false, act:'probe-f',
      eq:'mid = 1 → v[1].first = 4 > 5 ?  否(F)',
      note:'pred 不成立 → 這格及其左邊都還不夠大 → left = mid + 1',
      text:'<strong>Round 1 · 探點</strong> · <code>v[1].first = 4</code>,問 <code>4 &gt; 5</code> 嗎?<strong>否</strong> → 它落在 F 側,<code>left = mid + 1 = 2</code>。' },

    { L:2, R:3, mid:1, known:[1], ans:-1, stepBack:false, act:'shrink-l',
      eq:'left = mid + 1 = 2 → 候選縮為 [2, 3)',
      note:'F 側的格子連 mid 一起跨過(和模板一致)',
      text:'<strong>Round 1 · 收縮</strong> · <code>left = 2</code>。注意 index 1 <strong>雖然被移出候選,卻正是最終答案</strong> —— 因為我們找的是分界線,不是分界線本身那一格。' },

    { L:2, R:3, mid:2, known:[1,2], ans:-1, stepBack:false, act:'probe-t',
      eq:'mid = 2 → v[2].first = 7 > 5 ?  是(T)',
      note:'pred 成立 → mid 可能就是分界 → right = mid(保留)',
      text:'<strong>Round 2 · 探點</strong> · <code>v[2].first = 7 &gt; 5</code>,<strong>是</strong> → 它落在 T 側。7 可能就是「第一個超過 5 的」,所以 <code>right = mid = 2</code> 保留它。' },

    { L:2, R:2, mid:-1, known:[1,2], ans:-1, stepBack:false, act:'converge',
      eq:'right = mid = 2 → left == right == 2,收斂',
      note:'l = 2 = 第一個 ts > 5 的位置(upper_bound)',
      text:'<strong>收斂</strong> · <code>left == right == 2</code>,迴圈結束。<code>l = 2</code> 的意思是「<strong>第一個 timestamp &gt; 5 的位置</strong>」—— 但那不是答案,它太大了。' },

    { L:2, R:2, mid:-1, known:[0,1,2], ans:1, stepBack:true, act:'stepback',
      eq:'l = 2 > 0 → 答案取 v[l − 1] = v[1]',
      note:'l 是第一個 T;要的是最後一個 F → 退一格。l == 0 時代表沒有,回 ""',
      text:'<strong>退一格</strong> · 整條 TF 帶是 <code>F F T</code>。<code>l</code> 停在第一個 <strong>T</strong>(index 2),而我們要的是最後一個 <strong>F</strong>(index 1)→ <code>v[l − 1]</code>。若 <code>l</code> 剛好是 0,代表<strong>連一個 F 都沒有</strong>(全部 timestamp 都比 5 大),那就回 <code>""</code>。' },

    { L:2, R:2, mid:-1, known:[0,1,2], ans:1, stepBack:true, act:'done',
      eq:'return v[1].second = "bar2"',
      note:'共 2 輪二分;set 是 O(1)、get 是 O(log n)',
      text:'<strong>完成</strong> · 回傳 <code>v[1].second = <strong>"bar2"</strong></code>。timestamp 5 時最新的那筆確實是 4 時寫入的 <code>bar2</code>。整個 <code>get</code> 只跑了 <strong>2 輪</strong>二分。' },
  ];

  let step = 0, timer = null;

  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||396; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function triUp(cx,cy,col){ ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx-6,cy+8); ctx.lineTo(cx+6,cy+8); ctx.closePath(); ctx.fillStyle=col; ctx.fill(); }

  function draw(){
    fit();
    const s = steps[step], w = canvas.clientWidth, PAD = 34;
    const done = s.act === 'done';
    ctx.fillStyle = C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);

    const cw = Math.min(120, (w - 2*PAD) / N - 14);
    const gap = Math.min(44, (w - 2*PAD - N*cw) / (N - 1));
    const x0 = (w - (N*cw + (N-1)*gap)) / 2;
    const edge = k => x0 + k * (cw + gap);
    const rightEdge = k => (k >= N ? edge(N-1) + cw : edge(k));
    const cx = k => edge(k) + cw/2;

    const CELL_TOP = 74, CELL_H = 54;
    const CELL_BOT = CELL_TOP + CELL_H;         // 128
    const TF_TOP = CELL_BOT + 40, TF_H = 34;    // 168 —— 與上排隔 40px
    const TF_BOT = TF_TOP + TF_H;               // 202

    // ── BAND 1 ──
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · dict["foo"] 的 vector(藍=候選 · 紅=mid · 綠=答案)', PAD, 16);
    ctx.textAlign='right'; ctx.font='700 12.5px "JetBrains Mono", monospace'; ctx.fillStyle= done ? C.grnT : C.text;
    ctx.fillText('get("foo", ' + QUERY + ')', w - PAD, 16);

    // 候選區間括號
    const BR_Y = 40;
    if (s.L < s.R) {
      const x1 = edge(s.L), x2 = rightEdge(s.R);
      ctx.strokeStyle = C.winS; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x1, BR_Y + 8); ctx.lineTo(x1, BR_Y); ctx.lineTo(x2, BR_Y); ctx.lineTo(x2, BR_Y + 8);
      ctx.stroke();
      ctx.fillStyle = C.winT; ctx.font='700 11px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='bottom';
      ctx.fillText('候選 [ ' + s.L + ', ' + s.R + ' )', (x1+x2)/2, BR_Y - 4);
    } else {
      const x1 = rightEdge(s.L);
      ctx.strokeStyle = done ? C.grnS : C.offS; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x1, BR_Y); ctx.lineTo(x1, BR_Y + 8); ctx.stroke();
      ctx.fillStyle = done ? C.grnT : C.offT; ctx.font='700 11px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='bottom';
      ctx.fillText('l = ' + s.L + '(第一個 ts > ' + QUERY + ')', x1, BR_Y - 4);
    }

    // 上排:timestamp + value(同一格兩行,不再另開一列)
    for (let k = 0; k < N; k++) {
      const inWin = k >= s.L && k < s.R;
      const isMid = k === s.mid;
      const isAns = s.ans === k;
      let bg = C.off, bd = C.offS, tx = C.offT;
      if (inWin) { bg = C.win; bd = C.winS; tx = C.winT; }
      if (isMid) { bg = C.cur; bd = C.curS; tx = C.curT; }
      if (isAns) { bg = C.grn; bd = C.grnS; tx = C.grnT; }
      rr(edge(k), CELL_TOP, cw, CELL_H, 5);
      ctx.fillStyle = bg; ctx.fill();
      ctx.lineWidth = (isMid || isAns) ? 3 : 1.6; ctx.strokeStyle = bd; ctx.stroke();
      ctx.textAlign='center';
      ctx.fillStyle = tx; ctx.font='700 16px "JetBrains Mono", monospace'; ctx.textBaseline='middle';
      ctx.fillText('ts ' + TS[k], cx(k), CELL_TOP + 19);
      ctx.font='600 12px "JetBrains Mono", monospace';
      ctx.fillText('"' + VAL[k] + '"', cx(k), CELL_TOP + 39);
      // 索引小字
      ctx.fillStyle = inWin ? C.winT : C.offT;
      ctx.font='600 10px "JetBrains Mono", monospace'; ctx.textBaseline='bottom';
      ctx.fillText('[' + k + ']', cx(k), CELL_TOP - 4);
    }

    // 下排:> QUERY ? 的 TF 帶(只顯示測過的)
    ctx.textAlign='left'; ctx.textBaseline='middle';
    ctx.font='600 11px "JetBrains Mono", monospace'; ctx.fillStyle = C.dim;
    ctx.fillText('ts > ' + QUERY + ' ?', PAD, TF_TOP - 18);
    for (let k = 0; k < N; k++) {
      const seen = s.known.indexOf(k) >= 0;
      const isT = TS[k] > QUERY;
      let bg = '#fafaf6', bd = C.grid, tx = C.offT, txt = '·';
      if (seen) {
        txt = isT ? 'T' : 'F';
        if (isT) { bg = C.no;  bd = C.noS;  tx = C.noT; }
        else     { bg = C.grn; bd = C.grnS; tx = C.grnT; }
      }
      rr(edge(k), TF_TOP, cw, TF_H, 5);
      ctx.fillStyle = bg; ctx.fill();
      ctx.lineWidth = 1.5; ctx.strokeStyle = bd; ctx.stroke();
      ctx.fillStyle = tx; ctx.font='700 14px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(txt, cx(k), TF_TOP + TF_H/2);
    }

    // 指標列 A:mid
    const MID_Y = TF_BOT + 8;
    if (s.mid >= 0) {
      triUp(cx(s.mid), MID_Y, C.curS);
      ctx.fillStyle = C.curT; ctx.font='700 11px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='top';
      ctx.fillText('mid=' + s.mid, cx(s.mid), MID_Y + 10);
    }

    // 指標列 B:l / r,或「退一格」的箭頭
    const LR_Y = TF_BOT + 42;
    ctx.font='700 11px "JetBrains Mono", monospace'; ctx.textBaseline='top'; ctx.textAlign='center';
    if (s.stepBack) {
      // 綠色箭頭:從 l 退到 l−1
      const xFrom = (s.L >= N ? rightEdge(N) : cx(s.L)), xTo = cx(s.ans);
      const ay = LR_Y + 6;
      ctx.strokeStyle = C.grnS; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(xFrom, ay); ctx.lineTo(xTo + 10, ay); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(xTo, ay); ctx.lineTo(xTo + 10, ay - 5); ctx.lineTo(xTo + 10, ay + 5);
      ctx.closePath(); ctx.fillStyle = C.grnS; ctx.fill();
      // 標籤放在箭頭「上方」,避免和下面的 BAND 2 標題落在同一條線上
      ctx.fillStyle = C.grnT; ctx.font='700 11.5px "JetBrains Mono", monospace';
      ctx.textBaseline='bottom';
      ctx.fillText('l − 1 = ' + s.ans + '(最後一個 F)', (xFrom + xTo) / 2, ay - 8);
    } else if (s.L === s.R) {
      ctx.fillStyle = C.winT;
      ctx.fillText('l = r = ' + s.L, (s.L >= N ? rightEdge(N) : cx(s.L)), LR_Y);
    } else {
      ctx.fillStyle = C.winT; ctx.fillText('l=' + s.L, cx(s.L), LR_Y);
      ctx.fillStyle = C.winT; ctx.fillText('r=' + s.R, (s.R >= N ? rightEdge(N) : cx(s.R)), LR_Y);
    }

    // ── BAND 2 ──
    const B2 = 268;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 本輪判斷', PAD, B2);
    rr(PAD, B2 + 10, w - 2*PAD, 42, 6);
    const isT = s.act === 'probe-t', isF = s.act === 'probe-f', back = s.act === 'stepback';
    ctx.fillStyle = done ? C.grn : (isT ? C.no : (isF ? C.grn : (back ? C.grn : (s.act === 'intro' ? '#fafaf6' : C.win))));
    ctx.fill();
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = done ? C.grnS : (isT ? C.noS : (isF ? C.grnS : (back ? C.grnS : (s.act === 'intro' ? C.grid : C.winS))));
    ctx.stroke();
    ctx.fillStyle = done ? C.grnT : (isT ? C.noT : (isF ? C.grnT : (back ? C.grnT : C.winT)));
    ctx.font='700 13px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(s.eq, w/2, B2 + 31);

    // ── BAND 3 ──
    const B3 = 340;
    ctx.fillStyle=C.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 找第一個 T(upper_bound),答案取它前面那格(l − 1)', PAD, B3);
    rr(PAD, B3 + 10, w - 2*PAD, 40, 6);
    ctx.fillStyle = done ? C.grn : '#fafaf6'; ctx.fill();
    ctx.lineWidth = 1.6; ctx.strokeStyle = done ? C.grnS : C.grid; ctx.stroke();
    ctx.fillStyle = done ? C.grnT : C.text;
    ctx.font='600 12.5px "Noto Sans TC", sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(s.note, w/2, B3 + 30);
  }

  function update(){ if(stepEl) stepEl.textContent=String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0'); if(labelEl) labelEl.innerHTML=steps[step].text; draw(); }
  function next(){ if(step<steps.length-1){step++;update();}else stop(); }
  function prev(){ if(step>0){step--;update();} }
  function reset(){ stop(); step=0; update(); }
  function play(){ if(timer){stop();return;} bPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){stop();return;} next(); },1900); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} if(bPlay) bPlay.textContent='Play'; }
  bPrev&&bPrev.addEventListener('click',prev); bNext&&bNext.addEventListener('click',next); bPlay&&bPlay.addEventListener('click',play); bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();}); if(window.ResizeObserver){ new ResizeObserver(()=>{fit();draw();}).observe(canvas); }
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw); fit(); update();
})();
