/* ============================================================
   P1584 寫法 A · Prim's Lazy MST(min-heap)
   從 P0 開始長樹:每次從 min-heap 取「樹 → 樹外」最便宜的跨邊,
   把那個新點併進樹,再把它到其他樹外點的邊丟進 heap(lazy:過期
   條目彈出時用 inMST 略過)。連滿 n 個點時邊權總和即答案。
   points = [[0,0],[2,2],[3,10],[5,2],[7,0]]  →  20
     BAND 1  座標散點 + 目前生成樹(藍=已在樹中)+ 當前跨邊(珊瑚)
     BAND 2  min-heap 候選跨邊 · 取最小
     BAND 3  已連點數 + 累計成本
   ============================================================ */
(function () {
  const canvas = document.getElementById('va-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('va-step'), labelEl = document.getElementById('va-label');
  const bPrev = document.getElementById('va-prev'), bNext = document.getElementById('va-next'),
        bPlay = document.getElementById('va-play'), bReset = document.getElementById('va-reset');

  const COLOR = { paper:'#ffffff', ink:'#1a1a1a', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf',
    node:'#ffffff', nodeS:'#c9c9c1', tree:'#e3edf5', treeS:'#6f9fc4',
    done:'#d9e8c7', doneS:'#5fa866', edge:'#6f9fc4', cur:'#d96e4e', coral:'#d96e4e', chip:'#faf7ef' };

  // 5 points (index → [x,y]); Manhattan MST tree edges: 0-1(4) 1-3(3) 3-4(4) 1-2(9) = 20
  const P = [[0,0],[2,2],[3,10],[5,2],[7,0]];
  // draw positions: true-x, order-preserving compressed-y (avoids the y=10 outlier dead zone)
  const POS = [[0.00,0.12],[0.30,0.48],[0.46,0.92],[0.70,0.48],[1.00,0.10]];

  const steps = [
    { inTree:[], edges:[], cur:null, front:[], total:0, added:0,
      text:'<strong>INITIAL</strong> · 5 個點,兩點成本 = <strong>曼哈頓距離</strong> |Δx|+|Δy|。Prim 從 <code>P0</code> 開始長最小生成樹。' },
    { inTree:[0], edges:[], cur:null, added:1, total:0,
      front:[{to:1,w:4,min:true},{to:3,w:7},{to:4,w:7},{to:2,w:13}],
      text:'彈出 <code>(0, P0)</code> → P0 入樹。把 P0 到其他點的邊丟進 heap:<code>P1:4 · P3:7 · P4:7 · P2:13</code>。最小是 <strong>P1:4</strong>。' },
    { inTree:[0,1], edges:[[0,1,4]], cur:[0,1,4], added:2, total:4,
      front:[{to:3,w:3,min:true},{to:4,w:7},{to:2,w:9}],
      text:'取最小跨邊 <code>P0–P1 = 4</code> → P1 入樹,<strong>累計 4</strong>。新增 P1 的邊後,heap 最小變 <strong>P3:3</strong>。' },
    { inTree:[0,1,3], edges:[[0,1,4],[1,3,3]], cur:[1,3,3], added:3, total:7,
      front:[{to:4,w:4,min:true},{to:2,w:9}],
      text:'取 <code>P1–P3 = 3</code> → P3 入樹,<strong>累計 7</strong>。P3 到 P4 只要 4,成為新的最小。' },
    { inTree:[0,1,3,4], edges:[[0,1,4],[1,3,3],[3,4,4]], cur:[3,4,4], added:4, total:11,
      front:[{to:2,w:9,min:true},{to:2,w:14,stale:true}],
      text:'取 <code>P3–P4 = 4</code> → P4 入樹,<strong>累計 11</strong>。剩 P2:heap 裡舊的 <code>P4→P2:14</code> 是過期條目,最小仍是 <strong>P2:9</strong>。' },
    { inTree:[0,1,3,4,2], edges:[[0,1,4],[1,3,3],[3,4,4],[1,2,9]], cur:[1,2,9], added:5, total:20, front:[],
      text:'取 <code>P1–P2 = 9</code> → P2 入樹,<strong>累計 20</strong>。<strong>5 點全連通 → 回傳 20</strong>。中央的 P2(3,10)只靠這一條最短邊接入。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||560; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,h=canvas.clientHeight,PAD=26;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,h);

    // ── BAND 1 · scatter + tree
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 座標散點 + 生成樹(藍=已入樹 · 珊瑚=本步跨邊)', PAD, 24);
    const left=64, right=w-46, top=52, bottom=298;
    const px=i=>left+POS[i][0]*(right-left), py=i=>bottom-POS[i][1]*(bottom-top);

    // tree edges
    for(const [a,b,wt] of s.edges){
      const isCur=s.cur&&((s.cur[0]===a&&s.cur[1]===b)||(s.cur[0]===b&&s.cur[1]===a));
      ctx.strokeStyle=isCur?COLOR.cur:COLOR.treeS; ctx.lineWidth=isCur?5:3;
      ctx.beginPath(); ctx.moveTo(px(a),py(a)); ctx.lineTo(px(b),py(b)); ctx.stroke();
      const mx=(px(a)+px(b))/2, my=(py(a)+py(b))/2;
      rr(mx-12,my-10,24,20,4); ctx.fillStyle='#fff'; ctx.fill(); ctx.strokeStyle=isCur?COLOR.cur:COLOR.treeS; ctx.lineWidth=1.4; ctx.stroke();
      ctx.fillStyle=isCur?COLOR.cur:COLOR.text; ctx.font='700 12px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(String(wt),mx,my);
    }
    // nodes
    const off=[[0,-27],[-2,-27],[0,27],[2,-27],[0,-27]]; // coord-label offsets P0..P4
    for(let i=0;i<5;i++){ const x=px(i), y=py(i); const inT=s.inTree.includes(i);
      ctx.beginPath(); ctx.arc(x,y,17,0,Math.PI*2);
      ctx.fillStyle=inT?(s.added===5?COLOR.done:COLOR.tree):COLOR.node; ctx.fill();
      ctx.lineWidth=2; ctx.strokeStyle=inT?(s.added===5?COLOR.doneS:COLOR.treeS):COLOR.nodeS; ctx.stroke();
      ctx.fillStyle=COLOR.ink; ctx.font='700 14px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('P'+i,x,y+1);
      ctx.fillStyle=COLOR.dim; ctx.font='600 10px "JetBrains Mono", monospace'; ctx.textBaseline='middle';
      ctx.fillText('('+P[i][0]+','+P[i][1]+')', x+off[i][0], y+off[i][1]);
    }
    if(step===1){ const x=px(0),y=py(0); ctx.fillStyle=COLOR.coral; ctx.font='700 10px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('START',x+40,y); }

    // ── BAND 2 · heap frontier
    let by=326;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · min-heap 候選跨邊(樹 → 樹外)· 取最小', PAD, by);
    const cy=by+14;
    if(s.front.length){
      let cxp=PAD; const cw=104, ch=42, gap=12;
      for(const f of s.front){
        rr(cxp,cy,cw,ch,6);
        ctx.fillStyle=f.stale?'#f3f3ef':(f.min?'#fbe7df':COLOR.chip); ctx.fill();
        ctx.lineWidth=f.min?2:1.4; ctx.strokeStyle=f.stale?COLOR.grid:(f.min?COLOR.cur:COLOR.treeS); ctx.stroke();
        ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillStyle=f.stale?COLOR.dim:COLOR.ink; ctx.font='700 15px "JetBrains Mono", monospace';
        ctx.fillText('→ P'+f.to+' : '+f.w, cxp+cw/2, cy+16);
        ctx.font='600 9px "JetBrains Mono", monospace'; ctx.fillStyle=f.stale?COLOR.dim:(f.min?COLOR.cur:COLOR.dim);
        ctx.fillText(f.stale?'STALE · 略過':(f.min?'◄ POP 最小':'heap 中'), cxp+cw/2, cy+32);
        if(f.stale){ ctx.strokeStyle=COLOR.dim; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(cxp+10,cy+ch/2); ctx.lineTo(cxp+cw-10,cy+ch/2); ctx.stroke(); }
        cxp+=cw+gap;
      }
    } else {
      rr(PAD,cy,w-PAD*2,42,6); ctx.fillStyle='#f3f7ef'; ctx.fill(); ctx.strokeStyle=COLOR.doneS; ctx.lineWidth=1.4; ctx.stroke();
      ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillStyle='#2f6a3a'; ctx.font='700 14px "JetBrains Mono", monospace';
      ctx.fillText(step===0?'尚未開始 — 點 Next / Play':'heap 已無新點需要連 — 完成', w/2, cy+21);
    }

    // ── BAND 3 · progress
    const ty=cy+66;
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 進度', PAD, ty);
    const box=ty+12; const done=s.added===5;
    rr(PAD,box,w-PAD*2,40,6); ctx.fillStyle=done?COLOR.done:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?COLOR.doneS:COLOR.grid; ctx.stroke();
    ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillStyle=COLOR.ink; ctx.font='700 14px "JetBrains Mono", monospace';
    ctx.fillText('已連點數  '+s.added+' / 5', PAD+16, box+20);
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
