/* ============================================================
   P901 · Online Stock Span — 單調堆疊存 (價格, span) · viz
   span = 從今天往回、連續 ≤ 今天價 的天數。堆疊存 (price, span),價格由底到頂遞減。
   新價來時 span=1;只要頂端 price ≤ 今天,就把它那段 span「吃掉」並 pop —— 連環累加。
   例 next(100,80,70,75,85) → span 1,1,1,2,4。
     BAND 1  價格串流(綠 badge = 算出的 span · 紅=今天)
     BAND 2  堆疊(每格 上=price 下=span · 右=top · 價遞減)
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

  const P = [100,80,70,75,85];
  // stack: [{p,s}]. done up to index (spans computed). cur: today idx. eaten: [{p,s}] absorbed this step. cmp string.
  const steps = [
    { cur:-1, stack:[], spans:[], eaten:[], cmp:'', act:'intro', text:'<strong>INITIAL</strong> · span = 從今天往回連續 ≤ 今天價 的天數。堆疊存 <code>(price, span)</code>,價格遞減。頂端 ≤ 今天就吃掉它的 span。' },
    { cur:0, stack:[{p:100,s:1}], spans:[1], eaten:[], cmp:'', act:'push', text:'<strong>next(100)</strong> · 堆疊空 → span=1。push <code>(100,1)</code>。' },
    { cur:1, stack:[{p:100,s:1},{p:80,s:1}], spans:[1,1], eaten:[], cmp:'top 100 &gt; 80 → 不吃', act:'push', text:'<strong>next(80)</strong> · 頂端 100 &gt; 80 → 吃不動,span=1。push <code>(80,1)</code>。' },
    { cur:2, stack:[{p:100,s:1},{p:80,s:1},{p:70,s:1}], spans:[1,1,1], eaten:[], cmp:'top 80 &gt; 70 → 不吃', act:'push', text:'<strong>next(70)</strong> · 頂端 80 &gt; 70 → span=1。push <code>(70,1)</code>。堆疊價 [100,80,70] 遞減。' },
    { cur:3, stack:[{p:100,s:1},{p:80,s:1},{p:75,s:2}], spans:[1,1,1,2], eaten:[{p:70,s:1}], cmp:'70 ≤ 75 吃 1;80 &gt; 75 停', act:'eat', text:'<strong>next(75)</strong> · 70 ≤ 75 → 吃掉它的 span 1(span=1+1=2),pop;80 &gt; 75 停。push <code>(75,2)</code>。' },
    { cur:4, stack:[{p:100,s:1},{p:85,s:4}], spans:[1,1,1,2,4], eaten:[{p:75,s:2},{p:80,s:1}], cmp:'75≤85 吃2;80≤85 吃1;100&gt;85 停', act:'eat', text:'<strong>next(85)</strong> · 連環:75 吃 2、80 吃 1 → span=1+2+1=<strong>4</strong>;100 &gt; 85 停。push <code>(85,4)</code>。' },
    { cur:5, stack:[{p:100,s:1},{p:85,s:4}], spans:[1,1,1,2,4], eaten:[], cmp:'', act:'done', text:'<strong>完成</strong> · span 序列 <code>[1,1,1,2,4]</code>。每個價格最多進出堆疊一次 → 攤還 O(1)/次。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function triD(cx,cy,col){ ctx.beginPath(); ctx.moveTo(cx-6,cy-7); ctx.lineTo(cx+6,cy-7); ctx.lineTo(cx,cy+3); ctx.closePath(); ctx.fillStyle=col; ctx.fill(); }

  function drawPair(cx, cy, cw, price, span, opt){
    const ch=58;
    rr(cx,cy,cw,ch,8); ctx.fillStyle=opt.bg; ctx.fill();
    ctx.lineWidth=opt.strong?3:1.7; ctx.strokeStyle=opt.bd;
    if(opt.ghost) ctx.setLineDash([4,3]); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle=opt.tc; ctx.font='700 19px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(String(price), cx+cw/2, cy+20);
    ctx.strokeStyle=opt.ghost?C.offS:'#c3d4ea'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(cx+6,cy+38); ctx.lineTo(cx+cw-6,cy+38); ctx.stroke();
    ctx.fillStyle=opt.ghost?C.offT:C.grnT; ctx.font='700 12px "JetBrains Mono", monospace';
    ctx.fillText('s'+span, cx+cw/2, cy+50);
  }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,PAD=30; const done=s.act==='done';
    ctx.fillStyle=C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);
    // ── BAND 1 · price stream ──
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 價格串流(紅=今天 · 綠 badge = 算出的 span)', PAD, 18);
    const m=P.length, cw=Math.min(74,(w-2*PAD)/m-14), gp=((w-2*PAD)-m*cw)/(m-1), gy=48, chh=44;
    for(let k=0;k<m;k++){
      const x=PAD+k*(cw+gp);
      const isCur=k===s.cur, has=k<s.spans.length;
      let bg=C.cell,bd=C.cellS,tc=C.text;
      if(has){ bg=C.src; bd=C.srcS; tc=C.srcT; }
      if(isCur){ bg=C.cur; bd=C.curS; tc=C.curT; }
      rr(x,gy,cw,chh,8); ctx.fillStyle=bg; ctx.fill(); ctx.lineWidth=isCur?3:1.7; ctx.strokeStyle=bd; ctx.stroke();
      ctx.fillStyle=tc; ctx.font='700 19px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(P[k]), x+cw/2, gy+chh/2);
      ctx.fillStyle=C.dim; ctx.font='600 10px "JetBrains Mono", monospace'; ctx.textBaseline='top'; ctx.fillText('d'+k, x+cw/2, gy+chh+6);
      if(has){ ctx.fillStyle=C.grnT; ctx.font='700 12px "JetBrains Mono", monospace'; ctx.textBaseline='bottom'; ctx.fillText('span '+s.spans[k], x+cw/2, gy-6); }
    }

    // ── BAND 2 · stack of (price, span) ──
    const b2=138;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 堆疊(上=price 下=span · 右=top · 虛線✗=剛被吃掉)', PAD, b2);
    const sy=b2+22, scw=62, sgp=14; let sx=PAD+4;
    if(s.stack.length===0 && !s.eaten.length){ ctx.fillStyle=C.offT; ctx.font='600 13px "Noto Sans TC", sans-serif'; ctx.textBaseline='middle'; ctx.fillText('(空)', sx, sy+30); }
    for(let k=0;k<s.stack.length;k++){
      const c=s.stack[k]; const isTop=k===s.stack.length-1;
      const justPush = isTop && (s.act==='push'||s.act==='eat');
      drawPair(sx, sy, scw, c.p, c.s, {bg:justPush?C.grn:(isTop?'#eef4fb':C.src), bd:justPush?C.grnS:C.srcS, tc:justPush?C.grnT:C.srcT, strong:isTop, ghost:false});
      if(isTop){ triD(sx+scw/2, sy-3, C.srcT); ctx.fillStyle=C.srcT; ctx.font='700 9px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='bottom'; ctx.fillText('top', sx+scw/2, sy-9); }
      sx+=scw+sgp;
    }
    for(const g of s.eaten){
      drawPair(sx, sy, scw, g.p, g.s, {bg:C.off,bd:C.offS,tc:C.offT,strong:false,ghost:true});
      ctx.fillStyle=C.curT; ctx.font='700 9px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='top'; ctx.fillText('✗ 吃', sx+scw/2, sy+66);
      sx+=scw+sgp;
    }
    if(s.cmp){ ctx.textAlign='right'; ctx.textBaseline='alphabetic'; ctx.font='700 12.5px "JetBrains Mono", monospace'; ctx.fillStyle=s.act==='eat'?C.grnT:C.text; ctx.fillText(s.cmp.replace(/<[^>]+>/g,''), w-PAD, b2); }

    // ── BAND 3 ──
    const by=248;
    ctx.fillStyle=C.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · span=1;頂端 price ≤ 今天 → span += 那格 span 並 pop;最後 push', PAD, by);
    rr(PAD,by+10,w-PAD*2,44,6); ctx.fillStyle=done?C.grn:(s.act==='eat'?C.grn:'#fafaf6'); ctx.fill(); ctx.lineWidth=1.6;
    ctx.strokeStyle=done?C.grnS:(s.act==='eat'?C.grnS:C.grid); ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='600 12.5px "Noto Sans TC", sans-serif';
    let msg,col=C.text;
    if(s.act==='intro'){ msg='被吃掉的那些天,其 span 已含在自己那格 → 累加即可,不必重數'; }
    else if(done){ msg='每個價格一生只進出堆疊一次 → 攤還 O(1);n 次呼叫 O(n)'; col=C.grnT; }
    else if(s.act==='eat'){ msg='頂端 ≤ 今天 → 把它整段 span 併進來,連環吃到頂端更大為止'; col=C.grnT; }
    else { msg='頂端比今天大 → 吃不動,span=1,直接 push'; col=C.srcT; }
    ctx.fillStyle=col; ctx.fillText(msg, w/2, by+32);
  }

  function update(){ if(stepEl) stepEl.textContent=String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0'); if(labelEl) labelEl.innerHTML=steps[step].text; draw(); }
  function next(){ if(step<steps.length-1){step++;update();}else stop(); }
  function prev(){ if(step>0){step--;update();} }
  function reset(){ stop(); step=0; update(); }
  function play(){ if(timer){stop();return;} bPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){stop();return;} next(); },1750); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} if(bPlay) bPlay.textContent='Play'; }
  bPrev&&bPrev.addEventListener('click',prev); bNext&&bNext.addEventListener('click',next); bPlay&&bPlay.addEventListener('click',play); bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();}); if(window.ResizeObserver){ new ResizeObserver(()=>{fit();draw();}).observe(canvas); }
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw); fit(); update();
})();
