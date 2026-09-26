/* ============================================================
   P230 · Kth Smallest Element in a BST · viz
     int ans, rank;
     int kthSmallest(TreeNode* root, int k) { rank = k; inorder(root); return ans; }
     void inorder(TreeNode* root) {
       if (!root || rank <= 0) return;
       inorder(root->left);
       if (--rank == 0) ans = root->val;
       inorder(root->right);
     }
   動畫要傳達的三件事:
     ① BST 的中序 = 由小到大,所以第 k 個被 visit 的就是答案
     ② rank 每 visit 一次減 1,減到 0 的那個節點就是 ans
     ③ 提早結束只在「進入函式時」檢查 → 回到 5 時仍多做了一次 visit
   例 root=[5,3,6,2,4,null,null,1], k=3 → 3
     BAND 1  BST(x 對齊中序位置)+ 呼叫堆疊路徑
     BAND 2  中序序列 k=1..6
     BAND 3  rank / ans / calls / visits + 正在執行的那一行
   呼叫序列取自實測 trace(9 calls, 4 visits),未手推;nullptr 呼叫併入相鄰步驟。
   ============================================================ */
(function () {
  const canvas = document.getElementById('viz-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('viz-step'), labelEl = document.getElementById('viz-label');
  const bPrev = document.getElementById('viz-prev'), bNext = document.getElementById('viz-next'),
        bPlay = document.getElementById('viz-play'), bReset = document.getElementById('viz-reset');

  const C = { paper:'#ffffff', ink:'#1f3550', dim:'#9a9a9a', grid:'#cfcfcf',
    left:'#e3edf5', right:'#f6ead8',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424', deep:'#a31d1d' };
  const MONO = '"JetBrains Mono", monospace', SANS = '"Noto Sans TC", sans-serif';

  /* 樹:slot = 中序位置(0..5,與下方格子對齊),d = 深度 */
  const NODE = { 1:{slot:0,d:3}, 2:{slot:1,d:2}, 3:{slot:2,d:1}, 4:{slot:3,d:2}, 5:{slot:4,d:0}, 6:{slot:5,d:1} };
  const PARENT = { 3:5, 6:5, 2:3, 4:3, 1:2 };
  const VALS = [1, 2, 3, 4, 5, 6];
  /* nullptr 呼叫的小 ∅:[父節點, dx 方向] */
  const GHOST = { n1L:[1,-1], n1R:[1,1], n2R:[2,1] };

  /* 每一步的完整狀態(不累推,直接寫死)
     stack: 呼叫堆疊(根→目前);ck: 目前節點的樣式 'cur' | 'wasted' | 'ret'
     vis: 依 visit 順序;ret: 提早 return 的節點;mark: 中序格子下方的標記 */
  const S = (o) => o;
  const steps = [
    S({ stack:[], ck:null, vis:[], ret:[], ghost:[], rank:3, from:null, ans:null, calls:0, visits:0,
      code:'rank = k;  inorder(root);', note:'rank = 3',
      text:'<strong>INITIAL</strong> · BST 的<b>中序走訪 = 由小到大</b>。把 <code>rank</code> 設成 <code>k = 3</code>,<strong>每 visit 一個節點就減 1,減到 0 的那個就是第 3 小。</strong>' }),

    S({ stack:[5], ck:'cur', vis:[], ret:[], ghost:[], rank:3, from:null, ans:null, calls:1, visits:0,
      code:'inorder(root->left);', note:'rank 3 > 0 → 往左',
      text:'<strong>進入 5</strong> · <code>rank = 3 &gt; 0</code>,不 return。<b>中序先走左子樹</b>,5 自己要等左邊整棵做完。' }),

    S({ stack:[5,3], ck:'cur', vis:[], ret:[], ghost:[], rank:3, from:null, ans:null, calls:2, visits:0,
      code:'inorder(root->left);', note:'繼續往左',
      text:'<strong>進入 3</strong> · 一樣先往左。<b>最小值一定在「一路往左走到底」的地方。</b>' }),

    S({ stack:[5,3,2], ck:'cur', vis:[], ret:[], ghost:[], rank:3, from:null, ans:null, calls:3, visits:0,
      code:'inorder(root->left);', note:'繼續往左',
      text:'<strong>進入 2</strong> · 堆疊深度 3,還沒有任何節點被 visit,<code>rank</code> 仍是 3。' }),

    S({ stack:[5,3,2,1], ck:'cur', vis:[1], ret:[], ghost:['n1L'], rank:2, from:3, ans:null, calls:5, visits:1,
      code:'if (--rank == 0) ans = root->val;', note:'2 ≠ 0',
      mark:{ i:0, t:'rank 3→2', c:C.curS },
      text:'<strong>進入 1 → visit 1</strong> · 左邊是 <code>nullptr</code>(第 5 次呼叫)直接 return。<b>1 是第 1 小</b>:<code>--rank</code> 得 2,不是 0,繼續。' }),

    S({ stack:[5,3,2], ck:'cur', vis:[1,2], ret:[], ghost:['n1R','n2R'], rank:1, from:2, ans:null, calls:7, visits:2,
      code:'if (--rank == 0) ans = root->val;', note:'1 ≠ 0',
      mark:{ i:1, t:'rank 2→1', c:C.curS },
      text:'<strong>visit 2</strong> · 1 的右邊 <code>nullptr</code> 回來後,回到 2。<b>2 是第 2 小</b>:<code>rank</code> 2→1。2 的右邊也是 <code>nullptr</code>。共 7 次呼叫。' }),

    S({ stack:[5,3], ck:'cur', vis:[1,2,3], ret:[], ghost:[], rank:0, from:1, ans:3, calls:7, visits:3, found:true,
      code:'if (--rank == 0) ans = root->val;', note:'0 == 0 → ans = 3',
      mark:{ i:2, t:'ans = 3', c:C.curS },
      text:'<strong>visit 3 · 找到了</strong> · <code>rank</code> 1→0,<b><code>ans = 3</code></b>。<strong>答案已確定,但函式沒有 return —— 接著照樣呼叫 <code>inorder(3-&gt;right)</code>。</strong>' }),

    S({ stack:[5,3,4], ck:'ret', vis:[1,2,3], ret:[4], ghost:[], rank:0, from:null, ans:3, calls:8, visits:3,
      code:'if (!root || rank <= 0) return;', note:'rank 0 ≤ 0',
      text:'<strong>進入 4 → 提早 return</strong> · 入口檢查 <code>rank &lt;= 0</code> 成立,<b>4 什麼都沒做就回去</b>。這次呼叫本身已經是浪費(第 8 次)。' }),

    S({ stack:[5], ck:'wasted', vis:[1,2,3,5], ret:[4], ghost:[], rank:-1, from:0, ans:3, calls:8, visits:4,
      code:'if (--rank == 0) ans = root->val;', note:'−1 ≠ 0 · ans 不變',
      mark:{ i:4, t:'rank 0→−1', c:C.deep },
      text:'<strong>回到 5 · 多餘的 visit</strong> · 5 在第 1 步就通過了入口檢查,<b>左邊回來後不會再檢查 <code>rank</code></b>,於是照樣 <code>--rank</code> 變成 −1。<strong>−1 ≠ 0,<code>ans</code> 沒被覆蓋,答案仍正確 —— 但白做了一次。</strong>' }),

    S({ stack:[5,6], ck:'ret', vis:[1,2,3,5], ret:[4,6], ghost:[], rank:-1, from:null, ans:3, calls:9, visits:4,
      code:'if (!root || rank <= 0) return;', note:'rank −1 ≤ 0',
      text:'<strong>進入 6 → 提早 return</strong> · <code>rank = −1 &lt;= 0</code>,第 9 次呼叫直接回去。' }),

    S({ stack:[], ck:null, vis:[1,2,3,5], ret:[4,6], ghost:[], rank:-1, from:null, ans:3, calls:9, visits:4, done:true,
      code:'return ans;', note:'OUTPUT 3',
      text:'<strong>完成</strong> · 回到 <code>kthSmallest</code>,<b>回傳 <code>ans = 3</code></b>。總共 <b>9 次呼叫、4 次 visit</b> —— 其中呼叫 4、visit 5、呼叫 6 都發生在答案確定之後。' }),

    S({ stack:[], ck:null, vis:[1,2,3,5], ret:[4,6], ghost:[], rank:-1, from:null, ans:3, calls:9, visits:4, done:true, summary:true,
      code:'inorder(root->left);  if (rank <= 0) return;', note:'修正',
      text:'<strong>修正版</strong> · 左邊回來後<b>再檢查一次 <code>rank &lt;= 0</code></b>,並在找到時<b>立刻 return</b>。這樣<strong>呼叫 4、visit 5、呼叫 6 全部省掉:9 calls / 4 visits → 7 calls / 3 visits</strong>。時間 O(h + k)。' }),
  ];

  let step = 0, timer = null;

  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||510; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function txt(s, x, y, font, color, align, base){ ctx.font=font; ctx.fillStyle=color; ctx.textAlign=align||'left'; ctx.textBaseline=base||'alphabetic'; ctx.fillText(s, x, y); }
  function pill(s, cx, cy, fg, bg, bd){
    ctx.font = '700 10px ' + MONO; const pw = ctx.measureText(s).width + 10;
    rr(cx - pw/2, cy - 7, pw, 14, 7); ctx.fillStyle = bg; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = bd; ctx.stroke();
    txt(s, cx, cy + 0.5, '700 10px ' + MONO, fg, 'center', 'middle');
  }

  /* 版面(邏輯座標,寬度隨容器,高度固定 510) */
  const PAD = 28, TAG_W = 88, CELL_H = 36, GAP = 10;
  const T0 = 64, T_DY = 54, R = 19;            // 樹:根的圓心 y;深度 3 的圓心 y = 226
  const B2 = 280, B2_CELL = B2 + 30;           // 中序格子頂 = 310
  const B3 = 394, B3_H = 100;                  // 狀態框 394..494

  function cellGeom(w){
    const x0 = PAD + TAG_W;
    const cw = Math.min(104, ((w - PAD) - x0 - GAP * 5) / 6);
    const total = cw * 6 + GAP * 5;
    const sx = x0 + (((w - PAD) - x0) - total) / 2;
    return { cw, cx: i => sx + i * (cw + GAP) };
  }
  const ORD = ['1st', '2nd', '3rd', '4th'];

  function draw(){
    fit();
    const s = steps[step], w = canvas.clientWidth, h = canvas.clientHeight;
    ctx.fillStyle = C.paper; ctx.fillRect(0, 0, w, h); ctx.setLineDash([]);
    const g = cellGeom(w);
    const nx = v => g.cx(NODE[v].slot) + g.cw/2, ny = v => T0 + NODE[v].d * T_DY;
    const cur = s.stack.length ? s.stack[s.stack.length - 1] : null;

    /* ---- 圖例 ---- */
    const legend = [[C.cur, C.curS, '紅 = 目前節點'], [C.left, C.ink, '藍 = 已 visit'],
                    [C.deep, C.deep, '深紅 = 多餘的 visit'], [C.paper, C.grid, '灰 = 提早 return']];
    let lx = PAD;
    legend.forEach(([bg, bd, t]) => {
      rr(lx, 7, 12, 12, 2); ctx.fillStyle = bg; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = bd; ctx.stroke();
      txt(t, lx + 18, 13.5, '600 11.5px ' + SANS, C.ink, 'left', 'middle');
      lx += 18 + ctx.measureText(t).width + 18;
    });
    ctx.font = '700 11.5px ' + MONO;
    const stTxt = 'STEP ' + step + ' / ' + (steps.length - 1);
    if (lx + ctx.measureText(stTxt).width < w - PAD) txt(stTxt, w - PAD, 13.5, '700 11.5px ' + MONO, C.dim, 'right', 'middle');

    /* ---- BAND 1 · BST ---- */
    const tagX = PAD + (TAG_W - 12) / 2;
    txt('BST', tagX, T0 + 1.5 * T_DY - 9, '700 13px ' + MONO, C.ink, 'center', 'middle');
    txt('k = 3', tagX, T0 + 1.5 * T_DY + 11, '700 12px ' + MONO, C.curS, 'center', 'middle');

    // 邊:呼叫堆疊上的邊畫粗紅
    const onPath = v => { const i = s.stack.indexOf(v); return i > 0 && s.stack[i - 1] === PARENT[v]; };
    Object.keys(PARENT).forEach(k => {
      const v = +k, p = PARENT[v], hot = onPath(v);
      const dx = nx(v) - nx(p), dy = ny(v) - ny(p), d = Math.hypot(dx, dy);
      ctx.strokeStyle = hot ? C.curS : C.ink; ctx.lineWidth = hot ? 3.2 : 1.5;
      ctx.beginPath(); ctx.moveTo(nx(p) + dx/d*R, ny(p) + dy/d*R); ctx.lineTo(nx(v) - dx/d*R, ny(v) - dy/d*R); ctx.stroke();
    });
    // nullptr 呼叫
    s.ghost.forEach(k => {
      const [p, dir] = GHOST[k];
      const ex = nx(p) + dir * 26, ey = ny(p) + 40;
      const dx = ex - nx(p), dy = ey - ny(p), d = Math.hypot(dx, dy);
      ctx.strokeStyle = C.curS; ctx.lineWidth = 1.4; ctx.setLineDash([4,3]);
      ctx.beginPath(); ctx.moveTo(nx(p) + dx/d*R, ny(p) + dy/d*R); ctx.lineTo(ex - dx/d*8, ey - dy/d*8); ctx.stroke();
      ctx.setLineDash([]);
      txt('∅', ex, ey + 1, '700 14px ' + MONO, C.curS, 'center', 'middle');
    });
    // 節點
    VALS.forEach(v => {
      const x = nx(v), y = ny(v);
      const visIdx = s.vis.indexOf(v), isCur = v === cur;
      const isAns = v === 3 && s.ans === 3, isWaste = v === 5 && visIdx >= 0, isRet = s.ret.includes(v);
      let bg = C.paper, bd = C.ink, tc = C.ink, lw = 1.6;
      if (visIdx >= 0) bg = C.left;
      if (isAns) { bg = C.cur; bd = C.curS; tc = C.curT; lw = 3.4; }
      if (isWaste) { bg = C.paper; bd = C.deep; tc = C.deep; lw = 2.6; }
      if (isRet) { bg = C.paper; bd = C.grid; tc = C.dim; lw = 1.4; }
      if (isCur) {
        if (s.ck === 'wasted') { bg = C.deep; bd = C.deep; tc = '#ffffff'; lw = 2.6; }
        else if (!isAns) { bg = C.cur; bd = C.curS; tc = C.curT; lw = 2.6; }
      }
      ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI*2);
      ctx.fillStyle = bg; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = bd; ctx.stroke();
      if (isAns) { ctx.beginPath(); ctx.arc(x, y, R + 4, 0, Math.PI*2); ctx.lineWidth = 1.2; ctx.strokeStyle = C.curS; ctx.stroke(); }
      txt(String(v), x, y + 1, '700 14px ' + MONO, tc, 'center', 'middle');
      // visit 順序徽章(左上)
      if (visIdx >= 0) {
        const wasted = v === 5;
        pill(ORD[visIdx], x - R - 20, y - R + 2, wasted ? '#ffffff' : C.ink, wasted ? C.deep : C.left, wasted ? C.deep : C.ink);
      }
      // 下方標籤
      if (isAns) pill('= ans', x, y + R + 16, C.curT, C.cur, C.curS);
      else if (isRet) pill('return', x, y + R + 16, isCur ? C.curT : C.dim, C.paper, isCur ? C.curS : C.grid);
      // 修正版會省掉的:虛線外框
      if (s.summary && (isRet || isWaste)) {
        ctx.setLineDash([3,3]); ctx.beginPath(); ctx.arc(x, y, R + 5, 0, Math.PI*2);
        ctx.lineWidth = 1.3; ctx.strokeStyle = C.ink; ctx.stroke(); ctx.setLineDash([]);
      }
    });
    if (s.summary) txt('虛線圈 = 修正版會省掉的工作', w - PAD, ny(1), '600 11.5px ' + SANS, C.ink, 'right', 'middle');

    /* ---- BAND 2 · 中序序列 ---- */
    txt('inorder', tagX, B2_CELL + CELL_H/2, '700 13px ' + MONO, C.ink, 'center', 'middle');
    VALS.forEach((v, i) => {
      const x = g.cx(i), visIdx = s.vis.indexOf(v);
      txt('k=' + (i + 1), x + g.cw/2, B2_CELL - 12, (i === 2 ? '700' : '600') + ' 11px ' + MONO, i === 2 ? C.curS : C.dim, 'center', 'bottom');
      let bg = C.paper, bd = C.grid, tc = C.dim, lw = 1.2, show = String(v);
      if (visIdx >= 0) { bg = C.left; bd = C.ink; tc = C.ink; lw = 1.4; }
      if (v === 3 && s.ans === 3) { bg = C.cur; bd = C.curS; tc = C.curT; lw = 2.4; }
      if (v === 5 && visIdx >= 0) { bg = C.paper; bd = C.deep; tc = C.deep; lw = 2.2; }
      if (visIdx < 0) show = '';
      rr(x, B2_CELL, g.cw, CELL_H, 5);
      ctx.fillStyle = bg; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = bd; ctx.stroke();
      if (show) txt(show, x + g.cw/2, B2_CELL + CELL_H/2 + 1, '700 14px ' + MONO, tc, 'center', 'middle');
      else txt('·', x + g.cw/2, B2_CELL + CELL_H/2 + 1, '700 14px ' + MONO, C.grid, 'center', 'middle');
    });
    if (s.mark) {
      const mx = g.cx(s.mark.i) + g.cw/2, my = B2_CELL + CELL_H + 6;
      ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(mx - 5, my + 8); ctx.lineTo(mx + 5, my + 8); ctx.closePath();
      ctx.fillStyle = s.mark.c; ctx.fill();
      txt(s.mark.t, mx, my + 12, '700 11px ' + MONO, s.mark.c, 'center', 'top');
    } else if (s.ret.length && s.stack.length && s.ck === 'ret') {
      txt('return 的呼叫不會 visit,序列不變', g.cx(0), B2_CELL + CELL_H + 16, '600 11.5px ' + SANS, C.dim, 'left', 'top');
    }

    /* ---- BAND 3 · 狀態 ---- */
    const hot = s.found || s.done, waste = s.ck === 'wasted';
    rr(PAD, B3, w - 2*PAD, B3_H, 6);
    ctx.fillStyle = hot ? C.cur : C.paper; ctx.fill();
    ctx.lineWidth = 1.5; ctx.strokeStyle = waste ? C.deep : hot ? C.curS : C.grid; ctx.stroke();
    const X = PAD + 16, rowY = B3 + 32;
    if (!s.summary) {
      // rank(大字)
      txt('rank', X, rowY, '600 12px ' + MONO, C.dim, 'left', 'middle');
      const rkCol = waste ? C.deep : s.rank === 0 ? C.curS : C.ink;
      const rs = String(s.rank).replace('-', '−');
      txt(rs, X + 44, rowY + 1, '700 28px ' + MONO, rkCol, 'left', 'middle');
      ctx.font = '700 28px ' + MONO; let ax = X + 44 + ctx.measureText(rs).width + 10;
      if (s.from !== null) {
        const fs = '(' + s.from + ' → ' + rs + ')';
        txt(fs, ax, rowY + 2, '600 12px ' + MONO, rkCol, 'left', 'middle');
        ctx.font = '600 12px ' + MONO; ax += ctx.measureText(fs).width;
      }
      // ans
      const ansX = Math.max(ax + 24, X + 200);
      txt('ans', ansX, rowY, '600 12px ' + MONO, C.dim, 'left', 'middle');
      txt(s.ans === null ? '—' : String(s.ans), ansX + 34, rowY + 1, '700 22px ' + MONO, s.ans === null ? C.dim : C.curS, 'left', 'middle');
      // 計數
      txt('calls = ' + s.calls, w - PAD - 16, rowY - 9, '700 12px ' + MONO, C.ink, 'right', 'middle');
      txt('visits = ' + s.visits, w - PAD - 16, rowY + 10, '700 12px ' + MONO, waste ? C.deep : C.ink, 'right', 'middle');
    } else {
      const half = (w - 2*PAD) / 2;
      txt('原版', X, rowY - 9, '600 11.5px ' + SANS, C.dim, 'left', 'middle');
      txt('9 calls · 4 visits', X, rowY + 10, '700 15px ' + MONO, C.ink, 'left', 'middle');
      txt('修正後', PAD + half, rowY - 9, '600 11.5px ' + SANS, C.curT, 'left', 'middle');
      txt('7 calls · 3 visits', PAD + half, rowY + 10, '700 15px ' + MONO, C.curS, 'left', 'middle');
    }
    // 目前執行的那一行
    const cy = B3 + 58;
    ctx.strokeStyle = C.grid; ctx.lineWidth = 1; ctx.setLineDash([3,3]);
    ctx.beginPath(); ctx.moveTo(PAD + 12, cy); ctx.lineTo(w - PAD - 12, cy); ctx.stroke(); ctx.setLineDash([]);
    const codeY = B3 + 79;
    txt('▶', X, codeY, '700 11px ' + MONO, waste ? C.deep : C.curS, 'left', 'middle');
    txt(s.code, X + 18, codeY, '700 12.5px ' + MONO, C.ink, 'left', 'middle');
    ctx.font = '700 12.5px ' + MONO; const codeEnd = X + 18 + ctx.measureText(s.code).width;
    ctx.font = '600 12px ' + SANS; const nw = ctx.measureText(s.note).width;
    if (codeEnd + 20 + nw < w - PAD - 16)
      txt(s.note, w - PAD - 16, codeY, '600 12px ' + SANS, waste ? C.deep : hot ? C.curT : C.dim, 'right', 'middle');
  }

  function update(){ if(stepEl) stepEl.textContent=String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0'); if(labelEl) labelEl.innerHTML=steps[step].text; draw(); }
  function next(){ if(step<steps.length-1){step++;update();}else stop(); }
  function prev(){ if(step>0){step--;update();} }
  function reset(){ stop(); step=0; update(); }
  function play(){ if(timer){stop();return;} bPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){stop();return;} next(); },2100); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} if(bPlay) bPlay.textContent='Play'; }
  bPrev&&bPrev.addEventListener('click',prev); bNext&&bNext.addEventListener('click',next); bPlay&&bPlay.addEventListener('click',play); bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();}); if(window.ResizeObserver){ new ResizeObserver(()=>{fit();draw();}).observe(canvas); }
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw); fit(); update();
})();
