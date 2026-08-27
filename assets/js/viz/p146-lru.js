/* ============================================================
   P146 · LRU Cache — 雙向串列 + 雜湊表 · viz
     雙向串列決定「順序」:left 端是最舊(下一個受害者),right 端是最新
     雜湊表決定「速度」:key → 節點指標,一次查表就拿到節點,不用走串列
   「使用一次」= remove(node) 再 insert(node) —— 把它搬到 right 端。
   兩個哨兵 left / right 讓 remove / insert 永遠不必判斷 nullptr。
   例 LRUCache(2):put(1,1) put(2,2) get(1) put(3,3) get(2) put(4,4)
     BAND 1  雙向串列(含兩個哨兵)+ 下方的雜湊表
     BAND 2  這一步執行了什麼
     BAND 3  為什麼
   所有狀態取自實測 trace(見 review.html 範例 Trace),未手推。
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

  const CAP = 2;

  // nodes = 串列上的真實節點(由 left 端到 right 端);hot = 這一步動到的 key;kill = 被淘汰的
  const steps = [
    { nodes:[], hot:null, kill:null, op:'LRUCache(2)', act:'intro',
      eq:'left <-> right     // 兩個哨兵先接起來,串列「永遠非空」',
      note:'有哨兵就不必判斷 nullptr —— remove / insert 各自只有四行,沒有任何 if',
      text:'<strong>INITIAL</strong> · 兩個資料結構分工:<strong>雙向串列決定「順序」</strong>(left 端最舊、right 端最新),<strong>雜湊表決定「速度」</strong>(key → 節點指標,一次查表就拿到節點)。而<strong>兩個哨兵 <code>left</code> / <code>right</code></strong> 是讓程式碼變乾淨的關鍵:<b>串列永遠非空,所以 <code>remove</code> 和 <code>insert</code> 裡的 <code>node-&gt;prev</code>、<code>node-&gt;next</code> 永遠不會是 <code>nullptr</code>,一個 <code>if</code> 都不用寫。</b>' },

    { nodes:[{k:1,v:1}], hot:1, kill:null, op:'put(1, 1)', act:'put',
      eq:'新節點插到 right 之前 → left <-> [1] <-> right;cache[1] = 節點位址',
      note:'insert 永遠插在 right 端 —— 「剛用過的」定義上就是最新的',
      text:'<strong>put(1, 1)</strong> · 還沒滿,直接新增。<code>insert</code> 把節點<strong>接在 <code>right</code> 哨兵之前</strong>,也就是<strong>最新端</strong>。同時 <code>cache[1]</code> 記下這個節點的<strong>位址</strong> —— <b>之後要找它就不必走串列了。</b>' },

    { nodes:[{k:1,v:1},{k:2,v:2}], hot:2, kill:null, op:'put(2, 2)', act:'put',
      eq:'left <-> [1] <-> [2] <-> right      // 剛好裝滿',
      note:'左邊那個(key 1)現在是最舊的 —— 它就是下一個要被淘汰的',
      text:'<strong>put(2, 2)</strong> · 剛好裝滿。此刻 <strong><code>left-&gt;next</code> 是 key 1</strong>,也就是<strong>最久沒用的</strong>。<b>注意這件事完全不需要計算 —— 順序是「插入時就維持好的」,不是「查詢時才算出來的」。</b>' },

    { nodes:[{k:2,v:2},{k:1,v:1}], hot:1, kill:null, op:'get(1) → 1', act:'get',
      eq:'remove(node) 再 insert(node)     // 從原位拆下來,重新接到 right 端',
      note:'兩個動作各四行指標賦值,都是 O(1) —— 而「找到 node」是靠 cache 查表,不是走串列',
      text:'<strong>get(1) · 使用 = 搬到最新端</strong> · 先 <code>remove</code> 把節點從原位<strong>拆下來</strong>,再 <code>insert</code> 把它<strong>接到 <code>right</code> 端</strong>。<b>整個過程 <code>O(1)</code>,而關鍵是「怎麼找到那個節點」</b> —— 靠 <code>cache[1]</code> 一次雜湊查表直接拿到指標,<strong>不需要從頭走串列</strong>。搬完之後,最舊的變成 key 2。' },

    { nodes:[{k:1,v:1},{k:3,v:3}], hot:3, kill:2, op:'put(3, 3)', act:'evict',
      eq:'滿了 → lru = left->next = 節點 2 → remove(lru);  cache.erase(2);  再插入 3',
      note:'淘汰對象直接就是 left->next —— 不用比較、不用掃描,一步到位',
      text:'<strong>put(3, 3) · 觸發淘汰</strong> · 滿了,受害者<strong>就是 <code>left-&gt;next</code></strong>,也就是 key 2。<b>不需要任何比較或掃描</b> —— 串列的順序本身就是答案。要做兩件事:<strong>從串列拆下來</strong>(<code>remove</code>),以及<strong>從雜湊表刪掉</strong>(<code>cache.erase(lru-&gt;key)</code>)。<b>兩張表都要同步清理,漏掉一邊就會留下幽靈。</b>' },

    { nodes:[{k:1,v:1},{k:3,v:3}], hot:null, kill:null, op:'get(2) → -1', act:'miss',
      eq:'cache.find(2) == cache.end() → return -1     // 第一行就走人,沒碰串列',
      note:'miss 不算一次使用 —— 所以完全不動串列,順序保持原樣',
      text:'<strong>get(2)</strong> · key 2 已經被淘汰,<strong>直接 <code>return -1</code></strong>。<b>miss 不算「使用」</b>,所以串列<strong>一根指標都不動</strong> —— 這也是為什麼判斷要寫在最前面。' },

    { nodes:[{k:3,v:3},{k:4,v:4}], hot:4, kill:1, op:'put(4, 4)', act:'evict',
      eq:'滿了 → 淘汰 left->next = 節點 1     // key 1 上次被用是 get(1),比 key 3 早',
      note:'key 1 曾經被 get 過所以活過一輪 —— 但沒有再被用,就又沉到 left 端了',
      text:'<strong>put(4, 4) · 第二次淘汰</strong> · 這次的受害者是 <strong>key 1</strong>。<b>它在第 3 步被 <code>get</code> 過,因此躲過了第一次淘汰</b> —— 但之後沒再被碰,就<strong>一路被新來的擠回 <code>left</code> 端</strong>。<b>這就是 LRU 的全部:每次使用把你推到最新端,不用就自然往受害端漂。</b>' },

    { nodes:[{k:3,v:3},{k:4,v:4}], hot:null, kill:null, op:'get(1) = -1　get(3) = 3　get(4) = 4', act:'done',
      eq:'兩個操作都是 O(1);實測 40 萬次操作,capacity 從 100 到 100000 都在 27 ~ 43 ns/op',
      note:'實測與暴力解交叉比對 120 萬次 get 不一致 0;每一步比對完整順序與雙向連結,共 180 萬次,不一致 0',
      text:'<strong>完成</strong> · 最終快取內容 <code>{3: 3, 4: 4}</code>,與 LeetCode 官方範例一致。<strong>正確性實測</strong>:與 <code>O(n)</code> 暴力解交叉比對 <strong>1200008 次 <code>get</code>,不一致 0</strong>;而且每一步都比對<strong>完整的 LRU→MRU 順序</strong>並檢查雙向連結,<strong>共 180 萬次檢查,不一致 0</strong>。<strong>效能實測</strong>:40 萬次操作,capacity 從 100 到 100000,<strong>27 ~ 43 ns/op,沒有成長趨勢</strong>。' },
  ];

  let step = 0, timer = null;

  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||410; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function dbl(x1,x2,y,col){                 // 雙向箭頭
    ctx.strokeStyle=col; ctx.fillStyle=col; ctx.lineWidth=1.8;
    ctx.beginPath(); ctx.moveTo(x1,y); ctx.lineTo(x2,y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x2,y); ctx.lineTo(x2-7,y-4.5); ctx.lineTo(x2-7,y+4.5); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x1,y); ctx.lineTo(x1+7,y-4.5); ctx.lineTo(x1+7,y+4.5); ctx.closePath(); ctx.fill(); }

  const NODE_TOP = 92, NH = 52, MIDY = NODE_TOP + NH/2, NODE_BOT = NODE_TOP + NH;
  const END_Y = NODE_BOT + 18;
  const MAP_LBL = 208, MAP_TOP = 216, MAP_H = 30;

  function draw(){
    fit();
    const s = steps[step], w = canvas.clientWidth, PAD = 28;
    const done = s.act === 'done';
    ctx.fillStyle = C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);

    // ── BAND 1 標題 ──
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 雙向串列 + 雜湊表', PAD, 16);
    ctx.textAlign='right'; ctx.font='700 12.5px "JetBrains Mono", monospace';
    ctx.fillStyle = done ? C.okT : C.text;
    ctx.fillText('capacity = ' + CAP + '　目前 ' + s.nodes.length + ' 個', w - PAD, 16);

    ctx.textAlign='center'; ctx.font='700 14px "JetBrains Mono", monospace';
    ctx.fillStyle = done ? C.okT : (s.act==='evict' ? C.curT : (s.act==='intro' ? C.text : C.winT));
    ctx.fillText(s.op, w/2, 44);

    ctx.font='600 11.5px "Noto Sans TC", sans-serif'; ctx.fillStyle = C.dim;
    ctx.fillText('left 端 = 最久沒用(下一個受害者)　　right 端 = 剛剛用過', w/2, 66);

    // ── 串列:left 哨兵 + 節點 + right 哨兵 ──
    const cells = [{sentinel:'left'}, ...s.nodes, {sentinel:'right'}];
    const N = cells.length, MAXN = CAP + 2;
    const usable = w - 2*PAD - 20;
    const nw = Math.min(88, usable / MAXN - 34);
    const gap = Math.min(46, (usable - MAXN*nw) / (MAXN - 1));
    const totalW = N*nw + (N-1)*gap;
    const x0 = (w - totalW) / 2;
    const edge = i => x0 + i*(nw+gap);
    const cx = i => edge(i) + nw/2;

    for (let i = 0; i + 1 < N; i++) dbl(edge(i)+nw+4, edge(i+1)-4, MIDY, C.grid);

    cells.forEach((c, i) => {
      rr(edge(i), NODE_TOP, nw, NH, 6);
      if (c.sentinel) {
        ctx.fillStyle='#fafaf6'; ctx.fill(); ctx.setLineDash([4,3]); ctx.lineWidth=1.5; ctx.strokeStyle=C.grid; ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle=C.offT; ctx.font='700 13px "JetBrains Mono", monospace';
        ctx.textAlign='center'; ctx.textBaseline='alphabetic';
        ctx.fillText(c.sentinel, cx(i), MIDY - 1);
        ctx.font='600 10px "Noto Sans TC", sans-serif';
        ctx.fillText('哨兵', cx(i), MIDY + 14);
        return; }
      const isHot = c.k === s.hot;
      ctx.fillStyle = done ? C.ok : (isHot ? C.win : C.seg); ctx.fill();
      ctx.lineWidth = isHot ? 2.4 : 1.6;
      ctx.strokeStyle = done ? C.okS : (isHot ? C.winS : C.segS); ctx.stroke();
      ctx.fillStyle = done ? C.okT : (isHot ? C.winT : C.segT);
      ctx.textAlign='center'; ctx.textBaseline='alphabetic';
      ctx.font='700 15px "JetBrains Mono", monospace';
      ctx.fillText('key ' + c.k, cx(i), MIDY - 1);
      ctx.font='600 12px "JetBrains Mono", monospace';
      ctx.fillText('val ' + c.v, cx(i), MIDY + 15);
    });

    // ── 兩端的標記 ──
    if (s.nodes.length > 0 && !done) {
      ctx.textAlign='center'; ctx.textBaseline='top'; ctx.font='700 10.5px "JetBrains Mono", monospace';
      ctx.fillStyle=C.curT; ctx.fillText('↑ 最舊 · 下一個受害者', cx(1), END_Y);
      if (s.nodes.length > 1) { ctx.fillStyle=C.winT; ctx.fillText('↑ 最新', cx(N-2), END_Y); }
    }
    if (s.kill !== null) {                       // 放在節點列下方置中,免得在窄螢幕撞上 left 哨兵
      ctx.fillStyle=C.curT; ctx.font='700 12px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='top';
      ctx.fillText('✕ 已淘汰 key ' + s.kill + '（從串列拆下 + 從雜湊表刪掉）', w/2, END_Y + 20);
    }

    // ── 雜湊表 ──
    ctx.fillStyle=C.dim; ctx.font='600 11.5px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('cache（雜湊表）key → 節點位址', PAD, MAP_LBL);
    if (s.nodes.length === 0) {
      ctx.fillStyle=C.offT; ctx.font='600 12px "Noto Sans TC", sans-serif';
      ctx.fillText('（空）', PAD, MAP_LBL + 26);
    }
    // 依 key 排序,強調「雜湊表沒有順序,順序在串列那邊」
    const keys = s.nodes.map(n=>n.k).slice().sort((a,b)=>a-b);
    const cw2 = 96;
    keys.forEach((k, j) => {
      const x = PAD + j*(cw2+14);
      rr(x, MAP_TOP, cw2, MAP_H, 5);
      ctx.fillStyle = done ? C.ok : (k===s.hot ? C.win : C.off); ctx.fill();
      ctx.lineWidth=1.4; ctx.strokeStyle = done ? C.okS : (k===s.hot ? C.winS : C.offS); ctx.stroke();
      ctx.fillStyle = done ? C.okT : (k===s.hot ? C.winT : C.text);
      ctx.font='700 12px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(k + ' → ▪', x+cw2/2, MAP_TOP+MAP_H/2);
    });
    if (s.nodes.length > 0) {
      ctx.fillStyle=C.dim; ctx.font='600 11px "Noto Sans TC", sans-serif';
      ctx.textAlign='left'; ctx.textBaseline='middle';
      ctx.fillText('（雜湊表本身沒有順序 —— 順序全在上面那條串列）', PAD + keys.length*(cw2+14) + 6, MAP_TOP+MAP_H/2);
    }

    // ── BAND 2 ──
    const B2 = 278;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 這一步執行了什麼', PAD, B2);
    rr(PAD, B2+10, w-2*PAD, 42, 6);
    ctx.fillStyle = done ? C.ok : (s.act==='intro' ? '#fafaf6' : (s.act==='evict' ? C.cur : C.win)); ctx.fill();
    ctx.lineWidth=1.6; ctx.strokeStyle = done ? C.okS : (s.act==='intro' ? C.grid : (s.act==='evict' ? C.curS : C.winS)); ctx.stroke();
    ctx.fillStyle = done ? C.okT : (s.act==='intro' ? C.text : (s.act==='evict' ? C.curT : C.winT));
    ctx.font='700 12px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(s.eq, w/2, B2+31);

    // ── BAND 3 ──
    const B3 = 350;
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
  function play(){ if(timer){stop();return;} bPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){stop();return;} next(); },2150); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} if(bPlay) bPlay.textContent='Play'; }
  bPrev&&bPrev.addEventListener('click',prev); bNext&&bNext.addEventListener('click',next); bPlay&&bPlay.addEventListener('click',play); bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();}); if(window.ResizeObserver){ new ResizeObserver(()=>{fit();draw();}).observe(canvas); }
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw); fit(); update();
})();
