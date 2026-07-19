/* ============================================================
   P167 · Two Sum II (sorted) — 對撞雙指針 · 單調消去 · viz
   陣列已排序。l 從左、r 從右往中間收。sum = a[l]+a[r]:
     sum == target → 找到,回傳 {l+1, r+1}
     sum <  target → a[l] 太小(連最大的 a[r] 都不夠)→ l++
     sum >  target → a[r] 太大(連最小的 a[l] 都爆)→ r--
   每次移動都「安全消去」一整排不可能的配對,故 O(n) 掃完。
   例 [1,3,4,5,7,11], target=9 → 4+5=9,回傳 {3,4}。
     BAND 1  陣列(藍=l · 紅=r · 灰=已消去 · 綠=答案)
     BAND 2  sum = a[l] + a[r] 與 target 比較 → 決定移哪邊
     BAND 3  單調消去的理由
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

  const A = [1, 3, 4, 5, 7, 11], T = 9;
  // l, r, sum, cmp('<'|'>'|'='), move('l'|'r'|null), done
  const steps = [
    { l:0, r:5, sum:12, cmp:'>', move:'r', act:'intro', text:'<strong>INITIAL</strong> · 已排序 <code>[1,3,4,5,7,11]</code>, target=<code>9</code>。<code>l</code> 從最左、<code>r</code> 從最右,往中間對撞。' },
    { l:0, r:5, sum:12, cmp:'>', move:'r', act:'move', text:'<strong>l=0,r=5</strong> · <code>1+11=12 &gt; 9</code>。最大的 <code>11</code> 連配最小的 <code>1</code> 都太大 → 它跟誰都超 → <strong>r 左移</strong>,消去 <code>11</code>。' },
    { l:0, r:4, sum:8, cmp:'<', move:'l', act:'move', text:'<strong>l=0,r=4</strong> · <code>1+7=8 &lt; 9</code>。最小的 <code>1</code> 連配最大的(現存)<code>7</code> 都不夠 → 它跟誰都不足 → <strong>l 右移</strong>,消去 <code>1</code>。' },
    { l:1, r:4, sum:10, cmp:'>', move:'r', act:'move', text:'<strong>l=1,r=4</strong> · <code>3+7=10 &gt; 9</code> → 太大 → <strong>r 左移</strong>,消去 <code>7</code>。' },
    { l:1, r:3, sum:8, cmp:'<', move:'l', act:'move', text:'<strong>l=1,r=3</strong> · <code>3+5=8 &lt; 9</code> → 不足 → <strong>l 右移</strong>,消去 <code>3</code>。' },
    { l:2, r:3, sum:9, cmp:'=', move:null, done:true, act:'found', text:'<strong>l=2,r=3</strong> · <code>4+5=9 == target</code> → <strong>找到!回傳 {l+1, r+1} = {3, 4}</strong>(1-indexed)。' },
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
    // ---- BAND 1 ----
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · numbers(藍=l · 紅=r · 灰=已消去 · 綠=答案)', PAD, 20);
    const n=A.length, cell=Math.min(72,(w-2*PAD)/n-10), gp=((w-2*PAD)-n*cell)/(n-1), gy=52, chh=46;
    for(let k=0;k<n;k++){
      const x=PAD+k*(cell+gp);
      const elim = k<s.l || k>s.r;
      const isL = k===s.l, isR = k===s.r;
      rr(x,gy,cell,chh,8);
      let bg=C.cell,bd=C.cellS,tc=C.text;
      if(elim){ bg=C.off; bd=C.offS; tc=C.offT; }
      if(isL){ bg=C.src; bd=C.srcS; tc=C.srcT; }
      if(isR){ bg=C.cur; bd=C.curS; tc=C.curT; }
      if(s.done && (isL||isR)){ bg=C.grn; bd=C.grnS; tc=C.grnT; }
      ctx.fillStyle=bg; ctx.fill(); ctx.lineWidth=(isL||isR)?3:1.7; ctx.strokeStyle=bd; ctx.stroke();
      ctx.fillStyle=tc; ctx.font='700 21px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(A[k]), x+cell/2, gy+chh/2);
      ctx.fillStyle=C.dim; ctx.font='600 10px "JetBrains Mono", monospace'; ctx.textBaseline='top';
      ctx.fillText(String(k+1), x+cell/2, gy+chh+6);   // 1-indexed 標號
    }
    // r pointer above, l pointer below
    { const rx=PAD+s.r*(cell+gp)+cell/2; triD(rx, gy-4, s.done?C.grnS:C.curS); ctx.fillStyle=s.done?C.grnT:C.curT; ctx.font='700 10px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='bottom'; ctx.fillText('r', rx, gy-10); }
    { const lx=PAD+s.l*(cell+gp)+cell/2; triU(lx, gy+chh+16, s.done?C.grnS:C.srcS); ctx.fillStyle=s.done?C.grnT:C.srcT; ctx.font='700 10px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='top'; ctx.fillText('l', lx, gy+chh+22); }

    // ---- BAND 2 · sum comparison ----
    const b2=134;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · sum = numbers[l] + numbers[r] 與 target 比較', PAD, b2);
    rr(PAD,b2+10,w-PAD*2,40,6); ctx.fillStyle=s.done?C.grn:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=s.done?C.grnS:C.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    const cmpTxt = s.cmp==='='?'=':(s.cmp==='<'?'<':'>');
    const cmpCol = s.cmp==='='?C.grnT:(s.cmp==='<'?C.srcT:C.curT);
    ctx.font='700 15px "JetBrains Mono", monospace'; ctx.fillStyle=C.text;
    const expr = A[s.l]+' + '+A[s.r]+' = '+s.sum+'  '+cmpTxt+'  '+T;
    ctx.fillText(expr, w/2, b2+30);

    // ---- BAND 3 · reasoning ----
    const by=196;
    ctx.fillStyle=C.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · sum<target → l++;sum>target → r--;== → 回傳', PAD, by);
    rr(PAD,by+10,w-PAD*2,44,6); ctx.fillStyle=s.done?C.grn:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=s.done?C.grnS:C.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='600 12.5px "Noto Sans TC", sans-serif';
    let msg,col=C.text;
    if(s.act==='intro'){ msg='排序後才能對撞:大了縮右、小了進左,單調地逼近 target'; }
    else if(s.done){ msg='命中 · a[l]+a[r]==target · 回傳 1-indexed {3,4} · O(n)/O(1)'; col=C.grnT; }
    else if(s.cmp==='>'){ msg='太大 → a[r] 配誰都超(l 只會更小)→ 安全消去 a[r]、r--'; col=C.curT; }
    else { msg='不足 → a[l] 配誰都不夠(r 只會更小)→ 安全消去 a[l]、l++'; col=C.srcT; }
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
