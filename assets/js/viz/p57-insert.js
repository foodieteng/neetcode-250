/* ============================================================
   P57 · Insert Interval — 三段 while:前面不重疊 → 重疊就合併 → 後面不重疊
   CASE 1  intervals[i][1] <  new[0]  → 整段在 new 左邊,原樣放進 res
   CASE 2  new[1] >= intervals[i][0]   → 有重疊(含碰到),new 吸收它:start 取 min、end 取 max
           條件不成立 → push new
   CASE 3  剩下的全部在 new 右邊,原樣放進 res
   範例 A(官方 1)[[1,3],[6,9]] + [2,5] → [[1,5],[6,9]]
   範例 B(官方 2)[[1,2],[3,5],[6,7],[8,10],[12,16]] + [4,8] → [[1,2],[3,10],[12,16]]
     BAND 0  目前是哪個範例 + 輸入
     BAND 1  數線:intervals(上)· new(中)· 刻度
     BAND 2  res(對齊同一條數線)
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
    A: { iv:[[1,3],[6,9]],                         nw:[2,5], name:'範例 A · 官方 1' },
    B: { iv:[[1,2],[3,5],[6,7],[8,10],[12,16]],    nw:[4,8], name:'範例 B · 官方 2' },
  };
  const fmt = p => '['+p[0]+','+p[1]+']';
  const fmtL = L => '['+L.map(fmt).join(',')+']';

  /* trace:每一步 = 一次 while 條件的判斷(或 init / end)
     st[j]:'wait' 還沒看 | 'c1' 已放進 res(case 1)| 'eat' 被 new 吸收 | 'c3' 已放進 res(case 3) */
  const OPS = [];
  ['A','B'].forEach(k=>{
    const iv=EX[k].iv, n=iv.length; let nw=EX[k].nw.slice(), i=0;
    const st=iv.map(()=>'wait'), res=[];
    const snap = o => OPS.push(Object.assign({ ex:k, nw:nw.slice(), st:st.slice(), res:res.map(r=>({v:r.v.slice(), src:r.src})) }, o));
    snap({ kind:'init', i:0 });
    while(true){                      // CASE 1
      if(i<n && iv[i][1] < nw[0]){ st[i]='c1'; res.push({v:iv[i].slice(), src:'c1'}); snap({ kind:'c1', ok:true, i }); i++; }
      else { snap({ kind:'c1', ok:false, i, done:i>=n }); break; }
    }
    while(true){                      // CASE 2
      if(i<n && nw[1] >= iv[i][0]){
        const old=nw.slice(); nw=[Math.min(nw[0],iv[i][0]), Math.max(nw[1],iv[i][1])]; st[i]='eat';
        snap({ kind:'c2', ok:true, i, old }); i++;
      } else { res.push({v:nw.slice(), src:'new'}); snap({ kind:'c2', ok:false, i, done:i>=n }); break; }
    }
    while(i<n){ st[i]='c3'; res.push({v:iv[i].slice(), src:'c3'}); snap({ kind:'c3', i }); i++; }
    snap({ kind:'end', i });
    EX[k].ans = res.map(r=>r.v);
  });

  function labelOf(op){
    const ex=EX[op.ex], iv=ex.iv, tag=ex.name.split(' · ')[0];
    const I = j => '<code>intervals['+j+'] = '+fmt(iv[j])+'</code>';
    if(op.kind==='init') return '<strong>'+tag+'</strong> · <code>intervals = '+fmtL(iv)+'</code> 已按起點排好、互不重疊;要插入 <code>newInterval = '+fmt(op.nw)+'</code>。<code>i = 0</code>,<code>res</code> 是空的。';
    if(op.kind==='end') return '<strong>'+tag+' 結果</strong> · <code>res = '+fmtL(ex.ans)+'</code>。每個區間只被看過一次:前面的原樣搬、重疊的併進 new、後面的原樣搬。';
    if(op.kind==='c1'){
      if(op.ok) return '<strong>CASE 1</strong> · '+I(op.i)+' 的終點 '+iv[op.i][1]+' <b>&lt;</b> new 的起點 '+op.nw[0]+' → 整段在 new 左邊,碰不到 → 原樣 <code>push</code> 進 res,<code>i++</code>。';
      if(op.done) return '<strong>CASE 1 結束</strong> · <code>i = '+op.i+' = n</code>,沒有區間了。';
      return '<strong>CASE 1 結束</strong> · '+I(op.i)+' 的終點 '+iv[op.i][1]+' <b>≥</b> new 的起點 '+op.nw[0]+' → 不再完全在左邊,離開第一個 while(i 不動)。';
    }
    if(op.kind==='c2'){
      if(op.ok) return '<strong>CASE 2 · 合併</strong> · new 的終點 '+op.old[1]+' <b>≥</b> '+I(op.i)+' 的起點 '+iv[op.i][0]+' → 重疊'+(op.old[1]===iv[op.i][0]?'(剛好碰到也算)':'')+'。new = [min('+op.old[0]+', '+iv[op.i][0]+'), max('+op.old[1]+', '+iv[op.i][1]+')] = <code>'+fmt(op.nw)+'</code>。';
      if(op.done) return '<strong>CASE 2 結束</strong> · <code>i = n</code>,沒有區間了 → 把 new = <code>'+fmt(op.nw)+'</code> push 進 res。';
      return '<strong>CASE 2 結束</strong> · new 的終點 '+op.nw[1]+' <b>&lt;</b> '+I(op.i)+' 的起點 '+iv[op.i][0]+' → 碰不到了 → 把合併完的 new = <code>'+fmt(op.nw)+'</code> push 進 res。';
    }
    return '<strong>CASE 3</strong> · '+I(op.i)+' 一定在 new 右邊(起點已經比 new 的終點大,後面只會更大)→ 原樣 push,不用再比。';
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
    const op=OPS[step], ex=EX[op.ex], iv=ex.iv, n=iv.length, kind=op.kind;
    const isInit=kind==='init', isEnd=kind==='end';
    const X0=PAD+62, XR=w-PAD-IN, tagX=PAD+26;
    const maxV=Math.max(...iv.map(p=>p[1]), ex.nw[1])+1;
    const unit=(XR-X0)/maxV, X=v=>X0+v*unit, MINW=10;
    const span=(a,b)=>{ let x1=X(a), x2=X(b); if(x2-x1<MINW){ const c=(x1+x2)/2; x1=c-MINW/2; x2=c+MINW/2; } return [x1, x2-x1]; };

    /* ---------- BAND 0 · 哪個範例 ---------- */
    const tabF='700 11.5px '+SANS, tabW=Math.max(tw(EX.A.name,tabF), tw(EX.B.name,tabF))+22, tabH=20, tabY=6;
    ['A','B'].forEach((e,ix)=>{
      const x=w-PAD-(2-ix)*tabW-(ix===0?8:0), on=e===op.ex;
      rr(x, tabY, tabW, tabH, 10); ctx.fillStyle=on?C.ink:C.cell; ctx.fill();
      ctx.lineWidth=1.2; ctx.strokeStyle=on?C.ink:C.off; ctx.stroke();
      txt(EX[e].name, x+tabW/2, tabY+tabH/2+1, tabF, on?C.paper:C.dim, 'center', 'middle');
    });
    const T0=fitText(['intervals = '+fmtL(iv)+'   new = '+fmt(ex.nw), fmtL(iv)+' + '+fmt(ex.nw)], w-2*PAD-2*tabW-8-14, '700', [12.5,12,11.5,11,10.5,10], MONO);
    txt(T0.s, PAD, 20, T0.f, C.ink);

    /* ---------- BAND 1 · 數線 ---------- */
    const B1=50, hy=76, iy=88, ih=30, ny=146, nh=30, axY=196;
    let pT, pbg=C.cell, pbd=C.ink, ptx=C.ink, plw=1.2;
    if(isInit){ pT='i = 0 · res = []'; }
    else if(isEnd){ pT='完成 · '+op.res.length+' 段'; pbg=C.good; pbd=C.goodT; ptx=C.goodT; plw=1.6; }
    else if(kind==='c1'){ pT='CASE 1 · 左邊不重疊'; pbg=C.tint; }
    else if(kind==='c2'){ pT=op.ok?'CASE 2 · 合併':'CASE 2 · push new'; pbg=op.ok?C.redBg:C.good; pbd=op.ok?C.red:C.goodT; ptx=op.ok?C.redT:C.goodT; plw=1.8; }
    else { pT='CASE 3 · 右邊不重疊'; pbg=C.tint2; }
    const pF='700 11.5px '+MONO, pW=tw(pT,pF)+22, pH=20, pX=XR-pW;
    pill(pX, B1-14, pW, pH, pT, pF, pbg, pbd, ptx, plw);
    const t1='BAND 1 · 數線   藍 = case 1   米 = case 3   灰虛線 = 被 new 吸收   紅 = 這步比較的端點';
    const T1=fitText([t1, 'BAND 1 · 數線   紅 = 這步比較的端點', 'BAND 1 · 數線'], pX-PAD-14, '600', [11.5,11,10.5,10,9.5], MONO);
    txt(T1.s, PAD, B1, T1.f, C.dim);
    txt('intervals', tagX, iy+ih/2+1, fitText(['intervals'], 52, '700', [11.5,11,10.5,10], MONO).f, C.ink, 'center', 'middle');
    txt('new', tagX, ny+nh/2+1, '700 13px '+MONO, C.redT, 'center', 'middle');

    const cmp = (!isInit && !isEnd && op.i<n) ? op.i : -1;
    const hF='600 11px '+MONO, hFb='700 11px '+MONO;
    for(let j=0;j<n;j++){
      const [x,ww]=span(iv[j][0], iv[j][1]), s=op.st[j], on=j===cmp && kind!=='c3';
      let st={bg:C.cell, bd:C.ink, tx:C.ink, lw:1.4};
      if(s==='c1') st={bg:C.tint, bd:C.ink, tx:C.ink, lw:1.4};
      else if(s==='c3') st={bg:C.tint2, bd:C.ink, tx:C.ink, lw:1.4};
      else if(s==='eat') st={bg:C.cell, bd:C.dim, tx:C.dim, lw:1.3, dash:true};
      if(on) st={bg:s==='eat'?C.redBg:(s==='c1'?C.tint:C.cell), bd:C.red, tx:C.redT, lw:2.6};
      if(j===cmp && kind==='c3') st={bg:C.tint2, bd:C.red, tx:C.redT, lw:2.4};
      box(x, iy, ww, ih, st);
      const head=fmt(iv[j]), cx=x+ww/2;
      txt(head, cx, hy, (j===cmp)?hFb:hF, (j===cmp)?C.redT:C.dim, 'center', 'middle');
      const id='i='+j, idF='700 '+(ww>=34?11.5:10)+'px '+MONO;
      if(tw(id,idF)<=ww-4) txt(id, cx, iy+ih/2+1, idF, st.tx, 'center', 'middle');
      else if(tw(String(j),idF)<=ww-2) txt(String(j), cx, iy+ih/2+1, idF, st.tx, 'center', 'middle');
    }
    // 比較的兩個端點(紅虛線拉到刻度)
    if(cmp>=0 && (kind==='c1' || kind==='c2')){
      const a = kind==='c1' ? iv[cmp][1] : iv[cmp][0];
      const b = kind==='c1' ? op.nw[0] : (op.ok ? op.old[1] : op.nw[1]);
      line(X(a), iy+ih+2, X(a), axY, C.red2, 1.6, [4,3]);
      line(X(b), ny+nh+2, X(b), axY, C.red, 1.6, [4,3]);
    }

    // new
    if(kind==='c2' && op.ok){
      const [gx,gw]=span(op.old[0], op.old[1]);
      box(gx, ny, gw, nh, {bg:C.cell, bd:C.red, lw:1.3, dash:true});
    }
    const pushed = op.res.some(r=>r.src==='new');
    const [nx,nw_]=span(op.nw[0], op.nw[1]);
    const nst = pushed ? {bg:C.good, bd:C.goodT, tx:C.goodT, lw:2.2} : {bg:C.redBg, bd:C.red, tx:C.redT, lw:2.4};
    box(nx, ny+(kind==='c2'&&op.ok?5:0), nw_, nh-(kind==='c2'&&op.ok?10:0), nst);
    const NT=fitText(['new = '+fmt(op.nw), fmt(op.nw)], Math.max(nw_-8, 0), '700', [12,11.5,11,10.5], MONO);
    if(tw(NT.s,NT.f)<=nw_-8) txt(NT.s, nx+nw_/2, ny+nh/2+1, NT.f, nst.tx, 'center', 'middle');
    else txt(fmt(op.nw), nx+nw_+8, ny+nh/2+1, '700 11.5px '+MONO, nst.tx, 'left', 'middle');

    // 刻度
    line(X0, axY, XR, axY, C.ink, 1.2);
    const tF='600 '+(unit>=24?11:9.5)+'px '+MONO, every = unit>=20?1:2;
    for(let v=0; v<=maxV; v+=1){
      const x=X(v); line(x, axY-4, x, axY+4, C.ink, 1);
      if(v%every===0) txt(String(v), x, axY+16, tF, C.dim, 'center', 'middle');
    }

    /* ---------- BAND 2 · res ---------- */
    const B2=236, ry=248, rh=30;
    txt('BAND 2 · res(同一條數線;綠 = 合併完的 new)', PAD, B2, fitText(['BAND 2 · res(同一條數線;綠 = 合併完的 new)','BAND 2 · res'], w-2*PAD, '600', [11.5,11,10.5,10,9.5], MONO).f, C.dim);
    txt('res', tagX, ry+rh/2+1, '700 13px '+MONO, C.ink, 'center', 'middle');
    const pushedNow = (kind==='c1'&&op.ok) || (kind==='c2'&&!op.ok) || kind==='c3';
    if(op.res.length===0){
      box(X0, ry, XR-X0, rh, {bg:C.cell, bd:C.off, lw:1.2, dash:true});
      txt('res = [ ] · 還沒放任何區間', X0+(XR-X0)/2, ry+rh/2+1, '600 12px '+SANS, C.dim, 'center', 'middle');
    } else {
      op.res.forEach((r,k)=>{
        const [x,ww]=span(r.v[0], r.v[1]), last=k===op.res.length-1 && pushedNow;
        let st = r.src==='c1' ? {bg:C.tint, bd:C.ink, tx:C.ink, lw:1.4}
               : r.src==='c3' ? {bg:C.tint2, bd:C.ink, tx:C.ink, lw:1.4}
               : {bg:C.good, bd:C.goodT, tx:C.goodT, lw:2};
        if(last) st=Object.assign({}, st, {bd:C.red, lw:2.6});
        box(x, ry, ww, rh, st);
        const s=fmt(r.v), f='700 '+(ww>=44?11.5:10.5)+'px '+MONO;
        if(tw(s,f)<=ww-6) txt(s, x+ww/2, ry+rh/2+1, f, st.tx, 'center', 'middle');
        else txt(s, x+ww/2, ry+rh+12, '700 10px '+MONO, st.tx, 'center', 'middle');
      });
    }

    /* ---------- BAND 3 · 這一步的條件 ---------- */
    const sy=304, sh=36;
    let sl, sbg=C.cell, sbd=C.ink, stx=C.ink, slw=1.2;
    if(isInit){ sl=['n = '+n+' · new = '+fmt(op.nw)+' · 從 CASE 1 開始比', 'n = '+n+' · 從 CASE 1 開始']; sbg=C.tint; }
    else if(isEnd){ sl=['res = '+fmtL(ex.ans), fmtL(ex.ans)]; sbg=C.good; sbd=C.goodT; stx=C.goodT; slw=2.2; }
    else if(kind==='c1'){
      if(op.done) sl='i = n → 沒有區間,進 CASE 2';
      else { const a=iv[op.i][1], b=op.nw[0];
        sl = op.ok ? ['intervals['+op.i+'][1] = '+a+' < new[0] = '+b+' → push '+fmt(iv[op.i]), a+' < '+b+' → push']
                   : ['intervals['+op.i+'][1] = '+a+' ≥ new[0] = '+b+' → 離開 CASE 1', a+' ≥ '+b+' → 離開 CASE 1'];
        sbg=C.tint; }
    } else if(kind==='c2'){
      if(op.ok){ const a=op.old[1], b=iv[op.i][0];
        sl=['new[1] = '+a+' ≥ intervals['+op.i+'][0] = '+b+' → new = '+fmt(op.nw), a+' ≥ '+b+' → new = '+fmt(op.nw)]; sbg=C.redBg; sbd=C.red; stx=C.redT; slw=2; }
      else if(op.done){ sl='i = n → push new = '+fmt(op.nw); sbg=C.good; sbd=C.goodT; stx=C.goodT; slw=2; }
      else { const a=op.nw[1], b=iv[op.i][0];
        sl=['new[1] = '+a+' < intervals['+op.i+'][0] = '+b+' → push new = '+fmt(op.nw), a+' < '+b+' → push '+fmt(op.nw)]; sbg=C.good; sbd=C.goodT; stx=C.goodT; slw=2; }
    } else { sl=['剩下的直接 push '+fmt(iv[op.i])+'(不用比)', 'push '+fmt(iv[op.i])]; sbg=C.tint2; }
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
