/* ============================================================
   P63 · Unique Paths II — 帶障礙的網格 DP · viz
   和 62 一樣 dp[i][j] = 上 + 左,但障礙格(值 1)代表「走不到」→ dp=0。
   障礙貢獻 0 給它的下、右鄰,路徑自然繞開。
   例 3×3、中央 (1,1) 是障礙 → 答案 2(只能走外圈上緣或左緣)
     BAND 1  網格(珊瑚=本步 · 藍=上/左來源 · 深灰✗=障礙 dp=0)
     右側     遞迴式 + 障礙規則
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
    cell:'#fafaf6', cellS:'#cfcfcf', nil:'#f3f3ef', nilS:'#e2e2dc', obst:'#5a5a5a', obstS:'#3a3a3a',
    src:'#dbe8f6', srcS:'#4478c0', srcT:'#2f5f9e',
    cur:'#fbe7df', curS:'#d96e4e', curT:'#b3502f', done:'#d9e8c7', doneS:'#5fa866', doneT:'#3f7a3a', coral:'#d96e4e' };

  const R = 3, C = 3;
  const NIL = -1, OBST = -2;
  const steps = [
    { g:[[1,1,1],[1,OBST,NIL],[1,NIL,NIL]], cur:null,
      text:'<strong>INITIAL</strong> · 中央 <code>(1,1)</code> 是<strong>障礙</strong>(深灰✗)→ <code>dp=0</code>,誰都走不到。第一列/行仍是 1(未被擋)。' },
    { g:[[1,1,1],[1,OBST,NIL],[1,NIL,NIL]], cur:[1,1], obstCur:true,
      text:'<code>(1,1)</code> 是障礙 → <strong>直接 <code>dp[1][1]=0</code></strong>(跳過,不累加)。它之後會把 0 貢獻給下、右鄰。' },
    { g:[[1,1,1],[1,OBST,1],[1,NIL,NIL]], cur:[1,2],
      text:'<code>dp[1][2] = 上 dp[0][2] + 左 dp[1][1] = 1 + 0 = 1</code>。左邊是障礙(0)→ 只能<strong>從上面</strong>來。' },
    { g:[[1,1,1],[1,OBST,1],[1,1,NIL]], cur:[2,1],
      text:'<code>dp[2][1] = 上 dp[1][1] + 左 dp[2][0] = 0 + 1 = 1</code>。上面是障礙(0)→ 只能<strong>從左邊</strong>來。' },
    { g:[[1,1,1],[1,OBST,1],[1,1,2]], cur:[2,2], done:true,
      text:'<code>dp[2][2] = 上 dp[1][2] + 左 dp[2][1] = 1 + 1 = 2</code>。答案 <code>2</code>(繞過中央障礙的兩條路)。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,h=canvas.clientHeight,PAD=26;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,h);
    const cur=s.cur; const up = cur?[cur[0]-1,cur[1]]:null, left = cur?[cur[0],cur[1]-1]:null;

    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · dp[i][j] = 上 + 左(珊瑚=本步 · 藍=來源 · 深灰✗=障礙 dp=0)', PAD, 24);

    const cell=48, gx=64, gy=80;
    for(let j=0;j<C;j++){ ctx.fillStyle=COLOR.dim; ctx.font='700 10px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('j'+j, gx+j*cell+cell/2, gy-11); }
    for(let i=0;i<R;i++){ ctx.fillStyle=COLOR.dim; ctx.font='700 10px "JetBrains Mono", monospace'; ctx.textAlign='right'; ctx.textBaseline='middle';
      ctx.fillText('i'+i, gx-9, gy+i*cell+cell/2); }
    for(let i=0;i<R;i++) for(let j=0;j<C;j++){
      const x=gx+j*cell, y=gy+i*cell; const val=s.g[i][j];
      const isObst=(val===OBST);
      const isCur=cur&&cur[0]===i&&cur[1]===j;
      const isUp=up&&up[0]===i&&up[1]===j, isLeft=left&&left[0]===i&&left[1]===j;
      const filled=val!==NIL&&val!==OBST&&!isCur&&!isUp&&!isLeft;
      rr(x+3,y+3,cell-6,cell-6,5);
      let fill=COLOR.nil, stroke=COLOR.nilS, txt=COLOR.dim, lw=1.6, mark=null;
      if(isObst){ fill=COLOR.obst; stroke=COLOR.obstS; txt='#ffffff'; lw=1.8; mark='✗';
        if(isCur){ stroke=COLOR.curS; lw=3.2; } if(isUp||isLeft){ stroke=COLOR.srcS; lw=2.8; } }
      else if(isCur){ fill=COLOR.cur; stroke=COLOR.curS; txt=COLOR.curT; lw=3.2; }
      else if(isUp||isLeft){ fill=COLOR.src; stroke=COLOR.srcS; txt=COLOR.srcT; lw=2.8; }
      else if(filled){ fill=COLOR.cell; stroke=COLOR.cellS; txt=COLOR.ink; lw=1.8; }
      ctx.fillStyle=fill; ctx.fill(); ctx.lineWidth=lw; ctx.strokeStyle=stroke; ctx.stroke();
      if(mark){ ctx.fillStyle=txt; ctx.font='700 20px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(mark, x+cell/2, y+cell/2+1); }
      else if(val!==NIL){ ctx.fillStyle=txt; ctx.font='700 19px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(String(val), x+cell/2, y+cell/2+1); }
    }

    // right panel
    const px=gx+C*cell+42, pw=w-PAD-px;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('遞迴式', px, 74);
    rr(px,86,pw,60,6); ctx.fillStyle='#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=COLOR.grid; ctx.stroke();
    ctx.textAlign='left'; ctx.textBaseline='middle';
    ctx.fillStyle=COLOR.text; ctx.font='700 12px "JetBrains Mono", monospace';
    ctx.fillText('dp[i][j] = 上 + 左', px+14, 106);
    ctx.font='600 11.5px "Noto Sans TC", sans-serif';
    if(cur && !s.obstCur){ const u=s.g[up[0]][up[1]], l=s.g[left[0]][left[1]]; const uu=(u===OBST?0:u), ll=(l===OBST?0:l);
      ctx.fillStyle=COLOR.curT; ctx.fillText('= '+uu+' + '+ll+' = '+s.g[cur[0]][cur[1]], px+14, 126); }
    else if(s.obstCur){ ctx.fillStyle=COLOR.curT; ctx.fillText('障礙 → dp = 0(跳過)', px+14, 126); }
    else { ctx.fillStyle=COLOR.dim; ctx.fillText('第一列/行 = 1', px+14, 126); }

    // right: 障礙規則
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textBaseline='alphabetic';
    ctx.fillText('障礙規則', px, 172);
    rr(px,184,pw,52,6); ctx.fillStyle='#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=COLOR.grid; ctx.stroke();
    ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillStyle=COLOR.text; ctx.font='600 12px "Noto Sans TC", sans-serif';
    ctx.fillText('grid[i][j]==1 → dp=0', px+14, 204);
    ctx.fillText('(此路不通,貢獻 0)', px+14, 222);

    // BAND 2 · note
    const ty=262, done=!!s.done;
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 和 62 的唯一差別', PAD, ty);
    rr(PAD,ty+12,w-PAD*2,40,6); ctx.fillStyle=done?COLOR.done:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?COLOR.doneS:COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(done){ ctx.fillStyle=COLOR.doneT; ctx.font='700 12.5px "JetBrains Mono", monospace'; ctx.fillText('障礙格 dp=0 → 路徑自動繞開;第一列/行遇障礙後全 0(過不去)', w/2, ty+32); }
    else { ctx.fillStyle=COLOR.text; ctx.font='600 12.5px "Noto Sans TC", sans-serif'; ctx.fillText('轉移一樣是「上+左」,只多一條:障礙格直接設 0,不做累加', w/2, ty+32); }
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
