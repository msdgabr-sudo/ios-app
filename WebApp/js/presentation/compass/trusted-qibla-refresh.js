/* QiblaAstro — trusted Qibla presentation refresh only.
 * Presentation bridge: does not calculate Qibla, activate sensors, or alter verification.
 * © 2026 Mohamed SG Behairy. All Rights Reserved. */
(function(root){
'use strict';
var observer=null,done=false,retries=0;
function qiblaReady(){
  try{if(typeof QT!=='undefined'&&Number.isFinite(Number(QT)))return true;}catch(_){ }
  var el=root.document&&root.document.getElementById('q-deg');
  if(!el)return false;
  var m=String(el.textContent||'').match(/-?\d+(?:\.\d+)?/);
  return !!m&&Number.isFinite(Number(m[0]));
}
function cached(name){
  try{if(name==='sp'&&typeof _lastSp!=='undefined')return _lastSp;if(name==='mp'&&typeof _lastMp!=='undefined')return _lastMp;}catch(_){ }
  return name==='sp'?root._lastSp:root._lastMp;
}
function refresh(){
  if(done||!qiblaReady()||typeof root.drawCompass!=='function')return false;
  var sp=cached('sp'),mp=cached('mp');
  var saz=sp&&Number.isFinite(Number(sp.az))?Number(sp.az):-90;
  var salt=sp&&Number.isFinite(Number(sp.altApp))?Number(sp.altApp):-90;
  var maz=mp&&Number.isFinite(Number(mp.az))?Number(mp.az):-90;
  var malt=mp&&Number.isFinite(Number(mp.altApp))?Number(mp.altApp):-90;
  try{root.drawCompass(saz,salt,maz,malt,null);}catch(_){return false;}
  done=true;
  if(observer){try{observer.disconnect();}catch(_){ }observer=null;}
  return true;
}
function bind(){
  if(refresh())return;
  var el=root.document&&root.document.getElementById('q-deg');
  if(!el){if(++retries<80)root.setTimeout(bind,50);return;}
  if(typeof root.MutationObserver==='function'){
    observer=new root.MutationObserver(function(){refresh();});
    observer.observe(el,{childList:true,characterData:true,subtree:true});
  }
  if(++retries<80)root.setTimeout(function(){if(!done)refresh();},100);
}
if(root.document){if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();}
})(typeof globalThis!=='undefined'?globalThis:window);
