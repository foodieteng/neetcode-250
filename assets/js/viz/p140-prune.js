/* ============================================================
   P140 · Word Break II — ③ 回溯 + 後綴可達剪枝(最佳解)· viz
     canBreak[n] = true;
     for (int i = n - 1; i >= 0; i--)
         for (int end = i + 1; end <= min(n, i + maxLen); end++)
             if (canBreak[end] && dict.count(s.substr(i, end - i))) { canBreak[i] = true; break; }
     if (!canBreak[0]) return ans;
     dfs(start):  if (start == n) { ans.push_back(path); return; }
         for (end = start + 1; end <= min(n, start + maxLen); end++) {
             if (!canBreak[end]) continue;            // 切到這裡之後走不到底 → 連字典都不查
             if (!dict.count(word)) continue;
             path += word; dfs(end); path.resize(oldLen);
         }
   s = "catsanddog", dict = {cat, cats, and, sand, dog}, maxLen = 4(JS 實跑,步驟由演算法產生)。
     PHASE 1:canBreak 由 i = 9 算到 0 → T F F T T F F T F F T(預處理查字典 14 次)
     PHASE 2:7 次 dfs、7 次查字典(純回溯要 29 次)→ 「cat sand dog」「cats and dog」
     PHASE 3:s = "catsandog" → canBreak[0] = F → 直接 return [],0 次 dfs
   步驟(29 步):INIT · i = 9..0 各一步 ×10 · 進 dfs ×5 · 查字典 ✓/✗ ×7 · 收答案 ×2 · 回溯 ×1 · 完成 · 無解 ×2
   BAND 1 字串 + canBreak 列(index / s[i] / canBreak 三列,紅 = 目前的 i 或 start,斜線灰 = F 被跳過,底下括號 = end 窗口)
   BAND 2 end 窗口(最多 maxLen = 4 格:每個 end 是「canBreak F → 跳過不查」「查字典 ✓/✗」「break 後沒試」)
   BAND 3 path + 呼叫堆疊
   BAND 4 答案 + 計數(dfs 呼叫 x/7、查字典 x/7 vs 純回溯 29)
   BAND 5 這一步(哪一行跑了)
   前綴 v140p 。
   ============================================================ */
