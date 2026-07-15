/* ============================================================
   P518 · 對照組:金額當外層 → 「排列」(這題會答錯!) · viz  (vb-*)
   for (i = 1; i <= amount; i++)      ← 外層:金額
       for (coin : coins)             ← 內層:硬幣
           if (i >= coin) dp[i] += dp[i - coin];
   為什麼變排列:每個金額 i 都讓「每一枚硬幣」當一次最後一枚 —— 1+2 和 2+1
   是兩條不同的路,都被數到。這正是 LC 377 要的答案,但不是 518 要的。
   coins=[1,2,5], amount=5 → 9(而不是 4)
     BAND 1  dp[i] = 湊出金額 i 的排列數
     BAND 2  本步:每枚硬幣都當一次「最後一枚」
     BAND 3  結論:5 → 9 ≠ 4,這是 377 不是 518
   ============================================================ */
(function () {
  const canvas = document.getElementById('vb-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('vb-step'), labelEl = document.getElementById('vb-label');
  const bPrev = document.getElementById('vb-prev'), bNext = document.getElementById('vb-next'),
        bPlay = document.getElementById('vb-play'), bReset = document.getElementById('vb-reset');

  const COLOR = { paper:'#ffffff', ink:'#1a1a1a', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf',
    cell:'#fafaf6', cellS:'#cfcfcf', src:'#dbe8f6', srcS:'#4478c0', srcT:'#2f5f9e',
    cur:'#fbe7df', curS:'#d96e4e', curT:'#b3502f', done:'#d9e8c7', doneS:'#5fa866', doneT:'#3f7a3a',
    bad:'#f0d4d4', badS:'#c1440e', badT:'#8f3208', coral:'#d96e4e' };

  const AMOUNT = 5;
  // dp[i] = dp[i-1] + dp[i-2] + dp[i-5]
  const steps = [
    { i:null, dp:[1,0,0,0,0,0], neu:[], from:[],
      text:'<strong>INITIAL</strong> · 同樣 <code>coins=[1,2,5]</code>、<code>amount=5</code>,但<strong>外層換成金額</strong>。<code>dp[0]=1</code>。看看答案會變成什麼。' },
    { i:1, dp:[1,1,0,0,0,0], neu:[1], from:[{c:1,src:0}],
      text:'<strong>i = 1</strong>:只有硬幣 1 能用 → <code>dp[1] += dp[0]</code> = 1。' },
    { i:2, dp:[1,1,2,0,0,0], neu:[2], from:[{c:1,src:1},{c:2,src:0}],
      text:'<strong>i = 2</strong>:硬幣 1 當最後一枚 → <code>dp[2] += dp[1]</code>;硬幣 2 當最後一枚 → <code>dp[2] += dp[0]</code>。<code>dp[2]=2</code>。' },
    { i:3, dp:[1,1,2,3,0,0], neu:[3], from:[{c:1,src:2},{c:2,src:1}],
      text:'<strong>i = 3</strong>:<code>dp[3] = dp[2] + dp[1] = 3</code>。<strong>注意</strong>:<code>1+2</code> 和 <code>2+1</code> 在這裡被算成<strong>兩種</strong> —— 組合數其實只有 2 種({1,1,1}、{1,2})。<strong>開始分岔了。</strong>' },
    { i:4, dp:[1,1,2,3,5,0], neu:[4], from:[{c:1,src:3},{c:2,src:2}],
      text:'<strong>i = 4</strong>:<code>dp[4] = dp[3] + dp[2] = 5</code>。組合數只有 3 種,這裡卻是 5。' },
    { i:5, dp:[1,1,2,3,5,9], neu:[5], from:[{c:1,src:4},{c:2,src:3},{c:5,src:0}], done:true,
      text:'<strong>i = 5</strong>:<code>dp[5] = dp[4] + dp[3] + dp[0] = 5+3+1 = </code><strong>9</strong>。但 518 要的答案是 <strong>4</strong> —— <strong>交換迴圈 = 換了題目</strong>,這是 <a href="../../../13-1d-dp/problems/p377/index.html">LC 377</a> 的答案。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,h=canvas.clientHeight,PAD=26;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,h);
    const neuSet=new Set(s.neu); const done=!!s.done;
    const srcSet=new Set(s.from.map(f=>f.src));

    // ── BAND 1 ──
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · dp[i] = 湊出金額 i 的「排列數」(藍=來源 · 珊瑚=本步)', PAD, 24);

    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(s.i!==null){
      const chx=w/2, chy=54;
      ctx.fillStyle=COLOR.text; ctx.font='600 12.5px "Noto Sans TC", sans-serif'; ctx.textAlign='right';
      ctx.fillText('外層本輪金額  ', chx-14, chy);
      rr(chx-8,chy-15,42,30,6); ctx.fillStyle=COLOR.cur; ctx.fill(); ctx.lineWidth=2.4; ctx.strokeStyle=COLOR.curS; ctx.stroke();
      ctx.fillStyle=COLOR.curT; ctx.font='700 17px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.fillText(String(s.i), chx+13, chy+1);
    } else {
      ctx.fillStyle=COLOR.dim; ctx.font='600 12.5px "Noto Sans TC", sans-serif';
      ctx.fillText('coins = [1, 2, 5] · amount = 5 · 外層 = 金額', w/2, 54);
    }

    // dp cells
    const NC=AMOUNT+1; const cw=Math.min(76,(w-2*PAD)/(NC+1)); const gx=(w-NC*cw)/2, gy=102, chh=48;
    for(let m=0;m<NC;m++){ const x=gx+m*cw; const val=s.dp[m]; const isNew=neuSet.has(m); const isSrc=srcSet.has(m); const isAns=(done&&m===AMOUNT);
      ctx.fillStyle=COLOR.dim; ctx.font='700 11px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('金額 '+m, x+cw/2, gy-14);
      rr(x+4,gy,cw-8,chh,5);
      ctx.fillStyle=isAns?COLOR.bad:(isNew?COLOR.cur:(isSrc?COLOR.src:COLOR.cell)); ctx.fill();
      ctx.lineWidth=isAns?3.4:(isNew?3.2:(isSrc?2.4:1.8)); ctx.strokeStyle=isAns?COLOR.badS:(isNew?COLOR.curS:(isSrc?COLOR.srcS:COLOR.cellS)); ctx.stroke();
      ctx.fillStyle=isAns?COLOR.badT:(isNew?COLOR.curT:(isSrc?COLOR.srcT:(val>0?COLOR.text:COLOR.grid))); ctx.font='700 20px "JetBrains Mono", monospace';
      ctx.fillText(String(val), x+cw/2, gy+chh/2+1);
      if(m===AMOUNT){ ctx.fillStyle=done?COLOR.badT:COLOR.dim; ctx.font='700 10px "Noto Sans TC", sans-serif'; ctx.fillText(done?'← 9 ≠ 4 ✗':'← 目標', x+cw/2, gy+chh+13); }
    }

    // ── BAND 2 · every coin gets to be last ──
    const by=196;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 每一枚硬幣都當一次「最後一枚」→ 順序被算進去', PAD, by);
    const boxY=by+10, bH=52; rr(PAD,boxY,w-PAD*2,bH,6);
    ctx.fillStyle='#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(s.from.length===0){
      ctx.fillStyle=COLOR.text; ctx.font='600 12.5px "Noto Sans TC", sans-serif';
      ctx.fillText('外層是金額時,內層會把「每枚硬幣」都試一遍當結尾', w/2, boxY+bH/2);
    } else {
      const parts=s.from.map(f=>'dp['+f.src+']');
      ctx.fillStyle=COLOR.text; ctx.font='700 13px "JetBrains Mono", monospace';
      ctx.fillText('dp['+s.i+'] = '+parts.join(' + ')+'  =  '+s.dp[s.i], w/2, boxY+16);
      const lbl=s.from.map(f=>'尾='+f.c).join('　　');
      ctx.fillStyle=COLOR.curT; ctx.font='600 12px "Noto Sans TC", sans-serif';
      ctx.fillText('最後一枚分別是:　'+lbl, w/2, boxY+37);
    }

    // ── BAND 3 ──
    const ty=286;
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 結論:交換迴圈 = 換了題目', PAD, ty);
    rr(PAD,ty+10,w-PAD*2,40,6); ctx.fillStyle=done?COLOR.bad:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?COLOR.badS:COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(done){ ctx.fillStyle=COLOR.badT; ctx.font='700 12.5px "JetBrains Mono", monospace'; ctx.fillText('9 = 排列數(377 的答案) · 4 = 組合數(518 的答案) —— 差別只在外層是誰', w/2, ty+30); }
    else { ctx.fillStyle=COLOR.text; ctx.font='600 12.5px "Noto Sans TC", sans-serif'; ctx.fillText('1+2 和 2+1 走的是兩條不同的路,兩條都被數 → 這是「排列」', w/2, ty+30); }
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
