/* ============================================================
   P94 · Binary Tree Inorder Traversal — 遞迴 · viz
   中序 = 左 → 根 → 右。三行的「根」夾在兩個遞迴呼叫中間:
     inorder(ans, root->left);
     ans.push_back(root->val);      // ← 夾在中間,這就是「中」序
     inorder(ans, root->right);
   動畫要傳達的一件事:每個節點被「走到」和被「收錄」是兩個不同的時刻 ——
   走到時什麼都不做,要等左子樹整棵回來才輪到自己。
     BAND 1  樹狀圖(灰 = 還沒走到,紅 = 這一步的焦點,藍 = 已收錄,綠 = 完成)
     BAND 2  這一步在執行哪一行 + 呼叫堆疊深度
     BAND 3  ans 目前的內容
     BAND 4  為什麼
   例 [1,2,3,4,5,null,8,null,null,6,7,9] → [4,2,6,5,7,1,3,9,8]
   所有狀態取自實測 trace(A1 fact sheet),未手推。
   前綴 v94- 。
   ============================================================ */
(function () {
  const canvas = document.getElementById('v94-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('v94-step'), labelEl = document.getElementById('v94-label');
  const bPrev = document.getElementById('v94-prev'), bNext = document.getElementById('v94-next'),
        bPlay = document.getElementById('v94-play'), bReset = document.getElementById('v94-reset');

  const C = { paper:'#ffffff', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf',
    win:'#e3edf5', winS:'#4478c0', winT:'#2f5f9e',
    seg:'#f6ead8', segS:'#c8801e', segT:'#96601a',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424',
    ok:'#d9e8c7', okS:'#5fa866', okT:'#3f7a3a',
    off:'#f0f0ec', offS:'#cfcfcf', offT:'#a3a099', coral:'#cf3535' };

  /* 樹:1(2(4,5(6,7)),3(_,8(9,_)))
     以 620px 邏輯寬度排版 —— col 是 0..8 的中序水平槽位,row 是深度 */
  const NODES = [
    // id, val, col, row, left, right
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

  /* steps —— 取自 A1 實測 trace,只保留「畫面會變」的時刻 */
  const S = (focus, phase, ans, depth, eq, note, text) => ({ focus, phase, ans, depth, eq, note, text });

  const steps = [
    S(-1, 'intro', [], 0,
      'inorder(ans, root)   // 左 → 根 → 右',
      '每個節點會被「走到」一次,但要等左子樹整棵做完才被「收錄」',
      '<strong>INITIAL</strong> · 中序走訪的三行裡,<code>push_back</code> <strong>夾在兩個遞迴呼叫中間</strong> —— 這就是「中」序的字面意思。關鍵直覺:<strong>走到一個節點 ≠ 收錄它</strong>。走到時它只是把工作往左邊丟,自己排隊等。'),

    S(0, 'down', [], 1,
      '進入 1 → 立刻呼叫 inorder(1->left)',
      '根節點什麼都還沒做,先把控制權交給左子樹',
      '<strong>走到 1</strong> · 樹根。但第一行就是 <code>inorder(ans, root-&gt;left)</code>,所以 <strong>1 什麼都還沒收錄</strong>,直接下潛到左子樹。<b>根節點在中序裡永遠不會是第一個</b>(除非它沒有左子樹)。'),

    S(1, 'down', [], 2,
      '進入 2 → 再呼叫 inorder(2->left)',
      '同樣的三行,在每一層都長一樣 —— 這是遞迴的全部',
      '<strong>走到 2</strong> · 一樣的三行,一樣先往左。堆疊深度來到 <strong>2</strong>。注意<strong>每一層的程式碼完全相同</strong>,差別只在 <code>root</code> 指到誰。'),

    S(2, 'down', [], 3,
      '進入 4 → 呼叫 inorder(4->left) → root == nullptr,return',
      '碰到 nullptr 就是遞迴的底 —— 這是唯一的終止條件',
      '<strong>走到 4</strong> · 它是葉節點。<code>inorder(4-&gt;left)</code> 傳進 <code>nullptr</code>,<strong>那一層直接 return,什麼都不做</strong>。這就是 base case,也是整段程式碼<strong>唯一的終止條件</strong>。'),

    S(2, 'push', [4], 3,
      'ans.push_back(4)      // 左邊回來了,輪到自己',
      '4 的左子樹是空的 → 它是整棵樹「最左」的節點 → 中序第一個',
      '<strong>收錄 4</strong> · 左子樹(空的)已經處理完,<strong>現在才輪到 4 自己</strong>。<b>中序的第一個元素,永遠是整棵樹一路往左走到底的那個節點。</b>'),

    S(1, 'push', [4,2], 2,
      'ans.push_back(2)      // 2 的左子樹(4)做完了',
      '2 一直在等,等到左邊整棵回來才被收錄',
      '<strong>收錄 2</strong> · 4 那一層 return 之後,控制權回到 2。<strong>2 從第 3 步就走到了,卻到現在才被收錄</strong> —— 中間隔了整棵左子樹。這個「等待」就是中序的本質。'),

    S(3, 'down', [4,2], 3,
      '進入 5 → 呼叫 inorder(5->left)',
      '2 收錄完,第三行 inorder(2->right) 把控制權交給 5',
      '<strong>走到 5</strong> · 2 執行完第三行 <code>inorder(ans, root-&gt;right)</code>,進入右子樹 5。<strong>5 又是一個新的「左 → 根 → 右」</strong>,規則完全不變。'),

    S(4, 'push', [4,2,6], 4,
      'ans.push_back(6)      // 5 的左子樹',
      '深度來到 4 —— 這棵樹的最深處',
      '<strong>收錄 6</strong> · 5 先往左走到 6,6 沒有左子樹,所以馬上被收錄。<strong>堆疊深度 4</strong>,是這棵樹的最深點。'),

    S(3, 'push', [4,2,6,5], 3,
      'ans.push_back(5)      // 左邊(6)回來了',
      '同樣的節奏:左子樹回來 → 收錄自己 → 再往右',
      '<strong>收錄 5</strong> · 6 回來了,輪到 5。<b>看出節奏了嗎 —— 每個節點都是「等左邊 → 收自己 → 丟右邊」,一次都沒有例外。</b>'),

    S(5, 'push', [4,2,6,5,7], 4,
      'ans.push_back(7)      // 5 的右子樹',
      '7 收完,以 2 為根的整棵左子樹就結束了',
      '<strong>收錄 7</strong> · 5 的右子樹。到這裡 <code>ans = [4,2,6,5,7]</code> —— <strong>這正好是「以 2 為根的整棵左子樹」的中序結果</strong>,而根節點 1 到現在都還在等。'),

    S(0, 'push', [4,2,6,5,7,1], 1,
      'ans.push_back(1)      // 根!左子樹整棵做完了',
      '根節點在中序裡的位置 = 左子樹的節點數之後',
      '<strong>收錄 1</strong> · 樹根終於輪到了。<strong>它從第 2 步就被走到,卻等了 8 步</strong>。<b>根在中序輸出裡的下標,恰好等於左子樹的節點數(這裡是 5)</b> —— 這個性質正是「用中序 + 前序重建二元樹」(LeetCode 105)的核心。'),

    S(6, 'push', [4,2,6,5,7,1,3], 2,
      'ans.push_back(3)      // 3 沒有左子樹,馬上收錄',
      '沒有左子樹的節點,走到就收錄 —— 不必等',
      '<strong>收錄 3</strong> · 1 執行第三行進入右子樹 3。<strong>3 的左子樹是空的</strong>,所以 <code>inorder(3-&gt;left)</code> 立刻 return,3 馬上被收錄 —— <strong>不用等</strong>。'),

    S(8, 'push', [4,2,6,5,7,1,3,9], 4,
      'ans.push_back(9)      // 8 的左子樹',
      '8 又要等左邊的 9 —— 規則對每個節點都一樣',
      '<strong>收錄 9</strong> · 3 往右進入 8,8 先往左找到 9。<strong>9 沒有左子樹,先被收錄</strong>,8 繼續等。'),

    S(7, 'push', [4,2,6,5,7,1,3,9,8], 3,
      'ans.push_back(8)      // 最後一個',
      '8 沒有右子樹,收錄完就一路 return 到底',
      '<strong>收錄 8</strong> · 9 回來,輪到 8。8 沒有右子樹,<code>inorder(8-&gt;right)</code> 立刻 return,接著<strong>每一層都執行完第三行,一路 return 回最外層</strong>。'),

    S(-1, 'done', [4,2,6,5,7,1,3,9,8], 0,
      'return ans = [4,2,6,5,7,1,3,9,8]',
      '實測 20 萬組隨機樹對拍顯式 stack 版本,不一致 0',
      '<strong>完成</strong> · <code>[4,2,6,5,7,1,3,9,8]</code>。9 個節點、<strong>9 次 push_back</strong>、<strong>19 次 inorder() 呼叫</strong>(9 個實節點 + 10 個 nullptr = 2n+1)。實測 <strong>20 萬組</strong>隨機樹與獨立寫的顯式 <code>std::stack</code> 版本對拍,<strong>不一致 0</strong>。時間 <code>O(n)</code>,空間 <code>O(h)</code>。'),
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

    // 已收錄集合(用值判斷,樹裡值皆相異)
    const taken = new Set(s.ans);

    const usable = w - 2*PAD;
    const colW = usable / NCOL;
    const nx = n => PAD + (n.col + 0.5) * colW;
    const ny = n => TREE_TOP + 18 + n.row * ROW_H;

    // ── BAND 1 標題 ──
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 灰 = 還沒走到　紅 = 這一步　藍 = 已收錄　綠 = 完成', PAD, 16);
    ctx.textAlign='right'; ctx.font='700 12.5px "JetBrains Mono", monospace';
    ctx.fillStyle = done ? C.okT : C.text;
    ctx.fillText(done ? '完成' : ('呼叫堆疊深度 ' + s.depth), w - PAD, 16);

    // ── 邊 ──
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

    // ── 節點 ──
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

    // ── BAND 2 · 這一步執行哪一行 ──
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

    // ── BAND 3 · ans ──
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

    // ── BAND 4 · 為什麼 ──
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
