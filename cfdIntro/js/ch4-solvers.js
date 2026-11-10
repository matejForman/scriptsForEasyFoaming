/* ================= Ch4 matrix, solver, V-cycle ================= */
(function(){
'use strict';
const {$,cv,seg,segVal,fmt,FONT}=UI;
const INK='#15202b',MUT='#566577',BLUE='#1f5fbf',RED='#d4432f',GRN='#1f8a63',LINE='#d8e0e8';
const redraws=UI.redraws;

/* ---------- matrix ---------- */
const M={sel:2,mat:null};
function build(){
  const mode=segVal('mxMode'),sch=segVal('mxSch');
  const F=sch==='diff'?0:1,Dd=sch==='diff'?1:0.25,sc=sch==='diff'?'linear':(sch==='linearUpwind'?'upwind':sch);
  let r;
  if(mode==='1d'){const N=+$('mxN').value;r=NUM.assemble(N,F,Dd,sc,0,1);r.N=N;r.nx=N;r.ny=1;}
  else{r=NUM.assemble2D(5,4,F,Dd,sc);r.nx=5;r.ny=4;}
  r.mode=mode;r.sch=sch;r.F=F;r.D=Dd;return r;
}
const nm=(m,i)=>m.ny===1?'cell '+i:'cell ('+(i%m.nx)+','+Math.floor(i/m.nx)+')';
function drawMatrix(){
  const m=M.mat=build(),N=m.N,A=m.A;
  $('mxNwrap').style.display=m.mode==='1d'?'':'none';$('mxNo').textContent=$('mxN').value;
  if(M.sel>=N)M.sel=Math.min(2,N-1);
  /* table */
  const compact=m.mode==='2d';
  let h='<table class="mt'+(compact?' compact':'')+'" aria-label="Coefficient matrix"><thead><tr><th></th>';
  for(let j=0;j<N;j++)h+='<th>'+j+'</th>';h+='<th>b</th></tr></thead><tbody>';
  for(let i=0;i<N;i++){
    h+='<tr data-r="'+i+'"'+(i===M.sel?' class="sel"':'')+'><th>'+i+'</th>';
    for(let j=0;j<N;j++){const v=A[i*N+j],z=Math.abs(v)<1e-12;
      const cls=z?'z':(i===j?'d':(j>i?'u':'l'))+(i!==j&&v>0?' pos':'');
      h+='<td class="'+cls+'" data-r="'+i+'">'+(z?(compact?'':'·'):v.toFixed(2))+'</td>';}
    h+='<td class="b">'+(Math.abs(m.b[i])<1e-12?'0':m.b[i].toFixed(2))+'</td></tr>';
  }
  $('mxTbl').innerHTML=h+'</tbody></table>';
  drawMesh(m);inspect(m);
}
function drawMesh(m){
  const svg=$('mxMesh'),sel=M.sel,nb=new Set();
  for(let j=0;j<m.N;j++)if(j!==sel&&Math.abs(m.A[sel*m.N+j])>1e-12)nb.add(j);
  let s='';
  if(m.ny===1){const w=Math.min(84,620/m.N),H=70;svg.setAttribute('viewBox','0 0 640 100');
    for(let i=0;i<m.N;i++){const x=10+i*w;s+='<rect data-r="'+i+'" class="cell'+(i===sel?' sel':nb.has(i)?' nb':'')+'" x="'+x+'" y="14" width="'+w+'" height="'+H+'"/><text x="'+(x+w/2)+'" y="55" text-anchor="middle">'+i+'</text>';}
    s+='<text x="10" y="98">west boundary: φ fixed · east boundary: φ fixed</text>';}
  else{const w=64;svg.setAttribute('viewBox','0 0 640 '+(m.ny*w+24));
    for(let c=0;c<m.N;c++){const i=c%m.nx,j=Math.floor(c/m.nx),x=10+i*w,y=10+(m.ny-1-j)*w;
      s+='<rect data-r="'+c+'" class="cell'+(c===sel?' sel':nb.has(c)?' nb':'')+'" x="'+x+'" y="'+y+'" width="'+w+'" height="'+w+'"/><text x="'+(x+w/2)+'" y="'+(y+w/2+4)+'" text-anchor="middle">'+c+'</text>';}}
  svg.innerHTML=s;
}
function inspect(m){
  const N=m.N,A=m.A,i=M.sel;
  const ent=[];for(let j=0;j<N;j++){const v=A[i*N+j];if(Math.abs(v)>1e-12)ent.push([j,v]);}
  let eq='';ent.forEach(([j,v],k)=>{const cls=j===i?'d':(j>i?'u':'l');
    eq+=(k?(v>=0?' + ':' − '):(v<0?'−':''))+'<span class="tk '+cls+'">'+Math.abs(v).toFixed(2)+' φ<sub>'+j+'</sub></span>';});
  eq+=' = <span class="tk b">'+(Math.abs(m.b[i])<1e-12?'0':m.b[i].toFixed(2))+'</span>';
  /* LDU */
  const faces=[];for(let a=0;a<N;a++)for(let b=a+1;b<N;b++){const u=A[a*N+b],l=A[b*N+a];if(Math.abs(u)>1e-12||Math.abs(l)>1e-12)faces.push({o:a,n:b,u,l});}
  let sym=true,dom=true,strict=false;
  for(let r=0;r<N;r++){let s=0;for(let c=0;c<N;c++){if(c!==r){s+=Math.abs(A[r*N+c]);if(Math.abs(A[r*N+c]-A[c*N+r])>1e-12)sym=false;}}
    const d=Math.abs(A[r*N+r]);if(d<s-1e-12)dom=false;if(d>s+1e-12)strict=true;}
  const mine=faces.map((f,k)=>({f,k})).filter(o=>o.f.o===i||o.f.n===i);
  const cut=a=>a.length>9?a.slice(0,9).join(', ')+', …':a.join(', ');
  const nz=ent.length-1;
  $('mxInsp').innerHTML='<h5>'+nm(m,i)+'</h5><div class="eqn">'+eq+'</div>'
   +'<p style="margin:0 0 6px"><span class="tk d">Diagonal '+A[i*N+i].toFixed(2)+'</span> (collects all faces of this cell), '+nz+' off-diagonal entr'+(nz===1?'y':'ies')+', one per neighbour: <span class="tk l">lower</span> for neighbours with a smaller index, <span class="tk u">upper</span> for larger.</p>'
   +'<h5 style="margin-top:10px">OpenFOAM LDU storage</h5>'
   +'<div class="arr"><span class="tk d">diag [ '+cut(Array.from({length:N},(_,k)=>A[k*N+k].toFixed(2)))+' ]</span></div>'
   +'<div class="arr"><span class="tk u">upper[ '+cut(faces.map(f=>f.u.toFixed(2)))+' ]</span></div>'
   +(sym?'<div class="arr"><span class="tk l">lower = upper (symmetric, not stored)</span></div>':'<div class="arr"><span class="tk l">lower[ '+cut(faces.map(f=>f.l.toFixed(2)))+' ]</span></div>')
   +'<div class="arr">owner [ '+cut(faces.map(f=>f.o))+' ]</div>'
   +'<div class="arr">neighbour[ '+cut(faces.map(f=>f.n))+' ]</div>'
   +'<p style="margin:8px 0 0">Faces touching '+nm(m,i)+': '+mine.map(o=>'#'+o.k+' ('+o.f.o+'→'+o.f.n+')').join(', ')+'</p>'
   +'<p style="margin:8px 0 0"><span class="chip '+(sym?'ok':'warn')+'">'+(sym?'symmetric':'asymmetric')+'</span> <span class="chip '+(dom?(strict?'ok':'warn'):'bad')+'">'+(dom?'diagonally dominant':'not diagonally dominant')+'</span></p>'
   +(m.sch==='linearUpwind'?'<p class="note" style="margin:8px 0 0">linearUpwind: matrix shown is the upwind one. The gradient correction is explicit and lives in b.</p>':'');
}
function selRow(e){const t=e.target.closest('[data-r]');if(!t)return;M.sel=+t.dataset.r;drawMatrix();}
$('mxTbl').addEventListener('click',selRow);$('mxMesh').addEventListener('click',selRow);
$('mxTbl').addEventListener('mouseover',e=>{const t=e.target.closest('[data-r]');if(!t)return;const r=+t.dataset.r;if(r!==M.sel){M.sel=r;drawMatrix();}});
seg('mxMode',()=>{M.sel=2;drawMatrix();});seg('mxSch',drawMatrix);$('mxN').addEventListener('input',drawMatrix);
redraws.push(drawMatrix);

/* ---------- solver demo ---------- */
const NAME={gs:'smoothSolver',pcg:'DICPCG',gamg:'GAMG'},COL={gs:RED,pcg:BLUE,gamg:GRN};
const LBL={gs:'smoothSolver (GaussSeidel)',pcg:'PCG (DIC)',gamg:'GAMG'};
const S={sol:null,hist:[],cmp:null,ref:{}};
const ec=cv('cvErr'),rc=cv('cvRes');
const prm=()=>({kind:$('svS').value,n:+$('svN').value,tol:+$('svT').value,rel:+$('svR').value,max:+$('svM').value,init:$('svI').value});
function x0(p){return p.init==='rand'?NUM.randomStart(p.n,7):new Float64Array(p.n*p.n);}
function reset(){const p=prm();S.sol=NUM.makeSolver(p.kind,p.n,x0(p));S.hist=[S.sol.res()];S.cmp=null;S.stop='';$('svCmpWrap').hidden=true;redrawSolver();}
function ref(n){return S.ref[n]||(S.ref[n]=NUM.reference(n));}
function done(p){const h=S.hist,c=h[h.length-1];if(c<p.tol)return 'converged: residual below tolerance';if(p.rel>0&&c/h[0]<p.rel)return 'converged: relTol reached';if(S.sol.iter>=p.max)return 'stopped: maxIter reached';return '';}
function adv(k,full){const p=prm();let i=0;
  while(i<(full?1e9:k)){S.stop=done(p);if(S.stop)break;S.sol.step();S.hist.push(S.sol.res());i++;}
  S.stop=done(p);S.cmp=null;redrawSolver();}
function redrawSolver(){drawErr();drawRes();logLine();}
function colour(v,s){const t=Math.max(-1,Math.min(1,v/s)),a=Math.abs(t);
  const c=t>=0?[212,67,47]:[31,95,191];return 'rgb('+Math.round(255-(255-c[0])*a)+','+Math.round(255-(255-c[1])*a)+','+Math.round(255-(255-c[2])*a)+')';}
function field(cvo,arr,n,scaleTo){const g=cvo.g,w=cvo.w/n;g.clearRect(0,0,cvo.w,cvo.h);let s=scaleTo;if(!s){s=1e-30;for(let i=0;i<arr.length;i++)s=Math.max(s,Math.abs(arr[i]));}
  for(let j=0;j<n;j++)for(let i=0;i<n;i++){g.fillStyle=colour(arr[j*n+i],s);g.fillRect(i*w,(n-1-j)*w,w+0.6,w+0.6);}}
function drawErr(){const p=prm(),r=ref(p.n),x=S.sol.x,e=new Float64Array(x.length);
  let mx=0;for(let i=0;i<e.length;i++){e[i]=x[i]-r[i];}
  if(S.errScale===undefined||S.errScaleFor!==p.n+p.init+p.kind){S.errScaleFor=p.n+p.init+p.kind;S.errScale=0;}
  if(S.sol.iter===0){let m=1e-30;for(let i=0;i<e.length;i++)m=Math.max(m,Math.abs(e[i]));S.errScale=m;}
  field(ec,e,p.n);
  const g=ec.g;g.strokeStyle=LINE;g.lineWidth=1;g.strokeRect(0.5,0.5,ec.w-1,ec.h-1);}
function drawRes(){
  const p=prm(),g=rc.g,W=rc.w,H=rc.h,x0=62,x1=W-14,y0=H-44,y1=14;
  g.clearRect(0,0,W,H);
  const sets=S.cmp?S.cmp.map(c=>({k:c.k,h:c.r.hist})):[{k:p.kind,h:S.hist}];
  let mx=1e-30,mn=1,it=1;sets.forEach(s=>{s.h.forEach(v=>{if(v>0){mx=Math.max(mx,v);mn=Math.min(mn,v);}});it=Math.max(it,s.h.length-1);});
  const top=Math.ceil(Math.log10(mx)+1e-9),bot=Math.floor(Math.log10(Math.min(mn,p.tol)))-0;
  const lt=Math.max(1,Math.ceil(Math.log10(Math.max(it,10))));
  const X=i=>x0+Math.log10(i+1)/Math.log10(Math.pow(10,lt)+1)*(x1-x0),Y=v=>y1+(top-Math.log10(Math.max(v,1e-300)))/(top-bot)*(y0-y1);
  g.strokeStyle=LINE;g.lineWidth=1;g.fillStyle=MUT;g.font=FONT;g.textAlign='right';
  for(let e=bot;e<=top;e++){g.beginPath();g.moveTo(x0,Y(Math.pow(10,e)));g.lineTo(x1,Y(Math.pow(10,e)));g.stroke();g.fillText('1e'+e,x0-6,Y(Math.pow(10,e))+4);}
  g.textAlign='center';for(let e=0;e<=lt;e++){const i=Math.pow(10,e)-1;g.beginPath();g.moveTo(X(i),y0);g.lineTo(X(i),y1);g.stroke();g.fillText(Math.pow(10,e),X(i),y0+16);}
  g.fillText('iterations (log)',(x0+x1)/2,y0+34);
  g.save();g.translate(14,(y0+y1)/2);g.rotate(-Math.PI/2);g.fillText('normalised residual',0,0);g.restore();
  g.setLineDash([5,4]);g.strokeStyle=INK;g.beginPath();g.moveTo(x0,Y(p.tol));g.lineTo(x1,Y(p.tol));g.stroke();g.setLineDash([]);
  g.textAlign='left';g.fillStyle=INK;g.fillText('tolerance',x0+6,Y(p.tol)-5);
  sets.forEach((s,si)=>{g.strokeStyle=COL[s.k];g.lineWidth=2.2;g.beginPath();s.h.forEach((v,i)=>{i?g.lineTo(X(i),Y(v)):g.moveTo(X(i),Y(v));});g.stroke();
    if(S.cmp){g.fillStyle=COL[s.k];g.fillText('● '+LBL[s.k],x1-190,y1+16+si*16);}
    const last=s.h.length-1;g.fillStyle=COL[s.k];g.beginPath();g.arc(X(last),Y(s.h[last]),3.5,0,7);g.fill();});
}
function logLine(){const p=prm(),h=S.hist,sol=S.sol;
  $('svLog').textContent=NAME[p.kind]+':  Solving for phi, Initial residual = '+h[0].toExponential(6)+', Final residual = '+h[h.length-1].toExponential(6)+', No Iterations '+sol.iter+(S.stop?'\n→ '+S.stop:'');}
$('svStep').addEventListener('click',()=>adv(1));
$('svStep10').addEventListener('click',()=>adv(10));
$('svRun').addEventListener('click',()=>adv(0,true));
$('svReset').addEventListener('click',reset);
['svS','svN','svI','svT','svR','svM'].forEach(id=>$(id).addEventListener('change',()=>{reset();vcRebuild();}));
$('svCmp').addEventListener('click',()=>{const p=prm();S.cmp=['gs','pcg','gamg'].map(k=>({k,r:NUM.runSolver(k,p.n,x0(p),p.tol,p.rel,p.max)}));
  $('svTbl').querySelector('tbody').innerHTML=S.cmp.map(c=>'<tr><td><span class="dot" style="background:'+COL[c.k]+'"></span>'+LBL[c.k]+'</td><td class="n">'+p.n+'×'+p.n+'</td><td class="n">'+c.r.iters+(c.r.iters>=p.max?' (maxIter)':'')+'</td><td class="n">'+c.r.final.toExponential(2)+'</td><td class="n">'+c.r.ms.toFixed(1)+' ms</td></tr>').join('');
  $('svCmpWrap').hidden=false;drawRes();});
redraws.push(()=>{if(S.sol)redrawSolver();});

/* ---------- V-cycle ---------- */
const V={tr:null,lv:null,step:0,steps:0};
function vcRebuild(){
  const p=prm(),n=p.n,x=NUM.randomStart(n,7),sol=NUM.makeSolver('gamg',n,x);
  const tr={down:[],up:[]};NUM.vcycle(sol.levels,0,sol.x,sol.L.b,sol.opt,tr);
  V.tr=tr;V.lv=sol.levels;V.nl=V.lv.length;V.steps=2*V.nl-1;V.step=0;vcDraw();
}
function stepInfo(s){const nl=V.nl;
  if(s<nl-1)return {kind:'down',l:s,txt:'Level '+s+' ('+V.lv[s].n+'×'+V.lv[s].n+'): smooth, compute the residual, restrict it to the coarser mesh.'};
  if(s===nl-1)return {kind:'bot',l:nl-1,txt:'Coarsest level ('+V.lv[nl-1].n+'×'+V.lv[nl-1].n+'): solve exactly.'};
  const l=2*nl-2-s;return {kind:'up',l,txt:'Level '+l+': interpolate the coarse correction back, add it, smooth again.'};}
function vcDraw(){
  const nl=V.nl,s=V.step,grid=$('vcGrid');
  if(!grid.children.length||grid.dataset.nl!==String(nl)+':'+V.lv[0].n){
    grid.dataset.nl=nl+':'+V.lv[0].n;let h='<span></span><span class="colh">residual going down</span><span class="colh">correction coming up</span>';
    for(let l=0;l<nl;l++){h+='<span class="lv">level '+l+'<br>'+V.lv[l].n+'×'+V.lv[l].n+'</span><canvas width="'+(V.lv[l].n*Math.max(1,Math.floor(150/V.lv[l].n)))+'" height="'+(V.lv[l].n*Math.max(1,Math.floor(150/V.lv[l].n)))+'" data-l="'+l+'" data-c="r"></canvas><canvas width="'+(V.lv[l].n*Math.max(1,Math.floor(150/V.lv[l].n)))+'" height="'+(V.lv[l].n*Math.max(1,Math.floor(150/V.lv[l].n)))+'" data-l="'+l+'" data-c="e"></canvas>';}
    grid.innerHTML=h;}
  const info=stepInfo(s);$('vcLabel').textContent='Step '+(s+1)+' of '+V.steps+': '+info.txt;
  grid.querySelectorAll('canvas').forEach(c=>{
    const l=+c.dataset.l,isR=c.dataset.c==='r',g=c.getContext('2d'),n=V.lv[l].n;
    let idxShown;if(isR)idxShown=l<=Math.min(s,nl-1);else idxShown=s>=(l===nl-1?nl-1:2*nl-2-l);
    const cur=(isR&&((info.kind==='down'||info.kind==='bot')&&info.l===l))||(!isR&&((info.kind==='up'||info.kind==='bot')&&info.l===l));
    c.classList.toggle('cur',cur);
    g.clearRect(0,0,c.width,c.height);
    if(!idxShown){g.fillStyle='#f4f6f9';g.fillRect(0,0,c.width,c.height);return;}
    const arr=l===nl-1?(isR?V.tr.bottom.r:V.tr.bottom.e):(isR?V.tr.down[l]:V.tr.up[l]);
    let m=1e-30;for(let i=0;i<arr.length;i++)m=Math.max(m,Math.abs(arr[i]));
    const w=c.width/n;for(let j=0;j<n;j++)for(let i=0;i<n;i++){g.fillStyle=colour(arr[j*n+i],m);g.fillRect(i*w,(n-1-j)*w,w+0.5,w+0.5);}
  });
}
$('vcNext').addEventListener('click',()=>{V.step=Math.min(V.steps-1,V.step+1);vcDraw();});
$('vcPrev').addEventListener('click',()=>{V.step=Math.max(0,V.step-1);vcDraw();});
$('gamgAdv').addEventListener('toggle',()=>{if($('gamgAdv').open&&!V.tr)vcRebuild();});
reset();
})();
