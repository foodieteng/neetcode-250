/* ============================================================
   P271 · Encode and Decode Strings — 長度前綴分幀 · viz
   編碼:每個字串前面放「長度 + @」→  len@payload  接起來。
     ["cat","n@p","hi"] → "3@cat" + "3@n@p" + "2@hi" = "3@cat3@n@p2@hi"
   解碼:從 i 起,找第一個 '@'(位置 j)→ 長度 = stoi(s[i..j-1]);
     payload = 接下來的「剛好 len 個字元」;i 跳到 payload 之後。
   為什麼穩:長度是純數字,所以「從 i 找到的第一個 '@'」一定是分幀符;
     而 payload 是「按長度讀」,裡面就算有 '@' 或數字也只當資料,絕不誤判。
     → 天生支援任意 256 ASCII 字元(follow-up)。
   看第 2 段 "n@p":內含 '@' 卻不會斷幀,因為我們是按長度跳過去的。
     BAND 1  編碼字串(藍=長度數字 · 灰=分幀@ · 綠=payload)
     BAND 2  本步解析:i → 找@ → 讀長度 → 按長度取 payload
     BAND 3  解碼出的列表
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

  const ENC = "3@cat3@n@p2@hi";
  const N = ENC.length;
  // 每個字元的角色:len(長度數字) / frame(分幀@) / pay(payload)
  const ROLE = ['len','frame','pay','pay','pay','len','frame','pay','pay','pay','len','frame','pay','pay'];
  //             0     1       2c   3a   4t   5     6       7n   8@   9p   10    11      12h  13i

  const steps = [
    { i:-1, phase:'intro', dec:[],
      text:'<strong>INITIAL</strong> · 編碼把每個字串寫成 <code>len@payload</code> 接起來:<code>["cat","n@p","hi"] → "3@cat3@n@p2@hi"</code>。解碼「按長度讀」,不靠掃描分隔符。' },
    { i:0, j:1, len:3, pay:[2,4], nexti:5, phase:'run', dec:['cat'],
      text:'<strong>i=0</strong> · 找第一個 <code>@</code> → j=1。長度 = <code>stoi("3")=3</code>。往後讀<strong>剛好 3 個字元</strong> → <code>"cat"</code>。i 跳到 <code>2+3=5</code>。' },
    { i:5, j:6, len:3, pay:[7,9], nexti:10, phase:'run', dec:['cat','n@p'],
      text:'<strong>i=5</strong> · 找 <code>@</code> → j=6。長度 3 → 讀 <code>"n@p"</code>。<strong>裡面那個 <code>@</code>(index 8)是資料、不是分幀符</strong> —— 因為我們按長度跳,i 直接到 <code>7+3=10</code>,根本沒去解析它。' },
    { i:10, j:11, len:2, pay:[12,13], nexti:14, phase:'done', dec:['cat','n@p','hi'],
      text:'<strong>i=10</strong> · 找 <code>@</code> → j=11。長度 2 → 讀 <code>"hi"</code>。i 跳到 14 = 結束。解碼完成 <code>["cat","n@p","hi"]</code>。任意字元都不會斷幀。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function tri(cx,cy,dir,sz,col){ ctx.beginPath(); if(dir==='up'){ctx.moveTo(cx-sz,cy+sz);ctx.lineTo(cx+sz,cy+sz);ctx.lineTo(cx,cy-sz);} ctx.closePath(); ctx.fillStyle=col; ctx.fill(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,PAD=24;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,canvas.clientHeight);
    const done=s.phase==='done';

    // ── BAND 1 · encoded string ──
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · encoded(藍=長度 · 灰=分幀@ · 綠=payload)', PAD, 20);
    const cell=Math.min(56,(w-2*PAD)/N), gx=(w-N*cell)/2, gy=44, chh=42;
    for(let k=0;k<N;k++){
      const x=gx+k*cell, role=ROLE[k];
      const inPay = s.pay && k>=s.pay[0] && k<=s.pay[1];
      const isFrameJ = s.j===k;
      const isI = s.i===k;
      rr(x+2,gy,cell-4,chh,5);
      let bg=COLOR.cell,bd=COLOR.cellS,tc=COLOR.text;
      if(role==='len'){ bg=COLOR.src; bd=COLOR.srcS; tc=COLOR.srcT; }
      else if(role==='frame'){ bg=COLOR.off; bd=COLOR.offS; tc=COLOR.text; }
      else if(role==='pay'){ bg=COLOR.grn; bd=COLOR.grnS; tc=COLOR.grnT; }
      // dim chars not yet reached / already consumed handled by segment box below
      ctx.fillStyle=bg; ctx.fill(); ctx.lineWidth=1.5; ctx.strokeStyle=bd; ctx.stroke();
      ctx.fillStyle=tc; ctx.font='700 16px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(ENC[k], x+cell/2, gy+chh/2);
      // index
      ctx.fillStyle=COLOR.dim; ctx.font='600 8px "JetBrains Mono", monospace'; ctx.textBaseline='top';
      ctx.fillText(String(k), x+cell/2, gy+chh+3);
    }
    // segment box (i .. end of payload)
    if(s.phase!=='intro'){
      const x1=gx+s.i*cell, x2=gx+(s.pay[1]+1)*cell;
      ctx.strokeStyle=COLOR.curS; ctx.lineWidth=2.4; ctx.setLineDash([4,3]);
      ctx.strokeRect(x1+1, gy-3, (x2-x1)-2, chh+6); ctx.setLineDash([]);
      // i pointer
      tri(gx+s.i*cell+cell/2, gy-9, 'up', 5, COLOR.curS);
      ctx.fillStyle=COLOR.curT; ctx.font='700 9px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='bottom';
      ctx.fillText('i', gx+s.i*cell+cell/2, gy-10);
      // j pointer (the framing @)
      ctx.fillStyle=COLOR.text; ctx.font='700 9px "JetBrains Mono", monospace';
      ctx.fillText('j=@', gx+s.j*cell+cell/2, gy-10);
    }

    // ── BAND 2 · parse step ──
    const by=110;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · find(@)=j → len=stoi(s[i..j-1]) → 讀剛好 len 個字元', PAD, by);
    rr(PAD,by+10,w-PAD*2,44,6); ctx.fillStyle='#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(s.phase==='intro'){ ctx.fillStyle=COLOR.text; ctx.font='600 12.5px "Noto Sans TC", sans-serif';
      ctx.fillText('長度是純數字 → 第一個 @ 必為分幀符;payload 按長度讀,內含 @ 也只當資料', w/2, by+32); }
    else { ctx.font='700 13px "JetBrains Mono", monospace'; ctx.fillStyle=COLOR.text;
      ctx.fillText('i='+s.i+' → j='+s.j+' → len='+s.len+' → payload = s['+(s.j+1)+'..'+s.pay[1]+'] = "'+ENC.slice(s.pay[0],s.pay[1]+1)+'" → i='+s.nexti, w/2, by+32); }

    // ── BAND 3 · decoded list ──
    const ty=172;
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · decoded 列表', PAD, ty);
    let cx=PAD, cyy=ty+12;
    if(s.dec.length===0){ ctx.fillStyle=COLOR.dim; ctx.font='600 12px "Noto Sans TC", sans-serif'; ctx.textBaseline='middle'; ctx.fillText('(還沒解出任何字串)', PAD, cyy+18); }
    for(let d=0;d<s.dec.length;d++){
      const label='"'+s.dec[d]+'"';
      ctx.font='700 14px "JetBrains Mono", monospace'; const tw=ctx.measureText(label).width+22;
      const justAdded=(d===s.dec.length-1 && s.phase!=='intro');
      rr(cx,cyy,tw,32,7); ctx.fillStyle=justAdded?COLOR.cur:COLOR.grn; ctx.fill();
      ctx.lineWidth=justAdded?2.5:1.5; ctx.strokeStyle=justAdded?COLOR.curS:COLOR.grnS; ctx.stroke();
      ctx.fillStyle=justAdded?COLOR.curT:COLOR.grnT; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(label, cx+tw/2, cyy+16); cx+=tw+12;
    }
    if(done){ ctx.fillStyle=COLOR.doneT; ctx.font='700 12px "Noto Sans TC", sans-serif'; ctx.textAlign='left'; ctx.textBaseline='middle';
      ctx.fillText('✓ 完整還原,含帶 @ 的 "n@p"', PAD, cyy+52); }
  }

  function update(){ const s=steps[step]; if(stepEl) stepEl.textContent=String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0'); if(labelEl) labelEl.innerHTML=s.text; draw(); }
  function next(){ if(step<steps.length-1){step++;update();}else stop(); }
  function prev(){ if(step>0){step--;update();} }
  function reset(){ stop(); step=0; update(); }
  function play(){ if(timer){stop();return;} bPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){stop();return;} next(); },2000); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} if(bPlay) bPlay.textContent='Play'; }
  bPrev&&bPrev.addEventListener('click',prev); bNext&&bNext.addEventListener('click',next); bPlay&&bPlay.addEventListener('click',play); bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();}); if(window.ResizeObserver){ new ResizeObserver(()=>{fit();draw();}).observe(canvas); }
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw); fit(); update();
})();
