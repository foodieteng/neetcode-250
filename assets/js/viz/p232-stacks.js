/* ============================================================
   P232 · Implement Queue using Stacks — 雙堆疊懶搬移 · viz
   兩個堆疊:in 收 push、out 供 pop/peek。push 直接進 in(O(1))。
   pop/peek 時,若 out 空,就把 in「整個倒進 out」—— 順序反轉一次,
   於是 out 的頂端 = 最早 push 的 = 佇列 front。每個元素一生只被倒一次
   (in→out)→ 攤還 O(1)。
   例 push1,2,3 → in=[1,2,3];pop 時倒成 out=[3,2,1](頂=1)→ 回傳 1。
     BAND 1  in 堆疊(收 push · 右=top)
     BAND 2  out 堆疊(供 pop/peek · 右=top=佇列 front)
     BAND 3  本步:push→in / out 空就倒 / 從 out 取
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

  // inS/outS: index 0 = bottom, last = top(right). popped: value fading from out.
  const steps = [
    { inS:[], outS:[], popped:null, act:'intro', text:'<strong>INITIAL</strong> · 兩堆疊:<code>in</code> 收 push、<code>out</code> 供 pop/peek。push 直接進 in;pop/peek 時 out 空就把 in 倒進 out(反轉一次)。' },
    { inS:[1], outS:[], popped:null, act:'push', text:'<strong>push(1)</strong> · 進 <code>in</code>。in=[1],out=[]。O(1)。' },
    { inS:[1,2], outS:[], popped:null, act:'push', text:'<strong>push(2)</strong> · 進 <code>in</code>。in=[1,2](top=2),out=[]。' },
    { inS:[1,2,3], outS:[], popped:null, act:'push', text:'<strong>push(3)</strong> · 進 <code>in</code>。in=[1,2,3](top=3),out=[]。' },
    { inS:[], outS:[3,2,1], popped:null, act:'transfer', text:'<strong>pop/peek · out 空 → 倒</strong> · 從 in 頂逐一 3,2,1 壓進 out → out=[3,2,1]。<strong>out 頂端 = 1 = 佇列 front</strong>(順序被反轉)。' },
    { inS:[], outS:[3,2], popped:1, act:'pop', text:'<strong>pop()</strong> · 取 <code>out</code> 頂端 <strong>1</strong>(佇列 front)回傳。out=[3,2](頂=2)。' },
    { inS:[], outS:[3,2], popped:null, act:'done', text:'<strong>完成</strong> · 之後 pop 直接從 out 取(2、3),不必再倒。<strong>每個元素只倒一次 → 攤還 O(1)</strong>。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function triD(cx,cy,col){ ctx.beginPath(); ctx.moveTo(cx-6,cy-7); ctx.lineTo(cx+6,cy-7); ctx.lineTo(cx,cy+3); ctx.closePath(); ctx.fillStyle=col; ctx.fill(); }

  function drawStack(title, arr, y, topCol, topLabel, extraFade){
    const w=canvas.clientWidth,PAD=30;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText(title, PAD, y);
    const cy=y+19, cw=48, cg=12; let cx=PAD+8;
    if(arr.length===0 && !extraFade){ ctx.fillStyle=C.offT; ctx.font='600 12px "Noto Sans TC", sans-serif'; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText('(空)', cx, cy+21); }
    for(let k=0;k<arr.length;k++){
      const isTop=k===arr.length-1;
      rr(cx,cy,cw,42,7); ctx.fillStyle=isTop?topCol.bg:C.src; ctx.fill(); ctx.lineWidth=isTop?3:1.7; ctx.strokeStyle=isTop?topCol.bd:C.srcS; ctx.stroke();
      ctx.fillStyle=isTop?topCol.tc:C.srcT; ctx.font='700 19px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(arr[k]), cx+cw/2, cy+21);
      if(isTop){ triD(cx+cw/2, cy-3, topCol.bd); ctx.fillStyle=topCol.tc; ctx.font='700 9px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='bottom'; ctx.fillText(topLabel, cx+cw/2, cy-9); }
      cx+=cw+cg;
    }
    if(extraFade!==null && extraFade!==undefined){
      rr(cx,cy,cw,42,7); ctx.fillStyle=C.off; ctx.fill(); ctx.lineWidth=1.7; ctx.strokeStyle=C.offS; ctx.setLineDash([4,3]); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=C.offT; ctx.font='700 19px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(String(extraFade), cx+cw/2, cy+21);
      ctx.fillStyle=C.curT; ctx.font='700 9px "JetBrains Mono", monospace'; ctx.textBaseline='top'; ctx.fillText('✗ pop', cx+cw/2, cy+46);
    }
  }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,PAD=30; const done=s.act==='done';
    ctx.fillStyle=C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);
    drawStack('BAND 1 · in 堆疊(收 push · 右=top)', s.inS, 18, {bg:'#bcd4ee',bd:C.srcS,tc:C.srcT}, 'top', null);
    drawStack('BAND 2 · out 堆疊(供 pop/peek · 右=top=佇列 front)', s.outS, 96, {bg:C.grn,bd:C.grnS,tc:C.grnT}, 'top=front', s.popped);

    // ---- BAND 3 ----
    const by=188;
    ctx.fillStyle=C.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · push→in;pop/peek:out 空則倒 in→out,再取 out 頂', PAD, by);
    rr(PAD,by+10,w-PAD*2,44,6); ctx.fillStyle=(s.act==='transfer'||s.act==='pop'||done)?C.grn:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=(s.act==='transfer'||s.act==='pop'||done)?C.grnS:C.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='600 12.5px "Noto Sans TC", sans-serif';
    let msg,col=C.text;
    if(s.act==='intro'){ msg='懶搬移:平時各管各的,只有 out 空了才一次倒過來'; }
    else if(done){ msg='攤還 O(1):每個元素一生只從 in 倒到 out 一次'; col=C.grnT; }
    else if(s.act==='transfer'){ msg='out 空 → 把 in 反轉倒進 out,頂端變成最早進的(front)'; col=C.grnT; }
    else if(s.act==='pop'){ msg='out 非空 → 直接取頂端,O(1),不用倒'; col=C.grnT; }
    else { msg='push 只進 in,O(1);辛苦留到「需要 pop 且 out 空」時才做'; col=C.srcT; }
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
