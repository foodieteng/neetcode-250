/* ============================================================
   P1899 · Merge Triplets to Form Target Triplet — 先過濾「有毒」的 triplet,再把安全的逐座標取 max
   有任何一格 t[k] > target[k] → 合併後那一格永遠回不去(max 只會變大)→ 跳過
   其餘全部 ≤ target → ans[k] = max(ans[k], t[k]);最後 return ans == target
   ans 一定從 0 開始:起始值不能被誤當成「已經湊到」
   範例 A(官方 1)triplets=[[2,5,3],[1,8,4],[1,7,5]] target=[2,7,5] → true
     t0 [2,5,3] 合併 → ans=[2,5,3];t1 [1,8,4] y: 8>7 跳過 → [2,5,3];t2 [1,7,5] 合併 → [2,7,5] → true
   範例 B(官方 3)triplets=[[2,5,3],[2,3,4],[1,2,5],[5,2,3]] target=[5,5,5] → true
     → [2,5,3] → [2,5,4] → [2,5,5] → [5,5,5] → true
   範例 C(起始值陷阱)triplets=[[1,1,2]] target=[1,1,1] → false
     t0 z: 2>1 跳過 → ans 停在 [0,0,0] ≠ target → false(正確)
     對照 ans(3, 1):一開始 [1,1,1],t0 一樣跳過,仍 [1,1,1] == target → true(錯)
     BAND 0  目前是哪個範例 + 預期答案
     BAND 1  target 列(x y z / [0] [1] [2] 表頭)+ triplets 列(逐格比較 · 超過的格子紅)
             範例 C 空出的列放 ans(3, 1) 對照
     BAND 2  ans 列(== target 的格子綠 · 本步被 max 拉高的格子紅框)
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

  /* trace(實測):每個 triplet → 是否安全、第一個超過的座標 f、本步結束後的 ans */
  const EX = {
    A: { name:'範例 A · 官方 1', tg:[2,7,5], ret:true,
      ts:[[2,5,3],[1,8,4],[1,7,5]],
      tr:[ {ok:true, f:-1, a:[2,5,3]},
           {ok:false,f: 1, a:[2,5,3]},
           {ok:true, f:-1, a:[2,7,5]} ] },
    B: { name:'範例 B · 官方 3', tg:[5,5,5], ret:true,
      ts:[[2,5,3],[2,3,4],[1,2,5],[5,2,3]],
      tr:[ {ok:true, f:-1, a:[2,5,3]},
           {ok:true, f:-1, a:[2,5,4]},
           {ok:true, f:-1, a:[2,5,5]},
           {ok:true, f:-1, a:[5,5,5]} ] },
    C: { name:'範例 C · 起始值陷阱', tg:[1,1,1], ret:false,
      ts:[[1,1,2]],
      tr:[ {ok:false,f: 2, a:[0,0,0]} ],
      alt:{ init:1, a:[1,1,1], ret:true } },   // 對照:ans(3, 1) 的 trace
  };
  const KEYS = ['A','B','C'], AX = ['x','y','z'];

  const OPS = [];
  KEYS.forEach(k=>{
    OPS.push({ex:k, kind:'init'});
    EX[k].ts.forEach((_,i)=>OPS.push({ex:k, kind:'t', i}));
    OPS.push({ex:k, kind:'end'});
  });

  const steps = [
    /* A */
    { text:'<strong>INITIAL · 範例 A</strong> · <code>target = [2,7,5]</code>,<code>ans = [0,0,0]</code>。規則:triplet 只要有<b>一格超過</b> target 就不能碰(<code>max</code> 只會變大,超過就回不來);其餘的全部逐格取 <code>max</code>。' },
    { text:'<code>t0 = [2,5,3]</code>:<code>2 ≤ 2</code>、<code>5 ≤ 7</code>、<code>3 ≤ 5</code> 全部沒超過 → <b>安全,合併</b>。<code>ans</code> 從 <code>[0,0,0]</code> 變成 <code>[2,5,3]</code>,x 已經到了。' },
    { text:'<code>t1 = [1,8,4]</code>:y 是 <code>8 &gt; 7</code> → <b>有毒,跳過</b>。一旦合併,<code>ans[1]</code> 至少是 8,再也回不到 7。<code>ans</code> 維持 <code>[2,5,3]</code>。' },
    { text:'<code>t2 = [1,7,5]</code>:<code>1 ≤ 2</code>、<code>7 ≤ 7</code>、<code>5 ≤ 5</code> → 安全,合併。y、z 被拉到 7、5,<code>ans = [2,7,5]</code>。' },
    { text:'<strong>範例 A 結果</strong> · <code>ans = [2,7,5] == target</code> → <code>return true</code>。三個座標分別由 t0(x)和 t2(y、z)湊齊,被跳過的 t1 完全沒參與。' },
    /* B */
    { text:'<strong>INITIAL · 範例 B</strong> · <code>target = [5,5,5]</code>,四個 triplet 都沒有超過 5 的格子 → 全部安全。看 <code>ans</code> 怎麼一格一格被拉上去。' },
    { text:'<code>t0 = [2,5,3]</code> 安全 → <code>ans = [2,5,3]</code>。<b>y 已經到 5</b>(由 t0 提供)。' },
    { text:'<code>t1 = [2,3,4]</code> 安全 → 只有 z 變大:<code>max(3,4) = 4</code>,<code>ans = [2,5,4]</code>;x、y 取 max 後不變。' },
    { text:'<code>t2 = [1,2,5]</code> 安全 → z 拉到 5,<code>ans = [2,5,5]</code>。<b>z 由 t2 提供</b>。' },
    { text:'<code>t3 = [5,2,3]</code> 安全 → x 拉到 5,<code>ans = [5,5,5]</code>。<b>x 由 t3 提供</b>。' },
    { text:'<strong>範例 B 結果</strong> · <code>ans = [5,5,5] == target</code> → <code>return true</code>。沒有任何一個 triplet 本身是 target,但三個座標各由不同的 triplet 湊到,合併起來就行。' },
    /* C */
    { text:'<strong>INITIAL · 範例 C</strong> · <code>target = [1,1,1]</code>,<code>ans</code> 從 <code>[0,0,0]</code> 開始。下方對照:如果寫成 <code>ans(3, 1)</code>,一開始就已經 <code>== target</code> —— 還沒看任何 triplet 就「達成」了。' },
    { text:'<code>t0 = [1,1,2]</code>:z 是 <code>2 &gt; 1</code> → 跳過。唯一的 triplet 被丟掉,<code>ans</code> 停在 <code>[0,0,0]</code>;對照組也跳過,停在 <code>[1,1,1]</code>。' },
    { text:'<strong>範例 C 結果</strong> · <code>[0,0,0] ≠ [1,1,1]</code> → <code>return false</code>(正確)。寫成 <code>ans(3, 1)</code> 會得到 <code>[1,1,1] == target</code> → <b>錯誤地回傳 true</b>:起始值被誤當成「已經湊到」,但沒有任何 triplet 真的提供過那個 1。' },
  ];

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
  const arr = a => '['+a.join(',')+']';
  const eq = (a,b) => a.every((v,k)=>v===b[k]);
  function gapText(a, tg){
    const hit=AX.filter((_,k)=>a[k]===tg[k]), miss=AX.filter((_,k)=>a[k]!==tg[k]);
    if(!miss.length) return 'x y z 全到 ●';
    if(!hit.length) return '還差 '+miss.join(' ');
    return '已到 '+hit.join(' ')+' · 還差 '+miss.join(' ');
  }

  function draw(){
    fit();
    const w=canvas.clientWidth, h=canvas.clientHeight, PAD=22, IN=10;
    ctx.fillStyle=C.paper; ctx.fillRect(0,0,w,h); ctx.setLineDash([]);
    const op=OPS[step], ex=EX[op.ex], n=ex.ts.length, kind=op.kind;
    const isInit=kind==='init', isEnd=kind==='end', live=kind==='t';
    const ci = live ? op.i : null;
    const done = isInit ? -1 : (isEnd ? n-1 : op.i);          // 已處理到哪個 triplet
    const ansNow = done<0 ? [0,0,0] : ex.tr[done].a;
    const ansPrev = live ? (ci===0 ? [0,0,0] : ex.tr[ci-1].a) : ansNow;

    const L=PAD+70, R=w-PAD-IN, tagX=PAD+35;
    const cellsW=(R-L)*0.56, colW=cellsW/3, cg=Math.min(22, colW*0.16), cw=colW-cg, cx=k=>L+k*colW+cg/2;
    const SX=L+cellsW+14, SW=R-SX;                            // 右側狀態欄
    const rowH=34, VF='700 17px '+MONO;

    /* ---------- BAND 0 · 哪個範例 ---------- */
    const tabF='700 11.5px '+SANS, tabW=Math.max(...KEYS.map(k=>tw(EX[k].name,tabF)))+20, tabH=20, tabY=6, tabG=6;
    KEYS.forEach((e,ix)=>{
      const x=w-PAD-(3-ix)*tabW-(2-ix)*tabG, on=e===op.ex;
      rr(x, tabY, tabW, tabH, 10); ctx.fillStyle=on?C.ink:C.cell; ctx.fill();
      ctx.lineWidth=1.2; ctx.strokeStyle=on?C.ink:C.off; ctx.stroke();
      txt(EX[e].name, x+tabW/2, tabY+tabH/2+1, tabF, on?C.paper:C.dim, 'center', 'middle');
    });
    const t0=n+' 個 triplet · 預期 → '+ex.ret;
    txt(t0, PAD, 20, fitFont(t0, w-2*PAD-3*tabW-2*tabG-16, '700', [12.5,12,11.5,11,10.5,10], MONO), C.ink);

    /* ---------- BAND 1 · target + triplets ---------- */
    const t1='BAND 1 · 紅 = 目前這組 / 超過的格子   淡紅 = 有毒 → 跳過   綠 = 安全 → 已合併';
    txt(t1, PAD, 50, fitFont(t1, w-2*PAD, '600', [11.5,11,10.5,10,9.5], MONO), C.dim);
    const hy=72, ty=92;
    AX.forEach((a,k)=> txt(a+'  ['+k+']', cx(k)+cw/2, hy, '700 12px '+MONO, C.ink, 'center', 'middle'));
    txt('檢查 t[k] ≤ target[k]', SX+12, hy, fitFont('檢查 t[k] ≤ target[k]', SW-12, '700', [12,11.5,11,10.5], MONO), C.dim, 'left', 'middle');
    // target 列
    txt('target', tagX, ty+rowH/2+1, '700 13px '+MONO, C.ink, 'center', 'middle');
    AX.forEach((_,k)=>{ box(cx(k), ty, cw, rowH, {bg:C.tint, bd:C.ink, lw:1.8});
      txt(String(ex.tg[k]), cx(k)+cw/2, ty+rowH/2+1, VF, C.ink, 'center', 'middle'); });
    const tn='上限:每一格都不能超過';
    txt(tn, SX+12, ty+rowH/2+1, fitFont(tn, SW-12, '600', [12,11.5,11,10.5,10], SANS), C.dim, 'left', 'middle');

    // triplet 列
    const r0=140, rGap=44, rowY=i=>r0+i*rGap;
    ex.ts.forEach((t,i)=>{
      const y=rowY(i), isCur=i===ci, seen=i<=done, tr=ex.tr[i];
      txt('t'+i, tagX, y+rowH/2+1, '700 14px '+MONO, isCur?C.redT:(seen?C.ink:C.dim), 'center', 'middle');
      for(let k=0;k<3;k++){
        const fail=t[k]>ex.tg[k];
        let bg=C.cell, bd=C.ink, lw=1.4, tx=C.ink, s=String(t[k]), f=VF;
        if(isCur){
          s = t[k]+(fail?' > ':' ≤ ')+ex.tg[k];
          f = fitFont(s, cw-10, '700', [16,15,14,13,12], MONO);
          if(!tr.ok){ bg=C.bad; bd=C.red; lw=2.6; tx=C.redT; if(fail){ bg=C.red; tx=C.paper; } }
          else { bg=C.redBg; bd=C.red; lw=2.6; tx=C.redT; }
        } else if(seen){
          if(tr.ok){ bg=C.good; bd=C.goodT; lw=1.4; tx=C.ink; }
          else { bg=C.bad; bd=fail?C.red:C.dim; lw=fail?2:1.2; tx=fail?C.red2:C.dim; }
        }
        box(cx(k), y, cw, rowH, {bg, bd, lw});
        txt(s, cx(k)+cw/2, y+rowH/2+1, f, tx, 'center', 'middle');
      }
      // 狀態欄
      let st, sbg=C.cell, sbd=C.off, stx=C.dim, slw=1, dash=false;
      const why = tr.ok ? '全部 ≤ target → 合併' : AX[tr.f]+': '+t[tr.f]+' > '+ex.tg[tr.f]+' → 跳過';
      if(isCur){ st=why; sbg=tr.ok?C.redBg:C.bad; sbd=C.red; stx=C.redT; slw=2; }
      else if(seen){ st=(tr.ok?'● ':'× ')+why; sbg=tr.ok?C.good:C.bad; sbd=tr.ok?C.goodT:C.dim; stx=tr.ok?C.goodT:C.red2; slw=1.2; }
      else { st='待檢查'; dash=true; }
      box(SX, y, SW, rowH, {bg:sbg, bd:sbd, lw:slw, dash});
      txt(st, SX+12, y+rowH/2+1, fitFont(st, SW-22, '700', [13,12.5,12,11.5,11,10.5,10], MONO), stx, 'left', 'middle');
    });

    // 範例 C:空出的列放 ans(3, 1) 對照
    if(ex.alt){
      const py=rowY(1)+4, ph=104, px=PAD-6, pw=R+10-px;
      box(px, py, pw, ph, {bg:C.tint2, bd:isEnd?C.red:C.dim, lw:isEnd?2:1.2, dash:!isEnd, rad:6});
      const ht='對照 · 原本寫 vector<int> ans(3, 1)';
      txt(ht, L, py+18, fitFont(ht, R-L-12, '700', [12.5,12,11.5,11], MONO), C.ink, 'left', 'middle');
      const ay=py+36, a1=ex.alt.a;
      txt('ans', tagX, ay+rowH/2-6, '700 13px '+MONO, C.ink, 'center', 'middle');
      txt('init 1', tagX, ay+rowH/2+10, '600 10.5px '+MONO, C.dim, 'center', 'middle');
      a1.forEach((v,k)=>{ box(cx(k), ay, cw, rowH, {bg:C.good, bd:isEnd?C.red:C.goodT, lw:isEnd?2.4:1.4});
        txt(String(v), cx(k)+cw/2, ay+rowH/2+1, VF, isEnd?C.redT:C.goodT, 'center', 'middle'); });
      let as, abg=C.cell, abd=C.ink, atx=C.ink, alw=1.2;
      if(isInit){ as='還沒看就 == target ?!'; abg=C.cell; abd=C.red; atx=C.redT; alw=1.6; }
      else if(live){ as='t0 一樣跳過 → 仍 '+arr(a1); }
      else { as='== target → true × 錯';abg=C.redBg; abd=C.red; atx=C.redT; alw=2; }
      box(SX, ay, SW, rowH, {bg:abg, bd:abd, lw:alw});
      txt(as, SX+12, ay+rowH/2+1, fitFont(as, SW-22, '700', [13,12.5,12,11.5,11,10.5,10], MONO), atx, 'left', 'middle');
      const bt='起始的 1 被誤當成「已經湊到」—— 沒有任何 triplet 真的提供過 1';
      txt(bt, L, ay+rowH+20, fitFont(bt, R-L-12, '700', [12.5,12,11.5,11,10.5,10], SANS), isEnd?C.red2:C.ink, 'left', 'middle');
    }

    /* ---------- BAND 2 · ans ---------- */
    const t2='BAND 2 · ans[k] = max(ans[k], t[k])(只合併安全的)   綠 = 已等於 target';
    txt(t2, PAD, 328, fitFont(t2, w-2*PAD, '600', [11.5,11,10.5,10,9.5], MONO), C.dim);
    const ay=344, aH=40;
    txt('ans', tagX, ay+aH/2-7, '700 15px '+MONO, C.ink, 'center', 'middle');
    txt('init 0', tagX, ay+aH/2+11, '600 10.5px '+MONO, C.dim, 'center', 'middle');
    for(let k=0;k<3;k++){
      const v=ansNow[k], hit=v===ex.tg[k], chg=live && ansPrev[k]!==v;
      let bg=hit?C.good:C.cell, bd=hit?C.goodT:C.ink, lw=hit?1.8:1.4, tx=hit?C.goodT:C.ink;
      if(chg){ bd=C.red; lw=2.6; }
      if(isEnd && !ex.ret && !hit){ bg=C.bad; bd=C.red2; tx=C.red2; lw=2; }
      box(cx(k), ay, cw, aH, {bg, bd, lw});
      const s = chg ? ansPrev[k]+' → '+v : String(v);
      txt(s, cx(k)+cw/2, ay+aH/2+1, fitFont(s, cw-10, '700', [18,17,16,15,14,13], MONO), chg?C.redT:tx, 'center', 'middle');
    }
    const gl = gapText(ansNow, ex.tg), gl2 = 'vs target '+arr(ex.tg)+' · '+gl;
    const gt = tw(gl2, '700 12px '+MONO) <= SW-22 ? gl2 : gl;
    const allHit = eq(ansNow, ex.tg);
    box(SX, ay, SW, aH, {bg:allHit?C.good:C.cell, bd:allHit?C.goodT:C.ink, lw:allHit?1.8:1.2});
    txt(gt, SX+12, ay+aH/2+1, fitFont(gt, SW-22, '700', [13,12.5,12,11.5,11,10.5,10], MONO), allHit?C.goodT:C.ink, 'left', 'middle');

    /* ---------- BAND 3 · 判斷 / 結果 ---------- */
    const cy=404, chh=36;
    txt('判斷', tagX, cy+chh/2+1, '700 12px '+SANS, C.ink, 'center', 'middle');
    const chipW=Math.max(110, Math.min(160, (R-L)*0.24)), chipX=R-chipW, boxR=chipX-14;
    let cl, cbg=C.cell, cbd=C.ink, ctx2=C.ink, clw=1.2, chip, kbg=C.cell, kbd=C.ink, ktx=C.ink, klw=1.2;
    if(isInit){ cl='ans = [0,0,0] · 逐一檢查 '+n+' 個 triplet 有沒有格子超過 target'; chip='ans = [0,0,0]'; }
    else if(live){
      const t=ex.ts[ci], tr=ex.tr[ci];
      if(tr.ok){ cl=arr(t)+' 安全 → ans = max('+arr(ansPrev)+', '+arr(t)+') = '+arr(tr.a);
        cbg=C.tint; cbd=C.ink; clw=1.6; chip='合併'; kbg=C.good; kbd=C.goodT; ktx=C.goodT; klw=2; }
      else { cl=AX[tr.f]+' = '+t[tr.f]+' > '+ex.tg[tr.f]+' → 合併後回不去 → 跳過,ans 仍 '+arr(tr.a);
        cbg=C.redBg; cbd=C.red; ctx2=C.redT; clw=2; chip='跳過'; kbg=C.redBg; kbd=C.red; ktx=C.redT; klw=2; }
    }
    else {
      cl = arr(ansNow)+(ex.ret?' == ':' ≠ ')+arr(ex.tg)+' → return '+ex.ret+(ex.ret?'':'(正確)');
      cbg=C.good; cbd=C.goodT; ctx2=C.goodT; clw=2.2; chip='return '+ex.ret; kbg=C.good; kbd=C.goodT; ktx=C.goodT; klw=2.4; }
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
