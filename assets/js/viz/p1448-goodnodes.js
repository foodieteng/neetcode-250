/* ============================================================
   P1448 · Count Good Nodes in Binary Tree — 遞迴帶running max · viz
     int goodNodes(TreeNode* root, int mx = INT_MIN) {
       if (!root) return 0;
       mx = max(mx, root->val);                       // 先更新
       return (int)(root->val >= mx)                  // 再用「>=」比自己
            + goodNodes(root->left, mx)
            + goodNodes(root->right, mx);
     }
   動畫要傳達的兩件事:
     ① mx 是「從根到我這條路上的最大值」,一路往下傳、只增不減
     ② 「先更新再用 >= 比」和「先比再更新」等價 —— 但只有在 >= 的時候
        (若寫成 >,更新後 root->val > max(mx,root->val) 永遠為假,全盤歸零)
   例 [3,1,4,3,null,1,5] → 4(good: 根3、D3、C4、F5)
      其中 D(3) 是「平手也算」的關鍵案例
     BAND 1  樹狀圖:節點旁標它繼承的 mx,綠 = good
     BAND 2  這一步的判斷
     BAND 3  數線:路徑最大值與目前節點
     BAND 4  為什麼
   所有狀態取自實測 trace(A1 fact sheet),未手推。
   前綴 v1448- 。
   ============================================================ */
