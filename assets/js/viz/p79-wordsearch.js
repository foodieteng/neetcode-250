/* ============================================================
   P79 · Word Search — 標 '#' + 四方向 DFS + 失敗還原 · viz
     bool dfs(r, c, i):
       if (board[r][c] != word[i]) return false;
       if (i == word.size() - 1) return true;
       board[r][c] = '#';
       for (d : 上 下 左 右) { nr, nc;  出界 → continue;  board[nr][nc] == '#' → continue;
                               if (dfs(nr, nc, i + 1)) return true; }
       board[r][c] = word[i];   // 還原
       return false;
   board = A B C E / S F C S / A D E E,word = "SEE" → true,共 15 次 dfs(g++ 實跑 trace,見 facts)
     掃描:#1–#4 第 0 列都不是 S;#5 (1,0) 進去,四方向全失敗 → 還原;#9–#10 不是 S
     #11 (1,3) → #12 上 (0,3) 失敗還原 → #14 下 (2,3) → #15 左 (2,2) i==last → TRUE
     成功不還原:board 留 (1,3)、(2,3) 的 '#'
   BAND 1 word(紅 = 目前 i,綠 = 已配好)+ 呼叫數 / 結果
   BAND 2 board(紅 = 目前這層,米 + # = 在路徑上,粉 = 不符)+ 右側四方向
   BAND 3 call stack   BAND 4 這一步
   前綴 v79- 。
   ============================================================ */
