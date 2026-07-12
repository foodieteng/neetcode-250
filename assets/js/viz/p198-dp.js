/* ============================================================
   P198 · House Robber — 一維 DP 填表(逐步播放)· viz
   到第 i 間為止能搶的最多錢 dp[i]:第 i 間「搶」或「不搶」二選一。
   搶 i：不能碰 i-1,只能接 dp[i-2] 再加 nums[i] → dp[i-2] + nums[i]
   不搶 i：沿用 dp[i-1]。兩者取 max:dp[i] = max(dp[i-1], dp[i-2] + nums[i])。
   例 nums=[2,7,9,3,1] → dp=[2,7,11,11,12],答案 12
     BAND 1  nums[](房子金額) + dp[](搶到 i 為止最多錢)
     BAND 2  dp[i] = max(dp[i-1], dp[i-2] + nums[i]),標出贏的一邊
     BAND 3  說明:搶了就不能碰隔壁
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
    cur:'#fbe7df', curS:'#d96e4e', curT:'#b3502f', done:'#d9e8c7', doneS:'#5fa866', doneT:'#3f7a3a', coral:'#d96e4e' };

  const NUMS = [2, 7, 9, 3, 1];
  const N = NUMS.length;              // 5 間房子,index 0..4
  const NIL = -1;
  const steps = [
    { dp:[2,7,NIL,NIL,NIL], cur:NIL, skip:NIL, rob:NIL, add:NIL, win:null,
      text:'<strong>INITIAL</strong> · <code>dp[i]</code> = 搶到第 <code>i</code> 間為止能拿的最多錢。base:<code>dp[0]=nums[0]=2</code>、<code>dp[1]=max(nums[0],nums[1])=7</code>。' },
    { dp:[2,7,11,NIL,NIL], cur:2, skip:1, rob:0, add:2, win:'rob',
      text:'<code>dp[2] = max(dp[1], dp[0]+nums[2]) = max(7, 2+9) = 11</code>。<strong>搶</strong>第 2 間比較多。' },
    { dp:[2,7,11,11,NIL], cur:3, skip:2, rob:1, add:3, win:'skip',
      text:'<code>dp[3] = max(dp[2], dp[1]+nums[3]) = max(11, 7+3) = 11</code>。<strong>不搶</strong>第 3 間反而較多,沿用 dp[2]。' },
    { dp:[2,7,11,11,12], cur:4, skip:3, rob:2, add:4, win:'rob', done:true,
      text:'<code>dp[4] = max(dp[3], dp[2]+nums[4]) = max(11, 11+1) = 12</code>。回傳 <code>dp[4] = 12</code>。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,h=canvas.clientHeight,PAD=26;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,h);

    // ── BAND 1 · nums[] + dp[]
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · nums[](各房金額) · dp[](珊瑚=本步 · 藍=dp[i-1] 不搶、dp[i-2] 搶)', PAD, 24);

    const cw=Math.min(72,(w-2*PAD-72)/N); const total=N*cw; const gx=(w-total)/2+18;
    const numsY=52, dpY=134, chh=42;

    // row labels
    ctx.fillStyle=COLOR.text; ctx.font='700 12px "JetBrains Mono", monospace'; ctx.textAlign='right'; ctx.textBaseline='middle';
    ctx.fillText('nums', gx-14, numsY+chh/2);
    ctx.fillText('dp',   gx-14, dpY+chh/2);

    for(let i=0;i<N;i++){ const x=gx+i*cw;
      // index label
      ctx.fillStyle=COLOR.dim; ctx.font='700 11px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(i), x+cw/2, numsY-13);

      // nums cell — highlight the money being weighed this step (add)
      const isAdd=(i===s.add);
      rr(x+4,numsY,cw-8,chh,5);
      ctx.fillStyle=isAdd?COLOR.cur:COLOR.cell; ctx.fill();
      ctx.lineWidth=isAdd?3:1.8; ctx.strokeStyle=isAdd?COLOR.curS:COLOR.cellS; ctx.stroke();
      ctx.fillStyle=isAdd?COLOR.curT:COLOR.ink; ctx.font='700 20px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(NUMS[i]), x+cw/2, numsY+chh/2+1);

      // dp cell
      const val=s.dp[i]; const isCur=(i===s.cur), isSrc=(i===s.skip||i===s.rob), filled=val!==NIL&&!isCur&&!isSrc;
      rr(x+4,dpY,cw-8,chh,5);
      ctx.fillStyle=isCur?COLOR.cur:(isSrc?COLOR.src:(filled?COLOR.done:COLOR.cell)); ctx.fill();
      ctx.lineWidth=isCur?3.2:1.8; ctx.strokeStyle=isCur?COLOR.curS:(isSrc?COLOR.srcS:(filled?COLOR.doneS:COLOR.cellS)); ctx.stroke();
      ctx.fillStyle=isCur?COLOR.curT:(isSrc?COLOR.srcT:(filled?COLOR.doneT:COLOR.grid)); ctx.font='700 20px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(val===NIL?'·':String(val), x+cw/2, dpY+chh/2+1);
    }

    // ── BAND 2 · recurrence equation
    let by=204;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 遞迴式  dp[i] = max( dp[i-1] , dp[i-2] + nums[i] )', PAD, by);
    const eqBox=by+12; rr(PAD,eqBox,w-PAD*2,46,6); ctx.fillStyle='#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(s.cur===NIL){ ctx.fillStyle=COLOR.text; ctx.font='600 13px "Noto Sans TC", sans-serif'; ctx.fillText('每間房二選一:不搶(沿用 dp[i-1])或 搶(dp[i-2] + nums[i]),取較大的', w/2, eqBox+24); }
    else { const i=s.cur, a=s.dp[i-1], b=s.dp[i-2], m=NUMS[i], v=s.dp[i], robWin=(s.win==='rob');
      ctx.font='700 16px "JetBrains Mono", monospace';
      const skipTxt=`不搶 ${a}`, robTxt=`搶 ${b}+${m}=${b+m}`;
      ctx.fillStyle=COLOR.dim; ctx.fillText(`dp[${i}] = max(  ${skipTxt}  ,  ${robTxt}  ) = ${v}`, w/2, eqBox+24);
      // re-draw the winning term in strong colour on top for emphasis
      const full=`dp[${i}] = max(  ${skipTxt}  ,  ${robTxt}  ) = ${v}`;
      ctx.fillStyle=s.done?COLOR.doneT:COLOR.curT;
      ctx.fillText(full, w/2, eqBox+24); // colour whole line by outcome (kept simple, no per-token measuring)
    }

    // ── BAND 3 · note
    const ty=eqBox+68, done=!!s.done;
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 為什麼搶了就只能接 dp[i-2]', PAD, ty);
    const box=ty+12; rr(PAD,box,w-PAD*2,40,6); ctx.fillStyle=done?COLOR.done:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?COLOR.doneS:COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(done){ ctx.fillStyle=COLOR.doneT; ctx.font='700 13px "JetBrains Mono", monospace'; ctx.fillText('return dp[n-1] = 12 · 只依賴前兩項 → 兩個變數即可 O(1) 空間', w/2, box+20); }
    else { ctx.fillStyle=COLOR.text; ctx.font='600 12px "Noto Sans TC", sans-serif'; ctx.fillText('相鄰不能同時搶:搶了第 i 間就跳過 i-1,金額只能從 dp[i-2] 接上去', w/2, box+20); }
  }

  function update(){ const s=steps[step]; if(stepEl) stepEl.textContent=String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0'); if(labelEl) labelEl.innerHTML=s.text; draw(); }
  function next(){ if(step<steps.length-1){step++;update();}else stop(); }
  function prev(){ if(step>0){step--;update();} }
  function reset(){ stop(); step=0; update(); }
  function play(){ if(timer){stop();return;} bPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){stop();return;} next(); },1700); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} if(bPlay) bPlay.textContent='Play'; }
  bPrev&&bPrev.addEventListener('click',prev); bNext&&bNext.addEventListener('click',next); bPlay&&bPlay.addEventListener('click',play); bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();}); if(window.ResizeObserver){ new ResizeObserver(()=>{fit();draw();}).observe(canvas); }
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw); fit(); update();
})();
