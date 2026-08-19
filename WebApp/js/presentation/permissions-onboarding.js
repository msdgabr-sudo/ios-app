/* QiblaAstro — first-run permissions onboarding and astronomical camera gate.
 * Presentation/integration only. Does not calculate or modify Qibla, GNSS,
 * astronomy, camera solving or verification results.
 *
 * Location permission, trusted GNSS acquisition and native Adhan activation are
 * intentionally separate states. The existing production GNSS/prayer engines
 * remain the only owners of coordinates and prayer-time calculations.
 */
(function(root){
'use strict';
var STORAGE_KEY='qiblaastro:permissions-onboarding:v2';
var mounted=false;
var astroGuardBusy=false;
var gnssRecoveryTimer=null;
var gnssRecoveryAttempt=0;
var adhanPrepareTimer=null;
var adhanPrepareStartedAt=0;
var GNSS_RECOVERY_DELAYS=[13000,17000,25000];
var ADHAN_PREPARE_TIMEOUT=20000;

function isTwaSurface(){
  try{
    var q=new URLSearchParams(root.location.search||'');
    if(q.get('twa')==='1'){root.sessionStorage.setItem('qiblaastro:twa','1');return true;}
    return root.sessionStorage.getItem('qiblaastro:twa')==='1';
  }catch(_){return false;}
}
function isAppSurface(){
  try{
    if(isTwaSurface())return true;
    if(root.matchMedia&&root.matchMedia('(display-mode: standalone)').matches)return true;
    if(root.navigator&&root.navigator.standalone)return true;
  }catch(_){ }
  return false;
}
function readState(){try{return JSON.parse(root.localStorage.getItem(STORAGE_KEY)||'null');}catch(_){return null;}}
function writeState(value){try{root.localStorage.setItem(STORAGE_KEY,JSON.stringify(value));}catch(_){ }}
function mergeState(patch){var current=readState()||{};Object.keys(patch||{}).forEach(function(k){current[k]=patch[k];});writeState(current);return current;}
function permissionLabel(value){
  if(value==='granted')return 'مسموح';
  if(value==='denied')return 'مرفوض';
  if(value==='unsupported')return 'عند الحاجة';
  if(value==='unavailable')return 'غير متاح';
  if(value==='ready')return 'جاهز للتفعيل';
  if(value==='requested')return 'طلب Android';
  if(value==='contextual')return 'مع تفعيل الأذان';
  if(value==='locating')return 'جاري تحديد الموقع';
  return 'بانتظار الموافقة';
}
function permissionClass(value){return value==='granted'||value==='unsupported'||value==='ready'||value==='requested'?'ok':value==='denied'||value==='unavailable'?'bad':'wait';}

function trustedGnssReady(){
  try{
    return typeof gnssHasTrustedFix!=='undefined'&&gnssHasTrustedFix===true&&
      typeof gnssSource!=='undefined'&&gnssSource==='gps'&&
      typeof LAT!=='undefined'&&typeof LON!=='undefined'&&
      Number.isFinite(Number(LAT))&&Number.isFinite(Number(LON));
  }catch(_){return false;}
}
function trustedGnssBusy(){try{return typeof gnssUpdating!=='undefined'&&gnssUpdating===true;}catch(_){return false;}}
function prayerRuntimeReady(){
  try{
    if(root.QiblaTrustedLocationRuntimeSync&&typeof root.QiblaTrustedLocationRuntimeSync.getState==='function'){
      var st=root.QiblaTrustedLocationRuntimeSync.getState();
      if(st&&st.ok===true)return true;
    }
  }catch(_){ }
  try{
    if(typeof pCache!=='undefined'&&Array.isArray(pCache)){
      var names={'الفجر':1,'الظهر':1,'العصر':1,'المغرب':1,'العشاء':1},count=0;
      pCache.forEach(function(p){if(p&&names[p.n]&&Number.isFinite(Number(p.h)))count++;});
      return count===5;
    }
  }catch(_){ }
  return false;
}
function nativePrayerBridgeStatus(){
  try{
    var api=root.QiblaPrayerNativeSync;
    if(!api||typeof api.getReadiness!=='function'||typeof api.activate!=='function')return {ready:false,reason:'bridge-version'};
    var status=api.getReadiness();
    return status&&typeof status==='object'?status:{ready:false,reason:'bridge-status'};
  }catch(_){return {ready:false,reason:'bridge-error'};}
}
function nativePrayerBridgeReady(){return nativePrayerBridgeStatus().ready===true;}
function clearGnssRecovery(){if(gnssRecoveryTimer!==null){try{root.clearTimeout(gnssRecoveryTimer);}catch(_){}gnssRecoveryTimer=null;}}
function scheduleGnssRecovery(){
  if(trustedGnssReady()){clearGnssRecovery();gnssRecoveryAttempt=0;return;}
  if(gnssRecoveryTimer!==null||gnssRecoveryAttempt>=GNSS_RECOVERY_DELAYS.length)return;
  var delay=GNSS_RECOVERY_DELAYS[gnssRecoveryAttempt++];
  gnssRecoveryTimer=root.setTimeout(function(){gnssRecoveryTimer=null;recoverTrustedGnss(false);},delay);
}
async function recoverTrustedGnss(reset){
  if(!isAppSurface())return false;
  if(reset){clearGnssRecovery();gnssRecoveryAttempt=0;}
  if(trustedGnssReady()){clearGnssRecovery();gnssRecoveryAttempt=0;return true;}
  var permission=await queryLocationPermission();
  if(permission==='unknown'||permission==='prompt'){
    var saved=readState();
    if(saved&&saved.location==='granted')permission='granted';
  }
  if(permission!=='granted')return false;
  if(!trustedGnssBusy()&&typeof root.tryBrowserGPS==='function'){
    try{root.tryBrowserGPS();}catch(_){ }
  }
  scheduleGnssRecovery();
  return true;
}

function ensureStyle(){
  if(!root.document||root.document.getElementById('qa-permission-style'))return;
  var s=root.document.createElement('style');s.id='qa-permission-style';
  s.textContent='.qa-permission-overlay{position:fixed;inset:0;z-index:2147483000;background:rgba(2,6,12,.88);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;padding:20px;direction:rtl}.qa-permission-card{width:min(430px,100%);background:linear-gradient(180deg,#0d1828,#07111d);border:1px solid rgba(200,164,74,.34);border-radius:24px;padding:22px;box-shadow:0 24px 80px rgba(0,0,0,.55);color:#f4f7fb;font-family:inherit}.qa-permission-card h2{font-size:1.2rem;margin:0 0 8px;color:#e8c878}.qa-permission-card>p{font-size:.78rem;line-height:1.85;color:#afc0d6;margin:0 0 16px}.qa-permission-item{display:flex;gap:12px;align-items:flex-start;padding:12px;margin:8px 0;border-radius:15px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.08)}.qa-permission-item .ico{font-size:1.4rem}.qa-permission-item b{display:block;font-size:.84rem;margin-bottom:3px}.qa-permission-item small{display:block;color:#8197b2;line-height:1.65;font-size:.68rem}.qa-permission-state{margin-inline-start:auto;font-size:.62rem;padding:4px 8px;border-radius:999px;white-space:nowrap}.qa-permission-state.ok{color:#86e8ae;background:rgba(58,180,105,.14)}.qa-permission-state.bad{color:#ff9b9b;background:rgba(210,70,70,.14)}.qa-permission-state.wait{color:#a9bfd9;background:rgba(120,150,190,.12)}.qa-permission-actions{display:flex;gap:9px;margin-top:17px}.qa-permission-actions button{flex:1;border:0;border-radius:13px;padding:12px 10px;font:inherit;font-size:.82rem;font-weight:700;cursor:pointer}.qa-permission-actions button:disabled{opacity:.72;cursor:wait}.qa-permission-primary{background:#d3aa43;color:#09111d}.qa-permission-secondary{background:rgba(255,255,255,.07);color:#d9e3ef;border:1px solid rgba(255,255,255,.12)!important}.qa-permission-note{display:block;margin-top:12px;font-size:.62rem;line-height:1.7;color:#7389a4}.qa-permission-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:2147483001;background:#101b2a;color:#fff;border:1px solid rgba(255,255,255,.15);border-radius:12px;padding:10px 14px;font:600 .76rem/1.5 inherit;box-shadow:0 12px 35px rgba(0,0,0,.45);max-width:min(90vw,420px);text-align:center;direction:rtl}';
  (root.document.head||root.document.documentElement).appendChild(s);
}
function toast(text){
  ensureStyle();var old=root.document.getElementById('qa-permission-toast');if(old)old.remove();
  var n=root.document.createElement('div');n.id='qa-permission-toast';n.className='qa-permission-toast';n.textContent=text;root.document.body.appendChild(n);root.setTimeout(function(){if(n&&n.parentNode)n.remove();},4200);
}
async function getLocationPermissionStatus(){
  try{
    if(!root.navigator.permissions||typeof root.navigator.permissions.query!=='function')return null;
    return await root.navigator.permissions.query({name:'geolocation'});
  }catch(_){return null;}
}
async function queryLocationPermission(){var status=await getLocationPermissionStatus();return status&&status.state?status.state:'unknown';}
async function requestLocation(){
  if(!root.navigator.geolocation)return 'unsupported';
  var status=await getLocationPermissionStatus();
  if(status&&status.state==='granted')return 'granted';
  if(status&&status.state==='denied')return 'denied';
  return new Promise(function(resolve){
    var done=false,timer=null;
    function cleanup(){if(timer!==null){root.clearTimeout(timer);timer=null;}try{if(status)status.onchange=null;}catch(_){ }}
    function finish(v){if(done)return;done=true;cleanup();resolve(v);}
    async function settleFromPermission(){
      var p=await queryLocationPermission();
      if(p==='granted'||p==='denied')finish(p);else finish('prompt');
    }
    if(status){status.onchange=function(){if(status.state==='granted'||status.state==='denied')finish(status.state);};}
    timer=root.setTimeout(settleFromPermission,10000);
    try{
      root.navigator.geolocation.getCurrentPosition(
        function(){finish('granted');},
        function(err){
          if(err&&err.code===1){finish('denied');return;}
          /* A slow or temporarily unavailable fix is not a permission denial.
             Resolve from the permission state and let the existing trusted GNSS
             lifecycle acquire the high-accuracy fresh fix separately. */
          settleFromPermission();
        },
        {enableHighAccuracy:false,timeout:8000,maximumAge:60000}
      );
    }catch(_){finish('unavailable');}
  });
}
function requestWebNotifications(){
  try{
    if(!('Notification' in root))return Promise.resolve('unsupported');
    if(root.Notification.permission==='granted'||root.Notification.permission==='denied')return Promise.resolve(root.Notification.permission);
    var p=root.Notification.requestPermission();return p&&typeof p.then==='function'?p:Promise.resolve(root.Notification.permission||'default');
  }catch(_){return Promise.resolve('unavailable');}
}
function stateNode(name){return root.document.querySelector('[data-qa-permission-state="'+name+'"]');}
function setState(name,value){var n=stateNode(name);if(!n)return;n.textContent=permissionLabel(value);n.className='qa-permission-state '+permissionClass(value);}
function note(text){var n=root.document.getElementById('qa-permission-note');if(n)n.textContent=text||'';}
function primaryButton(){return root.document.getElementById('qa-permission-allow');}
function closeOverlay(markDone){var n=root.document.getElementById('qa-permission-overlay');if(n)n.remove();if(markDone)mergeState({completed:true,completedAt:Date.now()});}
function clearAdhanPrepare(){if(adhanPrepareTimer!==null){try{root.clearTimeout(adhanPrepareTimer);}catch(_){}adhanPrepareTimer=null;}}
function bridgeWaitMessage(status){
  var reason=status&&status.reason?status.reason:'';
  if(reason==='native-token'||reason==='bridge-version')return 'لم تكتمل قناة الربط مع Android. أغلق التطبيق وافتحه من أيقونة QiblaAstro ثم أعد المحاولة.';
  if(reason==='plan-loading'||reason==='native-plan'||reason==='prayer-times')return 'يتم تجهيز جدول الصلاة المحلي قبل تسليمه إلى Android. انتظر لحظات ثم أعد المحاولة.';
  if(reason==='adhan-ui')return 'يتم تجهيز إعدادات الأذان المحلية. انتظر لحظات ثم أعد المحاولة.';
  return 'لم يكتمل موقع GNSS أو جدول الصلاة بعد. تأكد أن خدمة الموقع مفعّلة ثم أعد المحاولة.';
}
function showAdhanStage(){
  clearAdhanPrepare();
  var btn=primaryButton();if(!btn)return;
  btn.disabled=false;btn.dataset.stage='adhan';btn.textContent='تفعيل الأذان والمتابعة';
  setState('location','granted');setState('notifications','ready');
  note('الموقع وجدول الصلاة وقناة Android جاهزة. اضغط لتفعيل الأذان وطلب إذن الإشعارات الأصلي عند الحاجة.');
}
function prepareAdhanStage(reset){
  if(!isTwaSurface()){
    mergeState({completed:true,location:'granted',notifications:'contextual',completedAt:Date.now()});
    closeOverlay(false);return;
  }
  if(reset){clearAdhanPrepare();adhanPrepareStartedAt=Date.now();}
  if(trustedGnssReady()&&prayerRuntimeReady()&&nativePrayerBridgeReady()){showAdhanStage();return;}
  var btn=primaryButton();if(btn){btn.disabled=true;btn.dataset.stage='prepare';btn.textContent='جاري تحديد الموقع وتجهيز الأذان...';}
  setState('location',trustedGnssReady()?'granted':'locating');setState('notifications','contextual');
  note('يتم الآن الحصول على موقع GNSS الموثوق وتجهيز مواقيت الصلاة وقناة Android. لن يتم استخدام موقع تقريبي أو افتراضي.');
  if(Date.now()-adhanPrepareStartedAt>=ADHAN_PREPARE_TIMEOUT){
    clearAdhanPrepare();
    if(btn){btn.disabled=false;btn.dataset.stage='location';btn.textContent='إعادة المحاولة';}
    note(bridgeWaitMessage(nativePrayerBridgeStatus()));
    return;
  }
  adhanPrepareTimer=root.setTimeout(function(){adhanPrepareTimer=null;recoverTrustedGnss(false);prepareAdhanStage(false);},350);
}
function failNativeAdhanActivation(btn){
  mergeState({completed:false,notifications:'contextual',adhanNativeRequested:false});
  if(btn){btn.disabled=false;btn.dataset.stage='adhan';btn.textContent='تفعيل الأذان والمتابعة';}
  setState('notifications','contextual');
  note('لم يؤكد Android استلام طلب التفعيل. أعد المحاولة؛ وإذا استمرت المشكلة أغلق التطبيق وافتحه من أيقونته ثم حاول مرة أخرى.');
}
function activateNativeAdhan(){
  var btn=primaryButton();if(!btn)return;
  if(!trustedGnssReady()||!prayerRuntimeReady()||!nativePrayerBridgeReady()){prepareAdhanStage(true);return;}
  btn.disabled=true;btn.dataset.stage='adhan';btn.textContent='جاري تفعيل الأذان...';
  setState('notifications','requested');
  mergeState({completed:false,location:'granted',notifications:'requested',adhanNativeRequested:false,twa:true});
  var activation=null;
  try{activation=root.QiblaPrayerNativeSync.activate();}catch(_){activation=null;}
  if(!activation||typeof activation.then!=='function'){failNativeAdhanActivation(btn);return;}
  activation.then(function(confirmed){
    if(!confirmed){failNativeAdhanActivation(btn);return;}
    mergeState({completed:true,location:'granted',notifications:'requested',adhanNativeRequested:true,twa:true,completedAt:Date.now()});
    setState('notifications','requested');
    closeOverlay(false);
  }).catch(function(){failNativeAdhanActivation(btn);});
}

async function runPermissionRequest(){
  var btn=primaryButton();if(!btn)return;
  if(btn.dataset.stage==='adhan'){activateNativeAdhan();return;}
  if(btn.dataset.stage==='prepare')return;
  btn.disabled=true;btn.dataset.stage='location';btn.textContent='جاري طلب صلاحية الموقع...';
  setState('notifications','contextual');
  var locationResult=await requestLocation();
  setState('location',locationResult);
  if(locationResult==='granted'){
    mergeState({completed:false,location:'granted',notifications:'contextual',twa:isTwaSurface(),locationGrantedAt:Date.now()});
    if(typeof root.tryBrowserGPS==='function'&&!trustedGnssBusy()){
      try{root.tryBrowserGPS();}catch(_){ }
    }
    recoverTrustedGnss(true);
    prepareAdhanStage(true);
    return;
  }
  btn.disabled=false;btn.dataset.stage='location';btn.textContent='إعادة طلب صلاحية الموقع';
  if(locationResult==='denied')note('صلاحية الموقع مرفوضة. فعّلها من إعدادات Android أو إعدادات الموقع ثم أعد المحاولة.');
  else if(locationResult==='prompt')note('لم يصل رد نهائي من Android. اضغط إعادة المحاولة وتأكد من اختيار السماح للموقع.');
  else note('تعذر بدء طلب الموقع. تحقق من إعدادات الموقع ثم أعد المحاولة.');
}
function mountOnboarding(force){
  if(!root.document||mounted&&!force)return;if(!force&&!isAppSurface())return;
  var saved=readState();if(!force&&saved&&saved.completed)return;
  mounted=true;ensureStyle();
  var old=root.document.getElementById('qa-permission-overlay');if(old)old.remove();
  var wrap=root.document.createElement('div');wrap.id='qa-permission-overlay';wrap.className='qa-permission-overlay';
  wrap.innerHTML='<div class="qa-permission-card" role="dialog" aria-modal="true" aria-labelledby="qa-permission-title"><h2 id="qa-permission-title">صلاحيات QiblaAstro</h2><p>نطلب فقط الصلاحيات اللازمة للميزات التي تستخدمها. لا تُستخدم هذه الصلاحيات للإعلانات.</p><div class="qa-permission-item"><span class="ico">📍</span><div><b>الموقع</b><small>لحساب القبلة ومواقيت الصلاة والبيانات الفلكية من موقع الجهاز.</small></div><span class="qa-permission-state wait" data-qa-permission-state="location">بانتظار الموافقة</span></div><div class="qa-permission-item"><span class="ico">🔔</span><div><b>الإشعارات والأذان</b><small>بعد تثبيت موقعك سنسلّم جدول الصلاة إلى Android، وسيطلب إذن الإشعارات الأصلي عند الحاجة ليعمل الأذان والتطبيق مغلقًا.</small></div><span class="qa-permission-state wait" data-qa-permission-state="notifications">مع تفعيل الأذان</span></div><div class="qa-permission-item"><span class="ico">📷</span><div><b>الكاميرا</b><small>لن نطلبها الآن. ستظهر نافذة الإذن فقط عندما تضغط «تحقق فلكي».</small></div><span class="qa-permission-state ok">عند الحاجة فقط</span></div><div class="qa-permission-actions"><button type="button" id="qa-permission-allow" class="qa-permission-primary" data-stage="location">السماح والمتابعة</button><button type="button" id="qa-permission-later" class="qa-permission-secondary">لاحقًا</button></div><small id="qa-permission-note" class="qa-permission-note">الموقع مطلوب لصلب التطبيق. الإشعارات الأصلية تُطلب فقط عند تفعيل الأذان أو تنبيه يحتاجها.</small></div>';
  root.document.body.appendChild(wrap);
  setState('notifications','contextual');
  root.document.getElementById('qa-permission-allow').addEventListener('click',runPermissionRequest);
  root.document.getElementById('qa-permission-later').addEventListener('click',function(){clearAdhanPrepare();closeOverlay(false);});
  if(saved&&saved.location==='granted'){
    setState('location','granted');recoverTrustedGnss(true);prepareAdhanStage(true);
  }
}

function cameraPermissionErrorMessage(err){
  var name=err&&err.name?String(err.name):'';
  if(name==='NotAllowedError'||name==='SecurityError')return 'يلزم السماح بالكاميرا لإجراء التحقق الفلكي. فعّل إذن الكاميرا ثم أعد المحاولة.';
  if(name==='NotFoundError'||name==='OverconstrainedError')return 'تعذر العثور على كاميرا خلفية متاحة للتحقق الفلكي.';
  return 'تعذر تهيئة الكاميرا للتحقق الفلكي. تحقق من صلاحية الكاميرا ثم أعد المحاولة.';
}
async function ensureCameraPermission(){
  if(!root.navigator.mediaDevices||typeof root.navigator.mediaDevices.getUserMedia!=='function')throw new Error('CAMERA_API_UNAVAILABLE');
  var stream=await root.navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:'environment'}}});
  try{if(stream&&stream.getTracks)stream.getTracks().forEach(function(track){try{track.stop();}catch(_){ }});}catch(_){ }
  return true;
}
async function handleAstroClick(event){
  var target=event.target&&event.target.closest?event.target.closest('#qa-astro-reverify'):null;
  if(!target||astroGuardBusy)return;
  event.preventDefault();event.stopPropagation();if(event.stopImmediatePropagation)event.stopImmediatePropagation();
  astroGuardBusy=true;target.disabled=true;
  var label=root.document.getElementById('qa-verify-action-label'),old=label&&label.textContent;
  if(label)label.textContent='طلب إذن الكاميرا...';
  try{
    await ensureCameraPermission();
    var api=root.AstroVerification;
    if(!api||typeof api.startProductionVerification!=='function')throw new Error('ASTRO_VERIFICATION_UNAVAILABLE');
    var state=api.getFlowState?api.getFlowState():null;
    if(state&&state.state==='success'&&typeof api.resetFlow==='function')api.resetFlow();
    if(!(state&&(state.state==='loading'||state.state==='observing')))api.startProductionVerification();
  }catch(err){toast(cameraPermissionErrorMessage(err));}
  finally{astroGuardBusy=false;target.disabled=false;if(label&&old)label.textContent=old;}
}
function installAstroCameraGuard(){if(!root.document||root.document.__qaAstroCameraPermissionGuard)return;root.document.__qaAstroCameraPermissionGuard=true;root.document.addEventListener('click',handleAstroClick,true);}
function start(){
  installAstroCameraGuard();
  if(!isAppSurface())return;
  root.setTimeout(function(){recoverTrustedGnss(true);},100);
  root.setTimeout(function(){mountOnboarding(false);},1400);
  root.addEventListener('focus',function(){recoverTrustedGnss(true);});
  root.document.addEventListener('visibilitychange',function(){if(!root.document.hidden)recoverTrustedGnss(true);});
  root.addEventListener('qiblaastro:prayer-runtime-sync',function(){if(root.document.getElementById('qa-permission-overlay'))prepareAdhanStage(false);});
}

root.QiblaPermissions=Object.freeze({showOnboarding:function(){mountOnboarding(true);},ensureCameraForVerification:ensureCameraPermission,isAppSurface:isAppSurface,getState:readState,requestNotifications:requestWebNotifications,recoverTrustedGnss:function(){return recoverTrustedGnss(true);}});
if(root.document){if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',start,{once:true});else start();}
})(typeof globalThis!=='undefined'?globalThis:window);
