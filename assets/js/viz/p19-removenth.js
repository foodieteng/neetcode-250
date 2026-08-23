/* ============================================================
   P19 · Remove Nth Node From End — 雙指標拉開固定間距 · viz
   單向串列沒有「倒數第 n 個」這種存取方式,但可以先把兩個指標拉開 n+1 格,
   再讓它們「同步前進」—— 前面那個走到 null 時,後面那個剛好停在
   「要刪的節點的前一個」。
     為什麼是 n+1 而不是 n:tail 要停在「前一個」才刪得掉(單向串列刪節點
     需要它的前驅),所以間距要多一格。
     為什麼要 dummy:n == sz 時要刪的是頭,而頭沒有前驅 —— dummy 就是那個前驅。
   例 sz=5, n=2 → 移除值 4 → [1,2,3,5]。
     BAND 1  dummy + 節點列 + tail / curr 標記 + 兩者的間距
     BAND 2  這一步做了什麼
     BAND 3  為什麼
   所有狀態取自實測 trace(見 review.html 範例 Trace),未手推。
   ============================================================ */
(function () {
  const canvas = document.getElementById('viz-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('viz-step'), labelEl = document.getElementById('viz-label');
  const bPrev = document.getElementById('viz-prev'), bNext = document.getElementById('viz-next'),
        bPlay = document.getElementById('viz-play'), bReset = document.getElementById('viz-reset');

  const C = { paper:'#ffffff', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf',
    win:'#e3edf5', winS:'#4478c0', winT:'#2f5f9e',
    seg:'#f6ead8', segS:'#c8801e', segT:'#96601a',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424',
    ok:'#d9e8c7', okS:'#5fa866', okT:'#3f7a3a',
    off:'#f0f0ec', offS:'#cfcfcf', offT:'#a3a099', coral:'#cf3535' };

  // 位置 0 = dummy,1..5 = 值 1..5;位置 6 = null(畫在最右邊)
  const VALS = [1,2,3,4,5];
  const SLOTS = VALS.length + 1;      // dummy + 5
  const N = 2;                         // 移除倒數第 2 個

  // tail / curr 用「位置」(0=dummy);curr = 6 表示 null
  const steps = [
    { tail:0, curr:0, removed:-1, act:'intro',
      eq:'dummy = new ListNode(0, head);   tail = curr = dummy;',
      note:'dummy 是「頭節點的前驅」—— 沒有它,n == sz(要刪頭)就沒得刪',
      text:'<strong>INITIAL</strong> · 單向串列沒有「倒數第 n 個」這種存取方式。想法是<strong>先把兩個指標拉開固定間距,再同步前進</strong> —— 前面那個走到底時,後面那個就落在該停的位置。<strong>dummy 在這裡是必要的</strong>:刪一個節點需要拿到<strong>它的前驅</strong>,而當要刪的是頭時,頭沒有前驅 —— dummy 就補上那個位置。' },

    { tail:0, curr:3, removed:-1, act:'gap',
      eq:'for (i = 0; i < n + 1; i++) curr = curr->next;   → curr 走了 3 步',
      note:'間距是 n+1 不是 n —— 多的那一格,是為了讓 tail 停在「前一個」',
      text:'<strong>拉開間距</strong> · <code>curr</code> 從 dummy 前進 <code>n + 1 = 3</code> 步。<strong>為什麼是 <code>n+1</code>?</strong>如果只走 <code>n</code> 步,同步前進結束時 <code>tail</code> 會<strong>剛好落在要刪的那個節點上</strong> —— 但單向串列<strong>刪不掉自己</strong>,需要前驅。<strong>多拉一格,<code>tail</code> 就停在前一個。</strong>實測少了 <code>+1</code>,<strong>465 組合法輸入全部錯</strong>。' },

    { tail:1, curr:4, removed:-1, act:'walk',
      eq:'while (curr) { tail = tail->next; curr = curr->next; }   第 1 次',
      note:'間距在同步前進時是不變量 —— 永遠維持 n+1 格',
      text:'<strong>同步前進 · 1</strong> · 兩個指標各走一步,<strong>間距完全不變</strong>。這就是雙指標法的核心不變量:<strong>拉開之後就鎖住,剩下的只是一起走</strong>。' },

    { tail:2, curr:5, removed:-1, act:'walk',
      eq:'第 2 次:tail → 2,curr → 5',
      note:'curr 已經是最後一個節點,下一步就出界',
      text:'<strong>同步前進 · 2</strong> · <code>curr</code> 走到最後一個節點(值 5)。再走一步它就是 <code>nullptr</code>,迴圈結束。' },

    { tail:3, curr:6, removed:-1, act:'walk',
      eq:'第 3 次:tail → 3,curr → null   → while 條件不成立,跳出',
      note:'迴圈條件是 while (curr) 不是 while (curr->next) —— 差一格,結果就差一個節點',
      text:'<strong>同步前進 · 3(最後一次)</strong> · <code>curr</code> 變成 <code>nullptr</code>,跳出。<code>tail</code> 停在值 <strong>3</strong> —— 正好是<strong>要刪的節點(值 4)的前一個</strong>。<strong>迴圈條件必須是 <code>while (curr)</code></strong>;寫成 <code>while (curr-&gt;next)</code> 會少走一步,實測 <strong>465 組錯 435 組</strong>。' },

    { tail:3, curr:6, removed:4, act:'remove',
      eq:'tail->next = tail->next->next;   跳過值 4',
      note:'被跳過的那個節點沒有人 delete —— 加上 dummy,每次呼叫漏 2 個',
      text:'<strong>移除</strong> · <code>tail-&gt;next</code>(值 4)被<strong>繞過去</strong>,直接接到值 5。<strong>但那個節點還在記憶體裡,沒有人 <code>delete</code> 它</strong> —— 加上同樣沒被釋放的 dummy,<strong>每次呼叫漏 2 個節點</strong>(實測呼叫 10 萬次 = 3125 KB)。LeetCode 的判題框架會回收,但那不代表程式碼對。' },

    { tail:3, curr:6, removed:4, act:'done',
      eq:'return dummy->next;   →  [1, 2, 3, 5]',
      note:'實測窮舉全部 465 組合法輸入(sz=1..30, n=1..sz),不一致 0',
      text:'<strong>完成</strong> · <code>[1, 2, 3, 5]</code>,<strong>一趟走完</strong>(這就是題目 follow-up 問的 one pass)。這題的測資空間<strong>可以完全窮舉</strong> —— <code>sz ≤ 30</code>、<code>1 ≤ n ≤ sz</code>,總共只有 <strong>465</strong> 種合法輸入,<strong>全部跑過,不一致 0</strong>。' },
  ];

  let step = 0, timer = null;

  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||330; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  const PTR_Y = 66, NODE_TOP = 84, NH = 46, GAP_Y = NODE_TOP + NH + 16;

  function draw(){
    fit();
    const s = steps[step], w = canvas.clientWidth, PAD = 28;
    const done = s.act === 'done';
    ctx.fillStyle = C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);

    const usable = w - 2*PAD - 44;                 // 右邊留給 null
    const cw = Math.min(58, usable / SLOTS - 18);
    const gap = Math.min(28, (usable - SLOTS*cw) / (SLOTS - 1));
    const x0 = PAD + 6;
    const at = k => x0 + k*(cw+gap);
    const cx = k => at(k) + cw/2;
    const nullX = at(SLOTS) + 6;                   // null 的位置

    // ── BAND 1 標題 ──
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 灰虛線框 = dummy 假頭　紅 = 要移除的節點', PAD, 16);
    ctx.textAlign='right'; ctx.font='700 12.5px "JetBrains Mono", monospace';
    ctx.fillStyle = done ? C.okT : C.text;
    ctx.fillText('sz = 5 · n = 2', w - PAD, 16);

    ctx.textAlign='center'; ctx.font='700 12.5px "JetBrains Mono", monospace';
    ctx.fillStyle = done ? C.okT : C.winT;
    const posName = k => k===0 ? 'dummy' : (k>=SLOTS ? 'null' : String(VALS[k-1]));
    ctx.fillText(done ? '完成 · 一趟走完(one pass)'
                 : ('tail → ' + posName(s.tail) + '　　curr → ' + posName(s.curr)), w/2, 42);

    // ── 節點 ──
    for (let k = 0; k < SLOTS; k++) {
      const isDummy = k === 0;
      const val = isDummy ? 'dummy' : String(VALS[k-1]);
      const isRemoved = !isDummy && VALS[k-1] === s.removed;
      const isTail = k === s.tail, isCurr = k === s.curr;
      let bg, bd, tx;
      if (isRemoved)      { bg = C.cur; bd = C.curS; tx = C.curT; }
      else if (isDummy)   { bg = C.off; bd = C.offS; tx = C.offT; }
      else if (done)      { bg = C.ok;  bd = C.okS;  tx = C.okT; }
      else if (isCurr)    { bg = C.seg; bd = C.segS; tx = C.segT; }
      else if (isTail)    { bg = C.win; bd = C.winS; tx = C.winT; }
      else                { bg = C.win; bd = C.grid; tx = C.winT; }
      rr(at(k), NODE_TOP, cw, NH, 5);
      ctx.fillStyle = bg; ctx.fill();
      ctx.lineWidth = (isTail||isCurr||isRemoved) ? 2.4 : 1.4; ctx.strokeStyle = bd;
      if (isDummy) ctx.setLineDash([4,3]);
      ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = tx; ctx.font = (isDummy?'700 11px':'700 16px') + ' "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(val, cx(k), NODE_TOP + NH/2);
      if (isRemoved) {                                        // 刪除線
        ctx.strokeStyle = C.curS; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(at(k)+6, NODE_TOP+NH/2); ctx.lineTo(at(k)+cw-6, NODE_TOP+NH/2); ctx.stroke(); }
    }
    // null 標記
    ctx.fillStyle = s.curr>=SLOTS ? C.segT : C.offT;
    ctx.font='700 13px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='middle';
    ctx.fillText('∅', nullX, NODE_TOP + NH/2);

    // ── 指標標記 ──
    ctx.textAlign='center'; ctx.textBaseline='alphabetic'; ctx.font='700 11.5px "JetBrains Mono", monospace';
    if (s.tail === s.curr) { ctx.fillStyle = C.curT; ctx.fillText('tail,curr', cx(s.tail), PTR_Y); }
    else {
      ctx.fillStyle = C.winT; ctx.fillText('tail', cx(s.tail), PTR_Y);
      ctx.fillStyle = C.segT;
      if (s.curr < SLOTS) ctx.fillText('curr', cx(s.curr), PTR_Y);
      else { ctx.textAlign='left'; ctx.fillText('curr', nullX - 4, PTR_Y); }
    }

    // ── 間距標示 ──
    if (s.curr > s.tail && s.curr < SLOTS) {
      const x1 = cx(s.tail), x2 = cx(s.curr);
      ctx.strokeStyle = C.coral; ctx.lineWidth = 1.5; ctx.setLineDash([4,3]);
      ctx.beginPath(); ctx.moveTo(x1, GAP_Y); ctx.lineTo(x2, GAP_Y); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = C.coral; ctx.font='700 11px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='top';
      ctx.fillText('間距 n+1 = ' + (s.curr - s.tail), (x1+x2)/2, GAP_Y + 4);
    } else if (s.curr >= SLOTS && !done && s.act === 'walk') {
      ctx.fillStyle = C.coral; ctx.font='700 11px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='top';
      ctx.fillText('curr 出界 → tail 正好停在「要刪的前一個」', w/2, GAP_Y + 4);
    }

    // ── BAND 2 ──
    const B2 = 190;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 這一步做了什麼', PAD, B2);
    rr(PAD,B2+10,w-2*PAD,42,6);
    ctx.fillStyle = done?C.ok:(s.act==='intro'?'#fafaf6':C.cur); ctx.fill();
    ctx.lineWidth=1.6; ctx.strokeStyle = done?C.okS:(s.act==='intro'?C.grid:C.curS); ctx.stroke();
    ctx.fillStyle = done?C.okT:(s.act==='intro'?C.text:C.curT);
    ctx.font='700 12.5px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(s.eq, w/2, B2+31);

    // ── BAND 3 ──
    const B3 = 262;
    ctx.fillStyle=C.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 為什麼', PAD, B3);
    rr(PAD,B3+10,w-2*PAD,40,6);
    ctx.fillStyle = done?C.ok:'#fafaf6'; ctx.fill();
    ctx.lineWidth=1.6; ctx.strokeStyle = done?C.okS:C.grid; ctx.stroke();
    ctx.fillStyle = done?C.okT:C.text;
    ctx.font='600 12.5px "Noto Sans TC", sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(s.note, w/2, B3+30);
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
