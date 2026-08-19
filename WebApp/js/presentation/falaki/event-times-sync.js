/* QiblaAstro — Falaki event-times presentation sync only.
 * Reuses the existing solarEvts/moonPos/moonRS engines without modifying equations.
 * © 2026 Mohamed SG Behairy. All Rights Reserved. */
(function(root){
'use strict';
var timer=null,observer=null,lastGpsKick=0;
function byId(doc,id){try{return doc&&doc.getElementById(id);}catch(_){return null;}}
function put(doc,id,value){var el=byId(doc,id);if(el&&value&&el.textContent!==value)el.textContent=value;}
function formatHour(value){
  if(!Number.isFinite(Number(value)))return '';
  try{if(typeof root.hm==='function'){var out=root.hm(Number(value));if(out&&String(out).indexOf('NaN')<0)return out;}}catch(_){}
  var h=((Number(value)%24)+24)%24,m=Math.round((h-Math.floor(h))*60);h=Math.floor(h);if(m===60){m=0;h=(h+1)%24;}
  return String(h).padStart(2,'0')+':'+String(m).padStart(2,'0');
}
function ensureParentGnss(){
  try{
    if(root.gnssHasTrustedFix===true&&Number.isFinite(Number(root.LAT))&&Number.isFinite(Number(root.LON)))return true;
    var now=Date.now();if(now-lastGpsKick>5000&&typeof root.tryBrowserGPS==='function'){lastGpsKick=now;root.tryBrowserGPS();}
  }catch(_){}
  return false;
}
function getTimes(){
  try{
    if(!Number.isFinite(Number(root.LAT))||!Number.isFinite(Number(root.LON)))return null;
    if(typeof root.solarEvts!=='function'||typeof root.moonPos!=='function'||typeof root.moonRS!=='function')return null;
    var now=new Date(),ev=root.solarEvts(now);if(!ev)return null;
    var mp=root.moonPos(now),mr=root.moonRS(ev,mp);
    return {sunrise:formatHour(ev.rH),noon:formatHour(ev.nH),sunset:formatHour(ev.sH),moonrise:mr?formatHour(mr.rH):'',moonset:mr?formatHour(mr.sH):''};
  }catch(_){return null;}
}
function homeLine(selector,id,a,b){
  try{
    var card=root.document.querySelector(selector);if(!card)return;
    var el=root.document.getElementById(id);if(!el){el=root.document.createElement('div');el.id=id;el.style.cssText='margin-top:5px;font-size:.48rem;line-height:1.45;color:#c9d9ef;white-space:nowrap;font-weight:600;text-align:center;';card.appendChild(el);}
    el.textContent='الشروق '+(a||'—')+' · الغروب '+(b||'—');
  }catch(_){}
}
function sync(){
  ensureParentGnss();
  var times=getTimes();if(!times)return false;
  var frame=root.document&&root.document.getElementById('qa-falaki-frame'),doc=null;
  try{doc=frame&&frame.contentDocument;}catch(_){}
  if(doc){put(doc,'sunT1',times.sunrise);put(doc,'noon',times.noon);put(doc,'sunT2',times.sunset);put(doc,'moonT1',times.moonrise);put(doc,'moonT2',times.moonset);}
  homeLine('#qa-home .qa-sun-card','qaSunRiseSet',times.sunrise,times.sunset);
  homeLine('#qa-home .qa-moon-card','qaMoonRiseSet',times.moonrise,times.moonset);
  return true;
}
function bindFrameObserver(){
  try{
    var frame=root.document&&root.document.getElementById('qa-falaki-frame'),doc=frame&&frame.contentDocument;if(!doc)return;
    if(observer){observer.disconnect();observer=null;}
    var ids=['sunT1','noon','sunT2','moonT1','moonT2'],nodes=ids.map(function(id){return byId(doc,id);}).filter(Boolean);
    if(nodes.length&&typeof MutationObserver!=='undefined'){observer=new MutationObserver(function(){root.setTimeout(sync,0);});nodes.forEach(function(n){observer.observe(n,{childList:true,subtree:true,characterData:true});});}
  }catch(_){}
}
function start(){
  ensureParentGnss();sync();root.setTimeout(sync,300);root.setTimeout(sync,1200);root.setTimeout(bindFrameObserver,1500);
  if(timer)root.clearInterval(timer);timer=root.setInterval(sync,2000);
}
root.addEventListener('qiblaastro:gnss-update',function(){root.setTimeout(sync,0);});
root.addEventListener('qiblaastro:presentation-page-mounted',function(e){if(e&&e.detail&&e.detail.name==='falaki'){root.setTimeout(bindFrameObserver,0);root.setTimeout(sync,0);}});
if(root.document){if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',start,{once:true});else start();}
})(typeof globalThis!=='undefined'?globalThis:window);
