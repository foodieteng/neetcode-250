/* ============================================================
   P49 · Group Anagrams — 排序後的字串當標準鍵 · viz
   兩字互為 anagram ⇔ 把字母排序後完全相同。
   所以「排序字串」就是 anagram 群的標準指紋(canonical key):
     對每個字 w,key = sorted(w),丟進 map[key] 這個桶。
   同桶的字必然互為 anagram;最後回傳所有桶。
   例 ["eat","tea","tan","ate","nat","bat"]:
     aet ← eat,tea,ate    ant ← tan,nat    abt ← bat   → 3 群。
     BAND 1  輸入字串(紅=當前)
     BAND 2  排序:w → sorted(w) = key
     BAND 3  桶(key → 該群字串);藍框=本步落入的桶
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
    grn:'#d9e8c7', grnS:'#5fa866', grnT:'#3f7a3a',
    cur:'#fbe1e1', curS:'#cf3535', curT:'#992424', done:'#d9e8c7', doneS:'#5fa866', doneT:'#3f7a3a',
    off:'#f0f0ec', offS:'#deded8', offT:'#a8a8a0', coral:'#cf3535' };

  const WORDS = ['eat','tea','tan','ate','nat','bat'];
  const sortKey = w => w.split('').sort().join('');
  // 預先算出每步的桶狀態(桶依「首次出現」順序排列)
  function bucketsAfter(k){
    const order=[], map={};
    for(let i=0;i<k;i++){ const key=sortKey(WORDS[i]); if(!(key in map)){ map[key]=[]; order.push(key);} map[key].push(WORDS[i]); }
    return order.map(key=>({key, words:map[key].slice()}));
  }
  const steps = [];
  steps.push({ idx:-1, phase:'intro', buckets:[], target:null,
    text:'<strong>INITIAL</strong> · anagram ⇔ 字母排序後相同。所以用 <strong><code>sorted(w)</code> 當標準鍵</strong>,把每個字丟進 <code>map[key]</code> 這個桶,同桶必為同群。' });
  for(let i=0;i<WORDS.length;i++){
    const key=sortKey(WORDS[i]);
    const before=bucketsAfter(i);
    const isNew=!before.some(b=>b.key===key);
    steps.push({ idx:i, word:WORDS[i], key, isNew, phase:(i===WORDS.length-1?'done':'run'),
      buckets:bucketsAfter(i+1), target:key,
      text:'<strong>'+WORDS[i]+'</strong> · 排序 → <code>'+key+'</code>。'+(isNew?'這是<strong>新的鍵</strong> → 開新桶 <code>'+key+'</code>,放入 '+WORDS[i]:'鍵 <code>'+key+'</code> 已存在 → 併入該桶')+(i===WORDS.length-1?'。掃完共 <strong>3 群</strong>。':'。')
    });
  }

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,PAD=26;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,canvas.clientHeight);
    const done=s.phase==='done';

    // ── BAND 1 · input words ──
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · strs(紅=當前 · 灰=已分組)', PAD, 20);
    const n=WORDS.length, cw=Math.min(88,(w-2*PAD)/n-6), gap=((w-2*PAD)-n*cw)/(n-1), gy=32, chh=30;
    for(let k=0;k<n;k++){
      const x=PAD+k*(cw+gap), isCur=(k===s.idx), passed=(s.idx>=0 && k<s.idx)||done;
      rr(x,gy,cw,chh,6);
      let bg=COLOR.cell,bd=COLOR.cellS,tc=COLOR.text;
      if(passed && !isCur){ bg=COLOR.off; bd=COLOR.offS; tc=COLOR.offT; }
      if(isCur && !done){ bg=COLOR.cur; bd=COLOR.curS; tc=COLOR.curT; }
      ctx.fillStyle=bg; ctx.fill(); ctx.lineWidth=(isCur&&!done)?3:1.6; ctx.strokeStyle=bd; ctx.stroke();
      ctx.fillStyle=tc; ctx.font='700 15px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('"'+WORDS[k]+'"', x+cw/2, gy+chh/2);
    }

    // ── BAND 2 · sort transform ──
    const by=80;
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 2 · key = sorted(w)', PAD, by);
    rr(PAD,by+10,w-PAD*2,40,6); ctx.fillStyle='#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(s.phase==='intro'){ ctx.fillStyle=COLOR.text; ctx.font='600 12.5px "Noto Sans TC", sans-serif';
      ctx.fillText('把字母排序,anagram 會塌縮成同一個標準字串 → 拿它當雜湊 key', w/2, by+30); }
    else { ctx.font='700 15px "JetBrains Mono", monospace'; ctx.fillStyle=COLOR.text;
      ctx.fillText('"'+s.word+'"', w/2-90, by+30);
      ctx.fillStyle=COLOR.dim; ctx.font='700 13px "JetBrains Mono", monospace'; ctx.fillText('— sort →', w/2, by+30);
      ctx.fillStyle=s.isNew?COLOR.grnT:COLOR.srcT; ctx.font='700 15px "JetBrains Mono", monospace';
      ctx.fillText('"'+s.key+'"'+(s.isNew?'  (新鍵)':'  (已存在)'), w/2+95, by+30);
    }

    // ── BAND 3 · buckets ──
    const ty=138;
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 3 · map: key → 該群字串(藍框=本步落入的桶)', PAD, ty);

    const nb=Math.max(1,s.buckets.length), gapb=16;
    const bw=(w-2*PAD-(3-1)*gapb)/3;  // 固定 3 欄寬,最多 3 桶
    const bx0=PAD, byy=ty+12, boxH=132;
    s.buckets.forEach((bk,i)=>{
      const x=bx0+i*(bw+gapb);
      const isTarget=(bk.key===s.target && s.phase!=='intro');
      rr(x,byy,bw,boxH,8);
      ctx.fillStyle=isTarget?COLOR.src:COLOR.cell; ctx.fill();
      ctx.lineWidth=isTarget?3:1.6; ctx.strokeStyle=isTarget?COLOR.srcS:COLOR.cellS; ctx.stroke();
      // key header
      ctx.fillStyle=isTarget?COLOR.srcT:COLOR.dim; ctx.font='700 13px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('key "'+bk.key+'"', x+bw/2, byy+18);
      ctx.strokeStyle=COLOR.grid; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(x+10,byy+32); ctx.lineTo(x+bw-10,byy+32); ctx.stroke();
      // words
      bk.words.forEach((wd,j)=>{
        const wy=byy+42+j*24;
        const justAdded=(isTarget && j===bk.words.length-1);
        rr(x+12,wy,bw-24,20,5);
        ctx.fillStyle=justAdded?COLOR.cur:COLOR.grn; ctx.fill();
        ctx.lineWidth=1.4; ctx.strokeStyle=justAdded?COLOR.curS:COLOR.grnS; ctx.stroke();
        ctx.fillStyle=justAdded?COLOR.curT:COLOR.grnT; ctx.font='700 12px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText('"'+wd+'"', x+bw/2, wy+10);
      });
    });
    if(s.phase==='intro'){
      ctx.fillStyle=COLOR.dim; ctx.font='600 12px "Noto Sans TC", sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('(還沒有桶 —— 掃描時逐一建立)', w/2, byy+boxH/2);
    }
  }

  function update(){ const s=steps[step]; if(stepEl) stepEl.textContent=String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0'); if(labelEl) labelEl.innerHTML=s.text; draw(); }
  function next(){ if(step<steps.length-1){step++;update();}else stop(); }
  function prev(){ if(step>0){step--;update();} }
  function reset(){ stop(); step=0; update(); }
  function play(){ if(timer){stop();return;} bPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){stop();return;} next(); },1700); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} if(bPlay) bPlay.textContent='Play'; }
  bPrev&&bPrev.addEventListener('click',prev); bNext&&bNext.addEventListener('click',next); bPlay&&bPlay.addEventListener('click',play); bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();}); if(window.ResizeObserver){ new ResizeObserver(()=>{fit();draw();}).observe(canvas); }
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw); fit(); update();
})();
