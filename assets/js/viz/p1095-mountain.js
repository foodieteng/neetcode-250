/* ============================================================
   P1095 · Find in Mountain Array — 三段二分 · viz
   互動題:只能透過 get(i) 讀值,而且總共不得超過 100 次。
   拆成三次二分,每次都是 O(log n):
     PHASE 1  找峰 —— 比較 get(m) 與 get(m+1),上坡往右、下坡往左(每輪 2 次 get)
     PHASE 2  左半升序二分 [0, peak]      —— 先搜這半,因為要「最小索引」
     PHASE 3  右半降序二分 [peak+1, n-1]  —— 左半沒有才進來
   例 arr=[1,3,5,7,6,4,2], target=4 → 答案 5,總共只用 9 次 get。
     BAND 1  山形長條圖 + 目前搜尋區間 + mid 標記 + get 計數
     BAND 2  本步做的比較
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
    no:'#f0d4d4', noS:'#b06a6a', noT:'#8a4444',
    off:'#f0f0ec', offS:'#cfcfcf', offT:'#a3a099', coral:'#cf3535' };

  const A = [1,3,5,7,6,4,2], TARGET = 4;

  // phase: 'peak' | 'asc' | 'desc' | 'idle'
  // lo/hi = 目前區間;mid = 這步探的位置;peek = 找峰時額外讀的 mid+1;hit = 命中索引
  const steps = [
    { phase:'idle', lo:0, hi:6, mid:-1, peek:-1, peak:-1, hit:-1, calls:0,
      eq:'n = 7 · target = 4 · get 上限 100 次',
      note:'不能直接讀陣列,每個值都要花一次 get —— 所以連「掃一遍」都不行',
      text:'<strong>INITIAL</strong> · 這是互動題:陣列看不到,只能用 <code>get(i)</code> 一格一格問,而且<strong>總共不能問超過 100 次</strong>。<code>n</code> 最大 10⁴,線性掃描直接出局。山形是「先嚴格遞增、再嚴格遞減」,兩邊各自有序 —— 只要知道峰在哪,就能各二分一次。' },

    { phase:'peak', lo:0, hi:6, mid:3, peek:4, peak:-1, hit:-1, calls:2,
      eq:'get(3) = 7 · get(4) = 6 → 7 > 6,已經在下坡',
      note:'下坡 → 峰在 m 或 m 的左邊 → r = m(保留 m,它可能就是峰)',
      text:'<strong>PHASE 1 · 找峰 R1</strong> · <code>m=3</code>。比較<strong>相鄰兩格</strong> <code>get(3)=7</code> 與 <code>get(4)=6</code>:遞減,代表 <code>m</code> 已經在<strong>下坡段(或正好是峰)</strong>,峰不可能在 <code>m</code> 右邊 → <code>r = m = 3</code>。注意這一輪花了 <strong>2 次</strong> get。' },

    { phase:'peak', lo:0, hi:3, mid:1, peek:2, peak:-1, hit:-1, calls:4,
      eq:'get(1) = 3 · get(2) = 5 → 3 < 5,還在上坡',
      note:'上坡 → 峰一定在 m 右邊 → l = m + 1(m 已被證明不是峰)',
      text:'<strong>PHASE 1 · 找峰 R2</strong> · <code>m=1</code>,<code>3 &lt; 5</code> 還在爬 —— 上坡段的每一格都比右邊小,<strong>它自己絕不可能是峰</strong>,所以可以放心 <code>l = m + 1 = 2</code>。' },

    { phase:'peak', lo:2, hi:3, mid:2, peek:3, peak:-1, hit:-1, calls:6,
      eq:'get(2) = 5 · get(3) = 7 → 5 < 7,還在上坡',
      note:'l = m + 1 = 3,此時 l == r,區間收成單點',
      text:'<strong>PHASE 1 · 找峰 R3</strong> · <code>m=2</code>,仍在上坡 → <code>l = 3</code>。區間 <code>[3,3]</code> 收斂。' },

    { phase:'idle', lo:3, hi:3, mid:-1, peek:-1, peak:3, hit:-1, calls:6,
      eq:'peak = 3 (值 7) · 目前已用 6 次 get',
      note:'找峰 3 輪 × 2 次 = 6 次;n=10⁴ 時是 14 輪 × 2 = 28 次',
      text:'<strong>峰找到了</strong> · <code>peak = 3</code>。現在陣列被切成兩段<strong>各自有序</strong>的區間:<code>[0,3]</code> 遞增、<code>[4,6]</code> 遞減。接下來各二分一次。' },

    { phase:'asc', lo:0, hi:3, mid:1, peek:-1, peak:3, hit:-1, calls:7,
      eq:'升序半 · get(1) = 3 → 3 < 4,往右',
      note:'先搜升序半,因為題目要「最小索引」—— 左半的索引一定比右半小',
      text:'<strong>PHASE 2 · 左半升序二分</strong> · 範圍 <code>[0, 3]</code>(<strong>含 peak</strong>)。<code>mid=1</code>,<code>v=3 &lt; 4</code>,升序時比目標小就往右 → <code>lo = 2</code>。<strong>為什麼先搜這半:</strong>同一個值最多在兩邊各出現一次,先搜左邊拿到的才是最小索引。' },

    { phase:'asc', lo:2, hi:3, mid:2, peek:-1, peak:3, hit:-1, calls:8,
      eq:'升序半 · get(2) = 5 → 5 > 4,往左',
      note:'hi = mid - 1 = 1,此時 lo(2) > hi(1) → 左半宣告失敗',
      text:'<strong>PHASE 2 · R2</strong> · <code>mid=2</code>,<code>v=5 &gt; 4</code> → <code>hi = 1</code>。<code>lo &gt; hi</code>,左半<strong>沒有 4</strong>,回傳 −1。已用 8 次 get。' },

    { phase:'desc', lo:4, hi:6, mid:5, peek:-1, peak:3, hit:5, calls:9,
      eq:'降序半 · get(5) = 4 → 命中!',
      note:'降序半的比較方向要反過來 —— 這就是 (v < target) == asc 在做的事',
      text:'<strong>PHASE 3 · 右半降序二分</strong> · 範圍 <code>[4, 6]</code>。<code>mid=5</code>,<code>v=4</code> <strong>正好等於 target</strong> → 回傳 <strong>5</strong>。' },

    { phase:'done', lo:4, hi:6, mid:5, peek:-1, peak:3, hit:5, calls:9,
      eq:'return 5     // 總共只用了 9 次 get(上限 100)',
      note:'n = 10⁴ 的最壞情況實測 53 次,仍有 47 次餘裕',
      text:'<strong>完成</strong> · 答案 <strong>5</strong>,全程 <strong>9 次</strong> get。三段二分的總成本是 <code>2·log n + log n + log n = 4·log n</code>;<code>n = 10⁴</code> 時實測最壞 <strong>53 次</strong>,安全通過 100 次的上限。' },
  ];

  let step = 0, timer = null;

  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function draw(){
    fit();
    const s = steps[step], w = canvas.clientWidth, PAD = 34, n = A.length;
    const done = s.phase === 'done';
    ctx.fillStyle = C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);

    const bw = Math.min(58, (w - 2*PAD) / n - 22);
    const gap = Math.min(28, (w - 2*PAD - n*bw) / (n - 1));
    const x0 = (w - (n*bw + (n-1)*gap)) / 2;
    const edge = j => x0 + j * (bw + gap);
    const cx = j => edge(j) + bw/2;

    const BASE = 190, MAXH = 118, VMAX = 7;
    const IDX_Y = 206, PTR_Y = 224;

    // ── BAND 1 標題 + get 計數 ──
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 山形(值只能靠 get 讀出來)· target = ' + TARGET, PAD, 16);
    ctx.textAlign='right'; ctx.font='700 12.5px "JetBrains Mono", monospace';
    ctx.fillStyle = done ? C.okT : C.curT;
    ctx.fillText('get 已用 ' + s.calls + ' / 100', w - PAD, 16);

    // 目前區間說明
    ctx.textAlign='center'; ctx.font='700 12.5px "JetBrains Mono", monospace';
    ctx.fillStyle = done ? C.okT : (s.phase==='peak' ? C.segT : C.winT);
    let head;
    if (s.phase === 'peak')      head = '找峰中 · l = ' + s.lo + ' , r = ' + s.hi + '   探 m = ' + s.mid;
    else if (s.phase === 'asc')  head = '左半升序二分 [ ' + s.lo + ' , ' + s.hi + ' ]   探 mid = ' + s.mid;
    else if (s.phase === 'desc') head = '右半降序二分 [ ' + s.lo + ' , ' + s.hi + ' ]   探 mid = ' + s.mid;
    else if (s.peak >= 0)        head = '峰 = ' + s.peak + '　左半 [0, ' + s.peak + '] 遞增　右半 [' + (s.peak+1) + ', ' + (n-1) + '] 遞減';
    else                         head = '整段候選 [ 0 , ' + (n-1) + ' ]';
    ctx.fillText(head, w/2, 44);

    // ── 長條 ──
    for (let j = 0; j < n; j++) {
      const h = Math.round(MAXH * A[j] / VMAX);
      const top = BASE - h;
      const inRange = j >= s.lo && j <= s.hi;
      let bg = C.off, bd = C.offS, tx = C.offT;
      if (j === s.hit)                       { bg = C.ok;  bd = C.okS;  tx = C.okT; }
      else if (j === s.mid || j === s.peek)  { bg = C.cur; bd = C.curS; tx = C.curT; }
      else if (j === s.peak)                 { bg = C.seg; bd = C.segS; tx = C.segT; }
      else if (inRange)                      { bg = C.win; bd = C.winS; tx = C.winT; }
      rr(edge(j), top, bw, h, 4);
      ctx.fillStyle = bg; ctx.fill();
      ctx.lineWidth = 1.6; ctx.strokeStyle = bd; ctx.stroke();
      // 值:只有已經被 get 過(mid / peek / peak / hit)才用深色實寫,其餘淡灰
      const known = (j === s.mid || j === s.peek || j === s.peak || j === s.hit);
      ctx.fillStyle = known ? tx : C.offT;
      ctx.font = (known ? '700 ' : '500 ') + '13.5px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='alphabetic';
      ctx.fillText(String(A[j]), cx(j), top - 8);
      // 索引
      ctx.fillStyle = inRange ? C.text : C.offT;
      ctx.font='500 11px "JetBrains Mono", monospace';
      ctx.fillText(String(j), cx(j), IDX_Y);
    }
    // 基線
    ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x0 - 12, BASE + 0.5); ctx.lineTo(edge(n-1) + bw + 12, BASE + 0.5); ctx.stroke();

    // ── 指標列(自成一帶,不壓到索引)──
    const tag = (j, txt, col) => {
      if (j < 0 || j >= n) return;
      ctx.fillStyle = col; ctx.font='700 11px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='top';
      ctx.fillText(txt, cx(j), PTR_Y);
    };
    if (s.phase === 'peak') { tag(s.lo,'l',C.winT); tag(s.hi,'r',C.winT); tag(s.mid,'m',C.curT); tag(s.peek,'m+1',C.curT); }
    else if (s.phase === 'asc' || s.phase === 'desc' || s.phase === 'done') {
      tag(s.lo,'lo',C.winT); tag(s.hi,'hi',C.winT);
      if (s.hit >= 0 && s.phase !== 'asc') tag(s.hit,'hit',C.okT); else tag(s.mid,'mid',C.curT);
    } else if (s.peak >= 0) { tag(s.peak,'peak',C.segT); }

    // ── BAND 2 ──
    const B2 = 258;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 這一步問了什麼', PAD, B2);
    rr(PAD, B2 + 10, w - 2*PAD, 42, 6);
    ctx.fillStyle = done ? C.ok : (s.hit >= 0 ? C.ok : (s.phase === 'idle' ? '#fafaf6' : C.cur));
    ctx.fill();
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = done ? C.okS : (s.hit >= 0 ? C.okS : (s.phase === 'idle' ? C.grid : C.curS));
    ctx.stroke();
    ctx.fillStyle = done ? C.okT : (s.hit >= 0 ? C.okT : (s.phase === 'idle' ? C.text : C.curT));
    ctx.font='700 13px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(s.eq, w/2, B2 + 31);

    // ── BAND 3 ──
    const B3 = 330;
    ctx.fillStyle=C.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 為什麼可以這樣縮', PAD, B3);
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
