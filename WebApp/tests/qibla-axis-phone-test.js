(function () {
'use strict';

var BridgeModule = window.QiblaAstronomicalObservationBridge;
var Qibla = window.QiblaAstroQiblaEngine;
if (!BridgeModule || !Qibla) throw new Error('Production astronomical modules are unavailable.');

var ids = ['body','fov','start','stop','video','overlay','analysis','axis','target','guide','status','location','celestial','reference','residual','observed','offset','quality','source','log'];
var el = {};
ids.forEach(function (id) { el[id] = document.getElementById(id); });
var ctx = el.overlay.getContext('2d');
var bridge = null;
var locationFix = null;
var lastCelestial = null;
var lastProgress = null;

function finite(v) { return typeof v === 'number' && Number.isFinite(v); }
function normalize360(v) { return ((Number(v) % 360) + 360) % 360; }
function deg(v, digits) { return finite(Number(v)) ? Number(v).toFixed(digits === undefined ? 2 : digits) + '°' : '—'; }
function text(id, value, state) {
  el[id].textContent = value;
  el[id].className = 'v' + (state ? ' ' + state : '');
}
function log(message, data) {
  var line = '[' + new Date().toLocaleTimeString('ar-EG') + '] ' + message;
  if (data !== undefined) {
    try { line += '\n' + JSON.stringify(data, null, 2); } catch (_) { line += '\n' + String(data); }
  }
  el.log.textContent = line + '\n\n' + el.log.textContent;
}

function requestLocation() {
  return new Promise(function (resolve, reject) {
    if (!navigator.geolocation) return reject(new Error('Geolocation API unavailable.'));
    navigator.geolocation.getCurrentPosition(function (position) {
      locationFix = {
        latitude: Number(position.coords.latitude),
        longitude: Number(position.coords.longitude),
        altitude: finite(Number(position.coords.altitude)) ? Number(position.coords.altitude) : null,
        accuracyM: Number(position.coords.accuracy),
        timestamp: Number(position.timestamp || Date.now()),
        source: 'phone-test-gnss'
      };
      text('location', locationFix.latitude.toFixed(5) + ', ' + locationFix.longitude.toFixed(5), 'ok');
      text('reference', deg(Qibla.calculateQiblaBearing(locationFix.latitude, locationFix.longitude)), 'ok');
      log('GNSS fix', locationFix);
      resolve(locationFix);
    }, function (error) {
      reject(new Error('GNSS: ' + error.message));
    }, { enableHighAccuracy: true, timeout: 20000, maximumAge: 5000 });
  });
}

function julianDate(date) { return date.getTime() / 86400000 + 2440587.5; }
function horizontalFromRaDec(date, latitude, longitude, raDeg, decDeg) {
  var jd = julianDate(date);
  var t = (jd - 2451545.0) / 36525;
  var gst = normalize360(280.46061837 + 360.98564736629 * (jd - 2451545) + 0.000387933 * t * t);
  var hDeg = normalize360(gst + longitude - raDeg);
  if (hDeg > 180) hDeg -= 360;
  var r = Math.PI / 180;
  var h = hDeg * r, lat = latitude * r, dec = decDeg * r;
  var sinAlt = Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(h);
  var alt = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
  var y = -Math.sin(h) * Math.cos(dec);
  var x = Math.sin(dec) * Math.cos(lat) - Math.cos(dec) * Math.sin(lat) * Math.cos(h);
  return { azimuthDeg: normalize360(Math.atan2(y, x) / r), altitudeDeg: alt / r };
}
function sunPosition(date, loc) {
  var r = Math.PI / 180;
  var jd = julianDate(date), n = jd - 2451545.0;
  var L = normalize360(280.460 + 0.9856474 * n);
  var g = normalize360(357.528 + 0.9856003 * n) * r;
  var lambda = normalize360(L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * r;
  var epsilon = (23.439 - 0.0000004 * n) * r;
  var ra = Math.atan2(Math.cos(epsilon) * Math.sin(lambda), Math.cos(lambda)) / r;
  var dec = Math.asin(Math.sin(epsilon) * Math.sin(lambda)) / r;
  return horizontalFromRaDec(date, loc.latitude, loc.longitude, ra, dec);
}
function moonPosition(date, loc) {
  var r = Math.PI / 180;
  var d = julianDate(date) - 2451543.5;
  var N = normalize360(125.1228 - 0.0529538083 * d) * r;
  var i = 5.1454 * r;
  var w = normalize360(318.0634 + 0.1643573223 * d) * r;
  var a = 60.2666;
  var e = 0.054900;
  var M = normalize360(115.3654 + 13.0649929509 * d) * r;
  var E = M + e * Math.sin(M) * (1 + e * Math.cos(M));
  var x = a * (Math.cos(E) - e);
  var y = a * Math.sqrt(1 - e * e) * Math.sin(E);
  var v = Math.atan2(y, x), rr = Math.sqrt(x * x + y * y);
  var xe = rr * (Math.cos(N) * Math.cos(v + w) - Math.sin(N) * Math.sin(v + w) * Math.cos(i));
  var ye = rr * (Math.sin(N) * Math.cos(v + w) + Math.cos(N) * Math.sin(v + w) * Math.cos(i));
  var ze = rr * Math.sin(v + w) * Math.sin(i);
  var lon = Math.atan2(ye, xe), lat = Math.atan2(ze, Math.sqrt(xe * xe + ye * ye));
  var eps = (23.4393 - 3.563e-7 * d) * r;
  var xeq = Math.cos(lon) * Math.cos(lat);
  var yeq = Math.sin(lon) * Math.cos(lat) * Math.cos(eps) - Math.sin(lat) * Math.sin(eps);
  var zeq = Math.sin(lon) * Math.cos(lat) * Math.sin(eps) + Math.sin(lat) * Math.cos(eps);
  var ra = Math.atan2(yeq, xeq) / r;
  var dec = Math.atan2(zeq, Math.sqrt(xeq * xeq + yeq * yeq)) / r;
  return horizontalFromRaDec(date, loc.latitude, loc.longitude, ra, dec);
}
function celestialProvider(now, loc) {
  var body = el.body.value;
  var p = body === 'sun' ? sunPosition(new Date(now), loc) : moonPosition(new Date(now), loc);
  lastCelestial = { body: body, azimuthDeg: p.azimuthDeg, altitudeDeg: p.altitudeDeg, timestamp: now };
  text('celestial', deg(p.azimuthDeg) + ' / ' + deg(p.altitudeDeg), p.altitudeDeg > 5 ? 'ok' : 'bad');
  if (p.altitudeDeg <= 3) throw new Error((body === 'sun' ? 'الشمس' : 'القمر') + ' غير صالح للرصد الآن.');
  return lastCelestial;
}

function resizeOverlay() {
  var rect = el.video.getBoundingClientRect();
  var ratio = window.devicePixelRatio || 1;
  el.overlay.width = Math.max(1, Math.round(rect.width * ratio));
  el.overlay.height = Math.max(1, Math.round(rect.height * ratio));
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}
function mapCanvasX(x) {
  if (!bridge || !bridge.canvas) return NaN;
  return Number(x) / bridge.canvas.width * el.video.getBoundingClientRect().width;
}
function placeTarget(alignment) {
  if (!alignment || !alignment.target) return;
  var target = alignment.target;
  var visibleX = mapCanvasX(target.targetX);
  if (finite(visibleX)) el.target.style.left = visibleX + 'px';
  el.target.style.display = target.visible ? 'block' : 'none';
  var evaluation = alignment.evaluation;
  var aligned = !!(evaluation && evaluation.aligned);
  el.target.classList.toggle('aligned', aligned);
  if (!target.visible) {
    el.guide.textContent = 'الجرم خارج مجال رؤية محور القبلة';
    text('residual', 'خارج المجال', 'bad');
  } else if (evaluation) {
    text('residual', deg(evaluation.angularResidualDeg), aligned ? 'ok' : 'bad');
    el.guide.textContent = aligned ? 'تمت محاذاة الجرم مع محور القبلة' : 'حرّك الهاتف حتى يدخل الجرم داخل الهدف';
  } else {
    el.guide.textContent = 'ضع الجرم داخل الهدف المتحرك';
  }
}
function drawDetection(progress) {
  resizeOverlay();
  var rect = el.video.getBoundingClientRect();
  ctx.clearRect(0, 0, rect.width, rect.height);
  var obs = progress && progress.frameObservation;
  if (!obs || !obs.found || !bridge || !bridge.canvas) return;
  var x = mapCanvasX(obs.x);
  var y = Number(obs.y) / bridge.canvas.height * rect.height;
  var radius = Math.max(12, Number(obs.radiusPx || 10) / bridge.canvas.width * rect.width * 1.7);
  ctx.strokeStyle = progress.qiblaAlignment && progress.qiblaAlignment.evaluation && progress.qiblaAlignment.evaluation.aligned ? '#65d69a' : '#63edff';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x - radius - 7, y); ctx.lineTo(x + radius + 7, y); ctx.moveTo(x, y - radius - 7); ctx.lineTo(x, y + radius + 7); ctx.stroke();
}
function onProgress(progress) {
  lastProgress = progress;
  drawDetection(progress);
  placeTarget(progress.qiblaAlignment);
  var tracked = progress.trackedDetection || {};
  var alignment = progress.qiblaAlignment || {};
  if (alignment.target) text('reference', deg(alignment.target.referenceQiblaBearingDeg), 'ok');
  if (alignment.evaluation && alignment.evaluation.aligned && tracked.stable) {
    text('status', 'محاذاة صحيحة — جارٍ حل الاتجاه', 'ok');
  } else if (tracked.stable) {
    text('status', 'الجرم ثابت لكن خارج هدف القبلة', 'bad');
  } else {
    text('status', 'ابحث عن الجرم وثبّت الهاتف');
  }
}
function onResult(result) {
  var observation = result.astronomicalQiblaObservation;
  var alignment = result.qiblaAlignment || (lastProgress && lastProgress.qiblaAlignment);
  placeTarget(alignment);
  text('quality', Math.round(Number(result.quality.overallScore || 0) * 100) + '%', result.accepted ? 'ok' : 'bad');
  if (!observation) {
    text('observed', 'لم تُعتمد', 'bad');
    text('offset', '—');
    text('source', 'لا توجد محاذاة qibla-axis', 'bad');
    text('status', 'الحل الهندسي موجود لكن اللقطة غير مصطفة', 'bad');
  } else {
    text('observed', deg(observation.observedQiblaBearingDeg), 'ok');
    text('reference', deg(observation.referenceQiblaBearingDeg), 'ok');
    text('offset', deg(observation.verificationOffsetDeg), Math.abs(observation.verificationOffsetDeg) <= 1 ? 'ok' : 'bad');
    text('residual', deg(observation.reticleResidualDeg), Math.abs(observation.reticleResidualDeg) <= 1 ? 'ok' : 'bad');
    text('source', observation.source, 'ok');
    text('status', 'تم إنتاج القبلة الفلكية المرصودة', 'ok');
  }
  log('Solver result', {
    accepted: result.accepted,
    trueCameraHeadingDeg: result.trueCameraHeadingDeg,
    geodesicReferenceDeg: result.qibla && result.qibla.qiblaBearingDeg,
    astronomicalQiblaObservation: observation || null,
    alignment: alignment || null,
    quality: result.quality && result.quality.overallScore,
    rejectionReason: result.rejectionReason || null
  });
}
function onError(error) {
  text('status', 'خطأ: ' + error.message, 'bad');
  log('Error', { message: error.message, stack: error.stack || null });
}

async function start() {
  el.start.disabled = true;
  text('status', 'طلب الأذونات...');
  try {
    var loc = await requestLocation();
    celestialProvider(Date.now(), loc);
    bridge = new BridgeModule.AstronomicalObservationBridge({
      video: el.video,
      canvas: el.analysis,
      facingMode: 'environment',
      horizontalFovDeg: Number(el.fov.value) || 65,
      frameIntervalMs: 100,
      solveCooldownMs: 450,
      qiblaAlignmentToleranceDeg: 1,
      locationProvider: function () { return locationFix; },
      celestialProvider: celestialProvider,
      onProgress: onProgress,
      onResult: onResult,
      onError: onError,
      detectorOptions: {
        minimumStableFrames: el.body.value === 'sun' ? 3 : 5,
        historySize: 12,
        maximumFrameAgeMs: 1800,
        maximumCentroidSpreadPx: el.body.value === 'sun' ? 24 : 14,
        edgeMarginRatio: 0.02
      }
    });
    await bridge.start();
    el.stop.disabled = false;
    text('status', 'الكاميرا تعمل — اتبع الهدف الهولوغرامي', 'ok');
    log('Phone test started', { body: el.body.value, fov: Number(el.fov.value), secureContext: window.isSecureContext });
  } catch (error) {
    onError(error);
    el.start.disabled = false;
    if (bridge) bridge.stop();
  }
}
function stop() {
  if (bridge) bridge.stop();
  bridge = null;
  el.start.disabled = false;
  el.stop.disabled = true;
  el.target.classList.remove('aligned');
  el.target.style.left = '50%';
  el.guide.textContent = 'تم إيقاف الرصد';
  text('status', 'تم إيقاف الاختبار');
  log('Phone test stopped');
}

el.start.addEventListener('click', start);
el.stop.addEventListener('click', stop);
window.addEventListener('resize', resizeOverlay);
window.addEventListener('pagehide', stop);
if (!window.isSecureContext) {
  text('status', 'يجب فتح الصفحة عبر HTTPS', 'bad');
  el.start.disabled = true;
  log('Blocked: insecure context');
}
})();