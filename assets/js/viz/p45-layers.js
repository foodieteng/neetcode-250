/* ============================================================
   P45 · Jump Game II — BFS 分層:curEnd / nextEnd · viz
     for (i = 0; i < n − 1; i++) {
       nextEnd = max(nextEnd, i + nums[i]);   ① 收集:再跳一次最遠到哪
       if (curEnd == i) { step++; curEnd = nextEnd; }   ② 這一層看完 → 多跳一次
     }
   第 k 層 = 剛好需要 k 跳才到得了的格子(一段連續區間,P55 的前綴性質)。
   範例 1 [2,3,1,1,4] → 2 ;例 [4,1,1,3,1,1,1] → 2(最佳 0→3→6;每次跳最遠 0→4→5→6 = 3 跳)
     BAND 0  目前是哪個範例
     BAND 1  nums(依「第幾跳到得了」上色 · 紅 = 目前 i · 虛線 = 下一層候選)
     BAND 2  範圍軌道:curEnd(實線)/ nextEnd(紅虛線)+ i → i + nums[i] 弧線 + max 決策
     BAND 3  邊界事件:i == curEnd ? + step 計數
   所有數字取自實測 trace(fact sheet T1 / T5)。
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
  // 每一層的底色 / 文字色:偶數層 米、奇數層 藍(交替)
  const EVEN = { bg:C.tint2, tx:'#7a5622' }, ODD = { bg:C.tint, tx:'#2c5577' };
  const LAYER = [ EVEN, ODD, EVEN ];
  const MONO = '"JetBrains Mono", "Noto Sans TC", monospace', SANS = '"Noto Sans TC", sans-serif';

  const EX = {
    1: { nums:[2,3,1,1,4],       name:'範例 1', pill:'範例 1', layers:[[0,0],[1,2],[3,4]], path:[0,1,4] },
    5: { nums:[4,1,1,3,1,1,1],   name:'例 2',   pill:'例 [4,1,1,3,1,1,1]', layers:[[0,0],[1,4],[5,6]], path:[0,3,6], far:[0,4,5,6] },
  };

  /* trace(fact sheet T1 / T5):本步前 nb/cb/sb,本步後 na/ca/sa;ev = curEnd == i */
  const S = [
    { ex:1, kind:'init', na:0, ca:0, sa:0 },
    { ex:1, kind:'iter', i:0, nb:0, na:2, ev:true,  sb:0, sa:1, cb:0, ca:2 },
    { ex:1, kind:'iter', i:1, nb:2, na:4, ev:false, sb:1, sa:1, cb:2, ca:2 },
    { ex:1, kind:'iter', i:2, nb:4, na:4, ev:true,  sb:1, sa:2, cb:2, ca:4 },
    { ex:1, kind:'iter', i:3, nb:4, na:4, ev:false, sb:2, sa:2, cb:4, ca:4 },
    { ex:1, kind:'done', na:4, ca:4, sa:2 },
    { ex:5, kind:'init', na:0, ca:0, sa:0 },
    { ex:5, kind:'iter', i:0, nb:0, na:4, ev:true,  sb:0, sa:1, cb:0, ca:4 },
    { ex:5, kind:'iter', i:1, nb:4, na:4, ev:false, sb:1, sa:1, cb:4, ca:4 },
    { ex:5, kind:'iter', i:2, nb:4, na:4, ev:false, sb:1, sa:1, cb:4, ca:4 },
    { ex:5, kind:'iter', i:3, nb:4, na:6, ev:false, sb:1, sa:1, cb:4, ca:4 },
    { ex:5, kind:'iter', i:4, nb:6, na:6, ev:true,  sb:1, sa:2, cb:4, ca:6 },
    { ex:5, kind:'iter', i:5, nb:6, na:6, ev:false, sb:2, sa:2, cb:6, ca:6 },
    { ex:5, kind:'done', na:6, ca:6, sa:2 },
  ];

  const steps = [
    { text:'<strong>INITIAL · 範例 1</strong> · <code>nums = [2,3,1,1,4]</code>。把格子<b>依「最少要跳幾次才到得了」分層</b>:第 0 層 = <code>{0}</code>(不用跳)。<code>step = 0</code> 是目前層數,<code>curEnd = 0</code> 是這一層的右邊界,<code>nextEnd = 0</code> 是「從目前看過的格子再跳一次」最遠能到哪。' },
    { text:'<code>i=0, nums[0]=2</code>:① <code>nextEnd = max(0, 0+2) = 2</code>。② <code>i == curEnd</code>(0 == 0)→ 第 0 層<b>看完了</b>,不跳一次就走不下去 → <code>step = 1</code>,<code>curEnd = nextEnd = 2</code>:<b>第 1 層 = [1..2]</b> 亮起(跳 1 次就到得了的格子)。' },
    { text:'<code>i=1, nums[1]=3</code>:① <code>nextEnd = max(2, 1+3) = 4</code> ↑,index 3、4 成了<b>下一層候選</b>(虛線)。② <code>1 &lt; curEnd = 2</code> → 第 1 層還有 index 2 沒看,<b>先不加 step</b>,繼續收集 nextEnd。' },
    { text:'<code>i=2, nums[2]=1</code>:① <code>nextEnd = max(4, 2+1) = 4</code> 不變。② <code>i == curEnd</code>(2 == 2)→ 第 1 層看完 → <code>step = 2</code>,<code>curEnd = nextEnd = 4</code>:<b>第 2 層 = [3..4]</b>,終點 4 就在這一層裡。' },
    { text:'<code>i=3, nums[3]=1</code>:① <code>nextEnd = max(4, 3+1) = 4</code> 不變。② <code>3 &lt; curEnd = 4</code> → 繼續。下一輪 <code>i = 4</code> 不滿足 <code>i &lt; n−1 = 4</code>,迴圈結束。' },
    { text:'<strong>範例 1 結果</strong> · 三層:第 0 跳 <code>[0]</code>、第 1 跳 <code>[1..2]</code>、第 2 跳 <code>[3..4]</code>。終點 4 在第 2 層 → <code>return 2</code> ✓(例如 0 → 1 → 4)。迴圈只跑到 <code>n−2</code>:<b>已經站在終點就不用再跳</b>,不然會多算一次。' },
    { text:'<strong>INITIAL · 例 2</strong> · <code>nums = [4,1,1,3,1,1,1]</code>。同一個演算法重來:<code>step = 0, curEnd = 0, nextEnd = 0</code>。這個例子要看清楚:<b>演算法從不決定「從哪一格起跳」</b>,只記下一層最遠到哪。' },
    { text:'<code>i=0, nums[0]=4</code>:① <code>nextEnd = max(0, 0+4) = 4</code>。② <code>i == curEnd</code>(0 == 0)→ <code>step = 1</code>,<code>curEnd = 4</code>:<b>第 1 層 = [1..4]</b>(跳 1 次能到的四格)。' },
    { text:'<code>i=1, nums[1]=1</code>:① <code>nextEnd = max(4, 1+1) = 4</code> 不變(1 → 2 沒超過 4)。② <code>1 &lt; 4</code> → 第 1 層還沒看完,繼續。' },
    { text:'<code>i=2, nums[2]=1</code>:① <code>nextEnd = max(4, 2+1) = 4</code> 不變。② <code>2 &lt; 4</code> → 繼續。' },
    { text:'<code>i=3, nums[3]=3</code>:① <code>nextEnd = max(4, 3+3) = 6</code> ↑ —— 能到終點 6 的那一跳是從 <b>index 3 起跳</b>,它在第 1 層的<b>中間</b>,不是盡頭 4。② <code>3 &lt; 4</code> → 繼續。<b>不用決定從哪跳,只記最遠</b>:nextEnd 自動記住了「第 1 層裡最好的那一格」。' },
    { text:'<code>i=4, nums[4]=1</code>:① <code>nextEnd = max(6, 4+1) = 6</code> 不變 —— 從 4 只到 5,但 6 早就被 i=3 收集到了。② <code>i == curEnd</code>(4 == 4)→ 第 1 層看完 → <code>step = 2</code>,<code>curEnd = 6</code>:<b>第 2 層 = [5..6]</b>。' },
    { text:'<code>i=5, nums[5]=1</code>:① <code>nextEnd = max(6, 5+1) = 6</code> 不變。② <code>5 &lt; 6</code> → 繼續。下一輪 <code>i = 6</code> 不滿足 <code>i &lt; n−1 = 6</code>,迴圈結束。' },
    { text:'<strong>例 2 結果</strong> · 三層 <code>[0]</code>、<code>[1..4]</code>、<code>[5..6]</code> → <code>return 2</code> ✓,對應最佳路線 <b>0 → 3 → 6</b>。對照「每次都跳到最遠那格」:0 → 4 → 5 → 6 = <b>3 跳</b> ✗ —— 落點最遠不代表下一跳最好;分層掃描把整層都看過,所以不會漏掉 index 3。' },
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
  function head(x,y,a,color,hl){
    hl=hl||9; ctx.beginPath(); ctx.moveTo(x,y);
    ctx.lineTo(x-hl*Math.cos(a-0.42), y-hl*Math.sin(a-0.42));
    ctx.lineTo(x-hl*Math.cos(a+0.42), y-hl*Math.sin(a+0.42)); ctx.closePath(); ctx.fillStyle=color; ctx.fill();
  }
  // 從 (x1,y) 拱到 (x2,y),頂點高 hgt(負數 = 往下拱);箭頭在終點
  function arc(x1,x2,y,hgt,color,lw,dash){
    const mx=(x1+x2)/2, cy=y-hgt*2;
    ctx.beginPath(); ctx.moveTo(x1,y); ctx.quadraticCurveTo(mx,cy,x2,y);
    ctx.lineWidth=lw; ctx.strokeStyle=color; ctx.setLineDash(dash?[5,4]:[]); ctx.stroke(); ctx.setLineDash([]);
    head(x2, y, Math.atan2(y-cy, x2-mx), color);
  }
  function vline(x,y1,y2,color,lw,dash){ ctx.beginPath(); ctx.moveTo(x,y1); ctx.lineTo(x,y2); ctx.lineWidth=lw; ctx.strokeStyle=color; ctx.setLineDash(dash||[]); ctx.stroke(); ctx.setLineDash([]); }
  // 置中膠囊(水平夾在 [lo, hi] 之內);回傳實際左右
  function pill(cxp, cyp, s, font, bg, bd, tx, lw, dash, lo, hi){
    const pw=tw(s,font)+18, ph=20;
    let x=cxp-pw/2; if(lo!==undefined) x=Math.max(lo, Math.min(hi-pw, x));
    rr(x, cyp-ph/2, pw, ph, 10); ctx.fillStyle=bg; ctx.fill();
    ctx.setLineDash(dash?[4,3]:[]); ctx.lineWidth=lw||1.2; ctx.strokeStyle=bd; ctx.stroke(); ctx.setLineDash([]);
    txt(s, x+pw/2, cyp+1, font, tx, 'center', 'middle');
    return [x, x+pw];
  }

  function draw(){
    fit();
    const w=canvas.clientWidth, h=canvas.clientHeight, PAD=22, IN=10;
    ctx.fillStyle=C.paper; ctx.fillRect(0,0,w,h); ctx.setLineDash([]);
    const s=S[step], ex=EX[s.ex], A=ex.nums, N=A.length;
    const iter = s.kind==='iter', done = s.kind==='done', init = s.kind==='init';
    const cur = iter ? s.i : -1;
    const nL = s.sa + 1;                                         // 本步結束時已確定的層數
    const newL = iter && s.ev ? s.sa : -1;                      // 本步剛亮起的層
    const layerOf = k => { for(let j=0;j<nL;j++){ const g=ex.layers[j]; if(k>=g[0]&&k<=g[1]) return j; } return -1; };
    const pend = k => k>s.ca && k<=s.na;                       // 下一層候選:(curEnd, nextEnd]

    const X0=PAD+70, XR=w-PAD-IN, colW=(XR-X0)/N, cg=Math.min(14, colW*0.16), cw=colW-cg;
    const cx=k=>X0+k*colW+cg/2, mid=k=>cx(k)+cw/2, endX=k=>cx(k)+cw;
    const L=cx(0), R=cx(N-1)+cw;
    const tagX=PAD+35;

    /* ---------- BAND 0 · 哪個範例 ---------- */
    const tabF='700 11.5px '+SANS, tabH=20, tabY=6;
    const pw1=tw(EX[1].pill,tabF)+22, pw5=tw(EX[5].pill,tabF)+22;
    const x5=w-PAD-pw5, x1=x5-8-pw1;
    for(const [e,x,pw] of [[1,x1,pw1],[5,x5,pw5]]){
      const on=e===s.ex;
      rr(x, tabY, pw, tabH, 10); ctx.fillStyle=on?C.ink:C.cell; ctx.fill();
      ctx.lineWidth=1.2; ctx.strokeStyle=on?C.ink:C.off; ctx.stroke();
      txt(EX[e].pill, x+pw/2, tabY+tabH/2+1, tabF, on?C.paper:C.dim, 'center', 'middle');
    }
    const t0='BAND 0 · '+ex.name+'   nums = ['+A.join(',')+']   預期 → 2';
    txt(t0, PAD, 20, fitFont(t0, x1-PAD-16, '700', [12.5,12,11.5,11,10.5], MONO), C.ink);

    /* ---------- BAND 1 · nums(分層上色) ---------- */
    const B1=48, by=94, bh=44, bkY=by+bh+12, bkT=bkY+15;
    // 圖例:第 0 / 1 / 2 跳
    const lgF='700 11px '+SANS, lgS=11;
    const lgItems=['第 0 跳','第 1 跳','第 2 跳'];
    let lx=w-PAD; const lgPos=[];
    for(let j=2;j>=0;j--){ const iw=lgS+5+tw(lgItems[j],lgF); lx-=iw; lgPos[j]=lx; lx-=12; }
    for(let j=0;j<3;j++){
      rr(lgPos[j], B1-lgS+1, lgS, lgS, 2); ctx.fillStyle=LAYER[j].bg; ctx.fill(); ctx.lineWidth=1; ctx.strokeStyle=C.ink; ctx.stroke();
      txt(lgItems[j], lgPos[j]+lgS+5, B1, lgF, LAYER[j].tx);
    }
    const t1='BAND 1 · nums   顏色 = 第幾跳到得了   紅 = 目前 i';
    txt(t1, PAD, B1, fitFont(t1, lgPos[0]-PAD-16, '600', [11.5,11,10.5,10], MONO), C.dim);
    txt('nums', tagX, by+bh/2+1, '700 13px '+MONO, C.ink, 'center', 'middle');
    const onPath = k => done && ex.path.indexOf(k)>=0;
    for(let k=0;k<N;k++){
      const x=cx(k), isCur=k===cur, ly=layerOf(k);
      let st={bg:C.cell, bd:C.ink, tx:C.ink, lw:1.4};
      if(ly>=0) st={bg:LAYER[ly].bg, bd:C.ink, tx:C.ink, lw:1.4};
      if(ly===newL && newL>=0) st={bg:LAYER[ly].bg, bd:LAYER[ly].tx, tx:LAYER[ly].tx, lw:2.6};
      if(ly<0 && pend(k)) st={bg:C.cell, bd:C.red2, tx:C.red2, lw:1.8, dash:true};
      if(onPath(k)) st={bg:st.bg, bd:C.red2, tx:C.red2, lw:2.6};
      if(isCur) st={bg:C.redBg, bd:C.red, tx:C.redT, lw:2.8};
      let hs=String(k), hc=C.dim;
      if(isCur){ hs='i='+k; hc=C.redT; }
      else if(onPath(k)){ hs = k===0 ? '0 · 起點' : (k===N-1 ? k+' · 終點' : k+' · 跳板'); hc=C.red2; }
      else if(ly===newL && newL>=0){ hs=k+' · 新'; hc=LAYER[ly].tx; }
      txt(hs, x+cw/2, by-18, fitFont(hs, cw+cg-4, '700', [11,10.5,10,9.5], MONO), hc, 'center', 'middle');
      cellBox(x,by,cw,bh,st,A[k],'700 18px '+MONO);
    }
    // 層括號
    function bracket(a,b,color,label,dash,lw){
      const x1=cx(a)+3, x2=endX(b)-3;
      ctx.beginPath(); ctx.moveTo(x1,bkY-5); ctx.lineTo(x1,bkY); ctx.lineTo(x2,bkY); ctx.lineTo(x2,bkY-5);
      ctx.lineWidth=lw||1.6; ctx.strokeStyle=color; ctx.setLineDash(dash?[4,3]:[]); ctx.stroke(); ctx.setLineDash([]);
      txt(label, (x1+x2)/2, bkT, fitFont(label, x2-x1+cg, '700', [11,10.5,10], SANS), color, 'center', 'middle');
    }
    for(let j=0;j<nL;j++){ const g=ex.layers[j]; bracket(g[0], g[1], LAYER[j].tx, '第 '+j+' 跳', false, j===newL?2.4:1.6); }
    if(s.na>s.ca){ bracket(s.ca+1, s.na, C.red2, '下一層候選', true, 1.6); }

    /* ---------- BAND 2 · 範圍軌道 ---------- */
    const B2=196, ly=218, ty=268, th=22, ay=ty-4, r1=ty+th+22, r2=r1+32, dy=r2+24, dh=34;
    txt('BAND 2 · 範圍', PAD, B2, '700 12px '+SANS, C.ink);
    const t2x=PAD+tw('BAND 2 · 範圍','700 12px '+SANS)+16;
    const t2='實線 = curEnd   紅虛線 = nextEnd   弧 = i → i + nums[i]';
    txt(t2, t2x, B2, fitFont(t2, w-PAD-t2x, '600', [11.5,11,10.5,10], MONO), C.dim);
    txt('range', tagX, ty+th/2+1, '700 12px '+MONO, C.ink, 'center', 'middle');
    txt('max', tagX, dy+dh/2+1, '700 12px '+MONO, C.ink, 'center', 'middle');

    // 軌道底
    rr(L, ty, R-L, th, 5); ctx.setLineDash([4,3]); ctx.lineWidth=1; ctx.strokeStyle=C.off; ctx.stroke(); ctx.setLineDash([]);
    // 已確定的層(依層上色)
    for(let j=0;j<nL;j++){ const g=ex.layers[j]; rr(cx(g[0]), ty, endX(g[1])-cx(g[0]), th, 5); ctx.fillStyle=LAYER[j].bg; ctx.fill();
      ctx.lineWidth=j===newL?2.2:1.2; ctx.strokeStyle=j===newL?LAYER[j].tx:C.ink; ctx.stroke(); }
    // 下一層候選 (curEnd, nextEnd]
    if(s.na>s.ca){ const px=cx(s.ca+1), pw=endX(s.na)-px; rr(px, ty, pw, th, 5); ctx.fillStyle=C.redBg; ctx.fill();
      ctx.setLineDash([4,3]); ctx.lineWidth=1.6; ctx.strokeStyle=C.red2; ctx.stroke(); ctx.setLineDash([]);
      const pl='下一層', pf='700 11px '+SANS; if(tw(pl,pf)<pw-10) txt(pl, px+pw/2, ty+th/2+1, pf, C.red2, 'center', 'middle'); }

    // 標記:curEnd(實線)/ nextEnd(紅虛線)
    const xc=endX(s.ca), xn=endX(s.na)+(s.na===s.ca?4:0);
    const pf='700 11.5px '+MONO;
    if(!done || s.ex===1){
      if(iter && s.ev && s.cb!==s.ca) vline(endX(s.cb), ty-6, ty+th+6, C.dim, 1.4, [3,3]);   // 舊 curEnd
      vline(xn, ty-8, r2-10, C.red, 2.2, [5,4]);
      vline(xc, ty-8, r1-10, C.ink, 2.6);
      const cs = (iter && s.cb!==s.ca ? 'curEnd = '+s.cb+' → '+s.ca : 'curEnd = '+s.ca) + (done ? ' · 終點在這一層' : ' · 這一層的盡頭');
      const ns = (iter && s.nb!==s.na ? 'nextEnd = '+s.nb+' → '+s.na : 'nextEnd = '+s.na) + ' · 再跳一次最遠';
      pill(xc, r1, cs, fitFont(cs, R-L-20, '700', [11.5,11,10.5], MONO), C.cell, C.ink, C.ink, 1.6, false, PAD, w-PAD);
      pill(xn, r2, ns, fitFont(ns, R-L-20, '700', [11.5,11,10.5], MONO), C.cell, C.red, C.redT, 1.6, true, PAD, w-PAD);
    } else {
      vline(xc, ty-8, ty+th+6, C.ink, 2.6);
    }

    // 弧線
    function arcLabel(s2, cxp, color, y){
      const f=fitFont(s2, w-2*PAD, '700', [12,11.5,11,10.5], MONO), lw2=tw(s2,f);
      const x=Math.max(PAD+lw2/2, Math.min(w-PAD-lw2/2, cxp));
      txt(s2, x, y===undefined?ly:y, f, color, 'center', 'middle');
    }
    const hOf=(x1,x2)=>Math.min(28, 12+Math.abs(x2-x1)*0.07);
    if(iter){
      const t=s.i+A[s.i], grow=s.na>s.nb, x1a=mid(s.i), x2a=mid(t);
      arc(x1a, x2a, ay, hOf(x1a,x2a), grow?C.red:C.dim, grow?2.4:1.8, !grow);
      let lab='i + nums[i] = '+s.i+' + '+A[s.i]+' = '+t;
      if(s.ex===5 && s.i===3) lab+='   起點 3 在第 1 層中間';
      else if(!grow) lab+='   沒超過 '+s.nb;
      arcLabel(lab, (x1a+x2a)/2, grow?C.redT:C.ink);
    } else if(done){
      const P=ex.path;
      for(let j=0;j+1<P.length;j++){ const a=mid(P[j]), b=mid(P[j+1]); arc(a, b, ay, hOf(a,b), C.red2, 2.4, false); }
      arcLabel('最少 '+(P.length-1)+' 跳:'+P.join(' → ')+'   (第 0 → 1 → 2 跳的層)', (L+R)/2, C.red2);
      if(ex.far){   // 對照:每次跳到最遠那格
        const F=ex.far, yb=ty+th+4;
        for(let j=0;j+1<F.length;j++){ const a=mid(F[j]), b=mid(F[j+1]); arc(a, b, yb, -Math.min(20, hOf(a,b)), C.dim, 1.8, true); }
        arcLabel('對照 · 每次跳最遠 '+F.join(' → ')+' = '+(F.length-1)+' 跳 ✗', (L+R)/2, C.dim, r2);
      }
    } else {
      arcLabel('第 0 層 = {0}:不用跳就站在起點', (L+R)/2, C.dim);
    }

    // max 決策盒
    let dl, dbg=C.cell, dbd=C.ink, dtx=C.ink, dlw=1.2;
    if(init){ dl='nextEnd = 0   (還沒看任何一格)'; dtx=C.dim; }
    else if(iter){
      const up=s.na>s.nb;
      dl='nextEnd = max('+s.nb+', '+s.i+'+'+A[s.i]+') = '+s.na+(up?'  ↑ 變遠':'  不變');
      if(s.ex===5 && s.i===3) dl+='   不用決定從哪跳,只記最遠';
      if(up){ dbg=C.redBg; dbd=C.red; dtx=C.redT; dlw=2; }
    } else {
      dl='迴圈只跑 i < n−1 = '+(N-1)+' · 站在終點不用再跳';
      dbg=C.cell; dbd=C.ink; dtx=C.ink;
    }
    rr(L, dy, R-L, dh, 6); ctx.fillStyle=dbg; ctx.fill(); ctx.lineWidth=dlw; ctx.strokeStyle=dbd; ctx.stroke();
    txt(dl, (L+R)/2, dy+dh/2+1, fitFont(dl, R-L-20, '700', [13,12.5,12,11.5,11,10.5], MONO), dtx, 'center', 'middle');

    /* ---------- BAND 3 · 邊界事件 + step ---------- */
    const B3=dy+dh+26, cy=B3+16, ch=50;
    txt('BAND 3 · 邊界', PAD, B3, '700 12px '+SANS, C.ink);
    const t3x=PAD+tw('BAND 3 · 邊界','700 12px '+SANS)+16;
    const t3='if (curEnd == i) { step++; curEnd = nextEnd; }';
    txt(t3, t3x, B3, fitFont(t3, w-PAD-t3x, '600', [11.5,11,10.5,10], MONO), C.dim);
    txt('step', tagX, cy+ch/2+1, '700 12px '+MONO, C.ink, 'center', 'middle');
    const chipW=Math.max(118, Math.min(170, colW*1.5)), chipX=R-chipW, boxR=chipX-14;
    let l1, l2, cbg=C.cell, cbd=C.ink, ctx2=C.ink, c2=C.dim, clw=1.2;
    let k1='step = '+s.sa, k2='', kbg=C.cell, kbd=C.ink, ktx=C.ink, klw=1.6;
    if(init){ l1='step = 0 · curEnd = 0 · nextEnd = 0'; l2='第 0 層 = {0}:還沒跳'; c2=C.dim; k2='還沒跳'; }
    else if(iter && s.ev){
      l1='i == curEnd ('+s.i+' == '+s.cb+') → 這一層看完了';
      const g=ex.layers[s.sa];
      l2='step++ ('+s.sb+'→'+s.sa+') · curEnd = nextEnd = '+s.ca+' · 第 '+s.sa+' 層 ['+g[0]+'..'+g[1]+']';
      cbg=C.redBg; cbd=C.red; ctx2=C.redT; c2=C.redT; clw=2.2;
      k2=s.sb+' → '+s.sa+'  (+1)'; kbg=C.redBg; kbd=C.red; ktx=C.redT; klw=2.4;
    } else if(iter){
      l1='i < curEnd ('+s.i+' < '+s.cb+') → 這一層還沒看完';
      l2 = (s.ex===5 && s.i===3) ? '繼續收集 nextEnd · 不用現在決定從 3 跳' : '繼續收集 nextEnd · step 不變';
      c2=C.ink; k2='不變';
    } else {
      const G=ex.layers;
      l1='第 0 跳 ['+G[0][0]+'] · 第 1 跳 ['+G[1][0]+'..'+G[1][1]+'] · 第 2 跳 ['+G[2][0]+'..'+G[2][1]+']';
      l2='終點 '+(N-1)+' 在第 2 層 → return step = 2';
      cbg=C.good; cbd=C.goodT; ctx2=C.goodT; c2=C.goodT; clw=2.2;
      k1='return 2'; k2='✓ 最少跳數'; kbg=C.good; kbd=C.goodT; ktx=C.goodT; klw=2.4;
    }
    rr(L, cy, boxR-L, ch, 6); ctx.fillStyle=cbg; ctx.fill(); ctx.lineWidth=clw; ctx.strokeStyle=cbd; ctx.stroke();
    txt(l1, L+12, cy+16, fitFont(l1, boxR-L-24, '700', [13,12.5,12,11.5,11,10.5], MONO), ctx2, 'left', 'middle');
    txt(l2, L+12, cy+35, fitFont(l2, boxR-L-24, '600', [12,11.5,11,10.5,10], MONO), c2, 'left', 'middle');
    rr(chipX, cy, chipW, ch, 10); ctx.fillStyle=kbg; ctx.fill(); ctx.lineWidth=klw; ctx.strokeStyle=kbd; ctx.stroke();
    txt(k1, chipX+chipW/2, cy+19, fitFont(k1, chipW-16, '700', [17,16,15,14], MONO), ktx, 'center', 'middle');
    txt(k2, chipX+chipW/2, cy+38, fitFont(k2, chipW-16, '600', [11,10.5,10], MONO), ktx===C.ink?C.dim:ktx, 'center', 'middle');
  }

  function update(){ if(stepEl) stepEl.textContent=String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0'); if(labelEl) labelEl.innerHTML=steps[step].text; draw(); }
  function next(){ if(step<steps.length-1){step++;update();}else stop(); }
  function prev(){ if(step>0){step--;update();} }
  function reset(){ stop(); step=0; update(); }
  function play(){ if(timer){stop();return;} bPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){stop();return;} next(); },2000); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} if(bPlay) bPlay.textContent='Play'; }
  bPrev&&bPrev.addEventListener('click',prev); bNext&&bNext.addEventListener('click',next); bPlay&&bPlay.addEventListener('click',play); bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();}); if(window.ResizeObserver){ new ResizeObserver(()=>{fit();draw();}).observe(canvas); }
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw); fit(); update();
})();
