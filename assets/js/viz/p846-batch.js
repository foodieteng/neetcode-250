/* ============================================================
   P846 · Hand of Straights — map 由小到大 · 整批開組 · viz
   freq = map<int,int>(key 由小到大)
     for (auto &[k, v] : freq) {
       int cnt = v;  if (cnt == 0) continue;        最小的剩餘 key 一定是 cnt 組的開頭
       for (i = 0; i < groupSize; i++) {
         if (!freq.count(k+i) || freq[k+i] < cnt) return false;
         freq[k+i] -= cnt;                           一次扣掉 cnt 組
       }
     }
   範例 A(T3)[1,1,2,2,3,3,3,4,5], g=3 → true ; 範例 2 [1,2,3,4,5], g=4 → false(缺 6)
     BAND 0  目前是哪個範例 + 輸入
     BAND 1  freq(key 表頭 · 次數格 · 視窗 i 分段)
     BAND 2  狀態 k / v / cnt / i + 本步檢查
     BAND 3  已組成的 group(每組一排小格)
   所有數字取自實測 trace(fact sheet T3 / T2)。
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

  const EX = {
    A: { hand:[1,1,2,2,3,3,3,4,5], g:3, keys:[1,2,3,4,5], init:{1:2,2:2,3:3,4:1,5:1},
         name:'範例 A · T3', ans:'true', ghost:null, plan:[[1,2],[3,1]] },
    B: { hand:[1,2,3,4,5], g:4, keys:[1,2,3,4,5], init:{1:1,2:1,3:1,4:1,5:1},
         name:'範例 2', ans:'false', ghost:6, plan:[[1,1],[5,1]] },
  };

  /* trace(fact sheet):b / a = 該格減之前 / 之後;kind = init / land / skip / sub / done / fail / ret */
  const OPS = [
    { ex:'A', kind:'init' },
    { ex:'A', kind:'land', k:1, cnt:2 },
    { ex:'A', kind:'sub',  k:1, cnt:2, i:0, b:2, a:0 },
    { ex:'A', kind:'sub',  k:1, cnt:2, i:1, b:2, a:0 },
    { ex:'A', kind:'sub',  k:1, cnt:2, i:2, b:3, a:1 },
    { ex:'A', kind:'skip', k:2 },
    { ex:'A', kind:'land', k:3, cnt:1 },
    { ex:'A', kind:'sub',  k:3, cnt:1, i:0, b:1, a:0 },
    { ex:'A', kind:'sub',  k:3, cnt:1, i:1, b:1, a:0 },
    { ex:'A', kind:'sub',  k:3, cnt:1, i:2, b:1, a:0 },
    { ex:'A', kind:'skip', k:4 },
    { ex:'A', kind:'skip', k:5 },
    { ex:'A', kind:'done' },
    { ex:'B', kind:'init' },
    { ex:'B', kind:'land', k:1, cnt:1 },
    { ex:'B', kind:'sub',  k:1, cnt:1, i:0, b:1, a:0 },
    { ex:'B', kind:'sub',  k:1, cnt:1, i:1, b:1, a:0 },
    { ex:'B', kind:'sub',  k:1, cnt:1, i:2, b:1, a:0 },
    { ex:'B', kind:'sub',  k:1, cnt:1, i:3, b:1, a:0 },
    { ex:'B', kind:'skip', k:2 },
    { ex:'B', kind:'skip', k:3 },
    { ex:'B', kind:'skip', k:4 },
    { ex:'B', kind:'land', k:5, cnt:1 },
    { ex:'B', kind:'sub',  k:5, cnt:1, i:0, b:1, a:0 },
    { ex:'B', kind:'fail', k:5, cnt:1, i:1 },
    { ex:'B', kind:'ret' },
  ];

  // 依 trace 逐步套用,存下每一步「本步結束後」的 freq 與 group 批次
  const SNAP = [];
  (function build(){
    let freq=null, batches=null, lastK=null, lastCnt=null;
    for(const op of OPS){
      const ex=EX[op.ex];
      if(op.kind==='init'){ freq=Object.assign({}, ex.init); batches=[]; lastK=null; lastCnt=null; }
      if(op.kind==='land'){ batches.push({ k:op.k, cnt:op.cnt, filled:0, done:false, fail:-1 }); }
      if(op.kind==='sub'){ freq[op.k+op.i]=op.a; const bt=batches[batches.length-1]; bt.filled=op.i+1; if(op.i+1===ex.g) bt.done=true; }
      if(op.kind==='fail'){ batches[batches.length-1].fail=op.i; }
      if(op.k!==undefined){ lastK=op.k; lastCnt = op.kind==='skip' ? 0 : op.cnt; }
      SNAP.push({ freq:Object.assign({}, freq), batches:batches.map(b=>Object.assign({}, b)), lastK, lastCnt });
    }
  })();

  const steps = [
    { text:'<strong>INITIAL · 範例 A</strong> · <code>hand = [1,1,2,2,3,3,3,4,5]</code>,<code>groupSize = 3</code>。先數次數:<code>freq = {1:2, 2:2, 3:3, 4:1, 5:1}</code>。<code>map</code> 會<b>由小到大</b>走訪 key —— 目前最小的剩餘 key 前面已經沒有更小的牌,它<b>只能當某組的開頭</b>。' },
    { text:'<code>k = 1</code>:<code>cnt = v = freq[1] = 2</code> &gt; 0。兩張 1 都只能當開頭 → <b>一次開 2 組</b>,每組都要 <code>1, 2, 3</code>,所以視窗 <code>[1, 3]</code> 的每一格都要扣 <code>cnt = 2</code>。' },
    { text:'<code>i = 0</code>:<code>freq.count(1)</code> 有,<code>freq[1] = 2 ≥ cnt 2</code> → <code>freq[1] −= 2</code> → <b>0</b>。注意 <code>v</code> 是參照,現在也變 0 了;<code>cnt</code> 是先複製的,<b>仍是 2</b> —— 後面兩格才扣得對。' },
    { text:'<code>i = 1</code>:<code>freq[2] = 2 ≥ cnt 2</code> → <code>freq[2] −= 2</code> → <b>0</b>。兩組都拿到了 2。' },
    { text:'<code>i = 2</code>:<code>freq[3] = 3 ≥ cnt 2</code> → <code>freq[3] −= 2</code> → <b>1</b>。兩組 <code>[1,2,3]</code> 完成 ✓,3 還剩 1 張。' },
    { text:'<code>k = 2</code>:<code>cnt = freq[2] = 0</code> → <code>continue</code>。2 已經全被 k = 1 開的兩組用掉,跳過。' },
    { text:'<code>k = 3</code>:<code>cnt = v = freq[3] = 1</code> &gt; 0。比 3 小的 key 都用完了,剩下這張 3 只能當開頭 → 開 1 組,視窗 <code>[3, 5]</code>,每格扣 1。' },
    { text:'<code>i = 0</code>:<code>freq[3] = 1 ≥ cnt 1</code> → <code>freq[3] −= 1</code> → <b>0</b>。' },
    { text:'<code>i = 1</code>:<code>freq[4] = 1 ≥ cnt 1</code> → <code>freq[4] −= 1</code> → <b>0</b>。' },
    { text:'<code>i = 2</code>:<code>freq[5] = 1 ≥ cnt 1</code> → <code>freq[5] −= 1</code> → <b>0</b>。第三組 <code>[3,4,5]</code> 完成 ✓。' },
    { text:'<code>k = 4</code>:<code>cnt = freq[4] = 0</code> → <code>continue</code>,4 已被 <code>[3,4,5]</code> 用掉。' },
    { text:'<code>k = 5</code>:<code>cnt = freq[5] = 0</code> → <code>continue</code>,5 也已用掉。' },
    { text:'<strong>範例 A 結果</strong> · map 走完,沒有任何一次檢查失敗 → <code>return true</code> ✓。組成 <code>[1,2,3] ×2</code> 與 <code>[3,4,5] ×1</code>,9 張牌剛好分完。' },
    { text:'<strong>INITIAL · 範例 2</strong> · <code>hand = [1,2,3,4,5]</code>,<code>groupSize = 4</code>。<code>freq = {1:1, 2:1, 3:1, 4:1, 5:1}</code>。右邊虛線格是 <b>6</b>:map 裡<b>沒有</b>這個 key。' },
    { text:'<code>k = 1</code>:<code>cnt = v = freq[1] = 1</code> → 開 1 組,視窗 <code>[1, 4]</code>,每格扣 1。' },
    { text:'<code>i = 0</code>:<code>freq[1] = 1 ≥ cnt 1</code> → <code>freq[1] −= 1</code> → <b>0</b>。' },
    { text:'<code>i = 1</code>:<code>freq[2] = 1 ≥ cnt 1</code> → <code>freq[2] −= 1</code> → <b>0</b>。' },
    { text:'<code>i = 2</code>:<code>freq[3] = 1 ≥ cnt 1</code> → <code>freq[3] −= 1</code> → <b>0</b>。' },
    { text:'<code>i = 3</code>:<code>freq[4] = 1 ≥ cnt 1</code> → <code>freq[4] −= 1</code> → <b>0</b>。第一組 <code>[1,2,3,4]</code> 完成 ✓。' },
    { text:'<code>k = 2</code>:<code>cnt = freq[2] = 0</code> → <code>continue</code>。' },
    { text:'<code>k = 3</code>:<code>cnt = freq[3] = 0</code> → <code>continue</code>。' },
    { text:'<code>k = 4</code>:<code>cnt = freq[4] = 0</code> → <code>continue</code>。' },
    { text:'<code>k = 5</code>:<code>cnt = v = freq[5] = 1</code> &gt; 0。5 是剩下最小的 key,它必須當開頭 → 開 1 組,需要 <code>5, 6, 7, 8</code>,視窗 <code>[5, 8]</code>。' },
    { text:'<code>i = 0</code>:<code>freq[5] = 1 ≥ cnt 1</code> → <code>freq[5] −= 1</code> → <b>0</b>。這組先拿到 5。' },
    { text:'<code>i = 1</code>:檢查 <code>k + i = 6</code>:<code>!freq.count(6)</code> 成立 —— map 裡<b>根本沒有 6</b>,以 5 開頭的組湊不出連續 4 張。' },
    { text:'<strong>範例 2 結果</strong> · <code>return false</code> ✗。5 前面已經沒有任何牌,它只能當開頭,卻接不上 6 —— 不可能分組。' },
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
  function cross(x,y,s,color,lw){ ctx.beginPath(); ctx.moveTo(x-s,y-s); ctx.lineTo(x+s,y+s); ctx.moveTo(x+s,y-s); ctx.lineTo(x-s,y+s); ctx.lineWidth=lw; ctx.strokeStyle=color; ctx.stroke(); }
  function pill(x, y, pw, ph, s, font, bg, bd, tx, lw){
    rr(x, y, pw, ph, ph/2); ctx.fillStyle=bg; ctx.fill(); ctx.lineWidth=lw||1.2; ctx.strokeStyle=bd; ctx.stroke();
    txt(s, x+pw/2, y+ph/2+1, font, tx, 'center', 'middle');
  }

  function draw(){
    fit();
    const w=canvas.clientWidth, h=canvas.clientHeight, PAD=22, IN=10;
    ctx.fillStyle=C.paper; ctx.fillRect(0,0,w,h); ctx.setLineDash([]);
    const op=OPS[step], sn=SNAP[step], ex=EX[op.ex], g=ex.g;
    const prevSn = (step>0 && OPS[step-1].ex===op.ex) ? SNAP[step-1] : sn;
    const kind=op.kind;
    const isSub=kind==='sub', isLand=kind==='land', isSkip=kind==='skip', isFail=kind==='fail', isRet=kind==='ret', isDone=kind==='done';
    // 目前批次(視窗)
    const winK = (isLand||isSub||isFail) ? op.k : null;
    const curKey = isSub ? op.k+op.i : (isFail ? op.k+op.i : null);

    const cols = ex.keys.slice(); if(ex.ghost!==null) cols.push(ex.ghost);
    const N=cols.length;
    const X0=PAD+70, XR=w-PAD-IN, colW=(XR-X0)/N, cg=Math.min(16, colW*0.18), cw=colW-cg;
    const cx=j=>X0+j*colW+cg/2;
    const L=cx(0), R=cx(N-1)+cw;
    const tagX=PAD+35;

    /* ---------- BAND 0 · 哪個範例 ---------- */
    const tabF='700 11.5px '+SANS, tabW=Math.max(tw(EX.A.name,tabF), tw(EX.B.name,tabF))+22, tabH=20, tabY=6;
    ['A','B'].forEach((e,ix)=>{
      const x=w-PAD-(2-ix)*tabW-(ix===0?8:0), on=e===op.ex;
      rr(x, tabY, tabW, tabH, 10); ctx.fillStyle=on?C.ink:C.cell; ctx.fill();
      ctx.lineWidth=1.2; ctx.strokeStyle=on?C.ink:C.off; ctx.stroke();
      txt(EX[e].name, x+tabW/2, tabY+tabH/2+1, tabF, on?C.paper:C.dim, 'center', 'middle');
    });
    const t0='hand = ['+ex.hand.join(',')+']   groupSize = '+g+'   預期 → '+ex.ans;
    txt(t0, PAD, 20, fitFont(t0, w-2*PAD-2*tabW-8-16, '700', [12.5,12,11.5,11,10.5], MONO), C.ink);

    /* ---------- BAND 1 · freq ---------- */
    const B1=48, hy=77, by=100, bh=46, wy=160, wh=22;
    const t1='BAND 1 · freq (map 由小到大)   紅 = 正在減   藍 = 視窗 [k, k+g−1]   灰 = 已用完 0'+(ex.ghost!==null?'   深紅虛線 = 不存在':'');
    txt(t1, PAD, B1, fitFont(t1, w-2*PAD, '600', [11.5,11,10.5,10,9.5], MONO), C.dim);
    txt('key', tagX, hy, '700 12px '+MONO, C.ink, 'center', 'middle');
    txt('freq', tagX, by+bh/2+1, '700 13px '+MONO, C.ink, 'center', 'middle');
    txt('i', tagX, wy+wh/2+1, '700 12px '+MONO, C.ink, 'center', 'middle');

    const inWin = key => winK!==null && key>=winK && key<=winK+g-1;
    for(let j=0;j<N;j++){
      const key=cols[j], x=cx(j), isGhost = key===ex.ghost;
      const val = isGhost ? null : sn.freq[key];
      const isK = key===sn.lastK && !isDone && !isRet && kind!=='init';
      // ---- 表頭 ----
      let hs=String(key), hc=C.dim, hpill=null;
      if(isK && (isLand||isSub||isFail||isSkip)){ hs='k = '+key; hpill = isSkip ? {bg:C.cell, bd:C.red, tx:C.redT, dash:true} : {bg:C.redBg, bd:C.red, tx:C.redT}; }
      else if(curKey===key){ hs='k+'+op.i+' = '+key; hc = isFail ? C.red2 : C.redT; }
      else if(inWin(key)){ hs='k+'+(key-winK)+' = '+key; hc=C.ink; }
      if(isGhost && !inWin(key)){ hs='6 (無)'; hc = (isRet ? C.red2 : C.dim); }
      if(isGhost && isRet){ hs='6 missing'; hc=C.red2; }
      if(isGhost && isFail){ hs='k+1 = 6 missing'; hc=C.red2; }
      if(hpill){
        const hf=fitFont(hs, cw-4, '700', [11.5,11,10.5,10], MONO), pw=Math.min(cw, tw(hs,hf)+18), ph=18;
        rr(x+cw/2-pw/2, hy-ph/2, pw, ph, 9); ctx.fillStyle=hpill.bg; ctx.fill();
        ctx.setLineDash(hpill.dash?[3,3]:[]); ctx.lineWidth=1.4; ctx.strokeStyle=hpill.bd; ctx.stroke(); ctx.setLineDash([]);
        txt(hs, x+cw/2, hy+1, hf, hpill.tx, 'center', 'middle');
      } else {
        txt(hs, x+cw/2, hy+1, fitFont(hs, cw+cg-4, '700', [11.5,11,10.5,10,9.5], MONO), hc, 'center', 'middle');
      }
      // ---- 次數格 ----
      let st={bg:C.cell, bd:C.ink, tx:C.ink, lw:1.4}, shown=val;
      const vf='700 19px '+MONO;
      if(isGhost){
        if(isFail||isRet){ st={bg:C.bad, bd:C.red2, tx:C.red2, lw:2.6, dash:true}; shown='無'; }
        else if(inWin(key)){ st={bg:C.tint, bd:C.red2, tx:C.red2, lw:1.6, dash:true}; shown='—'; }
        else { st={bg:C.cell, bd:C.red2, tx:C.red2, lw:1.2, dash:true}; shown='—'; }
      } else {
        if(val===0) st={bg:C.cell, bd:C.off, tx:C.dim, lw:1.2};
        if(isDone) st={bg:C.good, bd:C.goodT, tx:C.goodT, lw:1.8};
        if(inWin(key)) st={bg:C.tint, bd:val===0?C.dim:C.ink, tx:val===0?C.dim:C.ink, lw:1.4};
        if(isLand && key===op.k) st={bg:C.tint, bd:C.red, tx:C.redT, lw:2.4};
        if(isSkip && key===op.k) st={bg:C.cell, bd:C.red, tx:C.redT, lw:2, dash:true};
        if(isSub && key===curKey){ st={bg:C.redBg, bd:C.red, tx:C.redT, lw:2.8}; shown=op.b+' → '+op.a; }
      }
      const ft = typeof shown==='string' && shown.length>2 ? fitFont(shown, cw-10, '700', [18,16,15,14,13], MONO) : vf;
      cellBox(x,by,cw,bh,st,shown,ft);
      if(isGhost && (isFail||isRet)) cross(x+cw-12, by+11, 4.5, C.red2, 2.2);
      if(isSkip && key===op.k) txt('skip', x+cw-6, by+bh-8, '700 10px '+MONO, C.redT, 'right', 'middle');
    }

    // ---- 視窗分段 i = 0..g−1 ----
    // 底軌
    rr(L, wy, R-L, wh, 5); ctx.setLineDash([4,3]); ctx.lineWidth=1; ctx.strokeStyle=C.off; ctx.stroke(); ctx.setLineDash([]);
    if(winK!==null){
      const curI = isSub||isFail ? op.i : -1;
      for(let ii=0; ii<g; ii++){
        const key=winK+ii, j=cols.indexOf(key);
        if(j<0) continue;
        const x=cx(j);
        let bg=C.tint, bd=C.ink, tx=C.ink, lw=1.2, s='i='+ii, dash=false;
        if(ii<curI || (isSub && ii===curI)){ /* 已扣 */ }
        if(ii<curI){ bg=C.cell; bd=C.off; tx=C.dim; s='i='+ii+' ✓'; }
        if(isSub && ii===curI){ bg=C.redBg; bd=C.red; tx=C.redT; lw=2; s='i='+ii+'  −'+op.cnt; }
        if(isFail && ii===curI){ bg=C.bad; bd=C.red2; tx=C.red2; lw=2.2; s='i='+ii+' ✗'; dash=true; }
        if(isLand) s='i='+ii+'  −'+op.cnt;
        rr(x, wy, cw, wh, 5); ctx.fillStyle=bg; ctx.fill(); ctx.setLineDash(dash?[4,3]:[]); ctx.lineWidth=lw; ctx.strokeStyle=bd; ctx.stroke(); ctx.setLineDash([]);
        txt(s, x+cw/2, wy+wh/2+1, fitFont(s, cw-6, '700', [11,10.5,10,9.5], MONO), tx, 'center', 'middle');
      }
    } else {
      let s, col=C.dim;
      if(kind==='init') s='每次落在 k(cnt > 0)時,視窗 [k, k+'+(g-1)+'] 的 '+g+' 格各扣 cnt';
      else if(isSkip) s='k = '+op.k+' 的 cnt = 0 → 不開組,沒有視窗';
      else if(isDone){ s='每個 key 都扣到 0 → 全部分完'; col=C.goodT; }
      else { s='視窗 [5, 8] 卡在 6:map 沒有這個 key'; col=C.red2; }
      txt(s, (L+R)/2, wy+wh/2+1, fitFont(s, R-L-16, '600', [11.5,11,10.5,10], MONO), col, 'center', 'middle');
    }

    /* ---------- BAND 2 · 狀態 + 檢查 ---------- */
    const B2=206, sy=220, sh=28, qy=262, qh=36;
    txt('BAND 2 · 狀態', PAD, B2, '700 12px '+SANS, C.ink);
    const t2='cnt = v 先複製:v 是 freq[k] 的參照,freq[k] −= cnt 之後 v 會變 0';
    const t2x=PAD+tw('BAND 2 · 狀態','700 12px '+SANS)+16;
    txt(t2, t2x, B2, fitFont(t2, w-PAD-t2x, '600', [11.5,11,10.5,10,9.5], MONO), C.dim);
    txt('state', tagX, sy+sh/2+1, '700 12px '+MONO, C.ink, 'center', 'middle');
    txt('check', tagX, qy+qh/2+1, '700 12px '+MONO, C.ink, 'center', 'middle');

    const active = !(kind==='init'||isDone||isRet);
    const kS = active ? 'k = '+op.k : 'k = —';
    const vNow = active ? sn.freq[op.k] : null;
    const vS = active ? 'v = freq['+op.k+'] = '+vNow : 'v = —';
    const cS = active ? 'cnt = '+(isSkip?0:op.cnt) : 'cnt = —';
    const iS = (isSub||isFail) ? 'i = '+op.i : 'i = —';
    const kChg = isLand||isSkip, vChg = isLand||isSkip||(isSub && op.i===0), cChg = isLand||isSkip, iChg = isSub||isFail;
    const chips=[[kS,kChg],[vS,vChg],[cS,cChg],[iS,iChg]];
    const gap=12, chW=[0.2,0.34,0.22,0.24].map(f=>f*(R-L-gap*3));
    let xx=L;
    chips.forEach(([s,chg],ix)=>{
      const on=active||ix===3&&iChg;
      const bg = chg ? C.redBg : (on ? C.cell : C.cell), bd = chg ? C.red : (on ? C.ink : C.off), tx = chg ? C.redT : (on ? C.ink : C.dim);
      let label=s;
      if(ix===1 && isSub && op.i===0) label=s+'  (參照被扣)';
      if(ix===2 && isSub && op.i===0) label=s+'  (複製,不變)';
      pill(xx, sy, chW[ix], sh, label, fitFont(label, chW[ix]-14, '700', [13,12.5,12,11.5,11,10.5,10], MONO), bg, bd, tx, chg?2:1.2);
      xx+=chW[ix]+gap;
    });

    // check 盒 + 結果 chip
    const chipW=Math.max(110, Math.min(160, (R-L)*0.24)), chipX=R-chipW, boxR=chipX-14;
    let cl, cbg=C.cell, cbd=C.ink, ctx2=C.ink, clw=1.2, chip, kbg=C.cell, kbd=C.ink, ktx=C.ink, klw=1.2;
    if(kind==='init'){ cl='依 key 由小到大走訪 · 最小的剩餘 key 只能當開頭'; ctx2=C.dim; chip='尚未開始'; kbd=C.off; ktx=C.dim; }
    else if(isLand){ cl='cnt = v = freq['+op.k+'] = '+op.cnt+' > 0 → 以 '+op.k+' 開頭開 '+op.cnt+' 組 · 視窗 ['+op.k+', '+(op.k+g-1)+']';
      cbg=C.tint; chip='開 '+op.cnt+' 組'; kbg=C.redBg; kbd=C.red; ktx=C.redT; klw=2; }
    else if(isSub){ const key=op.k+op.i;
      cl='freq.count('+key+') ✓ · freq['+key+'] = '+op.b+' ≥ cnt '+op.cnt+' → 減 '+op.cnt+' → '+op.a;
      cbg=C.redBg; cbd=C.red; ctx2=C.redT; clw=2; chip='通過 ✓'; }
    else if(isSkip){ cl='cnt = freq['+op.k+'] = 0 → continue (已被前面的組用完)'; ctx2=C.ink; chip='skip'; kbd=C.off; ktx=C.dim; }
    else if(isDone){ cl='map 走完,沒有一次檢查失敗 → return true'; cbg=C.good; cbd=C.goodT; ctx2=C.goodT; clw=2.2;
      chip='true ✓'; kbg=C.good; kbd=C.goodT; ktx=C.goodT; klw=2.4; }
    else if(isFail){ cl='k+i = '+(op.k+op.i)+' · !freq.count(6) → 成立 (map 沒有 6)'; cbg=C.redBg; cbd=C.red2; ctx2=C.red2; clw=2.4;
      chip='→ return false'; kbg=C.bad; kbd=C.red2; ktx=C.red2; klw=2; }
    else { cl='return false · 以 5 開頭的組缺 6,湊不出連續 4 張'; cbg=C.bad; cbd=C.red2; ctx2=C.red2; clw=2.4;
      chip='false ✗'; kbg=C.bad; kbd=C.red2; ktx=C.red2; klw=2.6; }
    rr(L, qy, boxR-L, qh, 6); ctx.fillStyle=cbg; ctx.fill(); ctx.lineWidth=clw; ctx.strokeStyle=cbd; ctx.stroke();
    txt(cl, L+12, qy+qh/2+1, fitFont(cl, boxR-L-24, '700', [13,12.5,12,11.5,11,10.5,10], MONO), ctx2, 'left', 'middle');
    rr(chipX, qy, chipW, qh, 18); ctx.fillStyle=kbg; ctx.fill(); ctx.lineWidth=klw; ctx.strokeStyle=kbd; ctx.stroke();
    txt(chip, chipX+chipW/2, qy+qh/2+1, fitFont(chip, chipW-16, '700', [14,13,12,11], MONO), ktx, 'center', 'middle');

    /* ---------- BAND 3 · groups ---------- */
    const B3=326, gy=340, gh=30, capY=386;
    txt('BAND 3 · 已組成的 group', PAD, B3, '700 12px '+SANS, C.ink);
    const t3='同一個 k 一次開 cnt 組 · 每一排 = 一組';
    const t3x=PAD+tw('BAND 3 · 已組成的 group','700 12px '+SANS)+16;
    txt(t3, t3x, B3, fitFont(t3, w-PAD-t3x, '600', [11.5,11,10.5,10], MONO), C.dim);
    txt('group', tagX, gy+gh/2+1, '700 12px '+MONO, C.ink, 'center', 'middle');

    const mw=Math.min(34, Math.max(26, colW*0.32)), mg=4, blockW=g*mw+(g-1)*mg, inGap=12, batchGap=30;
    let gx=L;
    let doneCnt=0;
    ex.plan.forEach(([pk,pc], bi)=>{
      const bt=sn.batches[bi];
      const bwTot=pc*blockW+(pc-1)*inGap;
      if(bt){
        const justOpened = isLand && op.k===bt.k;
        for(let r=0;r<pc;r++){
          const x0=gx+r*(blockW+inGap);
          for(let ii=0; ii<g; ii++){
            const x=x0+ii*(mw+mg), key=bt.k+ii;
            let st, val=null;
            if(ii<bt.filled){ val=key; st = bt.done ? {bg:C.good, bd:C.goodT, tx:C.goodT, lw:1.6} : {bg:C.tint, bd:C.ink, tx:C.ink, lw:1.3};
              if(isSub && op.k===bt.k && ii===op.i) st={bg:C.redBg, bd:C.red, tx:C.redT, lw:2.2}; }
            else if(bt.fail===ii){ val='✗'; st={bg:C.bad, bd:C.red2, tx:C.red2, lw:2.2, dash:true}; }
            else { val = bt.fail>=0 ? '' : (justOpened ? key : ''); st={bg:C.cell, bd:justOpened?C.red:C.off, tx:justOpened?C.red:C.dim, lw:1.2, dash:true}; }
            cellBox(x, gy, mw, gh, st, val, '700 13px '+MONO);
          }
        }
        if(bt.done) doneCnt+=bt.cnt;
        let cap='k='+bt.k+' 開 '+bt.cnt+' 組', cc=C.ink;
        if(bt.done){ cap='['+Array.from({length:g},(_,ii)=>bt.k+ii).join(',')+'] ×'+bt.cnt+' ✓'; cc=C.goodT; }
        else if(bt.fail>=0){ cap='['+bt.k+', 缺 '+(bt.k+bt.fail)+' …] ✗'; cc=C.red2; }
        else if(justOpened || (isSub && op.k===bt.k)){ cc=C.redT; }
        txt(cap, gx+bwTot/2, capY, fitFont(cap, Math.max(bwTot, 96), '700', [11.5,11,10.5], MONO), cc, 'center', 'middle');
      }
      gx+=bwTot+batchGap;
    });
    if(sn.batches.length===0){
      txt('還沒開任何一組', L, gy+gh/2+1, '600 12px '+SANS, C.dim, 'left', 'middle');
    }
    // 右側統計
    let sum='已完成 '+doneCnt+' 組', sc=C.ink;
    if(isDone){ sum='共 '+doneCnt+' 組 · 9 張分完 ✓'; sc=C.goodT; }
    if(isFail||isRet){ sum='完成 '+doneCnt+' 組 · 第 2 組湊不齊'; sc=C.red2; }
    const sf=fitFont(sum, Math.max(120, R-gx+batchGap-12), '700', [12.5,12,11.5,11,10.5], MONO);
    txt(sum, R, gy+gh/2+1, sf, sc, 'right', 'middle');
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