(function () {
  const C = { paper:'#ffffff', ink:'#1f1f1f', dim:'#5a5a5a', off:'#cfcfcf',
    up:'#e3edf5', low:'#f6ead8',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424',
    good:'#d9e8c7', bad:'#f0d4d4', deep:'#a31d1d', gray:'#ececec' };
  const MONO = '"JetBrains Mono", monospace', SANS = '"Noto Sans TC", sans-serif';
  const S1 = 'catsanddog', D1 = ['cat', 'cats', 'and', 'sand', 'dog'];
  const S2 = 'catsandog',  D2 = ['cats', 'dog', 'sand', 'and', 'cat'];
  const PLAIN = 29;                        // 純回溯(方法 ①)在 S1 上的查字典次數(實跑)

  /* ---------- 預處理:canBreak ---------- */
  function precompute(s, words, onRow) {
    const dict = new Set(words), n = s.length;
    const maxLen = Math.max(...words.map(x => x.length));
    const cb = Array(n + 1).fill(null); cb[n] = true;
    let looks = 0;
    for (let i = n - 1; i >= 0; i--) {
      const chips = []; let hit = null;
      const hi = Math.min(n, i + maxLen);
      for (let end = i + 1; end <= hi; end++) {
        const word = s.substr(i, end - i);
        if (hit) { chips.push({ end, word, st:'untried' }); continue; }
        if (!cb[end]) { chips.push({ end, word, st:'skip' }); continue; }
        looks++;
        if (dict.has(word)) { chips.push({ end, word, st:'hit' }); hit = { word, end }; }
        else chips.push({ end, word, st:'miss' });
      }
      cb[i] = !!hit;
      if (onRow) onRow({ i, chips, hit, cb: cb.slice(), looks, maxLen });
    }
    return { cb, looks, maxLen };
  }

  function build() {
    const steps = [];
    const n = S1.length;
    const dict = new Set(D1);
    const maxLen = Math.max(...D1.map(x => x.length));
    const base = { ph:'pre', s:S1, path:[], stack:[], ans:[], calls:0, looks:0, pre:0 };
    steps.push(Object.assign({}, base, { k:'init', cb:(() => { const a = Array(n + 1).fill(null); a[n] = true; return a; })(),
      cur:null, chips:null, maxLen }));
    const pre = precompute(S1, D1, r => {
      steps.push(Object.assign({}, base, { k:'pre', cur:r.i, chips:r.chips, hit:r.hit, cb:r.cb, pre:r.looks, maxLen }));
    });
    const cb = pre.cb;

    /* ---- dfs ---- */
    const path = [], stack = [], ans = [];
    let calls = 0, looks = 0, pendingUndo = null;
    function snap(o) {
      const top = stack[stack.length - 1];
      return Object.assign({ ph:'dfs', s:S1, cb, maxLen, path:path.slice(), stack:stack.map(f => f.start), ans:ans.slice(),
        calls, looks, pre:pre.looks, cur: top ? top.start : null,
        chips: top && top.chips ? top.chips.map(c => Object.assign({}, c)) : null }, o);
    }
    function push(st) { if (pendingUndo) { steps.push(pendingUndo); pendingUndo = null; } steps.push(st); }
    function dfs(start) {
      calls++;
      const frame = { start, chips:null };
      stack.push(frame);
      if (start === n) {
        ans.push(path.join(' '));
        push(snap({ k:'collect' }));
        stack.pop();
        return;
      }
      const hi = Math.min(n, start + maxLen);
      frame.chips = [];
      for (let end = start + 1; end <= hi; end++)
        frame.chips.push({ end, word:S1.substr(start, end - start), st: cb[end] ? 'pending' : 'skip' });
      push(snap({ k:'enter', hi }));
      for (let end = start + 1; end <= hi; end++) {
        const chip = frame.chips[end - start - 1];
        if (!cb[end]) continue;                         // 切到這裡之後走不到底
        const word = S1.substr(start, end - start);
        looks++;
        if (!dict.has(word)) { chip.st = 'miss'; push(snap({ k:'miss', word, end })); continue; }
        chip.st = 'hit';
        path.push(word);
        push(snap({ k:'hit', word, end }));
        dfs(end);
        const gone = path.pop();
        chip.st = 'done';
        if (!pendingUndo) pendingUndo = snap({ k:'undo', removed:[gone] });
        else { const r = pendingUndo.removed.concat([gone]); pendingUndo = snap({ k:'undo', removed:r }); }
      }
      stack.pop();
      if (pendingUndo) pendingUndo = Object.assign(snap({ k:'undo', removed:pendingUndo.removed }), {});
    }
    dfs(0);
    // 最後一段回溯直接併進「完成」
    const lastUndo = pendingUndo; pendingUndo = null;
    steps.push(snap({ k:'fin', removed: lastUndo ? lastUndo.removed : [] }));

    /* ---- 無解的例子 ---- */
    let row0 = null;
    const p2 = precompute(S2, D2, r => { if (r.i === 0) row0 = r; });
    const nb = { ph:'none', s:S2, cb:p2.cb, maxLen:p2.maxLen, path:[], stack:[], ans:[], calls:0, looks:0, pre:p2.looks, cur:0, chips:row0.chips };
    steps.push(Object.assign({}, nb, { k:'none' }));
    steps.push(Object.assign({}, nb, { k:'ret' }));
    return steps;
  }

  const STEPS = build();

  /* ---------- 自我檢查:和題目給的 trace 對齊 ---------- */
  (function check() {
    const fin = STEPS.find(s => s.k === 'fin');
    const cbStr = a => a.map(v => v ? 'T' : 'F').join('');
    const ok = cbStr(fin.cb) === 'TFFTTFFTFFT' && fin.calls === 7 && fin.looks === 7 &&
      fin.ans.join('|') === 'cat sand dog|cats and dog' && cbStr(STEPS[STEPS.length - 1].cb) === 'FFFFFFTFFT';
    if (!ok && window.console) console.warn('p140-prune: trace mismatch');
  })();

  /* ---------- 文字 ---------- */
  const code = x => '<code>' + x + '</code>';
  const q = x => '"' + x + '"';
  const TF = v => v ? 'T' : 'F';
  STEPS.forEach(s => {
    const n = s.s.length;
    const pstr = q(s.path.join(' '));
    if (s.k === 'init') {
      s.line = 'canBreak.assign(n + 1, false); canBreak[n] = true;';
      s.res = 'n = 10 · maxLen = 4 · canBreak[10] = T';
      s.text = '<strong>PHASE 1 · 先算 canBreak</strong> · ' + code('canBreak[i]') + ' = 後綴 ' + code('s[i..n)') + ' 能不能完整切成字典裡的字。' +
        '空字串一定切得完,所以 ' + code('canBreak[10] = T') + '。接著 i 從 9 往 0 算:每個 i 只看 ' + code('end = i+1 .. i+maxLen') +
        '(最長的字 4 個字母),<b>只有 canBreak[end] = T 的 end 才去查字典</b>(' + code('&&') + ' 短路)。';
    } else if (s.k === 'pre') {
      const i = s.cur, hi = Math.min(n, i + s.maxLen);
      const skip = s.chips.filter(c => c.st === 'skip'), miss = s.chips.filter(c => c.st === 'miss');
      s.line = s.hit ? 'canBreak[' + s.hit.end + '] && dict.count(' + q(s.hit.word) + ') → canBreak[' + i + '] = true; break;'
                     : 'for (end = ' + (i + 1) + '; end <= ' + hi + '; end++)  // 沒有一個成立';
      s.res = s.hit ? 'canBreak[' + i + '] = T ← ' + q(s.hit.word) + ' + canBreak[' + s.hit.end + ']'
                    : 'canBreak[' + i + '] = F · 預處理查字典累計 ' + s.pre;
      let t = '<strong>i = ' + i + ' · end = ' + (i + 1) + '..' + hi + '</strong> · ';
      if (skip.length) t += 'end ' + skip.map(c => c.end).join('、') + ' 的 canBreak 是 F(' + skip.map(c => q(c.word)).join('、') + ' 切下去後面接不完)→ 不查字典。';
      if (miss.length) t += miss.map(c => q(c.word)).join('、') + ' 查了,不是字。';
      if (s.hit) t += q(s.hit.word) + ' 是字,而且 canBreak[' + s.hit.end + '] = T → <b>canBreak[' + i + '] = T</b>,break' +
        (s.chips.some(c => c.st === 'untried') ? '(後面的 end 不用再試)' : '') + '。';
      else t += '<b>canBreak[' + i + '] = F</b>:從 ' + i + ' 開頭怎麼切都走不到底。';
      if (hi < i + s.maxLen) t += '窗口被 ' + code('min(n, …)') + ' 截在 ' + hi + '。';
      s.text = t;
    } else if (s.k === 'enter') {
      const st = s.cur, skip = s.chips.filter(c => c.st === 'skip').map(c => c.end), tt = s.chips.filter(c => c.st !== 'skip').map(c => c.end);
      s.line = 'for (end = ' + (st + 1) + '; end <= min(' + n + ', ' + st + ' + ' + s.maxLen + ') = ' + s.hi + '; end++)';
      s.res = (skip.length ? 'end ' + skip.join(',') + ' → canBreak F,continue' : '窗口內 canBreak 全是 T') + ' · 要查 ' + tt.join(',');
      s.text = (st === 0 ? '<strong>PHASE 2 · canBreak[0] = T,開始 dfs(0)</strong> · ' : '<strong>dfs(' + st + ')</strong> · ') +
        '窗口 end = ' + (st + 1) + '..' + s.hi + '(' + code('end ≤ start + maxLen') + (s.hi < st + s.maxLen ? ',被 n 截掉' : '') + ')。' +
        (skip.length ? 'end ' + skip.join('、') + ' 的 canBreak 是 F(上面劃掉的格子)→ 第一行 ' + code('continue') + ',<b>連 substr、查字典都不做</b>。' : '') +
        '只剩 end ' + tt.join('、') + ' 要查。';
    } else if (s.k === 'miss') {
      s.line = 'if (!dict.count(' + q(s.word) + ')) continue;';
      s.res = q(s.word) + ' 不是字 · 查字典 ' + s.looks + ' / 7';
      s.text = '<strong>dfs(' + s.cur + ') · end = ' + s.end + ' · ' + q(s.word) + ' ✗</strong> · canBreak[' + s.end + '] = T(後面切得完),' +
        '所以要查字典;但 ' + q(s.word) + ' 不是字 → continue。這是剪枝後<b>唯一一次查了卻落空</b>。';
    } else if (s.k === 'hit') {
      s.line = 'path += ' + q(s.word) + '; dfs(s, ' + s.end + ', dict, path, ans);';
      s.res = 'path = ' + pstr + ' · 查字典 ' + s.looks + ' / 7';
      s.text = '<strong>dfs(' + s.cur + ') · end = ' + s.end + ' · ' + q(s.word) + ' ✓</strong> · 是字 → 接上 path' +
        (s.path.length > 1 ? '(前面先補一個空格)' : '') + ' = <b>' + pstr + '</b>,呼叫 ' + code('dfs(' + s.end + ')') + '。' +
        'canBreak[' + s.end + '] = T 保證這一刀之後一定走得到底 —— <b>不會白走</b>。';
    } else if (s.k === 'collect') {
      s.line = 'if (start == n) { ans.push_back(path); return; }';
      s.res = '收「' + s.ans[s.ans.length - 1] + '」 · ans 共 ' + s.ans.length + ' 句';
      s.text = '<strong>dfs(10) · start == n</strong> · 整串切完,把 path 原樣存進 ans:<b>「' + s.ans[s.ans.length - 1] + '」</b>。' +
        '注意 path 是 ' + code('string&') + ',存的是複本,等等回溯改 path 不影響已經收的答案。';
    } else if (s.k === 'undo') {
      s.line = 'path.resize(oldLen);   // ×' + s.removed.length;
      s.res = '拿掉 ' + s.removed.map(q).join('、') + ' → path = ' + pstr;
      s.text = '<strong>回溯 ×' + s.removed.length + '</strong> · 依序拿掉 ' + s.removed.map(q).join('、') +
        '(連前面的空格一起,' + code('resize(oldLen)') + ')。中間 dfs(7)、dfs(3) 的窗口都已經試完(剩下的 end 是 F,直接跳過)。' +
        '回到 <b>dfs(' + s.cur + ')</b>,path = ' + pstr + ',繼續試下一個 end。';
    } else if (s.k === 'fin') {
      s.line = 'return ans;   // 2 句';
      s.res = '7 次 dfs · 查字典 7 次(純回溯 29)· 2 句';
      s.text = '<strong>完成 · 2 句</strong> · 最後一段回溯拿掉 ' + s.removed.map(q).join('、') + ',path 回到空字串。' +
        '7 次 dfs 裡<b>每一次都走到了答案</b>(沒有一條死路),查字典 7 次只有 ' + q('s') + ' 落空;' +
        '沒剪枝的純回溯要查 29 次。代價是預處理多查 ' + s.pre + ' 次,O(n · maxLen)。';
    } else if (s.k === 'none') {
      s.line = 'canBreak (s = "catsandog") = F F F F F F T F F T';
      s.res = 'canBreak[0] = F';
      s.text = '<strong>PHASE 3 · 無解:s = "catsandog"</strong> · 同一個字典,canBreak 算出來只有 i = 6(' + q('dog') + ')是 T。' +
        'i = 3 的 ' + q('sand') + ' 是字,但 canBreak[7] = F(' + q('og') + ' 接不完)→ F;' +
        'i = 0 的 ' + q('cat') + '→[3]、' + q('cats') + '→[4] 都是 F,窗口裡 4 個 end <b>全被跳過,一次字典都沒查</b>。';
    } else {
      s.line = 'if (!canBreak[0]) return ans;   // []';
      s.res = 'return [] · 0 次 dfs';
      s.text = '<strong>canBreak[0] = F → 直接 return []</strong> · 整串切不完,<b>dfs 一次都不呼叫</b>。' +
        '純回溯會把「前面切得動、後面接不上」的路都走一遍(像 aaaa…ab 這種輸入是指數級),剪枝版在預處理就判死。';
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
    function rect(x,y,w,h,fill,stroke,lw,dash){ if(fill){ctx.fillStyle=fill; ctx.fillRect(x,y,w,h);} ctx.lineWidth=lw||1.4; if(dash) ctx.setLineDash(dash); ctx.strokeStyle=stroke; ctx.strokeRect(x,y,w,h); ctx.setLineDash([]); }
    function txt(s,x,y,color,font,align,base){ ctx.fillStyle=color; ctx.font=font; ctx.textAlign=align||'center'; ctx.textBaseline=base||'middle'; ctx.fillText(s,x,y); }
    function head(s,x,y){ txt(s,x,y,C.dim,'600 12px '+MONO+', '+SANS,'left','alphabetic'); }
    function line(x1,y1,x2,y2,color,lw,dash){ ctx.strokeStyle=color; ctx.lineWidth=lw; if(dash) ctx.setLineDash(dash); ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); ctx.setLineDash([]); }
    const F = (wt, sz) => wt + ' ' + sz + 'px ' + MONO + ', ' + SANS;
    function fitTxt(s, x, y, color, wt, sz, maxW, align){ let f = sz; ctx.font = F(wt, f);
      while (f > 8 && ctx.measureText(s).width > maxW) { f -= 0.5; ctx.font = F(wt, f); }
      txt(s, x, y, color, F(wt, f), align); }

    function draw(){
      fit();
      const s = steps[step], w = canvas.clientWidth, PAD = 22, inner = w - 2 * PAD;
      ctx.fillStyle = C.paper; ctx.fillRect(0, 0, w, canvas.clientHeight); ctx.setLineDash([]);
      const str = s.s, n = str.length, fin = s.k === 'fin', none = s.ph === 'none';
      const hi = s.cur === null ? -1 : Math.min(n, s.cur + s.maxLen);
      const inWin = e => s.cur !== null && s.chips && e > s.cur && e <= hi;

      /* ---- BAND 1 · 字串 + canBreak ---- */
      head('BAND 1 · s = "' + str + '"   canBreak[i] = s[i..n) 切得完嗎', PAD, 16);
      const LX = PAD + 74, colW = (w - PAD - LX) / (n + 1), CW = Math.min(42, colW - 8);
      const cx = k => LX + (k + 0.5) * colW;
      const IY = 36, RY = 54, RH = 30, BY = 124, BH = 30;
      txt('index', PAD, IY, C.dim, F(700, 11), 'left');
      txt('s[i]', PAD, RY + RH/2, C.dim, F(700, 11.5), 'left');
      txt('canBreak', PAD, BY + BH/2, C.dim, F(700, 11.5), 'left');
      // 目前 path 涵蓋到哪(phase 2)
      let covered = 0; const cuts = [];
      s.path.forEach(wd => { covered += wd.length; cuts.push(covered); });
      const cand = (s.k === 'hit' || s.k === 'miss') ? [s.cur, s.end] : (s.k === 'pre' && s.hit ? [s.cur, s.hit.end] : null);
      for (let k = 0; k <= n; k++) {
        const isCur = s.cur === k && !fin;
        txt(String(k), cx(k), IY, isCur ? C.curT : C.dim, F(isCur ? 800 : 600, 11));
        if (k < n) {
          let fill = C.paper, sc = C.ink, tc = C.ink, lw = 1.2;
          if (s.ph === 'dfs' && k < covered) { fill = C.low; }
          if (s.ph === 'dfs' && s.k === 'collect') fill = C.good;
          if (fin) fill = C.paper;
          if (s.chips && s.cur !== null && k >= s.cur && k < hi && !fin && s.k !== 'collect') { fill = C.up; }
          if (cand && k >= cand[0] && k < cand[1]) {
            const bad = s.k === 'miss';
            fill = bad ? C.bad : C.good; sc = bad ? C.deep : C.ink; lw = 2; tc = bad ? C.deep : C.ink;
          }
          rect(cx(k) - CW/2, RY, CW, RH, fill, sc, lw);
          txt(str[k], cx(k), RY + RH/2 + 1, tc, F(700, 15));
        }
        // canBreak 格
        const v = s.cb[k], bx = cx(k) - CW/2;
        if (v === null) { rect(bx, BY, CW, BH, C.paper, C.off, 1.2, [3,3]); txt('?', cx(k), BY + BH/2 + 1, C.off, F(700, 13)); }
        else {
          const winF = !v && inWin(k) && !fin && s.k !== 'collect';
          let fill = v ? C.good : C.gray, sc = v ? C.ink : C.off, tc = v ? C.ink : C.dim, lw = 1.2;
          if (v && inWin(k) && !fin && s.k !== 'collect') { sc = C.curS; lw = 2; }
          if (isCur && s.ph === 'pre') { fill = v ? C.good : C.bad; sc = C.curS; lw = 2.8; tc = v ? C.ink : C.deep; }
          if (isCur && s.ph === 'dfs') { sc = C.curS; lw = 2.8; }
          if (none && k === 0) { fill = C.bad; sc = s.k === 'ret' ? C.deep : C.curS; lw = 2.8; tc = C.deep; }
          rect(bx, BY, CW, BH, fill, sc, lw);
          txt(TF(v), cx(k), BY + BH/2 + 1, tc, F(800, 14));
          if (winF) { line(bx + 4, BY + BH - 4, bx + CW - 4, BY + 4, C.dim, 1.4); }
        }
      }
      // 切點:path 的每個字之間一條紅線(穿過字元列)
      if (s.ph === 'dfs') cuts.forEach(c => { if (c <= 0 || c >= n) return; const x = LX + c * colW;
        line(x, RY - 4, x, RY + RH + 4, C.deep, 2.4); });
      // end 窗口括號
      txt('end 窗口', PAD, 172, C.dim, F(700, 11), 'left');
      if (s.chips && s.cur !== null && !fin && s.k !== 'collect') {
        const x1 = cx(s.cur + 1) - CW/2, x2 = cx(hi) + CW/2, y = 166;
        line(x1, y, x1, y + 8, C.curS, 1.6); line(x2, y, x2, y + 8, C.curS, 1.6); line(x1, y + 8, x2, y + 8, C.curS, 1.6);
        const lab = 'end ≤ ' + (s.ph === 'dfs' ? 'start' : 'i') + '+' + s.maxLen + (hi < s.cur + s.maxLen ? '(被 n 截)' : '');
        const room = (w - PAD) - (x2 + 10);
        if (room > 60) fitTxt(lab, x2 + 10, y + 7, C.curT, 700, 10.5, room, 'left');
        else fitTxt(lab, x1 - 10, y + 7, C.curT, 700, 10.5, x1 - 10 - (PAD + 70), 'right');
      } else {
        fitTxt(s.k === 'init' ? '(還沒開始)' : (s.k === 'collect' ? 'start == n · 不進迴圈' : '—'), LX, 172, C.off, 600, 10.5, w - PAD - LX, 'left');
      }

      /* ---- BAND 2 · end 窗口 ---- */
      const b2 = 204;
      let h2;
      if (s.ph === 'pre') h2 = s.k === 'init' ? 'BAND 2 · end 窗口' : 'BAND 2 · i = ' + s.cur + ' 的窗口 · if (canBreak[end] && dict.count(word))';
      else if (none) h2 = 'BAND 2 · i = 0 的窗口(s = "catsandog")';
      else h2 = s.cur !== null && s.chips ? 'BAND 2 · dfs(' + s.cur + ') 的窗口 · 先看 canBreak[end],T 才查字典' : 'BAND 2 · end 窗口';
      head(h2, PAD, b2);
      { const y = b2 + 12, ch = 50, gap = 10, cw = (inner - 3 * gap) / 4;
        for (let j = 0; j < 4; j++) {
          const x = PAD + j * (cw + gap), c = s.chips && !fin && s.k !== 'collect' ? s.chips[j] : null;
          if (!c) {
            const outN = s.chips && !fin && s.k !== 'collect' && s.cur !== null && s.cur + j + 1 <= s.cur + s.maxLen;
            box(x, y, cw, ch, C.paper, C.off, 1.1, [3,3]);
            fitTxt(outN ? 'end ' + (s.cur + j + 1) + ' > n' : '—', x + cw/2, y + ch/2, C.off, 600, 11, cw - 12);
            continue;
          }
          const isNow = (s.k === 'hit' || s.k === 'miss') && c.end === s.end;
          let fill = C.paper, sc = C.ink, tc = C.ink, l2 = '', lw = 1.3, dash = null;
          if (c.st === 'skip') { fill = C.gray; sc = C.off; tc = C.dim; l2 = 'canBreak F → 跳過·不查'; }
          else if (c.st === 'pending') { fill = C.paper; sc = C.curS; tc = C.ink; l2 = 'canBreak T → 待查'; dash = [4,3]; }
          else if (c.st === 'hit') { fill = C.good; sc = C.ink; l2 = 'T → 查字典 ✓'; }
          else if (c.st === 'done') { fill = C.good; sc = C.ink; tc = C.ink; l2 = '✓ 已走完'; }
          else if (c.st === 'miss') { fill = C.bad; sc = C.deep; tc = C.deep; l2 = 'T → 查字典 ✗'; }
          else if (c.st === 'untried') { fill = C.paper; sc = C.off; tc = C.dim; l2 = 'break · 沒試'; dash = [3,3]; }
          if (isNow) { lw = 2.8; sc = s.k === 'miss' ? C.deep : C.curS; }
          if (s.ph === 'pre' && s.hit && c.end === s.hit.end) { lw = 2.6; sc = C.curS; }
          box(x, y, cw, ch, fill, sc, lw, dash);
          fitTxt('end ' + c.end + ' · "' + c.word + '"', x + cw/2, y + 16, tc, 700, 12, cw - 12);
          fitTxt(l2, x + cw/2, y + 36, tc, 600, 10.5, cw - 12);
          if (c.st === 'skip') line(x + 8, y + 16, x + cw - 8, y + 16, C.dim, 1.2);
        }
      }

      /* ---- BAND 3 · path + call stack ---- */
      const b3 = 294;
      head('BAND 3 · string& path   呼叫堆疊', PAD, b3);
      { const y = b3 + 12, bh = 44, pw = Math.round(inner * 0.4), sx = PAD + pw + 14, sw = inner - pw - 14;
        const active = s.ph === 'dfs' && !fin;
        box(PAD, y, pw, bh, s.k === 'collect' ? C.good : (s.k === 'hit' ? C.cur : C.paper), s.k === 'hit' ? C.curS : (active ? C.ink : C.off), s.k === 'hit' ? 2.4 : 1.4, active ? null : [3,3]);
        txt('path', PAD + 10, y + bh/2 + 1, C.dim, F(700, 11), 'left');
        fitTxt(s.ph === 'dfs' ? q(s.path.join(' ')) : (none ? '(不建立)' : '(PHASE 1 · 還沒用到)'), PAD + 46, y + bh/2 + 1,
          s.k === 'hit' ? C.curT : (active ? C.ink : C.dim), 700, s.ph === 'dfs' ? 15 : 11.5, pw - 56, 'left');
        // 堆疊
        if (!s.stack.length) {
          box(sx, y, sw, bh, C.paper, C.off, 1.2, [3,3]);
          fitTxt(none ? 'dfs 呼叫 0 次' : (fin ? '堆疊清空 · dfs 全部 return' : '呼叫堆疊:空(先做預處理)'), sx + sw/2, y + bh/2 + 1, C.dim, 600, 11.5, sw - 16);
        } else {
          const k = s.stack.length, ag = 18, fw = Math.min(90, (sw - (k - 1) * ag) / k);
          s.stack.forEach((st, j) => {
            const x = sx + j * (fw + ag), top = j === k - 1;
            box(x, y, fw, bh, top ? (s.k === 'collect' ? C.good : C.cur) : C.paper, top ? C.curS : C.ink, top ? 2.4 : 1.2);
            fitTxt('dfs(' + st + ')', x + fw/2, y + bh/2 + 1, top ? C.curT : C.ink, 700, 12.5, fw - 8);
            if (j < k - 1) { const ax = x + fw + 3; line(ax, y + bh/2, ax + ag - 6, y + bh/2, C.dim, 1.4);
              ctx.fillStyle = C.dim; ctx.beginPath(); ctx.moveTo(ax + ag - 6, y + bh/2 - 4); ctx.lineTo(ax + ag - 2, y + bh/2); ctx.lineTo(ax + ag - 6, y + bh/2 + 4); ctx.fill(); }
          });
        }
      }

      /* ---- BAND 4 · 答案 + 計數 ---- */
      const b4 = 380;
      head('BAND 4 · 答案 + 計數', PAD, b4);
      { const y = b4 + 12, lw4 = Math.round(inner * 0.42), rx = PAD + lw4 + 18, rw = inner - lw4 - 18;
        txt('ans', PAD, y + 17, C.dim, F(700, 11), 'left');
        const ax = PAD + 34, aw = (lw4 - 34 - 8) / 2;
        for (let j = 0; j < 2; j++) {
          const x = ax + j * (aw + 8), v = s.ans[j];
          const isNew = s.k === 'collect' && j === s.ans.length - 1;
          if (v === undefined) { box(x, y, aw, 34, C.paper, C.off, 1.1, [3,3]); fitTxt(none ? '[ ]' : '—', x + aw/2, y + 18, C.off, 600, 11, aw - 8); }
          else { box(x, y, aw, 34, C.good, isNew ? C.curS : C.ink, isNew ? 2.6 : 1.3); fitTxt(v, x + aw/2, y + 18, C.ink, 700, 12, aw - 10); }
        }
        fitTxt(none ? 'canBreak[0] = F → ans 保持空的' : (s.ph === 'pre' ? 'PHASE 1 只填 canBreak,還沒有答案' : 'ans 共 ' + s.ans.length + ' 句'),
          PAD, y + 52, none ? C.deep : C.dim, 600, 10.5, lw4, 'left');
        // 計數
        fitTxt('dfs 呼叫 ' + s.calls + (none ? ' 次' : ' / 7') + '   預處理查字典 ' + s.pre + ' 次', rx, y + 6, C.ink, 700, 11.5, rw, 'left');
        const LB = 82, bx = rx + LB, bw = rw - LB - 44, bh = 12;
        const cur2 = s.k === 'hit' || s.k === 'miss';
        txt('剪枝查字典', rx, y + 28, cur2 ? C.curT : C.ink, F(700, 10.5), 'left');
        rect(bx, y + 22, bw, bh, C.paper, C.off, 1);
        if (s.looks) rect(bx, y + 22, bw * s.looks / PLAIN, bh, cur2 ? C.cur : C.good, cur2 ? C.curS : C.ink, 1.2);
        fitTxt(s.looks + (none ? '' : ' / 7'), bx + bw + 6, y + 28, cur2 ? C.curT : C.ink, 800, 11, 38, 'left');
        txt('純回溯', rx, y + 50, C.dim, F(700, 10.5), 'left');
        rect(bx, y + 44, bw, bh, C.gray, C.dim, 1);
        fitTxt(none ? '—' : String(PLAIN), bx + bw + 6, y + 50, C.dim, 800, 11, 38, 'left');
      }

      /* ---- BAND 5 · 這一步 ---- */
      const b5 = 470;
      head('BAND 5 · 這一步(哪一行跑了)', PAD, b5);
      { const by5 = b5 + 12, bh = 32, w1 = Math.round(inner * 0.54), w2 = inner - w1 - 10;
        let f2 = C.cur, s2 = C.curS, c2 = C.curT, d2 = null;
        if (s.k === 'miss' || s.k === 'ret' || (s.k === 'pre' && !s.hit) || s.k === 'none') { f2 = C.bad; s2 = C.deep; c2 = C.deep; }
        else if (s.k === 'collect' || fin || (s.k === 'pre' && s.hit)) { f2 = C.good; s2 = C.ink; c2 = C.ink; }
        else if (s.k === 'init' || s.k === 'undo') { f2 = C.paper; s2 = C.ink; c2 = C.ink; }
        box(PAD, by5, w1, bh, C.paper, C.ink, 1.4);
        fitTxt(s.line, PAD + 10, by5 + bh/2 + 1, C.ink, 700, 11.5, w1 - 18, 'left');
        box(PAD + w1 + 10, by5, w2, bh, f2, s2, 2, d2);
        fitTxt(s.res, PAD + w1 + 10 + w2/2, by5 + bh/2 + 1, c2, 700, 11.5, w2 - 14); }
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

  mount('v140p', STEPS);
})();
