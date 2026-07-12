/* ============================================================
   P300 · Longest Increasing Subsequence — O(n²) DP · viz(va-*)
   dp[i] = 以 nums[i] 結尾的最長遞增子序列長度。
   dp[i] = 1 + max( dp[j] : j<i 且 nums[j] < nums[i] ),沒有就 1。
   答案 = 整條 dp 的最大值。
   例 nums=[3,1,4,2,5] → dp=[1,1,2,2,3],答案 3([1,4,5] 等)
     BAND 1  nums[] 與 dp[](珊瑚=本步 i · 藍=可接的前驅 j)
     BAND 2  dp[i] = 1 + max(dp[j] : nums[j]<nums[i])
     BAND 3  說明
   ============================================================ */
(function () {
  const canvas = document.getElementById('va-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('va-step'), labelEl = document.getElementById('va-label');
  const bPrev = document.getElementById('va-prev'), bNext = document.getElementById('va-next'),
        bPlay = document.getElementById('va-play'), bReset = document.getElementById('va-reset');

  const COLOR = { paper:'#ffffff', ink:'#1a1a1a', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf',
    cell:'#fafaf6', cellS:'#cfcfcf', src:'#dbe8f6', srcS:'#4478c0', srcT:'#2f5f9e',
    cur:'#fbe7df', curS:'#d96e4e', curT:'#b3502f', done:'#d9e8c7', doneS:'#5fa866', doneT:'#3f7a3a', coral:'#d96e4e' };

  const NUMS = [3, 1, 4, 2, 5];
  const N = NUMS.length;
  const NIL = -1;
  const steps = [
    { dp:[1,1,1,1,1], cur:NIL, js:[],
      text:'<strong>INITIAL</strong> · <code>dp[i]</code> = 以 <code>nums[i]</code> 結尾的最長遞增子序列長度。每格至少是 <strong>1</strong>(自己一個)。' },
    { dp:[1,1,1,1,1], cur:1, js:[],
      text:'<code>i=1</code>(<code>num=1</code>)· 前面 <code>3</code> 不小於 1 → 沒有可接的前驅。<code>dp[1]=1</code>。' },
    { dp:[1,1,2,1,1], cur:2, js:[0,1],
      text:'<code>i=2</code>(<code>num=4</code>)· 前驅 <code>3、1</code> 都 &lt; 4 → <code>dp[2]=1+max(dp[0],dp[1])=2</code>。' },
    { dp:[1,1,2,2,1], cur:3, js:[1],
      text:'<code>i=3</code>(<code>num=2</code>)· 只有 <code>1</code> &lt; 2 → <code>dp[3]=1+dp[1]=2</code>。' },
    { dp:[1,1,2,2,3], cur:4, js:[0,1,2,3], done:true,
      text:'<code>i=4</code>(<code>num=5</code>)· 前面全部 &lt; 5 → <code>dp[4]=1+max(dp[2],dp[3])=3</code>。答案 = max(dp) = <strong>3</strong>。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,h=canvas.clientHeight,PAD=26;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,h);
    const jset=new Set(s.js);

    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · nums[] 與 dp[](珊瑚=本步 i · 藍=可接的前驅 j:nums[j]<nums[i])', PAD, 24);

    const cw=Math.min(74,(w-2*PAD-64)/N); const total=N*cw; const gx=(w-total)/2+18;
    const numsY=52, dpY=134, chh=42;
    ctx.fillStyle=COLOR.text; ctx.font='700 12px "JetBrains Mono", monospace'; ctx.textAlign='right'; ctx.textBaseline='middle';
    ctx.fillText('nums', gx-14, numsY+chh/2); ctx.fillText('dp', gx-14, dpY+chh/2);

    for(let i=0;i<N;i++){ const x=gx+i*cw;
      ctx.fillStyle=COLOR.dim; ctx.font='700 11px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(i), x+cw/2, numsY-13);
      const isCur=(i===s.cur), isJ=jset.has(i);
      // nums cell
      rr(x+4,numsY,cw-8,chh,5);
      ctx.fillStyle=isCur?COLOR.cur:(isJ?COLOR.src:COLOR.cell); ctx.fill();
      ctx.lineWidth=isCur?3:(isJ?2.4:1.8); ctx.strokeStyle=isCur?COLOR.curS:(isJ?COLOR.srcS:COLOR.cellS); ctx.stroke();
      ctx.fillStyle=isCur?COLOR.curT:(isJ?COLOR.srcT:COLOR.ink); ctx.font='700 19px "JetBrains Mono", monospace';
      ctx.fillText(String(NUMS[i]), x+cw/2, numsY+chh/2+1);
      // dp cell
      const filled=(s.cur!==NIL && i<=s.cur) || s.cur===NIL;
      rr(x+4,dpY,cw-8,chh,5);
      ctx.fillStyle=isCur?COLOR.cur:(isJ?COLOR.src:(filled?COLOR.done:COLOR.cell)); ctx.fill();
      ctx.lineWidth=isCur?3.2:(isJ?2.4:1.8); ctx.strokeStyle=isCur?COLOR.curS:(isJ?COLOR.srcS:(filled?COLOR.doneS:COLOR.cellS)); ctx.stroke();
      ctx.fillStyle=isCur?COLOR.curT:(isJ?COLOR.srcT:(filled?COLOR.doneT:COLOR.grid)); ctx.font='700 19px "JetBrains Mono", monospace';
      ctx.fillText(String(s.dp[i]), x+cw/2, dpY+chh/2+1);
    }

    // BAND 2
    let by=196;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · dp[i] = 1 + max( dp[j] : j<i, nums[j] < nums[i] )', PAD, by);
    const eqBox=by+12, ebH=42; rr(PAD,eqBox,w-PAD*2,ebH,6); ctx.fillStyle='#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(s.cur===NIL){ ctx.fillStyle=COLOR.text; ctx.font='600 13px "Noto Sans TC", sans-serif'; ctx.fillText('對每個 i,往回看所有比它小的前驅 j,接在最長的那條後面 +1', w/2, eqBox+ebH/2); }
    else { const i=s.cur;
      ctx.fillStyle=s.done?COLOR.doneT:COLOR.curT; ctx.font='700 15px "JetBrains Mono", monospace';
      if(s.js.length===0) ctx.fillText(`dp[${i}] = 1  (沒有比 ${NUMS[i]} 小的前驅)`, w/2, eqBox+ebH/2);
      else { const vals=s.js.map(j=>s.dp[j]); const mx=Math.max(...vals);
        ctx.fillText(`dp[${i}] = 1 + max(${vals.join(', ')}) = ${1+mx}`, w/2, eqBox+ebH/2); }
    }

    // BAND 3
    const ty=eqBox+ebH+22, done=!!s.done;
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 答案是整條 dp 的最大值', PAD, ty);
    const box=ty+12, boxH=38; rr(PAD,box,w-PAD*2,boxH,6); ctx.fillStyle=done?COLOR.done:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?COLOR.doneS:COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(done){ ctx.fillStyle=COLOR.doneT; ctx.font='700 13px "JetBrains Mono", monospace'; ctx.fillText('max(dp) = 3 · LIS 可能結尾在任何位置 → 取全體最大,不是 dp[n-1]', w/2, box+boxH/2); }
    else { ctx.fillStyle=COLOR.text; ctx.font='600 12.5px "Noto Sans TC", sans-serif'; ctx.fillText('dp[i] 只算「以 i 結尾」;LIS 可能在中間就結束 → 最後取 max(dp)', w/2, box+boxH/2); }
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
