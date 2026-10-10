/* ============================================================
   P17 · Letter Combinations of a Phone Number — res + c 往下傳 · viz
     void dfs(vector<string>& ans, string res, string& digits, int i) {
         if (i >= digits.size()) { ans.push_back(res); return; }
         for (char c : mp[digits[i] - '0']) dfs(ans, res + c, digits, i + 1);
     }
   digits = "23"(g++ 實跑 trace,見 facts「Trace 23」)
     #1 dfs(0,"") a → #2 dfs(1,"a") → #3 "ad" ans#1 · #4 "ae" ans#2 · #5 "af" ans#3
                  b → #6 dfs(1,"b") → #7 "bd" ans#4 · #8 "be" ans#5 · #9 "bf" ans#6
                  c → #10 dfs(1,"c") → #11 "cd" ans#7 · #12 "ce" ans#8 · #13 "cf" ans#9
     共 13 次 dfs、9 個答案。res 是傳值:res + c 是新字串,沒有 pop_back。
   BAND 1 digits(紅 = 目前 i)+ 每個數字的字母組 mp(紅 = 這一步選的字母,藍 = res 裡已選的)
   BAND 2 遞迴樹(#k = 第 k 次 dfs,節點內 = 那一層拿到的 res)
   BAND 3 ans(9 格)   BAND 4 這一步
   前綴 v17- 。一步 = 一次 dfs 呼叫(葉子:呼叫 + 收答案合成一步)。
   ============================================================ */
