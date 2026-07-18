/* ============================================================
   P329 · Longest Increasing Path — 寫法 B:Kahn 拓撲分層 · viz  (vb-*)
   把每格看成節點:小 → 大 連一條有向邊。整張圖是 DAG(嚴格遞增無環)。
   indeg[r][c] = 有幾個「更小的鄰居」指進來。
   從 indeg==0 的源點(局部最小)開始,一層一層剝:
     每剝一層,層數 +1;剝完時的層數 = 最長路徑長。
   grid = [[9,9,4],[6,6,8],[2,1,1]] → 4 層 → 答案 4。
   層數表(實跑):
     4 3 1
     3 2 3
     2 1 1
     LEFT   3×3 grid,依「本步剝掉的層」上色
     RIGHT  層數計數(像剝洋蔥,一層一個顏色)
   ============================================================ */
(function () {
  const canvas = document.getElementById('vb-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('vb-step'), labelEl = document.getElementById('vb-label');
  const bPrev = document.getElementById('vb-prev'), bNext = document.getElementById('vb-next'),
        bPlay = document.getElementById('vb-play'), bReset = document.getElementById('vb-reset');

  const COLOR = { paper:'#ffffff', ink:'#1a1a1a', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf',
    cell:'#fafaf6', cellS:'#cfcfcf', src:'#dbe8f6', srcS:'#4478c0', srcT:'#2f5f9e',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424', done:'#d9e8c7', doneS:'#5fa866', doneT:'#3f7a3a', coral:'#cf3535' };
  // 每層一個柔和色(層 1..4)
  const LAYERC = [
    null,
    { bg:'#dbe8f6', bd:'#4478c0', tx:'#2f5f9e' },   // layer 1
    { bg:'#d9e8c7', bd:'#5fa866', tx:'#3f7a3a' },   // layer 2
    { bg:'#fbe1e1', bd:'#cf3535', tx:'#992424' },   // layer 3
    { bg:'#e7ddf0', bd:'#8a63b0', tx:'#5f3f85' },   // layer 4
  ];

  const A = [[9,9,4],[6,6,8],[2,1,1]];
  const LAYER = [[4,3,1],[3,2,3],[2,1,1]];   // 每格屬於第幾層(實跑)
  const INDEG = [[1,2,0],[1,1,3],[1,0,0]];   // 更小鄰居數

  const steps = [
    { show:0, hl:-1,
      text:'<strong>INITIAL</strong> · 每格連一條「小→大」的邊 → 整張圖是 <strong>DAG</strong>(嚴格遞增,無環)。<code>indeg</code> = 有幾個更小的鄰居指進來(格內小字)。' },
    { show:1, hl:1,
      text:'<strong>層 1</strong> · 所有 <code>indeg==0</code> 的<strong>源點</strong>(局部最小,沒有更小鄰居):值 <code>4</code> 和兩個 <code>1</code>。剝掉它們。' },
    { show:2, hl:2,
      text:'<strong>層 2</strong> · 剝掉層 1 後,有些格的入度歸零:值 <code>2</code>、<code>6</code>(中)。它們是「距離某個最小值 1 步」的格子。' },
    { show:3, hl:3,
      text:'<strong>層 3</strong> · 再剝一層:值 <code>6</code>(左)、<code>8</code>、<code>9</code>(上)。' },
    { show:4, hl:4, done:true,
      text:'<strong>層 4</strong> · 最後剝掉值 <code>9</code>(左上角)。共剝了 <strong>4 層</strong> → 最長遞增路徑 = <strong>4</strong>。層數 = 最長鏈長。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,h=canvas.clientHeight,PAD=26;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,h);
    const done=!!s.done;

    // ── LEFT · grid ──
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('矩陣 · 色 = 層(左上 = indeg)', PAD, 24);

    const cell=54, gx=PAD+6, gy=52;
    for(let r=0;r<3;r++) for(let c=0;c<3;c++){
      const x=gx+c*cell, y=gy+r*cell, L=LAYER[r][c];
      const peeled=(L<=s.show), isCur=(L===s.hl);
      rr(x+3,y+3,cell-6,cell-6,6);
      if(peeled){ const cc=LAYERC[L]; ctx.fillStyle=cc.bg; ctx.fill(); ctx.lineWidth=isCur?3.4:1.8; ctx.strokeStyle=isCur?COLOR.curS:cc.bd; ctx.stroke(); }
      else { ctx.fillStyle=COLOR.cell; ctx.fill(); ctx.lineWidth=1.5; ctx.strokeStyle=COLOR.cellS; ctx.stroke(); }
      ctx.fillStyle=peeled?LAYERC[L].tx:COLOR.text; ctx.font='700 19px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(String(A[r][c]), x+cell/2, y+cell/2+2);
      // indeg 小字(左上)
      if(s.show===0){
        ctx.fillStyle=COLOR.dim; ctx.font='700 10px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='top';
        ctx.fillText(String(INDEG[r][c]), x+7, y+6);
      }
      // 剝掉時標層號(右上)
      if(peeled){
        ctx.fillStyle=LAYERC[L].tx; ctx.font='700 10px "JetBrains Mono", monospace'; ctx.textAlign='right'; ctx.textBaseline='top';
        ctx.fillText('L'+L, x+cell-7, y+6);
      }
    }

    // ── RIGHT · layer counter (onion) ──
    const px=gx+3*cell+40;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('剝洋蔥 · 層數 = 答案', px, 24);

    const rowH=40, ry0=52;
    for(let L=1;L<=4;L++){
      const y=ry0+(L-1)*rowH, active=(L<=s.show), isCur=(L===s.hl);
      const cc=LAYERC[L];
      rr(px,y,150,32,6);
      ctx.fillStyle=active?cc.bg:'#f4f4f0'; ctx.fill();
      ctx.lineWidth=isCur?3:(active?1.8:1.4); ctx.strokeStyle=isCur?COLOR.curS:(active?cc.bd:COLOR.cellS); ctx.stroke();
      ctx.textAlign='left'; ctx.textBaseline='middle';
      ctx.fillStyle=active?cc.tx:COLOR.grid; ctx.font='700 12.5px "JetBrains Mono", monospace';
      ctx.fillText('層 '+L, px+12, y+16);
      if(active){
        // 該層的格值
        const vals=[];
        for(let r=0;r<3;r++)for(let c=0;c<3;c++) if(LAYER[r][c]===L) vals.push(A[r][c]);
        ctx.textAlign='right'; ctx.font='700 11.5px "JetBrains Mono", monospace'; ctx.fillStyle=cc.tx;
        ctx.fillText(vals.join(' · '), px+138, y+16);
      }
    }
    // 計數大字
    const cy=ry0+4*rowH+8;
    ctx.textAlign='left'; ctx.textBaseline='middle';
    ctx.fillStyle=done?COLOR.doneT:COLOR.text; ctx.font='700 13px "Noto Sans TC", sans-serif';
    ctx.fillText(done?'剝完 4 層 → 答案 = 4':('目前層數 = '+s.show), px, cy);
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
