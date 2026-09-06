/* ============================================================
   P450 · Delete Node in a BST — 遞迴(swap 變體)· viz
     找到之後:
       if (!left || !right) return left ? left : right;   // 0/1 個小孩:直接接上去
       succ = right; while (succ->left) succ = succ->left; // 右子樹的最左 = 中序後繼
       swap(root->val, succ->val);                        // ← 這份寫法用「交換」
       root->right = deleteNode(root->right, key);        // key 被換下去了,再刪一次
   動畫要傳達的一件事:swap 之後 key 跑到「右子樹的最左節點」,
   而「一路往左走」正好就會走到它 —— 所以那個暫時的 BST 違反不會害到遞迴。
   例 root=[10,5,15,null,null,13,20], 13 的左子是 12,刪 key=10
      後繼是 12(深 2 層),下降路徑 15 → 13 → 10,每一步都往左
     BAND 1  樹狀圖 + 後繼搜尋路徑 + swap 後的值
     BAND 2  這一步在做什麼
     BAND 3  key 現在在哪裡
     BAND 4  為什麼
   所有狀態取自實測 trace,未手推。
   前綴 v450- 。
   ============================================================ */
(function () {
  const canvas = document.getElementById('v450-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('v450-step'), labelEl = document.getElementById('v450-label');
  const bPrev = document.getElementById('v450-prev'), bNext = document.getElementById('v450-next'),
        bPlay = document.getElementById('v450-play'), bReset = document.getElementById('v450-reset');

  const C = { paper:'#ffffff', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf',
    win:'#e3edf5', winS:'#4478c0', winT:'#2f5f9e',
    seg:'#f6ead8', segS:'#c8801e', segT:'#96601a',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424',
    ok:'#d9e8c7', okS:'#5fa866', okT:'#3f7a3a',
    off:'#f0f0ec', offS:'#cfcfcf', offT:'#a3a099', coral:'#cf3535' };

  /* 樹:10(5, 15(13(12,_), 20)) —— heap 索引 */
  const POS = { 1:[3.5,0], 2:[1.5,1], 3:[5.5,1], 6:[4.5,2], 7:[6.5,2], 12:[4.0,3] };
  const IDS = [1,2,3,6,7,12];

  /* vals 每一步可能不同(因為 swap);gone = 已被移除的節點 */
  const V0 = { 1:10, 2:5, 3:15, 6:13, 7:20, 12:12 };   // 原始
  const V1 = { 1:12, 2:5, 3:15, 6:13, 7:20, 12:10 };   // swap 之後

  const S = (vals, path, focus, gone, keyAt, phase, eq, keyNote, note, text) =>
    ({ vals, path, focus, gone, keyAt, phase, eq, keyNote, note, text });

  const steps = [
    S(V0, [], -1, [], 1, 'intro',
      'deleteNode(root=10, key=10)',
      'key = 10 在根節點',
      '要刪的節點有「兩個小孩」—— 不能直接拔掉',
      '<strong>INITIAL</strong> · BST <code>[10,5,15,null,null,13,20]</code>(<code>13</code> 的左子是 <code>12</code>),要刪 <code>key = 10</code>。<b>根節點 <code>10</code> 有兩個小孩</b> —— <strong>不能直接拔掉,因為兩棵子樹沒地方掛</strong>。'),

    S(V0, [1], 1, [], 1, 'match',
      '節點 10:  10 == key  →  找到了,而且它有兩個小孩',
      'key = 10 在根節點',
      '0 或 1 個小孩可以直接接上去;兩個小孩才需要「找替身」',
      '<strong>找到了</strong> · <code>root-&gt;val == key</code>。<b>先檢查小孩數</b>:<code>if (!left || !right) return left ? left : right;</code> —— <strong>如果只有 0 或 1 個小孩,直接把那一邊接上去就結束了</strong>。<b>但這裡兩個都有</b>,所以要走「找替身」那條路。'),

    S(V0, [1,3,6,12], 12, [], 1, 'succ',
      'succ = root->right;  while (succ->left) succ = succ->left;   → 走到 12',
      'key = 10 還在根節點',
      '中序後繼 = 右子樹的最左節點 = 「比它大的裡面最小的那個」',
      '<strong>找中序後繼</strong> · 從右子樹的根 <code>15</code> 出發,<strong>一路往左走到底</strong>:<code>15 → 13 → 12</code>。<b><code>12</code> 就是中序後繼</b> —— <strong>整棵樹裡「比 10 大的值當中最小的那一個」</strong>。<b>用它來頂替被刪的位置,BST 的順序才不會壞掉。</b>'),

    S(V1, [1,3,6,12], 12, [], 12, 'swap',
      'swap(root->val, succ->val)   →  根變成 12,而 key=10 被換到後繼的位置',
      'key = 10 被換到「右子樹的最左節點」',
      '⚠ 此刻右子樹「暫時」不是合法 BST —— 10 比裡面所有值都小',
      '<strong>交換</strong> · <code>swap(root-&gt;val, succ-&gt;val)</code> —— <strong>根變成 <code>12</code></strong>(正確的新根值),<b>而 <code>key = 10</code> 被<em>換到後繼節點</em>去了</b>。<b>⚠ 注意此刻右子樹「暫時」不是合法 BST</b>:<code>10</code> 比右子樹裡所有值都小,卻待在最深的左下角。'),

    S(V1, [1,3,6,12], 12, [], 12, 'descend',
      'root->right = deleteNode(root->right, key=10)   → 下降 15 → 13 → 10',
      'key = 10 在「一路往左」的盡頭',
      '每一步都往左 —— 因為 10 比沿途每個節點都小,而它正好在最左邊',
      '<strong>再刪一次 —— 而且一定找得到</strong> · 遞迴到右子樹找 <code>key = 10</code>:<code>15 &gt; 10</code> 往左、<code>13 &gt; 10</code> 往左,<strong>就走到了</strong>。<b>那個「暫時的 BST 違反」<em>不會</em>害到遞迴</b> —— <strong>因為 <code>key</code> 被換到的正是「最左節點」,而 <code>key</code> 又比沿途每個值都小,所以「一路往左」剛好把你帶到它。</strong>'),

    S(V1, [1,3,6], 12, [12], -1, 'done',
      '節點 10:  只有 0 個小孩  →  return nullptr,被 13->left 接住',
      'key 已被移除',
      '刪掉的必定是「0 或 1 個小孩」的節點 —— 所以第二次遞迴必定停在簡單情況',
      '<strong>完成</strong> · 走到那個持有 <code>10</code> 的節點,<b>它是最左節點,所以<em>沒有左小孩</em></b> —— <strong>落入「0 或 1 個小孩」的簡單情況,直接 <code>return</code> 它的右小孩(這裡是 <code>nullptr</code>)</strong>,由 <code>13-&gt;left</code> 的回寫接住。<b>結果 <code>[12,5,15,13,20]</code> 仍是合法 BST。</b>'),
  ];

  let step = 0, timer = null;

  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||450; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  const TREE_TOP = 26, ROW_H = 46, R = 18, NCOL = 8, NROW = 4;

  function draw(){
    fit();
    const s = steps[step], w = canvas.clientWidth, PAD = 28;
    const done = s.phase === 'done';
    ctx.fillStyle = C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);

    const colW = (w - 2*PAD) / NCOL;
    const nx = i => PAD + (POS[i][0] + 0.5) * colW;
    const ny = i => TREE_TOP + 22 + POS[i][1] * ROW_H;
    const path = new Set(s.path), gone = new Set(s.gone);

    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 藍 = 走過的路　紅 = 這一步　橘 = key 現在的位置　灰虛線 = 已移除', PAD, 16);

    // 邊
    ctx.lineWidth = 1.8;
    IDS.forEach(i => {
      [2*i, 2*i+1].forEach(c => {
        if (!POS[c]) return;
        if (gone.has(c)) { ctx.setLineDash([4,4]); ctx.strokeStyle = C.grid; }
        else { ctx.setLineDash([]); ctx.strokeStyle = (path.has(i)&&path.has(c)) ? C.winS : C.grid; }
        ctx.lineWidth = (path.has(i)&&path.has(c)&&!gone.has(c)) ? 2.6 : 1.6;
        ctx.beginPath(); ctx.moveTo(nx(i), ny(i) + R - 2); ctx.lineTo(nx(c), ny(c) - R + 2); ctx.stroke();
        ctx.setLineDash([]);
      });
    });

    // 節點
    IDS.forEach(i => {
      const isGone = gone.has(i), isKey = i === s.keyAt;
      let bg = C.off, bd = C.offS, tx = C.offT;
      if (isGone)               { bg = '#fafaf6'; bd = C.grid; tx = C.offT; }
      else if (isKey)           { bg = C.seg; bd = C.segS; tx = C.segT; }
      else if (i === s.focus)   { bg = C.cur; bd = C.curS; tx = C.curT; }
      else if (path.has(i))     { bg = C.win; bd = C.winS; tx = C.winT; }
      else if (done)            { bg = C.ok;  bd = C.okS;  tx = C.okT; }
      ctx.beginPath(); ctx.arc(nx(i), ny(i), R, 0, Math.PI*2);
      ctx.fillStyle = bg; ctx.fill();
      ctx.lineWidth = (isKey || i === s.focus) ? 2.6 : 1.5;
      if (isGone) ctx.setLineDash([3,3]);
      ctx.strokeStyle = bd; ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = tx; ctx.font='700 14px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(s.vals[i]), nx(i), ny(i));

      if (isKey) {
        ctx.fillStyle = C.segT; ctx.font='700 10.5px "JetBrains Mono", monospace';
        ctx.textAlign='center'; ctx.textBaseline='top';
        ctx.fillText('key', nx(i), ny(i) + R + 4);
      } else if (isGone) {
        ctx.fillStyle = C.dim; ctx.font='600 10.5px "JetBrains Mono", monospace';
        ctx.textAlign='center'; ctx.textBaseline='top';
        ctx.fillText('已移除', nx(i), ny(i) + R + 4);
      }
    });

    // BAND 2
    const B2 = TREE_TOP + 22 + NROW * ROW_H + 2;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 這一步在做什麼', PAD, B2);
    rr(PAD, B2 + 10, w - 2*PAD, 38, 6);
    const hot = s.phase === 'swap';
    ctx.fillStyle = done ? C.ok : (hot ? C.seg : (s.phase === 'intro' ? '#fafaf6' : C.cur)); ctx.fill();
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = done ? C.okS : (hot ? C.segS : (s.phase === 'intro' ? C.grid : C.curS)); ctx.stroke();
    ctx.fillStyle = done ? C.okT : (hot ? C.segT : (s.phase === 'intro' ? C.text : C.curT));
    ctx.font='700 12px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(s.eq, w/2, B2 + 29);

    // BAND 3 · key 在哪
    const B3 = B2 + 62;
    ctx.fillStyle=C.segT; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · key 現在在哪裡', PAD, B3);
    rr(PAD, B3 + 10, w - 2*PAD, 38, 6);
    ctx.fillStyle = done ? C.ok : C.seg; ctx.fill();
    ctx.lineWidth = 1.6; ctx.strokeStyle = done ? C.okS : C.segS; ctx.stroke();
    ctx.fillStyle = done ? C.okT : C.segT;
    ctx.font='700 12.5px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(s.keyNote, w/2, B3 + 29);

    // BAND 4
    const B4 = B3 + 62;
    ctx.fillStyle=C.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 4 · 為什麼', PAD, B4);
    rr(PAD, B4 + 10, w - 2*PAD, 38, 6);
    ctx.fillStyle = done ? C.ok : '#fafaf6'; ctx.fill();
    ctx.lineWidth = 1.6; ctx.strokeStyle = done ? C.okS : C.grid; ctx.stroke();
    ctx.fillStyle = done ? C.okT : C.text;
    ctx.font='600 12.5px "Noto Sans TC", sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(s.note, w/2, B4 + 29);
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
