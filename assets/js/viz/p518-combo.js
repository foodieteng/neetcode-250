/* ============================================================
   P518 · Coin Change II — 寫法 A:硬幣當外層 → 「組合」 · viz  (va-*)
   for (coin : coins)            ← 外層:硬幣,順序固定
       for (i = coin; i <= amount; i++)   ← 內層:遞增(完全背包,可重複用)
           dp[i] += dp[i - coin];
   為什麼是組合:硬幣依「固定順序」進表,coin=2 的那一輪只會在「已有的 1 的組合」
   後面接 2 —— 永遠不會回頭產生 2 在 1 前面的排法。每個組合只被數一次。
   coins=[1,2,5], amount=5 → 4 種:{5} {2,2,1} {2,1,1,1} {1×5}
     BAND 1  dp[i] = 湊出金額 i 的組合數
     BAND 2  硬幣依固定順序放入(組合的來源)
     BAND 3  對照:外層換成金額 → 變排列(見下一個動畫)
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

  const COINS = [1, 2, 5], AMOUNT = 5;
  const steps = [
    { coin:null, ci:-1, dp:[1,0,0,0,0,0], neu:[],
      text:'<strong>INITIAL</strong> · <code>coins=[1,2,5]</code>、<code>amount=5</code>。<code>dp[i]</code> = 湊出 <code>i</code> 的<strong>組合數</strong>。<code>dp[0]=1</code>(不拿任何硬幣,湊出 0 有 1 種)。' },
    { coin:1, ci:0, dp:[1,1,1,1,1,1], neu:[1,2,3,4,5],
      text:'外層 <strong>coin = 1</strong>,內層 <code>i = 1→5</code> 遞增:<code>dp[i] += dp[i−1]</code>。現在表裡<strong>只有 1</strong> 這種硬幣 → 每個金額都只有「全用 1」一種。' },
    { coin:2, ci:1, dp:[1,1,2,2,3,3], neu:[2,3,4,5],
      text:'外層 <strong>coin = 2</strong>:<code>dp[4] += dp[2]</code> → 3。注意 <code>dp[2]</code> 讀到的是「<strong>已經算好、含 1 和 2</strong>」的值 —— 內層遞增讓 2 可以<strong>重複用</strong>(完全背包)。' },
    { coin:5, ci:2, dp:[1,1,2,2,3,4], neu:[5], done:true,
      text:'外層 <strong>coin = 5</strong>:<code>dp[5] += dp[0]</code> → <strong>4</strong>。答案 = 4 種:<code>{5}</code>、<code>{2,2,1}</code>、<code>{2,1,1,1}</code>、<code>{1×5}</code>。' },
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

    // ── BAND 1 ──
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · dp[i] = 湊出金額 i 的「組合數」(珊瑚=本輪更新)', PAD, 24);

    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(s.coin!==null){
      const chx=w/2, chy=54;
      ctx.fillStyle=COLOR.text; ctx.font='600 12.5px "Noto Sans TC", sans-serif'; ctx.textAlign='right';
      ctx.fillText('外層本輪硬幣  ', chx-14, chy);
      rr(chx-8,chy-15,42,30,6); ctx.fillStyle=COLOR.cur; ctx.fill(); ctx.lineWidth=2.4; ctx.strokeStyle=COLOR.curS; ctx.stroke();
      ctx.fillStyle=COLOR.curT; ctx.font='700 17px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.fillText(String(s.coin), chx+13, chy+1);
    } else {
      ctx.fillStyle=COLOR.dim; ctx.font='600 12.5px "Noto Sans TC", sans-serif';
      ctx.fillText('coins = [1, 2, 5] · amount = 5 · 外層 = 硬幣', w/2, 54);
    }

    // dp cells 0..AMOUNT
    const NC=AMOUNT+1; const cw=Math.min(76,(w-2*PAD)/(NC+1)); const gx=(w-NC*cw)/2, gy=102, chh=48;
    for(let m=0;m<NC;m++){ const x=gx+m*cw; const val=s.dp[m]; const isNew=neuSet.has(m); const isAns=(done&&m===AMOUNT);
      ctx.fillStyle=COLOR.dim; ctx.font='700 11px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('金額 '+m, x+cw/2, gy-14);
      rr(x+4,gy,cw-8,chh,5);
      ctx.fillStyle=isAns?COLOR.done:(isNew?COLOR.cur:(val>0?COLOR.src:COLOR.cell)); ctx.fill();
      ctx.lineWidth=isAns?3.4:(isNew?3.2:1.8); ctx.strokeStyle=isAns?COLOR.doneS:(isNew?COLOR.curS:(val>0?COLOR.srcS:COLOR.cellS)); ctx.stroke();
      ctx.fillStyle=isAns?COLOR.doneT:(isNew?COLOR.curT:(val>0?COLOR.srcT:COLOR.grid)); ctx.font='700 20px "JetBrains Mono", monospace';
      ctx.fillText(String(val), x+cw/2, gy+chh/2+1);
      if(m===AMOUNT){ ctx.fillStyle=done?COLOR.doneT:COLOR.coral; ctx.font='700 10px "Noto Sans TC", sans-serif'; ctx.fillText('← 答案', x+cw/2, gy+chh+13); }
    }

    // ── BAND 2 · coins enter in fixed order ──
    const by=196;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 硬幣依「固定順序」進表 —— 這就是「組合」的來源', PAD, by);
    const boxY=by+10, bH=52; rr(PAD,boxY,w-PAD*2,bH,6);
    ctx.fillStyle='#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=COLOR.grid; ctx.stroke();

    const cwid=44, cgap=14, tot=COINS.length*cwid+(COINS.length-1)*cgap, cx0=(w-tot)/2;
    for(let k=0;k<COINS.length;k++){
      const x=cx0+k*(cwid+cgap), y=boxY+8, hgt=24;
      const isCur=(k===s.ci), isPast=(k<s.ci);
      rr(x,y,cwid,hgt,5);
      ctx.fillStyle=isCur?COLOR.cur:(isPast?COLOR.done:COLOR.cell); ctx.fill();
      ctx.lineWidth=isCur?2.6:1.6; ctx.strokeStyle=isCur?COLOR.curS:(isPast?COLOR.doneS:COLOR.cellS); ctx.stroke();
      ctx.fillStyle=isCur?COLOR.curT:(isPast?COLOR.doneT:COLOR.grid); ctx.font='700 13px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(String(COINS[k]), x+cwid/2, y+hgt/2+1);
      if(k<COINS.length-1){ ctx.fillStyle=COLOR.grid; ctx.font='700 13px "JetBrains Mono", monospace'; ctx.fillText('→', x+cwid+cgap/2, y+hgt/2+1); }
    }
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillStyle=COLOR.text; ctx.font='600 12px "Noto Sans TC", sans-serif';
    ctx.fillText('2 只會接在「1 的組合」後面,永遠不會回頭排出 2 在 1 前 → 每個組合只數一次', w/2, boxY+42);

    // ── BAND 3 ──
    const ty=286;
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 內層遞增 = 完全背包(硬幣可重複用)', PAD, ty);
    rr(PAD,ty+10,w-PAD*2,40,6); ctx.fillStyle=done?COLOR.done:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?COLOR.doneS:COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(done){ ctx.fillStyle=COLOR.doneT; ctx.font='700 12.5px "JetBrains Mono", monospace'; ctx.fillText('答案 = 4:{5} · {2,2,1} · {2,1,1,1} · {1×5} —— 外層換成金額就會變 9(排列)', w/2, ty+30); }
    else { ctx.fillStyle=COLOR.text; ctx.font='600 12.5px "Noto Sans TC", sans-serif'; ctx.fillText('i 遞增 → dp[i−coin] 已含「本輪硬幣」→ 同一枚可重複拿(完全背包)', w/2, ty+30); }
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
