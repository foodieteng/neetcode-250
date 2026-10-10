/* ============================================================
   P131 · Palindrome Partitioning — end 從 start 往右延伸,是回文才切 · viz
     void dfs(ans, path, s, start) {
         if (start >= s.size()) { ans.push_back(path); return; }
         for (int end = start; end < s.size(); end++) {
             if (isPalindrome(s, start, end)) {
                 int L = end - start + 1;
                 path.push_back(s.substr(start, L));
                 dfs(ans, path, s, end + 1);
                 path.pop_back();
             }
         }
     }
   s = "aab"(g++ 實跑 trace,見 facts「Trace aab」)
     #1 dfs(0):"a" T → #2 dfs(1):"a" T → #3 dfs(2):"b" T → #4 dfs(3) 收 ans#1 [a,a,b]
               pop → pop → #2 的 "ab" F → pop
               "aa" T → #5 dfs(2):"b" T → #6 dfs(3) 收 ans#2 [aa,b] → pop → pop
               "aab" F
     共 6 次 dfs、7 次 isPalindrome、2 個答案。
   BAND 1 s 的三格(紅 = s[start..end] 候選,藍 / 米 = path 已切好的段,| = 切點)+ 右側回文檢查結果
   BAND 2 遞迴樹(#1..#6 = dfs 呼叫順序;粉虛線 = 不是回文、沒遞迴)
   BAND 3 path(push / pop)+ ans(2 格)  BAND 4 這一步(哪一行跑了)
   前綴 v131- 。
   ============================================================ */
