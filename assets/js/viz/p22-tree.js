/* ============================================================
   P22 · Generate Parentheses — 遞迴樹 · viz(一個動畫)
     void dfs(vector<string>& ans, string res, int open, int close, int n) {
         if (res.size() == 2 * n) { ans.push_back(res); return; }
         if (open < n)     dfs(ans, res + '(', open + 1, close, n);
         if (close < open) dfs(ans, res + ')', open, close + 1, n);
     }
   n = 3(g++ 實跑 trace)→ 22 次呼叫、5 個答案(Catalan C3 = 5),沒有死路
   res 傳值 → 每次呼叫拿到自己的字串,return 時不用 pop
   BAND 1 遞迴樹(第 k 層 = res 長度 k)
   BAND 2 這次呼叫:res / open / close + 兩個 guard
   BAND 3 ans(5 格)
   前綴 v22- 。
   ============================================================ */
(function () {
  const C = { paper:'#ffffff', ink:'#1f1f1f', dim:'#5a5a5a', off:'#cfcfcf',
    up:'#e3edf5', low:'#f6ead8',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424',
    good:'#d9e8c7', bad:'#f0d4d4' };
  const MONO = '"JetBrains Mono", monospace', SANS = '"Noto Sans TC", sans-serif';
  const N = 3;

  /* ---- 實跑 trace(DFS 順序,call#1..#22) ---- */
  const RAW = ['', '(', '((', '(((', '((()', '((())', '((()))', '(()', '(()(', '(()()', '(()())',
    '(())', '(())(', '(())()', '()', '()(', '()((', '()(()', '()(())', '()()', '()()(', '()()()'];
  const T = RAW.map((s, i) => {
    const open = [...s].filter(c => c === '(').length, close = s.length - open;
    return { id: i + 1, s, open, close, lvl: s.length, leaf: s.length === 2 * N,
             canL: open < N, canR: close < open, par: -1, kids: [], ans: -1 };
  });
  T.forEach((n, i) => { if (i) { n.par = RAW.indexOf(n.s.slice(0, -1)); T[n.par].kids.push(i); } });
  let ansK = 0; T.forEach(n => { if (n.leaf) n.ans = ansK++; });
  const ANS = T.filter(n => n.leaf).map(n => n.s);

  const q = s => '"' + s + '"';
  const cq = s => '<code>' + q(s) + '</code>';

  /* ---- 每一步的說明 ---- */
  const LBL = ['<strong>INITIAL</strong> · <code>n = 3</code>。每一次 <code>dfs</code> 呼叫 = 樹上一個節點,第 k 層 = <code>res</code> 長度 k。兩個 guard:<b><code>open &lt; n</code> 才能放 \'(\'</b>,<b><code>close &lt; open</code> 才能放 \')\'</b>。淡灰 = 還沒走到的節點(整棵樹先畫出來)。'];
  T.forEach((n, i) => {
    let t = '<strong>call#' + n.id + '</strong> · ';
    const prev = i ? T[i - 1] : null;
    if (n.id === 8) t += '回到 ' + cq('((') + ' 那層,它的 res 還是 ' + cq('((') + ' —— <b>傳值,不用 pop</b>;換走 \')\' 支 → ';
    else if (prev && n.par !== i - 1) t += '退回 ' + cq(T[n.par].s) + ' 走 \')\' 支 → ';
    if (n.leaf) {
      t += '<code>res = ' + q(n.s) + '</code> · 長度 6 = 2n → <b>收進 ans #' + (n.ans + 1) + ' ' + cq(n.s) + '</b>,return。';
      if (n.ans === 4) t += '22 次呼叫、5 個答案,全部收齊。';
    } else {
      t += '<code>res = ' + q(n.s) + '</code> · ';
      t += 'open ' + n.open + (n.canL ? ' &lt; 3 可放 \'(\'' : ' = 3 不能再放 \'(\'') + ';';
      t += 'close ' + n.close + (n.canR ? ' &lt; ' + n.open + ' 可放 \')\'' : ' = ' + n.open + ' 不能放 \')\'');
      t += ' → ' + (n.canL && n.canR ? '<b>兩支都走</b>' : n.canL ? '<b>只走 \'(\'</b>' : '<b>只走 \')\'</b>') + '。';
    }
    LBL.push(t);
  });

  const canvas = document.getElementById('v22-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('v22-step'), labelEl = document.getElementById('v22-label');
  const bPrev = document.getElementById('v22-prev'), bNext = document.getElementById('v22-next'),
        bPlay = document.getElementById('v22-play'), bReset = document.getElementById('v22-reset');
  const LAST = T.length;
  let step = 0, timer = null;

  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||540; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function box(x,y,w,h,fill,stroke,lw,dash){ rr(x,y,w,h,5); ctx.fillStyle=fill; ctx.fill(); ctx.lineWidth=lw||1.4; if(dash) ctx.setLineDash(dash); ctx.strokeStyle=stroke; ctx.stroke(); ctx.setLineDash([]); }
  function txt(s,x,y,color,font,align,base){ ctx.fillStyle=color; ctx.font=font; ctx.textAlign=align||'center'; ctx.textBaseline=base||'middle'; ctx.fillText(s,x,y); }
  function head(s,x,y){ txt(s,x,y,C.dim,'600 12px '+MONO+', '+SANS,'left','alphabetic'); }
  function line(x1,y1,x2,y2,color,lw,dash){ ctx.strokeStyle=color; ctx.lineWidth=lw; if(dash) ctx.setLineDash(dash); ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); ctx.setLineDash([]); }

  /* 幾何(以 620px 設計;更寬時橫向攤開) */
  const PAD = 22, NW = 62, NH = 24, TY0 = 32, PITCH = 54;

  function draw(){
    fit();
    const w = canvas.clientWidth, H = canvas.clientHeight, inner = w - 2*PAD;
    ctx.fillStyle = C.paper; ctx.fillRect(0,0,w,H); ctx.setLineDash([]);
    const cur = step - 1;                       // 目前節點 index(-1 = intro)
    const seen = i => i <= cur;
    const onPath = new Set(); for (let k = cur; k >= 0; k = T[k].par) onPath.add(k);

    /* 座標:5 個葉子平均分佈,內部節點 = 葉子 x 的平均 */
    const colGap = (inner - 24 - NW) / 4, x0 = PAD + 12 + NW/2;
    T.forEach(n => { if (n.leaf) n.x = x0 + n.ans * colGap; });
    for (let lv = 2*N - 1; lv >= 0; lv--) T.forEach(n => { if (n.lvl === lv) {
      const leaves = []; (function g(k){ if (T[k].leaf) leaves.push(T[k].x); else T[k].kids.forEach(g); })(T.indexOf(n));
      n.x = leaves.reduce((a,b)=>a+b,0) / leaves.length; } });
    T.forEach(n => { n.y = TY0 + n.lvl * PITCH; });

    /* ---- BAND 1 · 遞迴樹 ---- */
    head('BAND 1 · 遞迴樹(第 k 層 = res 長度 k)  紅 = 這次呼叫  綠 = 已收進 ans', PAD, 18);
    // edges
    T.forEach((n, i) => { if (n.par < 0) return;
      const p = T[n.par], red = onPath.has(i), vis = seen(i);
      const x1 = p.x, y1 = p.y + NH, x2 = n.x, y2 = n.y;
      line(x1, y1, x2, y2, red ? C.curS : (vis ? C.ink : C.off), red ? 2.4 : (vis ? 1.4 : 1.1), vis ? null : [3,3]);
      const ch = n.s[n.s.length - 1], mx = (x1 + x2)/2, my = (y1 + y2)/2;
      const ex = x2 - x1, ey = y2 - y1, L = Math.hypot(ex, ey) || 1;
      let nx, ny;                                   // 法向量:朝外上方,讓標籤離開線
      if (Math.abs(ex) < 1) { nx = ch === '(' ? -1 : 1; ny = 0; }
      else if (ex < 0) { nx = -ey / L; ny = ex / L; } else { nx = ey / L; ny = -ex / L; }
      txt(ch, mx + nx*10, my + ny*10, red ? C.curT : (vis ? C.ink : C.off), '700 13px '+MONO);
    });
    // nodes
    T.forEach((n, i) => {
      const bx = n.x - NW/2, by = n.y, isCur = i === cur, vis = seen(i);
      const got = n.leaf && vis && !isCur;
      if (isCur) box(bx, by, NW, NH, C.cur, C.curS, 2.4);
      else if (got) box(bx, by, NW, NH, C.good, C.ink, 1.4);
      else if (vis) box(bx, by, NW, NH, C.paper, C.ink, 1.4);
      else box(bx, by, NW, NH, C.paper, C.off, 1.1, [3,3]);
      txt(n.s === '' ? '""' : n.s, n.x, by + NH/2 + 1, isCur ? C.curT : (vis ? C.ink : C.off), '700 12.5px '+MONO);
      txt('#' + n.id, bx + NW + 5, by + NH/2 + 1, isCur ? C.curT : (vis ? C.dim : C.off), '600 10px '+MONO, 'left');
    });

    /* ---- BAND 2 · 這次呼叫 ---- */
    const b2 = TY0 + 6*PITCH + NH + 30;           // header baseline
    const n = cur >= 0 ? T[cur] : null;
    head('BAND 2 · 這次呼叫的參數(res 傳值:每次呼叫自己一份)  n = 3', PAD, b2);
    const r1 = b2 + 12, rh = 30, gap = 12;
    const resW = Math.round(inner * 0.44), ocW = (inner - resW - 2*gap) / 2;
    const live = !!n;
    box(PAD, r1, resW, rh, live ? C.cur : C.paper, live ? C.curS : C.off, live ? 2 : 1.2, live ? null : [3,3]);
    txt('res = ' + (n ? q(n.s) : '—'), PAD + 12, r1 + rh/2 + 1, live ? C.curT : C.off, '700 13px '+MONO, 'left');
    if (n) txt('call#' + n.id + ' · 長度 ' + n.lvl, PAD + resW - 10, r1 + rh/2 + 1, C.curT, '600 11px '+MONO+', '+SANS, 'right');
    [['open', n && n.open], ['close', n && n.close]].forEach((v, k) => {
      const bx = PAD + resW + gap + k*(ocW + gap);
      box(bx, r1, ocW, rh, live ? C.up : C.paper, live ? C.ink : C.off, 1.4, live ? null : [3,3]);
      txt(v[0] + ' = ' + (n ? v[1] : '—'), bx + ocW/2, r1 + rh/2 + 1, live ? C.ink : C.off, '700 13px '+MONO);
    });
    const r2 = r1 + rh + gap, gw = (inner - gap) / 2;
    if (n && n.leaf) {
      box(PAD, r2, inner, rh, C.cur, C.curS, 2.2);
      txt('res.size() == 2n(6 == 6)→ 到底 · 收答案 ans #' + (n.ans + 1) + ' · return', PAD + inner/2, r2 + rh/2 + 1, C.curT, '700 12.5px '+SANS+', '+MONO);
    } else {
      const G = [
        ['open < n', n ? n.open + ' < 3' : '', n && n.canL, "走 '('"],
        ['close < open', n ? n.close + ' < ' + n.open : '', n && n.canR, "走 ')'"],
      ];
      G.forEach((g, k) => {
        const bx = PAD + k*(gw + gap);
        if (!n) { box(bx, r2, gw, rh, C.paper, C.off, 1.1, [3,3]);
          txt(g[0] + '  →  ?', bx + gw/2, r2 + rh/2 + 1, C.off, '700 12.5px '+MONO); return; }
        box(bx, r2, gw, rh, g[2] ? C.good : C.bad, C.ink, 1.4);
        txt(g[0] + '(' + g[1] + ')', bx + 12, r2 + rh/2 + 1, C.ink, '700 12px '+MONO, 'left');
        txt(g[2] ? '● ' + g[3] : '× 不走', bx + gw - 12, r2 + rh/2 + 1, g[2] ? C.ink : C.dim, '700 12.5px '+SANS+', '+MONO, 'right');
      });
    }

    /* ---- BAND 3 · ans ---- */
    const b3 = r2 + rh + 30;
    const got = cur < 0 ? 0 : T.slice(0, cur + 1).filter(m => m.leaf).length;
    head('BAND 3 · ans  (' + got + ' / 5)  紅 = 這一步收進來', PAD, b3);
    const ay = b3 + 12, ah = 38, ag = 12, aw = (inner - 4*ag) / 5;
    for (let k = 0; k < 5; k++) {
      const ax = PAD + k*(aw + ag), has = k < got, isNew = has && n && n.leaf && n.ans === k;
      if (!has) { box(ax, ay, aw, ah, C.paper, C.off, 1, [3,3]); txt('#' + (k+1), ax + aw/2, ay + ah/2 + 1, C.off, '600 11px '+MONO); continue; }
      box(ax, ay, aw, ah, isNew ? C.cur : C.good, isNew ? C.curS : C.ink, isNew ? 2.4 : 1.3);
      txt(q(ANS[k]), ax + aw/2, ay + 13, isNew ? C.curT : C.ink, '700 12.5px '+MONO);
      txt('#' + (k+1), ax + aw/2, ay + 28, isNew ? C.curT : C.dim, '600 10px '+MONO);
    }
  }

  function update(){ if(stepEl) stepEl.textContent=String(step).padStart(2,'0')+' / '+String(LAST).padStart(2,'0'); if(labelEl) labelEl.innerHTML=LBL[step]; draw(); }
  function next(){ if(step<LAST){step++;update();}else stop(); }
  function prev(){ if(step>0){step--;update();} }
  function reset(){ stop(); step=0; update(); }
  function play(){ if(timer){stop();return;} if(step>=LAST){step=0;update();} bPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=LAST){stop();return;} next(); },1800); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} if(bPlay) bPlay.textContent='Play'; }
  bPrev&&bPrev.addEventListener('click',prev); bNext&&bNext.addEventListener('click',next); bPlay&&bPlay.addEventListener('click',play); bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();}); if(window.ResizeObserver){ new ResizeObserver(()=>{fit();draw();}).observe(canvas); }
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw); fit(); update();
})();
