/* ============================================================
   P261 · Graph Valid Tree — Union-Find(逐步播放)· viz
   合法樹 ⟺ 剛好 n-1 條邊 且 全連通(無環)。用並查集:每條邊 union 兩端;
   若兩端「已在同一組(find 同根)」→ union 回 false = 出現環 → 非樹。
   union by size:小樹掛到大樹下(parent[root] 存 -size)。
   例 n=5, edges=[[0,1],[0,2],[0,3],[1,4]] → 合法樹
     BAND 1  並查集森林(綠=已併入同組 · 箭頭=指向父/根)
     BAND 2  parent[](負值=根,絕對值=size)· add 計數
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
    node:'#ffffff', nodeS:'#c9c9c1', root:'#fbe7df', rootS:'#d96e4e', on:'#d9e8c7', onS:'#5fa866',
    onT:'#3f7a3a', edge:'#8fae6e', coral:'#d96e4e', bad:'#d64545' };

  // star example: everyone attaches to root 0
  const steps = [
    { parent:[-1,-1,-1,-1,-1], joined:[0,1,2,3,4], links:[], add:0, u:null, reject:null,
      text:'<strong>INITIAL</strong> · 合法樹 ⟺ 剛好 <code>n-1</code> 條邊 <strong>且</strong> 全連通(無環)。前置檢查:<code>edges=4 == n-1=4</code> ✓。5 個各自獨立(<code>parent</code> 全 <code>-1</code> = 各為根、size 1)。' },
    { parent:[-2,0,-1,-1,-1], joined:[], links:[[1,0]], add:1, u:[0,1], reject:null,
      text:'<code>union(0,1)</code>:不同根 → 合併。<code>1</code> 掛到 <code>0</code> 下,<code>parent[0]=-2</code>(size 2)。<code>add=1</code>。' },
    { parent:[-3,0,0,-1,-1], joined:[], links:[[1,0],[2,0]], add:2, u:[0,2], reject:null,
      text:'<code>union(0,2)</code>:<code>2</code> 掛到較大的 <code>0</code> 下(union by size)。<code>parent[0]=-3</code>。<code>add=2</code>。' },
    { parent:[-4,0,0,0,-1], joined:[], links:[[1,0],[2,0],[3,0]], add:3, u:[0,3], reject:null,
      text:'<code>union(0,3)</code>:<code>3</code> 掛到 <code>0</code>。<code>parent[0]=-4</code>。<code>add=3</code>。' },
    { parent:[-5,0,0,0,0], joined:[], links:[[1,0],[2,0],[3,0],[4,0]], add:4, u:[1,4], reject:null,
      text:'<code>union(1,4)</code>:<code>find(1)=0</code> → <code>4</code> 掛到 <code>0</code>。<code>parent[0]=-5</code>(全連通)。<code>add=4</code>。' },
    { parent:[-5,0,0,0,0], joined:[], links:[[1,0],[2,0],[3,0],[4,0]], add:4, u:null, reject:[2,4], done:true,
      text:'<code>add=4 == n-1</code> 且 <code>edges=4 == n-1</code> → <strong>合法樹 ✓</strong>。<span style="color:#b3352f">反例</span>:若再加邊 <code>(2,4)</code>,<code>find(2)=find(4)=0</code> <strong>同根</strong> → <code>union</code> 回 <code>false</code> = <strong>有環 → 非樹</strong>。' },
  ];

  const POS = {};
  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||490; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function arrow(ax,ay,bx,by,color,wdt,dash){ const dx=bx-ax,dy=by-ay,L=Math.hypot(dx,dy),ux=dx/L,uy=dy/L,R=23;
    const sx=ax+ux*R,sy=ay+uy*R,ex=bx-ux*R,ey=by-uy*R; ctx.strokeStyle=color; ctx.lineWidth=wdt||2.3; ctx.setLineDash(dash||[]);
    ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(ex,ey); ctx.stroke(); ctx.setLineDash([]);
    const a=Math.atan2(uy,ux),h=10; ctx.fillStyle=color; ctx.beginPath(); ctx.moveTo(ex,ey);
    ctx.lineTo(ex-h*Math.cos(a-0.4),ey-h*Math.sin(a-0.4)); ctx.lineTo(ex-h*Math.cos(a+0.4),ey-h*Math.sin(a+0.4)); ctx.closePath(); ctx.fill(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,h=canvas.clientHeight,PAD=26; const cx=w/2;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,h);
    POS[0]=[cx,130]; POS[1]=[cx-128,72]; POS[2]=[cx+128,72]; POS[3]=[cx-128,190]; POS[4]=[cx+128,190];
    // who's in root-0's set: any node that has a link chain to 0, plus 0 itself
    const inSet=new Set([0]); for(const [c,p] of s.links){ inSet.add(c); inSet.add(p); }

    // ── BAND 1 · DSU forest
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 並查集森林(綠=同一組 · 箭頭=指向父/根 · 珊瑚=根)', PAD, 22);
    for(const [c,p] of s.links) arrow(POS[c][0],POS[c][1],POS[p][0],POS[p][1],COLOR.edge,2.6);
    if(s.reject){ const [a,b]=s.reject; arrow(POS[a][0],POS[a][1],POS[b][0],POS[b][1],COLOR.bad,2.6,[6,5]);
      const mx=(POS[a][0]+POS[b][0])/2, my=(POS[a][1]+POS[b][1])/2; ctx.fillStyle=COLOR.bad; ctx.font='700 11px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('✗ 同根', mx, my); }
    for(const id of [0,1,2,3,4]){ const [x,y]=POS[id]; const isU=s.u&&(s.u.includes(id)); const isRoot=(s.parent[id]<0);
      const on=inSet.has(id); const single=(step===0);
      ctx.beginPath(); ctx.arc(x,y,23,0,Math.PI*2);
      ctx.fillStyle=(isRoot&&on&&!single)?COLOR.root:(on&&!single?COLOR.on:COLOR.node); ctx.fill();
      ctx.lineWidth=isU?3.6:2.2; ctx.strokeStyle=isU?COLOR.coral:((isRoot&&on&&!single)?COLOR.rootS:(on&&!single?COLOR.onS:COLOR.nodeS)); ctx.stroke();
      ctx.fillStyle=(on&&!single)?COLOR.onT:COLOR.ink; ctx.font='700 17px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(String(id),x,y+1);
      if(isRoot&&!single){ ctx.fillStyle=COLOR.rootS; ctx.font='700 10px "JetBrains Mono", monospace'; ctx.fillText('root', x, y-32); }
    }

    // ── BAND 2 · parent[] + add
    let by=258;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · parent[](負值=根,|值|=size)· add 計數', PAD, by);
    const cell=46, gx=PAD+64, cy=by+16;
    ctx.fillStyle=COLOR.dim; ctx.font='700 11px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText('idx', PAD, cy);
    for(let j=0;j<5;j++){ ctx.fillStyle=COLOR.dim; ctx.font='700 11px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.fillText(String(j), gx+j*cell+cell/2-3, cy); }
    ctx.fillStyle=COLOR.text; ctx.font='700 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText('parent', PAD, cy+38);
    for(let j=0;j<5;j++){ const x=gx+j*cell; const val=s.parent[j]; const isRoot=val<0;
      rr(x+3,cy+24,cell-8,28,5); ctx.fillStyle=isRoot?'#fbe7df':'#eef4fa'; ctx.fill(); ctx.lineWidth=1.4; ctx.strokeStyle=isRoot?COLOR.rootS:'#a9c4da'; ctx.stroke();
      ctx.fillStyle=COLOR.ink; ctx.font='700 14px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(String(val), x+cell/2-1, cy+38); }
    // add counter
    ctx.fillStyle=COLOR.text; ctx.font='700 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText('add =', gx+5*cell+16, cy+38);
    ctx.fillStyle=s.done?COLOR.onT:COLOR.text; ctx.font='700 18px "JetBrains Mono", monospace'; ctx.fillText(s.add+' / 4', gx+5*cell+66, cy+38);

    // ── BAND 3 · note
    const ty=cy+78, done=!!s.done;
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 合法樹的兩個條件', PAD, ty);
    const box=ty+12; rr(PAD,box,w-PAD*2,40,6); ctx.fillStyle=done?COLOR.on:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?COLOR.onS:COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(done){ ctx.fillStyle=COLOR.onT; ctx.font='700 13px "JetBrains Mono", monospace'; ctx.fillText('n-1 條邊 + 每次 union 都成功(無環)= 合法樹', w/2, box+20); }
    else { ctx.fillStyle=COLOR.text; ctx.font='600 12px "Noto Sans TC", sans-serif'; ctx.fillText('每次 union 成功代表接上「新的一組」;若兩端已同根 → 這條邊造成環', w/2, box+20); }
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
