/* ============================================================
   P210 · Course Schedule II — DFS 後序拓撲排序(逐步播放)· va
   有向邊 b→a:b 必須排在 a 前。DFS 後序:一個節點的所有後代都處理
   完(排進 finish)才輪到它;最後把 finish 反轉 = 拓撲序。visit 三態
   (0 未訪 / 1 進行中 / 2 完成):遇到「進行中」的節點 = 有環 → 回空。
   例 numCourses=4, prereq=[[1,0],[2,0],[3,1],[3,2]] → [0,2,1,3]
     BAND 1  DAG(白=未訪 · 紅=本步完成 · 綠=已完成)
     BAND 2  finish(後序)→ 反轉 = 拓撲序
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
    node:'#ffffff', nodeS:'#c9c9c1', cur:'#fbe1e1', curS:'#cf3535', done:'#d9e8c7', doneS:'#5fa866',
    edge:'#b7c7d6', coral:'#cf3535', chip:'#eef4fa', chipS:'#a9c4da' };

  const EDGES = [[0,1],[0,2],[1,3],[2,3]]; // b -> a
  const steps = [
    { done:[], just:-1, finish:[], rev:null,
      text:'<strong>INITIAL</strong> · 邊 <code>b→a</code>:b 排在 a 前。DFS <strong>後序</strong>:一個節點的<strong>所有後代都排好</strong>才輪到它;最後<strong>反轉</strong> finish = 拓撲序。' },
    { done:[3], just:3, finish:[3], rev:null,
      text:'DFS <code>0→1→3</code>。<code>3</code> 沒有後代 → <strong>最先完成</strong>,加入 finish。' },
    { done:[3,1], just:1, finish:[3,1], rev:null,
      text:'回到 <code>1</code>:它唯一的後代 <code>3</code> 已完成 → <code>1</code> 完成,加入 finish。' },
    { done:[3,1,2], just:2, finish:[3,1,2], rev:null,
      text:'回到 <code>0</code> 走另一支 <code>0→2</code>(<code>2→3</code> 但 3 已完成)→ <code>2</code> 完成。' },
    { done:[3,1,2,0], just:0, finish:[3,1,2,0], rev:null,
      text:'所有後代都排完 → <code>0</code> 最後完成。<code>finish = [3,1,2,0]</code>(完成的先後)。' },
    { done:[3,1,2,0], just:-1, finish:[3,1,2,0], rev:[0,2,1,3],
      text:'把 finish <strong>反轉</strong> → <code>[0,2,1,3]</code> = 合法拓撲序(0 在 1、2 前;1、2 在 3 前)。' },
  ];

  const POS = {}; // filled per width
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

    // ── BAND 1 · DAG
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 依賴圖 b→a(白=未訪 · 紅=本步完成 · 綠=已完成)', PAD, 24);
    for(const [b,a] of EDGES) arrow(POS[b][0],POS[b][1],POS[a][0],POS[a][1],COLOR.edge);
    for(const id of [0,1,2,3]){ const [x,y]=POS[id]; const done=s.done.includes(id); const just=(id===s.just);
      ctx.beginPath(); ctx.arc(x,y,26,0,Math.PI*2);
      ctx.fillStyle=just?COLOR.cur:(done?COLOR.done:COLOR.node); ctx.fill();
      ctx.lineWidth=just?3.5:2.2; ctx.strokeStyle=just?COLOR.curS:(done?COLOR.doneS:COLOR.nodeS); ctx.stroke();
      ctx.fillStyle=COLOR.ink; ctx.font='700 20px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(String(id), x, y+1);
    }

    // ── BAND 2 · finish + reversed
    let by=292;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText(s.rev?'BAND 2 · 反轉 finish = 拓撲序':'BAND 2 · finish(完成的先後順序)', PAD, by);
    const cy=by+12; const arr=s.rev?s.rev:s.finish; const isRev=!!s.rev;
    const cw=52, gp=10;
    for(let i=0;i<4;i++){ const x=PAD+i*(cw+gp); const filled=i<arr.length;
      rr(x,cy,cw,40,6); ctx.fillStyle=filled?(isRev?COLOR.done:COLOR.chip):'#f3f3ef'; ctx.fill();
      ctx.lineWidth=1.6; ctx.strokeStyle=filled?(isRev?COLOR.doneS:COLOR.chipS):COLOR.grid; ctx.stroke();
      ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillStyle=filled?COLOR.ink:COLOR.grid; ctx.font='700 18px "JetBrains Mono", monospace';
      ctx.fillText(filled?String(arr[i]):'·', x+cw/2, cy+21); }
    if(isRev){ ctx.fillStyle=COLOR.doneS; ctx.font='700 13px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='middle';
      ctx.fillText('← 反轉自 finish [3,1,2,0]', PAD+4*(cw+gp)+6, cy+21); }

    // ── BAND 3 · note
    const ty=cy+58, done=!!s.rev;
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 後序 + 反轉 · 三態判環', PAD, ty);
    const box=ty+12; rr(PAD,box,w-PAD*2,40,6); ctx.fillStyle=done?COLOR.done:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?COLOR.doneS:COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(done){ ctx.fillStyle='#3f7a3a'; ctx.font='700 13.5px "JetBrains Mono", monospace'; ctx.fillText('return [0,2,1,3] · 後序完成序反轉 = 拓撲序', w/2, box+20); }
    else { ctx.fillStyle=COLOR.text; ctx.font='600 12.5px "Noto Sans TC", sans-serif'; ctx.fillText('visit:0未訪 / 1進行中 / 2完成;遇到「1(進行中)」= 有環 → 回空', w/2, box+20); }
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
