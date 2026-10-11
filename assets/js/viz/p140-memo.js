/* ============================================================
   P140 · Word Break II — ② 記憶化 DFS(top-down,memo 存「後綴 s[start..n) 的所有句子」)· viz
     auto it = memo.find(start);
     if (it != memo.end()) return it->second;                    // ① 算過了
     if (start == (int)s.size()) return {""};                    // ② 空後綴 = 一句空句子
     for (int end = start + 1; end <= (int)s.size(); end++) {
         string word = s.substr(start, end - start);
         if (!dict.count(word)) continue;
         for (const string& rest : dfs(s, end, dict, memo))      // ③ 接在每個後綴句子前面
             sentences.push_back(rest.empty() ? word : word + " " + rest);
     }
     memo[start] = sentences;                                    // ④ 存起來(可能是空的)
   兩組輸入接著跑(步驟由 JS 實跑同一份邏輯產生):
     RUN 1 · "catsanddog", dict {cat, cats, and, sand, dog} → ["cat sand dog", "cats and dog"]
     RUN 2 · "catsandog",  dict {cats, dog, sand, and, cat} → [](memo[7] = [] 被命中一次)
   步驟(19 步):每一列 trace 一步;「"word" ✓ → dfs(end)」和子呼叫的第一個動作(開始 / base / memo 命中)併成一步。
   BAND 1 字串:index 0..n,紅 = 這一步選的 word = s[start,end),藍 = 這一步關心的後綴;下方 ▲ start / ▲ end、這層 for 試過哪些 end
   BAND 2 memo 表:每個位置一格,虛線 ? = 未算,綠 = k 句,灰 [ ] = 算過但切不完;紅框 = 正在寫,藍底深紅框 + 「命中」= memo hit
           下面列出已存的 memo[i] 內容(依存入順序)
   BAND 3 call stack:左 = 最外層,框之間的字 = 呼叫時切下的 word;每框寫狀態(開始 / 等子呼叫 已收 k 句 / 回傳 [..])
   BAND 4 這一步(哪一行跑了 + 結果)
   前綴 v140m 。
   ============================================================ */
