/* ============================================================
   P225 · Implement Stack using Queues — 單佇列「旋轉」法 · viz
   用一個佇列(FIFO)模擬堆疊(LIFO)。訣竅在 push:把 x 加到 back 後,
   再把「舊的 size 個元素」依序 front→back 輪一圈,讓 x 轉到最前面。
   於是佇列的 front 永遠是「最後 push 的」= 堆疊 top → pop/top 都是 O(1) front 操作。
   push 為 O(n)(旋轉);pop/top/empty 為 O(1)。
   例 push1、push2、push3 → 佇列 [3,2,1](front=3=top);pop → 回 3。
     BAND 1  佇列(左=front=top · 右=back · 綠=剛 push/旋到 front)
     BAND 2  本步:加到 back → 旋轉舊 size 個 → 新元素到 front
     BAND 3  front == 堆疊 top(FIFO 假裝成 LIFO)
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

  // q: front at index 0. hl: index to highlight green. popped: value fading. act.
  const steps = [
    { q:[], hl:-1, popped:null, act:'intro', text:'<strong>INITIAL</strong> · 用一個佇列(FIFO)模擬堆疊(LIFO)。訣竅:push 後把新元素<strong>旋轉到 front</strong>,front 就永遠是堆疊 top。' },
    { q:[1], hl:0, popped:null, act:'push', text:'<strong>push(1)</strong> · 佇列空,直接加。<code>[1]</code>,front=1=top。' },
    { q:[2,1], hl:0, popped:null, act:'push', text:'<strong>push(2)</strong> · 加 2 到 back → <code>[1,2]</code>,再把舊的 <strong>1 個</strong>(1)輪到後面 → <code>[2,1]</code>。front=2=top。' },
    { q:[2,1,3], hl:2, popped:null, act:'addback', text:'<strong>push(3)</strong> · 先加 3 到 <strong>back</strong> → <code>[2,1,3]</code>。此刻 3 還在最後,front 仍是 2。' },
    { q:[3,2,1], hl:0, popped:null, act:'rotate', text:'<strong>旋轉舊 size=2 個</strong> · 把 2、1 依序 front→back 輪走 → <code>[3,2,1]</code>。<strong>3 轉到 front = 新 top</strong>。' },
    { q:[2,1], hl:-1, popped:3, act:'pop', text:'<strong>pop()</strong> · 直接移除 front(=top)→ 回傳 <strong>3</strong>。佇列 <code>[2,1]</code>。O(1)。' },
    { q:[2,1], hl:0, popped:null, act:'done', text:'<strong>完成</strong> · front=2 又是新 top。push O(n) 旋轉一次;pop/top/empty 都 O(1)。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function triD(cx,cy,col){ ctx.beginPath(); ctx.moveTo(cx-6,cy-7); ctx.lineTo(cx+6,cy-7); ctx.lineTo(cx,cy+3); ctx.closePath(); ctx.fillStyle=col; ctx.fill(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,PAD=34; const done=s.act==='done';
    ctx.fillStyle=C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);
    // ---- BAND 1 · queue ----
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · queue(左=front=堆疊 top · 右=back · 綠=新元素)', PAD, 20);
    const qy=54, qh=48, cw=56, cg=14; let qx=PAD+8;
    const total = s.q.length + (s.popped!==null?1:0);
    if(s.q.length===0 && s.popped===null){ ctx.fillStyle=C.offT; ctx.font='600 13px "Noto Sans TC", sans-serif'; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText('(空)', qx, qy+qh/2); }
    for(let k=0;k<s.q.length;k++){
      const isHl=k===s.hl, isFront=k===0;
      rr(qx,qy,cw,qh,8); ctx.fillStyle=isHl?C.grn:C.src; ctx.fill(); ctx.lineWidth=(isHl||isFront)?3:1.7; ctx.strokeStyle=isHl?C.grnS:(isFront?C.srcS:C.srcS); ctx.stroke();
      ctx.fillStyle=isHl?C.grnT:C.srcT; ctx.font='700 22px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(s.q[k]), qx+cw/2, qy+qh/2);
      if(isFront){ triD(qx+cw/2, qy-4, C.srcT); ctx.fillStyle=C.srcT; ctx.font='700 9px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='bottom'; ctx.fillText('front=top', qx+cw/2, qy-10); }
      if(k===s.q.length-1 && s.q.length>1){ ctx.fillStyle=C.dim; ctx.font='700 9px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='top'; ctx.fillText('back', qx+cw/2, qy+qh+6); }
      qx+=cw+cg;
    }
    if(s.popped!==null){
      rr(qx,qy,cw,qh,8); ctx.fillStyle=C.off; ctx.fill(); ctx.lineWidth=1.7; ctx.strokeStyle=C.offS; ctx.setLineDash([4,3]); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=C.offT; ctx.font='700 22px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(String(s.popped), qx+cw/2, qy+qh/2);
      ctx.fillStyle=C.curT; ctx.font='700 9px "JetBrains Mono", monospace'; ctx.textBaseline='top'; ctx.fillText('✗ pop→回傳', qx+cw/2, qy+qh+6);
    }

    // ---- BAND 2 ----
    const b2=130;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · push:加到 back → 把舊 size 個輪到後面 → 新元素到 front', PAD, b2);
    rr(PAD,b2+10,w-PAD*2,40,6); ctx.fillStyle=(s.act==='rotate'||s.act==='push'||done)?C.grn:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=(s.act==='rotate'||s.act==='push'||done)?C.grnS:C.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='700 13.5px "JetBrains Mono", monospace'; ctx.fillStyle=C.text;
    let b2msg;
    if(s.act==='intro') b2msg='q.push(x); 旋轉 size 次:q.push(q.front()); q.pop();';
    else if(s.act==='addback') b2msg='q.push(3) → [2,1,3](3 在 back,還沒旋轉)';
    else if(s.act==='rotate') b2msg='旋轉 2 次:1、2 輪到後面 → [3,2,1]';
    else if(s.act==='pop') b2msg='pop() = q.front(); q.pop() → 3';
    else if(done) b2msg='front 恆為最後 push 的 = 堆疊 top';
    else b2msg='q.push('+s.q[0]+'); 旋轉 '+(s.q.length-1)+' 次 → front='+s.q[0];
    ctx.fillText(b2msg, w/2, b2+30);

    // ---- BAND 3 ----
    const by=192;
    ctx.fillStyle=C.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · FIFO 假裝 LIFO:讓 front 永遠是最新 → 就是 top', PAD, by);
    rr(PAD,by+10,w-PAD*2,44,6); ctx.fillStyle=done?C.grn:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?C.grnS:C.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='600 12.5px "Noto Sans TC", sans-serif';
    let msg,col=C.text;
    if(s.act==='intro'){ msg='把「先進先出」旋轉成「後進先出」:代價是 push 要旋轉 O(n)'; }
    else if(done){ msg='push O(n)、pop/top/empty O(1) · 單佇列旋轉法'; col=C.grnT; }
    else if(s.act==='pop'){ msg='pop/top 只碰 front → O(1)(所有辛苦都在 push)'; col=C.grnT; }
    else if(s.act==='addback'){ msg='剛加到 back 時 front 還是舊 top → 必須旋轉'; col=C.curT; }
    else { msg='新元素旋到 front → 佇列 front = 堆疊 top'; col=C.grnT; }
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
