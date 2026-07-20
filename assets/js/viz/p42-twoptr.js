/* ============================================================
   P42 · Trapping Rain Water — 解法 B:對撞雙指針 O(1) 空間 · viz  (prefix vb-)
   不用陣列:l、r 從兩端往中間收,維護 leftMax、rightMax 兩個純量。
   每步處理「較矮的一側」:因為對側必有 ≥ 它的牆擋著,較矮側的水位由「它那側的 max」
   就能確定 → 積水 += (該側 max − 該格高度),指針內移。
   例 [3,0,2,0,4,0,1] → 積水 8。O(n) 時間、O(1) 空間。
     BAND 1  柱狀圖(藍=l · 紅=r · 藍水=已積)· leftMax / rightMax
     BAND 2  處理較矮側:water += sideMax − height
   ============================================================ */
(function () {
  const canvas = document.getElementById('vb-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('vb-step'), labelEl = document.getElementById('vb-label');
  const bPrev = document.getElementById('vb-prev'), bNext = document.getElementById('vb-next'),
        bPlay = document.getElementById('vb-play'), bReset = document.getElementById('vb-reset');
  const C = { paper:'#ffffff', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf', cell:'#fafaf6', cellS:'#cfcfcf',
    src:'#dbe8f6', srcS:'#4478c0', srcT:'#2f5f9e', grn:'#d9e8c7', grnS:'#5fa866', grnT:'#3f7a3a',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424', off:'#eceae2', offS:'#c9c6ba', offT:'#8a8672', coral:'#cf3535',
    bar:'#d8d3c4', barS:'#a49d88', water:'rgba(68,120,192,0.30)' };

  const H = [3,0,2,0,4,0,1], MAXH = 4, n = H.length;
  // precompute the sequence: l,r,leftMax,rightMax,side('L'|'R'|null),add,water,waterCols(set of filled indices)
  const steps = [{ l:0, r:n-1, lm:0, rm:0, side:null, add:0, water:0, filled:[], act:'intro',
    text:'<strong>INITIAL</strong> · l、r 從兩端。維護 leftMax、rightMax 兩純量。<strong>移動較矮側</strong>:對側必有更高牆,較矮側水位由它那側的 max 決定。' }];
  (function(){
    let l=0,r=n-1,lm=0,rm=0,water=0,filled=[];
    while(l<r){
      if(H[l]<H[r]){ lm=Math.max(lm,H[l]); const add=lm-H[l]; if(add>0) filled=filled.concat([l]); water+=add;
        steps.push({ l, r, lm, rm, side:'L', add, water, filled:filled.slice(), act:'proc',
          text:'<strong>l='+l+'(h='+H[l]+') &lt; r='+r+'(h='+H[r]+')</strong> · 左較矮 → 更新 leftMax='+lm+',積水 += '+lm+'−'+H[l]+' = '+add+'。water='+water+'。l++。' });
        l++;
      } else { rm=Math.max(rm,H[r]); const add=rm-H[r]; if(add>0) filled=filled.concat([r]); water+=add;
        steps.push({ l, r, lm, rm, side:'R', add, water, filled:filled.slice(), act:'proc',
          text:'<strong>r='+r+'(h='+H[r]+') ≤ l='+l+'(h='+H[l]+')</strong> · 右較矮 → 更新 rightMax='+rm+',積水 += '+rm+'−'+H[r]+' = '+add+'。water='+water+'。r--。' });
        r--;
      }
    }
    steps.push({ l:-1, r:-1, lm, rm, side:null, add:0, water, filled:filled.slice(), act:'done',
      text:'<strong>完成</strong> · l 與 r 相遇 → 回傳 <strong>water = '+water+'</strong>。全程只用 4 個純量 → O(1) 空間。' });
  })();

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function triD(cx,cy,col){ ctx.beginPath(); ctx.moveTo(cx-6,cy-7); ctx.lineTo(cx+6,cy-7); ctx.lineTo(cx,cy+3); ctx.closePath(); ctx.fillStyle=col; ctx.fill(); }

  // to render water columns we need the min-envelope per filled column; recompute final levels for filled cols
  const L=new Array(n),R=new Array(n); L[0]=H[0]; for(let i=1;i<n;i++)L[i]=Math.max(L[i-1],H[i]); R[n-1]=H[n-1]; for(let i=n-2;i>=0;i--)R[i]=Math.max(R[i+1],H[i]);

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,PAD=34; const done=s.act==='done';
    ctx.fillStyle=C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 柱狀圖(藍=l · 紅=r · 藍=已積水)· 處理較矮側', PAD, 16);
    const base=160, maxBar=108, scale=maxBar/MAXH;
    const bw=Math.min(70,(w-2*PAD)/n-8), gap=((w-2*PAD)-n*bw)/(n-1);
    const cx=k=>PAD+k*(bw+gap);
    // water for filled columns (level = min(L,R))
    for(const k of s.filled){ const lvl=Math.min(L[k],R[k]); if(lvl>H[k]){ const x=cx(k); ctx.fillStyle=C.water; ctx.fillRect(x, base-lvl*scale, bw, (lvl-H[k])*scale); } }
    for(let k=0;k<n;k++){ const x=cx(k), top=base-H[k]*scale;
      const isL=k===s.l, isR=k===s.r;
      rr(x,top,bw,Math.max(H[k]*scale,2),3);
      ctx.fillStyle = isL?'#bcd4ee':(isR?'#f2c9c9':C.bar); ctx.fill();
      ctx.lineWidth=(isL||isR)?3:1.4; ctx.strokeStyle=isL?C.srcS:(isR?C.curS:C.barS); ctx.stroke();
      ctx.fillStyle=C.text; ctx.font='700 12px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='bottom'; if(H[k]>0) ctx.fillText(String(H[k]), x+bw/2, top-2);
      ctx.fillStyle=C.dim; ctx.font='600 9px "JetBrains Mono", monospace'; ctx.textBaseline='top'; ctx.fillText(String(k), x+bw/2, base+4); }
    ctx.strokeStyle=C.grid; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(PAD-6,base); ctx.lineTo(w-PAD+6,base); ctx.stroke();
    if(!done){
      const lx=cx(s.l)+bw/2, rx=cx(s.r)+bw/2;
      triD(lx, base+22, C.srcS); ctx.fillStyle=C.srcT; ctx.font='700 10px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='top'; ctx.fillText('l', lx, base+26);
      if(s.r!==s.l){ triD(rx, base+22, C.curS); ctx.fillStyle=C.curT; ctx.fillText('r', rx, base+26); }
    }
    // leftMax / rightMax values top-right
    ctx.textAlign='right'; ctx.textBaseline='alphabetic'; ctx.font='600 11px "JetBrains Mono", monospace'; ctx.fillStyle=C.text;
    ctx.fillText('leftMax='+s.lm+'  rightMax='+s.rm+'  water='+s.water, w-PAD, 16);

    // ---- BAND 2 ----
    const b2=208;
    ctx.fillStyle=C.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 較矮側:sideMax=max(sideMax,h);water += sideMax − h', PAD, b2);
    rr(PAD,b2+10,w-PAD*2,42,6); ctx.fillStyle=done?C.grn:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?C.grnS:C.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='600 12.5px "Noto Sans TC", sans-serif';
    let msg,col=C.text;
    if(s.act==='intro'){ msg='關鍵:較矮側的水位「對側更高牆保證封頂」→ 只看該側 max 就夠'; }
    else if(done){ msg='完成 · water = 8 · 一趟對撞 · O(n)/O(1)'; col=C.grnT; }
    else if(s.side==='L'){ msg='左較矮 → water += leftMax('+s.lm+') − h('+H[s.l]+') = '+s.add+' · l 右移'; col=C.srcT; }
    else { msg='右較矮 → water += rightMax('+s.rm+') − h('+H[s.r]+') = '+s.add+' · r 左移'; col=C.curT; }
    ctx.fillStyle=col; ctx.fillText(msg, w/2, b2+31);
  }

  function update(){ if(stepEl) stepEl.textContent=String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0'); if(labelEl) labelEl.innerHTML=steps[step].text; draw(); }
  function next(){ if(step<steps.length-1){step++;update();}else stop(); }
  function prev(){ if(step>0){step--;update();} }
  function reset(){ stop(); step=0; update(); }
  function play(){ if(timer){stop();return;} bPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){stop();return;} next(); },1700); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} if(bPlay) bPlay.textContent='Play'; }
  bPrev&&bPrev.addEventListener('click',prev); bNext&&bNext.addEventListener('click',next); bPlay&&bPlay.addEventListener('click',play); bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();}); if(window.ResizeObserver){ new ResizeObserver(()=>{fit();draw();}).observe(canvas); }
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw); fit(); update();
})();
