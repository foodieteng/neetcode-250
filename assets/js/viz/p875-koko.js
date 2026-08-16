/* ============================================================
   P875 · Koko Eating Bananas — 答案二分(值域二分)· viz
   二分的不是索引,是「答案本身」:候選速度 k = 1 … max(piles)。
   把 pred 寫成 check(k) = 「以速度 k 能在 h 小時內吃完嗎」= getTime(k) <= h。
   k 越大越容易吃完 ⇒ check 沿著 k 單調由 F 變 T ⇒ 整條候選帶仍是 F F F T T T,
   通用模板一字不改,只是把 nums[m] 比大小換成 check(m)。
   例 piles=[3,6,7,11], h=8 → k=1,2,3 太慢(F),k>=4 可行(T),答案 4。
     BAND 1  候選速度 k(藍=目前區間 · 紅=mid · 綠=答案 · 灰=已排除)+ 每個 k 的所需時數
     BAND 2  getTime(mid) 的逐堆計算
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
    ok:'#d9e8c7', okS:'#5fa866', okT:'#3f7a3a',
    no:'#f0d4d4', noS:'#b06a6a', noT:'#8a4444',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424',
    grn:'#d9e8c7', grnS:'#5fa866', grnT:'#3f7a3a',
    off:'#f0f0ec', offS:'#cfcfcf', offT:'#a3a099', coral:'#cf3535' };

  const PILES = [3, 6, 7, 11], H = 8, KMAX = 11;
  // 各 k 的所需時數(已用整數 ceil 實算驗證)
  const T = { 1:27, 2:15, 3:10, 4:8, 5:8, 6:6, 7:5, 8:5, 9:5, 10:5, 11:4 };

  // known = 已經被 check 過的 k(才顯示時數,避免暴雷整條帶)
  const steps = [
    { L:1, R:12, mid:-1, known:[], ans:-1, act:'intro',
      eq:'left = 1 · right = max(piles) + 1 = 12 → 候選速度 [1, 12)',
      note:'二分的不是索引,是「速度 k」這個答案本身',
      text:'<strong>INITIAL</strong> · 候選答案是速度 <code>k = 1 … 11</code>。左界 1(至少要吃 1 根),右界 <code>max(piles)+1</code> —— 速度到 11 就一定一小時一堆,再快也沒意義。<strong>值域也用右開,所以 max 要 +1 才取得到。</strong>' },

    { L:1, R:12, mid:6, known:[6], ans:-1, act:'probe',
      eq:'mid = 6 → getTime(6) = 1+1+2+2 = 6 ≤ 8 ?  是(可行)',
      note:'check(k) 成立 → 也許還能更慢 → right = mid(保留 mid)',
      text:'<strong>Round 1 · 試 k=6</strong> · 逐堆算 <code>⌈3/6⌉+⌈6/6⌉+⌈7/6⌉+⌈11/6⌉ = 1+1+2+2 = 6</code> 小時 ≤ 8 → <strong>來得及</strong>。但題目要<strong>最小</strong>的 k,所以還要往左找。' },

    { L:1, R:6, mid:6, known:[6], ans:-1, act:'shrink-r',
      eq:'right = mid = 6 → 候選縮為 [1, 6)',
      note:'可行的 mid 要保留 —— 它可能就是最小可行速度',
      text:'<strong>Round 1 · 收縮</strong> · <code>right = 6</code>,<strong>不減 1</strong>。因為 6 本身仍可能是答案(只是還沒確認有沒有更小的)。' },

    { L:1, R:6, mid:3, known:[6,3], ans:-1, act:'probe-bad',
      eq:'mid = 3 → getTime(3) = 1+2+3+4 = 10 ≤ 8 ?  否(太慢)',
      note:'check 不成立 → 太慢了,連 mid 一起丟 → left = mid + 1',
      text:'<strong>Round 2 · 試 k=3</strong> · 需要 <code>1+2+3+4 = 10</code> 小時 &gt; 8 → <strong>來不及</strong>。3 以及比 3 更慢的速度全部出局。' },

    { L:4, R:6, mid:3, known:[6,3], ans:-1, act:'shrink-l',
      eq:'left = mid + 1 = 4 → 候選縮為 [4, 6)',
      note:'不可行的 mid 已被證明不行,一定要 +1 跨過',
      text:'<strong>Round 2 · 收縮</strong> · <code>left = 4</code>。<code>k=3</code> 已被 check 明確否定,不留。' },

    { L:4, R:6, mid:5, known:[6,3,5], ans:-1, act:'probe',
      eq:'mid = 5 → getTime(5) = 1+2+2+3 = 8 ≤ 8 ?  是(剛好)',
      note:'剛好等於 h 也算可行 —— 所以判斷式是 ≤ 而不是 <',
      text:'<strong>Round 3 · 試 k=5</strong> · 需要正好 <code>8</code> 小時,<strong>等於 h 也算來得及</strong>。這就是判斷式必須寫 <code>≤ h</code> 的原因。' },

    { L:4, R:5, mid:5, known:[6,3,5], ans:-1, act:'shrink-r',
      eq:'right = mid = 5 → 候選縮為 [4, 5)',
      note:'還是往左找,看看有沒有更小的可行速度',
      text:'<strong>Round 3 · 收縮</strong> · <code>right = 5</code>,只剩 <code>k = 4</code> 這一個候選還沒試。' },

    { L:4, R:5, mid:4, known:[6,3,5,4], ans:-1, act:'probe',
      eq:'mid = 4 → getTime(4) = 1+2+2+3 = 8 ≤ 8 ?  是(可行)',
      note:'和 k=5 一樣是 8 小時 —— 慢一點但沒有變更久',
      text:'<strong>Round 4 · 試 k=4</strong> · 同樣 <code>8</code> 小時(<code>⌈7/4⌉</code> 與 <code>⌈7/5⌉</code> 都是 2,沒有變差)→ 可行,繼續往左壓。' },

    { L:4, R:4, mid:-1, known:[6,3,5,4], ans:-1, act:'converge',
      eq:'right = mid = 4 → left == right == 4,區間空',
      note:'left < right 不成立 → 跳出迴圈',
      text:'<strong>Round 4 · 收縮</strong> · <code>right = 4</code>,此時 <code>left == right == 4</code>,迴圈結束。' },

    { L:4, R:4, mid:-1, known:[6,3,5,4], ans:4, act:'done',
      eq:'return left = 4     // 第一個可行的速度,不需額外檢查',
      note:'F F F T T T:l 停在第一個 T = 最小可行速度',
      text:'<strong>完成</strong> · 回傳 <strong>4</strong>。整條候選帶其實是 <code>F F F T T T T T T T T</code>(k=1,2,3 太慢),模板收斂到的 <code>l</code> 正是<strong>第一個 T = 最小可行速度</strong>,不需要任何額外驗證。' },
  ];

  let step = 0, timer = null;

  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||404; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function triUp(cx,cy,col){ ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx-6,cy+8); ctx.lineTo(cx+6,cy+8); ctx.closePath(); ctx.fillStyle=col; ctx.fill(); }

  function draw(){
    fit();
    const s = steps[step], w = canvas.clientWidth, PAD = 34, n = KMAX;
    const done = s.act === 'done';
    ctx.fillStyle = C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);

    const LBL = 24;                                          // 左側留給 k / t 兩個列標籤
    const avail = w - 2*PAD - LBL;
    const cw = Math.min(64, avail / n - 10);
    const gap = Math.min(24, (avail - n*cw) / (n - 1));
    const x0 = PAD + LBL + Math.max(0, (avail - (n*cw + (n-1)*gap)) / 2);
    const edge = k => x0 + (k - 1) * (cw + gap);        // k 是速度 1..KMAX
    const rightEdge = k => (k > n ? edge(n) + cw : edge(k));
    const cx = k => edge(k) + cw/2;

    const K_TOP = 82, K_H = 42;                 // 速度那一排
    const K_BOT = K_TOP + K_H;                  // 124
    const T_TOP = K_BOT + 40, T_H = 36;         // 時數那一排 —— 與上排隔 40px
    const T_BOT = T_TOP + T_H;                  // 200

    // ── BAND 1 ──
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 候選速度 k(藍=區間 · 紅=mid · 綠=答案 · 灰=排除)', PAD, 16);
    ctx.textAlign='right'; ctx.font='700 12.5px "JetBrains Mono", monospace'; ctx.fillStyle= done ? C.grnT : C.text;
    ctx.fillText('piles=[3,6,7,11]  h=' + H, w - PAD, 16);

    // 區間括號
    const BR_Y = 36;
    if (s.L < s.R) {
      const x1 = edge(s.L), x2 = rightEdge(s.R);
      ctx.strokeStyle = C.winS; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x1, BR_Y + 8); ctx.lineTo(x1, BR_Y); ctx.lineTo(x2, BR_Y); ctx.lineTo(x2, BR_Y + 8);
      ctx.stroke();
      ctx.fillStyle = C.winT; ctx.font='700 11px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='bottom';
      ctx.fillText('[ ' + s.L + ', ' + s.R + ' )  共 ' + (s.R - s.L) + ' 個候選速度', (x1+x2)/2, BR_Y - 3);
    } else {
      const x1 = edge(s.L);
      ctx.strokeStyle = done ? C.grnS : C.offS; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x1, BR_Y); ctx.lineTo(x1, BR_Y + 8); ctx.stroke();
      ctx.fillStyle = done ? C.grnT : C.offT; ctx.font='700 11px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='bottom';
      ctx.fillText(done ? ('最小可行速度 = ' + s.ans) : '區間空 → 停', x1 + cw/2, BR_Y - 3);
    }

    // 速度格
    ctx.font='600 11px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='middle';
    ctx.fillStyle = C.dim; ctx.fillText('k', PAD - 8, K_TOP + K_H/2);
    for (let k = 1; k <= n; k++) {
      const inWin = k >= s.L && k < s.R;
      const isMid = k === s.mid;
      const isAns = done && k === s.ans;
      let bg = C.off, bd = C.offS, tx = C.offT;
      if (inWin) { bg = C.win; bd = C.winS; tx = C.winT; }
      if (isMid) { bg = C.cur; bd = C.curS; tx = C.curT; }
      if (isAns) { bg = C.grn; bd = C.grnS; tx = C.grnT; }
      rr(edge(k), K_TOP, cw, K_H, 5);
      ctx.fillStyle = bg; ctx.fill();
      ctx.lineWidth = (isMid || isAns) ? 3 : 1.5; ctx.strokeStyle = bd; ctx.stroke();
      ctx.fillStyle = tx; ctx.font='700 14px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(k), cx(k), K_TOP + K_H/2);
    }

    // 時數格(只顯示已被 check 過的 k)
    ctx.font='600 11px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='middle';
    ctx.fillStyle = C.dim; ctx.fillText('t', PAD - 8, T_TOP + T_H/2);
    for (let k = 1; k <= n; k++) {
      const seen = s.known.indexOf(k) >= 0;
      const feasible = T[k] <= H;
      let bg = '#fafaf6', bd = C.grid, tx = C.offT, txt = '·';
      if (seen) {
        txt = String(T[k]);
        if (feasible) { bg = C.ok; bd = C.okS; tx = C.okT; }
        else          { bg = C.no; bd = C.noS; tx = C.noT; }
      }
      rr(edge(k), T_TOP, cw, T_H, 5);
      ctx.fillStyle = bg; ctx.fill();
      ctx.lineWidth = 1.5; ctx.strokeStyle = bd; ctx.stroke();
      ctx.fillStyle = tx; ctx.font='700 13px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(txt, cx(k), T_TOP + T_H/2);
    }
    ctx.textAlign='right'; ctx.textBaseline='middle';
    ctx.font='600 10.5px "JetBrains Mono", monospace'; ctx.fillStyle = C.dim;
    ctx.fillText('所需時數 t:綠=可行(≤h) · 紅=太慢(>h) · 圓點=尚未試', w - PAD, T_TOP - 16);

    // mid 指標(時數排下方,自成一列)
    const MID_Y = T_BOT + 8;
    if (s.mid > 0) {
      triUp(cx(s.mid), MID_Y, C.curS);
      ctx.fillStyle = C.curT; ctx.font='700 11px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='top';
      ctx.fillText('mid=' + s.mid, cx(s.mid), MID_Y + 10);
    } else if (done) {
      triUp(cx(s.ans), MID_Y, C.grnS);
      ctx.fillStyle = C.grnT; ctx.font='700 11px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='top';
      ctx.fillText('答案 ' + s.ans, cx(s.ans), MID_Y + 10);
    }

    // ── BAND 2 ──
    const B2 = 268;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · check(mid) = getTime(mid) ≤ h ?', PAD, B2);
    rr(PAD, B2 + 10, w - 2*PAD, 42, 6);
    const bad = s.act === 'probe-bad';
    ctx.fillStyle = done ? C.grn : (bad ? C.no : (s.act === 'probe' ? C.ok : (s.act === 'intro' ? '#fafaf6' : C.win)));
    ctx.fill();
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = done ? C.grnS : (bad ? C.noS : (s.act === 'probe' ? C.okS : (s.act === 'intro' ? C.grid : C.winS)));
    ctx.stroke();
    ctx.fillStyle = done ? C.grnT : (bad ? C.noT : (s.act === 'probe' ? C.okT : C.winT));
    ctx.font='700 13px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(s.eq, w/2, B2 + 31);

    // ── BAND 3 ──
    const B3 = 340;
    ctx.fillStyle=C.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 可行 → right = mid(保留);不可行 → left = mid + 1(跨過)', PAD, B3);
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
