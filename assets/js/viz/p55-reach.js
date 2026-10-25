/* ============================================================
   P55 · Jump Game — greedy 最遠可達 farthest · viz
   farthest = 用 index 0..i 能跳到的最遠 index
     if (i > farthest) return false;           ① 先檢查:走得到 i 嗎?
     farthest = max(farthest, i + nums[i]);    ② 再更新:從 i 往右推
   範例 1 [2,3,1,1,4] → true ; 範例 2 [3,2,1,0,4] → false(i=4:4 > 3)
     BAND 0  目前是哪個範例
     BAND 1  nums(紅 = 目前 i · 藍 = 可到達 ≤ farthest · 綠 = 本步新增)
     BAND 2  reach track:可到達範圍 + 本步的 i + nums[i] 弧線 + max 決策
     BAND 3  check:i > farthest ?
   所有數字取自實測 trace(fact sheet T1 / T2)。
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
    1: { nums:[2,3,1,1,4], name:'範例 1', ans:'true' },
    2: { nums:[3,2,1,0,4], name:'範例 2', ans:'false' },
  };
  const N = 5;

  /* trace(fact sheet):fb = 本步檢查前的 farthest;fa = 本步更新後;kind = init / iter / done / fail */
  const S = [
    { ex:1, kind:'init', fa:0 },
    { ex:1, kind:'iter', i:0, fb:0, fa:2 },
    { ex:1, kind:'iter', i:1, fb:2, fa:4 },
    { ex:1, kind:'iter', i:2, fb:4, fa:4 },
    { ex:1, kind:'iter', i:3, fb:4, fa:4 },
    { ex:1, kind:'iter', i:4, fb:4, fa:8 },
    { ex:1, kind:'done', fb:8, fa:8 },
    { ex:2, kind:'init', fa:0 },
    { ex:2, kind:'iter', i:0, fb:0, fa:3 },
    { ex:2, kind:'iter', i:1, fb:3, fa:3 },
    { ex:2, kind:'iter', i:2, fb:3, fa:3 },
    { ex:2, kind:'iter', i:3, fb:3, fa:3 },
    { ex:2, kind:'fail', i:4, fb:3, fa:3 },
  ];

  const steps = [
    { text:'<strong>INITIAL · 範例 1</strong> · <code>nums = [2,3,1,1,4]</code>。<code>farthest = 0</code>:目前只確定站得到起點 index 0。每一輪 <b>① 先檢查</b> <code>i &gt; farthest</code>(連 i 都走不到就失敗),<b>② 再更新</b> <code>farthest = max(farthest, i + nums[i])</code>,把可到達範圍往右推。' },
    { text:'<code>i=0, nums[0]=2</code>:① <code>0 &gt; 0</code>?否,繼續。② <code>farthest = max(0, 0+2) = 2</code> ↑ —— index 1、2 變成<b>可到達</b>。' },
    { text:'<code>i=1, nums[1]=3</code>:① <code>1 &gt; 2</code>?否,繼續。② <code>farthest = max(2, 1+3) = 4</code> ↑ —— 已經涵蓋最後一格 index 4。' },
    { text:'<code>i=2, nums[2]=1</code>:① <code>2 &gt; 4</code>?否,繼續。② <code>farthest = max(4, 2+1) = 4</code> 不變 —— 從 2 只能跳到 3,沒有超過現有範圍。' },
    { text:'<code>i=3, nums[3]=1</code>:① <code>3 &gt; 4</code>?否,繼續。② <code>farthest = max(4, 3+1) = 4</code> 不變。' },
    { text:'<code>i=4, nums[4]=4</code>:① <code>4 &gt; 4</code>?否(相等代表<b>站得到</b>),繼續。② <code>farthest = max(4, 4+4) = 8</code>,跳出陣列右邊也沒關係,只是更遠。' },
    { text:'<strong>範例 1 結果</strong> · 5 輪迴圈跑完,沒有任何一輪 <code>i &gt; farthest</code> —— 每一格都走得到 → <code>return true</code> ✓。' },
    { text:'<strong>INITIAL · 範例 2</strong> · <code>nums = [3,2,1,0,4]</code>。同一個演算法,<code>farthest = 0</code> 從頭來。注意 <code>nums[3] = 0</code>:站在 3 哪裡都去不了。' },
    { text:'<code>i=0, nums[0]=3</code>:① <code>0 &gt; 0</code>?否,繼續。② <code>farthest = max(0, 0+3) = 3</code> ↑ —— index 1..3 可到達。' },
    { text:'<code>i=1, nums[1]=2</code>:① <code>1 &gt; 3</code>?否,繼續。② <code>farthest = max(3, 1+2) = 3</code> 不變 —— 剛好落在 3,沒有更遠。' },
    { text:'<code>i=2, nums[2]=1</code>:① <code>2 &gt; 3</code>?否,繼續。② <code>farthest = max(3, 2+1) = 3</code> 不變 —— 又落在 3。' },
    { text:'<code>i=3, nums[3]=0</code>:① <code>3 &gt; 3</code>?否,繼續。② <code>farthest = max(3, 3+0) = 3</code> 不變 —— <b>原地不動</b>,index 3 是一道牆。' },
    { text:'<code>i=4</code>:① <code>4 &gt; 3</code> → <b>是</b> → <code>return false</code>。<b>0..3 最遠都只到 3</b>(<code>0+3</code>、<code>1+2</code>、<code>2+1</code>、<code>3+0</code>),沒有人跨得過 index 3 的 0,index 4 永遠到不了。' },
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
  // 從 (x1,y) 拱起到 (x2,y),頂點高 hgt;箭頭在終點
  function arc(x1,x2,y,hgt,color,lw,dash){
    const mx=(x1+x2)/2, cy=y-hgt*2;          // 二次貝茲控制點 → 頂點高 = hgt
    ctx.beginPath(); ctx.moveTo(x1,y); ctx.quadraticCurveTo(mx,cy,x2,y);
    ctx.lineWidth=lw; ctx.strokeStyle=color; ctx.setLineDash(dash?[5,4]:[]); ctx.stroke(); ctx.setLineDash([]);
    head(x2, y, Math.atan2(y-cy, x2-mx), color);
  }
  function loop(x,y,color,lw){            // 原地:i + 0 = i
    ctx.beginPath(); ctx.arc(x, y-11, 9, Math.PI*0.72, Math.PI*2.28);
    ctx.lineWidth=lw; ctx.strokeStyle=color; ctx.stroke();
    head(x+6, y-1, Math.PI*0.62, color, 8);
  }
  function cross(x,y,s,color,lw){ ctx.beginPath(); ctx.moveTo(x-s,y-s); ctx.lineTo(x+s,y+s); ctx.moveTo(x+s,y-s); ctx.lineTo(x-s,y+s); ctx.lineWidth=lw; ctx.strokeStyle=color; ctx.stroke(); }

  function draw(){
    fit();
    const w=canvas.clientWidth, h=canvas.clientHeight, PAD=22, IN=10;
    ctx.fillStyle=C.paper; ctx.fillRect(0,0,w,h); ctx.setLineDash([]);
    const s=S[step], ex=EX[s.ex], A=ex.nums;
    const cur = (s.kind==='iter'||s.kind==='fail') ? s.i : -1;
    const fail = s.kind==='fail', done = s.kind==='done';
    const far = s.fa;                                   // 本步結束時的 farthest

    const X0=PAD+70, XR=w-PAD-IN, colW=(XR-X0)/N, cg=Math.min(14, colW*0.16), cw=colW-cg;
    const cx=k=>X0+k*colW+cg/2, mid=k=>cx(k)+cw/2;
    const L=cx(0), R=cx(N-1)+cw;
    const tagX=PAD+35;

    /* ---------- BAND 0 · 哪個範例 ---------- */
    const tabF='700 11.5px '+SANS, tabW=Math.max(tw('範例 1',tabF), tw('範例 2',tabF))+22, tabH=20, tabY=6;
    for(const e of [1,2]){
      const x=w-PAD-(3-e)*tabW-(e===1?8:0), on=e===s.ex;
      rr(x, tabY, tabW, tabH, 10); ctx.fillStyle=on?C.ink:C.cell; ctx.fill();
      ctx.lineWidth=1.2; ctx.strokeStyle=on?C.ink:C.off; ctx.stroke();
      txt(EX[e].name, x+tabW/2, tabY+tabH/2+1, tabF, on?C.paper:C.dim, 'center', 'middle');
    }
    const t0='BAND 0 · '+ex.name+'   nums = ['+A.join(',')+']   預期 → '+ex.ans;
    txt(t0, PAD, 20, fitFont(t0, w-2*PAD-2*tabW-8-16, '700', [12.5,12,11.5,11], MONO), C.ink);

    /* ---------- BAND 1 · nums ---------- */
    const B1=48, by=90, bh=44;
    const t1='BAND 1 · nums   紅 = 目前 i   藍 = 可到達 (≤ farthest)   綠 = 本步新增   白 = 還到不了';
    txt(t1, PAD, B1, fitFont(t1, w-2*PAD, '600', [11.5,11,10.5,10], MONO), C.dim);
    txt('nums', tagX, by+bh/2+1, '700 13px '+MONO, C.ink, 'center', 'middle');
    for(let k=0;k<N;k++){
      const x=cx(k), isCur=k===cur;
      const isNew = s.kind==='iter' && k>s.fb && k<=s.fa;
      let st={bg:C.cell, bd:C.ink, tx:C.ink, lw:1.4};
      if(k<=far) st={bg:C.tint, bd:C.ink, tx:C.ink, lw:1.4};
      if(isNew) st={bg:C.good, bd:C.goodT, tx:C.goodT, lw:2};
      if(done && k===N-1) st={bg:C.good, bd:C.goodT, tx:C.goodT, lw:2.6};
      if(fail && k===3) st={bg:C.tint, bd:C.red2, tx:C.red2, lw:2.4};
      if(isCur) st={bg:C.redBg, bd:C.red, tx:C.redT, lw:2.8};
      if(fail && k===N-1) st={bg:C.bad, bd:C.red2, tx:C.red2, lw:2.8};
      let hs=String(k), hc=C.dim;
      if(isCur){ hs='i='+k; hc=C.redT; }
      if(fail && k===N-1){ hs='i=4 到不了'; hc=C.red2; }
      if(fail && k===3){ hs='3 · nums=0'; hc=C.red2; }
      if(done && k===N-1){ hs='4 · 終點 ✓'; hc=C.goodT; }
      if(isNew && !isCur){ hs=k+' · 新'; hc=C.goodT; }
      txt(hs, x+cw/2, by-18, fitFont(hs, cw-4, '700', [11,10.5,10,9.5], MONO), hc, 'center', 'middle');
      cellBox(x,by,cw,bh,st,A[k],'700 18px '+MONO);
      if(fail && k===N-1) cross(x+cw-13, by+12, 5, C.red2, 2.4);
    }

    /* ---------- BAND 2 · reach track ---------- */
    const B2=168, ly=190, ty=242, th=22, ay=ty-4, mly=ty+th+16, dy=300, dh=36;
    const t2 = '② farthest = max(farthest, i + nums[i])   藍條 = 0..farthest 都站得到';
    txt('BAND 2 · reach', PAD, B2, '700 12px '+SANS, C.ink);
    const t2x=PAD+tw('BAND 2 · reach','700 12px '+SANS)+16;
    txt(t2, t2x, B2, fitFont(t2, w-PAD-t2x, '600', [11.5,11,10.5,10], MONO), C.dim);
    txt('reach', tagX, ty+th/2+1, '700 12px '+MONO, C.ink, 'center', 'middle');
    txt('max', tagX, dy+dh/2+1, '700 12px '+MONO, C.ink, 'center', 'middle');

    // 軌道底(0..n−1)
    rr(L, ty, R-L, th, 5); ctx.setLineDash([4,3]); ctx.lineWidth=1; ctx.strokeStyle=C.off; ctx.stroke(); ctx.setLineDash([]);
    for(let k=1;k<N;k++){ const xb=cx(k)-cg/2; ctx.beginPath(); ctx.moveTo(xb,ty+5); ctx.lineTo(xb,ty+th-5); ctx.lineWidth=1; ctx.strokeStyle=C.off; ctx.stroke(); }
    const endX = f => f>=N-1 ? R : cx(f)+cw;
    const prevF = s.kind==='iter' ? s.fb : far;
    // 舊範圍(藍)+ 本步新增(綠)
    rr(L, ty, endX(prevF)-L, th, 5); ctx.fillStyle=C.tint; ctx.fill(); ctx.lineWidth=1.4; ctx.strokeStyle=C.ink; ctx.stroke();
    if(s.kind==='iter' && s.fa>s.fb && s.fb<N-1){
      const gx=endX(s.fb);
      rr(gx, ty, endX(s.fa)-gx, th, 5); ctx.fillStyle=C.good; ctx.fill(); ctx.lineWidth=2; ctx.strokeStyle=C.goodT; ctx.stroke();
      const g='+'+(Math.min(s.fa,N-1)-s.fb)+' 格';
      txt(g, (gx+endX(s.fa))/2, ty+th/2+1, '700 11px '+SANS, C.goodT, 'center', 'middle');
    }
    if(far>N-1){   // 超出終點:箭頭延伸到右邊界外
      const ex0=R+3, ex1=w-PAD+6;
      ctx.beginPath(); ctx.moveTo(ex0, ty+th/2); ctx.lineTo(ex1-8, ty+th/2); ctx.lineWidth=2.4; ctx.strokeStyle=C.ink; ctx.stroke();
      head(ex1, ty+th/2, 0, C.ink, 9);
    }
    // 牆(範例 2 收尾):3 與 4 之間
    if(fail){
      const xw=cx(4)-cg/2;
      ctx.beginPath(); ctx.moveTo(xw, by-6); ctx.lineTo(xw, by+bh+6); ctx.moveTo(xw, ty-8); ctx.lineTo(xw, ty+th+6); ctx.lineWidth=3.2; ctx.strokeStyle=C.red2; ctx.stroke();
      rr(cx(4), ty, cw, th, 5); ctx.fillStyle=C.bad; ctx.fill(); ctx.setLineDash([4,3]); ctx.lineWidth=1.6; ctx.strokeStyle=C.red2; ctx.stroke(); ctx.setLineDash([]);
      cross(mid(4), ty+th/2, 5, C.red2, 2.4);
    }
    // farthest 標記
    const fx = endX(Math.min(far, N-1));
    if(!fail){ ctx.beginPath(); ctx.moveTo(fx, ty-6); ctx.lineTo(fx, ty+th+5); ctx.lineWidth=2.4; ctx.strokeStyle=C.ink; ctx.stroke(); }   // 收尾時牆線就是標記
    let ml;
    if(s.kind==='iter' && s.fa!==s.fb) ml='farthest '+s.fb+' → '+s.fa;
    else ml='farthest = '+far;
    if(far>N-1) ml += '  (> 終點 4)';
    if(fail) ml='farthest = 3  牆';
    const mf='700 12px '+MONO, mw=tw(ml,mf);
    const mlx=Math.max(L+mw/2, Math.min(w-PAD-mw/2, fail ? cx(4)-cg/2 : fx));
    txt(ml, mlx, mly, mf, fail?C.red2:C.ink, 'center', 'middle');

    // 弧線:本步 i → i + nums[i]
    function arcFor(i, color, lw, dash){
      const t=i+A[i], x1=mid(i);
      if(t===i){ loop(x1, ay, color, lw); return; }
      const x2 = t>N-1 ? w-PAD-2 : mid(t) - (fail && t===3 ? 14 : 0);   // 收尾時讓出原地圈
      const hgt = Math.min(28, 12+ (x2-x1)*0.07);
      arc(x1, x2, ay, hgt, color, lw, dash);
    }
    function arcLabel(s2, cxp, color){
      const f=fitFont(s2, w-2*PAD, '700', [12,11.5,11], MONO), lw2=tw(s2,f);
      const x=Math.max(PAD+lw2/2, Math.min(w-PAD-lw2/2, cxp));
      txt(s2, x, ly, f, color, 'center', 'middle');
    }
    if(s.kind==='iter'){
      const t=s.i+A[s.i], grow=s.fa>s.fb;
      const col = grow ? C.red : C.dim;
      arcFor(s.i, col, grow?2.4:1.8, !grow);
      const x2 = t>N-1 ? w-PAD : mid(t);
      let lab='i + nums[i] = '+s.i+' + '+A[s.i]+' = '+t;
      if(t>N-1) lab+='  → 8 超出終點';
      else if(t===s.i) lab+='  原地不動';
      else if(!grow) lab+='  沒超過 '+s.fb;
      arcLabel(lab, (mid(s.i)+x2)/2, grow?C.redT:C.ink);
    } else if(fail){
      for(const i of [0,1,2,3]) arcFor(i, C.red2, 1.6, i!==0);
      arcLabel('0+3 · 1+2 · 2+1 · 3+0 → 0..3 最遠都只到 3', (mid(0)+mid(3))/2, C.red2);
    } else if(done){
      arcLabel('farthest = 8 ≥ 最後一格 4 → 終點在範圍內', (L+R)/2, C.goodT);
    } else {
      arcLabel('起點 index 0 一定站得到 → farthest = 0', (L+R)/2, C.dim);
    }

    // max 決策盒
    let dl, dbg=C.cell, dbd=C.ink, dtx=C.ink, dlw=1.2;
    if(s.kind==='init'){ dl='farthest = 0   (還沒看任何一格)'; dtx=C.dim; }
    else if(s.kind==='iter'){
      dl='farthest = max('+s.fb+', '+s.i+'+'+A[s.i]+') = '+s.fa+(s.fa>s.fb?'  ↑ 變遠':'  不變');
      if(s.fa>s.fb){ dbg=C.redBg; dbd=C.red; dtx=C.redT; dlw=2; }
    }
    else if(done){ dl='最後 farthest = 8 —— 每一格 0..4 都在範圍內'; dbg=C.good; dbd=C.goodT; dtx=C.goodT; dlw=2; }
    else { dl='不更新:i=4 已經過不了 ① 檢查 · farthest 停在 3'; dbg=C.bad; dbd=C.red2; dtx=C.red2; dlw=2; }
    rr(L, dy, R-L, dh, 6); ctx.fillStyle=dbg; ctx.fill(); ctx.lineWidth=dlw; ctx.strokeStyle=dbd; ctx.stroke();
    txt(dl, (L+R)/2, dy+dh/2+1, fitFont(dl, R-L-20, '700', [13.5,13,12.5,12,11], MONO), dtx, 'center', 'middle');

    /* ---------- BAND 3 · check ---------- */
    const B3=368, cy=384, ch=38;
    const t3='① if (i > farthest) return false   每輪先檢查,再更新';
    txt('BAND 3 · check', PAD, B3, '700 12px '+SANS, C.ink);
    const t3x=PAD+tw('BAND 3 · check','700 12px '+SANS)+16;
    txt(t3, t3x, B3, fitFont(t3, w-PAD-t3x, '600', [11.5,11,10.5,10], MONO), C.dim);
    txt('check', tagX, cy+ch/2+1, '700 12px '+MONO, C.ink, 'center', 'middle');
    const chipW=Math.max(124, Math.min(180, colW*1.5)), chipX=R-chipW, boxR=chipX-14;
    let cl, cbg=C.cell, cbd=C.ink, ctx2=C.ink, clw=1.2, chip, kbg=C.cell, kbd=C.off, ktx=C.dim, klw=1.2;
    if(s.kind==='init'){ cl='i > farthest ?   (還沒開始)'; ctx2=C.dim; chip='尚未開始'; }
    else if(s.kind==='iter'){
      cl='i > farthest ?   '+s.i+' > '+s.fb+' → 否,繼續'+(s.i===s.fb?'(相等 = 站得到)':'');
      chip='→ ② 更新'; kbd=C.ink; ktx=C.ink;
    }
    else if(done){ cl='迴圈跑完(i = 5 = n)→ return true'; cbg=C.good; cbd=C.goodT; ctx2=C.goodT; clw=2.2;
      chip='true ✓'; kbg=C.good; kbd=C.goodT; ktx=C.goodT; klw=2.4; }
    else { cl='i > farthest ?   4 > 3 → 是 → return false'; cbg=C.bad; cbd=C.red2; ctx2=C.red2; clw=2.4;
      chip='false ✗'; kbg=C.bad; kbd=C.red2; ktx=C.red2; klw=2.6; }
    rr(L, cy, boxR-L, ch, 6); ctx.fillStyle=cbg; ctx.fill(); ctx.lineWidth=clw; ctx.strokeStyle=cbd; ctx.stroke();
    txt(cl, L+12, cy+ch/2+1, fitFont(cl, boxR-L-24, '700', [13.5,13,12.5,12,11,10.5], MONO), ctx2, 'left', 'middle');
    rr(chipX, cy, chipW, ch, 19); ctx.fillStyle=kbg; ctx.fill(); ctx.lineWidth=klw; ctx.strokeStyle=kbd; ctx.stroke();
    txt(chip, chipX+chipW/2, cy+ch/2+1, fitFont(chip, chipW-16, '700', [14,13,12], MONO), ktx, 'center', 'middle');
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
