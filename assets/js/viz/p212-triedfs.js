/* ============================================================
   P212 · Word Search II — Trie + board DFS(標 '#' / 剪枝 / 還原)· viz
     findWords:words 全插進 Trie(結尾節點存整個字 node->word)
       for i, for j:  if (root->child[board[i][j]]) { 標 '#'; search(i, j, child); 還原; }
     search(r, c, node):
       if (!node->word.empty()) { ans.push_back(node->word); node->word.clear(); }
       for (上 下 左 右) { 出界 → continue;  '#' 或 Trie 沒這個字母 → continue;
                          標 '#'; search(nr, nc, node->child[x]); 還原; }
   board = oaan / etae / ihkr / iflv,words = {oath, pea, eat, rain}
     → ans = [oath, eat],共 9 次 search、4 個起點、12 個 SKIP
   每個方向的結果取自實測 trace(instrumented g++,見 facts),未手推。
   BAND 1 board(紅 = 目前格,米 + # = 在路徑上)+ Trie(紅 = 目前 node)
   BAND 2 目前這層的四個方向   BAND 3 ans + 計數   BAND 4 這一步
   前綴 v212- 。
   ============================================================ */
(function () {
  const C = { paper:'#ffffff', ink:'#1f1f1f', dim:'#5a5a5a', off:'#cfcfcf',
    up:'#e3edf5', low:'#f6ead8',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424',
    good:'#d9e8c7', bad:'#f0d4d4', deep:'#a31d1d', gray:'#ececec' };
  const MONO = '"JetBrains Mono", monospace', SANS = '"Noto Sans TC", sans-serif';
  const B = [['o','a','a','n'], ['e','t','a','e'], ['i','h','k','r'], ['i','f','l','v']];
  const TOTAL = 9, NSTART = 4, NSKIP = 12;
  const DN = ['上', '下', '左', '右'], DIRS = [[-1,0],[1,0],[0,-1],[0,1]];
  const n2 = v => v < 0 ? '−' + (-v) : String(v);

  /* Trie:id = 前綴字串,'' = root;col = 第幾條直欄,d = 深度 */
  const COLS = ['oath', 'pea', 'eat', 'rain'];
  const TN = [{ id:'', ch:'root', col:-1, d:0 }];
  COLS.forEach((wd, k) => { for (let i = 1; i <= wd.length; i++) TN.push({ id:wd.slice(0, i), ch:wd[i-1], col:k, d:i, word: i === wd.length ? wd : null }); });
  const TPAR = id => id.length ? id.slice(0, -1) : null;
  const TP = id => { const a = []; for (let i = 1; i <= id.length; i++) a.push(id.slice(0, i)); return a; };   // root 之下的路徑

  /* 方向列:{ k:'w'|'oob'|'hash'|'cut'|'in'|'back', x(字母), n(呼叫編號) } */
  const w = { k:'w' }, oob = { k:'oob' }, hs = { k:'hash' };
  const cut = x => ({ k:'cut', x }), inn = n => ({ k:'in', n }), back = n => ({ k:'back', n });
  const P = (no, r, c, nd, rows, o) => Object.assign({ no, r, c, nd, rows }, o || {});
  const W4 = [w, w, w, w];
  const OATH = [[0,0],[0,1],[1,1],[2,1]], EAT = [[1,3],[1,2],[1,1]];

  const S = o => Object.assign({ calls:0, starts:0, skips:0, ans:[], marks:[], cur:null, curNote:'', path:[], tnode:null,
    cleared:[], found:null, dimT:[], scan:null, restored:[], panel:null, final:false }, o);

  const STEPS = [
    S({ line:'for (w : words) insert(w);   → Trie 15 個節點(含 root),結尾節點存 node->word',
      text:'<strong>INITIAL</strong> · 先把 <code>{oath, pea, eat, rain}</code> 插進 Trie,<b>結尾節點直接存整個字</b>(<code>node-&gt;word</code>,★)。接著兩個 for 掃每一格當起點:<code>root</code> 有這個字母才進 <code>search</code>,進去前先把格子標 <code>\'#\'</code>。' }),
    // ---------- 起點 (0,0) 'o' ----------
    S({ calls:1, starts:1, marks:[[0,0]], cur:[0,0], curNote:'#1', path:[[0,0]], tnode:'o',
      panel:P(1, 0, 0, 'o', W4),
      line:'START (0,0):  root->child[\'o\'] 存在 → board[0][0] = \'#\';  search(0, 0, "o")  #1',
      text:'<strong>#1 · 起點 (0,0) \'o\'</strong> · <code>root-&gt;child[\'o\']</code> 存在 → <b>呼叫端</b>先標 <code>board[0][0] = \'#\'</code>,再 <code>search(0,0, node "o")</code>。"o" 的 <code>word</code> 是空的,不收。' }),
    S({ calls:1, starts:1, marks:[[0,0]], cur:[0,0], curNote:'#1', path:[[0,0]], tnode:'o',
      panel:P(1, 0, 0, 'o', [oob, cut('e'), oob, inn(2)], { now:3 }),
      line:'#1 迴圈:上 出界 · 下 \'e\' 不在 "o" 底下 · 左 出界 · 右 (0,1) \'a\' → 進去',
      text:'<strong>#1 · 四個方向</strong> · 上、左 <b>出界</b>;下是 <code>\'e\'</code>,但 <code>"o"-&gt;child[\'e\']</code> 是空的 → <b>Trie 直接剪掉</b>;右 <code>\'a\'</code> 有子節點 → 標 <code>\'#\'</code> 進去。' }),
    S({ calls:2, starts:1, marks:[[0,0],[0,1]], cur:[0,1], curNote:'#2', path:[[0,0],[0,1]], tnode:'oa',
      panel:P(2, 0, 1, 'oa', W4),
      line:'#2  search(0, 1, "oa"):  word 空 → 不收;開始四個方向',
      text:'<strong>#2 · (0,1) node "oa"</strong> · 路徑 o→a,Trie 也同步走到 <code>"oa"</code>。<b>board 走一步、Trie 就往下一層</b>,兩邊一起前進。' }),
    S({ calls:2, starts:1, marks:[[0,0],[0,1]], cur:[0,1], curNote:'#2', path:[[0,0],[0,1]], tnode:'oa',
      panel:P(2, 0, 1, 'oa', [oob, inn(3), w, w], { now:1 }),
      line:'#2 迴圈:上 (−1,1) 出界 · 下 (1,1) \'t\' → "oa"->child[\'t\'] 存在 → 進去',
      text:'<strong>#2 · 上 / 下</strong> · 上出界;下 <code>(1,1) = \'t\'</code>,<code>"oa"-&gt;child[\'t\']</code> 存在 → 標 <code>\'#\'</code> 進去 #3(左、右等 #3 回來再試)。' }),
    S({ calls:3, starts:1, marks:[[0,0],[0,1],[1,1]], cur:[1,1], curNote:'#3', path:[[0,0],[0,1],[1,1]], tnode:'oat',
      panel:P(3, 1, 1, 'oat', W4),
      line:'#3  search(1, 1, "oat"):  word 空 → 不收',
      text:'<strong>#3 · (1,1) node "oat"</strong> · 路徑 o→a→t。<code>"oat"</code> 不是結尾,<code>word</code> 空。' }),
    S({ calls:3, starts:1, marks:[[0,0],[0,1],[1,1]], cur:[1,1], curNote:'#3', path:[[0,0],[0,1],[1,1]], tnode:'oat',
      panel:P(3, 1, 1, 'oat', [hs, inn(4), w, w], { now:1 }),
      line:'#3 迴圈:上 (0,1) == \'#\' → continue · 下 (2,1) \'h\' → 進去',
      text:'<strong>#3 · 上 / 下</strong> · 上 <code>(0,1)</code> 是 <code>\'#\'</code>(剛走來的格)→ 跳過,<b>同一格不會用兩次</b>;下 <code>\'h\'</code> 有子節點 → 進去 #4。' }),
    S({ calls:4, starts:1, marks:[[0,0],[0,1],[1,1],[2,1]], cur:[2,1], curNote:'#4', path:[[0,0],[0,1],[1,1],[2,1]], tnode:'oath',
      panel:P(4, 2, 1, 'oath', W4),
      line:'#4  search(2, 1, "oath"):  if (!node->word.empty())  → word = "oath"',
      text:'<strong>#4 · (2,1) node "oath"</strong> · 這個節點的 <code>word = "oath"</code> 不是空的 —— <b>走到 ★ 節點就代表拼出一個字</b>,不用另外比對字串。' }),
    S({ calls:4, starts:1, ans:['oath'], marks:[[0,0],[0,1],[1,1],[2,1]], cur:[2,1], curNote:'FOUND', path:[[0,0],[0,1],[1,1],[2,1]], tnode:'oath',
      found:'oath', cleared:['oath'], panel:P(4, 2, 1, 'oath', W4),
      line:'FOUND:  ans.push_back("oath");  node->word.clear();',
      text:'<strong>FOUND · oath</strong> · <code>ans.push_back("oath")</code>,然後 <code>node-&gt;word.clear()</code> —— <b>清空 = 去重</b>:之後別條路再走到這個節點也不會再收一次。<b>注意不 return</b>,迴圈照跑。' }),
    S({ calls:4, starts:1, ans:['oath'], marks:[[0,0],[0,1],[1,1]], cur:[1,1], curNote:'#3', path:[[0,0],[0,1],[1,1]], tnode:'oat',
      cleared:['oath'], restored:[[2,1]], panel:P(4, 2, 1, 'oath', [hs, cut('f'), cut('i'), cut('k')], { done:'#4 (2,1) 四個方向都不通 → return · 還原 (2,1)' }),
      line:'#4 迴圈:上 \'#\' · 下 \'f\' · 左 \'i\' · 右 \'k\' 都不在 "oath" 底下 → return;board[2][1] = \'h\'',
      text:'<strong>#4 · 迴圈 → 回 #3</strong> · FOUND 之後迴圈還是跑完:上是 <code>\'#\'</code>,<code>f / i / k</code> 都不是 <code>"oath"</code> 的子節點 → 全剪。return 後 #3 把 <code>(2,1)</code> <b>還原成 \'h\'</b>。' }),
    S({ calls:4, starts:1, ans:['oath'], marks:[[0,0],[0,1]], cur:[0,1], curNote:'#2', path:[[0,0],[0,1]], tnode:'oa',
      cleared:['oath'], restored:[[1,1]], panel:P(3, 1, 1, 'oat', [hs, back(4), cut('e'), cut('a')], { done:'#3 (1,1) 左右也剪掉 → return · 還原 (1,1)' }),
      line:'#3 迴圈:左 (1,0) \'e\'、右 (1,2) \'a\' 不在 "oat" 底下 → return;board[1][1] = \'t\'',
      text:'<strong>#3 · 左 / 右 → 回 #2</strong> · <code>"oat"</code> 只有 <code>child[\'h\']</code>,<code>\'e\'</code>、<code>\'a\'</code> 都剪掉。return 後 #2 把 <code>(1,1)</code> <b>還原成 \'t\'</b>。' }),
    S({ calls:4, starts:1, ans:['oath'], cleared:['oath'], restored:[[0,1],[0,0]],
      panel:P(2, 0, 1, 'oa', [oob, back(3), hs, cut('a')], { done:'#2 (0,1) 跑完 → return · 還原 (0,1)、(0,0)' }),
      line:'#2:左 (0,0) \'#\'、右 (0,2) \'a\' 剪 → return;#1 也跑完 → main 還原 board[0][0] = \'o\'',
      text:'<strong>#2 → #1 → main</strong> · #2 左是 <code>\'#\'</code>、右 <code>\'a\'</code> 不在 <code>"oa"</code> 底下 → return,還原 <code>(0,1)</code>;#1 的四個方向早就試完 → return,<b>main 把 <code>(0,0)</code> 還原成 \'o\'</b>。board 又乾淨了。' }),
    S({ calls:4, starts:1, skips:3, ans:['oath'], cleared:['oath'], tnode:'', scan:[[0,1],[0,2],[0,3]],
      line:'SKIP (0,1) \'a\'、(0,2) \'a\'、(0,3) \'n\':  root->child[x] == nullptr → 不呼叫 search',
      text:'<strong>SKIP × 3</strong> · <code>root</code> 底下只有 <code>o p e r</code>。<code>\'a\'</code>、<code>\'n\'</code> 開頭的字不存在 → <b>連 search 都不呼叫</b>,外層就剪掉。' }),
    // ---------- 起點 (1,0) 'e' ----------
    S({ calls:5, starts:2, skips:3, ans:['oath'], cleared:['oath'], marks:[[1,0]], cur:[1,0], curNote:'#5', path:[[1,0]], tnode:'e',
      panel:P(5, 1, 0, 'e', W4),
      line:'START (1,0):  root->child[\'e\'] 存在 → board[1][0] = \'#\';  search(1, 0, "e")  #5',
      text:'<strong>#5 · 起點 (1,0) \'e\'</strong> · <code>root-&gt;child[\'e\']</code> 存在 → 標 <code>\'#\'</code>,進 <code>search(1,0, node "e")</code>。<code>"e"</code> 底下只有 <code>\'a\'</code>。' }),
    S({ calls:5, starts:2, skips:3, ans:['oath'], cleared:['oath'], restored:[[1,0]],
      panel:P(5, 1, 0, 'e', [cut('o'), cut('i'), oob, cut('t')], { done:'#5 (1,0) 鄰居沒有 \'a\' → return · 還原 (1,0)' }),
      line:'#5 迴圈:上 \'o\'、下 \'i\'、右 \'t\' 都不在 "e" 底下,左 出界 → return;board[1][0] = \'e\'',
      text:'<strong>#5 · 四個方向全剪</strong> · <code>"e"</code> 只接 <code>\'a\'</code>,鄰居 <code>o / i / t</code> 都不是 → 一層都下不去。return,main <b>還原 (1,0)</b>。' }),
    S({ calls:5, starts:2, skips:5, ans:['oath'], cleared:['oath'], tnode:'', scan:[[1,1],[1,2]],
      line:'SKIP (1,1) \'t\'、(1,2) \'a\':  root->child[x] == nullptr',
      text:'<strong>SKIP × 2</strong> · <code>\'t\'</code>、<code>\'a\'</code> 不在 <code>root</code> 底下 → 跳過。' }),
    // ---------- 起點 (1,3) 'e' ----------
    S({ calls:6, starts:3, skips:5, ans:['oath'], cleared:['oath'], marks:[[1,3]], cur:[1,3], curNote:'#6', path:[[1,3]], tnode:'e',
      panel:P(6, 1, 3, 'e', W4),
      line:'START (1,3):  root->child[\'e\'] 存在 → board[1][3] = \'#\';  search(1, 3, "e")  #6',
      text:'<strong>#6 · 起點 (1,3) \'e\'</strong> · 同一個 Trie 節點 <code>"e"</code>,換一個起點再走一次。' }),
    S({ calls:6, starts:3, skips:5, ans:['oath'], cleared:['oath'], marks:[[1,3]], cur:[1,3], curNote:'#6', path:[[1,3]], tnode:'e',
      panel:P(6, 1, 3, 'e', [cut('n'), cut('r'), inn(7), w], { now:2 }),
      line:'#6 迴圈:上 \'n\'、下 \'r\' 剪 · 左 (1,2) \'a\' → "e"->child[\'a\'] 存在 → 進去',
      text:'<strong>#6 · 上 / 下 / 左</strong> · <code>\'n\'</code>、<code>\'r\'</code> 不在 <code>"e"</code> 底下 → 剪;左 <code>(1,2) = \'a\'</code> 接得上 → 標 <code>\'#\'</code> 進去 #7。' }),
    S({ calls:7, starts:3, skips:5, ans:['oath'], cleared:['oath'], marks:[[1,3],[1,2]], cur:[1,2], curNote:'#7', path:[[1,3],[1,2]], tnode:'ea',
      panel:P(7, 1, 2, 'ea', W4),
      line:'#7  search(1, 2, "ea"):  word 空 → 不收',
      text:'<strong>#7 · (1,2) node "ea"</strong> · 路徑 e→a,Trie 走到 <code>"ea"</code>。' }),
    S({ calls:7, starts:3, skips:5, ans:['oath'], cleared:['oath'], marks:[[1,3],[1,2]], cur:[1,2], curNote:'#7', path:[[1,3],[1,2]], tnode:'ea',
      panel:P(7, 1, 2, 'ea', [cut('a'), cut('k'), inn(8), w], { now:2 }),
      line:'#7 迴圈:上 \'a\'、下 \'k\' 剪 · 左 (1,1) \'t\' → "ea"->child[\'t\'] 存在 → 進去',
      text:'<strong>#7 · 上 / 下 / 左</strong> · <code>"ea"</code> 只接 <code>\'t\'</code>:上 <code>\'a\'</code>、下 <code>\'k\'</code> 剪掉;左 <code>(1,1) = \'t\'</code> → 進去 #8。' }),
    S({ calls:8, starts:3, skips:5, ans:['oath'], cleared:['oath'], marks:[[1,3],[1,2],[1,1]], cur:[1,1], curNote:'#8', path:[[1,3],[1,2],[1,1]], tnode:'eat',
      panel:P(8, 1, 1, 'eat', W4),
      line:'#8  search(1, 1, "eat"):  if (!node->word.empty())  → word = "eat"',
      text:'<strong>#8 · (1,1) node "eat"</strong> · <code>(1,1)</code> 剛才在 oath 那條路上用過,但早已還原成 <code>\'t\'</code>,這次可以再用。<code>word = "eat"</code> 非空。' }),
    S({ calls:8, starts:3, skips:5, ans:['oath','eat'], cleared:['oath','eat'], found:'eat', marks:[[1,3],[1,2],[1,1]], cur:[1,1], curNote:'FOUND', path:[[1,3],[1,2],[1,1]], tnode:'eat',
      panel:P(8, 1, 1, 'eat', W4),
      line:'FOUND:  ans.push_back("eat");  node->word.clear();',
      text:'<strong>FOUND · eat</strong> · <code>ans.push_back("eat")</code>,清空 <code>"eat"</code> 節點的 <code>word</code>。ans 依<b>找到的順序</b>排:<code>[oath, eat]</code>。' }),
    S({ calls:8, starts:3, skips:5, ans:['oath','eat'], cleared:['oath','eat'], marks:[[1,3],[1,2]], cur:[1,2], curNote:'#7', path:[[1,3],[1,2]], tnode:'ea',
      restored:[[1,1]], panel:P(8, 1, 1, 'eat', [cut('a'), cut('h'), cut('e'), hs], { done:'#8 (1,1) 四個方向都不通 → return · 還原 (1,1)' }),
      line:'#8 迴圈:上 \'a\'、下 \'h\'、左 \'e\' 剪 · 右 (1,2) \'#\' → return;board[1][1] = \'t\'',
      text:'<strong>#8 · 迴圈 → 回 #7</strong> · <code>"eat"</code> 沒有子節點,鄰居全剪;右邊是 <code>\'#\'</code>。return,#7 <b>還原 (1,1)</b>。' }),
    S({ calls:8, starts:3, skips:5, ans:['oath','eat'], cleared:['oath','eat'], marks:[[1,3]], cur:[1,3], curNote:'#6', path:[[1,3]], tnode:'e',
      restored:[[1,2]], panel:P(7, 1, 2, 'ea', [cut('a'), cut('k'), back(8), hs], { done:'#7 (1,2) 跑完 → return · 還原 (1,2)' }),
      line:'#7 迴圈:右 (1,3) == \'#\' → continue → return;board[1][2] = \'a\'',
      text:'<strong>#7 · 右 → 回 #6</strong> · 右 <code>(1,3)</code> 是起點,還標著 <code>\'#\'</code> → 跳過。return,#6 <b>還原 (1,2)</b>。' }),
    S({ calls:8, starts:3, skips:5, ans:['oath','eat'], cleared:['oath','eat'], restored:[[1,3]],
      panel:P(6, 1, 3, 'e', [cut('n'), cut('r'), back(7), oob], { done:'#6 (1,3) 跑完 → return · 還原 (1,3)' }),
      line:'#6 迴圈:右 (1,4) 出界 → return;main 還原 board[1][3] = \'e\'',
      text:'<strong>#6 · 右 → main</strong> · 右 <code>(1,4)</code> 出界。return,main <b>還原 (1,3)</b>,board 又乾淨了。' }),
    S({ calls:8, starts:3, skips:8, ans:['oath','eat'], cleared:['oath','eat'], tnode:'', scan:[[2,0],[2,1],[2,2]],
      line:'SKIP (2,0) \'i\'、(2,1) \'h\'、(2,2) \'k\':  root->child[x] == nullptr',
      text:'<strong>SKIP × 3</strong> · <code>\'i\' \'h\' \'k\'</code> 都不是任何字的開頭 → 跳過。' }),
    // ---------- 起點 (2,3) 'r' ----------
    S({ calls:9, starts:4, skips:8, ans:['oath','eat'], cleared:['oath','eat'], marks:[[2,3]], cur:[2,3], curNote:'#9', path:[[2,3]], tnode:'r',
      panel:P(9, 2, 3, 'r', W4),
      line:'START (2,3):  root->child[\'r\'] 存在 → board[2][3] = \'#\';  search(2, 3, "r")  #9',
      text:'<strong>#9 · 起點 (2,3) \'r\'</strong> · <code>root-&gt;child[\'r\']</code> 存在 → 標 <code>\'#\'</code> 進去。<code>"r"</code> 底下只接 <code>\'a\'</code>。' }),
    S({ calls:9, starts:4, skips:8, ans:['oath','eat'], cleared:['oath','eat'], restored:[[2,3]], dimT:['ra','rai','rain'],
      panel:P(9, 2, 3, 'r', [cut('e'), cut('v'), cut('k'), oob], { done:'#9 (2,3) 鄰居沒有 \'a\' → return · 還原 (2,3)' }),
      line:'#9 迴圈:上 \'e\'、下 \'v\'、左 \'k\' 剪 · 右 (2,4) 出界 → return;board[2][3] = \'r\'',
      text:'<strong>#9 · 四個方向全剪</strong> · <code>e / v / k</code> 都不是 <code>"r"-&gt;child</code> → <b>rain 這條分支整條剪掉</b>(Trie 變淡)。return,還原 <code>(2,3)</code>。' }),
    S({ calls:9, starts:4, skips:12, ans:['oath','eat'], cleared:['oath','eat'], tnode:'', scan:[[3,0],[3,1],[3,2],[3,3]], dimT:['ra','rai','rain'],
      line:'SKIP (3,0) \'i\'、(3,1) \'f\'、(3,2) \'l\'、(3,3) \'v\':  root->child[x] == nullptr',
      text:'<strong>SKIP × 4</strong> · 最後一列 <code>i f l v</code> 全不在 <code>root</code> 底下 → 跳過。外層迴圈結束。' }),
    S({ calls:9, starts:4, skips:12, ans:['oath','eat'], cleared:['oath','eat'], final:true, dimT:['p','pe','pea','ra','rai','rain'],
      line:'return ans;   → ["oath", "eat"]   9 次 search · 4 個起點 · 12 個 SKIP · board 全部還原',
      text:'<strong>完成 · ["oath", "eat"]</strong> · 9 次 <code>search</code>、最深 4 層。<b>pea</b>:board 沒有 <code>\'p\'</code>,root 那層就進不去;<b>rain</b>:<code>\'r\'</code> 旁邊沒有 <code>\'a\'</code>。<b>一次 DFS 同時找所有字</b>,Trie 走不下去就剪掉;每條路回來都還原,board 跟一開始一樣。' }),
  ];

  function mount(prefix, steps) {
    const canvas = document.getElementById(prefix + '-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const stepEl = document.getElementById(prefix + '-step'), labelEl = document.getElementById(prefix + '-label');
    const bPrev = document.getElementById(prefix + '-prev'), bNext = document.getElementById(prefix + '-next'),
          bPlay = document.getElementById(prefix + '-play'), bReset = document.getElementById(prefix + '-reset');
    let step = 0, timer = null;

    function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
      const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||520; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
      if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
    function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
    function box(x,y,w,h,fill,stroke,lw,dash){ rr(x,y,w,h,5); ctx.fillStyle=fill; ctx.fill(); ctx.lineWidth=lw||1.4; if(dash) ctx.setLineDash(dash); ctx.strokeStyle=stroke; ctx.stroke(); ctx.setLineDash([]); }
    function txt(s,x,y,color,font,align,base){ ctx.fillStyle=color; ctx.font=font; ctx.textAlign=align||'center'; ctx.textBaseline=base||'middle'; ctx.fillText(s,x,y); }
    function head(s,x,y){ txt(s,x,y,C.dim,'600 12px '+MONO+', '+SANS,'left','alphabetic'); }
    function line(x1,y1,x2,y2,color,lw,dash){ ctx.strokeStyle=color; ctx.lineWidth=lw; if(dash) ctx.setLineDash(dash); ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); ctx.setLineDash([]); }
    function halo(s,x,y,color,font,bg,lw){ ctx.font=font; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.lineJoin='round';
      ctx.strokeStyle=bg; ctx.lineWidth=lw; ctx.strokeText(s,x,y); ctx.fillStyle=color; ctx.fillText(s,x,y); }
    const F = (wt, sz) => wt + ' ' + sz + 'px ' + MONO + ', ' + SANS;
    function fitTxt(s, x, y, color, wt, sz, maxW, align){ let f = sz; ctx.font = F(wt, f);
      while (f > 9.5 && ctx.measureText(s).width > maxW) { f -= 0.5; ctx.font = F(wt, f); }
      txt(s, x, y, color, F(wt, f), align); }
    const has = (arr, r, c) => !!arr && arr.some(p => p[0] === r && p[1] === c);
    const eq = (p, r, c) => !!p && p[0] === r && p[1] === c;

    function draw(){
      fit();
      const s = steps[step], w = canvas.clientWidth, H = canvas.clientHeight, PAD = 22;
      ctx.fillStyle = C.paper; ctx.fillRect(0,0,w,H); ctx.setLineDash([]);
      const X = px => px * w / 620;
      const pn = s.panel;

      /* ---- BAND 1 · board + Trie ---- */
      head('BAND 1 · board + Trie   紅 = 目前   米 + # = 路徑上   粉 = 剪掉   綠 = 還原 / 找到', PAD, 16);
      const cs = 50, cg = 6, gy = 58, gx = PAD + 24;
      const cx = c => gx + c*(cs + cg), cy = r => gy + r*(cs + cg);
      for (let c = 0; c < 4; c++) txt(String(c), cx(c) + cs/2, gy - 20, C.dim, F(600, 12));
      for (let r = 0; r < 4; r++) txt(String(r), gx - 12, cy(r) + cs/2 + 1, C.dim, F(600, 12), 'right');

      // 這一層四個方向的探測(從 panel 推出來)
      const probe = {}, edges = [];
      if (pn) pn.rows.forEach((row, d) => {
        if (row.k === 'w' || row.k === 'back') return;
        const nr = pn.r + DIRS[d][0], nc = pn.c + DIRS[d][1];
        if (row.k === 'oob') edges.push({ r:pn.r, c:pn.c, s:'TBLR'[d] });
        else probe[nr + ',' + nc] = row;
      });
      const wordCells = s.final ? OATH.concat(EAT) : [];
      const cells = [];
      for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
        const marked = has(s.marks, r, c), isCur = eq(s.cur, r, c), pr = probe[r + ',' + c];
        const scan = has(s.scan, r, c), rest = has(s.restored, r, c);
        let fill = C.paper, st = C.ink, lw = 1.4, dash = null, tc = C.ink, note = '', nc = C.dim;
        if (marked) { fill = C.low; tc = '#9a9a9a'; }
        if (pr && pr.k === 'cut' && !marked) { fill = C.bad; st = C.deep; lw = 2; tc = C.deep; note = '無 ' + pr.x; nc = C.deep; }
        if (pr && pr.k === 'hash') { st = C.dim; lw = 2.4; dash = [5,3]; note = '# 跳過'; nc = C.ink; }
        if (pr && pr.k === 'in') { st = C.curS; lw = 2.4; dash = [5,3]; tc = C.curT; note = '→ #' + pr.n; nc = C.curT; }
        if (scan) { fill = C.bad; st = C.deep; lw = 1.8; tc = C.deep; note = 'root 無 ' + B[r][c]; nc = C.deep; }
        if (rest) { fill = C.good; st = C.ink; lw = 2; dash = null; tc = C.ink; note = '還原'; nc = C.ink; }
        if (isCur) { fill = C.cur; st = C.curS; lw = 2.8; dash = null; tc = '#c9a0a0'; note = s.curNote || ''; nc = C.curT; }
        if (isCur && s.found) { fill = C.good; note = 'FOUND'; nc = C.ink; }
        if (has(wordCells, r, c)) { fill = C.good; st = C.ink; lw = 1.8; }
        cells.push({ r, c, fill, st, lw, dash, tc, note, nc, marked, isCur });
        box(cx(c), cy(r), cs, cs, fill, st, lw, dash);
      }
      const poly = (pts, color, alpha) => {
        ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
        ctx.beginPath(); pts.forEach((p, k) => { const x = cx(p[1]) + cs/2, y = cy(p[0]) + cs/2; k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke(); ctx.restore(); };
      if (s.path && s.path.length > 1) poly(s.path, s.found ? C.ink : C.curS, s.found ? 0.35 : 0.55);
      if (s.final) { poly(OATH, C.ink, 0.3); poly(EAT, C.ink, 0.3); }
      cells.forEach(o => {
        const x = cx(o.c), y = cy(o.r);
        halo(B[o.r][o.c], x + cs/2, y + 20, o.marked ? (o.isCur ? C.curT : '#8a8a8a') : o.tc, F(700, 18), o.fill, 5);
        if (o.note) { ctx.font = F(700, 10); let f = 10; while (f > 8 && ctx.measureText(o.note).width > cs - 6) { f -= 0.5; ctx.font = F(700, f); }
          halo(o.note, x + cs/2, y + 38, o.nc, F(700, f), o.fill, 4); }
        if (o.marked) { box(x + cs - 17, y + 4, 13, 14, o.isCur ? C.curS : C.deep, o.isCur ? C.curS : C.deep, 1); txt('#', x + cs - 10.5, y + 11.5, '#ffffff', F(700, 10)); }
      });
      edges.forEach(e => {
        const x = cx(e.c), y = cy(e.r), o = 1, t = e.s;
        const seg = t === 'T' ? [x+4, y-o, x+cs-4, y-o] : t === 'B' ? [x+4, y+cs+o, x+cs-4, y+cs+o]
                  : t === 'L' ? [x-o, y+4, x-o, y+cs-4] : [x+cs+o, y+4, x+cs+o, y+cs-4];
        line(seg[0], seg[1], seg[2], seg[3], C.deep, 4, [5,3]);
      });

      // Trie(右側)
      const bw = 4*cs + 3*cg, tx0 = gx + bw + Math.max(30, X(30)), tx1 = w - PAD, colW = (tx1 - tx0) / 4;
      const nw = 32, nh = 24, rw = 50, ty0 = 34, tstep = 38;
      const tX = n => n.col < 0 ? (tx0 + tx1) / 2 : tx0 + (n.col + 0.5) * colW;
      const tY = n => n.d === 0 ? ty0 : ty0 + nh + 36 + (n.d - 1) * tstep;
      const byId = {}; TN.forEach(n => byId[n.id] = n);
      const onPath = new Set(s.tnode != null ? TP(s.tnode) : []), dimS = new Set(s.dimT || []), clr = new Set(s.cleared || []);
      if (s.tnode != null) onPath.add('');
      TN.forEach(n => {                                   // 邊
        const p = TPAR(n.id); if (p == null) return; const q = byId[p];
        const hot = onPath.has(n.id) && onPath.has(p);
        const x1 = tX(q), y1 = tY(q) + nh, x2 = tX(n), y2 = tY(n);
        line(x1, y1, x2, y2, hot ? C.curS : (dimS.has(n.id) ? C.gray : C.off), hot ? 2.6 : 1.4);
      });
      TN.forEach(n => {                                   // 節點
        const x = tX(n), y = tY(n), ww = n.col < 0 ? rw : nw, isCur = s.tnode === n.id;
        let fill = C.paper, st = C.ink, lw = 1.4, tc = C.ink;
        if (dimS.has(n.id)) { fill = C.paper; st = C.off; tc = C.off; }
        if (onPath.has(n.id)) { fill = C.cur; st = C.curS; lw = 1.6; tc = C.curT; }
        if (isCur) { lw = 2.8; }
        if (isCur && s.found === n.id) { fill = C.good; }
        box(x - ww/2, y, ww, nh, fill, st, lw);
        if (n.word) { rr(x - ww/2 + 3, y + 3, ww - 6, nh - 6, 3); ctx.lineWidth = 1.1; ctx.strokeStyle = st; ctx.stroke(); }
        txt(n.ch, x, y + nh/2 + 1, tc, F(700, n.col < 0 ? 11 : 14));
        if (n.word) {                                     // ★ word 標籤
          const ty = y + nh + 6, tw = Math.min(colW - 12, 60), th = 16, isF = s.found === n.id;
          if (clr.has(n.id) && !isF) {
            box(x - tw/2, ty, tw, th, C.gray, C.dim, 1, [3,2]);
            fitTxt('已清空', x, ty + th/2 + 1, C.dim, 700, 10, tw - 6);
          } else if (isF) {
            box(x - tw/2, ty, tw, th, C.good, C.ink, 1.6);
            fitTxt('→ ans', x, ty + th/2 + 1, C.ink, 700, 10.5, tw - 6);
          } else {
            const dm = dimS.has(n.id);
            box(x - tw/2, ty, tw, th, C.paper, dm ? C.off : C.dim, 1);
            fitTxt('★' + n.word, x, ty + th/2 + 1, dm ? C.off : C.ink, 700, 10.5, tw - 6);
          }
        }
      });

      /* ---- BAND 2 · 四個方向 ---- */
      const b2 = 304;
      head('BAND 2 · 這一層的四個方向   紅 = 進去   粉 = Trie 沒這個字母   灰虛線 = 出界 / \'#\'', PAD, b2);
      const ptitle = pn ? (pn.done || ('#' + pn.no + ' search(' + pn.r + ',' + pn.c + ', "' + pn.nd + '") 的迴圈 · 上 → 下 → 左 → 右'))
                        : (s.scan ? '外層掃起點:root->child[x] == nullptr → 不呼叫 search' : (s.final ? '全部跑完 · board 已還原' : '方向順序:上 → 下 → 左 → 右'));
      fitTxt(ptitle, PAD, b2 + 20, pn ? (pn.done ? C.ink : C.curT) : C.dim, 700, 12, w - 2*PAD, 'left');
      const dy = b2 + 32, dh = 46, dg = 12, dw = (w - 2*PAD - 3*dg) / 4;
      for (let d = 0; d < 4; d++) {
        const x = PAD + d*(dw + dg), row = pn ? pn.rows[d] : null, isNow = pn && pn.now === d;
        let fill = C.paper, st = C.off, lw = 1.1, dash = [3,3], tc = C.off, t = '—', tgt = '';
        if (row) {
          tgt = '(' + n2(pn.r + DIRS[d][0]) + ',' + n2(pn.c + DIRS[d][1]) + ')';
          if (row.k === 'w') { tc = C.dim; t = '待試'; }
          else if (row.k === 'oob') { fill = C.gray; st = C.dim; lw = 1.3; dash = [4,3]; tc = C.dim; t = '出界 跳過'; }
          else if (row.k === 'hash') { fill = C.low; st = C.dim; lw = 1.3; dash = [4,3]; tc = C.ink; t = '\'#\' 跳過'; }
          else if (row.k === 'cut') { fill = C.bad; st = C.deep; lw = 1.4; dash = null; tc = C.deep; t = 'Trie 無 \'' + row.x + '\' 剪掉'; }
          else if (row.k === 'in') { fill = C.cur; st = C.curS; lw = 1.6; dash = null; tc = C.curT; t = '進去 #' + row.n; }
          else if (row.k === 'back') { fill = C.up; st = C.ink; lw = 1.4; dash = null; tc = C.ink; t = '#' + row.n + ' 回來 · 已還原'; }
          if (isNow) { lw = 2.8; dash = null; }
        }
        box(x, dy, dw, dh, fill, st, lw, dash);
        txt(DN[d], x + 10, dy + 15, row ? (isNow ? C.curT : C.ink) : C.off, '700 14px ' + SANS, 'left');
        txt(tgt, x + 32, dy + 15, row ? C.dim : C.off, F(600, 11.5), 'left');
        fitTxt(t, x + 10, dy + 33, tc, 700, 12, dw - 20, 'left');
      }

      /* ---- BAND 3 · ans + 計數 ---- */
      const b3 = 410;
      head('BAND 3 · ans(找到的順序)+ 計數   綠 = 已收進 ans', PAD, b3);
      const ay = b3 + 30, ah = 36, ax0 = PAD + 44, aw = 70, ag = 10;
      txt('ans', PAD, ay + ah/2 + 1, C.ink, '700 13px ' + MONO, 'left');
      for (let k = 0; k < 2; k++) {
        const x = ax0 + k*(aw + ag), v = s.ans[k], isNew = v && s.found === v;
        txt('[' + k + ']', x + aw/2, b3 + 20, C.dim, F(600, 11));
        if (v) { box(x, ay, aw, ah, C.good, isNew ? C.curS : C.ink, isNew ? 2.6 : 1.6); fitTxt('"' + v + '"', x + aw/2, ay + ah/2 + 1, C.ink, 700, 13, aw - 10); }
        else { box(x, ay, aw, ah, C.paper, C.off, 1.1, [3,3]); txt('—', x + aw/2, ay + ah/2 + 1, C.off, F(600, 12)); }
      }
      const kx0 = ax0 + 2*aw + ag + Math.max(28, X(28)), kg = 12, kw = (w - PAD - kx0 - 2*kg) / 3;
      const cnt = [['search 呼叫', s.calls, TOTAL], ['起點 START', s.starts, NSTART], ['SKIP', s.skips, NSKIP]];
      cnt.forEach((q, k) => {
        const x = kx0 + k*(kw + kg);
        txt(q[0], x + kw/2, b3 + 20, C.dim, F(600, 11));
        const full = q[1] === q[2];
        box(x, ay, kw, ah, s.final && full ? C.good : C.paper, C.ink, 1.4);
        fitTxt(q[1] + ' / ' + q[2], x + kw/2, ay + ah/2 + 1, C.ink, 700, 15, kw - 14);
      });

      /* ---- BAND 4 · 這一步 ---- */
      const b4 = 504;
      head('BAND 4 · 這一步', PAD, b4);
      const ly = b4 + 12, lh = 32;
      const fin = s.final;
      box(PAD, ly, w - 2*PAD, lh, fin ? C.good : C.paper, fin ? C.ink : C.off, fin ? 1.8 : 1.4);
      fitTxt(s.line, PAD + 14, ly + lh/2 + 1, C.ink, 700, 12.5, w - 2*PAD - 28, 'left');
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
  }

  mount('v212', STEPS);
})();
