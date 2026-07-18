/* ============================================================
   P70 · Climbing Stairs — 一維 DP 填表(逐步播放)· viz
   到第 i 階,最後一步不是「跨 1 階」就是「跨 2 階」,所以到 i 的方法數
   = 到 (i-1) 的方法數 + 到 (i-2) 的方法數 → dp[i] = dp[i-1] + dp[i-2]。
   這就是費氏數列。base:dp[0]=1(不動)、dp[1]=1(一步)。
   例 n=5 → dp = [1,1,2,3,5,8],答案 8
     BAND 1  dp[] 陣列(紅=本步填的 · 藍=兩個來源)
     BAND 2  遞迴式:dp[i] = dp[i-1] + dp[i-2]
     BAND 3  說明
   ============================================================ */
(function () {
  const canvas = document.getElementById('viz-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('viz-step'), labelEl = document.getElementById('viz-label');
  const bPrev = document.getElementById('viz-prev'), bNext = document.getElementById('viz-next'),
        bPlay = document.getElementById('viz-play'), bReset = document.getElementById('viz-reset');

  const COLOR = { paper:'#ffffff', ink:'#1a1a1a', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf',
    cell:'#fafaf6', cellS:'#cfcfcf', src:'#dbe8f6', srcS:'#4478c0', srcT:'#2f5f9e',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424', done:'#d9e8c7', doneS:'#5fa866', doneT:'#3f7a3a', coral:'#cf3535' };

  const N = 5;                       // 5 階
  const NIL = -1;
  const steps = [
    { dp:[1,1,NIL,NIL,NIL,NIL], cur:NIL, src:[],
      text:'<strong>INITIAL</strong> · <code>dp[i]</code> = 到第 <code>i</code> 階的方法數。base:<code>dp[0]=1</code>(不動)、<code>dp[1]=1</code>(跨一步)。' },
    { dp:[1,1,2,NIL,NIL,NIL], cur:2, src:[1,0],
      text:'<code>dp[2] = dp[1] + dp[0] = 1 + 1 = 2</code>。到第 2 階:最後一步從第 1 階跨 1、或從第 0 階跨 2。' },
    { dp:[1,1,2,3,NIL,NIL], cur:3, src:[2,1],
      text:'<code>dp[3] = dp[2] + dp[1] = 2 + 1 = 3</code>。' },
    { dp:[1,1,2,3,5,NIL], cur:4, src:[3,2],
      text:'<code>dp[4] = dp[3] + dp[2] = 3 + 2 = 5</code>。' },
    { dp:[1,1,2,3,5,8], cur:5, src:[4,3], done:true,
      text:'<code>dp[5] = dp[4] + dp[3] = 5 + 3 = 8</code>。回傳 <code>dp[5] = 8</code>。就是費氏數列!' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,h=canvas.clientHeight,PAD=26;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,h);
    const srcSet=new Set(s.src);

    // ── BAND 1 · dp array
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · dp[](紅=本步填入 · 藍=兩個來源 dp[i-1]、dp[i-2])', PAD, 24);
    const cw=Math.min(74,(w-2*PAD)/(N+1)); const gx=(w-(N+1)*cw)/2, gy=64, chh=52;
    for(let i=0;i<=N;i++){ const x=gx+i*cw; const val=s.dp[i];
      const isCur=(i===s.cur), isSrc=srcSet.has(i), filled=val!==NIL&&!isCur&&!isSrc;
      // index label
      ctx.fillStyle=COLOR.dim; ctx.font='700 11px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(String(i), x+cw/2, gy-12);
      rr(x+4,gy,cw-8,chh,5);
      ctx.fillStyle=isCur?COLOR.cur:(isSrc?COLOR.src:(filled?COLOR.done:COLOR.cell)); ctx.fill();
      ctx.lineWidth=isCur?3.2:1.8; ctx.strokeStyle=isCur?COLOR.curS:(isSrc?COLOR.srcS:(filled?COLOR.doneS:COLOR.cellS)); ctx.stroke();
      ctx.fillStyle=isCur?COLOR.curT:(isSrc?COLOR.srcT:(filled?COLOR.doneT:COLOR.grid)); ctx.font='700 22px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(val===NIL?'·':String(val), x+cw/2, gy+chh/2+1);
    }

    // ── BAND 2 · recurrence equation
    let by=150;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 遞迴式  dp[i] = dp[i-1] + dp[i-2]', PAD, by);
    const eqBox=by+12; rr(PAD,eqBox,w-PAD*2,44,6); ctx.fillStyle='#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(s.cur===NIL){ ctx.fillStyle=COLOR.text; ctx.font='600 13px "Noto Sans TC", sans-serif'; ctx.fillText('最後一步:跨 1 階(從 i-1 來)或 跨 2 階(從 i-2 來)→ 方法數相加', w/2, eqBox+23); }
    else { const i=s.cur, a=s.dp[i-1], b=s.dp[i-2], v=s.dp[i];
      ctx.fillStyle=s.done?COLOR.doneT:COLOR.curT; ctx.font='700 19px "JetBrains Mono", monospace';
      ctx.fillText(`dp[${i}] = dp[${i-1}] + dp[${i-2}] = ${a} + ${b} = ${v}`, w/2, eqBox+23); }

    // ── BAND 3 · note
    const ty=eqBox+64, done=!!s.done;
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 為什麼是「相加」', PAD, ty);
    const box=ty+12; rr(PAD,box,w-PAD*2,40,6); ctx.fillStyle=done?COLOR.done:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?COLOR.doneS:COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(done){ ctx.fillStyle=COLOR.doneT; ctx.font='700 13px "JetBrains Mono", monospace'; ctx.fillText('return dp[n] = 8 · 只依賴前兩項 → 可用兩個變數 O(1) 空間', w/2, box+20); }
    else { ctx.fillStyle=COLOR.text; ctx.font='600 12px "Noto Sans TC", sans-serif'; ctx.fillText('「到第 i 階」的每種走法,最後一步唯一(跨 1 或跨 2),兩群不重疊 → 直接相加', w/2, box+20); }
  }

  function update(){ const s=steps[step]; if(stepEl) stepEl.textContent=String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0'); if(labelEl) labelEl.innerHTML=s.text; draw(); }
  function next(){ if(step<steps.length-1){step++;update();}else stop(); }
  function prev(){ if(step>0){step--;update();} }
  function reset(){ stop(); step=0; update(); }
  function play(){ if(timer){stop();return;} bPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){stop();return;} next(); },1600); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} if(bPlay) bPlay.textContent='Play'; }
  bPrev&&bPrev.addEventListener('click',prev); bNext&&bNext.addEventListener('click',next); bPlay&&bPlay.addEventListener('click',play); bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();}); if(window.ResizeObserver){ new ResizeObserver(()=>{fit();draw();}).observe(canvas); }
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw); fit(); update();
})();
