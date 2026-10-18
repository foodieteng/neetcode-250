/* ============================================================
   P208 · Implement Trie (Prefix Tree) · viz
     insert(w):  cur = root; for c: if (!child[i]) child[i] = new TrieNode(); cur = child[i];
                 cur->isWord = true;
     search(w, prefix=false): cur = root; for c: if (!child[i]) return false; cur = child[i];
                 if (prefix) return true; return cur->isWord;
     startsWith(p) = search(p, true)
   動畫要傳達的一件事:「路徑存在」≠「是單字」—— 差別全在終點的 isWord 旗標。
   例 1 + 額外 search("apx")(路徑中途斷掉的那種 false)。
     BAND 1  Trie 本體:root → a → p → p → l → e 一條鏈
     BAND 2  目前操作 + 正在處理的字元
     BAND 3  這一步的判斷
     BAND 4  結果列
   所有狀態取自實測 trace,未手推。
   前綴 v208- 。
   ============================================================ */
(function () {
  const canvas = document.getElementById('v208-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('v208-step'), labelEl = document.getElementById('v208-label');
  const bPrev = document.getElementById('v208-prev'), bNext = document.getElementById('v208-next'),
        bPlay = document.getElementById('v208-play'), bReset = document.getElementById('v208-reset');

  const C = { paper:'#ffffff', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf',
    win:'#e3edf5', winS:'#4478c0', winT:'#2f5f9e',
    seg:'#f6ead8', segS:'#c8801e', segT:'#96601a',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424',
    ok:'#d9e8c7', okS:'#5fa866', okT:'#3f7a3a',
    off:'#f0f0ec', offS:'#cfcfcf', offT:'#a3a099', coral:'#cf3535' };

  const MONO = '"JetBrains Mono", monospace', SANS = '"Noto Sans TC", sans-serif';

  /* 鏈上的 6 個節點(depth 0..5) */
  const CH   = ['root', 'a', 'p', 'p', 'l', 'e'];
  const PATH = ['""', '"a"', '"ap"', '"app"', '"appl"', '"apple"'];

  const OPS = [
    { name:'Trie()',              word:'',      short:'Trie' },
    { name:'insert("apple")',     word:'apple', short:'ins apple' },
    { name:'search("apple")',     word:'apple', short:'srch apple' },
    { name:'search("app")',       word:'app',   short:'srch app' },
    { name:'startsWith("app")',   word:'app',   short:'sw app' },
    { name:'insert("app")',       word:'app',   short:'ins app' },
    { name:'search("app")',       word:'app',   short:'srch app' },
    { name:'search("apx")',       word:'apx',   short:'srch apx' },
  ];
  const OUT = ['null', 'null', 'true', 'false', 'true', 'null', 'true', 'false'];

  /* op, ci(目前字元;=len 表示迴圈已結束), cur(depth), nodes(存在的節點數), newD(這步新建), words(isWord 的 depth),
     out(已填入幾格), res('ok'|'fail'|null), ghostX, eq, text */
  const S = (op, ci, cur, nodes, newD, words, out, res, eq, text, ghostX) =>
    ({ op, ci, cur, nodes, newD, words, out, res, eq, text, ghostX: !!ghostX });

  const steps = [
    S(0, 0, 0, 1, -1, [], 1, null,
      'Trie() → root = new TrieNode()   child[0..25] 全是 nullptr',
      '<strong>INITIAL · Trie()</strong> · 只有一個 <code>root</code>,它的 <code>child[26]</code> 全是 <code>nullptr</code>,<code>isWord = false</code>。<b>每個節點代表一個「前綴」</b>,root 代表空字串。虛線圈是之後會長出來的位置。'),

    S(1, 0, 1, 2, 1, [], 1, null,
      "child['a'] == nullptr → child['a'] = new TrieNode()   cur = \"a\"",
      '<strong>insert("apple") · 字元 a</strong> · <code>i = \'a\'-\'a\' = 0</code>,<code>root-&gt;child[0]</code> 是 <code>nullptr</code> ⇒ <b>缺就建</b>:<code>new TrieNode()</code>(橘色),然後 <code>cur</code> 走過去。'),
    S(1, 1, 2, 3, 2, [], 1, null,
      "child['p'] == nullptr → new TrieNode()   cur = \"ap\"",
      '<strong>字元 p</strong> · <code>"a"</code> 底下沒有 <code>p</code> ⇒ 新建節點 <code>"ap"</code>,<code>cur</code> 往下走。<b>insert 永遠不會失敗,只會「沿路走、缺就建」。</b>'),
    S(1, 2, 3, 4, 3, [], 1, null,
      "child['p'] == nullptr → new TrieNode()   cur = \"app\"",
      '<strong>字元 p</strong> · 新建 <code>"app"</code>。注意:<b>這個節點此刻 <code>isWord = false</code></b> —— 它只是 "apple" 路上經過的前綴,還不是單字。'),
    S(1, 3, 4, 5, 4, [], 1, null,
      "child['l'] == nullptr → new TrieNode()   cur = \"appl\"",
      '<strong>字元 l</strong> · 新建 <code>"appl"</code>,<code>cur</code> 往下走。'),
    S(1, 4, 5, 6, 5, [], 1, null,
      "child['e'] == nullptr → new TrieNode()   cur = \"apple\"",
      '<strong>字元 e</strong> · 新建 <code>"apple"</code>。這次 insert 一共<strong>新建 5 個節點</strong>,節點數 1 → 6。'),
    S(1, 5, 5, 6, -1, [5], 2, null,
      '迴圈結束 → cur->isWord = true   ("apple" 被標成單字)',
      '<strong>迴圈結束</strong> · <code>cur</code> 停在 <code>"apple"</code> ⇒ <code>cur-&gt;isWord = true</code>(★)。<b>只有終點被標記</b>,路上的 <code>"a" "ap" "app" "appl"</code> 都還是 <code>false</code>。insert 回傳 <code>null</code>。'),

    S(2, 5, 5, 6, -1, [5], 2, null,
      'a→p→p→l→e  每個 child 都不是 nullptr   cur = "apple"',
      '<strong>search("apple")</strong> · 沿路走:<code>a, p, p, l, e</code> 每一步的 <code>child[i]</code> 都存在(藍色是這次走過的路),<code>cur</code> 走到 <code>"apple"</code>。'),
    S(2, 5, 5, 6, -1, [5], 3, 'ok',
      '迴圈結束 · prefix = false → return cur->isWord = true',
      '<strong>search("apple") → true</strong> · 路徑走完,<code>prefix</code> 是 <code>false</code>,所以要看終點:<code>"apple".isWord = true</code> ⇒ <b>回傳 <code>true</code></b>。'),

    S(3, 3, 3, 6, -1, [5], 3, null,
      'a→p→p  都存在   cur = "app"',
      '<strong>search("app")</strong> · <code>a, p, p</code> 三步都走得通,<code>cur</code> 停在 <code>"app"</code>。<b>路徑完全存在</b> —— 但這還不夠。'),
    S(3, 3, 3, 6, -1, [5], 4, 'fail',
      '迴圈結束 · prefix = false → return cur->isWord = false',
      '<strong>search("app") → false</strong> · ⚡ <b>路徑存在,但 <code>"app".isWord = false</code></b> —— "app" 只是 "apple" 的前綴,從來沒被 insert 過。<strong>「走得到」≠「是單字」。</strong>'),

    S(4, 3, 3, 6, -1, [5], 4, null,
      'a→p→p  都存在   cur = "app"   (prefix = true)',
      '<strong>startsWith("app") = search("app", true)</strong> · 走的路<b>跟剛剛完全一樣</b>:<code>a, p, p</code>,停在 <code>"app"</code>。差別只在最後那行。'),
    S(4, 3, 3, 6, -1, [5], 5, 'ok',
      '迴圈結束 · prefix = true → return true   (不看 isWord)',
      '<strong>startsWith("app") → true</strong> · <code>prefix</code> 是 <code>true</code> ⇒ <b>只要路徑走完就回 <code>true</code></b>,根本不看 <code>isWord</code>。<strong>search 與 startsWith 共用同一段走訪,只差一個 flag。</strong>'),

    S(5, 3, 3, 6, -1, [5], 5, null,
      "a→p→p  的 child 都已存在 → 不新建   cur = \"app\"",
      '<strong>insert("app")</strong> · 沿路走:<code>a, p, p</code> 的 <code>child[i]</code> <b>全都已經存在</b> ⇒ <strong>一個節點都不建</strong>,直接重用 "apple" 留下的路。<code>cur</code> 停在 <code>"app"</code>。'),
    S(5, 3, 3, 6, -1, [5, 3], 6, 'ok',
      '迴圈結束 → cur->isWord = true   節點數仍是 6',
      '<strong>迴圈結束</strong> · <code>"app".isWord = true</code>(★)。<b>節點數仍是 6</b> —— 共用前綴正是 Trie 省空間的地方。insert 回傳 <code>null</code>。'),

    S(6, 3, 3, 6, -1, [5, 3], 6, null,
      'a→p→p  都存在   cur = "app"',
      '<strong>search("app")</strong>(第二次)· 一模一樣的路:<code>a, p, p</code>,停在 <code>"app"</code>。'),
    S(6, 3, 3, 6, -1, [5, 3], 7, 'ok',
      '迴圈結束 · prefix = false → return cur->isWord = true',
      '<strong>search("app") → true</strong> · 這次 <code>"app".isWord</code> 已經被上一個 insert 設成 <code>true</code> ⇒ <b>回傳 <code>true</code></b>。<strong>同一條路、同一個問題,答案從 false 變 true,只因為一個旗標。</strong>'),

    S(7, 0, 1, 6, -1, [5, 3], 7, null,
      "child['a'] != nullptr → cur = \"a\"",
      '<strong>search("apx")</strong>(額外)· 字元 <code>a</code>:<code>root-&gt;child[0]</code> 存在 ⇒ <code>cur</code> 走到 <code>"a"</code>。'),
    S(7, 1, 2, 6, -1, [5, 3], 7, null,
      "child['p'] != nullptr → cur = \"ap\"",
      '<strong>字元 p</strong> · <code>"a"</code> 的 <code>child[\'p\'-\'a\']</code> 存在 ⇒ <code>cur</code> 走到 <code>"ap"</code>。'),
    S(7, 2, 2, 6, -1, [5, 3], 8, 'fail',
      "child['x'] == nullptr → return false   (停在 \"ap\")",
      '<strong>字元 x → false</strong> · <code>"ap"</code> 的 <code>child[\'x\'-\'a\'] = child[23]</code> 是 <code>nullptr</code> ⇒ <b>路在中途斷了,立刻 <code>return false</code></b>,後面不用再看。<strong>這是第二種 false:路徑本身不存在</strong>(前一種是路徑存在但 <code>isWord = false</code>)。', true),

    S(-1, 0, -1, 6, -1, [5, 3], 8, null,
      '輸出 [null,null,true,false,true,null,true] ✓   search("apx") = false ✓',
      '<strong>完成</strong> · 例 1 輸出 <code>[null,null,true,false,true,null,true]</code> ✓,額外的 <code>search("apx")</code> = <code>false</code> ✓。<b>最終 6 個節點,兩個 ★:"app" 與 "apple"。</b>每個操作都是 <strong>O(L)</strong>,L 為字串長度。'),
  ];

  let step = 0, timer = null;

  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||456; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function txt(s, x, y, font, color, align, base){ ctx.font=font; ctx.fillStyle=color; ctx.textAlign=align||'left'; ctx.textBaseline=base||'alphabetic'; ctx.fillText(s, x, y); }

  const NODE_Y = 80, R = 20;

  function draw(){
    fit();
    const s = steps[step], w = canvas.clientWidth, PAD = 28;
    ctx.fillStyle = C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);

    const active = s.op >= 1;                 // 有在走訪路徑的操作
    const pathMax = active ? s.cur : -1;      // 這次走過的 depth 0..pathMax
    const words = new Set(s.words);
    const colW = (w - 2*PAD) / 6;
    const nx = d => PAD + (d + 0.5) * colW;

    // ---------- BAND 1 ----------
    txt('BAND 1 · Trie   藍 = 這次走過   橘 = 這步新建   紅圈 = cur', PAD, 16, '600 11.5px ' + MONO, C.dim);
    txt('節點數 = ' + s.nodes, w - PAD, 16, '700 12px ' + MONO, s.newD >= 0 ? C.segT : C.text, 'right');

    // edges
    for (let d = 1; d < 6; d++) {
      const exists = d < s.nodes;
      const onPath = d <= pathMax;
      ctx.setLineDash(exists ? [] : [4, 4]);
      let col = exists ? C.grid : '#e2e2dc', lw = exists ? 1.8 : 1.2;
      if (onPath) { col = s.res === 'ok' ? C.okS : C.winS; lw = 2.6; }
      if (d === s.newD) { col = C.segS; lw = 2.6; }
      ctx.strokeStyle = col; ctx.lineWidth = lw;
      ctx.beginPath(); ctx.moveTo(nx(d-1) + R + 2, NODE_Y); ctx.lineTo(nx(d) - R - 2, NODE_Y); ctx.stroke();
      // 邊上的 child index 提示(只在存在時)
      if (exists) {
        const mx = (nx(d-1) + nx(d)) / 2;
        txt('[' + (CH[d].charCodeAt(0) - 97) + ']', mx, NODE_Y - 8, '600 9.5px ' + MONO, onPath ? C.winT : C.offT, 'center');
      }
    }
    ctx.setLineDash([]);

    // nodes
    for (let d = 0; d < 6; d++) {
      const x = nx(d), exists = d < s.nodes;
      if (!exists) {
        ctx.setLineDash([4, 4]); ctx.strokeStyle = '#d6d6d0'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(x, NODE_Y, R, 0, Math.PI*2); ctx.stroke(); ctx.setLineDash([]);
        txt(PATH[d], x, NODE_Y - R - 18, '600 10.5px ' + MONO, '#d0d0ca', 'center');
        continue;
      }
      let bg = '#ffffff', bd = C.offS, tx = C.text;
      const onPath = d <= pathMax;
      if (onPath) { bg = C.win; bd = C.winS; tx = C.winT; }
      if (onPath && s.res === 'ok') { bg = C.ok; bd = C.okS; tx = C.okT; }
      if (d === s.newD) { bg = C.seg; bd = C.segS; tx = C.segT; }
      if (s.res === 'fail' && d === s.cur) { bg = C.cur; bd = C.curS; tx = C.curT; }
      if (s.op === -1) { bg = words.has(d) ? C.ok : '#ffffff'; bd = words.has(d) ? C.okS : C.winS; tx = words.has(d) ? C.okT : C.text; }

      ctx.beginPath(); ctx.arc(x, NODE_Y, R, 0, Math.PI*2);
      ctx.fillStyle = bg; ctx.fill(); ctx.lineWidth = 1.8; ctx.strokeStyle = bd; ctx.stroke();
      if (words.has(d)) {               // isWord 雙圈
        ctx.beginPath(); ctx.arc(x, NODE_Y, R - 4, 0, Math.PI*2);
        ctx.lineWidth = 1.4; ctx.strokeStyle = bd; ctx.stroke();
      }
      if (active && d === s.cur) {      // cur 紅色外圈
        ctx.beginPath(); ctx.arc(x, NODE_Y, R + 5, 0, Math.PI*2);
        ctx.lineWidth = 2.4; ctx.strokeStyle = C.curS; ctx.stroke();
      }
      txt(CH[d], x, NODE_Y + 1, (d === 0 ? '700 10.5px ' : '700 15px ') + MONO, tx, 'center', 'middle');
      const isCur = active && d === s.cur;
      txt(PATH[d], x, NODE_Y - R - 18, '700 10.5px ' + MONO, isCur ? C.curT : (onPath ? C.winT : C.dim), 'center');

      if (words.has(d)) {
        const justSet = (s.op === 1 && s.ci === 5 && d === 5) || (s.op === 5 && s.res === 'ok' && d === 3);
        const tw = 70, ty = NODE_Y + R + 18;
        rr(x - tw/2, ty, tw, 17, 8);
        ctx.fillStyle = justSet ? C.ok : '#fafaf6'; ctx.fill();
        ctx.lineWidth = justSet ? 1.8 : 1.2; ctx.strokeStyle = C.okS; ctx.stroke();
        txt('★ isWord', x, ty + 9, '700 10.5px ' + MONO, C.okT, 'center', 'middle');
      }
    }

    // 26 格 child[] 陣列:目前正在檢查的那個節點
    {
      const wd = s.op >= 0 ? OPS[s.op].word : '';
      const len = wd.length;
      let insp = s.cur < 0 ? 0 : s.cur;
      if (s.ci < len && s.cur === s.ci + 1) insp = s.ci;
      const slotC = s.ci < len ? wd[s.ci] : null;
      const sy = 160, lx = PAD, cx0 = PAD + 124, n = 26;
      const cw = (w - PAD - cx0) / n, bw = cw - 3;
      txt(PATH[insp] + '->child[]', lx, sy + 10, '700 10.5px ' + MONO, C.text, 'left', 'middle');
      for (let k = 0; k < n; k++) {
        const ch = String.fromCharCode(97 + k), x = cx0 + k * cw;
        const has = insp + 1 < s.nodes && CH[insp + 1] === ch;
        let bg = '#ffffff', bd = '#e2e2dc', tx = '#c4c4bc';
        if (has) { bg = C.off; bd = C.offS; tx = C.text; }
        if (ch === slotC) {
          if (!has) { bg = C.cur; bd = C.curS; tx = C.curT; }
          else if (s.newD >= 0) { bg = C.seg; bd = C.segS; tx = C.segT; }
          else { bg = C.win; bd = C.winS; tx = C.winT; }
        }
        rr(x, sy, bw, 20, 3); ctx.fillStyle = bg; ctx.fill();
        ctx.lineWidth = ch === slotC ? 2 : 1; ctx.strokeStyle = bd; ctx.stroke();
        txt(ch, x + bw/2, sy + 10.5, '700 10px ' + MONO, tx, 'center', 'middle');
      }
      ctx.setLineDash([2, 3]); ctx.strokeStyle = s.ghostX ? C.curS : '#c9c9c2'; ctx.lineWidth = 1.2;
      const bottom = words.has(insp) ? NODE_Y + R + 36 : NODE_Y + R + 6;
      ctx.beginPath(); ctx.moveTo(nx(insp), bottom + 4); ctx.lineTo(nx(insp), sy - 6); ctx.stroke(); ctx.setLineDash([]);
    }

    // ---------- BAND 2 ----------
    const B2 = 214;
    txt('BAND 2 · 目前操作 + 正在處理的字元', PAD, B2, '600 12px ' + MONO, C.dim);
    const rowY = B2 + 14, rowH = 34;
    const opName = s.op >= 0 ? OPS[s.op].name : '全部完成';
    rr(PAD, rowY, 176, rowH, 6);
    ctx.fillStyle = s.op === -1 ? C.ok : '#fafaf6'; ctx.fill();
    ctx.lineWidth = 1.5; ctx.strokeStyle = s.op === -1 ? C.okS : C.grid; ctx.stroke();
    txt(opName, PAD + 88, rowY + rowH/2 + 1, '700 12.5px ' + (s.op === -1 ? SANS : MONO), s.op === -1 ? C.okT : C.text, 'center', 'middle');

    const word = s.op >= 0 ? OPS[s.op].word : '';
    const cx0 = PAD + 196, cw = 36, cg = 8;
    if (!word) {
      txt(s.op === 0 ? '(建構子,沒有字元)' : '8 個操作都跑完', cx0, rowY + rowH/2 + 1, '600 12px ' + SANS, C.dim, 'left', 'middle');
    }
    for (let k = 0; k < word.length; k++) {
      const x = cx0 + k * (cw + cg);
      let bg = C.off, bd = C.offS, tx = C.offT;
      if (k < s.ci) { bg = C.win; bd = C.winS; tx = C.winT; }
      if (k === s.ci) { bg = C.cur; bd = C.curS; tx = C.curT; }
      if (s.ci >= word.length && s.res === 'ok') { bg = C.ok; bd = C.okS; tx = C.okT; }
      if (s.ci >= word.length && s.res === 'fail') { bg = C.cur; bd = C.curS; tx = C.curT; }
      rr(x, rowY, cw, rowH, 5); ctx.fillStyle = bg; ctx.fill();
      ctx.lineWidth = k === s.ci ? 2.4 : 1.5; ctx.strokeStyle = bd; ctx.stroke();
      txt(word[k], x + cw/2, rowY + rowH/2 + 1, '700 15px ' + MONO, tx, 'center', 'middle');
    }
    if (active) {
      txt('cur → ' + PATH[s.cur], w - PAD, rowY + rowH/2 + 1, '700 12.5px ' + MONO, C.curT, 'right', 'middle');
    } else {
      txt('cur → root', w - PAD, rowY + rowH/2 + 1, '700 12.5px ' + MONO, s.op === 0 ? C.curT : C.dim, 'right', 'middle');
    }

    // ---------- BAND 3 ----------
    const B3 = 294;
    txt('BAND 3 · 這一步的判斷', PAD, B3, '600 12px ' + MONO, C.dim);
    let eb = '#fafaf6', es = C.grid, et = C.text;
    if (s.newD >= 0) { eb = C.seg; es = C.segS; et = C.segT; }
    else if (s.res === 'ok' || s.op === -1) { eb = C.ok; es = C.okS; et = C.okT; }
    else if (s.res === 'fail') { eb = C.cur; es = C.curS; et = C.curT; }
    else if (active) { eb = C.win; es = C.winS; et = C.winT; }
    rr(PAD, B3 + 10, w - 2*PAD, 36, 6); ctx.fillStyle = eb; ctx.fill();
    ctx.lineWidth = 1.6; ctx.strokeStyle = es; ctx.stroke();
    txt(s.eq, w/2, B3 + 29, '700 12px ' + MONO, et, 'center', 'middle');

    // ---------- BAND 4 ----------
    const B4 = 370;
    txt('BAND 4 · 結果列', PAD, B4, '600 12px ' + MONO, C.coral);
    const n = OUT.length, rg = 8, rw = Math.min(74, (w - 2*PAD - (n-1)*rg) / n);
    const rx0 = (w - (n*rw + (n-1)*rg)) / 2, ry = B4 + 40, rh = 30;
    for (let k = 0; k < n; k++) {
      const x = rx0 + k * (rw + rg);
      const filled = k < s.out, running = k === s.op && !filled;
      const justNow = filled && k === s.out - 1 && s.op === k && (s.res || OUT[k] === 'null');
      txt(OPS[k].short, x + rw/2, B4 + 26, '600 9.5px ' + MONO, (k === s.op) ? C.curT : C.dim, 'center');
      let bg = C.off, bd = C.offS, tx = C.offT;
      if (filled) {
        if (OUT[k] === 'true') { bg = C.ok; bd = C.okS; tx = C.okT; }
        else if (OUT[k] === 'false') { bg = C.cur; bd = C.curS; tx = C.curT; }
        else { bg = '#fafaf6'; bd = C.grid; tx = C.text; }
      }
      if (k === 7 && filled) { bd = C.curS; }
      rr(x, ry, rw, rh, 5); ctx.fillStyle = bg; ctx.fill();
      ctx.setLineDash(running ? [4, 3] : []);
      ctx.lineWidth = (running || justNow) ? 2.4 : 1.4;
      ctx.strokeStyle = running ? C.curS : (justNow ? C.curS : bd); ctx.stroke(); ctx.setLineDash([]);
      txt(filled ? OUT[k] : (running ? '…' : ''), x + rw/2, ry + rh/2 + 1, '700 12px ' + MONO, tx, 'center', 'middle');
    }
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
