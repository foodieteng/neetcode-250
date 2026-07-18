/* ============================================================
   P912 · Sort an Array — 希爾排序(Shell Sort)· viz  [vd-]
   插入排序的加速版:先用「大間隔 gap」做間隔插入,讓遠處元素快速就位,
   再逐步縮小 gap(n/2 → … → 1),最後 gap=1 就是普通插入排序(但此時已近乎有序,很快)。
   O(n log²n)~O(n^1.5)(依 gap 序列)、O(1) 空間、不穩定。例 [8,3,6,1,5,2]。
     BAND 1  陣列(gap>1 時三色 = 間隔分組 · 綠=最終有序)
     BAND 2  當前 gap
   ============================================================ */
(function () {
  const P='vd';
  const canvas=document.getElementById(P+'-canvas'); if(!canvas) return;
  const ctx=canvas.getContext('2d');
  const stepEl=document.getElementById(P+'-step'), labelEl=document.getElementById(P+'-label');
  const bPrev=document.getElementById(P+'-prev'),bNext=document.getElementById(P+'-next'),bPlay=document.getElementById(P+'-play'),bReset=document.getElementById(P+'-reset');
  const C={paper:'#fff',dim:'#9a9a9a',text:'#1f3550',grid:'#cfcfcf',cell:'#fafaf6',cellS:'#cfcfcf',
    src:'#dbe8f6',srcS:'#4478c0',srcT:'#2f5f9e',grn:'#d9e8c7',grnS:'#5fa866',grnT:'#3f7a3a',
    off:'#eceae2',offS:'#c9c6ba',offT:'#8a8672',coral:'#cf3535',curS:'#cf3535'};
  const G=[{bg:C.src,bd:C.srcS,tc:C.srcT},{bg:C.grn,bd:C.grnS,tc:C.grnT},{bg:C.off,bd:C.offS,tc:C.offT}];
  const steps=[
    {arr:[8,3,6,1,5,2],gap:3,done:false,text:'<strong>gap = 3</strong> · 把相隔 3 的元素分成 3 組(三色):<code>{8,1} {3,5} {6,2}</code>。每組各做插入排序 → 遠處大值一步跨很遠。'},
    {arr:[1,3,2,8,5,6],gap:3,mid:true,text:'<strong>gap = 3 完成</strong> · 每組組內排好 → <code>[1,3,2,8,5,6]</code>。<code>8</code> 從最左跳到右半、<code>1</code> 跳到最左,大位移一次到位。'},
    {arr:[1,2,3,5,6,8],gap:1,done:true,text:'<strong>gap = 1</strong> · 現在做普通插入排序,但陣列已近乎有序 → 幾乎不用搬動,飛快完成 <code>[1,2,3,5,6,8]</code>。'},
  ];
  let step=0,timer=null;
  function fit(){const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3);const rc=canvas.getBoundingClientRect();const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||300;const bw=Math.round(w*dpr),bh=Math.round(h*dpr);if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;}ctx.setTransform(dpr,0,0,dpr,0,0);}
  function rr(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
  function draw(){
    fit();const s=steps[step];const w=canvas.clientWidth,PAD=26;ctx.fillStyle=C.paper;ctx.fillRect(0,0,w,canvas.clientHeight);
    ctx.fillStyle=C.dim;ctx.font='600 12px "JetBrains Mono",monospace';ctx.textAlign='left';ctx.textBaseline='alphabetic';ctx.fillText('BAND 1 · array(gap>1:三色=間隔分組 · 綠=有序)',PAD,20);
    const n=s.arr.length,cell=Math.min(66,(w-2*PAD)/n-8),gap=((w-2*PAD)-n*cell)/(n-1),gy=36,chh=48;
    for(let k=0;k<n;k++){const x=PAD+k*(cell+gap);let col;
      if(s.done){col={bg:C.grn,bd:C.grnS,tc:C.grnT};}
      else if(s.gap>1){col=G[k%s.gap];}
      else {col={bg:C.cell,bd:C.cellS,tc:C.text};}
      rr(x,gy,cell,chh,7);ctx.fillStyle=col.bg;ctx.fill();ctx.lineWidth=1.8;ctx.strokeStyle=col.bd;ctx.stroke();
      ctx.fillStyle=col.tc;ctx.font='700 20px "JetBrains Mono",monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(s.arr[k]),x+cell/2,gy+chh/2);}
    // draw gap connectors for group 0 when gap>1 & first step
    if(s.gap>1&&!s.mid){ctx.strokeStyle=C.srcS;ctx.lineWidth=1.4;ctx.setLineDash([3,3]);
      for(let k=0;k+s.gap<n;k+=s.gap){const x1=PAD+k*(cell+gap)+cell/2,x2=PAD+(k+s.gap)*(cell+gap)+cell/2;ctx.beginPath();ctx.moveTo(x1,gy-4);ctx.quadraticCurveTo((x1+x2)/2,gy-16,x2,gy-4);ctx.stroke();}
      ctx.setLineDash([]);}
    const by=104;ctx.fillStyle=C.coral;ctx.font='600 12px "JetBrains Mono",monospace';ctx.textAlign='left';ctx.textBaseline='alphabetic';ctx.fillText('BAND 2 · gap 由 n/2 逐步縮到 1;每個 gap 做間隔插入',PAD,by);
    rr(PAD,by+10,w-PAD*2,42,6);ctx.fillStyle=s.done?C.grn:'#fafaf6';ctx.fill();ctx.lineWidth=1.6;ctx.strokeStyle=s.done?C.grnS:C.grid;ctx.stroke();
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=s.done?C.grnT:C.text;ctx.font='700 13px "JetBrains Mono",monospace';
    ctx.fillText(s.done?'排序完成 · gap=1 時陣列已近乎有序 → 插入排序飛快':('current gap = '+s.gap+(s.mid?'  (組內已排好)':'')),w/2,by+31);
  }
  function update(){const s=steps[step];if(stepEl)stepEl.textContent=String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0');if(labelEl)labelEl.innerHTML=s.text;draw();}
  function next(){if(step<steps.length-1){step++;update();}else stop();}function prev(){if(step>0){step--;update();}}function reset(){stop();step=0;update();}
  function play(){if(timer){stop();return;}bPlay.textContent='Pause';timer=setInterval(()=>{if(step>=steps.length-1){stop();return;}next();},1900);}
  function stop(){if(timer){clearInterval(timer);timer=null;}if(bPlay)bPlay.textContent='Play';}
  bPrev&&bPrev.addEventListener('click',prev);bNext&&bNext.addEventListener('click',next);bPlay&&bPlay.addEventListener('click',play);bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();});if(window.ResizeObserver){new ResizeObserver(()=>{fit();draw();}).observe(canvas);}
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(draw);fit();update();
})();
