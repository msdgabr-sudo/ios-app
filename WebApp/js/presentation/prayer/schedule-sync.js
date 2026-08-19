/* QiblaAstro — Prayer schedule location + authenticated Android sync. */
(function(root){
'use strict';
var lastKey='',timer=0,TOKEN_KEY='qiblaastro:native-token',AUTO_KEY='qiblaastro:prayer-native-sync-enabled:v1',OWNER_KEY='qiblaastro:prayer-native-owner:v1',LAST_SYNC_KEY='qiblaastro:prayer-native-sync-last:v1',PERMISSION_STATE_KEY='qiblaastro:permissions-onboarding:v2',HANDOFF_TIMEOUT_MS=120000,PLAN_DAYS=180;
function isTwa(){try{var q=new URLSearchParams(root.location.search||'');return q.get('twa')==='1'||root.sessionStorage.getItem('qiblaastro:twa')==='1';}catch(_){return false;}}
function localAdhanEnabled(){try{var api=root.QiblaAdhanUI,st=api&&typeof api.getState==='function'?api.getState():null;if(!st||!st.enabled)return false;var prayers=st.prayers||{};return Object.keys(prayers).some(function(name){return prayers[name]&&prayers[name]!=='off';});}catch(_){return false;}}
function permissionState(){try{return JSON.parse(root.localStorage.getItem(PERMISSION_STATE_KEY)||'{}')||{};}catch(_){return {};}}
function writePermissionState(saved){try{root.localStorage.setItem(PERMISSION_STATE_KEY,JSON.stringify(saved||{}));}catch(_){}}
function setOwner(active){
  try{
    root.localStorage.setItem(OWNER_KEY,active?'1':'0');
    var saved=permissionState();
    if(active){
      root.localStorage.setItem(AUTO_KEY,'1');
      saved.completed=true;saved.location='granted';saved.notifications='granted';saved.adhanNativeRequested=true;saved.twa=true;saved.completedAt=Date.now();
      writePermissionState(saved);return;
    }
    var wasNativeRequested=root.localStorage.getItem(AUTO_KEY)==='1'||saved.adhanNativeRequested===true;
    if(wasNativeRequested&&localAdhanEnabled()){
      // A Play/native upgrade, revoked notification permission, revoked exact-alarm
      // access or an exhausted plan must re-enter the existing permission cycle.
      // Do not silently leave a previously-enabled user on Web-only fallback.
      saved.completed=false;saved.notifications='contextual';saved.adhanNativeRequested=false;saved.twa=true;delete saved.completedAt;
      writePermissionState(saved);
    }
  }catch(_){ }
}
function nativeOwnerConfirmed(){try{return isTwa()&&root.localStorage.getItem(OWNER_KEY)==='1';}catch(_){return false;}}
function captureToken(){
  try{
    var hash=String(root.location.hash||'').replace(/^#/,'');var hp=new URLSearchParams(hash),changed=false;
    var nativeState=hp.get('nativeAdhan');
    if(nativeState==='1'||nativeState==='0'){setOwner(nativeState==='1');hp.delete('nativeAdhan');changed=true;}
    var t=hp.get('nativeToken');
    if(t&&t.length>=32){root.sessionStorage.setItem(TOKEN_KEY,t);hp.delete('nativeToken');changed=true;}
    if(changed){var cleanHash=hp.toString();root.history.replaceState(root.history.state||null,'',root.location.pathname+root.location.search+(cleanHash?'#'+cleanHash:''));}
    return (t&&t.length>=32?t:root.sessionStorage.getItem(TOKEN_KEY))||'';
  }catch(_){return '';}
}
function installWebFallbackGuard(){
  try{
    if(root.__qiblaPrayerNativeWebGuardInstalled)return;
    if(typeof root._checkAdhan!=='function')return;
    var webCheck=root._checkAdhan;
    root._checkAdhan=function(now,cache){if(nativeOwnerConfirmed())return;return webCheck(now,cache);};
    root.__qiblaPrayerNativeWebGuardInstalled=true;
  }catch(_){ }
}
function ensurePlanModule(){try{if(root.QiblaPrayerNativePlan)return true;if(!root.document)return false;if(root.document.querySelector('script[data-qibla-prayer-native-plan]'))return false;var s=root.document.createElement('script');s.src='js/presentation/prayer/native-plan.js?v=20260818-plan-exact1';s.async=false;s.setAttribute('data-qibla-prayer-native-plan','true');(root.document.head||root.document.documentElement).appendChild(s);}catch(_){}return false;}
function currentKey(){try{if(!Number.isFinite(Number(LAT))||!Number.isFinite(Number(LON)))return '';var src=typeof gnssSource!=='undefined'?String(gnssSource):'unknown';return Number(LAT).toFixed(3)+','+Number(LON).toFixed(3)+'|'+src;}catch(e){return '';}}
function invalidateIfNeeded(){var key=currentKey();if(!key)return;if(!lastKey){lastKey=key;maybeAutoSync('location-ready');return;}if(key===lastKey)return;lastKey=key;try{if(typeof pKey!=='undefined')pKey='';}catch(e){}try{if(root.QiblaPrayerScreen&&typeof root.QiblaPrayerScreen.render==='function')root.QiblaPrayerScreen.render();}catch(e){}try{root.dispatchEvent(new CustomEvent('qiblaastro:prayer-location-changed',{detail:{key:key}}));}catch(e){}root.setTimeout(function(){maybeAutoSync('location-changed');},250);}
function minuteFor(name){try{var p=(typeof pCache!=='undefined'&&Array.isArray(pCache))?pCache.find(function(x){return x&&x.n===name;}):null;if(!p||!Number.isFinite(Number(p.h)))return -1;return ((Math.round(Number(p.h)*60)%1440)+1440)%1440;}catch(_){return -1;}}
function hasExplicitPrayerPrefs(){try{return ['qiblaastro-adhan-ui-v5','qiblaastro-adhan-ui-v4','qiblaastro-adhan-ui-v3','qiblaastro-adhan-ui-v2','qiblaastro-adhan-ui-v1'].some(function(k){return !!root.localStorage.getItem(k);});}catch(_){return false;}}
function autoEnabled(){try{return root.localStorage.getItem(AUTO_KEY)==='1';}catch(_){return false;}}
function setAutoEnabled(){try{root.localStorage.setItem(AUTO_KEY,'1');}catch(_){ }}
function prepareNativePayload(){
  var token=captureToken();if(!token)return {ready:false,reason:'native-token'};
  ensurePlanModule();installWebFallbackGuard();
  var loc=root.QiblaPrayerLocation&&root.QiblaPrayerLocation.effective?root.QiblaPrayerLocation.effective():null;
  if(!loc)return {ready:false,reason:'location'};
  var st=root.QiblaAdhanUI&&root.QiblaAdhanUI.getState?root.QiblaAdhanUI.getState():null;
  if(!st)return {ready:false,reason:'adhan-ui'};
  if(!root.QiblaPrayerNativePlan)return {ready:false,reason:'plan-loading'};
  var map={fajr:'الفجر',dhuhr:'الظهر',asr:'العصر',maghrib:'المغرب',isha:'العشاء'},times={};
  for(var id in map){var minute=minuteFor(map[id]);if(minute<0)return {ready:false,reason:'prayer-times'};times[id]=minute;}
  var plan=root.QiblaPrayerNativePlan.build(PLAN_DAYS),planText=root.QiblaPrayerNativePlan.serialize(plan);
  if(!plan||!planText)return {ready:false,reason:'native-plan'};
  return {ready:true,reason:'ready',payload:{token:token,loc:loc,st:st,times:times,map:map,plan:plan,planText:planText}};
}
function getReadiness(){var prepared=prepareNativePayload();return {ready:prepared.ready===true,reason:prepared.reason||'unknown',nativeOwner:nativeOwnerConfirmed()};}
function nativePayload(){var prepared=prepareNativePayload();return prepared.ready?prepared.payload:null;}
function fingerprint(payload){try{var loc=payload.loc,st=payload.st,t=payload.times;return [payload.planText,currentKey(),loc.timeZone||'',st.enabled?'1':'0',String(st.advance||0),st.profile||'makkah',t.fajr,t.dhuhr,t.asr,t.maghrib,t.isha,payload.map.fajr+':'+((st.prayers&&st.prayers[payload.map.fajr])||'off'),payload.map.dhuhr+':'+((st.prayers&&st.prayers[payload.map.dhuhr])||'off'),payload.map.asr+':'+((st.prayers&&st.prayers[payload.map.asr])||'off'),payload.map.maghrib+':'+((st.prayers&&st.prayers[payload.map.maghrib])||'off'),payload.map.isha+':'+((st.prayers&&st.prayers[payload.map.isha])||'off')].join('|');}catch(_){return '';}}
function lastSync(){try{return root.sessionStorage.getItem(LAST_SYNC_KEY)||'';}catch(_){return '';}}
function markSync(key){try{root.sessionStorage.setItem(LAST_SYNC_KEY,key);}catch(_){ }}
function directUri(q){return 'qiblaastro://prayer-sync?'+q.toString();}
function fallbackIntent(q){return 'intent://prayer-sync?'+q.toString()+'#Intent;scheme=qiblaastro;package=com.qiblalabs;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;end';}
function buildQuery(payload,interactive,onboarding){var token=payload.token,loc=payload.loc,st=payload.st,q=new URLSearchParams();q.set('token',token);q.set('notify',st.enabled?'1':'0');q.set('interactive',interactive?'1':'0');q.set('onboarding',onboarding?'1':'0');q.set('city',loc.label||'');q.set('tz',payload.plan.timeZone||loc.timeZone||Intl.DateTimeFormat().resolvedOptions().timeZone||'');q.set('plan',payload.planText);var h=root.document&&root.document.getElementById('pr-h');q.set('hijri',h&&h.textContent?h.textContent:'');try{if(Number.isFinite(Number(QT)))q.set('qibla',Number(QT).toFixed(1));}catch(_){}q.set('advance',String(st.advance||0));q.set('profile',st.profile||'makkah');Object.keys(payload.map).forEach(function(id){q.set('t_'+id,String(payload.times[id]));q.set('m_'+id,(st.prayers&&st.prayers[payload.map[id]])||'off');});return q;}
function launchBridge(q,reason){var launched=false;if(reason==='explicit'){var uri=directUri(q);try{var topWin=root.top||root;topWin.location.href=uri;launched=true;}catch(_){try{root.location.href=uri;launched=true;}catch(__){launched=false;}}if(launched)return true;}var fallback=fallbackIntent(q);try{(root.top||root).location.href=fallback;return true;}catch(_){try{root.location.href=fallback;return true;}catch(__){return false;}}}
function launchOnboardingBridge(q){
  return new Promise(function(resolve){
    var done=false,timerId=null,departed=false;
    function cleanup(){try{root.removeEventListener('blur',onDepart,true);}catch(_){}try{root.removeEventListener('pagehide',onDepart,true);}catch(_){}try{root.removeEventListener('focus',onReturn,true);}catch(_){}try{if(root.document){root.document.removeEventListener('visibilitychange',onVisibility,true);}}catch(_){}if(timerId!==null){try{root.clearTimeout(timerId);}catch(_){}timerId=null;}}
    function finish(ok){if(done)return;done=true;cleanup();resolve(ok===true);}
    function onDepart(){departed=true;}
    function onReturn(){if(!departed)return;root.setTimeout(function(){captureToken();finish(nativeOwnerConfirmed());},600);}
    function onVisibility(){try{if(root.document&&root.document.hidden)onDepart();else onReturn();}catch(_){} }
    try{root.addEventListener('blur',onDepart,true);root.addEventListener('pagehide',onDepart,true);root.addEventListener('focus',onReturn,true);if(root.document)root.document.addEventListener('visibilitychange',onVisibility,true);}catch(_){}
    timerId=root.setTimeout(function(){finish(false);},HANDOFF_TIMEOUT_MS);
    var target=root.top||root,uri=fallbackIntent(q),launched=false;
    try{target.location.href=uri;launched=true;}catch(_){try{root.location.href=uri;launched=true;}catch(__){launched=false;}}
    if(!launched)finish(false);
  });
}
function nativeSync(reason){var payload=nativePayload();if(!payload)return false;var fp=fingerprint(payload);if(!fp)return false;if(reason!=='explicit'&&lastSync()===fp)return true;var q=buildQuery(payload,reason==='explicit',false),launched=launchBridge(q,reason);if(launched){markSync(fp);if(reason==='explicit')setAutoEnabled();}return launched;}
function activateForOnboarding(){
  if(!root.QiblaAdhanUI||typeof root.QiblaAdhanUI.setEnabled!=='function')return Promise.resolve(false);
  try{root.QiblaAdhanUI.setEnabled(true);}catch(_){return Promise.resolve(false);}
  var payload=nativePayload();if(!payload||payload.st.enabled!==true)return Promise.resolve(false);
  var fp=fingerprint(payload);if(!fp)return Promise.resolve(false);
  var q=buildQuery(payload,true,true);
  return launchOnboardingBridge(q).then(function(confirmed){if(confirmed){markSync(fp);setAutoEnabled();setOwner(true);}return confirmed;});
}
function maybeAutoSync(reason){captureToken();installWebFallbackGuard();if(!root.sessionStorage.getItem(TOKEN_KEY))return false;if(!autoEnabled()&&!hasExplicitPrayerPrefs())return false;return nativeSync(reason||'auto');}
function explicitSync(){return nativeSync('explicit');}
function start(){if(timer)return;captureToken();ensurePlanModule();installWebFallbackGuard();lastKey=currentKey();timer=root.setInterval(function(){invalidateIfNeeded();if(!root.document||!root.document.hidden)maybeAutoSync('poll');},1500);root.addEventListener('focus',function(){captureToken();installWebFallbackGuard();invalidateIfNeeded();maybeAutoSync('focus');});root.document&&root.document.addEventListener('visibilitychange',function(){if(!root.document.hidden){captureToken();installWebFallbackGuard();invalidateIfNeeded();maybeAutoSync('visible');}});root.addEventListener('qiblaastro:prayer-location-changed',function(){root.setTimeout(function(){maybeAutoSync('location-event');},250);});root.addEventListener('qiblaastro:prayer-runtime-sync',function(e){if(e&&e.detail&&e.detail.ok)root.setTimeout(function(){maybeAutoSync('runtime-ready');},100);});if(root.document)root.document.addEventListener('click',function(e){var t=e.target&&e.target.closest?e.target.closest('#qa-adhan-card,[data-city-id],[data-location-auto],[data-custom-save],[data-method],[data-asr],[data-high-lat],[data-qa-close-sheet],[data-profile],[data-advance],[data-prayer-mode],[data-qa-adhan-toggle]'):null;if(t){try{explicitSync();}catch(_){}}},false);root.setTimeout(function(){maybeAutoSync('startup');},800);}
root.QiblaPrayerNativeSync=Object.freeze({sync:explicitSync,activate:activateForOnboarding,refresh:maybeAutoSync,captureToken:captureToken,getReadiness:getReadiness,nativeOwnerConfirmed:nativeOwnerConfirmed});
root.QiblaPrayerScheduleSync=Object.freeze({start:start,check:invalidateIfNeeded});
if(root.document){if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',start,{once:true});else start();}
})(typeof globalThis!=='undefined'?globalThis:window);
