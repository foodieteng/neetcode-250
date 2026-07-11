/* ============================================================
   P207 · Course Schedule — DFS 三態判環(逐步播放)· va
   能不能修完所有課 ⇔ 依賴圖中「沒有環」。DFS 用 visit 三態:0 未訪 /
   1 在當前遞迴路徑上 / 2 已完成。若沿當前路徑走回到一個「還在路徑上(1)」
   的節點 = 有環 → 回 false(修不完)。
   例 graph: 3→0, 0→1, 1→2, 2→0(0,1,2 成環)
     BAND 1  依賴圖(白=未訪 · 珊瑚=在路徑上(1) · 綠=完成(2) · 紅=環邊)
     BAND 2  遞迴呼叫堆疊(當前路徑)
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
    node:'#ffffff', nodeS:'#c9c9c1', path:'#fbe7df', pathS:'#d96e4e', done:'#d9e8c7', doneS:'#5fa866',
    edge:'#b7c7d6', coral:'#d96e4e', bad:'#d64545', chip:'#fbe7df', chipS:'#d96e4e' };

  const EDGES = [[3,0],[0,1],[1,2],[2,0]]; // u -> v
  // visit: 0 unvisited / 1 on-path / 2 done
  const steps = [
    { visit:[0,0,0,0], stack:[], bad:null,
      text:'<strong>INITIAL</strong> · 「能修完所有課」⇔ 依賴圖<strong>沒有環</strong>。用 <code>visit</code> 三態:<code>0</code> 未訪 / <code>1</code> 在當前路徑上 / <code>2</code> 完成。從 <code>0</code> 開始 DFS。' },
    { visit:[1,0,0,0], stack:[0], bad:null,
      text:'<code>dfs(0)</code>:標 <code>visit[0]=1</code>(進行中,壓入堆疊)。往鄰居 <code>1</code> 走。' },
    { visit:[1,1,0,0], stack:[0,1], bad:null,
      text:'<code>dfs(1)</code>:標 <code>visit[1]=1</code>。往鄰居 <code>2</code> 走。' },
    { visit:[1,1,1,0], stack:[0,1,2], bad:null,
      text:'<code>dfs(2)</code>:標 <code>visit[2]=1</code>。<code>2</code> 的鄰居是 <code>0</code> —— 檢查 <code>visit[0]</code>…' },
    { visit:[1,1,1,0], stack:[0,1,2], bad:[2,0], done:true,
      text:'<code>visit[0]==1</code>(<strong>還在當前路徑上!</strong>)→ 沿邊 <code>2→0</code> 繞回自己 = <strong>環</strong> → <code>hasCycle</code> 回 <code>true</code> → <code>canFinish=false</code>。' },
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

    // ── BAND 1 · graph
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 依賴圖(白=未訪 · 珊瑚=在路徑上(1) · 綠=完成(2) · 紅=環邊)', PAD, 24);
    for(const [u,v] of EDGES){ const isBad=s.bad&&s.bad[0]===u&&s.bad[1]===v;
      arrow(POS[u][0],POS[u][1],POS[v][0],POS[v][1], isBad?COLOR.bad:COLOR.edge, isBad?3.4:2.4); }
    for(const id of [0,1,2,3]){ const [x,y]=POS[id]; const st=s.visit[id];
      const isBadHit=s.bad&&s.bad[1]===id;
      ctx.beginPath(); ctx.arc(x,y,26,0,Math.PI*2);
      ctx.fillStyle=(st===1)?COLOR.path:(st===2?COLOR.done:COLOR.node); ctx.fill();
      ctx.lineWidth=isBadHit?3.8:(st===1?3.2:2.2); ctx.strokeStyle=isBadHit?COLOR.bad:(st===1?COLOR.pathS:(st===2?COLOR.doneS:COLOR.nodeS)); ctx.stroke();
      ctx.fillStyle=COLOR.ink; ctx.font='700 20px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(String(id), x, y+1);
      // state badge to the side
      const bx=(id===1)?x+32:x-32, ba=(id===1)?'left':'right';
      ctx.fillStyle=st===0?COLOR.dim:(st===1?COLOR.pathS:COLOR.doneS); ctx.font='700 11px "JetBrains Mono", monospace'; ctx.textAlign=ba; ctx.textBaseline='middle'; ctx.fillText(String(st), bx, y); }

    // ── BAND 2 · recursion stack
    let by=304;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 遞迴呼叫堆疊(= 當前路徑上的節點)', PAD, by);
    const cy=by+14;
    ctx.fillStyle=COLOR.text; ctx.font='700 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText('stack', PAD, cy+18);
    let sx=PAD+56;
    if(s.stack.length){ for(const v of s.stack){ rr(sx,cy,34,36,5); ctx.fillStyle=COLOR.chip; ctx.fill(); ctx.lineWidth=1.8; ctx.strokeStyle=COLOR.chipS; ctx.stroke();
        ctx.fillStyle=COLOR.ink; ctx.font='700 16px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(String(v),sx+17,cy+18); sx+=42; }
      ctx.fillStyle=COLOR.dim; ctx.font='600 11px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.fillText('← top', sx+2, cy+18); }
    else { ctx.fillStyle=COLOR.dim; ctx.font='600 12px "Noto Sans TC", sans-serif'; ctx.textAlign='left'; ctx.fillText('(空)', sx, cy+18); }

    // ── BAND 3 · note
    const ty=cy+62, done=!!s.done;
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 三態如何抓到環', PAD, ty);
    const box=ty+12; rr(PAD,box,w-PAD*2,40,6); ctx.fillStyle=done?'#fbe3e0':'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?COLOR.bad:COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(done){ ctx.fillStyle='#b3352f'; ctx.font='700 13.5px "JetBrains Mono", monospace'; ctx.fillText('return false · 走回「路徑上(1)」的節點 = 環', w/2, box+20); }
    else { ctx.fillStyle=COLOR.text; ctx.font='600 12.5px "Noto Sans TC", sans-serif'; ctx.fillText('只有走回「1(還在堆疊上)」才是環;走到「2(已完成)」只是重複到達,不算', w/2, box+20); }
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
