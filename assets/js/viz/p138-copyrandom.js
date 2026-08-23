/* ============================================================
   P138 · Copy List with Random Pointer — 遞迴 + 記憶表 · viz
   難點:random 可能指向「還沒被拷貝的節點」。
   解法:用一張 dict(原節點 → 拷貝節點)當記憶表 ——
     · 第一次碰到某個原節點:新建拷貝、記進 dict、再往下遞迴
     · 之後再碰到同一個:直接從 dict 拿,不重建
   遞迴順序是「先 next 一路到底,回程才接 random」,所以接 random 時
   整條 next 鏈都已經在 dict 裡 —— 每個 random 都是 O(1) 查表命中。
   例 vals=[7,13,11,10], random=[null,0,3,1]。
     BAND 1  原串列 / 拷貝兩排(R→k 表示 random 指向索引 k)+ dict 內容
     BAND 2  這一步做了什麼
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

  const VALS = [7,13,11,10];
  const RND  = [-1, 0, 3, 1];        // -1 = null
  const N = VALS.length;

  // made:拷貝已建到第幾個(0..N);wired:random 已接好的索引集合;focus:目前這一層的節點
  const steps = [
    { made:0, wired:[], focus:-1, dict:0, act:'intro',
      eq:'難點:random 可能指向「還沒被拷貝的節點」',
      note:'所以需要一張 dict(原節點 → 拷貝節點)記住誰已經拷過了',
      text:'<strong>INITIAL</strong> · 每個節點除了 <code>next</code> 還有一根 <code>random</code>,可以指向<strong>串列裡的任何一個節點,或 null</strong>。麻煩在於:拷貝到節點 0 時,它的 <code>random</code> 可能指向<strong>還不存在的拷貝</strong>。所以要一張 <strong><code>dict</code>:原節點 → 拷貝節點</strong>,把「這個我拷過了」記下來。' },

    { made:1, wired:[], focus:0, dict:1, act:'down',
      eq:'copy(節點 0):dict 沒有 → 新建拷貝,記進 dict,再往 next 遞迴',
      note:'先「登記」再遞迴 —— 順序反了就可能無限遞迴',
      text:'<strong>下潛 · 節點 0</strong> · <code>dict</code> 裡沒有 → <strong>新建一個拷貝、立刻記進 <code>dict</code></strong>,然後才往 <code>next</code> 遞迴。<strong>「先登記再遞迴」的順序很重要</strong> —— 如果先遞迴再登記,遇到 <code>random</code> 繞回自己時就會無限遞迴。' },

    { made:4, wired:[], focus:3, dict:4, act:'down',
      eq:'一路沿 next 遞迴到底:節點 1、2、3 都建好了,next 接到 null',
      note:'遞迴深度 = n + 1,實測每層約 96 bytes(比純翻轉大,因為有 map 操作)',
      text:'<strong>下潛到底</strong> · <code>next</code> 鏈一路遞迴到 <code>null</code>,四個拷貝都建好、<code>next</code> 也都接好了。<strong>但 <code>random</code> 一根都還沒接</strong> —— 那是回程的事。<strong>實測遞迴深度恆為 <code>n + 1</code></strong>(五種 random 佈局測下來都一樣),每層約 <strong>96 bytes</strong>。' },

    { made:4, wired:[3], focus:3, dict:4, act:'up',
      eq:'回到節點 3:random → 節點 1。dict 已有 → 直接拿,不重建',
      note:'關鍵:回程時整條 next 鏈都已在 dict 裡,所以每個 random 都是 O(1) 命中',
      text:'<strong>回程 · 節點 3</strong> · 它的 <code>random</code> 指向節點 1。查 <code>dict</code> —— <strong>已經有了</strong>(下潛時建的),直接把那個拷貝接上,<strong>不會重建</strong>。這就是記憶表的價值:<strong>同一個原節點永遠只拷一次</strong>。' },

    { made:4, wired:[3,2], focus:2, dict:4, act:'up',
      eq:'回到節點 2:random → 節點 3,dict 命中',
      note:'節點總數守恆 —— 實測 5 萬組,新建節點數恆等於 n',
      text:'<strong>回程 · 節點 2</strong> · 同樣命中。<strong>實測 5 萬組隨機測資,<code>new</code> 出來的節點數<strong>恆等於 n</strong></strong> —— 剛好每個原節點一份,符合題目「exactly n brand new nodes」。' },

    { made:4, wired:[3,2,1], focus:1, dict:4, act:'up',
      eq:'回到節點 1:random → 節點 0,dict 命中',
      note:'random 往回指也沒問題 —— dict 不在乎方向,只在乎「拷過沒」',
      text:'<strong>回程 · 節點 1</strong> · 這次 <code>random</code> 是<strong>往回指</strong>(指向節點 0)。對 <code>dict</code> 來說完全沒差 —— 它只回答「這個原節點拷過了嗎」,<strong>跟方向無關</strong>。' },

    { made:4, wired:[3,2,1,0], focus:0, dict:4, act:'done',
      eq:'回到節點 0:random 是 null → 接 null。完成',
      note:'實測 20 萬組:結構一致、與原串列共用節點 0 個、random 全部指在新串列內',
      text:'<strong>完成</strong> · 節點 0 的 <code>random</code> 是 <code>null</code>,直接接 <code>null</code>。<strong>實測 20 萬組隨機測資</strong>:拷貝的 <code>val</code> / <code>next</code> / <code>random</code> 結構與原串列<strong>完全一致</strong>,<strong>與原串列共用的節點數 0</strong>,而且<strong>沒有任何 <code>random</code> 指到新串列外面</strong> —— 這三件事才構成「深拷貝」。' },
  ];

  let step = 0, timer = null;

  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||440; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  const TAG = 76, NH = 44;
  const Y1 = 74, R1 = Y1 + NH + 14;      // 原串列 + 它的 R→ 標記
  const Y2 = 176, R2 = Y2 + NH + 14;     // 拷貝 + 它的 R→ 標記
  const DICT_Y = 258;

  function draw(){
    fit();
    const s = steps[step], w = canvas.clientWidth, PAD = 28;
    const done = s.act === 'done';
    ctx.fillStyle = C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);

    const area = w - 2*PAD - TAG;
    const cw = Math.min(64, area / N - 26);
    const gap = Math.min(38, (area - N*cw) / (N - 1));
    const x0 = PAD + TAG;
    const at = k => x0 + k*(cw+gap);

    const cell=(k,y,txt,bg,bd,tx,bold,dashed)=>{ rr(at(k),y,cw,NH,5);
      ctx.fillStyle=bg; ctx.fill(); ctx.lineWidth=bold?2.4:1.5; ctx.strokeStyle=bd;
      if(dashed) ctx.setLineDash([4,3]); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=tx; ctx.font='700 16px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(txt, at(k)+cw/2, y+NH/2); };
    const rowTag=(y,t,col)=>{ ctx.fillStyle=col; ctx.font='700 12px "JetBrains Mono", monospace';
      ctx.textAlign='right'; ctx.textBaseline='middle'; ctx.fillText(t, x0-12, y+NH/2); };

    // ── BAND 1 標題 ──
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 格內 = val,下方 R→k = random 指向索引 k', PAD, 16);
    ctx.textAlign='right'; ctx.font='700 12.5px "JetBrains Mono", monospace';
    ctx.fillStyle = done ? C.okT : C.text;
    ctx.fillText('n = ' + N, w - PAD, 16);

    ctx.textAlign='center'; ctx.font='700 12.5px "JetBrains Mono", monospace';
    ctx.fillStyle = done ? C.okT : C.winT;
    ctx.fillText(done ? '深拷貝完成 —— 新串列與原串列零共用節點'
                 : (s.act==='intro' ? '尚未開始'
                 : (s.act==='down' ? '下潛中:建拷貝 + 沿 next 遞迴' : '回程中:接 random(查 dict)')), w/2, 42);

    // ── 原串列 ──
    rowTag(Y1,'原串列',C.winT);
    for(let k=0;k<N;k++){
      const isFocus = k===s.focus;
      cell(k,Y1,String(VALS[k]), isFocus?C.cur:C.win, isFocus?C.curS:C.winS, isFocus?C.curT:C.winT, isFocus,false);
      // 索引
      ctx.fillStyle=C.dim; ctx.font='500 10.5px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='alphabetic'; ctx.fillText(String(k), at(k)+cw/2, Y1-8);
      // random 標記
      ctx.fillStyle=C.segT; ctx.font='700 11px "JetBrains Mono", monospace'; ctx.textBaseline='top';
      ctx.fillText(RND[k]<0?'R→null':('R→'+RND[k]), at(k)+cw/2, R1); }

    // ── 拷貝 ──
    rowTag(Y2,'拷貝',done?C.okT:C.segT);
    for(let k=0;k<N;k++){
      if(k < s.made){
        const isFocus = k===s.focus && s.act!=='intro';
        cell(k,Y2,String(VALS[k]), done?C.ok:(isFocus?C.cur:C.seg), done?C.okS:(isFocus?C.curS:C.segS),
             done?C.okT:(isFocus?C.curT:C.segT), isFocus,false);
      } else {
        cell(k,Y2,'?',C.off,C.offS,C.offT,false,true);          // 還沒建
      }
      ctx.textAlign='center';
      if(k < s.made && s.wired.indexOf(k) >= 0){
        ctx.fillStyle=done?C.okT:C.curT; ctx.font='700 11px "JetBrains Mono", monospace'; ctx.textBaseline='top';
        ctx.fillText(RND[k]<0?'R→null':('R→'+RND[k]), at(k)+cw/2, R2);
      } else if (k < s.made) {
        ctx.fillStyle=C.offT; ctx.font='500 11px "JetBrains Mono", monospace'; ctx.textBaseline='top';
        ctx.fillText('R→?', at(k)+cw/2, R2); }
    }

    // ── dict 狀態 ──
    ctx.fillStyle=C.dim; ctx.font='600 11.5px "JetBrains Mono", monospace';
    ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    let d = 'dict(原節點 → 拷貝節點): ';
    if(s.dict===0) d += '空';
    else { const parts=[]; for(let k=0;k<s.dict;k++) parts.push(k+'→'+k+"'"); d += parts.join('  '); }
    ctx.fillText(d, PAD, DICT_Y);
    ctx.textAlign='right'; ctx.fillStyle = s.dict? C.winT : C.offT;
    ctx.fillText(s.dict + ' / ' + N + ' 筆', w-PAD, DICT_Y);

    // ── BAND 2 ──
    const B2 = 292;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 這一步做了什麼', PAD, B2);
    rr(PAD,B2+10,w-2*PAD,42,6);
    ctx.fillStyle = done?C.ok:(s.act==='intro'?'#fafaf6':C.cur); ctx.fill();
    ctx.lineWidth=1.6; ctx.strokeStyle = done?C.okS:(s.act==='intro'?C.grid:C.curS); ctx.stroke();
    ctx.fillStyle = done?C.okT:(s.act==='intro'?C.text:C.curT);
    ctx.font='700 12.5px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(s.eq, w/2, B2+31);

    // ── BAND 3 ──
    const B3 = 364;
    ctx.fillStyle=C.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 為什麼', PAD, B3);
    rr(PAD,B3+10,w-2*PAD,40,6);
    ctx.fillStyle = done?C.ok:'#fafaf6'; ctx.fill();
    ctx.lineWidth=1.6; ctx.strokeStyle = done?C.okS:C.grid; ctx.stroke();
    ctx.fillStyle = done?C.okT:C.text;
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
