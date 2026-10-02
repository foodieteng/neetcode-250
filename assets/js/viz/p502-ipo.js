/* ============================================================
   P502 · IPO — 兩個動畫共用一套畫法
     v502  正確版:k=3, w=1, profits=[5,1,3,2], capital=[0,7,2,4] → 11
     v502b 我的第一版:官方範例 1 k=2, w=0, profits=[1,2,3], capital=[0,1,1] → 回 1(正解 4)
   正確版:
     sort(idx, by capital); priority_queue<int> pq; int i = 0;
     while (k--) {
       while (i < n && capital[idx[i]] <= w) pq.push(profits[idx[i++]]);
       if (pq.empty()) break;
       w += pq.top(); pq.pop();
     }
     return w;
   動畫要傳達的一件事:capital 是門檻、不扣錢,w 只會變大 →
   門檻線(紅線 w)只往右推,左邊的專案一個個解鎖、進最大堆,每輪拿堆頂。
     BAND 1  資金數線:旗 = 各專案的門檻,紅線 = w,線左邊 = 做得起
     BAND 2  依門檻排好的專案卡 + 指標 i
     BAND 3  最大堆(利潤)+ 剩幾輪 k
     BAND 4  w 的變化 + 這一步
   數字全部來自實跑的 trace。
   ============================================================ */
