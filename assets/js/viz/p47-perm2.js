/* ============================================================
   P47 · Permutations II — used[] + 同層去重 · viz(兩個動畫)
     sort(nums);
     if (path.size() == nums.size()) { ans.push_back(path); return; }
     for (int i = 0; i < nums.size(); i++) {
         if (used[i]) continue;
         if (i > 0 && nums[i] == nums[i-1] && !used[i-1]) break;   // v47a:我的寫法(錯)
         if (i > 0 && nums[i] == nums[i-1] && !used[i-1]) continue; // v47b:改成 continue(對)
         used[i] = true; path.push_back(nums[i]); dfs(...); path.pop_back(); used[i] = false;
     }
   nums = [1,1,2] = 1₁ 1₂ 2(index 0,1,2)· g++ 實跑 trace,見 FACTS_47
     a(break):6 次呼叫 → [[1,1,2],[1,2,1]] —— 根的 i = 1 break,i = 2(值 2)沒試到,少 [2,1,1]
     b(continue):9 次呼叫 → 3 個;根的 i = 1、[2] 的 i = 1 各 continue 一次
   兩個動畫用同一棵樹的座標;a 把 [2] 整棵子樹畫成深紅虛線「沒被試到」。
   BAND 1 遞迴樹(層 = 第 1 / 2 / 3 格)
   BAND 2 used[] + path + 這一步所在的 for i(每個 i 的狀態)
   BAND 3 ans(3 格)/ BAND 4 這一步(哪一行跑了)
   前綴 v47a- / v47b- 。
   ============================================================ */
