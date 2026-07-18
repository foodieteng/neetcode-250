/* ============================================================
   P323 · Number of Connected Components — DFS 洪水填充(逐步)· va
   對每個「還沒訪過」的節點,開一個新的連通塊、cnt++,再 DFS 把整片染色。
   掃完所有點,cnt = 連通塊數量。
   例 n=5, edges=[[0,1],[1,2],[3,4]] → 2 塊:{0,1,2}、{3,4}
     BAND 1  圖(灰=未訪 · 綠/藍=第 1/2 塊 · 紅=本步 DFS 起點)
     BAND 2  cnt 計數
     BAND 3  說明
   ============================================================ */
(function () {
  const canvas = document.getElementById('va-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('va-step'), labelEl = document.getElementById('va-label');
  const bPrev = document.getElementById('va-prev'), bNext = document.getElementById('va-next'),
        bPlay = document.getElementById('va-play'), bReset = document.getElementById('va-reset');

  const COLOR = { paper:'#ffffff', ink:'#1a1a1a', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf',
    node:'#f3f3ef', nodeS:'#c9c9c1', edge:'#b7c7d6', coral:'#cf3535', curS:'#cf3535' };
  const CC = { 1:{f:'#d9e8c7',s:'#5fa866',t:'#3f7a3a'}, 2:{f:'#dbe8f6',s:'#4478c0',t:'#2f5f9e'} };

  const E = [[0,1],[1,2],[3,4]];
  const steps = [
    { comp:{}, cnt:0, cur:null,
      text:'<strong>INITIAL</strong> · 數<strong>連通塊</strong>。對每個「還沒訪過」的點:開一個新塊、<code>cnt++</code>,再 DFS 把<strong>整片相連的</strong>都染成同一塊。' },
    { comp:{0:1,1:1,2:1}, cnt:1, cur:0,
      text:'<code>i=0</code> 未訪 → <code>cnt=1</code>,<code>dfs(0)</code> 沿邊擴散,把 <code>0→1→2</code> 整片染成<strong>第 1 塊</strong>。' },
    { comp:{0:1,1:1,2:1,3:2,4:2}, cnt:2, cur:3,
      text:'<code>i=1,2</code> 已訪,跳過。<code>i=3</code> 未訪 → <code>cnt=2</code>,<code>dfs(3)</code> 染 <code>3→4</code> 成<strong>第 2 塊</strong>。' },
    { comp:{0:1,1:1,2:1,3:2,4:2}, cnt:2, cur:null, done:true,
      text:'<code>i=4</code> 已訪。掃完所有點 → <code>cnt = 2</code> 個連通塊:<code>{0,1,2}</code>、<code>{3,4}</code>。' },
  ];

  const POS = {};
  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||420; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,h=canvas.clientHeight,PAD=26; const cx=w/2;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,h);
    POS[0]=[cx-176,96]; POS[1]=[cx-104,166]; POS[2]=[cx-186,224]; POS[3]=[cx+96,128]; POS[4]=[cx+176,200];

    // ── BAND 1 · graph
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 圖(灰=未訪 · 綠/藍=第 1/2 塊 · 紅=本步 DFS 起點)', PAD, 22);
    for(const [a,b] of E){ ctx.beginPath(); ctx.moveTo(POS[a][0],POS[a][1]); ctx.lineTo(POS[b][0],POS[b][1]); ctx.strokeStyle=COLOR.edge; ctx.lineWidth=2.4; ctx.stroke(); }
    for(const id of [0,1,2,3,4]){ const [x,y]=POS[id]; const c=s.comp[id]; const isCur=(id===s.cur); const pal=c?CC[c]:null;
      ctx.beginPath(); ctx.arc(x,y,23,0,Math.PI*2);
      ctx.fillStyle=pal?pal.f:COLOR.node; ctx.fill();
      ctx.lineWidth=isCur?3.6:2.2; ctx.strokeStyle=isCur?COLOR.curS:(pal?pal.s:COLOR.nodeS); ctx.stroke();
      ctx.fillStyle=pal?pal.t:COLOR.ink; ctx.font='700 17px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(String(id),x,y+1); }

    // ── BAND 2 · cnt
    let by=272;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · cnt(遇到未訪點才 +1)', PAD, by);
    const cy=by+14;
    ctx.fillStyle=COLOR.text; ctx.font='700 13px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText('cnt =', PAD, cy+16);
    ctx.fillStyle=s.done?CC[1].t:COLOR.text; ctx.font='700 22px "JetBrains Mono", monospace'; ctx.fillText(String(s.cnt), PAD+62, cy+16);
    // component chips
    let bx=PAD+120;
    for(const cc of [1,2]){ const has=Object.values(s.comp).includes(cc); if(!has) continue; const pal=CC[cc];
      const members=Object.keys(s.comp).filter(k=>s.comp[k]===cc).join(',');
      const label='{'+members+'}'; ctx.font='700 13px "JetBrains Mono", monospace'; const tw=ctx.measureText(label).width;
      rr(bx,cy,tw+22,32,6); ctx.fillStyle=pal.f; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=pal.s; ctx.stroke();
      ctx.fillStyle=pal.t; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText(label, bx+11, cy+17); bx+=tw+34; }

    // ── BAND 3 · note
    const ty=cy+58, done=!!s.done;
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 每次新的 DFS = 一個新塊', PAD, ty);
    const box=ty+12; rr(PAD,box,w-PAD*2,40,6); ctx.fillStyle=done?CC[1].f:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?CC[1].s:COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(done){ ctx.fillStyle=CC[1].t; ctx.font='700 13px "JetBrains Mono", monospace'; ctx.fillText('return 2 · 兩個連通塊', w/2, box+20); }
    else { ctx.fillStyle=COLOR.text; ctx.font='600 12px "Noto Sans TC", sans-serif'; ctx.fillText('外層碰到「未訪點」才 cnt++;那一趟 DFS 會把同塊的全部標掉,不再重複計數', w/2, box+20); }
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
