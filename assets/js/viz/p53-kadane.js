/* ============================================================
   P53 · Maximum Subarray — Kadane · 接上 or 重開 · viz
   curL = 以目前元素結尾的最大子陣列和;maxL = 目前看過的最大和。
     curL = max(curL + num, num)     接上前一段 vs 從自己重開
     maxL = max(maxL, curL)
   例 1 [-2,1,-3,4,-1,2,1,-5,4] → 6,最佳段 [3..6] = 4,-1,2,1
     BAND 1  nums(紅 = 本步 num · 藍 = curL 的段 · 綠 = 最佳段)
     BAND 2  決策:接上 curL+num vs 重開 num(紅 = 勝出)
     BAND 3  狀態:curL / maxL(綠 = maxL 本步變大)
   所有數字取自實測 trace(fact sheet)。
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

  const NUMS = [-2,1,-3,4,-1,2,1,-5,4], N = NUMS.length;
  const f = v => (v === null ? '−∞' : (v < 0 ? '−' + Math.abs(v) : String(v)));
  const fp = v => (v < 0 ? '(' + f(v) + ')' : f(v));        // 加法右側的負數加括號

  /* trace(fact sheet):prev = 本步前的 curL;ext = 接上;re = 重開;win = ext/re/tie;
     cur / max = 本步後;up = maxL 變大;seg = curL 的段;best = maxL 的段;pmax = 本步前的 maxL */
  const T = [
    { i:0, prev:0,  ext:-2, re:-2, win:'tie', cur:-2, pmax:null, max:-2, up:true,  seg:[0,0], best:[0,0] },
    { i:1, prev:-2, ext:-1, re:1,  win:'re',  cur:1,  pmax:-2,   max:1,  up:true,  seg:[1,1], best:[1,1] },
    { i:2, prev:1,  ext:-2, re:-3, win:'ext', cur:-2, pmax:1,    max:1,  up:false, seg:[1,2], best:[1,1] },
    { i:3, prev:-2, ext:2,  re:4,  win:'re',  cur:4,  pmax:1,    max:4,  up:true,  seg:[3,3], best:[3,3] },
    { i:4, prev:4,  ext:3,  re:-1, win:'ext', cur:3,  pmax:4,    max:4,  up:false, seg:[3,4], best:[3,3] },
    { i:5, prev:3,  ext:5,  re:2,  win:'ext', cur:5,  pmax:4,    max:5,  up:true,  seg:[3,5], best:[3,5] },
    { i:6, prev:5,  ext:6,  re:1,  win:'ext', cur:6,  pmax:5,    max:6,  up:true,  seg:[3,6], best:[3,6] },
    { i:7, prev:6,  ext:1,  re:-5, win:'ext', cur:1,  pmax:6,    max:6,  up:false, seg:[3,7], best:[3,6] },
    { i:8, prev:1,  ext:5,  re:4,  win:'ext', cur:5,  pmax:6,    max:6,  up:false, seg:[3,8], best:[3,6] },
  ];

  const steps = [
    { text:'<strong>INITIAL</strong> · <code>nums = [-2,1,-3,4,-1,2,1,-5,4]</code>。<code>curL = 0</code>(以目前元素結尾的最大和),<code>maxL = −∞</code>(程式裡是 <code>INT_MIN</code>)。每一步只問一件事:<b>接上前面那段</b>(<code>curL + num</code>),還是<b>從自己重開</b>(<code>num</code>)?' },
    { text:'<code>i=0 num=−2</code>:接上 <code>0+(−2)=−2</code> = 重開 <code>−2</code> → <b>平手</b>,<code>curL=−2</code>;<code>curL=−2 &gt; maxL=−∞</code> → <code>maxL=−2</code>。' },
    { text:'<code>i=1 num=1</code>:接上 <code>−2+1=−1</code> &lt; 重開 <code>1</code> → <b>前面那段是負的,丟掉重開</b>,<code>curL=1</code>;<code>curL=1 &gt; maxL=−2</code> → <code>maxL=1</code>。' },
    { text:'<code>i=2 num=−3</code>:接上 <code>1+(−3)=−2</code> &gt; 重開 <code>−3</code> → 接上,<code>curL=−2</code>;<code>curL=−2 &lt; maxL=1</code> → maxL 不變(最佳段仍是 <code>[1..1]</code>)。' },
    { text:'<code>i=3 num=4</code>:接上 <code>−2+4=2</code> &lt; 重開 <code>4</code> → <b>前面那段是負的,丟掉重開</b>,<code>curL=4</code>;<code>curL=4 &gt; maxL=1</code> → <code>maxL=4</code>。' },
    { text:'<code>i=4 num=−1</code>:接上 <code>4+(−1)=3</code> &gt; 重開 <code>−1</code> → 接上,<code>curL=3</code>;<code>curL=3 &lt; maxL=4</code> → maxL 不變。前面那段是正的,就算 num 是負數也值得接。' },
    { text:'<code>i=5 num=2</code>:接上 <code>3+2=5</code> &gt; 重開 <code>2</code> → 接上,<code>curL=5</code>;<code>curL=5 &gt; maxL=4</code> → <code>maxL=5</code>,最佳段 <code>[3..5]</code>。' },
    { text:'<code>i=6 num=1</code>:接上 <code>5+1=6</code> &gt; 重開 <code>1</code> → 接上,<code>curL=6</code>;<code>curL=6 &gt; maxL=5</code> → <code>maxL=6</code>,最佳段 <code>[3..6]</code>。' },
    { text:'<code>i=7 num=−5</code>:接上 <code>6+(−5)=1</code> &gt; 重開 <code>−5</code> → 接上,<code>curL=1</code>;<code>curL=1 &lt; maxL=6</code> → maxL 不變。curL 掉下來了,但 maxL 已經記住 6。' },
    { text:'<code>i=8 num=4</code>:接上 <code>1+4=5</code> &gt; 重開 <code>4</code> → 接上,<code>curL=5</code>;<code>curL=5 &lt; maxL=6</code> → maxL 不變。<strong>答案 maxL=6,最佳段 [3..6] = 4,−1,2,1。</strong>' },
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

  function draw(){
    fit();
    const w=canvas.clientWidth, h=canvas.clientHeight, PAD=22, IN=10;
    ctx.fillStyle=C.paper; ctx.fillRect(0,0,w,h); ctx.setLineDash([]);
    const t = step>0 ? T[step-1] : null;
    const cur = t ? t.i : -1;
    const final = step===steps.length-1;

    const X0=PAD+70, XR=w-PAD-IN, colW=(XR-X0)/N, cg=Math.min(12, colW*0.16), cw=colW-cg;
    const cx=k=>X0+k*colW+cg/2;
    const tagX=PAD+35;

    /* ---------- BAND 1 · nums + segments ---------- */
    const B1=18, by=54, bh=40;
    txt('BAND 1 · nums   紅 = 本步 num   藍 = curL 的段   綠 = 最佳段 (maxL)', PAD, B1, '600 11.5px '+MONO, C.dim);
    txt('nums', tagX, by+bh/2+1, '700 13px '+MONO, C.ink, 'center', 'middle');
    const inSeg = k => t && k>=t.seg[0] && k<=t.seg[1];
    for(let k=0;k<N;k++){
      const x=cx(k), isCur=k===cur, dropped=t && k<t.seg[0];
      let st={bg:C.cell, bd:C.ink, tx:C.ink, lw:1.4};
      if(dropped) st={bg:C.cell, bd:C.off, tx:C.dim, lw:1.2};
      if(inSeg(k)) st={bg:C.tint, bd:C.ink, tx:C.ink, lw:1.4};
      if(isCur) st={bg:C.redBg, bd:C.red, tx:C.redT, lw:2.8};
      txt('i='+k, x+cw/2, by-18, '700 10.5px '+MONO, isCur?C.redT:C.dim, 'center', 'middle');
      cellBox(x,by,cw,bh,st,f(NUMS[k]),fitFont(f(NUMS[k]), cw-6, '700', [17,15,13], MONO));
    }

    // segment rails
    const r1=by+bh+14, r2=r1+22+12, rh=22;
    function rail(y, tag, tagColor, seg, sum, label, fill, bd, tx, lw){
      txt(tag, tagX, y+rh/2+1, '700 12px '+MONO, tagColor, 'center', 'middle');
      rr(X0+cg/2, y, XR-X0-cg, rh, 5); ctx.setLineDash([4,3]); ctx.lineWidth=1; ctx.strokeStyle=C.off; ctx.stroke(); ctx.setLineDash([]);
      if(!seg){ txt(label, X0+cg/2+10, y+rh/2+1, '600 11.5px '+SANS, C.dim, 'left', 'middle'); return; }
      const x1=cx(seg[0]), x2=cx(seg[1])+cw, s=label+'  ['+seg[0]+'..'+seg[1]+'] = '+f(sum);
      rr(x1, y, x2-x1, rh, 5); ctx.fillStyle=fill; ctx.fill(); ctx.lineWidth=lw; ctx.strokeStyle=bd; ctx.stroke();
      const lf='700 11.5px '+MONO, lw2=tw(s,lf);
      if(lw2 <= x2-x1-12) txt(s, (x1+x2)/2, y+rh/2+1, lf, tx, 'center', 'middle');
      else if(x2+8+lw2 <= XR) txt(s, x2+8, y+rh/2+1, lf, tx, 'left', 'middle');
      else txt(s, x1-8, y+rh/2+1, lf, tx, 'right', 'middle');
    }
    if(t){
      rail(r1, 'cur', C.ink, t.seg, t.cur, 'curL 段', C.tint, C.ink, C.ink, 1.2);
      rail(r2, 'best', C.goodT, t.best, t.max, 'best', C.good, C.goodT, C.goodT, (t.up||final)?2.4:1.6);
    } else {
      rail(r1, 'cur', C.ink, null, 0, '空段 · curL = 0', 0,0,0,0);
      rail(r2, 'best', C.goodT, null, 0, '還沒有 · maxL = −∞', 0,0,0,0);
    }

    /* ---------- BAND 2 · decision ---------- */
    const B2=r2+rh+32, dy=B2+12, dh=50;
    txt('BAND 2 · 決策   curL = max(curL + num, num)', PAD, B2, '700 12px '+SANS, C.ink);
    txt('max', tagX, dy+dh/2+1, '700 13px '+MONO, C.ink, 'center', 'middle');
    const gap=44, boxW=(XR-X0-gap)/2, xA=X0, xB=X0+boxW+gap;
    function choice(x, head, expr, state){
      let bg=C.cell, bd=C.ink, tx=C.ink, hx=C.dim, lw=1.2, dash=false;
      if(state==='win'){ bg=C.redBg; bd=C.red; tx=C.redT; hx=C.redT; lw=2.6; }
      if(state==='lose'){ bg=C.cell; bd=C.off; tx=C.off; hx=C.off; lw=1.2; }
      if(state==='wait'){ bg=C.cell; bd=C.off; tx=C.dim; hx=C.dim; lw=1.2; dash=true; }
      rr(x,dy,boxW,dh,7); ctx.fillStyle=bg; ctx.fill();
      ctx.setLineDash(dash?[4,3]:[]); ctx.lineWidth=lw; ctx.strokeStyle=bd; ctx.stroke(); ctx.setLineDash([]);
      txt(head, x+12, dy+15, '700 11.5px '+SANS, hx, 'left', 'middle');
      if(state==='win') txt(t.win==='tie'?'平手':'✓ 選這個', x+boxW-10, dy+15, '700 11px '+SANS, C.red2, 'right', 'middle');
      txt(expr, x+boxW/2, dy+35, fitFont(expr, boxW-20, '700', [17,15,13,12], MONO), tx, 'center', 'middle');
    }
    let cmp='vs';
    if(!t){
      choice(xA, '接上  curL + num', '—', 'wait');
      choice(xB, '重開  num', '—', 'wait');
    } else {
      const sA = t.win==='re' ? 'lose' : 'win', sB = t.win==='ext' ? 'lose' : 'win';
      choice(xA, '接上  curL + num', f(t.prev)+' + '+fp(NUMS[t.i])+' = '+f(t.ext), sA);
      choice(xB, '重開  num', f(t.re), sB);
      cmp = t.win==='tie' ? '=' : (t.win==='ext' ? '>' : '<');
    }
    txt(cmp, X0+boxW+gap/2, dy+dh/2+1, (cmp==='vs'?'700 13px ':'700 22px ')+MONO, t?C.red2:C.dim, 'center', 'middle');

    /* ---------- BAND 3 · state ---------- */
    const B3=dy+dh+32, sy=B3+12, sh=38;
    txt('BAND 3 · 狀態   maxL = max(maxL, curL)', PAD, B3, '700 12px '+SANS, C.ink);
    txt('state', tagX, sy+sh/2+1, '700 13px '+MONO, C.ink, 'center', 'middle');
    let x=X0;
    const lf='700 12px '+MONO, bw=58, dw=40;
    function counter(name, val, st, note, noteColor){
      txt(name, x, sy+sh/2+1, lf, C.ink, 'left', 'middle'); x+=tw(name,lf)+8;
      cellBox(x,sy,bw,sh,st,val,fitFont(String(val), bw-8, '700', [19,17,15], MONO)); x+=bw+8;
      if(note) txt(note, x, sy+sh/2+1, (note==='↑'?'700 18px ':'700 12px ')+SANS, noteColor, 'left', 'middle');
      x+=dw;
    }
    const plain={bg:C.cell, bd:C.ink, tx:C.ink, lw:1.4};
    if(!t){
      counter('curL', '0', plain, '', C.ink);
      x+=14;
      counter('maxL', '−∞', plain, '', C.ink);
    } else {
      counter('curL', f(t.cur), {bg:C.redBg, bd:C.red, tx:C.redT, lw:2.4}, t.win==='re'?'重開':(t.win==='ext'?'接上':'平手'), C.red2);
      x+=14;
      counter('maxL', f(t.max), t.up?{bg:C.good, bd:C.goodT, tx:C.goodT, lw:2.4}:(final?{bg:C.good, bd:C.goodT, tx:C.goodT, lw:2.4}:plain),
              t.up?'↑':'不變', t.up?C.goodT:C.dim);
    }
    x+=14;
    const mx=x, mw=XR-mx;
    let msg, mbg=C.cell, mbd=C.ink, mtx=C.ink, mlw=1.2;
    if(!t){ msg='還沒看任何元素'; mtx=C.dim; }
    else if(final){ msg='答案 maxL = 6 · 段 [3..6]'; mbg=C.good; mbd=C.goodT; mtx=C.goodT; mlw=2.2; }
    else {
      msg='max('+f(t.pmax)+', '+f(t.cur)+') = '+f(t.max)+(t.up?'  ↑':'');
      if(t.up){ mbg=C.good; mbd=C.goodT; mtx=C.goodT; mlw=2.2; }
    }
    rr(mx,sy,mw,sh,6); ctx.fillStyle=mbg; ctx.fill(); ctx.lineWidth=mlw; ctx.strokeStyle=mbd; ctx.stroke();
    txt(msg, mx+mw/2, sy+sh/2+1, fitFont(msg, mw-16, '700', [13,12,11,10.5], (final||!t)?SANS:MONO), mtx, 'center', 'middle');
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
