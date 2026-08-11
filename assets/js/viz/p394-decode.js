/* ============================================================
   P394 · Decode String — (字串, 次數) 堆疊 · viz
   維護目前緩衝 curr 與 repeat。遇數字累積 repeat;遇 '[' 把 (curr, repeat) 壓入堆疊、
   清空重來;遇字母接到 curr;遇 ']' 彈出 (prev, k),curr = prev + curr×k(展開這一層)。
   例 3[a2[c]] → accaccacc。
     BAND 1  輸入字串(琥珀=數字 · 灰=括號 · 藍=字母 · 紅=目前)
     BAND 2  堆疊:每格 (prev 前綴, ×k)· 右=top
     BAND 3  curr 緩衝 / repeat / 本步動作
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
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424', off:'#eceae2', offS:'#c9c6ba', offT:'#8a8672',
    coral:'#cf3535', amb:'#e0b37a', ambT:'#9a6a1f' };

  const S = '3[a2[c]]';
  // per step: cur idx, repeat, curr, stack [{prev,k}], act, hi (what changed)
  const steps = [
    { cur:-1, repeat:0, curr:'', stack:[], act:'intro', text:'<strong>INITIAL</strong> · 維護緩衝 <code>curr</code> 與 <code>repeat</code>。數字累積 repeat;<code>[</code> 壓 (curr,repeat) 清空;字母接 curr;<code>]</code> 展開這層。' },
    { cur:0, repeat:3, curr:'', stack:[], act:'digit', text:'<strong>\'3\'</strong> · 數字 → <code>repeat = 0*10+3 = 3</code>。' },
    { cur:1, repeat:0, curr:'', stack:[{prev:'',k:3}], act:'open', text:'<strong>\'[\'</strong> · 壓入 <code>(curr="", 3)</code> 到堆疊,然後 <strong>清空</strong> curr、repeat 歸零,進入新一層。' },
    { cur:2, repeat:0, curr:'a', stack:[{prev:'',k:3}], act:'alpha', text:'<strong>\'a\'</strong> · 字母 → 接到 curr。<code>curr = "a"</code>。' },
    { cur:3, repeat:2, curr:'a', stack:[{prev:'',k:3}], act:'digit', text:'<strong>\'2\'</strong> · 數字 → <code>repeat = 2</code>(這是內層的次數)。' },
    { cur:4, repeat:0, curr:'', stack:[{prev:'',k:3},{prev:'a',k:2}], act:'open', text:'<strong>\'[\'</strong> · 壓入 <code>(curr="a", 2)</code>,清空 curr、repeat 歸零。進入更內層。' },
    { cur:5, repeat:0, curr:'c', stack:[{prev:'',k:3},{prev:'a',k:2}], act:'alpha', text:'<strong>\'c\'</strong> · 字母 → <code>curr = "c"</code>。' },
    { cur:6, repeat:0, curr:'acc', stack:[{prev:'',k:3}], act:'close', text:'<strong>\']\'</strong> · 彈出 <code>(prev="a", k=2)</code> → <code>curr = "a" + "c"×2 = "acc"</code>。展開內層。' },
    { cur:7, repeat:0, curr:'accaccacc', stack:[], act:'close', text:'<strong>\']\'</strong> · 彈出 <code>(prev="", k=3)</code> → <code>curr = "" + "acc"×3 = "accaccacc"</code>。' },
    { cur:8, repeat:0, curr:'accaccacc', stack:[], act:'done', text:'<strong>完成</strong> · 掃完回傳 <code>curr = "accaccacc"</code>。每個字元處理一次 + 展開,O(輸出長度)。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function triD(cx,cy,col){ ctx.beginPath(); ctx.moveTo(cx-6,cy-7); ctx.lineTo(cx+6,cy-7); ctx.lineTo(cx,cy+3); ctx.closePath(); ctx.fillStyle=col; ctx.fill(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,PAD=30; const done=s.act==='done';
    ctx.fillStyle=C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);
    // ── BAND 1 · input string ──
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 輸入(琥珀=數字 · 灰=括號 · 藍=字母 · 紅=目前 · 淺灰=已讀)', PAD, 18);
    const m=S.length, cw=Math.min(46,(w-2*PAD)/m-8), gp=((w-2*PAD)-m*cw)/(m-1), gy=42, chh=34;
    for(let k=0;k<m;k++){
      const x=PAD+k*(cw+gp); const ch=S[k];
      const isCur=k===s.cur, doneIt=(s.cur>=0&&k<s.cur)||done;
      const isDigit=ch>='0'&&ch<='9', isBr=ch==='['||ch===']';
      let bg=C.cell,bd=C.cellS,tc=C.text;
      if(isDigit){ bg='#faf0dd'; bd=C.amb; tc=C.ambT; }
      else if(isBr){ bg=C.off; bd=C.offS; tc=C.offT; }
      else { bg=C.src; bd=C.srcS; tc=C.srcT; }
      if(doneIt){ bg=C.off; bd=C.offS; tc=C.offT; }
      if(isCur){ bg=C.cur; bd=C.curS; tc=C.curT; }
      rr(x,gy,cw,chh,6); ctx.fillStyle=bg; ctx.fill(); ctx.lineWidth=isCur?3:1.7; ctx.strokeStyle=bd; ctx.stroke();
      ctx.fillStyle=tc; ctx.font='700 17px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(ch, x+cw/2, gy+chh/2);
    }

    // ── BAND 2 · stack of frames ──
    const b2=98;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 堆疊:每格 (prev 前綴, ×k)· 右=top · 綠=剛壓入', PAD, b2);
    const sy=b2+22, sgp=14; let sx=PAD+4;
    if(s.stack.length===0){ ctx.fillStyle=C.offT; ctx.font='600 13px "Noto Sans TC", sans-serif'; ctx.textBaseline='middle'; ctx.fillText('(空)', sx, sy+25); }
    for(let k=0;k<s.stack.length;k++){
      const f=s.stack[k]; const isTop=k===s.stack.length-1;
      const just=isTop && s.act==='open';
      const label='"'+(f.prev||'')+'" ×'+f.k;
      ctx.font='700 13px "JetBrains Mono", monospace'; const tw=ctx.measureText(label).width; const cwF=Math.max(56, tw+22);
      rr(sx,sy,cwF,50,8); ctx.fillStyle=just?C.grn:(isTop?'#eef4fb':C.src); ctx.fill(); ctx.lineWidth=isTop?3:1.7; ctx.strokeStyle=just?C.grnS:C.srcS; ctx.stroke();
      ctx.fillStyle=just?C.grnT:C.srcT; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('"'+(f.prev||'')+'"', sx+cwF/2, sy+17);
      ctx.fillStyle=C.ambT; ctx.font='700 13px "JetBrains Mono", monospace'; ctx.fillText('×'+f.k, sx+cwF/2, sy+35);
      if(isTop){ triD(sx+cwF/2, sy-3, C.srcT); ctx.fillStyle=C.srcT; ctx.font='700 9px "JetBrains Mono", monospace'; ctx.textBaseline='bottom'; ctx.fillText('top', sx+cwF/2, sy-9); }
      sx+=cwF+sgp;
    }

    // ── BAND 3 · curr / repeat ──
    const by=182;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 目前緩衝', PAD, by);
    // curr pill
    const currStr = s.curr==='' ? '(空)' : '"'+s.curr+'"';
    rr(PAD, by+10, w-PAD*2, 34, 6); ctx.fillStyle=s.act==='close'?C.grn:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=s.act==='close'?C.grnS:C.grid; ctx.stroke();
    ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.font='700 14px "JetBrains Mono", monospace'; ctx.fillStyle=s.act==='close'?C.grnT:C.srcT;
    ctx.fillText('curr = '+currStr, PAD+12, by+27);
    ctx.textAlign='right'; ctx.fillStyle=s.repeat>0?C.ambT:C.dim;
    ctx.fillText('repeat = '+s.repeat, w-PAD-12, by+27);

    // action line
    const ay=by+56;
    rr(PAD,ay,w-PAD*2,40,6); ctx.fillStyle=done?C.grn:(s.act==='close'?C.grn:(s.act==='open'?'#eef4fb':'#fafaf6')); ctx.fill(); ctx.lineWidth=1.6;
    ctx.strokeStyle=done?C.grnS:(s.act==='close'?C.grnS:C.grid); ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='600 12.5px "Noto Sans TC", sans-serif';
    let msg,col=C.text;
    if(s.act==='intro'){ msg="堆疊記住「這一層之前累積的字串 + 重複次數」,]  時再展開"; }
    else if(done){ msg='掃一趟 + 展開 · 時間/空間 O(輸出長度)'; col=C.grnT; }
    else if(s.act==='digit'){ msg='數字可能多位 → repeat = repeat*10 + digit'; col=C.ambT; }
    else if(s.act==='alpha'){ msg='字母直接接到目前這層的 curr'; col=C.srcT; }
    else if(s.act==='open'){ msg="'[' → 把 (curr, repeat) 收進堆疊,curr/repeat 清空重來"; col=C.srcT; }
    else if(s.act==='close'){ msg="']' → 彈出 (prev,k),curr = prev + curr×k,展開回上一層"; col=C.grnT; }
    ctx.fillStyle=col; ctx.fillText(msg, w/2, ay+20);
  }

  function update(){ if(stepEl) stepEl.textContent=String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0'); if(labelEl) labelEl.innerHTML=steps[step].text; draw(); }
  function next(){ if(step<steps.length-1){step++;update();}else stop(); }
  function prev(){ if(step>0){step--;update();} }
  function reset(){ stop(); step=0; update(); }
  function play(){ if(timer){stop();return;} bPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){stop();return;} next(); },1650); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} if(bPlay) bPlay.textContent='Play'; }
  bPrev&&bPrev.addEventListener('click',prev); bNext&&bNext.addEventListener('click',next); bPlay&&bPlay.addEventListener('click',play); bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();}); if(window.ResizeObserver){ new ResizeObserver(()=>{fit();draw();}).observe(canvas); }
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw); fit(); update();
})();
