/* ============================================================
   P287 · Find the Duplicate Number — 陣列當成函數圖 + Floyd · viz
   把「index i 連一條邊到 index nums[i]」看成一張圖:
     · 值域是 [1,n] ⇒ 沒有任何邊指向 index 0 ⇒ 圖必定是 ρ 形(不是純圓)
     · 環的入口 = 有兩條以上的邊指進來的節點 = 重複的那個值
   於是問題完全變成 141:找環,再找入口。
   例 nums=[1,3,4,2,2] → 走訪 0→1→3→2→4→2→… → 入口 2 = 答案。
     BAND 1  陣列(索引/值)+ 它隱含的鏈 + slow / fast 標記
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

  const NUMS  = [1,3,4,2,2];          // 官方範例
  const CHAIN = [0,1,3,2,4];          // 走訪路徑上的索引:0→1→3→2→4→(回到 2)
  const BACK_FROM = 4, BACK_TO = 3;   // 回邊:鏈位置 4 → 鏈位置 3(索引 4 → 索引 2)
  const N = NUMS.length;

  const posOf = v => CHAIN.indexOf(v);   // 節點值 → 鏈上的位置

  // slow / fast 存「節點值」(也就是索引);-1 = 尚未開始
  const steps = [
    { slow:-1, fast:-1, phase:0, ans:-1,
      eq:'把 index i 連一條邊到 index nums[i]',
      note:'值域 [1,n] ⇒ 沒有邊指向 index 0 ⇒ 圖必定是 ρ 形,不是純圓',
      text:'<strong>INITIAL</strong> · 這題看起來是陣列題,但把 <strong><code>i → nums[i]</code> 當成一條邊</strong>之後,它就變成 <a href="../p141/index.html">141</a>。<strong>走訪路徑是 <code>0 → 1 → 3 → 2 → 4 → 2 → …</code></strong>,一定會進入迴圈(因為只有有限個節點)。而且<strong>值域是 <code>[1,n]</code>,所以「0」永遠不會是任何 <code>nums[i]</code></strong> —— 沒有邊指向 index 0,它必定在環外,圖是 <strong>ρ 形</strong>。' },

    { slow:1, fast:1, phase:1, ans:-1,
      eq:'slow = fast = nums[0] = 1   (兩個都從同一點出發)',
      note:'兩者初始相同 ⇒ 必須用 do-while,先動再比,否則第一次檢查就假相遇',
      text:'<strong>階段 1 · 起跑</strong> · 和 <a href="../p141/code.html">141</a> 一樣,<code>slow</code> 與 <code>fast</code> <strong>從同一點出發</strong>。所以這裡也必須用 <code>do-while</code> —— <strong>先各走一步再比</strong>。實測改成 <code>while</code>,窮舉 61497 組<strong>錯 34348 組</strong>(迴圈根本不會進去)。' },

    { slow:3, fast:2, phase:1, ans:-1,
      eq:'第 1 輪:slow = nums[1] = 3　　fast = nums[nums[1]] = 2',
      note:'slow 一步、fast 兩步 —— 距離每輪縮短 1,所以只會踩中不會跨過',
      text:'<strong>階段 1 · 第 1 輪</strong> · <code>slow</code> 走一步到 <strong>3</strong>,<code>fast</code> 走兩步到 <strong>2</strong>(<code>1 → 3 → 2</code>)。兩者不同,繼續。' },

    { slow:2, fast:2, phase:1, ans:-1, meet:true,
      eq:'第 2 輪:slow = 2　　fast = 2   → 相遇',
      note:'相遇點只是「環上的某一點」,不是入口 —— 這一點常被誤會',
      text:'<strong>階段 1 · 相遇</strong> · 兩個都落在 <strong>2</strong>。<strong>但 2 剛好就是答案是巧合嗎?</strong>不是巧合,但<strong>推理還沒完</strong> —— 相遇點只證明「有環」,它<strong>不一定是入口</strong>。以這個例子而言相遇點恰好等於入口,但一般不成立(見 <a href="../p141/review.html">141 的 A1</a>)。所以還需要階段 2。' },

    { slow:1, fast:2, phase:2, ans:-1,
      eq:'階段 2:slow 回到 nums[0] = 1,fast 留在相遇點 2,兩個都改成一次一步',
      note:'這一步就是 142 找環入口的那一招 —— 141 那頁實測 7260 種結構全部正確',
      text:'<strong>階段 2 · 重置</strong> · <code>slow</code> <strong>回到起點</strong>,<code>fast</code> <strong>留在相遇點</strong>,而且<strong>兩個都改成一次一步</strong>。這正是 <a href="https://leetcode.com/problems/linked-list-cycle-ii/" target="_blank" rel="noopener">142 找環入口 ↗</a> 的做法 —— <a href="../p141/review.html">141 那頁實測過 7260 種有環結構,找到的入口全部正確</a>。' },

    { slow:3, fast:4, phase:2, ans:-1,
      eq:'第 1 輪:slow = 3　　fast = 4',
      note:'兩者現在同速 —— 靠的是「相遇點到入口」與「起點到入口」距離同餘',
      text:'<strong>階段 2 · 第 1 輪</strong> · 兩個都走一步。能這樣做的理由是階段 1 留下的等式:<strong>slow 走的步數是 fast 的一半,而兩者在環上相遇 ⇒ slow 走的距離是環長的倍數</strong>。於是「從起點走 μ 步」和「從相遇點走 μ 步」會<strong>同時到達入口</strong>。' },

    { slow:2, fast:2, phase:2, ans:2, meet:true,
      eq:'第 2 輪:slow = 2　　fast = 2   → 相遇 = 環的入口',
      note:'入口 = 有兩條以上的邊指進來的節點 = 有兩個 i 使 nums[i] 相同 = 重複值',
      text:'<strong>階段 2 · 找到入口</strong> · 兩者在 <strong>2</strong> 相遇。<strong>為什麼入口就是答案?</strong>入口是<strong>「有兩條以上的邊指進來」</strong>的那個節點 —— 而一條邊 <code>i → nums[i]</code> 指向它,意思就是 <code>nums[i] = 入口</code>。<strong>兩條邊指進來,就是有兩個不同的 <code>i</code> 讓 <code>nums[i]</code> 相同</strong>,那正是重複的值。實測 30 萬組隨機測資,<strong>入口 != 重複值的有 0 組</strong>。' },

    { slow:2, fast:2, phase:3, ans:2, meet:true,
      eq:'return 2     // 全程沒有動過陣列,也沒有額外容器',
      note:'實測窮舉 714520 組(n=1..7 的全部合法輸入),不一致 0;陣列被修改 0 組',
      text:'<strong>完成</strong> · 回傳 <strong>2</strong>。這個解法同時滿足題目的兩個硬要求:<strong>不修改陣列</strong>(實測 10 萬組,陣列被改 <strong>0</strong> 組)與 <strong><code>O(1)</code> 額外空間</strong>(只有兩個 <code>int</code>)。<strong>正確性實測:窮舉 <code>n = 1..7</code> 的全部合法輸入共 714520 組,不一致 0</strong>。' },
  ];

  let step = 0, timer = null;

  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||430; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function arrowH(x1,x2,y,col){ ctx.strokeStyle=col; ctx.fillStyle=col; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(x1,y); ctx.lineTo(x2,y); ctx.stroke();
    const d=x2>x1?1:-1; ctx.beginPath(); ctx.moveTo(x2,y); ctx.lineTo(x2-d*8,y-5); ctx.lineTo(x2-d*8,y+5); ctx.closePath(); ctx.fill(); }

  const TAG = 66;
  const IDX_Y = 68, A_TOP = 80, AH = 40;
  const C_TOP = 172, CH = 44, C_MID = C_TOP + CH/2, C_BOT = C_TOP + CH;
  const PTR_Y = 160;

  function draw(){
    fit();
    const s = steps[step], w = canvas.clientWidth, PAD = 28;
    const done = s.phase === 3;
    ctx.fillStyle = C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);

    const area = w - 2*PAD - TAG;
    const cw = Math.min(56, area / N - 26);
    const gap = Math.min(40, (area - N*cw) / (N - 1));
    const x0 = PAD + TAG;
    const at = k => x0 + k*(cw+gap);
    const cx = k => at(k) + cw/2;

    const cell=(k,y,h,txt,bg,bd,tx,bold,fs)=>{ rr(at(k),y,cw,h,5);
      ctx.fillStyle=bg; ctx.fill(); ctx.lineWidth=bold?2.4:1.5; ctx.strokeStyle=bd; ctx.stroke();
      ctx.fillStyle=tx; ctx.font='700 '+(fs||15)+'px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(txt, cx(k), y+h/2); };
    const rowTag=(y,h,t,col)=>{ ctx.fillStyle=col; ctx.font='700 11.5px "JetBrains Mono", monospace';
      ctx.textAlign='right'; ctx.textBaseline='middle'; ctx.fillText(t, x0-12, y+h/2); };

    // ── BAND 1 標題 ──
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 上排 = 原陣列　下排 = 它隱含的鏈(i → nums[i])', PAD, 16);
    ctx.textAlign='right'; ctx.font='700 12.5px "JetBrains Mono", monospace';
    ctx.fillStyle = done ? C.okT : C.text;
    ctx.fillText(done ? '答案 = 2' : (s.phase===0 ? 'n = 4' : ('階段 ' + s.phase + ' / 2')), w - PAD, 16);

    ctx.textAlign='center'; ctx.font='700 12.5px "JetBrains Mono", monospace';
    ctx.fillStyle = done ? C.okT : (s.meet ? C.okT : C.winT);
    ctx.fillText(s.phase===0 ? '走訪路徑:0 → 1 → 3 → 2 → 4 → 2 → …(繞圈)'
                 : ('slow = ' + s.slow + '　　fast = ' + s.fast + (s.meet ? '　→ 相遇' : '')), w/2, 42);

    // ── 陣列 ──
    rowTag(A_TOP, AH, 'nums', C.text);
    for(let k=0;k<N;k++){
      const isDup = done && NUMS[k] === s.ans;
      cell(k, A_TOP, AH, String(NUMS[k]),
        isDup?C.ok:C.win, isDup?C.okS:C.grid, isDup?C.okT:C.winT, isDup, 15);
      ctx.fillStyle=C.dim; ctx.font='500 10.5px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='alphabetic'; ctx.fillText(String(k), cx(k), IDX_Y); }

    // ── 隱含的鏈 ──
    rowTag(C_TOP, CH, '鏈', done?C.okT:C.segT);
    // 前進箭頭
    for(let k=0;k+1<N;k++) arrowH(at(k)+cw+4, at(k+1)-4, C_MID, C.grid);
    // 回邊
    { const xA=cx(BACK_FROM), xB=cx(BACK_TO), dip=C_BOT+52;
      ctx.strokeStyle=C.segS; ctx.lineWidth=2.2;
      ctx.beginPath(); ctx.moveTo(xA, C_BOT+2); ctx.quadraticCurveTo((xA+xB)/2, dip, xB, C_BOT+2); ctx.stroke();
      ctx.fillStyle=C.segS; ctx.beginPath();
      ctx.moveTo(xB, C_BOT+2); ctx.lineTo(xB-5, C_BOT+13); ctx.lineTo(xB+5, C_BOT+13); ctx.closePath(); ctx.fill();
      ctx.fillStyle=C.segT; ctx.font='700 11px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='top';
      ctx.fillText('nums[4] = 2 → 繞回 index 2(環)', (xA+xB)/2, dip-16); }
    // 鏈上的節點
    const ps = s.slow>=0 ? posOf(s.slow) : -1;
    const pf = s.fast>=0 ? posOf(s.fast) : -1;
    for(let k=0;k<N;k++){
      const isEntry = done && CHAIN[k] === s.ans;
      const isS = k===ps, isF = k===pf;
      let bg,bd,tx;
      if(isEntry)            { bg=C.ok;  bd=C.okS;  tx=C.okT; }
      else if(isS&&isF)      { bg=C.ok;  bd=C.okS;  tx=C.okT; }
      else if(isF)           { bg=C.cur; bd=C.curS; tx=C.curT; }
      else if(isS)           { bg=C.win; bd=C.winS; tx=C.winT; }
      else if(k>=BACK_TO)    { bg=C.seg; bd=C.segS; tx=C.segT; }   // 環上的節點
      else                   { bg=C.off; bd=C.offS; tx=C.offT; }
      cell(k, C_TOP, CH, String(CHAIN[k]), bg, bd, tx, isS||isF||isEntry, 16); }

    // ── 指標標記 ──
    ctx.textAlign='center'; ctx.textBaseline='alphabetic'; ctx.font='700 11.5px "JetBrains Mono", monospace';
    if(ps>=0 && ps===pf){ ctx.fillStyle=C.okT; ctx.fillText('slow = fast', cx(ps), PTR_Y); }
    else { if(ps>=0){ ctx.fillStyle=C.winT; ctx.fillText('slow', cx(ps), PTR_Y); }
           if(pf>=0){ ctx.fillStyle=C.curT; ctx.fillText('fast', cx(pf), PTR_Y); } }

    // ── BAND 2 ──
    const B2 = 296;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 這一步做了什麼', PAD, B2);
    rr(PAD,B2+10,w-2*PAD,42,6);
    ctx.fillStyle = done?C.ok:(s.phase===0?'#fafaf6':(s.meet?C.ok:C.cur)); ctx.fill();
    ctx.lineWidth=1.6; ctx.strokeStyle = done?C.okS:(s.phase===0?C.grid:(s.meet?C.okS:C.curS)); ctx.stroke();
    ctx.fillStyle = done?C.okT:(s.phase===0?C.text:(s.meet?C.okT:C.curT));
    ctx.font='700 12.5px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(s.eq, w/2, B2+31);

    // ── BAND 3 ──
    const B3 = 368;
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
  function play(){ if(timer){stop();return;} bPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){stop();return;} next(); },2100); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} if(bPlay) bPlay.textContent='Play'; }
  bPrev&&bPrev.addEventListener('click',prev); bNext&&bNext.addEventListener('click',next); bPlay&&bPlay.addEventListener('click',play); bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();}); if(window.ResizeObserver){ new ResizeObserver(()=>{fit();draw();}).observe(canvas); }
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw); fit(); update();
})();
