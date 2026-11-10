/* Popover logic, chapter navigation, equation-term explanations, shared helpers (window.UI). */
/* ================= UI: helpers, glossary, nav ================= */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const G=window.GLOSSARY;
const pop=$('pop');let popFor=null;
function openPop(el){
  const g=G[el.getAttribute('data-g')];if(!g)return;
  if(popFor===el&&!pop.hidden){closePop();return;}
  if(popFor)popFor.classList.remove('on');
  popFor=el;el.classList.add('on');
  let h='<button class="x" aria-label="Close">×</button><h4>'+g.h+'</h4>'+g.p.map(s=>'<p>'+s+'</p>').join('');
  if(g.l)h+='<div class="lk">'+g.l.map(l=>'<a href="'+l.u+'" target="_blank" rel="noopener">'+l.t+' ↗</a>').join('')+'</div>';
  pop.innerHTML=h;pop.hidden=false;
  const r=el.getBoundingClientRect(),pw=pop.offsetWidth;
  let left=r.left+window.scrollX;
  left=Math.max(window.scrollX+12,Math.min(left,window.scrollX+document.documentElement.clientWidth-pw-12));
  pop.style.left=left+'px';pop.style.top=(r.bottom+window.scrollY+8)+'px';
  pop.querySelector('.x').addEventListener('click',closePop);
}
function closePop(){pop.hidden=true;if(popFor){popFor.classList.remove('on');popFor.focus&&popFor.focus();}popFor=null;}
document.addEventListener('click',e=>{
  const t=e.target.closest('[data-g]');
  if(t){openPop(t);return;}
  if(!pop.hidden&&!pop.contains(e.target)){pop.hidden=true;if(popFor)popFor.classList.remove('on');popFor=null;}
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!pop.hidden)closePop();});

/* nav highlight */
const links=[...document.querySelectorAll('#navlinks a')];
const secs=links.map(a=>$(a.dataset.ch));
function navUpdate(){
  const y=window.scrollY+90;let cur=0;
  secs.forEach((s,i)=>{if(s&&s.offsetTop<=y)cur=i;});
  links.forEach((a,i)=>a.setAttribute('aria-current',i===cur?'true':'false'));
}
window.addEventListener('scroll',navUpdate,{passive:true});window.addEventListener('resize',navUpdate);navUpdate();

/* equation terms */
const EQ={
ddt:['Local rate of change','How fast φ changes in a cell with time. Zero in a steady-state run. Implicit Euler discretisation adds V/Δt to the matrix diagonal.'],
conv:['Convection (advection)','Transport of φ by the flow. By the Gauss theorem it becomes Σ F<sub>f</sub> φ<sub>f</sub>, face flux times face value, so the face-value scheme (chapter 3) decides accuracy and boundedness. In the momentum equation U transports itself, which makes the equation non-linear; OpenFOAM freezes the flux phi from the previous iteration.'],
diff:['Diffusion','Mixing by molecular (ν, α) or turbulent (ν<sub>t</sub>) effects, scaled by Γ. It smooths gradients and makes the problem elliptic. Discretised as Σ Γ<sub>f</sub> (∇φ)<sub>f</sub>·S<sub>f</sub>, with the face gradient built from the two neighbouring cell values.'],
src:['Source','Everything not captured by the other terms: pressure gradient, buoyancy, heat release, momentum sinks. Explicit parts (fvc) go to the right-hand side; parts that decrease with growing φ can be treated implicitly on the diagonal, which improves stability.']
};
function eqPick(k){
  document.querySelectorAll('.tm').forEach(b=>b.classList.toggle('on',b.dataset.t===k));
  document.querySelectorAll('#eqcode .cl').forEach(s=>{s.style.background=s.dataset.t===k?'var(--hl)':'';});
  $('eqdetail').innerHTML='<p><b>'+EQ[k][0]+'</b></p><p>'+EQ[k][1]+'</p>';
}
document.querySelectorAll('.tm').forEach(b=>b.addEventListener('click',()=>eqPick(b.dataset.t)));
eqPick('conv');

/* shared helpers */
window.UI={$,
  cv(id){const c=$(id),w=+c.getAttribute('width'),h=+c.getAttribute('height'),d=Math.min(window.devicePixelRatio||1,2);c.width=w*d;c.height=h*d;c.style.aspectRatio=w+'/'+h;const g=c.getContext('2d');g.setTransform(d,0,0,d,0,0);return {c,g,w,h};},
  seg(id,cb,multi){const el=$(id);el.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
    if(multi){const on=b.getAttribute('aria-pressed')==='true';if(on&&el.querySelectorAll('[aria-pressed="true"]').length===1)return;b.setAttribute('aria-pressed',on?'false':'true');}
    else el.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b?'true':'false'));cb(b.dataset.v,el);});},
  segVal(id){const b=$(id).querySelector('[aria-pressed="true"]');return b&&b.dataset.v;},
  segVals(id){return [...$(id).querySelectorAll('[aria-pressed="true"]')].map(b=>b.dataset.v);},
  fmt(v,d){d=d===undefined?3:d;if(v===0)return '0';const a=Math.abs(v);return (a<1e-3||a>=1e5)?v.toExponential(2):v.toFixed(d);},
  arrow(g,x1,y1,x2,y2,col,w){g.strokeStyle=col;g.fillStyle=col;g.lineWidth=w||2;g.lineCap='round';
    const a=Math.atan2(y2-y1,x2-x1),hl=8;g.beginPath();g.moveTo(x1,y1);g.lineTo(x2-Math.cos(a)*3,y2-Math.sin(a)*3);g.stroke();
    g.beginPath();g.moveTo(x2,y2);g.lineTo(x2-hl*Math.cos(a-0.45),y2-hl*Math.sin(a-0.45));g.lineTo(x2-hl*Math.cos(a+0.45),y2-hl*Math.sin(a+0.45));g.closePath();g.fill();},
  wob(g,x1,y1,x2,y2,s){const dx=y2-y1,dy=x1-x2,l=Math.hypot(dx,dy)||1,k=Math.sin(s*12.9898)*1.2;
    g.beginPath();g.moveTo(x1,y1);g.quadraticCurveTo((x1+x2)/2+dx/l*k,(y1+y2)/2+dy/l*k,x2,y2);g.stroke();},
  FONT:'12px "IBM Plex Mono",ui-monospace,Menlo,Consolas,monospace'
};
})();
