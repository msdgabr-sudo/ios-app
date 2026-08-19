// ══════════════════════════════════════════════════════════════════════════════
// [JS-5] GNSS — Multi-constellation position system
// ══════════════════════════════════════════════════════════════════════════════

// Trusted position policy:
// Device Geolocation only (GPS/GLONASS/Galileo/BeiDou as provided by the OS/browser).
// On iOS native builds, Core Location is the trusted device provider and feeds
// this same existing GNSS state contract. It does not calculate Qibla/WMM/prayer
// or astronomical results. IP geolocation and default-city fallbacks are forbidden.
// Until a trusted fix is available, coordinates are deliberately non-finite.
let LAT = Number.NaN;
let LON = Number.NaN;
let gnssSource   = 'unresolved'; // 'gps'|'unresolved'
let gnssAccuracy = null;         // meters
let gnssAltitudeMeters = 0;
let gnssUpdating = false;
let gnssHasTrustedFix = false;

function showGnssUnavailable(message){
  gnssUpdating=false;
  gnssSource='unresolved';
  gnssAccuracy=null;
  gnssHasTrustedFix=false;
  MDECL_READY=false;
  MDECL_STATUS='unavailable';
  MDECL_FIELD=null;
  MDECL=0;
  QM=QT;
  var txt=message||'تعذر تحديد موقعك — فعّل الموقع وامنح الإذن ثم أعد المحاولة';
  set('compass-status-msg',txt);
  set('gnss-badge','الموقع غير محدد');
  set('gnss-btn-status','⚠ أعد المحاولة');
  set('hm-gps-src','الموقع غير محدد');
  set('mag-d','---');
  set('q-mag','---');
  set('cfg-qm','---');
  set('cfg-md','---');
  set('mag-decl-inline','---');
  var el;
  el=document.getElementById('gnss-src');if(el)el.textContent='لم يتم الحصول على GPS/GNSS موثوق';
  el=document.getElementById('gnss-acc');if(el)el.textContent='---';
}

function updateQiblaFromPosition(){
  // Never publish a Qibla/location update unless coordinates came from the device.
  if(!gnssHasTrustedFix||gnssSource!=='gps'){
    showGnssUnavailable();
    return;
  }
  if(!refreshMdeclFromTrustedGnss(new Date())){
    set('mag-d',MDECL_STATUS==='blackout'?'⚠ مجال مغناطيسي ضعيف':'---');
    return;
  }
  QT=calcQibla(LAT,LON); QM=((QT-MDECL)+360)%360;
  var dirs=['شمال','شمال شرق','شرق','جنوب شرق','جنوب','جنوب غرب','غرب','شمال غرب'];
  var qDir=dirs[Math.round(((QT%360)+360)/45)%8];
  var acc=gnssAccuracy?Math.round(gnssAccuracy):0;
  var srcTxt='✓ GPS/GNSS الجهاز';
  var srcBadge='GPS '+acc+'م±'+(MDECL_STATUS==='caution'?' · WMM تنبيه مجال ضعيف':'');
  set('box-qibla',QT.toFixed(1)+'°');
  set('q-deg',QT.toFixed(2)+'°');
  set('q-dir',qDir);
  set('gnss-badge',srcBadge);
  set('gnss-btn-status','✓ GPS '+acc+'م');
  set('compass-status-msg',srcBadge+' · '+QT.toFixed(1)+'° '+qDir);
  set('mag-d',(MDECL>=0?'+':'')+MDECL.toFixed(2)+'°');
  set('hm-qibla-deg',QT.toFixed(1)+'°');
  set('hm-gps-src',srcBadge);
  var _el;
  _el=document.getElementById('gnss-lat');if(_el)_el.textContent=LAT.toFixed(6)+'° N';
  _el=document.getElementById('gnss-lon');if(_el)_el.textContent=LON.toFixed(6)+'° E';
  _el=document.getElementById('gnss-src');if(_el)_el.textContent=srcTxt;
  _el=document.getElementById('gnss-acc');if(_el)_el.textContent=acc?'~'+acc+'م':'---';
  _el=document.getElementById('gnss-qibla');if(_el)_el.textContent=QT.toFixed(2)+'° — '+qDir;
}

function acceptTrustedDevicePosition(latitude,longitude,accuracy,altitude){
  if(!Number.isFinite(latitude)||!Number.isFinite(longitude)||!Number.isFinite(accuracy)||accuracy<0)return false;
  if(latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180)return false;
  LAT=latitude;
  LON=longitude;
  gnssAccuracy=accuracy;
  gnssAltitudeMeters=Number.isFinite(altitude)?altitude:0;
  gnssSource='gps';
  gnssHasTrustedFix=true;
  gnssUpdating=false;
  updateQiblaFromPosition();
  return true;
}

function iosLocationErrorMessage(code){
  if(code==='denied')return 'تم رفض إذن الموقع — امنح QiblaAstro إذن الموقع من إعدادات iPhone ثم أعد المحاولة';
  if(code==='restricted')return 'الوصول إلى الموقع مقيّد على هذا iPhone';
  if(code==='services-disabled')return 'خدمات الموقع مغلقة — فعّل خدمات الموقع في إعدادات iPhone ثم أعد المحاولة';
  if(code==='reduced-accuracy')return 'الدقة التقريبية مفعّلة — فعّل «الموقع الدقيق» لـ QiblaAstro ثم أعد المحاولة';
  if(code==='timeout')return 'لم يصل موقع دقيق وحديث من iPhone في الوقت المحدد — انتقل لمكان مفتوح وأعد المحاولة';
  return 'تعذر الحصول على موقع دقيق من iPhone — أعد المحاولة';
}

