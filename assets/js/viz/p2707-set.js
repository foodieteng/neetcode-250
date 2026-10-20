/* ============================================================
   P2707 · Extra Characters in a String — 解法 B:unordered_set + 正向 DP · viz
   dp[i] = 前綴 s[0..i) 的最少多餘字元數,dp[0] = 0。
   i 由 1 到 n:dp[i] = dp[i-1] + 1(把 s[i-1] 當多餘),
   再對每個字典詞 w(長 L,且 i-L ≥ 0):若 s.substr(i-L, L) == w → dp[i] = min(dp[i], dp[i-L])。
   例 s = "leetscode", dict = {"leet","code","leetcode"} → 答案 1
     BAND 1  s 的字元(括號 = 本步比對的 s[i-L..i))
     BAND 2  dp[0..9](由左往右填;紅 = dp[i] · 藍 = 讀取的 dp[i-L])
     等式列  本步的轉移
     BAND 3  三個字典詞 + 本步 i 的比對結果
   所有狀態取自實測 trace(substr 比對共 14 次)。前綴 vb- 。
   ============================================================ */
(function () {
  const canvas = document.getElementById('vb-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('vb-step'), labelEl = document.getElementById('vb-label');
  const bPrev = document.getElementById('vb-prev'), bNext = document.getElementById('vb-next'),
        bPlay = document.getElementById('vb-play'), bReset = document.getElementById('vb-reset');

  const C = { paper:'#ffffff', ink:'#1a1a1a', dim:'#9a9a9a', cell:'#ffffff',
    tint:'#e3edf5', tint2:'#f6ead8',
    red:'#cf3535', redBg:'#fbe1e1', redT:'#992424',
    good:'#d9e8c7', bad:'#f0d4d4', off:'#cfcfcf' };
  const MONO = '"JetBrains Mono", "Noto Sans TC", monospace', SANS = '"Noto Sans TC", sans-serif';

  const S = 'leetscode', N = S.length;   // 9
  const WORDS = ['leet', 'code', 'leetcode'];
  const _ = null;

  /* cur:紅色 i 們;span:[a,b) 比對區段(good/bad);read:讀取的 dp[i-L];
     st:每個詞的狀態 'hit'|'neq'|'long'|null;cmp:每個詞實際比對的子字串 */
  const steps = [
    { dp:[0,_,_,_,_,_,_,_,_,_], cur:[], span:null, read:-1, st:[null,null,null], cmp:['','',''], cnt:0, iLbl:'',
      eq:'dp[0] = 0   (空前綴不需要刪任何字元)',
      text:'<strong>INITIAL</strong> · <code>dp[i]</code> = 前綴 <code>s[0..i)</code> 的最少多餘字元數。<code>dp[0] = 0</code>。接著 <code>i</code> 由 1 往 9 正向填,每個 i 先假設 <code>s[i-1]</code> 多餘,再拿字典每個詞去比「以 i 結尾」的那段。' },
    { dp:[0,1,2,3,_,_,_,_,_,_], cur:[1,2,3], span:null, read:-1, st:['long','long','long'], cmp:['','',''], cnt:0, iLbl:'i = 1, 2, 3',
      eq:'dp[1] = dp[0]+1 = 1 · dp[2] = dp[1]+1 = 2 · dp[3] = dp[2]+1 = 3',
      text:'<code>i = 1, 2, 3</code> · 三個詞最短也有 4 個字元,<code>i - L &lt; 0</code> ⇒ <b>一個都不能比</b>。只能 <code>dp[i] = dp[i-1] + 1</code> → 1, 2, 3。' },
    { dp:[0,1,2,3,0,_,_,_,_,_], cur:[4], span:[0,4], spanOk:true, read:0, st:['hit','neq','long'], cmp:['"leet"','"leet"',''], cnt:2, iLbl:'i = 4',
      eq:'dp[4] = min(dp[3]+1 = 4, dp[0] = 0) = 0',
      text:'<code>i = 4</code> · 初值 <code>dp[3]+1 = 4</code>。<code>s[0..4) = "leet"</code>:<b>"leet" 命中</b> ⇒ 讀 <code>dp[0] = 0</code>,<code>dp[4] = 0</code>;"code" ≠ "leet";"leetcode" 長 8,<code>4-8 &lt; 0</code> 太長。' },
    { dp:[0,1,2,3,0,1,2,3,4,_], cur:[5,6,7,8], span:[0,8], spanOk:false, read:-1, st:['neq','neq','neq'], cmp:['"scod"','"scod"','"leetscod"'], cnt:10, iLbl:'i = 5 … 8',
      eq:'dp[5] = 1 · dp[6] = 2 · dp[7] = 3 · dp[8] = 4   (每個都是 dp[i-1]+1)',
      text:'<code>i = 5..8</code> · 以 i 結尾的 4 字元片段 <code>"eets" "etsc" "tsco" "scod"</code> 都不在字典裡;到 <code>i = 8</code> 時 "leetcode" 終於夠長可以比,但 <code>s[0..8) = "leetscod"</code> ≠ ⇒ 全部沒命中,dp = 1, 2, 3, 4。(下方顯示 i = 8 的比對)' },
    { dp:[0,1,2,3,0,1,2,3,4,1], cur:[9], span:[5,9], spanOk:true, read:5, st:['neq','hit','neq'], cmp:['"code"','"code"','"eetscode"'], cnt:14, iLbl:'i = 9',
      eq:'dp[9] = min(dp[8]+1 = 5, dp[5] = 1) = 1',
      text:'<code>i = 9</code> · 初值 <code>dp[8]+1 = 5</code>。<code>s[5..9) = "code"</code>:<b>"code" 命中</b> ⇒ 讀 <code>dp[5] = 1</code>(前綴 "leets" 要刪 1 個),<code>dp[9] = 1</code>;"leetcode" 對 <code>s[1..9) = "eetscode"</code> ≠。' },
    { dp:[0,1,2,3,0,1,2,3,4,1], cur:[], span:null, read:-1, st:[null,null,null], cmp:['','',''], cnt:14, iLbl:'', final:true,
      eq:'答案 = dp[9] = 1   ("leet" + 多餘的 \'s\' + "code")',
      text:'<strong>完成</strong> · 答案 <code>dp[9] = 1</code>。最終 <code>dp = [0,1,2,3,0,1,2,3,4,1]</code>,substr 比對共 14 次。注意它跟解法 A 的 dp <b>意義相反</b>(前綴 vs 後綴),數值也不同,只有答案相同。複雜度 <strong>O(n · m · L)</strong>。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function txt(s,x,y,font,color,align,base){ ctx.font=font; ctx.fillStyle=color; ctx.textAlign=align||'left'; ctx.textBaseline=base||'alphabetic'; ctx.fillText(s,x,y); }
  function cellBox(x,y,cw,ch,style,val,font){
    rr(x,y,cw,ch,5); ctx.fillStyle=style.bg; ctx.fill();
    ctx.setLineDash(style.dash?[4,3]:[]); ctx.lineWidth=style.lw||1.6; ctx.strokeStyle=style.bd; ctx.stroke(); ctx.setLineDash([]);
    if(val!==null && val!==undefined) txt(String(val), x+cw/2, y+ch/2+1, font, style.tx, 'center', 'middle');
  }

  function draw(){
    fit();
    const s=steps[step], w=canvas.clientWidth, h=canvas.clientHeight, PAD=22;
    ctx.fillStyle=C.paper; ctx.fillRect(0,0,w,h); ctx.setLineDash([]);

    const X0=PAD+42, colW=(w-X0-PAD)/10, cg=Math.min(8, colW*0.14), cw=colW-cg;
    const cx=k=>X0+k*colW+cg/2;           // dp 第 k 格
    const sxs=k=>X0+(k+0.5)*colW+cg/2;     // s[k] 置於 dp[k] 與 dp[k+1] 之間(邊界對齊)
    const cur=new Set(s.cur);

    /* ---------- BAND 1 · s ---------- */
    const B1=18, sy=B1+32, sh=36;
    txt('BAND 1 · s   括號 = 本步比對的 s[i-L..i)', PAD, B1, '600 11.5px '+MONO, C.dim);
    txt('s', PAD+14, sy+sh/2+1, '700 15px '+MONO, C.ink, 'center', 'middle');
    for(let k=0;k<N;k++){
      const x=sxs(k), inSpan=s.span && k>=s.span[0] && k<s.span[1];
      let st={bg:C.cell, bd:C.ink, tx:C.ink, lw:1.6};
      if(inSpan) st={bg:s.spanOk?C.good:C.bad, bd:C.ink, tx:C.ink, lw:2};
      if(s.final) st = k===4 ? {bg:C.bad, bd:C.ink, tx:C.ink, lw:2} : {bg:C.good, bd:C.ink, tx:C.ink, lw:1.6};
      txt(String(k), x+cw/2, sy-13, '700 10.5px '+MONO, C.dim, 'center', 'middle');
      cellBox(x,sy,cw,sh,st,S[k],'700 17px '+MONO);
    }
    if(s.span){ // bracket under the span
      const xa=sxs(s.span[0])-2, xb=sxs(s.span[1]-1)+cw+2, by=sy+sh+6;
      ctx.strokeStyle=s.spanOk?C.ink:C.red; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(xa,by-2); ctx.lineTo(xa,by+5); ctx.lineTo(xb,by+5); ctx.lineTo(xb,by-2); ctx.stroke();
      const lab='s['+s.span[0]+'..'+s.span[1]+') = "'+S.slice(s.span[0],s.span[1])+'"'+(s.spanOk?'  ✓':'  ≠');
      txt(lab, (xa+xb)/2, by+17, '700 11px '+MONO, s.spanOk?C.ink:C.redT, 'center', 'middle');
    }
    if(s.final){
      const seg=(a,b,t)=>{ const xa=sxs(a), xb=sxs(b)+cw; txt(t,(xa+xb)/2,sy+sh+13,'700 10.5px '+MONO,C.ink,'center','middle'); };
      seg(0,3,'"leet"'); seg(4,4,'多餘'); seg(5,8,'"code"');
    }

    /* ---------- BAND 2 · dp ---------- */
    const B2=sy+sh+56, dy=B2+30, dh=38;
    txt('BAND 2 · dp[i] = s[0..i) 的最少多餘   由左往右填 →', PAD, B2, '600 11.5px '+MONO, C.red);
    txt('dp', PAD+14, dy+dh/2+1, '700 15px '+MONO, C.ink, 'center', 'middle');
    for(let k=0;k<=N;k++){
      const x=cx(k), v=s.dp[k];
      let st = v===null ? {bg:C.cell, bd:C.off, tx:C.off, lw:1.4, dash:true} : {bg:C.cell, bd:C.ink, tx:C.ink, lw:1.6};
      if(k===s.read) st={bg:C.tint, bd:C.ink, tx:C.ink, lw:2.6};
      if(cur.has(k)) st={bg:C.redBg, bd:C.red, tx:C.redT, lw:2.8};
      if(s.final && k===N) st={bg:C.good, bd:C.ink, tx:C.ink, lw:3};
      txt(String(k), x+cw/2, dy-13, '700 10.5px '+MONO, cur.has(k)?C.redT:C.dim, 'center', 'middle');
      cellBox(x,dy,cw,dh,st, v===null?'?':v, '700 16px '+MONO);
    }

    /* ---------- 等式列 ---------- */
    const ey=dy+dh+18, eh=34;
    rr(PAD,ey,w-2*PAD,eh,6); ctx.fillStyle=s.final?C.good:(step===0?C.cell:C.tint2); ctx.fill();
    ctx.lineWidth=1.6; ctx.strokeStyle=C.ink; ctx.stroke();
    let ef='700 13px '+MONO; ctx.font=ef; if(ctx.measureText(s.eq).width>w-2*PAD-20) ef='700 11.5px '+MONO;
    txt(s.eq, w/2, ey+eh/2+1, ef, C.ink, 'center', 'middle');

    /* ---------- BAND 3 · 字典詞 ---------- */
    const B3=ey+eh+34;
    txt('BAND 3 · 字典 unordered_set'+(s.iLbl?'   本步 '+s.iLbl+(s.cur.length>1&&step===3?'(顯示 i = 8)':''):''), PAD, B3, '600 11.5px '+MONO, C.dim);
    txt('substr 比對 = '+s.cnt, w-PAD, B3, '700 11.5px '+MONO, C.ink, 'right');
    const gap=14, chipW=(w-2*PAD-2*gap)/3, chipH=34, cy=B3+16;
    for(let j=0;j<3;j++){
      const x=PAD+j*(chipW+gap), stt=s.st[j];
      let bg=C.cell, bd=C.ink;
      if(stt==='hit') bg=C.good; else if(stt==='neq') bg=C.bad; else if(stt==='long') { bg=C.off; bd=C.dim; }
      rr(x,cy,chipW,chipH,chipH/2); ctx.fillStyle=bg; ctx.fill();
      ctx.lineWidth=stt==='hit'?2.6:1.6; ctx.strokeStyle=bd; ctx.stroke();
      txt('"'+WORDS[j]+'"', x+chipW/2, cy+chipH/2+1, '700 14px '+MONO, C.ink, 'center', 'middle');
      txt('L='+WORDS[j].length, x+chipW-14, cy+chipH/2+1, '600 10.5px '+MONO, C.dim, 'right', 'middle');
      let st='—', col=C.dim;
      if(stt==='hit'){ st='= 命中  s[i-L..i) = '+s.cmp[j]; col=C.ink; }
      else if(stt==='neq'){ st='≠  s[i-L..i) = '+s.cmp[j]; col=C.redT; }
      else if(stt==='long'){ st='太長 · i−L<0'; col=C.dim; }
      let sf='700 11.5px '+MONO; ctx.font=sf; if(ctx.measureText(st).width>chipW-4) sf='700 10px '+MONO;
      txt(st, x+chipW/2, cy+chipH+16, sf, col, 'center', 'middle');
    }
  }

  function update(){ if(stepEl) stepEl.textContent=String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0'); if(labelEl) labelEl.innerHTML=steps[step].text; draw(); }
  function next(){ if(step<steps.length-1){step++;update();}else stop(); }
  function prev(){ if(step>0){step--;update();} }
  function reset(){ stop(); step=0; update(); }
  function play(){ if(timer){stop();return;} bPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){stop();return;} next(); },2200); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} if(bPlay) bPlay.textContent='Play'; }
  bPrev&&bPrev.addEventListener('click',prev); bNext&&bNext.addEventListener('click',next); bPlay&&bPlay.addEventListener('click',play); bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();}); if(window.ResizeObserver){ new ResizeObserver(()=>{fit();draw();}).observe(canvas); }
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw); fit(); update();
})();
