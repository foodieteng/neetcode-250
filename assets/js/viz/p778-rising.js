/* ============================================================
   P778 Swim in Rising Water — 上升水位 + Union-Find
   核心:水位由低往高一格一格淹。格子高度 ≤ 目前水位就「可通行」,
   淹沒後與相鄰已淹格 union。當 (0,0) 與 (n-1,n-1) 落到同一連通分量,
   當下的水位就是答案(= 路徑上最大高度的最小值)。
   Walks grid = [[0,2,1],[5,8,3],[6,7,4]]  →  answer 4
   Three tidy horizontal bands:
     BAND 1  the grid (cells flood + colour by component)
     BAND 2  water level + which cell just flooded
     BAND 3  start↔end connectivity + answer
   Style: white paper background, solid-color fills.
   ============================================================ */

(function () {
  const canvas = document.getElementById('va-canvas');
  if (!canvas) return;

  const ctx      = canvas.getContext('2d');
  const stepEl   = document.getElementById('va-step');
  const labelEl  = document.getElementById('va-label');
  const btnPrev  = document.getElementById('va-prev');
  const btnNext  = document.getElementById('va-next');
  const btnPlay  = document.getElementById('va-play');
  const btnReset = document.getElementById('va-reset');

  const COLOR = {
    paper:'#ffffff', ink:'#1a1a1a', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf',
    dry:'#fafaf6', dryS:'#d3ccbe',
    A:'#e3edf5', AS:'#6f9fc4',       // start component (blue = flooded)
    B:'#f6ead8', BS:'#d4a868',       // other flooded island (tan)
    conn:'#d9e8c7', connS:'#5fa866', // connected (green)
    cur:'#cf3535',                    // just-flooded outline
    coral:'#cf3535',
  };

  const GRID = [[0,2,1],[5,8,3],[6,7,4]];
  const N = 3;
  const START = '0,0', END = '2,2';

  // per-step: flooded map "r,c"->'A'|'B', add cell, level h, connected
  const steps = [
    { flooded:{}, add:null, h:null, conn:false,
      text:'<strong>INITIAL</strong> · 水位從最低往上升。高度 ≤ 水位的格子就<strong>被淹沒 = 可通行</strong>。'
          +'目標:讓左上 <code>START</code> 與右下 <code>END</code> 連通。' },
    { flooded:{'0,0':'A'}, add:'0,0', h:0, conn:false,
      text:'水位 <strong>0</strong> → 淹沒高度 0 的格 <code>(0,0)</code>(START)。目前它自成一區。' },
    { flooded:{'0,0':'A','0,2':'B'}, add:'0,2', h:1, conn:false,
      text:'水位 <strong>1</strong> → 淹沒 <code>(0,2)</code>。它的鄰居都還沒淹 → 自成<strong>另一座島</strong>(棕)。' },
    { flooded:{'0,0':'A','0,1':'A','0,2':'A'}, add:'0,1', h:2, conn:false,
      text:'水位 <strong>2</strong> → 淹沒 <code>(0,1)</code>,它同時碰到 <code>(0,0)</code> 與 <code>(0,2)</code> → '
          +'<strong>union 合併</strong>,上排連成一片。' },
    { flooded:{'0,0':'A','0,1':'A','0,2':'A','1,2':'A'}, add:'1,2', h:3, conn:false,
      text:'水位 <strong>3</strong> → 淹沒 <code>(1,2)</code>,與 <code>(0,2)</code> 相連併入同一區。END 還沒淹。' },
    { flooded:{'0,0':'A','0,1':'A','0,2':'A','1,2':'A','2,2':'A'}, add:'2,2', h:4, conn:true,
      text:'水位 <strong>4</strong> → 淹沒 <code>(2,2)</code>(END),與 <code>(1,2)</code> 相連 → '
          +'<strong>START 與 END 連通!回傳 4</strong>。高度 5~8 的格從頭到尾沒被淹。' },
  ];

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

  function draw() {
    fitCanvas();
    const s = steps[step];
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const PAD = 26;
    ctx.fillStyle = COLOR.paper; ctx.fillRect(0,0,w,h);

    // ───────── BAND 1 · grid ─────────
    ctx.fillStyle = COLOR.dim; ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 網格(藍=已淹沒且與 START 同區,棕=另一座島,白=未淹)', PAD, 26);

    const cell = 74, gx = PAD+22, gy = 46;
    for (let r=0;r<N;r++) for (let c=0;c<N;c++){
      const key=r+','+c, x=gx+c*cell, y=gy+r*cell;
      const comp = s.flooded[key];
      const isAdd = s.add===key;
      let fill=COLOR.dry, strokeC=COLOR.dryS;
      if (comp==='A'){ fill = s.conn?COLOR.conn:COLOR.A; strokeC = s.conn?COLOR.connS:COLOR.AS; }
      else if (comp==='B'){ fill=COLOR.B; strokeC=COLOR.BS; }
      rr(x+2, y+2, cell-4, cell-4, 6);
      ctx.fillStyle = fill; ctx.fill();
      ctx.lineWidth = isAdd?3.5:1.6; ctx.strokeStyle = isAdd?COLOR.cur:strokeC; ctx.stroke();
      // elevation number
      ctx.fillStyle = comp?COLOR.ink:'#8a847a';
      ctx.font = '700 26px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(GRID[r][c]), x+cell/2, y+cell/2);
      // START / END tags
      if (key===START || key===END){
        ctx.fillStyle=COLOR.coral; ctx.font='700 9px "JetBrains Mono", monospace';
        ctx.textBaseline='top'; ctx.fillText(key===START?'START':'END', x+cell/2, y+7);
      }
    }

    // right-side water gauge
    const gaugeX = gx + N*cell + 40, gaugeW = 46, gaugeTop = gy, gaugeH = N*cell-4;
    if (gaugeX + gaugeW < w - PAD){
      // frame
      rr(gaugeX, gaugeTop, gaugeW, gaugeH, 6);
      ctx.fillStyle='#f7fafc'; ctx.fill(); ctx.strokeStyle=COLOR.grid; ctx.lineWidth=1.5; ctx.stroke();
      // fill by level h (0..8 mapped)
      if (s.h!=null){
        const frac = (s.h+1)/9;
        const fh = gaugeH*frac;
        rr(gaugeX, gaugeTop+gaugeH-fh, gaugeW, fh, 6);
        ctx.fillStyle=COLOR.A; ctx.fill();
      }
      ctx.fillStyle=COLOR.dim; ctx.font='600 9px "JetBrains Mono", monospace';
      ctx.textAlign='center'; ctx.textBaseline='bottom'; ctx.fillText('WATER', gaugeX+gaugeW/2, gaugeTop-4);
      ctx.fillStyle=COLOR.text; ctx.font='700 22px "JetBrains Mono", monospace';
      ctx.textBaseline='middle'; ctx.fillText(s.h==null?'·':String(s.h), gaugeX+gaugeW/2, gaugeTop+gaugeH/2);
    }

    // ───────── BAND 2 · water level / flood action ─────────
    ctx.fillStyle = COLOR.coral; ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · 依高度由小到大淹格(min-heap 依序取出)', PAD, gy+N*cell+30);
    const by = gy+N*cell+44;
    ctx.textBaseline='middle';
    if (s.add){
      const [r,c]=s.add.split(',').map(Number);
      ctx.fillStyle=COLOR.text; ctx.font='600 14px "Noto Sans TC", sans-serif'; ctx.textAlign='left';
      ctx.fillText(`水位 h = ${s.h} → 淹沒格 (${r}, ${c}),高度 ${GRID[r][c]}`, PAD+6, by+12);
    } else {
      ctx.fillStyle=COLOR.dim; ctx.font='500 14px "Noto Sans TC", sans-serif'; ctx.textAlign='left';
      ctx.fillText('點 Next / Play 開始上升水位', PAD+6, by+12);
    }

    // ───────── BAND 3 · connectivity / answer ─────────
    const cy = by+44;
    ctx.fillStyle = s.conn?COLOR.connS:COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace';
    ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · START ↔ END 連通?', PAD, cy);
    const box=cy+14;
    rr(PAD, box, w-PAD*2, 40, 6);
    ctx.fillStyle = s.conn?COLOR.conn:'#fafaf6'; ctx.fill();
    ctx.lineWidth=1.6; ctx.strokeStyle = s.conn?COLOR.connS:COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if (s.conn){
      ctx.fillStyle='#2f6a3a'; ctx.font='700 15px "JetBrains Mono", monospace';
      ctx.fillText('Find(START) == Find(END) → return 4', w/2, box+20);
    } else {
      ctx.fillStyle=COLOR.dim; ctx.font='600 13px "Noto Sans TC", sans-serif';
      ctx.fillText(s.h==null?'尚未開始':'還沒連通,繼續升水位…', w/2, box+20);
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
