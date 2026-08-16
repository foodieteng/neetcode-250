/* ============================================================
   P1011 · Capacity To Ship Packages Within D Days — 答案二分 + 貪心 check · viz
   和 875 同一副骨架,差別在兩處:
     ① 左界是 max(weights) 而非 1 —— 包裹「不可分割」,載量小於最重那件就永遠裝不下
     ② check(cap) 是一次「貪心裝箱」:照原順序累加,超過 cap 就換一天
   cap 越大天數越少 ⇒ check 單調 ⇒ 候選帶仍是 F F F T T T,找第一個 T。
   例 weights=[1..10], days=5 → 答案 15,分成 [1,2,3,4,5] [6,7] [8] [9] [10]。
     BAND 1  包裹(依原順序)+ 目前 cap 下的貪心分段(每天一種深淺)
     BAND 2  本輪 cap 與需要的天數
     BAND 3  這一步做了什麼決定
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
    no:'#f0d4d4', noS:'#b06a6a', noT:'#8a4444',
    off:'#f0f0ec', offS:'#cfcfcf', offT:'#a3a099', coral:'#cf3535' };

  const W = [1,2,3,4,5,6,7,8,9,10], DAYS = 5;

  // segs = 各天裝了哪幾件(以 W 的索引區間 [from, to] 表示)
  const S32 = [[0,6],[7,9]];
  const S21 = [[0,5],[6,7],[8,9]];
  const S15 = [[0,4],[5,6],[7,7],[8,8],[9,9]];
  const S12 = [[0,3],[4,5],[6,6],[7,7],[8,8],[9,9]];

  const steps = [
    { L:10, R:55, cap:-1, segs:null, ans:-1, act:'intro',
      eq:'left = max(weights) = 10 · right = Σweights = 55',
      note:'左界是 max 不是 1 —— 包裹不可分割,載量至少要裝得下最重的那件',
      text:'<strong>INITIAL</strong> · 候選載量落在 <code>[10, 55]</code>:下界是<strong>最重的那件</strong>(否則它永遠上不了船),上界是<strong>總重</strong>(一天全部載走)。和 <a href="../p875/index.html">875</a> 唯一的結構差異就在這個左界。' },

    { L:10, R:55, cap:32, segs:S32, ans:-1, act:'probe',
      eq:'cap = 32 → 貪心裝箱需要 2 天 ≤ 5 ?  是(還有餘裕)',
      note:'天數夠 → 載量還能再小 → right = mid(保留)',
      text:'<strong>Round 1 · 試 cap=32</strong> · 照原順序裝:<code>1+…+7 = 28</code> 裝不下第 8 件 → 換一天;<code>8+9+10 = 27</code>。只用 <strong>2 天</strong>,遠少於 5 → 載量太寬鬆,往左找。' },

    { L:10, R:32, cap:32, segs:S32, ans:-1, act:'shrink-r',
      eq:'right = mid = 32 → 候選縮為 [10, 32]',
      note:'可行的 cap 要保留,它可能就是最小可行載量',
      text:'<strong>Round 1 · 收縮</strong> · <code>right = 32</code>,不減 1。' },

    { L:10, R:32, cap:21, segs:S21, ans:-1, act:'probe',
      eq:'cap = 21 → 需要 3 天 ≤ 5 ?  是',
      note:'注意分段會隨 cap 改變 —— 每次 check 都要重新貪心一遍',
      text:'<strong>Round 2 · 試 cap=21</strong> · 分法變成 <code>(1+…+6=21) (7+8=15) (9+10=19)</code>,<strong>3 天</strong>,仍然夠用。' },

    { L:10, R:21, cap:21, segs:S21, ans:-1, act:'shrink-r',
      eq:'right = mid = 21 → 候選縮為 [10, 21]',
      note:'繼續壓低載量',
      text:'<strong>Round 2 · 收縮</strong> · <code>right = 21</code>。' },

    { L:10, R:21, cap:15, segs:S15, ans:-1, act:'probe',
      eq:'cap = 15 → 需要 5 天 ≤ 5 ?  是(剛好用滿)',
      note:'剛好等於 days 也算可行 → 判斷式用 ≤ 而非 <',
      text:'<strong>Round 3 · 試 cap=15</strong> · 分成 <code>(1+2+3+4+5=15) (6+7=13) (8) (9) (10)</code> —— <strong>正好 5 天</strong>。剛好用滿也算來得及。' },

    { L:10, R:15, cap:15, segs:S15, ans:-1, act:'shrink-r',
      eq:'right = mid = 15 → 候選縮為 [10, 15]',
      note:'還沒確認 15 是不是最小,繼續往左',
      text:'<strong>Round 3 · 收縮</strong> · <code>right = 15</code>。' },

    { L:10, R:15, cap:12, segs:S12, ans:-1, act:'probe-bad',
      eq:'cap = 12 → 需要 6 天 ≤ 5 ?  否(超過一天)',
      note:'天數不夠 → 載量太小 → left = mid + 1',
      text:'<strong>Round 4 · 試 cap=12</strong> · 分法碎成 <code>(1+2+3+4=10) (5+6=11) (7) (8) (9) (10)</code> —— <strong>6 天</strong>,超過了。12 與更小的載量全部出局。' },

    { L:13, R:15, cap:12, segs:S12, ans:-1, act:'shrink-l',
      eq:'left = mid + 1 = 13 → 候選縮為 [13, 15]',
      note:'不可行的 mid 已被證明不行,一定要 +1 跨過',
      text:'<strong>Round 4 · 收縮</strong> · <code>left = 13</code>。' },

    { L:13, R:15, cap:14, segs:S12, ans:-1, act:'probe-bad',
      eq:'cap = 14 → 需要 6 天 ≤ 5 ?  否',
      note:'14 和 12 的分法完全相同 —— 函數是階梯狀的',
      text:'<strong>Round 5 · 試 cap=14</strong> · 分法<strong>和 cap=12 一模一樣</strong>,還是 6 天。載量多了 2 卻擠不進任何一件 —— 這就是「單調但不嚴格」的階梯。' },

    { L:15, R:15, cap:-1, segs:null, ans:-1, act:'converge',
      eq:'left = mid + 1 = 15 → left == right == 15,收斂',
      note:'left < right 不成立 → 跳出迴圈',
      text:'<strong>Round 5 · 收縮</strong> · <code>left = 15</code>,區間收成單點,迴圈結束。' },

    { L:15, R:15, cap:15, segs:S15, ans:15, act:'done',
      eq:'return left = 15     // 第一個可行載量,免驗證',
      note:'答案保證存在(cap = 總重 一定可行)→ 直接回傳',
      text:'<strong>完成</strong> · 最小載量 <strong>15</strong>,分法為 <code>[1,2,3,4,5] [6,7] [8] [9] [10]</code> 正好 5 天。因為 <code>cap = 總重</code> 必定可行,答案保證存在,不需額外檢查。' },
  ];

  let step = 0, timer = null;

  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function draw(){
    fit();
    const s = steps[step], w = canvas.clientWidth, PAD = 34, n = W.length;
    const done = s.act === 'done';
    const bad = s.act === 'probe-bad';
    ctx.fillStyle = C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);

    const cw = Math.min(60, (w - 2*PAD) / n - 10);
    const gap = Math.min(20, (w - 2*PAD - n*cw) / (n - 1));
    const x0 = (w - (n*cw + (n-1)*gap)) / 2;
    const edge = j => x0 + j * (cw + gap);
    const cx = j => edge(j) + cw/2;

    const BOX_TOP = 74, BOX_H = 44;
    const BOX_BOT = BOX_TOP + BOX_H;            // 118
    const SEG_Y = BOX_BOT + 22;                 // 分段括號那一列,與箱子隔 22px
    const SUM_Y = SEG_Y + 20;                   // 各天總重

    // ── BAND 1 ──
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 包裹(原順序不可重排)+ 目前載量下的貪心分段', PAD, 16);
    ctx.textAlign='right'; ctx.font='700 12.5px "JetBrains Mono", monospace'; ctx.fillStyle= done ? C.okT : C.text;
    ctx.fillText('days = ' + DAYS, w - PAD, 16);

    // 候選區間條
    ctx.textAlign='center'; ctx.textBaseline='alphabetic';
    ctx.font='700 12px "JetBrains Mono", monospace';
    ctx.fillStyle = done ? C.okT : C.winT;
    ctx.fillText(s.L === s.R ? ('收斂 · 最小載量 = ' + s.L)
                             : ('候選載量 [ ' + s.L + ' , ' + s.R + ' ]   目前試 cap = ' + (s.cap > 0 ? s.cap : '—')),
                 w/2, 44);

    // 包裹方塊(依所屬天數上色:奇數天淺橘、偶數天淺藍,讓分段一眼可辨)
    for (let j = 0; j < n; j++) {
      let bg = C.off, bd = C.offS, tx = C.offT;
      if (s.segs) {
        let di = -1;
        for (let d = 0; d < s.segs.length; d++) if (j >= s.segs[d][0] && j <= s.segs[d][1]) di = d;
        if (di >= 0) {
          const even = di % 2 === 0;
          bg = even ? C.seg : C.win; bd = even ? C.segS : C.winS; tx = even ? C.segT : C.winT;
        }
      } else { bg = C.win; bd = C.winS; tx = C.winT; }
      rr(edge(j), BOX_TOP, cw, BOX_H, 5);
      ctx.fillStyle = bg; ctx.fill();
      ctx.lineWidth = 1.6; ctx.strokeStyle = bd; ctx.stroke();
      ctx.fillStyle = tx; ctx.font='700 15px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(W[j]), cx(j), BOX_TOP + BOX_H/2);
    }

    // 每天一條底線 + 該天總重
    if (s.segs) {
      for (let d = 0; d < s.segs.length; d++) {
        const [a, b] = s.segs[d];
        const x1 = edge(a), x2 = edge(b) + cw;
        const even = d % 2 === 0;
        const col = even ? C.segS : C.winS, colT = even ? C.segT : C.winT;
        ctx.strokeStyle = col; ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x1, SEG_Y - 6); ctx.lineTo(x1, SEG_Y); ctx.lineTo(x2, SEG_Y); ctx.lineTo(x2, SEG_Y - 6);
        ctx.stroke();
        let sum = 0; for (let j = a; j <= b; j++) sum += W[j];
        ctx.fillStyle = colT; ctx.font='700 11px "JetBrains Mono", monospace';
        ctx.textAlign='center'; ctx.textBaseline='top';
        // 窄的分段(只裝一件)只寫重量,免得相鄰標籤擠在一起
        ctx.fillText((x2 - x1 >= 72 ? ('第' + (d+1) + '天 ') : '') + sum, (x1+x2)/2, SUM_Y - 8);
      }
      // 總天數自成一列,不與分段標籤搶位置
      ctx.textAlign='center'; ctx.textBaseline='top';
      ctx.font='700 12.5px "JetBrains Mono", monospace';
      ctx.fillStyle = done ? C.okT : (bad ? C.noT : C.okT);
      ctx.fillText('→ 共 ' + s.segs.length + ' 天' + (s.segs.length <= DAYS ? '(≤ 5,可行)' : '(> 5,不可行)'),
                   w/2, SUM_Y + 14);
    }

    // ── BAND 2 ──
    const B2 = 226;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · check(cap) = 貪心裝箱天數 ≤ days ?', PAD, B2);
    rr(PAD, B2 + 10, w - 2*PAD, 42, 6);
    ctx.fillStyle = done ? C.ok : (bad ? C.no : (s.act === 'probe' ? C.ok : (s.act === 'intro' ? '#fafaf6' : C.win)));
    ctx.fill();
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = done ? C.okS : (bad ? C.noS : (s.act === 'probe' ? C.okS : (s.act === 'intro' ? C.grid : C.winS)));
    ctx.stroke();
    ctx.fillStyle = done ? C.okT : (bad ? C.noT : (s.act === 'probe' ? C.okT : C.winT));
    ctx.font='700 13px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(s.eq, w/2, B2 + 31);

    // ── BAND 3 ──
    const B3 = 298;
    ctx.fillStyle=C.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 天數夠 → right = mid(保留);天數不夠 → left = mid + 1(跨過)', PAD, B3);
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
  function play(){ if(timer){stop();return;} bPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){stop();return;} next(); },1900); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} if(bPlay) bPlay.textContent='Play'; }
  bPrev&&bPrev.addEventListener('click',prev); bNext&&bNext.addEventListener('click',next); bPlay&&bPlay.addEventListener('click',play); bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();}); if(window.ResizeObserver){ new ResizeObserver(()=>{fit();draw();}).observe(canvas); }
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw); fit(); update();
})();
