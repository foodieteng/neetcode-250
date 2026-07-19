/* ============================================================
   P121 · Best Time to Buy and Sell Stock — 一次掃描 · 前綴最小 · viz
   只能買一次、之後賣一次,求最大利潤。掃過每一天:若「今天賣」,最好的買點
   就是「今天以前的最低價」。所以維持 minPrice = 目前為止最低,
   利潤候選 = price[i] - minPrice,一路取最大;再更新 minPrice。
   等價於「滑動視窗左端永遠釘在前綴最小值」的退化窗。
   例 [7,1,5,3,6,4] → 第1天買(1)、第4天賣(6),利潤 5。
     BAND 1  價格(藍=目前最低買點 · 紅=今天 · 綠=最佳買賣對)
     BAND 2  minPrice / 今天賣利潤 / maxProfit
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

  const P = [7, 1, 5, 3, 6, 4];
  // i(今天), minV, minIdx, prof(今天賣利潤 or null), maxP, buy, sell(最佳對 idx or -1), up(maxP 更新?)
  const steps = [
    { i:0, minV:7, minIdx:0, prof:null, maxP:0, buy:-1, sell:-1, act:'init', text:'<strong>DAY 0</strong> · 價格 <code>7</code>。設定 <code>minPrice=7</code>(目前最低買點),<code>maxProfit=0</code>。往後每天都問:「今天賣能賺多少?」' },
    { i:1, minV:1, minIdx:1, prof:-6, maxP:0, buy:-1, sell:-1, up:false, act:'lower', text:'<strong>DAY 1</strong> · 價格 <code>1</code>。今天賣利潤 <code>1-7=-6 &lt; 0</code>,<code>maxProfit</code> 不變(=0)。但 <code>1</code> 刷新最低 → <code>minPrice=1</code>,成為新買點。' },
    { i:2, minV:1, minIdx:1, prof:4, maxP:4, buy:1, sell:2, up:true, act:'profit', text:'<strong>DAY 2</strong> · 價格 <code>5</code>。今天賣利潤 <code>5-1=4</code> → <code>maxProfit=4</code>(第1天買、第2天賣)。<code>minPrice</code> 仍是 1。' },
    { i:3, minV:1, minIdx:1, prof:2, maxP:4, buy:1, sell:2, up:false, act:'profit', text:'<strong>DAY 3</strong> · 價格 <code>3</code>。今天賣利潤 <code>3-1=2 &lt; 4</code>,<code>maxProfit</code> 不變。' },
    { i:4, minV:1, minIdx:1, prof:5, maxP:5, buy:1, sell:4, up:true, act:'profit', text:'<strong>DAY 4</strong> · 價格 <code>6</code>。今天賣利潤 <code>6-1=5</code> → <code>maxProfit=5</code>(第1天買、第4天賣)。目前最佳。' },
    { i:5, minV:1, minIdx:1, prof:3, maxP:5, buy:1, sell:4, up:false, act:'done', text:'<strong>DAY 5</strong> · 價格 <code>4</code>。利潤 <code>4-1=3 &lt; 5</code>,不更新。掃完 → <strong>回傳 maxProfit=5</strong>(第1天買 1、第4天賣 6)。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function triD(cx,cy,col){ ctx.beginPath(); ctx.moveTo(cx-6,cy-7); ctx.lineTo(cx+6,cy-7); ctx.lineTo(cx,cy+3); ctx.closePath(); ctx.fillStyle=col; ctx.fill(); }
  function triU(cx,cy,col){ ctx.beginPath(); ctx.moveTo(cx-6,cy+7); ctx.lineTo(cx+6,cy+7); ctx.lineTo(cx,cy-3); ctx.closePath(); ctx.fillStyle=col; ctx.fill(); }
  function chip(x,y,w,h,label,val,bg,bd,tc){
    rr(x,y,w,h,7); ctx.fillStyle=bg; ctx.fill(); ctx.lineWidth=1.7; ctx.strokeStyle=bd; ctx.stroke();
    ctx.fillStyle=tc; ctx.font='600 10px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='top'; ctx.fillText(label, x+w/2, y+6);
    ctx.font='700 19px "JetBrains Mono", monospace'; ctx.textBaseline='middle'; ctx.fillText(val, x+w/2, y+h/2+8);
  }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,PAD=30;
    ctx.fillStyle=C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);
    // ---- BAND 1 ----
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · prices(藍=目前最低買點 · 紅=今天 · 綠=最佳買賣對)', PAD, 20);
    const n=P.length, cell=Math.min(72,(w-2*PAD)/n-10), gp=((w-2*PAD)-n*cell)/(n-1), gy=48, chh=44;
    for(let k=0;k<n;k++){
      const x=PAD+k*(cell+gp);
      const isCur = k===s.i;
      const isMin = k===s.minIdx;
      const isBuy = k===s.buy, isSell = k===s.sell;
      const future = k>s.i;
      rr(x,gy,cell,chh,8);
      let bg=C.cell,bd=C.cellS,tc=C.text;
      if(future){ bg=C.cell; bd=C.cellS; tc=C.offT; }
      if(isMin){ bg=C.src; bd=C.srcS; tc=C.srcT; }
      if(isBuy||isSell){ bg=C.grn; bd=C.grnS; tc=C.grnT; }
      ctx.fillStyle=bg; ctx.fill(); ctx.lineWidth=isCur?3:1.7; ctx.strokeStyle=isCur?C.curS:bd; ctx.stroke();
      ctx.fillStyle=isCur?C.curT:tc; ctx.font='700 21px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(P[k]), x+cell/2, gy+chh/2);
      ctx.fillStyle=C.dim; ctx.font='600 10px "JetBrains Mono", monospace'; ctx.textBaseline='top';
      ctx.fillText('d'+k, x+cell/2, gy+chh+6);
    }
    // markers: 今天(above), min(below)
    { const cx=PAD+s.i*(cell+gp)+cell/2; triD(cx, gy-4, C.curS); ctx.fillStyle=C.curT; ctx.font='700 10px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='bottom'; ctx.fillText('今天', cx, gy-10); }
    { const mx=PAD+s.minIdx*(cell+gp)+cell/2; triU(mx, gy+chh+18, C.srcS); ctx.fillStyle=C.srcT; ctx.font='700 10px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='top'; ctx.fillText('買 min', mx, gy+chh+24); }

    // ---- BAND 2 · running values ----
    const b2=134;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 今天賣利潤 = price − minPrice;maxProfit 取最大', PAD, b2);
    const cw=Math.min(150,(w-2*PAD-24)/3), cy2=b2+12, chh2=44, gap=12;
    chip(PAD, cy2, cw, chh2, 'minPrice', String(s.minV), C.src, C.srcS, C.srcT);
    const profTxt = s.prof===null ? '—' : (s.prof>=0?'+':'')+s.prof;
    const profBg = (s.prof!==null && s.up) ? C.grn : (s.prof!==null && s.prof<0 ? C.off : '#fafaf6');
    const profBd = (s.prof!==null && s.up) ? C.grnS : (s.prof!==null && s.prof<0 ? C.offS : C.grid);
    const profTc = (s.prof!==null && s.up) ? C.grnT : (s.prof!==null && s.prof<0 ? C.offT : C.text);
    chip(PAD+cw+gap, cy2, cw, chh2, '今天賣利潤', profTxt, profBg, profBd, profTc);
    chip(PAD+2*(cw+gap), cy2, cw, chh2, 'maxProfit', String(s.maxP), s.act==='done'?C.grn:C.cur, s.act==='done'?C.grnS:C.curS, s.act==='done'?C.grnT:C.curT);

    // ---- BAND 3 · action ----
    const by=200;
    ctx.fillStyle=C.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · maxProfit=max(maxProfit, price−min);min=min(min,price)', PAD, by);
    rr(PAD,by+10,w-PAD*2,44,6); ctx.fillStyle=s.act==='done'?C.grn:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=s.act==='done'?C.grnS:C.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='600 12.5px "Noto Sans TC", sans-serif';
    let msg,col=C.text;
    if(s.act==='init'){ msg='買點 = 前綴最低價;每天用「今天賣」試算利潤,取最大'; }
    else if(s.act==='lower'){ msg='今天更便宜 → 更新買點 minPrice,但負利潤不採計'; col=C.srcT; }
    else if(s.act==='done'){ msg='掃完 · 回傳 maxProfit=5(第1天買 1、第4天賣 6)· O(n)/O(1)'; col=C.grnT; }
    else if(s.up){ msg='今天賣利潤刷新紀錄 → 更新 maxProfit'; col=C.grnT; }
    else { msg='今天賣利潤沒有更高 → maxProfit 不變'; col=C.offT; }
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
