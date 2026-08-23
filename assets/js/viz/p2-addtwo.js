/* ============================================================
   P2 · Add Two Numbers — 逐位相加 + carry · viz
   數字「低位在前」,所以直接從頭往後走就是從個位開始加 —— 順序天生就對。
   while (carry || l1 || l2) 這一個條件同時處理三件事:
     兩條長度不等、其中一條先走完、最後還剩一個進位。
   例 [9,9,9] + [9,9](= 999 + 99 = 1098)→ 4 圈,結果 [8,9,0,1]。
     BAND 1  l1 / l2 兩排(已用掉的變灰)+ 下方逐漸長出來的結果 + carry
     BAND 2  這一圈的算式
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

  const L1 = [9,9,9], L2 = [9,9];          // 999 + 99 = 1098
  const SLOTS = 5;                          // dummy + 最多 4 個結果節點

  // i1/i2:兩條各用掉幾個;res:已產生的位數;carryIn:進入這一圈時的 carry
  const steps = [
    { i1:0, i2:0, res:[], carryIn:0, carryOut:0, act:'intro',
      eq:'while (carry || l1 || l2)   —— 一個條件管三件事',
      note:'低位在前 ⇒ 從頭往後走就是從個位開始加,順序天生就對',
      text:'<strong>INITIAL</strong> · 兩條串列是<strong>低位在前</strong>(<code>[9,9,9]</code> 代表 999)。這個看似奇怪的存法其實是<strong>禮物</strong> —— 直式加法本來就從個位開始,而個位剛好就是頭,所以<strong>從頭往後走一遍就好</strong>,不必先翻轉。<code>carry</code> 從 0 開始。' },

    { i1:1, i2:1, res:[8], carryIn:0, carryOut:1, act:'add',
      eq:'v = carry(0) + l1(9) + l2(9) = 18\n這位 = 18 % 10 = 8　　carry = 18 / 10 = 1',
      note:'v 的上界是 9 + 9 + 1 = 19,所以 carry 只可能是 0 或 1',
      text:'<strong>第 1 圈</strong> · <code>9 + 9 = 18</code>,個位留 <strong>8</strong>、進位 <strong>1</strong>。注意 <code>v</code> 最大就是 <code>9 + 9 + 1 = 19</code> —— <strong>實測 30 萬組隨機測資,<code>v</code> 的最大值正好是 19、<code>carry</code> 的最大值正好是 1</strong>。所以 <code>carry</code> 是個布林量,不會累積。' },

    { i1:2, i2:2, res:[8,9], carryIn:1, carryOut:1, act:'add',
      eq:'v = carry(1) + l1(9) + l2(9) = 19\n這位 = 9　　carry = 1',
      note:'進位被「帶進」下一圈的 v —— 這就是 int v = carry; 那一行在做的事',
      text:'<strong>第 2 圈</strong> · 這次 <code>v</code> 的起手是<strong>上一圈留下的 carry</strong>。<code>int v = carry;</code> 那一行看起來平淡,但它正是「進位」這個概念的全部實作 —— 把上一位溢出的 1 帶到這一位。' },

    { i1:3, i2:2, res:[8,9,0], carryIn:1, carryOut:1, act:'add',
      eq:'v = carry(1) + l1(9) = 10   (l2 已空,跳過)\n這位 = 0　　carry = 1',
      note:'兩個 if (l1) / if (l2) 讓「長度不等」不必特判 —— 空的那條直接不加',
      text:'<strong>第 3 圈 · l2 用完了</strong> · <code>if (l2)</code> 不成立,所以這一圈<strong>只加 l1 和 carry</strong>。兩條長度不等這件事,就被這兩個 <code>if</code> 悄悄處理掉了 —— <strong>不需要補零、不需要特判</strong>。' },

    { i1:3, i2:2, res:[8,9,0,1], carryIn:1, carryOut:0, act:'add',
      eq:'v = carry(1) = 1   (兩條都空)  →  這位 = 1,carry = 0',
      note:'這一圈完全靠 while 條件裡的 carry 撐起來 —— 少了它,最高位的 1 就丟了',
      text:'<strong>第 4 圈 · 只剩進位</strong> · 兩條都空了,但 <code>carry</code> 還是 1,所以 <code>while (carry || …)</code> <strong>仍然成立</strong>,再跑一圈把這個 1 變成新的最高位。<strong>實測把 <code>carry</code> 從 while 條件裡拿掉,100 萬組窮舉錯 504495 組</strong>,最小反例 <code>[1] + [9]</code> 答 <code>[0]</code>(正解 <code>[0,1]</code>)。' },

    { i1:3, i2:2, res:[8,9,0,1], carryIn:0, carryOut:0, act:'done',
      eq:'return dummy->next = [8,9,0,1]     // 8901 反過來讀 = 1098 ✓',
      note:'結果長度 = max(m,n) 或 max(m,n)+1;實測 100+100 位全 9 → 101 位',
      text:'<strong>完成</strong> · <code>carry = 0</code> 且兩條都空 → 跳出。結果 <code>[8,9,0,1]</code>,低位在前,讀回來就是 <strong>1098 = 999 + 99</strong> ✓。結果長度是 <code>max(m,n)</code> 或多一位;實測最大合法輸入(兩條各 100 個 9)得到 <strong>101 位</strong>。' },
  ];

  let step = 0, timer = null;

  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||460; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  const TAG = 62, NH = 42;
  const Y1 = 84, Y2 = 166, YR = 254;        // 三排,排間 ≥ 40px
  const CARRY_Y = 58;                        // 進位標記畫在最上面一排,像直式加法

  function draw(){
    fit();
    const s = steps[step], w = canvas.clientWidth, PAD = 30;
    const done = s.act === 'done';
    ctx.fillStyle = C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);

    const area = w - 2*PAD - TAG;
    const cw = Math.min(54, area / SLOTS - 18);
    const gap = Math.min(28, (area - SLOTS*cw) / (SLOTS - 1));
    const x0 = PAD + TAG;
    const at = k => x0 + k*(cw+gap);

    const cell = (k,y,txt,bg,bd,tx,bold,dashed)=>{ rr(at(k),y,cw,NH,5);
      ctx.fillStyle=bg; ctx.fill(); ctx.lineWidth=bold?2.4:1.5; ctx.strokeStyle=bd;
      if(dashed) ctx.setLineDash([4,3]); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=tx; ctx.font='700 15px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(txt, at(k)+cw/2, y+NH/2); };
    const rowTag=(y,t,col)=>{ ctx.fillStyle=col; ctx.font='700 12px "JetBrains Mono", monospace';
      ctx.textAlign='right'; ctx.textBaseline='middle'; ctx.fillText(t, x0-12, y+NH/2); };

    // ── BAND 1 標題 ──
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 低位在前(最左邊是個位)· 灰 = 已經加過', PAD, 16);
    ctx.textAlign='right'; ctx.font='700 12.5px "JetBrains Mono", monospace';
    ctx.fillStyle = done ? C.okT : C.text;
    ctx.fillText(done ? '完成 · 4 圈' : ('999 + 99 = 1098'), w - PAD, 16);

    // while 條件狀態列
    const h1 = s.i1 < L1.length ? String(L1[s.i1]) : 'null';
    const h2 = s.i2 < L2.length ? String(L2[s.i2]) : 'null';
    ctx.textAlign='center'; ctx.font='700 12.5px "JetBrains Mono", monospace';
    ctx.fillStyle = done ? C.okT : C.winT;
    ctx.fillText(done ? 'carry = 0 且兩條都空 → 跳出'
                 : ('carry = ' + s.carryOut + '　　l1 → ' + h1 + '　　l2 → ' + h2), w/2, 40);

    // ── 進位標記(像直式加法寫在上頭)──
    if (!done && s.carryOut > 0) {
      const k = s.res.length;               // 進位要帶去的下一位
      if (k < SLOTS - 1) {
        ctx.fillStyle = C.curT; ctx.font='700 11.5px "JetBrains Mono", monospace';
        ctx.textAlign='center'; ctx.textBaseline='alphabetic';
        ctx.fillText('carry ' + s.carryOut + ' ↓', at(k) + cw/2, CARRY_Y + 14);
      }
    }

    // ── l1 ──
    rowTag(Y1,'l1',C.winT);
    for(let k=0;k<L1.length;k++){ const used=k<s.i1, head=(k===s.i1 && !done);
      if(used) cell(k,Y1,String(L1[k]),C.off,C.offS,C.offT,false,false);
      else cell(k,Y1,String(L1[k]),head?C.cur:C.win,head?C.curS:C.winS,head?C.curT:C.winT,head,false); }
    if(s.i1>=L1.length){ ctx.fillStyle=C.dim; ctx.font='700 11.5px "JetBrains Mono", monospace';
      ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText('l1 = null', at(L1.length)+4, Y1+NH/2); }

    // ── l2 ──
    rowTag(Y2,'l2',C.segT);
    for(let k=0;k<L2.length;k++){ const used=k<s.i2, head=(k===s.i2 && !done);
      if(used) cell(k,Y2,String(L2[k]),C.off,C.offS,C.offT,false,false);
      else cell(k,Y2,String(L2[k]),head?C.cur:C.seg,head?C.curS:C.segS,head?C.curT:C.segT,head,false); }
    if(s.i2>=L2.length){ ctx.fillStyle=C.dim; ctx.font='700 11.5px "JetBrains Mono", monospace';
      ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText('l2 = null(已用完)', at(L2.length)+4, Y2+NH/2); }

    // ── 分隔線 ──
    ctx.strokeStyle=C.grid; ctx.lineWidth=1; ctx.setLineDash([4,4]);
    ctx.beginPath(); ctx.moveTo(PAD, YR-26.5); ctx.lineTo(w-PAD, YR-26.5); ctx.stroke(); ctx.setLineDash([]);

    // ── 結果 ──
    rowTag(YR,'結果',done?C.okT:C.text);
    for(let k=0;k<s.res.length;k++){
      const justAdded = (k === s.res.length-1) && !done && s.act==='add';
      cell(k,YR,String(s.res[k]),done?C.ok:C.win,done?C.okS:(justAdded?C.curS:C.winS),done?C.okT:C.winT,justAdded,false); }
    // 這一圈正要產生的空位
    if(!done && s.act!=='intro'){ /* 已經畫進 res 了 */ }
    if(s.act==='intro'){ cell(0,YR,'?',C.off,C.offS,C.offT,false,true); }

    // ── BAND 2 ──
    const B2 = 320;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 這一圈的算式', PAD, B2);
    const lines = s.eq.split('\n');            // 長算式拆兩行,窄螢幕才不會被切掉
    rr(PAD,B2+10,w-2*PAD,lines.length>1?54:42,6);
    ctx.fillStyle = done?C.ok:(s.act==='intro'?'#fafaf6':C.cur); ctx.fill();
    ctx.lineWidth=1.6; ctx.strokeStyle = done?C.okS:(s.act==='intro'?C.grid:C.curS); ctx.stroke();
    ctx.fillStyle = done?C.okT:(s.act==='intro'?C.text:C.curT);
    ctx.font='700 12.5px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
    if(lines.length>1){ ctx.fillText(lines[0], w/2, B2+26); ctx.fillText(lines[1], w/2, B2+47); }
    else              { ctx.fillText(lines[0], w/2, B2+31); }

    // ── BAND 3 ──
    const B3 = 404;
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
  function play(){ if(timer){stop();return;} bPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){stop();return;} next(); },1950); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} if(bPlay) bPlay.textContent='Play'; }
  bPrev&&bPrev.addEventListener('click',prev); bNext&&bNext.addEventListener('click',next); bPlay&&bPlay.addEventListener('click',play); bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();}); if(window.ResizeObserver){ new ResizeObserver(()=>{fit();draw();}).observe(canvas); }
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw); fit(); update();
})();
