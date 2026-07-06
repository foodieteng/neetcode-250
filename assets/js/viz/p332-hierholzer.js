/* ============================================================
   P332 Reconstruct Itinerary — Hierholzer 歐拉路徑
   核心:貪心走「當前最小」的邊並邊走邊刪;走到死路(無出邊)的
   節點先 push 進 routes(後序),最後 reverse。死路節點先進、反轉
   後排最後 —— 這就是為什麼字母最小的死路會被排到後面。
   Walks: tickets = [[JFK,KUL],[JFK,NRT],[NRT,JFK]]  →  [JFK,NRT,JFK,KUL]
   Three tidy horizontal bands:
     BAND 1  the graph (edges consumed as we walk)
     BAND 2  recursion stack (current DFS path)
     BAND 3  routes[] post-order pushes + reversed answer
   Style: white paper background, solid-color fills.
   ============================================================ */

(function () {
  const canvas = document.getElementById('viz-canvas');
  if (!canvas) return;

  const ctx      = canvas.getContext('2d');
  const stepEl   = document.getElementById('viz-step');
  const labelEl  = document.getElementById('viz-label');
  const btnPrev  = document.getElementById('viz-prev');
  const btnNext  = document.getElementById('viz-next');
  const btnPlay  = document.getElementById('viz-play');
  const btnReset = document.getElementById('viz-reset');

  const COLOR = {
    paper:'#ffffff', ink:'#1a1a1a', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf',
    live:'#6f9fc4', used:'#d9d4c8', active:'#d96e4e',
    node:'#eef0f2', nodeS:'#9fb8cf', cur:'#f6ddd3', curS:'#d96e4e',
    push:'#d9e8c7', pushS:'#5fa866',
    stackBg:'#e3edf5', stackS:'#6f9fc4',
    coral:'#d96e4e',
  };

  const NODES = { JFK:{x:110,y:70}, NRT:{x:330,y:70}, KUL:{x:220,y:170} };
  const EDGES = [
    { id:'jk', u:'JFK', v:'KUL', off:0 },
    { id:'jn', u:'JFK', v:'NRT', off:-13 },   // anti-parallel pair: shift apart
    { id:'nj', u:'NRT', v:'JFK', off:-13 },
  ];

  // steps: used[] cumulative, active edge id, cur node, stack[], routes[], pushed, reversed, answer[]
  const steps = [
    { used:[], active:null, cur:'JFK', stack:['JFK'], routes:[], pushed:null, rev:false,
      text:'<strong>INITIAL</strong> · 每個機場的出邊放進 <code>multiset</code>(天生字典序)。從 <code>JFK</code> 開始 DFS,'
          +'<strong>貪心走最小的邊、邊走邊刪</strong>。' },
    { used:['jk'], active:'jk', cur:'KUL', stack:['JFK','KUL'], routes:[], pushed:null, rev:false,
      text:'<code>JFK</code> 的最小出邊是 <code>KUL</code>(字母 K &lt; N)→ 走 <code>JFK→KUL</code> 並刪掉這條邊。' },
    { used:['jk'], active:null, cur:'KUL', stack:['JFK'], routes:['KUL'], pushed:'KUL', rev:false,
      text:'<code>KUL</code> <strong>沒有出邊 = 死路</strong> → 先把 <code>KUL</code> push 進 routes,回退到 <code>JFK</code>。'
          +'(注意:還有邊沒走完,不能就這樣輸出!)' },
    { used:['jk','jn'], active:'jn', cur:'NRT', stack:['JFK','NRT'], routes:['KUL'], pushed:null, rev:false,
      text:'回到 <code>JFK</code>,剩下的最小出邊是 <code>NRT</code> → 走 <code>JFK→NRT</code> 並刪除。' },
    { used:['jk','jn','nj'], active:'nj', cur:'JFK', stack:['JFK','NRT','JFK'], routes:['KUL'], pushed:null, rev:false,
      text:'<code>NRT</code> 的出邊是 <code>JFK</code> → 走 <code>NRT→JFK</code> 並刪除。所有邊都走完了。' },
    { used:['jk','jn','nj'], active:null, cur:'JFK', stack:['JFK','NRT'], routes:['KUL','JFK'], pushed:'JFK', rev:false,
      text:'此時的 <code>JFK</code> 無出邊 → push <code>JFK</code>。routes = <code>[KUL, JFK]</code>。' },
    { used:['jk','jn','nj'], active:null, cur:'NRT', stack:['JFK'], routes:['KUL','JFK','NRT'], pushed:'NRT', rev:false,
      text:'回退:<code>NRT</code> 無出邊 → push <code>NRT</code>。routes = <code>[KUL, JFK, NRT]</code>。' },
    { used:['jk','jn','nj'], active:null, cur:'JFK', stack:[], routes:['KUL','JFK','NRT','JFK'], pushed:'JFK', rev:false,
      text:'回退:最外層 <code>JFK</code> 無出邊 → push <code>JFK</code>。routes = <code>[KUL, JFK, NRT, JFK]</code>。' },
    { used:['jk','jn','nj'], active:null, cur:null, stack:[], routes:['KUL','JFK','NRT','JFK'], pushed:null, rev:true,
      answer:['JFK','NRT','JFK','KUL'],
      text:'<strong>reverse(routes)</strong> → <code>[JFK, NRT, JFK, KUL]</code>。<strong>KUL 字母最小卻排最後</strong>,'
          +'因為它是死路、最早被 push。這正是 Hierholzer 後序+反轉的精髓。' },
  ];

  let step = 0, timer = null;

  function fitCanvas() {
    const dpr = Math.min(Math.max(window.devicePixelRatio || 1, 2), 3);
    const rect = canvas.getBoundingClientRect();
    const w = rect.width || canvas.clientWidth;
    const h = rect.height || canvas.clientHeight || 500;
    const bw = Math.round(w*dpr), bh = Math.round(h*dpr);
    if (canvas.width !== bw || canvas.height !== bh) { canvas.width = bw; canvas.height = bh; }
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function arrow(x1,y1,x2,y2,r1,r2,col,wid){
    const dx=x2-x1, dy=y2-y1, L=Math.hypot(dx,dy), ux=dx/L, uy=dy/L;
    const sx=x1+ux*r1, sy=y1+uy*r1, ex=x2-ux*r2, ey=y2-uy*r2;
    ctx.strokeStyle=col; ctx.lineWidth=wid;
    ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(ex,ey); ctx.stroke();
    const ah=8, aa=Math.atan2(dy,dx);
    ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(ex,ey);
    ctx.lineTo(ex-ah*Math.cos(aa-0.42), ey-ah*Math.sin(aa-0.42));
    ctx.lineTo(ex-ah*Math.cos(aa+0.42), ey-ah*Math.sin(aa+0.42));
    ctx.closePath(); ctx.fill();
  }

  function draw() {
    fitCanvas();
    const s = steps[step];
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const PAD = 26;
    ctx.fillStyle = COLOR.paper; ctx.fillRect(0,0,w,h);

    // ───────── BAND 1 · graph ─────────
    ctx.fillStyle = COLOR.dim; ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 航線圖(灰=已用掉的機票,珊瑚=剛走過)', PAD, 26);

    const nodeR = 26;
    // edges
    for (const e of EDGES){
      const a=NODES[e.u], b=NODES[e.v];
      let col=COLOR.live, wid=2.5;
      if (s.active===e.id){ col=COLOR.active; wid=5; }
      else if (s.used.includes(e.id)){ col=COLOR.used; wid=2; }
      // perpendicular offset so anti-parallel edges (JFK⇄NRT) don't overlap
      const dx=b.x-a.x, dy=b.y-a.y, L=Math.hypot(dx,dy);
      const ox=-dy/L*(e.off||0), oy=dx/L*(e.off||0);
      arrow(a.x+ox, a.y+oy, b.x+ox, b.y+oy, nodeR, nodeR, col, wid);
    }
    // nodes
    for (const k of Object.keys(NODES)){
      const nd=NODES[k];
      const isCur = s.cur===k && !s.rev;
      const isPush = s.pushed===k;
      ctx.beginPath(); ctx.arc(nd.x, nd.y, nodeR, 0, Math.PI*2);
      ctx.fillStyle = isPush?COLOR.push : isCur?COLOR.cur : COLOR.node; ctx.fill();
      ctx.lineWidth = (isCur||isPush)?3:2;
      ctx.strokeStyle = isPush?COLOR.pushS : isCur?COLOR.curS : COLOR.nodeS; ctx.stroke();
      ctx.fillStyle=COLOR.ink; ctx.font='700 15px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(k, nd.x, nd.y);
      if (isPush){
        ctx.fillStyle=COLOR.pushS; ctx.font='700 10px "JetBrains Mono", monospace';
        ctx.textBaseline='top'; ctx.fillText('push!', nd.x, nd.y+nodeR+4);
      } else if (isCur){
        ctx.fillStyle=COLOR.coral; ctx.font='700 10px "JetBrains Mono", monospace';
        ctx.textBaseline='top'; ctx.fillText('here', nd.x, nd.y+nodeR+4);
      }
    }

    // ───────── BAND 2 · recursion stack ─────────
    ctx.fillStyle = COLOR.dim; ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 遞迴堆疊(目前的 DFS 路徑)', PAD, 244);
    const sx=PAD, sy=262, cw=76, ch=36, gap=10;
    if (s.stack.length===0){
      ctx.fillStyle=COLOR.dim; ctx.font='500 13px "Noto Sans TC", sans-serif';
      ctx.textAlign='left'; ctx.textBaseline='middle';
      ctx.fillText(s.rev?'堆疊清空 → 開始 reverse':'堆疊清空', sx+4, sy+ch/2);
    }
    for (let i=0;i<s.stack.length;i++){
      const x=sx+i*(cw+gap+16);
      rr(x,sy,cw,ch,4);
      const top = i===s.stack.length-1;
      ctx.fillStyle=top?COLOR.cur:COLOR.stackBg; ctx.fill();
      ctx.lineWidth=top?2.5:1.5; ctx.strokeStyle=top?COLOR.curS:COLOR.stackS; ctx.stroke();
      ctx.fillStyle=COLOR.ink; ctx.font='700 14px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(s.stack[i], x+cw/2, sy+ch/2);
      if (i<s.stack.length-1){
        ctx.fillStyle=COLOR.dim; ctx.font='700 14px "JetBrains Mono", monospace';
        ctx.textAlign='center'; ctx.fillText('→', x+cw+gap+8, sy+ch/2);
      }
    }

    // ───────── BAND 3 · routes + answer ─────────
    ctx.fillStyle = COLOR.coral; ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · routes[](死路先 push,後序)', PAD, 328);
    const rx=PAD, ry=346, rw=76, rh=40, rgap=10;
    for (let i=0;i<s.routes.length;i++){
      const x=rx+i*(rw+rgap);
      rr(x,ry,rw,rh,5);
      const justPushed = s.pushed && i===s.routes.length-1;
      ctx.fillStyle=COLOR.push; ctx.fill();
      ctx.lineWidth=justPushed?2.5:1.5; ctx.strokeStyle=justPushed?COLOR.pushS:COLOR.grid; ctx.stroke();
      ctx.fillStyle=COLOR.ink; ctx.font='700 14px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(s.routes[i], x+rw/2, ry+rh/2);
    }
    if (s.routes.length===0){
      ctx.fillStyle=COLOR.dim; ctx.font='500 13px "Noto Sans TC", sans-serif';
      ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText('(還沒有節點被 push)', rx+4, ry+rh/2);
    }

    // reversed answer banner
    if (s.rev){
      const by=ry+rh+22;
      rr(PAD,by,w-PAD*2,44,6); ctx.fillStyle=COLOR.push; ctx.fill();
      ctx.strokeStyle=COLOR.pushS; ctx.lineWidth=1.8; ctx.stroke();
      ctx.fillStyle='#2f6a3a'; ctx.font='700 13px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('reverse → [ ' + s.answer.join('  ,  ') + ' ]', w/2, by+22);
    }
  }

  function update() {
    const s = steps[step];
    if (stepEl) stepEl.textContent = String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0');
    if (labelEl) labelEl.innerHTML = s.text;
    draw();
  }
  function next(){ if(step<steps.length-1){ step++; update(); } else stop(); }
  function prev(){ if(step>0){ step--; update(); } }
  function reset(){ stop(); step=0; update(); }
  function play(){ if(timer){ stop(); return; } btnPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){ stop(); return; } next(); },1500); }
  function stop(){ if(timer){ clearInterval(timer); timer=null; } if(btnPlay) btnPlay.textContent='Play'; }

  btnPrev  && btnPrev .addEventListener('click', prev);
  btnNext  && btnNext .addEventListener('click', next);
  btnPlay  && btnPlay .addEventListener('click', play);
  btnReset && btnReset.addEventListener('click', reset);

  window.addEventListener('resize', ()=>{ fitCanvas(); draw(); });
  if (window.ResizeObserver){ const ro=new ResizeObserver(()=>{ fitCanvas(); draw(); }); ro.observe(canvas); }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
  fitCanvas(); update();
})();
