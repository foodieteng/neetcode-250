/* ============================================================
   P4 · Median of Two Sorted Arrays — 二分「切點」· viz
   不去合併陣列,而是直接二分「nums1 要切幾個到左半」這個數字 i。
   j = left - i 自動決定,left = (m+n+1)/2。
   合法切點的條件:L1 <= R2 且 L2 <= R1(交叉比較)。
     L1 > R2 → nums1 切太多 → r = i - 1
     L2 > R1 → nums1 切太少 → l = i + 1
   例 nums1=[1,3,5,13,25], nums2=[6,12,15,18,21] → 3 輪得 12.5。
   尾巴兩步換成 [1,2]/[3,4],示範 i == m 時 R1 = +inf 的哨兵。
     BAND 1  兩排格子 + 切線 + 四個邊界值 L1|R1 / L2|R2
     BAND 2  這一輪的交叉比較
     BAND 3  這一步的決定
   所有數字取自實測 trace(見 review.html 範例 Trace),未手算。
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

  const A = [1,3,5,13,25], B = [6,12,15,18,21];      // 主例,left = 5
  const A2 = [1,2],        B2 = [3,4];               // 尾例,示範 +inf 哨兵

  // i = nums1 切幾個到左半;i < 0 表示還沒開始切
  const steps = [
    { a:A, b:B, left:5, i:-1, lo:0, hi:5, act:'intro', ans:null,
      eq:'left = (m + n + 1) / 2 = (5 + 5 + 1) / 2 = 5',
      note:'左半固定放 left 格 → 只要決定 nums1 出幾格,nums2 出幾格就自動定了',
      text:'<strong>INITIAL</strong> · 不合併,而是<strong>切一刀</strong>:把兩排各切成左右兩段,讓<strong>左半總共 <code>left = 5</code> 格</strong>、且左半每個數都 ≤ 右半每個數。這樣中位數就只跟<strong>切口附近那幾個數</strong>有關。要決定的只有一個數字:<code>i</code> = nums1 出幾格。<code>j = left − i</code> 跟著決定 —— <strong>兩個自由度變成一個</strong>,可以二分。' },

    { a:A, b:B, left:5, i:2, lo:0, hi:5, act:'too-few', ans:null,
      eq:'L2 = 15 > R1 = 5 → nums1 切太少',
      note:'nums2 左半的最大值跑到 nums1 右半的最小值之上 → 要多拿 nums1 → l = i + 1',
      text:'<strong>R1 · 試 i = 2</strong>(<code>j = 5 − 2 = 3</code>)· 左半是 <code>1,3</code> + <code>6,12,15</code>,右半是 <code>5,13,25</code> + <code>18,21</code>。<strong>交叉比較</strong>:<code>L2 = 15</code> 竟然比 <code>R1 = 5</code> 大 —— 左半混進了比右半還大的數,不合法。<strong>nums1 出太少</strong>,得往右找 → <code>l = 3</code>。' },

    { a:A, b:B, left:5, i:4, lo:3, hi:5, act:'too-many', ans:null,
      eq:'L1 = 13 > R2 = 12 → nums1 切太多',
      note:'反過來了 → nums1 要少拿一點 → r = i − 1(i 已被否證,不必保留)',
      text:'<strong>R2 · 試 i = 4</strong>(<code>j = 1</code>)· 這次反過來:<code>L1 = 13</code> 大於 <code>R2 = 12</code>。<strong>nums1 出太多</strong>了 → <code>r = i − 1 = 3</code>。注意兩個分支是<strong>對稱的一對</strong>,分別對應「切多了」和「切少了」。' },

    { a:A, b:B, left:5, i:3, lo:3, hi:3, act:'valid', ans:null,
      eq:'L1 = 5 ≤ R2 = 15 且 L2 = 12 ≤ R1 = 13 → 切點合法',
      note:'兩個交叉條件同時成立 ⇒ 左半每個數都 ≤ 右半每個數',
      text:'<strong>R3 · 試 i = 3</strong>(<code>j = 2</code>)· <code>L1 = 5 ≤ R2 = 15</code> 而且 <code>L2 = 12 ≤ R1 = 13</code> —— <strong>兩個交叉條件同時成立</strong>。左半 <code>{1,3,5,6,12}</code> 的每一個都不大於右半 <code>{13,25,15,18,21}</code> 的每一個,這就是我們要的切法。' },

    { a:A, b:B, left:5, i:3, lo:3, hi:3, act:'done-even', ans:12.5,
      eq:'(m+n) 偶數 → (max(L1,L2) + min(R1,R2)) / 2.0 = (12 + 13) / 2.0',
      note:'偶數:中間兩個數就是「左半最大」和「右半最小」',
      text:'<strong>完成</strong> · <code>m + n = 10</code> 是偶數,中位數是中間兩數的平均。<strong>左半最大 = max(L1, L2) = 12</strong>,<strong>右半最小 = min(R1, R2) = 13</strong> → <code>(12 + 13) / 2.0 = <strong>12.5</strong></code>。合併後是 <code>[1,3,5,6,12,13,15,18,21,25]</code>,第 5、6 個正是 12 和 13。<strong>只用了 3 輪。</strong>' },

    { a:A2, b:B2, left:2, i:2, lo:2, hi:2, act:'valid', ans:null,
      eq:'i == m → R1 沒有東西可指 → R1 = +∞',
      note:'哨兵讓「切在最邊上」不必特判 —— +∞ 在 min() 裡永遠輸',
      text:'<strong>哨兵示範</strong> · 換成官方範例 2:<code>nums1=[1,2]</code>、<code>nums2=[3,4]</code>,<code>left = 2</code>。這次 <code>i = 2 = m</code>,<strong>nums1 整排都進了左半</strong>,右半沒有東西 —— <code>R1</code> 該取什麼?取 <code>INT_MAX</code>。同理 <code>j = 0</code> 時 <code>L2 = INT_MIN</code>。<strong>哨兵的作用是讓四種邊界情形不必寫特判</strong>:<code>+∞</code> 在 <code>min()</code> 裡永遠輸、<code>−∞</code> 在 <code>max()</code> 裡永遠輸。' },

    { a:A2, b:B2, left:2, i:2, lo:2, hi:2, act:'done-even', ans:2.5,
      eq:'(max(2, −∞) + min(+∞, 3)) / 2.0 = (2 + 3) / 2.0 = 2.5',
      note:'哨兵永遠被 max/min 淘汰掉 —— 實測 18 萬組,偶數分支從沒真的加到 ±∞',
      text:'<strong>哨兵不會污染答案</strong> · <code>max(L1, L2) = max(2, −∞) = 2</code>、<code>min(R1, R2) = min(+∞, 3) = 3</code> → <strong>2.5</strong>。<strong>兩個哨兵都被淘汰掉了。</strong>實測 18 萬組(含全部 <code>m+n ≤ 8</code> 的窮舉與 ±10⁶ 的極端值),偶數分支<strong>從來沒有</strong>真的把 <code>±∞</code> 加進去 —— 所以那行 <code>int</code> 加法不會溢位。' },
  ];

  let step = 0, timer = null;

  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  const CH = 44, ROW1 = 82, ROW2 = 166;   // 兩排格子的頂端;ROW1 底 126,與 ROW2 頂差 40
  const HDR1 = ROW1 - 12, HDR2 = ROW2 - 12;

  // 畫一排:cells / 切在 cut 之前(cut 個進左半)
  function drawRow(cells, cut, top, hdrY, tag, w, PAD, done) {
    const LEFTTAG = 54;
    const areaX = PAD + LEFTTAG, areaW = w - 2*PAD - LEFTTAG - 40;   // 右邊留 40 給 +inf 標記
    const k = cells.length;
    const cw = Math.min(62, areaW / k - 20);
    const gap = Math.min(26, (areaW - k*cw) / (k - 1 || 1));
    const x0 = areaX + (areaW - (k*cw + (k-1)*gap)) / 2;
    const edge = c => x0 + c * (cw + gap);

    // 左側 tag:貼著第一格左邊(短陣列時才不會被丟在畫布邊緣)
    ctx.fillStyle = C.text; ctx.font='700 12px "JetBrains Mono", monospace';
    ctx.textAlign='right'; ctx.textBaseline='middle';
    const tagShift = (cut <= 0) ? 56 : 26;   // 左邊要畫 −∞ 時,tag 再往左讓位
    ctx.fillText(tag, Math.max(PAD + 44, x0 - gap/2 - tagShift), top + CH/2);

    for (let c = 0; c < k; c++) {
      const inLeft = c < cut;
      const isBoundary = (c === cut - 1) || (c === cut);
      let bg = inLeft ? C.win : C.seg, bd = inLeft ? C.winS : C.segS, tx = inLeft ? C.winT : C.segT;
      if (isBoundary) { bg = done ? C.ok : C.cur; bd = done ? C.okS : C.curS; tx = done ? C.okT : C.curT; }
      rr(edge(c), top, cw, CH, 5);
      ctx.fillStyle = bg; ctx.fill();
      ctx.lineWidth = isBoundary ? 2.4 : 1.5; ctx.strokeStyle = bd; ctx.stroke();
      ctx.fillStyle = tx; ctx.font='700 15px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(cells[c]), edge(c) + cw/2, top + CH/2);
      // 索引列,壓在格子上方 12px
      ctx.fillStyle = C.dim; ctx.font='500 10.5px "JetBrains Mono", monospace';
      ctx.textBaseline='alphabetic';
      ctx.fillText(String(c), edge(c) + cw/2, hdrY);
    }

    // 切線:落在 cut-1 與 cut 之間的空隙正中央
    let lineX;
    if (cut <= 0)      lineX = x0 - gap/2;
    else if (cut >= k) lineX = edge(k-1) + cw + gap/2;
    else               lineX = edge(cut) - gap/2;
    ctx.strokeStyle = done ? C.okS : C.coral; ctx.lineWidth = 2.4; ctx.setLineDash([5,4]);
    ctx.beginPath(); ctx.moveTo(lineX, top - 8); ctx.lineTo(lineX, top + CH + 8); ctx.stroke();
    ctx.setLineDash([]);

    // 哨兵標記
    ctx.font='700 11.5px "JetBrains Mono", monospace'; ctx.textBaseline='middle';
    if (cut <= 0) { ctx.fillStyle = C.curT; ctx.textAlign='right'; ctx.fillText('−∞', x0 - gap/2 - 6, top + CH/2); }
    if (cut >= k) { ctx.fillStyle = C.curT; ctx.textAlign='left';  ctx.fillText('+∞', edge(k-1) + cw + gap/2 + 6, top + CH/2); }
  }

  function draw(){
    fit();
    const s = steps[step], w = canvas.clientWidth, PAD = 34;
    const done = s.act === 'done-even';
    const m = s.a.length, n = s.b.length;
    const i = s.i, j = i < 0 ? -1 : s.left - i;
    ctx.fillStyle = C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);

    // ── BAND 1 標題 ──
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 藍 = 左半　橘 = 右半　紅框 = 切口旁的四個值', PAD, 16);
    ctx.textAlign='right'; ctx.font='700 12.5px "JetBrains Mono", monospace';
    ctx.fillStyle = done ? C.okT : C.text;
    ctx.fillText('left = ' + s.left, w - PAD, 16);

    // 狀態列
    ctx.textAlign='center'; ctx.font='700 12.5px "JetBrains Mono", monospace';
    ctx.fillStyle = done ? C.okT : C.winT;
    ctx.fillText(i < 0 ? ('i 的候選 [ 0 , ' + m + ' ]   還沒切')
                       : ('候選 [ ' + s.lo + ' , ' + s.hi + ' ]　i = ' + i + '　j = left − i = ' + j),
                 w/2, 44);

    drawRow(s.a, i < 0 ? 0 : i, ROW1, HDR1, 'nums1', w, PAD, done);
    drawRow(s.b, i < 0 ? 0 : j, ROW2, HDR2, 'nums2', w, PAD, done);

    // 左半 / 右半 摘要
    if (i >= 0) {
      const L1 = i === 0 ? '−∞' : s.a[i-1], R1 = i === m ? '+∞' : s.a[i];
      const L2 = j === 0 ? '−∞' : s.b[j-1], R2 = j === n ? '+∞' : s.b[j];
      ctx.textAlign='center'; ctx.textBaseline='alphabetic';
      ctx.font='700 12px "JetBrains Mono", monospace';
      ctx.fillStyle = done ? C.okT : C.curT;
      ctx.fillText('L1 = ' + L1 + ' | R1 = ' + R1 + '　　　L2 = ' + L2 + ' | R2 = ' + R2, w/2, 234);
    }

    // ── BAND 2 ──
    const B2Y = 258;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 交叉比較:L1 ≤ R2 且 L2 ≤ R1 才合法', PAD, B2Y);
    rr(PAD, B2Y + 10, w - 2*PAD, 42, 6);
    const good = s.act === 'valid' || done;
    ctx.fillStyle = good ? C.ok : (s.act === 'intro' ? '#fafaf6' : C.cur); ctx.fill();
    ctx.lineWidth = 1.6; ctx.strokeStyle = good ? C.okS : (s.act === 'intro' ? C.grid : C.curS); ctx.stroke();
    ctx.fillStyle = good ? C.okT : (s.act === 'intro' ? C.text : C.curT);
    ctx.font='700 13px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(s.eq, w/2, B2Y + 31);

    // ── BAND 3 ──
    const B3Y = 330;
    ctx.fillStyle=C.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 切太多 → r = i − 1;切太少 → l = i + 1', PAD, B3Y);
    rr(PAD, B3Y + 10, w - 2*PAD, 40, 6);
    ctx.fillStyle = done ? C.ok : '#fafaf6'; ctx.fill();
    ctx.lineWidth = 1.6; ctx.strokeStyle = done ? C.okS : C.grid; ctx.stroke();
    ctx.fillStyle = done ? C.okT : C.text;
    ctx.font='600 12.5px "Noto Sans TC", sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(s.note, w/2, B3Y + 30);
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
