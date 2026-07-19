/* ============================================================
   P26 · Remove Duplicates from Sorted Array — 快慢指針 · 寫入指針 · viz
   已排序 → 重複值相鄰。慢指針 i = 下一個唯一值要寫的位置(也是目前唯一數量);
   快指針 scan 逐一讀。若 nums[scan] 和「上一個寫入的 nums[i-1]」相同 → 跳過;
   不同 → nums[i] = nums[scan],i++。掃完回傳 i(= 唯一元素個數 k)。
   前 i 個就是去重後的答案;i 之後的可忽略。O(n) 原地。
   例 [0,0,1,1,2] → 前 3 個 [0,1,2],k=3。
     BAND 1  陣列(綠=已保留的唯一前段 · 紅=scan · i=寫入位)
     BAND 2  本步:重複→跳過 / 新值→寫到 i、i++
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

  // arr state, i (write ptr / 唯一數), scan (current), act, done
  const steps = [
    { arr:[0,0,1,1,2], i:0, scan:-1, phase:'intro', text:'<strong>INITIAL</strong> · <code>[0,0,1,1,2]</code> 已排序 → 重複相鄰。慢指針 <code>i</code> = 下一個唯一值要寫的位置(=目前唯一數);快指針 <code>scan</code> 逐一讀。' },
    { arr:[0,0,1,1,2], i:1, scan:0, act:'write', text:'<strong>scan=0</strong> · <code>num=0</code>,i=0(第一個)→ 寫 <code>nums[0]=0</code>,<code>i=1</code>。保留 <code>[0]</code>。' },
    { arr:[0,0,1,1,2], i:1, scan:1, act:'skip', text:'<strong>scan=1</strong> · <code>num=0 == nums[i-1]=nums[0]=0</code> → <strong>重複,跳過</strong>(i 不動)。' },
    { arr:[0,1,1,1,2], i:2, scan:2, act:'write', text:'<strong>scan=2</strong> · <code>num=1 != nums[0]=0</code> → 新值,寫 <code>nums[1]=1</code>,<code>i=2</code>。保留 <code>[0,1]</code>。' },
    { arr:[0,1,1,1,2], i:2, scan:3, act:'skip', text:'<strong>scan=3</strong> · <code>num=1 == nums[i-1]=nums[1]=1</code> → <strong>重複,跳過</strong>。' },
    { arr:[0,1,2,1,2], i:3, scan:4, act:'write', done:true, text:'<strong>scan=4</strong> · <code>num=2 != nums[1]=1</code> → 寫 <code>nums[2]=2</code>,<code>i=3</code>。掃完 → 回傳 <code>k=3</code>,前 3 個 <code>[0,1,2]</code>,其餘忽略。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function tri(cx,cy,col){ ctx.beginPath(); ctx.moveTo(cx-6,cy+7); ctx.lineTo(cx+6,cy+7); ctx.lineTo(cx,cy-3); ctx.closePath(); ctx.fillStyle=col; ctx.fill(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,PAD=30;
    ctx.fillStyle=C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · nums(綠=保留的唯一前段 [0,i) · 紅=scan · 灰=忽略)', PAD, 20);
    const n=s.arr.length, cell=Math.min(72,(w-2*PAD)/n-10), gp=((w-2*PAD)-n*cell)/(n-1), gy=58, chh=52;
    for(let k=0;k<n;k++){
      const x=PAD+k*(cell+gp);
      const kept = k<s.i;                       // 已保留的唯一前段
      const isScan = k===s.scan && !s.done;
      const ignored = s.done && k>=s.i;         // 完成後 i 之後的忽略
      const isWriteTarget = s.act==='write' && k===s.i-1 && !s.done && step>0; // 剛寫入的格
      rr(x,gy,cell,chh,8);
      let bg=C.cell,bd=C.cellS,tc=C.text;
      if(kept){ bg=C.grn; bd=C.grnS; tc=C.grnT; }
      if(ignored){ bg=C.off; bd=C.offS; tc=C.offT; }
      if(isScan){ bg=C.cur; bd=C.curS; tc=C.curT; }
      ctx.fillStyle=bg; ctx.fill(); ctx.lineWidth=(isScan||isWriteTarget)?3:1.7; ctx.strokeStyle=isWriteTarget?C.grnS:bd; ctx.stroke();
      ctx.fillStyle=tc; ctx.font='700 22px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(s.arr[k]), x+cell/2, gy+chh/2);
      ctx.fillStyle=C.dim; ctx.font='600 10px "JetBrains Mono", monospace'; ctx.textBaseline='top';
      ctx.fillText(String(k), x+cell/2, gy+chh+6);
    }
    // pointers: i (write, below) and scan (above)
    if(!s.done){
      if(s.i<=n){ const ix=PAD+Math.min(s.i,n-1)*(cell+gp)+cell/2 + (s.i>=n?cell:0); tri(PAD+(s.i<n?s.i:n-1)*(cell+gp)+cell/2, gy+chh+2, C.grnS); ctx.fillStyle=C.grnT; ctx.font='700 10px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='top'; ctx.fillText('i(寫)', PAD+(s.i<n?s.i:n-1)*(cell+gp)+cell/2, gy+chh+16); }
      if(s.scan>=0){ const sx=PAD+s.scan*(cell+gp)+cell/2; tri(sx, gy-8, C.curS); ctx.fillStyle=C.curT; ctx.font='700 10px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='bottom'; ctx.fillText('scan', sx, gy-10); }
    }
    // write arrow scan → i
    if(s.act==='write' && !s.done && step>0){
      const sx=PAD+s.scan*(cell+gp)+cell/2, ix=PAD+(s.i-1)*(cell+gp)+cell/2;
      if(sx!==ix){ ctx.strokeStyle=C.grnS; ctx.lineWidth=1.8; ctx.setLineDash([4,3]); ctx.beginPath(); ctx.moveTo(sx,gy+chh/2); ctx.lineTo(ix,gy+chh/2); ctx.stroke(); ctx.setLineDash([]); }
    }
    // BAND 2
    const by=148;
    ctx.fillStyle=C.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · num==nums[i-1] 跳過;否則 nums[i++]=num', PAD, by);
    rr(PAD,by+10,w-PAD*2,44,6); ctx.fillStyle=s.done?C.grn:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=s.done?C.grnS:C.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='600 12.5px "Noto Sans TC", sans-serif';
    let msg,col=C.text;
    if(s.done){ msg='完成 · k=3,前 k 個 [0,1,2] 就是去重結果 · O(n) 原地'; col=C.grnT; }
    else if(s.phase==='intro'){ msg='慢(i)只在遇到新值時前進,快(scan)每步都走'; }
    else if(s.act==='write'){ msg='新值 → 寫到 nums['+(s.i-1)+'],唯一數 i 前進到 '+s.i; col=C.grnT; }
    else { msg='和上一個唯一值相同 → 跳過,不寫、i 不動'; col=C.offT; }
    ctx.fillStyle=col; ctx.fillText(msg, w/2, by+32);
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
