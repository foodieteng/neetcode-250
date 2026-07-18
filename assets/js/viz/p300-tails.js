/* ============================================================
   P300 · Longest Increasing Subsequence — O(n log n) tails · viz(vb-*)
   維護 tails[]:tails[k] = 所有「長度 k+1 的遞增子序列」中,最小的結尾值。
   tails 永遠遞增。對每個 num,用 lower_bound 找第一個 >= num 的位置:
     - 找不到(num 最大)→ push_back(接長一格)
     - 找到 → 覆蓋該位置(把某長度的結尾換成更小的 num,更有潛力)
   最終 tails.size() = LIS 長度(注意 tails 內容不一定是真正的 LIS)。
   例 nums=[3,1,4,2,5] → tails 演變到 [1,2,5],長度 3
     BAND 1  nums[](紅=本步的 num)
     BAND 2  tails[](綠=既有 · 紅=本步覆蓋/新增的位置)
     BAND 3  lower_bound 的判斷
   ============================================================ */
(function () {
  const canvas = document.getElementById('vb-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('vb-step'), labelEl = document.getElementById('vb-label');
  const bPrev = document.getElementById('vb-prev'), bNext = document.getElementById('vb-next'),
        bPlay = document.getElementById('vb-play'), bReset = document.getElementById('vb-reset');

  const COLOR = { paper:'#ffffff', ink:'#1a1a1a', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf',
    cell:'#fafaf6', cellS:'#cfcfcf', src:'#dbe8f6', srcS:'#4478c0', srcT:'#2f5f9e',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424', done:'#d9e8c7', doneS:'#5fa866', doneT:'#3f7a3a', coral:'#cf3535' };

  const NUMS = [3, 1, 4, 2, 5];
  const N = NUMS.length;
  const NIL = -1;
  // 每步:numIdx(處理到哪個 num)· tails 快照 · pos(這步動到的 tails 位置)· action('append'|'replace')
  const steps = [
    { numIdx:NIL, tails:[], pos:NIL, action:null,
      text:'<strong>INITIAL</strong> · <code>tails[k]</code> = 長度 <code>k+1</code> 的遞增子序列中「最小的結尾」。<code>tails</code> 一開始是空的,且會恆保持遞增。' },
    { numIdx:0, tails:[3], pos:0, action:'append',
      text:'<code>num=3</code> · tails 空 → <code>lower_bound</code> 落在尾端 → <strong>接長</strong>:tails=[3]。' },
    { numIdx:1, tails:[1], pos:0, action:'replace',
      text:'<code>num=1</code> · <code>lower_bound([3],1)</code> 指向 3(第一個 ≥ 1)→ <strong>覆蓋</strong>:tails=[1]。長度沒變,但結尾更小、更有潛力。' },
    { numIdx:2, tails:[1,4], pos:1, action:'append',
      text:'<code>num=4</code> · <code>lower_bound([1],4)</code> 落在尾端 → <strong>接長</strong>:tails=[1,4]。' },
    { numIdx:3, tails:[1,2], pos:1, action:'replace',
      text:'<code>num=2</code> · <code>lower_bound([1,4],2)</code> 指向 4 → <strong>覆蓋</strong>:tails=[1,2]。長度 2 的子序列結尾從 4 降到 2。' },
    { numIdx:4, tails:[1,2,5], pos:2, action:'append', done:true,
      text:'<code>num=5</code> · 最大 → <strong>接長</strong>:tails=[1,2,5]。<code>tails.size()=3</code> → LIS 長度 = <strong>3</strong>。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,h=canvas.clientHeight,PAD=26;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,h);

    // BAND 1 · nums
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · nums[](紅=本步處理的 num · 綠=已處理)', PAD, 24);
    const cw=Math.min(66,(w-2*PAD)/(N+1)); const gx=(w-N*cw)/2, ny=52, chh=42;
    for(let i=0;i<N;i++){ const x=gx+i*cw; const isCur=(i===s.numIdx), doneN=(s.numIdx!==NIL && i<s.numIdx);
      ctx.fillStyle=COLOR.dim; ctx.font='700 11px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(i), x+cw/2, ny-13);
      rr(x+4,ny,cw-8,chh,5);
      ctx.fillStyle=isCur?COLOR.cur:(doneN?COLOR.done:COLOR.cell); ctx.fill();
      ctx.lineWidth=isCur?3.2:1.8; ctx.strokeStyle=isCur?COLOR.curS:(doneN?COLOR.doneS:COLOR.cellS); ctx.stroke();
      ctx.fillStyle=isCur?COLOR.curT:(doneN?COLOR.doneT:COLOR.ink); ctx.font='700 19px "JetBrains Mono", monospace';
      ctx.fillText(String(NUMS[i]), x+cw/2, ny+chh/2+1);
    }

    // BAND 2 · tails
    const by=128;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · tails[](恆遞增 · 紅=本步覆蓋/新增的位置)  長度 = LIS', PAD, by);
    const ty=by+30, tchh=44;
    if(s.tails.length===0){
      ctx.fillStyle=COLOR.dim; ctx.font='600 13px "Noto Sans TC", sans-serif'; ctx.textAlign='left'; ctx.textBaseline='middle';
      ctx.fillText('（空）', gx, ty+tchh/2);
    } else {
      const tcw=Math.min(66,(w-2*PAD)/(N+1)); const tgx=(w-s.tails.length*tcw)/2;
      for(let k=0;k<s.tails.length;k++){ const x=tgx+k*tcw; const isPos=(k===s.pos);
        ctx.fillStyle=COLOR.dim; ctx.font='700 10px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText('k='+k, x+tcw/2, ty-11);
        rr(x+4,ty,tcw-8,tchh,5);
        ctx.fillStyle=isPos?COLOR.cur:COLOR.done; ctx.fill();
        ctx.lineWidth=isPos?3.2:1.8; ctx.strokeStyle=isPos?COLOR.curS:COLOR.doneS; ctx.stroke();
        ctx.fillStyle=isPos?COLOR.curT:COLOR.doneT; ctx.font='700 20px "JetBrains Mono", monospace';
        ctx.fillText(String(s.tails[k]), x+tcw/2, ty+tchh/2+1);
      }
      // length badge
      ctx.fillStyle=COLOR.text; ctx.font='700 13px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='middle';
      ctx.fillText('len = '+s.tails.length, tgx+s.tails.length*tcw+16, ty+tchh/2);
    }

    // BAND 3 · lower_bound note
    const ny3=by+30+tchh+26, done=!!s.done;
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · lower_bound:找第一個 ≥ num 的位置', PAD, ny3);
    const box=ny3+12, boxH=40; rr(PAD,box,w-PAD*2,boxH,6); ctx.fillStyle=done?COLOR.done:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?COLOR.doneS:COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(s.numIdx===NIL){ ctx.fillStyle=COLOR.text; ctx.font='600 12.5px "Noto Sans TC", sans-serif'; ctx.fillText('找不到 ≥ num 的位置 → 接長;找到 → 覆蓋(用更小的結尾換掉)', w/2, box+boxH/2); }
    else if(done){ ctx.fillStyle=COLOR.doneT; ctx.font='700 13px "JetBrains Mono", monospace'; ctx.fillText('tails 不是真正的 LIS,但它的「長度」就是 LIS 長度', w/2, box+boxH/2); }
    else { ctx.fillStyle=s.action==='append'?COLOR.doneT:COLOR.curT; ctx.font='700 13px "JetBrains Mono", monospace';
      ctx.fillText(s.action==='append' ? ('num='+NUMS[s.numIdx]+' 比 tails 全部大 → append(接長 +1)')
                                        : ('num='+NUMS[s.numIdx]+' → 覆蓋 tails['+s.pos+'](換更小結尾,長度不變)'), w/2, box+boxH/2); }
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
