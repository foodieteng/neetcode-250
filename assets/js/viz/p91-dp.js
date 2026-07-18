/* ============================================================
   P91 · Decode Ways — 一維 DP 計數(逐步)· viz
   dp[i] = 前 i 個字元 s[0..i-1] 的解碼方法數。像爬樓梯,但兩條邊都有條件:
     單碼:s[i-1] != '0'          → dp[i] += dp[i-1]
     雙碼:"10" <= s[i-2..i-1] <= "26" → dp[i] += dp[i-2]
   base:dp[0]=1(空字串一種)、dp[1]=1(首字元非 0)。
   例 s="2101" → dp=[1,1,2,1,1],答案 1(只有 "2 10 1" = B J A)
     BAND 1  字串視窗 + dp[] 陣列(紅=本步 · 藍=有貢獻的來源 · 灰=條件不符)
     BAND 2  兩個條件檢查(單碼 / 雙碼)
     BAND 3  dp[i] 結果
   ============================================================ */
(function () {
  const canvas = document.getElementById('viz-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('viz-step'), labelEl = document.getElementById('viz-label');
  const bPrev = document.getElementById('viz-prev'), bNext = document.getElementById('viz-next'),
        bPlay = document.getElementById('viz-play'), bReset = document.getElementById('viz-reset');

  const COLOR = { paper:'#ffffff', ink:'#1a1a1a', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf',
    cell:'#fafaf6', cellS:'#cfcfcf', grey:'#ededed', greyS:'#c4c4c4', greyT:'#a6a6a6',
    src:'#dbe8f6', srcS:'#4478c0', srcT:'#2f5f9e',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424', done:'#d9e8c7', doneS:'#5fa866', doneT:'#3f7a3a', coral:'#cf3535' };

  const S = '2101';
  const N = S.length;                 // 4
  const NIL = -1;
  // dp final = [1,1,2,1,1]
  const steps = [
    { dp:[1,1,NIL,NIL,NIL], cur:NIL, one:NIL, two:NIL, single:null, dbl:null,
      text:'<strong>INITIAL</strong> · <code>dp[i]</code> = 前 <code>i</code> 個字元的解碼方法數。base:<code>dp[0]=1</code>(空字串)、<code>dp[1]=1</code>(首字 <code>"2"</code>≠0)。' },
    { dp:[1,1,2,NIL,NIL], cur:2, one:1, two:0, single:{ok:true,ch:'1'}, dbl:{ok:true,w:'21'},
      text:'<code>i=2</code> · 單碼 <code>s[1]="1"</code>≠0 ✓ 加 dp[1];雙碼 <code>"21"</code>∈[10,26] ✓ 加 dp[0]。<code>dp[2]=1+1=2</code>。' },
    { dp:[1,1,2,1,NIL], cur:3, one:NIL, two:1, single:{ok:false,ch:'0'}, dbl:{ok:true,w:'10'},
      text:'<code>i=3</code> · 單碼 <code>s[2]="0"</code> 是 0 ✗ 跳過;雙碼 <code>"10"</code>∈[10,26] ✓ 加 dp[1]。<code>dp[3]=1</code>。' },
    { dp:[1,1,2,1,1], cur:4, one:3, two:NIL, single:{ok:true,ch:'1'}, dbl:{ok:false,w:'01'}, done:true,
      text:'<code>i=4</code> · 單碼 <code>s[3]="1"</code>≠0 ✓ 加 dp[3];雙碼 <code>"01"</code> 有前導 0、不在[10,26] ✗。<code>dp[4]=1</code>。答案 <code>1</code>。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,h=canvas.clientHeight,PAD=26;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,h);
    const i=s.cur;

    // ── BAND 1 header
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · dp[i] = 前 i 個字元的解碼方法數(紅=本步 · 藍=有貢獻來源 · 灰=條件不符)', PAD, 24);

    // string reference row  s = 2 1 0 1
    const dcw=34, dtot=N*dcw, dsx=(w-dtot)/2;
    ctx.fillStyle=COLOR.text; ctx.font='700 12px "JetBrains Mono", monospace'; ctx.textAlign='right'; ctx.textBaseline='middle';
    ctx.fillText('s =', dsx-12, 56);
    for(let j=0;j<N;j++){ const x=dsx+j*dcw;
      const inDouble = (i!==NIL) && (j===i-2||j===i-1);
      const isSingle = (i!==NIL) && (j===i-1);
      rr(x+3,42,dcw-6,30,4);
      ctx.fillStyle=inDouble?'#eef4fb':COLOR.cell; ctx.fill();
      ctx.lineWidth=isSingle?2.6:1.4; ctx.strokeStyle=isSingle?COLOR.curS:(inDouble?COLOR.srcS:COLOR.cellS); ctx.stroke();
      ctx.fillStyle=COLOR.ink; ctx.font='700 15px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(S[j], x+dcw/2, 58);
      ctx.fillStyle=COLOR.dim; ctx.font='600 9px "JetBrains Mono", monospace';
      ctx.fillText(String(j), x+dcw/2, 79);
    }

    // dp array row
    const cw=Math.min(64,(w-2*PAD)/(N+2)); const gx=(w-(N+1)*cw)/2, gy=104, chh=44;
    const oneSet = s.one!==NIL ? s.one : -99, twoSet = s.two!==NIL ? s.two : -99;
    for(let k=0;k<=N;k++){ const x=gx+k*cw; const val=s.dp[k];
      const isCur=(k===i), isSrc=(k===oneSet||k===twoSet), filled=val!==NIL&&!isCur&&!isSrc;
      ctx.fillStyle=COLOR.dim; ctx.font='700 11px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('dp'+k, x+cw/2, gy-12);
      rr(x+4,gy,cw-8,chh,5);
      ctx.fillStyle=isCur?COLOR.cur:(isSrc?COLOR.src:(filled?COLOR.done:COLOR.cell)); ctx.fill();
      ctx.lineWidth=isCur?3.2:1.8; ctx.strokeStyle=isCur?COLOR.curS:(isSrc?COLOR.srcS:(filled?COLOR.doneS:COLOR.cellS)); ctx.stroke();
      ctx.fillStyle=isCur?COLOR.curT:(isSrc?COLOR.srcT:(filled?COLOR.doneT:COLOR.grid)); ctx.font='700 20px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(val===NIL?'·':String(val), x+cw/2, gy+chh/2+1);
    }

    // ── BAND 2 · two condition checks
    const by=176;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 兩條邊各有條件', PAD, by);
    const box=by+12, boxH=52; rr(PAD,box,w-PAD*2,boxH,6); ctx.fillStyle='#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=COLOR.grid; ctx.stroke();
    ctx.textBaseline='middle';
    if(i===NIL){
      ctx.textAlign='center'; ctx.fillStyle=COLOR.text; ctx.font='600 13px "Noto Sans TC", sans-serif';
      ctx.fillText('每一步:單碼(末 1 位非 0)加 dp[i-1];雙碼(末 2 位 10–26)加 dp[i-2]', w/2, box+boxH/2);
    } else {
      const y1=box+17, y2=box+37; ctx.textAlign='left';
      // single
      ctx.fillStyle=s.single.ok?COLOR.doneT:COLOR.greyT; ctx.font='700 12.5px "JetBrains Mono", monospace';
      ctx.fillText((s.single.ok?'✓':'✗')+' 單碼 s[i-1]="'+s.single.ch+'"', PAD+16, y1);
      ctx.fillStyle=s.single.ok?COLOR.text:COLOR.greyT; ctx.font='600 12.5px "Noto Sans TC", sans-serif';
      ctx.fillText(s.single.ok?'≠0 → 加 dp[i-1]':'是 0 → 跳過', PAD+230, y1);
      // double
      ctx.fillStyle=s.dbl.ok?COLOR.doneT:COLOR.greyT; ctx.font='700 12.5px "JetBrains Mono", monospace';
      ctx.fillText((s.dbl.ok?'✓':'✗')+' 雙碼 s[i-2..i-1]="'+s.dbl.w+'"', PAD+16, y2);
      ctx.fillStyle=s.dbl.ok?COLOR.text:COLOR.greyT; ctx.font='600 12.5px "Noto Sans TC", sans-serif';
      ctx.fillText(s.dbl.ok?'∈[10,26] → 加 dp[i-2]':'不在[10,26] → 跳過', PAD+230, y2);
    }

    // ── BAND 3 · result note
    const ty=box+boxH+22, done=!!s.done;
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 本步結果', PAD, ty);
    const nbox=ty+12; rr(PAD,nbox,w-PAD*2,38,6); ctx.fillStyle=done?COLOR.done:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?COLOR.doneS:COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(i===NIL){ ctx.fillStyle=COLOR.text; ctx.font='600 12.5px "Noto Sans TC", sans-serif'; ctx.fillText('像爬樓梯把方法數相加,只是每條路徑要先通過「合法碼」檢查', w/2, nbox+19); }
    else if(done){ ctx.fillStyle=COLOR.doneT; ctx.font='700 13px "JetBrains Mono", monospace'; ctx.fillText('return dp[n] = 1 · 只有 "2 10 1" = B J A 合法', w/2, nbox+19); }
    else { const parts=[]; if(s.one!==NIL)parts.push('dp['+(i-1)+']='+s.dp[i-1]); if(s.two!==NIL)parts.push('dp['+(i-2)+']='+s.dp[i-2]);
      ctx.fillStyle=COLOR.curT; ctx.font='700 14px "JetBrains Mono", monospace';
      ctx.fillText('dp['+i+'] = '+parts.join(' + ')+' = '+s.dp[i], w/2, nbox+19); }
  }

  function update(){ const s=steps[step]; if(stepEl) stepEl.textContent=String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0'); if(labelEl) labelEl.innerHTML=s.text; draw(); }
  function next(){ if(step<steps.length-1){step++;update();}else stop(); }
  function prev(){ if(step>0){step--;update();} }
  function reset(){ stop(); step=0; update(); }
  function play(){ if(timer){stop();return;} bPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){stop();return;} next(); },1900); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} if(bPlay) bPlay.textContent='Play'; }
  bPrev&&bPrev.addEventListener('click',prev); bNext&&bNext.addEventListener('click',next); bPlay&&bPlay.addEventListener('click',play); bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();}); if(window.ResizeObserver){ new ResizeObserver(()=>{fit();draw();}).observe(canvas); }
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw); fit(); update();
})();
