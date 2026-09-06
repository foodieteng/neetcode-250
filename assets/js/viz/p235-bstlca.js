/* ============================================================
   P235 · Lowest Common Ancestor of a BST — 遞迴 · viz
     if (max(p,q) < root->val)      go LEFT
     else if (min(p,q) > root->val) go RIGHT
     else                           return root      // 分岔點
   動畫要傳達的一件事:這題「不搜尋」,只是「往下走一條路」。
   BST 的排序性質讓每一步都能「二選一」,所以只走 O(h) 步就到答案。
   停下來的那個節點 = 第一個「值落在 [min, max] 之間」的節點 = 分岔點 = LCA。
   例 root=[6,2,8,0,4,7,9,null,null,3,5], p=2, q=4 → 2
      (示範「節點可以是自己的後代」—— p 本身就是答案)
     BAND 1  BST 樹狀圖 + 走過的路徑
     BAND 2  這一步的判斷式
     BAND 3  目前的區間 [min, max] 與 root->val 的關係
     BAND 4  為什麼
   所有狀態取自實測 trace,未手推。
   前綴 v235- 。
   ============================================================ */
(function () {
  const canvas = document.getElementById('v235-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('v235-step'), labelEl = document.getElementById('v235-label');
  const bPrev = document.getElementById('v235-prev'), bNext = document.getElementById('v235-next'),
        bPlay = document.getElementById('v235-play'), bReset = document.getElementById('v235-reset');

  const C = { paper:'#ffffff', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf',
    win:'#e3edf5', winS:'#4478c0', winT:'#2f5f9e',
    seg:'#f6ead8', segS:'#c8801e', segT:'#96601a',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424',
    ok:'#d9e8c7', okS:'#5fa866', okT:'#3f7a3a',
    off:'#f0f0ec', offS:'#cfcfcf', offT:'#a3a099', coral:'#cf3535' };

  /* root = [6,2,8,0,4,7,9,null,null,3,5] —— heap 索引 */
  const V  = { 1:6, 2:2, 3:8, 4:0, 5:4, 6:7, 7:9, 10:3, 11:5 };
  const POS = { 1:[3.5,0], 2:[1.5,1], 3:[5.5,1],
                4:[0.5,2], 5:[2.5,2], 6:[4.5,2], 7:[6.5,2],
                10:[2.0,3], 11:[3.0,3] };
  const IDS = [1,2,3,4,5,6,7,10,11];
  const NCOL = 8, NROW = 4;

  /* path = 已走過的節點;focus = 這一步;ans = 答案;pq = 標記 p 與 q */
  const S = (path, focus, ans, phase, eq, note, text) => ({ path, focus, ans, phase, eq, note, text });

  const PQ = { 2:'p', 5:'q' };   // p = 節點2(值2)、q = 節點5(值4)

  const steps = [
    S([], -1, -1, 'intro',
      'p = 2, q = 4  →  區間 [min, max] = [2, 4]',
      'BST 的排序性質讓每一步都能「二選一」—— 這題不搜尋,只往下走',
      '<strong>INITIAL</strong> · BST <code>[6,2,8,0,4,7,9,null,null,3,5]</code>,要找 <code>p=2</code> 與 <code>q=4</code> 的最近共同祖先。<b>先把兩個目標寫成一個區間 <code>[2, 4]</code></b> —— 接下來每一步只問一件事:<strong>目前節點的值,在區間的<em>左邊</em>、<em>右邊</em>,還是<em>裡面</em>?</strong>'),

    S([1], 1, -1, 'right',
      '節點 6:  max(2,4) = 4  <  6   →  兩個目標都在左邊,往左走',
      '兩個都比我小 ⇒ 答案不可能在右子樹,也不可能是我',
      '<strong>在節點 6</strong> · <code>max(2,4) = 4 &lt; 6</code> —— <strong>兩個目標都比 6 小</strong>。由 BST 的性質,<strong>它們必定都在左子樹裡</strong>,所以<b>右子樹整棵、以及節點 6 自己,都可以直接排除</b>。<strong>往左。</strong>'),

    S([1,2], 2, 2, 'hit',
      '節點 2:  max=4 不 < 2,min=2 不 > 2  →  落在區間內,回傳它',
      '這是「分岔點」—— 一邊的目標 <= 它 <= 另一邊的目標',
      '<strong>在節點 2 —— 停!</strong> · <code>max(2,4) = 4</code> <strong>不小於</strong> 2,<code>min(2,4) = 2</code> <strong>不大於</strong> 2 —— <strong>兩個條件都不成立,落入 <code>else</code></strong>。<b>節點 2 就是答案。</b>注意 <strong><code>p</code> 自己就是 <code>p</code> 的祖先</strong> —— 題目明說「<strong>一個節點可以是自己的後代</strong>」。'),

    S([1,2], -1, 2, 'done',
      'return 節點 2      // 只走了 2 步,從未「搜尋」任何子樹',
      '走過的路徑長度 = LCA 的深度 + 1,所以是 O(h) 不是 O(n)',
      '<strong>完成 · 答案是節點 2</strong> · <b>全程只呼叫 2 次</b>,而且<strong>從頭到尾沒有「搜尋」任何東西</strong> —— 每一步都靠 BST 的排序性質<strong>直接決定往哪走</strong>。<b>這就是為什麼複雜度是 <code>O(h)</code> 而不是 <code>O(n)</code></b>:走過的步數恰好等於 <strong>LCA 的深度 + 1</strong>。'),
  ];

  let step = 0, timer = null;

  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||440; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  const TREE_TOP = 26, ROW_H = 46, R = 17;

  function draw(){
    fit();
    const s = steps[step], w = canvas.clientWidth, PAD = 28;
    const done = s.phase === 'done';
    ctx.fillStyle = C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);

    const colW = (w - 2*PAD) / NCOL;
    const nx = i => PAD + (POS[i][0] + 0.5) * colW;
    const ny = i => TREE_TOP + 22 + POS[i][1] * ROW_H;
    const path = new Set(s.path);

    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 藍 = 走過的路徑　紅 = 這一步　綠 = 答案(LCA)　橘框 = p / q', PAD, 16);
    ctx.textAlign='right'; ctx.font='700 12.5px "JetBrains Mono", monospace';
    ctx.fillStyle = done ? C.okT : C.text;
    ctx.fillText(done ? '完成 · 走了 2 步' : ('已走 ' + s.path.length + ' 步'), w - PAD, 16);

    // 邊
    ctx.lineWidth = 1.8;
    IDS.forEach(i => {
      [2*i, 2*i+1].forEach(c => {
        if (!POS[c]) return;
        const onPath = path.has(i) && path.has(c);
        ctx.strokeStyle = onPath ? C.winS : C.grid;
        ctx.lineWidth = onPath ? 2.6 : 1.6;
        ctx.beginPath(); ctx.moveTo(nx(i), ny(i) + R - 2); ctx.lineTo(nx(c), ny(c) - R + 2); ctx.stroke();
      });
    });
    ctx.lineWidth = 1.8;

    // 節點
    IDS.forEach(i => {
      let bg = C.off, bd = C.offS, tx = C.offT;
      if (i === s.ans && (done || s.phase === 'hit')) { bg = C.ok;  bd = C.okS;  tx = C.okT; }
      else if (i === s.focus)                        { bg = C.cur; bd = C.curS; tx = C.curT; }
      else if (path.has(i))                          { bg = C.win; bd = C.winS; tx = C.winT; }
      ctx.beginPath(); ctx.arc(nx(i), ny(i), R, 0, Math.PI*2);
      ctx.fillStyle = bg; ctx.fill();
      ctx.lineWidth = (i === s.focus || i === s.ans) ? 2.6 : 1.5;
      ctx.strokeStyle = bd; ctx.stroke();
      ctx.fillStyle = tx; ctx.font='700 14px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(V[i]), nx(i), ny(i));

      // p / q 標記:橘色外框 + 標籤
      if (PQ[i]) {
        ctx.beginPath(); ctx.arc(nx(i), ny(i), R + 4, 0, Math.PI*2);
        ctx.strokeStyle = C.segS; ctx.lineWidth = 2; ctx.setLineDash([3,3]); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = C.segT; ctx.font='700 11px "JetBrains Mono", monospace';
        ctx.textAlign='center'; ctx.textBaseline='top';
        ctx.fillText(PQ[i] + '=' + V[i], nx(i), ny(i) + R + 7);
      }
    });

    // BAND 2
    const B2 = TREE_TOP + 22 + NROW * ROW_H + 2;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 這一步的判斷', PAD, B2);
    rr(PAD, B2 + 10, w - 2*PAD, 40, 6);
    const hot = s.phase === 'hit';
    ctx.fillStyle = done ? C.ok : (hot ? C.ok : (s.phase === 'intro' ? '#fafaf6' : C.cur)); ctx.fill();
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = done ? C.okS : (hot ? C.okS : (s.phase === 'intro' ? C.grid : C.curS)); ctx.stroke();
    ctx.fillStyle = done ? C.okT : (hot ? C.okT : (s.phase === 'intro' ? C.text : C.curT));
    ctx.font='700 12.5px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(s.eq, w/2, B2 + 30);

    // BAND 3 · 區間視覺化
    const B3 = B2 + 64;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 區間 [2, 4] 與目前節點的關係', PAD, B3);

    // 數線 0..9
    const lineY = B3 + 32, x0 = PAD + 40, x1 = w - PAD - 40;
    ctx.strokeStyle = C.grid; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x0, lineY); ctx.lineTo(x1, lineY); ctx.stroke();
    const vx = v => x0 + (v / 9) * (x1 - x0);
    // 區間 [2,4] 高亮
    ctx.fillStyle = C.seg;
    ctx.fillRect(vx(2), lineY - 9, vx(4) - vx(2), 18);
    ctx.strokeStyle = C.segS; ctx.lineWidth = 1.6;
    ctx.strokeRect(vx(2), lineY - 9, vx(4) - vx(2), 18);
    // 刻度
    for (let v = 0; v <= 9; v++) {
      ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(vx(v), lineY - 4); ctx.lineTo(vx(v), lineY + 4); ctx.stroke();
      ctx.fillStyle = C.dim; ctx.font='600 10px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='top';
      ctx.fillText(String(v), vx(v), lineY + 8);
    }
    // 目前節點的值標在數線上
    if (s.focus >= 0) {
      const cv = V[s.focus];
      const inRange = cv >= 2 && cv <= 4;
      ctx.fillStyle = inRange ? C.okS : C.curS;
      ctx.beginPath(); ctx.arc(vx(cv), lineY, 6, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = inRange ? C.okT : C.curT; ctx.font='700 11px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='bottom';
      ctx.fillText('root=' + cv + (inRange ? ' 在區間內' : ' 在區間外'), vx(cv), lineY - 14);
    }

    // BAND 4
    const B4 = B3 + 74;
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
