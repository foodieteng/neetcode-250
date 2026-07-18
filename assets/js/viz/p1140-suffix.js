/* ============================================================
   P1140 · Stone Game II — dp[i][m] + 後綴和 · viz
   dp[i][m] = 輪到我、面對 piles[i..]、當前 M=m 時,我能拿到的「最多石頭」。
   suffixSum[i] = piles[i..] 的總和。
   關鍵恆等式:我拿前 x 堆後,對手在 piles[i+x..] 玩同一局、拿到 dp[i+x][max(m,x)];
     從第 i 堆之後「不是對手的」全是我的 → 我的 = suffixSum[i] − dp[i+x][max(m,x)]。
   ── base:i + 2m ≥ n → 一次拿光 → dp[i][m] = suffixSum[i]
   ── general:dp[i][m] = max_{x=1..2m} ( suffixSum[i] − dp[i+x][max(m,x)] )
   piles=[2,7,9,4,4],suffixSum=[26,24,17,8,4],答案 dp[0][1]=10。
     BAND 1  piles + suffixSum
     BAND 2  本步:我拿前 x 堆,我的 = suffixSum[i] − 對手(dp[i+x][…])
     BAND 3  遞推式:base vs general
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
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424', done:'#d9e8c7', doneS:'#5fa866', doneT:'#3f7a3a',
    grey:'#eeeeea', greyS:'#d5d5cf', greyT:'#b0b0a8', coral:'#cf3535' };

  const P = [2,7,9,4,4], N = 5;
  const SUF = [26,24,17,8,4];

  // 每步:i,m 當前;take = 拿幾堆 x(base 時 = 全部);branch: 'base'|'general'|'answer'
  const steps = [
    { i:0, m:1, take:0, branch:'intro',
      text:'<strong>INITIAL</strong> · <code>piles=[2,7,9,4,4]</code>。<code>dp[i][m]</code> = 輪到我、面對 <code>piles[i..]</code>、當前 <code>M=m</code> 時,我能拿到的<strong>最多石頭</strong>。下方是 <code>suffixSum</code>(後綴和)。目標 <code>dp[0][1]</code>。' },
    { i:3, m:1, take:2, base:true, branch:'base', baseVal:8,
      text:'<strong>BASE</strong> · 當 <code>i + 2m ≥ n</code>(拿得到底),直接<strong>一次拿光</strong>。例 <code>dp[3][1]</code>:<code>i=3, 2m=2, 3+2=5 ≥ 5</code> → 拿走 <code>[4,4]</code> → <code>dp[3][1] = suffixSum[3] = 8</code>。' },
    { i:0, m:1, take:1, branch:'general', oppI:1, oppM:1, oppVal:16, mine:10,
      text:'<strong>GENERAL · x=1</strong> · 求 <code>dp[0][1]</code>。我拿前 <strong>1</strong> 堆 <code>[2]</code> → 對手面對 <code>[7,9,4,4]</code>、<code>M=max(1,1)=1</code>,拿 <code>dp[1][1]=16</code>。<strong>我的 = suffixSum[0] − 16 = 26 − 16 = 10</strong>。' },
    { i:0, m:1, take:2, branch:'general', oppI:2, oppM:2, oppVal:17, mine:9,
      text:'<strong>GENERAL · x=2</strong> · 改拿前 <strong>2</strong> 堆 <code>[2,7]</code> → 對手面對 <code>[9,4,4]</code>、<code>M=max(1,2)=2</code>,拿 <code>dp[2][2]=17</code>。<strong>我的 = 26 − 17 = 9</strong>。比 x=1 少。' },
    { i:0, m:1, take:1, branch:'answer', mine:10, done:true,
      text:'<strong>ANSWER</strong> · <code>dp[0][1] = max(10, 9) = </code><strong>10</strong>。拿 1 堆反而最好 —— 因為拿越多,對手的 <code>M</code> 越大、下一步能搶越多。這就是 <code>max(m,x)</code> 的代價。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,h=canvas.clientHeight,PAD=26;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,h);
    const done=!!s.done;

    // ── BAND 1 · piles + suffixSum ──
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · piles(紅=我拿的 x 堆 · 藍=留給對手的局面 · 灰=第 i 堆之前)', PAD, 22);

    const cell=Math.min(74,(w-2*PAD)/N), gx=(w-N*cell)/2, gy=46, chh=42;
    for(let k=0;k<N;k++){
      const x=gx+k*cell;
      const before=(k<s.i), taken=(k>=s.i && k<s.i+(s.base? (N-s.i) : s.take)), opp=(!before && !taken);
      // 欄標 index
      ctx.fillStyle=COLOR.dim; ctx.font='700 10px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('['+k+']', x+cell/2, gy-9);
      rr(x+4,gy,cell-8,chh,6);
      let bg=COLOR.src,bd=COLOR.srcS,tc=COLOR.srcT;
      if(before){ bg=COLOR.grey; bd=COLOR.greyS; tc=COLOR.greyT; }
      else if(taken){ bg=COLOR.cur; bd=COLOR.curS; tc=COLOR.curT; }
      if(s.branch==='intro'){ bg=COLOR.cell; bd=COLOR.cellS; tc=COLOR.text; }
      ctx.fillStyle=bg; ctx.fill(); ctx.lineWidth=(taken)?2.8:1.6; ctx.strokeStyle=bd; ctx.stroke();
      ctx.fillStyle=tc; ctx.font='700 18px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(P[k]), x+cell/2, gy+chh/2);
      // suffixSum 徽章
      ctx.fillStyle=COLOR.dim; ctx.font='600 10.5px "JetBrains Mono", monospace';
      ctx.fillText('Σ'+SUF[k], x+cell/2, gy+chh+13);
    }

    // ── BAND 2 · current computation ──
    const by=128;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 我的 = suffixSum[i] − 對手在剩下那段拿的', PAD, by);

    const boxY=by+10, bH=62;
    rr(PAD,boxY,w-PAD*2,bH,7);
    const bBg = s.branch==='base'?COLOR.done : (done?COLOR.done:'#fafaf6');
    const bBd = s.branch==='base'?COLOR.doneS : (done?COLOR.doneS:COLOR.grid);
    ctx.fillStyle=bBg; ctx.fill(); ctx.lineWidth=1.8; ctx.strokeStyle=bBd; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(s.branch==='intro'){
      ctx.fillStyle=COLOR.text; ctx.font='600 13px "Noto Sans TC", sans-serif';
      ctx.fillText('suffixSum[i] = piles[i..] 的總和 · 一次算好,轉移就能 O(1) 取「剩下總共多少」', w/2, boxY+bH/2);
    } else if(s.branch==='base'){
      ctx.fillStyle=COLOR.doneT; ctx.font='700 15px "JetBrains Mono", monospace';
      ctx.fillText('i + 2m ≥ n → 一次拿光 → dp[3][1] = suffixSum[3] = 8', w/2, boxY+bH/2);
    } else if(s.branch==='answer'){
      ctx.fillStyle=COLOR.doneT; ctx.font='700 14px "JetBrains Mono", monospace';
      ctx.fillText('x=1 給 10 · x=2 給 9', w/2, boxY+18);
      ctx.font='700 17px "JetBrains Mono", monospace';
      ctx.fillText('dp[0][1] = max(10, 9) = 10', w/2, boxY+44);
    } else {
      ctx.fillStyle=COLOR.text; ctx.font='700 14px "JetBrains Mono", monospace';
      ctx.fillText('我拿前 '+s.take+' 堆 → 對手 dp['+s.oppI+']['+s.oppM+'] = '+s.oppVal, w/2, boxY+18);
      ctx.fillStyle=done?COLOR.doneT:COLOR.curT; ctx.font='700 16px "JetBrains Mono", monospace';
      ctx.fillText('我的 = suffixSum[0] − '+s.oppVal+' = 26 − '+s.oppVal+' = '+s.mine, w/2, boxY+44);
    }

    // ── BAND 3 · recurrence ──
    const ty=228;
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 遞推式:base 一次拿光 / general 枚舉 x', PAD, ty);
    // two boxes
    const bw2=(w-2*PAD-12)/2, y3=ty+10, h3=54;
    // base box
    const baseAct=(s.branch==='base');
    rr(PAD,y3,bw2,h3,7); ctx.fillStyle=baseAct?COLOR.done:'#fafaf6'; ctx.fill(); ctx.lineWidth=baseAct?2.4:1.5; ctx.strokeStyle=baseAct?COLOR.doneS:COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillStyle=baseAct?COLOR.doneT:COLOR.text; ctx.font='700 12px "JetBrains Mono", monospace';
    ctx.fillText('i + 2m ≥ n', PAD+bw2/2, y3+18);
    ctx.font='600 11.5px "Noto Sans TC", sans-serif'; ctx.fillStyle=baseAct?COLOR.doneT:COLOR.dim;
    ctx.fillText('dp[i][m] = suffixSum[i]', PAD+bw2/2, y3+38);
    // general box
    const genAct=(s.branch==='general'||s.branch==='answer');
    const gx3=PAD+bw2+12;
    rr(gx3,y3,bw2,h3,7); ctx.fillStyle=genAct?COLOR.cur:'#fafaf6'; ctx.fill(); ctx.lineWidth=genAct?2.4:1.5; ctx.strokeStyle=genAct?COLOR.curS:COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillStyle=genAct?COLOR.curT:COLOR.text; ctx.font='700 12px "JetBrains Mono", monospace';
    ctx.fillText('否則 · x = 1..2m', gx3+bw2/2, y3+18);
    ctx.font='600 11px "JetBrains Mono", monospace'; ctx.fillStyle=genAct?COLOR.curT:COLOR.dim;
    ctx.fillText('max( suffixSum[i] − dp[i+x][max(m,x)] )', gx3+bw2/2, y3+38);
  }

  function update(){ const s=steps[step]; if(stepEl) stepEl.textContent=String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0'); if(labelEl) labelEl.innerHTML=s.text; draw(); }
  function next(){ if(step<steps.length-1){step++;update();}else stop(); }
  function prev(){ if(step>0){step--;update();} }
  function reset(){ stop(); step=0; update(); }
  function play(){ if(timer){stop();return;} bPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){stop();return;} next(); },2000); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} if(bPlay) bPlay.textContent='Play'; }
  bPrev&&bPrev.addEventListener('click',prev); bNext&&bNext.addEventListener('click',next); bPlay&&bPlay.addEventListener('click',play); bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();}); if(window.ResizeObserver){ new ResizeObserver(()=>{fit();draw();}).observe(canvas); }
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw); fit(); update();
})();
