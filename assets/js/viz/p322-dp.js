/* ============================================================
   P322 · Coin Change — 完全背包(逐步)· viz
   dp[i] = 湊出金額 i 所需的最少硬幣數。dp[0]=0,其餘先設 ∞。
   轉移:對每種硬幣 c(可重複用),dp[i] = min(dp[i], dp[i-c] + 1)。
   等價於:dp[i] = min over 所有 c<=i 的 ( dp[i-c] + 1 )。
   例 coins={1,2,5}, amount=6 → dp=[0,1,1,2,2,1,2],答案 2(5+1)
     BAND 1  dp[] 陣列(珊瑚=本步 · 藍=各硬幣的來源 dp[i-c])
     BAND 2  dp[i] = min over coins ( dp[i-c] + 1 )
     BAND 3  說明:完全背包 → 用 dp[i-c] 允許重複
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

  const COINS = [1, 2, 5];
  const AMT = 6;
  const INF = -1;                    // 用 -1 代表 ∞ / 未填
  const steps = [
    { dp:[0,INF,INF,INF,INF,INF,INF], cur:INF,
      text:'<strong>INITIAL</strong> · <code>dp[i]</code> = 湊出金額 <code>i</code> 的最少硬幣數。<code>dp[0]=0</code>(湊 0 不用硬幣),其餘先設 ∞。硬幣 <code>{1,2,5}</code> 可<strong>重複</strong>使用。' },
    { dp:[0,1,INF,INF,INF,INF,INF], cur:1,
      text:'<code>dp[1] = dp[0]+1 = 1</code>(用一枚 1)。只有硬幣 1 ≤ 1 可用。' },
    { dp:[0,1,1,INF,INF,INF,INF], cur:2,
      text:'<code>dp[2] = min(dp[1]+1, dp[0]+1) = min(2, 1) = 1</code>。用一枚 <strong>2</strong> 最省。' },
    { dp:[0,1,1,2,INF,INF,INF], cur:3,
      text:'<code>dp[3] = min(dp[2]+1, dp[1]+1) = min(2, 2) = 2</code>(1+2)。' },
    { dp:[0,1,1,2,2,INF,INF], cur:4,
      text:'<code>dp[4] = min(dp[3]+1, dp[2]+1) = min(3, 2) = 2</code>(2+2)。' },
    { dp:[0,1,1,2,2,1,INF], cur:5,
      text:'<code>dp[5] = min(dp[4]+1, dp[3]+1, dp[0]+1) = min(3,3,1) = 1</code>。用一枚 <strong>5</strong>!' },
    { dp:[0,1,1,2,2,1,2], cur:6, done:true,
      text:'<code>dp[6] = min(dp[5]+1, dp[4]+1, dp[1]+1) = min(2,3,2) = 2</code>。回傳 <code>dp[6] = 2</code>(5+1)。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function sources(i, dp){ // 回傳 [{c, idx, cand}] for coins usable at i
    const out=[]; for(const c of COINS){ if(c<=i && dp[i-c]!==INF) out.push({c, idx:i-c, cand:dp[i-c]+1}); } return out;
  }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,h=canvas.clientHeight,PAD=26;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,h);
    const i=s.cur; const srcs = i===INF?[] : sources(i, s.dp); const srcSet=new Set(srcs.map(o=>o.idx));

    // ── BAND 1 header + coins
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · dp[i] = 湊出金額 i 的最少硬幣數  ·  coins = {1, 2, 5}(可重複)', PAD, 24);

    // dp array
    const NC=AMT+1; const cw=Math.min(64,(w-2*PAD)/(NC+1)); const gx=(w-NC*cw)/2, gy=78, chh=46;
    for(let k=0;k<NC;k++){ const x=gx+k*cw; const val=s.dp[k];
      const isCur=(k===i), isSrc=srcSet.has(k), filled=val!==INF&&!isCur&&!isSrc;
      ctx.fillStyle=COLOR.dim; ctx.font='700 11px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(k), x+cw/2, gy-14);
      rr(x+4,gy,cw-8,chh,5);
      ctx.fillStyle=isCur?COLOR.cur:(isSrc?COLOR.src:(filled?COLOR.done:COLOR.cell)); ctx.fill();
      ctx.lineWidth=isCur?3.2:1.8; ctx.strokeStyle=isCur?COLOR.curS:(isSrc?COLOR.srcS:(filled?COLOR.doneS:COLOR.cellS)); ctx.stroke();
      ctx.fillStyle=isCur?COLOR.curT:(isSrc?COLOR.srcT:(filled?COLOR.doneT:COLOR.grid)); ctx.font='700 20px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(val===INF?'∞':String(val), x+cw/2, gy+chh/2+1);
    }

    // ── BAND 2 · min equation
    const by=150;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 轉移  dp[i] = min over coins ( dp[i-c] + 1 )', PAD, by);
    const eqBox=by+12, ebH=46; rr(PAD,eqBox,w-PAD*2,ebH,6); ctx.fillStyle='#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(i===INF){ ctx.fillStyle=COLOR.text; ctx.font='600 13px "Noto Sans TC", sans-serif'; ctx.fillText('每個金額 i:試每種硬幣 c,看「先湊好 i-c、再放一枚 c」哪個最省', w/2, eqBox+ebH/2); }
    else {
      const best=Math.min(...srcs.map(o=>o.cand));
      const terms=srcs.map(o=>`dp[${o.idx}]+1=${o.cand}`).join('  ,  ');
      ctx.fillStyle=s.done?COLOR.doneT:COLOR.curT; ctx.font='700 15px "JetBrains Mono", monospace';
      ctx.fillText(`dp[${i}] = min( ${terms} ) = ${best}`, w/2, eqBox+ebH/2);
    }

    // ── BAND 3 · note
    const ty=eqBox+ebH+22, done=!!s.done;
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 為什麼用 dp[i-c](完全背包)', PAD, ty);
    const box=ty+12, boxH=40; rr(PAD,box,w-PAD*2,boxH,6); ctx.fillStyle=done?COLOR.done:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?COLOR.doneS:COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(done){ ctx.fillStyle=COLOR.doneT; ctx.font='700 13px "JetBrains Mono", monospace'; ctx.fillText('湊不到就是 ∞ → 回傳 -1;硬幣無限量 → 放完 c 仍可再放 c', w/2, box+boxH/2); }
    else { ctx.fillStyle=COLOR.text; ctx.font='600 12.5px "Noto Sans TC", sans-serif'; ctx.fillText('硬幣可重複用,所以接的是同一層的 dp[i-c](不是「用過就不能再用」的上一層)', w/2, box+boxH/2); }
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
