/* ============================================================
   P206 · Reverse Linked List — 解法 B(迭代)· viz
   三個指標往前推,每圈把一根箭頭反過來:
     next = curr->next;   // ① 先存好,不然下一行就找不到它了
     curr->next = prev;   // ② 反轉這一根
     prev = curr;         // ③ prev 前進
     curr = next;         // ④ curr 前進
   迴圈結束時 curr == nullptr,prev 正好停在最後一個節點 = 新的 head。
   例 [1,2,3,4,5] → 5 -> 4 -> 3 -> 2 -> 1 -> null,5 圈。
     BAND 1  節點鏈 + 箭頭(橘 = 還沒翻,藍 = 已翻好)+ prev / curr / next 標記
     BAND 2  這一圈執行的敘述
     BAND 3  為什麼
   所有狀態取自實測 trace(見 review.html 範例 Trace),未手推。
   前綴 vb- —— 同頁還有解法 A 的動畫,ID 不可衝突。
   ============================================================ */
(function () {
  const canvas = document.getElementById('vb-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('vb-step'), labelEl = document.getElementById('vb-label');
  const bPrev = document.getElementById('vb-prev'), bNext = document.getElementById('vb-next'),
        bPlay = document.getElementById('vb-play'), bReset = document.getElementById('vb-reset');

  const C = { paper:'#ffffff', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf',
    win:'#e3edf5', winS:'#4478c0', winT:'#2f5f9e',
    seg:'#f6ead8', segS:'#c8801e', segT:'#96601a',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424',
    ok:'#d9e8c7', okS:'#5fa866', okT:'#3f7a3a',
    off:'#f0f0ec', offS:'#cfcfcf', offT:'#a3a099', coral:'#cf3535' };

  const V = [1,2,3,4,5];
  const N = V.length;

  // prev / curr / next 用索引;-1 = nullptr
  const steps = [
    { nxt:[1,2,3,4,-1], prev:-1, curr:0, nx:-9, act:'intro',
      eq:'prev = nullptr　curr = head　next = ?',
      note:'prev 這一側是「已翻好」的那段,curr 這一側是「還沒動」的那段',
      text:'<strong>INITIAL</strong> · 三個指標:<code>prev</code> 是<strong>已翻好那段的頭</strong>(一開始是空的,所以 <code>nullptr</code>),<code>curr</code> 是<strong>還沒動那段的頭</strong>。每一圈把 <code>curr</code> 這一根箭頭反過來接到 <code>prev</code>,然後兩個一起往前推。' },

    { nxt:[1,2,3,4,-1], prev:-1, curr:0, nx:1, act:'save',
      eq:'① next = curr->next     // 先把 2 存起來',
      note:'這一行是整支程式的關鍵 —— 下一行就要把 curr->next 覆蓋掉了',
      text:'<strong>第 1 圈 · ①</strong> · <strong>先存 <code>next</code></strong>。因為下一行 <code>curr-&gt;next = prev</code> 會<strong>把通往後半段的唯一一條路覆蓋掉</strong> —— 沒先存住,後面 4 個節點就永遠找不回來了。實測把這行拿掉,<code>[1,2]</code> 直接答 <code>[1]</code>(丟了一半)。' },

    { nxt:[-1,2,3,4,-1], prev:0, curr:1, nx:1, act:'flip',
      eq:'② curr->next = prev　③ prev = curr　④ curr = next',
      note:'1 現在指向 null —— 它成了翻轉後的尾巴',
      text:'<strong>第 1 圈 · ②③④</strong> · 把 <code>1</code> 的箭頭接到 <code>prev</code>(<code>nullptr</code>)—— <code>1</code> 就成了<strong>翻轉後的尾巴</strong>。然後兩個指標各往前一步。已翻好:<code>1 → null</code>。' },

    { nxt:[-1,0,3,4,-1], prev:1, curr:2, nx:2, act:'flip',
      eq:'第 2 圈:2 的箭頭反過來指向 1',
      note:'不變量:prev 永遠是「已翻好那段」的頭,curr 永遠是「未動那段」的頭',
      text:'<strong>第 2 圈</strong> · 已翻好 <code>2 → 1 → null</code>,未動 <code>3 → 4 → 5 → null</code>。<strong>不變量</strong>:每圈開始時 <code>prev</code> 指著已翻好那段的頭、<code>curr</code> 指著未動那段的頭 —— 兩段永遠<strong>剛好把整條串列切成兩半</strong>。' },

    { nxt:[-1,0,1,4,-1], prev:2, curr:3, nx:3, act:'flip',
      eq:'第 3 圈:3 的箭頭反過來指向 2',
      note:'每圈只動 3 個變數 + 1 根指標,與串列長度無關',
      text:'<strong>第 3 圈</strong> · 已翻好 <code>3 → 2 → 1 → null</code>。每一圈都只做 <code>O(1)</code> 的工作,總共 n 圈 ⇒ <code>O(n)</code>,而且<strong>空間是 O(1)</strong> —— 這正是它勝過遞迴版的地方。' },

    { nxt:[-1,0,1,2,-1], prev:3, curr:4, nx:4, act:'flip',
      eq:'第 4 圈:4 的箭頭反過來指向 3',
      note:'注意 curr 走到最後一個節點了,next 會是 nullptr',
      text:'<strong>第 4 圈</strong> · 已翻好 <code>4 → 3 → 2 → 1 → null</code>,只剩節點 <code>5</code> 沒動。' },

    { nxt:[-1,0,1,2,3], prev:4, curr:-1, nx:-1, act:'flip',
      eq:'第 5 圈:5 指向 4;next = nullptr → curr = nullptr',
      note:'curr 變成 nullptr,迴圈條件不成立 → 跳出',
      text:'<strong>第 5 圈</strong> · 最後一圈。<code>next = curr-&gt;next</code> 取到 <code>nullptr</code>,所以 <code>④ curr = next</code> 之後 <code>curr</code> 是空的,<code>while (curr)</code> 不成立,跳出迴圈。' },

    { nxt:[-1,0,1,2,3], prev:4, curr:-1, nx:-1, act:'done',
      eq:'return prev = 節點 5     // 不是 curr!curr 已經是 nullptr',
      note:'實測回傳 curr 而非 prev:8 種結構錯 7 種,n=1 就答空串列',
      text:'<strong>完成</strong> · <code>5 → 4 → 3 → 2 → 1 → null</code>,共 <strong>5 圈</strong>。<strong>回傳的是 <code>prev</code> 不是 <code>curr</code></strong> —— 迴圈是因為 <code>curr</code> 變成 <code>nullptr</code> 才結束的,而 <code>prev</code> 正好停在最後一個節點上。實測寫成 <code>return curr</code>,<code>n = 1</code> 就會回空串列。' },
  ];

  let step = 0, timer = null;

  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||360; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function arrowH(x1, x2, y, col){
    ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();
    const d = x2 > x1 ? 1 : -1;
    ctx.beginPath(); ctx.moveTo(x2, y); ctx.lineTo(x2 - d*8, y - 5); ctx.lineTo(x2 - d*8, y + 5); ctx.closePath(); ctx.fill();
  }

  const NODE_TOP = 90, NH = 46, MIDY = NODE_TOP + NH/2;
  const NULL_Y = NODE_TOP + NH + 4;        // null 標記畫在節點正下方,避開間隙裡的箭頭
  const TAG_Y  = NODE_TOP + NH + 30;

  function draw(){
    fit();
    const s = steps[step], w = canvas.clientWidth, PAD = 34;
    const done = s.act === 'done';
    ctx.fillStyle = C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);

    const usable = w - 2*PAD - 56;
    const nw = Math.min(60, usable / N - 40);
    const gap = Math.min(52, (usable - N*nw) / (N - 1));
    const x0 = PAD + 10;
    const edge = i => x0 + i * (nw + gap);
    const cx = i => edge(i) + nw/2;

    // ── BAND 1 標題 ──
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 橘箭頭 = 還沒翻　藍箭頭 = 已翻好　∅ = nullptr', PAD, 16);
    ctx.textAlign='right'; ctx.font='700 12.5px "JetBrains Mono", monospace';
    ctx.fillStyle = done ? C.okT : C.text;
    ctx.fillText(done ? '完成 · 5 圈' : ('n = ' + N), w - PAD, 16);

    // 狀態列:三個指標
    const nm = i => i < 0 ? 'null' : String(V[i]);
    ctx.textAlign='center'; ctx.font='700 12.5px "JetBrains Mono", monospace';
    ctx.fillStyle = done ? C.okT : C.winT;
    ctx.fillText('prev = ' + nm(s.prev) + '　　curr = ' + nm(s.curr) +
                 '　　next = ' + (s.nx === -9 ? '?' : nm(s.nx)), w/2, 46);

    // 兩段的說明
    ctx.font='600 11.5px "Noto Sans TC", sans-serif';
    ctx.fillStyle = C.dim;
    ctx.fillText('藍色這段已翻好(prev 是它的頭)　│　橘色這段還沒動(curr 是它的頭)', w/2, 68);

    // ── 箭頭 ──
    for (let i = 0; i < N; i++) {
      const j = s.nxt[i];
      if (j === -1) {
        // 指向 null:畫在節點「正下方」—— 同一個間隙裡可能已經有反向箭頭,擺右邊會疊到
        ctx.strokeStyle = C.curS; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cx(i), NULL_Y); ctx.lineTo(cx(i), NULL_Y + 8); ctx.stroke();
        ctx.fillStyle = C.curT; ctx.font='700 12px "JetBrains Mono", monospace';
        ctx.textAlign='center'; ctx.textBaseline='top';
        ctx.fillText('∅', cx(i), NULL_Y + 9);
      } else if (j === i + 1) {
        arrowH(edge(i) + nw + 4, edge(j) - 4, MIDY, C.segS);
      } else if (j === i - 1) {
        arrowH(edge(i) - 4, edge(j) + nw + 4, MIDY, C.winS);
      }
    }

    // ── 節點 ──
    for (let i = 0; i < N; i++) {
      const flipped = s.nxt[i] === i - 1 || (s.nxt[i] === -1 && i === 0 && s.prev >= 0);
      let bg, bd, tx;
      if (done)               { bg = C.ok;  bd = C.okS;  tx = C.okT; }
      else if (i === s.curr)  { bg = C.cur; bd = C.curS; tx = C.curT; }
      else if (flipped)       { bg = C.win; bd = C.winS; tx = C.winT; }
      else                    { bg = C.seg; bd = C.segS; tx = C.segT; }
      rr(edge(i), NODE_TOP, nw, NH, 6);
      ctx.fillStyle = bg; ctx.fill();
      ctx.lineWidth = (i === s.curr) ? 2.4 : 1.6; ctx.strokeStyle = bd; ctx.stroke();
      ctx.fillStyle = tx; ctx.font='700 17px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(V[i]), cx(i), MIDY);
    }

    // ── 指標標籤(prev / curr / next 各自一格,不會重疊在同一格上)──
    ctx.textAlign='center'; ctx.textBaseline='top'; ctx.font='700 11px "JetBrains Mono", monospace';
    const tags = {};
    const put = (i, t) => { if (i < 0 || i >= N) return; tags[i] = tags[i] ? tags[i] + ' ' + t : t; };
    put(s.prev, 'prev'); put(s.curr, 'curr'); if (s.nx !== -9 && s.nx !== s.curr) put(s.nx, 'next');
    for (const k in tags) {
      const i = +k;
      ctx.fillStyle = (i === s.curr) ? C.curT : (i === s.prev ? C.winT : C.segT);
      ctx.fillText(tags[k], cx(i), TAG_Y);
    }
    // prev / curr 為 null 時,在左右頁邊註記
    if (s.prev < 0) { ctx.fillStyle = C.winT; ctx.textAlign='right'; ctx.fillText('prev = ∅', x0 - 8, TAG_Y); }
    if (s.curr < 0) { ctx.fillStyle = C.curT; ctx.textAlign='right'; ctx.fillText('curr = ∅', w - PAD, TAG_Y); }

    // ── BAND 2 ──
    const B2 = 204;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 這一圈執行的敘述', PAD, B2);
    rr(PAD, B2 + 10, w - 2*PAD, 42, 6);
    ctx.fillStyle = done ? C.ok : (s.act === 'intro' ? '#fafaf6' : C.cur); ctx.fill();
    ctx.lineWidth = 1.6; ctx.strokeStyle = done ? C.okS : (s.act === 'intro' ? C.grid : C.curS); ctx.stroke();
    ctx.fillStyle = done ? C.okT : (s.act === 'intro' ? C.text : C.curT);
    ctx.font='700 12.5px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(s.eq, w/2, B2 + 31);

    // ── BAND 3 ──
    const B3 = 276;
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
