/* ============================================================
   P72 · Edit Distance — 兩字串 DP · 三方向=三操作 · viz
   dp[i][j] = 把 word1 前 i 字改成 word2 前 j 字的最少操作數。
   ── 字元相同:dp[i][j] = dp[i-1][j-1](免費,不用操作)
   ── 字元不同:dp[i][j] = 1 + min( 上 dp[i-1][j],   ← 刪除 word1[i-1]
                                    左 dp[i][j-1],   ← 插入 word2[j-1]
                                    左上 dp[i-1][j-1] ← 替換 )
   base:dp[i][0]=i(把 i 個字全刪光)、dp[0][j]=j(插入 j 個字)。
   word1="horse", word2="ros" → 3。
     LEFT   dp grid(珊瑚=本格 · 藍=三個來源)
     RIGHT  三方向對應三操作
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
    cur:'#fbe7df', curS:'#d96e4e', curT:'#b3502f', done:'#d9e8c7', doneS:'#5fa866', doneT:'#3f7a3a',
    base:'#eef2f6', baseS:'#b8c4d0', baseT:'#5f6f80', coral:'#d96e4e' };

  const W1 = 'horse', W2 = 'ros';
  const R = W1.length+1, C = W2.length+1;   // 6 x 4
  const DP = [
    [0,1,2,3],
    [1,1,2,3],
    [2,2,1,2],
    [3,2,2,2],
    [4,3,3,2],
    [5,4,4,3],
  ];
  const rlab = ['∅','h','o','r','s','e'];
  const clab = ['∅','r','o','s'];

  const steps = [
    { fill:'base', cur:null, src:[], rule:'base',
      text:'<strong>INITIAL</strong> · <code>word1="horse"</code>(列)、<code>word2="ros"</code>(行)。<code>dp[i][j]</code> = 把 word1 前 i 字改成 word2 前 j 字的<strong>最少操作數</strong>。先填邊界。' },
    { fill:'base', cur:null, hi:['base'], rule:'baseExplain',
      text:'<strong>base</strong> · <code>dp[i][0]=i</code>:word2 是空的,把 word1 的 i 個字<strong>全刪光</strong>要 i 步。<code>dp[0][j]=j</code>:word1 空,<strong>插入</strong> j 個字。' },
    { fill:[2,2], cur:{i:2,j:2}, src:[{i:1,j:1}], rule:'match',
      text:'<strong>字元相同</strong> · <code>dp[2][2]</code>:<code>word1[1]=\'o\'</code> == <code>word2[1]=\'o\'</code> → <strong>免費</strong>沿用<strong>左上</strong> <code>dp[1][1]=1</code>,不用任何操作。' },
    { fill:[1,1], cur:{i:1,j:1}, src:[{i:0,j:1},{i:1,j:0},{i:0,j:0}], rule:'mismatch',
      text:'<strong>字元不同</strong> · <code>dp[1][1]</code>:<code>\'h\' ≠ \'r\'</code> → <code>1 + min(上 1, 左 1, 左上 0) = 1</code>。三個鄰居 = 三種操作,挑最省的(這裡左上「替換」最省)。' },
    { fill:'all', cur:{i:5,j:3}, src:[], rule:'answer', done:true,
      text:'<strong>ANSWER</strong> · <code>dp[5][3] = 3</code>。horse → r<u>o</u>rse(替換 h→r)→ rose(刪 r)→ ros(刪 e),共 <strong>3</strong> 步。' },
  ];

  function shownCell(step,i,j){
    const s=steps[step];
    if(s.fill==='base') return (i===0||j===0);
    if(s.fill==='all') return true;
    if(Array.isArray(s.fill)){
      const [I,J]=s.fill;
      if(i===0||j===0) return true;
      if(i<I) return true;
      if(i===I) return j<=J;
      return false;
    }
    return (i===0||j===0);
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
    const hiBase=(s.hi||[]).includes('base');

    // ── LEFT · grid ──
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('dp 表 · word1 ↓ / word2 →', PAD, 22);

    const cell=32, gx=PAD+28, gy=52;
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='700 11px "JetBrains Mono", monospace';
    for(let j=0;j<C;j++){ ctx.fillStyle=COLOR.dim; ctx.fillText(clab[j], gx+j*cell+cell/2, gy-12); }
    for(let i=0;i<R;i++){
      ctx.fillStyle=COLOR.dim; ctx.font='700 11px "JetBrains Mono", monospace'; ctx.textAlign='right'; ctx.textBaseline='middle';
      ctx.fillText(rlab[i], gx-8, gy+i*cell+cell/2);
      for(let j=0;j<C;j++){
        const x=gx+j*cell, y=gy+i*cell;
        const isShown=shownCell(step,i,j), isBase=(i===0||j===0), isCur=(s.cur&&s.cur.i===i&&s.cur.j===j), isSrc=srcSet.has(i+','+j);
        const isAns=(done&&i===R-1&&j===C-1);
        rr(x+2,y+2,cell-4,cell-4,4);
        let bg='#f7f7f4',bd='#e6e6e0',tc='#d8d8d2';
        if(isShown){
          if(isBase){ bg=COLOR.base; bd=COLOR.baseS; tc=COLOR.baseT; if(hiBase){ bg=COLOR.done; bd=COLOR.doneS; tc=COLOR.doneT; } }
          else { bg=COLOR.cell; bd=COLOR.cellS; tc=COLOR.text; }
        }
        if(isSrc){ bg=COLOR.src; bd=COLOR.srcS; tc=COLOR.srcT; }
        if(isCur){ bg=COLOR.cur; bd=COLOR.curS; tc=COLOR.curT; }
        if(isAns){ bg=COLOR.done; bd=COLOR.doneS; tc=COLOR.doneT; }
        ctx.fillStyle=bg; ctx.fill(); ctx.lineWidth=(isCur||isAns)?2.8:(isSrc?2:1.2); ctx.strokeStyle=bd; ctx.stroke();
        ctx.fillStyle=tc; ctx.font='700 13px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(isShown?String(DP[i][j]):'·', x+cell/2, y+cell/2+1);
      }
    }

    // ── RIGHT · operations panel ──
    const px=gx+C*cell+30;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('三方向 = 三操作', px, 22);

    const bx=px, bw=w-px-PAD;
    ctx.textAlign='left'; ctx.textBaseline='top';
    function box(y,hh,bg,bd){ rr(bx,y,bw,hh,7); ctx.fillStyle=bg; ctx.fill(); ctx.lineWidth=1.8; ctx.strokeStyle=bd; ctx.stroke(); }

    if(s.rule==='base'||s.rule==='baseExplain'){
      box(40,66,s.rule==='baseExplain'?COLOR.done:'#fafaf6',s.rule==='baseExplain'?COLOR.doneS:COLOR.grid);
      ctx.fillStyle=s.rule==='baseExplain'?COLOR.doneT:COLOR.text; ctx.font='700 12.5px "JetBrains Mono", monospace';
      ctx.fillText('dp[i][0] = i   (全刪)', bx+14, 54);
      ctx.fillText('dp[0][j] = j   (全插)', bx+14, 78);
      ctx.font='600 11.5px "Noto Sans TC", sans-serif'; ctx.fillStyle=COLOR.dim;
      ctx.fillText('對空字串:刪光或插滿', bx+14, 100);
    } else if(s.rule==='match'){
      box(40,66,COLOR.src,COLOR.srcS);
      ctx.fillStyle=COLOR.srcT; ctx.font='700 13px "JetBrains Mono", monospace';
      ctx.fillText('字元相同:', bx+14, 54);
      ctx.fillText('dp[i][j] = dp[i-1][j-1]', bx+14, 78);
      ctx.font='600 11.5px "Noto Sans TC", sans-serif'; ctx.fillStyle=COLOR.text;
      ctx.fillText('免費沿用左上,+0', bx+14, 100);
    } else if(s.rule==='mismatch'){
      // three op boxes
      const ops=[
        {lab:'上 dp[i-1][j]', op:'刪除 word1[i-1]', v:'1'},
        {lab:'左 dp[i][j-1]', op:'插入 word2[j-1]', v:'1'},
        {lab:'左上 dp[i-1][j-1]', op:'替換(這裡最省)', v:'0'},
      ];
      let y=40;
      for(let t=0;t<ops.length;t++){
        const o=ops[t], hh=32, best=(t===2);
        box(y,hh,best?COLOR.done:COLOR.src,best?COLOR.doneS:COLOR.srcS);
        ctx.fillStyle=best?COLOR.doneT:COLOR.srcT; ctx.font='700 11px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='middle';
        ctx.fillText(o.lab+' ='+o.v, bx+12, y+11);
        ctx.font='600 10.5px "Noto Sans TC", sans-serif';
        ctx.fillText('→ '+o.op, bx+12, y+24);
        y+=hh+6;
      }
      ctx.fillStyle=COLOR.curT; ctx.font='700 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='top';
      ctx.fillText('1 + min(1,1,0) = 1', bx, y+2);
    } else if(s.rule==='answer'){
      box(40,90,COLOR.done,COLOR.doneS);
      ctx.fillStyle=COLOR.doneT; ctx.font='700 13px "JetBrains Mono", monospace';
      ctx.fillText('dp[5][3] = 3', bx+14, 54);
      ctx.font='600 11.5px "Noto Sans TC", sans-serif';
      ctx.fillText('horse → rorse (替換 h→r)', bx+14, 76);
      ctx.fillText('→ rose (刪 r) → ros (刪 e)', bx+14, 96);
      ctx.font='700 11.5px "Noto Sans TC", sans-serif'; ctx.fillStyle=COLOR.doneT;
      ctx.fillText('三步完成', bx+14, 118);
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
