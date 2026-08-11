/* ============================================================
   P71 · Simplify Path — 以 '/' 切段 + 目錄堆疊 · viz
   把路徑用 '/' 切成一段段。空段("" 來自 // 或首尾)與 "." → 跳過;
   ".." → 若堆疊非空就 pop(回上層);其餘(含 "...","...." 等)→ 當合法目錄名 push。
   最後把堆疊由底到頂用 '/' 串起;空則回 "/"。
   例 /home/../.../foo/ → /.../foo
     BAND 1  切出的段(紅=目前 · 藍=目錄名 push · 灰=跳過 · 橘=.. pop)
     BAND 2  目錄堆疊(左=底 · 右=top)
     BAND 3  目前結果 / 本步動作
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
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424', off:'#eceae2', offS:'#c9c6ba', offT:'#8a8672',
    coral:'#cf3535', amb:'#e0b37a', ambT:'#9a6a1f' };

  const PATH = '/home/../.../foo/';
  // split '/home/../.../foo/' by '/': ["","home","..","...","foo",""]
  const SEG = ['∅','home','..','...','foo','∅'];   // ∅ = empty component
  const RAW = ['','home','..','...','foo',''];
  // per step: cur seg idx, stack[], act, result string
  const steps = [
    { cur:-1, stack:[], act:'intro', text:'<strong>INITIAL</strong> · 用 <code>/</code> 把路徑切成段。空段(來自 <code>//</code> 或首尾)與 <code>.</code> 跳過;<code>..</code> 退回上層;其餘當<strong>目錄名</strong>。' },
    { cur:0, stack:[], act:'skip', text:'<strong>段 = ""</strong>(開頭 <code>/</code> 造成的空段)· 空 → <strong>跳過</strong>。' },
    { cur:1, stack:['home'], act:'push', text:'<strong>"home"</strong> · 一般名稱 → <strong>push</strong>。堆疊 [home]。' },
    { cur:2, stack:[], act:'pop', text:'<strong>".."</strong> · 回上層 → 堆疊非空就 <strong>pop</strong>。[home] → []。' },
    { cur:3, stack:['...'], act:'push', text:'<strong>"..."</strong> · <strong>三個點是合法目錄名</strong>,不是「上上層」!→ push。堆疊 [...]。' },
    { cur:4, stack:['...','foo'], act:'push', text:'<strong>"foo"</strong> · 一般名稱 → push。堆疊 [..., foo]。' },
    { cur:5, stack:['...','foo'], act:'skip', text:'<strong>段 = ""</strong>(結尾 <code>/</code> 的空段)· 空 → 跳過。' },
    { cur:6, stack:['...','foo'], act:'done', text:'<strong>完成</strong> · 由底到頂用 <code>/</code> 串起 → <code>/.../foo</code>。空堆疊則回 <code>/</code>。O(n)。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function triD(cx,cy,col){ ctx.beginPath(); ctx.moveTo(cx-6,cy-7); ctx.lineTo(cx+6,cy-7); ctx.lineTo(cx,cy+3); ctx.closePath(); ctx.fillStyle=col; ctx.fill(); }

  function result(stk){ return stk.length ? '/'+stk.join('/') : '/'; }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,PAD=30; const done=s.act==='done';
    ctx.fillStyle=C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);
    // ── BAND 1 · segments ──
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 以 / 切出的段(紅=目前 · 藍=push · 灰=跳過 · 橘=.. pop)', PAD, 18);
    const gy=42, chh=34; let x=PAD+2;
    const gap=10;
    // measure widths
    ctx.font='700 14px "JetBrains Mono", monospace';
    for(let k=0;k<SEG.length;k++){
      const seg=SEG[k], raw=RAW[k];
      const isCur=k===s.cur, doneIt=(s.cur>=0&&k<s.cur)||done;
      const label = raw==='' ? '∅' : raw;
      const cwSeg=Math.max(42, ctx.measureText(label).width+22);
      let bg=C.cell,bd=C.cellS,tc=C.text;
      if(raw==='..'){ bg='#faf0dd'; bd=C.amb; tc=C.ambT; }
      else if(raw==='.'||raw===''){ bg=C.off; bd=C.offS; tc=C.offT; }
      else { bg=C.src; bd=C.srcS; tc=C.srcT; }
      if(doneIt && (raw===''||raw==='.'||raw==='..')){ /* keep role tint but dim a touch */ }
      if(isCur){ bg=C.cur; bd=C.curS; tc=C.curT; }
      rr(x,gy,cwSeg,chh,7); ctx.fillStyle=bg; ctx.fill(); ctx.lineWidth=isCur?3:1.7; ctx.strokeStyle=bd; ctx.stroke();
      ctx.fillStyle=tc; ctx.font='700 14px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(label, x+cwSeg/2, gy+chh/2);
      x+=cwSeg+gap;
      ctx.font='700 14px "JetBrains Mono", monospace';
    }

    // ── BAND 2 · directory stack ──
    const b2=98;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 目錄堆疊(左=底 · 右=top · 綠=剛 push)', PAD, b2);
    const sy=b2+22; let sx=PAD+4;
    if(s.stack.length===0){ ctx.fillStyle=C.offT; ctx.font='600 13px "Noto Sans TC", sans-serif'; ctx.textBaseline='middle'; ctx.fillText('(空 → 結果 "/")', sx, sy+22); }
    ctx.font='700 15px "JetBrains Mono", monospace';
    for(let k=0;k<s.stack.length;k++){
      const d=s.stack[k]; const isTop=k===s.stack.length-1; const just=isTop && s.act==='push';
      const cwD=Math.max(52, ctx.measureText(d).width+24);
      rr(sx,sy,cwD,44,8); ctx.fillStyle=just?C.grn:(isTop?'#eef4fb':C.src); ctx.fill(); ctx.lineWidth=isTop?3:1.7; ctx.strokeStyle=just?C.grnS:C.srcS; ctx.stroke();
      ctx.fillStyle=just?C.grnT:C.srcT; ctx.font='700 15px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(d, sx+cwD/2, sy+22);
      if(isTop){ triD(sx+cwD/2, sy-3, C.srcT); ctx.fillStyle=C.srcT; ctx.font='700 9px "JetBrains Mono", monospace'; ctx.textBaseline='bottom'; ctx.fillText('top', sx+cwD/2, sy-9); }
      sx+=cwD+12;
    }

    // ── BAND 3 · result + action ──
    const by=186;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 目前結果 = 堆疊由底到頂用 / 串起', PAD, by);
    rr(PAD, by+10, w-PAD*2, 34, 6); ctx.fillStyle=done?C.grn:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?C.grnS:C.grid; ctx.stroke();
    ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.font='700 15px "JetBrains Mono", monospace'; ctx.fillStyle=done?C.grnT:C.srcT;
    ctx.fillText('result = '+result(s.stack), PAD+12, by+27);

    const ay=by+54;
    rr(PAD,ay,w-PAD*2,40,6); ctx.fillStyle=done?C.grn:(s.act==='pop'?'#faf0dd':(s.act==='push'?C.grn:'#fafaf6')); ctx.fill(); ctx.lineWidth=1.6;
    ctx.strokeStyle=done?C.grnS:(s.act==='pop'?C.amb:(s.act==='push'?C.grnS:C.grid)); ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='600 12.5px "Noto Sans TC", sans-serif';
    let msg,col=C.text;
    if(s.act==='intro'){ msg="切段後只有四種段:空、'.'、'..'、名稱"; }
    else if(done){ msg='由底到頂串起即標準路徑;空堆疊 → "/"'; col=C.grnT; }
    else if(s.act==='pop'){ msg="'..' → 回上層,堆疊非空才 pop(空就忽略)"; col=C.ambT; }
    else if(s.act==='push'){ msg='一般名稱(含 "…","…." 等)→ push 進堆疊'; col=C.grnT; }
    else { msg="空段(// 或首尾)與 '.' → 直接跳過"; col=C.offT; }
    ctx.fillStyle=col; ctx.fillText(msg, w/2, ay+20);
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
