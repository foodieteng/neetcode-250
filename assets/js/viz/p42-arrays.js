/* ============================================================
   P42 · Trapping Rain Water — 解法 A:前綴最高 + 後綴最高陣列 · viz  (prefix va-)
   每格 i 能積的水 = min(它左邊最高 leftMax[i], 它右邊最高 rightMax[i]) − height[i]。
   先掃出 leftMax[](L→R 取 max)、rightMax[](R→L 取 max),再逐格加 min−高度。
   例 [3,0,2,0,4,0,1] → 積水 8。O(n) 時間、O(n) 空間(兩個陣列)。
     BAND 1  柱狀圖 + 藍線 leftMax + 紅線 rightMax + 藍色積水(到 min 線)
     BAND 2  本步 + 總積水
   ============================================================ */
(function () {
  const canvas = document.getElementById('va-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('va-step'), labelEl = document.getElementById('va-label');
  const bPrev = document.getElementById('va-prev'), bNext = document.getElementById('va-next'),
        bPlay = document.getElementById('va-play'), bReset = document.getElementById('va-reset');
  const C = { paper:'#ffffff', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf', cell:'#fafaf6', cellS:'#cfcfcf',
    src:'#dbe8f6', srcS:'#4478c0', srcT:'#2f5f9e', grn:'#d9e8c7', grnS:'#5fa866', grnT:'#3f7a3a',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424', off:'#eceae2', offS:'#c9c6ba', offT:'#8a8672', coral:'#cf3535',
    bar:'#d8d3c4', barS:'#a49d88', water:'rgba(68,120,192,0.30)' };

  const H = [3,0,2,0,4,0,1], MAXH = 4;
  const n = H.length;
  const L = new Array(n), R = new Array(n);
  L[0]=H[0]; for(let i=1;i<n;i++) L[i]=Math.max(L[i-1],H[i]);
  R[n-1]=H[n-1]; for(let i=n-2;i>=0;i--) R[i]=Math.max(R[i+1],H[i]);
  const steps = [
    { showL:false, showR:false, showW:false, text:'<strong>問題</strong> · <code>[3,0,2,0,4,0,1]</code>。每格能積的水 = <code>min(左邊最高, 右邊最高) − 自己高度</code>。' },
    { showL:true, showR:false, showW:false, text:'<strong>① leftMax[]</strong>(藍線)· L→R 取 max:<code>[3,3,3,3,4,4,4]</code>。每格左邊(含自己)的最高牆。' },
    { showL:true, showR:true, showW:false, text:'<strong>② rightMax[]</strong>(紅線)· R→L 取 max:<code>[4,4,4,4,4,1,1]</code>。每格右邊(含自己)的最高牆。' },
    { showL:true, showR:true, showW:true, text:'<strong>③ 逐格積水</strong> · 水位 = <code>min(leftMax, rightMax)</code>(兩線的較低者),積水 = 水位 − 高度。總和 = <strong>8</strong>。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,PAD=34;
    ctx.fillStyle=C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 柱狀圖 · 藍線=leftMax · 紅線=rightMax · 藍=積水(到 min 線)', PAD, 16);
    const base=176, maxBar=132, scale=maxBar/MAXH;
    const bw=Math.min(70,(w-2*PAD)/n-8), gap=((w-2*PAD)-n*bw)/(n-1);
    const cx=k=>PAD+k*(bw+gap);
    // water fill first (behind lines)
    if(s.showW){
      for(let k=0;k<n;k++){ const lvl=Math.min(L[k],R[k]); if(lvl>H[k]){ const x=cx(k); ctx.fillStyle=C.water; ctx.fillRect(x, base-lvl*scale, bw, (lvl-H[k])*scale); } }
    }
    // bars
    for(let k=0;k<n;k++){ const x=cx(k), top=base-H[k]*scale; rr(x,top,bw,Math.max(H[k]*scale,2),3); ctx.fillStyle=C.bar; ctx.fill(); ctx.lineWidth=1.4; ctx.strokeStyle=C.barS; ctx.stroke();
      ctx.fillStyle=C.text; ctx.font='700 12px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='bottom'; if(H[k]>0) ctx.fillText(String(H[k]), x+bw/2, top-2);
      ctx.fillStyle=C.dim; ctx.font='600 9px "JetBrains Mono", monospace'; ctx.textBaseline='top'; ctx.fillText(String(k), x+bw/2, base+4); }
    ctx.strokeStyle=C.grid; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(PAD-6,base); ctx.lineTo(w-PAD+6,base); ctx.stroke();
    // leftMax stepped line
    function envelope(arr,col){ ctx.strokeStyle=col; ctx.lineWidth=2.4; ctx.beginPath(); for(let k=0;k<n;k++){ const x=cx(k), y=base-arr[k]*scale; if(k===0)ctx.moveTo(x,y); else ctx.lineTo(x,y); ctx.lineTo(x+bw,y); } ctx.stroke(); }
    if(s.showL) envelope(L, C.srcS);
    if(s.showR) envelope(R, C.curS);

    // ---- BAND 2 ----
    const b2=210;
    ctx.fillStyle=C.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · water += min(leftMax[i], rightMax[i]) − height[i]', PAD, b2);
    rr(PAD,b2+10,w-PAD*2,40,6); ctx.fillStyle=s.showW?C.grn:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=s.showW?C.grnS:C.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='700 13.5px "JetBrains Mono", monospace'; ctx.fillStyle=s.showW?C.grnT:C.text;
    let msg;
    if(!s.showL) msg='每格積水由「左最高、右最高的較低者」封頂';
    else if(!s.showR) msg='leftMax[i] = max(leftMax[i-1], height[i]) · L→R';
    else if(!s.showW) msg='rightMax[i] = max(rightMax[i+1], height[i]) · R→L';
    else msg='總積水 = 3+1+3(左池) + 1(右池) = 8 · O(n) 時間 / O(n) 空間';
    ctx.fillText(msg, w/2, b2+30);
  }

  function update(){ if(stepEl) stepEl.textContent=String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0'); if(labelEl) labelEl.innerHTML=steps[step].text; draw(); }
  function next(){ if(step<steps.length-1){step++;update();}else stop(); }
  function prev(){ if(step>0){step--;update();} }
  function reset(){ stop(); step=0; update(); }
  function play(){ if(timer){stop();return;} bPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){stop();return;} next(); },1900); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} if(bPlay) bPlay.textContent='Play'; }
  bPrev&&bPrev.addEventListener('click',prev); bNext&&bNext.addEventListener('click',next); bPlay&&bPlay.addEventListener('click',play); bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();}); if(window.ResizeObserver){ new ResizeObserver(()=>{fit();draw();}).observe(canvas); }
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw); fit(); update();
})();
