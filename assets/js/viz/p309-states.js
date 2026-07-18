/* ============================================================
   P309 · Best Time to Buy and Sell Stock with Cooldown — 三狀態機 · viz
   每天結束時,你一定在三種狀態之一:
     hold  持有股票
     sold  今天「剛賣掉」(明天是冷凍期,不能買)
     rest  空手,而且不是剛賣 → 明天可以買
   轉移(全部只看昨天):
     hold[i] = max(hold[i-1], rest[i-1] - p[i])   ← 只能從 rest 買!這條就是冷凍期
     sold[i] = hold[i-1] + p[i]                   ← 賣掉必然昨天持有
     rest[i] = max(rest[i-1], sold[i-1])          ← 昨天賣的今天冷凍完,轉成 rest
   答案 max(sold[n-1], rest[n-1])(手上還抱著股票不會是最佳)
   prices=[1,2,3,0,2] → 3(買1賣3 = +2,冷凍一天,買0賣2 = +2… 實際最佳 3)
     BAND 1  prices 每日價格
     BAND 2  三個狀態列(紅=本日 · 藍=昨日來源)
     BAND 3  冷凍期就藏在「hold 只能從 rest 買」這一條
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
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424', done:'#d9e8c7', doneS:'#5fa866', doneT:'#3f7a3a', coral:'#cf3535' };

  const P = [1, 2, 3, 0, 2];
  const N = P.length;
  const HOLD = [-1, -1, -1,  1, 1];
  const SOLD = [ 0,  1,  2, -1, 3];
  const REST = [ 0,  0,  1,  2, 2];
  const ROWS = [
    { key:'hold', label:'hold', desc:'持有' },
    { key:'sold', label:'sold', desc:'剛賣' },
    { key:'rest', label:'rest', desc:'空手' },
  ];

  const steps = [
    { day:0,
      text:'<strong>DAY 0</strong> · <code>prices=[1,2,3,0,2]</code>。三個狀態:<code>hold</code> 持有、<code>sold</code> 今天剛賣、<code>rest</code> 空手可買。第 0 天:買了就是 <code>hold=−1</code>,沒買就是 <code>0</code>。' },
    { day:1,
      text:'<strong>DAY 1</strong>(價 2)· <code>hold=max(−1, 0−2)=−1</code>(不買,續抱)。<code>sold=hold[0]+2=1</code> —— 昨天買的 1 今天賣 2,賺 1。<code>rest=max(0,0)=0</code>。' },
    { day:2,
      text:'<strong>DAY 2</strong>(價 3)· <code>sold=hold[1]+3=2</code>(1 買 3 賣)。<code>rest=max(rest[1], sold[1])=max(0,1)=1</code> —— <strong>昨天賣的,今天冷凍期結束</strong>,獲利 1 轉進 rest。' },
    { day:3,
      text:'<strong>DAY 3</strong>(價 0)· <strong>關鍵一步</strong>:<code>hold=max(hold[2], rest[2]−0)=max(−1, 1)=1</code> —— 從 <strong>rest</strong> 買進!注意它讀的是 <code>rest[2]=1</code>(冷凍完的錢),<strong>不是</strong> <code>sold[2]=2</code>。<strong>冷凍期就是這樣被擋掉的。</strong>' },
    { day:4, done:true,
      text:'<strong>DAY 4</strong>(價 2)· <code>sold=hold[3]+2=1+2=3</code>。答案 <code>max(sold[4], rest[4])=max(3,2)=</code><strong>3</strong>(手上還抱股票不可能最佳,所以不看 hold)。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,h=canvas.clientHeight,PAD=26;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,h);
    const d=s.day, done=!!s.done;

    const LW=72;                                  // 左側列標籤寬
    const cw=Math.min(88,(w-2*PAD-LW)/N);
    const blockW=LW+N*cw, x0=(w-blockW)/2, gx=x0+LW;

    // ── BAND 1 · prices ──
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · prices(紅=今天)', PAD, 24);

    ctx.textAlign='right'; ctx.textBaseline='middle';
    ctx.fillStyle=COLOR.dim; ctx.font='700 11px "JetBrains Mono", monospace';
    ctx.fillText('price', gx-12, 73);

    for(let i=0;i<N;i++){
      const x=gx+i*cw, isCur=(i===d);
      ctx.fillStyle=COLOR.dim; ctx.font='700 11px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('day '+i, x+cw/2, 44);
      rr(x+4,56,cw-8,34,5);
      ctx.fillStyle=isCur?COLOR.cur:COLOR.cell; ctx.fill();
      ctx.lineWidth=isCur?3:1.8; ctx.strokeStyle=isCur?COLOR.curS:COLOR.cellS; ctx.stroke();
      ctx.fillStyle=isCur?COLOR.curT:COLOR.text; ctx.font='700 16px "JetBrains Mono", monospace';
      ctx.fillText(String(P[i]), x+cw/2, 74);
    }

    // ── BAND 2 · three state rows ──
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 三個狀態(紅=今天算出 · 藍=昨天的來源)', PAD, 122);

    const vals={hold:HOLD, sold:SOLD, rest:REST};
    for(let r=0;r<ROWS.length;r++){
      const row=ROWS[r], y=134+r*40;
      ctx.textAlign='right'; ctx.textBaseline='middle';
      ctx.fillStyle=COLOR.text; ctx.font='700 12.5px "JetBrains Mono", monospace';
      ctx.fillText(row.label, gx-40, y+17);
      ctx.fillStyle=COLOR.dim; ctx.font='600 10.5px "Noto Sans TC", sans-serif';
      ctx.fillText(row.desc, gx-12, y+17);

      for(let i=0;i<N;i++){
        const x=gx+i*cw;
        const filled=(i<=d);
        const isCur=(i===d);
        const isSrc=(d>0 && i===d-1);
        const isAns=(done && i===N-1 && (row.key==='sold'||row.key==='rest'));
        rr(x+4,y,cw-8,34,5);
        ctx.fillStyle=isAns?COLOR.done:(isCur?COLOR.cur:(isSrc?COLOR.src:(filled?COLOR.cell:'#f7f7f4')));
        ctx.fill();
        ctx.lineWidth=isAns?3:(isCur?3:(isSrc?2.4:1.6));
        ctx.strokeStyle=isAns?COLOR.doneS:(isCur?COLOR.curS:(isSrc?COLOR.srcS:COLOR.cellS)); ctx.stroke();
        ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillStyle=isAns?COLOR.doneT:(isCur?COLOR.curT:(isSrc?COLOR.srcT:(filled?COLOR.text:COLOR.grid)));
        ctx.font='700 15px "JetBrains Mono", monospace';
        ctx.fillText(filled?String(vals[row.key][i]):'·', x+cw/2, y+18);
      }
    }
    if(done){
      ctx.fillStyle=COLOR.doneT; ctx.font='700 10px "Noto Sans TC", sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('答案 = max(3, 2) = 3', gx+(N-1)*cw+cw/2, 134+3*40+6);
    }

    // ── BAND 3 · the cooldown insight ──
    const ty=276;
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 冷凍期藏在哪一行?', PAD, ty);
    rr(PAD,ty+10,w-PAD*2,52,6); ctx.fillStyle=(d>=3)?COLOR.done:'#fafaf6'; ctx.fill();
    ctx.lineWidth=1.6; ctx.strokeStyle=(d>=3)?COLOR.doneS:COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(d>=3){
      ctx.fillStyle=COLOR.doneT; ctx.font='700 12.5px "JetBrains Mono", monospace';
      ctx.fillText('hold[i] = max(hold[i−1], rest[i−1] − p[i])', w/2, ty+26);
      ctx.font='700 12px "Noto Sans TC", sans-serif';
      ctx.fillText('買進只能來自 rest,碰不到 sold —— 這就是冷凍期', w/2, ty+46);
    } else {
      ctx.fillStyle=COLOR.text; ctx.font='700 12.5px "JetBrains Mono", monospace';
      ctx.fillText('hold[i] 讀的是 rest[i−1],不是 sold[i−1]', w/2, ty+26);
      ctx.font='600 12px "Noto Sans TC", sans-serif';
      ctx.fillText('昨天剛賣的錢,今天不能拿來買 → 冷凍期', w/2, ty+46);
    }
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
