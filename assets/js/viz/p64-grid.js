/* ============================================================
   P64 · Minimum Path Sum — 網格 DP(取 min)· viz
   和 62 同骨架,但求「最小成本」不是「數路徑」:
   dp[i][j] = grid[i][j] + min( dp[i-1][j](上) , dp[i][j-1](左) )。
   第一列/行是「前綴和」(只有一條路,成本累加),不是全 1。
   例 grid=[[1,3,1],[1,5,1],[4,2,1]] → dp[2][2]=7
     BAND 1  dp[](珊瑚=本步 · 綠=較小被選的來源 · 藍=較大沒選的)
     右側     dp = grid + min(上, 左)
     BAND 2  說明:和 62 差別 —— + 換成 min
   ============================================================ */
(function () {
  const canvas = document.getElementById('viz-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('viz-step'), labelEl = document.getElementById('viz-label');
  const bPrev = document.getElementById('viz-prev'), bNext = document.getElementById('viz-next'),
        bPlay = document.getElementById('viz-play'), bReset = document.getElementById('viz-reset');

  const COLOR = { paper:'#ffffff', ink:'#1a1a1a', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf',
    cell:'#fafaf6', cellS:'#cfcfcf', nil:'#f3f3ef', nilS:'#e2e2dc',
    src:'#dbe8f6', srcS:'#4478c0', srcT:'#2f5f9e',
    cur:'#fbe7df', curS:'#d96e4e', curT:'#b3502f', done:'#d9e8c7', doneS:'#5fa866', doneT:'#3f7a3a', coral:'#d96e4e' };

  const R = 3, C = 3;
  const GRID = [[1,3,1],[1,5,1],[4,2,1]];   // 成本
  const NIL = -1;
  // dp 完整 = [[1,4,5],[2,7,6],[6,8,7]]
  const steps = [
    { g:[[1,4,5],[2,NIL,NIL],[6,NIL,NIL]], cur:null, pick:null,
      text:'<strong>INITIAL</strong> · <code>dp[i][j]</code> = 走到 <code>(i,j)</code> 的<strong>最小成本和</strong>。第一列/行是<strong>前綴和</strong>(只有一條路,成本累加),不是 1。' },
    { g:[[1,4,5],[2,7,NIL],[6,NIL,NIL]], cur:[1,1], pick:'left',
      text:'<code>dp[1][1] = grid 5 + min(上 4, 左 2) = 5 + 2 = 7</code>。<strong>左</strong>比較小 → 從左走來。' },
    { g:[[1,4,5],[2,7,6],[6,NIL,NIL]], cur:[1,2], pick:'up',
      text:'<code>dp[1][2] = grid 1 + min(上 5, 左 7) = 1 + 5 = 6</code>。<strong>上</strong>比較小 → 從上走來。' },
    { g:[[1,4,5],[2,7,6],[6,8,NIL]], cur:[2,1], pick:'left',
      text:'<code>dp[2][1] = grid 2 + min(上 7, 左 6) = 2 + 6 = 8</code>。<strong>左</strong>較小。' },
    { g:[[1,4,5],[2,7,6],[6,8,7]], cur:[2,2], pick:'up', done:true,
      text:'<code>dp[2][2] = grid 1 + min(上 6, 左 8) = 1 + 6 = 7</code>。答案 <code>7</code>(最小成本路徑)。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,h=canvas.clientHeight,PAD=26;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,h);
    const cur=s.cur; const up=cur?[cur[0]-1,cur[1]]:null, left=cur?[cur[0],cur[1]-1]:null;
    const upPick=(s.pick==='up'), leftPick=(s.pick==='left');

    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · dp[i][j] = 最小成本(珊瑚=本步 · 綠=選中的較小來源 · 藍=沒選的)', PAD, 24);

    const cell=48, gx=64, gy=80;
    for(let j=0;j<C;j++){ ctx.fillStyle=COLOR.dim; ctx.font='700 10px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('j'+j, gx+j*cell+cell/2, gy-11); }
    for(let i=0;i<R;i++){ ctx.fillStyle=COLOR.dim; ctx.font='700 10px "JetBrains Mono", monospace'; ctx.textAlign='right'; ctx.textBaseline='middle'; ctx.fillText('i'+i, gx-9, gy+i*cell+cell/2); }
    for(let i=0;i<R;i++) for(let j=0;j<C;j++){
      const x=gx+j*cell, y=gy+i*cell; const val=s.g[i][j];
      const isCur=cur&&cur[0]===i&&cur[1]===j;
      const isUp=up&&up[0]===i&&up[1]===j, isLeft=left&&left[0]===i&&left[1]===j;
      const isChosen=(isUp&&upPick)||(isLeft&&leftPick);
      const isOther=(isUp&&!upPick)||(isLeft&&!leftPick);
      const filled=val!==NIL&&!isCur&&!isUp&&!isLeft;
      rr(x+3,y+3,cell-6,cell-6,5);
      let fill=COLOR.nil, stroke=COLOR.nilS, txt=COLOR.dim, lw=1.6;
      if(isCur){ fill=COLOR.cur; stroke=COLOR.curS; txt=COLOR.curT; lw=3.2; }
      else if(isChosen){ fill=COLOR.done; stroke=COLOR.doneS; txt=COLOR.doneT; lw=3; }
      else if(isOther){ fill=COLOR.src; stroke=COLOR.srcS; txt=COLOR.srcT; lw=2.2; }
      else if(filled){ fill=COLOR.cell; stroke=COLOR.cellS; txt=COLOR.ink; lw=1.8; }
      ctx.fillStyle=fill; ctx.fill(); ctx.lineWidth=lw; ctx.strokeStyle=stroke; ctx.stroke();
      if(val!==NIL){ ctx.fillStyle=txt; ctx.font='700 18px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(String(val), x+cell/2, y+cell/2+1); }
    }

    // right panel
    const px=gx+C*cell+42, pw=w-PAD-px;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('遞迴式', px, 74);
    rr(px,86,pw,64,6); ctx.fillStyle='#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=COLOR.grid; ctx.stroke();
    ctx.textAlign='left'; ctx.textBaseline='middle';
    ctx.fillStyle=COLOR.text; ctx.font='700 12px "JetBrains Mono", monospace';
    ctx.fillText('dp[i][j] =', px+14, 104);
    ctx.fillStyle=COLOR.doneT; ctx.font='600 11.5px "JetBrains Mono", monospace';
    ctx.fillText('grid[i][j] + min(上,左)', px+14, 122);
    ctx.font='600 12px "Noto Sans TC", sans-serif';
    if(cur){ const g=GRID[cur[0]][cur[1]]; const u=s.g[up[0]][up[1]], l=s.g[left[0]][left[1]]; const mn=Math.min(u,l);
      ctx.fillStyle=COLOR.curT; ctx.fillText('= '+g+' + min('+u+','+l+') = '+g+'+'+mn+' = '+s.g[cur[0]][cur[1]], px+14, 140); }
    else { ctx.fillStyle=COLOR.dim; ctx.fillText('第一列/行 = 前綴和', px+14, 140); }

    // right: 邊界
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textBaseline='alphabetic';
    ctx.fillText('邊界(前綴和)', px, 178);
    rr(px,190,pw,48,6); ctx.fillStyle='#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=COLOR.grid; ctx.stroke();
    ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillStyle=COLOR.text; ctx.font='600 12px "Noto Sans TC", sans-serif';
    ctx.fillText('第一列/行只有一條路', px+14, 208);
    ctx.fillText('→ 成本一路累加', px+14, 226);

    // BAND 2 · note
    const ty=262, done=!!s.done;
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 和 62 的差別', PAD, ty);
    rr(PAD,ty+12,w-PAD*2,40,6); ctx.fillStyle=done?COLOR.done:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?COLOR.doneS:COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(done){ ctx.fillStyle=COLOR.doneT; ctx.font='700 12.5px "JetBrains Mono", monospace'; ctx.fillText('骨架不變(依賴上、左);+ 計數 → min(...)+成本 求最小 → 62/63/64 同模板', w/2, ty+32); }
    else { ctx.fillStyle=COLOR.text; ctx.font='600 12.5px "Noto Sans TC", sans-serif'; ctx.fillText('62 是「上+左」數路徑;這裡是「min(上,左)+成本」求最小 —— 換聚合運算', w/2, ty+32); }
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
