/* ============================================================
   P97 · Interleaving String — 雙字串交錯 DP · viz
   dp[i][j] = s1 前 i 字 與 s2 前 j 字 能否交錯成 s3 前 (i+j) 字。
   關鍵:s3 的位置由 i+j 決定 → 現在要配的字元是 s3[i+j-1]。
   兩種來源(s3 的最後一字從誰來):
     從 s1 拿(上):dp[i-1][j] && s1[i-1] == s3[i+j-1]
     從 s2 拿(左):dp[i][j-1] && s2[j-1] == s3[i+j-1]
   兩者 OR。例 s1="ab", s2="cd", s3="acbd" → true
     BAND 1  s3(珊瑚 = 本步要配的 s3[i+j-1])
     BAND 2  dp 格子(珊瑚=本步 · 綠=成功來源 · 藍=失敗來源)
     右側     兩種來源的判斷
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

  const S1 = 'ab', S2 = 'cd', S3 = 'acbd';
  const R = S1.length + 1, C = S2.length + 1;   // 3 x 3
  const NIL = -1, T = 1, F = 0;
  // 完整 dp:
  //      ∅  c  d
  // ∅    T  F  F
  // a    T  T  F
  // b    F  T  T
  const steps = [
    { g:[[T,F,F],[T,NIL,NIL],[F,NIL,NIL]], cur:null, from:null,
      text:'<strong>INITIAL</strong> · <code>dp[i][j]</code> = <code>s1</code> 前 i 字 與 <code>s2</code> 前 j 字 能否交錯成 <code>s3</code> 前 <strong>i+j</strong> 字。邊界:只用單一字串時逐字比對。' },
    { g:[[T,F,F],[T,T,NIL],[F,NIL,NIL]], cur:[1,1], from:'left',
      text:'<code>(1,1)</code> · 要配 <code>s3[1]=\'c\'</code>。從 s1 拿:<code>dp[0][1]=F</code> ✗。從 s2 拿:<code>dp[1][0]=T</code> 且 <code>s2[0]=\'c\'</code> ✓ → <code>dp[1][1]=true</code>。' },
    { g:[[T,F,F],[T,T,F],[F,NIL,NIL]], cur:[1,2], from:'none',
      text:'<code>(1,2)</code> · 要配 <code>s3[2]=\'b\'</code>。從 s1:<code>dp[0][2]=F</code> ✗。從 s2:<code>s2[1]=\'d\' ≠ \'b\'</code> ✗ → <code>dp[1][2]=false</code>。' },
    { g:[[T,F,F],[T,T,F],[F,T,NIL]], cur:[2,1], from:'up',
      text:'<code>(2,1)</code> · 要配 <code>s3[2]=\'b\'</code>。從 <strong>s1 拿</strong>:<code>dp[1][1]=T</code> 且 <code>s1[1]=\'b\'</code> ✓ → <code>dp[2][1]=true</code>。' },
    { g:[[T,F,F],[T,T,F],[F,T,T]], cur:[2,2], from:'left', done:true,
      text:'<code>(2,2)</code> · 要配 <code>s3[3]=\'d\'</code>。從 <strong>s2 拿</strong>:<code>dp[2][1]=T</code> 且 <code>s2[1]=\'d\'</code> ✓ → <code>dp[2][2]=true</code>。答案 <strong>true</strong>(a·c·b·d)。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,h=canvas.clientHeight,PAD=26;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,h);
    const cur=s.cur; const k = cur ? cur[0]+cur[1]-1 : -1;    // s3 索引
    const up = cur?[cur[0]-1,cur[1]]:null, left = cur?[cur[0],cur[1]-1]:null;

    // BAND 1 · s3
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · s3(珊瑚 = 本步要配的字元,位置 = i+j−1)', PAD, 22);
    const scw=34, sgx=(w-S3.length*scw)/2, sy=34, schh=28;
    ctx.fillStyle=COLOR.text; ctx.font='700 11px "JetBrains Mono", monospace'; ctx.textAlign='right'; ctx.textBaseline='middle';
    ctx.fillText('s3 =', sgx-10, sy+schh/2);
    for(let t=0;t<S3.length;t++){ const x=sgx+t*scw; const isK=(t===k);
      rr(x+3,sy,scw-6,schh,4);
      ctx.fillStyle=isK?COLOR.cur:COLOR.cell; ctx.fill();
      ctx.lineWidth=isK?2.6:1.4; ctx.strokeStyle=isK?COLOR.curS:COLOR.cellS; ctx.stroke();
      ctx.fillStyle=isK?COLOR.curT:COLOR.ink; ctx.font='700 14px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(S3[t], x+scw/2, sy+schh/2+1);
      ctx.fillStyle=COLOR.dim; ctx.font='600 9px "JetBrains Mono", monospace';
      ctx.fillText(String(t), x+scw/2, sy+schh+9);
    }

    // BAND 2 · grid
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · dp[i][j] — 列 i = s1、行 j = s2(珊瑚=本步 · 綠=成功來源 · 藍=失敗)', PAD, 92);
    const cell=40, gx=84, gy=120;
    for(let j=0;j<C;j++){ ctx.fillStyle=COLOR.text; ctx.font='700 13px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(j===0?'∅':S2[j-1], gx+j*cell+cell/2, gy-13); }
    for(let i=0;i<R;i++){ ctx.fillStyle=COLOR.text; ctx.font='700 13px "JetBrains Mono", monospace'; ctx.textAlign='right'; ctx.textBaseline='middle';
      ctx.fillText(i===0?'∅':S1[i-1], gx-11, gy+i*cell+cell/2); }

    for(let i=0;i<R;i++) for(let j=0;j<C;j++){
      const x=gx+j*cell, y=gy+i*cell; const val=s.g[i][j];
      const isCur=cur&&cur[0]===i&&cur[1]===j;
      const isUp=up&&up[0]===i&&up[1]===j, isLeft=left&&left[0]===i&&left[1]===j;
      const winUp=(isUp&&s.from==='up'), winLeft=(isLeft&&s.from==='left');
      const loseSrc=(isUp&&s.from!=='up')||(isLeft&&s.from!=='left');
      const filled=val!==NIL&&!isCur&&!isUp&&!isLeft;
      rr(x+3,y+3,cell-6,cell-6,4);
      let fill=COLOR.nil, stroke=COLOR.nilS, txt=COLOR.dim, lw=1.4;
      if(isCur){ fill=COLOR.cur; stroke=COLOR.curS; txt=COLOR.curT; lw=3; }
      else if(winUp||winLeft){ fill=COLOR.done; stroke=COLOR.doneS; txt=COLOR.doneT; lw=2.8; }
      else if(loseSrc){ fill=COLOR.src; stroke=COLOR.srcS; txt=COLOR.srcT; lw=2.2; }
      else if(filled){ fill=COLOR.cell; stroke=COLOR.cellS; txt=COLOR.ink; lw=1.4; }
      ctx.fillStyle=fill; ctx.fill(); ctx.lineWidth=lw; ctx.strokeStyle=stroke; ctx.stroke();
      if(val!==NIL){ ctx.fillStyle=txt; ctx.font='700 15px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(val===T?'T':'F', x+cell/2, y+cell/2+1); }
    }

    // right panel · two sources
    const px=gx+C*cell+44, pw=w-PAD-px;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('s3 的最後一字從誰來?', px, 112);
    rr(px,124,pw,84,6); ctx.fillStyle='#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=COLOR.grid; ctx.stroke();
    ctx.textAlign='left'; ctx.textBaseline='middle';
    const okUp=(s.from==='up'), okLeft=(s.from==='left');
    ctx.fillStyle=okUp?COLOR.doneT:COLOR.text; ctx.font=(okUp?'700 ':'600 ')+'11.5px "JetBrains Mono", monospace';
    ctx.fillText((cur?(okUp?'✓ ':'✗ '):'')+'從 s1 拿(上)', px+14, 144);
    ctx.fillStyle=COLOR.dim; ctx.font='600 10px "JetBrains Mono", monospace';
    ctx.fillText('dp[i-1][j] && s1[i-1]==s3[k]', px+14, 160);
    ctx.fillStyle=okLeft?COLOR.doneT:COLOR.text; ctx.font=(okLeft?'700 ':'600 ')+'11.5px "JetBrains Mono", monospace';
    ctx.fillText((cur?(okLeft?'✓ ':'✗ '):'')+'從 s2 拿(左)', px+14, 180);
    ctx.fillStyle=COLOR.dim; ctx.font='600 10px "JetBrains Mono", monospace';
    ctx.fillText('dp[i][j-1] && s2[j-1]==s3[k]', px+14, 196);

    // right: result
    const done=!!s.done;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textBaseline='alphabetic';
    ctx.fillText('本步結果', px, 218);
    rr(px,228,pw,38,6); ctx.fillStyle=done?COLOR.done:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?COLOR.doneS:COLOR.grid; ctx.stroke();
    ctx.textAlign='left'; ctx.textBaseline='middle';
    if(cur){ const v=s.g[cur[0]][cur[1]];
      ctx.fillStyle=v===T?(done?COLOR.doneT:COLOR.curT):COLOR.dim; ctx.font='700 14px "JetBrains Mono", monospace';
      ctx.fillText('dp['+cur[0]+']['+cur[1]+'] = '+(v===T?'true':'false')+'   (k='+k+')', px+14, 247); }
    else { ctx.fillStyle=COLOR.dim; ctx.font='600 12px "Noto Sans TC", sans-serif'; ctx.fillText('s3 索引 k = i+j−1', px+14, 247); }

    // BAND 3 · note
    const ty=280;
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 為什麼 s3 的位置是 i+j−1', PAD, ty);
    rr(PAD,ty+12,w-PAD*2,38,6); ctx.fillStyle=done?COLOR.done:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?COLOR.doneS:COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(done){ ctx.fillStyle=COLOR.doneT; ctx.font='700 12px "JetBrains Mono", monospace'; ctx.fillText('用掉 i+j 個字 → 剛好填滿 s3 前 i+j 位 → 沒有第三個維度,兩維就夠', w/2, ty+31); }
    else { ctx.fillStyle=COLOR.text; ctx.font='600 12px "Noto Sans TC", sans-serif'; ctx.fillText('s1 用 i 字、s2 用 j 字 → 一共 i+j 字 → s3 的下一個待配字元固定是 s3[i+j−1]', w/2, ty+31); }
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
