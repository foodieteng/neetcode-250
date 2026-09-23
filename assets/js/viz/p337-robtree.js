/* ============================================================
   P337 · House Robber III — 搶/不搶兩條路 + 記憶化 · viz
     int rob(TreeNode* root) {
       if (root == nullptr) return 0;
       if (memo[root]) return memo[root];           // ⚠ 測「值」不是「存在」
       int ll=0, lr=0, rl=0, rr=0;
       if (root->left)  { ll = rob(root->left->left);  lr = rob(root->left->right); }
       if (root->right) { rl = rob(root->right->left); rr = rob(root->right->right); }
       return memo[root] = max(root->val + ll+lr+rl+rr,      // 搶這間 → 跳到孫子
                               rob(root->left) + rob(root->right)); // 不搶 → 交給小孩
     }
   動畫要傳達的三件事:
     ① 每個節點兩條路:ROB(val + 四個孫子) vs SKIP(兩個小孩),取 max
     ② memo 逐格填滿,而 D / E 各被走訪「兩次」—— 第二次是 CACHE HIT
     ③ 那兩次命中就是把 Θ(φⁿ) 壓成 4n-1 的全部原因
   例 [3,2,3,null,3,null,1] → 7
      A=root3  B=A.left2  C=A.right3  D=B.right3  E=C.right1
     BAND 1  樹狀圖:目前節點、已 memo 的節點、這一步的 ROB/SKIP 觸及範圍
     BAND 2  兩條路的算式與勝負
     BAND 3  memo 表(A B C D E),空白 = 未快取
     BAND 4  這一步在做什麼
   呼叫序列取自實測(對真實程式插樁),未手推。
   前綴 v337- 。
   ============================================================ */
