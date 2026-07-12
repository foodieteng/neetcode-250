/* ============================================================
   P746 · Min Cost Climbing Stairs — 一維 DP 填表(逐步)· viz
   dp[i] = 到達位置 i 的最小花費。從 i-1 或 i-2 上來,要付「離開那階」的
   cost:dp[i] = min(dp[i-1] + cost[i-1], dp[i-2] + cost[i-2])。base:可從
   0 或 1 免費起步 → dp[0]=dp[1]=0。頂樓是位置 n(最後一階的再上一格)。
   例 cost=[10,15,20] → dp=[0,0,10,15],答案 15
     BAND 1  cost[] + dp[](珊瑚=本步填的 · 藍=兩個來源)
     BAND 2  dp[i] = min(dp[i-1]+cost[i-1], dp[i-2]+cost[i-2])
     BAND 3  說明
   ============================================================ */
(function () {
  const canvas = document.getElementById('viz-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('viz-step'), labelEl = document.getElementById('viz-label');
  const bPrev = document.getElementById('viz-prev'), bNext = document.getElementById('viz-next'),
        bPlay = document.getElementById('viz-play'), bReset = document.getElementById('viz-reset');

  const COLOR = { paper:'#ffffff', ink:'#1a1a1a', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf',
    cell:'#fafaf6', cellS:'#cfcfcf', cost:'#f6ead8', costS:'#d9a25a', costT:'#9a6a2a',
    src:'#dbe8f6', srcS:'#4478c0', srcT:'#2f5f9e', cur:'#fbe7df', curS:'#d96e4e', curT:'#b3502f',
    done:'#d9e8c7', doneS:'#5fa866', doneT:'#3f7a3a', coral:'#d96e4e' };

  const COST = [10,15,20];       // n=3
  const N = COST.length;         // dp has N+1 cells (0..N), N = top
  const NIL = -1;
  // pick: which source won (i-1 or i-2), for annotation
  const steps = [
    { dp:[0,0,NIL,NIL], cur:NIL, src:[], pick:null,
      text:'<strong>INITIAL</strong> · <code>dp[i]</code> = 到位置 <code>i</code> 的最小花費。可從第 0 或第 1 階<strong>免費起步</strong> → <code>dp[0]=dp[1]=0</code>。頂樓 = 位置 <code>3</code>。' },
    { dp:[0,0,10,NIL], cur:2, src:[1,0], pick:0,
      text:'<code>dp[2] = min(dp[1]+cost[1], dp[0]+cost[0]) = min(0+15, 0+10) = 10</code>。從第 0 階跨 2 上來、付 10 較省。' },
    { dp:[0,0,10,15], cur:3, src:[2,1], pick:1, done:true,
      text:'<code>dp[3] = min(dp[2]+cost[2], dp[1]+cost[1]) = min(10+20, 0+15) = 15</code>。從第 1 階直接跨到頂、付 15 較省。回傳 <code>dp[3] = 15</code>。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||420; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,h=canvas.clientHeight,PAD=26;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,h);
    const srcSet=new Set(s.src);
    const cw=Math.min(84,(w-2*PAD)/(N+1)); const gx=(w-(N+1)*cw)/2;

    // ── BAND 1 · cost row + dp row
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · cost[](離開該階要付)+ dp[](珊瑚=本步 · 藍=兩個來源)', PAD, 24);
    // cost row
    const costY=52, ch=32;
    for(let k=0;k<N;k++){ const x=gx+k*cw; const isSrcCost=srcSet.has(k);
      rr(x+6,costY,cw-12,ch,5); ctx.fillStyle=isSrcCost?COLOR.cost:'#fbf6ec'; ctx.fill(); ctx.lineWidth=1.5; ctx.strokeStyle=isSrcCost?COLOR.costS:COLOR.grid; ctx.stroke();
      ctx.fillStyle=isSrcCost?COLOR.costT:COLOR.dim; ctx.font='700 14px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(String(COST[k]), x+cw/2, costY+ch/2+1); }
    ctx.fillStyle=COLOR.dim; ctx.font='600 10px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText('cost', PAD-4, costY+ch/2);
    // dp row
    const dpY=104, dh=50;
    for(let i=0;i<=N;i++){ const x=gx+i*cw; const val=s.dp[i];
      const isCur=(i===s.cur), isSrc=srcSet.has(i), filled=val!==NIL&&!isCur&&!isSrc;
      ctx.fillStyle=COLOR.dim; ctx.font='700 11px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(i===N?String(i)+'·頂':String(i), x+cw/2, dpY-11);
      rr(x+6,dpY,cw-12,dh,5);
      ctx.fillStyle=isCur?COLOR.cur:(isSrc?COLOR.src:(filled?COLOR.done:COLOR.cell)); ctx.fill();
      ctx.lineWidth=isCur?3.2:1.8; ctx.strokeStyle=isCur?COLOR.curS:(isSrc?COLOR.srcS:(filled?COLOR.doneS:COLOR.cellS)); ctx.stroke();
      ctx.fillStyle=isCur?COLOR.curT:(isSrc?COLOR.srcT:(filled?COLOR.doneT:COLOR.grid)); ctx.font='700 20px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(val===NIL?'·':String(val), x+cw/2, dpY+dh/2+1); }

    // ── BAND 2 · equation
    let by=190;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · dp[i] = min( dp[i-1]+cost[i-1] , dp[i-2]+cost[i-2] )', PAD, by);
    const eqBox=by+12; rr(PAD,eqBox,w-PAD*2,44,6); ctx.fillStyle='#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(s.cur===NIL){ ctx.fillStyle=COLOR.text; ctx.font='600 13px "Noto Sans TC", sans-serif'; ctx.fillText('到位置 i:從 i-1 或 i-2 上來,各自要付「離開那階」的 cost,取較省的', w/2, eqBox+23); }
    else { const i=s.cur; const a=s.dp[i-1]+COST[i-1], b=s.dp[i-2]+COST[i-2]; const v=s.dp[i];
      ctx.fillStyle=s.done?COLOR.doneT:COLOR.curT; ctx.font='700 16px "JetBrains Mono", monospace';
      ctx.fillText(`dp[${i}] = min(${s.dp[i-1]}+${COST[i-1]}, ${s.dp[i-2]}+${COST[i-2]}) = min(${a}, ${b}) = ${v}`, w/2, eqBox+23); }

    // ── BAND 3 · note
    const ty=eqBox+64, done=!!s.done;
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 和 70 的差別', PAD, ty);
    const box=ty+12; rr(PAD,box,w-PAD*2,40,6); ctx.fillStyle=done?COLOR.done:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?COLOR.doneS:COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(done){ ctx.fillStyle=COLOR.doneT; ctx.font='700 13px "JetBrains Mono", monospace'; ctx.fillText('return dp[n] = 15 · 只依賴前兩項 → 兩變數 O(1) 空間', w/2, box+20); }
    else { ctx.fillStyle=COLOR.text; ctx.font='600 12px "Noto Sans TC", sans-serif'; ctx.fillText('70 是「數方法(相加)」;746 是「求最省(取 min)」—— 同骨架,聚合方式不同', w/2, box+20); }
  }

  function update(){ const s=steps[step]; if(stepEl) stepEl.textContent=String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0'); if(labelEl) labelEl.innerHTML=s.text; draw(); }
  function next(){ if(step<steps.length-1){step++;update();}else stop(); }
  function prev(){ if(step>0){step--;update();} }
  function reset(){ stop(); step=0; update(); }
  function play(){ if(timer){stop();return;} bPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){stop();return;} next(); },1700); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} if(bPlay) bPlay.textContent='Play'; }
  bPrev&&bPrev.addEventListener('click',prev); bNext&&bNext.addEventListener('click',next); bPlay&&bPlay.addEventListener('click',play); bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();}); if(window.ResizeObserver){ new ResizeObserver(()=>{fit();draw();}).observe(canvas); }
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw); fit(); update();
})();
