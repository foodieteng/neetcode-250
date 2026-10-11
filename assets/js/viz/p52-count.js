/* ============================================================
   P52 · N-Queens II — 和 51 同一棵搜尋樹,只是走到 r == n 不存棋盤,ans += 1 · viz
     if (r == n) { ans += 1; return; }
     for (int c = 0; c < n; c++) {
         if (row[r] || col[c] || diag1[r + c] || diag2[r - c + n - 1]) continue;
         row[r] = col[c] = diag1[r + c] = diag2[r - c + n - 1] = true;
         dfs(n, r + 1, ans, row, col, diag1, diag2);
         row[r] = col[c] = diag1[r + c] = diag2[r - c + n - 1] = false;
     }
   n = 4(g++ 實跑 trace):17 次 dfs、16 次放置、2 個解;r0 放 c0/c1/c2/c3 各貢獻 0/1/1/0。
   這支動畫看的是「計數」:
     樹上每個節點 = 一次放置 (r,c),深度 = 列;節點做完後掛上「這棵子樹數到幾個」。
     子樹個數 = 子節點個數相加;葉子:放完第 3 列 → dfs(4) 進 r == n → +1;某一列全被擋 → 0。
   步驟(28 步):INIT · 放置 ×16 · r==n ans+=1 ×2 · 死路 ×4 · r0 一欄做完(小計)×4 · 完成。
     中間節點「做完」不單獨成一步,併進下一步的畫面(它的小計標籤就出現)。
   BAND 1 搜尋樹(紅 = 目前路徑,綠 = 數到解,粉 × = 死路,節點右邊小格 = 子樹小計)
   BAND 2 左:棋盤(目前路徑的 Q,死路那一列標出擋住的旗標)右:ans、r0 四欄小計、左右鏡像
   BAND 3 這一步(哪一行跑了)
   前綴 v52- 。
   ============================================================ */
