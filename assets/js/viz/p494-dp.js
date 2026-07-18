/* ============================================================
   P494 · Target Sum — ± 號改寫成 0/1 背包「計數」 · viz
   每個數字給 + 或 −;設正號那堆和 = P、負號那堆和 = N:
       P − N = target
       P + N = total
   兩式相加 ⇒ P = (target + total) / 2  ← 固定值!
   於是「有幾種 ± 組合湊出 target」= 「有幾個子集和 = P」
   → 0/1 背包計數(內層由大到小,每個數只用一次)
   例 nums=[1,1,1,1,1], target=3 → total=5, P=(3+5)/2=4 → C(5,4)=5
     BAND 1  dp[s]:湊出正號和 s 的方法數(紅=本步更新)
     BAND 2  改寫:P − N = target、P + N = total ⇒ P = (target+total)/2
     BAND 3  說明:為什麼是計數背包(OR→+)、為什麼由大到小
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

  const TOTAL = 5, TARGET = 3, PLUS = 4;   // nums = [1,1,1,1,1]
  const steps = [
    { k:0, dp:[1,0,0,0,0], neu:[],
      text:'<strong>INITIAL</strong> · <code>nums=[1,1,1,1,1]</code>,<code>target=3</code>。先改寫:正號堆 <code>P</code>、負號堆 <code>N</code> → <code>P−N=3</code>、<code>P+N=5</code> ⇒ <strong><code>P=4</code></strong>。問題變成「<strong>有幾個子集和 = 4</strong>」。<code>dp[0]=1</code>(空集合一種)。' },
    { k:1, dp:[1,1,0,0,0], neu:[1],
      text:'放入第 1 個 <strong>1</strong>:<code>dp[1] += dp[0]</code> → 1。目前 dp = 各種和的<strong>方法數</strong>(不是能不能,是<strong>幾種</strong>)。' },
    { k:2, dp:[1,2,1,0,0], neu:[1,2],
      text:'放入第 2 個 <strong>1</strong>:<code>dp[2] += dp[1]</code>、<code>dp[1] += dp[0]</code>。和=1 有 2 種(選第一個或第二個)。' },
    { k:3, dp:[1,3,3,1,0], neu:[1,2,3],
      text:'放入第 3 個 <strong>1</strong>:整排 = <strong>二項式係數</strong> C(3,s) = 1,3,3,1。這正是「從 3 個裡挑 s 個」。' },
    { k:4, dp:[1,4,6,4,1], neu:[1,2,3,4],
      text:'放入第 4 個 <strong>1</strong>:C(4,s) = 1,4,6,4,1。<code>dp[4]=1</code>(四個全選)。' },
    { k:5, dp:[1,5,10,10,5], neu:[1,2,3,4], done:true,
      text:'放入第 5 個 <strong>1</strong>:<code>dp[4] = C(5,4) = </code><strong>5</strong> —— 從 5 個 1 挑 4 個給正號、剩 1 個給負號,<code>4−1=3</code> ✓。答案 = <strong>5</strong>。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,h=canvas.clientHeight,PAD=26;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,h);
    const neuSet=new Set(s.neu);
    const done=!!s.done;

    // ── BAND 1 · dp counts ──
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · dp[s] = 湊出正號和 s 的「方法數」(紅=本步更新 · 目標 P=4)', PAD, 24);

    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(s.k>0){
      const chx=w/2, chy=54;
      ctx.fillStyle=COLOR.text; ctx.font='600 12.5px "Noto Sans TC", sans-serif'; ctx.textAlign='right';
      ctx.fillText('本步放入第 '+s.k+' 個數字  ', chx-14, chy);
      rr(chx-8,chy-15,42,30,6); ctx.fillStyle=COLOR.cur; ctx.fill(); ctx.lineWidth=2.4; ctx.strokeStyle=COLOR.curS; ctx.stroke();
      ctx.fillStyle=COLOR.curT; ctx.font='700 17px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.fillText('1', chx+13, chy+1);
    } else {
      ctx.fillStyle=COLOR.dim; ctx.font='600 12.5px "Noto Sans TC", sans-serif';
      ctx.fillText('nums = [1, 1, 1, 1, 1] · target = 3 · total = 5 · P = 4', w/2, 54);
    }

    // dp cells 0..PLUS
    const NC=PLUS+1; const cw=Math.min(76,(w-2*PAD)/(NC+1)); const gx=(w-NC*cw)/2, gy=102, chh=48;
    for(let sm=0;sm<NC;sm++){ const x=gx+sm*cw; const val=s.dp[sm]; const isNew=neuSet.has(sm); const isAns=(done&&sm===PLUS);
      ctx.fillStyle=COLOR.dim; ctx.font='700 11px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('和 '+sm, x+cw/2, gy-14);
      rr(x+4,gy,cw-8,chh,5);
      ctx.fillStyle=isAns?COLOR.done:(isNew?COLOR.cur:(val>0?COLOR.src:COLOR.cell)); ctx.fill();
      ctx.lineWidth=isAns?3.4:(isNew?3.2:1.8); ctx.strokeStyle=isAns?COLOR.doneS:(isNew?COLOR.curS:(val>0?COLOR.srcS:COLOR.cellS)); ctx.stroke();
      ctx.fillStyle=isAns?COLOR.doneT:(isNew?COLOR.curT:(val>0?COLOR.srcT:COLOR.grid)); ctx.font='700 20px "JetBrains Mono", monospace';
      ctx.fillText(String(val), x+cw/2, gy+chh/2+1);
      if(sm===PLUS){ ctx.fillStyle=done?COLOR.doneT:COLOR.coral; ctx.font='700 10px "Noto Sans TC", sans-serif'; ctx.fillText('← 答案 P', x+cw/2, gy+chh+13); }
    }

    // ── BAND 2 · the reframe ──
    const by=196;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · ± 號 → 子集和(P 是固定值,不是變數)', PAD, by);
    const boxY=by+10, bH=52; rr(PAD,boxY,w-PAD*2,bH,6);
    ctx.fillStyle='#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillStyle=COLOR.text; ctx.font='700 13px "JetBrains Mono", monospace';
    ctx.fillText('P − N = target = 3　　P + N = total = 5', w/2, boxY+16);
    ctx.fillStyle=COLOR.curT; ctx.font='700 13px "JetBrains Mono", monospace';
    ctx.fillText('兩式相加 ⇒ P = (target + total) / 2 = 4', w/2, boxY+37);

    // ── BAND 3 · note ──
    const ty=286;
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 計數背包(和 416 只差聚合方式)', PAD, ty);
    rr(PAD,ty+10,w-PAD*2,40,6); ctx.fillStyle=done?COLOR.done:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?COLOR.doneS:COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(done){ ctx.fillStyle=COLOR.doneT; ctx.font='700 12.5px "JetBrains Mono", monospace'; ctx.fillText('416 問「能不能」用 OR · 494 問「幾種」用 +;內層一樣由大到小(每個數只用一次)', w/2, ty+30); }
    else { ctx.fillStyle=COLOR.text; ctx.font='600 12.5px "Noto Sans TC", sans-serif'; ctx.fillText('dp[i] += dp[i − num]:每個數字只能用一次 → 內層必須由大到小', w/2, ty+30); }
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
