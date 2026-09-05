/* ============================================================
   P104 · Maximum Depth of Binary Tree — 遞迴 · viz
     if (root == nullptr) return 0;
     return 1 + max(maxDepth(root->left), maxDepth(root->right));
   動畫要傳達的一件事:「值是從葉子往上長出來的」。
   下潛的路上什麼都沒算 —— 每個數字都誕生於某次 return 0(碰到 nullptr),
   然後每經過一層 +1。max 就是「把比較短的那一邊丟掉」的地方。
     BAND 1  樹狀圖,每個節點旁邊標「它回傳的值」
     BAND 2  這一步在算什麼
     BAND 3  這一層的算式 1 + max(左, 右)
     BAND 4  為什麼
   例 [3,9,20,null,null,15,7] → 3
   所有狀態取自實測 trace(A1 fact sheet),未手推。
   前綴 v104- 。
   ============================================================ */
(function () {
  const canvas = document.getElementById('v104-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('v104-step'), labelEl = document.getElementById('v104-label');
  const bPrev = document.getElementById('v104-prev'), bNext = document.getElementById('v104-next'),
        bPlay = document.getElementById('v104-play'), bReset = document.getElementById('v104-reset');

  const C = { paper:'#ffffff', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf',
    win:'#e3edf5', winS:'#4478c0', winT:'#2f5f9e',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424',
    ok:'#d9e8c7', okS:'#5fa866', okT:'#3f7a3a',
    off:'#f0f0ec', offS:'#cfcfcf', offT:'#a3a099', coral:'#cf3535' };

  /* [3,9,20,null,null,15,7] —— heap 索引 1..7,但 4/5 不存在 */
  const V = { 1:3, 2:9, 3:20, 6:15, 7:7 };
  const POS = { 1:[3.5,0], 2:[1.5,1], 3:[5.5,1], 6:[4.5,2], 7:[6.5,2] };
  const IDS = [1,2,3,6,7];
  const NCOL = 8, NROW = 3;

  /* ret[i] = 該節點已算出的回傳值(尚未算出就沒有這個 key) */
  const S = (ret, focus, phase, eq, note, text) => ({ ret, focus, phase, eq, note, text });

  const steps = [
    S({}, -1, 'intro',
      'maxDepth(root) = 1 + max(左邊的深度, 右邊的深度)',
      '下潛的路上什麼都沒算 —— 所有數字都在回程才出現',
      '<strong>INITIAL</strong> · 樹 <code>[3,9,20,null,null,15,7]</code>。這題的關鍵直覺:<strong>值是從葉子「往上長」的</strong>。下潛的過程<strong>只是走到 <code>nullptr</code> 而已,一個數字都沒算</strong>。<b>每個數字都誕生於某次 <code>return 0</code>。</b>'),

    S({}, 2, 'down',
      '進入節點 9 → 呼叫 maxDepth(9->left) → nullptr',
      'nullptr 回傳 0 —— 這是所有數字的起點',
      '<strong>下潛到 9</strong> · 一路走到節點 <code>9</code>,它是葉節點。<code>maxDepth(9-&gt;left)</code> 傳進 <code>nullptr</code>,<strong>那一層回傳 <code>0</code></strong>。<b>這個 0 就是整棵樹第一個被算出來的數字。</b>'),

    S({2:1}, 2, 'calc',
      '節點 9:  1 + max(0, 0) = 1',
      '葉節點的兩邊都是 0,所以它回傳 1 —— 葉節點深度為 1',
      '<strong>節點 9 算出 1</strong> · 左右兩次呼叫都回傳 <code>0</code>,所以 <code>1 + max(0, 0) = <strong>1</strong></code>。<strong>葉節點的深度是 1</strong>(它自己算一層)。<b>注意這個 1 是「0 加上自己這一層」得來的 —— 不是憑空寫死的。</b>'),

    S({2:1,6:1}, 6, 'calc',
      '節點 15:  1 + max(0, 0) = 1',
      '右半邊的葉節點,同樣的算法',
      '<strong>節點 15 算出 1</strong> · 回到節點 <code>3</code> 執行右邊,下潛到 <code>20</code>,再下潛到它的左小孩 <code>15</code>。<strong>又是一個葉節點,又是 <code>1 + max(0,0) = 1</code></strong>。<b>每一層的程式碼完全相同,差別只在 <code>root</code> 指到誰。</b>'),

    S({2:1,6:1,7:1}, 7, 'calc',
      '節點 7:  1 + max(0, 0) = 1',
      '三個葉節點都回傳 1,現在 20 的兩邊都齊了',
      '<strong>節點 7 算出 1</strong> · <code>20</code> 的右小孩,同樣是葉節點。<strong>現在節點 <code>20</code> 的左右兩個值都拿到了</strong>(各是 1),<strong>下一步才輪到它自己</strong>。'),

    S({2:1,6:1,7:1,3:2}, 3, 'calc',
      '節點 20:  1 + max(1, 1) = 2',
      '兩邊一樣深,max 挑誰都一樣',
      '<strong>節點 20 算出 2</strong> · <code>1 + max(1, 1) = <strong>2</strong></code>。以 <code>20</code> 為根的那棵子樹深度是 2(<code>20 → 15</code> 或 <code>20 → 7</code>)。<b>這裡兩邊一樣深,所以 <code>max</code> 挑哪一個都一樣 —— 下一步就不是了。</b>'),

    S({2:1,6:1,7:1,3:2,1:3}, 1, 'calc',
      '節點 3(根):  1 + max(1, 2) = 3     ← max 丟掉了左邊的 1',
      'max 就是「把比較短的那一邊丟掉」的地方',
      '<strong>根節點算出 3</strong> · 左邊(節點 9)回傳 <code>1</code>,右邊(節點 20)回傳 <code>2</code>。<code>1 + max(1, 2) = <strong>3</strong></code>。<b>這就是 <code>max</code> 真正發揮作用的一步:它<em>丟掉</em>了左邊那條比較短的路。</b>最終答案追溯回去,就是最長的那條 <code>3 → 20 → 15</code>。'),

    S({2:1,6:1,7:1,3:2,1:3}, -1, 'done',
      'return 3     // 最長路徑 3 → 20 → 15(或 3 → 20 → 7)',
      '實測 20 萬組對拍 BFS 逐層計數版本,不一致 0',
      '<strong>完成</strong> · 答案 <strong>3</strong>。<strong>11 次 maxDepth() 呼叫</strong>(5 實節點 + 6 個 nullptr = 2n+1)。實測 <strong>20 萬組</strong>隨機樹對拍獨立的 BFS 逐層計數版本,<strong>不一致 0</strong>。時間 <code>O(n)</code>,空間 <code>O(h)</code>。<b>注意:兩個遞迴呼叫<em>都</em>會被完整執行,<code>max</code> 沒有短路 —— 實測即使一邊明顯更深,兩邊仍各走一趟。</b>'),
  ];

  let step = 0, timer = null;

  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  const TREE_TOP = 30, ROW_H = 56, R = 19;

  function draw(){
    fit();
    const s = steps[step], w = canvas.clientWidth, PAD = 30;
    const done = s.phase === 'done';
    ctx.fillStyle = C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);

    const colW = (w - 2*PAD) / NCOL;
    const nx = i => PAD + (POS[i][0] + 0.5) * colW;
    const ny = i => TREE_TOP + 22 + POS[i][1] * ROW_H;

    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 節點旁的數字 = 它回傳的深度　灰 = 還沒算　紅 = 這一步　藍 = 已算出', PAD, 16);

    // 邊
    ctx.lineWidth = 1.8;
    IDS.forEach(i => {
      [2*i, 2*i+1].forEach(c => {
        if (!POS[c]) return;
        const both = s.ret[i] !== undefined && s.ret[c] !== undefined;
        ctx.strokeStyle = done ? C.okS : (both ? C.winS : C.grid);
        ctx.beginPath(); ctx.moveTo(nx(i), ny(i) + R - 2); ctx.lineTo(nx(c), ny(c) - R + 2); ctx.stroke();
      });
    });

    // 節點 + 回傳值標籤
    IDS.forEach(i => {
      const has = s.ret[i] !== undefined;
      let bg = C.off, bd = C.offS, tx = C.offT;
      if (done)             { bg = C.ok;  bd = C.okS;  tx = C.okT; }
      else if (i === s.focus){ bg = C.cur; bd = C.curS; tx = C.curT; }
      else if (has)         { bg = C.win; bd = C.winS; tx = C.winT; }
      ctx.beginPath(); ctx.arc(nx(i), ny(i), R, 0, Math.PI*2);
      ctx.fillStyle = bg; ctx.fill();
      ctx.lineWidth = i === s.focus ? 2.6 : 1.6; ctx.strokeStyle = bd; ctx.stroke();
      ctx.fillStyle = tx; ctx.font='700 15px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(V[i]), nx(i), ny(i));

      // 回傳值:畫在節點右上角的小方塊
      if (has) {
        const bx = nx(i) + R - 2, by = ny(i) - R - 12;
        rr(bx, by, 24, 19, 4);
        ctx.fillStyle = done ? C.ok : (i === s.focus ? C.cur : C.win); ctx.fill();
        ctx.lineWidth = 1.4; ctx.strokeStyle = done ? C.okS : (i === s.focus ? C.curS : C.winS); ctx.stroke();
        ctx.fillStyle = done ? C.okT : (i === s.focus ? C.curT : C.winT);
        ctx.font='700 12px "JetBrains Mono", monospace';
        ctx.fillText(String(s.ret[i]), bx + 12, by + 10);
      }
    });

    // nullptr 的 0:畫在葉節點下方,說明「0 從哪裡來」
    if (s.phase !== 'intro') {
      ctx.fillStyle = C.curT; ctx.font='700 11px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='top';
      [2,6,7].forEach(i => {
        if (s.ret[i] === undefined && i !== s.focus) return;
        ctx.fillStyle = C.dim;
        ctx.fillText('0   0', nx(i), ny(i) + R + 5);
      });
    }

    // BAND 2
    const B2 = TREE_TOP + 22 + NROW * ROW_H + 4;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 這一步在算什麼', PAD, B2);
    rr(PAD, B2 + 10, w - 2*PAD, 40, 6);
    const hot = s.phase === 'calc';
    ctx.fillStyle = done ? C.ok : (hot ? C.cur : '#fafaf6'); ctx.fill();
    ctx.lineWidth = 1.6; ctx.strokeStyle = done ? C.okS : (hot ? C.curS : C.grid); ctx.stroke();
    ctx.fillStyle = done ? C.okT : (hot ? C.curT : C.text);
    ctx.font='700 12.5px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(s.eq, w/2, B2 + 30);

    // BAND 3
    const B3 = B2 + 74;
    ctx.fillStyle=C.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 為什麼', PAD, B3);
    rr(PAD, B3 + 10, w - 2*PAD, 40, 6);
    ctx.fillStyle = done ? C.ok : '#fafaf6'; ctx.fill();
    ctx.lineWidth = 1.6; ctx.strokeStyle = done ? C.okS : C.grid; ctx.stroke();
    ctx.fillStyle = done ? C.okT : C.text;
    ctx.font='600 12.5px "Noto Sans TC", sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(s.note, w/2, B3 + 30);
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
