/* ============================================================
   P323 · Number of Connected Components — Union-Find(逐步)· vb
   逐條邊 union;跑完後「還是根(parent[i] < 0)的數量」= 連通塊數。
   也可理解成:初始 n 塊,每次成功合併就少一塊。
   例 n=5, edges=[[0,1],[1,2],[3,4]] → 剩 2 個根 = 2 塊
     BAND 1  並查集森林(綠/藍=同一組 · 珊瑚=根)
     BAND 2  parent[](負值=根)· 根數 = cnt
     BAND 3  說明
   ============================================================ */
(function () {
  const canvas = document.getElementById('vb-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('vb-step'), labelEl = document.getElementById('vb-label');
  const bPrev = document.getElementById('vb-prev'), bNext = document.getElementById('vb-next'),
        bPlay = document.getElementById('vb-play'), bReset = document.getElementById('vb-reset');

  const COLOR = { paper:'#ffffff', ink:'#1a1a1a', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf',
    node:'#f3f3ef', nodeS:'#c9c9c1', edge:'#8fae6e', coral:'#d96e4e', root:'#fbe7df', rootS:'#d96e4e' };
  const CC = { 0:{f:'#d9e8c7',s:'#5fa866',t:'#3f7a3a'}, 3:{f:'#dbe8f6',s:'#4478c0',t:'#2f5f9e'} };

  // links = child->parent drawn; each step's parent[] array
  const steps = [
    { parent:[-1,-1,-1,-1,-1], links:[], u:null,
      text:'<strong>INITIAL</strong> · 5 個各自獨立(<code>parent</code> 全 <code>-1</code> = 各為根)。初始 5 塊,每成功合併一次就少一塊。' },
    { parent:[-2,0,-1,-1,-1], links:[[1,0]], u:[0,1],
      text:'<code>union(0,1)</code>:合併。<code>1</code> 掛到 <code>0</code>,<code>parent=[-2,0,-1,-1,-1]</code>。' },
    { parent:[-3,0,0,-1,-1], links:[[1,0],[2,0]], u:[1,2],
      text:'<code>union(1,2)</code>:<code>find(1)=0</code>,<code>2</code> 掛到 <code>0</code>,<code>parent[0]=-3</code>(size 3)。' },
    { parent:[-3,0,0,-2,3], links:[[1,0],[2,0],[4,3]], u:[3,4],
      text:'<code>union(3,4)</code>:另一組,<code>4</code> 掛到 <code>3</code>,<code>parent[3]=-2</code>。' },
    { parent:[-3,0,0,-2,3], links:[[1,0],[2,0],[4,3]], u:null, done:true,
      text:'掃 <code>parent</code>:<code>&lt; 0</code> 的有 <code>0</code>、<code>3</code> 兩個根 → <strong>cnt = 2</strong> 個連通塊。' },
  ];

  const POS = {};
  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||420; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function arrow(ax,ay,bx,by,color,wdt){ const dx=bx-ax,dy=by-ay,L=Math.hypot(dx,dy),ux=dx/L,uy=dy/L,R=23;
    const sx=ax+ux*R,sy=ay+uy*R,ex=bx-ux*R,ey=by-uy*R; ctx.strokeStyle=color; ctx.lineWidth=wdt||2.4;
    ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(ex,ey); ctx.stroke();
    const a=Math.atan2(uy,ux),h=10; ctx.fillStyle=color; ctx.beginPath(); ctx.moveTo(ex,ey);
    ctx.lineTo(ex-h*Math.cos(a-0.4),ey-h*Math.sin(a-0.4)); ctx.lineTo(ex-h*Math.cos(a+0.4),ey-h*Math.sin(a+0.4)); ctx.closePath(); ctx.fill(); }
  function rootOf(parent,x){ while(parent[x]>=0) x=parent[x]; return x; }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,h=canvas.clientHeight,PAD=26; const cx=w/2;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,h);
    POS[0]=[cx-150,110]; POS[1]=[cx-215,205]; POS[2]=[cx-85,205]; POS[3]=[cx+120,110]; POS[4]=[cx+120,215];
    const single=(step===0);

    // ── BAND 1 · DSU forest
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 並查集森林(綠/藍=同一組 · 箭頭=指向父 · 珊瑚圈=根)', PAD, 22);
    for(const [c,p] of s.links) arrow(POS[c][0],POS[c][1],POS[p][0],POS[p][1],COLOR.edge,2.6);
    for(const id of [0,1,2,3,4]){ const [x,y]=POS[id]; const isU=s.u&&s.u.includes(id); const isRoot=(s.parent[id]<0);
      const r= single?null: rootOf(s.parent,id); const pal=(r!=null&&CC[r])?CC[r]:null;
      ctx.beginPath(); ctx.arc(x,y,23,0,Math.PI*2);
      ctx.fillStyle=single?COLOR.node:(pal?pal.f:COLOR.node); ctx.fill();
      ctx.lineWidth=isU?3.6:(isRoot&&!single?3:2.2); ctx.strokeStyle=isU?COLOR.coral:(isRoot&&!single?COLOR.rootS:(pal?pal.s:COLOR.nodeS)); ctx.stroke();
      ctx.fillStyle=single?COLOR.ink:(pal?pal.t:COLOR.ink); ctx.font='700 17px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(String(id),x,y+1);
      if(isRoot&&!single){ ctx.fillStyle=COLOR.rootS; ctx.font='700 10px "JetBrains Mono", monospace'; ctx.fillText('root', x, y-32); }
    }

    // ── BAND 2 · parent[] + cnt
    let by=272;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · parent[](負值=根)· 根的數量 = 連通塊數', PAD, by);
    const cell=44, gx=PAD+58, cy=by+14;
    ctx.fillStyle=COLOR.dim; ctx.font='700 11px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText('idx', PAD, cy);
    for(let j=0;j<5;j++){ ctx.fillStyle=COLOR.dim; ctx.font='700 11px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.fillText(String(j), gx+j*cell+cell/2-2, cy); }
    ctx.fillStyle=COLOR.text; ctx.font='700 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText('parent', PAD, cy+16);
    for(let j=0;j<5;j++){ const x=gx+j*cell; const val=s.parent[j]; const isRoot=val<0;
      rr(x+3,cy+2,cell-8,28,5); ctx.fillStyle=isRoot?'#fbe7df':'#eef4fa'; ctx.fill(); ctx.lineWidth=1.4; ctx.strokeStyle=isRoot?COLOR.rootS:'#a9c4da'; ctx.stroke();
      ctx.fillStyle=COLOR.ink; ctx.font='700 14px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(String(val), x+cell/2-1, cy+16); }
    const cnt=s.parent.filter(v=>v<0).length;
    ctx.fillStyle=COLOR.text; ctx.font='700 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText('cnt =', gx+5*cell+16, cy+16);
    ctx.fillStyle=s.done?CC[0].t:COLOR.text; ctx.font='700 20px "JetBrains Mono", monospace'; ctx.fillText(String(cnt), gx+5*cell+66, cy+16);

    // ── BAND 3 · note
    const ty=cy+58, done=!!s.done;
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 為什麼「根的數量」= 連通塊數', PAD, ty);
    const box=ty+12; rr(PAD,box,w-PAD*2,40,6); ctx.fillStyle=done?CC[0].f:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?CC[0].s:COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(done){ ctx.fillStyle=CC[0].t; ctx.font='700 13px "JetBrains Mono", monospace'; ctx.fillText('return 2 · 兩個根 = 兩塊', w/2, box+20); }
    else { ctx.fillStyle=COLOR.text; ctx.font='600 12px "Noto Sans TC", sans-serif'; ctx.fillText('每塊剛好一個根;初始 n 塊,每成功合併一次少一塊 → cnt = n − 合併次數', w/2, box+20); }
  }

  function update(){ const s=steps[step]; if(stepEl) stepEl.textContent=String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0'); if(labelEl) labelEl.innerHTML=s.text; draw(); }
  function next(){ if(step<steps.length-1){step++;update();}else stop(); }
  function prev(){ if(step>0){step--;update();} }
  function reset(){ stop(); step=0; update(); }
  function play(){ if(timer){stop();return;} bPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){stop();return;} next(); },1700); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} if(bPlay) bPlay.textContent='Play'; }
  bPrev&&bPrev.addEventListener('click',prev); bNext&&bNext.addEventListener('click',next); bPlay&&bPlay.addEventListener('click',play); bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();}); if(window.ResizeObserver){ new ResizeObserver(()=>{fit();draw();}).observe(canvas); }
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw); fit(); update();
})();
