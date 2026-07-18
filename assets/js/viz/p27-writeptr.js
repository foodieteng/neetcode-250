/* ============================================================
   P27 · Remove Element — 慢/快指標(寫指標)· viz
   兩個指標:快指標(讀)逐一看每個元素;慢指標 i(寫)指向「下一個要放的位置」。
   讀到的值 != val → 把它寫到 nums[i],i++;== val → 跳過(i 不動)。
   最後 [0, i) 就是所有「非 val」的元素,回傳 i = k。
   nums=[0,1,3,0,2], val=0 → 保留 1,3,2 → k=3。
     BAND 1  陣列(紅箭頭=讀指標 · 藍箭頭=寫指標 i · 綠=已保留區 [0,i))
     BAND 2  本步:num==val 跳過 / 否則寫入並前進
     BAND 3  結果:前 k 個是答案,其餘不管
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
    skip:'#f0d4d4', skipS:'#c1440e', skipT:'#8f3208', coral:'#cf3535' };

  const VAL = 0;
  // 每步的陣列快照、讀指標 read、寫指標 i、本步動作
  const steps = [
    { arr:[0,1,3,0,2], read:-1, i:0, act:'intro',
      text:'<strong>INITIAL</strong> · <code>nums=[0,1,3,0,2]</code>,<code>val=0</code>。<strong>寫指標 <code>i</code></strong> 指「下一個要放的位置」(從 0 開始);<strong>讀指標</strong>逐一掃每個元素。目標:把非 0 的元素堆到最前面。' },
    { arr:[0,1,3,0,2], read:0, i:0, act:'skip',
      text:'<strong>讀 nums[0]=0</strong> · <code>== val</code> → <strong>跳過</strong>,寫指標 <code>i</code> 不動(還是 0)。' },
    { arr:[1,1,3,0,2], read:1, i:1, act:'keep', wrote:0,
      text:'<strong>讀 nums[1]=1</strong> · <code>!= val</code> → 寫到 <code>nums[i=0]=1</code>,<code>i</code> 前進到 1。<strong>寫指標開始落後讀指標</strong>(中間隔著被跳過的 0)。' },
    { arr:[1,3,3,0,2], read:2, i:2, act:'keep', wrote:1,
      text:'<strong>讀 nums[2]=3</strong> · <code>!= val</code> → 寫到 <code>nums[i=1]=3</code>,<code>i</code>→2。' },
    { arr:[1,3,3,0,2], read:3, i:2, act:'skip',
      text:'<strong>讀 nums[3]=0</strong> · <code>== val</code> → 跳過,<code>i</code> 不動(2)。缺口再拉大一格。' },
    { arr:[1,3,2,0,2], read:4, i:3, act:'keep', wrote:2, done:true,
      text:'<strong>讀 nums[4]=2</strong> · <code>!= val</code> → 寫到 <code>nums[i=2]=2</code>,<code>i</code>→3。掃完了。<strong>回傳 k = i = 3</strong>,前 3 個 <code>[1,3,2]</code> 就是答案。' },
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
    const done=!!s.done, N=s.arr.length;

    // ── BAND 1 · array with two pointers ──
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 紅↓=讀指標 · 藍↑=寫指標 i · 綠=已保留 [0, i)   val = '+VAL, PAD, 24);

    const cell=Math.min(70,(w-2*PAD)/(N+0.5)), gx=(w-N*cell)/2, gy=64, chh=44;
    for(let k=0;k<N;k++){
      const x=gx+k*cell;
      const kept=(k<s.i);                     // 已保留區
      const isWrote=(s.wrote===k);            // 本步寫入的格子
      const isRead=(k===s.read);              // 讀指標所在
      const tail=(k>=s.i && (done || k>s.read)); // 尚未處理 / 不管的尾巴
      ctx.fillStyle=COLOR.dim; ctx.font='700 10px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('['+k+']', x+cell/2, gy-11);
      rr(x+4,gy,cell-8,chh,7);
      let bg=COLOR.cell,bd=COLOR.cellS,tc=COLOR.text;
      if(kept){ bg=COLOR.done; bd=COLOR.doneS; tc=COLOR.doneT; }
      if(isWrote){ bg=COLOR.cur; bd=COLOR.curS; tc=COLOR.curT; }
      ctx.fillStyle=bg; ctx.fill(); ctx.lineWidth=(isWrote)?3:1.7; ctx.strokeStyle=bd; ctx.stroke();
      ctx.fillStyle=tc; ctx.font='700 18px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(s.arr[k]), x+cell/2, gy+chh/2);
    }
    // read pointer (coral, above)
    if(s.read>=0){ const rx=gx+s.read*cell+cell/2; tri(rx, gy-20, 'down', 6, COLOR.curS);
      ctx.fillStyle=COLOR.curT; ctx.font='700 9px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='bottom'; ctx.fillText('read', rx, gy-24); }
    // write pointer i (blue, below) — points at next write slot (may be == N)
    const ix=gx+Math.min(s.i,N)*cell + (s.i>=N? -cell/2 : cell/2);
    const iy=gy+chh+10;
    tri(gx+s.i*cell+cell/2, iy+6, 'up', 6, COLOR.srcS);
    ctx.fillStyle=COLOR.srcT; ctx.font='700 9px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='top'; ctx.fillText('i='+s.i, gx+s.i*cell+cell/2, iy+14);

    // ── BAND 2 · action ──
    const by=150;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · num == val 跳過 / 否則 nums[i++] = num', PAD, by);
    rr(PAD,by+10,w-PAD*2,42,6);
    const skip=(s.act==='skip');
    ctx.fillStyle=skip?COLOR.skip:(s.act==='keep'?COLOR.done:'#fafaf6'); ctx.fill();
    ctx.lineWidth=1.6; ctx.strokeStyle=skip?COLOR.skipS:(s.act==='keep'?COLOR.doneS:COLOR.grid); ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(s.act==='intro'){ ctx.fillStyle=COLOR.text; ctx.font='600 12.5px "Noto Sans TC", sans-serif'; ctx.fillText('讀指標一直往前;寫指標只在「保留」時才前進 → 兩者拉開缺口', w/2, by+31); }
    else if(skip){ ctx.fillStyle=COLOR.skipT; ctx.font='700 13px "JetBrains Mono", monospace'; ctx.fillText('nums['+s.read+']='+s.arr[s.read]+' == val → 跳過(i 不動)', w/2, by+31); }
    else { ctx.fillStyle=COLOR.doneT; ctx.font='700 13px "JetBrains Mono", monospace'; ctx.fillText('nums['+s.read+'] != val → nums['+s.wrote+'] = '+s.arr[s.wrote]+',i → '+s.i, w/2, by+31); }

    // ── BAND 3 · result ──
    const ty=216;
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 前 k 個是答案,其餘不管', PAD, ty);
    rr(PAD,ty+10,w-PAD*2,42,6); ctx.fillStyle=done?COLOR.done:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?COLOR.doneS:COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(done){ ctx.fillStyle=COLOR.doneT; ctx.font='700 13px "JetBrains Mono", monospace'; ctx.fillText('return k = 3 · nums 前 3 個 = [1, 3, 2](順序保留)', w/2, ty+31); }
    else { ctx.fillStyle=COLOR.text; ctx.font='600 12.5px "Noto Sans TC", sans-serif'; ctx.fillText('題目只要求「前 k 個是非 val 元素」,i 之後的值是垃圾、不用清', w/2, ty+31); }
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
