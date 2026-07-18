/* ============================================================
   P399 · Evaluate Division — 加權圖 BFS(逐步)· viz
   把 a/b = v 建成有向邊 a→b 權重 v、反向 b→a 權重 1/v。查 c/d = 沿一條
   c 到 d 的路徑把邊權<strong>連乘</strong>(電話接龍:a/b · b/c = a/c)。BFS 帶著
   累積權重走;到達終點就回傳乘積,走不到 / 變數未定義回 -1。
   例 a/b=2, b/c=3 · 查 a/c → 2×3 = 6
     BAND 1  加權圖(紅=目前節點 · 綠=走過的邊)
     BAND 2  queue:(節點, 累積權重 = a/該點)
     BAND 3  說明
   ============================================================ */
(function () {
  const canvas = document.getElementById('viz-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('viz-step'), labelEl = document.getElementById('viz-label');
  const bPrev = document.getElementById('viz-prev'), bNext = document.getElementById('viz-next'),
        bPlay = document.getElementById('viz-play'), bReset = document.getElementById('viz-reset');

  const COLOR = { paper:'#ffffff', ink:'#1a1a1a', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf',
    node:'#f3f3ef', nodeS:'#c9c9c1', cur:'#fbe1e1', curS:'#cf3535', done:'#d9e8c7', doneS:'#5fa866', doneT:'#3f7a3a',
    edge:'#b7c7d6', edgeOn:'#5fa866', coral:'#cf3535' };

  const NODES = ['a','b','c'];
  // directed forward edges with weights; reverse = 1/w
  const EDGES = [['a','b',2],['b','c',3]];
  const steps = [
    { queue:[], cur:null, path:[], w:null, done:false,
      text:'<strong>INITIAL</strong> · <code>a/b=2</code>、<code>b/c=3</code>。建邊:<code>a→b</code> 存 <code>2</code>、反向 <code>b→a</code> 存 <code>1/2</code>。查 <strong>a/c</strong> = 沿路徑<strong>把邊權連乘</strong>(<code>a/b · b/c = a/c</code>)。' },
    { queue:[['a',1]], cur:'a', path:[], w:1, done:false,
      text:'BFS 從 <code>a</code> 出發,帶累積權重 <code>1.0</code>(= <code>a/a</code>)入隊。目標 <code>c</code>。' },
    { queue:[['b',2]], cur:'b', path:['a-b'], w:2, done:false,
      text:'出隊 <code>a</code>,走邊 <code>a→b</code>(×2):累積 <code>1×2 = 2</code>(= <code>a/b</code>)。<code>b≠c</code>,入隊 <code>(b, 2)</code>。' },
    { queue:[], cur:'c', path:['a-b','b-c'], w:6, done:true,
      text:'出隊 <code>b</code>,鄰居 <code>c</code> <strong>就是終點</strong> → 回傳 <code>2×3 = 6</code>(= <code>a/b · b/c = a/c</code>)。' },
  ];

  const POS = {};
  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||420; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function arrow(ax,ay,bx,by,color,wdt){ const dx=bx-ax,dy=by-ay,L=Math.hypot(dx,dy),ux=dx/L,uy=dy/L,R=26;
    const sx=ax+ux*R,sy=ay+uy*R,ex=bx-ux*R,ey=by-uy*R; ctx.strokeStyle=color; ctx.lineWidth=wdt||2.6;
    ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(ex,ey); ctx.stroke();
    const a=Math.atan2(uy,ux),h=11; ctx.fillStyle=color; ctx.beginPath(); ctx.moveTo(ex,ey);
    ctx.lineTo(ex-h*Math.cos(a-0.4),ey-h*Math.sin(a-0.4)); ctx.lineTo(ex-h*Math.cos(a+0.4),ey-h*Math.sin(a+0.4)); ctx.closePath(); ctx.fill(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,h=canvas.clientHeight,PAD=26; const cx=w/2;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,h);
    POS['a']=[cx-160,120]; POS['b']=[cx,120]; POS['c']=[cx+160,120];
    const pathSet=new Set(s.path);
    const visited=new Set(); s.path.forEach(e=>{ const [u,v]=e.split('-'); visited.add(u); visited.add(v); });
    if(s.cur) visited.add(s.cur);

    // ── BAND 1 · weighted graph
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 加權圖 a→b 存 a/b(紅=目前節點 · 綠=走過的邊 · 邊上=權重)', PAD, 22);
    for(const [u,v,wt] of EDGES){ const key=u+'-'+v; const on=pathSet.has(key);
      arrow(POS[u][0],POS[u][1],POS[v][0],POS[v][1], on?COLOR.edgeOn:COLOR.edge, on?3.6:2.6);
      const mx=(POS[u][0]+POS[v][0])/2, my=(POS[u][1]+POS[v][1])/2;
      ctx.fillStyle=on?COLOR.doneT:COLOR.text; ctx.font='700 13px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('×'+wt, mx, my-16);
      ctx.fillStyle=COLOR.dim; ctx.font='600 10px "JetBrains Mono", monospace'; ctx.fillText(u+'/'+v+'='+wt, mx, my+18); }
    for(const id of NODES){ const [x,y]=POS[id]; const cur=(id===s.cur); const seen=visited.has(id)&&!cur;
      const isEnd=(id==='c');
      ctx.beginPath(); ctx.arc(x,y,25,0,Math.PI*2);
      ctx.fillStyle=cur?COLOR.cur:(seen?COLOR.done:COLOR.node); ctx.fill();
      ctx.lineWidth=cur?3.6:2.2; ctx.strokeStyle=cur?COLOR.curS:(seen?COLOR.doneS:COLOR.nodeS); ctx.stroke();
      ctx.fillStyle=cur?COLOR.curS:(seen?COLOR.doneT:COLOR.ink); ctx.font='700 19px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(id,x,y+1);
      if(isEnd){ ctx.fillStyle=COLOR.coral; ctx.font='700 10px "JetBrains Mono", monospace'; ctx.fillText('目標', x, y-34); }
      if(id==='a'){ ctx.fillStyle=COLOR.dim; ctx.font='700 10px "JetBrains Mono", monospace'; ctx.fillText('起點', x, y-34); } }

    // ── BAND 2 · queue
    let by=214;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · queue:(節點, 累積權重 = a/該點)', PAD, by);
    const cy=by+14;
    ctx.fillStyle=COLOR.text; ctx.font='700 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText('queue', PAD, cy+20);
    let qx=PAD+64;
    if(s.queue.length){ for(const [nd,ww] of s.queue){ const label='('+nd+', '+ww+')'; ctx.font='700 14px "JetBrains Mono", monospace'; const tw=ctx.measureText(label).width;
      rr(qx,cy,tw+22,40,6); ctx.fillStyle='#eef4fa'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle='#a9c4da'; ctx.stroke();
      ctx.fillStyle=COLOR.ink; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText(label, qx+11, cy+21); qx+=tw+34; } }
    else { ctx.fillStyle=COLOR.dim; ctx.font='600 12px "Noto Sans TC", sans-serif'; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText(s.done?'(空 · 已找到)':'(空)', qx, cy+21); }
    // running product
    if(s.w!=null){ ctx.fillStyle=COLOR.text; ctx.font='700 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText('累積 w =', PAD+330, cy+20);
      ctx.fillStyle=s.done?COLOR.doneT:COLOR.coral; ctx.font='700 20px "JetBrains Mono", monospace'; ctx.fillText(String(s.w), PAD+414, cy+20); }

    // ── BAND 3 · note
    const ty=cy+68, done=!!s.done;
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 為什麼權重連乘 = 除法答案', PAD, ty);
    const box=ty+12; rr(PAD,box,w-PAD*2,40,6); ctx.fillStyle=done?COLOR.done:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?COLOR.doneS:COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(done){ ctx.fillStyle=COLOR.doneT; ctx.font='700 13px "JetBrains Mono", monospace'; ctx.fillText('a/c = 6 · 沿路徑 a/b · b/c 中間項相消 = a/c', w/2, box+20); }
    else { ctx.fillStyle=COLOR.text; ctx.font='600 12px "Noto Sans TC", sans-serif'; ctx.fillText('起點或終點沒出現在圖裡、或走不到 → 回 -1(無法determine)', w/2, box+20); }
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
