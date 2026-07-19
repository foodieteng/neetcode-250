/* ============================================================
   P88 · Merge Sorted Array — 平行雙指針 · 從後往前填 · viz
   nums1 尾端有 n 個空位。三指針:l = nums1 有效尾(m-1)、r = nums2 尾(n-1)、
   i = 寫入位(m+n-1)。比 nums1[l] 與 nums2[r],把「較大」的放到 i,再往前移。
   從後往前寫 → 寫入位 i 永遠 >= 未讀的 l,絕不覆蓋還沒讀的 nums1 資料。
   nums1 先用完就把 nums2 剩下的補上;nums2 先用完則 nums1 剩下的本來就在原位。
   例 nums1=[1,2,3,_,_,_], nums2=[2,5,6] → [1,2,2,3,5,6]。
     BAND 1  nums1(藍=未讀 · 綠=已放好 · 紅=寫入位 i)/ nums2(綠=未讀 · 灰=已用)
     BAND 2  本步比較:較大者放到後面
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

  const N2 = [2,5,6];
  // 每步:nums1 顯示(· = 空)、l, r, i, placed(剛寫入的 idx), from('1'|'2'), done
  const steps = [
    { d1:['1','2','3','·','·','·'], l:2, r:2, i:5, phase:'intro', text:'<strong>INITIAL</strong> · <code>nums1=[1,2,3,_,_,_]</code>、<code>nums2=[2,5,6]</code>。三指針:<code>l</code>=nums1 有效尾、<code>r</code>=nums2 尾、<code>i</code>=寫入位(最後面)。' },
    { d1:['1','2','3','·','·','6'], l:2, r:1, i:4, placed:5, from:'2', cmp:['3','6'], text:'<strong>比較</strong> · <code>nums1[2]=3</code> vs <code>nums2[2]=6</code> → <strong>6 較大</strong>,放到 <code>i=5</code>。<code>r--、i--</code>。' },
    { d1:['1','2','3','·','5','6'], l:2, r:0, i:3, placed:4, from:'2', cmp:['3','5'], text:'<strong>比較</strong> · <code>3</code> vs <code>5</code> → <strong>5 較大</strong>,放到 <code>i=4</code>。' },
    { d1:['1','2','3','3','5','6'], l:1, r:0, i:2, placed:3, from:'1', cmp:['3','2'], text:'<strong>比較</strong> · <code>nums1[2]=3</code> vs <code>nums2[0]=2</code> → <strong>3 較大</strong>,放到 <code>i=3</code>。這次取自 nums1 → <code>l--</code>。' },
    { d1:['1','2','2','3','5','6'], l:1, r:-1, i:1, placed:2, from:'2', cmp:['2','2'], text:'<strong>比較</strong> · <code>nums1[1]=2</code> vs <code>nums2[0]=2</code> → 不大於 → 取 nums2 的 <code>2</code> 放到 <code>i=2</code>(覆蓋掉已複製走的舊 3)。nums2 用完。' },
    { d1:['1','2','2','3','5','6'], l:1, r:-1, i:1, done:true, text:'<strong>結束</strong> · nums2 用完 → nums1 前面剩下的 <code>[1,2]</code> <strong>本來就在原位、已排序</strong>,不用動。完成 <code>[1,2,2,3,5,6]</code>。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function tri(cx,cy,col){ ctx.beginPath(); ctx.moveTo(cx-6,cy+7); ctx.lineTo(cx+6,cy+7); ctx.lineTo(cx,cy-3); ctx.closePath(); ctx.fillStyle=col; ctx.fill(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,PAD=30;
    ctx.fillStyle=C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);
    const RX = PAD + 52, cell=44, gp=8;
    const Y1 = 40, Y2 = 104;
    // BAND 1
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 從後往前填(藍=未讀 · 綠=已放好 · 紅=寫入位 i)', PAD, 16);
    ctx.fillStyle=C.srcT; ctx.font='700 11px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='middle';
    ctx.fillText('nums1', PAD, Y1+cell/2);
    ctx.fillStyle=C.grnT; ctx.fillText('nums2', PAD, Y2+cell/2);
    // nums1 row (6 cells)
    for(let k=0;k<6;k++){
      const x=RX+k*(cell+gp), y=Y1;
      const ch=s.d1[k];
      const isWrite = k===s.i && !s.done;
      const placed = k>s.i || s.done;         // 已放好(在寫入位之後)
      const unread = k<=s.l;                   // 未讀的 nums1 有效元素
      const justPlaced = k===s.placed;
      rr(x,y,cell,cell,7);
      let bg=C.cell,bd=C.cellS,tc=C.text;
      if(placed){ bg=C.grn; bd=C.grnS; tc=C.grnT; }
      if(unread && !s.done){ bg=C.src; bd=C.srcS; tc=C.srcT; }
      if(isWrite){ bg=C.cur; bd=C.curS; tc=C.curT; }
      ctx.fillStyle=bg; ctx.fill(); ctx.lineWidth=(isWrite||justPlaced)?3:1.6; ctx.strokeStyle=justPlaced?C.grnS:bd; ctx.stroke();
      ctx.fillStyle=ch==='·'?C.dim:tc; ctx.font='700 18px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(ch, x+cell/2, y+cell/2);
      ctx.fillStyle=C.dim; ctx.font='600 9px "JetBrains Mono", monospace'; ctx.textBaseline='top';
      ctx.fillText(String(k), x+cell/2, y+cell+3);
    }
    // nums2 row (3 cells)
    for(let k=0;k<3;k++){
      const x=RX+k*(cell+gp), y=Y2;
      const used = k>s.r;
      const isR = k===s.r && !s.done;
      rr(x,y,cell,cell,7);
      let bg=C.grn,bd=C.grnS,tc=C.grnT;
      if(used){ bg=C.off; bd=C.offS; tc=C.offT; }
      if(isR){ bg=C.cur; bd=C.curS; tc=C.curT; }
      ctx.fillStyle=bg; ctx.fill(); ctx.lineWidth=isR?3:1.6; ctx.strokeStyle=bd; ctx.stroke();
      ctx.fillStyle=tc; ctx.font='700 18px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(N2[k]), x+cell/2, y+cell/2);
      ctx.fillStyle=C.dim; ctx.font='600 9px "JetBrains Mono", monospace'; ctx.textBaseline='top';
      ctx.fillText(String(k), x+cell/2, y+cell+3);
    }
    // pointers — l & i above nums1, r above nums2
    ctx.font='700 10px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='bottom';
    if(!s.done){
      const same = s.i===s.l;
      if(s.l>=0){ const lx=RX+s.l*(cell+gp)+cell/2 - (same?11:0); tri(lx,Y1-7,C.srcS); ctx.fillStyle=C.srcT; ctx.fillText('l',lx,Y1-9); }
      if(s.i>=0){ const ix=RX+s.i*(cell+gp)+cell/2 + (same?11:0); tri(ix,Y1-7,C.curS); ctx.fillStyle=C.curT; ctx.fillText('i',ix,Y1-9); }
      if(s.r>=0){ const rx=RX+s.r*(cell+gp)+cell/2; tri(rx,Y2-7,C.curS); ctx.fillStyle=C.curT; ctx.fillText('r',rx,Y2-9); }
    }
    // BAND 2
    const by=172;
    ctx.fillStyle=C.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · nums1[l] 與 nums2[r] 取較大放到 i,往前移', PAD, by);
    rr(PAD,by+10,w-PAD*2,44,6); ctx.fillStyle=s.done?C.grn:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=s.done?C.grnS:C.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='600 12.5px "Noto Sans TC", sans-serif';
    let msg,col=C.text;
    if(s.done){ msg='完成 · 寫入位 i 永遠 ≥ 未讀 l,絕不覆蓋 → 原地 O(m+n)'; col=C.grnT; }
    else if(s.phase==='intro'){ msg='關鍵:從「後面的空位」開始填,才不會蓋掉還沒讀的 nums1'; }
    else { msg='取自 '+(s.from==='1'?'nums1':'nums2')+':'+s.cmp[0]+' vs '+s.cmp[1]+' → 較大放到 i='+(s.i+1); col=(s.from==='1'?C.srcT:C.grnT); }
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