(function () {
  const C = { paper:'#ffffff', ink:'#1f1f1f', dim:'#5a5a5a', off:'#cfcfcf',
    up:'#e3edf5', low:'#f6ead8',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424',
    good:'#d9e8c7', bad:'#f0d4d4', deep:'#a31d1d', gray:'#ececec' };
  const MONO = '"JetBrains Mono", monospace', SANS = '"Noto Sans TC", sans-serif';
  const S = 'aab', N = 3;

  /* 樹節點。no = dfs 呼叫編號;ghost = 不是回文、沒遞迴的候選;ans = 收進第幾個答案 */
  const T = [
    { par:-1, lvl:0, px:330, piece:'',    no:1, st:0, path:[] },
    { par:0,  lvl:1, px:160, piece:'a',   no:2, st:1, path:['a'] },
    { par:1,  lvl:2, px:96,  piece:'a',   no:3, st:2, path:['a','a'] },
    { par:2,  lvl:3, px:96,  piece:'b',   no:4, st:3, path:['a','a','b'], ans:1 },
    { par:1,  lvl:2, px:232, piece:'ab',  ghost:true },
    { par:0,  lvl:1, px:400, piece:'aa',  no:5, st:2, path:['aa'] },
    { par:5,  lvl:2, px:400, piece:'b',   no:6, st:3, path:['aa','b'], ans:2 },
    { par:0,  lvl:1, px:548, piece:'aab', ghost:true },
  ];
  const PS = p => '[' + p.join(',') + ']';

  /* 步驟。k:'init'|'chk'|'col'|'pop'|'fin'
     run = 正在跑的那層 dfs(節點 id);cur = 這一步亮紅的節點;add = 這一步新出現的節點
     st = start;win = [start,end](chk);ok = 回文與否;path = 這一步結束時的 path;popped = 剛 pop 掉的段 */
  const STEPS = [
    { k:'init', run:0, cur:0, add:0, st:0, path:[], dfs:1, chk:0, ans:0,
      text:'<strong>INITIAL · #1 dfs(start = 0)</strong> · <code>s = "aab"</code>、<code>path = []</code>。for 迴圈讓 <code>end</code> 從 <code>start</code> 往右延伸:<code>s[start..end]</code> 是回文才切下來 push、遞迴 <code>dfs(end + 1)</code>,回來再 pop。' },
    { k:'chk', run:1, cur:1, add:1, st:0, win:[0,0], ok:true, path:['a'], dfs:2, chk:1, ans:0,
      text:'<strong>檢查 1 · s[0..0] = "a" 是回文</strong> · 單一字元一定是回文 → <code>path.push_back("a")</code>,遞迴 <b>#2 dfs(1)</b>:剩下的 "ab" 交給下一層去切。' },
    { k:'chk', run:2, cur:2, add:2, st:1, win:[1,1], ok:true, path:['a','a'], dfs:3, chk:2, ans:0,
      text:'<strong>檢查 2 · s[1..1] = "a" 是回文</strong> · #2 的 <code>end = 1</code> → push "a",path = [a,a],遞迴 <b>#3 dfs(2)</b>。' },
    { k:'chk', run:3, cur:3, add:3, st:2, win:[2,2], ok:true, path:['a','a','b'], dfs:4, chk:3, ans:0,
      text:'<strong>檢查 3 · s[2..2] = "b" 是回文</strong> · push "b",path = [a,a,b],遞迴 <b>#4 dfs(3)</b>。' },
    { k:'col', run:3, cur:3, st:3, path:['a','a','b'], dfs:4, chk:3, ans:1,
      text:'<strong>#4 · start = 3 ≥ s.size() → 收 ans#1</strong> · 整個字串都切完了,<code>ans.push_back(path)</code> 收下 <code>[a,a,b]</code>,return。' },
    { k:'pop', run:2, cur:2, st:2, path:['a','a'], popped:'b', dfs:4, chk:3, ans:1, loopEnd:true,
      text:'<strong>pop · 回到 #3</strong> · <code>path.pop_back()</code> 拿掉 "b" → [a,a]。#3 的 <code>end++</code> 變成 3,迴圈結束,#3 return。' },
    { k:'pop', run:1, cur:1, st:1, path:['a'], popped:'a', dfs:4, chk:3, ans:1,
      text:'<strong>pop · 回到 #2</strong> · 拿掉第二個 "a" → path = [a]。#2 的迴圈繼續:<code>end = 2</code>,試更長的一段。' },
    { k:'chk', run:1, cur:4, add:4, st:1, win:[1,2], ok:false, path:['a'], dfs:4, chk:4, ans:1,
      text:'<strong>檢查 4 · s[1..2] = "ab" 不是回文</strong> · 頭 a ≠ 尾 b → 不切、不遞迴,直接 <code>end++</code>。end = 3 超出,#2 的迴圈結束,return。' },
    { k:'pop', run:0, cur:0, st:0, path:[], popped:'a', dfs:4, chk:4, ans:1,
      text:'<strong>pop · 回到 #1</strong> · 拿掉 "a" → path = []。「第一段切 1 個字」的整棵子樹試完了;#1 的 <code>end = 1</code>,把第一段延長。' },
    { k:'chk', run:5, cur:5, add:5, st:0, win:[0,1], ok:true, path:['aa'], dfs:5, chk:5, ans:1,
      text:'<strong>檢查 5 · s[0..1] = "aa" 是回文</strong> · <code>L = 1 − 0 + 1 = 2</code>,push "aa",遞迴 <b>#5 dfs(2)</b>:剩下 "b"。' },
    { k:'chk', run:6, cur:6, add:6, st:2, win:[2,2], ok:true, path:['aa','b'], dfs:6, chk:6, ans:1,
      text:'<strong>檢查 6 · s[2..2] = "b" 是回文</strong> · push "b",path = [aa,b],遞迴 <b>#6 dfs(3)</b>。' },
    { k:'col', run:6, cur:6, st:3, path:['aa','b'], dfs:6, chk:6, ans:2,
      text:'<strong>#6 · start = 3 ≥ s.size() → 收 ans#2</strong> · 收下 <code>[aa,b]</code>,return。' },
    { k:'pop', run:5, cur:5, st:2, path:['aa'], popped:'b', dfs:6, chk:6, ans:2, loopEnd:true,
      text:'<strong>pop · 回到 #5</strong> · 拿掉 "b" → [aa]。#5 的 <code>end = 3</code>,迴圈結束,return。' },
    { k:'pop', run:0, cur:0, st:0, path:[], popped:'aa', dfs:6, chk:6, ans:2,
      text:'<strong>pop · 回到 #1</strong> · 拿掉 "aa" → path = []。#1 的 <code>end = 2</code>:第一段延長成整串。' },
    { k:'chk', run:0, cur:7, add:7, st:0, win:[0,2], ok:false, path:[], dfs:6, chk:7, ans:2,
      text:'<strong>檢查 7 · s[0..2] = "aab" 不是回文</strong> · 頭 a ≠ 尾 b → 跳過。end = 3,#1 的迴圈結束 —— 整個遞迴做完。' },
    { k:'fin', run:-1, cur:-1, st:-1, path:[], dfs:6, chk:7, ans:2,
      text:'<strong>完成 · ans = [[a,a,b],[aa,b]]</strong> · <b>6 次 dfs、7 次回文檢查</b>,2 個答案。<code>end</code> 先試最短 → 切得最細的 [a,a,b] 先收;被跳過的 "ab"、"aab" 都沒有往下遞迴。' },
  ];
  // 每個節點第一次出現在哪一步
  const APPEAR = T.map(() => Infinity); APPEAR[0] = 0;
  STEPS.forEach((s, k) => { if (s.add !== undefined && APPEAR[s.add] === Infinity) APPEAR[s.add] = k; });
  const ANS = [T[3].path, T[6].path];

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
    function rect(x,y,w,h,fill,stroke,lw,dash){ ctx.fillStyle=fill; ctx.fillRect(x,y,w,h); ctx.lineWidth=lw||1.4; if(dash) ctx.setLineDash(dash); ctx.strokeStyle=stroke; ctx.strokeRect(x,y,w,h); ctx.setLineDash([]); }
    function txt(s,x,y,color,font,align,base){ ctx.fillStyle=color; ctx.font=font; ctx.textAlign=align||'center'; ctx.textBaseline=base||'middle'; ctx.fillText(s,x,y); }
    function head(s,x,y){ txt(s,x,y,C.dim,'600 12px '+MONO+', '+SANS,'left','alphabetic'); }
    function line(x1,y1,x2,y2,color,lw,dash){ ctx.strokeStyle=color; ctx.lineWidth=lw; if(dash) ctx.setLineDash(dash); ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); ctx.setLineDash([]); }
    const F = (wt, sz) => wt + ' ' + sz + 'px ' + MONO + ', ' + SANS;
    function fitTxt(s, x, y, color, wt, sz, maxW, align){ let f = sz; ctx.font = F(wt, f);
      while (f > 9.5 && ctx.measureText(s).width > maxW) { f -= 0.5; ctx.font = F(wt, f); }
      txt(s, x, y, color, F(wt, f), align); }
    function strike(x1, x2, y, col){ line(x1, y, x2, y, col, 1.6); }

    function draw(){
      fit();
      const s = steps[step], w = canvas.clientWidth, H = canvas.clientHeight, PAD = 22;
      ctx.fillStyle = C.paper; ctx.fillRect(0,0,w,H); ctx.setLineDash([]);
      const X = px => px * w / 620;
      const fin = s.k === 'fin';
      const pathPieces = s.path;                      // 這一步結束時的 path
      // band 1 要畫的「已切好」:chk 成功時 window 是剛 push 的那段,已切好 = 前面幾段
      const committed = (s.k === 'chk' && s.ok) ? pathPieces.slice(0, -1) : (fin ? ANS[0] : pathPieces);

      /* ---- BAND 1 · s ---- */
      head('BAND 1 · s = "aab"   紅 = s[start..end] 候選   藍 / 米 = path 已切好的段   | = 切點', PAD, 16);
      const cTop = 58, cH = 44, cW = Math.max(56, X(60)), sx0 = Math.max(PAD + 36, X(62));
      const cx = i => sx0 + i * cW;
      txt('s', PAD, cTop + cH/2 + 1, C.ink, '700 14px ' + MONO, 'left');
      // 已切好的段:交替藍 / 米
      const segs = []; { let p = 0; committed.forEach((pc, k) => { segs.push({ a:p, b:p + pc.length - 1, k }); p += pc.length; }); }
      const segOf = i => segs.find(g => g.a <= i && i <= g.b);
      const win = s.win || null;
      const inWin = i => win && win[0] <= i && i <= win[1];
      const popA = s.popped ? committed.join('').length : -1, popB = s.popped ? popA + s.popped.length - 1 : -1;
      for (let i = 0; i < N; i++) {
        const g = segOf(i);
        let fill = C.paper, st = C.ink, lw = 1.4, tc = C.ink;
        if (g) fill = fin ? C.good : (g.k % 2 ? C.low : C.up);
        if (s.popped && i >= popA && i <= popB) { fill = C.bad; tc = C.deep; }
        if (inWin(i)) { fill = s.ok ? C.cur : C.bad; tc = s.ok ? C.curT : C.deep; }
        rect(cx(i), cTop, cW, cH, fill, st, lw);
        txt(S[i], cx(i) + cW/2, cTop + cH/2 + 1, tc, F(700, 20));
      }
      // 第 3 格(= s.size(),虛的)
      const atEnd = s.st === N;
      box(cx(N) + 6, cTop + 4, cW - 6, cH - 8, atEnd ? C.good : C.paper, atEnd ? C.curS : C.off, atEnd ? 2.2 : 1.1, [3,3]);
      txt(atEnd ? '切完' : '', cx(N) + 3 + cW/2, cTop + cH/2 + 1, C.ink, '700 12px ' + SANS);
      // index 列
      for (let i = 0; i <= N; i++) {
        const isS = i === s.st, isE = win && i === win[1];
        txt(i === N ? '3 = size' : String(i), (i === N ? cx(N) + 3 : cx(i)) + cW/2, 38,
            (isS || isE) ? C.curT : (i === N ? C.off : C.dim), F(isS || isE ? 700 : 600, i === N ? 10.5 : 12));
      }
      // 候選窗框 / pop 掉的段虛框
      if (win) {
        const x1 = cx(win[0]), x2 = cx(win[1] + 1);
        ctx.lineWidth = 3; ctx.strokeStyle = s.ok ? C.curS : C.deep; ctx.strokeRect(x1 + 1.5, cTop + 1.5, x2 - x1 - 3, cH - 3);
      }
      if (s.popped) {
        const x1 = cx(popA), x2 = cx(popB + 1);
        ctx.setLineDash([5,3]); ctx.lineWidth = 2.2; ctx.strokeStyle = C.deep; ctx.strokeRect(x1 + 2, cTop + 2, x2 - x1 - 4, cH - 4); ctx.setLineDash([]);
      }
      // 切點 |
      const cuts = new Set();
      segs.forEach(g => { if (g.a > 0) cuts.add(g.a); cuts.add(g.b + 1); });
      if (win && win[0] > 0) cuts.add(win[0]);
      if (win) cuts.add(win[1] + 1);
      cuts.forEach(b => { if (b <= 0 || b >= N) return; const x = cx(b);
        const isWin = win && (b === win[0] || b === win[1] + 1);
        line(x, cTop - 7, x, cTop + cH + 7, isWin ? (s.ok ? C.curS : C.deep) : C.ink, 3.2, isWin && !s.ok ? [4,3] : null); });
      // start / end 標記(cells 下方)
      const my = cTop + cH + 18;
      if (fin) fitTxt('ans#1 = a | a | b   ·   ans#2 = aa | b', sx0 + 1.5 * cW, my, C.ink, 700, 11, 3 * cW + 20);
      if (s.st >= 0) {
        if (win && win[0] === win[1]) txt('start = end', cx(win[0]) + cW/2, my, C.curT, F(700, 11));
        else {
          const sxm = s.st === N ? cx(N) + 3 + cW/2 : cx(s.st) + cW/2;
          txt('start', sxm, my, C.curT, F(700, 11));
          if (win) txt('end', cx(win[1]) + cW/2, my, C.curT, F(700, 11));
        }
      }
      // 右側:這一步檢查 / 動作
      const rx = cx(N) + cW + Math.max(16, X(16)), rw = w - PAD - rx;
      let r1 = '', r2 = '', rf = C.paper, rs = C.off, rc = C.dim, rd = [3,3], rl = 1.2;
      if (s.k === 'init') { r1 = '#1 dfs(start = 0) · path = []'; r2 = 'end = 0 → 1 → 2,先試最短'; }
      else if (s.k === 'chk') {
        const sub = S.slice(win[0], win[1] + 1);
        r1 = 'isPalindrome(s, ' + win[0] + ', ' + win[1] + ')  "' + sub + '"';
        if (s.ok) { r2 = '是回文 → 切下來 push'; rf = C.good; rs = C.ink; rc = C.ink; rd = null; rl = 1.8; }
        else { r2 = '不是回文 → 跳過'; rf = C.bad; rs = C.deep; rc = C.deep; rd = null; rl = 1.8; }
      } else if (s.k === 'col') { r1 = 'start = 3 ≥ s.size()'; r2 = '切完了 → 收 ans#' + s.ans; rf = C.good; rs = C.curS; rc = C.ink; rd = null; rl = 2.2; }
      else if (s.k === 'pop') { r1 = 'path.pop_back()  拿掉 "' + s.popped + '"'; r2 = s.loopEnd ? 'end = 3 → 迴圈結束,return' : '迴圈繼續 end++'; rf = C.gray; rs = C.dim; rc = C.ink; rd = [5,3]; rl = 1.4; }
      else if (fin) { r1 = 'end 先試最短 → 切最細的先收'; r2 = 'ans = [[a,a,b],[aa,b]]'; rf = C.good; rs = C.ink; rc = C.ink; rd = null; rl = 1.8; }
      fitTxt(r1, rx, cTop + 9, fin ? C.ink : (s.k === 'init' ? C.dim : C.curT), 700, 12.5, rw, 'left');
      box(rx, cTop + 22, rw, cH - 22 + 0, rf, rs, rl, rd);
      fitTxt(r2, rx + rw/2, cTop + 22 + (cH - 22)/2 + 1, rc, 700, 12.5, rw - 16);
      // 右側第二列:計數
      const cy2 = my;
      fitTxt('dfs ' + s.dfs + ' / 6   ·   回文檢查 ' + s.chk + ' / 7', rx + rw/2, cy2, fin ? C.ink : C.dim, 700, 11.5, rw);

      /* ---- BAND 2 · 遞迴樹 ---- */
      const b2 = 154;
      head('BAND 2 · 遞迴樹   #k = 第 k 次 dfs   邊上 = 切下的那段   灰虛線 ? = 還沒走到', PAD, b2);
      const TOP = [168, 244, 320, 396], NH = 36;
      const NW = n => n.ghost ? 96 : 92;
      const tx = n => X(n.px), top = n => TOP[n.lvl], bot = n => TOP[n.lvl] + NH;
      const vis = id => APPEAR[id] <= step;
      const onPath = new Set(); for (let v = s.run; v >= 0; v = T[v].par) onPath.add(v);
      const isCur = id => id === s.cur && !fin;
      const nodeAns = id => T[id].ans && s.ans >= T[id].ans;
      // 根左右:提示 / 圖例
      const root = T[0], rL = tx(root) - NW(root)/2, rR = tx(root) + NW(root)/2;
      { const hx = PAD, hw = rL - 14 - hx;
        box(hx, TOP[0], hw, NH, C.low, C.off, 1.1, [3,3]);
        fitTxt('for end = start .. 2:短的先試', hx + hw/2, TOP[0] + NH/2 + 1, C.ink, 700, 12, hw - 14); }
      { const lx = rR + 14, lw = w - PAD - lx;
        box(lx, TOP[0], lw, NH, fin ? C.good : C.paper, fin ? C.ink : C.off, fin ? 1.6 : 1.1, fin ? null : [3,3]);
        fitTxt(fin ? '全部跑完 · 答案 2 / 2' : '正在跑:#' + T[s.run].no + ' dfs(start = ' + T[s.run].st + ')', lx + lw/2, TOP[0] + NH/2 + 1, fin ? C.ink : C.curT, 700, 12, lw - 14); }
      // 邊
      T.forEach((n, id) => {
        if (n.par < 0) return;
        const p = T[n.par];
        let col = C.ink, lw = 1.4, dash = null;
        if (!vis(id)) { col = C.off; lw = 1.1; dash = [3,4]; }
        else if (n.ghost) { col = C.deep; dash = [3,4]; lw = isCur(id) ? 2.2 : 1.4; }
        else if (onPath.has(id) && !fin) { col = C.curS; lw = 2.6; }
        line(tx(p), bot(p), tx(n), top(n), col, lw, dash);
      });
      // 邊標籤(切下的段)
      T.forEach((n, id) => {
        if (n.par < 0 || !vis(id) || n.ghost) return;
        const p = T[n.par], t = 0.5;
        const mx = tx(p) + (tx(n) - tx(p)) * t, my2 = bot(p) + (top(n) - bot(p)) * t;
        const lw = 14 + n.piece.length * 8, lh = 16, op = onPath.has(id) && !fin;
        box(mx - lw/2, my2 - lh/2, lw, lh, op ? C.cur : C.paper, op ? C.curS : C.ink, op ? 1.6 : 1);
        txt('"' + n.piece + '"', mx, my2 + 1, op ? C.curT : C.ink, F(700, 10.5));
      });
      // 節點
      T.forEach((n, id) => {
        const x = tx(n), y = top(n), nw = NW(n), cu = isCur(id);
        if (!vis(id)) { box(x - nw/2, y, nw, NH, C.paper, C.off, 1.1, [3,3]); txt('?', x, y + NH/2 + 1, C.off, F(700, 13)); return; }
        if (n.ghost) {
          box(x - nw/2, y, nw, NH, C.bad, cu ? C.curS : C.deep, cu ? 2.6 : 1.5, [5,3]);
          txt('"' + n.piece + '"', x, y + 12, C.deep, F(700, 11));
          txt('不是回文', x, y + 27, C.deep, '700 10.5px ' + SANS);
          return;
        }
        const isAns = nodeAns(id);
        let fill = isAns ? C.good : C.up, st = C.ink, lw = 1.4, tc = C.ink, sc = C.dim;
        if (onPath.has(id) && !fin) { st = C.curS; lw = 2.2; }
        if (cu) { lw = 2.8; st = C.curS; if (!isAns) { fill = C.cur; tc = C.curT; sc = C.curT; } else { sc = C.ink; } }
        box(x - nw/2, y, nw, NH, fill, st, lw);
        txt('#' + n.no + ' dfs(' + n.st + ')', x, y + 12, tc, F(700, 11));
        txt(isAns ? 'ans#' + n.ans : PS(n.path), x, y + 27, isAns ? C.ink : sc, F(isAns ? 700 : 600, 10.5));
      });
      // 第 3 層右側:圖例
      { const ly = TOP[3], lx0 = X(96) + 46 + Math.max(24, X(24)), lw = w - PAD - lx0, n = 4, g = 10, iw = (lw - (n - 1) * g) / n;
        const L = [ [C.cur, C.curS, C.curT, null, '紅 = 目前這層'], [C.up, C.ink, C.ink, null, '藍 = 走過'],
                    [C.good, C.ink, C.ink, null, '綠 = 收進 ans'], [C.bad, C.deep, C.deep, [5,3], '粉虛線 = 跳過'] ];
        L.forEach((o, k) => { const x = lx0 + k * (iw + g);
          box(x, ly + 6, iw, NH - 12, o[0], o[1], 1.4, o[3]);
          fitTxt(o[4], x + iw/2, ly + NH/2 + 1, o[2], 700, 11, iw - 10); }); }

      /* ---- BAND 3 · path / ans ---- */
      const b3 = 460;
      head('BAND 3 · path(push / pop)與 ans   紅 = 剛 push   粉虛線 = 剛 pop', PAD, b3);
      const py = b3 + 12, ph = 42, px0 = PAD + 44, pw = X(70), pg = X(8);
      txt('path', PAD, py + ph/2 + 1, C.ink, '700 13px ' + MONO, 'left');
      const pushed = s.k === 'chk' && s.ok;
      for (let j = 0; j < 3; j++) {
        const x = px0 + j * (pw + pg), has = j < pathPieces.length;
        const isNew = pushed && j === pathPieces.length - 1, isPop = s.popped && j === pathPieces.length;
        let fill = C.paper, st = C.off, lw = 1.1, dash = [3,3], tc = C.off, val = '—', cap = 'path[' + j + ']', cc = C.off;
        if (has) { fill = j % 2 ? C.low : C.up; st = C.ink; lw = 1.4; dash = null; tc = C.ink; val = '"' + pathPieces[j] + '"'; cc = C.dim; }
        if (isNew) { fill = C.cur; st = C.curS; lw = 2.6; tc = C.curT; cc = C.curT; cap = 'push'; }
        if (isPop) { fill = C.bad; st = C.deep; lw = 1.8; dash = [5,3]; tc = C.deep; cc = C.deep; val = '"' + s.popped + '"'; cap = 'pop'; }
        box(x, py, pw, ph, fill, st, lw, dash);
        txt(cap, x + pw/2, py + 12, cc, F(600, 10.5));
        txt(val, x + pw/2, py + 29, tc, F(700, 13));
        if (isPop) { ctx.font = F(700, 13); const tw = ctx.measureText(val).width; strike(x + pw/2 - tw/2 - 3, x + pw/2 + tw/2 + 3, py + 29, C.deep); }
      }
      const ax = Math.max(px0 + 3 * pw + 2 * pg + 18, X(310)), ax0 = ax + 38, ag = 10, aw = (w - PAD - ax0 - ag) / 2;
      txt('ans', ax, py + ph/2 + 1, C.ink, '700 13px ' + MONO, 'left');
      for (let j = 0; j < 2; j++) {
        const x = ax0 + j * (aw + ag), got = j < s.ans, now = s.k === 'col' && j === s.ans - 1;
        if (got) {
          box(x, py, aw, ph, C.good, now ? C.curS : C.ink, now ? 2.6 : 1.4);
          txt('ans#' + (j + 1), x + aw/2, py + 12, now ? C.curT : C.dim, F(600, 10.5));
          fitTxt(PS(ANS[j]), x + aw/2, py + 29, C.ink, 700, 13, aw - 12);
        } else {
          box(x, py, aw, ph, C.paper, C.off, 1.1, [3,3]);
          txt('ans#' + (j + 1), x + aw/2, py + 12, C.off, F(600, 10.5));
          txt('—', x + aw/2, py + 29, C.off, F(600, 13));
        }
      }

      /* ---- BAND 4 · 這一步 ---- */
      const b4 = 538;
      head('BAND 4 · 這一步(哪一行跑了)', PAD, b4);
      const by = b4 + 12, bh = 32, inner = w - 2*PAD, w1 = Math.round(inner * 0.42), w2 = inner - w1 - 10;
      let t1 = '', t2 = '', f2 = C.paper, s2 = C.off, d2 = [3,3], c2 = C.dim, l2 = 1.4;
      if (s.k === 'init') { t1 = 'dfs(ans, path, s, 0);'; t2 = '#1 · start = 0 · path = []'; }
      else if (s.k === 'chk') {
        t1 = 'if (isPalindrome(s, ' + win[0] + ', ' + win[1] + '))';
        if (s.ok) { const pc = S.slice(win[0], win[1] + 1); t2 = 'true → push_back("' + pc + '") → #' + T[s.run].no + ' dfs(' + (win[1] + 1) + ')';
          f2 = C.cur; s2 = C.curS; c2 = C.curT; d2 = null; l2 = 2.2; }
        else { t2 = 'false → 不切、不遞迴,end++'; f2 = C.bad; s2 = C.deep; c2 = C.deep; d2 = null; l2 = 2.2; }
      } else if (s.k === 'col') { t1 = 'if (start >= s.size())'; t2 = 'ans.push_back(' + PS(s.path) + '); return;'; f2 = C.good; s2 = C.curS; c2 = C.ink; d2 = null; l2 = 2.2; }
      else if (s.k === 'pop') { t1 = 'path.pop_back();'; t2 = '回到 #' + T[s.run].no + ' · path = ' + PS(s.path); f2 = C.gray; s2 = C.dim; c2 = C.ink; d2 = [5,3]; l2 = 1.8; }
      else if (fin) { t1 = '#1 的迴圈跑完 → return'; t2 = '6 次 dfs、7 次回文檢查'; f2 = C.good; s2 = C.ink; c2 = C.ink; d2 = null; l2 = 2; }
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

  mount('v131', STEPS);
})();
