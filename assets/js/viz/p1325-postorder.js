/* ============================================================
   P1325 · Delete Leaves With a Given Value — 後序遞迴 · viz
     if (!root) return nullptr;
     root->left  = removeLeafNodes(root->left,  target);
     root->right = removeLeafNodes(root->right, target);
     return (!root->left && !root->right && root->val == target) ? nullptr : root;
   動畫要傳達的一件事:先處理小孩,再判斷自己 —— 所以「刪掉小孩之後
   才變成葉子」的節點(B)也會在同一趟被刪掉(連鎖刪除)。
   例 root=[1,2,3,2,null,2,4], target=2 → [1,null,3,null,4]
     節點:A=1(根) B=2(A.left) C=3(A.right) D=2(B.left) E=2(C.left) F=4(C.right)
     回傳順序(實測):D→null, B→null, E→null, F→F, C→C, A→A;共 13 次呼叫 = 2·6+1
     BAND 1  樹狀圖(紅 = 目前節點、藍底 = 堆疊中、綠 = 保留、灰虛線 = 已刪除)
     BAND 2  目前節點的三個條件:左空? 右空? val == target?
     BAND 3  呼叫堆疊(根 → 目前節點)
     BAND 4  回傳紀錄(後序順序)
   所有狀態取自實測 trace,未手推。
   前綴 v1325- 。
   ============================================================ */
