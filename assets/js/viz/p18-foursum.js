/* ============================================================
   P18 · 4Sum — 排序 + 固定兩數 + 對撞雙指針 + 去重 · viz
   3Sum 再套一層:外兩層固定 nums[i]、nums[j](各自去重),內層在 [j+1, n-1]
   用對撞找 nums[l]+nums[r] = target - nums[i] - nums[j]。四數和用 long long 防溢位。
   例 sorted [-2,-1,0,0,1,2], target=0 → [[-2,-1,1,2],[-2,0,0,2],[-1,0,0,1]]。
     BAND 1  排序陣列(綠=固定 i,j · 藍=l · 紅=r · 灰=已排除)
     BAND 2  nums[i]+nums[j]+nums[l]+nums[r] 與 target 比較
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

  const A = [-2, -1, 0, 0, 1, 2], T = 0;   // 已排序,target=0
  // i,j,l,r,sum,cmp,act,found(quad|null),ans
  const steps = [
    { i:0, j:1, l:2, r:5, sum:-1, cmp:'<', act:'intro', ans:0, text:'<strong>排序後</strong> <code>[-2,-1,0,0,1,2]</code>, target=<code>0</code>。固定 <code>i</code>、<code>j</code> 兩個錨,內層對撞找 <code>nums[l]+nums[r] = target−nums[i]−nums[j]</code>。' },
    { i:0, j:1, l:2, r:5, sum:-1, cmp:'<', act:'move', ans:0, text:'<strong>i=-2, j=-1</strong> · <code>-2-1+0+2 = -1 &lt; 0</code> → 需要更大 → <strong>l++</strong>。' },
    { i:0, j:1, l:3, r:5, sum:-1, cmp:'<', act:'move', ans:0, text:'<strong>i=-2, j=-1</strong> · <code>-2-1+0+2 = -1 &lt; 0</code> → <strong>l++</strong>。' },
    { i:0, j:1, l:4, r:5, sum:0, cmp:'=', act:'found', found:[-2,-1,1,2], ans:1, text:'<strong>i=-2, j=-1</strong> · <code>-2-1+1+2 = 0</code> → <strong>收下 [-2,-1,1,2]!</strong> l++、r-- 後 l 撞 r,此 (i,j) 結束。' },
    { i:0, j:2, l:3, r:5, sum:0, cmp:'=', act:'found', found:[-2,0,0,2], ans:2, text:'<strong>j 前進到 0</strong>(l 重設為 j+1=3)· <code>-2+0+0+2 = 0</code> → <strong>收下 [-2,0,0,2]!</strong>' },
    { i:-1, j:-1, l:-1, r:-1, sum:0, cmp:'=', act:'done', ans:3, text:'<strong>完成</strong> · i 前進到 <code>-1</code> 再得 <code>[-1,0,0,1]</code>。回傳 3 組。外兩層 O(n²) × 內層對撞 O(n) → <strong>O(n³)</strong>。' },
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
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · sorted(綠=固定 i,j · 藍=l · 紅=r · 灰=已排除)', PAD, 18);
    const n=A.length, cell=Math.min(72,(w-2*PAD)/n-10), gp=((w-2*PAD)-n*cell)/(n-1), gy=50, chh=44;
    for(let k=0;k<n;k++){
      const x=PAD+k*(cell+gp);
      const isI = k===s.i, isJ = k===s.j;
      const isL = k===s.l && !done, isR = k===s.r && !done;
      const inQuad = s.found && (k===s.i||k===s.j||k===s.l||k===s.r);
      rr(x,gy,cell,chh,8);
      let bg=C.cell,bd=C.cellS,tc=C.text;
      if(!done && !isI && !isJ && s.l>=0 && (k<s.l||k>s.r)){ bg=C.off; bd=C.offS; tc=C.offT; }
      if(isI||isJ){ bg=C.grn; bd=C.grnS; tc=C.grnT; }
      if(isL){ bg=C.src; bd=C.srcS; tc=C.srcT; }
      if(isR){ bg=C.cur; bd=C.curS; tc=C.curT; }
      ctx.fillStyle=bg; ctx.fill();
      ctx.lineWidth=(isI||isJ||isL||isR)?3:1.7;
      ctx.strokeStyle = inQuad ? C.grnS : (isI||isJ?C.grnS:(isL?C.srcS:(isR?C.curS:bd)));
      ctx.stroke();
      ctx.fillStyle=tc; ctx.font='700 21px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(A[k]), x+cell/2, gy+chh/2);
      ctx.fillStyle=C.dim; ctx.font='600 10px "JetBrains Mono", monospace'; ctx.textBaseline='top';
      ctx.fillText(String(k), x+cell/2, gy+chh+6);
    }
    if(!done){
      if(s.l>=0){ const lx=PAD+s.l*(cell+gp)+cell/2; triD(lx, gy-4, C.srcS); ctx.fillStyle=C.srcT; ctx.font='700 10px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='bottom'; ctx.fillText('l', lx, gy-10); }
      if(s.r>=0){ const rx=PAD+s.r*(cell+gp)+cell/2; triD(rx, gy-4, C.curS); ctx.fillStyle=C.curT; ctx.font='700 10px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='bottom'; ctx.fillText('r', rx, gy-10); }
      if(s.i>=0){ const ix=PAD+s.i*(cell+gp)+cell/2; triU(ix, gy+chh+18, C.grnS); ctx.fillStyle=C.grnT; ctx.font='700 10px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='top'; ctx.fillText('i', ix, gy+chh+24); }
      if(s.j>=0){ const jx=PAD+s.j*(cell+gp)+cell/2; triU(jx, gy+chh+18, C.grnS); ctx.fillStyle=C.grnT; ctx.font='700 10px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='top'; ctx.fillText('j', jx, gy+chh+24); }
    }

    // ---- BAND 2 ----
    const b2=134;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · nums[i]+nums[j]+nums[l]+nums[r] 與 target 比較', PAD, b2);
    rr(PAD,b2+10,w-PAD*2,40,6); ctx.fillStyle=(s.act==='found'||done)?C.grn:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=(s.act==='found'||done)?C.grnS:C.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(done){
      ctx.font='700 13px "JetBrains Mono", monospace'; ctx.fillStyle=C.grnT;
      ctx.fillText('答案 = [[-2,-1,1,2], [-2,0,0,2], [-1,0,0,1]]', w/2, b2+30);
    } else {
      const cmpTxt = s.cmp==='='?'=':(s.cmp==='<'?'<':'>');
      const f=(v)=> (v<0?'('+v+')':String(v));
      ctx.font='700 15px "JetBrains Mono", monospace'; ctx.fillStyle=C.text;
      ctx.fillText(f(A[s.i])+'+'+f(A[s.j])+'+'+f(A[s.l])+'+'+f(A[s.r])+' = '+s.sum+'  '+cmpTxt+'  '+T, w/2, b2+30);
    }

    // ---- BAND 3 ----
    const by=196;
    ctx.fillStyle=C.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · sum<target → l++;sum>target → r--;==target → 收下', PAD, by);
    rr(PAD,by+10,w-PAD*2,44,6); ctx.fillStyle=(s.act==='found'||done)?C.grn:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=(s.act==='found'||done)?C.grnS:C.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='600 12.5px "Noto Sans TC", sans-serif';
    let msg,col=C.text;
    if(s.act==='intro'){ msg='四數和用 long long 防溢位;內層仍是 167 的對撞'; }
    else if(s.act==='found'){ msg='命中 · 收下四元組,l++、r-- 並跳過相同值去重'; col=C.grnT; }
    else if(done){ msg='共 3 組 · 排序 + 外兩層 O(n²) × 內層 O(n) = O(n³)'; col=C.grnT; }
    else if(s.cmp==='<'){ msg='和太小 → 需要更大 → l 右移'; col=C.srcT; }
    else { msg='和太大 → 需要更小 → r 左移'; col=C.curT; }
    ctx.fillStyle=col; ctx.fillText(msg, w/2, by+32);
    ctx.textAlign='right'; ctx.textBaseline='alphabetic'; ctx.font='600 11px "JetBrains Mono", monospace'; ctx.fillStyle=C.grnT;
    ctx.fillText('答案集:'+s.ans+' 組', w-PAD, 18);
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
