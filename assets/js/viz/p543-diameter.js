/* ============================================================
   P543 · Diameter of Binary Tree — 遞迴 · viz
     int path(TreeNode* root) {
       if (root == nullptr) return 0;
       int left = path(root->left), right = path(root->right);
       longestPath = max(longestPath, left + right);   // ← 在每個節點都試一次
       return 1 + max(left, right);                    // ← 和 104 一模一樣
     }
   動畫要傳達的一件事:longestPath 必須在「每一個節點」上更新,
   因為直徑不一定通過根 —— 實測 626 種樹形有 48 種(7.67%)不通過根。
     BAND 1  樹狀圖:節點旁標「回傳的高度」,節點下標「穿過它的候選直徑」
     BAND 2  這一步的兩個算式
     BAND 3  longestPath 目前的值
     BAND 4  為什麼
   例 [1,2,3,4,5] → 3
   所有狀態取自實測 trace(A1 fact sheet),未手推。
   前綴 v543- 。
   ============================================================ */
(function () {
  const canvas = document.getElementById('v543-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('v543-step'), labelEl = document.getElementById('v543-label');
  const bPrev = document.getElementById('v543-prev'), bNext = document.getElementById('v543-next'),
        bPlay = document.getElementById('v543-play'), bReset = document.getElementById('v543-reset');

  const C = { paper:'#ffffff', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf',
    win:'#e3edf5', winS:'#4478c0', winT:'#2f5f9e',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424',
    ok:'#d9e8c7', okS:'#5fa866', okT:'#3f7a3a',
    off:'#f0f0ec', offS:'#cfcfcf', offT:'#a3a099', coral:'#cf3535' };

  /* [1,2,3,4,5] —— heap 索引 1..5 */
  const V = { 1:1, 2:2, 3:3, 4:4, 5:5 };
  const POS = { 1:[3.5,0], 2:[1.5,1], 3:[5.5,1], 4:[0.5,2], 5:[2.5,2] };
  const IDS = [1,2,3,4,5];
  const NCOL = 8, NROW = 3;

  /* ret = 已算出的回傳高度;cand = 已試算過的 left+right 候選 */
  const S = (ret, cand, focus, best, phase, eq, note, text) =>
    ({ ret, cand, focus, best, phase, eq, note, text });

  const steps = [
    S({}, {}, -1, 0, 'intro',
      'path(root) 回傳高度,順便在每個節點更新 longestPath',
      '一趟遞迴同時做兩件事:回報高度給父節點、更新全域最大直徑',
      '<strong>INITIAL</strong> · 樹 <code>[1,2,3,4,5]</code>,<code>longestPath = 0</code>。這題的骨架<strong>就是 104 求深度</strong>,只多了中間一行。<b>遞迴一趟同時做兩件事:<em>回報</em>高度給父節點,以及<em>更新</em>全域最大直徑。</b>'),

    S({4:1}, {4:0}, 4, 0, 'calc',
      '節點 4:  left=0  right=0\ncandidate = 0+0 = 0     longestPath 0 → 0(不變)',
      '葉節點穿過自己的路徑長度是 0 條邊 —— 不會更新最大值',
      '<strong>節點 4</strong> · 葉節點,左右都回 <code>0</code>。<strong>候選 = <code>0+0 = 0</code></strong>,沒有超過目前的 <code>longestPath</code>,不更新。回傳 <code>1+max(0,0) = 1</code>。<b>注意:回傳的是「節點數高度」,而候選算的是「邊數」—— 兩個單位不同,但這樣剛好是對的。</b>'),

    S({4:1,5:1}, {4:0,5:0}, 5, 0, 'calc',
      '節點 5:  left=0  right=0\ncandidate = 0     longestPath 0 → 0(不變)',
      '另一個葉節點,同樣不更新',
      '<strong>節點 5</strong> · 一樣是葉節點,回傳 <code>1</code>,候選 <code>0</code>。<strong>現在節點 2 的左右兩個高度都齊了</strong>,下一步才輪到它。'),

    S({4:1,5:1,2:2}, {4:0,5:0,2:2}, 2, 2, 'update',
      '節點 2:  left=1  right=1\ncandidate = 1+1 = 2     longestPath 0 → 2 ← 更新!',
      '穿過節點 2 的最長路徑是 4 → 2 → 5,共 2 條邊',
      '<strong>節點 2 更新了最大值</strong> · 左右各回 <code>1</code>,<strong>候選 = <code>1+1 = 2</code></strong>,超過 <code>0</code> → <code>longestPath</code> 變成 <strong>2</strong>。<b>這條路徑是 <code>4 → 2 → 5</code>,它<em>穿過節點 2</em>,而不是穿過根。</b>回傳 <code>1+max(1,1) = 2</code>。'),

    S({4:1,5:1,2:2,3:1}, {4:0,5:0,2:2,3:0}, 3, 2, 'calc',
      '節點 3:  left=0  right=0\ncandidate = 0     longestPath 2 → 2(不變)',
      '右子樹是葉節點,候選 0 不足以更新',
      '<strong>節點 3</strong> · 根的右小孩,是葉節點。候選 <code>0</code>,<strong>不更新</strong>。回傳 <code>1</code>。<strong>現在根節點的左右高度都齊了(左 2、右 1)。</strong>'),

    S({4:1,5:1,2:2,3:1,1:3}, {4:0,5:0,2:2,3:0,1:3}, 1, 3, 'update',
      '節點 1(根):  left=2  right=1\ncandidate = 2+1 = 3     longestPath 2 → 3 ← 更新!',
      '穿過根的路徑是 4 → 2 → 1 → 3,共 3 條邊 —— 這次根贏了',
      '<strong>根節點更新了最大值</strong> · 左邊回 <code>2</code>、右邊回 <code>1</code>,<strong>候選 = <code>2+1 = 3</code></strong> → <code>longestPath</code> 變成 <strong>3</strong>。路徑是 <code>4 → 2 → 1 → 3</code>。<b>這一題根剛好贏了,但<em>不一定</em>如此 —— 實測 626 種樹形有 48 種(7.67%)的直徑<em>不通過根</em>。</b>'),

    S({4:1,5:1,2:2,3:1,1:3}, {4:0,5:0,2:2,3:0,1:3}, -1, 3, 'done',
      'return longestPath = 3',
      '實測 20 萬組對拍 O(n²) 暴力解,不一致 0',
      '<strong>完成</strong> · 答案 <strong>3</strong> 條邊。<strong>11 次 path() 呼叫</strong>(5 實節點 + 6 個 nullptr = 2n+1),<strong>2 次更新</strong>(節點 2 的 0→2、根的 2→3)。實測 <strong>20 萬組</strong>對拍獨立的 <code>O(n²)</code> 暴力解(對每個節點各算一次左右高度),<strong>不一致 0</strong>。時間 <code>O(n)</code>,空間 <code>O(h)</code>。'),
  ];

  let step = 0, timer = null;

  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||440; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  const TREE_TOP = 30, ROW_H = 58, R = 19;

  function draw(){
    fit();
    const s = steps[step], w = canvas.clientWidth, PAD = 30;
    const done = s.phase === 'done';
    ctx.fillStyle = C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);

    const colW = (w - 2*PAD) / NCOL;
    const nx = i => PAD + (POS[i][0] + 0.5) * colW;
    const ny = i => TREE_TOP + 24 + POS[i][1] * ROW_H;

    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 右上角 = 回傳的高度　下方 = 穿過它的候選直徑(左+右)', PAD, 16);

    ctx.lineWidth = 1.8;
    IDS.forEach(i => {
      [2*i, 2*i+1].forEach(c => {
        if (!POS[c]) return;
        const both = s.ret[i] !== undefined && s.ret[c] !== undefined;
        ctx.strokeStyle = done ? C.okS : (both ? C.winS : C.grid);
        ctx.beginPath(); ctx.moveTo(nx(i), ny(i) + R - 2); ctx.lineTo(nx(c), ny(c) - R + 2); ctx.stroke();
      });
    });

    IDS.forEach(i => {
      const has = s.ret[i] !== undefined;
      let bg = C.off, bd = C.offS, tx = C.offT;
      if (done)              { bg = C.ok;  bd = C.okS;  tx = C.okT; }
      else if (i === s.focus){ bg = C.cur; bd = C.curS; tx = C.curT; }
      else if (has)          { bg = C.win; bd = C.winS; tx = C.winT; }
      ctx.beginPath(); ctx.arc(nx(i), ny(i), R, 0, Math.PI*2);
      ctx.fillStyle = bg; ctx.fill();
      ctx.lineWidth = i === s.focus ? 2.6 : 1.6; ctx.strokeStyle = bd; ctx.stroke();
      ctx.fillStyle = tx; ctx.font='700 15px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(V[i]), nx(i), ny(i));

      // 回傳高度:右上角
      if (has) {
        const bx = nx(i) + R - 2, by = ny(i) - R - 13;
        rr(bx, by, 24, 19, 4);
        ctx.fillStyle = done ? C.ok : (i === s.focus ? C.cur : C.win); ctx.fill();
        ctx.lineWidth = 1.4; ctx.strokeStyle = done ? C.okS : (i === s.focus ? C.curS : C.winS); ctx.stroke();
        ctx.fillStyle = done ? C.okT : (i === s.focus ? C.curT : C.winT);
        ctx.font='700 12px "JetBrains Mono", monospace';
        ctx.fillText(String(s.ret[i]), bx + 12, by + 10);
      }
      // 候選直徑:節點正下方
      if (s.cand[i] !== undefined) {
        const isBest = s.cand[i] === s.best && s.cand[i] > 0;
        ctx.fillStyle = done ? C.okT : (isBest ? C.curT : C.dim);
        ctx.font = (isBest ? '700 ' : '600 ') + '11.5px "JetBrains Mono", monospace';
        ctx.textAlign='center'; ctx.textBaseline='top';
        ctx.fillText('候選 ' + s.cand[i], nx(i), ny(i) + R + 4);
      }
    });

    // BAND 2
    const B2 = TREE_TOP + 24 + NROW * ROW_H + 6;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 這一步的兩個算式', PAD, B2);
    const lines = s.eq.split('\n');
    const bh2 = lines.length > 1 ? 54 : 40;
    rr(PAD, B2 + 10, w - 2*PAD, bh2, 6);
    const hot = s.phase === 'update';
    ctx.fillStyle = done ? C.ok : (hot ? C.cur : '#fafaf6'); ctx.fill();
    ctx.lineWidth = 1.6; ctx.strokeStyle = done ? C.okS : (hot ? C.curS : C.grid); ctx.stroke();
    ctx.fillStyle = done ? C.okT : (hot ? C.curT : C.text);
    ctx.font='700 12.5px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
    if (lines.length > 1) { ctx.fillText(lines[0], w/2, B2 + 26); ctx.fillText(lines[1], w/2, B2 + 47); }
    else                  { ctx.fillText(lines[0], w/2, B2 + 30); }

    // BAND 3 · longestPath
    const B3 = B2 + bh2 + 30;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · longestPath(全域最大)', PAD, B3);
    rr(PAD, B3 + 12, 120, 32, 5);
    ctx.fillStyle = done ? C.ok : (hot ? C.cur : C.win); ctx.fill();
    ctx.lineWidth = hot ? 2.4 : 1.4;
    ctx.strokeStyle = done ? C.okS : (hot ? C.curS : C.winS); ctx.stroke();
    ctx.fillStyle = done ? C.okT : (hot ? C.curT : C.winT);
    ctx.font='700 15px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(String(s.best), PAD + 60, B3 + 28);

    // BAND 4
    const B4 = B3 + 62;
    ctx.fillStyle=C.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 4 · 為什麼', PAD, B4);
    rr(PAD, B4 + 10, w - 2*PAD, 40, 6);
    ctx.fillStyle = done ? C.ok : '#fafaf6'; ctx.fill();
    ctx.lineWidth = 1.6; ctx.strokeStyle = done ? C.okS : C.grid; ctx.stroke();
    ctx.fillStyle = done ? C.okT : C.text;
    ctx.font='600 12.5px "Noto Sans TC", sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(s.note, w/2, B4 + 30);
  }

  function update(){ if(stepEl) stepEl.textContent=String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0'); if(labelEl) labelEl.innerHTML=steps[step].text; draw(); }
  function next(){ if(step<steps.length-1){step++;update();}else stop(); }
  function prev(){ if(step>0){step--;update();} }
  function reset(){ stop(); step=0; update(); }
  function play(){ if(timer){stop();return;} bPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){stop();return;} next(); },1950); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} if(bPlay) bPlay.textContent='Play'; }
  bPrev&&bPrev.addEventListener('click',prev); bNext&&bNext.addEventListener('click',next); bPlay&&bPlay.addEventListener('click',play); bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();}); if(window.ResizeObserver){ new ResizeObserver(()=>{fit();draw();}).observe(canvas); }
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw); fit(); update();
})();
