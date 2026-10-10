/* ============================================================
   P473 · Matchsticks to Square — 每根火柴試 4 個桶 · 放不下跳過 · 同高跳過 · 失敗拿回 · viz
     bool exist(nums, buckets, target, idx) {
         if (idx >= nums.size()) return true;
         for (int i = 0; i < 4; i++) {
             if (buckets[i] + nums[idx] > target) continue;          // 放不下
             if (i > 0 && buckets[i] == buckets[i - 1]) continue;   // 和左邊同高 → 對稱,跳過
             buckets[i] += nums[idx];
             if (exist(nums, buckets, target, idx + 1)) return true;
             buckets[i] -= nums[idx];                                // 撤銷
         }
         return false;
     }
   [3,3,3,3,4] → 排序 [4,3,3,3,3],total 16,target 4(g++ 實跑 trace,見 facts「Trace [3,3,3,3,4]」)
     #1 idx0 v4 i0 放 [4,0,0,0]
     #2 idx1 v3 i0 放不下(7) · i1 放 [4,3,0,0]
     #3 idx2 v3 i0 放不下 · i1 放不下(6) · i2 放 [4,3,3,0]
     #4 idx3 v3 i0,i1,i2 放不下 · i3 放 [4,3,3,3]
     #5 idx4 v3 四個都放不下 → false
     #4 拿回 → [4,3,3,0] false · #3 拿回 → [4,3,0,0],i3 同高跳過 false
     #2 拿回 → [4,0,0,0],i2 i3 同高跳過 false · #1 拿回 → [0,0,0,0],i1 i2 i3 同高跳過 false
     共 5 次 exist。
   BAND 1 排序後的 nums(紅 = 目前 idx,藍 / 米 = 已放進哪個桶)+ total / target / 呼叫數
   BAND 2 四個桶(虛線 = target 4;紅 = 正在試;粉 = 放不下的鬼影;灰弧 = 同高跳過;深紅虛線 = 拿回)
   BAND 3 call stack #1..#5   BAND 4 這一步(哪一行跑了)
   前綴 v473- 。
   ============================================================ */
