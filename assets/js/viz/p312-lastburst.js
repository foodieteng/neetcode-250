/* ============================================================
   P312 · Burst Balloons — 區間 DP · 「最後一顆爆的是誰」 · viz
   dp[i][j] = 把「開區間 (i,j)」內所有氣球爆光的最大金幣;i、j 本身不爆,當邊界。
   反直覺的關鍵:枚舉「最後一顆爆的氣球 k」(不是第一顆)。
   當 k 最後爆,(i,k) 與 (k,j) 都已空 → k 的左右鄰居正好是「還沒爆的」i 和 j
   → 得 nums[i]*nums[k]*nums[j];而左右兩段互不干擾 → dp[i][k] + dp[k][j]。
   dp[i][j] = max_{i<k<j} ( dp[i][k] + dp[k][j] + nums[i]*nums[k]*nums[j] )
   padded nums = [1,3,1,5,8,1](原 [3,1,5,8] 兩端補 1),答案 dp[0][5] = 167。
     BAND 1  氣球列(藍=邊界 i,j 不爆 · 珊瑚=本步當「最後爆」的 k · 綠=兩子區間)
     BAND 2  dp[i][k] + dp[k][j] + nums[i]·nums[k]·nums[j]
     BAND 3  為什麼是「最後」不是「第一」
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
    pad:'#eeeeea', padS:'#d5d5cf', padT:'#a8a8a0', coral:'#d96e4e' };

  const NUM = [1,3,1,5,8,1];   // padded, index 0..5
  // 求 dp[0][5],i=0,j=5;枚舉 k
  const steps = [
    { k:null,
      text:'<strong>INITIAL</strong> · 原陣列 <code>[3,1,5,8]</code> 兩端補 <code>1</code> → <code>[1,3,1,5,8,1]</code>。<code>dp[i][j]</code> = 把<strong>開區間 (i,j)</strong> 內氣球爆光的最大金幣,<strong>i、j 不爆</strong>(當邊界)。求 <code>dp[0][5]</code>。' },
    { k:1, gain:3, left:0, right:159, total:162,
      text:'<strong>假設最後爆 k=1(值 3)</strong> · 那時 (0,1)、(1,5) 都已空,3 的左右鄰居正好是邊界 <code>nums[0]=1</code>、<code>nums[5]=1</code> → 得 <code>1×3×1=3</code>。加兩段 <code>dp[0][1]+dp[1][5]=0+159</code> → <strong>162</strong>。' },
    { k:3, gain:5, left:30, right:40, total:75,
      text:'<strong>假設最後爆 k=3(值 5)</strong> · 得 <code>1×5×1=5</code>,加 <code>dp[0][3]+dp[3][5]=30+40</code> → <strong>75</strong>。比較差。' },
    { k:4, gain:8, left:159, right:0, total:167, best:true,
      text:'<strong>假設最後爆 k=4(值 8)</strong> · 得 <code>1×8×1=8</code>,加 <code>dp[0][4]+dp[4][5]=159+0</code> → <strong>167</strong>。<strong>最佳!</strong>先爆光左邊 [3,1,5],最後才爆 8。' },
    { k:4, gain:8, left:159, right:0, total:167, best:true, done:true,
      text:'<strong>ANSWER</strong> · <code>dp[0][5] = max(162, 52, 75, 167) = </code><strong>167</strong>。<strong>為什麼枚舉「最後」?</strong>因為最後爆時兩側已空,k 的鄰居<strong>固定是 i、j</strong>,左右兩段才<strong>互不干擾</strong>、能拆成獨立子問題。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,h=canvas.clientHeight,PAD=26;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,h);
    const done=!!s.done, N=NUM.length;

    // ── BAND 1 · balloon row ──
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 補 1 後的氣球(藍=邊界 i,j 不爆 · 珊瑚=本步「最後爆」的 k · 綠=兩子區間)', PAD, 22);

    const cell=Math.min(72,(w-2*PAD)/N), gx=(w-N*cell)/2, gy=48, chh=44;
    for(let idx=0;idx<N;idx++){
      const x=gx+idx*cell;
      const isBoundary=(idx===0||idx===N-1);
      const isK=(s.k!==null && idx===s.k);
      const inLeft=(s.k!==null && idx>0 && idx<s.k);
      const inRight=(s.k!==null && idx>s.k && idx<N-1);
      ctx.fillStyle=COLOR.dim; ctx.font='700 10px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('['+idx+']', x+cell/2, gy-9);
      rr(x+4,gy,cell-8,chh,8);
      let bg=COLOR.cell,bd=COLOR.cellS,tc=COLOR.text;
      if(isBoundary){ bg=COLOR.src; bd=COLOR.srcS; tc=COLOR.srcT; }
      if(inLeft||inRight){ bg=COLOR.done; bd=COLOR.doneS; tc=COLOR.doneT; }
      if(isK){ bg=COLOR.cur; bd=COLOR.curS; tc=COLOR.curT; }
      ctx.fillStyle=bg; ctx.fill(); ctx.lineWidth=(isK)?3.2:(isBoundary?2.4:1.6); ctx.strokeStyle=bd; ctx.stroke();
      ctx.fillStyle=tc; ctx.font='700 19px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(NUM[idx]), x+cell/2, gy+chh/2);
      if(isK){ ctx.fillStyle=COLOR.curT; ctx.font='700 9.5px "Noto Sans TC", sans-serif'; ctx.fillText('最後爆', x+cell/2, gy+chh+11); }
      if(idx===0){ ctx.fillStyle=COLOR.srcT; ctx.font='700 9.5px "Noto Sans TC", sans-serif'; ctx.fillText('i', x+cell/2, gy+chh+11); }
      if(idx===N-1){ ctx.fillStyle=COLOR.srcT; ctx.font='700 9.5px "Noto Sans TC", sans-serif'; ctx.fillText('j', x+cell/2, gy+chh+11); }
    }

    // ── BAND 2 · formula ──
    const by=128;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · dp[i][k] + dp[k][j] + nums[i]·nums[k]·nums[j]', PAD, by);
    const boxY=by+10, bH=62;
    rr(PAD,boxY,w-PAD*2,bH,7);
    const act=(s.best && (s.k===4));
    ctx.fillStyle=(s.k===null)?'#fafaf6':(act?COLOR.done:'#fafaf6'); ctx.fill();
    ctx.lineWidth=1.8; ctx.strokeStyle=(s.k===null)?COLOR.grid:(act?COLOR.doneS:COLOR.grid); ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(s.k===null){
      ctx.fillStyle=COLOR.text; ctx.font='600 13px "Noto Sans TC", sans-serif';
      ctx.fillText('枚舉 k = i+1 .. j−1,假設「k 是這區間最後一顆爆的」,取金幣最大的 k', w/2, boxY+bH/2);
    } else {
      ctx.fillStyle=COLOR.text; ctx.font='700 13.5px "JetBrains Mono", monospace';
      ctx.fillText('k='+s.k+':  dp[0]['+s.k+']('+s.left+') + dp['+s.k+'][5]('+s.right+') + 1×'+NUM[s.k]+'×1', w/2, boxY+18);
      ctx.fillStyle=act?COLOR.doneT:COLOR.curT; ctx.font='700 16px "JetBrains Mono", monospace';
      ctx.fillText('= '+s.left+' + '+s.right+' + '+s.gain+' = '+s.total+(act?'   ← 最佳':''), w/2, boxY+44);
    }

    // ── BAND 3 · why last ──
    const ty=228;
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 為什麼枚舉「最後爆」而不是「第一個爆」', PAD, ty);
    rr(PAD,ty+10,w-PAD*2,52,7); ctx.fillStyle=done?COLOR.done:'#fafaf6'; ctx.fill();
    ctx.lineWidth=1.6; ctx.strokeStyle=done?COLOR.doneS:COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(done){
      ctx.fillStyle=COLOR.doneT; ctx.font='700 12.5px "Noto Sans TC", sans-serif';
      ctx.fillText('k 最後爆 → 兩側已空 → k 的鄰居固定是 i、j', w/2, ty+26);
      ctx.font='600 12px "Noto Sans TC", sans-serif';
      ctx.fillText('左右兩段從此互不干擾 → 拆成獨立子問題 dp[i][k]、dp[k][j]', w/2, ty+45);
    } else {
      ctx.fillStyle=COLOR.text; ctx.font='600 12.5px "Noto Sans TC", sans-serif';
      ctx.fillText('「第一個爆」會改變鄰居 → 兩側互相牽動,無法獨立', w/2, ty+26);
      ctx.font='600 12px "Noto Sans TC", sans-serif'; ctx.fillStyle=COLOR.dim;
      ctx.fillText('「最後爆」時兩側早已清空,k 只看得到固定的邊界 i、j', w/2, ty+45);
    }
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
