/* ============================================================
   P1489 Critical & Pseudo-Critical Edges in MST — Kruskal 分類
   核心：先用 Kruskal 求 MST 權重 mst。對每條邊 e：
     · 拿掉 e 後 MST 權重 > mst(或無法連通) → e 是「關鍵邊 critical」
     · 否則,強制先放 e 再建 MST,權重仍 == mst → e 是「偽關鍵 pseudo」
   Walks a 4-node graph:
     e0(0-1,w1) e1(1-2,w2) e2(1-3,w2) e3(2-3,w2)
     base MST = 5 · critical = {e0} · pseudo = {e1,e2,e3}
   Three tidy horizontal bands:
     BAND 1  the graph (edges recoloured per step)
     BAND 2  edges sorted by weight + running total
     BAND 3  verdict panel
   Style: white paper background, solid-color fills.
   ============================================================ */

(function () {
  const canvas = document.getElementById('viz-canvas');
  if (!canvas) return;

  const ctx      = canvas.getContext('2d');
  const stepEl   = document.getElementById('viz-step');
  const labelEl  = document.getElementById('viz-label');
  const btnPrev  = document.getElementById('viz-prev');
  const btnNext  = document.getElementById('viz-next');
  const btnPlay  = document.getElementById('viz-play');
  const btnReset = document.getElementById('viz-reset');

  const COLOR = {
    paper:'#ffffff', ink:'#1a1a1a', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf',
    cand:'#cfcfcf',                       // candidate edge
    mst:'#5fa866',  mstBg:'#d9e8c7',      // chosen (green)
    skip:'#c0392b',                       // removed for test (red)
    force:'#d96e4e', forceBg:'#f6ddd3',   // forced (coral)
    cyc:'#c9c2b4',                        // rejected as cycle
    nodeBg:'#eef3f8', nodeS:'#6f9fc4',
    isoS:'#c0392b',
  };

  // graph
  const NODES = { 0:{x:70,y:150}, 1:{x:210,y:150}, 2:{x:350,y:95}, 3:{x:350,y:205} };
  const EDGES = [
    { id:0, u:0, v:1, w:1 },
    { id:1, u:1, v:2, w:2 },
    { id:2, u:1, v:3, w:2 },
    { id:3, u:2, v:3, w:2 },
  ];
  const ORDER = [0,1,2,3];   // already sorted by weight (1,2,2,2)

  // per-step edge state map: id -> 'cand'|'mst'|'skip'|'force'|'cyc'
  const steps = [];
  const S = (o) => steps.push(o);

  S({ es:{0:'cand',1:'cand',2:'cand',3:'cand'}, iso:null, total:0, add:0, phase:'init',
      verdict:['Kruskal:邊照權重由小到大掃,','能連上(不成環)就加入,直到選滿 n−1 條。'],
      hi:null,
      text:'<strong>INITIAL</strong> · 4 個節點、4 條邊。先做一次 <strong>Kruskal</strong> 求出基準 MST 權重,'
          +'再逐邊判斷是「關鍵」還是「偽關鍵」。' });

  S({ es:{0:'mst',1:'cand',2:'cand',3:'cand'}, iso:null, total:1, add:1, phase:'base',
      verdict:['加入 e0 (w=1) → 連通 0-1','total = 1,已選 1 條'], hi:0,
      text:'Kruskal:最輕的 <code>e0 (w1)</code> 不成環 → <strong>加入</strong>。total=1。' });

  S({ es:{0:'mst',1:'mst',2:'cand',3:'cand'}, iso:null, total:3, add:2, phase:'base',
      verdict:['加入 e1 (w=2) → 連上 2','total = 3,已選 2 條'], hi:1,
      text:'下一輕的 <code>e1 (w2)</code> 連上新節點 2 → <strong>加入</strong>。total=3。' });

  S({ es:{0:'mst',1:'mst',2:'mst',3:'cyc'}, iso:null, total:5, add:3, phase:'base',
      verdict:['加入 e2 (w=2) → 連上 3','e3 會成環 → 跳過','base MST 權重 = 5'], hi:2,
      text:'<code>e2 (w2)</code> 連上 3 → 選滿 3 = n−1 條,<strong>基準 MST = 5</strong>。'
          +'<code>e3</code> 會成環,不需要。' });

  S({ es:{0:'skip',1:'mst',2:'mst',3:'cyc'}, iso:0, total:null, add:2, phase:'critical',
      verdict:['測 e0:把 e0 拿掉重建','節點 0 再也連不上 → 不連通','權重 = ∞ > 5 → e0 是關鍵邊'], hi:0,
      text:'<strong>關鍵邊測試</strong> · 拿掉 <code>e0</code> 重建:節點 0 孤立、無法連通 → '
          +'權重 ∞ &gt; 5 → <strong>e0 = CRITICAL</strong>。' });

  S({ es:{0:'mst',1:'mst',2:'mst',3:'skip'}, iso:null, total:5, add:3, phase:'skipok',
      verdict:['測 e3:先拿掉 e3 重建','用 e0+e1+e2 → 權重 = 5 = mst','拿掉它不變貴 → 不是關鍵邊'], hi:3,
      text:'測 <code>e3</code>:拿掉它仍能用 e0+e1+e2 建出 <strong>權重 5</strong> = mst → '
          +'<strong>不是關鍵邊</strong>,再看它是不是偽關鍵。' });

  S({ es:{0:'mst',1:'mst',2:'cyc',3:'force'}, iso:null, total:5, add:3, phase:'pseudo',
      verdict:['強制先放 e3,再跑 Kruskal','e3+e0+e1 → 權重 = 5 = mst','放得進某棵 MST → e3 偽關鍵'], hi:3,
      text:'<strong>偽關鍵測試</strong> · <strong>強制先放 e3</strong> 再建:e3+e0+e1 = '
          +'<strong>權重 5</strong> = mst → e3 能出現在某棵 MST → <strong>PSEUDO</strong>。' });

  S({ es:{0:'skip',1:'force',2:'force',3:'force'}, iso:null, total:null, add:null, phase:'done',
      verdict:['critical = { e0 }','pseudo  = { e1, e2, e3 }','三條等重邊任選兩條 → 都偽關鍵'], hi:null,
      text:'<strong>結論</strong>:<code>critical = {e0}</code>(紅)、<code>pseudo = {e1,e2,e3}</code>(珊瑚)。'
          +'e1/e2/e3 三條等重,任兩條都能組 MST,所以都是偽關鍵。' });

  let step = 0, timer = null;

  function fitCanvas() {
    const dpr = Math.min(Math.max(window.devicePixelRatio || 1, 2), 3);
    const rect = canvas.getBoundingClientRect();
    const w = rect.width || canvas.clientWidth;
    const h = rect.height || canvas.clientHeight || 540;
    const bw = Math.round(w*dpr), bh = Math.round(h*dpr);
    if (canvas.width !== bw || canvas.height !== bh) { canvas.width = bw; canvas.height = bh; }
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  const edgeStroke = { cand:COLOR.cand, mst:COLOR.mst, skip:COLOR.skip, force:COLOR.force, cyc:COLOR.cyc };

  function draw() {
    fitCanvas();
    const s = steps[step];
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const PAD = 26;
    ctx.fillStyle = COLOR.paper; ctx.fillRect(0,0,w,h);

    // ───────── BAND 1 · graph ─────────
    ctx.fillStyle = COLOR.dim; ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('BAND 1 · 圖(綠=MST 選用,紅=拿掉,珊瑚=強制/偽關鍵)', PAD, 26);

    // edges
    for (const e of EDGES) {
      const a = NODES[e.u], b = NODES[e.v];
      const st = s.es[e.id];
      ctx.strokeStyle = edgeStroke[st];
      ctx.lineWidth = (st==='mst'||st==='force') ? 5 : (st==='skip'?3:2);
      ctx.setLineDash(st==='skip'||st==='cyc' ? [7,6] : []);
      ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
      ctx.setLineDash([]);
      // weight chip at midpoint
      const mx=(a.x+b.x)/2, my=(a.y+b.y)/2;
      rr(mx-15, my-12, 44, 24, 4);
      ctx.fillStyle = '#ffffff'; ctx.fill();
      ctx.strokeStyle = edgeStroke[st]; ctx.lineWidth = 1.4; ctx.stroke();
      ctx.fillStyle = COLOR.ink; ctx.font = '700 11px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('e'+e.id+':'+e.w, mx+7, my);
    }
    // nodes
    for (const k of Object.keys(NODES)) {
      const nd = NODES[k], iso = s.iso===+k;
      ctx.beginPath(); ctx.arc(nd.x, nd.y, 22, 0, Math.PI*2);
      ctx.fillStyle = COLOR.nodeBg; ctx.fill();
      ctx.lineWidth = iso?3:2; ctx.strokeStyle = iso?COLOR.isoS:COLOR.nodeS; ctx.stroke();
      ctx.fillStyle = COLOR.ink; ctx.font='700 17px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(k, nd.x, nd.y);
      if (iso) {
        ctx.fillStyle = COLOR.isoS; ctx.font='700 10px "JetBrains Mono", monospace';
        ctx.textBaseline='top'; ctx.fillText('孤立', nd.x, nd.y+24);
      }
    }

    // ───────── BAND 2 · sorted edge list ─────────
    ctx.fillStyle = COLOR.dim; ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 邊照權重排序後掃描', PAD, 268);
    const cw=96, ch=42, gap=16, startX=PAD;
    const by=286;
    for (let i=0;i<ORDER.length;i++){
      const e = EDGES[ORDER[i]];
      const st = s.es[e.id];
      const x = startX + i*(cw+gap);
      rr(x, by, cw, ch, 4);
      const bg = st==='mst'?COLOR.mstBg : st==='force'?COLOR.forceBg : (st==='skip'?'#f4d9d5':'#f7f7f7');
      ctx.fillStyle = bg; ctx.fill();
      ctx.lineWidth = (i===s.hi)?2.5:1.4; ctx.strokeStyle = (i===s.hi)?COLOR.ink:edgeStroke[st]; ctx.stroke();
      ctx.fillStyle = COLOR.ink; ctx.font='700 13px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='top';
      ctx.fillText('e'+e.id+' · w'+e.w, x+cw/2, by+6);
      ctx.fillStyle = st==='skip'?COLOR.skip : st==='force'?COLOR.force : st==='mst'?COLOR.mst : COLOR.dim;
      ctx.font='600 10px "JetBrains Mono", monospace'; ctx.textBaseline='bottom';
      const tag = st==='mst'?'IN MST' : st==='force'?'FORCED' : st==='skip'?'REMOVED' : st==='cyc'?'cycle':'—';
      ctx.fillText(tag, x+cw/2, by+ch-5);
    }
    // running total box
    const tx = startX + ORDER.length*(cw+gap) + 6;
    if (tx < w-110){
      rr(tx, by, w-PAD-tx, ch, 4); ctx.fillStyle=COLOR.ink; ctx.fill();
      ctx.fillStyle='#ffd9c9'; ctx.font='600 10px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='top';
      ctx.fillText('WEIGHT', tx+(w-PAD-tx)/2, by+6);
      ctx.fillStyle='#fff'; ctx.font='700 18px "JetBrains Mono", monospace'; ctx.textBaseline='bottom';
      const tv = s.total==null ? '∞' : String(s.total);
      ctx.fillText(tv, tx+(w-PAD-tx)/2, by+ch-5);
    }

    // ───────── BAND 3 · verdict ─────────
    ctx.fillStyle = (s.phase==='critical'||s.phase==='pseudo'||s.phase==='done') ? COLOR.force : COLOR.dim;
    ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 判斷', PAD, 372);
    const vy=392;
    // verdict card
    const cardHot = s.phase==='critical'||s.phase==='pseudo'||s.phase==='done';
    rr(PAD, vy, w-PAD*2, 96, 6);
    ctx.fillStyle = cardHot ? '#fbeee8' : '#fafaf6'; ctx.fill();
    ctx.lineWidth=1.5; ctx.strokeStyle = cardHot?COLOR.force:COLOR.grid; ctx.stroke();
    ctx.textAlign='left'; ctx.textBaseline='middle';
    for (let i=0;i<s.verdict.length;i++){
      ctx.fillStyle = (i===s.verdict.length-1 && cardHot) ? COLOR.force : COLOR.text;
      ctx.font = (i===s.verdict.length-1 && cardHot) ? '700 14px "Noto Sans TC", sans-serif' : '500 13.5px "Noto Sans TC", sans-serif';
      ctx.fillText(s.verdict[i], PAD+18, vy+22 + i*24);
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
  function play(){ if(timer){ stop(); return; } btnPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){ stop(); return; } next(); },1500); }
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
