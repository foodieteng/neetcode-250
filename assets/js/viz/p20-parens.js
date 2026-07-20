/* ============================================================
   P20 · Valid Parentheses — 堆疊括號匹配 · viz
   遇「左括號」→ push;遇「右括號」→ 堆疊頂端必須是「對應的左括號」,
   是就 pop(配對成功),否則(空堆疊或不匹配)立刻 invalid。掃完堆疊要「空」。
   關鍵:最近的左括號要先被閉合(巢狀)→ 後進先出,正是堆疊。
   例 "([])" → 合法。
     BAND 1  字串(藍=待配的左括號 · 紅=目前字元 · 綠=剛配成)
     BAND 2  堆疊(未閉合的左括號 · 右=top)
     BAND 3  本步:push / 配對 pop / 檢查頂端
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

  const S = ['(','[',']',')'];
  // i(current char idx), stack(open brackets), matched(idx pair flash or -1), popped(char|null), act, text
  const steps = [
    { i:-1, stack:[], popped:null, act:'intro', text:'<strong>INITIAL</strong> · <code>"([])"</code>。左括號 → push;右括號 → 頂端必須是對應左括號才 pop,否則不合法。最後堆疊要空。' },
    { i:0, stack:['('], popped:null, act:'push', text:'<strong>\'(\'</strong> · 左括號 → <strong>push \'(\'</strong>。堆疊 [(] 。' },
    { i:1, stack:['(','['], popped:null, act:'push', text:'<strong>\'[\'</strong> · 左括號 → <strong>push \'[\'</strong>。堆疊 [( []。' },
    { i:2, stack:['('], popped:'[', act:'match', text:'<strong>\']\'</strong> · 右括號 · 頂端是 <code>\'[\'</code> = 對應左括號 → <strong>配對成功,pop</strong>。堆疊 [(] 。' },
    { i:3, stack:[], popped:'(', act:'match', text:'<strong>\')\'</strong> · 右括號 · 頂端是 <code>\'(\'</code> = 對應 → <strong>配對成功,pop</strong>。堆疊空。' },
    { i:4, stack:[], popped:null, act:'done', text:'<strong>完成</strong> · 掃完且堆疊為<strong>空</strong> → 每個括號都配對到 → <strong>合法 valid ✓</strong>。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function triD(cx,cy,col){ ctx.beginPath(); ctx.moveTo(cx-6,cy-7); ctx.lineTo(cx+6,cy-7); ctx.lineTo(cx,cy+3); ctx.closePath(); ctx.fillStyle=col; ctx.fill(); }
  const isOpen = c => c==='('||c==='['||c==='{';

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,PAD=30; const done=s.act==='done';
    ctx.fillStyle=C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);
    // ---- BAND 1 · string ----
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · s(紅=目前字元 · 灰=已處理)', PAD, 18);
    const n=S.length, cell=Math.min(60,(w-2*PAD)/n-12), gp=((w-2*PAD)-n*cell)/(n-1), gy=42, chh=40;
    for(let k=0;k<n;k++){
      const x=PAD+k*(cell+gp);
      const isCur = k===s.i;
      const doneCh = (s.i>=0 && k<s.i) || done;
      rr(x,gy,cell,chh,7);
      let bg=C.cell,bd=C.cellS,tc=C.text;
      if(doneCh){ bg=C.off; bd=C.offS; tc=C.offT; }
      if(isCur){ bg=C.cur; bd=C.curS; tc=C.curT; }
      ctx.fillStyle=bg; ctx.fill(); ctx.lineWidth=isCur?3:1.6; ctx.strokeStyle=bd; ctx.stroke();
      ctx.fillStyle=tc; ctx.font='700 20px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(S[k], x+cell/2, gy+chh/2);
    }

    // ---- BAND 2 · stack ----
    const b2=100;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 堆疊(未閉合的左括號 · 右=top · 綠=剛配成 pop)', PAD, b2);
    const sy=b2+22, scell=50, sgp=12; let sx=PAD+4;
    if(s.stack.length===0 && !s.popped){ ctx.fillStyle=done?C.grnT:C.offT; ctx.font='600 13px "Noto Sans TC", sans-serif'; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText(done?'空 ✓':'(空)', sx, sy+22); }
    for(let k=0;k<s.stack.length;k++){
      rr(sx,sy,scell,44,7); const isTop=k===s.stack.length-1;
      ctx.fillStyle=C.src; ctx.fill(); ctx.lineWidth=isTop?3:1.7; ctx.strokeStyle=C.srcS; ctx.stroke();
      ctx.fillStyle=C.srcT; ctx.font='700 20px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(s.stack[k], sx+scell/2, sy+22);
      if(isTop){ triD(sx+scell/2, sy-3, C.srcT); ctx.fillStyle=C.srcT; ctx.font='700 9px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='bottom'; ctx.fillText('top', sx+scell/2, sy-9); }
      sx+=scell+sgp;
    }
    // matched (popped) bracket flashing green with the closer
    if(s.popped!==null){
      rr(sx,sy,scell,44,7); ctx.fillStyle=C.grn; ctx.fill(); ctx.lineWidth=2.4; ctx.strokeStyle=C.grnS; ctx.setLineDash([4,3]); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=C.grnT; ctx.font='700 20px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(s.popped+S[s.i], sx+scell/2, sy+22);
      ctx.fillStyle=C.grnT; ctx.font='700 9px "JetBrains Mono", monospace'; ctx.textBaseline='top'; ctx.fillText('✓ match', sx+scell/2, sy+48);
    }

    // ---- BAND 3 ----
    const by=190;
    ctx.fillStyle=C.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 左括號 push · 右括號:頂端=對應左括號 → pop', PAD, by);
    rr(PAD,by+10,w-PAD*2,44,6); ctx.fillStyle=(s.act==='match'||done)?C.grn:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=(s.act==='match'||done)?C.grnS:C.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='600 12.5px "Noto Sans TC", sans-serif';
    let msg,col=C.text;
    if(s.act==='intro'){ msg='巢狀 → 最近的左括號要先閉合 → 後進先出 = 堆疊'; }
    else if(done){ msg='堆疊空 = 全部配對 → 合法。(若剩左括號 → 不合法)'; col=C.grnT; }
    else if(s.act==='match'){ msg='右括號 · 頂端正是對應左括號 → 配對成功、pop'; col=C.grnT; }
    else { msg='左括號 → push,等待之後對應的右括號來配'; col=C.srcT; }
    ctx.fillStyle=col; ctx.fillText(msg, w/2, by+32);
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
