/* ============================================================
   P997 · Find the Town Judge — in/out degree (STATIC 一次全顯示)
   信任關係看成有向圖:邊 a→b = 「a 信任 b」。法官是唯一
   「被所有人信任(in = n−1)、自己誰也不信任(out = 0)」的人。
   一張圖同時呈現:關係圖 + 每人 in/out 度 + 判定。無步進、無軸。
   n = 3, trust = [[1,3],[2,3]]  →  judge 3
   ============================================================ */
(function () {
  const canvas = document.getElementById('viz-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const COLOR = { paper:'#ffffff', ink:'#1a1a1a', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf',
    node:'#ffffff', nodeS:'#c9c9c1', edge:'#6f9fc4',
    no:'#f0f0ec', noS:'#c9c9c1', judge:'#d9e8c7', judgeS:'#5fa866', coral:'#d96e4e' };

  const N = 3;
  const E = [[1,3],[2,3]];               // a trusts b
  function deg(id){ let o=0,i=0; for(const [a,b] of E){ if(a===id)o++; if(b===id)i++; } return {i,o}; }

  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||430; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
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
    fit(); const w=canvas.clientWidth,h=canvas.clientHeight,PAD=26;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,h);
    const POS = { 3:[w/2, 92], 1:[w/2-150, 238], 2:[w/2+150, 238] };

    // ── 標題
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('信任關係圖 · 箭頭 a→b = 「a 信任 b」 · n = 3', PAD, 24);

    // ── 邊(全部畫出)
    for(const [a,b] of E) arrow(POS[a][0],POS[a][1],POS[b][0],POS[b][1], COLOR.edge, 3.2);

    // ── 節點 + in/out(全部標出,法官綠色)
    for(const id of [1,2,3]){ const [x,y]=POS[id]; const d=deg(id); const isJudge=(d.o===0 && d.i===N-1);
      ctx.beginPath(); ctx.arc(x,y,34,0,Math.PI*2);
      ctx.fillStyle=isJudge?COLOR.judge:COLOR.node; ctx.fill();
      ctx.lineWidth=isJudge?3.5:2.4; ctx.strokeStyle=isJudge?COLOR.judgeS:COLOR.nodeS; ctx.stroke();
      ctx.fillStyle=COLOR.ink; ctx.font='700 22px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('P'+id, x, y+1);
      const ty=(id===3)?y-50:y+50;
      ctx.font='700 13px "JetBrains Mono", monospace'; ctx.textBaseline='middle';
      ctx.fillStyle=isJudge?COLOR.judgeS:COLOR.text; ctx.fillText('in '+d.i+' · out '+d.o, x, ty);
      if(isJudge){ ctx.fillStyle=COLOR.judgeS; ctx.font='700 11px "JetBrains Mono", monospace'; ctx.fillText('JUDGE', x, y+50); }
    }

    // ── 度數總表(三格,一次全顯示)
    let by=314;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('每人 in / out 度 · 法官條件:out == 0 且 in == n−1 (= 2)', PAD, by);
    const cy=by+12, cw=(w-PAD*2-24)/3, gap=12, ch=52;
    for(let k=0;k<3;k++){ const id=k+1, d=deg(id), ok=(d.o===0&&d.i===N-1); const x=PAD+k*(cw+gap);
      rr(x,cy,cw,ch,6); ctx.fillStyle=ok?COLOR.judge:COLOR.no; ctx.fill(); ctx.lineWidth=1.8; ctx.strokeStyle=ok?COLOR.judgeS:COLOR.noS; ctx.stroke();
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillStyle=COLOR.ink; ctx.font='700 15px "JetBrains Mono", monospace'; ctx.fillText('P'+id+'   in '+d.i+' · out '+d.o, x+cw/2, cy+18);
      ctx.font='700 12px "JetBrains Mono", monospace'; ctx.fillStyle=ok?COLOR.judgeS:COLOR.dim;
      ctx.fillText(ok?'✓ 符合 → JUDGE':'✗ out≠0,不是法官', x+cw/2, cy+38);
    }

    // ── 結論
    const ry=cy+ch+26;
    rr(PAD,ry,w-PAD*2,40,6); ctx.fillStyle=COLOR.judge; ctx.fill(); ctx.lineWidth=1.8; ctx.strokeStyle=COLOR.judgeS; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillStyle='#3f7a3a'; ctx.font='700 15px "JetBrains Mono", monospace';
    ctx.fillText('唯一符合的是 P3  →  return 3', w/2, ry+21);
  }

  window.addEventListener('resize', draw); if(window.ResizeObserver){ new ResizeObserver(draw).observe(canvas); }
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw); fit(); draw();
})();