(function () {
  const C = { paper:'#ffffff', ink:'#1f1f1f', dim:'#5a5a5a', off:'#cfcfcf',
    up:'#e3edf5', low:'#f6ead8',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424',
    good:'#d9e8c7', bad:'#f0d4d4', deep:'#a31d1d', gray:'#ececec' };
  const MONO = '"JetBrains Mono", monospace', SANS = '"Noto Sans TC", sans-serif';
  const N = 4;
  const GL = { col:'欄', d1:'／', d2:'＼' };

  /* ---------- 跑一次 dfs:建樹 + 切步驟 ---------- */
  function build() {
    const nodes = {};             // key(path) → { r, c, kids:[], parent, count, kind }
    const order = [];
    const col = Array(N).fill(false), d1 = Array(2*N-1).fill(false), d2 = Array(2*N-1).fill(false);
    const path = [];
    const steps = [];
    let ans = 0, calls = 0, places = 0;
    const done = {};              // key → 子樹小計(已做完的節點)
    const subtotal = Array(N).fill(null);
    const keyOf = p => p.join(',');
    function snap(o) {
      return Object.assign({ path: path.slice(), visited: order.slice(), done: Object.assign({}, done),
        ans, calls, places, subtotal: subtotal.slice() }, o);
    }
    function blockOf(r, c) { return col[c] ? 'col' : d1[r + c] ? 'd1' : d2[r - c + N - 1] ? 'd2' : null; }
    function dfs(r) {                         // 回傳這次呼叫數到的解
      calls++;
      if (r === N) { ans += 1; return 1; }
      let got = 0, placedHere = 0;
      const blocked = [];
      for (let c = 0; c < N; c++) {
        const b = blockOf(r, c);
        if (b) { blocked.push({ c, by:b }); continue; }
        placedHere++;
        path.push(c); places++;
        const k = keyOf(path);
        nodes[k] = { r, c, key:k, parent: keyOf(path.slice(0, -1)), kids: [] };
        if (path.length > 1) nodes[nodes[k].parent].kids.push(k);
        order.push(k);
        col[c] = d1[r + c] = d2[r - c + N - 1] = true;
        steps.push(snap({ k:'place', r, c, node:k, child: calls + 1 }));
        const sub = dfs(r + 1);
        if (r + 1 === N) {                     // dfs(4) 進了 base case
          done[k] = sub;
          steps.push(snap({ k:'sol', r, c, node:k }));
        }
        col[c] = d1[r + c] = d2[r - c + N - 1] = false;
        path.pop();
        done[k] = sub;
        got += sub;
        if (r === 0) { subtotal[c] = sub; steps.push(snap({ k:'root', r, c, node:k, sub })); }
      }
      if (placedHere === 0) {                  // 這一列全被擋:上一個放的節點是死路
        const k = keyOf(path);
        done[k] = 0;
        // 死路要在「還沒拿掉」時拍:path 仍含上一列的皇后
        steps.push(snap({ k:'dead', r, node:k, blocked }));
      }
      return got;
    }
    steps.push(snap({ k:'init' }));
    dfs(0);
    steps.push(snap({ k:'fin' }));
    return { steps, nodes, order };
  }

  const { steps: RAW, nodes: NODES, order: ORDER } = build();

  /* ---------- 版面:葉子依序排,父節點 = 子節點中點 ---------- */
  const LAYOUT = (function () {
    const roots = ORDER.filter(k => NODES[k].r === 0);
    let slot = 0; const pos = {};
    function place(k) {
      const nd = NODES[k];
      if (!nd.kids.length) { pos[k] = slot++; return pos[k]; }
      const xs = nd.kids.map(place);
      pos[k] = (xs[0] + xs[xs.length - 1]) / 2; return pos[k];
    }
    roots.forEach(place);
    return { pos, slots: slot, roots };
  })();

  /* ---------- 文字 ---------- */
  const code = s => '<code>' + s + '</code>';
  const pathStr = p => '[' + p.join(',') + ']';
  const setLine = (r, c, v) => 'row[' + r + ']=col[' + c + ']=diag1[' + (r + c) + ']=diag2[' + (r - c + N - 1) + ']=' + v;
  let solNo = 0;
  RAW.forEach((s, i) => {
    if (s.k === 'init') {
      s.head = 'INITIAL · n = 4';
      s.line = 'int ans = 0; dfs(4, 0, ans, row, col, diag1, diag2);';
      s.res = 'ans = 0 · 從 r0 開始';
      s.text = '<strong>INITIAL · n = 4</strong> · 搜尋的方式和 51 一模一樣:一層 dfs 放一列,欄、／、＼ 被佔就 continue。' +
        '差別只在 base case:走到 ' + code('r == n') + ' 不存棋盤,只做 ' + code('ans += 1') + '。' +
        '上面每長出一個節點 = 一次放置;<b>答案 = 有幾條路能一路放到第 3 列</b>。節點做完後,右邊小格會標出「它底下數到幾個」。';
    } else if (s.k === 'place') {
      s.head = '放 (' + s.r + ',' + s.c + ')';
      s.line = setLine(s.r, s.c, 'true') + ';';
      s.res = '路徑 ' + pathStr(s.path) + ' → 呼叫 dfs(r = ' + (s.r + 1) + ')';
      s.text = '<strong>放 (' + s.r + ',' + s.c + ')</strong> · ' + code('col[' + s.c + ']') + '、' + code('diag1[' + (s.r + s.c) + ']') + '、' +
        code('diag2[' + (s.r - s.c + N - 1) + ']') + ' 都是 F → 設成 true,呼叫 ' + code('dfs(r = ' + (s.r + 1) + ')') + '。' +
        '目前路徑(每列皇后的欄)= <b>' + pathStr(s.path) + '</b>。' +
        (s.r === N - 1 ? '這是最後一列,下一個 dfs 一進去就會碰到 base case。' : '');
    } else if (s.k === 'sol') {
      solNo++;
      s.head = 'r == n → ans += 1';
      s.line = 'if (r == n) { ans += 1; return; }';
      s.res = '解 #' + solNo + ' ' + pathStr(s.path) + ' · ans = ' + s.ans;
      s.text = '<strong>dfs(r = 4) · r == n → ans += 1</strong> · 4 列都放好了:' + pathStr(s.path) + '。' +
        '51 在這裡要 ' + code('ans.push_back(board)') + ' 複製整個棋盤;這題只把計數加 1,<b>ans = ' + s.ans + '</b>,然後 return。' +
        '因為 ' + code('ans') + ' 是 ' + code('int&') + ',每一層改的都是 totalNQueens 裡同一個變數。';
    } else if (s.k === 'dead') {
      const nd = NODES[s.node];
      s.head = 'r' + s.r + ' 全被擋 → 死路';
      s.line = 'for (c = 0..3) continue;   // r' + s.r + ' ×4';
      s.res = s.blocked.map(b => 'c' + b.c + ' ' + GL[b.by]).join('、') + ' → return,(' + nd.r + ',' + nd.c + ') 小計 0';
      s.text = '<strong>dfs(r = ' + s.r + ') · 四格全被擋</strong> · ' + s.blocked.map(b => 'c' + b.c + ' 被' + GL[b.by]).join('、') +
        '(只標第一個成立的旗標)。迴圈跑完直接 return,<b>ans 沒動</b> —— (' + nd.r + ',' + nd.c + ') 這個節點底下數到 0 個。' +
        '回到上一層會把 (' + nd.r + ',' + nd.c + ') 的旗標清掉,接著試下一欄。';
    } else if (s.k === 'root') {
      s.head = 'r0 放 c' + s.c + ' 做完 · 小計 ' + s.sub;
      s.line = setLine(0, s.c, 'false') + ';';
      s.res = 'c' + s.c + ' 開頭共 ' + s.sub + ' 個 · ans = ' + s.ans;
      const mir = N - 1 - s.c;
      s.text = '<strong>(0,' + s.c + ') 整棵子樹做完 · 小計 ' + s.sub + '</strong> · 每個節點的小計 = 子節點小計相加,葉子是 1(到了 r == n)或 0(死路)。' +
        '拿掉 (0,' + s.c + ') 的旗標,棋盤回到空的,ans 目前 = <b>' + s.ans + '</b>。' +
        (s.c >= N / 2 ? '和鏡像那欄 c' + mir + ' 的小計 ' + RAW.find(t => t.k === 'root' && t.c === mir).sub + ' 一樣 —— 左右翻轉會把 c 變成 n − 1 − c。' : '');
    } else {
      s.head = '完成 · ans = 2';
      s.line = 'return ans;   // 2';
      s.res = '0 + 1 + 1 + 0 = 2 · 17 次 dfs · 16 次放置';
      s.text = '<strong>完成 · return 2</strong> · r0 四欄的小計 0 + 1 + 1 + 0 = 2。17 次 dfs = 16 次放置 + 最外層那次;' +
        '解數 2 = 樹上走到 r == n 的葉子數。<b>小計左右對稱(c0↔c3、c1↔c2)</b>:只算前半再 × 2 就是一個常見的加速。';
    }
  });
  const STEPS = RAW;

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
    function rect(x,y,w,h,fill,stroke,lw,dash){ if(fill){ctx.fillStyle=fill; ctx.fillRect(x,y,w,h);} ctx.lineWidth=lw||1.4; if(dash) ctx.setLineDash(dash); ctx.strokeStyle=stroke; ctx.strokeRect(x,y,w,h); ctx.setLineDash([]); }
    function txt(s,x,y,color,font,align,base){ ctx.fillStyle=color; ctx.font=font; ctx.textAlign=align||'center'; ctx.textBaseline=base||'middle'; ctx.fillText(s,x,y); }
    function head(s,x,y){ txt(s,x,y,C.dim,'600 12px '+MONO+', '+SANS,'left','alphabetic'); }
    function line(x1,y1,x2,y2,color,lw,dash){ ctx.strokeStyle=color; ctx.lineWidth=lw; if(dash) ctx.setLineDash(dash); ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); ctx.setLineDash([]); }
    const F = (wt, sz) => wt + ' ' + sz + 'px ' + MONO + ', ' + SANS;
    function fitTxt(s, x, y, color, wt, sz, maxW, align){ let f = sz; ctx.font = F(wt, f);
      while (f > 9 && ctx.measureText(s).width > maxW) { f -= 0.5; ctx.font = F(wt, f); }
      txt(s, x, y, color, F(wt, f), align); }

    function draw(){
      fit();
      const s = steps[step], w = canvas.clientWidth, PAD = 22;
      ctx.fillStyle = C.paper; ctx.fillRect(0, 0, w, canvas.clientHeight); ctx.setLineDash([]);
      const fin = s.k === 'fin';
      const onPath = {}; for (let i = 1; i <= s.path.length; i++) onPath[s.path.slice(0, i).join(',')] = true;
      const vis = {}; s.visited.forEach(k => { vis[k] = true; });

      /* ---- BAND 1 · 搜尋樹 ---- */
      head('BAND 1 · 搜尋樹(節點 = 放置 (r,c),深度 = 列)   右邊小格 = 這棵子樹數到幾個', PAD, 16);
      const LX = PAD + 34, slotW = (w - PAD - LX - 24) / LAYOUT.slots, NW = Math.min(64, slotW - 30), NH = 26;
      const Y0 = 40, DY = 48;                              // root 在 Y0,第 r 列在 Y0 + (r+1)·DY
      const nx = k => LX + (LAYOUT.pos[k] + 0.5) * slotW;
      const ny = r => Y0 + (r + 1) * DY;
      const rootX = LX + (LAYOUT.slots / 2) * slotW;
      // 左側列標
      txt('dfs', PAD, Y0 + NH/2, C.dim, F(700, 11), 'left');
      for (let r = 0; r < N; r++) txt('r' + r, PAD, ny(r) + NH/2, C.dim, F(700, 11.5), 'left');
      txt('r=n', PAD, ny(N) + 10, C.dim, F(700, 11), 'left');
      // root
      const rootOn = !fin;
      box(rootX - 44, Y0, 88, NH, fin ? C.good : (s.path.length === 0 && s.k !== 'init' ? C.cur : C.paper), fin ? C.ink : (s.path.length ? C.ink : C.curS), fin ? 1.6 : (s.path.length ? 1.3 : 2.2));
      fitTxt('dfs(0)' + (fin ? ' → 2' : ''), rootX, Y0 + NH/2 + 1, fin ? C.ink : (s.path.length ? C.ink : C.curT), 700, 12, 80);
      // 邊
      s.visited.forEach(k => {
        const nd = NODES[k], x = nx(k), y = ny(nd.r);
        const px = nd.r === 0 ? rootX : nx(nd.parent), py = nd.r === 0 ? Y0 + NH : ny(nd.r - 1) + NH;
        const hot = onPath[k];
        line(px, py, x, y, hot ? C.curS : C.dim, hot ? 2.4 : 1.2);
      });
      // 節點
      s.visited.forEach(k => {
        const nd = NODES[k], x = nx(k) - NW/2, y = ny(nd.r), d = s.done[k];
        const isNew = s.node === k && s.k === 'place';
        let fill = C.paper, sc = C.ink, lw = 1.3, tc = C.ink;
        if (onPath[k]) { fill = C.cur; sc = C.curS; lw = isNew ? 3 : 2; tc = C.curT; }
        if (d !== undefined && !onPath[k]) { fill = d > 0 ? C.good : C.gray; sc = d > 0 ? C.ink : C.off; tc = d > 0 ? C.ink : C.dim; }
        const isDead = s.k === 'dead' && s.node === k;
        if (isDead) { fill = C.bad; sc = C.deep; lw = 2.6; tc = C.deep; }
        box(x, y, NW, NH, fill, sc, lw);
        fitTxt((isDead ? '× ' : '') + '(' + nd.r + ',' + nd.c + ')', x + NW/2, y + NH/2 + 1, tc, 700, 12, NW - 6);
        // 子樹小計標籤:節點右邊,自己一格,不壓字
        if (d !== undefined) {
          const tw = 20, th = 18, tx = x + NW + 4, ty = y + (NH - th) / 2;
          rect(tx, ty, tw, th, d > 0 ? C.good : C.paper, d > 0 ? C.ink : C.dim, 1.1);
          txt(String(d), tx + tw/2, ty + th/2 + 1, d > 0 ? C.ink : C.dim, F(800, 10.5));
        }
      });
      // r == n 的 +1
      s.visited.forEach(k => {
        const nd = NODES[k]; if (nd.r !== N - 1) return;
        const d = s.done[k]; if (d === undefined && !(s.k === 'sol' && s.node === k)) return;
        const x = nx(k), y = ny(N) + 2, isNow = s.k === 'sol' && s.node === k;
        line(x, ny(N - 1) + NH, x, y, isNow ? C.curS : C.dim, isNow ? 2.2 : 1.2, [4,3]);
        box(x - 36, y, 72, 20, C.good, isNow ? C.curS : C.ink, isNow ? 2.6 : 1.3);
        fitTxt('ans += 1', x, y + 11, C.ink, 700, 11, 66);
      });

      /* ---- BAND 2 · 棋盤 + ans ---- */
      const b2 = 336;
      head('BAND 2 · 目前路徑的棋盤   ans 與 r0 四欄小計', PAD, b2);
      const CS = 27, bx = PAD + 26, by = b2 + 32;
      for (let c = 0; c < N; c++) txt('c' + c, bx + c*CS + CS/2, by - 11, C.dim, F(700, 10.5));
      const deadRow = s.k === 'dead' ? s.r : -1;
      for (let r = 0; r < N; r++) txt('r' + r, bx - 8, by + r*CS + CS/2 + 1, r === deadRow ? C.deep : C.dim, F(700, 10.5), 'right');
      const queens = s.path.map((c, r) => [r, c]);
      const attacked = (r, c) => queens.some(([qr, qc]) => qc === c || qr + qc === r + c || qr - qc === r - c);
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
        const x = bx + c*CS, y = by + r*CS, q = s.path[r] === c;
        if (q) { rect(x + 1, y + 1, CS - 2, CS - 2, (s.k === 'sol') ? C.good : C.cur, (s.k === 'sol') ? C.ink : C.curS, 2); txt('Q', x + CS/2, y + CS/2 + 1, (s.k === 'sol') ? C.ink : C.curT, F(800, 15)); continue; }
        rect(x, y, CS, CS, attacked(r, c) ? C.up : C.paper, C.ink, 1);
      }
      if (deadRow >= 0) {
        s.blocked.forEach(b => { const x = bx + b.c*CS, y = by + deadRow*CS;
          rect(x, y, CS, CS, C.bad, C.curS, 2); txt(GL[b.by], x + CS/2, y + CS/2 + 1, C.deep, '700 13px ' + SANS + ', ' + MONO); });
      }
      // 棋盤圖例(棋盤下方,兩格)
      { const ly = by + N*CS + 10, lw = (N*CS + 26) / 2 - 4;
        box(PAD, ly, lw, 18, C.up, C.ink, 1.1); fitTxt('藍 = 被攻擊', PAD + lw/2, ly + 10, C.ink, 700, 9.5, lw - 6);
        box(PAD + lw + 8, ly, lw, 18, C.bad, C.curS, 1.1); fitTxt('粉 = 擋住', PAD + lw + 8 + lw/2, ly + 10, C.deep, 700, 9.5, lw - 6); }

      // 右側:ans + 小計
      { const rx = bx + N*CS + 34, rw = w - PAD - rx;
        // ans
        const aw = 108, ah = 50, ay = by - 6, solNow = s.k === 'sol';
        box(rx, ay, aw, ah, fin ? C.good : (solNow ? C.cur : C.paper), solNow ? C.curS : C.ink, solNow ? 2.6 : 1.5);
        txt('int& ans', rx + aw/2, ay + 14, C.dim, F(700, 10.5));
        txt(String(s.ans), rx + aw/2, ay + 34, solNow ? C.curT : C.ink, F(800, 20));
        // 計數
        const cx = rx + aw + 14, cw = rw - aw - 14;
        fitTxt('dfs 呼叫 ' + s.calls + ' / 17', cx, ay + 14, C.ink, 700, 11.5, cw, 'left');
        fitTxt('放置 ' + s.places + ' / 16', cx, ay + 36, C.ink, 700, 11.5, cw, 'left');
        // 四欄小計
        const ty = ay + ah + 26, tw = (rw - 3*10) / 4, th = 34;
        txt('r0 放 c → 這一欄開頭數到幾個', rx, ty - 12, C.dim, F(600, 10.5), 'left');
        for (let c = 0; c < N; c++) {
          const x = rx + c * (tw + 10), v = s.subtotal[c], now = s.k === 'root' && s.c === c;
          const live = v === null && s.path.length && s.path[0] === c;
          box(x, ty, tw, th, v === null ? (live ? C.cur : C.paper) : (v > 0 ? C.good : C.gray), now ? C.curS : (v === null ? (live ? C.curS : C.off) : C.ink), now ? 2.6 : 1.3, v === null && !live ? [3,3] : null);
          fitTxt('c' + c + (v === null ? (live ? ' 進行中' : ' ?') : ' : ' + v), x + tw/2, ty + th/2 + 1, v === null ? (live ? C.curT : C.dim) : C.ink, 700, 12, tw - 8);
        }
        // 鏡像括號:c0↔c3 外圈、c1↔c2 內圈
        const by2 = ty + th + 6, mid = c => rx + c * (tw + 10) + tw / 2;
        const pairDone = (a, b) => s.subtotal[a] !== null && s.subtotal[b] !== null;
        [[0, 3, 18], [1, 2, 8]].forEach(([a, b, dep]) => {
          const on = pairDone(a, b), colr = on ? C.ink : C.off;
          line(mid(a), by2, mid(a), by2 + dep, colr, 1.2); line(mid(b), by2, mid(b), by2 + dep, colr, 1.2);
          line(mid(a), by2 + dep, mid(b), by2 + dep, colr, 1.2);
        });
        fitTxt(fin ? '鏡像:c ↔ n−1−c 小計相同 → 0+1+1+0 = 2' : '鏡像:c0↔c3、c1↔c2(左右翻轉)', rx, by2 + 34, fin ? C.ink : C.dim, fin ? 700 : 600, 11, rw, 'left');
      }

      /* ---- BAND 3 · 這一步 ---- */
      const b3 = 540;
      head('BAND 3 · 這一步(哪一行跑了)', PAD, b3);
      { const by3 = b3 + 12, bh = 32, inner = w - 2*PAD, w1 = Math.round(inner * 0.52), w2 = inner - w1 - 10;
        let f2 = C.cur, s2 = C.curS, c2 = C.curT, d2 = null;
        if (s.k === 'dead') { f2 = C.bad; s2 = C.deep; c2 = C.deep; }
        else if (s.k === 'sol' || s.k === 'root' || fin) { f2 = C.good; s2 = C.ink; c2 = C.ink; }
        else if (s.k === 'init') { f2 = C.paper; s2 = C.off; c2 = C.dim; d2 = [3,3]; }
        box(PAD, by3, w1, bh, C.paper, C.ink, 1.4);
        fitTxt(s.line, PAD + 10, by3 + bh/2 + 1, C.ink, 700, 11.5, w1 - 18, 'left');
        box(PAD + w1 + 10, by3, w2, bh, f2, s2, 2, d2);
        fitTxt(s.res, PAD + w1 + 10 + w2/2, by3 + bh/2 + 1, c2, 700, 11.5, w2 - 14); }
    }

    function update(){ if(stepEl) stepEl.textContent=String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0'); if(labelEl) labelEl.innerHTML=steps[step].text; draw(); }
    function next(){ if(step<steps.length-1){step++;update();}else stop(); }
    function prev(){ if(step>0){step--;update();} }
    function reset(){ stop(); step=0; update(); }
    function play(){ if(timer){stop();return;} bPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){stop();return;} next(); },2000); }
    function stop(){ if(timer){clearInterval(timer);timer=null;} if(bPlay) bPlay.textContent='Play'; }
    bPrev&&bPrev.addEventListener('click',prev); bNext&&bNext.addEventListener('click',next); bPlay&&bPlay.addEventListener('click',play); bReset&&bReset.addEventListener('click',reset);
    window.addEventListener('resize',()=>{fit();draw();}); if(window.ResizeObserver){ new ResizeObserver(()=>{fit();draw();}).observe(canvas); }
    if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw); fit(); update();
    window['__' + prefix] = { go: k => { step = Math.max(0, Math.min(steps.length - 1, k)); update(); }, n: steps.length };
  }

  mount('v52', STEPS);
})();
