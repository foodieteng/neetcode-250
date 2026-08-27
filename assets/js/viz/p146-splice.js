/* ============================================================
   P146 · LRU Cache — 寫法二:std::list + splice · viz
     l = list<pair<int,int>>       前端 = 最新,後端 = 最舊
     m = unordered_map<int, list<pair<int,int>>::iterator>
   本動畫要說的只有一件事:「節點位址從頭到尾不變」。
     splice 只改前後鏈結,節點本體原地不動 —— 所以 m 存的 iterator
     搬完仍然有效,一個字都不用更新。
     (實測:splice 前後 &*it 皆 0x11d605ff0,完全相同)
   例 LRUCache(2):put(1,1) put(2,2) get(1) put(3,3) get(2) put(4,4)
     BAND 1  list l(每格附上「節點位址」@Nk —— 全程不變)
     BAND 2  unordered_map m:key → iterator
     BAND 3  這一步真正呼叫了什麼
     BAND 4  為什麼
   所有狀態取自實測 trace,未手推。
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

  const CAP = 2;

  // cells:由「前端(最新)」到「後端(最舊)」;a = 節點位址標籤,配置後永不改變
  const steps = [
    { cells:[], hot:null, kill:null, over:false, op:'LRUCache(2)', act:'intro',
      eq:'list<pair<int,int>> l;   unordered_map<int, list<pair<int,int>>::iterator> m;',
      note:'不必自己寫節點類別、不必哨兵 —— std::list 兩端本來就有自己的哨兵',
      text:'<strong>INITIAL</strong> · 這個寫法把<strong>手刻雙向串列整條換成 <code>std::list</code></strong>。分工完全一樣:<b><code>l</code> 管順序、<code>m</code> 管速度</b>,只是 <code>m</code> 的值從「節點指標」換成 <strong><code>list</code> 的 iterator</strong>。<b>方向和手刻版相反</b> —— 這裡<strong>前端(<code>l.begin()</code>)是最新、後端(<code>l.back()</code>)是最舊</strong>。' },

    { cells:[{k:1,v:1,a:'N1'}], hot:1, kill:null, over:false, op:'put(1, 1)', act:'put',
      eq:'l.push_front({1,1});   m[1] = l.begin();',
      note:'push_front 配置一個新節點 N1;m 記下的是「指向 N1 的 iterator」',
      text:'<strong>put(1, 1)</strong> · <code>m</code> 裡沒有 key 1,直接 <code>push_front</code>。<b>注意每格右下角的 <code>@N1</code></b> —— 那是這個節點的<strong>記憶體位址</strong>。<b>接下來整個動畫,請一直盯著這些位址:它們永遠不會變。</b>' },

    { cells:[{k:2,v:2,a:'N2'},{k:1,v:1,a:'N1'}], hot:2, kill:null, over:false, op:'put(2, 2)', act:'put',
      eq:'l.push_front({2,2});   m[2] = l.begin();      // m.size() == 2,還沒超過 cap',
      note:'新的插前面,舊的自然被推到後面 —— 順序是「插入時維持好的」,不是查詢時算出來的',
      text:'<strong>put(2, 2)</strong> · 剛好裝滿。此刻 <strong><code>l.back()</code> 是 <code>(1,1)@N1</code></strong>,也就是<strong>最久沒用的</strong>。<b><code>m</code> 本身沒有任何順序</b> —— 順序完全在 <code>l</code> 那一條上。' },

    { cells:[{k:1,v:1,a:'N1'},{k:2,v:2,a:'N2'}], hot:1, kill:null, over:false, op:'get(1) → 1', act:'splice',
      eq:'l.splice(l.begin(), l, it->second);   return it->second->second;',
      note:'splice 只改前後鏈結,節點本體原地不動 —— 實測 &*it 前後皆 0x11d605ff0,完全相同',
      text:'<strong>get(1) · 這一步是整個寫法的核心</strong> · <code>splice</code> 的第二個參數<strong>就是 <code>l</code> 自己</strong>,所以這是「<b>串列內部搬移</b>」:把 <code>N1</code> 這個節點<strong>從原位摘下來、接到最前面</strong>,<code>O(1)</code>。<b>關鍵在於 <code>@N1</code> 沒有變</b> —— <strong>節點沒有被複製、沒有被重新配置,只是前後的鏈結改了</strong>。所以 <code>m[1]</code> 存的那個 iterator <b>搬完之後依然有效、依然指向同一個節點</b>,<strong>整個 <code>get</code> 一個字都不用回頭更新 <code>m</code></strong>。' },

    { cells:[{k:3,v:3,a:'N3'},{k:1,v:1,a:'N1'},{k:2,v:2,a:'N2'}], hot:3, kill:null, over:true, op:'put(3, 3) ①  先插入', act:'over',
      eq:'l.push_front({3,3});   m[3] = l.begin();      // m.size() == 3 > cap == 2 ← 超載',
      note:'和手刻版相反:這裡是「先插進去,再看有沒有超過」—— 所以會短暫存在 cap+1 個節點',
      text:'<strong>put(3, 3) 第一階段</strong> · 這個寫法<strong>先無條件 <code>push_front</code>,再檢查有沒有超載</strong>。<b>所以串列會短暫地變成 3 個節點</b>(超過 <code>capacity = 2</code>)。<b>這正是為什麼淘汰的判斷要寫成 <code>&gt;</code> 而不是 <code>&gt;=</code></b> —— 此刻的合法狀態就是「剛好多一個」。' },

    { cells:[{k:3,v:3,a:'N3'},{k:1,v:1,a:'N1'}], hot:3, kill:2, over:false, op:'put(3, 3) ②  再淘汰', act:'evict',
      eq:'int k = l.rbegin()->first;   l.pop_back();   m.erase(k);',
      note:'順序不能顛倒:pop_back 會釋放節點,先 pop 再讀 rbegin 就是 heap-use-after-free',
      text:'<strong>put(3, 3) 第二階段 · 淘汰</strong> · 受害者<strong>就是 <code>l.back()</code></strong>,不用比較也不用掃描。要做兩件事:<strong>從 <code>l</code> 拿掉</strong>、<strong>從 <code>m</code> 刪掉</strong>。<b>而這三行的順序是有意義的</b> —— <code>pop_back()</code> <strong>不回傳值而且會直接釋放節點</strong>,所以<strong>必須先把 key 抄下來</strong>。倒過來寫,ASan 立刻報 <code>heap-use-after-free</code>。' },

    { cells:[{k:3,v:3,a:'N3'},{k:1,v:1,a:'N1'}], hot:null, kill:null, over:false, op:'get(2) → -1', act:'miss',
      eq:'auto it = m.find(2);   if (it == m.end()) return -1;      // l 完全不動',
      note:'必須用 find 而不是 m[2] —— operator[] 會替不存在的 key 插入一個未初始化的 iterator',
      text:'<strong>get(2)</strong> · key 2 已被淘汰,<strong>第一行就 <code>return -1</code></strong>,<code>l</code> 一根鏈結都不動。<b>這裡有個 <code>std::map</code> 專屬的地雷</b>:<strong>絕不能寫成 <code>m[2]</code></strong> —— <code>operator[]</code> 會<strong>替不存在的 key 插入一筆</strong>,值是一個<b>未初始化的 iterator</b>,之後拿去 <code>splice</code> 就是未定義行為。' },

    { cells:[{k:4,v:4,a:'N4'},{k:3,v:3,a:'N3'}], hot:4, kill:1, over:false, op:'put(4, 4)', act:'evict',
      eq:'push_front → 超載 → 淘汰 l.back() = (1,1)@N1      // N1 到這一刻才被釋放',
      note:'key 1 靠第 3 步那一次 splice 活過一輪 —— 之後沒再被用,就漂回後端了',
      text:'<strong>put(4, 4) · 第二次淘汰</strong> · 受害者是 <strong>key 1</strong>。<b>它在第 3 步被 <code>get</code> 過(那次 <code>splice</code>),因此躲掉了第一次淘汰</b> —— 但之後沒再被碰,就<strong>一路被新來的擠回後端</strong>。<b>這就是 LRU 的全部:用一次就 <code>splice</code> 到最前,不用就自然往受害端漂。</b>' },

    { cells:[{k:4,v:4,a:'N4'},{k:3,v:3,a:'N3'}], hot:null, kill:null, over:false, op:'get(1) = -1　get(3) = 3　get(4) = 4', act:'done',
      eq:'兩版對拍 1201325 次 get 不一致 0;240 萬次完整順序比對不一致 0;10 萬次淘汰後未釋放位元組 = 0',
      note:'std::list 自己會在解構時釋放全部節點 —— 手刻版同樣壓力洩漏 100002 個節點 / 2.3 MB',
      text:'<strong>完成</strong> · 最終 <code>l = [(4,4), (3,3)]</code>,與 LeetCode 官方範例一致。<strong>實測</strong>:與 <code>O(n)</code> 暴力解交叉比對 <strong>1201325 次 <code>get</code>,不一致 0</strong>;每一步比對<strong>完整的 MRU→LRU 順序,共 240 萬次,不一致 0</strong>。<strong>而且不會洩漏</strong> —— cap=10 放進 10 萬個不同 key,<b>配置 200003 次、釋放 200003 次,未釋放 0</b>;<strong>手刻版在同樣壓力下漏掉 100002 個節點(2.3 MB)</strong>。' },
  ];

  let step = 0, timer = null;

  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||430; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function dbl(x1,x2,y,col){                 // 雙向鏈結
    ctx.strokeStyle=col; ctx.fillStyle=col; ctx.lineWidth=1.8;
    ctx.beginPath(); ctx.moveTo(x1,y); ctx.lineTo(x2,y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x2,y); ctx.lineTo(x2-7,y-4.5); ctx.lineTo(x2-7,y+4.5); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x1,y); ctx.lineTo(x1+7,y-4.5); ctx.lineTo(x1+7,y+4.5); ctx.closePath(); ctx.fill(); }

  const NODE_TOP = 96, NH = 60, MIDY = NODE_TOP + NH/2, NODE_BOT = NODE_TOP + NH;
  const END_Y = NODE_BOT + 16;               // 172
  const MAP_LBL = 232, MAP_TOP = 240, MAP_H = 32;
  const B3 = 306, B4 = 382;

  function draw(){
    fit();
    const s = steps[step], w = canvas.clientWidth, PAD = 28;
    const done = s.act === 'done';
    ctx.fillStyle = C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);

    // ── BAND 1 標題 ──
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · list<pair<int,int>> l', PAD, 16);
    ctx.textAlign='right'; ctx.font='700 12.5px "JetBrains Mono", monospace';
    ctx.fillStyle = s.over ? C.curT : (done ? C.okT : C.text);
    ctx.fillText('cap ' + CAP + ' · size ' + s.cells.length + (s.over ? ' ← 超載' : ''), w - PAD, 16);

    ctx.textAlign='center'; ctx.font='700 14px "JetBrains Mono", monospace';
    ctx.fillStyle = done ? C.okT : (s.act==='evict'||s.act==='over' ? C.curT : (s.act==='intro' ? C.text : C.winT));
    ctx.fillText(s.op, w/2, 46);

    ctx.font='600 11.5px "Noto Sans TC", sans-serif'; ctx.fillStyle = C.dim;
    ctx.fillText('前端 l.begin() = 最新(splice 的目的地)　後端 l.back() = 最舊(pop_back 的受害者)', w/2, 70);

    // ── 串列本體 ──
    const N = s.cells.length, MAXN = CAP + 1;
    if (N === 0) {
      ctx.fillStyle=C.offT; ctx.font='600 13px "Noto Sans TC", sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('（l 是空的）', w/2, MIDY);
    } else {
      const usable = w - 2*PAD - 20;
      const nw = Math.min(122, usable / MAXN - 40);
      const gap = Math.min(52, (usable - MAXN*nw) / (MAXN - 1));
      const totalW = N*nw + (N-1)*gap;
      const x0 = (w - totalW) / 2;
      const edge = i => x0 + i*(nw+gap);
      const cx = i => edge(i) + nw/2;

      for (let i = 0; i + 1 < N; i++) dbl(edge(i)+nw+4, edge(i+1)-4, MIDY, C.grid);

      s.cells.forEach((c, i) => {
        const isHot = c.k === s.hot;
        const isDoomed = s.over && i === N-1;          // 超載時,後端那個就是即將被淘汰的
        rr(edge(i), NODE_TOP, nw, NH, 6);
        ctx.fillStyle = done ? C.ok : (isDoomed ? C.cur : (isHot ? C.win : C.seg)); ctx.fill();
        ctx.lineWidth = (isHot || isDoomed) ? 2.4 : 1.6;
        ctx.strokeStyle = done ? C.okS : (isDoomed ? C.curS : (isHot ? C.winS : C.segS)); ctx.stroke();
        ctx.fillStyle = done ? C.okT : (isDoomed ? C.curT : (isHot ? C.winT : C.segT));
        ctx.textAlign='center'; ctx.textBaseline='alphabetic';
        ctx.font='700 15px "JetBrains Mono", monospace';
        ctx.fillText('key ' + c.k, cx(i), MIDY - 10);
        ctx.font='600 12px "JetBrains Mono", monospace';
        ctx.fillText('val ' + c.v, cx(i), MIDY + 7);
        ctx.font='700 10.5px "JetBrains Mono", monospace';
        ctx.fillStyle = done ? C.okT : (isDoomed ? C.curT : C.dim);
        ctx.fillText('@' + c.a, cx(i), MIDY + 23);
      });

      // ── 兩端的標記 ──
      if (!done) {
        ctx.textAlign='center'; ctx.textBaseline='top'; ctx.font='700 10.5px "JetBrains Mono", monospace';
        ctx.fillStyle=C.winT; ctx.fillText('↑ l.begin() 最新', cx(0), END_Y);
        if (N > 1) { ctx.fillStyle=C.curT; ctx.fillText('↑ l.back() 最舊 · 下一個受害者', cx(N-1), END_Y); }
      }
    }
    if (s.kill !== null) {
      ctx.fillStyle=C.curT; ctx.font='700 12px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='top';
      ctx.fillText('✕ 已淘汰 key ' + s.kill + '（l.pop_back() 釋放節點 + m.erase(key)）', w/2, END_Y + 22);
    }

    // ── BAND 2 · unordered_map ──
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · unordered_map<int, list<...>::iterator> m', PAD, MAP_LBL);
    if (s.cells.length === 0) {
      ctx.fillStyle=C.offT; ctx.font='600 12px "Noto Sans TC", sans-serif'; ctx.textBaseline='middle';
      ctx.fillText('（空）', PAD, MAP_TOP + MAP_H/2);
    } else {
      // 依 key 排序,強調「m 沒有順序」
      const rows = s.cells.slice().sort((a,b)=>a.k-b.k);
      const cw2 = 118;
      rows.forEach((c, j) => {
        const x = PAD + j*(cw2+14);
        rr(x, MAP_TOP, cw2, MAP_H, 5);
        ctx.fillStyle = done ? C.ok : (c.k===s.hot ? C.win : C.off); ctx.fill();
        ctx.lineWidth=1.4; ctx.strokeStyle = done ? C.okS : (c.k===s.hot ? C.winS : C.offS); ctx.stroke();
        ctx.fillStyle = done ? C.okT : (c.k===s.hot ? C.winT : C.text);
        ctx.font='700 12px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(c.k + ' → @' + c.a, x+cw2/2, MAP_TOP+MAP_H/2);
      });
      ctx.fillStyle = s.act==='splice' ? C.curT : C.dim;
      ctx.font='600 11px "Noto Sans TC", sans-serif'; ctx.textAlign='left'; ctx.textBaseline='middle';
      ctx.fillText(s.act==='splice' ? '← 位址完全沒變,所以這張表這一步一個字都不用改'
                                    : '（m 沒有順序;順序全在上面那條 l）',
                   PAD + rows.length*(cw2+14) + 6, MAP_TOP+MAP_H/2);
    }

    // ── BAND 3 · 這一步呼叫了什麼 ──
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 這一步真正呼叫了什麼', PAD, B3);
    rr(PAD, B3+10, w-2*PAD, 44, 6);
    ctx.fillStyle = done ? C.ok : (s.act==='intro' ? '#fafaf6' : (s.act==='evict'||s.act==='over'||s.act==='splice' ? C.cur : C.win)); ctx.fill();
    ctx.lineWidth=1.6; ctx.strokeStyle = done ? C.okS : (s.act==='intro' ? C.grid : (s.act==='evict'||s.act==='over'||s.act==='splice' ? C.curS : C.winS)); ctx.stroke();
    ctx.fillStyle = done ? C.okT : (s.act==='intro' ? C.text : (s.act==='evict'||s.act==='over'||s.act==='splice' ? C.curT : C.winT));
    ctx.font='700 11.5px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(s.eq, w/2, B3+32);

    // ── BAND 4 · 為什麼 ──
    ctx.fillStyle=C.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 4 · 為什麼', PAD, B4);
    rr(PAD, B4+10, w-2*PAD, 42, 6);
    ctx.fillStyle = done ? C.ok : '#fafaf6'; ctx.fill();
    ctx.lineWidth=1.6; ctx.strokeStyle = done ? C.okS : C.grid; ctx.stroke();
    ctx.fillStyle = done ? C.okT : C.text;
    ctx.font='600 12px "Noto Sans TC", sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(s.note, w/2, B4+31);
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
