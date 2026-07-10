/* ============================================================
   P752 · Open the Lock — BFS 最短轉數(逐步播放)
   把每個「4 位密碼」當成一個狀態,一次轉一個輪 ±1(共 8 個鄰居,
   9↔0 環繞)。從 "0000" 做 BFS,一層 = 轉一次;第一次碰到 target 的
   層數就是最少轉數。deadends 不能進、seen 不重複。
   deadends=["0201","0101","0102","1212","2002"], target="0202" → 6
     BAND 1  鎖的 4 個輪(珊瑚=本步轉動的輪 + ↑/↓)
     BAND 2  BFS 找到的最短路徑 + step
     BAND 3  deadends + 說明
   ============================================================ */
(function () {
  const canvas = document.getElementById('viz-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('viz-step'), labelEl = document.getElementById('viz-label');
  const bPrev = document.getElementById('viz-prev'), bNext = document.getElementById('viz-next'),
        bPlay = document.getElementById('viz-play'), bReset = document.getElementById('viz-reset');

  const COLOR = { paper:'#ffffff', ink:'#1a1a1a', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf',
    wheel:'#ffffff', wheelS:'#c9c9c1', cur:'#fbe7df', curS:'#d96e4e', done:'#d9e8c7', doneS:'#5fa866',
    chip:'#eef4fa', chipS:'#a9c4da', coral:'#d96e4e', bad:'#f0d4d4', badS:'#c98a8a' };

  const TARGET = '0202';
  const PATH = ['0000','1000','1100','1200','1201','1202','0202'];
  // for reaching PATH[i]: which wheel (0..3) and dir ('up'/'down')
  const MOVE = [null, {w:0,d:'up'}, {w:1,d:'up'}, {w:1,d:'up'}, {w:3,d:'up'}, {w:3,d:'up'}, {w:0,d:'down'}];
  const DEAD = ['0201','0101','0102','1212','2002'];

  const steps = PATH.map((code, i) => {
    const done = (i === PATH.length - 1);
    let text;
    if (i === 0) text = '<strong>INITIAL</strong> · 每個 4 位密碼是一個狀態,一次轉一個輪 <code>±1</code>(<code>9↔0</code> 環繞,共 8 個鄰居)。從 <code>0000</code> 做 BFS,<strong>一層 = 轉一次</strong>。';
    else if (done) text = `轉 wheel ${MOVE[i].w} <strong>${MOVE[i].d==='up'?'↑':'↓'}</strong> → <code>0202</code> = <strong>target</strong>!第一次碰到它的層數 = <strong>最少轉數 = 6</strong>。`;
    else text = `轉 wheel <code>${MOVE[i].w}</code> <strong>${MOVE[i].d==='up'?'↑ (+1)':'↓ (−1)'}</strong> → <code>${code}</code>。step = ${i}。(deadends 不能進、seen 不重複)`;
    return { i, code, done };
  });

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||480; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,h=canvas.clientHeight,PAD=26;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,h);
    const mv = MOVE[step];

    // ── BAND 1 · the 4 wheels
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 鎖的 4 個輪(珊瑚 = 本步轉動的輪)· target = 0202', PAD, 24);
    const ww=84, wh=100, gap=18, tot=4*ww+3*gap, wx0=(w-tot)/2, wy=48;
    for(let k=0;k<4;k++){ const x=wx0+k*(ww+gap); const isCur=mv&&mv.w===k; const digit=s.code[k];
      // up hint
      ctx.fillStyle=COLOR.dim; ctx.font='600 11px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='alphabetic';
      ctx.fillText('▲ +1', x+ww/2, wy-6);
      rr(x,wy,ww,wh,8); ctx.fillStyle=isCur?COLOR.cur:(s.done?COLOR.done:COLOR.wheel); ctx.fill();
      ctx.lineWidth=isCur?3.5:2; ctx.strokeStyle=isCur?COLOR.curS:(s.done?COLOR.doneS:COLOR.wheelS); ctx.stroke();
      ctx.fillStyle=COLOR.ink; ctx.font='700 42px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(digit, x+ww/2, wy+wh/2+2);
      ctx.fillStyle=COLOR.dim; ctx.font='600 11px "JetBrains Mono", monospace'; ctx.textBaseline='alphabetic'; ctx.fillText('▼ −1', x+ww/2, wy+wh+15);
      if(isCur){ ctx.fillStyle=COLOR.coral; ctx.font='700 13px "JetBrains Mono", monospace';
        ctx.fillText(mv.d==='up'?'↑ +1':'↓ −1', x+ww/2, wy+wh+32); }
    }

    // ── BAND 2 · path breadcrumb + step
    let by=wy+wh+52;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · BFS 找到的最短路徑(一層 = 轉一次)', PAD, by);
    const cy=by+12, n=PATH.length, gp=8, cw=Math.min(84,(w-PAD*2-gp*(n-1))/n), ch=40;
    for(let i=0;i<n;i++){ const x=PAD+i*(cw+gp); const active=(i<=step); const isCur=(i===step); const isTgt=(i===n-1);
      rr(x,cy,cw,ch,6);
      ctx.fillStyle=isCur?COLOR.cur:(active?COLOR.done:'#f3f3ef'); ctx.fill();
      ctx.lineWidth=isCur?2.4:1.4; ctx.strokeStyle=isCur?COLOR.curS:(active?COLOR.doneS:COLOR.grid); ctx.stroke();
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillStyle=active?COLOR.ink:COLOR.dim; ctx.font='700 15px "JetBrains Mono", monospace'; ctx.fillText(PATH[i], x+cw/2, cy+15);
      ctx.font='600 9px "JetBrains Mono", monospace'; ctx.fillStyle=active?(isTgt&&isCur?'#3f7a3a':COLOR.dim):COLOR.grid;
      ctx.fillText(isTgt?'target':('step '+i), x+cw/2, cy+31);
    }

    // ── BAND 3 · deadends + note
    const ty=cy+ch+24;
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · deadends(不能進)· 為什麼 BFS 給最短', PAD, ty);
    const box=ty+12; rr(PAD,box,w-PAD*2,44,6); ctx.fillStyle=s.done?COLOR.done:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=s.done?COLOR.doneS:COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(s.done){ ctx.fillStyle='#3f7a3a'; ctx.font='700 14px "JetBrains Mono", monospace'; ctx.fillText('return 6 · BFS 一層一層,第一次碰到 target = 最少轉數', w/2, box+22); }
    else { ctx.fillStyle=COLOR.text; ctx.font='600 12.5px "Noto Sans TC", sans-serif';
      ctx.fillText('dead = {0201, 0101, 0102, 1212, 2002} 一律跳過;BFS 保證先到即最短', w/2, box+22); }
  }

  function update(){ const s=steps[step]; if(stepEl) stepEl.textContent=String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0');
    if(labelEl){ const i=step; let t;
      if(i===0) t='<strong>INITIAL</strong> · 每個 4 位密碼是一個狀態,一次轉一個輪 <code>±1</code>(<code>9↔0</code> 環繞,共 8 個鄰居)。從 <code>0000</code> 做 BFS,<strong>一層 = 轉一次</strong>。';
      else if(i===PATH.length-1) t='轉 wheel '+MOVE[i].w+' <strong>'+(MOVE[i].d==='up'?'↓ (−1)':'')+'</strong>… <code>1202 → 0202</code>(wheel 0 由 1 降到 0)= <strong>target</strong>!第一次碰到的層數 = <strong>最少轉數 6</strong>。';
      else t='轉 wheel <code>'+MOVE[i].w+'</code> <strong>'+(MOVE[i].d==='up'?'↑ (+1)':'↓ (−1)')+'</strong> → <code>'+PATH[i]+'</code>,step = '+i+'。deadends 不能進、seen 不重複。';
      labelEl.innerHTML=t; }
    draw(); }
  function next(){ if(step<steps.length-1){step++;update();}else stop(); }
  function prev(){ if(step>0){step--;update();} }
  function reset(){ stop(); step=0; update(); }
  function play(){ if(timer){stop();return;} bPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){stop();return;} next(); },1500); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} if(bPlay) bPlay.textContent='Play'; }
  bPrev&&bPrev.addEventListener('click',prev); bNext&&bNext.addEventListener('click',next); bPlay&&bPlay.addEventListener('click',play); bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();}); if(window.ResizeObserver){ new ResizeObserver(()=>{fit();draw();}).observe(canvas); }
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw); fit(); update();
})();
