/* ============================================================
   P435 · Non-overlapping Intervals — 按「終點」排序,能留就留(最早結束的優先)
     res.empty() || res.back()[1] <= v[0] → 留下(碰到不算重疊)
     否則                                  → 刪掉(答案 +1)
   答案 = n − 留下的個數
   範例 A(官方 1)[[1,2],[2,3],[3,4],[1,3]] → 1
   範例 B         [[1,10],[2,3],[4,5],[3,6],[6,8]] → 2(長區間最後才輪到、被刪)
     BAND 0  目前是哪個範例 + 輸入
     BAND 1  數線:按終點排好的 intervals,一個一條 lane(紅點 = 排序用的終點)
     BAND 2  res = 留下的區間
     BAND 3  這一步比較的條件
   所有數字取自實測 trace。
   ============================================================ */
(function () {
  const canvas = document.getElementById('viz-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('viz-step'), labelEl = document.getElementById('viz-label');
  const bPrev = document.getElementById('viz-prev'), bNext = document.getElementById('viz-next'),
        bPlay = document.getElementById('viz-play'), bReset = document.getElementById('viz-reset');

  const C = { paper:'#ffffff', ink:'#1a1a1a', dim:'#9a9a9a', cell:'#ffffff',
    tint:'#e3edf5', tint2:'#f6ead8',
    red:'#cf3535', redBg:'#fbe1e1', redT:'#992424', red2:'#a31d1d',
    good:'#d9e8c7', goodT:'#3f6a2a', bad:'#f0d4d4', off:'#cfcfcf' };
  const MONO = '"JetBrains Mono", "Noto Sans TC", monospace', SANS = '"Noto Sans TC", sans-serif';

  const EX = {
    A: { iv:[[1,2],[2,3],[3,4],[1,3]],               name:'範例 A · 官方 1' },
    B: { iv:[[1,10],[2,3],[4,5],[3,6],[6,8]],        name:'範例 B · 長區間' },
  };
  const fmt = p => '['+p[0]+','+p[1]+']';
  const fmtL = L => '['+L.map(fmt).join(',')+']';
  // 和 std::sort 實測出來的順序一致(終點相同時保持原順序)
  const byEnd = L => L.map((p,ix)=>({p,ix})).sort((a,b)=>a.p[1]-b.p[1]||a.ix-b.ix).map(o=>o.p.slice());

  /* st[j]:'wait' | 'keep' | 'drop' */
  const OPS = [];
  ['A','B'].forEach(k=>{
    const iv=byEnd(EX[k].iv), n=iv.length; EX[k].sorted=iv;
    const st=iv.map(()=>'wait'), res=[];
    const snap = o => OPS.push(Object.assign({ ex:k, st:st.slice(), res:res.map(r=>r.slice()) }, o));
    snap({ kind:'init' });
    snap({ kind:'sort' });
    for(let i=0;i<n;i++){
      const back = res.length ? res[res.length-1].slice() : null;
      if(!back || back[1] <= iv[i][0]){ res.push(iv[i].slice()); st[i]='keep'; snap({ kind:'keep', i, back }); }
      else { st[i]='drop'; snap({ kind:'drop', i, back }); }
    }
    snap({ kind:'end' });
    EX[k].kept=res.length; EX[k].ans=n-res.length;
  });

  function labelOf(op){
    const ex=EX[op.ex], iv=ex.sorted, tag=ex.name.split(' · ')[0], n=iv.length;
    if(op.kind==='init') return '<strong>'+tag+'</strong> · 輸入 <code>'+fmtL(ex.iv)+'</code>,n = '+n+'。問最少刪幾個,剩下的才會兩兩不重疊(碰到不算重疊)。';
    if(op.kind==='sort') return '<strong>SORT · 按終點</strong> · cmp 是 <code>a[1] &lt; b[1]</code> → <code>'+fmtL(iv)+'</code>。'+(op.ex==='B'?'[1,10] 起點最小,但終點最大,排到最後。':'終點相同的 [2,3]、[1,3] 誰先誰後都不影響答案。');
    if(op.kind==='end') return '<strong>'+tag+' 結果</strong> · 留下 '+ex.kept+' 個 → 回傳 <code>n − res.size() = '+n+' − '+ex.kept+' = '+ex.ans+'</code>。';
    const x=iv[op.i];
    if(op.kind==='keep'){
      if(!op.back) return '<strong>KEEP</strong> · res 是空的 → 留下 <code>'+fmt(x)+'</code>。它是所有區間裡最早結束的,留它最不擋後面。';
      return '<strong>KEEP</strong> · <code>res.back()[1] = '+op.back[1]+'</code> <b>≤</b> <code>'+fmt(x)+'</code> 的起點 '+x[0]+(op.back[1]===x[0]?'(剛好碰到,不算重疊)':'')+' → 留下。';
    }
    return '<strong>DROP</strong> · <code>res.back()[1] = '+op.back[1]+'</code> <b>&gt;</b> <code>'+fmt(x)+'</code> 的起點 '+x[0]+' → 和已留下的重疊,刪掉。它的終點 '+x[1]+' ≥ '+op.back[1]+',留它只會更擋路。';
  }
  const steps = OPS.map(op=>({ text: labelOf(op) }));

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function txt(s,x,y,font,color,align,base){ ctx.font=font; ctx.fillStyle=color; ctx.textAlign=align||'left'; ctx.textBaseline=base||'alphabetic'; ctx.fillText(s,x,y); }
  function tw(s,font){ ctx.font=font; return ctx.measureText(s).width; }
  function box(x,y,cw,ch,st){
    rr(x,y,cw,ch,st.rad==null?5:st.rad); ctx.fillStyle=st.bg; ctx.fill();
    ctx.setLineDash(st.dash?[4,3]:[]); ctx.lineWidth=st.lw||1.4; ctx.strokeStyle=st.bd; ctx.stroke(); ctx.setLineDash([]);
  }
  function fitText(cands, maxW, weight, sizes, fam){
    for(const s of cands) for(const z of sizes){ const f=weight+' '+z+'px '+fam; if(tw(s,f)<=maxW) return {s, f}; }
    const s=cands[cands.length-1]; return {s, f:weight+' '+sizes[sizes.length-1]+'px '+fam};
  }
  function line(x1,y1,x2,y2,color,lw,dash){ ctx.setLineDash(dash||[]); ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.lineWidth=lw; ctx.strokeStyle=color; ctx.stroke(); ctx.setLineDash([]); }
  function pill(x, y, pw, ph, s, font, bg, bd, tx, lw){
    rr(x, y, pw, ph, ph/2); ctx.fillStyle=bg; ctx.fill(); ctx.lineWidth=lw||1.2; ctx.strokeStyle=bd; ctx.stroke();
    txt(s, x+pw/2, y+ph/2+1, font, tx, 'center', 'middle');
  }

  function draw(){
    fit();
    const w=canvas.clientWidth, PAD=22, IN=12;
    ctx.fillStyle=C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);
    const op=OPS[step], ex=EX[op.ex], kind=op.kind;
    const isInit=kind==='init', isEnd=kind==='end', isStep=kind==='keep'||kind==='drop';
    const iv = isInit ? ex.iv : ex.sorted, n=iv.length;
    const X0=PAD+62, XR=w-PAD-IN, tagX=PAD+26;
    const maxV=Math.max(...ex.iv.map(p=>p[1]))+1;
    const unit=(XR-X0)/maxV, X=v=>X0+v*unit;
    const span=(a,b)=>[X(a), X(b)-X(a)];

    /* ---------- BAND 0 ---------- */
    const tabF='700 11.5px '+SANS, tabW=Math.max(tw(EX.A.name,tabF), tw(EX.B.name,tabF))+22, tabH=20, tabY=6;
    ['A','B'].forEach((e,ix)=>{
      const x=w-PAD-(2-ix)*tabW-(ix===0?8:0), on=e===op.ex;
      rr(x, tabY, tabW, tabH, 10); ctx.fillStyle=on?C.ink:C.cell; ctx.fill();
      ctx.lineWidth=1.2; ctx.strokeStyle=on?C.ink:C.off; ctx.stroke();
      txt(EX[e].name, x+tabW/2, tabY+tabH/2+1, tabF, on?C.paper:C.dim, 'center', 'middle');
    });
    const T0=fitText(['intervals = '+fmtL(ex.iv), fmtL(ex.iv)], w-2*PAD-2*tabW-8-14, '700', [12.5,12,11.5,11,10.5,10], MONO);
    txt(T0.s, PAD, 20, T0.f, C.ink);

    /* ---------- BAND 1 · lanes ---------- */
    const B1=50, L0=64, laneH=26, bh=18, axY=L0+5*laneH+10;
    let pT, pbg=C.cell, pbd=C.ink, ptx=C.ink, plw=1.2;
    if(isInit){ pT='原始順序'; }
    else if(kind==='sort'){ pT='SORT · a[1] < b[1]'; pbg=C.tint; }
    else if(kind==='keep'){ pT='KEEP · i = '+op.i; pbg=C.good; pbd=C.goodT; ptx=C.goodT; plw=1.8; }
    else if(kind==='drop'){ pT='DROP · i = '+op.i; pbg=C.redBg; pbd=C.red; ptx=C.redT; plw=1.8; }
    else { pT='刪 '+ex.ans+' 個'; pbg=C.good; pbd=C.goodT; ptx=C.goodT; plw=1.6; }
    const pF='700 11.5px '+MONO, pW=tw(pT,pF)+22, pH=20, pX=XR-pW;
    pill(pX, B1-14, pW, pH, pT, pF, pbg, pbd, ptx, plw);
    const t1 = isInit ? 'BAND 1 · 輸入的原始順序(一個區間一條線)'
                      : 'BAND 1 · 按終點排序   ● = 排序鍵(終點)   綠 = 留下   紅虛線 = 刪掉';
    const T1=fitText([t1, 'BAND 1 · 按終點排序   ● = 終點', 'BAND 1'], pX-PAD-14, '600', [11.5,11,10.5,10,9.5], MONO);
    txt(T1.s, PAD, B1, T1.f, C.dim);

    const cur = isStep ? op.i : -1;
    for(let j=0;j<n;j++){
      const y=L0+j*laneH+(laneH-bh)/2, [x,ww]=span(iv[j][0], iv[j][1]);
      txt((isInit?'#':'i=')+j, tagX, y+bh/2+1, '700 11px '+MONO, j===cur?C.redT:C.dim, 'center', 'middle');
      line(X0, y+bh/2, XR, y+bh/2, '#efefef', 1);
      const s=isInit?'wait':op.st[j];
      let st={bg:C.cell, bd:C.ink, tx:C.ink, lw:1.3};
      if(s==='keep') st={bg:C.good, bd:C.goodT, tx:C.goodT, lw:1.6};
      if(s==='drop') st={bg:C.bad, bd:C.red, tx:C.redT, lw:1.4, dash:true};
      if(j===cur) st=Object.assign({}, st, {lw:2.6, dash:false, bd: s==='keep'?C.goodT:C.red});
      box(x, y, ww, bh, st);
      if(s==='drop'){ line(x+4, y+bh/2, x+ww-4, y+bh/2, C.red, 1.6); }
      if(!isInit){ ctx.beginPath(); ctx.arc(x+ww, y+bh/2, 3.6, 0, Math.PI*2); ctx.fillStyle=C.red; ctx.fill(); }
      const lab=fmt(iv[j]), f=(j===cur?'700 ':'600 ')+'11px '+MONO, sw=tw(lab,f);
      const col = s==='drop'?C.redT:(s==='keep'?C.goodT:C.ink);
      if(x+ww+8+sw <= XR) txt(lab, x+ww+8, y+bh/2+1, f, col, 'left', 'middle');
      else txt(lab, x-8, y+bh/2+1, f, col, 'right', 'middle');
    }

    // res.back()[1] 的位置 vs 這一個的起點
    if(isStep && op.back){
      const b=op.back[1], a=iv[op.i][0], yi=L0+op.i*laneH+(laneH-bh)/2;
      line(X(b), L0-2, X(b), axY, C.ink, 1.3, [2,3]);
      line(X(a), yi+bh+2, X(a), axY, C.red, 1.6, [4,3]);
    }

    // 刻度
    line(X0, axY, XR, axY, C.ink, 1.2);
    const tF='600 '+(unit>=24?11:9.5)+'px '+MONO, every = unit>=22?1:2;
    for(let v=0; v<=maxV; v++){ const x=X(v); line(x, axY-4, x, axY+4, C.ink, 1); if(v%every===0) txt(String(v), x, axY+16, tF, C.dim, 'center', 'middle'); }

    /* ---------- BAND 2 · res ---------- */
    const B2=axY+46, ry=B2+12, rh=30;
    txt('BAND 2 · res = 留下的區間(黑虛線 = res.back()[1])', PAD, B2, fitText(['BAND 2 · res = 留下的區間(黑虛線 = res.back()[1])','BAND 2 · res'], w-2*PAD, '600', [11.5,11,10.5,10,9.5], MONO).f, C.dim);
    txt('res', tagX, ry+rh/2+1, '700 13px '+MONO, C.ink, 'center', 'middle');
    if(op.res.length===0){
      box(X0, ry, XR-X0, rh, {bg:C.cell, bd:C.off, lw:1.2, dash:true});
      txt('res = [ ]', X0+(XR-X0)/2, ry+rh/2+1, '600 12px '+SANS, C.dim, 'center', 'middle');
    } else {
      op.res.forEach((r,k)=>{
        const [x,ww]=span(r[0], r[1]), last=k===op.res.length-1 && kind==='keep';
        const st = last ? {bg:C.good, bd:C.goodT, tx:C.goodT, lw:2.6} : {bg:C.good, bd:C.goodT, tx:C.goodT, lw:1.4};
        box(x, ry, ww, rh, st);
        const s=fmt(r), f='700 '+(ww>=44?11.5:10.5)+'px '+MONO;
        if(tw(s,f)<=ww-6) txt(s, x+ww/2, ry+rh/2+1, f, st.tx, 'center', 'middle');
        else txt(s, x+ww/2, ry+rh+12, '700 10px '+MONO, st.tx, 'center', 'middle');
      });
    }

    /* ---------- BAND 3 · 條件 ---------- */
    const sy=ry+rh+22, sh=36;
    let sl, sbg=C.cell, sbd=C.ink, stx=C.ink, slw=1.2;
    if(isInit){ sl=['n = '+n+' · 先 sort(…, [&](auto& a, auto& b) { return a[1] < b[1]; })', 'n = '+n+' · 先按終點排序']; sbg=C.tint; }
    else if(kind==='sort'){ sl=['by end = '+fmtL(iv), fmtL(iv)]; sbg=C.tint; }
    else if(isEnd){ sl=['n − res.size() = '+n+' − '+ex.kept+' = '+ex.ans, n+' − '+ex.kept+' = '+ex.ans]; sbg=C.good; sbd=C.goodT; stx=C.goodT; slw=2.2; }
    else { const x=iv[op.i];
      if(!op.back){ sl='res.empty() → keep '+fmt(x); sbg=C.good; sbd=C.goodT; stx=C.goodT; slw=2; }
      else if(kind==='keep'){ sl=['res.back()[1] = '+op.back[1]+' ≤ '+x[0]+' → keep '+fmt(x), op.back[1]+' ≤ '+x[0]+' → keep']; sbg=C.good; sbd=C.goodT; stx=C.goodT; slw=2; }
      else { sl=['res.back()[1] = '+op.back[1]+' > '+x[0]+' → drop '+fmt(x)+'(答案 +1)', op.back[1]+' > '+x[0]+' → drop']; sbg=C.redBg; sbd=C.red; stx=C.redT; slw=2; } }
    rr(X0, sy, XR-X0, sh, 6); ctx.fillStyle=sbg; ctx.fill(); ctx.lineWidth=slw; ctx.strokeStyle=sbd; ctx.stroke();
    txt('比較', tagX, sy+sh/2+1, '700 12px '+SANS, C.ink, 'center', 'middle');
    const SL=fitText(Array.isArray(sl)?sl:[sl], XR-X0-24, '700', [13,12.5,12,11.5,11], MONO);
    txt(SL.s, X0+12, sy+sh/2+1, SL.f, stx, 'left', 'middle');
  }

  function update(){ if(stepEl) stepEl.textContent=String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0'); if(labelEl) labelEl.innerHTML=steps[step].text; draw(); }
  function next(){ if(step<steps.length-1){step++;update();}else stop(); }
  function prev(){ if(step>0){step--;update();} }
  function reset(){ stop(); step=0; update(); }
  function play(){ if(timer){stop();return;} bPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){stop();return;} next(); },1900); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} if(bPlay) bPlay.textContent='Play'; }
  bPrev&&bPrev.addEventListener('click',prev); bNext&&bNext.addEventListener('click',next); bPlay&&bPlay.addEventListener('click',play); bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();}); if(window.ResizeObserver){ new ResizeObserver(()=>{fit();draw();}).observe(canvas); }
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw); fit(); update();
})();
