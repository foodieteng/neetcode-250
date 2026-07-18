/* ============================================================
   P1192 · Critical Connections — Tarjan 求橋(逐步播放)· viz
   無向圖。dfn[u]=發現時間;low[u]=不經過「通往父親的那條邊」能到達的最小
   dfn。走樹邊回來後 low[u]=min(low[u],low[v]);見到已訪節點(回邊)
   low[u]=min(low[u],dfn[v])。判定:low[v] > dfn[u] ⟹ 邊 (u,v) 是橋
   (v 的子樹完全逃不出 v,唯一出口就是這條邊)。
   例 4 點:三角 0-1-2 + 1-3。唯一橋 = (1,3)
     BAND 1  無向圖(紅=現在的 u · 藍=回邊 · 深紅=橋)
     BAND 2  dfn / low 表
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
    node:'#ffffff', nodeS:'#c9c9c1', cur:'#fbe1e1', curS:'#cf3535', seen:'#eef4fa', seenS:'#a9c4da',
    edge:'#c2ccd6', coral:'#cf3535', back:'#4478c0', bad:'#a31d1d', on:'#d9e8c7', onS:'#5fa866' };

  const E = [[0,1],[1,2],[2,0],[1,3]];
  const NIL = -1;
  const steps = [
    { cur:NIL, dfn:[NIL,NIL,NIL,NIL], low:[NIL,NIL,NIL,NIL], bridges:[], back:null,
      text:'<strong>INITIAL</strong> · 求<strong>橋</strong>(刪掉會斷連的邊)。<code>dfn</code>=發現時間,<code>low</code>=不走父邊能回到的最小 dfn。判定:<code>low[v] &gt; dfn[u]</code> ⟹ <code>(u,v)</code> 是橋。' },
    { cur:0, dfn:[0,NIL,NIL,NIL], low:[0,NIL,NIL,NIL], bridges:[], back:null,
      text:'<code>dfs(0)</code>:<code>dfn[0]=low[0]=0</code>。往鄰居 <code>1</code> 走(樹邊)。' },
    { cur:1, dfn:[0,1,NIL,NIL], low:[0,1,NIL,NIL], bridges:[], back:null,
      text:'<code>dfs(1)</code>:<code>dfn[1]=low[1]=1</code>。往鄰居 <code>2</code> 走(樹邊)。' },
    { cur:2, dfn:[0,1,2,NIL], low:[0,1,2,NIL], bridges:[], back:null,
      text:'<code>dfs(2)</code>:<code>dfn[2]=low[2]=2</code>。<code>2</code> 的鄰居 <code>0</code> 已訪 → <strong>回邊</strong>。' },
    { cur:2, dfn:[0,1,2,NIL], low:[0,1,0,NIL], bridges:[], back:[2,0],
      text:'回邊 <code>2→0</code>:<code>low[2]=min(2, dfn[0]=0)=0</code>。回到 <code>1</code> 後 <code>low[1]=min(1,0)=0</code>。判 <code>(1,2)</code>:<code>low[2]=0 &gt; dfn[1]=1</code>?<strong>否 → 非橋</strong>(2 繞得回 0)。' },
    { cur:3, dfn:[0,1,2,3], low:[0,0,0,3], bridges:[], back:null,
      text:'回到 <code>1</code> 走另一支 <code>dfs(3)</code>:<code>dfn[3]=low[3]=3</code>。<code>3</code> 沒有其他鄰居,回退。' },
    { cur:1, dfn:[0,1,2,3], low:[0,0,0,3], bridges:[[1,3]], back:null,
      text:'判 <code>(1,3)</code>:<code>low[3]=3 &gt; dfn[1]=1</code>?<strong>是 → 橋!</strong> <code>3</code> 的子樹逃不出 <code>3</code>,唯一出口就是這條邊。' },
    { cur:0, dfn:[0,1,2,3], low:[0,0,0,3], bridges:[[1,3]], back:null, done:true,
      text:'回到 <code>0</code>,其餘邊都繞得回去。完成 → 唯一的橋是 <code>(1,3)</code>。' },
  ];

  const POS = {};
  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||480; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function edgeKey(a,b){ return a<b?a+'-'+b:b+'-'+a; }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,h=canvas.clientHeight,PAD=26;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,h);
    const cx=w/2; POS[0]=[cx-104,74]; POS[1]=[cx+6,154]; POS[2]=[cx-104,236]; POS[3]=[cx+140,154];
    const bridgeSet=new Set(s.bridges.map(e=>edgeKey(e[0],e[1])));
    const backKey = s.back?edgeKey(s.back[0],s.back[1]):null;

    // ── BAND 1 · graph
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 無向圖(紅=現在的 u · 藍虛線=回邊 · 深紅=橋)', PAD, 22);
    for(const [a,b] of E){ const k=edgeKey(a,b); const isBridge=bridgeSet.has(k); const isBack=(k===backKey);
      ctx.beginPath(); ctx.moveTo(POS[a][0],POS[a][1]); ctx.lineTo(POS[b][0],POS[b][1]);
      if(isBridge){ ctx.strokeStyle=COLOR.bad; ctx.lineWidth=4; ctx.setLineDash([]); }
      else if(isBack){ ctx.strokeStyle=COLOR.back; ctx.lineWidth=2.6; ctx.setLineDash([6,5]); }
      else { ctx.strokeStyle=COLOR.edge; ctx.lineWidth=2.4; ctx.setLineDash([]); }
      ctx.stroke(); ctx.setLineDash([]);
      if(isBridge){ const mx=(POS[a][0]+POS[b][0])/2, my=(POS[a][1]+POS[b][1])/2;
        ctx.fillStyle=COLOR.bad; ctx.font='700 11px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('BRIDGE', mx, my-14); }
    }
    for(const id of [0,1,2,3]){ const [x,y]=POS[id]; const cur=(id===s.cur); const seen=s.dfn[id]!==NIL&&!cur;
      ctx.beginPath(); ctx.arc(x,y,24,0,Math.PI*2);
      ctx.fillStyle=cur?COLOR.cur:(seen?COLOR.seen:COLOR.node); ctx.fill();
      ctx.lineWidth=cur?3.4:2.2; ctx.strokeStyle=cur?COLOR.curS:(seen?COLOR.seenS:COLOR.nodeS); ctx.stroke();
      ctx.fillStyle=COLOR.ink; ctx.font='700 18px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(String(id),x,y+1);
    }

    // ── BAND 2 · dfn / low table
    let by=290;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · dfn(發現時間)· low(能回到的最小 dfn)', PAD, by);
    const cell=42, gx=PAD+64, gyy=by+18;
    const rows=[['node',null],['dfn',s.dfn],['low',s.low]];
    for(let r=0;r<3;r++){ const y=gyy+r*32;
      ctx.fillStyle=COLOR.text; ctx.font='700 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText(rows[r][0], PAD, y+15);
      for(let j=0;j<4;j++){ const x=gx+j*cell;
        if(r===0){ ctx.fillStyle=COLOR.text; ctx.font='700 14px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(String(j), x+cell/2, y+15); }
        else { const val=rows[r][1][j]; rr(x+3,y+2,cell-8,28,5);
          ctx.fillStyle=val===NIL?'#f3f3ef':(r===1?'#eef4fa':'#e8f2dc'); ctx.fill(); ctx.lineWidth=1.4; ctx.strokeStyle=val===NIL?COLOR.grid:(r===1?COLOR.seenS:COLOR.onS); ctx.stroke();
          ctx.fillStyle=val===NIL?COLOR.grid:COLOR.ink; ctx.font='700 14px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(val===NIL?'·':String(val), x+cell/2-1, y+15); }
      }
    }

    // ── BAND 3 · note
    const ty=gyy+3*32+16, done=!!s.done;
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 橋的判定式', PAD, ty);
    const box=ty+12; rr(PAD,box,w-PAD*2,40,6); ctx.fillStyle=done?COLOR.on:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?COLOR.onS:COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(done){ ctx.fillStyle='#3f7a3a'; ctx.font='700 13px "JetBrains Mono", monospace'; ctx.fillText('唯一的橋 = (1,3) · low[3]=3 > dfn[1]=1', w/2, box+20); }
    else { ctx.fillStyle=COLOR.text; ctx.font='600 12px "Noto Sans TC", sans-serif'; ctx.fillText('low[v] > dfn[u]:v 這一團繞不回 u 或更早的點 → 邊 (u,v) 是唯一出口 = 橋', w/2, box+20); }
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
