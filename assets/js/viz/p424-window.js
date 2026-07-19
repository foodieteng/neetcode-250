/* ============================================================
   P424 · Longest Repeating Character Replacement — 可變長視窗(合法條件變體) · viz
   最多換 k 個字元,求最長「同字元」子字串。視窗合法 ⟺
   視窗長度 − 視窗內最多字元次數 ≤ k(要替換的字元數 = 非眾數字元數 ≤ k)。
   右擴張;不合法(替換數 > k)才縮左;答案取最長合法視窗。
   例 s="AABBB", k=1 → 最長 4("ABBB" 換掉那個 A → "BBBB")。
     BAND 1  s(綠=視窗[l,r] · 紅=r · 灰=已移出)
     BAND 2  長度 − 眾數次數 = 替換數 ≤ k?
     BAND 3  合法就擴張;替換數 > k 才縮
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

  const S = ['A','A','B','B','B'], K = 1;
  const steps = [
    { l:0, r:-1, act:'intro', text:'<strong>INITIAL</strong> · <code>s="AABBB"</code>, k=1。視窗合法 ⟺ <strong>長度 − 眾數次數 ≤ k</strong>(要替換的字元數 ≤ k)。右擴張、不合法才縮。' },
    { l:0, r:0, act:'grow', text:'<strong>r=0 \'A\'</strong> · 視窗 <code>"A"</code>,眾數 A×1,替換 <code>1−1=0 ≤ 1</code>。maxL=1。' },
    { l:0, r:1, act:'grow', text:'<strong>r=1 \'A\'</strong> · <code>"AA"</code>,眾數 A×2,替換 <code>2−2=0</code>。maxL=2。' },
    { l:0, r:2, act:'grow', text:'<strong>r=2 \'B\'</strong> · <code>"AAB"</code>,眾數 A×2,替換 <code>3−2=1 ≤ 1</code>(換掉那個 B)。maxL=3。' },
    { l:1, r:3, act:'shrink', text:'<strong>r=3 \'B\'</strong> · <code>"AABB"</code> 替換 <code>4−2=2 &gt; 1</code> → <strong>縮左</strong>,移出 A → <code>"ABB"</code>,替換 <code>3−2=1 ≤ 1</code>。maxL 仍 3。' },
    { l:1, r:4, act:'best', text:'<strong>r=4 \'B\'</strong> · <code>"ABBB"</code>,眾數 B×3,替換 <code>4−3=1 ≤ 1</code>(換掉那個 A → "BBBB")→ <strong>maxL=4</strong>。掃完回傳 4。' },
  ];

  function winStat(l,r){ if(r<0) return {len:0,maj:'',majc:0,cost:0}; const f={}; let maj='',majc=0; for(let k=l;k<=r;k++){ f[S[k]]=(f[S[k]]||0)+1; if(f[S[k]]>majc){majc=f[S[k]];maj=S[k];} } const len=r-l+1; return {len,maj,majc,cost:len-majc}; }

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function triD(cx,cy,col){ ctx.beginPath(); ctx.moveTo(cx-6,cy-7); ctx.lineTo(cx+6,cy-7); ctx.lineTo(cx,cy+3); ctx.closePath(); ctx.fillStyle=col; ctx.fill(); }
  function triU(cx,cy,col){ ctx.beginPath(); ctx.moveTo(cx-6,cy+7); ctx.lineTo(cx+6,cy+7); ctx.lineTo(cx,cy-3); ctx.closePath(); ctx.fillStyle=col; ctx.fill(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,PAD=30; const st=winStat(s.l,s.r);
    ctx.fillStyle=C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);
    const done = s.act==='best';
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · s(綠=視窗[l,r] · 紅=r · 灰=已移出 · 眾數字元加深)', PAD, 18);
    const n=S.length, cell=Math.min(70,(w-2*PAD)/n-10), gp=((w-2*PAD)-n*cell)/(n-1), gy=50, chh=46;
    for(let k=0;k<n;k++){
      const x=PAD+k*(cell+gp);
      const inWin = s.r>=0 && k>=s.l && k<=s.r;
      const isR = k===s.r;
      const isMaj = inWin && S[k]===st.maj;
      rr(x,gy,cell,chh,8);
      let bg=C.cell,bd=C.cellS,tc=C.text;
      if(s.r<0 || k<s.l || k>s.r){ bg=C.off; bd=C.offS; tc=C.offT; }
      if(inWin){ bg=isMaj?'#c4dda8':C.grn; bd=C.grnS; tc=C.grnT; }
      if(isR){ bg=C.cur; bd=C.curS; tc=C.curT; }
      ctx.fillStyle=bg; ctx.fill(); ctx.lineWidth=isR?3:1.7; ctx.strokeStyle=bd; ctx.stroke();
      ctx.fillStyle=tc; ctx.font='700 20px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(S[k], x+cell/2, gy+chh/2);
      ctx.fillStyle=C.dim; ctx.font='600 10px "JetBrains Mono", monospace'; ctx.textBaseline='top';
      ctx.fillText(String(k), x+cell/2, gy+chh+6);
    }
    if(s.r>=0){ const rx=PAD+s.r*(cell+gp)+cell/2; triD(rx, gy-4, C.curS); ctx.fillStyle=C.curT; ctx.font='700 10px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='bottom'; ctx.fillText('r', rx, gy-10);
      const lx=PAD+s.l*(cell+gp)+cell/2; triU(lx, gy+chh+16, C.srcS); ctx.fillStyle=C.srcT; ctx.textBaseline='top'; ctx.fillText('l', lx, gy+chh+22); }

    // ---- BAND 2 ----
    const b2=134;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 替換數 = 視窗長 − 眾數次數,要 ≤ k', PAD, b2);
    rr(PAD,b2+10,w-PAD*2,40,6); ctx.fillStyle=done?C.grn:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?C.grnS:C.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='700 14px "JetBrains Mono", monospace'; ctx.fillStyle=C.text;
    if(s.r<0){ ctx.fillText('k = 1 · 準備滑動', w/2, b2+30); }
    else { ctx.fillText('長度 '+st.len+' − 眾數 '+st.maj+'×'+st.majc+' = 替換 '+st.cost+'  '+(st.cost<=K?'≤':'>')+'  k='+K+(st.cost<=K?'  ✓':'  ✗'), w/2, b2+30); }

    // ---- BAND 3 ----
    const by=196;
    ctx.fillStyle=C.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 替換數 ≤ k → 擴張;> k → 縮左', PAD, by);
    rr(PAD,by+10,w-PAD*2,44,6); ctx.fillStyle=done?C.grn:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?C.grnS:C.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='600 12.5px "Noto Sans TC", sans-serif';
    let msg,col=C.text;
    if(s.act==='intro'){ msg='合法條件從「無重複」換成「替換數 ≤ k」→ 同一副可變長骨架'; }
    else if(done){ msg='完成 · 最長同字元(可換 k 個)子字串 = 4 · O(n)'; col=C.grnT; }
    else if(s.act==='shrink'){ msg='替換數超過 k → 縮左移出字元,直到視窗又合法'; col=C.curT; }
    else { msg='替換數 ≤ k → 視窗合法,r 擴張、更新 maxL'; col=C.grnT; }
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
