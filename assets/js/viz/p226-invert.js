/* ============================================================
   P226 · Invert Binary Tree — 遞迴 · viz
   這份寫法「先遞迴、後 swap」,所以交換發生在回程(後序):
     root->left  = invertTree(root->left);
     root->right = invertTree(root->right);
     swap(root->left, root->right);     // ← 兩棵子樹都翻好了,才換自己的
   動畫要傳達的一件事:root 的 swap 是「最後一步」,不是第一步。
   swap 順序 1 → 3 → 2 → 6 → 9 → 7 → 4(實測 trace),完全是後序。
     BAND 1  樹狀圖(位置會真的左右對調,反映當下的樹)
     BAND 2  這一步執行哪一行 + 呼叫堆疊深度
     BAND 3  目前的層序輸出
     BAND 4  為什麼
   例 [4,2,7,1,3,6,9] → [4,7,2,9,6,3,1]
   所有狀態取自實測 trace(A1 fact sheet),未手推。
   前綴 v226- 。
   ============================================================ */
(function () {
  const canvas = document.getElementById('v226-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('v226-step'), labelEl = document.getElementById('v226-label');
  const bPrev = document.getElementById('v226-prev'), bNext = document.getElementById('v226-next'),
        bPlay = document.getElementById('v226-play'), bReset = document.getElementById('v226-reset');

  const C = { paper:'#ffffff', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf',
    win:'#e3edf5', winS:'#4478c0', winT:'#2f5f9e',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424',
    ok:'#d9e8c7', okS:'#5fa866', okT:'#3f7a3a',
    off:'#f0f0ec', offS:'#cfcfcf', offT:'#a3a099', coral:'#cf3535' };

  /* 完美樹 [4,2,7,1,3,6,9] —— 用 heap 索引:1 是根,2i / 2i+1 是左右
     每一步給一個「索引 → 值」的快照,swap 就是把兩棵子樹整塊搬過去。 */
  const L0 = { 1:4, 2:2, 3:7, 4:1, 5:3, 6:6, 7:9 };   // 原樹
  const S1 = { 1:4, 2:2, 3:7, 4:1, 5:3, 6:6, 7:9 };   // 葉子 swap 無效果
  const S2 = { 1:4, 2:2, 3:7, 4:3, 5:1, 6:6, 7:9 };   // node 2 交換 1 <-> 3
  const S3 = { 1:4, 2:2, 3:7, 4:3, 5:1, 6:9, 7:6 };   // node 7 交換 6 <-> 9
  const S4 = { 1:4, 2:7, 3:2, 4:9, 5:6, 6:3, 7:1 };   // 根交換整塊左右子樹

  const S = (tree, focus, swapped, phase, depth, eq, note, text) =>
    ({ tree, focus, swapped, phase, depth, eq, note, text });

  const steps = [
    S(L0, -1, [], 'intro', 0,
      'invertTree(root)   // 先遞迴,最後才 swap',
      '這份寫法的 swap 在兩個遞迴之後 ⇒ 交換發生在「回程」',
      '<strong>INITIAL</strong> · 原樹 <code>[4,2,7,1,3,6,9]</code>。這份程式碼<strong>先遞迴、後 swap</strong>,所以交換<strong>不是</strong>從根開始往下做,而是<strong>從葉子往上做</strong>。<b>根的那次 swap 會是最後一步。</b>'),

    S(L0, 4, [], 'down', 3,
      '下潛 4 → 2 → 1,途中不交換任何東西',
      '下潛的路上什麼都不做 —— 和後序走訪完全一樣的節奏',
      '<strong>下潛</strong> · 一路呼叫到最左的葉節點 <code>1</code>。<strong>途中兩行都是遞迴呼叫,沒有任何 swap 被執行</strong>。堆疊深度 3。'),

    S(S1, 4, [4], 'swap', 3,
      'swap 於節點 1:left=null <-> right=null(無效果)',
      '葉節點也照樣執行 swap —— 只是交換兩個 nullptr,什麼都沒變',
      '<strong>swap 節點 1</strong> · 葉節點。它的左右<strong>都是 <code>nullptr</code></strong>,所以這次 swap <strong>什麼都沒改變</strong>。<b>但程式碼裡沒有「這是葉節點嗎」的判斷</b> —— 葉節點照樣跑完整流程,只是交換兩個空指標。實測:與 <code>nullptr</code> 交換是<strong>完全良定義</strong>的,不會遺失任何東西。'),

    S(S2, 2, [4,5,2], 'swap', 2,
      'swap 於節點 2:left=子樹(1) <-> right=子樹(3)',
      '節點 2 的兩棵子樹都翻好了,現在才換它自己的',
      '<strong>swap 節點 2</strong> · 節點 <code>3</code> 也做完之後(同樣是無效果的葉子 swap),回到節點 <code>2</code>。<strong>它的左右兩棵子樹都已經處理完</strong>,現在把它們<strong>整塊對調</strong>:<code>1</code> 和 <code>3</code> 換位置。<b>注意這是換「子樹指標」,不是換「值」。</b>'),

    S(S3, 3, [4,5,2,6,7,3], 'swap', 2,
      'swap 於節點 7:left=子樹(6) <-> right=子樹(9)',
      '右半邊同樣的流程 —— 先葉子、再父節點',
      '<strong>swap 節點 7</strong> · 換到右半邊。節點 <code>6</code> 和 <code>9</code> 先各自做完無效果的葉子 swap,然後節點 <code>7</code> 把它們<strong>整塊對調</strong>。<strong>到這裡,除了根以外的每個節點都處理完了。</strong>'),

    S(S4, 1, [1,2,3,4,5,6,7], 'swap', 1,
      'swap 於根節點 4:left=子樹(2) <-> right=子樹(7)',
      '根的 swap 是「最後一步」—— 此時兩棵子樹內部早就翻好了',
      '<strong>swap 根節點 4</strong> · <b>最後一步。</b>此時左子樹已經是 <code>2(3,1)</code>、右子樹已經是 <code>7(9,6)</code> —— <strong>它們內部早就翻好了</strong>,根只需要把<strong>這兩整塊</strong>對調。<b>swap 的發生順序是 1 → 3 → 2 → 6 → 9 → 7 → 4,完全是後序</b>。'),

    S(S4, -1, [1,2,3,4,5,6,7], 'done', 0,
      'return root = [4,7,2,9,6,3,1]',
      '實測 2000 棵樹:節點位址集合前後完全相同 —— 零配置',
      '<strong>完成</strong> · <code>[4,7,2,9,6,3,1]</code>。<strong>全程零配置</strong> —— 實測 2000 棵隨機樹,<strong>節點位址集合前後完全相同(2000/2000)</strong>,回傳的指標也<strong>永遠是傳進來的那個 root(2000/2000)</strong>。實測 <strong>20 萬組</strong>對拍獨立的 BFS 版本,<strong>不一致 0</strong>。時間 <code>O(n)</code>,空間 <code>O(h)</code>。'),
  ];

  let step = 0, timer = null;

  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||420; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  const TREE_TOP = 26, ROW_H = 52, R = 18;
  /* heap 索引 1..7 的畫面位置:row = floor(log2(i)),col 由該層均分 */
  const POS = { 1:[3.5,0], 2:[1.5,1], 3:[5.5,1], 4:[0.5,2], 5:[2.5,2], 6:[4.5,2], 7:[6.5,2] };
  const NCOL = 8, NROW = 3;

  function draw(){
    fit();
    const s = steps[step], w = canvas.clientWidth, PAD = 30;
    const done = s.phase === 'done';
    ctx.fillStyle = C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);

    const usable = w - 2*PAD;
    const colW = usable / NCOL;
    const nx = i => PAD + (POS[i][0] + 0.5) * colW;
    const ny = i => TREE_TOP + 20 + POS[i][1] * ROW_H;
    const swapped = new Set(s.swapped);

    // ── BAND 1 標題 ──
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 灰 = 還沒處理　紅 = 這一步 swap　藍 = 已翻好　綠 = 完成', PAD, 16);
    ctx.textAlign='right'; ctx.font='700 12.5px "JetBrains Mono", monospace';
    ctx.fillStyle = done ? C.okT : C.text;
    ctx.fillText(done ? '完成' : ('呼叫堆疊深度 ' + s.depth), w - PAD, 16);

    // ── 邊 ──
    ctx.lineWidth = 1.8;
    for (let i = 1; i <= 3; i++) {
      [2*i, 2*i+1].forEach(c => {
        if (!POS[c]) return;
        const bothDone = swapped.has(i) && swapped.has(c);
        ctx.strokeStyle = done ? C.okS : (bothDone ? C.winS : C.grid);
        ctx.beginPath(); ctx.moveTo(nx(i), ny(i) + R - 2); ctx.lineTo(nx(c), ny(c) - R + 2); ctx.stroke();
      });
    }

    // ── 節點 ──
    for (let i = 1; i <= 7; i++) {
      let bg = C.off, bd = C.offS, tx = C.offT;
      const isFocus = i === s.focus && (s.phase === 'swap' || s.phase === 'down');
      if (done)                { bg = C.ok;  bd = C.okS;  tx = C.okT; }
      else if (isFocus)        { bg = C.cur; bd = C.curS; tx = C.curT; }
      else if (swapped.has(i)) { bg = C.win; bd = C.winS; tx = C.winT; }
      ctx.beginPath(); ctx.arc(nx(i), ny(i), R, 0, Math.PI*2);
      ctx.fillStyle = bg; ctx.fill();
      ctx.lineWidth = isFocus ? 2.6 : 1.6; ctx.strokeStyle = bd; ctx.stroke();
      ctx.fillStyle = tx; ctx.font='700 16px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(s.tree[i]), nx(i), ny(i));
    }

    // ── BAND 2 ──
    const B2 = TREE_TOP + 20 + NROW * ROW_H + 6;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 這一步執行的那一行', PAD, B2);
    rr(PAD, B2 + 10, w - 2*PAD, 40, 6);
    const hot = s.phase === 'swap';
    ctx.fillStyle = done ? C.ok : (hot ? C.cur : '#fafaf6'); ctx.fill();
    ctx.lineWidth = 1.6; ctx.strokeStyle = done ? C.okS : (hot ? C.curS : C.grid); ctx.stroke();
    ctx.fillStyle = done ? C.okT : (hot ? C.curT : C.text);
    ctx.font='700 12.5px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(s.eq, w/2, B2 + 30);

    // ── BAND 3 · 層序輸出 ──
    const B3 = B2 + 68;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 目前的層序輸出', PAD, B3);
    const CN = 7, cw = Math.min(44, (w - 2*PAD) / CN - 8), cgap = 8;
    const totalW = CN * cw + (CN - 1) * cgap;
    const cx0 = PAD + Math.max(0, ((w - 2*PAD) - totalW) / 2);
    const cellTop = B3 + 14;
    for (let i = 1; i <= CN; i++) {
      const x = cx0 + (i-1) * (cw + cgap);
      const moved = swapped.has(i) || done;
      rr(x, cellTop, cw, 34, 5);
      ctx.fillStyle = done ? C.ok : (moved ? C.win : '#fafaf6'); ctx.fill();
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = done ? C.okS : (moved ? C.winS : C.grid); ctx.stroke();
      ctx.fillStyle = done ? C.okT : (moved ? C.winT : C.text);
      ctx.font='700 14px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(s.tree[i]), x + cw/2, cellTop + 17);
    }

    // ── BAND 4 ──
    const B4 = cellTop + 34 + 22;
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
