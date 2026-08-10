/* ============================================================
   P155 · Min Stack — 每格帶著「當下最小值」· viz
   每個元素進堆疊時,順手記下「到目前為止的最小」min = min(val, 舊 top.min)。
   於是 getMin() 只要讀 top.second,O(1)。pop 掉 top,下一個 top 仍握著它那時的 min。
   例 push 5,2,7,1 → getMin=1 → pop → getMin=2。
     BAND 1  堆疊(每格上=val · 下=min · 右=top)
     BAND 2  getMin() = top.min
     BAND 3  本步動作
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

  // each cell = {v, m}. rightmost = top. popped: cell fading out.
  const steps = [
    { stack:[], popped:null, act:'intro', text:'<strong>INITIAL</strong> · 每格存 <code>(val, min)</code>:進堆疊時記下「到此為止的最小」。<code>getMin()</code> 只讀 <code>top.min</code>,O(1)。' },
    { stack:[{v:5,m:5}], popped:null, act:'push', text:'<strong>push(5)</strong> · 堆疊空 → min = 5。存 <code>(5, 5)</code>。' },
    { stack:[{v:5,m:5},{v:2,m:2}], popped:null, act:'pushmin', text:'<strong>push(2)</strong> · min = min(2, 舊 min 5) = <strong>2</strong>。存 <code>(2, 2)</code> → 新最小。' },
    { stack:[{v:5,m:5},{v:2,m:2},{v:7,m:2}], popped:null, act:'push', text:'<strong>push(7)</strong> · min = min(7, 舊 min 2) = <strong>2</strong>。存 <code>(7, 2)</code> —— 7 比較大,沿用舊 min。' },
    { stack:[{v:5,m:5},{v:2,m:2},{v:7,m:2},{v:1,m:1}], popped:null, act:'pushmin', text:'<strong>push(1)</strong> · min = min(1, 舊 min 2) = <strong>1</strong>。存 <code>(1, 1)</code> → 新最小。' },
    { stack:[{v:5,m:5},{v:2,m:2},{v:7,m:2},{v:1,m:1}], popped:null, act:'getmin', min:1, text:'<strong>getMin()</strong> · 直接讀 <code>top.min = 1</code>。不用掃整個堆疊 → <strong>O(1)</strong>。' },
    { stack:[{v:5,m:5},{v:2,m:2},{v:7,m:2}], popped:{v:1,m:1}, act:'pop', text:'<strong>pop()</strong> · 移除 top <code>(1,1)</code>。新 top = <code>(7, 2)</code> —— 它<strong>仍握著自己那時的 min = 2</strong>。' },
    { stack:[{v:5,m:5},{v:2,m:2},{v:7,m:2}], popped:null, act:'getmin', min:2, done:true, text:'<strong>getMin() = 2</strong> · min 自動「退回」正確值,因為每格都帶著它入堆疊當下的最小。全程 O(1)。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function triD(cx,cy,col){ ctx.beginPath(); ctx.moveTo(cx-6,cy-7); ctx.lineTo(cx+6,cy-7); ctx.lineTo(cx,cy+3); ctx.closePath(); ctx.fillStyle=col; ctx.fill(); }

  function drawCell(cx, cy, cell, isTop, isNew, faded){
    const cw=58, ch=64;
    rr(cx,cy,cw,ch,8);
    ctx.fillStyle = faded ? C.off : (isNew ? C.grn : (isTop ? '#eef4fb' : C.src));
    ctx.fill();
    ctx.lineWidth = (isTop||isNew) ? 3 : 1.7;
    ctx.strokeStyle = faded ? C.offS : (isNew ? C.grnS : (isTop ? C.srcS : C.srcS));
    if(faded){ ctx.setLineDash([4,3]); } ctx.stroke(); ctx.setLineDash([]);
    // val (top)
    ctx.fillStyle = faded ? C.offT : (isNew ? C.grnT : C.srcT);
    ctx.font='700 21px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(String(cell.v), cx+cw/2, cy+21);
    // divider
    ctx.strokeStyle = faded ? C.offS : '#c3d4ea'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(cx+6,cy+40); ctx.lineTo(cx+cw-6,cy+40); ctx.stroke();
    // min (bottom)
    ctx.fillStyle = faded ? C.offT : C.grnT;
    ctx.font='700 12px "JetBrains Mono", monospace';
    ctx.fillText('m'+cell.m, cx+cw/2, cy+52);
  }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,PAD=30; const done=s.done;
    ctx.fillStyle=C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);
    // ── BAND 1 ──
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 堆疊(每格 上=val · 下=min · 右=top · 綠=剛 push/新最小)', PAD, 20);
    const cy=44, cw=58, cg=14; let cx=PAD+6;
    if(s.stack.length===0 && !s.popped){ ctx.fillStyle=C.offT; ctx.font='600 13px "Noto Sans TC", sans-serif'; ctx.textBaseline='middle'; ctx.fillText('(空)', cx, cy+32); }
    for(let k=0;k<s.stack.length;k++){
      const isTop = k===s.stack.length-1 && !s.popped;
      const isNew = (s.act==='push'||s.act==='pushmin') && k===s.stack.length-1;
      drawCell(cx, cy, s.stack[k], isTop, isNew, false);
      if(isTop){ triD(cx+cw/2, cy-3, C.srcS); ctx.fillStyle=C.srcT; ctx.font='700 9px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='bottom'; ctx.fillText('top', cx+cw/2, cy-9); }
      cx+=cw+cg;
    }
    if(s.popped){
      drawCell(cx, cy, s.popped, false, false, true);
      ctx.fillStyle=C.curT; ctx.font='700 9px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='top'; ctx.fillText('✗ pop', cx+cw/2, cy+70);
    }

    // ── BAND 2 · getMin readout ──
    const b2=140;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · getMin() = top.min', PAD, b2);
    rr(PAD,b2+10,w-PAD*2,40,6);
    const hot = s.act==='getmin';
    ctx.fillStyle=hot?C.grn:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=hot?C.grnS:C.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='700 15px "JetBrains Mono", monospace'; ctx.fillStyle=hot?C.grnT:C.text;
    if(hot) ctx.fillText('getMin() → top.min = '+s.min+'   (O(1),不用掃)', w/2, b2+30);
    else if(s.stack.length) ctx.fillText('top.min = '+s.stack[s.stack.length-1].m, w/2, b2+30);
    else ctx.fillText('—', w/2, b2+30);

    // ── BAND 3 ──
    const by=204;
    ctx.fillStyle=C.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · push 時 min = min(val, 舊 top.min);getMin 讀 top.min', PAD, by);
    rr(PAD,by+10,w-PAD*2,44,6); ctx.fillStyle=done?C.grn:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?C.grnS:C.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='600 12.5px "Noto Sans TC", sans-serif';
    let msg,col=C.text;
    if(s.act==='intro'){ msg='每格自帶「入堆疊當下的最小」→ 之後 getMin 直接讀,不必掃'; }
    else if(done){ msg='min 隨 pop 自動退回正確值 —— 因為它記在每一格上'; col=C.grnT; }
    else if(s.act==='pushmin'){ msg='新值比舊 min 小 → 這格的 min = 新值(最小被刷新)'; col=C.grnT; }
    else if(s.act==='push'){ msg='新值較大 → 沿用舊 min,一起存進這格'; col=C.srcT; }
    else if(s.act==='getmin'){ msg='讀 top.second 即答案,O(1)'; col=C.grnT; }
    else if(s.act==='pop'){ msg='移除 top;新 top 仍握著它那時的 min → getMin 自動正確'; col=C.curT; }
    ctx.fillStyle=col; ctx.fillText(msg, w/2, by+32);
  }

  function update(){ if(stepEl) stepEl.textContent=String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0'); if(labelEl) labelEl.innerHTML=steps[step].text; draw(); }
  function next(){ if(step<steps.length-1){step++;update();}else stop(); }
  function prev(){ if(step>0){step--;update();} }
  function reset(){ stop(); step=0; update(); }
  function play(){ if(timer){stop();return;} bPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){stop();return;} next(); },1700); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} if(bPlay) bPlay.textContent='Play'; }
  bPrev&&bPrev.addEventListener('click',prev); bNext&&bNext.addEventListener('click',next); bPlay&&bPlay.addEventListener('click',play); bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();}); if(window.ResizeObserver){ new ResizeObserver(()=>{fit();draw();}).observe(canvas); }
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw); fit(); update();
})();
