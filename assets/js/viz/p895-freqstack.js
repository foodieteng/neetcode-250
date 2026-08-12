/* ============================================================
   P895 · Maximum Frequency Stack — 頻率分層堆疊 · viz
   freq[val] 記出現次數;bucket[f] 是「達到頻率 f 的值」依序疊的堆疊。
   push(v):freq[v]++,把 v 疊進 bucket[freq[v]]。
   pop():取最高頻率那層 bucket 的頂端(最近達到該頻率者),freq 該值 --。
   例 push 5,7,5,7,4,5 → pop 得 5、再 pop 得 7。
     BAND 1  頻率分層 bucket(上=最高頻率層,pop 從這裡 · 右=top)
     BAND 2  freq 表(val : 次數)
     BAND 3  本步動作 / 剛 pop 的值
   ============================================================ */
(function () {
  const canvas = document.getElementById('viz-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('viz-step'), labelEl = document.getElementById('viz-label');
  const bPrev = document.getElementById('viz-prev'), bNext = document.getElementById('viz-next'),
        bPlay = document.getElementById('viz-play'), bReset = document.getElementById('viz-reset');
  const C = { paper:'#ffffff', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf', cell:'#fafaf6', cellS:'#cfcfcf',
    src:'#dbe8f6', srcS:'#4478c0', srcT:'#2f5f9e', grn:'#d9e8c7', grnS:'#5fa866', grnT:'#3f7a3a',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424', off:'#eceae2', offS:'#c9c6ba', offT:'#8a8672',
    coral:'#cf3535', amb:'#e0b37a', ambT:'#9a6a1f' };

  // buckets: {f:[vals]}, freq: {val:count}, act, popped, hiF (freq level acted on)
  const steps = [
    { buckets:{}, freq:{}, act:'intro', popped:null, hiF:0, text:'<strong>INITIAL</strong> · <code>freq[v]</code>=出現次數;<code>bucket[f]</code>=達到頻率 f 的值堆疊。pop 取<strong>最高頻率層</strong>的頂端。' },
    { buckets:{1:[5]}, freq:{5:1}, act:'push', popped:null, hiF:1, text:'<strong>push(5)</strong> · freq[5]=1 → 疊進 bucket[1]。' },
    { buckets:{1:[5,7]}, freq:{5:1,7:1}, act:'push', popped:null, hiF:1, text:'<strong>push(7)</strong> · freq[7]=1 → bucket[1]=[5,7]。' },
    { buckets:{1:[5,7],2:[5]}, freq:{5:2,7:1}, act:'push', popped:null, hiF:2, text:'<strong>push(5)</strong> · freq[5]=2 → 疊進 bucket[2]。5 同時存在於第 1、2 層。' },
    { buckets:{1:[5,7],2:[5,7]}, freq:{5:2,7:2}, act:'push', popped:null, hiF:2, text:'<strong>push(7)</strong> · freq[7]=2 → bucket[2]=[5,7]。' },
    { buckets:{1:[5,7,4],2:[5,7]}, freq:{5:2,7:2,4:1}, act:'push', popped:null, hiF:1, text:'<strong>push(4)</strong> · freq[4]=1 → bucket[1]=[5,7,4]。' },
    { buckets:{1:[5,7,4],2:[5,7],3:[5]}, freq:{5:3,7:2,4:1}, act:'push', popped:null, hiF:3, text:'<strong>push(5)</strong> · freq[5]=3 → 開出 bucket[3]=[5]。最高頻率層 = 3。' },
    { buckets:{1:[5,7,4],2:[5,7]}, freq:{5:2,7:2,4:1}, act:'pop', popped:5, hiF:3, text:'<strong>pop() → 5</strong> · 最高層 bucket[3] 頂端 = 5。取出、freq[5]→2;bucket[3] 空了移除。' },
    { buckets:{1:[5,7,4],2:[5]}, freq:{5:2,7:1,4:1}, act:'pop', popped:7, hiF:2, text:'<strong>pop() → 7</strong> · 現在最高層 = bucket[2],頂端 = <strong>7</strong>(比 5 晚達到頻率 2)。freq[7]→1。' },
    { buckets:{1:[5,7,4],2:[5]}, freq:{5:2,7:1,4:1}, act:'done', popped:null, hiF:2, text:'<strong>重點</strong> · 同頻率時 pop <strong>最近</strong>達到者(bucket 頂端);push/pop 皆攤還 O(1)。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,PAD=30; const done=s.act==='done';
    ctx.fillStyle=C.paper; ctx.fillRect(0,0,w,canvas.clientHeight); ctx.setLineDash([]);
    // ── BAND 1 · frequency buckets (highest freq on top) ──
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · 頻率分層 bucket(上=最高頻率層,pop 從這 · 右=top)', PAD, 16);
    const levels = Object.keys(s.buckets).map(Number).sort((a,b)=>b-a);   // desc: highest first
    const maxF = levels.length ? levels[0] : 0;
    const rowH=32, x0=PAD+52, cw=40, cg=10, top0=32;
    if(levels.length===0){ ctx.fillStyle=C.offT; ctx.font='600 13px "Noto Sans TC", sans-serif'; ctx.textBaseline='middle'; ctx.fillText('(空)', PAD+52, top0+16); }
    for(let r=0;r<levels.length;r++){
      const f=levels[r], vals=s.buckets[f], ry=top0+r*rowH;
      const isHi=f===maxF;
      // row highlight for the pop-source level
      if(isHi){ rr(PAD, ry-3, w-PAD*2, rowH-4, 6); ctx.fillStyle='#f6f8ee'; ctx.fill(); ctx.strokeStyle=C.grnS; ctx.lineWidth=1.4; ctx.stroke(); }
      // label f=k
      ctx.fillStyle=isHi?C.grnT:C.dim; ctx.font='700 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='middle';
      ctx.fillText('f='+f, PAD+6, ry+ (rowH-4)/2);
      let cx=x0;
      for(let k=0;k<vals.length;k++){
        const isTop=k===vals.length-1;
        rr(cx,ry,cw,rowH-8,6); ctx.fillStyle=isTop?(isHi?C.grn:'#eef4fb'):C.src; ctx.fill();
        ctx.lineWidth=isTop?2.6:1.6; ctx.strokeStyle=isTop?(isHi?C.grnS:C.srcS):C.srcS; ctx.stroke();
        ctx.fillStyle=isTop&&isHi?C.grnT:C.srcT; ctx.font='700 15px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(String(vals[k]), cx+cw/2, ry+(rowH-8)/2);
        cx+=cw+cg;
      }
      if(isHi){ ctx.fillStyle=C.grnT; ctx.font='700 10px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText('← pop 頂端', cx+4, ry+(rowH-8)/2); }
    }

    // ── BAND 2 · freq map ──
    const b2y = top0 + Math.max(1,levels.length)*rowH + 12;
    ctx.fillStyle=C.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · freq 表(val : 次數)', PAD, b2y);
    let fx=PAD+4; const fy=b2y+12;
    const fkeys=Object.keys(s.freq).map(Number).sort((a,b)=>a-b);
    if(fkeys.length===0){ ctx.fillStyle=C.offT; ctx.font='600 12px "Noto Sans TC", sans-serif'; ctx.textBaseline='top'; ctx.fillText('(空)', fx, fy+4); }
    for(const v of fkeys){
      const label=v+':'+s.freq[v]; ctx.font='700 13px "JetBrains Mono", monospace';
      const cwF=ctx.measureText(label).width+18;
      rr(fx,fy,cwF,26,13); ctx.fillStyle='#faf0dd'; ctx.fill(); ctx.lineWidth=1.4; ctx.strokeStyle=C.amb; ctx.stroke();
      ctx.fillStyle=C.ambT; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(label, fx+cwF/2, fy+13);
      fx+=cwF+10;
    }

    // ── BAND 3 ──
    const by=b2y+52;
    ctx.fillStyle=C.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · push:freq++、疊進 bucket[freq];pop:取最高層頂端、freq--', PAD, by);
    rr(PAD,by+10,w-PAD*2,40,6); ctx.fillStyle=done?C.grn:(s.act==='pop'?C.grn:'#fafaf6'); ctx.fill(); ctx.lineWidth=1.6;
    ctx.strokeStyle=done?C.grnS:(s.act==='pop'?C.grnS:C.grid); ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='600 12.5px "Noto Sans TC", sans-serif';
    let msg,col=C.text;
    if(s.act==='intro'){ msg='同一個值會同時待在第 1、2、…層,層越高代表越頻繁'; }
    else if(done){ msg='bucket 頂端天然是「同頻率中最近的」→ 一次搞定兩個 pop 規則'; col=C.grnT; }
    else if(s.act==='pop'){ msg='取最高頻率層的頂端 = 最頻繁且最近 → 回傳 '+s.popped; col=C.grnT; }
    else { msg='push:先 freq++,再把值疊到「新的頻率層」bucket 頂端'; col=C.srcT; }
    ctx.fillStyle=col; ctx.fillText(msg, w/2, by+30);
  }

  function update(){ if(stepEl) stepEl.textContent=String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0'); if(labelEl) labelEl.innerHTML=steps[step].text; draw(); }
  function next(){ if(step<steps.length-1){step++;update();}else stop(); }
  function prev(){ if(step>0){step--;update();} }
  function reset(){ stop(); step=0; update(); }
  function play(){ if(timer){stop();return;} bPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){stop();return;} next(); },1700); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} if(bPlay) bPlay.textContent='Play'; }
  bPrev&&bPrev.addEventListener('click',prev); bNext&&bNext.addEventListener('click',next); bPlay&&bPlay.addEventListener('click',play); bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();}); if(window.ResizeObserver){ new ResizeObserver(()=>{fit();draw();}).observe(canvas); }
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw); fit(); update();
})();
