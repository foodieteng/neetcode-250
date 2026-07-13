/* ============================================================
   P279 · Perfect Squares — 完全背包(硬幣=平方數)· viz
   dp[i] = 湊出 i 所需的最少「完全平方數」個數。dp[0]=0,其餘 ∞。
   轉移:對每個平方數 k=j²(k<=i),dp[i] = min(dp[i], dp[i-k] + 1)。
   這就是 322 零錢兌換,把硬幣換成 {1,4,9,16,…}(≤ n 的平方數)。
   例 n=12 → dp=[0,1,2,3,1,2,3,4,2,1,2,3,3],答案 3(4+4+4)
     BAND 1  dp[](珊瑚=本步 · 藍=各平方數的來源 dp[i-k])
     BAND 2  dp[i] = min over 平方數 ( dp[i-k] + 1 )
     BAND 3  說明:= 322 換平方硬幣;Lagrange 答案永遠 ≤ 4
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

  const N = 12;
  const SQ = [1, 4, 9];              // ≤ 12 的平方數
  const INF = -1;
  // 完整 dp = [0,1,2,3,1,2,3,4,2,1,2,3,3]
  const FULL = [0,1,2,3,1,2,3,4,2,1,2,3,3];
  function upto(i){ const a=new Array(N+1).fill(INF); for(let k=0;k<=i;k++) a[k]=FULL[k]; return a; }
  const steps = [
    { dp:upto(0), cur:INF,
      text:'<strong>INITIAL</strong> · <code>dp[i]</code> = 湊出 <code>i</code> 的最少平方數個數。<code>dp[0]=0</code>,其餘 ∞。可用平方數 = <code>{1, 4, 9}</code>(≤ 12)。' },
    { dp:upto(4), cur:4,
      text:'<code>dp[4] = min(dp[3]+1, dp[0]+1) = min(4, 1) = 1</code>。用一個 <strong>4</strong> = 2²,最省。' },
    { dp:upto(9), cur:9,
      text:'<code>dp[9] = min(dp[8]+1, dp[5]+1, dp[0]+1) = min(3,3,1) = 1</code>。用一個 <strong>9</strong> = 3²。' },
    { dp:upto(12), cur:12, done:true,
      text:'<code>dp[12] = min(dp[11]+1, dp[8]+1, dp[3]+1) = min(4,3,4) = 3</code>。回傳 <strong>3</strong>(4+4+4)。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function srcs(i, dp){ const out=[]; for(const k of SQ){ if(k<=i && dp[i-k]!==INF) out.push({k, idx:i-k, cand:dp[i-k]+1}); } return out; }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,h=canvas.clientHeight,PAD=26;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,h);
    const i=s.cur; const srcList = i===INF?[] : srcs(i, s.dp); const srcSet=new Set(srcList.map(o=>o.idx));

    // BAND 1 · dp
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · dp[i] = 湊出 i 的最少平方數個數  ·  平方硬幣 = {1, 4, 9}', PAD, 24);
    const NC=N+1; const cw=Math.min(48,(w-2*PAD)/(NC+0.5)); const gx=(w-NC*cw)/2, gy=76, chh=46;
    for(let k=0;k<NC;k++){ const x=gx+k*cw; const val=s.dp[k];
      const isCur=(k===i), isSrc=srcSet.has(k), filled=val!==INF&&!isCur&&!isSrc;
      ctx.fillStyle=COLOR.dim; ctx.font='700 10px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(k), x+cw/2, gy-13);
      rr(x+3,gy,cw-6,chh,5);
      ctx.fillStyle=isCur?COLOR.cur:(isSrc?COLOR.src:(filled?COLOR.done:COLOR.cell)); ctx.fill();
      ctx.lineWidth=isCur?3.2:1.8; ctx.strokeStyle=isCur?COLOR.curS:(isSrc?COLOR.srcS:(filled?COLOR.doneS:COLOR.cellS)); ctx.stroke();
      ctx.fillStyle=isCur?COLOR.curT:(isSrc?COLOR.srcT:(filled?COLOR.doneT:COLOR.grid)); ctx.font='700 17px "JetBrains Mono", monospace';
      ctx.fillText(val===INF?'∞':String(val), x+cw/2, gy+chh/2+1);
    }

    // BAND 2 · min equation
    const by=150;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 轉移  dp[i] = min over 平方數 k=j² ( dp[i-k] + 1 )', PAD, by);
    const eqBox=by+12, ebH=46; rr(PAD,eqBox,w-PAD*2,ebH,6); ctx.fillStyle='#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(i===INF){ ctx.fillStyle=COLOR.text; ctx.font='600 13px "Noto Sans TC", sans-serif'; ctx.fillText('每個 i,試每個平方數 k:「先湊好 i-k、再放一個 k」哪個最省', w/2, eqBox+ebH/2); }
    else { const best=Math.min(...srcList.map(o=>o.cand)); const terms=srcList.map(o=>`dp[${o.idx}]+1=${o.cand}`).join('  ,  ');
      ctx.fillStyle=s.done?COLOR.doneT:COLOR.curT; ctx.font='700 14px "JetBrains Mono", monospace';
      ctx.fillText(`dp[${i}] = min( ${terms} ) = ${best}`, w/2, eqBox+ebH/2); }

    // BAND 3 · note
    const ty=eqBox+ebH+22, done=!!s.done;
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 就是 322,把硬幣換成平方數', PAD, ty);
    const box=ty+12, boxH=40; rr(PAD,box,w-PAD*2,boxH,6); ctx.fillStyle=done?COLOR.done:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?COLOR.doneS:COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(done){ ctx.fillStyle=COLOR.doneT; ctx.font='700 13px "JetBrains Mono", monospace'; ctx.fillText('完全背包 min · 平方數可重複用 · Lagrange 四平方和 → 答案永遠是 1~4', w/2, box+boxH/2); }
    else { ctx.fillStyle=COLOR.text; ctx.font='600 12.5px "Noto Sans TC", sans-serif'; ctx.fillText('和 322 一字不差:硬幣集合換成 {1,4,9,16,…},min 對迴圈順序免疫', w/2, box+boxH/2); }
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
