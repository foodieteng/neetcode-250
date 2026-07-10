/* ============================================================
   P133 · Follow-up 空間 O(1) — 映射結構(逐步播放)· vb
   主解法用 unordered_map<Node*,Node*>,大小隨節點數 V 長大 → O(V)。
   因為 val 唯一且 1..100,可把 map 換成「固定 101 格、以 val 為索引」
   的陣列 clone[101]:大小與 V 無關 → O(1)。(走訪的遞迴/佇列仍 O(V),
   那是圖走訪本質,無法再省;此處省的是「map 結構」。)
     BAND 1  固定陣列 clone[0..100](逐格填入新節點)
     BAND 2  空間對照:hashmap O(V) vs 固定陣列 O(1)
   ============================================================ */
(function () {
  const canvas = document.getElementById('vb-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('vb-step'), labelEl = document.getElementById('vb-label');
  const bPrev = document.getElementById('vb-prev'), bNext = document.getElementById('vb-next'),
        bPlay = document.getElementById('vb-play'), bReset = document.getElementById('vb-reset');

  const COLOR = { paper:'#ffffff', ink:'#1a1a1a', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf',
    cell:'#ffffff', cellS:'#c9c9c1', done:'#d9e8c7', doneS:'#5fa866', cur:'#fbe7df', curS:'#d96e4e', coral:'#d96e4e' };

  const SHOWN = [0,1,2,3,4,5,6,7]; // 展示 index 0..7,後面用「… 100」示意
  const steps = [
    { filled:0, cur:-1,
      text:'<strong>INITIAL</strong> · map 可以用什麼裝?主解法用 <code>hashmap</code>,大小隨節點數長大。這裡改用<strong>以 val 為索引的固定陣列</strong> <code>clone[101]</code>。' },
    { filled:1, cur:1, text:'複製 <code>val=1</code> → <code>clone[1] = 1\'</code>。用 <strong>val 當索引</strong>直接放進固定格子。' },
    { filled:2, cur:2, text:'複製 <code>val=2</code> → <code>clone[2] = 2\'</code>。' },
    { filled:3, cur:3, text:'複製 <code>val=3</code> → <code>clone[3] = 3\'</code>。' },
    { filled:4, cur:4, text:'複製 <code>val=4</code> → <code>clone[4] = 4\'</code>。無論幾個節點,陣列<strong>永遠 101 格</strong> → 空間 <strong>O(1)</strong>。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||420; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,h=canvas.clientHeight,PAD=26;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,h);

    // ── BAND 1 · fixed array clone[0..100]
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 固定陣列 clone[101](以 val 為索引 · 藍格=已填入新節點)', PAD, 24);
    const cnt=SHOWN.length+1, gap=8, cw=Math.min(96,(w-PAD*2-gap*cnt)/(cnt+1)), ch=64, gy=44;
    let x=PAD;
    for(const idx of SHOWN){ const filled=(idx>=1 && idx<=s.filled); const cur=(idx===s.cur);
      rr(x,gy,cw,ch,6); ctx.fillStyle=cur?COLOR.cur:(filled?COLOR.done:COLOR.cell); ctx.fill();
      ctx.lineWidth=cur?3:1.8; ctx.strokeStyle=cur?COLOR.curS:(filled?COLOR.doneS:COLOR.cellS); ctx.stroke();
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillStyle=COLOR.ink; ctx.font='700 18px "JetBrains Mono", monospace';
      ctx.fillText(filled?(idx+"'"):(idx===0?'∅':'·'), x+cw/2, gy+ch/2-4);
      ctx.font='600 11px "JetBrains Mono", monospace'; ctx.fillStyle=COLOR.dim;
      ctx.fillText('['+idx+']', x+cw/2, gy+ch-13);
      x+=cw+gap;
    }
    // ellipsis + [100]
    ctx.fillStyle=COLOR.dim; ctx.font='700 20px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('…', x+cw/2, gy+ch/2);
    x+=cw*0.5;
    rr(x,gy,cw,ch,6); ctx.fillStyle=COLOR.cell; ctx.fill(); ctx.lineWidth=1.8; ctx.strokeStyle=COLOR.cellS; ctx.stroke();
    ctx.fillStyle=COLOR.ink; ctx.font='700 16px "JetBrains Mono", monospace'; ctx.textBaseline='middle'; ctx.fillText('·', x+cw/2, gy+ch/2-4);
    ctx.font='600 11px "JetBrains Mono", monospace'; ctx.fillStyle=COLOR.dim; ctx.fillText('[100]', x+cw/2, gy+ch-13);

    // caption under array
    ctx.textAlign='left'; ctx.fillStyle=COLOR.text; ctx.font='600 12.5px "Noto Sans TC", sans-serif'; ctx.textBaseline='alphabetic';
    ctx.fillText('索引 = 節點 val(唯一、1..100);格子固定 101 個,和節點數 n 無關。', PAD, gy+ch+26);

    // ── BAND 2 · space compare
    let by=gy+ch+52;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 空間對照(map 結構)', PAD, by);
    const cy=by+12, halfW=(w-PAD*2-14)/2;
    rr(PAD,cy,halfW,54,6); ctx.fillStyle='#f0d4d4'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle='#c98a8a'; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillStyle=COLOR.ink; ctx.font='700 14px "JetBrains Mono", monospace'; ctx.fillText('hashmap', PAD+halfW/2, cy+19);
    ctx.font='600 12px "Noto Sans TC", sans-serif'; ctx.fillStyle='#9a3838'; ctx.fillText('隨節點數長大 → O(V)', PAD+halfW/2, cy+38);
    const x2=PAD+halfW+14;
    rr(x2,cy,halfW,54,6); ctx.fillStyle=COLOR.done; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=COLOR.doneS; ctx.stroke();
    ctx.fillStyle=COLOR.ink; ctx.font='700 14px "JetBrains Mono", monospace'; ctx.fillText('clone[101] 固定陣列', x2+halfW/2, cy+19);
    ctx.font='600 12px "Noto Sans TC", sans-serif'; ctx.fillStyle='#3f7a3a'; ctx.fillText('永遠 101 格 → O(1)', x2+halfW/2, cy+38);

    // note about traversal
    const ny=cy+66;
    ctx.textAlign='left'; ctx.fillStyle=COLOR.dim; ctx.font='600 11.5px "Noto Sans TC", sans-serif'; ctx.textBaseline='alphabetic';
    ctx.fillText('※ 走訪的遞迴堆疊 / BFS 佇列仍是 O(V)(圖走訪本質);此處省下的是 map 結構。', PAD, ny+4);
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
