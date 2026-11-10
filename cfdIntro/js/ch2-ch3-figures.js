/* ================= Ch2 duct + channel, Ch3 schemes ================= */
(function(){
'use strict';
const {$,cv,seg,segVal,segVals,fmt,arrow,wob,FONT}=UI;
const INK='#15202b',MUT='#566577',BLUE='#1f5fbf',RED='#d4432f',GRN='#1f8a63',LINE='#d8e0e8';
const redraws=[];window.UI.redraws=redraws;

/* ---------- tabs ---------- */
(function(){
  const tabs=document.querySelectorAll('#fig-fv .tabs button');
  tabs.forEach(b=>b.addEventListener('click',()=>{
    tabs.forEach(x=>x.setAttribute('aria-selected',x===b?'true':'false'));
    $('p-duct').hidden=b.dataset.tab!=='duct';$('p-chan').hidden=b.dataset.tab!=='chan';
  }));
})();

/* ---------- A: duct ---------- */
const D={N:8,field:'u',flux:'int',sel:3};
const dc=cv('cvDuct'),dg=dc.g,DW=dc.w;
const PX0=60,PXW=920;
const FN={u:{ex:NUM.uEx,key:'uc',name:'u [m/s]'},p:{ex:NUM.pEx,key:'pc',name:'p [m²/s²]'},g:{ex:NUM.gEx,key:'g',name:'dp/dx [m/s²]'}};
function drawDuct(){
  const d=NUM.duct(D.N),N=D.N,g=dg,f=FN[D.field];
  if(D.sel>=N)D.sel=N-1;
  g.clearRect(0,0,DW,dc.h);
  const X=x=>PX0+x*PXW,cy=95,sc=55;
  /* duct body */
  const top=[],bot=[];for(let k=0;k<=240;k++){const x=k/240,h=NUM.A(x)*sc;top.push([X(x),cy-h]);bot.push([X(x),cy+h]);}
  g.fillStyle='#f3f7fd';g.beginPath();top.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));bot.slice().reverse().forEach(p=>g.lineTo(p[0],p[1]));g.closePath();g.fill();
  /* selected cell */
  {const i=D.sel,xa=d.xf[i],xb=d.xf[i+1],n=12;g.fillStyle='#cfe0fa';g.beginPath();
   for(let k=0;k<=n;k++){const x=xa+(xb-xa)*k/n;const p=[X(x),cy-NUM.A(x)*sc];k?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]);}
   for(let k=n;k>=0;k--){const x=xa+(xb-xa)*k/n;g.lineTo(X(x),cy+NUM.A(x)*sc);}g.closePath();g.fill();}
  /* faces */
  g.strokeStyle=MUT;g.lineWidth=1;
  for(let k=0;k<=N;k++){const x=d.xf[k],h=NUM.A(x)*sc;g.beginPath();g.moveTo(X(x),cy-h);g.lineTo(X(x),cy+h);g.stroke();}
  /* walls, slightly hand-drawn */
  g.strokeStyle=INK;g.lineWidth=2.4;g.lineJoin='round';
  [top,bot].forEach(w=>{g.beginPath();w.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.stroke();});
  /* flux arrows */
  const F=D.flux==='ex'?d.Fex:d.Fint;
  for(let k=0;k<=N;k++){const l=34*F[k];arrow(g,X(d.xf[k])-l/2,cy,X(d.xf[k])+l/2,cy,BLUE,2.2);}
  g.fillStyle=BLUE;g.font=FONT;g.textAlign='center';
  if(N<=14)for(let k=0;k<=N;k++)g.fillText('F',X(d.xf[k]),cy-NUM.A(d.xf[k])*sc-8);
  g.fillStyle=INK;for(let i=0;i<N;i++){g.beginPath();g.arc(X(d.xc[i]),cy,3,0,7);g.fill();}
  g.fillStyle=MUT;g.textAlign='left';g.fillText('flow →',PX0,18);
  /* plot */
  const py0=235,py1=435,arr=d[f.key];
  let lo=Infinity,hi=-Infinity;
  for(let k=0;k<=200;k++){const v=f.ex(k/200);lo=Math.min(lo,v);hi=Math.max(hi,v);}
  arr.forEach(v=>{lo=Math.min(lo,v);hi=Math.max(hi,v);});
  const pad=(hi-lo)*0.1||1;lo-=pad;hi+=pad;
  const Y=v=>py1-(v-lo)/(hi-lo)*(py1-py0);
  g.strokeStyle=LINE;g.lineWidth=1;g.strokeRect(PX0,py0,PXW,py1-py0);
  g.fillStyle=MUT;g.font=FONT;g.textAlign='right';
  [lo+pad*0.5,(lo+hi)/2,hi-pad*0.5].forEach(v=>{g.fillText(v.toFixed(2),PX0-6,Y(v)+4);g.beginPath();g.moveTo(PX0,Y(v));g.lineTo(PX0+PXW,Y(v));g.strokeStyle='#edf1f6';g.stroke();});
  g.textAlign='left';g.fillText(f.name,PX0+6,py0+16);
  [0,0.5,1].forEach(x=>{g.textAlign=x===1?'right':x===0?'left':'center';g.fillText('x/L = '+x,X(x),py1+18);});
  /* cell values */
  for(let i=0;i<N;i++){const s=i===D.sel;g.strokeStyle=s?RED:BLUE;g.lineWidth=s?5:3.5;g.lineCap='butt';
    g.beginPath();g.moveTo(X(d.xf[i])+1,Y(arr[i]));g.lineTo(X(d.xf[i+1])-1,Y(arr[i]));g.stroke();
    g.fillStyle=s?RED:BLUE;g.beginPath();g.arc(X(d.xc[i]),Y(arr[i]),3.5,0,7);g.fill();}
  /* exact */
  g.strokeStyle=INK;g.lineWidth=1.6;g.beginPath();
  for(let k=0;k<=300;k++){const x=k/300;k?g.lineTo(X(x),Y(f.ex(x))):g.moveTo(X(x),Y(f.ex(x)));}g.stroke();
  g.font=FONT;g.textAlign='right';g.fillStyle=INK;g.fillText('— exact',PX0+PXW-110,py0+16);g.fillStyle=BLUE;g.fillText('▬ cell value',PX0+PXW-6,py0+16);
  /* readouts */
  const e=NUM.ductErr(d,D.field);
  const F_=D.flux==='ex'?d.Fex:d.Fint;
  const i=D.sel;
  $('dSelName').textContent='#'+(i+1)+' of '+N;
  $('dInsp').innerHTML=[['volume V',fmt(d.V[i],4)+' m³'],['mean u',fmt(d.uc[i],4)+' m/s'],['mean p',fmt(d.pc[i],4)],['dp/dx in cell',fmt(d.g[i],4)],['flux in, F (west)',fmt(F_[i],5)],['flux out, F (east)',fmt(F_[i+1],5)],['net, ΣF',fmt(F_[i+1]-F_[i],4)]].map(r=>'<dt>'+r[0]+'</dt><dd>'+r[1]+'</dd>').join('');
  let imb=0;for(let k=0;k<N;k++)imb=Math.max(imb,Math.abs(F_[k+1]-F_[k]));
  $('dErr').innerHTML=[['interior cells',fmt(e.inter,4)],['end cells',fmt(e.bnd,4)],['max |ΣF| over cells',fmt(imb,4)]].map(r=>'<dt>'+r[0]+'</dt><dd>'+r[1]+'</dd>').join('');
  $('dErrNote').textContent=D.field==='g'?'The pressure gradient is built from face values of p. In the end cells the face value is not an average of two neighbours, so the gradient there converges more slowly.':D.field==='p'?'Pressure drops where the duct narrows (velocity rises), as Bernoulli predicts.':'Cell values are volume averages. Where the duct changes quickly, one coarse cell cannot follow the curve.';
  /* table */
  const rows=[];let prev=null;
  [4,8,16,32,64].forEach(n=>{const r=NUM.ductErr(NUM.duct(n),D.field);rows.push('<tr><td class="n">'+n+'</td><td class="n">'+fmt(r.inter,4)+'</td><td class="n">'+(prev?(prev.inter/r.inter).toFixed(2):'–')+'</td><td class="n">'+fmt(r.bnd,4)+'</td><td class="n">'+(prev?(prev.bnd/r.bnd).toFixed(2):'–')+'</td></tr>');prev=r;});
  $('dTbl').querySelector('tbody').innerHTML=rows.join('');
}
redraws.push(drawDuct);
$('dN').addEventListener('input',e=>{D.N=+e.target.value;$('dNo').textContent=D.N;drawDuct();});
seg('dField',v=>{D.field=v;drawDuct();});seg('dFlux',v=>{D.flux=v;drawDuct();});
function pickCell(ev){const r=dc.c.getBoundingClientRect(),x=((ev.clientX-r.left)/r.width*DW-PX0)/PXW;D.sel=Math.max(0,Math.min(D.N-1,Math.floor(x*D.N)));drawDuct();}
dc.c.addEventListener('click',pickCell);
dc.c.tabIndex=0;dc.c.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){D.sel=Math.min(D.N-1,D.sel+1);drawDuct();e.preventDefault();}if(e.key==='ArrowLeft'){D.sel=Math.max(0,D.sel-1);drawDuct();e.preventDefault();}});

