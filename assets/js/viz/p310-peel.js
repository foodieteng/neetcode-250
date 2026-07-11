/* ============================================================
   P310 · Minimum Height Trees — 剝葉子找中心(逐步)· viz
   讓樹「最矮」的根,一定是樹的「中心」——只會有 1 或 2 個。做法像拓撲排序
   的反面:把所有葉子(deg==1)一層層往內剝,每剝一層 n 減去該層數量,直到
   剩下 ≤ 2 個節點,那 1~2 個就是答案。
   例 路徑 0-1-2-3-4-5 → 中心 {2,3}
     BAND 1  樹(灰=已剝掉 · 珊瑚=本層要剝的葉 · 綠=剩下的中心)
     BAND 2  deg[] · 剩餘節點數 n
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
    node:'#ffffff', nodeS:'#c9c9c1', gone:'#eeeeea', goneS:'#dcdcd6', goneT:'#b8b8b0',
    leaf:'#fbe7df', leafS:'#d96e4e', leafT:'#b3502f', center:'#d9e8c7', centerS:'#5fa866', centerT:'#3f7a3a',
    edge:'#b7c7d6', edgeGone:'#e4e4de', coral:'#d96e4e' };

  const N = 6;
  const EDGES = [[0,1],[1,2],[2,3],[3,4],[4,5]];
  const steps = [
    { removed:[], layer:[0,5], deg:[1,2,2,2,2,1], rem:6, centers:[], done:false,
      text:'<strong>INITIAL</strong> · 最矮樹的根 = 樹的<strong>中心</strong>(只會有 1 或 2 個)。做法:把<strong>葉子(deg==1)</strong>一層層往內剝。目前葉子:<code>{0, 5}</code> 入隊。' },
    { removed:[0,5], layer:[1,4], deg:[0,1,2,2,1,0], rem:4, centers:[], done:false,
      text:'<strong>剝第 1 層</strong>:移除葉子 <code>0、5</code>。它們的鄰居 <code>1、4</code> 的 <code>deg</code> 降到 <strong>1</strong> → 成為<strong>新葉子</strong>入隊。剩 <code>n=4</code>。' },
    { removed:[0,5,1,4], layer:[2,3], deg:[0,0,1,1,0,0], rem:2, centers:[2,3], done:true,
      text:'<strong>剝第 2 層</strong>:移除 <code>1、4</code>。<code>2、3</code> 的 <code>deg</code> 降到 1。剩 <code>n=2 ≤ 2</code> → <strong>停</strong>。' },
    { removed:[0,5,1,4], layer:[], deg:[0,0,1,1,0,0], rem:2, centers:[2,3], done:true, final:true,
      text:'剩下的 <code>{2, 3}</code> 就是<strong>最矮樹的根</strong>。從它們當根,樹高最小。答案 <code>[2, 3]</code>。' },
  ];

  const POS = {};
  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||440; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,h=canvas.clientHeight,PAD=26;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,h);
    const gap=Math.min(112,(w-2*PAD-60)/(N-1)); const x0=(w-(N-1)*gap)/2; const cyN=118;
    for(let i=0;i<N;i++) POS[i]=[x0+i*gap,cyN];
    const removed=new Set(s.removed), layer=new Set(s.layer), centers=new Set(s.centers);

    // ── BAND 1 · tree
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 樹(灰=已剝 · 珊瑚=本層要剝的葉 · 綠=剩下的中心)', PAD, 22);
    for(const [a,b] of EDGES){ const dead=removed.has(a)||removed.has(b);
      ctx.beginPath(); ctx.moveTo(POS[a][0],POS[a][1]); ctx.lineTo(POS[b][0],POS[b][1]); ctx.strokeStyle=dead?COLOR.edgeGone:COLOR.edge; ctx.lineWidth=dead?2:2.8; ctx.stroke(); }
    for(let id=0;id<N;id++){ const [x,y]=POS[id]; const gone=removed.has(id)&&!layer.has(id); const isLayer=layer.has(id);
      const isCenter=centers.has(id) && !isLayer;
      ctx.beginPath(); ctx.arc(x,y,23,0,Math.PI*2);
      ctx.fillStyle=isLayer?COLOR.leaf:(isCenter?COLOR.center:(gone?COLOR.gone:COLOR.node)); ctx.fill();
      ctx.lineWidth=isLayer?3.4:2.2; ctx.strokeStyle=isLayer?COLOR.leafS:(isCenter?COLOR.centerS:(gone?COLOR.goneS:COLOR.nodeS)); ctx.stroke();
      ctx.fillStyle=isLayer?COLOR.leafT:(isCenter?COLOR.centerT:(gone?COLOR.goneT:COLOR.ink)); ctx.font='700 17px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(String(id),x,y+1); }

    // ── BAND 2 · deg + n
    let by=200;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · deg[](剝掉鄰居就 −1;降到 1 = 新葉)· 剩餘 n', PAD, by);
    const cell=44, gx=PAD+58, cy=by+16;
    ctx.fillStyle=COLOR.dim; ctx.font='700 11px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText('node', PAD, cy);
    for(let j=0;j<N;j++){ ctx.fillStyle=COLOR.dim; ctx.font='700 11px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.fillText(String(j), gx+j*cell+cell/2-2, cy); }
    ctx.fillStyle=COLOR.text; ctx.font='700 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText('deg', PAD, cy+30);
    for(let j=0;j<N;j++){ const x=gx+j*cell; const val=s.deg[j]; const dead=removed.has(j)&&!layer.has(j); const isLeaf=(val===1);
      rr(x+4,cy+16,cell-8,28,5); ctx.fillStyle=dead?COLOR.gone:(isLeaf?'#fbe7df':'#eef4fa'); ctx.fill(); ctx.lineWidth=1.4; ctx.strokeStyle=dead?COLOR.goneS:(isLeaf?COLOR.leafS:'#a9c4da'); ctx.stroke();
      ctx.fillStyle=dead?COLOR.goneT:COLOR.ink; ctx.font='700 14px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(String(val), x+cell/2, cy+30); }
    ctx.fillStyle=COLOR.text; ctx.font='700 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText('n =', gx+N*cell+16, cy+30);
    ctx.fillStyle=s.done?COLOR.centerT:COLOR.coral; ctx.font='700 20px "JetBrains Mono", monospace'; ctx.fillText(String(s.rem), gx+N*cell+56, cy+30);

    // ── BAND 3 · note
    const ty=cy+70, done=!!s.final;
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 為什麼剩 ≤ 2 個就是答案', PAD, ty);
    const box=ty+12; rr(PAD,box,w-PAD*2,40,6); ctx.fillStyle=done?COLOR.center:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?COLOR.centerS:COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(done){ ctx.fillStyle=COLOR.centerT; ctx.font='700 13px "JetBrains Mono", monospace'; ctx.fillText('return [2, 3] · 樹的中心永遠是 1 或 2 個', w/2, box+20); }
    else { ctx.fillStyle=COLOR.text; ctx.font='600 12px "Noto Sans TC", sans-serif'; ctx.fillText('從最外圈往內剝,最後留在正中間、對稱位置的 1~2 點,到各葉距離最小 = 樹高最小', w/2, box+20); }
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
