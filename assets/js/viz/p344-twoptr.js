/* ============================================================
   P344 · Reverse String — 對撞雙指針(two pointers)· viz
   l 從頭、r 從尾,交換 s[l]↔s[r],再 l++、r--,直到 l >= r。
   原地交換 → O(1) 額外空間、O(n) 時間。奇數長度時中間那格不動。
   例 "hello" → "olleh"。
     BAND 1  字元陣列(綠=已交換就位 · 紅=l · 藍=r)
     BAND 2  本步動作
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
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424', coral:'#cf3535' };

  // arr state, l, r, done
  const steps = [
    { arr:['h','e','l','l','o'], l:0, r:4, text:'<strong>INITIAL</strong> · <code>"hello"</code>。<code>l</code> 從頭、<code>r</code> 從尾,交換兩端字元後往中間收。' },
    { arr:['o','e','l','l','h'], l:1, r:3, swapped:[0,4], text:'<strong>交換</strong> · <code>s[0]↔s[4]</code>(<code>h↔o</code>)→ 兩端就位。<code>l++、r--</code>。' },
    { arr:['o','l','l','e','h'], l:2, r:2, swapped:[1,3], text:'<strong>交換</strong> · <code>s[1]↔s[3]</code>(<code>e↔l</code>)→ 就位。<code>l</code> 走到 <code>2</code>、<code>r</code> 走到 <code>2</code>。' },
    { arr:['o','l','l','e','h'], l:2, r:2, done:true, text:'<strong>結束</strong> · <code>l == r</code>(中間的 <code>l</code>)→ <code>l &lt; r</code> 不成立,停。奇數長度中間不用動。結果 <code>"olleh"</code>。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||300; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function tri(cx,cy,col){ ctx.beginPath(); ctx.moveTo(cx-6,cy+7); ctx.lineTo(cx+6,cy+7); ctx.lineTo(cx,cy-3); ctx.closePath(); ctx.fillStyle=col; ctx.fill(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,PAD=30;
    ctx.fillStyle=C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · s(綠=已就位 · 紅=l · 藍=r)', PAD, 22);
    const n=s.arr.length, cell=Math.min(72,(w-2*PAD)/n-10), gp=((w-2*PAD)-n*cell)/(n-1), gy=54, chh=54;
    for(let k=0;k<n;k++){
      const x=PAD+k*(cell+gp);
      const outside = k<s.l || k>s.r;                 // 已收斂交換好的兩端
      const isL = k===s.l && !s.done, isR = k===s.r && !s.done;
      const justSwapped = s.swapped && (k===s.swapped[0]||k===s.swapped[1]);
      rr(x,gy,cell,chh,8);
      let bg=C.cell,bd=C.cellS,tc=C.text;
      if(outside || s.done){ bg=C.grn; bd=C.grnS; tc=C.grnT; }
      if(isL){ bg=C.cur; bd=C.curS; tc=C.curT; }
      else if(isR){ bg=C.src; bd=C.srcS; tc=C.srcT; }
      ctx.fillStyle=bg; ctx.fill(); ctx.lineWidth=(isL||isR||justSwapped)?3:1.7; ctx.strokeStyle=bd; ctx.stroke();
      ctx.fillStyle=tc; ctx.font='700 24px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(s.arr[k], x+cell/2, gy+chh/2);
      ctx.fillStyle=C.dim; ctx.font='600 10px "JetBrains Mono", monospace'; ctx.textBaseline='top';
      ctx.fillText(String(k), x+cell/2, gy+chh+6);
    }
    // l / r pointers
    if(!s.done){
      const lx=PAD+s.l*(cell+gp)+cell/2, rx=PAD+s.r*(cell+gp)+cell/2;
      tri(lx, gy-10, C.curS); ctx.fillStyle=C.curT; ctx.font='700 11px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='bottom'; ctx.fillText('l', lx, gy-12);
      if(s.r!==s.l){ tri(rx, gy-10, C.srcS); ctx.fillStyle=C.srcT; ctx.fillText('r', rx, gy-12); }
      else { ctx.fillStyle=C.srcT; ctx.fillText('r', rx+13, gy-12); }
    }
    // BAND 2
    const by=132;
    ctx.fillStyle=C.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · while (l < r) { swap(s[l], s[r]); l++; r--; }', PAD, by);
    rr(PAD,by+10,w-PAD*2,44,6); ctx.fillStyle=s.done?C.grn:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=s.done?C.grnS:C.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillStyle=s.done?C.grnT:C.text; ctx.font='600 12.5px "Noto Sans TC", sans-serif';
    ctx.fillText(s.done?'完成 · 原地交換 · O(n) 時間 · O(1) 額外空間':(s.swapped?('交換 s['+s.swapped[0]+'] 與 s['+s.swapped[1]+'],兩端往中間收'):'兩端各一個指針,對撞收斂'), w/2, by+32);
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
