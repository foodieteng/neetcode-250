/* ============================================================
   P219 · Contains Duplicate II — 滑動視窗 · 定長 ≤ k+1 · viz
   維持一個「最近 k+1 個元素」的視窗 [l, r]。右指針 r 每步前進;
   若 r - l > k 就從左邊收縮(把 nums[l] 移出視窗,l++),讓視窗長度 ≤ k+1。
   視窗內用一個「去重集合」記住出現過的值:加入 nums[r] 時若集合已有它
   → 視窗內存在兩個相等且距離 ≤ k 的元素 → 回傳 true。
   例 nums=[1,0,1,1], k=1:視窗最長 2。idx0 的 1 因為太遠被移出,
   最後 idx2、idx3 兩個相鄰的 1 同時在視窗內 → 命中。
     BAND 1  陣列(綠=視窗 [l,r] · 紅=r 目前 · 灰=已離開視窗)
     BAND 2  視窗集合(最近 ≤ k+1 個值;重複值變紅=命中)
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

  const ARR = [1, 0, 1, 1];
  // l, r, win (indices in window l..r to show as chips), evict (value moved out or null), dup (bool), act, text
  const steps = [
    { l:0, r:-1, act:'intro', text:'<strong>INITIAL</strong> · <code>nums=[1,0,1,1]</code>, <code>k=1</code>。維持一個「最近 ≤ k+1 = 2 個」的視窗 <code>[l,r]</code>;視窗內用去重集合記已見過的值。' },
    { l:0, r:0,  act:'add',   text:'<strong>r=0</strong> · <code>r-l=0 ≤ k</code>,加入 <code>nums[0]=1</code>。集合 <code>{1}</code>,沒有重複。' },
    { l:0, r:1,  act:'add',   text:'<strong>r=1</strong> · <code>r-l=1 ≤ k</code>,加入 <code>nums[1]=0</code>。集合 <code>{1,0}</code>,視窗已滿(長度 2 = k+1)。' },
    { l:1, r:2,  act:'evict', evict:1, text:'<strong>r=2</strong> · <code>r-l=2 &gt; k</code> → 先收縮:移出 <code>nums[0]=1</code>,<code>l=1</code>。再加入 <code>nums[2]=1</code>。集合 <code>{0,1}</code> —— 早先那個 1 已被移出,不算重複。' },
    { l:2, r:3,  act:'detect', evict:0, dup:true, text:'<strong>r=3</strong> · <code>r-l=2 &gt; k</code> → 移出 <code>nums[1]=0</code>,<code>l=2</code>。加入 <code>nums[3]=1</code>,集合裡已有 <code>1</code>(idx2)→ <strong>命中!回傳 true</strong>(idx2、idx3 距離 1 ≤ k)。' },
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
    ctx.fillText('BAND 1 · nums(綠=視窗 [l,r] · 紅=r 目前 · 灰=已離開)', PAD, 20);
    const n=ARR.length, cell=Math.min(72,(w-2*PAD)/n-10), gp=((w-2*PAD)-n*cell)/(n-1), gy=52, chh=46;
    for(let k=0;k<n;k++){
      const x=PAD+k*(cell+gp);
      const inWin = s.r>=0 && k>=s.l && k<=s.r;
      const isR = k===s.r;
      rr(x,gy,cell,chh,8);
      let bg=C.cell,bd=C.cellS,tc=C.text;
      if(k<s.l || s.r<0 || k>s.r){ bg=C.off; bd=C.offS; tc=C.offT; }   // outside window
      if(inWin){ bg=C.grn; bd=C.grnS; tc=C.grnT; }
      if(isR){ bg=C.cur; bd=C.curS; tc=C.curT; }
      ctx.fillStyle=bg; ctx.fill(); ctx.lineWidth=isR?3:1.7; ctx.strokeStyle=bd; ctx.stroke();
      ctx.fillStyle=tc; ctx.font='700 22px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(ARR[k]), x+cell/2, gy+chh/2);
      ctx.fillStyle=C.dim; ctx.font='600 10px "JetBrains Mono", monospace'; ctx.textBaseline='top';
      ctx.fillText(String(k), x+cell/2, gy+chh+6);
    }
    // r pointer above, l pointer below index labels
    if(s.r>=0){ const rx=PAD+s.r*(cell+gp)+cell/2; triD(rx, gy-4, C.curS); ctx.fillStyle=C.curT; ctx.font='700 10px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='bottom'; ctx.fillText('r', rx, gy-10); }
    { const lx=PAD+s.l*(cell+gp)+cell/2; triU(lx, gy+chh+16, C.srcS); ctx.fillStyle=C.srcT; ctx.font='700 10px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='top'; ctx.fillText('l', lx, gy+chh+22); }

    // ---- BAND 2 · window set chips ----
    const b2=150;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 視窗集合(最近 ≤ k+1 個值 · 加入時已存在 → 命中)', PAD, b2);
    const cw=42, cg=12, cy2=b2+12, chh2=34;
    if(s.r<0){
      ctx.fillStyle=C.offT; ctx.font='600 12.5px "Noto Sans TC", sans-serif'; ctx.textAlign='left'; ctx.textBaseline='middle';
      ctx.fillText('空', PAD+4, cy2+chh2/2);
    } else {
      // draw a chip per index in window l..r
      let idx=0;
      for(let k=s.l;k<=s.r;k++){
        const x=PAD+idx*(cw+cg);
        const isDupChip = s.dup && k===s.r;         // the just-added duplicate
        rr(x,cy2,cw,chh2,7);
        let bg=C.src,bd=C.srcS,tc=C.srcT;
        if(isDupChip){ bg=C.cur; bd=C.curS; tc=C.curT; }
        ctx.fillStyle=bg; ctx.fill(); ctx.lineWidth=isDupChip?3:1.7; ctx.strokeStyle=bd; ctx.stroke();
        ctx.fillStyle=tc; ctx.font='700 17px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(String(ARR[k]), x+cw/2, cy2+chh2/2);
        idx++;
      }
      if(s.act==='evict'||s.act==='detect'){
        const gx=PAD+idx*(cw+cg)+8;
        ctx.fillStyle=C.offT; ctx.font='600 11.5px "Noto Sans TC", sans-serif'; ctx.textAlign='left'; ctx.textBaseline='middle';
        ctx.fillText('← 已移出 '+s.evict, gx, cy2+chh2/2);
      }
    }

    // ---- BAND 3 · action ----
    const by=212;
    ctx.fillStyle=C.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · while(r-l>k) 收縮;若 nums[r] 已在集合 → true', PAD, by);
    rr(PAD,by+10,w-PAD*2,44,6); ctx.fillStyle=s.dup?C.grn:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=s.dup?C.grnS:C.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='600 12.5px "Noto Sans TC", sans-serif';
    let msg,col=C.text;
    if(s.act==='intro'){ msg='視窗長度永遠 ≤ k+1 → 視窗內任兩個相等值,索引差必 ≤ k'; }
    else if(s.act==='add'){ msg='r 前進、值加入集合;視窗未超長,不用收縮'; col=C.srcT; }
    else if(s.act==='evict'){ msg='視窗超長 → 移出最左值再加入;太遠的重複已被移出'; col=C.offT; }
    else if(s.act==='detect'){ msg='命中!加入的值集合已有 → 兩個相等且距離 ≤ k → 回傳 true'; col=C.grnT; }
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
