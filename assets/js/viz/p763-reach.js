/* ============================================================
   P763 · Partition Labels — r = 目前這段「被迫要延伸到」的位置
   phase 1:last[c] = 字母 c 最後出現的 index
   phase 2:掃 i,r = max(r, last[s[i]]);i == r → [l..i] 裡沒有字母會再出現 → 切,l = r + 1
   範例 A "abacdcde" → [3,4,1] ; 範例 B(官方範例 1)"ababcbacadefegdehijhklij" → [9,7,8]
     BAND 0  目前是哪個範例 + 輸入
     BAND 1  字串格(index 表頭 · 字母格 · [l..r] 括號 · l / i / r 指標)
     BAND 2  last[] 表(只列出現過的字母)
     BAND 3  ans(每段對齊字串位置)+ 本步狀態
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
    A: { s:'abacdcde',                 name:'範例 A · abacdcde', ans:[3,4,1] },
    B: { s:'ababcbacadefegdehijhklij', name:'範例 B · 官方 1',    ans:[9,7,8] },
  };

  /* trace:init = phase 1 完成;scan = 一個 i;end = 回傳 ans */
  const OPS = [];
  ['A','B'].forEach(k=>{
    const s=EX[k].s, n=s.length, last={};
    for(let i=0;i<n;i++) last[s[i]]=i;
    EX[k].last=last; EX[k].letters=Object.keys(last).sort();
    OPS.push({ ex:k, kind:'init', l:0, r:0, parts:[] });
    let l=0, r=0; const parts=[];
    for(let i=0;i<n;i++){
      const r0=r, L0=l; r=Math.max(r, last[s[i]]);
      const cut = i===r;
      if(cut){ parts.push([l, r]); l=r+1; }
      OPS.push({ ex:k, kind:'scan', i, c:s[i], lc:last[s[i]], r0, r, l:L0, cut, parts:parts.map(p=>p.slice()) });
    }
    OPS.push({ ex:k, kind:'end', l, r, parts:parts.map(p=>p.slice()) });
  });

  function labelOf(op){
    const ex=EX[op.ex];
    if(op.kind==='init'){
      return '<strong>PHASE 1 · '+ex.name.split(' · ')[0]+'</strong> · 先把 <code>s = "'+ex.s+'"</code> 掃一遍,記下每個字母<b>最後出現</b>的位置 <code>last[]</code>(下方表格),再從 <code>l = r = 0</code> 開始第二遍掃描。';
    }
    if(op.kind==='end'){
      return '<strong>'+ex.name.split(' · ')[0]+' 結果</strong> · 掃完整個字串,<code>ans = ['+ex.ans.join(',')+']</code> —— 每個字母都只落在其中一段,而且每一刀都切在「最早能切」的地方,所以段數最多。';
    }
    const grew = op.r>op.r0;
    const read = '<code>i = '+op.i+'</code> 讀到 <code>'+op.c+'</code>,<code>last['+op.c+'] = '+op.lc+'</code>';
    if(op.cut){
      const pre = grew ? read+',<code>r</code> 從 '+op.r0+' 推到 '+op.r+';' : read+',<code>r</code> 仍是 '+op.r+';';
      return pre+'此時 <code>i == r = '+op.r+'</code>,<code>['+op.l+'..'+op.r+']</code> 裡的字母後面都不會再出現 → <b>切!</b><code>ans.push_back('+(op.r-op.l+1)+')</code>,<code>l = '+(op.r+1)+'</code>。';
    }
    if(grew) return read+' → 這個字母後面還會出現,這段<b>至少要延伸到 '+op.lc+'</b>,<code>r</code> 從 '+op.r0+' 推到 '+op.r+'。';
    return read+',沒有超過 <code>r = '+op.r+'</code> → 這段要到的地方不變,<code>i</code> 還沒追上 <code>r</code>,不能切。';
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
  function fitFont(s, maxW, weight, sizes, fam){ for(const z of sizes){ const f=weight+' '+z+'px '+fam; if(tw(s,f)<=maxW) return f; } return weight+' '+sizes[sizes.length-1]+'px '+fam; }
  // 多個候選字串:取第一個能放進 maxW 的
  function fitText(cands, maxW, weight, sizes, fam){
    for(const s of cands) for(const z of sizes){ const f=weight+' '+z+'px '+fam; if(tw(s,f)<=maxW) return {s, f}; }
    const s=cands[cands.length-1]; return {s, f:weight+' '+sizes[sizes.length-1]+'px '+fam};
  }
  function line(x1,y1,x2,y2,color,lw,dash){ ctx.setLineDash(dash||[]); ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.lineWidth=lw; ctx.strokeStyle=color; ctx.stroke(); ctx.setLineDash([]); }
  function arrowR(x1,x2,y,color){ // x1 → x2(往右)
    line(x1,y,x2-2,y,color,2.4);
    ctx.beginPath(); ctx.moveTo(x2,y); ctx.lineTo(x2-8,y-5); ctx.lineTo(x2-8,y+5); ctx.closePath(); ctx.fillStyle=color; ctx.fill();
  }
  function pill(x, y, pw, ph, s, font, bg, bd, tx, lw){
    rr(x, y, pw, ph, ph/2); ctx.fillStyle=bg; ctx.fill(); ctx.lineWidth=lw||1.2; ctx.strokeStyle=bd; ctx.stroke();
    txt(s, x+pw/2, y+ph/2+1, font, tx, 'center', 'middle');
  }

  function draw(){
    fit();
    const w=canvas.clientWidth, h=canvas.clientHeight, PAD=22, IN=10;
    ctx.fillStyle=C.paper; ctx.fillRect(0,0,w,h); ctx.setLineDash([]);
    const op=OPS[step], ex=EX[op.ex], s=ex.s, n=s.length, kind=op.kind;
    const isInit=kind==='init', isScan=kind==='scan', isEnd=kind==='end';
    const grew = isScan && op.r>op.r0, isCut = isScan && op.cut;
    const parts = op.parts;
    const partIdx = j => { for(let k=0;k<parts.length;k++) if(j>=parts[k][0]&&j<=parts[k][1]) return k; return -1; };
    const partTint = k => k%2===0 ? C.tint : C.tint2;

    const X0=PAD+70, XR=w-PAD-IN, L=X0, R=XR;
    const tagX=PAD+35;

    /* ---------- BAND 0 · 哪個範例 ---------- */
    const tabF='700 11.5px '+SANS, tabW=Math.max(tw(EX.A.name,tabF), tw(EX.B.name,tabF))+22, tabH=20, tabY=6;
    ['A','B'].forEach((e,ix)=>{
      const x=w-PAD-(2-ix)*tabW-(ix===0?8:0), on=e===op.ex;
      rr(x, tabY, tabW, tabH, 10); ctx.fillStyle=on?C.ink:C.cell; ctx.fill();
      ctx.lineWidth=1.2; ctx.strokeStyle=on?C.ink:C.off; ctx.stroke();
      txt(EX[e].name, x+tabW/2, tabY+tabH/2+1, tabF, on?C.paper:C.dim, 'center', 'middle');
    });
    const t0a='s = "'+s+'"   n = '+n+'   預期 → ['+ex.ans.join(',')+']', t0b='s = "'+s+'"   n = '+n;
    const T0=fitText([t0a,t0b], w-2*PAD-2*tabW-8-16, '700', [12.5,12,11.5,11,10.5], MONO);
    txt(T0.s, PAD, 20, T0.f, C.ink);

    /* ---------- BAND 1 · 字串 ---------- */
    const B1=50, hy=76, by=98, bh=38, bkTop=148, bkY=156, my=175;
    const colW=(R-L)/n, cg=colW>=30?Math.min(16, colW*0.16):colW*0.24, cw=colW-cg, cx=j=>L+j*colW+cg/2, cmid=j=>L+j*colW+colW/2;
    // 右上 pill:r 狀態
    let pT, pbg=C.cell, pbd=C.ink, ptx=C.ink, plw=1.2;
    if(isInit){ pT='l = 0 · r = 0'; }
    else if(isEnd){ pT='l = '+op.l+' = n · 掃完'; pbg=C.good; pbd=C.goodT; ptx=C.goodT; plw=1.6; }
    else if(isCut){ pT='i == r = '+op.r+' → 切'; pbg=C.good; pbd=C.goodT; ptx=C.goodT; plw=2; }
    else if(grew){ pT='r: '+op.r0+' → '+op.r; pbg=C.redBg; pbd=C.red; ptx=C.redT; plw=1.8; }
    else { pT='r = '+op.r+'(不變)'; }
    const pF='700 11.5px '+MONO, pW=tw(pT,pF)+22, pH=20, pX=R-pW;
    pill(pX, B1-14, pW, pH, pT, pF, pbg, pbd, ptx, plw);
    const t1 = isInit ? 'BAND 1 · s   綠 = 該字母最後一次出現的位置(phase 1)'
             : isEnd ? 'BAND 1 · s   直線 = 切點   底色 = 各段'
             : 'BAND 1 · s   紅 = s[i]   紅虛線 = last[s[i]] 的位置   括號 = 這段 [l..r]';
    txt(t1, PAD, B1, fitFont(t1, pX-PAD-14, '600', [11.5,11,10.5,10,9.5], MONO), C.dim);
    txt('idx', tagX, hy, '700 12px '+MONO, C.ink, 'center', 'middle');
    txt('s', tagX, by+bh/2+1, '700 15px '+MONO, C.ink, 'center', 'middle');
    txt('指標', tagX, my, '700 11.5px '+SANS, C.ink, 'center', 'middle');

    const hF = '600 '+(colW>=30?12:10.5)+'px '+MONO;
    const lF = '700 '+(colW>=40?21:15)+'px '+MONO;
    const tgt = isScan && op.lc!==op.i ? op.lc : -1;
    for(let j=0;j<n;j++){
      const x=cx(j), k=partIdx(j);
      // 表頭
      let hc=C.dim, hf=hF;
      if(isScan && j===op.i){ hc=C.redT; hf=hF.replace('600','700'); }
      else if(j===tgt){ hc=C.red2; hf=hF.replace('600','700'); }
      txt(String(j), cmid(j), hy+1, hf, hc, 'center', 'middle');
      // 格子
      let st={bg:C.cell, bd:C.ink, tx:C.ink, lw:1.4};
      if(isInit){ st = ex.last[s[j]]===j ? {bg:C.good, bd:C.goodT, tx:C.goodT, lw:1.8} : {bg:C.cell, bd:C.ink, tx:C.ink, lw:1.4}; }
      else if(k>=0){ st={bg:partTint(k), bd:C.ink, tx:C.ink, lw:1.4}; if(isEnd) st.bd=C.goodT; }
      else if(isScan && j>op.r){ st={bg:C.cell, bd:C.off, tx:C.dim, lw:1.2}; }
      else if(isScan && j>op.i){ st={bg:C.cell, bd:C.ink, tx:C.ink, lw:1.4}; }
      if(isScan && j===op.i){ st={bg:C.redBg, bd:C.red, tx:C.redT, lw:2.6}; }
      if(j===tgt){ st={bg:st.bg, bd:C.red2, tx:C.red2, lw:2.2, dash:true}; }
      box(x,by,cw,bh,st);
      txt(s[j], x+cw/2, by+bh/2+1, lF, st.tx, 'center', 'middle');
    }
    // 已切的刀
    const cutX = j => L+(j+1)*colW;   // j 與 j+1 之間
    parts.forEach((p,k)=>{
      const justCut = isCut && k===parts.length-1;
      if(p[1]===n-1 && !justCut) return;
      const x=Math.min(cutX(p[1]), R+4);
      line(x, by-10, x, by+bh+10, justCut?C.red:C.ink, justCut?3:2);
    });
    // [l..r] 括號
    if(isScan){
      const x1=cx(op.l)+1, x2=cx(op.r)+cw-1;
      const bc = isCut ? C.goodT : C.ink, blw = isCut ? 2.4 : 1.8;
      line(x1, bkTop, x1, bkY, bc, blw); line(x2, bkTop, x2, bkY, bc, blw);
      if(grew && op.r0>=op.l){
        const xo=cx(op.r0)+cw-1;
        line(x1, bkY, xo, bkY, bc, blw);
        line(xo, bkTop, xo, bkY, C.dim, 1.4, [3,2]);
        arrowR(xo, x2, bkY, C.red);
      } else if(grew){ // 新段第一個字母:r 從上一段末端跳過來
        line(x1, bkY, x2, bkY, C.red, 2.4);
      } else line(x1, bkY, x2, bkY, bc, blw);
    }
    // 指標 l / i / r
    if(!isEnd){
      const mk={};
      const add=(j,t,c)=>{ (mk[j]=mk[j]||[]).push([t,c]); };
      add(op.l,'l',C.ink);
      if(isScan) add(op.i,'i',C.red);
      add(op.r,'r', grew?C.red:(isCut?C.goodT:C.ink));
      const mF='700 '+(colW>=30?13:11)+'px '+MONO;
      Object.keys(mk).forEach(j=>{
        const toks=mk[j], seg=[]; toks.forEach((t,ix)=>{ if(ix) seg.push([',',C.dim]); seg.push(t); });
        const tot=seg.reduce((a,t)=>a+tw(t[0],mF),0); let x=cmid(+j)-tot/2;
        seg.forEach(t=>{ txt(t[0], x, my, mF, t[1], 'left', 'middle'); x+=tw(t[0],mF); });
      });
    } else {
      const m='l = '+op.l+' = n,迴圈結束';
      txt(m, L, my, '700 12px '+MONO, C.goodT, 'left', 'middle');
    }

    /* ---------- BAND 2 · last[] ---------- */
    const B2=206, ly=230, cy2=252, ch2=34;
    const t2='BAND 2 · last[c] = 字母 c 最後出現的位置(phase 1 算好,只列出現過的字母)';
    txt(t2, PAD, B2, fitFont(t2, w-2*PAD, '600', [11.5,11,10.5,10,9.5], MONO), C.dim);
    txt('字母', tagX, ly, '700 11.5px '+SANS, C.ink, 'center', 'middle');
    txt('last', tagX, cy2+ch2/2+1, '700 13px '+MONO, C.ink, 'center', 'middle');
    const lets=ex.letters, m=lets.length, tW=(R-L)/m, tg=Math.min(18, tW*0.18), tcw=tW-tg;
    const vF='700 '+(tcw>=40?16:14)+'px '+MONO;
    lets.forEach((c,k)=>{
      const x=L+k*tW+tg/2, v=ex.last[c], rd = isScan && c===op.c;
      const pk = partIdx(v);
      let st={bg:C.cell, bd:C.ink, tx:C.ink, lw:1.4};
      if(isInit) st={bg:C.good, bd:C.goodT, tx:C.goodT, lw:1.6};
      else if(pk>=0) st={bg:partTint(pk), bd:isEnd?C.goodT:C.ink, tx:C.ink, lw:1.4};
      if(rd) st={bg:C.redBg, bd:C.red, tx:C.redT, lw:2.6};
      txt(c, x+tcw/2, ly+1, '700 13px '+MONO, rd?C.redT:C.dim, 'center', 'middle');
      box(x, cy2, tcw, ch2, st);
      txt(String(v), x+tcw/2, cy2+ch2/2+1, vF, st.tx, 'center', 'middle');
    });

    /* ---------- BAND 3 · ans + 狀態 ---------- */
    const B3=310, ay=326, ah=34, sy=380, sh=36;
    const t3='BAND 3 · ans = 每一段的 size(對齊上面字串的位置)';
    txt(t3, PAD, B3, fitFont(t3, w-2*PAD, '600', [11.5,11,10.5,10,9.5], MONO), C.dim);
    txt('ans', tagX, ay+ah/2+1, '700 13px '+MONO, C.ink, 'center', 'middle');
    txt('狀態', tagX, sy+sh/2+1, '700 12px '+SANS, C.ink, 'center', 'middle');
    const spanX = (a,b)=>[cx(a), cx(b)+cw-cx(a)];
    const sF=['700',[13,12,11,10.5,10]];
    if(isInit){
      box(L, ay, R-L, ah, {bg:C.cell, bd:C.off, lw:1.2, dash:true});
      txt('ans = [ ] · 還沒切任何一段', L+(R-L)/2, ay+ah/2+1, '600 12px '+SANS, C.dim, 'center', 'middle');
    } else {
      parts.forEach((p,k)=>{
        const [x,ww]=spanX(p[0],p[1]), sz=p[1]-p[0]+1, justCut=isCut&&k===parts.length-1;
        let st={bg:partTint(k), bd:C.ink, tx:C.ink, lw:1.4};
        if(justCut) st={bg:partTint(k), bd:C.red, tx:C.redT, lw:2.6};
        if(isEnd) st={bg:C.good, bd:C.goodT, tx:C.goodT, lw:2};
        box(x, ay, ww, ah, st);
        const T=fitText(['size '+sz+' · ['+p[0]+'..'+p[1]+']', 'size '+sz, String(sz)], ww-10, sF[0], sF[1], MONO);
        txt(T.s, x+ww/2, ay+ah/2+1, T.f, st.tx, 'center', 'middle');
      });
      if(isScan && !isCut){
        const [x,ww]=spanX(op.l, op.r);
        box(x, ay, ww, ah, {bg:C.cell, bd:grew?C.red:C.ink, lw:1.4, dash:true});
        const T=fitText(['['+op.l+'..'+op.r+'] 還在延伸', '['+op.l+'..'+op.r+']', '…'], ww-10, '600', [12,11,10.5,10], MONO);
        txt(T.s, x+ww/2, ay+ah/2+1, T.f, grew?C.redT:C.ink, 'center', 'middle');
      }
      const nxt = isScan ? (op.cut ? op.r+1 : op.r+1) : n;
      if(isScan && nxt<n){
        const [x,ww]=spanX(nxt, n-1);
        box(x, ay, ww, ah, {bg:C.cell, bd:C.off, lw:1.1, dash:true});
        const T=fitText(['尚未決定', '…'], ww-8, '600', [11,10.5,10], SANS);
        if(ww>=18) txt(T.s, x+ww/2, ay+ah/2+1, T.f, C.dim, 'center', 'middle');
      }
    }
    // 狀態行
    let sl, sbg=C.cell, sbd=C.ink, stx=C.ink, slw=1.2;
    if(isInit){ sl='phase 1 完成 · n = '+n+' · '+m+' 種字母 · l = 0, r = 0 → 從 i = 0 開始掃'; sbg=C.tint; }
    else if(isEnd){ sl='ans = ['+ex.ans.join(',')+'] · 共 '+ex.ans.length+' 段 · '+ex.ans.join(' + ')+' = '+n+' = n'; sbg=C.good; sbd=C.goodT; stx=C.goodT; slw=2.2; }
    else {
      const a='i = '+op.i+','+op.c+' 最後在 '+op.lc+' → r = max('+op.r0+', '+op.lc+') = '+op.r;
      if(isCut){ const sz=' → 切!size = '+op.r+' − '+op.l+' + 1 = '+(op.r-op.l+1);
        sl=[a+' · i == r'+sz, 'i = '+op.i+','+op.c+' 最後在 '+op.lc+' → r = '+op.r+' · i == r'+sz]; sbg=C.good; sbd=C.goodT; stx=C.goodT; slw=2; }
      else if(grew){ sl=a+' · r 往右推'; sbg=C.redBg; sbd=C.red; stx=C.redT; slw=2; }
      else { sl=a+' · 不變,i < r 不能切'; sbg=C.tint; }
    }
    rr(L, sy, R-L, sh, 6); ctx.fillStyle=sbg; ctx.fill(); ctx.lineWidth=slw; ctx.strokeStyle=sbd; ctx.stroke();
    const SL=fitText(Array.isArray(sl)?sl:[sl], R-L-24, '700', [13,12.5,12,11.5,11], MONO);
    txt(SL.s, L+12, sy+sh/2+1, SL.f, stx, 'left', 'middle');
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
