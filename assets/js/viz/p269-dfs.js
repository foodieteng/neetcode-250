/* ============================================================
   P269 寫法 A · DFS 三色後序(拓樸排序)
   邊已由相鄰字建好:w→e→r→t→f(見「兩種寫法」對照)。
   三色:白=未訪、灰=遞迴中(在堆疊上)、黑=完成。一個節點的所有
   後代都完成才把自己 push(後序 = 逆拓樸序),最後 reverse。
   撞到灰 = 有環(此鏈無環)。
     BAND 1  鏈狀圖(白/灰/黑著色)
     BAND 2  遞迴堆疊(灰色節點)
     BAND 3  res[] 後序 push + reverse
   ============================================================ */

(function () {
  const canvas = document.getElementById('va-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('va-step');
  const labelEl = document.getElementById('va-label');
  const btnPrev = document.getElementById('va-prev');
  const btnNext = document.getElementById('va-next');
  const btnPlay = document.getElementById('va-play');
  const btnReset = document.getElementById('va-reset');

  const COLOR = {
    paper:'#ffffff', ink:'#1a1a1a', dim:'#9a9a9a', grid:'#cfcfcf', edge:'#8fb3d4', coral:'#cf3535',
    white:'#eef0f2', whiteS:'#cfcfcf',
    gray:'#f6ddd3', grayS:'#cf3535',
    black:'#d9e8c7', blackS:'#5fa866',
    stackBg:'#f6ddd3', stackS:'#cf3535',
  };
  const ORDER = ['w','e','r','t','f'];          // node positions (topo order)
  const EDGES = [['w','e'],['e','r'],['r','t'],['t','f']];

  // color: 0 white, 1 gray, 2 black ; cur node ; stack ; res ; pushed ; rev
  const steps = [
    { color:{w:0,e:0,r:0,t:0,f:0}, cur:null, stack:[], res:[], pushed:null, rev:false,
      text:'<strong>INITIAL</strong> · 已從相鄰字建好邊 <code>w→e→r→t→f</code>。三色:白未訪、灰遞迴中、黑完成。從 <code>w</code> 開始 DFS。' },
    { color:{w:1,e:0,r:0,t:0,f:0}, cur:'w', stack:['w'], res:[], pushed:null, rev:false,
      text:'<code>dfs(w)</code>:標<strong>灰</strong>,沿邊往鄰居 <code>e</code>。' },
    { color:{w:1,e:1,r:0,t:0,f:0}, cur:'e', stack:['w','e'], res:[], pushed:null, rev:false,
      text:'<code>dfs(e)</code>:標灰,往 <code>r</code>。' },
    { color:{w:1,e:1,r:1,t:0,f:0}, cur:'r', stack:['w','e','r'], res:[], pushed:null, rev:false,
      text:'<code>dfs(r)</code>:標灰,往 <code>t</code>。' },
    { color:{w:1,e:1,r:1,t:1,f:0}, cur:'t', stack:['w','e','r','t'], res:[], pushed:null, rev:false,
      text:'<code>dfs(t)</code>:標灰,往 <code>f</code>。' },
    { color:{w:1,e:1,r:1,t:1,f:2}, cur:'f', stack:['w','e','r','t'], res:['f'], pushed:'f', rev:false,
      text:'<code>dfs(f)</code>:<strong>無出邊</strong> → 標<strong>黑</strong>、後序 <code>push f</code>。res=[f]。' },
    { color:{w:1,e:1,r:1,t:2,f:2}, cur:'t', stack:['w','e','r'], res:['f','t'], pushed:'t', rev:false,
      text:'回退 <code>t</code>:後代都完成 → 標黑、push。res=[f,t]。' },
    { color:{w:1,e:1,r:2,t:2,f:2}, cur:'r', stack:['w','e'], res:['f','t','r'], pushed:'r', rev:false,
      text:'回退 <code>r</code> → 標黑、push。res=[f,t,r]。' },
    { color:{w:1,e:2,r:2,t:2,f:2}, cur:'e', stack:['w'], res:['f','t','r','e'], pushed:'e', rev:false,
      text:'回退 <code>e</code> → 標黑、push。res=[f,t,r,e]。' },
    { color:{w:2,e:2,r:2,t:2,f:2}, cur:'w', stack:[], res:['f','t','r','e','w'], pushed:'w', rev:false,
      text:'回退 <code>w</code> → 標黑、push。res=[f,t,r,e,w](這是<strong>逆</strong>拓樸序)。' },
    { color:{w:2,e:2,r:2,t:2,f:2}, cur:null, stack:[], res:['f','t','r','e','w'], pushed:null, rev:true,
      answer:['w','e','r','t','f'],
      text:'<strong>reverse(res)</strong> → <code>"wertf"</code>。全程沒撞到灰 → 無環。後序反轉 = 正拓樸序。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rect=canvas.getBoundingClientRect();
    const w=rect.width||canvas.clientWidth, h=rect.height||canvas.clientHeight||500;
    const bw=Math.round(w*dpr), bh=Math.round(h*dpr); if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function arrow(x1,y1,x2,y2,r1,r2){ const dx=x2-x1,dy=y2-y1,L=Math.hypot(dx,dy),ux=dx/L,uy=dy/L;
    const sx=x1+ux*r1,sy=y1+uy*r1,ex=x2-ux*r2,ey=y2-uy*r2; ctx.strokeStyle=COLOR.edge; ctx.lineWidth=2.5;
    ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(ex,ey); ctx.stroke(); const ah=8,aa=Math.atan2(dy,dx);
    ctx.fillStyle=COLOR.edge; ctx.beginPath(); ctx.moveTo(ex,ey); ctx.lineTo(ex-ah*Math.cos(aa-0.4),ey-ah*Math.sin(aa-0.4));
    ctx.lineTo(ex-ah*Math.cos(aa+0.4),ey-ah*Math.sin(aa+0.4)); ctx.closePath(); ctx.fill(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth, h=canvas.clientHeight; const PAD=26;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,h);

    // BAND 1 · chain graph
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 字母有向圖(白=未訪,灰=遞迴中,綠=完成)', PAD, 26);
    const nodeR=24, ny=90, span=w-PAD*2-80, gap=span/(ORDER.length-1);
    const nx={}; ORDER.forEach((c,i)=>nx[c]=PAD+40+i*gap);
    for(const [a,b] of EDGES) arrow(nx[a],ny,nx[b],ny,nodeR,nodeR);
    const fillOf={0:COLOR.white,1:COLOR.gray,2:COLOR.black}, strokeOf={0:COLOR.whiteS,1:COLOR.grayS,2:COLOR.blackS};
    ORDER.forEach((c)=>{ const col=s.color[c], isCur=s.cur===c&&!s.rev;
      ctx.beginPath(); ctx.arc(nx[c],ny,nodeR,0,Math.PI*2); ctx.fillStyle=fillOf[col]; ctx.fill();
      ctx.lineWidth=isCur?3.5:2.4; ctx.strokeStyle=isCur?COLOR.coral:strokeOf[col]; ctx.stroke();
      ctx.fillStyle=COLOR.ink; ctx.font='700 20px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(c,nx[c],ny);
      const lbl = col===1?'灰':col===2?'黑':''; if(lbl){ ctx.fillStyle=col===1?COLOR.coral:COLOR.blackS; ctx.font='700 10px "Noto Sans TC", sans-serif'; ctx.textBaseline='top'; ctx.fillText(lbl,nx[c],ny+nodeR+5); }
    });

    // BAND 2 · recursion stack
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 遞迴堆疊(灰色節點)', PAD, 170);
    const sx=PAD, sy=188, cw=58, ch=34, sg=10;
    if(s.stack.length===0){ ctx.fillStyle=COLOR.dim; ctx.font='500 13px "Noto Sans TC", sans-serif'; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText(s.rev?'堆疊清空 → reverse':'堆疊清空',sx+4,sy+ch/2); }
    for(let i=0;i<s.stack.length;i++){ const x=sx+i*(cw+sg+14); rr(x,sy,cw,ch,4); const top=i===s.stack.length-1;
      ctx.fillStyle=top?COLOR.stackBg:'#f3eee6'; ctx.fill(); ctx.lineWidth=top?2.4:1.4; ctx.strokeStyle=top?COLOR.stackS:COLOR.grayS; ctx.stroke();
      ctx.fillStyle=COLOR.ink; ctx.font='700 15px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(s.stack[i],x+cw/2,sy+ch/2);
      if(i<s.stack.length-1){ ctx.fillStyle=COLOR.dim; ctx.font='700 13px "JetBrains Mono", monospace'; ctx.fillText('→',x+cw+sg+7,sy+ch/2); } }

    // BAND 3 · res + answer
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · res[](後序 push,逆拓樸序)', PAD, 254);
    const rx=PAD, ry=272, rw=54, rh=44, rg=12;
    for(let i=0;i<ORDER.length;i++){ const x=rx+i*(rw+rg); rr(x,ry,rw,rh,5); const filled=i<s.res.length; const justP=s.pushed&&i===s.res.length-1;
      ctx.fillStyle=filled?COLOR.black:'#f7f7f7'; ctx.fill(); ctx.lineWidth=justP?2.4:1.4; ctx.strokeStyle=justP?COLOR.blackS:COLOR.grid; ctx.stroke();
      if(filled){ ctx.fillStyle=COLOR.ink; ctx.font='700 20px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(s.res[i],x+rw/2,ry+rh/2); } }
    const px=rx+ORDER.length*(rw+rg)+18;
    if(px<w-150){ ctx.fillStyle=COLOR.dim; ctx.font='600 11px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='top'; ctx.fillText('res =',px,ry+6);
      ctx.fillStyle=COLOR.ink; ctx.font='700 18px "JetBrains Mono", monospace'; ctx.textBaseline='bottom'; ctx.fillText('"'+s.res.join('')+'"',px,ry+rh); }
    if(s.rev){ const by=ry+rh+22; rr(PAD,by,w-PAD*2,34,4); ctx.fillStyle=COLOR.black; ctx.fill(); ctx.strokeStyle=COLOR.blackS; ctx.lineWidth=1.8; ctx.stroke();
      ctx.fillStyle='#2f6a3a'; ctx.font='700 14px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('reverse → [ '+s.answer.join('  ,  ')+' ] = "wertf"',w/2,by+17); }
  }
  function update(){ const s=steps[step]; if(stepEl) stepEl.textContent=String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0'); if(labelEl) labelEl.innerHTML=s.text; draw(); }
  function next(){ if(step<steps.length-1){step++;update();}else stop(); }
  function prev(){ if(step>0){step--;update();} }
  function reset(){ stop(); step=0; update(); }
  function play(){ if(timer){stop();return;} btnPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){stop();return;} next(); },1350); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} if(btnPlay) btnPlay.textContent='Play'; }
  btnPrev&&btnPrev.addEventListener('click',prev); btnNext&&btnNext.addEventListener('click',next);
  btnPlay&&btnPlay.addEventListener('click',play); btnReset&&btnReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();});
  if(window.ResizeObserver){ const ro=new ResizeObserver(()=>{fit();draw();}); ro.observe(canvas); }
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw);
  fit(); update();
})();
