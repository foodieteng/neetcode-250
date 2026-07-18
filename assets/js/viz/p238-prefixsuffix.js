/* ============================================================
   P238 · Product of Array Except Self — 前綴積 × 後綴積 · viz
   ans[i] = (i 左邊全部相乘) × (i 右邊全部相乘) —— 不含 nums[i] 自己,不用除法。
   兩趟掃、輸出陣列自己當暫存(O(1) 額外空間):
     Pass 1 由左往右:ans[i] = prefix(目前左邊乘積);再 prefix *= nums[i]。
     Pass 2 由右往左:ans[i] *= suffix(目前右邊乘積);再 suffix *= nums[i]。
   先寫入再更新累積,所以 prefix/suffix 都「不含自己」。
   例 [1,2,3,4]:Pass1 後 ans=[1,1,2,6];Pass2 後 ans=[24,12,8,6]。
     BAND 1  nums(參考)
     BAND 2  ans(演進中 · 紅=當前寫入)
     BAND 3  累積器 prefix/suffix + 本步運算(→ 左掃 / ← 右掃)
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
    grn:'#d9e8c7', grnS:'#5fa866', grnT:'#3f7a3a',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424', done:'#d9e8c7', doneS:'#5fa866', doneT:'#3f7a3a',
    off:'#f2f2ee', offS:'#dcdcd6', offT:'#b4b4ac', coral:'#cf3535' };

  const NUMS = [1,2,3,4];
  const N = NUMS.length;
  // 模擬兩趟,記錄每步狀態
  const steps=[];
  steps.push({ phase:'intro', ans:[1,1,1,1], i:-1,
    text:'<strong>INITIAL</strong> · <code>ans[i] = (左邊全部積) × (右邊全部積)</code>,不含自己、不用除法。輸出陣列自己當暫存 → O(1) 額外空間。' });
  let ans=[1,1,1,1];
  // Pass 1
  let prefix=1;
  for(let i=0;i<N;i++){
    const mult=prefix; ans=ans.slice(); ans[i]*=prefix; prefix*=NUMS[i];
    steps.push({ phase:'pre', i, mult, ans:ans.slice(), acc:prefix, dir:'→',
      text:'<strong>Pass 1 · i='+i+'</strong> · <code>ans['+i+'] = prefix = '+mult+'</code>(左邊乘積,不含自己)。再 <code>prefix *= nums['+i+']('+NUMS[i]+') = '+prefix+'</code>。' });
  }
  // 標記 pass1 完成
  steps[steps.length-1].pass1done=true;
  // Pass 2
  let suffix=1;
  for(let i=N-1;i>=0;i--){
    const mult=suffix; ans=ans.slice(); ans[i]*=suffix; suffix*=NUMS[i];
    steps.push({ phase:'suf', i, mult, ans:ans.slice(), acc:suffix, dir:'←', done:(i===0),
      text:'<strong>Pass 2 · i='+i+'</strong> · <code>ans['+i+'] *= suffix = '+mult+'</code> → <strong>'+ans[i]+'</strong>(乘上右邊乘積)。再 <code>suffix *= nums['+i+']('+NUMS[i]+') = '+suffix+'</code>。'+(i===0?' 完成 → <strong>[24,12,8,6]</strong>。':'') });
  }

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function cells(arr, gy, curI, curColor, label){
    const w=canvas.clientWidth,PAD=30;
    const cell=Math.min(78,(w-2*PAD)/N-8), gap=((w-2*PAD)-N*cell)/(N-1), gx=PAD;
    ctx.fillStyle=COLOR.dim; ctx.font='700 11px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText(label, PAD, gy-8);
    for(let k=0;k<N;k++){
      const x=gx+k*(cell+gap), isCur=(k===curI);
      ctx.fillStyle=COLOR.dim; ctx.font='700 10px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      rr(x,gy,cell,38,6);
      let bg=COLOR.cell,bd=COLOR.cellS,tc=COLOR.text;
      if(isCur){ bg=curColor.bg; bd=curColor.bd; tc=curColor.tc; }
      ctx.fillStyle=bg; ctx.fill(); ctx.lineWidth=isCur?3:1.6; ctx.strokeStyle=bd; ctx.stroke();
      ctx.fillStyle=tc; ctx.font='700 16px "JetBrains Mono", monospace';
      ctx.fillText(String(arr[k]), x+cell/2, gy+19);
      ctx.fillStyle=COLOR.dim; ctx.font='600 9px "JetBrains Mono", monospace'; ctx.textBaseline='top';
      ctx.fillText('['+k+']', x+cell/2, gy+41);
    }
  }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,PAD=30;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,canvas.clientHeight);
    const pre=s.phase==='pre', suf=s.phase==='suf', done=!!s.done;

    // ── BAND 1 · nums ──
    cells(NUMS, 40, s.i, {bg:COLOR.src,bd:COLOR.srcS,tc:COLOR.srcT}, 'BAND 1 · nums(參考)');

    // ── BAND 2 · ans ──
    const curColor = suf ? {bg:COLOR.cur,bd:COLOR.curS,tc:COLOR.curT} : {bg:COLOR.grn,bd:COLOR.grnS,tc:COLOR.grnT};
    cells(s.ans, 120, s.phase==='intro'?-1:s.i, curColor, 'BAND 2 · ans(演進中 · '+(pre?'綠=Pass1 寫入左積':suf?'紅=Pass2 乘上右積':'初值全 1')+')');

    // ── BAND 3 · accumulator + op ──
    const by=182;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 累積器(先寫入 ans,再乘進累積 → 不含自己)', PAD, by);
    rr(PAD,by+10,w-PAD*2,46,6); ctx.fillStyle='#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(s.phase==='intro'){ ctx.fillStyle=COLOR.text; ctx.font='600 12.5px "Noto Sans TC", sans-serif';
      ctx.fillText('Pass 1 由左往右填左積,Pass 2 由右往左乘右積', w/2, by+33); }
    else if(pre){ ctx.font='700 13.5px "JetBrains Mono", monospace'; ctx.fillStyle=COLOR.grnT;
      ctx.fillText('→ ans['+s.i+'] = prefix('+s.mult+')   然後 prefix *= '+NUMS[s.i]+' = '+s.acc, w/2, by+33); }
    else { ctx.font='700 13.5px "JetBrains Mono", monospace'; ctx.fillStyle=COLOR.curT;
      ctx.fillText('← ans['+s.i+'] *= suffix('+s.mult+') = '+s.ans[s.i]+'   然後 suffix *= '+NUMS[s.i]+' = '+s.acc, w/2, by+33); }

    // pass marker
    const ty=248;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(s.phase==='intro'){ ctx.fillStyle=COLOR.dim; ctx.font='600 12px "Noto Sans TC", sans-serif';
      ctx.fillText('輸出陣列不算額外空間 → 只用兩個純量 prefix/suffix,達成 O(1)', w/2, ty); }
    else if(done){ ctx.fillStyle=COLOR.doneT; ctx.font='700 13px "JetBrains Mono", monospace';
      ctx.fillText('ans = [24, 12, 8, 6]  ← 每格 = 左積 × 右積', w/2, ty); }
    else if(s.pass1done){ ctx.fillStyle=COLOR.grnT; ctx.font='700 12.5px "Noto Sans TC", sans-serif';
      ctx.fillText('Pass 1 完成:ans = [1,1,2,6](每格 = 它左邊的乘積)→ 接著往回乘右積', w/2, ty); }
    else { ctx.fillStyle=pre?COLOR.grnT:COLOR.curT; ctx.font='700 12px "JetBrains Mono", monospace';
      ctx.fillText(pre?'Pass 1 →→→ 累積左積':'Pass 2 ←←← 累積右積', w/2, ty); }
  }

  function update(){ const s=steps[step]; if(stepEl) stepEl.textContent=String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0'); if(labelEl) labelEl.innerHTML=s.text; draw(); }
  function next(){ if(step<steps.length-1){step++;update();}else stop(); }
  function prev(){ if(step>0){step--;update();} }
  function reset(){ stop(); step=0; update(); }
  function play(){ if(timer){stop();return;} bPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){stop();return;} next(); },1600); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} if(bPlay) bPlay.textContent='Play'; }
  bPrev&&bPrev.addEventListener('click',prev); bNext&&bNext.addEventListener('click',next); bPlay&&bPlay.addEventListener('click',play); bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();}); if(window.ResizeObserver){ new ResizeObserver(()=>{fit();draw();}).observe(canvas); }
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw); fit(); update();
})();