(function () {
  const C = { paper:'#ffffff', ink:'#1f1f1f', dim:'#5a5a5a', off:'#cfcfcf',
    up:'#e3edf5', low:'#f6ead8',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424',
    good:'#d9e8c7', bad:'#f0d4d4', deep:'#a31d1d', gray:'#ececec' };
  const MONO = '"JetBrains Mono", monospace', SANS = '"Noto Sans TC", sans-serif';
  const NUMS = [1, 1, 2], N = 3;
  const NAME = ['1₁', '1₂', '2'];

  /* 樹(依 continue 版的順序)。idx = path 用到的 index;ghost:'root' = 根的 i=1,'inner' = [2] 的 i=1;
     cut = break 版沒被試到的 [2] 子樹 */
  const T = [
    { idx:[],      par:-1, lvl:0, px:345 },
    { idx:[0],     par:0,  lvl:1, px:190 },
    { idx:[0,1],   par:1,  lvl:2, px:120 },
    { idx:[0,1,2], par:2,  lvl:3, px:120 },
    { idx:[0,2],   par:1,  lvl:2, px:268 },
    { idx:[0,2,1], par:4,  lvl:3, px:268 },
    { idx:[1],     par:0,  lvl:1, px:345, ghost:'root' },
    { idx:[2],     par:0,  lvl:1, px:500, cut:true },
    { idx:[2,0],   par:7,  lvl:2, px:438, cut:true },
    { idx:[2,0,1], par:8,  lvl:3, px:438, cut:true },
    { idx:[2,1],   par:7,  lvl:2, px:552, ghost:'inner' },
  ];
  T.forEach(n => {
    const k = n.idx.length;
    n.via = k ? n.idx[k - 1] : null;
    n.used = [0, 1, 2].map(i => n.idx.includes(i));
    n.name = '[' + n.idx.map(i => NAME[i]).join(',') + ']';
    n.val = '[' + n.idx.map(i => NUMS[i]).join(',') + ']';
    n.ans = k === N;
  });
  const UF = u => u.map(b => b ? 'T' : 'F').join('');

  /* 事件:{ k:'call'|'skip'|'break', id, no } */
  const EV_A = [], EV_B = [];
  { let no = 0; [0,1,2,3,4,5].forEach(id => EV_A.push({ k:'call', id, no:++no })); EV_A.push({ k:'break', id:6 }); }
  { let no = 0; [0,1,2,3,4,5,6,7,8,9,10].forEach(id => EV_B.push(T[id].ghost ? { k:'skip', id } : { k:'call', id, no:++no })); }

  const COMMON = [
    '<strong>#1 · [] · 根</strong> · used 全 F,迴圈 <code>i = 0..2</code>。<code>i = 0</code>(1₁):<code>i &gt; 0</code> 不成立 → 不比,往下。',
    '<strong>#2 · [1₁]</strong> · <code>used[0] = T</code>、push 1。新的一層又從 <code>i = 0</code> 掃:i = 0 已用 → <code>continue</code>(這是 used 那行,不是去重那行)。',
    '<strong>#3 · [1₁,1₂]</strong> · [1₁] 的 <code>i = 1</code>:1₂ == 1₁,<b>但 <code>used[0] = T</code></b> —— 1₁ 在 path 上(上一格),不是同層 → <b>不擋</b>,push 1₂。',
    '<strong>#4 · [1₁,1₂,2] ✓</strong> · i = 0、1 已用,i = 2 往下 → 三格滿了,收 <code>[1,1,2]</code>。',
    '<strong>#5 · [1₁,2]</strong> · 退回 [1₁](pop、used 復原),[1₁] 的 <code>i = 2</code>:2 ≠ 1₂ → 不擋,push 2。',
    '<strong>#6 · [1₁,2,1₂] ✓</strong> · [1₁,2] 的 <code>i = 1</code>:1₂ == 1₁ 但 <code>used[0] = T</code> → 不擋。收 <code>[1,2,1]</code>。',
  ];
  const LA = COMMON.concat([
    '<strong>BREAK · 在根</strong> · 一路退回根,used 全 F。根的 <code>i = 1</code>(1₂):<code>1₂ == 1₁</code> 且 <code>!used[0]</code> → <b><code>break</code>:整個 for 結束</b>。1₂ 本來就該擋(它會重複 [1₁] 那棵),<b>但 i = 2(值 2)也跟著不試了</b> —— [2] 開頭的整棵子樹(深紅虛線)一次都沒呼叫。',
  ]);
  const LB = COMMON.concat([
    '<strong>skip · 在根</strong> · 根的 <code>i = 1</code>(1₂):<code>1₂ == 1₁</code> 且 <code>!used[0]</code> → <b><code>continue</code>:只跳過這個 i</b>。「第 1 格放 1」已經由 1₁ 整棵試完,再用 1₂ 開頭只會重複。迴圈繼續 → i = 2。',
    '<strong>#7 · [2]</strong> · 根的 <code>i = 2</code>:2 ≠ 1₂ → 不擋,push 2。<b>這就是 break 版沒走到的那一步。</b>',
    '<strong>#8 · [2,1₁]</strong> · [2] 的 <code>i = 0</code>:<code>i &gt; 0</code> 不成立 → 不比,push 1₁。',
    '<strong>#9 · [2,1₁,1₂] ✓</strong> · [2,1₁] 的 <code>i = 1</code>:1₂ == 1₁ 但 <code>used[0] = T</code> → 不擋。收 <code>[2,1,1]</code>。',
    '<strong>skip · 在 [2]</strong> · 退回 [2],<code>used[0]</code> 復原成 F。[2] 的 <code>i = 1</code>(1₂):同值且 <code>!used[0]</code> → <code>continue</code>(會重複 [2,1₁])。i = 2 是自己 → used,迴圈結束。',
  ]);

  function build(brk) {
    const EV = brk ? EV_A : EV_B, LBL = brk ? LA : LB;
    const st = [{ vis:0, cur:-1, text: brk
      ? '<strong>INITIAL · 我的寫法(break)</strong> · <code>nums = [1,1,2]</code> 排序後,兩個 1 用下標分開:1₁ 1₂(= index 0,1)。去重那行:<code>if (i &gt; 0 &amp;&amp; nums[i] == nums[i−1] &amp;&amp; !used[i−1]) <b>break</b>;</code> 正解 3 個:[1,1,2]、[1,2,1]、[2,1,1]。'
      : '<strong>INITIAL · 改成 continue</strong> · 同一棵樹、同一個條件,只把 <code>break</code> 換成 <code>continue</code>:<b>條件成立時只跳過這一個 i,後面的 i 照樣試</b>。樹的位置和上一個動畫一樣,方便對照。' }];
    EV.forEach((e, k) => st.push({ vis:k + 1, cur:k, text:LBL[k] }));
    st.push({ vis:EV.length, cur:-1, text: brk
      ? '<strong>完成 · ans = [[1,1,2],[1,2,1]] ✗</strong> · 6 次呼叫,<b>少了 [2,1,1]</b>。break 把「同層重複的 1₂」和「後面不同值的 2」一起丟掉了。對拍 {1,2,3} 長度 1..6 的 1,092 組:break 版錯 946 組;沒有重複值的陣列全對 —— <b>bug 只在有重複時出現</b>。'
      : '<strong>完成 · ans = [[1,1,2],[1,2,1],[2,1,1]] ✓</strong> · 9 次呼叫、2 次 continue。被跳過的兩個都是「同層的 1₂」;i = 2 每次都照樣試到。對拍 1,092 組:continue 版 0 錯。' });
    st.EV = EV; st.brk = brk;
    return st;
  }
  const STEPS_A = build(true), STEPS_B = build(false);

  function mount(prefix, steps) {
    const canvas = document.getElementById(prefix + '-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const EV = steps.EV, BRK = steps.brk;
    const stepEl = document.getElementById(prefix + '-step'), labelEl = document.getElementById(prefix + '-label');
    const bPrev = document.getElementById(prefix + '-prev'), bNext = document.getElementById(prefix + '-next'),
          bPlay = document.getElementById(prefix + '-play'), bReset = document.getElementById(prefix + '-reset');
    let step = 0, timer = null;
    const evOf = id => EV.findIndex(e => e.id === id);
    const CALLS = EV.filter(e => e.k === 'call').length;
    const brkK = EV.findIndex(e => e.k === 'break');

    function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
      const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||340; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
      if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
    function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
    function box(x,y,w,h,fill,stroke,lw,dash){ rr(x,y,w,h,5); ctx.fillStyle=fill; ctx.fill(); ctx.lineWidth=lw||1.4; if(dash) ctx.setLineDash(dash); ctx.strokeStyle=stroke; ctx.stroke(); ctx.setLineDash([]); }
    function txt(s,x,y,color,font,align,base){ ctx.fillStyle=color; ctx.font=font; ctx.textAlign=align||'center'; ctx.textBaseline=base||'middle'; ctx.fillText(s,x,y); }
    function head(s,x,y){ txt(s,x,y,C.dim,'600 12px '+MONO+', '+SANS,'left','alphabetic'); }
    function line(x1,y1,x2,y2,color,lw,dash){ ctx.strokeStyle=color; ctx.lineWidth=lw; if(dash) ctx.setLineDash(dash); ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); ctx.setLineDash([]); }
    const F = (wt, sz) => wt + ' ' + sz + 'px ' + MONO + ', ' + SANS;
    function fitTxt(s, x, y, color, wt, sz, maxW, align){ let f = sz; ctx.font = F(wt, f);
      while (f > 9.5 && ctx.measureText(s).width > maxW) { f -= 0.5; ctx.font = F(wt, f); }
      txt(s, x, y, color, F(wt, f), align); }

    function draw(){
      fit();
      const s = steps[step], w = canvas.clientWidth, H = canvas.clientHeight, PAD = 22, inner = w - 2*PAD;
      ctx.fillStyle = C.paper; ctx.fillRect(0,0,w,H); ctx.setLineDash([]);
      const X = px => px * w / 620;
      const final = s.cur < 0 && s.vis === EV.length;
      const ev = s.cur >= 0 ? EV[s.cur] : null;
      const node = ev ? T[ev.id] : null;
      const callId = ev ? (ev.k === 'call' ? ev.id : node.par) : -1;      // 目前在跑的那一層 dfs
      const onPath = new Set(); for (let v = callId; v >= 0; v = T[v].par) onPath.add(v);
      const seen = id => { const k = evOf(id); return k >= 0 && k < s.vis; };
      const isCur = id => ev && ev.id === id;
      const broke = BRK && s.vis > brkK;                                  // break 已發生
      const isCut = id => BRK && T[id].cut;
      const done = EV.slice(0, s.vis);
      const nCalls = done.filter(e => e.k === 'call').length;
      const nAns = done.filter(e => e.k === 'call' && T[e.id].ans).length;
      const nSkip = done.filter(e => e.k === 'skip').length;
      const drawn = id => !(BRK && T[id].ghost === 'inner');

      /* ---- BAND 1 · 遞迴樹 ---- */
      head(BRK ? 'BAND 1 · 遞迴樹   紅 = 目前   綠 ✓ = 答案   深紅虛線 = break 後沒被試到'
               : 'BAND 1 · 遞迴樹   紅 = 目前   綠 ✓ = 答案   灰虛線 = 同層 skip(continue)', PAD, 16);
      const TOP = [30, 136, 212, 288], NH = 36;
      const NW = n => n.lvl === 0 ? 72 : (n.ghost ? 92 : 86);
      const cx = n => X(n.px), top = n => TOP[n.lvl], bot = n => TOP[n.lvl] + NH;
      const sx = n => { const p = T[n.par]; return cx(p) + (n.lvl === 1 ? (n.via - 1) * 16 : 0); };
      const TL = n => n.lvl === 1 ? 0.72 : 0.5;
      ['根', '第 1 格', '第 2 格', '第 3 格'].forEach((t, lv) =>
        txt(t, PAD, TOP[lv] + NH/2 + 1, C.dim, '600 12px '+SANS, 'left'));
      // 根左側:提示 / 右側:計數
      const root = T[0], rL = cx(root) - NW(root)/2, rR = cx(root) + NW(root)/2;
      const hx = X(56), hw = rL - 12 - hx;
      box(hx, TOP[0], hw, NH, C.low, C.off, 1.1, [3,3]);
      fitTxt(BRK ? '去重那行用 break' : '去重那行用 continue', hx + hw/2, TOP[0] + NH/2 + 1, BRK ? C.deep : C.ink, 700, 12, hw - 14);
      const cx0 = rR + 12, cw = w - PAD - cx0;
      const fin = final ? (BRK ? [C.bad, C.deep] : [C.good, C.ink]) : null;
      box(cx0, TOP[0], cw, NH, fin ? fin[0] : C.paper, fin ? fin[1] : C.off, 1.4, fin ? null : [3,3]);
      fitTxt('呼叫 ' + nCalls + ' / ' + CALLS + ' · 答案 ' + nAns + ' / 3', cx0 + cw/2, TOP[0] + NH/2 + 1, fin ? fin[1] : C.dim, 700, 12, cw - 14);

      // 邊
      T.forEach((n, id) => {
        if (n.par < 0 || !drawn(id)) return;
        const p = T[n.par], sn = seen(id);
        let col = sn ? C.ink : C.off, lw = 1.4, dash = sn ? null : [4,4];
        if (n.ghost) {
          if (BRK) { col = sn ? C.deep : C.off; dash = [2,4]; lw = isCur(id) ? 2.2 : 1.4; }
          else { col = sn ? C.dim : C.off; dash = [2,4]; lw = isCur(id) ? 2 : 1.2; }
        } else if (isCut(id) && broke) { col = C.deep; dash = [5,4]; lw = 1.5; }
        else if (onPath.has(id)) { col = C.curS; lw = 2.6; dash = null; }
        line(sx(n), bot(p), cx(n), top(n), col, lw, dash);
      });
      // 邊標籤 +x(ghost 沒有:它根本沒走下去)
      T.forEach((n, id) => {
        if (n.par < 0 || n.ghost) return;
        const p = T[n.par];
        const mx = sx(n) + (cx(n) - sx(n)) * TL(n), my = bot(p) + (top(n) - bot(p)) * TL(n);
        const lw = 30, lh = 15, sn = seen(id);
        let fill = C.paper, st = sn ? C.ink : C.off, tc = sn ? C.ink : C.off, bw = 1, dash = sn ? null : [2,2];
        if (isCut(id) && broke) { st = C.deep; tc = C.deep; dash = [3,2]; bw = 1.2; }
        else if (onPath.has(id)) { fill = C.cur; st = C.curS; tc = C.curT; bw = 1.6; }
        box(mx - lw/2, my - lh/2, lw, lh, fill, st, bw, dash);
        txt('+' + NAME[n.via], mx, my + 1, tc, F(700, 10.5));
      });
      // 節點 / ghost
      T.forEach((n, id) => {
        if (!drawn(id)) return;
        const x = cx(n), y = top(n), nw = NW(n), sn = seen(id), cu = isCur(id);
        if (n.ghost) {
          let fill = C.paper, st = C.off, tc = C.off, nc = C.off, lw = 1.1, dash = [3,3];
          let l1 = '[' + n.idx.map(i => NAME[i]).join(',') + ']', l2 = '?';
          if (sn) {
            l1 = '1₂ ' + (BRK ? 'BREAK' : '同層 skip'); l2 = BRK ? '迴圈到此結束' : 'continue';
            if (BRK) { fill = C.bad; st = C.deep; tc = C.deep; nc = C.deep; lw = 1.6; }
            else { st = C.dim; tc = C.dim; nc = C.dim; lw = 1.3; }
          }
          if (cu) { lw = 2.4; dash = [5,3]; if (!BRK) { fill = C.gray; tc = C.ink; nc = C.ink; } }
          box(x - nw/2, y, nw, NH, fill, st, lw, dash);
          txt(l1, x, y + 12, tc, F(700, 10.5));
          txt(l2, x, y + 26, nc, F(600, 10));
          return;
        }
        if (isCut(id) && broke) {
          box(x - nw/2, y, nw, NH, C.paper, C.deep, 1.5, [5,3]);
          txt(n.name, x, y + 12, C.deep, F(700, 11));
          txt('沒被試到', x, y + 27, C.deep, F(700, 10));
          return;
        }
        const no = sn ? EV[evOf(id)].no : null;
        let fill = C.paper, st = C.off, tc = C.off, sc = C.off, lw = 1.1, dash = [3,3];
        let l2 = n.ans ? '收' : 'used ' + UF(n.used);
        if (sn) {
          fill = n.ans ? C.good : C.up; st = C.ink; tc = C.ink; sc = C.dim; lw = 1.4; dash = null;
          l2 = '#' + no + ' · ' + (n.ans ? '收 ✓' : UF(n.used));
        }
        if (onPath.has(id) && !cu) { st = C.curS; lw = 2.2; }
        if (cu) {
          if (n.ans) { fill = C.good; st = C.curS; tc = C.ink; sc = C.ink; }
          else { fill = C.cur; st = C.curS; tc = C.curT; sc = C.curT; }
          lw = 2.6;
        }
        box(x - nw/2, y, nw, NH, fill, st, lw, dash);
        txt(n.name, x, y + 12, tc, F(700, 11));
        txt(l2, x, y + 27, sc, F(600, 10));
      });
      // a:BREAK 截斷棒 —— 橫切根的 i = 1、i = 2 兩條邊
      if (broke) {
        const g = T[6], k2 = T[7], by = bot(root) + 21;
        const e1 = sx(g), ex2 = sx(k2) + (cx(k2) - sx(k2)) * (21 / (top(k2) - bot(root)));
        const x1 = e1 - 14, x2 = ex2 + 14;
        line(x1, by, x2, by, C.deep, 4);
        line(x1, by - 7, x1, by + 7, C.deep, 2.4); line(x2, by - 7, x2, by + 7, C.deep, 2.4);
        const ly = by - 9, lh = 18, lbot = ly + lh;
        const eAt = sx(k2) + (cx(k2) - sx(k2)) * ((lbot - bot(root)) / (top(k2) - bot(root)));
        const lx = Math.max(x2 + 12, eAt + 14), lwid = Math.min(150, w - PAD - lx);
        box(lx, ly, lwid, lh, C.bad, C.deep, 1.8);
        fitTxt('✂ BREAK · i=1,2 都不試', lx + lwid/2, ly + lh/2 + 1, C.deep, 700, 11, lwid - 10);
      }

      /* ---- BAND 2 · used[] / path / for i ---- */
      const b2 = 352;
      head('BAND 2 · used[] / path / for i   紅 = 這次   藍 = 試過   灰 = skip' + (BRK ? '   深紅 = break' : ''), PAD, b2);
      const rA = b2 + 12, hA = 40, cW = X(72), cG = X(8), ux0 = X(64);
      // 這一步的狀態:呼叫 → 該節點(進入時);skip/break → 父節點的迴圈當下
      const stNode = ev ? (ev.k === 'call' ? node : T[node.par]) : null;
      const usedNow = stNode ? stNode.used : [false, false, false];
      const pathNow = stNode ? stNode.idx : [];
      const setI = ev && ev.k === 'call' && node.via !== null ? node.via : -1;
      const chk = ev && ev.k !== 'call' ? 0 : -1;                         // !used[i-1] 被檢查的那格
      txt('used', PAD, rA + hA/2 + 1, C.ink, '700 13px '+MONO, 'left');
      for (let i = 0; i < N; i++) {
        const x = ux0 + i*(cW + cG), u = usedNow[i];
        let fill = u ? C.low : C.paper, st = C.ink, lw = 1.4, dash = null, tc = C.ink, l1c = C.dim, l1 = 'i=' + i + ' · ' + NAME[i];
        if (i === setI) { fill = C.cur; st = C.curS; lw = 2.6; tc = C.curT; l1c = C.curT; }
        if (i === chk) { st = BRK ? C.deep : C.ink; lw = 2.4; l1 = '!used[0]'; l1c = BRK ? C.deep : C.ink; tc = l1c; }
        box(x, rA, cW, hA, fill, st, lw, dash);
        txt(l1, x + cW/2, rA + 12, l1c, F(600, 10.5));
        txt(u ? 'T' : 'F', x + cW/2, rA + 28, tc, F(700, 14));
      }
      const ptag = ux0 + N*(cW + cG) + X(6), px0 = ptag + X(44);
      txt('path', ptag, rA + hA/2 + 1, C.ink, '700 13px '+MONO, 'left');
      for (let j = 0; j < N; j++) {
        const x = px0 + j*(cW + cG), has = j < pathNow.length, isNew = setI >= 0 && j === node.lvl - 1;
        let fill = has ? C.up : C.paper, st = has ? C.ink : C.off, lw = has ? 1.4 : 1.1, dash = has ? null : [3,3], tc = has ? C.ink : C.off;
        if (isNew) { fill = C.cur; st = C.curS; lw = 2.6; tc = C.curT; }
        box(x, rA, cW, hA, fill, st, lw, dash);
        txt('第 ' + (j + 1) + ' 格', x + cW/2, rA + 12, isNew ? C.curT : C.dim, F(600, 10.5));
        txt(has ? NAME[pathNow[j]] : '—', x + cW/2, rA + 28, tc, F(700, 14));
      }
      // for i 列:這一步所在的迴圈(呼叫 → 父迴圈;根 → 自己的迴圈)
      const rB = rA + hA + 14, hB = 40;
      txt('for i', PAD, rB + hB/2 + 1, C.ink, '700 13px '+MONO, 'left');
      const loopId = ev ? (node.par >= 0 ? node.par : 0) : (final ? 0 : -1), L0 = loopId >= 0 ? T[loopId] : null;
      const stI = {};
      if ((ev && node.par >= 0) || final) {                                // final:根的迴圈最後長什麼樣
        const upto = final ? EV.length - 1 : s.cur;
        EV.forEach((e, k) => {
          if (k > upto || T[e.id].par !== loopId) return;
          const v = T[e.id].via, nowK = !final && k === s.cur;
          stI[v] = e.k === 'call' ? (nowK ? 'now' : 'took') : e.k === 'skip' ? (nowK ? 'skipNow' : 'skip') : 'break';
          if (e.k === 'break') for (let j = v + 1; j < N; j++) stI[j] = 'cut';
        });
      }
      for (let i = 0; i < N; i++) {
        const x = ux0 + i*(cW + cG);
        let fill = C.paper, st = C.off, lw = 1.1, dash = [3,3], tc = C.off, t2 = '—', strike = null;
        if (L0) {
          const k = stI[i];
          if (L0.used[i]) { fill = '#f3f3f3'; st = C.off; dash = null; tc = C.dim; t2 = 'used'; strike = C.dim; }
          else if (k === 'now') { fill = C.cur; st = C.curS; lw = 2.6; dash = null; tc = C.curT; t2 = '→ 拿'; }
          else if (k === 'took') { fill = C.up; st = C.ink; lw = 1.4; dash = null; tc = C.ink; t2 = '試過'; }
          else if (k === 'skip' || k === 'skipNow') { fill = C.gray; st = C.dim; lw = k === 'skipNow' ? 2.4 : 1.3; dash = [4,3]; tc = k === 'skipNow' ? C.ink : C.dim; t2 = 'skip'; }
          else if (k === 'break') { fill = C.bad; st = C.deep; lw = 2.6; dash = null; tc = C.deep; t2 = 'BREAK'; }
          else if (k === 'cut') { fill = C.paper; st = C.deep; lw = 1.4; dash = [4,3]; tc = C.deep; t2 = '不試'; strike = C.deep; }
          else if (ev && node.par < 0) { st = C.curS; lw = 1.6; dash = null; tc = C.curT; t2 = '待試'; }
        }
        box(x, rB, cW, hB, fill, st, lw, dash);
        txt('i=' + i + ' · ' + NAME[i], x + cW/2, rB + 12, tc, F(600, 10.5));
        txt(t2, x + cW/2, rB + 28, tc, F(700, 12));
        if (strike) line(x + 7, rB + hB/2 + 1, x + cW - 7, rB + hB/2 + 1, strike, 1.6);
      }
      let n1 = '排序後同值相鄰:1₁ 1₂ 2', n2 = '同層同值只讓第一個開頭', nc = C.dim;
      if (ev && node.par < 0) { n1 = '根 · for i = 0..2'; n2 = 'used 全 F'; nc = C.curT; }
      else if (ev && ev.k === 'call') {
        const i = node.via;
        n1 = '在 ' + L0.name + ' 的迴圈 · i = ' + i + ' → push ' + NAME[i];
        n2 = i === 0 ? 'i = 0 → 不比' : NUMS[i] !== NUMS[i-1] ? NAME[i] + ' ≠ ' + NAME[i-1] + ' → 不擋'
           : NAME[i] + ' == ' + NAME[i-1] + ',但 used[' + (i-1) + '] = T → 不擋';
        nc = C.curT;
      } else if (ev) {
        n1 = 'i = 1 · 1₂ == 1₁ 且 !used[0]';
        n2 = ev.k === 'break' ? 'break → i = 2 也不試了' : 'continue → 只跳過 i = 1';
        nc = ev.k === 'break' ? C.deep : C.ink;
      } else if (final) {
        n1 = BRK ? '根的迴圈:i = 1 break 就結束' : '根的迴圈:i = 1 skip,i = 2 照試';
        n2 = BRK ? '[2] 開頭的排列全部沒試到' : '2 次 continue,各只跳過一個 i';
        nc = BRK ? C.deep : C.ink;
      }
      const nx = ptag, nmax = w - PAD - nx;
      fitTxt(n1, nx, rB + 11, nc, 700, 12, nmax, 'left');
      fitTxt(n2, nx, rB + 30, nc, 700, 12, nmax, 'left');

      /* ---- BAND 3 · ans ---- */
      const b3 = 486;
      head('BAND 3 · ans(正解 3 個)  紅框 = 這一步收的' + (BRK ? '   深紅 = 少掉的' : ''), PAD, b3);
      const ay = b3 + 12, ah = 30, ax0 = PAD + 44, sg = 10, sw = (w - PAD - ax0 - 2*sg) / 3;
      txt('ans', PAD, ay + ah/2 + 1, C.ink, '700 13px '+MONO, 'left');
      const got = EV.slice(0, s.vis).map((e, k) => ({ e, k })).filter(o => o.e.k === 'call' && T[o.e.id].ans);
      for (let j = 0; j < 3; j++) {
        const x = ax0 + j*(sw + sg), o = got[j];
        if (o) {
          const cu = o.k === s.cur;
          box(x, ay, sw, ah, C.good, cu ? C.curS : C.ink, cu ? 2.6 : 1.4);
          txt(T[o.e.id].val + ' ✓', x + sw/2, ay + ah/2 + 1, C.ink, F(700, 12));
        } else if (broke && j === 2) {
          box(x, ay, sw, ah, C.bad, C.deep, 1.8, [5,3]);
          txt('少了 [2,1,1]', x + sw/2, ay + ah/2 + 1, C.deep, F(700, 12));
        } else {
          box(x, ay, sw, ah, C.paper, C.off, 1.1, [3,3]);
          txt('—', x + sw/2, ay + ah/2 + 1, C.off, F(600, 12));
        }
      }

      /* ---- BAND 4 · 這一步 ---- */
      const b4 = 556;
      head('BAND 4 · 這一步   if (i>0 && nums[i]==nums[i−1] && !used[i−1]) ' + (BRK ? 'break;' : 'continue;'), PAD, b4);
      const by = b4 + 12, bh = 32, w1 = Math.round(inner * 0.38), w2 = inner - w1 - 10;
      let t1 = 'dfs(path=[]) 從根開始', t2 = BRK ? '條件成立 → break' : '條件成立 → continue';
      let f2 = C.paper, s2 = C.off, d2 = [3,3], c2 = C.dim, l2 = 1.4;
      if (ev && ev.k === 'call') {
        t1 = '#' + ev.no + ' dfs(path=' + node.name + ')';
        if (node.par < 0) t2 = 'size 0 → for i = 0..2';
        else if (node.ans) t2 = 'used[' + node.via + '] = T · push ' + NAME[node.via] + ' · size == 3 → 收 ✓';
        else t2 = 'used[' + node.via + '] = T · push ' + NAME[node.via] + ' → 下一格從 i = 0 掃';
        f2 = node.ans ? C.good : C.cur; s2 = C.curS; d2 = null; c2 = node.ans ? C.ink : C.curT; l2 = 2.2;
      } else if (ev) {
        t1 = '在 ' + T[node.par].name + ' 的迴圈 · i = 1(1₂)';
        if (ev.k === 'break') { t2 = 'break → 這一圈結束,後面的 i 都不試'; f2 = C.bad; s2 = C.deep; c2 = C.deep; d2 = null; l2 = 2.6; }
        else { t2 = 'continue → 只跳過這個 i'; f2 = C.gray; s2 = C.dim; c2 = C.ink; d2 = [5,3]; l2 = 2.2; }
      } else if (final) {
        t1 = BRK ? '6 次呼叫 · 2 個答案 ✗' : '9 次呼叫 · 3 個答案 ✓';
        t2 = BRK ? '少了 [2,1,1]:i = 2 被 break 截掉' : '沒有重複,也沒有遺漏';
        f2 = BRK ? C.bad : C.good; s2 = BRK ? C.deep : C.ink; c2 = s2; d2 = null; l2 = 2;
      }
      box(PAD, by, w1, bh, C.paper, C.ink, 1.4);
      fitTxt(t1, PAD + 12, by + bh/2 + 1, C.ink, 700, 12, w1 - 20, 'left');
      box(PAD + w1 + 10, by, w2, bh, f2, s2, l2, d2);
      fitTxt(t2, PAD + w1 + 10 + w2/2, by + bh/2 + 1, c2, 700, 12, w2 - 16);
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

  mount('v47a', STEPS_A);
  mount('v47b', STEPS_B);
})();
