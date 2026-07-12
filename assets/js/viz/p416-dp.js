/* ============================================================
   P416 · Partition Equal Subset Sum — 0/1 背包(子集和)· viz
   兩子集和相等 ⟺ 總和偶數,且存在子集和 = 總和/2 = target。
   dp[s] = 能否用「已看過的數」湊出和 s(布林)。dp[0]=true。
   每放入一個 num,對每個已可達的和 s,s+num 也變可達 → dp[s]|=dp[s-num]。
   為了「每個數只用一次(0/1)」,內層 s 要「由大到小」掃(見 code)。
   例 nums=[1,2,3,4],target=5:放到 3 時湊出 5={2,3} → true
     BAND 1  dp[]:各和是否可達(綠=可達 · 珊瑚=本步新增)
     BAND 2  放入 num:s 可達 → s+num 也可達
     BAND 3  說明:由大到小掃 = 每個數只用一次
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
    cur:'#fbe7df', curS:'#d96e4e', curT:'#b3502f', done:'#d9e8c7', doneS:'#5fa866', doneT:'#3f7a3a', coral:'#d96e4e' };

  const NUMS = [1, 2, 3, 4];
  const TARGET = 5;                  // 總和 10 / 2
  const T = true, F = false;
  const steps = [
    { num:null, dp:[T,F,F,F,F,F], neu:[],
      text:'<strong>INITIAL</strong> · 總和 10、目標 <code>target = 5</code>。<code>dp[s]</code> = 能否湊出和 <code>s</code>。<code>dp[0]=true</code>(空集合湊出 0)。' },
    { num:1, dp:[T,T,F,F,F,F], neu:[1],
      text:'放入 <strong>1</strong>:<code>0</code> 可達 → <code>0+1=1</code> 也可達。可達和 = {0, 1}。' },
    { num:2, dp:[T,T,T,T,F,F], neu:[2,3],
      text:'放入 <strong>2</strong>:<code>0→2</code>、<code>1→3</code> 變可達。可達和 = {0,1,2,3}。' },
    { num:3, dp:[T,T,T,T,T,T], neu:[4,5], done:true,
      text:'放入 <strong>3</strong>:<code>1→4</code>、<code>2→5</code>(=target!)。找到子集 <code>{2,3}=5</code> → <strong>true</strong>。' },
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

    // ── BAND 1 header
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · dp[s]:能否湊出和 s?(綠=可達 · 珊瑚=本步新增可達 · 灰=不可達)', PAD, 24);

    // num chip (which number we're adding this step)
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(s.num!==null){
      const chx=w/2, chy=52;
      ctx.fillStyle=COLOR.text; ctx.font='600 12.5px "Noto Sans TC", sans-serif'; ctx.textAlign='right';
      ctx.fillText('本步放入的數  ', chx-16, chy);
      rr(chx-10,chy-15,44,30,6); ctx.fillStyle=COLOR.cur; ctx.fill(); ctx.lineWidth=2.4; ctx.strokeStyle=COLOR.curS; ctx.stroke();
      ctx.fillStyle=COLOR.curT; ctx.font='700 17px "JetBrains Mono", monospace'; ctx.textAlign='center';
      ctx.fillText(String(s.num), chx+12, chy+1);
    } else {
      ctx.fillStyle=COLOR.dim; ctx.font='600 12.5px "Noto Sans TC", sans-serif'; ctx.fillText('nums = [1, 2, 3, 4] · target = 5', w/2, 52);
    }

    // dp cells 0..target
    const NC=TARGET+1; const cw=Math.min(74,(w-2*PAD)/(NC+1)); const gx=(w-NC*cw)/2, gy=98, chh=48;
    for(let sm=0;sm<NC;sm++){ const x=gx+sm*cw; const reach=s.dp[sm]; const isNew=neuSet.has(sm); const isTarget=(sm===TARGET);
      ctx.fillStyle=COLOR.dim; ctx.font='700 11px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('和 '+sm, x+cw/2, gy-14);
      rr(x+4,gy,cw-8,chh,5);
      ctx.fillStyle=isNew?COLOR.cur:(reach?COLOR.done:COLOR.cell); ctx.fill();
      ctx.lineWidth=isNew?3.2:(isTarget?2.6:1.8); ctx.strokeStyle=isNew?COLOR.curS:(reach?COLOR.doneS:(isTarget?COLOR.srcS:COLOR.cellS)); ctx.stroke();
      ctx.fillStyle=isNew?COLOR.curT:(reach?COLOR.doneT:COLOR.grid); ctx.font='700 22px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(reach?'✓':'·', x+cw/2, gy+chh/2+1);
      if(isTarget){ ctx.fillStyle=COLOR.srcT; ctx.font='600 10px "Noto Sans TC", sans-serif'; ctx.fillText('target', x+cw/2, gy+chh+13); }
    }

    // ── BAND 2 · reachability rule
    const by=182;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 放入 num:s 可達 → s+num 也可達', PAD, by);
    const eqBox=by+12, ebH=40; rr(PAD,eqBox,w-PAD*2,ebH,6); ctx.fillStyle='#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(s.num===null){ ctx.fillStyle=COLOR.text; ctx.font='600 12.5px "Noto Sans TC", sans-serif'; ctx.fillText('一個一個放入 nums,把「能湊出的和」的集合逐步擴大,看能不能碰到 target', w/2, eqBox+ebH/2); }
    else { ctx.fillStyle=s.done?COLOR.doneT:COLOR.curT; ctx.font='700 13.5px "JetBrains Mono", monospace';
      ctx.fillText('dp[s] |= dp[s - '+s.num+']   新增可達和:{ '+s.neu.join(', ')+' }', w/2, eqBox+ebH/2); }

    // ── BAND 3 · note
    const ty=eqBox+ebH+22, done=!!s.done;
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 為什麼內層由大到小掃(0/1 背包)', PAD, ty);
    const box=ty+12, boxH=40; rr(PAD,box,w-PAD*2,boxH,6); ctx.fillStyle=done?COLOR.done:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?COLOR.doneS:COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(done){ ctx.fillStyle=COLOR.doneT; ctx.font='700 13px "JetBrains Mono", monospace'; ctx.fillText('dp[target]=✓ → 可平分!由大到小掃保證每個數最多用一次', w/2, box+boxH/2); }
    else { ctx.fillStyle=COLOR.text; ctx.font='600 12.5px "Noto Sans TC", sans-serif'; ctx.fillText('由大到小掃:更新 dp[s] 時 dp[s-num] 還是「沒放本數」的舊值 → 每個數只用一次', w/2, box+boxH/2); }
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
