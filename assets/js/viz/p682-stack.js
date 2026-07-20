/* ============================================================
   P682 · Baseball Game — 堆疊模擬 · viz
   用堆疊當「紀錄」。逐一處理操作:
     整數 x → push x        D → push 2×top(前一分翻倍)
     +     → push top+第二頂  C → pop(作廢前一分)
   最後把堆疊所有值加總。堆疊天生適合「只跟最近幾筆互動」的規則。
   例 ["5","2","C","D","+"] → 紀錄 [5,10,15] → 總和 30。
     BAND 1  操作序列(紅=目前處理)
     BAND 2  堆疊/紀錄(右=top · 綠=剛 push · 灰=剛 pop)
     BAND 3  本步動作 + 目前總和
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

  const OPS = ['5','2','C','D','+'];
  // opIdx, stack, pushed(idx of new top or -1), popped(value shown fading or null), act, text
  const steps = [
    { opIdx:-1, stack:[], pushed:-1, popped:null, act:'intro', text:'<strong>INITIAL</strong> · 紀錄(堆疊)為空。整數→push;<code>D</code>→push 2×top;<code>+</code>→push top+第二頂;<code>C</code>→pop。' },
    { opIdx:0, stack:[5], pushed:0, popped:null, act:'push', text:'<strong>"5"</strong> · 整數 → <strong>push 5</strong>。紀錄 [5]。' },
    { opIdx:1, stack:[5,2], pushed:1, popped:null, act:'push', text:'<strong>"2"</strong> · 整數 → <strong>push 2</strong>。紀錄 [5,2]。' },
    { opIdx:2, stack:[5], pushed:-1, popped:2, act:'pop', text:'<strong>"C"</strong> · 作廢前一分 → <strong>pop(移除頂端 2)</strong>。紀錄 [5]。' },
    { opIdx:3, stack:[5,10], pushed:1, popped:null, act:'push', text:'<strong>"D"</strong> · 前一分翻倍 → <strong>push 2×5 = 10</strong>。紀錄 [5,10]。' },
    { opIdx:4, stack:[5,10,15], pushed:2, popped:null, act:'push', text:'<strong>"+"</strong> · 前兩分之和 → <strong>push 5+10 = 15</strong>。紀錄 [5,10,15]。' },
    { opIdx:5, stack:[5,10,15], pushed:-1, popped:null, act:'done', text:'<strong>完成</strong> · 加總紀錄 = <code>5+10+15</code> = <strong>30</strong>。堆疊 O(n) 一趟。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function triD(cx,cy,col){ ctx.beginPath(); ctx.moveTo(cx-6,cy-7); ctx.lineTo(cx+6,cy-7); ctx.lineTo(cx,cy+3); ctx.closePath(); ctx.fillStyle=col; ctx.fill(); }

  function sum(a){ return a.reduce((x,y)=>x+y,0); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,PAD=30; const done=s.act==='done';
    ctx.fillStyle=C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);
    // ---- BAND 1 · operations ----
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · operations(紅=目前處理 · 灰=已完成)', PAD, 18);
    const m=OPS.length, ocell=Math.min(58,(w-2*PAD)/m-10), ogp=((w-2*PAD)-m*ocell)/(m-1), oy=42, ochh=38;
    for(let k=0;k<m;k++){
      const x=PAD+k*(ocell+ogp);
      const isCur = k===s.opIdx;
      const doneOp = s.opIdx>=0 && k<s.opIdx || done;
      rr(x,oy,ocell,ochh,7);
      let bg=C.cell,bd=C.cellS,tc=C.text;
      if(doneOp){ bg=C.off; bd=C.offS; tc=C.offT; }
      if(isCur){ bg=C.cur; bd=C.curS; tc=C.curT; }
      ctx.fillStyle=bg; ctx.fill(); ctx.lineWidth=isCur?3:1.6; ctx.strokeStyle=bd; ctx.stroke();
      ctx.fillStyle=tc; ctx.font='700 18px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(OPS[k], x+ocell/2, oy+ochh/2);
    }

    // ---- BAND 2 · stack ----
    const b2=104;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 紀錄堆疊(左=底 · 右=top · 綠=剛 push · 灰=剛 pop)', PAD, b2);
    const sy=b2+22, scell=52, sgp=12; let sx=PAD+4;
    if(s.stack.length===0 && !s.popped){ ctx.fillStyle=C.offT; ctx.font='600 13px "Noto Sans TC", sans-serif'; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText('(空)', sx, sy+22); }
    for(let k=0;k<s.stack.length;k++){
      const isNew = k===s.pushed;
      rr(sx,sy,scell,44,7); ctx.fillStyle=isNew?C.grn:C.src; ctx.fill(); ctx.lineWidth=isNew?3:1.7; ctx.strokeStyle=isNew?C.grnS:C.srcS; ctx.stroke();
      ctx.fillStyle=isNew?C.grnT:C.srcT; ctx.font='700 19px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(s.stack[k]), sx+scell/2, sy+22);
      if(k===s.stack.length-1){ triD(sx+scell/2, sy-3, C.srcT); ctx.fillStyle=C.srcT; ctx.font='700 9px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='bottom'; ctx.fillText('top', sx+scell/2, sy-9); }
      sx+=scell+sgp;
    }
    // popped element fading to the right
    if(s.popped!==null){
      rr(sx,sy,scell,44,7); ctx.fillStyle=C.off; ctx.fill(); ctx.lineWidth=1.7; ctx.strokeStyle=C.offS; ctx.setLineDash([4,3]); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=C.offT; ctx.font='700 19px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(String(s.popped), sx+scell/2, sy+22);
      ctx.fillStyle=C.curT; ctx.font='700 9px "JetBrains Mono", monospace'; ctx.textBaseline='top'; ctx.fillText('✗ pop', sx+scell/2, sy+48);
    }
    // running sum top-right
    ctx.textAlign='right'; ctx.textBaseline='alphabetic'; ctx.font='600 11px "JetBrains Mono", monospace'; ctx.fillStyle=done?C.grnT:C.text;
    ctx.fillText('紀錄總和 = '+sum(s.stack), w-PAD, 18);

    // ---- BAND 3 ----
    const by=192;
    ctx.fillStyle=C.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 整數 push · D push 2×top · + push top+2nd · C pop', PAD, by);
    rr(PAD,by+10,w-PAD*2,44,6); ctx.fillStyle=done?C.grn:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?C.grnS:C.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='600 12.5px "Noto Sans TC", sans-serif';
    let msg,col=C.text;
    if(s.act==='intro'){ msg='規則只跟「最近 1~2 筆」互動 → 堆疊(後進先出)天生適合'; }
    else if(done){ msg='完成 · 加總堆疊 = 30 · 一趟 O(n) 時間 / O(n) 空間'; col=C.grnT; }
    else if(s.act==='pop'){ msg='C:pop 頂端(作廢前一分)—— 堆疊尾端就是「前一分」'; col=C.curT; }
    else { msg='push 新分數到 top —— 之後的 D/+ 都看這個最近的 top'; col=C.grnT; }
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
