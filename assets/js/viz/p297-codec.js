/* ============================================================
   P297 · Serialize and Deserialize Binary Tree · viz(兩個獨立動畫)
     serialize:   BFS,null 也入隊;pop 到 nullptr → "n ",否則 "val " 並推入左右子
     deserialize: 讀第一個 token 建根;while (ss >> word) { pop 父; 左 = word; ss >> word; 右 = word; }
   動畫要傳達的:
     ① serialize 把 null 也寫出來 → 字串唯一決定樹形;n 個節點 → 2n+1 個 token
     ② deserialize 每 pop 一個節點就一次吃兩個 token(左、右)→ 剛好配對、剛好讀完
   例 root = [1,2,3,null,null,4,5] ⇄ "1 2 3 n n 4 5 n n n n "
     vs-*  serialize   BAND 1 樹 + ∅ 殘根 / BAND 2 queue / BAND 3 output tokens / 程式碼列
     vd-*  deserialize BAND 1 input tokens / BAND 2 queue / BAND 3 建出中的樹 / 程式碼列
   trace 取自實測(FACTS.md),未手推。兩個 instance 各自的 step / timer / ResizeObserver。
   ============================================================ */
(function () {
  const C = { paper:'#ffffff', ink:'#1f3550', dim:'#9a9a9a', grid:'#cfcfcf',
    left:'#e3edf5', right:'#f6ead8', leftS:'#7f9fbd', rightS:'#c49a62',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424', deep:'#a31d1d' };
  const MONO = '"JetBrains Mono", monospace', SANS = '"Noto Sans TC", sans-serif',
        MIX = '"JetBrains Mono", "Noto Sans TC", monospace';

  /* 共用幾何 */
  const PAD = 28, TAG_W = 88, R = 18;
  const TOK = ['1','2','3','n','n','4','5','n','n','n','n'];
  /* 樹:x = 樹區寬度的比例,d = 深度 */
  const NODE = { 1:{fx:0.42,d:0}, 2:{fx:0.20,d:1}, 3:{fx:0.64,d:1}, 4:{fx:0.52,d:2}, 5:{fx:0.76,d:2} };
  const PARENT = { 2:1, 3:1, 4:3, 5:3 };
  const SIDE = { 2:'L', 3:'R', 4:'L', 5:'R' };
  /* null 殘根:[父, 方向] */
  const GHOST = { n2L:[2,-1], n2R:[2,1], n4L:[4,-1], n4R:[4,1], n5L:[5,-1], n5R:[5,1] };

  /* ---------- 單一動畫的外殼 ---------- */
  function makeViz(P, H, steps, paint){
    const canvas = document.getElementById(P + '-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const stepEl = document.getElementById(P + '-step'), labelEl = document.getElementById(P + '-label');
    const bPrev = document.getElementById(P + '-prev'), bNext = document.getElementById(P + '-next'),
          bPlay = document.getElementById(P + '-play'), bReset = document.getElementById(P + '-reset');
    let step = 0, timer = null;

    function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
      const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||H; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
      if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
    const g = {
      ctx,
      rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); },
      txt(s,x,y,font,color,align,base){ ctx.font=font; ctx.fillStyle=color; ctx.textAlign=align||'left'; ctx.textBaseline=base||'alphabetic'; ctx.fillText(s,x,y); },
      box(x,y,w,h,bg,bd,lw,dash){ g.rr(x,y,w,h,5); ctx.fillStyle=bg; ctx.fill(); ctx.lineWidth=lw; ctx.strokeStyle=bd; ctx.setLineDash(dash||[]); ctx.stroke(); ctx.setLineDash([]); },
      pill(s,cx,cy,fg,bg,bd,font){ font=font||('700 10.5px '+MONO); ctx.font=font; const pw=Math.max(ctx.measureText(s).width+12,18);
        g.rr(cx-pw/2,cy-8,pw,16,8); ctx.fillStyle=bg; ctx.fill(); ctx.lineWidth=1.2; ctx.strokeStyle=bd; ctx.stroke();
        g.txt(s,cx,cy+0.5,font,fg,'center','middle'); return pw; },
      legend(items, stepNo, total, w){
        let lx = PAD;
        items.forEach(([bg, bd, dash, t]) => {
          g.rr(lx, 7, 12, 12, 2); ctx.fillStyle = bg; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = bd;
          ctx.setLineDash(dash); ctx.stroke(); ctx.setLineDash([]);
          g.txt(t, lx + 18, 13.5, '600 11.5px ' + SANS, C.ink, 'left', 'middle');
          lx += 18 + ctx.measureText(t).width + 18;
        });
        ctx.font = '700 11.5px ' + MONO;
        const st = 'STEP ' + stepNo + ' / ' + total;
        if (lx + ctx.measureText(st).width < w - PAD) g.txt(st, w - PAD, 13.5, '700 11.5px ' + MONO, C.dim, 'right', 'middle');
      },
      /* 一排 token 格子(11 格,620px 也要放得下) */
      tokGeom(w){ const x0 = PAD + TAG_W, span = (w - PAD) - x0, gap = 5;
        const cw = Math.min(46, (span - gap * 10) / 11); const total = cw * 11 + gap * 10;
        const sx = x0; return { cw, cx: i => sx + i * (cw + gap) }; },
      /* 樹座標(樹區最寬 540,置中) */
      treeX(w){ const x0 = PAD + TAG_W, span = (w - PAD) - x0, ts = Math.min(span, 540), sx = x0 + (span - ts) / 2;
        return v => sx + NODE[v].fx * ts; },
      edge(x1,y1,x2,y2,inset1,inset2,col,lw,dash){ const dx=x2-x1, dy=y2-y1, d=Math.hypot(dx,dy);
        ctx.strokeStyle=col; ctx.lineWidth=lw; ctx.setLineDash(dash||[]);
        ctx.beginPath(); ctx.moveTo(x1+dx/d*inset1, y1+dy/d*inset1); ctx.lineTo(x2-dx/d*inset2, y2-dy/d*inset2); ctx.stroke(); ctx.setLineDash([]); },
      node(x,y,v,bg,bd,tc,lw){ ctx.beginPath(); ctx.arc(x,y,R,0,Math.PI*2); ctx.fillStyle=bg; ctx.fill(); ctx.lineWidth=lw; ctx.strokeStyle=bd; ctx.stroke();
        g.txt(String(v), x, y+1, '700 14px ' + MONO, tc, 'center', 'middle'); },
      /* null 殘根:state 'wait' | 'cur' | 'done' */
      ghost(px,py,dir,state){ const ex=px+dir*26, ey=py+40;
        const col = state==='cur' ? C.curS : state==='done' ? C.ink : C.dim;
        g.edge(px,py,ex,ey,R,8,col,state==='cur'?1.8:1.3,[4,3]);
        if (state==='cur') { ctx.beginPath(); ctx.arc(ex,ey+1,9,0,Math.PI*2); ctx.fillStyle=C.cur; ctx.fill(); }
        g.txt('∅', ex, ey+1, '700 14px ' + MONO, col, 'center', 'middle'); },
      /* queue:popped 格子 + 佇列 */
      queue(w, y, popped, items, isNull){
        const x0 = PAD + TAG_W, cw = 44, gap = 8;
        const tagX = PAD + (TAG_W - 12) / 2;
        g.txt('queue', tagX, y + 18, '700 13px ' + MONO, C.ink, 'center', 'middle');
        // pop 出來的
        g.txt('pop', x0 + cw/2, y - 12, '700 11px ' + MONO, popped ? C.curS : C.dim, 'center', 'bottom');
        if (popped) { g.box(x0, y, cw, 36, C.cur, C.curS, 2.4); g.txt(popped, x0 + cw/2, y + 19, '700 14px ' + MIX, C.curT, 'center', 'middle'); }
        else { g.box(x0, y, cw, 36, C.paper, C.grid, 1.2, [3,3]); g.txt('·', x0 + cw/2, y + 19, '700 14px ' + MONO, C.grid, 'center', 'middle'); }
        const qx = x0 + cw + 34;
        // 分隔箭頭
        ctx.strokeStyle = popped ? C.curS : C.grid; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(qx - 8, y + 18); ctx.lineTo(x0 + cw + 8, y + 18); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x0 + cw + 8, y + 18); ctx.lineTo(x0 + cw + 14, y + 14); ctx.lineTo(x0 + cw + 14, y + 22); ctx.closePath();
        ctx.fillStyle = popped ? C.curS : C.grid; ctx.fill();
        g.txt('front →', qx, y - 12, '700 11px ' + MONO, C.dim, 'left', 'bottom');
        if (!items.length) {
          g.box(qx, y, cw, 36, C.paper, C.grid, 1.2, [3,3]);
          g.txt('空', qx + cw + 12, y + 18, '600 12px ' + SANS, C.dim, 'left', 'middle');
        }
        items.forEach((it, i) => {
          const x = qx + i * (cw + gap), nul = isNull(it);
          g.box(x, y, cw, 36, C.paper, nul ? C.dim : C.ink, 1.4, nul ? [3,3] : []);
          g.txt(nul ? '∅' : String(it), x + cw/2, y + 19, '700 14px ' + MONO, nul ? C.dim : C.ink, 'center', 'middle');
        });
      },
      codeStrip(w, y, code, note, hot){
        g.rr(PAD, y, w - 2*PAD, 44, 6); ctx.fillStyle = hot ? C.cur : C.paper; ctx.fill();
        ctx.lineWidth = 1.5; ctx.strokeStyle = hot ? C.curS : C.grid; ctx.stroke();
        const X = PAD + 16, cy = y + 22;
        g.txt('▶', X, cy, '700 11px ' + MONO, C.curS, 'left', 'middle');
        g.txt(code, X + 18, cy, '700 12.5px ' + MONO, C.ink, 'left', 'middle');
        ctx.font = '700 12.5px ' + MONO; const end = X + 18 + ctx.measureText(code).width;
        const NF = '600 12px ' + MIX; ctx.font = NF; const nw = ctx.measureText(note).width;
        if (end + 20 + nw < w - PAD - 16) g.txt(note, w - PAD - 16, cy, NF, hot ? C.curT : C.dim, 'right', 'middle');
      },
    };

    function draw(){
      fit();
      const w = canvas.clientWidth, h = canvas.clientHeight;
      ctx.fillStyle = C.paper; ctx.fillRect(0, 0, w, h); ctx.setLineDash([]); ctx.lineCap = 'butt';
      paint(g, steps[step], step, steps.length - 1, w, h);
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
  }

  /* ============================================================
     SERIALIZE (vs-*) · 高 456
       legend 7..19 / 樹 根 y=62, 116, 170(殘根到 ~218)
       queue 標頭 248、格子 260..296 / output 格子 316..352、字串 366..380 / 程式碼列 398..442
     ============================================================ */
  const S_Y = [62, 116, 170], S_Q = 260, S_OUT = 316, S_CODE = 398;
  const N = '∅';
  const sSteps = [
    { done:[], cur:null, ghosts:{}, q:[1], pop:null, out:0, fresh:0,
      code:'q.emplace(root);', note:'queue = [1]',
      text:'<strong>INITIAL</strong> · BFS 從根開始。<b>跟一般層序不同:<code>nullptr</code> 也會被推進 queue</b>,之後寫成 <code>"n "</code>。' },
    { done:[1], cur:1, ghosts:{}, q:[2,3], pop:'1', out:1, fresh:1,
      code:'s += to_string(node->val) + " ";', note:'+ "1 " · 推入 2, 3',
      text:'<strong>pop 1</strong> · 寫出 <code>"1 "</code>,再把左右子 <b>2、3</b> 推進 queue。' },
    { done:[1,2], cur:2, ghosts:{ n2L:'wait', n2R:'wait' }, q:[3,N,N], pop:'2', out:2, fresh:1,
      code:'q.emplace(node->left); q.emplace(node->right);', note:'+ "2 " · 推入 ∅, ∅',
      text:'<strong>pop 2</strong> · 寫出 <code>"2 "</code>。2 沒有子節點,但<b>兩個 <code>nullptr</code> 照樣入隊</b>(虛線 ∅)。' },
    { done:[1,2,3], cur:3, ghosts:{ n2L:'wait', n2R:'wait' }, q:[N,N,4,5], pop:'3', out:3, fresh:1,
      code:'s += to_string(node->val) + " ";', note:'+ "3 " · 推入 4, 5',
      text:'<strong>pop 3</strong> · 寫出 <code>"3 "</code>,推入 4、5。queue 前面排著 2 的兩個 ∅。' },
    { done:[1,2,3], cur:null, ghosts:{ n2L:'cur', n2R:'cur' }, q:[4,5], pop:'∅×2', out:5, fresh:2,
      code:'else s += "n ";', note:'+ "n n "',
      text:'<strong>pop ∅ × 2</strong> · 碰到 <code>nullptr</code> 就寫 <code>"n "</code>,<b>不再往下推</b>。這兩個 <code>n</code> 記下了「2 是葉子」。' },
    { done:[1,2,3,4], cur:4, ghosts:{ n2L:'done', n2R:'done', n4L:'wait', n4R:'wait' }, q:[5,N,N], pop:'4', out:6, fresh:1,
      code:'s += to_string(node->val) + " ";', note:'+ "4 " · 推入 ∅, ∅',
      text:'<strong>pop 4</strong> · 寫出 <code>"4 "</code>,兩個 ∅ 入隊。' },
    { done:[1,2,3,4,5], cur:5, ghosts:{ n2L:'done', n2R:'done', n4L:'wait', n4R:'wait', n5L:'wait', n5R:'wait' }, q:[N,N,N,N], pop:'5', out:7, fresh:1,
      code:'s += to_string(node->val) + " ";', note:'+ "5 " · 推入 ∅, ∅',
      text:'<strong>pop 5</strong> · 寫出 <code>"5 "</code>。所有真節點都輸出了,queue 只剩 <b>4 個 ∅</b>。' },
    { done:[1,2,3,4,5], cur:null, ghosts:{ n2L:'done', n2R:'done', n4L:'cur', n4R:'cur', n5L:'cur', n5R:'cur' }, q:[], pop:'∅×4', out:11, fresh:4,
      code:'else s += "n ";', note:'+ "n n n n "',
      text:'<strong>pop ∅ × 4</strong> · 連寫 4 個 <code>"n "</code>,queue 空 → 迴圈結束。' },
    { done:[1,2,3,4,5], cur:null, ghosts:{ n2L:'done', n2R:'done', n4L:'done', n4R:'done', n5L:'done', n5R:'done' }, q:[], pop:null, out:11, fresh:0, final:true,
      code:'return s;', note:'11 tokens = 2n + 1',
      text:'<strong>完成</strong> · <code>"1 2 3 n n 4 5 n n n n "</code>。<b>5 個數字 + 6 個 n = 11 = 2n+1</b>:每個節點(含根)的 n+1 個空位都被寫成 <code>n</code>,<strong>字串唯一決定樹形。</strong>' },
  ];

  makeViz('vs', 456, sSteps, (g, s, stepNo, total, w) => {
    const ctx = g.ctx, tagX = PAD + (TAG_W - 12) / 2;
    g.legend([[C.cur, C.curS, [], '紅 = 目前 pop'], [C.left, C.ink, [], '藍 = 已輸出'],
              [C.grid, C.grid, [], '灰 = n(null)'], [C.paper, C.dim, [3,2], '虛線 ∅ = nullptr']], stepNo, total, w);

    /* BAND 1 · 樹 */
    const nx = g.treeX(w), ny = v => S_Y[NODE[v].d];
    g.txt('tree', tagX, S_Y[1], '700 13px ' + MONO, C.ink, 'center', 'middle');
    Object.keys(PARENT).forEach(k => { const v = +k, p = PARENT[v]; g.edge(nx(p), ny(p), nx(v), ny(v), R, R, C.ink, 1.5); });
    Object.keys(s.ghosts).forEach(k => { const [p, dir] = GHOST[k]; g.ghost(nx(p), ny(p), dir, s.ghosts[k]); });
    [1,2,3,4,5].forEach(v => {
      let bg = C.paper, bd = C.ink, tc = C.ink, lw = 1.6;
      if (s.done.includes(v)) bg = C.left;
      if (v === s.cur) { bg = C.cur; bd = C.curS; tc = C.curT; lw = 2.6; }
      g.node(nx(v), ny(v), v, bg, bd, tc, lw);
    });

    /* BAND 2 · queue */
    g.queue(w, S_Q, s.pop, s.q, it => it === N);

    /* BAND 3 · output tokens */
    const tg = g.tokGeom(w);
    g.txt('output', tagX, S_OUT + 18, '700 13px ' + MONO, C.ink, 'center', 'middle');
    TOK.forEach((t, i) => {
      const x = tg.cx(i), shown = i < s.out, fresh = shown && i >= s.out - s.fresh, isN = t === 'n';
      if (!shown) { g.box(x, S_OUT, tg.cw, 36, C.paper, C.grid, 1.2, [3,3]); return; }
      let bg = isN ? C.grid : C.left, bd = isN ? C.dim : C.ink, tc = C.ink, lw = 1.4;
      if (fresh) { bg = C.cur; bd = C.curS; tc = C.curT; lw = 2.4; }
      g.box(x, S_OUT, tg.cw, 36, bg, bd, lw);
      g.txt(t, x + tg.cw/2, S_OUT + 19, '700 14px ' + MONO, tc, 'center', 'middle');
    });
    // 目前字串
    const str = '"' + TOK.slice(0, s.out).map(t => t + ' ').join('') + '"';
    const sy = S_OUT + 36 + 14;
    g.txt('s =', tg.cx(0), sy, '600 12px ' + MONO, C.dim, 'left', 'top');
    g.txt(s.out ? str : '""', tg.cx(0) + 30, sy, '700 12px ' + MONO, s.final ? C.curS : C.ink, 'left', 'top');
    if (s.final) g.txt('5 個數字 + 6 個 n = 2n+1', tg.cx(10) + tg.cw, sy, '700 12px ' + MIX, C.curS, 'right', 'top');
    else if (s.out) g.txt(s.out + ' tokens', tg.cx(10) + tg.cw, sy, '600 12px ' + MONO, C.dim, 'right', 'top');

    g.codeStrip(w, S_CODE, s.code, s.note, !!s.final);
  });

  /* ============================================================
     DESERIALIZE (vd-*) · 高 484
       legend 7..19 / L,R 標籤 36..52、input 格子 66..102、配對括號+標籤 110..~132
       queue 標頭 160、格子 172..208 / 樹 根 y=252, 306, 360(殘根到 ~408) / 程式碼列 426..470
     ============================================================ */
  const D_TAG = 44, D_IN = 66, D_Q = 172, D_Y = [252, 306, 360], D_CODE = 426;
  /* 每個 pop 對應的 token 配對 */
  const PAIRS = [{ i:[0], lab:'root' }, { i:[1,2], lab:'← 1' }, { i:[3,4], lab:'← 2' }, { i:[5,6], lab:'← 3' }, { i:[7,8], lab:'← 4' }, { i:[9,10], lab:'← 5' }];
  const dSteps = [
    { read:0, reading:[], pair:null, pairsAll:false, nodes:[], par:null, fresh:[], ghosts:{}, q:[], pop:null,
      code:'stringstream ss(data);', note:'11 個 token',
      text:'<strong>INITIAL</strong> · 輸入 <code>"1 2 3 n n 4 5 n n n n "</code>,用 <code>stringstream</code> 以空白切成 token,逐一讀。' },
    { read:1, reading:[0], pair:0, nodes:[1], par:null, fresh:[1], ghosts:{}, q:[1], pop:null,
      code:'ss >> word; root = new TreeNode(1);', note:'q = [1]',
      text:'<strong>讀 "1" → 建根</strong> · 第一個 token 一定是根,建好後推進 queue。' },
    { read:3, reading:[1,2], pair:1, nodes:[1,2,3], par:1, fresh:[2,3], ghosts:{}, q:[2,3], pop:'1',
      code:'node->left = ...(2);  node->right = ...(3);', note:'"2" "3" → 兩個都建',
      text:'<strong>第 1 圈 · pop 1</strong> · 讀兩個 token:左 <code>"2"</code>、右 <code>"3"</code>,<b>都不是 n → 建出兩個子節點</b>並入隊。' },
    { read:5, reading:[3,4], pair:2, nodes:[1,2,3], par:2, fresh:[], ghosts:{ n2L:'cur', n2R:'cur' }, q:[3], pop:'2',
      code:'if (word != "n") ...  // 兩次都是 n', note:'"n" "n" → 不建',
      text:'<strong>第 2 圈 · pop 2</strong> · 左右都讀到 <code>"n"</code>,<b>什麼都不建</b> —— 2 是葉子。queue 剩 [3]。' },
    { read:7, reading:[5,6], pair:3, nodes:[1,2,3,4,5], par:3, fresh:[4,5], ghosts:{ n2L:'done', n2R:'done' }, q:[4,5], pop:'3',
      code:'node->left = ...(4);  node->right = ...(5);', note:'"4" "5" → 兩個都建',
      text:'<strong>第 3 圈 · pop 3</strong> · 讀 <code>"4"</code>、<code>"5"</code> → 建成 3 的左、右子,入隊。' },
    { read:9, reading:[7,8], pair:4, nodes:[1,2,3,4,5], par:4, fresh:[], ghosts:{ n2L:'done', n2R:'done', n4L:'cur', n4R:'cur' }, q:[5], pop:'4',
      code:'if (word != "n") ...  // 兩次都是 n', note:'"n" "n" → 不建',
      text:'<strong>第 4 圈 · pop 4</strong> · 讀到 <code>"n"</code>、<code>"n"</code>,4 是葉子。queue 剩 [5]。' },
    { read:11, reading:[9,10], pair:5, nodes:[1,2,3,4,5], par:5, fresh:[], ghosts:{ n2L:'done', n2R:'done', n4L:'done', n4R:'done', n5L:'cur', n5R:'cur' }, q:[], pop:'5',
      code:'if (word != "n") ...  // 兩次都是 n', note:'"n" "n" → 不建',
      text:'<strong>第 5 圈 · pop 5</strong> · 又是兩個 <code>"n"</code>。<b>11 個 token 全部讀完</b>,queue 也空了。' },
    { read:11, reading:[], pair:null, nodes:[1,2,3,4,5], par:null, fresh:[], ghosts:{ n2L:'done', n2R:'done', n4L:'done', n4R:'done', n5L:'done', n5R:'done' }, q:[], pop:null, eof:true,
      code:'while (ss >> word)  // 讀到結尾 → false', note:'迴圈跑了 n = 5 次',
      text:'<strong>讀到結尾 → 停止</strong> · <code>ss &gt;&gt; word</code> 失敗,迴圈結束,<code>return root</code>。<b>迴圈剛好跑了 n = 5 次</b>,樹還原為 <code>[1,2,3,null,null,4,5]</code>。' },
    { read:11, reading:[], pair:null, pairsAll:true, nodes:[1,2,3,4,5], par:null, fresh:[], ghosts:{ n2L:'done', n2R:'done', n4L:'done', n4R:'done', n5L:'done', n5R:'done' }, q:[], pop:null, final:true,
      code:'return root;', note:'1 + 2 × 5 = 11 = 2n + 1',
      text:'<strong>關鍵</strong> · <b>每個被 pop 的節點一次吃兩個 token(左、右)— token 數 2n+1 保證剛好配對</b>:根吃 1 個,5 個節點各吃 2 個,1 + 2·5 = 11,<strong>不多不少,第二次 <code>ss &gt;&gt; word</code> 永遠不會落空。</strong>' },
  ];

  makeViz('vd', 484, dSteps, (g, s, stepNo, total, w) => {
    const ctx = g.ctx, tagX = PAD + (TAG_W - 12) / 2;
    g.legend([[C.cur, C.curS, [], '紅 = 被 pop 的父'], [C.left, C.leftS, [], '藍 = 新建左子'],
              [C.right, C.rightS, [], '米 = 新建右子'], [C.paper, C.grid, [], '灰 = 已讀 token']], stepNo, total, w);

    /* BAND 1 · input tokens */
    const tg = g.tokGeom(w);
    g.txt('input', tagX, D_IN + 18, '700 13px ' + MONO, C.ink, 'center', 'middle');
    TOK.forEach((t, i) => {
      const x = tg.cx(i), ri = s.reading.indexOf(i), isRead = i < s.read && ri < 0;
      let bg = C.paper, bd = C.ink, tc = C.ink, lw = 1.4;
      if (isRead) { bd = C.grid; tc = C.dim; lw = 1.2; }
      if (ri >= 0) { bg = C.cur; bd = C.curS; tc = C.curT; lw = 2.6; }
      g.box(x, D_IN, tg.cw, 36, bg, bd, lw);
      g.txt(t, x + tg.cw/2, D_IN + 19, '700 14px ' + MONO, tc, 'center', 'middle');
      if (ri >= 0) {
        const lab = s.reading.length === 1 ? 'root' : ri === 0 ? 'L' : 'R';
        const bgp = lab === 'L' ? C.left : lab === 'R' ? C.right : C.cur;
        const bdp = lab === 'L' ? C.leftS : lab === 'R' ? C.rightS : C.curS;
        g.pill(lab, x + tg.cw/2, D_TAG, lab === 'root' ? C.curT : C.ink, bgp, bdp);
      }
    });
    if (s.eof) g.pill('EOF', Math.min(tg.cx(10) + tg.cw + 22, w - PAD - 16), D_TAG, C.curT, C.cur, C.curS);
    // 配對括號
    const bracket = (pi, col, bold) => {
      const pr = PAIRS[pi], a = tg.cx(pr.i[0]) + 3, b = tg.cx(pr.i[pr.i.length - 1]) + tg.cw - 3, by = D_IN + 36 + 8;
      ctx.strokeStyle = col; ctx.lineWidth = bold ? 1.8 : 1.2;
      ctx.beginPath(); ctx.moveTo(a, by); ctx.lineTo(a, by + 5); ctx.lineTo(b, by + 5); ctx.lineTo(b, by); ctx.stroke();
      g.txt(pr.lab, (a + b) / 2, by + 9, (bold ? '700' : '600') + ' 11px ' + MIX, col, 'center', 'top');
    };
    if (s.pairsAll) PAIRS.forEach((_, i) => bracket(i, i === 0 ? C.ink : C.curS, true));
    else if (s.pair !== null) bracket(s.pair, C.curS, true);

    /* BAND 2 · queue */
    g.queue(w, D_Q, s.pop, s.q, () => false);

    /* BAND 3 · 樹 */
    const nx = g.treeX(w), ny = v => D_Y[NODE[v].d];
    g.txt('tree', tagX, D_Y[1], '700 13px ' + MONO, C.ink, 'center', 'middle');
    if (!s.nodes.length) g.txt('(還沒有節點)', nx(1), D_Y[0], '600 12px ' + SANS, C.dim, 'center', 'middle');
    Object.keys(PARENT).forEach(k => { const v = +k, p = PARENT[v];
      if (!s.nodes.includes(v)) return;
      const fr = s.fresh.includes(v);
      g.edge(nx(p), ny(p), nx(v), ny(v), R, R, fr ? (SIDE[v] === 'L' ? C.leftS : C.rightS) : C.ink, fr ? 3 : 1.5); });
    Object.keys(s.ghosts).forEach(k => { const [p, dir] = GHOST[k]; g.ghost(nx(p), ny(p), dir, s.ghosts[k]); });
    s.nodes.forEach(v => {
      let bg = C.paper, bd = C.ink, tc = C.ink, lw = 1.6;
      if (s.fresh.includes(v) && v !== 1) { bg = SIDE[v] === 'L' ? C.left : C.right; bd = SIDE[v] === 'L' ? C.leftS : C.rightS; lw = 2.4; }
      if (v === s.par || (v === 1 && s.fresh.includes(1))) { bg = C.cur; bd = C.curS; tc = C.curT; lw = 2.6; }
      g.node(nx(v), ny(v), v, bg, bd, tc, lw);
      if (s.fresh.includes(v) && v !== 1) {
        const dir = SIDE[v] === 'L' ? -1 : 1;
        g.pill(SIDE[v], nx(v) + dir * (R + 16), ny(v), C.ink, SIDE[v] === 'L' ? C.left : C.right, SIDE[v] === 'L' ? C.leftS : C.rightS);
      }
    });
    if (s.final || s.eof) {
      const t = s.final ? '1 + 2·5 = 11 個 token' : '[1,2,3,null,null,4,5]';
      ctx.font = '700 12px ' + MIX; const tw = ctx.measureText(t).width;
      if (w - PAD - tw > nx(3) + R + 24) g.txt(t, w - PAD, D_Y[0], '700 12px ' + MIX, C.curT, 'right', 'middle');
    }

    g.codeStrip(w, D_CODE, s.code, s.note, !!(s.final || s.eof));
  });
})();
