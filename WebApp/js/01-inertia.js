// ══════════════════════════════════════════════════════════════════════════════
// [JS-1] INERTIA ENGINE — فيزياء البوصلة
// ══════════════════════════════════════════════════════════════════════════════

// ══ Inertia Engine — فيزياء البوصلة ══
var _inertiaCurrent = null;  // الزاوية الحالية المعروضة
var _inertiaTarget  = null;  // الزاوية المستهدفة
var _inertiaRAF     = null;
var _qiblaAligned   = false;

function _inertiaUpdate(){
  if(_inertiaTarget === null){ _inertiaCurrent = null; return; }

  if(_inertiaCurrent === null){ _inertiaCurrent = _inertiaTarget; }

  // أقصر مسار بين الزاويتين
  var diff = _inertiaTarget - _inertiaCurrent;
  if(diff > 180)  diff -= 360;
  if(diff < -180) diff += 360;

  // Low-pass filter — 0.12 = ناعم، 0.25 = سريع
  _inertiaCurrent = (_inertiaCurrent + diff * 0.12 + 360) % 360;

  // تحقق من محاذاة القبلة
  if(typeof QT !== 'undefined'){
    var qDiff = ((QT - _inertiaCurrent) + 360) % 360;
    if(qDiff > 180) qDiff = 360 - qDiff;
    var aligned = qDiff < 5;
    if(aligned !== _qiblaAligned){
      _qiblaAligned = aligned;
      var ring = document.querySelector('.compass-outer-ring');
      if(ring){
        if(aligned){
          ring.classList.add('qibla-aligned');
          try{ navigator.vibrate([30,20,30]); }catch(e){}
        } else {
          ring.classList.remove('qibla-aligned');
        }
      }
    }
  }

  // رسم البوصلة بالزاوية الناعمة
  if(typeof _lastSp !== 'undefined' && _lastSp && typeof drawCompassInertia === 'function'){
    drawCompassInertia(_inertiaCurrent);
  }

  // استمر حتى تستقر
  if(Math.abs(diff) > 0.1){
    _inertiaRAF = requestAnimationFrame(_inertiaUpdate);
  }
}

function _setInertiaTarget(heading){
  _inertiaTarget = heading;
  if(!_inertiaRAF || _inertiaRAF === null){
    _inertiaRAF = requestAnimationFrame(_inertiaUpdate);
  }
}


function drawCompassInertia(smoothHeading){
  if(!CTX) return;
  // استخدم smoothHeading بدل deviceHeading للرسم
  var savedDH = deviceHeading;
  deviceHeading = smoothHeading;
  if(typeof _lastSp !== 'undefined' && _lastSp){
    drawCompass(_lastSp.az, _lastSp.altApp,
      typeof _lastMp !== 'undefined' && _lastMp ? _lastMp.az : 0,
      typeof _lastMp !== 'undefined' && _lastMp ? _lastMp.altApp : 0,
      eCache);
  }
  deviceHeading = savedDH;
}


function updateCompassBoxes(){
  if(typeof QT!=='undefined'&&QT!==null){
    set('box-qibla', QT.toFixed(1)+'°');
    set('q-deg',     QT.toFixed(2)+'°');
    if(typeof MDECL!=='undefined'){
      set('mag-d',(MDECL>=0?'+':'')+MDECL.toFixed(2)+'°');
    }
  }
  if(deviceHeading!==null&&compassAvailable){
    set('box-heading', deviceHeading.toFixed(1)+'°');
    if(typeof QT!=='undefined'&&QT!==null){
      var diff=((QT-deviceHeading)+360)%360;
      if(diff>180) diff=diff-360;
      var absDiff=Math.abs(diff);
      var color=absDiff<5?'#50C880':absDiff<15?'#E8C878':'#FF8080';
      var dir=diff>1?'← يسار':diff<-1?'يمين →':'✅ دقيق';
      // box-diff مخفي
      var el=document.getElementById('box-diff');
      if(el){el.textContent=absDiff.toFixed(1)+'°';el.style.color=color;}
      set('box-dir', dir);
      // box-diff-inline في مربع البوصلة
      var eli=document.getElementById('box-diff-inline');
      if(eli){eli.textContent='الانحراف: '+absDiff.toFixed(1)+'° '+dir;eli.style.color=color;}
    }
  } else {
    set('box-heading','---°');
    set('box-dir','فعّل البوصلة');
    var eli=document.getElementById('box-diff-inline');
    if(eli){eli.textContent='---';eli.style.color='#5A7090';}
  }
  // cal offset
  var cod=document.getElementById('cal-offset-display');
  if(cod) cod.textContent=(calOffset>=0?'+':'')+calOffset.toFixed(0)+'°';
}




// تحميل الإعداد المحفوظ
try{
  if(localStorage.getItem('compassFlip')==='1'){
    _compassFlip=true;
  }
}catch(e){}


function fixCompassFlip(){
  _miuiOffset=(_miuiOffset+180)%360;
  _rawHeading=null; // إعادة ضبط
  var btn=document.getElementById('miui-fix-btn');
  if(btn) btn.style.display='none';
  try{navigator.vibrate([40,30,40]);}catch(e){}
}

