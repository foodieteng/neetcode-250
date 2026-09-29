/* ============================================================
   P767 · Reorganize String — 最大堆 · 每輪拿次數最多的兩個不同字元 · viz
     int freq[26]; for (char c : s) freq[c-'a']++;
     priority_queue<pair<int,char>> pq;            // (次數, 字元);平手 → 大字元先
     for (i) if (freq[i]) pq.push({freq[i], 'a'+i});
     string ans;
     while (!pq.empty()) {
       auto [cnt1, ch1] = pq.top(); pq.pop(); ans += ch1;
       if (ans.size() >= 2 && ans[ans.size()-1] == ans[ans.size()-2]) return "";
       if (!pq.empty()) { auto [cnt2, ch2] = pq.top(); pq.pop(); ans += ch2; if (--cnt2) pq.push({cnt2, ch2}); }
       if (--cnt1) pq.push({cnt1, ch1});
     }
     return ans;
   動畫要傳達的一件事:每輪從最大堆拿「最多的」和「第二多的」兩個不同字元接在後面,
   兩個都先 pop 才 push 回去 → 同一輪不會拿到同一個字元;
   只剩一種字元時,下一輪 pop1 會和上一個字元相同 → 檢查抓到 → return ""。
   C++ 實測(/tmp/nc767-b1/trace.txt):
     A "aaabbc"  R1 pq=[(3,a),(2,b),(1,c)] a|skip, b → "ab"   push (1,b),(2,a)
                 R2 pq=[(2,a),(1,c),(1,b)] a ✓(a≠b), c → "abac" push (1,a)
                 R3 pq=[(1,b),(1,a)]       b ✓(b≠c), a → "abacba"          → return "abacba"
     B "aaab"    R1 pq=[(3,a),(1,b)] a, b → "ab" push (2,a)
                 R2 pq=[(2,a)]       a ✓, pq 空 → 無 pop2, push (1,a)
                 R3 pq=[(1,a)]       a → "abaa" a == a → return ""
     C "aa"      R1 "a" push (1,a);R2 "aa":`size() > 2` 跳過檢查 → 回 "aa"(錯);`>= 2` → ""
     BAND 1  ans 字串(ch1 紅框、ch2 藍底)+ 相鄰檢查
     BAND 2  最大堆 pq | 本輪取出
     BAND 3  這一步 + freq + 可行性公式 maxFreq ≤ (n+1)/2
   前綴 v767- 。
   ============================================================ */
