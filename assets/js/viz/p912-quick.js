/* ============================================================
   P912 · Sort an Array — 快速排序(Quick Sort · Lomuto)· viz  [ve-]
   選一個 pivot(這裡取最右),掃一遍把「≤ pivot」的都丟到左半;
   最後把 pivot 換到分界,pivot 就位(左邊全 ≤、右邊全 >),再對左右遞迴。
   平均 O(n log n)、最壞 O(n²)(已排序 + 固定 pivot)、O(log n) 遞迴堆疊、不穩定。
   例 partition [3,7,2,8,5],pivot = 5。
     BAND 1  陣列(黃框=pivot · 紅=i 分界 · 藍=j 掃描 · 綠=已就位)
     BAND 2  本步動作
   ============================================================ */
(function () {
  const P='ve';
  const canvas=document.getElementById(P+'-canvas'); if(!canvas) return;
  const ctx=canvas.getContext('2d');
  const stepEl=document.getElementById(P+'-step'), labelEl=document.getElementById(P+'-label');
  const bPrev=document.getElementById(P+'-prev'),bNext=document.getElementById(P+'-next'),bPlay=document.getElementById(P+'-play'),bReset=document.getElementById(P+'-reset');
  const C={paper:'#fff',dim:'#9a9a9a',text:'#1f3550',grid:'#cfcfcf',cell:'#fafaf6',cellS:'#cfcfcf',
    src:'#dbe8f6',srcS:'#4478c0',srcT:'#2f5f9e',grn:'#d9e8c7',grnS:'#5fa866',grnT:'#3f7a3a',
    cur:'#fbe1e1',curS:'#cf3535',curT:'#992424',pv:'#fbf1d9',pvS:'#d4a017',pvT:'#8a6a12',coral:'#cf3535'};
  // pivotIdx, i (boundary), j (scanner), leq (indices <=pivot region up to i-1), done, placedAt
  const steps=[
    {arr:[3,7,2,8,5],pivot:4,i:0,j:-1,text:'<strong>INITIAL</strong> · pivot = 最右 <code>5</code>。<code>i</code> 標「≤pivot 區」邊界,<code>j</code> 從左掃到右。'},
    {arr:[3,7,2,8,5],pivot:4,i:1,j:0,text:'<strong>j=0</strong> · <code>3 ≤ 5</code> → 換到 i 位(自己),i→1。左區 <code>[3]</code>。'},
    {arr:[3,7,2,8,5],pivot:4,i:1,j:1,text:'<strong>j=1</strong> · <code>7 &gt; 5</code> → 不動,i 不變。'},
    {arr:[3,2,7,8,5],pivot:4,i:2,j:2,text:'<strong>j=2</strong> · <code>2 ≤ 5</code> → 換 a[2]↔a[i=1],i→2。左區 <code>[3,2]</code>。'},
    {arr:[3,2,7,8,5],pivot:4,i:2,j:3,text:'<strong>j=3</strong> · <code>8 &gt; 5</code> → 不動。'},
    {arr:[3,2,5,8,7],pivot:2,i:2,j:-1,placed:2,text:'<strong>放 pivot</strong> · 掃完,把 pivot 換到 <code>i=2</code>。<code>5</code> 就位:左 <code>[3,2]</code> 全 ≤5、右 <code>[8,7]</code> 全 &gt;5。'},
    {arr:[2,3,5,7,8],pivot:-1,i:-1,j:-1,done:true,text:'<strong>遞迴</strong> · 對左半 <code>[3,2]</code> 與右半 <code>[8,7]</code> 各自再 partition → 完成 <code>[2,3,5,7,8]</code>。'},
  ];
  let step=0,timer=null;
  function fit(){const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3);const rc=canvas.getBoundingClientRect();const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||300;const bw=Math.round(w*dpr),bh=Math.round(h*dpr);if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;}ctx.setTransform(dpr,0,0,dpr,0,0);}
  function rr(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
  function tri(cx,cy,col){ctx.beginPath();ctx.moveTo(cx-5,cy+6);ctx.lineTo(cx+5,cy+6);ctx.lineTo(cx,cy-2);ctx.closePath();ctx.fillStyle=col;ctx.fill();}
  function draw(){
    fit();const s=steps[step];const w=canvas.clientWidth,PAD=26;ctx.fillStyle=C.paper;ctx.fillRect(0,0,w,canvas.clientHeight);
    ctx.fillStyle=C.dim;ctx.font='600 12px "JetBrains Mono",monospace';ctx.textAlign='left';ctx.textBaseline='alphabetic';ctx.fillText('BAND 1 · array(黃=pivot · 紅=i · 藍=j · 綠=就位)',PAD,20);
    const n=s.arr.length,cell=Math.min(66,(w-2*PAD)/n-8),gap=((w-2*PAD)-n*cell)/(n-1),gy=44,chh=48;
    for(let k=0;k<n;k++){const x=PAD+k*(cell+gap);const isPivot=k===s.pivot;const isJ=k===s.j;const inLeq=!s.done&&s.i>=0&&k<s.i;const placed=k===s.placed||s.done;
      rr(x,gy,cell,chh,7);let bg=C.cell,bd=C.cellS,tc=C.text;
      if(inLeq){bg=C.grn;bd=C.grnS;tc=C.grnT;}
      if(isPivot){bg=C.pv;bd=C.pvS;tc=C.pvT;}
      if(isJ){bg=C.src;bd=C.srcS;tc=C.srcT;}
      if(placed){bg=C.grn;bd=C.grnS;tc=C.grnT;}
      ctx.fillStyle=bg;ctx.fill();ctx.lineWidth=(isPivot||isJ||placed)?3:1.6;ctx.strokeStyle=bd;ctx.stroke();
      ctx.fillStyle=tc;ctx.font='700 20px "JetBrains Mono",monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(s.arr[k]),x+cell/2,gy+chh/2);}
    // i / j pointers above
    if(!s.done){
      if(s.i>=0&&s.i<n){const ix=PAD+s.i*(cell+gap)+cell/2;tri(ix,gy-6,C.curS);ctx.fillStyle=C.curT;ctx.font='700 10px "JetBrains Mono",monospace';ctx.textAlign='center';ctx.textBaseline='bottom';ctx.fillText('i',ix,gy-8);}
      if(s.j>=0){const jx=PAD+s.j*(cell+gap)+cell/2+8;ctx.fillStyle=C.srcT;ctx.font='700 10px "JetBrains Mono",monospace';ctx.textAlign='left';ctx.textBaseline='bottom';ctx.fillText('j',jx,gy-8);}
    }
    const by=108;ctx.fillStyle=C.coral;ctx.font='600 12px "JetBrains Mono",monospace';ctx.textAlign='left';ctx.textBaseline='alphabetic';ctx.fillText('BAND 2 · a[j] ≤ pivot 就換到 i 位、i++;掃完 pivot 換到 i',PAD,by);
    rr(PAD,by+10,w-PAD*2,42,6);ctx.fillStyle=s.done?C.grn:'#fafaf6';ctx.fill();ctx.lineWidth=1.6;ctx.strokeStyle=s.done?C.grnS:C.grid;ctx.stroke();
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=s.done?C.grnT:C.text;ctx.font='600 12.5px "Noto Sans TC",sans-serif';
    ctx.fillText(s.done?'排序完成 · 平均 O(n log n) · 原地 · 不穩定':'≤pivot 累積在左區,pivot 最後歸位到中間',w/2,by+31);
  }
  function update(){const s=steps[step];if(stepEl)stepEl.textContent=String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0');if(labelEl)labelEl.innerHTML=s.text;draw();}
  function next(){if(step<steps.length-1){step++;update();}else stop();}function prev(){if(step>0){step--;update();}}function reset(){stop();step=0;update();}
  function play(){if(timer){stop();return;}bPlay.textContent='Pause';timer=setInterval(()=>{if(step>=steps.length-1){stop();return;}next();},1600);}
  function stop(){if(timer){clearInterval(timer);timer=null;}if(bPlay)bPlay.textContent='Play';}
  bPrev&&bPrev.addEventListener('click',prev);bNext&&bNext.addEventListener('click',next);bPlay&&bPlay.addEventListener('click',play);bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();});if(window.ResizeObserver){new ResizeObserver(()=>{fit();draw();}).observe(canvas);}
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(draw);fit();update();
})();
