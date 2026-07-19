/* ============================================================
   P76 · Minimum Window Substring — 可變長視窗(求最短·涵蓋 t) · viz
   求 s 中「包含 t 全部字元(含重複次數)」的最短子字串。可變長「求最短」:
   右擴張;一旦視窗「已涵蓋 t」(formed == required)就拚命縮左求最短,每次仍涵蓋就更新最短。
   O(1) 判斷涵蓋:required = t 的相異字元數;某字元在視窗內湊滿需求 → formed++;
   縮左移出使某字元不足 → formed--。
   例 s="AABC", t="ABC" → 最短 "ABC"(縮掉多餘的前導 A)。
     BAND 1  s(綠=視窗[l,r] · 紅=r · 灰=已移出)
     BAND 2  涵蓋 t?(A/B/C 各自滿足否)· formed / required
     BAND 3  達標就縮左求最短 + 目前最短
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

  const S = ['A','A','B','C'], NEED = {A:1,B:1,C:1}, TKEYS=['A','B','C'], REQ=3;
  // l, r, act, best(string|''), bestLen
  const steps = [
    { l:0, r:-1, act:'intro', best:'', text:'<strong>INITIAL</strong> · <code>s="AABC"</code>, <code>t="ABC"</code>。求最短涵蓋 t 的視窗。<code>required=3</code>(t 相異字元數);湊滿一種 → formed++,達標就縮。' },
    { l:0, r:0, act:'expand', best:'', text:'<strong>r=0 \'A\'</strong> · A 湊滿(need 1)→ <code>formed=1</code>。尚未涵蓋全部。' },
    { l:0, r:1, act:'expand', best:'', text:'<strong>r=1 \'A\'</strong> · 又一個 A(多餘,freq 轉負)→ formed 不變(=1)。' },
    { l:0, r:2, act:'expand', best:'', text:'<strong>r=2 \'B\'</strong> · B 湊滿 → <code>formed=2</code>。還差 C。' },
    { l:0, r:3, act:'hit', best:'AABC', bestLen:4, text:'<strong>r=3 \'C\'</strong> · C 湊滿 → <code>formed=3=required</code> → <strong>涵蓋 t!</strong> 記最短 "AABC"(4),開始縮左。' },
    { l:1, r:3, act:'shrink', best:'ABC', bestLen:3, text:'<strong>縮左</strong> · 移出多餘的 <code>A</code> → 仍涵蓋 t → 更新最短 <strong>"ABC"(3,更短!)</strong>。' },
    { l:2, r:3, act:'done', best:'ABC', bestLen:3, text:'<strong>再縮左</strong> · 移出 <code>A</code> 後<strong>缺 A</strong>(formed=2)→ 不涵蓋,停。掃完 → 回傳 <strong>"ABC"</strong>。' },
  ];

  function winCount(l,r){ const c={}; if(r>=0) for(let k=l;k<=r;k++) c[S[k]]=(c[S[k]]||0)+1; return c; }

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function triD(cx,cy,col){ ctx.beginPath(); ctx.moveTo(cx-6,cy-7); ctx.lineTo(cx+6,cy-7); ctx.lineTo(cx,cy+3); ctx.closePath(); ctx.fillStyle=col; ctx.fill(); }
  function triU(cx,cy,col){ ctx.beginPath(); ctx.moveTo(cx-6,cy+7); ctx.lineTo(cx+6,cy+7); ctx.lineTo(cx,cy-3); ctx.closePath(); ctx.fillStyle=col; ctx.fill(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,PAD=30; const wc=winCount(s.l,s.r);
    let formed=0; for(const k of TKEYS) if((wc[k]||0)>=NEED[k]) formed++;
    const covered = formed===REQ;
    const done = s.act==='done';
    ctx.fillStyle=C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · s(綠=視窗[l,r] · 紅=r · 灰=已移出)', PAD, 18);
    const n=S.length, cell=Math.min(76,(w-2*PAD)/n-14), gp=((w-2*PAD)-n*cell)/(n-1), gy=50, chh=46;
    for(let k=0;k<n;k++){
      const x=PAD+k*(cell+gp);
      const inWin = s.r>=0 && k>=s.l && k<=s.r;
      const isR = k===s.r;
      rr(x,gy,cell,chh,8);
      let bg=C.cell,bd=C.cellS,tc=C.text;
      if(s.r<0 || k<s.l || k>s.r){ bg=C.off; bd=C.offS; tc=C.offT; }
      if(inWin){ bg=C.grn; bd=C.grnS; tc=C.grnT; }
      if(isR){ bg=C.cur; bd=C.curS; tc=C.curT; }
      ctx.fillStyle=bg; ctx.fill(); ctx.lineWidth=isR?3:1.7; ctx.strokeStyle=bd; ctx.stroke();
      ctx.fillStyle=tc; ctx.font='700 23px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(S[k], x+cell/2, gy+chh/2);
      ctx.fillStyle=C.dim; ctx.font='600 10px "JetBrains Mono", monospace'; ctx.textBaseline='top';
      ctx.fillText(String(k), x+cell/2, gy+chh+6);
    }
    if(s.r>=0){ const rx=PAD+s.r*(cell+gp)+cell/2; triD(rx, gy-4, C.curS); ctx.fillStyle=C.curT; ctx.font='700 10px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='bottom'; ctx.fillText('r', rx, gy-10);
      const lx=PAD+s.l*(cell+gp)+cell/2; triU(lx, gy+chh+16, C.srcS); ctx.fillStyle=C.srcT; ctx.textBaseline='top'; ctx.fillText('l', lx, gy+chh+22); }
    // best so far, top-right
    if(s.best){ ctx.textAlign='right'; ctx.textBaseline='alphabetic'; ctx.font='600 11px "JetBrains Mono", monospace'; ctx.fillStyle=C.grnT; ctx.fillText('目前最短:"'+s.best+'"('+s.bestLen+')', w-PAD, 18); }

    // ---- BAND 2 · coverage chips ----
    const b2=132;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 涵蓋 t?(每種字元 視窗數/需求)· formed / required', PAD, b2);
    rr(PAD,b2+10,w-PAD*2,42,6); ctx.fillStyle=covered?C.grn:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=covered?C.grnS:C.grid; ctx.stroke();
    let cx=PAD+16, cyc=b2+31;
    for(const k of TKEYS){
      const have=wc[k]||0, ok=have>=NEED[k];
      const cw=58, ch=26;
      rr(cx,cyc-ch/2,cw,ch,6); ctx.fillStyle=ok?C.grn:C.off; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=ok?C.grnS:C.offS; ctx.stroke();
      ctx.fillStyle=ok?C.grnT:C.offT; ctx.font='700 13px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(k+' '+have+'/'+NEED[k]+(ok?' ✓':''), cx+cw/2, cyc);
      cx+=cw+10;
    }
    ctx.textAlign='right'; ctx.textBaseline='middle'; ctx.font='700 14px "JetBrains Mono", monospace';
    ctx.fillStyle=covered?C.grnT:C.text; ctx.fillText('formed '+formed+' / '+REQ+(covered?'  ✓涵蓋':''), w-PAD-14, cyc);

    // ---- BAND 3 ----
    const by=196;
    ctx.fillStyle=C.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · formed<required 擴張;==required 縮左(求最短)', PAD, by);
    rr(PAD,by+10,w-PAD*2,44,6); ctx.fillStyle=done?C.grn:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?C.grnS:C.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='600 12.5px "Noto Sans TC", sans-serif';
    let msg,col=C.text;
    if(s.act==='intro'){ msg='formed 記「已滿足的字元種類數」→ O(1) 判斷是否涵蓋 t'; }
    else if(done){ msg='完成 · 最短涵蓋 t 的視窗 = "ABC" · O(m+n)'; col=C.grnT; }
    else if(s.act==='shrink'){ msg='移出後仍涵蓋 t → 視窗更短且合格 → 更新最短'; col=C.grnT; }
    else if(s.act==='hit'){ msg='首次涵蓋 → 記最短,接著縮左看能不能更短'; col=C.grnT; }
    else { msg='還沒涵蓋 t(formed<required)→ r 擴張'; col=C.srcT; }
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
