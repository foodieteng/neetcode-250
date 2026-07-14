/* ============================================================
   P62 · Unique Paths — 二維 DP 格子填表 · viz
   機器人只能往右或往下,從左上走到右下有幾條路?
   dp[i][j] = 走到格子 (i,j) 的路徑數 = dp[i-1][j](從上面來) + dp[i][j-1](從左邊來)。
   第一列、第一行都只有 1 條路(只能一路右 / 一路下)。
   例 m=3, n=4 → dp[2][3] = 10
     BAND 1  格子(珊瑚=本步 · 藍=上/左兩個來源)
     右側     遞迴式 + 移動方向
     BAND 2  說明
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

  const R = 3, C = 4;
  const NIL = -1;
  const steps = [
    { g:[[1,1,1,1],[1,NIL,NIL,NIL],[1,NIL,NIL,NIL]], cur:null,
      text:'<strong>INITIAL</strong> · <code>dp[i][j]</code> = 走到 <code>(i,j)</code> 的路徑數。<strong>第一列、第一行都是 1</strong>(只能一路往右 / 一路往下)。' },
    { g:[[1,1,1,1],[1,2,NIL,NIL],[1,NIL,NIL,NIL]], cur:[1,1],
      text:'<code>dp[1][1] = dp[0][1] + dp[1][0] = 1 + 1 = 2</code>。到這格只能<strong>從上面或從左邊</strong>來,路徑數相加。' },
    { g:[[1,1,1,1],[1,2,3,4],[1,NIL,NIL,NIL]], cur:[1,3],
      text:'第一列填完:<code>dp[1][3] = dp[0][3] + dp[1][2] = 1 + 3 = 4</code>。' },
    { g:[[1,1,1,1],[1,2,3,4],[1,3,NIL,NIL]], cur:[2,1],
      text:'<code>dp[2][1] = dp[1][1] + dp[2][0] = 2 + 1 = 3</code>。' },
    { g:[[1,1,1,1],[1,2,3,4],[1,3,6,10]], cur:[2,3], done:true,
      text:'<code>dp[2][3] = dp[1][3] + dp[2][2] = 4 + 6 = 10</code>。回傳右下角 <code>dp[m-1][n-1] = 10</code>。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,h=canvas.clientHeight,PAD=26;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,h);
    const cur=s.cur; const up = cur?[cur[0]-1,cur[1]]:null, left = cur?[cur[0],cur[1]-1]:null;

    // BAND 1 header
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · dp[i][j] = 走到 (i,j) 的路徑數(珊瑚=本步 · 藍=上/左來源)', PAD, 24);

    // grid (left)
    const cell=44, gx=64, gy=76;
    // col headers j
    for(let j=0;j<C;j++){ ctx.fillStyle=COLOR.dim; ctx.font='700 10px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('j'+j, gx+j*cell+cell/2, gy-11); }
    // row headers i
    for(let i=0;i<R;i++){ ctx.fillStyle=COLOR.dim; ctx.font='700 10px "JetBrains Mono", monospace'; ctx.textAlign='right'; ctx.textBaseline='middle';
      ctx.fillText('i'+i, gx-9, gy+i*cell+cell/2); }
    for(let i=0;i<R;i++) for(let j=0;j<C;j++){
      const x=gx+j*cell, y=gy+i*cell; const val=s.g[i][j];
      const isCur=cur&&cur[0]===i&&cur[1]===j;
      const isUp=up&&up[0]===i&&up[1]===j, isLeft=left&&left[0]===i&&left[1]===j;
      const filled=val!==NIL&&!isCur&&!isUp&&!isLeft;
      rr(x+3,y+3,cell-6,cell-6,5);
      let fill=COLOR.nil, stroke=COLOR.nilS, txt=COLOR.dim, lw=1.6;
      if(isCur){ fill=COLOR.cur; stroke=COLOR.curS; txt=COLOR.curT; lw=3.2; }
      else if(isUp||isLeft){ fill=COLOR.src; stroke=COLOR.srcS; txt=COLOR.srcT; lw=2.8; }
      else if(filled){ fill=COLOR.cell; stroke=COLOR.cellS; txt=COLOR.ink; lw=1.8; }
      ctx.fillStyle=fill; ctx.fill(); ctx.lineWidth=lw; ctx.strokeStyle=stroke; ctx.stroke();
      if(val!==NIL){ ctx.fillStyle=txt; ctx.font='700 18px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(String(val), x+cell/2, y+cell/2+1); }
    }

    // right panel
    const px=gx+C*cell+42, pw=w-PAD-px;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('遞迴式', px, 70);
    rr(px,82,pw,64,6); ctx.fillStyle='#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=COLOR.grid; ctx.stroke();
    ctx.textAlign='left'; ctx.textBaseline='middle';
    ctx.fillStyle=COLOR.text; ctx.font='700 12px "JetBrains Mono", monospace';
    ctx.fillText('dp[i][j] =', px+14, 102);
    ctx.fillStyle=COLOR.srcT; ctx.font='600 11.5px "JetBrains Mono", monospace';
    ctx.fillText('dp[i-1][j] + dp[i][j-1]', px+14, 120);
    ctx.font='600 11.5px "Noto Sans TC", sans-serif';
    if(cur){ const u=s.g[up[0]][up[1]], l=s.g[left[0]][left[1]];
      ctx.fillStyle=COLOR.curT; ctx.fillText('上 '+u+' + 左 '+l+' = '+s.g[cur[0]][cur[1]], px+14, 138); }
    else { ctx.fillStyle=COLOR.dim; ctx.fillText('第一列/行 = 1(只有一條路)', px+14, 138); }

    // right panel: 移動方向
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textBaseline='alphabetic';
    ctx.fillText('只能往右 → 或往下 ↓', px, 174);
    rr(px,186,pw,50,6); ctx.fillStyle='#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=COLOR.grid; ctx.stroke();
    ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillStyle=COLOR.text; ctx.font='600 12px "Noto Sans TC", sans-serif';
    ctx.fillText('到 (i,j) 只可能從', px+14, 205);
    ctx.fillText('上一格或左一格走來', px+14, 223);

    // BAND 2 · note (bottom full-width)
    const ty=262, done=!!s.done;
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 空間優化(你的 1D 版)', PAD, ty);
    rr(PAD,ty+12,w-PAD*2,40,6); ctx.fillStyle=done?COLOR.done:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?COLOR.doneS:COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(done){ ctx.fillStyle=COLOR.doneT; ctx.font='700 12.5px "JetBrains Mono", monospace'; ctx.fillText('dp[j] += dp[j-1]:同一列滾動 —— dp[j] 是「上」、dp[j-1] 是「左」→ 一維 O(n)', w/2, ty+32); }
    else { ctx.fillStyle=COLOR.text; ctx.font='600 12.5px "Noto Sans TC", sans-serif'; ctx.fillText('每格只看「上」和「左」→ 只需保留一列 → dp[j] += dp[j-1] 就地更新', w/2, ty+32); }
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