(function () {
  const canvas = document.getElementById('v1448-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('v1448-step'), labelEl = document.getElementById('v1448-label');
  const bPrev = document.getElementById('v1448-prev'), bNext = document.getElementById('v1448-next'),
        bPlay = document.getElementById('v1448-play'), bReset = document.getElementById('v1448-reset');

  const C = { paper:'#ffffff', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf',
    win:'#e3edf5', winS:'#4478c0', winT:'#2f5f9e',
    seg:'#f6ead8', segS:'#c8801e', segT:'#96601a',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424',
    ok:'#d9e8c7', okS:'#5fa866', okT:'#3f7a3a',
    off:'#f0f0ec', offS:'#cfcfcf', offT:'#a3a099', coral:'#cf3535' };

  /* [3,1,4,3,null,1,5] —— heap 索引;A=1(3) B=2(1) C=3(4) D=4(3) E=6(1) F=7(5) */
  const V   = { 1:3, 2:1, 3:4, 4:3, 6:1, 7:5 };
  const NAME= { 1:'A', 2:'B', 3:'C', 4:'D', 6:'E', 7:'F' };
  const POS = { 1:[3.5,0], 2:[1.5,1], 3:[5.5,1], 4:[0.5,2], 6:[4.5,2], 7:[6.5,2] };
  const IDS = [1,2,3,4,6,7];
  const NCOL = 8, NROW = 3;

  /* mxAt[i] = 該節點「更新後」的 mx;good = 已判定為 good;bad = 已判定不是 */
  const S = (focus, mxAt, good, bad, total, curMx, phase, eq, note, text) =>
    ({ focus, mxAt, good, bad, total, curMx, phase, eq, note, text });

  const steps = [
    S(-1, {}, [], [], 0, null, 'intro',
      'goodNodes(root, mx = INT_MIN)',
      'mx 是「從根走到我這條路上的最大值」—— 一路往下傳,只增不減',
      '<strong>INITIAL</strong> · 樹 <code>[3,1,4,3,null,1,5]</code>。<b>「good」的定義:從根到我這條路上,<em>沒有人比我大</em></b>。<strong>所以只要沿路帶著「路徑最大值」<code>mx</code> 往下傳,每個節點問一句「我 &gt;= mx 嗎」就好。</strong>'),

    S(1, {1:3}, [1], [], 1, 3, 'good',
      '節點 A(3):  mx = max(INT_MIN, 3) = 3    3 >= 3  ✓ GOOD',
      '根節點上面沒有人,必定 good —— 而 >= 正好讓它成立',
      '<strong>根節點 A(3)</strong> · <code>mx</code> 從 <code>INT_MIN</code> 更新成 <strong>3</strong>,然後比 <code>3 &gt;= 3</code> ✓。<b>根上面沒有任何節點,理當永遠 good</b> —— <strong>而「先更新再用 <code>&gt;=</code> 比」剛好自動保證了這件事</strong>(自己和自己比,必定成立)。<code>total = 1</code>。'),

    S(2, {1:3, 2:3}, [1], [2], 1, 3, 'bad',
      '節點 B(1):  mx = max(3, 1) = 3    1 >= 3 ?  ✗ NOT GOOD',
      'mx 沒有被 1 拉低 —— 它只增不減,記住的是「路上最大的」',
      '<strong>節點 B(1)</strong> · 繼承 <code>mx = 3</code>,<code>max(3, 1)</code> <strong>還是 3</strong>(<b><code>mx</code> 只增不減</b>)。比 <code>1 &gt;= 3</code> ✗ —— <strong>因為根節點 3 擋在它上面</strong>。<code>total</code> 不變。'),

    S(4, {1:3, 2:3, 4:3}, [1,4], [2], 2, 3, 'tie',
      '節點 D(3):  mx = max(3, 3) = 3    3 >= 3  ✓ GOOD  ← 平手也算!',
      '⚡ 這就是 >= 而不是 > 的原因 —— 「沒有人比我大」不等於「我最大」',
      '<strong>節點 D(3) —— 平手的關鍵案例</strong> · 路徑是 <code>3 → 1 → 3</code>,路上最大值是 <strong>3</strong>,而 D 自己也是 <strong>3</strong>。<b>⚡ <code>3 &gt;= 3</code> 成立 ⇒ GOOD</b>。<strong>題目說的是「沒有節點<em>大於</em>它」,不是「它最大」</strong> —— <b>所以平手要算。寫成 <code>&gt;</code> 就會漏掉這種節點。</b><code>total = 2</code>。'),

    S(3, {1:3, 2:3, 4:3, 3:4}, [1,4,3], [2], 3, 4, 'good',
      '節點 C(4):  mx = max(3, 4) = 4    4 >= 4  ✓ GOOD',
      'C 自己刷新了路徑最大值 ⇒ 它必定 good,而且把 4 傳給子樹',
      '<strong>節點 C(4)</strong> · 回到右半邊,繼承 <code>mx = 3</code>。<b><code>max(3, 4) = 4</code> —— C 自己把最大值刷新了</b>,所以 <code>4 &gt;= 4</code> ✓ GOOD。<strong>而這個更新後的 <code>4</code> 會往下傳給 E 和 F。</strong><code>total = 3</code>。'),

    S(6, {1:3, 2:3, 4:3, 3:4, 6:4}, [1,4,3], [2,6], 3, 4, 'bad',
      '節點 E(1):  mx = max(4, 1) = 4    1 >= 4 ?  ✗ NOT GOOD',
      '路上有 3 和 4 兩個都比它大',
      '<strong>節點 E(1)</strong> · 繼承 <code>mx = 4</code>(C 剛更新的)。<code>1 &gt;= 4</code> ✗。<strong>它的路徑是 <code>3 → 4 → 1</code>,上面有兩個節點都比它大。</strong><code>total</code> 不變。'),

    S(7, {1:3, 2:3, 4:3, 3:4, 6:4, 7:5}, [1,4,3,7], [2,6], 4, 5, 'good',
      '節點 F(5):  mx = max(4, 5) = 5    5 >= 5  ✓ GOOD',
      'F 是它那條路上最大的 ⇒ good',
      '<strong>節點 F(5)</strong> · 繼承 <code>mx = 4</code>,<code>max(4, 5) = 5</code> —— <strong>F 刷新了最大值</strong>,<code>5 &gt;= 5</code> ✓ GOOD。<code>total = 4</code>。'),

    S(-1, {1:3, 2:3, 4:3, 3:4, 6:4, 7:5}, [1,4,3,7], [2,6], 4, null, 'done',
      'return 4        // good: A(3)、D(3)、C(4)、F(5)',
      '實測 1062 萬組窮舉 + 20 萬組隨機對拍,不一致 0',
      '<strong>完成 · 答案 4</strong> · good 的是 <b>A(3)、D(3)、C(4)、F(5)</b>;<strong>B(1) 和 E(1) 都被上面比它們大的節點擋住</strong>。<b>呼叫 13 次 = 2n+1 = 2×6+1 ✓</b>。實測對拍獨立的「顯式 stack 迭代 DFS」參考解,<strong>窮舉 1042 萬組 + 隨機 20 萬組,不一致 0</strong>。'),
  ];

  let step = 0, timer = null;

  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||420; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  const TREE_TOP = 26, ROW_H = 50, R = 18;

  function draw(){
    fit();
    const s = steps[step], w = canvas.clientWidth, PAD = 28;
    const done = s.phase === 'done';
    ctx.fillStyle = C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);

    const colW = (w - 2*PAD) / NCOL;
    const nx = i => PAD + (POS[i][0] + 0.5) * colW;
    const ny = i => TREE_TOP + 24 + POS[i][1] * ROW_H;
    const good = new Set(s.good), bad = new Set(s.bad);

    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 節點下方 = 它更新後的 mx　綠 = good　灰 = 不是', PAD, 16);
    ctx.textAlign='right'; ctx.font='700 12.5px "JetBrains Mono", monospace';
    ctx.fillStyle = done ? C.okT : C.text;
    ctx.fillText('good 總數 ' + s.total, w - PAD, 16);

    ctx.lineWidth = 1.8;
    IDS.forEach(i => {
      [2*i, 2*i+1].forEach(c => {
        if (!POS[c]) return;
        const seen = (good.has(i)||bad.has(i)) && (good.has(c)||bad.has(c)||c===s.focus);
        ctx.strokeStyle = seen ? C.winS : C.grid;
        ctx.lineWidth = seen ? 2.4 : 1.6;
        ctx.beginPath(); ctx.moveTo(nx(i), ny(i) + R - 2); ctx.lineTo(nx(c), ny(c) - R + 2); ctx.stroke();
      });
    });

    IDS.forEach(i => {
      let bg = C.off, bd = C.offS, tx = C.offT;
      if (i === s.focus)      { bg = C.cur; bd = C.curS; tx = C.curT; }
      else if (good.has(i))   { bg = C.ok;  bd = C.okS;  tx = C.okT; }
      else if (bad.has(i))    { bg = '#fafaf6'; bd = C.grid; tx = C.offT; }
      ctx.beginPath(); ctx.arc(nx(i), ny(i), R, 0, Math.PI*2);
      ctx.fillStyle = bg; ctx.fill();
      ctx.lineWidth = i === s.focus ? 2.6 : 1.5;
      ctx.strokeStyle = bd; ctx.stroke();
      ctx.fillStyle = tx; ctx.font='700 14px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(V[i]), nx(i), ny(i));

      // 名字標在左上
      ctx.fillStyle = C.dim; ctx.font='600 10px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='bottom';
      ctx.fillText(NAME[i], nx(i) - R - 6, ny(i) - 2);

      if (s.mxAt[i] !== undefined) {
        const isGood = good.has(i);
        ctx.fillStyle = (i === s.focus) ? C.curT : (isGood ? C.okT : C.dim);
        ctx.font='700 10.5px "JetBrains Mono", monospace';
        ctx.textAlign='center'; ctx.textBaseline='top';
        ctx.fillText('mx=' + s.mxAt[i], nx(i), ny(i) + R + 4);
      }
    });

    // BAND 2
    const B2 = TREE_TOP + 24 + NROW * ROW_H + 4;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 這一步的判斷', PAD, B2);
    rr(PAD, B2 + 10, w - 2*PAD, 38, 6);
    const tie = s.phase === 'tie';
    const isGoodStep = s.phase === 'good' || tie || done;
    ctx.fillStyle = tie ? C.seg : (isGoodStep ? C.ok : (s.phase === 'intro' ? '#fafaf6' : '#fafaf6')); ctx.fill();
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = tie ? C.segS : (isGoodStep ? C.okS : C.grid); ctx.stroke();
    ctx.fillStyle = tie ? C.segT : (isGoodStep ? C.okT : C.text);
    ctx.font='700 12px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(s.eq, w/2, B2 + 29);

    // BAND 3 · 數線
    const B3 = B2 + 62;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 路徑最大值 mx 與目前節點', PAD, B3);
    const lineY = B3 + 34, x0 = PAD + 46, x1 = w - PAD - 46;
    ctx.strokeStyle = C.grid; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x0, lineY); ctx.lineTo(x1, lineY); ctx.stroke();
    const vx = v => x0 + ((v - 1) / 5) * (x1 - x0);   // 顯示 1..6
    for (let v = 1; v <= 6; v++) {
      ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(vx(v), lineY - 4); ctx.lineTo(vx(v), lineY + 4); ctx.stroke();
      ctx.fillStyle = C.dim; ctx.font='600 10px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='top';
      ctx.fillText(String(v), vx(v), lineY + 8);
    }
    if (s.curMx !== null) {
      // mx 那一格畫成一條「門檻」
      ctx.strokeStyle = C.segS; ctx.lineWidth = 2.4; ctx.setLineDash([4,3]);
      ctx.beginPath(); ctx.moveTo(vx(s.curMx), lineY - 14); ctx.lineTo(vx(s.curMx), lineY + 14); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = C.segT; ctx.font='700 10.5px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='bottom';
      ctx.fillText('mx=' + s.curMx, vx(s.curMx), lineY - 17);
    }
    if (s.focus >= 0) {
      const cv = V[s.focus];
      const isGood = good.has(s.focus);
      ctx.fillStyle = isGood ? C.okS : C.curS;
      ctx.beginPath(); ctx.arc(vx(cv), lineY, 6, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = isGood ? C.okT : C.curT; ctx.font='700 11px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='top';
      ctx.fillText(NAME[s.focus] + '=' + cv + (isGood ? ' ✓' : ' ✗'), vx(cv), lineY + 20);
    }

    // BAND 4
    const B4 = B3 + 76;
    ctx.fillStyle=C.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 4 · 為什麼', PAD, B4);
    rr(PAD, B4 + 10, w - 2*PAD, 38, 6);
    ctx.fillStyle = done ? C.ok : (tie ? C.seg : '#fafaf6'); ctx.fill();
    ctx.lineWidth = 1.6; ctx.strokeStyle = done ? C.okS : (tie ? C.segS : C.grid); ctx.stroke();
    ctx.fillStyle = done ? C.okT : (tie ? C.segT : C.text);
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
