/* ============================================================
   P778 寫法 C · 二分答案 + BFS
   可達性對門檻 t 單調(t 越大能走的格越多)→ 對答案二分。
   每個 mid 用 BFS 檢查「只走高度 ≤ mid 的格」能否到終點。
   Walks grid = [[0,2,1],[5,8,3],[6,7,4]]  (演示用完整範圍 0..8 二分)
     checks: mid=4 可達 → mid=2 不可達 → mid=3 不可達 → 收斂到 4
     BAND 1  grid:可走(≤mid)vs 阻擋(>mid)+ BFS 是否到 END
     BAND 2  搜尋區間 [lo, hi] + mid + 檢查結果
     BAND 3  收斂 → 答案
   註:程式碼下界用 max(起,終)=4 更快,這裡從 0 起以展示 false/true。
   ============================================================ */

(function () {
  const canvas = document.getElementById('vc-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('vc-step');
  const labelEl = document.getElementById('vc-label');
  const btnPrev = document.getElementById('vc-prev');
  const btnNext = document.getElementById('vc-next');
  const btnPlay = document.getElementById('vc-play');
  const btnReset = document.getElementById('vc-reset');

  const COLOR = {
    paper:'#ffffff', ink:'#1a1a1a', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf',
    blocked:'#eceae4', blockedS:'#cfcac0', blockedTxt:'#b7b1a4',
    pass:'#e3edf5', passS:'#6f9fc4',
    ok:'#d9e8c7', okS:'#5fa866',
    bad:'#f4d9d5', badS:'#c0392b',
    coral:'#cf3535',
  };
  const GRID = [[0,2,1],[5,8,3],[6,7,4]];
  const N = 3;

  // per step: lo, hi, mid|null, pass[] (height<=mid), reach bool|null, ans|null
  const steps = [
    { lo:0, hi:8, mid:null, pass:[], reach:null, ans:null,
      text:'<strong>INITIAL</strong> · 二分答案(門檻時間)。區間 <code>[0, 8]</code>。'
          +'對每個 <code>mid</code> 用 BFS 檢查「只走高度 ≤ mid 的格」能否到 END。' },
    { lo:0, hi:8, mid:4, pass:['0,0','0,1','0,2','1,2','2,2'], reach:true, ans:null,
      text:'<code>mid = 4</code>:可走高度 ≤4 的格,BFS <code>0→2→1→3→4</code> <strong>能到 END ✓</strong> → '
          +'縮小上界 <code>hi = 4</code>。' },
    { lo:0, hi:4, mid:2, pass:['0,0','0,1','0,2'], reach:false, ans:null,
      text:'<code>mid = 2</code>:只剩高度 ≤2 的格,BFS 困在上排、<strong>到不了 END ✗</strong> → '
          +'抬高下界 <code>lo = 3</code>。' },
    { lo:3, hi:4, mid:3, pass:['0,0','0,1','0,2','1,2'], reach:false, ans:null,
      text:'<code>mid = 3</code>:高度 ≤3,走到 <code>(1,2)</code> 就被 <code>(2,2)=4</code> 擋住 <strong>✗</strong> → '
          +'<code>lo = 4</code>。' },
    { lo:4, hi:4, mid:null, pass:['0,0','0,1','0,2','1,2','2,2'], reach:true, ans:4,
      text:'<code>lo == hi == 4</code> → 收斂。<strong>return 4</strong>。可達性從 false 翻成 true 的臨界點就是答案。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rect=canvas.getBoundingClientRect();
    const w=rect.width||canvas.clientWidth, h=rect.height||canvas.clientHeight||500;
    const bw=Math.round(w*dpr), bh=Math.round(h*dpr); if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth, h=canvas.clientHeight; const PAD=26;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,h);

    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · BFS(藍=可走 ≤mid,灰=被擋 >mid)', PAD, 26);

    const cell=74, gx=PAD+22, gy=46;
    const endReached = s.reach===true;
    for(let r=0;r<N;r++) for(let c=0;c<N;c++){
      const key=r+','+c, x=gx+c*cell, y=gy+r*cell;
      const passable = s.pass.includes(key);
      const isEnd = key==='2,2';
      let fill=COLOR.blocked, st=COLOR.blockedS, txt=COLOR.blockedTxt;
      if(passable){
        if(isEnd && endReached){ fill=COLOR.ok; st=COLOR.okS; txt=COLOR.ink; }
        else { fill=COLOR.pass; st=COLOR.passS; txt=COLOR.ink; }
      }
      rr(x+2,y+2,cell-4,cell-4,6); ctx.fillStyle=fill; ctx.fill();
      ctx.lineWidth=1.6; ctx.strokeStyle=st; ctx.stroke();
      ctx.fillStyle=txt; ctx.font='700 26px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(GRID[r][c]), x+cell/2, y+cell/2);
      if(key==='0,0'||isEnd){ ctx.fillStyle=COLOR.coral; ctx.font='700 9px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='top'; ctx.fillText(key==='0,0'?'START':'END', x+cell/2, y+7); }
    }
    // check verdict badge right of grid
    const px=gx+N*cell+36;
    if(px<w-120 && s.mid!=null){
      rr(px,gy+20,168,60,6); ctx.fillStyle=s.reach?COLOR.ok:COLOR.bad; ctx.fill();
      ctx.lineWidth=1.6; ctx.strokeStyle=s.reach?COLOR.okS:COLOR.badS; ctx.stroke();
      ctx.fillStyle=COLOR.ink; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='top';
      ctx.fillText('bfs(mid='+s.mid+')', px+84, gy+30);
      ctx.font='700 18px "JetBrains Mono", monospace'; ctx.textBaseline='bottom';
      ctx.fillStyle=s.reach?'#2f6a3a':'#8a2820';
      ctx.fillText(s.reach?'可達 ✓':'不可達 ✗', px+84, gy+74);
    }

    // BAND 2 · interval bar
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 搜尋區間 [lo, hi]', PAD, gy+N*cell+34);
    const axY=gy+N*cell+62, axX=PAD+30, axW=w-PAD*2-60, vmax=8;
    ctx.strokeStyle=COLOR.grid; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(axX,axY); ctx.lineTo(axX+axW,axY); ctx.stroke();
    const xOf=(v)=>axX+axW*(v/vmax);
    // active [lo,hi] band
    ctx.strokeStyle=COLOR.passS; ctx.lineWidth=6; ctx.beginPath(); ctx.moveTo(xOf(s.lo),axY); ctx.lineTo(xOf(s.hi),axY); ctx.stroke();
    for(let v=0;v<=vmax;v++){ const x=xOf(v);
      ctx.fillStyle=COLOR.dim; ctx.font='600 10px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='top'; ctx.fillText(String(v), x, axY+8);
      ctx.strokeStyle=COLOR.grid; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(x,axY-4); ctx.lineTo(x,axY+4); ctx.stroke(); }
    // lo / hi markers
    const tag=(v,label,col)=>{ const x=xOf(v); ctx.fillStyle=col; ctx.beginPath(); ctx.arc(x,axY,6,0,Math.PI*2); ctx.fill();
      ctx.font='700 10px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='bottom'; ctx.fillText(label, x, axY-9); };
    tag(s.lo,'lo',COLOR.passS); tag(s.hi,'hi',COLOR.passS);
    if(s.mid!=null){ const x=xOf(s.mid); ctx.strokeStyle=COLOR.coral; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(x,axY-16); ctx.lineTo(x,axY+16); ctx.stroke();
      ctx.fillStyle=COLOR.coral; ctx.font='700 10px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='top'; ctx.fillText('mid', x, axY-30); }

    // BAND 3 · answer
    const by=axY+40; rr(PAD,by,w-PAD*2,36,6);
    ctx.fillStyle=s.ans!=null?COLOR.ok:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=s.ans!=null?COLOR.okS:COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(s.ans!=null){ ctx.fillStyle='#2f6a3a'; ctx.font='700 15px "JetBrains Mono", monospace'; ctx.fillText('lo == hi == 4 → return 4', w/2, by+18); }
    else { ctx.fillStyle=COLOR.dim; ctx.font='600 13px "Noto Sans TC", sans-serif'; ctx.fillText(s.mid==null?'準備二分…':'依檢查結果收斂區間…', w/2, by+18); }
  }
  function update(){ const s=steps[step]; if(stepEl) stepEl.textContent=String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0'); if(labelEl) labelEl.innerHTML=s.text; draw(); }
  function next(){ if(step<steps.length-1){step++;update();}else stop(); }
  function prev(){ if(step>0){step--;update();} }
  function reset(){ stop(); step=0; update(); }
  function play(){ if(timer){stop();return;} btnPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){stop();return;} next(); },1600); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} if(btnPlay) btnPlay.textContent='Play'; }
  btnPrev&&btnPrev.addEventListener('click',prev); btnNext&&btnNext.addEventListener('click',next);
  btnPlay&&btnPlay.addEventListener('click',play); btnReset&&btnReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();});
  if(window.ResizeObserver){ const ro=new ResizeObserver(()=>{fit();draw();}); ro.observe(canvas); }
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw);
  fit(); update();
})();
