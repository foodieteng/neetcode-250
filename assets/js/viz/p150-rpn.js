/* ============================================================
   P150 · Evaluate Reverse Polish Notation — 堆疊求值 · viz
   逆波蘭式:數字就 push;遇到運算子就 pop 兩個(先 y 後 x),算 x op y 再 push 回去。
   最後堆疊剩下的唯一元素就是答案。順序關鍵:先彈的是右運算元 y,後彈的是左運算元 x。
   例 ["2","1","+","3","*"] → (2+1)*3 = 9。
     BAND 1  token 序列(紅=目前 · 灰=已處理)
     BAND 2  數字堆疊(右=top)
     BAND 3  本步動作
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

  const TOK = ['2','1','+','3','*'];
  // stack: current int stack. pushed: idx of new top (-1). expr: "x op y = r" string on op step.
  const steps = [
    { cur:-1, stack:[], pushed:-1, act:'intro', expr:'', text:'<strong>INITIAL</strong> · 逆波蘭式:數字就 <code>push</code>;遇運算子 <code>pop</code> 兩個算完再 push。求 <code>["2","1","+","3","*"]</code>。' },
    { cur:0, stack:[2], pushed:0, act:'num', expr:'', text:'<strong>"2"</strong> · 數字 → <code>push 2</code>。堆疊 [2]。' },
    { cur:1, stack:[2,1], pushed:1, act:'num', expr:'', text:'<strong>"1"</strong> · 數字 → <code>push 1</code>。堆疊 [2,1](top=1)。' },
    { cur:2, stack:[3], pushed:0, act:'op', expr:'2 + 1 = 3', text:'<strong>"+"</strong> · 先 pop <code>y=1</code>、再 pop <code>x=2</code> → 算 <code>x+y = 2+1 = 3</code> → push。堆疊 [3]。' },
    { cur:3, stack:[3,3], pushed:1, act:'num', expr:'', text:'<strong>"3"</strong> · 數字 → <code>push 3</code>。堆疊 [3,3]。' },
    { cur:4, stack:[9], pushed:0, act:'op', expr:'3 * 3 = 9', text:'<strong>"*"</strong> · pop <code>y=3</code>、pop <code>x=3</code> → <code>x*y = 3*3 = 9</code> → push。堆疊 [9]。' },
    { cur:5, stack:[9], pushed:-1, act:'done', expr:'', text:'<strong>完成</strong> · token 掃完,堆疊剩唯一元素 <code>9</code> = 答案。一趟 O(n)。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function triD(cx,cy,col){ ctx.beginPath(); ctx.moveTo(cx-6,cy-7); ctx.lineTo(cx+6,cy-7); ctx.lineTo(cx,cy+3); ctx.closePath(); ctx.fillStyle=col; ctx.fill(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,PAD=30; const done=s.act==='done';
    ctx.fillStyle=C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);
    // ── BAND 1 · tokens ──
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · tokens(紅=目前處理 · 灰=已完成)', PAD, 20);
    const m=TOK.length, ocell=Math.min(62,(w-2*PAD)/m-12), ogp=((w-2*PAD)-m*ocell)/(m-1), oy=40, ochh=40;
    for(let k=0;k<m;k++){
      const x=PAD+k*(ocell+ogp);
      const isCur = k===s.cur;
      const doneOp = (s.cur>=0 && k<s.cur) || done;
      const isOp = TOK[k]==='+'||TOK[k]==='-'||TOK[k]==='*'||TOK[k]==='/';
      rr(x,oy,ocell,ochh,7);
      let bg=C.cell,bd=C.cellS,tc=C.text;
      if(isOp){ bg='#eef1f6'; }
      if(doneOp){ bg=C.off; bd=C.offS; tc=C.offT; }
      if(isCur){ bg=C.cur; bd=C.curS; tc=C.curT; }
      ctx.fillStyle=bg; ctx.fill(); ctx.lineWidth=isCur?3:1.6; ctx.strokeStyle=bd; ctx.stroke();
      ctx.fillStyle=tc; ctx.font='700 18px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(TOK[k], x+ocell/2, oy+ochh/2);
    }

    // ── BAND 2 · int stack ──
    const b2=104;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 數字堆疊(右=top · 綠=剛 push 的結果)', PAD, b2);
    const sy=b2+20, scell=54, sgp=14; let sx=PAD+4;
    if(s.stack.length===0){ ctx.fillStyle=C.offT; ctx.font='600 13px "Noto Sans TC", sans-serif'; ctx.textBaseline='middle'; ctx.fillText('(空)', sx, sy+24); }
    for(let k=0;k<s.stack.length;k++){
      const isNew = k===s.pushed;
      rr(sx,sy,scell,48,7); ctx.fillStyle=isNew?C.grn:C.src; ctx.fill(); ctx.lineWidth=isNew?3:1.7; ctx.strokeStyle=isNew?C.grnS:C.srcS; ctx.stroke();
      ctx.fillStyle=isNew?C.grnT:C.srcT; ctx.font='700 20px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(s.stack[k]), sx+scell/2, sy+24);
      if(k===s.stack.length-1){ triD(sx+scell/2, sy-3, C.srcT); ctx.fillStyle=C.srcT; ctx.font='700 9px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='bottom'; ctx.fillText('top', sx+scell/2, sy-9); }
      sx+=scell+sgp;
    }
    // expression on op step (top-right)
    if(s.expr){ ctx.textAlign='right'; ctx.textBaseline='alphabetic'; ctx.font='700 14px "JetBrains Mono", monospace'; ctx.fillStyle=C.grnT; ctx.fillText('x op y  →  '+s.expr, w-PAD, b2); }

    // ── BAND 3 ──
    const by=188;
    ctx.fillStyle=C.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 數字 push;運算子 pop y、pop x → push (x op y)', PAD, by);
    rr(PAD,by+10,w-PAD*2,44,6); ctx.fillStyle=done?C.grn:(s.act==='op'?C.grn:'#fafaf6'); ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=(done||s.act==='op')?C.grnS:C.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='600 12.5px "Noto Sans TC", sans-serif';
    let msg,col=C.text;
    if(s.act==='intro'){ msg='後綴表示式不需括號:運算子跟在它的兩個運算元之後'; }
    else if(done){ msg='掃完一趟,堆疊剩下的唯一元素就是答案 · O(n) 時間 / O(n) 空間'; col=C.grnT; }
    else if(s.act==='op'){ msg='先 pop 的是右運算元 y,後 pop 的是 x —— 減/除順序別顛倒!'; col=C.grnT; }
    else { msg='數字直接進堆疊,等它的運算子來取用'; col=C.srcT; }
    ctx.fillStyle=col; ctx.fillText(msg, w/2, by+32);
  }

  function update(){ if(stepEl) stepEl.textContent=String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0'); if(labelEl) labelEl.innerHTML=steps[step].text; draw(); }
  function next(){ if(step<steps.length-1){step++;update();}else stop(); }
  function prev(){ if(step>0){step--;update();} }
  function reset(){ stop(); step=0; update(); }
  function play(){ if(timer){stop();return;} bPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){stop();return;} next(); },1650); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} if(bPlay) bPlay.textContent='Play'; }
  bPrev&&bPrev.addEventListener('click',prev); bNext&&bNext.addEventListener('click',next); bPlay&&bPlay.addEventListener('click',play); bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();}); if(window.ResizeObserver){ new ResizeObserver(()=>{fit();draw();}).observe(canvas); }
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw); fit(); update();
})();
