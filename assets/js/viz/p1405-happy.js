/* ============================================================
   P1405 · Longest Happy String — 最大堆貪心 · viz
     while (!pq.empty()) {
       auto [cnt1, ch1] = pq.top(); pq.pop();
       if (n >= 2 && res 結尾兩個都是 ch1) {
         if (pq.empty()) return res;
         auto [cnt2, ch2] = pq.top(); pq.pop();
         res += ch2; if (--cnt2) pq.push({cnt2, ch2});
       }
       res += ch1; if (--cnt1) pq.push({cnt1, ch1});
     }
   例 (a,b,c) = (1,1,7) → "ccbccacc"(長度 8 = 2·(1+1+1)+2),g++ 實跑 trace:
     it1 c7 → "c" · it2 c6 → "cc" · it3 c5 被擋 → 墊 b → "ccbc"
     it4 c4 → "ccbcc" · it5 c3 被擋 → 墊 a → "ccbccac" · it6 c2 → "ccbccacc"
     it7 c1 被擋,pq 空 → return(c 剩 1 個沒用)
     BAND 1  res 一格一格長出來(紅 = 剛放的 ch1、深紅 = 墊的 ch2、被擋時結尾兩格深紅底)
     BAND 2  max-heap:每個字元一排 count 格 + 這一步的角色(ch1 / ch2)
     BAND 3  檢查「res 結尾兩個都是 ch1?」→ 被擋 / 可以放 + 動作
   前綴 v1405- 。
   ============================================================ */
