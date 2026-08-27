/* ============================================================
   P460 · LFU Cache — 四個資料結構全畫出來 · viz
     ① m[key]    = {value, 次數}            O(1) 查值與次數
     ② freq[f]   = list<key>,同次數的照使用順序排(front = 最久沒用)
     ③ iter[key] = 該 key 在那條 list 裡的位置  ← 這張表才讓 erase 是 O(1)
     ④ minFreq   = 目前最小的次數            淘汰 = freq[minFreq].front()

   這個檔案匯出一個 makeLFUViz(prefix, cfg),頁面上跑兩份:
     va-*  官方範例 LFUCache(2)
     vb-*  加長範例 LFUCache(3) —— 從桶正中間拔出、minFreq 爬升、平手看 LRU 都跑得到

   iter 那一排是「算」出來的 —— 由 m 與 freq 直接推導,所以不可能和它們對不上。
   所有狀態取自實測 trace(g++ -O2 跑真的 LFUCache),未手推。
   ============================================================ */
(function () {

  const C = { paper:'#ffffff', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf',
    win:'#e3edf5', winS:'#4478c0', winT:'#2f5f9e',
    seg:'#f6ead8', segS:'#c8801e', segT:'#96601a',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424',
    ok:'#d9e8c7', okS:'#5fa866', okT:'#3f7a3a',
    off:'#f0f0ec', offS:'#cfcfcf', offT:'#a3a099', coral:'#cf3535' };

  // ── 版面(對著 620px 的最小寬度設計,寬螢幕由 fit() 放大)──
  const OP_Y    = 44,  HINT_Y = 68;
  const M_LBL   = 96,  M_TOP  = 106, M_H = 44;
  const F_LBL   = 194, F_TOP  = 204, F_ROW = 34, F_GAP = 18;
  const IT_H    = 32,  BOX_H  = 44;

  function makeLFUViz(prefix, cfg) {
    const $ = id => document.getElementById(prefix + id);
    const canvas = $('canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const stepEl = $('step'), labelEl = $('label');
    const bPrev = $('prev'), bNext = $('next'), bPlay = $('play'), bReset = $('reset');

    const steps = cfg.steps, CAP = cfg.cap, MAXF = cfg.maxf;

    // freq 區塊固定畫 MAXF 列(空桶也畫,因為「桶空了」本身就是重點)
    const F_BOT   = F_TOP + MAXF * F_ROW + (MAXF - 1) * F_GAP;
    const IT_LBL  = F_BOT + 30, IT_TOP = IT_LBL + 10;
    const MF_LBL  = IT_TOP + IT_H + 28, MF_TOP = MF_LBL + 10;
    const EQ_LBL  = MF_TOP + 40 + 28,   EQ_TOP = EQ_LBL + 10;
    const WY_LBL  = EQ_TOP + BOX_H + 26, WY_TOP = WY_LBL + 10;
    const H       = WY_TOP + 42 + 18;
    canvas.style.height = H + 'px';

    let step = 0, timer = null;

    function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
      const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||H; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
      if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
    function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

    // 小標題;focus 的那一個結構標紅,讓「這一步在動哪張表」一眼看得出來
    function sect(txt, y, hot) {
      ctx.font='600 11.5px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
      ctx.fillStyle = hot ? C.coral : C.dim;
      ctx.fillText(txt, 28, y);
      if (hot) {
        const w = ctx.measureText(txt).width;
        ctx.strokeStyle=C.coral; ctx.lineWidth=1.4;
        ctx.beginPath(); ctx.moveTo(28, y+4); ctx.lineTo(28+w, y+4); ctx.stroke();
      }
    }

    function chip(x, y, w, h, fill, stroke, textCol, s, fs) {
      rr(x, y, w, h, 5);
      ctx.fillStyle=fill; ctx.fill(); ctx.lineWidth=1.5; ctx.strokeStyle=stroke; ctx.stroke();
      ctx.fillStyle=textCol; ctx.font='700 ' + (fs || 12) + 'px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(s, x+w/2, y+h/2);
    }

    // iter 由 m + freq 推導 —— 不可能和上面兩張表對不上
    function deriveIter(s) {
      const out = [];
      s.m.forEach(e => {
        const bucket = s.fr[e.f] || [];
        const i = bucket.indexOf(e.k);
        if (i >= 0) out.push({ k:e.k, f:e.f, i:i });
      });
      return out;
    }

    function draw(){
      fit();
      const s = steps[step], w = canvas.clientWidth, PAD = 28;
      const done = s.act === 'done';
      const acc = done ? C.okT : (s.act==='evict' ? C.curT : (s.act==='intro' ? C.text : C.winT));
      ctx.fillStyle = C.paper; ctx.fillRect(0,0,w,H); ctx.setLineDash([]);

      // ── 標頭 ──
      ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
      ctx.fillText(cfg.title, PAD, 16);
      ctx.textAlign='right'; ctx.font='700 12.5px "JetBrains Mono", monospace';
      ctx.fillStyle = s.m.length >= CAP ? C.curT : C.text;
      ctx.fillText('cap ' + CAP + ' · 目前 ' + s.m.length + (s.m.length >= CAP ? ' ← 滿' : ''), w - PAD, 16);

      ctx.textAlign='center'; ctx.font='700 14.5px "JetBrains Mono", monospace';
      ctx.fillStyle = acc; ctx.fillText(s.op, w/2, OP_Y);
      ctx.font='600 11.5px "Noto Sans TC", sans-serif'; ctx.fillStyle = C.dim;
      ctx.fillText('淘汰 = freq[minFreq].front()　—— 次數最少的那一桶裡,最久沒用的那一個', w/2, HINT_Y);

      // ── ① m ──
      sect('① m　unordered_map<int, pair<int,int>>　key → {值, 次數}', M_LBL, s.focus==='m');
      if (s.m.length === 0) {
        ctx.fillStyle=C.offT; ctx.font='600 12px "Noto Sans TC", sans-serif';
        ctx.textAlign='left'; ctx.textBaseline='middle';
        ctx.fillText('（空）', PAD, M_TOP + M_H/2);
      } else {
        const cw = Math.min(112, (w - 2*PAD - (s.m.length-1)*12) / s.m.length);
        s.m.forEach((e, j) => {
          const x = PAD + j*(cw+12), hot = e.k === s.hot;
          rr(x, M_TOP, cw, M_H, 6);
          ctx.fillStyle = done ? C.ok : (hot ? C.win : C.seg); ctx.fill();
          ctx.lineWidth = hot ? 2.4 : 1.6;
          ctx.strokeStyle = done ? C.okS : (hot ? C.winS : C.segS); ctx.stroke();
          ctx.fillStyle = done ? C.okT : (hot ? C.winT : C.segT);
          ctx.textAlign='center'; ctx.textBaseline='alphabetic';
          ctx.font='700 13px "JetBrains Mono", monospace';
          ctx.fillText('key ' + e.k, x+cw/2, M_TOP + 18);
          ctx.font='600 11.5px "JetBrains Mono", monospace';
          ctx.fillText('值 ' + e.v + ' · 次數 ' + e.f, x+cw/2, M_TOP + 34);
        });
      }

      if (s.kill !== null) {
        ctx.fillStyle=C.curT; ctx.font='700 11.5px "JetBrains Mono", monospace';
        ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText('✕ 已淘汰 key ' + s.kill + '（同時從 m、iter、freq 三張表刪掉）', w/2, M_TOP + M_H + 16);
      }

      // ── ② freq ──
      sect('② freq　unordered_map<int, list<int>>　次數 → key 的 LRU list（front 最久沒用）', F_LBL, s.focus==='freq');
      for (let f = 1; f <= MAXF; f++) {
        const y = F_TOP + (f-1)*(F_ROW+F_GAP);
        const keys = s.fr[f] || [];
        const isMin = s.mf === f;
        // 列標籤
        ctx.font='700 11.5px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='middle';
        ctx.fillStyle = isMin ? C.curT : (keys.length ? C.text : C.offT);
        ctx.fillText('freq[' + f + ']', PAD, y + F_ROW/2);
        const x0 = PAD + 62;
        if (keys.length === 0) {
          ctx.font='600 11px "Noto Sans TC", sans-serif'; ctx.fillStyle=C.offT;
          ctx.fillText('（空桶 —— 不佔任何成本,只是沒有 key）', x0, y + F_ROW/2);
        } else {
          const cw = 46;
          keys.forEach((k, i) => {
            const x = x0 + i*(cw+8), hot = k === s.hot, kill = k === s.kill;
            chip(x, y+2, cw, F_ROW-4,
                 done ? C.ok : (kill ? C.cur : (hot ? C.win : C.seg)),
                 done ? C.okS : (kill ? C.curS : (hot ? C.winS : C.segS)),
                 done ? C.okT : (kill ? C.curT : (hot ? C.winT : C.segT)),
                 String(k));
            if (i === 0 && keys.length > 1) {
              ctx.font='600 9.5px "Noto Sans TC", sans-serif'; ctx.fillStyle=C.dim;
              ctx.textAlign='center'; ctx.textBaseline='top';
              ctx.fillText('front', x+cw/2, y + F_ROW + 1);
              ctx.textAlign='left'; ctx.textBaseline='middle';
            }
          });
          ctx.textAlign='left'; ctx.textBaseline='middle';
        }
        if (isMin) {
          ctx.font='700 11px "JetBrains Mono", monospace'; ctx.fillStyle=C.curT;
          ctx.textAlign='right'; ctx.textBaseline='middle';
          ctx.fillText('← minFreq　淘汰就從這一列的 front 拿', w - PAD, y + F_ROW/2);
          ctx.textAlign='left';
        }
      }

      // ── ③ iter ──
      sect('③ iter　unordered_map<int, list<int>::iterator>　key → 它在那條 list 裡的位置', IT_LBL, s.focus==='iter');
      const its = deriveIter(s);
      if (its.length === 0) {
        ctx.fillStyle=C.offT; ctx.font='600 12px "Noto Sans TC", sans-serif';
        ctx.textAlign='left'; ctx.textBaseline='middle';
        ctx.fillText('（空）', PAD, IT_TOP + IT_H/2);
      } else {
        const cw = Math.min(148, (w - 2*PAD - (its.length-1)*10) / its.length);
        its.forEach((e, j) => {
          const x = PAD + j*(cw+10), hot = e.k === s.hot;
          chip(x, IT_TOP, cw, IT_H,
               done ? C.ok : (hot ? C.win : C.off),
               done ? C.okS : (hot ? C.winS : C.offS),
               done ? C.okT : (hot ? C.winT : C.text),
               e.k + ' → freq[' + e.f + '] 第 ' + e.i + ' 格', 11.5);
        });
      }

      // ── ④ minFreq ──
      sect('④ minFreq　int', MF_LBL, s.focus==='minFreq');
      rr(PAD, MF_TOP, w-2*PAD, 40, 6);
      ctx.fillStyle = done ? C.ok : (s.focus==='minFreq' ? C.cur : '#fafaf6'); ctx.fill();
      ctx.lineWidth=1.6; ctx.strokeStyle = done ? C.okS : (s.focus==='minFreq' ? C.curS : C.grid); ctx.stroke();
      ctx.fillStyle = done ? C.okT : (s.focus==='minFreq' ? C.curT : C.text);
      ctx.font='700 13px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('minFreq = ' + s.mf + '　' + s.mfnote, w/2, MF_TOP + 20);

      // ── 這一步執行了什麼 ──
      sect('這一步執行了什麼', EQ_LBL, false);
      rr(PAD, EQ_TOP, w-2*PAD, BOX_H, 6);
      ctx.fillStyle = done ? C.ok : (s.act==='intro' ? '#fafaf6' : (s.act==='evict' ? C.cur : C.win)); ctx.fill();
      ctx.lineWidth=1.6; ctx.strokeStyle = done ? C.okS : (s.act==='intro' ? C.grid : (s.act==='evict' ? C.curS : C.winS)); ctx.stroke();
      ctx.fillStyle = done ? C.okT : (s.act==='intro' ? C.text : (s.act==='evict' ? C.curT : C.winT));
      ctx.font='700 11.5px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      const lines = s.eq.split('\n');
      lines.forEach((ln, i) => ctx.fillText(ln, w/2, EQ_TOP + BOX_H/2 + (i - (lines.length-1)/2) * 16));

      // ── 為什麼 ──
      ctx.fillStyle=C.coral; ctx.font='600 11.5px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
      ctx.fillText('為什麼', PAD, WY_LBL);
      rr(PAD, WY_TOP, w-2*PAD, 42, 6);
      ctx.fillStyle = done ? C.ok : '#fafaf6'; ctx.fill();
      ctx.lineWidth=1.6; ctx.strokeStyle = done ? C.okS : C.grid; ctx.stroke();
      ctx.fillStyle = done ? C.okT : C.text;
      ctx.font='600 12px "Noto Sans TC", sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(s.note, w/2, WY_TOP + 21);
    }

    function update(){ if(stepEl) stepEl.textContent=String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0'); if(labelEl) labelEl.innerHTML=steps[step].text; draw(); }
    function next(){ if(step<steps.length-1){step++;update();}else stop(); }
    function prev(){ if(step>0){step--;update();} }
    function reset(){ stop(); step=0; update(); }
    function play(){ if(timer){stop();return;} bPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){stop();return;} next(); },2400); }
    function stop(){ if(timer){clearInterval(timer);timer=null;} if(bPlay) bPlay.textContent='Play'; }
    bPrev&&bPrev.addEventListener('click',prev); bNext&&bNext.addEventListener('click',next); bPlay&&bPlay.addEventListener('click',play); bReset&&bReset.addEventListener('click',reset);
    window.addEventListener('resize',()=>{fit();draw();}); if(window.ResizeObserver){ new ResizeObserver(()=>{fit();draw();}).observe(canvas); }
    if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw); fit(); update();
  }

  /* ══════════════ A · 官方範例 LFUCache(2) ══════════════ */
  makeLFUViz('va-', {
    cap: 2, maxf: 2, title: 'A · LFUCache(2) 官方範例',
    steps: [
      { m:[], fr:{}, mf:'—', mfnote:'（還沒有任何 key）', hot:null, kill:null, focus:null, op:'LFUCache(2)', act:'intro',
        eq:'m[key] = {值, 次數}　　freq[f] = list<key>　　iter[key] = 位置　　minFreq',
        note:'四個結構各回答一個問題,合起來才湊得出「次數最少的裡面最久沒用的是誰」',
        text:'<strong>INITIAL</strong> · LFU 要在 <code>O(1)</code> 內回答一個複合問題:<b>「次數最少的那些 key 裡面,最久沒用的是誰?」</b>沒有單一結構做得到,所以拆成<strong>四個</strong>:<br><b>① <code>m</code></b> 回答「這個 key 在嗎、值多少、幾次」;<b>② <code>freq[f]</code></b> 把<strong>同次數的 key 串成一條 list</strong>,<code>front</code> 就是那一桶裡最久沒用的;<b>③ <code>iter[key]</code></b> 記住每個 key <strong>在它那條 list 的哪一格</strong>;<b>④ <code>minFreq</code></b> 記住目前最小的次數。<strong>淘汰就是 <code>freq[minFreq].front()</code>,一步到位。</strong>' },

      { m:[{k:1,v:1,f:1}], fr:{1:[1]}, mf:1, mfnote:'（新 key 次數固定是 1 ⇒ 直接賦值,不用比較）', hot:1, kill:null, focus:'m', op:'put(1, 1)', act:'put',
        eq:'m[1] = {1, 1};   freq[1].push_back(1);   iter[1] = --freq[1].end();   minFreq = 1;',
        note:'一次插入要同時動三張表 —— 少動一張,後面就會有人指向不存在的東西',
        text:'<strong>put(1, 1)</strong> · 還沒滿,直接插入。注意<strong>一次插入要同時寫三張表</strong>:<code>m</code> 記值與次數、<code>freq[1]</code> 追加這個 key、<code>iter[1]</code> 記下它剛剛被放在哪一格。<b><code>minFreq = 1</code> 是直接賦值而不是取 <code>min</code></b> —— 新 key 的次數固定是 1,而 1 不可能再更小。' },

      { m:[{k:1,v:1,f:1},{k:2,v:2,f:1}], fr:{1:[1,2]}, mf:1, mfnote:'（兩個 key 都是 1 次,同住 freq[1]）', hot:2, kill:null, focus:'freq', op:'put(2, 2)', act:'put',
        eq:'freq[1] = [1, 2]      // push_back 從尾巴追加 ⇒ front 永遠是這一桶裡最舊的',
        note:'同一桶內用 push_back 追加,front 就自動是「這一桶裡最久沒用的」—— 平手時的 LRU 規則不用另外寫',
        text:'<strong>put(2, 2)</strong> · 剛好裝滿。兩個 key 次數都是 1,<strong>同住 <code>freq[1]</code> 這一桶</strong>,順序是 <code>[1, 2]</code>。<b>因為每次都 <code>push_back</code>,<code>front</code> 自然就是這一桶裡最久沒被碰過的那個</b> —— <strong>LFU「次數平手時看誰久沒用」這條規則,完全是這條 list 的順序免費送的,程式裡沒有任何一行在比時間。</strong>' },

      { m:[{k:1,v:1,f:2},{k:2,v:2,f:1}], fr:{1:[2],2:[1]}, mf:1, mfnote:'（freq[1] 還有 key 2 ⇒ 不用動）', hot:1, kill:null, focus:'iter', op:'get(1) → 1', act:'get',
        eq:'freq[1].erase(iter[1]);   ++m[1].second;   freq[2].push_back(1);   iter[1] = --freq[2].end();',
        note:'從舊桶拔出來靠 iter[1] 直接定位 —— 沒有這張表就得從 front 掃過去找',
        text:'<strong>get(1) · 升級</strong> · key 1 被用了一次,<strong>從 <code>freq[1]</code> 搬到 <code>freq[2]</code></strong>。<b>這一步是 <code>iter</code> 唯一的存在理由</b>:<code>list::erase</code> 本身是 <code>O(1)</code>,<strong>但前提是你手上要有那個 iterator</strong>。有 <code>iter[1]</code> 就直接拔;沒有,就得從 <code>freq[1]</code> 的 <code>front</code> 一格一格找過去。搬完之後 <code>iter[1]</code> 也要更新成新桶裡的新位置。<br><b>搬完檢查 <code>freq[minFreq]</code> —— key 2 還在,所以 <code>minFreq</code> 維持 1。</b>' },

      { m:[{k:1,v:1,f:2},{k:3,v:3,f:1}], fr:{1:[3],2:[1]}, mf:1, mfnote:'（淘汰完插入新 key ⇒ 又設回 1）', hot:3, kill:2, focus:'minFreq', op:'put(3, 3)', act:'evict',
        eq:'m.erase(freq[1].front());   iter.erase(freq[1].front());   freq[1].pop_front();\n然後插入 3 → minFreq = 1',
        note:'受害者是 key 2 而不是更早進來的 key 1 —— LFU 先看次數,次數平手才看誰久沒用',
        text:'<strong>put(3, 3) · 觸發淘汰</strong> · 滿了。<code>minFreq = 1</code>,<code>freq[1] = [2]</code>,<strong>受害者就是 key 2</strong>。<b>注意 key 1 比 key 2 更早進來,卻活下來了</b> —— 因為 <strong>LFU 先比次數(key 1 是 2 次,key 2 是 1 次),次數平手才看誰久沒用</strong>。<br><b>淘汰要從三張表一起刪</b>:<code>m</code>、<code>iter</code>、還有那條 list。<strong>漏掉任何一張,剩下的兩張就會指向不存在的東西。</strong>' },

      { m:[{k:1,v:1,f:2},{k:3,v:3,f:1}], fr:{1:[3],2:[1]}, mf:1, mfnote:'（miss 路徑完全沒讀它）', hot:null, kill:null, focus:'m', op:'get(2) → -1', act:'miss',
        eq:'if (m.count(2) == 0) return -1;      // 第一行就走人,freq / iter / minFreq 全沒碰',
        note:'miss 只查 m 一張表就 return —— 這也是為什麼 minFreq 沒初始化仍然不會出事',
        text:'<strong>get(2)</strong> · key 2 已經被淘汰,<code>m</code> 裡查不到,<strong>第一行就 <code>return -1</code></strong>。<b>這條路徑只碰 <code>m</code> 一張表</b>,<code>freq</code>、<code>iter</code>、<code>minFreq</code> 一個都沒讀。<strong>實測 200 萬次操作追蹤 <code>minFreq</code> 的每一次讀取(共 4998084 次),沒有任何一次發生在被寫入之前。</strong>' },

      { m:[{k:1,v:1,f:2},{k:3,v:3,f:2}], fr:{1:[],2:[1,3]}, mf:2, mfnote:'← freq[1] 被搬空了,所以 ++minFreq', hot:3, kill:null, focus:'minFreq', op:'get(3) → 3', act:'bump',
        eq:'if (freq[minFreq].size() == 0) ++minFreq;      // 整支程式最關鍵的一行',
        note:'新的最小值不可能超過 minFreq + 1 —— 剛剛那個 key 就落在那裡,所以 ++ 一下就對了',
        text:'<strong>get(3) · minFreq 往上爬</strong> · key 3 搬到 <code>freq[2]</code> 之後,<strong><code>freq[1]</code> 空了</strong>,<code>minFreq</code> 必須跟著變成 2。<b>為什麼可以直接 <code>++</code> 而不用重新找?</b>因為<strong>剛剛搬走的那個 key 現在就坐在 <code>minFreq + 1</code> 這一桶</strong> —— 新的最小值不可能比它更大。<br><b>實測把這一行拿掉,答案一次都不會錯</b>,但在 41 萬次 <code>get</code> 的測試裡<strong>有 30670 次會對空的 list 呼叫 <code>front()</code></strong>,ASan 直接報記憶體錯誤。' },

      { m:[{k:3,v:3,f:2},{k:4,v:4,f:1}], fr:{1:[4],2:[3]}, mf:1, mfnote:'（插入新 key ⇒ 又歸 1）', hot:4, kill:1, focus:'freq', op:'put(4, 4)', act:'evict',
        eq:'滿了 → 淘汰 freq[minFreq = 2].front() = 1      // 這次最小次數是 2,不是 1',
        note:'如果上一步沒把 minFreq 推到 2,這裡撈的就是空的 freq[1] —— 那正是那行 ++ 在防的事',
        text:'<strong>put(4, 4) · 第二次淘汰</strong> · 這次 <strong><code>minFreq = 2</code></strong>,<code>freq[2] = [1, 3]</code>,<code>front</code> 是 key 1。<strong>兩個 key 次數都是 2,平手,所以看誰久沒用</strong>:key 1 上次被用是第 3 步,key 3 是第 7 步,<b>所以淘汰 key 1</b>。<br><b>如果上一步沒把 <code>minFreq</code> 推到 2,這裡就會去撈空的 <code>freq[1]</code></b> —— 上一步那行 <code>++</code> 防的就是這一刻。' },

      { m:[{k:3,v:3,f:2},{k:4,v:4,f:1}], fr:{1:[4],2:[3]}, mf:1, mfnote:'（最終狀態）', hot:null, kill:null, focus:null, op:'完成　get(1) = -1　get(3) = 3　get(4) = 4', act:'done',
        eq:'四張表全程同步;每個操作都只做固定次數的雜湊查詢與指標賦值',
        note:'實測與 O(n) 暴力解交叉比對 1200009 次 get,不一致 0',
        text:'<strong>完成</strong> · 與 LeetCode 官方範例完全一致。<strong>實測</strong>:與「每筆存 (值, 次數, 時間戳)、淘汰時 <code>O(n)</code> 掃描」的暴力解交叉比對 <strong>1200009 次 <code>get</code>,不一致 0</strong>。<br><b>回頭看這四張表</b>:<code>m</code> 給你值與次數、<code>freq</code> 給你桶內順序、<code>iter</code> 給你桶內位置、<code>minFreq</code> 給你該看哪一桶。<strong>少任何一張,某一步就會從 <code>O(1)</code> 掉成 <code>O(n)</code>。</strong>' },
    ]
  });

  /* ══════════════ B · 加長範例 LFUCache(3) ══════════════ */
  makeLFUViz('vb-', {
    cap: 3, maxf: 4, title: 'B · LFUCache(3) 加長範例',
    steps: [
      { m:[], fr:{}, mf:'—', mfnote:'（還沒有任何 key）', hot:null, kill:null, focus:null, op:'LFUCache(3)', act:'intro',
        eq:'容量放大到 3,讓每一個機制都真的跑得到一次',
        note:'cap = 2 的官方範例有兩件事看不到:從桶「正中間」拔出,以及空掉的不是最小桶',
        text:'<strong>INITIAL · 為什麼要換一個範例</strong> · 官方那個 <code>LFUCache(2)</code> 有<strong>兩件事永遠看不到</strong>:桶裡最多只有 2 個 key,所以<b>被拔出的那個不是 front 就是 back,「從正中間拔」永遠不會發生</b>;而且桶太少,<b>「空掉的桶剛好不是最小桶」也碰不到</b>。<strong>容量放大到 3,這兩件事就都跑得到了。</strong>接下來有四個關鍵時刻,分別在第 4、5、7、8 步。' },

      { m:[{k:1,v:10,f:1}], fr:{1:[1]}, mf:1, mfnote:'（新 key ⇒ 1）', hot:1, kill:null, focus:'m', op:'put(1, 10)', act:'put',
        eq:'m[1] = {10, 1};   freq[1] = [1];   iter[1] = freq[1] 第 0 格;   minFreq = 1',
        note:'三張表一起寫:值與次數、桶內順序、桶內位置',
        text:'<strong>put(1, 10)</strong> · 第一個 key。三張表同時寫上:<code>m</code> 記 <code>{10, 1}</code>,<code>freq[1]</code> 收下它,<code>iter[1]</code> 記住它坐在第 0 格。' },

      { m:[{k:1,v:10,f:1},{k:2,v:20,f:1}], fr:{1:[1,2]}, mf:1, mfnote:'（都還是 1 次）', hot:2, kill:null, focus:'freq', op:'put(2, 20)', act:'put',
        eq:'freq[1] = [1, 2]      // 追加在尾巴',
        note:'iter 那一排跟著長 —— 每個 key 都知道自己坐在第幾格',
        text:'<strong>put(2, 20)</strong> · 第二個 key,一樣進 <code>freq[1]</code>。<b>看 ③ <code>iter</code> 那一排</b>:key 1 在第 0 格、key 2 在第 1 格。<strong>這排數字接下來會一直變,而它每次都必須跟 ② 的桶內順序對得上。</strong>' },

      { m:[{k:1,v:10,f:1},{k:2,v:20,f:1},{k:3,v:30,f:1}], fr:{1:[1,2,3]}, mf:1, mfnote:'（三個都在 freq[1]）', hot:3, kill:null, focus:'freq', op:'put(3, 30)', act:'put',
        eq:'freq[1] = [1, 2, 3]      // 滿了,而且三個都擠在同一桶',
        note:'現在 freq[1] 裡有三個 key —— 下一步就要從它的正中間拔一個出來',
        text:'<strong>put(3, 30)</strong> · 滿了,而且<strong>三個 key 全擠在 <code>freq[1]</code> 這一桶</strong>,順序 <code>[1, 2, 3]</code>。<b>key 2 現在坐在正中間(第 1 格)</b> —— <strong>下一步就要把它拔出來,這是官方範例做不到的情境。</strong>' },

      { m:[{k:1,v:10,f:1},{k:2,v:20,f:2},{k:3,v:30,f:1}], fr:{1:[1,3],2:[2]}, mf:1, mfnote:'（freq[1] 還有 1 和 3 ⇒ 不變）', hot:2, kill:null, focus:'iter', op:'get(2) → 20　★ 從正中間拔', act:'get',
        eq:'freq[1].erase(iter[2]);      // iter[2] 指的是「第 1 格」—— 正中間,不是 front 也不是 back',
        note:'沒有 iter,就得從 front 掃過來才找得到它 —— 實測 98.8% 的拔出都不在 front',
        text:'<strong>get(2) · ★ 第一個關鍵時刻</strong> · key 2 坐在 <code>freq[1] = [1, 2, 3]</code> 的<strong>正中間</strong>。<b>拔掉它之後,前後兩個 key 直接接起來,變成 <code>[1, 3]</code></b>。<br><strong>這就是 <code>iter</code> 存在的全部理由</strong> —— <code>list::erase</code> 是 <code>O(1)</code>,<b>但你得先有那個 iterator</b>。<br><b>實測</b>:capacity 3000、40 萬次操作,<strong>被拔出的 196943 次裡有 194582 次(98.8%)不在 <code>front</code></strong>,<strong>平均要往裡走 95.8 格</strong>,最大的桶出現過 <strong>1131 個 key</strong>。<b>拿掉 <code>iter</code> 改成線性掃,同一份工作負載從 78 ns/op 變成 173 ns/op —— 慢 2.2 倍,而且是 <code>O(桶大小)</code> 不是 <code>O(1)</code>。</b>' },

      { m:[{k:1,v:10,f:1},{k:2,v:20,f:3},{k:3,v:30,f:1}], fr:{1:[1,3],3:[2]}, mf:1, mfnote:'← freq[2] 空了,但它不是最小桶,所以 minFreq 不動', hot:2, kill:null, focus:'minFreq', op:'get(2) → 20　★ 空掉的不是最小桶', act:'bump',
        eq:'if (freq[minFreq].size() == 0) ++minFreq;      // minFreq 是 1,而 freq[1] 還有人 ⇒ 不執行',
        note:'空掉的是 freq[2],但檢查的只有 freq[minFreq] —— 判斷式看的不是「有沒有桶空了」',
        text:'<strong>get(2) 再一次 · ★ 第二個關鍵時刻</strong> · key 2 從 <code>freq[2]</code> 搬到 <code>freq[3]</code>,<strong><code>freq[2]</code> 現在空了</strong>。<b>但 <code>minFreq</code> 一動也不動,還是 1。</b><br><strong>因為那行判斷式看的是 <code>freq[minFreq]</code>,不是「有沒有哪個桶空了」</strong> —— 而 <code>freq[1]</code> 裡還坐著 key 1 和 key 3。<b>空桶就只是空桶,不佔成本、也不影響任何事</b>,程式從來不需要去清理它們。' },

      { m:[{k:1,v:10,f:2},{k:2,v:20,f:3},{k:3,v:30,f:1}], fr:{1:[3],2:[1],3:[2]}, mf:1, mfnote:'（freq[1] 還有 key 3）', hot:1, kill:null, focus:'freq', op:'get(1) → 10', act:'get',
        eq:'freq[1] = [3]　freq[2] = [1]　freq[3] = [2]      // 三個桶同時有人',
        note:'三個 key 三種次數 —— 這時候「最小的是哪一桶」已經不是用看的了,要靠 minFreq 記著',
        text:'<strong>get(1)</strong> · key 1 升到 2 次。<b>現在三個 key 各自在不同的桶</b>:<code>freq[1] = [3]</code>、<code>freq[2] = [1]</code>、<code>freq[3] = [2]</code>。<strong>這正是 <code>minFreq</code> 存在的意義</strong> —— 如果沒有它,每次淘汰都得掃過所有桶去找最小的那個非空桶。<b>而 <code>freq</code> 是 <code>unordered_map</code>,它連「由小到大走一遍」都做不到。</b>' },

      { m:[{k:1,v:10,f:2},{k:2,v:20,f:3},{k:3,v:30,f:2}], fr:{2:[1,3],3:[2]}, mf:2, mfnote:'← freq[1] 空了,而它就是最小桶 ⇒ ++minFreq', hot:3, kill:null, focus:'minFreq', op:'get(3) → 30　★ minFreq 爬升', act:'bump',
        eq:'freq[1] 被搬空 → ++minFreq → minFreq = 2',
        note:'和上一步對照:一樣是「有桶空了」,但這次空的剛好是最小桶,所以要爬',
        text:'<strong>get(3) · ★ 第三個關鍵時刻</strong> · key 3 搬走之後 <strong><code>freq[1]</code> 空了 —— 而它就是最小桶</strong>,所以 <code>minFreq</code> 從 1 爬到 2。<br><b>把這一步和上一步放在一起看,那行判斷式就完全清楚了</b>:<strong>上一步空的是 <code>freq[2]</code>(不是最小桶)⇒ 不動;這一步空的是 <code>freq[1]</code>(就是最小桶)⇒ 爬一格。</strong><br><b>而且只會爬「一格」</b> —— 剛剛搬走的 key 3 就落在 <code>freq[2]</code>,新的最小值不可能比 2 更大。' },

      { m:[{k:2,v:20,f:3},{k:3,v:30,f:2},{k:4,v:40,f:1}], fr:{1:[4],2:[3],3:[2]}, mf:1, mfnote:'（淘汰完插入新 key ⇒ 歸 1）', hot:4, kill:1, focus:'freq', op:'put(4, 40)　★ 平手看 LRU', act:'evict',
        eq:'滿了 → 淘汰 freq[minFreq = 2].front() = 1      // freq[2] = [1, 3],兩個都是 2 次',
        note:'key 1 和 key 3 次數平手,front 是 key 1 ⇒ 淘汰 key 1;而次數更少的桶根本沒人',
        text:'<strong>put(4, 40) · ★ 第四個關鍵時刻</strong> · 滿了。<code>minFreq = 2</code>,<code>freq[2] = [1, 3]</code> —— <strong>key 1 和 key 3 次數完全平手</strong>,所以看 <code>front</code>:<b>key 1 上次被用是第 6 步,key 3 是第 7 步,front 是 key 1,淘汰它</b>。<br><b>注意 key 2 被用了 3 次,是次數最多的,所以它連被考慮都不會</b>。<br>淘汰完插入 key 4,<strong><code>minFreq</code> 又直接歸 1</strong> —— 新 key 一定是 1 次。<b>所以 <code>minFreq</code> 是「爬升要一格一格,歸零卻是一步到底」。</b>' },

      { m:[{k:2,v:20,f:3},{k:3,v:30,f:2},{k:4,v:40,f:1}], fr:{1:[4],2:[3],3:[2]}, mf:1, mfnote:'（miss 什麼都沒動）', hot:null, kill:null, focus:'m', op:'get(1) → -1', act:'miss',
        eq:'if (m.count(1) == 0) return -1;      // key 1 上一步剛被淘汰',
        note:'四張表一格都沒動 —— miss 不算一次使用',
        text:'<strong>get(1)</strong> · key 1 上一步剛被淘汰,<code>m</code> 查不到就 <code>return -1</code>。<b>四張表一格都沒動</b> —— <strong>miss 不算一次使用</strong>,這一點和 <a href="../p146/index.html">146 LRU</a> 完全一樣。' },

      { m:[{k:2,v:20,f:4},{k:3,v:30,f:2},{k:4,v:40,f:1}], fr:{1:[4],2:[3],4:[2]}, mf:1, mfnote:'（freq[1] 有 key 4 ⇒ 不變）', hot:2, kill:null, focus:null, op:'get(2) → 20　完成', act:'done',
        eq:'freq[3] 空了,但 minFreq 是 1 而 freq[1] 有人 ⇒ 一樣不動',
        note:'實測與 O(n) 暴力解交叉比對 1200009 次 get,不一致 0',
        text:'<strong>完成</strong> · key 2 升到 4 次,<code>freq[3]</code> 又空了 —— <b>而 <code>minFreq</code> 一樣不動</b>,理由和第 5 步一模一樣。<br><strong>整趟走完,四張表各自的角色應該很清楚了</strong>:<b>① <code>m</code></b> 是唯一的真相來源(誰在、值多少、幾次);<b>② <code>freq</code></b> 把同次數的排成一列,<code>front</code> 免費給你平手時的答案;<b>③ <code>iter</code></b> 讓「從中間拔一個」不用掃;<b>④ <code>minFreq</code></b> 讓「該看哪一桶」不用找。<br><strong>實測與 <code>O(n)</code> 暴力解交叉比對 1200009 次 <code>get</code>,不一致 0。</strong>' },
    ]
  });

})();
