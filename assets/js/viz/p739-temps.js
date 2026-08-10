/* ============================================================
   P739 · Daily Temperatures — 單調遞減堆疊(存索引)· viz
   堆疊存「還在等更暖一天」的索引,溫度由底到頂遞減。新的一天 i 若比堆疊頂端那天暖,
   就結算:ans[top] = i - top,pop —— 可連環結算好幾天。之後把 i 壓入,繼續等。
   例 [73,74,71,72,76] → [1,3,1,1,0]。
     BAND 1  溫度(索引在下 · 綠badge=已算出等待天數 · 紅=今天 i)
     BAND 2  堆疊(存索引 · 右=top · 溫度遞減)
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

  const T = [73,74,71,72,76];
  // stack: indices. ans: {idx: days}. cur: today i. resolved: [idx] just filled this step. cmp: string.
  const steps = [
    { cur:-1, stack:[], ans:{}, resolved:[], cmp:'', act:'intro', text:'<strong>INITIAL</strong> · 堆疊存「還在等更暖」的<strong>索引</strong>,溫度由底到頂遞減。新一天更暖就結算頂端:<code>ans = i − top</code>。' },
    { cur:0, stack:[0], ans:{}, resolved:[], cmp:'', act:'push', text:'<strong>i=0 (73)</strong> · 堆疊空 → 壓入索引 0,等更暖的一天。' },
    { cur:1, stack:[1], ans:{0:1}, resolved:[0], cmp:'74 &gt; 73 → ans[0]=1−0=1', act:'pop', text:'<strong>i=1 (74)</strong> · 74 &gt; 頂端 73 → <code>ans[0]=1−0=1</code>,pop 0。壓入 1。' },
    { cur:2, stack:[1,2], ans:{0:1}, resolved:[], cmp:'71 &lt; 74 → 不結算', act:'push', text:'<strong>i=2 (71)</strong> · 71 &lt; 頂端 74 → 沒更暖,直接壓入 2。堆疊溫度仍遞減 [74,71]。' },
    { cur:3, stack:[1,3], ans:{0:1,2:1}, resolved:[2], cmp:'72 &gt; 71 → ans[2]=3−2=1', act:'pop', text:'<strong>i=3 (72)</strong> · 72 &gt; 頂端 71 → <code>ans[2]=3−2=1</code>,pop 2;72 &lt; 74 停。壓入 3。' },
    { cur:4, stack:[4], ans:{0:1,1:3,2:1,3:1}, resolved:[3,1], cmp:'76 &gt; 72,74 → 連環結算', act:'pop', text:'<strong>i=4 (76)</strong> · 76 連環結算:<code>ans[3]=4−3=1</code>、<code>ans[1]=4−1=3</code>,pop 3、1。壓入 4。' },
    { cur:5, stack:[4], ans:{0:1,1:3,2:1,3:1}, resolved:[], cmp:'', act:'done', text:'<strong>完成</strong> · 剩在堆疊的索引沒有更暖的未來 → ans=0。結果 <code>[1,3,1,1,0]</code>。每索引進出一次 → O(n)。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function triD(cx,cy,col){ ctx.beginPath(); ctx.moveTo(cx-6,cy-7); ctx.lineTo(cx+6,cy-7); ctx.lineTo(cx,cy+3); ctx.closePath(); ctx.fillStyle=col; ctx.fill(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,PAD=30; const done=s.act==='done';
    ctx.fillStyle=C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);
    // ── BAND 1 · temperatures ──
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 溫度(索引在下 · 紅=今天 i · 綠 badge=已算出等待天數)', PAD, 18);
    const m=T.length, cw=Math.min(76,(w-2*PAD)/m-14), gp=((w-2*PAD)-m*cw)/(m-1), gy=48, chh=44;
    for(let k=0;k<m;k++){
      const x=PAD+k*(cw+gp);
      const isCur=k===s.cur;
      const inStack=s.stack.includes(k);
      const has=s.ans.hasOwnProperty(k);
      const justR=s.resolved.includes(k);
      let bg=C.cell,bd=C.cellS,tc=C.text;
      if(has){ bg=C.grn; bd=C.grnS; tc=C.grnT; }
      if(inStack && !isCur){ bg=C.src; bd=C.srcS; tc=C.srcT; }
      if(justR){ bg='#eaf3dc'; bd=C.grnS; }
      if(isCur){ bg=C.cur; bd=C.curS; tc=C.curT; }
      rr(x,gy,cw,chh,8); ctx.fillStyle=bg; ctx.fill(); ctx.lineWidth=(isCur||justR)?3:1.7; ctx.strokeStyle=bd; ctx.stroke();
      ctx.fillStyle=tc; ctx.font='700 20px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(T[k]), x+cw/2, gy+chh/2);
      // index below
      ctx.fillStyle=C.dim; ctx.font='600 10px "JetBrains Mono", monospace'; ctx.textBaseline='top'; ctx.fillText('idx '+k, x+cw/2, gy+chh+6);
      // ans badge above
      if(has){ ctx.fillStyle=C.grnT; ctx.font='700 11px "JetBrains Mono", monospace'; ctx.textBaseline='bottom'; ctx.fillText('+'+s.ans[k]+'d', x+cw/2, gy-6); }
    }

    // ── BAND 2 · stack of indices ──
    const b2=140;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 堆疊(存索引 · 右=top · 溫度由底到頂遞減)', PAD, b2);
    const sy=b2+22, scw=64, sgp=14; let sx=PAD+4;
    if(s.stack.length===0){ ctx.fillStyle=C.offT; ctx.font='600 13px "Noto Sans TC", sans-serif'; ctx.textBaseline='middle'; ctx.fillText('(空)', sx, sy+22); }
    for(let k=0;k<s.stack.length;k++){
      const idx=s.stack[k]; const isTop=k===s.stack.length-1;
      rr(sx,sy,scw,44,8); ctx.fillStyle=isTop?'#eef4fb':C.src; ctx.fill(); ctx.lineWidth=isTop?3:1.7; ctx.strokeStyle=C.srcS; ctx.stroke();
      ctx.fillStyle=C.srcT; ctx.font='700 18px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(T[idx]), sx+scw/2, sy+17);
      ctx.fillStyle=C.dim; ctx.font='600 10px "JetBrains Mono", monospace'; ctx.fillText('idx '+idx, sx+scw/2, sy+34);
      if(isTop){ triD(sx+scw/2, sy-3, C.srcT); ctx.fillStyle=C.srcT; ctx.font='700 9px "JetBrains Mono", monospace'; ctx.textBaseline='bottom'; ctx.fillText('top', sx+scw/2, sy-9); }
      sx+=scw+sgp;
    }
    if(s.cmp){ ctx.textAlign='right'; ctx.textBaseline='alphabetic'; ctx.font='700 13px "JetBrains Mono", monospace'; ctx.fillStyle=s.act==='pop'?C.grnT:C.text; ctx.fillText(s.cmp.replace(/<[^>]+>/g,''), w-PAD, b2); }

    // ── BAND 3 ──
    const by=214;
    ctx.fillStyle=C.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 今天更暖就結算頂端 ans=i−top 並 pop(可連環);再壓 i', PAD, by);
    rr(PAD,by+10,w-PAD*2,44,6); ctx.fillStyle=done?C.grn:(s.act==='pop'?C.grn:'#fafaf6'); ctx.fill(); ctx.lineWidth=1.6;
    ctx.strokeStyle=done?C.grnS:(s.act==='pop'?C.grnS:C.grid); ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='600 12.5px "Noto Sans TC", sans-serif';
    let msg,col=C.text;
    if(s.act==='intro'){ msg='堆疊只留「還沒等到更暖」的天,溫度天然遞減'; }
    else if(done){ msg='一趟掃完 · 每個索引最多進出堆疊一次 → O(n) 時間 / O(n) 空間'; col=C.grnT; }
    else if(s.act==='pop'){ msg='更暖 → 距離就是 i−top;連環結算所有被它超過的天'; col=C.grnT; }
    else { msg='沒更暖 → 直接壓入,維持堆疊溫度遞減,繼續等'; col=C.srcT; }
    ctx.fillStyle=col; ctx.fillText(msg, w/2, by+32);
  }

  function update(){ if(stepEl) stepEl.textContent=String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0'); if(labelEl) labelEl.innerHTML=steps[step].text; draw(); }
  function next(){ if(step<steps.length-1){step++;update();}else stop(); }
  function prev(){ if(step>0){step--;update();} }
  function reset(){ stop(); step=0; update(); }
  function play(){ if(timer){stop();return;} bPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){stop();return;} next(); },1750); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} if(bPlay) bPlay.textContent='Play'; }
  bPrev&&bPrev.addEventListener('click',prev); bNext&&bNext.addEventListener('click',next); bPlay&&bPlay.addEventListener('click',play); bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();}); if(window.ResizeObserver){ new ResizeObserver(()=>{fit();draw();}).observe(canvas); }
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw); fit(); update();
})();
