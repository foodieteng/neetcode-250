/* ============================================================
   P105 · Construct Binary Tree from Preorder and Inorder Traversal · viz
     TreeNode* build(pre, in, int preL, int inL, int inR, idx) {
       if (inL > inR) return nullptr;
       int rootV = pre[preL];
       int rootIdx = idx[rootV];
       int leftSize = rootIdx - inL;
       TreeNode* node = new TreeNode(rootV);
       node->left  = build(pre, in, preL + 1,            inL,         rootIdx - 1, idx);
       node->right = build(pre, in, preL + leftSize + 1, rootIdx + 1, inR,         idx);
       return node;
     }
   動畫要傳達的三件事:
     ① preorder[preL] 永遠是這段的 root
     ② 在 inorder 找到 root 的位置 → 左邊 leftSize 個是左子樹、右邊是右子樹
     ③ 同樣的 leftSize 把 preorder 切成「root | 左 leftSize 個 | 右」
   例 preorder=[3,9,20,15,7] inorder=[9,3,15,20,7] → [3,9,20,null,null,15,7]
     BAND 1  preorder 陣列 + preL 指標
     BAND 2  inorder 陣列 + [inL, inR] 區間
     BAND 3  算式:rootIdx / leftSize / 兩個子呼叫
     BAND 4  目前建好的樹
   呼叫序列取自實測 trace,未手推;兩個 nullptr 呼叫合併為一步。
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
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424' };
  const MONO = '"JetBrains Mono", monospace', SANS = '"Noto Sans TC", sans-serif';

  const PRE = [3, 9, 20, 15, 7];
  const INO = [9, 3, 15, 20, 7];

  /* 樹的位置:[x 比例, 深度];key = 節點值;nullptr 以 'n:' 前綴 */
  const POS = {
    3:[0.5,0], 9:[0.25,1], 20:[0.75,1], 15:[0.625,2], 7:[0.875,2],
    'n9L':[0.125,2], 'n9R':[0.375,2],
    'n15L':[0.5625,3], 'n15R':[0.6875,3], 'n7L':[0.8125,3], 'n7R':[0.9375,3] };
  const PARENT = { 9:3, 20:3, 15:20, 7:20, n9L:9, n9R:9, n15L:15, n15R:15, n7L:7, n7R:7 };

  /* kind: 'intro' | 'call' | 'null' | 'done'
     call : { preL, inL, inR, rootV, rootIdx, leftSize }
     nulls: [{preL,inL,inR}, {preL,inL,inR}]  (kind 'null')
     built: 已建立的節點;cur: 目前節點(紅);ghost: 這一步回傳 nullptr 的位置 */
  const call = (preL, inL, inR, rootV, rootIdx, leftSize) => ({ preL, inL, inR, rootV, rootIdx, leftSize });
  const S = (o) => o;

  const steps = [
    S({ kind:'intro', built:[], cur:null, ghost:[],
      text:'<strong>INITIAL</strong> · 先把 <code>inorder</code> 建成雜湊表 <code>idx[值] = 位置</code>:<b>9→0, 3→1, 15→2, 20→3, 7→4</b>。<strong>之後每次要在 inorder 找 root,都是 O(1) 查表</strong>,不用線性掃。' }),

    S({ kind:'call', c:call(0,0,4,3,1,1), built:[3], cur:3, ghost:[], depth:0,
      text:'<strong>build(preL=0, [0,4])</strong> · <b><code>preorder[0] = 3</code> 就是整棵樹的 root</b>。查表 <code>idx[3] = 1</code> → inorder 裡 3 的左邊有 <b>1 個</b>(左子樹),右邊 3 個(右子樹)。<strong>同一個 leftSize = 1 把 preorder 也切開:3 後面 1 格是左、剩下是右。</strong>' }),

    S({ kind:'call', c:call(1,0,0,9,0,0), built:[3,9], cur:9, ghost:[], depth:1,
      text:'<strong>build(preL=1, [0,0])</strong> · 左子樹只剩一格。<b><code>preorder[1] = 9</code> 是 root</b>,<code>idx[9] = 0</code>,<b>leftSize = 0 − 0 = 0</b> —— <strong>左右兩邊都是空區間。</strong>' }),

    S({ kind:'null', nulls:[{preL:2,inL:0,inR:-1},{preL:2,inL:1,inR:0}], built:[3,9], cur:null, ghost:['n9L','n9R'], parent:9, depth:2,
      text:'<strong>兩個 nullptr</strong> · <code>build(2,[0,−1])</code> 與 <code>build(2,[1,0])</code> 都是 <b><code>inL &gt; inR</code></b> → 直接回傳 <code>nullptr</code>。<strong>9 是葉子,完成。</strong>回到 3,開始建右子樹。' }),

    S({ kind:'call', c:call(2,2,4,20,3,1), built:[3,9,20], cur:20, ghost:[], depth:1,
      text:'<strong>build(preL=2, [2,4])</strong> · <b><code>preorder[2] = 20</code> 是右子樹的 root</b>,<code>idx[20] = 3</code>,<b>leftSize = 3 − 2 = 1</b>。<strong>inorder 的 15 在左、7 在右;preorder 也是 20 後面 1 格(15)是左、7 是右。</strong>' }),

    S({ kind:'call', c:call(3,2,2,15,2,0), built:[3,9,20,15], cur:15, ghost:[], depth:2,
      text:'<strong>build(preL=3, [2,2])</strong> · <b><code>preorder[3] = 15</code></b>,<code>idx[15] = 2</code>,<b>leftSize = 0</b>。<strong>區間只有自己 → 葉子。</strong>' }),

    S({ kind:'null', nulls:[{preL:4,inL:2,inR:1},{preL:4,inL:3,inR:2}], built:[3,9,20,15], cur:null, ghost:['n15L','n15R'], parent:15, depth:3,
      text:'<strong>兩個 nullptr</strong> · <code>build(4,[2,1])</code> 與 <code>build(4,[3,2])</code> 都是 <b>空區間</b> → <code>nullptr</code>。<strong>15 完成</strong>,回到 20 建右子樹。' }),

    S({ kind:'call', c:call(4,4,4,7,4,0), built:[3,9,20,15,7], cur:7, ghost:[], depth:2,
      text:'<strong>build(preL=4, [4,4])</strong> · <b><code>preorder[4] = 7</code></b>,<code>idx[7] = 4</code>,<b>leftSize = 0</b>。<strong>最後一個節點,也是葉子。</strong>' }),

    S({ kind:'null', nulls:[{preL:5,inL:4,inR:3},{preL:5,inL:5,inR:4}], built:[3,9,20,15,7], cur:null, ghost:['n7L','n7R'], parent:7, depth:3,
      text:'<strong>兩個 nullptr</strong> · <code>build(5,[4,3])</code> 與 <code>build(5,[5,4])</code>。<b>注意 preL = 5 已經超出陣列</b> —— <strong>但 <code>inL &gt; inR</code> 先擋下,<code>preorder[5]</code> 從來不會被讀。</strong>' }),

    S({ kind:'done', built:[3,9,20,15,7], cur:null, ghost:[],
      text:'<strong>完成</strong> · 一路回傳到最上層,得到 <b><code>[3,9,20,null,null,15,7]</code></b>。<strong>每個節點只被建立一次、每次查表 O(1) → 總共 O(n)。</strong>共 11 次呼叫:5 次建節點、6 次 <code>nullptr</code>。' }),
  ];

  let step = 0, timer = null;

  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||540; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function txt(s, x, y, font, color, align, base){ ctx.font=font; ctx.fillStyle=color; ctx.textAlign=align||'left'; ctx.textBaseline=base||'alphabetic'; ctx.fillText(s, x, y); }

  /* 版面(邏輯座標,寬度隨容器,高度固定) */
  const PAD = 28, TAG_W = 88, CELL_H = 36, GAP = 10;
  const B1 = 34, B1_CELL = B1 + 30;            // preorder 格子頂 = 64
  const B2 = 150, B2_CELL = B2 + 30;           // inorder  格子頂 = 180
  const B3 = 262, B3_H = 58;                   // 算式框
  const T0 = 358, T_DY = 56, R = 18;           // 樹:根的圓心 y

  function cellGeom(w){
    const x0 = PAD + TAG_W;
    const cw = Math.min(120, ((w - PAD) - x0 - GAP * 4) / 5);
    const total = cw * 5 + GAP * 4;
    const sx = x0 + (((w - PAD) - x0) - total) / 2;
    return { cw, cx: i => sx + i * (cw + GAP) };
  }

  /* 某一格的狀態 → [底色, 邊框, 文字色, 線寬] */
  const WHITE = () => [C.paper, C.ink, C.ink, 1.4];
  const RED   = () => [C.cur, C.curS, C.curT, 2.4];
  const LEFT  = () => [C.left, C.ink, C.ink, 1.4];
  const RIGHT = () => [C.right, C.ink, C.ink, 1.4];
  const OFF   = () => [C.paper, C.grid, C.dim, 1.2];

  function preStyle(s, i){
    if (s.kind === 'intro' || s.kind === 'done') return WHITE();
    if (s.kind === 'null') return OFF();
    const c = s.c, size = c.inR - c.inL + 1;
    if (i === c.preL) return RED();
    if (i >= c.preL + 1 && i <= c.preL + c.leftSize) return LEFT();
    if (i >= c.preL + c.leftSize + 1 && i <= c.preL + size - 1) return RIGHT();
    return OFF();
  }
  function inStyle(s, i){
    if (s.kind === 'intro' || s.kind === 'done') return WHITE();
    if (s.kind === 'null') return OFF();
    const c = s.c;
    if (i === c.rootIdx) return RED();
    if (i >= c.inL && i <= c.rootIdx - 1) return LEFT();
    if (i >= c.rootIdx + 1 && i <= c.inR) return RIGHT();
    return OFF();
  }

  function drawRow(tag, arr, top, styleFn, s, g, heads){
    // 列標籤:左邊界、與格子垂直置中
    txt(tag, PAD, top + CELL_H/2, '700 13px ' + MONO, C.ink, 'left', 'middle');
    arr.forEach((v, i) => {
      const x = g.cx(i);
      // 索引欄頭:底部在格子頂上方 12px
      txt(heads ? heads[i] : String(i), x + g.cw/2, top - 12, '600 11px ' + MONO, C.dim, 'center', 'bottom');
      const [bg, bd, tc, lw] = styleFn(s, i);
      rr(x, top, g.cw, CELL_H, 5);
      ctx.fillStyle = bg; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = bd; ctx.stroke();
      txt(String(v), x + g.cw/2, top + CELL_H/2 + 1, '700 14px ' + MONO, tc, 'center', 'middle');
    });
  }

  function marker(x, yTop, label, color){
    ctx.beginPath(); ctx.moveTo(x, yTop); ctx.lineTo(x - 5, yTop + 8); ctx.lineTo(x + 5, yTop + 8); ctx.closePath();
    ctx.fillStyle = color; ctx.fill();
    txt(label, x, yTop + 12, '700 11px ' + MONO, color, 'center', 'top');
  }

  function draw(){
    fit();
    const s = steps[step], w = canvas.clientWidth, h = canvas.clientHeight;
    ctx.fillStyle = C.paper; ctx.fillRect(0, 0, w, h); ctx.setLineDash([]);
    const g = cellGeom(w);

    /* ---- 圖例 ---- */
    const legend = [[C.cur, C.curS, '紅 = 目前 root'], [C.left, C.ink, '左子樹'], [C.right, C.ink, '右子樹'], [C.paper, C.grid, '不在本次區間']];
    ctx.font = '600 11.5px ' + SANS;
    let lx = PAD;
    legend.forEach(([bg, bd, t]) => {
      rr(lx, 7, 12, 12, 2); ctx.fillStyle = bg; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = bd; ctx.stroke();
      txt(t, lx + 18, 13.5, '600 11.5px ' + SANS, C.ink, 'left', 'middle');
      lx += 18 + ctx.measureText(t).width + 20;
    });
    txt('STEP ' + step + ' / ' + (steps.length - 1), w - PAD, 13.5, '700 11.5px ' + MONO, C.dim, 'right', 'middle');

    /* ---- BAND 1 · preorder ---- */
    drawRow('preorder', PRE, B1_CELL, preStyle, s, g);
    let preL = null;
    if (s.kind === 'call') preL = s.c.preL;
    if (s.kind === 'null') preL = s.nulls[0].preL;
    if (preL !== null) {
      const my = B1_CELL + CELL_H + 6;
      if (preL < PRE.length) marker(g.cx(preL) + g.cw/2, my, 'preL=' + preL, C.curS);
      else txt('preL = ' + preL + '(超出陣列,不會被讀取)', w - PAD, my + 12, '700 11px ' + SANS, C.curS, 'right', 'top');
    }

    /* ---- BAND 2 · inorder ---- */
    drawRow('inorder', INO, B2_CELL, inStyle, s, g);
    if (s.kind === 'call') {
      const { inL, inR } = s.c, by = B2_CELL + CELL_H + 8;
      const xa = g.cx(inL) + 2, xb = g.cx(inR) + g.cw - 2;
      ctx.strokeStyle = C.ink; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(xa, by - 4); ctx.lineTo(xa, by + 2); ctx.lineTo(xb, by + 2); ctx.lineTo(xb, by - 4); ctx.stroke();
      if (inL === inR) txt('inL = inR = ' + inL, (xa + xb)/2, by + 8, '700 11px ' + MONO, C.ink, 'center', 'top');
      else {
        txt('inL=' + inL, xa, by + 8, '700 11px ' + MONO, C.ink, 'left', 'top');
        txt('inR=' + inR, xb, by + 8, '700 11px ' + MONO, C.ink, 'right', 'top');
      }
    } else if (s.kind === 'null') {
      txt('兩次呼叫都是 inL > inR → 空區間', g.cx(0), B2_CELL + CELL_H + 16, '600 11.5px ' + SANS, C.curS, 'left', 'top');
    }

    /* ---- BAND 3 · 算式 ---- */
    rr(PAD, B3, w - 2*PAD, B3_H, 6);
    ctx.fillStyle = s.kind === 'done' ? C.cur : C.paper; ctx.fill();
    ctx.lineWidth = 1.5; ctx.strokeStyle = s.kind === 'done' ? C.curS : C.grid; ctx.stroke();
    const l1y = B3 + 19, l2y = B3 + 41, F = '600 12px ' + MONO, FB = '700 12px ' + MONO;
    const X = PAD + 14;
    if (s.kind === 'intro') {
      txt('idx = { 9→0, 3→1, 15→2, 20→3, 7→4 }', X, l1y, FB, C.ink, 'left', 'middle');
      txt('build(preL=0, inL=0, inR=4)  ← 從整段開始', X, l2y, F, C.dim, 'left', 'middle');
    } else if (s.kind === 'call') {
      const c = s.c;
      txt('root = pre[' + c.preL + '] = ' + c.rootV + ' · rootIdx = idx[' + c.rootV + '] = ' + c.rootIdx +
          ' · leftSize = ' + c.rootIdx + ' − ' + c.inL + ' = ' + c.leftSize, X, l1y, FB, C.ink, 'left', 'middle');
      const L = 'L: build(preL=' + (c.preL + 1) + ', [' + c.inL + ',' + (c.rootIdx - 1) + '])';
      const Rr = 'R: build(preL=' + (c.preL + c.leftSize + 1) + ', [' + (c.rootIdx + 1) + ',' + c.inR + '])';
      txt(L, X, l2y, F, C.ink, 'left', 'middle');
      txt(Rr, X + (w - 2*PAD - 28) / 2, l2y, F, C.ink, 'left', 'middle');
    } else if (s.kind === 'null') {
      const [a, b] = s.nulls;
      txt('L: build(preL=' + a.preL + ', [' + a.inL + ',' + a.inR + '])  ' + a.inL + ' > ' + a.inR + ' → nullptr', X, l1y, F, C.ink, 'left', 'middle');
      txt('R: build(preL=' + b.preL + ', [' + b.inL + ',' + b.inR + '])  ' + b.inL + ' > ' + b.inR + ' → nullptr', X, l2y, F, C.ink, 'left', 'middle');
    } else {
      txt('OUTPUT  [3, 9, 20, null, null, 15, 7]', X, l1y, '700 13px ' + MONO, C.curT, 'left', 'middle');
      txt('11 次呼叫 = 5 個節點 + 6 個 nullptr', X, l2y, '600 12px ' + SANS, C.curT, 'left', 'middle');
    }

    /* ---- BAND 4 · 樹 ---- */
    const tw = w - 2*PAD;
    const nx = k => PAD + POS[k][0] * tw, ny = k => T0 + POS[k][1] * T_DY;
    // 邊
    s.built.forEach(k => {
      const p = PARENT[k]; if (p === undefined) return;
      ctx.strokeStyle = C.ink; ctx.lineWidth = 1.6;
      const dx = nx(k) - nx(p), dy = ny(k) - ny(p), d = Math.hypot(dx, dy);
      ctx.beginPath(); ctx.moveTo(nx(p) + dx/d*R, ny(p) + dy/d*R); ctx.lineTo(nx(k) - dx/d*R, ny(k) - dy/d*R); ctx.stroke();
    });
    // nullptr 回傳(只在該步出現)
    s.ghost.forEach(k => {
      const p = PARENT[k];
      const dx = nx(k) - nx(p), dy = ny(k) - ny(p), d = Math.hypot(dx, dy);
      ctx.strokeStyle = C.curS; ctx.lineWidth = 1.4; ctx.setLineDash([4,3]);
      ctx.beginPath(); ctx.moveTo(nx(p) + dx/d*R, ny(p) + dy/d*R); ctx.lineTo(nx(k) - dx/d*11, ny(k) - dy/d*11); ctx.stroke();
      ctx.setLineDash([]);
      txt('∅', nx(k), ny(k), '700 15px ' + MONO, C.curS, 'center', 'middle');
    });
    // 節點
    s.built.forEach(k => {
      const isCur = k === s.cur;
      ctx.beginPath(); ctx.arc(nx(k), ny(k), R, 0, Math.PI*2);
      ctx.fillStyle = isCur ? C.cur : C.paper; ctx.fill();
      ctx.lineWidth = isCur ? 2.6 : 1.6; ctx.strokeStyle = isCur ? C.curS : C.ink; ctx.stroke();
      txt(String(k), nx(k), ny(k) + 1, '700 14px ' + MONO, isCur ? C.curT : C.ink, 'center', 'middle');
    });
    if (s.kind === 'intro') {
      // 雜湊表 idx:欄頭 = 值,格子 = 它在 inorder 的位置
      drawRow('idx', [0,1,2,3,4], T0 + 8, () => WHITE(), s, g, INO.map(v => 'idx[' + v + ']'));
      txt('樹還是空的 —— 之後每次 build 呼叫建立一個節點', w/2, T0 + CELL_H + 44, '600 12.5px ' + SANS, C.dim, 'center', 'middle');
    }
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
