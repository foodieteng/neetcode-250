/* ============================================================
   P98 · Validate Binary Search Tree — 遞迴帶區間 · viz
     bool isValidBST(root, long long mi = LLONG_MIN, long long mx = LLONG_MAX) {
       if (!root) return true;
       return (mi < root->val && root->val < mx)
           && isValidBST(root->left,  mi, root->val)     // 往左:上界收成自己
           && isValidBST(root->right, root->val, mx);    // 往右:下界收成自己
     }
   動畫要傳達的一件事:那個「窗」(mi, mx) 會一路往下收窄,
   把「遠房祖先」的約束帶到任意深的地方 —— 這正是「只比父節點」抓不到的東西。
   例 [5,4,6,null,null,3,7] → false
      節點 3 對它的父節點 6 完全合法(3 < 6),但它繼承的窗是 (5, 6),
      下界 5 是「兩層之上」的 root 傳下來的 —— 3 撞破了它。
     BAND 1  樹狀圖 + 每個節點標它繼承的窗
     BAND 2  這一步的判斷
     BAND 3  數線:窗的範圍與目前節點的位置
     BAND 4  為什麼
   所有狀態取自實測 trace,未手推。
   前綴 v98- 。
   ============================================================ */
(function () {
  const canvas = document.getElementById('v98-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('v98-step'), labelEl = document.getElementById('v98-label');
  const bPrev = document.getElementById('v98-prev'), bNext = document.getElementById('v98-next'),
        bPlay = document.getElementById('v98-play'), bReset = document.getElementById('v98-reset');

  const C = { paper:'#ffffff', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf',
    win:'#e3edf5', winS:'#4478c0', winT:'#2f5f9e',
    seg:'#f6ead8', segS:'#c8801e', segT:'#96601a',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424',
    ok:'#d9e8c7', okS:'#5fa866', okT:'#3f7a3a',
    off:'#f0f0ec', offS:'#cfcfcf', offT:'#a3a099', coral:'#cf3535' };

  /* [5,4,6,null,null,3,7] —— heap 索引 */
  const V   = { 1:5, 2:4, 3:6, 6:3, 7:7 };
  const POS = { 1:[3.5,0], 2:[1.5,1], 3:[5.5,1], 6:[4.5,2], 7:[6.5,2] };
  const IDS = [1,2,3,6,7];
  const NCOL = 8, NROW = 3;

  /* windows[i] = [lo, hi] 顯示字串用;lo/hi 用 null 表示無窮 */
  const S = (focus, passed, failed, windows, lo, hi, phase, eq, note, text) =>
    ({ focus, passed, failed, windows, lo, hi, phase, eq, note, text });

  const steps = [
    S(-1, [], [], {}, null, null, 'intro',
      'isValidBST(root, mi = -∞, mx = +∞)',
      '每個節點都繼承一個「窗」—— 往下走的時候窗會收窄',
      '<strong>INITIAL</strong> · BST <code>[5,4,6,null,null,3,7]</code>。<b>核心機制:每個節點都繼承一個合法區間「窗」<code>(mi, mx)</code></b>,<strong>它的值必須嚴格落在窗裡</strong>。<b>往下走時窗會收窄</b> —— 這就是把祖先的約束帶下去的方法。'),

    S(1, [], [], {1:'(-∞, +∞)'}, null, null, 'pass',
      '節點 5:  -∞ < 5 < +∞   ✓ 通過',
      '根節點的窗是無限大 —— 任何值都合法',
      '<strong>根節點 5</strong> · 窗是 <code>(-∞, +∞)</code>,<strong>任何值都通過</strong>。接下來:<b>往左走,把<em>上界</em>收成 5</b>;<b>往右走,把<em>下界</em>收成 5</b>。'),

    S(2, [1], [], {1:'(-∞, +∞)', 2:'(-∞, 5)'}, null, 5, 'pass',
      '節點 4:  窗 = (-∞, 5)     -∞ < 4 < 5   ✓ 通過',
      '往左走 ⇒ 上界收成父節點的值',
      '<strong>左子 4</strong> · 從 5 往左,<strong>上界收成 5</strong> ⇒ 窗 <code>(-∞, 5)</code>。<code>4 &lt; 5</code> ✓ 通過。<b>它的兩個小孩都是 <code>nullptr</code>,直接回 <code>true</code>。</b>'),

    S(3, [1,2], [], {1:'(-∞, +∞)', 2:'(-∞, 5)', 3:'(5, +∞)'}, 5, null, 'pass',
      '節點 6:  窗 = (5, +∞)     5 < 6 < +∞   ✓ 通過',
      '往右走 ⇒ 下界收成父節點的值,這個 5 會一路傳下去',
      '<strong>右子 6</strong> · 從 5 往右,<strong>下界收成 5</strong> ⇒ 窗 <code>(5, +∞)</code>。<code>6 &gt; 5</code> ✓ 通過。<b>⚠ 記住這個下界 5 —— 它會繼續往下傳。</b>'),

    S(6, [1,2,3], [], {1:'(-∞, +∞)', 2:'(-∞, 5)', 3:'(5, +∞)', 6:'(5, 6)'}, 5, 6, 'fail',
      '節點 3:  窗 = (5, 6)     5 < 3 ?  ✗ 失敗!',
      '⚡ 3 < 6 對父節點合法,但它撞破了「兩層之上」傳下來的下界 5',
      '<strong>節點 3 —— 失敗</strong> · 從 6 往左,上界收成 6,<strong>但下界還是那個從 root 傳下來的 5</strong> ⇒ 窗 <code>(5, 6)</code>。<b>⚡ <code>3 &lt; 6</code>,對它自己的父節點 <code>6</code> 來說完全合法</b> —— <strong>但 <code>3 &lt; 5</code>,它撞破了<em>兩層之上</em>的祖先傳下來的下界</strong>。<b>這就是「只比父節點」抓不到的情形。</b>'),

    S(-1, [1,2,3], [6], {1:'(-∞, +∞)', 2:'(-∞, 5)', 3:'(5, +∞)', 6:'(5, 6)'}, 5, 6, 'done',
      'return false     && 短路 —— 節點 7 從未被走訪',
      '實測:「只比父節點」在 5992 萬組窮舉中錯 28 萬組',
      '<strong>完成 · false</strong> · <code>&amp;&amp;</code> 一旦為 <code>false</code> 就短路,<strong>節點 <code>7</code> 從頭到尾沒被檢查</strong>。<b>實測</b>:「只比父節點」的寫法在<strong>窮舉 5992 萬組</strong>(全樹形 × 相異值全排列)中<strong>錯 28 萬組</strong>,最小反例只要 <strong>3 個節點</strong>:<code>[2,null,3,1]</code>。'),
  ];

  let step = 0, timer = null;

  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||420; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  const TREE_TOP = 26, ROW_H = 52, R = 18;

  function draw(){
    fit();
    const s = steps[step], w = canvas.clientWidth, PAD = 28;
    const done = s.phase === 'done';
    ctx.fillStyle = C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);

    const colW = (w - 2*PAD) / NCOL;
    const nx = i => PAD + (POS[i][0] + 0.5) * colW;
    const ny = i => TREE_TOP + 22 + POS[i][1] * ROW_H;
    const passed = new Set(s.passed), failed = new Set(s.failed);

    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 節點下方 = 它繼承的窗　綠 = 通過　紅 = 失敗', PAD, 16);

    ctx.lineWidth = 1.8;
    IDS.forEach(i => {
      [2*i, 2*i+1].forEach(c => {
        if (!POS[c]) return;
        ctx.strokeStyle = (passed.has(i) && (passed.has(c)||failed.has(c)||c===s.focus)) ? C.winS : C.grid;
        ctx.lineWidth = (passed.has(i) && (passed.has(c)||failed.has(c)||c===s.focus)) ? 2.4 : 1.6;
        ctx.beginPath(); ctx.moveTo(nx(i), ny(i) + R - 2); ctx.lineTo(nx(c), ny(c) - R + 2); ctx.stroke();
      });
    });

    IDS.forEach(i => {
      let bg = C.off, bd = C.offS, tx = C.offT;
      if (failed.has(i) || (i === s.focus && s.phase === 'fail')) { bg = C.cur; bd = C.curS; tx = C.curT; }
      else if (i === s.focus)  { bg = C.win; bd = C.winS; tx = C.winT; }
      else if (passed.has(i))  { bg = C.ok;  bd = C.okS;  tx = C.okT; }
      ctx.beginPath(); ctx.arc(nx(i), ny(i), R, 0, Math.PI*2);
      ctx.fillStyle = bg; ctx.fill();
      ctx.lineWidth = (i === s.focus || failed.has(i)) ? 2.6 : 1.5;
      ctx.strokeStyle = bd; ctx.stroke();
      ctx.fillStyle = tx; ctx.font='700 14px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(V[i]), nx(i), ny(i));

      if (s.windows[i]) {
        const isBad = failed.has(i) || (i === s.focus && s.phase === 'fail');
        ctx.fillStyle = isBad ? C.curT : (passed.has(i) ? C.okT : C.winT);
        ctx.font='700 10.5px "JetBrains Mono", monospace';
        ctx.textAlign='center'; ctx.textBaseline='top';
        ctx.fillText(s.windows[i], nx(i), ny(i) + R + 4);
      }
    });

    // BAND 2
    const B2 = TREE_TOP + 22 + NROW * ROW_H + 6;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 這一步的判斷', PAD, B2);
    rr(PAD, B2 + 10, w - 2*PAD, 38, 6);
    const bad = s.phase === 'fail' || done;
    ctx.fillStyle = bad ? C.cur : (s.phase === 'intro' ? '#fafaf6' : C.ok); ctx.fill();
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = bad ? C.curS : (s.phase === 'intro' ? C.grid : C.okS); ctx.stroke();
    ctx.fillStyle = bad ? C.curT : (s.phase === 'intro' ? C.text : C.okT);
    ctx.font='700 12.5px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(s.eq, w/2, B2 + 29);

    // BAND 3 · 數線
    const B3 = B2 + 62;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 這個窗在數線上的樣子', PAD, B3);
    const lineY = B3 + 34, x0 = PAD + 46, x1 = w - PAD - 46;
    ctx.strokeStyle = C.grid; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x0, lineY); ctx.lineTo(x1, lineY); ctx.stroke();
    const vx = v => x0 + ((v - 2) / 6) * (x1 - x0);   // 顯示 2..8
    // 窗
    if (s.phase !== 'intro') {
      const a = s.lo === null ? x0 : vx(s.lo);
      const b = s.hi === null ? x1 : vx(s.hi);
      const okWin = !(s.phase === 'fail' || done);
      ctx.fillStyle = okWin ? C.win : C.cur;
      ctx.fillRect(a, lineY - 9, b - a, 18);
      ctx.strokeStyle = okWin ? C.winS : C.curS; ctx.lineWidth = 1.6;
      ctx.strokeRect(a, lineY - 9, b - a, 18);
    }
    for (let v = 2; v <= 8; v++) {
      ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(vx(v), lineY - 4); ctx.lineTo(vx(v), lineY + 4); ctx.stroke();
      ctx.fillStyle = C.dim; ctx.font='600 10px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='top';
      ctx.fillText(String(v), vx(v), lineY + 8);
    }
    if (s.focus >= 0) {
      const cv = V[s.focus];
      const inWin = (s.lo === null || cv > s.lo) && (s.hi === null || cv < s.hi);
      ctx.fillStyle = inWin ? C.okS : C.curS;
      ctx.beginPath(); ctx.arc(vx(cv), lineY, 6, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = inWin ? C.okT : C.curT; ctx.font='700 11px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='bottom';
      ctx.fillText('節點 ' + cv + (inWin ? ' 在窗內 ✓' : ' 在窗外 ✗'), vx(cv), lineY - 14);
    }

    // BAND 4
    const B4 = B3 + 76;
    ctx.fillStyle=C.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 4 · 為什麼', PAD, B4);
    rr(PAD, B4 + 10, w - 2*PAD, 38, 6);
    ctx.fillStyle = bad ? C.cur : '#fafaf6'; ctx.fill();
    ctx.lineWidth = 1.6; ctx.strokeStyle = bad ? C.curS : C.grid; ctx.stroke();
    ctx.fillStyle = bad ? C.curT : C.text;
    ctx.font='600 12.5px "Noto Sans TC", sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(s.note, w/2, B4 + 29);
  }

  function update(){ if(stepEl) stepEl.textContent=String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0'); if(labelEl) labelEl.innerHTML=steps[step].text; draw(); }
  function next(){ if(step<steps.length-1){step++;update();}else stop(); }
  function prev(){ if(step>0){step--;update();} }
  function reset(){ stop(); step=0; update(); }
  function play(){ if(timer){stop();return;} bPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){stop();return;} next(); },2200); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} if(bPlay) bPlay.textContent='Play'; }
  bPrev&&bPrev.addEventListener('click',prev); bNext&&bNext.addEventListener('click',next); bPlay&&bPlay.addEventListener('click',play); bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();}); if(window.ResizeObserver){ new ResizeObserver(()=>{fit();draw();}).observe(canvas); }
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw); fit(); update();
})();
