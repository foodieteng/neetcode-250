/* ============================================================
   P253 · Meeting Rooms II — 按「起點」排序 + min-heap 存每間會議室的結束時間
     每場會議 v:先把 heap 裡 結束時間 <= v[0] 的全部 pop(那些房間空出來了)
               再 push(v[1]),room = max(room, heap 大小)
   碰到(end == start)可以接著用同一間。
   範例 A(官方 1)[[0,30],[5,10],[15,20]] → 2
   範例 B         [[0,3],[1,4],[2,7],[5,6]] → 3(按終點排序會錯算成 2 的那組)
     BAND 0  目前是哪個範例 + 輸入
     BAND 1  數線:按起點排好的會議(紅虛線 = 現在的時間 = v[0])
     BAND 2  heap:正在使用中的會議室(存結束時間,最小的在 top)
     BAND 3  這一步做了什麼
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
    B: { iv:[[0,3],[1,4],[2,7],[5,6]],               name:'範例 B · 需要 3 間' },
  };
  const fmt = p => '['+p[0]+','+p[1]+']';
  const fmtL = L => '['+L.map(fmt).join(',')+']';
  // 和 std::sort 實測出來的順序一致(終點相同時保持原順序)
  const byStart = L => L.map(p=>p.slice()).sort((a,b)=>a[0]-b[0]||a[1]-b[1]);

  /* st[j]:'wait' | 'run'(還佔著房間)| 'done'(房間已釋放) */
  const OPS = [];
  ['A','B'].forEach(k=>{
    const iv=byStart(EX[k].iv), n=iv.length; EX[k].sorted=iv;
    const st=iv.map(()=>'wait'); let heap=[], room=0;   // heap 存 [end, idx]
    const snap = o => OPS.push(Object.assign({ ex:k, st:st.slice(), heap:heap.map(h=>h.slice()).sort((x,y)=>x[0]-y[0]), room }, o));
    snap({ kind:'init' });
    snap({ kind:'sort' });
    for(let i=0;i<n;i++){
      heap.sort((x,y)=>x[0]-y[0]);
      const popped=[];
      while(heap.length && heap[0][0] <= iv[i][0]){ const h=heap.shift(); popped.push(h); st[h[1]]='done'; }
      heap.push([iv[i][1], i]); st[i]='run';
      const before=room; room=Math.max(room, heap.length);
      snap({ kind:'meet', i, popped, before });
    }
    snap({ kind:'end' });
    EX[k].ans=room;
  });

  function labelOf(op){
    const ex=EX[op.ex], iv=ex.sorted, tag=ex.name.split(' · ')[0], n=iv.length;
    if(op.kind==='init') return '<strong>'+tag+'</strong> · 輸入 <code>'+fmtL(ex.iv)+'</code>,n = '+n+'。最少要幾間會議室 = 同一時刻最多有幾場會在開。';
    if(op.kind==='sort') return '<strong>SORT · 按起點</strong> · <code>'+fmtL(iv)+'</code>。照開始時間處理,時間只往前走,「現在」就是這場的起點。';
    if(op.kind==='end') return '<strong>'+tag+' 結果</strong> · 最多同時用了 <code>room = '+op.room+'</code> 間。';
    const x=iv[op.i], pp=op.popped.map(h=>h[0]);
    const popTxt = pp.length ? '先 pop 結束時間 '+pp.join('、')+'(≤ '+x[0]+',那些房間空了)' : 'heap 裡沒有 ≤ '+x[0]+' 的結束時間,沒有房間空出來';
    return '<strong>現在 = '+x[0]+'</strong> · <code>'+fmt(x)+'</code> 要開始:'+popTxt+',再 push '+x[1]+'。heap 大小 '+op.heap.length+' → <code>room = max('+op.before+', '+op.heap.length+') = '+op.room+'</code>。';
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
    const isInit=kind==='init', isEnd=kind==='end', isStep=kind==='meet';
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
    const B1=50, L0=84, laneH=28, bh=18, axY=L0+4*laneH+12;
    let pT, pbg=C.cell, pbd=C.ink, ptx=C.ink, plw=1.2;
    if(isInit){ pT='原始順序'; }
    else if(kind==='sort'){ pT='SORT · a[0] < b[0]'; pbg=C.tint; }
    else if(isStep){ pT='room = '+op.room; pbg=C.redBg; pbd=C.red; ptx=C.redT; plw=1.8; }
    else { pT='return '+op.room; pbg=C.good; pbd=C.goodT; ptx=C.goodT; plw=1.8; }
    const pF='700 11.5px '+MONO, pW=tw(pT,pF)+22, pH=20, pX=XR-pW;
    pill(pX, B1-14, pW, pH, pT, pF, pbg, pbd, ptx, plw);
    const t1 = isInit ? 'BAND 1 · 輸入的原始順序(一場會議一條線)'
                      : 'BAND 1 · 按起點排序   米 = 佔著房間   灰 = 已結束   紅 = 這一場   紅虛線 = 現在';
    const T1=fitText([t1, 'BAND 1 · 按起點排序   紅虛線 = 現在', 'BAND 1'], pX-PAD-14, '600', [11.5,11,10.5,10,9.5], MONO);
    txt(T1.s, PAD, B1, T1.f, C.dim);

    const cur = isStep ? op.i : -1;
    for(let j=0;j<n;j++){
      const y=L0+j*laneH+(laneH-bh)/2, [x,ww]=span(iv[j][0], iv[j][1]);
      txt((isInit?'#':'i=')+j, tagX, y+bh/2+1, '700 11px '+MONO, j===cur?C.redT:C.dim, 'center', 'middle');
      line(X0, y+bh/2, XR, y+bh/2, '#efefef', 1);
      const s=isInit?'wait':op.st[j];
      let st={bg:C.cell, bd:C.ink, tx:C.ink, lw:1.3};
      if(s==='run') st={bg:C.tint2, bd:C.ink, tx:C.ink, lw:1.5};
      if(s==='done') st={bg:C.cell, bd:C.off, tx:C.dim, lw:1.2, dash:true};
      if(j===cur) st={bg:C.redBg, bd:C.red, tx:C.redT, lw:2.6};
      box(x, y, ww, bh, st);
      const lab=fmt(iv[j]), f=(j===cur?'700 ':'600 ')+'11px '+MONO, sw=tw(lab,f);
      if(x+ww+8+sw <= XR) txt(lab, x+ww+8, y+bh/2+1, f, st.tx, 'left', 'middle');
      else if(ww>sw+16) txt(lab, x+ww-8, y+bh/2+1, f, st.tx, 'right', 'middle');
      else txt(lab, x-8, y+bh/2+1, f, st.tx, 'right', 'middle');
    }

    // 現在的時間 = 這一場的起點
    if(isStep){
      const t=iv[op.i][0];
      line(X(t), L0-2, X(t), axY, C.red, 1.6, [4,3]);
      txt('現在 = '+t, X(t)+6, L0-9, '700 10.5px '+MONO, C.redT, 'left', 'middle');
    }

    // 刻度
    line(X0, axY, XR, axY, C.ink, 1.2);
    const tF='600 '+(unit>=24?11:10)+'px '+MONO, every = unit>=22?1:(unit>=11?2:5);
    for(let v=0; v<=maxV; v++){ const x=X(v); line(x, axY-(v%every===0?4:2), x, axY+(v%every===0?4:2), C.ink, 1); if(v%every===0) txt(String(v), x, axY+16, tF, C.dim, 'center', 'middle'); }

    /* ---------- BAND 2 · heap ---------- */
    const B2=axY+46, ry=B2+12, rh=32;
    txt('BAND 2 · heap = 使用中會議室的結束時間(最小的在 top,紅框 = 剛 push)', PAD, B2, fitText(['BAND 2 · heap = 使用中會議室的結束時間(最小的在 top,紅框 = 剛 push)','BAND 2 · heap(最小的在 top)'], w-2*PAD, '600', [11.5,11,10.5,10,9.5], MONO).f, C.dim);
    txt('heap', tagX, ry+rh/2+1, '700 13px '+MONO, C.ink, 'center', 'middle');
    const cw=58, gap=14;
    let hx=X0;
    if(isStep && op.popped.length){
      op.popped.forEach(h=>{ box(hx, ry, cw, rh, {bg:C.cell, bd:C.off, lw:1.2, dash:true}); txt(String(h[0]), hx+cw/2, ry+rh/2+1, '700 13px '+MONO, C.dim, 'center', 'middle'); line(hx+8, ry+rh/2, hx+cw-8, ry+rh/2, C.dim, 1.4); hx+=cw+gap; });
      txt('pop', X0+(op.popped.length*(cw+gap)-gap)/2, ry+rh+13, '700 10px '+MONO, C.dim, 'center', 'middle');
      txt('→', hx+6, ry+rh/2+1, '700 15px '+MONO, C.ink, 'center', 'middle');
      hx+=28;
    }
    if(op.heap.length===0 && !isStep){
      box(X0, ry, XR-X0, rh, {bg:C.cell, bd:C.off, lw:1.2, dash:true});
      txt('heap 是空的 · 還沒有會議', X0+(XR-X0)/2, ry+rh/2+1, '600 12px '+SANS, C.dim, 'center', 'middle');
    } else {
      op.heap.forEach((h,k)=>{
        const isNew = isStep && h[1]===op.i;
        const st = isNew ? {bg:C.redBg, bd:C.red, tx:C.redT, lw:2.4} : {bg:C.tint2, bd:C.ink, tx:C.ink, lw:1.4};
        box(hx, ry, cw, rh, st); txt(String(h[0]), hx+cw/2, ry+rh/2+1, '700 13px '+MONO, st.tx, 'center', 'middle');
        if(k===0) txt('top', hx+cw/2, ry+rh+13, '700 10px '+MONO, C.dim, 'center', 'middle');
        hx+=cw+gap;
      });
      const sz='size = '+op.heap.length+' 間';
      txt(sz, Math.min(XR, Math.max(hx+8, X0)) , ry+rh/2+1, '700 12px '+SANS, C.ink, hx+8+tw(sz,'700 12px '+SANS)>XR?'right':'left', 'middle');
    }

    /* ---------- BAND 3 · 條件 ---------- */
    const sy=ry+rh+30, sh=36;
    let sl, sbg=C.cell, sbd=C.ink, stx=C.ink, slw=1.2;
    if(isInit){ sl=['n = '+n+' · 先 sort(…, [&](auto& a, auto& b) { return a[0] < b[0]; })', 'n = '+n+' · 先按起點排序']; sbg=C.tint; }
    else if(kind==='sort'){ sl=['by start = '+fmtL(iv), fmtL(iv)]; sbg=C.tint; }
    else if(isStep){ const x=iv[op.i], pp=op.popped.map(h=>h[0]);
      sl=[(pp.length?'pop '+pp.join(','):'不 pop')+' → push '+x[1]+' → size '+op.heap.length+' → room = '+op.room, 'size '+op.heap.length+' → room = '+op.room];
      sbg=op.room>op.before?C.redBg:C.cell; sbd=op.room>op.before?C.red:C.ink; stx=op.room>op.before?C.redT:C.ink; slw=op.room>op.before?2:1.2; }
    else { sl='return room = '+op.room; sbg=C.good; sbd=C.goodT; stx=C.goodT; slw=2.2; }
    rr(X0, sy, XR-X0, sh, 6); ctx.fillStyle=sbg; ctx.fill(); ctx.lineWidth=slw; ctx.strokeStyle=sbd; ctx.stroke();
    txt('這一步', tagX, sy+sh/2+1, '700 12px '+SANS, C.ink, 'center', 'middle');
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
