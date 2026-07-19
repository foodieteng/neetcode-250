/* ============================================================
   P239 · Sliding Window Maximum — 單調遞減雙端隊列 · viz
   維持一個「索引」的雙端隊列,對應的值單調遞減:
     ① 推入 i 前,把 back 端所有 nums ≤ nums[i] 的索引彈掉(它們被 i 蓋過,永無出頭)
     ② front 端若索引已滑出視窗(front ≤ i-k)就彈掉(過期)
     ③ push i;視窗滿(i≥k-1)時 front 就是視窗最大值 → 輸出 nums[front]
   例 nums=[8,3,4,2,6,1], k=3 → [8,4,6,6]。
     BAND 1  nums(綠=視窗 · 紅=i · 深綠=front=最大)· 右上=輸出
     BAND 2  單調遞減隊列(存索引;左=front=max · 右=back)
     BAND 3  本步:彈 back(較小)/ 彈 front(過期)/ push
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

  const A = [8,3,4,2,6,1], K = 3;
  // i, l, r (window; r=i, l=i-k+1 clamped; null if not full), dq(indices), out(values), act, text
  const steps = [
    { i:-1, win:null, dq:[], out:[], act:'intro', text:'<strong>INITIAL</strong> · <code>[8,3,4,2,6,1]</code>, k=3。用單調遞減隊列存<strong>索引</strong>:push 前彈掉 back 端較小的、front 過期就彈掉。front 永遠是視窗最大值。' },
    { i:0, win:null, dq:[0], out:[], act:'push', text:'<strong>i=0 (8)</strong> · 隊列空 → push 0。視窗還沒滿(需 3 個),不輸出。' },
    { i:1, win:null, dq:[0,1], out:[], act:'push', text:'<strong>i=1 (3)</strong> · <code>3 &lt; 8</code> → 不彈,push 1。隊列值 [8,3] 遞減。仍未滿。' },
    { i:2, win:[0,2], dq:[0,2], out:[8], act:'popback', text:'<strong>i=2 (4)</strong> · <code>4 ≥ 3</code> → 彈掉 back 索引1;push 2。視窗 [0,2] 滿 → 輸出 <strong>front=nums[0]=8</strong>。' },
    { i:3, win:[1,3], dq:[2,3], out:[8,4], act:'popfront', text:'<strong>i=3 (2)</strong> · 索引0 已滑出視窗(0 ≤ i−k=0)→ 彈掉 front;<code>2&lt;4</code> 不彈 back,push 3。輸出 <strong>front=nums[2]=4</strong>(最大從 8 掉到 4)。' },
    { i:4, win:[2,4], dq:[4], out:[8,4,6], act:'popback', text:'<strong>i=4 (6)</strong> · <code>6 ≥ 2</code> 彈索引3、<code>6 ≥ 4</code> 彈索引2 → 隊列清空;push 4。輸出 <strong>nums[4]=6</strong>。' },
    { i:5, win:[3,5], dq:[4,5], out:[8,4,6,6], act:'push', text:'<strong>i=5 (1)</strong> · <code>1 &lt; 6</code> → push 5。輸出 <strong>front=nums[4]=6</strong>。完成 → <code>[8,4,6,6]</code>。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function triD(cx,cy,col){ ctx.beginPath(); ctx.moveTo(cx-6,cy-7); ctx.lineTo(cx+6,cy-7); ctx.lineTo(cx,cy+3); ctx.closePath(); ctx.fillStyle=col; ctx.fill(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,PAD=30; const done = step===steps.length-1;
    ctx.fillStyle=C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);
    const front = s.dq.length ? s.dq[0] : -1;
    // ---- BAND 1 · array ----
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · nums(綠=視窗 · 紅=i · 深綠=front 最大)', PAD, 15);
    const n=A.length, cell=Math.min(62,(w-2*PAD)/n-10), gp=((w-2*PAD)-n*cell)/(n-1), gy=34, chh=36;
    for(let k=0;k<n;k++){
      const x=PAD+k*(cell+gp);
      const inWin = s.win && k>=s.win[0] && k<=s.win[1];
      const isI = k===s.i;
      const isFront = k===front && s.win;
      rr(x,gy,cell,chh,7);
      let bg=C.cell,bd=C.cellS,tc=C.text;
      if(!inWin){ bg=C.cell; bd=C.cellS; tc= (s.i>=0 && k>s.i)?C.offT:C.text; }
      if(inWin){ bg=C.grn; bd=C.grnS; tc=C.grnT; }
      if(isFront){ bg='#bcd9a3'; bd=C.grnS; }
      if(isI){ ctx.lineWidth=3; } else ctx.lineWidth=1.6;
      ctx.fillStyle=bg; ctx.fill(); ctx.strokeStyle=isI?C.curS:bd; ctx.stroke();
      ctx.fillStyle=isI?C.curT:tc; ctx.font='700 17px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(A[k]), x+cell/2, gy+chh/2);
      ctx.fillStyle=C.dim; ctx.font='600 9px "JetBrains Mono", monospace'; ctx.textBaseline='top';
      ctx.fillText(String(k), x+cell/2, gy+chh+3);
    }
    if(s.i>=0){ const ix=PAD+s.i*(cell+gp)+cell/2; triD(ix, gy-3, C.curS); ctx.fillStyle=C.curT; ctx.font='700 9px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='bottom'; ctx.fillText('i', ix, gy-8); }
    // output top-right
    ctx.textAlign='right'; ctx.textBaseline='alphabetic'; ctx.font='600 11px "JetBrains Mono", monospace'; ctx.fillStyle=C.grnT;
    ctx.fillText('輸出:['+s.out.join(', ')+']', w-PAD, 15);

    // ---- BAND 2 · deque ----
    const b2=98;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 單調遞減隊列(存索引;左=front=max · 右=back)', PAD, b2);
    const dqy=b2+14, dqh=42, dw=64, dgap=14;
    if(s.dq.length===0){
      ctx.fillStyle=C.offT; ctx.font='600 13px "Noto Sans TC", sans-serif'; ctx.textAlign='left'; ctx.textBaseline='middle';
      ctx.fillText('(空)', PAD+4, dqy+dqh/2);
    } else {
      let dx=PAD+4;
      for(let j=0;j<s.dq.length;j++){
        const idx=s.dq[j], isF=j===0;
        rr(dx,dqy,dw,dqh,7); ctx.fillStyle=isF?'#bcd9a3':C.src; ctx.fill(); ctx.lineWidth=isF?3:1.7; ctx.strokeStyle=isF?C.grnS:C.srcS; ctx.stroke();
        ctx.fillStyle=isF?C.grnT:C.srcT; ctx.font='700 18px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(String(A[idx]), dx+dw/2, dqy+dqh/2-4);
        ctx.font='600 9px "JetBrains Mono", monospace'; ctx.fillStyle=C.dim; ctx.textBaseline='top';
        ctx.fillText('idx '+idx, dx+dw/2, dqy+dqh/2+8);
        // front/back labels
        if(isF){ ctx.fillStyle=C.grnT; ctx.font='700 9px "JetBrains Mono", monospace'; ctx.textBaseline='top'; ctx.fillText('front=max', dx+dw/2, dqy+dqh+3); }
        if(j===s.dq.length-1 && s.dq.length>1){ ctx.fillStyle=C.srcT; ctx.font='700 9px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='top'; ctx.fillText('back', dx+dw/2, dqy+dqh+3); }
        dx+=dw+dgap;
      }
    }

    // ---- BAND 3 · action ----
    const by=196;
    ctx.fillStyle=C.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 彈 back(≤nums[i])→ 彈 front(過期)→ push i', PAD, by);
    rr(PAD,by+10,w-PAD*2,44,6); ctx.fillStyle=done?C.grn:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?C.grnS:C.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='600 12.5px "Noto Sans TC", sans-serif';
    let msg,col=C.text;
    if(s.act==='intro'){ msg='隊列值單調遞減 → front 恆為視窗最大;每個索引進出各一次 → O(n)'; }
    else if(done){ msg='完成 · 每個元素最多進出隊列一次 · O(n) 時間 · O(k) 空間'; col=C.grnT; }
    else if(s.act==='popback'){ msg='nums[i] ≥ back 值 → 彈掉 back(它被 i 蓋過,永不再當最大)'; col=C.curT; }
    else if(s.act==='popfront'){ msg='front 索引滑出視窗(≤ i−k)→ 彈掉 front(過期失效)'; col=C.curT; }
    else { msg='nums[i] 較小 → 直接 push 到 back,維持遞減'; col=C.srcT; }
    ctx.fillStyle=col; ctx.fillText(msg, w/2, by+32);
  }

  function update(){ const s=steps[step]; if(stepEl) stepEl.textContent=String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0'); if(labelEl) labelEl.innerHTML=s.text; draw(); }
  function next(){ if(step<steps.length-1){step++;update();}else stop(); }
  function prev(){ if(step>0){step--;update();} }
  function reset(){ stop(); step=0; update(); }
  function play(){ if(timer){stop();return;} bPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){stop();return;} next(); },1900); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} if(bPlay) bPlay.textContent='Play'; }
  bPrev&&bPrev.addEventListener('click',prev); bNext&&bNext.addEventListener('click',next); bPlay&&bPlay.addEventListener('click',play); bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();}); if(window.ResizeObserver){ new ResizeObserver(()=>{fit();draw();}).observe(canvas); }
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw); fit(); update();
})();
