/* ============================================================
   P153 · Find Minimum in Rotated Sorted Array — 二分「跟右端比」· viz
   旋轉後的陣列是「兩段各自遞增」,最小值就是那個斷崖的底。
   關鍵是拿 nums[m] 跟「右端 nums[r]」比,而不是跟左端比:
     nums[m] > nums[r] → m 還在前半那段高的  → 最小值在 m 右邊 → l = m + 1
     nums[m] < nums[r] → m 已在後半那段低的(或就是最小)→ r = m
   例 [4,5,6,7,0,1,2] → 3 輪得 0。
   尾巴兩步換成未旋轉的 [11,13,15,17],示範「跟右端比」在沒有斷崖時照樣對,
   而「跟左端比」會答 15。
     BAND 1  長條圖(看得見斷崖)+ nums[r] 的水平虛線 + l / m / r 標記
     BAND 2  這一輪的比較
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

  const A = [4,5,6,7,0,1,2];      // 主例,旋轉過
  const B = [11,13,15,17];        // 尾例,完全沒旋轉

  const steps = [
    { a:A, lo:0, hi:6, m:-1, act:'intro', ans:-1,
      eq:'l = 0 , r = 6　　尚未比較',
      note:'旋轉後 = 兩段各自遞增,最小值就是那個斷崖的底',
      text:'<strong>INITIAL</strong> · 排序後再旋轉的陣列長這樣:<strong>兩段各自遞增</strong>,中間掉一次。最小值就是<strong>斷崖底下</strong>那一格。整條不是有序的,所以不能直接二分找值 —— 但「我現在在斷崖的<strong>哪一側</strong>」這件事,只要跟一個固定的參考點比就知道。' },

    { a:A, lo:0, hi:6, m:3, act:'right', ans:-1,
      eq:'nums[3] = 7 > nums[6] = 2 → m 還在高的那段',
      note:'比右端大 ⇒ m 在斷崖左側 ⇒ 最小值在 m 右邊 ⇒ l = m + 1(m 可排除)',
      text:'<strong>R1 · m = 3</strong> · 拿 <code>nums[3] = 7</code> 跟<strong>右端</strong> <code>nums[6] = 2</code> 比。<code>7 &gt; 2</code> —— 如果 <code>m</code> 和 <code>r</code> 在同一段裡,遞增就該是 <code>nums[m] ≤ nums[r]</code>。既然反了,代表<strong>斷崖夾在 m 和 r 之間</strong> ⇒ 最小值在 <code>m</code> 右邊,而且 <code>m</code> 自己不可能是最小 ⇒ <code>l = 4</code>。' },

    { a:A, lo:4, hi:6, m:5, act:'left', ans:-1,
      eq:'nums[5] = 1 < nums[6] = 2 → m 已在低的那段',
      note:'比右端小 ⇒ m 與 r 同段 ⇒ 最小值在 m 或其左 ⇒ r = m(不能減 1)',
      text:'<strong>R2 · m = 5</strong> · <code>nums[5] = 1 &lt; nums[6] = 2</code> —— <code>m</code> 和 <code>r</code> <strong>在同一段遞增裡</strong>,所以 <code>m</code> 右邊的都比它大,最小值只可能在 <code>m</code> 或更左。<strong><code>r = m</code>,不能寫 <code>m − 1</code></strong> —— <code>m</code> 自己還是候選。' },

    { a:A, lo:4, hi:5, m:4, act:'left', ans:-1,
      eq:'nums[4] = 0 < nums[5] = 1 → 再往左收',
      note:'r = m = 4,此時 l == r,區間收成單點',
      text:'<strong>R3 · m = 4</strong> · <code>0 &lt; 1</code>,同樣往左收 → <code>r = 4</code>。區間變成 <code>[4, 4]</code>,<code>l &lt; r</code> 不再成立,跳出。' },

    { a:A, lo:4, hi:4, m:-1, act:'done', ans:4,
      eq:'return nums[4] = 0     // 共 3 輪',
      note:'收斂點就是答案 —— 全程 r 都指向「已知含最小值」的區間右端',
      text:'<strong>完成</strong> · 答案 <strong>0</strong>,3 輪。不變量是:<strong>最小值永遠留在 <code>[l, r]</code> 裡</strong>。<code>l = m+1</code> 那條有證據排除 <code>m</code>,<code>r = m</code> 那條不能排除所以保留 —— 兩條路都不會把答案丟出區間。' },

    { a:B, lo:0, hi:3, m:1, act:'left', ans:-1,
      eq:'未旋轉:nums[1] = 13 < nums[3] = 17 → 往左收',
      note:'沒有斷崖時,整條都「同一段」⇒ 每一輪都往左 ⇒ 自然收到 index 0',
      text:'<strong>沒有斷崖的情形</strong> · 換成 <code>[11,13,15,17]</code>(旋轉 n 次 = 沒動)。這是<strong>最容易寫錯的 case</strong>。跟右端比:<code>13 &lt; 17</code> → <code>r = 1</code>。整條沒有斷崖,所以每一輪都會往左收,最後停在 index 0。' },

    { a:B, lo:0, hi:0, m:-1, act:'done', ans:0,
      eq:'return nums[0] = 11     // 共 2 輪',
      note:'若改成跟左端 nums[l] 比,這個 case 會答 15 —— 實測 36/55 組錯',
      text:'<strong>為什麼參考點必須是右端</strong> · 答案 <strong>11</strong>。如果把判斷式改成跟<strong>左端</strong> <code>nums[l]</code> 比,同一筆輸入會答 <strong>15</strong> —— 因為 <code>nums[m] &gt; nums[l]</code> 在<strong>沒有斷崖時恆成立</strong>,指標一路往右跑過頭。實測窮舉全部 55 種結構,跟左端比錯 <strong>36</strong> 組;跟右端比 <strong>0</strong> 組。' },
  ];

  let step = 0, timer = null;

  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function draw(){
    fit();
    const s = steps[step], w = canvas.clientWidth, PAD = 34;
    const a = s.a, n = a.length;
    const done = s.act === 'done';
    ctx.fillStyle = C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);

    const bw = Math.min(60, (w - 2*PAD) / n - 20);
    const gap = Math.min(30, (w - 2*PAD - n*bw) / (n - 1 || 1));
    const x0 = (w - (n*bw + (n-1)*gap)) / 2;
    const edge = k => x0 + k * (bw + gap);
    const cx = k => edge(k) + bw/2;

    const BASE = 190, MAXH = 118;
    const vMin = Math.min(...a), vMax = Math.max(...a);
    const span = (vMax - vMin) || 1;
    const hOf = v => Math.round(18 + (MAXH - 18) * (v - vMin) / span);
    const IDX_Y = 206, PTR_Y = 224;

    // ── BAND 1 標題 ──
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 長條高度 = 值(看得見斷崖)· 虛線 = nums[r] 的高度', PAD, 16);
    ctx.textAlign='right'; ctx.font='700 12.5px "JetBrains Mono", monospace';
    ctx.fillStyle = done ? C.okT : (s.m >= 0 ? C.segT : C.text);
    ctx.fillText(s.m >= 0 ? ('虛線 nums[r] = ' + a[s.hi]) : ('n = ' + n), w - PAD, 16);

    // 狀態列
    ctx.textAlign='center'; ctx.font='700 12.5px "JetBrains Mono", monospace';
    ctx.fillStyle = done ? C.okT : C.winT;
    ctx.fillText(done ? ('收斂 · 最小值 = ' + a[s.lo] + '(index ' + s.lo + ')')
                      : ('候選 [ ' + s.lo + ' , ' + s.hi + ' ]' + (s.m >= 0 ? '　m = ' + s.m : '')),
                 w/2, 44);

    // nums[r] 的水平虛線 —— 讓「比右端高還是低」一眼可見
    if (s.m >= 0) {
      const yR = BASE - hOf(a[s.hi]);
      ctx.strokeStyle = C.segS; ctx.lineWidth = 1.5; ctx.setLineDash([5,4]);
      ctx.beginPath(); ctx.moveTo(x0 - 16, yR + 0.5); ctx.lineTo(edge(n-1) + bw + 16, yR + 0.5); ctx.stroke();
      ctx.setLineDash([]);
    }

    // ── 長條 ──
    for (let k = 0; k < n; k++) {
      const h = hOf(a[k]), top = BASE - h;
      const inRange = k >= s.lo && k <= s.hi;
      let bg = C.off, bd = C.offS, tx = C.offT;
      if (done && k === s.lo)      { bg = C.ok;  bd = C.okS;  tx = C.okT; }
      else if (k === s.m)          { bg = C.cur; bd = C.curS; tx = C.curT; }
      else if (k === s.hi && s.m >= 0) { bg = C.seg; bd = C.segS; tx = C.segT; }
      else if (inRange)            { bg = C.win; bd = C.winS; tx = C.winT; }
      rr(edge(k), top, bw, h, 4);
      ctx.fillStyle = bg; ctx.fill();
      ctx.lineWidth = (k === s.m || (done && k === s.lo)) ? 2.4 : 1.5; ctx.strokeStyle = bd; ctx.stroke();
      ctx.fillStyle = tx; ctx.font='700 14px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='alphabetic';
      ctx.fillText(String(a[k]), cx(k), top - 8);
      ctx.fillStyle = inRange ? C.text : C.offT;
      ctx.font='500 11px "JetBrains Mono", monospace';
      ctx.fillText(String(k), cx(k), IDX_Y);
    }
    ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x0 - 16, BASE + 0.5); ctx.lineTo(edge(n-1) + bw + 16, BASE + 0.5); ctx.stroke();

    // ── 指標列 ──
    const tag = (k, txt, col) => { if (k < 0 || k >= n) return;
      ctx.fillStyle = col; ctx.font='700 11px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='top'; ctx.fillText(txt, cx(k), PTR_Y); };
    if (done) { tag(s.lo, 'min', C.okT); }
    else { tag(s.lo, s.lo === s.m ? 'l,m' : 'l', s.lo === s.m ? C.curT : C.winT);
           if (s.hi !== s.m && s.hi !== s.lo) tag(s.hi, 'r', C.segT);
           if (s.m >= 0 && s.m !== s.lo) tag(s.m, 'm', C.curT); }

    // ── BAND 2 ──
    const B2 = 258;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 永遠拿 nums[m] 跟「右端 nums[r]」比', PAD, B2);
    rr(PAD, B2 + 10, w - 2*PAD, 42, 6);
    ctx.fillStyle = done ? C.ok : (s.act === 'intro' ? '#fafaf6' : C.cur); ctx.fill();
    ctx.lineWidth = 1.6; ctx.strokeStyle = done ? C.okS : (s.act === 'intro' ? C.grid : C.curS); ctx.stroke();
    ctx.fillStyle = done ? C.okT : (s.act === 'intro' ? C.text : C.curT);
    ctx.font='700 13px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(s.eq, w/2, B2 + 31);

    // ── BAND 3 ──
    const B3 = 330;
    ctx.fillStyle=C.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 比右端大 → l = m + 1;比右端小 → r = m(不減 1)', PAD, B3);
    rr(PAD, B3 + 10, w - 2*PAD, 40, 6);
    ctx.fillStyle = done ? C.ok : '#fafaf6'; ctx.fill();
    ctx.lineWidth = 1.6; ctx.strokeStyle = done ? C.okS : C.grid; ctx.stroke();
    ctx.fillStyle = done ? C.okT : C.text;
    ctx.font='600 12.5px "Noto Sans TC", sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(s.note, w/2, B3 + 30);
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
