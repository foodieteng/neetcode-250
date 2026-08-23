/* ============================================================
   P21 · Merge Two Sorted Lists — dummy + tail 逐節點接線 · viz
   兩條都有序 ⇒ 每一步只要比兩個「頭」,小的那個接到結果尾巴後面。
   dummy 的作用:讓「接第一個節點」和「接第 k 個節點」變成同一行 tail->next = ...
   迴圈結束時必有一條空了,剩下那條「整條」一次接上 —— O(1),不必逐個搬。
   例 [1,2,4] + [1,3,4] → 5 圈 + 一次收尾。
     BAND 1  list1 / list2 兩排(已用掉的變灰)+ 下方逐漸長出來的結果
     BAND 2  這一圈的比較
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

  const L1 = [1,2,4], L2 = [1,3,4];

  // res:已接好的節點 [{v, src}];i1/i2:兩條各用掉幾個;pick:這一圈取自哪條
  const steps = [
    { i1:0, i2:0, res:[], pick:null, spliced:false, act:'intro',
      eq:'ListNode* dummy = new ListNode();   tail = dummy;',
      note:'dummy 讓「接第一個」和「接第 k 個」變成同一行程式碼,不用為第一次特判',
      text:'<strong>INITIAL</strong> · 兩條都<strong>已經有序</strong>,所以每一步只需要比<strong>兩個頭</strong>,小的那個接過來。<strong>dummy 是一個假的頭節點</strong> —— 有了它,<code>tail-&gt;next = …</code> 這一行從第一次到最後一次都長得一樣,不必為「結果還是空的」寫特判。最後回傳 <code>dummy-&gt;next</code>。' },

    { i1:1, i2:0, res:[{v:1,src:1}], pick:1, spliced:false, act:'pick',
      eq:'l1->val = 1  <=  l2->val = 1   → 接 l1 的節點',
      note:'相等時取 l1 —— 判斷式寫 <= 而不是 <,這叫「穩定合併」',
      text:'<strong>第 1 圈</strong> · <code>1 &lt;= 1</code>,<strong>平手時取 l1</strong>。這就是 <code>&lt;=</code> 而不是 <code>&lt;</code> 的意義:相等時保留左邊那條的節點,合併是<strong>穩定的</strong>。對這題來說值一樣所以都會過,但<strong>節點身分不同</strong> —— 實測 <code>[1,1] + [1,1]</code> 兩種寫法的節點來源順序<strong>完全相反</strong>。' },

    { i1:1, i2:1, res:[{v:1,src:1},{v:1,src:2}], pick:2, spliced:false, act:'pick',
      eq:'l1->val = 2  >  l2->val = 1   → 接 l2 的節點',
      note:'接完就 tail = tail->next —— 忘了這行,tail 會一直停在 dummy 上',
      text:'<strong>第 2 圈</strong> · 換 l2 比較小。接完之後<strong>一定要 <code>tail = tail-&gt;next</code></strong> 把尾巴推過去 —— 實測忘了這行,<code>[0] + [0]</code> 就只回 <code>[0]</code>,4900 種組合<strong>錯 4761 種</strong>(每次都覆蓋掉上一次接的)。' },

    { i1:2, i2:1, res:[{v:1,src:1},{v:1,src:2},{v:2,src:1}], pick:1, spliced:false, act:'pick',
      eq:'l1->val = 2  <=  l2->val = 3   → 接 l1 的節點',
      note:'每一圈只做 O(1) 的比較與接線,總共最多 m+n 圈',
      text:'<strong>第 3 圈</strong> · 每一圈<strong>消耗掉恰好一個節點</strong>,所以最多跑 <code>m + n</code> 圈 ⇒ 時間 <code>O(m+n)</code>。注意結果列的顏色開始交錯 —— 那就是兩條在合併。' },

    { i1:2, i2:2, res:[{v:1,src:1},{v:1,src:2},{v:2,src:1},{v:3,src:2}], pick:2, spliced:false, act:'pick',
      eq:'l1->val = 4  >  l2->val = 3   → 接 l2 的節點',
      note:'節點是「搬過來接上」,不是複製 —— 實測 5 萬組節點位址守恆',
      text:'<strong>第 4 圈</strong> · 這裡沒有任何 <code>new</code>:<strong>是把原本的節點接過來</strong>(splice),不是複製值。實測 5 萬組隨機測資,合併結果的<strong>節點位址集合</strong>正好等於兩條輸入的<strong>聯集</strong>。' },

    { i1:3, i2:2, res:[{v:1,src:1},{v:1,src:2},{v:2,src:1},{v:3,src:2},{v:4,src:1}], pick:1, spliced:false, act:'pick',
      eq:'l1->val = 4  <=  l2->val = 4   → 接 l1 的節點,l1 用完了',
      note:'l1 變成 nullptr → while (l1 && l2) 不成立 → 跳出',
      text:'<strong>第 5 圈</strong> · 又是平手,取 l1。取完之後 <code>l1</code> 走到 <code>nullptr</code>,<code>while (l1 &amp;&amp; l2)</code> 不再成立,<strong>跳出迴圈</strong>。此時 l2 還剩一個節點沒接。' },

    { i1:3, i2:3, res:[{v:1,src:1},{v:1,src:2},{v:2,src:1},{v:3,src:2},{v:4,src:1},{v:4,src:2}], pick:null, spliced:true, act:'splice',
      eq:'tail->next = l1 ? l1 : l2;     // 一行把「剩下那整條」接上',
      note:'剩下那條本來就有序,而且都 ≥ 已接好的最後一個 —— 所以整條直接掛,O(1)',
      text:'<strong>收尾</strong> · 迴圈結束時<strong>必定恰好有一條空了</strong>,剩下那條<strong>本身就有序</strong>,而且它的每個值都 <code>≥</code> 已接好的最後一個。所以<strong>整條一次掛上去就好</strong> —— <code>O(1)</code>,不必再逐個搬。實測忘了這一行,4900 種組合<strong>錯 4899 種</strong>。' },

    { i1:3, i2:3, res:[{v:1,src:1},{v:1,src:2},{v:2,src:1},{v:3,src:2},{v:4,src:1},{v:4,src:2}], pick:null, spliced:true, act:'done',
      eq:'return dummy->next;     // 不是 dummy —— dummy 是假的頭',
      note:'實測 return dummy 而非 dummy->next:4900 種組合全錯,結果多一個 0',
      text:'<strong>完成</strong> · <code>1 → 1 → 2 → 3 → 4 → 4</code>,共 5 圈 + 一次收尾。<strong>回傳 <code>dummy-&gt;next</code> 不是 <code>dummy</code></strong> —— dummy 只是施工用的假頭,實測回傳 <code>dummy</code> 會讓結果<strong>多一個 0 在最前面</strong>,4900 種組合全錯。<b>而且 dummy 是 <code>new</code> 出來的,函式結束時沒人 delete 它 —— 見程式碼頁。</b>' },
  ];

  let step = 0, timer = null;

  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||440; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  const TAG = 58, NH = 42;
  const Y1 = 66, Y2 = 148, YR = 236;      // 三排的頂端;排與排之間 ≥ 40px
  const YRTAG = YR + NH + 12;

  function draw(){
    fit();
    const s = steps[step], w = canvas.clientWidth, PAD = 30;
    const done = s.act === 'done';
    ctx.fillStyle = C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);

    const SLOTS = 7;                         // dummy + 最多 6 個結果節點
    const area = w - 2*PAD - TAG;
    const cw = Math.min(54, area / SLOTS - 16);
    const gap = Math.min(26, (area - SLOTS*cw) / (SLOTS - 1));
    const x0 = PAD + TAG;
    const at = k => x0 + k * (cw + gap);

    const cell = (k, y, txt, bg, bd, tx, bold, dashed) => {
      rr(at(k), y, cw, NH, 5);
      ctx.fillStyle = bg; ctx.fill();
      ctx.lineWidth = bold ? 2.4 : 1.5; ctx.strokeStyle = bd;
      if (dashed) ctx.setLineDash([4,3]);
      ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = tx; ctx.font = (bold ? '700 ' : '700 ') + '15px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(txt, at(k) + cw/2, y + NH/2);
    };
    const rowTag = (y, t, col) => { ctx.fillStyle = col; ctx.font='700 12px "JetBrains Mono", monospace';
      ctx.textAlign='right'; ctx.textBaseline='middle'; ctx.fillText(t, x0 - 12, y + NH/2); };

    // ── BAND 1 標題 ──
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 藍 = 來自 list1　橘 = 來自 list2　灰 = 已經用掉', PAD, 16);
    ctx.textAlign='right'; ctx.font='700 12.5px "JetBrains Mono", monospace';
    ctx.fillStyle = done ? C.okT : C.text;
    ctx.fillText(done ? '完成 · 5 圈 + 1 次收尾' : ('已接好 ' + s.res.length + ' 個'), w - PAD, 16);

    ctx.textAlign='center'; ctx.font='700 12.5px "JetBrains Mono", monospace';
    ctx.fillStyle = done ? C.okT : C.winT;
    const h1 = s.i1 < L1.length ? String(L1[s.i1]) : 'null';
    const h2 = s.i2 < L2.length ? String(L2[s.i2]) : 'null';
    ctx.fillText(s.spliced ? '兩條都接完了' : ('l1 -> ' + h1 + '　　l2 -> ' + h2), w/2, 42);

    // ── list1 ──
    rowTag(Y1, 'list1', C.winT);
    for (let k = 0; k < L1.length; k++) {
      const used = k < s.i1, head = k === s.i1;
      if (used) cell(k, Y1, String(L1[k]), C.off, C.offS, C.offT, false, false);
      else cell(k, Y1, String(L1[k]), head ? C.cur : C.win, head ? C.curS : C.winS, head ? C.curT : C.winT, head, false);
    }
    if (s.i1 >= L1.length) { ctx.fillStyle=C.dim; ctx.font='700 11.5px "JetBrains Mono", monospace';
      ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText('l1 = null(空了)', at(L1.length) + 4, Y1 + NH/2); }

    // ── list2 ──
    rowTag(Y2, 'list2', C.segT);
    for (let k = 0; k < L2.length; k++) {
      const used = k < s.i2, head = k === s.i2;
      if (used) cell(k, Y2, String(L2[k]), C.off, C.offS, C.offT, false, false);
      else cell(k, Y2, String(L2[k]), head ? C.cur : C.seg, head ? C.curS : C.segS, head ? C.curT : C.segT, head, false);
    }
    if (s.i2 >= L2.length) { ctx.fillStyle=C.dim; ctx.font='700 11.5px "JetBrains Mono", monospace';
      ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText('l2 = null(空了)', at(L2.length) + 4, Y2 + NH/2); }

    // ── 分隔線 ──
    ctx.strokeStyle = C.grid; ctx.lineWidth = 1; ctx.setLineDash([4,4]);
    ctx.beginPath(); ctx.moveTo(PAD, YR - 26.5); ctx.lineTo(w - PAD, YR - 26.5); ctx.stroke(); ctx.setLineDash([]);

    // ── 結果列 ──
    rowTag(YR, '結果', done ? C.okT : C.text);
    cell(0, YR, 'dummy', C.off, C.offS, C.offT, false, true);
    ctx.font='700 11px "JetBrains Mono", monospace';
    for (let k = 0; k < s.res.length; k++) {
      const n = s.res[k];
      const justAdded = (s.pick === n.src) && (k === s.res.length - 1);
      const fromL1 = n.src === 1;
      let bg = fromL1 ? C.win : C.seg, bd = fromL1 ? C.winS : C.segS, tx = fromL1 ? C.winT : C.segT;
      if (done) { bg = C.ok; bd = C.okS; tx = C.okT; }
      else if (justAdded) { bd = C.curS; }
      cell(k + 1, YR, String(n.v), bg, bd, tx, justAdded, false);
    }
    // tail 標記
    const tailSlot = s.spliced ? -1 : s.res.length;
    if (tailSlot >= 0) { ctx.fillStyle = C.curT; ctx.font='700 11px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='top'; ctx.fillText('tail', at(tailSlot) + cw/2, YRTAG); }
    // dummy 說明
    ctx.fillStyle = C.offT; ctx.font='600 10.5px "JetBrains Mono", monospace';
    ctx.textAlign='center'; ctx.textBaseline='top';
    ctx.fillText('假頭', at(0) + cw/2, YRTAG);

    // ── BAND 2 ──
    const B2 = 320;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 這一步做了什麼', PAD, B2);
    rr(PAD, B2 + 10, w - 2*PAD, 42, 6);
    ctx.fillStyle = done ? C.ok : (s.act === 'intro' ? '#fafaf6' : C.cur); ctx.fill();
    ctx.lineWidth = 1.6; ctx.strokeStyle = done ? C.okS : (s.act === 'intro' ? C.grid : C.curS); ctx.stroke();
    ctx.fillStyle = done ? C.okT : (s.act === 'intro' ? C.text : C.curT);
    ctx.font='700 12.5px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(s.eq, w/2, B2 + 31);

    // ── BAND 3 ──
    const B3 = 392;
    ctx.fillStyle=C.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 為什麼', PAD, B3);
    rr(PAD, B3 + 10, w - 2*PAD, 40, 6);
    ctx.fillStyle = done ? C.ok : '#fafaf6'; ctx.fill();
    ctx.lineWidth = 1.6; ctx.strokeStyle = done ? C.okS : C.grid; ctx.stroke();
    ctx.fillStyle = done ? C.okT : C.text;
    ctx.font='600 12.5px "Noto Sans TC", sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(s.note, w/2, B3 + 30);
  }

  function update(){ if(stepEl) stepEl.textContent=String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0'); if(labelEl) labelEl.innerHTML=steps[step].text; draw(); }
  function next(){ if(step<steps.length-1){step++;update();}else stop(); }
  function prev(){ if(step>0){step--;update();} }
  function reset(){ stop(); step=0; update(); }
  function play(){ if(timer){stop();return;} bPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){stop();return;} next(); },1950); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} if(bPlay) bPlay.textContent='Play'; }
  bPrev&&bPrev.addEventListener('click',prev); bNext&&bNext.addEventListener('click',next); bPlay&&bPlay.addEventListener('click',play); bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();}); if(window.ResizeObserver){ new ResizeObserver(()=>{fit();draw();}).observe(canvas); }
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw); fit(); update();
})();
