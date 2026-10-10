/* ============================================================
   P51 · N-Queens — 一列放一個皇后 · 欄 / ／ / ＼ 被佔就跳過 · 放完下一列 · 回來拿掉 · viz
     for (int c = 0; c < n; c++) {
         if (col[c] || diag1[r + c] || diag2[r - c + n - 1]) continue;
         board[r][c] = 'Q';
         row[r] = col[c] = diag1[r + c] = diag2[r - c + n - 1] = true;
         dfs(ans, board, n, r + 1, row, col, diag1, diag2);
         row[r] = col[c] = diag1[r + c] = diag2[r - c + n - 1] = false;
         board[r][c] = '.';
     }
   n = 4(g++ 實跑 trace,見 facts「Trace n=4」):17 次 dfs、16 次放置、44 次 continue、解在 #9、#13
     diag1 = r + c      → 「／」反對角線(同一條 ／ 上 r + c 相同)
     diag2 = r − c + 3  → 「＼」主對角線(同一條 ＼ 上 r − c 相同,+3 讓 index ≥ 0)
     || 短路:格子上標的是「第一個成立的條件」;後面的旗標就算也是 true,這一格根本不會讀到。
   步驟由下面的 dfs 直接跑出來(和 C++ 同一份邏輯),合併規則:
     放置步 = 這一列前面連續的 continue + 這次放置;死路步 = 一整列都 continue;
     拿掉步 = undo + 之後同一列的 continue(到下一次放置或迴圈結束 return)。
   BAND 1 棋盤(紅框 Q = 已放,藍 = 被攻擊,粉 + 欄/／/＼ = 跳過)+ 右側 col / diag1 / diag2 / row 旗標
   BAND 2 call stack(每層 = 一列)+ 計數 + 兩個解
   BAND 3 這一步(哪一行跑了)
   前綴 v51- 。
   ============================================================ */
