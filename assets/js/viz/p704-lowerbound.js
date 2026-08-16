/* ============================================================
   P704 · Binary Search — lower_bound 式邊界二分 · viz
   搜尋區間採「左閉右開」[left, right)。每輪取 mid:
     nums[mid] >= target → mid 本身可能就是答案 → right = mid（保留 mid）
     nums[mid] <  target → mid 太小,連 mid 一起丟 → left = mid + 1
   迴圈在 left == right 時停止,left 落在「第一個 >= target 的位置」。
   最後補一次檢查:left 是否越界、nums[left] 是否真的等於 target。
   例 nums=[-1,0,3,5,9,12], target=9 → 回傳 4。
     BAND 1  nums 陣列(藍=目前區間 · 紅=mid · 灰=已排除 · 綠=答案)
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

  const A = [-1, 0, 3, 5, 9, 12], TARGET = 9;

  // L / R = 目前 [left, right);  mid = -1 表示這一步沒有 mid;  ans = 答案索引
  const steps = [
    { L:0, R:6, mid:-1, ans:-1, act:'intro',
      eq:'left = 0 · right = n = 6 → 區間 [0, 6)',
      note:'左閉右開:right 是「還沒被排除的右界外一格」',
      text:'<strong>INITIAL</strong> · 區間取<strong>左閉右開 [0, 6)</strong>,right 初值是 <code>n</code> 而非 <code>n−1</code>。目標:找出<strong>第一個 ≥ target 的位置</strong>。' },

    { L:0, R:6, mid:3, ans:-1, act:'probe',
      eq:'mid = 0 + (6−0)/2 = 3 → nums[3] = 5 ≥ 9 ?  否',
      note:'nums[mid] < target → mid 太小,mid 及其左邊全部出局',
      text:'<strong>Round 1 · 探點</strong> · <code>mid = left + (right−left)/2 = 3</code>,<code>nums[3] = 5 &lt; 9</code>。5 比目標小,那 5 和它左邊的全都不可能是答案。' },

    { L:4, R:6, mid:-1, ans:-1, act:'shrink-l',
      eq:'left = mid + 1 = 4 → 區間縮為 [4, 6)',
      note:'注意是 mid + 1:mid 已被判定不可能,不留',
      text:'<strong>Round 1 · 收縮</strong> · <code>left = mid + 1 = 4</code>。因為 <code>nums[mid] &lt; target</code> 已證明 mid <strong>不可能</strong>是答案,所以連 mid 一起丟掉 —— 這個 <code>+1</code> 是迴圈能終止的關鍵。' },

    { L:4, R:6, mid:5, ans:-1, act:'probe',
      eq:'mid = 4 + (6−4)/2 = 5 → nums[5] = 12 ≥ 9 ?  是',
      note:'nums[mid] ≥ target → mid 本身還可能是答案,要保留',
      text:'<strong>Round 2 · 探點</strong> · <code>mid = 5</code>,<code>nums[5] = 12 ≥ 9</code>。12 已經夠大,答案在 <strong>mid 或 mid 左邊</strong>,右半可以丟。' },

    { L:4, R:5, mid:-1, ans:-1, act:'shrink-r',
      eq:'right = mid = 5 → 區間縮為 [4, 5)',
      note:'這裡是 right = mid(不是 mid − 1):mid 還在候選裡',
      text:'<strong>Round 2 · 收縮</strong> · <code>right = mid = 5</code>,<strong>不減 1</strong>。因為右開區間 <code>[left, right)</code> 本來就不含 right,寫 <code>right = mid</code> 剛好把 mid 留在候選中。' },

    { L:4, R:5, mid:4, ans:-1, act:'probe',
      eq:'mid = 4 + (5−4)/2 = 4 → nums[4] = 9 ≥ 9 ?  是',
      note:'相等也走 ≥ 這一邊 → 這就是「取最左」的來源',
      text:'<strong>Round 3 · 探點</strong> · <code>mid = 4</code>,<code>nums[4] = 9 ≥ 9</code>(相等)。<strong>等號歸在 ≥ 這側</strong>,所以指標會一路往左壓,最後停在<strong>最左邊</strong>的 target。' },

    { L:4, R:4, mid:-1, ans:-1, act:'empty',
      eq:'right = mid = 4 → left == right == 4,區間空',
      note:'left < right 不成立 → 跳出迴圈',
      text:'<strong>Round 3 · 收縮</strong> · <code>right = 4</code>,此時 <code>left == right == 4</code>,區間 <code>[4, 4)</code> 是<strong>空的</strong> → <code>while (left &lt; right)</code> 條件不成立,迴圈結束。' },

    { L:4, R:4, mid:-1, ans:4, act:'done',
      eq:'left = 4 < n,且 nums[4] == 9 → return 4',
      note:'二分只保證「位置」,是否命中要另外驗一次',
      text:'<strong>完成</strong> · 迴圈只給出「第一個 ≥ 9 的位置 = 4」。還要補兩道檢查:<code>left != n</code>(沒有越界)且 <code>nums[left] == target</code> → 回傳 <strong>4</strong>。' },
  ];

  let step = 0, timer = null;

  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||340; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function triUp(cx,cy,col){ ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx-6,cy+8); ctx.lineTo(cx+6,cy+8); ctx.closePath(); ctx.fillStyle=col; ctx.fill(); }

  function draw(){
    fit();
    const s = steps[step], w = canvas.clientWidth, PAD = 34, n = A.length;
    const done = s.act === 'done';
    ctx.fillStyle = C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);

    // 幾何:所有 band 都是水平帶狀,彼此不重疊
    const cw = Math.min(64, (w - 2*PAD) / n - 12);
    const gap = (w - 2*PAD - n*cw) / (n - 1);
    const edge = k => PAD + k * (cw + gap);           // 第 k 格左緣;k==n 時給最後一格右緣
    const rightEdge = k => (k >= n ? edge(n-1) + cw : edge(k));
    const cx = k => edge(k) + cw/2;

    const HDR_Y = 60;        // 索引標頭(textBaseline=top,占 60–70)
    const CELL_TOP = 86;     // 值格上緣 —— 距標頭 16px,絕不相黏
    const CELL_H = 46;
    const CELL_BOT = CELL_TOP + CELL_H;   // 132

    // ── BAND 1 · nums ──
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · nums(藍=目前區間 · 紅=mid · 灰=已排除 · 綠=答案)', PAD, 16);
    ctx.textAlign='right'; ctx.font='700 12.5px "JetBrains Mono", monospace'; ctx.fillStyle=C.text;
    ctx.fillText('target = ' + TARGET, w - PAD, 16);

    // 區間括號(自成一列,不碰索引標頭)
    const BR_Y = 38;
    if (s.L < s.R) {
      const x1 = edge(s.L), x2 = rightEdge(s.R);
      ctx.strokeStyle = C.winS; ctx.lineWidth = 2; ctx.setLineDash([]);
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
      ctx.fillText('[ ' + s.L + ', ' + s.R + ' )  空區間 → 停', x1, BR_Y - 4);
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
      const isAns = done && k === s.ans;
      let bg = C.off, bd = C.offS, tx = C.offT;
      if (inWin) { bg = C.win; bd = C.winS; tx = C.winT; }
      if (isMid) { bg = C.cur; bd = C.curS; tx = C.curT; }
      if (isAns) { bg = C.grn; bd = C.grnS; tx = C.grnT; }
      rr(edge(k), CELL_TOP, cw, CELL_H, 5);
      ctx.fillStyle = bg; ctx.fill();
      ctx.lineWidth = (isMid || isAns) ? 3 : 1.6; ctx.strokeStyle = bd; ctx.stroke();
      ctx.fillStyle = tx; ctx.font='700 16px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(A[k]), cx(k), CELL_TOP + CELL_H/2);
    }

    // 指標列 A:mid(紅)—— 獨立一列
    const MID_Y = CELL_BOT + 8;      // 140
    if (s.mid >= 0) {
      triUp(cx(s.mid), MID_Y, C.curS);
      ctx.fillStyle = C.curT; ctx.font='700 11px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='top';
      ctx.fillText('mid=' + s.mid, cx(s.mid), MID_Y + 10);
    }

    // 指標列 B:left / right(藍)—— 再低一列,不與 mid 打架
    const LR_Y = CELL_BOT + 44;      // 176
    ctx.font='700 11px "JetBrains Mono", monospace'; ctx.textBaseline='top'; ctx.textAlign='center';
    const px = k => (k >= n ? rightEdge(n) : cx(k));
    if (s.L === s.R) {                       // 兩指標重合 → 併成一個標籤,避免疊字
      ctx.fillStyle = done ? C.grnT : C.offT;
      ctx.fillText('left = right = ' + s.L, px(s.L), LR_Y);
    } else {
      ctx.fillStyle = C.winT; ctx.fillText('left=' + s.L, px(s.L), LR_Y);
      ctx.fillStyle = C.winT; ctx.fillText('right=' + s.R, px(s.R), LR_Y);
    }

    // ── BAND 2 · 判斷式 ──
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

    // ── BAND 3 · 這一步的決定 ──
    const B3 = 288;
    ctx.fillStyle=C.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · ≥ target 就保留 mid(right = mid);< target 就丟掉 mid(left = mid + 1)', PAD, B3);
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
