/* ============================================================
   P374 · Guess Number Higher or Lower — 合併分支的閉區間二分 · viz
   看不到 pick,只能靠 guess(mid) 的三種回應:
     +1 猜太小 → 答案在 (mid, right] → left = mid + 1
     -1 猜太大 → 答案在 [left, mid)  ┐ 兩者都可寫成 right = mid
      0 猜中了 → 答案就是 mid        ┘ (mid 仍留在區間內,收斂後自然浮出)
   把 0 併進 -1 那一邊,三分支就變兩分支 —— 和 704 / 35 同一副骨架。
   例 n=10, pick=6 → 4 次 guess 收斂。
     BAND 1  1..n 的候選數字(藍=目前區間 · 紅=這次猜的 mid · 灰=已排除 · 綠=答案)
     BAND 2  guess(mid) 的回應與區間更新
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
    off:'#f0f0ec', offS:'#cfcfcf', offT:'#a3a099', coral:'#cf3535' };

  const N = 10, PICK = 6;   // pick 對程式而言是看不見的,只有動畫最後才揭曉

  // L / R = 閉區間 [left, right];  mid = -1 表示這步沒有猜;  api = guess(mid) 的回應
  const steps = [
    { L:1, R:10, mid:-1, api:null, act:'intro',
      eq:'left = 1 · right = n = 10 → 候選 [1, 10]',
      note:'看不到 pick,只能問 guess():+1 太小 / −1 太大 / 0 猜中',
      text:'<strong>INITIAL</strong> · 這題唯一的資訊來源是 <code>guess()</code>。答案<strong>保證存在</strong>於 <code>[1, 10]</code> 之中,所以區間永遠非空 —— 這點等下會用到。' },

    { L:1, R:10, mid:5, api:1, act:'probe',
      eq:'mid = 1 + (10−1)/2 = 5 → guess(5) = +1(太小)',
      note:'+1 → mid 及其左邊全部出局 → left = mid + 1',
      text:'<strong>Round 1 · 猜 5</strong> · 回應 <code>+1</code>,代表 5 <strong>比答案小</strong>。那 5 和 5 以下全都不可能,一次砍掉一半。' },

    { L:6, R:10, mid:-1, api:null, act:'shrink-l',
      eq:'left = mid + 1 = 6 → 區間縮為 [6, 10]',
      note:'猜過又被否定的數字一定要排除,否則會重複猜同一個數',
      text:'<strong>Round 1 · 收縮</strong> · <code>left = 6</code>。<strong>+1 這邊一定要加 1</strong>,因為 5 已經被 <code>guess</code> 明確否定了。' },

    { L:6, R:10, mid:8, api:-1, act:'probe',
      eq:'mid = 6 + (10−6)/2 = 8 → guess(8) = −1(太大)',
      note:'−1 → 8 本身出局,答案在 8 左邊',
      text:'<strong>Round 2 · 猜 8</strong> · 回應 <code>−1</code>,代表 8 <strong>比答案大</strong>。答案落在 <code>[6, 8)</code> 之中。' },

    { L:6, R:8, mid:-1, api:null, act:'shrink-r',
      eq:'right = mid = 8 → 區間縮為 [6, 8]',
      note:'寫 right = mid 就好 —— 8 留著也無妨,反正它永遠不會是最後留下的那格',
      text:'<strong>Round 2 · 收縮</strong> · <code>right = mid = 8</code>。這裡<strong>不必寫 <code>mid − 1</code></strong>:多留一格不影響正確性,卻讓「猜中」的情形能共用這同一行。' },

    { L:6, R:8, mid:7, api:-1, act:'probe',
      eq:'mid = 6 + (8−6)/2 = 7 → guess(7) = −1(太大)',
      note:'再一次 −1,繼續往左壓',
      text:'<strong>Round 3 · 猜 7</strong> · 又是 <code>−1</code>。區間收成 <code>[6, 7]</code>。' },

    { L:6, R:7, mid:-1, api:null, act:'shrink-r',
      eq:'right = mid = 7 → 區間縮為 [6, 7]',
      note:'剩兩格 —— 接下來 mid 會取到左邊那格(向下取整)',
      text:'<strong>Round 3 · 收縮</strong> · <code>right = 7</code>,只剩 6 和 7 兩個候選。' },

    { L:6, R:7, mid:6, api:0, act:'probe-hit',
      eq:'mid = 6 + (7−6)/2 = 6 → guess(6) = 0(猜中!)',
      note:'關鍵:0 不提早 return,而是和 −1 走同一條 right = mid',
      text:'<strong>Round 4 · 猜 6</strong> · 回應 <code>0</code> —— <strong>猜中了</strong>。但這份寫法<strong>不立刻回傳</strong>,而是把它當成「答案在 <code>[left, mid]</code>」處理,和 −1 共用同一行。' },

    { L:6, R:6, mid:-1, api:null, act:'converge',
      eq:'right = mid = 6 → left == right == 6,只剩一格',
      note:'mid 被保留在區間裡,所以猜中的那個數就是最後留下的那格',
      text:'<strong>Round 4 · 收縮</strong> · <code>right = 6</code>,區間變成單格 <code>[6, 6]</code> → <code>while (left &lt; right)</code> 不成立,迴圈結束。' },

    { L:6, R:6, mid:-1, api:null, ans:PICK, act:'done',
      eq:'return left = 6     // 不需要額外檢查:答案保證存在',
      note:'保證答案存在 ⇒ 唯一活下來的那格必定就是它',
      text:'<strong>完成</strong> · 回傳 <code>left = 6</code>。共呼叫 <code>guess()</code> <strong>4 次</strong>。因為題目保證 pick 一定在 <code>[1, n]</code> 內,單格區間<strong>必定</strong>就是答案,連驗證都不用。' },
  ];

  let step = 0, timer = null;

  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||352; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function triUp(cx,cy,col){ ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx-6,cy+8); ctx.lineTo(cx+6,cy+8); ctx.closePath(); ctx.fillStyle=col; ctx.fill(); }

  function draw(){
    fit();
    const s = steps[step], w = canvas.clientWidth, PAD = 34, n = N;
    const done = s.act === 'done';
    ctx.fillStyle = C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);

    const cw = Math.min(72, (w - 2*PAD) / n - 12);
    const gap = Math.min(40, (w - 2*PAD - n*cw) / (n - 1));
    const x0 = (w - (n*cw + (n-1)*gap)) / 2;
    const edge = k => x0 + (k - 1) * (cw + gap);      // k 是「數字」1..n,不是索引
    const rightEdge = k => (k > n ? edge(n) + cw : edge(k));
    const cx = k => edge(k) + cw/2;

    const API_Y = 58;        // guess() 回應那一列(只在 mid 欄上方顯示)
    const CELL_TOP = 86;
    const CELL_H = 46;
    const CELL_BOT = CELL_TOP + CELL_H;

    // ── BAND 1 ──
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 候選 1..n(藍=區間 · 紅=mid · 灰=排除 · 綠=答案)', PAD, 16);
    ctx.textAlign='right'; ctx.font='700 12.5px "JetBrains Mono", monospace'; ctx.fillStyle= done ? C.grnT : C.text;
    ctx.fillText(done ? ('pick = ' + s.ans) : 'pick = ?', w - PAD, 16);

    // 區間括號
    const BR_Y = 38;
    {
      const x1 = edge(s.L), x2 = rightEdge(s.R + 1);
      const single = s.L === s.R;
      ctx.strokeStyle = done ? C.grnS : C.winS; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x1, BR_Y + 8); ctx.lineTo(x1, BR_Y); ctx.lineTo(x2, BR_Y); ctx.lineTo(x2, BR_Y + 8);
      ctx.stroke();
      ctx.fillStyle = done ? C.grnT : C.winT; ctx.font='700 11px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='bottom';
      ctx.fillText('[ ' + s.L + ', ' + s.R + ' ]  ' + (single ? '只剩 1 格' : ('共 ' + (s.R - s.L + 1) + ' 格')), (x1+x2)/2, BR_Y - 4);
    }

    // guess() 回應(只畫在 mid 那一欄的正上方,與格子保持 28px 距離)
    if (s.mid > 0 && s.api !== null) {
      const label = s.api === 1 ? 'guess = +1 太小' : (s.api === -1 ? 'guess = −1 太大' : 'guess = 0 猜中');
      ctx.fillStyle = s.api === 0 ? C.grnT : C.curT;
      ctx.font='700 11px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='top';
      ctx.fillText(label, Math.min(Math.max(cx(s.mid), PAD + 60), w - PAD - 60), API_Y);
    }

    // 數字格
    for (let k = 1; k <= n; k++) {
      const inWin = k >= s.L && k <= s.R;
      const isMid = k === s.mid;
      const isAns = done && k === s.ans;
      let bg = C.off, bd = C.offS, tx = C.offT;
      if (inWin) { bg = C.win; bd = C.winS; tx = C.winT; }
      if (isMid) { bg = C.cur; bd = C.curS; tx = C.curT; }
      if (isMid && s.api === 0) { bg = C.grn; bd = C.grnS; tx = C.grnT; }
      if (isAns) { bg = C.grn; bd = C.grnS; tx = C.grnT; }
      rr(edge(k), CELL_TOP, cw, CELL_H, 5);
      ctx.fillStyle = bg; ctx.fill();
      ctx.lineWidth = (isMid || isAns) ? 3 : 1.6; ctx.strokeStyle = bd; ctx.stroke();
      ctx.fillStyle = tx; ctx.font='700 15px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(k), cx(k), CELL_TOP + CELL_H/2);
    }

    // 指標列 A:mid
    const MID_Y = CELL_BOT + 8;
    if (s.mid > 0) {
      triUp(cx(s.mid), MID_Y, s.api === 0 ? C.grnS : C.curS);
      ctx.fillStyle = s.api === 0 ? C.grnT : C.curT; ctx.font='700 11px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='top';
      ctx.fillText('mid=' + s.mid, cx(s.mid), MID_Y + 10);
    }

    // 指標列 B:left / right
    const LR_Y = CELL_BOT + 44;
    ctx.font='700 11px "JetBrains Mono", monospace'; ctx.textBaseline='top'; ctx.textAlign='center';
    if (s.L === s.R) {
      ctx.fillStyle = done ? C.grnT : C.winT;
      ctx.fillText('left = right = ' + s.L, cx(s.L), LR_Y);
    } else {
      ctx.fillStyle = C.winT; ctx.fillText('left=' + s.L, cx(s.L), LR_Y);
      ctx.fillStyle = C.winT; ctx.fillText('right=' + s.R, cx(s.R), LR_Y);
    }

    // ── BAND 2 ──
    const B2 = 216;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 本輪的 guess 與區間更新', PAD, B2);
    rr(PAD, B2 + 10, w - 2*PAD, 42, 6);
    const hit = s.act === 'probe-hit';
    ctx.fillStyle = (done || hit) ? C.grn : (s.act === 'probe' ? C.cur : (s.act === 'intro' ? '#fafaf6' : C.win));
    ctx.fill();
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = (done || hit) ? C.grnS : (s.act === 'probe' ? C.curS : (s.act === 'intro' ? C.grid : C.winS));
    ctx.stroke();
    ctx.fillStyle = (done || hit) ? C.grnT : (s.act === 'probe' ? C.curT : C.winT);
    ctx.font='700 13.5px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(s.eq, w/2, B2 + 31);

    // ── BAND 3 ──
    const B3 = 288;
    ctx.fillStyle=C.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · +1 → left = mid + 1;−1 與 0 合併 → right = mid(三分支變兩分支)', PAD, B3);
    rr(PAD, B3 + 10, w - 2*PAD, 40, 6);
    ctx.fillStyle = (done || hit) ? C.grn : '#fafaf6'; ctx.fill();
    ctx.lineWidth = 1.6; ctx.strokeStyle = (done || hit) ? C.grnS : C.grid; ctx.stroke();
    ctx.fillStyle = (done || hit) ? C.grnT : C.text;
    ctx.font='600 12.5px "Noto Sans TC", sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(s.note, w/2, B3 + 30);
  }

  function update(){ if(stepEl) stepEl.textContent=String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0'); if(labelEl) labelEl.innerHTML=steps[step].text; draw(); }
  function next(){ if(step<steps.length-1){step++;update();}else stop(); }
  function prev(){ if(step>0){step--;update();} }
  function reset(){ stop(); step=0; update(); }
  function play(){ if(timer){stop();return;} bPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){stop();return;} next(); },1800); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} if(bPlay) bPlay.textContent='Play'; }
  bPrev&&bPrev.addEventListener('click',prev); bNext&&bNext.addEventListener('click',next); bPlay&&bPlay.addEventListener('click',play); bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();}); if(window.ResizeObserver){ new ResizeObserver(()=>{fit();draw();}).observe(canvas); }
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw); fit(); update();
})();
