/* ============================================================
   P169 · Majority Element — Boyer-Moore 投票 · viz
   維護一個「候選人 candidate」和「票數 cnt」。掃過每個元素:
     cnt==0 → 換這個元素當新候選人,cnt=1
     == candidate → cnt++(同票加持)
     != candidate → cnt--(不同票抵銷)
   多數元素出現 > n/2 次,比其他所有元素加起來還多 → 抵銷不完,最後一定留著它。
   nums=[2,2,1,1,1,2,2]:candidate 2→(被抵銷歸零)→1→(又歸零)→2,答案 2。
     BAND 1  陣列(珊瑚=正在數的票)
     BAND 2  candidate + cnt(投票狀態)
     BAND 3  本步:歸零換人 / 同票+1 / 異票-1
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

  const A = [2,2,1,1,1,2,2];
  // 每步後的 candidate / cnt / 本步動作
  const steps = [
    { i:-1, cand:null, cnt:0, act:'intro',
      text:'<strong>INITIAL</strong> · <code>nums=[2,2,1,1,1,2,2]</code>。維護「候選人 <code>candidate</code>」和「票數 <code>cnt</code>」。核心:<strong>不同的兩票互相抵銷</strong>,多數元素抵銷不完,最後留下的就是它。' },
    { i:0, cand:2, cnt:1, act:'new',
      text:'<strong>nums[0]=2</strong> · <code>cnt==0</code> → 讓 <strong>2</strong> 當候選人,<code>cnt=1</code>。' },
    { i:1, cand:2, cnt:2, act:'up',
      text:'<strong>nums[1]=2</strong> · 和候選人相同 → <strong>加持</strong>,<code>cnt=2</code>。' },
    { i:2, cand:2, cnt:1, act:'down',
      text:'<strong>nums[2]=1</strong> · 和候選人 2 不同 → <strong>抵銷一票</strong>,<code>cnt=1</code>。' },
    { i:3, cand:2, cnt:0, act:'down',
      text:'<strong>nums[3]=1</strong> · 又一張不同票 → 抵銷,<code>cnt=0</code>。候選人 2 的票被清空了。' },
    { i:4, cand:1, cnt:1, act:'new',
      text:'<strong>nums[4]=1</strong> · <code>cnt==0</code> → <strong>換 1 當新候選人</strong>,<code>cnt=1</code>。注意候選人會中途換人!' },
    { i:5, cand:1, cnt:0, act:'down',
      text:'<strong>nums[5]=2</strong> · 和候選人 1 不同 → 抵銷,<code>cnt=0</code>。1 也被清空。' },
    { i:6, cand:2, cnt:1, act:'new', done:true,
      text:'<strong>nums[6]=2</strong> · <code>cnt==0</code> → <strong>2 再次當候選人</strong>,<code>cnt=1</code>。掃完 → <strong>return 2</strong>。2 出現 4 次 &gt; 7/2,抵銷後必然勝出。' },
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
    ctx.fillText('BAND 1 · nums(珊瑚=正在數的票 · 綠=候選人所在)', PAD, 24);

    const cell=Math.min(64,(w-2*PAD)/(N+0.5)), gx=(w-N*cell)/2, gy=54, chh=42;
    for(let k=0;k<N;k++){
      const x=gx+k*cell;
      const isCur=(k===s.i);
      const past=(k<s.i);
      const isCandVal=(past && s.cand!==null && A[k]===s.cand);
      ctx.fillStyle=COLOR.dim; ctx.font='700 10px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('['+k+']', x+cell/2, gy-10);
      rr(x+4,gy,cell-8,chh,7);
      let bg=COLOR.cell,bd=COLOR.cellS,tc=COLOR.text;
      if(past){ bg='#f5f5f1'; bd=COLOR.cellS; tc=COLOR.dim; }
      if(isCur){ bg=(s.act==='new')?COLOR.done:(s.act==='up'?COLOR.done:COLOR.bad); bd=(s.act==='down')?COLOR.badS:COLOR.doneS; tc=(s.act==='down')?COLOR.badT:COLOR.doneT;
        if(s.act==='new'){ bg=COLOR.cur; bd=COLOR.curS; tc=COLOR.curT; } }
      ctx.fillStyle=bg; ctx.fill(); ctx.lineWidth=isCur?3:1.6; ctx.strokeStyle=bd; ctx.stroke();
      ctx.fillStyle=tc; ctx.font='700 17px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(A[k]), x+cell/2, gy+chh/2);
    }

    // ── BAND 2 · vote state ──
    const by=134;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 投票狀態', PAD, by);
    // candidate box + cnt box
    const boxY=by+12, bh2=48;
    const cbW=Math.min(200,(w-2*PAD-16)*0.5), cbX=PAD;
    rr(cbX,boxY,cbW,bh2,8); ctx.fillStyle=COLOR.src; ctx.fill(); ctx.lineWidth=2; ctx.strokeStyle=COLOR.srcS; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillStyle=COLOR.srcT; ctx.font='600 12px "Noto Sans TC", sans-serif';
    ctx.fillText('候選人 candidate', cbX+cbW/2, boxY+15);
    ctx.font='700 22px "JetBrains Mono", monospace';
    ctx.fillText(s.cand===null?'—':String(s.cand), cbX+cbW/2, boxY+34);
    // cnt box
    const cnW=cbW, cnX=w-PAD-cnW;
    const cntZero=(s.cnt===0 && s.i>=0);
    rr(cnX,boxY,cnW,bh2,8); ctx.fillStyle=cntZero?COLOR.bad:COLOR.done; ctx.fill(); ctx.lineWidth=2; ctx.strokeStyle=cntZero?COLOR.badS:COLOR.doneS; ctx.stroke();
    ctx.fillStyle=cntZero?COLOR.badT:COLOR.doneT; ctx.font='600 12px "Noto Sans TC", sans-serif'; ctx.textBaseline='middle'; ctx.textAlign='center';
    ctx.fillText('票數 cnt'+(cntZero?'(歸零→下一個換人)':''), cnX+cnW/2, boxY+15);
    ctx.font='700 22px "JetBrains Mono", monospace';
    ctx.fillText(String(s.cnt), cnX+cnW/2, boxY+34);

    // ── BAND 3 · action ──
    const ty=214;
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · cnt==0 換人 / 同票 +1 / 異票 −1', PAD, ty);
    rr(PAD,ty+10,w-PAD*2,42,6); ctx.fillStyle=done?COLOR.done:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?COLOR.doneS:COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(s.act==='intro'){ ctx.fillStyle=COLOR.text; ctx.font='600 12.5px "Noto Sans TC", sans-serif'; ctx.fillText('把「不同的兩票」想成一對一抵銷,多數元素永遠抵銷不完', w/2, ty+31); }
    else if(done){ ctx.fillStyle=COLOR.doneT; ctx.font='700 13px "JetBrains Mono", monospace'; ctx.fillText('return candidate = 2(多數元素抵銷後勝出)', w/2, ty+31); }
    else if(s.act==='new'){ ctx.fillStyle=COLOR.curT; ctx.font='700 12.5px "JetBrains Mono", monospace'; ctx.fillText('cnt==0 → candidate = '+s.cand+',cnt = 1(換人)', w/2, ty+31); }
    else if(s.act==='up'){ ctx.fillStyle=COLOR.doneT; ctx.font='700 12.5px "JetBrains Mono", monospace'; ctx.fillText('同票 → cnt++ = '+s.cnt, w/2, ty+31); }
    else { ctx.fillStyle=COLOR.badT; ctx.font='700 12.5px "JetBrains Mono", monospace'; ctx.fillText('異票抵銷 → cnt-- = '+s.cnt, w/2, ty+31); }
  }

  function update(){ const s=steps[step]; if(stepEl) stepEl.textContent=String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0'); if(labelEl) labelEl.innerHTML=s.text; draw(); }
  function next(){ if(step<steps.length-1){step++;update();}else stop(); }
  function prev(){ if(step>0){step--;update();} }
  function reset(){ stop(); step=0; update(); }
  function play(){ if(timer){stop();return;} bPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){stop();return;} next(); },1600); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} if(bPlay) bPlay.textContent='Play'; }
  bPrev&&bPrev.addEventListener('click',prev); bNext&&bNext.addEventListener('click',next); bPlay&&bPlay.addEventListener('click',play); bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();}); if(window.ResizeObserver){ new ResizeObserver(()=>{fit();draw();}).observe(canvas); }
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw); fit(); update();
})();
