/* ============================================================
   P567 · Permutation in String — 定長滑動視窗 + 計數比對 · viz
   s2 含 s1 的排列 ⟺ s2 裡有一段「長度 = |s1| 且字元計數和 s1 相同」的子字串。
   維持一個「恰好 |s1| 長」的視窗,每步同時「右邊加入、左邊移出」(定長、鎖步滑動),
   把視窗的 26 字母計數和 s1 的計數比對;相等即找到排列。
   例 s1="ab"(目標 a×1 b×1), s2="eidbaooo" → 視窗 "ba" 命中。
     BAND 1  s2(綠=視窗[l,r] · 紅=剛加入 r · 灰=剛移出)
     BAND 2  目標計數 vs 視窗計數(相等 → 命中)
     BAND 3  定長滑動:加右、減左、比計數
   ============================================================ */
(function () {
  const canvas = document.getElementById('viz-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('viz-step'), labelEl = document.getElementById('viz-label');
  const bPrev = document.getElementById('viz-prev'), bNext = document.getElementById('viz-next'),
        bPlay = document.getElementById('viz-play'), bReset = document.getElementById('viz-reset');
  const C = { paper:'#ffffff', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf', cell:'#fafaf6', cellS:'#cfcfcf',
    src:'#dbe8f6', srcS:'#4478c0', srcT:'#2f5f9e', grn:'#d9e8c7', grnS:'#5fa866', grnT:'#3f7a3a',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424', off:'#eceae2', offS:'#c9c6ba', offT:'#8a8672', coral:'#cf3535' };

  const S2 = ['e','i','d','b','a','o','o','o'], TARGET = {a:1,b:1}, M = 2;   // |s1|=2
  // l, r, enter(char just added|null), leave(char just removed|null), match, text
  const steps = [
    { l:0, r:1, enter:null, leave:null, match:false, act:'intro', text:'<strong>INITIAL</strong> · <code>s1="ab"</code>(目標 <code>a×1 b×1</code>), <code>s2="eidbaooo"</code>。視窗大小固定 = <code>|s1|=2</code>,整條滑過去比字元計數。' },
    { l:0, r:1, enter:null, leave:null, match:false, act:'check', text:'<strong>視窗 [0,1] "ei"</strong> · 計數 <code>e×1 i×1</code> ≠ 目標 → 不是排列。' },
    { l:1, r:2, enter:'d', leave:'e', match:false, act:'slide', text:'<strong>滑動 → [1,2] "id"</strong> · 右邊 <code>+d</code>、左邊 <code>−e</code>。計數 <code>i×1 d×1</code> ≠ 目標。' },
    { l:2, r:3, enter:'b', leave:'i', match:false, act:'slide', text:'<strong>滑動 → [2,3] "db"</strong> · <code>+b −i</code>。計數 <code>d×1 b×1</code> ≠ 目標(缺 a)。' },
    { l:3, r:4, enter:'a', leave:'d', match:true, act:'match', text:'<strong>滑動 → [3,4] "ba"</strong> · <code>+a −d</code>。計數 <code>b×1 a×1</code> == 目標 <code>a×1 b×1</code> → <strong>命中!回傳 true</strong>。' },
  ];

  function winCount(l,r){ const c={}; for(let k=l;k<=r;k++){ c[S2[k]]=(c[S2[k]]||0)+1; } return c; }

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function triD(cx,cy,col){ ctx.beginPath(); ctx.moveTo(cx-6,cy-7); ctx.lineTo(cx+6,cy-7); ctx.lineTo(cx,cy+3); ctx.closePath(); ctx.fillStyle=col; ctx.fill(); }
  function triU(cx,cy,col){ ctx.beginPath(); ctx.moveTo(cx-6,cy+7); ctx.lineTo(cx+6,cy+7); ctx.lineTo(cx,cy-3); ctx.closePath(); ctx.fillStyle=col; ctx.fill(); }

  function chipRow(x,y,label,counts,cmp){   // 畫 "label: a¹ b¹ ..." ,cmp=目標(判斷相等變色)
    ctx.fillStyle=C.dim; ctx.font='600 11px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='middle';
    ctx.fillText(label, x, y);
    let cx=x+58;
    const keys=Object.keys(counts).sort();
    if(keys.length===0){ ctx.fillStyle=C.offT; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.fillText('∅', cx, y); return; }
    for(const k of keys){
      const cw=34, ch=24;
      const ok = cmp ? (cmp[k]===counts[k]) : true;
      rr(cx,y-ch/2,cw,ch,5); ctx.fillStyle=ok?C.grn:C.cur; ctx.fill(); ctx.lineWidth=1.5; ctx.strokeStyle=ok?C.grnS:C.curS; ctx.stroke();
      ctx.fillStyle=ok?C.grnT:C.curT; ctx.font='700 13px "JetBrains Mono", monospace'; ctx.textAlign='center';
      ctx.fillText(k+'×'+counts[k], cx+cw/2, y);
      ctx.textAlign='left'; cx+=cw+8;
    }
  }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,PAD=30;
    ctx.fillStyle=C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);
    const done = s.act==='match';
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · s2(綠=視窗[l,r] · 紅=剛加入 r · 灰=剛移出)', PAD, 18);
    const n=S2.length, cell=Math.min(64,(w-2*PAD)/n-10), gp=((w-2*PAD)-n*cell)/(n-1), gy=48, chh=42;
    for(let k=0;k<n;k++){
      const x=PAD+k*(cell+gp);
      const inWin = k>=s.l && k<=s.r;
      const isEnter = k===s.r && s.enter;
      const isLeave = s.leave && k===s.l-1;
      rr(x,gy,cell,chh,8);
      let bg=C.cell,bd=C.cellS,tc=C.text;
      if(k<s.l || k>s.r){ bg=C.off; bd=C.offS; tc=C.offT; }
      if(inWin){ bg=C.grn; bd=C.grnS; tc=C.grnT; }
      if(isEnter){ bg=C.cur; bd=C.curS; tc=C.curT; }
      ctx.fillStyle=bg; ctx.fill(); ctx.lineWidth=(isEnter||isLeave)?3:1.7; ctx.strokeStyle=isLeave?C.offS:bd; ctx.stroke();
      ctx.fillStyle=tc; ctx.font='700 20px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(S2[k], x+cell/2, gy+chh/2);
      ctx.fillStyle=C.dim; ctx.font='600 10px "JetBrains Mono", monospace'; ctx.textBaseline='top';
      ctx.fillText(String(k), x+cell/2, gy+chh+5);
    }
    { const rx=PAD+s.r*(cell+gp)+cell/2; triD(rx, gy-4, C.curS); ctx.fillStyle=C.curT; ctx.font='700 10px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='bottom'; ctx.fillText('r', rx, gy-10); }
    { const lx=PAD+s.l*(cell+gp)+cell/2; triU(lx, gy+chh+15, C.srcS); ctx.fillStyle=C.srcT; ctx.font='700 10px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='top'; ctx.fillText('l', lx, gy+chh+21); }

    // ---- BAND 2 · target vs window counts ----
    const b2=126;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 目標計數 vs 視窗計數(全部相等 → 命中)', PAD, b2);
    rr(PAD,b2+8,w-PAD*2,58,6); ctx.fillStyle=done?C.grn:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?C.grnS:C.grid; ctx.stroke();
    chipRow(PAD+14, b2+24, '目標', TARGET, null);
    chipRow(PAD+14, b2+50, '視窗', winCount(s.l,s.r), TARGET);
    // verdict on the right
    ctx.textAlign='right'; ctx.textBaseline='middle'; ctx.font='700 13px "JetBrains Mono", monospace';
    ctx.fillStyle=done?C.grnT:C.offT; ctx.fillText(done?'== 相等 ✓':'≠ 不相等', w-PAD-14, b2+37);

    // ---- BAND 3 ----
    const by=204;
    ctx.fillStyle=C.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 定長視窗:每步 +右 −左,比 26 字母計數', PAD, by);
    rr(PAD,by+10,w-PAD*2,42,6); ctx.fillStyle=done?C.grn:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?C.grnS:C.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='600 12.5px "Noto Sans TC", sans-serif';
    let msg,col=C.text;
    if(s.act==='intro'){ msg='排列 = 同長度、同字元計數 → 滑一個定長視窗比計數'; }
    else if(done){ msg='命中 · 視窗是 s1 的排列 · 回傳 true · O(n) 掃描'; col=C.grnT; }
    else if(s.act==='slide'){ msg='視窗鎖步右移:加入 '+s.enter+'、移出 '+s.leave+',大小不變'; col=C.srcT; }
    else { msg='比對視窗計數與目標:不相等 → 繼續滑'; col=C.offT; }
    ctx.fillStyle=col; ctx.fillText(msg, w/2, by+31);
  }

  function update(){ const s=steps[step]; if(stepEl) stepEl.textContent=String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0'); if(labelEl) labelEl.innerHTML=s.text; draw(); }
  function next(){ if(step<steps.length-1){step++;update();}else stop(); }
  function prev(){ if(step>0){step--;update();} }
  function reset(){ stop(); step=0; update(); }
  function play(){ if(timer){stop();return;} bPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){stop();return;} next(); },1800); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} if(bPlay) bPlay.textContent='Play'; }
  bPrev&&bPrev.addEventListener('click',prev); bNext&&bNext.addEventListener('click',next); bPlay&&bPlay.addEventListener('click',play); bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();}); if(window.ResizeObserver){ new ResizeObserver(()=>{fit();draw();}).observe(canvas); }
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw); fit(); update();
})();
