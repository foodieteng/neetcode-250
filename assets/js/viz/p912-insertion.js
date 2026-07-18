/* ============================================================
   P912 · Sort an Array — 插入排序(Insertion Sort)· viz  [vc-]
   維持左邊「已排序前綴」;取下一個 key,把比它大的往右移一格,插進空位。
   O(n²) 最壞、O(n) 近乎有序時、O(1) 空間、穩定。實務小陣列很快。
   例 [5,2,4,1,3]。
     BAND 1  陣列(藍=已排序前綴 · 紅=正在插入的 key · 灰=被往右移的)
     BAND 2  本步動作
   ============================================================ */
(function () {
  const P='vc';
  const canvas=document.getElementById(P+'-canvas'); if(!canvas) return;
  const ctx=canvas.getContext('2d');
  const stepEl=document.getElementById(P+'-step'), labelEl=document.getElementById(P+'-label');
  const bPrev=document.getElementById(P+'-prev'),bNext=document.getElementById(P+'-next'),bPlay=document.getElementById(P+'-play'),bReset=document.getElementById(P+'-reset');
  const C={paper:'#fff',dim:'#9a9a9a',text:'#1f3550',grid:'#cfcfcf',cell:'#fafaf6',cellS:'#cfcfcf',
    src:'#dbe8f6',srcS:'#4478c0',srcT:'#2f5f9e',grn:'#d9e8c7',grnS:'#5fa866',grnT:'#3f7a3a',
    cur:'#fbe1e1',curS:'#cf3535',curT:'#992424',off:'#f2f2ee',offS:'#dcdcd6',offT:'#b4b4ac',coral:'#cf3535'};
  // sortedTo = 已排序前綴的長度(index < sortedTo 是已排序);keyIdx = key 最終插入位置
  const steps=[
    {arr:[5,2,4,1,3],sortedTo:1,keyIdx:-1,text:'<strong>INITIAL</strong> · 前綴 <code>[5]</code> 視為已排序。逐一取右邊的 key,插進前綴正確位置。'},
    {arr:[2,5,4,1,3],sortedTo:2,keyIdx:0,text:'<strong>key=2</strong> · 5 &gt; 2 右移,2 插到最前。前綴 <code>[2,5]</code>。'},
    {arr:[2,4,5,1,3],sortedTo:3,keyIdx:1,text:'<strong>key=4</strong> · 5 &gt; 4 右移;2 &lt; 4 停。4 插在 2 後。前綴 <code>[2,4,5]</code>。'},
    {arr:[1,2,4,5,3],sortedTo:4,keyIdx:0,text:'<strong>key=1</strong> · 5、4、2 全 &gt; 1 右移,1 插到最前。前綴 <code>[1,2,4,5]</code>。'},
    {arr:[1,2,3,4,5],sortedTo:5,keyIdx:2,done:true,text:'<strong>key=3</strong> · 5、4 &gt; 3 右移;2 &lt; 3 停。3 插在 2 後。完成 <code>[1,2,3,4,5]</code>。'},
  ];
  let step=0,timer=null;
  function fit(){const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3);const rc=canvas.getBoundingClientRect();const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||300;const bw=Math.round(w*dpr),bh=Math.round(h*dpr);if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;}ctx.setTransform(dpr,0,0,dpr,0,0);}
  function rr(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
  function draw(){
    fit();const s=steps[step];const w=canvas.clientWidth,PAD=26;ctx.fillStyle=C.paper;ctx.fillRect(0,0,w,canvas.clientHeight);
    ctx.fillStyle=C.dim;ctx.font='600 12px "JetBrains Mono",monospace';ctx.textAlign='left';ctx.textBaseline='alphabetic';ctx.fillText('BAND 1 · array(藍=已排序前綴 · 紅=剛插入的 key)',PAD,20);
    const n=s.arr.length,cell=Math.min(66,(w-2*PAD)/n-8),gap=((w-2*PAD)-n*cell)/(n-1),gy=36,chh=48;
    for(let k=0;k<n;k++){const x=PAD+k*(cell+gap);const inPrefix=k<s.sortedTo;const isKey=k===s.keyIdx&&!s.done||(s.done&&k===s.keyIdx);
      rr(x,gy,cell,chh,7);let bg=C.cell,bd=C.cellS,tc=C.text;if(inPrefix){bg=C.src;bd=C.srcS;tc=C.srcT;}if(isKey){bg=C.cur;bd=C.curS;tc=C.curT;}
      ctx.fillStyle=bg;ctx.fill();ctx.lineWidth=isKey?3:1.6;ctx.strokeStyle=bd;ctx.stroke();
      ctx.fillStyle=tc;ctx.font='700 20px "JetBrains Mono",monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(s.arr[k]),x+cell/2,gy+chh/2);}
    // divider between prefix and rest
    if(!s.done&&s.sortedTo<n){const dx=PAD+s.sortedTo*(cell+gap)-gap/2;ctx.strokeStyle=C.srcS;ctx.lineWidth=1.5;ctx.setLineDash([4,3]);ctx.beginPath();ctx.moveTo(dx,gy-4);ctx.lineTo(dx,gy+chh+4);ctx.stroke();ctx.setLineDash([]);}
    const by=104;ctx.fillStyle=C.coral;ctx.font='600 12px "JetBrains Mono",monospace';ctx.textAlign='left';ctx.textBaseline='alphabetic';ctx.fillText('BAND 2 · 比 key 大的往右移一格,騰出空位插入',PAD,by);
    rr(PAD,by+10,w-PAD*2,42,6);ctx.fillStyle=s.done?C.grn:'#fafaf6';ctx.fill();ctx.lineWidth=1.6;ctx.strokeStyle=s.done?C.grnS:C.grid;ctx.stroke();
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=s.done?C.grnT:C.text;ctx.font='600 12.5px "Noto Sans TC",sans-serif';
    ctx.fillText(s.done?'排序完成 · 近乎有序時 O(n) · O(1) 空間 · 穩定':'像整理手牌:新牌插進已排好的左手',w/2,by+31);
  }
  function update(){const s=steps[step];if(stepEl)stepEl.textContent=String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0');if(labelEl)labelEl.innerHTML=s.text;draw();}
  function next(){if(step<steps.length-1){step++;update();}else stop();}function prev(){if(step>0){step--;update();}}function reset(){stop();step=0;update();}
  function play(){if(timer){stop();return;}bPlay.textContent='Pause';timer=setInterval(()=>{if(step>=steps.length-1){stop();return;}next();},1600);}
  function stop(){if(timer){clearInterval(timer);timer=null;}if(bPlay)bPlay.textContent='Play';}
  bPrev&&bPrev.addEventListener('click',prev);bNext&&bNext.addEventListener('click',next);bPlay&&bPlay.addEventListener('click',play);bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();});if(window.ResizeObserver){new ResizeObserver(()=>{fit();draw();}).observe(canvas);}
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(draw);fit();update();
})();
