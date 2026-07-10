/* ============================================================
   P130 · Surrounded Regions — 邊界逃生 DFS(逐步播放)
   一團 O 只有「碰得到邊界」才不會被捕獲。與其正著找被包圍的,不如
   反過來找「安全的」:從每個在邊界上的 O 出發 DFS,把整團連通的 O
   暫時標成 '#'(安全)。最後掃一遍:'#'→'O'(留),剩下的 'O'→'X'(捕獲)。
   board(5×5):邊界連通區安全,內部 (3,3) 被捕獲
     BAND 1  棋盤(X=灰 · O=米 · 安全=綠 · 本步捕獲=珊瑚)
     BAND 2  本步在做什麼
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
    x:'#eef0ee', xS:'#cfcfcf', o:'#f6ead8', oS:'#d4a868', safe:'#d9e8c7', safeS:'#5fa866',
    cap:'#fbe7df', capS:'#d96e4e', coral:'#d96e4e' };

  const R = 5, C = 5;
  // O positions; SAFE (border-connected) vs CAPTURED (interior)
  const OSET = new Set(['1,0','1,1','2,1','3,3']);
  const SAFE = new Set(['1,0','1,1','2,1']);
  const CAP  = new Set(['3,3']);
  const BORDER_O = ['1,0']; // 起點(在左緣)

  const steps = [
    { phase:'init', text:'<strong>INITIAL</strong> · <code>O</code> 團只有<strong>碰得到邊界</strong>才安全。反過來找安全的:從<strong>邊界上的 O</strong>(這裡 <code>(1,0)</code> 在左緣)出發 DFS。' },
    { phase:'mark', text:'<strong>① 標記安全</strong>:從 <code>(1,0)</code> DFS,整團連通的 <code>O</code>(綠)標成 <code>#</code> = 安全。內部的 <code>(3,3)</code> <strong>碰不到邊界</strong>,不會被標到。' },
    { phase:'flip', text:'<strong>② 翻面</strong>:<code>#</code> 還原成 <code>O</code>(綠,保留);剩下沒被標的 <code>O</code>(即 <code>(3,3)</code>)→ <code>X</code>(珊瑚,<strong>被捕獲</strong>)。完成。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||480; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,h=canvas.clientHeight,PAD=26;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,h);

    // ── BAND 1 · board
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 棋盤(X=灰 · O=米 · 安全=綠 · 捕獲=珊瑚)', PAD, 24);
    const cell=60, gw=C*cell, gx=(w-gw)/2, gy=46;
    for(let r=0;r<R;r++) for(let c=0;c<C;c++){ const x=gx+c*cell, y=gy+r*cell, key=r+','+c;
      const isO=OSET.has(key), isSafe=SAFE.has(key), isCap=CAP.has(key);
      let fill=COLOR.x, st=COLOR.xS, label='X', lcolor=COLOR.dim;
      if(isO){ fill=COLOR.o; st=COLOR.oS; label='O'; lcolor='#a9772e'; }
      if(s.phase==='mark' && isSafe){ fill=COLOR.safe; st=COLOR.safeS; label='#'; lcolor='#3f7a3a'; }
      if(s.phase==='flip'){
        if(isSafe){ fill=COLOR.safe; st=COLOR.safeS; label='O'; lcolor='#3f7a3a'; }
        else if(isCap){ fill=COLOR.cap; st=COLOR.capS; label='X'; lcolor=COLOR.coral; }
      }
      rr(x+3,y+3,cell-6,cell-6,6); ctx.fillStyle=fill; ctx.fill();
      const hot=(s.phase==='mark'&&isSafe)||(s.phase==='flip'&&(isSafe||isCap));
      ctx.lineWidth=hot?2.6:1.6; ctx.strokeStyle=st; ctx.stroke();
      ctx.fillStyle=lcolor; ctx.font='700 24px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(label, x+cell/2, y+cell/2+1);
      // start marker
      if(s.phase!=='flip' && BORDER_O.includes(key)){ ctx.fillStyle=COLOR.coral; ctx.font='700 9px "JetBrains Mono", monospace'; ctx.textBaseline='top'; ctx.fillText('起點', x+cell/2, y+7); }
    }

    // ── BAND 2 · step
    let by=gy+R*cell+20;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 本步', PAD, by);
    const cy=by+12, done=s.phase==='flip';
    rr(PAD,cy,w-PAD*2,40,6); ctx.fillStyle=done?COLOR.safe:(s.phase==='mark'?COLOR.safe:'#fafaf6'); ctx.fill();
    ctx.lineWidth=1.6; ctx.strokeStyle=done?COLOR.safeS:(s.phase==='mark'?COLOR.safeS:COLOR.grid); ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='700 14px "JetBrains Mono", monospace';
    if(s.phase==='init'){ ctx.fillStyle=COLOR.dim; ctx.fillText('點 Next / Play:① 從邊界 O 標記安全 → ② 翻面', w/2, cy+20); }
    else if(s.phase==='mark'){ ctx.fillStyle='#3f7a3a'; ctx.fillText('安全 = 3 格(邊界連通);(3,3) 碰不到邊界 → 留待捕獲', w/2, cy+20); }
    else { ctx.fillStyle='#9a3838'; ctx.fillText('捕獲 (3,3) → X;安全 3 格還原成 O。完成', w/2, cy+20); }

    // ── BAND 3 · note
    const ty=cy+56;
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 為什麼「反過來找安全的」', PAD, ty);
    const box=ty+12; rr(PAD,box,w-PAD*2,40,6); ctx.fillStyle='#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillStyle=COLOR.text; ctx.font='600 12.5px "Noto Sans TC", sans-serif';
    ctx.fillText('直接判斷「這團有沒有被包圍」要追整團;從邊界標安全只要 O(mn) 一趟', w/2, box+20);
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
