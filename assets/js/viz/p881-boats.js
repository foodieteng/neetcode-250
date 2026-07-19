/* ============================================================
   P881 · Boats to Save People — 對撞雙指針貪心 · viz
   排序後,最輕(l)配最重(r):若兩人合重 ≤ limit → 一船載兩人(l++,r--);
   否則最重的人單獨一船(r--)。每次迴圈用掉一船。貪心最優:最重的人一定要上船,
   給他配「還在的最輕者」最省;連最輕都配不下就只能自己一船。
   例 people=[1,2,2,3], limit=3 → 3 船:{3}、{1,2}、{2}。
     BAND 1  排序後 people(藍=l 最輕 · 紅=r 最重 · 綠=本船 · 灰=已上船)
     BAND 2  people[l] + people[r] 與 limit
     BAND 3  已開船數 + 每船組合
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

  const P = [1,2,2,3], LIM = 3;
  // l, r, boat(indices this boat), done(prev assigned), boats(list str), act, text
  const steps = [
    { l:0, r:3, boat:[], done:[], boats:[], act:'intro', text:'<strong>INITIAL</strong> · 排序後 <code>[1,2,2,3]</code>, limit=3。最輕(l)配最重(r):合得下兩人一船,合不下最重者單獨。' },
    { l:0, r:3, boat:[3], done:[], boats:['3'], act:'alone', text:'<strong>l=0(1), r=3(3)</strong> · <code>1+3=4 &gt; 3</code> → 配不下 → 最重的 <code>3</code> <strong>單獨一船</strong>。r--。船數 1。' },
    { l:0, r:2, boat:[0,2], done:[3], boats:['3','1+2'], act:'pair', text:'<strong>l=0(1), r=2(2)</strong> · <code>1+2=3 ≤ 3</code> → <strong>兩人一船</strong>(1 和 2)。l++、r--。船數 2。' },
    { l:1, r:1, boat:[1], done:[0,2,3], boats:['3','1+2','2'], act:'done', text:'<strong>l=1, r=1</strong> · 只剩最後一人 <code>2</code> → <strong>單獨一船</strong>。<code>l &gt; r</code> 結束 → 回傳 <strong>3 船</strong>。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function triD(cx,cy,col){ ctx.beginPath(); ctx.moveTo(cx-6,cy-7); ctx.lineTo(cx+6,cy-7); ctx.lineTo(cx,cy+3); ctx.closePath(); ctx.fillStyle=col; ctx.fill(); }
  function triU(cx,cy,col){ ctx.beginPath(); ctx.moveTo(cx-6,cy+7); ctx.lineTo(cx+6,cy+7); ctx.lineTo(cx,cy-3); ctx.closePath(); ctx.fillStyle=col; ctx.fill(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,PAD=30; const done=s.act==='done';
    ctx.fillStyle=C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 排序後 people(藍=l 最輕 · 紅=r 最重 · 綠=本船 · 灰=已上船)', PAD, 18);
    const n=P.length, cell=Math.min(76,(w-2*PAD)/n-14), gp=((w-2*PAD)-n*cell)/(n-1), gy=52, chh=46;
    for(let k=0;k<n;k++){
      const x=PAD+k*(cell+gp);
      const isDone = s.done.includes(k);
      const isBoat = s.boat.includes(k);
      const isL = k===s.l && !done && s.act!=='intro' ? false : (k===s.l);
      const isR = k===s.r;
      rr(x,gy,cell,chh,8);
      let bg=C.src,bd=C.srcS,tc=C.srcT;                 // remaining candidates default light blue
      if(isDone){ bg=C.off; bd=C.offS; tc=C.offT; }
      if(isBoat){ bg=C.grn; bd=C.grnS; tc=C.grnT; }
      ctx.fillStyle=bg; ctx.fill();
      const active = k===s.l || k===s.r;
      ctx.lineWidth=(isBoat||active)?3:1.7;
      ctx.strokeStyle=isBoat?C.grnS:(k===s.r&&!isDone?C.curS:(k===s.l&&!isDone?C.srcS:bd));
      ctx.stroke();
      ctx.fillStyle=tc; ctx.font='700 22px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(P[k]), x+cell/2, gy+chh/2);
      ctx.fillStyle=C.dim; ctx.font='600 10px "JetBrains Mono", monospace'; ctx.textBaseline='top';
      ctx.fillText(String(k), x+cell/2, gy+chh+6);
    }
    if(!done){
      const lx=PAD+s.l*(cell+gp)+cell/2, rx=PAD+s.r*(cell+gp)+cell/2;
      triU(lx, gy+chh+16, C.srcS); ctx.fillStyle=C.srcT; ctx.font='700 10px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='top'; ctx.fillText('l 輕', lx, gy+chh+22);
      if(s.r!==s.l){ triD(rx, gy-4, C.curS); ctx.fillStyle=C.curT; ctx.textBaseline='bottom'; ctx.fillText('r 重', rx, gy-10); }
    }

    // ---- BAND 2 ----
    const b2=142;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · people[l] + people[r] 與 limit 比', PAD, b2);
    rr(PAD,b2+10,w-PAD*2,40,6); ctx.fillStyle=s.act==='pair'?C.grn:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=s.act==='pair'?C.grnS:C.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='700 15px "JetBrains Mono", monospace'; ctx.fillStyle=C.text;
    if(s.act==='intro'){ ctx.fillText('limit = 3 · 對撞開始', w/2, b2+30); }
    else { const sum=P[s.l]+P[s.r]; ctx.fillText(P[s.l]+' + '+P[s.r]+' = '+sum+'  '+(sum<=LIM?'≤':'>')+'  '+LIM+'  → '+(sum<=LIM?'兩人一船':'最重單獨'), w/2, b2+30); }

    // ---- BAND 3 · boats ----
    const by=204;
    ctx.fillStyle=C.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · sum≤limit 兩人一船(l++,r--);否則最重單獨(r--)', PAD, by);
    rr(PAD,by+10,w-PAD*2,44,6); ctx.fillStyle=done?C.grn:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?C.grnS:C.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='600 12.5px "Noto Sans TC", sans-serif';
    let msg,col=C.text;
    if(s.act==='intro'){ msg='最重者必上船 → 配還在的最輕者最省(配不下才自己一船)'; }
    else if(done){ msg='完成 · 共 3 船 · 排序 O(n log n) + 對撞 O(n)'; col=C.grnT; }
    else if(s.act==='pair'){ msg='合得下 → 最輕 + 最重 同船,兩人都上'; col=C.grnT; }
    else { msg='合不下 → 最重的人單獨一船,換下一個最重'; col=C.curT; }
    ctx.fillStyle=col; ctx.fillText(msg, w/2, by+32);
    // boats count / list top-right
    ctx.textAlign='right'; ctx.textBaseline='alphabetic'; ctx.font='600 11px "JetBrains Mono", monospace'; ctx.fillStyle=C.grnT;
    const list = s.boats.map(b=>'{'+b+'}').join(' ');
    ctx.fillText('船('+s.boats.length+'):'+(list||'—'), w-PAD, 18);
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
