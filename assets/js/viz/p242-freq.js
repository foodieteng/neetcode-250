/* ============================================================
   P242 · Valid Anagram — 字元次數表 · viz
   anagram = 兩字串的「字元多重集合」相同 = 每個字元次數一樣。
   做法:先長度不同直接 false;用 s 的字元 ++ 建次數表,再用 t 的字元 --。
   任何一步變成負(或原本沒有)→ 不是 anagram。全部歸零 → 是。
   s="aab", t="aba":freq{a:2,b:1} → 消 a,b,a → 全 0 → true。
     BAND 1  s / t 兩字串(紅=t 正在消的字元)
     BAND 2  次數表(建立時 ++、消耗時 --)
     BAND 3  判斷:出現負數就 false;全 0 就 true
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

  const S = 'aab', T = 'aba';
  const KEYS = ['a','b'];
  // freq state per step (after the step's action)
  const steps = [
    { freq:{a:0,b:0}, phase:'len', tIdx:-1,
      text:'<strong>INITIAL</strong> · <code>s="aab"</code>、<code>t="aba"</code>。先檢查<strong>長度</strong>:都是 3,通過(長度不同直接 <code>false</code>,免比)。' },
    { freq:{a:2,b:1}, phase:'build', tIdx:-1,
      text:'<strong>用 s 建次數表(++)</strong> · 掃 <code>s="aab"</code>:<code>a</code> 出現 2 次、<code>b</code> 出現 1 次 → <code>freq = {a:2, b:1}</code>。' },
    { freq:{a:1,b:1}, phase:'consume', tIdx:0, key:'a',
      text:'<strong>用 t 消耗(--)· t[0]=\'a\'</strong> · <code>freq[a]: 2 → 1</code>。還是非負,繼續。' },
    { freq:{a:1,b:0}, phase:'consume', tIdx:1, key:'b',
      text:'<strong>t[1]=\'b\'</strong> · <code>freq[b]: 1 → 0</code>。' },
    { freq:{a:0,b:0}, phase:'consume', tIdx:2, key:'a', done:true,
      text:'<strong>t[2]=\'a\'</strong> · <code>freq[a]: 1 → 0</code>。消完後<strong>全部歸零</strong>,沒有出現負數 → <strong>是 anagram → true</strong>。' },
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

    // ── BAND 1 · strings ──
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · s(建表 ++) / t(消耗 --,紅=正在消)', PAD, 22);

    const chW=34, chH=30, sx=PAD+52, sy=36, ty2=74;
    ctx.textAlign='right'; ctx.textBaseline='middle'; ctx.fillStyle=COLOR.text; ctx.font='700 13px "JetBrains Mono", monospace';
    ctx.fillText('s =', sx-12, sy+chH/2);
    for(let k=0;k<S.length;k++){ const x=sx+k*(chW+6);
      rr(x,sy,chW,chH,5); ctx.fillStyle=(s.phase==='build')?COLOR.src:COLOR.cell; ctx.fill();
      ctx.lineWidth=1.6; ctx.strokeStyle=(s.phase==='build')?COLOR.srcS:COLOR.cellS; ctx.stroke();
      ctx.fillStyle=(s.phase==='build')?COLOR.srcT:COLOR.text; ctx.font='700 15px "JetBrains Mono", monospace'; ctx.textAlign='center';
      ctx.fillText(S[k], x+chW/2, sy+chH/2);
    }
    ctx.textAlign='right'; ctx.textBaseline='middle'; ctx.fillStyle=COLOR.text; ctx.font='700 13px "JetBrains Mono", monospace';
    ctx.fillText('t =', sx-12, ty2+chH/2);
    for(let k=0;k<T.length;k++){ const x=sx+k*(chW+6); const isCur=(k===s.tIdx); const donec=(s.phase==='consume'&&k<s.tIdx)||(done);
      rr(x,ty2,chW,chH,5);
      ctx.fillStyle=isCur?COLOR.cur:(donec?COLOR.done:COLOR.cell); ctx.fill();
      ctx.lineWidth=isCur?2.6:1.6; ctx.strokeStyle=isCur?COLOR.curS:(donec?COLOR.doneS:COLOR.cellS); ctx.stroke();
      ctx.fillStyle=isCur?COLOR.curT:(donec?COLOR.doneT:COLOR.text); ctx.font='700 15px "JetBrains Mono", monospace'; ctx.textAlign='center';
      ctx.fillText(T[k], x+chW/2, ty2+chH/2);
    }

    // ── BAND 2 · freq table ──
    const by=124;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · freq 次數表(s 時 ++ · t 時 --)', PAD, by);

    const cellW=64, cellH=40, tx0=(w-KEYS.length*(cellW+16))/2+8, tyy=by+16;
    for(let ki=0;ki<KEYS.length;ki++){
      const key=KEYS[ki], x=tx0+ki*(cellW+16);
      const isCur=(s.phase==='consume' && s.key===key);
      // key label
      ctx.fillStyle=COLOR.dim; ctx.font='700 12px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText("'"+key+"'", x+cellW/2, tyy-2);
      rr(x,tyy+10,cellW,cellH,7);
      const val=s.freq[key];
      const zero=(val===0 && (s.phase!=='len'));
      ctx.fillStyle=isCur?COLOR.cur:(zero?COLOR.done:(val>0?COLOR.src:COLOR.cell)); ctx.fill();
      ctx.lineWidth=isCur?3:1.9; ctx.strokeStyle=isCur?COLOR.curS:(zero?COLOR.doneS:(val>0?COLOR.srcS:COLOR.cellS)); ctx.stroke();
      ctx.fillStyle=isCur?COLOR.curT:(zero?COLOR.doneT:(val>0?COLOR.srcT:COLOR.grid)); ctx.font='700 20px "JetBrains Mono", monospace';
      ctx.fillText(String(val), x+cellW/2, tyy+10+cellH/2);
    }

    // ── BAND 3 · verdict ──
    const vy=by+90;
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 判斷', PAD, vy);
    rr(PAD,vy+10,w-PAD*2,42,6); ctx.fillStyle=done?COLOR.done:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?COLOR.doneS:COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(s.phase==='len'){ ctx.fillStyle=COLOR.text; ctx.font='600 12.5px "Noto Sans TC", sans-serif'; ctx.fillText('長度相同才可能是 anagram → 先擋掉長度不同的', w/2, vy+31); }
    else if(s.phase==='build'){ ctx.fillStyle=COLOR.text; ctx.font='600 12.5px "Noto Sans TC", sans-serif'; ctx.fillText('s 的每個字元次數建好,等 t 來一個個消掉', w/2, vy+31); }
    else if(done){ ctx.fillStyle=COLOR.doneT; ctx.font='700 13px "JetBrains Mono", monospace'; ctx.fillText('全部歸零 · 沒出現負數 → return true', w/2, vy+31); }
    else { ctx.fillStyle=COLOR.text; ctx.font='600 12.5px "JetBrains Mono", monospace'; ctx.fillText('若 --freq[c] < 0(或沒這個鍵)→ 立刻 return false', w/2, vy+31); }
  }

  function update(){ const s=steps[step]; if(stepEl) stepEl.textContent=String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0'); if(labelEl) labelEl.innerHTML=s.text; draw(); }
  function next(){ if(step<steps.length-1){step++;update();}else stop(); }
  function prev(){ if(step>0){step--;update();} }
  function reset(){ stop(); step=0; update(); }
  function play(){ if(timer){stop();return;} bPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){stop();return;} next(); },1700); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} if(bPlay) bPlay.textContent='Play'; }
  bPrev&&bPrev.addEventListener('click',prev); bNext&&bNext.addEventListener('click',next); bPlay&&bPlay.addEventListener('click',play); bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();}); if(window.ResizeObserver){ new ResizeObserver(()=>{fit();draw();}).observe(canvas); }
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw); fit(); update();
})();
