/* ============================================================
   P417 · Pacific Atlantic Water Flow — 反向淹沒(逐步播放)
   水往低處流;反過來想:從「海的邊界」往內陸淹,只走「高度 >= 當前」
   的鄰居,就標出「能流到這片海」的所有格。做兩次淹沒:太平洋(上緣+
   左緣)、大西洋(下緣+右緣);兩邊都能到的格 = 答案。
   heights = LeetCode 範例  →  7 格
     BAND 1  高度網格(藍=可達太平洋 · 棕=可達大西洋 · 紅=兩者)
     BAND 2  本步在標什麼
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
    cell:'#ffffff', cellS:'#c9c9c1', pac:'#e3edf5', pacS:'#6f9fc4', atl:'#f6ead8', atlS:'#d4a868',
    both:'#cf3535', bothS:'#b8532f', coral:'#cf3535' };

  const R = 5, C = 5;
  const H = [[1,2,2,3,5],[3,2,3,4,4],[2,4,5,3,1],[6,7,1,4,5],[5,1,1,2,4]];
  const PAC = [[1,1,1,1,1],[1,1,1,1,1],[1,1,1,0,0],[1,1,0,0,0],[1,0,0,0,0]];
  const ATL = [[0,0,0,0,1],[0,0,0,1,1],[0,0,1,1,1],[1,1,1,1,1],[1,1,1,1,1]];

  const steps = [
    { show:'init', text:'<strong>INITIAL</strong> · 太平洋碰<strong>上緣 + 左緣</strong>,大西洋碰<strong>下緣 + 右緣</strong>。水往低處流;反過來從海邊往內陸淹,只走高度 <strong>≥ 當前</strong>的鄰居。' },
    { show:'pac', text:'<strong>① 太平洋淹沒</strong>:從上緣、左緣的格往內 DFS,鄰居 <code>≥</code> 當前才走 → 藍色 = 能把水流到<strong>太平洋</strong>的格。' },
    { show:'atl', text:'<strong>② 大西洋淹沒</strong>:同樣從下緣、右緣往內淹 → 棕色 = 能流到<strong>大西洋</strong>的格。' },
    { show:'both', text:'<strong>③ 取交集</strong>:<strong>兩邊都能到</strong>的格(紅)就是答案 —— <code>[0,4][1,3][1,4][2,2][3,0][3,1][4,0]</code>,共 7 格。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||500; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,h=canvas.clientHeight,PAD=26;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,h);

    // ── BAND 1 · grid
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 高度網格(藍=可達太平洋 · 棕=可達大西洋 · 紅=兩者皆可)', PAD, 24);
    const cell=60, gw=C*cell, gx=(w-gw)/2, gy=58, bar=7;

    // ocean bars: Pacific top+left (blue), Atlantic bottom+right (brown)
    ctx.fillStyle=COLOR.pacS; ctx.fillRect(gx-2, gy-bar-3, gw+4, bar); ctx.fillRect(gx-bar-3, gy-2, bar, gw+4);
    ctx.fillStyle=COLOR.atlS; ctx.fillRect(gx-2, gy+gw+3, gw+4, bar); ctx.fillRect(gx+gw+3, gy-2, bar, gw+4);
    ctx.font='700 10px "JetBrains Mono", monospace'; ctx.textBaseline='alphabetic';
    ctx.fillStyle=COLOR.pacS; ctx.textAlign='left'; ctx.fillText('PACIFIC ↑←', gx-2, gy-bar-8);
    ctx.fillStyle=COLOR.atlS; ctx.textAlign='right'; ctx.fillText('→↓ ATLANTIC', gx+gw+2, gy+gw+bar+18);

    for(let r=0;r<R;r++) for(let c=0;c<C;c++){ const x=gx+c*cell, y=gy+r*cell;
      const inP=PAC[r][c], inA=ATL[r][c];
      let fill=COLOR.cell, st=COLOR.cellS, lcolor=COLOR.ink;
      if(s.show==='pac'){ if(inP){ fill=COLOR.pac; st=COLOR.pacS; } }
      else if(s.show==='atl'){ if(inA){ fill=COLOR.atl; st=COLOR.atlS; } }
      else if(s.show==='both'){
        if(inP&&inA){ fill=COLOR.both; st=COLOR.bothS; lcolor='#fff'; }
        else if(inP){ fill=COLOR.pac; st=COLOR.pacS; }
        else if(inA){ fill=COLOR.atl; st=COLOR.atlS; } }
      rr(x+3,y+3,cell-6,cell-6,6); ctx.fillStyle=fill; ctx.fill();
      ctx.lineWidth=(s.show==='both'&&inP&&inA)?3:1.6; ctx.strokeStyle=st; ctx.stroke();
      ctx.fillStyle=lcolor; ctx.font='700 22px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(H[r][c]), x+cell/2, y+cell/2+1);
    }

    // ── BAND 2 · what this step marks
    let by=gy+gw+32;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 本步', PAD, by);
    const cy=by+12; const done=s.show==='both';
    rr(PAD,cy,w-PAD*2,40,6); ctx.fillStyle=done?'#fbe1e1':(s.show==='init'?'#fafaf6':(s.show==='pac'?COLOR.pac:COLOR.atl)); ctx.fill();
    ctx.lineWidth=1.6; ctx.strokeStyle=done?COLOR.bothS:(s.show==='init'?COLOR.grid:(s.show==='pac'?COLOR.pacS:COLOR.atlS)); ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='700 14px "JetBrains Mono", monospace';
    if(s.show==='init'){ ctx.fillStyle=COLOR.dim; ctx.fillText('點 Next / Play:① 太平洋淹沒 → ② 大西洋淹沒 → ③ 交集', w/2, cy+20); }
    else if(s.show==='pac'){ ctx.fillStyle='#3a6ea5'; ctx.fillText('可達太平洋:藍色格(從上緣/左緣往高處淹)', w/2, cy+20); }
    else if(s.show==='atl'){ ctx.fillStyle='#a9772e'; ctx.fillText('可達大西洋:棕色格(從下緣/右緣往高處淹)', w/2, cy+20); }
    else { ctx.fillStyle='#9a3838'; ctx.fillText('交集 = 7 格 → return(紅色即答案)', w/2, cy+20); }

    // ── BAND 3 · note
    const ty=cy+56;
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 為什麼「反過來淹」', PAD, ty);
    const box=ty+12; rr(PAD,box,w-PAD*2,40,6); ctx.fillStyle='#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillStyle=COLOR.text; ctx.font='600 12.5px "Noto Sans TC", sans-serif';
    ctx.fillText('正著問「每格能否流到海」要對每格搜一次;反過來從海淹只需 2 次,O(mn)', w/2, box+20);
  }

  function update(){ const s=steps[step]; if(stepEl) stepEl.textContent=String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0'); if(labelEl) labelEl.innerHTML=s.text; draw(); }
  function next(){ if(step<steps.length-1){step++;update();}else stop(); }
  function prev(){ if(step>0){step--;update();} }
  function reset(){ stop(); step=0; update(); }
  function play(){ if(timer){stop();return;} bPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){stop();return;} next(); },1650); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} if(bPlay) bPlay.textContent='Play'; }
  bPrev&&bPrev.addEventListener('click',prev); bNext&&bNext.addEventListener('click',next); bPlay&&bPlay.addEventListener('click',play); bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();}); if(window.ResizeObserver){ new ResizeObserver(()=>{fit();draw();}).observe(canvas); }
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw); fit(); update();
})();
