/* ================= static sketches ================= */
(function(){
'use strict';
const INK='#15202b',MUT='#566577',BLUE='#1f5fbf',RED='#d4432f',GRN='#1f8a63';
const arrowD=(x1,y1,x2,y2,c)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="2"/><path d="M${x2} ${y2} l-8 -4 l0 8z" fill="${c}"/>`;
const sub=(a,b)=>`${a}<tspan font-size="11" dy="3">${b}</tspan><tspan dy="-3">`;
/* ---- face value schematics: cells W (20-140), P (140-260), E (260-380); face between P and E at x=260; flow left to right ---- */
const yW=135,yP=105,yE=40,xW=80,xP=200,xE=320,xf=260;
const gslope=(yE-yW)/(xE-xW);               /* central gradient at P: (phiE-phiW)/(xE-xW), px per px */
function base(){
  let s=`<svg viewBox="0 0 400 215" role="img" aria-hidden="true">`;
  [['W',20],['P',140],['E',260]].forEach(c=>{s+=`<rect x="${c[1]}" y="160" width="120" height="30" fill="#f3f7fd" stroke="${INK}" stroke-width="1.6"/><text x="${c[1]+56}" y="181">${c[0]}</text>`;});
  [xW,xP,xE].forEach(x=>{s+=`<line x1="${x}" y1="160" x2="${x}" y2="25" stroke="#b9c4d0" stroke-dasharray="3 3"/>`;});
  s+=`<line x1="${xf}" y1="160" x2="${xf}" y2="25" stroke="#8a97a6" stroke-dasharray="5 3"/><text class="s" x="${xf+4}" y="150">face f</text>`;
  [[xW,yW,'W'],[xP,yP,'P'],[xE,yE,'E']].forEach(p=>{s+=`<circle cx="${p[0]}" cy="${p[1]}" r="4.5" fill="${INK}"/><text x="${p[0]-22}" y="${p[1]-8}">φ<tspan font-size="11" dy="3">${p[2]}</tspan></text>`;});
  s+=`${arrowD(30,16,90,16,MUT)}<text class="s" x="96" y="20">flow</text>`;
  return s;
}
const dot=(y,c)=>`<circle cx="${xf}" cy="${y}" r="6" fill="#fff" stroke="${c}" stroke-width="3"/>`;
const SK={
 upwind:()=>base()+`<line x1="${xP}" y1="${yP}" x2="${xf}" y2="${yP}" stroke="${BLUE}" stroke-width="2.4"/>`+dot(yP,BLUE)+`</svg>`,
 linear:()=>base()+`<line x1="${xP}" y1="${yP}" x2="${xE}" y2="${yE}" stroke="${RED}" stroke-width="2.4"/>`+dot((yP+yE)/2,RED)+`</svg>`,
 linearUpwind:()=>{
   const cx=[140,320,500],yv=[260,225,60],fw=230,fe=410;
   const ypw=(yv[0]+yv[1])/2,ype=(yv[1]+yv[2])/2,sl=(ype-ypw)/(fe-fw),yf=yv[1]+sl*(fe-cx[1]);
   const lab=(t,n,x,y,c)=>`<text x="${x}" y="${y}" ${c?`style="fill:${c}"`:''}>${t}<tspan font-size="11" dy="3">${n}</tspan></text>`;
   const num=(n,x,y)=>`<circle cx="${x}" cy="${y}" r="10" fill="#fff" stroke="${MUT}"/><text class="s" x="${x}" y="${y+4}" text-anchor="middle">${n}</text>`;
   let s=`<svg viewBox="0 0 640 335" role="img" aria-label="linearUpwind construction in three steps">`;
   ['W','P','E'].forEach((n,i)=>{s+=`<rect x="${50+i*180}" y="290" width="180" height="32" fill="#f3f7fd" stroke="${INK}" stroke-width="1.6"/><text x="${cx[i]-5}" y="312">${n}</text><line x1="${cx[i]}" y1="290" x2="${cx[i]}" y2="40" stroke="#b9c4d0" stroke-dasharray="3 3"/>`;});
   s+=`<line x1="${fw}" y1="290" x2="${fw}" y2="40" stroke="#8a97a6" stroke-dasharray="5 3"/><line x1="${fe}" y1="290" x2="${fe}" y2="40" stroke="#8a97a6" stroke-dasharray="5 3"/>`;
   s+=`<text class="s" x="${fw+5}" y="283">face w</text><text class="s" x="${fe+5}" y="283">face e</text>${arrowD(55,28,115,28,MUT)}<text class="s" x="121" y="32">flow</text>`;
   s+=`<line x1="${cx[0]}" y1="${yv[0]}" x2="${cx[1]}" y2="${yv[1]}" stroke="#c3ccd6"/><line x1="${cx[1]}" y1="${yv[1]}" x2="${cx[2]}" y2="${yv[2]}" stroke="#c3ccd6"/>`;
   s+=`<line x1="${fw}" y1="${ypw}" x2="${fe}" y2="${ype}" stroke="${MUT}" stroke-width="1.6" stroke-dasharray="2 4"/>`;
   s+=`<circle cx="${fw}" cy="${ypw}" r="5" fill="#fff" stroke="${MUT}" stroke-width="2"/>`+lab('φ','w',fw-30,ypw+5,MUT);
   s+=`<circle cx="${fe}" cy="${ype}" r="6" fill="#fff" stroke="${RED}" stroke-width="2" opacity=".6"/>`+lab('φ','e',fe+12,ype+4,MUT)+`<text class="s" x="${fe+36}" y="${ype+5}" style="fill:${RED}">(the linear value)</text>`;
   s+=`<line x1="${cx[1]}" y1="${yv[1]}" x2="${fe}" y2="${yv[1]}" stroke="${BLUE}" stroke-width="2.6"/><circle cx="${fe}" cy="${yv[1]}" r="6" fill="#fff" stroke="${BLUE}" stroke-width="2" opacity=".6"/><text class="s" x="${fe+12}" y="${yv[1]+5}" style="fill:${BLUE}">upwind part</text>`;
   s+=`<line x1="${fe}" y1="${yv[1]-6}" x2="${fe}" y2="${yf+7}" stroke="${GRN}" stroke-width="4"/><text class="s" x="${fe+12}" y="${(yv[1]+yf)/2+5}" style="fill:${GRN}">gradient correction</text>`;
   s+=`<line x1="${cx[1]}" y1="${yv[1]}" x2="${fe}" y2="${yf}" stroke="${GRN}" stroke-width="2.6" stroke-dasharray="7 3"/>`;
   s+=`<line x1="${cx[1]}" y1="${yv[1]+22}" x2="${fe}" y2="${yv[1]+22}" stroke="${MUT}"/><text class="s" x="${(cx[1]+fe)/2-30}" y="${yv[1]+37}">d = Δx/2</text>`;
   s+=`<circle cx="${fe}" cy="${yf}" r="6.5" fill="#fff" stroke="${GRN}" stroke-width="3"/>`+lab('φ','f',fe+12,yf+5,GRN);
   [0,1,2].forEach(i=>{s+=`<circle cx="${cx[i]}" cy="${yv[i]}" r="4.5" fill="${INK}"/>`+lab('φ','WPE'[i],cx[i]-26,yv[i]-9);});
   s+=num(1,270,188)+num(2,385,213)+num(3,fe+162,(yv[1]+yf)/2+1);
   return s+`</svg>`;}
};
const F=(n)=>`<span class="m">φ<sub>${n}</sub></span>`;
const cap={
 upwind:'<h3>upwind</h3>: the face takes the value of the cell the flow comes from.<div class="fm" style="color:'+BLUE+'"><span class="m">φ<sub>f</sub> = φ<sub>P</sub></span></div>',
 linear:'<h3>linear</h3>: a straight line between the two cell values, weighted by distance (λ is the weighting factor, ½ on a uniform mesh).<div class="fm" style="color:'+RED+'"><span class="m">φ<sub>f</sub> = λ φ<sub>P</sub> + (1−λ) φ<sub>E</sub></span></div>',
 linearUpwind:'<h3>linearUpwind</h3>, built in three steps:<ol><li><b>Gradient in cell P.</b> With <code>Gauss linear</code> the gradient is formed from the cell\'s own two faces: the linear face values φ<sub>w</sub> and φ<sub>e</sub> give <span class="m">(∇φ)<sub>P</sub> = (φ<sub>e</sub> − φ<sub>w</sub>)/Δx</span>, the slope of the dotted line.</li><li><b>Extrapolate.</b> A line with that slope through φ<sub>P</sub> (dashed green) is followed from the cell centre to face e, a distance d.</li><li><b>Two parts.</b> The face value is the upwind value φ<sub>P</sub> (blue, goes into the matrix) plus the correction (∇φ)<sub>P</sub>·d (green bar, evaluated from known values and put on the right-hand side).</li></ol><div class="fm" style="color:'+GRN+'"><span class="m">φ<sub>f</sub> = φ<sub>P</sub> + (∇φ)<sub>P</sub>·d &nbsp;=&nbsp; φ<sub>P</sub> + ¼ (φ<sub>E</sub> − φ<sub>W</sub>)</span> <span style="color:var(--muted);font-size:13.5px">on a uniform mesh</span></div><p style="margin:8px 0 0">The faint blue and red rings are the upwind and linear face values for comparison. Note for readers of textbooks: the scheme called linear upwind or second-order upwind there usually takes the gradient from P and W only, <span class="m">φ<sub>f</sub> = 1.5 φ<sub>P</sub> − 0.5 φ<sub>W</sub></span>. OpenFOAM\'s <code>linearUpwind</code> uses whatever gradient scheme you name after it; with a central gradient it is the scheme known as Fromm\'s.</p>'
};
const el=document.getElementById('schemSketch');
if(el)el.innerHTML=['upwind','linear','linearUpwind'].map(k=>'<figure'+(k==='linearUpwind'?' class="wide"':'')+'>'+SK[k]()+'<figcaption>'+cap[k]+'</figcaption></figure>').join('');

/* ---- W-P-E sketch: contiguous cells ---- */
const w=document.getElementById('wpeSketch');
if(w){
 const T=(n,x)=>`<text x="${x}" y="135" text-anchor="middle" style="font-size:18px">a<tspan font-size="11" dy="3">${n}</tspan><tspan dy="-3"> φ</tspan><tspan font-size="11" dy="3">${n}</tspan></text>`;
 let s='<figure><svg viewBox="0 0 640 185" role="img" aria-label="Cells W, P and E side by side with faces w and e">';
 [['W',30,'#d6efe3'],['P',190,'#dbe8fb'],['E',350,'#fdebc8']].forEach(c=>{s+=`<rect x="${c[1]}" y="30" width="160" height="70" fill="${c[2]}" stroke="${INK}" stroke-width="1.8"/><circle cx="${c[1]+80}" cy="65" r="4" fill="${INK}"/><text x="${c[1]+90}" y="60" style="font-size:18px">${c[0]}</text>`;});
 s+=T('W',110)+T('P',270)+T('E',430);
 s+=`<text x="190" y="135" text-anchor="middle" style="font-size:18px">+</text><text x="350" y="135" text-anchor="middle" style="font-size:18px">+</text><text x="505" y="135" style="font-size:18px">= b<tspan font-size="11" dy="3">P</tspan></text>`;
 s+=`<text x="190" y="22" text-anchor="middle" class="s">face w</text><text x="350" y="22" text-anchor="middle" class="s">face e</text>`;
 s+=`<line x1="110" y1="158" x2="430" y2="158" stroke="${MUT}"/><text x="190" y="175" text-anchor="middle" class="s">Δx</text><text x="350" y="175" text-anchor="middle" class="s">Δx</text>`;
 s+=`${arrowD(160,82,220,82,BLUE)}${arrowD(320,82,380,82,BLUE)}<text x="204" y="74" class="s">F</text><text x="364" y="74" class="s">F</text>`;
 s+='</svg></figure>';
 w.innerHTML=s;
}
})();
