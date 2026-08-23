/* ============================================================
   P206 · Reverse Linked List — 解法 A(遞迴)· viz
   先一路遞迴到底(什麼都不改),再在「回程」上一格一格把箭頭反過來:
     head->next->next = head;   // 讓後一個指回自己
     head->next = nullptr;      // 自己斷尾,否則兩節點互指成環
   base case 回傳的那個節點,會被原封不動一路往上傳,成為新的 head。
   例 [1,2,3,4,5] → 5 -> 4 -> 3 -> 2 -> 1 -> null。
     BAND 1  節點鏈 + 箭頭(橘 = 還沒翻,藍 = 已翻好)+ 目前處理的節點
     BAND 2  這一步執行的兩行指標操作
     BAND 3  為什麼要這樣寫
   所有狀態取自實測 trace(見 review.html 範例 Trace),未手推。
   前綴 va- —— 同頁還有解法 B 的動畫,ID 不可衝突。
   ============================================================ */
(function () {
  const canvas = document.getElementById('va-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('va-step'), labelEl = document.getElementById('va-label');
  const bPrev = document.getElementById('va-prev'), bNext = document.getElementById('va-next'),
        bPlay = document.getElementById('va-play'), bReset = document.getElementById('va-reset');

  const C = { paper:'#ffffff', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf',
    win:'#e3edf5', winS:'#4478c0', winT:'#2f5f9e',
    seg:'#f6ead8', segS:'#c8801e', segT:'#96601a',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424',
    ok:'#d9e8c7', okS:'#5fa866', okT:'#3f7a3a',
    off:'#f0f0ec', offS:'#cfcfcf', offT:'#a3a099', coral:'#cf3535' };

  const V = [1,2,3,4,5];                     // 節點值
  const N = V.length;

  // nxt[i] = j 表示節點 i 的 next 指向節點 j;-1 表示 nullptr
  const steps = [
    { nxt:[1,2,3,4,-1], focus:-1, depth:0, head:-1, act:'intro',
      eq:'reverseList(1) → reverseList(2) → … → reverseList(5)',
      note:'下潛的路上「什麼都不改」—— 所有工作都發生在回程',
      text:'<strong>INITIAL</strong> · 遞迴版的想法是:<strong>先假設後面那一段已經翻好了</strong>,我只要處理「自己」和「後面那段的頭」之間那一根箭頭。所以先一路呼叫下去,<strong>下潛途中不動任何指標</strong>。' },

    { nxt:[1,2,3,4,-1], focus:4, depth:5, head:-1, act:'descend',
      eq:'一路下潛,呼叫堆疊深度 5(n = 5)',
      note:'每層一個堆疊框,實測每框 48 bytes —— 這就是遞迴版的空間成本',
      text:'<strong>下潛</strong> · <code>reverseList</code> 一路呼叫到最後一個節點,堆疊上疊了 <strong>5 層</strong>。實測每層 <strong>48 bytes</strong>,<code>n = 5000</code> 時共 <strong>234 KB</strong>。<b>迭代版完全沒有這筆開銷</b> —— 這是兩者唯一的實質差別。' },

    { nxt:[1,2,3,4,-1], focus:4, depth:5, head:4, act:'base',
      eq:'!head->next 成立 → return head(節點 5)',
      note:'base case 回傳的節點,會被原封不動一路往上傳,成為新的 head',
      text:'<strong>BASE CASE</strong> · 走到節點 <code>5</code>,<code>head-&gt;next</code> 是 <code>nullptr</code> → 直接回傳它自己。<strong>這就是最終的新 head</strong>,接下來每一層都只是把它<strong>原封不動再回傳一次</strong>,自己不碰它。' },

    { nxt:[1,2,3,-1,3], focus:3, depth:4, head:4, act:'flip',
      eq:'head = 4 ·  head->next->next = head   ⇒ 5 指回 4\nhead->next = nullptr   ⇒ 4 斷尾',
      note:'兩行缺一不可:只做第一行,4 與 5 會互相指 → 成環',
      text:'<strong>回到 4</strong> · 此時 <code>head</code> 是節點 4,<code>head-&gt;next</code> 是節點 5。<code>head-&gt;next-&gt;next = head</code> 讓 <strong>5 指回 4</strong>;但 4 <strong>本來也指著 5</strong>,所以必須 <code>head-&gt;next = nullptr</code> 把它斷開 —— <strong>否則 4 ⇄ 5 互指,鏈表成環</strong>。已翻好:<code>5 → 4 → null</code>。' },

    { nxt:[1,2,-1,2,3], focus:2, depth:3, head:4, act:'flip',
      eq:'head=3 · 4 指回 3,3 斷尾',
      note:'每一層都只動兩根指標,和串列長度無關 —— 所以總時間是 O(n)',
      text:'<strong>回到 3</strong> · 同樣兩行。注意<strong>每一層只做 O(1) 的工作</strong>,一共 n 層 ⇒ 總時間 <code>O(n)</code>。已翻好:<code>5 → 4 → 3 → null</code>。' },

    { nxt:[1,-1,1,2,3], focus:1, depth:2, head:4, act:'flip',
      eq:'head=2 · 3 指回 2,2 斷尾',
      note:'回傳值 node 從頭到尾都是節點 5,沒有被任何一層改過',
      text:'<strong>回到 2</strong> · 已翻好:<code>5 → 4 → 3 → 2 → null</code>。注意 <code>node</code> 這個回傳值<strong>一路上都是節點 5</strong> —— 每層只是把它接著往上傳。' },

    { nxt:[-1,0,1,2,3], focus:0, depth:1, head:4, act:'flip',
      eq:'head=1 · 2 指回 1,1 斷尾(1 成為新的尾巴)',
      note:'最外層做完,整條翻轉完成',
      text:'<strong>回到 1</strong> · 最外層。<code>2</code> 指回 <code>1</code>,<code>1</code> 斷尾成為<strong>新的尾巴</strong>。' },

    { nxt:[-1,0,1,2,3], focus:-1, depth:0, head:4, act:'done',
      eq:'return node = 節點 5     // 全程零配置,只改指標',
      note:'實測:翻轉前後節點位址集合完全相同 —— 原地翻轉,沒有新增或遺失節點',
      text:'<strong>完成</strong> · <code>5 → 4 → 3 → 2 → 1 → null</code>。實測 20 萬組隨機測資,翻轉前後<strong>節點位址集合完全相同</strong> —— 這是<strong>原地翻轉</strong>,沒有配置任何新節點。時間 <code>O(n)</code>,空間 <code>O(n)</code>(呼叫堆疊)。' },
  ];

  let step = 0, timer = null;

  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||360; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function arrowH(x1, x2, y, col){                 // 水平箭頭,x1 起點、x2 終點(含箭頭)
    ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();
    const d = x2 > x1 ? 1 : -1;
    ctx.beginPath(); ctx.moveTo(x2, y); ctx.lineTo(x2 - d*8, y - 5); ctx.lineTo(x2 - d*8, y + 5); ctx.closePath(); ctx.fill();
  }

  const NODE_TOP = 82, NH = 46, MIDY = NODE_TOP + NH/2;
  const NULL_Y = NODE_TOP + NH + 4;        // null 標記畫在節點正下方,避開間隙裡的箭頭
  const TAG_Y  = NODE_TOP + NH + 30;

  function draw(){
    fit();
    const s = steps[step], w = canvas.clientWidth, PAD = 34;
    const done = s.act === 'done';
    ctx.fillStyle = C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);

    const usable = w - 2*PAD - 56;                 // 右邊留 56 給末端的 null
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
    ctx.fillText(s.depth > 0 ? ('呼叫堆疊深度 ' + s.depth) : (done ? '完成' : 'n = ' + N), w - PAD, 16);

    // 狀態列
    ctx.textAlign='center'; ctx.font='700 12.5px "JetBrains Mono", monospace';
    ctx.fillStyle = done ? C.okT : C.winT;
    ctx.fillText(s.head >= 0 ? ('新 head = 節點 ' + V[s.head] + (s.focus >= 0 ? '　　目前這層 head = 節點 ' + V[s.focus] : ''))
                             : '整條尚未變動', w/2, 46);

    // ── 箭頭(畫在節點下方之前,免得被蓋住)──
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
        arrowH(edge(i) + nw + 4, edge(j) - 4, MIDY, C.segS);      // 往右 = 還沒翻
      } else if (j === i - 1) {
        arrowH(edge(i) - 4, edge(j) + nw + 4, MIDY, C.winS);      // 往左 = 已翻好
      }
    }

    // ── 節點 ──
    for (let i = 0; i < N; i++) {
      const flipped = s.nxt[i] === i - 1 || (done && s.nxt[i] === -1);
      let bg = C.off, bd = C.offS, tx = C.offT;
      if (done)                 { bg = C.ok;  bd = C.okS;  tx = C.okT; }
      else if (i === s.focus)   { bg = C.cur; bd = C.curS; tx = C.curT; }
      else if (i === s.head)    { bg = C.ok;  bd = C.okS;  tx = C.okT; }
      else if (flipped)         { bg = C.win; bd = C.winS; tx = C.winT; }
      else                      { bg = C.seg; bd = C.segS; tx = C.segT; }
      rr(edge(i), NODE_TOP, nw, NH, 6);
      ctx.fillStyle = bg; ctx.fill();
      ctx.lineWidth = (i === s.focus || (i === s.head && !done)) ? 2.4 : 1.6;
      ctx.strokeStyle = bd; ctx.stroke();
      ctx.fillStyle = tx; ctx.font='700 17px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(V[i]), cx(i), MIDY);
    }

    // 標籤列
    ctx.textAlign='center'; ctx.textBaseline='top'; ctx.font='700 11px "JetBrains Mono", monospace';
    if (s.head >= 0) { ctx.fillStyle = C.okT; ctx.fillText('新 head', cx(s.head), TAG_Y); }
    if (s.focus >= 0 && s.focus !== s.head) { ctx.fillStyle = C.curT; ctx.fillText('head', cx(s.focus), TAG_Y); }

    // ── BAND 2 ──
    const B2 = 196;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 這一步做了什麼', PAD, B2);
    const lines = s.eq.split('\n');
    const bh2 = lines.length > 1 ? 54 : 42;
    rr(PAD, B2 + 10, w - 2*PAD, bh2, 6);
    ctx.fillStyle = done ? C.ok : (s.act === 'intro' || s.act === 'descend' ? '#fafaf6' : C.cur); ctx.fill();
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = done ? C.okS : (s.act === 'intro' || s.act === 'descend' ? C.grid : C.curS); ctx.stroke();
    ctx.fillStyle = done ? C.okT : (s.act === 'intro' || s.act === 'descend' ? C.text : C.curT);
    ctx.font='700 12.5px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
    if (lines.length > 1) { ctx.fillText(lines[0], w/2, B2 + 26); ctx.fillText(lines[1], w/2, B2 + 47); }
    else                  { ctx.fillText(lines[0], w/2, B2 + 31); }

    // ── BAND 3 ──
    const B3 = 280;
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
