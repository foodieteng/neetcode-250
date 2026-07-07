/* ============================================================
   P1631 寫法 B · Dijkstra 變形(最小 effort)
   effort[cell] = 到此格所需的最小「路徑最大 |Δ|」。min-heap 每次取
   effort 最小的格擴展,鬆弛用 max(d, |Δ 到鄰居|)。彈出終點即答案。
   Walks grid = [[1,2,2],[3,8,2],[5,3,5]]  →  2
     BAND 1  grid:h=高度(小)· effort(大);綠=定案,藍=在堆中,珊瑚=剛彈出
     BAND 2  priority_queue(依 effort 排序)
     BAND 3  彈出終點 → 答案
   ============================================================ */
(function () {
  const canvas=document.getElementById('vb-canvas'); if(!canvas) return;
  const ctx=canvas.getContext('2d');
  const stepEl=document.getElementById('vb-step'), labelEl=document.getElementById('vb-label');
  const bPrev=document.getElementById('vb-prev'), bNext=document.getElementById('vb-next'), bPlay=document.getElementById('vb-play'), bReset=document.getElementById('vb-reset');
  const COLOR={ paper:'#ffffff', ink:'#1a1a1a', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf',
    unseen:'#fafaf6', unseenS:'#d3ccbe', inq:'#e3edf5', inqS:'#6f9fc4', done:'#d9e8c7', doneS:'#5fa866', cur:'#f6ddd3', curS:'#d96e4e', coral:'#d96e4e' };
  const GRID=[[1,2,2],[3,8,2],[5,3,5]], N=3, INF='∞';
  const steps=[
    { dist:{'0,0':0}, done:[], cur:null, pq:[[0,'0,0']], ans:null,
      text:'<strong>INITIAL</strong> · <code>effort[0][0]=0</code>,其餘 ∞。min-heap 依 effort 由小到大彈出。' },
    { dist:{'0,0':0,'0,1':1,'1,0':2}, done:['0,0'], cur:'0,0', pq:[[1,'0,1'],[2,'1,0']], ans:null,
      text:'彈出 <code>(0,0)</code>,effort 0。鬆弛:<code>(0,1)=|1-2|=1</code>、<code>(1,0)=|1-3|=2</code>。' },
    { dist:{'0,0':0,'0,1':1,'1,0':2,'0,2':1,'1,1':6}, done:['0,0','0,1'], cur:'0,1', pq:[[1,'0,2'],[2,'1,0'],[6,'1,1']], ans:null,
      text:'彈出 <code>(0,1)</code>,effort 1。鬆弛:<code>(0,2)=max(1,0)=1</code>、<code>(1,1)=max(1,6)=6</code>。' },
    { dist:{'0,0':0,'0,1':1,'1,0':2,'0,2':1,'1,1':6,'1,2':1}, done:['0,0','0,1','0,2'], cur:'0,2', pq:[[1,'1,2'],[2,'1,0'],[6,'1,1']], ans:null,
      text:'彈出 <code>(0,2)</code>,effort 1。鬆弛:<code>(1,2)=max(1,0)=1</code>。' },
    { dist:{'0,0':0,'0,1':1,'1,0':2,'0,2':1,'1,1':6,'1,2':1,'2,2':3}, done:['0,0','0,1','0,2','1,2'], cur:'1,2', pq:[[2,'1,0'],[3,'2,2'],[6,'1,1']], ans:null,
      text:'彈出 <code>(1,2)</code>,effort 1。鬆弛:<code>(2,2)=max(1,|2-5|=3)=3</code>。' },
    { dist:{'0,0':0,'0,1':1,'1,0':2,'0,2':1,'1,1':5,'1,2':1,'2,2':3,'2,0':2}, done:['0,0','0,1','0,2','1,2','1,0'], cur:'1,0', pq:[[2,'2,0'],[3,'2,2'],[5,'1,1']], ans:null,
      text:'彈出 <code>(1,0)</code>,effort 2。鬆弛:<code>(2,0)=2</code>、<code>(1,1)</code> 更新為 <code>max(2,5)=5</code>。' },
    { dist:{'0,0':0,'0,1':1,'1,0':2,'0,2':1,'1,1':5,'1,2':1,'2,2':3,'2,0':2,'2,1':2}, done:['0,0','0,1','0,2','1,2','1,0','2,0'], cur:'2,0', pq:[[2,'2,1'],[3,'2,2'],[5,'1,1']], ans:null,
      text:'彈出 <code>(2,0)</code>,effort 2。鬆弛:<code>(2,1)=2</code>。' },
    { dist:{'0,0':0,'0,1':1,'1,0':2,'0,2':1,'1,1':5,'1,2':1,'2,2':2,'2,0':2,'2,1':2}, done:['0,0','0,1','0,2','1,2','1,0','2,0','2,1'], cur:'2,1', pq:[[2,'2,2'],[5,'1,1']], ans:null,
      text:'彈出 <code>(2,1)</code>,effort 2。鬆弛:<code>(2,2)</code> 由 3 更新為 <code>max(2,2)=2</code>。' },
    { dist:{'0,0':0,'0,1':1,'1,0':2,'0,2':1,'1,1':5,'1,2':1,'2,2':2,'2,0':2,'2,1':2}, done:['0,0','0,1','0,2','1,2','1,0','2,0','2,1','2,2'], cur:'2,2', pq:[[5,'1,1']], ans:2,
      text:'彈出 <code>(2,2)=END</code>,effort <strong>2</strong> → <strong>return 2</strong>。高度 8 的中心格 effort 高,不在最佳路徑上。' },
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
    ctx.fillText('BAND 1 · 大字=effort(綠 定案,藍 在堆中,珊瑚 剛彈出),小字 h=高度', PAD, 26);
    const cell=74, gx=PAD+22, gy=46;
    for(let r=0;r<N;r++) for(let c=0;c<N;c++){ const key=r+','+c, x=gx+c*cell, y=gy+r*cell;
      const isDone=s.done.includes(key), isCur=s.cur===key, has=(key in s.dist);
      let fill=COLOR.unseen, st=COLOR.unseenS;
      if(isCur){fill=COLOR.cur;st=COLOR.curS;} else if(isDone){fill=COLOR.done;st=COLOR.doneS;} else if(has){fill=COLOR.inq;st=COLOR.inqS;}
      rr(x+2,y+2,cell-4,cell-4,6); ctx.fillStyle=fill; ctx.fill(); ctx.lineWidth=isCur?3.5:1.6; ctx.strokeStyle=isCur?COLOR.curS:st; ctx.stroke();
      ctx.fillStyle=COLOR.dim; ctx.font='600 10px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='top'; ctx.fillText('h'+GRID[r][c],x+8,y+8);
      ctx.fillStyle=has?COLOR.ink:'#c9c2b4'; ctx.font='700 24px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(has?String(s.dist[key]):INF,x+cell/2,y+cell/2+4);
      if(key==='0,0'||key==='2,2'){ ctx.fillStyle=COLOR.coral; ctx.font='700 9px "JetBrains Mono", monospace'; ctx.textAlign='right'; ctx.textBaseline='top'; ctx.fillText(key==='0,0'?'START':'END',x+cell-8,y+8); } }
    const px=gx+N*cell+36;
    if(px<w-120){ ctx.fillStyle=COLOR.dim; ctx.font='600 11px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='top';
      ctx.fillText('priority_queue',px,gy); ctx.fillText('(effort, cell)',px,gy+16);
      for(let i=0;i<s.pq.length;i++){ const[v,k]=s.pq[i]; const y=gy+40+i*30; rr(px,y,150,24,4); ctx.fillStyle=i===0?COLOR.cur:'#f3f6f9'; ctx.fill(); ctx.lineWidth=1.4; ctx.strokeStyle=i===0?COLOR.curS:COLOR.grid; ctx.stroke();
        ctx.fillStyle=COLOR.ink; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText(`(${v}, ${k})`,px+10,y+12); } }
    ctx.fillStyle=s.ans!=null?COLOR.doneS:COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 彈出終點即答案', PAD, gy+N*cell+34);
    const by=gy+N*cell+48; rr(PAD,by,w-PAD*2,40,6); ctx.fillStyle=s.ans!=null?COLOR.done:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=s.ans!=null?COLOR.doneS:COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(s.ans!=null){ ctx.fillStyle='#2f6a3a'; ctx.font='700 15px "JetBrains Mono", monospace'; ctx.fillText('彈出 END,effort = 2 → return 2', w/2, by+20); }
    else { ctx.fillStyle=COLOR.dim; ctx.font='600 13px "Noto Sans TC", sans-serif'; ctx.fillText(s.cur==null?'尚未開始':'還沒彈出終點,繼續擴展…', w/2, by+20); }
  }
  function update(){ const s=steps[step]; if(stepEl) stepEl.textContent=String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0'); if(labelEl) labelEl.innerHTML=s.text; draw(); }
  function next(){ if(step<steps.length-1){step++;update();}else stop(); }
  function prev(){ if(step>0){step--;update();} }
  function reset(){ stop(); step=0; update(); }
  function play(){ if(timer){stop();return;} bPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){stop();return;} next(); },1400); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} if(bPlay) bPlay.textContent='Play'; }
  bPrev&&bPrev.addEventListener('click',prev); bNext&&bNext.addEventListener('click',next); bPlay&&bPlay.addEventListener('click',play); bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();}); if(window.ResizeObserver){ new ResizeObserver(()=>{fit();draw();}).observe(canvas); }
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw); fit(); update();
})();
