/* ============================================================
   P110 · Balanced Binary Tree — 由上往下版 · viz
     bool isBalanced(root) {
       if (root == nullptr) return true;
       int left = depth(root->left), right = depth(root->right);
       return abs(left-right) <= 1 && isBalanced(left) && isBalanced(right);
     }
   動畫要傳達的兩件事:
     ① 平衡的定義是「每一個節點」都要滿足,不是只看根
     ② 這份寫法會「重複走訪」—— 深度 d 的節點被走 d+1 次
   例 [3,9,20,null,null,15,7] → true(節點 15 和 7 各被 depth() 走了兩次)
     BAND 1  樹狀圖:節點下標「被 depth() 走過幾次」
     BAND 2  這一步在檢查誰、左右高度是多少
     BAND 3  累計的 depth() 呼叫次數
     BAND 4  為什麼
   所有狀態取自實測 trace(A1 fact sheet),未手推。
   前綴 v110- 。
   ============================================================ */
(function () {
  const canvas = document.getElementById('v110-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('v110-step'), labelEl = document.getElementById('v110-label');
  const bPrev = document.getElementById('v110-prev'), bNext = document.getElementById('v110-next'),
        bPlay = document.getElementById('v110-play'), bReset = document.getElementById('v110-reset');

  const C = { paper:'#ffffff', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf',
    win:'#e3edf5', winS:'#4478c0', winT:'#2f5f9e',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424',
    ok:'#d9e8c7', okS:'#5fa866', okT:'#3f7a3a',
    off:'#f0f0ec', offS:'#cfcfcf', offT:'#a3a099', coral:'#cf3535' };

  /* [3,9,20,null,null,15,7] —— heap 索引,4/5 不存在 */
  const V = { 1:3, 2:9, 3:20, 6:15, 7:7 };
  const POS = { 1:[3.5,0], 2:[1.5,1], 3:[5.5,1], 6:[4.5,2], 7:[6.5,2] };
  const IDS = [1,2,3,6,7];
  const NCOL = 8, NROW = 3;

  /* visits[i] = 該節點目前被 depth() 走過幾次;checked = 已通過檢查的節點 */
  const S = (visits, checked, focus, calls, phase, eq, note, text) =>
    ({ visits, checked, focus, calls, phase, eq, note, text });

  const steps = [
    S({}, [], -1, 0, 'intro',
      'isBalanced(root):平衡 = 「每一個節點」的左右高度差都 <= 1',
      '注意是「每一個節點」,不是只看根 —— 這是這題的定義',
      '<strong>INITIAL</strong> · 樹 <code>[3,9,20,null,null,15,7]</code>。<strong>平衡的定義是「<em>每一個</em>節點的左右高度差都 ≤ 1」</strong>,不是只看根。<b>所以檢查完根之後,還要對左右子樹各遞迴一次。</b>這份寫法是「由上往下」:在每個節點<strong>現場呼叫 <code>depth()</code></strong> 去量左右高度。'),

    S({2:1,3:1,6:1,7:1}, [], 1, 22, 'check',
      '檢查根 3:  depth(9)=1 [走 3 次]   depth(20)=2 [走 7 次]\n|1 - 2| = 1 <= 1  ✓  通過 → && 繼續往下遞迴',
      '光是量根的左右高度,就已經走過整棵樹一遍了',
      '<strong>檢查根節點 3</strong> · <code>depth(9)</code> 花 3 次呼叫、<code>depth(20)</code> 花 7 次呼叫 —— <b>光是量根的左右高度,整棵樹就已經被走過一遍</b>。高度差 <code>|1−2| = 1 ≤ 1</code> ✓,<strong><code>&amp;&amp;</code> 沒有短路,繼續往下遞迴檢查子樹。</strong>'),

    S({2:1,3:1,6:1,7:1}, [2], 2, 22, 'check',
      '檢查節點 9:  depth(null)=0   depth(null)=0\n|0 - 0| = 0 <= 1  ✓  通過(葉節點恆平衡)',
      '葉節點的左右都是 0,一定平衡',
      '<strong>檢查節點 9</strong> · 它是葉節點,左右高度都是 <code>0</code>,<strong>差 0,必定通過</strong>。<b>葉節點永遠是平衡的</b> —— 但程式碼<strong>還是老實地跑了兩次 <code>depth(nullptr)</code></strong>,沒有特判。'),

    S({2:1,3:1,6:2,7:2}, [2], 3, 28, 'repeat',
      '檢查節點 20:  depth(15)=1   depth(7)=1     ← 這兩個節點「又」被走了一次\n|1 - 1| = 0 <= 1  ✓  通過',
      '節點 15 和 7 被 depth() 走了「第二次」—— 這就是重複走訪',
      '<strong>檢查節點 20 —— 注意重複</strong> · 為了量 <code>depth(15)</code> 和 <code>depth(7)</code>,這兩個節點<strong>又被走了一次</strong>。<b>但它們在第 1 步(量 <code>depth(20)</code> 時)就已經被走過了。</b>這就是「由上往下」的代價:<strong>深度 <code>d</code> 的節點會被走 <code>d+1</code> 次</strong>(每個祖先各走它一次)。'),

    S({2:1,3:1,6:2,7:2}, [2,3,6,7], -1, 44, 'done',
      'return true      // 每一個節點都通過了檢查',
      '總共 22 次 depth() 呼叫;若改成「由下往上」只需要 11 次',
      '<strong>完成 · true</strong> · 節點 15 和 7 也各自被檢查(都是葉節點,必定通過)。<strong>總共花了 22 次 <code>depth()</code> 呼叫</strong>,而<strong>「由下往上」的寫法只需要 11 次(<code>2n+1</code>)—— 剛好一半</strong>。<b>樹越平衡、越高,這個差距越大:實測完美樹 <code>n=4095</code> 差 11 倍。</b>'),
  ];

  let step = 0, timer = null;

  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||430; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  const TREE_TOP = 30, ROW_H = 56, R = 19;

  function draw(){
    fit();
    const s = steps[step], w = canvas.clientWidth, PAD = 30;
    const done = s.phase === 'done';
    ctx.fillStyle = C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);

    const colW = (w - 2*PAD) / NCOL;
    const nx = i => PAD + (POS[i][0] + 0.5) * colW;
    const ny = i => TREE_TOP + 24 + POS[i][1] * ROW_H;
    const checked = new Set(s.checked);

    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 節點下方 = 它被 depth() 走過幾次　紅 = 正在檢查　綠 = 已通過', PAD, 16);

    ctx.lineWidth = 1.8;
    IDS.forEach(i => {
      [2*i, 2*i+1].forEach(c => {
        if (!POS[c]) return;
        ctx.strokeStyle = done ? C.okS : (checked.has(i) && checked.has(c) ? C.okS : C.grid);
        ctx.beginPath(); ctx.moveTo(nx(i), ny(i) + R - 2); ctx.lineTo(nx(c), ny(c) - R + 2); ctx.stroke();
      });
    });

    IDS.forEach(i => {
      let bg = C.off, bd = C.offS, tx = C.offT;
      if (done)               { bg = C.ok;  bd = C.okS;  tx = C.okT; }
      else if (i === s.focus) { bg = C.cur; bd = C.curS; tx = C.curT; }
      else if (checked.has(i)){ bg = C.ok;  bd = C.okS;  tx = C.okT; }
      else if (s.visits[i])   { bg = C.win; bd = C.winS; tx = C.winT; }
      ctx.beginPath(); ctx.arc(nx(i), ny(i), R, 0, Math.PI*2);
      ctx.fillStyle = bg; ctx.fill();
      ctx.lineWidth = i === s.focus ? 2.6 : 1.6; ctx.strokeStyle = bd; ctx.stroke();
      ctx.fillStyle = tx; ctx.font='700 15px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(V[i]), nx(i), ny(i));

      // 走訪次數:節點正下方,第 2 次以上用紅字強調
      const nv = s.visits[i];
      if (nv) {
        const twice = nv >= 2;
        ctx.fillStyle = twice ? C.curT : C.dim;
        ctx.font = (twice ? '700 ' : '600 ') + '11.5px "JetBrains Mono", monospace';
        ctx.textAlign='center'; ctx.textBaseline='top';
        ctx.fillText('走過 ' + nv + ' 次', nx(i), ny(i) + R + 4);
      }
    });

    // BAND 2
    const B2 = TREE_TOP + 24 + NROW * ROW_H + 6;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 這一步在檢查誰', PAD, B2);
    const lines = s.eq.split('\n');
    const bh2 = lines.length > 1 ? 54 : 40;
    rr(PAD, B2 + 10, w - 2*PAD, bh2, 6);
    const hot = s.phase === 'repeat';
    ctx.fillStyle = done ? C.ok : (hot ? C.cur : '#fafaf6'); ctx.fill();
    ctx.lineWidth = 1.6; ctx.strokeStyle = done ? C.okS : (hot ? C.curS : C.grid); ctx.stroke();
    ctx.fillStyle = done ? C.okT : (hot ? C.curT : C.text);
    ctx.font='700 12.5px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
    if (lines.length > 1) { ctx.fillText(lines[0], w/2, B2 + 26); ctx.fillText(lines[1], w/2, B2 + 47); }
    else                  { ctx.fillText(lines[0], w/2, B2 + 30); }

    // BAND 3 · 累計呼叫數
    const B3 = B2 + bh2 + 30;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 累計 depth() 呼叫次數(由下往上版只要 11 次)', PAD, B3);
    rr(PAD, B3 + 12, 130, 32, 5);
    ctx.fillStyle = done ? C.ok : (hot ? C.cur : C.win); ctx.fill();
    ctx.lineWidth = hot ? 2.4 : 1.4;
    ctx.strokeStyle = done ? C.okS : (hot ? C.curS : C.winS); ctx.stroke();
    ctx.fillStyle = done ? C.okT : (hot ? C.curT : C.winT);
    ctx.font='700 15px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(String(s.calls) + ' 次', PAD + 65, B3 + 28);

    // BAND 4
    const B4 = B3 + 62;
    ctx.fillStyle=C.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 4 · 為什麼', PAD, B4);
    rr(PAD, B4 + 10, w - 2*PAD, 40, 6);
    ctx.fillStyle = done ? C.ok : '#fafaf6'; ctx.fill();
    ctx.lineWidth = 1.6; ctx.strokeStyle = done ? C.okS : C.grid; ctx.stroke();
    ctx.fillStyle = done ? C.okT : C.text;
    ctx.font='600 12.5px "Noto Sans TC", sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(s.note, w/2, B4 + 30);
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
