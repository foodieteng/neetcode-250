/* ============================================================
   P90 · Subsets II — 每個節點都是答案 + 同層去重 · viz(兩個動畫)
     v90a:不去重(78 的寫法,8 次呼叫,2 個重複)
       ans.push_back(path);
       for (int i = s; i < nums.size(); i++) { path.push_back(nums[i]); dfs(..., i + 1); path.pop_back(); }
     v90b:同層去重(6 次呼叫,2 次 skip)
       for (...) { if (i > s && nums[i] == nums[i-1]) continue; ... }
   nums = [1,2,2](g++ 實跑 trace,見 FACTS_90)兩個 2 用下標分開:2₁ 2₂ = index 1,2
     a:[] [1] [1,2₁] [1,2₁,2₂] [1,2₂]✕ [2₁] [2₁,2₂] [2₂]✕  —— ✕ = 重複
     b:[] [1] [1,2₁] [1,2₁,2₂] skip@[1] [2₁] [2₁,2₂] skip@根
   兩個動畫用同一棵樹的座標;b 把 a 的兩個重複畫成灰虛線鬼影「2₂ 同層 skip」。
   BAND 1 子集樹 / BAND 2 nums + 這一步所在的迴圈 + path / BAND 3 ans / BAND 4 這一步
   前綴 v90a- / v90b- 。
   ============================================================ */
