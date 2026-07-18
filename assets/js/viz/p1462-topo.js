/* ============================================================
   P1462 · Course Schedule IV — 拓撲序 + 傳遞閉包(逐步播放)· viz
   邊 a→b(a 是 b 的先修)。用 Kahn 拓撲序處理每個 u;處理 u 時:
     · 直接邊 u→v:table[u][v]=true
     · 傳遞:凡是 table[i][u] 為真的 i,也是 v 的先修 → table[i][v]=true
   因為拓撲序保證處理到 u 時,「誰是 u 的先修」已全部算完,可安全往後推。
   例 chain 0→1→2→3:table 逐步補成下三角(0 是 1,2,3 的先修…)
     BAND 1  依賴鏈(紅=本步處理的 u · 深紅=本步直接邊)
     BAND 2  reachability 表 table[i][j](綠=先修 · 亮綠=本步新增)
     BAND 3  說明
   ============================================================ */
(function () {
  const canvas = document.getElementById('va-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('va-step'), labelEl = document.getElementById('va-label');
  const bPrev = document.getElementById('va-prev'), bNext = document.getElementById('va-next'),
        bPlay = document.getElementById('va-play'), bReset = document.getElementById('va-reset');

  const COLOR = { paper:'#ffffff', ink:'#1a1a1a', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf',
    node:'#ffffff', nodeS:'#c9c9c1', cur:'#fbe1e1', curS:'#cf3535', edge:'#b7c7d6', coral:'#cf3535',
    bad:'#a31d1d', on:'#d9e8c7', onS:'#5fa866', fresh:'#bfe6a6', freshS:'#3f9e46', diag:'#eeeeea' };

  const N = 4;
  const key = (i,j)=>i*N+j;
  const steps = [
    { u:-1, edge:null, cells:[], fresh:[],
      text:'<strong>INITIAL</strong> · 邊 <code>a→b</code>(a 是 b 的先修)。indeg=<code>[0,1,1,1]</code>,queue=<code>[0]</code>。table 全 false;拓撲序處理,順手把「誰是誰的先修」<strong>往後傳</strong>。' },
    { u:0, edge:[0,1], cells:[[0,1]], fresh:[[0,1]],
      text:'處理 <code>0</code> → 直接邊 <code>0→1</code>:<code>table[0][1]=T</code>。<code>0</code> 沒有先修,不用傳遞。<code>1</code> indeg 歸零入隊。' },
    { u:1, edge:[1,2], cells:[[0,1],[1,2],[0,2]], fresh:[[1,2],[0,2]],
      text:'處理 <code>1</code> → <code>table[1][2]=T</code>。<strong>傳遞</strong>:<code>0</code> 是 <code>1</code> 的先修 → <code>0</code> 也是 <code>2</code> 的先修 → <code>table[0][2]=T</code>。' },
    { u:2, edge:[2,3], cells:[[0,1],[1,2],[0,2],[2,3],[0,3],[1,3]], fresh:[[2,3],[0,3],[1,3]],
      text:'處理 <code>2</code> → <code>table[2][3]=T</code>。<strong>傳遞</strong>:<code>0</code>、<code>1</code> 都是 <code>2</code> 的先修 → 也是 <code>3</code> 的先修 → <code>table[0][3]=T</code>、<code>table[1][3]=T</code>。' },
    { u:3, edge:null, cells:[[0,1],[1,2],[0,2],[2,3],[0,3],[1,3]], fresh:[], done:true,
      text:'處理 <code>3</code>(無出邊)→ 佇列空。table 完成 = 完整可達關係。查詢直接看 <code>table[a][b]</code>,<code>O(1)</code>。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||470; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function arrow(ax,ay,bx,by,color,wdt){ const dx=bx-ax,dy=by-ay,L=Math.hypot(dx,dy),ux=dx/L,uy=dy/L,R=24;
    const sx=ax+ux*R,sy=ay+uy*R,ex=bx-ux*R,ey=by-uy*R; ctx.strokeStyle=color; ctx.lineWidth=wdt||2.4;
    ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(ex,ey); ctx.stroke();
    const a=Math.atan2(uy,ux),h=10; ctx.fillStyle=color; ctx.beginPath(); ctx.moveTo(ex,ey);
    ctx.lineTo(ex-h*Math.cos(a-0.4),ey-h*Math.sin(a-0.4)); ctx.lineTo(ex-h*Math.cos(a+0.4),ey-h*Math.sin(a+0.4)); ctx.closePath(); ctx.fill(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,h=canvas.clientHeight,PAD=26;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,h);

    // ── BAND 1 · chain graph
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 依賴鏈 a→b(紅=本步處理的 u · 深紅=本步直接邊)', PAD, 22);
    const gy=68, R=23; const gx0=Math.max(PAD+40,(w-3*120)/2); const GX=[];
    for(let i=0;i<N;i++) GX.push(gx0+i*120);
    for(let i=0;i<N-1;i++){ const isE=s.edge&&s.edge[0]===i&&s.edge[1]===i+1;
      arrow(GX[i],gy,GX[i+1],gy, isE?COLOR.bad:COLOR.edge, isE?3.4:2.4); }
    for(let i=0;i<N;i++){ const cur=(i===s.u); ctx.beginPath(); ctx.arc(GX[i],gy,R,0,Math.PI*2);
      ctx.fillStyle=cur?COLOR.cur:COLOR.node; ctx.fill(); ctx.lineWidth=cur?3.4:2.2; ctx.strokeStyle=cur?COLOR.curS:COLOR.nodeS; ctx.stroke();
      ctx.fillStyle=COLOR.ink; ctx.font='700 18px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(String(i),GX[i],gy+1); }

    // ── BAND 2 · reachability matrix
    let by=118;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · table[i][j] = i 是 j 的先修(綠=是 · 亮綠=本步新增)', PAD, by);
    const cell=38, gx=PAD+56, gyy=by+46;
    const cellSet=new Set(s.cells.map(c=>key(c[0],c[1])));
    const freshSet=new Set(s.fresh.map(c=>key(c[0],c[1])));
    // axis labels
    ctx.font='700 12px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillStyle=COLOR.text; ctx.fillText('i \\ j', gx-28, gyy-cell/2);
    for(let j=0;j<N;j++){ ctx.fillStyle=COLOR.text; ctx.fillText(String(j), gx+j*cell+cell/2, gyy-cell/2); }
    for(let i=0;i<N;i++){ ctx.fillStyle=COLOR.text; ctx.fillText(String(i), gx-28, gyy+i*cell+cell/2);
      for(let j=0;j<N;j++){ const x=gx+j*cell, y=gyy+i*cell; const diag=(i===j);
        const on=cellSet.has(key(i,j)), fr=freshSet.has(key(i,j));
        rr(x+2,y+2,cell-4,cell-4,5);
        ctx.fillStyle=diag?COLOR.diag:(fr?COLOR.fresh:(on?COLOR.on:'#fafaf6')); ctx.fill();
        ctx.lineWidth=fr?2.4:1.4; ctx.strokeStyle=diag?COLOR.grid:(fr?COLOR.freshS:(on?COLOR.onS:COLOR.grid)); ctx.stroke();
        if(!diag){ ctx.fillStyle=on?(fr?'#2f7d34':COLOR.onS):COLOR.grid; ctx.font='700 14px "JetBrains Mono", monospace';
          ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(on?'T':'·', x+cell/2, y+cell/2+1); }
      } }

    // ── BAND 3 · note
    const ty=gyy+N*cell+22, done=!!s.done;
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 為什麼拓撲序能安全傳遞', PAD, ty);
    const box=ty+12; rr(PAD,box,w-PAD*2,40,6); ctx.fillStyle=done?COLOR.on:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?COLOR.onS:COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(done){ ctx.fillStyle='#3f7a3a'; ctx.font='700 13px "JetBrains Mono", monospace'; ctx.fillText('table 建好後,每個 query = 一次查表 O(1)', w/2, box+20); }
    else { ctx.fillStyle=COLOR.text; ctx.font='600 12px "Noto Sans TC", sans-serif'; ctx.fillText('處理到 u 時,所有「u 的先修」已算完(前置都先出隊)→ 可安全複製給 u 的後繼', w/2, box+20); }
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
