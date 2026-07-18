/* ============================================================
   P912 · Sort an Array — 氣泡排序(Bubble Sort)· viz  [va-]
   相鄰兩兩比較,大的往右換 → 每一趟把「當前最大」冒泡到最右。
   加 swapped 旗標:某趟沒換過 = 已排好,提早結束。
   O(n²) 時間、O(1) 空間、穩定。例 [4,1,3,2]。
     BAND 1  陣列(紅=正在比較的相鄰對 · 綠=已排好的尾段)
     BAND 2  本步比較與動作
   ============================================================ */
(function () {
  const P='va';
  const canvas=document.getElementById(P+'-canvas'); if(!canvas) return;
  const ctx=canvas.getContext('2d');
  const stepEl=document.getElementById(P+'-step'), labelEl=document.getElementById(P+'-label');
  const bPrev=document.getElementById(P+'-prev'),bNext=document.getElementById(P+'-next'),bPlay=document.getElementById(P+'-play'),bReset=document.getElementById(P+'-reset');
  const C={paper:'#fff',dim:'#9a9a9a',text:'#1f3550',grid:'#cfcfcf',cell:'#fafaf6',cellS:'#cfcfcf',
    src:'#dbe8f6',srcS:'#4478c0',srcT:'#2f5f9e',grn:'#d9e8c7',grnS:'#5fa866',grnT:'#3f7a3a',
    cur:'#fbe1e1',curS:'#cf3535',curT:'#992424',coral:'#cf3535'};

  // steps: arr, cmp:[i,j], swap:bool, sortedFrom (index, sorted suffix), text
  const steps=[
    {arr:[4,1,3,2],cmp:null,sortedFrom:4,text:'<strong>INITIAL</strong> · <code>[4,1,3,2]</code>。相鄰比較,左 &gt; 右就交換 → 每趟把最大值冒泡到最右。'},
    {arr:[1,4,3,2],cmp:[0,1],swap:true,sortedFrom:4,text:'<strong>趟1</strong> · 4 &gt; 1 → 交換。'},
    {arr:[1,3,4,2],cmp:[1,2],swap:true,sortedFrom:4,text:'<strong>趟1</strong> · 4 &gt; 3 → 交換。'},
    {arr:[1,3,2,4],cmp:[2,3],swap:true,sortedFrom:3,text:'<strong>趟1 完成</strong> · 4 &gt; 2 → 交換。最大值 <code>4</code> 已冒泡到最右(綠)。'},
    {arr:[1,2,3,4],cmp:[1,2],swap:true,sortedFrom:2,text:'<strong>趟2</strong> · 1&lt;3 不換;3 &gt; 2 → 交換。<code>3</code> 就位。'},
    {arr:[1,2,3,4],cmp:null,sortedFrom:0,done:true,text:'<strong>趟3</strong> · 全程沒有交換 → <code>swapped=false</code> 提早結束。已排序 <code>[1,2,3,4]</code>。'},
  ];

  let step=0,timer=null;
  function fit(){const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3);const rc=canvas.getBoundingClientRect();const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||300;const bw=Math.round(w*dpr),bh=Math.round(h*dpr);if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;}ctx.setTransform(dpr,0,0,dpr,0,0);}
  function rr(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
  function draw(){
    fit();const s=steps[step];const w=canvas.clientWidth,PAD=26;ctx.fillStyle=C.paper;ctx.fillRect(0,0,w,canvas.clientHeight);
    ctx.fillStyle=C.dim;ctx.font='600 12px "JetBrains Mono",monospace';ctx.textAlign='left';ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · array(紅=比較的相鄰對 · 綠=已排好尾段)',PAD,20);
    const n=s.arr.length,cell=Math.min(66,(w-2*PAD)/n-8),gap=((w-2*PAD)-n*cell)/(n-1),gy=36,chh=48;
    for(let k=0;k<n;k++){const x=PAD+k*(cell+gap);const inCmp=s.cmp&&(k===s.cmp[0]||k===s.cmp[1]);const sorted=k>=s.sortedFrom;
      rr(x,gy,cell,chh,7);let bg=C.cell,bd=C.cellS,tc=C.text;if(sorted){bg=C.grn;bd=C.grnS;tc=C.grnT;}if(inCmp){bg=C.cur;bd=C.curS;tc=C.curT;}
      ctx.fillStyle=bg;ctx.fill();ctx.lineWidth=inCmp?3:1.6;ctx.strokeStyle=bd;ctx.stroke();
      ctx.fillStyle=tc;ctx.font='700 20px "JetBrains Mono",monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(s.arr[k]),x+cell/2,gy+chh/2);}
    const by=104;ctx.fillStyle=C.coral;ctx.font='600 12px "JetBrains Mono",monospace';ctx.textAlign='left';ctx.textBaseline='alphabetic';ctx.fillText('BAND 2 · 相鄰比較:a[j] > a[j+1] 就交換',PAD,by);
    rr(PAD,by+10,w-PAD*2,42,6);ctx.fillStyle=s.done?C.grn:'#fafaf6';ctx.fill();ctx.lineWidth=1.6;ctx.strokeStyle=s.done?C.grnS:C.grid;ctx.stroke();
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=s.done?C.grnT:C.text;ctx.font='600 12.5px "Noto Sans TC",sans-serif';
    ctx.fillText(s.done?'排序完成 · O(n²) 時間 · O(1) 空間 · 穩定':(s.cmp?('比較 index '+s.cmp[0]+' 與 '+s.cmp[1]+(s.swap?' → 交換':' → 不動')):'相鄰兩兩掃過去,大的往右冒'),w/2,by+31);
  }
  function update(){const s=steps[step];if(stepEl)stepEl.textContent=String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0');if(labelEl)labelEl.innerHTML=s.text;draw();}
  function next(){if(step<steps.length-1){step++;update();}else stop();}function prev(){if(step>0){step--;update();}}function reset(){stop();step=0;update();}
  function play(){if(timer){stop();return;}bPlay.textContent='Pause';timer=setInterval(()=>{if(step>=steps.length-1){stop();return;}next();},1500);}
  function stop(){if(timer){clearInterval(timer);timer=null;}if(bPlay)bPlay.textContent='Play';}
  bPrev&&bPrev.addEventListener('click',prev);bNext&&bNext.addEventListener('click',next);bPlay&&bPlay.addEventListener('click',play);bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();});if(window.ResizeObserver){new ResizeObserver(()=>{fit();draw();}).observe(canvas);}
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(draw);fit();update();
})();
