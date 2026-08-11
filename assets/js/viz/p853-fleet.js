/* ============================================================
   P853 · Car Fleet — 依位置排序 + 堆疊(抵達時間)· viz
   關鍵事實:後車 A(位置較小)會併入前車 B(位置較大)⟺ time_A ≤ time_B
   (A 在後、卻不比 B 晚到 → 一定追上、卡在 B 後面同速)。
   依位置由小到大處理(最後才處理最前車);堆疊存各車隊的抵達時間。新來的前車 i,
   把堆疊頂端 time ≤ time_i 的通通 pop(它們追上 i、併成同一隊)。最後堆疊大小 = 車隊數。
   例 target=12,cars(pos:t)= 0:12, 3:3, 5:7, 8:1, 10:1 → 3 隊。
     BAND 1  路(0→target)· 車(pos 定位 · 上=抵達時間 · 綠=車隊頭 · 灰=已併入)
     BAND 2  堆疊:各車隊抵達時間(右=top)
     BAND 3  本步動作
   ============================================================ */
(function () {
  const canvas = document.getElementById('viz-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('viz-step'), labelEl = document.getElementById('viz-label');
  const bPrev = document.getElementById('viz-prev'), bNext = document.getElementById('viz-next'),
        bPlay = document.getElementById('viz-play'), bReset = document.getElementById('viz-reset');
  const C = { paper:'#ffffff', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf', cell:'#fafaf6', cellS:'#cfcfcf',
    src:'#dbe8f6', srcS:'#4478c0', srcT:'#2f5f9e', grn:'#d9e8c7', grnS:'#5fa866', grnT:'#3f7a3a',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424', off:'#eceae2', offS:'#c9c6ba', offT:'#8a8672', coral:'#cf3535' };

  const TARGET = 12;
  // cars sorted by position asc: {pos, t}
  const CARS = [ {pos:0,t:12}, {pos:3,t:3}, {pos:5,t:7}, {pos:8,t:1}, {pos:10,t:1} ];
  // per step: cur idx (-1 none), state[] ('pending'|'leader'|'merged'), stack (list of {t}), cmp
  const steps = [
    { cur:-1, state:['pending','pending','pending','pending','pending'], stack:[], cmp:'', act:'intro',
      text:'<strong>INITIAL</strong> · 依位置由小到大處理(最後才輪到最前車)。後車 A 併入前車 B ⟺ <code>time_A ≤ time_B</code>。堆疊存各車隊抵達時間。' },
    { cur:0, state:['leader','pending','pending','pending','pending'], stack:[{t:12}], cmp:'', act:'push',
      text:'<strong>pos 0 (t=12)</strong> · 堆疊空 → 自成一隊,push 12。' },
    { cur:1, state:['leader','leader','pending','pending','pending'], stack:[{t:12},{t:3}], cmp:'top 12 &gt; 3 → 不併', act:'push',
      text:'<strong>pos 3 (t=3)</strong> · 頂端 12 &gt; 3(它比後車慢、追不上)→ 自成一隊,push 3。' },
    { cur:2, state:['leader','merged','leader','pending','pending'], stack:[{t:12},{t:7}], cmp:'3 ≤ 7 → pos3 併入', act:'pop',
      text:'<strong>pos 5 (t=7)</strong> · 頂端 <code>t=3 ≤ 7</code> → 後面的 pos3 會追上 pos5、併成同隊,pop 3;12 &gt; 7 停。push 7。' },
    { cur:3, state:['leader','merged','leader','leader','pending'], stack:[{t:12},{t:7},{t:1}], cmp:'top 7 &gt; 1 → 不併', act:'push',
      text:'<strong>pos 8 (t=1)</strong> · 頂端 7 &gt; 1 → 自成一隊,push 1。' },
    { cur:4, state:['leader','merged','leader','merged','leader'], stack:[{t:12},{t:7},{t:1}], cmp:'1 ≤ 1 → pos8 併入', act:'pop',
      text:'<strong>pos 10 (t=1)</strong> · 頂端 <code>t=1 ≤ 1</code>(同時到,算同隊)→ pop;7 &gt; 1 停。push 1。' },
    { cur:-1, state:['leader','merged','leader','merged','leader'], stack:[{t:12},{t:7},{t:1}], cmp:'', act:'done',
      text:'<strong>完成</strong> · 堆疊剩 3 個 → <strong>3 個車隊</strong>。排序 O(n log n) + 堆疊一趟 O(n)。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function triD(cx,cy,col){ ctx.beginPath(); ctx.moveTo(cx-6,cy-7); ctx.lineTo(cx+6,cy-7); ctx.lineTo(cx,cy+3); ctx.closePath(); ctx.fillStyle=col; ctx.fill(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,PAD=34; const done=s.act==='done';
    ctx.fillStyle=C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);
    // ── BAND 1 · road ──
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 路 0→target(車依位置定位 · 上=抵達時間 · 綠=車隊頭 · 灰=已併入 · 紅=現在)', PAD, 18);
    const lineY=78, x0=PAD+6, x1=w-PAD-6, span=x1-x0;
    // road line
    ctx.strokeStyle=C.grid; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(x0,lineY); ctx.lineTo(x1,lineY); ctx.stroke();
    // target flag
    ctx.fillStyle=C.dim; ctx.font='600 10px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='top';
    ctx.fillText('0', x0, lineY+8); ctx.fillText('target '+TARGET, x1, lineY+8);
    ctx.strokeStyle=C.offS; ctx.lineWidth=2; ctx.setLineDash([3,3]); ctx.beginPath(); ctx.moveTo(x1,lineY-24); ctx.lineTo(x1,lineY+6); ctx.stroke(); ctx.setLineDash([]);
    // cars
    for(let k=0;k<CARS.length;k++){
      const c=CARS[k]; const cx=x0 + (c.pos/TARGET)*span; const st=s.state[k]; const isCur=k===s.cur;
      const cw=40, ch=26, bx=cx-cw/2, by=lineY-13;
      let bg=C.src,bd=C.srcS,tc=C.srcT;
      if(st==='pending'){ bg=C.cell; bd=C.cellS; tc=C.text; }
      if(st==='leader'){ bg=C.grn; bd=C.grnS; tc=C.grnT; }
      if(st==='merged'){ bg=C.off; bd=C.offS; tc=C.offT; }
      if(isCur){ bg=C.cur; bd=C.curS; tc=C.curT; }
      rr(bx,by,cw,ch,6); ctx.fillStyle=bg; ctx.fill(); ctx.lineWidth=isCur?3:1.7; ctx.strokeStyle=bd;
      if(st==='merged') ctx.setLineDash([3,2]); ctx.stroke(); ctx.setLineDash([]);
      // position label inside
      ctx.fillStyle=tc; ctx.font='700 12px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('p'+c.pos, cx, by+ch/2);
      // time above
      ctx.fillStyle=st==='merged'?C.offT:(st==='leader'?C.grnT:C.text); ctx.font='700 12px "JetBrains Mono", monospace'; ctx.textBaseline='bottom';
      ctx.fillText('t'+c.t, cx, by-6);
      if(st==='merged'){ ctx.fillStyle=C.offT; ctx.font='700 9px "JetBrains Mono", monospace'; ctx.textBaseline='top'; ctx.fillText('併入▶', cx, by+ch+4); }
    }

    // ── BAND 2 · stack of fleet times ──
    const b2=132;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 堆疊:各車隊的抵達時間(右=top · 綠=剛 push)', PAD, b2);
    const sy=b2+22, scw=56, sgp=14; let sx=PAD+4;
    if(s.stack.length===0){ ctx.fillStyle=C.offT; ctx.font='600 13px "Noto Sans TC", sans-serif'; ctx.textBaseline='middle'; ctx.fillText('(空)', sx, sy+22); }
    for(let k=0;k<s.stack.length;k++){
      const isTop=k===s.stack.length-1; const justPush=isTop && (s.act==='push'||s.act==='pop');
      rr(sx,sy,scw,44,8); ctx.fillStyle=justPush?C.grn:(isTop?'#eef4fb':C.src); ctx.fill(); ctx.lineWidth=isTop?3:1.7; ctx.strokeStyle=justPush?C.grnS:C.srcS; ctx.stroke();
      ctx.fillStyle=justPush?C.grnT:C.srcT; ctx.font='700 18px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('t'+s.stack[k].t, sx+scw/2, sy+22);
      if(isTop){ triD(sx+scw/2, sy-3, C.srcT); ctx.fillStyle=C.srcT; ctx.font='700 9px "JetBrains Mono", monospace'; ctx.textBaseline='bottom'; ctx.fillText('top', sx+scw/2, sy-9); }
      sx+=scw+sgp;
    }
    // fleet count + cmp
    ctx.textAlign='right'; ctx.textBaseline='alphabetic'; ctx.font='700 13px "JetBrains Mono", monospace'; ctx.fillStyle=done?C.grnT:C.text;
    ctx.fillText('車隊數 = '+s.stack.length, w-PAD, b2);
    if(s.cmp){ ctx.font='700 12px "JetBrains Mono", monospace'; ctx.fillStyle=s.act==='pop'?C.grnT:C.curT; ctx.fillText(s.cmp.replace(/<[^>]+>/g,''), w-PAD, b2+64); }

    // ── BAND 3 ──
    const by=206;
    ctx.fillStyle=C.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 新前車 i:頂端 time ≤ time_i 就 pop(後車追上、併同隊);再 push', PAD, by);
    rr(PAD,by+10,w-PAD*2,44,6); ctx.fillStyle=done?C.grn:(s.act==='pop'?C.grn:'#fafaf6'); ctx.fill(); ctx.lineWidth=1.6;
    ctx.strokeStyle=done?C.grnS:(s.act==='pop'?C.grnS:C.grid); ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='600 12.5px "Noto Sans TC", sans-serif';
    let msg,col=C.text;
    if(s.act==='intro'){ msg='抵達時間 t=(target−pos)/speed;t 越大越慢到'; }
    else if(done){ msg='堆疊大小 = 車隊數 · 排序 O(n log n) 主導,堆疊一趟 O(n)'; col=C.grnT; }
    else if(s.act==='pop'){ msg='頂端(後車)time ≤ 前車 → 追得上、併入前車這一隊,pop'; col=C.grnT; }
    else { msg='頂端(後車)time 較大 → 追不上、各走各的,前車自成一隊 push'; col=C.srcT; }
    ctx.fillStyle=col; ctx.fillText(msg, w/2, by+32);
  }

  function update(){ if(stepEl) stepEl.textContent=String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0'); if(labelEl) labelEl.innerHTML=steps[step].text; draw(); }
  function next(){ if(step<steps.length-1){step++;update();}else stop(); }
  function prev(){ if(step>0){step--;update();} }
  function reset(){ stop(); step=0; update(); }
  function play(){ if(timer){stop();return;} bPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){stop();return;} next(); },1750); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} if(bPlay) bPlay.textContent='Play'; }
  bPrev&&bPrev.addEventListener('click',prev); bNext&&bNext.addEventListener('click',next); bPlay&&bPlay.addEventListener('click',play); bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();}); if(window.ResizeObserver){ new ResizeObserver(()=>{fit();draw();}).observe(canvas); }
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw); fit(); update();
})();