(function () {
  const C = { paper:'#ffffff', ink:'#1f1f1f', dim:'#5a5a5a', off:'#cfcfcf',
    up:'#e3edf5', low:'#f6ead8',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424',
    good:'#d9e8c7', bad:'#f0d4d4', deep:'#a31d1d' };
  const MONO = '"JetBrains Mono", monospace', SANS = '"Noto Sans TC", sans-serif';
  const MS = MONO + ', ' + SANS;

  /* 每一步:w、k、i(已 push 幾個)、heap [[profit, id]](左 = top)、pn 這步 push 的 id、
     pop 這步拿走的 id、taken 已做的 id、hist w 歷史 [[值, 箭頭標籤]]、side 右側附註、
     ghost 應該在的 w(只有第一版)、miss 其實做得起卻沒做的 id、phase、act、text */

  const CORRECT = {
    P: 'v502', BUG: false, AXMAX: 12, K0: 3,
    PROF: [5, 1, 3, 2], CAP: [0, 7, 2, 4], ORD: [0, 2, 3, 1],
    steps: [
      { w:1, k:3, i:0, heap:[], pn:[], pop:null, taken:[], hist:[[1,'']], phase:'init',
        act:'idx 依門檻排好:#0(0) #2(2) #3(4) #1(7) · w = 1 · k = 3',
        text:'<strong>INITIAL</strong> · <code>k = 3, w = 1, profits = [5,1,3,2], capital = [0,7,2,4]</code>。先把 index 依<b>門檻</b>排好:<code>#0(0) #2(2) #3(4) #1(7)</code>。紅線是目前的資金 <code>w</code>,<b>線的左邊就是做得起的專案</b>。' },
      { w:1, k:3, i:1, heap:[[5,0]], pn:[0], pop:null, taken:[], hist:[[1,'']], phase:'push',
        act:'第 1 輪 · 補堆:門檻 0 ≤ w 1 → push #0(利潤 5) · 門檻 2 > 1 停',
        text:'<strong>第 1 輪 · 先補堆</strong> · 指標 <code>i</code> 往右走:<code>#0</code> 門檻 0 ≤ 1 → 利潤 5 進最大堆;<code>#2</code> 門檻 2 &gt; 1,停。' },
      { w:6, k:2, i:1, heap:[], pn:[], pop:0, taken:[0], hist:[[1,''],[6,'+5']], phase:'pop',
        act:'第 1 輪 · 拿堆頂 5 → w = 1 + 5 = 6 · k 剩 2',
        text:'<strong>第 1 輪 · 拿最大</strong> · 堆頂 5 → <code>w = 1 + 5 = 6</code>。<b>capital 不會被扣掉</b>,紅線直接往右推到 6。' },
      { w:6, k:2, i:3, heap:[[3,2],[2,3]], pn:[2,3], pop:null, taken:[0], hist:[[1,''],[6,'+5']], phase:'push',
        act:'第 2 輪 · 補堆:#2(門檻 2)、#3(門檻 4)都 ≤ 6 → 一起進堆',
        text:'<strong>第 2 輪 · 先補堆</strong> · w 變成 6 之後,<code>#2</code>(門檻 2)和 <code>#3</code>(門檻 4)<b>同時解鎖</b>,用 <code>while</code> 一次推進堆;<code>#1</code> 門檻 7 &gt; 6,停。' },
      { w:9, k:1, i:3, heap:[[2,3]], pn:[], pop:2, taken:[0,2], hist:[[1,''],[6,'+5'],[9,'+3']], phase:'pop',
        act:'第 2 輪 · 堆頂是 3(#2)→ w = 6 + 3 = 9 · k 剩 1',
        text:'<strong>第 2 輪 · 拿最大</strong> · 堆裡 3 和 2,拿 3 → <code>w = 9</code>。利潤 2 的 <code>#3</code> 留在堆裡,<b>之後還能拿</b>。' },
      { w:9, k:1, i:4, heap:[[2,3],[1,1]], pn:[1], pop:null, taken:[0,2], hist:[[1,''],[6,'+5'],[9,'+3']], phase:'push',
        act:'第 3 輪 · 補堆:#1 門檻 7 ≤ 9 → push 利潤 1 · i = n',
        text:'<strong>第 3 輪 · 先補堆</strong> · w = 9 解鎖了 <code>#1</code>(門檻 7),推進堆。<code>i = n</code>,全部專案都進過堆了。' },
      { w:11, k:0, i:4, heap:[[1,1]], pn:[], pop:3, taken:[0,2,3], hist:[[1,''],[6,'+5'],[9,'+3'],[11,'+2']], phase:'pop',
        act:'第 3 輪 · 堆頂 2(#3)→ w = 9 + 2 = 11 · k 用完',
        text:'<strong>第 3 輪 · 拿最大</strong> · 堆頂 2 → <code>w = 11</code>,<code>k</code> 用完。利潤最小的 <code>#1</code> 沒做。' },
      { w:11, k:0, i:4, heap:[[1,1]], pn:[], pop:null, taken:[0,2,3], hist:[[1,''],[6,'+5'],[9,'+3'],[11,'+2']], phase:'end',
        act:'k = 0 → 結束 · return w = 11',
        text:'<strong>完成 · return 11</strong> · 紅線 <code>1 → 6 → 9 → 11</code> <b>只往右推</b>,所以指標 <code>i</code> 不用回頭、進了堆的永遠做得起。回傳的是 <code>w</code>,不是利潤總和。' },
    ],
  };

  const BUGGY = {
    P: 'v502b', BUG: true, AXMAX: 4, K0: 2,
    PROF: [1, 2, 3], CAP: [0, 1, 1], ORD: [0, 1, 2],
    steps: [
      { w:0, k:2, i:0, heap:[], pn:[], pop:null, taken:[], hist:[[0,'']], side:'maxProfit = 0', phase:'init',
        act:'官方範例 1 · idx = [0,1,2] · w = 0 · k = 2 · maxProfit = 0',
        text:'<strong>INITIAL</strong> · 官方範例 1:<code>k = 2, w = 0, profits = [1,2,3], capital = [0,1,1]</code>,正解 <b>4</b>。我的第一版多一個 <code>maxProfit</code> 累加利潤,迴圈條件是 <code>i &lt; n &amp;&amp; k</code>。' },
      { w:0, k:2, i:1, heap:[[1,0]], pn:[0], pop:null, taken:[], hist:[[0,'']], side:'maxProfit = 0', phase:'push',
        act:'i = 0:#0 門檻 0 ≤ w 0 → push 利潤 1 · continue',
        text:'<strong>第 1 圈</strong> · <code>#0</code> 門檻 0 ≤ 0 → 推進堆,<code>i++</code>,<code>continue</code>。到這裡都沒問題。' },
      { w:0, k:1, i:1, heap:[], pn:[], pop:0, taken:[0], hist:[[0,''],[0,'+capital 0']], side:'maxProfit = 1', phase:'bug',
        act:'i = 1:門檻 1 > w 0 → pop 利潤 1 · w += capital[0] → w 還是 0 ✗①',
        text:'<strong>第 2 圈 · ✗①</strong> · <code>#1</code> 門檻 1 &gt; 0,於是 pop 堆頂:<code>maxProfit = 1</code>,但 <code>w += capital[0]</code> <b>加的是門檻 0,不是利潤 1</b> → 紅線沒動,<code>w</code> 還是 0。' },
      { w:0, k:1, i:1, heap:[], pn:[], pop:null, taken:[0], hist:[[0,''],[0,'+capital 0']], side:'return 1 ✗', ghost:1, miss:[1,2], phase:'bugend',
        act:'堆空 → return maxProfit = 1 ✗③② · 正解:w = 1,#1、#2 解鎖,再拿 3 → 4',
        text:'<strong>✗③ 提早 return,✗② 回傳錯變數</strong> · 堆空了就 <code>return maxProfit = 1</code>。虛線是 w <b>本來該在的位置 1</b>:那時 <code>#1</code>、<code>#2</code>(門檻 1)其實都做得起,應該再拿利潤 3 → <b>4</b>。' },
    ],
  };

  function mount(cfg) {
    const P = cfg.P;
    const canvas = document.getElementById(P + '-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const stepEl = document.getElementById(P + '-step'), labelEl = document.getElementById(P + '-label');
    const bPrev = document.getElementById(P + '-prev'), bNext = document.getElementById(P + '-next'),
          bPlay = document.getElementById(P + '-play'), bReset = document.getElementById(P + '-reset');
    const steps = cfg.steps, N = cfg.ORD.length;
    let step = 0, timer = null;

    function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
      const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||470; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
      if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
    function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
    function box(x,y,w,h,fill,stroke,lw,dash){ rr(x,y,w,h,5); ctx.fillStyle=fill; ctx.fill(); ctx.lineWidth=lw||1.4; if(dash) ctx.setLineDash(dash); ctx.strokeStyle=stroke; ctx.stroke(); ctx.setLineDash([]); }
    function txt(s,x,y,color,font,align,base){ ctx.fillStyle=color; ctx.font=font; ctx.textAlign=align||'center'; ctx.textBaseline=base||'middle'; ctx.fillText(s,x,y); }
    function tw(s,font){ ctx.font=font; return ctx.measureText(s).width; }
    function head(s,x,y){ txt(s,x,y,C.dim,'600 12px '+MS,'left','alphabetic'); }
    function line(x1,y1,x2,y2,color,lw,dash){ ctx.strokeStyle=color; ctx.lineWidth=lw; if(dash) ctx.setLineDash(dash); ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); ctx.setLineDash([]); }
    function arrowR(x1,x2,y,color,lw){ line(x1,y,x2,y,color,lw); ctx.fillStyle=color; ctx.beginPath(); ctx.moveTo(x2,y); ctx.lineTo(x2-7,y-4.5); ctx.lineTo(x2-7,y+4.5); ctx.closePath(); ctx.fill(); }

    /* 版面(縱向,以 620px 寬設計) */
    const B1 = 18, FT = 32, FH = 20, FT2 = FT + FH + 6, AX = 98, TK = AX + 15, WL = AX + 38;
    const B2 = 172, CT = B2 + 14, CH = 62;
    const B3 = CT + CH + 44, HT = B3 + 14, HH = 66;
    const B4 = HT + HH + 34, RT = B4 + 14, RH = 34, AT = RT + RH + 14, AH = 34;

    function cardState(s, id) {
      const pos = cfg.ORD.indexOf(id);
      if (s.taken.indexOf(id) >= 0) return s.pop === id ? 'popnow' : 'taken';
      if (s.pn.indexOf(id) >= 0) return 'new';
      if (pos < s.i) return 'heap';
      if (s.miss && s.miss.indexOf(id) >= 0) return 'miss';
      return 'locked';
    }

    function draw(){
      fit();
      const s = steps[step], W = canvas.clientWidth, H = canvas.clientHeight, PAD = 24, IW = W - 2*PAD;
      ctx.fillStyle = C.paper; ctx.fillRect(0,0,W,H); ctx.setLineDash([]);

      /* ---------- BAND 1 · 資金數線 ---------- */
      head('BAND 1 · 資金數線   旗 = 專案門檻 capital　紅線 = 目前資金 w(左邊 = 做得起)', PAD, B1);
      const x0 = PAD + 16, x1 = PAD + IW - 16, U = (x1 - x0) / cfg.AXMAX, X = v => x0 + v*U;
      // 門檻旗:同一個門檻的專案合成一面旗;太擠就換到第二列
      const byCap = {};
      cfg.ORD.forEach(id => { (byCap[cfg.CAP[id]] = byCap[cfg.CAP[id]] || []).push(id); });
      const flags = []; const lastR = [-1e9, -1e9];
      Object.keys(byCap).map(Number).sort((a, b) => a - b).forEach(cv => {
        const ids = byCap[cv], cx = X(cv);
        const lbl = ids.map(id => '#' + id).join(' ') + ' 門檻 ' + cv;
        const fw = tw(lbl, '700 11px '+MS) + 14;
        const fx = Math.max(PAD, Math.min(cx - fw/2, PAD + IW - fw));
        const row = fx >= lastR[0] + 10 ? 0 : (fx >= lastR[1] + 10 ? 1 : 0);
        lastR[row] = fx + fw;
        flags.push({ cv, ids, cx, lbl, fw, fx, row });
      });
      const FBOT = (flags.some(f => f.row === 1) ? FT2 : FT) + FH + 5;
      // 做得起的區域
      ctx.fillStyle = C.up; ctx.fillRect(x0, FBOT, X(s.w) - x0, AX - FBOT);
      // 軸
      line(x0, AX, x1, AX, C.ink, 1.6);
      for (let v = 0; v <= cfg.AXMAX; v++) {
        line(X(v), AX, X(v), AX + 5, C.ink, 1.2);
        txt(String(v), X(v), TK, v === s.w ? C.curT : C.dim, (v === s.w ? '700 12px ' : '600 11px ') + MONO);
      }
      flags.forEach(f => {
        const sts = f.ids.map(id => cardState(s, id));
        const anyNew = sts.indexOf('new') >= 0, anyMiss = sts.indexOf('miss') >= 0;
        const unlocked = f.cv <= s.w, top = f.row ? FT2 : FT;
        let fill = C.paper, st = C.off, tc = C.dim, lw = 1.2, dash = [3,3];
        if (unlocked) { st = C.ink; tc = C.ink; dash = null; }
        if (anyNew) { st = C.curS; tc = C.curT; lw = 2.2; }
        if (anyMiss) { fill = C.bad; st = C.deep; tc = C.deep; lw = 2; dash = null; }
        line(f.cx, top + FH, f.cx, AX, unlocked || anyMiss ? (anyMiss ? C.deep : C.ink) : C.off, 1.2);
        box(f.fx, top, f.fw, FH, fill, st, lw, dash);
        txt(f.lbl, f.fx + f.fw/2, top + FH/2 + 1, tc, '700 11px '+MS);
        ctx.fillStyle = unlocked ? C.ink : C.off; ctx.beginPath(); ctx.arc(f.cx, AX, 3.2, 0, 7); ctx.fill();
      });
      // 應該在的 w(虛線)
      if (s.ghost !== undefined) {
        const gx = X(s.ghost);
        line(gx, FBOT, gx, AX + 6, C.deep, 2, [5,4]);
        const gl = '應該是 w = ' + s.ghost;
        txt(gl, gx + 10, WL, C.deep, '700 12px '+MS, 'left', 'middle');
      }
      // 紅線 w
      const wx = X(s.w);
      line(wx, FBOT, wx, AX + 8, C.curS, 2.6);
      ctx.fillStyle = C.curS; ctx.beginPath(); ctx.arc(wx, AX, 4.6, 0, 7); ctx.fill();
      const prevW = step > 0 ? steps[step-1].w : s.w;
      let wl = 'w = ' + s.w;
      if (prevW !== s.w) wl += '(' + prevW + ' → ' + s.w + ',往右推)';
      else if (s.phase === 'bug') wl += '(沒動!)';
      if (s.ghost !== undefined) txt(wl, wx - 10 < PAD + 40 ? PAD : wx - 10, WL, C.curT, '700 12px '+MS, wx - 10 < PAD + 40 ? 'left' : 'right', 'middle');
      else {
        const lw2 = tw(wl, '700 12px '+MS);
        if (wx + 10 + lw2 <= PAD + IW) txt(wl, wx + 10, WL, C.curT, '700 12px '+MS, 'left', 'middle');
        else txt(wl, wx - 10, WL, C.curT, '700 12px '+MS, 'right', 'middle');
      }

      /* ---------- BAND 2 · 專案卡 ---------- */
      head('BAND 2 · 依門檻排好的專案   格內 = 門檻 / 利潤　▲ = 指標 i', PAD, B2);
      const gap = 10, cw = (IW - (N - 1)*gap) / N;
      cfg.ORD.forEach((id, k) => {
        const x = PAD + k*(cw + gap), st = cardState(s, id);
        let fill = C.paper, sc = C.off, tc = C.dim, lw = 1.2, dash = [3,3], tag = '做不起';
        if (st === 'heap') { fill = C.up; sc = C.ink; tc = C.ink; lw = 1.4; dash = null; tag = '在堆裡'; }
        if (st === 'new') { fill = C.up; sc = C.curS; tc = C.curT; lw = 2.4; dash = null; tag = '剛進堆'; }
        if (st === 'popnow') { fill = C.cur; sc = C.curS; tc = C.curT; lw = 2.6; dash = null; tag = '這輪拿走'; }
        if (st === 'taken') { fill = C.good; sc = C.ink; tc = C.ink; lw = 1.4; dash = null; tag = '已做'; }
        if (st === 'miss') { fill = C.bad; sc = C.deep; tc = C.deep; lw = 2; dash = null; tag = '其實做得起'; }
        box(x, CT, cw, CH, fill, sc, lw, dash);
        txt('#' + id, x + cw/2, CT + 14, tc, '700 13px '+MONO);
        txt('門檻 ' + cfg.CAP[id] + ' / 利潤 ' + cfg.PROF[id], x + cw/2, CT + 33, tc === C.ink ? C.ink : tc, '600 11.5px '+MS);
        txt(tag, x + cw/2, CT + 50, st === 'locked' ? C.dim : tc, '700 11px '+SANS);
      });
      if (s.i < N) {
        const px = PAD + s.i*(cw + gap) + cw/2, py = CT + CH + 5;
        ctx.fillStyle = C.curS; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - 6, py + 9); ctx.lineTo(px + 6, py + 9); ctx.closePath(); ctx.fill();
        txt('i = ' + s.i, px + 12, py + 6, C.curT, '700 12px '+MONO, 'left', 'middle');
      } else {
        txt('i = n:全部都進過堆了', PAD + IW/2, CT + CH + 14, C.dim, '600 11.5px '+SANS);
      }

      /* ---------- BAND 3 · 最大堆 + k ---------- */
      head('BAND 3 · ' + (cfg.BUG ? '最大堆 pair(利潤, id)' : '最大堆(利潤)') + '　左 = top', PAD, B3);
      const kw = 118, hw = IW - kw - 14, hx = PAD, kx = PAD + hw + 14;
      box(hx, HT, hw, HH, C.paper, C.ink, 1.4);
      const chW = 82, chH = 34, chY = HT + 10;
      if (s.heap.length === 0) {
        box(hx + 12, chY, hw - 24, chH, C.paper, C.off, 1.2, [3,3]);
        txt('空', hx + hw/2, chY + chH/2 + 1, C.dim, '600 12px '+SANS);
      } else {
        s.heap.forEach((e, k) => {
          const x = hx + 12 + k*(chW + 10), isNew = s.pn.indexOf(e[1]) >= 0;
          box(x, chY, chW, chH, C.up, isNew ? C.curS : C.ink, isNew ? 2.4 : 1.4);
          txt(e[0] + ' · #' + e[1], x + chW/2, chY + chH/2 + 1, isNew ? C.curT : C.ink, '700 13px '+MONO);
          if (k === 0) txt('top', x + chW/2, chY + chH + 11, C.dim, '600 10.5px '+MONO);
        });
      }
      let hn = '', hc = C.curT;
      if (s.pop !== null) hn = 'pop 利潤 ' + cfg.PROF[s.pop] + '(#' + s.pop + ')';
      else if (s.pn.length) hn = 'push ' + s.pn.map(id => '#' + id).join('、');
      else if (s.phase === 'bugend') { hn = '堆空 → return'; hc = C.deep; }
      if (hn) txt(hn, hx + hw - 12, chY + chH + 11, hc, '700 11.5px '+MS, 'right', 'middle');
      // k
      const kDone = s.k === 0;
      box(kx, HT, kw, HH, kDone ? C.low : C.paper, C.ink, 1.4);
      txt('剩幾輪 k', kx + kw/2, HT + 16, C.dim, '600 11.5px '+SANS);
      txt(String(s.k), kx + kw/2, HT + 42, s.k !== (step > 0 ? steps[step-1].k : s.k) ? C.curT : C.ink, '700 22px '+MONO);

      /* ---------- BAND 4 · w 的變化 + 這一步 ---------- */
      head('BAND 4 · 資金 w 的變化' + (cfg.BUG ? '(第一版還另外累加 maxProfit)' : ''), PAD, B4);
      const vw = 50;
      let x = PAD;
      s.hist.forEach((h, k) => {
        if (k > 0) {
          const lab = h[1], lw3 = Math.max(54, tw(lab, '700 11px '+MS) + 16);
          const bad = cfg.BUG && h[0] === s.hist[k-1][0];
          arrowR(x + 4, x + lw3 - 4, RT + RH/2 + 7, bad ? C.deep : C.dim, 1.6);
          txt(lab, x + lw3/2, RT + RH/2 - 6, bad ? C.deep : C.curT, '700 11px '+MS);
          x += lw3;
        }
        const last = k === s.hist.length - 1, bad = cfg.BUG && k > 0;
        let fill = C.low, sc = C.ink, tc = C.ink, lw = 1.4;
        if (last && (s.phase === 'pop')) { fill = C.cur; sc = C.curS; tc = C.curT; lw = 2.4; }
        if (last && s.phase === 'end') { fill = C.good; lw = 2.2; }
        if (bad) { fill = C.bad; sc = C.deep; tc = C.deep; lw = 2.2; }
        box(x, RT, vw, RH, fill, sc, lw);
        txt(String(h[0]), x + vw/2, RT + RH/2 + 1, tc, '700 15px '+MONO);
        x += vw;
      });
      if (s.side) {
        const sb = s.phase === 'bugend';
        txt(s.side, PAD + IW, RT + RH/2 + 1, sb ? C.deep : C.dim, '700 12.5px '+MS, 'right', 'middle');
      } else if (s.phase === 'end') {
        txt('return 11 ✓', PAD + IW, RT + RH/2 + 1, C.ink, '700 12.5px '+MS, 'right', 'middle');
      }
      let aF = C.up, aS = C.ink, aT = C.ink, aLw = 1.4, aD = null;
      if (s.phase === 'init') { aF = C.paper; aS = C.off; aT = C.dim; aD = [3,3]; aLw = 1.2; }
      else if (s.phase === 'pop') { aF = C.cur; aS = C.curS; aT = C.curT; aLw = 2; }
      else if (s.phase === 'end') { aF = C.good; aLw = 2.2; }
      else if (s.phase === 'bug' || s.phase === 'bugend') { aF = C.bad; aS = C.deep; aT = C.deep; aLw = 2.4; }
      box(PAD, AT, IW, AH, aF, aS, aLw, aD);
      let af = 12.5; while (af > 10 && tw(s.act, '700 ' + af + 'px '+MS) > IW - 20) af -= 0.5;
      txt(s.act, PAD + IW/2, AT + AH/2 + 1, aT, '700 ' + af + 'px '+MS);
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

  mount(CORRECT);
  mount(BUGGY);
})();
