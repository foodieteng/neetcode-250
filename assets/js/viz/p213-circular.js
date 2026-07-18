/* ============================================================
   P213 · House Robber II — 環形街道拆成兩條直線 · viz
   房子排成圈:第 0 間和第 n-1 間也相鄰,不能同時搶。
   把圈剪開成兩個直線子問題,各跑一次 198 的線性打家劫舍,取 max:
     Run A:搶 nums[0 .. n-2](去尾)—— 保留頭、排除尾
     Run B:搶 nums[1 .. n-1](去頭)—— 排除頭、保留尾
   兩種切法都排除了「頭尾同搶」,結果一定合法。
   例 nums=[2,7,9,3,1]:Run A=11、Run B=10 → 答案 max=11
     (比 198 直線版的 12 少 1,正是因為 0 與 4 現在相鄰不能都搶)
     BAND 1  環形陣列(灰=本輪排除的房 · 綠=本輪搶的房)
     BAND 2  本輪在做哪條直線
     BAND 3  Run A / Run B / 取 max
   ============================================================ */
(function () {
  const canvas = document.getElementById('viz-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('viz-step'), labelEl = document.getElementById('viz-label');
  const bPrev = document.getElementById('viz-prev'), bNext = document.getElementById('viz-next'),
        bPlay = document.getElementById('viz-play'), bReset = document.getElementById('viz-reset');

  const COLOR = { paper:'#ffffff', ink:'#1a1a1a', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf',
    cell:'#fafaf6', cellS:'#cfcfcf', excl:'#ededed', exclS:'#c4c4c4', exclT:'#a6a6a6',
    src:'#dbe8f6', srcS:'#4478c0', srcT:'#2f5f9e',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424', done:'#d9e8c7', doneS:'#5fa866', doneT:'#3f7a3a', coral:'#cf3535' };

  const NUMS = [2, 7, 9, 3, 1];
  const N = NUMS.length;              // 5 間房子,index 0..4,排成圈
  const NIL = -1;
  const steps = [
    { excl:NIL, pick:[], A:NIL, B:NIL,
      text:'<strong>INITIAL</strong> · 房子排成<strong>圈</strong>:第 0 間與第 4 間也相鄰,<strong>不能同時搶</strong>。把圈剪開成兩條直線,各跑一次線性打家劫舍。' },
    { excl:4, pick:[0,2], A:11, B:NIL,
      text:'<strong>Run A · 去尾</strong>:排除第 4 間,只搶 <code>nums[0..3]</code>。線性最優 = 搶第 0、2 間 = <code>2 + 9 = 11</code>。' },
    { excl:0, pick:[1,3], A:11, B:10,
      text:'<strong>Run B · 去頭</strong>:排除第 0 間,只搶 <code>nums[1..4]</code>。線性最優 = 搶第 1、3 間 = <code>7 + 3 = 10</code>。' },
    { excl:NIL, pick:[], A:11, B:10, done:true,
      text:'答案 = <code>max(Run A, Run B) = max(11, 10) = 11</code>。比直線版(198)的 12 少 1 —— 因為第 0、4 間現在相鄰,不能都搶。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,h=canvas.clientHeight,PAD=26;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,h);
    const pickSet=new Set(s.pick);

    // ── BAND 1 · circular array
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · nums[] 排成圈(灰=本輪排除 · 綠=本輪搶的房)', PAD, 24);

    const cw=Math.min(78,(w-2*PAD)/(N+0.5)); const total=N*cw; const gx=(w-total)/2;
    const gy=92, chh=46;

    // circular link arc from cell 0 to cell N-1 (above the row)
    const x0=gx+cw/2, xN=gx+(N-1)*cw+cw/2, arcTop=44, cellTopY=gy-6;
    const constraintActive=(s.excl===NIL && !s.done);
    ctx.strokeStyle=constraintActive?COLOR.curS:COLOR.grid; ctx.lineWidth=constraintActive?2.4:1.6;
    ctx.setLineDash(constraintActive?[]:[5,4]);
    ctx.beginPath(); ctx.moveTo(x0,cellTopY); ctx.bezierCurveTo(x0,arcTop, xN,arcTop, xN,cellTopY); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle=constraintActive?COLOR.curT:COLOR.dim; ctx.font='600 11.5px "Noto Sans TC", sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('首尾相鄰,不能同時搶', (x0+xN)/2, arcTop-2);

    for(let i=0;i<N;i++){ const x=gx+i*cw; const isExcl=(i===s.excl), isPick=pickSet.has(i);
      ctx.fillStyle=COLOR.dim; ctx.font='700 11px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(i), x+cw/2, gy-16);
      rr(x+4,gy,cw-8,chh,5);
      ctx.fillStyle=isExcl?COLOR.excl:(isPick?COLOR.done:COLOR.cell); ctx.fill();
      ctx.lineWidth=isPick?3:1.8; ctx.strokeStyle=isExcl?COLOR.exclS:(isPick?COLOR.doneS:COLOR.cellS); ctx.stroke();
      ctx.fillStyle=isExcl?COLOR.exclT:(isPick?COLOR.doneT:COLOR.ink); ctx.font='700 21px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(NUMS[i]), x+cw/2, gy+chh/2+1);
      // small "搶" tag under picked cells
      if(isPick){ ctx.fillStyle=COLOR.doneT; ctx.font='600 11px "Noto Sans TC", sans-serif'; ctx.fillText('搶', x+cw/2, gy+chh+13); }
      if(isExcl){ ctx.fillStyle=COLOR.exclT; ctx.font='600 11px "Noto Sans TC", sans-serif'; ctx.fillText('排除', x+cw/2, gy+chh+13); }
    }

    // ── BAND 2 · which run
    let by=176;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 本輪在做哪條直線', PAD, by);
    const eqBox=by+12; rr(PAD,eqBox,w-PAD*2,42,6); ctx.fillStyle='#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.font='600 13px "Noto Sans TC", sans-serif';
    if(s.excl===4){ ctx.fillStyle=COLOR.curT; ctx.fillText('Run A:保留頭、去掉尾 → 對 nums[0..n-2] 跑線性打家劫舍', w/2, eqBox+21); }
    else if(s.excl===0){ ctx.fillStyle=COLOR.curT; ctx.fillText('Run B:去掉頭、保留尾 → 對 nums[1..n-1] 跑線性打家劫舍', w/2, eqBox+21); }
    else if(s.done){ ctx.fillStyle=COLOR.doneT; ctx.font='700 13px "JetBrains Mono", monospace'; ctx.fillText('兩條直線都排除了「頭尾同搶」→ 取 max 一定合法', w/2, eqBox+21); }
    else { ctx.fillStyle=COLOR.text; ctx.fillText('剪開這個圈:分別排除「尾」與「頭」,變成兩個獨立的直線問題', w/2, eqBox+21); }

    // ── BAND 3 · tally
    const ty=eqBox+62, done=!!s.done;
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 取兩輪最大值', PAD, ty);
    const box=ty+12, boxH=44; rr(PAD,box,w-PAD*2,boxH,6); ctx.fillStyle=done?COLOR.done:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?COLOR.doneS:COLOR.grid; ctx.stroke();
    ctx.textBaseline='middle';
    const midY=box+boxH/2;
    // three slots: Run A | Run B | answer
    const aTxt = s.A===NIL?'—':String(s.A), bTxt=s.B===NIL?'—':String(s.B);
    ctx.textAlign='center';
    ctx.font='700 14px "JetBrains Mono", monospace';
    ctx.fillStyle=(s.excl===4)?COLOR.curT:COLOR.text; ctx.fillText('Run A(去尾) = '+aTxt, w*0.24, midY);
    ctx.fillStyle=(s.excl===0)?COLOR.curT:COLOR.text; ctx.fillText('Run B(去頭) = '+bTxt, w*0.52, midY);
    ctx.fillStyle=done?COLOR.doneT:COLOR.dim; ctx.font='700 15px "JetBrains Mono", monospace';
    ctx.fillText(done?'max = 11':'max = ?', w*0.82, midY);
  }

  function update(){ const s=steps[step]; if(stepEl) stepEl.textContent=String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0'); if(labelEl) labelEl.innerHTML=s.text; draw(); }
  function next(){ if(step<steps.length-1){step++;update();}else stop(); }
  function prev(){ if(step>0){step--;update();} }
  function reset(){ stop(); step=0; update(); }
  function play(){ if(timer){stop();return;} bPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){stop();return;} next(); },1800); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} if(bPlay) bPlay.textContent='Play'; }
  bPrev&&bPrev.addEventListener('click',prev); bNext&&bNext.addEventListener('click',next); bPlay&&bPlay.addEventListener('click',play); bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();}); if(window.ResizeObserver){ new ResizeObserver(()=>{fit();draw();}).observe(canvas); }
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw); fit(); update();
})();
