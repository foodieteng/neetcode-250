/* ============================================================
   P2402 · Meeting Rooms III — 按起點排序 + 兩個 heap
     freeRoom:空房的編號(min-heap,先用編號小的)
     usedRoom:{結束時間, 編號}(min-heap,結束早的先空;同時結束取編號小的)
     每場 [s,e):先把結束 ≤ s 的房間放回 freeRoom;
                沒有空房 → 等 usedRoom.top() 那間空出來,會議整段延後:e = end + (e − s)
                用 freeRoom.top(),freq[idx]++
   答案 = 開最多場的房間(平手取編號小的)
   範例 A(官方 1)n = 2,[[0,10],[1,5],[2,7],[3,4]] → 0
   範例 B(官方 2)n = 3,[[1,20],[2,10],[3,5],[4,9],[6,8]] → 1
     BAND 0  目前是哪個範例 + 輸入
     BAND 1  每間房的時間軸(實際開會的時段;延後的會議紅框)+ 右邊是 freq
     BAND 2  freeRoom / usedRoom 兩個 heap
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
    A: { n:2, iv:[[0,10],[1,5],[2,7],[3,4]],                 name:'範例 A · 官方 1' },
    B: { n:3, iv:[[1,20],[2,10],[3,5],[4,9],[6,8]],          name:'範例 B · 官方 2' },
  };
  const fmt = p => '['+p[0]+','+p[1]+')';
  const fmtL = L => '['+L.map(p=>'['+p[0]+','+p[1]+']').join(',')+']';

  const OPS = [];
  ['A','B'].forEach(k=>{
    const n=EX[k].n, iv=EX[k].iv.map(p=>p.slice()).sort((a,b)=>a[0]-b[0]); EX[k].sorted=iv;
    let free=[...Array(n).keys()], used=[], freq=Array(n).fill(0), sched=[];   // sched: {room, s, e, orig, delay}
    const sortU = ()=>used.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
    const snap = o => OPS.push(Object.assign({ ex:k, free:free.slice().sort((a,b)=>a-b), used:used.map(u=>u.slice()), freq:freq.slice(), sched:sched.map(x=>Object.assign({},x)) }, o));
    snap({ kind:'init' });
    snap({ kind:'sort' });
    iv.forEach((m,i)=>{
      let s=m[0], e=m[1]; const rel=[];
      sortU();
      while(used.length && used[0][0] <= s){ const u=used.shift(); rel.push(u); free.push(u[1]); }
      let wait=null;
      if(!free.length){ sortU(); const u=used.shift(); wait=u; e=u[0]+(e-s); free.push(u[1]); }
      free.sort((a,b)=>a-b); const idx=free.shift(); freq[idx]++;
      used.push([e, idx]); sortU();
      const st = wait ? wait[0] : s;
      sched.push({ room:idx, s:st, e, orig:m.slice(), delay: st-s });
      snap({ kind:'meet', i, rel, wait, idx, start:st, end:e });
    });
    let best=0; for(let r=1;r<n;r++) if(freq[r]>freq[best]) best=r;
    EX[k].ans=best;
    snap({ kind:'end' });
  });

  function labelOf(op){
    const ex=EX[op.ex], iv=ex.sorted, tag=ex.name.split(' · ')[0], n=ex.n;
    if(op.kind==='init') return '<strong>'+tag+'</strong> · n = '+n+' 間房(編號 0–'+(n-1)+'),會議 <code>'+fmtL(ex.iv)+'</code>。有空房就用編號最小的;沒有就等最早空出來的那間,會議整段往後延。';
    if(op.kind==='sort') return '<strong>SORT · 按起點</strong>(題目保證起點都不同)→ 照開始時間一場一場分配。freeRoom = {'+op.free.join(', ')+'},usedRoom 是空的。';
    if(op.kind==='end') return '<strong>'+tag+' 結果</strong> · freq = ['+op.freq.join(', ')+'] → 最多的是房間 <code>'+ex.ans+'</code>'+(op.freq.filter(f=>f===Math.max(...op.freq)).length>1?'(平手,取編號小的)':'')+'。';
    const m=iv[op.i];
    let t='<strong>現在 = '+m[0]+'</strong> · <code>'+fmt(m)+'</code>:';
    if(op.rel.length) t+='先把結束 ≤ '+m[0]+' 的房間放回 free('+op.rel.map(u=>'房間 '+u[1]+' @ '+u[0]).join('、')+');';
    if(op.wait){
      t+='沒有空房 → 等 usedRoom.top() = <code>{'+op.wait[0]+', '+op.wait[1]+'}</code>'+(op.tie?'':'')+',會議延後到 '+op.start+' 開始,<code>e = '+op.wait[0]+' + ('+m[1]+' − '+m[0]+') = '+op.end+'</code>。';
    } else t+='有空房,用編號最小的。';
    t+='→ 房間 <code>'+op.idx+'</code>,freq = ['+op.freq.join(', ')+']。';
    return t;
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
    const op=OPS[step], ex=EX[op.ex], kind=op.kind, n=ex.n;
    const isStep=kind==='meet', isEnd=kind==='end';
    const X0=PAD+62, FQ=48, XR=w-PAD-IN-FQ, tagX=PAD+26;
    const maxV=Math.max(...OPS.filter(o=>o.ex===op.ex).flatMap(o=>o.sched.map(x=>x.e)), ...ex.iv.map(p=>p[1]))+1;
    const unit=(XR-X0)/maxV, X=v=>X0+v*unit;

    /* ---------- BAND 0 ---------- */
    const tabF='700 11.5px '+SANS, tabW=Math.max(tw(EX.A.name,tabF), tw(EX.B.name,tabF))+22, tabH=20, tabY=6;
    ['A','B'].forEach((e,ix)=>{
      const x=w-PAD-(2-ix)*tabW-(ix===0?8:0), on=e===op.ex;
      rr(x, tabY, tabW, tabH, 10); ctx.fillStyle=on?C.ink:C.cell; ctx.fill();
      ctx.lineWidth=1.2; ctx.strokeStyle=on?C.ink:C.off; ctx.stroke();
      txt(EX[e].name, x+tabW/2, tabY+tabH/2+1, tabF, on?C.paper:C.dim, 'center', 'middle');
    });
    const T0=fitText(['n = '+n+' · '+fmtL(ex.iv), fmtL(ex.iv)], w-2*PAD-2*tabW-8-14, '700', [12.5,12,11.5,11,10.5,10], MONO);
    txt(T0.s, PAD, 20, T0.f, C.ink);

    /* ---------- BAND 1 · 房間時間軸 ---------- */
    const B1=50, L0=84, laneH=36, bh=22, axY=L0+3*laneH+6;
    let pT, pbg=C.cell, pbd=C.ink, ptx=C.ink, plw=1.2;
    if(kind==='init') pT='n = '+n+' 間';
    else if(kind==='sort') pT='SORT · 按起點';
    else if(isStep){ pT=(op.wait?'延後 '+(op.start-iv0(op)[0])+' · ':'')+'→ 房間 '+op.idx; if(op.wait){pbg=C.redBg; pbd=C.red; ptx=C.redT;} else {pbg=C.good; pbd=C.goodT; ptx=C.goodT;} plw=1.8; }
    else { pT='return '+ex.ans; pbg=C.good; pbd=C.goodT; ptx=C.goodT; plw=1.8; }
    const pF='700 11.5px '+MONO, pW=tw(pT,pF)+22, pH=20, pX=w-PAD-IN-pW;
    pill(pX, B1-14, pW, pH, pT, pF, pbg, pbd, ptx, plw);
    const T1=fitText(['BAND 1 · 每間房實際開會的時段   紅框 = 延後的會議   右邊 = freq', 'BAND 1 · 每間房的時段   右邊 = freq', 'BAND 1'], pX-PAD-14, '600', [11.5,11,10.5,10,9.5], MONO);
    txt(T1.s, PAD, B1, T1.f, C.dim);
    const mx=Math.max(...op.freq);
    if(isStep){ const t=iv0(op)[0]; line(X(t), L0-2, X(t), axY, C.red, 1.6, [4,3]); txt('現在 = '+t, X(t)+6, L0-9, '700 10.5px '+MONO, C.redT, 'left', 'middle'); }
    for(let r=0;r<n;r++){
      const y=L0+r*laneH+(laneH-bh)/2, hot=isStep&&op.idx===r;
      txt('房 '+r, tagX, y+bh/2+1, '700 12px '+SANS, hot?C.redT:C.ink, 'center', 'middle');
      line(X0, y+bh/2, XR, y+bh/2, '#efefef', 1);
      op.sched.filter(x=>x.room===r).forEach((x,k,arr)=>{
        const isNew = isStep && x===op.sched[op.sched.length-1];
        const x1=X(x.s), ww=X(x.e)-X(x.s);
        const st = isNew ? (x.delay?{bg:C.redBg, bd:C.red, tx:C.redT, lw:2.6}:{bg:C.good, bd:C.goodT, tx:C.goodT, lw:2.6})
                         : (x.delay?{bg:C.tint2, bd:C.red, tx:C.redT, lw:1.4, dash:true}:{bg:C.tint2, bd:C.ink, tx:C.ink, lw:1.3});
        box(x1, y, ww, bh, st);
        const lab = x.delay ? [fmt(x.orig)+' 延後'+x.delay, fmt(x.orig)+'+'+x.delay, '+'+x.delay] : [fmt(x.orig), String(x.orig[0])];
        let placed=false;
        for(const s of lab) for(const z of [11,10.5,10]){ const f='700 '+z+'px '+MONO; if(!placed && tw(s,f)<=ww-6){ txt(s, x1+ww/2, y+bh/2+1, f, st.tx, 'center', 'middle'); placed=true; } }
      });
      const fq='×'+op.freq[r], best=isEnd&&r===ex.ans;
      if(best){ rr(XR+10, y-1, FQ-6, bh+2, 6); ctx.fillStyle=C.good; ctx.fill(); ctx.lineWidth=2; ctx.strokeStyle=C.goodT; ctx.stroke(); }
      txt(fq, XR+10+(FQ-6)/2, y+bh/2+1, '700 13px '+MONO, best?C.goodT:(op.freq[r]===mx&&mx>0?C.ink:C.dim), 'center', 'middle');
    }
    for(let r=n;r<3;r++){ const y=L0+r*laneH+(laneH-bh)/2; txt('—', tagX, y+bh/2+1, '600 11px '+MONO, C.off, 'center', 'middle'); }
    line(X0, axY, XR, axY, C.ink, 1.2);
    const tF='600 '+(unit>=24?11:10)+'px '+MONO, every = unit>=22?1:(unit>=11?2:5);
    for(let v=0; v<=maxV; v++){ const x=X(v); line(x, axY-(v%every===0?4:2), x, axY+(v%every===0?4:2), C.ink, 1); if(v%every===0) txt(String(v), x, axY+16, tF, C.dim, 'center', 'middle'); }

    /* ---------- BAND 2 · 兩個 heap ---------- */
    const B2=axY+46, fy=B2+12, ch=28, uy=fy+ch+14;
    txt('BAND 2 · freeRoom = 空房編號(小的先用)   usedRoom = {結束時間, 編號}(早結束的在 top)', PAD, B2, fitText(['BAND 2 · freeRoom = 空房編號(小的先用)   usedRoom = {結束時間, 編號}(早結束的在 top)','BAND 2 · freeRoom / usedRoom'], w-2*PAD, '600', [11.5,11,10.5,10,9.5], MONO).f, C.dim);
    txt('free', tagX, fy+ch/2+1, '700 12px '+MONO, C.ink, 'center', 'middle');
    txt('used', tagX, uy+ch/2+1, '700 12px '+MONO, C.ink, 'center', 'middle');
    let fx=X0;
    if(op.free.length===0){ txt('空的 —— 沒有空房', fx, fy+ch/2+1, '600 12px '+SANS, C.dim, 'left', 'middle'); }
    op.free.forEach((r,k)=>{ box(fx, fy, 40, ch, {bg:k===0?C.tint:C.cell, bd:C.ink, lw:1.3}); txt(String(r), fx+20, fy+ch/2+1, '700 13px '+MONO, C.ink, 'center', 'middle'); fx+=50; });
    let ux=X0;
    if(op.used.length===0){ txt('空的', ux, uy+ch/2+1, '600 12px '+SANS, C.dim, 'left', 'middle'); }
    op.used.forEach((u,k)=>{ const s='{'+u[0]+', '+u[1]+'}', cw=tw(s,'700 12.5px '+MONO)+20, isNew=isStep&&u[1]===op.idx&&u[0]===op.end;
      box(ux, uy, cw, ch, isNew?{bg:C.redBg, bd:C.red, lw:2.2}:{bg:k===0?C.tint2:C.cell, bd:C.ink, lw:1.3}); txt(s, ux+cw/2, uy+ch/2+1, '700 12.5px '+MONO, isNew?C.redT:C.ink, 'center', 'middle'); ux+=cw+10; });

    /* ---------- BAND 3 ---------- */
    const sy=uy+ch+18, sh=34;
    let sl, sbg=C.cell, sbd=C.ink, stx=C.ink, slw=1.2;
    if(kind==='init'){ sl=['freeRoom = {'+op.free.join(', ')+'} · freq = ['+op.freq.join(', ')+']']; sbg=C.tint; }
    else if(kind==='sort'){ sl=['sorted = '+fmtL(ex.sorted), fmtL(ex.sorted)]; sbg=C.tint; }
    else if(isStep){ const m=iv0(op);
      if(op.wait){ sl=['無空房 → 等 {'+op.wait[0]+', '+op.wait[1]+'} → e = '+op.wait[0]+' + '+(m[1]-m[0])+' = '+op.end+' → 房間 '+op.idx, 'e = '+op.end+' → 房間 '+op.idx]; sbg=C.redBg; sbd=C.red; stx=C.redT; slw=2; }
      else { sl=[(op.rel.length?'釋放 '+op.rel.map(u=>'房'+u[1]).join(',')+' → ':'')+'freeRoom.top() = '+op.idx+' → ['+m[0]+', '+m[1]+')', '→ 房間 '+op.idx]; sbg=C.good; sbd=C.goodT; stx=C.goodT; slw=2; } }
    else { sl=['freq = ['+op.freq.join(', ')+'] → return '+ex.ans, 'return '+ex.ans]; sbg=C.good; sbd=C.goodT; stx=C.goodT; slw=2.2; }
    rr(X0, sy, w-PAD-IN-X0, sh, 6); ctx.fillStyle=sbg; ctx.fill(); ctx.lineWidth=slw; ctx.strokeStyle=sbd; ctx.stroke();
    txt('這一步', tagX, sy+sh/2+1, '700 12px '+SANS, C.ink, 'center', 'middle');
    const SL=fitText(Array.isArray(sl)?sl:[sl], w-PAD-IN-X0-24, '700', [13,12.5,12,11.5,11], MONO);
    txt(SL.s, X0+12, sy+sh/2+1, SL.f, stx, 'left', 'middle');
  }
  function iv0(op){ return EX[op.ex].sorted[op.i]; }

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
