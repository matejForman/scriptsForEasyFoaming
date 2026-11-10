const NUM=(function(){
'use strict';
const TAU=Math.PI*2;
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

/* ================= Ch 2A: quasi-1D duct, u_in = 1 m/s, A_in = 1 m2, Q = 1 m3/s ================= */
const A=x=>0.75+0.25*Math.cos(TAU*x);
const dA=x=>-0.25*TAU*Math.sin(TAU*x);
const uEx=x=>1/A(x);
const pEx=x=>0.5*(1-1/(A(x)*A(x)));          /* kinematic pressure, Bernoulli, p_in = 0 */
const gEx=x=>dA(x)/Math.pow(A(x),3);          /* dp/dx */
function simpson(f,a,b,n){n=n||16;const h=(b-a)/n;let s=f(a)+f(b);for(let i=1;i<n;i++)s+=f(a+i*h)*(i%2?4:2);return s*h/3;}
function duct(N){
  const dx=1/N,xf=[],xc=[],V=[],uc=[],pc=[];
  for(let f=0;f<=N;f++)xf.push(f*dx);
  for(let i=0;i<N;i++){
    const x0=xf[i],x1=xf[i+1],v=0.75*dx+0.25/TAU*(Math.sin(TAU*x1)-Math.sin(TAU*x0));
    V.push(v);xc.push((x0+x1)/2);
    uc.push(dx/v);                                        /* volume average of u (Q = 1) */
    pc.push(0.5-simpson(x=>0.5/A(x),x0,x1)/v);            /* volume average of p */
  }
  const pf=[],uf=[];
  for(let f=0;f<=N;f++){
    if(f===0||f===N){pf.push(pEx(xf[f]));uf.push(uEx(xf[f]));}
    else{pf.push(0.5*(pc[f-1]+pc[f]));uf.push(0.5*(uc[f-1]+uc[f]));}
  }
  const g=[];for(let i=0;i<N;i++)g.push((pf[i+1]-pf[i])/dx);
  const Af=xf.map(A);
  const Fex=Af.map((a,f)=>uEx(xf[f])*a);
  const Fint=Af.map((a,f)=>uf[f]*a);
  return {N,dx,xf,xc,V,uc,pc,g,pf,uf,Af,Fex,Fint};
}
function ductErr(d,field){
  const N=d.N,val=field==='u'?d.uc:field==='p'?d.pc:d.g,ex=field==='u'?uEx:field==='p'?pEx:gEx;
  const e=val.map((v,i)=>v-ex(d.xc[i]));
  let inter=0,bnd=0;
  e.forEach((v,i)=>{const a=Math.abs(v);if(i===0||i===N-1)bnd=Math.max(bnd,a);else inter=Math.max(inter,a);});
  return {e,inter,bnd,all:Math.max(inter,bnd)};
}

/* ================= Ch 2B: plane Poiseuille, cells across the gap ================= */
const CHP={H:0.02,um:0.15};
function channel(N){
  const H=CHP.H,um=CHP.um,dy=H/N,yf=[],yc=[],uc=[];
  const U=y=>4*um*(y*y/(2*H)-y*y*y/(3*H*H));
  for(let f=0;f<=N;f++)yf.push(f*dy);
  for(let i=0;i<N;i++){yc.push((yf[i]+yf[i+1])/2);uc.push((U(yf[i+1])-U(yf[i]))/dy);}
  const uex=y=>4*um*(y/H)*(1-y/H),dudy=y=>4*um/H*(1-2*y/H);
  let faceErr=0;for(let f=1;f<N;f++){faceErr=Math.max(faceErr,Math.abs((uc[f]-uc[f-1])/dy-dudy(yf[f])));}
  return {N,H,um,dy,yf,yc,uc,uex,dudy,wallExact:4*um/H,wallFV:uc[0]/(dy/2),faceErr};
}

/* ================= Ch 3/4: 1D steady convection-diffusion, FV assembly ================= */
function solveDense(A0,b0,N){
  const M=Float64Array.from(A0),x=Float64Array.from(b0);
  for(let k=0;k<N;k++){
    let p=k,mx=Math.abs(M[k*N+k]);
    for(let i=k+1;i<N;i++){const v=Math.abs(M[i*N+k]);if(v>mx){mx=v;p=i;}}
    if(p!==k){for(let j=0;j<N;j++){const t=M[k*N+j];M[k*N+j]=M[p*N+j];M[p*N+j]=t;}const t=x[k];x[k]=x[p];x[p]=t;}
    const d=M[k*N+k];
    for(let i=k+1;i<N;i++){const f=M[i*N+k]/d;if(f===0)continue;for(let j=k;j<N;j++)M[i*N+j]-=f*M[k*N+j];x[i]-=f*x[k];}
  }
  for(let i=N-1;i>=0;i--){let s=x[i];for(let j=i+1;j<N;j++)s-=M[i*N+j]*x[j];x[i]=s/M[i*N+i];}
  return x;
}
/* F = flux u*A (flow in +x), D = Gamma*A/dx.  Dirichlet phi=pl at west, pr at east.  Convective flux on a boundary face uses the patch value. */
function assemble(N,F,D,scheme,pl,pr){
  pl=pl===undefined?0:pl;pr=pr===undefined?1:pr;
  const Am=new Float64Array(N*N),b=new Float64Array(N);
  const lin=f=>f===0?{c:[],k:pl}:f===N?{c:[],k:pr}:{c:[[f-1,0.5],[f,0.5]],k:0};
  const conv=f=>{
    if(f===0||scheme==='linear')return lin(f);
    if(scheme==='upwind')return {c:[[f-1,1]],k:0};
    const c=f-1,a=lin(c+1),w=lin(c),o={c:[[c,1]],k:0};     /* linearUpwind: phi_C + grad_C . (x_f - x_C), Gauss-linear gradient */
    a.c.forEach(t=>o.c.push([t[0],0.5*t[1]]));o.k+=0.5*a.k;
    w.c.forEach(t=>o.c.push([t[0],-0.5*t[1]]));o.k-=0.5*w.k;
    return o;
  };
  const add=(row,form,m)=>{form.c.forEach(t=>{Am[row*N+t[0]]+=m*t[1];});b[row]-=m*form.k;};
  for(let i=0;i<N;i++){
    add(i,conv(i+1),F);add(i,conv(i),-F);
    const De=(i+1===N)?2*D:D,Dw=(i===0)?2*D:D;
    Am[i*N+i]+=De;if(i+1<N)Am[i*N+i+1]-=De;else b[i]+=De*pr;
    Am[i*N+i]+=Dw;if(i>0)Am[i*N+i-1]-=Dw;else b[i]+=Dw*pl;
  }
  return {A:Am,b};
}
function cdExact(Pe,x){if(Pe<1e-6)return x;return (Math.exp(Pe*(x-1))-Math.exp(-Pe))/(1-Math.exp(-Pe));}
function cdSolve(N,Pe,scheme){const dx=1/N,{A:Am,b}=assemble(N,1,1/(Pe*dx),scheme);return solveDense(Am,b,N);}
function cdStats(N,Pe,scheme){
  const x=cdSolve(N,Pe,scheme);let err=0,mx=-1e9,mn=1e9;
  for(let i=0;i<N;i++){err=Math.max(err,Math.abs(x[i]-cdExact(Pe,(i+0.5)/N)));mx=Math.max(mx,x[i]);mn=Math.min(mn,x[i]);}
  return {x,err,over:Math.max(0,mx-1,-mn)};
}
function assemble2D(nx,ny,F,D,scheme){
  const {A:Ax,b:bx}=assemble(nx,F,D,scheme==='linearUpwind'?'upwind':scheme);
  const N=nx*ny,Am=new Float64Array(N*N),b=new Float64Array(N);
  for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){
    const c=j*nx+i;b[c]=bx[i];
    for(let k=0;k<nx;k++)Am[c*N+j*nx+k]=Ax[i*nx+k];
    if(j>0){Am[c*N+c-nx]-=D;Am[c*N+c]+=D;}
    if(j<ny-1){Am[c*N+c+nx]-=D;Am[c*N+c]+=D;}
  }
  return {A:Am,b,N};
}

/* ================= Ch 4: 2D Poisson on n x n cells, structured 5-point storage ================= */
function poisson(n){
  const N=n*n,L={n,N,aP:new Float64Array(N),aW:new Float64Array(N),aE:new Float64Array(N),aS:new Float64Array(N),aN:new Float64Array(N),b:new Float64Array(N)};
  const h2=1/(n*n);
  for(let j=0;j<n;j++)for(let i=0;i<n;i++){
    const c=j*n+i;let d=0;
    if(i>0){L.aW[c]=-1;d+=1;}else d+=2;
    if(i<n-1){L.aE[c]=-1;d+=1;}else d+=2;
    if(j>0){L.aS[c]=-1;d+=1;}else d+=2;
    if(j<n-1){L.aN[c]=-1;d+=1;}else d+=2;
    L.aP[c]=d;L.b[c]=h2;
  }
  return L;
}
function coarsen(F){
  const nf=F.n,nc=nf/2,N=nc*nc,C={n:nc,N,aP:new Float64Array(N),aW:new Float64Array(N),aE:new Float64Array(N),aS:new Float64Array(N),aN:new Float64Array(N),b:new Float64Array(N)};
  for(let J=0;J<nc;J++)for(let I=0;I<nc;I++){
    const c=J*nc+I,f00=2*J*nf+2*I,f10=f00+1,f01=f00+nf,f11=f01+1;
    C.aW[c]=F.aW[f00]+F.aW[f01];C.aE[c]=F.aE[f10]+F.aE[f11];
    C.aS[c]=F.aS[f00]+F.aS[f10];C.aN[c]=F.aN[f01]+F.aN[f11];
    C.aP[c]=F.aP[f00]+F.aP[f10]+F.aP[f01]+F.aP[f11]
      +F.aE[f00]+F.aW[f10]+F.aE[f01]+F.aW[f11]+F.aN[f00]+F.aS[f01]+F.aN[f10]+F.aS[f11];
  }
  return C;
}
function matvec(L,x,y){
  const n=L.n;
  for(let j=0;j<n;j++)for(let i=0;i<n;i++){
    const c=j*n+i;let s=L.aP[c]*x[c];
    if(i>0)s+=L.aW[c]*x[c-1];if(i<n-1)s+=L.aE[c]*x[c+1];
    if(j>0)s+=L.aS[c]*x[c-n];if(j<n-1)s+=L.aN[c]*x[c+n];
    y[c]=s;
  }
}
function gs(L,x,b,sweeps){
  const n=L.n;
  for(let s=0;s<sweeps;s++)for(let j=0;j<n;j++)for(let i=0;i<n;i++){
    const c=j*n+i;let r=b[c];
    if(i>0)r-=L.aW[c]*x[c-1];if(i<n-1)r-=L.aE[c]*x[c+1];
    if(j>0)r-=L.aS[c]*x[c-n];if(j<n-1)r-=L.aN[c]*x[c+n];
    x[c]=r/L.aP[c];
  }
}
function resid(L,x,b,r){matvec(L,x,r);for(let i=0;i<L.N;i++)r[i]=b[i]-r[i];}
/* OpenFOAM's normalised residual (lduMatrix::solver::normFactor) */
function normRes(L,x,b){
  const N=L.N,wA=new Float64Array(N);matvec(L,x,wA);
  let xr=0;for(let i=0;i<N;i++)xr+=x[i];xr/=N;
  let nf=0,sr=0;
  for(let i=0;i<N;i++){
    const rs=L.aP[i]+L.aW[i]+L.aE[i]+L.aS[i]+L.aN[i],pA=xr*rs;
    nf+=Math.abs(wA[i]-pA)+Math.abs(b[i]-pA);sr+=Math.abs(b[i]-wA[i]);
  }
  return sr/(nf+1e-20);
}
const dot=(a,b)=>{let s=0;for(let i=0;i<a.length;i++)s+=a[i]*b[i];return s;};

/* diagonal incomplete Cholesky */
function dicSetup(L){
  const n=L.n,rD=new Float64Array(L.N);
  for(let j=0;j<n;j++)for(let i=0;i<n;i++){
    const c=j*n+i;let d=L.aP[c];
    if(i>0)d-=L.aW[c]*L.aW[c]*rD[c-1];   /* symmetric: upper(W->c) = aW[c]; rD holds the reciprocal */
    if(j>0)d-=L.aS[c]*L.aS[c]*rD[c-n];
    rD[c]=1/d;
  }
  return rD;
}
function dicApply(L,rD,r,w){
  const n=L.n,N=L.N;
  for(let c=0;c<N;c++)w[c]=rD[c]*r[c];
  for(let j=0;j<n;j++)for(let i=0;i<n;i++){const c=j*n+i;let s=0;if(i>0)s+=L.aW[c]*w[c-1];if(j>0)s+=L.aS[c]*w[c-n];w[c]-=rD[c]*s;}
  for(let j=n-1;j>=0;j--)for(let i=n-1;i>=0;i--){const c=j*n+i;let s=0;if(i<n-1)s+=L.aE[c]*w[c+1];if(j<n-1)s+=L.aN[c]*w[c+n];w[c]-=rD[c]*s;}
}

/* geometric multigrid V-cycle with scaled correction (illustration of the GAMG idea) */
function buildLevels(n){const lv=[poisson(n)];while(lv[lv.length-1].n>4)lv.push(coarsen(lv[lv.length-1]));return lv;}
function restrictSum(Lf,r,rc){
  const nf=Lf.n,nc=nf/2;
  for(let J=0;J<nc;J++)for(let I=0;I<nc;I++){const f=2*J*nf+2*I;rc[J*nc+I]=r[f]+r[f+1]+r[f+nf]+r[f+nf+1];}
}
function prolong(Lf,ec,c){
  const nf=Lf.n,nc=nf/2;
  for(let j=0;j<nf;j++)for(let i=0;i<nf;i++)c[j*nf+i]=ec[(j>>1)*nc+(i>>1)];
}
function denseOf(L){
  const N=L.N,M=new Float64Array(N*N),n=L.n;
  for(let j=0;j<n;j++)for(let i=0;i<n;i++){const c=j*n+i;M[c*N+c]=L.aP[c];
    if(i>0)M[c*N+c-1]=L.aW[c];if(i<n-1)M[c*N+c+1]=L.aE[c];if(j>0)M[c*N+c-n]=L.aS[c];if(j<n-1)M[c*N+c+n]=L.aN[c];}
  return M;
}
function vcycle(lv,l,x,b,opt,tr){
  const L=lv[l];
  if(l===lv.length-1){
    const e=solveDense(denseOf(L),b,L.N);x.set(e);
    if(tr)tr.bottom={r:Float64Array.from(b),e:Float64Array.from(x)};
    return;
  }
  const x0=Float64Array.from(x);
  gs(L,x,b,opt.pre);
  const r=new Float64Array(L.N);resid(L,x,b,r);
  if(tr)tr.down[l]=Float64Array.from(r);
  const C=lv[l+1],rc=new Float64Array(C.N),ec=new Float64Array(C.N);
  restrictSum(L,r,rc);
  vcycle(lv,l+1,ec,rc,opt,tr);
  const c=new Float64Array(L.N),Ac=new Float64Array(L.N);
  prolong(L,ec,c);matvec(L,c,Ac);
  const den=dot(c,Ac),al=den>0?dot(r,c)/den:1;
  for(let i=0;i<L.N;i++)x[i]+=al*c[i];
  gs(L,x,b,opt.post);
  if(tr){const e=new Float64Array(L.N);for(let i=0;i<L.N;i++)e[i]=x[i]-x0[i];tr.up[l]=e;}
}

/* uniform solver interface: {step(), x, res()} */
function makeSolver(kind,n,x0){
  const L0=poisson(n),N=L0.N,x=Float64Array.from(x0),b=L0.b;
  const S={kind,n,x,L:L0,iter:0,res(){return normRes(L0,x,b);}};
  if(kind==='gs'){S.step=()=>{gs(L0,x,b,1);S.iter++;};}
  else if(kind==='pcg'||kind==='cg'){
    const rD=kind==='pcg'?dicSetup(L0):null;
    const r=new Float64Array(N),z=new Float64Array(N),p=new Float64Array(N),w=new Float64Array(N);
    resid(L0,x,b,r);
    const pre=()=>{if(rD)dicApply(L0,rD,r,z);else z.set(r);};
    pre();p.set(z);let rho=dot(r,z);
    S.step=()=>{
      matvec(L0,p,w);const al=rho/dot(p,w);
      for(let i=0;i<N;i++){x[i]+=al*p[i];r[i]-=al*w[i];}
      pre();const rn=dot(r,z),be=rn/rho;rho=rn;
      for(let i=0;i<N;i++)p[i]=z[i]+be*p[i];
      S.iter++;
    };
  }else if(kind==='gamg'){
    const lv=buildLevels(n);S.levels=lv;S.opt={pre:1,post:2};
    S.step=(tr)=>{vcycle(lv,0,x,b,S.opt,tr);S.iter++;};
  }
  return S;
}
function reference(n){
  const L=poisson(n),x=new Float64Array(L.N),S=makeSolver('pcg',n,x);
  for(let i=0;i<4*n+50;i++)S.step();
  return S.x;
}
function randomStart(n,seed){const r=mulberry(seed||7),x=new Float64Array(n*n);for(let i=0;i<x.length;i++)x[i]=(r()-0.5)*0.02;return x;}
function runSolver(kind,n,x0,tol,relTol,maxIter){
  const S=makeSolver(kind,n,x0),hist=[S.res()],r0=hist[0];
  const t0=(typeof performance!=='undefined'?performance.now():Date.now());
  while(S.iter<maxIter){
    const cur=hist[hist.length-1];
    if(cur<tol||(relTol>0&&cur/r0<relTol))break;
    S.step();hist.push(S.res());
  }
  const t1=(typeof performance!=='undefined'?performance.now():Date.now());
  return {S,hist,iters:S.iter,init:r0,final:hist[hist.length-1],ms:t1-t0};
}

return {TAU,mulberry,A,dA,uEx,pEx,gEx,duct,ductErr,channel,CHP,solveDense,assemble,assemble2D,cdExact,cdSolve,cdStats,
  poisson,coarsen,matvec,gs,resid,normRes,dicSetup,dicApply,buildLevels,vcycle,makeSolver,reference,randomStart,runSolver,dot};
})();
if(typeof module!=='undefined')module.exports=NUM;
