/* ============================================================
   P1462 · Course Schedule IV — Floyd-Warshall 傳遞閉包(逐步)· vb
   先把直接邊填進 reach。再枚舉「中繼點 k」:若 i 能到 k、k 能到 j,則 i 能
   到 j(reach[i][j] |= reach[i][k] && reach[k][j])。三重迴圈跑完就得到完整
   可達關係。不需拓撲序 —— 每個 k 都當一次中繼,所有間接路徑都被考慮到。
   例 chain 0→1→2→3:用 k=1、k=2 當中繼補出 [0][2]、[0][3]、[1][3]
     BAND 1  依賴鏈(珊瑚=本步的中繼點 k)
     BAND 2  reach 表 reach[i][j](綠=可達 · 亮綠=本步新增)
     BAND 3  說明
   ============================================================ */
(function () {
  const canvas = document.getElementById('vb-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('vb-step'), labelEl = document.getElementById('vb-label');
  const bPrev = document.getElementById('vb-prev'), bNext = document.getElementById('vb-next'),
        bPlay = document.getElementById('vb-play'), bReset = document.getElementById('vb-reset');

  const COLOR = { paper:'#ffffff', ink:'#1a1a1a', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf',
    node:'#ffffff', nodeS:'#c9c9c1', cur:'#fbe7df', curS:'#d96e4e', edge:'#b7c7d6', coral:'#d96e4e',
    on:'#d9e8c7', onS:'#5fa866', fresh:'#bfe6a6', freshS:'#3f9e46', diag:'#eeeeea' };

  const N = 4;
  const key = (i,j)=>i*N+j;
  const D = [[0,1],[1,2],[2,3]];   // direct edges of chain 0→1→2→3
  const steps = [
    { k:-1, cells:[[0,1],[1,2],[2,3]], fresh:[],
      text:'<strong>INITIAL</strong> · 先把<strong>直接邊</strong>填進 reach:<code>reach[0][1]=reach[1][2]=reach[2][3]=T</code>。接著枚舉<strong>中繼點 k</strong>:若 <code>i→k</code> 且 <code>k→j</code> 則 <code>i→j</code>。' },
    { k:0, cells:[[0,1],[1,2],[2,3]], fresh:[],
      text:'<strong>k=0</strong>:找 <code>reach[i][0] &amp;&amp; reach[0][j]</code>。沒有點指向 <code>0</code>(<code>reach[i][0]</code> 全 false)→ <strong>無新增</strong>。' },
    { k:1, cells:[[0,1],[1,2],[2,3],[0,2]], fresh:[[0,2]],
      text:'<strong>k=1</strong>:<code>reach[0][1] &amp;&amp; reach[1][2]</code> → <code>reach[0][2]=T</code>。以 <code>1</code> 當中繼,把 <code>0→1→2</code> 接成 <code>0→2</code>。' },
    { k:2, cells:[[0,1],[1,2],[2,3],[0,2],[0,3],[1,3]], fresh:[[0,3],[1,3]],
      text:'<strong>k=2</strong>:<code>reach[0][2]&amp;&amp;reach[2][3]→reach[0][3]</code>;<code>reach[1][2]&amp;&amp;reach[2][3]→reach[1][3]</code>。以 <code>2</code> 當中繼補兩格。' },
    { k:3, cells:[[0,1],[1,2],[2,3],[0,2],[0,3],[1,3]], fresh:[], done:true,
      text:'<strong>k=3</strong>:<code>3</code> 不指向任何點 → 無新增。三重迴圈跑完,reach 完成。查詢 <code>reach[a][b]</code> 即答案。' },
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

    // ── BAND 1 · chain graph, highlight middle point k
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 依賴鏈 a→b(珊瑚=本步的中繼點 k)', PAD, 22);
    const gy=68, R=23; const gx0=Math.max(PAD+40,(w-3*120)/2); const GX=[];
    for(let i=0;i<N;i++) GX.push(gx0+i*120);
    for(let i=0;i<N-1;i++) arrow(GX[i],gy,GX[i+1],gy, COLOR.edge, 2.4);
    for(let i=0;i<N;i++){ const cur=(i===s.k); ctx.beginPath(); ctx.arc(GX[i],gy,R,0,Math.PI*2);
      ctx.fillStyle=cur?COLOR.cur:COLOR.node; ctx.fill(); ctx.lineWidth=cur?3.4:2.2; ctx.strokeStyle=cur?COLOR.curS:COLOR.nodeS; ctx.stroke();
      ctx.fillStyle=COLOR.ink; ctx.font='700 18px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(String(i),GX[i],gy+1);
      if(cur){ ctx.fillStyle=COLOR.curS; ctx.font='700 11px "JetBrains Mono", monospace'; ctx.fillText('k', GX[i], gy-34); } }

    // ── BAND 2 · reachability matrix
    let by=118;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · reach[i][j] = i 能到 j(綠=可達 · 亮綠=本步新增)', PAD, by);
    const cell=38, gx=PAD+56, gyy=by+46;
    const cellSet=new Set(s.cells.map(c=>key(c[0],c[1])));
    const freshSet=new Set(s.fresh.map(c=>key(c[0],c[1])));
    ctx.font='700 12px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillStyle=COLOR.text; ctx.fillText('i \\ j', gx-28, gyy-cell/2);
    for(let j=0;j<N;j++){ ctx.fillStyle=(j===s.k)?COLOR.curS:COLOR.text; ctx.fillText(String(j), gx+j*cell+cell/2, gyy-cell/2); }
    for(let i=0;i<N;i++){ ctx.fillStyle=(i===s.k)?COLOR.curS:COLOR.text; ctx.fillText(String(i), gx-28, gyy+i*cell+cell/2);
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
    ctx.fillText('BAND 3 · 為什麼枚舉中繼點就對', PAD, ty);
    const box=ty+12; rr(PAD,box,w-PAD*2,40,6); ctx.fillStyle=done?COLOR.on:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?COLOR.onS:COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(done){ ctx.fillStyle='#3f7a3a'; ctx.font='700 13px "JetBrains Mono", monospace'; ctx.fillText('O(V³) 三重迴圈 · V 小(≤100)時最短最好寫', w/2, box+20); }
    else { ctx.fillStyle=COLOR.text; ctx.font='600 12px "Noto Sans TC", sans-serif'; ctx.fillText('每個 k 都當一次「中繼站」,把所有經過 k 的間接路徑補上 → 順序無關,不必拓撲', w/2, box+20); }
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
