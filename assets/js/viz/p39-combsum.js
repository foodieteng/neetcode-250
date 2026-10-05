/* ============================================================
   P39 · Combination Sum — 回溯 + 排序後 break · viz(一個動畫)
     if (res == target) { ans.push_back(path); return; }
     for (int i = s; i < candidates.size(); i++) {
         if (res + candidates[i] > target) break;
         path.push_back(candidates[i]);
         dfs(candidates, ans, path, res + candidates[i], target, i);
         path.pop_back();
     }
   candidates = [2,3,6,7], target = 7 → [[2,2,3],[7]](g++ 實跑 trace,見 FACTS)
     10 次呼叫、7 次 break;每次呼叫 / 每次 break 各一步
   BAND 1 遞迴樹(節點 = path · sum · s,✕ = break 的那一格)
   BAND 2 candidates + 迴圈範圍 i = s..3 / break 點
   BAND 3 ans / BAND 4 這一步(sum + c[i] vs target)
   前綴 v39- 。
   ============================================================ */
(function () {
  const C = { paper:'#ffffff', ink:'#1f1f1f', dim:'#5a5a5a', off:'#cfcfcf',
    up:'#e3edf5', low:'#f6ead8',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424',
    good:'#d9e8c7', bad:'#f0d4d4', deep:'#a31d1d' };
  const MONO = '"JetBrains Mono", monospace', SANS = '"Noto Sans TC", sans-serif';
  const CAND = [2, 3, 6, 7], N = 4, TARGET = 7;

  /* 樹的項目,依 trace 順序(= 動畫事件順序)。
     k:'call' 呼叫 / 'brk' break;par:父呼叫;lvl:層;px:在 620px 設計寬度下的中心 x;
     call:path, sum, s, ans;brk:i(break 時的 i),c = candidates[i] */
  const T = [
    { k:'call', path:[],      sum:0, s:0, par:-1, lvl:0, px:350 },
    { k:'call', path:[2],     sum:2, s:0, par:0,  lvl:1, px:210 },
    { k:'call', path:[2,2],   sum:4, s:0, par:1,  lvl:2, px:126 },
    { k:'call', path:[2,2,2], sum:6, s:0, par:2,  lvl:3, px:46 },
    { k:'brk',  i:0, par:3,  lvl:4, px:58 },
    { k:'call', path:[2,2,3], sum:7, s:1, par:2,  lvl:3, px:130, ans:true },
    { k:'brk',  i:2, par:2,  lvl:3, px:218 },
    { k:'call', path:[2,3],   sum:5, s:1, par:1,  lvl:2, px:210 },
    { k:'brk',  i:1, par:7,  lvl:3, px:308 },
    { k:'brk',  i:2, par:1,  lvl:2, px:297 },
    { k:'call', path:[3],     sum:3, s:1, par:0,  lvl:1, px:400 },
    { k:'call', path:[3,3],   sum:6, s:1, par:10, lvl:2, px:384 },
    { k:'brk',  i:1, par:11, lvl:3, px:398 },
    { k:'brk',  i:2, par:10, lvl:2, px:471 },
    { k:'call', path:[6],     sum:6, s:2, par:0,  lvl:1, px:488 },
    { k:'brk',  i:2, par:14, lvl:2, px:562 },
    { k:'call', path:[7],     sum:7, s:3, par:0,  lvl:1, px:574, ans:true },
  ];
  // 每個項目「是從父節點的哪個 i 長出來的」:call 由 path 最後一個數決定,brk 自己帶 i
  T.forEach(n => {
    if (n.k === 'call' && n.par >= 0) n.via = CAND.indexOf(n.path[n.path.length - 1]);
    if (n.k === 'brk') {
      const p = T[n.par]; n.via = n.i; n.base = p.sum; n.tot = p.sum + CAND[n.i];
      n.skip = CAND.slice(n.i + 1);
    }
  });
  const pathStr = p => '[' + p.join(',') + ']';
  const CALLS = T.filter(n => n.k === 'call').length, BRKS = T.length - CALLS;

  const LABELS = [
    '<strong>call #1 · [] · sum 0 · s = 0</strong> · <code>0 ≠ 7</code>,進迴圈 <code>i = 0..3</code>:2、3、6、7 都可能是第一個數。',
    '<strong>call #2 · [2] · sum 2</strong> · <code>i = 0</code>:<code>0 + 2 = 2 ≤ 7</code>,push 2,<code>dfs(..., i)</code>。<b>傳的是 i 不是 i+1</b> → 孩子的 s 還是 0,下一個數可以再選 2。',
    '<strong>call #3 · [2,2] · sum 4</strong> · 又選 2:<code>2 + 2 = 4 ≤ 7</code>。同一個數用第二次 —— 這就是傳 <code>i</code> 允許的「重複選」。',
    '<strong>call #4 · [2,2,2] · sum 6</strong> · 第三個 2:<code>4 + 2 = 6 ≤ 7</code>。s 仍是 0,迴圈從 <code>c[0] = 2</code> 開始試。',
    '<strong>break · 在 [2,2,2]</strong> · <code>i = 0</code>:<code>6 + 2 = 8 &gt; 7</code> → <b>break</b>。陣列排序過,最小的 2 都超過了,後面的 3、6、7 只會更大 → <b>整個迴圈直接結束,3,6,7 不用試</b>。return 回 [2,2]。',
    '<strong>call #5 · [2,2,3] · sum 7 ✓</strong> · 回到 [2,2] 的 <code>i = 1</code>:<code>4 + 3 = 7 ≤ 7</code>,傳 <code>s = 1</code>。進來 <code>res == target</code> → <b>ans 收下 [2,2,3]</b>,直接 return,不跑迴圈。',
    '<strong>break · 在 [2,2]</strong> · <code>i = 2</code>:<code>4 + 6 = 10 &gt; 7</code> → break,<b>7 不用試</b>。[2,2] 的迴圈結束,回到 [2]。',
    '<strong>call #6 · [2,3] · sum 5 · s = 1</strong> · [2] 的 <code>i = 1</code>:<code>2 + 3 = 5 ≤ 7</code>。<b>s = 1:孩子只能從 3 開始</b>,不會長出 [2,3,2] —— 它和 [2,2,3] 是同一組。',
    '<strong>break · 在 [2,3]</strong> · <code>i = 1</code>:<code>5 + 3 = 8 &gt; 7</code> → break,6、7 不用試。[2,3] 一個孩子都沒有。',
    '<strong>break · 在 [2]</strong> · 回到 [2] 的 <code>i = 2</code>:<code>2 + 6 = 8 &gt; 7</code> → break,7 不用試。以 2 開頭的組合全部找完。',
    '<strong>call #7 · [3] · sum 3 · s = 1</strong> · 根的 <code>i = 1</code>:<code>0 + 3 = 3 ≤ 7</code>。s = 1 → 這棵子樹<b>不會再出現 2</b>(含 2 的組合左邊都找過了)。',
    '<strong>call #8 · [3,3] · sum 6</strong> · 又選 3(傳 <code>i = 1</code>):<code>3 + 3 = 6 ≤ 7</code>。',
    '<strong>break · 在 [3,3]</strong> · <code>i = 1</code>:<code>6 + 3 = 9 &gt; 7</code> → break,6、7 不用試。',
    '<strong>break · 在 [3]</strong> · <code>i = 2</code>:<code>3 + 6 = 9 &gt; 7</code> → break,7 不用試。',
    '<strong>call #9 · [6] · sum 6 · s = 2</strong> · 根的 <code>i = 2</code>:<code>0 + 6 = 6 ≤ 7</code>。孩子只能從 6 開始。',
    '<strong>break · 在 [6]</strong> · <code>i = 2</code>:<code>6 + 6 = 12 &gt; 7</code> → break,7 不用試。[6] 沒有孩子。',
    '<strong>call #10 · [7] · sum 7 ✓</strong> · 根的 <code>i = 3</code>:<code>0 + 7 = 7 ≤ 7</code>。<code>res == target</code> → <b>ans 收下 [7]</b>。i = 3 是根的最後一圈,整棵樹走完。',
  ];

  /* vis:已發生幾個事件(含目前);cur:目前事件(-1 = 沒有) */
  const STEPS = [{ vis:0, cur:-1, text:'<strong>INITIAL</strong> · <code>candidates = [2,3,6,7]</code>(已排序),<code>target = 7</code>。每個節點 = 一次 dfs,寫著 path、sum 和 s。兩個重點:<b>① 遞迴傳 <code>i</code> 不是 <code>i+1</code></b>,孩子可以再選同一個數;<b>② 排序後 <code>sum + c[i] &gt; target</code> 就 break</b>,後面更大的都不用試。' }];
  T.forEach((n, e) => STEPS.push({ vis:e + 1, cur:e, text:LABELS[e] }));
  STEPS.push({ vis:T.length, cur:-1, text:'<strong>完成 · ans = [[2,2,3],[7]]</strong> · 10 次呼叫、7 次 break。<b>傳 i</b> 讓同一個數能重複選、又不會回頭選比較小的(不會有 [3,2,2]);<b>break</b> 一碰到超過,就把這個迴圈剩下的候選一起砍掉 —— 前提是先排序。' });

  function mount(prefix, steps) {
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
      const s = steps[step], w = canvas.clientWidth, H = canvas.clientHeight, PAD = 22, inner = w - 2*PAD;
      ctx.fillStyle = C.paper; ctx.fillRect(0,0,w,H); ctx.setLineDash([]);
      const final = s.cur < 0 && s.vis === T.length;
      const ev = s.cur >= 0 ? T[s.cur] : null;
      const callId = ev ? (ev.k === 'call' ? s.cur : ev.par) : -1;   // 目前在跑的那一層 dfs
      const onPath = new Set(); for (let v = callId; v >= 0; v = T[v].par) onPath.add(v);
      const nCalls = T.slice(0, s.vis).filter(n => n.k === 'call').length, nBrk = s.vis - nCalls;

      /* ---- BAND 1 · 遞迴樹 ---- */
      head('BAND 1 · 遞迴樹   紅 = 目前   綠 ✓ = 答案   深紅 ✕ = break   虛線 = 還沒', PAD, 16);
      const L = 14, X = px => L + (px - L) * (w - 2*L) / (620 - 2*L);
      const TOP = [30, 106, 182, 258, 334], NW = 72, NH = 38, SW = 78, SH = 36, TL = 0.55;
      const cx = n => X(n.px), top = n => TOP[n.lvl];
      const bot = n => top(n) + (n.k === 'brk' ? SH : NH);
      const seen = id => id < s.vis;
      // 邊
      T.forEach((n, id) => {
        if (n.par < 0) return;
        const p = T[n.par], red = onPath.has(id) || id === s.cur;
        let col = seen(id) ? C.ink : C.off, lw = 1.4, dash = seen(id) ? null : [4,4];
        if (n.k === 'brk' && seen(id)) { col = C.deep; dash = [4,3]; lw = id === s.cur ? 2.2 : 1.4; }
        else if (red) { col = C.curS; lw = 2.6; }
        line(cx(p), bot(p), cx(n), top(n), col, lw, dash);
      });
      // 邊標籤 +c
      T.forEach((n, id) => {
        if (n.par < 0) return;
        const p = T[n.par];
        const mx = cx(p) + (cx(n) - cx(p)) * TL, my = bot(p) + (top(n) - bot(p)) * TL;
        const lab = '+' + CAND[n.via], lw = 26, lh = 14, sn = seen(id);
        let fill = C.paper, st = sn ? C.ink : C.off, tc = sn ? C.ink : C.off, bw = 1, dash = sn ? null : [2,2];
        if (n.k === 'brk' && sn) { st = C.deep; tc = C.deep; if (id === s.cur) { fill = C.bad; bw = 1.6; } }
        else if (onPath.has(id)) { fill = C.cur; st = C.curS; tc = C.curT; bw = 1.6; }
        box(mx - lw/2, my - lh/2, lw, lh, fill, st, bw, dash);
        txt(lab, mx, my + 1, tc, '700 10.5px '+MONO);
      });
      // 節點 / break 小格
      T.forEach((n, id) => {
        const x = cx(n), y = top(n), sn = seen(id), isCur = id === s.cur;
        if (n.k === 'brk') {
          let fill = C.paper, st = C.off, tc = C.off, nc = C.off, lw = 1.1, dash = [3,3];
          if (sn) { st = C.deep; tc = C.deep; nc = C.dim; lw = 1.4; dash = null; }
          if (isCur) { fill = C.bad; lw = 2.4; nc = C.deep; }
          box(x - SW/2, y, SW, SH, fill, st, lw, dash);
          txt('✕ ' + n.tot + '>' + TARGET + ' break', x, y + 12, tc, '700 9.5px '+MONO+', '+SANS);
          txt(n.skip.length ? n.skip.join(',') + ' 不用試' : '後面沒了', x, y + 26, nc, '600 10px '+MONO+', '+SANS);
          return;
        }
        let fill = C.paper, st = C.off, tc = C.off, lw = 1.1, dash = [3,3], sc = C.off;
        if (sn) { fill = n.ans ? C.good : C.up; st = C.ink; tc = C.ink; sc = C.dim; lw = 1.4; dash = null; }
        if (onPath.has(id) && !isCur) { st = C.curS; lw = 2.2; }
        if (isCur) { fill = n.ans ? C.good : C.cur; st = C.curS; tc = n.ans ? C.ink : C.curT; sc = n.ans ? C.ink : C.curT; lw = 2.6; }
        box(x - NW/2, y, NW, NH, fill, st, lw, dash);
        txt(pathStr(n.path) + (n.ans && sn ? ' ✓' : ''), x, y + 13, tc, (n.ans && sn ? '700 11px ' : '700 11.5px ')+MONO+', '+SANS);
        txt('sum ' + n.sum + ' s=' + n.s, x, y + 28, sc, '600 10px '+MONO);
      });
      // 右下空位:計數
      const nx = X(130), nw = w - L - nx, ny = TOP[4] + 1, nh = SH - 2;
      const nt = final ? '10 次呼叫 · 7 次 break · 2 個答案'
                       : '已呼叫 ' + nCalls + ' / ' + CALLS + ' 次 · break ' + nBrk + ' / ' + BRKS + ' 次 · 節點下排 s = 孩子從 c[s] 開始';
      box(nx, ny, nw, nh, final ? C.good : C.paper, final ? C.ink : C.off, 1.4, final ? null : [3,3]);
      txt(nt, nx + nw/2, ny + nh/2 + 1, final ? C.ink : C.dim, '700 11.5px '+MONO+', '+SANS);

      /* ---- BAND 2 · candidates ---- */
      const b2 = 400;
      head('BAND 2 · candidates   紅 = 這層迴圈 i = s..3   深紅 = break 的 i   虛線 = 不用試', PAD, b2);
      const cy0 = b2 + 14, ch0 = 30, cw0 = 58, cg0 = 10;
      const callN = callId >= 0 ? T[callId] : null;
      for (let i = 0; i < N; i++) {
        const x = PAD + i*(cw0 + cg0);
        let fill = C.paper, st = C.ink, tc = C.ink, ic = C.dim, lw = 1.4, dash = null, strike = false;
        if (ev && ev.k === 'brk') {
          const ss = callN.s;
          if (i < ss) { st = C.off; tc = C.off; ic = C.off; dash = [3,3]; lw = 1.1; }
          else if (i < ev.i) { fill = C.up; }
          else if (i === ev.i) { fill = C.bad; st = C.deep; tc = C.deep; ic = C.deep; lw = 2.4; }
          else { st = C.off; tc = C.off; ic = C.off; dash = [3,3]; lw = 1.1; strike = true; }
        } else if (ev && ev.k === 'call') {
          if (ev.ans || i < ev.s) { st = C.off; tc = C.off; ic = C.off; dash = [3,3]; lw = 1.1; }
          else { fill = C.cur; st = C.curS; tc = C.curT; ic = C.curT; lw = 2.4; }
        }
        box(x, cy0, cw0, ch0, fill, st, lw, dash);
        txt('[' + i + ']', x + 9, cy0 + ch0/2 + 1, ic, '600 11px '+MONO, 'left');
        txt(String(CAND[i]), x + cw0 - 12, cy0 + ch0/2 + 1, tc, '700 15px '+MONO, 'right');
        if (strike) line(x + 6, cy0 + ch0/2, x + cw0 - 6, cy0 + ch0/2, C.deep, 1.4);
      }
      const tx = PAD + N*(cw0 + cg0) + 6;
      let lt = '已排序:越往右越大 → 一超過就 break', lc = C.dim;
      if (ev && ev.k === 'brk') {
        lt = 'i = ' + ev.i + ' 就超過 → break' + (ev.skip.length ? ',' + ev.skip.join(',') + ' 不用試' : '');
        lc = C.deep;
      } else if (ev && ev.ans) { lt = 'res == target → return,不跑迴圈'; lc = C.ink; }
      else if (ev) { lt = 's = ' + ev.s + ' → for i = ' + ev.s + '..3,可再選 ' + CAND[ev.s]; lc = C.curT; }
      else if (final) { lt = '7 次 break 省下 11 次「不用試」'; lc = C.ink; }
      txt(lt, tx, cy0 + ch0/2 + 1, lc, '700 12px '+MONO+', '+SANS, 'left');

      /* ---- BAND 3 · ans ---- */
      const b3 = 470;
      head('BAND 3 · ans', PAD, b3);
      const ay = b3 + 14, ah = 30;
      txt('ans =', PAD, ay + ah/2 + 1, C.ink, '700 13px '+MONO, 'left');
      const got = T.slice(0, s.vis).map((n, id) => ({ n, id })).filter(o => o.n.ans);
      let ax = PAD + 56;
      if (!got.length) {
        box(ax, ay, 150, ah, C.paper, C.off, 1.1, [3,3]);
        txt('還沒有答案', ax + 75, ay + ah/2 + 1, C.dim, '600 12px '+MONO+', '+SANS);
      }
      got.forEach(o => {
        const lab = pathStr(o.n.path) + ' ✓', bw = 86, isCur = o.id === s.cur;
        box(ax, ay, bw, ah, C.good, isCur ? C.curS : C.ink, isCur ? 2.6 : 1.4);
        txt(lab, ax + bw/2, ay + ah/2 + 1, C.ink, '700 12.5px '+MONO+', '+SANS);
        ax += bw + 12;
      });
      const at = final ? '2 組 = [[2,2,3],[7]]' : '只有 sum == 7 的節點會進 ans';
      txt(at, w - PAD, ay + ah/2 + 1, final ? C.ink : C.dim, '700 12px '+MONO+', '+SANS, 'right');

      /* ---- BAND 4 · 這一步 ---- */
      const b4 = 540;
      head('BAND 4 · 這一步   sum + c[i] vs target', PAD, b4);
      const by = b4 + 12, bh = 32, w1 = Math.round(inner * 0.5), w2 = inner - w1 - 10;
      let t1 = 'dfs(path=[], sum=0, s=0) 從根開始', t2 = 'target = 7', f2 = C.paper, s2 = C.off, d2 = [3,3], c2 = C.dim, l2 = 1.4;
      if (ev && ev.k === 'call') {
        t1 = 'dfs(path=' + pathStr(ev.path) + ', sum=' + ev.sum + ', s=' + ev.s + ')';
        if (ev.par < 0) { t2 = 'sum 0 ≠ 7 → 進迴圈'; }
        else {
          const p = T[ev.par], c = CAND[ev.via];
          t2 = p.sum + ' + ' + c + ' = ' + ev.sum + (ev.sum === TARGET ? ' == 7 → ans ✓' : ' ≤ 7 → 往下');
        }
        f2 = ev.ans ? C.good : C.cur; s2 = C.curS; d2 = null; c2 = ev.ans ? C.ink : C.curT; l2 = 2.2;
      } else if (ev) {
        const p = T[ev.par];
        t1 = '在 ' + pathStr(p.path) + ' 的迴圈 · i = ' + ev.i + ' · c[i] = ' + CAND[ev.i];
        t2 = ev.base + ' + ' + CAND[ev.i] + ' = ' + ev.tot + ' > 7 → break';
        f2 = C.bad; s2 = C.deep; d2 = null; c2 = C.deep; l2 = 2.2;
      } else if (final) {
        t1 = '10 次呼叫 · 7 次 break';
        t2 = 'ans = [[2,2,3],[7]]'; f2 = C.good; s2 = C.ink; d2 = null; c2 = C.ink;
      }
      box(PAD, by, w1, bh, C.paper, C.ink, 1.4);
      txt(t1, PAD + 12, by + bh/2 + 1, C.ink, '700 12px '+MONO+', '+SANS, 'left');
      box(PAD + w1 + 10, by, w2, bh, f2, s2, l2, d2);
      txt(t2, PAD + w1 + 10 + w2/2, by + bh/2 + 1, c2, '700 12.5px '+MONO+', '+SANS);
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

  mount('v39', STEPS);
})();
