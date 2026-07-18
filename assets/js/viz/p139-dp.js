/* ============================================================
   P139 · Word Break — 序列切割 DP(逐步)· viz
   dp[i] = 前 i 個字元 s[0..i-1] 能否被切成字典詞。dp[0]=true(空串)。
   轉移:對每個結尾 i,試每個字典詞 w(長 L):
     若 dp[i-L] 為真 且 s[i-L..i] == w → dp[i]=true。
   關鍵:位置 i 當「外層」由小到大掃 —— 算 dp[i] 前,所有更短的 dp[j] 都已定案。
   例 s="leetcode", dict={"leet","code"} → dp[4]、dp[8] 為真,答案 true
     BAND 1  s 的字元(紅=本步嘗試的詞所覆蓋的區段)
     BAND 2  dp[](紅=本步 i · 藍=接上的前綴 dp[i-L])
     BAND 3  檢查:dp[i-L] && s[i-L..i]==w ?
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

  const S = 'leetcode';
  const N = S.length;   // 8
  const T = true, F = false;
  // dp 快照長度 N+1。span=[a,b) 是本步嘗試的字元區段;pred = i-L
  const steps = [
    { i:-1, dp:[T,F,F,F,F,F,F,F,F], span:null, pred:-1, word:null, ok:null,
      text:'<strong>INITIAL</strong> · <code>dp[i]</code> = 前 <code>i</code> 個字元能否被切成字典詞。<code>dp[0]=true</code>(空字串)。字典 = <code>{"leet","code"}</code>。' },
    { i:4, dp:[T,F,F,F,T,F,F,F,F], span:[0,4], pred:0, word:'leet', ok:true,
      text:'<code>i=4</code> · 試 <code>"leet"</code>(長 4):看 <code>dp[0]</code>(真)且 <code>s[0..4]="leet"</code> ✓ → <code>dp[4]=true</code>。' },
    { i:5, dp:[T,F,F,F,T,F,F,F,F], span:[1,5], pred:1, word:'leet/code', ok:false,
      text:'<code>i=5</code> · 兩個詞要接上都需要 <code>dp[1]</code> 或 <code>dp[3]</code> 為真,但它們是 <strong>false</strong> → <code>dp[5]</code> 維持 false。' },
    { i:8, dp:[T,F,F,F,T,F,F,F,T], span:[4,8], pred:4, word:'code', ok:true, done:true,
      text:'<code>i=8</code> · 試 <code>"code"</code>:看 <code>dp[4]</code>(真,前面已切成 "leet")且 <code>s[4..8]="code"</code> ✓ → <code>dp[8]=true</code>。答案 = <code>dp[n]</code> = <strong>true</strong>。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,h=canvas.clientHeight,PAD=26;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,h);
    const cw=Math.min(58,(w-2*PAD)/(N+1));

    // BAND 1 · string chars
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · s 的字元(紅框=本步嘗試的詞覆蓋的區段)', PAD, 24);
    const sgx=(w-N*cw)/2, sy=50, schh=38;
    for(let k=0;k<N;k++){ const x=sgx+k*cw; const inSpan=s.span && k>=s.span[0] && k<s.span[1];
      ctx.fillStyle=COLOR.dim; ctx.font='700 10px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(k), x+cw/2, sy-11);
      rr(x+3,sy,cw-6,schh,5);
      ctx.fillStyle=inSpan?(s.ok?COLOR.done:COLOR.cur):COLOR.cell; ctx.fill();
      ctx.lineWidth=inSpan?3:1.6; ctx.strokeStyle=inSpan?(s.ok?COLOR.doneS:COLOR.curS):COLOR.cellS; ctx.stroke();
      ctx.fillStyle=inSpan?(s.ok?COLOR.doneT:COLOR.curT):COLOR.ink; ctx.font='700 17px "JetBrains Mono", monospace';
      ctx.fillText(S[k], x+cw/2, sy+schh/2+1);
    }

    // BAND 2 · dp array
    const by=112;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · dp[](紅=本步 i · 藍=接上的前綴 dp[i-L] · 綠=已為真)', PAD, by);
    const NC=N+1; const dcw=Math.min(54,(w-2*PAD)/(NC+1)); const dgx=(w-NC*dcw)/2, dy=by+30, dchh=42;
    for(let k=0;k<NC;k++){ const x=dgx+k*dcw; const val=s.dp[k];
      const isCur=(k===s.i), isPred=(k===s.pred && s.pred>=0), isTrue=val&&!isCur&&!isPred;
      ctx.fillStyle=COLOR.dim; ctx.font='700 10px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(k), x+dcw/2, dy-12);
      rr(x+3,dy,dcw-6,dchh,5);
      ctx.fillStyle=isCur?COLOR.cur:(isPred?COLOR.src:(isTrue?COLOR.done:COLOR.cell)); ctx.fill();
      ctx.lineWidth=isCur?3.2:(isPred?2.6:1.8); ctx.strokeStyle=isCur?COLOR.curS:(isPred?COLOR.srcS:(isTrue?COLOR.doneS:COLOR.cellS)); ctx.stroke();
      ctx.fillStyle=isCur?COLOR.curT:(isPred?COLOR.srcT:(isTrue?COLOR.doneT:COLOR.grid)); ctx.font='700 15px "JetBrains Mono", monospace';
      ctx.fillText(val?'T':'F', x+dcw/2, dy+dchh/2+1);
    }

    // BAND 3 · check
    const ty=dy+dchh+24, done=!!s.done;
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 檢查  dp[i-L] && s[i-L..i] == w', PAD, ty);
    const box=ty+12, boxH=40; rr(PAD,box,w-PAD*2,boxH,6); ctx.fillStyle=done?COLOR.done:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?COLOR.doneS:COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(s.i<0){ ctx.fillStyle=COLOR.text; ctx.font='600 12.5px "Noto Sans TC", sans-serif'; ctx.fillText('位置 i 由小到大掃;每個 i 試所有字典詞,能接上就把 dp[i] 設 true', w/2, box+boxH/2); }
    else if(s.ok){ ctx.fillStyle=done?COLOR.doneT:COLOR.curT; ctx.font='700 13.5px "JetBrains Mono", monospace';
      ctx.fillText('dp['+s.pred+']=T 且 s['+s.span[0]+'..'+s.span[1]+']="'+s.word+'" ✓ → dp['+s.i+']=true', w/2, box+boxH/2); }
    else { ctx.fillStyle=COLOR.curT; ctx.font='700 13px "JetBrains Mono", monospace';
      ctx.fillText('沒有詞能接上(要求的 dp[i-L] 都是 false)→ dp['+s.i+'] 仍 false', w/2, box+boxH/2); }
  }

  function update(){ const s=steps[step]; if(stepEl) stepEl.textContent=String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0'); if(labelEl) labelEl.innerHTML=s.text; draw(); }
  function next(){ if(step<steps.length-1){step++;update();}else stop(); }
  function prev(){ if(step>0){step--;update();} }
  function reset(){ stop(); step=0; update(); }
  function play(){ if(timer){stop();return;} bPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){stop();return;} next(); },1900); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} if(bPlay) bPlay.textContent='Play'; }
  bPrev&&bPrev.addEventListener('click',prev); bNext&&bNext.addEventListener('click',next); bPlay&&bPlay.addEventListener('click',play); bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();}); if(window.ResizeObserver){ new ResizeObserver(()=>{fit();draw();}).observe(canvas); }
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw); fit(); update();
})();
