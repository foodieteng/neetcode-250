/* ============================================================
   P997 · Find the Town Judge — in/out degree(逐步播放)
   把信任關係看成有向圖:邊 a→b 代表「a 信任 b」。法官是唯一
   「被所有人信任(in = n−1)、自己誰也不信任(out = 0)」的人。
   逐步累加每個人的 in/out 度,再掃 1..n 找符合者。
   n = 3, trust = [[1,3],[2,3]]  →  judge 3
     BAND 1  信任關係圖(箭頭 a→b)+ 每人的 in / out 度
     BAND 2  掃描:檢查 out==0 且 in==n−1
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
    node:'#ffffff', nodeS:'#c9c9c1', edge:'#6f9fc4', edgeCur:'#d96e4e',
    scan:'#fbe7df', scanS:'#d96e4e', no:'#f0f0ec', noS:'#c9c9c1',
    judge:'#d9e8c7', judgeS:'#5fa866', coral:'#d96e4e' };

  const N = 3;
  const E = [[1,3],[2,3]];                    // trust edges: a trusts b
  const steps = [
    { edges:0, scan:0, phase:'init', cur:null,
      text:'<strong>INITIAL</strong> · 邊 <code>a→b</code> = 「a 信任 b」。法官 = <strong>被所有人信任(in=n−1)</strong> 且 <strong>自己不信任任何人(out=0)</strong>。' },
    { edges:1, scan:0, phase:'edge', cur:[1,3],
      text:'處理信任 <code>[1,3]</code>:<code>out[1]++</code>、<code>in[3]++</code>。P1 信任了別人 → out 變 1。' },
    { edges:2, scan:0, phase:'edge', cur:[2,3],
      text:'處理信任 <code>[2,3]</code>:<code>out[2]++</code>、<code>in[3]++</code>。此時 <code>in[3]=2</code>。' },
    { edges:2, scan:1, phase:'scan', cur:null,
      text:'掃 <code>P1</code>:<code>out[1]=1 ≠ 0</code> → P1 信任過別人,<strong>不是法官</strong>。' },
    { edges:2, scan:2, phase:'scan', cur:null,
      text:'掃 <code>P2</code>:<code>out[2]=1 ≠ 0</code> → <strong>不是法官</strong>。' },
    { edges:2, scan:3, phase:'judge', cur:null,
      text:'掃 <code>P3</code>:<code>out[3]=0</code> 且 <code>in[3]=2=n−1</code> → <strong>符合!return 3</strong>。' },
  ];

  function deg(s, id){ let o=0,i=0; for(let k=0;k<s.edges;k++){ if(E[k][0]===id)o++; if(E[k][1]===id)i++; } return {i,o}; }

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||470; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }

  function arrow(ax,ay,bx,by,color,lw){
    const dx=bx-ax, dy=by-ay, len=Math.hypot(dx,dy), ux=dx/len, uy=dy/len, R=36;
    const sx=ax+ux*R, sy=ay+uy*R, ex=bx-ux*R, ey=by-uy*R;
    ctx.strokeStyle=color; ctx.lineWidth=lw; ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(ex,ey); ctx.stroke();
    const ah=12, a1=Math.atan2(uy,ux);
    ctx.fillStyle=color; ctx.beginPath(); ctx.moveTo(ex,ey);
    ctx.lineTo(ex-ah*Math.cos(a1-0.4), ey-ah*Math.sin(a1-0.4));
    ctx.lineTo(ex-ah*Math.cos(a1+0.4), ey-ah*Math.sin(a1+0.4)); ctx.closePath(); ctx.fill();
  }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,h=canvas.clientHeight,PAD=26;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,h);
    const POS = { 3:[w/2, 92], 1:[w/2-150, 238], 2:[w/2+150, 238] };

    // ── BAND 1
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 信任關係圖(箭頭 a→b:a 信任 b)+ 每人 in / out 度', PAD, 24);

    for(let k=0;k<s.edges;k++){ const [a,b]=E[k]; const cur=s.cur&&s.cur[0]===a&&s.cur[1]===b;
      arrow(POS[a][0],POS[a][1],POS[b][0],POS[b][1], cur?COLOR.edgeCur:COLOR.edge, cur?5:3.2); }

    for(const id of [1,2,3]){ const [x,y]=POS[id]; const d=deg(s,id);
      const isScan = s.scan===id && s.phase==='scan';
      const isJudge = s.scan===id && s.phase==='judge';
      const checked = s.phase==='scan' && s.scan>id;
      let fill=COLOR.node, st=COLOR.nodeS, lw=2.4;
      if(isJudge){ fill=COLOR.judge; st=COLOR.judgeS; lw=3.5; }
      else if(isScan){ fill=COLOR.scan; st=COLOR.scanS; lw=3.5; }
      else if(checked){ fill=COLOR.no; st=COLOR.noS; }
      ctx.beginPath(); ctx.arc(x,y,34,0,Math.PI*2); ctx.fillStyle=fill; ctx.fill(); ctx.lineWidth=lw; ctx.strokeStyle=st; ctx.stroke();
      ctx.fillStyle=COLOR.ink; ctx.font='700 22px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('P'+id, x, y+1);
      const ty=(id===3)?y-50:y+50;
      ctx.font='700 13px "JetBrains Mono", monospace'; ctx.textBaseline='middle';
      const hot=(isScan||isJudge); ctx.fillStyle = hot ? COLOR.coral : COLOR.text;
      ctx.fillText('in '+d.i+' · out '+d.o, x, ty);
      if(isJudge){ ctx.fillStyle=COLOR.judgeS; ctx.font='700 11px "JetBrains Mono", monospace'; ctx.fillText('JUDGE', x, y+50); }
    }

    // ── BAND 2 · scan check
    let by=310;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 掃 1..n:法官條件 out==0 且 in==n−1(n−1 = 2)', PAD, by);
    const cy=by+12;
    ctx.fillStyle='#fafaf6'; ctx.fillRect(PAD,cy,w-PAD*2,40); ctx.lineWidth=1.6; ctx.strokeStyle=COLOR.grid; ctx.strokeRect(PAD,cy,w-PAD*2,40);
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(s.phase==='scan'){ const d=deg(s,s.scan);
      ctx.fillStyle=COLOR.ink; ctx.font='700 14px "JetBrains Mono", monospace';
      ctx.fillText(`P${s.scan}: out=${d.o}, in=${d.i}  →  out==0 ? ${d.o===0?'yes':'NO'}  →  不符合`, w/2, cy+21); }
    else if(s.phase==='judge'){ const d=deg(s,s.scan);
      ctx.fillStyle='#3f7a3a'; ctx.font='700 14px "JetBrains Mono", monospace';
      ctx.fillText(`P${s.scan}: out=${d.o}==0 且 in=${d.i}==n−1  →  符合`, w/2, cy+21); }
    else { ctx.fillStyle=COLOR.dim; ctx.font='600 13px "Noto Sans TC", sans-serif';
      ctx.fillText(s.phase==='init'?'先數好每人的 in / out 度,再開始掃':'累加度數中…', w/2, cy+21); }

    // ── BAND 3 · result
    const ty2=cy+62;
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 結果', PAD, ty2);
    const box=ty2+12, done=s.phase==='judge';
    ctx.fillStyle=done?COLOR.judge:'#fafaf6'; ctx.fillRect(PAD,box,w-PAD*2,40); ctx.lineWidth=1.6; ctx.strokeStyle=done?COLOR.judgeS:COLOR.grid; ctx.strokeRect(PAD,box,w-PAD*2,40);
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(done){ ctx.fillStyle='#3f7a3a'; ctx.font='700 15px "JetBrains Mono", monospace'; ctx.fillText('return 3  ·  P3 是法官', w/2, box+21); }
    else { ctx.fillStyle=COLOR.dim; ctx.font='600 13px "Noto Sans TC", sans-serif'; ctx.fillText('若掃完都沒符合 → return −1', w/2, box+21); }
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