(function () {
  const canvas = document.getElementById('v1405-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('v1405-step'), labelEl = document.getElementById('v1405-label');
  const bPrev = document.getElementById('v1405-prev'), bNext = document.getElementById('v1405-next'),
        bPlay = document.getElementById('v1405-play'), bReset = document.getElementById('v1405-reset');

  const C = { paper:'#ffffff', ink:'#1f1f1f', dim:'#5a5a5a', off:'#cfcfcf',
    up:'#e3edf5', low:'#f6ead8',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424',
    good:'#d9e8c7', bad:'#f0d4d4', deep:'#a31d1d' };
  const MONO = '"JetBrains Mono", monospace', SANS = '"Noto Sans TC", sans-serif';

  const LEN = 8, MAXC = 7, CH = ['c', 'b', 'a'];

  /* res:目前字串;nw:[[index, 'ch1'|'ch2'], ...] 這步新放的;blk:結尾兩格被擋;
     rows:{ch: [count, role, used, note]} role = 'ch1'|'ch2'|null,used = 這步用掉一格;
     pq:堆的內容(max 在前);chk:[文字, 'ok'|'bad'|'none'];act:動作;fin:最後一步 */
  const S = (res, nw, blk, rows, pq, chk, act, text, fin) => ({ res, nw, blk, rows, pq, chk, act, text, fin: !!fin });
  const R = (c, b, a) => ({ c, b, a });

  const STEPS = [
    S('', [], false,
      R([7, null, 0, '在堆裡'], [1, null, 0, '在堆裡'], [1, null, 0, '在堆裡']),
      'c7, b1, a1', ['res 還是空的', 'none'], '初始:count > 0 的才 push',
      '<strong>INITIAL</strong> · <code>(a,b,c) = (1,1,7)</code>。最大堆依 <b>剩餘數量</b> 排,每次拿 <b>剩最多</b> 的字元 <code>ch1</code>。<strong>規則:res 結尾兩個都是 ch1 就被擋,先墊一個第二多的 ch2。</strong>'),
    S('c', [[0, 'ch1']], false,
      R([6, 'ch1', 1, 'pop c7 → 放 c,剩 6 推回'], [1, null, 0, '在堆裡'], [1, null, 0, '在堆裡']),
      'c6, b1, a1', ['n = 0 < 2 → 可以放', 'ok'], 'res += c;--cnt1 = 6 → push',
      '<strong>it1</strong> · pop <code>c7</code>。res 是空的,不可能被擋 → <strong>放 c</strong>,c 剩 6 推回堆。'),
    S('cc', [[1, 'ch1']], false,
      R([5, 'ch1', 1, 'pop c6 → 放 c,剩 5 推回'], [1, null, 0, '在堆裡'], [1, null, 0, '在堆裡']),
      'c5, b1, a1', ['n = 1 < 2 → 可以放', 'ok'], 'res += c;--cnt1 = 5 → push',
      '<strong>it2</strong> · pop <code>c6</code>。res 只有 1 個字 → <strong>放 c</strong>,res = <code>"cc"</code>。'),
    S('cc', [], true,
      R([5, 'ch1', 0, 'pop c5 → 先拿在手上'], [1, null, 0, '在堆裡'], [1, null, 0, '在堆裡']),
      'b1, a1', ['結尾 "cc" 都是 c → 被擋', 'bad'], 'pq 不空 → 去拿第二多的 ch2',
      '<strong>it3 · 偵測</strong> · pop <code>c5</code>,但 res 結尾 <code>"cc"</code>(深紅)<strong>已經兩個 c</strong>,再放就變 <code>"ccc"</code>。堆裡還有東西 → 準備墊一個。'),
    S('ccbc', [[2, 'ch2'], [3, 'ch1']], false,
      R([4, 'ch1', 1, '放 c,剩 4 推回'], [0, 'ch2', 1, 'pop b1 → 放 b,剩 0 不推'], [1, null, 0, '在堆裡']),
      'c4, a1', ['墊了 b,結尾 "cb" → 可以放', 'ok'], 'res += b;res += c;c 剩 4 推回',
      '<strong>it3 · 墊 ch2 再放 ch1</strong> · pop <code>b1</code> 放 <code>b</code>(b 用完不推回),<b>同一輪</b>接著放 <code>c</code>。res = <code>"ccbc"</code>,c 剩 4。'),
    S('ccbcc', [[4, 'ch1']], false,
      R([3, 'ch1', 1, 'pop c4 → 放 c,剩 3 推回'], [0, null, 0, '用完'], [1, null, 0, '在堆裡']),
      'c3, a1', ['結尾 "bc" → 可以放', 'ok'], 'res += c;--cnt1 = 3 → push',
      '<strong>it4</strong> · pop <code>c4</code>。結尾 <code>"bc"</code> 不是兩個 c → <strong>放 c</strong>,res = <code>"ccbcc"</code>。'),
    S('ccbcc', [], true,
      R([3, 'ch1', 0, 'pop c3 → 先拿在手上'], [0, null, 0, '用完'], [1, null, 0, '在堆裡']),
      'a1', ['結尾 "cc" 都是 c → 被擋', 'bad'], 'pq 不空 → 去拿第二多的 ch2',
      '<strong>it5 · 偵測</strong> · pop <code>c3</code>,結尾又是 <code>"cc"</code> → <strong>被擋</strong>。堆裡還剩 <code>a1</code>。'),
    S('ccbccac', [[5, 'ch2'], [6, 'ch1']], false,
      R([2, 'ch1', 1, '放 c,剩 2 推回'], [0, null, 0, '用完'], [0, 'ch2', 1, 'pop a1 → 放 a,剩 0 不推']),
      'c2', ['墊了 a,結尾 "ca" → 可以放', 'ok'], 'res += a;res += c;c 剩 2 推回',
      '<strong>it5 · 墊 ch2 再放 ch1</strong> · pop <code>a1</code> 放 <code>a</code>,接著放 <code>c</code>。res = <code>"ccbccac"</code>。<b>a、b 都用完了</b>,之後沒東西可以墊。'),
    S('ccbccacc', [[7, 'ch1']], false,
      R([1, 'ch1', 1, 'pop c2 → 放 c,剩 1 推回'], [0, null, 0, '用完'], [0, null, 0, '用完']),
      'c1', ['結尾 "ac" → 可以放', 'ok'], 'res += c;--cnt1 = 1 → push',
      '<strong>it6</strong> · pop <code>c2</code>。結尾 <code>"ac"</code> → <strong>放 c</strong>,res = <code>"ccbccacc"</code>。'),
    S('ccbccacc', [], true,
      R([1, 'ch1', 0, 'pop c1 → 被擋,放不下'], [0, null, 0, '用完'], [0, null, 0, '用完']),
      '', ['結尾 "cc" 都是 c → 被擋', 'bad'], 'pq.empty() → return res',
      '<strong>it7</strong> · pop <code>c1</code>,結尾 <code>"cc"</code> → <strong>被擋</strong>。可是堆已經空了,<b>沒有 ch2 可以墊</b> → 直接 <code>return res</code>。'),
    S('ccbccacc', [], false,
      R([1, null, 0, '剩 1 個沒用到'], [0, null, 0, '用完'], [0, null, 0, '用完']),
      '', ['長度 8 = 2·(1+1+1) + 2', 'ok'], 'return "ccbccacc"',
      '<strong>完成</strong> · 回傳 <code>"ccbccacc"</code>,長度 <strong>8</strong>。c 有 7 個但只放得下 6 個:a、b 共 2 個把 c 切成 3 段,每段最多 2 個 → <code>2·(1+1+1) + 2 = 8</code>,c 剩 1 個沒用。', true),
  ];

  let step = 0, timer = null;

  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||350; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function box(x,y,w,h,fill,stroke,lw,dash){ rr(x,y,w,h,4); ctx.fillStyle=fill; ctx.fill(); ctx.lineWidth=lw||1.4; if(dash) ctx.setLineDash(dash); ctx.strokeStyle=stroke; ctx.stroke(); ctx.setLineDash([]); }
  function txt(s,x,y,color,font,align,base){ ctx.fillStyle=color; ctx.font=font; ctx.textAlign=align||'center'; ctx.textBaseline=base||'middle'; ctx.fillText(s,x,y); }
  function head(s,x,y){ txt(s,x,y,C.dim,'600 12px '+MONO+', '+SANS,'left','alphabetic'); }

  const B1 = 18, B2 = 136, B3 = 264;

  function draw(){
    fit();
    const s = STEPS[step], w = canvas.clientWidth, H = canvas.clientHeight, PAD = 22, inner = w - 2*PAD;
    ctx.fillStyle = C.paper; ctx.fillRect(0,0,w,H); ctx.setLineDash([]);

    /* ---------- BAND 1 · res ---------- */
    head('BAND 1 · res   紅 = 剛放的 ch1　深紅 = 墊的 ch2', PAD, B1);
    const tagW = 44, cg = 8;
    const cw = Math.min(84, (inner - tagW - (LEN - 1)*cg) / LEN), ch = 38;
    const x0 = PAD + tagW, idxY = B1 + 22, cTop = B1 + 34;
    txt('res', PAD, cTop + ch/2 + 1, C.ink, '700 13px '+MONO, 'left', 'middle');
    const n = s.res.length;
    for (let i = 0; i < LEN; i++) {
      const x = x0 + i*(cw + cg);
      txt(String(i), x + cw/2, idxY, C.dim, '600 10.5px '+MONO, 'center', 'middle');
      if (i >= n) { box(x, cTop, cw, ch, C.paper, C.off, 1.1, [3,3]); continue; }
      const nw = s.nw.find(p => p[0] === i);
      let fill = C.up, st = C.ink, tc = C.ink, lw = 1.4;
      if (s.fin) { fill = C.good; }
      else if (nw && nw[1] === 'ch1') { fill = C.cur; st = C.curS; tc = C.curT; lw = 2.4; }
      else if (nw && nw[1] === 'ch2') { fill = C.bad; st = C.deep; tc = C.deep; lw = 2.4; }
      else if (s.blk && i >= n - 2) { fill = C.bad; st = C.deep; tc = C.deep; lw = 2.4; }
      box(x, cTop, cw, ch, fill, st, lw);
      txt(s.res[i], x + cw/2, cTop + ch/2 + 1, tc, '700 16px '+MONO);
    }
    const capY = cTop + ch + 16;
    if (s.blk && n >= 2) {
      const xa = x0 + (n - 2)*(cw + cg), xb = x0 + (n - 1)*(cw + cg) + cw;
      txt('結尾兩個都是 c', (xa + xb)/2, capY, C.deep, '700 11px '+SANS, 'center', 'middle');
    } else if (s.fin) {
      txt('len = 8', x0 + (LEN - 1)*(cw + cg) + cw, capY, C.ink, '700 11.5px '+MONO, 'right', 'middle');
    }

    /* ---------- BAND 2 · max-heap ---------- */
    head('BAND 2 · max-heap(依剩餘數量)', PAD, B2);
    txt('pq = [' + s.pq + ']', w - PAD, B2, s.pq ? C.ink : C.deep, '700 12px '+MONO, 'right', 'alphabetic');
    const rh = 24, rg = 8, rTop = B2 + 14;
    const sg = 5, sq = Math.min(40, inner * 0.42 / MAXC - sg), slotX = PAD + tagW;
    const chipX = slotX + MAXC*(sq + sg) + 10, chipW = 44;
    const noteX = chipX + chipW + 12;
    for (let r = 0; r < 3; r++) {
      const c = CH[r], [cnt, role, used, note] = s.rows[c], y = rTop + r*(rh + rg);
      txt(c, PAD + 6, y + rh/2 + 1, C.ink, '700 15px '+MONO, 'left', 'middle');
      const held = role === 'ch1' && !used;            // 拿在手上(不在堆裡)
      for (let j = 0; j < MAXC; j++) {
        const x = slotX + j*(sq + sg);
        if (j < cnt) {
          let fill = C.low, st = C.ink;
          if (held) { fill = C.cur; st = C.curS; }
          box(x, y + 1, sq, rh - 2, fill, st, held ? 2 : 1.2);
        } else if (used && j === cnt) {
          box(x, y + 1, sq, rh - 2, C.paper, role === 'ch2' ? C.deep : C.curS, 2, [3,2]);
        } else if (j < (c === 'c' ? 7 : 1)) {
          box(x, y + 1, sq, rh - 2, C.paper, C.off, 1, [2,3]);
        }
      }
      if (role) {
        const isC1 = role === 'ch1';
        box(chipX, y, chipW, rh, isC1 ? C.cur : C.bad, isC1 ? C.curS : C.deep, 2);
        txt(role, chipX + chipW/2, y + rh/2 + 1, isC1 ? C.curT : C.deep, '700 12px '+MONO);
      } else {
        box(chipX, y, chipW, rh, C.paper, C.off, 1, [3,3]);
      }
      const nc = role ? (role === 'ch1' ? C.curT : C.deep) : (cnt ? C.ink : C.dim);
      txt(note, noteX, y + rh/2 + 1, nc, '700 11.5px '+MONO+', '+SANS, 'left', 'middle');
    }

    /* ---------- BAND 3 · 這一步 ---------- */
    head('BAND 3 · res 結尾兩個都是 ch1?', PAD, B3);
    const by = B3 + 12, bh = 32;
    const kind = s.chk[1];
    const verdict = kind === 'bad' ? '被擋' : kind === 'ok' ? (s.fin ? '完成' : '可以放') : '—';
    const w0 = 76;
    box(PAD, by, w0, bh, kind === 'bad' ? C.bad : kind === 'ok' ? C.good : C.paper,
        kind === 'bad' ? C.deep : kind === 'ok' ? C.ink : C.off, kind === 'bad' ? 2.2 : 1.4, kind === 'none' ? [3,3] : null);
    txt((kind === 'bad' ? '× ' : kind === 'ok' ? '● ' : '') + verdict, PAD + w0/2, by + bh/2 + 1,
        kind === 'bad' ? C.deep : kind === 'ok' ? C.ink : C.dim, '700 12.5px '+SANS);
    box(PAD + w0 + 10, by, inner - w0 - 10, bh, C.paper, kind === 'none' ? C.off : C.ink, 1.4, kind === 'none' ? [3,3] : null);
    txt(s.chk[0], PAD + w0 + 22, by + bh/2 + 1, kind === 'bad' ? C.deep : (kind === 'none' ? C.dim : C.ink),
        '700 12px '+MONO+', '+SANS, 'left', 'middle');
    const ay = by + bh + 12;
    box(PAD, ay, inner, bh, s.fin ? C.good : C.paper, C.ink, 1.4);
    txt('動作  ' + s.act, PAD + 12, ay + bh/2 + 1, C.ink, '700 12px '+MONO+', '+SANS, 'left', 'middle');
  }

  function update(){ if(stepEl) stepEl.textContent=String(step).padStart(2,'0')+' / '+String(STEPS.length-1).padStart(2,'0'); if(labelEl) labelEl.innerHTML=STEPS[step].text; draw(); }
  function next(){ if(step<STEPS.length-1){step++;update();}else stop(); }
  function prev(){ if(step>0){step--;update();} }
  function reset(){ stop(); step=0; update(); }
  function play(){ if(timer){stop();return;} bPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=STEPS.length-1){stop();return;} next(); },2200); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} if(bPlay) bPlay.textContent='Play'; }
  bPrev&&bPrev.addEventListener('click',prev); bNext&&bNext.addEventListener('click',next); bPlay&&bPlay.addEventListener('click',play); bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();}); if(window.ResizeObserver){ new ResizeObserver(()=>{fit();draw();}).observe(canvas); }
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw); fit(); update();
})();
