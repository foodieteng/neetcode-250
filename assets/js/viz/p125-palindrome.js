/* ============================================================
   P125 · Valid Palindrome — 對撞雙指針 + 跳過非字母數字 + 忽略大小寫 · viz
   和反轉字串同骨架,只是中間那步從「交換」換成「比較」:
     l 指非 alnum → l++ 跳過;  r 指非 alnum → r-- 跳過;
     兩邊都是 alnum → 比 tolower(s[l]) 與 tolower(s[r]),不等就 return false,
     相等就 l++、r-- 繼續。掃到 l >= r 都沒失敗 → 是回文。
   例 "A b,a" → 過濾成 "aba" → 是回文(A 與 a 忽略大小寫;空格、逗號跳過)。
     BAND 1  字串(綠=已驗證的對稱對 · 灰=跳過的非 alnum · 紅=l · 藍=r)
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
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424', off:'#eceae2', offS:'#c9c6ba', offT:'#8a8672', coral:'#cf3535' };

  const S = ['A', ' ', 'b', ',', 'a'];
  const disp = c => c === ' ' ? '␣' : c;
  // matched = 已驗證對稱的 index;skipped = 已跳過的非 alnum index
  const steps = [
    { l:0, r:4, matched:[], skipped:[], text:'<strong>INITIAL</strong> · <code>"A b,a"</code>。同「反轉」的對撞骨架,但中間改成<strong>比較</strong>:先跳過非字母數字,再忽略大小寫比兩端。' },
    { l:1, r:3, matched:[0,4], skipped:[], act:'match', text:'<strong>比較</strong> · <code>s[0]=\'A\'</code> vs <code>s[4]=\'a\'</code> 都是 alnum → <code>tolower</code> 後 <code>a==a</code> ✓ 相符。<code>l++、r--</code>。' },
    { l:2, r:3, matched:[0,4], skipped:[1], act:'skipL', text:'<strong>跳過(左)</strong> · <code>s[1]=\'␣\'</code> 不是字母數字 → <code>l++</code> 跳過,不比較。' },
    { l:2, r:2, matched:[0,4], skipped:[1,3], act:'skipR', text:'<strong>跳過(右)</strong> · <code>s[3]=\',\'</code> 不是字母數字 → <code>r--</code> 跳過。' },
    { l:2, r:2, matched:[0,4], skipped:[1,3], done:true, text:'<strong>結束</strong> · <code>l == r</code>(中間 <code>\'b\'</code>)→ <code>l &lt; r</code> 不成立,全程沒失敗 → <strong>是回文 · true</strong>。' },
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
    ctx.fillText('BAND 1 · s(綠=已對稱 · 灰=跳過的非 alnum · 紅=l · 藍=r)', PAD, 22);
    const n=S.length, cell=Math.min(72,(w-2*PAD)/n-10), gp=((w-2*PAD)-n*cell)/(n-1), gy=54, chh=54;
    const isM=k=>s.matched.indexOf(k)>=0, isSk=k=>s.skipped.indexOf(k)>=0;
    for(let k=0;k<n;k++){
      const x=PAD+k*(cell+gp);
      const isL=k===s.l&&!s.done, isR=k===s.r&&!s.done;
      rr(x,gy,cell,chh,8);
      let bg=C.cell,bd=C.cellS,tc=C.text;
      if(isM(k)||s.done && !isSk(k)){ bg=C.grn; bd=C.grnS; tc=C.grnT; }
      if(isSk(k)){ bg=C.off; bd=C.offS; tc=C.offT; }
      if(isL && !s.done){ bg=C.cur; bd=C.curS; tc=C.curT; }
      else if(isR && !s.done){ bg=C.src; bd=C.srcS; tc=C.srcT; }
      ctx.fillStyle=bg; ctx.fill(); ctx.lineWidth=(isL||isR)?3:1.7; ctx.strokeStyle=bd; ctx.stroke();
      ctx.fillStyle=tc; ctx.font='700 23px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(disp(S[k]), x+cell/2, gy+chh/2);
      ctx.fillStyle=C.dim; ctx.font='600 10px "JetBrains Mono", monospace'; ctx.textBaseline='top';
      ctx.fillText(String(k), x+cell/2, gy+chh+6);
    }
    if(!s.done){
      const lx=PAD+s.l*(cell+gp)+cell/2, rx=PAD+s.r*(cell+gp)+cell/2;
      tri(lx, gy-10, C.curS); ctx.fillStyle=C.curT; ctx.font='700 11px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='bottom'; ctx.fillText('l', lx, gy-12);
      if(s.r!==s.l){ tri(rx, gy-10, C.srcS); ctx.fillStyle=C.srcT; ctx.fillText('r', rx, gy-12); }
      else { ctx.fillStyle=C.srcT; ctx.fillText('r', rx+13, gy-12); }
    }
    const by=132;
    ctx.fillStyle=C.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 非 alnum→跳;都 alnum→比 tolower;不等→false', PAD, by);
    rr(PAD,by+10,w-PAD*2,44,6); ctx.fillStyle=s.done?C.grn:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=s.done?C.grnS:C.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    let msg, col=C.text;
    if(s.done){ msg='全程比對相符 → 回文 true · O(n) 時間 · O(1) 空間'; col=C.grnT; }
    else if(s.act==='match'){ msg='兩端都 alnum,tolower 相等 → 內收(l++, r--)'; col=C.grnT; }
    else if(s.act==='skipL'){ msg='左端非 alnum → l++ 跳過(只動 l,不比較)'; col=C.offT; }
    else if(s.act==='skipR'){ msg='右端非 alnum → r-- 跳過(只動 r,不比較)'; col=C.offT; }
    else { msg='l 從頭、r 從尾,比較兩端(先過濾、再忽略大小寫)'; }
    ctx.fillStyle=col; ctx.font='600 12.5px "Noto Sans TC", sans-serif';
    ctx.fillText(msg, w/2, by+32);
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
