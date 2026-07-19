/* ============================================================
   P15 · 3Sum — 排序 + 固定一數 + 對撞雙指針 + 去重 · viz
   先排序。外層固定 nums[i](且跳過重複的 i);內層在 [i+1, n-1] 用對撞
   雙指針找兩數 = -nums[i]:sum<0 → l++;sum>0 → r--;==0 → 收下三元組,
   再各跳過相同值去重。整體 O(n²)。
   例 nums=[-1,0,1,2,-1,-4] 排序後 [-4,-1,-1,0,1,2] → [[-1,-1,2],[-1,0,1]]。
     BAND 1  排序陣列(綠=固定 i · 藍=l · 紅=r · 灰=已排除)
     BAND 2  nums[i]+nums[l]+nums[r] 與 0 比較 / 收下的三元組
     BAND 3  本步動作 + 答案集
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

  const A = [-4, -1, -1, 0, 1, 2];   // 已排序
  // i,l,r,sum,cmp,act,found(triplet|null),ans(累計三元組)
  const steps = [
    { i:0, l:1, r:5, sum:-3, cmp:'<', act:'intro', ans:[], text:'<strong>排序後</strong> <code>[-4,-1,-1,0,1,2]</code>。固定 <code>i</code>,內層在右側用對撞找兩數 <code>= -nums[i]</code>。' },
    { i:0, l:1, r:5, sum:-3, cmp:'<', act:'move', ans:[], text:'<strong>i=0(-4)</strong> · <code>-4+(-1)+2 = -3 &lt; 0</code> → 需要更大 → <strong>l++</strong>。' },
    { i:0, l:2, r:5, sum:-3, cmp:'<', act:'move', ans:[], text:'<strong>i=0</strong> · <code>-4+(-1)+2 = -3 &lt; 0</code> → <strong>l++</strong>。' },
    { i:0, l:3, r:5, sum:-2, cmp:'<', act:'move', ans:[], text:'<strong>i=0</strong> · <code>-4+0+2 = -2 &lt; 0</code> → <strong>l++</strong>。' },
    { i:0, l:4, r:5, sum:-1, cmp:'<', act:'idone', ans:[], text:'<strong>i=0</strong> · <code>-4+1+2 = -1 &lt; 0</code> → l++ 後 <code>l</code> 撞上 <code>r</code>。<code>-4</code> 這組<strong>無解</strong>,i 前進。' },
    { i:1, l:2, r:5, sum:0, cmp:'=', act:'found', found:[-1,-1,2], ans:[[-1,-1,2]], text:'<strong>i=1(-1)</strong> · <code>-1+(-1)+2 = 0</code> → <strong>收下 [-1,-1,2]!</strong> 然後 l++、r--,並跳過重複值。' },
    { i:1, l:3, r:4, sum:0, cmp:'=', act:'found', found:[-1,0,1], ans:[[-1,-1,2],[-1,0,1]], text:'<strong>i=1</strong> · <code>-1+0+1 = 0</code> → <strong>收下 [-1,0,1]!</strong> l++、r-- 後 <code>l</code> 撞 <code>r</code>,此 i 結束。' },
    { i:2, l:-1, r:-1, sum:0, cmp:'=', act:'skip', ans:[[-1,-1,2],[-1,0,1]], text:'<strong>i=2(-1)</strong> · <code>nums[2]==nums[1]</code> → <strong>與前一個 i 相同,跳過</strong>(否則會產生重複三元組)。' },
    { i:3, l:4, r:5, sum:3, cmp:'>', act:'idone', ans:[[-1,-1,2],[-1,0,1]], text:'<strong>i=3(0)</strong> · <code>0+1+2 = 3 &gt; 0</code> → r-- 後 <code>l</code> 撞 <code>r</code>。無解。後面 i 的最小和已 &gt; 0,結束。' },
    { i:-1, l:-1, r:-1, sum:0, cmp:'=', act:'done', ans:[[-1,-1,2],[-1,0,1]], text:'<strong>完成</strong> · 回傳 <code>[[-1,-1,2],[-1,0,1]]</code>。外層 O(n) × 內層對撞 O(n) → <strong>O(n²)</strong>。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function triD(cx,cy,col){ ctx.beginPath(); ctx.moveTo(cx-6,cy-7); ctx.lineTo(cx+6,cy-7); ctx.lineTo(cx,cy+3); ctx.closePath(); ctx.fillStyle=col; ctx.fill(); }
  function triU(cx,cy,col){ ctx.beginPath(); ctx.moveTo(cx-6,cy+7); ctx.lineTo(cx+6,cy+7); ctx.lineTo(cx,cy-3); ctx.closePath(); ctx.fillStyle=col; ctx.fill(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,PAD=30;
    ctx.fillStyle=C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);
    const done = s.act==='done';
    // ---- BAND 1 ----
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · sorted(綠=固定 i · 藍=l · 紅=r · 灰=已排除)', PAD, 18);
    const n=A.length, cell=Math.min(72,(w-2*PAD)/n-10), gp=((w-2*PAD)-n*cell)/(n-1), gy=50, chh=44;
    for(let k=0;k<n;k++){
      const x=PAD+k*(cell+gp);
      const isI = k===s.i;
      const isL = k===s.l && !done, isR = k===s.r && !done;
      const inTrip = s.found && (k===s.i||k===s.l||k===s.r);
      const excluded = (!done && !isI && (k<s.i || (s.l>=0 && (k<s.l||k>s.r)) || k===s.i));
      rr(x,gy,cell,chh,8);
      let bg=C.cell,bd=C.cellS,tc=C.text;
      // outside active inner window [l,r] or left of i → grey (but keep i coloured)
      if(!done && (k<s.i || (s.l>=0 && k>s.i && (k<s.l||k>s.r)))){ bg=C.off; bd=C.offS; tc=C.offT; }
      if(done){ bg=C.cell; bd=C.cellS; tc=C.text; }
      if(isI){ bg=C.grn; bd=C.grnS; tc=C.grnT; }
      if(isL){ bg=C.src; bd=C.srcS; tc=C.srcT; }
      if(isR){ bg=C.cur; bd=C.curS; tc=C.curT; }
      if(s.act==='skip' && isI){ bg=C.off; bd=C.offS; tc=C.offT; }   // dup i greyed
      ctx.fillStyle=bg; ctx.fill();
      ctx.lineWidth=(isI||isL||isR)?3:1.7;
      ctx.strokeStyle = inTrip ? C.grnS : (isI?C.grnS:(isL?C.srcS:(isR?C.curS:bd)));
      ctx.stroke();
      ctx.fillStyle=tc; ctx.font='700 21px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(A[k]), x+cell/2, gy+chh/2);
      ctx.fillStyle=C.dim; ctx.font='600 10px "JetBrains Mono", monospace'; ctx.textBaseline='top';
      ctx.fillText(String(k), x+cell/2, gy+chh+6);
    }
    if(!done){
      // l,r above
      if(s.l>=0){ const lx=PAD+s.l*(cell+gp)+cell/2; triD(lx, gy-4, C.srcS); ctx.fillStyle=C.srcT; ctx.font='700 10px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='bottom'; ctx.fillText('l', lx, gy-10); }
      if(s.r>=0){ const rx=PAD+s.r*(cell+gp)+cell/2; triD(rx, gy-4, C.curS); ctx.fillStyle=C.curT; ctx.font='700 10px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='bottom'; ctx.fillText('r', rx, gy-10); }
      // i below
      if(s.i>=0){ const ix=PAD+s.i*(cell+gp)+cell/2; triU(ix, gy+chh+18, s.act==='skip'?C.offS:C.grnS); ctx.fillStyle=s.act==='skip'?C.offT:C.grnT; ctx.font='700 10px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='top'; ctx.fillText('i', ix, gy+chh+24); }
    }

    // ---- BAND 2 · sum / triplet ----
    const b2=134;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · nums[i]+nums[l]+nums[r] 與 0 比較', PAD, b2);
    rr(PAD,b2+10,w-PAD*2,40,6); ctx.fillStyle=(s.cmp==='='&&s.act==='found')||done?C.grn:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=(s.cmp==='='&&s.act==='found')||done?C.grnS:C.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(done || s.act==='skip'){
      ctx.font='700 14px "JetBrains Mono", monospace'; ctx.fillStyle=done?C.grnT:C.offT;
      ctx.fillText(done?'答案 = [[-1,-1,2], [-1,0,1]]':'i 重複 → 不進內層,直接下一個 i', w/2, b2+30);
    } else {
      const cmpTxt = s.cmp==='='?'=':(s.cmp==='<'?'<':'>');
      ctx.font='700 15px "JetBrains Mono", monospace'; ctx.fillStyle=C.text;
      ctx.fillText(A[s.i]+' + '+A[s.l]+' + '+A[s.r]+' = '+s.sum+'  '+cmpTxt+'  0', w/2, b2+30);
    }

    // ---- BAND 3 · action + answers ----
    const by=196;
    ctx.fillStyle=C.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · sum<0 → l++;sum>0 → r--;==0 → 收下並跳重複', PAD, by);
    rr(PAD,by+10,w-PAD*2,44,6); ctx.fillStyle=(s.act==='found'||done)?C.grn:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=(s.act==='found'||done)?C.grnS:C.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='600 12.5px "Noto Sans TC", sans-serif';
    let msg,col=C.text;
    if(s.act==='intro'){ msg='固定 i,把三數和 = 0 化約成「兩數和 = -nums[i]」的對撞'; }
    else if(s.act==='found'){ msg='命中 · 收下三元組,l++、r-- 並各跳過相同值去重'; col=C.grnT; }
    else if(s.act==='skip'){ msg='外層去重:nums[i]==nums[i-1] 就 continue,避免重複組'; col=C.offT; }
    else if(s.act==='idone'){ msg='此 i 內層結束(l 撞 r)→ 換下一個 i'; col=C.offT; }
    else if(done){ msg='收集完畢 · 共 2 組 · 排序 O(n log n) + 掃描 O(n²) = O(n²)'; col=C.grnT; }
    else if(s.cmp==='<'){ msg='和太小 → 需要更大 → l 右移'; col=C.srcT; }
    else { msg='和太大 → 需要更小 → r 左移'; col=C.curT; }
    ctx.fillStyle=col; ctx.fillText(msg, w/2, by+32);
    // answer count top-right
    ctx.textAlign='right'; ctx.textBaseline='alphabetic'; ctx.font='600 11px "JetBrains Mono", monospace'; ctx.fillStyle=C.grnT;
    ctx.fillText('答案集:'+s.ans.length+' 組', w-PAD, 18);
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
