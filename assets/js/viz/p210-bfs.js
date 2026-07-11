/* ============================================================
   P210 · Course Schedule II — BFS / Kahn 拓撲排序(逐步播放)· vb
   邊 b→a 讓 indeg[a]++。把所有 indeg==0 的節點入隊(沒有前置)。反覆
   出隊、加入 order、把它的後繼 indeg−1;某後繼 indeg 歸零就入隊。若最後
   order 的長度 == numCourses 就是合法拓撲序,否則(有環)回空。
   例 numCourses=4, prereq=[[1,0],[2,0],[3,1],[3,2]] → [0,1,2,3]
     BAND 1  DAG + 每個節點目前 indeg(綠=已排入 order · 珊瑚=本步出隊)
     BAND 2  queue · order
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
    node:'#ffffff', nodeS:'#c9c9c1', cur:'#fbe7df', curS:'#d96e4e', done:'#d9e8c7', doneS:'#5fa866',
    inq:'#eef4fa', inqS:'#a9c4da', edge:'#b7c7d6', coral:'#d96e4e' };

  const EDGES = [[0,1],[0,2],[1,3],[2,3]];
  const steps = [
    { cur:-1, order:[], queue:[0], indeg:[0,1,1,2],
      text:'<strong>INITIAL</strong> · 邊 <code>b→a</code> 讓 <code>indeg[a]++</code>。indeg:<code>0→0, 1→1, 2→1, 3→2</code>。把 <strong>indeg==0</strong> 的 <code>0</code> 入隊(沒有前置)。' },
    { cur:0, order:[0], queue:[1,2], indeg:[0,0,0,2],
      text:'出隊 <code>0</code> → 加入 order。它的後繼 <code>1,2</code> 各 <code>indeg−1</code> → 都變 0 → <strong>入隊</strong>。' },
    { cur:1, order:[0,1], queue:[2], indeg:[0,0,0,1],
      text:'出隊 <code>1</code> → order=[0,1]。後繼 <code>3</code>:<code>indeg 2→1</code>(還沒 0,先不入隊)。' },
    { cur:2, order:[0,1,2], queue:[3], indeg:[0,0,0,0],
      text:'出隊 <code>2</code> → order=[0,1,2]。後繼 <code>3</code>:<code>indeg 1→0</code> → <strong>入隊</strong>。' },
    { cur:3, order:[0,1,2,3], queue:[], indeg:[0,0,0,0], done:true,
      text:'出隊 <code>3</code> → order=[0,1,2,3]。queue 空,<code>order.size()==4==numCourses</code> → <strong>合法拓撲序</strong>。' },
  ];

  const POS = {};
  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||450; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function arrow(ax,ay,bx,by,color){ const dx=bx-ax,dy=by-ay,L=Math.hypot(dx,dy),ux=dx/L,uy=dy/L,R=27;
    const sx=ax+ux*R,sy=ay+uy*R,ex=bx-ux*R,ey=by-uy*R; ctx.strokeStyle=color; ctx.lineWidth=2.4;
    ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(ex,ey); ctx.stroke();
    const a=Math.atan2(uy,ux),h=10; ctx.fillStyle=color; ctx.beginPath(); ctx.moveTo(ex,ey);
    ctx.lineTo(ex-h*Math.cos(a-0.4),ey-h*Math.sin(a-0.4)); ctx.lineTo(ex-h*Math.cos(a+0.4),ey-h*Math.sin(a+0.4)); ctx.closePath(); ctx.fill(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,h=canvas.clientHeight,PAD=26;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,h);
    POS[0]=[w/2,62]; POS[1]=[w/2-96,158]; POS[2]=[w/2+96,158]; POS[3]=[w/2,254];
    const inOrder=new Set(s.order), inQ=new Set(s.queue);

    // ── BAND 1 · DAG + indeg
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · DAG + 目前 indeg(綠=已排入 · 藍=在佇列 · 珊瑚=本步出隊)', PAD, 24);
    for(const [b,a] of EDGES) arrow(POS[b][0],POS[b][1],POS[a][0],POS[a][1],COLOR.edge);
    for(const id of [0,1,2,3]){ const [x,y]=POS[id]; const isCur=(id===s.cur); const done=inOrder.has(id)&&!isCur; const q=inQ.has(id)&&!isCur;
      ctx.beginPath(); ctx.arc(x,y,26,0,Math.PI*2);
      ctx.fillStyle=isCur?COLOR.cur:(done?COLOR.done:(q?COLOR.inq:COLOR.node)); ctx.fill();
      ctx.lineWidth=isCur?3.5:2.2; ctx.strokeStyle=isCur?COLOR.curS:(done?COLOR.doneS:(q?COLOR.inqS:COLOR.nodeS)); ctx.stroke();
      ctx.fillStyle=COLOR.ink; ctx.font='700 20px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(String(id), x, y+1);
      // indeg badge (to the outer side to avoid the top label / edges)
      const bx = (id===1) ? x-30 : x+30, ba = (id===1) ? 'right' : 'left';
      ctx.fillStyle=COLOR.coral; ctx.font='700 11px "JetBrains Mono", monospace'; ctx.textAlign=ba; ctx.textBaseline='middle'; ctx.fillText('in '+s.indeg[id], bx, y);
    }

    // ── BAND 2 · queue + order
    let by=292;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · queue(indeg 歸零就入隊)· order', PAD, by);
    const cy=by+12;
    // queue label + chips
    ctx.fillStyle=COLOR.text; ctx.font='700 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText('queue', PAD, cy+18);
    let qx=PAD+56; if(s.queue.length){ for(const v of s.queue){ rr(qx,cy,34,36,5); ctx.fillStyle=COLOR.inq; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=COLOR.inqS; ctx.stroke();
        ctx.fillStyle=COLOR.ink; ctx.font='700 16px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.fillText(String(v),qx+17,cy+18); qx+=42; } }
    else { ctx.fillStyle=COLOR.dim; ctx.font='600 12px "Noto Sans TC", sans-serif'; ctx.textAlign='left'; ctx.fillText('(空)', qx, cy+18); }
    // order row
    const oy=cy+46; ctx.fillStyle=COLOR.text; ctx.font='700 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText('order', PAD, oy+18);
    let ox=PAD+56; for(let i=0;i<4;i++){ const filled=i<s.order.length; rr(ox,oy,34,36,5);
      ctx.fillStyle=filled?COLOR.done:'#f3f3ef'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=filled?COLOR.doneS:COLOR.grid; ctx.stroke();
      ctx.fillStyle=filled?COLOR.ink:COLOR.grid; ctx.font='700 16px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(filled?String(s.order[i]):'·', ox+17, oy+18); ox+=42; }

    // ── BAND 3 · note
    const ty=oy+52, done=!!s.done;
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 為什麼 order 長度 == numCourses', PAD, ty);
    const box=ty+12; rr(PAD,box,w-PAD*2,38,6); ctx.fillStyle=done?COLOR.done:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?COLOR.doneS:COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(done){ ctx.fillStyle='#3f7a3a'; ctx.font='700 13px "JetBrains Mono", monospace'; ctx.fillText('return [0,1,2,3] · 全部排入 = 無環', w/2, box+19); }
    else { ctx.fillStyle=COLOR.text; ctx.font='600 12px "Noto Sans TC", sans-serif'; ctx.fillText('有環的節點 indeg 永遠 >0、進不了佇列 → order 短少 → 回空', w/2, box+19); }
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