(function () {
  const C = { paper:'#ffffff', ink:'#1f1f1f', dim:'#5a5a5a', off:'#cfcfcf',
    up:'#e3edf5', low:'#f6ead8',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424',
    good:'#d9e8c7', bad:'#f0d4d4', deep:'#a31d1d', gray:'#ececec' };
  const MONO = '"JetBrains Mono", monospace', SANS = '"Noto Sans TC", sans-serif';
  const N = 4, TOT = { calls:17, places:16, conts:44, sols:2 };
  const GL = { col:'欄', d1:'／', d2:'＼' };
  const NM = { col:'col', d1:'diag1', d2:'diag2' };
  const ix = (k, r, c) => k === 'col' ? c : k === 'd1' ? r + c : r - c + N - 1;

  /* ---------- 跑一次 dfs,邊跑邊切步驟 ---------- */
  function build() {
    const steps = [];
    const row = Array(N).fill(false), col = Array(N).fill(false),
          d1 = Array(2*N-1).fill(false), d2 = Array(2*N-1).fill(false);
    const qc = Array(N).fill(-1), stack = [], vers = {}, sols = [];
    const cnt = { calls:0, places:0, conts:0, sols:0 };
    let callid = 0, pend = null;
    const FL = { col, d1, d2 };
    function snap(o) {
      const top = stack[stack.length - 1];
      return Object.assign({
        qc: qc.slice(), row: row.slice(), col: col.slice(), d1: d1.slice(), d2: d2.slice(),
        stack: stack.map(f => ({ id:f.id, r:f.r })), ver: top && vers[top.id] ? vers[top.id].slice() : [null,null,null,null],
        cnt: Object.assign({}, cnt), sols: sols.map(s => ({ id:s.id, qc:s.qc.slice() })) }, o);
    }
    function emitPend(ret) {
      if (!pend) return;
      if (pend.k === 'undo') steps.push(snap({ k:'undo', id:pend.id, r:pend.r, undo:{ r:pend.r, c:pend.c }, skips:pend.skips, child:pend.child, ret }));
      else steps.push(snap({ k:'dead', id:pend.id, r:pend.r, skips:pend.skips, ret:true }));
      pend = null;
    }
    function dfs(r) {
      const id = ++callid; cnt.calls++;
      stack.push({ id, r }); vers[id] = [null,null,null,null];
      if (r >= N) {
        cnt.sols++; sols.push({ id, qc: qc.slice() });
        steps.push(snap({ k:'sol', id, r, skips:[] }));
        stack.pop(); return;
      }
      for (let c = 0; c < N; c++) {
        const all = ['col','d1','d2'].filter(k => FL[k][ix(k, r, c)]);
        if (col[c] || d1[r + c] || d2[r - c + N - 1]) {          // || 短路:第一個成立的就停
          const first = col[c] ? 'col' : d1[r + c] ? 'd1' : 'd2';
          cnt.conts++; vers[id][c] = { k:'skip', first };
          const sk = { r, c, first, all };
          if (!pend) pend = { k:'scan', id, r, skips:[] };
          pend.skips.push(sk);
          continue;
        }
        let pre = [];
        if (pend && pend.k === 'scan') { pre = pend.skips; pend = null; } else emitPend(false);
        qc[r] = c; row[r] = col[c] = d1[r + c] = d2[r - c + N - 1] = true;
        cnt.places++; vers[id][c] = 'place';
        steps.push(snap({ k:'place', id, r, place:{ r, c }, skips:pre, child:callid + 1,
                          cnt:{ calls:cnt.calls + 1, places:cnt.places, conts:cnt.conts, sols:cnt.sols } }));
        dfs(r + 1);
        row[r] = col[c] = d1[r + c] = d2[r - c + N - 1] = false;
        qc[r] = -1; vers[id][c] = 'tried';
        pend = { k:'undo', id, r, c, skips:[] };   // 之後同一列的 continue 併進這一步
      }
      emitPend(true);
      stack.pop();
    }
    steps.push(snap({ k:'init', id:1, r:0, skips:[], stack:[{ id:1, r:0 }], cnt:{ calls:1, places:0, conts:0, sols:0 } }));
    dfs(0);
    steps.push(snap({ k:'fin', id:0, r:-1, skips:[] }));
    // 補上「剛 return 的子呼叫」編號(給 undo 步驟畫 call stack)
    const childOf = {};
    steps.forEach(s => { if (s.k === 'place') childOf[s.id + ':' + s.place.r + ':' + s.place.c] = s.child; });
    steps.forEach(s => { if (s.k === 'undo') s.child = childOf[s.id + ':' + s.undo.r + ':' + s.undo.c]; });
    return steps;
  }

  /* ---------- 文字 ---------- */
  const code = s => '<code>' + s + '</code>';
  function reads(sk) {   // 照 || 的順序讀,讀到 true 就停
    const out = [];
    for (const k of ['col','d1','d2']) {
      const i = ix(k, sk.r, sk.c), v = sk.all.indexOf(k) >= 0;
      out.push(code(NM[k] + '[' + i + ']') + (v ? ' <b>T</b>' : ' F'));
      if (v) break;
    }
    const later = sk.all.filter(k => k !== sk.first);
    let t = 'c' + sk.c + ':' + out.join(' → ') + ' → <b>' + GL[sk.first] + '</b> continue';
    if (later.length) t += '(' + later.map(k => code(NM[k] + '[' + ix(k, sk.r, sk.c) + ']')).join('、') + ' 也是 T,但 || 已經短路,沒讀到)';
    return t;
  }
  const skShort = sks => sks.map(k => 'c' + k.c + ' ' + GL[k.first]).join('、');
  const setLine = (r, c, v) => 'row[' + r + ']=col[' + c + ']=diag1[' + (r + c) + ']=diag2[' + (r - c + N - 1) + ']=' + v;
  const boardStr = q => q.map(c => '....'.slice(0, c) + 'Q' + '....'.slice(c + 1, N)).join(' ');

  function decorate(steps) {
    let solNo = 0;
    steps.forEach((s, i) => {
      const sk = s.skips;
      const skHtml = sk.length ? sk.map(reads).join(';') + '。' : '';
      if (s.k === 'init') {
        s.head = 'INITIAL · n = 4';
        s.line = 'dfs(ans, board, 4, 0, row, col, diag1, diag2);'; s.res = '#1 dfs(r = 0) · 從 r0 開始';
        s.text = '<strong>INITIAL · n = 4</strong> · 每一層 dfs 只管<b>一列</b>:第 r 層在 r 列從 c0 試到 c3。一格能放,要三個旗標都是 false:' +
          code('col[c]') + '(同欄)、' + code('diag1[r+c]') + '(同一條 ／)、' + code('diag2[r−c+3]') + '(同一條 ＼)。' +
          '<code>||</code> 由左往右讀,<b>第一個成立的</b>就 continue。呼叫 <b>#1 dfs(r = 0)</b>。';
      } else if (s.k === 'place') {
        const { r, c } = s.place;
        s.head = '#' + s.id + ' r' + r + ':' + (sk.length ? skShort(sk) + ' → ' : '') + 'c' + c + ' 放 (' + r + ',' + c + ')';
        s.line = "board[" + r + "][" + c + "]='Q'; " + setLine(r, c, 'true') + ';';
        s.res = (sk.length ? 'continue ×' + sk.length + ' · ' : '') + '放 (' + r + ',' + c + ') → #' + s.child + ' dfs(r = ' + (r + 1) + ')';
        s.text = '<strong>' + s.head + '</strong> · ' + skHtml +
          'c' + c + ':' + code('col[' + c + ']') + '、' + code('diag1[' + (r + c) + ']') + '、' + code('diag2[' + (r - c + N - 1) + ']') +
          ' 三個都 F → 放 Q,設 ' + code(setLine(r, c, 'true')) + ',呼叫 <b>#' + s.child + ' dfs(r = ' + (r + 1) + ')</b>。';
      } else if (s.k === 'dead') {
        s.head = '#' + s.id + ' r' + s.r + ':' + skShort(sk) + ' → 死路';
        s.line = 'if (col[c] || diag1[r+c] || diag2[r-c+3]) continue;   // ×4';
        s.res = 'r' + s.r + ' 四格全被擋 → 迴圈跑完 return';
        s.text = '<strong>' + s.head + '</strong> · ' + skHtml + ' r' + s.r + ' 沒有一格能放,<b>#' + s.id + ' 的迴圈跑完直接 return</b>,回到 #' +
          s.stack[s.stack.length - 2].id + '。';
      } else if (s.k === 'undo') {
        const { r, c } = s.undo;
        const nextPlace = steps[i + 1] && steps[i + 1].k === 'place' && steps[i + 1].id === s.id ? steps[i + 1].place.c : null;
        s.head = '回到 #' + s.id + ' r' + r + ':拿掉 (' + r + ',' + c + ')' + (sk.length ? ' · ' + skShort(sk) : '') +
          (s.ret ? ' → return' : '');
        s.line = setLine(r, c, 'false') + "; board[" + r + "][" + c + "]='.';";
        s.res = '拿掉 (' + r + ',' + c + ')' + (sk.length ? ' · ' + skShort(sk) : '') +
          (s.ret ? ' → #' + s.id + ' return' : ' → 接著試 c' + nextPlace);
        s.text = '<strong>' + s.head + '</strong> · #' + s.child + ' 回來了 → ' + code(setLine(r, c, 'false')) + '、' + code("board[" + r + "][" + c + "]='.'") +
          ',四個旗標一起清掉,(' + r + ',' + c + ') 擋住的格子又空出來。' + (sk.length ? '接著 ' + skHtml : '') +
          (s.ret ? (c === N - 1 && !sk.length ? 'c' + c + ' 已是最後一欄,' : '') + '<b>#' + s.id + ' 的迴圈結束 → return</b>' +
            (s.stack.length > 1 ? ',回到 #' + s.stack[s.stack.length - 2].id + '。' : ',整個 dfs 結束。')
                 : '下一步試 c' + nextPlace + '。');
      } else if (s.k === 'sol') {
        solNo++;
        s.head = '#' + s.id + ' r4 == n:解 #' + solNo;
        s.line = 'if (r >= n) { ans.push_back(board); return; }';
        s.res = '解 #' + solNo + ':' + boardStr(s.qc);
        s.text = '<strong>' + s.head + '</strong> · 4 列都放好了,<b>#' + s.id + ' dfs(r = 4)</b> 一進來就 ' + code('r >= n') + ' → ' +
          code('ans.push_back(board)') + ' 收下 ' + code(boardStr(s.qc)) + ',return。它不碰旗標,回到 #' + s.stack[s.stack.length - 2].id + ' 才拿掉 (3,' + s.qc[3] + ')。';
      } else {
        s.head = '完成 · 2 個解';
        s.line = 'return ans;   // 2 個 board';
        s.res = '2 個解 · 17 次 dfs · 16 次放置 · 44 次 continue';
        s.text = '<strong>完成 · 2 個解 · 17 次 dfs · 16 次放置 · 44 次 continue</strong> · r0 的 c0…c3 都試過,#1 return。' +
          '每次放置都會呼叫一次 dfs,所以 dfs = 放置 + 1(最外層那次)。棋盤和旗標全部回到初始;' +
          code('row[]') + ' 一直有寫,但沒有任何一行讀它 —— 第 r 層本來就只放 r 列,同列不可能撞。';
      }
    });
    return steps;
  }

  const STEPS = decorate(build());

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
    function arrowHead(x,y,ang,col,sz){ sz=sz||7; ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(x,y);
      ctx.lineTo(x-sz*Math.cos(ang-0.45),y-sz*Math.sin(ang-0.45)); ctx.lineTo(x-sz*Math.cos(ang+0.45),y-sz*Math.sin(ang+0.45)); ctx.closePath(); ctx.fill(); }
    const F = (wt, sz) => wt + ' ' + sz + 'px ' + MONO + ', ' + SANS;
    function fitTxt(s, x, y, color, wt, sz, maxW, align){ let f = sz; ctx.font = F(wt, f);
      while (f > 9 && ctx.measureText(s).width > maxW) { f -= 0.5; ctx.font = F(wt, f); }
      txt(s, x, y, color, F(wt, f), align); }

    function draw(){
      fit();
      const s = steps[step], w = canvas.clientWidth, H = canvas.clientHeight, PAD = 22;
      ctx.fillStyle = C.paper; ctx.fillRect(0,0,w,H); ctx.setLineDash([]);
      const X = px => px * w / 620;
      const fin = s.k === 'fin', sol = s.k === 'sol', init = s.k === 'init';
      const actRow = (s.k === 'place' || s.k === 'dead' || s.k === 'undo') ? s.r : (init ? 0 : -1);
      const hotSk = {}; s.skips.forEach(k => { hotSk[k.c] = k; });
      const queens = []; s.qc.forEach((c, r) => { if (c >= 0) queens.push([r, c]); });

      /* ---- BAND 1 · 棋盤 ---- */
      head('BAND 1 · 棋盤 board(一層 dfs = 一列)   右:三個旗標陣列', PAD, 16);
      const CS = 44, bx = PAD + 42, by = 62;
      for (let c = 0; c < N; c++) txt('c' + c, bx + c*CS + CS/2, by - 19, C.dim, F(700, 11));
      for (let r = 0; r < N; r++) {
        const on = r === actRow;
        txt('r' + r, bx - 13, by + r*CS + CS/2 + 1, on ? C.curT : C.dim, F(700, 11.5), 'right');
        if (on) { ctx.fillStyle = C.curS; ctx.beginPath(); const ay = by + r*CS + CS/2;
          ctx.moveTo(PAD - 2, ay - 5); ctx.lineTo(PAD + 5, ay); ctx.lineTo(PAD - 2, ay + 5); ctx.closePath(); ctx.fill(); }
      }
      const attacked = (r, c) => queens.some(([qr, qcl]) => !(qr === r && qcl === c) && (qcl === c || qr + qcl === r + c || qr - qcl === r - c));
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
        const x = bx + c*CS, y = by + r*CS;
        rect(x, y, CS, CS, attacked(r, c) ? C.up : C.paper, C.ink, 1.2);
      }
      // 攻擊線(淡)
      ctx.save(); ctx.beginPath(); ctx.rect(bx, by, N*CS, N*CS); ctx.clip();
      queens.forEach(([qr, qcl]) => {
        const cx = bx + qcl*CS + CS/2, cy = by + qr*CS + CS/2, L = N*CS*1.5;
        line(cx, by, cx, by + N*CS, C.off, 1.1);
        line(cx - L, cy + L, cx + L, cy - L, C.off, 1.1);
        line(cx - L, cy - L, cx + L, cy + L, C.off, 1.1);
      });
      ctx.restore();
      // 目前這一列的判定
      if (actRow >= 0 && !init) for (let c = 0; c < N; c++) {
        const v = s.ver[c], x = bx + c*CS, y = by + actRow*CS;
        if (v && v.k === 'skip') {
          const hot = !!hotSk[c];
          rect(x, y, CS, CS, C.bad, hot ? C.curS : C.ink, hot ? 2.4 : 1.2);
          txt(GL[v.first], x + CS/2, y + CS/2 + 1, hot ? C.deep : C.dim, '700 ' + (hot ? 17 : 14) + 'px ' + SANS + ', ' + MONO);
          if (!hot) txt('先前', x + CS - 4, y + 9, C.dim, F(600, 8.5), 'right');
        } else if (v === 'tried' && !(s.undo && s.undo.c === c)) {
          txt('試過', x + CS/2, y + CS/2 + 1, C.dim, F(600, 10.5));
        }
      }
      // 皇后
      queens.forEach(([r, c]) => {
        const x = bx + c*CS, y = by + r*CS, isNew = s.k === 'place' && s.place.r === r && s.place.c === c;
        if (sol) { rect(x + 1, y + 1, CS - 2, CS - 2, C.good, C.ink, 2); txt('Q', x + CS/2, y + CS/2 + 1, C.ink, F(800, 21)); return; }
        rect(x + 1.5, y + 1.5, CS - 3, CS - 3, C.cur, C.curS, isNew ? 3.2 : 2);
        txt('Q', x + CS/2, y + CS/2 + 1, C.curT, F(800, 21));
      });
      // 拿掉的皇后(鬼影)
      if (s.k === 'undo') { const { r, c } = s.undo, x = bx + c*CS, y = by + r*CS;
        rect(x + 2, y + 2, CS - 4, CS - 4, C.paper, C.deep, 2.2, [5,3]);
        txt('Q', x + CS/2, y + CS/2 - 3, C.off, F(800, 18));
        txt('拿掉', x + CS/2, y + CS - 9, C.deep, F(700, 9.5)); }
      // 目前列外框
      if (actRow >= 0 && !fin) rect(bx - 4, by + actRow*CS - 4, N*CS + 8, CS + 8, null, C.curS, 1.8, [6,4]);
      if (fin) { box(bx + 18, by + N*CS/2 - 16, N*CS - 36, 32, C.paper, C.dim, 1.2, [4,3]);
        txt('全部拿掉 · 回到空棋盤', bx + N*CS/2, by + N*CS/2 + 1, C.dim, F(700, 11)); }
      // 圖例(棋盤下方)
      { const ly = by + N*CS + 16, lw = (N*CS + 42 - 8) / 2, lh = 22, lx = PAD;
        const L = [ [C.cur, C.curS, C.curT, '紅框 Q = 已放'], [C.up, C.ink, C.ink, '藍 = 被攻擊'],
                    [C.bad, C.curS, C.deep, '粉 = 跳過'], [C.paper, C.curS, C.curT, '虛線 = 這一列'] ];
        L.forEach((o, k) => { const x = lx + (k % 2) * (lw + 8), y = ly + Math.floor(k / 2) * (lh + 8);
          box(x, y, lw, lh, o[0], o[1], 1.3, k === 3 ? [5,3] : null); fitTxt(o[3], x + lw/2, y + lh/2 + 1, o[2], 700, 10.5, lw - 8); }); }

      // 右側:旗標陣列
      { const rx = bx + N*CS + 30 + Math.max(0, w - 620) * 0.2, cx0 = rx + 82, cw = Math.min(54, (w - PAD - cx0) / 7), chh = 26;
        const ARR = [ { key:'col', a:s.col, n1:'col', n2:'c', len:N },
                      { key:'d1', a:s.d1, n1:'／ diag1', n2:'r+c', len:2*N-1 },
                      { key:'d2', a:s.d2, n1:'＼ diag2', n2:'r−c+3', len:2*N-1 },
                      { key:'row', a:s.row, n1:'row', n2:'r', len:N, grey:true } ];
        const tops = [62, 134, 206, 278];
        const block = {};   // key → { idx: c } 本步擋住的人
        s.skips.forEach(k => { const i = ix(k.first, k.r, k.c); (block[k.first] = block[k.first] || {})[i] = k.c; });
        const setNow = {}, clrNow = {};
        if (s.k === 'place') { const { r, c } = s.place; setNow.col = c; setNow.d1 = r + c; setNow.d2 = r - c + N - 1; setNow.row = r; }
        if (s.k === 'undo') { const { r, c } = s.undo; clrNow.col = c; clrNow.d1 = r + c; clrNow.d2 = r - c + N - 1; clrNow.row = r; }
        ARR.forEach((A, k) => {
          const y = tops[k];
          txt(A.n1, rx, y + 6, A.grey ? C.dim : C.ink, '700 12px ' + MONO + ', ' + SANS, 'left');
          txt('[' + A.n2 + ']', rx, y + 21, C.dim, F(600, 10.5), 'left');
          for (let i = 0; i < A.len; i++) {
            const x = cx0 + i*cw, v = A.a[i];
            txt(String(i), x + cw/2, y - 18, C.dim, F(600, 10.5));
            if (A.grey) { rect(x, y, cw, chh, v ? C.gray : C.paper, C.off, 1.2); txt(v ? 'T' : 'F', x + cw/2, y + chh/2 + 1, v ? C.dim : C.off, F(700, 12)); continue; }
            const isSet = setNow[A.key] === i, isClr = clrNow[A.key] === i;
            if (v) rect(x, y, cw, chh, C.cur, C.curS, isSet ? 3 : 1.4);
            else if (isClr) rect(x + 1, y + 1, cw - 2, chh - 2, C.paper, C.deep, 2.2, [4,3]);
            else rect(x, y, cw, chh, C.paper, C.ink, 1.1);
            txt(v ? 'T' : 'F', x + cw/2, y + chh/2 + 1, v ? C.curT : (isClr ? C.deep : C.off), F(700, 12.5));
            if (isSet) txt('新設', x + cw/2, y + chh + 11, C.curT, F(700, 9.5));
            if (isClr) txt('清掉', x + cw/2, y + chh + 11, C.deep, F(700, 9.5));
            const b = block[A.key] && block[A.key][i];
            if (b !== undefined) {
              ctx.lineWidth = 3; ctx.strokeStyle = C.curS; ctx.strokeRect(x - 2.5, y - 2.5, cw + 5, chh + 5);
              txt('擋c' + b, x + cw/2, y + chh + 11, C.curT, F(700, 9.5));
            }
          }
          if (A.grey) fitTxt('row[] 只寫不讀', cx0 + A.len*cw + 14, y + chh/2 + 1, C.dim, 600, 11, w - PAD - (cx0 + A.len*cw + 14), 'left');
        });
        fitTxt('擋c# = 這格第一個成立的旗標(|| 短路,後面不讀)', cx0 - 82, tops[3] + chh + 26, C.dim, 600, 10.5, w - PAD - rx, 'left');
      }

      /* ---- BAND 2 · call stack + 計數 + 解 ---- */
      const b2 = 362;
      head('BAND 2 · call stack(第 r 層放 r 列)   紅 = 這一步在跑   計數   解', PAD, b2);
      const sx0 = Math.max(X(420), 410);
      { const y = b2 + 14, h = 42, g = 10, right = sx0 - 18, bw = (right - PAD - 4*g) / 5;
        const st = s.stack, top = st.length - 1;
        for (let d = 0; d <= N; d++) {
          const x = PAD + d * (bw + g);
          if (d > 0) { line(x - g + 1, y + h/2, x - 3, y + h/2, C.dim, 1.2); arrowHead(x - 2, y + h/2, 0, C.dim, 5); }
          let t1 = 'r' + d, t2 = '', fill = C.paper, sc = C.off, lw = 1.1, dash = [3,3], tc = C.off;
          const f = st[d];
          if (fin) { t2 = d === 0 ? 'return ans' : '—'; if (d === 0) { fill = C.good; sc = C.ink; lw = 1.4; dash = null; tc = C.ink; } t1 = d === 0 ? '#1 dfs(0)' : 'r' + d; }
          else if (f && d < top) { t1 = '#' + f.id + ' dfs(' + d + ')'; t2 = 'Q 在 c' + s.qc[d]; fill = C.up; sc = C.ink; lw = 1.4; dash = null; tc = C.ink; }
          else if (f && d === top) {
            t1 = '#' + f.id + ' dfs(' + d + ')'; dash = null;
            if (sol) { t2 = 'r==n 收集'; fill = C.good; sc = C.ink; lw = 2.2; tc = C.ink; }
            else if (s.ret) { t2 = s.k === 'dead' ? '死路 return' : '→ return'; fill = C.bad; sc = C.deep; lw = 2.4; tc = C.deep; }
            else { t2 = s.k === 'place' ? '放 c' + s.place.c : s.k === 'undo' ? '拿掉 c' + s.undo.c : '掃 c0..c3'; fill = C.cur; sc = C.curS; lw = 2.6; tc = C.curT; }
          }
          else if (s.k === 'place' && d === top + 1) { t1 = '#' + s.child + ' dfs(' + d + ')'; t2 = '剛呼叫'; fill = C.cur; sc = C.curS; lw = 1.8; dash = [5,3]; tc = C.curT; }
          else if (s.k === 'undo' && d === top + 1) { t1 = '#' + s.child + ' dfs(' + d + ')'; t2 = '已 return'; fill = C.paper; sc = C.deep; lw = 1.6; dash = [5,3]; tc = C.deep; }
          else { t2 = d === N ? 'r=n 收集' : '—'; }
          box(x, y, bw, h, fill, sc, lw, dash);
          fitTxt(t1, x + bw/2, y + 14, tc, 700, 11.5, bw - 8);
          fitTxt(t2, x + bw/2, y + 30, tc === C.ink ? C.dim : tc, 600, 10.5, bw - 8);
        }
        // 計數
        const cy = y + h + 14, ch = 30, cw = (right - PAD - 3*g) / 4;
        const K = [ ['dfs', s.cnt.calls, TOT.calls], ['放置', s.cnt.places, TOT.places], ['continue', s.cnt.conts, TOT.conts], ['解', s.cnt.sols, TOT.sols] ];
        K.forEach((o, k) => { const x = PAD + k * (cw + g), done = o[1] === o[2];
          box(x, cy, cw, ch, done && fin ? C.good : C.paper, C.ink, 1.3);
          fitTxt(o[0] + ' ' + o[1] + '/' + o[2], x + cw/2, cy + ch/2 + 1, C.ink, 700, 12, cw - 10); });
      }
      // 解
      { const y = b2 + 14, aw = w - PAD - sx0, g = 12, sw = (aw - g) / 2, mc = 13;
        for (let k = 0; k < 2; k++) {
          const x = sx0 + k * (sw + g), S = s.sols[k], isNew = sol && S && S.id === s.id;
          box(x, y, sw, 86, S ? C.good : C.paper, isNew ? C.curS : (S ? C.ink : C.off), isNew ? 2.6 : 1.3, S ? null : [3,3]);
          fitTxt('解 #' + (k + 1) + (S ? ' · 在 #' + S.id : ''), x + sw/2, y + 13, S ? C.ink : C.off, 700, 11.5, sw - 10);
          const gx = x + sw/2 - 2*mc, gy = y + 26;
          for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
            const q = S && S.qc[r] === c;
            rect(gx + c*mc, gy + r*mc, mc, mc, q ? C.cur : C.paper, S ? C.ink : C.off, 0.9);
            if (q) txt('Q', gx + c*mc + mc/2, gy + r*mc + mc/2 + 0.5, C.curT, F(800, 9.5));
          }
        } }

      /* ---- BAND 3 · 這一步 ---- */
      const b3 = 492;
      head('BAND 3 · 這一步(哪一行跑了)', PAD, b3);
      { const by3 = b3 + 12, bh = 32, inner = w - 2*PAD, w1 = Math.round(inner * (fin ? 0.3 : 0.6)), w2 = inner - w1 - 10;
        let f2 = C.cur, s2 = C.curS, c2 = C.curT, d2 = null;
        if (s.k === 'dead' || s.k === 'undo') { f2 = C.bad; s2 = C.deep; c2 = C.deep; d2 = s.k === 'undo' ? [5,3] : null; }
        else if (sol || fin) { f2 = C.good; s2 = C.ink; c2 = C.ink; }
        else if (init) { f2 = C.paper; s2 = C.off; c2 = C.dim; d2 = [3,3]; }
        box(PAD, by3, w1, bh, C.paper, C.ink, 1.4);
        fitTxt(s.line, PAD + 10, by3 + bh/2 + 1, C.ink, 700, 11.5, w1 - 18, 'left');
        box(PAD + w1 + 10, by3, w2, bh, f2, s2, 2, d2);
        fitTxt(s.res, PAD + w1 + 10 + w2/2, by3 + bh/2 + 1, c2, 700, 11.5, w2 - 14); }
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

  mount('v51', STEPS);
})();
