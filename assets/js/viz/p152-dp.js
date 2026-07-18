/* ============================================================
   P152 · Maximum Product Subarray — 同時記 max 與 min · viz
   乘積和「加總」不同:一個負數會把最大變最小、最小變最大。
   所以每一步同時維護「以 i 結尾的最大乘積 maxP」與「最小乘積 minP」:
     若 nums[i] < 0,先 swap(maxP, minP)（負數翻轉大小關係)
     maxP = max(maxP * nums[i], nums[i])
     minP = min(minP * nums[i], nums[i])
     ans  = max(ans, maxP)
   例 nums=[3,-2,-3,4] → 72(整段:3·-2·-3·4)
     BAND 1  nums[](紅=本步)
     BAND 2  maxP / minP 兩個暫存器(負數時先交換)
     BAND 3  ans + 為什麼要記 min
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
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424', done:'#d9e8c7', doneS:'#5fa866', doneT:'#3f7a3a', coral:'#cf3535' };

  const NUMS = [3, -2, -3, 4];
  const N = NUMS.length;
  const steps = [
    { i:0, swapped:false, maxP:3, minP:3, ans:3,
      text:'<strong>INITIAL</strong> · 從第 0 個開始:<code>maxP = minP = ans = nums[0] = 3</code>。<code>maxP/minP</code> = 以目前位置結尾的最大 / 最小乘積。' },
    { i:1, swapped:true, maxP:-2, minP:-6, ans:3,
      text:'<code>i=1, num=-2</code>(負)· 先 <strong>swap</strong>。<code>maxP=max(3×-2, -2)=-2</code>;<code>minP=min(3×-2, -2)=-6</code>。ans 仍 3。' },
    { i:2, swapped:true, maxP:18, minP:-3, ans:18,
      text:'<code>i=2, num=-3</code>(負)· 先 <strong>swap</strong> → 舊 minP <code>-6</code> 變 maxP 來源。<code>maxP=max(-6×-3, -3)=18</code>(負負得正!)。ans=18。' },
    { i:3, swapped:false, maxP:72, minP:-12, ans:72, done:true,
      text:'<code>i=3, num=4</code> · <code>maxP=max(18×4, 4)=72</code>。<code>ans=max(18,72)=72</code>。回傳 <strong>72</strong>(整段 3·-2·-3·4)。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,h=canvas.clientHeight,PAD=26;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,h);

    // BAND 1 · nums
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · nums[](紅=本步 i · 綠=已處理)', PAD, 24);
    const cw=Math.min(70,(w-2*PAD)/(N+1)); const gx=(w-N*cw)/2, ny=50, chh=42;
    for(let k=0;k<N;k++){ const x=gx+k*cw; const isCur=(k===s.i), doneN=(k<s.i);
      ctx.fillStyle=COLOR.dim; ctx.font='700 11px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(k), x+cw/2, ny-13);
      rr(x+4,ny,cw-8,chh,5);
      ctx.fillStyle=isCur?COLOR.cur:(doneN?COLOR.done:COLOR.cell); ctx.fill();
      ctx.lineWidth=isCur?3.2:1.8; ctx.strokeStyle=isCur?COLOR.curS:(doneN?COLOR.doneS:COLOR.cellS); ctx.stroke();
      ctx.fillStyle=isCur?COLOR.curT:(doneN?COLOR.doneT:COLOR.ink); ctx.font='700 19px "JetBrains Mono", monospace';
      ctx.fillText(String(NUMS[k]), x+cw/2, ny+chh/2+1);
    }

    // BAND 2 · maxP / minP registers
    const by=118;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · maxP / minP(同時記最大與最小;負數會翻轉大小)', PAD, by);
    const boxW=Math.min(190,(w-3*PAD)/2), boxY=by+14, boxH=52;
    const maxX=w/2-boxW-14, minX=w/2+14;
    // labels
    ctx.textAlign='center'; ctx.textBaseline='alphabetic';
    ctx.fillStyle=COLOR.curT; ctx.font='700 12px "JetBrains Mono", monospace'; ctx.fillText('maxP', maxX+boxW/2, boxY-2);
    ctx.fillStyle=COLOR.srcT; ctx.font='700 12px "JetBrains Mono", monospace'; ctx.fillText('minP', minX+boxW/2, boxY-2);
    // maxP box
    rr(maxX,boxY,boxW,boxH,7); ctx.fillStyle=COLOR.cur; ctx.fill(); ctx.lineWidth=2.6; ctx.strokeStyle=COLOR.curS; ctx.stroke();
    ctx.fillStyle=COLOR.curT; ctx.font='700 26px "JetBrains Mono", monospace'; ctx.textBaseline='middle'; ctx.fillText(String(s.maxP), maxX+boxW/2, boxY+boxH/2+1);
    // minP box
    rr(minX,boxY,boxW,boxH,7); ctx.fillStyle=COLOR.src; ctx.fill(); ctx.lineWidth=2.6; ctx.strokeStyle=COLOR.srcS; ctx.stroke();
    ctx.fillStyle=COLOR.srcT; ctx.font='700 26px "JetBrains Mono", monospace'; ctx.fillText(String(s.minP), minX+boxW/2, boxY+boxH/2+1);
    // swap badge between boxes
    if(s.swapped){
      ctx.fillStyle=COLOR.coral; ctx.font='700 20px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('⇄', w/2, boxY+boxH/2);
      ctx.fillStyle=COLOR.curT; ctx.font='600 10px "Noto Sans TC", sans-serif';
      ctx.fillText('swap', w/2, boxY-8);
    }

    // BAND 3 · ans + note
    const ty=boxY+boxH+24, done=!!s.done;
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · ans(目前最大乘積)= max(ans, maxP)', PAD, ty);
    const box=ty+12, boxH2=42; rr(PAD,box,w-PAD*2,boxH2,6); ctx.fillStyle=done?COLOR.done:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?COLOR.doneS:COLOR.grid; ctx.stroke();
    ctx.textAlign='left'; ctx.textBaseline='middle';
    ctx.fillStyle=done?COLOR.doneT:COLOR.curT; ctx.font='700 20px "JetBrains Mono", monospace';
    ctx.fillText('ans = '+s.ans, PAD+18, box+boxH2/2);
    ctx.fillStyle=COLOR.text; ctx.font='600 12px "Noto Sans TC", sans-serif'; ctx.textAlign='right';
    ctx.fillText(done ? '負×負會變大 → 必須同時保留 minP,才能在遇負數時翻成最大'
                      : '記 minP 是為了:下一個負數會把「最小」翻成「最大」', w-PAD-16, box+boxH2/2);
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
