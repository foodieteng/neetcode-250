/* ============================================================
   P1143 · Longest Common Subsequence — 雙字串網格 DP · viz
   dp[i][j] = text1 前 i 個字元 與 text2 前 j 個字元 的 LCS 長度。
   兩種情況:
     字元相同 text1[i-1]==text2[j-1] → dp[i][j] = dp[i-1][j-1] + 1(左上斜 +1)
     字元不同                         → dp[i][j] = max(dp[i-1][j], dp[i][j-1])(上、左取大)
   第一列/行為 0(空字串沒有共同子序列)。答案 dp[m][n]。
   例 text1="abcd", text2="acd" → dp[4][3] = 3(LCS = "acd")
     BAND 1  網格(珊瑚=本步 · 綠=相同時的左上來源 · 藍=不同時的上/左來源)
     右側     兩種情況的遞迴式
     BAND 2  說明
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

  const T1 = 'abcd', T2 = 'acd';
  const R = T1.length + 1, C = T2.length + 1;   // 5 x 4(含空字串列/行)
  const NIL = -1;
  // dp 完整:
  // 0 0 0 0 / 0 1 1 1 / 0 1 1 1 / 0 1 2 2 / 0 1 2 3
  const steps = [
    { g:[[0,0,0,0],[0,NIL,NIL,NIL],[0,NIL,NIL,NIL],[0,NIL,NIL,NIL],[0,NIL,NIL,NIL]], cur:null, match:false,
      text:'<strong>INITIAL</strong> · <code>dp[i][j]</code> = <code>text1</code> 前 i 字元 與 <code>text2</code> 前 j 字元 的 LCS 長度。第一列/行 = 0(和空字串沒有共同子序列)。' },
    { g:[[0,0,0,0],[0,1,NIL,NIL],[0,NIL,NIL,NIL],[0,NIL,NIL,NIL],[0,NIL,NIL,NIL]], cur:[1,1], match:true,
      text:'<code>(1,1)</code>:<code>a == a</code> <strong>相同</strong> → <code>dp[1][1] = dp[0][0] + 1 = 1</code>(左上斜 +1)。' },
    { g:[[0,0,0,0],[0,1,1,1],[0,1,1,NIL],[0,NIL,NIL,NIL],[0,NIL,NIL,NIL]], cur:[2,2], match:false,
      text:'<code>(2,2)</code>:<code>b ≠ c</code> <strong>不同</strong> → <code>dp[2][2] = max(上 dp[1][2]=1, 左 dp[2][1]=1) = 1</code>。' },
    { g:[[0,0,0,0],[0,1,1,1],[0,1,1,1],[0,1,2,NIL],[0,NIL,NIL,NIL]], cur:[3,2], match:true,
      text:'<code>(3,2)</code>:<code>c == c</code> <strong>相同</strong> → <code>dp[3][2] = dp[2][1] + 1 = 1 + 1 = 2</code>。' },
    { g:[[0,0,0,0],[0,1,1,1],[0,1,1,1],[0,1,2,2],[0,1,2,3]], cur:[4,3], match:true, done:true,
      text:'<code>(4,3)</code>:<code>d == d</code> <strong>相同</strong> → <code>dp[4][3] = dp[3][2] + 1 = 2 + 1 = 3</code>。答案 <code>3</code>(LCS = <code>"acd"</code>)。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,h=canvas.clientHeight,PAD=26;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,h);
    const cur=s.cur;
    const diag = cur?[cur[0]-1,cur[1]-1]:null;
    const up = cur?[cur[0]-1,cur[1]]:null, left = cur?[cur[0],cur[1]-1]:null;

    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · dp[i][j] = LCS 長度(珊瑚=本步 · 綠=相同的左上來源 · 藍=不同的上/左)', PAD, 24);

    const cell=32, gx=88, gy=76;
    // column headers = text2 chars (col 0 = '∅')
    for(let j=0;j<C;j++){ ctx.fillStyle=COLOR.text; ctx.font='700 14px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(j===0?'∅':T2[j-1], gx+j*cell+cell/2, gy-14); }
    // row headers = text1 chars (row 0 = '∅')
    for(let i=0;i<R;i++){ ctx.fillStyle=COLOR.text; ctx.font='700 14px "JetBrains Mono", monospace'; ctx.textAlign='right'; ctx.textBaseline='middle';
      ctx.fillText(i===0?'∅':T1[i-1], gx-12, gy+i*cell+cell/2); }
    for(let i=0;i<R;i++) for(let j=0;j<C;j++){
      const x=gx+j*cell, y=gy+i*cell; const val=s.g[i][j];
      const isCur=cur&&cur[0]===i&&cur[1]===j;
      const isDiag=s.match&&diag&&diag[0]===i&&diag[1]===j;
      const isUp=!s.match&&up&&up[0]===i&&up[1]===j, isLeft=!s.match&&left&&left[0]===i&&left[1]===j;
      const filled=val!==NIL&&!isCur&&!isDiag&&!isUp&&!isLeft;
      rr(x+2,y+2,cell-4,cell-4,4);
      let fill=COLOR.nil, stroke=COLOR.nilS, txt=COLOR.dim, lw=1.4;
      if(isCur){ fill=COLOR.cur; stroke=COLOR.curS; txt=COLOR.curT; lw=3; }
      else if(isDiag){ fill=COLOR.done; stroke=COLOR.doneS; txt=COLOR.doneT; lw=2.8; }
      else if(isUp||isLeft){ fill=COLOR.src; stroke=COLOR.srcS; txt=COLOR.srcT; lw=2.4; }
      else if(filled){ fill=COLOR.cell; stroke=COLOR.cellS; txt=COLOR.ink; lw=1.4; }
      ctx.fillStyle=fill; ctx.fill(); ctx.lineWidth=lw; ctx.strokeStyle=stroke; ctx.stroke();
      if(val!==NIL){ ctx.fillStyle=txt; ctx.font='700 15px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(String(val), x+cell/2, y+cell/2+1); }
    }

    // right panel
    const px=gx+C*cell+40, pw=w-PAD-px;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('兩種情況', px, 76);
    rr(px,88,pw,76,6); ctx.fillStyle='#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=COLOR.grid; ctx.stroke();
    ctx.textAlign='left'; ctx.textBaseline='middle';
    // case 1 (match)
    ctx.fillStyle=(cur&&s.match)?COLOR.doneT:COLOR.text; ctx.font=(cur&&s.match?'700 ':'600 ')+'11.5px "JetBrains Mono", monospace';
    ctx.fillText('相同: dp[i-1][j-1] + 1', px+14, 106);
    ctx.fillStyle=COLOR.dim; ctx.font='600 10.5px "Noto Sans TC", sans-serif';
    ctx.fillText('(左上斜,配對這兩字)', px+14, 122);
    // case 2 (mismatch)
    ctx.fillStyle=(cur&&!s.match)?COLOR.srcT:COLOR.text; ctx.font=(cur&&!s.match?'700 ':'600 ')+'11.5px "JetBrains Mono", monospace';
    ctx.fillText('不同: max(上, 左)', px+14, 140);
    ctx.fillStyle=COLOR.dim; ctx.font='600 10.5px "Noto Sans TC", sans-serif';
    ctx.fillText('(捨一字,取較好)', px+14, 156);

    // right: 目前 LCS 長度
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textBaseline='alphabetic';
    ctx.fillText('本步結果', px, 190);
    rr(px,202,pw,40,6); ctx.fillStyle=(!!s.done)?COLOR.done:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=(!!s.done)?COLOR.doneS:COLOR.grid; ctx.stroke();
    ctx.textAlign='left'; ctx.textBaseline='middle';
    if(cur){ ctx.fillStyle=(!!s.done)?COLOR.doneT:COLOR.curT; ctx.font='700 15px "JetBrains Mono", monospace';
      ctx.fillText('dp['+cur[0]+']['+cur[1]+'] = '+s.g[cur[0]][cur[1]], px+14, 222); }
    else { ctx.fillStyle=COLOR.dim; ctx.font='600 12.5px "Noto Sans TC", sans-serif'; ctx.fillText('由左上往右下填', px+14, 222); }

    // BAND 2 · note
    const ty=gy+R*cell+22, done=!!s.done;
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 為什麼要「左上斜」', PAD, ty);
    rr(PAD,ty+12,w-PAD*2,40,6); ctx.fillStyle=done?COLOR.done:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?COLOR.doneS:COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(done){ ctx.fillStyle=COLOR.doneT; ctx.font='700 12.5px "JetBrains Mono", monospace'; ctx.fillText('雙字串 DP:相同就配對(斜 +1)、不同就丟一字(上或左)。答案在右下角 dp[m][n]', w/2, ty+32); }
    else { ctx.fillStyle=COLOR.text; ctx.font='600 12.5px "Noto Sans TC", sans-serif'; ctx.fillText('相同 → 兩字都用掉 → 看「兩字都還沒用」的 dp[i-1][j-1] 再 +1', w/2, ty+32); }
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
