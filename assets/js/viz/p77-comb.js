/* ============================================================
   P77 · Combinations — 回溯 · 不剪枝 vs 剪枝 · viz(兩個動畫)
     v77a:不剪枝(15 次呼叫,5 條死路)
       if (path.size() == k) { ans.push_back(path); return; }
       for (int i = s; i <= n; i++) { path.push_back(i); dfs(..., i + 1); path.pop_back(); }
     v77b:剪枝(10 次呼叫)
       int need = k - path.size();
       for (int i = s; i <= n - need + 1; i++) { ... }
   n = 4, k = 3 → [[1,2,3],[1,2,4],[1,3,4],[2,3,4]](g++ 實跑 trace,見 FACTS)
     死路:[1,4]、[2,4]、[3,4]、[3]、[4] —— 永遠湊不到 3 個
   兩個動畫用同一棵樹的座標,方便對照;b 的 5 個死路畫成虛線鬼影 + ✂。
   BAND 1 遞迴樹(節點 = path + s / 迴圈範圍)
   BAND 2 數字 1..4 + 這層迴圈範圍(b:被剪掉的部分深紅刪除線)
   BAND 3 ans(4 格)/ BAND 4 這一步
   前綴 v77a- / v77b- 。
   ============================================================ */
(function () {
  const C = { paper:'#ffffff', ink:'#1f1f1f', dim:'#5a5a5a', off:'#cfcfcf',
    up:'#e3edf5', low:'#f6ead8',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424',
    good:'#d9e8c7', bad:'#f0d4d4', deep:'#a31d1d' };
  const MONO = '"JetBrains Mono", monospace', SANS = '"Noto Sans TC", sans-serif';
  const N = 4, K = 3;

  /* 樹:依不剪枝的呼叫順序(#1..#15)。px = 620px 設計寬度下的中心 x */
  const T = [
    { path:[],      par:-1, lvl:0, px:400 },
    { path:[1],     par:0,  lvl:1, px:140 },
    { path:[1,2],   par:1,  lvl:2, px:50  },
    { path:[1,2,3], par:2,  lvl:3, px:40  },
    { path:[1,2,4], par:2,  lvl:3, px:122 },
    { path:[1,3],   par:1,  lvl:2, px:140 },
    { path:[1,3,4], par:5,  lvl:3, px:204 },
    { path:[1,4],   par:1,  lvl:2, px:230 },
    { path:[2],     par:0,  lvl:1, px:375 },
    { path:[2,3],   par:8,  lvl:2, px:330 },
    { path:[2,3,4], par:9,  lvl:3, px:330 },
    { path:[2,4],   par:8,  lvl:2, px:420 },
    { path:[3],     par:0,  lvl:1, px:490 },
    { path:[3,4],   par:12, lvl:2, px:520 },
    { path:[4],     par:0,  lvl:1, px:578 },
  ];
  T.forEach(n => {
    const sz = n.path.length;
    n.s = sz ? n.path[sz - 1] + 1 : 1;              // 下一層從 s 開始
    n.add = sz ? n.path[sz - 1] : null;
    n.ans = sz === K;
    n.need = K - sz;
    n.left = Math.max(0, N - n.s + 1);               // 還剩幾個數可選
    n.dead = !n.ans && n.left < n.need;              // 永遠湊不到 K 個
    n.hi = N - n.need + 1;                            // 剪枝後的上界
  });
  // b:被剪掉的節點 → 是在哪個「活著的」祖先的迴圈被剪的
  T.forEach(n => { if (n.dead) { let p = n.par; while (T[p].dead) p = T[p].par; n.cutBy = p; } });
  const ORDER_A = T.map((_, i) => i);
  const ORDER_B = ORDER_A.filter(i => !T[i].dead);
  const DEADS = T.filter(n => n.dead).length;
  const ps = p => '[' + p.join(',') + ']';
  const rng = (a, b) => { const r = []; for (let i = a; i <= b; i++) r.push(i); return r; };

  /* ---------------- 步驟文字 ---------------- */
  const LA = {
    0:'<strong>#1 · [] · s = 1</strong> · size 0 &lt; 3,迴圈 <code>i = 1..4</code>:四個孩子 [1]、[2]、[3]、[4] <b>全部都會呼叫</b>。',
    1:'<strong>#2 · [1] · s = 2</strong> · 迴圈 <code>i = 2..4</code> → [1,2]、[1,3]、[1,4]。',
    2:'<strong>#3 · [1,2] · s = 3</strong> · 還差 1 個,迴圈 <code>i = 3..4</code>。',
    3:'<strong>#4 · [1,2,3] ✓</strong> · <code>size == 3</code> → <b>ans 收下</b>,return。',
    4:'<strong>#5 · [1,2,4] ✓</strong> · 回 [1,2] 的 <code>i = 4</code>。size 3 → 收,return。',
    5:'<strong>#6 · [1,3] · s = 4</strong> · 迴圈只剩 <code>i = 4</code>。',
    6:'<strong>#7 · [1,3,4] ✓</strong> · size 3 → 收。',
    7:'<strong>#8 · [1,4] · 死路</strong> · 還差 1 個,但 <code>s = 5</code>:<b>只剩 0 個數</b>,迴圈 <code>i = 5..4</code> 是空的 → 白白呼叫一次就 return。',
    8:'<strong>#9 · [2] · s = 3</strong> · 回到根的 <code>i = 2</code>。迴圈 <code>i = 3..4</code>。',
    9:'<strong>#10 · [2,3] · s = 4</strong> · 迴圈 <code>i = 4..4</code>。',
    10:'<strong>#11 · [2,3,4] ✓</strong> · size 3 → 收。第 4 個、也是最後一個答案。',
    11:'<strong>#12 · [2,4] · 死路</strong> · 還差 1 個,<code>s = 5</code> 只剩 0 個數 → 空迴圈 return。',
    12:'<strong>#13 · [3] · s = 4 · 死路</strong> · 還差 2 個,但只剩 <b>1 個數(4)</b>。迴圈還是會跑 <code>i = 4</code>,往下再浪費一次。',
    13:'<strong>#14 · [3,4] · 死路</strong> · 還差 1 個,<code>s = 5</code> 只剩 0 個數 → return。',
    14:'<strong>#15 · [4] · 死路</strong> · 還差 2 個,<code>s = 5</code> 只剩 0 個數 → return。整棵樹走完。',
  };
  const LB = {   // key = T 的 id(死路沒有)
    0:'<strong>#1 · [] · need 3</strong> · 上界 <code>4 − 3 + 1 = 2</code>:迴圈只跑 <code>i = 1..2</code>。<b>i = 3、4 直接剪掉</b> —— 從 3 開始只剩 3,4 兩個數,湊不到 3 個。[3]、[4]、[3,4] 都不會被呼叫。',
    1:'<strong>#2 · [1] · need 2</strong> · 上界 <code>4 − 2 + 1 = 3</code>:<code>i = 2..3</code>,<b>剪掉 i = 4</b>(選了 4 之後後面沒數了)→ [1,4] 不呼叫。',
    2:'<strong>#3 · [1,2] · need 1</strong> · 上界 <code>4 − 1 + 1 = 4</code>:<code>i = 3..4</code>,沒有剪。',
    3:'<strong>#4 · [1,2,3] ✓</strong> · size 3 → 收,return。',
    4:'<strong>#5 · [1,2,4] ✓</strong> · size 3 → 收。',
    5:'<strong>#6 · [1,3] · need 1</strong> · 上界 4:<code>i = 4..4</code>。',
    6:'<strong>#7 · [1,3,4] ✓</strong> · size 3 → 收。[1] 的迴圈到 3 就停,不會去 [1,4]。',
    8:'<strong>#8 · [2] · need 2</strong> · 上界 3:<code>i = 3..3</code>,<b>剪掉 i = 4</b> → [2,4] 不呼叫。',
    9:'<strong>#9 · [2,3] · need 1</strong> · 上界 4:<code>i = 4..4</code>。',
    10:'<strong>#10 · [2,3,4] ✓</strong> · size 3 → 收。根的迴圈只到 2,整棵樹走完。',
  };

  function buildSteps(order, labels, intro, done) {
    const st = [{ seen:new Set(), cur:-1, text:intro }];
    order.forEach((id, k) => st.push({ seen:new Set(order.slice(0, k + 1)), cur:id, text:labels[id] }));
    st.push({ seen:new Set(order), cur:-1, text:done, final:true });
    return st;
  }
  const STEPS_A = buildSteps(ORDER_A, LA,
    '<strong>INITIAL</strong> · <code>n = 4, k = 3</code>。不剪枝:迴圈一律跑到 <code>i = n</code>。每個節點 = 一次 dfs,寫著 path 和 s(下一個數從 s 開始)。<b>注意那些「數不夠了」還被呼叫的節點</b> —— 深紅 = 死路。',
    '<strong>完成 · 4 個答案</strong> · 15 次呼叫裡 <b>5 次是死路</b>([1,4]、[2,4]、[3]、[3,4]、[4]):剩下的數不夠湊滿 k 個,呼叫了也只是空轉。下一個動畫把它們在父節點的迴圈就剪掉。');
  const STEPS_B = buildSteps(ORDER_B, LB,
    '<strong>INITIAL</strong> · 同一棵樹,剪枝版:<code>need = k − path.size()</code>,迴圈只跑到 <code>n − need + 1</code> —— 從 i 開始還有 <code>n − i + 1</code> 個數,至少要 need 個。虛線鬼影 = 不剪枝時的 5 條死路。',
    '<strong>完成 · 4 個答案,10 次呼叫</strong> · 5 條死路全在父節點的迴圈上界就被擋掉:根剪 3、4,[1] 剪 4,[2] 剪 4。<b>答案一樣,呼叫少了 1/3</b>;k 越接近 n 省越多。');

  function mount(prefix, steps) {
    const canvas = document.getElementById(prefix + '-canvas');
    if (!canvas) return;
    const PR = steps === STEPS_B;                       // 剪枝版?
    const TOTAL = PR ? ORDER_B.length : ORDER_A.length;
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

    function draw(){
      fit();
      const s = steps[step], w = canvas.clientWidth, H = canvas.clientHeight, PAD = 22, inner = w - 2*PAD;
      ctx.fillStyle = C.paper; ctx.fillRect(0,0,w,H); ctx.setLineDash([]);
      const node = s.cur >= 0 ? T[s.cur] : null;
      const onPath = new Set(); for (let v = s.cur; v >= 0; v = T[v].par) onPath.add(v);
      const seen = id => s.seen.has(id);
      const cut = id => PR && T[id].dead && s.seen.has(T[id].cutBy);      // 已在父迴圈被剪
      const nCalls = s.seen.size, nDead = [...s.seen].filter(id => T[id].dead).length;

      /* ---- BAND 1 · 遞迴樹 ---- */
      head(PR ? 'BAND 1 · 遞迴樹   紅 = 目前   綠 ✓ = 答案   深紅 ✂ = 剪掉(不呼叫)   虛線 = 還沒'
              : 'BAND 1 · 遞迴樹   紅 = 目前   綠 ✓ = 答案   深紅 ✕ = 死路   虛線 = 還沒', PAD, 16);
      const X = px => px * w / 620;
      const TOP = [30, 120, 194, 268], NW = 70, NH = 38;
      const TL = n => n.lvl === 1 ? 0.65 : 0.55;
      const sib = n => T.filter(m => m.par === n.par).indexOf(n), nsib = n => T.filter(m => m.par === n.par).length;
      const sx = n => { const p = T[n.par]; return cx(p) + (n.lvl === 1 ? (sib(n) - (nsib(n) - 1)/2) * 16 : 0); };
      const cx = n => X(n.px), top = n => TOP[n.lvl], bot = n => TOP[n.lvl] + NH;
      // 邊
      T.forEach((n, id) => {
        if (n.par < 0) return;
        const p = T[n.par];
        let col = seen(id) ? C.ink : C.off, lw = 1.4, dash = seen(id) ? null : [4,4];
        if (cut(id)) { col = C.deep; lw = 1.2; dash = [2,4]; }
        else if (seen(id) && n.dead) col = C.deep;
        if (onPath.has(id)) { col = n.dead ? C.deep : C.curS; lw = 2.6; dash = null; }
        line(sx(n), bot(p), cx(n), top(n), col, lw, dash);
      });
      // 邊標籤 +i
      T.forEach((n, id) => {
        if (n.par < 0) return;
        const p = T[n.par];
        const mx = sx(n) + (cx(n) - sx(n)) * TL(n), my = bot(p) + (top(n) - bot(p)) * TL(n);
        const lw = 26, lh = 14, sn = seen(id);
        let fill = C.paper, st = sn ? C.ink : C.off, tc = sn ? C.ink : C.off, bw = 1, dash = sn ? null : [2,2], strike = false;
        if (cut(id)) { st = C.deep; tc = C.deep; dash = null; fill = C.bad; strike = T[n.par].dead === false; }
        else if (sn && n.dead) { st = C.deep; tc = C.deep; }
        if (onPath.has(id)) { fill = n.dead ? C.bad : C.cur; st = n.dead ? C.deep : C.curS; tc = n.dead ? C.deep : C.curT; bw = 1.6; }
        box(mx - lw/2, my - lh/2, lw, lh, fill, st, bw, dash);
        txt('+' + n.add, mx, my + 1, tc, '700 10.5px '+MONO);
        if (strike) line(mx - lw/2 + 3, my, mx + lw/2 - 3, my, C.deep, 1.3);
      });
      // 節點
      T.forEach((n, id) => {
        const x = cx(n), y = top(n), sn = seen(id), isCur = id === s.cur;
        let fill = C.paper, st = C.off, tc = C.off, sc = C.off, lw = 1.1, dash = [3,3];
        let l1 = ps(n.path), l2 = PR ? (n.ans ? 'need 0' : (n.dead ? '—' : 'i ' + n.s + '..' + n.hi)) : 's=' + n.s;
        if (sn) {
          fill = n.ans ? C.good : (n.dead ? C.bad : C.up); st = n.dead ? C.deep : C.ink;
          tc = n.dead ? C.deep : C.ink; sc = n.dead ? C.deep : C.dim; lw = 1.4; dash = null;
          if (n.ans) { l1 += ' ✓'; l2 = '收'; }
          if (n.dead) l2 = 's=' + n.s + ' 死路';
        }
        if (cut(id)) { st = C.deep; tc = C.off; sc = C.deep; lw = 1.1; dash = [2,3]; l2 = '✂ 剪掉'; }
        if (onPath.has(id) && !isCur) { st = C.curS; lw = 2.2; }
        if (isCur) {
          if (n.dead) { fill = C.bad; st = C.deep; tc = C.deep; sc = C.deep; }
          else if (n.ans) { fill = C.good; st = C.curS; tc = C.ink; sc = C.ink; }
          else { fill = C.cur; st = C.curS; tc = C.curT; sc = C.curT; }
          lw = 2.6;
        }
        box(x - NW/2, y, NW, NH, fill, st, lw, dash);
        txt(l1, x, y + 13, tc, '700 11.5px '+MONO+', '+SANS);
        txt(l2, x, y + 28, sc, '600 10.5px '+MONO+', '+SANS);
      });
      // 右下空位:計數
      const nx = X(386), nw = w - X(8) - nx, ny = TOP[3], nh = NH;
      let nt;
      if (PR) nt = s.final ? '呼叫 10 / 10 · 剪掉 5 個死路' : '呼叫 ' + nCalls + ' / 10 · 剪掉 ' + T.filter((_, id) => cut(id)).length + ' / 5';
      else nt = '呼叫 ' + nCalls + ' / 15 · 其中死路 ' + nDead + ' / 5';
      box(nx, ny, nw, nh, s.final ? C.good : C.paper, s.final ? C.ink : C.off, 1.4, s.final ? null : [3,3]);
      txt(nt, nx + nw/2, ny + nh/2 + 1, s.final ? C.ink : C.dim, '700 12px '+MONO+', '+SANS);

      /* ---- BAND 2 · 1..n + 迴圈範圍 ---- */
      const b2 = 338;
      head(PR ? 'BAND 2 · 1..n   紅 = 迴圈 i = s..n−need+1   深紅刪除線 = 剪掉的 i'
              : 'BAND 2 · 1..n   紅 = 這層迴圈 i = s..n   灰 = 已用過 / 不能選', PAD, b2);
      const cy0 = b2 + 12, ch0 = 30, cw0 = 52, cg0 = 10;
      for (let v = 1; v <= N; v++) {
        const x = PAD + (v - 1)*(cw0 + cg0);
        let fill = C.paper, st = C.ink, tc = C.ink, lw = 1.4, dash = null, strike = false;
        if (node) {
          const hi = PR ? n_hi(node) : N;
          if (node.ans || v < node.s) { st = C.off; tc = C.off; dash = [3,3]; lw = 1.1; }
          else if (v <= hi) { fill = node.dead ? C.bad : C.cur; st = node.dead ? C.deep : C.curS; tc = node.dead ? C.deep : C.curT; lw = 2.4; }
          else { fill = C.bad; st = C.deep; tc = C.deep; lw = 1.6; strike = true; }
        }
        box(x, cy0, cw0, ch0, fill, st, lw, dash);
        txt(String(v), x + cw0/2, cy0 + ch0/2 + 1, tc, '700 15px '+MONO);
        if (strike) line(x + 8, cy0 + ch0/2 + 1, x + cw0 - 8, cy0 + ch0/2 + 1, C.deep, 1.6);
      }
      function n_hi(n){ return Math.min(N, n.hi); }
      const tx = PAD + N*(cw0 + cg0) + 6;
      let lt = PR ? '上界 = n − need + 1:後面至少要留 need 個數' : '迴圈一律跑到 n,不管數夠不夠', lc = C.dim;
      if (node) {
        if (node.ans) { lt = 'size == 3 → 收,不跑迴圈'; lc = C.ink; }
        else if (PR) {
          lt = 'need ' + node.need + ' → i = ' + node.s + '..' + N + '−' + node.need + '+1 = ' + node.s + '..' + node.hi;
          if (node.hi < N) lt += ' · ✂ ' + rng(node.hi + 1, N).join(',');
          lc = C.curT;
        } else if (node.dead) {
          lt = node.s > N ? 's = 5 → 空迴圈 · 只剩 0 個數' : 's = ' + node.s + ' → 只剩 ' + node.left + ' 個數,還差 ' + node.need + ' 個';
          lc = C.deep;
        } else { lt = 's = ' + node.s + ' → for i = ' + node.s + '..' + N; lc = C.curT; }
      } else if (s.final) { lt = PR ? '剪掉 5 次呼叫:15 → 10' : '15 次呼叫,5 次是死路'; lc = C.ink; }
      txt(lt, tx, cy0 + ch0/2 + 1, lc, '700 12px '+MONO+', '+SANS, 'left');

      /* ---- BAND 3 · ans ---- */
      const b3 = 410;
      head('BAND 3 · ans(size == k 才收)', PAD, b3);
      const ay = b3 + 12, ah = 30, ax0 = PAD + 56, sg = 12, sw = Math.min(100, (inner - 56 - 3*sg) / 4);
      txt('ans =', PAD, ay + ah/2 + 1, C.ink, '700 13px '+MONO, 'left');
      const got = (PR ? ORDER_B : ORDER_A).filter(id => seen(id) && T[id].ans);
      for (let j = 0; j < 4; j++) {
        const x = ax0 + j*(sw + sg), id = got[j];
        if (id === undefined) {
          box(x, ay, sw, ah, C.paper, C.off, 1.1, [3,3]);
          txt('—', x + sw/2, ay + ah/2 + 1, C.off, '600 12px '+MONO);
        } else {
          const isCur = id === s.cur;
          box(x, ay, sw, ah, C.good, isCur ? C.curS : C.ink, isCur ? 2.6 : 1.4);
          txt(ps(T[id].path) + ' ✓', x + sw/2, ay + ah/2 + 1, C.ink, '700 12px '+MONO+', '+SANS);
        }
      }

      /* ---- BAND 4 · 這一步 ---- */
      const b4 = 482;
      head('BAND 4 · 這一步', PAD, b4);
      const by = b4 + 12, bh = 32, w1 = Math.round(inner * 0.46), w2 = inner - w1 - 10;
      let t1 = 'dfs(path=[], s=1) 從根開始', t2 = PR ? 'n = 4 · k = 3 · 剪枝' : 'n = 4 · k = 3 · 不剪枝';
      let f2 = C.paper, s2 = C.off, d2 = [3,3], c2 = C.dim, l2 = 1.4;
      if (node) {
        const idx = (PR ? ORDER_B : ORDER_A).indexOf(s.cur) + 1;
        t1 = '#' + idx + ' dfs(path=' + ps(node.path) + ', s=' + node.s + ')';
        d2 = null; l2 = 2.2;
        if (node.ans) { t2 = 'size == 3 → 收 ✓'; f2 = C.good; s2 = C.curS; c2 = C.ink; }
        else if (node.dead) { t2 = '死路:只剩 ' + node.left + ' 個數 / 還差 ' + node.need + ' 個'; f2 = C.bad; s2 = C.deep; c2 = C.deep; }
        else if (PR) {
          t2 = 'need ' + node.need + ' → i = ' + node.s + '..' + node.hi + (node.hi < N ? ' · ✂ ' + rng(node.hi + 1, N).join(',') : '');
          f2 = C.cur; s2 = C.curS; c2 = C.curT;
        } else { t2 = 'size ' + node.path.length + ' < 3 → i = ' + node.s + '..' + N; f2 = C.cur; s2 = C.curS; c2 = C.curT; }
      } else if (s.final) {
        t1 = PR ? '10 次呼叫 · 0 條死路' : '15 次呼叫 · 5 條死路';
        t2 = '4 個答案 · C(4,3) = 4'; f2 = C.good; s2 = C.ink; d2 = null; c2 = C.ink;
      }
      box(PAD, by, w1, bh, C.paper, C.ink, 1.4);
      txt(t1, PAD + 12, by + bh/2 + 1, C.ink, '700 12px '+MONO+', '+SANS, 'left');
      box(PAD + w1 + 10, by, w2, bh, f2, s2, l2, d2);
      txt(t2, PAD + w1 + 10 + w2/2, by + bh/2 + 1, c2, '700 12px '+MONO+', '+SANS);
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

  mount('v77a', STEPS_A);
  mount('v77b', STEPS_B);
})();
