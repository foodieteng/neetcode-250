/* ============================================================
   P200 · Number of Islands — DFS flood fill(逐步播放)
   逐格掃描;每碰到一個還沒訪過的 '1',島數 +1,然後 DFS 把整座
   相連的島「沉掉」(標成 '0')。啟動 DFS 的次數 = 島的數量。
   grid(3×4)有 3 座島  →  3
     BAND 1  網格 · 逐座島被發現(不同色)+ 掃描指標
     BAND 2  目前島數 count
     BAND 3  結果
   ============================================================ */
(function () {
  const canvas = document.getElementById('viz-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('viz-step'), labelEl = document.getElementById('viz-label');
  const bPrev = document.getElementById('viz-prev'), bNext = document.getElementById('viz-next'),
        bPlay = document.getElementById('viz-play'), bReset = document.getElementById('viz-reset');

  const COLOR = { paper:'#ffffff', ink:'#1a1a1a', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf',
    water:'#eef0ee', waterS:'#cfcfcf', land:'#ffffff', landS:'#b9b9b1', coral:'#cf3535' };
  // 每座島一種色(藍 / 棕 / 綠)
  const ISLC = { 1:['#e3edf5','#6f9fc4'], 2:['#f6ead8','#d4a868'], 3:['#d9e8c7','#5fa866'] };

  const R = 3, C = 4;
  const G = [[1,1,0,1],[0,0,0,1],[1,0,0,0]];
  const ISL = { '0,0':1,'0,1':1, '0,3':2,'1,3':2, '2,0':3 };  // 每個陸地格屬於哪座島

  const steps = [
    { rev:0, found:0, scan:null,
      text:'<strong>INITIAL</strong> · <code>1</code>=陸地、<code>0</code>=水。逐格掃描,碰到還沒沉掉的 <code>1</code> 就:<strong>島數 +1</strong> 並 DFS 沉掉整座島。' },
    { rev:1, found:1, scan:[0,0],
      text:'掃到 <code>(0,0)=1</code> → <strong>count=1</strong>,DFS 沉掉相連的 <code>(0,0)(0,1)</code>(整座<span style="color:#3a6ea5">藍島</span>)。' },
    { rev:2, found:2, scan:[0,3],
      text:'繼續掃,已沉的格是 0 會跳過。掃到 <code>(0,3)=1</code> → <strong>count=2</strong>,沉掉 <code>(0,3)(1,3)</code>(<span style="color:#a9772e">棕島</span>)。' },
    { rev:3, found:3, scan:[2,0],
      text:'掃到 <code>(2,0)=1</code> → <strong>count=3</strong>,沉掉 <code>(2,0)</code>(<span style="color:#4f7a3a">綠島</span>)。' },
    { rev:3, found:0, scan:null,
      text:'掃完整個網格,再沒有新的 <code>1</code>。啟動了 3 次 DFS → <strong>return 3</strong>。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||430; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,h=canvas.clientHeight,PAD=26;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,h);

    // ── BAND 1 · grid
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 網格(每座被發現的島一種色 · 紅框=本步發現)', PAD, 24);
    const cell=76, gw=C*cell, gx=(w-gw)/2, gy=44;
    for(let r=0;r<R;r++) for(let c=0;c<C;c++){ const x=gx+c*cell, y=gy+r*cell, key=r+','+c;
      const isl = ISL[key] || 0;
      let fill, st, label, lcolor=COLOR.ink;
      if(G[r][c]===0){ fill=COLOR.water; st=COLOR.waterS; label='0'; lcolor=COLOR.dim; }
      else if(isl>0 && isl<=s.rev){ fill=ISLC[isl][0]; st=ISLC[isl][1]; label='1'; }             // 已沉:用顏色標島
      else { fill=COLOR.land; st=COLOR.landS; label='1'; }                                       // 未訪陸地
      rr(x+3,y+3,cell-6,cell-6,6); ctx.fillStyle=fill; ctx.fill();
      const cur=(isl>0 && isl===s.found);
      ctx.lineWidth=cur?3.5:1.8; ctx.strokeStyle=cur?COLOR.coral:st; ctx.stroke();
      ctx.fillStyle=lcolor; ctx.font='700 26px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(label, x+cell/2, y+cell/2+1);
      if(s.scan && s.scan[0]===r && s.scan[1]===c){ ctx.fillStyle=COLOR.coral; ctx.font='700 10px "JetBrains Mono", monospace'; ctx.textBaseline='top'; ctx.fillText('scan', x+cell/2, y+8); }
    }

    // ── BAND 2 · counter
    let by=gy+R*cell+26;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 島數 count(= 啟動 DFS 的次數)', PAD, by);
    const cy=by+12;
    rr(PAD,cy,w-PAD*2,40,6); ctx.fillStyle='#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=COLOR.grid; ctx.stroke();
    ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillStyle=COLOR.ink; ctx.font='700 15px "JetBrains Mono", monospace';
    ctx.fillText('count = '+s.rev, PAD+16, cy+20);
    ctx.textAlign='right'; ctx.fillStyle=s.found?COLOR.coral:COLOR.dim; ctx.font='600 13px "Noto Sans TC", sans-serif';
    ctx.fillText(s.found?('發現第 '+s.found+' 座島 → +1、DFS 沉掉'):(step===0?'尚未開始':'掃描結束'), w-PAD-16, cy+20);

    // ── BAND 3 · result
    const ty=cy+62, done=(step===steps.length-1);
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 結果', PAD, ty);
    const box=ty+12; rr(PAD,box,w-PAD*2,40,6); ctx.fillStyle=done?'#d9e8c7':'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?'#5fa866':COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(done){ ctx.fillStyle='#3f7a3a'; ctx.font='700 15px "JetBrains Mono", monospace'; ctx.fillText('return 3  ·  共 3 座島', w/2, box+21); }
    else { ctx.fillStyle=COLOR.dim; ctx.font='600 13px "Noto Sans TC", sans-serif'; ctx.fillText('掃完網格時,count 就是島的總數', w/2, box+21); }
  }

  function update(){ const s=steps[step]; if(stepEl) stepEl.textContent=String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0'); if(labelEl) labelEl.innerHTML=s.text; draw(); }
  function next(){ if(step<steps.length-1){step++;update();}else stop(); }
  function prev(){ if(step>0){step--;update();} }
  function reset(){ stop(); step=0; update(); }
  function play(){ if(timer){stop();return;} bPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){stop();return;} next(); },1450); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} if(bPlay) bPlay.textContent='Play'; }
  bPrev&&bPrev.addEventListener('click',prev); bNext&&bNext.addEventListener('click',next); bPlay&&bPlay.addEventListener('click',play); bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();}); if(window.ResizeObserver){ new ResizeObserver(()=>{fit();draw();}).observe(canvas); }
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw); fit(); update();
})();
