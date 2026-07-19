/* ============================================================
   P189 · Rotate Array — 三次反轉 · 原地 O(1) · viz
   右轉 k 格 = 把尾端 k 個搬到最前面。三次反轉達成:
     ① 反轉整個陣列   ② 反轉前 k 個   ③ 反轉其餘 n-k 個
   反轉本身就是「對撞雙指針」(l、r 往中間交換)。
   例 [1,2,3,4,5,6,7], k=3(尾 3 個 5,6,7 = 綠塊 B;前 4 個 = 藍塊 A):
     全反 [7,6,5,4,3,2,1] → 前3反 [5,6,7,4,3,2,1] → 後4反 [5,6,7,1,2,3,4]。
   每格用「來源區塊」上色,看兩塊互換位置、又各自恢復順序。
     BAND 1  陣列(藍=原前段 A · 綠=原尾段 B · 紅框=本步反轉的區段)
     BAND 2  這一步反轉的區間與結果
     BAND 3  三次反轉的邏輯
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

  const K = 3;                          // 右轉 3;值 1..4 = 藍塊 A,5..7 = 綠塊 B
  // arr 狀態, seg=[s,e] 剛反轉的區段(含端點,null=無), act, text
  const steps = [
    { arr:[1,2,3,4,5,6,7], seg:null, act:'intro', text:'<strong>INITIAL</strong> · <code>[1,2,3,4,5,6,7]</code>, k=3。右轉 3 格 = 把<strong>尾端 3 個</strong>(綠塊 <code>5,6,7</code>)搬到最前面。用三次反轉、原地完成。' },
    { arr:[7,6,5,4,3,2,1], seg:[0,6], act:'rev', label:'reverse(0, n)', text:'<strong>① 反轉整個陣列</strong> → <code>[7,6,5,4,3,2,1]</code>。尾段 <code>5,6,7</code> 已到前面,但<strong>順序反了</strong>(變 7,6,5);前段也是。' },
    { arr:[5,6,7,4,3,2,1], seg:[0,2], act:'rev', label:'reverse(0, k)', text:'<strong>② 反轉前 k=3 個</strong> → <code>[5,6,7,...]</code>。把前 3 個 <code>7,6,5</code> 再反回 <code>5,6,7</code> —— 綠塊順序<strong>恢復</strong>。' },
    { arr:[5,6,7,1,2,3,4], seg:[3,6], act:'done', label:'reverse(k, n)', text:'<strong>③ 反轉其餘 n-k=4 個</strong> → <code>[5,6,7,1,2,3,4]</code>。後 4 個 <code>4,3,2,1</code> 反回 <code>1,2,3,4</code> —— 藍塊恢復。<strong>完成!</strong>' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,PAD=30;
    ctx.fillStyle=C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · nums(藍=原前段 A · 綠=原尾段 B · 紅框=本步反轉區段)', PAD, 18);
    const n=s.arr.length, cell=Math.min(72,(w-2*PAD)/n-10), gp=((w-2*PAD)-n*cell)/(n-1), gy=50, chh=44;
    for(let k=0;k<n;k++){
      const x=PAD+k*(cell+gp);
      const v=s.arr[k];
      const isB = v>=5;                       // 5,6,7 是原尾段 B(綠);1..4 是 A(藍)
      const inSeg = s.seg && k>=s.seg[0] && k<=s.seg[1];
      rr(x,gy,cell,chh,8);
      let bg = isB?C.grn:C.src, bd = isB?C.grnS:C.srcS, tc = isB?C.grnT:C.srcT;
      ctx.fillStyle=bg; ctx.fill();
      ctx.lineWidth = inSeg?3:1.7; ctx.strokeStyle = inSeg?C.curS:bd; ctx.stroke();
      ctx.fillStyle=tc; ctx.font='700 21px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(v), x+cell/2, gy+chh/2);
      ctx.fillStyle=C.dim; ctx.font='600 10px "JetBrains Mono", monospace'; ctx.textBaseline='top';
      ctx.fillText(String(k), x+cell/2, gy+chh+6);
    }
    // reversed-segment bracket + label
    if(s.seg){
      const x0=PAD+s.seg[0]*(cell+gp), x1=PAD+s.seg[1]*(cell+gp)+cell, by=gy+chh+20;
      ctx.strokeStyle=C.curS; ctx.lineWidth=2; ctx.beginPath();
      ctx.moveTo(x0,by); ctx.lineTo(x0,by+5); ctx.lineTo(x1,by+5); ctx.lineTo(x1,by); ctx.stroke();
      ctx.fillStyle=C.curT; ctx.font='700 10px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='top';
      ctx.fillText('↔ reversed', (x0+x1)/2, by+8);
    }

    // ---- BAND 2 ----
    const b2=134;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 反轉 = 對撞雙指針(l、r 往中間交換)', PAD, b2);
    rr(PAD,b2+10,w-PAD*2,40,6); ctx.fillStyle=s.act==='done'?C.grn:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=s.act==='done'?C.grnS:C.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='700 14px "JetBrains Mono", monospace'; ctx.fillStyle=C.text;
    if(s.act==='intro'){ ctx.fillText('k %= n → 3 · 右轉 k = [尾 k 個] + [前 n-k 個]', w/2, b2+30); }
    else { ctx.fillText(s.label+'  →  ['+s.arr.join(', ')+']', w/2, b2+30); }

    // ---- BAND 3 ----
    const by=196;
    ctx.fillStyle=C.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · reverse 全部 → reverse 前 k → reverse 其餘', PAD, by);
    rr(PAD,by+10,w-PAD*2,44,6); ctx.fillStyle=s.act==='done'?C.grn:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=s.act==='done'?C.grnS:C.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='600 12.5px "Noto Sans TC", sans-serif';
    let msg,col=C.text;
    if(s.act==='intro'){ msg='全反把兩塊互換位置,但各自順序反了;再分別反回來'; }
    else if(s.act==='done'){ msg='完成 · 兩塊都恢復順序且位置互換 · 原地 O(n)/O(1)'; col=C.grnT; }
    else if(step===1){ msg='① 整個反轉:A、B 兩塊位置互換(但內部順序都反了)'; col=C.curT; }
    else { msg='② 反轉前 k:綠塊 B 內部順序恢復正確'; col=C.grnT; }
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
