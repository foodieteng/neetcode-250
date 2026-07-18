/* ============================================================
   P1049 · Last Stone Weight II — 化成 0/1 背包子集和 · viz
   砸石頭:每次挑兩顆相減 = 給每顆石頭一個 +/- 號,最後剩 |帶號總和|。
   要最小 → 把石頭分兩堆、讓兩堆和盡量接近 → 找「≤ total/2 的最大子集和 best」。
   答案 = total − 2·best(兩堆差)。這正是 416 分割等和子集的 0/1 背包。
   例 stones=[2,3,4],total=9,target=4 → best=4(子集 {4})→ 9−8 = 1
     BAND 1  dp[s]:子集和 s 是否可達(綠=可達 · 紅=本步新增)
     BAND 2  答案 = total − 2·best
     BAND 3  說明:砸石頭 = 分兩堆 = 子集和
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

  const STONES = [2, 3, 4];
  const TOTAL = 9, TARGET = 4;      // total/2 下取整
  const T = true, F = false;
  const steps = [
    { stone:null, dp:[T,F,F,F,F], neu:[], best:0,
      text:'<strong>INITIAL</strong> · 砸石頭 = 給每顆 <strong>+/−</strong> 號 → 分兩堆,最小化差距。等於找「≤ <code>total/2 = 4</code> 的最大子集和」。<code>total=9</code>。' },
    { stone:2, dp:[T,F,T,F,F], neu:[2], best:2,
      text:'放入 <strong>2</strong>:子集和 <code>0→2</code> 可達。目前最大可達和 best = 2。' },
    { stone:3, dp:[T,F,T,T,F], neu:[3], best:3,
      text:'放入 <strong>3</strong>:<code>0→3</code> 可達(2+3=5&gt;4 超過 target,略過)。best = 3。' },
    { stone:4, dp:[T,F,T,T,T], neu:[4], best:4, done:true,
      text:'放入 <strong>4</strong>:<code>0→4</code> 可達,best = <strong>4</strong>。答案 = <code>total − 2·best = 9 − 8 = 1</code>。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,h=canvas.clientHeight,PAD=26;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,h);
    const neuSet=new Set(s.neu);

    // BAND 1 · header + stone chip
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · dp[s]:子集和 s 可達嗎?(綠=可達 · 紅=本步新增 · 目標 ≤ 4)', PAD, 24);
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(s.stone!==null){
      const chx=w/2, chy=52;
      ctx.fillStyle=COLOR.text; ctx.font='600 12.5px "Noto Sans TC", sans-serif'; ctx.textAlign='right';
      ctx.fillText('本步放入石頭  ', chx-14, chy);
      rr(chx-8,chy-15,42,30,6); ctx.fillStyle=COLOR.cur; ctx.fill(); ctx.lineWidth=2.4; ctx.strokeStyle=COLOR.curS; ctx.stroke();
      ctx.fillStyle=COLOR.curT; ctx.font='700 17px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.fillText(String(s.stone), chx+13, chy+1);
    } else {
      ctx.fillStyle=COLOR.dim; ctx.font='600 12.5px "Noto Sans TC", sans-serif'; ctx.fillText('stones = [2, 3, 4] · total = 9 · target = 4', w/2, 52);
    }

    // dp cells 0..target
    const NC=TARGET+1; const cw=Math.min(76,(w-2*PAD)/(NC+1)); const gx=(w-NC*cw)/2, gy=98, chh=48;
    for(let sm=0;sm<NC;sm++){ const x=gx+sm*cw; const reach=s.dp[sm]; const isNew=neuSet.has(sm); const isBest=(s.done&&sm===s.best);
      ctx.fillStyle=COLOR.dim; ctx.font='700 11px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('和 '+sm, x+cw/2, gy-14);
      rr(x+4,gy,cw-8,chh,5);
      ctx.fillStyle=isNew?COLOR.cur:(reach?COLOR.done:COLOR.cell); ctx.fill();
      ctx.lineWidth=isBest?3.4:(isNew?3.2:1.8); ctx.strokeStyle=isBest?COLOR.curS:(isNew?COLOR.curS:(reach?COLOR.doneS:COLOR.cellS)); ctx.stroke();
      ctx.fillStyle=isNew?COLOR.curT:(reach?COLOR.doneT:COLOR.grid); ctx.font='700 22px "JetBrains Mono", monospace';
      ctx.fillText(reach?'✓':'·', x+cw/2, gy+chh/2+1);
      if(isBest){ ctx.fillStyle=COLOR.curT; ctx.font='700 10px "Noto Sans TC", sans-serif'; ctx.fillText('best', x+cw/2, gy+chh+13); }
    }

    // BAND 2 · answer
    const by=182;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 答案 = total − 2·best(兩堆差)', PAD, by);
    const eqBox=by+12, ebH=40; rr(PAD,eqBox,w-PAD*2,ebH,6); ctx.fillStyle=(!!s.done)?COLOR.done:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=(!!s.done)?COLOR.doneS:COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(s.done){ ctx.fillStyle=COLOR.doneT; ctx.font='700 15px "JetBrains Mono", monospace'; ctx.fillText('answer = 9 − 2×4 = 1', w/2, eqBox+ebH/2); }
    else { ctx.fillStyle=COLOR.text; ctx.font='600 12.5px "Noto Sans TC", sans-serif'; ctx.fillText('best = 目前能湊出、且 ≤ target 的最大子集和(= 較小那堆)', w/2, eqBox+ebH/2); }

    // BAND 3 · note
    const ty=eqBox+ebH+22, done=!!s.done;
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 為什麼是子集和(= 416)', PAD, ty);
    rr(PAD,ty+12,w-PAD*2,40,6); ctx.fillStyle=done?COLOR.done:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?COLOR.doneS:COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(done){ ctx.fillStyle=COLOR.doneT; ctx.font='700 12.5px "JetBrains Mono", monospace'; ctx.fillText('分兩堆最接近 total/2 → 0/1 背包子集和(和 416 同一招,內層由大到小)', w/2, ty+32); }
    else { ctx.fillStyle=COLOR.text; ctx.font='600 12.5px "Noto Sans TC", sans-serif'; ctx.fillText('每顆 +/− = 分到兩堆之一;差距 = |total − 2·一堆| → 讓一堆盡量接近 total/2', w/2, ty+32); }
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
