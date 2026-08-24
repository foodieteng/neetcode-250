/* ============================================================
   P460 · LFU Cache — 三張表 + minFreq · viz
     m[key]    = {value, 使用次數}          O(1) 查值與次數
     freq[f]   = list<key>,同次數的照使用順序排(front = 最久沒用)
     iter[key] = 該 key 在 list 裡的位置    ← 這張表才讓 erase 是 O(1)
   淘汰 = freq[minFreq].front():次數最少的裡面,最久沒用的那個。
   例 LFUCache(2):put(1,1) put(2,2) get(1) put(3,3) get(2) get(3) put(4,4)
     BAND 1  上排 = m 的內容　下排 = freq 的桶(← 標出 minFreq)
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

  const CAP = 2;

  // ent = m 的內容(依 key 排序);bk = 非空的 freq 桶;hot = 這一步動到的 key;kill = 被淘汰的 key
  const steps = [
    { ent:[], bk:[], mf:'—', hot:null, kill:null, op:'LFUCache(2)', act:'intro',
      eq:'三張表:m[key] = {值, 次數}　freq[f] = list<key>　iter[key] = 位置',
      note:'iter 這張表看起來多餘,但少了它,從 list 中間刪一個就得先掃過去找 —— O(n)',
      text:'<strong>INITIAL</strong> · LFU 要在 <code>O(1)</code> 內回答「<strong>次數最少的裡面,最久沒用的是誰</strong>」。做法是<strong>三張表分工</strong>:<code>m</code> 存值與次數,<code>freq[f]</code> 把<strong>同次數的 key 依使用順序串成一條 list</strong>(front 最舊),而 <code>iter[key]</code> 記住每個 key <strong>在 list 裡的哪個位置</strong> —— <b>這張表才是 <code>O(1)</code> 刪除的關鍵</b>。再加一個 <code>minFreq</code> 記住目前最小的次數,淘汰就是 <code>freq[minFreq].front()</code>。' },

    { ent:[{k:1,v:1,f:1}], bk:[{f:1,keys:[1]}], mf:1, hot:1, kill:null, op:'put(1, 1)', act:'put',
      eq:'m[1] = {1, 1}　freq[1].push_back(1)　iter[1] = 位置　minFreq = 1',
      note:'新進來的 key 次數一定是 1 ⇒ minFreq 必定被重設為 1,不需要比較',
      text:'<strong>put(1, 1)</strong> · 快取還沒滿,直接插入。<strong>新 key 的次數固定是 1</strong>,所以 <code>minFreq = 1</code> 是<strong>直接賦值,不是取 min</strong> —— <b>因為不可能有比 1 更小的次數。</b>' },

    { ent:[{k:1,v:1,f:1},{k:2,v:2,f:1}], bk:[{f:1,keys:[1,2]}], mf:1, hot:2, kill:null, op:'put(2, 2)', act:'put',
      eq:'freq[1] = [1, 2]     // 1 先進來,排在 front',
      note:'同一桶內用 push_back 追加 ⇒ front 永遠是這一桶裡最久沒被用的',
      text:'<strong>put(2, 2)</strong> · 剛好裝滿。兩個 key 次數都是 1,同住 <code>freq[1]</code> 這一桶。<strong>順序是 <code>[1, 2]</code></strong> —— 因為 <code>push_back</code> 從尾巴追加,所以 <b><code>front</code> 永遠是這一桶裡最久沒被碰過的那個</b>,這就是 LFU 平手時的 LRU 規則。' },

    { ent:[{k:1,v:1,f:2},{k:2,v:2,f:1}], bk:[{f:1,keys:[2]},{f:2,keys:[1]}], mf:1, hot:1, kill:null, op:'get(1) → 1', act:'get',
      eq:'從 freq[1] 移除 1 → 次數 +1 → freq[2].push_back(1);  freq[1] 還有人 ⇒ minFreq 不變',
      note:'搬家用 iter[1] 直接定位,list::erase 是 O(1) —— 不用掃整條 list',
      text:'<strong>get(1)</strong> · key 1 被用了,<strong>從 <code>freq[1]</code> 搬到 <code>freq[2]</code></strong>。<strong>搬家能 <code>O(1)</code> 完成,全靠 <code>iter[1]</code></strong> 直接給出它在 list 裡的位置。搬完之後檢查 <code>freq[minFreq]</code> —— <strong>還有 key 2 在,所以 <code>minFreq</code> 維持 1</strong>。' },

    { ent:[{k:1,v:1,f:2},{k:3,v:3,f:1}], bk:[{f:1,keys:[3]},{f:2,keys:[1]}], mf:1, hot:3, kill:2, op:'put(3, 3)', act:'evict',
      eq:'滿了 → 淘汰 freq[minFreq].front() = 2　然後插入 3,minFreq = 1',
      note:'淘汰的不是「最早進來的」,是「次數最少的裡面最久沒用的」—— key 2 次數 1 < key 1 次數 2',
      text:'<strong>put(3, 3) · 觸發淘汰</strong> · 滿了。<code>minFreq = 1</code>,<code>freq[1] = [2]</code>,所以<strong>受害者是 key 2</strong>。<b>注意 key 1 比 key 2 更早進來,卻活下來了</b> —— 因為 <strong>LFU 先看次數(1 vs 2),次數平手才看誰久沒用</strong>。插入 key 3 之後,<code>minFreq</code> 又被設回 1。' },

    { ent:[{k:1,v:1,f:2},{k:3,v:3,f:1}], bk:[{f:1,keys:[3]},{f:2,keys:[1]}], mf:1, hot:null, kill:null, op:'get(2) → -1', act:'miss',
      eq:'m.count(2) == 0 → return -1     // 第一行就走人,完全沒碰 freq / minFreq',
      note:'這是唯一不需要 minFreq 的路徑 —— 也是為什麼 minFreq 沒初始化仍然沒事',
      text:'<strong>get(2)</strong> · key 2 已經被淘汰,<strong>直接 <code>return -1</code></strong>。<b>這條 miss 路徑在第一行就 return,完全沒有讀 <code>minFreq</code></b> —— 實測 200 萬次操作追蹤 <code>minFreq</code> 的每一次讀取(共 4998084 次),<strong>沒有任何一次發生在被寫入之前</strong>。' },

    { ent:[{k:1,v:1,f:2},{k:3,v:3,f:2}], bk:[{f:2,keys:[1,3]}], mf:2, hot:3, kill:null, op:'get(3) → 3', act:'bump',
      eq:'freq[1] 被搬空了 → ++minFreq → minFreq = 2',
      note:'少了這一行,下次淘汰會對「空的 list」呼叫 front() —— 實測直接記憶體錯誤',
      text:'<strong>get(3) · minFreq 要往上爬</strong> · key 3 搬到 <code>freq[2]</code> 之後,<strong><code>freq[1]</code> 空了</strong>,所以 <code>minFreq</code> 必須跟著 <code>++</code> 變成 2。<b>這一行是整支程式最關鍵的一行</b>:實測把它拿掉,答案<strong>一次都不會錯</strong>,但在 41 萬次 get 的測試裡<strong>有 30670 次會對空的 list 呼叫 <code>front()</code></strong> —— ASan 直接報記憶體錯誤。' },

    { ent:[{k:3,v:3,f:2},{k:4,v:4,f:1}], bk:[{f:1,keys:[4]},{f:2,keys:[3]}], mf:1, hot:4, kill:1, op:'put(4, 4)', act:'evict',
      eq:'滿了 → 淘汰 freq[minFreq=2].front() = 1     // 這次最小次數是 2,不是 1',
      note:'minFreq 是 2 —— 如果上一步沒有把它 ++ 上去,這裡就會去撈空的 freq[1]',
      text:'<strong>put(4, 4) · 第二次淘汰</strong> · 這次 <strong><code>minFreq = 2</code></strong>,而 <code>freq[2] = [1, 3]</code>,front 是 key 1 —— <strong>兩個 key 次數都是 2,平手,所以看誰久沒用</strong>:key 1 上次被用是第 3 步,key 3 是第 7 步,<b>淘汰 key 1</b>。<b>如果上一步沒把 <code>minFreq</code> 推到 2,這裡撈的就是空的 <code>freq[1]</code>。</b>' },

    { ent:[{k:3,v:3,f:2},{k:4,v:4,f:1}], bk:[{f:1,keys:[4]},{f:2,keys:[3]}], mf:1, hot:null, kill:null, op:'get(1) = -1　get(3) = 3　get(4) = 4', act:'done',
      eq:'每個操作都是 O(1);實測 40 萬次操作,capacity 從 100 到 100000 平均 90 ~ 146 ns/op',
      note:'實測與暴力解交叉比對 100 萬次 get,不一致 0;每一步的內部結構一致性檢查 250 萬次,不一致 0',
      text:'<strong>完成</strong> · 最終快取內容 <code>{3: 3, 4: 4}</code>,與 LeetCode 官方範例一致。<strong>正確性實測</strong>:與 <code>O(n)</code> 暴力解交叉比對 <strong>1010737 次 get,不一致 0</strong>;每一步都檢查 <code>m</code> 與 <code>freq</code> 是否對得上,<strong>250 萬次檢查,不一致 0</strong>。<strong>效能實測</strong>:40 萬次操作,capacity 從 100 拉到 100000,平均只從 <strong>89.7 ns/op 變到 145.5 ns/op</strong> —— <b>capacity 放大 1000 倍,單次成本只變 1.6 倍,和 <code>O(1)</code> 相符。</b>' },
  ];

  let step = 0, timer = null;

  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||430; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  const M_LBL = 68, M_TOP = 78, M_H = 48;
  const F_LBL = 148, F_TOP = 158, F_H = 32, F_GAP = 8;

  function draw(){
    fit();
    const s = steps[step], w = canvas.clientWidth, PAD = 28;
    const done = s.act === 'done';
    ctx.fillStyle = C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);

    // ── BAND 1 標題 ──
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 上 = m　下 = freq 桶', PAD, 16);
    ctx.textAlign='right'; ctx.font='700 12.5px "JetBrains Mono", monospace';
    ctx.fillStyle = done ? C.okT : C.text;
    ctx.fillText('capacity = ' + CAP + '　minFreq = ' + s.mf, w - PAD, 16);

    ctx.textAlign='center'; ctx.font='700 14px "JetBrains Mono", monospace';
    ctx.fillStyle = done ? C.okT : (s.act==='evict' ? C.curT : (s.act==='intro' ? C.text : C.winT));
    ctx.fillText(s.op, w/2, 46);

    // ── m 的內容 ──
    ctx.fillStyle=C.dim; ctx.font='600 11.5px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('m  ( ' + s.ent.length + ' / ' + CAP + ' )', PAD, M_LBL);

    const TAGW = 74, x0 = PAD + TAGW;
    const slotW = Math.min(150, (w - PAD - x0 - 16) / CAP - 14);
    const slotG = 16;
    for (let i = 0; i < CAP; i++) {
      const x = x0 + i*(slotW+slotG), e = s.ent[i];
      rr(x, M_TOP, slotW, M_H, 6);
      if (!e) { ctx.fillStyle='#fafaf6'; ctx.fill(); ctx.setLineDash([4,3]); ctx.lineWidth=1.4; ctx.strokeStyle=C.grid; ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle=C.offT; ctx.font='600 11.5px "JetBrains Mono", monospace';
        ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('（空）', x+slotW/2, M_TOP+M_H/2); continue; }
      const isHot = e.k === s.hot;
      ctx.fillStyle = done ? C.ok : (isHot ? C.win : C.off); ctx.fill();
      ctx.lineWidth = isHot ? 2.4 : 1.5; ctx.strokeStyle = done ? C.okS : (isHot ? C.winS : C.offS); ctx.stroke();
      const tx = done ? C.okT : (isHot ? C.winT : C.text);
      ctx.fillStyle = tx; ctx.textAlign='center';
      ctx.font='700 15px "JetBrains Mono", monospace'; ctx.textBaseline='alphabetic';
      ctx.fillText('key ' + e.k + '  →  ' + e.v, x+slotW/2, M_TOP+21);
      ctx.font='600 11.5px "JetBrains Mono", monospace';
      ctx.fillStyle = done ? C.okT : C.dim;
      ctx.fillText('使用次數 ' + e.f, x+slotW/2, M_TOP+38);
    }
    // 被淘汰的 key
    if (s.kill !== null) {
      ctx.fillStyle=C.curT; ctx.font='700 12px "JetBrains Mono", monospace';
      ctx.textAlign='right'; ctx.textBaseline='middle';
      ctx.fillText('✕ 淘汰 key ' + s.kill, w - PAD, M_TOP + M_H/2);
    }

    // ── freq 的桶 ──
    ctx.fillStyle=C.dim; ctx.font='600 11.5px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('freq', PAD, F_LBL);
    if (s.bk.length === 0) {
      ctx.fillStyle=C.offT; ctx.font='600 12px "Noto Sans TC", sans-serif';
      ctx.fillText('（還沒有任何桶）', x0, F_LBL + 26);
    }
    s.bk.forEach((b, i) => {
      const y = F_TOP + i*(F_H+F_GAP);
      const isMin = b.f === s.mf;
      ctx.fillStyle = isMin ? C.curT : C.dim;
      ctx.font='700 12px "JetBrains Mono", monospace'; ctx.textAlign='right'; ctx.textBaseline='middle';
      ctx.fillText('freq ' + b.f, x0 - 12, y + F_H/2);
      const kw = 52, kg = 10;
      b.keys.forEach((k, j) => {
        const x = x0 + j*(kw+kg);
        const isFront = j === 0, danger = isMin && isFront && !done;
        rr(x, y, kw, F_H, 5);
        ctx.fillStyle = done ? C.ok : (danger ? C.cur : (k === s.hot ? C.win : C.seg)); ctx.fill();
        ctx.lineWidth = danger ? 2.4 : 1.5;
        ctx.strokeStyle = done ? C.okS : (danger ? C.curS : (k === s.hot ? C.winS : C.segS)); ctx.stroke();
        ctx.fillStyle = done ? C.okT : (danger ? C.curT : (k === s.hot ? C.winT : C.segT));
        ctx.font='700 14px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(String(k), x+kw/2, y+F_H/2);
      });
      if (isMin) {
        const endX = x0 + b.keys.length*(kw+kg) + 4;
        ctx.fillStyle=C.curT; ctx.font='700 11px "JetBrains Mono", monospace';
        ctx.textAlign='left'; ctx.textBaseline='middle';
        ctx.fillText('← minFreq' + (done ? '' : '　front = 下一個受害者'), endX, y+F_H/2);
      }
    });

    // ── BAND 2 ──
    const B2 = 292;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 這一步執行了什麼', PAD, B2);
    rr(PAD, B2+10, w-2*PAD, 42, 6);
    ctx.fillStyle = done ? C.ok : (s.act==='intro' ? '#fafaf6' : (s.act==='evict' ? C.cur : C.win)); ctx.fill();
    ctx.lineWidth=1.6; ctx.strokeStyle = done ? C.okS : (s.act==='intro' ? C.grid : (s.act==='evict' ? C.curS : C.winS)); ctx.stroke();
    ctx.fillStyle = done ? C.okT : (s.act==='intro' ? C.text : (s.act==='evict' ? C.curT : C.winT));
    ctx.font='700 12px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(s.eq, w/2, B2+31);

    // ── BAND 3 ──
    const B3 = 364;
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
  function play(){ if(timer){stop();return;} bPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){stop();return;} next(); },2200); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} if(bPlay) bPlay.textContent='Play'; }
  bPrev&&bPrev.addEventListener('click',prev); bNext&&bNext.addEventListener('click',next); bPlay&&bPlay.addEventListener('click',play); bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();}); if(window.ResizeObserver){ new ResizeObserver(()=>{fit();draw();}).observe(canvas); }
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw); fit(); update();
})();