(function () {
  const C = { paper:'#ffffff', ink:'#1f1f1f', dim:'#5a5a5a', off:'#cfcfcf',
    up:'#e3edf5', low:'#f6ead8',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424',
    good:'#d9e8c7', bad:'#f0d4d4', deep:'#a31d1d', gray:'#ececec' };
  const MONO = '"JetBrains Mono", monospace', SANS = '"Noto Sans TC", sans-serif';
  const B = [['A','B','C','E'], ['S','F','C','S'], ['A','D','E','E']];
  const WORD = 'SEE', TOTAL = 15;
  const DN = ['上', '下', '左', '右'];

  /* panel rows:{ tgt, k:'wait'|'oob'|'hash'|'bad'|'ok'|'okF'|'true', t } */
  const W = (tgt) => ({ tgt, k:'wait', t:'待試' });
  const P5 = (a) => ({ title:'#5 (1,0) 的迴圈 · 找 word[1] = \'E\'', rows:a });
  const P11 = (a) => ({ title:'#11 (1,3) 的迴圈 · 找 word[1] = \'E\'', rows:a });
  const P12 = (a) => ({ title:'#12 (0,3) 的迴圈 · 找 word[2] = \'E\'', rows:a });
  const P14 = (a) => ({ title:'#14 (2,3) 的迴圈 · 找 word[2] = \'E\'', rows:a });
  const r5 = [{ tgt:'(0,0)', k:'bad', t:'#6 A≠E 不符' }, { tgt:'(2,0)', k:'bad', t:'#7 A≠E 不符' },
              { tgt:'(1,−1)', k:'oob', t:'出界 跳過' }, { tgt:'(1,1)', k:'bad', t:'#8 F≠E 不符' }];
  const r12 = [{ tgt:'(−1,3)', k:'oob', t:'出界 跳過' }, { tgt:'(1,3)', k:'hash', t:'# 跳過' },
               { tgt:'(0,2)', k:'bad', t:'#13 C≠E 不符' }, { tgt:'(0,4)', k:'oob', t:'出界 跳過' }];
  const r14 = [{ tgt:'(1,3)', k:'hash', t:'# 跳過' }, { tgt:'(3,3)', k:'oob', t:'出界 跳過' },
               { tgt:'(2,2)', k:'true', t:'#15 符合 · TRUE' }, { tgt:'(2,4)', k:'wait', t:'不用試了' }];
  const r5w = [W('(0,0)'), W('(2,0)'), W('(1,−1)'), W('(1,1)')];
  const r11w = [W('(0,3)'), W('(2,3)'), W('(1,2)'), W('(1,4)')];
  const r12w = [W('(−1,3)'), W('(1,3)'), W('(0,2)'), W('(0,4)')];
  const r14w = [W('(1,3)'), W('(3,3)'), W('(2,2)'), W('(2,4)')];
  const ok12 = { tgt:'(0,3)', k:'ok', t:'#12 符合 → 進去' }, f12 = { tgt:'(0,3)', k:'okF', t:'#12 → false' };
  const ok14 = { tgt:'(2,3)', k:'ok', t:'#14 符合 → 進去' };
  const mix = (base, upto, full) => base.map((x, k) => k <= upto ? full[k] : x);

  /* 呼叫堆疊:{ t1, t2, k:'main'|'live'|'pop'|'ok' } */
  const M = (t2) => ({ t1:'main', t2, k:'main' });
  const L = (no, rc, i) => ({ t1:'#' + no + ' ' + rc, t2:'i=' + i + ' \'' + WORD[i] + '\' 已標 #', k:'live' });
  const Pf = (t1, t2) => ({ t1, t2, k:'pop' });

  const STEPS = [
    { calls:0, marks:[], cur:null, wi:-1, ok:0, stack:[M('準備掃起點')], panel:null,
      line:'for r, for c:  if (dfs(r, c, 0)) return true;',
      text:'<strong>INITIAL</strong> · board 3×4、<code>word = "SEE"</code>。外層兩個 for 掃每個起點呼叫 <code>dfs(r,c,0)</code>;dfs 先比 <code>board[r][c]</code> 和 <code>word[i]</code>,相同就標 <code>\'#\'</code>,再照 <b>上 → 下 → 左 → 右</b> 往外走,失敗就還原。' },
    { calls:4, marks:[], cur:null, wi:0, ok:0, scan:[[0,0],[0,1],[0,2],[0,3]], stack:[M('掃 r=0'), Pf('#1~#4', '≠\'S\' → false')], panel:null,
      line:'#1~#4  dfs((0,0)~(0,3), 0):  A B C E ≠ \'S\' → return false',
      text:'<strong>#1–#4 · 掃起點</strong> · 起點 (0,0)~(0,3) 是 A B C E,<b>都不是 \'S\'</b> → 每次一進 dfs 就 <code>return false</code>(4 次呼叫)。' },
    { calls:5, marks:[[1,0]], cur:[1,0], curNote:'#5 i=0', wi:0, ok:0, path:[[1,0]], stack:[M('掃 (1,0)'), L(5,'(1,0)',0)], panel:P5(r5w),
      line:'#5  dfs(1,0,0):  \'S\' == word[0] → board[1][0] = \'#\'',
      text:'<strong>#5 · (1,0)</strong> · <code>\'S\' == word[0]</code> → 標 <code>board[1][0] = \'#\'</code>,接著四個方向找 <code>word[1] = \'E\'</code>。' },
    { calls:6, marks:[[1,0]], cur:[1,0], curNote:'#5 i=0', wi:1, ok:1, path:[[1,0]], probe:{ r:0, c:0, k:'bad', n:'#6 ≠E' },
      stack:[M('掃 (1,0)'), L(5,'(1,0)',0), Pf('#6 (0,0)', 'A≠E → false')], panel:Object.assign(P5(mix(r5w, 0, r5)), { now:0 }),
      line:'#6  dfs(0,0,1):  \'A\' ≠ word[1]=\'E\' → return false',
      text:'<strong>#6 · 上 (0,0)</strong> · <code>\'A\' ≠ \'E\'</code> → 一進去就 <code>return false</code>。' },
    { calls:7, marks:[[1,0]], cur:[1,0], curNote:'#5 i=0', wi:1, ok:1, path:[[1,0]], probe:{ r:2, c:0, k:'bad', n:'#7 ≠E' },
      stack:[M('掃 (1,0)'), L(5,'(1,0)',0), Pf('#7 (2,0)', 'A≠E → false')], panel:Object.assign(P5(mix(r5w, 1, r5)), { now:1 }),
      line:'#7  dfs(2,0,1):  \'A\' ≠ word[1]=\'E\' → return false',
      text:'<strong>#7 · 下 (2,0)</strong> · <code>\'A\' ≠ \'E\'</code> → <code>return false</code>。' },
    { calls:7, marks:[[1,0]], cur:[1,0], curNote:'← 出界', wi:1, ok:1, path:[[1,0]], edge:{ r:1, c:0, s:'L' },
      stack:[M('掃 (1,0)'), L(5,'(1,0)',0)], panel:Object.assign(P5(mix(r5w, 2, r5)), { now:2 }),
      line:'左 (1,−1):  nc < 0 → 出界,continue(不呼叫 dfs)',
      text:'<strong>左 (1,−1) · 出界</strong> · 在呼叫前就擋掉 → <code>continue</code>,<b>不算一次 dfs</b>。' },
    { calls:8, marks:[[1,0]], cur:[1,0], curNote:'#5 i=0', wi:1, ok:1, path:[[1,0]], probe:{ r:1, c:1, k:'bad', n:'#8 ≠E' },
      stack:[M('掃 (1,0)'), L(5,'(1,0)',0), Pf('#8 (1,1)', 'F≠E → false')], panel:Object.assign(P5(r5), { now:3 }),
      line:'#8  dfs(1,1,1):  \'F\' ≠ word[1]=\'E\' → return false',
      text:'<strong>#8 · 右 (1,1)</strong> · <code>\'F\' ≠ \'E\'</code> → <code>return false</code>。#5 的四個方向都試完了,沒有一條通。' },
    { calls:8, marks:[], cur:null, wi:0, ok:0, restored:[1,0], stack:[M('掃 (1,0)'), Pf('#5 (1,0)', '還原 S → false')],
      panel:Object.assign(P5(r5), { title:'#5 (1,0) · 四個方向全失敗 → 還原', fail:true }),
      line:'#5  迴圈結束:board[1][0] = word[0] = \'S\'(還原)· return false',
      text:'<strong>還原 · #5</strong> · 四個方向全失敗 → <code>board[1][0]</code> 從 <code>\'#\'</code> <b>改回 \'S\'</b>,<code>return false</code>。board 回到原樣,別的起點才用得到這格。' },
    { calls:10, marks:[], cur:null, wi:0, ok:0, scan:[[1,1],[1,2]], stack:[M('掃 r=1'), Pf('#9~#10', '≠\'S\' → false')], panel:null,
      line:'#9~#10  dfs((1,1),0)、dfs((1,2),0):  F、C ≠ \'S\' → return false',
      text:'<strong>#9–#10 · 掃起點</strong> · (1,1) = \'F\'、(1,2) = \'C\' 都不是 \'S\' → <code>return false</code>(2 次呼叫)。' },
    { calls:11, marks:[[1,3]], cur:[1,3], curNote:'#11 i=0', wi:0, ok:0, path:[[1,3]], stack:[M('掃 (1,3)'), L(11,'(1,3)',0)], panel:P11(r11w),
      line:'#11  dfs(1,3,0):  \'S\' == word[0] → board[1][3] = \'#\'',
      text:'<strong>#11 · (1,3)</strong> · <code>\'S\' == word[0]</code> → 標 <code>\'#\'</code>,找 <code>word[1] = \'E\'</code>。' },
    { calls:12, marks:[[1,3],[0,3]], cur:[0,3], curNote:'#12 i=1', wi:1, ok:1, path:[[1,3],[0,3]],
      stack:[M('掃 (1,3)'), L(11,'(1,3)',0), L(12,'(0,3)',1)], panel:Object.assign(P11([ok12, W('(2,3)'), W('(1,2)'), W('(1,4)')]), { now:0 }),
      line:'#12  dfs(0,3,1):  \'E\' == word[1] → board[0][3] = \'#\'',
      text:'<strong>#12 · 上 (0,3)</strong> · <code>\'E\' == word[1]</code> → 標 <code>\'#\'</code>,路徑 S→E,換找 <code>word[2] = \'E\'</code>。' },
    { calls:12, marks:[[1,3],[0,3]], cur:[0,3], curNote:'↑ 出界', wi:2, ok:2, path:[[1,3],[0,3]], edge:{ r:0, c:3, s:'T' },
      stack:[M('掃 (1,3)'), L(11,'(1,3)',0), L(12,'(0,3)',1)], panel:Object.assign(P12(mix(r12w, 0, r12)), { now:0 }),
      line:'#12 上 (−1,3):  nr < 0 → 出界,continue',
      text:'<strong>#12 · 上 (−1,3)</strong> · 出界 → <code>continue</code>。' },
    { calls:12, marks:[[1,3],[0,3]], cur:[0,3], curNote:'#12 i=1', wi:2, ok:2, path:[[1,3],[0,3]], probe:{ r:1, c:3, k:'hash', n:'# 跳過' },
      stack:[M('掃 (1,3)'), L(11,'(1,3)',0), L(12,'(0,3)',1)], panel:Object.assign(P12(mix(r12w, 1, r12)), { now:1 }),
      line:'#12 下 (1,3):  board[1][3] == \'#\' → continue',
      text:'<strong>#12 · 下 (1,3)</strong> · 是 <code>\'#\'</code>(剛剛走來的那格,在路徑上)→ <code>continue</code>。<b>\'#\' 就是在擋「同一格用兩次」。</b>' },
    { calls:13, marks:[[1,3],[0,3]], cur:[0,3], curNote:'#12 i=1', wi:2, ok:2, path:[[1,3],[0,3]], probe:{ r:0, c:2, k:'bad', n:'#13 ≠E' },
      stack:[M('掃 (1,3)'), L(11,'(1,3)',0), L(12,'(0,3)',1), Pf('#13 (0,2)', 'C≠E → false')], panel:Object.assign(P12(mix(r12w, 2, r12)), { now:2 }),
      line:'#13  dfs(0,2,2):  \'C\' ≠ word[2]=\'E\' → return false',
      text:'<strong>#13 · 左 (0,2)</strong> · <code>\'C\' ≠ \'E\'</code> → <code>return false</code>。' },
    { calls:13, marks:[[1,3],[0,3]], cur:[0,3], curNote:'出界 →', wi:2, ok:2, path:[[1,3],[0,3]], edge:{ r:0, c:3, s:'R' },
      stack:[M('掃 (1,3)'), L(11,'(1,3)',0), L(12,'(0,3)',1)], panel:Object.assign(P12(r12), { now:3 }),
      line:'#12 右 (0,4):  nc ≥ 4 → 出界,continue',
      text:'<strong>#12 · 右 (0,4)</strong> · 出界 → <code>continue</code>。#12 的四個方向都失敗。' },
    { calls:13, marks:[[1,3]], cur:[1,3], curNote:'#11 i=0', wi:1, ok:1, path:[[1,3]], restored:[0,3],
      stack:[M('掃 (1,3)'), L(11,'(1,3)',0), Pf('#12 (0,3)', '還原 E → false')],
      panel:Object.assign(P12(r12), { title:'#12 (0,3) · 四個方向全失敗 → 還原', fail:true }),
      line:'#12  迴圈結束:board[0][3] = word[1] = \'E\'(還原)· return false',
      text:'<strong>還原 · #12</strong> · <code>board[0][3]</code> 從 <code>\'#\'</code> <b>改回 \'E\'</b>,<code>return false</code>。回到 #11 的迴圈,路徑剩 S,接著試「下」。' },
    { calls:14, marks:[[1,3],[2,3]], cur:[2,3], curNote:'#14 i=1', wi:1, ok:1, path:[[1,3],[2,3]],
      stack:[M('掃 (1,3)'), L(11,'(1,3)',0), L(14,'(2,3)',1)], panel:Object.assign(P11([f12, ok14, W('(1,2)'), W('(1,4)')]), { now:1 }),
      line:'#14  dfs(2,3,1):  \'E\' == word[1] → board[2][3] = \'#\'',
      text:'<strong>#14 · #11 的下 (2,3)</strong> · <code>\'E\' == word[1]</code> → 標 <code>\'#\'</code>,路徑 S→E,找 <code>word[2] = \'E\'</code>。' },
    { calls:14, marks:[[1,3],[2,3]], cur:[2,3], curNote:'#14 i=1', wi:2, ok:2, path:[[1,3],[2,3]], probe:{ r:1, c:3, k:'hash', n:'# 跳過' },
      stack:[M('掃 (1,3)'), L(11,'(1,3)',0), L(14,'(2,3)',1)], panel:Object.assign(P14(mix(r14w, 0, r14)), { now:0 }),
      line:'#14 上 (1,3):  board[1][3] == \'#\' → continue',
      text:'<strong>#14 · 上 (1,3)</strong> · 是 <code>\'#\'</code>(路徑上的 S)→ <code>continue</code>。' },
    { calls:14, marks:[[1,3],[2,3]], cur:[2,3], curNote:'↓ 出界', wi:2, ok:2, path:[[1,3],[2,3]], edge:{ r:2, c:3, s:'B' },
      stack:[M('掃 (1,3)'), L(11,'(1,3)',0), L(14,'(2,3)',1)], panel:Object.assign(P14(mix(r14w, 1, r14)), { now:1 }),
      line:'#14 下 (3,3):  nr ≥ 3 → 出界,continue',
      text:'<strong>#14 · 下 (3,3)</strong> · 出界 → <code>continue</code>。' },
    { calls:15, marks:[[1,3],[2,3]], cur:[2,3], curNote:'#14 i=1', wi:-1, ok:3, path:[[1,3],[2,3],[2,2]], win:[2,2],
      stack:[M('掃 (1,3)'), L(11,'(1,3)',0), L(14,'(2,3)',1), { t1:'#15 (2,2)', t2:'i=2 last → TRUE', k:'ok' }],
      panel:Object.assign(P14(r14), { now:2 }),
      line:'#15  dfs(2,2,2):  \'E\' == word[2] 且 i == size−1 → return true(不標 #)',
      text:'<strong>#15 · 左 (2,2)</strong> · <code>\'E\' == word[2]</code>,而且 <code>i == word.size()−1</code> → <b>直接 return true</b>(在標 \'#\' 之前就回傳,這格沒被標)。' },
    { calls:15, marks:[[1,3],[2,3]], cur:null, wi:-1, ok:3, path:[[1,3],[2,3],[2,2]], win:[2,2], final:true,
      stack:[{ t1:'main', t2:'return true', k:'ok' }, { t1:'#11 (1,3)', t2:'→ true', k:'ok' }, { t1:'#14 (2,3)', t2:'→ true', k:'ok' }, { t1:'#15 (2,2)', t2:'→ true', k:'ok' }],
      panel:Object.assign(P14(r14), { title:'TRUE 往上傳:#15 → #14 → #11 → main' }),
      line:'成功不還原:board 留著 (1,3)、(2,3) 的 \'#\'   A B C E / S F C # / A D E #',
      text:'<strong>完成 · TRUE</strong> · 一路往上傳 #15 → #14 → #11 → <code>exist</code> 回傳 true。路徑 <b>S(1,3) → E(2,3) → E(2,2)</b>,共 <b>15 次 dfs</b>。成功時 <code>return true</code> 跳過了還原那行 → board 留著 (1,3)、(2,3) 的 <code>\'#\'</code>。' },
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
      const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||520; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
      if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
    function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
    function box(x,y,w,h,fill,stroke,lw,dash){ rr(x,y,w,h,5); ctx.fillStyle=fill; ctx.fill(); ctx.lineWidth=lw||1.4; if(dash) ctx.setLineDash(dash); ctx.strokeStyle=stroke; ctx.stroke(); ctx.setLineDash([]); }
    function txt(s,x,y,color,font,align,base){ ctx.fillStyle=color; ctx.font=font; ctx.textAlign=align||'center'; ctx.textBaseline=base||'middle'; ctx.fillText(s,x,y); }
    function head(s,x,y){ txt(s,x,y,C.dim,'600 12px '+MONO+', '+SANS,'left','alphabetic'); }
    function line(x1,y1,x2,y2,color,lw,dash){ ctx.strokeStyle=color; ctx.lineWidth=lw; if(dash) ctx.setLineDash(dash); ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); ctx.setLineDash([]); }
    function halo(s,x,y,color,font,bg,lw){ ctx.font=font; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.lineJoin='round';
      ctx.strokeStyle=bg; ctx.lineWidth=lw; ctx.strokeText(s,x,y); ctx.fillStyle=color; ctx.fillText(s,x,y); }
    const F = (wt, sz) => wt + ' ' + sz + 'px ' + MONO + ', ' + SANS;
    function fitTxt(s, x, y, color, wt, sz, maxW, align){ let f = sz; ctx.font = F(wt, f);
      while (f > 9.5 && ctx.measureText(s).width > maxW) { f -= 0.5; ctx.font = F(wt, f); }
      txt(s, x, y, color, F(wt, f), align); }
    const has = (arr, r, c) => !!arr && arr.some(p => p[0] === r && p[1] === c);
    const eq = (p, r, c) => !!p && p[0] === r && p[1] === c;

    function draw(){
      fit();
      const s = steps[step], w = canvas.clientWidth, H = canvas.clientHeight, PAD = 22;
      ctx.fillStyle = C.paper; ctx.fillRect(0,0,w,H); ctx.setLineDash([]);
      const X = px => px * w / 620;

      /* ---- BAND 1 · word ---- */
      head('BAND 1 · word = "SEE"   紅 = 目前要配的 i   綠 = 已配好的前綴', PAD, 16);
      const wy = 58, wh = 36, wcw = 46, wg = 10, wx0 = PAD + 56;
      txt('word', PAD, wy + wh/2 + 1, C.ink, '700 13px '+MONO, 'left');
      for (let k = 0; k < 3; k++) {
        const x = wx0 + k*(wcw + wg), isI = k === s.wi, isOk = k < s.ok && !isI;
        let fill = C.paper, st = C.ink, lw = 1.4, tc = C.ink, hc = C.dim;
        if (isOk) { fill = C.good; }
        if (isI) { fill = C.cur; st = C.curS; lw = 2.6; tc = C.curT; hc = C.curT; }
        txt('i=' + k, x + wcw/2, 40, hc, F(isI ? 700 : 600, 11));
        box(x, wy, wcw, wh, fill, st, lw);
        txt(WORD[k], x + wcw/2, wy + wh/2 + 1, tc, F(700, 17));
      }
      // 路徑 / 計數 / 結果
      const pbx = wx0 + 3*(wcw + wg) + 14, cbx = pbx + Math.max(150, X(170)) + 12, pbw = cbx - 12 - pbx;
      const cbw = w - PAD - cbx, cw1 = Math.round((cbw - 12) * 0.5), cw2 = cbw - 12 - cw1;
      txt('目前路徑', pbx + pbw/2, 40, C.dim, F(600, 11));
      const pth = s.path || [], pstr = pth.length ? pth.map(p => B[p[0]][p[1]] + '(' + p[0] + ',' + p[1] + ')').join('→') : '(空)';
      box(pbx, wy, pbw, wh, pth.length ? (s.final ? C.good : C.cur) : C.paper, pth.length ? (s.final ? C.ink : C.curS) : C.off, pth.length ? 1.8 : 1.1, pth.length ? null : [3,3]);
      fitTxt(pstr, pbx + pbw/2, wy + wh/2 + 1, pth.length ? (s.final ? C.ink : C.curT) : C.off, 700, 12.5, pbw - 12);
      txt('dfs 呼叫', cbx + cw1/2, 40, C.dim, F(600, 11));
      box(cbx, wy, cw1, wh, C.paper, C.ink, 1.4);
      fitTxt(s.calls + ' / ' + TOTAL, cbx + cw1/2, wy + wh/2 + 1, C.ink, 700, 15, cw1 - 14);
      const rx = cbx + cw1 + 12;
      txt('exist 回傳', rx + cw2/2, 40, C.dim, F(600, 11));
      if (s.final) { box(rx, wy, cw2, wh, C.good, C.ink, 2); fitTxt('TRUE ✓', rx + cw2/2, wy + wh/2 + 1, C.ink, 700, 15, cw2 - 14); }
      else { box(rx, wy, cw2, wh, C.paper, C.off, 1.1, [3,3]); fitTxt(s.win ? 'TRUE 往上傳…' : '—', rx + cw2/2, wy + wh/2 + 1, s.win ? C.curT : C.off, 700, 13, cw2 - 14); }

      /* ---- BAND 2 · board ---- */
      const b2 = 126;
      head('BAND 2 · board   紅 = 目前這層   米 + # = 在路徑上   粉 = 不符   綠 = 還原 / 成功', PAD, b2);
      const cs = 54, cg = 6, gy = 170, gx = Math.max(PAD + 30, X(52));
      const cx = c => gx + c*(cs + cg), cy = r => gy + r*(cs + cg);
      for (let c = 0; c < 4; c++) txt(String(c), cx(c) + cs/2, gy - 20, C.dim, F(600, 12));
      for (let r = 0; r < 3; r++) txt(String(r), gx - 14, cy(r) + cs/2 + 1, C.dim, F(600, 12), 'right');
      txt('c', gx - 14, gy - 20, C.off, F(600, 11), 'right');
      const cells = [];
      for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
        const marked = has(s.marks, r, c), isCur = eq(s.cur, r, c), pr = s.probe && eq(s.probe, r, c) ? s.probe : null;
        const scan = has(s.scan, r, c), rest = eq(s.restored, r, c), win = eq(s.win, r, c);
        let fill = C.paper, st = C.ink, lw = 1.4, dash = null, tc = C.ink, note = '', nc = C.dim;
        if (marked) { fill = C.low; tc = '#9a9a9a'; }
        if (scan) { fill = C.bad; st = C.deep; lw = 1.8; tc = C.deep; note = '≠S'; nc = C.deep; }
        if (rest) { fill = C.good; st = C.ink; lw = 2; note = '還原'; nc = C.ink; }
        if (pr && pr.k === 'bad') { fill = C.bad; st = C.deep; lw = 2.4; tc = C.deep; note = pr.n; nc = C.deep; }
        if (pr && pr.k === 'hash') { st = C.dim; lw = 2.4; dash = [5,3]; note = pr.n; nc = C.ink; }
        if (isCur) { fill = C.cur; st = C.curS; lw = 2.8; tc = '#c9a0a0'; note = s.curNote || ''; nc = C.curT; }
        if (win) { fill = C.good; st = s.final ? C.ink : C.curS; lw = s.final ? 2 : 2.8; tc = C.ink; note = s.final ? '#15 ✓' : '#15 TRUE'; nc = C.ink; }
        if (s.final && marked) { st = C.ink; lw = 2; note = '留 #'; nc = C.deep; }
        cells.push({ r, c, fill, st, lw, dash, tc, note, nc, marked, isCur });
        box(cx(c), cy(r), cs, cs, fill, st, lw, dash);
      }
      // 路徑折線(在字的下面)
      if (s.path && s.path.length > 1) {
        ctx.save(); ctx.globalAlpha = 0.55; ctx.strokeStyle = C.curS; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
        ctx.beginPath(); s.path.forEach((p, k) => { const x = cx(p[1]) + cs/2, y = cy(p[0]) + cs/2; k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke();
        ctx.restore();
      }
      cells.forEach(o => {
        const x = cx(o.c), y = cy(o.r);
        const shown = B[o.r][o.c];
        halo(shown, x + cs/2, y + 22, o.marked ? (o.isCur ? C.curT : '#8a8a8a') : o.tc, F(700, 19), o.fill, 5);
        if (o.note) halo(o.note, x + cs/2, y + 43, o.nc, F(700, 10), o.fill, 4);
        if (o.marked) { box(x + cs - 17, y + 4, 13, 14, o.isCur ? C.curS : C.deep, o.isCur ? C.curS : C.deep, 1); txt('#', x + cs - 10.5, y + 11.5, '#ffffff', F(700, 10)); }
      });
      // 出界:那一側的邊畫深紅粗虛線
      if (s.edge) {
        const x = cx(s.edge.c), y = cy(s.edge.r), e = s.edge.s, o = 1;
        const seg = e === 'T' ? [x+4, y-o, x+cs-4, y-o] : e === 'B' ? [x+4, y+cs+o, x+cs-4, y+cs+o]
                  : e === 'L' ? [x-o, y+4, x-o, y+cs-4] : [x+cs+o, y+4, x+cs+o, y+cs-4];
        line(seg[0], seg[1], seg[2], seg[3], C.deep, 4, [5,3]);
      }

      // 右側 · 四個方向
      const bw = 4*cs + 3*cg, px = gx + bw + Math.max(34, X(34)), pw = w - PAD - px;
      const pn = s.panel;
      const ptitle = pn ? pn.title : (s.scan ? '外層掃起點:board[r][c] ≠ \'S\' 直接 false' : '方向順序:上 → 下 → 左 → 右');
      fitTxt(ptitle, px, gy - 20, pn && pn.fail ? C.deep : (pn ? C.curT : C.dim), 700, 12, pw, 'left');
      const dh = 36, dgap = (3*cs + 2*cg - 4*dh) / 3;
      for (let d = 0; d < 4; d++) {
        const y = gy + d*(dh + dgap), row = pn ? pn.rows[d] : null, isNow = pn && pn.now === d;
        let fill = C.paper, st = C.off, lw = 1.1, dash = [3,3], tc = C.off, t = '—', tgt = '';
        if (row) {
          tgt = row.tgt; t = row.t;
          if (row.k === 'wait') { tc = C.dim; }
          else if (row.k === 'oob') { fill = C.gray; st = C.dim; lw = 1.3; dash = [4,3]; tc = C.dim; }
          else if (row.k === 'hash') { fill = C.low; st = C.dim; lw = 1.3; dash = [4,3]; tc = C.ink; }
          else if (row.k === 'bad') { fill = C.bad; st = C.deep; lw = 1.4; dash = null; tc = C.deep; }
          else if (row.k === 'okF') { fill = C.bad; st = C.deep; lw = 1.4; dash = null; tc = C.deep; }
          else if (row.k === 'ok') { fill = C.cur; st = C.curS; lw = 1.6; dash = null; tc = C.curT; }
          else if (row.k === 'true') { fill = C.good; st = C.ink; lw = 1.6; dash = null; tc = C.ink; }
          if (isNow) { lw = 2.8; if (row.k !== 'oob' && row.k !== 'hash') st = row.k === 'true' ? C.curS : st; dash = null; }
        }
        box(px, y, pw, dh, fill, st, lw, dash);
        const lx = px + 12;
        txt(DN[d], lx, y + dh/2 + 1, row ? (isNow ? C.curT : C.ink) : C.off, '700 14px ' + SANS, 'left');
        txt(tgt, lx + 26, y + dh/2 + 1, row ? C.dim : C.off, F(600, 11.5), 'left');
        const tx0 = lx + 26 + 56;
        fitTxt(t, px + pw - 12, y + dh/2 + 1, tc, 700, 12, px + pw - 12 - tx0, 'right');
      }

      /* ---- BAND 3 · call stack ---- */
      const b3 = 378;
      head('BAND 3 · call stack(左 → 右 = 外 → 內)   紅 = 標了 # 還在跑   粉虛線 = 剛 return false', PAD, b3);
      const fy = b3 + 12, fh = 42, fx0 = PAD + 56, fg = 12, fw = (w - PAD - fx0 - 3*fg) / 4;
      txt('stack', PAD, fy + fh/2 + 1, C.ink, '700 13px '+MONO, 'left');
      for (let k = 0; k < 4; k++) {
        const x = fx0 + k*(fw + fg), f = s.stack[k];
        if (k > 0 && f) {                                   // 箭頭
          const ax = x - fg + 2, ay = fy + fh/2; line(ax, ay, x - 3, ay, f.k === 'pop' ? C.deep : C.dim, 1.4);
        }
        if (!f) { box(x, fy, fw, fh, C.paper, C.off, 1.1, [3,3]); txt('—', x + fw/2, fy + fh/2 + 1, C.off, F(600, 12)); continue; }
        let fill = C.paper, st = C.ink, lw = 1.4, dash = null, t1c = C.ink, t2c = C.dim;
        const top = k === s.stack.length - 1;
        if (f.k === 'main') { fill = C.up; }
        if (f.k === 'live') { fill = top ? C.cur : C.low; st = top ? C.curS : C.ink; lw = top ? 2.6 : 1.4; t1c = top ? C.curT : C.ink; t2c = top ? C.curT : C.dim; }
        if (f.k === 'pop') { fill = C.bad; st = C.deep; lw = 1.8; dash = [5,3]; t1c = C.deep; t2c = C.deep; }
        if (f.k === 'ok') { fill = C.good; st = top && !s.final ? C.curS : C.ink; lw = top && !s.final ? 2.6 : 1.6; t2c = C.ink; }
        box(x, fy, fw, fh, fill, st, lw, dash);
        fitTxt(f.t1, x + fw/2, fy + 13, t1c, 700, 12, fw - 12);
        fitTxt(f.t2, x + fw/2, fy + 30, t2c, 600, 11, fw - 12);
      }

      /* ---- BAND 4 · 這一步 ---- */
      const b4 = 466;
      head('BAND 4 · 這一步', PAD, b4);
      const ly = b4 + 12, lh = 32;
      const fin = s.final;
      box(PAD, ly, w - 2*PAD, lh, fin ? C.good : C.paper, fin ? C.ink : C.off, fin ? 1.8 : 1.4);
      fitTxt(s.line, PAD + 14, ly + lh/2 + 1, C.ink, 700, 12.5, w - 2*PAD - 28, 'left');
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

  mount('v79', STEPS);
})();
