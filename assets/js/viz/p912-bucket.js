/* ============================================================
   P912 · Sort an Array — 桶排序(Bucket Sort)· viz  [vh-]
   依「值域」把元素散進 n 個桶(idx = (x−min)/range × (n−1)),
   每個桶內各自排序,再從左到右串接。資料均勻分布時接近 O(n)。
   非原地(需 O(n) 桶空間)、穩定性看桶內排序。例 [8,2,5,1,7,3]。
     BAND 1  原陣列 → 散進桶(依值域)
     BAND 2  桶內排序 → 串接
   ============================================================ */
(function () {
  const P='vh';
  const canvas=document.getElementById(P+'-canvas'); if(!canvas) return;
  const ctx=canvas.getContext('2d');
  const stepEl=document.getElementById(P+'-step'), labelEl=document.getElementById(P+'-label');
  const bPrev=document.getElementById(P+'-prev'),bNext=document.getElementById(P+'-next'),bPlay=document.getElementById(P+'-play'),bReset=document.getElementById(P+'-reset');
  const C={paper:'#fff',dim:'#9a9a9a',text:'#1f3550',grid:'#cfcfcf',cell:'#fafaf6',cellS:'#cfcfcf',
    src:'#dbe8f6',srcS:'#4478c0',srcT:'#2f5f9e',grn:'#d9e8c7',grnS:'#5fa866',grnT:'#3f7a3a',
    cur:'#fbe1e1',curS:'#cf3535',curT:'#992424',coral:'#cf3535'};
  const ARR=[8,2,5,1,7,3];
  // min=1,max=8,range=8,n=6: idx=(x-1)/8*5 → 8→4,2→0,5→2,1→0,7→3,3→1
  const B0=[[],[2,1],[],[3],[5],[7],[8]];   // 散進後(桶0..? 這裡用 6 桶但顯示到 idx4+5空)
  const BUCKETS=[[2,1],[3],[5],[7],[8],[]];  // buckets[0..5]
  const SORTED=[[1,2],[3],[5],[7],[8],[]];   // 桶內排序後
  const steps=[
    {phase:'intro',text:'<strong>INITIAL</strong> · <code>[8,2,5,1,7,3]</code>。依值域把每個數丟進對應的桶:<code>idx = (x−min)/range × (n−1)</code>。'},
    {phase:'scatter',buckets:BUCKETS,text:'<strong>散桶</strong> · <code>2,1→桶0</code>、<code>3→桶1</code>、<code>5→桶2</code>、<code>7→桶3</code>、<code>8→桶4</code>。值小的落前面的桶。'},
    {phase:'sort',buckets:SORTED,text:'<strong>桶內排序</strong> · 桶 0 的 <code>[2,1]</code> → <code>[1,2]</code>。其餘桶各 ≤1 個,已就緒。'},
    {phase:'gather',result:[1,2,3,5,7,8],buckets:SORTED,done:true,text:'<strong>串接</strong> · 由左到右倒出各桶 → <code>[1,2,3,5,7,8]</code>。均勻分布時各桶很小 → 近 O(n)。'},
  ];
  let step=0,timer=null;
  function fit(){const dpr=Math.min(Math.max(window.devicePixelRatio||1,2),3);const rc=canvas.getBoundingClientRect();const w=rc.width||canvas.clientWidth,h=rc.height||canvas.clientHeight||300;const bw=Math.round(w*dpr),bh=Math.round(h*dpr);if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;}ctx.setTransform(dpr,0,0,dpr,0,0);}
  function rr(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
  function draw(){
    fit();const s=steps[step];const w=canvas.clientWidth,PAD=26;ctx.fillStyle=C.paper;ctx.fillRect(0,0,w,canvas.clientHeight);
    // BAND 1: original array (or result)
    ctx.fillStyle=C.dim;ctx.font='600 12px "JetBrains Mono",monospace';ctx.textAlign='left';ctx.textBaseline='alphabetic';
    ctx.fillText(s.phase==='gather'?'BAND 1 · 串接結果':'BAND 1 · nums(依值域散進桶)',PAD,20);
    const top=s.done?s.result:ARR;const n=top.length,cell=Math.min(56,(w-2*PAD)/n-8),gp=((w-2*PAD)-n*cell)/(n-1),gy=32,chh=36;
    for(let k=0;k<n;k++){const x=PAD+k*(cell+gp);rr(x,gy,cell,chh,6);
      ctx.fillStyle=s.done?C.grn:C.src;ctx.fill();ctx.lineWidth=1.6;ctx.strokeStyle=s.done?C.grnS:C.srcS;ctx.stroke();
      ctx.fillStyle=s.done?C.grnT:C.srcT;ctx.font='700 16px "JetBrains Mono",monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(top[k]),x+cell/2,gy+chh/2);}
    // BAND 2: buckets
    const by=90;ctx.fillStyle=C.coral;ctx.font='600 12px "JetBrains Mono",monospace';ctx.textAlign='left';ctx.textBaseline='alphabetic';ctx.fillText('BAND 2 · buckets(桶內排序後串接)',PAD,by);
    if(s.buckets){
      const nb=s.buckets.length,bw=(w-2*PAD)/nb-8,bx0=PAD,byy=by+12,boxH=88;
      for(let i=0;i<nb;i++){const x=bx0+i*(bw+8);const bk=s.buckets[i];const hi=(s.phase==='sort'&&i===0);
        rr(x,byy,bw,boxH,7);ctx.fillStyle=hi?'#fbe1e1':'#fafaf6';ctx.fill();ctx.lineWidth=hi?2.5:1.5;ctx.strokeStyle=hi?C.curS:C.grid;ctx.stroke();
        ctx.fillStyle=C.dim;ctx.font='700 10px "JetBrains Mono",monospace';ctx.textAlign='center';ctx.textBaseline='top';ctx.fillText('桶'+i,x+bw/2,byy+4);
        for(let d=0;d<bk.length;d++){const wy=byy+20+d*22;rr(x+8,wy,bw-16,18,4);ctx.fillStyle=C.grn;ctx.fill();ctx.lineWidth=1.3;ctx.strokeStyle=C.grnS;ctx.stroke();
          ctx.fillStyle=C.grnT;ctx.font='700 13px "JetBrains Mono",monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(bk[d]),x+bw/2,wy+9);}}
    } else {
      ctx.fillStyle=C.dim;ctx.font='600 12.5px "Noto Sans TC",sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('準備把每個數依值域丟進對應的桶…',w/2,by+52);
    }
  }
  function update(){const s=steps[step];if(stepEl)stepEl.textContent=String(step).padStart(2,'0')+' / '+String(steps.length-1).padStart(2,'0');if(labelEl)labelEl.innerHTML=s.text;draw();}
  function next(){if(step<steps.length-1){step++;update();}else stop();}function prev(){if(step>0){step--;update();}}function reset(){stop();step=0;update();}
  function play(){if(timer){stop();return;}bPlay.textContent='Pause';timer=setInterval(()=>{if(step>=steps.length-1){stop();return;}next();},1800);}
  function stop(){if(timer){clearInterval(timer);timer=null;}if(bPlay)bPlay.textContent='Play';}
  bPrev&&bPrev.addEventListener('click',prev);bNext&&bNext.addEventListener('click',next);bPlay&&bPlay.addEventListener('click',play);bReset&&bReset.addEventListener('click',reset);
  window.addEventListener('resize',()=>{fit();draw();});if(window.ResizeObserver){new ResizeObserver(()=>{fit();draw();}).observe(canvas);}
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(draw);fit();update();
})();
