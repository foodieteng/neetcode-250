/* ============================================================
   P252 · Meeting Rooms — 按終點排序,e = 目前看過的會議裡最晚的結束時間
     intervals[i][0] < e → 這場在前面某場結束前就開始了 → return false
     否則 e = max(intervals[i][1], e),繼續
   碰到(start == e)不算衝突。
   範例 A(官方 1)[[0,30],[5,10],[15,20]] → false
   範例 B         [[7,10],[2,4],[4,7]] → true(兩次剛好碰到)
     BAND 0  目前是哪個範例 + 輸入
     BAND 1  數線:按終點排好的會議,一場一條 lane
     BAND 2  已確認不衝突的會議(同一條數線)
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
    A: { iv:[[0,30],[5,10],[15,20]],                 name:'範例 A · 官方 1' },
    B: { iv:[[7,10],[2,4],[4,7]],                    name:'範例 B · 剛好碰到' },
  };
  const fmt = p => '['+p[0]+','+p[1]+']';
  const fmtL = L => '['+L.map(fmt).join(',')+']';
  // 和 std::sort 實測出來的順序一致(終點相同時保持原順序)
  const byEnd = L => L.map((p,ix)=>({p,ix})).sort((a,b)=>a.p[1]-b.p[1]||a.ix-b.ix).map(o=>o.p.slice());

  /* st[j]:'wait' | 'ok' | 'hit'(衝突的那一場)| 'blk'(被撞到的那一場) */
  const OPS = [];
  ['A','B'].forEach(k=>{
    const iv=byEnd(EX[k].iv), n=iv.length; EX[k].sorted=iv;
    const st=iv.map(()=>'wait'), ok=[];
    const snap = o => OPS.push(Object.assign({ ex:k, st:st.slice(), ok:ok.map(r=>r.slice()) }, o));
    snap({ kind:'init' });
    snap({ kind:'sort' });
    let e=iv[0][1]; st[0]='ok'; ok.push(iv[0].slice()); snap({ kind:'start', i:0, e });
    let ans=true;
    for(let i=1;i<n;i++){
      if(iv[i][0] < e){
        st[i]='hit'; let bj=0; for(let j=0;j<i;j++) if(iv[j][1]===e) bj=j; st[bj]='blk';
        snap({ kind:'hit', i, e, bj }); ans=false; break;
      }
      const old=e; e=Math.max(iv[i][1], e); st[i]='ok'; ok.push(iv[i].slice());
      snap({ kind:'ok', i, e, old });
    }
    snap({ kind:'end', e, ans });
    EX[k].ans=ans;
  });

  function labelOf(op){
    const ex=EX[op.ex], iv=ex.sorted, tag=ex.name.split(' · ')[0], n=iv.length;
    if(op.kind==='init') return '<strong>'+tag+'</strong> · 輸入 <code>'+fmtL(ex.iv)+'</code>,n = '+n+'。一個人能不能參加全部會議 = 有沒有任兩場時間重疊(結束和開始同一刻不算)。';
    if(op.kind==='sort') return '<strong>SORT · 按終點</strong> · cmp 是 <code>a[1] &lt; b[1]</code> → <code>'+fmtL(iv)+'</code>。'+(op.ex==='A'?'[0,30] 起點最早,但終點最晚,排到最後。':'');
    if(op.kind==='start') return '<strong>START</strong> · <code>e = intervals[0][1] = '+op.e+'</code>:第一場一定沒問題,從 <code>i = 1</code> 開始比。';
    if(op.kind==='end') return '<strong>'+tag+' 結果</strong> · '+(op.ans?'每一場都在 e 之後(或剛好在 e)才開始 → <code>return true</code>。':'中途就撞到了 → <code>return false</code>,後面不用再看。');
    const x=iv[op.i];
    if(op.kind==='ok') return '<strong>OK</strong> · <code>'+fmt(x)+'</code> 的起點 '+x[0]+' <b>≥</b> <code>e = '+op.old+'</code>'+(x[0]===op.old?'(剛好碰到,不算衝突)':'')+' → 沒衝突。<code>e = max('+x[1]+', '+op.old+') = '+op.e+'</code>。';
    return '<strong>CONFLICT</strong> · <code>'+fmt(x)+'</code> 的起點 '+x[0]+' <b>&lt;</b> <code>e = '+op.e+'</code>:它在 <code>'+fmt(iv[op.bj])+'</code> 結束前就開始了 → <code>return false</code>。';
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
    const isInit=kind==='init', isEnd=kind==='end', isStep=kind==='ok'||kind==='hit';
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
    const B1=50, L0=84, laneH=30, bh=20, axY=L0+3*laneH+12;
    let pT, pbg=C.cell, pbd=C.ink, ptx=C.ink, plw=1.2;
    if(isInit){ pT='原始順序'; }
    else if(kind==='sort'){ pT='SORT · a[1] < b[1]'; pbg=C.tint; }
    else if(kind==='start'){ pT='e = '+op.e; pbg=C.tint; }
    else if(kind==='ok'){ pT='OK · e = '+op.e; pbg=C.good; pbd=C.goodT; ptx=C.goodT; plw=1.8; }
    else if(kind==='hit'){ pT='CONFLICT · i = '+op.i; pbg=C.redBg; pbd=C.red; ptx=C.redT; plw=1.8; }
    else { pT='return '+(op.ans?'true':'false'); if(op.ans){pbg=C.good; pbd=C.goodT; ptx=C.goodT;} else {pbg=C.redBg; pbd=C.red; ptx=C.redT;} plw=1.8; }
    const pF='700 11.5px '+MONO, pW=tw(pT,pF)+22, pH=20, pX=XR-pW;
    pill(pX, B1-14, pW, pH, pT, pF, pbg, pbd, ptx, plw);
    const t1 = isInit ? 'BAND 1 · 輸入的原始順序(一場會議一條線)'
                      : 'BAND 1 · 按終點排序   綠 = 沒衝突   紅 = 撞到前面   深紅 = 被撞的那場   黑虛線 = e';
    const T1=fitText([t1, 'BAND 1 · 按終點排序   黑虛線 = e', 'BAND 1'], pX-PAD-14, '600', [11.5,11,10.5,10,9.5], MONO);
    txt(T1.s, PAD, B1, T1.f, C.dim);

    const cur = isStep ? op.i : (kind==='start'?0:-1);
    for(let j=0;j<n;j++){
      const y=L0+j*laneH+(laneH-bh)/2, [x,ww]=span(iv[j][0], iv[j][1]);
      txt((isInit?'#':'i=')+j, tagX, y+bh/2+1, '700 11px '+MONO, j===cur?C.redT:C.dim, 'center', 'middle');
      line(X0, y+bh/2, XR, y+bh/2, '#efefef', 1);
      const s=isInit?'wait':op.st[j];
      let st={bg:C.cell, bd:C.ink, tx:C.ink, lw:1.3};
      if(s==='ok') st={bg:C.good, bd:C.goodT, tx:C.goodT, lw:1.6};
      if(s==='hit') st={bg:C.redBg, bd:C.red, tx:C.redT, lw:2.6};
      if(s==='blk') st={bg:C.bad, bd:C.red2, tx:C.red2, lw:2};
      if(j===cur && s==='ok') st=Object.assign({}, st, {lw:2.6});
      box(x, y, ww, bh, st);
      const lab=fmt(iv[j]), f=(j===cur?'700 ':'600 ')+'11px '+MONO, sw=tw(lab,f);
      if(x+ww+8+sw <= XR) txt(lab, x+ww+8, y+bh/2+1, f, st.tx, 'left', 'middle');
      else if(ww>sw+16) txt(lab, x+ww-8, y+bh/2+1, f, st.tx, 'right', 'middle');
      else txt(lab, x-8, y+bh/2+1, f, st.tx, 'right', 'middle');
    }

    // e 和這一場的起點
    if(isStep || kind==='start'){
      const e = kind==='ok' ? op.old : op.e;
      line(X(e), L0-2, X(e), axY, C.ink, 1.4, [2,3]);
      txt('e = '+e, X(e)+6, L0-9, '700 10.5px '+MONO, C.ink, 'left', 'middle');
      if(isStep){ const a=iv[op.i][0], yi=L0+op.i*laneH+(laneH-bh)/2; line(X(a), yi+bh+2, X(a), axY, C.red, 1.6, [4,3]); }
    }

    // 刻度
    line(X0, axY, XR, axY, C.ink, 1.2);
    const tF='600 '+(unit>=24?11:10)+'px '+MONO, every = unit>=22?1:(unit>=11?2:5);
    for(let v=0; v<=maxV; v++){ const x=X(v); line(x, axY-(v%every===0?4:2), x, axY+(v%every===0?4:2), C.ink, 1); if(v%every===0) txt(String(v), x, axY+16, tF, C.dim, 'center', 'middle'); }

    /* ---------- BAND 2 · 已確認的會議 ---------- */
    const B2=axY+46, ry=B2+12, rh=30;
    txt('BAND 2 · 已確認不衝突的會議(排成一天的行程)', PAD, B2, fitText(['BAND 2 · 已確認不衝突的會議(排成一天的行程)','BAND 2 · 已確認'], w-2*PAD, '600', [11.5,11,10.5,10,9.5], MONO).f, C.dim);
    txt('行程', tagX, ry+rh/2+1, '700 13px '+SANS, C.ink, 'center', 'middle');
    if(op.ok.length===0){
      box(X0, ry, XR-X0, rh, {bg:C.cell, bd:C.off, lw:1.2, dash:true});
      txt('還沒確認任何會議', X0+(XR-X0)/2, ry+rh/2+1, '600 12px '+SANS, C.dim, 'center', 'middle');
    } else {
      op.ok.forEach((r,k)=>{
        const [x,ww]=span(r[0], r[1]), last=k===op.ok.length-1 && (kind==='ok'||kind==='start');
        const st={bg:C.good, bd:C.goodT, tx:C.goodT, lw:last?2.6:1.4};
        box(x, ry, ww, rh, st);
        const s=fmt(r), f='700 '+(ww>=44?11.5:10.5)+'px '+MONO;
        if(tw(s,f)<=ww-6) txt(s, x+ww/2, ry+rh/2+1, f, st.tx, 'center', 'middle');
        else txt(s, x+ww/2, ry+rh+12, '700 10px '+MONO, st.tx, 'center', 'middle');
      });
      if(kind==='hit'){ const [x,ww]=span(iv[op.i][0], iv[op.i][1]); box(x, ry-5, ww, rh+10, {bg:'rgba(0,0,0,0)', bd:C.red, lw:2, dash:true}); }
    }

    /* ---------- BAND 3 · 條件 ---------- */
    const sy=ry+rh+26, sh=36;
    let sl, sbg=C.cell, sbd=C.ink, stx=C.ink, slw=1.2;
    if(isInit){ sl=['n = '+n+' · 先 sort(…, [&](auto& a, auto& b) { return a[1] < b[1]; })', 'n = '+n+' · 先按終點排序']; sbg=C.tint; }
    else if(kind==='sort'){ sl=['by end = '+fmtL(iv), fmtL(iv)]; sbg=C.tint; }
    else if(kind==='start'){ sl='e = intervals[0][1] = '+op.e; sbg=C.tint; }
    else if(kind==='ok'){ const x=iv[op.i]; sl=['intervals['+op.i+'][0] = '+x[0]+' ≥ e = '+op.old+' → e = max('+x[1]+', '+op.old+') = '+op.e, x[0]+' ≥ '+op.old+' → e = '+op.e]; sbg=C.good; sbd=C.goodT; stx=C.goodT; slw=2; }
    else if(kind==='hit'){ const x=iv[op.i]; sl=['intervals['+op.i+'][0] = '+x[0]+' < e = '+op.e+' → return false', x[0]+' < '+op.e+' → false']; sbg=C.redBg; sbd=C.red; stx=C.redT; slw=2; }
    else { sl='return '+(op.ans?'true':'false'); if(op.ans){sbg=C.good; sbd=C.goodT; stx=C.goodT;} else {sbg=C.redBg; sbd=C.red; stx=C.redT;} slw=2.2; }
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
