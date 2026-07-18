/* ============================================================
   P41 · First Missing Positive — 陣列即雜湊 · 循環排序 · viz
   答案一定落在 [1, n+1]:n 個數字最多蓋住 1..n,缺的第一個 ≤ n+1。
   技巧:把陣列自己當雜湊表 —— 讓值 v(1≤v≤n)歸位到 index v−1。
   對每個位置,反覆把「不在家、且值在 [1,n]」的元素 swap 到它的家,
   直到手上的值越界或家裡已經是它(避免重複造成無窮迴圈)。
   排完後掃一遍:第一個 nums[i] != i+1 的 i,答案就是 i+1;全對則 n+1。
   nums=[3,4,-1,1] → 排成 [1,-1,3,4] → index1 該是 2 卻是 -1 → 答案 2。
     BAND 1  陣列(紅=正在歸位的值 · 藍=它的家 index v-1 · 綠=已到家 · 灰=越界忽略)
     BAND 2  規則:值 v 的家是 index v-1
     BAND 3  掃描:第一個「該是 i+1 卻不是」的位置
   ============================================================ */
(function () {
  const canvas = document.getElementById('viz-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('viz-step'), labelEl = document.getElementById('viz-label');
  const bPrev = document.getElementById('viz-prev'), bNext = document.getElementById('viz-next'),
        bPlay = document.getElementById('viz-play'), bReset = document.getElementById('viz-reset');

  const COLOR = { paper:'#ffffff', ink:'#1a1a1a', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf',
    cell:'#fafaf6', cellS:'#cfcfcf', src:'#dbe8f6', srcS:'#4478c0', srcT:'#2f5f9e',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424', done:'#d9e8c7', doneS:'#5fa866', doneT:'#3f7a3a',
    off:'#f0f0ec', offS:'#deded8', offT:'#a8a8a0', coral:'#cf3535' };

  const N = 4;
  // 每步的陣列狀態、正在歸位的值(在哪個 index)、它的家 index、說明
  const steps = [
    { arr:[3,4,-1,1], moveIdx:-1, home:-1, phase:'intro',
      text:'<strong>INITIAL</strong> · <code>nums=[3,4,-1,1]</code>,<code>n=4</code>。答案一定在 <code>[1, n+1]</code>。把陣列<strong>自己當雜湊</strong>:讓值 <code>v</code> 歸位到 <strong>index <code>v−1</code></strong>(1→[0]、2→[1]…)。' },
    { arr:[-1,4,3,1], moveIdx:0, home:2, phase:'place', placed:2,
      text:'<strong>放 3</strong> · 3 的家是 <code>index 2</code>。<code>swap(nums[0], nums[2])</code> → <code>3</code> 到家、換回 <code>-1</code>。<code>-1</code> 越界,留著不管。' },
    { arr:[-1,1,3,4], moveIdx:1, home:3, phase:'place', placed:3,
      text:'<strong>放 4</strong> · 4 的家是 <code>index 3</code>。<code>swap(nums[1], nums[3])</code> → <code>4</code> 到家、換回 <code>1</code>(它還沒到家,繼續)。' },
    { arr:[1,-1,3,4], moveIdx:1, home:0, phase:'place', placed:0,
      text:'<strong>放 1</strong> · 剛換來的 <code>1</code> 家在 <code>index 0</code>。<code>swap(nums[1], nums[0])</code> → <code>1</code> 到家、換回 <code>-1</code>(越界,停)。歸位完成。' },
    { arr:[1,-1,3,4], moveIdx:-1, home:-1, phase:'scan', scan:1, done:true,
      text:'<strong>掃描</strong> · 找第一個 <code>nums[i] != i+1</code>。<code>index 0</code>:1=1 ✓;<code>index 1</code>:該是 <strong>2</strong> 卻是 <code>-1</code> ✗ → <strong>答案 = 2</strong>。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function tri(cx,cy,dir,sz,col){ ctx.beginPath(); if(dir==='down'){ctx.moveTo(cx-sz,cy-sz);ctx.lineTo(cx+sz,cy-sz);ctx.lineTo(cx,cy+sz);}else{ctx.moveTo(cx-sz,cy+sz);ctx.lineTo(cx+sz,cy+sz);ctx.lineTo(cx,cy-sz);} ctx.closePath(); ctx.fillStyle=col; ctx.fill(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,h=canvas.clientHeight,PAD=26;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,h);
    const done=!!s.done;

    // ── BAND 1 · array ──
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · nums(紅=歸位的值 · 藍=它的家 · 綠=已到家 nums[i]=i+1 · 灰=越界)', PAD, 24);

    const cell=Math.min(72,(w-2*PAD)/(N+1)), gx=(w-N*cell)/2, gy=60, chh=46;
    for(let k=0;k<N;k++){
      const x=gx+k*cell, v=s.arr[k];
      const atHome=(v===k+1);
      const outRange=(v<1 || v>N);
      const isMove=(k===s.moveIdx);
      const isHome=(k===s.home);
      const isScanHit=(s.phase==='scan' && k===s.scan);
      ctx.fillStyle=COLOR.dim; ctx.font='700 10px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('['+k+']', x+cell/2, gy-11);
      rr(x+4,gy,cell-8,chh,7);
      let bg=COLOR.cell,bd=COLOR.cellS,tc=COLOR.text;
      if(atHome){ bg=COLOR.done; bd=COLOR.doneS; tc=COLOR.doneT; }
      else if(outRange){ bg=COLOR.off; bd=COLOR.offS; tc=COLOR.offT; }
      if(isHome && !done){ bg=COLOR.src; bd=COLOR.srcS; tc=COLOR.srcT; }
      if(isMove && !done){ bg=COLOR.cur; bd=COLOR.curS; tc=COLOR.curT; }
      if(isScanHit){ bg=COLOR.cur; bd=COLOR.curS; tc=COLOR.curT; }
      ctx.fillStyle=bg; ctx.fill(); ctx.lineWidth=(isMove||isHome||isScanHit)?3:1.7; ctx.strokeStyle=bd; ctx.stroke();
      ctx.fillStyle=tc; ctx.font='700 19px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(v), x+cell/2, gy+chh/2);
      // 「該是 i+1」小字
      ctx.fillStyle=atHome?COLOR.doneT:COLOR.dim; ctx.font='600 9.5px "JetBrains Mono", monospace';
      ctx.fillText('want '+(k+1), x+cell/2, gy+chh+12);
    }
    // swap arrow between moveIdx and home
    if(s.phase==='place' && s.moveIdx>=0 && s.home>=0 && !done){
      const x1=gx+s.moveIdx*cell+cell/2, x2=gx+s.home*cell+cell/2, ay=gy+chh+26;
      ctx.strokeStyle=COLOR.curS; ctx.lineWidth=1.8; ctx.setLineDash([4,3]);
      ctx.beginPath(); ctx.moveTo(x1,ay); ctx.lineTo(x2,ay); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=COLOR.curT; ctx.font='700 10px "Noto Sans TC", sans-serif'; ctx.textAlign='center'; ctx.textBaseline='top';
      ctx.fillText('swap 到家', (x1+x2)/2, ay+3);
    }

    // ── BAND 2 · rule ──
    const by=150;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 規則:值 v 的家 = index v−1', PAD, by);
    rr(PAD,by+10,w-PAD*2,42,6); ctx.fillStyle='#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(s.phase==='intro'){ ctx.fillStyle=COLOR.text; ctx.font='600 12.5px "Noto Sans TC", sans-serif'; ctx.fillText('只搬 1..n 的值;越界(≤0 或 >n)的直接忽略,不佔家', w/2, by+31); }
    else if(s.phase==='scan'){ ctx.fillStyle=COLOR.text; ctx.font='600 12.5px "Noto Sans TC", sans-serif'; ctx.fillText('排完後,每個「到家」的格子都滿足 nums[i] = i+1', w/2, by+31); }
    else { ctx.fillStyle=COLOR.text; ctx.font='700 13px "JetBrains Mono", monospace'; ctx.fillText('值 '+(s.home+1)+' → 家 index '+s.home+'(while: 在範圍且沒到家就 swap)', w/2, by+31); }

    // ── BAND 3 · scan / answer ──
    const ty=216;
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 掃描:第一個 nums[i] != i+1 → 答案 i+1', PAD, ty);
    rr(PAD,ty+10,w-PAD*2,42,6); ctx.fillStyle=done?COLOR.done:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?COLOR.doneS:COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(done){ ctx.fillStyle=COLOR.doneT; ctx.font='700 13px "JetBrains Mono", monospace'; ctx.fillText('index 1 該是 2 卻是 -1 → return 2', w/2, ty+31); }
    else { ctx.fillStyle=COLOR.text; ctx.font='600 12.5px "Noto Sans TC", sans-serif'; ctx.fillText('若全部 nums[i]=i+1(1..n 都在)→ 答案是 n+1', w/2, ty+31); }
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
