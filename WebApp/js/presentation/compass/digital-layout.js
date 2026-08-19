/* QiblaAstro — Digital Compass layout mount
 * Presentation-only DOM annotation. No scientific values, equations, GNSS state or verification state are read or written here.
 * © 2026 محمد سيد جبر بحيرى — Mohamed SG Behairy. All Rights Reserved.
 */
(function(root){'use strict';
  var mounted=false;
  function byId(id){return root.document?root.document.getElementById(id):null;}
  function findDeviationCalculator(page){
    var slider=byId('dev-slider'),node=slider;
    if(!slider||!page)return null;
    while(node&&node.parentElement&&node.parentElement!==page)node=node.parentElement;
    return node&&node.parentElement===page?node:null;
  }
  function annotateCalculator(page){
    var calc=findDeviationCalculator(page);if(!calc)return;
    calc.classList.add('qa-deviation-calculator');
    var kids=calc.children;
    if(kids[0])kids[0].classList.add('qa-calc-title');
    if(kids[1])kids[1].classList.add('qa-calc-stats');
    if(kids[2])kids[2].classList.add('qa-calc-hint');
    if(kids[3])kids[3].classList.add('qa-calc-slider');
    if(kids[4])kids[4].classList.add('qa-calc-radar');
    if(kids[5])kids[5].classList.add('qa-calc-result');
  }
  function mount(){
    if(mounted)return true;
    var page=byId('page-compass'),live=byId('live-compass-card');
    if(!page||!live)return false;
    var row=live.parentElement,legacy=row&&row.parentElement;
    if(!legacy||legacy.parentElement!==page)return false;
    legacy.classList.add('qa-compass-legacy-grid');
    annotateCalculator(page);
    mounted=true;
    return true;
  }
  var tries=0;
  function boot(){if(mount())return;if(++tries<100)root.setTimeout(boot,100);}
  root.QiblaDigitalCompassLayout=Object.freeze({mount:mount});
  if(root.document){if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();}
})(typeof globalThis!=='undefined'?globalThis:window);