// أظهر زر التصحيح بعد 5 ثوانٍ من بدء البوصلة
setTimeout(function(){
  var btn=document.getElementById('miui-fix-btn');
  if(btn&&_compassReady) btn.style.display='block';
},5000);


var _rawHeading = null;
var _compassFlip = false;

function activateCompass(){
  var msg=document.getElementById('compass-status-msg');
  
  function doActivate(){
    _detectMiui();
    // استمع لـ absolute أولاً (Android - أدق)
    var absCount=0;
    window.addEventListener('deviceorientationabsolute',function(e){
      if(e.alpha!==null&&!isNaN(e.alpha)){
        absCount++;
        onDeviceOrientation(e);
      }
    },true);
    // ثم عادي كـ fallback
    window.addEventListener('deviceorientation',function(e){
      if(e.alpha!==null&&!isNaN(e.alpha)&&absCount===0){
        onDeviceOrientation(e);
      }
    },true);
    // GPS بعد تفاعل المستخدم
    tryBrowserGPS();
    if(msg) msg.textContent='✅ البوصلة والموقع يعملان';
  }

  // iOS
  if(typeof DeviceOrientationEvent!=='undefined'&&
     typeof DeviceOrientationEvent.requestPermission==='function'){
    DeviceOrientationEvent.requestPermission()
      .then(function(s){
        if(s==='granted') doActivate();
        else if(msg) msg.textContent='❌ الرجاء السماح بالوصول للمستشعر';
      }).catch(function(){ doActivate(); });
  } else {
    // Android
    doActivate();
  }
}



function dismissActivationScreen(){
  var el = document.getElementById('compass-activate');
  if(el && el.parentNode){
    el.style.transition = 'opacity .5s';
    el.style.opacity = '0';
    setTimeout(function(){
      try{ if(el && el.parentNode) el.parentNode.removeChild(el); }catch(e){}
    }, 500);
  }
}

function onDeviceOrientation(e){
  if(e.alpha===null||e.alpha===undefined||isNaN(e.alpha)) return;
  _compassReady=true;

  var raw=null;
  var isAbsolute=false;

  // iOS - webkitCompassHeading = True North مباشرة
  if(typeof e.webkitCompassHeading==='number'&&!isNaN(e.webkitCompassHeading)){
    raw=e.webkitCompassHeading;
    isAbsolute=true; // True North
    compassAccuracy=e.webkitCompassAccuracy||0;
  }
  // Android absolute = True North
  else if(e.absolute===true){
    raw=(360-e.alpha+360)%360;
    isAbsolute=true; // True North
  }
  // Android عادي = Magnetic North
  else {
    raw=(360-e.alpha+360)%360;
    isAbsolute=false; // Magnetic North
  }

  if(raw===null) return;

  // Xiaomi/Huawei تصحيح
  if(_compassFlip) raw=(raw+180)%360;

  // تنعيم
  if(_rawHeading===null){ _rawHeading=raw; }
  else {
    var diff=raw-_rawHeading;
    if(diff>180) diff-=360;
    if(diff<-180) diff+=360;
    _rawHeading=(_rawHeading+diff*0.15+360)%360;
  }

  compassRaw=_rawHeading;
  compassAvailable=true;
  try{updateBubbleLevel(e.beta,e.gamma);}catch(err){}

  // deviceHeading = True North heading
  // إذا absolute: لا نضيف MDECL (هو True North فعلاً)
  // إذا عادي: نضيف MDECL لتحويله من Magnetic إلى True
  if(isAbsolute){
    deviceHeading=((_rawHeading+calOffset)+360)%360;
  } else {
    deviceHeading=((_rawHeading+calOffset+MDECL)+360)%360;
  }

  if(calMode) calSamples.push(_rawHeading);

  if(typeof _lastSp!=='undefined'&&_lastSp&&typeof drawCompass==='function'){
    drawCompass(_lastSp.az,_lastSp.altApp,
      typeof _lastMp!=='undefined'&&_lastMp?_lastMp.az:0,
      typeof _lastMp!=='undefined'&&_lastMp?_lastMp.altApp:0,
      eCache);
  }
}

// ══ كشف Xiaomi وضبط التصحيح ══
var _miuiOffset=0;
function _detectMiui(){
  var ua=(navigator.userAgent||'').toLowerCase();
  if(ua.indexOf('miui')>-1||ua.indexOf('xiaomi')>-1||ua.indexOf('redmi')>-1){
    // Xiaomi MIUI: معروف بإعطاء alpha معكوس في بعض الإصدارات
    // نبدأ بـ 0 ونترك المستخدم يضبط من زر المعايرة إذا احتاج
    _miuiOffset=0;
    console.log('Xiaomi/MIUI detected - monitoring...');
    // سنراقب أول 10 قراءات ونتحقق من المنطقية
    _miuiCheck=true;
  }
}
var _miuiCheck=false;
var _miuiSamples=[];

function _checkMiuiCalibration(raw){
  if(!_miuiCheck||_miuiSamples.length>=20) return;
  _miuiSamples.push(raw);
}


function _requestCompassPermission(){}


// ══ COMPASS PERMISSION & SENSOR FIX ══
var _compassReady   = false;
var _compassRetries = 0;





// استدعاء فوري عند تحميل الصفحة


// مراقبة أول تفاعل للمستخدم لإعادة المحاولة



