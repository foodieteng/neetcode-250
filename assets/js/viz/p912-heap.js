/* ============================================================
   P912 · Sort an Array — 堆積排序(Heap Sort)· viz  [vg-]
   把陣列看成完全二元樹(子節點 2i+1、2i+2)。先 build max-heap:由下往上
   heapify,讓最大值浮到根。再反覆「根(最大)換到尾、堆縮小 1、對根 sift down」。
   O(n log n)(不看輸入)、O(1) 原地、不穩定。例 [4,10,3,5,1]。
     BAND 1  完全二元樹(黃=根/最大 · 綠=已排到尾的)
     BAND 2  陣列 + 本步動作
   ============================================================ */
(function () {
  const P='vg';
  const canvas=document.getElementById(P+'-canvas'); if(!canvas) return;
  const ctx=canvas.getContext('2d');
  const stepEl=document.getElementById(P+'-step'), labelEl=document.getElementById(P+'-label');
  const bPrev=document.getElementById(P+'-prev'),bNext=document.getElementById(P+'-next'),bPlay=document.getElementById(P+'-play'),bReset=document.getElementById(P+'-reset');
  const C={paper:'#fff',dim:'#9a9a9a',text:'#1f3550',grid:'#cfcfcf',cell:'#fafaf6',cellS:'#cfcfcf',
    src:'#dbe8f6',srcS:'#4478c0',srcT:'#2f5f9e',grn:'#d9e8c7',grnS:'#5fa866',grnT:'#3f7a3a',
    pv:'#fbf1d9',pvS:'#d4a017',pvT:'#8a6a12',coral:'#cf3535'};
  // 節點在樹中的相對位置(0..1 x, 0..2 level)
  const POS=[[0.5,0],[0.27,1],[0.73,1],[0.15,2],[0.39,2]];
  const EDGES=[[0,1],[0,2],[1,3],[1,4]];
  const steps=[
    {arr:[4,10,3,5,1],sortedFrom:5,rootHi:false,text:'<strong>INITIAL</strong> · 陣列 = 完全二元樹(子 = 2i+1, 2i+2)。先建 max-heap。'},
    {arr:[10,5,3,4,1],sortedFrom:5,rootHi:true,text:'<strong>build max-heap</strong> · 由下往上 heapify → 最大值 <code>10</code> 浮到根。父 ≥ 子。'},
    {arr:[5,4,3,1,10],sortedFrom:4,rootHi:true,text:'<strong>取出 10</strong> · 根 ↔ 尾,<code>10</code> 就位(綠)。堆縮小,對新根 sift down → <code>5</code> 回到根。'},
    {arr:[4,1,3,5,10],sortedFrom:3,rootHi:true,text:'<strong>取出 5</strong> · 根 ↔ 尾,<code>5</code> 就位。sift down → <code>4</code> 到根。'},
    {arr:[1,3,4,5,10],sortedFrom:0,rootHi:false,done:true,text:'<strong>完成</strong> · 持續取根到尾 → <code>[1,3,4,5,10]</code>。每次取最大放後面。'},
  ];
  let step=0,timer=null;
  function fit(){const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3);const rc=canvas.getBoundingClientRect();const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||300;const bw=Math.round(w*dpr),bh=Math.round(h*dpr);if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;}ctx.setTransform(dpr,0,0,dpr,0,0);}
  function rr(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
  function draw(){
    fit();const s=steps[step];const w=canvas.clientWidth,PAD=26;ctx.fillStyle=C.paper;ctx.fillRect(0,0,w,canvas.clientHeight);
    ctx.fillStyle=C.dim;ctx.font='600 12px "JetBrains Mono",monospace';ctx.textAlign='left';ctx.textBaseline='alphabetic';ctx.fillText('BAND 1 · 堆積(完全二元樹 · 黃=根/最大;已排出的移到下方陣列)',PAD,18);
    const treeX=PAD, treeW=w-2*PAD, ty0=30, lvH=44, R=15;
    const nx=i=>treeX+POS[i][0]*treeW, ny=i=>ty0+POS[i][1]*lvH+R;
    // edges — only within the live heap (i < sortedFrom)
    ctx.strokeStyle=C.grid;ctx.lineWidth=1.6;
    for(const[a,b]of EDGES){if(a<s.sortedFrom&&b<s.sortedFrom){ctx.beginPath();ctx.moveTo(nx(a),ny(a));ctx.lineTo(nx(b),ny(b));ctx.stroke();}}
    // nodes — only live heap nodes drawn in the tree (sorted ones leave the heap)
    for(let i=0;i<s.sortedFrom;i++){const isRoot=i===0&&s.rootHi;
      ctx.beginPath();ctx.arc(nx(i),ny(i),R,0,Math.PI*2);
      let bg=C.src,bd=C.srcS,tc=C.srcT;
      if(isRoot){bg=C.pv;bd=C.pvS;tc=C.pvT;}
      ctx.fillStyle=bg;ctx.fill();ctx.lineWidth=isRoot?3:2;ctx.strokeStyle=bd;ctx.stroke();
      ctx.fillStyle=tc;ctx.font='700 15px "JetBrains Mono",monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(s.arr[i]),nx(i),ny(i));}
    if(s.done){ctx.fillStyle=C.grnT;ctx.font='600 12.5px "Noto Sans TC",sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('堆已清空 → 全部就位',w/2,ty0+lvH+R);}
    // BAND 2: array + caption
    const ay=166;ctx.fillStyle=C.coral;ctx.font='600 12px "JetBrains Mono",monospace';ctx.textAlign='left';ctx.textBaseline='alphabetic';ctx.fillText('BAND 2 · array(綠=已排序尾段)',PAD,ay);
    const n=5,cell=Math.min(56,(w-2*PAD)/n-8),gp=((w-2*PAD)-n*cell)/(n-1),gy=ay+10,chh=36;
    for(let k=0;k<n;k++){const x=PAD+k*(cell+gp);const sorted=k>=s.sortedFrom;rr(x,gy,cell,chh,6);
      ctx.fillStyle=sorted?C.grn:(k===0&&s.rootHi?C.pv:C.cell);ctx.fill();ctx.lineWidth=1.6;ctx.strokeStyle=sorted?C.grnS:(k===0&&s.rootHi?C.pvS:C.cellS);ctx.stroke();
      ctx.fillStyle=sorted?C.grnT:(k===0&&s.rootHi?C.pvT:C.text);ctx.font='700 16px "JetBrains Mono",monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(s.arr[k]),x+cell/2,gy+chh/2);}
    ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillStyle=s.done?C.grnT:C.dim;ctx.font='600 11.5px "Noto Sans TC",sans-serif';
    ctx.fillText(s.done?'完成 · O(n log n) · 原地 · 不穩定':'父 = 2i+1/2i+2 的父;根永遠是當前最大',PAD,gy+chh+18);
  }
  function update(){const s=steps[step];if(stepEl)stepEl.textContent=String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0');if(labelEl)labelEl.innerHTML=s.text;draw();}
  function next(){if(step<steps.length-1){step++;update();}else stop();}function prev(){if(step>0){step--;update();}}function reset(){stop();step=0;update();}
  function play(){if(timer){stop();return;}bPlay.textContent='Pause';timer=setInterval(()=>{if(step>=steps.length-1){stop();return;}next();},1800);}
  function stop(){if(timer){clearInterval(timer);timer=null;}if(bPlay)bPlay.textContent='Play';}
  bPrev&&bPrev.addEventListener('click',prev);bNext&&bNext.addEventListener('click',next);bPlay&&bPlay.addEventListener('click',play);bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();});if(window.ResizeObserver){new ResizeObserver(()=>{fit();draw();}).observe(canvas);}
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(draw);fit();update();
})();
