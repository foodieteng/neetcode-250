/* ============================================================
   P33 · Search in Rotated Sorted Array — 先判斷哪半有序 · viz
   旋轉後「nums[i] >= target」不再單調(TF 帶斷成兩段),不能直接套 lower_bound。
   但關鍵性質仍在:以 mid 切開後,「至少有一半是完全有序的」。
     nums[l] <= nums[mid] → 左半 [l, mid] 有序
     否則                 → 右半 [mid, r] 有序
   對「有序的那半」可以用區間比大小判斷 target 在不在,在就往那邊收、不在就往另一邊收。
   例 nums=[4,5,6,7,0,1,2], target=0 → 3 輪收斂到 index 4。
     BAND 1  陣列(藍=目前區間 · 橘=有序的那半 · 紅=mid · 綠=答案)
     BAND 2  哪半有序 + target 在不在那半的範圍內
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
    srt:'#f6ead8', srtS:'#c8801e', srtT:'#96601a',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424',
    grn:'#d9e8c7', grnS:'#5fa866', grnT:'#3f7a3a',
    off:'#f0f0ec', offS:'#cfcfcf', offT:'#a3a099', coral:'#cf3535' };

  const A = [4, 5, 6, 7, 0, 1, 2], TARGET = 0;

  // L/R = 閉區間 [left, right];  mid;  sorted = 'L' 左半有序 / 'R' 右半有序 / null
  const steps = [
    { L:0, R:6, mid:-1, srtLo:-1, srtHi:-1, ans:-1, act:'intro',
      eq:'left = 0 · right = n − 1 = 6 → 候選 [0, 6]',
      note:'旋轉後「≥ target」不再單調 → 不能直接套 lower_bound',
      text:'<strong>INITIAL</strong> · 陣列被旋轉過,<code>[4,5,6,7,<strong>0</strong>,1,2]</code> 不是整體遞增。但有一個性質沒被破壞:<strong>不管從哪裡切,至少有一半是完全有序的</strong>。' },

    { L:0, R:6, mid:3, srtLo:0, srtHi:3, ans:-1, act:'probe',
      eq:'mid = 3 · nums[0]=4 ≤ nums[3]=7 → 左半 [0,3] 有序',
      note:'左端 ≤ 中點 ⇒ 這半沒被斷點切到 ⇒ 它是遞增的',
      text:'<strong>Round 1 · 判斷哪半有序</strong> · <code>nums[left]=4 ≤ nums[mid]=7</code>,代表 <strong>左半 [4,5,6,7] 沒有跨過斷點</strong>,是完整遞增的一段。' },

    { L:4, R:6, mid:3, srtLo:0, srtHi:3, ans:-1, act:'decide-out',
      eq:'target=0 在 [4, 7] 內嗎?  否 → left = mid + 1 = 4',
      note:'有序半可以直接用範圍判斷:不在裡面 → 一定在另一半',
      text:'<strong>Round 1 · 收縮</strong> · 對<strong>有序的那半</strong>可以放心用區間比大小:<code>0</code> 不在 <code>[4, 7]</code> 裡,那它<strong>只可能在另一半</strong> → <code>left = mid + 1 = 4</code>,一次砍掉四格。' },

    { L:4, R:6, mid:5, srtLo:4, srtHi:5, ans:-1, act:'probe',
      eq:'mid = 5 · nums[4]=0 ≤ nums[5]=1 → 左半 [4,5] 有序',
      note:'區間縮到 [0,1,2] 後已不含斷點,左半照樣有序',
      text:'<strong>Round 2 · 判斷哪半有序</strong> · 目前區間是 <code>[0,1,2]</code>,<code>nums[left]=0 ≤ nums[mid]=1</code> → 左半 <code>[0,1]</code> 有序。' },

    { L:4, R:5, mid:5, srtLo:4, srtHi:5, ans:-1, act:'decide-in',
      eq:'target=0 在 [0, 1] 內嗎?  是 → right = mid = 5',
      note:'在有序半裡 → 往那半收,且 right = mid 保留 mid',
      text:'<strong>Round 2 · 收縮</strong> · <code>0</code> 落在 <code>[0, 1]</code> 之內 → 收到左半 <code>right = mid = 5</code>。注意<strong>不減 1</strong>,mid 本身仍是候選。' },

    { L:4, R:5, mid:4, srtLo:4, srtHi:4, ans:-1, act:'probe',
      eq:'mid = 4 · nums[4]=0 ≤ nums[4]=0 → 左半 [4,4] 有序',
      note:'只剩兩格時 mid 會等於 left,此時 ≤ 讓它算「有序」',
      text:'<strong>Round 3 · 判斷哪半有序</strong> · 剩兩格,<code>mid</code> 向下取整等於 <code>left</code>。這裡 <code>nums[left] ≤ nums[mid]</code> 的 <strong>等號很關鍵</strong> —— 單格當然有序。' },

    { L:4, R:4, mid:4, srtLo:4, srtHi:4, ans:-1, act:'decide-in',
      eq:'target=0 在 [0, 0] 內嗎?  是 → right = mid = 4',
      note:'left == right,區間剩一格 → 跳出迴圈',
      text:'<strong>Round 3 · 收縮</strong> · <code>0</code> 在 <code>[0, 0]</code> 內 → <code>right = 4</code>。此時 <code>left == right == 4</code>,<code>while (left &lt; right)</code> 不成立,迴圈結束。' },

    { L:4, R:4, mid:-1, srtLo:-1, srtHi:-1, ans:4, act:'done',
      eq:'nums[4] == 0 == target → return 4',
      note:'收斂只保證「唯一候選」,是否命中仍要驗一次',
      text:'<strong>完成</strong> · 收斂到單格 <code>index 4</code>。因為 target <strong>可能根本不在陣列裡</strong>,最後必須驗一次 <code>nums[left] == target</code> → 成立,回傳 <strong>4</strong>。' },
  ];

  let step = 0, timer = null;

  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||366; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function triUp(cx,cy,col){ ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx-6,cy+8); ctx.lineTo(cx+6,cy+8); ctx.closePath(); ctx.fillStyle=col; ctx.fill(); }

  function draw(){
    fit();
    const s = steps[step], w = canvas.clientWidth, PAD = 34, n = A.length;
    const done = s.act === 'done';
    ctx.fillStyle = C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);

    const cw = Math.min(72, (w - 2*PAD) / n - 12);
    const gap = Math.min(40, (w - 2*PAD - n*cw) / (n - 1));
    const x0 = (w - (n*cw + (n-1)*gap)) / 2;
    const edge = k => x0 + k * (cw + gap);
    const rightEdge = k => (k >= n ? edge(n-1) + cw : edge(k));
    const cx = k => edge(k) + cw/2;

    const SRT_Y = 58;        // 「有序半」標記列(在格子上方,獨立一列)
    const CELL_TOP = 86;
    const CELL_H = 46;
    const CELL_BOT = CELL_TOP + CELL_H;

    // 有序半的範圍(索引)—— 由每步明寫,收縮那一步仍指向「剛剛比較過的那半」
    const sLo = s.srtLo, sHi = s.srtHi;
    const inSorted = k => sLo >= 0 && k >= sLo && k <= sHi;

    // ── BAND 1 ──
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 藍=目前區間 · 橘=有序的那半 · 紅=mid · 綠=答案', PAD, 16);
    ctx.textAlign='right'; ctx.font='700 12.5px "JetBrains Mono", monospace'; ctx.fillStyle= done ? C.grnT : C.text;
    ctx.fillText('target = ' + TARGET, w - PAD, 16);

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

    // 「有序半」底線 + 標籤(自成一列,不碰格子)
    if (sLo >= 0) {
      const x1 = edge(sLo), x2 = rightEdge(sHi + 1);
      ctx.strokeStyle = C.srtS; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(x1, SRT_Y + 12); ctx.lineTo(x2, SRT_Y + 12); ctx.stroke();
      ctx.fillStyle = C.srtT; ctx.font='700 11px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='bottom';
      ctx.fillText('有序半 [' + A[sLo] + ' … ' + A[sHi] + ']', (x1+x2)/2, SRT_Y + 8);
    }

    // 值格
    for (let k = 0; k < n; k++) {
      const inWin = k >= s.L && k <= s.R;
      const isMid = k === s.mid;
      const isAns = done && k === s.ans;
      let bg = C.off, bd = C.offS, tx = C.offT;
      if (inWin) { bg = C.win; bd = C.winS; tx = C.winT; }
      if (inWin && inSorted(k)) { bg = C.srt; bd = C.srtS; tx = C.srtT; }
      if (isMid) { bg = C.cur; bd = C.curS; tx = C.curT; }
      if (isAns) { bg = C.grn; bd = C.grnS; tx = C.grnT; }
      rr(edge(k), CELL_TOP, cw, CELL_H, 5);
      ctx.fillStyle = bg; ctx.fill();
      ctx.lineWidth = (isMid || isAns) ? 3 : 1.6; ctx.strokeStyle = bd; ctx.stroke();
      ctx.fillStyle = tx; ctx.font='700 16px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(A[k]), cx(k), CELL_TOP + CELL_H/2);
      // 索引(小字,置於格子正下方最近的一列)
      ctx.fillStyle = inWin ? C.winT : C.offT;
      ctx.font='600 10px "JetBrains Mono", monospace'; ctx.textBaseline='top';
      ctx.fillText(String(k), cx(k), CELL_BOT + 6);
    }

    // 指標列 A:mid
    const MID_Y = CELL_BOT + 24;
    if (s.mid >= 0) {
      triUp(cx(s.mid), MID_Y, C.curS);
      ctx.fillStyle = C.curT; ctx.font='700 11px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='top';
      ctx.fillText('mid=' + s.mid, cx(s.mid), MID_Y + 10);
    }

    // 指標列 B:left / right
    const LR_Y = CELL_BOT + 60;
    ctx.font='700 11px "JetBrains Mono", monospace'; ctx.textBaseline='top'; ctx.textAlign='center';
    if (s.L === s.R) {
      ctx.fillStyle = done ? C.grnT : C.winT;
      ctx.fillText('left = right = ' + s.L, cx(s.L), LR_Y);
    } else {
      ctx.fillStyle = C.winT; ctx.fillText('left=' + s.L, cx(s.L), LR_Y);
      ctx.fillStyle = C.winT; ctx.fillText('right=' + s.R, cx(s.R), LR_Y);
    }

    // ── BAND 2 ──
    const B2 = 232;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 這一輪的判斷', PAD, B2);
    rr(PAD, B2 + 10, w - 2*PAD, 42, 6);
    const probe = s.act === 'probe';
    ctx.fillStyle = done ? C.grn : (probe ? C.srt : (s.act === 'intro' ? '#fafaf6' : C.win));
    ctx.fill();
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = done ? C.grnS : (probe ? C.srtS : (s.act === 'intro' ? C.grid : C.winS));
    ctx.stroke();
    ctx.fillStyle = done ? C.grnT : (probe ? C.srtT : C.winT);
    ctx.font='700 13px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(s.eq, w/2, B2 + 31);

    // ── BAND 3 ──
    const B3 = 304;
    ctx.fillStyle=C.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 每輪兩問:① 哪半有序 ② target 在不在那半的範圍內', PAD, B3);
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
