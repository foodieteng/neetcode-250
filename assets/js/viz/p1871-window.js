/* ============================================================
   P1871 · Jump Game VII — 滑動窗口計數 cnt · viz
     for (i = minJump; i < n; i++) {
       if (dp[i − minJump]) ++cnt;                               ① 窗口右端進來一格
       if (i − maxJump − 1 >= 0 && dp[i − maxJump − 1]) −−cnt;  ② 窗口左端掉出去一格
       dp[i] = (cnt > 0 && s[i] == '0');                         ③ 窗口裡有人到得了 且 自己是 '0'
     }
   cnt = 窗口 [i − maxJump, i − minJump] 裡 dp 為真的格數 = 能跳到 i 的格子。
   範例 1 "011010" (2,3) → true ;範例 2 "01101110" (2,3) → false
     BAND 0  目前是哪個範例
     BAND 1  s / dp 兩列(紅 = 目前 i · 藍框 = 窗口 · + 進 / − 出 膠囊)
     BAND 2  ① ② 更新 cnt
     BAND 3  ③ 決定 dp[i]
   所有數字取自實測 trace(fact sheet Trace 段)。
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
  const WIN = '#2c5577';   // 窗口框 / 字(同 p45 藍層文字色)
  const MONO = '"JetBrains Mono", "Noto Sans TC", monospace', SANS = '"Noto Sans TC", sans-serif';

  const EX = {
    1: { s:'011010',   mn:2, mx:3, name:'範例 1', ans:true,  dp:[1,0,0,1,0,1],       path:[0,3,5] },
    2: { s:'01101110', mn:2, mx:3, name:'範例 2', ans:false, dp:[1,0,0,1,0,0,0,0],   run:[4,6] },
  };

  /* trace(fact sheet):ad = i−minJump(dp av,ae = cnt++);rm = i−maxJump−1(dp rv,re = cnt−−;null = none)
     cb = 本步前 cnt,ca = 本步後 cnt,win = [a,b],d = dp[i] */
  const S = [
    { ex:1, kind:'init', ca:0 },
    { ex:1, kind:'iter', i:2, ad:0, av:1, ae:true,  rm:null,        cb:0, ca:1, win:[0,0], d:0 },
    { ex:1, kind:'iter', i:3, ad:1, av:0, ae:false, rm:null,        cb:1, ca:1, win:[0,1], d:1 },
    { ex:1, kind:'iter', i:4, ad:2, av:0, ae:false, rm:0, rv:1, re:true,  cb:1, ca:0, win:[1,2], d:0 },
    { ex:1, kind:'iter', i:5, ad:3, av:1, ae:true,  rm:1, rv:0, re:false, cb:0, ca:1, win:[2,3], d:1 },
    { ex:1, kind:'done', ca:1 },
    { ex:2, kind:'init', ca:0 },
    { ex:2, kind:'iter', i:2, ad:0, av:1, ae:true,  rm:null,        cb:0, ca:1, win:[0,0], d:0 },
    { ex:2, kind:'iter', i:3, ad:1, av:0, ae:false, rm:null,        cb:1, ca:1, win:[0,1], d:1 },
    { ex:2, kind:'iter', i:4, ad:2, av:0, ae:false, rm:0, rv:1, re:true,  cb:1, ca:0, win:[1,2], d:0 },
    { ex:2, kind:'iter', i:5, ad:3, av:1, ae:true,  rm:1, rv:0, re:false, cb:0, ca:1, win:[2,3], d:0 },
    { ex:2, kind:'iter', i:6, ad:4, av:0, ae:false, rm:2, rv:0, re:false, cb:1, ca:1, win:[3,4], d:0 },
    { ex:2, kind:'iter', i:7, ad:5, av:0, ae:false, rm:3, rv:1, re:true,  cb:1, ca:0, win:[4,5], d:0 },
    { ex:2, kind:'done', ca:0 },
  ];

  const steps = [
    { text:'<strong>INITIAL · 範例 1</strong> · <code>s = "011010"</code>,<code>minJump = 2, maxJump = 3</code>。<code>dp[k]</code> = 能不能站到 k,起點 <code>dp[0] = true</code>。能跳到 <code>i</code> 的格子是<b>窗口 <code>[i−maxJump, i−minJump]</code></b>,<code>cnt</code> 記窗口裡有幾個 <code>dp</code> 為真。<code>dp[1]</code> 比 minJump 還近,迴圈不碰它,一直是 false;迴圈從 <code>i = minJump = 2</code> 開始。' },
    { text:'<code>i=2</code>:窗口 <code>[0, 0]</code>。① 進來 <code>dp[0] = T</code> → <code>cnt++</code>,<code>0 → 1</code>。② <code>i−maxJump−1 = −1 &lt; 0</code>,沒有格子掉出。③ <code>cnt &gt; 0</code> 但 <code>s[2] = \'1\'</code> 是牆 → <code>dp[2] = false</code>:<b>跳得到,但站不上去</b>。' },
    { text:'<code>i=3</code>:窗口 <code>[0, 1]</code>。① 進來 <code>dp[1] = F</code> → 不加,<code>cnt</code> 仍是 1。② 還是沒有格子掉出。③ <code>cnt = 1 &gt; 0</code> 且 <code>s[3] = \'0\'</code> → <code>dp[3] = true</code>(從 0 跳 3 步)。' },
    { text:'<code>i=4</code>:窗口滑到 <code>[1, 2]</code>。① 進來 <code>dp[2] = F</code> → 不加。② <b>掉出去 <code>dp[0] = T</code> → <code>cnt−−</code></b>,<code>1 → 0</code>:index 0 離 4 有 4 步,超過 maxJump。③ <code>cnt = 0</code> → <code>dp[4] = false</code>(<code>s[4]</code> 也是 \'1\')。' },
    { text:'<code>i=5</code>:窗口 <code>[2, 3]</code>。① <b>進來 <code>dp[3] = T</code> → <code>cnt++</code></b>,<code>0 → 1</code>。② 掉出 <code>dp[1] = F</code> → 不減。③ <code>cnt = 1 &gt; 0</code> 且 <code>s[5] = \'0\'</code> → <code>dp[5] = true</code>(從 3 跳 2 步)。' },
    { text:'<strong>範例 1 結果</strong> · <code>dp = [T,F,F,T,F,T]</code> → <code>return dp[5] = true</code> ✓,路線 0 → 3 → 5。每一格只<b>進窗口一次、出窗口一次</b>,<code>cnt</code> 每步 O(1) 更新,整體 <code>O(n)</code>;不用每個 i 都把 <code>[i−max, i−min]</code> 掃一遍。' },
    { text:'<strong>INITIAL · 範例 2</strong> · <code>s = "01101110"</code>,<code>minJump = 2, maxJump = 3</code>。同樣 <code>dp[0] = true, cnt = 0</code>,從 <code>i = 2</code> 開始。注意 index 4..6 是<b>連續三個 \'1\'</b>,長度剛好等於 maxJump —— 看 cnt 怎麼在終點前歸零。' },
    { text:'<code>i=2</code>:窗口 <code>[0, 0]</code>。① 進來 <code>dp[0] = T</code> → <code>cnt++</code>,<code>0 → 1</code>。② 沒有格子掉出。③ <code>s[2] = \'1\'</code> → <code>dp[2] = false</code>。' },
    { text:'<code>i=3</code>:窗口 <code>[0, 1]</code>。① 進來 <code>dp[1] = F</code> → 不加,<code>cnt = 1</code>。② 沒有格子掉出。③ <code>cnt &gt; 0</code> 且 <code>s[3] = \'0\'</code> → <code>dp[3] = true</code>。' },
    { text:'<code>i=4</code>:窗口 <code>[1, 2]</code>。① 進來 <code>dp[2] = F</code> → 不加。② <b>掉出 <code>dp[0] = T</code> → <code>cnt−−</code></b>,<code>1 → 0</code>。③ <code>cnt = 0</code> → <code>dp[4] = false</code>。' },
    { text:'<code>i=5</code>:窗口 <code>[2, 3]</code>。① <b>進來 <code>dp[3] = T</code> → <code>cnt++</code></b>,<code>0 → 1</code>。② 掉出 <code>dp[1] = F</code> → 不減。③ <code>cnt = 1 &gt; 0</code> ✓ 但 <code>s[5] = \'1\'</code> × → <code>dp[5] = false</code>:<b>兩個條件缺一不可</b>。' },
    { text:'<code>i=6</code>:窗口 <code>[3, 4]</code>。① 進來 <code>dp[4] = F</code> → 不加。② 掉出 <code>dp[2] = F</code> → 不減。<code>cnt</code> 還是 1(那個 T 是 index 3)。③ <code>s[6] = \'1\'</code> → <code>dp[6] = false</code>。' },
    { text:'<code>i=7</code>:窗口 <code>[4, 5]</code>。① 進來 <code>dp[5] = F</code> → 不加。② <b>掉出 <code>dp[3] = T</code> → <code>cnt−−</code></b>,<code>1 → 0</code>:唯一的跳板 3 離 7 有 4 步,太遠了。③ <code>cnt = 0</code> → <code>dp[7] = false</code>,雖然 <code>s[7] = \'0\'</code>。' },
    { text:'<strong>範例 2 結果</strong> · <code>dp = [T,F,F,T,F,F,F,F]</code> → <code>return dp[7] = false</code> ✓。從 3 最遠只到 6,而 4..6 全是 \'1\':<b>連續 \'1\' 長度 ≥ maxJump 就跳不過去</b>,窗口滑過去之後裡面一個 T 都沒有。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||440; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function txt(s,x,y,font,color,align,base){ ctx.font=font; ctx.fillStyle=color; ctx.textAlign=align||'left'; ctx.textBaseline=base||'alphabetic'; ctx.fillText(s,x,y); }
  function tw(s,font){ ctx.font=font; return ctx.measureText(s).width; }
  function fitFont(s, maxW, weight, sizes, fam){ for(const z of sizes){ const f=weight+' '+z+'px '+fam; if(tw(s,f)<=maxW) return f; } return weight+' '+sizes[sizes.length-1]+'px '+fam; }
  function cellBox(x,y,cw,ch,st,val,font){
    rr(x,y,cw,ch,5); ctx.fillStyle=st.bg; ctx.fill();
    if(st.hatch){   // s = '1':斜線 = 牆
      ctx.save(); rr(x,y,cw,ch,5); ctx.clip(); ctx.beginPath();
      for(let d=-ch; d<cw; d+=9){ ctx.moveTo(x+d, y+ch); ctx.lineTo(x+d+ch, y); }
      ctx.lineWidth=1; ctx.strokeStyle=C.off; ctx.stroke(); ctx.restore();
      rr(x,y,cw,ch,5);
    }
    ctx.setLineDash(st.dash?[4,3]:[]); ctx.lineWidth=st.lw||1.4; ctx.strokeStyle=st.bd; ctx.stroke(); ctx.setLineDash([]);
    if(val!==null && val!==undefined){
      if(st.hatch){ const f=font, vw=tw(String(val),f)+10; ctx.fillStyle=C.paper; rr(x+cw/2-vw/2, y+ch/2-11, vw, 22, 4); ctx.fill(); }
      txt(String(val), x+cw/2, y+ch/2+1, font, st.tx, 'center', 'middle');
    }
  }
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
  const TF = v => v ? 'T' : 'F';

  function draw(){
    fit();
    const w=canvas.clientWidth, h=canvas.clientHeight, PAD=22;
    ctx.fillStyle=C.paper; ctx.fillRect(0,0,w,h); ctx.setLineDash([]);
    const s=S[step], ex=EX[s.ex], STR=ex.s, N=STR.length, DP=ex.dp, MN=ex.mn, MX=ex.mx;
    const iter = s.kind==='iter', done = s.kind==='done', init = s.kind==='init';
    const cur = iter ? s.i : -1;
    const known = k => k===0 || k<MN || done || (iter && k<=s.i);   // 這一步結束時 dp[k] 已確定

    const X0=PAD+52, XR=w-PAD, colW=(XR-X0)/N, cg=Math.min(14, colW*0.16), cw=colW-cg;
    const cx=k=>X0+k*colW+cg/2, mid=k=>cx(k)+cw/2, endX=k=>cx(k)+cw;
    const L=cx(0), R=endX(N-1);
    const tagX=PAD+24;

    /* ---------- BAND 0 · 哪個範例 ---------- */
    const tabF='700 11.5px '+SANS, tabH=20, tabY=6;
    const pw1=tw(EX[1].name,tabF)+22, pw2=tw(EX[2].name,tabF)+22;
    const x2=w-PAD-pw2, x1=x2-8-pw1;
    for(const [e,x,pw] of [[1,x1,pw1],[2,x2,pw2]]){
      const on=e===s.ex;
      rr(x, tabY, pw, tabH, 10); ctx.fillStyle=on?C.ink:C.cell; ctx.fill();
      ctx.lineWidth=1.2; ctx.strokeStyle=on?C.ink:C.off; ctx.stroke();
      txt(EX[e].name, x+pw/2, tabY+tabH/2+1, tabF, on?C.paper:C.dim, 'center', 'middle');
    }
    const t0='BAND 0 · '+ex.name+'   s = "'+STR+'"   minJump = '+MN+'  maxJump = '+MX+'   預期 → '+ex.ans;
    txt(t0, PAD, 20, fitFont(t0, x1-PAD-16, '700', [12.5,12,11.5,11,10.5,10], MONO), C.ink);

    /* ---------- BAND 1 · s / dp ---------- */
    const B1=50, sTop=94, rh=40, sBot=sTop+rh, gapY=155, dTop=182, dBot=dTop+rh, chipY=254;
    // 圖例
    const lgF='700 11px '+SANS, lgS=11;
    const lg=[ ['dp = T',C.good,C.ink,false], ['窗口',C.tint,WIN,false], ['未算',C.cell,C.off,true] ];
    let lx=w-PAD; const lgPos=[];
    for(let j=lg.length-1;j>=0;j--){ const iw=lgS+5+tw(lg[j][0],lgF); lx-=iw; lgPos[j]=lx; lx-=12; }
    for(let j=0;j<lg.length;j++){
      rr(lgPos[j], B1-lgS+1, lgS, lgS, 2); ctx.fillStyle=lg[j][1]; ctx.fill();
      ctx.setLineDash(lg[j][3]?[3,2]:[]); ctx.lineWidth=1.2; ctx.strokeStyle=lg[j][2]; ctx.stroke(); ctx.setLineDash([]);
      txt(lg[j][0], lgPos[j]+lgS+5, B1, lgF, C.ink);
    }
    const t1='BAND 1 · s / dp   紅 = 目前 i   斜線 = 牆 \'1\'';
    txt(t1, PAD, B1, fitFont(t1, lgPos[0]-PAD-16, '600', [11.5,11,10.5,10], MONO), C.dim);
    txt('s',  tagX, sTop+rh/2+1, '700 14px '+MONO, C.ink, 'center', 'middle');
    txt('dp', tagX, dTop+rh/2+1, '700 14px '+MONO, C.ink, 'center', 'middle');

    const W0 = iter ? s.win : null;
    const inWin = k => W0 && k>=W0[0] && k<=W0[1];
    const vF='700 18px '+MONO;

    // index 行 + s 列
    for(let k=0;k<N;k++){
      const x=cx(k), isCur=k===cur, wall=STR[k]==='1';
      let hs=String(k), hc=inWin(k)?WIN:C.dim;
      if(isCur){ hs='i='+k; hc=C.redT; }
      txt(hs, x+cw/2, sTop-18, fitFont(hs, cw+cg-4, '700', [11.5,11,10.5,10], MONO), hc, 'center', 'middle');
      let st = wall ? {bg:C.cell, bd:C.off, tx:C.dim, lw:1.4, hatch:true} : {bg:C.cell, bd:C.ink, tx:C.ink, lw:1.4};
      if(isCur) st={bg:C.redBg, bd:C.red, tx:C.redT, lw:2.8};
      cellBox(x, sTop, cw, rh, st, STR[k], vF);
    }

    // 窗口框(在 dp 列後面)
    const ext=Math.min(6, cg/2-1);
    if(W0){
      const wx=cx(W0[0])-ext, ww=endX(W0[1])-cx(W0[0])+2*ext;
      rr(wx, dTop-7, ww, rh+14, 8); ctx.fillStyle=C.tint; ctx.fill(); ctx.lineWidth=1.8; ctx.strokeStyle=WIN; ctx.stroke();
    }
    if(done && ex.run){   // 範例 2 結果:連續 '1' 的括號(s 列下方)
      const a=ex.run[0], b=ex.run[1], bx1=cx(a)+3, bx2=endX(b)-3, by=sBot+8;
      ctx.beginPath(); ctx.moveTo(bx1,by-4); ctx.lineTo(bx1,by); ctx.lineTo(bx2,by); ctx.lineTo(bx2,by-4);
      ctx.lineWidth=1.8; ctx.strokeStyle=C.red2; ctx.stroke();
    }

    // dp 列
    for(let k=0;k<N;k++){
      const x=cx(k), isCur=k===cur;
      let st, val=null;
      if(known(k)){
        val=TF(DP[k]);
        st = DP[k] ? {bg:C.good, bd:C.ink, tx:C.goodT, lw:1.4} : {bg:C.cell, bd:C.ink, tx:C.dim, lw:1.4};
        if(inWin(k) && !DP[k]) st={bg:C.tint, bd:WIN, tx:WIN, lw:1.4};
        if(inWin(k) && DP[k])  st={bg:C.good, bd:WIN, tx:C.goodT, lw:2};
      } else st={bg:C.cell, bd:C.off, tx:C.dim, lw:1.4, dash:true};
      if(isCur) st={bg:C.redBg, bd:C.red, tx:C.redT, lw:2.8};
      if(done && k===N-1) st = DP[k] ? {bg:C.good, bd:C.goodT, tx:C.goodT, lw:2.8} : {bg:C.bad, bd:C.red2, tx:C.red2, lw:2.8};
      cellBox(x, dTop, cw, rh, st, val, vF);
    }

    // 窗口標籤 + 「跳到 i」箭頭(s 與 dp 之間)
    const glF='700 11.5px '+SANS;
    if(W0){
      const wl='窗口 ['+W0[0]+', '+W0[1]+']', wlw=tw(wl,glF);
      const wc=(cx(W0[0])+endX(W0[1]))/2;
      let lxl=Math.max(L, wc-wlw/2);
      txt(wl, lxl, gapY, glF, WIN, 'left', 'middle');
      const ax1=Math.max(endX(W0[1])+ext+4, lxl+wlw+10), ax2=mid(cur);
      if(ax2-ax1>18){
        ctx.beginPath(); ctx.moveTo(ax1, gapY); ctx.lineTo(ax2, gapY); ctx.lineTo(ax2, dTop-12);
        ctx.lineWidth=1.6; ctx.strokeStyle=C.red; ctx.setLineDash([4,3]); ctx.stroke(); ctx.setLineDash([]);
        head(ax2, dTop-5, Math.PI/2, C.red, 8);
      }
    } else if(init){
      const gl='迴圈從 i = minJump = '+MN+' 開始', gw=tw(gl,glF);
      const gx=Math.max(L, Math.min(R-gw, mid(MN)-gw/2));
      txt(gl, gx, gapY, glF, C.dim, 'left', 'middle');
      if(mid(MN)>gx && mid(MN)<gx+gw){} // 文字正好在 i=minJump 上方
    } else if(done){
      const gl = ex.ans ? 'return dp['+(N-1)+'] = T   路線 '+ex.path.join(' → ')
                        : '連續 \'1\' × '+(ex.run[1]-ex.run[0]+1)+' ≥ maxJump → return dp['+(N-1)+'] = F';
      const f=fitFont(gl, R-L, '700', [11.5,11,10.5], SANS), gw=tw(gl,f);
      const cxp = ex.run ? (cx(ex.run[0])+endX(ex.run[1]))/2 : (L+R)/2;
      txt(gl, Math.max(L, Math.min(R-gw, cxp-gw/2)), gapY+4, f, ex.ans?C.goodT:C.red2, 'left', 'middle');
    }

    // + 進 / − 出 膠囊(dp 列下方)
    const chF='700 11px '+MONO;
    function chip(k, label, eff, kind){
      const top=dBot+(inWin(k)?7:0);
      vline(mid(k), top+2, chipY-12, eff?(kind==='+'?C.goodT:C.red):C.off, eff?1.8:1.2, eff?[]:[3,3]);
      if(eff) pill(mid(k), chipY, label, chF, kind==='+'?C.good:C.redBg, kind==='+'?C.goodT:C.red, kind==='+'?C.goodT:C.redT, 1.8, false, PAD, w-PAD);
      else    pill(mid(k), chipY, label, chF, C.cell, C.off, C.dim, 1.2, true, PAD, w-PAD);
    }
    if(iter){
      chip(s.ad, s.ae ? '+ 進 · cnt+1' : '進 '+TF(s.av)+' · 不加', s.ae, '+');
      if(s.rm!==null) chip(s.rm, s.re ? '− 出 · cnt−1' : '出 '+TF(s.rv)+' · 不減', s.re, '−');
    } else if(init){
      for(let k=1;k<MN;k++){ vline(mid(k), dBot+2, chipY-12, C.off, 1.2, [3,3]); pill(mid(k), chipY, '< minJump · 永遠 F', chF, C.cell, C.off, C.dim, 1.2, true, PAD, w-PAD); }
    } else if(done && ex.path){
      const P=ex.path;
      for(let j=0;j+1<P.length;j++){ const a=mid(P[j]), b=mid(P[j+1]); arc(a, b, dBot+6, -18, C.goodT, 2.2, false); }
    }

    /* ---------- BAND 2 · ① ② 更新 cnt ---------- */
    const B2=292, by2=304, bh2=54;
    txt('BAND 2 · cnt', PAD, B2, '700 12px '+SANS, C.ink);
    const t2x=PAD+tw('BAND 2 · cnt','700 12px '+SANS)+16;
    const t2='= 窗口 [i−maxJump, i−minJump] 裡 dp 為 T 的格數';
    txt(t2, t2x, B2, fitFont(t2, w-PAD-t2x, '600', [11.5,11,10.5,10], MONO), C.dim);
    txt('cnt', tagX, by2+bh2/2+1, '700 13px '+MONO, C.ink, 'center', 'middle');
    const kW=Math.max(130, Math.min(180, colW*1.6)), kX=L, bx=kX+kW+14;
    const changed = iter && s.cb!==s.ca;
    let k2;
    if(iter) k2 = changed ? s.cb+' → '+s.ca+'  ('+(s.ca>s.cb?'+1':'−1')+')' : s.cb+' → '+s.ca+'  不變';
    else if(init) k2='還沒有格子進窗口';
    else k2='迴圈結束';
    rr(kX, by2, kW, bh2, 10); ctx.fillStyle=changed?C.redBg:C.cell; ctx.fill(); ctx.lineWidth=changed?2.4:1.6; ctx.strokeStyle=changed?C.red:C.ink; ctx.stroke();
    const k1='cnt = '+s.ca;
    txt(k1, kX+kW/2, by2+21, fitFont(k1, kW-16, '700', [19,18,17,16], MONO), changed?C.redT:C.ink, 'center', 'middle');
    txt(k2, kX+kW/2, by2+41, fitFont(k2, kW-14, '600', [11.5,11,10.5,10], MONO), changed?C.redT:C.dim, 'center', 'middle');

    let l1, l2, c1=C.ink, c2=C.ink;
    if(iter){
      l1 = s.ae ? '① 進 dp['+s.i+'−'+MN+'] = dp['+s.ad+'] = T  →  ++cnt'
                : '① 進 dp['+s.i+'−'+MN+'] = dp['+s.ad+'] = F  →  不加';
      c1 = s.ae ? C.goodT : C.dim;
      if(s.rm===null){ l2='② 出 i−maxJump−1 = '+(s.i-MX-1).toString().replace('-','−')+' < 0  →  沒有格子掉出'; c2=C.dim; }
      else { l2 = '② 出 dp['+s.i+'−'+MX+'−1] = dp['+s.rm+'] = '+TF(s.rv)+'  →  '+(s.re?'−−cnt':'不減'); c2 = s.re ? C.redT : C.dim; }
    } else if(init){
      l1='每往右一步:右端進來一格 dp[i−minJump]'; l2='左端掉出一格 dp[i−maxJump−1] → O(1) 更新 cnt'; c1=C.ink; c2=C.dim;
    } else {
      l1='dp = ['+DP.map(TF).join(',')+']'; l2='每格只進一次、出一次 → 整體 O(n)'; c1=C.ink; c2=C.dim;
    }
    rr(bx, by2, R-bx, bh2, 6); ctx.fillStyle=C.cell; ctx.fill(); ctx.lineWidth=1.2; ctx.strokeStyle=C.ink; ctx.stroke();
    txt(l1, bx+12, by2+18, fitFont(l1, R-bx-24, '700', [12.5,12,11.5,11,10.5,10], MONO), c1, 'left', 'middle');
    txt(l2, bx+12, by2+38, fitFont(l2, R-bx-24, '700', [12.5,12,11.5,11,10.5,10], MONO), c2, 'left', 'middle');

    /* ---------- BAND 3 · ③ 決定 dp[i] ---------- */
    const B3=by2+bh2+26, by3=B3+12, bh3=42;
    txt('BAND 3 · dp[i]', PAD, B3, '700 12px '+SANS, C.ink);
    const t3x=PAD+tw('BAND 3 · dp[i]','700 12px '+SANS)+16;
    const t3='dp[i] = (cnt > 0 && s[i] == \'0\')';
    txt(t3, t3x, B3, fitFont(t3, w-PAD-t3x, '600', [11.5,11,10.5,10], MONO), C.dim);
    txt('dp[i]', tagX, by3+bh3/2+1, '700 12px '+MONO, C.ink, 'center', 'middle');
    const rW=kW, rX=R-rW, dR=rX-14;
    let dl, dc=C.ink, r1, rbg=C.cell, rbd=C.ink, rtx=C.ink;
    if(iter){
      const okC=s.ca>0, okS=STR[s.i]==='0';
      dl='③ dp['+s.i+'] = cnt>0 '+(okC?'✓':'×')+'  &&  s['+s.i+']==\'0\' '+(okS?'✓':'×')+'  →  '+TF(s.d);
      r1='dp['+s.i+'] = '+TF(s.d);
      if(s.d){ rbg=C.good; rbd=C.goodT; rtx=C.goodT; }
      else { rbg=C.redBg; rbd=C.red; rtx=C.redT; }
    } else if(init){
      dl='起點 dp[0] = T,其餘待算(初值 F)'; dc=C.dim; r1='dp[0] = T'; rbg=C.good; rbd=C.goodT; rtx=C.goodT;
    } else {
      dl='return dp[n−1] = dp['+(N-1)+'] = '+TF(DP[N-1]);
      r1=ex.ans ? 'true ✓' : 'false';
      if(ex.ans){ rbg=C.good; rbd=C.goodT; rtx=C.goodT; dc=C.goodT; } else { rbg=C.bad; rbd=C.red2; rtx=C.red2; dc=C.red2; }
    }
    rr(L, by3, dR-L, bh3, 6); ctx.fillStyle=C.cell; ctx.fill(); ctx.lineWidth=1.2; ctx.strokeStyle=C.ink; ctx.stroke();
    txt(dl, L+12, by3+bh3/2+1, fitFont(dl, dR-L-24, '700', [13,12.5,12,11.5,11,10.5,10], MONO), dc, 'left', 'middle');
    rr(rX, by3, rW, bh3, 10); ctx.fillStyle=rbg; ctx.fill(); ctx.lineWidth=2.4; ctx.strokeStyle=rbd; ctx.stroke();
    txt(r1, rX+rW/2, by3+bh3/2+1, fitFont(r1, rW-16, '700', [17,16,15,14], MONO), rtx, 'center', 'middle');
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
