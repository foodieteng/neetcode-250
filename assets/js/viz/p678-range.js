/* ============================================================
   P678 · Valid Parenthesis String — 追蹤「可能的 open 數」範圍 [l, r]
     '(' → l+1, r+1 ; ')' → l−1, r−1 ; '*' → l−1, r+1
     r < 0 → return false(就算每個 '*' 都當 '(' 也救不回)
     l = max(l, 0)(open 數不能是負的 → 砍掉不可能的選法)
     結尾:0 在範圍內(l == 0)→ true
   範例 A "(*))" → true ; 範例 B "*)(" → false(結尾 l > 0)
   範例 C "(*)))" → false(中途 r < 0)
     BAND 0  目前是哪個範例 + 輸入
     BAND 1  字串 s(index 表頭 · 字元格 · 每個字元對 l / r 的效果)
     BAND 2  數線 −1 … 3 上的範圍 [l, r]:虛線 = 夾之前,實心 = 夾回後
     BAND 3  l / r 歷史表(每欄一個已處理字元,夾過的顯示 −1→0)
     BAND 4  本步算式 / 結果
   所有數字取自實際執行的 trace。
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
    A: { s:'(*))',  name:'範例 A · (*))',  ans:'true'  },
    B: { s:'*)(',   name:'範例 B · *)(',   ans:'false' },
    C: { s:'(*)))', name:'範例 C · (*)))', ans:'false' },
  };
  const ORDER = ['A','B','C'];
  const m = v => (v<0 ? '−'+(-v) : String(v));          // 顯示用負號
  const EFF = { '(':'l+1  r+1', ')':'l−1  r−1', '*':'l−1  r+1' };

  /* 依題目程式碼逐字元執行,產生 OPS(每步一個 frame) */
  const OPS = [];
  ORDER.forEach(e=>{
    const s=EX[e].s; let l=0, r=0; const hist=[];
    OPS.push({ ex:e, kind:'init', l, r, hist:[] });
    for(let i=0;i<s.length;i++){
      const c=s[i];
      let rl=l, rr_=r;
      if(c==='('){ rl++; rr_++; } else if(c===')'){ rl--; rr_--; } else { rl--; rr_++; }
      if(rr_<0){ hist.push({c, rl, rr:rr_, l:rl, r:rr_, fail:true});
        OPS.push({ ex:e, kind:'fail', i, c, rl, rr:rr_, hist:hist.slice() }); break; }
      l=Math.max(rl,0); r=rr_;
      hist.push({c, rl, rr:rr_, l, r});
      OPS.push({ ex:e, kind:'char', i, c, rl, rr:rr_, l, r, hist:hist.slice() });
      if(i===s.length-1) OPS.push({ ex:e, kind:'end', l, r, hist:hist.slice() });
    }
  });

  const steps = [
    { text:'<strong>INITIAL · 範例 A</strong> · <code>s = "(*))"</code>,<code>l = r = 0</code>:還沒讀任何字元,open 數只可能是 0,範圍就是 <code>[0, 0]</code>。' },
    { text:'讀到 <code>\'(\'</code>,不管怎麼選 open 數都 +1,<code>l</code>、<code>r</code> 一起加 → <code>[1, 1]</code>,沒有負數不用夾。' },
    { text:'讀到 <code>\'*\'</code>,當 <code>\')\'</code> 最少變 <code>l = 0</code>、當 <code>\'(\'</code> 最多變 <code>r = 2</code>,範圍一口氣撐開成 <code>[0, 2]</code>。' },
    { text:'讀到 <code>\')\'</code>,範圍平移成 <code>[−1, 1]</code>,但 open 數不可能是 −1(那代表 <code>\'*\'</code> 當了 <code>\')\'</code> 的選法已經壞掉),所以 <b>l 夾回 0</b> → <code>[0, 1]</code>。' },
    { text:'再讀 <code>\')\'</code> → <code>[−1, 0]</code>,<code>r = 0</code> 沒有小於 0 所以還活著,<code>l</code> 夾回 0 → <code>[0, 0]</code>(只剩「<code>\'*\'</code> 當空字串」這種選法)。' },
    { text:'<strong>範例 A 結果</strong> · 字串讀完 <code>l = 0</code>,代表 0 個 open 在可能範圍 <code>[0, 0]</code> 內 → <code>return true</code>。' },
    { text:'<strong>INITIAL · 範例 B</strong> · <code>s = "*)("</code>,從 <code>[0, 0]</code> 開始;這題的 <code>\'(\'</code> 在最後面,誰都配不到它。' },
    { text:'讀到 <code>\'*\'</code> → <code>[−1, 1]</code>,當 <code>\')\'</code> 的選法會變負數,<b>l 夾回 0</b> → <code>[0, 1]</code>。' },
    { text:'讀到 <code>\')\'</code> → <code>[−1, 0]</code>,<code>r = 0</code> 代表「<code>\'*\'</code> 當 <code>\'(\'</code>」剛好配掉這個 <code>\')\'</code>,<code>l</code> 夾回 0 → <code>[0, 0]</code>。' },
    { text:'讀到 <code>\'(\'</code> → <code>[1, 1]</code>,不用夾;但後面已經沒有字元能把它關掉。' },
    { text:'<strong>範例 B 結果</strong> · 結束時 <code>l = 1</code>,最少也還有 1 個 open 沒關,0 不在範圍 <code>[1, 1]</code> 內 → <code>return false</code>(結尾才失敗)。' },
    { text:'<strong>INITIAL · 範例 C</strong> · <code>s = "(*)))"</code>,同樣從 <code>[0, 0]</code> 開始;前四個字元跟範例 A 完全一樣。' },
    { text:'讀到 <code>\'(\'</code> → <code>[1, 1]</code>,不用夾。' },
    { text:'讀到 <code>\'*\'</code> → <code>[0, 2]</code>,範圍撐開。' },
    { text:'讀到 <code>\')\'</code> → <code>[−1, 1]</code>,<b>l 夾回 0</b> → <code>[0, 1]</code>。' },
    { text:'讀到 <code>\')\'</code> → <code>[−1, 0]</code>,<code>l</code> 夾回 0 → <code>[0, 0]</code>,這時已經沒有任何餘裕了。' },
    { text:'<strong>範例 C 結果</strong> · 第 5 個 <code>\')\'</code> → <code>[−1, −1]</code>,連 <code>r</code> 都 &lt; 0:就算每個 <code>\'*\'</code> 都當 <code>\'(\'</code> 也有太多 <code>\')\'</code> → 立刻 <code>return false</code>(中途就失敗)。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function txt(s,x,y,font,color,align,base){ ctx.font=font; ctx.fillStyle=color; ctx.textAlign=align||'left'; ctx.textBaseline=base||'alphabetic'; ctx.fillText(s,x,y); }
  function tw(s,font){ ctx.font=font; return ctx.measureText(s).width; }
  function box(x,y,cw,ch,st){
    rr(x,y,cw,ch,5); ctx.fillStyle=st.bg; ctx.fill();
    ctx.setLineDash(st.dash?[4,3]:[]); ctx.lineWidth=st.lw||1.4; ctx.strokeStyle=st.bd; ctx.stroke(); ctx.setLineDash([]);
  }
  function fitFont(s, maxW, weight, sizes, fam){ for(const z of sizes){ const f=weight+' '+z+'px '+fam; if(tw(s,f)<=maxW) return f; } return weight+' '+sizes[sizes.length-1]+'px '+fam; }
  function line(x1,y1,x2,y2,color,lw,dash){ ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.lineWidth=lw; ctx.strokeStyle=color; ctx.setLineDash(dash||[]); ctx.stroke(); ctx.setLineDash([]); }
  function pill(x, y, pw, ph, s, font, bg, bd, tx, lw){
    rr(x, y, pw, ph, ph/2); ctx.fillStyle=bg; ctx.fill(); ctx.lineWidth=lw||1.2; ctx.strokeStyle=bd; ctx.stroke();
    txt(s, x+pw/2, y+ph/2+1, font, tx, 'center', 'middle');
  }

  function draw(){
    fit();
    const w=canvas.clientWidth, h=canvas.clientHeight, PAD=22, IN=10;
    ctx.fillStyle=C.paper; ctx.fillRect(0,0,w,h); ctx.setLineDash([]);
    const op=OPS[step], ex=EX[op.ex], s=ex.s, n=s.length, kind=op.kind;
    const isInit=kind==='init', isChar=kind==='char', isFail=kind==='fail', isEnd=kind==='end';
    const live = isChar||isFail;
    const done = op.hist.length;                       // 已處理字元數(含本步)
    const L=PAD+70, R=w-PAD-IN, tagX=PAD+35;

    /* ---------- BAND 0 · 哪個範例 ---------- */
    const tabF='700 11.5px '+SANS, tabW=Math.max(...ORDER.map(e=>tw(EX[e].name,tabF)))+20, tabH=20, tabY=6, tabG=6;
    ORDER.forEach((e,ix)=>{
      const x=w-PAD-(3-ix)*tabW-(2-ix)*tabG, on=e===op.ex;
      rr(x, tabY, tabW, tabH, 10); ctx.fillStyle=on?C.ink:C.cell; ctx.fill();
      ctx.lineWidth=1.2; ctx.strokeStyle=on?C.ink:C.off; ctx.stroke();
      txt(EX[e].name, x+tabW/2, tabY+tabH/2+1, tabF, on?C.paper:C.dim, 'center', 'middle');
    });
    const t0='s = "'+s+'"   預期 → '+ex.ans;
    txt(t0, PAD, 20, fitFont(t0, w-2*PAD-3*tabW-2*tabG-16, '700', [12.5,12,11.5,11,10.5], MONO), C.ink);

    /* ---------- BAND 1 · 字串 s ---------- */
    const B1=50, hy=72, by=88, bh=44, ey=150;
    const pTxt = live ? '第 '+(op.i+1)+' / '+n+' 個字元' : (isInit ? '尚未開始' : '迴圈結束');
    const rpF='700 11.5px '+SANS, rpW=tw(pTxt,rpF)+22, rpH=20, rpX=R-rpW;
    pill(rpX, B1-14, rpW, rpH, pTxt, rpF, live?C.redBg:C.cell, live?C.red:C.ink, live?C.redT:C.ink, live?1.6:1.2);
    const t1='BAND 1 · 字串 s   紅 = 目前字元   藍底 = 已處理';
    txt(t1, PAD, B1, fitFont(t1, rpX-PAD-14, '600', [11.5,11,10.5,10,9.5], MONO), C.dim);
    txt('i', tagX, hy, '700 12.5px '+MONO, C.ink, 'center', 'middle');
    txt('s', tagX, by+bh/2+1, '700 14px '+MONO, C.ink, 'center', 'middle');
    txt('效果', tagX, ey, '700 11.5px '+SANS, C.ink, 'center', 'middle');

    const colW=(R-L)/n, cg=Math.min(18, colW*0.16), cw=colW-cg, cx=j=>L+j*colW+cg/2;
    for(let j=0;j<n;j++){
      const x=cx(j), ch=s[j], cur = live && j===op.i, proc = j<done && !cur;
      txt(String(j), x+cw/2, hy+1, '700 12px '+MONO, cur?C.redT:C.dim, 'center', 'middle');
      let st={bg:C.cell, bd:C.ink, tx:C.ink, lw:1.4};
      if(proc) st={bg:C.tint, bd:C.ink, tx:C.ink, lw:1.4};
      if(cur)  st= isFail ? {bg:C.bad, bd:C.red2, tx:C.red2, lw:2.8} : {bg:C.redBg, bd:C.red, tx:C.redT, lw:2.8};
      if(isEnd) st={bg:C.tint, bd:C.ink, tx:C.ink, lw:1.4};
      box(x,by,cw,bh,st);
      txt(ch, x+cw/2, by+bh/2+1, '700 22px '+MONO, st.tx, 'center', 'middle');
      const e=EFF[ch];
      txt(e, x+cw/2, ey, fitFont(e, colW-10, '700', [11.5,11,10.5,10], MONO), cur?(isFail?C.red2:C.redT):(proc||isEnd?C.ink:C.dim), 'center', 'middle');
    }

    /* ---------- BAND 2 · 數線上的範圍 [l, r] ---------- */
    const B2=178, r1=224, r2=276, ay=308, tly=326, zly=344, gTop=192;
    const t2='BAND 2 · 可能的 open 數範圍 [l, r]   虛線 = 夾之前   紅 = 夾回後';
    txt(t2, PAD, B2, fitFont(t2, w-2*PAD, '600', [11.5,11,10.5,10,9.5], MONO), C.dim);
    const VMIN=-1, VMAX=3, unit=(R-L)/(VMAX-VMIN+1), X=v=>L+(v-VMIN+0.5)*unit;
    // 不可能區(< 0)
    const zx0=L, zx1=X(-0.5);
    ctx.fillStyle=C.bad; ctx.fillRect(zx0, gTop, zx1-zx0, zly+10-gTop);
    line(zx1, gTop, zx1, zly+10, C.red2, 1.2, [4,3]);
    txt('不可能(< 0)', (zx0+zx1)/2, zly, fitFont('不可能(< 0)', zx1-zx0-8, '700', [11.5,11,10.5,10], SANS), C.red2, 'center', 'middle');
    // 結尾:0 那一欄高亮
    if(isEnd){
      const ok=op.l===0;
      ctx.fillStyle=ok?C.good:C.bad; ctx.globalAlpha=0.7; ctx.fillRect(X(0)-16, gTop, 32, ay-gTop); ctx.globalAlpha=1;
    }
    // 格線 + 數線
    for(let v=VMIN; v<=VMAX; v++) line(X(v), gTop, X(v), ay, C.off, 1, [2,4]);
    line(L, ay, R, ay, C.ink, 1.6);
    for(let v=VMIN; v<=VMAX; v++){
      line(X(v), ay-5, X(v), ay+5, C.ink, 1.6);
      let tc = v<0 ? C.red2 : C.ink;
      if(isEnd && v===0) tc = op.l===0 ? C.goodT : C.red2;
      txt(m(v), X(v), tly, '700 13px '+MONO, tc, 'center', 'middle');
    }
    if(isEnd){ ctx.beginPath(); ctx.arc(X(0), tly, 12, 0, Math.PI*2); ctx.lineWidth=2; ctx.strokeStyle=op.l===0?C.goodT:C.red2; ctx.stroke(); }
    // 列標籤
    txt('l, r 先動', tagX, r1, fitFont('l, r 先動', 66, '700', [12,11.5,11], SANS), C.ink, 'center', 'middle');
    txt('max(l,0)', tagX, r2, fitFont('max(l,0)', 66, '700', [12,11.5,11], MONO), C.ink, 'center', 'middle');

    const LBL='700 11.5px '+MONO;
    function span(y, l, r, st){                  // 畫一段 [l, r];l == r 畫成點
      const xl=X(l), xr=X(r);
      if(l===r){ ctx.beginPath(); ctx.arc(xl, y, 8, 0, Math.PI*2); }
      else rr(xl-8, y-7, xr-xl+16, 14, 7);
      ctx.fillStyle=st.bg; ctx.fill(); ctx.lineWidth=st.lw; ctx.strokeStyle=st.bd; ctx.setLineDash(st.dash?[4,3]:[]); ctx.stroke(); ctx.setLineDash([]);
      if(l!==r) [xl,xr].forEach(xx=>{ ctx.beginPath(); ctx.arc(xx, y, 3.2, 0, Math.PI*2); ctx.fillStyle=st.bd; ctx.fill(); });
    }
    function ends(y, l, r, color){               // 端點標籤畫在 bar 上方
      if(l===r) txt('l = r = '+m(l), X(l), y-20, LBL, color, 'center', 'middle');
      else { txt('l = '+m(l), X(l), y-20, LBL, color, 'center', 'middle'); txt('r = '+m(r), X(r), y-20, LBL, color, 'center', 'middle'); }
    }
    function note(y, s_, color, x0){ x0=x0||X(0)-8; txt(s_, x0, y, fitFont(s_, R-x0, '700', [12,11.5,11,10.5], SANS), color, 'left', 'middle'); }

    const ghost={bg:C.cell, bd:C.dim, lw:1.6, dash:true};
    // 第 1 列:字元套用後、夾之前
    if(isInit) note(r1, '尚未讀字元', C.dim);
    else if(isEnd) note(r1, '迴圈結束,不再變動', C.dim, X(0)+28);
    else if(isFail){ span(r1, op.rl, op.rr, {bg:C.bad, bd:C.red2, lw:2.4}); ends(r1, op.rl, op.rr, C.red2); }
    else { span(r1, op.rl, op.rr, ghost); ends(r1, op.rl, op.rr, C.dim);
      if(op.rl<0){ ctx.save(); ctx.beginPath(); ctx.rect(zx0, r1-10, zx1-zx0, 20); ctx.clip();
        span(r1, op.rl, op.rr, {bg:C.bad, bd:C.red2, lw:1.8, dash:true}); ctx.restore(); } }
    // 第 2 列:夾回後
    if(isInit){ span(r2, 0, 0, {bg:C.tint, bd:C.ink, lw:2}); ends(r2, 0, 0, C.ink); }
    else if(isFail) note(r2, 'r = '+m(op.rr)+' < 0 → 整段都 < 0,直接 return false', C.red2);
    else if(isEnd){ const ok=op.l===0;
      span(r2, op.l, op.r, ok?{bg:C.good, bd:C.goodT, lw:2.4}:{bg:C.bad, bd:C.red2, lw:2.4});
      ends(r2, op.l, op.r, ok?C.goodT:C.red2); }
    else {
      if(op.rl<0){                               // 被砍掉的那段:虛線 ghost
        span(r2, op.rl, 0, {bg:C.bad, bd:C.red2, lw:1.6, dash:true});
        txt('✂ 夾掉', X(op.rl), r2-20, LBL, C.red2, 'center', 'middle');
      }
      span(r2, op.l, op.r, {bg:C.redBg, bd:C.red, lw:2.6});
      if(op.l!==op.r) [X(op.l),X(op.r)].forEach(xx=>{ ctx.beginPath(); ctx.arc(xx, r2, 3.6, 0, Math.PI*2); ctx.fillStyle=C.red; ctx.fill(); });
      ends(r2, op.l, op.r, C.redT);
    }

    /* ---------- BAND 3 · l / r 歷史 ---------- */
    const B3=378, th=398, rowT=[412, 452], rowH=32;
    const t3='BAND 3 · 每步夾回後的 l / r   小字 −1→0 = 被夾';
    txt(t3, PAD, B3, fitFont(t3, w-2*PAD, '600', [11.5,11,10.5,10,9.5], MONO), C.dim);
    const nc=n+1, hW=(R-L)/nc, hg=Math.min(14, hW*0.16), hcw=hW-hg, hx=k=>L+k*hW+hg/2;
    ['l','r'].forEach((t,ri)=> txt(t, tagX, rowT[ri]+rowH/2+1, '700 15px '+MONO, C.ink, 'center', 'middle'));
    for(let k=0;k<nc;k++){
      const x=hx(k), cur = live && k===done, filled = k<=done;
      const hd = k===0 ? '初始' : String(k-1)+" · '"+s[k-1]+"'";
      txt(hd, x+hcw/2, th, fitFont(hd, hW-6, '700', [12,11.5,11,10.5,10], k===0?SANS:MONO), cur?C.redT:(filled?C.ink:C.dim), 'center', 'middle');
      for(let ri=0;ri<2;ri++){
        const y=rowT[ri];
        if(!filled){ box(x, y, hcw, rowH, {bg:C.cell, bd:C.off, lw:1, dash:true}); continue; }
        let v, raw=null;
        if(k===0) v=0;
        else { const hh=op.hist[k-1]; v = ri===0 ? hh.l : hh.r; if(ri===0 && hh.rl!==hh.l) raw=hh.rl; }
        let st={bg:C.tint, bd:C.ink, tx:C.ink, lw:1.3};
        if(cur) st={bg:C.redBg, bd:C.red, tx:C.redT, lw:2.4};
        if(isFail && cur && ri===1) st={bg:C.bad, bd:C.red2, tx:C.red2, lw:2.6};
        if(isEnd && k===n && ri===0) st = op.l===0 ? {bg:C.good, bd:C.goodT, tx:C.goodT, lw:2.4} : {bg:C.bad, bd:C.red2, tx:C.red2, lw:2.4};
        box(x, y, hcw, rowH, st);
        if(raw!==null){
          const sm=m(raw)+'→', smF='600 11px '+MONO, bgF='700 16px '+MONO, tot=tw(sm,smF)+tw(m(v),bgF);
          const sx=x+hcw/2-tot/2;
          txt(sm, sx, y+rowH/2+1, smF, cur?C.red2:C.dim, 'left', 'middle');
          txt(m(v), sx+tw(sm,smF), y+rowH/2+1, bgF, st.tx, 'left', 'middle');
        } else {
          const vs = (isFail && cur && ri===1) ? m(v)+' ✗' : m(v);
          txt(vs, x+hcw/2, y+rowH/2+1, '700 16px '+MONO, st.tx, 'center', 'middle');
        }
      }
    }

    /* ---------- BAND 4 · 本步算式 / 結果 ---------- */
    const cy=500, chh=36;
    txt('本步', tagX, cy+chh/2+1, '700 12px '+SANS, C.ink, 'center', 'middle');
    const chipW=Math.max(96, Math.min(140, (R-L)*0.22)), chipX=R-chipW, boxR=chipX-14;
    let cl, cbg=C.cell, cbd=C.ink, ctx2=C.ink, clw=1.2, chip, kbg=C.cell, kbd=C.ink, ktx=C.ink, klw=1.2;
    const rng=(a,b)=>'['+m(a)+', '+m(b)+']';
    if(isInit){ cl='l = 0、r = 0 → 範圍 [0, 0]:一開始只可能有 0 個 open'; chip='[0, 0]'; kbd=C.off; ktx=C.dim; }
    else if(isChar){
      const opT = op.c==='(' ? 'l+1、r+1' : op.c===')' ? 'l−1、r−1' : 'l−1、r+1';
      cl="'"+op.c+"':"+opT+' → '+rng(op.rl,op.rr)+(op.rl<0 ? ',l 夾回 0 → '+rng(op.l,op.r) : ',不用夾');
      cbg=C.redBg; cbd=C.red; ctx2=C.redT; clw=2; chip=rng(op.l,op.r); kbg=C.redBg; kbd=C.red; ktx=C.redT; klw=2; }
    else if(isFail){
      cl="')':l−1、r−1 → "+rng(op.rl,op.rr)+',r = '+m(op.rr)+' < 0 → return false';
      cbg=C.bad; cbd=C.red2; ctx2=C.red2; clw=2.2; chip='false'; kbg=C.bad; kbd=C.red2; ktx=C.red2; klw=2.4; }
    else { const ok=op.l===0;
      cl = ok ? '結束 l = 0 → 0 在範圍 '+rng(op.l,op.r)+' 內 → return true'
              : '結束 l = '+m(op.l)+' → 0 不在範圍 '+rng(op.l,op.r)+' 內 → return false';
      cbg=ok?C.good:C.bad; cbd=ok?C.goodT:C.red2; ctx2=ok?C.goodT:C.red2; clw=2.2; chip=ok?'true':'false';
      kbg=cbg; kbd=cbd; ktx=ctx2; klw=2.4; }
    rr(L, cy, boxR-L, chh, 6); ctx.fillStyle=cbg; ctx.fill(); ctx.lineWidth=clw; ctx.strokeStyle=cbd; ctx.stroke();
    txt(cl, L+12, cy+chh/2+1, fitFont(cl, boxR-L-24, '700', [13,12.5,12,11.5,11,10.5,10,9.5], MONO), ctx2, 'left', 'middle');
    rr(chipX, cy, chipW, chh, 18); ctx.fillStyle=kbg; ctx.fill(); ctx.lineWidth=klw; ctx.strokeStyle=kbd; ctx.stroke();
    txt(chip, chipX+chipW/2, cy+chh/2+1, fitFont(chip, chipW-16, '700', [14,13,12,11], MONO), ktx, 'center', 'middle');
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
