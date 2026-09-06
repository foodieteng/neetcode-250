/* ============================================================
   P701 · Insert into a BST — 遞迴 · viz
     if (root == nullptr) return new TreeNode(val);
     if (root->val > val)      root->left  = insertIntoBST(root->left,  val);
     else if (root->val < val) root->right = insertIntoBST(root->right, val);
     return root;
   動畫要傳達的兩件事:
     ① 下降的路徑和 BST search 一模一樣 —— 走到「該在的空位」為止
     ② 回程時「回寫」把新節點接回父節點 —— 這一步不可省略
        因為遞迴拿到的是 nullptr 的「副本」,新節點沒有別的路回到父親的 left/right
   例 root=[40,20,60,10,30,50,70], val=25 → 掛在 30 的左邊
     BAND 1  BST 樹狀圖 + 下降路徑 + 新節點
     BAND 2  這一步在做什麼
     BAND 3  回寫鏈:哪一個賦值真的存下了新節點
     BAND 4  為什麼
   所有狀態取自實測 trace,未手推。
   前綴 v701- 。
   ============================================================ */
(function () {
  const canvas = document.getElementById('v701-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('v701-step'), labelEl = document.getElementById('v701-label');
  const bPrev = document.getElementById('v701-prev'), bNext = document.getElementById('v701-next'),
        bPlay = document.getElementById('v701-play'), bReset = document.getElementById('v701-reset');

  const C = { paper:'#ffffff', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf',
    win:'#e3edf5', winS:'#4478c0', winT:'#2f5f9e',
    seg:'#f6ead8', segS:'#c8801e', segT:'#96601a',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424',
    ok:'#d9e8c7', okS:'#5fa866', okT:'#3f7a3a',
    off:'#f0f0ec', offS:'#cfcfcf', offT:'#a3a099', coral:'#cf3535' };

  /* root = [40,20,60,10,30,50,70] —— heap 索引 1..7;新節點 25 掛在 30(索引5)的左邊 = 索引 10 */
  const V   = { 1:40, 2:20, 3:60, 4:10, 5:30, 6:50, 7:70 };
  const POS = { 1:[3.5,0], 2:[1.5,1], 3:[5.5,1],
                4:[0.5,2], 5:[2.5,2], 6:[4.5,2], 7:[6.5,2],
                10:[2.0,3] };
  const IDS = [1,2,3,4,5,6,7];
  const NCOL = 8, NROW = 4;

  /* path = 下降走過的節點;focus = 這一步;newAt = 新節點已存在(索引10);
     wired = 已完成回寫的父節點索引集合 */
  const S = (path, focus, newAt, wired, phase, eq, chain, note, text) =>
    ({ path, focus, newAt, wired, phase, eq, chain, note, text });

  const steps = [
    S([], -1, false, [], 'intro',
      'insertIntoBST(root=40, val=25)',
      '尚未開始',
      '下降的路徑和 BST 搜尋一模一樣 —— 找「25 該在的位置」',
      '<strong>INITIAL</strong> · BST <code>[40,20,60,10,30,50,70]</code>,要插入 <code>25</code>。<b>這題分成兩個階段</b>:<strong>先「下降」找到 25 該待的空位</strong>,<strong>再「回程」把新節點接回去</strong>。<b>下降的邏輯和 BST search 完全相同。</b>'),

    S([1], 1, false, [], 'down',
      '節點 40:  40 > 25  →  往左   root->left = insertIntoBST(root->left, 25)',
      '40.left = ?   (等待遞迴回傳)',
      '比 40 小 ⇒ 25 只可能在左子樹',
      '<strong>在節點 40</strong> · <code>40 &gt; 25</code>,所以往<strong>左</strong>走。<b>注意這一行寫的是 <code>root-&gt;left = insertIntoBST(...)</code></b> —— <strong>左邊那個賦值現在還「懸著」</strong>,要等遞迴回來才知道要存什麼。'),

    S([1,2], 2, false, [], 'down',
      '節點 20:  20 < 25  →  往右   root->right = insertIntoBST(root->right, 25)',
      '40.left = ?  →  20.right = ?',
      '比 20 大 ⇒ 往右子樹繼續找',
      '<strong>在節點 20</strong> · <code>20 &lt; 25</code>,往<strong>右</strong>。<strong>又掛起一個賦值</strong> —— 現在有<strong>兩個</strong>賦值在等著遞迴回傳。<b>這條「等待中的賦值鏈」就是等一下把新節點接回去的路。</b>'),

    S([1,2,5], 5, false, [], 'down',
      '節點 30:  30 > 25  →  往左   root->left = insertIntoBST(root->left, 25)',
      '40.left = ?  →  20.right = ?  →  30.left = ?',
      '30 的左邊是 nullptr —— 下一步就會走到底',
      '<strong>在節點 30</strong> · <code>30 &gt; 25</code>,往<strong>左</strong>。<b>但 30 的左子是 <code>nullptr</code></b> —— <strong>下一次遞迴會拿到空指標</strong>,也就是走到底了。<strong>三個賦值都還懸著。</strong>'),

    S([1,2,5], -1, true, [], 'create',
      'root == nullptr  →  return new TreeNode(25)',
      '40.left = ?  →  20.right = ?  →  30.left = ?  ← 新節點正要回傳到這裡',
      '新節點誕生了,但「還沒接上任何人」—— 它只是一個回傳值',
      '<strong>建立新節點</strong> · 遞迴拿到 <code>nullptr</code>,<strong>base case 觸發:<code>return new TreeNode(25)</code></strong>。<b>⚠ 關鍵時刻:這個節點現在<em>誰也沒連著</em></b> —— 它只是一個<strong>回傳值</strong>。<b>遞迴當時拿到的是 <code>30-&gt;left</code> 這個 <code>nullptr</code> 的「<em>副本</em>」,新節點沒有任何路徑能自己回到 30 的 <code>left</code> 欄位。</b>'),

    S([1,2,5], 5, true, [5], 'wire',
      '回到節點 30:  30->left = (新節點 25)      ← 回寫!',
      '40.left = ?  →  20.right = ?  →  30.left = 25 ✓',
      '這一個賦值,就是新節點唯一的接線機會',
      '<strong>回寫 —— 新節點被接上了</strong> · 遞迴回到節點 30,<strong>那個懸著的賦值終於執行</strong>:<code>30-&gt;left = 新節點</code>。<b>如果這裡只寫 <code>insertIntoBST(root-&gt;left, val);</code> 而不接住回傳值,新節點就<em>永遠掛不上去</em></b> —— 實測:丟掉回寫,<strong>4707 組裡錯 4706 組</strong>。'),

    S([1,2,5], 2, true, [5,2], 'wire',
      '回到節點 20:  20->right = (節點 30,沒變)',
      '40.left = ?  →  20.right = 30 ✓  →  30.left = 25 ✓',
      '上面幾層的回寫是「恆等賦值」—— 但你事先不知道是哪一層',
      '<strong>回到節點 20</strong> · <code>20-&gt;right = insertIntoBST(...)</code> 回傳的是<strong>節點 30 自己</strong>(沒有換人),所以這是一個<strong>恆等賦值</strong> —— <b>寫了等於沒寫</b>。<strong>但你事先不知道「哪一層才是真的需要接線的那一層」</strong>,所以每一層都得寫。'),

    S([1,2,5], 1, true, [5,2,1], 'wire',
      '回到節點 40:  40->left = (節點 20,沒變)   →  return root',
      '40.left = 20 ✓  →  20.right = 30 ✓  →  30.left = 25 ✓',
      '整條鏈只有最底下那一個賦值真的存了東西',
      '<strong>回到根節點 40</strong> · 同樣是恆等賦值,然後 <code>return root</code> 把<strong>原本的根</strong>交出去。<b>整條回寫鏈上有 3 個賦值,但<em>只有最底下那一個</em>真的存下了新東西</b> —— 其他兩個都是「把原本的值再寫一次」。'),

    S([1,2,5], -1, true, [5,2,1], 'done',
      'return root = 節點 40      // 走了 4 步,配置 1 個節點',
      '完成:25 已掛在 30 的左邊,而且是一片葉子',
      '實測:新節點「永遠」是葉子,而且插入後仍是合法 BST',
      '<strong>完成</strong> · <code>25</code> 掛在 <code>30</code> 的左邊。<b>實測性質</b>:新節點<strong>永遠是葉子</strong>、插入後<strong>仍是合法 BST</strong>、節點集合恰好多了 <code>{val}</code>、<strong>恰好配置 1 個節點</strong> —— 窮舉全部樹形與插入位置皆成立。呼叫次數 <strong>= 新葉子的深度 + 1</strong>。'),
  ];

  let step = 0, timer = null;

  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||450; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  const TREE_TOP = 26, ROW_H = 46, R = 18;

  function draw(){
    fit();
    const s = steps[step], w = canvas.clientWidth, PAD = 28;
    const done = s.phase === 'done';
    ctx.fillStyle = C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);

    const colW = (w - 2*PAD) / NCOL;
    const nx = i => PAD + (POS[i][0] + 0.5) * colW;
    const ny = i => TREE_TOP + 22 + POS[i][1] * ROW_H;
    const path = new Set(s.path), wired = new Set(s.wired);

    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 藍 = 下降路徑　紅 = 這一步　橘虛線 = 新節點(尚未接上)　綠 = 已接上', PAD, 16);

    // 邊(既有)
    ctx.lineWidth = 1.8;
    IDS.forEach(i => {
      [2*i, 2*i+1].forEach(c => {
        if (!POS[c] || !V[c]) return;
        const onPath = path.has(i) && path.has(c);
        ctx.strokeStyle = onPath ? C.winS : C.grid;
        ctx.lineWidth = onPath ? 2.6 : 1.6;
        ctx.beginPath(); ctx.moveTo(nx(i), ny(i) + R - 2); ctx.lineTo(nx(c), ny(c) - R + 2); ctx.stroke();
      });
    });

    // 新節點與它那條邊(30 -> 25)
    if (s.newAt) {
      const linked = wired.has(5);
      ctx.lineWidth = 2.4;
      ctx.strokeStyle = linked ? C.okS : C.segS;
      if (!linked) ctx.setLineDash([5,4]);
      ctx.beginPath(); ctx.moveTo(nx(5), ny(5) + R - 2); ctx.lineTo(nx(10), ny(10) - R + 2); ctx.stroke();
      ctx.setLineDash([]);

      ctx.beginPath(); ctx.arc(nx(10), ny(10), R, 0, Math.PI*2);
      ctx.fillStyle = linked ? C.ok : C.seg; ctx.fill();
      ctx.lineWidth = 2.4; ctx.strokeStyle = linked ? C.okS : C.segS;
      if (!linked) ctx.setLineDash([4,3]);
      ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = linked ? C.okT : C.segT; ctx.font='700 14px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('25', nx(10), ny(10));

      ctx.font='700 10.5px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='top';
      ctx.fillStyle = linked ? C.okT : C.segT;
      ctx.fillText(linked ? '已接上' : '尚未接上', nx(10), ny(10) + R + 4);
    }

    // 節點
    IDS.forEach(i => {
      let bg = C.off, bd = C.offS, tx = C.offT;
      if (i === s.focus)        { bg = C.cur; bd = C.curS; tx = C.curT; }
      else if (wired.has(i))    { bg = C.ok;  bd = C.okS;  tx = C.okT; }
      else if (path.has(i))     { bg = C.win; bd = C.winS; tx = C.winT; }
      ctx.beginPath(); ctx.arc(nx(i), ny(i), R, 0, Math.PI*2);
      ctx.fillStyle = bg; ctx.fill();
      ctx.lineWidth = i === s.focus ? 2.6 : 1.5;
      ctx.strokeStyle = bd; ctx.stroke();
      ctx.fillStyle = tx; ctx.font='700 14px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(V[i]), nx(i), ny(i));
    });

    // BAND 2
    const B2 = TREE_TOP + 22 + NROW * ROW_H + 2;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 這一步在做什麼', PAD, B2);
    rr(PAD, B2 + 10, w - 2*PAD, 38, 6);
    const hot = s.phase === 'create' || s.phase === 'wire';
    ctx.fillStyle = done ? C.ok : (s.phase === 'create' ? C.seg : (hot ? C.cur : '#fafaf6')); ctx.fill();
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = done ? C.okS : (s.phase === 'create' ? C.segS : (hot ? C.curS : C.grid)); ctx.stroke();
    ctx.fillStyle = done ? C.okT : (s.phase === 'create' ? C.segT : (hot ? C.curT : C.text));
    ctx.font='700 12px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(s.eq, w/2, B2 + 29);

    // BAND 3 · 回寫鏈
    const B3 = B2 + 62;
    ctx.fillStyle=C.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 回寫鏈(哪一個賦值真的存下了新節點)', PAD, B3);
    rr(PAD, B3 + 10, w - 2*PAD, 38, 6);
    ctx.fillStyle = done ? C.ok : '#fafaf6'; ctx.fill();
    ctx.lineWidth = 1.6; ctx.strokeStyle = done ? C.okS : C.grid; ctx.stroke();
    ctx.fillStyle = done ? C.okT : C.text;
    ctx.font='700 12px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(s.chain, w/2, B3 + 29);

    // BAND 4
    const B4 = B3 + 62;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
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
  function play(){ if(timer){stop();return;} bPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){stop();return;} next(); },2100); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} if(bPlay) bPlay.textContent='Play'; }
  bPrev&&bPrev.addEventListener('click',prev); bNext&&bNext.addEventListener('click',next); bPlay&&bPlay.addEventListener('click',play); bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();}); if(window.ResizeObserver){ new ResizeObserver(()=>{fit();draw();}).observe(canvas); }
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw); fit(); update();
})();
