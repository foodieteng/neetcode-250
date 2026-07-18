/* ============================================================
   P10 · Regular Expression Matching — 兩字串 DP · '*' 兩分支 · viz
   dp[i][j] = s 前 i 字能否被 p 前 j 字完整匹配。
   ── 字母 / '.' :s[i-1]==p[j-1] 或 p[j-1]=='.' → 看左上 dp[i-1][j-1]
   ── '*'(零或多個前一字元 p[j-2]):
        零次   : dp[i][j-2]                              (跳過 "x*")
        一次以上: (p[j-2]==s[i-1] 或 '.') && dp[i-1][j]   (吃掉一個 s 字,留著 "x*")
   base: dp[0][0]=T;第一列 dp[0][j] 只有 "x*"(零次)能配空字串。
   例 s="aab", p="c*a*b" → true(c* 配零個 c,a* 配兩個 a,b 配 b)。
     LEFT   dp grid(紅=本格 · 藍=來源 · 綠=答案)
     RIGHT  本格套用哪條規則
   ============================================================ */
(function () {
  const canvas = document.getElementById('viz-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('viz-step'), labelEl = document.getElementById('viz-label');
  const bPrev = document.getElementById('viz-prev'), bNext = document.getElementById('viz-next'),
        bPlay = document.getElementById('viz-play'), bReset = document.getElementById('viz-reset');

  const COLOR = { paper:'#ffffff', ink:'#1a1a1a', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf',
    cell:'#fafaf6', cellS:'#cfcfcf', src:'#dbe8f6', srcS:'#4478c0', srcT:'#2f5f9e',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424', done:'#d9e8c7', doneS:'#5fa866', doneT:'#3f7a3a',
    tF:'#e6e6e0', coral:'#cf3535' };

  const S = 'aab', P = 'c*a*b';
  const R = 4, C = 6;   // (m+1) x (n+1)
  const DP = [
    [1,0,1,0,1,0],
    [0,0,0,1,1,0],
    [0,0,0,0,1,0],
    [0,0,0,0,0,1],
  ];
  const scol = ['∅','a','a','b'];     // 列標(s)
  const pcol = ['∅','c','*','a','*','b']; // 欄標(p)

  const steps = [
    { fill:['0,0'], cur:null, src:[], rule:'base',
      text:'<strong>INITIAL</strong> · <code>s="aab"</code>、<code>p="c*a*b"</code>。<code>dp[i][j]</code> = <code>s</code> 前 i 字能否被 <code>p</code> 前 j 字<strong>完整</strong>匹配。<code>dp[0][0]=T</code>(空配空)。' },
    { fillRow0:true, cur:null, hi:['0,2','0,4'], src:[], rule:'row0',
      text:'<strong>第一列(空 s)</strong> · 只有 <code>"x*"</code> 能配空字串(<strong>零次</strong>)。<code>dp[0][2]=T</code>(<code>c*</code>=零個 c),<code>dp[0][4]=T</code>(<code>c*a*</code>=零個)。這就是 <code>*</code> 的「零次」分支。' },
    { fillTo:[1,3], cur:{i:1,j:3}, src:[{i:0,j:2}], rule:'letter',
      text:'<strong>字母匹配</strong> · <code>dp[1][3]</code>:<code>p[2]=\'a\'</code> == <code>s[0]=\'a\'</code> → 看<strong>左上</strong> <code>dp[0][2]=T</code> → <strong>T</strong>。字母 / <code>.</code> 對上就退到左上。' },
    { fillTo:[2,4], cur:{i:2,j:4}, src:[{i:1,j:4}], rule:'starMore',
      text:'<strong>* 一次以上</strong> · <code>dp[2][4]</code>:<code>p[4]=\'*\'</code>、前一字 <code>p[3]=\'a\'</code> == <code>s[1]=\'a\'</code> → 看<strong>上方</strong> <code>dp[1][4]=T</code>。<code>a*</code> <strong>再吃一個 a</strong>(第二個)→ <strong>T</strong>。' },
    { fillTo:[3,5], cur:{i:3,j:5}, src:[{i:2,j:4}], rule:'letter', done:true,
      text:'<strong>ANSWER</strong> · <code>dp[3][5]</code>:<code>p[4]=\'b\'</code> == <code>s[2]=\'b\'</code> → 左上 <code>dp[2][4]=T</code> → <strong>T</strong>。<code>"c*a*b"</code> 完整匹配 <code>"aab"</code> → <strong>true</strong>。' },
  ];

  function shown(step, i, j){
    const s=steps[step];
    if(s.fill) return s.fill.includes(i+','+j);
    if(s.fillRow0) return i===0;
    if(s.fillTo){ // 全部第0列 + 到 (I,J) 為止(逐列逐欄)
      const [I,J]=s.fillTo;
      if(i===0) return true;
      if(i<I) return true;
      if(i===I) return j<=J;
      return false;
    }
    return false;
  }

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,h=canvas.clientHeight,PAD=26;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,h);
    const done=!!s.done;
    const srcSet=new Set((s.src||[]).map(p=>p.i+','+p.j));
    const hiSet=new Set(s.hi||[]);

    // ── LEFT · grid ──
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('dp 表 · s ↓ / p →', PAD, 22);

    const cell=36, gx=PAD+32, gy=54;
    // 欄標 p
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='700 12px "JetBrains Mono", monospace';
    for(let j=0;j<C;j++){ ctx.fillStyle=(j>=1&&(pcol[j]==='*'))?COLOR.curT:COLOR.dim; ctx.fillText(pcol[j], gx+j*cell+cell/2, gy-13); }
    for(let i=0;i<R;i++){
      ctx.fillStyle=COLOR.dim; ctx.font='700 12px "JetBrains Mono", monospace'; ctx.textAlign='right'; ctx.textBaseline='middle';
      ctx.fillText(scol[i], gx-9, gy+i*cell+cell/2);
      for(let j=0;j<C;j++){
        const x=gx+j*cell, y=gy+i*cell;
        const isShown=shown(step,i,j), isCur=(s.cur&&s.cur.i===i&&s.cur.j===j), isSrc=srcSet.has(i+','+j), isHi=hiSet.has(i+','+j);
        const isAns=(done&&i===R-1&&j===C-1);
        const val=DP[i][j];
        rr(x+2,y+2,cell-4,cell-4,4);
        let bg='#f7f7f4',bd='#e6e6e0',tc='#d8d8d2';
        if(isShown){ bg=val?COLOR.cell:'#f2f2ee'; bd=COLOR.cellS; tc=val?COLOR.doneT:COLOR.dim; }
        if(isSrc){ bg=COLOR.src; bd=COLOR.srcS; tc=COLOR.srcT; }
        if(isHi){ bg=COLOR.done; bd=COLOR.doneS; tc=COLOR.doneT; }
        if(isCur){ bg=COLOR.cur; bd=COLOR.curS; tc=COLOR.curT; }
        if(isAns){ bg=COLOR.done; bd=COLOR.doneS; tc=COLOR.doneT; }
        ctx.fillStyle=bg; ctx.fill(); ctx.lineWidth=(isCur||isAns)?2.8:(isSrc||isHi?2:1.2); ctx.strokeStyle=bd; ctx.stroke();
        ctx.fillStyle=tc; ctx.font='700 13px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(isShown?(val?'T':'F'):'·', x+cell/2, y+cell/2+1);
      }
    }

    // ── RIGHT · rule panel ──
    const px=gx+C*cell+28;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('本格規則', px, 22);

    const bx=px, by=40, bw=w-px-PAD;
    function box(y,hh,bg,bd){ rr(bx,y,bw,hh,7); ctx.fillStyle=bg; ctx.fill(); ctx.lineWidth=1.8; ctx.strokeStyle=bd; ctx.stroke(); }
    ctx.textAlign='left'; ctx.textBaseline='top';

    if(s.rule==='base'){
      box(by,60,'#fafaf6',COLOR.grid);
      ctx.fillStyle=COLOR.text; ctx.font='700 13px "JetBrains Mono", monospace'; ctx.fillText('dp[0][0] = true', bx+14, by+14);
      ctx.font='600 12px "Noto Sans TC", sans-serif'; ctx.fillStyle=COLOR.dim; ctx.fillText('空字串配空模式 → 成立', bx+14, by+36);
    } else if(s.rule==='row0'){
      box(by,86,COLOR.done,COLOR.doneS);
      ctx.fillStyle=COLOR.doneT; ctx.font='700 13px "JetBrains Mono", monospace'; ctx.fillText('dp[0][j] = (p[j-1]==\'*\'', bx+14, by+14);
      ctx.fillText('           && dp[0][j-2])', bx+14, by+34);
      ctx.font='600 12px "Noto Sans TC", sans-serif';
      ctx.fillText('空 s 只能被 "x*"(零次)配上', bx+14, by+60);
    } else if(s.rule==='letter'){
      box(by,86,COLOR.src,COLOR.srcS);
      ctx.fillStyle=COLOR.srcT; ctx.font='700 12.5px "JetBrains Mono", monospace';
      ctx.fillText('字母 / \'.\' :', bx+14, by+12);
      ctx.fillText('s[i-1]==p[j-1] 或 \'.\'', bx+14, by+32);
      ctx.fillText('→ dp[i-1][j-1](左上)', bx+14, by+52);
      ctx.font='600 11.5px "Noto Sans TC", sans-serif'; ctx.fillStyle=COLOR.text;
      ctx.fillText('對上就退一格看左上', bx+14, by+72);
    } else if(s.rule==='starMore'){
      // 兩個框:零次 / 一次以上
      box(by,58,'#f4f4f0',COLOR.grid);
      ctx.fillStyle=COLOR.text; ctx.font='700 12px "JetBrains Mono", monospace';
      ctx.fillText('零次: dp[i][j-2]', bx+14, by+12);
      ctx.font='600 11px "Noto Sans TC", sans-serif'; ctx.fillStyle=COLOR.dim;
      ctx.fillText('跳過整個 "x*"', bx+14, by+32);
      box(by+66,66,COLOR.done,COLOR.doneS);
      ctx.fillStyle=COLOR.doneT; ctx.font='700 12px "JetBrains Mono", monospace';
      ctx.fillText('一次以上:', bx+14, by+78);
      ctx.fillText('(p[j-2]配 s[i-1]) && dp[i-1][j]', bx+14, by+98);
      ctx.font='600 11px "Noto Sans TC", sans-serif';
      ctx.fillText('吃掉一個 s 字,留著 "x*" 繼續', bx+14, by+118);
    }
  }

  function update(){ const s=steps[step]; if(stepEl) stepEl.textContent=String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0'); if(labelEl) labelEl.innerHTML=s.text; draw(); }
  function next(){ if(step<steps.length-1){step++;update();}else stop(); }
  function prev(){ if(step>0){step--;update();} }
  function reset(){ stop(); step=0; update(); }
  function play(){ if(timer){stop();return;} bPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){stop();return;} next(); },2000); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} if(bPlay) bPlay.textContent='Play'; }
  bPrev&&bPrev.addEventListener('click',prev); bNext&&bNext.addEventListener('click',next); bPlay&&bPlay.addEventListener('click',play); bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();}); if(window.ResizeObserver){ new ResizeObserver(()=>{fit();draw();}).observe(canvas); }
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw); fit(); update();
})();
