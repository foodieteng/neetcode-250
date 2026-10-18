/* ============================================================
   P211 · Design Add and Search Words Data Structure · viz
     bool search(string word) { return dfs(word, 0, root); }
     bool dfs(word, idx, node) {
       if (!node) return false;                       // null 擋在開頭
       if (idx == word.size()) return node->isWord;
       char c = word[idx];
       if (c != '.') return dfs(word, idx + 1, node->child[c - 'a']);
       for (TrieNode* child : node->child)            // 26 格全丟,含 nullptr
         if (dfs(word, idx + 1, child)) return true;
       return false;
     }
   動畫要傳達的一件事:字母只走一條;'.' 把 26 格全部丟下去,
   nullptr 也照丟 —— 由下一層開頭的 if (!node) 擋掉;找到就 early return。
   字典 {bad, dad, mad}:search("pad") / (".ad") / ("b..") + 摘要 ("..x")。
     BAND 1  Trie 樹 + 目前節點的 child[26]
     BAND 2  樣式 word,idx 指到哪
     BAND 3  這一步(程式碼層級)
     BAND 4  呼叫計數 + 結果列
   所有狀態取自實測 trace(instrumented binary),未手推。
   前綴 v211- 。
   ============================================================ */
(function () {
  const canvas = document.getElementById('v211-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('v211-step'), labelEl = document.getElementById('v211-label');
  const bPrev = document.getElementById('v211-prev'), bNext = document.getElementById('v211-next'),
        bPlay = document.getElementById('v211-play'), bReset = document.getElementById('v211-reset');

  const C = { paper:'#ffffff', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf',
    win:'#e3edf5', winS:'#4478c0', winT:'#2f5f9e',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424',
    ok:'#d9e8c7', okS:'#5fa866', okT:'#3f7a3a',
    off:'#f0f0ec', offS:'#cfcfcf', offT:'#a3a099', coral:'#cf3535' };
  const MONO = '"JetBrains Mono", monospace', SANS = '"Noto Sans TC", sans-serif';

  /* ---------- Trie {bad, dad, mad}:10 個節點 ---------- */
  // fx = 橫向比例(0..1,對應可用寬度),d = 深度
  const N = {
    R:   { ch:'root', path:'""',    par:null, fx:0.5, d:0 },
    b:   { ch:'b', path:'"b"',   par:'R',  fx:0.25, d:1 },
    ba:  { ch:'a', path:'"ba"',  par:'b',  fx:0.25, d:2 },
    bad: { ch:'d', path:'"bad"', par:'ba', fx:0.25, d:3, word:true },
    d:   { ch:'d', path:'"d"',   par:'R',  fx:0.5, d:1 },
    da:  { ch:'a', path:'"da"',  par:'d',  fx:0.5, d:2 },
    dad: { ch:'d', path:'"dad"', par:'da', fx:0.5, d:3, word:true },
    m:   { ch:'m', path:'"m"',   par:'R',  fx:0.75, d:1 },
    ma:  { ch:'a', path:'"ma"',  par:'m',  fx:0.75, d:2 },
    mad: { ch:'d', path:'"mad"', par:'ma', fx:0.75, d:3, word:true },
  };
  const IDS = Object.keys(N);
  const KIDS = {}; IDS.forEach(id => { const p = N[id].par; if (p) (KIDS[p] = KIDS[p] || []).push(N[id].ch); });
  // null 探針(ghost):掛在 parent 的某個字母格上
  const G = {
    'R:a':  { par:'R',  ch:'a', fx:0.035, d:0.7 },
    'R:p':  { par:'R',  ch:'p', fx:0.965, d:0.7 },
    'ba:a': { par:'ba', ch:'a', dx:-3, d:3 },
    'ba:b': { par:'ba', ch:'b', dx:-2, d:3 },
    'ba:c': { par:'ba', ch:'c', dx:-1, d:3 },
  };

  const SR = [
    { word:'pad', out:'false' },
    { word:'.ad', out:'true' },
    { word:'b..', out:'true' },
    { word:'..x', out:'false' },
  ];

  /* sr: 第幾個 search(-1 = 字典剛建好)
     idx: 目前 dfs 的 idx;cur: 目前 dfs 的 node(節點 id / ghost id / null)
     stack: 呼叫鏈上的(非 null)節點;ghosts: 這次 search 已探過的 null
     insp/slot/tried: 顯示哪個節點的 child[26]、正在看哪格、'.' 迴圈已試過哪些格
     calls/nulls: 計數;out: 結果列已填幾格;res: 'ok'|'fail'|null;dim: 這次沒碰到的節點 */
  const S = o => Object.assign({ sr:-1, idx:-1, cur:null, stack:[], ghosts:[], insp:null, slot:null, tried:[],
    loop:false, calls:0, nulls:0, out:0, res:null, dim:[], eq:'', text:'' }, o);

  const steps = [
    S({ eq:'addWord("bad"), addWord("dad"), addWord("mad") → 10 個節點(含 root)',
      text:'<strong>INITIAL · 字典建好</strong> · <code>addWord</code> 跟 P208 的 insert 一模一樣:沿路走、缺就建。三個字共用 <code>root</code>,各自長一條長度 3 的鏈,終點 ★ <code>isWord = true</code>。<b>真正的新東西在 search:<code>\'.\'</code> 可以配任何字母。</b>' }),

    // ---------- search("pad") ----------
    S({ sr:0, idx:0, cur:'R', stack:['R'], insp:'R', slot:'p', calls:1,
      eq:"dfs(0, root):  word[0] = 'p' 是字母 → dfs(1, child['p'])",
      text:'<strong>search("pad") · dfs(0, root)</strong> · <code>root</code> 不是 null、<code>idx ≠ 3</code>。<code>word[0] = \'p\'</code> 是<b>字母 ⇒ 只走一條</b>:直接把 <code>child[\'p\']</code> 丟下去 —— <b>不先檢查它是不是 nullptr</b>。' }),
    S({ sr:0, idx:1, cur:'R:p', stack:['R'], ghosts:['R:p'], insp:'R', slot:'p', calls:2, nulls:1,
      eq:"dfs(1, nullptr):  if (!node) return false",
      text:'<strong>dfs(1, null)</strong> · <code>root</code> 底下根本沒有 <code>p</code>,丟下來的是 <code>nullptr</code>。<b>函式第一行 <code>if (!node) return false</code> 把它擋掉</b> —— 「沒有這條路」的判斷集中在<b>開頭一處</b>,呼叫端完全不用檢查。' }),
    S({ sr:0, idx:0, cur:'R', stack:['R'], ghosts:['R:p'], insp:'R', slot:'p', calls:2, nulls:1, out:1, res:'fail',
      eq:'dfs(0, root) 直接 return 子呼叫的 false → search("pad") = false',
      text:'<strong>search("pad") → false</strong> · 字母分支是 <code>return dfs(...)</code>,子呼叫的 <code>false</code> 原封不動往上傳。<b>總共 2 次 dfs,其中 1 次是 null。</b>' }),

    // ---------- search(".ad") ----------
    S({ sr:1, idx:0, cur:'R', stack:['R'], insp:'R', loop:true, calls:1, out:1,
      eq:"dfs(0, root):  word[0] = '.' → 依序試 child['a'] … child['z']",
      text:'<strong>search(".ad") · dfs(0, root)</strong> · <code>word[0] = \'.\'</code> ⇒ <b>不知道該走哪條,就 26 格全部試</b>:<code>for (child : node-&gt;child)</code>,<b>連 nullptr 也照樣丟下去</b>。' }),
    S({ sr:1, idx:1, cur:'R:a', stack:['R'], ghosts:['R:a'], insp:'R', slot:'a', loop:true, calls:2, nulls:1, out:1,
      eq:"child['a'] == nullptr → dfs(1, null) 回 false → 迴圈繼續",
      text:'<strong>第 1 格 child[\'a\']</strong> · 是 <code>nullptr</code> ⇒ <code>dfs(1, null)</code> 被開頭的 <code>if (!node)</code> 擋掉,回 <code>false</code>。<b><code>if (dfs(...))</code> 不成立 ⇒ 迴圈往下一格。</b>' }),
    S({ sr:1, idx:1, cur:'b', stack:['R', 'b'], ghosts:['R:a'], insp:'b', slot:'a', calls:3, nulls:1, out:1,
      eq:"child['b'] = \"b\" → dfs(1, \"b\"):  word[1] = 'a' → dfs(2, child['a'])",
      text:'<strong>第 2 格 child[\'b\']</strong> · 存在 ⇒ <code>dfs(1, "b")</code>。這層 <code>word[1] = \'a\'</code> 是字母 ⇒ <b>只走 <code>child[\'a\']</code> 一條</b>。' }),
    S({ sr:1, idx:2, cur:'ba', stack:['R', 'b', 'ba'], ghosts:['R:a'], insp:'ba', slot:'d', calls:4, nulls:1, out:1,
      eq:"dfs(2, \"ba\"):  word[2] = 'd' → dfs(3, child['d'])",
      text:'<strong>dfs(2, "ba")</strong> · <code>word[2] = \'d\'</code> 是字母 ⇒ 丟 <code>child[\'d\']</code> 下去。' }),
    S({ sr:1, idx:3, cur:'bad', stack:['R', 'b', 'ba', 'bad'], ghosts:['R:a'], calls:5, nulls:1, out:1, res:'ok',
      eq:'dfs(3, "bad"):  idx == 3 == word.size() → return isWord = true',
      text:'<strong>dfs(3, "bad")</strong> · 不是 null,且 <code>idx == word.size()</code> ⇒ 樣式用完了,<b>答案就是 <code>node-&gt;isWord</code> = <code>true</code></b> ★。' }),
    S({ sr:1, idx:0, cur:'R', stack:['R', 'b', 'ba', 'bad'], ghosts:['R:a'], insp:'R', slot:'b', tried:['a'], loop:true,
      calls:5, nulls:1, out:2, res:'ok', dim:['d', 'da', 'dad', 'm', 'ma', 'mad'],
      eq:"true 一路傳回 → root 的迴圈 if (dfs(...)) return true;  child['c'..'z'] 沒試",
      text:'<strong>search(".ad") → true</strong> · <code>true</code> 一路回到 <code>root</code> 的迴圈 ⇒ <b>early return</b>。<code>"d"</code>、<code>"m"</code> 兩棵子樹(其實也配得上)<b>根本沒被碰到</b>。<b>共 5 次 dfs,1 次 null。</b>' }),

    // ---------- search("b..") ----------
    S({ sr:2, idx:0, cur:'R', stack:['R'], insp:'R', slot:'b', calls:1, out:2,
      eq:"dfs(0, root):  word[0] = 'b' 是字母 → dfs(1, child['b'])",
      text:'<strong>search("b..") · dfs(0, root)</strong> · 第一個是字母 <code>\'b\'</code> ⇒ 只走 <code>child[\'b\']</code>。<b>d、m 兩棵子樹在這一步就被排除了。</b>' }),
    S({ sr:2, idx:1, cur:'b', stack:['R', 'b'], insp:'b', slot:'a', loop:true, calls:2, out:2,
      dim:['d', 'da', 'dad', 'm', 'ma', 'mad'],
      eq:"dfs(1, \"b\"):  word[1] = '.' → 迴圈第 1 格 child['a'] = \"ba\" 存在",
      text:'<strong>dfs(1, "b")</strong> · <code>word[1] = \'.\'</code> ⇒ 跑 26 格迴圈。<b>第 1 格 <code>child[\'a\']</code> 就是 <code>"ba"</code></b>,存在 ⇒ 直接遞迴下去(這層沒有任何 null)。' }),
    S({ sr:2, idx:2, cur:'ba', stack:['R', 'b', 'ba'], insp:'ba', loop:true, calls:3, out:2,
      dim:['d', 'da', 'dad', 'm', 'ma', 'mad'],
      eq:"dfs(2, \"ba\"):  word[2] = '.' → 依序試 child['a'] … child['z']",
      text:'<strong>dfs(2, "ba")</strong> · <code>word[2]</code> 又是 <code>\'.\'</code> ⇒ 再跑一次 26 格。<code>"ba"</code> 只有 <code>child[\'d\']</code> 存在,<b>前面的 a、b、c 全是 nullptr —— 但照丟不誤。</b>' }),
    S({ sr:2, idx:3, cur:'ba:a', stack:['R', 'b', 'ba'], ghosts:['ba:a'], insp:'ba', slot:'a', loop:true, calls:4, nulls:1, out:2,
      dim:['d', 'da', 'dad', 'm', 'ma', 'mad'],
      eq:"child['a'] == nullptr → dfs(3, null):  if (!node) return false",
      text:'<strong>child[\'a\']</strong> · <code>dfs(3, null)</code> ⇒ 第一行擋掉,回 <code>false</code>。<b>注意順序:<code>!node</code> 必須在 <code>idx == size</code> 之前</b>,否則 <code>idx == 3</code> 會去讀 <code>nullptr-&gt;isWord</code> 而崩潰。' }),
    S({ sr:2, idx:3, cur:'ba:b', stack:['R', 'b', 'ba'], ghosts:['ba:a', 'ba:b'], insp:'ba', slot:'b', tried:['a'], loop:true, calls:5, nulls:2, out:2,
      dim:['d', 'da', 'dad', 'm', 'ma', 'mad'],
      eq:"child['b'] == nullptr → dfs(3, null) 回 false → 迴圈繼續",
      text:'<strong>child[\'b\']</strong> · 也是 <code>nullptr</code> ⇒ 又一次 <code>dfs(3, null)</code> → <code>false</code>。<b>null 呼叫計數 2。</b>' }),
    S({ sr:2, idx:3, cur:'ba:c', stack:['R', 'b', 'ba'], ghosts:['ba:a', 'ba:b', 'ba:c'], insp:'ba', slot:'c', tried:['a', 'b'], loop:true, calls:6, nulls:3, out:2,
      dim:['d', 'da', 'dad', 'm', 'ma', 'mad'],
      eq:"child['c'] == nullptr → dfs(3, null) 回 false → 迴圈繼續",
      text:'<strong>child[\'c\']</strong> · 第三個 <code>nullptr</code> ⇒ <code>false</code>。<b>每一次都是「呼叫 → 第一行就回」,O(1) 但真的有呼叫。</b>' }),
    S({ sr:2, idx:3, cur:'bad', stack:['R', 'b', 'ba', 'bad'], ghosts:['ba:a', 'ba:b', 'ba:c'], insp:'ba', slot:'d', tried:['a', 'b', 'c'], loop:true,
      calls:7, nulls:3, out:2, res:'ok', dim:['d', 'da', 'dad', 'm', 'ma', 'mad'],
      eq:'child[\'d\'] = "bad" → dfs(3, "bad"):  idx == 3 → return isWord = true',
      text:'<strong>child[\'d\'] = "bad"</strong> · 不是 null,<code>idx == 3 == word.size()</code> ⇒ <b>回 <code>isWord = true</code></b> ★。' }),
    S({ sr:2, idx:0, cur:'R', stack:['R', 'b', 'ba', 'bad'], ghosts:['ba:a', 'ba:b', 'ba:c'], insp:'ba', slot:'d', tried:['a', 'b', 'c'], loop:true,
      calls:7, nulls:3, out:3, res:'ok', dim:['d', 'da', 'dad', 'm', 'ma', 'mad'],
      eq:'"ba" 迴圈 return true → "b" 迴圈 return true → root return true',
      text:'<strong>search("b..") → true</strong> · <code>true</code> 從 <code>"ba"</code> 的迴圈、<code>"b"</code> 的迴圈逐層 early return,<code>child[\'e\'..\'z\']</code> 都沒試。<b>共 7 次 dfs,其中 3 次是 null。</b>' }),

    // ---------- 摘要 search("..x") ----------
    S({ sr:3, calls:108, nulls:101, out:4, res:'fail',
      eq:'search("..x"):  1 + 26 + 3×26 + 3 = 108 次 dfs,其中 23 + 75 + 3 = 101 次在 null 上',
      text:'<strong>摘要 · search("..x") → false</strong>(不逐步播)· root 丟 26 格(23 個 null),b/d/m 各再丟 26 格,最後 <code>"ba" "da" "ma"</code> 的 <code>child[\'x\']</code> 全是 null。<b>共 <code>108</code> 次 dfs,<code>101</code> 次被 <code>if (!node)</code> 擋掉</b> —— 這就是「nullptr 也丟下去」的代價:常數變大,但程式只有一處判斷。最差 <strong>O(26^L)</strong>。' }),
  ];

  let step = 0, timer = null;

  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||512; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function txt(s, x, y, font, color, align, base){ ctx.font=font; ctx.fillStyle=color; ctx.textAlign=align||'left'; ctx.textBaseline=base||'alphabetic'; ctx.fillText(s, x, y); }
  function circ(x, y, r){ ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); }

  const TREE_Y = 50, ROW = 52, R = 17, GR = 15, GSP = 54;

  function draw(){
    fit();
    const s = steps[step], w = canvas.clientWidth, H = canvas.clientHeight, PAD = 28, UW = w - 2*PAD;
    ctx.fillStyle = C.paper; ctx.fillRect(0, 0, w, H); ctx.setLineDash([]);

    const X = id => N[id] ? PAD + N[id].fx * UW : (G[id].fx != null ? PAD + G[id].fx * UW : X(G[id].par) + G[id].dx * Math.min(GSP, (X(G[id].par) - PAD - GR - 2) / 3));
    const Y = id => TREE_Y + (N[id] ? N[id].d : G[id].d) * ROW;
    const onStack = new Set(s.stack), ghosts = new Set(s.ghosts), dim = new Set(s.dim);
    const pathFill = s.res === 'ok' ? [C.ok, C.okS, C.okT] : [C.win, C.winS, C.winT];

    // ---------- BAND 1 ----------
    txt('BAND 1 · Trie {bad, dad, mad}   藍 = 呼叫鏈   紅 = 目前 / null', PAD, 18, '600 11.5px ' + MONO, C.dim);

    // edges between real nodes
    IDS.forEach(id => {
      const p = N[id].par; if (!p) return;
      const both = onStack.has(id) && onStack.has(p);
      const dm = dim.has(id);
      ctx.strokeStyle = both ? pathFill[1] : (dm ? '#e6e6e0' : C.grid); ctx.lineWidth = both ? 2.6 : 1.6;
      const x1 = X(p), y1 = Y(p), x2 = X(id), y2 = Y(id), L = Math.hypot(x2-x1, y2-y1);
      const ux = (x2-x1)/L, uy = (y2-y1)/L;
      ctx.beginPath(); ctx.moveTo(x1 + ux*R, y1 + uy*R); ctx.lineTo(x2 - ux*R, y2 - uy*R); ctx.stroke();
      // 邊上的字母
      const mx = x1 + (x2-x1)*0.5, my = y1 + (y2-y1)*0.5;
      const lx = (x2 === x1) ? mx + 10 : mx + (x2 > x1 ? 8 : -8), ly = my - 2;
      txt(N[id].ch, lx, ly, '700 10.5px ' + MONO, both ? pathFill[2] : (dm ? '#d3d3cc' : C.offT), x2 >= x1 ? 'left' : 'right', 'middle');
    });

    // ghost edges + ghost circles
    s.ghosts.forEach(gid => {
      const g = G[gid], isCur = s.cur === gid;
      const x1 = X(g.par), y1 = Y(g.par), x2 = X(gid), y2 = Y(gid), L = Math.hypot(x2-x1, y2-y1);
      const ux = (x2-x1)/L, uy = (y2-y1)/L;
      ctx.setLineDash([4, 3]); ctx.strokeStyle = isCur ? C.curS : '#e3a3a3'; ctx.lineWidth = isCur ? 2 : 1.4;
      ctx.beginPath(); ctx.moveTo(x1 + ux*R, y1 + uy*R); ctx.lineTo(x2 - ux*GR, y2 - uy*GR); ctx.stroke();
      circ(x2, y2, GR); ctx.fillStyle = isCur ? C.cur : '#fdf3f3'; ctx.fill();
      ctx.strokeStyle = isCur ? C.curS : '#e3a3a3'; ctx.lineWidth = isCur ? 2 : 1.3; ctx.stroke(); ctx.setLineDash([]);
      txt('null', x2, y2 + 1, '700 9px ' + MONO, isCur ? C.curT : '#c07070', 'center', 'middle');
      // 字母標籤:放在 ghost 上方偏 parent 那側
      const mx = x1 + (x2-x1)*0.55, my = y1 + (y2-y1)*0.55;
      txt(g.ch, mx + (x2 > x1 ? 6 : -6), my - 6, '700 10.5px ' + MONO, isCur ? C.curT : '#c07070', x2 > x1 ? 'left' : 'right', 'middle');
      txt('✗', x2, y2 + GR + 11, '700 11px ' + SANS, isCur ? C.curS : '#e3a3a3', 'center', 'middle');
    });

    // nodes
    IDS.forEach(id => {
      const n = N[id], x = X(id), y = Y(id);
      let bg = '#ffffff', bd = C.offS, tx = C.text;
      if (onStack.has(id)) { bg = pathFill[0]; bd = pathFill[1]; tx = pathFill[2]; }
      if (dim.has(id)) { bg = '#fbfbf8'; bd = '#e2e2dc'; tx = '#c8c8c0'; }
      if (s.sr === 3) { bg = '#ffffff'; bd = C.offS; tx = C.text; }
      circ(x, y, R); ctx.fillStyle = bg; ctx.fill(); ctx.lineWidth = 1.8; ctx.strokeStyle = bd; ctx.stroke();
      if (n.word) { circ(x, y, R - 4); ctx.lineWidth = 1.3; ctx.strokeStyle = bd; ctx.stroke(); }
      if (s.cur === id) { circ(x, y, R + 5); ctx.lineWidth = 2.4; ctx.strokeStyle = s.res === 'ok' && n.word ? C.okS : C.curS; ctx.stroke(); }
      txt(n.ch, x, y + 1, (id === 'R' ? '700 10px ' : '700 14px ') + MONO, tx, 'center', 'middle');
      if (n.word) {
        txt('★' + n.path, x, y + R + 13, '700 10.5px ' + MONO, dim.has(id) ? '#c8c8c0' : C.okT, 'center', 'middle');
      }
    });
    // 目前 dfs 的 idx 標在 cur 旁邊
    if (s.cur && N[s.cur] && s.sr >= 0 && s.sr < 3) {
      const x = X(s.cur), y = Y(s.cur), r = N[s.cur] ? R : GR;
      const left = x > PAD + UW * 0.5;
      const tag = 'idx=' + s.idx;
      txt(tag, left ? x - r - 9 : x + r + 9, y - r + 2, '700 10.5px ' + MONO, C.curT, left ? 'right' : 'left', 'middle');
    }

    // child[26] strip
    const SY = 258;
    {
      const lx = PAD, cx0 = PAD + 104, cw = (w - PAD - cx0) / 26, bw = cw - 3;
      if (s.insp) {
        const kids = KIDS[s.insp] || [];
        txt(N[s.insp].path + '->child[]', lx, SY + 10, '700 10.5px ' + MONO, C.text, 'left', 'middle');
        const tried = new Set(s.tried);
        for (let k = 0; k < 26; k++) {
          const ch = String.fromCharCode(97 + k), x = cx0 + k*cw, has = kids.indexOf(ch) >= 0;
          let bg = '#ffffff', bd = '#e2e2dc', tc = '#c4c4bc', lw = 1;
          if (has) { bg = C.off; bd = C.offS; tc = C.text; }
          if (tried.has(ch)) { bg = has ? C.win : '#fdf3f3'; bd = has ? C.winS : '#e3a3a3'; tc = has ? C.winT : '#c07070'; }
          if (ch === s.slot) {
            lw = 2;
            if (!has) { bg = C.cur; bd = C.curS; tc = C.curT; }
            else if (s.res === 'ok') { bg = C.ok; bd = C.okS; tc = C.okT; }
            else { bg = C.win; bd = C.winS; tc = C.winT; }
          }
          rr(x, SY, bw, 20, 3); ctx.fillStyle = bg; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = bd; ctx.stroke();
          txt(ch, x + bw/2, SY + 10.5, '700 10px ' + MONO, tc, 'center', 'middle');
        }
        // '.' 迴圈:標出 for 的範圍
        if (s.loop) {
          const yb = SY + 27;
          ctx.strokeStyle = C.curS; ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.moveTo(cx0 + 1, yb - 3); ctx.lineTo(cx0 + 1, yb); ctx.lineTo(cx0 + 26*cw - 4, yb); ctx.lineTo(cx0 + 26*cw - 4, yb - 3); ctx.stroke();
          txt("'.' → for (child : node->child) 26 格全部丟下去,含 nullptr", (cx0 + cx0 + 26*cw) / 2, yb + 12, '600 10.5px ' + SANS, C.curT, 'center', 'middle');
        }
      } else {
        const msg = s.sr === -1 ? '每個節點都有 child[26];search 時才會用到它' :
                    s.sr === 3 ? '"..x":root 26 格 → 3 個子節點各 26 格 → 3 次 child[\'x\'] = null' :
                    'idx == word.size() → 不再看 child[],直接回 isWord';
        txt(msg, lx, SY + 10, '600 11px ' + SANS, C.dim, 'left', 'middle');
      }
    }

    // ---------- BAND 2 ----------
    const B2 = 326;
    txt('BAND 2 · 樣式 word   紅 = word[idx]', PAD, B2, '600 12px ' + MONO, C.dim);
    const rowY = B2 + 14, rowH = 34, cw = 36, cg = 8;
    const sr = s.sr >= 0 ? SR[s.sr] : null;
    if (!sr) {
      txt('addWord("bad")  addWord("dad")  addWord("mad")', PAD, rowY + rowH/2 + 1, '700 12.5px ' + MONO, C.text, 'left', 'middle');
    } else {
      txt('search(', PAD, rowY + rowH/2 + 1, '700 12.5px ' + MONO, C.text, 'left', 'middle');
      const cx0 = PAD + 62;
      for (let k = 0; k < 3; k++) {
        const x = cx0 + k*(cw + cg), c = sr.word[k];
        let bg = c === '.' ? '#fafaf6' : C.off, bd = C.offS, tc = c === '.' ? C.curT : C.text;
        const done = s.res && (s.idx === 0 || s.sr === 3);
        if (!done && k < s.idx) { bg = C.win; bd = C.winS; tc = C.winT; }
        if (!done && k === s.idx) { bg = C.cur; bd = C.curS; tc = C.curT; }
        if (done) { if (s.res === 'ok') { bg = C.ok; bd = C.okS; tc = C.okT; } else { bg = C.cur; bd = C.curS; tc = C.curT; } }
        rr(x, rowY, cw, rowH, 5); ctx.fillStyle = bg; ctx.fill();
        ctx.lineWidth = (!done && k === s.idx) ? 2.4 : 1.5; ctx.strokeStyle = bd; ctx.stroke();
        txt(c, x + cw/2, rowY + rowH/2 + 1, '700 16px ' + MONO, tc, 'center', 'middle');
        txt(String(k), x + cw/2, rowY + rowH + 10, '600 9.5px ' + MONO, C.dim, 'center', 'middle');
      }
      const ex = cx0 + 3*(cw + cg) - cg + 6;
      txt(')', ex, rowY + rowH/2 + 1, '700 12.5px ' + MONO, C.text, 'left', 'middle');
      // idx == size 的「第 3 格」標記
      if (s.idx === 3 && !(s.res && s.idx === 0)) {
        txt('idx = 3 = size', ex + 18, rowY + rowH/2 + 1, '700 11.5px ' + MONO, s.res === 'ok' ? C.okT : C.curT, 'left', 'middle');
      }
      let right;
      if (s.sr === 3) right = '108 次 dfs';
      else if (s.res && s.cur === 'R' && s.idx === 0) right = 'search = ' + sr.out;
      else {
        const nd = !s.cur ? '' : (N[s.cur] ? (s.cur === 'R' ? 'root' : N[s.cur].path) : 'null');
        right = 'dfs(' + s.idx + ', ' + nd + ')';
      }
      const rc = s.res === 'ok' ? C.okT : C.curT;
      txt(right, w - PAD, rowY + rowH/2 + 1, '700 13px ' + MONO, rc, 'right', 'middle');
    }

    // ---------- BAND 3 ----------
    const B3 = 408;
    txt('BAND 3 · 這一步', PAD, B3, '600 12px ' + MONO, C.dim);
    let eb = '#fafaf6', es = C.grid, et = C.text;
    if (s.res === 'ok') { eb = C.ok; es = C.okS; et = C.okT; }
    else if (s.res === 'fail' || (s.cur && G[s.cur])) { eb = C.cur; es = C.curS; et = C.curT; }
    else if (s.sr >= 0) { eb = C.win; es = C.winS; et = C.winT; }
    rr(PAD, B3 + 10, UW, 34, 6); ctx.fillStyle = eb; ctx.fill(); ctx.lineWidth = 1.6; ctx.strokeStyle = es; ctx.stroke();
    let fs = 12; ctx.font = '700 ' + fs + 'px ' + MONO;
    while (fs > 9.5 && ctx.measureText(s.eq).width > UW - 20) { fs -= 0.5; ctx.font = '700 ' + fs + 'px ' + MONO; }
    txt(s.eq, w/2, B3 + 28, '700 ' + fs + 'px ' + MONO, et, 'center', 'middle');

    // ---------- BAND 4 ----------
    const B4 = 474;
    txt('BAND 4 · 呼叫計數 / 結果', PAD, B4, '600 12px ' + MONO, C.coral);
    const ry = B4 + 12, rh = 30;
    // 計數框
    const cwBox = 208;
    rr(PAD, ry, cwBox, rh, 5); ctx.fillStyle = '#fafaf6'; ctx.fill(); ctx.lineWidth = 1.4; ctx.strokeStyle = C.grid; ctx.stroke();
    if (s.sr < 0) {
      txt('dfs 呼叫 0 次', PAD + 12, ry + rh/2 + 1, '700 12px ' + MONO, C.dim, 'left', 'middle');
    } else {
      ctx.font = '700 12px ' + MONO;
      const a = 'dfs ' + s.calls + ' 次', b = ' · null ' + s.nulls + ' 次';
      txt(a, PAD + 12, ry + rh/2 + 1, '700 12px ' + MONO, C.text, 'left', 'middle');
      const aw = ctx.measureText(a).width;
      txt(b, PAD + 12 + aw, ry + rh/2 + 1, '700 12px ' + MONO, s.nulls ? C.curT : C.dim, 'left', 'middle');
    }
    // 結果列
    const n = SR.length, rg = 8, rw = Math.min(84, (w - PAD - (PAD + cwBox + 16) - (n-1)*rg) / n);
    const rx0 = w - PAD - (n*rw + (n-1)*rg);
    for (let k = 0; k < n; k++) {
      const x = rx0 + k*(rw + rg), filled = k < s.out, running = k === s.sr && !filled;
      txt('"' + SR[k].word + '"', x + rw/2, B4 - 1, '600 10px ' + MONO, k === s.sr ? C.curT : C.dim, 'center');
      let bg = C.off, bd = C.offS, tc = C.offT;
      if (filled) { if (SR[k].out === 'true') { bg = C.ok; bd = C.okS; tc = C.okT; } else { bg = C.cur; bd = C.curS; tc = C.curT; } }
      const justNow = filled && k === s.sr;
      rr(x, ry, rw, rh, 5); ctx.fillStyle = bg; ctx.fill();
      ctx.setLineDash(running ? [4, 3] : []); ctx.lineWidth = (running || justNow) ? 2.4 : 1.4;
      ctx.strokeStyle = running || justNow ? (filled && SR[k].out === 'true' ? C.okS : C.curS) : bd; ctx.stroke(); ctx.setLineDash([]);
      txt(filled ? SR[k].out : (running ? '…' : ''), x + rw/2, ry + rh/2 + 1, '700 12px ' + MONO, tc, 'center', 'middle');
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
