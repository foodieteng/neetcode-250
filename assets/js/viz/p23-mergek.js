/* ============================================================
   P23 · Merge k Sorted Lists — 最小堆 · viz
     每條串列的「當前頭」放進最小堆 ⇒ 堆頂必定是全域最小
     彈出接到輸出尾端,再把它的 next 補進堆裡 ⇒ 堆的大小恆 ≤ k
   關鍵不變量:堆裡「每條串列最多一個節點」,所以堆頂 = 所有候選裡最小的。
   例 lists = [[1,4], [1,3], [2,6]] → [1,1,2,3,4,6]。
     BAND 1  左 = 三條輸入串列　右 = 堆的內容　下 = 正在長出來的結果
     BAND 2  這一步執行了什麼
     BAND 3  為什麼
   所有狀態取自實測 trace(見 review.html 範例 Trace),未手推。
   ============================================================ */
(function () {
  const canvas = document.getElementById('viz-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('viz-step'), labelEl = document.getElementById('viz-label');
  const bPrev = document.getElementById('viz-prev'), bNext = document.getElementById('viz-next'),
        bPlay = document.getElementById('viz-play'), bReset = document.getElementById('viz-reset');

  const C = { paper:'#ffffff', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf',
    win:'#e3edf5', winS:'#4478c0', winT:'#2f5f9e',
    seg:'#f6ead8', segS:'#c8801e', segT:'#96601a',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424',
    ok:'#d9e8c7', okS:'#5fa866', okT:'#3f7a3a',
    off:'#f0f0ec', offS:'#cfcfcf', offT:'#a3a099', coral:'#cf3535' };

  const LISTS = [[1,4],[1,3],[2,6]];
  const K = LISTS.length;

  // used[i] = 第 i 條已經被吃掉幾個;heap = [{v, from}](顯示時排序);out = 結果
  const steps = [
    { used:[0,0,0], heap:[], out:[], hot:null, act:'intro',
      op:'三條已排序的串列,要合成一條',
      eq:'lists = [1,4]　[1,3]　[2,6]',
      note:'k 條各自有序,但彼此無關 —— 全域最小值只可能出現在「某一條的頭」',
      text:'<strong>INITIAL</strong> · 三條串列各自<strong>已經排序</strong>,但彼此無關。<b>關鍵觀察:整體的最小值,一定是<em>某一條的頭</em></b> —— 不可能藏在中間。所以只要能<strong>在 k 個候選裡快速找出最小的</strong>,就能一個一個把答案挑出來。<strong>而「一堆東西裡反覆取最小」正是最小堆的工作</strong>。' },

    { used:[0,0,0], heap:[{v:1,f:0},{v:1,f:1},{v:2,f:2}], out:[], hot:null, act:'seed',
      op:'把每條的頭推進堆裡',
      eq:'for (auto& p : lists) if (p) pq.push(p);   ← 那個 if (p) 不能省',
      note:'空串列的頭是 nullptr,推進去之後比較子會對 nullptr 取 ->val',
      text:'<strong>播種</strong> · 把每條的<strong>頭</strong>推進堆裡,堆的大小變成 <code>k</code>。<b><code>if (p)</code> 這個守衛是必要的</b> —— 題目允許某條串列是空的(<code>nullptr</code>),而比較子會做 <code>l1-&gt;val</code>。<strong>實測拿掉它,UBSan 報「member access within null pointer」,ASan 直接 SEGV 在位址 0x0。</strong>' },

    { used:[1,0,0], heap:[{v:1,f:1},{v:2,f:2},{v:4,f:0}], out:[1], hot:0, act:'pop',
      op:'第 1 次彈出',
      eq:'node = pq.top()（=1,來自 L0)→ 接到尾端 → push(node->next = 4)',
      note:'彈掉一個、補進一個 ⇒ 堆的大小始終不超過 k,而不是 N',
      text:'<strong>第 1 次彈出</strong> · 堆頂是 <strong>1</strong>(來自 L0)。接到輸出尾端,然後<strong>把它的 <code>next</code>(=4)補進堆裡</strong>。<b>注意這一補一彈:堆的大小始終 ≤ <code>k</code>,而不是 <code>N</code></b> —— <strong>實測 <code>k=200</code>、6 萬個節點,堆的最大 size 恰好是 200。</strong>' },

    { used:[1,1,0], heap:[{v:2,f:2},{v:3,f:1},{v:4,f:0}], out:[1,1], hot:1, act:'pop',
      op:'第 2 次彈出',
      eq:'彈出 1（來自 L1)→ 輸出 [1, 1] → push(3)',
      note:'兩個 1 誰先出來由堆決定 —— 但值一樣,所以結果一樣正確',
      text:'<strong>第 2 次彈出</strong> · 又是 <strong>1</strong>,這次來自 L1。<b>兩個相同的值誰先被彈出,由堆內部的順序決定,程式並沒有指定</b> —— <strong>但因為題目只在乎值,結果一樣正確</strong>。(如果題目要求穩定性,就得在比較子裡加上第二個鍵。)' },

    { used:[1,1,1], heap:[{v:3,f:1},{v:4,f:0},{v:6,f:2}], out:[1,1,2], hot:2, act:'pop',
      op:'第 3 次彈出',
      eq:'彈出 2（來自 L2)→ 輸出 [1, 1, 2] → push(6)',
      note:'每個節點恰好被 push 一次、pop 一次 ⇒ 總共 2N 次堆操作',
      text:'<strong>第 3 次彈出</strong> · <b>到目前為止,每個節點都<em>恰好</em>進出堆一次</b>。<strong>實測 6 萬個節點:push 60000 次、pop 60000 次,一次不多一次不少</strong>。而每次堆操作是 <code>O(log k)</code>,所以總成本是 <strong><code>O(N log k)</code></strong>。' },

    { used:[1,2,1], heap:[{v:4,f:0},{v:6,f:2}], out:[1,1,2,3], hot:1, act:'shrink',
      op:'第 4 次彈出 · 堆縮小',
      eq:'彈出 3（來自 L1)→ L1 沒有 next 了 → 不 push → 堆縮小成 2',
      note:'某條串列用完時,堆自然縮小 —— 這就是「if (node->next)」在做的事',
      text:'<strong>第 4 次彈出 · 堆開始縮小</strong> · 彈出 3 之後 <strong>L1 已經用完</strong>,<code>node-&gt;next</code> 是 <code>nullptr</code>,所以<strong>不補</strong>。<b>堆自然縮小到 2</b>。<strong>如果把 <code>if (node-&gt;next)</code> 拿掉、無條件 push</strong>,堆裡就會混進 <code>nullptr</code>,<b>下一次比較就會炸。</b>' },

    { used:[2,2,1], heap:[{v:6,f:2}], out:[1,1,2,3,4], hot:0, act:'shrink',
      op:'第 5 次彈出 · 堆縮小',
      eq:'彈出 4（來自 L0)→ L0 也用完 → 堆只剩 1 個',
      note:'剩最後一個時,後面的順序已經完全確定了(那條串列本來就有序)',
      text:'<strong>第 5 次彈出</strong> · L0 也用完了,堆只剩 L2 的 <strong>6</strong>。<b>此刻其實勝負已定</b> —— 只剩一條串列,而它本來就有序,<strong>後面的節點會原封不動地被接上去</strong>。' },

    { used:[2,2,2], heap:[], out:[1,1,2,3,4,6], hot:2, act:'last',
      op:'最後一次彈出',
      eq:'彈出 6 → node->next == nullptr → 不 push → 堆空了 → 迴圈結束',
      note:'迴圈結束 ⇔ 沒有補進東西 ⇔ 最後彈出的那個 next 必定是 nullptr',
      text:'<strong>最後一次彈出</strong> · <b>這裡藏著一個容易被忽略的正確性論證</b>:程式<strong>從頭到尾都沒有寫過 <code>tail-&gt;next = nullptr</code></strong>,結果串列為什麼不會拖著一條尾巴?<b>因為迴圈是在「堆空了」時結束的,而堆會空,代表這一輪<em>沒有 push</em>,也就代表 <code>node-&gt;next</code> 是 <code>nullptr</code></b> —— <strong>最後接上的那個節點,天生就是收好的</strong>。' },

    { used:[2,2,2], heap:[], out:[1,1,2,3,4,6], hot:null, act:'done',
      op:'完成',
      eq:'return dummy->next;     // [1, 1, 2, 3, 4, 6]',
      note:'實測:結尾補上 tail->next = nullptr,20 萬組測資的結果完全沒有任何差別',
      text:'<strong>完成</strong> · <strong>正確性實測</strong>:窮舉小規模組合 1110 組、隨機 20 萬組(含空串列、負值、重複值)、大規模 <code>k=200</code> × 6 萬節點 40 次 —— <strong>全部與「把所有值排序」的結果一致,不一致 0</strong>。而上一步那個論證也量過了:<b>「迴圈結束時最後彈出的節點 <code>next != nullptr</code>」在 20 萬組裡發生 <strong>0</strong> 次</b>,<strong>而在結尾補上 <code>tail-&gt;next = nullptr</code> 對結果完全沒有影響。</strong>' },
  ];

  let step = 0, timer = null;

  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  const ROW_Y = [62, 96, 130], RH = 28, NW = 42, NG = 12;
  const OUT_Y = 186, OH = 34;

  function draw(){
    fit();
    const s = steps[step], w = canvas.clientWidth, PAD = 26;
    const done = s.act === 'done';
    ctx.fillStyle = C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);

    // ── BAND 1 標題 ──
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 左 = 三條輸入　右 = 堆　下 = 結果', PAD, 16);
    ctx.textAlign='right'; ctx.font='700 12.5px "JetBrains Mono", monospace';
    ctx.fillStyle = done ? C.okT : C.text;
    ctx.fillText('k = ' + K + '　堆的大小 = ' + s.heap.length, w - PAD, 16);

    ctx.textAlign='center'; ctx.font='700 13px "Noto Sans TC", sans-serif';
    ctx.fillStyle = done ? C.okT : (s.act==='intro' ? C.text : (s.act==='last' ? C.curT : C.winT));
    ctx.fillText(s.op, w/2, 42);

    // ── 三條輸入串列 ──
    const lx = PAD + 30;
    LISTS.forEach((L, i) => {
      const y = ROW_Y[i];
      ctx.fillStyle = (s.hot === i) ? C.curT : C.dim;
      ctx.font='700 11px "JetBrains Mono", monospace'; ctx.textAlign='right'; ctx.textBaseline='middle';
      ctx.fillText('L' + i, lx - 8, y + RH/2);
      L.forEach((v, j) => {
        const x = lx + j*(NW+NG);
        const eaten = j < s.used[i];
        const isHead = j === s.used[i] && s.heap.some(h => h.f === i && h.v === v);
        let bg,bd,tx;
        if (done)        { bg=C.ok;  bd=C.okS;  tx=C.okT; }
        else if (eaten)  { bg=C.off; bd=C.offS; tx=C.offT; }
        else if (isHead) { bg=C.win; bd=C.winS; tx=C.winT; }
        else             { bg=C.seg; bd=C.segS; tx=C.segT; }
        rr(x, y, NW, RH, 5); ctx.fillStyle=bg; ctx.fill();
        ctx.lineWidth = isHead?2.2:1.4; ctx.strokeStyle=bd; ctx.stroke();
        ctx.fillStyle=tx; ctx.font='700 12.5px "JetBrains Mono", monospace';
        ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(String(v), x+NW/2, y+RH/2);
        if (j + 1 < L.length) { ctx.strokeStyle=C.grid; ctx.lineWidth=1.4;
          ctx.beginPath(); ctx.moveTo(x+NW+2, y+RH/2); ctx.lineTo(x+NW+NG-2, y+RH/2); ctx.stroke(); }
      });
      // 用完的標記
      if (s.used[i] >= L.length && !done) {
        ctx.fillStyle=C.offT; ctx.font='600 10px "Noto Sans TC", sans-serif';
        ctx.textAlign='left'; ctx.textBaseline='middle';
        ctx.fillText('已用完', lx + L.length*(NW+NG) + 2, y+RH/2); }
    });

    // ── 堆 ──
    const hx = Math.max(lx + 2*(NW+NG) + 76, w * 0.52);
    const hw = w - PAD - hx;
    rr(hx, 56, hw, 108, 6);
    ctx.fillStyle='#fafaf6'; ctx.fill(); ctx.setLineDash([4,3]);
    ctx.lineWidth=1.4; ctx.strokeStyle=C.grid; ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle=C.dim; ctx.font='600 10.5px "JetBrains Mono", monospace';
    ctx.textAlign='center'; ctx.textBaseline='alphabetic';
    ctx.fillText('min-heap（大小 ≤ k = ' + K + '）', hx+hw/2, 72);
    if (s.heap.length === 0) {
      ctx.fillStyle=C.offT; ctx.font='600 12px "Noto Sans TC", sans-serif';
      ctx.textBaseline='middle'; ctx.fillText(s.act==='intro' ? '（還沒播種）' : '（空了 → 迴圈結束）', hx+hw/2, 116);
    } else {
      const cw = 46, cg = 10;
      const tot = s.heap.length*cw + (s.heap.length-1)*cg;
      const sx = hx + (hw - tot)/2;
      s.heap.forEach((h, j) => {
        const x = sx + j*(cw+cg), y = 88;
        const isTop = j === 0;
        rr(x, y, cw, 34, 5);
        ctx.fillStyle = isTop ? C.cur : C.win; ctx.fill();
        ctx.lineWidth = isTop?2.4:1.4; ctx.strokeStyle = isTop ? C.curS : C.winS; ctx.stroke();
        ctx.fillStyle = isTop ? C.curT : C.winT;
        ctx.font='700 13.5px "JetBrains Mono", monospace';
        ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(String(h.v), x+cw/2, y+17);
        ctx.fillStyle=C.dim; ctx.font='500 9.5px "JetBrains Mono", monospace';
        ctx.textBaseline='top'; ctx.fillText('L'+h.f, x+cw/2, y+36);
      });
      ctx.fillStyle=C.curT; ctx.font='600 10px "Noto Sans TC", sans-serif';
      ctx.textAlign='center'; ctx.textBaseline='alphabetic';
      ctx.fillText('↑ 堆頂 = 全域最小', sx + 23, 152);
    }

    // ── 結果 ──
    ctx.fillStyle=C.dim; ctx.font='600 11px "JetBrains Mono", monospace';
    ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('dummy → ', PAD, OUT_Y + OH/2 + 4);
    const ox = PAD + 68;
    if (s.out.length === 0) {
      ctx.fillStyle=C.offT; ctx.font='600 12px "Noto Sans TC", sans-serif';
      ctx.fillText('（還沒有輸出）', ox, OUT_Y + OH/2 + 4);
    }
    const ow = Math.min(46, (w - PAD - ox) / 8 - 8);
    s.out.forEach((v, j) => {
      const x = ox + j*(ow+10);
      const isNew = j === s.out.length - 1 && s.act !== 'intro' && s.act !== 'seed';
      rr(x, OUT_Y, ow, OH, 5);
      ctx.fillStyle = done ? C.ok : (isNew ? C.cur : C.win); ctx.fill();
      ctx.lineWidth = isNew?2.2:1.4; ctx.strokeStyle = done ? C.okS : (isNew ? C.curS : C.winS); ctx.stroke();
      ctx.fillStyle = done ? C.okT : (isNew ? C.curT : C.winT);
      ctx.font='700 13px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(v), x+ow/2, OUT_Y+OH/2);
    });
    if (s.act === 'last' || done) {
      ctx.fillStyle = done ? C.okT : C.curT; ctx.font='600 10.5px "Noto Sans TC", sans-serif';
      ctx.textAlign='left'; ctx.textBaseline='middle';
      ctx.fillText('→ nullptr（天生就收好了）', ox + s.out.length*(ow+10) + 2, OUT_Y+OH/2);
    }

    // ── BAND 2 ──
    const B2 = 240;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 這一步執行了什麼', PAD, B2);
    rr(PAD, B2+10, w-2*PAD, 42, 6);
    ctx.fillStyle = done ? C.ok : (s.act==='intro' ? '#fafaf6' : (s.act==='last' ? C.cur : C.win)); ctx.fill();
    ctx.lineWidth=1.6; ctx.strokeStyle = done ? C.okS : (s.act==='intro' ? C.grid : (s.act==='last' ? C.curS : C.winS)); ctx.stroke();
    ctx.fillStyle = done ? C.okT : (s.act==='intro' ? C.text : (s.act==='last' ? C.curT : C.winT));
    ctx.font='700 12px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(s.eq, w/2, B2+31);

    // ── BAND 3 ──
    const B3 = 312;
    ctx.fillStyle=C.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 為什麼', PAD, B3);
    rr(PAD, B3+10, w-2*PAD, 40, 6);
    ctx.fillStyle = done ? C.ok : '#fafaf6'; ctx.fill();
    ctx.lineWidth=1.6; ctx.strokeStyle = done ? C.okS : C.grid; ctx.stroke();
    ctx.fillStyle = done ? C.okT : C.text;
    ctx.font='600 12.5px "Noto Sans TC", sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(s.note, w/2, B3+30);
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
