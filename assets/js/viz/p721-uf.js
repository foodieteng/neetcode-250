/* ============================================================
   P721 · Accounts Merge — Union-Find(節點 = email)· viz
   把每個 email 映射成一個整數 id(節點是 email,不是帳號)。同一個帳號裡的
   email 全部 union 起來(星形:acct[1] 連 acct[i])。因為「同一個 email 字串
   對到同一個 id」,兩個帳號只要共用一個 email 就會自動被併進同一組。最後依
   root 分組、email 排序、掛回擁有者名字。
   例 [John:a,b] [John:a,c] [Mary:d] → {a,b,c}=John、{d}=Mary
     BAND 1  email 節點(綠/藍=同一組 · 邊=union)
     BAND 2  email→id · parent[] · 目前帳號
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
    node:'#f3f3ef', nodeS:'#c9c9c1', edge:'#8fae6e', coral:'#d96e4e' };
  const CC = { 0:{f:'#d9e8c7',s:'#5fa866',t:'#3f7a3a'}, 3:{f:'#dbe8f6',s:'#4478c0',t:'#2f5f9e'} };
  const LABEL = ['a','b','c','d'];   // a=johnsmith, b=john_ny, c=john00, d=mary
  const OWNER = ['John','John','John','Mary'];

  const steps = [
    { parent:[-1,-1,-1,-1], links:[], acct:null, cur:[], note:'map',
      text:'<strong>INITIAL</strong> · 節點是 <strong>email</strong>(不是帳號)。每個 email 給一個 id:<code>a=0, b=1, c=2, d=3</code>。同帳號的 email 互相 <code>union</code>;<strong>同一個 email = 同一個 id</strong>,共用 email 的帳號會自動合併。' },
    { parent:[-2,0,-1,-1], links:[[1,0]], acct:'["John", a, b]', cur:[0,1], note:'',
      text:'帳號 0 <code>["John", a, b]</code>:星形 union —— <code>union(a, b)</code>。<code>{a,b}</code> 同一組。' },
    { parent:[-3,0,0,-1], links:[[1,0],[2,0]], acct:'["John", a, c]', cur:[0,2], note:'merge',
      text:'帳號 1 <code>["John", a, c]</code>:<code>union(a, c)</code>。<strong>關鍵</strong>:<code>a</code> 和帳號 0 是<strong>同一個 id</strong>,所以 <code>c</code> 併進來 → <code>{a,b,c}</code> 兩帳號合併。' },
    { parent:[-3,0,0,-1], links:[[1,0],[2,0]], acct:'["Mary", d]', cur:[3], note:'single',
      text:'帳號 2 <code>["Mary", d]</code>:只有一個 email,沒得 union。<code>{d}</code> 自成一組。' },
    { parent:[-3,0,0,-1], links:[[1,0],[2,0]], acct:null, cur:[], done:true,
      text:'依 <code>root</code> 分組:<code>{a,b,c}</code>(root 0)、<code>{d}</code>(root 3)。每組 email <strong>排序</strong>、前面掛回 <code>owner[root]</code> → <code>[John,a,b,c]</code>、<code>[Mary,d]</code>。' },
  ];

  const POS = {};
  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||500; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function rootOf(parent,x){ while(parent[x]>=0) x=parent[x]; return x; }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,h=canvas.clientHeight,PAD=26; const cx=w/2;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,h);
    POS[0]=[cx-150,112]; POS[1]=[cx-232,234]; POS[2]=[cx-68,234]; POS[3]=[cx+178,173];
    const single=(step===0);

    // ── BAND 1 · email nodes
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 節點 = email(綠/藍=同一組 · 邊 = union)', PAD, 22);
    for(const [c,p] of s.links){ ctx.beginPath(); ctx.moveTo(POS[c][0],POS[c][1]); ctx.lineTo(POS[p][0],POS[p][1]); ctx.strokeStyle=COLOR.edge; ctx.lineWidth=2.8; ctx.stroke(); }
    for(const id of [0,1,2,3]){ const [x,y]=POS[id]; const r=single?null:rootOf(s.parent,id); const pal=(r!=null&&CC[r])?CC[r]:null; const isCur=s.cur.includes(id);
      ctx.beginPath(); ctx.arc(x,y,24,0,Math.PI*2);
      ctx.fillStyle=single?COLOR.node:(pal?pal.f:COLOR.node); ctx.fill();
      ctx.lineWidth=isCur?3.6:2.2; ctx.strokeStyle=isCur?COLOR.coral:(single?COLOR.nodeS:(pal?pal.s:COLOR.nodeS)); ctx.stroke();
      ctx.fillStyle=single?COLOR.ink:(pal?pal.t:COLOR.ink); ctx.font='700 18px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(LABEL[id],x,y+1);
      ctx.fillStyle=COLOR.dim; ctx.font='600 10px "JetBrains Mono", monospace'; ctx.fillText('id '+id, x, y-33); }

    // ── BAND 2 · id map + parent + acct
    let by=304;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · email→id · parent[](負值=根)· 目前帳號', PAD, by);
    const cell=44, gx=PAD+62, cy=by+18, cellY=cy+22, cellMid=cellY+15;
    // header row (email label + column headers)
    ctx.fillStyle=COLOR.dim; ctx.font='700 11px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText('email', PAD, cy);
    for(let j=0;j<4;j++){ ctx.fillStyle=COLOR.dim; ctx.font='700 11px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.fillText(LABEL[j]+'='+j, gx+j*cell+cell/2-2, cy); }
    // cell row (pushed down for clear gap below headers)
    ctx.fillStyle=COLOR.text; ctx.font='700 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText('parent', PAD, cellMid);
    for(let j=0;j<4;j++){ const x=gx+j*cell; const val=s.parent[j]; const isRoot=val<0;
      rr(x+4,cellY,cell-8,30,5); ctx.fillStyle=isRoot?'#fbe7df':'#eef4fa'; ctx.fill(); ctx.lineWidth=1.4; ctx.strokeStyle=isRoot?COLOR.coral:'#a9c4da'; ctx.stroke();
      ctx.fillStyle=COLOR.ink; ctx.font='700 14px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(String(val), x+cell/2, cellMid); }
    // current account
    if(s.acct){ ctx.fillStyle=COLOR.text; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText('acct: '+s.acct, gx+4*cell+18, cellMid); }

    // ── BAND 3 · note
    const ty=cellY+62, done=!!s.done;
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 為什麼「共用 email」= 自動合併', PAD, ty);
    const box=ty+12; rr(PAD,box,w-PAD*2,40,6); ctx.fillStyle=done?CC[0].f:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?CC[0].s:COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(done){ ctx.fillStyle=CC[0].t; ctx.font='700 12.5px "JetBrains Mono", monospace'; ctx.fillText('[John, a, b, c]  ·  [Mary, d]', w/2, box+20); }
    else if(s.note==='merge'){ ctx.fillStyle=COLOR.text; ctx.font='600 12px "Noto Sans TC", sans-serif'; ctx.fillText('同一個 email 字串永遠對到同一個 id → union 到它,就把兩個帳號接在一起', w/2, box+20); }
    else { ctx.fillStyle=COLOR.text; ctx.font='600 12px "Noto Sans TC", sans-serif'; ctx.fillText('星形 union:acct[1] 連其餘 email,O(k) 不必兩兩相連 O(k²)', w/2, box+20); }
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