/* ---------- B: channel ---------- */
const cc=cv('cvChan'),cg=cc.g;
function drawChan(){
  const N=+$('cN').value,c=NUM.channel(N),g=cg;$('cNo').textContent=N;
  g.clearRect(0,0,cc.w,cc.h);
  const x0=90,xw=860,y0=380,yh=340,umax=0.24;
  const X=u=>x0+u/umax*xw,Y=y=>y0-y/c.H*yh;
  g.strokeStyle=LINE;g.lineWidth=1;g.strokeRect(x0,y0-yh,xw,yh);
  g.fillStyle=MUT;g.font=FONT;g.textAlign='center';[0,0.05,0.1,0.15,0.2].forEach(u=>g.fillText(u.toFixed(2),X(u),y0+36-14));
  g.fillText('u [m/s]',X(0.12),y0+36);
  g.textAlign='right';g.fillText('y = 0 (wall)',x0-6,y0+4);g.fillText('y = H (wall)',x0-6,y0-yh+4);
  /* cells */
  for(let i=0;i<N;i++){g.fillStyle='rgba(31,95,191,.16)';g.fillRect(x0,Y(c.yf[i+1]),X(c.uc[i])-x0,Y(c.yf[i])-Y(c.yf[i+1]));
    g.strokeStyle=BLUE;g.lineWidth=1.2;g.strokeRect(x0,Y(c.yf[i+1]),X(c.uc[i])-x0,Y(c.yf[i])-Y(c.yf[i+1]));}
  g.fillStyle=BLUE;c.yc.forEach((y,i)=>{g.beginPath();g.arc(X(c.uc[i]),Y(y),3.5,0,7);g.fill();});
  /* exact */
  g.strokeStyle=INK;g.lineWidth=1.8;g.beginPath();for(let k=0;k<=200;k++){const y=k/200*c.H;k?g.lineTo(X(c.uex(y)),Y(y)):g.moveTo(X(c.uex(y)),Y(y));}g.stroke();
  /* walls */
  g.strokeStyle=INK;g.lineWidth=3;[y0,y0-yh].forEach((y,s)=>wob(g,x0,y,x0+xw,y,s+1));
  g.lineWidth=1;for(let k=0;k<40;k++){const x=x0+k*xw/39;[[y0,1],[y0-yh,-1]].forEach(([y,s])=>{g.beginPath();g.moveTo(x,y);g.lineTo(x-8,y+s*9);g.stroke();});}
  /* wall gradient */
  const ycl=c.yc[0],ex=c.wallExact*ycl;
  g.setLineDash([5,4]);g.strokeStyle=INK;g.lineWidth=1.5;g.beginPath();g.moveTo(X(0),Y(0));g.lineTo(X(ex),Y(ycl));g.stroke();g.setLineDash([]);
  g.strokeStyle=RED;g.lineWidth=2.4;g.beginPath();g.moveTo(X(0),Y(0));g.lineTo(X(c.uc[0]),Y(ycl));g.stroke();
  g.textAlign='left';g.font=FONT;g.fillStyle=INK;g.fillText('— exact profile',X(0.15)+30,Y(c.H*0.5)-80);
  g.fillText('- - exact wall slope',X(0.15)+30,Y(c.H*0.5)-62);g.fillStyle=RED;g.fillText('— wall slope used by the FV method',X(0.15)+30,Y(c.H*0.5)-44);
  g.fillStyle=BLUE;g.fillText('▬ cell averages',X(0.15)+30,Y(c.H*0.5)-98);
  $('cBulk').innerHTML='<dt>max error at interior faces</dt><dd>'+(c.faceErr<1e-9?'≈ 0 (round-off)':fmt(c.faceErr,2)+' s⁻¹')+'</dd><dt>formula</dt><dd>(u<sub>N</sub> − u<sub>P</sub>)/Δy</dd>';
  const rel=(c.wallFV/c.wallExact-1)*100;
  $('cWall').innerHTML='<dt>exact</dt><dd>'+c.wallExact.toFixed(2)+' s⁻¹</dd><dt>FV, u<sub>P</sub>/(Δy/2)</dt><dd>'+c.wallFV.toFixed(2)+' s⁻¹</dd><dt>relative error</dt><dd>'+(rel>0?'+':'')+rel.toFixed(1)+' %</dd>';
}
redraws.push(drawChan);
$('cN').addEventListener('input',drawChan);

