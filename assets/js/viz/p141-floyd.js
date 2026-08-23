/* ============================================================
   P141 · Linked List Cycle — Floyd 快慢指標 · viz
   slow 一次一步、fast 一次兩步。有環的話 fast 一定會從後面追上 slow;
   沒環的話 fast 會先走到 nullptr。
   這份程式碼用的是 do-while:先動再檢查,所以開頭那個
     if (!head || !head->next) return false;
   是「必要的」而不是防禦性的 —— 少了它,fast->next->next 會對空指標解參考。
   例 [3,2,0,-4] pos=1 → 3 輪相遇;尾巴再換成無環 [1,2,3,4,5] 對照。
     BAND 1  節點列 + 底下的回邊弧線 + slow / fast 標記
     BAND 2  這一輪兩個指標走到哪
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

  const A = { vals:[3,2,0,-4], pos:1 };      // 有環,官方範例 1
  const B = { vals:[1,2,3,4,5], pos:-1 };    // 無環,對照

  // slow / fast 用索引;fast = -1 表示 nullptr
  const steps = [
    { L:A, slow:0, fast:0, act:'intro',
      eq:'guard: if (!head || !head->next) return false;   → n = 4,通過',
      note:'do-while 是「先動再檢查」,所以這個 guard 不是防禦,是必要的',
      text:'<strong>INITIAL</strong> · <code>slow</code> 和 <code>fast</code> 都從 head 出發。<strong>底下那條弧線就是環</strong> —— index 3 的 <code>next</code> 接回 index 1。想法很單純:<strong>快的每次多走一步,如果路是圈,它遲早會從後面追上慢的</strong>;如果路有盡頭,它會先撞到 <code>nullptr</code>。' },

    { L:A, slow:1, fast:2, act:'move',
      eq:'slow → index 1　　fast → index 2　　slow != fast',
      note:'fast 與 fast->next 都還在 → while 條件成立,繼續',
      text:'<strong>第 1 輪</strong> · <code>slow</code> 走一步到 index 1、<code>fast</code> 走兩步到 index 2。兩者不同,而且 <code>fast</code> 和 <code>fast-&gt;next</code> 都還在,所以 <code>while (fast &amp;&amp; fast-&gt;next)</code> 成立,再跑一輪。' },

    { L:A, slow:2, fast:1, act:'move',
      eq:'slow → index 2　　fast → index 1(繞回來了)　　slow != fast',
      note:'fast 已經繞環一圈回到 index 1 —— 它在環裡,出不去了',
      text:'<strong>第 2 輪</strong> · <code>fast</code> 從 index 2 走兩步:2 → 3 → <strong>1</strong>(踩到回邊繞回來了)。<strong>一旦進了環就再也出不去</strong>,所以接下來它只會在環裡一直轉,而 slow 也遲早會進來。' },

    { L:A, slow:3, fast:3, act:'meet',
      eq:'slow → index 3　　fast → index 3　　slow == fast  → return true',
      note:'兩者相遇 ⇒ 有環。相遇點不一定是環的入口,那是 142 的事',
      text:'<strong>第 3 輪 · 相遇</strong> · 兩個指標都落在 index 3 → <strong><code>return true</code></strong>。注意<strong>相遇點(index 3)不是環的入口(index 1)</strong> —— 這題只要知道「有沒有環」,不必找入口。<b>要找入口是 <a href="https://leetcode.com/problems/linked-list-cycle-ii/" target="_blank" rel="noopener">142 ↗</a>,做法是從 head 和相遇點各走一步,實測 7260 種結構都會在入口碰頭。</b>' },

    { L:B, slow:1, fast:2, act:'move',
      eq:'無環對照:slow → index 1　　fast → index 2',
      note:'沒有回邊時,fast 只會一路往右,不可能回頭',
      text:'<strong>無環對照</strong> · 換成 <code>[1,2,3,4,5]</code>,尾巴指向 <code>nullptr</code>。同樣跑一輪。<strong>沒有回邊,fast 就只能一路往右</strong> —— 它和 slow 的距離只會越拉越開,永遠不可能相等。' },

    { L:B, slow:2, fast:4, act:'exit',
      eq:'slow → index 2　　fast → index 4,而 fast->next 是 null → 跳出',
      note:'fast 撞到邊界 ⇒ 無環。這也是為什麼迴圈條件要同時檢查 fast 和 fast->next',
      text:'<strong>無環 · 結束</strong> · <code>fast</code> 到 index 4,<code>fast-&gt;next</code> 是 <code>nullptr</code>,<code>while (fast &amp;&amp; fast-&gt;next)</code> 不成立 → <strong><code>return false</code></strong>。<strong>兩個條件都要檢查</strong>:<code>fast</code> 為空是「剛好停在界外」,<code>fast-&gt;next</code> 為空是「再走兩步會出界」。實測無環最壞跑 <code>⌈n/2⌉</code> 輪,有環最壞跑 <code>n</code> 輪(整條成環時)。' },
  ];

  let step = 0, timer = null;

  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||360; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function arrowH(x1,x2,y,col){ ctx.strokeStyle=col; ctx.fillStyle=col; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(x1,y); ctx.lineTo(x2,y); ctx.stroke();
    const d=x2>x1?1:-1; ctx.beginPath(); ctx.moveTo(x2,y); ctx.lineTo(x2-d*8,y-5); ctx.lineTo(x2-d*8,y+5); ctx.closePath(); ctx.fill(); }

  const PTR_Y = 58, IDX_Y = 80, NODE_TOP = 92, NH = 46,   // 索引移到節點上方 —— 下方要留給回邊弧線
        MIDY = NODE_TOP + NH/2, NODE_BOT = NODE_TOP + NH;

  function draw(){
    fit();
    const s = steps[step], w = canvas.clientWidth, PAD = 34;
    const V = s.L.vals, n = V.length, pos = s.L.pos;
    const done = s.act === 'meet' || s.act === 'exit';
    const found = s.act === 'meet';
    ctx.fillStyle = C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);

    const usable = w - 2*PAD - 60;
    const nw = Math.min(62, usable / n - 34);
    const gap = Math.min(46, (usable - n*nw) / (n - 1 || 1));
    const x0 = PAD + 12;
    const edge = i => x0 + i*(nw+gap);
    const cx = i => edge(i) + nw/2;

    // ── BAND 1 標題 ──
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 上排標記 = 兩個指標的位置　下方弧線 = 尾巴接回去的那條邊', PAD, 16);
    ctx.textAlign='right'; ctx.font='700 12.5px "JetBrains Mono", monospace';
    ctx.fillStyle = found ? C.okT : (s.act==='exit' ? C.curT : C.text);
    ctx.fillText(pos >= 0 ? ('pos = ' + pos + '(有環)') : 'pos = −1(無環)', w - PAD, 16);

    ctx.textAlign='center'; ctx.font='700 12.5px "JetBrains Mono", monospace';
    ctx.fillStyle = found ? C.okT : (s.act==='exit' ? C.curT : C.winT);
    ctx.fillText(found ? '相遇 → 有環' : (s.act==='exit' ? 'fast 撞到 null → 無環'
                 : ('slow = index ' + s.slow + '　　fast = index ' + (s.fast<0?'null':s.fast))), w/2, 44);

    // ── 前進箭頭 ──
    for (let i = 0; i + 1 < n; i++) arrowH(edge(i)+nw+4, edge(i+1)-4, MIDY, C.grid);
    // 尾端:null 或 回邊
    if (pos < 0) {
      const xs = edge(n-1)+nw+4, xe = xs + 26;
      arrowH(xs, xe, MIDY, C.curS);
      ctx.fillStyle=C.curT; ctx.font='700 13px "JetBrains Mono", monospace';
      ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText('∅', xe+5, MIDY);
    } else {
      const xA = cx(n-1), xB = cx(pos), dip = NODE_BOT + 56;
      ctx.strokeStyle = C.segS; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(xA, NODE_BOT + 2);
      ctx.quadraticCurveTo((xA+xB)/2, dip, xB, NODE_BOT + 2); ctx.stroke();
      ctx.fillStyle = C.segS;                                   // 箭頭指回 pos
      ctx.beginPath(); ctx.moveTo(xB, NODE_BOT+2); ctx.lineTo(xB-5, NODE_BOT+13); ctx.lineTo(xB+5, NODE_BOT+13); ctx.closePath(); ctx.fill();
      ctx.fillStyle = C.segT; ctx.font='700 11px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='top';
      ctx.fillText('尾巴 next 接回 index ' + pos, (xA+xB)/2, dip - 16);
    }

    // ── 節點 ──
    for (let i = 0; i < n; i++) {
      const isS = i === s.slow, isF = i === s.fast;
      let bg=C.off, bd=C.offS, tx=C.offT;
      if (found && isS)      { bg=C.ok;  bd=C.okS;  tx=C.okT; }
      else if (isS && isF)   { bg=C.ok;  bd=C.okS;  tx=C.okT; }
      else if (isF)          { bg=C.cur; bd=C.curS; tx=C.curT; }
      else if (isS)          { bg=C.win; bd=C.winS; tx=C.winT; }
      else if (pos>=0 && i>=pos) { bg=C.seg; bd=C.segS; tx=C.segT; }   // 環內的節點淡橘
      rr(edge(i), NODE_TOP, nw, NH, 6);
      ctx.fillStyle=bg; ctx.fill();
      ctx.lineWidth=(isS||isF)?2.4:1.5; ctx.strokeStyle=bd; ctx.stroke();
      ctx.fillStyle=tx; ctx.font='700 16px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(V[i]), cx(i), MIDY);
      // 索引(畫在節點上方,免得和下面的回邊弧線疊在一起)
      ctx.fillStyle=C.dim; ctx.font='500 10.5px "JetBrains Mono", monospace';
      ctx.textBaseline='alphabetic'; ctx.fillText(String(i), cx(i), IDX_Y);
    }

    // ── 指標標記 ──
    ctx.textAlign='center'; ctx.textBaseline='alphabetic'; ctx.font='700 11.5px "JetBrains Mono", monospace';
    if (s.slow === s.fast) { ctx.fillStyle = C.okT; ctx.fillText('slow = fast', cx(s.slow), PTR_Y); }
    else {
      ctx.fillStyle = C.winT; ctx.fillText('slow', cx(s.slow), PTR_Y);
      if (s.fast >= 0) { ctx.fillStyle = C.curT; ctx.fillText('fast', cx(s.fast), PTR_Y); }
    }

    // ── BAND 2 ──
    const B2 = 216;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 這一輪', PAD, B2);
    rr(PAD, B2+10, w-2*PAD, 42, 6);
    ctx.fillStyle = found ? C.ok : (s.act==='intro' ? '#fafaf6' : C.cur); ctx.fill();
    ctx.lineWidth=1.6; ctx.strokeStyle = found ? C.okS : (s.act==='intro' ? C.grid : C.curS); ctx.stroke();
    ctx.fillStyle = found ? C.okT : (s.act==='intro' ? C.text : C.curT);
    ctx.font='700 12.5px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(s.eq, w/2, B2+31);

    // ── BAND 3 ──
    const B3 = 288;
    ctx.fillStyle=C.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 為什麼', PAD, B3);
    rr(PAD, B3+10, w-2*PAD, 40, 6);
    ctx.fillStyle = found ? C.ok : '#fafaf6'; ctx.fill();
    ctx.lineWidth=1.6; ctx.strokeStyle = found ? C.okS : C.grid; ctx.stroke();
    ctx.fillStyle = found ? C.okT : C.text;
    ctx.font='600 12.5px "Noto Sans TC", sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(s.note, w/2, B3+30);
  }

  function update(){ if(stepEl) stepEl.textContent=String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0'); if(labelEl) labelEl.innerHTML=steps[step].text; draw(); }
  function next(){ if(step<steps.length-1){step++;update();}else stop(); }
  function prev(){ if(step>0){step--;update();} }
  function reset(){ stop(); step=0; update(); }
  function play(){ if(timer){stop();return;} bPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){stop();return;} next(); },1950); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} if(bPlay) bPlay.textContent='Play'; }
  bPrev&&bPrev.addEventListener('click',prev); bNext&&bNext.addEventListener('click',next); bPlay&&bPlay.addEventListener('click',play); bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();}); if(window.ResizeObserver){ new ResizeObserver(()=>{fit();draw();}).observe(canvas); }
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw); fit(); update();
})();
