/* ============================================================
   P1631 寫法 C · 二分答案 + BFS
   可達性對門檻 mid 單調(mid 越大能跨的邊越多)→ 對答案二分。
   每個 mid 用 BFS 檢查「只跨 |Δ| ≤ mid 的邊」能否到終點。
   Walks grid = [[1,2,2],[3,8,2],[5,3,5]]  ,上界=最大 |Δ|=6
     checks: mid=3 可達 → mid=1 不可達 → mid=2 可達 → 收斂到 2
     BAND 1  BFS:藍=可達(|Δ|≤mid 可跨),灰=到不了
     BAND 2  搜尋區間 [lo, hi] + mid + 檢查結果
     BAND 3  收斂 → 答案
   ============================================================ */
(function () {
  const canvas=document.getElementById('vc-canvas'); if(!canvas) return;
  const ctx=canvas.getContext('2d');
  const stepEl=document.getElementById('vc-step'), labelEl=document.getElementById('vc-label');
  const bPrev=document.getElementById('vc-prev'), bNext=document.getElementById('vc-next'), bPlay=document.getElementById('vc-play'), bReset=document.getElementById('vc-reset');
  const COLOR={ paper:'#ffffff', ink:'#1a1a1a', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf',
    blocked:'#eceae4', blockedS:'#cfcac0', blockedTxt:'#b7b1a4', pass:'#e3edf5', passS:'#6f9fc4',
    ok:'#d9e8c7', okS:'#5fa866', bad:'#f4d9d5', badS:'#c0392b', coral:'#d96e4e' };
  const GRID=[[1,2,2],[3,8,2],[5,3,5]], N=3;
  const ALL=['0,0','0,1','0,2','1,0','1,2','2,0','2,1','2,2'];  // reachable at mid>=2 (all but 1,1)
  const steps=[
    { lo:0, hi:6, mid:null, reach:[], ok:null, ans:null,
      text:'<strong>INITIAL</strong> · 邊權 = 高度差 |Δ|。二分門檻,區間 <code>[0, 6]</code>(上界=最大 |Δ|)。'
          +'每個 <code>mid</code> 用 BFS 檢查「只跨 |Δ|≤mid」能否到 END。' },
    { lo:0, hi:6, mid:3, reach:ALL, ok:true, ans:null,
      text:'<code>mid=3</code>:可跨 |Δ|≤3 的邊,BFS <strong>能到 END ✓</strong> → 縮小 <code>hi=3</code>。' },
    { lo:0, hi:3, mid:1, reach:['0,0','0,1','0,2','1,2'], ok:false, ans:null,
      text:'<code>mid=1</code>:只能跨 |Δ|≤1,困在右上角、<strong>到不了 END ✗</strong> → 抬高 <code>lo=2</code>。' },
    { lo:2, hi:3, mid:2, reach:ALL, ok:true, ans:null,
      text:'<code>mid=2</code>:可跨 |Δ|≤2,沿左 / 下邊界 BFS <strong>能到 END ✓</strong> → <code>hi=2</code>。' },
    { lo:2, hi:2, mid:null, reach:ALL, ok:true, ans:2,
      text:'<code>lo==hi==2</code> → 收斂。<strong>return 2</strong>。可達性 false→true 的臨界點就是答案。' },
  ];
  let step=0,timer=null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||500; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,h=canvas.clientHeight,PAD=26;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,h);
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · BFS(藍=可達,灰=到不了)', PAD, 26);
    const cell=74, gx=PAD+22, gy=46, endReached=s.ok===true;
    for(let r=0;r<N;r++) for(let c=0;c<N;c++){ const key=r+','+c, x=gx+c*cell, y=gy+r*cell, reached=s.reach.includes(key), isEnd=key==='2,2';
      let fill=COLOR.blocked, st=COLOR.blockedS, txt=COLOR.blockedTxt;
      if(reached){ if(isEnd&&endReached){fill=COLOR.ok;st=COLOR.okS;txt=COLOR.ink;} else {fill=COLOR.pass;st=COLOR.passS;txt=COLOR.ink;} }
      rr(x+2,y+2,cell-4,cell-4,6); ctx.fillStyle=fill; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=st; ctx.stroke();
      ctx.fillStyle=txt; ctx.font='700 26px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(String(GRID[r][c]),x+cell/2,y+cell/2);
      if(key==='0,0'||isEnd){ ctx.fillStyle=COLOR.coral; ctx.font='700 9px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='top'; ctx.fillText(key==='0,0'?'START':'END',x+cell/2,y+7); } }
    const px=gx+N*cell+36;
    if(px<w-120 && s.mid!=null){ rr(px,gy+20,168,60,6); ctx.fillStyle=s.ok?COLOR.ok:COLOR.bad; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=s.ok?COLOR.okS:COLOR.badS; ctx.stroke();
      ctx.fillStyle=COLOR.ink; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='top'; ctx.fillText('bfs(mid='+s.mid+')',px+84,gy+30);
      ctx.font='700 18px "JetBrains Mono", monospace'; ctx.textBaseline='bottom'; ctx.fillStyle=s.ok?'#2f6a3a':'#8a2820'; ctx.fillText(s.ok?'可達 ✓':'不可達 ✗',px+84,gy+74); }
    // interval bar
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 搜尋區間 [lo, hi]', PAD, gy+N*cell+34);
    const axY=gy+N*cell+62, axX=PAD+30, axW=w-PAD*2-60, vmax=6, xOf=(v)=>axX+axW*(v/vmax);
    ctx.strokeStyle=COLOR.grid; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(axX,axY); ctx.lineTo(axX+axW,axY); ctx.stroke();
    ctx.strokeStyle=COLOR.passS; ctx.lineWidth=6; ctx.beginPath(); ctx.moveTo(xOf(s.lo),axY); ctx.lineTo(xOf(s.hi),axY); ctx.stroke();
    for(let v=0;v<=vmax;v++){ const x=xOf(v); ctx.fillStyle=COLOR.dim; ctx.font='600 10px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='top'; ctx.fillText(String(v),x,axY+8);
      ctx.strokeStyle=COLOR.grid; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(x,axY-4); ctx.lineTo(x,axY+4); ctx.stroke(); }
    const tag=(v,label)=>{ const x=xOf(v); ctx.fillStyle=COLOR.passS; ctx.beginPath(); ctx.arc(x,axY,6,0,Math.PI*2); ctx.fill(); ctx.font='700 10px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='bottom'; ctx.fillText(label,x,axY-9); };
    tag(s.lo,'lo'); tag(s.hi,'hi');
    if(s.mid!=null){ const x=xOf(s.mid); ctx.strokeStyle=COLOR.coral; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(x,axY-16); ctx.lineTo(x,axY+16); ctx.stroke(); ctx.fillStyle=COLOR.coral; ctx.font='700 10px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='top'; ctx.fillText('mid',x,axY-30); }
    const by=axY+40; rr(PAD,by,w-PAD*2,36,6); ctx.fillStyle=s.ans!=null?COLOR.ok:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=s.ans!=null?COLOR.okS:COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(s.ans!=null){ ctx.fillStyle='#2f6a3a'; ctx.font='700 15px "JetBrains Mono", monospace'; ctx.fillText('lo == hi == 2 → return 2', w/2, by+18); }
    else { ctx.fillStyle=COLOR.dim; ctx.font='600 13px "Noto Sans TC", sans-serif'; ctx.fillText(s.mid==null?'準備二分…':'依檢查結果收斂區間…', w/2, by+18); }
  }
  function update(){ const s=steps[step]; if(stepEl) stepEl.textContent=String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0'); if(labelEl) labelEl.innerHTML=s.text; draw(); }
  function next(){ if(step<steps.length-1){step++;update();}else stop(); }
  function prev(){ if(step>0){step--;update();} }
  function reset(){ stop(); step=0; update(); }
  function play(){ if(timer){stop();return;} bPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){stop();return;} next(); },1600); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} if(bPlay) bPlay.textContent='Play'; }
  bPrev&&bPrev.addEventListener('click',prev); bNext&&bNext.addEventListener('click',next); bPlay&&bPlay.addEventListener('click',play); bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();}); if(window.ResizeObserver){ new ResizeObserver(()=>{fit();draw();}).observe(canvas); }
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw); fit(); update();
})();
