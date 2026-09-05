/* ============================================================
   P144 · Binary Tree Preorder Traversal — 遞迴 · viz
   前序 = 根 → 左 → 右。push_back 在兩個遞迴呼叫「之前」:
     ans.push_back(root->val);      // ← 一走到就收錄,不等任何人
     preorder(ans, root->left);
     preorder(ans, root->right);
   動畫要傳達的一件事:前序裡「走到」和「收錄」是同一個時刻 ——
   這正是它與中序、後序唯一的差別(中序要等左邊、後序要等兩邊)。
     BAND 1  樹狀圖(灰 = 還沒走到,紅 = 這一步的焦點,藍 = 已收錄,綠 = 完成)
     BAND 2  這一步執行哪一行 + 呼叫堆疊深度
     BAND 3  ans 目前的內容
     BAND 4  為什麼
   例 [1,2,3,4,5,null,8,null,null,6,7,9] → [1,2,4,5,6,7,3,8,9]
   所有狀態取自實測 trace(A1 fact sheet),未手推。
   前綴 v144- 。
   ============================================================ */
(function () {
  const canvas = document.getElementById('v144-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('v144-step'), labelEl = document.getElementById('v144-label');
  const bPrev = document.getElementById('v144-prev'), bNext = document.getElementById('v144-next'),
        bPlay = document.getElementById('v144-play'), bReset = document.getElementById('v144-reset');

  const C = { paper:'#ffffff', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf',
    win:'#e3edf5', winS:'#4478c0', winT:'#2f5f9e',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424',
    ok:'#d9e8c7', okS:'#5fa866', okT:'#3f7a3a',
    off:'#f0f0ec', offS:'#cfcfcf', offT:'#a3a099', coral:'#cf3535' };

  /* 同一棵樹,三題共用,方便對照三種順序的差別
     1(2(4,5(6,7)),3(_,8(9,_)))  —— col 為中序水平槽位 */
  const NODES = [
    { v:1, col:5, row:0, l:1, r:6 },   // 0
    { v:2, col:1, row:1, l:2, r:3 },   // 1
    { v:4, col:0, row:2, l:-1, r:-1 }, // 2
    { v:5, col:3, row:2, l:4, r:5 },   // 3
    { v:6, col:2, row:3, l:-1, r:-1 }, // 4
    { v:7, col:4, row:3, l:-1, r:-1 }, // 5
    { v:3, col:6, row:1, l:-1, r:7 },  // 6
    { v:8, col:8, row:2, l:8, r:-1 },  // 7
    { v:9, col:7, row:3, l:-1, r:-1 }, // 8
  ];
  const NCOL = 9, NROW = 4;

  const S = (focus, phase, ans, depth, eq, note, text) => ({ focus, phase, ans, depth, eq, note, text });

  const steps = [
    S(-1, 'intro', [], 0,
      'preorder(ans, root)   // 根 → 左 → 右',
      'push_back 在兩個遞迴之前 —— 一走到就收錄,不等任何人',
      '<strong>INITIAL</strong> · 前序把 <code>push_back</code> 放在<strong>兩個遞迴呼叫之前</strong>。這帶來一個中序、後序都沒有的性質:<strong>走到一個節點的當下就收錄它</strong>,不必等任何子樹。<b>所以前序輸出的第一個元素,永遠是樹根。</b>'),

    S(0, 'push', [1], 1,
      'ans.push_back(1)      // 進來第一件事就是收錄自己',
      '前序的第一個元素恆為樹根 —— 實測 2055 棵樹 100% 成立',
      '<strong>收錄 1</strong> · 一進入根節點,<strong>第一行就是 <code>push_back</code></strong>。<b>實測窮舉 n=1..8 的全部 2055 棵樹,<code>ans.front() == root-&gt;val</code> 命中率 100%</b>;而同樣的 <code>ans.back() == root</code> 只中 1/2055 —— 這個「根在最前面」的性質是前序獨有的。'),

    S(1, 'push', [1,2], 2,
      'ans.push_back(2)      // 進入左子樹,同樣先收錄自己',
      '每一層的三行完全相同,只是 root 指到不同節點',
      '<strong>收錄 2</strong> · 1 執行第二行 <code>preorder(ans, root-&gt;left)</code> 進入 2,<strong>2 也是一進來就被收錄</strong>。堆疊深度 2。<strong>每一層的程式碼一模一樣</strong> —— 遞迴的全部力量就在這裡。'),

    S(2, 'push', [1,2,4], 3,
      'ans.push_back(4) → 兩個子樹都是 nullptr,直接 return',
      'nullptr 那一層什麼都不做就 return —— 唯一的終止條件',
      '<strong>收錄 4</strong> · 葉節點。收錄後仍然照樣呼叫左右兩次,只是<strong>兩次都傳進 <code>nullptr</code>,那一層立刻 return</strong>。<b>葉節點並沒有被特別處理 —— 程式碼裡根本沒有「這是葉節點嗎」這種判斷。</b>'),

    S(3, 'push', [1,2,4,5], 3,
      'ans.push_back(5)      // 4 回來,2 執行第三行進入右子樹',
      '4 那一層 return 之後,控制權回到 2 的第三行',
      '<strong>收錄 5</strong> · 4 做完了,回到 2 執行<strong>第三行</strong> <code>preorder(ans, root-&gt;right)</code>,進入 5。<strong>5 一進來又是先收錄自己</strong>。'),

    S(4, 'push', [1,2,4,5,6], 4,
      'ans.push_back(6)      // 5 的左子樹',
      '深度 4 —— 這棵樹的最深處',
      '<strong>收錄 6</strong> · 5 的左子樹。<strong>堆疊深度 4</strong>,是這棵樹的最深點。<b>遞迴深度等於樹高,不是節點數</b> —— 這是空間複雜度是 <code>O(h)</code> 而不是 <code>O(n)</code> 的原因。'),

    S(5, 'push', [1,2,4,5,6,7], 4,
      'ans.push_back(7)      // 5 的右子樹',
      '7 收完,以 2 為根的整棵左子樹結束,一路 return 回 1',
      '<strong>收錄 7</strong> · 5 的右子樹。到這裡 <code>ans = [1,2,4,5,6,7]</code> —— 這正是「<strong>根 1</strong> + <strong>以 2 為根的整棵左子樹</strong>」的前序結果。接著每一層都執行完第三行,<strong>一路 return 回最外層的 1</strong>。'),

    S(6, 'push', [1,2,4,5,6,7,3], 2,
      'ans.push_back(3)      // 1 執行第三行,進入右子樹',
      '根 1 的第三行,現在才輪到 —— 前序的右子樹永遠排在最後',
      '<strong>收錄 3</strong> · 1 的<strong>第三行</strong>終於執行。<b>前序輸出的形狀永遠是:根、整棵左子樹、整棵右子樹 —— 三段連續不交錯。</b>這個性質正是「用前序 + 中序重建二元樹」(LeetCode 105)能成立的原因。'),

    S(7, 'push', [1,2,4,5,6,7,3,8], 3,
      'ans.push_back(8)      // 3 沒有左子樹,直接進右子樹',
      '3 的左子樹是空的,那一層 return,馬上執行第三行',
      '<strong>收錄 8</strong> · 3 的左子樹是 <code>nullptr</code>,那一層立刻 return,所以馬上執行第三行進入 8。<strong>空子樹不需要任何特判</strong>,base case 已經包辦了。'),

    S(8, 'push', [1,2,4,5,6,7,3,8,9], 4,
      'ans.push_back(9)      // 最後一個',
      '9 收完,每一層執行完第三行,一路 return 到底',
      '<strong>收錄 9</strong> · 8 的左子樹。8 沒有右子樹,所以 9 收完之後<strong>每一層都執行完第三行,一路 return 回最外層</strong>,遞迴結束。'),

    S(-1, 'done', [1,2,4,5,6,7,3,8,9], 0,
      'return ans = [1,2,4,5,6,7,3,8,9]',
      '實測 20 萬組隨機樹對拍顯式 stack 版本,不一致 0',
      '<strong>完成</strong> · <code>[1,2,4,5,6,7,3,8,9]</code>。9 個節點、<strong>9 次 push_back</strong>、<strong>19 次 preorder() 呼叫</strong>(9 實節點 + 10 個 nullptr = 2n+1,實測窮舉 2056 棵樹皆成立、與形狀無關)。實測 <strong>20 萬組</strong>隨機樹對拍獨立的顯式 <code>std::stack</code> 版本,<strong>不一致 0</strong>。時間 <code>O(n)</code>,空間 <code>O(h)</code>。'),
  ];

  let step = 0, timer = null;

  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||430; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  const TREE_TOP = 26, ROW_H = 46, R = 17;

  function draw(){
    fit();
    const s = steps[step], w = canvas.clientWidth, PAD = 30;
    const done = s.phase === 'done';
    ctx.fillStyle = C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);

    const taken = new Set(s.ans);
    const usable = w - 2*PAD;
    const colW = usable / NCOL;
    const nx = n => PAD + (n.col + 0.5) * colW;
    const ny = n => TREE_TOP + 18 + n.row * ROW_H;

    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 灰 = 還沒走到　紅 = 這一步　藍 = 已收錄　綠 = 完成', PAD, 16);
    ctx.textAlign='right'; ctx.font='700 12.5px "JetBrains Mono", monospace';
    ctx.fillStyle = done ? C.okT : C.text;
    ctx.fillText(done ? '完成' : ('呼叫堆疊深度 ' + s.depth), w - PAD, 16);

    ctx.lineWidth = 1.8;
    for (let i = 0; i < NODES.length; i++) {
      const p = NODES[i];
      [p.l, p.r].forEach(ci => {
        if (ci < 0) return;
        const c = NODES[ci];
        const bothDone = taken.has(p.v) && taken.has(c.v);
        ctx.strokeStyle = done ? C.okS : (bothDone ? C.winS : C.grid);
        ctx.beginPath(); ctx.moveTo(nx(p), ny(p) + R - 2); ctx.lineTo(nx(c), ny(c) - R + 2); ctx.stroke();
      });
    }

    for (let i = 0; i < NODES.length; i++) {
      const n = NODES[i];
      let bg = C.off, bd = C.offS, tx = C.offT;
      if (done)                  { bg = C.ok;  bd = C.okS;  tx = C.okT; }
      else if (i === s.focus)    { bg = C.cur; bd = C.curS; tx = C.curT; }
      else if (taken.has(n.v))   { bg = C.win; bd = C.winS; tx = C.winT; }
      ctx.beginPath(); ctx.arc(nx(n), ny(n), R, 0, Math.PI*2);
      ctx.fillStyle = bg; ctx.fill();
      ctx.lineWidth = i === s.focus ? 2.6 : 1.6; ctx.strokeStyle = bd; ctx.stroke();
      ctx.fillStyle = tx; ctx.font='700 15px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(n.v), nx(n), ny(n));
    }

    const B2 = TREE_TOP + 18 + NROW * ROW_H + 4;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 這一步執行的那一行', PAD, B2);
    rr(PAD, B2 + 10, w - 2*PAD, 40, 6);
    const hot = s.phase === 'push';
    ctx.fillStyle = done ? C.ok : (hot ? C.cur : '#fafaf6'); ctx.fill();
    ctx.lineWidth = 1.6; ctx.strokeStyle = done ? C.okS : (hot ? C.curS : C.grid); ctx.stroke();
    ctx.fillStyle = done ? C.okT : (hot ? C.curT : C.text);
    ctx.font='700 12.5px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(s.eq, w/2, B2 + 30);

    const B3 = B2 + 68;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · ans(輸出陣列)', PAD, B3);
    const CN = 9, cw = Math.min(40, (w - 2*PAD) / CN - 6), cgap = 6;
    const totalW = CN * cw + (CN - 1) * cgap;
    const cx0 = PAD + Math.max(0, ((w - 2*PAD) - totalW) / 2);
    const cellTop = B3 + 14;
    for (let i = 0; i < CN; i++) {
      const x = cx0 + i * (cw + cgap);
      const filled = i < s.ans.length;
      const justNow = filled && i === s.ans.length - 1 && s.phase === 'push';
      rr(x, cellTop, cw, 34, 5);
      ctx.fillStyle = done ? C.ok : (justNow ? C.cur : (filled ? C.win : '#fafaf6')); ctx.fill();
      ctx.lineWidth = justNow ? 2.4 : 1.4;
      ctx.strokeStyle = done ? C.okS : (justNow ? C.curS : (filled ? C.winS : C.grid)); ctx.stroke();
      if (filled) {
        ctx.fillStyle = done ? C.okT : (justNow ? C.curT : C.winT);
        ctx.font='700 14px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(String(s.ans[i]), x + cw/2, cellTop + 17);
      }
    }

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
