/* Draw all figures once, and again when web fonts have loaded. */
(function(){const r=()=>{(UI.redraws||[]).forEach(f=>{try{f()}catch(e){console.error(e)}})};r();
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(r);})();
