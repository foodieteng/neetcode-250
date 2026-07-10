/* ============================================================
   P463 · Island Perimeter — DFS flood
   從第一個陸地格開始 DFS。每踩進「水」或「出界」就 +1(那是一段
   周長邊界);踩到陸地就繼續 flood、把它標記為已訪。每個陸地格只
   數一次,它朝向水/出界的邊就是它對周長的貢獻。
   grid = plus shape  →  perimeter 12
     BAND 1  3×3 網格 + 逐步累積的周長外框(珊瑚)
     BAND 2  當前格四方向 · 陸地 / 水 / 出界
     BAND 3  周長累計
   ============================================================ */
(function () {
  const canvas = document.getElementById('viz-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('viz-step'), labelEl = document.getElementById('viz-label');
  const bPrev = document.getElementById('viz-prev'), bNext = document.getElementById('viz-next'),
        bPlay = document.getElementById('viz-play'), bReset = document.getElementById('viz-reset');

  const COLOR = { paper:'#ffffff', ink:'#1a1a1a', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf',
    water:'#e3edf5', waterS:'#a9c4da', land:'#ffffff', landS:'#c9c9c1',
    seen:'#eef4dc', seenS:'#a9c07a', curFill:'#fbe7df', curS:'#d96e4e',
    perim:'#d96e4e', perimSoft:'#eab6a4', coral:'#d96e4e' };

  const N = 3;
  // 1 = land, 0 = water
  const G = [[0,1,0],[1,1,1],[0,1,0]];
  const isLand = (r,c) => r>=0 && r<N && c>=0 && c<N && G[r][c]===1;
  // DFS first-visit order from (0,1)
  const ORDER = [[0,1],[1,1],[2,1],[1,0],[1,2]];
  const DIRS = [[-1,0],[1,0],[0,-1],[0,1]]; // up down left right
  const DNAME = ['↑ 上','↓ 下','← 左','→ 右'];

  // boundary sides + contribution per land cell
  function sides(r,c){ return DIRS.map(([dr,dc]) => isLand(r+dr,c+dc) ? 'land' : (r+dr<0||r+dr>=N||c+dc<0||c+dc>=N ? 'oob' : 'water')); }
  function contrib(r,c){ return sides(r,c).filter(s=>s!=='land').length; }

  const steps = [{ vis:[], cur:null, perim:0,
    text:'<strong>INITIAL</strong> · <code>1</code>=陸地、<code>0</code>=水。DFS 從第一個陸地格開始;每<strong>踩出界或踩到水就 +1</strong>(那是一段周長)。' }];
  let acc = 0;
  for (const [r,c] of ORDER){ acc += contrib(r,c);
    const vis = steps[steps.length-1].vis.concat([[r,c]]);
    const k = contrib(r,c);
    steps.push({ vis, cur:[r,c], perim:acc,
      text:`訪問 <code>(${r},${c})</code>,標記已訪。四個方向裡有 <strong>${k}</strong> 個是水/出界 → 周長 <strong>+${k}</strong>(累計 ${acc})。${k===0?'此格四周全是陸地,完全不貢獻周長。':''}` });
  }
  steps.push({ vis:ORDER.slice(), cur:null, perim:acc, done:true,
    text:`所有陸地格都訪問完畢。島的外框就是累積的珊瑚邊界 → <strong>周長 = ${acc}</strong>。` });

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||500; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }

  function drawSides(x,y,cell,sd,bright){
    ctx.strokeStyle = bright?COLOR.perim:COLOR.perimSoft; ctx.lineWidth = bright?6:5; ctx.lineCap='round';
    const seg=[[x,y,x+cell,y],[x,y+cell,x+cell,y+cell],[x,y,x,y+cell],[x+cell,y,x+cell,y+cell]];
    for(let d=0;d<4;d++) if(sd[d]!=='land'){ ctx.beginPath(); ctx.moveTo(seg[d][0]+2,seg[d][1]+2); ctx.lineTo(seg[d][2]-2,seg[d][3]-2); ctx.stroke(); }
    ctx.lineCap='butt';
  }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,h=canvas.clientHeight,PAD=26;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,h);

    // ── BAND 1
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 網格 + 累積周長外框(珊瑚 = 朝向水/出界的邊)', PAD, 24);
    const cell=96, gw=N*cell, gx=(w-gw)/2, gy=48;
    const curKey = s.cur ? s.cur[0]+','+s.cur[1] : null;
    const visSet = new Set(s.vis.map(v=>v[0]+','+v[1]));
    // cells
    for(let r=0;r<N;r++) for(let c=0;c<N;c++){ const x=gx+c*cell, y=gy+r*cell, land=G[r][c]===1, key=r+','+c;
      let fill=COLOR.water, st=COLOR.waterS;
      if(land){ fill=COLOR.land; st=COLOR.landS;
        if(key===curKey){ fill=COLOR.curFill; st=COLOR.curS; }
        else if(visSet.has(key)){ fill=COLOR.seen; st=COLOR.seenS; } }
      ctx.fillStyle=fill; ctx.fillRect(x+2,y+2,cell-4,cell-4);
      ctx.lineWidth=1.6; ctx.strokeStyle=st; ctx.strokeRect(x+2,y+2,cell-4,cell-4);
      ctx.fillStyle=land?COLOR.ink:COLOR.waterS; ctx.font='700 26px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(land?'1':'0', x+cell/2, y+cell/2+1);
      if(land && (visSet.has(key)) && key!==curKey){ ctx.fillStyle=COLOR.seenS; ctx.font='700 11px "JetBrains Mono", monospace'; ctx.textBaseline='top'; ctx.fillText('✓', x+cell-13, y+7); }
    }
    // perimeter edges: soft for visited, bright for current
    for(const [r,c] of s.vis){ if(s.cur && r===s.cur[0] && c===s.cur[1]) continue; drawSides(gx+c*cell,gy+r*cell,cell,sides(r,c),false); }
    if(s.cur){ const [r,c]=s.cur; drawSides(gx+c*cell,gy+r*cell,cell,sides(r,c),true); }

    // ── BAND 2 · current cell 4 directions
    let by=gy+gw+28;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 當前格四方向(水 / 出界 = 周長邊,陸地 = 繼續 flood)', PAD, by);
    const cy=by+12;
    if(s.cur){ const sd=sides(s.cur[0],s.cur[1]); const cw=Math.min(150,(w-PAD*2-30)/4), gap=10;
      for(let d=0;d<4;d++){ const x=PAD+d*(cw+gap); const bnd=sd[d]!=='land';
        ctx.fillStyle=bnd?'#fbe7df':COLOR.seen; ctx.fillRect(x,cy,cw,40); ctx.lineWidth=1.6; ctx.strokeStyle=bnd?COLOR.curS:COLOR.seenS; ctx.strokeRect(x,cy,cw,40);
        ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillStyle=COLOR.ink; ctx.font='700 14px "JetBrains Mono", monospace';
        ctx.fillText(DNAME[d], x+cw/2, cy+15);
        ctx.font='600 10px "Noto Sans TC", sans-serif'; ctx.fillStyle=bnd?COLOR.curS:COLOR.seenS;
        ctx.fillText(sd[d]==='oob'?'出界 · +1':(sd[d]==='water'?'水 · +1':'陸地 · flood'), x+cw/2, cy+30); }
    } else {
      ctx.fillStyle=s.done?COLOR.seen:'#fafaf6'; ctx.fillRect(PAD,cy,w-PAD*2,40); ctx.lineWidth=1.6; ctx.strokeStyle=s.done?COLOR.seenS:COLOR.grid; ctx.strokeRect(PAD,cy,w-PAD*2,40);
      ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillStyle=s.done?'#5b7a2e':COLOR.dim; ctx.font='700 14px "JetBrains Mono", monospace';
      ctx.fillText(s.done?'DFS 完成 · 島的外框已描完':'點 Next / Play 開始 DFS', w/2, cy+21); }

    // ── BAND 3 · perimeter total
    const ty=cy+66;
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 周長累計', PAD, ty);
    const box=ty+12; const done=!!s.done;
    ctx.fillStyle=done?COLOR.seen:'#fafaf6'; ctx.fillRect(PAD,box,w-PAD*2,40); ctx.lineWidth=1.6; ctx.strokeStyle=done?COLOR.seenS:COLOR.grid; ctx.strokeRect(PAD,box,w-PAD*2,40);
    ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillStyle=COLOR.ink; ctx.font='700 14px "JetBrains Mono", monospace';
    ctx.fillText('已訪陸地  '+s.vis.length+' / 5', PAD+16, box+20);
    ctx.textAlign='right'; ctx.fillStyle=done?'#5b7a2e':COLOR.coral;
    ctx.fillText((done?'perimeter  ':'res  ')+s.perim, w-PAD-16, box+20);
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
