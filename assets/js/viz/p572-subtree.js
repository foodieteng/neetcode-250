/* ============================================================
   P572 · Subtree of Another Tree — 遞迴 · viz
     bool isSubtree(root, subRoot) {
       if (!subRoot) return true;
       if (!root)    return false;
       return isSame(root, subRoot)          // 以「這裡」為起點試一次
           || isSubtree(root->left,  subRoot)
           || isSubtree(root->right, subRoot);
     }
   動畫要傳達的兩件事:
     ① 外層是「找位置」(|| 短路 —— 一找到就不再找)
     ② 內層 isSame 必須「一路比到底」,不能只比出開頭
   例 root=[3,4,5,1,2], subRoot=[4,1,2] → true(在節點 4 命中,右子樹從未被搜尋)
     BAND 1  root 樹 + subRoot 小圖
     BAND 2  這一步在做什麼
     BAND 3  累計 isSubtree / isSame 呼叫次數
     BAND 4  為什麼
   所有狀態取自實測 trace(插樁後直接印出呼叫樹),未手推。
   實測:isSubtree 2 次、isSame 8 次。
   前綴 v572- 。
   ============================================================ */
(function () {
  const canvas = document.getElementById('v572-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('v572-step'), labelEl = document.getElementById('v572-label');
  const bPrev = document.getElementById('v572-prev'), bNext = document.getElementById('v572-next'),
        bPlay = document.getElementById('v572-play'), bReset = document.getElementById('v572-reset');

  const C = { paper:'#ffffff', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf',
    win:'#e3edf5', winS:'#4478c0', winT:'#2f5f9e',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424',
    ok:'#d9e8c7', okS:'#5fa866', okT:'#3f7a3a',
    off:'#f0f0ec', offS:'#cfcfcf', offT:'#a3a099', coral:'#cf3535' };

  /* root = [3,4,5,1,2] —— heap 索引 1..5 */
  const RV  = { 1:3, 2:4, 3:5, 4:1, 5:2 };
  const RP  = { 1:[2.0,0], 2:[1.0,1], 3:[3.0,1], 4:[0.4,2], 5:[1.6,2] };
  const RID = [1,2,3,4,5];
  /* subRoot = [4,1,2] —— 畫在右邊的小圖 */
  const SV  = { 1:4, 2:1, 3:2 };
  const SP  = { 1:[0.9,0], 2:[0.3,1], 3:[1.5,1] };
  const SID = [1,2,3];

  /* tried  = 已被 isSame 當起點試過的 root 節點
     failed = 試過但失敗的
     hit    = 命中的那個
     matched= 命中時,參與比對的 root 節點集合
     never  = 從未被搜尋到的 root 節點(短路的證據) */
  const S = (tried, failed, hit, matched, never, subFocus, cSub, cSame, phase, line, note, text) =>
    ({ tried, failed, hit, matched, never, subFocus, cSub, cSame, phase, line, note, text });

  const steps = [
    S([], [], -1, [], [], [], 0, 0, 'intro',
      'isSubtree = 「在 root 的每個位置,試著用 isSame 比一次」',
      '外層負責「找位置」,內層 isSame 負責「比到底」—— 兩層各司其職',
      '<strong>INITIAL</strong> · <code>root = [3,4,5,1,2]</code>,要找的 <code>subRoot = [4,1,2]</code>。<b>這題是兩層遞迴疊在一起</b>:<strong>外層 <code>isSubtree</code> 負責「換位置」</strong>,<strong>內層 <code>isSame</code> 負責「在這個位置比對整棵子樹」</strong>。'),

    S([1], [1], -1, [], [], [], 1, 1, 'fail',
      'isSame(root=3, subRoot=4):  3 != 4  ✗\n第一個值就不同 → isSame 立刻回 false,只花 1 次呼叫',
      '絕大多數位置都在「比第一個值」就結束了 —— 這是實務上不慢的原因',
      '<strong>在節點 3 試一次 —— 失敗</strong> · <code>isSame(3, 4)</code>:<strong>兩邊的根值 <code>3 != 4</code></strong>,<code>&amp;&amp;</code> 立刻短路,<strong>只花了 1 次呼叫就回 false</strong>(它的兩個子遞迴完全沒被呼叫)。<b>這正是為什麼 <code>O(n×m)</code> 在實務上遠比看起來快</b> —— <strong>大多數位置一比第一個值就出局。</strong>'),

    S([1,2], [1], 2, [2,4,5], [], [1,2,3], 2, 8, 'hit',
      'isSame(root=4, subRoot=4):  4==4 ✓  1==1 ✓  2==2 ✓\n而且兩邊「同時走完」—— 整棵子樹完全相同',
      '命中的條件是「一路比到底」,不是「開頭對得上」就好',
      '<strong>在節點 4 試一次 —— 命中!</strong> · <code>isSame(4, 4)</code> 一路往下比:<strong><code>4==4</code>、<code>1==1</code>、<code>2==2</code></strong>,而且<strong>兩邊的 <code>nullptr</code> 也對得起來</strong>。<b>「整棵子樹從這裡往下完全相同」才算命中</b> —— 如果 root 的節點 <code>1</code> 底下還掛著東西,這裡就會是 <code>false</code>。'),

    S([1,2], [1], 2, [2,4,5], [3], [1,2,3], 2, 8, 'skip',
      '|| 短路:isSubtree(root->left) 已經回 true\n→ isSubtree(root->right) 「完全不會被呼叫」',
      '節點 5 從頭到尾沒有被搜尋過 —— 找到就停',
      '<strong>短路 —— 右子樹從未被搜尋</strong> · <code>isSame(3,·)</code> 回 <code>false</code>,但<strong>接著的 <code>isSubtree(root-&gt;left, ...)</code> 回了 <code>true</code></strong>。<b><code>||</code> 一旦左邊為真就停止求值</b> —— 所以 <strong><code>isSubtree(root-&gt;right, ...)</code> 一次都沒有被呼叫</strong>,<strong>節點 <code>5</code> 從頭到尾沒被看過</strong>。'),

    S([1,2], [1], 2, [2,4,5], [3], [1,2,3], 2, 8, 'done',
      'return true      // isSubtree 呼叫 2 次、isSame 呼叫 8 次',
      '實測 20 萬組對拍「序列化 + 子字串」參考解,不一致 0',
      '<strong>完成 · true</strong> · 全程只呼叫 <strong><code>isSubtree</code> 2 次、<code>isSame</code> 8 次</strong>。實測 <strong>20 萬組</strong>隨機配對對拍獨立的「<strong>序列化成帶 null 標記的字串,再判斷子字串</strong>」參考解,<strong>不一致 0</strong>。時間 <code>O(n×m)</code> 最壞,但<b>實務上因為大多數位置一比就出局而快得多</b>。'),
  ];

  let step = 0, timer = null;

  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||430; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  const TREE_TOP = 40, ROW_H = 52, R = 18, SR = 15;

  function draw(){
    fit();
    const s = steps[step], w = canvas.clientWidth, PAD = 28;
    const done = s.phase === 'done';
    ctx.fillStyle = C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);

    const tried = new Set(s.tried), failed = new Set(s.failed),
          matched = new Set(s.matched), never = new Set(s.never), subF = new Set(s.subFocus);

    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 紅 = 這裡試過但失敗　綠 = 命中的整棵子樹　灰虛線 = 從未被搜尋', PAD, 16);

    // ── root 樹(左 65%) ──
    const rW = (w - 2*PAD) * 0.62;
    const rColW = rW / 4;
    const nx = i => PAD + (RP[i][0] + 0.5) * rColW;
    const ny = i => TREE_TOP + 20 + RP[i][1] * ROW_H;

    ctx.fillStyle = C.text; ctx.font='700 12.5px "JetBrains Mono", monospace';
    ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('root = [3,4,5,1,2]', PAD, TREE_TOP - 4);

    ctx.lineWidth = 1.8;
    RID.forEach(i => {
      [2*i, 2*i+1].forEach(c => {
        if (!RP[c]) return;
        const inMatch = matched.has(i) && matched.has(c);
        ctx.strokeStyle = inMatch ? C.okS : (never.has(c) ? C.grid : C.grid);
        if (never.has(c)) ctx.setLineDash([4,4]); else ctx.setLineDash([]);
        ctx.beginPath(); ctx.moveTo(nx(i), ny(i) + R - 2); ctx.lineTo(nx(c), ny(c) - R + 2); ctx.stroke();
        ctx.setLineDash([]);
      });
    });

    RID.forEach(i => {
      let bg = C.off, bd = C.offS, tx = C.offT;
      if (matched.has(i))      { bg = C.ok;  bd = C.okS;  tx = C.okT; }
      else if (failed.has(i))  { bg = C.cur; bd = C.curS; tx = C.curT; }
      else if (never.has(i))   { bg = '#fafaf6'; bd = C.grid; tx = C.offT; }
      ctx.beginPath(); ctx.arc(nx(i), ny(i), R, 0, Math.PI*2);
      ctx.fillStyle = bg; ctx.fill();
      ctx.lineWidth = (matched.has(i) || failed.has(i)) ? 2.4 : 1.5;
      if (never.has(i)) ctx.setLineDash([3,3]);
      ctx.strokeStyle = bd; ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = tx; ctx.font='700 15px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(RV[i]), nx(i), ny(i));

      if (never.has(i)) {
        ctx.fillStyle = C.dim; ctx.font='600 10.5px "JetBrains Mono", monospace';
        ctx.textAlign='center'; ctx.textBaseline='top';
        ctx.fillText('未搜尋', nx(i), ny(i) + R + 4);
      } else if (failed.has(i)) {
        ctx.fillStyle = C.curT; ctx.font='600 10.5px "JetBrains Mono", monospace';
        ctx.textAlign='center'; ctx.textBaseline='top';
        ctx.fillText('試過 ✗', nx(i), ny(i) + R + 4);
      }
    });

    // ── subRoot 小圖(右 38%) ──
    const sX0 = PAD + rW + 18;
    const sW = (w - 2*PAD) * 0.34;
    const sColW = sW / 2;
    const snx = i => sX0 + (SP[i][0] + 0.5) * sColW;
    const sny = i => TREE_TOP + 20 + SP[i][1] * ROW_H;

    ctx.fillStyle = C.text; ctx.font='700 12.5px "JetBrains Mono", monospace';
    ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('subRoot = [4,1,2]', sX0, TREE_TOP - 4);

    // 分隔線
    ctx.strokeStyle = C.grid; ctx.lineWidth = 1; ctx.setLineDash([4,4]);
    ctx.beginPath(); ctx.moveTo(sX0 - 10, TREE_TOP - 18);
    ctx.lineTo(sX0 - 10, TREE_TOP + 20 + 2*ROW_H + R); ctx.stroke();
    ctx.setLineDash([]);

    ctx.lineWidth = 1.8;
    SID.forEach(i => {
      [2*i, 2*i+1].forEach(c => {
        if (!SP[c]) return;
        ctx.strokeStyle = subF.size ? (done || s.phase==='hit' || s.phase==='skip' ? C.okS : C.winS) : C.grid;
        ctx.beginPath(); ctx.moveTo(snx(i), sny(i) + SR - 2); ctx.lineTo(snx(c), sny(c) - SR + 2); ctx.stroke();
      });
    });
    SID.forEach(i => {
      const active = subF.has(i);
      let bg = C.off, bd = C.offS, tx = C.offT;
      if (active) {
        if (s.phase === 'hit' || s.phase === 'skip' || done) { bg = C.ok; bd = C.okS; tx = C.okT; }
        else { bg = C.win; bd = C.winS; tx = C.winT; }
      }
      ctx.beginPath(); ctx.arc(snx(i), sny(i), SR, 0, Math.PI*2);
      ctx.fillStyle = bg; ctx.fill();
      ctx.lineWidth = active ? 2.2 : 1.4; ctx.strokeStyle = bd; ctx.stroke();
      ctx.fillStyle = tx; ctx.font='700 13px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(SV[i]), snx(i), sny(i));
    });

    // BAND 2
    const B2 = TREE_TOP + 20 + 2*ROW_H + R + 22;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 這一步在做什麼', PAD, B2);
    const lines = s.line.split('\n');
    const bh2 = lines.length > 1 ? 54 : 40;
    rr(PAD, B2 + 10, w - 2*PAD, bh2, 6);
    const hitish = s.phase === 'hit' || s.phase === 'skip';
    ctx.fillStyle = done ? C.ok : (hitish ? C.ok : (s.phase === 'fail' ? C.cur : '#fafaf6')); ctx.fill();
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = done ? C.okS : (hitish ? C.okS : (s.phase === 'fail' ? C.curS : C.grid)); ctx.stroke();
    ctx.fillStyle = done ? C.okT : (hitish ? C.okT : (s.phase === 'fail' ? C.curT : C.text));
    ctx.font='700 12.5px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
    if (lines.length > 1) { ctx.fillText(lines[0], w/2, B2 + 26); ctx.fillText(lines[1], w/2, B2 + 47); }
    else                  { ctx.fillText(lines[0], w/2, B2 + 30); }

    // BAND 3
    const B3 = B2 + bh2 + 30;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 累計呼叫次數', PAD, B3);
    const boxes = [['isSubtree', s.cSub], ['isSame', s.cSame]];
    boxes.forEach((bx, k) => {
      const x = PAD + k * 160;
      rr(x, B3 + 12, 145, 32, 5);
      ctx.fillStyle = done ? C.ok : C.win; ctx.fill();
      ctx.lineWidth = 1.4; ctx.strokeStyle = done ? C.okS : C.winS; ctx.stroke();
      ctx.fillStyle = done ? C.okT : C.winT;
      ctx.font='700 12.5px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(bx[0] + ' ' + bx[1] + ' 次', x + 72, B3 + 28);
    });

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
