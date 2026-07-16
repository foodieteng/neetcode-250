/* ============================================================
   P877 · Stone Game — 區間 DP + 「淨勝分」改寫 · viz
   dp[i][j] = 先手在 piles[i..j] 這段能拿到的「淨勝分」(自己 − 對手)。
   對角線 dp[i][i] = piles[i](只剩一堆,全拿)。
   轉移:先手拿左端或右端,拿完換對手在剩下那段當「先手」:
     拿左:piles[i] − dp[i+1][j]     ← 減!因為 dp[剩下] 是「對手」的淨勝分
     拿右:piles[j] − dp[i][j-1]
     dp[i][j] = max(兩者)
   答案 dp[0][n-1] > 0 ⇔ Alice 淨勝 ⇔ Alice 贏。
   piles=[5,3,4,5],最終 dp[0][3]=1 > 0 → true。
   按「區間長度 L」一條對角線一條對角線填。
     LEFT   上三角 dp 表(依對角線 L 填,珊瑚=本輪)
     RIGHT  本輪代表格的 max(拿左, 拿右) 明細
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
    cur:'#fbe7df', curS:'#d96e4e', curT:'#b3502f', done:'#d9e8c7', doneS:'#5fa866', doneT:'#3f7a3a', coral:'#d96e4e' };

  const P = [5,3,4,5], N = 4;
  // 完整 dp(實跑)
  const DP = [[5,2,4,1],[0,3,1,4],[0,0,4,1],[0,0,0,5]];

  const steps = [
    { L:1, cur:null, src:[],
      text:'<strong>INITIAL</strong> · <code>piles=[5,3,4,5]</code>。<code>dp[i][j]</code> = 先手在 <code>piles[i..j]</code> 這段的<strong>淨勝分</strong>(自己 − 對手)。對角線 <code>dp[i][i]=piles[i]</code>(只剩一堆,全拿)。' },
    { L:2, cur:{i:0,j:1}, src:[{i:1,j:1},{i:0,j:0}],
      text:'<strong>L=2</strong> · <code>dp[0][1]=max(5−dp[1][1], 3−dp[0][0])=max(5−3, 3−5)=</code><strong>2</strong>。<strong>為什麼減?</strong>拿完換對手在剩下那段當先手,<code>dp[剩下]</code> 是<strong>對手</strong>的淨勝分,對我而言是負的。' },
    { L:3, cur:{i:0,j:2}, src:[{i:1,j:2},{i:0,j:1}],
      text:'<strong>L=3</strong> · <code>dp[0][2]=max(5−dp[1][2], 4−dp[0][1])=max(5−1, 4−2)=</code><strong>4</strong>。每格看<strong>左下</strong>(拿左端)和<strong>左邊</strong>(拿右端)兩個更短區間。' },
    { L:4, cur:{i:0,j:3}, src:[{i:1,j:3},{i:0,j:2}], done:true,
      text:'<strong>L=4</strong> · <code>dp[0][3]=max(5−dp[1][3], 5−dp[0][2])=max(5−4, 5−4)=</code><strong>1</strong>。<code>dp[0][3]=1 &gt; 0</code> → Alice 淨勝 → <strong>true</strong>。' },
    { L:4, cur:{i:0,j:3}, src:[], done:true, math:true,
      text:'<strong>數學捷徑</strong> · 題目保證<strong>偶數堆 + 總和為奇</strong>。Alice 可<strong>只挑「全奇index」或「全偶index」</strong>兩堆之一,其總和必較大 → <strong>Alice 永遠贏</strong>,<code>return true;</code> 一行解。實測 9976/9976 全 true。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,h=canvas.clientHeight,PAD=26;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,h);
    const done=!!s.done;
    const srcSet=new Set(s.src.map(p=>p.i+','+p.j));

    // ── LEFT · triangular dp table ──
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('dp[i][j] = piles[i..j] 淨勝分', PAD, 22);

    const cell=48, gx=PAD+30, gy=52;
    // 欄標 j
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='700 10.5px "JetBrains Mono", monospace';
    for(let j=0;j<N;j++){ ctx.fillStyle=COLOR.dim; ctx.fillText('j'+j+'('+P[j]+')', gx+j*cell+cell/2, gy-12); }
    for(let i=0;i<N;i++){
      ctx.fillStyle=COLOR.dim; ctx.font='700 10.5px "JetBrains Mono", monospace'; ctx.textAlign='right'; ctx.textBaseline='middle';
      ctx.fillText('i'+i, gx-8, gy+i*cell+cell/2);
      for(let j=0;j<N;j++){
        const x=gx+j*cell, y=gy+i*cell;
        if(j<i){ continue; }                       // 下三角空白
        const L=j-i+1, filled=(L<=s.L), isCur=(s.cur&&s.cur.i===i&&s.cur.j===j), isSrc=srcSet.has(i+','+j);
        const isDiag=(i===j);
        const isAns=(done&&i===0&&j===N-1);
        rr(x+3,y+3,cell-6,cell-6,5);
        let bg=COLOR.cell,bd=COLOR.cellS,tc=COLOR.text;
        if(!filled){ bg='#f7f7f4'; bd='#e6e6e0'; tc='#d8d8d2'; }
        if(isSrc){ bg=COLOR.src; bd=COLOR.srcS; tc=COLOR.srcT; }
        if(isCur){ bg=COLOR.cur; bd=COLOR.curS; tc=COLOR.curT; }
        if(isAns&&!s.math){ bg=COLOR.done; bd=COLOR.doneS; tc=COLOR.doneT; }
        ctx.fillStyle=bg; ctx.fill(); ctx.lineWidth=(isCur||isAns)?3:(isSrc?2.2:(isDiag&&filled?1.9:1.4)); ctx.strokeStyle=bd; ctx.stroke();
        ctx.fillStyle=tc; ctx.font='700 16px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(filled?String(DP[i][j]):'·', x+cell/2, y+cell/2+1);
      }
    }
    if(done&&!s.math){
      ctx.fillStyle=COLOR.doneT; ctx.font='700 10px "Noto Sans TC", sans-serif'; ctx.textAlign='center';
      ctx.fillText('答案 dp[0][3]=1>0', gx+(N-1)*cell+cell/2, gy+cell/2-18);
    }

    // ── RIGHT · detail panel ──
    const px=gx+N*cell+30;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText(s.math?'數學捷徑':'本輪:max(拿左, 拿右)', px, 22);

    if(s.math){
      // 兩組 index 說明
      const bx=px, by=44, bw=w-px-PAD, bh=160;
      rr(bx,by,bw,bh,8); ctx.fillStyle=COLOR.done; ctx.fill(); ctx.lineWidth=1.8; ctx.strokeStyle=COLOR.doneS; ctx.stroke();
      ctx.fillStyle=COLOR.doneT; ctx.textAlign='left'; ctx.textBaseline='top';
      ctx.font='700 12.5px "Noto Sans TC", sans-serif';
      ctx.fillText('偶數堆 + 總和奇 ⇒ Alice 必勝', bx+14, by+14);
      ctx.font='600 12px "Noto Sans TC", sans-serif';
      const lines=['Alice 先手,可鎖定「全偶 index」','或「全奇 index」兩組之一。','兩組總和不等(和為奇)→ 挑大的那組。','Bob 只能拿另一組 → Alice 淨勝。','','∴ return true; 直接解,O(1)。'];
      let yy=by+40; for(const t of lines){ ctx.fillText(t, bx+14, yy); yy+=21; }
      return;
    }

    // 明細:三個框 拿左 / 拿右 / = max
    const detail = {
      1:{cell:'dp[i][i]', body:['只剩一堆,','先手全部拿走 → piles[i]'], take:null},
      2:{cell:'dp[0][1]', left:['拿左 5:','5 − dp[1][1]','= 5 − 3 = 2'], right:['拿右 3:','3 − dp[0][0]','= 3 − 5 = −2'], res:'max = 2'},
      3:{cell:'dp[0][2]', left:['拿左 5:','5 − dp[1][2]','= 5 − 1 = 4'], right:['拿右 4:','4 − dp[0][1]','= 4 − 2 = 2'], res:'max = 4'},
      4:{cell:'dp[0][3]', left:['拿左 5:','5 − dp[1][3]','= 5 − 4 = 1'], right:['拿右 5:','5 − dp[0][2]','= 5 − 4 = 1'], res:'max = 1'},
    }[s.L];

    if(s.L===1){
      const bx=px,by=44,bw=w-px-PAD;
      rr(bx,by,bw,64,8); ctx.fillStyle='#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=COLOR.grid; ctx.stroke();
      ctx.fillStyle=COLOR.text; ctx.textAlign='left'; ctx.textBaseline='top'; ctx.font='600 12.5px "Noto Sans TC", sans-serif';
      ctx.fillText('對角線 dp[i][i] = piles[i]', bx+14, by+14);
      ctx.fillStyle=COLOR.dim; ctx.font='600 12px "Noto Sans TC", sans-serif';
      ctx.fillText('只剩一堆時,先手全部拿走。', bx+14, by+38);
      return;
    }

    // 拿左 / 拿右 兩個藍框 + max 綠框
    const bw2=(w-px-PAD-12)/2, by=44, bh2=78;
    const boxes=[{t:detail.left, x:px},{t:detail.right, x:px+bw2+12}];
    for(const b of boxes){
      rr(b.x,by,bw2,bh2,7); ctx.fillStyle=COLOR.src; ctx.fill(); ctx.lineWidth=1.8; ctx.strokeStyle=COLOR.srcS; ctx.stroke();
      ctx.fillStyle=COLOR.srcT; ctx.textAlign='left'; ctx.textBaseline='top'; ctx.font='700 12px "JetBrains Mono", monospace';
      let yy=by+12; for(const t of b.t){ ctx.fillText(t, b.x+12, yy); yy+=21; }
    }
    // max 框
    const my=by+bh2+12, mh=42;
    rr(px,my,w-px-PAD,mh,7); ctx.fillStyle=COLOR.cur; ctx.fill(); ctx.lineWidth=2.2; ctx.strokeStyle=COLOR.curS; ctx.stroke();
    ctx.fillStyle=COLOR.curT; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='700 15px "JetBrains Mono", monospace';
    ctx.fillText('dp[0]['+s.cur.j+'] = '+detail.res, px+(w-px-PAD)/2, my+mh/2);
    // 提示「減」
    const ny=my+mh+14;
    ctx.fillStyle=COLOR.text; ctx.textAlign='left'; ctx.textBaseline='top'; ctx.font='600 11.5px "Noto Sans TC", sans-serif';
    ctx.fillText('「−」= 換對手當先手,dp[剩下] 是對手的淨勝分', px, ny);
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
