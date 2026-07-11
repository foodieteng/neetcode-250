/* ============================================================
   CSES Planets and Kingdoms · SCC — Kosaraju 兩趟 DFS(逐步播放)· viz
   強連通分量:一群節點彼此都能互相到達。Kosaraju:
     第一趟 在原圖 G 上 DFS,依「完成時間」把節點壓入 stack(後序)。
     第二趟 依 stack 由頂往下彈,在「反圖」上 DFS,每棵 DFS 樹 = 一個 SCC。
   例 1→2→3→1(環)、3→4、4→5 → SCC:{1,2,3}、{4}、{5}
     BAND 1  圖(第一趟原圖 · 第二趟反圖;顏色=SCC 編號)
     BAND 2  完成序 stack · SCC 計數 k
     BAND 3  說明
   ============================================================ */
(function () {
  const canvas = document.getElementById('viz-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('viz-step'), labelEl = document.getElementById('viz-label');
  const bPrev = document.getElementById('viz-prev'), bNext = document.getElementById('viz-next'),
        bPlay = document.getElementById('viz-play'), bReset = document.getElementById('viz-reset');

  const COLOR = { paper:'#ffffff', ink:'#1a1a1a', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf',
    node:'#ffffff', nodeS:'#c9c9c1', cur:'#d96e4e', seen:'#eef4fa', seenS:'#a9c4da', edge:'#b7c7d6', coral:'#d96e4e' };
  const SCC = { 1:{f:'#d9e8c7',s:'#5fa866',t:'#3f7a3a'}, 2:{f:'#dbe8f6',s:'#4478c0',t:'#2f5f9e'}, 3:{f:'#fbe6cf',s:'#d98a3e',t:'#a8621c'} };

  const E = [[1,2],[2,3],[3,1],[3,4],[4,5]];
  const steps = [
    { phase:1, rev:false, stack:[], comp:{}, cur:null,
      text:'<strong>INITIAL</strong> · 求<strong>強連通分量(SCC)</strong>:一群彼此都能互達的點。Kosaraju <strong>兩趟</strong> DFS:先在原圖依完成時間壓 stack,再在反圖依序彈出、每棵樹一個 SCC。' },
    { phase:1, rev:false, stack:[5,4,3,2,1], comp:{}, cur:null,
      text:'<strong>第一趟</strong>(原圖 G)· DFS 依<strong>完成時間</strong>壓入 stack(後序:先做完的先壓底)。完成序 → <code>stack = [5,4,3,2,1]</code>,<strong>top = 1</strong>。' },
    { phase:2, rev:true, stack:[5,4,3,2,1], comp:{}, cur:1,
      text:'<strong>第二趟</strong> · 把所有邊<strong>反向</strong>。從 stack 頂端彈出 <code>1</code>(完成最晚的)當起點,在<strong>反圖</strong>上 DFS。' },
    { phase:2, rev:true, stack:[5,4,3,2], comp:{1:1,2:1,3:1}, cur:1,
      text:'<code>dfs2(1)</code> 在反圖上只走得到 <code>3、2</code>(同一個環)→ 三點同一組 → <strong>SCC #1 = {1,2,3}</strong>。' },
    { phase:2, rev:true, stack:[5], comp:{1:1,2:1,3:1,4:2}, cur:4,
      text:'彈出 <code>2、3</code>:已分派,跳過。彈出 <code>4</code>:反圖上 <code>4→3</code> 已分派 → 只有自己 → <strong>SCC #2 = {4}</strong>。' },
    { phase:2, rev:true, stack:[], comp:{1:1,2:1,3:1,4:2,5:3}, cur:5, done:true,
      text:'彈出 <code>5</code>:反圖上 <code>5→4</code> 已分派 → 只有自己 → <strong>SCC #3 = {5}</strong>。stack 空,<code>k = 3</code> 個強連通分量。' },
  ];

  const POS = {};
  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||480; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function arrow(ax,ay,bx,by,color,wdt){ const dx=bx-ax,dy=by-ay,L=Math.hypot(dx,dy),ux=dx/L,uy=dy/L,R=24;
    const sx=ax+ux*R,sy=ay+uy*R,ex=bx-ux*R,ey=by-uy*R; ctx.strokeStyle=color; ctx.lineWidth=wdt||2.3;
    ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(ex,ey); ctx.stroke();
    const a=Math.atan2(uy,ux),h=10; ctx.fillStyle=color; ctx.beginPath(); ctx.moveTo(ex,ey);
    ctx.lineTo(ex-h*Math.cos(a-0.4),ey-h*Math.sin(a-0.4)); ctx.lineTo(ex-h*Math.cos(a+0.4),ey-h*Math.sin(a+0.4)); ctx.closePath(); ctx.fill(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,h=canvas.clientHeight,PAD=26; const cx=w/2;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,h);
    POS[1]=[cx-150,84]; POS[2]=[cx-40,84]; POS[3]=[cx-108,196]; POS[4]=[cx+66,140]; POS[5]=[cx+178,140];

    // ── BAND 1 · graph
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · '+(s.rev?'反圖(第二趟:邊全部反向)':'原圖 G(第一趟)')+' · 顏色=SCC', PAD, 22);
    for(const [a,b] of E){ const A=s.rev?b:a, B=s.rev?a:b; arrow(POS[A][0],POS[A][1],POS[B][0],POS[B][1], COLOR.edge, 2.3); }
    for(const id of [1,2,3,4,5]){ const [x,y]=POS[id]; const c=s.comp[id]; const isCur=(id===s.cur);
      const pal=c?SCC[c]:null;
      ctx.beginPath(); ctx.arc(x,y,23,0,Math.PI*2);
      ctx.fillStyle=pal?pal.f:(s.phase===1&&s.stack.length?COLOR.seen:COLOR.node); ctx.fill();
      ctx.lineWidth=isCur?3.8:2.2; ctx.strokeStyle=isCur?COLOR.cur:(pal?pal.s:(s.phase===1&&s.stack.length?COLOR.seenS:COLOR.nodeS)); ctx.stroke();
      ctx.fillStyle=pal?pal.t:COLOR.ink; ctx.font='700 17px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(String(id),x,y+1); }

    // ── BAND 2 · stack + k
    let by=278;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 完成序 stack(由頂端彈出)· SCC 計數 k', PAD, by);
    const cy=by+16;
    ctx.fillStyle=COLOR.text; ctx.font='700 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText('stack', PAD, cy+18);
    // stack shown with top on the LEFT
    const disp=s.stack.slice().reverse();
    let qx=PAD+58;
    if(disp.length){ ctx.fillStyle=COLOR.dim; ctx.font='600 10px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.fillText('top', qx, cy-2);
      for(let i=0;i<disp.length;i++){ const v=disp[i]; rr(qx,cy,34,36,5); ctx.fillStyle=(i===0)?'#fbe7df':'#eef4fa'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=(i===0)?COLOR.coral:COLOR.seenS; ctx.stroke();
        ctx.fillStyle=COLOR.ink; ctx.font='700 16px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(String(v),qx+17,cy+18); qx+=42; } }
    else { ctx.fillStyle=COLOR.dim; ctx.font='600 12px "Noto Sans TC", sans-serif'; ctx.textAlign='left'; ctx.fillText('(空)', qx, cy+18); }
    // k counter
    const kcount=new Set(Object.values(s.comp)).size;
    ctx.fillStyle=COLOR.text; ctx.font='700 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText('k =', PAD+330, cy+18);
    ctx.fillStyle=s.done?SCC[1].t:COLOR.text; ctx.font='700 18px "JetBrains Mono", monospace'; ctx.fillText(String(kcount), PAD+366, cy+18);

    // ── BAND 3 · note
    const ty=cy+64, done=!!s.done;
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 為什麼第二趟只框住一個 SCC', PAD, ty);
    const box=ty+12; rr(PAD,box,w-PAD*2,40,6); ctx.fillStyle=done?SCC[1].f:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?SCC[1].s:COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(done){ ctx.fillStyle=SCC[1].t; ctx.font='700 13px "JetBrains Mono", monospace'; ctx.fillText('3 個 SCC:{1,2,3} · {4} · {5}', w/2, box+20); }
    else { ctx.fillStyle=COLOR.text; ctx.font='600 12px "Noto Sans TC", sans-serif'; ctx.fillText('完成最晚的點在「源頭」SCC;反圖上從它出發只到得了自己這一組', w/2, box+20); }
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
