/* ============================================================
   P5 · Longest Palindromic Substring — 區間 DP 填表(逐步)· viz
   dp[i][j] = 子字串 s[i..j] 是不是回文。
   遞迴:s[i..j] 是回文  ⟺  s[i]==s[j]  且  內層 s[i+1..j-1] 也是回文。
   base:長度 1 必是回文;長度 2 只要頭尾相同即可。
   依「長度由小到大」填表,保證算 dp[i][j] 時內層 dp[i+1][j-1] 已知。
   例 s="abba":dp[1][2]=bb ✓,再靠它推出 dp[0][3]=abba ✓,答案 "abba"
     BAND 1  dp[i][j] 表格(綠=回文 · 紅=本步 · 藍=依賴的內層)
     右側     遞迴式 + 目前最長回文
     BAND 2  說明
   ============================================================ */
(function () {
  const canvas = document.getElementById('viz-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('viz-step'), labelEl = document.getElementById('viz-label');
  const bPrev = document.getElementById('viz-prev'), bNext = document.getElementById('viz-next'),
        bPlay = document.getElementById('viz-play'), bReset = document.getElementById('viz-reset');

  const COLOR = { paper:'#ffffff', ink:'#1a1a1a', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf',
    cell:'#fafaf6', cellS:'#cfcfcf', nil:'#f3f3ef', nilS:'#e2e2dc',
    src:'#dbe8f6', srcS:'#4478c0', srcT:'#2f5f9e',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424', done:'#d9e8c7', doneS:'#5fa866', doneT:'#3f7a3a', coral:'#cf3535' };

  const S = 'abba';
  const N = S.length;                 // 4
  const NILV = -1, F = 0, T = 1;
  function sub(i, j){ return S.slice(i, j + 1); }

  // 累積的 dp 表(每步的完整快照)
  const steps = [
    { diagL:0, cur:null, inner:null, best:null,
      g:[[NILV,NILV,NILV,NILV],[NILV,NILV,NILV,NILV],[NILV,NILV,NILV,NILV],[NILV,NILV,NILV,NILV]],
      text:'<strong>INITIAL</strong> · <code>dp[i][j]</code> = 子字串 <code>s[i..j]</code> 是不是回文?列 <code>i</code> = 起點,行 <code>j</code> = 終點。只填 <code>j ≥ i</code> 的上三角。' },
    { diagL:1, cur:null, inner:null, best:{i:0,len:1},
      g:[[T,NILV,NILV,NILV],[NILV,T,NILV,NILV],[NILV,NILV,T,NILV],[NILV,NILV,NILV,T]],
      text:'<strong>長度 1</strong> · 對角線:單一字元一定是回文 → <code>dp[i][i]=true</code>(四格全綠)。' },
    { diagL:2, cur:null, inner:null, best:{i:1,len:2},
      g:[[T,F,NILV,NILV],[NILV,T,T,NILV],[NILV,NILV,T,F],[NILV,NILV,NILV,T]],
      text:'<strong>長度 2</strong> · 頭尾相同就成立。只有 <code>s[1..2]="bb"</code> 頭尾都是 b → <code>dp[1][2]=true</code>。' },
    { diagL:3, cur:null, inner:null, best:{i:1,len:2},
      g:[[T,F,F,NILV],[NILV,T,T,F],[NILV,NILV,T,F],[NILV,NILV,NILV,T]],
      text:'<strong>長度 3</strong> · <code>s[0..2]="abb"</code>、<code>s[1..3]="bba"</code> 頭尾都不同 → 兩格皆 false。' },
    { diagL:4, cur:{i:0,j:3}, inner:{i:1,j:2}, best:{i:0,len:4}, done:true,
      g:[[T,F,F,T],[NILV,T,T,F],[NILV,NILV,T,F],[NILV,NILV,NILV,T]],
      text:'<strong>長度 4</strong> · <code>dp[0][3]</code>:<code>s[0]==s[3]</code>(a==a)<strong>且</strong>內層 <code>dp[1][2]="bb"</code> 是回文 → <code>"abba"</code> ✓。答案 = <code>"abba"</code>。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,h=canvas.clientHeight,PAD=26;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,h);

    // ── BAND 1 header
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · dp[i][j]:s[i..j] 是回文嗎?(綠=是 · 紅=本步 · 藍=依賴的內層)', PAD, 24);

    // ── grid geometry (left)
    const cell=42, gx=72, gy=76;
    // column headers (j)
    for(let j=0;j<N;j++){ const cx=gx+j*cell+cell/2;
      ctx.fillStyle=COLOR.dim; ctx.font='700 11px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('j='+j, cx, gy-26);
      ctx.fillStyle=COLOR.text; ctx.font='700 15px "JetBrains Mono", monospace';
      ctx.fillText(S[j], cx, gy-11);
    }
    // row headers (i)
    for(let i=0;i<N;i++){ const cy=gy+i*cell+cell/2;
      ctx.fillStyle=COLOR.dim; ctx.font='700 11px "JetBrains Mono", monospace'; ctx.textAlign='right'; ctx.textBaseline='middle';
      ctx.fillText('i='+i, gx-16, cy-7);
      ctx.fillStyle=COLOR.text; ctx.font='700 15px "JetBrains Mono", monospace';
      ctx.fillText(S[i], gx-22, cy+9);
    }
    // cells
    for(let i=0;i<N;i++) for(let j=0;j<N;j++){
      const x=gx+j*cell, y=gy+i*cell; const val=s.g[i][j];
      if(j<i){ continue; } // lower triangle: skip
      const isCur = s.cur && s.cur.i===i && s.cur.j===j;
      const isInner = s.inner && s.inner.i===i && s.inner.j===j;
      const onDiag = (j-i+1)===s.diagL && val!==NILV;
      rr(x+3,y+3,cell-6,cell-6,5);
      let fill=COLOR.nil, stroke=COLOR.nilS, txt=COLOR.dim, lw=1.6;
      if(isCur){ fill=COLOR.cur; stroke=COLOR.curS; txt=COLOR.curT; lw=3.2; }
      else if(isInner){ fill=COLOR.src; stroke=COLOR.srcS; txt=COLOR.srcT; lw=3; }
      else if(val===T){ fill=COLOR.done; stroke=COLOR.doneS; txt=COLOR.doneT; lw=1.8; }
      else if(val===F){ fill=COLOR.cell; stroke=COLOR.cellS; txt=COLOR.dim; lw=1.6; }
      ctx.fillStyle=fill; ctx.fill();
      if(onDiag && !isCur && !isInner){ stroke=COLOR.curS; lw=2.6; }
      ctx.lineWidth=lw; ctx.strokeStyle=stroke; ctx.stroke();
      if(val!==NILV){
        ctx.fillStyle=txt; ctx.font='700 12px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(sub(i,j), x+cell/2, y+cell/2);
      }
    }

    // ── right panel
    const px=gx+N*cell+42, pw=w-PAD-px;
    // recurrence
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('遞迴式', px, 68);
    rr(px,80,pw,72,6); ctx.fillStyle='#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=COLOR.grid; ctx.stroke();
    ctx.textAlign='left'; ctx.textBaseline='middle';
    ctx.fillStyle=COLOR.text; ctx.font='700 12px "JetBrains Mono", monospace';
    ctx.fillText('dp[i][j] =', px+14, 100);
    ctx.fillStyle=COLOR.srcT; ctx.font='600 11.5px "JetBrains Mono", monospace';
    ctx.fillText('s[i]==s[j] 且 dp[i+1][j-1]', px+14, 118);
    ctx.font='600 12px "Noto Sans TC", sans-serif';
    let rec;
    if(step===0) { ctx.fillStyle=COLOR.dim; rec='頭尾相同 + 去掉頭尾仍回文'; }
    else if(step===1){ ctx.fillStyle=COLOR.doneT; rec='長度 1:單一字元必回文'; }
    else if(step===2){ ctx.fillStyle=COLOR.doneT; rec='長度 2:頭尾相同即可 → bb ✓'; }
    else if(step===3){ ctx.fillStyle=COLOR.dim; rec='長度 3:頭尾都不同 → false'; }
    else { ctx.fillStyle=COLOR.doneT; rec='(a==a) 且 dp[1][2]=bb ✓ → abba'; }
    ctx.fillText(rec, px+14, 138);

    // current best
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textBaseline='alphabetic';
    ctx.fillText('目前最長回文', px, 176);
    const done=!!s.done;
    rr(px,188,pw,50,6); ctx.fillStyle=done?COLOR.done:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?COLOR.doneS:COLOR.grid; ctx.stroke();
    ctx.textAlign='left'; ctx.textBaseline='middle';
    if(s.best){ const bs=sub(s.best.i, s.best.i+s.best.len-1);
      ctx.fillStyle=done?COLOR.doneT:COLOR.curT; ctx.font='700 18px "JetBrains Mono", monospace';
      ctx.fillText('"'+bs+'"', px+14, 213);
      ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace';
      ctx.fillText('長度 '+s.best.len, px+14+ctx.measureText('"'+bs+'"  ').width+40, 213);
    } else { ctx.fillStyle=COLOR.dim; ctx.font='600 13px "Noto Sans TC", sans-serif'; ctx.fillText('尚未開始填表', px+14, 213); }

    // ── BAND 2 · note (full width bottom)
    const ty=270;
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 為什麼按「長度由小到大」填', PAD, ty);
    rr(PAD,ty+12,w-PAD*2,40,6); ctx.fillStyle=done?COLOR.done:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?COLOR.doneS:COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(done){ ctx.fillStyle=COLOR.doneT; ctx.font='700 13px "JetBrains Mono", monospace'; ctx.fillText('長度 L 的答案只依賴長度 L-2 的內層 → 先短後長,內層一定先算好', w/2, ty+32); }
    else { ctx.fillStyle=COLOR.text; ctx.font='600 12.5px "Noto Sans TC", sans-serif'; ctx.fillText('算 dp[i][j] 需要內層 dp[i+1][j-1](短 2)先就緒 → 依長度遞增填,順序才正確', w/2, ty+32); }
  }

  function update(){ const s=steps[step]; if(stepEl) stepEl.textContent=String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0'); if(labelEl) labelEl.innerHTML=s.text; draw(); }
  function next(){ if(step<steps.length-1){step++;update();}else stop(); }
  function prev(){ if(step>0){step--;update();} }
  function reset(){ stop(); step=0; update(); }
  function play(){ if(timer){stop();return;} bPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){stop();return;} next(); },1800); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} if(bPlay) bPlay.textContent='Play'; }
  bPrev&&bPrev.addEventListener('click',prev); bNext&&bNext.addEventListener('click',next); bPlay&&bPlay.addEventListener('click',play); bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();}); if(window.ResizeObserver){ new ResizeObserver(()=>{fit();draw();}).observe(canvas); }
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw); fit(); update();
})();
