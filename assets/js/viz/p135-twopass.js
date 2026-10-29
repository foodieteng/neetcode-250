/* ============================================================
   P135 · Candy — 把 ratings 當地形 · 左掃一次 + 右掃一次 · 山頂取 max
   c 全部先放 1(山谷最少 1 顆)
   左掃 i = 1..n−1:ratings[i] > ratings[i−1](從左看是上坡)→ c[i] = c[i−1] + 1,否則留 1
   右掃 i = n−2..0:ratings[i] > ratings[i+1](從右看是上坡)→ c[i] = max(c[i], c[i+1] + 1)
     山頂兩邊都爬得到 → 兩個要求取大的;一樣高不算「更高」→ 沒有限制
   範例 A(官方 1)[1,0,2]
     左掃 → [1,1,2];右掃 i=0:max(1, 1+1) = 2 → [2,1,2],sum 5
   範例 B(山頂衝突)[1,3,5,4,3,2,1]
     左掃 → [1,2,3,1,1,1,1];右掃 i=5:2 · i=4:3 · i=3:4 · i=2:max(3, 4+1) = 5(關鍵)
     → [1,2,5,4,3,2,1],sum 18
   範例 C(相等不受限)[1,2,87,87,87,2,1]
     左掃 → [1,2,3,1,1,1,1](i=3、4:87 = 87 不算上坡,留 1)
     右掃 i=5:2 · i=4:max(1, 2+1) = 3 · i=3、i=2:87 = 87 保持 → [1,2,3,1,3,2,1],sum 13
     BAND 0  三個範例分頁 + 目前在哪一趟(LEFT → / ← RIGHT)
     BAND 1  ratings 地形(柱高只看大小順序 · 紅 = 目前 i · 紅虛線 = 比較的鄰居 · 箭頭 = 誰往誰爬)+ i 表頭
     BAND 2  兩列:左掃後(左掃完成時的快照)/ c(目前)
     BAND 3  本步計算(如 max(3, 4 + 1) = 5)+ Σ c
   所有數字取自實測 trace。
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

  /* 每個範例:輸入、預期、可以合併的連續「保持」步(關鍵 max 步與相等步都不合併) */
  const EX = {
    A: { name:'範例 A · 官方 1',     tab:'A · 官方 1',     r:[1,0,2],              ans:5,  mL:[],          mR:[] },
    B: { name:'範例 B · 山頂衝突',   tab:'B · 山頂衝突',   r:[1,3,5,4,3,2,1],      ans:18, mL:[[3,4,5,6]], mR:[[1,0]] },
    C: { name:'範例 C · 相等不受限', tab:'C · 相等不受限', r:[1,2,87,87,87,2,1],   ans:13, mL:[[5,6]],     mR:[[1,0]] },
  };
  const KEYS = ['A','B','C'];

  /* trace:照程式碼一步一步跑;每個 op 記下這步前後的 c、左掃快照、比較結果 */
  const OPS = [];
  KEYS.forEach(k=>{
    const ex=EX[k], r=ex.r, n=r.length, c=new Array(n).fill(1);
    const ranks=[...new Set(r)].sort((a,b)=>a-b); ex.rank=r.map(v=>ranks.indexOf(v)); ex.nr=ranks.length;
    OPS.push({ ex:k, kind:'init', c:c.slice(), left:null, is:[], cmp:[] });
    const groups=(lo, hi, dir, merges)=>{ const out=[]; const seen=new Set();
      for(let i=lo; dir>0 ? i<=hi : i>=hi; i+=dir){ if(seen.has(i)) continue;
        const g=merges.find(m=>m[0]===i); if(g){ g.forEach(x=>seen.add(x)); out.push(g.slice()); } else out.push([i]); }
      return out; };
    groups(1, n-1, 1, ex.mL).forEach(g=>{
      const before=c.slice(), cmp=[];
      g.forEach(i=>{ const up=r[i]>r[i-1], old=c[i]; if(up) c[i]=c[i-1]+1;
        cmp.push({ i, j:i-1, up, eq:r[i]===r[i-1], old, nv:c[i], nb:c[i-1] }); });
      OPS.push({ ex:k, kind:'L', is:g, cmp, before, c:c.slice(), left:null });
    });
    const left=c.slice(); ex.left=left;
    OPS.push({ ex:k, kind:'Ld', is:[], cmp:[], c:c.slice(), left });
    groups(n-2, 0, -1, ex.mR).forEach(g=>{
      const before=c.slice(), cmp=[];
      g.forEach(i=>{ const up=r[i]>r[i+1], old=c[i]; if(up) c[i]=Math.max(c[i], c[i+1]+1);
        cmp.push({ i, j:i+1, up, eq:r[i]===r[i+1], old, nv:c[i], nb:c[i+1] }); });
      OPS.push({ ex:k, kind:'R', is:g, cmp, before, c:c.slice(), left });
    });
    ex.fin=c.slice(); ex.sum=c.reduce((a,b)=>a+b,0);
    OPS.push({ ex:k, kind:'sum', is:[], cmp:[], c:c.slice(), left });
  });

  const arr = a => '['+a.join(',')+']';
  const code = s => '<code>'+s+'</code>';
  function labelOf(op){
    const ex=EX[op.ex], r=ex.r, n=r.length, tag=ex.name.split(' · ')[0];
    const key=op.ex+':'+op.kind+':'+op.is.join(',');
    const SPECIAL = {
      'A:init:': '<strong>INITIAL · 範例 A</strong> · '+code('ratings = [1,0,2]')+'。把 ratings 想成地形:先每人發 '+code('1')+' 顆(山谷最少也要 1 顆),接著<b>從左往右</b>爬一次、<b>從右往左</b>爬一次。',
      'B:init:': '<strong>INITIAL · 範例 B</strong> · '+code('ratings = [1,3,5,4,3,2,1]')+':左邊上坡 2 階、右邊上坡 4 階,在 '+code('i = 2')+' 的山頂碰頭。看山頂最後要拿幾顆。',
      'C:init:': '<strong>INITIAL · 範例 C</strong> · '+code('ratings = [1,2,87,87,87,2,1]')+':中間是一段<b>平台</b>。題目只要求「比鄰居<b>高</b>」的人拿比較多,一樣高的人之間沒有限制。',
      'B:R:2': '<strong>右掃 · 山頂</strong> · '+code('i = 2')+':'+code('5 &gt; 4')+'。左掃說 '+code('3')+'(從左邊爬 2 階上來),右邊卻要 '+code('4 + 1 = 5')+' → '+code('c[2] = max(3, 5) = 5')+'。<b>山頂兩邊的要求都得滿足,只能取大的。</b>',
      'C:L:3': '<strong>左掃</strong> · '+code('i = 3')+':'+code('87 = 87')+',<b>一樣高不算上坡</b> → '+code('c[3]')+' 保持 '+code('1')+'。左鄰拿 3 顆也沒關係,題目沒要求一樣高的人拿一樣多。',
      'C:L:4': '<strong>左掃</strong> · '+code('i = 4')+':'+code('87 = 87')+' 又是平地 → '+code('c[4]')+' 保持 '+code('1')+'。平台上每一格都重新從 1 起算。',
      'C:R:3': '<strong>右掃</strong> · '+code('i = 3')+':'+code('87 = 87')+',不算上坡 → '+code('c[3]')+' 保持 '+code('1')+'。<b>兩邊鄰居都是 87、都拿 3 顆,中間這位卻只拿 1</b> —— 一樣高不受限,這仍是合法的最少分法。',
      'C:R:2': '<strong>右掃</strong> · '+code('i = 2')+':和右鄰 '+code('87 = 87')+',不算上坡 → 保持左掃的 '+code('3')+'(它比左鄰的 2 高,這個要求左掃已經處理好了)。',
    };
    if(SPECIAL[key]) return SPECIAL[key];
    if(op.kind==='Ld') return '<strong>左掃完成 · '+tag+'</strong> · 拍下快照 '+code(arr(op.left))+':每個人都已滿足「比<b>左鄰</b>高就比左鄰多」。接著<b>從右往左</b>,補上右鄰的要求。';
    if(op.kind==='sum') return '<strong>'+tag+' 結果</strong> · '+code('c = '+arr(ex.fin))+','+code('return '+ex.sum)+'。每一段上坡都從山谷的 1 一階一階數上去,山頂拿兩邊裡比較大的那個。';
    const pass = op.kind==='L' ? '左掃' : '右掃', side = op.kind==='L' ? '左' : '右';
    if(op.cmp.length>1){
      const parts=op.cmp.map(q=>code(r[q.i]+(q.eq?' = ':' ≤ ')+r[q.j])).join('、');
      const idx=op.is.length>2 ? op.is[0]+'..'+op.is[op.is.length-1] : op.is.join('、');
      const keepVals = op.cmp.map(q=>q.nv).join('、');
      return '<strong>'+pass+'</strong> · '+code('i = '+idx)+':'+parts+',都不是從'+side+'邊爬上來 → 都保持 '+code(keepVals)+(op.kind==='L'?'。下坡那一側等右掃再處理。':'(左掃的值)。');
    }
    const q=op.cmp[0], i=q.i, j=q.j;
    if(op.kind==='L'){
      if(q.up) return '<strong>左掃</strong> · '+code('i = '+i)+':'+code(r[i]+' &gt; '+r[j])+',從左邊看是上坡 → '+code('c['+i+'] = c['+j+'] + 1 = '+q.nv)+'。';
      return '<strong>左掃</strong> · '+code('i = '+i)+':'+code(r[i]+(q.eq?' = ':' ≤ ')+r[j])+',不是上坡 → '+code('c['+i+']')+' 保持 '+code('1')+'(從這裡重新起算)。';
    }
    if(q.up){
      const who = q.nv>q.old ? '右邊的要求比較大' : '左掃的值已經夠大';
      return '<strong>右掃</strong> · '+code('i = '+i)+':'+code(r[i]+' &gt; '+r[j])+',從右邊看是上坡 → '+code('c['+i+'] = max('+q.old+', '+q.nb+' + 1) = '+q.nv)+','+who+'。';
    }
    return '<strong>右掃</strong> · '+code('i = '+i)+':'+code(r[i]+(q.eq?' = ':' ≤ ')+r[j])+',不是上坡 → '+code('c['+i+']')+' 保持左掃的 '+code(String(q.nv))+'。';
  }
  const steps = OPS.map(op=>({ text: labelOf(op) }));

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function txt(s,x,y,font,color,align,base){ ctx.font=font; ctx.fillStyle=color; ctx.textAlign=align||'left'; ctx.textBaseline=base||'alphabetic'; ctx.fillText(s,x,y); }
  function tw(s,font){ ctx.font=font; return ctx.measureText(s).width; }
  function box(x,y,cw,ch,st){
    rr(x,y,cw,ch,st.rad==null?5:st.rad); ctx.fillStyle=st.bg; ctx.fill();
    ctx.setLineDash(st.dash?[4,3]:[]); ctx.lineWidth=st.lw||1.4; ctx.strokeStyle=st.bd; ctx.stroke(); ctx.setLineDash([]);
  }
  function fitFont(s, maxW, weight, sizes, fam){ for(const z of sizes){ const f=weight+' '+z+'px '+fam; if(tw(s,f)<=maxW) return f; } return weight+' '+sizes[sizes.length-1]+'px '+fam; }
  function fitText(cands, maxW, weight, sizes, fam){
    for(const s of cands) for(const z of sizes){ const f=weight+' '+z+'px '+fam; if(tw(s,f)<=maxW) return {s, f}; }
    const s=cands[cands.length-1]; return {s, f:weight+' '+sizes[sizes.length-1]+'px '+fam};
  }
  function line(x1,y1,x2,y2,color,lw,dash){ ctx.setLineDash(dash||[]); ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.lineWidth=lw; ctx.strokeStyle=color; ctx.stroke(); ctx.setLineDash([]); }
  function arrow(x1,y1,x2,y2,color,lw,dash){ // x1,y1 → x2,y2,箭頭在終點
    const a=Math.atan2(y2-y1,x2-x1), hl=8, ex=x2-Math.cos(a)*2, ey=y2-Math.sin(a)*2;
    line(x1,y1,ex-Math.cos(a)*(hl-3),ey-Math.sin(a)*(hl-3),color,lw,dash);
    ctx.beginPath(); ctx.moveTo(ex,ey); ctx.lineTo(ex-hl*Math.cos(a)+4.5*Math.sin(a), ey-hl*Math.sin(a)-4.5*Math.cos(a));
    ctx.lineTo(ex-hl*Math.cos(a)-4.5*Math.sin(a), ey-hl*Math.sin(a)+4.5*Math.cos(a)); ctx.closePath(); ctx.fillStyle=color; ctx.fill();
  }
  function pill(x, y, pw, ph, s, font, bg, bd, tx, lw){
    rr(x, y, pw, ph, ph/2); ctx.fillStyle=bg; ctx.fill(); ctx.lineWidth=lw||1.2; ctx.strokeStyle=bd; ctx.stroke();
    txt(s, x+pw/2, y+ph/2+1, font, tx, 'center', 'middle');
  }

  function draw(){
    fit();
    const w=canvas.clientWidth, h=canvas.clientHeight, PAD=22, IN=10;
    ctx.fillStyle=C.paper; ctx.fillRect(0,0,w,h); ctx.setLineDash([]);
    const op=OPS[step], ex=EX[op.ex], r=ex.r, n=r.length, kind=op.kind;
    const isInit=kind==='init', isL=kind==='L', isLd=kind==='Ld', isR=kind==='R', isSum=kind==='sum';
    const act=new Set(op.is), nbr=new Set(op.cmp.map(q=>q.j).filter(j=>!act.has(j)));
    const single = op.cmp.length===1 ? op.cmp[0] : null;
    const lo = isL ? Math.max(...op.is) : -1;               // 左掃走到哪
    const ro = isR ? Math.min(...op.is) : n;                // 右掃走到哪

    const L=PAD+70, R=w-PAD-IN, tagX=PAD+35;
    const colW=(R-L)/n, cg=Math.min(18, colW*0.16), cw=Math.min(colW-cg, 96), cx=j=>L+j*colW+(colW-cw)/2, cmid=j=>L+j*colW+colW/2;

    /* ---------- BAND 0 · 範例分頁 + 哪一趟 ---------- */
    const tabF='700 11.5px '+SANS, tabH=20, tabY=6, tabG=6;
    const tws=KEYS.map(k=>tw(EX[k].tab,tabF)+22); let tx0=w-PAD-tws.reduce((a,b)=>a+b,0)-tabG*(KEYS.length-1);
    KEYS.forEach((e,ix)=>{
      const on=e===op.ex, tW=tws[ix];
      rr(tx0, tabY, tW, tabH, 10); ctx.fillStyle=on?C.ink:C.cell; ctx.fill();
      ctx.lineWidth=1.2; ctx.strokeStyle=on?C.ink:C.off; ctx.stroke();
      txt(EX[e].tab, tx0+tW/2, tabY+tabH/2+1, tabF, on?C.paper:C.dim, 'center', 'middle');
      tx0+=tW+tabG;
    });
    const pF='700 11.5px '+MONO;
    const P=[ {s:'LEFT →',  on:isL, done:isLd||isR||isSum, bg:C.tint},
              {s:'← RIGHT', on:isR, done:isSum, bg:C.tint2},
              {s:'Σ SUM',   on:isSum, done:false, bg:C.good} ];
    let px=PAD;
    P.forEach(p=>{
      const s=(p.done?'● ':'')+p.s, pw=tw(s,pF)+20;
      if(p.on) pill(px, tabY, pw, tabH, s, pF, p.bg, p.bg===C.good?C.goodT:C.ink, p.bg===C.good?C.goodT:C.ink, 2);
      else if(p.done) pill(px, tabY, pw, tabH, s, pF, C.cell, C.ink, C.ink, 1.2);
      else pill(px, tabY, pw, tabH, s, pF, C.cell, C.off, C.dim, 1.2);
      px+=pw+8;
    });

    /* ---------- BAND 1 · 地形 ---------- */
    const B1=50, base=180, maxH=96, minH=30, hy=198;
    const T1=fitText(['BAND 1 · ratings = '+arr(r)+' 當地形(柱高只看大小)   紅 = 目前 i   紅虛線 = 比較的鄰居   箭頭 = 往上爬',
                      'BAND 1 · ratings = '+arr(r)+' 當地形   紅 = 目前 i   紅虛線 = 比較的鄰居   箭頭 = 往上爬',
                      'BAND 1 · ratings 地形   紅 = 目前 i   紅虛線 = 比較的鄰居   箭頭 = 往上爬'], w-2*PAD, '600', [11.5,11,10.5], MONO);
    txt(T1.s, PAD, B1, T1.f, C.dim);
    txt('地形', tagX, (base-maxH+base)/2-7, '700 12.5px '+SANS, C.ink, 'center', 'middle');
    txt('ratings', tagX, (base-maxH+base)/2+10, '600 10.5px '+MONO, C.dim, 'center', 'middle');
    txt('i', tagX, hy+1, '700 12.5px '+MONO, C.ink, 'center', 'middle');
    const bW=Math.min(cw*0.72, 58);
    const barH=j=> ex.nr>1 ? minH+ex.rank[j]/(ex.nr-1)*(maxH-minH) : (minH+maxH)/2;
    const topY=j=> base-barH(j);
    // 山脊線
    ctx.beginPath(); for(let j=0;j<n;j++){ const x=cmid(j), y=topY(j); if(j) ctx.lineTo(x,y); else ctx.moveTo(x,y); }
    ctx.lineWidth=1.2; ctx.strokeStyle=C.off; ctx.setLineDash([3,3]); ctx.stroke(); ctx.setLineDash([]);
    line(L-4, base, R+4, base, C.dim, 1.2);
    for(let j=0;j<n;j++){
      const x=cmid(j)-bW/2, y=topY(j), bh=barH(j);
      let st={bg:C.cell, bd:C.ink, tx:C.ink, lw:1.4, rad:4};
      if(isSum) st={bg:C.cell, bd:C.goodT, tx:C.ink, lw:1.4, rad:4};
      if(nbr.has(j)) st={bg:C.cell, bd:C.red2, tx:C.red2, lw:2, rad:4, dash:true};
      if(act.has(j)) st={bg:C.redBg, bd:C.red, tx:C.redT, lw:2.4, rad:4};
      box(x, y, bW, bh, st);
      const vs=String(r[j]);
      txt(vs, cmid(j), y+14, fitFont(vs, bW-6, '700', [15,14,13,12], MONO), st.tx, 'center', 'middle');
      // i 表頭
      let hc=C.dim, hf='600 12px '+MONO;
      if(act.has(j)){ hc=C.redT; hf='700 12px '+MONO; } else if(nbr.has(j)){ hc=C.red2; hf='700 12px '+MONO; }
      const hs=colW>=52?'i = '+j:String(j);
      txt(hs, cmid(j), hy+1, hf, hc, 'center', 'middle');
    }
    // 比較箭頭:從鄰居的山頂指向 i(上坡紅實線,不是上坡灰虛線)
    op.cmp.forEach(q=>{
      const x1=cmid(q.j)+(q.i>q.j?bW/2-4:-(bW/2-4)), x2=cmid(q.i)-(q.i>q.j?bW/2-4:-(bW/2-4));
      const y1=topY(q.j)-7, y2=topY(q.i)-7;
      if(q.up) arrow(x1,y1,x2,y2,C.red,2.4);
      else arrow(x1,y1,x2,y2,C.dim,1.6,[4,3]);
    });

    /* ---------- BAND 2 · 左掃後 / c ---------- */
    const ch=38, yS=222, yC=300;
    const rowsY=[yS,yC];
    txt('左掃後', tagX, yS+ch/2-7, '700 12.5px '+SANS, C.ink, 'center', 'middle');
    txt(op.left?'已凍結':(isL?'跟著填':'快照'), tagX, yS+ch/2+11, '600 10.5px '+SANS, isLd?C.goodT:C.dim, 'center', 'middle');
    txt('c', tagX, yC+ch/2-7, '700 15px '+MONO, C.ink, 'center', 'middle');
    txt('目前', tagX, yC+ch/2+11, '600 10.5px '+SANS, C.dim, 'center', 'middle');
    const vF='700 17px '+MONO;
    // 快照列:左掃時跟著填(i 走過的格子),左掃完成後凍結
    const snapUpTo = op.left ? n-1 : (isL ? lo : -1);
    const snapVals = op.left || op.c;
    for(let j=0;j<n;j++){
      const x=cx(j);
      if(j>snapUpTo){ box(x, yS, cw, ch, {bg:C.cell, bd:C.off, lw:1.1, dash:true}); continue; }
      let st={bg:C.tint, bd:C.ink, tx:C.ink, lw:isLd?2:1.4};
      if(isL && act.has(j)) st={bg:C.tint, bd:C.red, tx:C.redT, lw:2.4};
      const used = isR && single && single.up && single.i===j;      // max 的第一個參數
      if(used) st={bg:C.tint, bd:C.red, tx:C.redT, lw:2.4};
      box(x, yS, cw, ch, st);
      txt(String(snapVals[j]), x+cw/2, yS+ch/2+1, vF, st.tx, 'center', 'middle');
    }
    // c 列
    for(let j=0;j<n;j++){
      const x=cx(j), v=op.c[j];
      let st={bg:C.cell, bd:C.ink, tx:C.ink, lw:1.4};
      if(isL||isLd){ if(j<=lo||isLd) st.bg=C.tint; }
      else if(isR){ st.bg = j>=ro ? C.tint2 : C.tint; }
      else if(isSum){ st={bg:C.good, bd:C.goodT, tx:C.goodT, lw:2}; }
      if(nbr.has(j)) st={bg:st.bg, bd:C.red2, tx:C.red2, lw:2, dash:true};
      if(act.has(j)) st={bg:C.redBg, bd:C.red, tx:C.redT, lw:2.6};
      box(x, yC, cw, ch, st);
      const old = op.before ? op.before[j] : v;
      const s = (act.has(j) && old!==v) ? old+' → '+v : String(v);
      txt(s, x+cw/2, yC+ch/2+1, fitFont(s, cw-8, '700', [17,15,14,13,12], MONO), st.tx, 'center', 'middle');
    }

    /* ---------- BAND 3 · 本步計算 + Σ ---------- */
    const B3=362, cy=374, chh=36;
    const t3='BAND 3 · 本步計算   c 列:藍 = 左掃走過   米黃 = 右掃走過   綠 = 最終答案';
    txt(t3, PAD, B3, fitFont(t3, w-2*PAD, '600', [11.5,11,10.5,10,9.5], MONO), C.dim);
    txt('計算', tagX, cy+chh/2+1, '700 12px '+SANS, C.ink, 'center', 'middle');
    const sum=op.c.reduce((a,b)=>a+b,0);
    const chipW=Math.max(104, Math.min(150, (R-L)*0.22)), chipX=R-chipW, boxR=chipX-14;
    let cl, cbg=C.cell, cbd=C.ink, ctx2=C.ink, clw=1.2, chip='Σ c = '+sum, kbg=C.cell, kbd=C.ink, ktx=C.ink, klw=1.2;
    const rel = q => q.up ? ' > ' : (q.eq ? ' = ' : ' ≤ ');
    if(isInit){ cl=['c = '+arr(op.c)+' · 每人先 1 顆(山谷最少 1)', 'c = '+arr(op.c)+' · 每人先 1 顆']; cbg=C.cell; }
    else if(isLd){ cl=['左掃完成 → 快照 = '+arr(op.left)+' · 接著從 i = '+(n-2)+' 往左', '快照 = '+arr(op.left)+' · 換右掃']; cbg=C.tint; clw=1.6; }
    else if(isSum){ cl=['Σ c = '+ex.fin.join(' + ')+' = '+ex.sum, 'Σ = '+ex.sum]; cbg=C.good; cbd=C.goodT; ctx2=C.goodT; clw=2.2; chip='return '+ex.sum; kbg=C.good; kbd=C.goodT; ktx=C.goodT; klw=2.4; }
    else if(single){
      const q=single, i=q.i, j=q.j;
      if(isL && q.up){ cl=['→ i = '+i+' · '+r[i]+' > '+r[j]+' 上坡 → c['+i+'] = c['+j+'] + 1 = '+q.nv, 'i = '+i+' · '+r[i]+' > '+r[j]+' → c['+i+'] = '+q.nb+' + 1 = '+q.nv]; }
      else if(isL){ cl=['→ i = '+i+' · '+r[i]+rel(q)+r[j]+(q.eq?' 一樣高不算上坡':' 不是上坡')+' → c['+i+'] 保持 '+q.nv, 'i = '+i+' · '+r[i]+rel(q)+r[j]+' → c['+i+'] 保持 '+q.nv]; }
      else if(q.up){ cl=['← i = '+i+' · '+r[i]+' > '+r[j]+' 上坡 → c['+i+'] = max('+q.old+', '+q.nb+' + 1) = '+q.nv, 'i = '+i+' · '+r[i]+' > '+r[j]+' → max('+q.old+', '+q.nb+' + 1) = '+q.nv, 'max('+q.old+', '+q.nb+' + 1) = '+q.nv]; }
      else { cl=['← i = '+i+' · '+r[i]+rel(q)+r[j]+(q.eq?' 一樣高不算上坡':' 不是上坡')+' → c['+i+'] 保持 '+q.nv, 'i = '+i+' · '+r[i]+rel(q)+r[j]+' → c['+i+'] 保持 '+q.nv]; }
      if(q.up){ cbg=C.redBg; cbd=C.red; ctx2=C.redT; clw=2; if(q.nv!==q.old){ kbg=C.redBg; kbd=C.red; ktx=C.redT; klw=2; } }
      else { cbg=isL?C.tint:C.tint2; clw=1.6; }
    } else {
      const idx=op.is.join(', '), ps=op.cmp.map(q=>r[q.i]+rel(q)+r[q.j]).join(' · ');
      cl=[(isL?'→ ':'← ')+'i = '+idx+' · '+ps+' → 都保持', 'i = '+idx+' · 都不是上坡 → 保持'];
      cbg=isL?C.tint:C.tint2; clw=1.6;
    }
    rr(L, cy, boxR-L, chh, 6); ctx.fillStyle=cbg; ctx.fill(); ctx.lineWidth=clw; ctx.strokeStyle=cbd; ctx.stroke();
    const CL=fitText(Array.isArray(cl)?cl:[cl], boxR-L-24, '700', [13,12.5,12,11.5,11], MONO);
    txt(CL.s, L+12, cy+chh/2+1, CL.f, ctx2, 'left', 'middle');
    rr(chipX, cy, chipW, chh, 18); ctx.fillStyle=kbg; ctx.fill(); ctx.lineWidth=klw; ctx.strokeStyle=kbd; ctx.stroke();
    txt(chip, chipX+chipW/2, cy+chh/2+1, fitFont(chip, chipW-16, '700', [14,13,12,11], MONO), ktx, 'center', 'middle');
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
