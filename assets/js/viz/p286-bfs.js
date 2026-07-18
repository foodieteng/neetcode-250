/* ============================================================
   P286 · Walls and Gates — 多源 BFS(逐步播放)
   把「所有門(0)」一起丟進佇列當起點,再一層一層往外擴散;每個還是
   INF 的空房被某一波碰到時,填上「當前距離+1」。因為所有門同時擴散,
   最先碰到某房間的那一波,就是離它「最近」的門 → 最短距離。
   grid = LeetCode 範例  →  各房間填上到最近門的距離
     BAND 1  網格(門=紅0 · 牆=深灰 · 空房=∞ · 已填=綠+距離)
     BAND 2  目前第幾波 · 本波填了哪些
     BAND 3  說明(最先到達 = 最近的門)
   ============================================================ */
(function () {
  const canvas = document.getElementById('viz-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('viz-step'), labelEl = document.getElementById('viz-label');
  const bPrev = document.getElementById('viz-prev'), bNext = document.getElementById('viz-next'),
        bPlay = document.getElementById('viz-play'), bReset = document.getElementById('viz-reset');

  const COLOR = { paper:'#ffffff', ink:'#1a1a1a', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf',
    room:'#ffffff', roomS:'#d0d0c8', wall:'#3a3a3a', wallS:'#2a2a2a',
    gate:'#cf3535', gateS:'#b8532f', fill:'#d9e8c7', fillS:'#a9c07a', cur:'#fbe1e1', curS:'#cf3535', coral:'#cf3535' };

  const R = 4, C = 4;
  const WALL = new Set(['0,1','1,3','2,1','2,3','3,1']);
  const GATE = new Set(['0,2','3,0']);
  // BFS waves (distance): each wave = list of [r,c,val]
  const WAVES = [
    [[1,2,1],[0,3,1],[2,0,1]],
    [[2,2,2],[1,1,2],[1,0,2]],
    [[3,2,3],[0,0,3]],
    [[3,3,4]],
  ];
  const steps = [
    { wave:0, text:'<strong>INITIAL</strong> · <code>-1</code>=牆、<code>0</code>=門、<code>∞</code>=空房。<strong>把所有門一起入隊</strong>當起點,再一層一層往外擴散(多源 BFS)。' },
    { wave:1, text:'<strong>第 1 波</strong>:從所有門同時往鄰居擴,把碰到的空房填 <code>1</code>(離門一步)。' },
    { wave:2, text:'<strong>第 2 波</strong>:從距離 1 的房間再往外,空房填 <code>2</code>。' },
    { wave:3, text:'<strong>第 3 波</strong>:繼續往外,空房填 <code>3</code>。' },
    { wave:4, text:'<strong>第 4 波</strong>:最後一格 <code>(3,3)</code> 填 <code>4</code>。' },
    { wave:5, done:true, text:'佇列空 → 完成。每個空房都填上到<strong>最近門</strong>的距離;沒被碰到的仍是 <code>∞</code>(到不了門)。' },
  ];

  // value grid at a given step (accumulate waves)
  function gridAt(wave){
    const g = {};
    for(let r=0;r<R;r++) for(let c=0;c<C;c++){ const k=r+','+c;
      g[k] = WALL.has(k) ? 'W' : (GATE.has(k) ? 0 : null); }
    for(let w=0; w<Math.min(wave,WAVES.length); w++) for(const [r,c,v] of WAVES[w]) g[r+','+c]=v;
    return g;
  }
  function curCells(wave){ return (wave>=1 && wave<=WAVES.length) ? WAVES[wave-1].map(([r,c])=>r+','+c) : []; }

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||480; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,h=canvas.clientHeight,PAD=26;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,h);
    const g=gridAt(s.wave), cur=new Set(curCells(s.wave));

    // ── BAND 1 · grid
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 網格(門=0紅 · 牆=深灰 · 空房=∞ · 已填=距離)', PAD, 24);
    const cell=68, gw=C*cell, gx=(w-gw)/2, gy=42;
    for(let r=0;r<R;r++) for(let c=0;c<C;c++){ const x=gx+c*cell, y=gy+r*cell, key=r+','+c; const v=g[key];
      let fill, st, label, lcolor=COLOR.ink;
      if(v==='W'){ fill=COLOR.wall; st=COLOR.wallS; label='−1'; lcolor='#cfcfcf'; }
      else if(v===0){ fill=COLOR.gate; st=COLOR.gateS; label='0'; lcolor='#fff'; }
      else if(v===null){ fill=COLOR.room; st=COLOR.roomS; label='∞'; lcolor=COLOR.dim; }
      else { fill=COLOR.fill; st=COLOR.fillS; label=String(v); }
      rr(x+3,y+3,cell-6,cell-6,6); ctx.fillStyle=fill; ctx.fill();
      const isCur=cur.has(key);
      ctx.lineWidth=isCur?3.5:1.6; ctx.strokeStyle=isCur?COLOR.curS:st; ctx.stroke();
      ctx.fillStyle=isCur?COLOR.coral:lcolor; ctx.font='700 24px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(label, x+cell/2, y+cell/2+1);
    }

    // ── BAND 2 · wave info
    let by=gy+R*cell+26;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · BFS 波次(每一波 = 距離門更遠一步)', PAD, by);
    const cy=by+12, done=!!s.done;
    rr(PAD,cy,w-PAD*2,40,6); ctx.fillStyle=done?COLOR.fill:(s.wave>=1?'#fbe1e1':'#fafaf6'); ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?COLOR.fillS:(s.wave>=1?COLOR.curS:COLOR.grid); ctx.stroke();
    ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillStyle=COLOR.ink; ctx.font='700 14px "JetBrains Mono", monospace';
    ctx.fillText(done?'完成':(s.wave===0?'起點:所有門(0)入隊':('第 '+s.wave+' 波 · 距離 = '+s.wave)), PAD+16, cy+20);
    ctx.textAlign='right'; ctx.fillStyle=s.wave>=1&&!done?COLOR.coral:COLOR.dim; ctx.font='600 13px "Noto Sans TC", sans-serif';
    ctx.fillText(done?'所有可達空房都填好了':(s.wave>=1?('本波填 '+curCells(s.wave).length+' 格'):'點 Next / Play 開始擴散'), w-PAD-16, cy+20);

    // ── BAND 3 · note
    const ty=cy+62;
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 為什麼是「最近」的門', PAD, ty);
    const box=ty+12; rr(PAD,box,w-PAD*2,40,6); ctx.fillStyle=done?COLOR.fill:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?COLOR.fillS:COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(done){ ctx.fillStyle='#3f7a3a'; ctx.font='700 13.5px "JetBrains Mono", monospace'; ctx.fillText('所有門一起擴散 → 最先到達 = 最近門 → 自動最短距離', w/2, box+20); }
    else { ctx.fillStyle=COLOR.text; ctx.font='600 12.5px "Noto Sans TC", sans-serif'; ctx.fillText('每格只在「第一次被碰到」時填值(!= INF 就跳過)→ 不會被更遠的門覆蓋', w/2, box+20); }
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