function requestIOSNativeGPS(){
  var api=window.QiblaIOSNative;
  if(!api||api.platform!=='ios'||typeof api.requestLocation!=='function')return false;

  api.requestLocation().then(function(result){
    try{
      if(!result||result.ok!==true||result.source!=='core-location'||result.fullAccuracy!==true||!result.coords){
        showGnssUnavailable('لم يقدّم iPhone موقعًا دقيقًا موثوقًا');
        return;
      }
      var ts=Number(result.timestamp);
      if(!Number.isFinite(ts)||Math.abs(Date.now()-ts)>30000){
        showGnssUnavailable('تم تجاهل موقع iPhone قديم — أعد المحاولة للحصول على قراءة حديثة');
        return;
      }
      var c=result.coords;
      if(!acceptTrustedDevicePosition(Number(c.latitude),Number(c.longitude),Number(c.accuracy),Number(c.altitude))){
        showGnssUnavailable('تم رفض قراءة موقع غير صالحة من iPhone');
      }
    }catch(e){showGnssUnavailable('تعذر معالجة موقع iPhone — أعد المحاولة');}
  }).catch(function(error){
    showGnssUnavailable(iosLocationErrorMessage(error&&error.code));
  });
  return true;
}

// Browser Geolocation uses the device location provider. Android/PWA remain on
// this path. Native iOS uses the Core Location bridge above and never falls back
// to browser/IP/default-city location when that bridge is present.
function resetCompassCalibration(){
  _rawHeading=null;
  compassAvailable=false;
  calOffset=0;
  var msg=document.getElementById('compass-status-msg');
  if(msg) msg.textContent='✅ تمت إعادة المعايرة — حرّك الهاتف';
  var cod=document.getElementById('cal-offset-display');
  if(cod) cod.textContent='0°';
  try{navigator.vibrate([40,30,40]);}catch(e){}
}

function showManualCal(){
  var el=document.getElementById('manual-cal-section');
  if(el){el.style.display='block';el.scrollIntoView({behavior:'smooth',block:'nearest'});}
}
function hideManualCal(){
  var el=document.getElementById('manual-cal-section');
  if(el) el.style.display='none';
}

function tryBrowserGPS(){
  if(gnssUpdating)return;
  gnssUpdating=true;
  set('compass-status-msg','⏳ جاري تحديث موقعك من GNSS...');
  set('gnss-btn-status','⏳ جاري التحديث...');
  var srcEl=document.getElementById('gnss-src');if(srcEl)srcEl.textContent='جاري طلب موقع جديد من الجهاز...';

  if(requestIOSNativeGPS())return;

  if(window._gnssWatchId != null){
    try{navigator.geolocation.clearWatch(window._gnssWatchId);}catch(e){}
    window._gnssWatchId = null;
  }

  try{
    if(!navigator||!('geolocation' in navigator)){
      showGnssUnavailable('خدمة الموقع غير متاحة على هذا الجهاز');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      function(pos){
        try{
          if(!pos||!pos.coords||!acceptTrustedDevicePosition(
            Number(pos.coords.latitude),
            Number(pos.coords.longitude),
            Number(pos.coords.accuracy),
            Number(pos.coords.altitude)
          )){
            showGnssUnavailable();
            return;
          }
          try{
            window._gnssWatchId = navigator.geolocation.watchPosition(
              function(p2){
                try{
                  if(p2&&p2.coords&&Number.isFinite(p2.coords.latitude)&&Number.isFinite(p2.coords.longitude)&&Number.isFinite(p2.coords.accuracy)&&p2.coords.accuracy<(gnssAccuracy||9999)){
                    acceptTrustedDevicePosition(
                      Number(p2.coords.latitude),
                      Number(p2.coords.longitude),
                      Number(p2.coords.accuracy),
                      Number(p2.coords.altitude)
                    );
                  }
                }catch(e){}
              },
              function(){},
              {enableHighAccuracy:true,timeout:30000,maximumAge:0}
            );
          }catch(e){}
        }catch(e){ showGnssUnavailable(); }
      },
      function(err){
        var msg='تعذر تحديد موقعك — فعّل الموقع وامنح الإذن ثم أعد المحاولة';
        if(err&&err.code===1)msg='تم رفض إذن الموقع — امنح إذن الموقع ثم أعد المحاولة';
        showGnssUnavailable(msg);
      },
      {enableHighAccuracy:true,timeout:10000,maximumAge:0}
    );
  }catch(e){ showGnssUnavailable(); }
}

// Compatibility alias only. It deliberately does NOT perform IP geolocation.
function tryIPGeo(){
  showGnssUnavailable('يلزم موقع GPS/GNSS من الجهاز — لا يتم استخدام موقع IP التقريبي');
}

window.tryBrowserGPS = tryBrowserGPS;
window.tryIPGeo      = tryIPGeo;

// GPS is requested after user interaction by the existing activation flow.