(function () {
  const C = { paper:'#ffffff', ink:'#1f1f1f', dim:'#5a5a5a', off:'#cfcfcf',
    up:'#e3edf5', low:'#f6ead8',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424',
    good:'#d9e8c7', bad:'#f0d4d4', deep:'#a31d1d', gray:'#ececec' };
  const MONO = '"JetBrains Mono", monospace', SANS = '"Noto Sans TC", sans-serif';
  const NUMS = [1, 2, 2], N = 3;
  const NAME = ['1', '2₁', '2₂'];

  /* 樹(依不去重的呼叫順序 #1..#8)。idx = path 用到的 index;via = 從父迴圈哪個 i 長出來;
     dup = 值和前面某個節點一樣(a 會重複收、b 會被同層 skip 擋掉) */
  const T = [
    { idx:[],      par:-1, lvl:0, px:320 },
    { idx:[0],     par:0,  lvl:1, px:130 },
    { idx:[0,1],   par:1,  lvl:2, px:66  },
    { idx:[0,1,2], par:2,  lvl:3, px:66  },
    { idx:[0,2],   par:1,  lvl:2, px:198, dup:2 },
    { idx:[1],     par:0,  lvl:1, px:360 },
    { idx:[1,2],   par:5,  lvl:2, px:360 },
    { idx:[2],     par:0,  lvl:1, px:536, dup:5 },
  ];
  T.forEach(n => {
    const k = n.idx.length;
    n.s = k ? n.idx[k - 1] + 1 : 0;
    n.via = k ? n.idx[k - 1] : null;
    n.name = '[' + n.idx.map(i => NAME[i]).join(',') + ']';
    n.val = '[' + n.idx.map(i => NUMS[i]).join(',') + ']';
  });
  const DEEPER = 3;                                    // [1,2₁] → [1,2₁,2₂]:不同層,可以

  /* 事件:{ k:'call'|'skip', id:樹節點, no:呼叫編號 } */
  const EV_A = T.map((_, id) => ({ k:'call', id, no:id + 1 }));
  const EV_B = [];
  { let no = 0; [0,1,2,3,4,5,6,7].forEach(id => EV_B.push(T[id].dup != null ? { k:'skip', id } : { k:'call', id, no:++no })); }

  const LA = [
    '<strong>#1 · [] · s = 0</strong> · 第一行就 <code>ans.push_back(path)</code> → 收 <code>[]</code>。迴圈 <code>i = 0..2</code>:1、2₁、2₂ <b>三個都會往下長</b>。',
    '<strong>#2 · [1] · s = 1</strong> · 根的 <code>i = 0</code>。收 <code>[1]</code>;迴圈 <code>i = 1..2</code>。',
    '<strong>#3 · [1,2₁] · s = 2</strong> · [1] 的 <code>i = 1</code>。收 <code>[1,2]</code>。',
    '<strong>#4 · [1,2₁,2₂] · s = 3</strong> · [1,2₁] 的 <code>i = 2</code>。收 <code>[1,2,2]</code>;<code>s = 3</code> 迴圈是空的 → return。',
    '<strong>#5 · [1,2₂] · 重複</strong> · 回到 [1] 的 <code>i = 2</code>:這次用 2₂ 接在 1 後面。值是 <code>[1,2]</code> —— <b>和 #3 一模一樣</b>,ans 收到第二個 [1,2]。',
    '<strong>#6 · [2₁] · s = 2</strong> · 根的 <code>i = 1</code>。收 <code>[2]</code>。',
    '<strong>#7 · [2₁,2₂] · s = 3</strong> · [2₁] 的 <code>i = 2</code>。收 <code>[2,2]</code>,return。',
    '<strong>#8 · [2₂] · 重複</strong> · 根的 <code>i = 2</code>:又用 2₂ 當第一個數。值是 <code>[2]</code> —— <b>和 #6 重複</b>。整棵樹走完。',
  ];
  const LB = [
    '<strong>#1 · [] · s = 0</strong> · 收 <code>[]</code>。迴圈 <code>i = 0..2</code>。',
    '<strong>#2 · [1] · s = 1</strong> · 根的 <code>i = 0</code>:<code>i == s</code>,不用比前一個。收 <code>[1]</code>。',
    '<strong>#3 · [1,2₁] · s = 2</strong> · [1] 的 <code>i = 1</code>:<code>i == s</code> → 不比。收 <code>[1,2]</code>。',
    '<strong>#4 · [1,2₁,2₂] · s = 3</strong> · [1,2₁] 的 <code>i = 2</code>:2₂ 和 2₁ 同值,但 <code>i == s = 2</code> → <b>不同層:可以</b>。2₁ 是上一層拿的,2₂ 是這一層迴圈的第一個。收 <code>[1,2,2]</code>。',
    '<strong>skip · 在 [1]</strong> · <code>i = 2</code>(2₂):<code>2 &gt; s = 1</code> 且 <code>nums[2] == nums[1]</code> → <b>continue</b>。[1] 這層已經用 2₁ 開過頭,再用 2₂ 只會長出一樣的 <code>[1,2]</code>(= 上一個動畫的 #5)。',
    '<strong>#5 · [2₁] · s = 2</strong> · 根的 <code>i = 1</code>:<code>i &gt; s</code>,但 <code>nums[1] = 2 ≠ nums[0] = 1</code> → 不是重複。收 <code>[2]</code>。',
    '<strong>#6 · [2₁,2₂] · s = 3</strong> · [2₁] 的 <code>i = 2</code>:<code>i == s</code> → 又是<b>不同層</b>,可以拿。收 <code>[2,2]</code>,return。',
    '<strong>skip · 在根</strong> · <code>i = 2</code>(2₂):<code>2 &gt; s = 0</code> 且和 2₁ 同值 → continue。「第一個數是 2」已經由 2₁ 整棵試完,再開一次只會重複 <code>[2]</code>(= 上一個動畫的 #8)。',
  ];

  function build(dedupe) {
    const EV = dedupe ? EV_B : EV_A, LBL = dedupe ? LB : LA;
    const st = [{ vis:0, cur:-1, text: dedupe
      ? '<strong>INITIAL · 同層去重</strong> · 一樣是 <code>[1,2₁,2₂]</code>,迴圈多一行 <code>if (i &gt; s &amp;&amp; nums[i] == nums[i−1]) continue;</code>:<b>同一層迴圈裡,相同的值只讓第一個開頭</b>。樹的位置和上一個動畫一樣,方便對照。'
      : '<strong>INITIAL · 不去重</strong> · <code>nums = [1,2,2]</code>(已排序),兩個 2 用下標分開:2₁ 2₂(= index 1,2)。先照 78 的寫法跑:<b>每個節點都 <code>ans.push_back(path)</code></b>,迴圈 <code>i = s..2</code> 每個都往下長。' }];
    EV.forEach((e, k) => st.push({ vis:k + 1, cur:k, text:LBL[k] }));
    st.push({ vis:EV.length, cur:-1, text: dedupe
      ? '<strong>完成 · ans = [[],[1],[1,2],[1,2,2],[2],[2,2]]</strong> · 6 次呼叫、2 次同層 skip,6 個全部不同。被 skip 的正好是上一個動畫的兩個重複 #5 [1,2₂]、#8 [2₂];不同層的 [1,2₁,2₂]、[2₁,2₂] 照樣收。寫成 <code>i &gt; 0</code> 會連不同層也擋掉([1,1] 會只剩 <code>[[],[1]]</code>)。'
      : '<strong>完成 · 8 個,其中 2 個重複</strong> · <code>[1,2]</code>、<code>[2]</code> 各出現兩次。兩個重複都長在<b>同一層迴圈的第二個 2</b>:[1] 的迴圈先用 2₁、再用 2₂;根的迴圈也一樣。→ 下一個動畫把「同層的第二個 2」擋掉。' });
    st.EV = EV; st.dedupe = dedupe;
    return st;
  }
  const STEPS_A = build(false), STEPS_B = build(true);

  function mount(prefix, steps) {
    const canvas = document.getElementById(prefix + '-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const EV = steps.EV, DD = steps.dedupe;
    const stepEl = document.getElementById(prefix + '-step'), labelEl = document.getElementById(prefix + '-label');
    const bPrev = document.getElementById(prefix + '-prev'), bNext = document.getElementById(prefix + '-next'),
          bPlay = document.getElementById(prefix + '-play'), bReset = document.getElementById(prefix + '-reset');
    let step = 0, timer = null;
    const evOf = id => EV.findIndex(e => e.id === id);          // 樹節點 → 第幾個事件
    const CALLS = EV.filter(e => e.k === 'call').length;

    function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
      const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||340; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
      if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
    function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
    function box(x,y,w,h,fill,stroke,lw,dash){ rr(x,y,w,h,5); ctx.fillStyle=fill; ctx.fill(); ctx.lineWidth=lw||1.4; if(dash) ctx.setLineDash(dash); ctx.strokeStyle=stroke; ctx.stroke(); ctx.setLineDash([]); }
    function txt(s,x,y,color,font,align,base){ ctx.fillStyle=color; ctx.font=font; ctx.textAlign=align||'center'; ctx.textBaseline=base||'middle'; ctx.fillText(s,x,y); }
    function head(s,x,y){ txt(s,x,y,C.dim,'600 12px '+MONO+', '+SANS,'left','alphabetic'); }
    function line(x1,y1,x2,y2,color,lw,dash){ ctx.strokeStyle=color; ctx.lineWidth=lw; if(dash) ctx.setLineDash(dash); ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); ctx.setLineDash([]); }
    const F = (wt, sz) => wt + ' ' + sz + 'px ' + MONO + ', ' + SANS;

    function draw(){
      fit();
      const s = steps[step], w = canvas.clientWidth, H = canvas.clientHeight, PAD = 22, inner = w - 2*PAD;
      ctx.fillStyle = C.paper; ctx.fillRect(0,0,w,H); ctx.setLineDash([]);
      const final = s.cur < 0 && s.vis === EV.length;
      const ev = s.cur >= 0 ? EV[s.cur] : null;
      const node = ev ? T[ev.id] : null;
      const callId = ev ? (ev.k === 'call' ? ev.id : node.par) : -1;   // 目前在跑的那一層 dfs
      const onPath = new Set(); for (let v = callId; v >= 0; v = T[v].par) onPath.add(v);
      const seen = id => evOf(id) < s.vis;
      const isCur = id => ev && ev.id === id;
      const isSkip = id => DD && T[id].dup != null;
      const done = EV.slice(0, s.vis);
      const nCalls = done.filter(e => e.k === 'call').length;
      const nSkip = done.filter(e => e.k === 'skip').length;
      const nDup = DD ? 0 : done.filter(e => T[e.id].dup != null).length;

      /* ---- BAND 1 · 子集樹 ---- */
      head(DD ? 'BAND 1 · 子集樹(每個節點都進 ans)  紅 = 目前   灰虛線 = 同層 skip'
              : 'BAND 1 · 子集樹(每個節點都進 ans)  紅 = 目前   深紅 = 重複', PAD, 16);
      const L = 14, X = px => L + (px - L) * (w - 2*L) / (620 - 2*L);
      const TOP = [30, 100, 170, 240], NW = 84, NH = 36, TL = 0.55;
      const cx = n => X(n.px), top = n => TOP[n.lvl], bot = n => top(n) + NH;
      // 邊
      T.forEach((n, id) => {
        if (n.par < 0) return;
        const p = T[n.par], sn = seen(id);
        let col = sn ? C.ink : C.off, lw = 1.4, dash = sn ? null : [4,4];
        if (isSkip(id)) { col = sn ? C.dim : C.off; dash = [2,4]; lw = isCur(id) ? 2 : 1.2; }
        else if (onPath.has(id)) { col = C.curS; lw = 2.6; }
        else if (sn && n.dup != null) { col = C.deep; }
        line(cx(p), bot(p), cx(n), top(n), col, lw, dash);
      });
      // 邊標籤 +2₁(skip 沒有標籤:它根本沒走下去)
      T.forEach((n, id) => {
        if (n.par < 0 || isSkip(id)) return;
        const p = T[n.par];
        const mx = cx(p) + (cx(n) - cx(p)) * TL, my = bot(p) + (top(n) - bot(p)) * TL;
        const lw = 30, lh = 15, sn = seen(id);
        let fill = C.paper, st = sn ? C.ink : C.off, tc = sn ? C.ink : C.off, bw = 1, dash = sn ? null : [2,2];
        if (onPath.has(id)) { fill = C.cur; st = C.curS; tc = C.curT; bw = 1.6; }
        else if (sn && n.dup != null) { st = C.deep; tc = C.deep; }
        box(mx - lw/2, my - lh/2, lw, lh, fill, st, bw, dash);
        txt('+' + NAME[n.via], mx, my + 1, tc, F(700, 10.5));
      });
      // 節點 / skip 鬼影
      T.forEach((n, id) => {
        const x = cx(n), y = top(n), sn = seen(id), cu = isCur(id);
        if (isSkip(id)) {
          let fill = C.paper, st = C.off, tc = C.off, nc = C.off, lw = 1.1, dash = [3,3];
          if (sn) { st = C.dim; tc = C.dim; nc = C.dim; lw = 1.3; }
          if (cu) { fill = C.gray; tc = C.ink; nc = C.ink; lw = 2.2; dash = [5,3]; }
          box(x - NW/2, y, NW, NH, fill, st, lw, dash);
          txt('2₂ 同層 skip', x, y + 12, tc, F(700, 10.5));
          txt('會重複 ' + n.val, x, y + 26, nc, F(600, 10));
          return;
        }
        const dupA = !DD && n.dup != null;
        const no = sn ? EV[evOf(id)].no : null;
        let fill = C.paper, st = C.off, tc = C.off, lw = 1.1, dash = [3,3], sc = C.off;
        if (sn) { fill = dupA ? C.bad : C.good; st = dupA ? C.deep : C.ink; tc = dupA ? C.deep : C.ink; sc = dupA ? C.deep : C.dim; lw = 1.4; dash = null; }
        if (onPath.has(id) && !cu) { st = C.curS; lw = 2.2; }
        if (cu) { fill = dupA ? C.bad : C.cur; st = C.curS; tc = dupA ? C.deep : C.curT; sc = tc; lw = 2.6; }
        box(x - NW/2, y, NW, NH, fill, st, lw, dash);
        txt(n.name, x, y + 12, tc, F(700, 11.5));
        txt((sn ? '#' + no + ' · ' : '') + 's=' + n.s, x, y + 27, sc, F(600, 10));
        // a:重複標記
        if (dupA && sn) {
          const pw = 104, ph = 18, py = y + NH + 8;
          box(x - pw/2, py, pw, ph, cu ? C.bad : C.paper, C.deep, cu ? 2 : 1.3);
          txt('= ' + n.val + ' 重複', x, py + ph/2 + 1, C.deep, F(700, 10.5));
        }
      });
      // b:[1,2₁,2₂] 下方「不同層:可以」
      if (DD) {
        const n = T[DEEPER], sn = seen(DEEPER), cu = isCur(DEEPER);
        const pw = 128, ph = 20, px0 = cx(n) - NW/2, py = top(n) + NH + 10;
        if (sn) {
          box(px0, py, pw, ph, cu ? C.cur : C.paper, C.curS, cu ? 2 : 1.2);
          txt('2₁→2₂ 不同層:可以', px0 + pw/2, py + ph/2 + 1, C.curT, F(700, 11));
        } else {
          box(px0, py, pw, ph, C.paper, C.off, 1, [3,3]);
          txt('2₁→2₂ ?', px0 + pw/2, py + ph/2 + 1, C.off, F(700, 11));
        }
      }
      // 右下空位:計數
      {
        const nx = X(420), nw = w - L - nx, ny = TOP[3], nh = NH;
        box(nx, ny, nw, nh, final ? (DD ? C.good : C.bad) : C.paper, final ? (DD ? C.ink : C.deep) : C.off, 1.4, final ? null : [3,3]);
        const ncol = final ? (DD ? C.ink : C.deep) : C.dim;
        txt('呼叫 ' + nCalls + ' / ' + CALLS + ' · ans ' + nCalls + ' 個', nx + nw/2, ny + 12, ncol, F(700, 11));
        txt(DD ? '同層 skip ' + nSkip + ' / 2 · 重複 0' : '重複 ' + nDup + ' / 2', nx + nw/2, ny + 27, ncol, F(700, 11));
      }

      /* ---- BAND 2 · nums + 這一步所在的迴圈 + path ---- */
      const b2 = 332;
      head('BAND 2 · nums   紅 = 這次的 i   藍 = 這層試過' + (DD ? '   灰 = skip' : '') + '   淡灰 = i < s', PAD, b2);
      const cy0 = b2 + 14, ch0 = 30, cw0 = 64, cg0 = 10, ty = cy0 + ch0 + 19;
      // 這一步發生在哪個迴圈:呼叫 → 父迴圈的 i = via(根 → 自己的迴圈);skip → 父迴圈
      const loopId = ev ? (node.par >= 0 ? node.par : 0) : -1;
      const L0 = loopId >= 0 ? T[loopId] : null;
      const stI = {};
      if (ev && node.par >= 0) {
        EV.forEach((e, k) => {
          if (k > s.cur || T[e.id].par !== loopId) return;
          stI[T[e.id].via] = k === s.cur ? (e.k === 'skip' ? 'skipNow' : 'now') : (e.k === 'skip' ? 'skip' : 'took');
        });
      }
      for (let i = 0; i < N; i++) {
        const x = PAD + i*(cw0 + cg0);
        let fill = C.paper, sk = C.ink, tc = C.ink, ic = C.dim, lw = 1.4, dash = null, tag = '', tgc = C.dim;
        if (ev && node.par < 0) { fill = C.cur; sk = C.curS; tc = C.curT; ic = C.curT; lw = 2.2; if (i === 0) { tag = '↑ i 從 s'; tgc = C.curT; } }
        else if (ev) {
          const k = stI[i];
          if (i < L0.s) { sk = C.off; tc = C.off; ic = C.off; dash = [3,3]; lw = 1.1; }
          else if (k === 'now') { fill = (!DD && node.dup != null) ? C.bad : C.cur; sk = C.curS; tc = C.curT; ic = C.curT; lw = 2.6; tag = 'i = ' + i; tgc = C.curT; }
          else if (k === 'took') { fill = C.up; tag = '試過'; }
          else if (k === 'skip' || k === 'skipNow') {
            fill = C.gray; sk = C.dim; tc = C.dim; ic = C.dim; dash = [4,3]; lw = k === 'skipNow' ? 2.2 : 1.3;
            tag = 'skip'; tgc = k === 'skipNow' ? C.ink : C.dim;
          }
        }
        box(x, cy0, cw0, ch0, fill, sk, lw, dash);
        txt('[' + i + ']', x + 8, cy0 + ch0/2 + 1, ic, '600 11px '+MONO, 'left');
        txt(NAME[i], x + cw0 - 9, cy0 + ch0/2 + 1, tc, F(700, 15), 'right');
        if (tag) txt(tag, (tag[0] === '↑') ? x : x + cw0/2, ty, tgc, F(700, 11), (tag[0] === '↑') ? 'left' : 'center');
      }
      // path 方塊 + 迴圈說明
      const px1 = PAD + N*(cw0 + cg0) + 8, pw1 = w - PAD - px1;
      const curPath = ev ? (ev.k === 'call' ? node : T[node.par]) : null;
      box(px1, cy0, pw1, ch0, ev ? (ev.k === 'call' ? C.cur : C.paper) : C.paper, ev ? (ev.k === 'call' ? C.curS : C.ink) : C.off, ev && ev.k === 'call' ? 2 : 1.4, ev ? null : [3,3]);
      txt('path = ' + (curPath ? curPath.name : (final ? '[]' : '[]')), px1 + 12, cy0 + ch0/2 + 1, ev && ev.k === 'call' ? C.curT : C.ink, F(700, 13), 'left');
      txt('值 ' + (curPath ? curPath.val : '[]'), px1 + pw1 - 12, cy0 + ch0/2 + 1, C.dim, F(600, 11.5), 'right');
      let lt = '排序後相同的數排在一起', lc = C.dim;
      if (ev && node.par < 0) { lt = '根 · for i = 0..2'; lc = C.curT; }
      else if (ev && ev.k === 'skip') { lt = '在 ' + L0.name + ' 的迴圈:i = 2 > s 且同值 → skip'; lc = C.ink; }
      else if (ev) { lt = '在 ' + L0.name + ' 的迴圈 i = ' + L0.s + '..2 · 選 ' + NAME[node.via]; lc = C.curT; }
      else if (final) { lt = DD ? '同層 skip 2 次 · 不同層照拿' : '每個 i 都往下長 → 2 個重複'; lc = C.ink; }
      txt(lt, px1, ty, lc, F(700, 11.5), 'left');

      /* ---- BAND 3 · ans ---- */
      const b3 = 424;
      head(DD ? 'BAND 3 · ans(6 格)  紅框 = 這一步收的' : 'BAND 3 · ans(8 格)  紅框 = 這一步收的   深紅 = 重複', PAD, b3);
      const ay = b3 + 14, ah = 30, SLOTS = 8, ag = 8, aw = (inner - ag*(SLOTS - 1)) / SLOTS;
      const got = EV.slice(0, s.vis).map((e, k) => ({ e, k })).filter(o => o.e.k === 'call');
      for (let k = 0; k < CALLS; k++) {
        const ax = PAD + k*(aw + ag), o = got[k];
        if (!o) { box(ax, ay, aw, ah, C.paper, C.off, 1, [3,3]); continue; }
        const n = T[o.e.id], dupA = !DD && n.dup != null, cu = o.k === s.cur;
        box(ax, ay, aw, ah, dupA ? C.bad : C.good, cu ? C.curS : (dupA ? C.deep : C.ink), cu ? 2.6 : 1.4);
        txt(n.val, ax + aw/2, ay + ah/2 + 1, dupA ? C.deep : C.ink, F(700, 12));
        if (dupA) txt('重複', ax + aw/2, ay + ah + 13, C.deep, F(700, 11));
      }
      if (DD) {
        const rx = PAD + CALLS*(aw + ag);
        txt(final ? '6 個,全部不同' : '少 2 格:重複的沒長出來', w - PAD, ay + ah/2 + 1, final ? C.ink : C.dim, F(700, 11.5), 'right');
        void rx;
      }

      /* ---- BAND 4 · 這一步 ---- */
      const b4 = 510;
      head(DD ? 'BAND 4 · 這一步   if (i > s && nums[i] == nums[i−1]) continue' : 'BAND 4 · 這一步   ans.push_back(path) → for i = s..2', PAD, b4);
      const by = b4 + 12, bh = 32, w1 = Math.round(inner * 0.46), w2 = inner - w1 - 10;
      let t1 = 'dfs(path=[], s=0) 從根開始', t2 = DD ? '同層同值只留第一個' : '不去重:每個 i 都長', f2 = C.paper, s2 = C.off, d2 = [3,3], c2 = C.dim, l2 = 1.4;
      if (ev && ev.k === 'call') {
        t1 = '#' + ev.no + ' dfs(' + node.name + ', s=' + node.s + ')';
        const dupA = !DD && node.dup != null;
        if (node.par < 0) t2 = '收 [] → for i = 0..2';
        else if (dupA) t2 = '收 ' + node.val + ' · 和 #' + (node.dup + 1) + ' 重複';
        else if (DD) {
          const p = T[node.par], i = node.via;
          t2 = (i === p.s ? 'i == s → 不比' : 'i > s, ' + NUMS[i] + ' ≠ ' + NUMS[i-1]) + ' · 收 ' + node.val;
        } else t2 = '收 ' + node.val + (node.s >= N ? ' · 迴圈空 → return' : ' → for i = ' + node.s + '..2');
        f2 = dupA ? C.bad : C.cur; s2 = dupA ? C.deep : C.curS; d2 = null; c2 = dupA ? C.deep : C.curT; l2 = 2.2;
      } else if (ev) {
        const p = T[node.par];
        t1 = '在 ' + p.name + ' 的迴圈 · s = ' + p.s;
        t2 = 'i = 2 > ' + p.s + ' 且 2₂ == 2₁ → continue';
        f2 = C.gray; s2 = C.dim; d2 = [5,3]; c2 = C.ink; l2 = 2;
      } else if (final) {
        t1 = DD ? '6 次呼叫 · 2 次 skip' : '8 次呼叫 · 8 個進 ans';
        t2 = DD ? '6 個子集,沒有重複' : '[1,2]、[2] 各 2 次';
        f2 = DD ? C.good : C.bad; s2 = DD ? C.ink : C.deep; d2 = null; c2 = DD ? C.ink : C.deep;
      }
      box(PAD, by, w1, bh, C.paper, C.ink, 1.4);
      txt(t1, PAD + 12, by + bh/2 + 1, C.ink, F(700, 12), 'left');
      box(PAD + w1 + 10, by, w2, bh, f2, s2, l2, d2);
      txt(t2, PAD + w1 + 10 + w2/2, by + bh/2 + 1, c2, F(700, 12));
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

  mount('v90a', STEPS_A);
  mount('v90b', STEPS_B);
})();
