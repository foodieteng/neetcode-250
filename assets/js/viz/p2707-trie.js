/* ============================================================
   P2707 · Extra Characters in a String — 解法 A:Trie + 反向 DP · viz
   dp[start] = s[start..] 這段後綴的最少多餘字元數,dp[n] = 0。
   start 由 n-1 往 0:dp[start] = dp[start+1] + 1(把 s[start] 當多餘),
   再從 root 沿 s[start], s[start+1], … 走 Trie;沒有子節點就 break;
   走到 isWord 節點(結尾 end)→ dp[start] = min(dp[start], dp[end+1])。
   例 s = "leetscode", dict = {"leet","code","leetcode"} → 答案 1
     BAND 1  s 的字元(紅 = 本步 start · 藍 = 這次走過的區段)
     BAND 2  dp[0..9](由右往左填;紅 = dp[start] · 藍 = 讀取的 dp[end+1])
     等式列  本步的轉移
     BAND 3  Trie {leet, code, leetcode}(藍 = 走過的路 · 雙圈 = isWord)
   所有狀態取自實測 trace(內圈迭代共 16 次)。前綴 va- 。
   ============================================================ */
(function () {
  const canvas = document.getElementById('va-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('va-step'), labelEl = document.getElementById('va-label');
  const bPrev = document.getElementById('va-prev'), bNext = document.getElementById('va-next'),
        bPlay = document.getElementById('va-play'), bReset = document.getElementById('va-reset');

  const C = { paper:'#ffffff', ink:'#1a1a1a', dim:'#9a9a9a', cell:'#ffffff',
    tint:'#e3edf5', tint2:'#f6ead8',
    red:'#cf3535', redBg:'#fbe1e1', redT:'#992424',
    good:'#d9e8c7', bad:'#f0d4d4', off:'#cfcfcf' };
  const MONO = '"JetBrains Mono", "Noto Sans TC", monospace', SANS = '"Noto Sans TC", sans-serif';

  const S = 'leetscode', N = S.length;   // 9
  const _ = null;

  /* Trie 節點:id 0 = root;第一列 1..8 = l e e t c o d e;第二列 9..12 = c o d e */
  const NODES = [
    { ch:'root', row:0, col:0 },
    { ch:'l', row:0, col:1 }, { ch:'e', row:0, col:2 }, { ch:'e', row:0, col:3 }, { ch:'t', row:0, col:4, word:'leet' },
    { ch:'c', row:0, col:5 }, { ch:'o', row:0, col:6 }, { ch:'d', row:0, col:7 }, { ch:'e', row:0, col:8, word:'leetcode' },
    { ch:'c', row:1, col:1 }, { ch:'o', row:1, col:2 }, { ch:'d', row:1, col:3 }, { ch:'e', row:1, col:4, word:'code' },
  ];
  const EDGES = [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[0,9],[9,10],[10,11],[11,12]];

  /* starts:紅色 start 們;span:[a,b] 走過的 s 區段;read:讀取的 dp 索引;
     path:走過的 trie 節點;cur:目前節點;brk:{node, chars, msg};bad:s 中標壞的索引;
     unreached:leetcode 後半變灰;final:結束 */
  const steps = [
    { dp:[_,_,_,_,_,_,_,_,_,0], starts:[], span:null, read:9, path:[], cur:-1, brk:null, cnt:0,
      eq:'dp[9] = 0   (空後綴不需要刪任何字元)',
      text:'<strong>INITIAL</strong> · <code>dp[start]</code> = 後綴 <code>s[start..]</code> 的最少多餘字元數。<code>dp[9] = 0</code>(空字串)。接著 <code>start</code> 由 8 往 0 倒著填,每個 start 都從 Trie 的 <code>root</code> 出發往下走。' },
    { dp:[_,_,_,_,_,_,3,2,1,0], starts:[6,7,8], span:null, read:-1, path:[0], cur:0,
      brk:{ node:0, chars:'e d o', msg:'✗ 沒有子節點' }, cnt:3,
      eq:'dp[8] = dp[9]+1 = 1 · dp[7] = dp[8]+1 = 2 · dp[6] = dp[7]+1 = 3',
      text:'<code>start = 8, 7, 6</code> · 先設 <code>dp[start] = dp[start+1] + 1</code>。<code>root</code> 只有 <code>l</code>、<code>c</code> 兩個子節點,<code>\'e\' \'d\' \'o\'</code> 都不在 ⇒ <b>第一步就 break</b>。dp = 1, 2, 3。' },
    { dp:[_,_,_,_,_,0,3,2,1,0], starts:[5], span:[5,8], read:9, path:[0,9,10,11,12], cur:12, brk:null, cnt:7,
      eq:'dp[5] = min(dp[6]+1 = 4, dp[9] = 0) = 0',
      text:'<code>start = 5</code> · 初值 <code>dp[6]+1 = 4</code>。沿 <code>c → o → d → e</code> 走,到 <code>end = 8</code> 碰到 <b>isWord "code"</b> ⇒ 比較 <code>dp[end+1] = dp[9] = 0</code>,<code>dp[5] = 0</code>。s 也走完了,迴圈自然結束。' },
    { dp:[_,4,3,2,1,0,3,2,1,0], starts:[1,2,3,4], span:null, read:-1, path:[0], cur:0,
      brk:{ node:0, chars:'s t e e', msg:'✗ 沒有子節點' }, cnt:11,
      eq:'dp[4] = dp[5]+1 = 1 · dp[3] = 2 · dp[2] = 3 · dp[1] = 4',
      text:'<code>start = 4, 3, 2, 1</code> · 首字元 <code>\'s\' \'t\' \'e\' \'e\'</code> 都不是 <code>root</code> 的子節點 ⇒ 全部 <b>立刻 break</b>,只能「刪掉自己」:<code>dp[start] = dp[start+1] + 1</code> → 1, 2, 3, 4。' },
    { dp:[1,4,3,2,1,0,3,2,1,0], starts:[0], span:[0,3], read:4, path:[0,1,2,3,4], cur:4, brk:null, cnt:15,
      eq:'dp[0] = min(dp[1]+1 = 5, dp[4] = 1) = 1',
      text:'<code>start = 0</code> · 初值 <code>dp[1]+1 = 5</code>。沿 <code>l → e → e → t</code> 走,在 <code>end = 3</code> 碰到 <b>isWord "leet"</b> ⇒ 比較 <code>dp[4] = 1</code>,<code>dp[0] = 1</code>。但迴圈還沒結束,Trie 還能往下走嗎?' },
    { dp:[1,4,3,2,1,0,3,2,1,0], starts:[0], span:[0,3], read:-1, path:[0,1,2,3,4], cur:4,
      brk:{ node:4, chars:'s', msg:'✗ "leet" 沒有子節點 \'s\'' }, bad:[4], unreached:true, cnt:16,
      eq:'end = 4:s[4] = \'s\' ∉ children("leet") = {c}  → break,dp[0] 維持 1',
      text:'<code>end = 4</code> · 下一個字元是 <code>\'s\'</code>,但 "leet" 節點只有子節點 <code>c</code> ⇒ <b>BREAK</b>。<code>"leetcode"</code> 那條路(灰色)<strong>永遠走不到</strong> —— 這正是 Trie 的剪枝:前綴不存在就不用再試更長的詞。' },
    { dp:[1,4,3,2,1,0,3,2,1,0], starts:[], span:null, read:-1, path:[], cur:-1, brk:null, final:true, cnt:16,
      eq:'答案 = dp[0] = 1   ("leet" + 多餘的 \'s\' + "code")',
      text:'<strong>完成</strong> · 答案 <code>dp[0] = 1</code>:切成 <code>"leet"</code> + <code>\'s\'</code>(多餘)+ <code>"code"</code>。最終 <code>dp = [1,4,3,2,1,0,3,2,1,0]</code>,內圈共 16 次迭代。複雜度 <strong>O(n² + 總字典長)</strong>。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||460; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function txt(s,x,y,font,color,align,base){ ctx.font=font; ctx.fillStyle=color; ctx.textAlign=align||'left'; ctx.textBaseline=base||'alphabetic'; ctx.fillText(s,x,y); }
  function circle(x,y,r){ ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); }

  function cellBox(x,y,cw,ch,style,val,font){
    rr(x,y,cw,ch,5); ctx.fillStyle=style.bg; ctx.fill();
    ctx.setLineDash(style.dash?[4,3]:[]); ctx.lineWidth=style.lw||1.6; ctx.strokeStyle=style.bd; ctx.stroke(); ctx.setLineDash([]);
    if(val!==null && val!==undefined) txt(String(val), x+cw/2, y+ch/2+1, font, style.tx, 'center', 'middle');
  }

  function draw(){
    fit();
    const s=steps[step], w=canvas.clientWidth, h=canvas.clientHeight, PAD=22;
    ctx.fillStyle=C.paper; ctx.fillRect(0,0,w,h); ctx.setLineDash([]);

    const X0=PAD+42, colW=(w-X0-PAD)/10, cg=Math.min(8, colW*0.14), cw=colW-cg;
    const cx=k=>X0+k*colW+cg/2;
    const starts=new Set(s.starts), bad=new Set(s.bad||[]);

    /* ---------- BAND 1 · s ---------- */
    const B1=18, sy=B1+32, sh=36;
    txt('BAND 1 · s   紅 = 本步 start   藍 = 這次在 Trie 走過的字元', PAD, B1, '600 11.5px '+MONO, C.dim);
    txt('s', PAD+14, sy+sh/2+1, '700 15px '+MONO, C.ink, 'center', 'middle');
    for(let k=0;k<N;k++){
      const x=cx(k);
      const isStart=starts.has(k), inSpan=s.span && k>s.span[0] && k<=s.span[1];
      let st={bg:C.cell, bd:C.ink, tx:C.ink, lw:1.6};
      if(inSpan) st={bg:C.tint, bd:C.ink, tx:C.ink, lw:2};
      if(isStart) st={bg:C.redBg, bd:C.red, tx:C.redT, lw:2.8};
      if(bad.has(k)) st={bg:C.bad, bd:C.red, tx:C.redT, lw:2.4, dash:true};
      if(s.final) st = k===4 ? {bg:C.bad, bd:C.ink, tx:C.ink, lw:2} : {bg:C.good, bd:C.ink, tx:C.ink, lw:1.6};
      txt(String(k), x+cw/2, sy-13, '700 10.5px '+MONO, isStart?C.redT:C.dim, 'center', 'middle');
      cellBox(x,sy,cw,sh,st,S[k],'700 17px '+MONO);
    }
    if(s.final){ // 片段標籤
      const seg=(a,b,t)=>{ const xa=cx(a), xb=cx(b)+cw; txt(t,(xa+xb)/2,sy+sh+13,'700 10.5px '+MONO,C.ink,'center','middle'); };
      seg(0,3,'"leet"'); seg(4,4,'多餘'); seg(5,8,'"code"');
    }

    /* ---------- BAND 2 · dp ---------- */
    const B2=sy+sh+42, dy=B2+30, dh=38;
    txt('BAND 2 · dp[start] = s[start..] 的最少多餘   ← 由右往左填', PAD, B2, '600 11.5px '+MONO, C.red);
    txt('dp', PAD+14, dy+dh/2+1, '700 15px '+MONO, C.ink, 'center', 'middle');
    for(let k=0;k<=N;k++){
      const x=cx(k), v=s.dp[k];
      let st = v===null ? {bg:C.cell, bd:C.off, tx:C.off, lw:1.4, dash:true} : {bg:C.cell, bd:C.ink, tx:C.ink, lw:1.6};
      if(k===s.read) st={bg:C.tint, bd:C.ink, tx:C.ink, lw:2.6};
      if(starts.has(k)) st={bg:C.redBg, bd:C.red, tx:C.redT, lw:2.8};
      if(s.final && k===0) st={bg:C.good, bd:C.ink, tx:C.ink, lw:3};
      txt(String(k), x+cw/2, dy-13, '700 10.5px '+MONO, starts.has(k)?C.redT:C.dim, 'center', 'middle');
      cellBox(x,dy,cw,dh,st, v===null?'?':v, '700 16px '+MONO);
    }

    /* ---------- 等式列 ---------- */
    const ey=dy+dh+18, eh=34;
    rr(PAD,ey,w-2*PAD,eh,6); ctx.fillStyle=s.final?C.good:(step===0?C.cell:C.tint2); ctx.fill();
    ctx.lineWidth=1.6; ctx.strokeStyle=C.ink; ctx.stroke();
    let ef='700 13px '+MONO; ctx.font=ef; if(ctx.measureText(s.eq).width>w-2*PAD-20) ef='700 11.5px '+MONO;
    txt(s.eq, w/2, ey+eh/2+1, ef, C.ink, 'center', 'middle');

    /* ---------- BAND 3 · Trie ---------- */
    const B3=ey+eh+34;
    txt('BAND 3 · Trie   藍 = 走過   雙圈 = isWord   紅圈 = cur', PAD, B3, '600 11.5px '+MONO, C.dim);
    txt('內圈迭代 '+s.cnt+' / 16', w-PAD, B3, '700 11.5px '+MONO, C.ink, 'right');
    const R=16, tW=(w-2*PAD)/9, Y1=B3+56, Y2=Y1+70;
    const pos=id=>{ const n=NODES[id]; return [PAD+(n.col+0.5)*tW, n.row?Y2:Y1]; };
    const onPath=new Set(s.path);
    const greyed=id=>s.unreached && id>=5 && id<=8;

    // edges
    for(const [a,b] of EDGES){
      const [x1,y1]=pos(a),[x2,y2]=pos(b), ang=Math.atan2(y2-y1,x2-x1);
      const walked=onPath.has(a)&&onPath.has(b);
      ctx.setLineDash(greyed(b)?[4,4]:[]);
      ctx.strokeStyle=walked?C.ink:(greyed(b)?C.off:C.off); ctx.lineWidth=walked?3:1.6;
      ctx.beginPath(); ctx.moveTo(x1+Math.cos(ang)*(R+2),y1+Math.sin(ang)*(R+2)); ctx.lineTo(x2-Math.cos(ang)*(R+2),y2-Math.sin(ang)*(R+2)); ctx.stroke();
    }
    ctx.setLineDash([]);
    // nodes
    for(let id=0;id<NODES.length;id++){
      const n=NODES[id], [x,y]=pos(id), walked=onPath.has(id), g=greyed(id);
      circle(x,y,R); ctx.fillStyle=walked?C.tint:C.cell; ctx.fill();
      ctx.setLineDash(g?[3,3]:[]); ctx.lineWidth=walked?2.2:1.6; ctx.strokeStyle=g?C.off:C.ink; ctx.stroke();
      if(n.word){ circle(x,y,R-4); ctx.lineWidth=1.4; ctx.stroke(); }
      ctx.setLineDash([]);
      if(id===s.cur){ circle(x,y,R+5); ctx.lineWidth=2.6; ctx.strokeStyle=C.red; ctx.stroke(); }
      txt(n.ch, x, y+1, (id===0?'700 9.5px ':'700 14px ')+MONO, g?C.off:C.ink, 'center', 'middle');
      if(n.word){
        const hit = (id===s.cur && !s.brk) || (s.final && id!==8);
        const ly = n.row ? y+R+18 : y-R-16;
        const label='★ '+n.word, tw=(ctx.font='700 10.5px '+MONO, ctx.measureText(label).width+14);
        rr(x-tw/2, ly-9, tw, 18, 9); ctx.fillStyle=g?C.cell:(hit?C.good:C.cell); ctx.fill();
        ctx.setLineDash(g?[3,3]:[]); ctx.lineWidth=hit?2:1.2; ctx.strokeStyle=g?C.off:C.ink; ctx.stroke(); ctx.setLineDash([]);
        txt(label, x, ly+1, '700 10.5px '+MONO, g?C.off:C.ink, 'center', 'middle');
      }
    }
    if(s.unreached){
      const [x5]=pos(5),[x8]=pos(8);
      txt('永遠走不到', (x5+x8)/2, Y1-R-16, '700 11px '+SANS, C.dim, 'center', 'middle');
    }
    // break marker
    if(s.brk){
      const [x,y]=pos(s.brk.node);
      const gx = s.brk.node===0 ? x : x+tW, gy=Y2;
      ctx.font='700 13px '+MONO; const pw=Math.max(32, ctx.measureText(s.brk.chars).width+18), ph=28;
      const ang=Math.atan2(gy-ph/2-y,gx-x);
      ctx.setLineDash([4,3]); ctx.strokeStyle=C.red; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(x+Math.cos(ang)*(R+6),y+Math.sin(ang)*(R+6)); ctx.lineTo(gx, gy-ph/2-3); ctx.stroke();
      rr(gx-pw/2, gy-ph/2, pw, ph, ph/2); ctx.fillStyle=C.bad; ctx.fill(); ctx.strokeStyle=C.red; ctx.stroke(); ctx.setLineDash([]);
      txt(s.brk.chars, gx, gy+1, '700 13px '+MONO, C.redT, 'center', 'middle');
      if(s.brk.node===0) txt(s.brk.msg, Math.max(PAD, gx-pw/2), gy+ph/2+16, '700 11.5px '+MONO, C.redT, 'left', 'middle');
      else txt(s.brk.msg, gx+pw/2+12, gy+1, '700 11.5px '+MONO, C.redT, 'left', 'middle');
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
})();
