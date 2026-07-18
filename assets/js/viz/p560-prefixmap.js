/* ============================================================
   P560 · Subarray Sum Equals K — 前綴和 + 雜湊計數 · viz
   關鍵重述:sum(i..j) = prefix[j] − prefix[i−1]。要 = k,
   等價於「以 j 結尾、和為 k 的子陣列個數」= 之前出現過幾次 prefix = prefix[j] − k。
   邊做前綴和邊查表:cnt += freq[prefix − k],再 freq[prefix]++。
   種子 freq[0]=1 → 讓「從頭開始」的子陣列也被算到。
   例 nums=[1,-1,1,-1], k=0 → 前綴 0,1,0,1,0 重複出現 → 答案 4。
   重點:freq[need] 可能 > 1,要「加次數」不是「加 1」。
     BAND 1  陣列 + 跑動前綴和(紅=當前元素)
     BAND 2  算式:prefix = P,need = P−k,freq[need] = ? → cnt += ?
     BAND 3  freq map(查表用的是「插入當前 prefix 之前」的狀態;藍=命中的 key)
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
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424', done:'#d9e8c7', doneS:'#5fa866', doneT:'#3f7a3a',
    off:'#f0f0ec', offS:'#deded8', offT:'#a8a8a0', coral:'#cf3535' };

  const A = [1,-1,1,-1], K = 0;
  // 每步:當前 index、prefix(該步累加後)、need=prefix-K、命中次數、cnt(累加後)、
  //        freqBefore(查表時看到的 map,插入當前 prefix 之前)、insertKey(接著要 ++ 的 key)
  const steps = [
    { idx:-1, prefix:0, cnt:0, phase:'intro', freqBefore:[[0,1]], insert:null,
      text:'<strong>INITIAL</strong> · <code>nums=[1,-1,1,-1]</code>,<code>k=0</code>。前綴和從 0 起跑,<strong>種子 <code>freq[0]=1</code></strong> —— 代表「空前綴」,好讓「從頭開始」的子陣列也被算到。' },
    { idx:0, val:1, prefix:1, need:1, found:0, cnt:0, phase:'run', freqBefore:[[0,1]], insert:1,
      text:'<strong>i=0</strong> · 加 <code>1</code> → <code>prefix=1</code>。找 <code>prefix−k = 1</code>:map 裡沒有 → <code>cnt += 0</code>。接著 <code>freq[1]++</code>。' },
    { idx:1, val:-1, prefix:0, need:0, found:1, cnt:1, phase:'run', freqBefore:[[0,1],[1,1]], insert:0,
      text:'<strong>i=1</strong> · 加 <code>-1</code> → <code>prefix=0</code>。找 <code>0</code>:<code>freq[0]=1</code> → <code>cnt += 1 = 1</code>(子陣列 <code>[1,-1]</code>)。接著 <code>freq[0]++</code> → 2。' },
    { idx:2, val:1, prefix:1, need:1, found:1, cnt:2, phase:'run', freqBefore:[[0,2],[1,1]], insert:1,
      text:'<strong>i=2</strong> · 加 <code>1</code> → <code>prefix=1</code>。找 <code>1</code>:<code>freq[1]=1</code> → <code>cnt += 1 = 2</code>(子陣列 <code>[-1,1]</code>)。接著 <code>freq[1]++</code> → 2。' },
    { idx:3, val:-1, prefix:0, need:0, found:2, cnt:4, phase:'done', freqBefore:[[0,2],[1,2]], insert:0,
      text:'<strong>i=3</strong> · 加 <code>-1</code> → <code>prefix=0</code>。找 <code>0</code>:<code>freq[0]=<strong>2</strong></code> → <code>cnt += 2 = 4</code>(<code>[1,-1,1,-1]</code> 和 <code>[1,-1]</code> 兩條)。<strong>freq 可能 &gt; 1,要加「次數」不是加 1</strong>。答案 = <strong>4</strong>。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,PAD=26;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,canvas.clientHeight);
    const done=s.phase==='done';

    // ── BAND 1 · array + prefix ──
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · nums + 跑動前綴和(紅=當前元素)', PAD, 24);

    const n=A.length, cell=Math.min(64,(w-2*PAD)/(n+1.6)), gx=PAD+8, gy=48, chh=40;
    for(let k=0;k<n;k++){
      const x=gx+k*cell, isCur=(k===s.idx), passed=(s.idx>=0 && k<s.idx);
      ctx.fillStyle=COLOR.dim; ctx.font='700 10px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('['+k+']', x+cell/2, gy-10);
      rr(x+3,gy,cell-6,chh,6);
      let bg=COLOR.cell,bd=COLOR.cellS,tc=COLOR.text;
      if(passed){ bg=COLOR.off; bd=COLOR.offS; tc=COLOR.offT; }
      if(isCur){ bg=COLOR.cur; bd=COLOR.curS; tc=COLOR.curT; }
      ctx.fillStyle=bg; ctx.fill(); ctx.lineWidth=isCur?3:1.6; ctx.strokeStyle=bd; ctx.stroke();
      ctx.fillStyle=tc; ctx.font='700 17px "JetBrains Mono", monospace';
      ctx.fillText(String(A[k]), x+cell/2, gy+chh/2);
    }
    // prefix badge on the right
    const px=gx+n*cell+16, pw=w-PAD-px;
    if(pw>90){ rr(px,gy,Math.min(150,pw),chh,7); ctx.fillStyle=COLOR.src; ctx.fill(); ctx.lineWidth=1.8; ctx.strokeStyle=COLOR.srcS; ctx.stroke();
      ctx.fillStyle=COLOR.srcT; ctx.font='700 13px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('prefix = '+s.prefix, px+Math.min(150,pw)/2, gy+chh/2); }

    // ── BAND 2 · equation + cnt ──
    const by=118;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · cnt += freq[prefix − k],再 freq[prefix]++', PAD, by);
    rr(PAD,by+10,w-PAD*2,46,6); ctx.fillStyle='#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(s.phase==='intro'){ ctx.fillStyle=COLOR.text; ctx.font='600 12.5px "Noto Sans TC", sans-serif';
      ctx.fillText('以 j 結尾、和為 k 的子陣列數 = 之前 prefix = (prefix − k) 出現過幾次', w/2, by+33); }
    else { ctx.fillStyle=COLOR.text; ctx.font='700 13.5px "JetBrains Mono", monospace';
      const hit = s.found>0 ? ('freq['+s.need+']='+s.found) : ('freq['+s.need+']=∅');
      ctx.fillText('prefix='+s.prefix+'  ·  need = '+s.prefix+'−'+K+' = '+s.need+'  ·  '+hit+'  →  cnt += '+s.found, w/2, by+33); }

    // cnt badge
    const cy=182;
    rr(w/2-70,cy,140,30,7); ctx.fillStyle=done?COLOR.done:COLOR.cur; ctx.fill(); ctx.lineWidth=2; ctx.strokeStyle=done?COLOR.doneS:COLOR.curS; ctx.stroke();
    ctx.fillStyle=done?COLOR.doneT:COLOR.curT; ctx.font='700 14px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('cnt = '+s.cnt, w/2, cy+15);

    // ── BAND 3 · freq map ──
    const ty=228;
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · freq(前綴和 → 出現次數,查表看「插入當前 prefix 前」· 藍=命中的 key)', PAD, ty);

    const pairs=s.freqBefore, cw=88, gap=14, totalW=pairs.length*cw+(pairs.length-1)*gap;
    let cx=(w-totalW)/2, cyy=ty+14, chh2=40;
    for(const [key,count] of pairs){
      const isHit = (s.phase!=='intro' && key===s.need);
      rr(cx,cyy,cw,chh2,7);
      let bg=COLOR.cell,bd=COLOR.cellS,tc=COLOR.text;
      if(isHit){ bg=COLOR.src; bd=COLOR.srcS; tc=COLOR.srcT; }
      ctx.fillStyle=bg; ctx.fill(); ctx.lineWidth=isHit?3:1.6; ctx.strokeStyle=bd; ctx.stroke();
      ctx.fillStyle=tc; ctx.font='700 14px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(key+' : '+count, cx+cw/2, cyy+chh2/2);
      cx+=cw+gap;
    }
    // pending insertion hint
    if(s.insert!==null && s.phase!=='intro'){
      ctx.fillStyle=COLOR.curT; ctx.font='600 11px "Noto Sans TC", sans-serif'; ctx.textAlign='center'; ctx.textBaseline='top';
      ctx.fillText('查完 → freq['+s.insert+']++', w/2, cyy+chh2+8);
    } else if(s.phase==='intro'){
      ctx.fillStyle=COLOR.dim; ctx.font='600 11px "Noto Sans TC", sans-serif'; ctx.textAlign='center'; ctx.textBaseline='top';
      ctx.fillText('種子 0:1 = 空前綴,讓「從頭到 j」剛好 = k 的子陣列被算進去', w/2, cyy+chh2+8);
    }
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
