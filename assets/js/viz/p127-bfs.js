/* ============================================================
   P127 · Word Ladder — 隱式圖 BFS 分層(逐步)· viz
   節點是單字,兩個單字若「只差一個字母」就有邊。不必真的建圖:每個位置試
   26 個字母,變出的字若在字典裡就是鄰居。BFS 一層層擴散,層數 = 階梯長度
   (含頭尾)。碰到 endWord 回 step+1;seen 防重複。
   例 hit → cog,dict={hot,dot,dog,lot,log,cog} → 5
     BAND 1  單字圖(按 BFS 層排;藍=已訪 · 珊瑚=本層 frontier · 綠=終點)
     BAND 2  step(= 目前層數 = 階梯長度)
     BAND 3  說明
   ============================================================ */
(function () {
  const canvas = document.getElementById('viz-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('viz-step'), labelEl = document.getElementById('viz-label');
  const bPrev = document.getElementById('viz-prev'), bNext = document.getElementById('viz-next'),
        bPlay = document.getElementById('viz-play'), bReset = document.getElementById('viz-reset');

  const COLOR = { paper:'#ffffff', ink:'#1a1a1a', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf',
    box:'#ffffff', boxS:'#c9c9c1', seen:'#eef4fa', seenS:'#a9c4da', seenT:'#2f5f9e',
    front:'#fbe7df', frontS:'#d96e4e', frontT:'#b3502f', end:'#d9e8c7', endS:'#5fa866', endT:'#3f7a3a',
    edge:'#c2ccd6', edgeOn:'#5fa866' };

  // word: {col, row(-1/0/1), lvl}
  const W = {
    hit:{col:0,row:0,lvl:1}, hot:{col:1,row:0,lvl:2},
    dot:{col:2,row:-1,lvl:3}, lot:{col:2,row:1,lvl:3},
    dog:{col:3,row:-1,lvl:4}, log:{col:3,row:1,lvl:4},
    cog:{col:4,row:0,lvl:5},
  };
  const EDGES = [['hit','hot'],['hot','dot'],['hot','lot'],['dot','dog'],['lot','log'],['dog','cog'],['log','cog']];
  const PATH = new Set(['hit-hot','hot-dot','dot-dog','dog-cog']);

  const steps = [
    { maxlvl:1, frontier:['hit'], step:1, done:false,
      text:'<strong>INITIAL</strong> · 節點是<strong>單字</strong>,只差一個字母就有邊(<strong>不必真的建圖</strong>:每位置試 26 字母,在字典裡就是鄰居)。BFS 從 <code>hit</code> 開始,<code>step=1</code>。' },
    { maxlvl:2, frontier:['hot'], step:2, done:false,
      text:'展開 <code>hit</code>:把每個字母換過一輪 → <code>hot</code>(<code>i→o</code>)在字典裡 → 入隊。第 2 層,<code>step=2</code>。' },
    { maxlvl:3, frontier:['dot','lot'], step:3, done:false,
      text:'展開 <code>hot</code> → <code>dot</code>(<code>h→d</code>)、<code>lot</code>(<code>h→l</code>)。第 3 層,<code>step=3</code>。' },
    { maxlvl:4, frontier:['dog','log'], step:4, done:false,
      text:'展開 <code>dot、lot</code> → <code>dog</code>、<code>log</code>(<code>t→g</code>)。第 4 層,<code>step=4</code>。' },
    { maxlvl:5, frontier:['cog'], step:5, done:true,
      text:'展開 <code>dog</code> → <code>cog</code>(<code>d→c</code>)== <strong>endWord</strong> → 回 <code>step+1 = 5</code>。最短階梯:<code>hit→hot→dot→dog→cog</code>。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||420; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function pos(word, w){ const PAD=40; const bw=62; const cols=5; const gap=(w-2*PAD-bw)/(cols-1);
    const cx=PAD+bw/2 + W[word].col*gap; const cyMid=96; const cy=cyMid + W[word].row*46; return [cx,cy]; }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,h=canvas.clientHeight,PAD=26; const bw=62,bh=30;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,h);
    const frontier=new Set(s.frontier);

    // ── BAND 1 · word graph (BFS layered)
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 單字圖(左→右 = BFS 層;藍=已訪 · 珊瑚=本層 · 綠=終點 · 綠邊=最短階梯)', PAD, 22);
    // column labels
    for(let c=0;c<5;c++){ const [lx]=pos(['hit','hot','dot','dog','cog'][c],w); ctx.fillStyle=COLOR.dim; ctx.font='600 10px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='alphabetic'; ctx.fillText('step '+(c+1), lx, 44); }
    // edges
    for(const [a,b] of EDGES){ if(W[a].lvl>s.maxlvl||W[b].lvl>s.maxlvl) continue; const [ax,ay]=pos(a,w),[bx,by]=pos(b,w);
      const onPath=PATH.has(a+'-'+b)||PATH.has(b+'-'+a); const bothShown=W[a].lvl<=s.maxlvl&&W[b].lvl<=s.maxlvl;
      ctx.beginPath(); ctx.moveTo(ax,ay); ctx.lineTo(bx,by); ctx.strokeStyle=(onPath&&s.done)?COLOR.edgeOn:COLOR.edge; ctx.lineWidth=(onPath&&s.done)?3.2:2; ctx.stroke(); }
    // boxes
    for(const word in W){ if(W[word].lvl>s.maxlvl) continue; const [cx,cy]=pos(word,w); const isFront=frontier.has(word); const isEnd=(word==='cog'&&s.done);
      rr(cx-bw/2,cy-bh/2,bw,bh,7);
      ctx.fillStyle=isEnd?COLOR.end:(isFront?COLOR.front:COLOR.seen); ctx.fill();
      ctx.lineWidth=isFront?3:2; ctx.strokeStyle=isEnd?COLOR.endS:(isFront?COLOR.frontS:COLOR.seenS); ctx.stroke();
      ctx.fillStyle=isEnd?COLOR.endT:(isFront?COLOR.frontT:COLOR.seenT); ctx.font='700 15px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(word,cx,cy+1); }

    // ── BAND 2 · step counter
    let by=232;
    ctx.fillStyle=COLOR.frontS; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · step(每擴散一層 +1 = 階梯的長度)', PAD, by);
    const cy=by+14;
    ctx.fillStyle=COLOR.text; ctx.font='700 13px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText('step =', PAD, cy+18);
    ctx.fillStyle=s.done?COLOR.endT:COLOR.frontS; ctx.font='700 22px "JetBrains Mono", monospace'; ctx.fillText(String(s.step), PAD+70, cy+18);
    // level chips
    let bx=PAD+130;
    const levels=[['hit'],['hot'],['dot','lot'],['dog','log'],['cog']];
    for(let L=0;L<5;L++){ if(L+1>s.maxlvl) break; const label=levels[L].join(',');
      ctx.font='700 12px "JetBrains Mono", monospace'; const tw=ctx.measureText(label).width; const isF=s.frontier.some(f=>levels[L].includes(f));
      rr(bx,cy+2,tw+18,32,6); ctx.fillStyle=isF?COLOR.front:COLOR.seen; ctx.fill(); ctx.lineWidth=1.4; ctx.strokeStyle=isF?COLOR.frontS:COLOR.seenS; ctx.stroke();
      ctx.fillStyle=isF?COLOR.frontT:COLOR.seenT; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText(label, bx+9, cy+18); bx+=tw+28; }

    // ── BAND 3 · note
    const ty=cy+64, done=!!s.done;
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 為什麼 BFS 給最短階梯', PAD, ty);
    const box=ty+12; rr(PAD,box,w-PAD*2,40,6); ctx.fillStyle=done?COLOR.end:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?COLOR.endS:COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(done){ ctx.fillStyle=COLOR.endT; ctx.font='700 13px "JetBrains Mono", monospace'; ctx.fillText('return 5 · BFS 一層層擴散,第一次碰到終點就是最短', w/2, box+20); }
    else { ctx.fillStyle=COLOR.text; ctx.font='600 12px "Noto Sans TC", sans-serif'; ctx.fillText('鄰居 = 改一個字母且在字典裡;每位置試 26 字母,不必預先建整張圖', w/2, box+20); }
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