(function () {
  const C = { paper:'#ffffff', ink:'#1f1f1f', dim:'#5a5a5a', off:'#cfcfcf',
    up:'#e3edf5', low:'#f6ead8',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424',
    good:'#d9e8c7', bad:'#f0d4d4', deep:'#a31d1d', gray:'#ececec' };
  const MONO = '"JetBrains Mono", monospace', SANS = '"Noto Sans TC", sans-serif';
  const NUMS = [4, 3, 3, 3, 3], N = 5, TARGET = 4, CALLS = 5;
  const TINT = b => (b % 2 ? C.low : C.up);
  const _ = null;

  /* 步驟。k:'init'|'place'|'over'|'undo'|'dup'|'fin'
     run = 正在跑的 exist 編號(idx = run − 1);pick[j] = nums[j] 這一步結束時放在哪個桶(−1 = 沒放)
     ver = 目前這層迴圈每個 i 的判定(到這一步為止);hot = 這一步動到的 i
     called = 已經呼叫過幾次 exist;ret = 已 return false 的呼叫編號;lift = 拿回時被拿走的 { j, b } */
  const STEPS = [
    { k:'init', run:1, pick:[-1,-1,-1,-1,-1], ver:[_,_,_,_], hot:[], called:1, ret:[],
      line:'sort 降序 · total = 16 · target = 16 / 4 = 4', res:'#1 exist(idx = 0)',
      text:'<strong>INITIAL · [3,3,3,3,4]</strong> · total = 16,<code>16 % 4 == 0</code>,所以 <code>target = 4</code>。先<b>降序</b>排成 <code>[4,3,3,3,3]</code>:長的先放,越早撞到「放不下」。4 個桶 <code>buckets = [0,0,0,0]</code>,呼叫 <b>#1 exist(idx = 0)</b>。' },
    { k:'place', run:1, pick:[0,-1,-1,-1,-1], ver:['place',_,_,_], hot:[0], called:2, ret:[],
      line:'buckets[0] += nums[0];', res:'[4,0,0,0] → #2 exist(idx = 1)',
      text:'<strong>#1 · nums[0] = 4 放進 b0</strong> · <code>0 + 4 = 4 ≤ 4</code> 放得下;i = 0 不用比左邊 → <code>buckets[0] += 4</code>,b0 剛好滿。遞迴 <b>#2 exist(idx = 1)</b>。' },
    { k:'over', run:2, pick:[0,-1,-1,-1,-1], ver:['over',_,_,_], hot:[0], called:2, ret:[],
      line:'if (buckets[i] + nums[idx] > target) continue;', res:'i = 0:4 + 3 = 7 > 4 → continue',
      text:'<strong>#2 · i = 0 放不下</strong> · nums[1] = 3,<code>buckets[0] + 3 = 7 > 4</code>:紅色鬼影超出虛線 → <code>continue</code>,換下一個桶。' },
    { k:'place', run:2, pick:[0,1,-1,-1,-1], ver:['over','place',_,_], hot:[1], called:3, ret:[],
      line:'buckets[1] += nums[1];', res:'[4,3,0,0] → #3 exist(idx = 2)',
      text:'<strong>#2 · i = 1 放入</strong> · <code>0 + 3 = 3 ≤ 4</code>;b1 = 0 ≠ b0 = 4,不是同高 → <code>buckets[1] += 3</code>。遞迴 <b>#3 exist(idx = 2)</b>。' },
    { k:'over', run:3, pick:[0,1,-1,-1,-1], ver:['over',_,_,_], hot:[0], called:3, ret:[],
      line:'if (buckets[i] + nums[idx] > target) continue;', res:'i = 0:4 + 3 = 7 > 4 → continue',
      text:'<strong>#3 · i = 0 放不下</strong> · nums[2] = 3,b0 已經是 4:<code>4 + 3 = 7 > 4</code> → <code>continue</code>。' },
    { k:'over', run:3, pick:[0,1,-1,-1,-1], ver:['over','over',_,_], hot:[1], called:3, ret:[],
      line:'if (buckets[i] + nums[idx] > target) continue;', res:'i = 1:3 + 3 = 6 > 4 → continue',
      text:'<strong>#3 · i = 1 也放不下</strong> · b1 = 3:<code>3 + 3 = 6 > 4</code> → <code>continue</code>。兩根 3 永遠不能同一邊。' },
    { k:'place', run:3, pick:[0,1,2,-1,-1], ver:['over','over','place',_], hot:[2], called:4, ret:[],
      line:'buckets[2] += nums[2];', res:'[4,3,3,0] → #4 exist(idx = 3)',
      text:'<strong>#3 · i = 2 放入</strong> · <code>0 + 3 ≤ 4</code>;b2 = 0 ≠ b1 = 3 → <code>buckets[2] += 3</code>。遞迴 <b>#4 exist(idx = 3)</b>。' },
    { k:'over', run:4, pick:[0,1,2,-1,-1], ver:['over','over','over',_], hot:[0,1,2], called:4, ret:[],
      line:'if (buckets[i] + nums[idx] > target) continue;', res:'i = 0,1,2:7 / 6 / 6 > 4 → continue ×3',
      text:'<strong>#4 · i = 0、1、2 都放不下</strong> · nums[3] = 3:<code>4+3 = 7</code>、<code>3+3 = 6</code>、<code>3+3 = 6</code> 全部 > 4 → 連續三次 <code>continue</code>。' },
    { k:'place', run:4, pick:[0,1,2,3,-1], ver:['over','over','over','place'], hot:[3], called:5, ret:[],
      line:'buckets[3] += nums[3];', res:'[4,3,3,3] → #5 exist(idx = 4)',
      text:'<strong>#4 · i = 3 放入</strong> · <code>0 + 3 ≤ 4</code>;b3 = 0 ≠ b2 = 3 → <code>buckets[3] += 3</code> → <code>[4,3,3,3]</code>。遞迴 <b>#5 exist(idx = 4)</b>:最後一根 3。' },
    { k:'over', run:5, pick:[0,1,2,3,-1], ver:['over','over','over','over'], hot:[0,1,2,3], called:5, ret:[5],
      line:'if (buckets[i] + nums[idx] > target) continue;', res:'i = 0..3:7 / 6 / 6 / 6 > 4 → return false',
      text:'<strong>#5 · 四個桶都放不下 → return false</strong> · 剩下的空間是 0、1、1、1,最後一根 3 塞不進任何一邊:<code>7 / 6 / 6 / 6 > 4</code>,四次 <code>continue</code>,迴圈結束 <code>return false</code>。' },
    { k:'undo', run:4, pick:[0,1,2,-1,-1], ver:['over','over','over','undo'], hot:[3], called:5, ret:[5,4], lift:{ j:3, b:3 },
      line:'buckets[3] -= nums[3];', res:'#5 false → 拿回 3 → [4,3,3,0] · #4 false',
      text:'<strong>回到 #4 · 拿回</strong> · #5 回傳 false → <code>buckets[3] -= 3</code>,b3 回到 0。i = 3 是最後一個桶,#4 的迴圈結束 → <code>return false</code>。' },
    { k:'undo', run:3, pick:[0,1,-1,-1,-1], ver:['over','over','undo',_], hot:[2], called:5, ret:[5,4], lift:{ j:2, b:2 },
      line:'buckets[2] -= nums[2];', res:'#4 false → 拿回 3 → [4,3,0,0]',
      text:'<strong>回到 #3 · 拿回</strong> · #4 回傳 false → <code>buckets[2] -= 3</code> → <code>[4,3,0,0]</code>。#3 的迴圈繼續:i = 3。' },
    { k:'dup', run:3, pick:[0,1,-1,-1,-1], ver:['over','over','undo','dup'], hot:[3], called:5, ret:[5,4,3],
      line:'if (i > 0 && buckets[i] == buckets[i-1]) continue;', res:'i = 3:b3 = b2 = 0 → continue · #3 false',
      text:'<strong>#3 · i = 3 同高跳過</strong> · <code>0 + 3 ≤ 4</code> 放得下,但 <code>b3 = 0 == b2 = 0</code>:把 3 放進 b3 和剛才放進 b2 是<b>同一種形狀</b>,b2 已經證明失敗 → <code>continue</code>。#3 <code>return false</code>。' },
    { k:'undo', run:2, pick:[0,-1,-1,-1,-1], ver:['over','undo',_,_], hot:[1], called:5, ret:[5,4,3], lift:{ j:1, b:1 },
      line:'buckets[1] -= nums[1];', res:'#3 false → 拿回 3 → [4,0,0,0]',
      text:'<strong>回到 #2 · 拿回</strong> · #3 回傳 false → <code>buckets[1] -= 3</code> → <code>[4,0,0,0]</code>。#2 的迴圈繼續:i = 2、3。' },
    { k:'dup', run:2, pick:[0,-1,-1,-1,-1], ver:['over','undo','dup','dup'], hot:[2,3], called:5, ret:[5,4,3,2],
      line:'if (i > 0 && buckets[i] == buckets[i-1]) continue;', res:'i = 2、3:0 = 0 → continue ×2 · #2 false',
      text:'<strong>#2 · i = 2、3 同高跳過</strong> · <code>b2 == b1 == 0</code>、<code>b3 == b2 == 0</code>:三個空桶互相對稱,b1 試過失敗,b2、b3 不用再試 → 兩次 <code>continue</code>,#2 <code>return false</code>。' },
    { k:'undo', run:1, pick:[-1,-1,-1,-1,-1], ver:['undo',_,_,_], hot:[0], called:5, ret:[5,4,3,2], lift:{ j:0, b:0 },
      line:'buckets[0] -= nums[0];', res:'#2 false → 拿回 4 → [0,0,0,0]',
      text:'<strong>回到 #1 · 拿回</strong> · #2 回傳 false → <code>buckets[0] -= 4</code> → <code>[0,0,0,0]</code>。#1 的迴圈繼續:i = 1、2、3。' },
    { k:'dup', run:1, pick:[-1,-1,-1,-1,-1], ver:['undo','dup','dup','dup'], hot:[1,2,3], called:5, ret:[5,4,3,2,1],
      line:'if (i > 0 && buckets[i] == buckets[i-1]) continue;', res:'i = 1、2、3:0 = 0 → continue ×3 · #1 false',
      text:'<strong>#1 · i = 1、2、3 同高跳過</strong> · 四個桶全是 0,把 4 放進 b1 / b2 / b3 和放進 b0 是同一個正方形轉個方向 → 三次 <code>continue</code>,#1 <code>return false</code>。' },
    { k:'fin', run:0, pick:[-1,-1,-1,-1,-1], ver:['undo','dup','dup','dup'], hot:[], called:5, ret:[5,4,3,2,1],
      line:'return false;   // makesquare([3,3,3,3,4])', res:'false · 5 次 exist',
      text:'<strong>完成 · false · 5 次 exist · 同高去重剪掉了空桶的對稱分支</strong> · 4 一放進 b0 就滿了,剩下四根 3 只能各佔一邊,最後一根沒地方去。沒有去重的話,#1 / #2 還會把同一件事在 b1、b2、b3 各重做一次。' },
  ];

  function mount(prefix, steps) {
    const canvas = document.getElementById(prefix + '-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const stepEl = document.getElementById(prefix + '-step'), labelEl = document.getElementById(prefix + '-label');
    const bPrev = document.getElementById(prefix + '-prev'), bNext = document.getElementById(prefix + '-next'),
          bPlay = document.getElementById(prefix + '-play'), bReset = document.getElementById(prefix + '-reset');
    let step = 0, timer = null;

    function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
      const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||340; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
      if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
    function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
    function box(x,y,w,h,fill,stroke,lw,dash){ rr(x,y,w,h,5); ctx.fillStyle=fill; ctx.fill(); ctx.lineWidth=lw||1.4; if(dash) ctx.setLineDash(dash); ctx.strokeStyle=stroke; ctx.stroke(); ctx.setLineDash([]); }
    function rect(x,y,w,h,fill,stroke,lw,dash){ ctx.fillStyle=fill; ctx.fillRect(x,y,w,h); ctx.lineWidth=lw||1.4; if(dash) ctx.setLineDash(dash); ctx.strokeStyle=stroke; ctx.strokeRect(x,y,w,h); ctx.setLineDash([]); }
    function txt(s,x,y,color,font,align,base){ ctx.fillStyle=color; ctx.font=font; ctx.textAlign=align||'center'; ctx.textBaseline=base||'middle'; ctx.fillText(s,x,y); }
    function head(s,x,y){ txt(s,x,y,C.dim,'600 12px '+MONO+', '+SANS,'left','alphabetic'); }
    function line(x1,y1,x2,y2,color,lw,dash){ ctx.strokeStyle=color; ctx.lineWidth=lw; if(dash) ctx.setLineDash(dash); ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); ctx.setLineDash([]); }
    function arrowHead(x,y,ang,col,sz){ sz=sz||7; ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(x,y);
      ctx.lineTo(x-sz*Math.cos(ang-0.45),y-sz*Math.sin(ang-0.45)); ctx.lineTo(x-sz*Math.cos(ang+0.45),y-sz*Math.sin(ang+0.45)); ctx.closePath(); ctx.fill(); }
    const F = (wt, sz) => wt + ' ' + sz + 'px ' + MONO + ', ' + SANS;
    function fitTxt(s, x, y, color, wt, sz, maxW, align){ let f = sz; ctx.font = F(wt, f);
      while (f > 9.5 && ctx.measureText(s).width > maxW) { f -= 0.5; ctx.font = F(wt, f); }
      txt(s, x, y, color, F(wt, f), align); }

    function draw(){
      fit();
      const s = steps[step], w = canvas.clientWidth, H = canvas.clientHeight, PAD = 22;
      ctx.fillStyle = C.paper; ctx.fillRect(0,0,w,H); ctx.setLineDash([]);
      const X = px => px * w / 620;
      const fin = s.k === 'fin';
      const idx = s.run - 1, val = idx >= 0 ? NUMS[idx] : 0;
      const bk = [0,0,0,0]; s.pick.forEach((b, j) => { if (b >= 0) bk[b] += NUMS[j]; });
      const hot = new Set(s.hot);
      const BK = '[' + bk.join(',') + ']';

      /* ---- BAND 1 · nums ---- */
      head('BAND 1 · nums 降序   紅 = 目前 idx   藍 / 米 = 已放進的桶', PAD, 16);
      const cTop = 58, cH = 40, cW = X(48), cx0 = X(72);
      txt('nums', PAD, cTop + cH/2 + 1, C.ink, '700 13px ' + MONO, 'left');
      for (let j = 0; j < N; j++) {
        const x = cx0 + j * cW, b = s.pick[j], isCur = j === idx && !fin;
        let fill = C.paper, st = C.ink, lw = 1.4, tc = C.ink;
        if (b >= 0) fill = TINT(b);
        if (isCur) { fill = C.cur; tc = C.curT; }
        rect(x, cTop, cW, cH, fill, st, lw);
        txt(String(NUMS[j]), x + cW/2, cTop + cH/2 + 1, tc, F(700, 19));
        txt('idx=' + j, x + cW/2, 38, isCur ? C.curT : C.dim, F(isCur ? 700 : 600, 11));
        if (b >= 0) txt('→ b' + b, x + cW/2, cTop + cH + 14, isCur ? C.curT : C.dim, F(700, 11));
      }
      if (!fin && idx >= 0) { const x = cx0 + idx * cW; ctx.lineWidth = 3; ctx.strokeStyle = C.curS; ctx.strokeRect(x + 1.5, cTop + 1.5, cW - 3, cH - 3); }
      // 右側:total / target / 呼叫數
      { const rx = cx0 + N * cW + Math.max(20, X(22)), rw = w - PAD - rx, g = 10, w1 = (rw - g) * 0.58, w2 = rw - g - w1;
        box(rx, cTop, w1, cH, C.paper, C.ink, 1.4);
        fitTxt('total 16 · %4 = 0', rx + w1/2, cTop + 12, C.dim, 600, 11, w1 - 12);
        fitTxt('target = 16 / 4 = 4', rx + w1/2, cTop + 28, C.ink, 700, 12.5, w1 - 12);
        const done = fin;
        box(rx + w1 + g, cTop, w2, cH, done ? C.bad : C.paper, done ? C.deep : C.ink, done ? 1.8 : 1.4);
        fitTxt('exist 呼叫', rx + w1 + g + w2/2, cTop + 12, done ? C.deep : C.dim, 600, 11, w2 - 10);
        fitTxt(s.called + ' / ' + CALLS + (done ? ' · false' : ''), rx + w1 + g + w2/2, cTop + 28, done ? C.deep : C.ink, 700, 12.5, w2 - 10); }

      /* ---- BAND 2 · 四個桶 ---- */
      const b2 = 134;
      head('BAND 2 · 4 個桶(每個桶 = 正方形一邊)   虛線 = target 4', PAD, b2);
      const U = 24, base = 332, tY = base - TARGET * U;
      const colW = X(52), gap = X(36), col0 = X(80);
      const cxL = i => col0 + i * (colW + gap), cxC = i => cxL(i) + colW/2;
      const yOf = h => base - h * U;
      // 左側刻度
      txt('target', PAD, tY - 9, C.dim, F(600, 10.5), 'left');
      txt('= 4', PAD, tY + 9, C.ink, F(700, 11), 'left');
      txt('0', cxL(0) - 8, base, C.dim, F(600, 10.5), 'right');
      // 虛線以上的空間:沒有鬼影時寫提示
      if (s.k !== 'over') {
        const hx = cxL(0), hw = cxL(3) + colW - hx, hy = b2 + 36;
        box(hx, hy - 12, hw, 24, C.paper, C.off, 1.1, [3,3]);
        fitTxt(fin ? '每根 3 都只能獨佔一邊 → 第 5 根沒地方放' : '虛線以上 = 超過邊長 4 · 放不下的火柴會頂到這裡',
               hx + hw/2, hy + 1, C.dim, 600, 11, hw - 16);
      }
      // 桶的容器(高 = target)
      for (let i = 0; i < 4; i++) rect(cxL(i), tY, colW, TARGET * U, C.paper, C.ink, 1.4);
      // 已放的火柴段
      for (let i = 0; i < 4; i++) {
        let h = 0;
        s.pick.forEach((b, j) => { if (b !== i) return;
          const v = NUMS[j], y = yOf(h + v), isNew = s.k === 'place' && hot.has(i) && j === idx;
          rect(cxL(i) + 4, y + 2, colW - 8, v * U - 4, isNew ? C.cur : TINT(i), isNew ? C.curS : C.ink, isNew ? 2.4 : 1.2);
          txt(String(v), cxC(i), y + v * U / 2 - 6, isNew ? C.curT : C.ink, F(700, 16));
          txt('idx' + j, cxC(i), y + v * U / 2 + 12, isNew ? C.curT : C.dim, F(600, 10));
          h += v; });
      }
      // target 虛線
      line(cxL(0) - 6, tY, cxL(3) + colW + 6, tY, C.ink, 1.6, [6,4]);
      // 放不下的鬼影
      if (s.k === 'over') s.hot.forEach(i => {
        const y = yOf(bk[i] + val), hh = val * U;
        rect(cxL(i) + 4, y + 2, colW - 8, hh - 4, C.bad, C.curS, 2.2, [5,3]);
        // 超出 target 的那段加深
        ctx.fillStyle = 'rgba(207,53,53,0.18)'; ctx.fillRect(cxL(i) + 5, y + 3, colW - 10, tY - y - 3);
        txt(String(val), cxC(i), y + hh/2 + 1, C.curT, F(700, 15));
        fitTxt(bk[i] + '+' + val + '=' + (bk[i] + val), cxC(i), y - 10, C.deep, 700, 11.5, colW + gap - 6);
      });
      // 同高跳過:左右兩桶之間的灰弧
      if (s.k === 'dup') s.hot.forEach(i => {
        const y = yOf(bk[i]) - 10, x1 = cxC(i - 1), x2 = cxC(i), pk = y - 26;
        ctx.strokeStyle = C.dim; ctx.lineWidth = 1.8; ctx.setLineDash([4,3]);
        ctx.beginPath(); ctx.moveTo(x1, y); ctx.quadraticCurveTo((x1 + x2)/2, pk - 8, x2, y); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = C.dim; ctx.beginPath(); ctx.arc(x1, y, 3, 0, 7); ctx.arc(x2, y, 3, 0, 7); ctx.fill();
        const lab = bk[i-1] + ' = ' + bk[i];
        ctx.font = F(700, 11); const tw = ctx.measureText(lab).width + 10;
        box((x1 + x2)/2 - tw/2, pk - 18, tw, 18, C.gray, C.off, 1);
        txt(lab, (x1 + x2)/2, pk - 8, C.ink, F(700, 11));
      });
      // 拿回:深紅虛線段往上提
      if (s.k === 'undo' && s.lift) {
        const i = s.lift.b, v = NUMS[s.lift.j], lift = 18, y = yOf(bk[i] + v) - lift;
        rect(cxL(i) + 4, y + 2, colW - 8, v * U - 4, C.bad, C.deep, 2, [5,3]);
        txt(String(v), cxC(i), y + v * U / 2 - 6, C.deep, F(700, 16));
        txt('idx' + s.lift.j, cxC(i), y + v * U / 2 + 12, C.deep, F(600, 10));
        const ay1 = y - 4, ay2 = y - 26;
        line(cxC(i), ay1, cxC(i), ay2, C.deep, 2.2); arrowHead(cxC(i), ay2 - 2, -Math.PI/2, C.deep, 8);
        txt('−' + v, cxC(i) + 8, ay2 + 6, C.deep, F(700, 12), 'left');
      }
      // 桶名 + 判定
      const VER = { over:['放不下', C.bad, C.deep, C.deep, null], dup:['同高跳過', C.gray, C.dim, C.dim, [4,3]],
                    place:['放入', C.good, C.ink, C.ink, null], undo:['拿回', C.bad, C.deep, C.deep, [5,3]] };
      for (let i = 0; i < 4; i++) {
        txt('b' + i + ' = ' + bk[i], cxC(i), base + 13, C.ink, F(700, 11.5));
        const v = s.ver[i], vy = base + 26, vh = 24, ht = hot.has(i) && !fin;
        if (!v) { box(cxL(i), vy, colW, vh, C.paper, C.off, 1.1, [3,3]); txt('—', cxC(i), vy + vh/2 + 1, C.off, F(600, 11)); continue; }
        const o = VER[v];
        box(cxL(i), vy, colW, vh, o[1], ht ? C.curS : o[2], ht ? 2.4 : 1.3, ht ? null : o[4]);
        fitTxt(o[0], cxC(i), vy + vh/2 + 1, o[3], 700, 11, colW - 6);
      }
      // 右側面板
      { const rx = X(414), rw = w - PAD - rx;
        let py = 146;
        if (fin) {
          box(rx, py, rw, 40, C.bad, C.deep, 1.8);
          fitTxt('makesquare → false', rx + rw/2, py + 13, C.deep, 700, 12.5, rw - 12);
          fitTxt('5 次 exist 全部 false', rx + rw/2, py + 29, C.deep, 700, 11, rw - 12);
        } else {
          box(rx, py, rw, 40, C.cur, C.curS, 2);
          fitTxt('#' + s.run + ' exist(idx = ' + idx + ')', rx + rw/2, py + 13, C.curT, 700, 12.5, rw - 12);
          fitTxt('nums[' + idx + '] = ' + val + ' 要放進哪個桶', rx + rw/2, py + 29, C.curT, 700, 11, rw - 12);
        }
        py += 54;
        fitTxt('buckets = ' + BK, rx, py, C.ink, 700, 12.5, rw, 'left');
        py += 14;
        let e1 = '', e2 = '', ef = C.paper, es = C.off, ec = C.dim, ed = [3,3];
        const hs = s.hot;
        if (s.k === 'init') { e1 = 'buckets 全是 0'; e2 = 'i = 0..3 依序試'; }
        else if (s.k === 'place') { const i = hs[0]; e1 = bk[i] - val + '+' + val + '=' + bk[i] + ' ≤ 4 放得下';
          e2 = i === 0 ? 'i = 0 不比左邊 → 放入' : 'b' + i + '=' + (bk[i] - val) + ' ≠ b' + (i-1) + '=' + bk[i-1] + ' → 放入';
          ef = C.good; es = C.curS; ec = C.ink; ed = null; }
        else if (s.k === 'over') { e1 = (hs.length === 1 ? bk[hs[0]] + '+' + val + '=' + (bk[hs[0]] + val) : hs.map(i => (bk[i] + val)).join(' / ')) + ' > 4 放不下';
          e2 = hs.length === 4 ? '四個都 continue → false' : (hs.length > 1 ? 'continue ×' + hs.length : 'continue 換下一桶');
          ef = C.bad; es = C.deep; ec = C.deep; ed = null; }
        else if (s.k === 'undo') { e1 = '#' + (s.run + 1) + ' 回傳 false'; e2 = '拿回 b' + s.lift.b + ' 的 ' + NUMS[s.lift.j] + ' → b' + s.lift.b + ' = ' + bk[s.lift.b];
          ef = C.bad; es = C.deep; ec = C.deep; ed = [5,3]; }
        else if (s.k === 'dup') { e1 = '同高 0 = 0 → 跳過'; e2 = hs.map(i => 'b' + i).join(' ') + ' 和左邊對稱';
          ef = C.gray; es = C.dim; ec = C.ink; ed = [4,3]; }
        else if (fin) { e1 = '同高去重剪掉了'; e2 = '空桶的對稱分支'; ef = C.good; es = C.ink; ec = C.ink; ed = null; }
        box(rx, py, rw, 48, ef, es, 1.8, ed);
        fitTxt(e1, rx + rw/2, py + 15, ec, 700, 12, rw - 12);
        fitTxt(e2, rx + rw/2, py + 33, ec, 700, 11, rw - 12);
        // 圖例
        py += 62;
        const L = [ [C.cur, C.curS, C.curT, null, '紅 = 正在試'], [C.bad, C.curS, C.deep, [5,3], '紅虛 = 放不下'],
                    [C.gray, C.dim, C.dim, [4,3], '灰弧 = 同高'], [C.bad, C.deep, C.deep, [5,3], '深紅 = 拿回'] ];
        const g = 8, iw = (rw - g) / 2, ih = 22;
        L.forEach((o, k) => { const x = rx + (k % 2) * (iw + g), y = py + Math.floor(k / 2) * (ih + 8);
          box(x, y, iw, ih, o[0], o[1], 1.3, o[3]); fitTxt(o[4], x + iw/2, y + ih/2 + 1, o[2], 700, 10.5, iw - 8); });
      }

      /* ---- BAND 3 · call stack ---- */
      const b3 = 404;
      head('BAND 3 · call stack   #k = 第 k 次 exist   紅 = 正在跑   粉 = 已 return false', PAD, b3);
      { const y = b3 + 12, h = 40, g = 12, bw = (w - 2*PAD - 4*g) / 5, ret = new Set(s.ret);
        for (let k = 1; k <= CALLS; k++) {
          const x = PAD + (k - 1) * (bw + g), j = k - 1;
          if (k > 1) { const ax = x - g; line(ax + 2, y + h/2, x - 3, y + h/2, k <= s.called ? C.ink : C.off, 1.3); arrowHead(x - 2, y + h/2, 0, k <= s.called ? C.ink : C.off, 6); }
          const t1 = '#' + k + ' idx=' + j + ' (' + NUMS[j] + ')';
          if (k > s.called) { box(x, y, bw, h, C.paper, C.off, 1.1, [3,3]); fitTxt(t1, x + bw/2, y + 13, C.off, 700, 11.5, bw - 8); fitTxt('還沒呼叫', x + bw/2, y + 29, C.off, 600, 10.5, bw - 8); continue; }
          let fill = C.up, st = C.ink, lw = 1.4, tc = C.ink, t2 = '', dash = null;
          const justRet = ret.has(k) && !fin && (k === s.run || k === s.run + 1 && s.k === 'undo');
          if (ret.has(k)) { fill = C.bad; st = C.deep; tc = C.deep; t2 = 'return false'; if (justRet) lw = 2.4; }
          else if (k === s.run) { fill = C.cur; st = C.curS; lw = 2.6; tc = C.curT; t2 = '正在跑 i 迴圈'; }
          else if (k < s.run) { t2 = '放在 b' + s.pick[j] + ',等 #' + (k + 1); }
          else { fill = C.cur; st = C.curS; dash = [5,3]; lw = 2; tc = C.curT; t2 = '剛呼叫'; }
          box(x, y, bw, h, fill, st, lw, dash);
          fitTxt(t1, x + bw/2, y + 13, tc, 700, 11.5, bw - 8);
          fitTxt(t2, x + bw/2, y + 29, tc === C.ink ? C.dim : tc, 600, 10.5, bw - 8);
        } }

      /* ---- BAND 4 · 這一步 ---- */
      const b4 = 482;
      head('BAND 4 · 這一步(哪一行跑了)', PAD, b4);
      { const by = b4 + 12, bh = 32, inner = w - 2*PAD, w1 = Math.round(inner * 0.52), w2 = inner - w1 - 10;
        let f2 = C.paper, s2 = C.off, d2 = [3,3], c2 = C.dim, l2 = 1.4;
        if (s.k === 'place') { f2 = C.cur; s2 = C.curS; c2 = C.curT; d2 = null; l2 = 2.2; }
        else if (s.k === 'over') { f2 = C.bad; s2 = C.deep; c2 = C.deep; d2 = null; l2 = 2.2; }
        else if (s.k === 'undo') { f2 = C.bad; s2 = C.deep; c2 = C.deep; d2 = [5,3]; l2 = 2; }
        else if (s.k === 'dup') { f2 = C.gray; s2 = C.dim; c2 = C.ink; d2 = [4,3]; l2 = 1.8; }
        else if (fin) { f2 = C.bad; s2 = C.deep; c2 = C.deep; d2 = null; l2 = 2; }
        box(PAD, by, w1, bh, C.paper, C.ink, 1.4);
        fitTxt(s.line, PAD + 10, by + bh/2 + 1, C.ink, 700, 11.5, w1 - 18, 'left');
        box(PAD + w1 + 10, by, w2, bh, f2, s2, l2, d2);
        fitTxt(s.res, PAD + w1 + 10 + w2/2, by + bh/2 + 1, c2, 700, 11.5, w2 - 14); }
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
  }

  mount('v473', STEPS);
})();
