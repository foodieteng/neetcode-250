/* ============================================================
   P778 寫法 B · Dijkstra 變形(最小瓶頸)
   dist[cell] = 到此格所需的最小「路徑最大高度」。min-heap 每次取
   目前瓶頸最小的格擴展,鬆弛用 max(h, 鄰居高度)。彈出終點即答案。
   Walks grid = [[0,2,1],[5,8,3],[6,7,4]]  →  4
     BAND 1  grid + 每格 dist(白=未探,藍=在堆中,綠=已定案,紅=剛彈出)
     BAND 2  priority_queue 內容(依瓶頸排序)
     BAND 3  彈出終點 → 答案
   ============================================================ */

(function () {
  const canvas = document.getElementById('vb-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('vb-step');
  const labelEl = document.getElementById('vb-label');
  const btnPrev = document.getElementById('vb-prev');
  const btnNext = document.getElementById('vb-next');
  const btnPlay = document.getElementById('vb-play');
  const btnReset = document.getElementById('vb-reset');

  const COLOR = {
    paper:'#ffffff', ink:'#1a1a1a', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf',
    unseen:'#fafaf6', unseenS:'#d3ccbe',
    inq:'#e3edf5', inqS:'#6f9fc4',
    done:'#d9e8c7', doneS:'#5fa866',
    cur:'#f6ddd3', curS:'#cf3535', coral:'#cf3535',
  };
  const GRID = [[0,2,1],[5,8,3],[6,7,4]];
  const N = 3, INF = '∞';

  // per step: dist map "r,c"->num, done set, cur "r,c"|null, pq [[val,"r,c"],...], ans
  const steps = [
    { dist:{'0,0':0}, done:[], cur:null, pq:[[0,'0,0']], ans:null,
      text:'<strong>INITIAL</strong> · <code>dist[0][0] = grid[0][0] = 0</code>,其餘為 ∞。'
          +'min-heap 依<strong>瓶頸值</strong>由小到大彈出。' },
    { dist:{'0,0':0,'0,1':2,'1,0':5}, done:['0,0'], cur:'0,0', pq:[[2,'0,1'],[5,'1,0']], ans:null,
      text:'彈出 <code>(0,0)</code>,瓶頸 0,定案。鬆弛鄰居:<code>(0,1)=max(0,2)=2</code>、'
          +'<code>(1,0)=max(0,5)=5</code>。' },
    { dist:{'0,0':0,'0,1':2,'1,0':5,'0,2':2,'1,1':8}, done:['0,0','0,1'], cur:'0,1', pq:[[2,'0,2'],[5,'1,0'],[8,'1,1']], ans:null,
      text:'彈出 <code>(0,1)</code>,瓶頸 2。鬆弛:<code>(0,2)=max(2,1)=2</code>、<code>(1,1)=max(2,8)=8</code>。' },
    { dist:{'0,0':0,'0,1':2,'1,0':5,'0,2':2,'1,1':8,'1,2':3}, done:['0,0','0,1','0,2'], cur:'0,2', pq:[[3,'1,2'],[5,'1,0'],[8,'1,1']], ans:null,
      text:'彈出 <code>(0,2)</code>,瓶頸 2。鬆弛:<code>(1,2)=max(2,3)=3</code>。' },
    { dist:{'0,0':0,'0,1':2,'1,0':5,'0,2':2,'1,1':8,'1,2':3,'2,2':4}, done:['0,0','0,1','0,2','1,2'], cur:'1,2', pq:[[4,'2,2'],[5,'1,0'],[8,'1,1']], ans:null,
      text:'彈出 <code>(1,2)</code>,瓶頸 3。鬆弛:<code>(2,2)=max(3,4)=4</code>。END 進堆。' },
    { dist:{'0,0':0,'0,1':2,'1,0':5,'0,2':2,'1,1':8,'1,2':3,'2,2':4}, done:['0,0','0,1','0,2','1,2','2,2'], cur:'2,2', pq:[[5,'1,0'],[8,'1,1']], ans:4,
      text:'彈出 <code>(2,2)=END</code>,瓶頸 <strong>4</strong> → <strong>return 4</strong>。'
          +'高度 5~8 的格從沒被定案為答案路徑。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rect=canvas.getBoundingClientRect();
    const w=rect.width||canvas.clientWidth, h=rect.height||canvas.clientHeight||500;
    const bw=Math.round(w*dpr), bh=Math.round(h*dpr); if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth, h=canvas.clientHeight; const PAD=26;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,h);

    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 網格顯示 dist(綠=已定案,藍=在堆中,紅=剛彈出)', PAD, 26);

    const cell=74, gx=PAD+22, gy=46;
    for(let r=0;r<N;r++) for(let c=0;c<N;c++){
      const key=r+','+c, x=gx+c*cell, y=gy+r*cell;
      const isDone=s.done.includes(key), isCur=s.cur===key, has=(key in s.dist);
      let fill=COLOR.unseen, st=COLOR.unseenS;
      if(isCur){ fill=COLOR.cur; st=COLOR.curS; }
      else if(isDone){ fill=COLOR.done; st=COLOR.doneS; }
      else if(has){ fill=COLOR.inq; st=COLOR.inqS; }
      rr(x+2,y+2,cell-4,cell-4,6); ctx.fillStyle=fill; ctx.fill();
      ctx.lineWidth=isCur?3.5:1.6; ctx.strokeStyle=isCur?COLOR.curS:st; ctx.stroke();
      // small height (top-left) + dist (center)
      ctx.fillStyle=COLOR.dim; ctx.font='600 10px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='top';
      ctx.fillText('h'+GRID[r][c], x+8, y+8);
      ctx.fillStyle=has?COLOR.ink:'#c9c2b4'; ctx.font='700 24px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(has?String(s.dist[key]):INF, x+cell/2, y+cell/2+4);
      if(key==='0,0'||key==='2,2'){ ctx.fillStyle=COLOR.coral; ctx.font='700 9px "JetBrains Mono", monospace'; ctx.textAlign='right'; ctx.textBaseline='top'; ctx.fillText(key==='0,0'?'START':'END', x+cell-8, y+8); }
    }
    // pq panel right
    const px=gx+N*cell+36;
    if(px<w-120){
      ctx.fillStyle=COLOR.dim; ctx.font='600 11px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='top';
      ctx.fillText('priority_queue', px, gy);
      ctx.fillText('(瓶頸, cell)', px, gy+16);
      for(let i=0;i<s.pq.length;i++){ const[v,k]=s.pq[i]; const y=gy+40+i*30;
        rr(px,y,150,24,4); ctx.fillStyle=i===0?COLOR.cur:'#f3f6f9'; ctx.fill(); ctx.lineWidth=1.4; ctx.strokeStyle=i===0?COLOR.curS:COLOR.grid; ctx.stroke();
        ctx.fillStyle=COLOR.ink; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='middle';
        ctx.fillText(`(${v}, ${k})`, px+10, y+12); }
    }

    // BAND 3
    ctx.fillStyle=s.ans!=null?COLOR.doneS:COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 彈出終點即答案', PAD, gy+N*cell+34);
    const by=gy+N*cell+48; rr(PAD,by,w-PAD*2,40,6);
    ctx.fillStyle=s.ans!=null?COLOR.done:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=s.ans!=null?COLOR.doneS:COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(s.ans!=null){ ctx.fillStyle='#2f6a3a'; ctx.font='700 15px "JetBrains Mono", monospace'; ctx.fillText('彈出 END,瓶頸 = 4 → return 4', w/2, by+20); }
    else { ctx.fillStyle=COLOR.dim; ctx.font='600 13px "Noto Sans TC", sans-serif'; ctx.fillText(s.cur==null?'尚未開始':'還沒彈出終點,繼續擴展…', w/2, by+20); }
  }
  function update(){ const s=steps[step]; if(stepEl) stepEl.textContent=String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0'); if(labelEl) labelEl.innerHTML=s.text; draw(); }
  function next(){ if(step<steps.length-1){step++;update();}else stop(); }
  function prev(){ if(step>0){step--;update();} }
  function reset(){ stop(); step=0; update(); }
  function play(){ if(timer){stop();return;} btnPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){stop();return;} next(); },1500); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} if(btnPlay) btnPlay.textContent='Play'; }
  btnPrev&&btnPrev.addEventListener('click',prev); btnNext&&btnNext.addEventListener('click',next);
  btnPlay&&btnPlay.addEventListener('click',play); btnReset&&btnReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();});
  if(window.ResizeObserver){ const ro=new ResizeObserver(()=>{fit();draw();}); ro.observe(canvas); }
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw);
  fit(); update();
})();
