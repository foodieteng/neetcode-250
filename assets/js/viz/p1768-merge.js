/* ============================================================
   P1768 · Merge Strings Alternately — 平行雙指針交錯合併 · viz
   兩個指針各走一個字串:l 走 word1、r 走 word2。從 word1 起,
   輪流各取一個字元接到結果;哪個先走完,就把另一個剩下的整段接上。
   O(m+n) 時間。這是「平行/同向雙指針」——兩指針各自前進,不對撞。
   例 word1="abc", word2="pqrs" → "ap bq cr" + 剩下 "s" = "apbqcrs"。
     BAND 1  word1 / word2(藍=word1 · 綠=word2 · 紅=當前取的字元)
     BAND 2  result(交錯建立 · 最後接上較長字串的尾巴)
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

  const W1 = ['a','b','c'], W2 = ['p','q','r','s'];
  // 結果字元 + 來源(1 或 2)
  const RES = [['a',1],['p',2],['b',1],['q',2],['c',1],['r',2],['s',2]];
  // 每步:l, r, resLen(結果已建到幾個字元), phase, text
  const steps = [
    { l:0, r:0, resLen:0, phase:'intro', text:'<strong>INITIAL</strong> · <code>word1="abc"</code>、<code>word2="pqrs"</code>。從 word1 起,兩指針各走一字串,<strong>輪流各取一個字元</strong>接到結果。' },
    { l:1, r:1, resLen:2, phase:'take', text:'<strong>取一輪</strong> · <code>word1[0]=\'a\'</code>、<code>word2[0]=\'p\'</code> → 接成 <code>"ap"</code>。<code>l++、r++</code>。' },
    { l:2, r:2, resLen:4, phase:'take', text:'<strong>取一輪</strong> · <code>\'b\'</code>、<code>\'q\'</code> → <code>"apbq"</code>。' },
    { l:3, r:3, resLen:6, phase:'take', text:'<strong>取一輪</strong> · <code>\'c\'</code>、<code>\'r\'</code> → <code>"apbqcr"</code>。<code>word1</code> 到底了(l=3=m)。' },
    { l:3, r:4, resLen:7, phase:'tail', done:true, text:'<strong>接尾巴</strong> · <code>word1</code> 用完,把 <code>word2</code> 剩下的 <code>"s"</code> 整段接上 → <code>"apbqcrs"</code>。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function tri(cx,cy,col){ ctx.beginPath(); ctx.moveTo(cx-6,cy+7); ctx.lineTo(cx+6,cy+7); ctx.lineTo(cx,cy-3); ctx.closePath(); ctx.fillStyle=col; ctx.fill(); }

  function drawRow(arr, cur, srcTint, gy, cell, gp, PAD){
    for(let k=0;k<arr.length;k++){
      const x=PAD+k*(cell+gp);
      const consumed = k<cur;
      const isCur = k===cur;
      rr(x,gy,cell,cell,7);
      let col = srcTint;
      let bg=col.bg,bd=col.bd,tc=col.tc;
      if(consumed){ bg=C.off; bd=C.offS; tc=C.offT; }
      if(isCur){ bg=C.cur; bd=C.curS; tc=C.curT; }
      ctx.fillStyle=bg; ctx.fill(); ctx.lineWidth=isCur?3:1.6; ctx.strokeStyle=bd; ctx.stroke();
      ctx.fillStyle=tc; ctx.font='700 20px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(arr[k], x+cell/2, gy+cell/2);
    }
  }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,PAD=30;
    ctx.fillStyle=C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);
    const cell=42, gp=8;
    // BAND 1 · word1 / word2
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 兩指針各走一字串(紅=當前取 · 灰=已取)', PAD, 18);
    // labels
    ctx.fillStyle=C.srcT; ctx.font='700 11px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='middle';
    ctx.fillText('word1', PAD, 50);
    ctx.fillStyle=C.grnT; ctx.fillText('word2', PAD, 100);
    // rows (shift right to leave room for labels)
    const RX = PAD + 52;
    drawRow(W1, s.done?W1.length:s.l, {bg:C.src,bd:C.srcS,tc:C.srcT}, 30, cell, gp, RX);
    drawRow(W2, s.done?W2.length:s.r, {bg:C.grn,bd:C.grnS,tc:C.grnT}, 80, cell, gp, RX);
    // l / r pointers
    if(!s.done){
      if(s.l<W1.length){ const lx=RX+s.l*(cell+gp)+cell/2; tri(lx,30-6,C.curS); ctx.fillStyle=C.curT; ctx.font='700 10px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='bottom'; ctx.fillText('l',lx,30-8); }
      if(s.r<W2.length){ const rx=RX+s.r*(cell+gp)+cell/2; ctx.fillStyle=C.curT; ctx.font='700 10px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='bottom'; tri(rx,80-6,C.curS); ctx.fillText('r',rx,80-8); }
    }

    // BAND 2 · result
    const by=136;
    ctx.fillStyle=C.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · result(藍=來自 word1 · 綠=來自 word2)', PAD, by);
    const ry=by+12, rcell=42, rgp=6, rn=RES.length, rgx=(w-(rn*rcell+(rn-1)*rgp))/2;
    for(let k=0;k<rn;k++){
      const x=rgx+k*(rcell+rgp);
      const shown = k<s.resLen;
      const justAdded = k>= (step>0?steps[step-1].resLen:0) && k<s.resLen && s.phase!=='intro';
      rr(x,ry,rcell,rcell,7);
      let bg='#fafaf6',bd=C.grid,tc=C.dim;
      if(shown){ const src=RES[k][1]; bg=src===1?C.src:C.grn; bd=src===1?C.srcS:C.grnS; tc=src===1?C.srcT:C.grnT; }
      ctx.fillStyle=bg; ctx.fill(); ctx.lineWidth=justAdded?3:1.6; ctx.strokeStyle=justAdded?C.curS:bd; ctx.stroke();
      ctx.fillStyle=shown?tc:C.dim; ctx.font='700 20px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(shown?RES[k][0]:'·', x+rcell/2, ry+rcell/2);
    }
    // caption
    const cy=ry+rcell+22; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='600 12.5px "Noto Sans TC", sans-serif';
    ctx.fillStyle=s.done?C.grnT:C.text;
    ctx.fillText(s.done?'完成 "apbqcrs" · 交錯合併 + 接尾巴 · O(m+n)':(s.phase==='tail'?'一方走完 → 另一方剩下的整段接上':(s.phase==='take'?'各取一字元:先 word1 再 word2':'l 走 word1、r 走 word2,輪流取字元')), w/2, cy);
  }

  function update(){ const s=steps[step]; if(stepEl) stepEl.textContent=String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0'); if(labelEl) labelEl.innerHTML=s.text; draw(); }
  function next(){ if(step<steps.length-1){step++;update();}else stop(); }
  function prev(){ if(step>0){step--;update();} }
  function reset(){ stop(); step=0; update(); }
  function play(){ if(timer){stop();return;} bPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){stop();return;} next(); },1700); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} if(bPlay) bPlay.textContent='Play'; }
  bPrev&&bPrev.addEventListener('click',prev); bNext&&bNext.addEventListener('click',next); bPlay&&bPlay.addEventListener('click',play); bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();}); if(window.ResizeObserver){ new ResizeObserver(()=>{fit();draw();}).observe(canvas); }
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw); fit(); update();
})();
