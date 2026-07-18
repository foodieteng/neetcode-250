/* ============================================================
   P1929 · Concatenation of Array — 就地把自己接在後面 · viz
   ans[i]=nums[i]、ans[i+n]=nums[i] → 把 nums 複製一份接在自己後面。
   關鍵:迴圈前先「凍住」長度 n。若條件寫成 i < nums.size(),size 會隨
   push_back 一直變大,i 永遠追不上 → 無窮迴圈。
   nums=[1,2,1] → [1,2,1, 1,2,1]。
     BAND 1  陣列(藍=原本 n 個 · 珊瑚=本步剛接上的)
     BAND 2  n 凍住 · i 的進度
     BAND 3  陷阱:i < nums.size() 會無窮迴圈
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
    empty:'#f3f3ef', emptyS:'#e2e2dc', coral:'#d96e4e' };

  const BASE = [1,2,1], N = 3;
  // step k: 已接上 k 個(k=0..3)
  const steps = [
    { k:0, cur:-1, text:'<strong>INITIAL</strong> · <code>nums=[1,2,1]</code>。要做出 <code>ans[i]=nums[i]</code>、<code>ans[i+n]=nums[i]</code> —— 就是把 nums <strong>複製一份接在自己後面</strong>。先<strong>凍住</strong> <code>n = 3</code>。' },
    { k:1, cur:0, text:'<strong>i=0</strong> · <code>push_back(nums[0]=1)</code> → 接到尾巴,索引 3。讀 <code>nums[0]</code>、寫到後面,原本的 3 個字不受影響。' },
    { k:2, cur:1, text:'<strong>i=1</strong> · <code>push_back(nums[1]=2)</code> → 索引 4。' },
    { k:3, cur:2, done:true, text:'<strong>i=2</strong> · <code>push_back(nums[2]=1)</code> → 索引 5。<code>i</code> 到 <code>n=3</code> 停。結果 <code>[1,2,1, 1,2,1]</code>,長度 <strong>2n</strong>。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,h=canvas.clientHeight,PAD=26;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,h);
    const done=!!s.done;
    const total = 2*N;

    // ── BAND 1 · array ──
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · ans(藍=原本 n 個 · 珊瑚=本步剛接上)', PAD, 24);

    const cell=Math.min(66,(w-2*PAD)/(total+0.5)), gx=(w-total*cell)/2, gy=64, chh=46;
    for(let idx=0;idx<total;idx++){
      const x=gx+idx*cell;
      const isBase=(idx<N);
      const filled = isBase || (idx-N < s.k);          // 後半已接上 s.k 個
      const isCur = (idx===N+s.cur && s.cur>=0);
      // 對應的來源(後半的 idx 來自 idx-N)
      ctx.fillStyle=COLOR.dim; ctx.font='700 10px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('['+idx+']', x+cell/2, gy-10);
      rr(x+4,gy,cell-8,chh,7);
      let bg=COLOR.empty,bd=COLOR.emptyS,tc=COLOR.grid;
      if(filled){ if(isBase){ bg=COLOR.src; bd=COLOR.srcS; tc=COLOR.srcT; } else { bg=COLOR.done; bd=COLOR.doneS; tc=COLOR.doneT; } }
      if(isCur){ bg=COLOR.cur; bd=COLOR.curS; tc=COLOR.curT; }
      ctx.fillStyle=bg; ctx.fill(); ctx.lineWidth=isCur?3:(filled?1.9:1.4); ctx.strokeStyle=bd; ctx.stroke();
      ctx.fillStyle=tc; ctx.font='700 18px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(filled?String(BASE[idx%N]):'·', x+cell/2, gy+chh/2);
    }
    // 分隔:原本 n | 複製
    const midX=gx+N*cell;
    ctx.strokeStyle=COLOR.coral; ctx.lineWidth=2; ctx.setLineDash([4,3]);
    ctx.beginPath(); ctx.moveTo(midX, gy-6); ctx.lineTo(midX, gy+chh+6); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle=COLOR.srcT; ctx.font='700 10px "Noto Sans TC", sans-serif'; ctx.textAlign='center'; ctx.textBaseline='alphabetic';
    ctx.fillText('原本 n 個', gx+N*cell/2, gy+chh+20);
    ctx.fillStyle=COLOR.doneT; ctx.fillText('複製一份', gx+N*cell+N*cell/2, gy+chh+20);

    // ── BAND 2 · n frozen / i progress ──
    const by=152;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · n 先凍住 · i 跑 0 → n−1', PAD, by);
    rr(PAD,by+10,w-PAD*2,40,6); ctx.fillStyle='#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillStyle=COLOR.text; ctx.font='700 13.5px "JetBrains Mono", monospace';
    const iTxt = done?'i = 3 → 停(== n)':('i = '+s.cur+(s.cur>=0?'  ·  push_back(nums['+s.cur+'])':''));
    ctx.fillText('int n = 3(凍住);  '+(s.cur<0?'尚未開始':iTxt), w/2, by+30);

    // ── BAND 3 · the trap ──
    const ty=214;
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 陷阱:別用 i < nums.size()', PAD, ty);
    rr(PAD,ty+10,w-PAD*2,44,6); ctx.fillStyle=done?COLOR.done:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?COLOR.doneS:COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(done){
      ctx.fillStyle=COLOR.doneT; ctx.font='700 12.5px "JetBrains Mono", monospace';
      ctx.fillText('凍住 n → 只接 3 個就停。用 nums.size() → size 一直漲,i 追不上 = 無窮迴圈', w/2, ty+32);
    } else {
      ctx.fillStyle=COLOR.text; ctx.font='600 12.5px "Noto Sans TC", sans-serif';
      ctx.fillText('每次 push_back 都讓 size 變大;若用 size 當上界,i 永遠到不了終點', w/2, ty+32);
    }
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
