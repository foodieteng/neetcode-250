/* ============================================================
   P69 · Sqrt(x) — 二分述詞 P(m) = (m*m > x) · viz
   這是標準的 lower_bound 骨架:P(m) 沿 m 遞增是 F F F T T T,
   二分找「第一個 T」,再退一格就是最後一個 F —— 也就是 floor(sqrt(x))。
     P 為真 → 答案在 m 或更左 → r = m(保留)
     P 為假 → m 出局          → l = m + 1
   例 x = 8:候選 [0, 9),真值表 F F F T T T T T T T,第一個 T 在 3,答案 2。
     BAND 1  候選格 + 每格的 P 真值 + m² + l / m / r 標記
     BAND 2  這一輪算的 m²
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

  const X = 8, N = 10;                       // 候選 m = 0..9(r 初值 = x + 1 = 9)
  const P = m => m * m > X;                  // 述詞

  const steps = [
    { lo:0, hi:9, m:-1, act:'intro', ans:false,
      eq:'P(m) = (m*m > x) · x = 8 · 候選 m ∈ [0, 9)',
      note:'m 越大 m² 越大 ⇒ P 一旦為真就永遠為真 ⇒ F F F T T T,可以二分',
      text:'<strong>INITIAL</strong> · 不直接算根號,而是二分一個<strong>述詞</strong>:<code>P(m) = (m·m &gt; x)</code>。因為 <code>m</code> 越大 <code>m²</code> 越大,<strong>P 一旦為真就永遠為真</strong> —— 真值表必定長成 <code>F F F T T T</code>。要找的是<strong>第一個 T</strong>,而答案 <code>floor(√x)</code> 就是<strong>它的前一格</strong>(最後一個 F)。右界取 <code>x + 1</code> 是為了保證表裡<strong>至少有一個 T</strong>。' },

    { lo:0, hi:9, m:4, act:'true', ans:false,
      eq:'m = 4 → m·m = 16 > 8 → P 為真',
      note:'P 為真 ⇒ 第一個 T 在 m 或更左 ⇒ r = m(保留 m,它可能就是第一個 T)',
      text:'<strong>R1 · m = 4</strong> · <code>4·4 = 16 &gt; 8</code>,<strong>P 為真</strong>。既然 4 已經是 T,第一個 T 不可能在它右邊 → <code>r = 4</code>。<strong>不能寫 <code>m − 1</code></strong> —— 4 自己還可能就是第一個 T。' },

    { lo:0, hi:4, m:2, act:'false', ans:false,
      eq:'m = 2 → m·m = 4 ≤ 8 → P 為假',
      note:'P 為假 ⇒ m 不是 T,可以整個跨過 ⇒ l = m + 1',
      text:'<strong>R2 · m = 2</strong> · <code>2·2 = 4 ≤ 8</code>,<strong>P 為假</strong>。2 是 F,<strong>它不可能是第一個 T</strong>,連同左邊全部出局 → <code>l = 3</code>。' },

    { lo:3, hi:4, m:3, act:'true', ans:false,
      eq:'m = 3 → m·m = 9 > 8 → P 為真',
      note:'r = m = 3,此時 l == r,區間收成單點',
      text:'<strong>R3 · m = 3</strong> · <code>3·3 = 9 &gt; 8</code>,P 為真 → <code>r = 3</code>。區間 <code>[3, 3)</code> 空了,<code>l &lt; r</code> 不再成立,跳出。' },

    { lo:3, hi:3, m:-1, act:'converge', ans:false,
      eq:'l == r == 3 ← 這就是第一個 T',
      note:'收斂點永遠落在 F 與 T 的交界上',
      text:'<strong>收斂</strong> · <code>l = 3</code>,正好是真值表裡<strong>第一個 T</strong> 的位置。注意整趟過程中,<code>l</code> 的左邊永遠是已確認的 F、<code>r</code> 永遠指向已確認的 T —— 兩邊往中間夾,最後停在交界。' },

    { lo:3, hi:3, m:-1, act:'done', ans:true,
      eq:'return l − 1 = 2     // 最後一個 F,就是 floor(√8)',
      note:'x = 8:2² = 4 ≤ 8 < 9 = 3² ⇒ 向下取整的答案是 2',
      text:'<strong>完成</strong> · <code>return l − 1 = <strong>2</strong></code>。第一個 T 的前一格就是<strong>最後一個 F</strong>,也就是最大的滿足 <code>m² ≤ x</code> 的 <code>m</code> —— 正是題目要的<strong>向下取整平方根</strong>。共 3 輪;<code>x = 2³¹−1</code> 時實測 <strong>31</strong> 輪。' },
  ];

  let step = 0, timer = null;

  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  const HDR_Y = 74, CELL_TOP = 86, CH = 46;
  const SQ_Y = CELL_TOP + CH + 20;        // m² 那一列,離格子底 20px
  const PTR_Y = SQ_Y + 14;                // 指標列再往下

  function draw(){
    fit();
    const s = steps[step], w = canvas.clientWidth, PAD = 34;
    const done = s.act === 'done';
    ctx.fillStyle = C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);

    const cw = Math.min(52, (w - 2*PAD) / N - 12);
    const gap = Math.min(20, (w - 2*PAD - N*cw) / (N - 1));
    const x0 = (w - (N*cw + (N-1)*gap)) / 2;
    const edge = k => x0 + k * (cw + gap);
    const cx = k => edge(k) + cw/2;

    // ── BAND 1 標題 ──
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 上排數字 = 候選 m,格內 = P(m) 真值,下排小字 = m²', PAD, 16);
    ctx.textAlign='right'; ctx.font='700 12.5px "JetBrains Mono", monospace';
    ctx.fillStyle = done ? C.okT : C.text;
    ctx.fillText('x = ' + X, w - PAD, 16);

    // 狀態列
    ctx.textAlign='center'; ctx.font='700 12.5px "JetBrains Mono", monospace';
    ctx.fillStyle = done ? C.okT : C.winT;
    ctx.fillText(done ? ('答案 = 第一個 T(m=' + s.lo + ')的前一格 = ' + (s.lo - 1))
                 : (s.lo === s.hi ? ('收斂 · l == r == ' + s.lo + ' ← 第一個 T')
                 : ('候選 [ ' + s.lo + ' , ' + s.hi + ' )' + (s.m >= 0 ? '　m = ' + s.m : ''))),
                 w/2, 44);

    for (let k = 0; k < N; k++) {
      const isT = P(k);
      const inRange = k >= s.lo && k < Math.max(s.hi, s.lo + 1);
      let bg, bd, tx;
      if (done && k === s.lo - 1)      { bg = C.ok;  bd = C.okS;  tx = C.okT; }   // 答案
      else if (k === s.m)              { bg = C.cur; bd = C.curS; tx = C.curT; }  // 這輪探的
      else if (!inRange)               { bg = C.off; bd = C.offS; tx = C.offT; }
      else if (isT)                    { bg = C.seg; bd = C.segS; tx = C.segT; }
      else                             { bg = C.win; bd = C.winS; tx = C.winT; }
      rr(edge(k), CELL_TOP, cw, CH, 5);
      ctx.fillStyle = bg; ctx.fill();
      ctx.lineWidth = (k === s.m || (done && k === s.lo - 1)) ? 2.4 : 1.5;
      ctx.strokeStyle = bd; ctx.stroke();
      ctx.fillStyle = tx; ctx.font='700 16px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(isT ? 'T' : 'F', cx(k), CELL_TOP + CH/2);
      // 候選值 m,壓在格子上方 12px
      ctx.fillStyle = (!inRange && k !== s.m) ? C.offT : C.text;
      ctx.font='600 11.5px "JetBrains Mono", monospace'; ctx.textBaseline='alphabetic';
      ctx.fillText(String(k), cx(k), HDR_Y);
      // m² 那一列
      ctx.fillStyle = (k === s.m) ? C.curT : ((!inRange && k !== s.m) ? C.offT : C.dim);
      ctx.font = ((k === s.m) ? '700 ' : '500 ') + '10.5px "JetBrains Mono", monospace';
      ctx.textBaseline='alphabetic';
      ctx.fillText(String(k*k), cx(k), SQ_Y);
    }

    // 指標列
    const tag = (k, txt, col) => { if (k < 0 || k >= N) return;
      ctx.fillStyle = col; ctx.font='700 11px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='top'; ctx.fillText(txt, cx(k), PTR_Y); };
    if (done) { tag(s.lo - 1, '答案', C.okT); tag(s.lo, '第一個 T', C.segT); }
    else if (s.m >= 0) { tag(s.lo, s.lo === s.m ? 'l,m' : 'l', s.lo === s.m ? C.curT : C.winT);
                         if (s.m !== s.lo) tag(s.m, 'm', C.curT);
                         if (s.hi !== s.m && s.hi < N) tag(s.hi, 'r', C.segT); }
    else { tag(s.lo, 'l = r', C.winT); }

    // ── BAND 2 ──
    const B2 = 224;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 這一輪算了什麼', PAD, B2);
    rr(PAD, B2 + 10, w - 2*PAD, 42, 6);
    ctx.fillStyle = done ? C.ok : (s.act === 'intro' ? '#fafaf6' : (s.act === 'true' ? C.seg : (s.act === 'false' ? C.win : C.cur)));
    ctx.fill();
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = done ? C.okS : (s.act === 'intro' ? C.grid : (s.act === 'true' ? C.segS : (s.act === 'false' ? C.winS : C.curS)));
    ctx.stroke();
    ctx.fillStyle = done ? C.okT : (s.act === 'intro' ? C.text : (s.act === 'true' ? C.segT : (s.act === 'false' ? C.winT : C.curT)));
    ctx.font='700 13px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(s.eq, w/2, B2 + 31);

    // ── BAND 3 ──
    const B3 = 296;
    ctx.fillStyle=C.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · P 為真 → r = m(保留);P 為假 → l = m + 1(跨過)', PAD, B3);
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
