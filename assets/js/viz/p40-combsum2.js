/* ============================================================
   P40 · Combination Sum II — 回溯 + 同層去重 + break · viz(一個動畫)
     if (res == target) { ans.push_back(path); return; }
     for (int i = s; i < nums.size(); i++) {
         if (i > s && nums[i] == nums[i-1]) continue;   // 同層重複 → skip
         if (res + nums[i] > target) break;
         path.push_back(nums[i]);
         dfs(nums, ans, path, res + nums[i], target, i + 1);
         path.pop_back();
     }
   candidates = [2,5,2,1,2] → 排序 [1,2,2,2,5],target = 5 → [[1,2,2],[5]]
     (g++ 實跑 trace,見 FACTS_40)7 次呼叫、6 個 index 被 skip(4 組)、4 次 break
   三個 2 用下標區分:2₁ 2₂ 2₃ = index 1,2,3
   BAND 1 遞迴樹(節點 = path · sum · s;深紅 ✕ = break;灰虛線 = 同層 skip)
   BAND 2 candidates + 這層迴圈 i = s..4(skip / break / 不用試)
   BAND 3 ans / BAND 4 這一步
   前綴 v40- 。
   ============================================================ */
(function () {
  const C = { paper:'#ffffff', ink:'#1f1f1f', dim:'#5a5a5a', off:'#cfcfcf',
    up:'#e3edf5', low:'#f6ead8',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424',
    good:'#d9e8c7', bad:'#f0d4d4', deep:'#a31d1d', gray:'#ececec' };
  const MONO = '"JetBrains Mono", monospace', SANS = '"Noto Sans TC", sans-serif';
  const CAND = [1, 2, 2, 2, 5], N = 5, TARGET = 5;
  const NAME = ['1', '2₁', '2₂', '2₃', '5'];

  /* 樹的項目,依 trace 順序(= 動畫事件順序)。
     k:'call' 呼叫 / 'skip' 同層重複(可多個 i 合成一步)/ 'brk' break
     par:所在迴圈的那個呼叫;lvl:層;px:620px 設計寬度下的中心 x;via:從父迴圈的哪個 i 長出來 */
  const T = [
    { k:'call', path:[],      sum:0, s:0, par:-1, lvl:0, px:320 },
    { k:'call', path:[1],     sum:1, s:1, par:0,  lvl:1, px:120, via:0 },
    { k:'call', path:[1,2],   sum:3, s:2, par:1,  lvl:2, px:52,  via:1 },
    { k:'call', path:[1,2,2], sum:5, s:3, par:2,  lvl:3, px:52,  via:2, ans:true },
    { k:'skip', is:[3],   par:2, lvl:3, px:142 },
    { k:'brk',  i:4,      par:2, lvl:3, px:232 },
    { k:'skip', is:[2,3], par:1, lvl:2, px:142 },
    { k:'brk',  i:4,      par:1, lvl:2, px:232 },
    { k:'call', path:[2],     sum:2, s:2, par:0,  lvl:1, px:330, via:1 },
    { k:'call', path:[2,2],   sum:4, s:3, par:8,  lvl:2, px:340, via:2 },
    { k:'brk',  i:3,      par:9, lvl:3, px:340 },
    { k:'skip', is:[3],   par:8, lvl:2, px:432 },
    { k:'brk',  i:4,      par:8, lvl:2, px:524 },
    { k:'skip', is:[2,3], par:0, lvl:1, px:440 },
    { k:'call', path:[5],     sum:5, s:5, par:0,  lvl:1, px:545, via:4, ans:true },
  ];
  T.forEach(n => {
    if (n.k === 'brk') { const p = T[n.par]; n.base = p.sum; n.tot = p.sum + CAND[n.i]; n.rest = []; for (let j = n.i + 1; j < N; j++) n.rest.push(j); }
  });
  const DEEPER = 3;                                    // [1,2] → [1,2,2]:2₂ 在更深一層,允許
  const pathStr = p => '[' + p.join(',') + ']';
  const CALLS = T.filter(n => n.k === 'call').length;
  const SKIPS = T.filter(n => n.k === 'skip').reduce((a, n) => a + n.is.length, 0);
  const BRKS = T.filter(n => n.k === 'brk').length;

  const LABELS = [
    '<strong>call #1 · [] · sum 0 · s = 0</strong> · <code>0 ≠ 5</code>,進迴圈 <code>i = 0..4</code>。',
    '<strong>call #2 · [1] · sum 1 · s = 1</strong> · 根的 <code>i = 0</code>:<code>0 + 1 = 1 ≤ 5</code>,push 1,<code>dfs(..., i + 1)</code> → 每個數只能用一次,孩子從 index 1 開始。',
    '<strong>call #3 · [1,2] · sum 3 · s = 2</strong> · [1] 的 <code>i = 1</code>(2₁):<code>i == s</code>,不用比前一個;<code>1 + 2 = 3 ≤ 5</code>。',
    '<strong>call #4 · [1,2,2] · sum 5 ✓</strong> · [1,2] 的 <code>i = 2</code>(2₂):值和 2₁ 一樣,但 <code>i == s = 2</code> → <b>不同層:可以</b>。2₁ 是上一層拿的,2₂ 是這一層迴圈的第一個。<code>3 + 2 = 5</code> → <b>ans 收下 [1,2,2]</b>,return。',
    '<strong>skip · 在 [1,2]</strong> · <code>i = 3</code>(2₃):<code>3 &gt; s = 2</code> 且 <code>c[3] == c[2]</code> → <b>continue</b>。這一層已經用 2₂ 開過頭,再用 2₃ 只會長出一模一樣的 [1,2,2]。',
    '<strong>break · 在 [1,2]</strong> · <code>i = 4</code>:<code>3 + 5 = 8 &gt; 5</code> → break。[1,2] 的迴圈結束,回到 [1]。',
    '<strong>skip · 在 [1]</strong> · <code>i = 2, 3</code>(2₂、2₃):都是 <code>i &gt; s = 1</code> 且和前一個相等 → continue。[1] 這層已經用 2₁ 試過「下一個是 2」→ <b>[1,2] 只出現一次</b>。',
    '<strong>break · 在 [1]</strong> · <code>i = 4</code>:<code>1 + 5 = 6 &gt; 5</code> → break。以 1 開頭的找完,回到根。',
    '<strong>call #5 · [2] · sum 2 · s = 2</strong> · 根的 <code>i = 1</code>(2₁):<code>i &gt; s</code>,但 <code>c[1] = 2 ≠ c[0] = 1</code> → 不是重複;<code>0 + 2 = 2 ≤ 5</code>。',
    '<strong>call #6 · [2,2] · sum 4 · s = 3</strong> · [2] 的 <code>i = 2</code>(2₂):<code>i == s</code> → 又是<b>不同層</b>,可以拿;<code>2 + 2 = 4 ≤ 5</code>。',
    '<strong>break · 在 [2,2]</strong> · <code>i = 3</code>(2₃,<code>i == s</code> 不算重複):<code>4 + 2 = 6 &gt; 5</code> → break,5 不用試。',
    '<strong>skip · 在 [2]</strong> · <code>i = 3</code>(2₃):<code>3 &gt; s = 2</code> 且 <code>c[3] == c[2]</code> → continue。不擋的話會再長一次 [2,2]。',
    '<strong>break · 在 [2]</strong> · <code>i = 4</code>:<code>2 + 5 = 7 &gt; 5</code> → break。回到根。',
    '<strong>skip · 在根</strong> · <code>i = 2, 3</code>(2₂、2₃):<code>i &gt; s = 0</code> 且和前一個相等 → continue。「第一個數是 2」已經由 2₁ 整棵試完,再開一次只會重複 [2,…]。',
    '<strong>call #7 · [5] · sum 5 ✓</strong> · 根的 <code>i = 4</code>:<code>5 ≠ c[3] = 2</code>,<code>0 + 5 = 5</code> → <b>ans 收下 [5]</b>。根的迴圈跑完,整棵樹結束。',
  ];

  /* vis:已發生幾個事件(含目前);cur:目前事件(-1 = 沒有) */
  const STEPS = [{ vis:0, cur:-1, text:'<strong>INITIAL</strong> · <code>candidates = [2,5,2,1,2]</code> 排序 → <code>[1,2,2,2,5]</code>,<code>target = 5</code>。三個 2 用下標分開:2₁ 2₂ 2₃(= index 1,2,3)。每個數最多用一次 → 遞迴傳 <code>i + 1</code>。去重這一行 <code>if (i &gt; s &amp;&amp; c[i] == c[i−1]) continue;</code> <b>只擋「同一層」的重複</b>,更深一層可以再拿。' }];
  T.forEach((n, e) => STEPS.push({ vis:e + 1, cur:e, text:LABELS[e] }));
  STEPS.push({ vis:T.length, cur:-1, text:'<strong>完成 · ans = [[1,2,2],[5]]</strong> · 7 次呼叫、6 個 index 被 skip、4 次 break。<b>同層</b>:同一個迴圈裡,相同的值只讓第一個開頭(後面的 2 只會長出一樣的子樹);<b>不同層</b>:[1] → [1,2₁] → [1,2₁,2₂] 一路往下拿,允許。寫成 <code>i &gt; 0</code> 就會連不同層也擋掉,[1,2,2] 會消失。' });

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
    function txt(s,x,y,color,font,align,base){ ctx.fillStyle=color; ctx.font=font; ctx.textAlign=align||'center'; ctx.textBaseline=base||'middle'; ctx.fillText(s,x,y); }
    function head(s,x,y){ txt(s,x,y,C.dim,'600 12px '+MONO+', '+SANS,'left','alphabetic'); }
    function line(x1,y1,x2,y2,color,lw,dash){ ctx.strokeStyle=color; ctx.lineWidth=lw; if(dash) ctx.setLineDash(dash); ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); ctx.setLineDash([]); }

    function draw(){
      fit();
      const s = steps[step], w = canvas.clientWidth, H = canvas.clientHeight, PAD = 22, inner = w - 2*PAD;
      ctx.fillStyle = C.paper; ctx.fillRect(0,0,w,H); ctx.setLineDash([]);
      const final = s.cur < 0 && s.vis === T.length;
      const ev = s.cur >= 0 ? T[s.cur] : null;
      const callId = ev ? (ev.k === 'call' ? s.cur : ev.par) : -1;   // 目前在跑的那一層 dfs
      const onPath = new Set(); for (let v = callId; v >= 0; v = T[v].par) onPath.add(v);
      const done = T.slice(0, s.vis);
      const nCalls = done.filter(n => n.k === 'call').length, nBrk = done.filter(n => n.k === 'brk').length;
      const nSkip = done.filter(n => n.k === 'skip').reduce((a, n) => a + n.is.length, 0);
      const nAns = done.filter(n => n.ans).length;

      /* ---- BAND 1 · 遞迴樹 ---- */
      head('BAND 1 · 遞迴樹   紅 = 目前   綠 ✓ = 答案   深紅 ✕ = break   灰虛線 = 同層 skip', PAD, 16);
      const L = 14, X = px => L + (px - L) * (w - 2*L) / (620 - 2*L);
      const TOP = [30, 106, 182, 258], NW = 72, NH = 38, SW = 78, SH = 36, TL = 0.55;
      const cx = n => X(n.px), top = n => TOP[n.lvl];
      const bot = n => top(n) + (n.k === 'call' ? NH : SH);
      const seen = id => id < s.vis;
      // 邊
      T.forEach((n, id) => {
        if (n.par < 0) return;
        const p = T[n.par], sn = seen(id);
        let col = sn ? C.ink : C.off, lw = 1.4, dash = sn ? null : [4,4];
        if (n.k === 'brk' && sn) { col = C.deep; dash = [4,3]; lw = id === s.cur ? 2.2 : 1.4; }
        else if (n.k === 'skip') { col = sn ? C.dim : C.off; dash = [2,4]; lw = id === s.cur ? 2 : 1.2; }
        else if (onPath.has(id)) { col = C.curS; lw = 2.6; }
        line(cx(p), bot(p), cx(n), top(n), col, lw, dash);
      });
      // 邊標籤 +c(skip 沒有標籤:它根本沒走下去)
      T.forEach((n, id) => {
        if (n.par < 0 || n.k === 'skip') return;
        const p = T[n.par];
        const mx = cx(p) + (cx(n) - cx(p)) * TL, my = bot(p) + (top(n) - bot(p)) * TL;
        const idx = n.k === 'brk' ? n.i : n.via;
        const lab = '+' + NAME[idx], lw = 28, lh = 14, sn = seen(id);
        let fill = C.paper, st = sn ? C.ink : C.off, tc = sn ? C.ink : C.off, bw = 1, dash = sn ? null : [2,2];
        if (n.k === 'brk' && sn) { st = C.deep; tc = C.deep; if (id === s.cur) { fill = C.bad; bw = 1.6; } }
        else if (onPath.has(id)) { fill = C.cur; st = C.curS; tc = C.curT; bw = 1.6; }
        box(mx - lw/2, my - lh/2, lw, lh, fill, st, bw, dash);
        txt(lab, mx, my + 1, tc, '700 10.5px '+MONO+', '+SANS);
      });
      // 節點 / break 小格 / skip 鬼影
      T.forEach((n, id) => {
        const x = cx(n), y = top(n), sn = seen(id), isCur = id === s.cur;
        if (n.k === 'brk') {
          let fill = C.paper, st = C.off, tc = C.off, nc = C.off, lw = 1.1, dash = [3,3];
          if (sn) { st = C.deep; tc = C.deep; nc = C.dim; lw = 1.4; dash = null; }
          if (isCur) { fill = C.bad; lw = 2.4; nc = C.deep; }
          box(x - SW/2, y, SW, SH, fill, st, lw, dash);
          txt('✕ ' + n.base + '+' + CAND[n.i] + '=' + n.tot + '>' + TARGET, x, y + 12, tc, '700 9.5px '+MONO+', '+SANS);
          txt('break', x, y + 26, nc, '600 10px '+MONO+', '+SANS);
          return;
        }
        if (n.k === 'skip') {
          let fill = C.paper, st = C.off, tc = C.off, nc = C.off, lw = 1.1, dash = [3,3];
          if (sn) { st = C.dim; tc = C.dim; nc = C.dim; lw = 1.3; }
          if (isCur) { fill = C.gray; tc = C.ink; nc = C.ink; lw = 2.2; dash = [5,3]; }
          box(x - SW/2, y, SW, SH, fill, st, lw, dash);
          txt('skip ' + n.is.map(i => NAME[i]).join(' '), x, y + 12, tc, '700 10px '+MONO+', '+SANS);
          txt('同層 重複', x, y + 26, nc, '600 10px '+MONO+', '+SANS);
          return;
        }
        let fill = C.paper, st = C.off, tc = C.off, lw = 1.1, dash = [3,3], sc = C.off;
        if (sn) { fill = n.ans ? C.good : C.up; st = C.ink; tc = C.ink; sc = C.dim; lw = 1.4; dash = null; }
        if (onPath.has(id) && !isCur) { st = C.curS; lw = 2.2; }
        if (isCur) { fill = n.ans ? C.good : C.cur; st = C.curS; tc = n.ans ? C.ink : C.curT; sc = n.ans ? C.ink : C.curT; lw = 2.6; }
        box(x - NW/2, y, NW, NH, fill, st, lw, dash);
        txt(pathStr(n.path) + (n.ans && sn ? ' ✓' : ''), x, y + 13, tc, (n.ans && sn ? '700 11px ' : '700 11.5px ')+MONO+', '+SANS);
        txt('sum ' + n.sum + ' s=' + n.s, x, y + 28, sc, '600 10px '+MONO);
      });
      // [1,2,2] 下方:不同層:可以
      {
        const n = T[DEEPER], sn = seen(DEEPER), isCur = DEEPER === s.cur;
        const px0 = cx(n) - NW/2, py = top(n) + NH + 12, pw = 128, ph = 20;
        if (sn) {
          box(px0, py, pw, ph, isCur ? C.cur : C.paper, C.curS, isCur ? 2 : 1.2);
          txt('2₁→2₂ 不同層:可以', px0 + pw/2, py + ph/2 + 1, C.curT, '700 11px '+MONO+', '+SANS);
        } else {
          box(px0, py, pw, ph, C.paper, C.off, 1, [3,3]);
          txt('2₁→2₂ ?', px0 + pw/2, py + ph/2 + 1, C.off, '700 11px '+MONO+', '+SANS);
        }
      }
      // 右下空位:計數
      const nx = X(398), nw = w - L - nx, ny = TOP[3], nh = NH;
      box(nx, ny, nw, nh, final ? C.good : C.paper, final ? C.ink : C.off, 1.4, final ? null : [3,3]);
      const ncol = final ? C.ink : C.dim;
      txt('呼叫 ' + nCalls + ' / ' + CALLS + ' · 答案 ' + nAns + ' / 2', nx + nw/2, ny + 12, ncol, '700 11px '+MONO+', '+SANS);
      txt('skip ' + nSkip + ' / ' + SKIPS + ' · break ' + nBrk + ' / ' + BRKS, nx + nw/2, ny + 27, ncol, '700 11px '+MONO+', '+SANS);

      /* ---- BAND 2 · candidates ---- */
      const b2 = 352;
      head('BAND 2 · 排序後 candidates   紅 = 這層迴圈 i = s..4   灰 = skip   深紅 = break', PAD, b2);
      const cy0 = b2 + 14, ch0 = 30, cw0 = 64, cg0 = 10, ty = cy0 + ch0 + 19;
      const Lp = callId >= 0 ? T[callId] : null;
      // 這層迴圈到目前為止,每個 i 的狀態
      const st = {};
      if (ev && ev.k !== 'call') {
        T.forEach((m, id) => {
          if (id > s.cur || m.par !== callId) return;
          if (m.k === 'call') st[m.via] = 'took';
          else if (m.k === 'skip') m.is.forEach(i => st[i] = id === s.cur ? 'skipNow' : 'skip');
          else { st[m.i] = 'brk'; m.rest.forEach(i => st[i] = 'rest'); }
        });
      }
      for (let i = 0; i < N; i++) {
        const x = PAD + i*(cw0 + cg0);
        let fill = C.paper, sk = C.ink, tc = C.ink, ic = C.dim, lw = 1.4, dash = null, strike = false, tag = '', tgc = C.dim;
        const grey = () => { sk = C.off; tc = C.off; ic = C.off; dash = [3,3]; lw = 1.1; };
        if (ev && ev.k === 'call') {
          if (ev.ans || i < ev.s) grey();
          else { fill = C.cur; sk = C.curS; tc = C.curT; ic = C.curT; lw = 2.4; if (i === ev.s) { tag = '↑ i 從 s 開始'; tgc = C.curT; } }
        } else if (ev) {
          const k = st[i];
          if (i < Lp.s) grey();
          else if (k === 'took') { fill = C.up; tag = '試過'; }
          else if (k === 'skip' || k === 'skipNow') {
            fill = C.gray; sk = C.dim; tc = C.dim; ic = C.dim; dash = [4,3]; lw = k === 'skipNow' ? 2.2 : 1.3;
            tag = 'skip'; tgc = k === 'skipNow' ? C.ink : C.dim;
          }
          else if (k === 'brk') { fill = C.bad; sk = C.deep; tc = C.deep; ic = C.deep; lw = 2.4; tag = 'break'; tgc = C.deep; }
          else if (k === 'rest') { sk = C.off; tc = C.off; ic = C.off; dash = [3,3]; lw = 1.1; strike = true; tag = '不用試'; tgc = C.deep; }
        }
        box(x, cy0, cw0, ch0, fill, sk, lw, dash);
        txt('[' + i + ']', x + 8, cy0 + ch0/2 + 1, ic, '600 11px '+MONO, 'left');
        txt(NAME[i], x + cw0 - 9, cy0 + ch0/2 + 1, tc, '700 15px '+MONO+', '+SANS, 'right');
        if (strike) line(x + 6, cy0 + ch0/2, x + cw0 - 6, cy0 + ch0/2, C.deep, 1.4);
        if (tag) txt(tag, i === (ev && ev.k === 'call' ? ev.s : -1) ? x : x + cw0/2, ty, tgc, '700 11px '+MONO+', '+SANS, i === (ev && ev.k === 'call' ? ev.s : -1) ? 'left' : 'center');
      }
      const tx = PAD + N*(cw0 + cg0) + 4;
      let lt = '排序後相同的數排在一起', lc = C.dim;
      if (ev && ev.k === 'brk') { lt = ev.base + ' + ' + CAND[ev.i] + ' = ' + ev.tot + ' > 5 → break'; lc = C.deep; }
      else if (ev && ev.k === 'skip') { lt = 'i > s 且 c[i] == c[i−1]'; lc = C.ink; }
      else if (ev && ev.ans) { lt = 'sum == 5 → 收,return'; lc = C.ink; }
      else if (ev) { lt = 's = ' + ev.s + ' → for i = ' + ev.s + '..4'; lc = C.curT; }
      else if (final) { lt = '同層 skip 6 個 · break 4 次'; lc = C.ink; }
      txt(lt, tx, cy0 + ch0/2 + 1, lc, '700 12px '+MONO+', '+SANS, 'left');

      /* ---- BAND 3 · ans ---- */
      const b3 = 452;
      head('BAND 3 · ans', PAD, b3);
      const ay = b3 + 14, ah = 30;
      txt('ans =', PAD, ay + ah/2 + 1, C.ink, '700 13px '+MONO, 'left');
      const got = T.slice(0, s.vis).map((n, id) => ({ n, id })).filter(o => o.n.ans);
      let ax = PAD + 56;
      if (!got.length) {
        box(ax, ay, 150, ah, C.paper, C.off, 1.1, [3,3]);
        txt('還沒有答案', ax + 75, ay + ah/2 + 1, C.dim, '600 12px '+MONO+', '+SANS);
      }
      got.forEach(o => {
        const lab = pathStr(o.n.path) + ' ✓', bw = 86, isCur = o.id === s.cur;
        box(ax, ay, bw, ah, C.good, isCur ? C.curS : C.ink, isCur ? 2.6 : 1.4);
        txt(lab, ax + bw/2, ay + ah/2 + 1, C.ink, '700 12.5px '+MONO+', '+SANS);
        ax += bw + 12;
      });
      const at = final ? '2 組,沒有重複' : '只有 sum == 5 的節點會進 ans';
      txt(at, w - PAD, ay + ah/2 + 1, final ? C.ink : C.dim, '700 12px '+MONO+', '+SANS, 'right');

      /* ---- BAND 4 · 這一步 ---- */
      const b4 = 524;
      head('BAND 4 · 這一步   去重檢查 → sum + c[i] vs target', PAD, b4);
      const by = b4 + 12, bh = 32, w1 = Math.round(inner * 0.46), w2 = inner - w1 - 10;
      let t1 = 'dfs(path=[], sum=0, s=0) 從根開始', t2 = 'target = 5 · 每個數最多一次', f2 = C.paper, s2 = C.off, d2 = [3,3], c2 = C.dim, l2 = 1.4;
      if (ev && ev.k === 'call') {
        t1 = 'dfs(' + pathStr(ev.path) + ', sum=' + ev.sum + ', s=' + ev.s + ')';
        if (ev.par < 0) { t2 = 'sum 0 ≠ 5 → 進迴圈'; }
        else {
          const p = T[ev.par], i = ev.via;
          const chk = i === p.s ? 'i == s' : (CAND[i] === CAND[i-1] ? 'i > s, 同值' : 'i > s, ≠ 前');
          t2 = chk + ' · ' + p.sum + ' + ' + CAND[i] + ' = ' + ev.sum + (ev.sum === TARGET ? ' ✓' : ' ≤ 5');
        }
        f2 = ev.ans ? C.good : C.cur; s2 = C.curS; d2 = null; c2 = ev.ans ? C.ink : C.curT; l2 = 2.2;
      } else if (ev && ev.k === 'skip') {
        const p = T[ev.par];
        t1 = '在 ' + pathStr(p.path) + ' 的迴圈 · s = ' + p.s;
        t2 = 'i = ' + ev.is.join(',') + ' > s · 同前一個 → continue';
        f2 = C.gray; s2 = C.dim; d2 = [5,3]; c2 = C.ink; l2 = 2;
      } else if (ev) {
        const p = T[ev.par];
        t1 = '在 ' + pathStr(p.path) + ' 的迴圈 · i = ' + ev.i + ' · c[i] = ' + CAND[ev.i];
        t2 = ev.base + ' + ' + CAND[ev.i] + ' = ' + ev.tot + ' > 5 → break';
        f2 = C.bad; s2 = C.deep; d2 = null; c2 = C.deep; l2 = 2.2;
      } else if (final) {
        t1 = '7 次呼叫 · 6 個 skip · 4 次 break';
        t2 = 'ans = [[1,2,2],[5]]'; f2 = C.good; s2 = C.ink; d2 = null; c2 = C.ink;
      }
      box(PAD, by, w1, bh, C.paper, C.ink, 1.4);
      txt(t1, PAD + 12, by + bh/2 + 1, C.ink, '700 12px '+MONO+', '+SANS, 'left');
      box(PAD + w1 + 10, by, w2, bh, f2, s2, l2, d2);
      txt(t2, PAD + w1 + 10 + w2/2, by + bh/2 + 1, c2, '700 12px '+MONO+', '+SANS);
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

  mount('v40', STEPS);
})();
