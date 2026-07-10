/* ============================================================
   P133 · Clone Graph — BFS + hashmap(逐步播放)· vc
   先建起點的複本、入隊。每次出隊一個 cur:掃它的鄰居,沒複製過
   的就新建複本並入隊,然後把「複本的邊」接上(clone[cur]→clone[nei])。
   佇列空了就完成。和 DFS 同樣用 map 去重、切斷環,只是改用佇列。
   原圖 = 4-環 [[2,4],[1,3],[2,4],[1,3]]
     BAND 1  原圖(綠=已複製 · 珊瑚=本步出隊的 cur)
     BAND 2  佇列 queue(待處理的原節點)
     BAND 3  說明
   ============================================================ */
(function () {
  const canvas = document.getElementById('vc-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('vc-step'), labelEl = document.getElementById('vc-label');
  const bPrev = document.getElementById('vc-prev'), bNext = document.getElementById('vc-next'),
        bPlay = document.getElementById('vc-play'), bReset = document.getElementById('vc-reset');

  const COLOR = { paper:'#ffffff', ink:'#1a1a1a', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf',
    node:'#ffffff', nodeS:'#c9c9c1', edge:'#b7c7d6',
    done:'#d9e8c7', doneS:'#5fa866', cur:'#fbe7df', curS:'#d96e4e', coral:'#d96e4e' };

  const EDGES = [[1,2],[2,3],[3,4],[4,1]];
  // steps: cloned set, cur (dequeued), queue (contents after this step's action)
  const steps = [
    { cloned:[1], cur:0, queue:[1],
      text:'<strong>INITIAL</strong> · BFS:先建<strong>起點</strong>複本 <code>1\'</code>、把 <code>1</code> 入隊。<code>queue=[1]</code>。' },
    { cloned:[1,2,4], cur:1, queue:[2,4],
      text:'出隊 <code>1</code>。鄰居 <code>2</code>、<code>4</code> 沒複製過 → <strong>各新建複本並入隊</strong>,接上邊 <code>1\'–2\'</code>、<code>1\'–4\'</code>。<code>queue=[2,4]</code>。' },
    { cloned:[1,2,4,3], cur:2, queue:[4,3],
      text:'出隊 <code>2</code>。鄰居 <code>1</code> <strong>已複製 → 只接邊</strong> <code>2\'–1\'</code>;<code>3</code> 新建入隊,接邊 <code>2\'–3\'</code>。<code>queue=[4,3]</code>。' },
    { cloned:[1,2,4,3], cur:4, queue:[3],
      text:'出隊 <code>4</code>。鄰居 <code>1</code>、<code>3</code> <strong>都已複製 → 只接邊</strong>,不新建、不入隊。<code>queue=[3]</code>。' },
    { cloned:[1,2,4,3], cur:3, queue:[], done:true,
      text:'出隊 <code>3</code>。鄰居 <code>2</code>、<code>4</code> 都已複製 → 只接邊。<code>queue</code> 空 → <strong>完成,回傳 1\'</strong>。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||470; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,h=canvas.clientHeight,PAD=26;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,h);

    // ── BAND 1 · graph
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 原圖(綠=已複製 · 珊瑚=本步出隊的 cur)', PAD, 24);
    const cxL=w*0.5-95, cxR=w*0.5+95, cyT=88, cyB=216;
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

    // ── BAND 2 · queue
    let by=262;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 佇列 queue(先進先出:左邊先出隊)', PAD, by);
    const cy=by+12, cw=58, gap=10, qx=PAD+8;
    ctx.textBaseline='middle';
    if(s.queue.length){ for(let i=0;i<s.queue.length;i++){ const x=qx+i*(cw+gap);
        rr(x,cy,cw,44,6); ctx.fillStyle=i===0?COLOR.cur:'#eef4fa'; ctx.fill(); ctx.lineWidth=i===0?2.4:1.6; ctx.strokeStyle=i===0?COLOR.curS:'#a9c4da'; ctx.stroke();
        ctx.fillStyle=COLOR.ink; ctx.font='700 20px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.fillText(String(s.queue[i]), x+cw/2, cy+22);
        if(i===0){ ctx.fillStyle=COLOR.coral; ctx.font='700 9px "JetBrains Mono", monospace'; ctx.textBaseline='top'; ctx.fillText('下一個出隊', x+cw/2, cy+46); ctx.textBaseline='middle'; }
      }
    } else { rr(PAD,cy,w-PAD*2,44,6); ctx.fillStyle=COLOR.done; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=COLOR.doneS; ctx.stroke();
      ctx.textAlign='center'; ctx.fillStyle='#3f7a3a'; ctx.font='700 14px "JetBrains Mono", monospace'; ctx.fillText('queue 空 → 全部節點都已複製、邊都接好', w/2, cy+22); }

    // ── BAND 3 · note
    const ty=cy+70, done=!!s.done;
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 每步做什麼', PAD, ty);
    const box=ty+12; rr(PAD,box,w-PAD*2,40,6); ctx.fillStyle=done?COLOR.done:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?COLOR.doneS:COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(done){ ctx.fillStyle='#3f7a3a'; ctx.font='700 14px "JetBrains Mono", monospace'; ctx.fillText('return 1\'  ·  和 DFS 同結果,只是改用佇列走訪', w/2, box+20); }
    else { ctx.fillStyle=COLOR.text; ctx.font='600 13px "Noto Sans TC", sans-serif';
      ctx.fillText(step===0?'起點先複製、入隊,再開始一個一個出隊處理':'鄰居沒複製過→新建+入隊;已複製→只接邊', w/2, box+20); }
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
