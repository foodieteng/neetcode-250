/* ============================================================
   P1631 寫法 A · Union-Find / Kruskal(邊權 = 相鄰格高度差 |Δ|)
   把相鄰格之間的邊照 |Δ| 由小到大加入、union 兩格;一旦 START 與
   END 落到同一分量,當前邊的權重就是答案(= 路徑上最大 |Δ| 的最小值)。
   Walks grid = [[1,2,2],[3,8,2],[5,3,5]]  →  2
     BAND 1  grid + 已加入的邊(藍=與 START 同區,棕=其他島)
     BAND 2  目前加入的邊 · |Δ|
     BAND 3  START ↔ END 連通 → 答案
   ============================================================ */
(function () {
  const canvas = document.getElementById('va-canvas');
  if (!canvas) return;
  const ctx=canvas.getContext('2d');
  const stepEl=document.getElementById('va-step'), labelEl=document.getElementById('va-label');
  const bPrev=document.getElementById('va-prev'), bNext=document.getElementById('va-next'), bPlay=document.getElementById('va-play'), bReset=document.getElementById('va-reset');
  const COLOR={ paper:'#ffffff', ink:'#1a1a1a', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf',
    dry:'#fafaf6', dryS:'#d3ccbe', A:'#e3edf5', AS:'#6f9fc4', B:'#f6ead8', BS:'#d4a868',
    conn:'#d9e8c7', connS:'#5fa866', edge:'#b7c7d6', edgeCur:'#cf3535', coral:'#cf3535' };
  const GRID=[[1,2,2],[3,8,2],[5,3,5]], N=3;

  // edges added in connect order; each: {a:[r,c], b:[r,c], w}
  const E=[ {a:[0,1],b:[0,2],w:0}, {a:[0,2],b:[1,2],w:0}, {a:[0,0],b:[0,1],w:1},
            {a:[0,0],b:[1,0],w:2}, {a:[1,0],b:[2,0],w:2}, {a:[2,0],b:[2,1],w:2}, {a:[2,1],b:[2,2],w:2} ];
  // src-component membership after each step (as "r,c" list); other = flooded but not src
  const steps=[
    { added:0, src:['0,0'], other:[], w:null, conn:false,
      text:'<strong>INITIAL</strong> · 邊權 = 相鄰格<strong>高度差 |Δ|</strong>。照 |Δ| 由小到大加入、union。目標讓 START↔END 連通。' },
    { added:1, src:['0,0'], other:['0,1','0,2'], w:0, conn:false,
      text:'加入 <code>(0,1)-(0,2)</code>,|Δ|=0 → 形成一座島(棕)。' },
    { added:2, src:['0,0'], other:['0,1','0,2','1,2'], w:0, conn:false,
      text:'加入 <code>(0,2)-(1,2)</code>,|Δ|=0 → 島長成 {(0,1),(0,2),(1,2)}。' },
    { added:3, src:['0,0','0,1','0,2','1,2'], other:[], w:1, conn:false,
      text:'加入 <code>(0,0)-(0,1)</code>,|Δ|=1 → <strong>START 併入那座島</strong>。' },
    { added:4, src:['0,0','0,1','0,2','1,2','1,0'], other:[], w:2, conn:false,
      text:'加入 <code>(0,0)-(1,0)</code>,|Δ|=2 → (1,0) 併入 START 區。' },
    { added:5, src:['0,0','0,1','0,2','1,2','1,0','2,0'], other:[], w:2, conn:false,
      text:'加入 <code>(1,0)-(2,0)</code>,|Δ|=2 → 往下延伸。' },
    { added:6, src:['0,0','0,1','0,2','1,2','1,0','2,0','2,1'], other:[], w:2, conn:false,
      text:'加入 <code>(2,0)-(2,1)</code>,|Δ|=2 → 快接到 END 了。' },
    { added:7, src:['0,0','0,1','0,2','1,2','1,0','2,0','2,1','2,2'], other:[], w:2, conn:true,
      text:'加入 <code>(2,1)-(2,2)</code>,|Δ|=2 → <strong>END 併入 → START↔END 連通!回傳 2</strong>。高度差 8 的那格(中心)完全沒用到。' },
  ];

  let step=0,timer=null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||520; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,h=canvas.clientHeight,PAD=26;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,h);
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 網格 + 已加入的邊(藍=與 START 同區,棕=其他島)', PAD, 26);
    const cell=74, gx=PAD+30, gy=46, cx=(r,c)=>gx+c*cell+cell/2, cy=(r,c)=>gy+r*cell+cell/2;
    // edges (added so far), current one coral
    for(let i=0;i<s.added;i++){ const e=E[i], cur=(i===s.added-1);
      ctx.strokeStyle=cur?COLOR.edgeCur:COLOR.edge; ctx.lineWidth=cur?6:4;
      ctx.beginPath(); ctx.moveTo(cx(e.a[0],e.a[1]),cy(e.a[0],e.a[1])); ctx.lineTo(cx(e.b[0],e.b[1]),cy(e.b[0],e.b[1])); ctx.stroke();
      // weight chip at midpoint
      const mx=(cx(e.a[0],e.a[1])+cx(e.b[0],e.b[1]))/2, my=(cy(e.a[0],e.a[1])+cy(e.b[0],e.b[1]))/2;
      rr(mx-11,my-9,22,18,3); ctx.fillStyle='#fff'; ctx.fill(); ctx.strokeStyle=cur?COLOR.edgeCur:COLOR.edge; ctx.lineWidth=1.2; ctx.stroke();
      ctx.fillStyle=COLOR.ink; ctx.font='700 10px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(String(e.w),mx,my); }
    // cells
    for(let r=0;r<N;r++) for(let c=0;c<N;c++){ const key=r+','+c, x=gx+c*cell, y=gy+r*cell;
      const inSrc=s.src.includes(key), inOther=s.other.includes(key);
      let fill=COLOR.dry, st=COLOR.dryS;
      if(inSrc){ fill=s.conn?COLOR.conn:COLOR.A; st=s.conn?COLOR.connS:COLOR.AS; } else if(inOther){ fill=COLOR.B; st=COLOR.BS; }
      rr(x+3,y+3,cell-6,cell-6,6); ctx.fillStyle=fill; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=st; ctx.stroke();
      ctx.fillStyle=COLOR.ink; ctx.font='700 22px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(String(GRID[r][c]),x+cell/2,y+cell/2+3);
      if(key==='0,0'||key==='2,2'){ ctx.fillStyle=COLOR.coral; ctx.font='700 9px "JetBrains Mono", monospace'; ctx.textBaseline='top'; ctx.fillText(key==='0,0'?'START':'END',x+cell/2,y+7); } }

    // BAND 2
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 依 |Δ| 由小到大加入邊', PAD, gy+N*cell+34);
    const by=gy+N*cell+48; ctx.textBaseline='middle';
    if(s.w!=null){ const e=E[s.added-1]; ctx.fillStyle=COLOR.text; ctx.font='600 14px "Noto Sans TC", sans-serif'; ctx.textAlign='left';
      ctx.fillText(`加入邊 (${e.a})-(${e.b}),|Δ| = ${s.w}(目前最大 |Δ| = ${s.w})`, PAD+6, by+10); }
    else { ctx.fillStyle=COLOR.dim; ctx.font='500 14px "Noto Sans TC", sans-serif'; ctx.textAlign='left'; ctx.fillText('點 Next / Play 開始加邊', PAD+6, by+10); }

    // BAND 3
    const cyy=by+40; ctx.fillStyle=s.conn?COLOR.connS:COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · START ↔ END 連通?', PAD, cyy);
    const box=cyy+14; rr(PAD,box,w-PAD*2,36,6); ctx.fillStyle=s.conn?COLOR.conn:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=s.conn?COLOR.connS:COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(s.conn){ ctx.fillStyle='#2f6a3a'; ctx.font='700 15px "JetBrains Mono", monospace'; ctx.fillText('Find(START) == Find(END) → return 2', w/2, box+18); }
    else { ctx.fillStyle=COLOR.dim; ctx.font='600 13px "Noto Sans TC", sans-serif'; ctx.fillText(s.w==null?'尚未開始':'還沒連通,繼續加更大的邊…', w/2, box+18); }
  }
  function update(){ const s=steps[step]; if(stepEl) stepEl.textContent=String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0'); if(labelEl) labelEl.innerHTML=s.text; draw(); }
  function next(){ if(step<steps.length-1){step++;update();}else stop(); }
  function prev(){ if(step>0){step--;update();} }
  function reset(){ stop(); step=0; update(); }
  function play(){ if(timer){stop();return;} bPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){stop();return;} next(); },1450); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} if(bPlay) bPlay.textContent='Play'; }
  bPrev&&bPrev.addEventListener('click',prev); bNext&&bNext.addEventListener('click',next); bPlay&&bPlay.addEventListener('click',play); bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();}); if(window.ResizeObserver){ new ResizeObserver(()=>{fit();draw();}).observe(canvas); }
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw); fit(); update();
})();
