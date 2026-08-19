/* QiblaAstro — Android Location service state/control only.
 * Presentation + authenticated native bridge. It never calculates or writes
 * Qibla, prayer, astronomy, city, WMM or coordinate values.
 */
(function(root){
'use strict';
var TOKEN_KEY='qiblaastro:native-token';
var STATE_KEY='qiblaastro:native-location-enabled:v1';
var BUTTON_ID='qa-location-service-button';
var STYLE_ID='qa-location-service-style';
var nativeState=null;
var permissionGranted=false;
var gpsAttempted=false;
var originalTryBrowserGPS=null;
var observer=null;
var pollTimer=null;

function isTwaSurface(){
  try{
    var q=new URLSearchParams(root.location.search||'');
    if(q.get('twa')==='1'){root.sessionStorage.setItem('qiblaastro:twa','1');return true;}
    return root.sessionStorage.getItem('qiblaastro:twa')==='1';
  }catch(_){return false;}
}
function captureNativeState(){
  var previous=nativeState,value=null;
  try{
    var raw=String(root.location&&root.location.hash||'').replace(/^#/,'');
    if(raw){
      var params=new URLSearchParams(raw),incoming=params.get('nativeLocation');
      if(incoming==='1'||incoming==='0'){
        value=incoming==='1';
        root.sessionStorage.setItem(STATE_KEY,incoming);
        params.delete('nativeLocation');
        var clean=params.toString();
        root.history.replaceState(root.history.state||null,'',root.location.pathname+root.location.search+(clean?'#'+clean:''));
      }
    }
    if(value===null){
      var saved=root.sessionStorage.getItem(STATE_KEY);
      if(saved==='1'||saved==='0')value=saved==='1';
    }
  }catch(_){value=null;}
  nativeState=value;
  if(previous!==nativeState)gpsAttempted=false;
  return value;
}
function trustedFix(){
  try{
    return typeof gnssHasTrustedFix!=='undefined'&&gnssHasTrustedFix===true&&
      typeof gnssSource!=='undefined'&&gnssSource==='gps'&&
      typeof LAT!=='undefined'&&typeof LON!=='undefined'&&
      Number.isFinite(Number(LAT))&&Number.isFinite(Number(LON));
  }catch(_){return false;}
}
function isKnownDisabled(){return isTwaSurface()&&nativeState===false;}
function nativeToken(){try{return root.sessionStorage.getItem(TOKEN_KEY)||'';}catch(_){return '';}}
function ensureStyle(){
  if(!root.document||root.document.getElementById(STYLE_ID))return;
  var s=root.document.createElement('style');s.id=STYLE_ID;
  s.textContent='#'+BUTTON_ID+'{position:absolute;z-index:14;left:50%;top:163px;transform:translateX(-50%);min-width:86px;height:23px;padding:2px 9px;border-radius:999px;border:1px solid rgba(229,188,91,.52);background:rgba(8,20,34,.86);color:#efd078;box-shadow:0 4px 14px rgba(0,0,0,.28);font:700 .48rem/1 inherit;white-space:nowrap;display:flex;align-items:center;justify-content:center;gap:3px;direction:rtl;cursor:pointer;backdrop-filter:blur(6px)}#'+BUTTON_ID+'.qa-location-locating{border-color:rgba(102,196,236,.42);color:#91dfff;background:rgba(8,38,56,.78)}#'+BUTTON_ID+'.qa-location-ready{border-color:rgba(75,214,128,.42);color:#7fe5a5;background:rgba(8,48,35,.75);cursor:default}#'+BUTTON_ID+':focus-visible{outline:2px solid rgba(239,208,120,.85);outline-offset:2px}@media(max-width:380px){#'+BUTTON_ID+'{top:163px;min-width:80px;height:22px;font-size:.45rem;padding-inline:8px}}';
  (root.document.head||root.document.documentElement).appendChild(s);
}
function ensureButton(){
  if(!root.document||!isTwaSurface()||nativeState===null)return null;
  var existing=root.document.getElementById(BUTTON_ID);if(existing)return existing;
  var bearing=root.document.querySelector('#page-home .qa-sky .qa-bearing');if(!bearing||!bearing.parentNode)return null;
  ensureStyle();
  var b=root.document.createElement('button');b.type='button';b.id=BUTTON_ID;b.setAttribute('aria-live','polite');b.setAttribute('aria-label','حالة تحديد الموقع');
  b.addEventListener('click',function(event){
    event.preventDefault();event.stopPropagation();
    if(nativeState===false){openSettings();return;}
    if(nativeState===true&&!trustedFix())requestExistingGps(true);
  });
  bearing.parentNode.insertBefore(b,bearing.nextSibling);
  return b;
}
function renderButton(){
  var b=ensureButton();if(!b)return;
  b.className='';
  if(nativeState===false){b.textContent='◉ تفعيل الموقع';b.setAttribute('aria-label','تفعيل خدمة الموقع');return;}
  if(trustedFix()){b.className='qa-location-ready';b.textContent='● الموقع محدد';b.setAttribute('aria-label','تم تحديد الموقع');return;}
  b.className='qa-location-locating';b.textContent='◌ جارٍ تحديد الموقع';b.setAttribute('aria-label','جاري تحديد الموقع');
}
function requestExistingGps(force){
  if(nativeState!==true||trustedFix())return false;
  if(gpsAttempted&&!force)return false;
  if(typeof root.tryBrowserGPS!=='function')return false;
  gpsAttempted=true;
  try{root.tryBrowserGPS();return true;}catch(_){return false;}
}
function intentUri(){
  var token=nativeToken();if(!token)return '';
  return'intent://location-settings?token='+encodeURIComponent(token)+'#Intent;scheme=qiblaastro;package=com.qiblalabs;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;end';
}
function openSettings(){
  if(nativeState!==false)return false;
  var uri=intentUri(),b=ensureButton();
  if(!uri){if(b)b.textContent='◉ تفعيل الموقع';return false;}
  if(b){b.className='qa-location-locating';b.textContent='◌ فتح إعدادات الموقع...';}
  try{root.location.href=uri;return true;}catch(_){renderButton();return false;}
}
function installGpsGuard(){
  if(originalTryBrowserGPS||typeof root.tryBrowserGPS!=='function')return;
  originalTryBrowserGPS=root.tryBrowserGPS;
  root.tryBrowserGPS=function(){
    if(isKnownDisabled()){renderButton();syncOnboarding();return false;}
    return originalTryBrowserGPS.apply(root,arguments);
  };
}
function restoreGpsGuard(){if(originalTryBrowserGPS&&root.tryBrowserGPS!==originalTryBrowserGPS&&nativeState===null){root.tryBrowserGPS=originalTryBrowserGPS;originalTryBrowserGPS=null;}}
function updatePermissionState(){
  try{
    if(!root.navigator.permissions||typeof root.navigator.permissions.query!=='function')return;
    root.navigator.permissions.query({name:'geolocation'}).then(function(status){
      permissionGranted=status&&status.state==='granted';
      if(status)status.onchange=function(){permissionGranted=status.state==='granted';syncOnboarding();};
      syncOnboarding();
    }).catch(function(){});
  }catch(_){ }
}
function syncOnboarding(){
  if(!root.document||nativeState!==false||!permissionGranted)return;
  var overlay=root.document.getElementById('qa-permission-overlay');if(!overlay)return;
  var btn=root.document.getElementById('qa-permission-allow');
  var state=root.document.querySelector('[data-qa-permission-state="location"]');
  var note=root.document.getElementById('qa-permission-note');
  if(btn){
    if(btn.dataset.stage!=='location-service')btn.dataset.stage='location-service';
    if(btn.disabled)btn.disabled=false;
    if(btn.textContent!=='تفعيل الموقع')btn.textContent='تفعيل الموقع';
  }
  if(state){
    if(state.textContent!=='خدمة الموقع متوقفة')state.textContent='خدمة الموقع متوقفة';
    if(state.className!=='qa-permission-state wait')state.className='qa-permission-state wait';
  }
  if(note&&note.textContent!=='خدمة الموقع في الهاتف متوقفة. فعّلها للمتابعة.')note.textContent='خدمة الموقع في الهاتف متوقفة. فعّلها للمتابعة.';
}
function interceptOnboarding(event){
  if(nativeState!==false||!permissionGranted)return;
  var target=event.target&&event.target.closest?event.target.closest('#qa-permission-allow'):null;
  if(!target)return;
  event.preventDefault();event.stopPropagation();if(event.stopImmediatePropagation)event.stopImmediatePropagation();
  openSettings();
}
function refresh(){
  installGpsGuard();
  renderButton();
  syncOnboarding();
  if(nativeState===true&&!trustedFix())requestExistingGps(false);
}
function handleNativeReturn(){captureNativeState();refresh();}
function start(){
  captureNativeState();
  if(!isTwaSurface()||nativeState===null){restoreGpsGuard();return;}
  ensureStyle();installGpsGuard();updatePermissionState();refresh();
  if(root.document){
    root.document.addEventListener('click',interceptOnboarding,true);
    try{observer=new MutationObserver(function(){renderButton();syncOnboarding();});observer.observe(root.document.body||root.document.documentElement,{childList:true,subtree:true});}catch(_){ }
  }
  root.addEventListener('hashchange',handleNativeReturn);
  root.addEventListener('qiblaastro:gnss-update',refresh);
  root.addEventListener('focus',refresh);
  root.document&&root.document.addEventListener('visibilitychange',function(){if(!root.document.hidden)refresh();});
  pollTimer=root.setInterval(function(){installGpsGuard();renderButton();syncOnboarding();},1000);
}
root.QiblaLocationServiceControl=Object.freeze({isKnownDisabled:isKnownDisabled,isEnabled:function(){return nativeState===true;},openSettings:openSettings,refresh:refresh,getState:function(){return nativeState;}});
if(root.document){if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',start,{once:true});else start();}
})(typeof globalThis!=='undefined'?globalThis:window);
