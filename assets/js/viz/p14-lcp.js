/* ============================================================
   P14 · Longest Common Prefix — 水平掃描 · 砍前綴 · viz
   prefix 先設成 strs[0],再拿它去比對每個字串:
   只要「prefix 不是 str 的開頭」(str.find(prefix) != 0),就從右邊砍一個字元,
   砍到 prefix 變成 str 的前綴為止。全部比完剩下的 prefix 就是答案。
   ["flower","flow","flight"]:flower →(遇 flow)→ flow →(遇 flight)→ fl。
     BAND 1  prefix 候選(綠=留下 · 灰=本步砍掉)
     BAND 2  正在比對的字串(綠=相符 · 珊瑚=分歧點)
     BAND 3  動作:不是前綴就砍尾
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
    chop:'#efefe9', chopS:'#dcdcd4', chopT:'#b6b6ac', coral:'#d96e4e' };

  const FULL = 'flower';
  // 每步:prefix 目前長度 keep、本步砍掉的範圍、比對的字串 str、分歧 index
  const steps = [
    { keep:6, prev:6, str:null, div:-1,
      text:'<strong>INITIAL</strong> · <code>strs=["flower","flow","flight"]</code>。<code>prefix</code> 先設成第一個字串 <code>"flower"</code>,再拿它去和每個字串比。' },
    { keep:6, prev:6, str:'flower', div:-1,
      text:'<strong>比對 "flower"(它自己)</strong> · <code>prefix="flower"</code> 正是 <code>"flower"</code> 的開頭 → 不用砍。' },
    { keep:4, prev:6, str:'flow', div:4,
      text:'<strong>比對 "flow"</strong> · <code>"flower"</code> 不是 <code>"flow"</code> 的前綴(flow 只到 4 個字)→ 從右砍到 <code>"flow"</code>(砍掉 <code>er</code>)。' },
    { keep:2, prev:4, str:'flight', div:2,
      text:'<strong>比對 "flight"</strong> · <code>"flow"</code> 在 index 2 就分歧(<code>o</code> ≠ <code>i</code>)→ 砍到 <code>"fl"</code>(砍掉 <code>ow</code>)。' },
    { keep:2, prev:2, str:null, div:-1, done:true,
      text:'<strong>ANSWER</strong> · 三個字串都比完,剩下 <code>prefix="fl"</code> → 這就是最長共同前綴。' },
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
    const cw=44, gx=PAD+70, gy=52;

    // ── BAND 1 · prefix candidate ──
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · prefix 候選(綠=留下 · 灰=本步砍掉)', PAD, 24);
    ctx.textAlign='right'; ctx.textBaseline='middle'; ctx.fillStyle=COLOR.text; ctx.font='700 13px "JetBrains Mono", monospace';
    ctx.fillText('prefix', gx-12, gy+18);
    for(let k=0;k<FULL.length;k++){
      const x=gx+k*cw;
      const kept=(k<s.keep);
      const chopped=(k>=s.keep && k<s.prev);   // 本步砍掉
      const gone=(k>=s.keep && k>=s.prev);      // 之前就沒了
      if(gone) continue;
      rr(x+3,gy,cw-6,36,6);
      let bg=COLOR.done,bd=COLOR.doneS,tc=COLOR.doneT;
      if(chopped){ bg=COLOR.chop; bd=COLOR.chopS; tc=COLOR.chopT; }
      if(done&&kept){ bg=COLOR.done; bd=COLOR.doneS; tc=COLOR.doneT; }
      ctx.fillStyle=bg; ctx.fill(); ctx.lineWidth=chopped?1.5:2; ctx.strokeStyle=bd; ctx.stroke();
      ctx.fillStyle=tc; ctx.font='700 17px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(FULL[k], x+cw/2, gy+18);
      if(chopped){ // strike
        ctx.strokeStyle=COLOR.chopT; ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(x+8,gy+18); ctx.lineTo(x+cw-8,gy+18); ctx.stroke();
      }
    }

    // ── BAND 2 · compared string ──
    const by=120;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 正在比對的字串(綠=相符 · 珊瑚=分歧/太短)', PAD, by);
    const sy=by+12;
    if(s.str===null){
      rr(PAD,sy,w-PAD*2,42,6); ctx.fillStyle='#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=COLOR.grid; ctx.stroke();
      ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillStyle=done?COLOR.doneT:COLOR.text; ctx.font='600 12.5px "Noto Sans TC", sans-serif';
      ctx.fillText(done?'全部字串都被 pref="fl" 涵蓋 → 完成':'準備逐一比對 "flower" / "flow" / "flight"', w/2, sy+21);
    } else {
      ctx.textAlign='right'; ctx.textBaseline='middle'; ctx.fillStyle=COLOR.text; ctx.font='700 13px "JetBrains Mono", monospace';
      ctx.fillText('str', gx-12, sy+18);
      const str=s.str;
      for(let k=0;k<str.length;k++){
        const x=gx+k*cw;
        const match=(k<s.keep && (s.div<0 || k<s.div));  // 相符的字元(落在最終 prefix 內)
        const isDiv=(k===s.div);
        rr(x+3,sy,cw-6,36,6);
        let bg=COLOR.cell,bd=COLOR.cellS,tc=COLOR.text;
        if(match){ bg=COLOR.done; bd=COLOR.doneS; tc=COLOR.doneT; }
        if(isDiv){ bg=COLOR.cur; bd=COLOR.curS; tc=COLOR.curT; }
        ctx.fillStyle=bg; ctx.fill(); ctx.lineWidth=isDiv?2.6:1.6; ctx.strokeStyle=bd; ctx.stroke();
        ctx.fillStyle=tc; ctx.font='700 17px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(str[k], x+cw/2, sy+18);
      }
      // 分歧標記
      if(s.div>=0 && s.div>=str.length){
        // 太短的情況:在 str 尾端畫個提示
      }
    }

    // ── BAND 3 · action ──
    const ty=196;
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · while (str.find(prefix) != 0) 砍尾', PAD, ty);
    rr(PAD,ty+10,w-PAD*2,42,6); ctx.fillStyle=done?COLOR.done:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?COLOR.doneS:COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(step===0){ ctx.fillStyle=COLOR.text; ctx.font='600 12.5px "Noto Sans TC", sans-serif'; ctx.fillText('用 strs[0] 當初始候選,之後只會越砍越短(共同前綴不會變長)', w/2, ty+31); }
    else if(done){ ctx.fillStyle=COLOR.doneT; ctx.font='700 13px "JetBrains Mono", monospace'; ctx.fillText('return prefix = "fl"', w/2, ty+31); }
    else if(s.keep<s.prev){ ctx.fillStyle=COLOR.curT; ctx.font='700 12.5px "Noto Sans TC", sans-serif'; ctx.fillText('不是前綴 → 砍掉尾端 '+(s.prev-s.keep)+' 個字元,prefix 變長度 '+s.keep, w/2, ty+31); }
    else { ctx.fillStyle=COLOR.doneT; ctx.font='700 12.5px "Noto Sans TC", sans-serif'; ctx.fillText('已經是前綴 → 不用砍,繼續下一個字串', w/2, ty+31); }
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
