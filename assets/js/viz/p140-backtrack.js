/* ============================================================
   P140 · Word Break II — ① 純回溯 · viz
     void dfs(s, start, dict, path, ans) {
       if (start == n) { ans.push_back(path); return; }            // ① 整串切完
       for (int end = start + 1; end <= n; end++) {                 // ② 這個字切到哪
         string word = s.substr(start, end - start);
         if (!dict.count(word)) continue;                           // ③ 不是字
         int oldLen = path.size();                                  // ④ 接上
         if (!path.empty()) path += ' ';
         path += word;
         dfs(s, end, dict, path, ans);
         path.resize(oldLen);                                       // ⑤ 拿掉(連空格)
       }
     }
   s = "catsanddog", dict = {cat, cats, and, sand, dog}(g++ 實跑 trace):
     7 次 dfs、29 次 substr + 查字典(6 ✓ 23 ✗)、2 句 ["cat sand dog", "cats and dog"]。
   步驟(16 步,由 JS 實跑同一段 dfs 產生):
     INIT · 接上 ×6(前面一串 ✗ 併進同一步)· 收答案 ×2 ·
     拿掉 / return ×5(回來後的 ✗ 與 return 併進同一步;拿掉後馬上 ✓ 的話,拿掉自己一步)· 完成。
   BAND 1 字串:10 格 + 邊界 index 0..10;path 已接上的字用藍 / 米交錯底色、字與字之間粗線 = 切點;
           這一步 ✓ 的字 = 紅框;拿掉的字 = 深紅虛線框;下方 end 列:粉條 + ✗ = 沒查到,✓ = 查到;再下面列出這步查過的字。
   BAND 2 path 與 call stack:path 字串(新接上的「␣字」紅框、拿掉的深紅虛線 + 刪除線),
           call stack 由淺到深排開,紅 = 目前這層,虛線 = 這一步 return 掉的。
   BAND 3 答案與計數:ans 兩格、dfs x / 7、查字典 y / 29。
   BAND 4 這一步(哪一行跑了 + 結果)。
   前綴 v140a 。
   ============================================================ */
