/* ============================================================
   P145 · Binary Tree Postorder Traversal — 遞迴 · viz
   後序 = 左 → 右 → 根。push_back 在兩個遞迴呼叫「之後」:
     postOrder(ans, root->left);
     postOrder(ans, root->right);
     ans.push_back(root->val);      // ← 兩邊都做完才輪到自己
   動畫要傳達的一件事:後序是三種裡「等最久」的 ——
   每個節點都要等左右兩棵子樹整個做完,所以根一定排在最後。
   這正是「先釋放子節點再釋放自己」「先算子樹再算自己」的順序。
     BAND 1  樹狀圖(灰 = 還沒走到,紅 = 這一步的焦點,藍 = 已收錄,綠 = 完成)
     BAND 2  這一步執行哪一行 + 呼叫堆疊深度
     BAND 3  ans 目前的內容
     BAND 4  為什麼
   例 [1,2,3,4,5,null,8,null,null,6,7,9] → [4,6,7,5,2,9,8,3,1]
   所有狀態取自實測 trace(A1 fact sheet),未手推。
   前綴 v145- 。
   ============================================================ */
(function () {
  const canvas = document.getElementById('v145-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('v145-step'), labelEl = document.getElementById('v145-label');
  const bPrev = document.getElementById('v145-prev'), bNext = document.getElementById('v145-next'),
        bPlay = document.getElementById('v145-play'), bReset = document.getElementById('v145-reset');

  const C = { paper:'#ffffff', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf',
    win:'#e3edf5', winS:'#4478c0', winT:'#2f5f9e',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424',
    ok:'#d9e8c7', okS:'#5fa866', okT:'#3f7a3a',
    off:'#f0f0ec', offS:'#cfcfcf', offT:'#a3a099', coral:'#cf3535' };

  /* 與 P94 / P144 同一棵樹,方便三頁互相對照 */
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
      'postOrder(ans, root)   // 左 → 右 → 根',
      'push_back 在兩個遞迴之後 —— 每個節點都要等左右兩棵子樹做完',
      '<strong>INITIAL</strong> · 後序把 <code>push_back</code> 放在<strong>兩個遞迴呼叫之後</strong>。所以每個節點都是三種走訪裡<strong>等最久</strong>的:必須等<strong>左右兩棵子樹整個做完</strong>才輪到自己。<b>這也是為什麼後序的最後一個元素永遠是樹根。</b>'),

    S(0, 'down', [], 1,
      '進入 1 → 呼叫 postOrder(1->left),根什麼都還沒做',
      '根節點最先被走到,卻會最後才被收錄',
      '<strong>走到 1</strong> · 樹根。但前兩行都是遞迴呼叫,<strong>1 什麼都還沒收錄</strong>。<b>它是第一個被走到、卻是最後一個被收錄的節點</b> —— 這個「先進後出」的落差就是後序的全部。'),

    S(2, 'push', [4], 3,
      'postOrder(4->left) → null,postOrder(4->right) → null\nans.push_back(4)',
      '葉節點的左右都是 nullptr,兩層立刻 return,馬上輪到自己',
      '<strong>收錄 4</strong> · 一路下潛 1 → 2 → 4。4 是葉節點,<strong>左右兩次呼叫都傳進 <code>nullptr</code>、立刻 return</strong>,所以第三行馬上執行。<b>後序輸出的第一個元素,一定是某個葉節點</b> —— 因為只有葉節點不必等任何人。'),

    S(4, 'push', [4,6], 4,
      'ans.push_back(6)      // 5 的左子樹先做完',
      '2 收錄前要等右子樹 5,5 收錄前要等左子樹 6',
      '<strong>收錄 6</strong> · 4 回來後,2 執行<strong>第二行</strong>進入右子樹 5;5 又先往左到 6。<strong>等待是層層疊起來的</strong>:2 在等 5,5 在等 6。堆疊深度 <strong>4</strong>。'),

    S(5, 'push', [4,6,7], 4,
      'ans.push_back(7)      // 5 的右子樹也做完了',
      '5 的兩棵子樹都回來了,下一步才輪到 5 自己',
      '<strong>收錄 7</strong> · 5 的右子樹。<strong>現在 5 的左(6)、右(7)都做完了</strong> —— 第三行的條件終於滿足。'),

    S(3, 'push', [4,6,7,5], 3,
      'ans.push_back(5)      // 兩個子樹都回來了,輪到自己',
      '子樹永遠排在自己前面 —— 這是後序的定義性質',
      '<strong>收錄 5</strong> · <b>注意 5 在輸出裡排在 6 和 7 的後面</b>。這在後序裡是鐵律:<strong>任何節點的兩棵子樹,輸出位置都在它自己之前</strong>。'),

    S(1, 'push', [4,6,7,5,2], 2,
      'ans.push_back(2)      // 4 和 5 兩棵都做完了',
      '2 從第 2 步就被走到,等到現在才收錄',
      '<strong>收錄 2</strong> · 2 的左(4)、右(5 那一整棵)都完成,終於輪到它。到這裡 <code>ans = [4,6,7,5,2]</code> —— <strong>正好是「以 2 為根的整棵子樹」的後序結果,而 2 排在最後</strong>。'),

    S(8, 'push', [4,6,7,5,2,9], 4,
      'ans.push_back(9)      // 1 執行第二行,進入右子樹',
      '換到右半邊,規則一模一樣',
      '<strong>收錄 9</strong> · 1 執行<strong>第二行</strong>進入右子樹 3;3 沒有左子樹,直接進 8;8 又先往左到 9。<strong>9 是葉節點,先被收錄</strong>。'),

    S(7, 'push', [4,6,7,5,2,9,8], 3,
      'ans.push_back(8)      // 8 的左(9)完成,右是 null',
      '8 沒有右子樹,那一層立刻 return,不必特判',
      '<strong>收錄 8</strong> · 8 的左子樹是 9(已完成),右子樹是 <code>nullptr</code>(立刻 return)。<strong>兩個條件都滿足,輪到 8</strong>。<b>空子樹不需要任何特判 —— base case 已經包辦。</b>'),

    S(6, 'push', [4,6,7,5,2,9,8,3], 2,
      'ans.push_back(3)      // 3 的左是 null、右是 8,都完成',
      '右半邊做完,只剩最外層的根還在等',
      '<strong>收錄 3</strong> · 3 的左子樹為空、右子樹(8 那一整棵)完成。<strong>現在整棵右子樹都做完了</strong>,只剩最外層的根 1 還在等。'),

    S(0, 'push', [4,6,7,5,2,9,8,3,1], 1,
      'ans.push_back(1)      // 根!最後一個',
      '實測 2055 棵樹,ans.back() == root->val 命中率 100%',
      '<strong>收錄 1</strong> · 樹根,<strong>最後一個</strong>。<b>實測窮舉 n=1..8 的全部 2055 棵樹,<code>ans.back() == root-&gt;val</code> 命中率 100%</b>;而 <code>ans.front() == root</code> 只中 1/2055(那唯一一棵是單節點樹)。<strong>「根在最後」是後序獨有的簽名。</strong>'),

    S(-1, 'done', [4,6,7,5,2,9,8,3,1], 0,
      'return ans = [4,6,7,5,2,9,8,3,1]',
      '實測 20 萬組隨機樹對拍顯式 stack 版本,不一致 0',
      '<strong>完成</strong> · <code>[4,6,7,5,2,9,8,3,1]</code>。9 個節點、<strong>9 次 push_back</strong>、<strong>19 次 postOrder() 呼叫</strong>(2n+1,實測窮舉 2056 棵樹皆成立、與形狀無關)。實測 <strong>20 萬組</strong>隨機樹對拍獨立的顯式 <code>std::stack</code> 版本,<strong>不一致 0</strong>。時間 <code>O(n)</code>,空間 <code>O(h)</code>。'),
  ];

  let step = 0, timer = null;

  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||440; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
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
    const lines = s.eq.split('\n');
    const bh2 = lines.length > 1 ? 54 : 40;
    rr(PAD, B2 + 10, w - 2*PAD, bh2, 6);
    const hot = s.phase === 'push';
    ctx.fillStyle = done ? C.ok : (hot ? C.cur : '#fafaf6'); ctx.fill();
    ctx.lineWidth = 1.6; ctx.strokeStyle = done ? C.okS : (hot ? C.curS : C.grid); ctx.stroke();
    ctx.fillStyle = done ? C.okT : (hot ? C.curT : C.text);
    ctx.font='700 12.5px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
    if (lines.length > 1) { ctx.fillText(lines[0], w/2, B2 + 26); ctx.fillText(lines[1], w/2, B2 + 47); }
    else                  { ctx.fillText(lines[0], w/2, B2 + 30); }

    const B3 = B2 + bh2 + 30;
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