(function () {
  const canvas = document.getElementById('v1325-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('v1325-step'), labelEl = document.getElementById('v1325-label');
  const bPrev = document.getElementById('v1325-prev'), bNext = document.getElementById('v1325-next'),
        bPlay = document.getElementById('v1325-play'), bReset = document.getElementById('v1325-reset');

  const C = { paper:'#ffffff', ink:'#1f1f1f', dim:'#5a5a5a', off:'#cfcfcf',
    up:'#e3edf5', low:'#f6ead8',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424',
    good:'#d9e8c7', bad:'#f0d4d4', deep:'#a31d1d' };

  const MONO = '"JetBrains Mono", monospace', SANS = '"Noto Sans TC", sans-serif';

  /* 樹的位置:x 以 8 欄為單位(0..7 的中心),y 為層 */
  const N = {
    A:{ v:1, x:3.5, y:0 }, B:{ v:2, x:1.5, y:1 }, C:{ v:3, x:5.5, y:1 },
    D:{ v:2, x:0.5, y:2 }, E:{ v:2, x:4.5, y:2 }, F:{ v:4, x:6.5, y:2 } };
  const IDS = ['A','B','C','D','E','F'];
  const EDGES = [['A','B'],['A','C'],['B','D'],['C','E'],['C','F']];
  const TARGET = 2;

  /* chips: [node, 左空, 右空, val==target, result]  —— true/false/null(未判斷)
     result: 'down' = 還在遞迴、'leaf' = 小孩剛被剪光、'null' = 回傳 nullptr、'keep' = 回傳自己 */
  const S = (cur, stack, gone, kept, chips, log, tag, phase, text) =>
    ({ cur, stack, gone, kept, chips, log, tag: tag || {}, phase, text });

  const steps = [
    S(null, [], [], [], null, [], null, 'intro',
      '<strong>INITIAL</strong> · <code>root = [1,2,3,2,null,2,4]</code>,<code>target = 2</code>。題目要刪的是「<b>值為 2 的葉子</b>」—— <strong>而且刪完之後新冒出來的「值為 2 的葉子」也要繼續刪</strong>。後序遞迴一趟就能做到:<b>先處理兩個小孩,再決定自己。</b>'),

    S('D', ['A','B','D'], [], [], ['D', null, null, null, 'down'], [], null, 'down',
      '<strong>下潛</strong> · <code>A(1) → B(2) → D(2)</code>。每一層都<strong>先呼叫左、再呼叫右</strong>,自己的判斷要等兩個小孩都回來才做。<code>D</code> 的兩個小孩都是 <code>nullptr</code>,那兩次呼叫第一行就 <code>return nullptr</code>。'),

    S('D', ['A','B','D'], ['D'], [], ['D', true, true, true, 'null'], [['D','null']], null, 'decide',
      '<strong>判斷 D</strong> · 左空 ✓、右空 ✓、<code>val == 2</code> ✓ —— <strong>三個條件全成立,<code>return nullptr</code></strong>。回到 <code>B</code> 時執行 <code>B-&gt;left = nullptr</code>,<b>D 就被剪掉了</b>。'),

    S('B', ['A','B'], ['D'], [], ['B', true, true, null, 'leaf'], [['D','null']], { B:'變成葉子!' }, 'cascade',
      '<strong>關鍵時刻 · B 變成葉子了</strong> · 原本 <code>B</code> 有左小孩 <code>D</code>,<b>它根本不是葉子</b>。但後序遞迴<strong>先處理了小孩</strong>:<code>B-&gt;left</code> 剛被改成 <code>nullptr</code>,<code>B-&gt;right</code> 本來就是空的 —— <strong>此刻的 <code>B</code> 已經是一片葉子</strong>。'),

    S('B', ['A','B'], ['D','B'], [], ['B', true, true, true, 'null'], [['D','null'],['B','null']], { B:'連鎖刪除' }, 'decide',
      '<strong>連鎖刪除 B</strong> · 左空 ✓、右空 ✓、<code>val == 2</code> ✓ → <code>return nullptr</code>,<code>A-&gt;left = nullptr</code>。<b>如果用前序(先判斷自己再遞迴),B 在被檢查時還有小孩,就會漏刪。</b><strong>「先小孩、後自己」正是這題選後序的原因。</strong>'),

    S('E', ['A','C','E'], ['D','B'], [], ['E', null, null, null, 'down'], [['D','null'],['B','null']], null, 'down',
      '<strong>換右半邊</strong> · <code>A</code> 的左子樹已經處理完(整塊被刪光),接著呼叫 <code>A-&gt;right</code>:<code>A(1) → C(3) → E(2)</code>。<code>E</code> 的兩個小孩都是 <code>nullptr</code>。'),

    S('E', ['A','C','E'], ['D','B','E'], [], ['E', true, true, true, 'null'], [['D','null'],['B','null'],['E','null']], null, 'decide',
      '<strong>判斷 E</strong> · 左空 ✓、右空 ✓、<code>val == 2</code> ✓ → <code>return nullptr</code>。回到 <code>C</code>:<code>C-&gt;left = nullptr</code>。'),

    S('F', ['A','C','F'], ['D','B','E'], ['F'], ['F', true, true, false, 'keep'], [['D','null'],['B','null'],['E','null'],['F','F']], null, 'decide',
      '<strong>判斷 F</strong> · 左空 ✓、右空 ✓,<strong>但 <code>val = 4 ≠ 2</code></strong> ✗ → <b>不刪,<code>return F</code></b>。它是葉子沒錯,只是值不對。<code>C-&gt;right = F</code>(接回原本的自己)。'),

    S('C', ['A','C'], ['D','B','E'], ['F','C'], ['C', true, false, false, 'keep'], [['D','null'],['B','null'],['E','null'],['F','F'],['C','C']], null, 'decide',
      '<strong>判斷 C</strong> · 左空 ✓(<code>E</code> 剛被剪掉),<strong>右空 ✗(還有 <code>F</code>)</strong> → 不是葉子,<code>return C</code>。<b>只要有一個條件不成立就保留</b>,<code>val == 2</code> 其實也不成立。'),

    S('A', ['A'], ['D','B','E'], ['F','C','A'], ['A', true, false, false, 'keep'], [['D','null'],['B','null'],['E','null'],['F','F'],['C','C'],['A','A']], null, 'decide',
      '<strong>判斷 A(根)</strong> · 左空 ✓(整棵左子樹被連鎖刪光),右空 ✗(還有 <code>C</code>)→ <code>return A</code>。<b>根是最後一個被判斷的</b> —— 後序的節奏:D → B → E → F → C → A。'),

    S(null, [], ['D','B','E'], ['F','C','A'], null, [['D','null'],['B','null'],['E','null'],['F','F'],['C','C'],['A','A']], null, 'done',
      '<strong>完成</strong> · 輸出 <code>[1,null,3,null,4]</code>。刪掉 3 個節點(<code>D</code>、<b>連鎖的 <code>B</code></b>、<code>E</code>)。總呼叫次數 <code>13 = 2·6 + 1</code>(6 個真節點 + 7 個空指標)。時間 <code>O(n)</code>,空間 <code>O(h)</code>。'),
  ];

  let step = 0, timer = null;

  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||420; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function box(x,y,w,h,fill,stroke,lw,dash){ rr(x,y,w,h,5); ctx.fillStyle=fill; ctx.fill(); ctx.lineWidth=lw||1.4; if(dash) ctx.setLineDash(dash); ctx.strokeStyle=stroke; ctx.stroke(); ctx.setLineDash([]); }
  function txt(s,x,y,color,font,align,base){ ctx.fillStyle=color; ctx.font=font; ctx.textAlign=align||'center'; ctx.textBaseline=base||'middle'; ctx.fillText(s,x,y); }
  function head(s,x,y,color){ txt(s,x,y,color||C.dim,'600 12px '+MONO+', '+SANS,'left','alphabetic'); }

  const TREE_TOP = 50, ROW_H = 64, R = 18, NCOL = 8;
  const B2 = 240, B3 = 314, B4 = 380, CH = 32;   // band 標題基線;方塊在基線 +12

  function draw(){
    fit();
    const s = steps[step], w = canvas.clientWidth, H = canvas.clientHeight, PAD = 28;
    const done = s.phase === 'done';
    ctx.fillStyle = C.paper; ctx.fillRect(0,0,w,H); ctx.setLineDash([]);

    const colW = (w - 2*PAD) / NCOL;
    const nx = id => PAD + (N[id].x + 0.5) * colW;
    const ny = id => TREE_TOP + N[id].y * ROW_H;
    const gone = new Set(s.gone), kept = new Set(s.kept), stack = new Set(s.stack);

    head('BAND 1 · 紅 = 目前節點　藍底 = 堆疊中　綠 = 保留　灰虛線 = 已刪除', PAD, 16);
    txt('target = ' + TARGET, w - PAD, 16, C.curT, '700 12px '+MONO, 'right', 'alphabetic');

    // 邊
    EDGES.forEach(([p,c]) => {
      const x1 = nx(p), y1 = ny(p), x2 = nx(c), y2 = ny(c);
      const dx = x2-x1, dy = y2-y1, L = Math.hypot(dx,dy), ux = dx/L, uy = dy/L;
      const sx = x1+ux*R, sy = y1+uy*R, ex = x2-ux*R, ey = y2-uy*R;
      const cut = gone.has(c);
      const onPath = stack.has(p) && stack.has(c);
      const inResult = done && !cut;
      ctx.lineWidth = inResult ? 3 : (onPath ? 2.6 : 1.6);
      ctx.strokeStyle = cut ? C.off : (inResult ? C.ink : (onPath ? C.curS : C.ink));
      if (cut) ctx.setLineDash([4,4]);
      ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(ex,ey); ctx.stroke(); ctx.setLineDash([]);
      if (cut && !done) {
        const mx = (sx+ex)/2, my = (sy+ey)/2, k = 5;
        ctx.strokeStyle = C.deep; ctx.lineWidth = 2.2;
        ctx.beginPath(); ctx.moveTo(mx-k,my-k); ctx.lineTo(mx+k,my+k); ctx.moveTo(mx+k,my-k); ctx.lineTo(mx-k,my+k); ctx.stroke();
      }
    });

    // 節點
    IDS.forEach(id => {
      const x = nx(id), y = ny(id);
      const isGone = gone.has(id), isCur = id === s.cur, isKept = kept.has(id), onStack = stack.has(id);
      let bg = C.paper, bd = C.ink, tx = C.ink, lw = 1.5, dash = null;
      if (isGone)       { bg = C.paper; bd = C.off; tx = C.off; dash = [3,3]; }
      else if (isCur && !isKept) { bg = C.cur; bd = C.curS; tx = C.curT; lw = 2.6; }
      else if (isKept)  { bg = C.good; bd = isCur ? C.curS : C.ink; lw = isCur ? 2.6 : (done ? 2.2 : 1.5); }
      else if (onStack) { bg = C.up; }
      ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI*2);
      ctx.fillStyle = bg; ctx.fill(); ctx.lineWidth = lw; if (dash) ctx.setLineDash(dash);
      ctx.strokeStyle = bd; ctx.stroke(); ctx.setLineDash([]);
      txt(String(N[id].v), x, y + 1, tx, '700 14px '+MONO);
      // 節點代號
      if (id === 'A') txt(id, x - R - 10, y, C.dim, '600 11px '+MONO, 'right', 'middle');
      else txt(id, x, y - R - 6, isGone ? C.off : C.dim, '600 11px '+MONO, 'center', 'alphabetic');
      // 標籤
      let tag = null, tc = C.dim;
      if (s.tag[id]) { tag = s.tag[id]; tc = s.tag[id] === '連鎖刪除' ? C.deep : C.curT; }
      else if (isGone) { tag = '已刪除'; tc = C.deep; }
      else if (isKept && !done) { tag = '保留'; tc = C.ink; }
      // B 的左下是被剪的邊(含 ×),標籤往右挪避開
      if (tag) txt(tag, x + (id === 'B' ? 24 : 0), y + R + 5, tc, '700 11px '+SANS, 'center', 'top');
    });

    // BAND 2 · 三個條件
    head('BAND 2 · 目前節點的三個條件(全 ✓ 才刪)', PAD, B2);
    const gap = 12, cw = (w - 2*PAD - 4*gap) / 5, cy = B2 + 12;
    if (s.chips) {
      const [id, l, r, v, res] = s.chips;
      box(PAD, cy, cw, CH, C.cur, C.curS, 2);
      txt('節點 ' + id + ' (' + N[id].v + ')', PAD + cw/2, cy + CH/2 + 1, C.curT, '700 12.5px '+MONO+', '+SANS);
      const lab = ['左空', '右空', 'val==' + TARGET];
      [l, r, v].forEach((ok, i) => {
        const x = PAD + (i+1)*(cw+gap);
        const fill = ok === null ? C.paper : (ok ? C.good : C.bad);
        const st = ok === null ? C.off : C.ink;
        const fresh = s.phase === 'cascade' && i === 0;   // B->left 剛被改成 null
        box(x, cy, cw, CH, fill, fresh ? C.curS : st, fresh ? 2.4 : 1.4, ok === null ? [3,3] : null);
        const mark = ok === null ? '?' : (ok ? '✓' : '✗');
        txt(lab[i] + '  ' + mark, x + cw/2, cy + CH/2 + 1, ok === null ? C.dim : C.ink, '700 12.5px '+MONO+', '+SANS);
      });
      const x = PAD + 4*(cw+gap);
      if (res === 'down') { box(x, cy, cw, CH, C.low, C.ink, 1.4); txt('遞迴小孩中…', x + cw/2, cy + CH/2 + 1, C.ink, '700 12px '+SANS); }
      else if (res === 'leaf') { box(x, cy, cw, CH, C.cur, C.curS, 2); txt('剛變成葉子!', x + cw/2, cy + CH/2 + 1, C.curT, '700 12px '+SANS); }
      else if (res === 'null') { box(x, cy, cw, CH, C.bad, C.deep, 2); txt('return null', x + cw/2, cy + CH/2 + 1, C.deep, '700 12.5px '+MONO); }
      else { box(x, cy, cw, CH, C.good, C.ink, 2); txt('return ' + id, x + cw/2, cy + CH/2 + 1, C.ink, '700 12.5px '+MONO); }
    } else {
      const intro = !done;
      box(PAD, cy, w - 2*PAD, CH, intro ? C.paper : C.good, intro ? C.off : C.ink, 1.4);
      txt(intro ? '刪除條件:!left && !right && val == target —— 小孩要先處理完才能判斷'
                : 'return A  →  輸出 [1,null,3,null,4](刪掉 D、B、E)',
          w/2, cy + CH/2 + 1, C.ink, '700 12.5px '+MONO+', '+SANS);
    }

    // BAND 3 · 呼叫堆疊
    head('BAND 3 · 呼叫堆疊(根 → 目前)', PAD, B3);
    const sy = B3 + 12, sh = 30, sw = 76, arrow = 28;
    if (s.stack.length) {
      s.stack.forEach((id, i) => {
        const x = PAD + i*(sw + arrow);
        const isTop = i === s.stack.length - 1;
        box(x, sy, sw, sh, isTop ? C.cur : C.up, isTop ? C.curS : C.ink, isTop ? 2 : 1.4);
        txt(id + ' (' + N[id].v + ')', x + sw/2, sy + sh/2 + 1, isTop ? C.curT : C.ink, '700 12.5px '+MONO);
        if (!isTop) txt('→', x + sw + arrow/2, sy + sh/2 + 1, C.dim, '700 13px '+MONO);
      });
      const depthX = PAD + s.stack.length*(sw+arrow) - arrow + 16;
      txt('深度 ' + s.stack.length, depthX, sy + sh/2 + 1, C.dim, '600 12px '+SANS, 'left');
    } else {
      box(PAD, sy, w - 2*PAD, sh, C.paper, C.off, 1.4, [3,3]);
      txt(done ? '(空 —— 所有呼叫都已返回)' : '(尚未呼叫)', w/2, sy + sh/2 + 1, C.dim, '600 12px '+SANS);
    }

    // BAND 4 · 回傳紀錄
    head('BAND 4 · 回傳紀錄(後序順序)', PAD, B4);
    const ly = B4 + 12, lh = 30, lw = (w - 2*PAD - 5*gap) / 6;
    for (let i = 0; i < 6; i++) {
      const x = PAD + i*(lw + gap);
      const e = s.log[i];
      if (!e) { box(x, ly, lw, lh, C.paper, C.off, 1.2, [3,3]); continue; }
      const isNull = e[1] === 'null', newest = i === s.log.length - 1 && !done && s.phase === 'decide';
      box(x, ly, lw, lh, isNull ? C.bad : C.good, newest ? C.curS : C.ink, newest ? 2.4 : 1.4);
      txt(e[0] + ' → ' + (isNull ? 'null' : e[1]), x + lw/2, ly + lh/2 + 1, isNull ? C.deep : C.ink, '700 12.5px '+MONO);
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
