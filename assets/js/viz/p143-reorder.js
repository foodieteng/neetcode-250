/* ============================================================
   P143 · Reorder List — 找中點 + 翻轉後半 + 交錯合併 · viz
   這題是前三題的組合技:
     階段 1  快慢指標找中點(= 141 的骨架)
     階段 2  翻轉後半 + slow->next = nullptr 切開(= 206 的骨架)
     階段 3  兩條交錯接起來(= 21 的 dummy + tail 骨架)
   例 [1,2,3,4,5] → [1,5,2,4,3]。
   關鍵:|l1| 恆大於 |l2|,所以最後接上的一定是 l1 的尾巴,
   而它的 next 早在階段 2 就被 slow->next = nullptr 設成 null
   —— 這就是為什麼 merge 迴圈裡從來不必寫 tail->next = nullptr。
     BAND 1  前半 / 後半 兩排 + 下方逐漸長出來的結果
     BAND 2  這一步做了什麼
     BAND 3  為什麼
   所有狀態取自實測 trace(見 review.html 範例 Trace),未手推。
   ============================================================ */
(function () {
  const canvas = document.getElementById('viz-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('viz-step'), labelEl = document.getElementById('viz-label');
  const bPrev = document.getElementById('viz-prev'), bNext = document.getElementById('viz-next'),
        bPlay = document.getElementById('viz-play'), bReset = document.getElementById('viz-reset');

  const C = { paper:'#ffffff', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf',
    win:'#e3edf5', winS:'#4478c0', winT:'#2f5f9e',
    seg:'#f6ead8', segS:'#c8801e', segT:'#96601a',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424',
    ok:'#d9e8c7', okS:'#5fa866', okT:'#3f7a3a',
    off:'#f0f0ec', offS:'#cfcfcf', offT:'#a3a099', coral:'#cf3535' };

  const SLOTS = 5;

  // r1/r2:兩排目前的內容;u1/u2:各已被接走幾個;slow/fast:階段 1 的指標(索引,-1=無)
  const steps = [
    { phase:1, r1:[1,2,3,4,5], r2:[], u1:0, u2:0, slow:0, fast:0, res:[],
      tag1:'原串列', tag2:'—',
      eq:'目標:L0 → Ln → L1 → Ln−1 → …  =  1 → 5 → 2 → 4 → 3',
      note:'頭尾交錯 ⇒ 需要「從尾巴往回走」,但單向串列做不到 —— 所以先翻轉後半',
      text:'<strong>INITIAL</strong> · 要的順序是<strong>頭一個、尾一個、頭二個、尾二個…</strong>。麻煩在於單向串列<strong>只能往後走</strong>,拿不到尾巴的前一個。所以拆成三步:<strong>①找中點 ②翻轉後半 ③交錯接起來</strong> —— 剛好就是 <a href="../p141/index.html">141</a>、<a href="../p206/index.html">206</a>、<a href="../p21/index.html">21</a> 三題的骨架。' },

    { phase:1, r1:[1,2,3,4,5], r2:[], u1:0, u2:0, slow:1, fast:2, res:[],
      tag1:'原串列', tag2:'—',
      eq:'階段 1 · 第 1 輪:slow → 第 2 個　fast → 第 3 個',
      note:'slow 一步、fast 兩步 —— 和 141 完全同一副骨架',
      text:'<strong>階段 1 · 找中點</strong> · <code>while (fast &amp;&amp; fast-&gt;next)</code>,<code>slow</code> 走一步、<code>fast</code> 走兩步。<code>fast</code> 走完全程時,<code>slow</code> 剛好停在中間。' },

    { phase:1, r1:[1,2,3,4,5], r2:[], u1:0, u2:0, slow:2, fast:4, res:[],
      tag1:'原串列', tag2:'—',
      eq:'第 2 輪:slow → 第 3 個　fast → 第 5 個,fast->next 是 null → 跳出',
      note:'slow 停在第 3 個 ⇒ 前半 = 1,2,3(3 個)、後半 = 4,5(2 個)',
      text:'<strong>階段 1 · 結束</strong> · <code>fast</code> 到第 5 個,<code>fast-&gt;next</code> 是 <code>null</code>,迴圈結束。<code>slow</code> 停在<strong>第 3 個</strong>。注意這個切法讓<strong>前半永遠比後半長</strong>(這裡 3 vs 2)—— 待會有用。' },

    { phase:2, r1:[1,2,3], r2:[5,4], u1:0, u2:0, slow:-1, fast:-1, res:[],
      tag1:'l1 前半', tag2:'l2 後半(已翻轉)',
      eq:'l2 = reverseList(slow->next)   然後   slow->next = nullptr',
      note:'先翻轉、再切斷。少了切斷那行,等一下合併就會接成環',
      text:'<strong>階段 2 · 翻轉後半並切開</strong> · 後半 <code>4 → 5</code> 翻成 <code>5 → 4</code>(<a href="../p206/code.html">206 的迭代版</a>,一字不改)。然後 <strong><code>slow-&gt;next = nullptr</code> 把前半切出來</strong>。<strong>實測少了這一行,n=1..400 有 398 種長度會成環</strong>,最小反例 n=3 走出 <code>1,3,2,3,2,3,2…</code> 永遠走不完。' },

    { phase:3, r1:[1,2,3], r2:[5,4], u1:1, u2:1, slow:-1, fast:-1, res:[1,5],
      tag1:'l1 前半', tag2:'l2 後半(已翻轉)',
      eq:'第 1 圈:先接 l1 的 1,再接 l2 的 5',
      note:'順序不能反 —— 先 l2 再 l1 的話,n=3 就答 [1,2](錯 398/400)',
      text:'<strong>階段 3 · 交錯合併</strong> · 每一圈<strong>先接 l1 一個、再接 l2 一個</strong>。順序是有意義的:目標第一個是 <code>L0</code>(來自 l1)。<strong>實測把兩個 <code>if</code> 對調,400 種長度錯 398 種。</strong>' },

    { phase:3, r1:[1,2,3], r2:[5,4], u1:2, u2:2, slow:-1, fast:-1, res:[1,5,2,4],
      tag1:'l1 前半', tag2:'l2 後半(已翻轉)',
      eq:'第 2 圈:接 l1 的 2,接 l2 的 4',
      note:'節點是搬過來接上,不是複製 —— 實測 300 種長度節點集合全部守恆',
      text:'<strong>第 2 圈</strong> · 這裡沒有任何 <code>new</code>(除了那個多餘的 dummy)——<strong>是把原本的節點重新接線</strong>。實測 <code>n = 1..300</code>,重排前後<strong>節點位址集合完全相同</strong>,符合題目「只能改節點不能改值」的要求。' },

    { phase:3, r1:[1,2,3], r2:[5,4], u1:3, u2:2, slow:-1, fast:-1, res:[1,5,2,4,3],
      tag1:'l1 前半', tag2:'l2 後半(已翻轉)',
      eq:'第 3 圈:接 l1 的 3;l2 已空,跳過  →  完成',
      note:'最後接的一定是 l1 的尾,而它的 next 早被 slow->next=nullptr 設成 null',
      text:'<strong>完成</strong> · <code>1 → 5 → 2 → 4 → 3</code>。<strong>注意 merge 迴圈裡從來沒有寫過 <code>tail-&gt;next = nullptr</code></strong> —— 為什麼不會多出一截?因為 <code>|l1| &gt; |l2|</code> <strong>恆成立</strong>,所以<strong>最後接上的必定是 l1 的尾巴</strong>,而它的 <code>next</code> 早在階段 2 就被 <code>slow-&gt;next = nullptr</code> 設好了。' },
  ];

  let step = 0, timer = null;

  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||450; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  const TAG = 96, NH = 42;
  const PTR_Y = 62, Y1 = 78, Y2 = 160, YR = 248;

  function draw(){
    fit();
    const s = steps[step], w = canvas.clientWidth, PAD = 26;
    const done = step === steps.length - 1;
    ctx.fillStyle = C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);

    const area = w - 2*PAD - TAG;
    const cw = Math.min(54, area / SLOTS - 18);
    const gap = Math.min(28, (area - SLOTS*cw) / (SLOTS - 1));
    const x0 = PAD + TAG;
    const at = k => x0 + k*(cw+gap);

    const cell=(k,y,txt,bg,bd,tx,bold)=>{ rr(at(k),y,cw,NH,5);
      ctx.fillStyle=bg; ctx.fill(); ctx.lineWidth=bold?2.4:1.5; ctx.strokeStyle=bd; ctx.stroke();
      ctx.fillStyle=tx; ctx.font='700 15px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(txt, at(k)+cw/2, y+NH/2); };
    const rowTag=(y,t,col)=>{ ctx.fillStyle=col; ctx.font='700 11.5px "JetBrains Mono", monospace';
      ctx.textAlign='right'; ctx.textBaseline='middle'; ctx.fillText(t, x0-10, y+NH/2); };

    // ── BAND 1 標題 ──
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 藍 = 來自前半　橘 = 來自後半　灰 = 已經接走', PAD, 16);
    ctx.textAlign='right'; ctx.font='700 12.5px "JetBrains Mono", monospace';
    ctx.fillStyle = done ? C.okT : C.text;
    ctx.fillText('階段 ' + s.phase + ' / 3', w - PAD, 16);

    ctx.textAlign='center'; ctx.font='700 12.5px "JetBrains Mono", monospace';
    ctx.fillStyle = done ? C.okT : C.winT;
    ctx.fillText(s.phase===1 ? '① 快慢指標找中點'
               : s.phase===2 ? '② 翻轉後半 + 切開'
               : (done ? '③ 交錯合併 —— 完成' : '③ 交錯合併'), w/2, 40);

    // ── 指標列(只有階段 1 有)──
    if (s.phase === 1 && s.slow >= 0) {
      ctx.textAlign='center'; ctx.textBaseline='alphabetic'; ctx.font='700 11px "JetBrains Mono", monospace';
      if (s.slow === s.fast) { ctx.fillStyle=C.curT; ctx.fillText('slow,fast', at(s.slow)+cw/2, PTR_Y); }
      else { ctx.fillStyle=C.winT; ctx.fillText('slow', at(s.slow)+cw/2, PTR_Y);
             ctx.fillStyle=C.curT; ctx.fillText('fast', at(s.fast)+cw/2, PTR_Y); }
    }

    // ── 第一排 ──
    rowTag(Y1, s.tag1, C.winT);
    for(let k=0;k<s.r1.length;k++){
      const used = k < s.u1;
      const isPtr = s.phase===1 && (k===s.slow || k===s.fast);
      cell(k,Y1,String(s.r1[k]),
        used?C.off:(isPtr?C.cur:C.win), used?C.offS:(isPtr?C.curS:C.winS),
        used?C.offT:(isPtr?C.curT:C.winT), isPtr); }
    if(s.phase>=2 && s.u1>=s.r1.length){ ctx.fillStyle=C.dim; ctx.font='700 11px "JetBrains Mono", monospace';
      ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText('l1 = null', at(s.r1.length)+4, Y1+NH/2); }

    // ── 第二排 ──
    rowTag(Y2, s.tag2, s.phase===1?C.dim:C.segT);
    if(s.r2.length===0){ ctx.fillStyle=C.offT; ctx.font='600 12px "Noto Sans TC", sans-serif';
      ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText('(還沒切開)', x0, Y2+NH/2); }
    for(let k=0;k<s.r2.length;k++){ const used=k<s.u2;
      cell(k,Y2,String(s.r2[k]), used?C.off:C.seg, used?C.offS:C.segS, used?C.offT:C.segT, false); }
    if(s.phase===3 && s.u2>=s.r2.length && s.r2.length){ ctx.fillStyle=C.dim; ctx.font='700 11px "JetBrains Mono", monospace';
      ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText('l2 = null(已空)', at(s.r2.length)+4, Y2+NH/2); }

    // ── 分隔線 ──
    ctx.strokeStyle=C.grid; ctx.lineWidth=1; ctx.setLineDash([4,4]);
    ctx.beginPath(); ctx.moveTo(PAD, YR-24.5); ctx.lineTo(w-PAD, YR-24.5); ctx.stroke(); ctx.setLineDash([]);

    // ── 結果 ──
    rowTag(YR,'結果',done?C.okT:C.text);
    if(s.res.length===0){ ctx.fillStyle=C.offT; ctx.font='600 12px "Noto Sans TC", sans-serif';
      ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText('(還沒開始合併)', x0, YR+NH/2); }
    for(let k=0;k<s.res.length;k++){
      const fromL1 = (k % 2 === 0);
      const justAdded = k === s.res.length-1 && !done;
      cell(k,YR,String(s.res[k]),
        done?C.ok:(fromL1?C.win:C.seg),
        done?C.okS:(justAdded?C.curS:(fromL1?C.winS:C.segS)),
        done?C.okT:(fromL1?C.winT:C.segT), justAdded); }

    // ── BAND 2 ──
    const B2 = 314;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 這一步做了什麼', PAD, B2);
    rr(PAD,B2+10,w-2*PAD,42,6);
    ctx.fillStyle = done?C.ok:(s.phase===1&&step===0?'#fafaf6':C.cur); ctx.fill();
    ctx.lineWidth=1.6; ctx.strokeStyle = done?C.okS:(s.phase===1&&step===0?C.grid:C.curS); ctx.stroke();
    ctx.fillStyle = done?C.okT:(s.phase===1&&step===0?C.text:C.curT);
    ctx.font='700 12.5px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(s.eq, w/2, B2+31);

    // ── BAND 3 ──
    const B3 = 386;
    ctx.fillStyle=C.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 為什麼', PAD, B3);
    rr(PAD,B3+10,w-2*PAD,40,6);
    ctx.fillStyle = done?C.ok:'#fafaf6'; ctx.fill();
    ctx.lineWidth=1.6; ctx.strokeStyle = done?C.okS:C.grid; ctx.stroke();
    ctx.fillStyle = done?C.okT:C.text;
    ctx.font='600 12.5px "Noto Sans TC", sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(s.note, w/2, B3+30);
  }

  function update(){ if(stepEl) stepEl.textContent=String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0'); if(labelEl) labelEl.innerHTML=steps[step].text; draw(); }
  function next(){ if(step<steps.length-1){step++;update();}else stop(); }
  function prev(){ if(step>0){step--;update();} }
  function reset(){ stop(); step=0; update(); }
  function play(){ if(timer){stop();return;} bPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){stop();return;} next(); },2100); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} if(bPlay) bPlay.textContent='Play'; }
  bPrev&&bPrev.addEventListener('click',prev); bNext&&bNext.addEventListener('click',next); bPlay&&bPlay.addEventListener('click',play); bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();}); if(window.ResizeObserver){ new ResizeObserver(()=>{fit();draw();}).observe(canvas); }
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw); fit(); update();
})();
