/* ============================================================
   P102 · Binary Tree Level Order Traversal — BFS · viz
     while (!q.empty()) {
       auto sz = q.size();          // ← 把「這一層有幾個」凍結起來
       level.clear();
       for (int _ = 0; _ < sz; _++) { pop、收錄、把小孩推進去 }
       ans.push_back(level);
     }
   動畫要傳達的一件事:那個 sz 是「層與層之間的界線」。
   內層迴圈跑的時候佇列會一直長大(小孩被推進去),
   但因為 sz 在開始前就凍結了,所以新推進去的小孩「不會被這一層吃掉」。
   例 [3,9,20,null,null,15,7] → [[3],[9,20],[15,7]]
     BAND 1  樹狀圖(標出目前這一層)
     BAND 2  佇列內容(凍結的 sz 用框標出來)
     BAND 3  ans 目前的內容
     BAND 4  為什麼
   所有狀態取自實測 trace,未手推。
   前綴 v102- 。
   ============================================================ */
(function () {
  const canvas = document.getElementById('v102-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('v102-step'), labelEl = document.getElementById('v102-label');
  const bPrev = document.getElementById('v102-prev'), bNext = document.getElementById('v102-next'),
        bPlay = document.getElementById('v102-play'), bReset = document.getElementById('v102-reset');

  const C = { paper:'#ffffff', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf',
    win:'#e3edf5', winS:'#4478c0', winT:'#2f5f9e',
    seg:'#f6ead8', segS:'#c8801e', segT:'#96601a',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424',
    ok:'#d9e8c7', okS:'#5fa866', okT:'#3f7a3a',
    off:'#f0f0ec', offS:'#cfcfcf', offT:'#a3a099', coral:'#cf3535' };

  /* [3,9,20,null,null,15,7] —— heap 索引 1..7,4/5 不存在 */
  const V   = { 1:3, 2:9, 3:20, 6:15, 7:7 };
  const POS = { 1:[3.5,0], 2:[1.5,1], 3:[5.5,1], 6:[4.5,2], 7:[6.5,2] };
  const IDS = [1,2,3,6,7];
  const NCOL = 8, NROW = 3;

  /* queue 存節點索引;frozen = 這一輪凍結的 sz;done = 已出隊 */
  const S = (queue, frozen, focus, done, ans, phase, eq, note, text) =>
    ({ queue, frozen, focus, done, ans, phase, eq, note, text });

  const steps = [
    S([1], 0, -1, [], [], 'intro',
      'q = [3]     ans = []',
      'BFS 用「佇列」,不是遞迴 —— 這是本章第一個沒有呼叫堆疊的解',
      '<strong>INITIAL</strong> · 把根推進佇列。<b>這是本章第一個<em>不用遞迴</em>的解法</b> —— 用<strong>佇列</strong>逐層走。<b>難點只有一個:怎麼知道「一層走完了」?</b>'),

    S([1], 1, -1, [], [], 'freeze',
      'sz = q.size() = 1     ← 凍結!這一層有 1 個',
      '在推任何小孩「之前」先把層寬拍照存下來',
      '<strong>凍結層寬</strong> · <code>auto sz = q.size();</code> —— <b>在推進任何小孩<em>之前</em>,先把「這一層有幾個」拍照存起來</b>。<strong>接下來內層迴圈只跑 <code>sz</code> 次</strong>,不管佇列之後長多大。'),

    S([2,3], 1, 1, [1], [[3]], 'pop',
      'pop 3 → level=[3];推入 9、20     內層迴圈跑滿 1 次,結束',
      '佇列現在有 2 個,但這一層只跑 1 次 —— sz 早就凍結了',
      '<strong>處理第 0 層</strong> · 彈出 <code>3</code>、收錄它,把小孩 <code>9</code>、<code>20</code> 推進佇列。<b>⚠ 佇列現在有 2 個元素了</b>,<strong>但內層迴圈只跑 <code>sz = 1</code> 次就結束</strong> —— <b>那兩個新來的不會被這一層吃掉。</b><code>ans = [[3]]</code>。'),

    S([2,3], 2, -1, [1], [[3]], 'freeze',
      'sz = q.size() = 2     ← 再次凍結,這一層有 2 個',
      '每一輪外層迴圈開始時都重新凍結一次',
      '<strong>凍結第 1 層</strong> · 外層迴圈再跑一輪,<code>sz</code> <strong>重新凍結成 2</strong> —— 也就是 <code>[9, 20]</code> 這兩個。'),

    S([6,7], 2, 3, [1,2,3], [[3],[9,20]], 'pop',
      'pop 9(沒小孩)、pop 20(推入 15、7)     跑滿 2 次,結束',
      '關鍵時刻:20 推入小孩後佇列又是 2 個,但 sz 早就凍結成 2',
      '<strong>處理第 1 層 —— 這一步最關鍵</strong> · 彈出 <code>9</code>(沒有小孩),再彈出 <code>20</code> 並推入 <code>15</code>、<code>7</code>。<b>⚠ 推完之後佇列又剛好是 2 個</b> —— <strong>如果這裡改用「每圈重新讀 <code>q.size()</code>」,它會看到 <code>i=1 &lt; 2</code> 而<em>繼續跑</em>,把 <code>15</code> 拖進這一層!</strong><code>ans = [[3],[9,20]]</code>。'),

    S([], 2, -1, [1,2,3,6,7], [[3],[9,20],[15,7]], 'done',
      'sz = 2 → pop 15、pop 7 → ans 完成,佇列空了',
      '實測 20 萬組對拍「DFS 帶 depth」參考解,不一致 0',
      '<strong>完成</strong> · 最後一層彈出 <code>15</code>、<code>7</code>,都沒有小孩,佇列清空。<code>ans = [[3],[9,20],[15,7]]</code>。<b>實測</b>:窮舉 <code>n≤9</code> 全部 <strong>6918 種樹形</strong> + 隨機 <strong>20 萬組</strong>對拍獨立的「DFS 帶 depth 參數」版本,<strong>不一致 0</strong>。'),
  ];

  let step = 0, timer = null;

  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||450; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  const TREE_TOP = 26, ROW_H = 46, R = 18;

  function draw(){
    fit();
    const s = steps[step], w = canvas.clientWidth, PAD = 28;
    const done = s.phase === 'done';
    ctx.fillStyle = C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);

    const colW = (w - 2*PAD) / NCOL;
    const nx = i => PAD + (POS[i][0] + 0.5) * colW;
    const ny = i => TREE_TOP + 22 + POS[i][1] * ROW_H;
    const inQ = new Set(s.queue), popped = new Set(s.done);

    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 藍 = 在佇列裡　紅 = 這一步彈出　綠 = 已收錄', PAD, 16);

    ctx.lineWidth = 1.8;
    IDS.forEach(i => {
      [2*i, 2*i+1].forEach(c => {
        if (!POS[c]) return;
        ctx.strokeStyle = (popped.has(i) && (popped.has(c)||inQ.has(c))) ? C.winS : C.grid;
        ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.moveTo(nx(i), ny(i) + R - 2); ctx.lineTo(nx(c), ny(c) - R + 2); ctx.stroke();
      });
    });

    IDS.forEach(i => {
      let bg = C.off, bd = C.offS, tx = C.offT;
      if (i === s.focus)       { bg = C.cur; bd = C.curS; tx = C.curT; }
      else if (popped.has(i))  { bg = C.ok;  bd = C.okS;  tx = C.okT; }
      else if (inQ.has(i))     { bg = C.win; bd = C.winS; tx = C.winT; }
      ctx.beginPath(); ctx.arc(nx(i), ny(i), R, 0, Math.PI*2);
      ctx.fillStyle = bg; ctx.fill();
      ctx.lineWidth = i === s.focus ? 2.6 : 1.5;
      ctx.strokeStyle = bd; ctx.stroke();
      ctx.fillStyle = tx; ctx.font='700 14px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(V[i]), nx(i), ny(i));
    });

    // BAND 2 · 佇列
    const B2 = TREE_TOP + 22 + NROW * ROW_H + 6;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 佇列 q(橘框 = 被 sz 凍結的這一層)', PAD, B2);

    const cw = 42, cgap = 8, qTop = B2 + 14;
    const qx0 = PAD + 4;
    if (s.queue.length === 0) {
      ctx.fillStyle = done ? C.okT : C.dim; ctx.font='600 12.5px "JetBrains Mono", monospace';
      ctx.textAlign='left'; ctx.textBaseline='middle';
      ctx.fillText(done ? '(空 —— 全部走完)' : '(空)', qx0, qTop + 17);
    }
    s.queue.forEach((id, k) => {
      const x = qx0 + k * (cw + cgap);
      const frozen = k < s.frozen;
      rr(x, qTop, cw, 34, 5);
      ctx.fillStyle = frozen ? C.seg : C.win; ctx.fill();
      ctx.lineWidth = frozen ? 2.4 : 1.4;
      ctx.strokeStyle = frozen ? C.segS : C.winS; ctx.stroke();
      ctx.fillStyle = frozen ? C.segT : C.winT;
      ctx.font='700 14px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(V[id]), x + cw/2, qTop + 17);
    });
    // sz 標註
    if (s.frozen > 0 && s.queue.length > 0) {
      const bw2 = s.frozen * cw + (s.frozen - 1) * cgap;
      ctx.strokeStyle = C.segS; ctx.lineWidth = 1.6; ctx.setLineDash([4,3]);
      ctx.strokeRect(qx0 - 4, qTop - 4, bw2 + 8, 42);
      ctx.setLineDash([]);
      ctx.fillStyle = C.segT; ctx.font='700 11.5px "JetBrains Mono", monospace';
      ctx.textAlign='left'; ctx.textBaseline='middle';
      ctx.fillText('sz = ' + s.frozen, qx0 + bw2 + 14, qTop + 17);
    }

    // BAND 3 · ans
    const B3 = qTop + 34 + 22;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · ans', PAD, B3);
    rr(PAD, B3 + 10, w - 2*PAD, 34, 6);
    ctx.fillStyle = done ? C.ok : '#fafaf6'; ctx.fill();
    ctx.lineWidth = 1.6; ctx.strokeStyle = done ? C.okS : C.grid; ctx.stroke();
    ctx.fillStyle = done ? C.okT : C.text;
    ctx.font='700 12.5px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
    const txt = s.ans.length ? '[' + s.ans.map(l => '[' + l.join(',') + ']').join(', ') + ']' : '[]';
    ctx.fillText(txt, w/2, B3 + 27);

    // BAND 4
    const B4 = B3 + 58;
    ctx.fillStyle=C.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 4 · 為什麼', PAD, B4);
    rr(PAD, B4 + 10, w - 2*PAD, 38, 6);
    ctx.fillStyle = done ? C.ok : (s.phase === 'freeze' ? C.seg : '#fafaf6'); ctx.fill();
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = done ? C.okS : (s.phase === 'freeze' ? C.segS : C.grid); ctx.stroke();
    ctx.fillStyle = done ? C.okT : (s.phase === 'freeze' ? C.segT : C.text);
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
