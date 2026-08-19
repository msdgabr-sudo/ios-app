(function () {
  'use strict';

  var BridgeModule = window.QiblaAstronomicalObservationBridge;
  if (!BridgeModule) throw new Error('Astronomical observation bridge is unavailable.');

  var els = {};
  ['body','fov','start','stop','video','overlay','analysisCanvas','status','location','gravity','detection','celestial','heading','qibla','deviation','quality','log'].forEach(function (id) {
    els[id] = document.getElementById(id);
  });

  var bridge = null;
  var lastLocation = null;
  var lastCelestial = null;
  var overlayCtx = els.overlay.getContext('2d');

  function log(message, data) {
    var line = '[' + new Date().toLocaleTimeString('ar-EG') + '] ' + message;
    if (data !== undefined) {
      try { line += '\n' + JSON.stringify(data, null, 2); }
      catch (error) { line += '\n' + String(data); }
    }
    els.log.textContent = line + '\n\n' + els.log.textContent;
  }

  function setText(id, value, state) {
    els[id].textContent = value;
    els[id].className = 'v' + (state ? ' ' + state : '');
  }

  function deg(value, digits) {
    return Number.isFinite(value) ? value.toFixed(digits === undefined ? 2 : digits) + '°' : '—';
  }

  function getLocation() {
    return new Promise(function (resolve, reject) {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation API is not supported.'));
        return;
      }
      navigator.geolocation.getCurrentPosition(function (position) {
        lastLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude
        };
        setText('location', lastLocation.latitude.toFixed(5) + ', ' + lastLocation.longitude.toFixed(5));
        log('تم الحصول على الموقع', lastLocation);
        resolve(lastLocation);
      }, function (error) {
        reject(new Error('تعذر الحصول على الموقع: ' + error.message));
      }, {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 5000
      });
    });
  }

  function julianDate(date) {
    return date.getTime() / 86400000 + 2440587.5;
  }

  function normalize360(value) {
    return ((value % 360) + 360) % 360;
  }

  function horizontalFromRaDec(date, latitude, longitude, raDeg, decDeg) {
    var jd = julianDate(date);
    var jd0 = Math.floor(jd - 0.5) + 0.5;
    var t0 = (jd0 - 2451545) / 36525;
    var gst = 100.4606184 + 36000.77004 * t0 + 0.000388 * t0 * t0;
    gst += 360.98564724 * (date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600) / 24;
    gst = normalize360(gst);

    var hourAngle = normalize360(gst + longitude - raDeg);
    if (hourAngle > 180) hourAngle -= 360;

    var d2r = Math.PI / 180;
    var h = hourAngle * d2r;
    var lat = latitude * d2r;
    var dec = decDeg * d2r;
    var sinAlt = Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(h);
    var altitude = Math.asin(Math.max(-1, Math.min(1, sinAlt))) / d2r;
    var cosAz = (Math.sin(dec) - Math.sin(lat) * sinAlt) /
      (Math.cos(lat) * (Math.cos(altitude * d2r) || 1e-9));
    var azimuth = Math.acos(Math.max(-1, Math.min(1, cosAz))) / d2r;
    if (Math.sin(h) > 0) azimuth = 360 - azimuth;
    return { azimuthDeg: azimuth, altitudeDeg: altitude };
  }

  function sunPosition(date, location) {
    var d2r = Math.PI / 180;
    var jd = julianDate(date);
    var t = (jd - 2451545) / 36525;
    var l0 = normalize360(280.46646 + 36000.76983 * t + 0.0003032 * t * t);
    var m = normalize360(357.52911 + 35999.05029 * t - 0.0001537 * t * t);
    var mr = m * d2r;
    var c = (1.914602 - 0.004817 * t - 0.000014 * t * t) * Math.sin(mr) +
      (0.019993 - 0.000101 * t) * Math.sin(2 * mr) + 0.000289 * Math.sin(3 * mr);
    var omega = 125.04 - 1934.136 * t;
    var lambda = (l0 + c - 0.00569 - 0.00478 * Math.sin(omega * d2r)) * d2r;
    var epsilon = (23 + 26 / 60 + 21.448 / 3600 - (46.815 / 3600) * t) * d2r +
      0.00256 * Math.cos(omega * d2r) * d2r;
    var ra = Math.atan2(Math.cos(epsilon) * Math.sin(lambda), Math.cos(lambda)) / d2r;
    var dec = Math.asin(Math.sin(epsilon) * Math.sin(lambda)) / d2r;
    return horizontalFromRaDec(date, location.latitude, location.longitude, ra, dec);
  }

  function moonPosition(date, location) {
    var d2r = Math.PI / 180;
    var jd = julianDate(date);
    var t = (jd - 2451545) / 36525;
    var lp = normalize360(218.3164477 + 481267.88123421 * t - 0.0015786 * t * t);
    var d = normalize360(297.8501921 + 445267.1114034 * t - 0.0018819 * t * t);
    var m = normalize360(357.5291092 + 35999.0502909 * t - 0.0001536 * t * t);
    var mp = normalize360(134.9633964 + 477198.8675055 * t + 0.0087414 * t * t);
    var f = normalize360(93.2720950 + 483202.0175233 * t - 0.0036539 * t * t);
    var dr = d * d2r, mr = m * d2r, mpr = mp * d2r, fr = f * d2r;
    var sl = 6.288774 * Math.sin(mpr) + 1.274027 * Math.sin(2 * dr - mpr) +
      0.658314 * Math.sin(2 * dr) + 0.213618 * Math.sin(2 * mpr) -
      0.185116 * Math.sin(mr) - 0.114332 * Math.sin(2 * fr) +
      0.058793 * Math.sin(2 * dr - 2 * mpr) + 0.057066 * Math.sin(2 * dr - mr - mpr) +
      0.053322 * Math.sin(2 * dr + mpr) + 0.045758 * Math.sin(2 * dr - mr) -
      0.040923 * Math.sin(mr - mpr) - 0.034720 * Math.sin(dr) -
      0.030383 * Math.sin(mr + mpr);
    var sb = 5.128122 * Math.sin(fr) + 0.280602 * Math.sin(mpr + fr) +
      0.277693 * Math.sin(mpr - fr) + 0.173237 * Math.sin(2 * dr - fr) +
      0.055413 * Math.sin(2 * dr - mpr + fr) + 0.046272 * Math.sin(2 * dr - mpr - fr) +
      0.032573 * Math.sin(2 * dr + fr) + 0.017198 * Math.sin(2 * mpr + fr);
    var lambda = (lp + sl) * d2r;
    var beta = sb * d2r;
    var epsilon = (23.439291 - 0.013004167 * t) * d2r;
    var ra = Math.atan2(Math.sin(lambda) * Math.cos(epsilon) - Math.tan(beta) * Math.sin(epsilon), Math.cos(lambda)) / d2r;
    var dec = Math.asin(Math.sin(beta) * Math.cos(epsilon) + Math.cos(beta) * Math.sin(epsilon) * Math.sin(lambda)) / d2r;
    return horizontalFromRaDec(date, location.latitude, location.longitude, ra, dec);
  }

  function celestialProvider(now, location) {
    var body = els.body.value;
    var date = new Date(now);
    var position = body === 'sun' ? sunPosition(date, location) : moonPosition(date, location);
    lastCelestial = {
      body: body,
      azimuthDeg: position.azimuthDeg,
      altitudeDeg: position.altitudeDeg,
      timestamp: now
    };
    setText('celestial', deg(position.azimuthDeg) + ' / ' + deg(position.altitudeDeg),
      position.altitudeDeg > 5 ? 'ok' : 'bad');
    if (position.altitudeDeg <= 0) {
      throw new Error((body === 'sun' ? 'الشمس' : 'القمر') + ' تحت الأفق الآن. اختر الجرم الظاهر أو أعد الاختبار في وقت آخر.');
    }
    return lastCelestial;
  }

  function resizeOverlay() {
    var rect = els.video.getBoundingClientRect();
    els.overlay.width = Math.max(1, Math.round(rect.width * devicePixelRatio));
    els.overlay.height = Math.max(1, Math.round(rect.height * devicePixelRatio));
    overlayCtx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  }

  function drawDetection(progress) {
    resizeOverlay();
    overlayCtx.clearRect(0, 0, els.overlay.width, els.overlay.height);
    var obs = progress && progress.frameObservation;
    if (!obs || !obs.found || !bridge || !bridge.canvas) return;
    var rect = els.video.getBoundingClientRect();
    var x = obs.x / bridge.canvas.width * rect.width;
    var y = obs.y / bridge.canvas.height * rect.height;
    var r = Math.max(14, obs.radiusPx / bridge.canvas.width * rect.width * 1.7);
    overlayCtx.strokeStyle = '#65d69a';
    overlayCtx.lineWidth = 3;
    overlayCtx.beginPath();
    overlayCtx.arc(x, y, r, 0, Math.PI * 2);
    overlayCtx.stroke();
    overlayCtx.beginPath();
    overlayCtx.moveTo(x - r - 8, y); overlayCtx.lineTo(x + r + 8, y);
    overlayCtx.moveTo(x, y - r - 8); overlayCtx.lineTo(x, y + r + 8);
    overlayCtx.stroke();
  }

  function onProgress(progress) {
    drawDetection(progress);
    var tracked = progress.trackedDetection || {};
    if (progress.phase === 'gravity-not-ready') {
      setText('status', 'ثبّت الهاتف', 'bad');
      setText('gravity', progress.gravity.reason || 'غير مستقرة', 'bad');
      return;
    }
    if (tracked.stable) {
      setText('status', 'تم تثبيت الجرم — جارٍ الحل', 'ok');
      setText('detection', Math.round((tracked.confidence || 0) * 100) + '% · ' + tracked.frameCount + ' إطار', 'ok');
    } else {
      setText('status', 'ابحث عن الجرم وثبّت الهاتف');
      setText('detection', (tracked.frameCount || 0) + ' إطارات · ' + (tracked.reason || 'detecting'));
    }
  }

  function onResult(result) {
    setText('heading', deg(result.trueCameraHeadingDeg), result.accepted ? 'ok' : 'bad');
    setText('qibla', deg(result.qibla.qiblaBearingDeg), 'ok');
    setText('deviation', deg(result.qibla.relativeQiblaAngleDeg), result.qibla.isAligned ? 'ok' : 'bad');
    setText('quality', Math.round(result.quality.overallScore * 100) + '% · ' + result.quality.grade,
      result.accepted ? 'ok' : 'bad');
    setText('gravity', Math.round((result.gravity.quality || 0) * 100) + '%', 'ok');
    setText('status', result.accepted ? 'تم قبول الرصد' : 'الرصد مرفوض', result.accepted ? 'ok' : 'bad');
    log('نتيجة التحقق الفلكي', {
      accepted: result.accepted,
      body: result.body,
      trueCameraHeadingDeg: result.trueCameraHeadingDeg,
      qiblaBearingDeg: result.qibla.qiblaBearingDeg,
      relativeQiblaAngleDeg: result.qibla.relativeQiblaAngleDeg,
      quality: result.quality.overallScore,
      reasons: result.quality.reasons
    });
  }

  function onError(error) {
    setText('status', 'خطأ: ' + error.message, 'bad');
    log('خطأ', { message: error.message, stack: error.stack || null });
  }

  async function start() {
    els.start.disabled = true;
    setText('status', 'طلب الأذونات...');
    try {
      var location = await getLocation();
      celestialProvider(Date.now(), location);
      bridge = new BridgeModule.AstronomicalObservationBridge({
        video: els.video,
        canvas: els.analysisCanvas,
        facingMode: 'environment',
        horizontalFovDeg: Number(els.fov.value) || 65,
        frameIntervalMs: 120,
        solveCooldownMs: 700,
        locationProvider: function () { return lastLocation || getLocation(); },
        celestialProvider: celestialProvider,
        onProgress: onProgress,
        onResult: onResult,
        onError: onError,
        detectorOptions: {
          minimumStableFrames: 5,
          historySize: 12,
          maximumFrameAgeMs: 1400,
          maximumCentroidSpreadPx: 14,
          edgeMarginRatio: 0.035
        }
      });
      await bridge.start();
      els.stop.disabled = false;
      setText('status', 'الكاميرا تعمل — وجّهها إلى الجرم', 'ok');
      log('بدأ اختبار الهاتف', { body: els.body.value, fov: Number(els.fov.value), secureContext: window.isSecureContext });
    } catch (error) {
      onError(error);
      els.start.disabled = false;
      if (bridge) bridge.stop();
    }
  }

  function stop() {
    if (bridge) bridge.stop();
    bridge = null;
    els.start.disabled = false;
    els.stop.disabled = true;
    overlayCtx.clearRect(0, 0, els.overlay.width, els.overlay.height);
    setText('status', 'تم إيقاف الاختبار');
    log('تم إيقاف الاختبار');
  }

  els.start.addEventListener('click', start);
  els.stop.addEventListener('click', stop);
  window.addEventListener('resize', resizeOverlay);
  window.addEventListener('pagehide', stop);

  if (!window.isSecureContext) {
    setText('status', 'يجب فتح الصفحة عبر HTTPS', 'bad');
    els.start.disabled = true;
    log('الصفحة ليست في Secure Context؛ الكاميرا والموقع لن يعملا.');
  } else {
    log('الصفحة جاهزة. ابدأ بالقمر ثم اضغط زر بدء الاختبار.');
  }
})();