/* ============================================================
   P74 · Search a 2D Matrix — 兩段二分:先選列,再列內找 · viz
   矩陣性質:每列遞增,且「下一列的首元素 > 上一列的末元素」⇒ 攤平就是一條遞增序列。
   第一段(選列):對「每列的首元素」跑模板,pred = matrix[m][0] > target,
     收斂後 l = 第一列首元素 > target ⇒ 要的是它前面那列 → rowIdx = l - 1(最後一個不滿足)
     l == 0 代表所有列的首元素都 > target ⇒ 直接 false(這就是 l-1 = -1 的那個坑)
   第二段(列內):對該列跑二分收斂到單格,最後驗一次 == target。
   例 matrix=[[1,3,5,7],[10,11,16,20],[23,30,34,60]], target=3 → true。
     BAND 1  矩陣(藍=目前候選列/格 · 紅=mid · 綠=答案 · 灰=已排除)
     BAND 2  本輪判斷式
     BAND 3  這一步做了什麼決定
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
    col:'#f6ead8', colS:'#c8801e', colT:'#96601a',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424',
    grn:'#d9e8c7', grnS:'#5fa866', grnT:'#3f7a3a',
    off:'#f0f0ec', offS:'#cfcfcf', offT:'#a3a099', coral:'#cf3535' };

  const M = [[1,3,5,7],[10,11,16,20],[23,30,34,60]], TARGET = 3;
  const ROWS = M.length, COLS = M[0].length;

  // stage 1 = 選列(rL/rR/rMid 作用在列索引);stage 2 = 列內(cL/cR/cMid 作用在欄索引)
  const steps = [
    { stage:0, rL:0, rR:3, rMid:-1, row:-1, cL:-1, cR:-1, cMid:-1, ans:false, act:'intro',
      eq:'第一段 · left = 0 · right = m = 3 → 候選列 [0, 3)',
      note:'先只看「每列的首元素」這一欄 —— 它本身是遞增的',
      text:'<strong>INITIAL</strong> · 矩陣每列遞增,且<strong>下一列首元素 &gt; 上一列末元素</strong>,所以<strong>首元素那一欄本身遞增</strong>。第一段就對這一欄跑通用模板。' },

    { stage:1, rL:0, rR:3, rMid:1, row:-1, cL:-1, cR:-1, cMid:-1, ans:false, act:'probe',
      eq:'mid = 1 · matrix[1][0] = 10 > 3 ?  是',
      note:'首元素已經比 target 大 → 這列與其後全部出局',
      text:'<strong>第一段 Round 1</strong> · <code>matrix[1][0] = 10 &gt; 3</code>,代表第 1 列<strong>整列都比 target 大</strong>(列內遞增),它和它後面的列全部不可能。' },

    { stage:1, rL:0, rR:1, rMid:1, row:-1, cL:-1, cR:-1, cMid:-1, ans:false, act:'shrink-r',
      eq:'right = mid = 1 → 候選列縮為 [0, 1)',
      note:'pred 成立 → right = mid(保留 mid,和模板一致)',
      text:'<strong>第一段 Round 1 · 收縮</strong> · <code>right = 1</code>。這裡的 pred 是「<code>matrix[m][0] &gt; target</code>」,成立就 <code>right = mid</code> —— 完全是<a href="../../template.html">通用模板</a>的形狀。' },

    { stage:1, rL:0, rR:1, rMid:0, row:-1, cL:-1, cR:-1, cMid:-1, ans:false, act:'probe',
      eq:'mid = 0 · matrix[0][0] = 1 > 3 ?  否',
      note:'首元素還沒超過 target → 這列出局(但它可能就是要找的前一列)',
      text:'<strong>第一段 Round 2</strong> · <code>matrix[0][0] = 1 &lt;= 3</code>,pred 不成立 → 第 0 列在「F」那側,<code>left = mid + 1</code>。' },

    { stage:1, rL:1, rR:1, rMid:-1, row:0, cL:-1, cR:-1, cMid:-1, ans:false, act:'pick',
      eq:'left = 1 收斂 → rowIdx = left − 1 = 0     ← 要的是「前一列」',
      note:'模板給的是第一個 T;要的是最後一個 F → 取 l − 1',
      text:'<strong>第一段完成</strong> · <code>left = 1</code> 是「<strong>第一列首元素 &gt; 3</strong>」。但 target 若存在,只會在<strong>它前面那列</strong> → <code>rowIdx = left − 1 = 0</code>。若 <code>left == 0</code>(所有列都太大),就直接回 false。' },

    { stage:2, rL:1, rR:1, rMid:-1, row:0, cL:0, cR:3, cMid:1, ans:false, act:'probe',
      eq:'第二段 · mid = 1 · matrix[0][1] = 3 ≥ 3 ?  是',
      note:'列內是普通遞增序列 → 回到最單純的二分',
      text:'<strong>第二段 Round 1</strong> · 鎖定第 0 列 <code>[1,3,5,7]</code>,對它跑普通二分。<code>matrix[0][1] = 3 ≥ 3</code> 成立。' },

    { stage:2, rL:1, rR:1, rMid:-1, row:0, cL:0, cR:1, cMid:1, ans:false, act:'shrink-r',
      eq:'right = mid = 1 → 列內候選 [0, 1]',
      note:'≥ 成立 → right = mid,保留 mid',
      text:'<strong>第二段 Round 1 · 收縮</strong> · <code>right = 1</code>,保留 mid(它可能就是答案)。' },

    { stage:2, rL:1, rR:1, rMid:-1, row:0, cL:0, cR:1, cMid:0, ans:false, act:'probe',
      eq:'mid = 0 · matrix[0][0] = 1 ≥ 3 ?  否',
      note:'太小 → left = mid + 1,跨過 mid',
      text:'<strong>第二段 Round 2</strong> · <code>matrix[0][0] = 1 &lt; 3</code> → <code>left = mid + 1 = 1</code>。' },

    { stage:2, rL:1, rR:1, rMid:-1, row:0, cL:1, cR:1, cMid:-1, ans:false, act:'converge',
      eq:'left == right == 1 → 列內收斂到單格',
      note:'收斂只給候選格,是否命中要再驗一次',
      text:'<strong>第二段收斂</strong> · <code>left == right == 1</code>,只剩一個候選格。但 target 可能根本不在矩陣裡,還不能下結論。' },

    { stage:2, rL:1, rR:1, rMid:-1, row:0, cL:1, cR:1, cMid:-1, ans:true, act:'done',
      eq:'matrix[0][1] == 3 == target → return true',
      note:'兩段各 O(log),合起來就是 O(log m + log n) = O(log mn)',
      text:'<strong>完成</strong> · 驗證 <code>matrix[0][1] == 3</code> → 回傳 <strong>true</strong>。兩段二分各自 <code>O(log m)</code> 與 <code>O(log n)</code>,合起來正是題目要求的 <code>O(log(m·n))</code>。' },
  ];

  let step = 0, timer = null;

  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||396; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function triUp(cx,cy,col){ ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx-6,cy+8); ctx.lineTo(cx+6,cy+8); ctx.closePath(); ctx.fillStyle=col; ctx.fill(); }
  function triRight(cx,cy,col){ ctx.beginPath(); ctx.moveTo(cx+8,cy); ctx.lineTo(cx,cy-6); ctx.lineTo(cx,cy+6); ctx.closePath(); ctx.fillStyle=col; ctx.fill(); }

  function draw(){
    fit();
    const s = steps[step], w = canvas.clientWidth, PAD = 34;
    const done = s.act === 'done';
    ctx.fillStyle = C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);

    // 幾何:左側留給列指標,右側是矩陣
    const MARGIN = 74;                       // 左側列指標欄寬
    const gx0 = PAD + MARGIN;
    const cw = Math.min(76, (w - gx0 - PAD) / COLS - 10);
    const gapX = Math.min(12, (w - gx0 - PAD - COLS*cw) / (COLS - 1));
    const rowH = 42, gapY = 10;
    const GRID_TOP = 42;
    const cellX = j => gx0 + j * (cw + gapX);
    const cellY = i => GRID_TOP + i * (rowH + gapY);
    const GRID_BOT = cellY(ROWS - 1) + rowH;   // 42 + 2*52 + 42 = 188

    // ── BAND 1 ──
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 藍=候選 · 橘=首元素欄 · 紅=mid · 綠=答案', PAD, 16);
    ctx.textAlign='right'; ctx.font='700 12.5px "JetBrains Mono", monospace'; ctx.fillStyle= done ? C.grnT : C.text;
    ctx.fillText('target = ' + TARGET, w - PAD, 16);

    for (let i = 0; i < ROWS; i++) {
      const rowInWin = s.stage <= 1 && i >= s.rL && i < s.rR;      // 第一段:候選列
      const isRowMid = s.stage === 1 && i === s.rMid;
      const isPicked = s.row === i;

      for (let j = 0; j < COLS; j++) {
        let bg = C.off, bd = C.offS, tx = C.offT;

        if (s.stage === 0) { bg = C.win; bd = C.winS; tx = C.winT; }
        else if (s.stage === 1) {
          if (rowInWin) { bg = C.win; bd = C.winS; tx = C.winT; }
          if (j === 0)  { bg = rowInWin ? C.col : C.off; bd = rowInWin ? C.colS : C.offS; tx = rowInWin ? C.colT : C.offT; }
          if (isRowMid && j === 0) { bg = C.cur; bd = C.curS; tx = C.curT; }
          if (isPicked) { bg = C.col; bd = C.colS; tx = C.colT; }   // 選定的那一列:整列標起來
        } else {                                                    // 第二段:只有選中那列活著
          if (isPicked) {
            const inCol = j >= s.cL && j <= s.cR;
            if (inCol) { bg = C.win; bd = C.winS; tx = C.winT; }
            if (j === s.cMid) { bg = C.cur; bd = C.curS; tx = C.curT; }
            if (done && j === s.cL) { bg = C.grn; bd = C.grnS; tx = C.grnT; }
          }
        }

        rr(cellX(j), cellY(i), cw, rowH, 5);
        ctx.fillStyle = bg; ctx.fill();
        ctx.lineWidth = (bd === C.curS || bd === C.grnS) ? 3 : 1.5; ctx.strokeStyle = bd; ctx.stroke();
        ctx.fillStyle = tx; ctx.font='700 14px "JetBrains Mono", monospace';
        ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(String(M[i][j]), cellX(j) + cw/2, cellY(i) + rowH/2);
      }

      // 左側:列索引 + 第一段的 left/right/mid 指標
      ctx.textAlign='left'; ctx.textBaseline='middle';
      ctx.font='600 11px "JetBrains Mono", monospace';
      ctx.fillStyle = (rowInWin || isPicked) ? C.winT : C.offT;
      ctx.fillText('列 ' + i, PAD, cellY(i) + rowH/2);

      if (s.stage === 1) {
        let tagTxt = '', tagCol = C.winT;
        if (i === s.rMid) { tagTxt = 'mid'; tagCol = C.curT; }
        else if (i === s.rL && s.rL < s.rR) { tagTxt = 'l'; }
        if (tagTxt) {
          triRight(PAD + 38, cellY(i) + rowH/2, tagCol);
          ctx.fillStyle = tagCol; ctx.font='700 10.5px "JetBrains Mono", monospace';
          ctx.fillText(tagTxt, PAD + 50, cellY(i) + rowH/2);
        }
      }
      if (isPicked) {
        const pc = done ? C.grnT : (s.stage === 1 ? C.colT : C.winT);
        triRight(PAD + 38, cellY(i) + rowH/2, pc);
        ctx.fillStyle = pc; ctx.font='700 10.5px "JetBrains Mono", monospace';
        ctx.fillText('選中', PAD + 50, cellY(i) + rowH/2);
      }
    }

    // 第一段:right 指標(可能落在最後一列的下方,即 r == m)
    if (s.stage === 1 || s.act === 'pick') {
      const ry = s.rR >= ROWS ? GRID_BOT + 10 : cellY(s.rR) - gapY / 2;
      ctx.fillStyle = C.winT; ctx.font='700 10.5px "JetBrains Mono", monospace';
      ctx.textAlign='left'; ctx.textBaseline='middle';
      ctx.fillText('r=' + s.rR, PAD, ry);
      ctx.strokeStyle = C.winS; ctx.lineWidth = 1.5; ctx.setLineDash([4,3]);
      ctx.beginPath(); ctx.moveTo(PAD + 40, ry); ctx.lineTo(cellX(COLS-1) + cw, ry); ctx.stroke();
      ctx.setLineDash([]);
    }

    // 第二段:欄指標(畫在整個格線下方,不與任何列重疊)
    const COLMARK_Y = GRID_BOT + 16;
    if (s.stage === 2) {
      ctx.textAlign='center'; ctx.textBaseline='top';
      ctx.font='700 10.5px "JetBrains Mono", monospace';
      if (s.cMid >= 0) {
        triUp(cellX(s.cMid) + cw/2, COLMARK_Y, C.curS);
        ctx.fillStyle = C.curT; ctx.fillText('mid=' + s.cMid, cellX(s.cMid) + cw/2, COLMARK_Y + 10);
      } else {
        ctx.fillStyle = done ? C.grnT : C.winT;
        ctx.fillText(s.cL === s.cR ? ('l = r = ' + s.cL) : ('l=' + s.cL + '  r=' + s.cR), cellX(s.cL) + cw/2, COLMARK_Y + 10);
      }
    }

    // ── BAND 2 ──
    const B2 = 262;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText(s.stage === 2 ? 'BAND 2 · 第二段(列內二分)' : 'BAND 2 · 第一段(選列)', PAD, B2);
    rr(PAD, B2 + 10, w - 2*PAD, 42, 6);
    const probe = s.act === 'probe';
    ctx.fillStyle = done ? C.grn : (probe ? C.cur : (s.act === 'intro' ? '#fafaf6' : (s.act === 'pick' ? C.col : C.win)));
    ctx.fill();
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = done ? C.grnS : (probe ? C.curS : (s.act === 'intro' ? C.grid : (s.act === 'pick' ? C.colS : C.winS)));
    ctx.stroke();
    ctx.fillStyle = done ? C.grnT : (probe ? C.curT : (s.act === 'pick' ? C.colT : C.winT));
    ctx.font='700 13px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(s.eq, w/2, B2 + 31);

    // ── BAND 3 ──
    const B3 = 334;
    ctx.fillStyle=C.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 兩段二分:先用 l−1 選列,再列內收斂到單格', PAD, B3);
    rr(PAD, B3 + 10, w - 2*PAD, 40, 6);
    ctx.fillStyle = done ? C.grn : '#fafaf6'; ctx.fill();
    ctx.lineWidth = 1.6; ctx.strokeStyle = done ? C.grnS : C.grid; ctx.stroke();
    ctx.fillStyle = done ? C.grnT : C.text;
    ctx.font='600 12.5px "Noto Sans TC", sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(s.note, w/2, B3 + 30);
  }

  function update(){ if(stepEl) stepEl.textContent=String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0'); if(labelEl) labelEl.innerHTML=steps[step].text; draw(); }
  function next(){ if(step<steps.length-1){step++;update();}else stop(); }
  function prev(){ if(step>0){step--;update();} }
  function reset(){ stop(); step=0; update(); }
  function play(){ if(timer){stop();return;} bPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){stop();return;} next(); },1900); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} if(bPlay) bPlay.textContent='Play'; }
  bPrev&&bPrev.addEventListener('click',prev); bNext&&bNext.addEventListener('click',next); bPlay&&bPlay.addEventListener('click',play); bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();}); if(window.ResizeObserver){ new ResizeObserver(()=>{fit();draw();}).observe(canvas); }
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw); fit(); update();
})();
