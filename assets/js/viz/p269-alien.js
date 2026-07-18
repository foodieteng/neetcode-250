/* ============================================================
   P269 Alien Dictionary — build order graph → topological sort
   核心:相鄰兩字第一個不同的字元,給出一條「誰在前」的有向邊;
   把所有邊收集起來做拓樸排序,就是外星字母表的順序。
   Walks the classic:
     words = [wrt, wrf, er, ett, rftt]
     edges: t→f, w→e, r→t, e→r   →   order "wertf"
   Three tidy horizontal bands:
     BAND 1  current word pair compared (first differing column)
     BAND 2  the letter graph (edges added, nodes peeled in topo)
     BAND 3  the output order building
   Style: white paper background, solid-color fills.
   ============================================================ */

(function () {
  const canvas = document.getElementById('vb-canvas');
  if (!canvas) return;

  const ctx      = canvas.getContext('2d');
  const stepEl   = document.getElementById('vb-step');
  const labelEl  = document.getElementById('vb-label');
  const btnPrev  = document.getElementById('vb-prev');
  const btnNext  = document.getElementById('vb-next');
  const btnPlay  = document.getElementById('vb-play');
  const btnReset = document.getElementById('vb-reset');

  const COLOR = {
    paper:'#ffffff', ink:'#1a1a1a', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf',
    cellBg:'#fafaf6', cellS:'#c9c2b4',
    same:'#eef3f8', sameS:'#9fb8cf',
    diff:'#f6ddd3', diffS:'#cf3535',
    edge:'#8fb3d4',
    node:'#eef0f2', nodeS:'#9fb8cf',
    out:'#d9e8c7', outS:'#5fa866',
    coral:'#cf3535',
  };

  const WORDS = ['wrt','wrf','er','ett','rftt'];
  // nodes placed in topo order for clean forward arrows
  const NODEORDER = ['w','e','r','t','f'];
  const EDGES = [ ['t','f'], ['w','e'], ['r','t'], ['e','r'] ];  // discovery order

  // build steps
  const steps = [];
  const S = (o) => steps.push(o);

  S({ phase:'init', cmp:null, edges:0, out:[],
      text:'<strong>INITIAL</strong> · 5 個單字已按外星字母表排序。'
          +'相鄰兩字<strong>第一個不同的字元</strong>就透露「誰在前」。' });

  const cmps = [
    { w1:'wrt', w2:'wrf', diff:2, e:['t','f'] },
    { w1:'wrf', w2:'er',  diff:0, e:['w','e'] },
    { w1:'er',  w2:'ett', diff:1, e:['r','t'] },
    { w1:'ett', w2:'rftt',diff:0, e:['e','r'] },
  ];
  cmps.forEach((c,i)=>{
    S({ phase:'cmp', cmp:c, edges:i+1, out:[],
        text:`比較 <code>${c.w1}</code> 與 <code>${c.w2}</code>:第一個不同在第 ${c.diff} 位 → `
            +`<strong>${c.e[0]} 在 ${c.e[1]} 前面</strong>,加邊 <code>${c.e[0]}→${c.e[1]}</code>。` });
  });

  S({ phase:'built', cmp:null, edges:4, out:[],
      text:'四條邊收集完成:<code>w→e→r→t→f</code> 形成一條鏈。接著對這張圖做<strong>拓樸排序</strong>。' });

  // peel nodes one by one (indegree-0 first): w, e, r, t, f
  for (let i=0;i<NODEORDER.length;i++){
    const outNow = NODEORDER.slice(0,i+1);
    S({ phase:'topo', cmp:null, edges:4, out:outNow,
        text:`拓樸:取出目前<strong>入度 0</strong> 的 <code>${NODEORDER[i]}</code> → 輸出 `
            +`<code>"${outNow.join('')}"</code>。` });
  }

  S({ phase:'done', cmp:null, edges:4, out:[...NODEORDER],
      text:'<strong>完成</strong> · 外星字母順序 = <code>"wertf"</code>。'
          +'若過程<strong>成環</strong>或出現「前綴矛盾」(長字排在其前綴之前),回傳 <code>""</code>。' });

  let step = 0, timer = null;

  function fitCanvas() {
    const dpr = Math.min(Math.max(window.devicePixelRatio || 1, 2), 3);
    const rect = canvas.getBoundingClientRect();
    const w = rect.width || canvas.clientWidth;
    const h = rect.height || canvas.clientHeight || 520;
    const bw = Math.round(w*dpr), bh = Math.round(h*dpr);
    if (canvas.width !== bw || canvas.height !== bh) { canvas.width = bw; canvas.height = bh; }
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function arrow(x1,y1,x2,y2,r1,r2){
    const dx=x2-x1, dy=y2-y1, L=Math.hypot(dx,dy), ux=dx/L, uy=dy/L;
    const sx=x1+ux*r1, sy=y1+uy*r1, ex=x2-ux*r2, ey=y2-uy*r2;
    ctx.strokeStyle=COLOR.edge; ctx.lineWidth=2.5;
    ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(ex,ey); ctx.stroke();
    const ah=8, aa=Math.atan2(dy,dx);
    ctx.fillStyle=COLOR.edge; ctx.beginPath(); ctx.moveTo(ex,ey);
    ctx.lineTo(ex-ah*Math.cos(aa-0.4), ey-ah*Math.sin(aa-0.4));
    ctx.lineTo(ex-ah*Math.cos(aa+0.4), ey-ah*Math.sin(aa+0.4));
    ctx.closePath(); ctx.fill();
  }

  function draw() {
    fitCanvas();
    const s = steps[step];
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const PAD = 26;
    ctx.fillStyle = COLOR.paper; ctx.fillRect(0,0,w,h);

    // ───────── BAND 1 · word-pair compare ─────────
    ctx.fillStyle = (s.phase==='cmp') ? COLOR.coral : COLOR.dim;
    ctx.font = '600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 相鄰兩字比較,第一個不同 = 一條邊', PAD, 26);

    if (s.cmp){
      const c = s.cmp;
      const cell=30, gap=6, startX=PAD+40, y1=46, y2=82;
      const drawWord=(word,y,other)=>{
        for(let k=0;k<word.length;k++){
          const x=startX+k*(cell+gap);
          rr(x,y,cell,cell,4);
          const isDiff = k===c.diff;
          const isSame = k<c.diff;
          ctx.fillStyle = isDiff?COLOR.diff : isSame?COLOR.same : COLOR.cellBg;
          ctx.fill();
          ctx.lineWidth = isDiff?2.5:1.4; ctx.strokeStyle = isDiff?COLOR.diffS : isSame?COLOR.sameS : COLOR.cellS; ctx.stroke();
          ctx.fillStyle=COLOR.ink; ctx.font='700 16px "JetBrains Mono", monospace';
          ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(word[k], x+cell/2, y+cell/2);
        }
      };
      ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace';
      ctx.textAlign='right'; ctx.textBaseline='middle';
      ctx.fillText('w1', startX-10, y1+cell/2); ctx.fillText('w2', startX-10, y2+cell/2);
      drawWord(c.w1,y1); drawWord(c.w2,y2);
      // caret + edge label under diff column
      const dx = startX + c.diff*(cell+gap) + cell/2;
      ctx.fillStyle=COLOR.coral; ctx.font='700 13px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='top';
      ctx.fillText('▲', dx, y2+cell+4);
      ctx.textAlign='left';
      ctx.fillText('第一個不同 → 加邊  '+c.e[0]+' → '+c.e[1], startX + Math.max(c.w1.length,c.w2.length)*(cell+gap) + 20, y1+cell-4);
    } else {
      ctx.fillStyle=COLOR.dim; ctx.font='500 14px "Noto Sans TC", sans-serif';
      ctx.textAlign='left'; ctx.textBaseline='middle';
      const msg = s.phase==='init' ? '點 Next / Play 開始逐對比較單字'
                : s.phase==='built' ? '四條邊都收集完 → 進入拓樸排序'
                : '所有相鄰對比較完畢';
      ctx.fillText(msg, PAD+40, 78);
    }

    // ───────── BAND 2 · letter graph ─────────
    ctx.fillStyle = (s.phase==='topo'||s.phase==='built'||s.phase==='done') ? COLOR.coral : COLOR.dim;
    ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 字母有向圖(綠 = 已輸出)', PAD, 160);

    const nodeR=24, ny=220;
    const span = w - PAD*2 - 80;
    const gapN = span/(NODEORDER.length-1);
    const nx = {}; NODEORDER.forEach((c,i)=>nx[c]=PAD+40+i*gapN);
    // edges shown so far
    for (let i=0;i<s.edges;i++){
      const [a,b]=EDGES[i];
      arrow(nx[a],ny,nx[b],ny,nodeR,nodeR);
    }
    // nodes
    NODEORDER.forEach((c)=>{
      const isOut = s.out.includes(c);
      ctx.beginPath(); ctx.arc(nx[c],ny,nodeR,0,Math.PI*2);
      ctx.fillStyle = isOut?COLOR.out:COLOR.node; ctx.fill();
      ctx.lineWidth=2.5; ctx.strokeStyle = isOut?COLOR.outS:COLOR.nodeS; ctx.stroke();
      ctx.fillStyle=COLOR.ink; ctx.font='700 20px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(c, nx[c], ny);
    });

    // ───────── BAND 3 · output order ─────────
    ctx.fillStyle = (s.phase==='topo'||s.phase==='done') ? COLOR.coral : COLOR.dim;
    ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 輸出順序(拓樸序)', PAD, 300);

    const cw=54, ch=48, cg=14, oy=320, ox=PAD+40;
    for (let i=0;i<NODEORDER.length;i++){
      const x=ox+i*(cw+cg);
      rr(x,oy,cw,ch,5);
      const filled = i < s.out.length;
      ctx.fillStyle = filled?COLOR.out:'#f7f7f7'; ctx.fill();
      ctx.lineWidth = filled?2:1.4; ctx.strokeStyle = filled?COLOR.outS:COLOR.grid; ctx.stroke();
      if (filled){
        ctx.fillStyle=COLOR.ink; ctx.font='700 24px "JetBrains Mono", monospace';
        ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(s.out[i], x+cw/2, oy+ch/2);
      } else {
        ctx.fillStyle=COLOR.grid; ctx.font='600 11px "JetBrains Mono", monospace';
        ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('·', x+cw/2, oy+ch/2);
      }
    }
    // result string
    const rx = ox + NODEORDER.length*(cw+cg) + 20;
    if (rx < w-140){
      ctx.fillStyle=COLOR.dim; ctx.font='600 11px "JetBrains Mono", monospace';
      ctx.textAlign='left'; ctx.textBaseline='top'; ctx.fillText('res =', rx, oy+6);
      ctx.fillStyle=COLOR.ink; ctx.font='700 22px "JetBrains Mono", monospace'; ctx.textBaseline='bottom';
      ctx.fillText('"'+s.out.join('')+'"', rx, oy+ch);
    }
    // done banner
    if (s.phase==='done'){
      const by=oy+ch+22;
      rr(PAD,by,w-PAD*2,32,4); ctx.fillStyle=COLOR.out; ctx.fill();
      ctx.strokeStyle=COLOR.outS; ctx.lineWidth=1.8; ctx.stroke();
      ctx.fillStyle='#2f6a3a'; ctx.font='700 14px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('拓樸排完 → "wertf";若成環或前綴矛盾 → 回傳 ""', w/2, by+16);
    }
  }

  function update() {
    const s = steps[step];
    if (stepEl) stepEl.textContent = String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0');
    if (labelEl) labelEl.innerHTML = s.text;
    draw();
  }
  function next(){ if(step<steps.length-1){ step++; update(); } else stop(); }
  function prev(){ if(step>0){ step--; update(); } }
  function reset(){ stop(); step=0; update(); }
  function play(){ if(timer){ stop(); return; } btnPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){ stop(); return; } next(); },1350); }
  function stop(){ if(timer){ clearInterval(timer); timer=null; } if(btnPlay) btnPlay.textContent='Play'; }

  btnPrev  && btnPrev .addEventListener('click', prev);
  btnNext  && btnNext .addEventListener('click', next);
  btnPlay  && btnPlay .addEventListener('click', play);
  btnReset && btnReset.addEventListener('click', reset);

  window.addEventListener('resize', ()=>{ fitCanvas(); draw(); });
  if (window.ResizeObserver){ const ro=new ResizeObserver(()=>{ fitCanvas(); draw(); }); ro.observe(canvas); }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
  fitCanvas(); update();
})();
