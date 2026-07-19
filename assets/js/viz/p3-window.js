/* ============================================================
   P3 · Longest Substring Without Repeating Characters — 可變長滑動視窗 · viz
   右指針 r 每步擴張並把 s[r] 記進計數;若 s[r] 讓某字元計數 >1(視窗內出現重複),
   就從左邊收縮(freq[s[l++]]--)直到重複消失。每步用 r-l+1 更新最長 maxL。
   和 219 的「定長」不同:這裡收縮的依據是「視窗是否合法(無重複)」,窗長隨資料浮動。
   例 "pwwkew" → 最長無重複子字串 "wke" 長度 3。
     BAND 1  字串(綠=目前視窗 [l,r] · 紅=r · 灰=已移出)
     BAND 2  視窗內容 / 長度 / maxL
     BAND 3  擴張 or 收縮
   ============================================================ */
(function () {
  const canvas = document.getElementById('viz-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('viz-step'), labelEl = document.getElementById('viz-label');
  const bPrev = document.getElementById('viz-prev'), bNext = document.getElementById('viz-next'),
        bPlay = document.getElementById('viz-play'), bReset = document.getElementById('viz-reset');
  const C = { paper:'#ffffff', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf', cell:'#fafaf6', cellS:'#cfcfcf',
    src:'#dbe8f6', srcS:'#4478c0', srcT:'#2f5f9e', grn:'#d9e8c7', grnS:'#5fa866', grnT:'#3f7a3a',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424', off:'#eceae2', offS:'#c9c6ba', offT:'#8a8672', coral:'#cf3535' };

  const S = ['p','w','w','k','e','w'];
  // l, r, maxL, act, best(bool), text
  const steps = [
    { l:0, r:-1, maxL:0, act:'intro', text:'<strong>INITIAL</strong> · <code>"pwwkew"</code>。右指針 <code>r</code> 每步擴張;若視窗內出現重複字元,就從左收縮直到無重複。<code>maxL</code> 記最長。' },
    { l:0, r:0, maxL:1, act:'expand', text:'<strong>r=0 \'p\'</strong> · 視窗 <code>"p"</code>,無重複,長度 1 → <code>maxL=1</code>。' },
    { l:0, r:1, maxL:2, act:'expand', text:'<strong>r=1 \'w\'</strong> · 視窗 <code>"pw"</code>,無重複,長度 2 → <code>maxL=2</code>。' },
    { l:2, r:2, maxL:2, act:'shrink', text:'<strong>r=2 \'w\'</strong> · <code>w</code> 重複!從左收縮:移出 <code>p</code>、再移出舊 <code>w</code>,直到無重複 → 視窗 <code>"w"</code> [2,2]。<code>maxL</code> 不變(2)。' },
    { l:2, r:3, maxL:2, act:'expand', text:'<strong>r=3 \'k\'</strong> · 視窗 <code>"wk"</code>,長度 2。' },
    { l:2, r:4, maxL:3, act:'expand', best:true, text:'<strong>r=4 \'e\'</strong> · 視窗 <code>"wke"</code>,無重複,長度 3 → <strong>maxL=3(刷新)</strong>。' },
    { l:3, r:5, maxL:3, act:'shrink', text:'<strong>r=5 \'w\'</strong> · <code>w</code> 重複!收縮移出舊 <code>w</code> → 視窗 <code>"kew"</code> [3,5],長度 3。掃完 → <strong>回傳 maxL=3</strong>。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function triD(cx,cy,col){ ctx.beginPath(); ctx.moveTo(cx-6,cy-7); ctx.lineTo(cx+6,cy-7); ctx.lineTo(cx,cy+3); ctx.closePath(); ctx.fillStyle=col; ctx.fill(); }
  function triU(cx,cy,col){ ctx.beginPath(); ctx.moveTo(cx-6,cy+7); ctx.lineTo(cx+6,cy+7); ctx.lineTo(cx,cy-3); ctx.closePath(); ctx.fillStyle=col; ctx.fill(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,PAD=30;
    ctx.fillStyle=C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);
    const done = step===steps.length-1;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · s(綠=目前視窗 [l,r] · 紅=r · 灰=已移出)', PAD, 18);
    const n=S.length, cell=Math.min(72,(w-2*PAD)/n-10), gp=((w-2*PAD)-n*cell)/(n-1), gy=50, chh=44;
    for(let k=0;k<n;k++){
      const x=PAD+k*(cell+gp);
      const inWin = s.r>=0 && k>=s.l && k<=s.r;
      const isR = k===s.r;
      rr(x,gy,cell,chh,8);
      let bg=C.cell,bd=C.cellS,tc=C.text;
      if(s.r<0 || k<s.l || k>s.r){ bg=C.off; bd=C.offS; tc=C.offT; }
      if(inWin){ bg=C.grn; bd=C.grnS; tc=C.grnT; }
      if(isR){ bg=C.cur; bd=C.curS; tc=C.curT; }
      ctx.fillStyle=bg; ctx.fill(); ctx.lineWidth=isR?3:1.7; ctx.strokeStyle=bd; ctx.stroke();
      ctx.fillStyle=tc; ctx.font='700 21px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(S[k], x+cell/2, gy+chh/2);
      ctx.fillStyle=C.dim; ctx.font='600 10px "JetBrains Mono", monospace'; ctx.textBaseline='top';
      ctx.fillText(String(k), x+cell/2, gy+chh+6);
    }
    if(s.r>=0){ const rx=PAD+s.r*(cell+gp)+cell/2; triD(rx, gy-4, C.curS); ctx.fillStyle=C.curT; ctx.font='700 10px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='bottom'; ctx.fillText('r', rx, gy-10); }
    if(s.r>=0){ const lx=PAD+s.l*(cell+gp)+cell/2; triU(lx, gy+chh+16, C.srcS); ctx.fillStyle=C.srcT; ctx.font='700 10px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='top'; ctx.fillText('l', lx, gy+chh+22); }

    // ---- BAND 2 · window content / lengths ----
    const b2=134;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 視窗 = s[l..r] · 長度 r−l+1 · maxL 取最大', PAD, b2);
    rr(PAD,b2+10,w-PAD*2,40,6); ctx.fillStyle=(s.best||done)?C.grn:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=(s.best||done)?C.grnS:C.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    const win = s.r<0 ? '' : S.slice(s.l,s.r+1).join('');
    const len = s.r<0 ? 0 : (s.r-s.l+1);
    ctx.font='700 15px "JetBrains Mono", monospace'; ctx.fillStyle=C.text;
    ctx.fillText('視窗 "'+win+'"   長度 '+len+'      maxL = '+s.maxL, w/2, b2+30);

    // ---- BAND 3 · action ----
    const by=196;
    ctx.fillStyle=C.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 有重複 → 縮左(可變長);否則 r 擴張', PAD, by);
    rr(PAD,by+10,w-PAD*2,44,6); ctx.fillStyle=done?C.grn:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?C.grnS:C.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='600 12.5px "Noto Sans TC", sans-serif';
    let msg,col=C.text;
    if(s.act==='intro'){ msg='收縮依據是「視窗合不合法」,不是固定大小 → 可變長視窗'; }
    else if(done){ msg='完成 · 最長無重複子字串 "kew" 之一 · maxL=3 · O(n)'; col=C.grnT; }
    else if(s.act==='shrink'){ msg='s[r] 造成重複 → l 右移、移出字元,直到視窗恢復無重複'; col=C.curT; }
    else if(s.best){ msg='視窗仍無重複且更長 → 刷新 maxL'; col=C.grnT; }
    else { msg='s[r] 沒造成重複 → 視窗直接變長,r 前進'; col=C.srcT; }
    ctx.fillStyle=col; ctx.fillText(msg, w/2, by+32);
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