(function () {
  const C = { paper:'#ffffff', ink:'#1f1f1f', dim:'#5a5a5a', off:'#cfcfcf',
    up:'#e3edf5', low:'#f6ead8',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424',
    good:'#d9e8c7', bad:'#f0d4d4', deep:'#a31d1d', gray:'#ececec' };
  const MONO = '"JetBrains Mono", monospace', SANS = '"Noto Sans TC", sans-serif';
  const S = 'catsanddog', NL = S.length;
  const DICT_LIST = ['cat', 'cats', 'and', 'sand', 'dog'];
  const DICT = new Set(DICT_LIST);

  /* ---------- 實跑 dfs,切步驟 ---------- */
  function build() {
    const steps = [];
    let path = '';
    const words = [];                 // path 裡的字 {w, a, b}:s[a, b)
    const ans = [];
    const stack = [], ends = {};
    let calls = 0, checks = 0;
    let pend = { fails: [], popped: [], undo: null };
    let take = null;                  // 等 child 進來後再拍(這樣 stack / calls 已含 child)
    const flush = () => { pend = { fails: [], popped: [], undo: null }; };
    function snap(o) {
      return Object.assign({ path, words: words.map(x => Object.assign({}, x)), ans: ans.slice(), calls, checks,
        stack: stack.slice(), ends: Object.assign({}, ends),
        fails: pend.fails.slice(), popped: pend.popped.slice(), undo: pend.undo }, o);
    }
    function dfs(start) {
      calls++; stack.push(start);
      if (take) { steps.push(snap(take)); flush(); take = null; }
      if (start === NL) {
        ans.push(path);
        steps.push(snap({ k: 'sol', start }));
        flush();
        stack.pop(); pend.popped.push(start);
        return;
      }
      for (let end = start + 1; end <= NL; end++) {
        ends[start] = end;
        const word = S.substr(start, end - start);
        const ok = DICT.has(word);
        if (ok && pend.undo) { steps.push(snap({ k: 'undo', start })); flush(); }
        checks++;
        if (!ok) { pend.fails.push({ a: start, b: end, w: word }); continue; }
        const oldLen = path.length;
        if (path.length) path += ' ';
        path += word;
        words.push({ w: word, a: start, b: end });
        take = { k: 'take', start, end, word, oldLen };
        dfs(end);
        const removed = path.slice(oldLen);
        path = path.slice(0, oldLen);
        const rw = words.pop();
        pend.undo = { removed, oldLen, a: rw.a, b: rw.b, w: rw.w, from: start };
      }
      stack.pop(); pend.popped.push(start);
      steps.push(snap({ k: 'ret', start }));
      flush();
    }
    take = { k: 'init' };
    dfs(0);
    steps.push(snap({ k: 'fin' }));
    return { steps, ans, calls, checks };
  }
  const RUN = build();
  const RAW = RUN.steps;
  const TOT_CALLS = RUN.calls, TOT_CHECKS = RUN.checks;

  /* ---------- 文字 ---------- */
  const code = s => '<code>' + s + '</code>';
  const q = s => '"' + s + '"';
  const vis = s => s.replace(/ /g, '␣');
  const failList = f => f.map(x => q(x.w) + ' ✗').join('、');
  RAW.forEach((s, i) => {
    const fl = s.fails;
    if (s.k === 'init') {
      s.line = 'string path; dfs(s, 0, dict, path, ans);';
      s.res = 'path = "" · 從 start = 0 開始';
      s.text = '<strong>INITIAL · s = "catsanddog"</strong> · dict = {' + DICT_LIST.join(', ') + '}。' +
        '每一層 ' + code('dfs(start)') + ' 讓 ' + code('end') + ' 從 start+1 試到 n,切出 ' + code('s.substr(start, end - start)') + ' 去查字典;' +
        '查到就接到 ' + code('path') + ' 後面、從 end 繼續切,回來再 ' + code('resize') + ' 拿掉。<b>切到 start == n,path 就是一句答案</b>。';
    } else if (s.k === 'take') {
      s.line = 'dict.count(' + q(s.word) + ') ✓ → path += ' + q((s.oldLen ? ' ' : '') + s.word) + '; dfs(' + s.end + ');';
      s.res = (fl.length ? fl.map(x => x.w + ' ✗').join(' ') + ' → ' : '') + s.word + ' ✓ · 進 dfs(' + s.end + ')';
      s.text = '<strong>dfs(' + s.start + ') · ' + (fl.length ? fl.map(x => x.w + ' ✗').join('、') + ' → ' : '') + s.word + ' ✓ 接上</strong> · ' +
        (fl.length ? failList(fl) + ' 都不在字典 → ' + code('continue') + '。' : '') +
        q(s.word) + ' 在字典裡:記下 ' + code('oldLen = ' + s.oldLen) + ',' +
        (s.oldLen ? '<code>path</code> 不是空的,先補一個空格再接字' : '<code>path</code> 是空的,不用空格,直接接字') +
        ' → path = <b>' + q(s.path) + '</b>,呼叫 ' + code('dfs(' + s.end + ')') + ' 從 index ' + s.end + ' 繼續切。';
    } else if (s.k === 'sol') {
      s.line = 'if (start == (int)s.size()) { ans.push_back(path); return; }';
      s.res = '收 ans[' + (s.ans.length - 1) + '] = ' + q(s.path);
      s.text = '<strong>dfs(10) · start == n → 收「' + s.path + '」</strong> · 整串剛好切完,沒有剩下的字元,' +
        code('path') + ' 就是一句合法的句子 → ' + code('ans.push_back(path)') + '(複製一份進去),<b>ans 現在有 ' + s.ans.length + ' 句</b>。' +
        '接著 return;path 不在這層改,由上一層的 ' + code('resize') + ' 負責拿掉。';
    } else if (s.k === 'ret' || s.k === 'undo') {
      const u = s.undo;
      const tried = fl.length ? '接著試 end = ' + fl.map(x => x.b).join('、') + ':' + failList(fl) + ',都不是字。' : '';
      if (s.k === 'undo') {
        s.line = 'path.resize(' + u.oldLen + ');   // 拿掉 ' + q(vis(u.removed));
        s.res = 'path = ' + q(s.path) + ' · 繼續試 end = ' + (u.b + 1);
        s.text = '<strong>回到 dfs(' + s.start + ') · 拿掉 ' + q(u.w) + '</strong> · ' + code('path.resize(' + u.oldLen + ')') +
          ' 把剛才接上的 ' + q(u.w) + ' 砍掉,path 變回 <b>' + q(s.path) + '</b>(oldLen = 0,前面沒有空格要拿)。' +
          tried + '下一步 end 往後推到 ' + (u.b + 1) + ',試看看更長的字。';
      } else {
        const last = s.start === 0;
        s.line = 'path.resize(' + u.oldLen + ');' + (fl.length ? ' end ' + fl[0].b + '..' + fl[fl.length - 1].b + ' 全 ✗;' : '') + ' return;';
        s.res = '拿掉 ' + vis(u.removed) + (fl.length ? ' · ' + fl.length + ' 個 ✗' : '') + ' → dfs(' + s.start + ') return';
        const back = s.popped.filter(x => x !== s.start);
        s.text = '<strong>' + (back.length ? 'dfs(' + back.join(')、dfs(') + ') return → ' : '') + '回到 dfs(' + s.start + ') · 拿掉 ' + q(vis(u.removed)) + ' → return</strong> · ' +
          code('path.resize(' + u.oldLen + ')') + ' 把剛接上的字' + (u.removed[0] === ' ' ? '<b>連同前面的空格</b>' : '') + '一起砍掉,path 回到 ' + q(s.path) + '。' +
          tried + 'end 已經試到 n,迴圈結束 → ' +
          (last ? '<b>dfs(0) 也 return,整個搜尋結束</b>。' : '<b>dfs(' + s.start + ') return</b>,回到上一層。');
      }
    } else {
      s.line = 'return ans;   // {' + s.ans.map(q).join(', ') + '}';
      s.res = s.ans.length + ' 句 · ' + TOT_CALLS + ' 次 dfs · ' + TOT_CHECKS + ' 次查字典';
      const hits = RAW.filter(t => t.k === 'take').length;
      s.text = '<strong>完成 · ' + s.ans.length + ' 句</strong> · ans = [' + s.ans.map(q).join(', ') + ']。' +
        '一共 ' + TOT_CALLS + ' 次 dfs(' + hits + ' 次接上 + 最外層那次)、' + TOT_CHECKS + ' 次 substr + 查字典(' + hits + ' ✓、' + (TOT_CHECKS - hits) + ' ✗)。' +
        '<b>dfs(7) 被叫了兩次</b>,後面的 d、do、dog 也查了兩遍 —— 純回溯會重複算同一個 start,這就是加 memo 的動機。';
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
    function rect(x,y,w,h,fill,stroke,lw,dash){ if(fill){ctx.fillStyle=fill; ctx.fillRect(x,y,w,h);} if(stroke){ ctx.lineWidth=lw||1.4; if(dash) ctx.setLineDash(dash); ctx.strokeStyle=stroke; ctx.strokeRect(x,y,w,h); ctx.setLineDash([]); } }
    function txt(s,x,y,color,font,align,base){ ctx.fillStyle=color; ctx.font=font; ctx.textAlign=align||'center'; ctx.textBaseline=base||'middle'; ctx.fillText(s,x,y); }
    function head(s,x,y){ txt(s,x,y,C.dim,'600 12px '+MONO+', '+SANS,'left','alphabetic'); }
    function line(x1,y1,x2,y2,color,lw,dash){ ctx.strokeStyle=color; ctx.lineWidth=lw; if(dash) ctx.setLineDash(dash); ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); ctx.setLineDash([]); }
    const F = (wt, sz) => wt + ' ' + sz + 'px ' + MONO + ', ' + SANS;
    function fitTxt(s, x, y, color, wt, sz, maxW, align){ let f = sz; ctx.font = F(wt, f);
      while (f > 9 && ctx.measureText(s).width > maxW) { f -= 0.5; ctx.font = F(wt, f); }
      txt(s, x, y, color, F(wt, f), align); }

    function draw(){
      fit();
      const s = steps[step], w = canvas.clientWidth, PAD = 22, inner = w - 2*PAD;
      ctx.fillStyle = C.paper; ctx.fillRect(0, 0, w, canvas.clientHeight); ctx.setLineDash([]);
      const fin = s.k === 'fin', isTake = s.k === 'take', isSol = s.k === 'sol';
      const u = (s.k === 'ret' || s.k === 'undo') ? s.undo : null;
      const tint = j => (j % 2 === 0 ? C.up : C.low);

      /* ---- BAND 1 · 字串 ---- */
      head('BAND 1 · 字串 s   dict = {' + DICT_LIST.join(', ') + '}', PAD, 16);
      const LBL = 40, cx0 = PAD + LBL, cw = (w - PAD - 10 - cx0) / NL, cy = 48, ch = 38;
      const bx = i => cx0 + i * cw;
      // 這一步「作用中」的 start(紅色 index)
      let hotA = -1, hotB = -1;
      if (isTake) { hotA = s.start; hotB = s.end; }
      else if (isSol) { hotA = NL; }
      else if (u || s.k === 'ret') { hotA = s.start; }
      else if (s.k === 'init') { hotA = 0; }
      txt('index', PAD, 34, C.dim, F(700, 10.5), 'left');
      for (let i = 0; i <= NL; i++) {
        const hot = i === hotA || i === hotB;
        txt(String(i), bx(i), 34, hot ? C.curS : C.dim, F(hot ? 800 : 600, hot ? 12.5 : 11));
      }
      txt('s', PAD, cy + ch/2 + 1, C.dim, F(700, 12), 'left');
      const wordOf = Array(NL).fill(-1);
      s.words.forEach((wd, j) => { for (let i = wd.a; i < wd.b; i++) wordOf[i] = j; });
      for (let i = 0; i < NL; i++) {
        let fill = C.paper, tc = C.ink;
        if (wordOf[i] >= 0) fill = isSol ? C.good : tint(wordOf[i]);
        if (isTake && i >= s.start && i < s.end) { fill = C.cur; tc = C.curT; }
        if (u && i >= u.a && i < u.b) { fill = C.gray; tc = C.dim; }
        rect(bx(i), cy, cw, ch, fill, C.ink, 1);
        txt(S[i], bx(i) + cw/2, cy + ch/2 + 1, tc, F(800, 18));
      }
      // 切點:path 裡字與字之間
      s.words.forEach((wd, j) => { if (j > 0) line(bx(wd.a), cy - 4, bx(wd.a), cy + ch + 4, C.ink, 3); });
      if (isTake) rect(bx(s.start), cy, bx(s.end) - bx(s.start), ch, null, C.curS, 3);
      if (u) rect(bx(u.a) + 1.5, cy + 1.5, bx(u.b) - bx(u.a) - 3, ch - 3, null, C.deep, 2.2, [5, 3]);

      // end 列:這一步試過的 end
      const ey = cy + ch + 14;
      txt('end', PAD, ey + 9, C.dim, F(700, 10.5), 'left');
      const tries = s.fails.map(f => ({ a: f.a, b: f.b, w: f.w, ok: false }));
      if (isTake) tries.push({ a: s.start, b: s.end, w: s.word, ok: true });
      if (tries.length) {
        const a = tries[0].a, maxB = Math.max(...tries.map(t => t.b));
        const fails = tries.filter(t => !t.ok);
        line(bx(a), ey, bx(maxB), ey, C.dim, 1.2);
        if (fails.length) rect(bx(a), ey - 4, bx(Math.max(...fails.map(t => t.b))) - bx(a), 8, C.bad, C.deep, 1);
        const okT = tries.find(t => t.ok);
        if (okT) line(bx(okT.a), ey + 6, bx(okT.b), ey + 6, C.curS, 2.4);
        line(bx(a), ey - 7, bx(a), ey + 8, C.ink, 1.6);
        tries.forEach(t => {
          const x = bx(t.b);
          line(x, ey - 7, x, ey + 8, t.ok ? C.curS : C.deep, 1.6);
          box(x - 11, ey + 12, 22, 17, t.ok ? C.good : C.bad, t.ok ? C.ink : C.deep, 1.1);
          txt(t.ok ? '✓' : '✗', x, ey + 21, t.ok ? C.ink : C.deep, '800 11px ' + SANS + ', ' + MONO);
        });
      } else {
        line(cx0, ey, w - PAD - 10, ey, C.off, 1, [3, 3]);
      }

      // 這一步查過的字
      const qy = ey + 42, qh = 24;
      txt('查字典', PAD, qy + qh/2 + 1, C.dim, F(700, 10.5), 'left');
      const qx0 = cx0, qAvail = w - PAD - qx0;
      if (tries.length) {
        const gap = 8, slot = Math.min(118, (qAvail - 5 * gap) / 6);
        tries.forEach((t, j) => {
          const x = qx0 + j * (slot + gap);
          box(x, qy, slot, qh, t.ok ? C.cur : C.bad, t.ok ? C.curS : C.deep, t.ok ? 2.2 : 1.1);
          fitTxt(t.w + (t.ok ? ' ✓' : ' ✗'), x + slot/2, qy + qh/2 + 1, t.ok ? C.curT : C.deep, 700, 12, slot - 10);
        });
        const after = qx0 + tries.length * (slot + gap);
        const rest = w - PAD - after;
        let tail = '';
        if (isTake) tail = '→ 接上,進 dfs(' + s.end + ')';
        else if (s.k === 'ret') tail = '→ end 到底,return';
        if (tail && rest > 90) fitTxt(tail, after + 2, qy + qh/2 + 1, isTake ? C.curT : C.deep, 700, 12, rest - 4, 'left');
      } else {
        let msg = '';
        if (s.k === 'init') msg = 'start = 0 · end 會從 1 試到 10';
        else if (isSol) msg = 'start == n → 不查字典,直接收答案';
        else if (s.k === 'undo') msg = '這一步不查字典,只做 path.resize(' + u.oldLen + ')';
        else if (s.k === 'ret') msg = '拿掉 ' + q(u.w) + ' 後 end 已到 n → 迴圈結束,return';
        else msg = '共查 ' + TOT_CHECKS + ' 次 · 6 ✓ · ' + (TOT_CHECKS - 6) + ' ✗';
        fitTxt(msg, qx0, qy + qh/2 + 1, (s.k === 'ret') ? C.deep : C.dim, 600, 12, qAvail, 'left');
      }

      /* ---- BAND 2 · path 與 call stack ---- */
      const b2 = 200;
      head('BAND 2 · path(string&,全程只有一份)與 call stack', PAD, b2);
      const L2 = 92;
      // path
      { const py = b2 + 14, ph = 38, px = PAD + L2, pw = w - PAD - px;
        txt('path', PAD, py + ph/2 + 1, C.dim, F(700, 12), 'left');
        box(px, py, pw, ph, C.paper, C.ink, 1.4);
        const toks = [];        // {t, kind: 'w'|'sp'|'add'|'rm', j}
        const nW = s.words.length;
        s.words.forEach((wd, j) => {
          const added = isTake && j === nW - 1;
          if (j > 0) toks.push({ t: added ? '␣' : ' ', kind: added ? 'add' : 'sp' });
          toks.push({ t: wd.w, kind: added ? 'add' : 'w', j });
        });
        if (u) {
          if (u.removed[0] === ' ') toks.push({ t: '␣', kind: 'rm' });
          toks.push({ t: u.removed.replace(/^ /, ''), kind: 'rm' });
        }
        const FS = 17; ctx.font = F(700, FS);
        const chW = ctx.measureText('m').width;
        const ty = py + ph/2 + 1;
        let x = px + 14;
        txt('"', x, ty, C.dim, F(700, FS), 'left'); x += chW + 2;
        const kept = toks.filter(tk => tk.kind !== 'rm'), rm = toks.filter(tk => tk.kind === 'rm');
        kept.forEach(tk => { tk.x = x; x += tk.t.length * chW; });
        const addT = kept.filter(tk => tk.kind === 'add');
        const qx = x + (addT.length ? 6 : 1);
        kept.forEach(tk => { if (tk.kind === 'w') rect(tk.x - 1, py + 7, tk.t.length * chW + 2, ph - 14, isSol ? C.good : tint(tk.j), null); });
        if (addT.length) { const x0 = addT[0].x, x1 = x; box(x0 - 3, py + 5, x1 - x0 + 6, ph - 10, C.cur, C.curS, 2); }
        kept.forEach(tk => txt(tk.t, tk.x, ty, tk.kind === 'add' ? C.curT : C.ink, F(tk.kind === 'sp' ? 700 : 800, FS), 'left'));
        txt('"', qx, ty, C.dim, F(700, FS), 'left');
        x = qx + chW;
        if (rm.length) {
          x += 16;
          const x0 = x; rm.forEach(tk => { tk.x = x; x += tk.t.length * chW; });
          box(x0 - 4, py + 5, x - x0 + 8, ph - 10, C.paper, C.deep, 1.8, [5, 3]);
          rm.forEach(tk => { txt(tk.t, tk.x, ty, C.deep, F(800, FS), 'left'); });
          line(x0, ty, x, ty, C.deep, 1.6);
          x += 4;
        }
        const info = u ? 'resize(' + u.oldLen + ') → size ' + s.path.length : 'size() = ' + s.path.length;
        const infoX = w - PAD - 12, infoMax = infoX - (x + 18);
        if (infoMax > 60) fitTxt(info, infoX, py + ph/2 + 1, u ? C.deep : C.dim, 700, 11.5, infoMax, 'right');
      }
      // call stack
      { const sy = b2 + 68, sh = 44, sx = PAD + L2, sAvail = w - PAD - sx, gap = 14;
        txt('call stack', PAD, sy + sh/2 + 1, C.dim, F(700, 12), 'left');
        const frames = s.stack.map(st => ({ st, live: true })).concat(s.popped.slice().reverse().map(st => ({ st, live: false })));
        const fwid = (sAvail - 3 * gap) / 4;
        if (!frames.length) {
          box(sx, sy, sAvail, sh, fin ? C.good : C.paper, fin ? C.ink : C.off, 1.3, fin ? null : [3, 3]);
          fitTxt(fin ? '全部 return · stack 空了 → 回傳 ans' : '(空)', sx + sAvail/2, sy + sh/2 + 1, C.ink, 700, 12.5, sAvail - 16);
        }
        frames.forEach((fr, j) => {
          const x = sx + j * (fwid + gap), top = fr.live && j === s.stack.length - 1;
          let fill = C.paper, sc = C.ink, lw = 1.3, tc = C.ink, dash = null, sub = '';
          if (fr.live) {
            sub = fr.st === NL ? 'start == n' : (s.ends[fr.st] === undefined || (top && isTake) ? '剛進來' : 'end = ' + s.ends[fr.st]);
            if (top) { fill = isSol ? C.good : C.cur; sc = isSol ? C.ink : C.curS; lw = 2.4; tc = isSol ? C.ink : C.curT; }
          } else { fill = C.paper; sc = C.deep; lw = 1.6; tc = C.deep; dash = [5, 3]; sub = 'return'; }
          box(x, sy, fwid, sh, fill, sc, lw, dash);
          fitTxt('dfs(' + fr.st + ')', x + fwid/2, sy + 15, tc, 800, 13, fwid - 10);
          fitTxt(sub, x + fwid/2, sy + 32, fr.live ? (top ? tc : C.dim) : C.deep, 600, 10.5, fwid - 10);
          if (j > 0) line(x - gap + 3, sy + sh/2, x - 3, sy + sh/2, fr.live ? C.dim : C.off, 1.4);
        });
      }

      /* ---- BAND 3 · 答案與計數 ---- */
      const b3 = 348;
      head('BAND 3 · ans 與計數', PAD, b3);
      { const ay = b3 + 14, ah = 36, cntW = 150, ax = PAD + L2, gap = 12;
        const sw = (w - PAD - cntW - 16 - ax - gap) / 2;
        txt('ans', PAD, ay + ah/2 + 1, C.dim, F(700, 12), 'left');
        for (let i = 0; i < 2; i++) {
          const x = ax + i * (sw + gap), v = s.ans[i], now = isSol && i === s.ans.length - 1;
          if (v === undefined) {
            box(x, ay, sw, ah, C.paper, C.off, 1.2, [3, 3]);
            fitTxt('ans[' + i + ']', x + sw/2, ay + ah/2 + 1, C.off, 600, 12, sw - 12);
          } else {
            box(x, ay, sw, ah, now ? C.cur : C.good, now ? C.curS : C.ink, now ? 2.6 : 1.3);
            fitTxt(q(v), x + sw/2, ay + ah/2 + 1, now ? C.curT : C.ink, 800, 13, sw - 12);
          }
        }
        const cx = w - PAD - cntW;
        box(cx, ay, cntW, ah, fin ? C.good : C.paper, C.ink, 1.2);
        const callNow = isTake || s.k === 'init', chkNow = s.fails.length > 0 || isTake;
        fitTxt('dfs  ' + s.calls + ' / ' + TOT_CALLS, cx + 10, ay + 11, callNow ? C.curT : C.ink, 700, 11.5, cntW - 20, 'left');
        fitTxt('查字典  ' + s.checks + ' / ' + TOT_CHECKS, cx + 10, ay + 26, chkNow ? C.curT : C.ink, 700, 11.5, cntW - 20, 'left');
      }

      /* ---- BAND 4 · 這一步 ---- */
      const b4 = 426;
      head('BAND 4 · 這一步(哪一行跑了)', PAD, b4);
      { const by4 = b4 + 12, bh = 32, w1 = Math.round(inner * 0.55), w2 = inner - w1 - 10;
        let f2 = C.cur, s2 = C.curS, c2 = C.curT, d2 = null;
        if (s.k === 'ret' || s.k === 'undo') { f2 = C.bad; s2 = C.deep; c2 = C.deep; }
        else if (isSol || fin) { f2 = C.good; s2 = C.ink; c2 = C.ink; }
        else if (s.k === 'init') { f2 = C.paper; s2 = C.off; c2 = C.dim; d2 = [3,3]; }
        box(PAD, by4, w1, bh, C.paper, C.ink, 1.4);
        fitTxt(s.line, PAD + 10, by4 + bh/2 + 1, C.ink, 700, 11.5, w1 - 18, 'left');
        box(PAD + w1 + 10, by4, w2, bh, f2, s2, 2, d2);
        fitTxt(s.res, PAD + w1 + 10 + w2/2, by4 + bh/2 + 1, c2, 700, 11.5, w2 - 14); }
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

  mount('v140a', STEPS);
})();
