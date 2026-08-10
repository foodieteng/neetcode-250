/* ============================================================
   P735 · Asteroid Collision — 單調堆疊模擬 · viz
   正數向右飛、負數向左飛。只有「堆疊頂端是正數」遇上「進來的是負數」才會撞。
   撞的時候比絕對值:頂端小 → 頂端炸、負數續飛(可連環);相等 → 兩顆都炸;
   頂端大 → 進來的炸。負數若一路撞到堆疊空或頂端是負數,就存活入堆疊。
   例 [8,-4,6,-6,-10] → [-10]。
     BAND 1  輸入小行星(→正 · ←負 · 紅=目前)
     BAND 2  堆疊(右=top · 紅=正在對撞的頂端)
     BAND 3  本步結果
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

  const IN = [8,-4,6,-6,-10];
  // stack: signed ints. hitTop: index in stack currently colliding (-1). ghosts: [{v}] just destroyed. cmp: string.
  const steps = [
    { cur:-1, stack:[], hitTop:-1, ghosts:[], cmp:'', act:'intro', text:'<strong>INITIAL</strong> · 正數向右、負數向左。只有「頂端正數」遇「進來負數」才對撞;比絕對值決定誰炸。' },
    { cur:0, stack:[8], hitTop:-1, ghosts:[], cmp:'', act:'push', text:'<strong>8</strong> · 正數 → 直接進堆疊(向右飛,不會追撞左邊已在的)。堆疊 [8]。' },
    { cur:1, stack:[8], hitTop:0, ghosts:[{v:-4}], cmp:'top 8 &gt; |−4| ⇒ −4 炸', act:'die', text:'<strong>−4</strong> · 撞頂端 8。<code>8 &gt; 4</code> → <strong>進來的 −4 爆炸</strong>,堆疊不變 [8]。' },
    { cur:2, stack:[8,6], hitTop:-1, ghosts:[], cmp:'', act:'push', text:'<strong>6</strong> · 正數 → 進堆疊。堆疊 [8,6]。' },
    { cur:3, stack:[8], hitTop:-1, ghosts:[{v:6},{v:-6}], cmp:'top 6 = |−6| ⇒ 兩顆都炸', act:'both', text:'<strong>−6</strong> · 撞頂端 6。<code>6 = 6</code> → <strong>兩顆同歸於盡</strong>,pop 6。堆疊 [8]。' },
    { cur:4, stack:[-10], hitTop:-1, ghosts:[{v:8}], cmp:'top 8 &lt; |−10| ⇒ 8 炸;堆疊空 ⇒ −10 存活', act:'survive', text:'<strong>−10</strong> · 撞頂端 8。<code>8 &lt; 10</code> → 8 炸、−10 續飛;堆疊空 → <strong>−10 存活入堆疊</strong>。[−10]。' },
    { cur:5, stack:[-10], hitTop:-1, ghosts:[], cmp:'', act:'done', text:'<strong>完成</strong> · 掃完一趟,堆疊 = <code>[−10]</code>。每顆小行星最多進出堆疊一次 → 攤還 O(n)。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function triD(cx,cy,col){ ctx.beginPath(); ctx.moveTo(cx-6,cy-7); ctx.lineTo(cx+6,cy-7); ctx.lineTo(cx,cy+3); ctx.closePath(); ctx.fillStyle=col; ctx.fill(); }
  function arrowIn(cx,cy,dir,col){ // dir +1 right, -1 left
    ctx.strokeStyle=col; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(cx-9*dir,cy); ctx.lineTo(cx+9*dir,cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx+9*dir,cy); ctx.lineTo(cx+3*dir,cy-4); ctx.lineTo(cx+3*dir,cy+4); ctx.closePath(); ctx.fillStyle=col; ctx.fill(); }

  function drawAst(cx, cy, cw, val, opts){
    const dir = val>0?1:-1;
    rr(cx,cy,cw,42,8);
    ctx.fillStyle = opts.bg; ctx.fill();
    ctx.lineWidth = opts.cur?3:1.7; ctx.strokeStyle = opts.bd;
    if(opts.ghost){ ctx.setLineDash([4,3]); } ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = opts.tc; ctx.font='700 18px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(String(val), cx+cw/2, cy+20);
    // direction arrow under
    arrowIn(cx+cw/2, cy+52, dir, opts.ghost?C.offS:(val>0?C.srcS:C.curS));
    if(opts.ghost){ ctx.fillStyle=C.curT; ctx.font='700 13px "JetBrains Mono", monospace'; ctx.textBaseline='middle'; ctx.fillText('✗', cx+cw/2, cy+20); }
  }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,PAD=30; const done=s.act==='done';
    ctx.fillStyle=C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);
    // ── BAND 1 · input ──
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 輸入小行星(→ 正 · ← 負 · 紅=目前處理 · 灰=已處理)', PAD, 18);
    const m=IN.length, cw=Math.min(64,(w-2*PAD)/m-12), gp=((w-2*PAD)-m*cw)/(m-1), oy=42;
    for(let k=0;k<m;k++){
      const x=PAD+k*(cw+gp);
      const isCur=k===s.cur, doneIt=(s.cur>=0&&k<s.cur)||done;
      let bg=C.cell,bd=C.cellS,tc=C.text;
      if(IN[k]<0){ bg='#f7ecec'; } else { bg='#eef4fb'; }
      if(doneIt){ bg=C.off; bd=C.offS; tc=C.offT; }
      if(isCur){ bg=C.cur; bd=C.curS; tc=C.curT; }
      drawAst(x, oy, cw, IN[k], {bg,bd,tc,cur:isCur,ghost:false});
    }

    // ── BAND 2 · stack ──
    const b2=124;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 堆疊(右=top · 紅=對撞中的頂端 · 虛線✗=剛炸掉)', PAD, b2);
    const sy=b2+22, scw=58, sgp=14; let sx=PAD+4;
    if(s.stack.length===0 && !s.ghosts.length){ ctx.fillStyle=C.offT; ctx.font='600 13px "Noto Sans TC", sans-serif'; ctx.textBaseline='middle'; ctx.fillText('(空)', sx, sy+20); }
    for(let k=0;k<s.stack.length;k++){
      const val=s.stack[k];
      const isTop=k===s.stack.length-1;
      const isHit=k===s.hitTop;
      let bg = val>0? C.src : '#f7dede';
      let bd = val>0? C.srcS : C.curS;
      let tc = val>0? C.srcT : C.curT;
      if(isHit){ bg=C.cur; bd=C.curS; tc=C.curT; }
      drawAst(sx, sy, scw, val, {bg,bd,tc,cur:isTop||isHit,ghost:false});
      if(isTop){ triD(sx+scw/2, sy-3, val>0?C.srcT:C.curT); ctx.fillStyle=val>0?C.srcT:C.curT; ctx.font='700 9px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='bottom'; ctx.fillText('top', sx+scw/2, sy-9); }
      sx+=scw+sgp;
    }
    // ghosts (just destroyed)
    for(const g of s.ghosts){
      drawAst(sx, sy, scw, g.v, {bg:C.off,bd:C.offS,tc:C.offT,cur:false,ghost:true});
      sx+=scw+sgp;
    }
    // comparison, top-right
    if(s.cmp){ ctx.textAlign='right'; ctx.textBaseline='alphabetic'; ctx.font='700 13px "JetBrains Mono", monospace'; ctx.fillStyle=C.curT; ctx.fillText(s.cmp.replace(/<[^>]+>/g,''), w-PAD, b2); }

    // ── BAND 3 ──
    const by=210;
    ctx.fillStyle=C.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 只有「top 正 + 進來負」才撞;比 |v|:小的炸,相等兩顆炸', PAD, by);
    rr(PAD,by+10,w-PAD*2,44,6); ctx.fillStyle=done?C.grn:(s.act==='push'?'#fafaf6':C.cur); ctx.fill(); ctx.lineWidth=1.6;
    ctx.strokeStyle=done?C.grnS:(s.act==='push'?C.grid:C.curS); ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='600 12.5px "Noto Sans TC", sans-serif';
    let msg,col=C.text;
    if(s.act==='intro'){ msg='方向決定會不會撞:同向、或「負在左正在右」永不相遇'; }
    else if(done){ msg='掃完一趟即答案 · 每顆最多進出堆疊一次 → 攤還 O(n)'; col=C.grnT; }
    else if(s.act==='push'){ msg='正數(或撞不到的負數)直接入堆疊,等後面的負數來挑戰'; col=C.srcT; }
    else if(s.act==='die'){ msg='頂端較大 → 進來的負數爆炸,堆疊不動'; col=C.curT; }
    else if(s.act==='both'){ msg='絕對值相等 → 兩顆同歸於盡,pop 掉頂端'; col=C.curT; }
    else if(s.act==='survive'){ msg='頂端較小被炸掉,負數續飛;撞到空/負頂端 → 存活入堆疊'; col=C.grnT; }
    ctx.fillStyle=col; ctx.fillText(msg, w/2, by+32);
  }

  function update(){ if(stepEl) stepEl.textContent=String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0'); if(labelEl) labelEl.innerHTML=steps[step].text; draw(); }
  function next(){ if(step<steps.length-1){step++;update();}else stop(); }
  function prev(){ if(step>0){step--;update();} }
  function reset(){ stop(); step=0; update(); }
  function play(){ if(timer){stop();return;} bPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){stop();return;} next(); },1750); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} if(bPlay) bPlay.textContent='Play'; }
  bPrev&&bPrev.addEventListener('click',prev); bNext&&bNext.addEventListener('click',next); bPlay&&bPlay.addEventListener('click',play); bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();}); if(window.ResizeObserver){ new ResizeObserver(()=>{fit();draw();}).observe(canvas); }
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw); fit(); update();
})();
