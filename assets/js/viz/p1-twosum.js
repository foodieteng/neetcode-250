/* ============================================================
   P1 · Two Sum — 補數 + 雜湊表(值→索引)· viz
   對每個 nums[i],要找的另一半是 comple = target − nums[i]。
   一邊掃、一邊把「看過的值→索引」存進 map。掃到 i 時先問:
   「comple 之前出現過嗎?」有 → 回 {map[comple], i};沒有才把自己存進去。
   nums=[3,2,4], target=6:掃到 4 時 comple=2 已在 map(索引1)→ 回 {1,2}。
     BAND 1  nums(紅=正在看 · 綠=已入 map · 藍=配對成功的補數)
     BAND 2  seen 表(值 → 索引)
     BAND 3  comple = target − nums[i],在表裡嗎?
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

  const A = [3,2,4], TARGET = 6;
  const steps = [
    { i:-1, seen:[], comple:null, hitIdx:-1,
      text:'<strong>INITIAL</strong> · <code>nums=[3,2,4]</code>、<code>target=6</code>。準備一個 <code>map</code> 存「<strong>看過的值 → 索引</strong>」。對每個 <code>nums[i]</code>,要找的另一半是 <code>comple = 6 − nums[i]</code>。' },
    { i:0, seen:[], comple:3, hitIdx:-1, store:{v:3,i:0},
      text:'<strong>i=0 · nums[0]=3</strong> · <code>comple = 6 − 3 = 3</code>。map 是空的 → 沒找到。把 <code>3 → 0</code> 存進 map。' },
    { i:1, seen:[[3,0]], comple:4, hitIdx:-1, store:{v:2,i:1},
      text:'<strong>i=1 · nums[1]=2</strong> · <code>comple = 6 − 2 = 4</code>。<code>4</code> 不在 map 裡 → 存 <code>2 → 1</code>。map = <code>{3:0, 2:1}</code>。' },
    { i:2, seen:[[3,0],[2,1]], comple:2, hitIdx:1, done:true,
      text:'<strong>i=2 · nums[2]=4</strong> · <code>comple = 6 − 4 = 2</code>。<strong>2 已經在 map!(索引 1)</strong> → 回傳 <code>{map[2], 2} = {1, 2}</code>。<code>nums[1]+nums[2]=2+4=6</code> ✓。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,h=canvas.clientHeight,PAD=26;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,h);
    const done=!!s.done, N=A.length;

    // ── BAND 1 · array ──
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · nums(紅=正在看 · 綠=已入 map · 藍=配對的補數)  target = '+TARGET, PAD, 24);

    const cell=Math.min(74,(w-2*PAD)/(N+1)), gx=(w-N*cell)/2, gy=54, chh=46;
    for(let k=0;k<N;k++){
      const x=gx+k*cell;
      const isCur=(k===s.i);
      const inMap=(k<s.i);
      const isHit=(done && k===s.hitIdx);
      ctx.fillStyle=COLOR.dim; ctx.font='700 10px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('['+k+']', x+cell/2, gy-10);
      rr(x+4,gy,cell-8,chh,7);
      let bg=COLOR.cell,bd=COLOR.cellS,tc=COLOR.text;
      if(inMap){ bg=COLOR.done; bd=COLOR.doneS; tc=COLOR.doneT; }
      if(isHit){ bg=COLOR.src; bd=COLOR.srcS; tc=COLOR.srcT; }
      if(isCur){ bg=COLOR.cur; bd=COLOR.curS; tc=COLOR.curT; }
      ctx.fillStyle=bg; ctx.fill(); ctx.lineWidth=(isCur||isHit)?3:1.7; ctx.strokeStyle=bd; ctx.stroke();
      ctx.fillStyle=tc; ctx.font='700 19px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(A[k]), x+cell/2, gy+chh/2);
      if(done && (k===s.hitIdx || k===s.i)){ ctx.fillStyle=k===s.hitIdx?COLOR.srcT:COLOR.curT; ctx.font='700 10px "Noto Sans TC", sans-serif'; ctx.fillText(k===s.hitIdx?'補數':'本身', x+cell/2, gy+chh+12); }
    }

    // ── BAND 2 · map ──
    const by=142;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · seen(值 → 索引)', PAD, by);
    rr(PAD,by+10,w-PAD*2,50,7); ctx.fillStyle='#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=COLOR.grid; ctx.stroke();
    const entries = s.seen.slice();
    const chipW=64, gap=14, sx=PAD+16, sy=by+20, chipH=30;
    ctx.textAlign='left'; ctx.textBaseline='middle';
    let cx=sx;
    if(entries.length===0 && !s.store){ ctx.fillStyle=COLOR.dim; ctx.font='600 12px "Noto Sans TC", sans-serif'; ctx.fillText('(空)', sx, sy+chipH/2); }
    for(let t=0;t<entries.length;t++){
      const [v,idx]=entries[t]; const isHit=(done && v===s.comple);
      rr(cx,sy,chipW,chipH,6); ctx.fillStyle=isHit?COLOR.src:COLOR.done; ctx.fill(); ctx.lineWidth=isHit?2.6:1.8; ctx.strokeStyle=isHit?COLOR.srcS:COLOR.doneS; ctx.stroke();
      ctx.fillStyle=isHit?COLOR.srcT:COLOR.doneT; ctx.font='700 12.5px "JetBrains Mono", monospace'; ctx.textAlign='center';
      ctx.fillText(v+'→'+idx, cx+chipW/2, sy+chipH/2);
      cx+=chipW+gap;
    }
    if(s.store){
      rr(cx,sy,chipW,chipH,6); ctx.fillStyle=COLOR.cur; ctx.fill(); ctx.lineWidth=2.2; ctx.strokeStyle=COLOR.curS; ctx.stroke();
      ctx.fillStyle=COLOR.curT; ctx.font='700 12.5px "JetBrains Mono", monospace'; ctx.textAlign='center';
      ctx.fillText(s.store.v+'→'+s.store.i, cx+chipW/2, sy+chipH/2);
      ctx.fillStyle=COLOR.curT; ctx.font='600 10px "Noto Sans TC", sans-serif'; ctx.textAlign='center'; ctx.textBaseline='top';
      ctx.fillText('← 本步存入', cx+chipW/2, sy+chipH+2);
    }

    // ── BAND 3 · complement check ──
    const vy=by+90;
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · comple = target − nums[i],在 seen 裡嗎?', PAD, vy);
    rr(PAD,vy+10,w-PAD*2,42,6); ctx.fillStyle=done?COLOR.done:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?COLOR.doneS:COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(s.i<0){ ctx.fillStyle=COLOR.text; ctx.font='600 12.5px "Noto Sans TC", sans-serif'; ctx.fillText('先查補數(看之前的),沒有才把自己存入(留給之後)', w/2, vy+31); }
    else if(done){ ctx.fillStyle=COLOR.doneT; ctx.font='700 13px "JetBrains Mono", monospace'; ctx.fillText('comple=2 在 seen(→1)→ return {1, 2}', w/2, vy+31); }
    else { ctx.fillStyle=COLOR.text; ctx.font='700 12.5px "JetBrains Mono", monospace'; ctx.fillText('comple = '+TARGET+' − '+A[s.i]+' = '+s.comple+' → 不在 seen,存入自己', w/2, vy+31); }
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
