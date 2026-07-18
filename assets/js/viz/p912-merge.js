/* ============================================================
   P912 · Sort an Array — 合併排序(Merge Sort)· viz  [vf-]
   分治:對半切到剩一個(必有序),再把兩個「已排序半段」用雙指針合併。
   穩定的 O(n log n)(不看輸入)、需要 O(n) 額外空間。例 [5,2,4,1]。
     BAND 1  兩個已排序半段 + 合併輸出(藍/綠 = 左右半 · 紅 = 剛取出的較小者)
     BAND 2  本步合併比較
   ============================================================ */
(function () {
  const P='vf';
  const canvas=document.getElementById(P+'-canvas'); if(!canvas) return;
  const ctx=canvas.getContext('2d');
  const stepEl=document.getElementById(P+'-step'), labelEl=document.getElementById(P+'-label');
  const bPrev=document.getElementById(P+'-prev'),bNext=document.getElementById(P+'-next'),bPlay=document.getElementById(P+'-play'),bReset=document.getElementById(P+'-reset');
  const C={paper:'#fff',dim:'#9a9a9a',text:'#1f3550',grid:'#cfcfcf',cell:'#fafaf6',cellS:'#cfcfcf',
    src:'#dbe8f6',srcS:'#4478c0',srcT:'#2f5f9e',grn:'#d9e8c7',grnS:'#5fa866',grnT:'#3f7a3a',
    cur:'#fbe1e1',curS:'#cf3535',curT:'#992424',off:'#f2f2ee',offS:'#dcdcd6',offT:'#b4b4ac',coral:'#cf3535'};
  const L=[2,5], Rr=[1,4];   // 已排序的左右半段
  // steps: i (L pointer), j (R pointer), out (merged so far), pick ('L'|'R'), done
  const steps=[
    {phase:'intro',out:[],i:0,j:0,text:'<strong>分治</strong> · <code>[5,2,4,1]</code> 切成 <code>[5,2]</code>、<code>[4,1]</code>,各自排成 <code>[2,5]</code>、<code>[1,4]</code>。現在合併兩個已排序半段。'},
    {phase:'merge',out:[1],i:0,j:1,pick:'R',from:0,text:'<strong>比較</strong> · 左首 <code>2</code> vs 右首 <code>1</code> → 取較小 <code>1</code>。'},
    {phase:'merge',out:[1,2],i:1,j:1,pick:'L',from:0,text:'<strong>比較</strong> · 左首 <code>2</code> vs 右首 <code>4</code> → 取 <code>2</code>。'},
    {phase:'merge',out:[1,2,4],i:2,j:1,pick:'R',from:1,text:'<strong>比較</strong> · 左首 <code>5</code> vs 右首 <code>4</code> → 取 <code>4</code>。'},
    {phase:'merge',out:[1,2,4,5],i:2,j:2,pick:'L',from:1,done:true,text:'<strong>收尾</strong> · 右半用完,左半剩 <code>5</code> 直接接上。完成 <code>[1,2,4,5]</code>。'},
  ];
  let step=0,timer=null;
  function fit(){const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3);const rc=canvas.getBoundingClientRect();const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||300;const bw=Math.round(w*dpr),bh=Math.round(h*dpr);if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;}ctx.setTransform(dpr,0,0,dpr,0,0);}
  function rr(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
  function cellBox(x,y,cw,ch,v,col,active){rr(x,y,cw,ch,7);ctx.fillStyle=col.bg;ctx.fill();ctx.lineWidth=active?3:1.6;ctx.strokeStyle=active?col.aS:col.bd;ctx.stroke();ctx.fillStyle=col.tc;ctx.font='700 18px "JetBrains Mono",monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(v),x+cw/2,y+ch/2);}
  function draw(){
    fit();const s=steps[step];const w=canvas.clientWidth,PAD=26;ctx.fillStyle=C.paper;ctx.fillRect(0,0,w,canvas.clientHeight);
    ctx.fillStyle=C.dim;ctx.font='600 12px "JetBrains Mono",monospace';ctx.textAlign='left';ctx.textBaseline='alphabetic';ctx.fillText('BAND 1 · 左半(藍) / 右半(綠) · 首元素比較,小者進輸出',PAD,20);
    const cw=46,ch=42,gy=34;
    // left half
    ctx.fillStyle=C.dim;ctx.font='700 11px "JetBrains Mono",monospace';ctx.textAlign='left';ctx.textBaseline='alphabetic';ctx.fillText('L',PAD,gy-4);
    for(let k=0;k<L.length;k++){const used=k<s.i;cellBox(PAD+18+k*(cw+8),gy,cw,ch,L[k],used?{bg:C.off,bd:C.offS,tc:C.offT}:{bg:C.src,bd:C.srcS,tc:C.srcT,aS:C.srcS},!used&&k===s.i&&s.phase==='merge');}
    // right half
    const rx=PAD+18+2*(cw+8)+40;
    ctx.fillStyle=C.dim;ctx.fillText('R',rx-14,gy-4);
    for(let k=0;k<Rr.length;k++){const used=k<s.j;cellBox(rx+k*(cw+8),gy,cw,ch,Rr[k],used?{bg:C.off,bd:C.offS,tc:C.offT}:{bg:C.grn,bd:C.grnS,tc:C.grnT,aS:C.grnS},!used&&k===s.j&&s.phase==='merge');}
    // output row
    const oy=104;ctx.fillStyle=C.coral;ctx.font='600 12px "JetBrains Mono",monospace';ctx.textAlign='left';ctx.textBaseline='alphabetic';ctx.fillText('BAND 2 · 合併輸出 tmp(雙指針,取較小)',PAD,oy);
    for(let k=0;k<4;k++){const x=PAD+18+k*(cw+8);rr(x,oy+10,cw,ch,7);const has=k<s.out.length;const justAdded=has&&k===s.out.length-1&&s.phase==='merge';
      ctx.fillStyle=justAdded?C.cur:(has?C.grn:'#fafaf6');ctx.fill();ctx.lineWidth=justAdded?3:1.6;ctx.strokeStyle=justAdded?C.curS:(has?C.grnS:C.grid);ctx.stroke();
      if(has){ctx.fillStyle=justAdded?C.curT:C.grnT;ctx.font='700 18px "JetBrains Mono",monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(s.out[k]),x+cw/2,oy+10+ch/2);}}
    // caption
    const cy=oy+ch+22;ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillStyle=s.done?C.grnT:C.dim;ctx.font='600 12px "Noto Sans TC",sans-serif';
    ctx.fillText(s.done?'完成 · 穩定 O(n log n) · 需 O(n) 額外空間':(s.phase==='intro'?'先切到剩 1 個(必有序),再兩兩合併回去':'相等時取左半 → 保持穩定'),PAD+18+4*(cw+8)+16,oy+10+ch/2);
  }
  function update(){const s=steps[step];if(stepEl)stepEl.textContent=String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0');if(labelEl)labelEl.innerHTML=s.text;draw();}
  function next(){if(step<steps.length-1){step++;update();}else stop();}function prev(){if(step>0){step--;update();}}function reset(){stop();step=0;update();}
  function play(){if(timer){stop();return;}bPlay.textContent='Pause';timer=setInterval(()=>{if(step>=steps.length-1){stop();return;}next();},1600);}
  function stop(){if(timer){clearInterval(timer);timer=null;}if(bPlay)bPlay.textContent='Play';}
  bPrev&&bPrev.addEventListener('click',prev);bNext&&bNext.addEventListener('click',next);bPlay&&bPlay.addEventListener('click',play);bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();});if(window.ResizeObserver){new ResizeObserver(()=>{fit();draw();}).observe(canvas);}
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(draw);fit();update();
})();
