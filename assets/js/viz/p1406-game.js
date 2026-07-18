/* ============================================================
   P1406 · Stone Game III — 賽局 DP(相對分差)· viz
   dp[i] = 「輪到我、從第 i 顆開始」時,我能領先對手的最大分差。
   我可拿 1/2/3 顆(和 take),之後換對手,他從 i+j+1 也會拿到他的最優 dp[i+j+1]。
   所以我的淨分差 = take − dp[i+j+1](減:因為那是「對手」的領先,對我是扣分)。
   dp[i] = max over j∈{0,1,2} ( take(i..i+j) − dp[i+j+1] )。base dp[n]=0。
   由後往前填;dp[0] > 0 → Alice、< 0 → Bob、= 0 → Tie。
   例 stones=[1,2,3,7] → dp=[-1,12,10,7,0],dp[0]=-1 → Bob
     BAND 1  stones[] 與 dp[](紅=本步 i · 藍=被減的對手 dp[next])
     BAND 2  三種拿法:take − dp[next]
     BAND 3  說明:減 = 換人,扣掉對手的領先
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

  const ST = [1, 2, 3, 7];
  const N = ST.length;               // 4
  const NIL = -999;
  // 每步:i、dp 快照(長度 N+1)、候選 [{take,next,val}]、winNext、taken:[起,迄]
  const steps = [
    { i:NIL, dp:[NIL,NIL,NIL,NIL,0], cand:[], winNext:NIL, taken:null,
      text:'<strong>INITIAL</strong> · <code>dp[i]</code> = 輪到我、從第 <code>i</code> 顆起,我能<strong>領先對手的最大分差</strong>。base <code>dp[n]=0</code>(沒石頭,平)。由後往前填。' },
    { i:3, dp:[NIL,NIL,NIL,7,0], cand:[{take:7,next:4,val:7}], winNext:4, taken:[3,3],
      text:'<code>i=3</code> · 只剩 1 顆,拿 <code>7</code>:<code>7 − dp[4] = 7 − 0 = 7</code>。<code>dp[3]=7</code>。' },
    { i:2, dp:[NIL,NIL,10,7,0], cand:[{take:3,next:3,val:-4},{take:10,next:4,val:10}], winNext:4, taken:[2,3],
      text:'<code>i=2</code> · 拿 2 顆(3+7=10)最好:<code>10 − dp[4] = 10</code> &gt; 拿 1 顆的 <code>3 − dp[3] = -4</code>。<code>dp[2]=10</code>。' },
    { i:1, dp:[NIL,12,10,7,0], cand:[{take:2,next:2,val:-8},{take:5,next:3,val:-2},{take:12,next:4,val:12}], winNext:4, taken:[1,3],
      text:'<code>i=1</code> · 拿 3 顆(2+3+7=12):<code>12 − dp[4] = 12</code>。<code>dp[1]=12</code>。' },
    { i:0, dp:[-1,12,10,7,0], cand:[{take:1,next:1,val:-11},{take:3,next:2,val:-7},{take:6,next:3,val:-1}], winNext:3, taken:[0,2], done:true,
      text:'<code>i=0</code> · 最好也只有 <code>6 − dp[3] = 6 − 7 = -1</code>。<code>dp[0]=-1 &lt; 0</code> → <strong>Bob 贏</strong>(Alice 先手仍落後 1)。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,h=canvas.clientHeight,PAD=26;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,h);
    const NC=N+1; const cw=Math.min(70,(w-2*PAD)/(NC+0.5)); const gx=(w-NC*cw)/2;
    const bestVal = s.cand.length? Math.max(...s.cand.map(c=>c.val)) : null;

    // BAND 1 · stones + dp
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · stones[] 與 dp[](紅=本步 i · 綠=本步拿走 · 藍=被減的對手 dp[next])', PAD, 24);
    const sy=48, schh=36, dy=104, dchh=44;
    // stones row (N cells)
    for(let k=0;k<N;k++){ const x=gx+k*cw; const inTake=(s.taken && k>=s.taken[0] && k<=s.taken[1]);
      ctx.fillStyle=COLOR.dim; ctx.font='700 10px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('s'+k, x+cw/2, sy-11);
      rr(x+4,sy,cw-8,schh,5);
      ctx.fillStyle=inTake?COLOR.done:COLOR.cell; ctx.fill();
      ctx.lineWidth=inTake?2.6:1.6; ctx.strokeStyle=inTake?COLOR.doneS:COLOR.cellS; ctx.stroke();
      ctx.fillStyle=inTake?COLOR.doneT:COLOR.ink; ctx.font='700 16px "JetBrains Mono", monospace';
      ctx.fillText(String(ST[k]), x+cw/2, sy+schh/2+1);
    }
    // dp row (N+1 cells)
    for(let k=0;k<NC;k++){ const x=gx+k*cw; const val=s.dp[k];
      const isCur=(k===s.i), isNext=(k===s.winNext && s.i!==NIL), filled=val!==NIL&&!isCur&&!isNext;
      ctx.fillStyle=COLOR.dim; ctx.font='700 10px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('dp'+k, x+cw/2, dy-12);
      rr(x+4,dy,cw-8,dchh,5);
      ctx.fillStyle=isCur?COLOR.cur:(isNext?COLOR.src:(filled?COLOR.done:COLOR.cell)); ctx.fill();
      ctx.lineWidth=isCur?3.2:(isNext?2.6:1.8); ctx.strokeStyle=isCur?COLOR.curS:(isNext?COLOR.srcS:(filled?COLOR.doneS:COLOR.cellS)); ctx.stroke();
      ctx.fillStyle=isCur?COLOR.curT:(isNext?COLOR.srcT:(filled?COLOR.doneT:COLOR.grid)); ctx.font='700 17px "JetBrains Mono", monospace';
      ctx.fillText(val===NIL?'·':String(val), x+cw/2, dy+dchh/2+1);
    }

    // BAND 2 · candidates
    const by=172;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 拿 1/2/3 顆:take − dp[next],取 max', PAD, by);
    const box=by+12, boxH=58; rr(PAD,box,w-PAD*2,boxH,6); ctx.fillStyle='#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=COLOR.grid; ctx.stroke();
    if(s.i===NIL){ ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillStyle=COLOR.text; ctx.font='600 13px "Noto Sans TC", sans-serif';
      ctx.fillText('每個 i,試拿 1/2/3 顆;拿完換對手 → 減掉他從 next 起能領先的 dp[next]', w/2, box+boxH/2); }
    else {
      const n=s.cand.length; const rowH=boxH/n;
      for(let r=0;r<n;r++){ const c=s.cand[r]; const yy=box+rowH*r+rowH/2; const win=(c.val===bestVal);
        ctx.textAlign='left'; ctx.textBaseline='middle';
        ctx.fillStyle=win?COLOR.doneT:COLOR.text; ctx.font=(win?'700 ':'600 ')+'13px "JetBrains Mono", monospace';
        ctx.fillText('拿 '+(r+1)+' 顆:  take '+c.take+' − dp['+c.next+']='+s.dp[c.next]+'  =  '+c.val+(win?'   ✓ 取這個':''), PAD+18, yy);
      }
    }

    // BAND 3 · note
    const ty=box+boxH+22, done=!!s.done;
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 為什麼是「減」dp[next]', PAD, ty);
    const nbox=ty+12, nboxH=40; rr(PAD,nbox,w-PAD*2,nboxH,6); ctx.fillStyle=done?COLOR.done:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?COLOR.doneS:COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(done){ ctx.fillStyle=COLOR.doneT; ctx.font='700 13px "JetBrains Mono", monospace'; ctx.fillText('dp[0] = -1 < 0 → Bob · 相對分差一個陣列搞定,不必分別記兩人分數', w/2, nbox+nboxH/2); }
    else { ctx.fillStyle=COLOR.text; ctx.font='600 12.5px "Noto Sans TC", sans-serif'; ctx.fillText('拿完就換對手當「我」→ dp[next] 是對手的領先,對我是扣分,所以用減', w/2, nbox+nboxH/2); }
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
