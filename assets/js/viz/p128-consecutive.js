/* ============================================================
   P128 · Longest Consecutive Sequence — 雜湊集合 + 只從左端起算 · viz
   全部丟進 hash set(去重 + O(1) 查詢)。對每個數 x:
     只有當 x−1 不在集合裡(x 是某段連續數的「最左端」)才開始往右數;
     x−1 在集合裡就跳過 —— 它不是起點,由更左的數負責數。
   從起點往右 while(x+1 in set) 累加長度,更新最大值。
   為何 O(n):每個數只當一次起點,內層 while 走過的數 = 該段所有成員,
   全部加起來剛好 = n(每個數被走一次)。所以雖有巢狀迴圈仍是線性。
   例 set={1,2,3,4,6,7,8}:起點 1(數到 4,長 4)、起點 6(數到 8,長 3)→ 答案 4。
     BAND 1  數線(藍=在集合 · 灰虛=不在 · 紅=正在檢視)
     BAND 2  起點測試:x−1 在集合嗎? → 起點(往右數)/ 跳過
     BAND 3  本段長度 + 目前最長
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

  const LINE = [0,1,2,3,4,5,6,7,8,9];          // 數線顯示範圍
  const PRESENT = new Set([1,2,3,4,6,7,8]);    // 在集合裡的數
  const examineOrder = [1,2,3,4,6,7,8];        // 依值檢視(hash 實際順序不定,結果相同)

  const steps = [];
  steps.push({ examine:null, phase:'intro', maxL:0, run:[],
    text:'<strong>INITIAL</strong> · 全部丟進 hash set:<code>{1,2,3,4,6,7,8}</code>(去重、O(1) 查)。技巧:<strong>只從每段的「最左端」起算</strong> —— 若 <code>x−1</code> 不在集合,x 才是起點。' });
  let maxL=0;
  for(const x of examineOrder){
    const isStart = !PRESENT.has(x-1);
    let run=[];
    if(isStart){ let t=x; while(PRESENT.has(t)){ run.push(t); t++; } maxL=Math.max(maxL, run.length); }
    steps.push({ examine:x, isStart, run, maxL, phase:(x===examineOrder[examineOrder.length-1]?'done':'run'),
      text: isStart
        ? '<strong>檢視 '+x+'</strong> · <code>'+(x-1)+'</code> 不在集合 → <strong>x 是起點</strong>。往右數 '+run.join('→')+',長度 <strong>'+run.length+'</strong>。最長 = '+maxL+(x===examineOrder[examineOrder.length-1]?'。答案 = <strong>4</strong>。':'。')
        : '<strong>檢視 '+x+'</strong> · <code>'+(x-1)+'</code> 在集合 → x <strong>不是起點,跳過</strong>(由更左的數負責數)。最長仍 = '+maxL+(x===examineOrder[examineOrder.length-1]?'。答案 = <strong>4</strong>。':'。')
    });
  }

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,PAD=26;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,canvas.clientHeight);
    const done=s.phase==='done';
    const runSet = new Set(s.run);

    // ── BAND 1 · number line ──
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 數線(藍=在集合 · 灰虛=不在 · 紅=正在檢視 · 綠=本段走過)', PAD, 22);

    const n=LINE.length, cell=Math.min(74,(w-2*PAD)/n), gx=(w-n*cell)/2, gy=40, chh=48;
    for(let i=0;i<n;i++){
      const v=LINE[i], x=gx+i*cell, inSet=PRESENT.has(v);
      const isExam=(v===s.examine);
      const inRun=runSet.has(v);
      rr(x+4,gy,cell-8,chh,7);
      let bg,bd,tc;
      if(!inSet){ bg=COLOR.off; bd=COLOR.offS; tc=COLOR.offT; }
      else { bg=COLOR.src; bd=COLOR.srcS; tc=COLOR.srcT; }
      if(inRun){ bg=COLOR.grn; bd=COLOR.grnS; tc=COLOR.grnT; }
      if(isExam && !done){ bg=COLOR.cur; bd=COLOR.curS; tc=COLOR.curT; }
      ctx.fillStyle=bg; ctx.fill();
      ctx.lineWidth=(isExam&&!done)?3:1.8; ctx.strokeStyle=bd;
      if(!inSet){ ctx.setLineDash([4,3]); } ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=tc; ctx.font='700 17px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(v), x+cell/2, gy+chh/2);
    }

    // ── BAND 2 · start test ──
    const by=112;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 起點測試:x−1 在集合嗎?(不在才是起點)', PAD, by);
    rr(PAD,by+10,w-PAD*2,44,6); ctx.fillStyle='#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(s.phase==='intro'){ ctx.fillStyle=COLOR.text; ctx.font='600 12.5px "Noto Sans TC", sans-serif';
      ctx.fillText('這一步是關鍵:非起點直接跳過,不重複往右數 → 每個數只被走一次', w/2, by+32); }
    else { ctx.font='700 13.5px "JetBrains Mono", monospace';
      ctx.fillStyle=s.isStart?COLOR.grnT:COLOR.offT;
      ctx.fillText('check('+(s.examine-1)+' in set) → '+(s.isStart?'否 → 起點!往右數':'是 → 跳過(非起點)'), w/2, by+32); }

    // ── BAND 3 · length + max ──
    const ty=176;
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 本段長度 + 目前最長(所有段長相加 = n → O(n))', PAD, ty);
    // two badges
    const bw=(w-2*PAD-20)/2;
    rr(PAD,ty+10,bw,42,7); ctx.fillStyle=(s.isStart&&s.phase!=='intro')?COLOR.grn:'#fafaf6'; ctx.fill();
    ctx.lineWidth=1.8; ctx.strokeStyle=(s.isStart&&s.phase!=='intro')?COLOR.grnS:COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='700 13px "JetBrains Mono", monospace';
    ctx.fillStyle=(s.isStart&&s.phase!=='intro')?COLOR.grnT:COLOR.dim;
    ctx.fillText(s.phase==='intro'?'本段長度 = —':(s.isStart?('本段 '+s.run.join('→')+' = '+s.run.length):'非起點,不數'), PAD+bw/2, ty+31);

    rr(PAD+bw+20,ty+10,bw,42,7); ctx.fillStyle=done?COLOR.done:COLOR.cur; ctx.fill();
    ctx.lineWidth=2; ctx.strokeStyle=done?COLOR.doneS:COLOR.curS; ctx.stroke();
    ctx.fillStyle=done?COLOR.doneT:COLOR.curT; ctx.font='700 14px "JetBrains Mono", monospace';
    ctx.fillText('最長 = '+s.maxL+(done?'  ← 答案':''), PAD+bw+20+bw/2, ty+31);
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
