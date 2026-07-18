/* ============================================================
   P684 · Redundant Connection — Union-Find 找成環邊(逐步)· viz
   n 個點、n 條邊 → 必有剛好一個環。照順序逐邊 union;第一條「兩端已在
   同一組(find 同根)」的邊,就是造成環的多餘邊 → 回傳它。
   例 edges=[[1,2],[1,3],[2,3]] → 多餘邊 [2,3]
     BAND 1  圖(綠=已成功連上 · 紅=造成環的多餘邊)
     BAND 2  parent[1..3](負值=根)· 目前處理的邊
     BAND 3  說明
   ============================================================ */
(function () {
  const canvas = document.getElementById('viz-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('viz-step'), labelEl = document.getElementById('viz-label');
  const bPrev = document.getElementById('viz-prev'), bNext = document.getElementById('viz-next'),
        bPlay = document.getElementById('viz-play'), bReset = document.getElementById('viz-reset');

  const COLOR = { paper:'#ffffff', ink:'#1a1a1a', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf',
    node:'#f3f3ef', nodeS:'#c9c9c1', on:'#d9e8c7', onS:'#5fa866', onT:'#3f7a3a',
    edgeOk:'#5fa866', bad:'#a31d1d', coral:'#cf3535', root:'#fbe1e1', rootS:'#cf3535' };

  // edges array: [a,b,status]  status: 'ok' | 'bad'
  const steps = [
    { edges:[], parent:[-1,-1,-1], set:[], cur:null, ans:null,
      text:'<strong>INITIAL</strong> · <code>n</code> 個點 + <code>n</code> 條邊 → 必有<strong>剛好一個環</strong>。照順序逐邊 <code>union</code>;第一條「兩端<strong>已連通</strong>」的邊 = 多餘邊。' },
    { edges:[[1,2,'ok']], parent:[-2,1,-1], set:[1,2], cur:[1,2], ans:null,
      text:'邊 <code>(1,2)</code>:不同根 → <code>union</code> 成功,連上。<code>{1,2}</code> 同一組。' },
    { edges:[[1,2,'ok'],[1,3,'ok']], parent:[-3,1,1], set:[1,2,3], cur:[1,3], ans:null,
      text:'邊 <code>(1,3)</code>:不同根 → <code>union</code> 成功。<code>{1,2,3}</code> 全連通了。' },
    { edges:[[1,2,'ok'],[1,3,'ok'],[2,3,'bad']], parent:[-3,1,1], set:[1,2,3], cur:[2,3], ans:[2,3], done:true,
      text:'邊 <code>(2,3)</code>:<code>find(2)=find(3)=1</code> <strong>同根!</strong> 這條邊讓已連通的兩點又多一條路 → <strong>成環</strong> → 回傳 <code>[2,3]</code>。' },
  ];

  const POS = {1:null,2:null,3:null};
  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||454; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,h=canvas.clientHeight,PAD=26; const cx=w/2;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,h);
    POS[1]=[cx,84]; POS[2]=[cx-104,214]; POS[3]=[cx+104,214];
    const inSet=new Set(s.set);

    // ── BAND 1 · graph
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 圖(綠=已成功連上 · 紅=造成環的多餘邊)', PAD, 22);
    for(const [a,b,st] of s.edges){ const bad=(st==='bad');
      ctx.beginPath(); ctx.moveTo(POS[a][0],POS[a][1]); ctx.lineTo(POS[b][0],POS[b][1]);
      ctx.strokeStyle=bad?COLOR.bad:COLOR.edgeOk; ctx.lineWidth=bad?4:2.8; ctx.setLineDash(bad?[7,5]:[]); ctx.stroke(); ctx.setLineDash([]);
      if(bad){ const mx=(POS[a][0]+POS[b][0])/2, my=(POS[a][1]+POS[b][1])/2; ctx.fillStyle=COLOR.bad; ctx.font='700 11px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('✗ 環', mx, my-12); } }
    for(const id of [1,2,3]){ const [x,y]=POS[id]; const on=inSet.has(id); const isCurEnd=s.cur&&s.cur.includes(id);
      ctx.beginPath(); ctx.arc(x,y,24,0,Math.PI*2);
      ctx.fillStyle=on?COLOR.on:COLOR.node; ctx.fill();
      ctx.lineWidth=isCurEnd?3.6:2.2; ctx.strokeStyle=isCurEnd?(s.done?COLOR.bad:COLOR.coral):(on?COLOR.onS:COLOR.nodeS); ctx.stroke();
      ctx.fillStyle=on?COLOR.onT:COLOR.ink; ctx.font='700 18px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(String(id),x,y+1); }

    // ── BAND 2 · parent[1..3] + current edge
    let by=276;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · parent[1..3](負值=根)· 目前處理的邊', PAD, by);
    const cell=48, gx=PAD+64, cy=by+14;
    ctx.fillStyle=COLOR.dim; ctx.font='700 11px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText('idx', PAD, cy);
    for(let j=1;j<=3;j++){ ctx.fillStyle=COLOR.dim; ctx.font='700 11px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.fillText(String(j), gx+(j-1)*cell+cell/2-2, cy); }
    ctx.fillStyle=COLOR.text; ctx.font='700 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText('parent', PAD, cy+38);
    for(let j=1;j<=3;j++){ const x=gx+(j-1)*cell; const val=s.parent[j-1]; const isRoot=val<0;
      rr(x+4,cy+24,cell-8,28,5); ctx.fillStyle=isRoot?'#fbe1e1':'#eef4fa'; ctx.fill(); ctx.lineWidth=1.4; ctx.strokeStyle=isRoot?COLOR.rootS:'#a9c4da'; ctx.stroke();
      ctx.fillStyle=COLOR.ink; ctx.font='700 14px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(String(val), x+cell/2, cy+38); }
    // current edge
    if(s.cur){ ctx.fillStyle=COLOR.text; ctx.font='700 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText('edge', gx+3*cell+22, cy+38);
      ctx.fillStyle=s.done?COLOR.bad:COLOR.coral; ctx.font='700 16px "JetBrains Mono", monospace'; ctx.fillText('('+s.cur[0]+','+s.cur[1]+')', gx+3*cell+70, cy+38); }

    // ── BAND 3 · note
    const ty=cy+78, done=!!s.done;
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 為什麼「同根的邊」= 多餘', PAD, ty);
    const box=ty+12; rr(PAD,box,w-PAD*2,40,6); ctx.fillStyle=done?'#fbe3e0':'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?COLOR.bad:COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(done){ ctx.fillStyle='#b3352f'; ctx.font='700 13px "JetBrains Mono", monospace'; ctx.fillText('return [2,3] · 第一條使 union 失敗的邊', w/2, box+20); }
    else { ctx.fillStyle=COLOR.text; ctx.font='600 12px "Noto Sans TC", sans-serif'; ctx.fillText('兩端已連通 → 它們之間本就有路 → 這條邊多一條 = 環;照順序第一條就是答案', w/2, box+20); }
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