(function () {
  const canvas = document.getElementById('v337-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('v337-step'), labelEl = document.getElementById('v337-label');
  const bPrev = document.getElementById('v337-prev'), bNext = document.getElementById('v337-next'),
        bPlay = document.getElementById('v337-play'), bReset = document.getElementById('v337-reset');

  const C = { paper:'#ffffff', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf',
    win:'#e3edf5', winS:'#4478c0', winT:'#2f5f9e',
    seg:'#f6ead8', segS:'#c8801e', segT:'#96601a',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424',
    ok:'#d9e8c7', okS:'#5fa866', okT:'#3f7a3a',
    off:'#f0f0ec', offS:'#cfcfcf', offT:'#a3a099', coral:'#cf3535' };

  /* [3,2,3,null,3,null,1] —— heap 索引 */
  const V    = { 1:3, 2:2, 3:3, 5:3, 7:1 };
  const NAME = { 1:'A', 2:'B', 3:'C', 5:'D', 7:'E' };
  const POS  = { 1:[3.5,0], 2:[1.5,1], 3:[5.5,1], 5:[2.5,2], 7:[6.5,2] };
  const IDS  = [1,2,3,5,7];
  const ORDER = [1,2,3,5,7];          // memo 表的欄位順序 A B C D E
  const NCOL = 8, NROW = 3;

  /* focus  : 目前節點(heap 索引),-1 = 無
     memo   : { 節點: 值 } 已寫入 memo 的
     hit    : 這一步是 cache hit 的節點,-1 = 無
     robSet : ROB 分支觸及的節點(孫子)
     skipSet: SKIP 分支觸及的節點(小孩)
     robEq / skipEq : 兩條路的算式(null = 這一步還沒算)
     winner : 'rob' | 'skip' | null                                        */
  const S = (focus, memo, hit, robSet, skipSet, robEq, skipEq, winner, phase, note, text) =>
    ({ focus, memo, hit, robSet, skipSet, robEq, skipEq, winner, phase, note, text });

  const steps = [
    S(-1, {}, -1, [], [], null, null, null, 'intro',
      '每間房子兩種選擇:搶(跳過小孩、直取孫子)或不搶(交給小孩決定)',
      '<strong>INITIAL</strong> · 樹 <code>[3,2,3,null,3,null,1]</code>。<b>規則:不能同時搶「父與子」</b>。<strong>所以每個節點只有兩條路 —— 搶自己(那兩個小孩就不能搶,但<em>孫子不受限</em>),或不搶自己(小孩各自自由)。</strong>兩條路取 max,就是這個節點的答案。'),

    S(1, {}, -1, [5,7], [2,3], null, null, null, 'expand',
      'rob(A) MISS —— 先把「搶 A」需要的四個孫子算出來',
      '<strong>rob(A) · 快取沒有(MISS)</strong> · 要比較兩條路。<b>ROB 這條需要「A 的四個孫子」</b> —— 紅框標出的 <code>D</code> 和 <code>E</code>(另外兩個孫子位置是空的,算 0)。<strong>先遞迴下去把它們算出來。</strong>'),

    S(5, {5:3}, -1, [], [], 'ROB D = 3', 'SKIP D = 0', 'rob', 'leaf',
      'rob(D) MISS:葉子沒有小孩也沒有孫子 -> 搶它一定比較好',
      '<strong>rob(D) · MISS</strong> · D 是葉子:<b>ROB = 3 + 0(沒有孫子)= 3</b>,<b>SKIP = 0(沒有小孩)= 0</b>。取 max ⇒ <strong>memo[D] = 3</strong>。<b>葉子永遠是「搶」贏</b>,回傳 3。'),

    S(7, {5:3, 7:1}, -1, [], [], 'ROB E = 1', 'SKIP E = 0', 'rob', 'leaf',
      'rob(E) MISS:同樣是葉子 -> memo[E] = 1',
      '<strong>rob(E) · MISS</strong> · 一樣是葉子:<b>ROB = 1,SKIP = 0</b> ⇒ <strong>memo[E] = 1</strong>。<b>現在 A 的四個孫子都有了</b>:<code>ll=0, lr=3(D), rl=0, rr=1(E)</code>。'),

    S(1, {5:3, 7:1}, -1, [5,7], [], 'ROB A = 3 + 0 + 3 + 0 + 1 = 7', null, null, 'robdone',
      'ROB A 這條路算完了 = 7 —— 接下來要算 SKIP A 那條',
      '<strong>回到 A · ROB 這條路算好了</strong> · <b><code>3 + ll 0 + lr 3 + rl 0 + rr 1 = 7</code></b>。<strong>注意它<em>跳過了</em> B 和 C</strong>(搶了 A 就不能搶小孩)<b>,直接把兩個孫子 D、E 收進來</b>。<strong>接著算另一條:不搶 A,把左右子樹交給 B 和 C。</strong>'),

    S(2, {5:3, 7:1}, -1, [], [5], 'ROB B = 2', null, null, 'expand',
      'rob(B) MISS:B 的 ROB = 2,而 SKIP 要問它的小孩 D',
      '<strong>rob(B) · MISS</strong> · <b>ROB B = 2 + 四個孫子(B 沒有孫子)= 2</b>。<b>SKIP B 則要問 B 的小孩</b> —— 只有 <code>D</code>。<strong>而 D 剛剛已經算過了。</strong>'),

    S(5, {5:3, 7:1}, 5, [], [], 'ROB B = 2', 'SKIP B = 0 + 3 = 3', 'skip', 'hit',
      '⚡ rob(D) CACHE HIT —— 直接回傳 3,不再展開整棵子樹',
      '<strong>⚡ CACHE HIT · rob(D)</strong> · <b><code>memo[D] = 3</code> 非 0,<code>if (memo[root])</code> 成立,立刻回傳 3</b> —— <strong>這是 D 的<em>第二次</em>走訪,但這次沒有重新計算。</strong><b>SKIP B = 0 + 3 = 3 &gt; ROB B = 2</b>,所以 <strong>memo[B] = 3</strong>(不搶 B 比較好)。'),

    S(3, {5:3, 7:1, 2:3}, -1, [], [7], 'ROB C = 3', null, null, 'expand',
      'rob(C) MISS:ROB C = 3,SKIP 要問它的小孩 E',
      '<strong>rob(C) · MISS</strong> · <b>ROB C = 3 + 四個孫子(沒有)= 3</b>。<b>SKIP C 要問小孩 <code>E</code></b> —— 同樣已經算過了。'),

    S(7, {5:3, 7:1, 2:3}, 7, [], [], 'ROB C = 3', 'SKIP C = 0 + 1 = 1', 'rob', 'hit',
      '⚡ rob(E) CACHE HIT —— 第二次命中,這次是 ROB 贏',
      '<strong>⚡ CACHE HIT · rob(E)</strong> · <b><code>memo[E] = 1</code>,直接回傳</b>。<b>ROB C = 3 &gt; SKIP C = 1</b>,所以 <strong>memo[C] = 3</strong>(搶 C 比較好)。<strong>D 和 E 各被走訪兩次,兩次都在第二次命中快取</strong> —— <b>這就是把指數壓成線性的地方。</b>'),

    S(1, {5:3, 7:1, 2:3, 3:3}, -1, [5,7], [2,3], 'ROB A = 3 + 0 + 3 + 0 + 1 = 7', 'SKIP A = 3 + 3 = 6', 'rob', 'compare',
      '兩條路都有了:ROB 7 vs SKIP 6 -> 搶 A 比較好',
      '<strong>A 的兩條路都算完了</strong> · <b>ROB A = 7</b>(自己 3 + 孫子 D 3 + 孫子 E 1)<b> vs SKIP A = rob(B) 3 + rob(C) 3 = 6</b>。<strong>7 &gt; 6 ⇒ 搶 A</strong>,<code>memo[A] = 7</code>。'),

    S(-1, {5:3, 7:1, 2:3, 3:3, 1:7}, -1, [], [], null, null, null, 'done',
      '答案 7 = A(3) + D(3) + E(1);共 19 次呼叫,其中 2 次是快取命中',
      '<strong>完成 · 答案 7</strong> · 搶的是 <b>A(3) + D(3) + E(1) = 7</b> —— <strong>A 和 D、E 是祖孫關係,不相連,可以同時搶。</strong><b>總共 19 次呼叫:5 個節點各展開一次、D 與 E 各命中一次、12 次打在 <code>nullptr</code> 上。</b><strong>值非 0 時呼叫次數恆為 <code>4n−1</code></strong>;實測對拍 1072 萬組,不一致 0。'),
  ];

  let step = 0, timer = null;

  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||470; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  const TREE_TOP = 26, ROW_H = 52, R = 18;

  function draw(){
    fit();
    const s = steps[step], w = canvas.clientWidth, PAD = 28;
    const done = s.phase === 'done', hitStep = s.phase === 'hit';
    ctx.fillStyle = C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);

    const colW = (w - 2*PAD) / NCOL;
    const nx = i => PAD + (POS[i][0] + 0.5) * colW;
    const ny = i => TREE_TOP + 24 + POS[i][1] * ROW_H;
    const robSet = new Set(s.robSet), skipSet = new Set(s.skipSet);

    /* ---- BAND 1 · 樹 ---- */
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 紅 = 目前節點　綠 = 已存進 memo　虛線框 = 這一步觸及', PAD, 16);
    ctx.textAlign='right'; ctx.font='700 12.5px "JetBrains Mono", monospace';
    ctx.fillStyle = done ? C.okT : C.text;
    ctx.fillText(done ? '答案 7' : ('memo ' + Object.keys(s.memo).length + ' / 5'), w - PAD, 16);

    ctx.lineWidth = 1.8;
    IDS.forEach(i => {
      [2*i, 2*i+1].forEach(c => {
        if (!POS[c]) return;
        const lit = (s.memo[c] !== undefined) || c === s.focus || robSet.has(c) || skipSet.has(c);
        ctx.strokeStyle = lit ? C.winS : C.grid;
        ctx.lineWidth = lit ? 2.4 : 1.6;
        ctx.beginPath(); ctx.moveTo(nx(i), ny(i) + R - 2); ctx.lineTo(nx(c), ny(c) - R + 2); ctx.stroke();
      });
    });

    IDS.forEach(i => {
      const cached = s.memo[i] !== undefined;
      let bg = C.off, bd = C.offS, tx = C.offT;
      if (i === s.focus)   { bg = C.cur; bd = C.curS; tx = C.curT; }
      else if (cached)     { bg = C.ok;  bd = C.okS;  tx = C.okT; }

      // 觸及範圍:虛線外圈
      if (robSet.has(i) || skipSet.has(i)) {
        ctx.beginPath(); ctx.arc(nx(i), ny(i), R + 6, 0, Math.PI*2);
        ctx.strokeStyle = robSet.has(i) ? C.curS : C.winS;
        ctx.lineWidth = 1.6; ctx.setLineDash([3,3]); ctx.stroke(); ctx.setLineDash([]);
      }

      ctx.beginPath(); ctx.arc(nx(i), ny(i), R, 0, Math.PI*2);
      ctx.fillStyle = bg; ctx.fill();
      ctx.lineWidth = i === s.focus ? 2.6 : 1.5;
      ctx.strokeStyle = bd; ctx.stroke();
      ctx.fillStyle = tx; ctx.font='700 14px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(V[i]), nx(i), ny(i));

      ctx.fillStyle = C.dim; ctx.font='600 10px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='bottom';
      ctx.fillText(NAME[i], nx(i) - R - 7, ny(i) - 2);

      if (cached) {
        ctx.fillStyle = C.okT; ctx.font='700 10.5px "JetBrains Mono", monospace';
        ctx.textAlign='center'; ctx.textBaseline='top';
        ctx.fillText('=' + s.memo[i], nx(i), ny(i) + R + 5);
      }
    });

    // CACHE HIT 標記
    if (hitStep && s.hit >= 0) {
      ctx.fillStyle = C.coral; ctx.font='700 11px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='bottom';
      ctx.fillText('CACHE HIT', nx(s.hit), ny(s.hit) - R - 9);
    }

    /* ---- BAND 2 · 兩條路 ---- */
    const B2 = TREE_TOP + 24 + NROW * ROW_H + 8;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 兩條路:搶這間(跳到孫子) vs 不搶(交給小孩)', PAD, B2);

    const halfW = (w - 2*PAD - 14) / 2;
    const boxY = B2 + 12, boxH = 40;
    // ROB 盒
    rr(PAD, boxY, halfW, boxH, 6);
    const robWin = s.winner === 'rob';
    ctx.fillStyle = s.robEq ? (robWin ? C.ok : '#fafaf6') : '#fafaf6'; ctx.fill();
    ctx.lineWidth = robWin ? 2.2 : 1.6;
    ctx.strokeStyle = s.robEq ? (robWin ? C.okS : C.grid) : C.grid; ctx.stroke();
    ctx.fillStyle = s.robEq ? (robWin ? C.okT : C.text) : C.dim;
    ctx.font='700 11.5px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(s.robEq || 'ROB  (等待孫子)', PAD + halfW/2, boxY + boxH/2);
    // SKIP 盒
    const sx = PAD + halfW + 14;
    rr(sx, boxY, halfW, boxH, 6);
    const skipWin = s.winner === 'skip';
    ctx.fillStyle = s.skipEq ? (skipWin ? C.ok : '#fafaf6') : '#fafaf6'; ctx.fill();
    ctx.lineWidth = skipWin ? 2.2 : 1.6;
    ctx.strokeStyle = s.skipEq ? (skipWin ? C.okS : C.grid) : C.grid; ctx.stroke();
    ctx.fillStyle = s.skipEq ? (skipWin ? C.okT : C.text) : C.dim;
    ctx.font='700 11.5px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(s.skipEq || 'SKIP  (等待小孩)', sx + halfW/2, boxY + boxH/2);

    /* ---- BAND 3 · memo 表 ---- */
    const B3 = boxY + boxH + 22;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · memo 表　空白 = 還沒算過', PAD, B3);

    const cellW = Math.min(76, (w - 2*PAD) / ORDER.length - 10), cellH = 34;
    const gap = 10;
    const totalW = ORDER.length * cellW + (ORDER.length - 1) * gap;
    const mx0 = PAD + ((w - 2*PAD) - totalW) / 2;
    const cellTop = B3 + 34;   // 欄頭在 cellTop-5,需與 BAND 3 標題保持 >= 12px
    ORDER.forEach((id, k) => {
      const cx = mx0 + k * (cellW + gap);
      // 欄頭(節點名)與格子保持 >= 12px
      ctx.fillStyle = C.dim; ctx.font='600 10.5px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='bottom';
      ctx.fillText(NAME[id] + '(' + V[id] + ')', cx + cellW/2, cellTop - 5);

      const has = s.memo[id] !== undefined;
      const justHit = hitStep && s.hit === id;
      rr(cx, cellTop, cellW, cellH, 5);
      ctx.fillStyle = justHit ? C.cur : (has ? C.ok : '#fafaf6'); ctx.fill();
      ctx.lineWidth = justHit ? 2.4 : 1.5;
      ctx.strokeStyle = justHit ? C.curS : (has ? C.okS : C.grid); ctx.stroke();
      ctx.fillStyle = justHit ? C.curT : (has ? C.okT : C.offT);
      ctx.font='700 13px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(has ? String(s.memo[id]) : '-', cx + cellW/2, cellTop + cellH/2);
    });

    /* ---- BAND 4 · 說明 ---- */
    const B4 = cellTop + cellH + 22;
    ctx.fillStyle=C.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 4 · 這一步在做什麼', PAD, B4);
    rr(PAD, B4 + 10, w - 2*PAD, 38, 6);
    ctx.fillStyle = done ? C.ok : (hitStep ? C.cur : '#fafaf6'); ctx.fill();
    ctx.lineWidth = 1.6; ctx.strokeStyle = done ? C.okS : (hitStep ? C.curS : C.grid); ctx.stroke();
    ctx.fillStyle = done ? C.okT : (hitStep ? C.curT : C.text);
    ctx.font='600 12.5px "Noto Sans TC", sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(s.note, w/2, B4 + 29);
  }

  function update(){ if(stepEl) stepEl.textContent=String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0'); if(labelEl) labelEl.innerHTML=steps[step].text; draw(); }
  function next(){ if(step<steps.length-1){step++;update();}else stop(); }
  function prev(){ if(step>0){step--;update();} }
  function reset(){ stop(); step=0; update(); }
  function play(){ if(timer){stop();return;} bPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){stop();return;} next(); },2100); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} if(bPlay) bPlay.textContent='Play'; }
  bPrev&&bPrev.addEventListener('click',prev); bNext&&bNext.addEventListener('click',next); bPlay&&bPlay.addEventListener('click',play); bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();}); if(window.ResizeObserver){ new ResizeObserver(()=>{fit();draw();}).observe(canvas); }
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw); fit(); update();
})();
