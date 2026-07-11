/* ============================================================
   P207 · Course Schedule — BFS / Kahn 判環(逐步播放)· vb
   邊 b→a 讓 indeg[a]++。把 indeg==0 的入隊、逐個剝、後繼 indeg−1、歸零
   入隊,並數出隊數 done。環上的節點互為前置,indeg 永遠 >0、進不了佇列。
   最後 done < numCourses 就代表有環 → 修不完(canFinish=false)。
   例 graph: 3→0, 0→1, 1→2, 2→0(0,1,2 成環)
     indeg: 0→2(來自 3、2), 1→1, 2→1, 3→0
     BAND 1  依賴圖 + 目前 indeg(綠=已剝 · 紅=卡在環)
     BAND 2  queue · done 計數
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
    node:'#ffffff', nodeS:'#c9c9c1', done:'#d9e8c7', doneS:'#5fa866', inq:'#eef4fa', inqS:'#a9c4da',
    edge:'#b7c7d6', coral:'#d96e4e', bad:'#d64545', stuck:'#fbe3e0', stuckS:'#d64545' };

  const EDGES = [[3,0],[0,1],[1,2],[2,0]];
  const CYCLE = [0,1,2];
  const steps = [
    { indeg:[2,1,1,0], queue:[3], done:0, popped:[], stuck:false,
      text:'<strong>INITIAL</strong> · 算 indeg:<code>0→2</code>(來自 3、2)、<code>1→1</code>、<code>2→1</code>、<code>3→0</code>。只有 <code>3</code> 是 0 → 入隊。' },
    { indeg:[1,1,1,0], queue:[], done:1, popped:[3], stuck:false,
      text:'出隊 <code>3</code> → done=1。後繼 <code>0</code>:<code>indeg 2→1</code>(還沒 0,不入隊)。queue <strong>空了</strong>。' },
    { indeg:[1,1,1,0], queue:[], done:1, popped:[3], stuck:true,
      text:'觀察環:<code>0 等 2</code>、<code>2 等 1</code>、<code>1 等 0</code> —— <strong>循環等待</strong>,三者 indeg 永遠減不到 0、誰都進不了佇列。' },
    { indeg:[1,1,1,0], queue:[], done:1, popped:[3], stuck:true, fin:true,
      text:'queue 空但 <code>done=1 ≠ 4=numCourses</code> → 有節點卡在環裡沒被剝 → <strong>有環</strong> → <code>canFinish=false</code>。' },
  ];

  const POS = {};
  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||450; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function arrow(ax,ay,bx,by,color,wdt){ const dx=bx-ax,dy=by-ay,L=Math.hypot(dx,dy),ux=dx/L,uy=dy/L,R=27;
    const sx=ax+ux*R,sy=ay+uy*R,ex=bx-ux*R,ey=by-uy*R; ctx.strokeStyle=color; ctx.lineWidth=wdt||2.4;
    ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(ex,ey); ctx.stroke();
    const a=Math.atan2(uy,ux),h=11; ctx.fillStyle=color; ctx.beginPath(); ctx.moveTo(ex,ey);
    ctx.lineTo(ex-h*Math.cos(a-0.4),ey-h*Math.sin(a-0.4)); ctx.lineTo(ex-h*Math.cos(a+0.4),ey-h*Math.sin(a+0.4)); ctx.closePath(); ctx.fill(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,h=canvas.clientHeight,PAD=26;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,h);
    POS[3]=[w/2-150,72]; POS[0]=[w/2,72]; POS[1]=[w/2+112,176]; POS[2]=[w/2-8,262];
    const inQ=new Set(s.queue), popped=new Set(s.popped);

    // ── BAND 1 · graph + indeg
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 依賴圖 + 目前 indeg(綠=已剝出 · 藍=在佇列 · 紅=卡在環)', PAD, 24);
    for(const [u,v] of EDGES){ const cycEdge=s.stuck&&CYCLE.includes(u)&&CYCLE.includes(v);
      arrow(POS[u][0],POS[u][1],POS[v][0],POS[v][1], cycEdge?COLOR.bad:COLOR.edge, cycEdge?3.2:2.4); }
    for(const id of [0,1,2,3]){ const [x,y]=POS[id]; const done=popped.has(id); const q=inQ.has(id)&&!done;
      const stuck=s.stuck && CYCLE.includes(id);
      ctx.beginPath(); ctx.arc(x,y,26,0,Math.PI*2);
      ctx.fillStyle=done?COLOR.done:(q?COLOR.inq:(stuck?COLOR.stuck:COLOR.node)); ctx.fill();
      ctx.lineWidth=stuck?3.4:2.2; ctx.strokeStyle=done?COLOR.doneS:(q?COLOR.inqS:(stuck?COLOR.stuckS:COLOR.nodeS)); ctx.stroke();
      ctx.fillStyle=COLOR.ink; ctx.font='700 20px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(String(id), x, y+1);
      const bx=(id===1)?x+32:x-32, ba=(id===1)?'left':'right';
      ctx.fillStyle=stuck?COLOR.bad:COLOR.coral; ctx.font='700 11px "JetBrains Mono", monospace'; ctx.textAlign=ba; ctx.textBaseline='middle'; ctx.fillText('in '+s.indeg[id], bx, y); }

    // ── BAND 2 · queue + done
    let by=304;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · queue(indeg 歸零就入隊)· done 計數', PAD, by);
    const cy=by+14;
    ctx.fillStyle=COLOR.text; ctx.font='700 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText('queue', PAD, cy+18);
    let qx=PAD+56;
    if(s.queue.length){ for(const v of s.queue){ rr(qx,cy,34,36,5); ctx.fillStyle=COLOR.inq; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=COLOR.inqS; ctx.stroke();
        ctx.fillStyle=COLOR.ink; ctx.font='700 16px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(String(v),qx+17,cy+18); qx+=42; } }
    else { ctx.fillStyle=COLOR.dim; ctx.font='600 12px "Noto Sans TC", sans-serif'; ctx.textAlign='left'; ctx.fillText('(空)', qx, cy+18); }
    // done counter
    ctx.fillStyle=COLOR.text; ctx.font='700 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText('done', PAD+300, cy+18);
    ctx.fillStyle=s.fin?COLOR.bad:COLOR.text; ctx.font='700 16px "JetBrains Mono", monospace'; ctx.fillText(s.done+' / 4', PAD+346, cy+18);

    // ── BAND 3 · note
    const ty=cy+62, fin=!!s.fin;
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 為什麼 done < numCourses = 有環', PAD, ty);
    const box=ty+12; rr(PAD,box,w-PAD*2,40,6); ctx.fillStyle=fin?'#fbe3e0':'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=fin?COLOR.bad:COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(fin){ ctx.fillStyle='#b3352f'; ctx.font='700 13.5px "JetBrains Mono", monospace'; ctx.fillText('return false · done=1 < 4 · 環上三點永遠沒被剝出', w/2, box+20); }
    else { ctx.fillStyle=COLOR.text; ctx.font='600 12.5px "Noto Sans TC", sans-serif'; ctx.fillText('環上的節點彼此互為前置,indeg 減不到 0 → 進不了佇列 → 剝不出來', w/2, box+20); }
  }

  function update(){ const s=steps[step]; if(stepEl) stepEl.textContent=String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0'); if(labelEl) labelEl.innerHTML=s.text; draw(); }
  function next(){ if(step<steps.length-1){step++;update();}else stop(); }
  function prev(){ if(step>0){step--;update();} }
  function reset(){ stop(); step=0; update(); }
  function play(){ if(timer){stop();return;} bPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){stop();return;} next(); },1600); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} if(bPlay) bPlay.textContent='Play'; }
  bPrev&&bPrev.addEventListener('click',prev); bNext&&bNext.addEventListener('click',next); bPlay&&bPlay.addEventListener('click',play); bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();}); if(window.ResizeObserver){ new ResizeObserver(()=>{fit();draw();}).observe(canvas); }
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw); fit(); update();
})();
