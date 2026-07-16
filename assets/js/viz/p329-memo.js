/* ============================================================
   P329 · Longest Increasing Path — 寫法 A:DFS + 記憶化 · viz  (va-*)
   dp[r][c] = 從 (r,c) 出發、只走「嚴格遞增」的最長路徑長度。
   遞迴到大的那端先算(頂點沒有更大鄰居 → dp=1),回程一路 +1。
   memo 讓每格只算一次 → 整體 O(mn)。
   grid = [[9,9,4],[6,6,8],[2,1,1]],最長鏈 1→2→6→9,答案 4。
   路徑座標:(2,1)=1 → (2,0)=2 → (1,0)=6 → (0,0)=9
     LEFT   3×3 grid(格值 + 右下角 memo 徽章)
     RIGHT  鏈條 9→6→2→1 的 dp 回填(頂點=1,往下 +1)
   ============================================================ */
(function () {
  const canvas = document.getElementById('va-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('va-step'), labelEl = document.getElementById('va-label');
  const bPrev = document.getElementById('va-prev'), bNext = document.getElementById('va-next'),
        bPlay = document.getElementById('va-play'), bReset = document.getElementById('va-reset');

  const COLOR = { paper:'#ffffff', ink:'#1a1a1a', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf',
    cell:'#fafaf6', cellS:'#cfcfcf', src:'#dbe8f6', srcS:'#4478c0', srcT:'#2f5f9e',
    cur:'#fbe7df', curS:'#d96e4e', curT:'#b3502f', done:'#d9e8c7', doneS:'#5fa866', doneT:'#3f7a3a', coral:'#d96e4e' };

  const A = [[9,9,4],[6,6,8],[2,1,1]];
  // 鏈:小 → 大  (座標, 值)。dp 回填順序是從大端(9)先算
  const CHAIN = [ {r:2,c:1,v:1}, {r:2,c:0,v:2}, {r:1,c:0,v:6}, {r:0,c:0,v:9} ];
  // memo 值:dp 從大端算起 9→1, 6→2, 2→3, 1→4
  const MEMO = { '0,0':1, '1,0':2, '2,0':3, '2,1':4 };

  // 每步揭示鏈上一格的 dp(從頂點 9 開始回填)
  const steps = [
    { reveal:0, cur:null,
      text:'<strong>INITIAL</strong> · <code>dp[r][c]</code> = 從 (r,c) 出發、只走<strong>嚴格遞增</strong>的最長路徑長。最長鏈是 <code>1→2→6→9</code>(左下角一路往上),答案 4。' },
    { reveal:1, cur:{r:0,c:0},
      text:'遞迴先<strong>潛到最大端</strong> <code>9</code>(頂點,四周沒有更大的)→ <code>dp=1</code>(只有自己)。這是遞迴的<strong>底</strong>。' },
    { reveal:2, cur:{r:1,c:0},
      text:'回程到 <code>6</code>:唯一更大的鄰居是 <code>9</code> → <code>dp = 1 + dp[9] = 2</code>。' },
    { reveal:3, cur:{r:2,c:0},
      text:'回到 <code>2</code>:更大的鄰居是 <code>6</code> → <code>dp = 1 + dp[6] = 3</code>。' },
    { reveal:4, cur:{r:2,c:1}, done:true,
      text:'回到起點 <code>1</code>:更大的鄰居是 <code>2</code> → <code>dp = 1 + dp[2] = 4</code>。答案 = 所有 dp 的<strong>最大值 = 4</strong>。memo 讓每格只算一次 → <strong>O(mn)</strong>。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,h=canvas.clientHeight,PAD=26;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,h);
    const done=!!s.done;
    // 鏈上「已回填 dp」的格數:reveal 表示已算好幾個(從大端起)
    const revealedKeys = new Set();
    for(let k=0;k<s.reveal;k++){ const idx=CHAIN.length-1-k; revealedKeys.add(CHAIN[idx].r+','+CHAIN[idx].c); }
    const inChain = new Set(CHAIN.map(p=>p.r+','+p.c));

    // ── LEFT · grid ──
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('矩陣 · 藍 = 最長鏈', PAD, 24);

    const cell=54, gx=PAD+6, gy=52;
    for(let r=0;r<3;r++) for(let c=0;c<3;c++){
      const x=gx+c*cell, y=gy+r*cell, key=r+','+c;
      const onChain=inChain.has(key), isCur=(s.cur&&s.cur.r===r&&s.cur.c===c), hasMemo=revealedKeys.has(key);
      rr(x+3,y+3,cell-6,cell-6,6);
      ctx.fillStyle=isCur?COLOR.cur:(onChain?COLOR.src:COLOR.cell);
      ctx.fill();
      ctx.lineWidth=isCur?3.2:(onChain?2.4:1.5); ctx.strokeStyle=isCur?COLOR.curS:(onChain?COLOR.srcS:COLOR.cellS); ctx.stroke();
      ctx.fillStyle=isCur?COLOR.curT:(onChain?COLOR.srcT:COLOR.text); ctx.font='700 19px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(String(A[r][c]), x+cell/2-6, y+cell/2-4);
      // memo 徽章(右下)
      if(hasMemo){
        const bx=x+cell-19, by=y+cell-19;
        rr(bx,by,15,14,3); ctx.fillStyle=COLOR.done; ctx.fill(); ctx.lineWidth=1.4; ctx.strokeStyle=COLOR.doneS; ctx.stroke();
        ctx.fillStyle=COLOR.doneT; ctx.font='700 10px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(String(MEMO[key]), bx+7.5, by+7);
      }
    }
    // 箭頭示意鏈方向(小→大)
    if(s.reveal>=1){
      ctx.strokeStyle=COLOR.srcS; ctx.lineWidth=2; ctx.setLineDash([4,3]);
      ctx.beginPath();
      const pts=CHAIN.map(p=>({x:gx+p.c*cell+cell/2, y:gy+p.r*cell+cell/2}));
      ctx.moveTo(pts[0].x,pts[0].y); for(let k=1;k<pts.length;k++) ctx.lineTo(pts[k].x,pts[k].y);
      ctx.stroke(); ctx.setLineDash([]);
    }

    // ── RIGHT · chain dp fill ──
    const px=gx+3*cell+40;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('dp 回填 · 從頂點往回 +1', px, 24);

    // 直排鏈條:9(頂,dp1) 在上,1(起點,dp4)在下
    const order=[3,2,1,0]; // CHAIN index: 9,6,2,1
    const rowH=42, ry0=52;
    for(let i=0;i<order.length;i++){
      const p=CHAIN[order[i]], key=p.r+','+p.c, shown=revealedKeys.has(key);
      const y=ry0+i*rowH;
      rr(px,y,150,34,6);
      ctx.fillStyle=shown?COLOR.done:'#f4f4f0'; ctx.fill();
      ctx.lineWidth=shown?2.2:1.4; ctx.strokeStyle=shown?COLOR.doneS:COLOR.cellS; ctx.stroke();
      ctx.textAlign='left'; ctx.textBaseline='middle';
      ctx.fillStyle=shown?COLOR.doneT:COLOR.grid; ctx.font='700 13px "JetBrains Mono", monospace';
      ctx.fillText('值 '+p.v, px+12, y+17);
      if(shown){
        ctx.textAlign='right'; ctx.fillStyle=COLOR.doneT; ctx.font='700 13px "JetBrains Mono", monospace';
        ctx.fillText('dp = '+MEMO[key], px+138, y+17);
      } else {
        ctx.textAlign='right'; ctx.fillStyle=COLOR.grid; ctx.font='600 12px "Noto Sans TC", sans-serif';
        ctx.fillText('待算', px+138, y+17);
      }
      if(i<order.length-1){ ctx.fillStyle=COLOR.dim; ctx.font='700 12px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.fillText('↑ +1', px+75, y+rowH-4); }
    }
    if(done){
      const y=ry0+4*rowH-2;
      ctx.fillStyle=COLOR.doneT; ctx.font='700 13px "Noto Sans TC", sans-serif'; ctx.textAlign='left'; ctx.textBaseline='middle';
      ctx.fillText('答案 = max dp = 4', px, y+8);
    }
  }

  function update(){ const s=steps[step]; if(stepEl) stepEl.textContent=String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0'); if(labelEl) labelEl.innerHTML=s.text; draw(); }
  function next(){ if(step<steps.length-1){step++;update();}else stop(); }
  function prev(){ if(step>0){step--;update();} }
  function reset(){ stop(); step=0; update(); }
  function play(){ if(timer){stop();return;} bPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){stop();return;} next(); },1800); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} if(bPlay) bPlay.textContent='Play'; }
  bPrev&&bPrev.addEventListener('click',prev); bNext&&bNext.addEventListener('click',next); bPlay&&bPlay.addEventListener('click',play); bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();}); if(window.ResizeObserver){ new ResizeObserver(()=>{fit();draw();}).observe(canvas); }
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw); fit(); update();
})();
