/* ============================================================
   P229 · Majority Element II — Boyer-Moore 兩候選人投票 · viz
   > ⌊n/3⌋ 的元素最多 2 個(3 個各 >n/3 就超過 n 個,不可能)。
   所以維持「2 個 (候選, 票數) 槽位」:
     num==c1 → cnt1++      num==c2 → cnt2++
     cnt1==0 → 收編為 c1    cnt2==0 → 收編為 c2
     否則(第三種不同值)→ cnt1--、cnt2--(一次抵銷三個相異值)
   投票只保證「真答案一定在這 2 個候選裡」,不保證候選一定合格 →
   最後必須「再數一遍」驗證票數是否真的 > n/3。
   例 [3,3,4,2,4,4,2,4](LC 範例):候選 3 撐到最後卻只有 2 票(不足)→ 被驗證刷掉;4 勝出。
     BAND 1  陣列(紅=當前 · 灰=已處理)
     BAND 2  兩個候選槽 c1 / c2(值 + 票數)
     BAND 3  本步分支 / 最後的驗證計數
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
    grn:'#d9e8c7', grnS:'#5fa866', grnT:'#3f7a3a',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424', done:'#d9e8c7', doneS:'#5fa866', doneT:'#3f7a3a',
    off:'#f0f0ec', offS:'#deded8', offT:'#a8a8a0', coral:'#cf3535' };

  const A = [3,3,4,2,4,4,2,4];
  // c1/c2: {v: value or null, cnt}
  const steps = [
    { idx:-1, c1:{v:null,cnt:0}, c2:{v:null,cnt:0}, phase:'intro',
      text:'<strong>INITIAL</strong> · 超過 <code>⌊n/3⌋</code> 的元素<strong>最多 2 個</strong>(3 個各 &gt;n/3 就超過 n)。維持 <strong>2 個候選槽</strong> <code>c1</code>、<code>c2</code>,各帶票數。' },
    { idx:0, num:3, br:'adopt1', c1:{v:3,cnt:1}, c2:{v:null,cnt:0},
      text:'<strong>i=0 · num=3</strong> · c1 是空的(cnt1=0)→ <strong>收編 c1=3</strong>,cnt1=1。' },
    { idx:1, num:3, br:'inc1', c1:{v:3,cnt:2}, c2:{v:null,cnt:0},
      text:'<strong>i=1 · num=3</strong> · <code>==c1</code> → cnt1++ = 2。' },
    { idx:2, num:4, br:'adopt2', c1:{v:3,cnt:2}, c2:{v:4,cnt:1},
      text:'<strong>i=2 · num=4</strong> · 不等 c1、c2 空(cnt2=0)→ <strong>收編 c2=4</strong>,cnt2=1。' },
    { idx:3, num:2, br:'dec', c1:{v:3,cnt:1}, c2:{v:4,cnt:0},
      text:'<strong>i=3 · num=2</strong> · 第三種相異值,兩槽都有票 → <strong>cnt1--、cnt2--</strong>(一次抵銷 2,3,4 三個相異值)。cnt2 歸 0。' },
    { idx:4, num:4, br:'inc2', c1:{v:3,cnt:1}, c2:{v:4,cnt:1},
      text:'<strong>i=4 · num=4</strong> · <code>==c2</code>(c2 值仍是 4)→ cnt2++ = 1。<strong>注意:先比對值、再看 cnt==0</strong>,所以 cnt2=0 也能直接計數。' },
    { idx:5, num:4, br:'inc2', c1:{v:3,cnt:1}, c2:{v:4,cnt:2},
      text:'<strong>i=5 · num=4</strong> · <code>==c2</code> → cnt2++ = 2。' },
    { idx:6, num:2, br:'dec', c1:{v:3,cnt:0}, c2:{v:4,cnt:1},
      text:'<strong>i=6 · num=2</strong> · 又是第三種相異值 → cnt1--、cnt2--。cnt1 歸 0(但 c1 值 3 還留著,等被取代)。' },
    { idx:7, num:4, br:'inc2', c1:{v:3,cnt:0}, c2:{v:4,cnt:2},
      text:'<strong>i=7 · num=4</strong> · <code>==c2</code> → cnt2++ = 2。投票結束,候選 = <strong>{3, 4}</strong>。' },
    { idx:8, phase:'verify', c1:{v:3,cnt:0}, c2:{v:4,cnt:2}, v1:2, v2:4, n3:2,
      text:'<strong>驗證</strong> · 再數一遍真實票數。<code>3</code> 出現 <strong>2</strong> 次,<strong>不 &gt; ⌊8/3⌋=2</strong> → <strong>刷掉</strong>。<code>4</code> 出現 <strong>4</strong> 次 &gt; 2 → 收下。答案 = <strong>[4]</strong>。<em>投票的候選未必合格,驗證不可省</em>。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function candBox(x,y,bw,bh,label,cand,tintS,tintBg,tintT,highlight,rejected){
    rr(x,y,bw,bh,8);
    let bg=COLOR.cell,bd=COLOR.cellS,tc=COLOR.text;
    if(cand.v!==null){ bg=tintBg; bd=tintS; tc=tintT; }
    if(cand.v!==null && cand.cnt===0){ bg=COLOR.off; bd=COLOR.offS; tc=COLOR.offT; } // count 0 = 待取代
    if(rejected){ bg=COLOR.off; bd=COLOR.offS; tc=COLOR.offT; }
    ctx.fillStyle=bg; ctx.fill(); ctx.lineWidth=highlight?3:1.8; ctx.strokeStyle=highlight?COLOR.curS:bd; ctx.stroke();
    ctx.fillStyle=COLOR.dim; ctx.font='700 11px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText(label, x+14, y+20);
    ctx.fillStyle=tc; ctx.font='700 26px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(cand.v===null?'—':String(cand.v), x+bw*0.36, y+bh*0.62);
    // count pill
    ctx.fillStyle=COLOR.dim; ctx.font='600 11px "Noto Sans TC", sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('票數', x+bw*0.74, y+bh*0.40);
    ctx.fillStyle=tc; ctx.font='700 22px "JetBrains Mono", monospace';
    ctx.fillText(String(cand.cnt), x+bw*0.74, y+bh*0.66);
  }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,PAD=26;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,canvas.clientHeight);
    const verify=s.phase==='verify';

    // ── BAND 1 · array ──
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · nums(紅=當前 · 灰=已處理)', PAD, 22);
    const n=A.length, cell=Math.min(74,(w-2*PAD)/n), gx=(w-n*cell)/2, gy=38, chh=38;
    for(let k=0;k<n;k++){
      const x=gx+k*cell, isCur=(!verify && k===s.idx), passed=(s.idx>=0 && k<s.idx) || verify;
      rr(x+3,gy,cell-6,chh,6);
      let bg=COLOR.cell,bd=COLOR.cellS,tc=COLOR.text;
      if(passed){ bg=COLOR.off; bd=COLOR.offS; tc=COLOR.offT; }
      if(isCur){ bg=COLOR.cur; bd=COLOR.curS; tc=COLOR.curT; }
      ctx.fillStyle=bg; ctx.fill(); ctx.lineWidth=isCur?3:1.6; ctx.strokeStyle=bd; ctx.stroke();
      ctx.fillStyle=tc; ctx.font='700 16px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(A[k]), x+cell/2, gy+chh/2);
    }

    // ── BAND 2 · candidate slots ──
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 兩個候選槽(值 + 票數 · 藍=c1 綠=c2 · 灰=票數 0 待取代)', PAD, 100);
    const bw=(w-2*PAD-24)/2, by=112, bh=64;
    const hl1=(!verify && (s.br==='adopt1'||s.br==='inc1'||s.br==='dec'));
    const hl2=(!verify && (s.br==='adopt2'||s.br==='inc2'||s.br==='dec'));
    candBox(PAD, by, bw, bh, 'c1', s.c1, COLOR.srcS, COLOR.src, COLOR.srcT, hl1, verify && s.v1<=s.n3);
    candBox(PAD+bw+24, by, bw, bh, 'c2', s.c2, COLOR.grnS, COLOR.grn, COLOR.grnT, hl2, verify && s.v2<=s.n3);

    // ── BAND 3 · branch / verify ──
    const ty=196;
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText(verify?'BAND 3 · 驗證:再數真實票數,是否 > ⌊n/3⌋':'BAND 3 · 本步分支', PAD, ty);
    rr(PAD,ty+10,w-PAD*2,46,6); ctx.fillStyle=verify?'#fafaf6':'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(s.phase==='intro'){ ctx.fillStyle=COLOR.text; ctx.font='600 12.5px "Noto Sans TC", sans-serif';
      ctx.fillText('比對優先序:==c1 → ==c2 → c1空收編 → c2空收編 → 否則兩邊各減 1', w/2, ty+33); }
    else if(verify){
      ctx.font='700 13px "JetBrains Mono", monospace';
      ctx.fillStyle=s.v1>s.n3?COLOR.grnT:COLOR.curT;
      ctx.fillText('count(3)='+s.v1+(s.v1>s.n3?' > 2 ●':'  ≤ 2 ✗ 刷掉')+'　　count(4)='+s.v2+' > 2 ● 收下', w/2, ty+33);
    }
    else {
      const map={adopt1:'c1 空 → 收編 c1 = '+s.num+',cnt1 = 1',
                 inc1:'num == c1 → cnt1++',
                 adopt2:'c2 空 → 收編 c2 = '+s.num+',cnt2 = 1',
                 inc2:'num == c2 → cnt2++',
                 dec:'第三種相異值 → cnt1--、cnt2--(抵銷三個相異值)'};
      ctx.fillStyle=s.br==='dec'?COLOR.curT:COLOR.srcT; ctx.font='700 13px "JetBrains Mono", monospace';
      ctx.fillText(map[s.br], w/2, ty+33);
    }
  }

  function update(){ const s=steps[step]; if(stepEl) stepEl.textContent=String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0'); if(labelEl) labelEl.innerHTML=s.text; draw(); }
  function next(){ if(step<steps.length-1){step++;update();}else stop(); }
  function prev(){ if(step>0){step--;update();} }
  function reset(){ stop(); step=0; update(); }
  function play(){ if(timer){stop();return;} bPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){stop();return;} next(); },1700); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} if(bPlay) bPlay.textContent='Play'; }
  bPrev&&bPrev.addEventListener('click',prev); bNext&&bNext.addEventListener('click',next); bPlay&&bPlay.addEventListener('click',play); bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();}); if(window.ResizeObserver){ new ResizeObserver(()=>{fit();draw();}).observe(canvas); }
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw); fit(); update();
})();
