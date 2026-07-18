/* ============================================================
   P695 · Max Area of Island — DFS 量面積(逐步播放)
   和 200 同骨架,但 dfs 一邊沉島一邊「數格子」(curArea++),回到
   主流程用 maxArea = max(maxArea, curArea) 記住最大的一座。
   grid(3×4):藍島 3 格、棕島 2 格  →  maxArea = 3
     BAND 1  網格(每座島一色 · 格內數字=DFS 數到第幾格)
     BAND 2  這座島 curArea + 目前 maxArea
     BAND 3  結果
   ============================================================ */
(function () {
  const canvas = document.getElementById('viz-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('viz-step'), labelEl = document.getElementById('viz-label');
  const bPrev = document.getElementById('viz-prev'), bNext = document.getElementById('viz-next'),
        bPlay = document.getElementById('viz-play'), bReset = document.getElementById('viz-reset');

  const COLOR = { paper:'#ffffff', ink:'#1a1a1a', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf',
    water:'#eef0ee', waterS:'#cfcfcf', land:'#ffffff', landS:'#b9b9b1', coral:'#cf3535' };
  const ISLC = { 1:['#e3edf5','#6f9fc4'], 2:['#f6ead8','#d4a868'] };  // 藍島 / 棕島

  const R = 3, C = 4;
  const G = [[1,1,0,1],[1,0,0,1],[0,0,0,0]];
  const ISL = { '0,0':1,'0,1':1,'1,0':1, '0,3':2,'1,3':2 };     // 每個陸地格屬於哪座島
  const ORD = { '0,0':1,'1,0':2,'0,1':3, '0,3':1,'1,3':2 };     // DFS 數到第幾格
  const AREA = { 1:3, 2:2 };

  const steps = [
    { rev:0, found:0, cur:0, mx:0,
      text:'<strong>INITIAL</strong> · 掃到未訪陸地就 DFS 沉島,<strong>一邊沉一邊數格子</strong>(curArea++)。每座島數完,用 <code>maxArea=max(maxArea,curArea)</code> 記最大。' },
    { rev:1, found:1, cur:3, mx:3,
      text:'掃到 <code>(0,0)</code> → DFS 沉<span style="color:#3a6ea5">藍島</span>,依序數 <strong>3</strong> 格 → <code>curArea=3</code>。<code>maxArea=max(0,3)=3</code>。' },
    { rev:2, found:2, cur:2, mx:3,
      text:'掃到 <code>(0,3)</code> → DFS 沉<span style="color:#a9772e">棕島</span>,數 <strong>2</strong> 格 → <code>curArea=2</code>。<code>maxArea=max(3,2)=3</code>(棕島較小,最大值不變)。' },
    { rev:2, found:0, cur:0, mx:3, done:true,
      text:'掃完整個網格。最大的一座島是藍島 3 格 → <strong>return 3</strong>。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||430; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,h=canvas.clientHeight,PAD=26;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,h);

    // ── BAND 1 · grid
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 網格(每座島一色 · 格內數字 = DFS 數到第幾格)', PAD, 24);
    const cell=76, gw=C*cell, gx=(w-gw)/2, gy=44;
    for(let r=0;r<R;r++) for(let c=0;c<C;c++){ const x=gx+c*cell, y=gy+r*cell, key=r+','+c;
      const isl = ISL[key] || 0;
      let fill, st, label, lcolor=COLOR.ink, big=true;
      if(G[r][c]===0){ fill=COLOR.water; st=COLOR.waterS; label='0'; lcolor=COLOR.dim; }
      else if(isl>0 && isl<=s.rev){ fill=ISLC[isl][0]; st=ISLC[isl][1]; label=String(ORD[key]); }  // 已沉:顯示 DFS 序號
      else { fill=COLOR.land; st=COLOR.landS; label='1'; }                                          // 未訪陸地
      rr(x+3,y+3,cell-6,cell-6,6); ctx.fillStyle=fill; ctx.fill();
      const curIsl=(isl>0 && isl===s.found);
      ctx.lineWidth=curIsl?3.5:1.8; ctx.strokeStyle=curIsl?COLOR.coral:st; ctx.stroke();
      ctx.fillStyle=lcolor; ctx.font='700 26px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(label, x+cell/2, y+cell/2+1);
    }

    // ── BAND 2 · curArea + maxArea
    let by=gy+R*cell+26;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 這座島面積 curArea · 目前最大 maxArea', PAD, by);
    const cy=by+12, halfW=(w-PAD*2-14)/2;
    // curArea box
    rr(PAD,cy,halfW,40,6); ctx.fillStyle=s.found?'#fbe1e1':'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=s.found?COLOR.coral:COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='700 15px "JetBrains Mono", monospace';
    ctx.fillStyle=s.found?COLOR.coral:COLOR.dim; ctx.fillText(s.found?('curArea = '+s.cur):'curArea = —', PAD+halfW/2, cy+20);
    // maxArea box
    const mx2=PAD+halfW+14; rr(mx2,cy,halfW,40,6); ctx.fillStyle='#d9e8c7'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle='#5fa866'; ctx.stroke();
    ctx.fillStyle='#3f7a3a'; ctx.fillText('maxArea = '+s.mx, mx2+halfW/2, cy+20);

    // ── BAND 3 · result
    const ty=cy+62, done=!!s.done;
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 結果', PAD, ty);
    const box=ty+12; rr(PAD,box,w-PAD*2,40,6); ctx.fillStyle=done?'#d9e8c7':'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?'#5fa866':COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(done){ ctx.fillStyle='#3f7a3a'; ctx.font='700 15px "JetBrains Mono", monospace'; ctx.fillText('return 3  ·  最大島有 3 格', w/2, box+21); }
    else { ctx.fillStyle=COLOR.dim; ctx.font='600 13px "Noto Sans TC", sans-serif'; ctx.fillText('每座島都量一次面積,取最大', w/2, box+21); }
  }

  function update(){ const s=steps[step]; if(stepEl) stepEl.textContent=String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0'); if(labelEl) labelEl.innerHTML=s.text; draw(); }
  function next(){ if(step<steps.length-1){step++;update();}else stop(); }
  function prev(){ if(step>0){step--;update();} }
  function reset(){ stop(); step=0; update(); }
  function play(){ if(timer){stop();return;} bPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){stop();return;} next(); },1500); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} if(bPlay) bPlay.textContent='Play'; }
  bPrev&&bPrev.addEventListener('click',prev); bNext&&bNext.addEventListener('click',next); bPlay&&bPlay.addEventListener('click',play); bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();}); if(window.ResizeObserver){ new ResizeObserver(()=>{fit();draw();}).observe(canvas); }
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw); fit(); update();
})();
