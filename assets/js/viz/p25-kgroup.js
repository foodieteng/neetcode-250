/* ============================================================
   P25 · Reverse Nodes in k-Group — 遞迴版 · viz
     每一層做三件事:數長度 → 若夠 k 個就翻 k 圈 → 遞迴處理後面再接回來
       head->next = reverseKGroup(curr, k);   // head 翻完之後變成這一組的段尾
       return prev;                            // prev 是這一組的新段頭
   反轉本體與 206 / 92 一字不差,新東西只有「遞迴回來之後怎麼接」。
   例 [1,2,3,4,5], k=2 → [2,1,4,3,5]。
     BAND 1  節點鏈 + 箭頭(橘 = 待翻,藍 = 已接好)+ 遞迴層數與「數長度」的累計成本
     BAND 2  這一步執行了什麼
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

  const V = [1,2,3,4,5], N = V.length, K = 2;

  // nxt = 每個節點的 next(索引;-1 = nullptr);grp = 這一步聚焦的節點索引
  // depth = 目前遞迴層;count = 這一層數長度走了幾步;total = 累計
  const steps = [
    { nxt:[1,2,3,4,-1], grp:[], depth:0, count:0, total:0, act:'intro',
      blue:[],
      eq:'reverseKGroup([1,2,3,4,5], k = 2)',
      note:'每一層做三件事:數長度 → 翻 k 圈 → 遞迴處理剩下的,再把兩段接起來',
      text:'<strong>INITIAL</strong> · 這題是 <a href="../p92/index.html">92</a> 的「重複很多次」版本。<b>遞迴的想法很自然:<strong>翻好前 k 個,剩下的交給自己</strong></b>。每一層只需要處理<strong>一組</strong>,然後把「翻好的這組」和「遞迴回來的結果」接起來。' },

    { nxt:[1,2,3,4,-1], grp:[0,1,2,3,4], depth:1, count:5, total:5, act:'count',
      blue:[],
      eq:'第 1 層:while (tail) { tail = tail->next; n++; }   → n = 5',
      note:'這裡走完了整條串列 —— 而它只是為了回答「有沒有 k 個」這個問題',
      text:'<strong>第 1 層 · 數長度</strong> · 先把<strong>整條串列走一遍</strong>算出 <code>n = 5</code>,確認 <code>n ≥ k</code>。<b>這一步是正確的,但它問的問題其實只需要走 <code>k</code> 步</b> —— <strong>「有沒有至少 k 個?」不需要知道總共有幾個。</strong>這個差別會在後面累積成真正的代價。' },

    { nxt:[-1,0,3,4,-1], grp:[0,1], depth:1, count:0, total:5, act:'rev',
      blue:[0,1],
      eq:'第 1 層:翻 k = 2 圈 → prev = 節點 2(新段頭),curr = 節點 3',
      note:'反轉本體和 206 / 92 一字不差 —— 差別只在「翻完之後怎麼接」',
      text:'<strong>第 1 層 · 反轉</strong> · 翻掉前兩個:<code>1 → nullptr</code>、<code>2 → 1</code>。此刻 <code>prev</code> = 節點 <strong>2</strong>(<strong>新段頭</strong>),<code>curr</code> = 節點 <strong>3</strong>(<strong>下一組的開頭</strong>)。<b>而原本的 <code>head</code>(節點 1)現在是<strong>這一組的段尾</strong></b> —— 它正等著接上遞迴回來的結果。' },

    { nxt:[-1,0,3,4,-1], grp:[2,3,4], depth:2, count:3, total:8, act:'count',
      blue:[0,1],
      eq:'第 2 層:又走一次 → n = 3　　（累計已經走了 5 + 3 = 8 步)',
      note:'第 1 層已經知道剩下 3 個了,但這個資訊沒有傳下去,所以要重數一次',
      text:'<strong>第 2 層 · 又數一次</strong> · 遞迴到 <code>[3,4,5]</code>,<strong>再走一次算出 <code>n = 3</code></strong>。<b>但第 1 層其實早就知道剩下 3 個了</b> —— <strong>這個資訊沒有被傳下去,所以每一層都要重數</strong>。<b>n=5000、k=1 時,這個迴圈實測總共跑了 12502500 次。</b>' },

    { nxt:[-1,0,-1,2,-1], grp:[2,3], depth:2, count:0, total:8, act:'rev',
      blue:[0,1,2,3],
      eq:'第 2 層:翻 2 圈 → prev = 節點 4,curr = 節點 5',
      note:'和第 1 層一模一樣的三行 —— 遞迴的好處就是這段只要寫一次',
      text:'<strong>第 2 層 · 反轉</strong> · 翻掉 <code>[3,4]</code>:<code>3 → nullptr</code>、<code>4 → 3</code>。<b>整條鏈現在斷成三截</b>:<code>2→1→∅</code>、<code>4→3→∅</code>、<code>5→∅</code>。<strong>接下來的兩步就是把它們接回去。</strong>' },

    { nxt:[-1,0,-1,2,-1], grp:[4], depth:3, count:1, total:9, act:'stop',
      blue:[0,1,2,3,4],
      eq:'第 3 層:n = 1 < k = 2 → return head（節點 5,原封不動)',
      note:'遞迴的終止條件 —— 不足 k 個的尾巴保持原樣,這正是題目要求的',
      text:'<strong>第 3 層 · 終止</strong> · 只剩節點 <code>5</code>,<code>n = 1 &lt; k</code>,<strong>直接原封不動回傳</strong>。<b>這就是題目說的「不足 k 個的部分保持原順序」</b> —— <strong>而它不需要任何特別處理,就是遞迴的 base case。</strong>' },

    { nxt:[-1,0,4,2,-1], grp:[2,4], depth:2, count:0, total:9, act:'link',
      blue:[0,1,2,3,4],
      eq:'回到第 2 層:head->next = 回傳值   →   節點 3 → 節點 5;return prev = 節點 4',
      note:'head 翻完之後是段尾,所以接上去的正是「後面那一整段」',
      text:'<strong>回捲 · 第 2 層接線</strong> · <code>head</code> 是節點 <strong>3</strong> —— <b>翻完之後它是這一組的<strong>段尾</strong></b>,所以 <code>head-&gt;next</code> 要接上遞迴回來的結果(節點 5)。<strong>然後回傳 <code>prev</code>(節點 4),也就是這一組的新段頭。</strong>' },

    { nxt:[3,0,4,2,-1], grp:[0,3], depth:1, count:0, total:9, act:'link',
      blue:[0,1,2,3,4],
      eq:'回到第 1 層:節點 1 → 節點 4;return prev = 節點 2   ← 這就是最終的頭',
      note:'兩層各一行接線,而且形狀完全一樣 —— 遞迴幫你把「重複」收掉了',
      text:'<strong>回捲 · 第 1 層接線</strong> · 同樣的一行:<code>head</code>(節點 1)接上遞迴結果(節點 4),回傳 <code>prev</code>(節點 <strong>2</strong>)—— <b>那就是整條串列的新頭</b>。<strong>兩層的接線<em>形狀完全一樣</em>,這正是遞迴的價值:<a href="../p92/code.html">92</a> 要手動維護的 <code>tail</code> 指標,在這裡被呼叫堆疊自動處理掉了。</strong>' },

    { nxt:[3,0,4,2,-1], grp:[], depth:0, count:0, total:9, act:'done',
      blue:[0,1,2,3,4],
      eq:'[2, 1, 4, 3, 5]     // 實測窮舉 n=0..12 × k=1..n+2 共 104 組 + 隨機 20 萬組,不一致 0',
      note:'答案完全正確 —— 但「每層都重數一次長度」讓時間變成 O(n²/k),見程式碼頁',
      text:'<strong>完成</strong> · <code>2 → 1 → 4 → 3 → 5</code>,與官方範例一致。<strong>正確性實測</strong>:窮舉 <code>n = 0..12</code> × <code>k = 1..n+2</code> 共 104 組,加上 20 萬組隨機測資(含負值與重複),<strong>不一致 0</strong>。<b>但注意右上角那個累計數字</b> —— <strong>光是「數長度」就走了 9 步,而整條串列只有 5 個節點</strong>。<b>n=5000、k=1 時這個數字是 12502500,而不是 5000。</b>' },
  ];

  let step = 0, timer = null;

  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||390; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function arrowH(x1,x2,y,col){ ctx.strokeStyle=col; ctx.fillStyle=col; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(x1,y); ctx.lineTo(x2,y); ctx.stroke();
    const d=x2>x1?1:-1; ctx.beginPath(); ctx.moveTo(x2,y); ctx.lineTo(x2-d*8,y-5); ctx.lineTo(x2-d*8,y+5); ctx.closePath(); ctx.fill(); }

  const TAG_Y = 74, NODE_TOP = 84, NH = 44, MIDY = NODE_TOP + NH/2, NODE_BOT = NODE_TOP + NH;
  const NULL_Y = NODE_BOT + 3, LANE = [NODE_BOT + 38, NODE_BOT + 66];
  const INFO_Y = 214;

  function draw(){
    fit();
    const s = steps[step], w = canvas.clientWidth, PAD = 28;
    const done = s.act === 'done';
    ctx.fillStyle = C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);

    // ── BAND 1 標題 ──
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 橘 = 待翻　藍 = 已接好　∅ = nullptr', PAD, 16);
    ctx.textAlign='right'; ctx.font='700 12.5px "JetBrains Mono", monospace';
    ctx.fillStyle = done ? C.okT : C.text;
    ctx.fillText('k = ' + K + '　數長度已累計走 ' + s.total + ' 步', w - PAD, 16);

    ctx.textAlign='center'; ctx.font='700 12.5px "JetBrains Mono", monospace';
    ctx.fillStyle = done ? C.okT : (s.act==='count' ? C.curT : (s.act==='intro' ? C.text : C.winT));
    ctx.fillText(s.eq, w/2, 42);

    const usable = w - 2*PAD - 30;
    const nw = Math.min(58, usable / N - 34);
    const gap = Math.min(48, (usable - N*nw) / (N - 1));
    const x0 = PAD + 12;
    const edge = i => x0 + i*(nw+gap);
    const cx = i => edge(i) + nw/2;

    // ── 箭頭 ──
    const longEdges = [];
    for (let i = 0; i < N; i++) {
      const j = s.nxt[i];
      if (j === -1) {
        if (i === N - 1) {        // 最後一個節點的 ∅ 畫在右側,免得撞到下方車道的箭頭
          ctx.strokeStyle=C.grid; ctx.lineWidth=2;
          ctx.beginPath(); ctx.moveTo(edge(i)+nw+4, MIDY); ctx.lineTo(edge(i)+nw+16, MIDY); ctx.stroke();
          ctx.fillStyle=C.offT; ctx.font='700 12px "JetBrains Mono", monospace';
          ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText('∅', edge(i)+nw+20, MIDY);
        } else {
          ctx.strokeStyle=C.curS; ctx.lineWidth=2;
          ctx.beginPath(); ctx.moveTo(cx(i), NULL_Y); ctx.lineTo(cx(i), NULL_Y+8); ctx.stroke();
          ctx.fillStyle=C.curT; ctx.font='700 12px "JetBrains Mono", monospace';
          ctx.textAlign='center'; ctx.textBaseline='top'; ctx.fillText('∅', cx(i), NULL_Y+9);
        }
      } else if (j === i + 1) arrowH(edge(i)+nw+4, edge(j)-4, MIDY, C.segS);
      else if (j === i - 1) arrowH(edge(i)-4, edge(j)+nw+4, MIDY, C.winS);
      else longEdges.push([i, j]);
    }
    longEdges.sort((a,b)=>a[0]-b[0]).forEach(([i,j], m) => {
      const y = LANE[Math.min(m, LANE.length-1)], xA = cx(i), xB = cx(j);
      ctx.strokeStyle=C.winS; ctx.lineWidth=2.2;
      ctx.beginPath(); ctx.moveTo(xA, NODE_BOT+2);
      ctx.bezierCurveTo(xA, y, xB, y, xB, NODE_BOT+2); ctx.stroke();
      ctx.fillStyle=C.winS; ctx.beginPath();
      ctx.moveTo(xB, NODE_BOT+2); ctx.lineTo(xB-5, NODE_BOT+13); ctx.lineTo(xB+5, NODE_BOT+13); ctx.closePath(); ctx.fill();
    });

    // ── 節點 ──
    for (let i = 0; i < N; i++) {
      const inGrp = s.grp.includes(i);
      let bg, bd, tx;
      if (done)                        { bg=C.ok;  bd=C.okS;  tx=C.okT; }
      else if (inGrp && s.act==='count'){ bg=C.cur; bd=C.curS; tx=C.curT; }
      else if (s.blue.includes(i))     { bg=C.win; bd=C.winS; tx=C.winT; }
      else                             { bg=C.seg; bd=C.segS; tx=C.segT; }
      rr(edge(i), NODE_TOP, nw, NH, 6);
      ctx.fillStyle=bg; ctx.fill();
      ctx.lineWidth = inGrp?2.4:1.6; ctx.strokeStyle=bd; ctx.stroke();
      ctx.fillStyle=tx; ctx.font='700 16px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(V[i]), cx(i), MIDY);
    }

    // ── 每組的框線(k = 2 一組)──
    if (!done && s.act !== 'intro') {
      ctx.textAlign='center'; ctx.textBaseline='bottom'; ctx.font='700 10.5px "JetBrains Mono", monospace';
      ctx.fillStyle = s.act==='count' ? C.curT : C.winT;
      if (s.grp.length) {
        const mid = (cx(s.grp[0]) + cx(s.grp[s.grp.length-1]))/2;
        ctx.fillText(s.act === 'link' ? '第 ' + s.depth + ' 層的接線'
                   : s.act === 'stop' ? '不足 k 個 → 原樣返回'
                   : '第 ' + s.depth + ' 層處理的範圍', mid, TAG_Y);
      }
    }

    // ── 遞迴 / 成本資訊 ──
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='600 12px "Noto Sans TC", sans-serif';
    ctx.fillStyle = done ? C.okT : C.dim;
    const info = done
      ? '整條串列只有 5 個節點,但「數長度」總共走了 9 步'
      : (s.act==='intro' ? '每一層:數長度 → 翻 k 圈 → 遞迴 → 接回來'
         : ('遞迴深度 ' + s.depth + (s.count ? '　·　這一層數長度走了 ' + s.count + ' 步' : '　·　不用再數') + '　·　累計 ' + s.total + ' 步'));
    ctx.fillText(info, w/2, INFO_Y);

    // ── BAND 2 ──
    const B2 = 240;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 這一步執行了什麼', PAD, B2);
    rr(PAD, B2+10, w-2*PAD, 42, 6);
    ctx.fillStyle = done ? C.ok : (s.act==='intro' ? '#fafaf6' : (s.act==='count' ? C.cur : C.win)); ctx.fill();
    ctx.lineWidth=1.6; ctx.strokeStyle = done ? C.okS : (s.act==='intro' ? C.grid : (s.act==='count' ? C.curS : C.winS)); ctx.stroke();
    ctx.fillStyle = done ? C.okT : (s.act==='intro' ? C.text : (s.act==='count' ? C.curT : C.winT));
    ctx.font='700 12px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(s.eq, w/2, B2+31);

    // ── BAND 3 ──
    const B3 = 312;
    ctx.fillStyle=C.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 為什麼', PAD, B3);
    rr(PAD, B3+10, w-2*PAD, 40, 6);
    ctx.fillStyle = done ? C.ok : '#fafaf6'; ctx.fill();
    ctx.lineWidth=1.6; ctx.strokeStyle = done ? C.okS : C.grid; ctx.stroke();
    ctx.fillStyle = done ? C.okT : C.text;
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
