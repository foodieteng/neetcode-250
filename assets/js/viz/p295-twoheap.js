/* ============================================================
   P295 · Find Median from Data Stream — 雙堆 · viz(兩個寫法各一個動畫)
     v295a:我的版本 —— 依 size 決定放哪邊,兩個 top 亂序就交換一次
       if (mxH.size() <= miH.size()) mxH.push(num); else miH.push(num);
       if (!miH.empty() && mxH.top() > miH.top()) swap 兩個 top
     v295b:精簡版 —— 先進 lo,lo 最大的送到 hi,hi 比較多就送回一個
       lo.push(num); hi.push(lo.top()); lo.pop();
       if (hi.size() > lo.size()) { lo.push(hi.top()); hi.pop(); }
   資料流 5 2 8 9 1 4 → median 5, 3.5, 5, 6.5, 5, 4.5(g++ 實跑 trace)
   畫法:兩個堆「依值排開」放在一條數線上 —— 左堆(最大堆)的 top 在最右、
         右堆(最小堆)的 top 在最左,兩個 top 面對面;順序對時整排由左讀到右就是排序好的。
     BAND 1  資料流 + 每次 add 後的 median
     BAND 2  左堆 | 中間(搬移箭頭 / 兩 top 比較)| 右堆
     BAND 3  這一步做了什麼 + 檢查 + 目前 median
   前綴 v295a- / v295b- 。
   ============================================================ */
