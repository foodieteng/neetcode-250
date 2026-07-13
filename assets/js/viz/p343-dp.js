/* ============================================================
   P343 · Integer Break — 切 vs 不切(逐步)· viz
   dp[i] = 把 i 拆成「≥2 塊正整數」的最大乘積(一定要拆,所以 dp[2]=1、dp[3]=2)。
   對每個切點 j(1..i-1),比較兩種:
     不切:j × (i-j)      ← 把另一塊 i-j 留整塊
     切  :j × dp[i-j]    ← 把 i-j 繼續拆到最優
   dp[i] = max 全部的 j 與這兩種。因為 dp[i-j] 逼你「一定拆」,所以要另外
   放「不切」那項,才能考慮「把 i-j 留整塊」更好的情形。
   dp[0..8] = [1,1,1,2,4,6,9,12,18]
     BAND 1  dp[](珊瑚=本步 i · 藍=切時的來源 dp[i-j])
     BAND 2  不切 j×(i-j)  vs  切 j×dp[i-j]
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
    cell:'#fafaf6', cellS:'#cfcfcf', src:'#dbe8f6', srcS:'#4478c0', srcT:'#2f5f9e',
    cur:'#fbe7df', curS:'#d96e4e', curT:'#b3502f', done:'#d9e8c7', doneS:'#5fa866', doneT:'#3f7a3a', coral:'#d96e4e' };

  const N = 8;
  const FULL = [1,1,1,2,4,6,9,12,18];
  const NIL = -1;
  function upto(i){ const a=new Array(N+1).fill(NIL); for(let k=0;k<=i;k++) a[k]=FULL[k]; return a; }
  // 每步:i、切點 j、uncut=j*(i-j)、cut=j*dp[i-j]、winner
  const steps = [
    { dp:upto(1), i:NIL, j:0, uncut:0, cut:0, win:null,
      text:'<strong>INITIAL</strong> · <code>dp[i]</code> = 把 <code>i</code> 拆成 <strong>≥2 塊</strong>的最大乘積。<strong>一定要拆</strong> → <code>dp[2]=1</code>(1×1)、<code>dp[3]=2</code>(1×2)。' },
    { dp:upto(4), i:4, j:2, uncut:4, cut:2, win:'uncut',
      text:'<code>i=4, j=2</code> · <strong>不切</strong> <code>2×(4−2)=4</code> vs <strong>切</strong> <code>2×dp[2]=2×1=2</code> → <strong>不切贏</strong>!把 2 留整塊比切成 1+1 好。<code>dp[4]=4</code>。' },
    { dp:upto(6), i:6, j:3, uncut:9, cut:6, win:'uncut',
      text:'<code>i=6, j=3</code> · <strong>不切</strong> <code>3×3=9</code> vs <strong>切</strong> <code>3×dp[3]=3×2=6</code> → 不切贏。<code>dp[6]=9</code>(3×3)。' },
    { dp:upto(8), i:8, j:3, uncut:15, cut:18, win:'cut', done:true,
      text:'<code>i=8, j=3</code> · <strong>不切</strong> <code>3×5=15</code> vs <strong>切</strong> <code>3×dp[5]=3×6=18</code> → <strong>切贏</strong>!把 5 繼續拆更優。<code>dp[8]=18</code>。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,h=canvas.clientHeight,PAD=26;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,h);
    const predIdx = s.i!==NIL ? s.i - s.j : -99;   // dp[i-j] 來源(切的時候)

    // BAND 1 · dp
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · dp[i] = 拆成 ≥2 塊的最大乘積(珊瑚=本步 i · 藍=切時來源 dp[i-j])', PAD, 24);
    const NC=N+1; const cw=Math.min(56,(w-2*PAD)/(NC+0.5)); const gx=(w-NC*cw)/2, gy=72, chh=44;
    for(let k=0;k<NC;k++){ const x=gx+k*cw; const val=s.dp[k];
      const isCur=(k===s.i), isPred=(k===predIdx && s.win==='cut'), filled=val!==NIL&&!isCur&&!isPred;
      ctx.fillStyle=COLOR.dim; ctx.font='700 10px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(k), x+cw/2, gy-13);
      rr(x+3,gy,cw-6,chh,5);
      ctx.fillStyle=isCur?COLOR.cur:(isPred?COLOR.src:(filled?COLOR.done:COLOR.cell)); ctx.fill();
      ctx.lineWidth=isCur?3.2:(isPred?2.6:1.8); ctx.strokeStyle=isCur?COLOR.curS:(isPred?COLOR.srcS:(filled?COLOR.doneS:COLOR.cellS)); ctx.stroke();
      ctx.fillStyle=isCur?COLOR.curT:(isPred?COLOR.srcT:(filled?COLOR.doneT:COLOR.grid)); ctx.font='700 17px "JetBrains Mono", monospace';
      ctx.fillText(val===NIL?'·':String(val), x+cw/2, gy+chh/2+1);
    }

    // BAND 2 · 不切 vs 切
    const by=140;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 這一步的兩條路,取較大的當候選', PAD, by);
    const boxW=Math.min(210,(w-3*PAD)/2), boxY=by+26, boxH=52;
    const lX=w/2-boxW-12, rX=w/2+12;
    if(s.i===NIL){
      rr(PAD,boxY,w-PAD*2,boxH,6); ctx.fillStyle='#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=COLOR.grid; ctx.stroke();
      ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillStyle=COLOR.text; ctx.font='600 13px "Noto Sans TC", sans-serif';
      ctx.fillText('對每個切點 j:比較「另一塊留整塊」與「另一塊繼續拆」,取較大', w/2, boxY+boxH/2);
    } else {
      const uncutWin=(s.win==='uncut');
      // 不切 box (left)
      ctx.textAlign='center'; ctx.textBaseline='alphabetic';
      ctx.fillStyle=uncutWin?COLOR.doneT:COLOR.dim; ctx.font='700 12px "JetBrains Mono", monospace';
      ctx.fillText('不切  j×(i-j)', lX+boxW/2, boxY-4);
      rr(lX,boxY,boxW,boxH,7); ctx.fillStyle=uncutWin?COLOR.done:'#fafaf6'; ctx.fill(); ctx.lineWidth=uncutWin?2.8:1.6; ctx.strokeStyle=uncutWin?COLOR.doneS:COLOR.grid; ctx.stroke();
      ctx.fillStyle=uncutWin?COLOR.doneT:COLOR.text; ctx.font='700 18px "JetBrains Mono", monospace'; ctx.textBaseline='middle';
      ctx.fillText(`${s.j}×${s.i-s.j} = ${s.uncut}`+(uncutWin?'  ✓':''), lX+boxW/2, boxY+boxH/2+1);
      // 切 box (right)
      ctx.textBaseline='alphabetic';
      ctx.fillStyle=!uncutWin?COLOR.doneT:COLOR.dim; ctx.font='700 12px "JetBrains Mono", monospace';
      ctx.fillText('切  j×dp[i-j]', rX+boxW/2, boxY-4);
      rr(rX,boxY,boxW,boxH,7); ctx.fillStyle=!uncutWin?COLOR.done:'#fafaf6'; ctx.fill(); ctx.lineWidth=!uncutWin?2.8:1.6; ctx.strokeStyle=!uncutWin?COLOR.doneS:COLOR.grid; ctx.stroke();
      ctx.fillStyle=!uncutWin?COLOR.doneT:COLOR.text; ctx.font='700 18px "JetBrains Mono", monospace'; ctx.textBaseline='middle';
      ctx.fillText(`${s.j}×${s.dp[s.i-s.j]} = ${s.cut}`+(!uncutWin?'  ✓':''), rX+boxW/2, boxY+boxH/2+1);
    }

    // BAND 3 · note
    const ty=boxY+boxH+22, done=!!s.done;
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 為什麼要兩項', PAD, ty);
    const box=ty+12, boxH2=40; rr(PAD,box,w-PAD*2,boxH2,6); ctx.fillStyle=done?COLOR.done:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?COLOR.doneS:COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(done){ ctx.fillStyle=COLOR.doneT; ctx.font='700 12.5px "JetBrains Mono", monospace'; ctx.fillText('dp[i-j] 逼你「一定拆」→ 另放「不切」項,才能考慮留整塊。小塊別切、大塊才切', w/2, box+boxH2/2); }
    else { ctx.fillStyle=COLOR.text; ctx.font='600 12.5px "Noto Sans TC", sans-serif'; ctx.fillText('dp[i-j] 的定義是「一定要再拆」;想「不拆 i-j」就得靠 j×(i-j) 這一項', w/2, box+boxH2/2); }
  }

  function update(){ const s=steps[step]; if(stepEl) stepEl.textContent=String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0'); if(labelEl) labelEl.innerHTML=s.text; draw(); }
  function next(){ if(step<steps.length-1){step++;update();}else stop(); }
  function prev(){ if(step>0){step--;update();} }
  function reset(){ stop(); step=0; update(); }
  function play(){ if(timer){stop();return;} bPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){stop();return;} next(); },1900); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} if(bPlay) bPlay.textContent='Play'; }
  bPrev&&bPrev.addEventListener('click',prev); bNext&&bNext.addEventListener('click',next); bPlay&&bPlay.addEventListener('click',play); bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();}); if(window.ResizeObserver){ new ResizeObserver(()=>{fit();draw();}).observe(canvas); }
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw); fit(); update();
})();
