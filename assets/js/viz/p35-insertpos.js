/* ============================================================
   P35 · Search Insert Position — lower_bound 直接回傳 left · viz
   和 704 是同一副骨架,差別只在收尾:704 還要驗一次命中,35 直接 return left。
   左閉右開 [left, right):
     nums[mid] >= target → right = mid      (mid 可能就是插入點,保留)
     nums[mid] <  target → left  = mid + 1  (mid 太小,插入點在它右邊)
   收斂後 left = 第一個 >= target 的位置 = 「該插進去的格子」。
   例 nums=[1,3,5,6], target=2 → 1(2 應插在 1 和 3 之間)。
     BAND 1  nums 陣列 + 插槽(藍=目前區間 · 紅=mid · 灰=已排除 · 綠=插入點)
     BAND 2  left / right / mid 與本輪判斷式
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

  const A = [1, 3, 5, 6], TARGET = 2;

  const steps = [
    { L:0, R:4, mid:-1, ans:-1, act:'intro',
      eq:'left = 0 · right = n = 4 → 區間 [0, 4)',
      note:'要找的不是「等於 2 的格子」,是「2 該插進哪一格」',
      text:'<strong>INITIAL</strong> · 2 並不在陣列裡,但插入位置<strong>一定存在</strong>。骨架和 704 完全相同:左閉右開 <code>[0, 4)</code>,找<strong>第一個 ≥ 2 的位置</strong>。' },

    { L:0, R:4, mid:2, ans:-1, act:'probe',
      eq:'mid = 0 + (4−0)/2 = 2 → nums[2] = 5 ≥ 2 ?  是',
      note:'nums[mid] ≥ target → 插入點在 mid 或它左邊',
      text:'<strong>Round 1 · 探點</strong> · <code>mid = 2</code>,<code>nums[2] = 5 ≥ 2</code>。5 已經比 2 大,所以 2 要插在 <strong>index 2 或更左邊</strong>,右半可以丟。' },

    { L:0, R:2, mid:-1, ans:-1, act:'shrink-r',
      eq:'right = mid = 2 → 區間縮為 [0, 2)',
      note:'right = mid 不減 1:index 2 本身仍是候選插槽',
      text:'<strong>Round 1 · 收縮</strong> · <code>right = 2</code>。注意 index 2 <strong>沒有被排除</strong> —— 它仍可能是答案(若左半全都比 2 小,2 就插在這裡)。' },

    { L:0, R:2, mid:1, ans:-1, act:'probe',
      eq:'mid = 0 + (2−0)/2 = 1 → nums[1] = 3 ≥ 2 ?  是',
      note:'又一次「夠大」→ 插入點再往左壓',
      text:'<strong>Round 2 · 探點</strong> · <code>mid = 1</code>,<code>nums[1] = 3 ≥ 2</code>。3 也比 2 大,插入點還要再往左。' },

    { L:0, R:1, mid:-1, ans:-1, act:'shrink-r',
      eq:'right = mid = 1 → 區間縮為 [0, 1)',
      note:'剩最後一格候選:index 0',
      text:'<strong>Round 2 · 收縮</strong> · <code>right = 1</code>,候選只剩 <code>[0, 1)</code> 一格。' },

    { L:0, R:1, mid:0, ans:-1, act:'probe',
      eq:'mid = 0 + (1−0)/2 = 0 → nums[0] = 1 ≥ 2 ?  否',
      note:'nums[mid] < target → 插入點一定在 mid 右邊',
      text:'<strong>Round 3 · 探點</strong> · <code>mid = 0</code>,<code>nums[0] = 1 &lt; 2</code>。1 比 2 小,2 必須排在它<strong>後面</strong>,所以 index 0 出局。' },

    { L:1, R:1, mid:-1, ans:-1, act:'empty',
      eq:'left = mid + 1 = 1 → left == right == 1,區間空',
      note:'left < right 不成立 → 跳出迴圈',
      text:'<strong>Round 3 · 收縮</strong> · <code>left = 1</code>,此時 <code>left == right == 1</code>,區間空 → 迴圈結束。' },

    { L:1, R:1, mid:-1, ans:1, act:'done',
      eq:'return left = 1     // 不需要任何額外檢查',
      note:'704 要多驗一次命中,35 到這裡就結束了',
      text:'<strong>完成</strong> · 直接 <code>return left = 1</code>。把 2 插在 index 1 後陣列變成 <code>[1,<strong>2</strong>,3,5,6]</code>,仍然遞增 —— 正是要的答案。' },
  ];

  let step = 0, timer = null;

  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||352; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function triUp(cx,cy,col){ ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx-6,cy+8); ctx.lineTo(cx+6,cy+8); ctx.closePath(); ctx.fillStyle=col; ctx.fill(); }

  function draw(){
    fit();
    const s = steps[step], w = canvas.clientWidth, PAD = 34, n = A.length;
    const done = s.act === 'done';
    ctx.fillStyle = C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);

    const cw = Math.min(72, (w - 2*PAD) / n - 12);
    const gap = Math.min(40, (w - 2*PAD - n*cw) / (n - 1));   // 間距設上限,避免寬螢幕上攤成空曠的一排
    const x0 = (w - (n*cw + (n-1)*gap)) / 2;                  // 整排置中
    const edge = k => x0 + k * (cw + gap);
    const rightEdge = k => (k >= n ? edge(n-1) + cw : edge(k));
    const cx = k => edge(k) + cw/2;

    const HDR_Y = 60;
    const CELL_TOP = 86;
    const CELL_H = 46;
    const CELL_BOT = CELL_TOP + CELL_H;

    // ── BAND 1 ──
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · nums(藍=目前區間 · 紅=mid · 灰=已排除 · 綠=插入點)', PAD, 16);
    ctx.textAlign='right'; ctx.font='700 12.5px "JetBrains Mono", monospace'; ctx.fillStyle=C.text;
    ctx.fillText('target = ' + TARGET, w - PAD, 16);

    const BR_Y = 38;
    if (s.L < s.R) {
      const x1 = edge(s.L), x2 = rightEdge(s.R);
      ctx.strokeStyle = C.winS; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x1, BR_Y + 8); ctx.lineTo(x1, BR_Y); ctx.lineTo(x2, BR_Y); ctx.lineTo(x2, BR_Y + 8);
      ctx.stroke();
      ctx.fillStyle = C.winT; ctx.font='700 11px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='bottom';
      ctx.fillText('[ ' + s.L + ', ' + s.R + ' )  共 ' + (s.R - s.L) + ' 格', (x1+x2)/2, BR_Y - 4);
    } else {
      const x1 = rightEdge(s.L);
      ctx.strokeStyle = done ? C.grnS : C.offS; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x1, BR_Y); ctx.lineTo(x1, BR_Y + 8); ctx.stroke();
      ctx.fillStyle = done ? C.grnT : C.offT; ctx.font='700 11px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='bottom';
      ctx.fillText(done ? ('插入點 = ' + s.ans) : ('[ ' + s.L + ', ' + s.R + ' )  空區間 → 停'), x1, BR_Y - 4);
    }

    // 索引標頭
    ctx.font='600 10px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='top';
    for (let k = 0; k < n; k++) {
      const inWin = k >= s.L && k < s.R;
      ctx.fillStyle = inWin ? C.winT : C.offT;
      ctx.fillText(String(k), cx(k), HDR_Y);
    }

    // 值格
    for (let k = 0; k < n; k++) {
      const inWin = k >= s.L && k < s.R;
      const isMid = k === s.mid;
      let bg = C.off, bd = C.offS, tx = C.offT;
      if (inWin) { bg = C.win; bd = C.winS; tx = C.winT; }
      if (isMid) { bg = C.cur; bd = C.curS; tx = C.curT; }
      rr(edge(k), CELL_TOP, cw, CELL_H, 5);
      ctx.fillStyle = bg; ctx.fill();
      ctx.lineWidth = isMid ? 3 : 1.6; ctx.strokeStyle = bd; ctx.stroke();
      ctx.fillStyle = tx; ctx.font='700 16px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(A[k]), cx(k), CELL_TOP + CELL_H/2);
    }

    // 完成時:在插入點畫一根綠色的「插槽」楔子(格與格之間,不覆蓋任何數字)
    if (done) {
      const sx = rightEdge(s.ans);
      ctx.strokeStyle = C.grnS; ctx.lineWidth = 3; ctx.setLineDash([5,3]);
      ctx.beginPath(); ctx.moveTo(sx, CELL_TOP - 6); ctx.lineTo(sx, CELL_BOT + 6); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = C.grnT; ctx.font='700 12px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='top';
      ctx.fillText('↑ 插這裡', sx, CELL_BOT + 10);
    }

    // 指標列 A:mid
    const MID_Y = CELL_BOT + 8;
    if (s.mid >= 0) {
      triUp(cx(s.mid), MID_Y, C.curS);
      ctx.fillStyle = C.curT; ctx.font='700 11px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='top';
      ctx.fillText('mid=' + s.mid, cx(s.mid), MID_Y + 10);
    }

    // 指標列 B:left / right
    const LR_Y = CELL_BOT + 44;
    ctx.font='700 11px "JetBrains Mono", monospace'; ctx.textBaseline='top'; ctx.textAlign='center';
    const px = k => (k >= n ? rightEdge(n) : cx(k));
    if (s.L === s.R) {
      ctx.fillStyle = done ? C.grnT : C.offT;
      ctx.fillText('left = right = ' + s.L, px(s.L), LR_Y);
    } else {
      ctx.fillStyle = C.winT; ctx.fillText('left=' + s.L, px(s.L), LR_Y);
      ctx.fillStyle = C.winT; ctx.fillText('right=' + s.R, px(s.R), LR_Y);
    }

    // ── BAND 2 ──
    const B2 = 216;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 本輪判斷式', PAD, B2);
    rr(PAD, B2 + 10, w - 2*PAD, 42, 6);
    ctx.fillStyle = done ? C.grn : (s.act === 'probe' ? C.cur : (s.act === 'intro' ? '#fafaf6' : C.win));
    ctx.fill();
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = done ? C.grnS : (s.act === 'probe' ? C.curS : (s.act === 'intro' ? C.grid : C.winS));
    ctx.stroke();
    ctx.fillStyle = done ? C.grnT : (s.act === 'probe' ? C.curT : C.winT);
    ctx.font='700 13.5px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(s.eq, w/2, B2 + 31);

    // ── BAND 3 ──
    const B3 = 288;
    ctx.fillStyle=C.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 和 704 同一副骨架,只有收尾不同:35 直接 return left', PAD, B3);
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
  function play(){ if(timer){stop();return;} bPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){stop();return;} next(); },1800); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} if(bPlay) bPlay.textContent='Play'; }
  bPrev&&bPrev.addEventListener('click',prev); bNext&&bNext.addEventListener('click',next); bPlay&&bPlay.addEventListener('click',play); bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();}); if(window.ResizeObserver){ new ResizeObserver(()=>{fit();draw();}).observe(canvas); }
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw); fit(); update();
})();
