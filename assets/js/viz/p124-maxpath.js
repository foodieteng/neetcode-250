/* ============================================================
   P124 · Binary Tree Maximum Path Sum · viz
     int path(TreeNode* root, int& ans) {
       if (!root) return 0;
       int l = max(0, path(root->left, ans));
       int r = max(0, path(root->right, ans));
       ans = max(ans, root->val + l + r);      // 以 root 為「轉折點」的路徑
       return root->val + max(l, r);           // 往上只能帶一條臂
     }
   動畫要傳達的三件事:
     ① 後序:左右兩條臂都回來了,才能算這個節點
     ② ans 用「兩條臂」(在這裡轉折);return 只帶「一條臂」往上
     ③ 負的臂會被 max(0, ·) 截成 0 —— 不拿會虧的臂
   例 A root=[-10,9,20,null,null,15,7] → 42(15→20→7,轉折在 20)
   例 B root=[2,-1] → 2(-1 那條臂被截成 0)
     BAND 1  樹 + 目前節點的兩條臂 + 已完成節點的回傳值
     BAND 2  rawL / rawR / l / r / cand / return
     BAND 3  ans + 正在執行的那一行
   數值取自實測 trace,未手推。
   ============================================================ */
(function () {
  const canvas = document.getElementById('viz-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('viz-step'), labelEl = document.getElementById('viz-label');
  const bPrev = document.getElementById('viz-prev'), bNext = document.getElementById('viz-next'),
        bPlay = document.getElementById('viz-play'), bReset = document.getElementById('viz-reset');

  const C = { paper:'#ffffff', ink:'#1f3550', dim:'#9a9a9a', grid:'#cfcfcf',
    left:'#e3edf5', right:'#f6ead8', leftS:'#7f9fbd', rightS:'#c49a62',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424', deep:'#a31d1d' };
  const MONO = '"JetBrains Mono", monospace', SANS = '"Noto Sans TC", sans-serif',
        MIX = '"JetBrains Mono", "Noto Sans TC", monospace';

  /* 兩棵樹:slot = 水平位置(0..4),d = 深度 */
  const TREES = {
    A: { nodes: { a0:{v:-10,slot:1,d:0}, a1:{v:9,slot:0,d:1}, a2:{v:20,slot:3,d:1}, a3:{v:15,slot:2,d:2}, a4:{v:7,slot:4,d:2} },
         parent: { a1:'a0', a2:'a0', a3:'a2', a4:'a2' }, ys:[74, 138, 202], arr:'[-10,9,20,null,null,15,7]' },
    B: { nodes: { b0:{v:2,slot:2,d:0}, b1:{v:-1,slot:1,d:1} },
         parent: { b1:'b0' }, ys:[96, 186], arr:'[2,-1]' },
  };
  const NEG_INF = null;   // INT_MIN 顯示成 −∞
  const f = n => n === NEG_INF ? '−∞' : String(n).replace('-', '−');

  /* 每一步的完整狀態(直接寫死,不累推)
     done: 已完成節點 → 回傳值;arms: 目前節點的臂 {side, path, text, mode:'take'|'clamp'|'drop'}
     cells: rawL rawR l r cand ret(null = 還沒算);hot: 這一步改變的格子 */
  const blank = { rawL:null, rawR:null, l:null, r:null, cand:null, ret:null };
  const leaf = v => ({ rawL:0, rawR:0, l:0, r:0, cand:v, ret:v });
  const steps = [
    { sc:'A', cur:null, done:{}, arms:[], cells:blank, hot:[], ans:NEG_INF, from:undefined,
      code:'int ans = INT_MIN;  path(root, ans);', note:'ans = −∞',
      text:'<strong>例 A · INITIAL</strong> · <code>ans</code> 從 <code>INT_MIN</code> 開始。<b>後序走訪</b>:每個節點要等左右兩條「臂」都回來才能算。' },

    { sc:'A', cur:'a1', done:{}, arms:[], cells:leaf(9), hot:['cand','ret'], ans:9, from:NEG_INF,
      code:'ans = max(ans, root->val + l + r);', note:'9 + 0 + 0 = 9',
      text:'<strong>節點 9(葉子)</strong> · 兩邊都是 <code>nullptr</code> 回傳 0。<code>cand = 9</code>,<b><code>ans</code> −∞ → 9</b>;往上回傳 9。' },

    { sc:'A', cur:'a3', done:{a1:9}, arms:[], cells:leaf(15), hot:['cand','ret'], ans:15, from:9,
      code:'ans = max(ans, root->val + l + r);', note:'15 > 9 → ans = 15',
      text:'<strong>節點 15(葉子)</strong> · <code>cand = 15</code>,<b><code>ans</code> 9 → 15</b>;往上回傳 15。' },

    { sc:'A', cur:'a4', done:{a1:9, a3:15}, arms:[], cells:leaf(7), hot:['cand','ret'], ans:15, from:15,
      code:'ans = max(ans, root->val + l + r);', note:'7 < 15 · 不變',
      text:'<strong>節點 7(葉子)</strong> · <code>cand = 7 &lt; 15</code>,<code>ans</code> 不變;往上回傳 7。' },

    { sc:'A', cur:'a2', done:{a1:9, a3:15, a4:7}, bend:true,
      arms:[{side:'L', path:['a3'], text:'l = 15', mode:'take'}, {side:'R', path:['a4'], text:'r = 7', mode:'take'}],
      cells:{ rawL:15, rawR:7, l:15, r:7, cand:42, ret:null }, hot:['cand'], ans:42, from:15,
      code:'ans = max(ans, root->val + l + r);', note:'20 + 15 + 7 = 42',
      text:'<strong>節點 20 · 在這裡轉折</strong> · 左臂 15、右臂 7 都是正的,<b>兩條臂 + 自己 = 42</b>(路徑 15→20→7)。<strong><code>ans</code> 15 → 42。</strong>' },

    { sc:'A', cur:'a2', done:{a1:9, a3:15, a4:7}, carry:true,
      arms:[{side:'L', path:['a3'], text:'帶上去', mode:'take'}, {side:'R', path:['a4'], text:'不帶', mode:'drop'}],
      cells:{ rawL:15, rawR:7, l:15, r:7, cand:42, ret:35 }, hot:['ret'], ans:42, from:42,
      code:'return root->val + max(l, r);', note:'20 + max(15, 7) = 35',
      text:'<strong>節點 20 · 往上回傳</strong> · 父節點要接的是「一條往下的路」,<b>不能分岔</b> —— <strong>只帶較大的那條臂:20 + 15 = 35</strong>。' },

    { sc:'A', cur:'a0', done:{a1:9, a3:15, a4:7, a2:35}, bend:true,
      arms:[{side:'L', path:['a1'], text:'l = 9', mode:'take'}, {side:'R', path:['a2','a3'], text:'r = 35', mode:'take'}],
      cells:{ rawL:9, rawR:35, l:9, r:35, cand:34, ret:25 }, hot:['cand','ret'], ans:42, from:42, unused:true,
      code:'ans = max(ans, root->val + l + r);', note:'34 < 42 · 不變',
      text:'<strong>節點 −10(根)</strong> · 右臂 35 其實是 20→15 那條。<code>cand = −10 + 9 + 35 = 34 &lt; 42</code>,<b><code>ans</code> 不變</b>。回傳 25 沒人用。' },

    { sc:'A', cur:null, done:{a1:9, a3:15, a4:7, a2:35, a0:25}, best:['a3','a2','a4'], arms:[], cells:blank, hot:[], ans:42, from:42, out:true,
      code:'return ans;', note:'OUTPUT 42',
      text:'<strong>例 A 完成 · 42</strong> · 最佳路徑 <b>15 → 20 → 7</b>,轉折點是 20 —— <strong>它不經過根,所以答案存在 <code>ans</code>,而不是 <code>path(root)</code> 的回傳值。</strong>' },

    { sc:'B', cur:null, done:{}, arms:[], cells:blank, hot:[], ans:NEG_INF, from:undefined,
      code:'int ans = INT_MIN;  path(root, ans);', note:'ans = −∞',
      text:'<strong>例 B · 負的臂</strong> · <code>[2, −1]</code>,−1 是 2 的<b>左</b>子。看 <code>max(0, ·)</code> 怎麼處理「會虧的臂」。' },

    { sc:'B', cur:'b1', done:{}, arms:[], cells:leaf(-1), hot:['cand','ret'], ans:-1, from:NEG_INF,
      code:'ans = max(ans, root->val + l + r);', note:'−1 > −∞ → ans = −1',
      text:'<strong>節點 −1(葉子)</strong> · <code>cand = −1</code>,<b><code>ans</code> −∞ → −1</b>(全負的樹也要有答案)。往上回傳 −1。' },

    { sc:'B', cur:'b0', done:{b1:-1},
      arms:[{side:'L', path:['b1'], text:'max(0, −1) = 0', mode:'clamp'}],
      cells:{ rawL:-1, rawR:0, l:0, r:0, cand:null, ret:null }, hot:['l'], ans:-1, from:-1,
      code:'int l = max(0, path(root->left, ans));', note:'max(0, −1) = 0',
      text:'<strong>節點 2 · 截斷</strong> · 左邊回來 <code>−1</code>,接上去只會變小 → <b><code>max(0, −1) = 0</code>,等於「不拿這條臂」</b>。右邊 <code>nullptr</code> 是 0。' },

    { sc:'B', cur:'b0', done:{b1:-1}, bend:true,
      arms:[{side:'L', path:['b1'], text:'l = 0', mode:'clamp'}],
      cells:{ rawL:-1, rawR:0, l:0, r:0, cand:2, ret:2 }, hot:['cand','ret'], ans:2, from:-1,
      code:'ans = max(ans, root->val + l + r);', note:'2 + 0 + 0 = 2',
      text:'<strong>節點 2</strong> · <code>cand = 2 + 0 + 0 = 2</code>,<b><code>ans</code> −1 → 2</b>。若沒截斷會得到 1,反而更差。' },

    { sc:'B', cur:null, done:{b1:-1, b0:2}, best:['b0'], arms:[], cells:blank, hot:[], ans:2, from:2, out:true,
      code:'return ans;', note:'OUTPUT 2',
      text:'<strong>例 B 完成 · 2</strong> · 最佳路徑就是<b>節點 2 自己</b>。<strong>重點:ans 用兩條臂(轉折),return 只帶一條臂往上;負的臂一律截成 0。</strong>' },
  ];

  let step = 0, timer = null;

  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||476; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function txt(s, x, y, font, color, align, base){ ctx.font=font; ctx.fillStyle=color; ctx.textAlign=align||'left'; ctx.textBaseline=base||'alphabetic'; ctx.fillText(s, x, y); }
  function pill(s, cx, cy, fg, bg, bd, font){
    font = font || ('700 10.5px ' + MONO);
    ctx.font = font; const pw = ctx.measureText(s).width + 12;
    rr(cx - pw/2, cy - 8, pw, 16, 8); ctx.fillStyle = bg; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = bd; ctx.stroke();
    txt(s, cx, cy + 0.5, font, fg, 'center', 'middle');
    return pw;
  }

  /* 版面(邏輯座標,寬度隨容器,高度固定 476) */
  const PAD = 28, TAG_W = 88, CELL_H = 36, GAP = 10;
  const R = 19;                                 // 樹的 y 見 TREES.ys;例 A 最深 202,下方 tag 到 ~244
  const B2 = 254, B2_CELL = B2 + 30;            // 格子頂 284..320,下方說明 ~345
  const B3 = 362, B3_H = 100;                   // 狀態框 362..462
  const KEYS = ['rawL', 'rawR', 'l', 'r', 'cand', 'ret'];
  const HEAD = ['rawL', 'rawR', 'l', 'r', 'cand', 'return'];

  function cellGeom(w){
    const x0 = PAD + TAG_W;
    const cw = Math.min(96, ((w - PAD) - x0 - GAP * 5) / 6);
    const total = cw * 6 + GAP * 5;
    const sx = x0 + (((w - PAD) - x0) - total) / 2;
    return { cw, cx: i => sx + i * (cw + GAP) };
  }

  function draw(){
    fit();
    const s = steps[step], w = canvas.clientWidth, h = canvas.clientHeight;
    ctx.fillStyle = C.paper; ctx.fillRect(0, 0, w, h); ctx.setLineDash([]); ctx.lineCap = 'butt';
    const T = TREES[s.sc];
    const x0 = PAD + TAG_W, span = (w - PAD) - x0;
    const nx = k => x0 + (T.nodes[k].slot + 0.5) * span / 5, ny = k => T.ys[T.nodes[k].d];
    const tagX = PAD + (TAG_W - 12) / 2;

    /* ---- 圖例 ---- */
    const legend = [[C.cur, C.curS, [], '紅 = 目前節點'], [C.left, C.leftS, [], '藍 = 左臂'],
                    [C.right, C.rightS, [], '米 = 右臂'], [C.paper, C.grid, [3,2], '灰虛線 = 截成 0']];
    let lx = PAD;
    legend.forEach(([bg, bd, dash, t]) => {
      rr(lx, 7, 12, 12, 2); ctx.fillStyle = bg; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = bd;
      ctx.setLineDash(dash); ctx.stroke(); ctx.setLineDash([]);
      txt(t, lx + 18, 13.5, '600 11.5px ' + SANS, C.ink, 'left', 'middle');
      lx += 18 + ctx.measureText(t).width + 18;
    });
    ctx.font = '700 11.5px ' + MONO;
    const stTxt = 'STEP ' + step + ' / ' + (steps.length - 1);
    if (lx + ctx.measureText(stTxt).width < w - PAD) txt(stTxt, w - PAD, 13.5, '700 11.5px ' + MONO, C.dim, 'right', 'middle');

    /* ---- BAND 1 · 樹 ---- */
    const midY = (T.ys[0] + T.ys[T.ys.length - 1]) / 2;
    txt('例 ' + s.sc, tagX, midY - 10, '700 14px ' + SANS, C.ink, 'center', 'middle');
    txt('tree', tagX, midY + 10, '600 11.5px ' + MONO, C.dim, 'center', 'middle');

    const armOf = {};           // 'child' → arm(邊 parent–child 屬於哪條臂)
    s.arms.forEach(a => { let p = s.cur; a.path.forEach(c => { armOf[c] = { arm:a, p }; p = c; }); });
    const best = s.best || [];
    const seg = (p, c, inset) => {
      const dx = nx(c) - nx(p), dy = ny(c) - ny(p), d = Math.hypot(dx, dy);
      return [nx(p) + dx/d*inset, ny(p) + dy/d*inset, nx(c) - dx/d*inset, ny(c) - dy/d*inset];
    };
    // 臂的底色(粗色帶)
    Object.keys(armOf).forEach(c => {
      const { arm, p } = armOf[c];
      if (arm.mode === 'clamp') return;
      if (arm.mode === 'drop') return;
      const [ax, ay, bx, by] = seg(p, c, 0);
      ctx.strokeStyle = arm.side === 'L' ? C.left : C.right; ctx.lineWidth = 14; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke(); ctx.lineCap = 'butt';
    });
    // 邊
    Object.keys(T.parent).forEach(c => {
      const p = T.parent[c], a = armOf[c];
      const [ax, ay, bx, by] = seg(p, c, R);
      const isBest = best.includes(c) && best.includes(p);
      let col = C.ink, lw = 1.5, dash = [];
      if (a && a.arm.mode === 'take') { col = a.arm.side === 'L' ? C.leftS : C.rightS; lw = 3; }
      if (a && a.arm.mode === 'clamp') { col = C.grid; lw = 2.4; dash = [5, 4]; }
      if (a && a.arm.mode === 'drop') { col = C.grid; lw = 1.5; }
      if (isBest) { col = C.curS; lw = 3.6; }
      ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.setLineDash(dash);
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke(); ctx.setLineDash([]);
    });
    // 節點
    Object.keys(T.nodes).forEach(k => {
      const x = nx(k), y = ny(k), v = T.nodes[k].v;
      const isCur = k === s.cur, isDone = k in s.done, isBest = best.includes(k);
      const onArm = k in armOf && armOf[k].arm.mode === 'take';
      let bg = C.paper, bd = C.grid, tc = C.dim, lw = 1.4;
      if (isDone) { bd = C.ink; tc = C.ink; lw = 1.6; }
      if (onArm) bg = armOf[k].arm.side === 'L' ? C.left : C.right;
      if (k in armOf && armOf[k].arm.mode !== 'take') { bd = C.grid; tc = C.dim; }
      if (isCur || isBest) { bg = C.cur; bd = C.curS; tc = C.curT; lw = isBest ? 3 : 2.6; }
      ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI*2);
      ctx.fillStyle = bg; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = bd; ctx.stroke();
      if (isBest && best.length === 1) { ctx.beginPath(); ctx.arc(x, y, R + 4, 0, Math.PI*2); ctx.lineWidth = 1.2; ctx.strokeStyle = C.curS; ctx.stroke(); }
      txt(f(v), x, y + 1, '700 13.5px ' + MONO, tc, 'center', 'middle');
      // 回傳值 tag(節點上方)
      let tag = null;
      if (isDone) tag = '↑ ' + f(s.done[k]);
      if (isCur && s.cells.ret !== null) tag = '↑ ' + f(s.cells.ret);
      if (tag) {
        const unused = T.nodes[k].d === 0 && (s.unused || s.out);
        if (unused) tag += ' 沒人用';
        const hotTag = isCur && s.hot.includes('ret');
        let tx = x, ty = T.nodes[k].d === 0 ? y - R - 17 : y + R + 16;
        if (isCur && T.nodes[k].d > 0) { const p = T.parent[k]; tx = (x + nx(p)) / 2; ty = (y + ny(p)) / 2; }   // 回傳值沿邊往上
        pill(tag, tx, ty, hotTag ? C.curT : unused ? C.dim : C.ink, hotTag ? C.cur : C.paper,
             hotTag ? C.curS : unused ? C.grid : C.ink, unused ? '700 10.5px ' + MIX : null);
      }
    });
    // 臂的數值標籤(第一段邊的中點,往外側偏)
    s.arms.forEach(a => {
      const c = a.path[0], p = s.cur;
      const mx = (nx(p) + nx(c)) / 2, my = (ny(p) + ny(c)) / 2;
      const dir = a.side === 'L' ? -1 : 1;
      let fg = C.ink, bg = a.side === 'L' ? C.left : C.right, bd = a.side === 'L' ? C.leftS : C.rightS;
      if (a.mode !== 'take') { fg = C.dim; bg = C.paper; bd = C.grid; }
      if (a.mode === 'clamp' && s.hot.includes('l')) { fg = C.curT; bd = C.curS; }
      ctx.font = '700 10.5px ' + MONO; const pw = ctx.measureText(a.text).width + 12;
      pill(a.text, mx + dir * (pw / 2 + 10), my - 4, fg, bg, bd, '700 10.5px ' + MIX);
    });
    // 轉折 / 只帶一條臂 的說明(樹右側)
    let note = null, noteCol = C.curT;
    if (s.bend && s.arms.some(a => a.mode === 'take')) note = 'cand:左臂 + 自己 + 右臂';
    else if (s.bend) note = 'cand:只有自己';
    if (s.carry) note = 'return:只帶一條臂往上';
    if (s.best) note = s.sc === 'A' ? '最佳路徑:15 → 20 → 7' : '最佳路徑:只有 2';
    if (note) {
      const ncy = s.sc === 'A' ? T.ys[0] : T.ys[1];
      ctx.font = '700 12px ' + SANS;
      const nxR = w - PAD, nxL = nxR - ctx.measureText(note).width;
      const rootR = nx(s.sc === 'A' ? 'a0' : 'b1') + R + 60;
      if (nxL > rootR) txt(note, nxR, ncy, '700 12px ' + SANS, noteCol, 'right', 'middle');
    }

    /* ---- BAND 2 · 目前節點的計算 ---- */
    const g = cellGeom(w);
    const curV = s.cur ? T.nodes[s.cur].v : null;
    txt('node', tagX, B2_CELL + CELL_H/2 - 9, '600 11.5px ' + MONO, C.dim, 'center', 'middle');
    txt(curV === null ? '—' : 'val = ' + f(curV), tagX, B2_CELL + CELL_H/2 + 9, '700 12.5px ' + MONO, curV === null ? C.dim : C.curS, 'center', 'middle');
    KEYS.forEach((k, i) => {
      const x = g.cx(i), val = s.cells[k], hot = s.hot.includes(k);
      txt(HEAD[i], x + g.cw/2, B2_CELL - 12, '700 11px ' + MONO, hot ? C.curS : C.dim, 'center', 'bottom');
      let bg = C.paper, bd = C.grid, tc = C.dim, lw = 1.2, dash = [];
      if (val !== null) {
        bd = C.ink; tc = C.ink; lw = 1.4;
        if (k === 'rawL' || k === 'l') bg = C.left;
        if (k === 'rawR' || k === 'r') bg = C.right;
        if (k === 'l' && s.cells.rawL < 0) { bg = C.paper; bd = C.grid; dash = [4, 3]; tc = C.dim; }
      }
      if (hot) { bg = C.cur; bd = C.curS; tc = C.curT; lw = 2.4; }
      rr(x, B2_CELL, g.cw, CELL_H, 5);
      ctx.fillStyle = bg; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = bd; ctx.setLineDash(dash); ctx.stroke(); ctx.setLineDash([]);
      txt(val === null ? '·' : f(val), x + g.cw/2, B2_CELL + CELL_H/2 + 1, '700 14px ' + MONO, val === null ? C.grid : tc, 'center', 'middle');
    });
    // 分組說明(格子下方)
    const subY = B2_CELL + CELL_H + 12;
    const under = (i0, i1, t, col) => {
      const a = g.cx(i0) + 4, b = g.cx(i1) + g.cw - 4;
      ctx.strokeStyle = col; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(a, subY - 5); ctx.lineTo(a, subY); ctx.lineTo(b, subY); ctx.lineTo(b, subY - 5); ctx.stroke();
      txt(t, (a + b) / 2, subY + 4, '600 11px ' + SANS, col, 'center', 'top');
    };
    under(0, 1, '子呼叫原始回傳', C.dim);
    under(2, 3, 'max(0, ·)', C.dim);
    under(4, 4, '兩臂 → ans', s.hot.includes('cand') ? C.curS : C.dim);
    under(5, 5, '一臂 ↑', s.hot.includes('ret') ? C.curS : C.dim);

    /* ---- BAND 3 · 狀態 ---- */
    const changed = s.from !== undefined && s.from !== s.ans;
    const hotBox = changed || s.out;
    rr(PAD, B3, w - 2*PAD, B3_H, 6);
    ctx.fillStyle = hotBox ? C.cur : C.paper; ctx.fill();
    ctx.lineWidth = 1.5; ctx.strokeStyle = hotBox ? C.curS : C.grid; ctx.stroke();
    const X = PAD + 16, rowY = B3 + 32;
    txt('ans', X, rowY, '600 12px ' + MONO, C.dim, 'left', 'middle');
    const as = f(s.ans);
    txt(as, X + 40, rowY + 1, '700 28px ' + MONO, s.ans === NEG_INF ? C.dim : C.curS, 'left', 'middle');
    ctx.font = '700 28px ' + MONO; let ax = X + 40 + ctx.measureText(as).width + 12;
    if (s.from !== undefined && !s.out) {
      const fs = changed ? '(' + f(s.from) + ' → ' + as + ')' : '(不變)';
      txt(fs, ax, rowY + 2, '600 12px ' + MIX, changed ? C.curT : C.dim, 'left', 'middle');
      ctx.font = '600 12px ' + MONO; ax += ctx.measureText(fs).width;
    }
    // 右側:例子 / 輸出
    const RX = w - PAD - 16;
    ctx.font = '700 11.5px ' + MONO;
    if (RX - ctx.measureText(T.arr).width > ax + 24) {
      txt('root = ' + T.arr, RX, rowY - 9, '600 11px ' + MONO, C.dim, 'right', 'middle');
      txt('例 ' + s.sc, RX, rowY + 10, '700 12px ' + SANS, C.ink, 'right', 'middle');
    }
    // 目前執行的那一行
    const cy = B3 + 58;
    ctx.strokeStyle = C.grid; ctx.lineWidth = 1; ctx.setLineDash([3,3]);
    ctx.beginPath(); ctx.moveTo(PAD + 12, cy); ctx.lineTo(w - PAD - 12, cy); ctx.stroke(); ctx.setLineDash([]);
    const codeY = B3 + 79;
    txt('▶', X, codeY, '700 11px ' + MONO, C.curS, 'left', 'middle');
    txt(s.code, X + 18, codeY, '700 12.5px ' + MONO, C.ink, 'left', 'middle');
    ctx.font = '700 12.5px ' + MONO; const codeEnd = X + 18 + ctx.measureText(s.code).width;
    const NF = '600 12px ' + MIX;
    ctx.font = NF; const nw = ctx.measureText(s.note).width;
    if (codeEnd + 20 + nw < w - PAD - 16)
      txt(s.note, w - PAD - 16, codeY, NF, hotBox ? C.curT : C.dim, 'right', 'middle');
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
