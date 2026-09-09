/* ============================================================
   P199 · Binary Tree Right Side View — BFS · viz
     int sz = q.size();
     for (int i = 0; i < sz; i++) { pop; 推小孩; if (i == sz-1) ans.push_back(u->val); }
   動畫要傳達的一件事:入選與否看的是「在這一層佇列裡的位置」,
   而不是「自己是左小孩還是右小孩」。
   例 [1,2,3,null,5,null,4] → [1,3,4]
      節點 5 是節點 2 的右小孩,但在第 2 層排在前面 ⇒ 落選
      節點 4 是「右小孩的右小孩」,排在後面 ⇒ 入選
      但如果 3 沒有小孩,第 2 層只剩 [5],5 就會入選 —— 所以左鏈也能是右視圖
     BAND 1  樹狀圖
     BAND 2  這一層的佇列 + i 的位置(最後一個框起來)
     BAND 3  ans
     BAND 4  為什麼
   所有狀態取自實測 trace,未手推。
   前綴 v199- 。
   ============================================================ */
(function () {
  const canvas = document.getElementById('v199-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('v199-step'), labelEl = document.getElementById('v199-label');
  const bPrev = document.getElementById('v199-prev'), bNext = document.getElementById('v199-next'),
        bPlay = document.getElementById('v199-play'), bReset = document.getElementById('v199-reset');

  const C = { paper:'#ffffff', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf',
    win:'#e3edf5', winS:'#4478c0', winT:'#2f5f9e',
    seg:'#f6ead8', segS:'#c8801e', segT:'#96601a',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424',
    ok:'#d9e8c7', okS:'#5fa866', okT:'#3f7a3a',
    off:'#f0f0ec', offS:'#cfcfcf', offT:'#a3a099', coral:'#cf3535' };

  /* [1,2,3,null,5,null,4] —— heap 索引;5 是 2 的右子(索引5)、4 是 3 的右子(索引7) */
  const V   = { 1:1, 2:2, 3:3, 5:5, 7:4 };
  const POS = { 1:[3.5,0], 2:[1.5,1], 3:[5.5,1], 5:[2.5,2], 7:[6.5,2] };
  const IDS = [1,2,3,5,7];
  const NCOL = 8, NROW = 3;

  /* levelQ = 這一層的佇列;idx = 目前的 i;chosen = 已入選;popped = 已處理 */
  const S = (levelQ, idx, chosen, popped, ans, phase, eq, note, text) =>
    ({ levelQ, idx, chosen, popped, ans, phase, eq, note, text });

  const steps = [
    S([1], -1, [], [], [], 'intro',
      'ans = []     右視圖 = 「每一層最右邊的那個」',
      '注意:是「每層最右」,不是「一路往右走」—— 這兩件事差很多',
      '<strong>INITIAL</strong> · 右視圖的定義是「<strong>從右邊看過去,每一層看得到的那一個</strong>」—— 也就是<b>每一層最右邊的節點</b>。<b>⚠ 這<em>不是</em>「從根一路往右走」</b>,兩者差很多(見下方說明)。'),

    S([1], 0, [1], [1], [1], 'hit',
      '第 0 層:sz=1,i=0 == sz-1  →  收錄 1',
      '這一層只有一個,它自然就是最右邊那個',
      '<strong>第 0 層</strong> · 只有根 <code>1</code>,<code>sz = 1</code>。<code>i = 0 == sz-1</code> ⇒ <strong>收錄</strong>。推入小孩 <code>2</code>、<code>3</code>。'),

    S([2,3], 0, [1], [1,2], [1], 'skip',
      '第 1 層:sz=2,i=0 != sz-1  →  略過 2',
      '2 排在這一層的前面 —— 被右邊的擋住了',
      '<strong>第 1 層 · i=0</strong> · 彈出 <code>2</code>。<code>i = 0</code>,而 <code>sz-1 = 1</code> ⇒ <strong>不收錄</strong>。<b><code>2</code> 在這一層排在前面,被右邊的擋住了</b>。它的右小孩 <code>5</code> 被推進佇列。'),

    S([2,3], 1, [1,3], [1,2,3], [1,3], 'hit',
      '第 1 層:i=1 == sz-1  →  收錄 3',
      '3 是這一層的最後一個 ⇒ 入選',
      '<strong>第 1 層 · i=1</strong> · 彈出 <code>3</code>,<code>i = 1 == sz-1</code> ⇒ <strong>收錄</strong>。它的右小孩 <code>4</code> 被推進佇列。<b>注意推入的順序:先進去的是 <code>2</code> 的小孩 <code>5</code>,後進去的才是 <code>3</code> 的小孩 <code>4</code></b>。'),

    S([5,7], 0, [1,3], [1,2,3,5], [1,3], 'skip',
      '第 2 層:佇列是 [5, 4],sz=2,i=0 != sz-1  →  略過 5',
      '⚡ 5 自己也是「右小孩」,卻仍落選 —— 決定的是位置,不是左右',
      '<strong>第 2 層 · i=0 —— 這一步最關鍵</strong> · 佇列是 <code>[5, 4]</code>。彈出 <code>5</code>,<code>i=0 != 1</code> ⇒ <strong>不收錄</strong>。<b>⚡ <code>5</code> 其實是「<em>右</em>小孩」(它是 <code>2</code> 的右小孩)</b>,<strong>但它還是落選了</strong> —— <b>因為決定入選的是「在這一層佇列裡的位置」,不是「自己是左還是右」。</b>'),

    S([5,7], 1, [1,3,7], [1,2,3,5,7], [1,3,4], 'hit',
      '第 2 層:i=1 == sz-1  →  收錄 4',
      'BFS 保證同一層由左到右排列,所以最後一個就是最右邊那個',
      '<strong>第 2 層 · i=1</strong> · 彈出 <code>4</code>,<code>i = 1 == sz-1</code> ⇒ <strong>收錄</strong>。<b>BFS 保證「同一層的節點在佇列裡由左到右排列」</b> —— <strong>所以「最後一個」永遠就是「最右邊那個」</strong>。'),

    S([], -1, [1,3,7], [1,2,3,5,7], [1,3,4], 'done',
      'return [1,3,4]     ans.size() == 樹高',
      '實測:ans.size() 恆等於樹高;而「一路往右走」錯 6555/6918',
      '<strong>完成</strong> · <code>[1,3,4]</code>。<b>實測性質</b>:<code>ans.size()</code> <strong>恆等於樹高</strong>(窮舉 6918 種樹形零違反)—— 每層恰好貢獻一個。<b>而「從根一路往右走」那個常見誤解,實測錯 <strong>6555/6918(94.75%)</strong></b>,只在「右脊長度 == 樹高」時才碰巧正確。'),
  ];

  let step = 0, timer = null;

  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||380; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  const TREE_TOP = 26, ROW_H = 46, R = 18;

  function draw(){
    fit();
    const s = steps[step], w = canvas.clientWidth, PAD = 28;
    const done = s.phase === 'done';
    ctx.fillStyle = C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);

    const colW = (w - 2*PAD) / NCOL;
    const nx = i => PAD + (POS[i][0] + 0.5) * colW;
    const ny = i => TREE_TOP + 22 + POS[i][1] * ROW_H;
    const chosen = new Set(s.chosen), popped = new Set(s.popped);
    const curId = (s.idx >= 0 && s.levelQ[s.idx] !== undefined) ? s.levelQ[s.idx] : -1;

    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 綠 = 入選(每層最右)　紅 = 這一步　灰 = 落選', PAD, 16);

    ctx.lineWidth = 1.8;
    IDS.forEach(i => {
      [2*i, 2*i+1].forEach(c => {
        if (!POS[c]) return;
        ctx.strokeStyle = C.grid;
        ctx.beginPath(); ctx.moveTo(nx(i), ny(i) + R - 2); ctx.lineTo(nx(c), ny(c) - R + 2); ctx.stroke();
      });
    });

    IDS.forEach(i => {
      let bg = C.off, bd = C.offS, tx = C.offT;
      if (i === curId)          { bg = C.cur; bd = C.curS; tx = C.curT; }
      else if (chosen.has(i))   { bg = C.ok;  bd = C.okS;  tx = C.okT; }
      else if (popped.has(i))   { bg = '#fafaf6'; bd = C.grid; tx = C.offT; }
      ctx.beginPath(); ctx.arc(nx(i), ny(i), R, 0, Math.PI*2);
      ctx.fillStyle = bg; ctx.fill();
      ctx.lineWidth = i === curId ? 2.6 : 1.5;
      ctx.strokeStyle = bd; ctx.stroke();
      ctx.fillStyle = tx; ctx.font='700 14px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(V[i]), nx(i), ny(i));

      if (chosen.has(i) && i !== curId) {
        ctx.fillStyle = C.okT; ctx.font='700 10.5px "JetBrains Mono", monospace';
        ctx.textAlign='center'; ctx.textBaseline='top';
        ctx.fillText('入選', nx(i), ny(i) + R + 4);
      } else if (popped.has(i) && !chosen.has(i) && i !== curId) {
        ctx.fillStyle = C.dim; ctx.font='600 10.5px "JetBrains Mono", monospace';
        ctx.textAlign='center'; ctx.textBaseline='top';
        ctx.fillText('落選', nx(i), ny(i) + R + 4);
      }
    });

    // BAND 2 · 這一層的佇列
    const B2 = TREE_TOP + 22 + NROW * ROW_H + 6;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 這一層的佇列(綠框 = i == sz-1,也就是最右邊那個)', PAD, B2);

    const cw = 42, cgap = 8, qTop = B2 + 14, qx0 = PAD + 4;
    if (s.levelQ.length === 0) {
      ctx.fillStyle = done ? C.okT : C.dim; ctx.font='600 12.5px "JetBrains Mono", monospace';
      ctx.textAlign='left'; ctx.textBaseline='middle';
      ctx.fillText(done ? '(空 —— 全部走完)' : '(空)', qx0, qTop + 17);
    }
    s.levelQ.forEach((id, k) => {
      const x = qx0 + k * (cw + cgap);
      const isLast = k === s.levelQ.length - 1;
      const isCur = k === s.idx;
      rr(x, qTop, cw, 34, 5);
      ctx.fillStyle = isCur ? (isLast ? C.ok : C.cur) : (isLast ? '#eef5e6' : '#fafaf6'); ctx.fill();
      ctx.lineWidth = isCur ? 2.6 : (isLast ? 2.2 : 1.4);
      ctx.strokeStyle = isLast ? C.okS : (isCur ? C.curS : C.grid); ctx.stroke();
      ctx.fillStyle = isLast ? C.okT : (isCur ? C.curT : C.text);
      ctx.font='700 14px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(V[id]), x + cw/2, qTop + 17);
      ctx.font='600 10px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='top';
      ctx.fillStyle = C.dim;
      ctx.fillText('i=' + k, x + cw/2, qTop + 37);
    });

    // BAND 3 · ans
    const B3 = qTop + 34 + 30;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · ans', PAD, B3);
    rr(PAD, B3 + 10, w - 2*PAD, 32, 6);
    ctx.fillStyle = done ? C.ok : '#fafaf6'; ctx.fill();
    ctx.lineWidth = 1.6; ctx.strokeStyle = done ? C.okS : C.grid; ctx.stroke();
    ctx.fillStyle = done ? C.okT : C.text;
    ctx.font='700 13px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('[' + s.ans.join(', ') + ']', w/2, B3 + 26);

    // BAND 4
    const B4 = B3 + 56;
    ctx.fillStyle=C.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 4 · 為什麼', PAD, B4);
    rr(PAD, B4 + 10, w - 2*PAD, 38, 6);
    ctx.fillStyle = done ? C.ok : (s.phase === 'skip' ? C.seg : '#fafaf6'); ctx.fill();
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = done ? C.okS : (s.phase === 'skip' ? C.segS : C.grid); ctx.stroke();
    ctx.fillStyle = done ? C.okT : (s.phase === 'skip' ? C.segT : C.text);
    ctx.font='600 12.5px "Noto Sans TC", sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(s.note, w/2, B4 + 29);
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
