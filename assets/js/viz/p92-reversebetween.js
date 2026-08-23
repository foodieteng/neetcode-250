/* ============================================================
   P92 · Reverse Linked List II — dummy + 定位 + 局部反轉 + 兩行接回 · viz
   206 是「整條翻」,92 是「只翻中間那一段」。差別全在頭尾要接回去:
     tail->next->next = next;   // ① 舊的段頭(現在是段尾)接上 right 後面那個
     tail->next       = prev;   // ② tail 接上新的段頭
   兩行的順序不能換 —— ② 先做的話 tail->next 就已經變成 prev,①
   會把新段頭的箭頭打掉(實測 165 組錯 120 組)。
   例 [1,2,3,4,5], left=2, right=4 → [1,4,3,2,5]。
     BAND 1  dummy + 節點鏈 + 箭頭(橘 = 待翻,藍 = 已接好,灰 = 區間外)
     BAND 2  這一步執行的敘述
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

  // 顯示用:索引 0 是 dummy,索引 k(1..5)是值為 k 的節點
  const LBL = ['D','1','2','3','4','5'];
  const N = LBL.length;
  const LEFT = 2, RIGHT = 4;               // 要反轉的區間(1-based 的節點位置)
  const nm = i => (i < 0 ? 'null' : (i === 0 ? 'dummy' : LBL[i]));

  const steps = [
    { nxt:[1,2,3,4,5,-1], tail:0, prev:-9, curr:-9, nx:-9, act:'intro',
      eq:'dummy->next = head　　n = right - left + 1 = 3',
      note:'dummy 是「頭的前驅」—— left == 1 時要接的就是它,少了它得多寫一個特例',
      text:'<strong>INITIAL</strong> · <code>left = 2</code>、<code>right = 4</code>,要翻的是 <code>2 → 3 → 4</code> 這一段。<strong><code>n = right − left + 1 = 3</code></strong> 是段長 —— 實測寫成 <code>right − left</code>,窮舉 165 組<strong>全部 165 組都錯</strong>。掛 <code>dummy</code> 的理由和 <a href="../p19/index.html">19</a> 一樣:<strong><code>left == 1</code> 時要接的是「頭的前驅」,而頭沒有前驅</strong>。' },

    { nxt:[1,2,3,4,5,-1], tail:1, prev:-9, curr:-9, nx:-9, act:'walk',
      eq:'for (i = 0; i < left - 1; i++) tail = tail->next;   → 走 1 步',
      note:'從 dummy 起步走 left-1 步 ⇒ tail 停在「第 left 個節點的前一個」',
      text:'<strong>定位</strong> · 從 <code>dummy</code> 出發走 <strong><code>left − 1 = 1</code></strong> 步,<code>tail</code> 停在節點 <strong>1</strong> —— 也就是<strong>待翻區間的前一個</strong>。<strong>注意起點是 <code>dummy</code> 不是 <code>head</code></strong>:實測改成從 <code>head</code> 起步而步數不變,165 組<strong>錯 120 組</strong>(整段位置整個偏一格)。' },

    { nxt:[1,2,3,4,5,-1], tail:1, prev:-1, curr:2, nx:-9, act:'init',
      eq:'prev = nullptr　curr = tail->next = 節點 2　next = ?',
      note:'接下來這段就是 206 的迭代反轉,一字不差 —— 只是跑 n 圈而不是跑到底',
      text:'<strong>準備反轉</strong> · 三個指標就位。<strong>這一段和 <a href="../p206/code.html">206 的迭代版完全一樣</a></strong>,唯一的差別是<strong>迴圈條件從「走到 <code>nullptr</code>」換成「跑 <code>n</code> 圈」</strong>。' },

    { nxt:[1,2,-1,4,5,-1], tail:1, prev:2, curr:3, nx:3, act:'flip',
      eq:'第 1 圈:next = 3　節點 2 的箭頭 → nullptr　prev = 2　curr = 3',
      note:'節點 2 暫時指向 null —— 它最後會變成這一段的「段尾」',
      text:'<strong>反轉 · 第 1 圈</strong> · 節點 <strong>2</strong> 的箭頭被接到 <code>prev</code>(此刻是 <code>nullptr</code>)。<strong>這個 <code>nullptr</code> 是暫時的</strong> —— 節點 2 是原本的段頭,翻完之後它會變成<strong>段尾</strong>,而段尾最後要接上 <code>right</code> 後面那個節點。這正是第 6 步那一行在做的事。' },

    { nxt:[1,2,-1,2,5,-1], tail:1, prev:3, curr:4, nx:4, act:'flip',
      eq:'第 2 圈:節點 3 的箭頭 → 節點 2　prev = 3　curr = 4',
      note:'不變量:prev 是已翻好那段的頭,curr 是這一段還沒動的頭',
      text:'<strong>反轉 · 第 2 圈</strong> · 已翻好 <code>3 → 2</code>。<strong>不變量和 206 一模一樣</strong>:<code>prev</code> 永遠是已翻好那段的頭,<code>curr</code> 永遠是還沒動那段的頭。' },

    { nxt:[1,2,-1,2,3,-1], tail:1, prev:4, curr:5, nx:5, act:'flip',
      eq:'第 3 圈:節點 4 的箭頭 → 節點 3　prev = 4　curr = 5 = next',
      note:'跑滿 n = 3 圈,迴圈結束;此時 next 正好是 right 後面那個節點',
      text:'<strong>反轉 · 第 3 圈</strong> · 跑滿 <code>n = 3</code> 圈,迴圈結束。此刻:<code>prev</code> = 節點 <strong>4</strong>(<strong>新的段頭</strong>),<code>next</code> = 節點 <strong>5</strong>(<strong><code>right</code> 後面那個</strong>)。而<strong>整段從鏈上斷開了</strong> —— 節點 1 還指著節點 2,節點 2 指著 <code>null</code>。' },

    { nxt:[1,2,5,2,3,-1], tail:1, prev:4, curr:5, nx:5, act:'link1',
      eq:'① tail->next->next = next;      // 節點 2(舊段頭 = 新段尾)→ 節點 5',
      note:'tail->next 此刻「還是」節點 2 —— 這一行必須在改動 tail->next 之前做',
      text:'<strong>接尾 · ①</strong> · <code>tail-&gt;next</code> 現在<strong>還是節點 2</strong>(原本的段頭),而翻完之後它是<strong>段尾</strong>。把它接上 <code>next</code> = 節點 5,<strong>斷掉的後半就回來了</strong>。<b>關鍵:這一行靠的就是「<code>tail-&gt;next</code> 還沒被改動」—— 一旦先做了 ②,節點 2 就再也找不到了。</b>' },

    { nxt:[1,4,5,2,3,-1], tail:1, prev:4, curr:5, nx:5, act:'link2',
      eq:'② tail->next = prev;            // 節點 1 → 節點 4(新段頭)',
      note:'兩行順序對調實測錯 120/165 —— 只有 left == right(段長 1)時才僥倖對',
      text:'<strong>接頭 · ②</strong> · <code>tail</code>(節點 1)接上 <code>prev</code> = 節點 <strong>4</strong>,也就是<strong>新的段頭</strong>。<strong>實測把 ① ② 對調:窮舉 165 組錯 120 組</strong>,最小反例 <code>n=2, left=1, right=2</code> 回傳 <code>[2]</code>(正解 <code>[2,1]</code>)—— <b>對調後 <code>tail-&gt;next-&gt;next = next</code> 打掉的是新段頭的箭頭,整段只剩一個節點。</b>剩下的 45 組僥倖答對,全是 <code>left == right</code>。' },

    { nxt:[1,4,5,2,3,-1], tail:1, prev:4, curr:5, nx:5, act:'done',
      eq:'return dummy->next;     // [1,4,3,2,5]',
      note:'實測窮舉 n=1..100 的全部 (left,right) 共 171700 組,不一致 0',
      text:'<strong>完成</strong> · <code>1 → 4 → 3 → 2 → 5</code>。<strong>一趟走完</strong>:定位走 <code>left−1</code> 步、反轉走 <code>n</code> 步,合計正好 <code>right</code> 步,回答了題目的 follow-up。<strong>實測:窮舉 <code>n = 1..100</code> 的全部 <code>(left, right)</code> 組合共 171700 組,不一致 0。</strong>' },
  ];

  let step = 0, timer = null;

  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function arrowH(x1,x2,y,col){ ctx.strokeStyle=col; ctx.fillStyle=col; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(x1,y); ctx.lineTo(x2,y); ctx.stroke();
    const d=x2>x1?1:-1; ctx.beginPath(); ctx.moveTo(x2,y); ctx.lineTo(x2-d*8,y-5); ctx.lineTo(x2-d*8,y+5); ctx.closePath(); ctx.fill(); }

  const TAG_Y = 82;
  const NODE_TOP = 100, NH = 46, MIDY = NODE_TOP + NH/2, NODE_BOT = NODE_TOP + NH;
  const NULL_Y = NODE_BOT + 4;
  const LANE = [NODE_BOT + 40, NODE_BOT + 70];   // 長跨距箭頭的兩條車道(畫在節點下方)

  function draw(){
    fit();
    const s = steps[step], w = canvas.clientWidth, PAD = 30;
    const done = s.act === 'done';
    ctx.fillStyle = C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);

    const usable = w - 2*PAD - 46;
    const nw = Math.min(56, usable / N - 34);
    const gap = Math.min(46, (usable - N*nw) / (N - 1));
    const x0 = PAD + 8;
    const edge = i => x0 + i*(nw+gap);
    const cx = i => edge(i) + nw/2;

    // ── BAND 1 標題 ──
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 橘 = 待翻區間　藍 = 已接好　灰 = 區間外 / dummy', PAD, 16);
    ctx.textAlign='right'; ctx.font='700 12.5px "JetBrains Mono", monospace';
    ctx.fillStyle = done ? C.okT : C.text;
    ctx.fillText(done ? '完成 · [1,4,3,2,5]' : ('left = ' + LEFT + '　right = ' + RIGHT), w - PAD, 16);

    // 狀態列
    ctx.textAlign='center'; ctx.font='700 12.5px "JetBrains Mono", monospace';
    ctx.fillStyle = done ? C.okT : C.winT;
    ctx.fillText(s.prev === -9
      ? ('tail = ' + nm(s.tail) + '　　(尚未進入反轉迴圈)')
      : ('tail = ' + nm(s.tail) + '　　prev = ' + nm(s.prev) + '　　curr = ' + nm(s.curr) +
         '　　next = ' + (s.nx === -9 ? '?' : nm(s.nx))), w/2, 44);

    ctx.font='600 11.5px "Noto Sans TC", sans-serif'; ctx.fillStyle = C.dim;
    ctx.fillText('tail 卡在區間前一個不動,反轉在它後面就地進行,最後兩行把頭尾接回去', w/2, 66);

    // ── 箭頭 ──
    const longEdges = [];
    for (let i = 0; i < N; i++) {
      const j = s.nxt[i];
      if (j === -1) {
        if (i === N - 1) {            // 最後一個節點:∅ 畫在右側,不會撞到下方車道
          ctx.strokeStyle = C.grid; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(edge(i)+nw+4, MIDY); ctx.lineTo(edge(i)+nw+16, MIDY); ctx.stroke();
          ctx.fillStyle = C.offT; ctx.font='700 12px "JetBrains Mono", monospace';
          ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText('∅', edge(i)+nw+20, MIDY);
        } else {                       // 中間節點:∅ 畫在正下方短柄
          ctx.strokeStyle = C.curS; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(cx(i), NULL_Y); ctx.lineTo(cx(i), NULL_Y+8); ctx.stroke();
          ctx.fillStyle = C.curT; ctx.font='700 12px "JetBrains Mono", monospace';
          ctx.textAlign='center'; ctx.textBaseline='top'; ctx.fillText('∅', cx(i), NULL_Y+9);
        }
      } else if (j === i + 1) {
        arrowH(edge(i)+nw+4, edge(j)-4, MIDY, (i >= LEFT && i < RIGHT) ? C.segS : C.grid);
      } else if (j === i - 1) {
        arrowH(edge(i)-4, edge(j)+nw+4, MIDY, C.winS);
      } else {
        longEdges.push([i, j]);        // 跨距 > 1:改走下方車道
      }
    }
    longEdges.sort((a,b) => a[0]-b[0]).forEach(([i,j], k) => {
      const y = LANE[Math.min(k, LANE.length-1)];
      const xA = cx(i), xB = cx(j);
      ctx.strokeStyle = C.winS; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(xA, NODE_BOT+2);
      ctx.bezierCurveTo(xA, y, xB, y, xB, NODE_BOT+2); ctx.stroke();
      ctx.fillStyle = C.winS; ctx.beginPath();
      ctx.moveTo(xB, NODE_BOT+2); ctx.lineTo(xB-5, NODE_BOT+13); ctx.lineTo(xB+5, NODE_BOT+13); ctx.closePath(); ctx.fill();
    });

    // ── 節點 ──
    for (let i = 0; i < N; i++) {
      const inRange = i >= LEFT && i <= RIGHT;
      const flipped = s.nxt[i] === i - 1 || (inRange && s.nxt[i] === -1 && s.prev >= 0) || (inRange && s.nxt[i] > i + 1);
      let bg, bd, tx;
      if (done)               { bg = C.ok;  bd = C.okS;  tx = C.okT; }
      else if (i === 0)       { bg = C.off; bd = C.offS; tx = C.offT; }
      else if (i === s.curr && inRange) { bg = C.cur; bd = C.curS; tx = C.curT; }
      else if (flipped)       { bg = C.win; bd = C.winS; tx = C.winT; }
      else if (inRange)       { bg = C.seg; bd = C.segS; tx = C.segT; }
      else                    { bg = C.off; bd = C.offS; tx = C.offT; }
      rr(edge(i), NODE_TOP, nw, NH, 6);
      ctx.fillStyle = bg; ctx.fill();
      ctx.lineWidth = (i === s.curr || i === s.tail) ? 2.4 : 1.6; ctx.strokeStyle = bd; ctx.stroke();
      ctx.fillStyle = tx; ctx.font='700 16px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(LBL[i], cx(i), MIDY);
    }

    // ── 指標標籤(畫在節點上方,下方留給車道)──
    ctx.textAlign='center'; ctx.textBaseline='bottom'; ctx.font='700 10.5px "JetBrains Mono", monospace';
    const tags = {};
    const put = (i, t) => { if (i < 0 || i >= N) return; tags[i] = tags[i] ? tags[i] + ' ' + t : t; };
    put(s.tail, 'tail');
    if (s.prev !== -9) { put(s.prev, 'prev'); put(s.curr, 'curr'); if (s.nx !== -9 && s.nx !== s.curr) put(s.nx, 'next'); }
    for (const k in tags) {
      const i = +k;
      ctx.fillStyle = (i === s.curr) ? C.curT : (i === s.tail ? C.segT : C.winT);
      ctx.fillText(tags[k], cx(i), TAG_Y);
    }
    if (s.prev === -1) { ctx.fillStyle = C.winT; ctx.textAlign='left'; ctx.fillText('prev = ∅', PAD, TAG_Y); }

    // ── BAND 2 ──
    const B2 = 246;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 這一步執行的敘述', PAD, B2);
    rr(PAD, B2+10, w-2*PAD, 42, 6);
    ctx.fillStyle = done ? C.ok : (s.act === 'intro' ? '#fafaf6' : C.cur); ctx.fill();
    ctx.lineWidth=1.6; ctx.strokeStyle = done ? C.okS : (s.act === 'intro' ? C.grid : C.curS); ctx.stroke();
    ctx.fillStyle = done ? C.okT : (s.act === 'intro' ? C.text : C.curT);
    ctx.font='700 12.5px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(s.eq, w/2, B2+31);

    // ── BAND 3 ──
    const B3 = 318;
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
  function play(){ if(timer){stop();return;} bPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){stop();return;} next(); },2050); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} if(bPlay) bPlay.textContent='Play'; }
  bPrev&&bPrev.addEventListener('click',prev); bNext&&bNext.addEventListener('click',next); bPlay&&bPlay.addEventListener('click',play); bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();}); if(window.ResizeObserver){ new ResizeObserver(()=>{fit();draw();}).observe(canvas); }
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw); fit(); update();
})();
