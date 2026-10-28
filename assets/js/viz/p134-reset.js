/* ============================================================
   P134 · Gas Station — 一趟掃描 · cur < 0 就把 [start..i] 整段排除 · total 決定有沒有解
   diff = gas[i] − cost[i];total += diff(整圈收支);cur += diff(從 start 出發的油箱)
     cur < 0 → 從 [start..i] 任何一站出發都到不了 i+1 → start = i + 1,cur = 0
   最後 total < 0 → −1,否則 return start
   範例 A(官方範例 1)gas=[1,2,3,4,5] cost=[3,4,5,1,2] → 3
   範例 B gas=[5,1,2,3,4] cost=[4,4,1,5,1] → 4
     BAND 0  目前是哪個範例 + 輸入
     BAND 1  加油站表(i 表頭 · gas / cost / diff · 排除段淡紅 · start 標記)
     BAND 2  total / cur 兩列累計(cur 顯示 reset 前的值;reset 寫成 −2 → 0)
     BAND 3  本步判斷 / 結果
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

  /* trace(實測):每個 i → diff、total、cur(reset 前)、是否 reset、本步結束後的 start / cur */
  const EX = {
    A: { name:'範例 A · 官方 1', gas:[1,2,3,4,5], cost:[3,4,5,1,2], ans:3,
      tr:[ {d:-2,t:-2,c:-2,r:true, s:1,c2:0},
           {d:-2,t:-4,c:-2,r:true, s:2,c2:0},
           {d:-2,t:-6,c:-2,r:true, s:3,c2:0},
           {d: 3,t:-3,c: 3,r:false,s:3,c2:3},
           {d: 3,t: 0,c: 6,r:false,s:3,c2:6} ] },
    B: { name:'範例 B · 兩次 reset', gas:[5,1,2,3,4], cost:[4,4,1,5,1], ans:4,
      tr:[ {d: 1,t: 1,c: 1,r:false,s:0,c2:1},
           {d:-3,t:-2,c:-2,r:true, s:2,c2:0},
           {d: 1,t:-1,c: 1,r:false,s:2,c2:1},
           {d:-2,t:-3,c:-1,r:true, s:4,c2:0},
           {d: 3,t: 0,c: 3,r:false,s:4,c2:3} ] },
  };
  // 每個 reset 的排除段 [from..to](from = reset 前的 start)
  ['A','B'].forEach(k=>{ const ex=EX[k]; let s=0; ex.segs=[];
    ex.tr.forEach((r,i)=>{ r.s0=s; if(r.r) ex.segs.push({from:s, to:i, at:i}); s=r.s; });
    ex.maxAbs=Math.max(1,...ex.tr.map(r=>Math.max(Math.abs(r.t),Math.abs(r.c)))); });

  const OPS = [{ex:'A',kind:'init'}];
  for(let i=0;i<5;i++) OPS.push({ex:'A',kind:'i',i});
  OPS.push({ex:'A',kind:'end'}, {ex:'B',kind:'init'});
  for(let i=0;i<5;i++) OPS.push({ex:'B',kind:'i',i});
  OPS.push({ex:'B',kind:'end'});

  const steps = [
    { text:'<strong>INITIAL · 範例 A</strong> · <code>total = cur = start = 0</code>。先假設從站 0 出發;<code>cur</code> 是「從 <code>start</code> 出發到現在」的油箱,<code>total</code> 是整圈的收支。' },
    { text:'<code>i = 0</code>:<code>diff = 1 − 3 = −2</code>,<code>cur = −2 &lt; 0</code> → 從站 0 出發連站 1 都到不了,<b>站 0 排除</b>,<code>start = 1</code>、<code>cur</code> 歸零。' },
    { text:'<code>i = 1</code>:<code>diff = 2 − 4 = −2</code>,<code>cur = −2 &lt; 0</code> → 站 1 也到不了站 2,排除,<code>start = 2</code>。' },
    { text:'<code>i = 2</code>:<code>diff = 3 − 5 = −2</code>,第三次 reset → 站 2 排除,候選起點跳到 <code>start = 3</code>;<code>total</code> 累積到 <code>−6</code>。' },
    { text:'<code>i = 3</code>:<code>diff = 4 − 1 = +3</code>,<code>cur = 3 ≥ 0</code> → 從站 3 出發能撐到站 4,<code>start</code> 不動。' },
    { text:'<code>i = 4</code>:<code>diff = 5 − 2 = +3</code>,<code>cur = 6</code>、<code>total = 0</code>。掃描結束,候選起點仍是站 3。' },
    { text:'<strong>範例 A 結果</strong> · <code>total = 0 ≥ 0</code> → 整圈油夠,一定有解;前面每一段都被證明不行,唯一剩下的候選 → <code>return 3</code>。' },
    { text:'<strong>INITIAL · 範例 B</strong> · <code>gas = [5,1,2,3,4]</code>、<code>cost = [4,4,1,5,1]</code>。一樣從 <code>start = 0</code> 開始試,這次排除的段落會有兩站長。' },
    { text:'<code>i = 0</code>:<code>diff = 5 − 4 = +1</code>,<code>cur = 1 ≥ 0</code> → 站 0 出發能到站 1,繼續。' },
    { text:'<code>i = 1</code>:<code>diff = 1 − 4 = −3</code>,<code>cur = 1 − 3 = −2 &lt; 0</code> → <b>[0..1] 整段排除</b>:從站 0 都到不了站 2,從中途的站 1 出發(少了前面的正油量)更到不了。<code>start = 2</code>。' },
    { text:'<code>i = 2</code>:<code>diff = 2 − 1 = +1</code>,<code>cur = 1</code> → 從站 2 出發能到站 3,<code>start = 2</code> 不動。' },
    { text:'<code>i = 3</code>:<code>diff = 3 − 5 = −2</code>,<code>cur = 1 − 2 = −1 &lt; 0</code> → [2..3] 都到不了站 4,整段排除,<code>start = 4</code>。' },
    { text:'<code>i = 4</code>:<code>diff = 4 − 1 = +3</code>,<code>cur = 3</code>、<code>total = 0</code>。掃描結束,候選是站 4。' },
    { text:'<strong>範例 B 結果</strong> · <code>total = 0 ≥ 0</code> → 有解,答案就是最後的候選 <code>start = 4</code>;被淡紅排除的站都不必再試。' },
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
  function pill(x, y, pw, ph, s, font, bg, bd, tx, lw){
    rr(x, y, pw, ph, ph/2); ctx.fillStyle=bg; ctx.fill(); ctx.lineWidth=lw||1.2; ctx.strokeStyle=bd; ctx.stroke();
    txt(s, x+pw/2, y+ph/2+1, font, tx, 'center', 'middle');
  }
  const N = v => (v<0?'−'+(-v):String(v));
  const SG = v => (v<0?'−'+(-v):'+'+v);

  function draw(){
    fit();
    const w=canvas.clientWidth, h=canvas.clientHeight, PAD=22, IN=10;
    ctx.fillStyle=C.paper; ctx.fillRect(0,0,w,h); ctx.setLineDash([]);
    const op=OPS[step], ex=EX[op.ex], n=ex.gas.length, kind=op.kind;
    const isInit=kind==='init', isEnd=kind==='end', live=kind==='i';
    const ci = live ? op.i : null;                       // 目前的 i
    const done = isInit ? -1 : (isEnd ? n-1 : op.i);     // 已處理到哪個 i
    const cur = live ? ex.tr[ci] : null;
    const startNow = done<0 ? 0 : ex.tr[done].s;          // 本步結束後的 start
    const segs = ex.segs.filter(sg=>sg.at<=done);
    const newSeg = live && cur.r ? segs[segs.length-1] : null;
    const badCol = j => segs.some(sg=>j>=sg.from && j<=sg.to);

    const L=PAD+70, R=w-PAD-IN, tagX=PAD+35;
    const colW=(R-L)/n, cg=Math.min(18, colW*0.16), cw=colW-cg, cx=j=>L+j*colW+cg/2;

    /* ---------- BAND 0 · 哪個範例 ---------- */
    const tabF='700 11.5px '+SANS, tabW=Math.max(tw(EX.A.name,tabF), tw(EX.B.name,tabF))+22, tabH=20, tabY=6;
    ['A','B'].forEach((e,ix)=>{
      const x=w-PAD-(2-ix)*tabW-(ix===0?8:0), on=e===op.ex;
      rr(x, tabY, tabW, tabH, 10); ctx.fillStyle=on?C.ink:C.cell; ctx.fill();
      ctx.lineWidth=1.2; ctx.strokeStyle=on?C.ink:C.off; ctx.stroke();
      txt(EX[e].name, x+tabW/2, tabY+tabH/2+1, tabF, on?C.paper:C.dim, 'center', 'middle');
    });
    const t0='gas = ['+ex.gas.join(',')+']  cost = ['+ex.cost.join(',')+']  預期 → '+ex.ans;
    txt(t0, PAD, 20, fitFont(t0, w-2*PAD-2*tabW-8-16, '700', [12.5,12,11.5,11,10.5,10], MONO), C.ink);

    /* ---------- BAND 1 · 加油站表 ---------- */
    const B1=50, hy=74, rowH=34, ry=[92,138,184], my=232;
    const t1='BAND 1 · 加油站   紅 = 目前 i   淡紅 = 已排除的起點   藍 = 從 start 走到這';
    txt(t1, PAD, B1, fitFont(t1, w-2*PAD, '600', [11.5,11,10.5,10,9.5], MONO), C.dim);
    txt('i', tagX, hy, '700 12.5px '+MONO, C.ink, 'center', 'middle');
    ['gas','cost','diff'].forEach((tg,k)=> txt(tg, tagX, ry[k]+rowH/2+1, '700 13px '+MONO, C.ink, 'center', 'middle'));

    for(let j=0;j<n;j++){
      const x=cx(j), isCur=j===ci, bad=badCol(j), visited=j<=done;
      const inRun = visited && !bad && j>=startNow;       // start..done 之間、仍有效
      const isAns = isEnd && j===startNow;
      // 表頭
      txt('i = '+j, x+cw/2, hy+1, '700 12px '+MONO, isCur?C.redT:(isAns?C.goodT:(bad?C.dim:C.ink)), 'center', 'middle');
      // 三列格子
      for(let k=0;k<3;k++){
        let bg=C.cell, bd=C.ink, lw=1.4, tx=C.ink, dash=false;
        if(bad){ bg=C.bad; bd=C.dim; lw=1.2; tx=C.dim; }
        else if(isAns){ bg=C.good; bd=C.goodT; lw=2; tx=C.goodT; }
        else if(inRun){ bg=C.tint; }
        if(isCur){ bd=C.red; lw=2.6; tx=bad?C.red2:C.redT; if(!bad) bg=C.redBg; }
        let s;
        if(k===0) s=String(ex.gas[j]);
        else if(k===1) s=String(ex.cost[j]);
        else {
          if(visited){ const d=ex.tr[j].d; s=SG(d); if(!isCur && !bad && !isAns) tx = d<0?C.red2:C.goodT; }
          else { s='?'; tx=C.dim; bd=C.off; dash=true; lw=1.2; }
        }
        box(x, ry[k], cw, rowH, {bg, bd, lw, dash});
        txt(s, x+cw/2, ry[k]+rowH/2+1, '700 17px '+MONO, tx, 'center', 'middle');
      }
    }
    // 排除段:括號 + 說明(新段紅、舊段灰)
    segs.forEach(sg=>{
      const isNew = sg===newSeg, col=isNew?C.red2:C.dim;
      const x1=cx(sg.from)+4, x2=cx(sg.to)+cw-4, mx=(x1+x2)/2;
      ctx.beginPath(); ctx.moveTo(x1,my-6); ctx.lineTo(x1,my); ctx.lineTo(x2,my); ctx.lineTo(x2,my-6);
      ctx.lineWidth=isNew?2:1.3; ctx.strokeStyle=col; ctx.stroke();
      const rng = sg.from===sg.to ? '站 '+sg.from : '['+sg.from+'..'+sg.to+']';
      const segW = x2-x1+cg;
      if(isNew){
        const one='從 '+rng+' 出發都到不了 '+(sg.to+1);
        if(tw(one,'700 11px '+SANS)<=segW) txt(one, mx, my+15, '700 11px '+SANS, col, 'center', 'middle');
        else {
          const a='從 '+rng+' 出發', b='都到不了 '+(sg.to+1);
          txt(a, mx, my+14, fitFont(a, segW, '700', [11,10.5,10,9.5], SANS), col, 'center', 'middle');
          txt(b, mx, my+28, fitFont(b, segW, '700', [11,10.5,10,9.5], SANS), col, 'center', 'middle');
        }
      } else txt('✗ 排除 '+rng, mx, my+15, fitFont('✗ 排除 '+rng, segW, '600', [11,10.5,10,9.5], SANS), col, 'center', 'middle');
    });
    // start 標記
    if(startNow<n){
      const sx=cx(startNow), changed = live && cur.r;
      const s = (isEnd ? '✓ ' : '▲ ')+'start = '+startNow;
      const f=fitFont(s, cw-14, '700', [11.5,11,10.5,10,9.5], MONO), pw=Math.min(tw(s,f)+14, cw), ph=22;
      const px=sx+cw/2-pw/2, py=my-8;
      if(isEnd) pill(px,py,pw,ph,s,f,C.good,C.goodT,C.goodT,2);
      else if(changed) pill(px,py,pw,ph,s,f,C.redBg,C.red,C.redT,2);
      else pill(px,py,pw,ph,s,f,C.cell,C.ink,C.ink,1.3);
    }

    /* ---------- BAND 2 · total / cur ---------- */
    const B2=292, vH=50, rows=[{tag:'total', sub:'整圈收支', y:306}, {tag:'cur', sub:'從 start 起', y:384}];
    const t2='BAND 2 · 累計   total += diff(不 reset)   cur += diff,< 0 就歸零';
    txt(t2, PAD, B2, fitFont(t2, w-2*PAD, '600', [11.5,11,10.5,10,9.5], MONO), C.dim);
    rows.forEach(row=>{
      const y=row.y, mid=y+vH/2;
      txt(row.tag, tagX, mid-7, '700 15px '+MONO, C.ink, 'center', 'middle');
      txt(row.sub, tagX, mid+11, '600 10.5px '+SANS, C.dim, 'center', 'middle');
      for(let j=0;j<n;j++){
        const x=cx(j), isCur=j===ci;
        if(j>done){ box(x, y, cw, vH, {bg:C.cell, bd:C.off, lw:1, dash:true}); continue; }
        const r=ex.tr[j], v = row.tag==='total' ? r.t : r.c;
        const reset = row.tag==='cur' && r.r;
        let bg = v<0?C.bad:(v>0?C.good:C.cell), bd=C.ink, lw=1.4, tx = v<0?C.red2:(v>0?C.goodT:C.ink);
        if(isEnd && row.tag==='total' && j===n-1){ bd=C.goodT; lw=2.4; }
        if(isCur){ bd=C.red; lw=2.6; }
        box(x, y, cw, vH, {bg, bd, lw});
        const s = reset ? N(v)+' → 0' : N(v);
        txt(s, x+cw/2, y+17, fitFont(s, cw-10, '700', [17,15,14,13,12], MONO), tx, 'center', 'middle');
        // 小長條:中線往右 = 正、往左 = 負
        const bx=x+cw/2, half=cw/2-10, by=y+vH-14, bw=Math.abs(v)/ex.maxAbs*half;
        ctx.beginPath(); ctx.moveTo(bx, by-3); ctx.lineTo(bx, by+9); ctx.lineWidth=1; ctx.strokeStyle=C.ink; ctx.stroke();
        if(v!==0){ ctx.fillStyle = v<0?C.red2:C.goodT; ctx.fillRect(v<0?bx-bw:bx, by, bw, 6); }
        if(reset){ txt('reset', x+cw-6, y+vH-10, '700 9.5px '+MONO, C.red2, 'right', 'middle'); }
      }
    });

    /* ---------- BAND 3 · 判斷 / 結果 ---------- */
    const cy=460, chh=36;
    txt('判斷', tagX, cy+chh/2+1, '700 12px '+SANS, C.ink, 'center', 'middle');
    const chipW=Math.max(110, Math.min(160, (R-L)*0.24)), chipX=R-chipW, boxR=chipX-14;
    let cl, cbg=C.cell, cbd=C.ink, ctx2=C.ink, clw=1.2, chip, kbg=C.cell, kbd=C.ink, ktx=C.ink, klw=1.2;
    if(isInit){ cl='total = 0 · cur = 0 · start = 0 → 先從站 0 試起'; chip='start = 0'; }
    else if(live && cur.r){
      const sg=newSeg, rng = sg.from===sg.to ? '['+sg.from+'..'+sg.to+']' : '['+sg.from+'..'+sg.to+']';
      cl='cur = '+N(cur.c)+' < 0 → '+rng+' 都不能當起點,start = '+cur.s+',cur = 0';
      cbg=C.redBg; cbd=C.red; ctx2=C.redT; clw=2; chip='start = '+cur.s; kbg=C.redBg; kbd=C.red; ktx=C.redT; klw=2; }
    else if(live){
      cl='diff = '+SG(cur.d)+' → total = '+N(cur.t)+' · cur = '+N(cur.c)+' ≥ 0 → 繼續,start 不動';
      cbg=C.tint; cbd=C.ink; clw=1.6; chip='start = '+cur.s; }
    else { cl='total = '+N(ex.tr[n-1].t)+' ≥ 0 → return start = '+startNow;
      cbg=C.good; cbd=C.goodT; ctx2=C.goodT; clw=2.2; chip='return '+startNow; kbg=C.good; kbd=C.goodT; ktx=C.goodT; klw=2.4; }
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
