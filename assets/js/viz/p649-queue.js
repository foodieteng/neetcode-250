/* ============================================================
   P649 · Dota2 Senate — 兩條 queue · 值小先行動 · 禁掉對方 front · 自己 +n 回隊尾
   qr / qd 存座位 index;每輪各 pop 一個 front 比大小:
     r < d → R 先行動,禁掉 d,qr.push(r + n)
     否則  → D 先行動,禁掉 r,qd.push(d + n)
   queue 值 v ⇒ 座 v % n · 第 v / n + 1 輪
   範例 A(官方範例 2)"RDD" → "Dire" ; 範例 B "DDRRR" → "Dire"(R 較多卻輸)
     BAND 0  目前是哪個範例 + 輸入
     BAND 1  senate 座位(座號表頭 · R/D 格 · 每座狀態)
     BAND 2  qr / qd 兩條 queue(左邊 pop 出列格 + 隊伍 front → back)
     BAND 3  本步比較 / 結果
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
    A: { s:'RDD',   name:'範例 A · 官方 2', ans:'"Dire"', qr:[0],     qd:[1,2] },
    B: { s:'DDRRR', name:'範例 B · DDRRR', ans:'"Dire"', qr:[2,3,4], qd:[0,1] },
  };

  /* trace:cmp = 兩隊 pop front 比較;ban = 先行動者禁掉對方、自己 +n 回隊尾 */
  const OPS = [
    { ex:'A', kind:'init' },
    { ex:'A', kind:'cmp', r:0, d:1 }, { ex:'A', kind:'ban', r:0, d:1 },
    { ex:'A', kind:'cmp', r:3, d:2 }, { ex:'A', kind:'ban', r:3, d:2 },
    { ex:'A', kind:'end' },
    { ex:'B', kind:'init' },
    { ex:'B', kind:'cmp', r:2, d:0 }, { ex:'B', kind:'ban', r:2, d:0 },
    { ex:'B', kind:'cmp', r:3, d:1 }, { ex:'B', kind:'ban', r:3, d:1 },
    { ex:'B', kind:'cmp', r:4, d:5 }, { ex:'B', kind:'ban', r:4, d:5 },
    { ex:'B', kind:'cmp', r:9, d:6 }, { ex:'B', kind:'ban', r:9, d:6 },
    { ex:'B', kind:'end' },
  ];

  // 依 trace 套用,存下每一步「本步結束後」的 qr / qd(不含出列格)與被禁座位
  const SNAP = [];
  (function build(){
    let qr=null, qd=null, banned=null;
    for(const op of OPS){
      const ex=EX[op.ex], n=ex.s.length;
      if(op.kind==='init'){ qr=ex.qr.slice(); qd=ex.qd.slice(); banned=[]; }
      if(op.kind==='cmp'){ qr.shift(); qd.shift(); }
      if(op.kind==='ban'){
        if(op.r<op.d){ qr.push(op.r+n); banned.push(op.d%n); }
        else         { qd.push(op.d+n); banned.push(op.r%n); }
      }
      SNAP.push({ qr:qr.slice(), qd:qd.slice(), banned:banned.slice() });
    }
  })();

  const steps = [
    { text:'<strong>INITIAL · 範例 A</strong> · <code>senate = "RDD"</code>,<code>n = 3</code>。R 座 0 進 <code>qr</code>,D 座 1、2 進 <code>qd</code>。queue 裡的值就是座位 index —— <b>值越小越先行動</b>。' },
    { text:'兩隊各 pop 出 front:<code>r = 0</code>、<code>d = 1</code>。<code>0 &lt; 1</code> → R 座 0 比 D 座 1 先行動。' },
    { text:'R 座 0 禁掉 D 座 1(D 方<b>下一個要行動</b>的人);自己 <code>qr.push(r + n)</code> = <code>0 + 3 = 3</code> → 同一個座位、<b>第 2 輪</b>再排隊。' },
    { text:'再 pop:<code>r = 3</code>(座 0 · 第 2 輪)、<code>d = 2</code>(座 2 · 第 1 輪)。<code>2 &lt; 3</code> → D 座 2 這輪還沒動過,先行動。' },
    { text:'D 座 2 禁掉 R 座 0;<code>qd.push(d + n)</code> = <code>2 + 3 = 5</code> → 座 2 · 第 2 輪。<code>qr</code> 已經空了。' },
    { text:'<strong>範例 A 結果</strong> · <code>qr</code> 空、<code>qd = [5]</code> → <code>while</code> 結束,<code>return "Dire"</code>。' },
    { text:'<strong>INITIAL · 範例 B</strong> · <code>senate = "DDRRR"</code>,<code>n = 5</code>。<code>qr = [2,3,4]</code>(3 人)、<code>qd = [0,1]</code>(2 人)。R 人數較多,但 D 坐在前面、<b>先行動</b>。' },
    { text:'<code>r = 2</code> vs <code>d = 0</code>:<code>0 &lt; 2</code> → D 座 0 先行動。' },
    { text:'D 座 0 禁掉 R 方的 front —— R 座 2;<code>qd.push(0 + 5 = 5)</code>(座 0 · 第 2 輪)。' },
    { text:'<code>r = 3</code> vs <code>d = 1</code>:<code>1 &lt; 3</code> → D 座 1 先行動。' },
    { text:'D 座 1 禁掉 R 座 3;<code>qd.push(1 + 5 = 6)</code>。R 方只剩座 4。' },
    { text:'<code>r = 4</code> vs <code>d = 5</code>:<code>4 &lt; 5</code> → 座 4 的第 1 輪比座 0 的第 2 輪早,<b>R 座 4 先行動</b>。' },
    { text:'R 座 4 禁掉 D 座 0(值 5);<code>qr.push(4 + 5 = 9)</code>(座 4 · 第 2 輪)。' },
    { text:'<code>r = 9</code> vs <code>d = 6</code>:<code>6 &lt; 9</code> → 同樣是第 2 輪,座 1 在座 4 前面 → D 座 1 先行動。' },
    { text:'D 座 1 禁掉 R 座 4;<code>qd.push(6 + 5 = 11)</code>(座 1 · 第 3 輪)。<code>qr</code> 空了。' },
    { text:'<strong>範例 B 結果</strong> · <code>qr</code> 空、<code>qd = [11]</code> → <code>return "Dire"</code>。R 多一人也沒用:每次被禁的都是 R 方<b>下一個要行動</b>的人,先手的 D 一路禁到底。' },
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
  function strike(x1,y,x2,color,lw){ ctx.beginPath(); ctx.moveTo(x1,y); ctx.lineTo(x2,y); ctx.lineWidth=lw; ctx.strokeStyle=color; ctx.stroke(); }
  function arrowL(x1,x2,y,color){ // x1 → x2(往左)
    ctx.beginPath(); ctx.moveTo(x1,y); ctx.lineTo(x2+2,y); ctx.lineWidth=2; ctx.strokeStyle=color; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x2,y); ctx.lineTo(x2+7,y-5); ctx.lineTo(x2+7,y+5); ctx.closePath(); ctx.fillStyle=color; ctx.fill();
  }
  function pill(x, y, pw, ph, s, font, bg, bd, tx, lw){
    rr(x, y, pw, ph, ph/2); ctx.fillStyle=bg; ctx.fill(); ctx.lineWidth=lw||1.2; ctx.strokeStyle=bd; ctx.stroke();
    txt(s, x+pw/2, y+ph/2+1, font, tx, 'center', 'middle');
  }

  function draw(){
    fit();
    const w=canvas.clientWidth, h=canvas.clientHeight, PAD=22, IN=10;
    ctx.fillStyle=C.paper; ctx.fillRect(0,0,w,h); ctx.setLineDash([]);
    const op=OPS[step], sn=SNAP[step], ex=EX[op.ex], n=ex.s.length, kind=op.kind;
    const isCmp=kind==='cmp', isBan=kind==='ban', isEnd=kind==='end', isInit=kind==='init';
    const live = isCmp||isBan;
    const rWin = live && op.r<op.d;                       // R 先行動?
    const actV = live ? (rWin?op.r:op.d) : null, losV = live ? (rWin?op.d:op.r) : null;
    const actSeat = live ? actV%n : null, losSeat = live ? losV%n : null;
    const newV = isBan ? actV+n : null;
    const seatOf=v=>v%n, roundOf=v=>Math.floor(v/n)+1;

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
    const t0='senate = "'+ex.s+'"   n = '+n+'   預期 → '+ex.ans;
    txt(t0, PAD, 20, fitFont(t0, w-2*PAD-2*tabW-8-16, '700', [12.5,12,11.5,11,10.5], MONO), C.ink);

    /* ---------- BAND 1 · senate 座位 ---------- */
    const B1=50, hy=76, by=98, bh=44, sy=158, sy2=174;
    let rd = live ? roundOf(actV) : (isEnd ? null : 1);
    const rTxt = rd===null ? '投票結束' : '第 '+rd+' 輪';
    const rpF='700 11.5px '+SANS, rpW=tw(rTxt,rpF)+22, rpH=20, rpX=R-rpW;
    pill(rpX, B1-14, rpW, rpH, rTxt, rpF, live?C.redBg:C.cell, live?C.red:C.ink, live?C.redT:C.ink, live?1.6:1.2);
    const t1='BAND 1 · senate 座位   紅 = 本回合行動者   灰 + 刪除線 = 被禁';
    txt(t1, PAD, B1, fitFont(t1, rpX-PAD-14, '600', [11.5,11,10.5,10,9.5], MONO), C.dim);
    txt('座', tagX, hy, '700 12px '+SANS, C.ink, 'center', 'middle');
    txt('senate', tagX, by+bh/2+1, '700 12.5px '+MONO, C.ink, 'center', 'middle');
    txt('狀態', tagX, sy, '700 11.5px '+SANS, C.ink, 'center', 'middle');

    const colW=(R-L)/n, cg=Math.min(16, colW*0.16), cw=colW-cg, cx=j=>L+j*colW+cg/2;
    // 每座目前在哪(本步結束後)
    const where={};
    sn.qr.forEach(v=>{ where[seatOf(v)]={q:'qr', v}; });
    sn.qd.forEach(v=>{ where[seatOf(v)]={q:'qd', v}; });
    for(let j=0;j<n;j++){
      const x=cx(j), ch=ex.s[j], banned=sn.banned.includes(j);
      const justBanned = isBan && j===losSeat;
      const isAct = live && j===actSeat, isOpp = isCmp && j===losSeat;
      // 表頭
      let hc = (isAct||justBanned) ? C.redT : C.dim;
      txt('座 '+j, x+cw/2, hy+1, '700 12px '+MONO, hc, 'center', 'middle');
      // 格子
      let st={bg: ch==='R'?C.tint:C.tint2, bd:C.ink, tx:C.ink, lw:1.4};
      if(banned) st={bg:C.off, bd:justBanned?C.red:C.dim, tx:C.dim, lw:justBanned?2.2:1.2};
      if(isAct) st={bg:C.redBg, bd:C.red, tx:C.redT, lw:2.8};
      if(isOpp) st={bg: ch==='R'?C.tint:C.tint2, bd:C.red, tx:C.ink, lw:1.8, dash:true};
      if(isEnd && !banned) st={bg:C.good, bd:C.goodT, tx:C.goodT, lw:2};
      box(x,by,cw,bh,st);
      txt(ch, x+cw/2, by+bh/2+1, '700 21px '+MONO, st.tx, 'center', 'middle');
      if(banned){ const sw=Math.min(cw-16, 46); strike(x+cw/2-sw/2, by+bh/2+1, x+cw/2+sw/2, justBanned?C.red:C.ink, 2.2); }
      // 狀態
      let s, s2=null, sc=C.dim;
      if(banned){ s = justBanned ? '剛被禁 ✗' : '被禁 ✗'; sc = justBanned ? C.red2 : C.dim; }
      else if(live && (j===actSeat || j===losSeat) && isCmp){ s='出列比較中'; sc=C.redT; }
      else if(where[j]){ const v=where[j].v; s=where[j].q+' · 值 '+v; s2='等第 '+roundOf(v)+' 輪'; sc = (isBan&&v===newV)?C.redT:(isEnd?C.goodT:C.ink);
        if(isEnd) s2='存活 ✓'; }
      else s='—';
      txt(s, x+cw/2, sy, fitFont(s, colW-12, '700', [11.5,11,10.5,10], MONO), sc, 'center', 'middle');
      if(s2) txt(s2, x+cw/2, sy2, fitFont(s2, colW-12, '600', [10.5,10,9.5], SANS), sc===C.ink?C.dim:sc, 'center', 'middle');
    }

    /* ---------- BAND 2 · qr / qd ---------- */
    const B2=210, hq=232, rowH=50, rows=[{tag:'qr', side:'R', y:252}, {tag:'qd', side:'D', y:342}];
    const t2='BAND 2 · queue   值 v → 座 v % n · 第 v / n + 1 輪   值小 = 先行動';
    txt(t2, PAD, B2, fitFont(t2, w-2*PAD, '600', [11.5,11,10.5,10,9.5], MONO), C.dim);
    const AG=34, qW=(R-L-AG)/4, qg=Math.min(16, qW*0.14), qcw=qW-qg;
    const popX=L, qx=k=>L+qW+AG+k*qW+qg/2, popW=qW-qg/2;
    txt('pop 出列', popX+popW/2, hq, '700 11.5px '+MONO, live?C.redT:C.dim, 'center', 'middle');
    const qHead='queue:front → back';
    txt(qHead, qx(0), hq, fitFont(qHead, R-qx(0), '700', [11.5,11,10.5], MONO), C.dim, 'left', 'middle');

    function sub(v){ return '座 '+seatOf(v)+' · 第 '+roundOf(v)+' 輪'; }
    function qcell(x,y,cwid,st,big,small,smallC){
      box(x,y,cwid,rowH,st);
      txt(big, x+cwid/2, y+18, fitFont(big, cwid-10, '700', [19,17,15,14], MONO), st.tx, 'center', 'middle');
      if(small) txt(small, x+cwid/2, y+rowH-12, fitFont(small, cwid-8, '600', [11,10.5,10,9.5,9], MONO), smallC||st.tx, 'center', 'middle');
    }

    rows.forEach(row=>{
      const q = row.tag==='qr' ? sn.qr : sn.qd, y=row.y, mid=y+rowH/2;
      const tint = row.side==='R' ? C.tint : C.tint2;
      // 左側 tag(垂直置中)
      txt(row.tag, tagX, mid-7, '700 15px '+MONO, C.ink, 'center', 'middle');
      txt(row.side+' 方', tagX, mid+11, '600 10.5px '+SANS, C.dim, 'center', 'middle');
      // 出列格
      const popV = live ? (row.tag==='qr'?op.r:op.d) : null;
      if(popV===null){
        box(popX, y, popW, rowH, {bg:C.cell, bd:C.off, lw:1.2, dash:true});
        txt(isEnd ? '—' : 'front 尚未出列', popX+popW/2, mid+1, fitFont('front 尚未出列', popW-10, '600', [11,10.5,10,9.5], MONO), C.dim, 'center', 'middle');
      } else {
        const isWin = popV===actV;
        if(isCmp){
          qcell(popX, y, popW, {bg:C.redBg, bd:C.red, tx:C.redT, lw:2.6}, (row.tag==='qr'?'r = ':'d = ')+popV, sub(popV));
        } else if(isWin){
          qcell(popX, y, popW, {bg:C.good, bd:C.goodT, tx:C.goodT, lw:2.2}, popV+' + '+n+' = '+newV, '行動 ✓ → 回隊尾');
        } else {
          qcell(popX, y, popW, {bg:C.bad, bd:C.red2, tx:C.red2, lw:2.2}, String(popV), '被禁 ✗ 不再回隊');
          const sw=Math.min(popW-24, 40); strike(popX+popW/2-sw/2, y+18, popX+popW/2+sw/2, C.red2, 2.4);
        }
      }
      // 出列箭頭(queue front → pop)
      const ax1=qx(0)-4, ax2=popX+popW+6;
      if(isCmp) arrowL(ax1, ax2, mid, C.red);
      else { ctx.setLineDash([3,3]); strike(ax2+4, mid, ax1, C.off, 1.2); ctx.setLineDash([]); }
      // 隊伍格(最多 3 格)
      for(let k=0;k<3;k++){
        const x=qx(k);
        if(k<q.length){
          const v=q[k], isNew = isBan && v===newV;
          let st={bg:tint, bd:C.ink, tx:C.ink, lw:1.4};
          if(isNew) st={bg:C.redBg, bd:C.red, tx:C.redT, lw:2.6};
          if(isEnd) st={bg:C.good, bd:C.goodT, tx:C.goodT, lw:2};
          qcell(x, y, qcw, st, String(v), sub(v));
        } else {
          box(x, y, qcw, rowH, {bg:C.cell, bd:C.off, lw:1, dash:true});
        }
      }
      if(q.length===0 && !isCmp){
        const big = isEnd ? row.tag+'.empty() → 輸' : row.tag+' 空了';
        const ex0=qx(0), ew=qx(2)+qcw-ex0;
        rr(ex0, y, ew, rowH, 5); ctx.fillStyle=C.bad; ctx.fill(); ctx.setLineDash([4,3]); ctx.lineWidth=1.8; ctx.strokeStyle=C.red2; ctx.stroke(); ctx.setLineDash([]);
        txt(big, ex0+ew/2, mid+1, fitFont(big, ew-20, '700', [15,14,13,12], MONO), C.red2, 'center', 'middle');
      }
    });

    /* ---------- BAND 3 · 比較 / 結果 ---------- */
    const cy=418, chh=36;
    txt('比較', tagX, cy+chh/2+1, '700 12px '+SANS, C.ink, 'center', 'middle');
    const chipW=Math.max(110, Math.min(160, (R-L)*0.24)), chipX=R-chipW, boxR=chipX-14;
    let cl, cbg=C.cell, cbd=C.ink, ctx2=C.ink, clw=1.2, chip, kbg=C.cell, kbd=C.ink, ktx=C.ink, klw=1.2;
    const A_=rWin?'R':'D', B_=rWin?'D':'R';
    if(isInit){ cl='R 座 → qr、D 座 → qd · qr = ['+ex.qr.join(',')+'] · qd = ['+ex.qd.join(',')+']'; ctx2=C.ink; chip='尚未開始'; kbd=C.off; ktx=C.dim; }
    else if(isCmp){ const lo=Math.min(op.r,op.d), hi=Math.max(op.r,op.d);
      cl='r = '+op.r+' vs d = '+op.d+' → '+lo+' < '+hi+','+A_+' 座 '+actSeat+' 先行動';
      cbg=C.redBg; cbd=C.red; ctx2=C.redT; clw=2; chip=A_+' 先行動'; kbg=C.redBg; kbd=C.red; ktx=C.redT; klw=2; }
    else if(isBan){
      cl=A_+' 座 '+actSeat+' 禁掉 '+B_+' 座 '+losSeat+';'+(rWin?'r':'d')+' + n = '+actV+' + '+n+' = '+newV+' → '+(rWin?'qr':'qd');
      cbg=C.tint; cbd=C.ink; ctx2=C.ink; clw=1.6; chip='push '+newV; kbg=C.redBg; kbd=C.red; ktx=C.redT; klw=2; }
    else { const winQ = sn.qr.length? 'qr':'qd', emQ = sn.qr.length? 'qd':'qr';
      cl=emQ+' 空、'+winQ+' = ['+(winQ==='qr'?sn.qr:sn.qd).join(',')+'] → !qr.empty() 為 '+(sn.qr.length?'true':'false')+' → return';
      cbg=C.good; cbd=C.goodT; ctx2=C.goodT; clw=2.2; chip=sn.qr.length?'"Radiant"':'"Dire"'; kbg=C.good; kbd=C.goodT; ktx=C.goodT; klw=2.4; }
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
