/* ============================================================
   P84 · Largest Rectangle in Histogram — 遞增單調堆疊 · viz
   每根柱子的最大矩形,往左右延伸到「第一根比它矮」為止 → 需要兩側最近的更矮。
   維持「高度遞增」的索引堆疊:新柱 h[i] ≤ 頂端就 pop —— 頂端柱找到右邊界 i,
   pop 後的新頂端是它的左邊界 L,寬 = i − L − 1,面積 = h × 寬。末尾放哨兵 -1 清空堆疊。
   例 [2,1,5,6,2,3] → 最大 10(高 5 × 寬 2)。
     BAND 1  直方圖(綠框=剛算出的矩形 · 紅=目前柱)
     BAND 2  索引堆疊(高度遞增 · 右=top)
     BAND 3  面積計算 / maxArea
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
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424', off:'#eceae2', offS:'#c9c6ba', offT:'#8a8672',
    bar:'#c9d9ee', barS:'#7fa3cf', coral:'#cf3535' };

  const H = [2,1,5,6,2,3], MAXH = 6;
  // rect: {L, R, h, area, best} — rectangle just computed (spans bars L+1..R-1). null = none.
  const steps = [
    { cur:-1, stack:[], rect:null, maxA:0, act:'intro', text:'<strong>INITIAL</strong> · 維持「高度<strong>遞增</strong>」的索引堆疊。新柱 ≤ 頂端就 pop:頂端柱找到右邊界,pop 後新頂端是左邊界。' },
    { cur:0, stack:[0], rect:null, maxA:0, act:'push', text:'<strong>i=0 (h=2)</strong> · 堆疊空 → push 0。' },
    { cur:1, stack:[1], rect:{L:-1,R:1,h:2,area:2}, maxA:2, act:'pop', text:'<strong>i=1 (h=1)</strong> · 1 ≤ 頂端 2 → pop 0。左邊界空(w=i=1),面積 2×1=2。再 push 1。' },
    { cur:3, stack:[1,2,3], rect:null, maxA:2, act:'push', text:'<strong>i=2(5)、i=3(6)</strong> · 都比頂端高 → 直接 push。堆疊高度 [1,5,6] 遞增。' },
    { cur:4, stack:[1,2], rect:{L:2,R:4,h:6,area:6}, maxA:6, act:'pop', text:'<strong>i=4 (h=2)</strong> · 2 ≤ 6 → pop 3(h=6)。左邊界=索引2,寬=4−2−1=1,面積 6×1=6。' },
    { cur:4, stack:[1], rect:{L:1,R:4,h:5,area:10,best:true}, maxA:10, act:'pop', text:'<strong>i=4 續</strong> · 2 ≤ 5 → pop 2(h=5)。左邊界=索引1,寬=4−1−1=<strong>2</strong>,面積 5×2=<strong>10</strong> ← 最佳!' },
    { cur:4, stack:[1,4], rect:null, maxA:10, act:'push', text:'<strong>i=4 收尾</strong> · 頂端 1 &lt; 2 停。push 4。堆疊 [1,4]。' },
    { cur:5, stack:[1,4,5], rect:null, maxA:10, act:'push', text:'<strong>i=5 (h=3)</strong> · 3 &gt; 頂端 2 → push 5。堆疊高度 [1,2,3] 遞增。' },
    { cur:6, stack:[], rect:{L:-1,R:6,h:1,area:6}, maxA:10, act:'flush', text:'<strong>哨兵 -1</strong> · 比誰都矮 → 清空堆疊:pop 5(3×1)、pop 4(2×4=8)、pop 1(1×6=6)。皆不及 10。' },
    { cur:-1, stack:[], rect:{L:1,R:4,h:5,area:10,best:true}, maxA:10, act:'done', text:'<strong>完成</strong> · maxArea = <strong>10</strong>(高 5 × 寬 2,索引 2–3)。每根柱子進出堆疊一次 → O(n)。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function triD(cx,cy,col){ ctx.beginPath(); ctx.moveTo(cx-6,cy-7); ctx.lineTo(cx+6,cy-7); ctx.lineTo(cx,cy+3); ctx.closePath(); ctx.fillStyle=col; ctx.fill(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,PAD=34; const done=s.act==='done';
    ctx.fillStyle=C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);
    // ── BAND 1 · histogram ──
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 直方圖(綠框=剛算出的矩形 · 紅=目前柱 · 藍框=在堆疊裡)', PAD, 16);
    const n=H.length, base=152, topY=44, unit=(base-topY)/MAXH;
    const bw=Math.min(58,(w-2*PAD)/n-12), gp=((w-2*PAD)-n*bw)/(n-1);
    const bx=k=>PAD+k*(bw+gp);
    // baseline
    ctx.strokeStyle=C.grid; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(PAD-6,base); ctx.lineTo(w-PAD+6,base); ctx.stroke();
    // rectangle overlay (behind bars edges but drawn as outline over)
    // bars
    for(let k=0;k<n;k++){
      const x=bx(k), bh=H[k]*unit, y=base-bh;
      const inStack=s.stack.includes(k), isCur=k===s.cur;
      rr(x,y,bw,bh,4); ctx.fillStyle=isCur?C.cur:C.bar; ctx.fill();
      ctx.lineWidth=inStack?3:1.6; ctx.strokeStyle=isCur?C.curS:(inStack?C.srcS:C.barS); ctx.stroke();
      ctx.fillStyle=isCur?C.curT:C.srcT; ctx.font='700 13px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='bottom';
      ctx.fillText(String(H[k]), x+bw/2, y-4);
      ctx.fillStyle=C.dim; ctx.font='600 10px "JetBrains Mono", monospace'; ctx.textBaseline='top'; ctx.fillText(String(k), x+bw/2, base+5);
    }
    // rectangle overlay
    if(s.rect){
      const r=s.rect; const lBar=r.L+1, rBar=r.R-1;
      const x1=bx(lBar), x2=bx(rBar)+bw, ry=base-r.h*unit;
      ctx.setLineDash([5,3]); ctx.lineWidth=3; ctx.strokeStyle=r.best?C.grnS:'#d98a3e';
      ctx.fillStyle=r.best?'rgba(95,168,102,0.16)':'rgba(217,138,62,0.12)';
      rr(x1,ry,x2-x1,base-ry,3); ctx.fill(); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=r.best?C.grnT:'#a8621c'; ctx.font='700 12px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='bottom';
      ctx.fillText(r.h+'×'+(r.R-r.L-1)+'='+r.area, (x1+x2)/2, ry-3);
    }

    // ── BAND 2 · stack ──
    const b2=172;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 索引堆疊(高度遞增 · 右=top · 格內 idx:height)', PAD, b2);
    const sy=b2+20, scw=64, sgp=14; let sx=PAD+4;
    if(s.stack.length===0){ ctx.fillStyle=C.offT; ctx.font='600 13px "Noto Sans TC", sans-serif'; ctx.textBaseline='middle'; ctx.fillText('(空)', sx, sy+20); }
    for(let k=0;k<s.stack.length;k++){
      const idx=s.stack[k], isTop=k===s.stack.length-1;
      rr(sx,sy,scw,40,7); ctx.fillStyle=isTop?'#eef4fb':C.src; ctx.fill(); ctx.lineWidth=isTop?3:1.7; ctx.strokeStyle=C.srcS; ctx.stroke();
      ctx.fillStyle=C.srcT; ctx.font='700 15px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(idx+':'+H[idx], sx+scw/2, sy+20);
      if(isTop){ triD(sx+scw/2, sy-3, C.srcT); ctx.fillStyle=C.srcT; ctx.font='700 9px "JetBrains Mono", monospace'; ctx.textBaseline='bottom'; ctx.fillText('top', sx+scw/2, sy-9); }
      sx+=scw+sgp;
    }
    ctx.textAlign='right'; ctx.textBaseline='alphabetic'; ctx.font='700 13px "JetBrains Mono", monospace'; ctx.fillStyle=done?C.grnT:C.text;
    ctx.fillText('maxArea = '+s.maxA, w-PAD, b2);

    // ── BAND 3 ──
    const by=238;
    ctx.fillStyle=C.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 新柱 ≤ 頂端 → pop;寬 = i − 左邊界 − 1(左空則寬 = i)', PAD, by);
    rr(PAD,by+10,w-PAD*2,40,6); ctx.fillStyle=done?C.grn:(s.act==='pop'||s.act==='flush'?C.grn:'#fafaf6'); ctx.fill(); ctx.lineWidth=1.6;
    ctx.strokeStyle=done?C.grnS:(s.act==='pop'||s.act==='flush'?C.grnS:C.grid); ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='600 12.5px "Noto Sans TC", sans-serif';
    let msg,col=C.text;
    if(s.act==='intro'){ msg='要找每根柱兩側「最近更矮」→ 遞增堆疊'; }
    else if(done){ msg='答案 = 過程中所有矩形面積的最大值'; col=C.grnT; }
    else if(s.act==='pop'){ msg='被 pop 的柱:右邊界=i、左邊界=pop 後的新頂端'; col=C.grnT; }
    else if(s.act==='flush'){ msg='哨兵 -1 把剩下的柱全部結算(右邊界=末端)'; col=C.grnT; }
    else { msg='比頂端高(或堆疊空)→ 尚無右邊界,先 push 等待'; col=C.srcT; }
    ctx.fillStyle=col; ctx.fillText(msg, w/2, by+30);
  }

  function update(){ if(stepEl) stepEl.textContent=String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0'); if(labelEl) labelEl.innerHTML=steps[step].text; draw(); }
  function next(){ if(step<steps.length-1){step++;update();}else stop(); }
  function prev(){ if(step>0){step--;update();} }
  function reset(){ stop(); step=0; update(); }
  function play(){ if(timer){stop();return;} bPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){stop();return;} next(); },1800); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} if(bPlay) bPlay.textContent='Play'; }
  bPrev&&bPrev.addEventListener('click',prev); bNext&&bNext.addEventListener('click',next); bPlay&&bPlay.addEventListener('click',play); bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();}); if(window.ResizeObserver){ new ResizeObserver(()=>{fit();draw();}).observe(canvas); }
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw); fit(); update();
})();
