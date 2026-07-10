/* ============================================================
   P1584 寫法 B · Kruskal MST(Union-Find)
   把「所有」點對的邊照曼哈頓距離由小到大取出;能 union(不成環)
   就加入、累計權重,成環就丟棄。加滿 n-1 條邊即完成,總和即答案。
   points = [[0,0],[2,2],[3,10],[5,2],[7,0]]  →  20
     BAND 1  座標散點 + 已接受的樹邊(藍)+ 當前邊(珊瑚)
     BAND 2  依權重排序的邊帶(綠=接受 · 灰刪=成環略過 · 珊瑚=當前)
     BAND 3  已加邊數 + 累計成本
   ============================================================ */
(function () {
  const canvas = document.getElementById('vb-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('vb-step'), labelEl = document.getElementById('vb-label');
  const bPrev = document.getElementById('vb-prev'), bNext = document.getElementById('vb-next'),
        bPlay = document.getElementById('vb-play'), bReset = document.getElementById('vb-reset');

  const COLOR = { paper:'#ffffff', ink:'#1a1a1a', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf',
    node:'#ffffff', nodeS:'#c9c9c1', tree:'#e3edf5', treeS:'#6f9fc4',
    done:'#d9e8c7', doneS:'#5fa866', cur:'#d96e4e', coral:'#d96e4e', chip:'#faf7ef', skip:'#f0e2e2' };

  const P = [[0,0],[2,2],[3,10],[5,2],[7,0]];
  // draw positions: true-x, order-preserving compressed-y (avoids the y=10 outlier dead zone)
  const POS = [[0.00,0.12],[0.30,0.48],[0.46,0.92],[0.70,0.48],[1.00,0.10]];
  // sorted edges (w, a, b)
  const EDGES = [ [3,1,3],[4,0,1],[4,3,4],[7,0,3],[7,0,4],[7,1,4],[9,1,2],[10,2,3],[13,0,2],[14,2,4] ];
  // per-step: state[i] ∈ pending|cur|accept|skip ; edges = accepted tree edges [a,b,w]
  const steps = [
    { state:{}, edges:[], cur:null, total:0, added:0,
      text:'<strong>INITIAL</strong> · 把<strong>所有點對</strong>的邊照曼哈頓距離排序:<code>3,4,4,7,7,7,9,…</code>。逐條取出,不成環就 union。' },
    { state:{0:'accept'}, edges:[[1,3,3]], cur:[1,3,3], total:3, added:1,
      text:'邊 <code>P1–P3 = 3</code>:兩點不同集合 → <strong>union 接受</strong>,累計 3。' },
    { state:{0:'accept',1:'accept'}, edges:[[1,3,3],[0,1,4]], cur:[0,1,4], total:7, added:2,
      text:'邊 <code>P0–P1 = 4</code>:不成環 → <strong>接受</strong>,累計 7。{P0,P1,P3} 成一團。' },
    { state:{0:'accept',1:'accept',2:'accept'}, edges:[[1,3,3],[0,1,4],[3,4,4]], cur:[3,4,4], total:11, added:3,
      text:'邊 <code>P3–P4 = 4</code>:不成環 → <strong>接受</strong>,累計 11。只剩 P2 還沒接進來。' },
    { state:{0:'accept',1:'accept',2:'accept',3:'skip',4:'skip',5:'skip'}, edges:[[1,3,3],[0,1,4],[3,4,4]], cur:null, total:11, added:3,
      text:'接下來三條 <code>7</code>(P0–P3 · P0–P4 · P1–P4)兩端<strong>已同團 → 成環,全部略過</strong>(<code>Union</code> 回傳 false)。' },
    { state:{0:'accept',1:'accept',2:'accept',3:'skip',4:'skip',5:'skip',6:'accept'}, edges:[[1,3,3],[0,1,4],[3,4,4],[1,2,9]], cur:[1,2,9], total:20, added:4,
      text:'邊 <code>P1–P2 = 9</code>:接受 → 累計 20。<strong>已加 n−1 = 4 條邊 → 全連通,回傳 20</strong>。後面更大的邊不必再看。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||560; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,h=canvas.clientHeight,PAD=26;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,h);

    // ── BAND 1 · scatter + accepted tree
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 座標散點 + 已接受樹邊(藍 · 珊瑚=本步)', PAD, 24);
    const left=64, right=w-46, top=52, bottom=290;
    const px=i=>left+POS[i][0]*(right-left), py=i=>bottom-POS[i][1]*(bottom-top);
    for(const [a,b,wt] of s.edges){
      const isCur=s.cur&&s.cur[0]===a&&s.cur[1]===b;
      ctx.strokeStyle=isCur?COLOR.cur:COLOR.treeS; ctx.lineWidth=isCur?5:3;
      ctx.beginPath(); ctx.moveTo(px(a),py(a)); ctx.lineTo(px(b),py(b)); ctx.stroke();
      const mx=(px(a)+px(b))/2, my=(py(a)+py(b))/2;
      rr(mx-12,my-10,24,20,4); ctx.fillStyle='#fff'; ctx.fill(); ctx.strokeStyle=isCur?COLOR.cur:COLOR.treeS; ctx.lineWidth=1.4; ctx.stroke();
      ctx.fillStyle=isCur?COLOR.cur:COLOR.text; ctx.font='700 12px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(String(wt),mx,my);
    }
    const off=[[0,-27],[-2,-27],[0,27],[2,-27],[0,-27]];
    const connected = new Set(); s.edges.forEach(([a,b])=>{connected.add(a);connected.add(b);});
    for(let i=0;i<5;i++){ const x=px(i), y=py(i); const inT=connected.has(i);
      ctx.beginPath(); ctx.arc(x,y,17,0,Math.PI*2);
      ctx.fillStyle=inT?(s.added===4?COLOR.done:COLOR.tree):COLOR.node; ctx.fill();
      ctx.lineWidth=2; ctx.strokeStyle=inT?(s.added===4?COLOR.doneS:COLOR.treeS):COLOR.nodeS; ctx.stroke();
      ctx.fillStyle=COLOR.ink; ctx.font='700 14px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('P'+i,x,y+1);
      ctx.fillStyle=COLOR.dim; ctx.font='600 10px "JetBrains Mono", monospace'; ctx.textBaseline='middle';
      ctx.fillText('('+P[i][0]+','+P[i][1]+')', x+off[i][0], y+off[i][1]);
    }

    // ── BAND 2 · sorted edge tape
    let by=318;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 依權重排序的邊帶(綠=接受 · 刪=成環略過 · 珊瑚=當前)', PAD, by);
    const cy=by+12, n=EDGES.length, gap=8, cw=Math.min(72,(w-PAD*2-gap*(n-1))/n), ch=44;
    for(let i=0;i<n;i++){ const [wt,a,b]=EDGES[i]; const st=s.state[i]||'pending';
      const x=PAD+i*(cw+gap);
      let fill=COLOR.chip, bd=COLOR.grid, tc=COLOR.ink;
      if(st==='accept'){ fill=COLOR.done; bd=COLOR.doneS; }
      else if(st==='skip'){ fill=COLOR.skip; bd='#c98a8a'; tc=COLOR.dim; }
      else if(st==='cur'){ fill='#fbe7df'; bd=COLOR.cur; }
      rr(x,cy,cw,ch,6); ctx.fillStyle=fill; ctx.fill(); ctx.lineWidth=st==='pending'?1.2:1.8; ctx.strokeStyle=bd; ctx.stroke();
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillStyle=tc; ctx.font='700 17px "JetBrains Mono", monospace'; ctx.fillText(String(wt), x+cw/2, cy+16);
      ctx.font='600 10px "JetBrains Mono", monospace'; ctx.fillStyle=st==='skip'?COLOR.dim:COLOR.text; ctx.fillText('P'+a+'–P'+b, x+cw/2, cy+33);
      if(st==='skip'){ ctx.strokeStyle='#c98a8a'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(x+8,cy+ch/2); ctx.lineTo(x+cw-8,cy+ch/2); ctx.stroke(); }
    }

    // ── BAND 3 · progress
    const ty=cy+ch+30;
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 進度(目標 n−1 = 4 條邊)', PAD, ty);
    const box=ty+12; const done=s.added===4;
    rr(PAD,box,w-PAD*2,40,6); ctx.fillStyle=done?COLOR.done:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?COLOR.doneS:COLOR.grid; ctx.stroke();
    ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillStyle=COLOR.ink; ctx.font='700 14px "JetBrains Mono", monospace';
    ctx.fillText('已加邊數  '+s.added+' / 4', PAD+16, box+20);
    ctx.textAlign='right'; ctx.fillStyle=done?'#2f6a3a':COLOR.coral;
    ctx.fillText((done?'return  ':'累計成本  ')+s.total, w-PAD-16, box+20);
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
