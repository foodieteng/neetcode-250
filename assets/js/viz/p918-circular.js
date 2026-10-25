/* ============================================================
   P918 · Maximum Sum Circular Subarray — 一趟跑兩個 Kadane · viz
   total += x
   curMx = max(curMx + x, x)   subMx = max(subMx, curMx)   最大段(不跨尾巴)
   curMi = min(curMi + x, x)   subMi = min(subMi, curMi)   最小段
   if (subMx < 0) return subMx;   return max(total − subMi, subMx)
   例 T5 [2,-3,4,-6,1,5] → 9(跨尾巴:整圈拿掉最小段 [3])
     BAND 1  nums(紅 = 本步 x)+ curMx 段(藍)+ curMi 段(米)
     BAND 2  決策:curMx / curMi 各自「接上 or 重開」;最後一步 = guard + 跨 vs 不跨
     BAND 3  狀態:total / curMx / subMx / curMi / subMi
   所有數字取自實測 trace(fact sheet T5)。
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

  const NUMS = [2,-3,4,-6,1,5], N = NUMS.length;
  const f = v => (v === null ? '−∞' : (v < 0 ? '−' + Math.abs(v) : String(v)));
  const fp = v => (v < 0 ? '(' + f(v) + ')' : f(v));        // 加法右側的負數加括號

  /* trace T5(fact sheet):pMx/pMi = 本步前的 curMx/curMi;wMx/wMi = 'ext' 接上 / 're' 重開 / 'tie';
     本步後 total, curMx, curMi, subMx, subMi;upMx = subMx 刷新;upMi = subMi 刷新;sMx/sMi = curMx/curMi 的段 */
  const T = [
    { i:0, total:2,  pMx:0,  mx:2,  wMx:'tie', pMi:0,  mi:2,  wMi:'tie', subMx:2, subMi:2,  upMx:true,  upMi:true,  sMx:[0,0], sMi:[0,0] },
    { i:1, total:-1, pMx:2,  mx:-1, wMx:'ext', pMi:2,  mi:-3, wMi:'re',  subMx:2, subMi:-3, upMx:false, upMi:true,  sMx:[0,1], sMi:[1,1] },
    { i:2, total:3,  pMx:-1, mx:4,  wMx:'re',  pMi:-3, mi:1,  wMi:'ext', subMx:4, subMi:-3, upMx:true,  upMi:false, sMx:[2,2], sMi:[1,2] },
    { i:3, total:-3, pMx:4,  mx:-2, wMx:'ext', pMi:1,  mi:-6, wMi:'re',  subMx:4, subMi:-6, upMx:false, upMi:true,  sMx:[2,3], sMi:[3,3] },
    { i:4, total:-2, pMx:-2, mx:1,  wMx:'re',  pMi:-6, mi:-5, wMi:'ext', subMx:4, subMi:-6, upMx:false, upMi:false, sMx:[4,4], sMi:[3,4] },
    { i:5, total:3,  pMx:1,  mx:6,  wMx:'ext', pMi:-5, mi:0,  wMi:'ext', subMx:6, subMi:-6, upMx:true,  upMi:false, sMx:[4,5], sMi:[3,5] },
  ];
  const BEST = [4,5], MINB = [3,3];              // 不跨尾巴最佳段 / 最小段

  const steps = [
    { text:'<strong>INITIAL</strong> · <code>nums = [2,-3,4,-6,1,5]</code>。<code>total = 0</code>,<code>curMx = curMi = 0</code>,<code>subMx = −∞</code>(<code>INT_MIN</code>),<code>subMi = +∞</code>(<code>INT_MAX</code>)。<b>同一趟跑兩個 Kadane</b>:<code>curMx</code> 追最大段,<code>curMi</code> 追最小段 —— 環狀的答案不是「中間一段」就是「整圈拿掉中間一段」。' },
    { text:'<code>i=0 x=2</code>:<code>total = 2</code>。<code>curMx = max(0+2, 2) = 2</code>、<code>curMi = min(0+2, 2) = 2</code>,兩邊都<b>平手</b>。<code>subMx = 2</code> ↑、<code>subMi = 2</code> ↓(從 ±∞ 第一次刷新)。' },
    { text:'<code>i=1 x=−3</code>:<code>total = −1</code>。<code>curMx = max(2+(−3), −3) = −1</code> → <b>接上</b>;<code>curMi = min(2+(−3), −3) = −3</code> → <b>重開</b>(前面那段是正的,帶著它只會更大)。<code>subMx</code> 不變 2;<code>subMi = −3</code> ↓。' },
    { text:'<code>i=2 x=4</code>:<code>total = 3</code>。<code>curMx = max(−1+4, 4) = 4</code> → <b>重開</b>(前面是負的);<code>curMi = min(−3+4, 4) = 1</code> → <b>接上</b>。<code>subMx = 4</code> ↑;<code>subMi</code> 不變 −3。' },
    { text:'<code>i=3 x=−6</code>:<code>total = −3</code>。<code>curMx = max(4+(−6), −6) = −2</code> → 接上;<code>curMi = min(1+(−6), −6) = −6</code> → <b>重開</b>。<code>subMx</code> 不變 4;<code>subMi = −6</code> ↓,最小段 <code>[3..3]</code>。' },
    { text:'<code>i=4 x=1</code>:<code>total = −2</code>。<code>curMx = max(−2+1, 1) = 1</code> → <b>重開</b>;<code>curMi = min(−6+1, 1) = −5</code> → 接上。<code>subMx</code>(4)、<code>subMi</code>(−6)都不變。' },
    { text:'<code>i=5 x=5</code>:<code>total = 3</code>。<code>curMx = max(1+5, 5) = 6</code> → 接上;<code>curMi = min(−5+5, 5) = 0</code> → 接上。<code>subMx = 6</code> ↑,段 <code>[4..5]</code>;<code>subMi</code> 仍是 −6,段 <code>[3..3]</code>。掃完。' },
    { text:'<strong>收尾</strong> · guard:<code>subMx = 6 ≥ 0</code>,不是全負 → 比兩種。<b>不跨尾巴</b> <code>subMx = 6</code>(<code>[4..5]</code>);<b>跨尾巴</b> <code>total − subMi = 3 − (−6) = 9</code>。<strong>答案 9 = 整圈拿掉最小段 [3]</strong>,也就是 <code>[4,5,0,1,2] = 1+5+2−3+4</code>,尾巴 i=5 接回頭 i=0。' },
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
    const final = step===steps.length-1;
    const t = step>0 ? T[Math.min(step,N)-1] : null;
    const cur = (t && !final) ? t.i : -1;

    const X0=PAD+70, XR=w-PAD-IN, colW=(XR-X0)/N, cg=Math.min(14, colW*0.16), cw=colW-cg;
    const cx=k=>X0+k*colW+cg/2;
    const tagX=PAD+35;

    /* ---------- BAND 1 · nums + 兩條段軌 ---------- */
    const B1=18, by=62, bh=40;
    txt(final ? 'BAND 1 · nums   綠 = 跨尾巴答案 [4,5,0,1,2]   灰 = 拿掉的最小段 [3]'
              : 'BAND 1 · nums   紅 = 本步 x   藍 = curMx 的段   米 = curMi 的段', PAD, B1, '600 11.5px '+MONO, C.dim);
    txt('nums', tagX, by+bh/2+1, '700 13px '+MONO, C.ink, 'center', 'middle');
    for(let k=0;k<N;k++){
      const x=cx(k), isCur=k===cur;
      let st={bg:C.cell, bd:C.ink, tx:C.ink, lw:1.4};
      if(final){
        if(k>=MINB[0] && k<=MINB[1]) st={bg:C.off, bd:C.dim, tx:C.dim, lw:1.2};
        else st={bg:C.good, bd:C.goodT, tx:C.goodT, lw:2.2};
      }
      if(isCur) st={bg:C.redBg, bd:C.red, tx:C.redT, lw:2.8};
      txt('i='+k, x+cw/2, by-18, '700 10.5px '+MONO, isCur?C.redT:(final&&k!==3?C.goodT:C.dim), 'center', 'middle');
      cellBox(x,by,cw,bh,st,f(NUMS[k]),fitFont(f(NUMS[k]), cw-6, '700', [17,15,13], MONO));
      if(final && k===3){   // 刪除線
        ctx.beginPath(); ctx.moveTo(x+8, by+bh-8); ctx.lineTo(x+cw-8, by+8); ctx.lineWidth=1.6; ctx.strokeStyle=C.dim; ctx.stroke();
      }
    }

    const rh=22, r1=by+bh+14, r2=r1+rh+12;
    function track(y){ rr(X0+cg/2, y, XR-X0-cg, rh, 5); ctx.setLineDash([4,3]); ctx.lineWidth=1; ctx.strokeStyle=C.off; ctx.stroke(); ctx.setLineDash([]); }
    function piece(y, seg, fill, bd, lw){ const x1=cx(seg[0]), x2=cx(seg[1])+cw; rr(x1, y, x2-x1, rh, 5); ctx.fillStyle=fill; ctx.fill(); ctx.lineWidth=lw; ctx.strokeStyle=bd; ctx.stroke(); return [x1,x2]; }
    function pieceLabel(y, x1, x2, s, color){
      const lf='700 11.5px '+MONO, lw2=tw(s,lf);
      if(lw2 <= x2-x1-12) txt(s, (x1+x2)/2, y+rh/2+1, lf, color, 'center', 'middle');
      else if(x2+12+lw2 <= XR) txt(s, x2+12, y+rh/2+1, lf, color, 'left', 'middle');
      else txt(s, x1-12, y+rh/2+1, lf, color, 'right', 'middle');
    }
    function rail(y, tag, tagColor, seg, sum, label, fill, bd, tx, lw){
      txt(tag, tagX, y+rh/2+1, '700 12px '+MONO, tagColor, 'center', 'middle');
      track(y);
      if(!seg){ txt(label, X0+cg/2+10, y+rh/2+1, '600 11.5px '+SANS, C.dim, 'left', 'middle'); return; }
      const [x1,x2]=piece(y, seg, fill, bd, lw);
      pieceLabel(y, x1, x2, label+'  ['+seg[0]+'..'+seg[1]+'] = '+f(sum), tx);
    }
    if(!t){
      rail(r1, 'curMx', C.ink, null, 0, '空段 · curMx = 0', 0,0,0,0);
      rail(r2, 'curMi', C.ink, null, 0, '空段 · curMi = 0', 0,0,0,0);
    } else if(!final){
      rail(r1, 'curMx', C.ink, t.sMx, t.mx, 'curMx 段', C.tint, C.ink, C.ink, t.wMx==='re'?2.2:1.2);
      rail(r2, 'curMi', C.ink, t.sMi, t.mi, 'curMi 段', C.tint2, C.ink, C.ink, t.wMi==='re'?2.2:1.2);
    } else {
      rail(r1, '不跨', C.ink, BEST, 6, '不跨尾巴 subMx', C.tint, C.ink, C.ink, 1.2);
      // 跨尾巴:[4..5] + [0..2],中間拿掉 [3]
      txt('跨尾', tagX, r2+rh/2+1, '700 12px '+SANS, C.goodT, 'center', 'middle');
      track(r2);
      const [a1,a2]=piece(r2, [0,2], C.good, C.goodT, 2.2);
      const [b1,b2]=piece(r2, [4,5], C.good, C.goodT, 2.2);
      const [m1,m2]=piece(r2, MINB, C.off, C.dim, 1.2);
      pieceLabel(r2, a1, a2, '答案 9 = 整圈拿掉最小段 [3]', C.goodT);
      txt('1 + 5 →', (b1+b2)/2, r2+rh/2+1, fitFont('1 + 5 →', b2-b1-10, '700', [11.5,10.5], MONO), C.goodT, 'center', 'middle');
      txt('−6', (m1+m2)/2, r2+rh/2+1, '700 11.5px '+MONO, C.dim, 'center', 'middle');
      // 尾巴接回頭:i=5 右端 → 往下 → 回到 i=0 左端
      const ly=r2+rh+18, xe=b2-10, xs=a1+10;
      ctx.beginPath(); ctx.moveTo(xe, r2+rh); ctx.lineTo(xe, ly); ctx.lineTo(xs, ly); ctx.lineTo(xs, r2+rh+3);
      ctx.lineWidth=1.6; ctx.strokeStyle=C.goodT; ctx.setLineDash([5,3]); ctx.stroke(); ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(xs, r2+rh+1); ctx.lineTo(xs-4, r2+rh+7); ctx.lineTo(xs+4, r2+rh+7); ctx.closePath(); ctx.fillStyle=C.goodT; ctx.fill();
      const ws='環狀:i=5 接回 i=0', wf='700 11px '+SANS, ww=tw(ws,wf)+14, wx=(xs+xe)/2;
      ctx.fillStyle=C.paper; ctx.fillRect(wx-ww/2, ly-8, ww, 16);
      txt(ws, wx, ly+1, wf, C.goodT, 'center', 'middle');
    }

    /* ---------- BAND 2 · 決策 ---------- */
    const B2=r2+rh+50, dh=44, dA=B2+16, dB=dA+dh+12;
    txt(final ? 'BAND 2 · 收尾   if (subMx < 0) return subMx;  return max(total − subMi, subMx)'
              : 'BAND 2 · 決策   接上 cur + x  vs  重開 x', PAD, B2, '700 12px '+SANS, C.ink);
    function decRow(y, tag, fill, expr, verdict, active){
      txt(tag, tagX, y+dh/2+1, '700 13px '+MONO, C.ink, 'center', 'middle');
      rr(X0+cg/2, y, XR-X0-cg, dh, 7); ctx.fillStyle=active?fill:C.cell; ctx.fill();
      ctx.setLineDash(active?[]:[4,3]); ctx.lineWidth=active?1.4:1.2; ctx.strokeStyle=active?C.ink:C.off; ctx.stroke(); ctx.setLineDash([]);
      const vf='700 12.5px '+SANS, vw=tw(verdict,vf);
      txt(verdict, XR-cg/2-14, y+dh/2+1, vf, active?C.red2:C.dim, 'right', 'middle');
      const room=XR-X0-cg-28-vw-16;
      txt(expr, X0+cg/2+14, y+dh/2+1, fitFont(expr, room, '700', [15,14,13,12], MONO), active?C.ink:C.dim, 'left', 'middle');
    }
    const vtxt=(win,ext,re,sym)=> win==='tie' ? '平手  '+f(ext)+' = '+f(re)
                                : (win==='ext' ? '接上  '+f(ext)+' '+sym+' '+f(re) : '重開  '+f(re)+' '+sym+' '+f(ext));
    if(!t){
      decRow(dA, 'max', C.tint, 'curMx = max(curMx + x, x)', '接上 or 重開', false);
      decRow(dB, 'min', C.tint2, 'curMi = min(curMi + x, x)', '接上 or 重開', false);
    } else if(!final){
      const x=NUMS[t.i], eMx=t.pMx+x, eMi=t.pMi+x;
      decRow(dA, 'max', C.tint, 'curMx = max('+f(t.pMx)+' + '+fp(x)+', '+f(x)+') = '+f(t.mx), vtxt(t.wMx, eMx, x, '>'), true);
      decRow(dB, 'min', C.tint2, 'curMi = min('+f(t.pMi)+' + '+fp(x)+', '+f(x)+') = '+f(t.mi), vtxt(t.wMi, eMi, x, '<'), true);
    } else {
      decRow(dA, 'guard', C.cell, 'subMx = 6 ≥ 0', '不是全負 → 比兩種', true);
      txt('max', tagX, dB+dh/2+1, '700 13px '+MONO, C.ink, 'center', 'middle');
      const gap=40, bx0=X0+cg/2, bw=(XR-X0-cg-gap)/2, xA=bx0, xB=bx0+bw+gap;
      function choice(x, head, expr, win){
        rr(x,dB,bw,dh,7); ctx.fillStyle=win?C.good:C.cell; ctx.fill(); ctx.lineWidth=win?2.4:1.2; ctx.strokeStyle=win?C.goodT:C.off; ctx.stroke();
        const hc=win?C.goodT:C.dim, tc=win?C.goodT:C.dim;
        txt(head, x+12, dB+13, fitFont(head, bw-(win?84:24), '700', [11.5,10.5,10], SANS), hc, 'left', 'middle');
        if(win) txt('✓ 答案', x+bw-10, dB+13, '700 11px '+SANS, C.goodT, 'right', 'middle');
        txt(expr, x+bw/2, dB+31, fitFont(expr, bw-20, '700', [16,15,13,12], MONO), tc, 'center', 'middle');
      }
      choice(xA, '不跨尾巴  subMx  [4..5]', '6', false);
      choice(xB, '跨尾巴  total − subMi', '3 − (−6) = 9', true);
      txt('<', xA+bw+gap/2, dB+dh/2+1, '700 22px '+MONO, C.red2, 'center', 'middle');
    }

    /* ---------- BAND 3 · 狀態 ---------- */
    const B3=dB+dh+34, sy=B3+16, sh=46;
    txt('BAND 3 · 狀態   subMx = max(subMx, curMx)   subMi = min(subMi, curMi)', PAD, B3, '700 12px '+SANS, C.ink);
    txt('state', tagX, sy+sh/2+1, '700 13px '+MONO, C.ink, 'center', 'middle');
    const sg=10, gx0=X0+cg/2, sw=(XR-X0-cg-4*sg)/5;
    const plain={bg:C.cell, bd:C.ink, tx:C.ink, lw:1.4}, dimS={bg:C.cell, bd:C.off, tx:C.dim, lw:1.2},
          redS={bg:C.redBg, bd:C.red, tx:C.redT, lw:2.4}, goodS={bg:C.good, bd:C.goodT, tx:C.goodT, lw:2.4},
          badS={bg:C.bad, bd:C.red2, tx:C.red2, lw:2.4};
    function sbox(k, name, val, st, cap, capColor){
      const x=gx0+k*(sw+sg);
      rr(x,sy,sw,sh,6); ctx.fillStyle=st.bg; ctx.fill(); ctx.lineWidth=st.lw; ctx.strokeStyle=st.bd; ctx.stroke();
      txt(name, x+8, sy+12, '700 10.5px '+MONO, st===dimS?C.dim:(st.tx===C.ink?C.dim:st.tx), 'left', 'middle');
      if(cap) txt(cap, x+sw/2, sy+sh+20, fitFont(cap, sw-4, '700', [12,11,10.5], SANS), capColor, 'center', 'middle');
      txt(val, x+sw/2, sy+31, fitFont(val, sw-12, '700', [18,16,14], MONO), st.tx, 'center', 'middle');
    }
    const tintS={bg:C.tint, bd:C.ink, tx:C.ink, lw:1.4}, tint2S={bg:C.tint2, bd:C.ink, tx:C.ink, lw:1.4};
    const wtxt=w=> w==='tie'?'平手':(w==='ext'?'接上':'重開');
    if(!t){
      sbox(0,'total','0',plain,'',C.dim);
      sbox(1,'curMx','0',tintS,'',C.dim);
      sbox(2,'subMx','−∞',plain,'',C.dim);
      sbox(3,'curMi','0',tint2S,'',C.dim);
      sbox(4,'subMi','+∞',plain,'',C.dim);
    } else if(!final){
      sbox(0,'total',f(t.total),plain,'+= '+f(NUMS[t.i]),C.red2);
      sbox(1,'curMx',f(t.mx),tintS,wtxt(t.wMx),C.red2);
      sbox(2,'subMx',f(t.subMx),t.upMx?goodS:plain,t.upMx?'↑ 刷新':'不變',t.upMx?C.goodT:C.dim);
      sbox(3,'curMi',f(t.mi),tint2S,wtxt(t.wMi),C.red2);
      sbox(4,'subMi',f(t.subMi),t.upMi?badS:plain,t.upMi?'↓ 刷新':'不變',t.upMi?C.red2:C.dim);
    } else {
      sbox(0,'total','3',redS,'跨尾巴用',C.red2);
      sbox(1,'curMx','6',dimS,'',C.dim);
      sbox(2,'subMx','6',redS,'guard · 不跨用',C.red2);
      sbox(3,'curMi','0',dimS,'',C.dim);
      sbox(4,'subMi','−6',redS,'跨尾巴用',C.red2);
    }
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
