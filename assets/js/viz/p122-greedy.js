/* ============================================================
   P122 · Best Time to Buy and Sell Stock II — 貪心:加總每個正的日差 · viz
   無限次交易、同日可買賣、最多持一股 → 最大利潤 = Σ max(0, prices[i]−prices[i−1])。
   直覺:任何一段獲利的持有(低買高賣)= 這段內每日漲幅的總和(電話線 telescoping)。
   所以「抓住每一個上漲日」= 抓住每一段獲利;下跌日不持有,貢獻 0。
   例 [7,1,5,3,6,4]:漲幅 +4(1→5)、+3(3→6),其餘為跌 → 4+3 = 7。
     BAND 1  價格折線(綠段=上漲,計入 · 灰段=下跌,略過)
     BAND 2  本段日差 prices[i] − prices[i−1]
     BAND 3  累積利潤 + telescoping 洞察
   ============================================================ */
(function () {
  const canvas = document.getElementById('viz-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('viz-step'), labelEl = document.getElementById('viz-label');
  const bPrev = document.getElementById('viz-prev'), bNext = document.getElementById('viz-next'),
        bPlay = document.getElementById('viz-play'), bReset = document.getElementById('viz-reset');

  const COLOR = { paper:'#ffffff', ink:'#1a1a1a', dim:'#9a9a9a', text:'#1f3550', grid:'#e2e2dc',
    cell:'#fafaf6', cellS:'#cfcfcf', src:'#dbe8f6', srcS:'#4478c0', srcT:'#2f5f9e',
    grn:'#d9e8c7', grnS:'#5fa866', grnT:'#3f7a3a',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424', done:'#d9e8c7', doneS:'#5fa866', doneT:'#3f7a3a',
    off:'#f0f0ec', offS:'#c9c9c2', offT:'#a8a8a0', coral:'#cf3535' };

  const P = [7,1,5,3,6,4];
  const N = P.length;
  // 每步處理 segment i-1 -> i(i 從 1..N-1);step 0 是 intro
  const steps = [];
  steps.push({ seg:-1, profit:0, phase:'intro',
    text:'<strong>INITIAL</strong> · <code>prices=[7,1,5,3,6,4]</code>。可無限次交易 → 最大利潤 = <strong>每個「今天比昨天貴」的漲幅總和</strong>。跌的日子不持有,貢獻 0。' });
  let prof=0;
  for(let i=1;i<N;i++){
    const d=P[i]-P[i-1]; const up=d>0; if(up) prof+=d;
    steps.push({ seg:i, diff:d, up, profit:prof, phase:(i===N-1?'done':'run'),
      text: up
        ? '<strong>day '+(i-1)+'→'+i+'</strong> · <code>'+P[i-1]+'→'+P[i]+'</code>,漲 <strong>+'+d+'</strong> → 計入。利潤 = '+prof+(i===N-1?'。答案 = <strong>7</strong>。':'。')
        : '<strong>day '+(i-1)+'→'+i+'</strong> · <code>'+P[i-1]+'→'+P[i]+'</code>,跌 <code>'+d+'</code> → 略過(不持有)。利潤仍 = '+prof+(i===N-1?'。答案 = <strong>7</strong>。':'。')
    });
  }

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,PAD=30;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,canvas.clientHeight);
    const done=s.phase==='done';

    // ── BAND 1 · price chart ──
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 價格折線(綠=上漲計入 · 灰=下跌略過 · 紅框=當前段)', PAD, 22);

    const minP=0, maxP=8, topY=44, botY=150;
    const xAt = k => PAD+18 + k*((w-2*PAD-36)/(N-1));
    const yAt = v => botY - (v-minP)/(maxP-minP)*(botY-topY);

    // baseline grid
    ctx.strokeStyle=COLOR.grid; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(PAD,botY); ctx.lineTo(w-PAD,botY); ctx.stroke();

    // segments
    for(let i=1;i<N;i++){
      const up=P[i]>P[i-1], flat=P[i]===P[i-1];
      const active=(s.seg===i);
      const x1=xAt(i-1), y1=yAt(P[i-1]), x2=xAt(i), y2=yAt(P[i]);
      const drawn = s.seg>=i || done; // segments up to current are "resolved"
      ctx.strokeStyle = up ? COLOR.grnS : COLOR.offS;
      ctx.lineWidth = active?4:2.4;
      ctx.globalAlpha = (s.phase==='intro') ? 0.35 : (drawn?1:0.28);
      ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
      ctx.globalAlpha=1;
      // +diff label on captured up segments (resolved)
      if(up && (drawn) && s.phase!=='intro'){
        ctx.fillStyle=COLOR.grnT; ctx.font='700 11px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='bottom';
        ctx.fillText('+'+(P[i]-P[i-1]), (x1+x2)/2, Math.min(y1,y2)-6);
      }
      // active segment red highlight ring
      if(active && !done && s.phase!=='intro'){
        ctx.strokeStyle=COLOR.curS; ctx.lineWidth=1.6; ctx.setLineDash([3,3]);
        const mx=(x1+x2)/2, my=(y1+y2)/2;
        ctx.strokeRect(Math.min(x1,x2)-6, Math.min(y1,y2)-6, Math.abs(x2-x1)+12, Math.abs(y2-y1)+12);
        ctx.setLineDash([]);
      }
    }
    // points
    for(let k=0;k<N;k++){
      const x=xAt(k), y=yAt(P[k]);
      const onCur=(s.seg===k || s.seg===k+1);
      ctx.beginPath(); ctx.arc(x,y,onCur&&!done?6:4.5,0,Math.PI*2);
      ctx.fillStyle=COLOR.paper; ctx.fill(); ctx.lineWidth=2.2; ctx.strokeStyle=onCur&&!done?COLOR.curS:COLOR.srcS; ctx.stroke();
      ctx.fillStyle=COLOR.text; ctx.font='700 12px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='bottom';
      ctx.fillText(String(P[k]), x, y-9);
      ctx.fillStyle=COLOR.dim; ctx.font='600 9.5px "JetBrains Mono", monospace'; ctx.textBaseline='top';
      ctx.fillText('d'+k, x, botY+5);
    }

    // ── BAND 2 · diff ──
    const by=176;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · profit += max(0, prices[i] − prices[i−1])', PAD, by);
    rr(PAD,by+10,w-PAD*2,42,6); ctx.fillStyle='#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(s.phase==='intro'){ ctx.fillStyle=COLOR.text; ctx.font='600 12.5px "Noto Sans TC", sans-serif';
      ctx.fillText('只要今天比昨天貴,就把差價賺下來;跌的日子什麼都不做', w/2, by+31); }
    else { ctx.font='700 13.5px "JetBrains Mono", monospace';
      ctx.fillStyle=s.up?COLOR.grnT:COLOR.offT;
      ctx.fillText(P[s.seg]+' − '+P[s.seg-1]+' = '+(s.diff>0?'+':'')+s.diff+(s.up?'  → 計入':'  → 略過(max 取 0)'), w/2, by+31); }

    // ── BAND 3 · profit ──
    const ty=232;
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 累積利潤(每段漲幅相加 = 每段獲利持有的總和)', PAD, ty);
    rr(PAD,ty+10,w-PAD*2,42,6); ctx.fillStyle=done?COLOR.done:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?COLOR.doneS:COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillStyle=done?COLOR.doneT:COLOR.text; ctx.font='700 14px "JetBrains Mono", monospace';
    ctx.fillText('profit = '+s.profit + (done?'   ← 答案':''), w/2, ty+31);
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
