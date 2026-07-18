/* ============================================================
   P912 · Sort an Array — 基數排序(Radix Sort · LSD)· viz  [vi-]
   從<最低位>開始,對每一位做一次「穩定的計數排序」(桶 0..9),
   一位一位往高位掃 → 最高位排完就整體有序。負數:拆出來取絕對值排序,
   再反轉、取負,接到正數前面。O(d·(n+10)) ≈ O(n)(位數 d 為常數)。
   例正數部分 [53,24,6,89,17]。
     BAND 1  目前的陣列(紅=正在看的那一位)
     BAND 2  這一位的 10 個桶 → 收集
   ============================================================ */
(function () {
  const P='vi';
  const canvas=document.getElementById(P+'-canvas'); if(!canvas) return;
  const ctx=canvas.getContext('2d');
  const stepEl=document.getElementById(P+'-step'), labelEl=document.getElementById(P+'-label');
  const bPrev=document.getElementById(P+'-prev'),bNext=document.getElementById(P+'-next'),bPlay=document.getElementById(P+'-play'),bReset=document.getElementById(P+'-reset');
  const C={paper:'#fff',dim:'#9a9a9a',text:'#1f3550',grid:'#cfcfcf',cell:'#fafaf6',cellS:'#cfcfcf',
    src:'#dbe8f6',srcS:'#4478c0',srcT:'#2f5f9e',grn:'#d9e8c7',grnS:'#5fa866',grnT:'#3f7a3a',
    cur:'#fbe1e1',curS:'#cf3535',curT:'#992424',coral:'#cf3535'};
  // 每步:arr、digitPlace('units'|'tens')、buckets(10 桶,依當前位)、result
  const steps=[
    {arr:[53,24,6,89,17],place:null,buckets:null,text:'<strong>INITIAL</strong> · <code>[53,24,6,89,17]</code>。從<strong>個位</strong>開始,每一位做一次穩定計數排序。'},
    {arr:[53,24,6,89,17],place:'units',
     buckets:{3:[53],4:[24],6:[6],7:[17],9:[89]},
     text:'<strong>個位 → 分桶</strong> · 依個位數丟進桶 0–9:<code>53→3、24→4、6→6、17→7、89→9</code>。'},
    {arr:[53,24,6,17,89],place:'units',collected:true,
     buckets:{3:[53],4:[24],6:[6],7:[17],9:[89]},
     text:'<strong>個位 → 收集</strong> · 由桶 0 到 9 依序倒出 → <code>[53,24,6,17,89]</code>(依個位排好,穩定)。'},
    {arr:[53,24,6,17,89],place:'tens',
     buckets:{0:[6],1:[17],2:[24],5:[53],8:[89]},
     text:'<strong>十位 → 分桶</strong> · 依十位數丟桶:<code>6→0、17→1、24→2、53→5、89→8</code>。'},
    {arr:[6,17,24,53,89],place:'tens',collected:true,done:true,
     buckets:{0:[6],1:[17],2:[24],5:[53],8:[89]},
     text:'<strong>十位 → 收集</strong> · 倒出 → <code>[6,17,24,53,89]</code>。最高位排完 = 整體有序!負數則另拆處理。'},
  ];
  function digitOf(x,place){return place==='units'?x%10:Math.floor(x/10)%10;}
  let step=0,timer=null;
  function fit(){const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3);const rc=canvas.getBoundingClientRect();const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||300;const bw=Math.round(w*dpr),bh=Math.round(h*dpr);if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;}ctx.setTransform(dpr,0,0,dpr,0,0);}
  function rr(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
  function draw(){
    fit();const s=steps[step];const w=canvas.clientWidth,PAD=26;ctx.fillStyle=C.paper;ctx.fillRect(0,0,w,canvas.clientHeight);
    // BAND 1: array with current digit highlighted
    ctx.fillStyle=C.dim;ctx.font='600 12px "JetBrains Mono",monospace';ctx.textAlign='left';ctx.textBaseline='alphabetic';
    ctx.fillText('BAND 1 · array(紅底 = 正在排的那一位:'+(s.place==='units'?'個位':s.place==='tens'?'十位':'—')+')',PAD,20);
    const n=s.arr.length,cell=Math.min(72,(w-2*PAD)/n-8),gp=((w-2*PAD)-n*cell)/(n-1),gy=32,chh=42;
    for(let k=0;k<n;k++){const x=PAD+k*(cell+gp);const collected=s.collected;rr(x,gy,cell,chh,7);
      ctx.fillStyle=collected?C.grn:C.cell;ctx.fill();ctx.lineWidth=1.6;ctx.strokeStyle=collected?C.grnS:C.cellS;ctx.stroke();
      const str=String(s.arr[k]);ctx.font='700 18px "JetBrains Mono",monospace';ctx.textAlign='center';ctx.textBaseline='middle';
      if(s.place){const dg=String(digitOf(s.arr[k],s.place));
        // draw number, highlight the active digit position
        ctx.fillStyle=collected?C.grnT:C.text;ctx.fillText(str,x+cell/2,gy+chh/2);
        // underline active digit with a red dot label
        ctx.fillStyle=C.curT;ctx.font='700 10px "JetBrains Mono",monospace';ctx.textBaseline='top';ctx.fillText('·'+dg+'·',x+cell/2,gy+chh+3);
      } else {ctx.fillStyle=C.text;ctx.fillText(str,x+cell/2,gy+chh/2);}
    }
    // BAND 2: 10 buckets by digit
    const by=98;ctx.fillStyle=C.coral;ctx.font='600 12px "JetBrains Mono",monospace';ctx.textAlign='left';ctx.textBaseline='alphabetic';ctx.fillText('BAND 2 · 桶 0–9(依當前位),再由 0 往 9 收集',PAD,by);
    const nb=10,bw=(w-2*PAD)/nb-4,bx0=PAD,byy=by+12,boxH=76;
    for(let i=0;i<nb;i++){const x=bx0+i*(bw+4);const bk=(s.buckets&&s.buckets[i])||[];const has=bk.length>0;
      rr(x,byy,bw,boxH,5);ctx.fillStyle=has?'#fafaf6':'#f6f6f2';ctx.fill();ctx.lineWidth=has?1.8:1.2;ctx.strokeStyle=has?C.srcS:C.grid;ctx.stroke();
      ctx.fillStyle=C.dim;ctx.font='700 10px "JetBrains Mono",monospace';ctx.textAlign='center';ctx.textBaseline='top';ctx.fillText(String(i),x+bw/2,byy+3);
      for(let d=0;d<bk.length;d++){const wy=byy+18+d*20;rr(x+3,wy,bw-6,17,4);ctx.fillStyle=C.src;ctx.fill();ctx.lineWidth=1.2;ctx.strokeStyle=C.srcS;ctx.stroke();
        ctx.fillStyle=C.srcT;ctx.font='700 11px "JetBrains Mono",monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(bk[d]),x+bw/2,wy+9);}}
    if(!s.buckets){ctx.fillStyle=C.dim;ctx.font='600 12.5px "Noto Sans TC",sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('穩定計數排序:同一位相同的數保持原相對順序',w/2,byy+boxH/2);}
  }
  function update(){const s=steps[step];if(stepEl)stepEl.textContent=String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0');if(labelEl)labelEl.innerHTML=s.text;draw();}
  function next(){if(step<steps.length-1){step++;update();}else stop();}function prev(){if(step>0){step--;update();}}function reset(){stop();step=0;update();}
  function play(){if(timer){stop();return;}bPlay.textContent='Pause';timer=setInterval(()=>{if(step>=steps.length-1){stop();return;}next();},1900);}
  function stop(){if(timer){clearInterval(timer);timer=null;}if(bPlay)bPlay.textContent='Play';}
  bPrev&&bPrev.addEventListener('click',prev);bNext&&bNext.addEventListener('click',next);bPlay&&bPlay.addEventListener('click',play);bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();});if(window.ResizeObserver){new ResizeObserver(()=>{fit();draw();}).observe(canvas);}
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(draw);fit();update();
})();
