/* ============================================================
   P994 · Rotting Oranges — 多源 BFS + 分鐘計數(逐步播放)
   把所有「腐爛橘子(2)」一起入隊當源,一分鐘擴散一層:每一波把相鄰
   的新鮮橘子(1)變腐爛,同時 fresh-- 並數分鐘。最後一顆新鮮腐爛時的
   分鐘就是答案;若佇列空了還有 fresh>0(有橘子腐爛不到)→ 回 -1。
   grid = [[2,1,1],[1,1,0],[0,1,1]]  →  4
     BAND 1  網格(腐爛=紅2 · 新鮮=橘1 · 空=0 · 本分鐘新腐=紅框)
     BAND 2  分鐘 minute · 剩餘新鮮 fresh
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
    empty:'#eef0ee', emptyS:'#cfcfcf', fresh:'#f6ead8', freshS:'#d4a868',
    rot:'#cf3535', rotS:'#b8532f', newRot:'#fbe1e1', newRotS:'#cf3535', coral:'#cf3535',
    done:'#d9e8c7', doneS:'#5fa866' };

  const R = 3, C = 3;
  const INITROT = new Set(['0,0']);
  const EMPTY = new Set(['1,2','2,0']);
  // fresh = everything else
  const WAVES = [ ['1,0','0,1'], ['1,1','0,2'], ['2,1'], ['2,2'] ]; // 每分鐘新腐爛的格
  const FRESH0 = 6;

  const steps = [
    { minute:0, text:'<strong>INITIAL</strong> · <code>2</code>=腐爛、<code>1</code>=新鮮、<code>0</code>=空。把<strong>所有腐爛橘子一起入隊</strong>當源,一分鐘往外擴散一層。<code>fresh=6</code>。' },
    { minute:1, text:'<strong>第 1 分鐘</strong>:源 <code>(0,0)</code> 讓相鄰的 <code>(1,0)</code>、<code>(0,1)</code> 腐爛。<code>fresh 6→4</code>。' },
    { minute:2, text:'<strong>第 2 分鐘</strong>:上一波的腐爛橘子再感染鄰居 → <code>(1,1)</code>、<code>(0,2)</code> 腐爛。<code>fresh 4→2</code>。' },
    { minute:3, text:'<strong>第 3 分鐘</strong>:<code>(2,1)</code> 腐爛(空格 <code>(2,0)</code> 擋不到)。<code>fresh 2→1</code>。' },
    { minute:4, done:true, text:'<strong>第 4 分鐘</strong>:最後一顆 <code>(2,2)</code> 腐爛 → <code>fresh=0</code> → <strong>return 4</strong>。若佇列空了仍有 fresh,則回 <code>-1</code>。' },
  ];

  function valAt(minute, key){
    if(EMPTY.has(key)) return 0;
    if(INITROT.has(key)) return 2;
    // rotted at some wave <= minute ?
    for(let w=0; w<Math.min(minute,WAVES.length); w++) if(WAVES[w].includes(key)) return 2;
    return 1; // still fresh
  }
  function newlyRot(minute){ return (minute>=1 && minute<=WAVES.length) ? WAVES[minute-1] : []; }
  function freshAt(minute){ let f=FRESH0; for(let w=0; w<Math.min(minute,WAVES.length); w++) f-=WAVES[w].length; return f; }

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||470; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,h=canvas.clientHeight,PAD=26;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,h);
    const nr=new Set(newlyRot(s.minute));

    // ── BAND 1 · grid
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 網格(腐爛=2紅 · 新鮮=1橘 · 空=0 · 本分鐘新腐=紅框)', PAD, 24);
    const cell=78, gw=C*cell, gx=(w-gw)/2, gy=44;
    for(let r=0;r<R;r++) for(let c=0;c<C;c++){ const x=gx+c*cell, y=gy+r*cell, key=r+','+c; const v=valAt(s.minute,key);
      let fill, st, label, lcolor=COLOR.ink; const isNew=nr.has(key);
      if(v===0){ fill=COLOR.empty; st=COLOR.emptyS; label='0'; lcolor=COLOR.dim; }
      else if(v===1){ fill=COLOR.fresh; st=COLOR.freshS; label='1'; }
      else { if(isNew){ fill=COLOR.newRot; st=COLOR.newRotS; label='2'; lcolor=COLOR.coral; }
             else { fill=COLOR.rot; st=COLOR.rotS; label='2'; lcolor='#fff'; } }
      rr(x+3,y+3,cell-6,cell-6,6); ctx.fillStyle=fill; ctx.fill();
      ctx.lineWidth=isNew?3.5:1.6; ctx.strokeStyle=isNew?COLOR.newRotS:st; ctx.stroke();
      ctx.fillStyle=lcolor; ctx.font='700 26px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(label, x+cell/2, y+cell/2+1);
    }

    // ── BAND 2 · minute + fresh
    let by=gy+R*cell+26;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 分鐘 minute(每一波 = 一分鐘)· 剩餘新鮮 fresh', PAD, by);
    const cy=by+12, halfW=(w-PAD*2-14)/2, done=!!s.done;
    rr(PAD,cy,halfW,40,6); ctx.fillStyle=s.minute>=1?'#fbe1e1':'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=s.minute>=1?COLOR.newRotS:COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='700 15px "JetBrains Mono", monospace'; ctx.fillStyle=COLOR.ink;
    ctx.fillText('minute = '+s.minute, PAD+halfW/2, cy+20);
    const x2=PAD+halfW+14; const f=freshAt(s.minute);
    rr(x2,cy,halfW,40,6); ctx.fillStyle=f===0?COLOR.done:COLOR.fresh; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=f===0?COLOR.doneS:COLOR.freshS; ctx.stroke();
    ctx.fillStyle=f===0?'#3f7a3a':COLOR.ink; ctx.fillText('fresh = '+f, x2+halfW/2, cy+20);

    // ── BAND 3 · note
    const ty=cy+62;
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 結果', PAD, ty);
    const box=ty+12; rr(PAD,box,w-PAD*2,40,6); ctx.fillStyle=done?COLOR.done:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?COLOR.doneS:COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(done){ ctx.fillStyle='#3f7a3a'; ctx.font='700 14px "JetBrains Mono", monospace'; ctx.fillText('fresh=0 → return 4(全部腐爛所需分鐘)', w/2, box+20); }
    else { ctx.fillStyle=COLOR.text; ctx.font='600 12.5px "Noto Sans TC", sans-serif'; ctx.fillText('每分鐘一整波同時擴散;佇列空時若 fresh>0 → 有橘子爛不到 → 回 -1', w/2, box+20); }
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