(function () {
  const C = { paper:'#ffffff', ink:'#1f1f1f', dim:'#5a5a5a', off:'#cfcfcf',
    up:'#e3edf5', low:'#f6ead8',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424',
    good:'#d9e8c7', bad:'#f0d4d4', deep:'#a31d1d' };
  const MONO = '"JetBrains Mono", monospace', SANS = '"Noto Sans TC", sans-serif';
  const SV = [5, 2, 8, 9, 1, 4];
  const MED = ['5', '3.5', '5', '6.5', '5', '4.5'];

  /* L / R:依值由小到大;hl:[side, value];arrow:'LR' | 'RL' | 'SWAP' | null;
     chk:[文字, 'ok' | 'bad' | 'note' | 'none'];seen:讀到第幾個;nmed:已算出幾個 median */
  const S = (L, R, hl, arrow, seen, nmed, act, chk, text) => ({ L, R, hl, arrow, seen, nmed, act, chk, text });

  const STEPS_A = [
    S([], [], [], null, 0, 0, '規則:mxH.size() ≤ miH.size() 就進 mxH', ['之後檢查 mxH.top > miH.top', 'none'],
      '<strong>INITIAL</strong> · 左邊 <code>mxH</code>(最大堆)放<b>較小的一半</b>,右邊 <code>miH</code>(最小堆)放<b>較大的一半</b>,兩個 top 面對面。<strong>規則:兩邊一樣多就進左邊,否則進右邊;進完若兩個 top 亂序,交換一次。</strong>'),
    S([5], [], [['L',5]], null, 1, 1, 'size 0 ≤ 0 → mxH.push(5)', ['miH 空,不用檢查', 'none'],
      '<strong>add 5</strong> · 兩邊都空,<code>0 ≤ 0</code> → 進 <code>mxH</code>。<code>miH</code> 是空的,<code>!miH.empty()</code> 擋掉檢查。左邊多一個 → <strong>median = mxH.top = 5</strong>。'),
    S([5], [2], [['R',2]], null, 2, 1, 'size 1 > 0 → miH.push(2)', ['mxH.top 5 > miH.top 2', 'bad'],
      '<strong>add 2 · 先依 size 放</strong> · 左邊比較多,<code>2</code> 進右邊 <code>miH</code>。<strong>可是 2 比左邊的 5 還小</strong> —— 兩個 top 亂序了(深紅)。'),
    S([2], [5], [['L',2],['R',5]], 'SWAP', 2, 2, 'swap:5 → miH,2 → mxH', ['2 ≤ 5,順序對了', 'ok'],
      '<strong>add 2 · 交換兩個 top</strong> · 左邊的 <code>5</code> 和右邊的 <code>2</code> 對調。<b>兩邊 size 都沒變</b>(各 pop 一個、push 一個),只修順序。一樣多 → <strong>median = (2 + 5) / 2 = 3.5</strong>。'),
    S([2,8], [5], [['L',8]], null, 3, 2, 'size 1 ≤ 1 → mxH.push(8)', ['mxH.top 8 > miH.top 5', 'bad'],
      '<strong>add 8 · 先依 size 放</strong> · 兩邊一樣多 → 進左邊。但 <code>8</code> 成了左邊的 top,<strong>比右邊的 5 大</strong>,又亂序了。'),
    S([2,5], [8], [['L',5],['R',8]], 'SWAP', 3, 3, 'swap:8 → miH,5 → mxH', ['5 ≤ 8,順序對了', 'ok'],
      '<strong>add 8 · 交換</strong> · <code>8</code> 換到右邊,<code>5</code> 換回左邊。左邊多一個 → <strong>median = mxH.top = 5</strong>。'),
    S([2,5], [8,9], [['R',9]], null, 4, 4, 'size 2 > 1 → miH.push(9)', ['mxH.top 5 ≤ miH.top 8', 'ok'],
      '<strong>add 9</strong> · 左邊比較多 → 進右邊。<code>9</code> 本來就屬於大的那半,右邊 top 還是 <code>8</code>,<code>5 ≤ 8</code> → <b>不用交換</b>。<strong>median = (5 + 8) / 2 = 6.5</strong>。'),
    S([1,2,5], [8,9], [['L',1]], null, 5, 5, 'size 2 ≤ 2 → mxH.push(1)', ['mxH.top 5 ≤ miH.top 8', 'ok'],
      '<strong>add 1</strong> · 一樣多 → 進左邊。<code>1</code> 很小,左邊 top 還是 <code>5</code> → <b>不用交換</b>。<strong>median = 5</strong>。'),
    S([1,2,5], [4,8,9], [['R',4]], null, 6, 5, 'size 3 > 2 → miH.push(4)', ['mxH.top 5 > miH.top 4', 'bad'],
      '<strong>add 4 · 先依 size 放</strong> · 左邊比較多 → <code>4</code> 進右邊,成了右邊的 top。<strong>4 &lt; 5</strong>,亂序。'),
    S([1,2,4], [5,8,9], [['L',4],['R',5]], 'SWAP', 6, 6, 'swap:5 → miH,4 → mxH', ['4 ≤ 5,順序對了', 'ok'],
      '<strong>add 4 · 交換</strong> · <code>5</code> 去右邊、<code>4</code> 回左邊。<b>為什麼換一次就夠?</b>放進去之前順序是對的,只有剛放的那一個可能站錯邊,換掉兩個 top 就修好。<strong>median = (4 + 5) / 2 = 4.5</strong>。'),
    S([1,2,4], [5,8,9], [], null, 6, 6, '6 次 add:3 次交換', ['左 ≤ 右,size 差 ≤ 1', 'ok'],
      '<strong>完成</strong> · 輸出 median <code>5, 3.5, 5, 6.5, 5, 4.5</code>。6 次 add 裡 3 次要交換。每次最多 2 push + 2 pop,<code>addNum O(log n)</code>、<code>findMedian O(1)</code>。'),
  ];

  const STEPS_B = [
    S([], [], [], null, 0, 0, '規則:先進 lo,lo 最大的送到 hi', ['hi 比較多就送回一個', 'none'],
      '<strong>INITIAL</strong> · 左邊 <code>lo</code>(最大堆)、右邊 <code>hi</code>(最小堆)。<strong>每次 add 固定三步:① 進 lo ② 把 lo 最大的送到 hi ③ hi 比 lo 多就送回一個。</strong>不用比較兩個 top。'),
    S([5], [], [['L',5]], null, 1, 0, '① lo.push(5)', ['', 'none'],
      '<strong>add 5 · ① 進 lo</strong> · <code>5</code> 先放左邊。'),
    S([], [5], [['R',5]], 'LR', 1, 0, '② lo 最大的 5 → hi', ['hi 1 > lo 0', 'note'],
      '<strong>add 5 · ② 送到 hi</strong> · 左邊最大的就是 <code>5</code>,送去右邊。<b>這一步保證順序</b>:送過去的是左邊最大的,右邊收到的不可能比左邊任何一個小。現在右邊比較多。'),
    S([5], [], [['L',5]], 'RL', 1, 1, '③ hi 比較多 → 5 送回 lo', ['lo 1 ≥ hi 0', 'ok'],
      '<strong>add 5 · ③ 補平衡</strong> · <code>hi.size() 1 &gt; lo.size() 0</code>,把右邊最小的送回左邊。<b>這一步保證 lo 不比 hi 少</b>。<strong>median = lo.top = 5</strong>。'),
    S([2,5], [], [['L',2]], null, 2, 1, '① lo.push(2)', ['', 'none'],
      '<strong>add 2 · ① 進 lo</strong> · 左邊變 <code>{2, 5}</code>,top 是 <code>5</code>。'),
    S([2], [5], [['R',5]], 'LR', 2, 2, '② lo 最大的 5 → hi', ['lo 1 = hi 1,不用③', 'ok'],
      '<strong>add 2 · ② 送到 hi</strong> · 送過去的是 <code>5</code>(不是剛進來的 2)。兩邊一樣多,<b>③ 不用做</b>。<strong>median = (2 + 5) / 2 = 3.5</strong>。'),
    S([2,8], [5], [['L',8]], null, 3, 2, '① lo.push(8)', ['lo.top 8 > hi.top 5(暫時)', 'note'],
      '<strong>add 8 · ① 進 lo</strong> · <code>8</code> 進左邊,暫時比右邊的 5 大 —— <b>沒關係,② 馬上把它送走</b>。'),
    S([2], [5,8], [['R',8]], 'LR', 3, 2, '② lo 最大的 8 → hi', ['hi 2 > lo 1', 'note'],
      '<strong>add 8 · ② 送到 hi</strong> · 左邊最大的 <code>8</code> 去右邊。順序對了,但右邊多了一個。'),
    S([2,5], [8], [['L',5]], 'RL', 3, 3, '③ hi 最小的 5 → lo', ['lo 2 ≥ hi 1', 'ok'],
      '<strong>add 8 · ③ 補平衡</strong> · 右邊最小的 <code>5</code> 送回左邊。<strong>median = lo.top = 5</strong>。'),
    S([2,5,9], [8], [['L',9]], null, 4, 3, '① lo.push(9)', ['lo.top 9 > hi.top 8(暫時)', 'note'],
      '<strong>add 9 · ① 進 lo</strong> · 不管多大都先進左邊。<code>9</code> 暫時站錯邊。'),
    S([2,5], [8,9], [['R',9]], 'LR', 4, 4, '② lo 最大的 9 → hi', ['lo 2 = hi 2,不用③', 'ok'],
      '<strong>add 9 · ② 送到 hi</strong> · <code>9</code> 送去右邊,兩邊一樣多。<strong>median = (5 + 8) / 2 = 6.5</strong>。'),
    S([1,2,5], [8,9], [['L',1]], null, 5, 4, '① lo.push(1)', ['', 'none'],
      '<strong>add 1 · ① 進 lo</strong> · 左邊 top 還是 <code>5</code>。'),
    S([1,2], [5,8,9], [['R',5]], 'LR', 5, 4, '② lo 最大的 5 → hi', ['hi 3 > lo 2', 'note'],
      '<strong>add 1 · ② 送到 hi</strong> · <b>就算 1 很小,也要照做 ②</b>:送過去的是左邊最大的 <code>5</code>。右邊多了一個。'),
    S([1,2,5], [8,9], [['L',5]], 'RL', 5, 5, '③ hi 最小的 5 → lo', ['lo 3 ≥ hi 2', 'ok'],
      '<strong>add 1 · ③ 補平衡</strong> · <code>5</code> 又被送回來。<b>② ③ 一來一回,這就是精簡版多付的 push / pop</b>。<strong>median = 5</strong>。'),
    S([1,2,4,5], [8,9], [['L',4]], null, 6, 5, '① lo.push(4)', ['', 'none'],
      '<strong>add 4 · ① 進 lo</strong> · 左邊暫時有 4 個。'),
    S([1,2,4], [5,8,9], [['R',5]], 'LR', 6, 6, '② lo 最大的 5 → hi', ['lo 3 = hi 3,不用③', 'ok'],
      '<strong>add 4 · ② 送到 hi</strong> · <code>5</code> 去右邊,兩邊各 3 個。<strong>median = (4 + 5) / 2 = 4.5</strong>。'),
    S([1,2,4], [5,8,9], [], null, 6, 6, '每次固定 2 push + 1 pop', ['③ 做了 3 次', 'ok'],
      '<strong>完成</strong> · 和我的版本答案一樣:<code>5, 3.5, 5, 6.5, 5, 4.5</code>。<b>不用比較 top,也不用 swap</b>;代價是每次固定多搬一次。5 萬次 add 實測:精簡版 125,000 push / 75,000 pop,我的版本隨機資料 99,632 / 49,632。'),
  ];

  function mount(prefix, steps, names) {
    const canvas = document.getElementById(prefix + '-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const stepEl = document.getElementById(prefix + '-step'), labelEl = document.getElementById(prefix + '-label');
    const bPrev = document.getElementById(prefix + '-prev'), bNext = document.getElementById(prefix + '-next'),
          bPlay = document.getElementById(prefix + '-play'), bReset = document.getElementById(prefix + '-reset');
    let step = 0, timer = null;

    function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
      const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||340; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
      if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
    function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
    function box(x,y,w,h,fill,stroke,lw,dash){ rr(x,y,w,h,5); ctx.fillStyle=fill; ctx.fill(); ctx.lineWidth=lw||1.4; if(dash) ctx.setLineDash(dash); ctx.strokeStyle=stroke; ctx.stroke(); ctx.setLineDash([]); }
    function txt(s,x,y,color,font,align,base){ ctx.fillStyle=color; ctx.font=font; ctx.textAlign=align||'center'; ctx.textBaseline=base||'middle'; ctx.fillText(s,x,y); }
    function head(s,x,y){ txt(s,x,y,C.dim,'600 12px '+MONO+', '+SANS,'left','alphabetic'); }
    function arrow(x1,x2,y,color){ ctx.strokeStyle=color; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(x1,y); ctx.lineTo(x2,y); ctx.stroke();
      const d = x2 > x1 ? 1 : -1; ctx.fillStyle=color; ctx.beginPath(); ctx.moveTo(x2,y); ctx.lineTo(x2-d*9,y-5); ctx.lineTo(x2-d*9,y+5); ctx.closePath(); ctx.fill(); }

    const B1 = 18, B2 = 112, B3 = 246;

    function draw(){
      fit();
      const s = steps[step], w = canvas.clientWidth, H = canvas.clientHeight, PAD = 22, inner = w - 2*PAD;
      ctx.fillStyle = C.paper; ctx.fillRect(0,0,w,H); ctx.setLineDash([]);
      const isHL = (side, v) => s.hl.some(h => h[0] === side && h[1] === v);
      const bad = s.chk[1] === 'bad';

      /* ---------- BAND 1 · 資料流 ---------- */
      head('BAND 1 · 資料流   紅 = 目前　藍底 = 已加入　下方 = 加完後的 median', PAD, B1);
      const sy = B1 + 12, sh = 32, sg = 12;
      const sw = Math.min(64, (inner - 5*sg) / 6);
      for (let i = 0; i < SV.length; i++) {
        const x = PAD + i*(sw + sg);
        let fill = C.paper, st = C.off, tc = C.off, lw = 1.2, dash = [3,3];
        if (i < s.seen) { dash = null;
          if (i === s.seen - 1 && step < steps.length - 1) { fill = C.cur; st = C.curS; tc = C.curT; lw = 2.4; }
          else { fill = C.up; st = C.ink; tc = C.ink; lw = 1.4; } }
        box(x, sy, sw, sh, fill, st, lw, dash);
        txt(String(SV[i]), x + sw/2, sy + sh/2 + 1, tc, '700 14px '+MONO);
        const mlab = i < s.nmed ? 'med ' + MED[i] : (i < s.seen ? 'med …' : '');
        if (mlab) txt(mlab, x + sw/2, sy + sh + 16, i < s.nmed ? (i === s.nmed - 1 && step < steps.length - 1 ? C.curT : C.ink) : C.dim, '700 11px '+MONO, 'center', 'middle');
      }
      const rx = PAD + 6*(sw + sg) - sg + 18;
      if (rx + 120 < w - PAD) {
        txt('add 後立刻 findMedian', w - PAD, sy + sh/2 + 1, C.dim, '600 11px '+SANS, 'right', 'middle');
      }

      /* ---------- BAND 2 · 兩個堆 ---------- */
      head('BAND 2 · 兩個堆(依值排開,top 面對面)', PAD, B2);
      const gap = Math.max(96, Math.min(130, inner * 0.16));
      const sideW = (inner - gap) / 2;
      const cg = 8, cw = Math.min(76, (sideW - 3*cg) / 4), ch = 40;
      const nameY = B2 + 24, cellTop = B2 + 40, capY = cellTop + ch + 16;
      const lx0 = PAD, lx1 = PAD + sideW, rx0 = w - PAD - sideW, rx1 = w - PAD;
      txt(names[0], lx0, nameY, C.ink, '700 12px '+MONO+', '+SANS, 'left', 'alphabetic');
      txt(names[1], rx1, nameY, C.ink, '700 12px '+MONO+', '+SANS, 'right', 'alphabetic');
      // 4 個槽位:左邊靠右對齊、右邊靠左對齊
      const lcx = j => lx1 - (4 - j)*cw - (3 - j)*cg;        // j = 0..3,j=3 最靠中間
      const rcx = j => rx0 + j*(cw + cg);                     // j = 0 最靠中間
      for (let j = 0; j < 4; j++) {
        const k = j - (4 - s.L.length);                       // L 的第 k 小
        const x = lcx(j);
        if (k < 0) { box(x, cellTop, cw, ch, C.paper, C.off, 1.1, [3,3]); continue; }
        const v = s.L[k], top = k === s.L.length - 1, hl = isHL('L', v);
        let fill = C.up, st = C.ink, tc = C.ink, lw = top ? 2.4 : 1.4;
        if (bad && top) { fill = C.bad; st = C.deep; tc = C.deep; lw = 2.4; }
        else if (hl) { fill = C.cur; st = C.curS; tc = C.curT; lw = 2.4; }
        box(x, cellTop, cw, ch, fill, st, lw);
        txt(String(v), x + cw/2, cellTop + ch/2 + 1, tc, '700 15px '+MONO);
        if (top) txt('▲ top', x + cw/2, capY, bad ? C.deep : C.ink, '700 11px '+MONO, 'center', 'middle');
      }
      for (let j = 0; j < 4; j++) {
        const x = rcx(j);
        if (j >= s.R.length) { box(x, cellTop, cw, ch, C.paper, C.off, 1.1, [3,3]); continue; }
        const v = s.R[j], top = j === 0, hl = isHL('R', v);
        let fill = C.low, st = C.ink, tc = C.ink, lw = top ? 2.4 : 1.4;
        if (bad && top) { fill = C.bad; st = C.deep; tc = C.deep; lw = 2.4; }
        else if (hl) { fill = C.cur; st = C.curS; tc = C.curT; lw = 2.4; }
        box(x, cellTop, cw, ch, fill, st, lw);
        txt(String(v), x + cw/2, cellTop + ch/2 + 1, tc, '700 15px '+MONO);
        if (top) txt('▲ top', x + cw/2, capY, bad ? C.deep : C.ink, '700 11px '+MONO, 'center', 'middle');
      }
      txt('size ' + s.L.length, lx0, capY, C.dim, '700 11.5px '+MONO, 'left', 'middle');
      txt('size ' + s.R.length, rx1, capY, C.dim, '700 11.5px '+MONO, 'right', 'middle');

      // 中間:搬移箭頭 / 比較
      const gx0 = lx1 + 10, gx1 = rx0 - 10, gm = (lx1 + rx0) / 2, cy = cellTop + ch/2;
      if (s.arrow === 'SWAP') {
        arrow(gx0, gx1, cy - 8, C.curS); arrow(gx1, gx0, cy + 8, C.curS);
        txt('swap', gm, cellTop - 6, C.curT, '700 11px '+MONO, 'center', 'alphabetic');
      } else if (s.arrow === 'LR' || s.arrow === 'RL') {
        const v = s.hl.length ? s.hl[0][1] : '';
        if (s.arrow === 'LR') arrow(gx0, gx1, cy, C.curS); else arrow(gx1, gx0, cy, C.curS);
        txt('搬 ' + v, gm, cellTop - 6, C.curT, '700 11px '+MONO+', '+SANS, 'center', 'alphabetic');
      } else if (s.L.length && s.R.length) {
        const gt = s.L[s.L.length - 1] > s.R[0];
        txt(gt ? '>' : '≤', gm, cy + 1, bad ? C.deep : (gt ? C.curT : C.dim), '700 22px '+MONO);
        if (gt && !bad) txt('暫時', gm, cellTop - 6, C.curT, '700 11px '+SANS, 'center', 'alphabetic');
        if (bad) txt('亂序', gm, cellTop - 6, C.deep, '700 11px '+SANS, 'center', 'alphabetic');
      }

      /* ---------- BAND 3 · 這一步 ---------- */
      head('BAND 3 · 這一步', PAD, B3);
      const by = B3 + 12, bh = 32;
      const w1 = Math.round(inner * 0.52), w2 = inner - w1 - 10;
      box(PAD, by, w1, bh, C.paper, C.ink, 1.4);
      txt(s.act, PAD + 12, by + bh/2 + 1, C.ink, '700 12px '+MONO+', '+SANS, 'left', 'middle');
      const kind = s.chk[1];
      if (kind === 'none' || !s.chk[0]) box(PAD + w1 + 10, by, w2, bh, C.paper, C.off, 1.2, [3,3]);
      else box(PAD + w1 + 10, by, w2, bh, kind === 'bad' ? C.bad : kind === 'ok' ? C.good : C.low, kind === 'bad' ? C.deep : C.ink, kind === 'bad' ? 2.2 : 1.4);
      txt((kind === 'bad' ? '× ' : kind === 'ok' ? '● ' : '') + s.chk[0], PAD + w1 + 10 + w2/2, by + bh/2 + 1,
          kind === 'bad' ? C.deep : (kind === 'none' ? C.dim : C.ink), '700 11.5px '+MONO+', '+SANS);
      const my = by + bh + 12;
      const fresh = s.nmed > 0 && s.nmed === s.seen;
      const total = s.L.length + s.R.length;
      let mtxt = 'median:還沒有資料', mfill = C.paper, mst = C.off, mtc = C.dim, mdash = [3,3];
      if (fresh) {
        const lt = s.L[s.L.length - 1];
        mtxt = s.L.length > s.R.length ? 'median = ' + names[2] + '.top = ' + lt
             : 'median = (' + lt + ' + ' + s.R[0] + ') / 2 = ' + MED[s.nmed - 1];
        mfill = C.good; mst = C.ink; mtc = C.ink; mdash = null;
      } else if (total) { mtxt = '這次 add 還沒做完,先不算 median'; }
      box(PAD, my, inner, bh, mfill, mst, 1.4, mdash);
      txt(mtxt, PAD + inner/2, my + bh/2 + 1, mtc, '700 12.5px '+MONO+', '+SANS);
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
  }

  mount('v295a', STEPS_A, ['mxH · 最大堆 · 較小的一半', 'miH · 最小堆 · 較大的一半', 'mxH']);
  mount('v295b', STEPS_B, ['lo · 最大堆 · 較小的一半', 'hi · 最小堆 · 較大的一半', 'lo']);
})();
