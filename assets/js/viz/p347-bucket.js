/* ============================================================
   P347 · Top K Frequent Elements — 桶排序(依頻率)· viz
   頻率最多是 n(全部相同)→ 可用「頻率當索引」的桶排序,免比較排序。
     1) 數頻率:counts[val] = 出現次數。
     2) 分桶:buckets[f] = 所有出現 f 次的值(索引 = 頻率,大小 n+1)。
     3) 從高頻往低頻掃(i = n → 0),收集到湊滿 k 個為止。
   桶索引本身就是排好序的頻率 → 不用排序、不用堆,O(n)。
   例 [1,1,1,2,2,3], k=2:counts{1:3,2:2,3:1} → buckets[3]=[1],[2]=[2],[1]=[3]
     從 i=6 往下,桶 3 收 1、桶 2 收 2 → 湊滿 2 個 → [1,2]。
     BAND 1  counts(值 × 頻率)
     BAND 2  buckets(索引 = 頻率 · 紅=正在掃)
     BAND 3  由高到低收集 → result
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

  const NB = 7;   // buckets 0..6 (n=6)
  const K = 2;
  const COUNTS = [[1,3],[2,2],[3,1]];     // val × freq
  const BUCKETS = [[],[3],[2],[1],[],[],[]]; // index = freq

  const steps = [
    { phase:'intro', counts:false, buckets:false, scan:-1, result:[],
      text:'<strong>INITIAL</strong> · <code>[1,1,1,2,2,3], k=2</code>。頻率最多 = n → 用<strong>頻率當桶索引</strong>的桶排序,免比較排序,O(n)。' },
    { phase:'count', counts:true, buckets:false, scan:-1, result:[],
      text:'<strong>① 數頻率</strong> · <code>counts = {1:3, 2:2, 3:1}</code>。<code>1</code> 出現 3 次、<code>2</code> 兩次、<code>3</code> 一次。' },
    { phase:'bucket', counts:true, buckets:true, scan:-1, result:[],
      text:'<strong>② 分桶</strong> · <code>buckets[f]</code> 放「出現 f 次的值」:<code>buckets[3]=[1]</code>、<code>buckets[2]=[2]</code>、<code>buckets[1]=[3]</code>。<strong>索引就是頻率,天然有序</strong>。' },
    { phase:'scan', counts:true, buckets:true, scan:3, result:[1],
      text:'<strong>③ 由高往低掃</strong> · 從 <code>i=6</code> 往下,桶 6/5/4 空,<code>桶 3</code> 有 <code>1</code> → 收下。result = <code>[1]</code>(還沒滿 k)。' },
    { phase:'scan', counts:true, buckets:true, scan:2, result:[1,2], done:true,
      text:'<strong>③ 續掃</strong> · <code>桶 2</code> 有 <code>2</code> → 收下。result = <code>[1,2]</code>,湊滿 <strong>k=2</strong> → 停止。答案 <code>[1,2]</code>。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,PAD=26;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,canvas.clientHeight);
    const done=!!s.done;

    // ── BAND 1 · counts ──
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · counts(值 × 頻率)', PAD, 20);
    if(s.counts){
      let cx=PAD, cy=30, chw=96, chh=34;
      for(const [val,freq] of COUNTS){
        rr(cx,cy,chw,chh,7); ctx.fillStyle=COLOR.src; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=COLOR.srcS; ctx.stroke();
        ctx.fillStyle=COLOR.srcT; ctx.font='700 14px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(val+' × '+freq, cx+chw/2, cy+chh/2); cx+=chw+12;
      }
    } else {
      ctx.fillStyle=COLOR.dim; ctx.font='600 12px "Noto Sans TC", sans-serif'; ctx.textAlign='left'; ctx.textBaseline='middle';
      ctx.fillText('nums = [1,1,1,2,2,3]  →  先數每個值出現幾次', PAD, 47);
    }

    // ── BAND 2 · buckets ──
    const by=82;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · buckets(索引 = 頻率 · 紅=正在掃 · 灰=掃過的空桶)', PAD, by);
    const cell=Math.min(96,(w-2*PAD)/NB), gx=(w-NB*cell)/2, gy=by+12, chh=52;
    for(let i=0;i<NB;i++){
      const x=gx+i*cell;
      const has=BUCKETS[i].length>0;
      const isCur=(s.scan===i);
      const scanned=(s.phase==='scan' && i>s.scan);
      rr(x+3,gy,cell-6,chh,6);
      let bg=COLOR.cell,bd=COLOR.cellS,tc=COLOR.text;
      if(s.buckets && has){ bg=COLOR.grn; bd=COLOR.grnS; tc=COLOR.grnT; }
      if(scanned){ bg=COLOR.off; bd=COLOR.offS; tc=COLOR.offT; }
      if(isCur){ bg=COLOR.cur; bd=COLOR.curS; tc=COLOR.curT; }
      ctx.fillStyle=bg; ctx.fill(); ctx.lineWidth=isCur?3:1.6; ctx.strokeStyle=bd; ctx.stroke();
      // values inside
      if(s.buckets && has){
        ctx.fillStyle=tc; ctx.font='700 16px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(BUCKETS[i].join(','), x+cell/2, gy+chh/2);
      } else {
        ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText('·', x+cell/2, gy+chh/2);
      }
      // freq index label
      ctx.fillStyle=isCur?COLOR.curT:COLOR.dim; ctx.font='700 11px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='top';
      ctx.fillText('f='+i, x+cell/2, gy+chh+5);
    }
    // scan direction arrow
    if(s.phase==='scan' || s.phase==='bucket'){
      ctx.fillStyle=COLOR.dim; ctx.font='600 11px "Noto Sans TC", sans-serif'; ctx.textAlign='right'; ctx.textBaseline='middle';
      ctx.fillText('◀ 由高頻往低頻掃', gx+NB*cell, gy-2);
    }

    // ── BAND 3 · result ──
    const ty=182;
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · result(收集到湊滿 k='+K+')', PAD, ty);
    let rxp=PAD, ryp=ty+12;
    if(s.result.length===0){ ctx.fillStyle=COLOR.dim; ctx.font='600 12px "Noto Sans TC", sans-serif'; ctx.textBaseline='middle'; ctx.fillText('(還沒收集)', PAD, ryp+18); }
    for(let d=0;d<s.result.length;d++){
      const justAdded=(d===s.result.length-1 && s.phase==='scan');
      rr(rxp,ryp,52,34,7); ctx.fillStyle=justAdded?COLOR.cur:COLOR.grn; ctx.fill();
      ctx.lineWidth=justAdded?2.5:1.6; ctx.strokeStyle=justAdded?COLOR.curS:COLOR.grnS; ctx.stroke();
      ctx.fillStyle=justAdded?COLOR.curT:COLOR.grnT; ctx.font='700 16px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(s.result[d]), rxp+26, ryp+17); rxp+=64;
    }
    if(done){ ctx.fillStyle=COLOR.doneT; ctx.font='700 12.5px "Noto Sans TC", sans-serif'; ctx.textAlign='left'; ctx.textBaseline='middle';
      ctx.fillText('✓ 湊滿 k=2,停止(不用掃到最低頻的桶 1)', rxp+8, ryp+17); }
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
