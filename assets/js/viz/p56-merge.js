/* ============================================================
   P56 · Merge Intervals — 先按起點排序,再一個一個看:
     res.back()[1] >= intervals[i][0] → 重疊(碰到也算),終點取 max
     否則                               → 新開一段,push intervals[i]
   範例 A(官方 1)[[1,3],[2,6],[8,10],[15,18]] → [[1,6],[8,10],[15,18]]
   範例 B         [[8,10],[1,9],[3,4],[12,13],[2,6]] → [[1,10],[12,13]]
                  (沒排好 + 被包住的區間:看 max 為什麼不能省)
     BAND 0  目前是哪個範例 + 輸入
     BAND 1  數線:排好序的 intervals,一個一條 lane
     BAND 2  res(同一條數線)
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
    A: { iv:[[1,3],[2,6],[8,10],[15,18]],          name:'範例 A · 官方 1' },
    B: { iv:[[8,10],[1,9],[3,4],[12,13],[2,6]],    name:'範例 B · 沒排好' },
  };
  const fmt = p => '['+p[0]+','+p[1]+']';
  const fmtL = L => '['+L.map(fmt).join(',')+']';

  /* trace:init(原始順序)→ sort → start(res = [iv[0]])→ 每個 i 一步 → end
     own[j]:sorted 第 j 個區間屬於 res 的第幾段(-1 = 還沒看) */
  const OPS = [];
  ['A','B'].forEach(k=>{
    const raw=EX[k].iv, iv=raw.map(p=>p.slice()).sort((a,b)=>a[0]-b[0]||a[1]-b[1]), n=iv.length;
    EX[k].sorted=iv;
    const own=iv.map(()=>-1), res=[];
    const snap = o => OPS.push(Object.assign({ ex:k, own:own.slice(), res:res.map(r=>r.slice()) }, o));
    snap({ kind:'init' });
    snap({ kind:'sort' });
    res.push(iv[0].slice()); own[0]=0; snap({ kind:'start', i:0 });
    for(let i=1;i<n;i++){
      const back=res[res.length-1].slice();
      if(back[1] >= iv[i][0]){ res[res.length-1][1]=Math.max(back[1], iv[i][1]); own[i]=res.length-1; snap({ kind:'merge', i, back }); }
      else { res.push(iv[i].slice()); own[i]=res.length-1; snap({ kind:'push', i, back }); }
    }
    snap({ kind:'end' });
    EX[k].ans=res.map(r=>r.slice());
  });

  function labelOf(op){
    const ex=EX[op.ex], iv=ex.sorted, tag=ex.name.split(' · ')[0];
    if(op.kind==='init') return '<strong>'+tag+'</strong> · 輸入 <code>'+fmtL(ex.iv)+'</code>。'+(op.ex==='A'?'這組剛好已經排好。':'順序是亂的,而且 [3,4]、[2,6] 整個被 [1,9] 包住。');
    if(op.kind==='sort') return '<strong>SORT</strong> · 按起點排序 → <code>'+fmtL(iv)+'</code>。排好之後,能和前面合併的區間一定緊接著出現。';
    if(op.kind==='start') return '<strong>START</strong> · <code>res.push_back(intervals[0])</code> → <code>res = ['+fmt(iv[0])+']</code>,從 <code>i = 1</code> 開始看。';
    if(op.kind==='end') return '<strong>'+tag+' 結果</strong> · <code>res = '+fmtL(ex.ans)+'</code>。每個區間只看一次,不是併進最後一段,就是自己開新的一段。';
    const b=op.back, x=iv[op.i];
    if(op.kind==='merge'){
      const kept = x[1] < b[1];
      return '<strong>MERGE</strong> · <code>res.back()[1] = '+b[1]+'</code> <b>≥</b> <code>intervals['+op.i+'][0] = '+x[0]+'</code> → 重疊'+(b[1]===x[0]?'(剛好碰到也算)':'')+'。終點 = max('+b[1]+', '+x[1]+') = <b>'+Math.max(b[1],x[1])+'</b>'+(kept?' —— 這個區間整個被包住,終點<b>不能</b>變成 '+x[1]+'。':'。');
    }
    return '<strong>PUSH</strong> · <code>res.back()[1] = '+b[1]+'</code> <b>&lt;</b> <code>intervals['+op.i+'][0] = '+x[0]+'</code> → 碰不到,前一段到此結束,<code>push_back('+fmt(x)+')</code> 開新的一段。';
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
    const w=canvas.clientWidth, h=canvas.clientHeight, PAD=22, IN=12;
    ctx.fillStyle=C.paper; ctx.fillRect(0,0,w,h); ctx.setLineDash([]);
    const op=OPS[step], ex=EX[op.ex], kind=op.kind;
    const isInit=kind==='init', isEnd=kind==='end', isStep=kind==='merge'||kind==='push';
    const iv = isInit ? ex.iv : ex.sorted, n=iv.length;
    const X0=PAD+62, XR=w-PAD-IN, tagX=PAD+26;
    const maxV=Math.max(...ex.iv.map(p=>p[1]))+1;
    const unit=(XR-X0)/maxV, X=v=>X0+v*unit, MINW=10;
    const span=(a,b)=>{ let x1=X(a), x2=X(b); if(x2-x1<MINW){ const c=(x1+x2)/2; x1=c-MINW/2; x2=c+MINW/2; } return [x1, x2-x1]; };
    const segTint = k => k%2===0 ? C.tint : C.tint2;

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
    else if(kind==='sort'){ pT='SORT · 按起點'; pbg=C.tint; }
    else if(kind==='start'){ pT='res = [intervals[0]]'; pbg=C.tint; }
    else if(kind==='merge'){ pT='MERGE · i = '+op.i; pbg=C.redBg; pbd=C.red; ptx=C.redT; plw=1.8; }
    else if(kind==='push'){ pT='PUSH · i = '+op.i; pbg=C.good; pbd=C.goodT; ptx=C.goodT; plw=1.8; }
    else { pT='完成 · '+op.res.length+' 段'; pbg=C.good; pbd=C.goodT; ptx=C.goodT; plw=1.6; }
    const pF='700 11.5px '+MONO, pW=tw(pT,pF)+22, pH=20, pX=XR-pW;
    pill(pX, B1-14, pW, pH, pT, pF, pbg, pbd, ptx, plw);
    const t1 = isInit ? 'BAND 1 · 輸入的原始順序(一個區間一條線)'
                      : 'BAND 1 · 排序後的 intervals   底色 = 併進 res 的第幾段   紅 = 這一步的 intervals[i]';
    const T1=fitText([t1, 'BAND 1 · 排序後的 intervals   紅 = intervals[i]', 'BAND 1'], pX-PAD-14, '600', [11.5,11,10.5,10,9.5], MONO);
    txt(T1.s, PAD, B1, T1.f, C.dim);

    const cur = isStep ? op.i : (kind==='start'?0:-1);
    for(let j=0;j<n;j++){
      const y=L0+j*laneH+(laneH-bh)/2, [x,ww]=span(iv[j][0], iv[j][1]);
      const tagC = j===cur ? C.redT : C.dim;
      txt((isInit?'#':'i=')+j, tagX, y+bh/2+1, '700 11px '+MONO, tagC, 'center', 'middle');
      line(X0, y+bh/2, XR, y+bh/2, '#efefef', 1);
      let st={bg:C.cell, bd:C.ink, tx:C.ink, lw:1.3};
      if(!isInit && op.own[j]>=0) st={bg:segTint(op.own[j]), bd:C.ink, tx:C.ink, lw:1.3};
      if(isEnd) st.bd=C.goodT;
      if(j===cur) st={bg:op.own[j]>=0?segTint(op.own[j]):C.cell, bd:C.red, tx:C.redT, lw:2.4};
      box(x, y, ww, bh, st);
      const s=fmt(iv[j]), f=(j===cur?'700 ':'600 ')+'11px '+MONO, sw=tw(s,f);
      if(x+ww+6+sw <= XR) txt(s, x+ww+6, y+bh/2+1, f, j===cur?C.redT:C.ink, 'left', 'middle');
      else txt(s, x-6, y+bh/2+1, f, j===cur?C.redT:C.ink, 'right', 'middle');
    }

    // 比較的兩個端點
    if(isStep){
      const b=op.back[1], a=iv[op.i][0], yi=L0+op.i*laneH+(laneH-bh)/2;
      line(X(a), yi+bh+2, X(a), axY, C.red, 1.6, [4,3]);
      line(X(b), L0, X(b), axY, C.red2, 1.4, [2,3]);
    }

    // 刻度
    line(X0, axY, XR, axY, C.ink, 1.2);
    const tF='600 '+(unit>=24?11:9.5)+'px '+MONO, every = unit>=22?1:2;
    for(let v=0; v<=maxV; v++){ const x=X(v); line(x, axY-4, x, axY+4, C.ink, 1); if(v%every===0) txt(String(v), x, axY+16, tF, C.dim, 'center', 'middle'); }

    /* ---------- BAND 2 · res ---------- */
    const B2=axY+46, ry=B2+12, rh=30;
    txt('BAND 2 · res(同一條數線;紅框 = res.back())', PAD, B2, fitText(['BAND 2 · res(同一條數線;紅框 = res.back())','BAND 2 · res'], w-2*PAD, '600', [11.5,11,10.5,10,9.5], MONO).f, C.dim);
    txt('res', tagX, ry+rh/2+1, '700 13px '+MONO, C.ink, 'center', 'middle');
    if(op.res.length===0){
      box(X0, ry, XR-X0, rh, {bg:C.cell, bd:C.off, lw:1.2, dash:true});
      txt('res = [ ] · 先排序', X0+(XR-X0)/2, ry+rh/2+1, '600 12px '+SANS, C.dim, 'center', 'middle');
    } else {
      if(kind==='merge'){ const [gx,gw]=span(op.back[0], op.back[1]); box(gx, ry-4, gw, rh+8, {bg:C.cell, bd:C.red, lw:1.2, dash:true}); }
      op.res.forEach((r,k)=>{
        const [x,ww]=span(r[0], r[1]), last=k===op.res.length-1;
        let st={bg:segTint(k), bd:C.ink, tx:C.ink, lw:1.4};
        if(isEnd) st={bg:C.good, bd:C.goodT, tx:C.goodT, lw:2};
        else if(last && (isStep||kind==='start')) st={bg:segTint(k), bd:C.red, tx:C.redT, lw:2.6};
        box(x, ry, ww, rh, st);
        const s=fmt(r), f='700 '+(ww>=44?11.5:10.5)+'px '+MONO;
        if(tw(s,f)<=ww-6) txt(s, x+ww/2, ry+rh/2+1, f, st.tx, 'center', 'middle');
        else txt(s, x+ww/2, ry+rh+12, '700 10px '+MONO, st.tx, 'center', 'middle');
      });
    }

    /* ---------- BAND 3 · 條件 ---------- */
    const sy=ry+rh+22, sh=36;
    let sl, sbg=C.cell, sbd=C.ink, stx=C.ink, slw=1.2;
    if(isInit){ sl=['n = '+n+' · 第一步:sort(intervals.begin(), intervals.end())', 'n = '+n+' · 先排序']; sbg=C.tint; }
    else if(kind==='sort'){ sl=['sorted = '+fmtL(iv), fmtL(iv)]; sbg=C.tint; }
    else if(kind==='start'){ sl='res = ['+fmt(iv[0])+'] · 從 i = 1 開始'; sbg=C.tint; }
    else if(isEnd){ sl=['res = '+fmtL(ex.ans), fmtL(ex.ans)]; sbg=C.good; sbd=C.goodT; stx=C.goodT; slw=2.2; }
    else { const b=op.back[1], a=iv[op.i][0], e=iv[op.i][1];
      if(kind==='merge'){ sl=['back[1] = '+b+' ≥ '+a+' → back[1] = max('+b+', '+e+') = '+Math.max(b,e), b+' ≥ '+a+' → max('+b+', '+e+') = '+Math.max(b,e)]; sbg=C.redBg; sbd=C.red; stx=C.redT; slw=2; }
      else { sl=['back[1] = '+b+' < '+a+' → push '+fmt(iv[op.i]), b+' < '+a+' → push']; sbg=C.good; sbd=C.goodT; stx=C.goodT; slw=2; } }
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
