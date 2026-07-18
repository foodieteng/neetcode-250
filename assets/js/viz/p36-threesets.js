/* ============================================================
   P36 · Valid Sudoku — row / col / box 三組雜湊集合 · viz
   三條規則各自獨立:每列、每行、每個 3×3 宮都不能有重複數字。
   → 開三組集合:row[9]、col[9]、box[9]。掃每個已填格 (r,c):
       boxId = r/3*3 + c/3   (整數除法:r/3、c/3 各給 0..2 的帶,組成 0..8)
       若 digit 已在 row[r] / col[c] / box[boxId] 任一 → return false;
       否則三組都 insert。全部掃完沒撞 → valid。
   關鍵是 boxId 公式:把 (r,c) 映到它所屬的宮編號。
   例:(0,0)=5、(0,1)=3、(1,0)=6 都在宮 0;再填 (2,2)=5 → 宮 0 已有 5 → 撞!
     LEFT   9×9 盤(紅=當前格 · 藍=同列同行 · 粗框=當前宮)
     RIGHT  boxId 公式 + row/col/box 三組集合(紅=撞到的數)
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
    off:'#f2f2ee', offS:'#dcdcd6', offT:'#c0c0b8', coral:'#cf3535' };

  // 已填格(其餘為 '.')
  const FILLED = [ [0,0,'5'], [0,1,'3'], [1,0,'6'], [2,2,'5'] ];
  function boardAt(k){ // 前 k 個格已填
    const b = Array.from({length:9},()=>Array(9).fill('.'));
    for(let i=0;i<k;i++){ const [r,c,d]=FILLED[i]; b[r][c]=d; }
    return b;
  }
  const boxId=(r,c)=>((r/3|0)*3+(c/3|0));

  // 建立步驟:intro + 每個填格一步
  const steps=[];
  steps.push({ k:0, cell:null, phase:'intro',
    text:'<strong>INITIAL</strong> · 三條規則各自獨立 → 開三組集合 <code>row[9]</code>、<code>col[9]</code>、<code>box[9]</code>。宮編號 <code>boxId = r/3*3 + c/3</code>。' });
  // 逐格模擬並記錄集合狀態
  const rowSet=Array.from({length:9},()=>new Set());
  const colSet=Array.from({length:9},()=>new Set());
  const boxSet=Array.from({length:9},()=>new Set());
  for(let i=0;i<FILLED.length;i++){
    const [r,c,d]=FILLED[i]; const bid=boxId(r,c);
    const collide = rowSet[r].has(d)||colSet[c].has(d)||boxSet[bid].has(d);
    const whichRow=rowSet[r].has(d), whichCol=colSet[c].has(d), whichBox=boxSet[bid].has(d);
    // snapshot 集合(插入前的狀態,查詢時看的是這個)
    const snap = { row:[...rowSet[r]], col:[...colSet[c]], box:[...boxSet[bid]] };
    if(!collide){ rowSet[r].add(d); colSet[c].add(d); boxSet[bid].add(d); }
    steps.push({ k:i+1, cell:[r,c], digit:d, bid, collide, whichRow, whichCol, whichBox, snap,
      phase: collide?'fail':(i===FILLED.length-1?'done':'ok'),
      text: collide
        ? '<strong>('+r+','+c+')='+d+'</strong> · boxId = '+r+'/3*3 + '+c+'/3 = <strong>'+bid+'</strong>。查 box['+bid+'] 已有 <strong>'+d+'</strong>(來自 (0,0))→ <strong>重複!return false</strong>。'
        : '<strong>('+r+','+c+')='+d+'</strong> · boxId = '+r+'/3*3 + '+c+'/3 = <strong>'+bid+'</strong>。row['+r+']、col['+c+']、box['+bid+'] 都沒有 '+d+' → 三組都 insert。'
    });
  }

  let step = 0, timer = null;
  function fit(){ const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3); const rc=canvas.getBoundingClientRect();
    const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||400; const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;} ctx.setTransform(dpr,0,0,dpr,0,0); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function chipRow(x,y,maxW,label,arr,digit,hit){
    ctx.fillStyle=COLOR.dim; ctx.font='700 11px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='middle';
    ctx.fillText(label, x, y);
    let cx=x+64, sz=22, gap=6;
    for(const d of arr){
      const isHit=(hit && d===digit);
      rr(cx,y-sz/2,sz,sz,5); ctx.fillStyle=isHit?COLOR.cur:COLOR.src; ctx.fill();
      ctx.lineWidth=isHit?2.5:1.4; ctx.strokeStyle=isHit?COLOR.curS:COLOR.srcS; ctx.stroke();
      ctx.fillStyle=isHit?COLOR.curT:COLOR.srcT; ctx.font='700 12px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(d, cx+sz/2, y); cx+=sz+gap;
    }
    if(arr.length===0){ ctx.fillStyle=COLOR.dim; ctx.font='600 11px "Noto Sans TC", sans-serif'; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText('(空)', cx, y); cx+=34; }
    // 顯示正在加入的數(未撞時)
    return cx;
  }

  function draw(){
    fit(); const s=steps[step]; const w=canvas.clientWidth,H=canvas.clientHeight,PAD=22;
    ctx.fillStyle=COLOR.paper; ctx.fillRect(0,0,w,H);
    const board=boardAt(s.k);
    const cur=s.cell;

    // ── LEFT · 9x9 grid ──
    ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('9×9 盤 · 紅=當前 · 藍=同列/行 · 粗框=當前宮', PAD, 18);
    const gsz=Math.min(26, (Math.min(w*0.42, H-60))/9), gx=PAD, gy=30;
    for(let r=0;r<9;r++)for(let c=0;c<9;c++){
      const x=gx+c*gsz, y=gy+r*gsz;
      const sameRC = cur && (r===cur[0] || c===cur[1]);
      const sameBox = cur && boxId(r,c)===s.bid;
      const isCur = cur && r===cur[0] && c===cur[1];
      let bg=COLOR.cell;
      if(sameBox) bg='#eef4ec';
      if(sameRC) bg=COLOR.src;
      if(isCur) bg=(s.phase==='fail')?COLOR.cur:COLOR.grn;
      ctx.fillStyle=bg; ctx.fillRect(x,y,gsz,gsz);
      ctx.lineWidth=1; ctx.strokeStyle=COLOR.grid; ctx.strokeRect(x,y,gsz,gsz);
      const ch=board[r][c];
      if(ch!=='.'){ ctx.fillStyle=isCur?((s.phase==='fail')?COLOR.curT:COLOR.grnT):COLOR.text; ctx.font='700 13px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(ch, x+gsz/2, y+gsz/2); }
      else { ctx.fillStyle=COLOR.offT; ctx.font='600 10px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('·', x+gsz/2, y+gsz/2); }
    }
    // 3x3 宮的粗線
    ctx.strokeStyle=COLOR.text; ctx.lineWidth=2;
    for(let i=0;i<=9;i+=3){ ctx.beginPath(); ctx.moveTo(gx+i*gsz,gy); ctx.lineTo(gx+i*gsz,gy+9*gsz); ctx.stroke(); ctx.beginPath(); ctx.moveTo(gx,gy+i*gsz); ctx.lineTo(gx+9*gsz,gy+i*gsz); ctx.stroke(); }
    // 當前宮加粗高亮框
    if(cur){ const br=(cur[0]/3|0)*3, bc=(cur[1]/3|0)*3; ctx.strokeStyle=COLOR.grnS; ctx.lineWidth=3; ctx.strokeRect(gx+bc*gsz, gy+br*gsz, 3*gsz, 3*gsz); }

    // ── RIGHT · formula + sets ──
    const rx=gx+9*gsz+28, rw=w-PAD-rx;
    // boxId formula
    ctx.fillStyle=COLOR.coral; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText('boxId = r/3 * 3 + c/3', rx, 30);
    rr(rx,40,rw,38,7); ctx.fillStyle='#fafaf6'; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=COLOR.grid; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(s.phase==='intro'){ ctx.fillStyle=COLOR.text; ctx.font='600 12px "Noto Sans TC", sans-serif'; ctx.fillText('r/3、c/3 各是 0/1/2 的「帶」,組成 0..8 的宮編號', rx+rw/2, 59); }
    else { ctx.fillStyle=COLOR.text; ctx.font='700 15px "JetBrains Mono", monospace';
      ctx.fillText(cur[0]+'/3*3 + '+cur[1]+'/3 = '+((cur[0]/3|0)*3)+' + '+((cur[1]/3|0))+' = '+s.bid, rx+rw/2, 59); }

    // three sets
    if(s.phase!=='intro'){
      const baseY=108;
      ctx.fillStyle=COLOR.dim; ctx.font='600 12px "JetBrains Mono", monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
      ctx.fillText('查三組集合(插入前的狀態)· digit = '+s.digit, rx, baseY-10);
      chipRow(rx, baseY+16, rw, 'row['+cur[0]+']', s.snap.row, s.digit, s.whichRow);
      chipRow(rx, baseY+48, rw, 'col['+cur[1]+']', s.snap.col, s.digit, s.whichCol);
      chipRow(rx, baseY+80, rw, 'box['+s.bid+']', s.snap.box, s.digit, s.whichBox);

      // status
      rr(rx, baseY+104, rw, 40, 7);
      const fail=s.phase==='fail';
      ctx.fillStyle=fail?COLOR.cur:COLOR.done; ctx.fill(); ctx.lineWidth=2; ctx.strokeStyle=fail?COLOR.curS:COLOR.doneS; ctx.stroke();
      ctx.fillStyle=fail?COLOR.curT:COLOR.doneT; ctx.font='700 13px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(fail?('box['+s.bid+'] 已有 '+s.digit+' → return false'):('無重複 → 三組 insert '+s.digit), rx+rw/2, baseY+124);
    } else {
      ctx.fillStyle=COLOR.dim; ctx.font='600 12.5px "Noto Sans TC", sans-serif'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
      ctx.fillText('每個已填格:算 boxId,查 row/col/box', rx, 108);
      ctx.fillText('三組都沒這個數才 insert;任一有 → 立刻 false', rx, 130);
    }
  }

  function update(){ const s=steps[step]; if(stepEl) stepEl.textContent=String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0'); if(labelEl) labelEl.innerHTML=s.text; draw(); }
  function next(){ if(step<steps.length-1){step++;update();}else stop(); }
  function prev(){ if(step>0){step--;update();} }
  function reset(){ stop(); step=0; update(); }
  function play(){ if(timer){stop();return;} bPlay.textContent='Pause'; timer=setInterval(()=>{ if(step>=steps.length-1){stop();return;} next(); },1900); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} if(bPlay) bPlay.textContent='Play'; }
  bPrev&&bPrev.addEventListener('click',prev); bNext&&bNext.addEventListener('click',next); bPlay&&bPlay.addEventListener('click',play); bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();}); if(window.ResizeObserver){ new ResizeObserver(()=>{fit();draw();}).observe(canvas); }
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw); fit(); update();
})();
