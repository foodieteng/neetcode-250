/* ============================================================
   P81 · Search in Rotated Sorted Array II — 分不出來就縮一格 · viz
   和 p33-rotated.js 是同一套視覺語言(藍=目前區間 · 橘底線=可信任的有序半 · 紅=mid),
   只多了第三種狀態:
     nums[left] == nums[mid] → 無法判斷哪半有序 → 橘線消失,只能 left++
     (縮之前必須先驗 nums[left] == target,否則會丟掉沒檢查過的值)
   例 nums=[2,5,6,0,0,1,2], target=0 → 3 輪迴圈回傳 true。
   三個分支在這組測資裡剛好各出現一次:右半有序 → 左半有序 → (D) 分不出。
     BAND 1  陣列(藍=目前區間 · 橘=有序的那半 · 紅=mid · 綠=答案 · 灰=已排除)
     BAND 2  本輪的判斷
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

  const A = [2, 5, 6, 0, 0, 1, 2], TARGET = 0;

  // srtLo/srtHi = 這步「可信任的有序半」索引範圍;-1 表示這步分不出來(D)
  const steps = [
    { L:0, R:6, mid:-1, srtLo:-1, srtHi:-1, dup:false, ans:-1, act:'intro',
      eq:'left = 0 · right = n − 1 = 6 → 候選 [0, 6]',
      note:'陣列可以有重複值 —— 兩端比大小不一定分得出哪半有序',
      text:'<strong>INITIAL</strong> · <code>[2,5,6,<strong>0</strong>,0,1,2]</code> 旋轉過,而且<strong>有重複值</strong>(頭尾都是 2、中間兩個 0)。和 <a href="../p33/index.html">33</a> 一樣先問「哪半有序」,但這次<strong>可能問不出來</strong>。' },

    { L:0, R:6, mid:3, srtLo:3, srtHi:6, dup:false, ans:-1, act:'probe',
      eq:'mid = 3 · nums[0]=2 > nums[3]=0 → 右半 [3,6] 有序,值域 [0..2]',
      note:'左端 > 中點 ⇒ 斷點在左半 ⇒ 右半是完整遞增的',
      text:'<strong>Round 1 · 判斷哪半有序</strong> · <code>nums[left]=2 &gt; nums[mid]=0</code>,代表斷點落在左半 → <strong>右半 <code>[0,0,1,2]</code> 有序</strong>,值域 <code>[0..2]</code>。' },

    { L:0, R:3, mid:3, srtLo:3, srtHi:6, dup:false, ans:-1, act:'decide-out',
      eq:'target=0 在 (0, 2] 內嗎?  否(0 不 > 0) → right = mid = 3',
      note:'右半的範圍是開左閉右 (nums[m], nums[r]] —— 對應 right = mid 保留 mid',
      text:'<strong>Round 1 · 收縮</strong> · 右半的判斷式是 <code>nums[mid] &lt; target ≤ nums[right]</code>,而 <code>0 &lt; 0</code> 不成立 → 不在右半 → <code>right = mid = 3</code>,把 mid 留在候選裡。' },

    { L:0, R:3, mid:1, srtLo:0, srtHi:1, dup:false, ans:-1, act:'probe',
      eq:'mid = 1 · nums[0]=2 < nums[1]=5 → 左半 [0,1] 有序,值域 [2..5]',
      note:'這次兩端不同值,判斷得出來 → 照 33 的方式砍半',
      text:'<strong>Round 2 · 判斷哪半有序</strong> · <code>nums[left]=2 &lt; nums[mid]=5</code> → <strong>左半 <code>[2,5]</code> 有序</strong>。' },

    { L:2, R:3, mid:1, srtLo:0, srtHi:1, dup:false, ans:-1, act:'decide-out',
      eq:'target=0 在 [2, 5] 內嗎?  否 → left = mid + 1 = 2',
      note:'不在有序半 → 一定在另一半,mid 已被排除所以 +1',
      text:'<strong>Round 2 · 收縮</strong> · <code>0</code> 不在 <code>[2, 5]</code> 裡 → 只可能在另一半 → <code>left = mid + 1 = 2</code>。' },

    { L:2, R:3, mid:2, srtLo:-1, srtHi:-1, dup:true, ans:-1, act:'probe-dup',
      eq:'mid = 2 · nums[2]=6 == nums[2]=6 → 分不出哪半有序',
      note:'橘線消失 —— 這一步無法判斷方向,這就是 81 與 33 的全部差別',
      text:'<strong>Round 3 · 判斷失敗</strong> · <code>nums[left]</code> 與 <code>nums[mid]</code> <strong>都是 6</strong>。兩端同值時,「一整段相同」和「跨過斷點但頭尾同值」<strong>長得一模一樣</strong> —— 比大小分不出來,<strong>沒有可信任的有序半</strong>。' },

    { L:3, R:3, mid:2, srtLo:-1, srtHi:-1, dup:true, ans:-1, act:'shrink-dup',
      eq:'nums[left]=6 != 0 → 先驗過了,才 left++ = 3',
      note:'先驗再丟:被放棄的那格已經檢查過,不會遺失資訊',
      text:'<strong>Round 3 · 保守縮一格</strong> · 分不出方向就只能放棄一格。但<strong>放棄之前先驗 <code>nums[left] == target</code></strong> —— 這裡 6 ≠ 0,所以丟得安心 → <code>left++ = 3</code>,區間收成 <code>[3,3]</code>。' },

    { L:3, R:3, mid:-1, srtLo:-1, srtHi:-1, dup:false, ans:3, act:'done',
      eq:'nums[3] == 0 == target → return true',
      note:'收斂到單格仍要驗一次 —— 只有「存在」才回 true',
      text:'<strong>完成</strong> · 收斂到 <code>index 3</code>,驗證 <code>nums[3] = 0 == target</code> → 回傳 <strong>true</strong>。共 <strong>3 輪</strong>迴圈,三個分支各出現一次。' },
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

    const SRT_Y = 58;          // 「有序半」那一列(D 步改成紅字說明,同一列)
    const CELL_TOP = 86;
    const CELL_H = 46;
    const CELL_BOT = CELL_TOP + CELL_H;

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

    // 有序半底線,或 (D) 的紅字說明 —— 兩者共用同一列,絕不同時出現
    if (sLo >= 0) {
      const x1 = edge(sLo), x2 = rightEdge(sHi + 1);
      ctx.strokeStyle = C.srtS; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(x1, SRT_Y + 12); ctx.lineTo(x2, SRT_Y + 12); ctx.stroke();
      ctx.fillStyle = C.srtT; ctx.font='700 11px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='bottom';
      ctx.fillText('有序半 [' + A[sLo] + ' … ' + A[sHi] + ']', (x1+x2)/2, SRT_Y + 8);
    } else if (s.dup) {
      ctx.fillStyle = C.curT; ctx.font='700 12px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='bottom';
      ctx.fillText('✕ 沒有可信任的有序半(nums[left] == nums[mid])', w/2, SRT_Y + 10);
    }

    // 值格
    for (let k = 0; k < n; k++) {
      const inWin = k >= s.L && k <= s.R;
      const isMid = k === s.mid;
      const isAns = done && k === s.ans;
      let bg = C.off, bd = C.offS, tx = C.offT;
      if (inWin) { bg = C.win; bd = C.winS; tx = C.winT; }
      if (inWin && inSorted(k)) { bg = C.srt; bd = C.srtS; tx = C.srtT; }
      if (isMid || (s.dup && k === s.L)) { bg = C.cur; bd = C.curS; tx = C.curT; }
      if (isAns) { bg = C.grn; bd = C.grnS; tx = C.grnT; }
      rr(edge(k), CELL_TOP, cw, CELL_H, 5);
      ctx.fillStyle = bg; ctx.fill();
      ctx.lineWidth = (isMid || isAns || (s.dup && k === s.L)) ? 3 : 1.6; ctx.strokeStyle = bd; ctx.stroke();
      ctx.fillStyle = tx; ctx.font='700 16px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(A[k]), cx(k), CELL_TOP + CELL_H/2);
      // 索引(小字,格子正下方最近一列)
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
    const dupStep = s.act === 'probe-dup' || s.act === 'shrink-dup';
    ctx.fillStyle = done ? C.grn : (dupStep ? C.cur : (probe ? C.srt : (s.act === 'intro' ? '#fafaf6' : C.win)));
    ctx.fill();
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = done ? C.grnS : (dupStep ? C.curS : (probe ? C.srtS : (s.act === 'intro' ? C.grid : C.winS)));
    ctx.stroke();
    ctx.fillStyle = done ? C.grnT : (dupStep ? C.curT : (probe ? C.srtT : C.winT));
    ctx.font='700 12.5px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(s.eq, w/2, B2 + 31);

    // ── BAND 3 ──
    const B3 = 304;
    ctx.fillStyle=C.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 判斷得出來就砍半;分不出來就先驗一格再放棄一格', PAD, B3);
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
