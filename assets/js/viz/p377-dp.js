/* ============================================================
   P377 · Combination Sum IV — 排列計數 DP(逐步)· viz
   dp[i] = 用 nums 湊出 i 的「排列數」(順序算數,(1,2)與(2,1)不同)。dp[0]=1。
   轉移:dp[i] = Σ over num ( dp[i-num] ),對每個 num<=i 累加。
   為什麼是排列:外層跑「金額 i」、內層跑「num」,等於枚舉「最後一個數是誰」,
   同一組數的不同結尾順序都被分開數 → 排列。(322/518 是硬幣外層 → 組合)
   例 nums=[1,2,3], target=4 → dp=[1,1,2,4,7],答案 7
     BAND 1  dp[](紅=本步 i · 藍=各 num 的來源 dp[i-num])
     BAND 2  dp[i] = Σ dp[i-num]
     BAND 3  說明:target 外層 → 排列(順序算數)
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

  const NUMS = [1, 2, 3];
  const TGT = 4;
  const NIL = -1;
  const steps = [
    { dp:[1,NIL,NIL,NIL,NIL], cur:NIL,
      text:'<strong>INITIAL</strong> · <code>dp[i]</code> = 湊出 <code>i</code> 的<strong>排列數</strong>(順序算數)。<code>dp[0]=1</code>(空排列)。nums = <code>{1,2,3}</code>。' },
    { dp:[1,1,NIL,NIL,NIL], cur:1,
      text:'<code>dp[1] = dp[0] = 1</code>(只有 num=1 ≤ 1)。排列:(1)。' },
    { dp:[1,1,2,NIL,NIL], cur:2,
      text:'<code>dp[2] = dp[1] + dp[0] = 1 + 1 = 2</code>。排列:(1,1)、(2)。' },
    { dp:[1,1,2,4,NIL], cur:3,
      text:'<code>dp[3] = dp[2] + dp[1] + dp[0] = 2+1+1 = 4</code>。三項對應「最後一個數是 1 / 2 / 3」。' },
    { dp:[1,1,2,4,7], cur:4, done:true,
      text:'<code>dp[4] = dp[3] + dp[2] + dp[1] = 4+2+1 = 7</code>。回傳 <strong>7</strong>。含 (1,2,1)、(2,1,1) 等<strong>不同順序分開數</strong>。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function srcs(i, dp){ const out=[]; for(const num of NUMS){ if(num<=i && dp[i-num]!==NIL) out.push(i-num); } return out; }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,h=canvas.clientHeight,PAD=26;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,h);
    const i=s.cur; const srcList = i===NIL?[] : srcs(i,s.dp); const srcSet=new Set(srcList);

    // BAND 1 · dp
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · dp[i] = 湊出 i 的排列數  ·  nums = {1, 2, 3}', PAD, 24);
    const NC=TGT+1; const cw=Math.min(66,(w-2*PAD)/(NC+1)); const gx=(w-NC*cw)/2, gy=76, chh=46;
    for(let k=0;k<NC;k++){ const x=gx+k*cw; const val=s.dp[k];
      const isCur=(k===i), isSrc=srcSet.has(k), filled=val!==NIL&&!isCur&&!isSrc;
      ctx.fillStyle=COLOR.dim; ctx.font='700 11px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(k), x+cw/2, gy-14);
      rr(x+4,gy,cw-8,chh,5);
      ctx.fillStyle=isCur?COLOR.cur:(isSrc?COLOR.src:(filled?COLOR.done:COLOR.cell)); ctx.fill();
      ctx.lineWidth=isCur?3.2:1.8; ctx.strokeStyle=isCur?COLOR.curS:(isSrc?COLOR.srcS:(filled?COLOR.doneS:COLOR.cellS)); ctx.stroke();
      ctx.fillStyle=isCur?COLOR.curT:(isSrc?COLOR.srcT:(filled?COLOR.doneT:COLOR.grid)); ctx.font='700 21px "JetBrains Mono", monospace';
      ctx.fillText(val===NIL?'·':String(val), x+cw/2, gy+chh/2+1);
    }

    // BAND 2 · sum equation
    const by=150;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 轉移  dp[i] = Σ dp[i-num]  (對每個 num)', PAD, by);
    const eqBox=by+12, ebH=46; rr(PAD,eqBox,w-PAD*2,ebH,6); ctx.fillStyle='#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(i===NIL){ ctx.fillStyle=COLOR.text; ctx.font='600 13px "Noto Sans TC", sans-serif'; ctx.fillText('每個金額 i,對每個 num 把 dp[i-num] 加起來 = 「最後一個數是 num」的排列數', w/2, eqBox+ebH/2); }
    else { const terms=srcList.map(idx=>`dp[${idx}]=${s.dp[idx]}`).join(' + '); const sum=srcList.reduce((a,idx)=>a+s.dp[idx],0);
      ctx.fillStyle=s.done?COLOR.doneT:COLOR.curT; ctx.font='700 16px "JetBrains Mono", monospace';
      ctx.fillText(`dp[${i}] = ${terms} = ${sum}`, w/2, eqBox+ebH/2); }

    // BAND 3 · note
    const ty=eqBox+ebH+22, done=!!s.done;
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 為什麼是「排列」(順序算數)', PAD, ty);
    const box=ty+12, boxH=40; rr(PAD,box,w-PAD*2,boxH,6); ctx.fillStyle=done?COLOR.done:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?COLOR.doneS:COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(done){ ctx.fillStyle=COLOR.doneT; ctx.font='700 13px "JetBrains Mono", monospace'; ctx.fillText('target 外層、num 內層 → 每個位置都能挑任何 num → (1,2) 與 (2,1) 分開數 = 排列', w/2, box+boxH/2); }
    else { ctx.fillStyle=COLOR.text; ctx.font='600 12.5px "Noto Sans TC", sans-serif'; ctx.fillText('外層是金額、內層是 num:等於枚舉「最後一個數是誰」→ 不同結尾順序都分開算', w/2, box+boxH/2); }
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
