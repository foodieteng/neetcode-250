/* ============================================================
   P1863 · Sum of All Subset XOR Totals — 回溯兩種寫法 · viz(兩個動畫)
     v1863a:for 迴圈式 —— 每個節點都是一個子集,進來就 total += cur
       total += cur;
       for (int i = s; i < n; i++) dfs(nums, i + 1, total, cur ^ nums[i]);
     v1863b:二元 選 / 不選 —— 第 k 層決定 nums[k],只有葉子是子集
       if (i == n) return cur;
       return dfs(i + 1, cur ^ nums[i]) + dfs(i + 1, cur);
   nums = [5,1,6] → 28(g++ 實跑 trace,見 FACTS)
     for 迴圈:{} 0、{5} 5、{5,1} 4、{5,1,6} 2、{5,6} 3、{1} 1、{1,6} 7、{6} 6
               total 0, 5, 9, 11, 14, 15, 22, 28 —— 8 個節點 = 2^3 次呼叫
     二元:葉 111..000 = 2, 4, 3, 5, 7, 1, 6, 0 → total 2, 6, 9, 14, 21, 22, 28, 28
               15 次呼叫 = 2^4 − 1,只有 8 個葉子相加
   A:BAND 1 nums + 迴圈範圍 i = s..n-1 / BAND 2 遞迴樹(每層 = 子集大小)/ BAND 3 這一步
   B:BAND 1 決策樹(左 = 選、右 = 不選)/ BAND 2 路徑 + total + 呼叫數
   前綴 v1863a- / v1863b- 。
   ============================================================ */
