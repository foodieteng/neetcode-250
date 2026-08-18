/* ============================================================
   P410 · Split Array Largest Sum — 答案二分 + 貪心 check · viz
   和 1011 是同一副骨架(左界 max、右界 sum、貪心分段),只是換了說法:
     「切成 k 段、最小化最大段和」 ⇄ 「載量 v 之下最少要切幾段」
   v 越大段數越少 ⇒ check 單調 ⇒ 候選帶是 F F F T T T,找第一個 T。
   例 nums=[7,2,5,10,8], k=2 → 答案 18,切成 [7,2,5] [10,8]。
     BAND 1  nums(原順序不可重排)+ 目前上限 v 下的貪心分段
     BAND 2  本輪 v 與貪心算出的段數
     BAND 3  這一步做了什麼決定
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
    ok:'#d9e8c7', okS:'#5fa866', okT:'#3f7a3a',
    no:'#f0d4d4', noS:'#b06a6a', noT:'#8a4444',
    off:'#f0f0ec', offS:'#cfcfcf', offT:'#a3a099', coral:'#cf3535' };

  const A = [7,2,5,10,8], K = 2;

  const S2 = [[0,2],[3,4]];      // v = 21 / 18 / 18 的分段(cnt = 2)
  const S3 = [[0,2],[3,3],[4,4]];// v = 15 / 17 的分段(cnt = 3)

  const steps = [
    { L:10, R:32, v:-1, segs:null, act:'intro',
      eq:'left = max(nums) = 10 · right = Σnums = 32',
      note:'左界是 max 不是 0 —— 元素不可切開,上限至少要容得下最大的那個',
      text:'<strong>INITIAL</strong> · 答案(最大段和)落在 <code>[10, 32]</code>:下界是<strong>最大元素 10</strong>(它自己單獨一段也要 10),上界是<strong>總和 32</strong>(全部塞成一段)。和 <a href="../p1011/index.html">1011</a> 完全同一組界。' },

    { L:10, R:32, v:21, segs:S2, act:'probe',
      eq:'v = 21 → 貪心分段需要 2 段 ≤ k = 2 ?  是',
      note:'段數夠少 → 上限還能再壓 → right = mid(保留)',
      text:'<strong>Round 1 · 試 v=21</strong> · 照原順序累加:<code>7+2+5 = 14</code>,再加 10 會變 24 &gt; 21 → 切一刀;<code>10+8 = 18</code>。共 <strong>2 段</strong>,沒超過 k → 上限給得太寬鬆,往左找。' },

    { L:10, R:21, v:21, segs:S2, act:'shrink-r',
      eq:'right = mid = 21 → 候選縮為 [10, 21]',
      note:'可行的 v 要保留,它可能就是最小的可行上限',
      text:'<strong>Round 1 · 收縮</strong> · <code>right = 21</code>,<strong>不減 1</strong> —— 21 本身還是候選答案。' },

    { L:10, R:21, v:15, segs:S3, act:'probe-bad',
      eq:'v = 15 → 需要 3 段 ≤ 2 ?  否',
      note:'段數太多 → 上限給太小 → left = mid + 1',
      text:'<strong>Round 2 · 試 v=15</strong> · <code>(7+2+5=14) (10) (8)</code> —— 10 和 8 加起來 18 &gt; 15,只能各自成段,共 <strong>3 段</strong>,超過 k=2。15 與所有更小的上限一起出局。' },

    { L:16, R:21, v:15, segs:S3, act:'shrink-l',
      eq:'left = mid + 1 = 16 → 候選縮為 [16, 21]',
      note:'mid 已被證明不可行,一定要 +1 跨過,否則死迴圈',
      text:'<strong>Round 2 · 收縮</strong> · <code>left = 16</code>。' },

    { L:16, R:21, v:18, segs:S2, act:'probe',
      eq:'v = 18 → 需要 2 段 ≤ 2 ?  是(剛好用滿)',
      note:'剛好等於 k 也算可行 → 判斷式用 ≤ 而非 <',
      text:'<strong>Round 3 · 試 v=18</strong> · <code>(7+2+5=14) (10+8=18)</code> —— 正好 <strong>2 段</strong>,而且第二段剛好頂到 18。剛好用滿也算可行。' },

    { L:16, R:18, v:18, segs:S2, act:'shrink-r',
      eq:'right = mid = 18 → 候選縮為 [16, 18]',
      note:'還沒確認 18 是不是最小,繼續往左壓',
      text:'<strong>Round 3 · 收縮</strong> · <code>right = 18</code>。' },

    { L:16, R:18, v:17, segs:S3, act:'probe-bad',
      eq:'v = 17 → 需要 3 段 ≤ 2 ?  否',
      note:'17 和 15 的分法完全相同 —— 這個函數是階梯狀的',
      text:'<strong>Round 4 · 試 v=17</strong> · 分法<strong>和 v=15 一模一樣</strong>,還是 3 段。上限多給了 2 卻擠不進任何一個元素 —— 這就是「單調但不嚴格」的階梯,也是為什麼要二分而不是逐格試。' },

    { L:18, R:18, v:-1, segs:null, act:'converge',
      eq:'left = mid + 1 = 18 → left == right == 18,收斂',
      note:'left < right 不成立 → 跳出迴圈',
      text:'<strong>Round 4 · 收縮</strong> · <code>left = 18</code>,區間收成單點,迴圈結束。全程只用了 <strong>4 輪</strong>。' },

    { L:18, R:18, v:18, segs:S2, act:'done',
      eq:'return left = 18     // 第一個可行上限,免驗證',
      note:'答案保證存在(v = Σnums 一定可行)→ 直接回傳',
      text:'<strong>完成</strong> · 最小的「最大段和」是 <strong>18</strong>,切法為 <code>[7,2,5] | [10,8]</code>,兩段和分別是 14 與 18。因為 <code>v = Σnums</code> 必定可行,答案保證存在,不需額外檢查。' },
  ];

  let step = 0, timer = null;

  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function draw(){
    fit();
    const s = steps[step], w = canvas.clientWidth, PAD = 34, n = A.length;
    const done = s.act === 'done';
    const bad  = s.act === 'probe-bad';
    ctx.fillStyle = C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);

    const cw = Math.min(64, (w - 2*PAD) / n - 14);
    const gap = Math.min(26, (w - 2*PAD - n*cw) / (n - 1));
    const x0 = (w - (n*cw + (n-1)*gap)) / 2;
    const edge = j => x0 + j * (cw + gap);
    const cx = j => edge(j) + cw/2;

    const BOX_TOP = 76, BOX_H = 46;
    const BOX_BOT = BOX_TOP + BOX_H;   // 122
    const SEG_Y = BOX_BOT + 24;        // 分段括號,與方塊隔 24px
    const SUM_Y = SEG_Y + 20;          // 各段總和

    // ── BAND 1 ──
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · nums(原順序不可重排)+ 目前上限下的貪心分段', PAD, 16);
    ctx.textAlign='right'; ctx.font='700 12.5px "JetBrains Mono", monospace'; ctx.fillStyle = done ? C.okT : C.text;
    ctx.fillText('k = ' + K, w - PAD, 16);

    // 候選區間條
    ctx.textAlign='center'; ctx.textBaseline='alphabetic';
    ctx.font='700 12.5px "JetBrains Mono", monospace';
    ctx.fillStyle = done ? C.okT : C.winT;
    ctx.fillText(s.L === s.R && done ? ('收斂 · 最小的最大段和 = ' + s.L)
                 : (s.L === s.R ? ('收斂 · left == right == ' + s.L)
                 : ('候選答案 [ ' + s.L + ' , ' + s.R + ' ]   目前試 v = ' + (s.v > 0 ? s.v : '—'))),
                 w/2, 46);

    // 元素方塊(依所屬段上色:偶數段淺橘、奇數段淺藍)
    for (let j = 0; j < n; j++) {
      let bg = C.off, bd = C.offS, tx = C.offT;
      if (s.segs) {
        let di = -1;
        for (let d = 0; d < s.segs.length; d++) if (j >= s.segs[d][0] && j <= s.segs[d][1]) di = d;
        if (di >= 0) { const even = di % 2 === 0;
          bg = even ? C.seg : C.win; bd = even ? C.segS : C.winS; tx = even ? C.segT : C.winT; }
      } else { bg = C.win; bd = C.winS; tx = C.winT; }
      rr(edge(j), BOX_TOP, cw, BOX_H, 5);
      ctx.fillStyle = bg; ctx.fill();
      ctx.lineWidth = 1.6; ctx.strokeStyle = bd; ctx.stroke();
      ctx.fillStyle = tx; ctx.font='700 16px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(A[j]), cx(j), BOX_TOP + BOX_H/2);
      // 索引列,壓在方塊上方 ≥12px
      ctx.fillStyle = C.dim; ctx.font='500 10.5px "JetBrains Mono", monospace';
      ctx.textBaseline='alphabetic';
      ctx.fillText(String(j), cx(j), BOX_TOP - 12);
    }

    // 每段一條底括號 + 該段總和
    if (s.segs) {
      let maxSum = 0;
      for (const [a,b] of s.segs) { let t=0; for(let j=a;j<=b;j++) t+=A[j]; if(t>maxSum) maxSum=t; }
      for (let d = 0; d < s.segs.length; d++) {
        const [a, b] = s.segs[d];
        const x1 = edge(a), x2 = edge(b) + cw;
        const even = d % 2 === 0;
        const col = even ? C.segS : C.winS, colT = even ? C.segT : C.winT;
        ctx.strokeStyle = col; ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x1, SEG_Y - 6); ctx.lineTo(x1, SEG_Y); ctx.lineTo(x2, SEG_Y); ctx.lineTo(x2, SEG_Y - 6);
        ctx.stroke();
        let sum = 0; for (let j = a; j <= b; j++) sum += A[j];
        ctx.fillStyle = sum === maxSum ? C.curT : colT;   // 最大段和用紅字標出 —— 那正是要最小化的量
        ctx.font='700 11.5px "JetBrains Mono", monospace';
        ctx.textAlign='center'; ctx.textBaseline='top';
        ctx.fillText((x2 - x1 >= 96 ? ('段' + (d+1) + ' 和=') : '') + sum, (x1+x2)/2, SUM_Y - 8);
      }
      ctx.textAlign='center'; ctx.textBaseline='top';
      ctx.font='700 12.5px "JetBrains Mono", monospace';
      ctx.fillStyle = bad ? C.noT : C.okT;
      ctx.fillText('→ 共 ' + s.segs.length + ' 段' + (s.segs.length <= K ? '(≤ k=2,可行)' : '(> k=2,不可行)')
                   + '　最大段和 = ' + maxSum, w/2, SUM_Y + 16);
    }

    // ── BAND 2 ──
    const B2 = 236;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · check(v) = 上限 v 之下最少要切幾段 ≤ k ?', PAD, B2);
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
    const B3 = 308;
    ctx.fillStyle=C.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 段數夠少 → right = mid(保留);段數太多 → left = mid + 1(跨過)', PAD, B3);
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
