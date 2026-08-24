/* ============================================================
   P622 · Design Circular Queue — (front, size) 表示法 · viz
     底層是一個固定長度的陣列,「環」只存在於索引的算法裡:
       enQueue 寫到 (front + size) % capacity
       deQueue 把 front 往前推一格,size 減一
     只用 front 與 size 兩個狀態 ⇒ 「滿」與「空」天生不會撞在一起,
     所以不必像教科書的 (front, rear) 那樣浪費一格。
   例 MyCircularQueue(5)。
     BAND 1  左邊 = 環的視角　右邊 = 底層陣列的真實樣子
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

  const K = 5;
  const n = v => v === null ? null : v;

  // arr = 底層陣列真實內容(null = 從未寫過);front / size = 兩個狀態;hot = 這一步碰到的索引
  const steps = [
    { arr:[null,null,null,null,null], front:0, size:0, hot:null, act:'intro',
      eq:'q.resize(5)　front = 0　size = 0　capacity = 5',
      note:'狀態只有兩個:front（頭在哪）與 size（有幾個）—— 環是算出來的,不是存起來的',
      text:'<strong>INITIAL</strong> · 底層就是一個<strong>普通的固定長度陣列</strong>,<b>「環」完全存在於索引的算術裡</b>。整個佇列的狀態只有兩個數字:<strong><code>front</code>(頭在哪一格)</strong> 與 <strong><code>size</code>(現在有幾個)</strong>。<b>這個選擇是整題的關鍵</b> —— 稍後會看到它讓「滿」和「空」天生不會混淆。' },

    { arr:[10,null,null,null,null], front:0, size:1, hot:0, act:'en',
      eq:'enQueue(10)：q[(front + size) % 5] = q[(0 + 0) % 5] = q[0]　size → 1',
      note:'寫入的位置是「頭往後數 size 格」—— 也就是尾巴的下一格',
      text:'<strong>enQueue(10)</strong> · 新元素該寫在哪?<strong>從 <code>front</code> 往後數 <code>size</code> 格</strong>,因為佇列裡已經有 <code>size</code> 個了。<code>(0 + 0) % 5 = 0</code>。<b>注意這裡不需要另外維護一個 <code>rear</code> 變數 —— 它可以從 <code>front</code> 和 <code>size</code> 算出來。</b>' },

    { arr:[10,20,30,null,null], front:0, size:3, hot:2, act:'en',
      eq:'enQueue(20) → q[1]　enQueue(30) → q[2]　size → 3',
      note:'Rear() 同理:最後一個在 (front + size - 1) % capacity,要「減一」',
      text:'<strong>enQueue(20)、enQueue(30)</strong> · 連續寫進 <code>q[1]</code>、<code>q[2]</code>。<strong>順帶看 <code>Rear()</code></strong>:<b>最後一個元素在 <code>(front + size − 1) % capacity</code></b> —— <strong>那個 <code>−1</code> 不能少</strong>,因為 <code>front + size</code> 指的是「下一個要寫的空位」,不是最後一個元素。實測把 <code>−1</code> 拿掉,320 萬次呼叫錯 134334 次。' },

    { arr:[10,20,30,null,null], front:1, size:2, hot:0, act:'de',
      eq:'deQueue()：front = (0 + 1) % 5 = 1　size → 2',
      note:'q[0] 裡的 10 沒有被清掉 —— 它只是「不再屬於佇列」,下次繞回來會被覆蓋',
      text:'<strong>deQueue()</strong> · <strong>只把 <code>front</code> 往前推一格、<code>size</code> 減一</strong>,<b>完全沒有碰陣列的內容</b>。所以 <code>q[0]</code> 裡的 <code>10</code> <strong>還在那裡</strong> —— 它只是<strong>不再屬於佇列</strong>(圖上變成灰色)。<b>這就是環狀佇列不需要搬移任何元素的原因:出隊是「移動邊界」,不是「刪除資料」。</b>' },

    { arr:[10,20,30,null,null], front:2, size:1, hot:1, act:'de',
      eq:'deQueue()：front = (1 + 1) % 5 = 2　size → 1',
      note:'現在陣列裡有 3 個數字,但佇列只有 1 個 —— 陣列內容 ≠ 佇列內容',
      text:'<strong>deQueue()</strong> 再一次 · 現在<strong>陣列裡躺著 3 個數字,但佇列只有 1 個</strong>。<b>「哪些格子算數」完全由 <code>front</code> 和 <code>size</code> 決定</b>:索引 <code>j</code> 在佇列裡 ⟺ <code>(j − front + k) % k &lt; size</code>。<strong>這就是為什麼永遠不必清空舊資料。</strong>' },

    { arr:[10,20,30,40,null], front:2, size:2, hot:3, act:'en',
      eq:'enQueue(40)：q[(2 + 1) % 5] = q[3]　size → 2',
      note:'front 已經不是 0 了,所以「頭往後數 size 格」才是對的算法',
      text:'<strong>enQueue(40)</strong> · <code>(2 + 1) % 5 = 3</code>。<b>注意此刻 <code>front = 2</code> 而不是 0</b> —— 如果寫成 <code>q[size % capacity]</code>(忘了加 <code>front</code>),這裡就會寫到 <code>q[1]</code>,把還在佇列裡的資料蓋掉。<strong>實測那個寫法 320 萬次呼叫錯 11880 次,佇列內容錯 86840 次。</strong>' },

    { arr:[10,20,30,40,50], front:2, size:3, hot:4, act:'en',
      eq:'enQueue(50)：q[(2 + 2) % 5] = q[4]　size → 3',
      note:'下一格就要碰到陣列尾端了 —— % 就是在這裡發揮作用',
      text:'<strong>enQueue(50)</strong> · 寫到 <code>q[4]</code>,<strong>陣列的最後一格</strong>。下一次 <code>(2 + 3) = 5</code> 就超出陣列了 —— <b>而 <code>% 5</code> 會把它折回 0</b>。' },

    { arr:[60,20,30,40,50], front:2, size:4, hot:0, act:'wrap',
      eq:'enQueue(60)：q[(2 + 3) % 5] = q[5 % 5] = q[0]　← 繞回開頭了',
      note:'q[0] 那個舊的 10 就是在這一刻被覆蓋的 —— 不需要事先清空',
      text:'<strong>enQueue(60) · 繞回去了</strong> · <code>(2 + 3) = 5</code>,而 <code>5 % 5 = 0</code> —— <strong>寫回陣列開頭</strong>。<b>那個第 3 步留下的舊值 <code>10</code>,就是在這一刻被自然覆蓋的</b>。<strong>整個「環」就只是這一個 <code>%</code> 而已</strong> —— 陣列從頭到尾都是線性的,環在算術裡。' },

    { arr:[60,70,30,40,50], front:2, size:5, hot:1, act:'full',
      eq:'enQueue(70)：q[(2 + 4) % 5] = q[1]　size → 5 == capacity　⇒ 滿了',
      note:'滿的判斷是 size == capacity,和「空」的 size == 0 完全不會撞 —— 這就是選 size 的好處',
      text:'<strong>enQueue(70) · 裝滿</strong> · <code>size</code> 變成 5,等於 <code>capacity</code>。<b>而這正是 <code>(front, size)</code> 這個表示法最漂亮的地方</b>:<strong>「滿」是 <code>size == capacity</code>,「空」是 <code>size == 0</code>,兩者天生不會混淆</strong>。<b>教科書的 <code>(front, rear)</code> 寫法就沒這麼好命</b> —— 滿和空都會讓兩個索引重合,只好浪費一格來區分。' },

    { arr:[60,70,30,40,50], front:2, size:5, hot:null, act:'done',
      eq:'enQueue(80) → isFull() 為真 → return false（陣列一格都沒動）',
      note:'實測窮舉 k=1..4 的全部序列共 26261872 次呼叫,不一致 0,索引越界 0',
      text:'<strong>完成</strong> · 再 <code>enQueue</code> 會直接回 <code>false</code>。<strong>正確性實測</strong>:<b>窮舉 <code>k = 1..4</code>、7 種操作、長度 1 到 7 的<em>全部</em>序列</b> —— 共 <strong>3843196 條序列、26261872 次呼叫,回傳值不一致 0</strong>,而且<strong>每一次呼叫後都比對佇列內容,也是 0</strong>,<strong>971 萬次索引檢查越界 0 次</strong>。再加上 <code>k</code> 隨機 1~1000 的 <strong>800 萬次</strong>操作與 <code>k=7</code> 繞圈 <strong>14 萬圈</strong>,同樣全對。' },
  ];

  let step = 0, timer = null;

  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||420; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  const inQueue = (j, s) => s.size > 0 && ((j - s.front + K) % K) < s.size;

  // 依「是否在佇列裡 / 是否剛被碰到 / 是否為殘留舊值」決定顏色
  function palette(j, s, done){
    if (done)                     return inQueue(j,s) ? [C.ok,C.okS,C.okT] : [C.off,C.offS,C.offT];
    if (j === s.hot)              return [C.cur,C.curS,C.curT];
    if (inQueue(j,s))             return [C.win,C.winS,C.winT];
    if (s.arr[j] !== null)        return [C.off,C.offS,C.offT];      // 殘留的舊值
    return ['#fafaf6',C.grid,C.offT];                                 // 從未寫過
  }

  function draw(){
    fit();
    const s = steps[step], w = canvas.clientWidth, PAD = 26;
    const done = s.act === 'done';
    ctx.fillStyle = C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);

    // ── BAND 1 標題 ──
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 左 = 環的視角　右 = 底層陣列', PAD, 16);
    ctx.textAlign='right'; ctx.font='700 12.5px "JetBrains Mono", monospace';
    ctx.fillStyle = done ? C.okT : C.text;
    ctx.fillText('capacity = ' + K + '　front = ' + s.front + '　size = ' + s.size, w - PAD, 16);

    ctx.textAlign='center'; ctx.font='700 13.5px "JetBrains Mono", monospace';
    ctx.fillStyle = done ? C.okT : (s.act==='full'||s.act==='wrap' ? C.curT : (s.act==='intro' ? C.text : C.winT));
    ctx.fillText(s.act==='intro' ? 'MyCircularQueue(5)' : s.eq.split('：')[0], w/2, 42);

    // ── 環 ──(索引直接寫在格子裡,避免外圈標籤撞到格子)
    const R = 64, ccx = PAD + R + 40, ccy = 150;
    ctx.strokeStyle = C.grid; ctx.lineWidth = 1.4; ctx.setLineDash([3,4]);
    ctx.beginPath(); ctx.arc(ccx, ccy, R, 0, Math.PI*2); ctx.stroke(); ctx.setLineDash([]);
    const bw2 = 46, bh2 = 34;
    for (let j = 0; j < K; j++) {
      const a = -Math.PI/2 + j * (Math.PI*2/K);
      const x = ccx + R*Math.cos(a) - bw2/2, y = ccy + R*Math.sin(a) - bh2/2;
      const [bg,bd,tx] = palette(j, s, done);
      rr(x, y, bw2, bh2, 5); ctx.fillStyle=bg; ctx.fill();
      ctx.lineWidth = (j===s.hot)?2.4:1.5; ctx.strokeStyle=bd; ctx.stroke();
      ctx.textAlign='center'; ctx.textBaseline='alphabetic';
      ctx.fillStyle = (j===s.front && s.size>0) ? C.curT : C.dim;
      ctx.font='600 9px "JetBrains Mono", monospace';
      ctx.fillText('[' + j + ']', x+bw2/2, y+12);
      ctx.fillStyle=tx; ctx.font='700 13px "JetBrains Mono", monospace';
      ctx.fillText(s.arr[j]===null ? '·' : String(s.arr[j]), x+bw2/2, y+27);
    }
    ctx.fillStyle=C.dim; ctx.font='600 10.5px "Noto Sans TC", sans-serif';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(s.size===0 ? '（空）' : 'front = ' + s.front, ccx, ccy - 8);
    if (s.size > 0) ctx.fillText('size = ' + s.size, ccx, ccy + 8);

    // ── 底層陣列 ──
    const ax0 = ccx + R + 46;
    const aw = Math.min(52, (w - PAD - ax0) / K - 8);
    const ag = Math.min(10, (w - PAD - ax0 - K*aw) / (K - 1));
    const ax = j => ax0 + j*(aw+ag);
    const AY = 118, AH = 46;
    ctx.fillStyle=C.dim; ctx.font='600 11px "JetBrains Mono", monospace';
    ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('vector<int> q', ax0, AY - 24);
    for (let j = 0; j < K; j++) {
      const [bg,bd,tx] = palette(j, s, done);
      rr(ax(j), AY, aw, AH, 5); ctx.fillStyle=bg; ctx.fill();
      ctx.lineWidth = (j===s.hot)?2.4:1.5; ctx.strokeStyle=bd; ctx.stroke();
      ctx.fillStyle=tx; ctx.font='700 13.5px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(s.arr[j]===null ? '·' : String(s.arr[j]), ax(j)+aw/2, AY+AH/2);
      ctx.fillStyle=C.dim; ctx.font='500 10px "JetBrains Mono", monospace';
      ctx.textBaseline='alphabetic';
      ctx.fillText(String(j), ax(j)+aw/2, AY - 6);
    }
    // front / rear 標記
    ctx.textAlign='center'; ctx.textBaseline='top'; ctx.font='700 10.5px "JetBrains Mono", monospace';
    if (s.size > 0) {
      ctx.fillStyle=C.curT; ctx.fillText('↑front', ax(s.front)+aw/2, AY+AH+4);
      const last = (s.front + s.size - 1) % K;
      if (last !== s.front) { ctx.fillStyle=C.winT; ctx.fillText('↑rear', ax(last)+aw/2, AY+AH+4); }
    }
    ctx.fillStyle=C.dim; ctx.font='600 10.5px "Noto Sans TC", sans-serif';
    ctx.textAlign='center'; ctx.textBaseline='top';
    ctx.fillText('灰色 = 舊資料還躺在那裡,但已不屬於佇列', (ax0 + w - PAD)/2, AY+AH+24);

    // ── BAND 2 ──
    const B2 = 252;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 這一步執行了什麼', PAD, B2);
    rr(PAD, B2+10, w-2*PAD, 42, 6);
    ctx.fillStyle = done ? C.ok : (s.act==='intro' ? '#fafaf6' : ((s.act==='wrap'||s.act==='full') ? C.cur : C.win)); ctx.fill();
    ctx.lineWidth=1.6; ctx.strokeStyle = done ? C.okS : (s.act==='intro' ? C.grid : ((s.act==='wrap'||s.act==='full') ? C.curS : C.winS)); ctx.stroke();
    ctx.fillStyle = done ? C.okT : (s.act==='intro' ? C.text : ((s.act==='wrap'||s.act==='full') ? C.curT : C.winT));
    ctx.font='700 12px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(s.eq, w/2, B2+31);

    // ── BAND 3 ──
    const B3 = 324;
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
