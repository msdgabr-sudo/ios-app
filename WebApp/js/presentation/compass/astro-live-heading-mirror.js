/* QiblaAstro — Astro screen live compass presentation mirror.
 * Presentation only: mirrors the canonical digital compass DOM heading and,
 * when needed, requests activation through the existing compass entry point.
 * Never creates a second sensor listener itself and never writes to verification
 * engines, solver/session state, or stored astronomical records.
 */
(function(root){
'use strict';
var d=root.document;if(!d)return;
var running=false,observer=null,timer=0,activationRequested=false,cardBound=false;
function byId(id){return d.getElementById(id);}
function readDeg(id){var e=byId(id);if(!e)return NaN;var m=String(e.textContent||'').replace(/,/g,'.').match(/-?\d+(?:\.\d+)?/);return m?Number(m[0]):NaN;}
function finite(v){return Number.isFinite(Number(v));}
function angleDiff(target,current){return ((Number(target)-Number(current))%360+540)%360-180;}
function astroScreenActive(){var page=byId('page-compass');if(!page||!page.classList.contains('active'))return false;try{if(root.QiblaCompassViewMode&&typeof root.QiblaCompassViewMode.get==='function')return root.QiblaCompassViewMode.get()==='astro';}catch(_){}return page.classList.contains('qa-astro-dashboard-active');}
function requestCanonicalCompass(force){
  if(!astroScreenActive())return false;
  if(finite(readDeg('box-heading'))){activationRequested=false;return true;}
  if(activationRequested&&!force)return false;
  if(typeof root.activateCompass!=='function')return false;
  activationRequested=true;
  try{root.activateCompass();return true;}catch(_){activationRequested=false;return false;}
}
function bindCardActivation(){
  if(cardBound)return;var card=byId('astro-body-card');if(!card)return;
  cardBound=true;
  card.addEventListener('click',function(){if(!finite(readDeg('box-heading')))requestCanonicalCompass(true);});
}
function sync(){
  bindCardActivation();
  var source=readDeg('box-heading');
  if(!finite(source)){requestCanonicalCompass(false);return;}
  activationRequested=false;
  source=((source%360)+360)%360;
  var value=byId('astro-body-value'),hint=byId('astro-body-hint');
  if(value){var text=source.toFixed(1)+'°';if(value.textContent!==text)value.textContent=text;value.style.display='block';}
  if(hint&&hint.textContent!=='اتجاه الهاتف الآن')hint.textContent='اتجاه الهاتف الآن';
  var q=readDeg('astro-qibla-value'),dev=byId('astro-deviation-value'),dh=byId('astro-deviation-hint');
  if(!finite(q))return;
  var diff=angleDiff(q,source),abs=Math.abs(diff);
  if(dev){var dt=abs.toFixed(1)+'°';if(dev.textContent!==dt)dev.textContent=dt;}
  if(dh){var ht=abs<0.5?'الاتجاه مطابق للقبلة الفلكية':(diff>0?'أدر الهاتف يمينًا':'أدر الهاتف يسارًا');if(dh.textContent!==ht)dh.textContent=ht;}
}
function start(){if(running)return;running=true;sync();var source=byId('box-heading'),targets=[byId('astro-body-value'),byId('astro-deviation-value')].filter(Boolean);if(typeof root.MutationObserver==='function'){observer=new root.MutationObserver(sync);if(source)observer.observe(source,{childList:true,characterData:true,subtree:true});targets.forEach(function(n){observer.observe(n,{childList:true,characterData:true,subtree:true});});var page=byId('page-compass');if(page)observer.observe(page,{attributes:true,attributeFilter:['class']});}timer=root.setInterval(sync,120);}
root.QiblaAstroLiveHeadingMirror=Object.freeze({start:start,sync:sync,requestCompass:requestCanonicalCompass});
if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',start,{once:true});else start();
})(typeof globalThis!=='undefined'?globalThis:window);
