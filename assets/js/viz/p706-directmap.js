/* ============================================================
   P706 · Design HashMap — 直接定址表(存 value + -1 哨兵)· viz
   和 705 幾乎一樣,只差:存的不是「在不在」而是「value」。
   key 有界(0..10^6)→ 開 int 陣列,mp[key] 存 value,-1 = 沒有映射。
     put(k,v)  → mp[k] = v
     get(k)    → 回 mp[k](可能是 -1 = 不存在)
     remove(k) → mp[k] = -1
   value 保證 ≥ 0,所以 -1 當「不存在」的哨兵安全。
     BAND 1  int 陣列(藍=有 value · 灰=-1 沒映射)
     BAND 2  本步操作
     BAND 3  哨兵 -1:因為 value ≥ 0 才能這樣用
   ============================================================ */
(function () {
  const canvas = document.getElementById('viz-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('viz-step'), labelEl = document.getElementById('viz-label');
  const bPrev = document.getElementById('viz-prev'), bNext = document.getElementById('viz-next'),
        bPlay = document.getElementById('viz-play'), bReset = document.getElementById('viz-reset');

  const COLOR = { paper:'#ffffff', ink:'#1a1a1a', dim:'#9a9a9a', text:'#1f3550', grid:'#cfcfcf',
    cell:'#fafaf6', cellS:'#cfcfcf', src:'#dbe8f6', srcS:'#4478c0', srcT:'#2f5f9e',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424', done:'#d9e8c7', doneS:'#5fa866', doneT:'#3f7a3a',
    off:'#f0f0ec', offS:'#deded8', offT:'#a8a8a0', coral:'#cf3535' };

  const N = 8;
  function base(){ return Array(N).fill(-1); }
  function withVals(pairs){ const a=base(); for(const [k,v] of pairs) if(k<N) a[k]=v; return a; }

  const steps = [
    { arr:base(), op:'intro', key:-1,
      text:'<strong>INITIAL</strong> · key 有界(<code>0..10⁶</code>)→ 開 <code>int</code> 陣列 <code>mp</code>,<strong>全部初始化為 -1</strong>(代表「沒有映射」)。<code>mp[k]</code> 存 key 的 value。' },
    { arr:withVals([[1,10]]), op:'put', key:1, val:10,
      text:'<strong>put(1, 10)</strong> · <code>mp[1] = 10</code>。key 直接當索引,value 存進去。' },
    { arr:withVals([[1,10],[3,20]]), op:'put', key:3, val:20,
      text:'<strong>put(3, 20)</strong> · <code>mp[3] = 20</code>。1 和 3 各有各的格子,零碰撞。' },
    { arr:withVals([[1,10],[3,20]]), op:'get', key:1, ret:10,
      text:'<strong>get(1)</strong> · 讀 <code>mp[1]</code> = <strong>10</strong>。<code>O(1)</code>。' },
    { arr:withVals([[1,10],[3,20]]), op:'get', key:5, ret:-1,
      text:'<strong>get(5)</strong> · 讀 <code>mp[5]</code> = <strong>-1</strong> → 代表 5 <strong>沒有映射</strong>(從沒 put 過)。' },
    { arr:withVals([[3,20]]), op:'remove', key:1, done:true,
      text:'<strong>remove(1)</strong> · <code>mp[1] = -1</code>(改回哨兵)。全部 <code>O(1)</code>。<strong>-1 當哨兵之所以安全,是因為題目保證 value ≥ 0</strong>,-1 不會和真實 value 混淆。' },
  ];

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function tri(cx,cy,dir,sz,col){ ctx.beginPath(); if(dir==='down'){ctx.moveTo(cx-sz,cy-sz);ctx.lineTo(cx+sz,cy-sz);ctx.lineTo(cx,cy+sz);}else{ctx.moveTo(cx-sz,cy+sz);ctx.lineTo(cx+sz,cy+sz);ctx.lineTo(cx,cy-sz);} ctx.closePath(); ctx.fillStyle=col; ctx.fill(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,h=canvas.clientHeight,PAD=26;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,h);
    const done=!!s.done;

    // ── BAND 1 · int array ──
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · mp(int 陣列 · 藍=有 value · 灰=-1 沒映射)', PAD, 24);

    const cell=Math.min(70,(w-2*PAD)/(N+0.3)), gx=(w-N*cell)/2, gy=66, chh=42;
    for(let k=0;k<N;k++){
      const x=gx+k*cell;
      const v=s.arr[k], has=(v!==-1);
      const isCur=(k===s.key);
      ctx.fillStyle=isCur?COLOR.curT:COLOR.dim; ctx.font='700 11px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('['+k+']', x+cell/2, gy-12);
      rr(x+3,gy,cell-6,chh,6);
      let bg=has?COLOR.src:COLOR.off, bd=has?COLOR.srcS:COLOR.offS, tc=has?COLOR.srcT:COLOR.offT;
      if(isCur){ bd=COLOR.curS; ctx.lineWidth=3; } else ctx.lineWidth=1.6;
      ctx.fillStyle=bg; ctx.fill(); ctx.strokeStyle=isCur?COLOR.curS:bd; ctx.stroke();
      ctx.fillStyle=tc; ctx.font='700 15px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(v), x+cell/2, gy+chh/2);
    }
    if(s.key>=0 && s.key<N){ const kx=gx+s.key*cell+cell/2; tri(kx, gy+chh+16, 'up', 6, COLOR.curS);
      ctx.fillStyle=COLOR.curT; ctx.font='700 10px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='top'; ctx.fillText('key='+s.key, kx, gy+chh+22); }

    // ── BAND 2 · operation ──
    const by=150;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · key 直接對到 mp[key],存 / 讀 value', PAD, by);
    rr(PAD,by+10,w-PAD*2,42,6); ctx.fillStyle='#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='700 14px "JetBrains Mono", monospace';
    if(s.op==='intro'){ ctx.fillStyle=COLOR.text; ctx.font='600 12.5px "Noto Sans TC", sans-serif'; ctx.fillText('和 705 一樣直接定址,只是每格存 value 而非 true/false', w/2, by+31); }
    else if(s.op==='put'){ ctx.fillStyle=COLOR.srcT; ctx.fillText('put('+s.key+', '+s.val+') → mp['+s.key+'] = '+s.val, w/2, by+31); }
    else if(s.op==='remove'){ ctx.fillStyle=COLOR.text; ctx.fillText('remove('+s.key+') → mp['+s.key+'] = -1', w/2, by+31); }
    else if(s.op==='get'){ ctx.fillStyle=s.ret===-1?COLOR.curT:COLOR.srcT; ctx.fillText('get('+s.key+') → mp['+s.key+'] = '+s.ret+(s.ret===-1?'(不存在)':''), w/2, by+31); }

    // ── BAND 3 · sentinel ──
    const ty=216;
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · -1 哨兵:因為 value ≥ 0 才能這樣用', PAD, ty);
    rr(PAD,ty+10,w-PAD*2,42,6); ctx.fillStyle=done?COLOR.done:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?COLOR.doneS:COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(done){ ctx.fillStyle=COLOR.doneT; ctx.font='700 12px "Noto Sans TC", sans-serif'; ctx.fillText('哨兵值必須落在合法 value 範圍外;value 可能是 -1 時要改用另一個 present 陣列', w/2, ty+31); }
    else { ctx.fillStyle=COLOR.text; ctx.font='600 12.5px "Noto Sans TC", sans-serif'; ctx.fillText('get 讀到 -1 = 沒映射;705 用 bool、706 用 int + 哨兵,其餘全同', w/2, ty+31); }
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
