/* ============================================================
   P100 · Same Tree — 遞迴 · viz
     if (!p || !q) return p == q;
     return (p->val == q->val) && isSameTree(p->left,  q->left)
                               && isSameTree(p->right, q->right);
   動畫要傳達的一件事:&& 的短路讓「發現不同」變得非常便宜。
   例 p=[1,2,1] q=[1,1,2] → false,只用了 2 次呼叫(完整走訪要 7 次)。
   兩個短路點:① 值不同 ⇒ 自己的兩個子遞迴被跳過
               ② 左邊回 false ⇒ 右邊的遞迴根本不會被建立
     BAND 1  兩棵樹並排(灰 = 從未被拜訪,紅 = 這一步,綠/紅框 = 比對結果)
     BAND 2  這一步在比哪一對、結果如何
     BAND 3  累計呼叫次數 vs 完整走訪需要的次數
     BAND 4  為什麼
   所有狀態取自實測 trace(A1 fact sheet),未手推。
   前綴 v100- 。
   ============================================================ */
(function () {
  const canvas = document.getElementById('v100-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('v100-step'), labelEl = document.getElementById('v100-label');
  const bPrev = document.getElementById('v100-prev'), bNext = document.getElementById('v100-next'),
        bPlay = document.getElementById('v100-play'), bReset = document.getElementById('v100-reset');

  const C = { paper:'#ffffff', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf',
    win:'#e3edf5', winS:'#4478c0', winT:'#2f5f9e',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424',
    ok:'#d9e8c7', okS:'#5fa866', okT:'#3f7a3a',
    off:'#f0f0ec', offS:'#cfcfcf', offT:'#a3a099', coral:'#cf3535' };

  /* p = [1,2,1] , q = [1,1,2] —— heap 索引 1,2,3 */
  const P = { 1:1, 2:2, 3:1 };
  const Q = { 1:1, 2:1, 3:2 };
  const POS = { 1:[1.5,0], 2:[0.5,1], 3:[2.5,1] };   // 每棵樹用 4 欄
  const IDS = [1,2,3];

  /* state: visited(已被拜訪的索引)、eq(比對相等的)、ne(比對不等的)、
            skipped(被短路跳過的)、focus */
  const S = (visited, eq, ne, skipped, focus, calls, phase, line, note, text) =>
    ({ visited, eq, ne, skipped, focus, calls, phase, line, note, text });

  const steps = [
    S([], [], [], [], -1, 0, 'intro',
      'isSameTree(p, q):值相同 && 左邊相同 && 右邊相同',
      '兩個 && 都會短路 —— 這讓「發現不同」比「確認相同」便宜得多',
      '<strong>INITIAL</strong> · <code>p = [1,2,1]</code>、<code>q = [1,1,2]</code>(官方範例 3,答案 <code>false</code>)。<strong>兩棵樹的形狀完全相同,只有值不一樣。</strong><b>注意這一份寫法用了兩個 <code>&amp;&amp;</code>,而 <code>&amp;&amp;</code> 是<em>短路</em>運算子</b> —— 一旦左邊為 <code>false</code>,右邊<strong>根本不會被求值</strong>。'),

    S([1], [1], [], [], 1, 1, 'eq',
      '比對 (p:1, q:1):  1 == 1  ✓  相等 → 繼續比左子樹',
      '根的值相同,所以第一個 && 通過,往下走',
      '<strong>比對根節點</strong> · 兩邊都非空,所以 <code>!p || !q</code> 不成立,直接比值:<code>1 == 1</code> ✓。<strong>第一個運算元為真,<code>&amp;&amp;</code> 繼續求值第二個</strong> —— 也就是遞迴比較左子樹。'),

    S([1,2], [1], [2], [], 2, 2, 'ne',
      '比對 (p:2, q:1):  2 != 1  ✗  不相等\n→ 短路 ①:這個節點自己的兩個子遞迴「完全不會被呼叫」',
      '值一不同,這個節點底下就不必再看了',
      '<strong>發現不同 —— 短路 ①</strong> · 比對 <code>p</code> 的左小孩 <code>2</code> 與 <code>q</code> 的左小孩 <code>1</code>:<strong><code>2 != 1</code></strong>。<b>第一個運算元為 <code>false</code>,所以 <code>&amp;&amp;</code> 立刻停止</b> —— <strong>這個節點自己的兩個子遞迴(左、右)<em>一次都沒有被呼叫</em></strong>。回傳 <code>false</code>。'),

    S([1,2], [1], [2], [3], -1, 2, 'skip',
      '短路 ②:根的「右子樹遞迴」也不會被呼叫\n(p:1, q:2) 這一對從來沒有被建立過',
      '左邊回 false,右邊那個 && 也直接停 —— 右子樹完全沒被碰到',
      '<strong>短路 ②</strong> · 那個 <code>false</code> 傳回根節點。根的運算式是 <code>值相同 &amp;&amp; 左相同 &amp;&amp; 右相同</code>,<strong>既然「左相同」已經是 <code>false</code>,「右相同」就不會被求值</strong>。<b>所以 <code>(p 的右小孩 1, q 的右小孩 2)</code> 這一對<em>從來沒有被比較過</em></b> —— 灰色的那兩個節點,程式根本沒去看。'),

    S([1,2], [1], [2], [3], -1, 2, 'done',
      'return false      // 總共只用了 2 次呼叫(完整走訪要 7 次)',
      '實測:根值不同的兩棵 n=100 樹,只要 1 次呼叫就能回答',
      '<strong>完成 · false</strong> · <strong>總共只呼叫了 2 次</strong>,而完整走訪這兩棵 3 節點的樹需要 <strong>7 次</strong>(<code>2n+1</code>)。<b>短路省下了 5 次。</b><br>實測更極端的例子:兩棵 <code>n=100</code> 的樹,若<strong>根的值就不同</strong>,只需要 <strong>1 次呼叫</strong>(相對於相同時的 201 次)—— <strong>省了 201 倍</strong>。'),
  ];

  let step = 0, timer = null;

  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  const TREE_TOP = 44, ROW_H = 54, R = 18;

  function drawTree(vals, x0, halfW, s, label) {
    const colW = halfW / 4;
    const nx = i => x0 + (POS[i][0] + 0.5) * colW;
    const ny = i => TREE_TOP + 20 + POS[i][1] * ROW_H;
    const visited = new Set(s.visited), eq = new Set(s.eq), ne = new Set(s.ne);

    // 樹的標題
    ctx.fillStyle = C.text; ctx.font='700 13px "JetBrains Mono", monospace';
    ctx.textAlign='center'; ctx.textBaseline='alphabetic';
    ctx.fillText(label, x0 + halfW/2, TREE_TOP - 6);

    ctx.lineWidth = 1.8;
    IDS.forEach(i => {
      [2*i, 2*i+1].forEach(c => {
        if (!POS[c]) return;
        ctx.strokeStyle = visited.has(i) && visited.has(c) ? C.winS : C.grid;
        ctx.beginPath(); ctx.moveTo(nx(i), ny(i) + R - 2); ctx.lineTo(nx(c), ny(c) - R + 2); ctx.stroke();
      });
    });

    IDS.forEach(i => {
      let bg = C.off, bd = C.offS, tx = C.offT;
      if (i === s.focus)      { bg = C.cur; bd = C.curS; tx = C.curT; }
      else if (ne.has(i))     { bg = C.cur; bd = C.curS; tx = C.curT; }
      else if (eq.has(i))     { bg = C.ok;  bd = C.okS;  tx = C.okT; }
      ctx.beginPath(); ctx.arc(nx(i), ny(i), R, 0, Math.PI*2);
      ctx.fillStyle = bg; ctx.fill();
      ctx.lineWidth = i === s.focus ? 2.8 : 1.6; ctx.strokeStyle = bd; ctx.stroke();
      ctx.fillStyle = tx; ctx.font='700 15px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(vals[i]), nx(i), ny(i));

      // 從未被拜訪的節點:標「未拜訪」
      if (!visited.has(i)) {
        ctx.fillStyle = C.dim; ctx.font='600 10.5px "JetBrains Mono", monospace';
        ctx.textAlign='center'; ctx.textBaseline='top';
        ctx.fillText('未拜訪', nx(i), ny(i) + R + 4);
      }
    });
  }

  function draw(){
    fit();
    const s = steps[step], w = canvas.clientWidth, PAD = 26;
    const done = s.phase === 'done';
    ctx.fillStyle = C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);

    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 綠 = 比過且相等　紅 = 比過但不等　灰 = 程式從未拜訪', PAD, 16);

    const halfW = (w - 2*PAD - 30) / 2;
    drawTree(P, PAD, halfW, s, 'p = [1,2,1]');
    drawTree(Q, PAD + halfW + 30, halfW, s, 'q = [1,1,2]');

    // 中間分隔線
    ctx.strokeStyle = C.grid; ctx.lineWidth = 1; ctx.setLineDash([4,4]);
    ctx.beginPath(); ctx.moveTo(PAD + halfW + 15, TREE_TOP - 18);
    ctx.lineTo(PAD + halfW + 15, TREE_TOP + 20 + 2*ROW_H + R); ctx.stroke();
    ctx.setLineDash([]);

    // BAND 2
    const B2 = TREE_TOP + 20 + 2*ROW_H + R + 22;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 這一步在比哪一對', PAD, B2);
    const lines = s.line.split('\n');
    const bh2 = lines.length > 1 ? 54 : 40;
    rr(PAD, B2 + 10, w - 2*PAD, bh2, 6);
    const hot = s.phase === 'ne' || s.phase === 'skip';
    ctx.fillStyle = done ? C.ok : (hot ? C.cur : (s.phase === 'eq' ? C.ok : '#fafaf6')); ctx.fill();
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = done ? C.okS : (hot ? C.curS : (s.phase === 'eq' ? C.okS : C.grid)); ctx.stroke();
    ctx.fillStyle = done ? C.okT : (hot ? C.curT : (s.phase === 'eq' ? C.okT : C.text));
    ctx.font='700 12.5px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
    if (lines.length > 1) { ctx.fillText(lines[0], w/2, B2 + 26); ctx.fillText(lines[1], w/2, B2 + 47); }
    else                  { ctx.fillText(lines[0], w/2, B2 + 30); }

    // BAND 3
    const B3 = B2 + bh2 + 30;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 累計呼叫次數(完整走訪需要 7 次)', PAD, B3);
    rr(PAD, B3 + 12, 120, 32, 5);
    ctx.fillStyle = done ? C.ok : C.win; ctx.fill();
    ctx.lineWidth = 1.4; ctx.strokeStyle = done ? C.okS : C.winS; ctx.stroke();
    ctx.fillStyle = done ? C.okT : C.winT;
    ctx.font='700 15px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(String(s.calls) + ' / 7', PAD + 60, B3 + 28);

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
  function play(){ if(timer){stop();return;} bPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){stop();return;} next(); },2100); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} if(bPlay) bPlay.textContent='Play'; }
  bPrev&&bPrev.addEventListener('click',prev); bNext&&bNext.addEventListener('click',next); bPlay&&bPlay.addEventListener('click',play); bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();}); if(window.ResizeObserver){ new ResizeObserver(()=>{fit();draw();}).observe(canvas); }
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw); fit(); update();
})();
