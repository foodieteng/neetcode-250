/* ============================================================
   P133 · Clone Graph — 複製機制(逐步播放)· va
   DFS 走訪原圖,每個節點「複製一次」並記進 map(原→新)。關鍵:
   遇到已複製過的鄰居(環上的回邊)就從 map 取用,絕不重複新建 ——
   這正是避免無限迴圈、且保持連線正確的核心。
   原圖 = 4-環 [[2,4],[1,3],[2,4],[1,3]]
     BAND 1  原圖(綠=已複製 · 珊瑚=本步新建)
     BAND 2  map:原節點 → 新節點
     BAND 3  說明(回邊重用 vs 新建)
   ============================================================ */
(function () {
  const canvas = document.getElementById('va-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('va-step'), labelEl = document.getElementById('va-label');
  const bPrev = document.getElementById('va-prev'), bNext = document.getElementById('va-next'),
        bPlay = document.getElementById('va-play'), bReset = document.getElementById('va-reset');

  const COLOR = { paper:'#ffffff', ink:'#1a1a1a', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf',
    node:'#ffffff', nodeS:'#c9c9c1', edge:'#b7c7d6',
    done:'#d9e8c7', doneS:'#5fa866', cur:'#fbe7df', curS:'#d96e4e', coral:'#d96e4e' };

  // 4-cycle square: 1 TL, 2 TR, 3 BR, 4 BL ; edges 1-2,2-3,3-4,4-1
  const EDGES = [[1,2],[2,3],[3,4],[4,1]];
  const steps = [
    { cloned:[], cur:0, reuse:null,
      text:'<strong>INITIAL</strong> · 深拷貝:每個節點<strong>複製一次</strong>,用 <code>map</code> 記「原→新」。遇到<strong>已複製過</strong>的節點就從 map 取用,避免環造成無限迴圈。' },
    { cloned:[1], cur:1, reuse:null,
      text:'DFS 到 <code>1</code> → 新建 <code>1\'</code>,存 <code>map[1]=1\'</code>。' },
    { cloned:[1,2], cur:2, reuse:null,
      text:'走 1 的鄰居到 <code>2</code> → 新建 <code>2\'</code>,<code>map[2]=2\'</code>。接上邊 <code>1\'–2\'</code>。' },
    { cloned:[1,2,3], cur:3, reuse:1,
      text:'走 2 的鄰居:<code>1</code> <strong>已在 map → 重用 1\'</strong>(不新建);另一鄰居 <code>3</code> → 新建 <code>3\'</code>。' },
    { cloned:[1,2,3,4], cur:4, reuse:2,
      text:'走 3 的鄰居:<code>2</code> 已在 map → 重用;<code>4</code> → 新建 <code>4\'</code>,<code>map[4]=4\'</code>。' },
    { cloned:[1,2,3,4], cur:0, reuse:14, done:true,
      text:'走 4 的鄰居 <code>1</code>、<code>3</code> <strong>都已在 map → 全部重用</strong>,沒有新節點。複製完成:新圖 4 節點、連線與原圖相同。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||480; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,h=canvas.clientHeight,PAD=26;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,h);

    // ── BAND 1 · original graph (square)
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 原圖(綠=已複製 · 珊瑚=本步新建)', PAD, 24);
    const cxL=w*0.5-95, cxR=w*0.5+95, cyT=90, cyB=222;
    const POS = { 1:[cxL,cyT], 2:[cxR,cyT], 3:[cxR,cyB], 4:[cxL,cyB] };
    for(const [a,b] of EDGES){ ctx.strokeStyle=COLOR.edge; ctx.lineWidth=3;
      ctx.beginPath(); ctx.moveTo(POS[a][0],POS[a][1]); ctx.lineTo(POS[b][0],POS[b][1]); ctx.stroke(); }
    for(const id of [1,2,3,4]){ const [x,y]=POS[id]; const done=s.cloned.includes(id); const cur=(id===s.cur);
      ctx.beginPath(); ctx.arc(x,y,30,0,Math.PI*2);
      ctx.fillStyle=cur?COLOR.cur:(done?COLOR.done:COLOR.node); ctx.fill();
      ctx.lineWidth=cur?3.5:2.2; ctx.strokeStyle=cur?COLOR.curS:(done?COLOR.doneS:COLOR.nodeS); ctx.stroke();
      ctx.fillStyle=COLOR.ink; ctx.font='700 22px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(String(id), x, y+1);
      if(done){ ctx.fillStyle=COLOR.doneS; ctx.font='700 12px "JetBrains Mono", monospace'; ctx.textBaseline='middle'; ctx.fillText(id+"'", x+34, y-20); }
    }

    // ── BAND 2 · map old -> new
    let by=270;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · map:原節點 → 新節點(每個原節點只對應一個新節點)', PAD, by);
    const cy=by+12, n=4, gap=12, cw=Math.min(120,(w-PAD*2-gap*(n-1))/n), ch=44;
    for(let i=0;i<n;i++){ const id=i+1; const done=s.cloned.includes(id); const x=PAD+i*(cw+gap);
      rr(x,cy,cw,ch,6); ctx.fillStyle=done?COLOR.done:'#f3f3ef'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?COLOR.doneS:COLOR.grid; ctx.stroke();
      ctx.textAlign='center'; ctx.textBaseline='middle';
      if(done){ ctx.fillStyle=COLOR.ink; ctx.font='700 16px "JetBrains Mono", monospace'; ctx.fillText(id+" → "+id+"'", x+cw/2, cy+ch/2); }
      else { ctx.fillStyle=COLOR.dim; ctx.font='600 13px "JetBrains Mono", monospace'; ctx.fillText(id+" → —", x+cw/2, cy+ch/2); }
    }

    // ── BAND 3 · note
    const ty=cy+ch+26, done=!!s.done;
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 回邊處理', PAD, ty);
    const box=ty+12; rr(PAD,box,w-PAD*2,40,6); ctx.fillStyle=done?COLOR.done:(s.reuse?'#fbe7df':'#fafaf6'); ctx.fill();
    ctx.lineWidth=1.6; ctx.strokeStyle=done?COLOR.doneS:(s.reuse?COLOR.curS:COLOR.grid); ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(done){ ctx.fillStyle='#3f7a3a'; ctx.font='700 14px "JetBrains Mono", monospace'; ctx.fillText('return 1\'  ·  深拷貝完成,無重複、無死圈', w/2, box+20); }
    else if(s.reuse){ ctx.fillStyle=COLOR.coral; ctx.font='600 13.5px "Noto Sans TC", sans-serif'; ctx.fillText('鄰居已在 map → 直接取用既有的新節點(不新建、不再遞迴)', w/2, box+20); }
    else { ctx.fillStyle=COLOR.dim; ctx.font='600 13px "Noto Sans TC", sans-serif'; ctx.fillText(step===0?'點 Next / Play 開始複製':'新節點加入 map,再往鄰居走', w/2, box+20); }
  }

  function update(){ const s=steps[step]; if(stepEl) stepEl.textContent=String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0'); if(labelEl) labelEl.innerHTML=s.text; draw(); }
  function next(){ if(step<steps.length-1){step++;update();}else stop(); }
  function prev(){ if(step>0){step--;update();} }
  function reset(){ stop(); step=0; update(); }
  function play(){ if(timer){stop();return;} bPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){stop();return;} next(); },1550); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} if(bPlay) bPlay.textContent='Play'; }
  bPrev&&bPrev.addEventListener('click',prev); bNext&&bNext.addEventListener('click',next); bPlay&&bPlay.addEventListener('click',play); bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();}); if(window.ResizeObserver){ new ResizeObserver(()=>{fit();draw();}).observe(canvas); }
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw); fit(); update();
})();
