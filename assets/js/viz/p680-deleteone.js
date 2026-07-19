/* ============================================================
   P680 · Valid Palindrome II — 對撞雙指針 + 允許刪一個 · viz
   兩指針對撞比較,一路相符就內收。碰到第一個不相符 s[l] != s[r]:
   「最多刪一個」→ 兩種可能:刪左端 s[l] 或刪右端 s[r]。
   分別檢查剩下的子區間是否回文:isPali(l+1, r) || isPali(l, r-1)。
   任一成立即 true。因為只能刪一次,這個分叉只發生一次 → O(n)。
   例 "cbbcc":外層 c,c 相符;內層 b,c 不符 → 刪左 "bc" ✗、刪右 "bb" ✓ → true。
     BAND 1  字串(綠=已對稱 · 紅=衝突對 · 灰=試刪掉的 · 框=檢查的子區間)
     BAND 2  本步動作 / 兩個分支的結果
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

  const S = ['c','b','b','c','c'];
  // phases: intro / match / fork / branchA / branchB
  const steps = [
    { l:0, r:4, phase:'intro', matched:[], text:'<strong>INITIAL</strong> · <code>"cbbcc"</code>。對撞比較,相符就內收;<strong>碰到第一個不符時,最多刪一個字元</strong> → 試刪左或刪右。' },
    { l:1, r:3, phase:'match', matched:[0,4], text:'<strong>相符</strong> · <code>s[0]=\'c\' == s[4]=\'c\'</code> ✓ → <code>l++、r--</code>。外層對稱。' },
    { l:1, r:3, phase:'fork', matched:[0,4], mismatch:true, text:'<strong>不符!</strong> <code>s[1]=\'b\' != s[3]=\'c\'</code>。這裡用掉唯一一次刪除機會 → 分兩路試:<strong>刪左 s[1]</strong> 或 <strong>刪右 s[3]</strong>。' },
    { l:1, r:3, phase:'branchA', matched:[0,4], del:1, range:[2,3], result:false, text:'<strong>分支 A · 刪左</strong> · 拿掉 <code>s[1]=\'b\'</code>,檢查剩下 <code>[2,3]="bc"</code> → <code>b != c</code> → <strong>✗ 不是回文</strong>。' },
    { l:1, r:3, phase:'branchB', matched:[0,4], del:3, range:[1,2], result:true, done:true, text:'<strong>分支 B · 刪右</strong> · 拿掉 <code>s[3]=\'c\'</code>,檢查 <code>[1,2]="bb"</code> → <code>b == b</code> → <strong>✓ 回文</strong>。A||B 有一個成立 → <strong>true</strong>。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function tri(cx,cy,col){ ctx.beginPath(); ctx.moveTo(cx-6,cy+7); ctx.lineTo(cx+6,cy+7); ctx.lineTo(cx,cy-3); ctx.closePath(); ctx.fillStyle=col; ctx.fill(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,PAD=30;
    ctx.fillStyle=C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · s(綠=已對稱 · 紅=衝突對 · 灰=試刪 · 框=檢查子區間)', PAD, 22);
    const n=S.length, cell=Math.min(72,(w-2*PAD)/n-10), gp=((w-2*PAD)-n*cell)/(n-1), gy=56, chh=52;
    const inMatched = k => s.matched.indexOf(k)>=0;
    const branch = s.phase==='branchA'||s.phase==='branchB';
    for(let k=0;k<n;k++){
      const x=PAD+k*(cell+gp);
      const isConflict = s.mismatch && (k===s.l||k===s.r);
      const isDel = branch && k===s.del;
      const isL=(k===s.l), isR=(k===s.r);
      rr(x,gy,cell,chh,8);
      let bg=C.cell,bd=C.cellS,tc=C.text;
      if(inMatched(k) || s.done && !isDel && !(branch && (k<s.range[0]||k>s.range[1]) && !inMatched(k))){ bg=C.grn; bd=C.grnS; tc=C.grnT; }
      if(s.phase==='match' && (isL||isR)){ /* current pointers on their way */ }
      if((isL||isR) && !s.mismatch && !branch && s.phase!=='intro' && !inMatched(k)){ bg=(isL?C.cur:C.src); bd=(isL?C.curS:C.srcS); tc=(isL?C.curT:C.srcT); }
      if(isConflict){ bg=C.cur; bd=C.curS; tc=C.curT; }
      if(isDel){ bg=C.off; bd=C.offS; tc=C.offT; }
      ctx.fillStyle=bg; ctx.fill(); ctx.lineWidth=(isConflict||isDel)?3:1.7; ctx.strokeStyle=bd; ctx.stroke();
      ctx.fillStyle=tc; ctx.font='700 23px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(S[k], x+cell/2, gy+chh/2);
      if(isDel){ ctx.strokeStyle=C.offT; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(x+10,gy+chh/2); ctx.lineTo(x+cell-10,gy+chh/2); ctx.stroke(); }
      ctx.fillStyle=C.dim; ctx.font='600 10px "JetBrains Mono", monospace'; ctx.textBaseline='top';
      ctx.fillText(String(k), x+cell/2, gy+chh+6);
    }
    // sub-range bracket during branch
    if(branch){
      const a=s.range[0], b=s.range[1];
      const x1=PAD+a*(cell+gp), x2=PAD+b*(cell+gp)+cell;
      ctx.strokeStyle=s.result?C.grnS:C.curS; ctx.lineWidth=2.4; ctx.setLineDash([4,3]);
      ctx.strokeRect(x1-3, gy-4, (x2-x1)+6, chh+8); ctx.setLineDash([]);
      ctx.fillStyle=s.result?C.grnT:C.curT; ctx.font='700 11px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='bottom';
      ctx.fillText(s.result?'✓ 回文':'✗ 不是回文', (x1+x2)/2, gy-6);
    } else if(!s.done && s.phase!=='intro'){
      // l / r pointers
      const lx=PAD+s.l*(cell+gp)+cell/2, rx=PAD+s.r*(cell+gp)+cell/2;
      tri(lx, gy-10, C.curS); ctx.fillStyle=C.curT; ctx.font='700 11px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='bottom'; ctx.fillText('l', lx, gy-12);
      tri(rx, gy-10, C.srcS); ctx.fillStyle=C.srcT; ctx.fillText('r', rx, gy-12);
    } else if(s.phase==='intro'){
      const lx=PAD+s.l*(cell+gp)+cell/2, rx=PAD+s.r*(cell+gp)+cell/2;
      tri(lx, gy-10, C.curS); ctx.fillStyle=C.curT; ctx.font='700 11px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='bottom'; ctx.fillText('l', lx, gy-12);
      tri(rx, gy-10, C.srcS); ctx.fillStyle=C.srcT; ctx.fillText('r', rx, gy-12);
    }
    // BAND 2
    const by=134;
    ctx.fillStyle=C.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 不符時:isPali(l+1, r) || isPali(l, r-1)', PAD, by);
    rr(PAD,by+10,w-PAD*2,44,6); ctx.fillStyle=s.done?C.grn:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=s.done?C.grnS:C.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='600 12.5px "Noto Sans TC", sans-serif';
    let msg, col=C.text;
    if(s.phase==='intro'){ msg='一路相符就內收;第一個不符,用掉唯一的刪除機會'; }
    else if(s.phase==='match'){ msg='兩端相等 → 內收,繼續往中間比'; col=C.grnT; }
    else if(s.phase==='fork'){ msg='s[l] != s[r] → 分兩路:刪左 s[l] 或刪右 s[r],各試一次'; col=C.curT; }
    else if(s.phase==='branchA'){ msg='刪左:檢查 [l+1, r] 是否回文 → 這裡失敗,再看分支 B'; col=C.curT; }
    else if(s.phase==='branchB'){ msg='刪右:檢查 [l, r-1] 是否回文 → 成功!兩路有一路成立即 true'; col=C.grnT; }
    ctx.fillStyle=col; ctx.fillText(msg, w/2, by+32);
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