(function () {
  const C = { paper:'#ffffff', ink:'#1f1f1f', dim:'#5a5a5a', off:'#cfcfcf',
    up:'#e3edf5', low:'#f6ead8',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424',
    good:'#d9e8c7', bad:'#f0d4d4', deep:'#a31d1d' };
  const MONO = '"JetBrains Mono", monospace', SANS = '"Noto Sans TC", sans-serif';
  const NUMS = [5, 1, 6], N = 3;

  /* ---------------- A · for 迴圈式 ---------------- */
  /* 節點 id = 拜訪順序(0..7)。par:父節點;add:這條邊加進來的元素;fx:樹區內的水平位置 */
  const TA = [
    { set:'{}',      cur:0, s:0, par:-1, add:null, lvl:0, fx:0.50 },
    { set:'{5}',     cur:5, s:1, par:0,  add:5,    lvl:1, fx:0.20 },
    { set:'{5,1}',   cur:4, s:2, par:1,  add:1,    lvl:2, fx:0.08 },
    { set:'{5,1,6}', cur:2, s:3, par:2,  add:6,    lvl:3, fx:0.08 },
    { set:'{5,6}',   cur:3, s:3, par:1,  add:6,    lvl:2, fx:0.34 },
    { set:'{1}',     cur:1, s:2, par:0,  add:1,    lvl:1, fx:0.60 },
    { set:'{1,6}',   cur:7, s:3, par:5,  add:6,    lvl:2, fx:0.60 },
    { set:'{6}',     cur:6, s:3, par:0,  add:6,    lvl:1, fx:0.88 },
  ];
  const TOT_A = [0, 5, 9, 11, 14, 15, 22, 28];

  /* vis:已拜訪幾個節點(含目前);curId:目前節點(-1 = 沒有) */
  const SA = (vis, curId, text) => ({ vis, curId, text });
  const STEPS_A = [
    SA(0, -1, '<strong>INITIAL</strong> · <code>nums = [5,1,6]</code>。for 迴圈式:<b>每一個呼叫就是一個子集</b>,進來先 <code>total += cur</code>,再用迴圈 <code>i = s..n-1</code> 決定「下一個要加誰」。樹的每一層 = 子集大小。'),
    SA(1, 0, '<strong>#1 · dfs(s=0) · {}</strong> · 空集合也是子集,<code>total += 0</code>。迴圈 <code>i = 0..2</code> → 三個孩子 <code>+5</code>、<code>+1</code>、<code>+6</code>。'),
    SA(2, 1, '<strong>#2 · {5}</strong> · <code>cur = 0 ^ 5 = 5</code>,<code>total 0 += 5 → 5</code>。<code>s = 1</code>:只能往後加 <code>1</code> 或 <code>6</code>,<b>不會回頭加 5</b>,所以不會重複。'),
    SA(3, 2, '<strong>#3 · {5,1}</strong> · <code>cur = 5 ^ 1 = 4</code>,<code>total 5 += 4 → 9</code>。<code>s = 2</code>:只剩 <code>+6</code> 一個孩子。'),
    SA(4, 3, '<strong>#4 · {5,1,6}</strong> · <code>cur = 4 ^ 6 = 2</code>,<code>total 9 += 2 → 11</code>。<code>s = 3</code>:迴圈 <code>i = 3..2</code> 是空的 → <b>不用寫 base case,迴圈跑不動就自然 return</b>。'),
    SA(5, 4, '<strong>#5 · {5,6}</strong> · 回到 <code>{5}</code> 的迴圈下一輪 <code>i = 2</code>。<code>cur = 5 ^ 6 = 3</code>(用的是 <code>{5}</code> 的 cur,不是剛才的 2),<code>total 11 += 3 → 14</code>。'),
    SA(6, 5, '<strong>#6 · {1}</strong> · 回到根的迴圈 <code>i = 1</code>。<code>cur = 0 ^ 1 = 1</code>,<code>total 14 += 1 → 15</code>。<code>s = 2</code>:只能加 <code>6</code>,<b>不會再加 5</b>({1,5} 已經以 {5,1} 出現過)。'),
    SA(7, 6, '<strong>#7 · {1,6}</strong> · <code>cur = 1 ^ 6 = 7</code>,<code>total 15 += 7 → 22</code>。<code>s = 3</code>,空迴圈 return。'),
    SA(8, 7, '<strong>#8 · {6}</strong> · 根的迴圈 <code>i = 2</code>。<code>cur = 6</code>,<code>total 22 += 6 → 28</code>。空迴圈 return,整棵樹走完。'),
    SA(8, -1, '<strong>完成 · total = 28</strong> · <b>每個節點都是一個子集 → 每個節點都加</b>。8 個節點 = <strong>2<sup>3</sup> 次呼叫</strong>,一次都沒浪費;樹的形狀是「一層一層變大的子集」,左重右輕。'),
  ];

  /* ---------------- B · 二元 選 / 不選 ---------------- */
  /* 葉 k(0..7,左到右):第 d 層 bit = 1 - ((k >> (2-d)) & 1),1 = 選 */
  function curOf(d, j) {            // 深度 d、該層第 j 個節點的 cur
    let c = 0;
    for (let t = 0; t < d; t++) { const pick = 1 - ((j >> (d - 1 - t)) & 1); if (pick) c ^= NUMS[t]; }
    return c;
  }
  function setOf(k) { const a = []; for (let t = 0; t < N; t++) if (1 - ((k >> (N - 1 - t)) & 1)) a.push(NUMS[t]); return '{' + a.join(',') + '}'; }
  function bitsOf(k) { let s = ''; for (let t = 0; t < N; t++) s += String(1 - ((k >> (N - 1 - t)) & 1)); return s; }
  const LEAF = [0,1,2,3,4,5,6,7].map(k => ({ set: setOf(k), cur: curOf(3, k), bits: bitsOf(k) }));
  const TOT_B = []; LEAF.reduce((a, l, i) => (TOT_B[i] = a + l.cur), 0);

  /* leaf:目前葉子(-1 = 還沒 / 已完成);done:已加完幾個葉子 */
  const SB = (leaf, done, text) => ({ leaf, done, text });
  const STEPS_B = [
    SB(-1, 0, '<strong>INITIAL</strong> · 二元寫法:<b>第 k 層只回答一個問題 —— nums[k] 要不要?</b>左邊「選」、右邊「不選」。走到 <code>i == n</code> 才是一個完整子集,<strong>只有葉子回傳 cur</strong>;中間節點只把 cur 往下傳。'),
    SB(0, 0, '<strong>葉 111 · {5,1,6}</strong> · 先一路都「選」:<code>cur 0 → 5 → 4 → 2</code>。到 <code>i == 3</code> 回傳 <code>2</code>,<code>total = 2</code>。路上 3 個中間節點都<b>沒有加</b>。'),
    SB(1, 1, '<strong>葉 110 · {5,1}</strong> · 回到 <code>i = 2</code> 的節點,改走「不選 6」:cur 維持 <code>4</code>。<code>total 2 + 4 → 6</code>。'),
    SB(2, 2, '<strong>葉 101 · {5,6}</strong> · 回到 <code>i = 1</code>,「不選 1」(cur 還是 5),再「選 6」:<code>5 ^ 6 = 3</code>。<code>total 6 + 3 → 9</code>。'),
    SB(3, 3, '<strong>葉 100 · {5}</strong> · 「不選 6」,cur <code>5</code>。<code>total 9 + 5 → 14</code>。左半棵(選 5)的 4 個子集都做完。'),
    SB(4, 4, '<strong>葉 011 · {1,6}</strong> · 回到根,走右邊「不選 5」(cur 0),再選 1、選 6:<code>1 ^ 6 = 7</code>。<code>total 14 + 7 → 21</code>。'),
    SB(5, 5, '<strong>葉 010 · {1}</strong> · cur <code>1</code>,<code>total 21 + 1 → 22</code>。'),
    SB(6, 6, '<strong>葉 001 · {6}</strong> · cur <code>6</code>,<code>total 22 + 6 → 28</code>。'),
    SB(7, 7, '<strong>葉 000 · {}</strong> · 三個都不選 = 空集合,cur <code>0</code>,<code>total 28 + 0 → 28</code>。'),
    SB(-1, 8, '<strong>完成 · total = 28</strong> · <b>只有 8 個葉子是子集</b>,7 個中間節點只是「做到一半的決定」。共 <strong>15 次呼叫 = 2<sup>4</sup> − 1</strong>;樹的形狀是完全二元樹,<b>每一層 = 一個元素的 要 / 不要</b>。'),
  ];

  function mount(prefix, steps, kind) {
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
    function line(x1,y1,x2,y2,color,lw,dash){ ctx.strokeStyle=color; ctx.lineWidth=lw; if(dash) ctx.setLineDash(dash); ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); ctx.setLineDash([]); }
    /* 節點樣式:'cur' 紅、'path' 紅框(呼叫堆疊上)、'done' 綠(已加進 total)、'vis' 藍(已呼叫)、'off' 虛線 */
    function nodeStyle(st){
      if (st === 'cur')  return { fill:C.cur,   st:C.curS, tc:C.curT, lw:2.6, dash:null };
      if (st === 'path') return { fill:C.up,    st:C.curS, tc:C.ink,  lw:2.2, dash:null };
      if (st === 'done') return { fill:C.good,  st:C.ink,  tc:C.ink,  lw:1.4, dash:null };
      if (st === 'vis')  return { fill:C.up,    st:C.ink,  tc:C.ink,  lw:1.4, dash:null };
      return { fill:C.paper, st:C.off, tc:C.off, lw:1.1, dash:[3,3] };
    }

    /* ======================= A ======================= */
    function drawA(s, w, PAD, inner){
      const final = s.curId < 0 && s.vis === TA.length;
      const node = s.curId >= 0 ? TA[s.curId] : null;
      const onPath = new Set(); for (let v = s.curId; v >= 0; v = TA[v].par) onPath.add(v);

      /* ---- BAND 1 · nums + 迴圈範圍 ---- */
      head('BAND 1 · nums   紅 = 這個節點的迴圈範圍 i = s..n-1', PAD, 16);
      const cy0 = 30, ch0 = 30, cw0 = 66, cg0 = 10;
      for (let i = 0; i < N; i++) {
        const x = PAD + i*(cw0 + cg0);
        const inRange = node && i >= node.s;
        let fill = C.paper, st = C.ink, tc = C.ink, lw = 1.4, dash = null;
        if (node && !inRange) { st = C.off; tc = C.off; dash = [3,3]; lw = 1.1; }
        if (inRange) { fill = C.cur; st = C.curS; tc = C.curT; lw = 2.4; }
        box(x, cy0, cw0, ch0, fill, st, lw, dash);
        txt('[' + i + ']', x + 10, cy0 + ch0/2 + 1, inRange ? C.curT : C.dim, '600 11px '+MONO, 'left');
        txt(String(NUMS[i]), x + cw0 - 14, cy0 + ch0/2 + 1, tc, '700 15px '+MONO, 'right');
      }
      const tx = PAD + N*(cw0 + cg0) + 8;
      let lt = '每個節點進來都先 total += cur', lc = C.dim;
      if (node) {
        if (node.s < N) {
          const adds = []; for (let i = node.s; i < N; i++) adds.push('+' + NUMS[i]);
          lt = 's = ' + node.s + ' → for i = ' + node.s + '..' + (N-1) + ' → 孩子 ' + adds.join(' ');
          lc = C.curT;
        } else { lt = 's = 3 → i = 3..2 空迴圈,return'; lc = C.curT; }
      } else if (final) { lt = '8 個節點 = 2³ 次呼叫'; lc = C.ink; }
      txt(lt, tx, cy0 + ch0/2 + 1, lc, '700 12.5px '+MONO+', '+SANS, 'left');

      /* ---- BAND 2 · 遞迴樹 ---- */
      head('BAND 2 · 遞迴樹(每層 = 子集大小)  紅 = 目前  綠 = 已加進 total  虛線 = 還沒', PAD, 86);
      const TAG = 56, x0 = PAD + TAG, tw = w - PAD - x0;
      const LT = [98, 174, 250, 326], NW = 78, NH = 38;
      const cx = n => x0 + n.fx * tw, top = n => LT[n.lvl];
      for (let l = 0; l < 4; l++) txt(l + ' 個', PAD, LT[l] + NH/2 + 1, C.dim, '700 12px '+MONO+', '+SANS, 'left');
      const stOf = id => id === s.curId ? 'cur' : (id < s.vis ? 'done' : 'off');
      // 邊
      TA.forEach((n, id) => {
        if (n.par < 0) return;
        const p = TA[n.par];
        const red = onPath.has(id), seen = id < s.vis;
        line(cx(p), top(p) + NH, cx(n), top(n), red ? C.curS : (seen ? C.ink : C.off), red ? 2.6 : 1.4, seen ? null : [4,4]);
      });
      // 邊標籤 +x
      TA.forEach((n, id) => {
        if (n.par < 0) return;
        const p = TA[n.par];
        const mx = (cx(p) + cx(n)) / 2, my = (top(p) + NH + top(n)) / 2;
        const red = onPath.has(id), seen = id < s.vis;
        const lab = '+' + n.add, lw = 26, lh = 14;
        box(mx - lw/2, my - lh/2, lw, lh, red ? C.cur : C.paper, red ? C.curS : (seen ? C.ink : C.off), red ? 1.6 : 1, seen ? null : [2,2]);
        txt(lab, mx, my + 1, red ? C.curT : (seen ? C.ink : C.off), '700 10.5px '+MONO);
      });
      // 節點
      TA.forEach((n, id) => {
        const sty = nodeStyle(stOf(id)), x = cx(n) - NW/2, y = top(n);
        box(x, y, NW, NH, sty.fill, sty.st, sty.lw, sty.dash);
        txt(n.set, cx(n), y + 13, sty.tc, '700 12.5px '+MONO);
        txt('cur ' + n.cur, cx(n), y + 28, id < s.vis ? (id === s.curId ? C.curT : C.dim) : C.off, '600 11px '+MONO);
        if (id < s.vis) txt('#' + (id + 1), x - 8, y + NH/2 + 1, id === s.curId ? C.curT : C.dim, '700 11px '+MONO, 'right');
      });

      // 右下空位:計數 note(樹左重右輕,右下本來就空)
      const nx = x0 + 0.36 * tw, nw = w - PAD - nx, ny = LT[3];
      const nt = final ? '8 個節點 = 8 個子集 = 2³ 次呼叫'
                       : '已拜訪 ' + s.vis + ' / 8 個節點 · 每個節點都是子集';
      box(nx, ny, nw, NH, final ? C.good : C.paper, final ? C.ink : C.off, 1.4, final ? null : [3,3]);
      txt(nt, nx + nw/2, ny + NH/2 + 1, final ? C.ink : C.dim, '700 12px '+MONO+', '+SANS);

      /* ---- BAND 3 · 這一步 ---- */
      head('BAND 3 · 這一步', PAD, 390);
      const by = 400, bh = 32, w1 = Math.round(inner * 0.55), w2 = inner - w1 - 10;
      let t1 = 'dfs(nums, 0, total, 0) 從根開始', t2 = 'total = 0', f2 = C.paper, s2 = C.off, d2 = [3,3], c2 = C.dim;
      if (node) {
        t1 = '#' + (s.curId + 1) + ' dfs(s=' + node.s + ', cur=' + node.cur + ') · 子集 ' + node.set;
        const before = s.curId ? TOT_A[s.curId - 1] : 0;
        t2 = 'total ' + before + ' += ' + node.cur + ' → ' + TOT_A[s.curId];
        f2 = C.cur; s2 = C.curS; d2 = null; c2 = C.curT;
      } else if (final) {
        t1 = '8 個節點,每個都加 = 8 個子集';
        t2 = 'total = 28'; f2 = C.good; s2 = C.ink; d2 = null; c2 = C.ink;
      }
      box(PAD, by, w1, bh, C.paper, C.ink, 1.4);
      txt(t1, PAD + 12, by + bh/2 + 1, C.ink, '700 12px '+MONO+', '+SANS, 'left');
      box(PAD + w1 + 10, by, w2, bh, f2, s2, node ? 2.2 : 1.4, d2);
      txt(t2, PAD + w1 + 10 + w2/2, by + bh/2 + 1, c2, '700 12.5px '+MONO+', '+SANS);
    }

    /* ======================= B ======================= */
    function drawB(s, w, PAD, inner){
      const final = s.done === 8;
      head('BAND 1 · 決策樹(第 k 層決定 nums[k])  紅 = 目前路徑  綠 = 已加的葉  藍 = 已呼叫', PAD, 16);
      const LT = [30, 104, 178, 252], IW = 52, IH = 30, LW = Math.min(64, inner/8 - 14), LH = 40;
      const xOf = (d, j) => PAD + (j + 0.5) * inner / (1 << d);
      const hOf = d => d === 3 ? LH : IH;
      // 狀態:目前葉 k 的路徑 / 已呼叫
      const k = s.leaf;
      const lastLeaf = final ? 7 : (k >= 0 ? k : -1);          // 到目前為止走到的最右葉
      const visited = (d, j) => lastLeaf >= 0 && j <= (lastLeaf >> (3 - d));
      const onPath = (d, j) => k >= 0 && j === (k >> (3 - d));
      const stOf = (d, j) => {
        if (d === 3) { if (j === k) return 'cur'; if (j < s.done) return 'done'; return 'off'; }
        if (onPath(d, j)) return 'path';
        return visited(d, j) ? 'vis' : 'off';
      };
      // 邊 + 邊標籤
      for (let d = 0; d < 3; d++) for (let j = 0; j < (1 << d); j++) {
        const px = xOf(d, j), py = LT[d] + IH;
        for (let b = 0; b < 2; b++) {           // b = 0 選(左)、1 不選(右)
          const cj = 2*j + b, cx = xOf(d+1, cj), cy = LT[d+1];
          const red = onPath(d+1, cj), seen = visited(d+1, cj);
          line(px, py, cx, cy, red ? C.curS : (seen ? C.ink : C.off), red ? 2.6 : 1.4, seen ? null : [4,4]);
          const mx = (px + cx) / 2, my = (py + cy) / 2;
          const lab = (b === 0 ? '選 ' : '不選 ') + NUMS[d];
          const col = red ? C.curT : (seen ? C.ink : C.off);
          // 標籤沿邊的法向往外上方推 14px:陡的邊往旁邊、緩的邊往上,都不壓線
          const ex = Math.abs(cx - px), ey = cy - py, el = Math.hypot(ex, ey), off = 14;
          const ox = ey / el * off, oy = -ex / el * off;
          if (b === 0) txt(lab, mx - ox, my + oy + 1, col, '700 11px '+SANS+', '+MONO, 'right');
          else         txt(lab, mx + ox, my + oy + 1, col, '700 11px '+SANS+', '+MONO, 'left');
        }
      }
      // 節點
      for (let d = 0; d < 4; d++) for (let j = 0; j < (1 << d); j++) {
        const st = stOf(d, j), sty = nodeStyle(st), x = xOf(d, j), y = LT[d];
        if (d < 3) {
          box(x - IW/2, y, IW, IH, sty.fill, sty.st, sty.lw, sty.dash);
          txt('cur ' + curOf(d, j), x, y + IH/2 + 1, st === 'off' ? C.off : C.ink, '700 11.5px '+MONO);
        } else {
          const L = LEAF[j];
          box(x - LW/2, y, LW, LH, sty.fill, sty.st, sty.lw, sty.dash);
          txt(L.set, x, y + 13, sty.tc, '700 11px '+MONO);
          txt('cur ' + L.cur, x, y + 28, st === 'off' ? C.off : (st === 'cur' ? C.curT : C.dim), '600 10.5px '+MONO);
          txt(L.bits, x, y + LH + 16, st === 'cur' ? C.curT : (st === 'off' ? C.off : C.dim), '700 11px '+MONO);
        }
      }

      /* ---- BAND 2 · 這一步 ---- */
      head('BAND 2 · 這一步', PAD, 336);
      const by = 346, bh = 32, w1 = Math.round(inner * 0.55), w2 = inner - w1 - 10;
      let t1 = 'dfs(nums, 0, 0) 從根開始', t2 = 'total = 0', f2 = C.paper, s2 = C.off, d2 = [3,3], c2 = C.dim;
      if (k >= 0) {
        const L = LEAF[k];
        t1 = '路徑 ' + L.bits.split('').join(' ') + ' → 葉 ' + L.set + ' 回傳 ' + L.cur;
        t2 = 'total ' + (k ? TOT_B[k-1] : 0) + ' + ' + L.cur + ' → ' + TOT_B[k];
        f2 = C.cur; s2 = C.curS; d2 = null; c2 = C.curT;
      } else if (final) {
        t1 = '8 個葉子 = 8 個子集,中間節點不加';
        t2 = 'total = 28'; f2 = C.good; s2 = C.ink; d2 = null; c2 = C.ink;
      }
      box(PAD, by, w1, bh, C.paper, C.ink, 1.4);
      txt(t1, PAD + 12, by + bh/2 + 1, C.ink, '700 12px '+MONO+', '+SANS, 'left');
      box(PAD + w1 + 10, by, w2, bh, f2, s2, k >= 0 ? 2.2 : 1.4, d2);
      txt(t2, PAD + w1 + 10 + w2/2, by + bh/2 + 1, c2, '700 12.5px '+MONO+', '+SANS);

      const ry = by + bh + 12;
      let calls = 0;
      if (lastLeaf >= 0) for (let d = 0; d < 4; d++) calls += (lastLeaf >> (3 - d)) + 1;
      const leaves = final ? 8 : (k >= 0 ? k + 1 : 0);
      const t3 = final ? '呼叫 15 次 = 2⁴ − 1 · 葉 8 個 = 2³ 個子集'
                       : '已呼叫 ' + calls + ' / 15 次 · 葉 ' + leaves + ' / 8 · 中間節點只傳 cur';
      box(PAD, ry, inner, bh, final ? C.good : C.paper, final ? C.ink : C.off, 1.4, final ? null : [3,3]);
      txt(t3, PAD + inner/2, ry + bh/2 + 1, final ? C.ink : C.dim, '700 12px '+MONO+', '+SANS);
    }

    function draw(){
      fit();
      const s = steps[step], w = canvas.clientWidth, H = canvas.clientHeight, PAD = 22, inner = w - 2*PAD;
      ctx.fillStyle = C.paper; ctx.fillRect(0,0,w,H); ctx.setLineDash([]);
      if (kind === 'A') drawA(s, w, PAD, inner); else drawB(s, w, PAD, inner);
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

  mount('v1863a', STEPS_A, 'A');
  mount('v1863b', STEPS_B, 'B');
})();
