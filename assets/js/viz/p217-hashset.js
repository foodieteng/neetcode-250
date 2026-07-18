/* ============================================================
   P217 · Contains Duplicate — 一次掃描 + 雜湊集合 · viz
   一邊掃 nums,一邊把看過的丟進 unordered_set。
   碰到「集合裡已經有」的值 → 立刻 return true(不用掃完)。
   全部掃完都沒撞到 → return false。
   nums=[1,2,3,1] → 第 3 個 1 撞到集合裡的 1 → true。
     BAND 1  陣列(珊瑚=正在看 · 綠=已放進集合 · 紅=撞到重複)
     BAND 2  seen 集合目前內容
     BAND 3  本步判斷:在集合裡嗎?
   ============================================================ */
(function () {
  const canvas = document.getElementById('viz-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('viz-step'), labelEl = document.getElementById('viz-label');
  const bPrev = document.getElementById('viz-prev'), bNext = document.getElementById('viz-next'),
        bPlay = document.getElementById('viz-play'), bReset = document.getElementById('viz-reset');

  const COLOR = { paper:'#ffffff', ink:'#1a1a1a', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf',
    cell:'#fafaf6', cellS:'#cfcfcf', src:'#dbe8f6', srcS:'#4478c0', srcT:'#2f5f9e',
    cur:'#fbe7df', curS:'#d96e4e', curT:'#b3502f', done:'#d9e8c7', doneS:'#5fa866', doneT:'#3f7a3a',
    bad:'#f0d4d4', badS:'#c1440e', badT:'#8f3208', coral:'#d96e4e' };

  const A = [1,2,3,1];
  const steps = [
    { i:-1, seen:[], hit:false,
      text:'<strong>INITIAL</strong> · <code>nums=[1,2,3,1]</code>。準備一個空的 <code>unordered_set seen</code>,從左掃到右。每個值先問「在集合裡嗎?」,不在才放進去。' },
    { i:0, seen:[], hit:false, add:1,
      text:'<strong>i=0 · 值 1</strong> · <code>seen</code> 是空的 → 沒撞到。把 <strong>1</strong> 放進集合。' },
    { i:1, seen:[1], hit:false, add:2,
      text:'<strong>i=1 · 值 2</strong> · 不在 <code>{1}</code> 裡 → 放進去。<code>seen = {1,2}</code>。' },
    { i:2, seen:[1,2], hit:false, add:3,
      text:'<strong>i=2 · 值 3</strong> · 不在 <code>{1,2}</code> 裡 → 放進去。<code>seen = {1,2,3}</code>。' },
    { i:3, seen:[1,2,3], hit:true, done:true,
      text:'<strong>i=3 · 值 1</strong> · <strong>1 已經在 <code>{1,2,3}</code> 裡!</strong> → 立刻 <code>return true</code>。<strong>不用掃完剩下的</strong> —— 找到一個重複就夠了。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,h=canvas.clientHeight,PAD=26;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,h);
    const done=!!s.done, N=A.length;

    // ── BAND 1 · array ──
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · nums(珊瑚=正在看 · 綠=已入集合 · 紅=撞到重複)', PAD, 24);

    const cell=Math.min(72,(w-2*PAD)/(N+1)), gx=(w-N*cell)/2, gy=54, chh=46;
    for(let k=0;k<N;k++){
      const x=gx+k*cell;
      const isCur=(k===s.i);
      const inSeen=(k<s.i);       // 已處理過的(在 s.i 之前)
      const isHit=(isCur && s.hit);
      ctx.fillStyle=COLOR.dim; ctx.font='700 10px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('['+k+']', x+cell/2, gy-10);
      rr(x+4,gy,cell-8,chh,7);
      let bg=COLOR.cell,bd=COLOR.cellS,tc=COLOR.text;
      if(inSeen){ bg=COLOR.done; bd=COLOR.doneS; tc=COLOR.doneT; }
      if(isCur){ bg=COLOR.cur; bd=COLOR.curS; tc=COLOR.curT; }
      if(isHit){ bg=COLOR.bad; bd=COLOR.badS; tc=COLOR.badT; }
      ctx.fillStyle=bg; ctx.fill(); ctx.lineWidth=(isCur)?3:1.7; ctx.strokeStyle=bd; ctx.stroke();
      ctx.fillStyle=tc; ctx.font='700 19px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(A[k]), x+cell/2, gy+chh/2);
    }

    // ── BAND 2 · seen set ──
    const by=142;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · seen(已看過的值)', PAD, by);
    rr(PAD,by+10,w-PAD*2,50,7); ctx.fillStyle='#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=COLOR.grid; ctx.stroke();
    // draw set chips
    const chipW=40, chipH=30, gap=12, sx=PAD+16, sy=by+20;
    ctx.textAlign='left'; ctx.textBaseline='middle';
    ctx.fillStyle=COLOR.dim; ctx.font='700 13px "JetBrains Mono", monospace';
    ctx.fillText('{', sx, sy+chipH/2);
    let cx=sx+16;
    for(let t=0;t<s.seen.length;t++){
      rr(cx,sy,chipW,chipH,6); ctx.fillStyle=COLOR.src; ctx.fill(); ctx.lineWidth=1.8; ctx.strokeStyle=COLOR.srcS; ctx.stroke();
      ctx.fillStyle=COLOR.srcT; ctx.font='700 15px "JetBrains Mono", monospace'; ctx.textAlign='center';
      ctx.fillText(String(s.seen[t]), cx+chipW/2, sy+chipH/2);
      cx+=chipW+gap;
    }
    // new addition preview
    if(s.add!==undefined && !s.hit){
      rr(cx,sy,chipW,chipH,6); ctx.fillStyle=COLOR.done; ctx.fill(); ctx.lineWidth=2.2; ctx.strokeStyle=COLOR.doneS; ctx.stroke();
      ctx.fillStyle=COLOR.doneT; ctx.font='700 15px "JetBrains Mono", monospace'; ctx.textAlign='center';
      ctx.fillText(String(s.add), cx+chipW/2, sy+chipH/2);
      ctx.fillStyle=COLOR.doneT; ctx.font='600 10px "Noto Sans TC", sans-serif'; ctx.textBaseline='top';
      ctx.fillText('← 新加', cx+chipW/2, sy+chipH+2);
      cx+=chipW+gap;
    }
    ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillStyle=COLOR.dim; ctx.font='700 13px "JetBrains Mono", monospace';
    ctx.fillText('}', cx+2, sy+chipH/2);

    // ── BAND 3 · verdict ──
    const ty=222;
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 本步:if (seen.count(nums[i])) return true;', PAD, ty);
    rr(PAD,ty+10,w-PAD*2,42,6);
    ctx.fillStyle=done?COLOR.bad:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?COLOR.badS:COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(s.i<0){ ctx.fillStyle=COLOR.text; ctx.font='600 12.5px "Noto Sans TC", sans-serif'; ctx.fillText('先查再放:在集合裡就是重複,不在才 insert', w/2, ty+31); }
    else if(s.hit){ ctx.fillStyle=COLOR.badT; ctx.font='700 14px "JetBrains Mono", monospace'; ctx.fillText('值 1 已在 seen → return true(提前結束)', w/2, ty+31); }
    else { ctx.fillStyle=COLOR.doneT; ctx.font='700 13px "JetBrains Mono", monospace'; ctx.fillText('值 '+A[s.i]+' 不在 seen → insert,繼續', w/2, ty+31); }
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