(function () {
  const C = { paper:'#ffffff', ink:'#1f1f1f', dim:'#5a5a5a', off:'#cfcfcf',
    up:'#e3edf5', low:'#f6ead8',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424',
    good:'#d9e8c7', bad:'#f0d4d4', deep:'#a31d1d', gray:'#ececec' };
  const MONO = '"JetBrains Mono", monospace', SANS = '"Noto Sans TC", sans-serif';

  const RUNS = [
    { s:'catsanddog', dict:['cat', 'cats', 'and', 'sand', 'dog'] },
    { s:'catsandog',  dict:['cats', 'dog', 'sand', 'and', 'cat'] },
  ];

  const q = x => '"' + x + '"';
  const fmtList = l => l.length ? '[' + l.map(q).join(', ') + ']' : '[ ]';

  /* ---------- 實跑 dfs,收集事件 → 步驟 ---------- */
  function build() {
    const steps = [];
    RUNS.forEach((R, ri) => {
      const s = R.s, n = s.length, dict = new Set(R.dict);
      const memo = new Map(), order = [];
      const stack = [];
      let pending = null;                         // "word" ✓ → 下一個事件併進同一步
      function snap(k, o) {
        steps.push(Object.assign({
          k, run: ri, s, n, dict: R.dict,
          stack: stack.map(f => ({ st: f.st, via: f.via, got: f.got.length, tries: f.tries.slice() })),
          memo: Object.fromEntries([...memo].map(([a, b]) => [a, b.slice()])),
          order: order.slice(), word: pending,
        }, o));
        pending = null;
      }
      function dfs(start, via) {
        const f = { st: start, via, got: [], tries: [], parts: [] };
        stack.push(f);
        if (memo.has(start)) {                                    // ①
          const l = memo.get(start);
          snap('hit', { at: start, list: l.slice() });
          stack.pop(); return l;
        }
        if (start === n) {                                        // ②
          snap('base', { at: start, list: [''] });
          stack.pop(); return [''];
        }
        snap('start', { at: start });
        const sentences = f.got;
        for (let end = start + 1; end <= n; end++) {
          const word = s.substr(start, end - start);
          const ok = dict.has(word);
          f.tries.push({ w: word, ok });
          if (!ok) continue;
          pending = { start, end, w: word };
          const rest = dfs(end, word);                            // ③
          f.parts.push({ w: word, rest: rest.slice() });
          for (const r of rest) sentences.push(r === '' ? word : word + ' ' + r);
        }
        memo.set(start, sentences.slice()); order.push(start);    // ④
        snap('store', { at: start, list: sentences.slice(), parts: f.parts.slice(), last: stack.length === 1 });
        stack.pop(); return sentences;
      }
      dfs(0, null);
    });
    return steps;
  }

  const STEPS = build();

  /* ---------- 文字 ---------- */
  const code = s => '<code>' + s + '</code>';
  const triesStr = (tries) => {
    if (!tries.length) return '';
    if (tries.length <= 3) return tries.map(t => t.w + (t.ok ? ' ✓' : ' ✗')).join(' · ');
    const okW = tries.filter(t => t.ok).map(t => t.w + ' ✓'), bad = tries.length - okW.length;
    return okW.concat(bad ? ['其餘 ' + bad + ' 個 ✗'] : []).join(' · ');
  };
  STEPS.forEach(st => {
    const R = RUNS[st.run], wd = st.word;
    const runTag = 'RUN ' + (st.run + 1);
    if (st.k === 'start' && !wd) {
      st.line = 'return dfs(s, 0, dict, memo);   // memo 空的';
      st.res = runTag + ' · dfs(0) 開始 · memo 全部未算';
      st.text = st.run === 0
        ? '<strong>RUN 1 · s = "catsanddog" · dfs(0) 開始</strong> · ' + code('dfs(start)') + ' 回傳「後綴 ' + code('s[start..n)') + ' 能切出的所有句子」。' +
          'memo 表一格對一個 start:虛線 ? = <b>還沒算</b>;算完不管有沒有句子都會存進去。現在 memo 是空的,從 start = 0 開始試每個 end。'
        : '<strong>RUN 2 · 換一組輸入 s = "catsandog"</strong> · 同一個程式、新的 memo(全部未算)。這組 ' + code('"og"') + ' 結尾切不出字,' +
          '看 <b>空 list [ ] 存進 memo</b> 之後怎麼被命中。dfs(0) 開始。';
      return;
    }
    const wPart = wd ? code(q(wd.w)) + ' 在 dict → ' : '';
    if (st.k === 'start') {
      st.line = 'for (rest : dfs(s, ' + st.at + ', dict, memo))   // word = ' + q(wd.w);
      st.res = q(wd.w) + ' ✓ → dfs(' + st.at + ') · memo[' + st.at + '] 未算 → 往下算';
      st.text = '<strong>' + q(wd.w) + ' ✓ → dfs(' + st.at + ') 開始</strong> · dfs(' + wd.start + ') 試到 end = ' + wd.end + ',' + wPart +
        '呼叫 ' + code('dfs(' + st.at + ')') + ' 要後綴 ' + code(q(st.s.slice(st.at))) + ' 的所有句子。memo[' + st.at + '] 還是虛線 → <b>沒算過,得真的往下算</b>;' +
        'dfs(' + wd.start + ') 停在這裡等它回傳。';
    } else if (st.k === 'base') {
      st.line = 'if (start == (int)s.size()) return {""};   // ②';
      st.res = q(wd.w) + ' ✓ → dfs(' + st.at + ') = base → 回傳 {""}';
      st.text = '<strong>' + q(wd.w) + ' ✓ → dfs(' + st.at + ') 是 base</strong> · ' + wPart + '後綴已經空了。空後綴回傳<b>一句空句子 {""}</b>(不是 [ ]!):' +
        '代表「剩下的切法有 1 種:什麼都不用切」。上一層拿到它,' + code('rest.empty()') + ' 成立 → 句子就是 ' + code(q(wd.w)) + ' 本身。';
    } else if (st.k === 'hit') {
      const k = st.list.length;
      st.line = 'if (it != memo.end()) return it->second;   // ① memo[' + st.at + ']';
      st.res = q(wd.w) + ' ✓ → dfs(' + st.at + ') memo 命中 → ' + k + ' 句 ' + fmtList(st.list);
      st.text = '<strong>' + q(wd.w) + ' ✓ → dfs(' + st.at + ') · memo 命中!</strong> · ' + wPart + '又要後綴 ' + code(q(st.s.slice(st.at))) + '。' +
        'memo[' + st.at + '] 已經算過 → 第一行就直接 return,<b>整棵子樹不用再跑</b>。' +
        (k ? '拿到 ' + fmtList(st.list) + ',接上 ' + q(wd.w) + ' 就好。'
           : '拿到的是 <b>[ ]</b>:這不是「沒算過」,而是已經算過的答案「這段後綴切不完」,所以 ' + q(wd.w) + ' 這條路一句都接不出來。');
    } else {
      const k = st.list.length;
      st.line = 'memo[' + st.at + '] = sentences;   // ④' + (st.last ? ' 然後 return' : '');
      st.res = 'memo[' + st.at + '] = ' + fmtList(st.list) + (st.last ? ' → 答案' : '');
      const built = st.parts.length
        ? st.parts.map(p => code(q(p.w)) + ' + ' + (p.rest.length ? p.rest.map(r => r === '' ? '{""}' : q(r)).join('、') : '[ ]')).join(';') + '。'
        : '';
      let t = '<strong>dfs(' + st.at + ') 迴圈跑完 · 存 memo[' + st.at + ']' + (st.last ? ' · 回傳答案' : '') + '</strong> · 試了:' + triesStr(st.stack[st.stack.length - 1].tries) + '。';
      if (k) t += '結果往上流:' + built + '每個子呼叫回傳的句子前面接上自己的 word → <b>' + fmtList(st.list) + '</b>。';
      else t += (st.parts.length ? built + '子呼叫一句都沒給 → ' : '沒有任何前綴在 dict 裡 → ') + 'sentences 是空的,<b>照樣存 memo[' + st.at + '] = [ ]</b>:「這段後綴切不完」也是算好的答案,下次直接拿。';
      if (st.last) t += st.run === 0 ? ' 兩條句子共用了 memo[7] 的 "dog",dfs(7) 只真的算了一次。' : ' 整條字串切不完,wordBreak 回傳 [ ]。';
      st.text = t;
    }
  });

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
    function tri(x,y,color){ ctx.fillStyle=color; ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x-6,y+8); ctx.lineTo(x+6,y+8); ctx.closePath(); ctx.fill(); }
    function arrow(x1,y,x2,color,lw){ line(x1,y,x2-2,y,color,lw); ctx.fillStyle=color; ctx.beginPath(); ctx.moveTo(x2,y); ctx.lineTo(x2-7,y-4.5); ctx.lineTo(x2-7,y+4.5); ctx.closePath(); ctx.fill(); }
    const F = (wt, sz) => wt + ' ' + sz + 'px ' + MONO + ', ' + SANS;
    function fitTxt(s, x, y, color, wt, sz, maxW, align){ let f = sz; ctx.font = F(wt, f);
      while (f > 8 && ctx.measureText(s).width > maxW) { f -= 0.5; ctx.font = F(wt, f); }
      txt(s, x, y, color, F(wt, f), align); }

    function draw(){
      fit();
      const st = steps[step], w = canvas.clientWidth, PAD = 22;
      ctx.fillStyle = C.paper; ctx.fillRect(0, 0, w, canvas.clientHeight); ctx.setLineDash([]);
      const n = st.n, cols = n + 1, LBL = 40, X0 = PAD + LBL, colW = (w - PAD - X0) / cols;
      const cx = i => X0 + i * colW + colW / 2;
      const wd = st.word, top = st.stack[st.stack.length - 1];
      // 這一步的 start / end / 關心的後綴
      let S, E = null, sufFrom;
      if (wd) { S = wd.start; E = wd.end; sufFrom = wd.end; }
      else { S = st.at; sufFrom = st.at; }
      const loopFrame = wd ? st.stack[st.stack.length - 2] : top;   // 這一步顯示誰的 for 迴圈

      /* ---- BAND 1 · 字串 ---- */
      head('BAND 1 · 字串 s   紅 = 這一步切下的 word = s[start,end)   藍 = 子呼叫要處理的後綴', PAD, 16);
      fitTxt('RUN ' + (st.run + 1) + ' / 2 · s = "' + st.s + '" (n = ' + n + ') · dict = {' + st.dict.join(', ') + '}', PAD, 40,
        C.ink, 700, 12.5, w - 2 * PAD, 'left');
      const IY = 62, CY = 76, CH = 32;
      txt('i', PAD, IY, C.dim, F(700, 11), 'left');
      txt('s', PAD, CY + CH / 2, C.dim, F(700, 12), 'left');
      for (let i = 0; i <= n; i++) {
        const hot = i === S;
        txt(String(i), cx(i), IY, hot ? C.curT : C.dim, F(hot ? 800 : 700, hot ? 12 : 11));
        const x = X0 + i * colW + 2, cw = colW - 4;
        if (i === n) { box(x, CY, cw, CH, C.paper, C.off, 1.1, [3, 3]); txt('end', x + cw / 2, CY + CH / 2 + 1, C.dim, F(600, 10)); continue; }
        const inWord = wd && i >= wd.start && i < wd.end, inSuf = i >= sufFrom;
        let fill = C.paper, sc = C.ink, lw = 1.2, tc = C.ink;
        if (inWord) { fill = C.cur; sc = C.curS; lw = 2.2; tc = C.curT; }
        else if (inSuf) { fill = C.up; }
        else if (i < S) { tc = C.dim; sc = C.off; }
        box(x, CY, cw, CH, fill, sc, lw);
        txt(st.s[i], x + cw / 2, CY + CH / 2 + 1, tc, F(700, 15));
      }
      // ▲ start / ▲ end
      const MY = CY + CH + 6;
      tri(cx(S), MY, C.curS); txt('start', cx(S), MY + 20, C.curT, F(700, 10.5));
      if (E !== null) { tri(cx(E), MY, C.dim); txt('end', cx(E), MY + 20, C.dim, F(700, 10.5)); }
      // 這層 for 試過的 end
      { const tr = loopFrame ? loopFrame.tries : [];
        const msg = (st.k === 'start' && !wd) ? 'dfs(0) 的 for 迴圈還沒開始試'
          : 'dfs(' + loopFrame.st + ') 的 for 試過:' + (tr.length ? (function () {
              if (tr.length <= 4) return tr.map(t => t.w + (t.ok ? ' ✓' : ' ✗')).join(' · ');
              const ok = tr.filter(t => t.ok).map(t => t.w + ' ✓'), bad = tr.length - ok.length;
              return ok.concat(bad ? ['其餘 ' + bad + ' 個不在 dict ✗'] : []).join(' · ');
            })() : '—');
        fitTxt(msg, PAD, 156, C.ink, 600, 11.5, w - 2 * PAD, 'left'); }

      /* ---- BAND 2 · memo 表 ---- */
      const b2 = 190;
      head('BAND 2 · memo[start] = 後綴 s[start..n) 的句子   虛線 ? = 未算   [ ] = 算過但切不完', PAD, b2);
      const SY = 226, SH = 36, IY2 = 212;
      txt('memo', PAD, SY + SH / 2, C.dim, F(700, 11), 'left');
      for (let i = 0; i <= n; i++) {
        const x = X0 + i * colW + 2, cw = colW - 4, has = Object.prototype.hasOwnProperty.call(st.memo, i);
        const write = st.k === 'store' && st.at === i, hit = st.k === 'hit' && st.at === i, base = st.k === 'base' && i === n;
        txt(String(i), cx(i), IY2, (write || hit) ? C.curT : C.dim, F((write || hit) ? 800 : 700, 11));
        if (i === n && !has) {
          box(x, SY, cw, SH, base ? C.up : C.paper, base ? C.curS : C.off, base ? 2.4 : 1.1, [3, 3]);
          fitTxt(base ? '{""}' : 'base', x + cw / 2, SY + SH / 2 + 1, base ? C.curT : C.dim, 700, 10.5, cw - 6);
          continue;
        }
        if (!has) { box(x, SY, cw, SH, C.paper, C.off, 1.1, [3, 3]); txt('?', x + cw / 2, SY + SH / 2 + 1, C.off, F(700, 13)); continue; }
        const l = st.memo[i];
        let fill = l.length ? C.good : C.gray, sc = C.ink, lw = 1.4;
        if (write) { sc = C.curS; lw = 2.8; }
        if (hit) { fill = C.up; sc = C.deep; lw = 2.8; }
        box(x, SY, cw, SH, fill, sc, lw);
        fitTxt(l.length ? l.length + ' 句' : '[ ]', x + cw / 2, SY + SH / 2 + 1, hit ? C.deep : C.ink, 800, 12, cw - 6);
        if (write || hit) {
          const tw = Math.max(cw, 44), tx = cx(i) - tw / 2, ty = SY + SH + 6;
          box(tx, ty, tw, 16, hit ? C.deep : C.curS, hit ? C.deep : C.curS, 1);
          fitTxt(hit ? '命中' : '寫入', cx(i), ty + 8.5, C.paper, 700, 10, tw - 4);
        }
      }
      // 已存內容(依存入順序,2 欄)
      { const DY = 294, DH = 20, gap = 12, dw = (w - 2 * PAD - gap) / 2;
        if (!st.order.length) {
          box(PAD, DY, w - 2 * PAD, DH, C.paper, C.off, 1.1, [3, 3]);
          fitTxt('memo 內容:還沒有任何格子算完', PAD + 10, DY + DH / 2 + 1, C.dim, 600, 11, w - 2 * PAD - 20, 'left');
        }
        st.order.forEach((p, j) => {
          const x = PAD + (j % 2) * (dw + gap), y = DY + Math.floor(j / 2) * (DH + 6), l = st.memo[p];
          const write = st.k === 'store' && st.at === p, hit = st.k === 'hit' && st.at === p;
          let fill = l.length ? C.good : C.gray, sc = C.ink, lw = 1.1, tc = C.ink;
          if (write) { sc = C.curS; lw = 2.2; }
          if (hit) { fill = C.up; sc = C.deep; lw = 2.2; tc = C.deep; }
          box(x, y, dw, DH, fill, sc, lw);
          fitTxt('memo[' + p + '] = ' + fmtList(l) + (l.length ? '' : '  切不完'), x + 8, y + DH / 2 + 1, tc, 700, 11, dw - 16, 'left');
        });
      }

      /* ---- BAND 3 · call stack ---- */
      const b3 = 366;
      head('BAND 3 · call stack(左 = 最外層,箭頭上的字 = 切下的 word)', PAD, b3);
      { const FY = 382, FH = 50, GAP = 42, FW = Math.min(170, (w - 2 * PAD - 3 * GAP) / 4);
        const fx = j => PAD + j * (FW + GAP);
        st.stack.forEach((f, j) => {
          const isTop = j === st.stack.length - 1, x = fx(j);
          let fill = C.paper, sc = C.ink, lw = 1.3, l1, l2, c1 = C.ink, c2 = C.dim;
          if (!isTop) { l1 = 'dfs(' + f.st + ') · 等子呼叫'; l2 = '已收 ' + f.got + ' 句'; }
          else if (st.k === 'start') { fill = C.cur; sc = C.curS; lw = 2.4; c1 = C.curT; c2 = C.curT; l1 = 'dfs(' + f.st + ') · 開始'; l2 = 'memo[' + f.st + '] 未算 → for'; }
          else if (st.k === 'base') { fill = C.up; sc = C.curS; lw = 2.4; c1 = C.curT; c2 = C.ink; l1 = 'dfs(' + f.st + ') · base'; l2 = '回傳 {""}'; }
          else if (st.k === 'hit') { fill = C.up; sc = C.deep; lw = 2.6; c1 = C.deep; c2 = C.ink; l1 = 'dfs(' + f.st + ') · 命中'; l2 = '回傳 ' + fmtList(st.list); }
          else { fill = st.list.length ? C.good : C.gray; sc = C.curS; lw = 2.6; c1 = C.curT; c2 = C.ink; l1 = 'dfs(' + f.st + ') · 存 + 回傳'; l2 = st.list.length > 1 ? '回傳 ' + st.list.length + ' 句' : '回傳 ' + fmtList(st.list); }
          box(x, FY, FW, FH, fill, sc, lw);
          fitTxt(l1, x + FW / 2, FY + 16, c1, 700, 12, FW - 10);
          fitTxt(l2, x + FW / 2, FY + 35, c2, 700, 11, FW - 10);
          if (j > 0) {
            const ax1 = fx(j - 1) + FW + 4, ax2 = x - 4, my = FY + FH / 2, hot = isTop;
            fitTxt(q(f.via), (ax1 + ax2) / 2, my - 12, hot ? C.curT : C.dim, 700, 10.5, GAP - 4);
            arrow(ax1, my + 2, ax2, hot ? C.curS : C.dim, hot ? 2 : 1.2);
            if (isTop && st.k !== 'start') txt('↩', (ax1 + ax2) / 2, my + 15, C.curT, F(700, 11));
          }
        });
        // 空的槽位(最多 4 層)
        for (let j = st.stack.length; j < 4; j++) box(fx(j), FY, FW, FH, C.paper, C.off, 1, [3, 3]);
      }

      /* ---- BAND 4 · 這一步 ---- */
      const b4 = 470;
      head('BAND 4 · 這一步(哪一行跑了)', PAD, b4);
      { const by = b4 + 12, bh = 32, inner = w - 2 * PAD, w1 = Math.round(inner * 0.5), w2 = inner - w1 - 10;
        let f2 = C.cur, s2 = C.curS, c2 = C.curT;
        if (st.k === 'hit') { f2 = C.up; s2 = C.deep; c2 = C.deep; }
        else if (st.k === 'store') { f2 = st.list.length ? C.good : C.gray; s2 = C.ink; c2 = C.ink; }
        else if (st.k === 'base') { f2 = C.up; s2 = C.curS; c2 = C.curT; }
        box(PAD, by, w1, bh, C.paper, C.ink, 1.4);
        fitTxt(st.line, PAD + 10, by + bh / 2 + 1, C.ink, 700, 11.5, w1 - 18, 'left');
        box(PAD + w1 + 10, by, w2, bh, f2, s2, 2);
        fitTxt(st.res, PAD + w1 + 10 + w2 / 2, by + bh / 2 + 1, c2, 700, 11.5, w2 - 14); }
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

  mount('v140m', STEPS);
})();
