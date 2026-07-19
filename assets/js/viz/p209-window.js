/* ============================================================
   P209 · Minimum Size Subarray Sum — 可變長視窗(求最短) · viz
   正整數陣列,求「和 ≥ target」的最短連續子陣列長度。
   右指針擴張累加 total;一旦 total ≥ target(已達標)就「拚命縮左」——
   每次仍達標就更新最短 minL,直到 total < target 才停。這是「求最短」的收縮:
   達標就縮(和「求最長」違規才縮正好相反)。
   例 nums=[1,4,4], target=8 → 最短 2([4,4] 和 8)。
     BAND 1  nums(綠=視窗[l,r] · 紅=r · 灰=已移出)
     BAND 2  視窗和 total vs target;minL
     BAND 3  total<target 擴張;total≥target 縮左(求最短)
   ============================================================ */
(function () {
  const canvas = document.getElementById('viz-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('viz-step'), labelEl = document.getElementById('viz-label');
  const bPrev = document.getElementById('viz-prev'), bNext = document.getElementById('viz-next'),
        bPlay = document.getElementById('viz-play'), bReset = document.getElementById('viz-reset');
  const C = { paper:'#ffffff', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf', cell:'#fafaf6', cellS:'#cfcfcf',
    src:'#dbe8f6', srcS:'#4478c0', srcT:'#2f5f9e', grn:'#d9e8c7', grnS:'#5fa866', grnT:'#3f7a3a',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424', off:'#eceae2', offS:'#c9c6ba', offT:'#8a8672', coral:'#cf3535' };

  const A = [1,4,4], T = 8;
  // l, r, total, minL(0=inf), act, text
  const steps = [
    { l:0, r:-1, total:0, minL:0, act:'intro', text:'<strong>INITIAL</strong> · <code>nums=[1,4,4]</code>, target=8。右指針擴張累加;一旦 <code>sum ≥ target</code> 就<strong>拚命縮左求最短</strong>,每次達標更新 minL。' },
    { l:0, r:0, total:1, minL:0, act:'expand', text:'<strong>r=0</strong> · <code>total=1 &lt; 8</code> → 不夠,繼續擴張。' },
    { l:0, r:1, total:5, minL:0, act:'expand', text:'<strong>r=1</strong> · <code>total=1+4=5 &lt; 8</code> → 繼續擴張。' },
    { l:0, r:2, total:9, minL:3, act:'hit', text:'<strong>r=2</strong> · <code>total=9 ≥ 8</code> → <strong>達標!</strong> 記 <code>minL=3</code>([0,2] 長 3),開始縮左找更短。' },
    { l:1, r:2, total:8, minL:2, act:'shrink', text:'<strong>縮左</strong> · 移出 <code>nums[0]=1</code> → <code>total=8 ≥ 8</code> <strong>仍達標</strong> → 更新 <code>minL=2</code>([1,2] 長 2,更短!)。' },
    { l:2, r:2, total:4, minL:2, act:'done', text:'<strong>再縮左</strong> · 移出 <code>nums[1]=4</code> → <code>total=4 &lt; 8</code> 不達標,停。掃完 → <strong>回傳 minL=2</strong>([4,4] 和 8)。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function triD(cx,cy,col){ ctx.beginPath(); ctx.moveTo(cx-6,cy-7); ctx.lineTo(cx+6,cy-7); ctx.lineTo(cx,cy+3); ctx.closePath(); ctx.fillStyle=col; ctx.fill(); }
  function triU(cx,cy,col){ ctx.beginPath(); ctx.moveTo(cx-6,cy+7); ctx.lineTo(cx+6,cy+7); ctx.lineTo(cx,cy-3); ctx.closePath(); ctx.fillStyle=col; ctx.fill(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,PAD=30;
    ctx.fillStyle=C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);
    const met = s.total>=T;      // 達標
    const done = s.act==='done';
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · nums(綠=視窗[l,r] · 紅=r · 灰=已移出)', PAD, 18);
    const n=A.length, cell=Math.min(84,(w-2*PAD)/n-14), gp=((w-2*PAD)-n*cell)/(n-1), gy=52, chh=48;
    for(let k=0;k<n;k++){
      const x=PAD+k*(cell+gp);
      const inWin = s.r>=0 && k>=s.l && k<=s.r;
      const isR = k===s.r;
      rr(x,gy,cell,chh,8);
      let bg=C.cell,bd=C.cellS,tc=C.text;
      if(s.r<0 || k<s.l || k>s.r){ bg=C.off; bd=C.offS; tc=C.offT; }
      if(inWin){ bg=C.grn; bd=C.grnS; tc=C.grnT; }
      if(isR){ bg=C.cur; bd=C.curS; tc=C.curT; }
      ctx.fillStyle=bg; ctx.fill(); ctx.lineWidth=isR?3:1.7; ctx.strokeStyle=bd; ctx.stroke();
      ctx.fillStyle=tc; ctx.font='700 24px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(A[k]), x+cell/2, gy+chh/2);
      ctx.fillStyle=C.dim; ctx.font='600 10px "JetBrains Mono", monospace'; ctx.textBaseline='top';
      ctx.fillText(String(k), x+cell/2, gy+chh+6);
    }
    if(s.r>=0){ const rx=PAD+s.r*(cell+gp)+cell/2; triD(rx, gy-4, C.curS); ctx.fillStyle=C.curT; ctx.font='700 10px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='bottom'; ctx.fillText('r', rx, gy-10);
      const lx=PAD+s.l*(cell+gp)+cell/2; triU(lx, gy+chh+16, C.srcS); ctx.fillStyle=C.srcT; ctx.textBaseline='top'; ctx.fillText('l', lx, gy+chh+22); }

    // ---- BAND 2 ----
    const b2=138;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 視窗和 total 與 target 比;minL 取最小', PAD, b2);
    rr(PAD,b2+10,w-PAD*2,40,6); ctx.fillStyle=met?C.grn:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=met?C.grnS:C.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='700 15px "JetBrains Mono", monospace'; ctx.fillStyle=C.text;
    const minTxt = s.minL===0 ? '∞' : String(s.minL);
    if(s.r<0){ ctx.fillText('total = 0 · minL = ∞ · target = '+T, w/2, b2+30); }
    else { ctx.fillText('total = '+s.total+'  '+(met?'≥':'<')+'  target='+T+(met?'  ✓達標':'  未達標')+'      minL = '+minTxt, w/2, b2+30); }

    // ---- BAND 3 ----
    const by=200;
    ctx.fillStyle=C.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · total<target 擴張;total≥target 縮左(達標就縮=求最短)', PAD, by);
    rr(PAD,by+10,w-PAD*2,44,6); ctx.fillStyle=done?C.grn:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?C.grnS:C.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='600 12.5px "Noto Sans TC", sans-serif';
    let msg,col=C.text;
    if(s.act==='intro'){ msg='求最短 → 達標(sum≥target)就縮;和求最長「違規才縮」正好相反'; }
    else if(done){ msg='完成 · 最短達標子陣列 [4,4] 長 2 · O(n)'; col=C.grnT; }
    else if(s.act==='shrink'){ msg='移出左端後仍達標 → 視窗更短且合格 → 更新 minL'; col=C.grnT; }
    else if(s.act==='hit'){ msg='首次達標 → 記 minL,接著縮左看能不能更短'; col=C.grnT; }
    else { msg='還沒到 target → r 擴張、繼續累加'; col=C.srcT; }
    ctx.fillStyle=col; ctx.fillText(msg, w/2, by+32);
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
