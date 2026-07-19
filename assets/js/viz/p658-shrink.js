/* ============================================================
   P658 · Find K Closest Elements — 兩端收縮視窗 · viz
   arr 已排序 → k 個最近的元素必為「連續的一段」。從整個陣列 [l,r] 出發,
   每步比較兩端到 x 的距離,砍掉「較遠」的那一端,直到視窗剩 k 個。
   距離相等時砍右端(保留較小者 —— 符合 |a-x|==|b-x| 取 a<b 的規則)。
   例 arr=[1,2,3,4,5,6], k=3, x=4 → [3,4,5]。
     BAND 1  arr(綠=視窗[l,r] · 紅=本步砍掉的端 · 灰=已砍 · 下方=到 x 距離)
     BAND 2  |arr[l]-x| vs |arr[r]-x| → 砍較遠端
     BAND 3  收縮到 size==k
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

  const A = [1,2,3,4,5,6], X = 4, K = 3;
  const dist = (v)=>Math.abs(v - X);
  // l, r, remove('l'|'r'|null), tie(bool), done, text
  const steps = [
    { l:0, r:5, remove:null, act:'intro', text:'<strong>INITIAL</strong> · <code>arr=[1,2,3,4,5,6]</code>, k=3, x=4。已排序 → k 個最近的必<strong>連續</strong>。從整段開始,每步砍掉離 x 較遠的一端。' },
    { l:0, r:5, remove:'l', act:'cut', text:'<strong>[0,5] size 6&gt;3</strong> · <code>|1-4|=3</code> vs <code>|6-4|=2</code> → 左端較遠 → <strong>砍左(l++)</strong>,丟掉 <code>1</code>。' },
    { l:1, r:5, remove:'r', tie:true, act:'cut', text:'<strong>[1,5] size 5&gt;3</strong> · <code>|2-4|=2</code> vs <code>|6-4|=2</code> → <strong>距離相等 → 砍右</strong>(保留較小者),丟掉 <code>6</code>。' },
    { l:1, r:4, remove:'l', act:'cut', text:'<strong>[1,4] size 4&gt;3</strong> · <code>|2-4|=2</code> vs <code>|5-4|=1</code> → 左端較遠 → <strong>砍左</strong>,丟掉 <code>2</code>。' },
    { l:2, r:4, remove:null, done:true, act:'done', text:'<strong>[2,4] size 3 == k</strong> → 停!回傳 <code>[3,4,5]</code>(x=4 最近的 3 個)。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function triD(cx,cy,col){ ctx.beginPath(); ctx.moveTo(cx-6,cy-7); ctx.lineTo(cx+6,cy-7); ctx.lineTo(cx,cy+3); ctx.closePath(); ctx.fillStyle=col; ctx.fill(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,PAD=30;
    ctx.fillStyle=C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);
    const done=s.done;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · arr(綠=視窗[l,r] · 紅=本步砍掉 · 灰=已砍 · 下=到 x 距離)', PAD, 18);
    const n=A.length, cell=Math.min(66,(w-2*PAD)/n-10), gp=((w-2*PAD)-n*cell)/(n-1), gy=50, chh=42;
    for(let k=0;k<n;k++){
      const x=PAD+k*(cell+gp);
      const inWin = k>=s.l && k<=s.r;
      const isCut = (s.remove==='l' && k===s.l) || (s.remove==='r' && k===s.r);
      rr(x,gy,cell,chh,8);
      let bg=C.cell,bd=C.cellS,tc=C.text;
      if(k<s.l || k>s.r){ bg=C.off; bd=C.offS; tc=C.offT; }
      if(inWin){ bg=C.grn; bd=C.grnS; tc=C.grnT; }
      if(isCut){ bg=C.cur; bd=C.curS; tc=C.curT; }
      ctx.fillStyle=bg; ctx.fill(); ctx.lineWidth=isCut?3:1.7; ctx.strokeStyle=bd; ctx.stroke();
      ctx.fillStyle=tc; ctx.font='700 20px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(A[k]), x+cell/2, gy+chh/2);
      // distance below
      const inactive = k<s.l || k>s.r;
      ctx.fillStyle = inactive?C.offS:(inWin?C.grnT:C.dim); ctx.font='600 10px "JetBrains Mono", monospace'; ctx.textBaseline='top';
      ctx.fillText('d'+dist(A[k]), x+cell/2, gy+chh+5);
    }
    // l / r markers above endpoints
    if(!done || true){
      const lx=PAD+s.l*(cell+gp)+cell/2, rx=PAD+s.r*(cell+gp)+cell/2;
      triD(lx, gy-4, C.srcS); ctx.fillStyle=C.srcT; ctx.font='700 10px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='bottom'; ctx.fillText('l', lx, gy-10);
      if(s.r!==s.l){ triD(rx, gy-4, C.srcS); ctx.fillStyle=C.srcT; ctx.fillText('r', rx, gy-10); }
    }

    // ---- BAND 2 ----
    const b2=128;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 比兩端到 x=4 的距離,砍較遠的一端', PAD, b2);
    rr(PAD,b2+10,w-PAD*2,40,6); ctx.fillStyle=done?C.grn:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?C.grnS:C.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(done){ ctx.font='700 14px "JetBrains Mono", monospace'; ctx.fillStyle=C.grnT; ctx.fillText('size == k=3 → 答案 [3, 4, 5]', w/2, b2+30); }
    else if(s.act==='intro'){ ctx.font='700 13.5px "JetBrains Mono", monospace'; ctx.fillStyle=C.text; ctx.fillText('window size '+(s.r-s.l+1)+' > k=3 → 開始收縮', w/2, b2+30); }
    else {
      const dL=dist(A[s.l]), dR=dist(A[s.r]);
      ctx.font='700 14px "JetBrains Mono", monospace'; ctx.fillStyle=C.text;
      const cmp = s.tie ? '==' : (dL>dR?'>':'<');
      ctx.fillText('|arr[l]-x|='+dL+'  '+cmp+'  |arr[r]-x|='+dR+'   → 砍 '+(s.remove==='l'?'左':'右'), w/2, b2+30);
    }

    // ---- BAND 3 ----
    const by=196;
    ctx.fillStyle=C.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · while(r-l+1>k):較遠端砍掉;平手砍右', PAD, by);
    rr(PAD,by+10,w-PAD*2,44,6); ctx.fillStyle=done?C.grn:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?C.grnS:C.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='600 12.5px "Noto Sans TC", sans-serif';
    let msg,col=C.text;
    if(s.act==='intro'){ msg='已排序 → 最近的 k 個一定相鄰,只要決定「連續視窗的左界」'; }
    else if(done){ msg='收縮完畢 · 剩下的連續 k 個就是答案 · O(n−k)'; col=C.grnT; }
    else if(s.tie){ msg='距離相等 → 砍右端,保留較小的元素(題目 tie 取 a<b)'; col=C.curT; }
    else { msg='哪一端離 x 遠就砍哪端 —— 它不可能屬於最近的 k 個'; col=C.curT; }
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
