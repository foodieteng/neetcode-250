/* ============================================================
   P11 · Container With Most Water — 對撞雙指針 · 移動較矮牆 · viz
   面積 = min(height[l], height[r]) × (r - l)。l、r 從兩端往中間收:
   寬度每步必減 1,所以想要更大面積,唯一機會是「讓較矮的那面牆變高」→
   移動「較矮」的一端(移動較高的那端,min 不變、寬度還變小,絕不可能更好)。
   例 height=[1,8,6,2,5,7] → 最大蓄水 28(l=1 高 8、r=5 高 7,寬 4)。
     BAND 1  柱狀圖(牆=藍 · 當前 l/r 牆 · 藍色水填到 min 高度)
     BAND 2  面積 = min × 寬 / maxArea
     BAND 3  移動較矮的一面牆
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
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424', off:'#eceae2', offS:'#c9c6ba', offT:'#8a8672', coral:'#cf3535',
    water:'rgba(68,120,192,0.24)', waterWin:'rgba(95,168,102,0.28)' };

  const H = [1,8,6,2,5,7], MAXH = 8;
  // l, r, area, max, move('l'|'r'|null), best, done, text
  const steps = [
    { l:0, r:5, area:5,  max:5,  move:'l', text:'<strong>INITIAL</strong> · <code>[1,8,6,2,5,7]</code>。l、r 從兩端。面積 = <code>min(1,7)×5 = 5</code>。左牆 <code>1</code> 較矮 → <strong>移動左牆</strong>(l++)。' },
    { l:1, r:5, area:28, max:28, move:'r', best:true, text:'<strong>l=1,r=5</strong> · <code>min(8,7)×4 = 28</code> → <strong>刷新 maxArea=28</strong>!右牆 <code>7</code> 較矮(<code>8≥7</code>)→ <strong>移動右牆</strong>(r--)。' },
    { l:1, r:4, area:15, max:28, move:'r', text:'<strong>l=1,r=4</strong> · <code>min(8,5)×3 = 15 &lt; 28</code>。右牆 <code>5</code> 較矮 → r--。' },
    { l:1, r:3, area:4,  max:28, move:'r', text:'<strong>l=1,r=3</strong> · <code>min(8,2)×2 = 4</code>。右牆 <code>2</code> 較矮 → r--。' },
    { l:1, r:2, area:6,  max:28, move:'r', text:'<strong>l=1,r=2</strong> · <code>min(8,6)×1 = 6</code>。右牆 <code>6</code> 較矮 → r-- 後 <code>l==r</code>,結束。' },
    { l:1, r:5, area:28, max:28, done:true, best:true, text:'<strong>完成</strong> · 最佳容器是 <code>l=1(高8)</code> 與 <code>r=5(高7)</code>,寬 4、水位 7 → <strong>回傳 maxArea = 28</strong>。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function triU(cx,cy,col){ ctx.beginPath(); ctx.moveTo(cx-6,cy+7); ctx.lineTo(cx+6,cy+7); ctx.lineTo(cx,cy-3); ctx.closePath(); ctx.fillStyle=col; ctx.fill(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,PAD=34;
    ctx.fillStyle=C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 柱狀圖(藍=牆 · l/r=當前兩面牆 · 水填到 min 高度)', PAD, 16);
    const n=H.length, base=132, maxBar=92, scale=maxBar/MAXH;
    const bw=Math.min(56,(w-2*PAD)/n-16), gap=((w-2*PAD)-n*bw)/(n-1);
    const shorter = H[s.l] < H[s.r] ? s.l : s.r;    // 較矮的牆(平手取 r 端,對應 h[l]<h[r] 才移 l)
    const wl = min => base - min*scale;
    // water fill between l and r up to min height
    const minH = Math.min(H[s.l], H[s.r]);
    const xL = PAD + s.l*(bw+gap), xR = PAD + s.r*(bw+gap) + bw;
    ctx.fillStyle = s.done ? C.waterWin : C.water;
    ctx.fillRect(xL, wl(minH), xR - xL, minH*scale);
    // bars
    for(let k=0;k<n;k++){
      const x=PAD+k*(bw+gap), top=base - H[k]*scale;
      const isWall = k===s.l || k===s.r;
      const isShort = !s.done && isWall && k===shorter;
      rr(x, top, bw, H[k]*scale, 4);
      let fill=C.src, bd=C.srcS;
      if(isWall){ fill=s.done?C.grn:C.src; bd=s.done?C.grnS:C.srcS; }
      ctx.fillStyle=isWall?(s.done?C.grn:'#bcd4ee'):C.cell; ctx.fill();
      ctx.lineWidth=isWall?3:1.5; ctx.strokeStyle=isShort?C.curS:(isWall?(s.done?C.grnS:C.srcS):C.cellS); ctx.stroke();
      // height value on top
      ctx.fillStyle=isWall?(s.done?C.grnT:C.srcT):C.dim; ctx.font='700 12px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='bottom';
      ctx.fillText(String(H[k]), x+bw/2, top-3);
      // index
      ctx.fillStyle=C.dim; ctx.font='600 10px "JetBrains Mono", monospace'; ctx.textBaseline='top';
      ctx.fillText(String(k), x+bw/2, base+5);
    }
    // baseline
    ctx.strokeStyle=C.grid; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(PAD-6, base); ctx.lineTo(w-PAD+6, base); ctx.stroke();
    // l / r markers below
    { const lx=PAD+s.l*(bw+gap)+bw/2; triU(lx, base+28, s.done?C.grnS:C.srcS); ctx.fillStyle=s.done?C.grnT:C.srcT; ctx.font='700 10px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='top'; ctx.fillText('l', lx, base+32); }
    { const rx=PAD+s.r*(bw+gap)+bw/2; triU(rx, base+28, s.done?C.grnS:C.srcS); ctx.fillStyle=s.done?C.grnT:C.srcT; ctx.font='700 10px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='top'; ctx.fillText('r', rx, base+32); }

    // ---- BAND 2 ----
    const b2=182;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 面積 = min(牆高) × 寬度;maxArea 取最大', PAD, b2);
    rr(PAD,b2+8,w-PAD*2,32,6); ctx.fillStyle=(s.best||s.done)?C.grn:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=(s.best||s.done)?C.grnS:C.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='700 13.5px "JetBrains Mono", monospace'; ctx.fillStyle=C.text;
    ctx.fillText('min('+H[s.l]+','+H[s.r]+') × '+(s.r-s.l)+' = '+s.area+'      maxArea = '+s.max, w/2, b2+24);

    // ---- BAND 3 ----
    const by=230;
    ctx.fillStyle=C.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 寬度只會變小 → 只能靠「較矮牆變高」→ 移較矮端', PAD, by);
    rr(PAD,by+8,w-PAD*2,36,6); ctx.fillStyle=s.done?C.grn:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=s.done?C.grnS:C.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='600 12.5px "Noto Sans TC", sans-serif';
    let msg,col=C.text;
    if(s.done){ msg='最佳容器 · 面積 28 · O(n) 一趟對撞 · O(1) 空間'; col=C.grnT; }
    else if(s.move==='l'){ msg='左牆較矮 → 移左(移高牆 min 不變、寬又縮,不可能更好)'; col=C.srcT; }
    else { msg='右牆較矮(或平手)→ 移右(移高牆絕不會更好)'; col=C.srcT; }
    ctx.fillStyle=col; ctx.fillText(msg, w/2, by+27);
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
