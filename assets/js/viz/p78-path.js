/* ============================================================
   P78 · Subsets — path 的 push / pop · viz(兩個動畫)
     v78a:傳值(我的版本)—— vector<int> path,每次呼叫拿到一份複本
     v78b:傳參考 —— vector<int>& path,整個遞迴只有一份
       ans.push_back(path);
       for (int i = s; i < nums.size(); i++) {
           path.push_back(nums[i]);
           dfs(nums, ans, path, i + 1);
           path.pop_back();
       }
   nums = [1,2,3](g++ 實跑 trace,見 FACTS_78)
     8 次呼叫、7 次 push、7 次 pop
     ans = [] [1] [1,2] [1,2,3] [1,3] [2] [2,3] [3]
   上一題 p1863 畫的是遞迴「樹」;這裡畫的是「呼叫堆疊」+ path 本身。
   BAND 1 正在跑哪一行 / BAND 2 呼叫堆疊(最下面 = #1)/ BAND 3 ans
   前綴 v78a- / v78b- 。
   ============================================================ */
(function () {
  const C = { paper:'#ffffff', ink:'#1f1f1f', dim:'#5a5a5a', off:'#cfcfcf',
    up:'#e3edf5', low:'#f6ead8',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424',
    good:'#d9e8c7', bad:'#f0d4d4', deep:'#a31d1d' };
  const MONO = '"JetBrains Mono", monospace', SANS = '"Noto Sans TC", sans-serif';
  const NUMS = [1, 2, 3], N = 3;

  /* ---- trace(FACTS_78):c = 呼叫 #id(s);p = 目前那層 push nums[i];r = 最上層 return + 下一層 pop ---- */
  const EV = [
    ['c',1,0], ['p',0], ['c',2,1], ['p',1], ['c',3,2], ['p',2], ['c',4,3],
    ['r'], ['r'], ['p',2], ['c',5,3], ['r'], ['r'],
    ['p',1], ['c',6,2], ['p',2], ['c',7,3], ['r'], ['r'],
    ['p',2], ['c',8,3], ['r'],
  ];
  const fmt = a => '[' + a.join(',') + ']';
  const code = a => '<code>' + fmt(a) + '</code>';

  /* 模擬 trace → 每一步的快照。byVal:每個 frame 自己一份 path;否則共用一份 */
  function build(byVal){
    const steps = [];
    let stack = [], shared = [], ans = [], pushes = 0, pops = 0;
    const snap = (ev, extra) => Object.assign({
      ev, stack: stack.map(f => ({ id:f.id, s:f.s, i:f.i, path:f.path.slice() })),
      shared: shared.slice(), ans: ans.map(a => a.slice()), pushes, pops,
      ghost: null, leave: null, fresh: false, line: null, text: '' }, extra);
    const pathOf = f => byVal ? f.path : shared;

    steps.push(snap('init', { text: byVal
      ? '<strong>INITIAL</strong> · <code>nums = [1,2,3]</code>。這版 <code>path</code> 是<b>傳值</b>(<code>vector&lt;int&gt; path</code>,沒有 <code>&amp;</code>):<b>每次呼叫都拿到一份自己的複本</b>。下面每一格 = 一個還沒 return 的呼叫,最下面是 #1。'
      : '<strong>INITIAL</strong> · 傳參考(<code>vector&lt;int&gt;&amp; path</code>):<b>整個遞迴只有一份 path</b>,每一層呼叫都指向它。所以每次 <code>push_back</code> 之後,<b>等遞迴回來一定要 <code>pop_back</code> 把它撤銷</b>。' }));

    EV.forEach(e => {
      const top = stack[stack.length - 1];
      if (e[0] === 'c') {
        const [, id, s] = e;
        const from = top ? pathOf(top).slice() : [];
        stack.push({ id, s, i: null, path: from.slice() });
        ans.push(from.slice());
        const n = ans.length, leaf = s === N;
        let t = '<strong>#' + id + ' · dfs(s=' + s + ')</strong> · ';
        if (byVal) t += id === 1 ? '從空的 <code>path = []</code> 開始。'
                                 : '把 #' + top.id + ' 的 path 複製一份 → 自己的 ' + code(from) + '(<b>複本</b>,和 #' + top.id + ' 那份互不影響)。';
        else t += id === 1 ? '共用的 <code>path = []</code>。'
                           : '<b>沒有複製</b>,#' + id + ' 直接看共用的 ' + code(from) + '。';
        t += '第一行 <code>ans.push_back(path)</code> → ans 第 ' + n + ' 個 ' + code(from) + (byVal ? '。' : '(複製的是<b>當下內容</b>)。');
        if (leaf) t += '<code>s = 3</code>:迴圈 <code>i = 3..2</code> 不跑。';
        steps.push(snap('c', { fresh: true, line: 'ans', text: t }));
      } else if (e[0] === 'p') {
        const i = e[1], v = NUMS[i], P = pathOf(top), old = P.slice();
        top.i = i; P.push(v); pushes++;
        let t = '<strong>#' + top.id + ' · i = ' + i + ' · push_back(' + v + ')</strong> · ';
        if (byVal) t += '只改 #' + top.id + ' <b>自己</b>的 path:' + code(old) + ' → ' + code(P) + '。' + (stack.length > 1 ? '下面的呼叫各有一份,不受影響。' : '');
        else t += '共用 path 尾端加 ' + v + ' → ' + code(P) + '。<b>欠一次 pop</b>(已 push ' + pushes + '、pop ' + pops + ')。';
        steps.push(snap('p', { line: 'push', text: t }));
      } else {
        const gone = stack.pop(), k = stack[stack.length - 1], P = pathOf(k), old = P.slice();
        const v = P.pop(); pops++;
        const more = k.i + 1 < N;
        let t = '<strong>#' + gone.id + ' return · #' + k.id + ' pop_back()</strong> · ';
        if (byVal) {
          t += '#' + gone.id + ' 連同它那份 path 一起消失。#' + k.id + ' 拿掉<b>自己</b> path 尾端的 ' + v + ':' + code(old) + ' → ' + code(P) + '。';
          if (gone.id === 3) t += '<b>傳值也要 pop</b>:這份 path 在 #2 的迴圈裡跨輪共用,不 pop 的話下一輪會變 <code>[1,2,3]</code> 而不是 <code>[1,3]</code>。';
          else t += more ? '下一輪 <code>i = ' + (k.i + 1) + '</code> 從 ' + code(P) + ' 加。' : '這是最後一輪,迴圈結束。';
        } else {
          t += '<b>撤銷</b> #' + k.id + ' 剛才的 <code>push_back(' + v + ')</code>:' + code(old) + ' → ' + code(P) + ',和 push 之前一模一樣。';
          if (gone.id === 3) t += '不 pop 的話 path 只會一路變長,#2 下一輪會看到 <code>[1,2,3,3]</code>。';
          else t += more ? '下一輪 <code>i = ' + (k.i + 1) + '</code>。' : '最後一輪,迴圈結束。';
        }
        steps.push(snap('r', { ghost: { id: gone.id, s: gone.s, slot: stack.length, path: byVal ? gone.path.slice() : null },
                               leave: { v, at: P.length }, line: 'pop', text: t }));
      }
    });
    stack = [];
    steps.push(snap('done', { text: byVal
      ? '<strong>完成 · 8 個子集</strong> · <code>i = 2</code> 是 #1 的最後一輪,#1 return,堆疊清空。<b>傳值:呼叫時複製一份;push / pop 只動自己那份。</b>但自己那份在迴圈裡跨輪共用,所以<b>一樣要 pop</b>;代價是每次呼叫多一次複製。'
      : '<strong>完成 · 8 個子集</strong> · 7 次 <code>push_back</code>、7 次 <code>pop_back</code> 一一配對,path 回到 <code>[]</code>。<b>pop 把 push 撤銷</b> → 每個呼叫 return 時,path 都和它被呼叫前一模一樣。' }));
    return steps;
  }
  const STEPS_A = build(true), STEPS_B = build(false);

  function mount(prefix, steps, byVal) {
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
    function txt(s,x,y,color,font,align,base){ ctx.fillStyle=color; ctx.font=font; ctx.textAlign=align||'center'; ctx.textBaseline=base||'middle'; ctx.fillText(s,x,y); }
    function head(s,x,y){ txt(s,x,y,C.dim,'600 12px '+MONO+', '+SANS,'left','alphabetic'); }
    function line(x1,y1,x2,y2,color,lw,dash){ ctx.strokeStyle=color; ctx.lineWidth=lw; if(dash) ctx.setLineDash(dash); ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); ctx.setLineDash([]); }
    function arrow(x1,y1,x2,y2,color,lw){ line(x1,y1,x2,y2,color,lw); const a=Math.atan2(y2-y1,x2-x1), L=8;
      ctx.fillStyle=color; ctx.beginPath(); ctx.moveTo(x2,y2); ctx.lineTo(x2-L*Math.cos(a-0.4),y2-L*Math.sin(a-0.4)); ctx.lineTo(x2-L*Math.cos(a+0.4),y2-L*Math.sin(a+0.4)); ctx.closePath(); ctx.fill(); }
    /* 一排 path 格子:vals 現有值;newAt 紅色新格;leave {v,at} 深紅虛線離開格;slots 總格數;faint 已消失;copy 剛複製(米色) */
    function cells(x, y, cw, chh, gap, vals, newAt, leave, slots, faint, copy){
      for (let k = 0; k < slots; k++) {
        const cx = x + k*(cw + gap);
        if (k < vals.length) {
          const isNew = k === newAt;
          box(cx, y, cw, chh, isNew ? C.cur : (faint ? C.paper : (copy ? C.low : C.up)), isNew ? C.curS : (faint ? C.off : C.ink), isNew ? 2.4 : 1.4, faint ? [3,3] : null);
          txt(String(vals[k]), cx + cw/2, y + chh/2 + 1, isNew ? C.curT : (faint ? C.off : C.ink), '700 14px '+MONO);
        } else if (leave && k === leave.at) {
          box(cx, y, cw, chh, C.bad, C.deep, 2, [4,3]);
          txt(String(leave.v), cx + cw/2, y + chh/2 - 5, C.deep, '700 13px '+MONO);
          txt('pop', cx + cw/2, y + chh/2 + 9, C.deep, '700 9.5px '+MONO);
        } else {
          box(cx, y, cw, chh, C.paper, C.off, 1, [3,3]);
        }
      }
    }

    const LINES = [['ans','ans.push_back(path)'], ['push','path.push_back(nums[i])'], ['dfs','dfs(…, i + 1)'], ['pop','path.pop_back()']];

    function draw(){
      fit();
      const s = steps[step], w = canvas.clientWidth, H = canvas.clientHeight, PAD = 22, inner = w - 2*PAD;
      ctx.fillStyle = C.paper; ctx.fillRect(0,0,w,H); ctx.setLineDash([]);

      /* ---- BAND 1 · 正在跑哪一行 ---- */
      head('BAND 1 · 正在跑哪一行   紅 = 這一步   nums = [1,2,3]', PAD, 16);
      const py = 30, ph = 30;
      let fs = 12, pf, tw;
      do { pf = '700 ' + fs + 'px ' + MONO; ctx.font = pf; tw = LINES.map(l => ctx.measureText(l[1]).width + 16); fs -= 0.5; }
      while (tw.reduce((a,b)=>a+b,0) + 3*8 > inner && fs > 8);
      const gap = (inner - tw.reduce((a,b)=>a+b,0)) / (LINES.length - 1);
      let x = PAD;
      LINES.forEach((l, k) => {
        const on = s.line === l[0], call = s.ev === 'c' && l[0] === 'dfs' && s.stack.length > 1;
        if (on) box(x, py, tw[k], ph, C.cur, C.curS, 2.4);
        else if (call) box(x, py, tw[k], ph, C.up, C.curS, 1.8);
        else box(x, py, tw[k], ph, C.paper, s.ev === 'init' || s.ev === 'done' ? C.off : C.ink, 1.2);
        txt(l[1], x + tw[k]/2, py + ph/2 + 1, on ? C.curT : C.ink, pf);
        x += tw[k] + gap;
      });

      /* ---- BAND 2 · 呼叫堆疊 ---- */
      head(byVal ? 'BAND 2 · 呼叫堆疊(最下 = #1)  每一格有自己的 path  紅框 = 正在跑'
                 : 'BAND 2 · 呼叫堆疊(最下 = #1)  只記 s、i  →  全部指向同一份 path', PAD, 86);
      const FH = 44, FG = 10, top0 = 100, slotY = d => top0 + (3 - d)*(FH + FG);
      const FW = byVal ? inner : 262;
      const depth = s.stack.length;
      const cw = 36, cg = 6, chh = 32;
      const pathX = PAD + 196;                                  // v78a:frame 內 path 格子起點
      const noteX = pathX + 3*(cw + cg) + 10;

      const idle = s.ev === 'init' || s.ev === 'done';
      if (idle) {
        /* 開始 / 結束:深度 1..3 合成一個說明框,深度 0 放 #1 的位置 */
        const fin = s.ev === 'done', my = slotY(3), mh = 3*FH + 2*FG;
        box(PAD, my, FW, mh, fin ? C.good : C.paper, fin ? C.ink : C.off, 1.4, fin ? null : [4,3]);
        const L = fin
          ? ['8 次呼叫 · 7 次 push · 7 次 pop', byVal ? '傳值:每次呼叫複製一份 path' : 'pop 把 push 撤銷', byVal ? '同一格跨輪共用 → 一樣要 pop' : 'return 時 path 都已還原']
          : ['呼叫 = 疊上一格 · return = 拿掉最上面', byVal ? '傳值:每一格有自己的 path' : '每一格都指向同一份 path', byVal ? '(呼叫時複製)' : '(沒有複製)'];
        L.forEach((t, k) => txt(t, PAD + FW/2, my + mh/2 + (k - 1)*24 + 1, k === 0 || fin ? C.ink : C.dim, '700 12.5px '+SANS+', '+MONO));
        const y0 = slotY(0);
        box(PAD, y0, FW, FH, C.paper, C.off, 1.2, [4,3]);
        txt(fin ? '#1 dfs(s=0) 已 return · 堆疊清空' : '深度 0 · #1 dfs(…, 0) 會放這裡', PAD + 12, y0 + FH/2 + 1, C.dim, '700 12px '+SANS+', '+MONO, 'left');
      }
      for (let d = 0; d < 4 && !idle; d++) {
        const f = s.stack[d], y = slotY(d);
        const isGhost = !f && s.ghost && s.ghost.slot === d;
        if (!f && !isGhost) {
          box(PAD, y, FW, FH, C.paper, C.off, 1, [3,3]);
          txt('深度 ' + d + ' · 空', PAD + 12, y + FH/2 + 1, C.off, '600 11.5px '+MONO+', '+SANS, 'left');
          continue;
        }
        if (isGhost) {
          const g = s.ghost;
          box(PAD, y, FW, FH, C.paper, C.off, 1.2, [4,3]);
          txt('#' + g.id + ' dfs(s=' + g.s + ')', PAD + 12, y + FH/2 + 1, C.off, '700 12px '+MONO, 'left');
          if (byVal) {
            cells(pathX, y + (FH - chh)/2, cw, chh, cg, g.path, -1, null, 3, true);
            txt('已 return · 這份 path 跟著消失', noteX, y + FH/2 + 1, C.dim, '700 12px '+SANS+', '+MONO, 'left');
          } else {
            txt('已 return', PAD + FW - 12, y + FH/2 + 1, C.dim, '700 12px '+SANS, 'right');
          }
          continue;
        }
        const isTop = d === depth - 1;
        box(PAD, y, FW, FH, isTop ? C.paper : '#f7f7f4', isTop ? C.curS : C.ink, isTop ? 2.4 : 1.2);
        txt('#' + f.id + ' dfs(s=' + f.s + ')', PAD + 12, y + FH/2 + 1, isTop ? C.curT : C.ink, '700 12px '+MONO, 'left');
        const iTxt = f.i === null ? (f.s === N ? 'i: 無' : 'i = –') : 'i = ' + f.i;
        const ix = PAD + 128, iw = 54;
        box(ix, y + (FH - 24)/2, iw, 24, isTop && f.i !== null && s.ev !== 'c' ? C.cur : C.paper,
            isTop && f.i !== null && s.ev !== 'c' ? C.curS : C.off, 1.2);
        txt(iTxt, ix + iw/2, y + FH/2 + 1, f.i === null ? C.dim : (isTop ? C.curT : C.ink), '700 11.5px '+MONO+', '+SANS);

        if (byVal) {
          const newAt = isTop && s.ev === 'p' ? f.path.length - 1 : -1;
          const lv = isTop && s.ev === 'r' ? s.leave : null;
          cells(pathX, y + (FH - chh)/2, cw, chh, cg, f.path, newAt, lv, 3, false, isTop && s.ev === 'c' && f.id > 1);
          let nt = '', nc = C.dim;
          if (isTop) {
            nc = C.curT;
            if (s.ev === 'c') nt = f.id === 1 ? '傳進來的 path = []' : '複本 ← 拷貝自 #' + s.stack[d-1].id;
            else if (s.ev === 'p') nt = 'push_back(' + NUMS[f.i] + ') · 只改自己';
            else if (s.ev === 'r') nt = 'pop_back() · 拿掉 ' + s.leave.v;
          } else nt = '等 #' + s.stack[d+1].id + ' return(停在 dfs)';
          if (isTop && s.ev === 'c' && f.id > 1) {
            const tw2 = 40; box(noteX, y + (FH - 22)/2, tw2, 22, C.cur, C.curS, 1.6);
            txt('複本', noteX + tw2/2, y + FH/2 + 1, C.curT, '700 12px '+SANS);
            txt('← 拷貝自 #' + s.stack[d-1].id, noteX + tw2 + 8, y + FH/2 + 1, C.curT, '700 12px '+SANS+', '+MONO, 'left');
          } else txt(nt, noteX, y + FH/2 + 1, nc, '700 12px '+SANS+', '+MONO, 'left');
        } else {
          let nt = isTop ? (s.ev === 'c' ? '剛進來' : s.ev === 'p' ? 'push' : 'pop') : '等 return';
          txt(nt, PAD + FW - 10, y + FH/2 + 1, isTop ? C.curT : C.dim, '700 11.5px '+SANS+', '+MONO, 'right');
        }
      }

      if (!byVal) {
        /* 共用 path:右側一個大框,每個 frame 一條箭頭指過去 */
        const bx = PAD + FW + 52, bw = PAD + inner - bx, bh = 86, lh = 44, by = top0 + (4*FH + 3*FG - (bh + 14 + lh)) / 2;
        const live = s.ev !== 'init' && s.ev !== 'done';
        for (let d = 0; d < s.stack.length; d++) {
          const isTop = d === s.stack.length - 1, fy = slotY(d) + FH/2;
          arrow(PAD + FW + 4, fy, bx - 4, by + bh/2 + (d - 1.5)*17, isTop ? C.curS : C.dim, isTop ? 2.2 : 1.2);
        }
        box(bx, by, bw, bh, '#f7f7f4', live ? C.ink : C.off, 1.6, live ? null : [4,3]);
        txt('path(共用,只有一份)', bx + 14, by + 18, C.ink, '700 12px '+SANS+', '+MONO, 'left');
        const ccw = 46, ccg = 8, cx0 = bx + 14, cy0 = by + 38;
        const newAt = s.ev === 'p' ? s.shared.length - 1 : -1;
        cells(cx0, cy0, ccw, 34, ccg, s.shared, newAt, s.ev === 'r' ? s.leave : null, 3, false);
        // 下方:配對帳
        const ly = by + bh + 14;
        const owe = s.pushes - s.pops;
        let l1 = 'push ' + s.pushes + ' 次 · pop ' + s.pops + ' 次', l2 = '還沒撤銷的 push = ' + owe + ' = path 長度';
        let lf = C.paper, ls = C.off, lc = C.dim, ld = [3,3];
        if (s.ev === 'r') { l2 = 'pop 把 push_back(' + s.leave.v + ') 撤銷'; lf = C.cur; ls = C.curS; lc = C.curT; ld = null; }
        else if (s.ev === 'done') { l2 = '全部配對 · path 回到 []'; lf = C.good; ls = C.ink; lc = C.ink; ld = null; }
        box(bx, ly, bw, lh, lf, ls, s.ev === 'r' ? 2 : 1.4, ld);
        txt(l1, bx + bw/2, ly + 14, lc, '700 11.5px '+MONO+', '+SANS);
        txt(l2, bx + bw/2, ly + 31, lc, '700 11.5px '+SANS+', '+MONO);
      }

      /* ---- BAND 3 · ans ---- */
      head('BAND 3 · ans(ans.push_back 複製一份進來)  紅 = 這一步新增', PAD, 334);
      const ay = 348, ah = 42, ag = 8, aw = (inner - 7*ag) / 8;
      for (let k = 0; k < 8; k++) {
        const ax = PAD + k*(aw + ag), has = k < s.ans.length, isNew = has && s.ev === 'c' && k === s.ans.length - 1;
        if (!has) { box(ax, ay, aw, ah, C.paper, C.off, 1, [3,3]); txt('#' + (k+1), ax + aw/2, ay + ah/2 + 1, C.off, '600 11px '+MONO); continue; }
        const fill = isNew ? C.cur : (s.ev === 'done' ? C.good : C.paper);
        box(ax, ay, aw, ah, fill, isNew ? C.curS : C.ink, isNew ? 2.4 : 1.3);
        txt(fmt(s.ans[k]), ax + aw/2, ay + 15, isNew ? C.curT : C.ink, '700 12px '+MONO);
        txt('#' + (k+1), ax + aw/2, ay + 31, isNew ? C.curT : C.dim, '600 10.5px '+MONO);
      }
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

  mount('v78a', STEPS_A, true);
  mount('v78b', STEPS_B, false);
})();