(function () {
  const canvas = document.getElementById('v767-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('v767-step'), labelEl = document.getElementById('v767-label');
  const bPrev = document.getElementById('v767-prev'), bNext = document.getElementById('v767-next'),
        bPlay = document.getElementById('v767-play'), bReset = document.getElementById('v767-reset');

  const C = { paper:'#ffffff', ink:'#1f1f1f', dim:'#5a5a5a', off:'#cfcfcf',
    up:'#e3edf5', low:'#f6ead8',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424',
    good:'#d9e8c7', bad:'#f0d4d4', deep:'#a31d1d' };

  const MONO = '"JetBrains Mono", monospace', SANS = '"Noto Sans TC", sans-serif';

  const SCN = {
    A: { tab:'情境 A · aaabbc(可行)', s:'aaabbc', n:6, freq:'n = 6 · a=3  b=2  c=1', ok:true,  form:'maxFreq ≤ (n+1)/2 : 3 ≤ 3 可行' },
    B: { tab:'情境 B · aaab(不可行)', s:'aaab',   n:4, freq:'n = 4 · a=3  b=1',       ok:false, form:'maxFreq ≤ (n+1)/2 : 3 > 2 不可行' },
    C: { tab:'情境 C · aa(> 2 漏洞)', s:'aa',     n:2, freq:'n = 2 · a=2',             ok:false, form:'maxFreq ≤ (n+1)/2 : 2 > 1 不可行' },
  };
  const ORDER = ['A','B','C'];

  /* sc: 情境;ans: 目前字串;h1/h2: ch1、ch2 的位置(-1 無);
     chk: 檢查 chip { k: none|skip|ok|eq|done|cmp, t: 文字, pair: 被比的兩格左邊那格 };
     pq: [[cnt, ch, mode]] mode: '' | out1 | out2 | back;
     rows: 本輪取出 [[cnt, ch, 'r'|'b', 說明] | [null, null, '', 說明]];
     phase: init | pop | back | ret | end;act: BAND 3 動作 */
  const S = (sc, ans, h1, h2, chk, pq, rows, phase, act, text) => ({ sc, ans, h1, h2, chk, pq, rows, phase, act, text });
  const NONE = { k:'none', t:'ans 還是空的 · 每輪 pop1 後檢查最後兩格' };

  const steps = [
    /* ---------------- 情境 A · aaabbc ---------------- */
    S('A', '', -1, -1, NONE,
      [[3,'a',''],[2,'b',''],[1,'c','']], [], 'init',
      '數次數 → (次數, 字元) 全部 push 進最大堆',
      '<strong>情境 A · INITIAL</strong> · <code>s = "aaabbc"</code>,次數 <code>a=3, b=2, c=1</code>。把 <code>pair&lt;int,char&gt;(次數, 字元)</code> 丟進<strong>最大堆</strong>,次數大的在最上面。先看可行性:<code>maxFreq = 3 ≤ (6+1)/2 = 3</code> → <b>剛好可行</b>(a 必須佔 0、2、4 三個位置)。'),
    S('A', 'ab', 0, 1, { k:'skip', t:'k = 1 · size < 2 → 不檢查' },
      [[3,'a','out1'],[2,'b','out2'],[1,'c','']],
      [[3,'a','r','pop1 · ans += a · 剩 2,先拿在手上'], [2,'b','b','pop2 · ans += b · 剩 1,先拿在手上']], 'pop',
      '第 1 輪:pop1 (3,a) → "a";pop2 (2,b) → "ab"',
      '<strong>情境 A · 第 1 輪 · 取出</strong> · <code>pop1 = (3,a)</code>,<code>ans = "a"</code>,<code>size = 1</code> 還不用檢查。pq 非空 → <code>pop2 = (2,b)</code>,<code>ans = "ab"</code>。<b>兩個都先拿出來,還沒推回</b> —— 所以第二個一定是<b>不同的字元</b>。'),
    S('A', 'ab', -1, -1, { k:'skip', t:'k = 1 · size < 2 → 不檢查' },
      [[2,'a','back'],[1,'c',''],[1,'b','back']],
      [[3,'a','r','--cnt1 = 2 → push (2,a)'], [2,'b','b','--cnt2 = 1 → push (1,b)']], 'back',
      '第 1 輪:推回 (1,b)、(2,a)',
      '<strong>情境 A · 第 1 輪 · 推回</strong> · 程式先推 <code>ch2</code>:<code>--cnt2 = 1</code> → push <code>(1,b)</code>;再推 <code>ch1</code>:<code>--cnt1 = 2</code> → push <code>(2,a)</code>。堆變成 <code>[(2,a),(1,c),(1,b)]</code> —— <code>(1,c)</code> 和 <code>(1,b)</code> 平手,<b>大字元 c 先</b>。'),

    S('A', 'abac', 2, 3, { k:'ok', t:'k = 3 · ans[k−1] vs ans[k−2]: a ≠ b ✓', pair:1 },
      [[2,'a','out1'],[1,'c','out2'],[1,'b','']],
      [[2,'a','r','pop1 · ans += a · 檢查 a ≠ b ✓'], [1,'c','b','pop2 · ans += c · 剩 0']], 'pop',
      '第 2 輪:pop1 (2,a) → "aba" ✓;pop2 (1,c) → "abac"',
      '<strong>情境 A · 第 2 輪 · 取出</strong> · <code>pop1 = (2,a)</code> → <code>ans = "aba"</code>,檢查最後兩格 <code>a</code> vs <code>b</code>:不同 ✓。<code>pop2 = (1,c)</code>(平手時大字元先)→ <code>ans = "abac"</code>。'),
    S('A', 'abac', -1, -1, { k:'ok', t:'k = 3 · ans[k−1] vs ans[k−2]: a ≠ b ✓', pair:1 },
      [[1,'b',''],[1,'a','back']],
      [[2,'a','r','--cnt1 = 1 → push (1,a)'], [1,'c','b','--cnt2 = 0 → 用完,不推']], 'back',
      '第 2 輪:c 用完不推;推回 (1,a)',
      '<strong>情境 A · 第 2 輪 · 推回</strong> · <code>--cnt2 = 0</code> → <b>c 用完,不推回</b>;<code>--cnt1 = 1</code> → push <code>(1,a)</code>。堆 <code>[(1,b),(1,a)]</code>:平手,<code>b</code> 比 <code>a</code> 大 → b 在頂。'),

    S('A', 'abacba', 4, 5, { k:'ok', t:'k = 5 · ans[k−1] vs ans[k−2]: b ≠ c ✓', pair:3 },
      [[1,'b','out1'],[1,'a','out2']],
      [[1,'b','r','pop1 · ans += b · 檢查 b ≠ c ✓ · 剩 0'], [1,'a','b','pop2 · ans += a · 剩 0']], 'pop',
      '第 3 輪:pop1 (1,b) → "abacb" ✓;pop2 (1,a) → "abacba"',
      '<strong>情境 A · 第 3 輪</strong> · <code>pop1 = (1,b)</code> → <code>"abacb"</code>,<code>b ≠ c</code> ✓;<code>pop2 = (1,a)</code> → <code>"abacba"</code>。兩個 <code>--cnt</code> 都是 0,<b>什麼都不推回</b>,pq 空了。'),
    S('A', 'abacba', -1, -1, { k:'done', t:'相鄰兩格全部不同 ✓ · return "abacba"' },
      [], [[null,null,'','while (!pq.empty()) 不成立 → 結束']], 'end',
      '完成 · return "abacba"',
      '<strong>情境 A · 完成 · return "abacba"</strong> · pq 空,while 結束。a 落在 0、2、5,相鄰全部不同。<code>maxFreq = (n+1)/2</code> 是可行的<b>邊界</b>:再多一個 a 就不行了 → 看情境 B。'),

    /* ---------------- 情境 B · aaab ---------------- */
    S('B', '', -1, -1, NONE,
      [[3,'a',''],[1,'b','']], [], 'init',
      '數次數 → push (3,a)、(1,b)',
      '<strong>情境 B · INITIAL</strong> · <code>s = "aaab"</code>,<code>a=3, b=1</code>。公式先判:<code>maxFreq = 3 &gt; (4+1)/2 = 2</code> → <b>不可行</b>,4 格裡 3 個 a 一定有兩個相鄰。看程式怎麼「自己發現」。'),
    S('B', 'ab', 0, 1, { k:'skip', t:'k = 1 · size < 2 → 不檢查' },
      [[2,'a','back']],
      [[3,'a','r','pop1 · ans += a · --cnt1 = 2 → push (2,a)'], [1,'b','b','pop2 · ans += b · --cnt2 = 0 → 不推']], 'back',
      '第 1 輪:"a" → "ab";b 用完,推回 (2,a)',
      '<strong>情境 B · 第 1 輪</strong> · <code>pop1 = (3,a)</code> → <code>"a"</code>;<code>pop2 = (1,b)</code> → <code>"ab"</code>。b 只有 1 個,用完就沒了;推回 <code>(2,a)</code>。<b>pq 只剩一種字元</b> —— 麻煩來了。'),
    S('B', 'aba', 2, -1, { k:'ok', t:'k = 3 · ans[k−1] vs ans[k−2]: a ≠ b ✓', pair:1 },
      [[1,'a','back']],
      [[2,'a','r','pop1 · ans += a · --cnt1 = 1 → push (1,a)'], [null,null,'','pq 空 → 沒有 pop2']], 'back',
      '第 2 輪:"aba" ✓;pq 空 → 沒有第二個;推回 (1,a)',
      '<strong>情境 B · 第 2 輪</strong> · <code>pop1 = (2,a)</code> → <code>"aba"</code>,<code>a ≠ b</code> ✓。但 <code>pq.empty()</code> → <b>拿不到第二個字元</b>,這輪只接了一個 a。推回 <code>(1,a)</code>。'),
    S('B', 'abaa', 3, -1, { k:'eq', t:'k = 4 · ans[k−1] vs ans[k−2]: a == a → return ""', pair:2 },
      [[1,'a','out1']],
      [[1,'a','r','pop1 · ans += a → "abaa"'], [null,null,'','檢查失敗 → 直接 return,不再往下']], 'ret',
      'a == a → return ""',
      '<strong>情境 B · 第 3 輪 · return ""</strong> · <code>pop1 = (1,a)</code> → <code>"abaa"</code>,<code>size = 4 ≥ 2</code>,最後兩格 <code>a == a</code> → <b>直接 <code>return ""</code></b>。每輪 pop1 一定是剩最多的字元,<b>它和上一格相同,就代表沒有別的字元能插進來隔開</b> —— 與公式 <code>3 &gt; 2</code> 的結論一致。'),

    /* ---------------- 情境 C · aa · > 2 的漏洞 ---------------- */
    S('C', 'a', 0, -1, { k:'skip', t:'k = 1 · size < 2 → 兩種寫法都不檢查' },
      [[1,'a','back']],
      [[2,'a','r','pop1 · ans += a · --cnt1 = 1 → push (1,a)'], [null,null,'','pq 空 → 沒有 pop2']], 'back',
      '第 1 輪:"a";pq 空 → 沒有 pop2;推回 (1,a)',
      '<strong>情境 C · 第 1 輪</strong> · <code>s = "aa"</code>(<code>2 &gt; (2+1)/2 = 1</code>,不可行)。<code>pop1 = (2,a)</code> → <code>"a"</code>;pq 空,沒有 pop2;推回 <code>(1,a)</code>。下一輪 ans 會變成長度 2 —— 正好是 <code>&gt; 2</code> 寫法的死角。'),
    S('C', 'aa', 1, -1, { k:'cmp', pair:0 },
      [[1,'a','out1']],
      [[1,'a','r','pop1 · ans += a → "aa"'], [null,null,'','> 2:不檢查 → pq 空 → 回 "aa"']], 'ret',
      '第 2 輪:size = 2 —— `> 2` 跳過檢查 ✗,`>= 2` 抓到 ✓',
      '<strong>情境 C · 第 2 輪 · 條件差一格</strong> · <code>ans = "aa"</code>,<code>size = 2</code>。原本寫 <code>ans.size() &gt; 2</code>:<code>2 &gt; 2</code> 為 false → <b>檢查被跳過</b>,pq 空、迴圈結束,回傳 <code>"aa"</code> —— <b>錯</b>。改成 <code>ans.size() &gt;= 2</code>:<code>a == a</code> → <code>return ""</code> ✓。<b>最後兩格存在的條件是 size ≥ 2,不是 &gt; 2</b>。'),
  ];

  let step = 0, timer = null;

  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||476; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function box(x,y,w,h,fill,stroke,lw,dash){ rr(x,y,w,h,5); ctx.fillStyle=fill; ctx.fill(); ctx.lineWidth=lw||1.4; if(dash) ctx.setLineDash(dash); ctx.strokeStyle=stroke; ctx.stroke(); ctx.setLineDash([]); }
  function txt(s,x,y,color,font,align,base){ ctx.fillStyle=color; ctx.font=font; ctx.textAlign=align||'center'; ctx.textBaseline=base||'middle'; ctx.fillText(s,x,y); }
  /* 字太長就縮字級,直到塞得進 maxW */
  function ftxt(s,x,y,color,weight,size,fam,maxW,align){ let f=size; ctx.font=weight+' '+f+'px '+fam; while(f>9.5&&ctx.measureText(s).width>maxW){ f-=0.5; ctx.font=weight+' '+f+'px '+fam; } txt(s,x,y,color,ctx.font,align); }
  function head(s,x,y,color){ txt(s,x,y,color||C.dim,'600 12px '+MONO+', '+SANS,'left','alphabetic'); }
  function line(x1,y1,x2,y2,color,lw,dash){ ctx.strokeStyle=color; ctx.lineWidth=lw; if(dash) ctx.setLineDash(dash); ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); ctx.setLineDash([]); }
  const FM = MONO + ', ' + SANS;

  const TAB = 12, B1 = 66, B2 = 230, B3 = 370;   // 頁籤頂 / band 標題基線

  /* (cnt,ch) chip:mode '' | r(ch1 紅框) | b(ch2 藍底) | ghost(已取出) | back(剛推回) */
  function pchip(x, y, w, h, cnt, ch, mode){
    let fill = C.low, st = C.ink, lw = 1.4, tc = C.ink, dash = null;
    if (mode === 'r')     { fill = C.paper; st = C.curS; lw = 2.6; tc = C.curT; }
    if (mode === 'b')     { fill = C.up; st = C.ink; lw = 1.4; }
    if (mode === 'ghost') { fill = C.paper; st = C.off; tc = C.off; dash = [3,3]; lw = 1.2; }
    if (mode === 'back')  { fill = C.good; st = C.ink; lw = 2.4; }
    box(x, y, w, h, fill, st, lw, dash);
    txt('(' + cnt + ',' + ch + ')', x + w/2, y + h/2 + 1, tc, '700 13px '+MONO);
  }

  function draw(){
    fit();
    const s = steps[step], sc = SCN[s.sc], w = canvas.clientWidth, H = canvas.clientHeight, PAD = 24;
    const innerW = w - 2*PAD;
    ctx.fillStyle = C.paper; ctx.fillRect(0,0,w,H); ctx.setLineDash([]);

    /* ---------- 情境頁籤 ---------- */
    const tg = 12, tw = (innerW - 2*tg) / 3, th = 30;
    ORDER.forEach((k, i) => {
      const x = PAD + i*(tw + tg), on = k === s.sc, done = ORDER.indexOf(k) < ORDER.indexOf(s.sc);
      box(x, TAB, tw, th, on ? C.cur : C.paper, on ? C.curS : (done ? C.dim : C.off), on ? 2.2 : 1.2);
      ftxt(SCN[k].tab, x + tw/2, TAB + th/2 + 1, on ? C.curT : (done ? C.dim : C.off), on ? '700' : '600', 12.5, FM, tw - 16);
    });

    /* ---------- BAND 1 · ans ---------- */
    head('BAND 1 · ans   紅框 = ch1(pop1)　藍底 = ch2(pop2)　深紅 = 相鄰相同', PAD, B1);
    const cw = 44, cg = 8, ch = 42, ax = PAD + 58, iy = B1 + 24, cTop = B1 + 36, cBot = cTop + ch;
    const cx = i => ax + i*(cw + cg);
    txt('ans', PAD, cTop + ch/2 + 1, C.ink, '700 14px '+MONO, 'left');
    const ret = s.chk.k === 'eq' || s.chk.k === 'cmp', fin = s.phase === 'end';
    for (let i = 0; i < sc.n; i++) {
      const x = cx(i), has = i < s.ans.length;
      const isBad = ret && (i === s.chk.pair || i === s.chk.pair + 1);
      txt(String(i), x + cw/2, iy, (i === s.h1 || i === s.h2) ? C.curT : (has ? C.dim : C.off), (i === s.h1 ? '700' : '600') + ' 11px '+MONO, 'center', 'alphabetic');
      if (!has) { box(x, cTop, cw, ch, C.paper, C.off, 1.1, [3,3]); continue; }
      let fill = C.paper, st = C.ink, lw = 1.4, tc = C.ink;
      if (fin) fill = C.good;
      if (i === s.h2) fill = C.up;
      if (i === s.h1) { st = C.curS; lw = 2.8; tc = C.curT; }
      if (isBad) { fill = C.bad; st = i === s.h1 ? C.curS : C.deep; lw = 2.8; tc = C.deep; }
      box(x, cTop, cw, ch, fill, st, lw);
      txt(s.ans[i], x + cw/2, cTop + ch/2 + 1, tc, '700 19px '+MONO);
    }
    // 右側:長度
    const lx = cx(sc.n) + 20;
    txt('ans.size() = ' + s.ans.length, lx, cTop + 12, C.ink, '700 12px '+MONO, 'left');
    txt('目標長度 n = ' + sc.n + '(虛線 = 還沒填)', lx, cTop + 31, C.dim, '600 11px '+SANS, 'left');

    // 被檢查的兩格:下方括號
    const kY = cBot + 26, kH = 30;
    if (s.chk.pair !== undefined && s.phase !== 'end') {
      const a = cx(s.chk.pair) + 6, b = cx(s.chk.pair + 1) + cw - 6;
      const col = ret ? C.deep : C.dim;
      ctx.strokeStyle = col; ctx.lineWidth = ret ? 2 : 1.4;
      ctx.beginPath(); ctx.moveTo(a, cBot + 5); ctx.lineTo(a, cBot + 11); ctx.lineTo(b, cBot + 11); ctx.lineTo(b, cBot + 5); ctx.stroke();
      line((a + b)/2, cBot + 11, (a + b)/2, kY, col, ctx.lineWidth);
    }
    if (s.chk.k === 'cmp') {
      const hw = (innerW - 12) / 2;
      box(PAD, kY, hw, kH, C.cur, C.curS, 2.2);
      ftxt('size() > 2:2 > 2 假 → 跳過 → 回 "aa" ✗', PAD + hw/2, kY + kH/2 + 1, C.curT, '700', 12, FM, hw - 16);
      box(PAD + hw + 12, kY, hw, kH, C.good, C.ink, 2);
      ftxt('size() >= 2:a == a → return "" ✓', PAD + hw + 12 + hw/2, kY + kH/2 + 1, C.ink, '700', 12, FM, hw - 16);
    } else {
      let f = C.paper, st = C.off, lw = 1.2, tc = C.dim, dash = [3,3];
      if (s.chk.k === 'ok')   { f = C.good; st = C.ink; lw = 1.6; tc = C.ink; dash = null; }
      if (s.chk.k === 'eq')   { f = C.bad; st = C.deep; lw = 2.4; tc = C.deep; dash = null; }
      if (s.chk.k === 'done') { f = C.good; st = C.ink; lw = 2.2; tc = C.ink; dash = null; }
      ctx.font = '700 12.5px ' + FM;
      const kw = Math.min(innerW, ctx.measureText(s.chk.t).width + 32);
      box(PAD, kY, kw, kH, f, st, lw, dash);
      txt(s.chk.t, PAD + kw/2, kY + kH/2 + 1, tc, '700 12.5px '+FM);
      // 右側補充:情境 C 原寫法提醒,其餘說明檢查規則
      const rx = PAD + kw + 16, rwid = innerW - kw - 16;
      const NOTE = { none:'pop2 一定 ≠ ch1:ch1 還拿在手上,不在 pq 裡', skip:'只在 pop1 後檢查;pop2 一定 ≠ ch1',
        ok:'只在 pop1 後檢查;pop2 一定 ≠ ch1', eq:'沒有別的字元能隔開 → 無解', done:'a 落在 0、2、5' };
      if (rwid > 120) {
        if (s.sc === 'C') ftxt('原寫法 if (ans.size() > 2) —— 下一步就出事', rx, kY + kH/2 + 1, C.curT, '700', 12, FM, rwid, 'left');
        else ftxt(NOTE[s.chk.k], rx, kY + kH/2 + 1, s.chk.k === 'eq' ? C.deep : C.dim, '600', 11.5, FM, rwid, 'left');
      }
    }

    /* ---------- BAND 2 · pq | 本輪取出 ---------- */
    head('BAND 2 · 最大堆 pq(次數大的在左 = top)| 本輪取出', PAD, B2);
    const by = B2 + 12, bh = 100, bg = 14;
    const pw = Math.max(236, innerW * 0.40), rw = innerW - pw - bg;
    const pX = PAD, rX = PAD + pw + bg;
    const chW = 60, chH = 32;

    const live = s.pq.filter(e => e[2] !== 'out1' && e[2] !== 'out2').length;
    box(pX, by, pw, bh, C.paper, C.ink, 1.4);
    txt('pq  (size = ' + live + ')', pX + 12, by + 16, C.ink, '700 12px '+MONO, 'left');
    txt('← top', pX + pw - 12, by + 16, C.dim, '600 10.5px '+MONO, 'right');
    const chY = by + 34;
    if (s.pq.length === 0) {
      box(pX + 12, chY, pw - 24, chH, C.paper, C.off, 1.2, [3,3]);
      txt('空', pX + pw/2, chY + chH/2 + 1, C.dim, '600 12px '+SANS);
    } else {
      s.pq.forEach((e, k) => {
        const x = pX + 12 + k*(chW + 12), m = e[2];
        pchip(x, chY, chW, chH, e[0], e[1], m === 'out1' || m === 'out2' ? 'ghost' : (m === 'back' ? 'back' : ''));
        if (m === 'out1') txt('pop1 →', x + chW/2, chY + chH + 14, C.curT, '700 11px '+MONO);
        if (m === 'out2') txt('pop2 →', x + chW/2, chY + chH + 14, C.ink, '700 11px '+MONO);
        if (m === 'back') txt('推回', x + chW/2, chY + chH + 14, C.ink, '700 11px '+SANS);
      });
      if (live === 0) txt('→ 取完變空', pX + 12 + s.pq.length*(chW + 12) + 4, chY + chH/2 + 1, C.dim, '600 11.5px '+SANS, 'left');
    }

    const hot = s.phase === 'pop' || s.phase === 'ret';
    box(rX, by, rw, bh, C.paper, hot ? C.curS : C.ink, hot ? 1.8 : 1.4);
    txt('本輪取出', rX + 12, by + 16, C.ink, '700 12px '+SANS, 'left');
    txt(s.phase === 'back' ? '先推 ch2,再推 ch1' : (s.phase === 'init' ? '(還沒開始)' : ''), rX + rw - 12, by + 16, C.dim, '600 10.5px '+SANS, 'right');
    const rowY = [by + 30, by + 64], rH = 28, rcw = 56;
    if (s.rows.length === 0) {
      box(rX + 12, rowY[0], rw - 24, rH*2 + 6, C.paper, C.off, 1.2, [3,3]);
      txt('每輪:pop1(最多)→ 檢查 → pop2(第二多)→ 推回', rX + rw/2, rowY[0] + rH + 4, C.dim, '600 11.5px '+SANS);
    }
    s.rows.forEach((r, k) => {
      const y = rowY[k];
      if (r[0] === null) {
        const warn = s.phase === 'ret';
        box(rX + 12, y, rw - 24, rH, warn ? C.bad : C.paper, warn ? C.deep : C.off, warn ? 1.6 : 1.2, warn ? null : [3,3]);
        ftxt(r[3], rX + rw/2, y + rH/2 + 1, warn ? C.deep : C.dim, '700', 11.5, FM, rw - 40);
        return;
      }
      pchip(rX + 12, y, rcw, rH, r[0], r[1], r[2]);
      ftxt(r[3], rX + 12 + rcw + 10, y + rH/2 + 1, r[2] === 'r' ? C.curT : C.ink, '700', 11.5, FM, rw - rcw - 40, 'left');
    });

    /* ---------- BAND 3 · 這一步 + 可行性 ---------- */
    head('BAND 3 · 這一步 + 可行性公式', PAD, B3);
    const ay = B3 + 12, ah = 34;
    let aF = C.cur, aS = C.curS, aT = C.curT, aLw = 2;
    if (s.phase === 'init' || s.phase === 'back') { aF = C.paper; aS = C.ink; aT = C.ink; aLw = 1.6; }
    if (s.phase === 'ret') { aF = C.bad; aS = C.deep; aT = C.deep; aLw = 2.4; }
    if (s.phase === 'end') { aF = C.good; aS = C.ink; aT = C.ink; aLw = 2.2; }
    box(PAD, ay, innerW, ah, aF, aS, aLw);
    ftxt(s.act.replace(/`/g, ''), PAD + innerW/2, ay + ah/2 + 1, aT, '700', 13, FM, innerW - 24);

    const ry = ay + ah + 12, rh = 32, fw1 = Math.min(210, innerW * 0.36);
    box(PAD, ry, fw1, rh, C.low, C.ink, 1.2);
    ftxt(sc.freq, PAD + fw1/2, ry + rh/2 + 1, C.ink, '700', 12, MONO, fw1 - 16);
    const fx = PAD + fw1 + 12, fw = innerW - fw1 - 12;
    box(fx, ry, fw, rh, sc.ok ? C.good : C.bad, sc.ok ? C.ink : C.deep, 1.8);
    ftxt(sc.form, fx + fw/2, ry + rh/2 + 1, sc.ok ? C.ink : C.deep, '700', 12.5, FM, fw - 16);
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
})();
