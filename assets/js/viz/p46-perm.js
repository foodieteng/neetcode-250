/* ============================================================
   P46 · Permutations — 回溯 + used[] · viz(一個動畫)
     if (path.size() == nums.size()) { ans.push_back(path); return; }
     for (int i = 0; i < nums.size(); i++) {
         if (used[i]) continue;
         used[i] = true; path.push_back(nums[i]);
         dfs(...);
         path.pop_back(); used[i] = false;
     }
   nums = [1,2,3] → 16 次呼叫、6 個答案(g++ 實跑 trace,見 FACTS)
     和 77/78 不同:每一層迴圈都從 i = 0 開始,靠 used[] 跳過已選的數
     return 時復原兩行:pop_back + used[i] = false(折進下一個呼叫那一步)
   BAND 1 遞迴樹(層 = 第 1 / 2 / 3 格)
   BAND 2 used[] + path 三格 + 這層 for i 的 skip / 往下
   BAND 3 ans(6 格)/ BAND 4 這一步(呼叫 + 復原)
   前綴 v46- 。
   ============================================================ */
(function () {
  const C = { paper:'#ffffff', ink:'#1f1f1f', dim:'#5a5a5a', off:'#cfcfcf',
    up:'#e3edf5', low:'#f6ead8',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424',
    good:'#d9e8c7', bad:'#f0d4d4', deep:'#a31d1d' };
  const MONO = '"JetBrains Mono", monospace', SANS = '"Noto Sans TC", sans-serif';
  const NUMS = [1, 2, 3], N = 3;
  const ps = p => '[' + p.join(',') + ']';

  /* 照使用者的程式跑一次,記錄每次呼叫(含 entry 時的 used)和每次復原 */
  const T = [];          // 呼叫(#1..#16)
  const EV = [];         // {k:'call', id} / {k:'undo', i, v}
  (function run() {
    const used = [false, false, false], path = [];
    function dfs(par, viaI) {
      const id = T.length;
      T.push({ path: path.slice(), used: used.slice(), par, viaI, lvl: path.length, ans: path.length === N });
      EV.push({ k:'call', id });
      if (path.length === N) return;
      for (let i = 0; i < N; i++) {
        if (used[i]) continue;
        used[i] = true; path.push(NUMS[i]);
        dfs(id, i);
        path.pop(); used[i] = false;
        EV.push({ k:'undo', i, v: NUMS[i], back: id });
      }
    }
    dfs(-1, -1);
  })();
  /* 樹座標(620px 設計寬度):葉子平均分佈,第 2 格在葉子正上方,第 1 格在兩個孩子中間 */
  const LEAFX = [110, 199, 288, 376, 465, 554];
  (function place() {
    let leaf = 0;
    T.forEach(n => { if (n.ans) n.px = LEAFX[leaf++]; });
    for (let lv = N - 1; lv >= 0; lv--)
      T.forEach((n, id) => { if (n.lvl === lv) { const ch = T.filter(m => m.par === id); n.px = ch.reduce((a, m) => a + m.px, 0) / ch.length; } });
  })();
  T.forEach((n, id) => {
    n.skip = [0, 1, 2].filter(i => n.used[i]);
    n.go = [0, 1, 2].filter(i => !n.used[i]);
    n.add = n.viaI >= 0 ? NUMS[n.viaI] : null;
  });

  /* 步驟:intro + 16 次呼叫 + final;每一步帶「這之前的復原」 */
  const STEPS = [{ cur:-1, seen:0, undo:[], back:-1 }];
  let pend = [], back = -1;
  EV.forEach(e => {
    if (e.k === 'undo') { pend.push(e); back = e.back; return; }
    STEPS.push({ cur:e.id, seen:e.id + 1, undo:pend, back });
    pend = []; back = -1;
  });
  STEPS.push({ cur:-1, seen:T.length, undo:pend, back, final:true });

  const LBL = [
    '<strong>INITIAL</strong> · <code>nums = [1,2,3]</code>。排列 = 3 個格子,<b>每一格都可以放任何還沒用過的數</b>。所以每一層的迴圈都從 <code>i = 0</code> 開始(不像 77/78 從 s 開始),靠 <code>used[]</code> 跳過已經放進 path 的數。',
    '<strong>#1 · [] · 根</strong> · used 全 F,迴圈 <code>i = 0..2</code> 三個都能選 → 第 1 格有 3 種:[1]、[2]、[3]。',
    '<strong>#2 · [1]</strong> · <code>used[0] = true</code>、push 1。迴圈又從 0 開始:<b>i = 0 已用 → skip</b>,i = 1、2 往下。',
    '<strong>#3 · [1,2]</strong> · <code>used[1] = true</code>、push 2。i = 0、1 都已用 → skip,只剩 i = 2。',
    '<strong>#4 · [1,2,3] ✓</strong> · 三格滿了:<code>size == 3</code> → <b>ans 收下</b>,return。',
    '<strong>#5 · [1,3]</strong> · 先退:回到 [1,2] 時 <b>pop 3、used[2]=false</b>;[1,2] 迴圈跑完再退,回到 [1]:<b>pop 2、used[1]=false</b>。接著 [1] 的 i = 2 → push 3。',
    '<strong>#6 · [1,3,2] ✓</strong> · [1,3] 的 i = 0 skip,<b>i = 1 能選</b>(剛剛 used[1] 已復原成 false)→ 收。',
    '<strong>#7 · [2]</strong> · 一路退回根:pop 2、used[1]=F;pop 3、used[2]=F;pop 1、used[0]=F。根的 i = 1 → 第 1 格放 2。',
    '<strong>#8 · [2,1]</strong> · <b>i = 0 又能選了</b> —— 排列裡 1 可以排在 2 後面。這就是迴圈從 0 開始的原因。',
    '<strong>#9 · [2,1,3] ✓</strong> · 收。',
    '<strong>#10 · [2,3]</strong> · 回到 [2,1]:pop 3、used[2]=F;再回到 [2]:pop 1、used[0]=F。[2] 的 i = 1 是自己 → skip,i = 2 → push 3。',
    '<strong>#11 · [2,3,1] ✓</strong> · i = 0 往下 → 收。(i = 1、2 已用 → skip)',
    '<strong>#12 · [3]</strong> · 退回根(兩行復原 × 3 層),根的 i = 2 → 第 1 格放 3。',
    '<strong>#13 · [3,1]</strong> · i = 0 往下。',
    '<strong>#14 · [3,1,2] ✓</strong> · 收。',
    '<strong>#15 · [3,2]</strong> · 回到 [3]:pop 2、used[1]=F;pop 1、used[0]=F。i = 1 → push 2。',
    '<strong>#16 · [3,2,1] ✓</strong> · 最後一個排列 → 收。',
    '<strong>完成 · 6 個答案 · 16 次呼叫</strong> · 退回根時 path 變回 []、used 全回 F —— <b>每次 return 都復原兩行</b>(pop_back + used[i]=false)。少任何一行,後面的分支就拿到髒狀態。呼叫數 = 1 + 3 + 6 + 6 = 16。',
  ];
  STEPS.forEach((s, k) => s.text = LBL[k]);

  function mount(prefix) {
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

    function draw(){
      fit();
      const s = STEPS[step], w = canvas.clientWidth, H = canvas.clientHeight, PAD = 22;
      ctx.fillStyle = C.paper; ctx.fillRect(0,0,w,H); ctx.setLineDash([]);
      const X = px => px * w / 620;
      const node = s.cur >= 0 ? T[s.cur] : null;
      const seen = id => id < s.seen;
      const onPath = new Set(); for (let v = s.cur; v >= 0; v = T[v].par) onPath.add(v);
      const undoneI = new Set(s.undo.map(e => e.i));
      // 目前狀態(進入這次呼叫時;final = 全部復原)
      const usedNow = node ? node.used : [false, false, false];
      const pathNow = node ? node.path : [];
      const setI = node && node.viaI >= 0 ? node.viaI : -1;

      /* ---- BAND 1 · 遞迴樹 ---- */
      head('BAND 1 · 遞迴樹   紅 = 目前   綠 ✓ = 答案   +x = 這格放 x   虛線 = 還沒', PAD, 16);
      const TOP = [30, 104, 176, 248], NH = 36;
      const NW = n => n.lvl === 0 ? 72 : (n.lvl === 1 ? 70 : 64);
      const cx = n => X(n.px), top = n => TOP[n.lvl], bot = n => TOP[n.lvl] + NH;
      const sib = n => T.filter(m => m.par === n.par).indexOf(n), nsib = n => T.filter(m => m.par === n.par).length;
      const sx = n => { const p = T[n.par]; return cx(p) + (n.lvl === 1 ? (sib(n) - (nsib(n) - 1)/2) * 16 : 0); };
      const TL = n => n.lvl === 1 ? 0.62 : 0.5;
      // 層標籤
      ['根', '第 1 格', '第 2 格', '第 3 格'].forEach((t, lv) =>
        txt(t, PAD, TOP[lv] + NH/2 + 1, C.dim, '600 12px '+SANS, 'left'));
      // 根左側:提示 / 右側:計數
      const hx = X(70), hw = X(296) - 12 - hx;
      box(hx, TOP[0], hw, NH, C.low, C.off, 1.1, [3,3]);
      txt('每一層 for 都從 i = 0 開始', hx + hw/2, TOP[0] + NH/2 + 1, C.ink, '700 11.5px '+MONO+', '+SANS);
      const nAns = T.filter((n, id) => seen(id) && n.ans).length;
      const cx0 = X(368) + 12, cw = w - PAD - cx0;
      box(cx0, TOP[0], cw, NH, s.final ? C.good : C.paper, s.final ? C.ink : C.off, 1.4, s.final ? null : [3,3]);
      txt('呼叫 ' + s.seen + ' / 16 · 答案 ' + nAns + ' / 6', cx0 + cw/2, TOP[0] + NH/2 + 1, s.final ? C.ink : C.dim, '700 12px '+MONO+', '+SANS);
      // 邊
      T.forEach((n, id) => {
        if (n.par < 0) return;
        const p = T[n.par], sn = seen(id);
        let col = sn ? C.ink : C.off, lw = 1.4, dash = sn ? null : [4,4];
        if (onPath.has(id)) { col = C.curS; lw = 2.6; dash = null; }
        line(sx(n), bot(p), cx(n), top(n), col, lw, dash);
      });
      // 邊標籤 +x
      T.forEach((n, id) => {
        if (n.par < 0) return;
        const p = T[n.par];
        const mx = sx(n) + (cx(n) - sx(n)) * TL(n), my = bot(p) + (top(n) - bot(p)) * TL(n);
        const lw = 26, lh = 14, sn = seen(id);
        let fill = C.paper, st = sn ? C.ink : C.off, tc = sn ? C.ink : C.off, bw = 1, dash = sn ? null : [2,2];
        if (onPath.has(id)) { fill = C.cur; st = C.curS; tc = C.curT; bw = 1.6; }
        box(mx - lw/2, my - lh/2, lw, lh, fill, st, bw, dash);
        txt('+' + n.add, mx, my + 1, tc, '700 10.5px '+MONO);
      });
      // 節點
      T.forEach((n, id) => {
        const x = cx(n), y = top(n), nw = NW(n), sn = seen(id), isCur = id === s.cur;
        let fill = C.paper, st = C.off, tc = C.off, sc = C.off, lw = 1.1, dash = [3,3];
        let l1 = ps(n.path), l2 = n.ans ? '收' : (n.skip.length ? '跳 i=' + n.skip.join(',') : 'i=0..2');
        if (sn) {
          fill = n.ans ? C.good : C.up; st = C.ink; tc = C.ink; sc = C.dim; lw = 1.4; dash = null;
          if (n.ans) l2 = '收 ✓';
        }
        if (onPath.has(id) && !isCur) { st = C.curS; lw = 2.2; }
        if (isCur) {
          if (n.ans) { fill = C.good; st = C.curS; tc = C.ink; sc = C.ink; }
          else { fill = C.cur; st = C.curS; tc = C.curT; sc = C.curT; }
          lw = 2.6;
        }
        box(x - nw/2, y, nw, NH, fill, st, lw, dash);
        txt(l1, x, y + 12, tc, '700 11.5px '+MONO+', '+SANS);
        txt(l2, x, y + 27, sc, '600 10.5px '+MONO+', '+SANS);
      });

      /* ---- BAND 2 · used[] + path + for i ---- */
      const b2 = 312;
      head('BAND 2 · used[] / path   紅 = 剛設 T / push   深紅 ↩ = 剛復原   灰刪除線 = skip', PAD, b2);
      const rA = b2 + 12, hA = 40, cW = X(64), cG = X(8), ux0 = X(66);
      txt('used', PAD, rA + hA/2 + 1, C.ink, '700 13px '+MONO, 'left');
      for (let i = 0; i < N; i++) {
        const x = ux0 + i*(cW + cG), u = usedNow[i];
        let fill = u ? C.low : C.paper, st = C.ink, lw = 1.4, dash = null, tc = C.ink, l1c = C.dim, l1 = 'i=' + i + ' · ' + NUMS[i];
        if (i === setI) { fill = C.cur; st = C.curS; lw = 2.6; tc = C.curT; l1c = C.curT; }
        else if (undoneI.has(i)) { fill = C.bad; st = C.deep; lw = 1.8; dash = [4,3]; tc = C.deep; l1c = C.deep; }
        box(x, rA, cW, hA, fill, st, lw, dash);
        txt(l1, x + cW/2, rA + 12, l1c, '600 10.5px '+MONO+', '+SANS);
        txt((u ? 'T' : 'F') + (undoneI.has(i) && i !== setI ? ' ↩' : ''), x + cW/2, rA + 28, tc, '700 14px '+MONO+', '+SANS);
      }
      const px0 = X(330), ptag = X(290);
      txt('path', ptag, rA + hA/2 + 1, C.ink, '700 13px '+MONO, 'left');
      // 這一步被 pop 掉的格子(slot = 該層 lvl-1)
      const popAt = {};
      s.undo.forEach(e => { const slot = T[e.back].lvl; if (!(slot in popAt)) popAt[slot] = []; popAt[slot].push(e.v); });
      for (let j = 0; j < N; j++) {
        const x = px0 + j*(cW + cG), has = j < pathNow.length, isNew = node && j === node.lvl - 1;
        let fill = has ? C.up : C.paper, st = has ? C.ink : C.off, lw = has ? 1.4 : 1.1, dash = has ? null : [3,3];
        let tc = has ? C.ink : C.off, l1 = '第 ' + (j + 1) + ' 格', l1c = C.dim;
        if (popAt[j]) { l1 = 'pop ' + popAt[j].join(','); l1c = C.deep; if (!has) { st = C.deep; fill = C.bad; dash = [4,3]; lw = 1.8; } }
        if (isNew) { fill = C.cur; st = C.curS; lw = 2.6; tc = C.curT; }
        box(x, rA, cW, hA, fill, st, lw, dash);
        txt(l1, x + cW/2, rA + 12, l1c, '600 10.5px '+MONO+', '+SANS);
        txt(has ? String(pathNow[j]) : '—', x + cW/2, rA + 28, tc, '700 14px '+MONO);
      }
      // for i 列
      const rB = rA + hA + 14, hB = 30;
      txt('for i', PAD, rB + hB/2 + 1, C.ink, '700 13px '+MONO, 'left');
      for (let i = 0; i < N; i++) {
        const x = ux0 + i*(cW + cG);
        let fill = C.paper, st = C.off, lw = 1.1, dash = [3,3], tc = C.off, t = 'i=' + i, strike = false;
        if (node && !node.ans) {
          if (node.used[i]) { t = 'i=' + i + ' skip'; tc = C.dim; st = C.off; dash = null; fill = '#f3f3f3'; strike = true; }
          else { t = 'i=' + i + ' → ' + NUMS[i]; fill = C.cur; st = C.curS; tc = C.curT; lw = 2; dash = null; }
        }
        box(x, rB, cW, hB, fill, st, lw, dash);
        txt(t, x + cW/2, rB + hB/2 + 1, tc, '700 11px '+MONO+', '+SANS);
        if (strike) line(x + 6, rB + hB/2 + 1, x + cW - 6, rB + hB/2 + 1, C.dim, 1.4);
      }
      let nt = '每格都掃 i = 0..2,used 的跳過', nc = C.dim;
      if (node) {
        if (node.ans) { nt = 'size == 3 → 收,不跑迴圈'; nc = C.ink; }
        else if (node.skip.length) { nt = 'i=' + node.skip.join(',') + ' 已用 → skip · i=' + node.go.join(',') + ' 往下'; nc = C.curT; }
        else { nt = 'used 全 F → i=0,1,2 都往下'; nc = C.curT; }
      } else if (s.final) { nt = '回到根:used 全 F、path = []'; nc = C.ink; }
      txt(nt, ptag, rB + hB/2 + 1, nc, '700 12px '+MONO+', '+SANS, 'left');

      /* ---- BAND 3 · ans ---- */
      const b3 = 436;
      head('BAND 3 · ans(三格滿了才收)', PAD, b3);
      const ay = b3 + 12, ah = 30, ax0 = PAD + 44, sg = 8, sw = (w - PAD - ax0 - 5*sg) / 6;
      txt('ans', PAD, ay + ah/2 + 1, C.ink, '700 13px '+MONO, 'left');
      const got = T.map((n, id) => id).filter(id => seen(id) && T[id].ans);
      for (let j = 0; j < 6; j++) {
        const x = ax0 + j*(sw + sg), id = got[j];
        if (id === undefined) {
          box(x, ay, sw, ah, C.paper, C.off, 1.1, [3,3]);
          txt('—', x + sw/2, ay + ah/2 + 1, C.off, '600 12px '+MONO);
        } else {
          const isCur = id === s.cur;
          box(x, ay, sw, ah, C.good, isCur ? C.curS : C.ink, isCur ? 2.6 : 1.4);
          txt(ps(T[id].path) + ' ✓', x + sw/2, ay + ah/2 + 1, C.ink, '700 11.5px '+MONO+', '+SANS);
        }
      }

      /* ---- BAND 4 · 這一步 ---- */
      const b4 = 504;
      head('BAND 4 · 這一步   左 = 呼叫   右 = return 時的兩行復原', PAD, b4);
      const by = b4 + 12, bh = 32, inner = w - 2*PAD, w1 = Math.round(inner * 0.36), w2 = inner - w1 - 10;
      let t1 = 'dfs(path=[]) 從根開始', t2 = 'nums = [1,2,3] · used = F,F,F';
      let f2 = C.paper, s2 = C.off, d2 = [3,3], c2 = C.dim, l2 = 1.4;
      if (node) t1 = '#' + (s.cur + 1) + ' dfs(path=' + ps(node.path) + ')';
      else if (s.final) t1 = '16 次呼叫 · 6 個答案';
      if (s.undo.length) {
        t2 = '回到 ' + ps(T[s.back].path) + ':' + s.undo.map(e => 'pop ' + e.v + '、used[' + e.i + ']=false').join(' · ');
        if (s.undo.length > 2) t2 = '退 ' + s.undo.length + ' 層到 ' + ps(T[s.back].path) + ':' + s.undo.map(e => 'pop ' + e.v + '/u[' + e.i + ']=F').join(' · ');
        f2 = C.bad; s2 = C.deep; c2 = C.deep; d2 = null; l2 = 2;
      } else if (node) {
        d2 = null; l2 = 2.2;
        if (node.ans) { t2 = 'size == 3 → 收 ✓'; f2 = C.good; s2 = C.curS; c2 = C.ink; }
        else { t2 = node.viaI < 0 ? 'size 0 → for i = 0..2' : 'used[' + node.viaI + '] = T · push ' + node.add; f2 = C.cur; s2 = C.curS; c2 = C.curT; }
      }
      box(PAD, by, w1, bh, s.final ? C.good : C.paper, C.ink, 1.4);
      txt(t1, PAD + 12, by + bh/2 + 1, C.ink, '700 12px '+MONO+', '+SANS, 'left');
      box(PAD + w1 + 10, by, w2, bh, f2, s2, l2, d2);
      let fs = 12; ctx.font = '700 12px '+MONO+', '+SANS;
      while (fs > 9.5 && ctx.measureText(t2).width > w2 - 16) { fs -= 0.5; ctx.font = '700 ' + fs + 'px '+MONO+', '+SANS; }
      txt(t2, PAD + w1 + 10 + w2/2, by + bh/2 + 1, c2, '700 ' + fs + 'px '+MONO+', '+SANS);
    }

    function update(){ if(stepEl) stepEl.textContent=String(step).padStart(2,'0')+' / '+String(STEPS.length-1).padStart(2,'0'); if(labelEl) labelEl.innerHTML=STEPS[step].text; draw(); }
    function next(){ if(step<STEPS.length-1){step++;update();}else stop(); }
    function prev(){ if(step>0){step--;update();} }
    function reset(){ stop(); step=0; update(); }
    function play(){ if(timer){stop();return;} bPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=STEPS.length-1){stop();return;} next(); },2200); }
    function stop(){ if(timer){clearInterval(timer);timer=null;} if(bPlay) bPlay.textContent='Play'; }
    bPrev&&bPrev.addEventListener('click',prev); bNext&&bNext.addEventListener('click',next); bPlay&&bPlay.addEventListener('click',play); bReset&&bReset.addEventListener('click',reset);
    window.addEventListener('resize',()=>{fit();draw();}); if(window.ResizeObserver){ new ResizeObserver(()=>{fit();draw();}).observe(canvas); }
    if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw); fit(); update();
  }

  mount('v46');
})();
