/* ============================================================
   P705 · Design HashSet — 直接定址表 · viz
   key 的範圍有界(0..10^6)→ 直接開一個 bool 陣列,用 key 當索引:
     add(k)      → mp[k] = true
     remove(k)   → mp[k] = false
     contains(k) → 回 mp[k]
   完全不用雜湊函式、不會碰撞 —— 因為每個 key 都有專屬格子。
   代價:陣列要開到 key 的最大值(10^6),即使只呼叫 10^4 次也照開。
     BAND 1  bool 陣列(只畫 0..9 當示意 · 綠=true · 灰=false)
     BAND 2  本步操作:key 直接對到 mp[key]
     BAND 3  取捨:O(1) 快,但空間 = key 上限
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

  const N = 10;   // 只畫前 10 格示意
  // 每步:陣列狀態、操作、目標 key、結果
  const steps = [
    { arr:Array(N).fill(false), op:'intro', key:-1,
      text:'<strong>INITIAL</strong> · key 範圍有界(<code>0..10⁶</code>),所以直接開一個 <code>bool</code> 陣列 <code>mp</code>,<strong>用 key 本身當索引</strong>。<code>mp[k]</code> = 「k 在不在集合裡」。(下方只畫 0..9 示意)' },
    { arr:setAt(N,4,true), op:'add', key:4, ret:null,
      text:'<strong>add(4)</strong> · 直接 <code>mp[4] = true</code>。key <strong>就是</strong>索引,一步到位,不用算雜湊、不會撞到別人。' },
    { arr:setAt(N,4,true), op:'contains', key:4, ret:true,
      text:'<strong>contains(4)</strong> · 直接讀 <code>mp[4]</code> = <strong>true</strong>。<code>O(1)</code>。' },
    { arr:setBoth(N,4,7,true), op:'add', key:7, ret:null,
      text:'<strong>add(7)</strong> · <code>mp[7] = true</code>。每個 key 有<strong>專屬格子</strong>,4 和 7 互不干擾 —— 直接定址<strong>永遠不會碰撞</strong>。' },
    { arr:setBoth(N,4,7,true), op:'contains', key:3, ret:false,
      text:'<strong>contains(3)</strong> · 讀 <code>mp[3]</code> = <strong>false</strong>(從沒 add 過)→ 不在集合裡。' },
    { arr:setAt(N,7,true), op:'remove', key:4, ret:null, done:true,
      text:'<strong>remove(4)</strong> · <code>mp[4] = false</code>。全部操作都是 <code>O(1)</code>。<strong>代價</strong>:陣列得開到 key 上限 <code>10⁶</code>,即使只呼叫 <code>10⁴</code> 次也照開(空間換時間 + 免雜湊)。' },
  ];

  function setAt(n,idx,v){ const a=Array(n).fill(false); if(idx<n)a[idx]=v; return a; }
  function setBoth(n,i,j,v){ const a=Array(n).fill(false); if(i<n)a[i]=v; if(j<n)a[j]=v; return a; }

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

    // ── BAND 1 · bool array ──
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · mp(bool 陣列 · 綠=true 在集合 · 灰=false)', PAD, 24);

    const cell=Math.min(58,(w-2*PAD)/(N+0.3)), gx=(w-N*cell)/2, gy=66, chh=40;
    for(let k=0;k<N;k++){
      const x=gx+k*cell;
      const on=s.arr[k];
      const isCur=(k===s.key);
      ctx.fillStyle=isCur?COLOR.curT:COLOR.dim; ctx.font='700 11px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('['+k+']', x+cell/2, gy-12);
      rr(x+3,gy,cell-6,chh,6);
      let bg=on?COLOR.done:COLOR.off, bd=on?COLOR.doneS:COLOR.offS, tc=on?COLOR.doneT:COLOR.offT;
      if(isCur){ bd=COLOR.curS; ctx.lineWidth=3; } else ctx.lineWidth=1.6;
      ctx.fillStyle=bg; ctx.fill(); ctx.strokeStyle=isCur?COLOR.curS:bd; ctx.stroke();
      ctx.fillStyle=tc; ctx.font='700 13px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(on?'T':'F', x+cell/2, gy+chh/2);
    }
    // pointer to current key
    if(s.key>=0 && s.key<N){ const kx=gx+s.key*cell+cell/2; tri(kx, gy+chh+16, 'up', 6, COLOR.curS);
      ctx.fillStyle=COLOR.curT; ctx.font='700 10px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='top'; ctx.fillText('key='+s.key, kx, gy+chh+22); }

    // ── BAND 2 · operation ──
    const by=150;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · key 直接對到 mp[key](無雜湊、零碰撞)', PAD, by);
    rr(PAD,by+10,w-PAD*2,42,6); ctx.fillStyle='#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.font='700 14px "JetBrains Mono", monospace';
    if(s.op==='intro'){ ctx.fillStyle=COLOR.text; ctx.font='600 12.5px "Noto Sans TC", sans-serif'; ctx.fillText('add / remove / contains 全都是「一次陣列存取」', w/2, by+31); }
    else if(s.op==='add'){ ctx.fillStyle=COLOR.doneT; ctx.fillText('add('+s.key+') → mp['+s.key+'] = true', w/2, by+31); }
    else if(s.op==='remove'){ ctx.fillStyle=COLOR.text; ctx.fillText('remove('+s.key+') → mp['+s.key+'] = false', w/2, by+31); }
    else if(s.op==='contains'){ ctx.fillStyle=s.ret?COLOR.doneT:COLOR.curT; ctx.fillText('contains('+s.key+') → mp['+s.key+'] = '+(s.ret?'true':'false'), w/2, by+31); }

    // ── BAND 3 · trade-off ──
    const ty=216;
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · 取捨:直接定址 vs 真正的雜湊', PAD, ty);
    rr(PAD,ty+10,w-PAD*2,42,6); ctx.fillStyle=done?COLOR.done:'#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=done?COLOR.doneS:COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(done){ ctx.fillStyle=COLOR.doneT; ctx.font='700 12px "Noto Sans TC", sans-serif'; ctx.fillText('直接定址:O(1) 且零碰撞,但空間 = key 上限(10⁶),只在 key 有界時可行', w/2, ty+31); }
    else { ctx.fillStyle=COLOR.text; ctx.font='600 12.5px "Noto Sans TC", sans-serif'; ctx.fillText('key 無界時開不了這麼大 → 改用雜湊函式 + 桶(見下一頁)', w/2, ty+31); }
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
