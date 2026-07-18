/* ============================================================
   P75 · Sort Colors — 荷蘭國旗(Dutch National Flag)三路分割 · viz
   三指針一趟就位:l = 0 區右界、i = 掃描游標、r = 2 區左界。
   維持四段:[0,l)=全 0 · [l,i)=全 1 · [i,r]=未看 · (r,n)=全 2。
     nums[i]==0 → swap(i,l),l++、i++  (換來的來自 [l,i) 必是 1,已看過 → i 前進)
     nums[i]==2 → swap(i,r),r--       (換來的來自未看區 → i 不動,要再檢查!)
     nums[i]==1 → i++
   O(n) 一趟、O(1) 原地。例 [2,0,2,1,1,0]。
     BAND 1  陣列(藍=0 · 灰=1 · 綠=2 · 紅框=i)+ l/i/r 指針
     BAND 2  本步動作(重點:遇 2 時 i 不前進)
   ============================================================ */
(function () {
  const canvas=document.getElementById('viz-canvas'); if(!canvas) return;
  const ctx=canvas.getContext('2d');
  const stepEl=document.getElementById('viz-step'), labelEl=document.getElementById('viz-label');
  const bPrev=document.getElementById('viz-prev'),bNext=document.getElementById('viz-next'),bPlay=document.getElementById('viz-play'),bReset=document.getElementById('viz-reset');
  const C={paper:'#fff',dim:'#9a9a9a',text:'#1f3550',grid:'#cfcfcf',
    src:'#dbe8f6',srcS:'#4478c0',srcT:'#2f5f9e',grn:'#d9e8c7',grnS:'#5fa866',grnT:'#3f7a3a',
    off:'#eceae2',offS:'#c9c6ba',offT:'#7d7a68',cur:'#fbe1e1',curS:'#cf3535',curT:'#992424',coral:'#cf3535'};
  // 每步:arr、l、i、r、done、text
  const steps=[
    {arr:[2,0,2,1,1,0],l:0,i:0,r:5,text:'<strong>INITIAL</strong> · 三指針:<code>l</code>=0 區右界、<code>i</code>=掃描、<code>r</code>=2 區左界。維持 [0,l)=0、[l,i)=1、(r,n)=2。'},
    {arr:[0,0,2,1,1,2],l:0,i:0,r:4,move:'2',text:'<strong>nums[i]=2</strong> · 換到右邊 <code>swap(i,r)</code>,<code>r--</code>。<strong>i 不前進!</strong>換來的 <code>0</code> 來自未看區,要再檢查。'},
    {arr:[0,0,2,1,1,2],l:1,i:1,r:4,move:'0',text:'<strong>nums[i]=0</strong> · 換到左邊 <code>swap(i,l)</code>,<code>l++、i++</code>。換來的來自 [l,i) 必是 1,已看過 → i 可前進。'},
    {arr:[0,0,2,1,1,2],l:2,i:2,r:4,move:'0',text:'<strong>nums[i]=0</strong> · 再一個 0 → <code>swap(i,l)</code>,<code>l++、i++</code>。前兩格 <code>[0,0]</code> 已就位。'},
    {arr:[0,0,1,1,2,2],l:2,i:2,r:3,move:'2',text:'<strong>nums[i]=2</strong> · <code>swap(i,r)</code>,<code>r--</code>,i 不動。右邊 <code>[2,2]</code> 就位。換來 <code>1</code>。'},
    {arr:[0,0,1,1,2,2],l:2,i:3,r:3,move:'1',text:'<strong>nums[i]=1</strong> · 1 本來就在中間 → 只 <code>i++</code>,不換。'},
    {arr:[0,0,1,1,2,2],l:2,i:4,r:3,move:'1',done:true,text:'<strong>nums[i]=1</strong> · <code>i++</code> → <code>i=4 &gt; r=3</code>,迴圈結束。一趟完成 <code>[0,0,1,1,2,2]</code>。'},
  ];
  let step=0,timer=null;
  function fit(){const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3);const rc=canvas.getBoundingClientRect();const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||300;const bw=Math.round(w*dpr),bh=Math.round(h*dpr);if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;}ctx.setTransform(dpr,0,0,dpr,0,0);}
  function rr(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
  function tri(cx,cy,col){ctx.beginPath();ctx.moveTo(cx-5,cy+6);ctx.lineTo(cx+5,cy+6);ctx.lineTo(cx,cy-2);ctx.closePath();ctx.fillStyle=col;ctx.fill();}
  function draw(){
    fit();const s=steps[step];const w=canvas.clientWidth,PAD=30;ctx.fillStyle=C.paper;ctx.fillRect(0,0,w,canvas.clientHeight);
    ctx.fillStyle=C.dim;ctx.font='600 12px "JetBrains Mono",monospace';ctx.textAlign='left';ctx.textBaseline='alphabetic';ctx.fillText('BAND 1 · nums(藍=0 · 灰=1 · 綠=2 · 紅框=i)· 指針 l/i/r',PAD,20);
    const n=s.arr.length,cell=Math.min(72,(w-2*PAD)/n-8),gp=((w-2*PAD)-n*cell)/(n-1),gy=52,chh=50;
    const COL={0:{bg:C.src,bd:C.srcS,tc:C.srcT},1:{bg:C.off,bd:C.offS,tc:C.offT},2:{bg:C.grn,bd:C.grnS,tc:C.grnT}};
    for(let k=0;k<n;k++){const x=PAD+k*(cell+gp);const v=s.arr[k];const isI=k===s.i&&!s.done;const col=COL[v];
      rr(x,gy,cell,chh,7);ctx.fillStyle=col.bg;ctx.fill();ctx.lineWidth=isI?3.5:1.8;ctx.strokeStyle=isI?C.curS:col.bd;ctx.stroke();
      ctx.fillStyle=isI?C.curT:col.tc;ctx.font='700 22px "JetBrains Mono",monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(v),x+cell/2,gy+chh/2);}
    // pointers above
    const px=k=>PAD+k*(cell+gp)+cell/2;
    function ptr(idx,label,col,dy){if(idx<0||idx>=n){ // r can go below or i above
        if(idx<0){const x=PAD-6;ctx.fillStyle=col;ctx.font='700 12px "JetBrains Mono",monospace';ctx.textAlign='right';ctx.textBaseline='bottom';ctx.fillText(label+'↤',x,gy-4);return;}
        const x=PAD+n*(cell+gp);ctx.fillStyle=col;ctx.font='700 12px "JetBrains Mono",monospace';ctx.textAlign='left';ctx.textBaseline='bottom';ctx.fillText('↦'+label,x,gy-4);return;}
      tri(px(idx)+dy,gy-8,col);ctx.fillStyle=col;ctx.font='700 11px "JetBrains Mono",monospace';ctx.textAlign='center';ctx.textBaseline='bottom';ctx.fillText(label,px(idx)+dy,gy-10);}
    if(!s.done){ptr(s.l,'l',C.srcS,-9);ptr(s.i,'i',C.curS,0);ptr(s.r,'r',C.grnS,9);}
    // BAND 2
    const by=120;ctx.fillStyle=C.coral;ctx.font='600 12px "JetBrains Mono",monospace';ctx.textAlign='left';ctx.textBaseline='alphabetic';ctx.fillText('BAND 2 · 0→換左(l++,i++) · 2→換右(r--,i 不動) · 1→i++',PAD,by);
    rr(PAD,by+10,w-PAD*2,44,6);ctx.fillStyle=s.done?C.grn:'#fafaf6';ctx.fill();ctx.lineWidth=1.6;ctx.strokeStyle=s.done?C.grnS:C.grid;ctx.stroke();
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='600 12.5px "Noto Sans TC",sans-serif';
    if(s.done){ctx.fillStyle=C.grnT;ctx.fillText('完成 · 一趟 O(n)、原地 O(1)、三種值一次分好',w/2,by+32);}
    else if(s.move==='2'){ctx.fillStyle=C.curT;ctx.font='700 12.5px "Noto Sans TC",sans-serif';ctx.fillText('遇 2:換到右界後 i 不前進 —— 換來的元素還沒檢查過!',w/2,by+32);}
    else if(s.move==='0'){ctx.fillStyle=C.srcT;ctx.fillText('遇 0:換到左界,l 與 i 同步前進(換來的必是已看過的 1)',w/2,by+32);}
    else if(s.move==='1'){ctx.fillStyle=C.text;ctx.fillText('遇 1:它已在正確的中間區,只把 i 往前',w/2,by+32);}
    else{ctx.fillStyle=C.text;ctx.fillText('i 從左掃到 r;0 丟左、2 丟右、1 留中',w/2,by+32);}
  }
  function update(){const s=steps[step];if(stepEl)stepEl.textContent=String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0');if(labelEl)labelEl.innerHTML=s.text;draw();}
  function next(){if(step<steps.length-1){step++;update();}else stop();}function prev(){if(step>0){step--;update();}}function reset(){stop();step=0;update();}
  function play(){if(timer){stop();return;}bPlay.textContent='Pause';timer=setInterval(()=>{if(step>=steps.length-1){stop();return;}next();},1700);}
  function stop(){if(timer){clearInterval(timer);timer=null;}if(bPlay)bPlay.textContent='Play';}
  bPrev&&bPrev.addEventListener('click',prev);bNext&&bNext.addEventListener('click',next);bPlay&&bPlay.addEventListener('click',play);bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();});if(window.ResizeObserver){new ResizeObserver(()=>{fit();draw();}).observe(canvas);}
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(draw);fit();update();
})();
