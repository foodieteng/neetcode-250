/* ============================================================
   P860 · Lemonade Change — 貪心 · 為什麼 20 先找 10+5 · viz
   pay5 / pay10 = 抽屜裡 5 元、10 元的張數。
     收 5  → pay5++
     收 10 → 找 5:pay5--(不夠就 false),pay10++
     收 20 → 有 10 就找 10+5,否則找 5+5+5
   例 [5,5,5,5,10,20,10](最短反例之一,長度 7):
     A 貪心(先 10+5)→ true;B 先 5+5+5 → i=6 沒 5 可找 → false。
     BAND 1  帳單(紅 = 本步 · 藍 = 已處理)
     LANE A  貪心 · 20 先找 10+5
     LANE B  先給 5+5+5
   所有數字取自實測 trace。
   ============================================================ */
(function () {
  const canvas = document.getElementById('viz-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('viz-step'), labelEl = document.getElementById('viz-label');
  const bPrev = document.getElementById('viz-prev'), bNext = document.getElementById('viz-next'),
        bPlay = document.getElementById('viz-play'), bReset = document.getElementById('viz-reset');

  const C = { paper:'#ffffff', ink:'#1a1a1a', dim:'#9a9a9a', cell:'#ffffff',
    tint:'#e3edf5', tint2:'#f6ead8',
    red:'#cf3535', redBg:'#fbe1e1', redT:'#992424', red2:'#a31d1d',
    good:'#d9e8c7', goodT:'#3f6a2a', bad:'#f0d4d4', off:'#cfcfcf' };
  const MONO = '"JetBrains Mono", "Noto Sans TC", monospace', SANS = '"Noto Sans TC", sans-serif';

  const BILLS = [5,5,5,5,10,20,10], N = BILLS.length;

  /* 每條 lane 每一步:p5 / p10 = 處理完後的張數;d5 / d10 = 本步變化;
     act = 本欄動作(對齊帳單欄);msg = 右側動作說明;fail = 本步失敗 */
  const A = [
    { p5:0, p10:0, msg:'等待第一張帳單' },
    { p5:1, p10:0, d5:+1, act:'收 5', msg:'收 5 → pay5 +1' },
    { p5:2, p10:0, d5:+1, act:'收 5', msg:'收 5 → pay5 +1' },
    { p5:3, p10:0, d5:+1, act:'收 5', msg:'收 5 → pay5 +1' },
    { p5:4, p10:0, d5:+1, act:'收 5', msg:'收 5 → pay5 +1' },
    { p5:3, p10:1, d5:-1, d10:+1, act:'找 5', msg:'收 10 → 找 5' },
    { p5:2, p10:0, d5:-1, d10:-1, act:'找 10+5', msg:'收 20 → 有 10,找 10+5' },
    { p5:1, p10:1, d5:-1, d10:+1, act:'找 5', msg:'收 10 → 找 5 · ✓ true', ok:true },
  ];
  const B = [
    { p5:0, p10:0, msg:'等待第一張帳單' },
    { p5:1, p10:0, d5:+1, act:'收 5', msg:'收 5 → pay5 +1' },
    { p5:2, p10:0, d5:+1, act:'收 5', msg:'收 5 → pay5 +1' },
    { p5:3, p10:0, d5:+1, act:'收 5', msg:'收 5 → pay5 +1' },
    { p5:4, p10:0, d5:+1, act:'收 5', msg:'收 5 → pay5 +1' },
    { p5:3, p10:1, d5:-1, d10:+1, act:'找 5', msg:'收 10 → 找 5' },
    { p5:0, p10:1, d5:-3, act:'找 5+5+5', msg:'收 20 → 找 5+5+5' },
    { p5:0, p10:1, act:'✗ 沒 5', msg:'收 10 要找 5 → 沒有 · ✗ false', fail:true },
  ];

  const steps = [
    { text:'<strong>INITIAL</strong> · 帳單 <code>[5,5,5,5,10,20,10]</code>。兩個抽屜都從 <code>pay5=0</code>、<code>pay10=0</code> 開始。收到 20 時:<b>A</b> 先找 <code>10+5</code>,<b>B</b> 先找 <code>5+5+5</code>。' },
    { text:'<code>i=0</code> 收 5 · A、B 都只是收下 → <code>pay5=1</code>,<code>pay10=0</code>。' },
    { text:'<code>i=1</code> 收 5 · A、B 都 <code>pay5=2</code>,<code>pay10=0</code>。' },
    { text:'<code>i=2</code> 收 5 · A、B 都 <code>pay5=3</code>,<code>pay10=0</code>。' },
    { text:'<code>i=3</code> 收 5 · A、B 都 <code>pay5=4</code>,<code>pay10=0</code>。前四張兩邊完全一樣。' },
    { text:'<code>i=4</code> 收 10 · 兩邊都找一張 5 → <code>pay5=3</code>,<code>pay10=1</code>。抽屜裡現在有一張 10。' },
    { text:'<code>i=5</code> 收 20 · <b>A</b> 有 10 → 找 <code>10+5</code>,剩 <code>pay5=2</code>、<code>pay10=0</code>;<b>B</b> 用掉三張 5,<code>pay5=0</code>、<code>pay10=1</code>(10 留在抽屜裡沒用)。' },
    { text:'<code>i=6</code> 收 10 · 要找一張 5。<b>A</b> 還有 <code>pay5=2</code> → 找 5,<code>pay5=1</code>、<code>pay10=1</code> → <strong>true</strong>;<b>B</b> <code>pay5=0</code> → <strong>false</strong>(正解 true)。教訓:<b>10 元只能找 20 用,5 元萬用 → 能用 10 就先用 10</b>。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function txt(s,x,y,font,color,align,base){ ctx.font=font; ctx.fillStyle=color; ctx.textAlign=align||'left'; ctx.textBaseline=base||'alphabetic'; ctx.fillText(s,x,y); }
  function tw(s,font){ ctx.font=font; return ctx.measureText(s).width; }
  function cellBox(x,y,cw,ch,st,val,font){
    rr(x,y,cw,ch,5); ctx.fillStyle=st.bg; ctx.fill();
    ctx.setLineDash(st.dash?[4,3]:[]); ctx.lineWidth=st.lw||1.4; ctx.strokeStyle=st.bd; ctx.stroke(); ctx.setLineDash([]);
    if(val!==null && val!==undefined) txt(String(val), x+cw/2, y+ch/2+1, font, st.tx, 'center', 'middle');
  }
  function fitFont(s, maxW, weight, sizes, fam){ for(const z of sizes){ const f=weight+' '+z+'px '+fam; if(tw(s,f)<=maxW) return f; } return weight+' '+sizes[sizes.length-1]+'px '+fam; }

  function draw(){
    fit();
    const w=canvas.clientWidth, h=canvas.clientHeight, PAD=22, IN=10;
    ctx.fillStyle=C.paper; ctx.fillRect(0,0,w,h); ctx.setLineDash([]);
    const final = step===steps.length-1;
    const cur = step-1;                                   // 目前處理的帳單 index(step 0 時 -1)

    const X0=PAD+70, XR=w-PAD-IN, colW=(XR-X0)/N, cg=Math.min(12, colW*0.14), cw=colW-cg;
    const cx=k=>X0+k*colW+cg/2;
    const tagX=PAD+35;                                    // 左側標籤中心

    /* ---------- BAND 1 · bills ---------- */
    const B1=18, by=54, bh=36;
    txt('BAND 1 · bills   紅 = 本步這張   藍 = 已處理', PAD, B1, '600 11.5px '+MONO, C.dim);
    txt('bills', tagX, by+bh/2+1, '700 13px '+MONO, C.ink, 'center', 'middle');
    for(let k=0;k<N;k++){
      const x=cx(k), isCur=k===cur, done=k<cur;
      let st={bg:C.cell, bd:C.ink, tx:C.ink, lw:1.4};
      if(done) st={bg:C.tint, bd:C.ink, tx:C.ink, lw:1.4};
      if(isCur) st={bg:C.redBg, bd:C.red, tx:C.redT, lw:2.8};
      txt('i='+k, x+cw/2, by-18, '700 10.5px '+MONO, isCur?C.redT:C.dim, 'center', 'middle');
      cellBox(x,by,cw,bh,st,BILLS[k],'700 17px '+MONO);
    }

    /* ---------- LANES ---------- */
    lane(A, 'A', '貪心', 'LANE A · 貪心 · 20 先找 10+5', by+bh+40, false);
    lane(B, 'B', '5+5+5', 'LANE B · 先給 5+5+5', by+bh+40+148, true);

    function lane(L, letter, sub, title, LT, isB){
      const s=L[step];
      const failed = L.slice(0,step+1).some(o=>o.fail);
      const okDone = final && s.ok;
      const pT=LT+12, ay=pT+IN, ah=30, dy=ay+ah+14, dh=34, pH=(dy+dh+IN)-pT;
      txt(title, PAD, LT, '700 12px '+SANS, isB?C.red2:C.ink);

      // panel
      rr(PAD,pT,w-2*PAD,pH,8);
      ctx.fillStyle = failed?C.bad:(okDone?C.good:(isB?C.tint2:C.tint)); ctx.fill();
      ctx.lineWidth=1.2; ctx.strokeStyle=failed?C.red:C.ink; ctx.stroke();

      // lane tag (left margin, vertically centred)
      const cy=pT+pH/2;
      ctx.beginPath(); ctx.arc(tagX, cy-9, 14, 0, Math.PI*2);
      ctx.fillStyle=failed?C.redT:C.ink; ctx.fill();
      txt(letter, tagX, cy-8, '700 15px '+MONO, C.paper, 'center', 'middle');
      txt(sub, tagX, cy+20, '700 10.5px '+(letter==='A'?SANS:MONO), failed?C.redT:C.ink, 'center', 'middle');

      // action row aligned with bill columns
      for(let k=0;k<N;k++){
        const x=cx(k), o=L[k+1], isCur=k===cur, seen=k<=cur;
        if(!seen){ cellBox(x,ay,cw,ah,{bg:'rgba(255,255,255,0.55)', bd:C.off, tx:C.off, lw:1.2, dash:true},null); continue; }
        let st={bg:C.cell, bd:C.ink, tx:C.ink, lw:1.2};
        if(isCur) st={bg:C.redBg, bd:C.red, tx:C.redT, lw:2.4};
        if(o.fail) st={bg:C.bad, bd:C.red, tx:C.redT, lw:2.4};
        cellBox(x,ay,cw,ah,st,o.act, fitFont(o.act, cw-8, '700', [12,11,10], SANS));
      }

      // drawer: pay5 / pay10 count boxes + deltas
      let x=X0;
      const lf='700 12px '+MONO, bw=46, dw=34;
      function counter(name, val, d, failBox){
        txt(name, x, dy+dh/2+1, lf, C.ink, 'left', 'middle'); x+=tw(name,lf)+8;
        let st={bg:C.cell, bd:C.ink, tx:C.ink, lw:1.4};
        if(d) st={bg:C.redBg, bd:C.red, tx:C.redT, lw:2.4};
        if(failBox) st={bg:C.bad, bd:C.red, tx:C.redT, lw:2.6};
        cellBox(x,dy,bw,dh,st,val,'700 19px '+MONO); x+=bw+8;
        if(d){ const t=(d>0?'+':'−')+Math.abs(d); txt(t, x, dy+dh/2+1, '700 12.5px '+MONO, d>0?C.ink:C.red2, 'left', 'middle'); }
        if(failBox){ txt('不夠', x, dy+dh/2+1, '700 12px '+SANS, C.red2, 'left', 'middle'); }
        x+=dw;
      }
      counter('pay5', s.p5, s.d5, !!s.fail);
      x+=18;
      counter('pay10', s.p10, s.d10, false);
      x+=18;

      // action message box (fills the rest)
      const mx=x, mw=XR-mx;
      rr(mx,dy,mw,dh,6);
      ctx.fillStyle = s.fail?C.bad:(okDone?C.good:C.cell); ctx.fill();
      ctx.lineWidth = (s.fail||okDone)?2.2:1.2; ctx.strokeStyle = s.fail?C.red:C.ink; ctx.stroke();
      const mf=fitFont(s.msg, mw-16, '700', [13,12,11,10.5], SANS);
      txt(s.msg, mx+mw/2, dy+dh/2+1, mf, s.fail?C.redT:(okDone?C.goodT:(step===0?C.dim:C.ink)), 'center', 'middle');
    }
  }

  function update(){ if(stepEl) stepEl.textContent=String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0'); if(labelEl) labelEl.innerHTML=steps[step].text; draw(); }
  function next(){ if(step<steps.length-1){step++;update();}else stop(); }
  function prev(){ if(step>0){step--;update();} }
  function reset(){ stop(); step=0; update(); }
  function play(){ if(timer){stop();return;} bPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){stop();return;} next(); },1900); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} if(bPlay) bPlay.textContent='Play'; }
  bPrev&&bPrev.addEventListener('click',prev); bNext&&bNext.addEventListener('click',next); bPlay&&bPlay.addEventListener('click',play); bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();}); if(window.ResizeObserver){ new ResizeObserver(()=>{fit();draw();}).observe(canvas); }
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw); fit(); update();
})();
