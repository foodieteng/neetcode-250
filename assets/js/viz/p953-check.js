/* ============================================================
   P953 · Verifying an Alien Dictionary
   建 rank[26](alien order 的位置),再逐欄比較相鄰兩字。第一個
   不同的字元由 rank 決定大小;若一路相同、較長的排在前面就違規。
   words = ["word","world"], order = "worldabc…"  →  false
     這組是「alien 翻轉正常字典序」的經典:正常 d<l,但 alien 裡
     l 的 rank(3)在 d(4)之前 → d>l → "word" 該排在 "world" 之後。
     BAND 1  rank 表(alien order → 位置)
     BAND 2  相鄰兩字逐欄比較(綠=相同 · 紅=第一個不同)
     BAND 3  判定
   ============================================================ */
(function () {
  const canvas = document.getElementById('viz-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('viz-step'), labelEl = document.getElementById('viz-label');
  const bPrev = document.getElementById('viz-prev'), bNext = document.getElementById('viz-next'),
        bPlay = document.getElementById('viz-play'), bReset = document.getElementById('viz-reset');

  const COLOR = { paper:'#ffffff', ink:'#1a1a1a', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf',
    cell:'#ffffff', cellS:'#c9c9c1', eq:'#eef4dc', eqS:'#a9c07a', cur:'#fbe1e1', curS:'#cf3535',
    chip:'#faf7ef', coral:'#cf3535', bad:'#f0d4d4', badS:'#c98a8a' };

  const W1 = 'word', W2 = 'world';
  const RANKS = [['w',0],['o',1],['r',2],['l',3],['d',4]];     // 相關字元的 alien rank
  const RK = { w:0, o:1, r:2, l:3, d:4 };
  const minL = Math.min(W1.length, W2.length);                 // = 4

  // steps: cursor col j, phase
  const steps = [
    { j:-1, phase:'init', text:'<strong>INITIAL</strong> · 先建 <code>rank[]</code> = 每個字母在 alien order 的位置。再把相鄰兩字 <code>word</code> / <code>world</code> <strong>逐欄</strong>比較。' },
    { j:0, phase:'eq', text:'欄 0:<code>w</code> = <code>w</code>,相同 → 看下一欄。' },
    { j:1, phase:'eq', text:'欄 1:<code>o</code> = <code>o</code>,相同 → 繼續。' },
    { j:2, phase:'eq', text:'欄 2:<code>r</code> = <code>r</code>,相同 → 繼續。' },
    { j:3, phase:'differ', text:'欄 3:<code>d</code> ≠ <code>l</code> → <strong>第一個不同的字元,由它決定順序</strong>。查 rank。' },
    { j:3, phase:'verdict', text:'<code>rank[d]=4</code>,<code>rank[l]=3</code> → <strong>4 &gt; 3</strong>,在 alien 裡 <code>d</code> 比 <code>l</code> 大 → <code>word</code> 應排在 <code>world</code> <strong>之後</strong> → 沒排好 → <strong>return false</strong>。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||480; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,h=canvas.clientHeight,PAD=26;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,h);
    const hot = (s.phase==='differ'||s.phase==='verdict');

    // ── BAND 1 · rank chips
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · rank[] = 字母在 alien order「worldabc…」的位置', PAD, 24);
    const cw=96, gap=12, ry=38;
    for(let i=0;i<RANKS.length;i++){ const [ch,rk]=RANKS[i]; const x=PAD+i*(cw+gap);
      const lit = hot && (ch==='d'||ch==='l');
      rr(x,ry,cw,46,6); ctx.fillStyle=lit?COLOR.cur:COLOR.chip; ctx.fill(); ctx.lineWidth=lit?2:1.4; ctx.strokeStyle=lit?COLOR.curS:COLOR.grid; ctx.stroke();
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillStyle=COLOR.ink; ctx.font='700 18px "JetBrains Mono", monospace'; ctx.fillText(ch, x+cw/2, ry+16);
      ctx.fillStyle=lit?COLOR.coral:COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.fillText('rank '+rk, x+cw/2, ry+34);
    }

    // ── BAND 2 · two words compared column by column
    let by=112;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 相鄰兩字逐欄比較(綠=相同 · 紅=第一個不同)', PAD, by);
    const cell=58, gx=PAD+64, y1=by+22, y2=by+22+cell+16;
    // row labels
    ctx.fillStyle=COLOR.dim; ctx.font='700 13px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='middle';
    ctx.fillText('w1', PAD, y1+cell/2); ctx.fillText('w2', PAD, y2+cell/2);
    function drawRow(word, y){
      for(let c=0;c<word.length;c++){ const x=gx+c*cell; const processed = s.j>c || (s.j===c && s.phase!=='init');
        let fill=COLOR.cell, st=COLOR.cellS;
        if(s.j===c && (s.phase==='differ'||s.phase==='verdict')){ fill=COLOR.cur; st=COLOR.curS; }
        else if(processed && c<s.j){ fill=COLOR.eq; st=COLOR.eqS; }
        else if(processed && s.j===c && s.phase==='eq'){ fill=COLOR.eq; st=COLOR.eqS; }
        rr(x+2,y+2,cell-4,cell-4,5); ctx.fillStyle=fill; ctx.fill(); ctx.lineWidth=1.8; ctx.strokeStyle=st; ctx.stroke();
        ctx.fillStyle=COLOR.ink; ctx.font='700 24px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(word[c], x+cell/2, y+cell/2+1);
      }
    }
    drawRow(W1, y1); drawRow(W2, y2);
    // column cursor bracket
    if(s.j>=0){ const x=gx+s.j*cell; ctx.strokeStyle=hot?COLOR.curS:COLOR.eqS; ctx.lineWidth=2.4;
      ctx.beginPath(); ctx.moveTo(x+cell/2-8, y1-10); ctx.lineTo(x+cell/2, y1-2); ctx.lineTo(x+cell/2+8, y1-10); ctx.stroke();
      ctx.fillStyle=hot?COLOR.coral:COLOR.eqS; ctx.font='700 11px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='bottom';
      ctx.fillText('j='+s.j, x+cell/2, y1-12); }

    // ── BAND 3 · verdict
    const ty=y2+cell+30;
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 判定', PAD, ty);
    const box=ty+12, bad=(s.phase==='verdict');
    rr(PAD,box,w-PAD*2,44,6); ctx.fillStyle=bad?COLOR.bad:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=bad?COLOR.badS:COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(bad){ ctx.fillStyle='#9a3838'; ctx.font='700 15px "JetBrains Mono", monospace';
      ctx.fillText('rank[d]=4 > rank[l]=3  →  NOT sorted  →  return false', w/2, box+23); }
    else if(s.phase==='differ'){ ctx.fillStyle=COLOR.coral; ctx.font='600 14px "Noto Sans TC", sans-serif';
      ctx.fillText('找到第一個不同的字元 d / l,拿去查 rank 比大小…', w/2, box+23); }
    else { ctx.fillStyle=COLOR.dim; ctx.font='600 13px "Noto Sans TC", sans-serif';
      ctx.fillText(s.phase==='init'?'逐欄比較中,遇到第一個不同的字元就下判斷':'目前為止相同,繼續往右比', w/2, box+23); }
  }

  function update(){ const s=steps[step]; if(stepEl) stepEl.textContent=String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0'); if(labelEl) labelEl.innerHTML=s.text; draw(); }
  function next(){ if(step<steps.length-1){step++;update();}else stop(); }
  function prev(){ if(step>0){step--;update();} }
  function reset(){ stop(); step=0; update(); }
  function play(){ if(timer){stop();return;} bPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){stop();return;} next(); },1450); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} if(bPlay) bPlay.textContent='Play'; }
  bPrev&&bPrev.addEventListener('click',prev); bNext&&bNext.addEventListener('click',next); bPlay&&bPlay.addEventListener('click',play); bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();}); if(window.ResizeObserver){ new ResizeObserver(()=>{fit();draw();}).observe(canvas); }
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw); fit(); update();
})();