/* ---------- Ch3 schemes ---------- */
const SC={upwind:{c:BLUE,n:'upwind'},linear:{c:RED,n:'linear'},linearUpwind:{c:GRN,n:'linearUpwind'}};
const sc=cv('cvSch'),sg=sc.g;
const peOf=()=>0.1*Math.pow(2000,(+$('sPe').value)/1000);
function drawSch(){
  const Pe=peOf(),N=+$('sN').value,g=sg;
  $('sPeo').textContent=Pe<10?Pe.toFixed(2):Pe.toFixed(0);$('sNo').textContent=N;
  const show=segVals('sSch'),st={};
  const em=1-Math.exp(-Pe),I=x=>(Math.exp(Pe*(x-1))/Pe-Math.exp(-Pe)*x)/em,avg=[];for(let i=0;i<N;i++)avg.push((I((i+1)/N)-I(i/N))*N);
  show.forEach(k=>{const s=NUM.cdStats(N,Pe,k);let e=0;s.x.forEach((v,i)=>{e=Math.max(e,Math.abs(v-avg[i]));});s.err=e;st[k]=s;});
  g.clearRect(0,0,sc.w,sc.h);
  let lo=0,hi=1;show.forEach(k=>st[k].x.forEach(v=>{lo=Math.min(lo,v);hi=Math.max(hi,v);}));
  const pad=(hi-lo)*0.08;lo-=pad;hi+=pad;
  const x0=60,xw=920,y0=400,yh=360,X=x=>x0+x*xw,Y=v=>y0-(v-lo)/(hi-lo)*yh;
  g.strokeStyle=LINE;g.lineWidth=1;g.strokeRect(x0,y0-yh,xw,yh);
  g.fillStyle=MUT;g.font=FONT;g.textAlign='right';
  [0,1].forEach(v=>{g.fillText(v,x0-6,Y(v)+4);g.strokeStyle='#edf1f6';g.beginPath();g.moveTo(x0,Y(v));g.lineTo(x0+xw,Y(v));g.stroke();});
  g.textAlign='center';[0,0.5,1].forEach(x=>{g.textAlign=x===1?'right':x===0?'left':'center';g.fillText('x/L = '+x,X(x),y0+18);});
  g.strokeStyle='#e3e9f0';for(let i=1;i<N;i++){g.beginPath();g.moveTo(X(i/N),y0-yh);g.lineTo(X(i/N),y0);g.stroke();}
  g.strokeStyle=INK;g.lineWidth=2;g.beginPath();for(let k=0;k<=400;k++){const x=k/400,v=NUM.cdExact(Pe,x);k?g.lineTo(X(x),Y(v)):g.moveTo(X(x),Y(v));}g.stroke();
  g.lineWidth=3;g.lineCap='butt';avg.forEach((v,i)=>{g.beginPath();g.moveTo(X(i/N)+2,Y(v));g.lineTo(X((i+1)/N)-2,Y(v));g.stroke();});
  show.forEach(k=>{const s=SC[k],x=st[k].x;g.strokeStyle=s.c;g.fillStyle=s.c;g.lineWidth=2;g.beginPath();
    x.forEach((v,i)=>{const px=X((i+0.5)/N);i?g.lineTo(px,Y(v)):g.moveTo(px,Y(v));});g.stroke();
    x.forEach((v,i)=>{g.beginPath();g.arc(X((i+0.5)/N),Y(v),3.2,0,7);g.fill();});});
  g.textAlign='left';g.fillStyle=INK;g.fillText('— exact, ▬ its cell averages',x0+8,y0-yh+18);
  show.forEach((k,i)=>{g.fillStyle=SC[k].c;g.fillText('● '+SC[k].n,x0+8,y0-yh+36+i*18);});
  const pc=Pe/N;
  $('sPec').innerHTML='Pe<sub>Δ</sub> = Pe/N = <b>'+pc.toFixed(2)+'</b> '+(pc<=2?'<span class="chip ok">≤ 2: central scheme still monotone</span>':'<span class="chip bad">&gt; 2: central scheme not monotone</span>');
  const gam=1/Pe,gn=1/(2*N),pe2=1/(gam+gn);
  $('sNumD').innerHTML='Γ = 1/Pe = '+fmt(gam,3)+', Γ<sub>num</sub> = uΔx/2 = '+fmt(gn,3)+'. Upwind behaves like central differencing with Pe<sub>eff</sub> = '+pe2.toFixed(1)+' instead of '+(Pe<10?Pe.toFixed(2):Pe.toFixed(0))+'. That is the smearing.';
  $('sTbl').querySelector('tbody').innerHTML=show.map(k=>{const s=st[k];
    const v=s.over>0.05?'<span class="chip bad">oscillates</span>':s.over>1e-3?'<span class="chip warn">slight overshoot</span>':s.err<0.02?'<span class="chip ok">accurate, bounded</span>':'<span class="chip warn">bounded, smeared</span>';
    return '<tr><td><span class="dot" style="background:'+SC[k].c+'"></span>'+SC[k].n+'</td><td class="n">'+fmt(s.err,3)+'</td><td class="n">'+(s.over>1e-3?fmt(s.over,3):'none')+'</td><td>'+v+'</td></tr>';}).join('');
}
redraws.push(drawSch);
$('sPe').addEventListener('input',drawSch);$('sN').addEventListener('input',drawSch);seg('sSch',drawSch,true);
})();
