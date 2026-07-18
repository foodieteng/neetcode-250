/* ============================================================
   P304 · Range Sum Query 2D — 二維前綴和 · 容斥 · viz
   prefix[i][j] = 從 (0,0) 到 (i-1,j-1) 這塊左上矩形的總和(多開一圈 0 邊界)。
   建表(容斥累積):prefix[i][j] = 上 + 左 − 左上 + matrix[i-1][j-1]。
   查詢任意矩形 (r1,c1)-(r2,c2) 也用容斥,O(1):
       sum = prefix[r2+1][c2+1]  (大矩形 D,含到右下)
           − prefix[r1][c2+1]    (減去上方長條 B)
           − prefix[r2+1][c1]    (減去左方長條 C)
           + prefix[r1][c1]      (加回被減兩次的左上角 A)
   例:LC 盤查 (2,1,4,3) → 38 − 24 − 14 + 8 = 8。
     LEFT   5×5 盤(標出當前容斥區域)
     RIGHT  容斥公式逐項累加 D − B − C + A
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
    grn:'#d9e8c7', grnS:'#5fa866', grnT:'#3f7a3a',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424', done:'#d9e8c7', doneS:'#5fa866', doneT:'#3f7a3a',
    off:'#f2f2ee', offS:'#dcdcd6', offT:'#b4b4ac', coral:'#cf3535' };

  const M = [ [3,0,1,4,2],[5,6,3,2,1],[1,2,0,1,5],[4,1,0,1,7],[1,0,3,0,5] ];
  const R = M.length, C = M[0].length;
  // 查詢矩形 (r1,c1)-(r2,c2) = rows2..4, cols1..3
  const Q = { r1:2, c1:1, r2:4, c2:3 };

  // 容斥四塊:matrix 座標(inclusive),role: add/sub,值,prefix 標籤
  const D = { r0:0,c0:0,r1:4,c1:3, role:'add', val:38, tag:'prefix[5][4]', name:'D 大矩形' };
  const B = { r0:0,c0:0,r1:1,c1:3, role:'sub', val:24, tag:'prefix[2][4]', name:'B 上長條' };
  const Cc= { r0:0,c0:0,r1:4,c1:0, role:'sub', val:14, tag:'prefix[5][1]', name:'C 左長條' };
  const A = { r0:0,c0:0,r1:1,c1:0, role:'add', val:8,  tag:'prefix[2][1]', name:'A 左上角(被減兩次→加回)' };

  const steps = [
    { region:null, phase:'intro', acc:null,
      text:'<strong>INITIAL</strong> · <code>prefix[i][j]</code> = 從 (0,0) 到 (i-1,j-1) 的左上矩形總和。查 <code>(2,1)-(4,3)</code> 用<strong>容斥</strong>,O(1)。' },
    { region:D, phase:'D', acc:'D',
      text:'<strong>D · 大矩形</strong> · <code>prefix[5][4] = 38</code> = 從左上角一路含到 (4,3) 的總和。先把它整塊拿來。' },
    { region:B, phase:'B', acc:'D−B',
      text:'<strong>− B · 上長條</strong> · <code>prefix[2][4] = 24</code>(rows 0–1)。查詢矩形從 row 2 起,上面兩列要<strong>減掉</strong>。' },
    { region:Cc, phase:'C', acc:'D−B−C',
      text:'<strong>− C · 左長條</strong> · <code>prefix[5][1] = 14</code>(col 0)。查詢矩形從 col 1 起,左邊那行要<strong>減掉</strong>。' },
    { region:A, phase:'A', acc:'D−B−C+A',
      text:'<strong>+ A · 左上角</strong> · <code>prefix[2][1] = 8</code>。這塊(rows 0–1 ∩ col 0)被 B 和 C <strong>各減了一次 = 減兩次</strong>,要<strong>加回一次</strong>。' },
    { region:'query', phase:'done', acc:'38 − 24 − 14 + 8',
      text:'<strong>結果</strong> · <code>38 − 24 − 14 + 8 = 8</code> = 查詢矩形 <code>(2,1)-(4,3)</code> 的總和(<code>2+0+1+1+0+1+0+3+0</code>)。O(1) 完成。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function inRegion(reg, r, c){ if(!reg||reg==='query') return false; return r>=reg.r0&&r<=reg.r1&&c>=reg.c0&&c<=reg.c1; }
  function inQuery(r,c){ return r>=Q.r1&&r<=Q.r2&&c>=Q.c1&&c<=Q.c2; }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,H=canvas.clientHeight,PAD=22;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,H);
    const reg=s.region;

    // ── LEFT · grid ──
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('5×5 盤(藍=加 · 紅=減 · 綠框=查詢)', PAD, 18);
    const gsz=Math.min(40, (Math.min(w*0.46, H-56))/C), gx=PAD, gy=30;
    for(let r=0;r<R;r++)for(let c=0;c<C;c++){
      const x=gx+c*gsz, y=gy+r*gsz;
      let bg=COLOR.cell,bd=COLOR.cellS,tc=COLOR.text;
      if(reg && reg!=='query'){
        if(inRegion(reg,r,c)){ if(reg.role==='add'){ bg=COLOR.src; bd=COLOR.srcS; tc=COLOR.srcT; } else { bg=COLOR.cur; bd=COLOR.curS; tc=COLOR.curT; } }
      }
      if(reg==='query' && inQuery(r,c)){ bg=COLOR.grn; bd=COLOR.grnS; tc=COLOR.grnT; }
      ctx.fillStyle=bg; ctx.fillRect(x,y,gsz,gsz);
      ctx.lineWidth=1; ctx.strokeStyle=COLOR.grid; ctx.strokeRect(x,y,gsz,gsz);
      ctx.fillStyle=tc; ctx.font='700 14px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(M[r][c]), x+gsz/2, y+gsz/2);
    }
    // query rectangle outline (always)
    ctx.strokeStyle=COLOR.grnS; ctx.lineWidth=3;
    ctx.strokeRect(gx+Q.c1*gsz, gy+Q.r1*gsz, (Q.c2-Q.c1+1)*gsz, (Q.r2-Q.r1+1)*gsz);

    // ── RIGHT · formula ──
    const rx=gx+C*gsz+30, rw=w-PAD-rx;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('容斥公式(逐項累加)', rx, 24);

    // four term rows
    const terms=[
      {sym:'+ D', tag:'prefix[5][4]', val:38, on:['D','B','C','A','query'], role:'add'},
      {sym:'− B', tag:'prefix[2][4]', val:24, on:['B','C','A','query'], role:'sub'},
      {sym:'− C', tag:'prefix[5][1]', val:14, on:['C','A','query'], role:'sub'},
      {sym:'+ A', tag:'prefix[2][1]', val:8,  on:['A','query'], role:'add'},
    ];
    let ty=42;
    for(const t of terms){
      const active=t.on.includes(s.phase);
      const isCur=(s.phase==='D'&&t.sym==='+ D')||(s.phase==='B'&&t.sym==='− B')||(s.phase==='C'&&t.sym==='− C')||(s.phase==='A'&&t.sym==='+ A');
      rr(rx, ty, rw, 34, 6);
      let bg=active?(t.role==='add'?COLOR.src:COLOR.cur):'#fafaf6';
      let bd=active?(t.role==='add'?COLOR.srcS:COLOR.curS):COLOR.grid;
      ctx.fillStyle=isCur?bg:(active?bg:'#fafaf6'); ctx.globalAlpha=active?1:0.45; ctx.fill();
      ctx.lineWidth=isCur?3:1.5; ctx.strokeStyle=isCur?(t.role==='add'?COLOR.srcS:COLOR.curS):bd; ctx.stroke();
      ctx.globalAlpha=1;
      ctx.fillStyle=active?(t.role==='add'?COLOR.srcT:COLOR.curT):COLOR.dim; ctx.font='700 14px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='middle';
      ctx.fillText(t.sym, rx+12, ty+17);
      ctx.font='600 11px "JetBrains Mono", monospace'; ctx.fillText(t.tag, rx+50, ty+17);
      ctx.textAlign='right'; ctx.font='700 15px "JetBrains Mono", monospace';
      ctx.fillText(String(t.val), rx+rw-12, ty+17);
      ty+=40;
    }
    // running result
    rr(rx, ty+4, rw, 40, 7);
    const done=s.phase==='done';
    ctx.fillStyle=done?COLOR.done:'#fafaf6'; ctx.fill(); ctx.lineWidth=2; ctx.strokeStyle=done?COLOR.doneS:COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(s.phase==='intro'){ ctx.fillStyle=COLOR.text; ctx.font='600 12px "Noto Sans TC", sans-serif'; ctx.fillText('大矩形 − 兩長條 + 左上角', rx+rw/2, ty+24); }
    else { ctx.fillStyle=done?COLOR.doneT:COLOR.text; ctx.font='700 15px "JetBrains Mono", monospace'; ctx.fillText(s.acc + (done?' = 8':''), rx+rw/2, ty+24); }
  }

  function update(){ const s=steps[step]; if(stepEl) stepEl.textContent=String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0'); if(labelEl) labelEl.innerHTML=s.text; draw(); }
  function next(){ if(step<steps.length-1){step++;update();}else stop(); }
  function prev(){ if(step>0){step--;update();} }
  function reset(){ stop(); step=0; update(); }
  function play(){ if(timer){stop();return;} bPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){stop();return;} next(); },1900); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} if(bPlay) bPlay.textContent='Play'; }
  bPrev&&bPrev.addEventListener('click',prev); bNext&&bNext.addEventListener('click',next); bPlay&&bPlay.addEventListener('click',play); bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();}); if(window.ResizeObserver){ new ResizeObserver(()=>{fit();draw();}).observe(canvas); }
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw); fit(); update();
})();
