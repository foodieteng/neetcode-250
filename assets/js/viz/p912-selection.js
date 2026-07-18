/* ============================================================
   P912 · Sort an Array — 選擇排序(Selection Sort)· viz  [vb-]
   每趟從「未排序區」找最小值,換到未排序區的最前面。
   O(n²) 比較(不管輸入)、O(1) 空間、不穩定(swap 可能跨越相等元素)。
   例 [5,2,4,1,3]。
     BAND 1  陣列(藍=本趟找到的最小 · 紅=要換去的位置 · 綠=已排序前段)
     BAND 2  本趟動作
   ============================================================ */
(function () {
  const P='vb';
  const canvas=document.getElementById(P+'-canvas'); if(!canvas) return;
  const ctx=canvas.getContext('2d');
  const stepEl=document.getElementById(P+'-step'), labelEl=document.getElementById(P+'-label');
  const bPrev=document.getElementById(P+'-prev'),bNext=document.getElementById(P+'-next'),bPlay=document.getElementById(P+'-play'),bReset=document.getElementById(P+'-reset');
  const C={paper:'#fff',dim:'#9a9a9a',text:'#1f3550',grid:'#cfcfcf',cell:'#fafaf6',cellS:'#cfcfcf',
    src:'#dbe8f6',srcS:'#4478c0',srcT:'#2f5f9e',grn:'#d9e8c7',grnS:'#5fa866',grnT:'#3f7a3a',
    cur:'#fbe1e1',curS:'#cf3535',curT:'#992424',coral:'#cf3535'};
  const steps=[
    {arr:[5,2,4,1,3],sortedFrom:5,minIdx:-1,pos:-1,text:'<strong>INITIAL</strong> · <code>[5,2,4,1,3]</code>。每趟從未排序區挑<strong>最小值</strong>,換到未排序區最前。'},
    {arr:[1,2,4,5,3],sortedFrom:1,minIdx:0,pos:0,text:'<strong>趟1</strong> · 未排序 <code>[5,2,4,1,3]</code> 最小是 <code>1</code>(idx3)→ 換到 idx0。前段 <code>[1]</code> 就位。'},
    {arr:[1,2,4,5,3],sortedFrom:2,minIdx:1,pos:1,text:'<strong>趟2</strong> · 未排序 <code>[2,4,5,3]</code> 最小是 <code>2</code>(已在 idx1)→ 換自己。前段 <code>[1,2]</code>。'},
    {arr:[1,2,3,5,4],sortedFrom:3,minIdx:2,pos:2,text:'<strong>趟3</strong> · 未排序 <code>[4,5,3]</code> 最小是 <code>3</code>(idx4)→ 換到 idx2。前段 <code>[1,2,3]</code>。'},
    {arr:[1,2,3,4,5],sortedFrom:4,minIdx:3,pos:3,text:'<strong>趟4</strong> · 未排序 <code>[5,4]</code> 最小是 <code>4</code> → 換到 idx3。最後一個自動就位。'},
    {arr:[1,2,3,4,5],sortedFrom:0,minIdx:-1,pos:-1,done:true,text:'<strong>完成</strong> · <code>[1,2,3,4,5]</code>。比較次數固定 <code>n(n-1)/2</code>,交換最多 <code>n-1</code> 次。'},
  ];
  let step=0,timer=null;
  function fit(){const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3);const rc=canvas.getBoundingClientRect();const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||300;const bw=Math.round(w*dpr),bh=Math.round(h*dpr);if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;}ctx.setTransform(dpr,0,0,dpr,0,0);}
  function rr(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
  function draw(){
    fit();const s=steps[step];const w=canvas.clientWidth,PAD=26;ctx.fillStyle=C.paper;ctx.fillRect(0,0,w,canvas.clientHeight);
    ctx.fillStyle=C.dim;ctx.font='600 12px "JetBrains Mono",monospace';ctx.textAlign='left';ctx.textBaseline='alphabetic';ctx.fillText('BAND 1 · array(藍=最小 · 紅=目標位 · 綠=已排序)',PAD,20);
    const n=s.arr.length,cell=Math.min(66,(w-2*PAD)/n-8),gap=((w-2*PAD)-n*cell)/(n-1),gy=36,chh=48;
    for(let k=0;k<n;k++){const x=PAD+k*(cell+gap);const sorted=k<s.sortedFrom;const isMin=k===s.minIdx&&!s.done;const isPos=k===s.pos&&s.minIdx!==s.pos&&!s.done;
      rr(x,gy,cell,chh,7);let bg=C.cell,bd=C.cellS,tc=C.text;if(sorted){bg=C.grn;bd=C.grnS;tc=C.grnT;}if(isMin){bg=C.src;bd=C.srcS;tc=C.srcT;}if(isPos){bg=C.cur;bd=C.curS;tc=C.curT;}
      ctx.fillStyle=bg;ctx.fill();ctx.lineWidth=(isMin||isPos)?3:1.6;ctx.strokeStyle=bd;ctx.stroke();
      ctx.fillStyle=tc;ctx.font='700 20px "JetBrains Mono",monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(s.arr[k]),x+cell/2,gy+chh/2);}
    const by=104;ctx.fillStyle=C.coral;ctx.font='600 12px "JetBrains Mono",monospace';ctx.textAlign='left';ctx.textBaseline='alphabetic';ctx.fillText('BAND 2 · 找未排序區最小 → 換到最前',PAD,by);
    rr(PAD,by+10,w-PAD*2,42,6);ctx.fillStyle=s.done?C.grn:'#fafaf6';ctx.fill();ctx.lineWidth=1.6;ctx.strokeStyle=s.done?C.grnS:C.grid;ctx.stroke();
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=s.done?C.grnT:C.text;ctx.font='600 12.5px "Noto Sans TC",sans-serif';
    ctx.fillText(s.done?'排序完成 · O(n²) 比較 · O(1) 空間 · 不穩定':'選最小、換到未排序區開頭,前段一格格變綠',w/2,by+31);
  }
  function update(){const s=steps[step];if(stepEl)stepEl.textContent=String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0');if(labelEl)labelEl.innerHTML=s.text;draw();}
  function next(){if(step<steps.length-1){step++;update();}else stop();}function prev(){if(step>0){step--;update();}}function reset(){stop();step=0;update();}
  function play(){if(timer){stop();return;}bPlay.textContent='Pause';timer=setInterval(()=>{if(step>=steps.length-1){stop();return;}next();},1600);}
  function stop(){if(timer){clearInterval(timer);timer=null;}if(bPlay)bPlay.textContent='Play';}
  bPrev&&bPrev.addEventListener('click',prev);bNext&&bNext.addEventListener('click',next);bPlay&&bPlay.addEventListener('click',play);bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();});if(window.ResizeObserver){new ResizeObserver(()=>{fit();draw();}).observe(canvas);}
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(draw);fit();update();
})();
