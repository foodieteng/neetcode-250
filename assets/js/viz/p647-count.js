/* ============================================================
   P647 · Palindromic Substrings — 區間 DP 計數(逐步)· viz
   和 5 用同一張 dp 表:dp[i][j] = s[i..j] 是回文嗎?
   差別只在:不是「記最長」,而是「每遇到一個 true 就 res++」。
   每個為真的 (i,j) 恰對應一個回文子字串 → 掃完整張表累加即總數。
   例 s="aaa":每個子字串都是回文 → 3(長1) + 2(長2) + 1(長3) = 6
     BAND 1  dp[i][j] 表格(綠=回文 · 珊瑚=本步新增 · 藍=依賴的內層)
     右側     遞迴式 + 累計計數 res
     BAND 2  說明:true 格數 = 回文子串數
   ============================================================ */
(function () {
  const canvas = document.getElementById('viz-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('viz-step'), labelEl = document.getElementById('viz-label');
  const bPrev = document.getElementById('viz-prev'), bNext = document.getElementById('viz-next'),
        bPlay = document.getElementById('viz-play'), bReset = document.getElementById('viz-reset');

  const COLOR = { paper:'#ffffff', ink:'#1a1a1a', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf',
    cell:'#fafaf6', cellS:'#cfcfcf', nil:'#f3f3ef', nilS:'#e2e2dc',
    src:'#dbe8f6', srcS:'#4478c0', srcT:'#2f5f9e',
    cur:'#fbe7df', curS:'#d96e4e', curT:'#b3502f', done:'#d9e8c7', doneS:'#5fa866', doneT:'#3f7a3a', coral:'#d96e4e' };

  const S = 'aaa';
  const N = S.length;                 // 3
  const NILV = -1, F = 0, T = 1;
  function sub(i, j){ return S.slice(i, j + 1); }

  const steps = [
    { diagL:0, cur:null, inner:null, res:0, delta:'',
      g:[[NILV,NILV,NILV],[NILV,NILV,NILV],[NILV,NILV,NILV]],
      text:'<strong>INITIAL</strong> · <code>dp[i][j]</code> = <code>s[i..j]</code> 是回文嗎?和 5 同一張表,但這次<strong>每遇到一個 true 就 res++</strong>。' },
    { diagL:1, cur:null, inner:null, res:3, delta:'+3(長度 1)',
      g:[[T,NILV,NILV],[NILV,T,NILV],[NILV,NILV,T]],
      text:'<strong>長度 1</strong> · 三個單字元都是回文 → <code>res = 3</code>。' },
    { diagL:2, cur:null, inner:null, res:5, delta:'+2(長度 2)',
      g:[[T,T,NILV],[NILV,T,T],[NILV,NILV,T]],
      text:'<strong>長度 2</strong> · <code>"aa"</code>(0..1)與 <code>"aa"</code>(1..2)頭尾都相同 → 再 +2,<code>res = 5</code>。' },
    { diagL:3, cur:{i:0,j:2}, inner:{i:1,j:1}, res:6, delta:'+1(長度 3)', done:true,
      g:[[T,T,T],[NILV,T,T],[NILV,NILV,T]],
      text:'<strong>長度 3</strong> · <code>dp[0][2]</code>:<code>a==a</code> 且內層 <code>dp[1][1]</code> 是回文 → <code>"aaa"</code> ✓,<code>res = 6</code>。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,h=canvas.clientHeight,PAD=26;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,h);

    // ── BAND 1 header
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · dp[i][j]:s[i..j] 是回文嗎?(綠=是 · 珊瑚=本步新增 · 藍=依賴的內層)', PAD, 24);

    // ── grid (left)
    const cell=48, gx=84, gy=80;
    for(let j=0;j<N;j++){ const cx=gx+j*cell+cell/2;
      ctx.fillStyle=COLOR.dim; ctx.font='700 11px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('j='+j, cx, gy-28);
      ctx.fillStyle=COLOR.text; ctx.font='700 16px "JetBrains Mono", monospace';
      ctx.fillText(S[j], cx, gy-12);
    }
    for(let i=0;i<N;i++){ const cy=gy+i*cell+cell/2;
      ctx.fillStyle=COLOR.dim; ctx.font='700 11px "JetBrains Mono", monospace'; ctx.textAlign='right'; ctx.textBaseline='middle';
      ctx.fillText('i='+i, gx-18, cy-8);
      ctx.fillStyle=COLOR.text; ctx.font='700 16px "JetBrains Mono", monospace';
      ctx.fillText(S[i], gx-24, cy+10);
    }
    for(let i=0;i<N;i++) for(let j=0;j<N;j++){
      if(j<i) continue;
      const x=gx+j*cell, y=gy+i*cell; const val=s.g[i][j];
      const isCur = s.cur && s.cur.i===i && s.cur.j===j;
      const isInner = s.inner && s.inner.i===i && s.inner.j===j;
      const onDiag = (j-i+1)===s.diagL && val!==NILV;
      rr(x+3,y+3,cell-6,cell-6,5);
      let fill=COLOR.nil, stroke=COLOR.nilS, txt=COLOR.dim, lw=1.6;
      if(isCur){ fill=COLOR.cur; stroke=COLOR.curS; txt=COLOR.curT; lw=3.2; }
      else if(isInner){ fill=COLOR.src; stroke=COLOR.srcS; txt=COLOR.srcT; lw=3; }
      else if(val===T){ fill=COLOR.done; stroke=COLOR.doneS; txt=COLOR.doneT; lw=1.8; }
      else if(val===F){ fill=COLOR.cell; stroke=COLOR.cellS; txt=COLOR.dim; lw=1.6; }
      ctx.fillStyle=fill; ctx.fill();
      if(onDiag && !isCur && !isInner){ stroke=COLOR.curS; lw=2.6; }
      ctx.lineWidth=lw; ctx.strokeStyle=stroke; ctx.stroke();
      if(val!==NILV){
        ctx.fillStyle=txt; ctx.font='700 13px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(sub(i,j), x+cell/2, y+cell/2);
      }
    }

    // ── right panel
    const px=gx+N*cell+44, pw=w-PAD-px, done=!!s.done;
    // recurrence
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('遞迴式(同 LC 5)', px, 68);
    rr(px,80,pw,56,6); ctx.fillStyle='#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=COLOR.grid; ctx.stroke();
    ctx.textAlign='left'; ctx.textBaseline='middle';
    ctx.fillStyle=COLOR.text; ctx.font='700 12px "JetBrains Mono", monospace';
    ctx.fillText('dp[i][j] =', px+14, 100);
    ctx.fillStyle=COLOR.srcT; ctx.font='600 11.5px "JetBrains Mono", monospace';
    ctx.fillText('s[i]==s[j] 且 dp[i+1][j-1]', px+14, 120);

    // running count
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textBaseline='alphabetic';
    ctx.fillText('累計回文子串數 res', px, 162);
    rr(px,174,pw,64,6); ctx.fillStyle=done?COLOR.done:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?COLOR.doneS:COLOR.grid; ctx.stroke();
    ctx.textAlign='left'; ctx.textBaseline='middle';
    ctx.fillStyle=done?COLOR.doneT:COLOR.curT; ctx.font='700 30px "JetBrains Mono", monospace';
    ctx.fillText('res = '+s.res, px+16, 200);
    if(s.delta){ ctx.fillStyle=COLOR.dim; ctx.font='600 12px "Noto Sans TC", sans-serif'; ctx.fillText('本步 '+s.delta, px+16, 224); }
    else { ctx.fillStyle=COLOR.dim; ctx.font='600 12px "Noto Sans TC", sans-serif'; ctx.fillText('尚未開始計數', px+16, 224); }

    // ── BAND 2 · note
    const ty=270;
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 和「最長回文(LC 5)」的差別', PAD, ty);
    rr(PAD,ty+12,w-PAD*2,40,6); ctx.fillStyle=done?COLOR.done:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?COLOR.doneS:COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(done){ ctx.fillStyle=COLOR.doneT; ctx.font='700 13px "JetBrains Mono", monospace'; ctx.fillText('每個 true 格 = 一個回文子串 → 把「記最長」換成「res++」即可', w/2, ty+32); }
    else { ctx.fillStyle=COLOR.text; ctx.font='600 12.5px "Noto Sans TC", sans-serif'; ctx.fillText('完全同一張 dp 表、同樣依長度填;差別只在遇到 true 時做的事:計數而非比長度', w/2, ty+32); }
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