(function () {
  const C = { paper:'#ffffff', ink:'#1f1f1f', dim:'#5a5a5a', off:'#cfcfcf',
    up:'#e3edf5', low:'#f6ead8',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424',
    good:'#d9e8c7', bad:'#f0d4d4', deep:'#a31d1d', gray:'#ececec' };
  const MONO = '"JetBrains Mono", monospace', SANS = '"Noto Sans TC", sans-serif';
  const D = '23', MP = { '2':'abc', '3':'def' };

  /* 樹節點,id = 呼叫編號 − 1(呼叫順序就是先序) */
  const T = [];
  T.push({ par:-1, lvl:0, res:'', i:0 });
  let ansNo = 0;
  for (const a of MP['2']) {
    const pid = T.length; T.push({ par:0, lvl:1, res:a, i:1, c:a });
    for (const b of MP['3']) T.push({ par:pid, lvl:2, res:a + b, i:2, c:b, ans:++ansNo });
  }
  T.forEach((n, id) => { n.no = id + 1; });
  const LEAVES = T.filter(n => n.lvl === 2);
  LEAVES.forEach((n, k) => { n.slot = k; });
  T.filter(n => n.lvl === 1).forEach((n, k) => { n.slot = 3 * k + 1; });
  T[0].slot = 4;
  const ANS = LEAVES.map(n => n.res);
  const q = s => '"' + s + '"';

  /* 步驟:step 0 = #1 開始跑;step k(1..12)= #(k+1) 被呼叫;step 13 = 完成 */
  const STEPS = [];
  STEPS.push({ cur:0,
    text:'<strong>INITIAL · #1 dfs(i = 0, res = "")</strong> · <code>digits = "23"</code>。第 i 層負責第 i 位數字:<code>for (char c : mp[digits[i] - \'0\'])</code> 每個字母都試一次,把 <code>res + c</code> 交給下一層。i 走到 <code>digits.size()</code> 就收答案。' });
  for (let id = 1; id < T.length; id++) {
    const n = T[id], p = T[n.par];
    const first = n.c === MP[D[p.i]][0];
    let t;
    if (n.lvl === 1) {
      t = '<strong>#' + n.no + ' dfs(i = 1, res = ' + q(n.res) + ')</strong> · ' +
        (first ? '#1 的迴圈第一個字母 <code>c = \'' + n.c + '\'</code>:' : '回到 #1,它的 res <b>還是 ""</b>(子樹裡的 +d/+e/+f 都是別的字串,碰不到它)。下一個字母 <code>c = \'' + n.c + '\'</code>:') +
        '<code>res + c = ' + q(n.res) + '</code> 是一個<b>新字串</b>,傳給下一層;接著試 mp[3] = "def"。';
    } else {
      t = '<strong>#' + n.no + ' dfs(i = 2, res = ' + q(n.res) + ') → 收 ans#' + n.ans + '</strong> · ' +
        (first ? '#' + p.no + ' 的 res = ' + q(p.res) + ',<code>res + \'' + n.c + '\'</code> = ' + q(n.res) + '。'
               : '回到 #' + p.no + ',res <b>仍是 ' + q(p.res) + '</b>,不用 pop_back。<code>res + \'' + n.c + '\'</code> = ' + q(n.res) + '。') +
        '<code>i = 2 ≥ digits.size()</code> → <code>ans.push_back(' + q(n.res) + ')</code>,return。';
    }
    STEPS.push({ cur:id, text:t });
  }
  STEPS.push({ cur:-1, fin:true,
    text:'<strong>完成 · 13 次 dfs、9 個答案、沒有 pop_back:res 是傳值</strong> · 1 + 3 + 9 = 13 次呼叫;ans = [ad, ae, af, bd, be, bf, cd, ce, cf],照字典序。每個兄弟都從父層「沒被改過」的 res 出發,所以不需要還原。' });

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
    const F = (wt, sz) => wt + ' ' + sz + 'px ' + MONO + ', ' + SANS;
    function fitTxt(s, x, y, color, wt, sz, maxW, align){ let f = sz; ctx.font = F(wt, f);
      while (f > 9.5 && ctx.measureText(s).width > maxW) { f -= 0.5; ctx.font = F(wt, f); }
      txt(s, x, y, color, F(wt, f), align); }

    function draw(){
      fit();
      const s = steps[step], w = canvas.clientWidth, H = canvas.clientHeight, PAD = 22;
      ctx.fillStyle = C.paper; ctx.fillRect(0,0,w,H); ctx.setLineDash([]);
      const X = px => px * w / 620;
      const fin = !!s.fin;
      const cn = fin ? null : T[s.cur];                   // 目前這層
      const curI = cn ? cn.i : -1, curRes = cn ? cn.res : '';
      const nAns = fin ? 9 : T.slice(0, s.cur + 1).filter(n => n.ans).length;
      const isLeafStep = cn && cn.lvl === 2;

      /* ---- BAND 1 · digits + mp ---- */
      head('BAND 1 · digits = "23"   紅 = 目前的 i / 這一步選的字母   藍 = res 裡已選的', PAD, 16);
      const cTop = 52, cH = 40, cW = Math.max(46, X(48)), dx0 = PAD + 62;
      const dX = i => dx0 + i * cW;
      txt('digits', PAD, cTop + cH/2 + 1, C.ink, '700 13px ' + MONO, 'left');
      for (let i = 0; i < 2; i++) {
        const on = i === curI;
        rect(dX(i), cTop, cW, cH, on ? C.cur : (fin ? C.good : C.paper), on ? C.curS : C.ink, on ? 2.6 : 1.4);
        txt(D[i], dX(i) + cW/2, cTop + cH/2 + 1, on ? C.curT : C.ink, F(700, 20));
      }
      { const atEnd = curI === 2;   // i = size 的虛格
        box(dX(2) + 6, cTop + 4, cW - 6, cH - 8, atEnd ? C.cur : C.paper, atEnd ? C.curS : C.off, atEnd ? 2.4 : 1.1, [3,3]);
        txt('end', dX(2) + 3 + cW/2, cTop + cH/2 + 1, atEnd ? C.curT : C.off, F(700, 11)); }
      for (let i = 0; i <= 2; i++) {
        const on = i === curI;
        txt(i === 2 ? 'i=2=size' : 'i=' + i, (i === 2 ? dX(2) + 3 : dX(i)) + cW/2, 36,
            on ? C.curT : (i === 2 ? C.dim : C.dim), F(on ? 700 : 600, i === 2 ? 10 : 12));
      }
      // 右:mp 字母組
      const gx0 = dX(3) + Math.max(22, X(28)), gGap = Math.max(18, X(26));
      const lW = Math.min(X(44), (w - PAD - gx0 - gGap) / 6), gW = 3 * lW;
      for (let g = 0; g < 2; g++) {
        const gx = gx0 + g * (gW + gGap), dg = D[g], letters = MP[dg];
        const loopHere = cn && cn.lvl >= 1 && g === cn.i - 1;   // 這一步的字母從這組選出
        fitTxt('mp[' + dg + '] · i=' + g + ' 的迴圈', gx, 36, loopHere ? C.curT : C.dim, loopHere ? 700 : 600, 12, gW, 'left');
        for (let k = 0; k < 3; k++) {
          const ch = letters[k], x = gx + k * lW;
          let fill = C.paper, st = C.ink, lw = 1.4, tc = C.ink;
          if (cn && g < curRes.length && curRes[g] === ch) {
            if (g === curRes.length - 1) { fill = C.cur; st = C.curS; lw = 2.6; tc = C.curT; }
            else { fill = C.up; }
          }
          rect(x, cTop, lW, cH, fill, st, lw);
          txt(ch, x + lW/2, cTop + cH/2 + 1, tc, F(700, 17));
        }
      }
      // 下列:res 狀態
      const my = cTop + cH + 18;
      if (fin) fitTxt('3 個字母 × 3 個字母 = 9 個組合 · 1 + 3 + 9 = 13 次 dfs', PAD, my, C.ink, 700, 12, w - 2*PAD, 'left');
      else if (s.cur === 0) fitTxt('#1 · i = 0 · res = ""   接下來 res + \'a\' / \'b\' / \'c\'', PAD, my, C.curT, 700, 12, w - 2*PAD, 'left');
      else {
        const p = T[cn.par];
        fitTxt('父層 #' + p.no + ' res = ' + q(p.res) + '(不變)   +  \'' + cn.c + '\'   →   子層 #' + cn.no + ' 拿到新字串 res = ' + q(cn.res),
          PAD, my, C.curT, 700, 12, w - 2*PAD, 'left');
      }

      /* ---- BAND 2 · 遞迴樹 ---- */
      const b2 = 142;
      head('BAND 2 · 遞迴樹   #k = 第 k 次 dfs   框內 = 那層的 res   邊上 = 加的字母', PAD, b2);
      const TOP = [156, 230, 304], NH = 40;
      const slotW = (w - 2*PAD) / 9;
      const tx = n => PAD + slotW * (n.slot + 0.5);
      const NW = n => n.lvl === 2 ? Math.min(slotW - 10, 60) : Math.min(84, slotW * 1.5);
      const top = n => TOP[n.lvl], bot = n => TOP[n.lvl] + NH;
      const vis = id => fin || id <= s.cur;
      const onPath = new Set(); if (cn) for (let v = s.cur; v >= 0; v = T[v].par) onPath.add(v);
      // 根左右:提示
      { const r = T[0], rL = tx(r) - NW(r)/2, rR = tx(r) + NW(r)/2;
        const hw = rL - 14 - PAD;
        box(PAD, TOP[0], hw, NH, C.low, C.off, 1.1, [3,3]);
        fitTxt('for c in mp[digits[i]]', PAD + hw/2, TOP[0] + 13, C.ink, 700, 11.5, hw - 14);
        fitTxt('dfs(res + c, i + 1)', PAD + hw/2, TOP[0] + 28, C.ink, 700, 11.5, hw - 14);
        const lx = rR + 14, lw = w - PAD - lx;
        box(lx, TOP[0], lw, NH, fin ? C.good : C.paper, fin ? C.ink : C.off, fin ? 1.6 : 1.1, fin ? null : [3,3]);
        if (fin) fitTxt('全部跑完 · 答案 9 / 9', lx + lw/2, TOP[0] + NH/2 + 1, C.ink, 700, 12, lw - 14);
        else {
          fitTxt('正在跑:#' + cn.no + ' dfs(i = ' + cn.i + ', res = ' + q(cn.res) + ')', lx + lw/2, TOP[0] + 13, C.curT, 700, 11.5, lw - 14);
          fitTxt('dfs ' + cn.no + ' / 13   ·   ans ' + nAns + ' / 9', lx + lw/2, TOP[0] + 28, C.dim, 700, 11, lw - 14);
        } }
      // 邊
      T.forEach((n, id) => {
        if (n.par < 0) return;
        const p = T[n.par];
        let col = C.ink, lw = 1.3, dash = null;
        if (!vis(id)) { col = C.off; lw = 1.1; dash = [3,4]; }
        else if (onPath.has(id)) { col = C.curS; lw = 2.6; }
        line(tx(p), bot(p), tx(n), top(n), col, lw, dash);
      });
      // 邊標籤 +c
      T.forEach((n, id) => {
        if (n.par < 0) return;
        const p = T[n.par], t = n.lvl === 1 ? 0.5 : 0.48;
        const mx = tx(p) + (tx(n) - tx(p)) * t, my2 = bot(p) + (top(n) - bot(p)) * t;
        const v = vis(id), op = onPath.has(id), lw = 26, lh = 16;
        if (!v) { box(mx - lw/2, my2 - lh/2, lw, lh, C.paper, C.off, 1, [2,2]); txt('+' + n.c, mx, my2 + 1, C.off, F(600, 10.5)); return; }
        box(mx - lw/2, my2 - lh/2, lw, lh, op ? C.cur : C.paper, op ? C.curS : C.ink, op ? 1.6 : 1);
        txt('+' + n.c, mx, my2 + 1, op ? C.curT : C.ink, F(700, 10.5));
      });
      // 節點
      T.forEach((n, id) => {
        const x = tx(n), y = top(n), nw = NW(n);
        if (!vis(id)) {
          box(x - nw/2, y, nw, NH, C.paper, C.off, 1.1, [3,3]);
          txt('#' + n.no, x, y + 12, C.off, F(600, 10));
          txt(q(n.res), x, y + 28, C.off, F(600, 12.5));
          return;
        }
        const cu = id === s.cur && !fin, collected = !!n.ans;
        let fill = collected ? C.good : C.paper, st = C.ink, lw = 1.4, tc = C.ink, sc = C.dim;
        if (onPath.has(id)) { st = C.curS; lw = 2.2; }
        if (cu) { lw = 2.8; st = C.curS; if (!collected) { fill = C.cur; tc = C.curT; sc = C.curT; } }
        box(x - nw/2, y, nw, NH, fill, st, lw);
        txt(n.lvl === 2 ? '#' + n.no : '#' + n.no + ' i=' + n.i, x, y + 12, sc, F(700, 10));
        fitTxt(q(n.res), x, y + 28, tc, 700, 13.5, nw - 6);
        if (collected) txt('ans#' + n.ans, x, y + NH + 11, cu ? C.curT : C.ink, F(700, 10.5));
      });

      /* ---- BAND 3 · ans ---- */
      const b3 = 392;
      head('BAND 3 · ans(push_back 的順序)   綠 = 已收   紅框 = 這一步收的', PAD, b3);
      const ay = b3 + 12, ah = 40, ax0 = PAD + 40, ag = 6, aw = (w - PAD - ax0 - 8 * ag) / 9;
      txt('ans', PAD, ay + ah/2 + 1, C.ink, '700 13px ' + MONO, 'left');
      for (let j = 0; j < 9; j++) {
        const x = ax0 + j * (aw + ag), got = j < nAns, now = isLeafStep && j === cn.ans - 1;
        if (got) {
          box(x, ay, aw, ah, C.good, now ? C.curS : C.ink, now ? 2.6 : 1.4);
          txt('#' + (j + 1), x + aw/2, ay + 11, now ? C.curT : C.dim, F(600, 10));
          txt(q(ANS[j]), x + aw/2, ay + 28, C.ink, F(700, 13));
        } else {
          box(x, ay, aw, ah, C.paper, C.off, 1.1, [3,3]);
          txt('#' + (j + 1), x + aw/2, ay + 11, C.off, F(600, 10));
          txt('—', x + aw/2, ay + 28, C.off, F(600, 13));
        }
      }

      /* ---- BAND 4 · 這一步 ---- */
      const b4 = 470;
      head('BAND 4 · 這一步', PAD, b4);
      const by = b4 + 12, bh = 32;
      let ln, f2 = C.paper, s2 = C.ink, l2 = 1.4;
      if (fin) { ln = '13 次 dfs、9 個答案、沒有 pop_back:res 是傳值'; f2 = C.good; l2 = 1.8; }
      else if (s.cur === 0) ln = 'dfs(ans, "", digits, 0)  →  #1 · i = 0 < 2 → for c in "abc"';
      else {
        const p = T[cn.par];
        ln = 'dfs(i=' + p.i + ', res=' + q(p.res) + ') → res + \'' + cn.c + '\' = ' + q(cn.res) +
          (cn.lvl === 2 ? '  →  i=2 ≥ size → ans.push_back(' + q(cn.res) + ')' : '  →  #' + cn.no + ' for c in "def"');
        if (cn.lvl === 2) { f2 = C.good; s2 = C.curS; l2 = 2.2; } else { f2 = C.cur; s2 = C.curS; l2 = 2.2; }
      }
      box(PAD, by, w - 2*PAD, bh, f2, s2, l2);
      fitTxt(ln, PAD + 14, by + bh/2 + 1, (cn && cn.lvl === 1) ? C.curT : C.ink, 700, 12.5, w - 2*PAD - 28, 'left');
    }

    function update(){ if(stepEl) stepEl.textContent=String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0'); if(labelEl) labelEl.innerHTML=steps[step].text; draw(); }
    function next(){ if(step<steps.length-1){step++;update();}else stop(); }
    function prev(){ if(step>0){step--;update();} }
    function reset(){ stop(); step=0; update(); }
    function play(){ if(timer){stop();return;} bPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){stop();return;} next(); },2000); }
    function stop(){ if(timer){clearInterval(timer);timer=null;} if(bPlay) bPlay.textContent='Play'; }
    bPrev&&bPrev.addEventListener('click',prev); bNext&&bNext.addEventListener('click',next); bPlay&&bPlay.addEventListener('click',play); bReset&&bReset.addEventListener('click',reset);
    window.addEventListener('resize',()=>{fit();draw();}); if(window.ResizeObserver){ new ResizeObserver(()=>{fit();draw();}).observe(canvas); }
    if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw); fit(); update();
  }

  mount('v17', STEPS);
})();
