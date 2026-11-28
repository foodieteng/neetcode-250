/* ============================================================
   P1851 · Minimum Interval to Include Each Query — 離線排序 + min-heap(lazy deletion)
     order = query 的 index 按值排序;intervals 按起點排序
     每個 q(由小到大):起點 ≤ q 的區間全部 push 進 heap,key = (size, right)
                      top 的 right < q → 已過期,pop(埋在下面的過期項先不管)
                      ans[原位置] = top.size(heap 空 → 保留初始 -1)
   範例(官方 2)intervals = [[2,3],[2,5],[1,8],[20,25]],queries = [2,19,5,22] → [2,-1,4,6]
     BAND 1  queries(原順序)/ ans[]  +  右邊:處理順序(按 q 排序)
     BAND 2  數線 0–26 上的四個區間(按起點排序)+ 目前 q 的紅線 + 指標 i
     BAND 3  heap 裡的 (size, right),最左 = top
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

  const Q   = [2, 19, 5, 22];                       // queries,原順序
  const ORD = [0, 2, 1, 3];                         // 按值排序後的原 index
  const IN  = [[2,3],[2,5],[1,8],[20,25]];          // 輸入順序
  const S   = [[1,8],[2,3],[2,5],[20,25]];          // 按起點排序
  const KEY = [[8,8],[2,3],[4,5],[6,25]];           // (size, right)
  const kS  = k => '('+KEY[k][0]+','+KEY[k][1]+')';
  const iS  = k => '['+S[k][0]+','+S[k][1]+']';
  const byKey = (a,b)=>KEY[a][0]-KEY[b][0]||KEY[a][1]-KEY[b][1];

  /* 每一步的狀態(直接照 trace 寫) */
  const OPS = [
    { kind:'init' },
    { kind:'sort', i:0 },
    { kind:'push', qi:0, s:0, i:1, heap:[0] },
    { kind:'push', qi:0, s:1, i:2, heap:[1,0] },
    { kind:'push', qi:0, s:2, i:3, heap:[1,2,0] },
    { kind:'ans',  qi:0, top:1, i:3, heap:[1,2,0], ans:[2,-1,-1,-1], wr:[0] },
    { kind:'pop',  qi:2, s:1, i:3, heap:[2,0], popped:[1], ans:[2,-1,-1,-1], wr:[0] },
    { kind:'ans',  qi:2, top:2, i:3, heap:[2,0], popped:[1], ans:[2,-1,4,-1], wr:[0,2] },
    { kind:'pop',  qi:1, s:2, i:3, heap:[0], popped:[1,2], ans:[2,-1,4,-1], wr:[0,2] },
    { kind:'pop',  qi:1, s:0, i:3, heap:[], popped:[1,2,0], ans:[2,-1,4,-1], wr:[0,2] },
    { kind:'ans',  qi:1, top:null, i:3, heap:[], popped:[1,2,0], ans:[2,-1,4,-1], wr:[0,2,1] },
    { kind:'push', qi:3, s:3, i:4, heap:[3], popped:[1,2,0], ans:[2,-1,4,-1], wr:[0,2,1] },
    { kind:'ans',  qi:3, top:3, i:4, heap:[3], popped:[1,2,0], ans:[2,-1,4,6], wr:[0,2,1,3] },
    { kind:'end',  i:4, heap:[3], popped:[1,2,0], ans:[2,-1,4,6], wr:[0,2,1,3] },
  ];
  OPS.forEach(o=>{ o.heap=(o.heap||[]).slice().sort(byKey); o.popped=o.popped||[]; o.ans=o.ans||[-1,-1,-1,-1]; o.wr=o.wr||[]; });

  const LABELS = [
    'intervals = <code>[[2,3],[2,5],[1,8],[20,25]]</code>,queries = <code>[2,19,5,22]</code>。<code>ans</code> 先全部設成 <code>-1</code>(灰色)。目標:每個 q 找「包含 q 的最短區間」的長度。',
    '<strong>兩邊都排序</strong> · query 不能直接排(答案要放回原位),所以排的是 index:<code>order = [0, 2, 1, 3]</code>(q = 2, 5, 19, 22)。intervals 按起點排成 <code>[1,8] [2,3] [2,5] [20,25]</code>,指標 <code>i = 0</code>。',
    '<strong>q = 2</strong>(原位置 0)· <code>[1,8]</code> 起點 1 ≤ 2 → push <code>(8,8)</code>。heap 的 key 是 <code>(size, right)</code>:最短的永遠在 top。',
    '<strong>q = 2</strong> · <code>[2,3]</code> 起點 2 ≤ 2 → push <code>(2,3)</code>,它比 (8,8) 短,成為新的 top。',
    '<strong>q = 2</strong> · <code>[2,5]</code> 起點 2 ≤ 2 → push <code>(4,5)</code>。下一個 <code>[20,25]</code> 起點 20 > 2,停,<code>i = 3</code>。',
    '<strong>q = 2</strong> · top <code>(2,3)</code> 的右端 3 ≥ 2,有效 → <code>ans[0] = 2</code>。',
    '<strong>q = 5</strong>(原位置 2)· <code>[20,25]</code> 起點 20 > 5,不 push。top <code>(2,3)</code> 的右端 3 < 5,已過期 → pop。',
    '<strong>q = 5</strong> · 新 top <code>(4,5)</code> 的右端 5 ≥ 5,有效 → <code>ans[2] = 4</code>。這是第 2 個處理的 query,但答案寫回 <code>ans[原位置] = ans[2]</code> —— 所以排序要排 index。',
    '<strong>q = 19</strong>(原位置 1)· <code>[20,25]</code> 起點 20 > 19,還不能 push。top <code>(4,5)</code> 的右端 5 < 19,已過期 → pop。',
    '<strong>q = 19</strong> · 新 top <code>(8,8)</code> 的右端 8 < 19,也過期 → pop。heap 空了。',
    '<strong>q = 19</strong> · heap 是空的 → 沒有區間包含 19,不寫,<code>ans[1]</code> 保留初始的 <code>-1</code>。',
    '<strong>q = 22</strong>(原位置 3)· <code>[20,25]</code> 起點 20 ≤ 22 → push <code>(6,25)</code>,<code>i = 4</code>,區間全部用完。',
    '<strong>q = 22</strong> · top <code>(6,25)</code> 的右端 25 ≥ 22,有效 → <code>ans[3] = 6</code>。',
    '<strong>OUTPUT</strong> <code>[2,-1,4,6]</code> · 每個區間 push 一次、最多 pop 一次 → O(n log n + q log q)。q 由小到大,過期的區間對後面的 q 也一定過期,所以 pop 掉不會後悔。',
  ];
  const steps = OPS.map((o,k)=>({ text: LABELS[k] }));

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
  function arrowDown(x, y1, y2, color){
    line(x, y1, x, y2-5, color, 2);
    ctx.beginPath(); ctx.moveTo(x-5, y2-7); ctx.lineTo(x+5, y2-7); ctx.lineTo(x, y2); ctx.closePath(); ctx.fillStyle=color; ctx.fill();
  }

  function draw(){
    fit();
    const w=canvas.clientWidth, H=canvas.clientHeight, PAD=22;
    ctx.fillStyle=C.paper; ctx.fillRect(0,0,w,H); ctx.setLineDash([]);
    const op=OPS[step], kind=op.kind, sorted=kind!=='init', isEnd=kind==='end';
    const qi=(op.qi==null?null:op.qi), q=qi==null?null:Q[qi];
    const ordPos = qi==null?-1:ORD.indexOf(qi);
    const lastAns = kind==='ans' ? qi : null;

    /* ---------- BAND 1 · queries / ans  +  處理順序 ---------- */
    const total=w-2*PAD, RX0=PAD+Math.round(total*0.56);
    const LX=PAD+64, LXR=RX0-22, lgap=10, lcw=(LXR-LX-3*lgap)/4;
    const RX=RX0+70, RXR=w-PAD, rgap=8, rcw=(RXR-RX-3*rgap)/4;
    const hdrY=18, idxY=38, r1=56, ch=28, r2=r1+ch+40;
    txt(fitText(['BAND 1 · queries(原順序)/ ans[]','BAND 1 · queries / ans'], LXR-PAD, '600', [11.5,11,10.5,10], MONO).s,
        PAD, hdrY, fitText(['BAND 1 · queries(原順序)/ ans[]','BAND 1 · queries / ans'], LXR-PAD, '600', [11.5,11,10.5,10], MONO).f, C.dim);
    const RH=fitText(['處理順序 · 按 q 由小到大','處理順序'], RXR-RX0, '600', [11.5,11,10.5,10], MONO);
    txt(RH.s, RX0, hdrY, RH.f, C.dim);
    line(RX0-11, hdrY+10, RX0-11, r2+ch, '#ececec', 1);

    txt('queries', PAD+30, r1+ch/2+1, '700 12px '+MONO, C.ink, 'center', 'middle');
    txt('ans', PAD+30, r2+ch/2+1, '700 12px '+MONO, C.ink, 'center', 'middle');
    for(let j=0;j<4;j++){
      const x=LX+j*(lcw+lgap), cur=j===qi;
      txt(String(j), x+lcw/2, idxY, '600 11px '+MONO, cur?C.redT:C.dim, 'center', 'middle');
      box(x, r1, lcw, ch, cur?{bg:C.redBg, bd:C.red, lw:2.2}:{bg:C.cell, bd:C.ink, lw:1.3});
      txt(String(Q[j]), x+lcw/2, r1+ch/2+1, '700 13px '+MONO, cur?C.redT:C.ink, 'center', 'middle');
      const written=op.wr.includes(j), now=lastAns===j;
      let st, tc;
      if(now){ st={bg:C.redBg, bd:C.red, lw:2.4}; tc=C.redT; }
      else if(isEnd){ st={bg:C.good, bd:C.goodT, lw:1.8}; tc=C.goodT; }
      else if(written){ st={bg:C.cell, bd:C.ink, lw:1.3}; tc=C.ink; }
      else { st={bg:C.cell, bd:C.off, lw:1.2, dash:true}; tc=C.dim; }
      box(x, r2, lcw, ch, st);
      txt(String(op.ans[j]), x+lcw/2, r2+ch/2+1, '700 13px '+MONO, tc, 'center', 'middle');
      if(now){
        const ax=x+lcw/2; arrowDown(ax, r1+ch+8, r2-8, C.red);
        txt(op.top==null?'保留':'寫回', ax+9, (r1+ch+r2)/2+1, '700 11px '+SANS, C.redT, 'left', 'middle');
      }
    }
    // 處理順序
    txt('q', RX0+32, r1+ch/2+1, '700 12px '+MONO, C.ink, 'center', 'middle');
    txt('原位置', RX0+32, r2+ch/2+1, '700 12px '+SANS, C.ink, 'center', 'middle');
    if(!sorted){
      txt('還沒排序', RX, r1+ch/2+1, '600 12px '+SANS, C.dim, 'left', 'middle');
      txt('—', RX, r2+ch/2+1, '600 12px '+MONO, C.off, 'left', 'middle');
    } else {
      for(let p=0;p<4;p++){
        const x=RX+p*(rcw+rgap), oi=ORD[p], cur=p===ordPos, done=ordPos>p || isEnd;
        txt('#'+(p+1), x+rcw/2, idxY, '600 11px '+MONO, cur?C.redT:C.dim, 'center', 'middle');
        const st = cur?{bg:C.redBg, bd:C.red, lw:2.2}:(done?{bg:C.cell, bd:C.off, lw:1.2}:{bg:C.tint, bd:C.ink, lw:1.3});
        const tc = cur?C.redT:(done?C.dim:C.ink);
        box(x, r1, rcw, ch, st); txt(String(Q[oi]), x+rcw/2, r1+ch/2+1, '700 13px '+MONO, tc, 'center', 'middle');
        box(x, r2, rcw, ch, st); txt(String(oi), x+rcw/2, r2+ch/2+1, '700 13px '+MONO, tc, 'center', 'middle');
        line(x+rcw/2, r1+ch+6, x+rcw/2, r2-6, cur?C.red:'#e2e2e2', cur?1.6:1, [3,3]);
      }
    }

    /* ---------- BAND 2 · 數線 + 區間 ---------- */
    const B2=r2+ch+40, X0=PAD+84, XR=w-PAD-8, NV=27, unit=(XR-X0)/NV, X=v=>X0+(v+0.5)*unit;
    const legF='600 10.5px '+SANS;
    const leg=[['灰 未 push',C.cell,C.off,true],['藍 在 heap',C.tint,C.ink,false],['紅 目前',C.redBg,C.red,false],['粉 已 pop',C.bad,C.red2,false]];
    let legW=0; leg.forEach(l=>legW+=tw(l[0],legF)+18+12);
    const showLeg = legW < w-2*PAD-250;
    const T2=fitText(['BAND 2 · 數線 0–26 · 區間按起點排序','BAND 2 · 數線'], (showLeg? w-2*PAD-legW-16 : w-2*PAD), '600', [11.5,11,10.5,10], MONO);
    txt(sorted?T2.s:T2.s.replace('按起點排序','輸入順序'), PAD, B2, T2.f, C.dim);
    if(showLeg){
      let lx=w-PAD-legW+12;
      leg.forEach(l=>{ box(lx, B2-10, 14, 12, {bg:l[1], bd:l[2], lw:1.2, rad:3, dash:l[3]}); txt(l[0], lx+18, B2-4, legF, C.ink, 'left', 'middle'); lx+=tw(l[0],legF)+18+12; });
    }
    const L0=B2+30, laneH=30, bh=20, axY=L0+4*laneH+4;
    if(q!=null && !isEnd){
      const xq=X(q);
      line(xq, L0-4, xq, axY, C.red, 1.6, [4,3]);
      const ql='q = '+q, qf='700 11px '+MONO, qw=tw(ql,qf);
      const qx=Math.min(Math.max(xq-qw/2, X0), XR-qw);
      txt(ql, qx, L0-11, qf, C.redT, 'left', 'middle');
    }
    const lanes = sorted ? [0,1,2,3] : IN.map(p=>S.findIndex(s=>s[0]===p[0]&&s[1]===p[1]));
    lanes.forEach((k,r)=>{
      const y=L0+r*laneH+(laneH-bh)/2, cy=y+bh/2;
      const inHeap=op.heap.includes(k), pNow=kind==='pop'&&op.s===k, popped=op.popped.includes(k)&&!pNow;
      const pushNow=kind==='push'&&op.s===k, isTop=(kind==='ans'&&op.top===k);
      const ptr = sorted && op.i===r && r<4 && kind!=='sort' ? true : (kind==='sort'&&r===0);
      if(ptr) txt('i▸', PAD, cy+1, '700 12px '+MONO, C.ink, 'left', 'middle');
      txt(iS(k), PAD+24, cy+1, '700 12px '+MONO, (pushNow||isTop||pNow)?C.redT:C.ink, 'left', 'middle');
      line(X0, cy, XR, cy, '#f0f0f0', 1);
      let st, tc, side='';
      if(pushNow){ st={bg:C.redBg, bd:C.red, lw:2.4}; tc=C.redT; side='push'; }
      else if(isTop){ st={bg:C.redBg, bd:C.red, lw:2.4}; tc=C.redT; side='top · size '+KEY[k][0]; }
      else if(pNow){ st={bg:C.bad, bd:C.red2, lw:2.2}; tc=C.red2; side='過期 '+KEY[k][1]+' < '+q; }
      else if(popped){ st={bg:C.bad, bd:C.red2, lw:1.1}; tc=C.red2; }
      else if(inHeap || (isEnd && op.heap.includes(k))){ st={bg:C.tint, bd:C.ink, lw:1.3}; tc=C.ink; }
      else { st={bg:C.cell, bd:C.off, lw:1.2, dash:true}; tc=C.dim; }
      const x1=X(S[k][0])-unit/2, ww=(S[k][1]-S[k][0]+1)*unit;
      box(x1, y, ww, bh, Object.assign({rad:4}, st));
      const pushed = inHeap||pNow||popped||isEnd&&op.heap.includes(k);
      const inner = pushed ? kS(k) : '';
      const lf='700 11px '+MONO;
      let innerFits = inner && tw(inner,lf) <= ww-6;
      if(innerFits) txt(inner, x1+ww/2, cy+1, lf, tc, 'center', 'middle');
      if(pNow||popped) line(x1+3, cy, x1+ww-3, cy, C.red2, 1.1);
      if(inner && !innerFits) side = side ? kS(k)+' '+side : kS(k);
      if(side){
        const sf='700 11px '+MONO, sw=tw(side,sf);
        const sx = (x1+ww+12+sw <= XR) ? x1+ww+12 : x1-12-sw;
        ctx.fillStyle=C.paper; ctx.fillRect(sx-3, cy-8, sw+6, 16);      // 擋住 q 紅線,字不被劃到
        txt(side, sx, cy+1, sf, tc, 'left', 'middle');
      }
    });
    line(X0, axY, XR, axY, C.ink, 1.2);
    const every = unit>=26?1:2;
    for(let v=0; v<NV; v++){ const x=X(v), big=v%every===0; line(x, axY-(big?4:2), x, axY+(big?4:2), C.ink, 1);
      if(big) txt(String(v), x, axY+16, '600 10.5px '+MONO, (q!=null&&v===q&&!isEnd)?C.redT:C.dim, 'center', 'middle'); }

    /* ---------- BAND 3 · heap ---------- */
    const B3=axY+48, hy=B3+14, hh=30;
    txt(fitText(['BAND 3 · min-heap,key = (size, right) · 最左 = top','BAND 3 · heap (size, right) · 左 = top'], w-2*PAD, '600', [11.5,11,10.5,10], MONO).s,
        PAD, B3, fitText(['BAND 3 · min-heap,key = (size, right) · 最左 = top','BAND 3 · heap (size, right) · 左 = top'], w-2*PAD, '600', [11.5,11,10.5,10], MONO).f, C.dim);
    txt('heap', PAD+30, hy+hh/2+1, '700 12px '+MONO, C.ink, 'center', 'middle');
    let hx=LX; const cf='700 13px '+MONO;
    if(kind==='pop'){
      const s=kS(op.s), cw=tw(s,cf)+22;
      box(hx, hy, cw, hh, {bg:C.bad, bd:C.red2, lw:2, dash:true});
      txt(s, hx+cw/2, hy+hh/2+1, cf, C.red2, 'center', 'middle');
      line(hx+6, hy+hh/2, hx+cw-6, hy+hh/2, C.red2, 1.6);
      txt('pop', hx+cw/2, hy+hh+11, '700 10.5px '+MONO, C.red2, 'center', 'middle');
      hx+=cw+12;
    }
    if(!op.heap.length){
      txt(kind==='init'?'空的(還沒開始)':'空的', hx, hy+hh/2+1, '600 12px '+SANS, C.dim, 'left', 'middle');
    }
    op.heap.forEach((k,ix)=>{
      const s=kS(k), cw=tw(s,cf)+22;
      const hot=(kind==='push'&&op.s===k)||(kind==='ans'&&op.top===k);
      box(hx, hy, cw, hh, hot?{bg:C.redBg, bd:C.red, lw:2.4}:{bg:ix===0?C.tint:C.cell, bd:C.ink, lw:1.3});
      txt(s, hx+cw/2, hy+hh/2+1, cf, hot?C.redT:C.ink, 'center', 'middle');
      if(ix===0 && kind!=='pop') txt('top', hx+cw/2, hy+hh+11, '700 10.5px '+MONO, hot?C.redT:C.dim, 'center', 'middle');
      hx+=cw+12;
    });
    // 右側:指標 i / 結果
    let rt, rbg=C.cell, rbd=C.ink, rtx=C.ink, rlw=1.2;
    if(kind==='init'){ rt='ans = [-1,-1,-1,-1]'; rtx=C.dim; rbd=C.off; }
    else if(isEnd){ rt='return [2,-1,4,6]'; rbg=C.good; rbd=C.goodT; rtx=C.goodT; rlw=2; }
    else if(op.i<4) rt='i = '+op.i+' · 下一個 '+iS(op.i);
    else rt='i = 4 · 區間用完';
    const rf='700 12px '+MONO, rw=tw(rt,rf)+24;
    pill(w-PAD-rw, hy+(hh-24)/2, rw, 24, rt, rf, rbg, rbd, rtx, rlw);
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
