/* ============================================================
   P978 · Longest Turbulent Subarray — 交叉引用的兩條計數 · viz
   curMx = 以 i 結尾、最後一步「上升」的最長 turbulent 長度
   curMi = 以 i 結尾、最後一步「下降」的最長 turbulent 長度
     prevMx = curMx, prevMi = curMi        先備份上一輪
     curMx = (arr[i] > arr[i−1]) ? prevMi + 1 : 1    上升只能接在下降後面
     curMi = (arr[i] < arr[i−1]) ? prevMx + 1 : 1    下降只能接在上升後面
     maxL  = max(max(curMx, curMi), maxL)
   例 T1 [9,4,2,10,7,8,8,1,9] → 5,最長段 [1..5] = 4>2<10>7<8
     BAND 1  arr + 相鄰關係(> < =)+ 目前段(藍)+ 最佳段(綠)
     BAND 2  轉移:prevMx / prevMi → curMx / curMi 交叉箭頭(紅 = 本步成立)
     BAND 3  maxL(綠 = 本步刷新)
   所有數字取自實測 trace(fact sheet T1)。
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

  const ARR = [9,4,2,10,7,8,8,1,9], N = ARR.length;
  // REL[k] = arr[k−1] 與 arr[k] 由左讀到右的關係(k ≥ 1)
  const REL = ARR.map((v,k)=> k===0 ? '' : (ARR[k-1] > v ? '>' : (ARR[k-1] < v ? '<' : '=')));

  /* trace T1(fact sheet):pMx/pMi = 本步備份;mx/mi/max = 本步後;dir = up / down / eq;
     up = maxL 本步變大;run = max(curMx, curMi) 那一段;best = maxL 的段(第一次達到) */
  const T = [
    { i:0, dir:null,   pMx:null, pMi:null, mx:1, mi:1, pmax:null, max:1, up:false, run:[0,0], best:[0,0] },
    { i:1, dir:'down', pMx:1, pMi:1, mx:1, mi:2, pmax:1, max:2, up:true,  run:[0,1], best:[0,1] },
    { i:2, dir:'down', pMx:1, pMi:2, mx:1, mi:2, pmax:2, max:2, up:false, run:[1,2], best:[0,1] },
    { i:3, dir:'up',   pMx:1, pMi:2, mx:3, mi:1, pmax:2, max:3, up:true,  run:[1,3], best:[1,3] },
    { i:4, dir:'down', pMx:3, pMi:1, mx:1, mi:4, pmax:3, max:4, up:true,  run:[1,4], best:[1,4] },
    { i:5, dir:'up',   pMx:1, pMi:4, mx:5, mi:1, pmax:4, max:5, up:true,  run:[1,5], best:[1,5] },
    { i:6, dir:'eq',   pMx:5, pMi:1, mx:1, mi:1, pmax:5, max:5, up:false, run:[6,6], best:[1,5] },
    { i:7, dir:'down', pMx:1, pMi:1, mx:1, mi:2, pmax:5, max:5, up:false, run:[6,7], best:[1,5] },
    { i:8, dir:'up',   pMx:1, pMi:2, mx:3, mi:1, pmax:5, max:5, up:false, run:[6,8], best:[1,5] },
  ];
  const BEST = [1,5], CHAIN = [[2,'mi'],[3,'mx'],[4,'mi'],[5,'mx']];

  const steps = [
    { text:'<strong>INITIAL</strong> · <code>arr = [9,4,2,10,7,8,8,1,9]</code>。<code>i=0</code> 只有一格,<code>curMx = curMi = maxL = 1</code>。<code>curMx</code> = 以 i 結尾、<b>最後一步上升</b>的最長 turbulent 長度;<code>curMi</code> = 最後一步<b>下降</b>。上升必須接在下降後面 → <code>curMx = prevMi + 1</code>;下降必須接在上升後面 → <code>curMi = prevMx + 1</code>。' },
    { text:'<code>i=1</code>:<code>9 &gt; 4</code>,<code>arr[1] &lt; arr[0]</code> → <b>↓ 下降</b>。備份 <code>prevMx = 1, prevMi = 1</code>。<code>curMi = prevMx + 1 = 1 + 1 = 2</code>;<code>curMx = 1</code>(重設)。<code>maxL = max(max(1, 2), 1) = 2</code> ↑,段 <code>[0..1] = 9&gt;4</code>。' },
    { text:'<code>i=2</code>:<code>4 &gt; 2</code> → <b>↓ 下降</b>,又是下降。<code>prevMx = 1, prevMi = 2</code>。<code>curMi = prevMx + 1 = 1 + 1 = 2</code> —— 連兩次下降接不起來,只能用「上一步是上升」的 <code>prevMx = 1</code>,段變成 <code>[1..2]</code>;<code>curMx = 1</code>(重設)。<code>maxL</code> 仍是 2。' },
    { text:'<code>i=3</code>:<code>2 &lt; 10</code> → <b>↑ 上升</b>。<code>prevMx = 1, prevMi = 2</code>。<code>curMx = prevMi + 1 = 2 + 1 = 3</code>;<code>curMi = 1</code>(重設)。<code>maxL = 3</code> ↑,段 <code>[1..3] = 4&gt;2&lt;10</code>。' },
    { text:'<code>i=4</code>:<code>10 &gt; 7</code> → <b>↓ 下降</b>。<code>prevMx = 3, prevMi = 1</code>。<code>curMi = prevMx + 1 = 3 + 1 = 4</code>;<code>curMx = 1</code>(重設)。<code>maxL = 4</code> ↑。<b>關鍵:</b>程式先算 <code>curMx</code>,它已經被改成 1;若沒有 <code>prevMx</code> 備份,<code>curMi</code> 會讀到 <code>1 + 1 = 2</code>(初稿就錯在這裡,應為 4)。' },
    { text:'<code>i=5</code>:<code>7 &lt; 8</code> → <b>↑ 上升</b>。<code>prevMx = 1, prevMi = 4</code>。<code>curMx = prevMi + 1 = 4 + 1 = 5</code>;<code>curMi = 1</code>(重設)。<code>maxL = 5</code> ↑,段 <code>[1..5] = 4&gt;2&lt;10&gt;7&lt;8</code>。' },
    { text:'<code>i=6</code>:<code>8 = 8</code> → <b>相等</b>,兩個條件都不成立。<code>prevMx = 5, prevMi = 1</code> 都用不上:<code>curMx = curMi = 1</code>(重設)。段在 <code>=</code> 這裡<b>斷開</b>,從 <code>[6..6]</code> 重來;<code>maxL</code> 已經記住 5,不變。' },
    { text:'<code>i=7</code>:<code>8 &gt; 1</code> → <b>↓ 下降</b>。<code>prevMx = 1, prevMi = 1</code>。<code>curMi = prevMx + 1 = 1 + 1 = 2</code>;<code>curMx = 1</code>(重設)。段 <code>[6..7]</code>;<code>maxL = max(max(1, 2), 5) = 5</code> 不變。' },
    { text:'<code>i=8</code>:<code>1 &lt; 9</code> → <b>↑ 上升</b>。<code>prevMx = 1, prevMi = 2</code>。<code>curMx = prevMi + 1 = 2 + 1 = 3</code>;<code>curMi = 1</code>(重設)。段 <code>[6..8]</code>;<code>maxL = max(max(3, 1), 5) = 5</code> 不變。掃完。' },
    { text:'<strong>收尾</strong> · <code>return maxL = 5</code>。最長段 <code>[1..5] = [4,2,10,7,8]</code> = <code>4&gt;2&lt;10&gt;7&lt;8</code>,長度一路 <code>Mi 2 → Mx 3 → Mi 4 → Mx 5</code> 交叉 +1。<b>交叉引用</b>:<code>curMx</code> 讀 <code>prevMi</code>、<code>curMi</code> 讀 <code>prevMx</code>,兩個新值都要用「上一輪」的值 —— 這就是為什麼要先備份 <code>prevMx / prevMi</code>,否則第二行讀到的是第一行剛覆蓋的新值。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function txt(s,x,y,font,color,align,base){ ctx.font=font; ctx.fillStyle=color; ctx.textAlign=align||'left'; ctx.textBaseline=base||'alphabetic'; ctx.fillText(s,x,y); }
  function tw(s,font){ ctx.font=font; return ctx.measureText(s).width; }
  function cellBox(x,y,cw,ch,st,val,font){
    rr(x,y,cw,ch,5); ctx.fillStyle=st.bg; ctx.fill();
    ctx.setLineDash(st.dash?[4,3]:[]); ctx.lineWidth=st.lw||1.4; ctx.strokeStyle=st.bd; ctx.stroke(); ctx.setLineDash([]);
    if(val!==null && val!==undefined) txt(String(val), x+cw/2, y+ch/2+1, font, st.tx, 'center', 'middle');
  }
  function fitFont(s, maxW, weight, sizes, fam){ for(const z of sizes){ const f=weight+' '+z+'px '+fam; if(tw(s,f)<=maxW) return f; } return weight+' '+sizes[sizes.length-1]+'px '+fam; }
  function arrow(x1,y1,x2,y2,color,lw,dash){
    const a=Math.atan2(y2-y1,x2-x1), hl=9, ex=x2-Math.cos(a)*hl*0.6, ey=y2-Math.sin(a)*hl*0.6;
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(ex,ey); ctx.lineWidth=lw; ctx.strokeStyle=color;
    ctx.setLineDash(dash?[5,4]:[]); ctx.stroke(); ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(x2,y2);
    ctx.lineTo(x2-hl*Math.cos(a-0.42), y2-hl*Math.sin(a-0.42));
    ctx.lineTo(x2-hl*Math.cos(a+0.42), y2-hl*Math.sin(a+0.42)); ctx.closePath(); ctx.fillStyle=color; ctx.fill();
  }
  function pill(cxp, cyp, s, font, bg, bd, tx, lw){
    const pw=tw(s,font)+14, ph=18;
    rr(cxp-pw/2, cyp-ph/2, pw, ph, 9); ctx.fillStyle=bg; ctx.fill(); ctx.lineWidth=lw||1.2; ctx.strokeStyle=bd; ctx.stroke();
    txt(s, cxp, cyp+1, font, tx, 'center', 'middle');
  }

  function draw(){
    fit();
    const w=canvas.clientWidth, h=canvas.clientHeight, PAD=22, IN=10;
    ctx.fillStyle=C.paper; ctx.fillRect(0,0,w,h); ctx.setLineDash([]);
    const final = step===steps.length-1;
    const t = T[Math.min(step, N-1)];
    const cur = final ? -1 : t.i;

    const X0=PAD+70, XR=w-PAD-IN, colW=(XR-X0)/N, cg=Math.min(14, colW*0.16), cw=colW-cg;
    const cx=k=>X0+k*colW+cg/2;
    const bx=k=>cx(k)-cg/2;                 // 第 k−1 與第 k 格之間的縫
    const tagX=PAD+35;

    /* ---------- BAND 1 · arr + 關係 + 兩條段軌 ---------- */
    const B1=18, by=62, bh=40, gy=by+bh+12, gh=18, rh=22, r1=gy+gh+12, r2=r1+rh+12;
    const t1 = final ? 'BAND 1 · arr   綠 = 答案段 [1..5] = 4>2<10>7<8   灰 = 相等處斷開'
                     : 'BAND 1 · arr   紅 = arr[i]   藍 = 以 i 結尾的段   綠 = 最佳段 (maxL)';
    txt(t1, PAD, B1, fitFont(t1, w-2*PAD, '600', [11.5,11,10.5], MONO), C.dim);
    txt('arr', tagX, by+bh/2+1, '700 13px '+MONO, C.ink, 'center', 'middle');
    const inRun = k => !final && k>=t.run[0] && k<=t.run[1];
    const inBest = k => final && k>=BEST[0] && k<=BEST[1];
    for(let k=0;k<N;k++){
      const x=cx(k), isCur=k===cur, isPrev=!final && k===cur-1;
      let st={bg:C.cell, bd:C.ink, tx:C.ink, lw:1.4};
      if(!final && k<t.run[0]) st={bg:C.cell, bd:C.off, tx:C.dim, lw:1.2};
      if(inRun(k)) st={bg:C.tint, bd:C.ink, tx:C.ink, lw:1.4};
      if(final) st = inBest(k) ? {bg:C.good, bd:C.goodT, tx:C.goodT, lw:2.2} : {bg:C.cell, bd:C.off, tx:C.dim, lw:1.2};
      if(isPrev) st={bg:st.bg, bd:C.red, tx:C.redT, lw:1.6, dash:true};
      if(isCur) st={bg:C.redBg, bd:C.red, tx:C.redT, lw:2.8};
      const hc = isCur ? C.redT : (isPrev ? C.red : (inBest(k) ? C.goodT : C.dim));
      txt((isCur?'i=':(isPrev?'i−1=':''))+k, x+cw/2, by-18, fitFont((isCur?'i=':(isPrev?'i−1=':''))+k, cw+cg-2, '700', [10.5,10,9.5], MONO), hc, 'center', 'middle');
      cellBox(x,by,cw,bh,st,ARR[k],fitFont(String(ARR[k]), cw-6, '700', [17,15,13], MONO));
    }

    // 段軌
    function track(y){ rr(X0+cg/2, y, XR-X0-cg, rh, 5); ctx.setLineDash([4,3]); ctx.lineWidth=1; ctx.strokeStyle=C.off; ctx.stroke(); ctx.setLineDash([]); }
    function piece(y, seg, fill, bd, lw, dash){ const x1=cx(seg[0]), x2=cx(seg[1])+cw; rr(x1, y, x2-x1, rh, 5); ctx.fillStyle=fill; ctx.fill();
      ctx.setLineDash(dash?[4,3]:[]); ctx.lineWidth=lw; ctx.strokeStyle=bd; ctx.stroke(); ctx.setLineDash([]); return [x1,x2]; }
    function pieceLabel(y, x1, x2, s, color, short, noLeft){
      const lf='700 11.5px '+MONO;
      for(const c of (short?[s,short]:[s])){
        const lw2=tw(c,lf);
        if(lw2 <= x2-x1-12){ txt(c, (x1+x2)/2, y+rh/2+1, lf, color, 'center', 'middle'); return; }
        if(x2+12+lw2 <= XR-cg/2-6){ txt(c, x2+12, y+rh/2+1, lf, color, 'left', 'middle'); return; }
        if(!noLeft && x1-12-lw2 >= X0+cg/2+6){ txt(c, x1-12, y+rh/2+1, lf, color, 'right', 'middle'); return; }
      }
      const c=short||s; txt(c, x2+12, y+rh/2+1, fitFont(c, XR-cg/2-x2-18, '700', [11.5,10.5,10,9.5], MONO), color, 'left', 'middle');
    }
    txt('run', tagX, r1+rh/2+1, '700 12px '+MONO, C.ink, 'center', 'middle');
    txt('best', tagX, r2+rh/2+1, '700 12px '+MONO, C.goodT, 'center', 'middle');
    track(r1); track(r2);
    if(!final){
      const len=t.run[1]-t.run[0]+1;
      if(t.dir==='eq'){   // 舊段 [1..5] 斷在 = 處
        const [g1,g2]=piece(r1, [1,5], C.off, C.dim, 1.2, true);
        pieceLabel(r1, g1, g2, '舊段 [1..5] 斷在 =', C.ink, '舊段斷開');
      }
      const [x1,x2]=piece(r1, t.run, C.tint, C.ink, t.dir==='eq'?2.2:1.4);
      if(t.dir==='eq') pieceLabel(r1, x1, x2, '重來 [6..6] len 1', C.redT, '重來 len 1', true);
      else pieceLabel(r1, x1, x2, '['+t.run[0]+'..'+t.run[1]+'] len '+len, C.ink, 'len '+len);
      const [y1,y2]=piece(r2, t.best, C.good, C.goodT, t.up?2.4:1.4);
      pieceLabel(r2, y1, y2, 'maxL ['+t.best[0]+'..'+t.best[1]+'] = '+t.max+(t.up?' ↑':''), C.goodT);
    } else {
      const [x1,x2]=piece(r1, [6,8], C.cell, C.off, 1.2, true);
      pieceLabel(r1, x1, x2, '[6..8] len 3', C.dim);
      const [y1,y2]=piece(r2, BEST, C.good, C.goodT, 2.4);
      pieceLabel(r2, y1, y2, '答案 [1..5] = 5', C.goodT);
    }

    // 斷點(i=6 的 = 之後一直留著)
    if(final || t.i>=6){
      const xb=bx(6), act=!final && t.i===6;
      ctx.beginPath(); ctx.moveTo(xb, by+bh+3); ctx.lineTo(xb, r2+rh+5);
      ctx.lineWidth=act?2:1.4; ctx.strokeStyle=act?C.red2:C.dim; ctx.setLineDash([3,3]); ctx.stroke(); ctx.setLineDash([]);
    }

    // 相鄰關係
    txt('rel', tagX, gy+gh/2+1, '700 12px '+MONO, C.ink, 'center', 'middle');
    for(let k=1;k<N;k++){
      const xm=bx(k), yc=gy+gh/2, seen = final || k<=t.i, isNow = !final && k===t.i;
      const inside = final ? (k>BEST[0] && k<=BEST[1]) : (k>t.run[0] && k<=t.run[1]);
      let bg=C.cell, bd=C.off, tx=C.dim, lw=1;
      if(seen){ bd=C.ink; tx=C.ink; lw=1.2; if(!inside){ bd=C.off; tx=C.dim; } }
      if(seen && inside) bg = final ? C.good : C.tint;
      if(final && inside){ bd=C.goodT; tx=C.goodT; }
      if(REL[k]==='=' && seen){ bg=C.off; bd=C.dim; tx=C.ink; }
      if(isNow){ bg=REL[k]==='='?C.bad:C.redBg; bd=REL[k]==='='?C.red2:C.red; tx=REL[k]==='='?C.red2:C.redT; lw=2.2; }
      const gw=Math.min(24, colW-10);
      rr(xm-gw/2, gy, gw, gh, 5); ctx.fillStyle=bg; ctx.fill(); ctx.lineWidth=lw; ctx.strokeStyle=bd; ctx.stroke();
      txt(seen?REL[k]:'·', xm, yc+1, '700 13px '+MONO, tx, 'center', 'middle');
    }

    /* ---------- BAND 2 · 轉移 ---------- */
    const B2=r2+rh+34, dh=44, rowA=B2+16, rowB=rowA+dh+30, fy=rowB+dh+22;
    let t2;
    if(final) t2='BAND 2 · 全部 curMx / curMi   紅 = 答案鏈,一路交叉 +1';
    else if(!t.dir) t2='BAND 2 · 轉移   兩個新值都只看「上一輪」的 prevMx / prevMi';
    else t2='BAND 2 · 轉移   arr['+t.i+'] = '+ARR[t.i]+(t.dir==='up'?' > ':(t.dir==='down'?' < ':' = '))+'arr['+(t.i-1)+'] = '+ARR[t.i-1]
           +(t.dir==='up'?'  → ↑ 上升':(t.dir==='down'?'  → ↓ 下降':'  → 相等'));
    txt(t2, PAD, B2, fitFont(t2, w-2*PAD, '700', [12,11.5,11], SANS), C.ink);
    txt('↑ Mx', tagX, rowA+dh/2+1, '700 13px '+MONO, C.ink, 'center', 'middle');
    txt('↓ Mi', tagX, rowB+dh/2+1, '700 13px '+MONO, C.ink, 'center', 'middle');
    const plain={bg:C.cell, bd:C.ink, tx:C.ink, lw:1.4}, dimS={bg:C.cell, bd:C.off, tx:C.dim, lw:1.2, dash:true},
          redS={bg:C.redBg, bd:C.red, tx:C.redT, lw:2.6}, srcS={bg:C.cell, bd:C.red, tx:C.redT, lw:2.2},
          goodS={bg:C.good, bd:C.goodT, tx:C.goodT, lw:2.4}, offS={bg:C.off, bd:C.dim, tx:C.ink, lw:1.2};

    if(!final){
      const pW=Math.round(colW*2.2), cW=Math.round(colW*3.1), px=X0+cg/2, qx=XR-cg/2-cW;
      function vbox(x,y,bw,name,val,st,note,noteColor){
        rr(x,y,bw,dh,7); ctx.fillStyle=st.bg; ctx.fill(); ctx.setLineDash(st.dash?[4,3]:[]); ctx.lineWidth=st.lw; ctx.strokeStyle=st.bd; ctx.stroke(); ctx.setLineDash([]);
        txt(name, x+9, y+12, '700 10.5px '+MONO, st.tx===C.ink?C.dim:st.tx, 'left', 'middle');
        if(!note){ txt(val, x+bw/2, y+29, '700 18px '+MONO, st.tx, 'center', 'middle'); return; }
        txt(val, x+28, y+29, '700 18px '+MONO, st.tx, 'center', 'middle');
        txt(note, x+bw-10, y+dh/2+1, fitFont(note, bw-62, '700', [12.5,12,11,10.5], MONO), noteColor, 'right', 'middle');
      }
      const fireMx = t.dir==='up', fireMi = t.dir==='down';
      // prev
      if(!t.dir){
        vbox(px,rowA,pW,'prevMx','—',dimS); vbox(px,rowB,pW,'prevMi','—',dimS);
      } else {
        vbox(px,rowA,pW,'prevMx',String(t.pMx), fireMi?srcS:plain);
        vbox(px,rowB,pW,'prevMi',String(t.pMi), fireMx?srcS:plain);
      }
      // cur
      if(!t.dir){
        vbox(qx,rowA,cW,'curMx','1',plain,'初始 = 1',C.dim);
        vbox(qx,rowB,cW,'curMi','1',plain,'初始 = 1',C.dim);
      } else {
        vbox(qx,rowA,cW,'curMx',String(t.mx), fireMx?redS:plain, fireMx?'= prevMi + 1':'= 1 (重設)', fireMx?C.red2:C.dim);
        vbox(qx,rowB,cW,'curMi',String(t.mi), fireMi?redS:plain, fireMi?'= prevMx + 1':'= 1 (重設)', fireMi?C.red2:C.dim);
      }
      // 交叉箭頭
      const ax1=px+pW+8, ax2=qx-8, yA=rowA+dh/2, yB=rowB+dh/2;
      const upA = {x1:ax1, y1:yB, x2:ax2, y2:yA}, dnA = {x1:ax1, y1:yA, x2:ax2, y2:yB};
      const at=(a,u)=>[a.x1+(a.x2-a.x1)*u, a.y1+(a.y2-a.y1)*u];
      // 先畫沒觸發的,再畫觸發的(紅的在上層)
      const list=[[upA,fireMx,'上升 +1'],[dnA,fireMi,'下降 +1']].sort((a,b)=>(a[1]?1:0)-(b[1]?1:0));
      for(const [a,fire] of list) arrow(a.x1,a.y1,a.x2,a.y2, fire?C.red:C.off, fire?2.4:1.4, !fire);
      for(const [a,fire,lab] of list){
        const [lx,ly]=at(a,0.26);
        pill(lx, ly, lab, '700 11px '+SANS, fire?C.redBg:C.cell, fire?C.red:C.off, fire?C.redT:C.dim, fire?1.8:1);
      }
      if(t.dir==='eq'){   // 兩條都被擋
        for(const a of [upA,dnA]){
          const [qx2,qy2]=at(a,0.8), s=5;
          ctx.beginPath(); ctx.moveTo(qx2-s,qy2-s); ctx.lineTo(qx2+s,qy2+s); ctx.moveTo(qx2+s,qy2-s); ctx.lineTo(qx2-s,qy2+s);
          ctx.lineWidth=2.4; ctx.strokeStyle=C.red2; ctx.stroke();
        }
      }
      // 公式
      let fl;
      if(!t.dir) fl='初始:i=0 只有一格 → curMx = curMi = maxL = 1';
      else if(t.dir==='up') fl='↑ 上升:curMx = prevMi + 1 = '+t.pMi+' + 1 = '+t.mx+'   curMi = 1';
      else if(t.dir==='down') fl='↓ 下降:curMi = prevMx + 1 = '+t.pMx+' + 1 = '+t.mi+'   curMx = 1';
      else fl='= 相等:兩個條件都不成立 → curMx = curMi = 1,段在這裡斷開';
      txt(fl, X0+cg/2, fy, fitFont(fl, XR-X0-cg, '700', [13,12.5,12,11], MONO), t.dir?C.red2:C.ink, 'left', 'middle');
    } else {
      // 收尾:整張 curMx / curMi 表,欄位對齊 BAND 1
      const val=(k,r)=> r==='mx'?T[k].mx:T[k].mi;
      const isChain=(k,r)=>CHAIN.some(c=>c[0]===k&&c[1]===r);
      for(const [r,y] of [['mx',rowA],['mi',rowB]]){
        for(let k=0;k<N;k++){
          let st={bg:C.cell, bd:C.off, tx:C.dim, lw:1.2};
          if(k===6) st=offS;
          if(isChain(k,r)) st= (k===5&&r==='mx') ? goodS : redS;
          cellBox(cx(k),y,cw,dh,st,val(k,r),'700 17px '+MONO);
        }
      }
      for(let c=0;c<CHAIN.length-1;c++){
        const [k,r]=CHAIN[c], fromY = r==='mi'?rowB:rowA+dh, toY = r==='mi'?rowA+dh:rowB;
        arrow(cx(k)+cw*0.62, fromY+(r==='mi'?-2:2), cx(k+1)+cw*0.38, toY+(r==='mi'?3:-3), C.red, 2, false);
      }
      const fl='答案鏈 Mi 2 → Mx 3 → Mi 4 → Mx 5:每一步讀「另一條」的 prev 再 +1';
      txt(fl, X0+cg/2, fy, fitFont(fl, XR-X0-cg, '700', [13,12.5,12,11], MONO), C.red2, 'left', 'middle');
    }

    /* ---------- BAND 3 · maxL ---------- */
    const B3=fy+36, sy=B3+14, sh=38;
    txt('BAND 3 · 答案   maxL = max(max(curMx, curMi), maxL)', PAD, B3, '700 12px '+SANS, C.ink);
    txt('maxL', tagX, sy+sh/2+1, '700 13px '+MONO, C.ink, 'center', 'middle');
    let x=X0+cg/2;
    const bw=58;
    const mSt = (final || t.up) ? goodS : plain;
    cellBox(x,sy,bw,sh,mSt,String(final?5:t.max),'700 19px '+MONO); x+=bw+10;
    const note = final ? '✓' : (!t.dir ? '初始' : (t.up ? '↑' : '不變'));
    txt(note, x, sy+sh/2+1, (note==='↑'||note==='✓'?'700 18px ':'700 12px ')+SANS, (final||t.up)?C.goodT:C.dim, 'left', 'middle');
    x+=40;
    const mx=x, mw=XR-cg/2-mx;
    let msg, mbg=C.cell, mbd=C.ink, mtx=C.ink, mlw=1.2;
    if(final){ msg='答案 maxL = 5 · 段 [1..5] = 4>2<10>7<8'; mbg=C.good; mbd=C.goodT; mtx=C.goodT; mlw=2.2; }
    else if(!t.dir){ msg='i=0:maxL = 1(單一元素本身就是 turbulent)'; mtx=C.dim; }
    else {
      msg='max(max('+t.mx+', '+t.mi+'), '+t.pmax+') = '+t.max+(t.up?'  ↑ 刷新':'  不變');
      if(t.up){ mbg=C.good; mbd=C.goodT; mtx=C.goodT; mlw=2.2; }
    }
    rr(mx,sy,mw,sh,6); ctx.fillStyle=mbg; ctx.fill(); ctx.lineWidth=mlw; ctx.strokeStyle=mbd; ctx.stroke();
    txt(msg, mx+mw/2, sy+sh/2+1, fitFont(msg, mw-16, '700', [13,12,11,10.5], MONO), mtx, 'center', 'middle');
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
