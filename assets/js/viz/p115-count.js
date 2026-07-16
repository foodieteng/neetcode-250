/* ============================================================
   P115 · Distinct Subsequences — 子序列計數 DP · viz
   dp[i][j] = s 前 i 個字元裡,有幾個子序列等於 t 前 j 個字元
   轉移(關鍵是「拿 / 不拿 s[i-1]」):
     s[i-1] == t[j-1] : dp[i][j] = dp[i-1][j]      (不拿:跳過這個 s 字元)
                                 + dp[i-1][j-1]    (拿:用它去配 t[j-1])
     s[i-1] != t[j-1] : dp[i][j] = dp[i-1][j]      (只能跳過)
   base: dp[i][0] = 1(空的 t,一種湊法:什麼都不選)
   例 s="babgbag", t="bag" → 5
   為了讓動畫好讀,用較小的表:一列一列長出來,珊瑚=本列、藍=兩個來源(上、左上)
     BAND 1  s / t 字串,標出本列的 s 字元
     BAND 2  dp 表(逐列填),珊瑚=本格 · 藍=來源(上 dp[i-1][j] / 左上 dp[i-1][j-1])
     BAND 3  轉移式:配對成功 = 上 + 左上;配對失敗 = 只有上
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

  const S = 'babgbag', T = 'bag';
  const M = S.length, N = T.length;   // 7 × 3
  // 完整 dp 表(來自實跑)
  const DP = [
    [1,0,0,0],   // ""
    [1,1,0,0],   // b
    [1,1,1,0],   // a
    [1,2,1,0],   // b
    [1,2,1,1],   // g
    [1,3,1,1],   // b
    [1,3,4,1],   // a
    [1,3,4,5],   // g
  ];

  // 每一步 = 填一列(i 從 1..M);第 0 步只顯示 base 列
  const steps = [];
  steps.push({ row:0, text:'<strong>INITIAL</strong> · <code>s="babgbag"</code>、<code>t="bag"</code>。<code>dp[i][j]</code> = s 前 i 字裡,有幾個<strong>子序列</strong>等於 t 前 j 字。第 0 列 <code>dp[i][0]=1</code>:空的 t 永遠有 <strong>1</strong> 種湊法(什麼都不選)。' });
  const rowText = [
    null,
    's[0]=<strong>b</strong>:配 t 的 b → <code>dp[1][1]=上0+左上1=1</code>。第一個 b 可以當 t 的 b。',
    's[1]=<strong>a</strong>:配 t 的 a → <code>dp[2][2]=上0+左上1=1</code>(用 b·a)。',
    's[2]=<strong>b</strong>:又一個 b → <code>dp[3][1]=上1+左上1=2</code>。<strong>兩個 b 都能當開頭</strong>,湊 "b" 有 2 種。',
    's[3]=<strong>g</strong>:配 t 的 g → <code>dp[4][3]=上0+左上1=1</code>(第一條完整 "bag")。',
    's[4]=<strong>b</strong>:第三個 b → <code>dp[5][1]=上2+左上1=3</code>。湊 "b" 已有 3 種開頭。',
    's[5]=<strong>a</strong>:<code>dp[6][2]=上1+左上3=4</code> —— <strong>3 個 b 各接這個 a</strong>,湊 "ba" 有 4 種。',
    's[6]=<strong>g</strong>:<code>dp[7][3]=上1+左上4=5</code>。答案 = <strong>5</strong> 種 "bag"。',
  ];
  for (let i = 1; i <= M; i++) steps.push({ row:i, text:rowText[i], done:(i===M) });

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  // 找出本列「本格」= 這一列裡 s[i-1]==t[j-1] 的那個 j(若有,就是配對格)
  function matchCol(i){ if(i<1) return -1; for(let j=1;j<=N;j++) if(S[i-1]===T[j-1]) return j; return -1; }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,h=canvas.clientHeight,PAD=26;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,h);
    const R=s.row, done=!!s.done;
    const mc=matchCol(R);

    // ── BAND 1 · strings ──
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · s / t(珊瑚=本列的 s 字元)', PAD, 22);

    const chW=26, sX=PAD+70;
    ctx.textAlign='right'; ctx.textBaseline='middle';
    ctx.fillStyle=COLOR.text; ctx.font='700 12px "JetBrains Mono", monospace';
    ctx.fillText('s =', sX-12, 44);
    for(let i=0;i<M;i++){
      const x=sX+i*chW, isCur=(R>=1 && i===R-1);
      rr(x,32,chW-5,24,4);
      ctx.fillStyle=isCur?COLOR.cur:COLOR.cell; ctx.fill();
      ctx.lineWidth=isCur?2.4:1.4; ctx.strokeStyle=isCur?COLOR.curS:COLOR.cellS; ctx.stroke();
      ctx.fillStyle=isCur?COLOR.curT:COLOR.text; ctx.font='700 13px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.fillText(S[i], x+(chW-5)/2, 45);
    }
    ctx.textAlign='right'; ctx.fillStyle=COLOR.text; ctx.font='700 12px "JetBrains Mono", monospace';
    ctx.fillText('t =', sX-12, 72);
    for(let j=0;j<N;j++){
      const x=sX+j*chW, isM=(mc>=1 && j===mc-1);
      rr(x,60,chW-5,24,4);
      ctx.fillStyle=isM?COLOR.src:COLOR.cell; ctx.fill();
      ctx.lineWidth=isM?2.4:1.4; ctx.strokeStyle=isM?COLOR.srcS:COLOR.cellS; ctx.stroke();
      ctx.fillStyle=isM?COLOR.srcT:COLOR.text; ctx.font='700 13px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.fillText(T[j], x+(chW-5)/2, 73);
    }

    // ── BAND 2 · dp grid ──
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · dp 表逐列填(珊瑚=本格 · 藍=來源:上 dp[i−1][j] + 左上 dp[i−1][j−1])', PAD, 104);

    const cols=N+1, rows=M+1;
    const cell=30, gx=PAD+90, gy=124;
    // 欄標(t 字元)
    ctx.textAlign='center'; ctx.textBaseline='middle';
    for(let j=0;j<cols;j++){
      ctx.fillStyle=COLOR.dim; ctx.font='700 10.5px "JetBrains Mono", monospace';
      ctx.fillText(j===0?'∅':T[j-1], gx+j*cell+cell/2, gy-11);
    }
    // 列標(s 字元)+ 格子
    for(let i=0;i<rows;i++){
      ctx.fillStyle=(R>=1 && i===R)?COLOR.curT:COLOR.dim; ctx.font='700 10.5px "JetBrains Mono", monospace';
      ctx.textAlign='right'; ctx.fillText(i===0?'∅':S[i-1], gx-8, gy+i*cell+cell/2);
      for(let j=0;j<cols;j++){
        const x=gx+j*cell, y=gy+i*cell;
        const filled=(i<=R);
        const isCur=(i===R && R>=1 && j===mc);          // 本列的配對格
        const isBaseCur=(i===R && R>=1 && j===0);       // 本列的 base 格(dp[i][0])
        const isCopy=(i===R && R>=1 && j>=1 && j!==mc); // 本列其他格(=上)
        const isSrcUp   = (R>=1 && i===R-1 && j===mc);
        const isSrcDiag = (R>=1 && i===R-1 && mc>=1 && j===mc-1);
        const isAns=(done && i===M && j===N);
        rr(x+2,y+2,cell-4,cell-4,4);
        let bg=COLOR.cell, bd=COLOR.cellS, tc=COLOR.grid;
        if(!filled){ bg='#f7f7f4'; bd='#e6e6e0'; tc='#d8d8d2'; }
        else { bg=COLOR.cell; bd=COLOR.cellS; tc=COLOR.text; }
        if(isSrcUp||isSrcDiag){ bg=COLOR.src; bd=COLOR.srcS; tc=COLOR.srcT; }
        if(isCopy){ bg='#f0f4f8'; bd=COLOR.cellS; tc=COLOR.text; }
        if(isCur||isBaseCur){ bg=COLOR.cur; bd=COLOR.curS; tc=COLOR.curT; }
        if(isAns){ bg=COLOR.done; bd=COLOR.doneS; tc=COLOR.doneT; }
        ctx.fillStyle=bg; ctx.fill(); ctx.lineWidth=(isCur||isBaseCur||isAns)?2.8:(isSrcUp||isSrcDiag?2.2:1.3); ctx.strokeStyle=bd; ctx.stroke();
        ctx.fillStyle=tc; ctx.font='700 12px "JetBrains Mono", monospace'; ctx.textAlign='center';
        ctx.fillText(filled?String(DP[i][j]):'·', x+cell/2, y+cell/2+1);
      }
    }
    if(done){
      const x=gx+N*cell, y=gy+M*cell;
      ctx.fillStyle=COLOR.doneT; ctx.font='700 10px "Noto Sans TC", sans-serif'; ctx.textAlign='center';
      ctx.fillText('答案 5', x+cell/2, y+cell+11);
    }

    // ── BAND 3 · transition ──
    const ty=gy+rows*cell+18;
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 拿 / 不拿 s[i−1]', PAD, ty);
    rr(PAD,ty+10,w-PAD*2,44,6); ctx.fillStyle=done?COLOR.done:'#fafaf6'; ctx.fill();
    ctx.lineWidth=1.6; ctx.strokeStyle=done?COLOR.doneS:COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillStyle=done?COLOR.doneT:COLOR.text; ctx.font='700 12px "JetBrains Mono", monospace';
    ctx.fillText('配對成功: dp[i][j] = dp[i−1][j](不拿) + dp[i−1][j−1](拿)', w/2, ty+25);
    ctx.font='700 12px "Noto Sans TC", sans-serif';
    ctx.fillStyle=done?COLOR.doneT:COLOR.dim;
    ctx.fillText('配對失敗: dp[i][j] = dp[i−1][j] —— 只能跳過這個 s 字元', w/2, ty+43);
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
